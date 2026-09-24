# KIP 2.0 记忆接口 (Memory Interface)

**[English](./KIP-2.0-Memory-Interface.md) | [中文](./KIP-2.0-Memory-Interface_CN.md)**

**规范性可选绑定，2.0-草案。** 本文档定义了业务智能体（Business Agent）与大脑模块（Brain Module）之间的精简接口。Brain 使用 KQL/KML/META 操作认知中枢（Cognitive Nexus）。不添加任何新的 KIP 命令关键字、Core 类型或 Schema 实体。线协议形态位于 `schemas/kip-memory.schema.json`；验收场景位于 `conformance/KIP-2.0-Memory-Interface-Tests.md`。

## 1. 两种接口，统一状态契约 (Two Interfaces, one state contract)

```text
Business Agent      observe / recall / revise / feedback / forget
                          ↕ Memory Interface
Brain Module        任务解释、形成、检索与策略 (task interpretation, formation, retrieval and policy)
                          ↕ KIP: KQL / KML / META
Cognitive Nexus     受治理、可归因、可纠错的持久状态 (governed, attributable, correctable durable state)
```

Brain 可以嵌入在执行动作的智能体中、使用专职模型实现、或将确定性代码与选择性模型调用相结合。这些都是在同一接口下的适配器（Adapter）。绑定**必须**保留 Core 及其支持级别所指名的每一项契约；使用更小规模的接口绝不能削弱这些契约。

下方的五种意图采用统一的请求结构，每个请求对应一个意图。原生 KIP 独立地保留供经授权的工具使用；记忆接口请求不是命令文本，**严禁**发送至 KQL/KML 解析器。仅实现 Nexus 本身并不意味着实现了此绑定。

## 2. 级别 (Levels)

级别注册表为 `profiles/memory-bundles.json`。每个级别指明其所运行的 Nexus 一致性级别（规范 §89）以及其增加的能力（规范 §67.4）。级别是命名的职责组合，而非新的 Schema 包。

| 级别 (Level) | 所需行为 | 运行于 | 依赖项 |
| --- | --- | --- | --- |
| `memory_basic` | 全部五种意图；源优先准入、`kip:memory-default` 下的终态信念、单次写入的现实世界变迁、录入错误修复途径、限定范围的召回、注意力召回、受治理遗忘与进度屏障 | 激活了 `kip://profiles/cognitive-memory@2.0.0` 的 KIP-Core | — |
| `memory_experience` | 事件/经验重建，以及不可变、显式未证实的程序性候选 | KIP-CognitiveMemory | memory_basic |
| `memory_learning` | 仪器化的独立尝试、可比试验、可重放评估与经过验证的资格地位（[已验证学习](./brain/KIP-2.0-Validated-Learning_CN.md)） | KIP-CognitiveMemory | memory_experience |

部署**必须**具有可传递性地公布级别依赖。未公布级别的操作报错 `UnsupportedCapability`；可用的类型名称绝不意味着已实现其生命周期或工作进程行为。基础实现**可以**仅使用其所需的领域与记忆符号，且**严禁**接受不受支持的程序性变更、声称实现经过验证的学习、或为未实现的通道捏造空覆盖范围。

重启安全的前提关注、租约与调度分发（[大脑运行时](./brain/KIP-2.0-Brain-Runtime_CN.md)）以及受治理的胶囊交换不是级别：绑定会在其支持级别旁边公布 Nexus 能力 `durable_brain_runtime`、`receiver_fencing`、`capsule_export` 与 `capsule_import`（规范 §67.4），并精确声明这些能力所定义的保证。

`memory_basic` 不需要试验、不需要评分，也不需要持久工作者：普通事实、偏好与召回的失败经验无需它们即可成为记忆。但它确实需要标准记忆包：`prefers`、Commitment 与 Watch 为其符号，因此该级别运行于激活了 `cognitive-memory@2.0.0` 的 KIP-Core Nexus 上，无需 KIP-CognitiveMemory 级别的依赖有效性与计算强度引擎特性。依赖有效性（规范 §57.6）约束 Brain 写入的任何派生制品；不写入派生制品的 Brain 无需 DependencyBasis。程序性候选在 `memory_experience` 下可以（MAY）作为未证实内容为深思熟虑提供参考；只有 `memory_learning` 才能赋予经过验证的资格地位，且消费者在读取所声称的地位时**必须**依然校验保留的评估记录。完整的 `KIP-CognitiveMemory` Profile 依然是标准契约；较窄的级别不声称支持该 Profile，且存储的符号引用保留其血统。

声明支持 `memory_interface` 的部署在其常规连接建立过程中暴露该绑定的传输协议。其描述符（descriptor）指明绑定版本（`kip_memory`）、可用级别、安全的默认 Space 与范围、支持的分词器以及默认的输出与截止时间预算；它可以（MAY）包含在 `DESCRIBE PRIMER` 的扩展数据中。裸 Nexus **严禁**公布其所连接的 Brain 实际上无法提供服务的绑定或级别。能力可用性绝不等于读取或变更任何对象的权限。

## 3. 请求与范围 (Request and scope)

`kip_memory` 是绑定的传输协议版本。该绑定的草案修订版本通过 `schemas/kip-memory.schema.json` 的摘要来识别，而非使用带日期的契约名称（规范 Status 章节）。

可选的 `requires` 列表指明此请求所需的级别。适配器在摄入或变更前检查所有级别；未知/不可用的要求报错 `UnsupportedCapability`。省略该列表则使用 `memory_basic`，而非猜测的高级能力。此项检查绝不替代逐项操作的 Governance 治理。

```json
{
  "kip_memory": "2.0",
  "operation": "observe",
  "scope": {"task_ref": "task-9"},
  "idempotency_key": "observe:source-77",
  "input": {"source_ref": "source-77"}
}
```

运行时认证与经授权的 Space 解析遵循 Core 规则。仅当连接具备安全默认值时，`space` 才是可选的。`scope.task_ref` 是已存在的经授权任务/上下文句柄；`context_refs` 是确切引用。适配器将其解析为 ProjectionBasis 的规范上下文集。任务标签、主题字符串和消息内容无法自行选择归属或权限。未知/模糊的范围报错或显式延期处理，绝不能静默拓宽。任务范围内的观测在抽取与巩固过程中保持范围限定；单次任务的指令不会自动提升为持久的全局偏好。

`source_ref` 命名宿主已捕获的不可变源：消息、工具轨迹、证据或暂存源工件。宿主提供其确切字节、源标识和摘要。模型引用该句柄，而非重新誊写载荷。它不是 URL 或凭证。缺失的源按存在中立（existence-neutrally）原则报错；捏造源角色、观察者身份和 `outcome` 密级分类绝不能绕过 Governance。

变更请求需要幂等键。适配器/SDK 应当从逻辑输入标识生成并保留该键；模型无需编造重试元数据。范围包括已认证的命名空间、Space 和意图。语义摘要涵盖意图、已解析范围和输入（包括不可变源标识/摘要）；排除传输层 `request_id` 和响应预算。相同的键和相同的含义重放原始确认信息，而不重新执行抽取或重新将工作加入队列。不同的含义报错 `IdempotencyConflict`。重试绝不是新证据。重放使用保留的输入标识/捕获摘要并重新检查当前访问权限；**严禁**要求已捕获的暂存句柄保持活跃。更改后的输入或冲突的源摘要仍然报错。过期的幂等性保留期使用 Core 恢复规则显式汇报，绝不能视为全新观测。

## 4. 五种意图 (Five intents)

| 意图 (Intent) | 输入 (Input) | 效果 (Effect) |
| --- | --- | --- |
| `observe` | source_ref | 捕获并解析源数据，准入有用记忆，或显式保留/延期/跳过 |
| `recall` | query 或 target_ref；可选 mode、context、after 与预算 | 读取受限的任务简报，展开早期结果的证据，或提取注意力事项 |
| `revise` | source_ref；可选 target_ref 与 change_kind | 使用新 Assertion 和适当区间记录更正、现实世界变迁或录入修复 |
| `feedback` | source_ref；可选 decision_ref/attempt_ref | 保留带有实际来源的反馈；它不会自动成为评级 |
| `forget` | target_ref 以及 mode `payload_only` 或 `semantic` | 执行有界、受治理的 ErasurePlan 并报告实际覆盖范围 |

**recall.** `mode` 为 `answer`（默认）、`action`、`resume` 或 `attention`。

- `resume` 限定于当前任务范围：全局 WorkingState 在所请求的范围内进行过滤或重建，绝不作为另一个任务的工作上下文提供；且恢复简报必须（MUST）包含自该任务上次注意力游标以来在该范围内引发的注意力事项。
- `attention` 返回 Brain 引发的注意力 —— 触发的 Watch（`watch_fired`）与到期的承诺（`commitment_due`），作为 `AttentionItem` 返回 —— 位于请求的 `attention_cursor` 之后，并附带新游标。每个条目均由某次提交引发：`watch_fire` Activity，或记录承诺到期的 `commitment_review` Activity —— 它按承诺与到期时间设键，因此同一到期时间只会引发一次（Profile §5.7、§17）；条目的 `raised_seq` 即为该提交的 `space_seq`。条目按 `(raised_seq, ref)` 顺序投递，游标标记最后投递的条目：一次提交可以引发多个条目，因此一页可能止于某个 `raised_seq` 的中间，下一页从该条目之后继续，而绝不跳过整个序号。游标绝不越过其所在页未返回的条目，空页返回所给的原游标。到期时间的流逝本身不会引发任何事项。主动记忆正是通过此机制在无需推送通道的情况下触达业务智能体；部署环境可以（MAY）额外通过其通告的推送传输协议投递相同条目。注意力召回是只读的：宿主持有游标，且消费条目不会改变记忆中的任何状态。**注意力条目不赋予任何权限**（Profile §5.11）；对其采取行动与任何其他行动一样，必须通过行动网关与 Governance 治理。
- `input.context` 是调用方提供的瞬态情境，绝非隐式写入。`detail: "evidence"` 在当前 Governance 治理下展开目标；它不是第六种意图，也不修改任何状态。
- `input.time` 将 `valid_at`（现实世界时间）与 `as_of_seq`（保留的认知历史）分离。历史读取需要底层能力与保留的历史控制状态支持（规范 §48.6）；不受支持的请求显式报错。比显式固定的 `as_of_seq` 更晚的 `after` 屏障报错 `PreconditionFailed`，而非无限等待或静默推进快照。

**revise.** `change_kind` 指明源数据所描述的是三类历史中的哪一种（规范 §14.2）：

```text
correction     行动者早先的主张有误           → 由同一行动者进行废弃替代 (supersession)
world_change   现实世界发生了变迁             → 一条从变迁起算的新 Assertion；
                                               时间继承在此处终结旧主张（§25.4）
misrecorded    Brain 记下了行动者从未说过的话 → 录入修复 (§57.8)
unspecified    由适配器决定并披露其选择；绝不基于猜测进行废弃替代
```

`change_kind` 表达意图，而非废弃替代另一行动者的权限。对于 `misrecorded`，其 Nexus 通告了 `recording_repair` 的 Brain 必须（MUST）使用它；未通告的 Brain 绝不能（MUST NOT）将请求映射为 `correction` 或 `world_change` —— 那将伪造行动者的撤回 —— 而是报错 `UnsupportedCapability`，或在部署环境授予了 `quarantine` 权限时将抽取结果置于隔离区并返回 `partial` 带有相应披露。

对于 `correction` 与 `world_change`，新断言从 `source_ref` 所描述的主张取得 `asserted_at`（规范 §13.2）：即来源的观测时间或来源本身记载的时刻，绝不是形成过程运行的时间。对于行动者当场作出的陈述，这就是宿主捕获它的时刻。接受无已捕获来源之修订的宿主 API 应把该请求本身捕获为来源；在该请求中作出的主张取请求的捕获时间，与规范附录 F.2 中的现在时陈述一致。

对于 `misrecorded`，替换断言应从被修复抽取结果所依据的不可变原始来源恢复原始主张的 `asserted_at`（规范 §57.8）。报告录入错误的请求可以是新捕获的，但其时间不是替换断言的主张时间。修复旧的抽取结果绝不会使其成为继承替代较晚陈述的新主张。

不明确的行动者、目标、上下文或主张／变更时间保持显式：适配器保留 Evidence 并汇报缺失，而非凭空编造精确的修订；未知的变更时间写入为时间界限，绝不捏造具体时刻（规范 §25.5）。对于行动者仅更正数值的情况，适配器依据规范 §14.2 显式保留被更正的现实世界有效区间；`asserted_at` 保持为更正时间，而非原始陈述时间。每一次连贯的修订都是原子性的。

**feedback.** 自我陈述记录为 `agent_statement`，人类反馈记录为具备归属的 Evidence。只有具备所需决策、尝试与观测器绑定的经授权观测仪器才能写入可评级的结果（已验证学习 §3）。反馈本身绝不会提升 Skill，普通描述性反馈无需学习级别。

**forget.** 遗忘操作运行 ErasurePlan（规范 §60.7）。目标是确切、有界的选择句柄或元素引用，绝非模型生成的命令文本。该计划重新检查范围、留置（holds）、权限与并发副本。确认（acknowledgement）不代表完成擦除：挂起、部分或受阻的覆盖范围保持可见，且仅在所有范围内的受控表面经过验证后才返回 `completed`。先前的外部导出不在本地保障范围内。策略所需的审批通过现有 Governance 处理（§29.11）；绑定不授予额外权限，且在单智能体预设（规范 §30.5）下，`semantic` 遗忘由所有者决定。

## 5. 处理回执与读取屏障 (Processing receipt and read barrier)

成功的摄入在返回不透明的 `receipt_ref` 之前，持久记录其源与意图，以及其结果或挂起的工作。不可变的确认信息包含意图、Space 和 `accepted_seq`。它与 KIP 事务收据（Transaction Receipt）不同：一个记忆意图可能（MAY）在后续产生多个事务。具有相同键的重放返回原始确认；当前进度是独立识别的读取视图，绝不是重写的事务结果，因此在工作完成后，摄入重放可以（MAY）重复其原始确认，而带有 `after` 的 `recall` 则读取当前进度。

准入与保留检查先于持久源捕获。当策略要求跳过源字节时，适配器仅保留允许的非内容摄入与处置数据；**严禁**（MUST NOT）为了签发回执而先存储机密内容。无效应的跳过可以（MAY）使用当前 Space 序列号，而无需分配认知提交。被拒绝的摄入不绑定幂等键，也不伪造捕获。

进度分为四个阶段：

| 阶段 (Phase) | 含义 |
| --- | --- |
| `recorded` | 摄入已持久化；语义处理可能仍处于挂起或延期状态 |
| `processed` | 所有准入的输入均具有最终处置结果；`resolved_seq` 锚定已完成的形成效应 |
| `available` | 召回可以通过对齐的索引或确切/源回退，在 `available_seq` 包含这些效应与省略项 |
| `failed` | 处理无法完成；原因显式说明，绝不汇报为成功记忆 |

处理完成的处置结果包括 `formed`、`evidence_only` 或 `skipped`；`erased` 仅用于已完成的 `forget`。`evidence_only` 与 `skipped` 是诚实的最终结果，不是对学到知识的主张。延期的工作保持为 `recorded`。失败可能（MAY）会留下持久源材料，若已提交，则绝不能描述为已回滚。摄入重试不会重新启动失败的工作；新的显式处理尝试保留相同的源标识并拥有自己的审计操作。

对于每个回执，若存在，则满足 `accepted_seq <= resolved_seq <= available_seq`。进度阶段是单调递增的，除非 `recorded` 或 `processed` 操作发生失败。`available` 记录的是已完成的处理界限（horizon），而非永久真实性、保留期、权限或索引新鲜度。后续的更正与擦除不会因为旧回执曾经 `available` 而复活数据。每次召回仍需检查其当前的 ProjectionBasis、依赖关系与 Governance。

对于变更响应，`succeeded` 要求（REQUIRES）进度达到 `available`；`recorded` 或 `processed` 工作返回 `pending` 或 `partial`，最终的处理失败返回带有其错误的 `failed`。对于 `forget`，`succeeded` 额外要求（REQUIRES）完成擦除并具有 `erased` 处置结果。对于 `recall`，`succeeded` 要求（REQUIRES）完整的声明覆盖范围以及满足所有 `after` 屏障；不完整的结果为 `pending` 或 `partial` 且 `action_eligible: false`。没有任何状态本身意味着信念已被接受或外部操作已获得授权。

```json
{
  "kip_memory": "2.0",
  "operation": "recall",
  "scope": {"task_ref": "task-9"},
  "budget": {"max_output_tokens": 1200, "deadline_ms": 3000},
  "input": {
    "query": "Continue the deployment; what changed since my last observation?",
    "mode": "action",
    "after": ["receipt-77"]
  }
}
```

`after` 是处理屏障，而非要求返回旧快照。每一个指定的回执都必须（MUST）经过授权、来自同一个 Space、并且已被核算。成功的屏障要求（REQUIRES）进度达到 `available`，且召回基准至少与其 `available_seq` 一样新；适配器还会额外检查所请求的范围以及所有当前基准依赖项。源处理、索引新鲜度与查询完备性是独立的职责：仅靠索引对齐并不意味着抽取已执行，且 `evidence_only` 或 `skipped` 处置结果满足处理核算，但不满足语义覆盖。仅证据（Evidence-only）结果仍可检索，并披露其未解析的含义。当未解析的源材料可能改变任务关键回答时，适配器披露该差距并将受影响的通道或前置条件标记为不完整；绝不能（MUST NOT）将较旧的结构化事实作为无保留的当前答案呈现。与显式纠错请求相冲突的策略跳过予以解释，绝不能掩盖为成功的学习。

在截止时间到达时，挂起的输入产生 `pending` 或 `partial`、显式的未解析回执引用以及 `action_eligible: false`；失败的输入产生带有原因的 `failed` 或 `partial` 结果。缺失、过期或不可访问的进度无法满足屏障（使用 `NotFoundOrNotVisible` 或 `ArtifactUnavailable`，且不得隐藏计数）。只有在实际处理具有最终处置结果且召回能够包含它之后，回退方案才可以（MAY）满足屏障；单纯的原始源可用性绝不能替代未执行的抽取。召回本身不执行任何认知变更：工作进程独立推进，召回可以等待、检查或返回 `pending`。

### 5.1 源顺序 (Source order)

由宿主捕获的 **SourceOrder** 标识源数据流与事件、稳定的序数以及显式的前驱处理回执。这些是传输层的证明，绝非从载荷文本或工作进程完成时间推断出的定序主张。在必需的前驱项具有终态处置结果之前，绝不能（MUST NOT）形成修订版本；失败或延期的前驱项保持为可见的阻塞项。独立的流可以（MAY）并发推进，且序数并不主张缺失的前驱项已完成。迟到的历史观测保留其现实世界时间，绝不会仅仅因为其处理在更晚时间提交就覆盖当前取值 —— 时间继承依据其起始时刻而非提交顺序对取值进行排序（规范 §25.4）。因此适配器在从捕获的源写入所形成的每一条 Assertion 时，必须将 `asserted_at` 设置为源的观测时间（规范 §13.2），绝不能设置为形成执行的时间：否则较晚处理的源会获得今天的起始键并终结当前取值。

形成过程可以通过每流持久队列或经过验证的可交换修订调和器来实现；无论哪种方式，相同的具因果时序更正都会在任意工作进程完成顺序下收敛（包括重试与重启）。会话适配器保留未完成回执集合并自动提供 `recall.after`（`@ldclabs/kip-lang` 中的 `MemorySession` 辅助工具）；绝不能用最大序列号替代未完成的早期回执。

## 6. 紧凑召回与可展开证据 (Compact recall with expandable evidence)

绑定返回摘要（summary）、类型化条目（typed items）、覆盖范围（coverage）以及不透明的 `basis_ref`。每个对真实性敏感的条目均携带在所披露策略下（默认为 `kip:memory-default`，规范 §21.13）的最终认识状态；原始源材料标记为 `source`，绝不静默呈现为已接受的知识。每个条目都拥有不可变的结果引用与证据引用。引用展开读取产生该条目的版本与基准，受当前 Governance 与保留期约束；绝不静默替换为更新的版本。未知项和重要警告在紧凑结果中呈现，而不隐藏在展开句柄之后。

流程条目还会披露资格地位 —— `unproven`（未证实）、`validated`（经证实）、`revoked`（已撤销）或 `unverifiable`（不可验证）（Profile §14） —— 且其结果引用锚定确切的 SkillRevision 及所使用的任何评估。行动网关解析并重新检查该版本，绝不替换为较晚的 `current_revision`。经过验证的地位仅在学习级别下提供，且仍不授予执行权限。

适配器在 `basis_ref` 之后保留实际的逐通道 RecallPlan（Profile §20.2）、完整 ProjectionBasis、依赖决策与 RecallCoverage；`detail: "evidence"` 以规范形态返回它们。这改变的是面向模型的视图，而非底层的 KQL 线协议契约。引用不赋予访问权限，过期的审计材料汇报为不可用。当 Nexus 维护了曝光日志时（规范 §66.8），适配器为其返回的条目记录 `retrieved`。

`continuation_ref` 用作召回 `target_ref` 以继续相同的查询与基准。当无法保持该遍历时，更改其范围、查询或所需的 `after` 界限将报错 `CursorMismatch`；此时应启动新的召回，而非混合来自不同基准的页面。当前的鉴权在每次展开与分页时依然适用。

覆盖范围说明通道 `constraints`、`commitments`、`dependencies`、`failures`、`experiences`、`skills` 与 `evidence`，每一项的状态为 `complete`、`incomplete` 或 `not_applicable`。`not_applicable` 要求（REQUIRES）权威判定该通道在此范围内无关或不存在；缺少支持或不完整的遍历绝不能（MUST NOT）重新标记为 `not_applicable`，且通道无法提供服务的保留内容会导致覆盖范围不完整。未公布某个级别本身不能证明对应通道不存在：已有 Space、原始 KIP 工具或 Capsule 导入可能留有相关内容。基础部署也仅能在权威判定作用域内缺失或无关后方可将该通道汇报为 `not_applicable`；若无法提供相关的保留内容，该通道为 `incomplete`。这些保证针对的是经授权的已记录全集，绝非声称已检索了整个世界。

关键的适用约束和警告优先于普通的相似度。被截断的必需通道、未满足的屏障或未验证的必要前置条件会阻止自动应用。`action_eligible` 描述的是记忆充分性，绝非执行授权。只读暴露绝不强化置信度、强度或效用。所请求的预算受限，未满足的覆盖范围显式返回，而非为了迎合简短回答而予以隐藏。

`max_output_tokens` 使用公布的分词器（或显式支持的所请求分词器）限制序列化后的面向模型的成功结果，元数据与正文一同计入。如果连强制性的诊断与覆盖范围都无法容纳，适配器返回受限的 `ResultLimitExceeded` 诊断信息；绝不能丢弃警告或将字节/字符计数当作 Token 计数。错误信息可以（MAY）超出极度微小的内容预算。描述符公布默认值和最小有用响应大小；展开操作拥有自己的预算。

## 7. 职责与事实的使用 (Responsibility and use of facts)

模型选择语义意图、所使用的真实证据和未解析的歧义。适配器生成机械摘要、捕获真实读取锚定、保留幂等键、处理分页并管理工作进程与回执状态。适配器**严禁**（MUST NOT）捏造模型使用了哪些证据、重新标记过时输入的时间戳、或填充缺失的数值置信度、显著性或效用；提供的估计值保持归属，普通记忆在无需猜测分数的情况下即可准入。

经授权的事实记忆可以（MAY）在其允许的目的和范围内为决策提供参考；仅仅因为计划使用了该事实，不需要对其进行程序性提升。指令采纳和外部执行仍受到独立控制：Core §31.3 权限等级指定了允许的用途和可强制执行的操作检查，并不声称 Nexus 能够证明暴露的 Token 对模型不存在任何内部影响。自我模型内容绝不能成为策略或权限。

## 8. 一致性 (Conformance)

原生 KIP 客户端与完整的 Cognitive Memory Profile 保留其既有契约；记忆接口是可选的，并且需显式公布。常规路径加载 `brain/MemoryInterface_CN.md`；直接使用 KIP 的用户仅加载所需的角色速查卡。绑定职责通过五种意图进行测试（`conformance/KIP-2.0-Memory-Interface-Tests.md`），包括延迟形成、挂起屏障、仅源检索、任务隔离、幂等摄入、反馈来源、擦除、受限输出，以及正面记忆场景：新事实变为可召回、更正改变答案、现实世界变迁针对新旧时间作答、偏好在其类别内变更、录入错误在无行动者撤回的情况下得以修复、未被询问的约束主动浮现，以及到期的承诺触达注意力召回。模型结果不等于引擎结果。在声称成本更低或模型可靠性更高之前，必须在相同的 Nexus、记忆策略和输入语料库上对比原生 KIP 与该绑定（参见 [BrainEvaluation_CN.md](./brain/BrainEvaluation_CN.md) §6）。
