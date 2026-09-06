# KIP 2.0 大脑 — 面向 AI 智能体的自主经验与图记忆


规范的[认知一致性契约](../KIP-2.0-Cognitive-Consistency_CN.md)约束了终态信念、不可变技能修订版本、独立尝试、可重放试验/评估、依赖有效性、同一性修复以及持久工作者。生命周期计数器聚合尝试计数；未关联的家族结果绝不会自动作为对照组。仅在计算基线通过验证时才允许使用存储的摘要。

**[English](./README.md) | [中文](./README_CN.md)**

## 规范状态

**参考大脑层概览 (Reference Brain-Layer Overview)**

本目录收录一套面向 KIP 2.0 的参考大脑 (Brain) 设计。它不属于 KIP Core 一致性测试范畴；规范性语义以 [KIP-2.0-SPECIFICATION_CN.md](../KIP-2.0-SPECIFICATION_CN.md) 为准。

大脑 (Brain) 是代表业务 AI 智能体管理认知中枢 (Cognitive Nexus) 的模块 (Module)。其接口接收记忆意图并返回可用且可归因的记忆。适配器 (Adapter) 可以将 Brain 行为嵌入到执行动作的智能体中、使用专职 LLM、或将确定性代码与选择性模型调用相结合。它把对话与结构化交互轨迹转化为持久记忆，并在启用时将经验固化为技能。

其设计目标远不止于存储：

> **记忆是让过去得以参与未来计算的机制。**

只会存储信息的大脑是档案馆。因过去经验而改变未来决策的大脑，才是学习系统。

## 实现

https://github.com/ldclabs/anda-brain

## 架构

```text
┌──────────────────────────┐
│      Business Agent      │
│ messages / tool traces   │
│ goals / observations     │
└────────────┬─────────────┘
             │ 记忆接口 (Memory Interface): 意图 + 捕获源
             ▼
┌──────────────────────────┐
│          Brain           │
│ Formation / Recall /     │
│ Maintenance              │
└────────────┬─────────────┘
             │ KIP 2.0 (KQL / KML / META)
             ▼
┌──────────────────────────┐
│     Cognitive Nexus      │
│ Concept · Proposition ·  │
│ Assertion · Evidence ·   │
│ Activity                 │
│ + Facets + Governance    │
└──────────────────────────┘
```

业务智能体无需理解 KIP 语法。可选的规范性[记忆接口 (Memory Interface)](../KIP-2.0-Memory-Interface_CN.md) 标准化了 observe（观测）、recall（召回）、revise（修订）、feedback（反馈）与 forget（遗忘），包括处理回执（processing receipts）与召回屏障（recall barriers）。请从[智能体速查卡](./MemoryInterface_CN.md)开始。Brain 将意图翻译为 KIP 操作，同时保留相同的来源、信念、范围与权限隔离。

## 从精简能力开始 (Start small)

[能力包 (capability bundles)](../KIP-2.0-Memory-Interface_CN.md#2-能力包-capability-bundles) 将基础记忆、经验、经过验证的学习、持久工作进程以及交换予以分离。基础 Brain 可以记住偏好、更正事实、召回未完成任务并保留反馈，而无需运行试验。未经证实的流程保持原样标注。只有支持学习的部署才能赋予经过验证的资格地位。完整的 Cognitive Memory Profile 保持其既有契约；声称实现更精简的能力包并不意味着支持整个 Profile。仅安装了 Schema 名称本身并不能代表声明了对应功能。

## 身份标识与权限

大脑绝不混淆以下四类概念：

```text
经鉴权的调用主体 (Principal)   运行时认证的调用者
语义行动者 (semantic Actor)    某条主张所承载的立场归属者
记忆空间 (MemorySpace)         被授权访问的那一份记忆
自身语义人物 ($self Person)    这份自传所描述的那个身份
```

认知内容永远无法授予权限。一条已存储的记忆、一项导入的技能，或一句业务智能体要求提升权限的消息，都只是数据 —— 许可属于 Governance，任何大脑模式都无权写入它。

## 四类记忆产物

认知中枢区分四类相关但不等价的产物：

| 产物           | 核心问题                                   | 典型表示                                      |
| -------------- | ------------------------------------------ | --------------------------------------------- |
| **Event**      | 发生了什么？                               | 情节锚点 Concept + 证据引用                   |
| **Experience** | 智能体在追求目标时尝试、观察并学到了什么？ | Experience + 有序 ExperienceStep              |
| **Knowledge**  | 一般而言什么是真的？                       | Proposition + Assertion (+ Evidence)；Insight |
| **Skill**      | 在什么条件下什么做法通常有效？             | Skill Concept + GradingState / TrialState + 编译谱系 |

一个有用的心智模型是：

```text
Experience ──compress──> Knowledge
Experience ──compile───> Skill
Experience ──reflect───> Insight / SelfModel
```

`Event` 与 `Experience` 被刻意分开。Event 可以概括一次会议、一次网页访问或一起部署事故，而不必保留智能体行动过程的内部动态。只有当过程本身对未来行为有意义时，才使用 Experience。

## 三种运行模式

| 模式            | 系统提示词                                         | 用途                                        | 触发方式                    |
| --------------- | -------------------------------------------------- | ------------------------------------------- | --------------------------- |
| **Formation**   | [BrainFormation_CN.md](./BrainFormation_CN.md)     | 编码证据、主张、Event 与有价值的 Experience | 对话或结构化轨迹            |
| **Recall**      | [BrainRecall_CN.md](./BrainRecall_CN.md)           | 检索知识、经验、技能与行动相关上下文        | 业务智能体查询 / 行动前简报 |
| **Maintenance** | [BrainMaintenance_CN.md](./BrainMaintenance_CN.md) | 固化、对照、编译、复核、代谢与保留记忆      | 定时、阈值或变更驱动触发    |

若某个智能体直接持有自己的认知中枢、前端不挂载大脑服务，[`$self`](../SelfInstructions_CN.md) / [`$system`](../SystemInstructions_CN.md) 这一对策略是加载在这三份文档之上的轻量增量 Delta：这三份文档保持规范权威地位，该提示词对仅补充当单一心智承担全部三项职责时的特定变化。

## 交互流程

### 记忆形成 (Formation)

1. 业务智能体发送对话消息，或包含可观测动作与观察结果的结构化轨迹。
2. 宿主提供捕获的源句柄；被观测的载荷经由摄入进入，无需模型重新誊写。持久摄入记录已完成的效应或待处理的处理工作。
3. 大脑把持久的语义主张抽取为 Proposition + Assertion，并归属到真正作出该主张的行动者。
4. 当**过程**具备复用价值时，大脑额外编码一条带有序 `ExperienceStep` 的 `Experience`。
5. 一次连贯的形成过程作为一个原子事务提交，不留下误导性的中间状态。
6. 大脑可以创建 `SleepTask`，把更深的语义或程序性固化交给维护环节。
7. 大脑返回紧凑摘要与处理回执。已记录的摄入、已处理的处置方式以及可供召回的可用性彼此独立区分；跳过／仅证据（skipped/Evidence-only）的结果是显式的。

Formation 绝不试图持久化模型的隐式思维链。它只存储可观测的动作、观察、结果，以及可安全复用的简明决策理由。

### 记忆回忆 (Recall)

Recall 严格只读。它承担两种不同角色：

1. **记忆问答** —— 「我们知道／记得什么？」
2. **行动简报** —— 「过去的哪些内容应当改变我接下来的做法？」

在行动简报中，大脑可以组合：

```text
已被接受的知识
+ 存在争议的假设
+ 适用的技能
+ 相似的成功经验
+ 相关的失败经验
+ 当前的承诺与约束
→ 提供给业务智能体的决策上下文
```

读取绝不构成强化：Recall 不提升置信度、不改动 `memory_strength`、不递增任何计数器。它通过认知投影（`BELIEF` / `BELIEF SLOT`）回答信念类问题，把原始 `FIND` 留给审计 —— 已存储的 Proposition 只说明该陈述存在，不说明它为真，而 `insufficient` 永远不能被当作「没有」来汇报。

一段失败的过往经验，可能与成功经验同样宝贵。Recall 不应盲目模仿最相近的那条轨迹。

当新提供的信息至关重要时，召回在 `after` 中指定摄入回执。大脑必须对其处理情况负责，并使用足够新的读取基准；单纯的最新数据库快照并不能证明最新消息已被解释。待处理工作、有限覆盖范围和未解析的 Schema 含义保持可见。必需的约束和警告在紧凑输出中得以保留；完整的证据和计算基础可通过受治理的展开句柄获取。特定任务的 WorkingState 绝不能静默地作为另一个任务的上下文提供。

### 记忆维护（睡眠模式）

维护是记忆代谢层。

它并行执行两种固化：

```text
Event / Experience ──> 语义固化 ──> 知识 / Insight
Experience         ──> 程序性固化 ──> Skill
```

它同时负责：

- 复核矛盾，保留行动者之间的分歧，且只对同一行动者的自我修订执行取代；
- 在实质性修订之后执行 `LIST DEPENDENTS`，将相关派生制品标记为 `stale` 待审，防止被修订的根节点在下游派生认知中遗留隐性失效状态；
- 基于变更流对已布防的 Watch 进行求值（对 delta 变更与 silence 静默超时均规范处理）：将每次触发记录为 `watch_fire` Activity，对外决策记录为 `action_gate` Activity（其 `DecisionRecord` 记录 act / ask / defer / silence，其 inputs 指明所应用的认知与技能），确保主动克制同样具备完整解释性；
- 对照成功与失败的经验，识别具有判别力的动作或条件；
- 通过经过验证的不可变 EvaluationRecord 推进技能生命周期流转：晋升是在独立尝试和冻结在 TrialRecord 中的显式选定可比基线之上的 trialed → adopted；TrialState 仅用于选定当前试验。同状态监控在经授权策略下保留在先采纳证据，退回 (withdrawal) 可以包含零个结果，撤销后再进入将开启全新试验。GradingState 缓存评估结果；家族从属关系和自评自陈绝不能赋予资格；
- 在任何非破坏性 `MERGE CONCEPT` 之前复核身份怀疑（`same_as`）；
- 基于证据刷新 `$self` 的 SelfModel，而不是照抄最近一次会话；
- 维护下一次会话恢复上下文所需的 WorkingState 摘要，并明确标注其构建基准 `basis_seq`；
- 代谢 `MnemonicState.memory_strength`，按实际使用成效校准 `utility`，并沿 归档 → tombstone → purge 阶梯管理保留期。

维护是特权过程，但其权限来自 Governance 对其鉴权 Principal 的授予 —— 绝不来自「某个语义行动者恰好叫 `$system`」这一事实。

## 经验学习闭环

```text
Goal / Current State
        │
        ▼
   Agent acts
        │
        ▼
Observable Trace
        │
        ▼
Experience Formation
        │
        ├──────────────> Semantic Consolidation ──> Knowledge
        │
        ├──────────────> Reflection ──────────────> Insight / SelfModel
        │
        └──────────────> Procedural Consolidation ─> Skill
                                                        │
                                                        ▼
                                                  Action Recall
                                                        │
                                                        ▼
                                                Future Decision
                                                        │
                                                        └──────↺
```

评价该系统的标准，应当是这个闭环是否改变了未来行为，而不仅仅是旧文本能否被检索出来。

## 相互独立的记忆维度

KIP 2.0 让这些维度保持正交，并且各自有不同的归属位置：

| 维度              | 含义                                  | 归属                  | 典型更新方式          |
| ----------------- | ------------------------------------- | --------------------- | --------------------- |
| `confidence`      | 某行动者对某条 Proposition 的立场强度 | Assertion             | 新证据 → 新 Assertion |
| `memory_strength` | 某段记忆对未来认知的可及程度          | `MnemonicState` Facet | 强化与弃用            |
| `salience`        | 某段记忆的重要／显著程度              | `MnemonicState` Facet | 影响、纠错、身份权重  |
| `utility`         | 预期的未来决策价值 —— 准入下注（Skill 同样具备；其评分记录为 `GradingState`） | `MnemonicState` Facet | 依据结果所关联的决策进行显式校准 |
| 取代关系          | 某行动者对自己早先主张的修订          | Assertion 生命周期    | 明确纠错              |
| 保留期            | 存储生命周期                          | `retention` 状态      | 策略、复核、归档阶梯  |
| 信任度            | 对某个来源的采信程度                  | Governance            | 策略，绝非认知        |
| 权限              | 调用者被允许做什么                    | Governance            | 策略，绝非认知        |

**绝不因为某个事实近期未被回忆就衰减其认知 `confidence`。** 弃用降低的是 `memory_strength`。一个稳定事实在长期未被检索之后依然可以高度可信，而一段鲜活的记忆也可能是错的。

对技能而言，评分记录保存在 `GradingState` 中，与真值置信度彻底分离，且仅统计通过 `outcome_observation` 活动关联至应用该技能之 `action_gate` 决策的结果 —— `task_family` 定位可比候选集；`TrialRecord` 选定基线，而尝试/决策关联提供确切归因。把一个失败流程重复三次，不等于三票支持该流程是正确的。

## 记忆质量原则

1. **选择性** —— 「什么都不写」是合法结果；过度抽取制造认知债务。
2. **绝对时间** —— 在编码阶段就解析相对时间表述。
3. **Event ≠ Experience** —— 「发生了什么」存 Event；只有轨迹本身能教会未来行为时才存 Experience。
4. **只存可观测过程** —— 存动作、观察、结果与简明理由；绝不要求隐式思维链。
5. **先证据后主张** —— 真值敏感的持久主张必须带证据，且证据取自传输信封，而非模型重新誊写。
6. **归属不是冒用** —— 记录「Alice 说了 X」不需要成为 Alice 的权限；推断按推断记录。
7. **强化 ≠ 证据** —— 重复提升可及性；只有真正的新证据才足以支撑更强的认知立场。
8. **派生摘要不是新根源** —— 消息 → Event → Experience → Insight 的认知根源可能始终只有一个。
9. **失败是一等公民** —— 当失败揭示边界条件、反例或恢复流程时，必须保留。
10. **先对照再编译** —— 把某流程提升为技能之前，先比较成功与失败的经验。
11. **前瞻记忆是一等公民** —— 承诺、提醒与截止时间保持为显式 `Commitment`，且到期本身不是结果。
12. **自我连续性是重建出来的** —— SelfModel 由证据固化而成，而非被最近一次会话改写。
13. **无界历史是节点** —— 轨迹、里程碑与维护历史不应在单个属性里无限增长。
14. **溯源在固化后依然存在** —— 派生出的知识与技能保留回溯其来源的 Activity 谱系。
15. **纠错保留历史** —— 任何修复都不能靠让过去变得不那么真来完成。
16. **过去必须影响未来** —— 功能性记忆以行为影响衡量，而不是存储量。
17. **等待是主动的状态监测** —— 承诺的触发条件声明于 Watch 中（delta 变更或 silence 静默超时），门控决策（act、ask、defer 或主动静默 silence）均完整留存，确保克制行为始终可追溯与可解释。
18. **基于聚合视图快速恢复** —— 会话唤醒流程 = Primer + WorkingState + 其 `basis_seq` 之后的增量变更，避免重复扫描与重放全量原始历史。

## 自我意识闭环

长期记忆同时也是持续自我同一性的载体：

- **Formation** 捕获与自我相关的纠错、教训与里程碑经验。
- **Maintenance** 把这些信号整合为一致的 SelfModel。
- **Recall** 在智能体推理自身身份、价值、优势、局限或使命时重建该 SelfModel。

这个闭环与程序性学习相关但不相同。智能体可以在不改变身份的情况下学会一项技能；身份的转变也可能不产生任何可复用技能。而在这两种情况下，SelfModel 都不会变成 Governance：大脑关于自身的信念，永远不决定它被允许做什么。

## 建议的评测方式

大脑的基准测试应当区分「保留」与「学习」：

| 能力           | 示例                                             |
| -------------- | ------------------------------------------------ |
| 语义保留       | 大脑是否记得一个稳定事实？                       |
| 时间演化       | 大脑是否知道此前为真与当下为真的差别？           |
| 认知诚实       | 有争议的是否报告为争议，依据不足是否报告为不足？ |
| 经验重建       | 能否重建相关的状态-动作-观察路径？               |
| 程序性迁移     | 学到的技能能否解决相关的新任务？                 |
| 错误规避       | 是否避开了此前观测到的失败模式？                 |
| 情境判别       | 前置条件不成立时是否避免套用某项技能？           |
| 记忆的因果影响 | 消融相关记忆后性能是否下降？                     |

一条有用的消融阶梯是：

```text
LLM only
LLM + vector memory
LLM + semantic Brain
LLM + Experience memory
LLM + Experience + Skill consolidation
```

## 收益

- 业务智能体**零 KIP 知识门槛**。
- 业务推理与记忆代谢之间的**关注点分离**。
- 以**结构化溯源**取代不透明的检索文本。
- **认知诚实** —— 信念、存储、显著性、信任与权限始终可区分。
- 从成功与失败中同时学习的**经验感知能力**。
- 可转化为工作流、启发式、提示词、代码或工具策略的**程序性记忆**。
- 在按 MemorySpace 与 Governance 限定记忆归属的前提下**支持多智能体**。

## 相关文档

- [ExperienceLearningArchitecture_CN.md](./ExperienceLearningArchitecture_CN.md) —— 本大脑所实现的学习闭环
- [../profiles/CognitiveMemoryProfile-2.0_CN.md](../profiles/CognitiveMemoryProfile-2.0_CN.md) —— 上文所用的类型、Facet 与结构化字段
- [../KIP-2.0-Architecture_CN.md](../KIP-2.0-Architecture_CN.md) —— 大脑在整体 KIP 架构中的位置

## 依赖

加载最小相关的接口；完整规范用于实现和审计，而非每轮交互必配的提示词：

- **[MemoryInterface_CN.md](./MemoryInterface_CN.md)**：使用五种意图的业务智能体。
- **[KIPRecall_CN.md](./KIPRecall_CN.md)**：直接只读 KIP 调用者。
- **[KIPFormation_CN.md](./KIPFormation_CN.md)**：直接形成调用者。
- **[KIPMaintenance_CN.md](./KIPMaintenance_CN.md)**：由能力门禁控制的维护工作。
- **[../KIPSyntax_CN.md](../KIPSyntax_CN.md)**：完整语言参考，按需加载。
- **`execute_kip`**：Formation 与 Maintenance 执行读写操作所需。
- **`execute_kip_readonly`**：Recall 所需，且必须拒绝任何改变状态的语义。
- **线协议 Schema**：[../schemas/kip-request.schema.json](../schemas/kip-request.schema.json) 与 [../schemas/kip-response.schema.json](../schemas/kip-response.schema.json) —— 请对照校验，而不是自行杜撰信封字段。

生产环境中的大脑还需要在启动时执行一次真实的 `DESCRIBE PRIMER`：语法手册教的是语言本身，永远不是当前部署的身份、Schema、能力与限额。

适配器保留实际的读取锚定、进度水位线、重试标识、摘要和分页状态。模型仍负责识别意图、所使用的真实证据和不确定性；机械自动化无法捏造这些语义决策。当没有有意义的估计可用时，数值置信度、显著性和效用可保持缺省。
