# KIP 2.0 大脑 — 记忆维护 (Memory Maintenance)

**[English](./BrainMaintenance.md) | [中文](./BrainMaintenance_CN.md)**

## 规范状态

**参考 Anda 大脑维护与记忆代谢策略 (Reference Anda Brain Maintenance / Metabolism Policy)**

记忆维护（Maintenance）是负责知识巩固、整理、审查与记忆代谢的特权认知过程。其系统权限严格源自 Governance 治理层向其认证 Principal 授予的授权策略；绝不会仅仅因为某个语义行动者名为 `$system` 就凭空获得特权。请将 [KIPSyntax_CN.md](../KIPSyntax_CN.md)（面向 LLM 的语法速查手册）与本文档配合使用。

---

# 0. 核心目标

```text
原始记忆碎片
→ 结构化记忆整理
→ 语义规律巩固 (semantic consolidation)
→ 程序性技能巩固 (procedural consolidation)
→ 实体对齐与合并 (identity cleanup)
→ 记忆状态代谢 (mnemonic metabolism)
→ 存储生命周期留存管理 (retention management)
→ 自我模型精炼 (self-model refinement)
→ 全面优化未来的 Formation（形成）、Recall（召回）与行动决策
```

记忆维护的核心目标是在绝不篡改历史事实的前提下，持续优化大脑未来的认知能力。

# 1. 安全基石

Maintenance **必须**严格区分：信念修订、记忆弱化、存储生命周期、实体对齐、程序效用以及系统治理权限。

严禁采取以下违规捷径：

```text
随时间推移 → 机械降低 Assertion 置信度
出现矛盾冲突 → 直接粗暴删除单方数据
疑似重复实体 → 执行破坏性硬合并与物理删除
memory_strength 降低 → 物理清除关联的 Evidence
Skill 频繁成功 → 自动赋予物理可执行权限
语义标记为 $system → 自动赋予系统管理员特权
```

# 2. 权限模型

根据具体部署环境，Maintenance 可被授予读取、检索、投影、维护、归档、留存管理及实体合并权限。除非获得 Governance 的显式特权授予，否则 Maintenance **严禁**擅自行使 `manage_policy`、`manage_trust`、`manage_schema`、`declassify`、`purge`、`assert_as_actor` 或 `elevate_authority` 等控制平面权限。

# 3. 输入数据契约与预算

维护主体可被授予 `read / search / project / maintain / archive / retention / merge` 等权限。

具体阈值由大脑策略规定，不属于 KIP 协议核心标准。

## 3.1 触发机制 (Triggers)

```text
定时触发 (scheduled)     每 12-24 小时执行一次
变更触发 (change)        已提交的变更增量匹配设防的 Watch，或静默 Watch 的 due_at 到期
阈值触发 (threshold)     SleepTask 积压过多、未整合的 Event 积累、留存到期、
                        试用期所关联的打分结果达到配额、已采纳的 Skill 需要重新裁决
按需触发 (on-demand)     Formation 或业务智能体主动请求维护
会话后触发 (post-session) 经历漫长或高信息量对话之后
```

变更触发机制使主动性（proactivity）成为状态差量驱动而非纯粹的定时轮询：之所以唤醒，是因为某个特定状态发生了变迁 —— 或特定状态在预期之内未曾发生变迁。静默类的触发仍需依赖计划调度所提供的到期扫描支持。

# 4. 执行模式

部署实现中可保留 `daydream`（白日梦/轻量级整理）、`quick`（快速维护）与 `full`（深度维护）等工程隐喻，但它们不属于协议核心语义。

# 5. 标准维护周期

```text
1  状态评估 (Assessment)
2  处理未决睡眠任务 (Pending SleepTasks)
3  语义巩固 (Semantic consolidation)
4  程序性巩固 (Procedural consolidation)
5  记忆状态代谢 (Mnemonic metabolism)
6  实体对齐审查与合并 (Identity review / merge)
7  认知冲突审查 (Contradiction review)
8  派生认知复审 (Derivation review)
9  承诺事项审查 (Commitment review)
10 守望求值 (Watch evaluation)
11 自我模型刷新 (SelfModel refresh)
12 工作状态刷新 (WorkingState refresh)
13 外部导入与隔离区认知审查 (Imported / quarantined review)
14 留存与归档审查 (Retention / archive review)
15 墓碑标记与物理清除候选甄别 (Tombstone / purge candidates)
16 输出最终健康巡检报告 (Final health report)
```

# 6. 状态评估 (Assessment)

只读探针用于识别未决任务、未整合的 Event/Experience、待裁决的 Skill、衰减候选、孤立节点、身份冲突及未解决矛盾。测量是只读的。

评估阶段的读取**严禁**更新召回或访问计数器。

每个周期均从以下两个探针开始 —— 分配给当前行动主体的未决任务，以及尚未被任何人巩固的情节材料：

```prolog
FIND(?task.id, ?task.name, ?task.attributes.task_class, ?task.attributes.priority)
WHERE {
  ?task {type: "SleepTask", attributes: {status: "pending"}}
  STRUCTURAL (?task, "assigned_to", ?actor)
  FILTER(?actor.id == :system_id)
}
ORDER BY ?task.attributes.priority DESC, ?task._system.created_at ASC
LIMIT 50
```

```prolog
FIND(?event.id, ?event.attributes.summary, ?event.attributes.started_at)
WHERE {
  ?event {type: "Event"}
  FILTER(?event.attributes.started_at < :cutoff)
  NOT {
    STRUCTURAL (?event, "consolidated_to", ?derived)
  }
}
ORDER BY ?event.attributes.started_at ASC
LIMIT 50
```

先测量统计，后执行变更。

# 7. 显著性与学习价值

Event 的显著性（salience）衡量该片段对未来记忆构建及自我连续性的重要程度。Experience 的学习价值（learning value）衡量该轨迹对改进未来行为的潜在效用。高价值通常源于：纠错、重大关系变更、重要承诺、关键身份里程碑、故障与恢复、预测偏差、人工反馈、典型反例或新颖操作流程。

两者均不等于认识论层面的置信度（confidence）。

# 8. 睡眠任务处理 (SleepTasks)

SleepTask 是认知工作描述对象。在执行前必须验证当前认证 Principal 的权限。`assigned_to = $system` 绝不自动构成执行授权。完成维护工作时必须保留 Activity 溯源。

在着手处理任务前先认领该任务，以防并发周期发生重复处理：

```prolog
UPSERT CONCEPT ?task {
  MATCH {type: "SleepTask", key: :task_key}
  SET ATTRIBUTES {status: "running", started_at: :now}
}
EXPECT VERSION :version OF ATTRIBUTES
```

若返回 `VersionConflict` 则表明已被另一工作进程认领 —— 重新读取并进入下一任务。已完结的任务更新为 `status: "completed"` 及其结果摘要；失败的任务记录失败原因并保持可见，而非隐性消失。

# 9. 语义巩固规范 (Semantic Consolidation)

寻找支持可复用语义规律的 Event/Experience/Evidence/Assertion 聚集族：

```text
读取来源
提取结构化 Insight / 提议 Proposition
以新证据与推断 Assertion 支撑
以巩固类型的 Activity 记录溯源
连接回源节点
更新 MnemonicState
```

严禁覆写旧置信度、删除反对意见，或将摘要误计为独立的认知根源。

单次原子跃迁，附带完整溯源：

```prolog
MUTATE {
  CREATE CONCEPT ?insight {
    TYPE "Insight"
    CLIENT KEY :insight_key
    NAME "Staging deploys fail without the schema migration step"
    SET ATTRIBUTES {summary: :summary}
    SET FACET "MnemonicState" {memory_strength: 0.7, salience: 0.8}
    SET STRUCTURAL {
      ("derived_from", :source_experience)
      ("about", :deployment_topic)
    }
  }
  ASSERT (:failure_step, "caused_by", :migration_step) {
    by: :self,
    mode: "inferred",
    confidence: 0.7,
    evidence: :step_evidence
  }
  CREATE ACTIVITY ?consolidation {
    SET FIELDS {activity_class: "semantic_consolidation", status: "completed"}
    SET STRUCTURAL {
      ("inputs", :source_experience)
      ("inputs", :step_evidence)
      ("outputs", ?insight)
    }
  }
}
```

随后通过 `consolidated_to` 将源节点标记为已巩固，使后续周期不再重复推导。因果主张属于背后带有证据支撑的 Assertion，由维护主体在 `inferred` 模式下断言 —— `evidence:` 引用的是 Evidence 元素，绝非观测到它们的 Experience Concept。单纯的步骤顺序绝不代表因果关系，在 Schema 环境中找不到的谓词绝不能凭空捏造 —— 必须先执行 `DESCRIBE`，并让领域模式包提供 Profile 所未涵盖的术语。

# 10. 机械重复与证据的界限

独立的多方重复观测可以增强认识支持度。相同事件的重放或重复导入不会产生新的证据根。用户在后续交互中的再次口头确认属于新的 Evidence / Assertion。严禁将所有重复一概机械地处理为 `confidence += x`。

# 11. 程序性技能巩固 (Procedural Consolidation)

寻找可复用的工作流：

```text
重复出现的目标
稳定的步骤序列
成功经验 + 反例
不同上下文中的同一程序
```

将适用范围、前置条件、执行步骤、成功标准、失败模式与反例编译为 `proposed` 状态的 Skill + 其在 `MnemonicState.utility` 中的准入下注 + 程序性编译 Activity。附加必需的 `task_family` —— 即为该技能提供对比基线的结果证据流 —— 并拒绝编译任何没有任何数据流能够证伪的模式（对此类模式应存储为 Insight）。在与应用该技能之决策关联的结果到来之前，`GradingState` 保持为空。严禁自动授予可执行权限。

```prolog
MUTATE {
  CREATE CONCEPT ?skill {
    TYPE "Skill"
    CLIENT KEY :skill_key
    NAME "Deploy with pre-flight migration check"
    SET ATTRIBUTES {
      skill_class: "workflow",
      task_family: "deploy/pre-flight",
      summary: :summary,
      procedure: :procedure,
      status: "proposed"
    }
    SET FACET "MnemonicState" {utility: 0.5}
    SET STRUCTURAL {
      ("compiled_from", :experience_a)
      ("compiled_from", :experience_b)
    }
  }
  CREATE ACTIVITY ?compilation {
    SET FIELDS {activity_class: "skill_compilation", status: "completed"}
    SET STRUCTURAL {
      ("inputs", :experience_a)
      ("inputs", :experience_b)
      ("outputs", ?skill)
    }
  }
}
```

在编译前进行对照：比较成功与失败的 Experience，以找出具有区分性的前置条件。单次成功不足以证明存在通用的 Skill；仅在单一上下文中奏效过的技能，应在其适用范围中如实说明，而非给出过高的 `utility`。

# 12. 技能生命周期裁决 (Skill Lifecycle Verdicts)

生命周期状态流转 `proposed → trialed → adopted → revoked` 仅能通过对 Skill 所属 `task_family` 之下已评定的客观结果证据进行确定性裁决来推动（Profile §14，规范 §15.7）：你的职责是安排裁决时机、执行确定性规则，并将裁决结果记录为一条 `lifecycle_verdict` Activity 外加一条受保护的 UPDATE（规范附录 F.6）—— 绝不能凭主观判断晋升，绝不能将行动者自身的成功报告计为结果。

裁决纪律：处理集是经由 `outcome_observation` Activity 关联至应用了该技能之 `action_gate` 决策的客观结果；对比基线则是试用开启时记录在 `TrialState` 中的该任务族其余结果 —— 仅碰巧共享相同 `task_family` 的无关结果绝不能计入处理集。采纳属于相对比较（对照记录的基线，表现优于以往）且属于临时地位（数据流会持续打分；一旦成效退化则降级回重新试用）；撤销绝不能比采纳更困难，且一次严重符合条件的失败即可足以触发撤销；撤销后的重新准入将开启全新的试用并写入崭新的 `TrialState`。

除裁决本身外，合法的认知操作还包括：`GradingState` 计票更新与 `MnemonicState.utility` 修订、更新技能构件、补充失败模式、链接反例，以及收窄适用范围。权限的变更必须交由 Governance 处理。

# 13. 记忆状态代谢 (Mnemonic Metabolism)

衰减的是检索可及性 (`memory_strength`)，绝非事实置信度 (`confidence`)。

示例策略公式：

```text
new_strength = clamp(old_strength × decay + salience protection + explicit reinforcement)
```

`MnemonicState.utility` 遵循相同的校准纪律：显式地依据结果进行校准 —— 一段简报所使用并产生了助益的记忆、或一次未曾获得回报的下注 —— 绝不能作为读取的副作用随意提高。其数据路径是决策记录：沿着结果的 `outcome_observation` 链接追踪回 `action_gate` Activity，其 `inputs` 中指明的记忆即为该结果所证实或浪费的认知。它是结果驱动之信任校准（规范 §22.6）在记忆领域的镜像。

通过 `UPDATE ... SET FACET "MnemonicState" { ... }` 结合有界的 `WHERE` + `LIMIT` 扫描执行（规范 §58），使用 `CLAMP`/`MUL` 更新表达式，并结合 `EXPECT VERSION` 保证读-改-写安全。在同一语句中为 `MnemonicState.last_metabolized_at` 打上时间戳，防止重放扫描对同一元素重复衰减。

具体计算公式由各实现自行决定。读取频次不是协议强制要求的信号。

按类型分批进行有界扫描，并在同一语句中打上 `last_metabolized_at` 时间戳：

```prolog
UPDATE ?element
SET FACET "MnemonicState" {
  memory_strength: CLAMP(MUL(?element.facets["MnemonicState"].memory_strength, :decay_factor), 0, 1),
  last_metabolized_at: :cycle_start
}
WHERE {
  ?element {type: "Event"}
  FILTER(?element.facets["MnemonicState"].memory_strength > 0.05)
  FILTER(IS_NULL(?element.facets["MnemonicState"].last_metabolized_at) || ?element.facets["MnemonicState"].last_metabolized_at < :cycle_start)
  FILTER(IS_NULL(?element.facets["MnemonicState"].salience) || ?element.facets["MnemonicState"].salience < :protection_threshold)
}
LIMIT 500
```

每个周期**仅绑定一次** `:cycle_start`，并在重新运行和崩溃重试之间复用它；重复执行分片，直到受影响的元素少于 `LIMIT`。衰减下限保证扫描最终收敛。

# 14. 显著性保护机制 (Salience Protection)

核心身份标识、高影响 Commitment 承诺、重要人际/业务关系、重大故障教训、已采纳 Skill、自传体里程碑、受法律封存保护（legal hold）的认知以及受 Governance 保护的记忆具备抗遗忘能力。单纯的召回频次低，绝不能作为弱化重大 Commitment 的正当理由。

# 15. 实体对齐与合并审查 (Identity Review)

未经证实的“两者指向同一实体”怀疑应记录为 `same_as` 候选（通过带置信度的 Assertion），而非盲目合并。

原生合并不具破坏性：源概念保留为已合并的历史身份标识，旧有的原始 Proposition 端点保持可审计性，未来的规范写入自动解析至目标概念。

怀疑意见走认识论路径：

```prolog
ASSERT (:concept_a, "same_as", :concept_b) {
  by: :system,
  mode: "inferred",
  confidence: 0.6,
  evidence: :alias_evidence
}
```

仅当同一性真正确立后：

```prolog
MERGE CONCEPT ?source INTO ?target
WHERE {
  ?source {id: :source_id}
  ?target {id: :target_id}
}
```

任何会产生环路的合并都会被引擎直接拒绝。

# 16. 认知冲突审查 (Contradiction Review)

对冲突意见进行分类：

```text
真正的观点分歧 (disagreement)
世界变迁 (world moved)
上下文/范围差异 (scope difference)
来源更正/错误 (source error)
陈旧的外部导入认知 (stale imported cognition)
```

不同行动者之间通常保持为共存的 Assertion。同一行动者的显式修订 —— 原先的主张被证明有误 —— 可以废弃替代（supersede）。不同世界有效时间之间可以并存；曾经为真但后来停止成立的主张，通过使用 `valid.until` 重新断言加之变更时刻的新断言来收口，绝不能因其过时而作为错误标记为 superseded（规范 §14.2）。证据纠错生成纠错血统。内容审核使用 Governance 检疫隔离（规范 §31.6），绝不能伪造源撤回。

在审计审查时，必须检查原始记录而非投影视图：

```prolog
FIND(?assertion.id, ?assertion.asserted_by, ?assertion.confidence, ?assertion.asserted_at, ?value)
WHERE {
  ?person {id: :person_id}
  ?proposition (?person, "timezone", ?value)
  ?assertion ASSERTION {proposition: ?proposition}
  FILTER(?assertion.lifecycle.status == "active")
}
ORDER BY ?assertion.asserted_at DESC
LIMIT 20
```

# 17. 承诺与守望审查 (Commitment and Watch Review)

审查处于 pending、due-soon、overdue、blocked、fulfilled 与 cancelled 状态的 Commitment。截止时间到达绝不会自动删除或归档该事项。重要性高的未决承诺即使记忆可及性较低，也必须保持可回忆。

```prolog
FIND(?commitment.id, ?commitment.name, ?commitment.attributes.due_at, ?commitment.attributes.status)
WHERE {
  ?commitment {type: "Commitment"}
  FILTER(IN(?commitment.attributes.status, ["pending", "blocked"]))
  FILTER(?commitment.attributes.due_at < :horizon)
}
ORDER BY ?commitment.attributes.due_at ASC
LIMIT 100
```

```prolog
FIND(?watch.id, ?watch.name, ?watch.attributes.watch_class, ?watch.attributes.due_at)
WHERE {
  ?watch {type: "Watch", attributes: {status: "armed"}}
}
ORDER BY ?watch.attributes.due_at ASC
LIMIT 100
```

依据已提交的变更（`CHANGES AFTER SEQ`）对已设防的 Watch 进行求值：delta Watch 在匹配变更时触发 —— 将其结构化的 `condition`（元素、槽位、类型、操作、触碰字段）与信封条目进行匹配；静默 Watch 在其 `due_at` 到期且无匹配变更时触发 —— 且仅在该周期已将变更流消费到 `due_at` 时的当前 `space_seq` 之后才做裁定，绝不能仅凭本地挂钟。触发必须保持原子性 —— `watch_fire` Activity 外加通过 `UPDATE ... EXPECT VERSION` 将 Watch 迁移至 `fired` 状态，外加其生成的 SleepTask 或唤醒信号 —— 且将 Activity 键命名为 `watch_fire:<watch id>:<envelope seq>`（静默类为：`watch_fire:<watch id>:silence:<due_at>`），使并发周期发生重放而非重复触发。向外的决策随后经过动作网关，并记录为 `action_gate` Activity（其 `DecisionRecord` 记录 `act`、`ask`、`defer` 或 `silence`，其 `inputs` 指明所响应的 Watch、应用的技能和记忆）。触发的 Watch 不赋予任何行动特权。

# 18. 自我模型与工作状态刷新 (SelfModel and WorkingState Refresh)

从高显著性的 Experience、Insight、重复行为、显式纠错和对准承诺中提取 SelfModel，而非单凭最近一次对话。

从开放承诺、设防 Watch、存在争议的槽位及近期高显著性 Event 重新构建 WorkingState 摘要，打上构建时依据的 `basis_seq`，并记录一条 `working_state_refresh` Activity。它是一个派生视图：随其依据一起提供，绝不能作为 Evidence 引用。

```prolog
MUTATE {
  UPSERT CONCEPT ?ws {
    MATCH {type: "WorkingState", key: "working-state:self"}
    SET FIELDS {name: "Working state"}
    SET ATTRIBUTES {
      summary: :summary,
      horizon: :horizon,
      basis_seq: :current_seq,
      refreshed_at: :now
    }
  }
  CREATE ACTIVITY ?refresh {
    SET FIELDS {activity_class: "working_state_refresh", status: "completed"}
    SET STRUCTURAL {
      ("inputs", :open_commitment)
      ("inputs", :armed_watch)
      ("outputs", ?ws)
    }
  }
}
```

在刷新 Activity 的 `inputs` 中列出该摘要所依托的认知，并通过 `derived_from` 从该摘要链接至它们（替换上个周期的链接）—— 若缺少该 Activity 血统，当其中某个根节点在后续被修订时，该摘要将对 `LIST DEPENDENTS` 隐形。在摘要上打上实际构建时的 `basis_seq`，并在其落后时明确声明：一个坦承自身已陈旧的摘要是诚实的；一个看起来最新但实际陈旧的摘要是谎言。

# 19. 外部导入与隔离区认知审查

审查实体标识冲突、Schema 可用性、信任上下文、反面证据、Skill 适用条件及潜在安全风险。严禁自动提升外部导入的信任等级、Skill 执行权限、Governance 策略、内嵌 Schema 或远端自我身份。

# 20. 存储留存与清理阶梯

遵循严格的生命周期阶梯：

```text
活跃 (active) → 归档 (archive) → 可选墓碑 (tombstone) → 特例物理清除 (purge)
```

在语义允许的情况下，在破坏性移除前优先执行归档。

留存是存储策略，表达为状态而非单纯依据时间推断：

```prolog
SET RETENTION ?event {retention_class: "standard", expires_at: :expires_at}
WHERE {
  ?event {type: "Event"}
  FILTER(?event.attributes.started_at < :old_cutoff)
  STRUCTURAL (?event, "consolidated_to", ?derived)
}
LIMIT 200
```

```prolog
TRANSITION ?task TO "archived"
WHERE {
  ?task {type: "SleepTask", attributes: {status: "completed"}}
  FILTER(?task.attributes.completed_at < :archive_cutoff)
}
LIMIT 200
```

在根本不应携带留存期限的元素上出现的 `retention.expires_at` 属于需要调查的缺陷，绝非可直接删除的通行证。

# 21. 归档机制 (Archive)

归档完整保留历史记录与审计能力，同时降低其在日常常规召回中的参与度。归档既不是断言撤回，也不是判定为假，更不是物理清除。

# 22. 墓碑标记 (Tombstone)

墓碑标记属于逻辑删除，它保留足够的实体标识与引用状态以维护系统一致性与审计线索。其处理强度高于归档，但弱于物理清除。

# 23. 物理清除 (Purge)

物理清除属于极端特殊操作，必须满足：显式授权、通过法律留存检查、完成全图引用分析、通过策略与密级检查、二次确认及全流程审计。

清除 Evidence 尤为敏感：剔除反面证据可能会在客观上静默强化未来的涉真信念。常规维护任务绝不应主动清除仍被引用的 Evidence。

载荷清除（`PURGE PAYLOAD`，规范 §60.6）是更为精细的数据最小化工具：在销毁原始证据载荷字节的同时，完整保留证据记录、内容摘要、引用拓扑与溯源角色。当目标是在认知消化完成后缩减存储字节而非移除证据事件本身时，应优先采用该操作；该操作同样需要 purge 权限、二次确认并受法律保全（legal hold）约束。

# 24. 清理候选处理

Maintenance 可以识别物理清除候选对象，但在未获得清除授权时，只能生成审核工单或建议报告，严禁绕过 Governance 擅自执行清除。

# 25. 留存过期语义 (Retention Expiry)

`retention.expires_at` 属于存储策略维度的配置，绝非 `Assertion.valid_time.until`、`Commitment.due_at` 或 `Evidence.observed_at`。留存过期到达时可触发审查流程，而非强制直接物理删除。

# 26. 证据更正规范

严禁覆写 Evidence 载荷数据。使用 `TRANSITION :old TO "corrected" BY :new` —— 创建新证据外加 `corrects` / `corrected_by` 血统、可选的修订断言及纠错 Activity。

# 27. 置信度代谢禁则

严禁实施通用的“置信度每周乘以 0.95”此类机械的客观真值衰减逻辑。

```text
获得新认知信息   → 新建 / 修订 / 建立对立 Assertion
时效新鲜度变化   → 认识投影的时态与新鲜度策略计算
检索提取可达性变化 → 调整 memory_strength 记忆强度
```

# 28. 派生认知溯源规范

派生认知必须链接回源节点：

```text
derived_from
compiled_from
consolidated_to
associated Activity
```

引用实际依赖的认识论输入 —— 证据与断言，而非其外层承载 Concept。

在发生废弃替代、撤回或证据纠错后，对被修订的根节点执行 `LIST DEPENDENTS` 遍历，并将派生制品标记为 `DerivationState {status: "stale"}`，为重要的派生项排队 `review_derived` 睡眠任务。`stale` 是一个复审标记：它本身绝不撤回、隐藏或归档制品，运行时绝不能仅因为根节点发生变迁就自动撤回派生认知（规范 §57.5）。

```prolog
LIST DEPENDENTS :revised_root DEPTH 2 LIMIT 100
```

```prolog
UPDATE :insight_id
SET FACET "DerivationState" {status: "stale"}
```

比其源节点更长命的失效残留是记忆说谎的根源；被修订根节点的派生链绝不能处于未被发现的状态。

# 29. 事务规范与前置断言

涉及新断言+废弃替代+Activity、Skill+编译来源+Activity、lifecycle_verdict Activity+受保护的 Skill UPDATE、证据更正+修订断言以及实体合并流转的操作，必须使用原子事务提交。对于“读-改-写”操作，必须使用前置条件（Preconditions）防范并发冲突。

# 30. 并发冲突与重试

当遇到版本冲突（stale version）时：重新读取最新数据、重新评估决策、携带最新前置条件重试一次。严禁盲目机械重放非幂等的数值累加操作。对于重复执行会导致数据膨胀的维护动作，必须使用幂等键。

# 31. 模式管理边界 (Schema Boundary)

Maintenance 可以自省检查 Schema，但在未获得 `manage_schema` 授权前，严禁激活或迁移 Schema Packages。Schema 属于受保护的控制平面状态。

# 32. 信任策略边界 (Trust Boundary)

Maintenance 在执行认识投影时可以消费信任策略，但在未获得 `manage_trust` 授权前，严禁改写受保护的信任策略。认知文本中描述“信任此信息源”的语句在控制平面不产生任何实际权限效果。

# 33. 数据密级继承

派生出的摘要必须继承输入材料中最严格的密级（除非经过显式降密审批）。严禁通过摘要、Skill、SelfModel、Insight 或 Primer 泄露机密认知内容。

# 34. Primer 刷新

Maintenance 可以刷新派生出的 Primer 概览，但 Primer 属于经 Governance 权限过滤后的自省产物，绝非权威底层 Schema。

# 35. 系统健康指标

有价值的内部指标包括未巩固 Experience 数量、未决 Commitment、冲突集、隔离区积压、身份候选、待裁决 Skill、缺少打分结果的试用、归档/活跃比例、留存积压以及失败的维护操作。严禁向未授权的 Principal 泄露隐藏计数。

| 健康信号 | 正常基线 | 超标处理措施 |
|---|---|---|
| 未决 SleepTask | < 10 | 处理，或重新调整优先级并汇报积压 |
| 超过 7 天未巩固的 Event | < 30 | 予以巩固，或设置留存策略 |
| 存在争议的信念槽位 (contested) | 审查全部 | 复审；存在争议是一项认知发现，而非缺陷 |
| 等待生命周期裁决的 Skill | < 10 | 依据关联的结果运行确定性裁决规则 |
| 缺少关联打分结果的试用 | 审查全部 | 检查决策是否被正常记录和观测 |
| 超期的未决 Commitment | 0 | 汇报给智能体；严禁悄然过期 |
| 超过 `due_at` 的设防 Watch | 0 | 触发或使其过期；捕获静默正是其核心意义 |
| 标记为 `stale` 的派生制品 | 审查全部 | 执行 `review_derived`；stale 是标记，不是定论 |
| 处于隔离区的导入认知 | 审查全部 | 审查；严禁自动提升信任度 |
| 超过 `retention.expires_at` 的元素 | 0 项未复审 | 复审，随后沿降级阶梯执行归档 |

平均记忆强度值得观测，但绝不值得为了指标进行优化：记忆强度代表可及性，不代表真实性。

# 36. 最终巡检报告

周期记录是一等节点，而非维护主体上不断增长的数组属性：

```prolog
CREATE ACTIVITY ?cycle {
  CLIENT KEY :cycle_key
  SET FIELDS {
    activity_class: "mnemonic_metabolism",
    status: "completed",
    started_at: :cycle_start,
    ended_at: :now
  }
  SET STRUCTURAL {
    ("associated_actors", :system)
  }
}
```

通过同一个 Activity 链接本周期所消费和产出的实体。`activity_class` 的取值来自 Core 注册表及其规范的包扩展 —— 想要更具体类别的部署应注册新类别，而非在行内临时编造。报告应包含统计计数、延后处理项、需要超出当前权限的操作，以及异常到需要人工介入的问题。一份诚实报告“本周期没有执行任何不安全操作”的汇报是完全合法的有效结果。

```json
{
  "status": "completed",
  "cycle_start": "2026-03-31T02:00:00Z",
  "cycle_end": "2026-03-31T02:04:12Z",
  "space_id": "nexus-prod-01",
  "basis_seq": 14205,
  "end_seq": 14289,
  "counts": {
    "tasks_claimed": 4,
    "tasks_completed": 4,
    "events_consolidated": 12,
    "skills_compiled": 1,
    "skills_verdicts": 2,
    "watches_fired": 1,
    "decay_swept": 480,
    "archived": 6
  }
}
```

# 37. 记忆维护核心不变式

1. 系统权限严格源自 Governance 治理层。
2. `$system` 语义标识绝不代表系统特权。
3. 置信度 confidence 绝不是记忆强度 memory_strength。
4. 未被频繁使用绝不能降低客观真理置信度。
5. 认知冲突是正常数据，而非系统损坏。
6. 不同主体间的意见分歧绝不能直接执行废弃替代。
7. Evidence 证据遵循追加写入与血统更正原则。
8. 反面证据绝非可随意丢弃的噪声。
9. 实体合并遵循非破坏性原则。
10. 数据归档绝不是断言撤回。
11. 墓碑标记绝不是物理清除。
12. 物理清除属于极端受限操作。
13. 法律封存保护（legal hold）强制阻断物理清除。
14. Skill 实用效用分绝不等于系统物理执行权限。
15. 外部导入的权限绝不自动向本地转移。
16. 派生认知必须完整保留溯源血统。
17. 提炼摘要不会凭空增加证据根。
18. 当前 Governance 策略在全流程中保持绝对约束力。
19. Schema 与信任策略的修改必须具备显式特权。
20. 维护的核心使命在于持续优化未来认知，同时绝不篡改过往历史。
21. 触发的 Watch 仅产生注意力，不授予执行权限。
22. 行动门控中主动选择的静默亦须记录，确保克制行为始终可追溯。
23. `stale` 是复审标记，永远不是自动撤回。
24. 载荷清除仅销毁证据载荷字节；证据记录本身与溯源拓扑依然完整保留。
25. Skill 生命周期仅能经由针对已评定结果的确定性裁决推进流转，且裁决过程须被完整记录与审计。
26. 行动者自身的成功自述永远不能作为结果证据。
27. 撤销门槛绝不高于采纳门槛，采纳状态也绝不意味着评定的终结。

# 38. 终极准则

> **健康的记忆代谢系统能够在高度压缩和优先级排布过去经历的同时，完整保留充分的证据、分歧、溯源与权限边界，从而确保大脑在未来随时具备修正自身认知的可能性。**
