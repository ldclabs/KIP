# KIP 2.0 大脑运行时 (Brain Runtime)

**[SPECIFICATION_CN.md](../SPECIFICATION_CN.md) 与[认知记忆 Profile](../profiles/CognitiveMemoryProfile-2.0_CN.md) 的规范性配套规范，版本 2.0-draft。**

记忆记录了大脑所关注、决策与观测的内容。运行执行关注的工作者（workers）、决定何时允许其行动，以及在崩溃后调和外部副作用，构成了环绕该记忆的执行机制。本配套规范为对外声明 `durable_brain_runtime`（规范 §67.4）的运行时定义了该机制，记忆接口绑定会在其支持级别旁边声明此能力；`receiver_fencing`（§4）是在其之上更进一步的能力。

规范性关键词遵循规范 §0。本文档中的任何内容均不赋予权限：持久工作者、被触发的 Watch 以及准入的派发均为运行时的能力，绝非执行行动的授权（规范 §31.3）。

## 1. 范围 (Scope)

Profile 定义了所记录的内容：Watch 条件与触发幂等性（Profile §5.11）、SleepTask（§5.9）、DecisionRecord 与 AttemptRecord（§6.4，已验证学习 §2）、Outcome Evidence（规范 §15.7）。本配套规范定义了运行时在跨重启、并发与局部故障时维持其持续运转的义务。未声明 `durable_brain_runtime` 的运行时仍可（MAY）存储和读取这些记录；但绝不能（MUST NOT）声称拥有下述保证。

## 2. 持久注意力 (Durable attention)

Watch 的运行状态为其 **WatchState** Facet：`arm_generation`、`armed_seq`、`condition_digest`、`authorization_view`、`consumed_seq` 及匹配状态。

- 重新设防（Re-arming）Watch 或更改其条件会原子地推进 `arm_generation` 并重置其覆盖区间。触发键包含代际标识 —— 增量 Watch 为 `watch_fire:<id>:<generation>:<seq>`，静默 Watch 为 `watch_fire:<id>:<generation>:silence:<due_at>` —— 以防过期的工作者触发较新的设防。
- 结构化条件选择器通过 AND 组合；`ops` 或 `touched` 中的数组匹配其中任意成员；省略的过滤器不施加任何限制。纯文本条件需要显式的大脑评估器，运行时绝不直接求值。
- 静默 Watch 在其锁定的条件与授权观测范围内覆盖 `(armed_seq, due_seq]`，且仅当（MAY）评估器持有贯穿截止时间的完整流水位线（watermark）后方可触发。经过滤的流必须（MUST）提供完整性水位线：序列空洞并非静默的证明。流截断或授权变更需要重新同步并生成新的覆盖基线，绝不能静默产生误报。
- 入站匹配、截止时间判定、执行进度与触发在系统重启后保持存续。依赖时间的基线会在其 `next_invalid_at`（规范 §21.12）调度验证工作，而无需为已过期的 Assertion 伪造变更信封（Change Envelopes）。
- 无论运行时如何调度，增量 Watch 仍需匹配的提交，静默 Watch 仍需完整的授权覆盖。

控制平面提交携带受治理的 `control_changes` 条目（规范 §36.1）。全量与过滤流消费者接收受治理的覆盖水位线及授权视图绑定；仅凭条目缺失或序列空洞不能证明静默。

## 3. 租约化工作 (Leased work)

SleepTask 的 **LeaseState** Facet 记录认证所有者、单调递增的 `fencing_token`、`expires_at` 及尝试次数。

- 获取与接管均为比较并交换（compare-and-set）事务。租约已过期或其 token 已被替换的工作者，绝不能（MUST NOT）完成任务或获得新的派发准入。
- 获得授权的就绪工作者可以（MAY）回收已过期的运行中工作。终态写入及其输出具有原子性且具备重试安全性。
- 积压预算通过检查点推迟工作；绝不能静默丢弃工作。

## 4. 外部行动 (External actions)

在执行任何外部行动之前，尝试及其派发意图必须持久化排队（规范 §62）。执行器使用 `attempt_id` 作为其外部幂等键，并在派发前夕重新检查 Governance、修订版本权限、原始修订版本选择先决条件、依赖基线（规范 §57.6）以及租约隔离围栏（lease fence）。较新的 `current_revision` 绝不能（MUST NOT）静默替换或验证已记录决策所选定的修订版本。

在崩溃发生后，执行器查询或重试**同一个**外部标识，绝不使用全新标识。若外部系统既不支持幂等性也不支持结果查询，则状态为 `outcome_unknown`，且禁止自动重新派发：依据策略进行调和或发起询问。KIP 绝不因自身的原子性而声称对外部副作用提供恰好一次（exactly-once）保证。独立的观测机制将返回的结果记录到同一个尝试项上。

**DispatchContract** 声明以下两种保证之一：

```text
admission         在运行时的原子原生派发准入处线性化
receiver_fenced   在拥有副作用的接收端确认接受处线性化
```

在 `admission` 模式下，持久许可证锁定了尝试与请求标识、资源、修订版本、围栏及过期时间。撤销可阻止后续的准入；已准入且处于在途状态的操作仍可能（MAY）完成。发送端不存在任何“最后检查”能承诺远程接收端在接管后一定会拒绝延迟到达的请求，且幂等性去重的是尝试本身，而非陈旧的权限。

`receiver_fencing` 是端到端的额外能力。实际拥有副作用的接收端在原子地完成接受与去重的同时，校验经认证的、绑定资源与请求的许可证，以及当前的隔离代际（fencing epoch）与过期时间；其注册的绑定关系与执行范围均被锁定。先检查然后转发至无隔离围栏服务的网关不能声称具备该能力。接管或代际变更唯有触达接收端的权威接受状态后，方在接收端生效。

缺少该契约的接收端仅对外声明 `admission`，且执行器保留 `outcome_unknown` 以及针对同一尝试的调和行为。两种保证均不会回滚已在其声明的线性化点被接受的副作用。

## 5. 验收 (Acceptance)

测试在原生准入之后且在接收端接受之前暂停执行，随后演练接管、撤销、延迟、重复投递与重启（REL-007）。Watch 代际、水位线与租约由 MEM-009 与有界模型 `formal/watch/check_watch.py` 锁定；[BrainEvaluation](./BrainEvaluation.md) §2 的可靠运行时关卡注入剩余故障。
