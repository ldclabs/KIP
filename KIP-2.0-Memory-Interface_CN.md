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

Brain 可以嵌入在执行动作的智能体中、使用专职模型实现、或将确定性代码与选择性模型调用相结合。这些都是在同一接口下的适配器（Adapter）。绑定**必须**保留 Core 及适用的认知一致性契约；使用更小规模的接口绝不能削弱这些契约。

下方的五种意图采用统一的请求结构，每个请求对应一个意图。原生 KIP 独立地保留供经授权的工具使用；记忆接口请求不是命令文本，**严禁**发送至 KQL/KML 解析器。仅实现 Nexus 本身并不意味着实现了此绑定。

## 2. 能力包 (Capability bundles)

能力包注册表为 `profiles/memory-bundles.json`。它们是命名的职责组合，而非新的 Schema 包或现有 Profile 的新含义。

| 能力包 (Bundle) | 所需行为 | 依赖项 |
| --- | --- | --- |
| `memory_basic` | 全部五种意图；源优先准入、最终信念、限定范围的召回、显式纠错、受治理遗忘与进度屏障 | Core 读写语义 |
| `memory_experience` | 事件/经验重建，以及不可变、显式未证实的程序性候选 | memory_basic |
| `memory_learning` | 仪器化的独立尝试、可比试验、可重放评估与经过验证的资格地位 | memory_experience |
| `memory_durable` | 重启安全的前提关注、租约、调度分发与对账调和 | memory_basic |
| `memory_exchange` | 受治理的胶囊导出/导入、实体身份与来源保留 | memory_basic |

能力包依赖**必须**具有可传递性地公布。不支持的能力包操作报错 `UnsupportedCapability`；可用的类型名称绝不意味着已实现其生命周期或工作进程行为。基础实现**可以**仅使用其所需的领域与记忆符号。它**严禁**接受不受支持的程序性变更、声称实现经过验证的学习、或为未实现的通道捏造空覆盖范围。

既有的 `KIP-CognitiveMemory` profile 依然是完整的标准契约。声称支持更窄的能力包并不等同于声称支持该 Profile。已存储的既有符号引用（包括 `kip://profiles/cognitive-memory@2.2.0`）保留其含义与血统；实现此项拆分无需将任何 Person/Skill 实体移动到新的 package 路径。Package 是词汇表/校验工件，不代表自动声称其词汇表中的每一项操作均可用。所有 Core 保护措施在每个能力包中均适用。

`memory_basic` 包括 `ASSERT`、`MUTATE`、摄入、只读执行、幂等性以及针对派生内容的依赖健全性校验。普通事实、偏好与召回的失败经验不需要试验或 GradingState。程序性候选在 `memory_experience` 下可以作为未证实内容为深思熟虑提供参考；只有 `memory_learning` 才能赋予经过验证的本地资格地位。其消费者在读取所声称的地位时**必须**依然校验保留的评估记录。

声明支持 `memory_interface` 的部署在其常规连接建立过程中暴露该绑定的传输协议。其描述符（descriptor）指明绑定版本、可用能力包、安全的默认 Space/范围、支持的分词器以及默认的输出/截止时间预算。它可以包含在 `DESCRIBE PRIMER` 的扩展数据中。裸 Nexus 绝不能公布其所连接的 Brain 实际上无法提供服务的绑定或能力包。能力可用性绝不等于读取或变更每一个对象的权限。

## 3. 请求与范围 (Request and scope)

当前契约修订版本：`2026-09-23`。通告该修订版本的描述符绑定了适用的认知一致性细化要求。`requires_contract` 请求确切的修订版本，且**必须**在捕获或变更前完成检查；未知或未实现的修订版本将报错 `UnsupportedCapability`。描述符省略修订版本属于遗留/未指定状态，绝不能作为支持该修订版本的证据。现有的 `kip_memory` 依然是主协议传输版本号。

可选的 `requires` 列表指明此请求所需的能力包。适配器在摄入或变更前检查所有能力包；未知/不可用的要求报错 `UnsupportedCapability`。省略该列表则使用 `memory_basic`，而非猜测的高级能力。此项能力检查绝不替代逐项操作的 Governance 治理。

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
| `observe` | source_ref | 捕获/解析源，准入有用记忆，或显式保留/延期/跳过 |
| `recall` | query 或 target_ref；可选 mode、context 和 after | 读取受限的任务简报或展开早期结果的证据 |
| `revise` | source_ref；可选 target_ref 和 change_kind | 使用新 Assertion 和适当区间记录纠错或现实变更 |
| `feedback` | source_ref；可选 decision_ref/attempt_ref | 保留带有实际来源的反馈；它不会自动成为评级 |
| `forget` | target_ref 以及 mode: payload_only 或 semantic | 执行受限、受治理的 ErasurePlan 并报告实际覆盖范围 |

`recall.mode` 为 `answer`（默认）、`action` 或 `resume`。`resume` 限定于当前任务范围；全局 WorkingState 在所请求的范围内进行过滤/重建，绝不作为另一个任务的工作上下文提供。`input.context` 是调用方提供的瞬态情境，而非隐式写入。`detail: evidence` 在当前 Governance 治理下展开目标；它不添加第六种意图，也不修改召回计数器。可选的 `input.time` 将 `valid_at`（世界时间）与 `as_of_seq`（保留的认知历史）分离。历史读取需要底层能力与历史控制状态支持；不受支持的请求显式报错。比显式固定的 `as_of_seq` 更晚的 `after` 屏障报错 `PreconditionFailed`，而非无限等待或静默推进所请求的历史快照。

`revise.change_kind` 为 `correction`、`world_change` 或 `unspecified`。它表达意图，而非取代另一行动者的权限。不明确的行动者、目标、上下文或变更时间保持显式；适配器保留 Evidence 并汇报缺失，而非编造精确的修订。每一次连贯的修订都是原子性的。

`feedback` 接受自我陈述为 `agent_statement`，将人类反馈作为可归因的 Evidence。只有具备所需决策/尝试及观察者绑定的经授权仪器化组件才能写入可评级的结果。反馈本身绝不会提升 Skill，对于普通描述性反馈不需要学习能力包。

`forget` 复用认知一致性 §8 与 Core §60。目标是确切、受限的选择句柄或元素引用，而非模型生成的任意代码。计划重新检查范围、留置（holds）、权限与并发副本。确认（acknowledgement）不代表完成擦除。挂起、部分或受阻的覆盖范围保持可见；仅在所有范围内的受控表面经过验证后才返回 `completed`。先前的外部导出不在本地保障范围内。策略所需的审批通过现有 Governance 处理；绑定不授予额外权限。

## 5. 处理回执与读取屏障 (Processing receipt and read barrier)

成功的摄入在返回不透明的 `receipt_ref` 之前，持久记录其源/意图及其结果或挂起的工作。不可变的确认信息包含意图、Space 和 `accepted_seq`。它与底层的 KIP 事务收据（Transaction Receipt）不同；一个记忆意图可能在后续产生多个事务。具有相同键的重放返回该原始确认。当前进度是独立识别的读取视图，绝不是重写的原始事务结果。因此，在工作完成后，摄入重放可能会重复其原始记录的确认信息；带有 `after` 的召回则读取当前进度。它不会导致进度倒退。

准入与保留检查先于持久源捕获。若策略要求跳过源字节，则仅保留允许的非内容摄入/处置数据；切勿为了签发回执而先存储机密内容。无效应的跳过可以使用当前 Space 序列号，而无需分配认知提交。被拒绝的摄入不会绑定幂等键，也不会伪造成功的捕获。

进度分为四个阶段：

| 阶段 (Phase) | 含义 |
| --- | --- |
| `recorded` | 摄入已持久化；语义处理可能仍处于挂起/延期状态 |
| `processed` | 所有准入的输入均具有最终处置结果；`resolved_seq` 锚定已完成的形成效应 |
| `available` | 召回可以通过对齐的索引或确切/源回退，在 `available_seq` 包含这些效应与省略项 |
| `failed` | 处理无法完成；原因显式说明，绝不汇报为成功记忆 |

处理完成的处置结果包括 `formed`、`evidence_only` 或 `skipped`；`erased` 仅用于已完成的 `forget`。`evidence_only`/`skipped` 是诚实的最终结果，不是对学到知识的主张。延期的工作保持为 `recorded`，而非 `processed`。失败可能会留下持久源材料，若已提交，则绝不能描述为已回滚。摄入重试不会重新启动失败的工作；新的显式处理尝试保留相同的源标识并拥有自己的审计操作。

对于每个回执，若存在，则满足 `accepted_seq <= resolved_seq <= available_seq`。进度阶段是单调递增的，除非 `recorded`/`processed` 操作发生失败。`available` 记录的是已完成的处理界限（horizon），而非永久真实性、保留期、权限或索引新鲜度。后续的更正与擦除不会因为旧回执曾经 `available` 而复活数据。每次召回仍需检查其当前的 ProjectionBasis、依赖关系与 Governance。

对于变更响应，`succeeded` 要求进度达到 `available`；`recorded`/`processed` 工作返回 `pending` 或 `partial`。最终的处理失败返回带有其错误的 `failed`。对于 `forget`，`succeeded` 额外要求完成擦除并具有 `erased` 处置结果。对于 `recall`，`succeeded` 要求完整的声明覆盖范围以及满足所有 `after` 屏障；不完整的结果为 `pending`/`partial` 且 `action_eligible=false`。没有任何状态本身意味着信念已被接受或外部操作已获得授权。

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

`after` 是处理屏障，而非要求返回旧快照。每一个指定的回执都必须经过授权、来自同一个 Space、并且已被核算。成功的屏障要求进度达到 `available`，且召回基准至少与其 `available_seq` 一样新。适配器还会额外检查所请求的范围以及所有当前基准依赖项。源处理、索引新鲜度与查询完备性是独立的职责。仅证据（Evidence-only）结果仍可检索，并披露其未解析的含义；仅靠索引对齐并不意味着抽取已执行。`evidence_only`/`skipped` 处置结果满足处理核算，但不满足语义覆盖。若未解析的源材料可能改变任务关键回答，应披露该差距并将受影响的通道/前置条件标记为不完整；切勿将较旧的结构化事实作为无保留的当前答案呈现。与显式纠错请求相冲突的策略跳过必须予以解释，绝不能掩盖为成功的学习。

在截止时间到达时，挂起的输入产生 `pending`/`partial`、显式的未解析回执引用以及 `action_eligible=false`。失败的输入产生带有原因的 `failed`/`partial` 结果。缺失、过期或不可访问的进度无法满足屏障；视情况使用 `NotFoundOrNotVisible` 或 `ArtifactUnavailable`，且不得隐藏计数。只有在实际处理具有最终处置结果且召回能够包含它之后，回退方案才能满足屏障；单纯的原始源可用性不能静默替代未执行的抽取。召回本身不执行任何认知变更：工作进程独立推进；召回可以等待、检查或返回 `pending`。

## 6. 紧凑召回与可展开证据 (Compact recall with expandable evidence)

绑定返回摘要（summary）、类型化条目（typed items）、覆盖范围（coverage）以及不透明的 `basis_ref`。每个对真实性敏感的条目均携带最终认识状态；原始源材料标记为 `source`，而非静默呈现为已接受知识。每个条目都拥有不可变的结果引用与证据引用。引用展开读取产生该条目的版本/基准，受当前 Governance 与保留期约束；绝不静默替换为更新的版本。未知项和重要警告在紧凑结果中呈现，而不隐藏在展开句柄之后。

流程条目还会披露资格地位：`unproven`（未证实）、`validated`（经证实）、`revoked`（已撤销）或 `unverifiable`（不可验证）。其结果引用锚定确切的 SkillRevision 及所使用的任何评估。动作网关解析并重新检查该版本；绝不替换为稳定 Skill 较新的 `current_revision`。经过验证的地位仅在学习契约下提供，且仍不授予执行权限。

适配器保留在[认知一致性 §8.2](./KIP-2.0-Cognitive-Consistency_CN.md#82-可验证的召回计划-verifiable-recall-plans)中定义的实际逐通道 RecallPlan；近似检索的完成仅代表其声明的计划已执行完毕，不等于语义完备性。任务作用域贯穿所有形成产物（[§8.1](./KIP-2.0-Cognitive-Consistency_CN.md#81-源因果性与统一步骤作用域-source-causality-and-uniform-task-scope)），且相关源更正的收敛独立于工作进程的完成顺序。

适配器在 `basis_ref` 之后保留完整的 ProjectionBasis、依赖决策与 RecallCoverage；证据详情以规范形态返回它们。这改变的是面向模型的视图，而非底层的 KQL 线协议契约。引用不赋予访问权限，过期的审计材料汇报为不可用。

`continuation_ref` 用作召回 `target_ref` 以继续相同的查询/基准。当无法保持该遍历时，更改其范围、查询或所需的 `after` 界限将报错 `CursorMismatch`。此时应启动新的召回，而非静默混合来自不同基准的页面。当前的鉴权在每次展开/分页时依然适用。

覆盖范围说明约束、承诺、依赖项、失败、经验、技能与证据。每一项的状态为 `complete`、`incomplete` 或 `not_applicable`。后者要求权威判定该通道在此范围内无关/不存在；缺少支持或不完整的遍历不能重新标记为 `not_applicable`。通道无法提供服务的保留内容会导致覆盖范围不完整。这些保证针对的是经授权的已记录全集，绝非声称已检索了整个世界。

关键的适用约束和警告优先于普通的相似度。被截断的必需通道、未满足的 `after` 屏障或未验证的必要前置条件会阻止自动应用。`action_eligible` 描述的是记忆充分性，绝非执行授权。只读暴露绝不强化置信度、强度或效用。所请求的输出和时间预算受限；未满足的覆盖范围显式返回，而非为了迎合简短回答而予以隐藏。

`max_output_tokens` 使用公布的分词器（或显式支持的所请求分词器）限制序列化后的面向模型的成功结果。元数据与正文一同计入。如果连强制性的诊断/覆盖范围都无法容纳，则返回受限的 `ResultLimitExceeded` 诊断信息，绝不能丢弃警告或假装字节/字符计数就是 Token 计数。错误信息可以超出极度微小的内容预算。描述符公布默认值和最小有用响应大小。展开操作拥有自己的预算。

## 7. 职责与事实的使用 (Responsibility and use of facts)

模型选择语义意图、所使用的真实证据和未解析的歧义。适配器生成机械摘要、捕获真实读取锚定、保留幂等键、处理分页并管理工作进程/回执状态。适配器**严禁**捏造模型使用了哪些证据、重新标记过时输入的时间戳、或填充缺失的数值置信度。提供的估计值保持归属；缺省的置信度/显著性/效用无需靠猜测来准入有效的普通记忆。

经授权的事实记忆可以在其允许的目的和范围内为决策提供参考。仅仅因为计划使用了该事实，不需要对其进行程序性提升。指令采纳和外部执行仍受到独立控制。Core §31.3 权限等级指定了允许的用途和可强制执行的操作检查；它们并不声称 Nexus 能够证明暴露的 Token 对模型不存在任何内部影响。自我模型内容绝不能成为策略或权限。

## 8. 一致性与迁移 (Conformance and migration)

现有的原生 KIP 客户端与完整的 Cognitive Memory Profile 保留其既有契约。记忆接口是可选的，并且需显式公布。常规路径使用 `brain/MemoryInterface_CN.md`；直接使用 KIP 的用户仅加载适用的角色速查卡。所有绑定职责均通过相同的五种意图进行测试，包括延迟形成、挂起屏障、仅源检索、任务隔离、幂等摄入、反馈来源、擦除与受限输出。模型结果不等于引擎结果。在声称成本更低或模型可靠性更高之前，必须在相同的 Nexus、记忆策略和输入语料库上对比原生 KIP 与该绑定（参见 [BrainEvaluation_CN.md](./brain/BrainEvaluation_CN.md) §6）。
