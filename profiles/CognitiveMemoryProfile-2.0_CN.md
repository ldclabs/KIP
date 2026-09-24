# KIP 认知记忆 Profile 2.0 (Cognitive Memory Profile 2.0)

**[English](./CognitiveMemoryProfile-2.0.md) | [中文](./CognitiveMemoryProfile-2.0_CN.md)**

## 规范状态

**规范性标准 Profile 草案。** 本文档及其模式包对声明实现 `KIP-CognitiveMemory` 一致性级别（规范 §89）的系统具有约束力。草案状态绝不降低 MUST 等级的强制要求；记忆大脑策略示例保持为参考性内容。

模式包标识（草案修订版本通过其内容摘要识别，参见规范 Status 章节）：

```text
kip://profiles/cognitive-memory@2.0.0
```

本文档定义了面向 KIP 2.0 大脑的标准可移植记忆结构。它建立在 KIP Core 基础之上，并不重新定义 Core 语义。若本文档与 `SPECIFICATION_CN.md` 发生冲突，以规范为准。

`brain/` 中的两个配套规范承载了仅部分部署所需的机制：[已验证学习](../brain/KIP-2.0-Validated-Learning_CN.md)（试验、评估与经过验证的 Skill 资格地位）与[大脑运行时](../brain/KIP-2.0-Brain-Runtime_CN.md)（持久工作者、租约与派发）。实现也可以改为声明更窄的[记忆接口级别](../KIP-2.0-Memory-Interface_CN.md#2-级别-levels)；声明某个级别并不等同于声称支持整个 Profile，也不会改变已存储符号的血统或削弱 Core 不变式。普通事实和描述性反馈绝不需要进行试验。

---

# 0. Profile 核心主张

通用 KIP Core 为任意认知中枢提供了价值中立的知识、证据、溯源和治理图谱。

但长期运行的自主智能体（Agent）还需要更具体的记忆模式：

```text
情节记忆 (Episodic Memory)        发生了什么
情景经历 (Experiential Memory)      尝试了什么、面临何种情境、达成了什么结果
陈述性巩固 (Declarative Consolidation) 哪些稳定的经验事实得到了沉淀
程序性技能 (Procedural Skills)       哪些行为策略在何种约束下被证实有效
前瞻承诺 (Prospective Commitments) 未来需要履行或留意的任务
关注警戒 (Watch Attention)         值得唤醒以进行状态差分评估的条件（或静默状态）
自我模型 (Self-Model)              对自身能力、边界与倾向的可校准表征
工作上下文 (Working State)          由最新基准序列号印记支撑的紧凑苏醒恢复状态
记忆代谢 (Mnemonic Metabolism)      访问强度、显著性、效用与存储生命周期的动态演化
```

**认知记忆 Profile 2.0** 将这些高级模式统合为规范的 Schema 包、切面定义和生命周期约定，而**无需向 KIP 核心数据模型硬编码任何特殊的专有实体类型**。

```text
所有高级记忆对象均为类型化的 Concept
认知立场通过 Proposition + Assertion 表达
真实观测保持为 Evidence
认知衍生保留为 Activity 溯源
运行时扩展通过受校验的 Facet 实现
```

Cognitive Memory Profile 在 Core 之上定义了可复用的记忆词汇表：

```text
Person
Event
Experience
ExperienceStep
Insight
Commitment
Watch
Skill
SkillRevision
SleepTask
SelfModel
WorkingState
MnemonicState
GradingState (计算视图)
DecisionRecord
OutcomeRecord
```

---

# 1. 设计目标

1. **结构化情景轨迹**：将目标导向的轨迹（上下文、步骤、决策、行动、反馈、更新、结果）建模为一等公民的 `Experience` 概念。
2. **失败作为宝贵财富**：对失败经历给予与成功同等的重视，支持反思与负向约束发现。
3. **程序性技能渐进采纳**：定义带版本控制的可重用技能 `Skill`，其生命周期必须与实际外部后果流紧密结合。
4. **统一前瞻记忆与主动警戒**：通过明确声明的 `Commitment` 和 `Watch` 将未来意图和状态差分监控纳入认知图谱。
5. **记忆代谢**：提供独立的记忆访问强度（`memory_strength`）、显著性（`salience`）与效用下注（`utility`），与认识论置信度保持严格解耦。
6. **可审计溯源链**：巩固沉淀的高阶认知（偏好、洞察、自我模型）必须可溯源至具体的经验和证据。

---

# 2. 非设计目标

1. **不取代具体业务领域 Schema**：特定的业务实体（例如特定行业的工件）应使用其自身的模式包。
2. **不规定单一固化的学习算法**：Profile 规定状态结构与约束边界，具体的学习与巩固启发式由智能体实现自主决定。
3. **不硬编码底层神经权重或注意力机制**。

---

# 3. 与 Core 的核心边界

Profile 必须保持以下界限：

```text
关于偏好的 Insight ≠ 已采纳的偏好信念
Skill Concept ≠ 工具权限
Person Concept ≠ 经认证的主体 (Principal)
SelfModel Concept ≠ Governance 治理策略
SleepTask Concept ≠ 维护权限
Watch Concept ≠ 调度器或操作许可
WorkingState Concept ≠ Evidence
MnemonicState ≠ 断言置信度
依赖有效性 ≠ 断言生命周期
Outcome Evidence ≠ 执行行动模型的自我陈述
task_family ≠ 结果归因
DecisionRecord ≠ 行动授权
已采纳的 Skill ≠ 可执行权限
```

Profile 切面与结构字段绝不能（MUST NOT）绕过 Core 不可变性、源头归属、Governance 治理或认识论语义。

---

# 4. Profile 模式包

机器可读发布**应当**使用不可变模式包：

```text
package_id  = kip://profiles/cognitive-memory
version     = 2.0.0
package_ref = kip://profiles/cognitive-memory@2.0.0
```

持久化精确的 Profile 引用。本地别名保持为面向模型的便利工具。

定义的核心符号：

```text
Concept 类型:
  Person
  Event
  Experience
  ExperienceStep
  Insight
  Commitment
  Skill
  SkillRevision
  SleepTask
  SelfModel
  Watch
  WorkingState

Facet 切面:
  MnemonicState
  GradingState (计算视图)
  OutcomeRecord
  DecisionRecord
  DependencyBasis
  AttemptRecord
  TrialRecord
  EvaluationRecord
  WatchState
  LeaseState
  CompressionRecord
  RecallCoverage

谓词 Predicates:
  prefers
  caused_by
  same_as

结构字段 Structural Fields:
  has_step
  experienced_by
  involves
  mentions
  current_revision
  revision_of
  current_trial
  current_evaluation
  committed_to
  owed_to
  assigned_to
  watches
  about
  derived_from (计算视图)
  compiled_from (计算视图)
  compiled_by (计算视图)
  consolidated_to (计算视图)
```

---

# 5. 标准概念类型 (Concept Types)

## 5.1 Person（人物/主体）

表示与智能体交互的人类用户、协作者或其他具名实体。

```text
name         显示/识别名称
attributes:
  role       例如 "operator", "user", "collaborator", "analyst"
  locale     首选语言/区域设置
```

注意：`Person` 是语义概念，不是 Core 的 `Principal`（调用主体）。

---

## 5.2 Event（事件）

表示在特定物理/逻辑时间点客观发生的事态，独立于智能体自身的目标。

```text
name         事件摘要
attributes:
  start_time 必填 ISO 8601 时间戳
  end_time   可选 ISO 8601 时间戳
  category   "interaction", "observation", "system", "milestone"
  summary    结构化或纯文本说明
```

结构字段：
- `involves`：关联的 `Person` 或其他 `Concept`。
- `mentions`：提及的实体。

---

## 5.3 Experience（经验）

表示智能体为了实现特定目标所经历的一次连续的、有明确边界的情境轨迹。

```text
name         经验名称/标题
attributes:
  goal           必填；智能体试图达成的意图或目标
  outcome_status 必填；"success", "partial", "failure", "aborted", "unknown"
  domain         任务领域/分类标签
  trigger        触发该经历的原因或任务输入
  context        执行上下文摘要
  lessons        沉淀出的关键教训
```

结构字段：
- `has_step`：指向一组有序的 `ExperienceStep`。
- `experienced_by`：执行该经历的 `Person`（智能体自身或被观察者）。
- `involves`：相关联的实体。

---

## 5.4 ExperienceStep（经验步骤）

经验轨迹中的单一原子步骤，通过从 0 开始的顺序边被 `Experience` 组织。

```text
name         步骤描述
attributes:
  step_kind  "context", "observation", "decision", "action", "feedback", "belief_update"
  summary    客观摘要
  status     "success", "failure", "neutral"
```

因果关联：
- 步骤之间的因果关系必须使用 `caused_by` 命题三元组显式声明，顺序边索引本身不代表因果。

---

## 5.5 偏好模式 (Preference patterns)

偏好是一项主张，而不是一种类型：“爱丽丝偏好深色模式”是带有爱丽丝的断言及其证据的 `prefers` 命题（§7），发生变更的偏好是其所属类别内的一条较新的断言（§15）。本 Profile 未定义独立的 Preference 概念实体。值得概括的相对稳定模式（作用域、稳定性、反例）是关于该选项类别的洞见（Insight，§5.6）`about`，如同其他洞见一样通过有记录的活动派生；它绝不替代其所概括的主张历史，且召回始终从 `prefers` 槽位回答，而非从该概括中回答。

一个人所偏好的每个选项都是由其类别定型的概念（例如某种配色方案、某种编辑器），因为该类型正是 `prefers` 进行分区划分的依据（规范 §20.15）。形成操作严禁使用泛型兜底类型为选项定型；若尚无已安装的包对该类别命名，则首先在草稿词汇中定义该类型（规范 §20.16）。

---

## 5.6 Insight（洞见）

从多段经历、交互或事件中归纳出的高阶陈述性认知。

```text
name         洞见标题
attributes:
  topic        主题
  statement    陈述内容
  task_family  可选任务族；若提供，则将洞见订阅至对应的后果流
  applicability 适用边界与前置条件说明
```

结构字段：
- `derived_from`：支撑该洞见的历史经历或证据（计算得出）。

---

## 5.7 Commitment（承诺）

智能体做出或接收到的前瞻性承诺、任务委托或未决事项。

```text
name         承诺名称
attributes:
  title      标题
  status     "pending", "fulfilled", "cancelled", "expired", "blocked"
  due_at     可选 ISO 8601 截止时间
  priority   "low", "medium", "high", "critical"
  details    履约要求与细节
```

结构字段：
- `committed_to`：对谁做出的承诺（`Person`）。
- `owed_to`：权利人或受托人。

承诺变为到期或失效的条件是监听该承诺的 Watch（§5.11），而非其上的字段：Watch 是运行时进行求值的对象，而承诺保持为纯粹的前瞻性记录。

承诺只有通过提升它的提交（commit）才能进入业务智能体的注意力（Memory Interface §4）：监听其 `due_at` 的 Watch 触发（`watch_fire`），或 Maintenance 在其中将承诺记录为到期的 `commitment_review` 活动（§17）。单凭 `due_at` 的流逝不会提升任何事项，因此每个注意力项都带有提升它的提交的 `space_seq`。

承诺属于认知，绝非自动的外部执行。

---

## 5.8 Skill（技能）与 SkillRevision（技能修订版本）

**Skill 是稳定的程序性身份；SkillRevision 是实际被执行与评估的不可变行为。** Skill 持有 `skill_class`、`summary`、注释及其生命周期状态 `status`。必填的 `current_revision` 指向一个 SkillRevision；修订版本的 `revision_of` 指回该 Skill。这两者的创建在单个原子操作中完成，包括前向引用。

SkillRevision 包含必填的 `task_family`、`procedure`、`behavior_digest`，以及可选的 `applicability`、`preconditions`、`success_criteria` 与 `recovery`。其 `behavior_digest` 是除摘要以外的规范化行为字段的 sha256。所有行为字段均不可变，且绝不能被 Skill 上的可变字段遮蔽。任务族是流选择手柄，绝不自动充当充分的基线成员资格。不可证伪的陈述性教训保持为 Insight。

生命周期流转遵循 `proposed → trialed → adopted → revoked`；在对外声明支持时，它们由配套规范[验证性学习](../brain/KIP-2.0-Validated-Learning_CN.md)驱动。选择新行为将在单个受保护的事务中将当前资格地位重置为 `proposed` 并清空 `current_trial` 与 `current_evaluation` 指针，绝不改写旧裁决。这属于修订版本选择，而非晋升。注释与记忆代谢信号可以在不重置资格地位的情况下变更。导入的修订版本需通过本地新试用重新挣得本地资格地位。

---

## 5.9 SleepTask（睡眠任务）

持久的维护工作项。建议的类别包括 consolidate、review_conflict、review_skill、resolve_identity、review_retention、review_derived、review_schema、refresh_self_model 以及 inspect_quarantine。`review_schema` 将草稿词汇符号（规范 §20.16）排队以供审阅与晋升：定义符号的大脑为该符号排入一个睡眠任务，其 `client_key` 为 `review_schema:<kind>:<确切符号引用>`，其中 `kind` 为 `ConceptType` 或 `PredicateType`。任务同时指明类别和确切引用，因此不同类别即使同名也保持独立，而重试的定义绝不会重复排队。审阅可以把近义词并入既有符号的用法、提议晋升或了结该任务；只有持有 `manage_schema` 的主体才执行晋升。

在声明了 `durable_brain_runtime` 的实现中，SleepTask 的认领与完成遵循配套规范[大脑运行时](../brain/KIP-2.0-Brain-Runtime_CN.md) §3 的租约契约。

语义上分配给 `$system` 不授予权限。

---

## 5.10 SelfModel（自我模型）

关于智能体自身能力边界、行为习惯、倾向性及角色定位的自省陈述。

```text
name         自省维度
attributes:
  dimension  "capability", "limitation", "style", "boundary", "tendency"
  statement  模型陈述内容
  confidence 归纳置信度 [0, 1]
```

SelfModel 是认知视图，绝非 Governance 控制面，严禁借其实现权限扩充。

---

## 5.11 Watch（守望/关注警戒）

持久化的注意力状态：声明在何种状态差分（变更或未变更）下应当唤醒大脑进行注意力评估。

```text
name         守望目标
attributes:
  watch_class "delta", "silence"
  condition   声明式条件，形式为:
              {
                "element": :id,               // 监听具体元素
                "slot": {:subject, :predicate}, // 或监听特定槽位
                "type": "Experience",         // 或监听某一类型
                "ops": ["create", "transition"], // 关注的变更动作
                "touched": ["attributes", "facets.MnemonicState"], // 触碰的平面
                "text": "语义筛选描述"        // 仅由 Brain 自身进行语义过滤
              }
  status      "armed", "fired", "expired", "disarmed"
  due_at      可选 ISO 8601 时间戳；用于静默 watch 的超时判定
```

编码承诺之等待半边（“若周四前未收到回复则升级”）的 Watch 通过 `watches` 引用该承诺。承诺承载义务；Watch 承载触发条件。

触发的 Watch 通过 Memory Interface 的注意力召回（Memory Interface §4）触达业务智能体。在声明了 `durable_brain_runtime` 的实现中，持久工作者的职责（设防世代、覆盖水位线、重启安全性）遵循配套规范[大脑运行时](../brain/KIP-2.0-Brain-Runtime_CN.md) §2。

**触发的 Watch 不赋予任何行动权限。** 它仅引起注意（通常是 SleepTask 或唤醒信号），绝不产生外部行动。大脑接下来执行的任何操作都必须如同其他行为一样通过行动网关（§9）与治理校验。

---

## 5.12 WorkingState（工作状态）

当前上下文或进行中会话的紧凑工作记忆摘要。

```text
name         上下文名称
attributes:
  basis_seq  必填非负整数；支撑该工作状态的底层最新快照序列号
  summary    当前认知焦点摘要
  active_goals 进行中目标列表
  open_hypotheses 待检验假说列表
```

典型输入 —— 即其 `working_state_refresh` 活动的输入，可通过计算得出的 `derived_from` 字段（§7）读取 —— 包括未决承诺、设防的 Watch、争议信念槽位、近期的重要高显著性事件以及活动线程。刷新属于 `working_state_refresh` 活动，通常由维护流程运行。

`WorkingState` 是派生召回切面（规范 §66.7）：它以其声明的基准对外提供，在并非事务快照一致时绝不伪称一致。它是认知的视图，而非认知的来源：

```text
WorkingState 绝不能佐证自身输入
WorkingState 回答“我的当前处境如何”；SelfModel 回答“我是谁”
```

一个 Space 在每个行动者及规范任务/上下文作用域内，在稳定的 `key` 下应当至多保留一个处于活动状态的 WorkingState；MemoryScope 记录该作用域。生产它的 Activity 锚定 DependencyBasis 与完整的 ProjectionBasis；消费方在声称当前情境之前必须校验基准及所有增量变更页（规范 §21.12、§57.6）。

---

# 6. 标准 Facet

## 6.1 MnemonicState（记忆状态）

挂载于 Concept 上（包括 Skill），管理其记忆生命周期信号：

```json
{
  "memory_strength": 0.8,
  "salience": 0.9,
  "utility": 0.6,
  "last_metabolized_at": "2026-08-14T00:00:00.000Z",
  "strength_policy": {"artifact_ref": "kip:strength-half-life-30d", "content_digest": "sha256:..."}
}
```

```text
置信度 confidence ≠ 记忆强度 memory_strength
显著性 salience ≠ 信任度 trust
效用 utility ≠ 事实真值、显著性或权限许可
```

`memory_strength` 是最后显式写入的**基准**（base），`last_metabolized_at` 是其**锚点**（anchor），`strength_policy` 是钉固的策略工件（`schemas/kip-cognitive-records.schema.json#/$defs/StrengthPolicy`）。只读计算成员 `effective_strength`（规范 §18.2）在读取评估时由此三者派生计算得出，当其中任何一项缺失时为 `null` —— 即未知，绝不可填充默认值（例如 `0.5`，规范 §59.1）。读取绝不会将其写回。因此，闲置的记忆不产生写入开销。

标准强度策略为 `kip:strength-half-life-30d`（`profiles/policy-strength-half-life-30d.json`），钉固为 `{"artifact_ref": "kip:strength-half-life-30d", "content_digest": <其摘要>}`。`half_life` 策略的计算为

```text
effective_strength = memory_strength × 2^(−max(0, t − last_metabolized_at) / half_life_ms)
```

其中 `t` 是读取被评估的时刻 —— 绝不是 `FOR TIME`，因为强度描述的是记忆当下的可及程度，而不是关于世界的主张。锚点之前的值即为基准。运行时按 `artifact_ref` 解析该钉固并校验其摘要；未知的策略或不匹配的摘要使 `effective_strength` 为 `null`，且绝不替换为另一策略。部署**可以**钉固其自有的同形工件；解析同一钉固的两个运行时计算出相同的值。

记忆代谢**严禁篡改断言置信度**、信任度、有效时间或治理权限。

强化与效用校准是显式变更。使用仅通过两个显式通道触达记忆：将其列在 `used_refs` 中的 DecisionRecord（§6.4），以及在有保留时的曝光日志（规范 §66.8）。单纯的读取绝不会触达（规范 §2.13）。效用校准沿着决策链接从后果反向追踪到该决策所使用的记忆，并记录其归因方法；后果没有其他途径可以影响记忆的 `utility`。

技能同样承载该 Facet。技能的预期可用性是 `MnemonicState.utility`，在编译时设为准入预估；其评分记录则是计算得出的 GradingState 视图（§6.2）。

---

## 6.2 GradingState（计算视图）

```json
{
  "revision_ref": "R-1",
  "evaluation_ref": "EV-1",
  "success_count": 8,
  "failure_count": 2,
  "graded_count": 11,
  "last_verdict_at": "2026-08-10T00:00:00.000Z"
}
```

GradingState 是对技能的 `current_evaluation` 所引用的 EvaluationRecord（针对其 `current_revision`）的**只读计算视图**（规范 §18.2）。计数是在每个度量指标与时间窗口内聚合的独立尝试，包括试验缺失策略下的部分完成、中止与未知结果；对同一次尝试的多次观察绝不会增加样本数。在存在经验证的评估之前它处于缺失状态，不可写入，且既非真值概率亦非执行权限。Insight 没有 GradingState。

它的缺失并不将处于 `proposed` 或 `trialed` 状态的技能排除在召回之外：此类技能是未经证实的候选者。其评估与当前修订版本不匹配或无法验证的视图，不能赋予经验证的地位（BrainRecall §16）。

---

## 6.3 OutcomeRecord（结果记录）

挂载于 `outcome` 类的结果证据（Outcome Evidence）上的不可变仪器化索引：

```text
task_family, attempt_ref (可为空，用于纯数据流观察)
metric, window, terminal, observation_key, observer_config_digest
outcome_status: success | partial | failure | aborted | unknown
magnitude (可选)
```

规范数值形态定义于 `kip-cognitive-records.schema.json#/$defs/OutcomeRecord`；其打分规则参见配套规范[验证性学习](../brain/KIP-2.0-Validated-Learning_CN.md) §3。实际尝试与预先存在的决策由观测 Activity 链接。空的 attempt_ref 使结果保持未评分，绝不自动充当对照组。

---

## 6.4 DecisionRecord（决策记录）

不可变地挂载于终态 `action_gate` 活动上：

```text
decision: act | ask | defer | silence
rationale (可选的简要说明)
retrieved_refs: 提供给智能体的候选记忆
used_refs: 实际使用的记忆
applied_revisions: 确切的 SkillRevision ID，亦记录在 Activity.inputs
basis: 完备的 ProjectionBasis
```

仅被检索并不获得结果功劳归属。联合修订版本构成处理包，除非评估归因方法将其解耦。DecisionRecord 记录决策，绝非权限。

---

## 6.5 过程记录与运行时状态 (Process records and runtime state)

`../schemas/kip-cognitive-records.schema.json` 中的规范字段形态同时受到模式包中 `value_schema` 定义的约束：

| 切面 (Facet) | 挂载对象 (Attachment) | 契约 (Contract) |
| --- | --- | --- |
| DependencyBasis | 产出活动或 dependency_validation 活动 | 规范 §57.6–§57.7 |
| RecordingRepair | recording_repair 活动 | 规范 §57.8 |
| CompressionRecord | 编码/形成活动 | §10.1 |
| RecallCoverage | 显式记录的 recall_coverage 活动 | §20.2 |
| MemoryScope | 捕获的源及其形成产物 | §20.3 |
| AttemptRecord | action_attempt 活动 | 验证性学习 §2 |
| TrialRecord | 已完成的 trial_open 活动 | 验证性学习 §4 |
| EvaluationRecord | 已完成的 lifecycle_verdict 活动 | 验证性学习 §4 |
| ProcedureAssessment | assessment 活动 | 验证性学习 §5 |
| WatchState | Watch | 大脑运行时 §2 |
| LeaseState | SleepTask | 大脑运行时 §3 |
| RestoreReport | restore 活动 | 胶囊 §41.7 |

DependencyBasis 是过程记录上的不可变内容，不是重写断言前提的后门。所有普通的派生召回在读取工件之前都会计算 `_system.dependency_validity`（规范 §57.6）；缺失或不完整的基准为 `unverifiable`。WatchState 与 LeaseState 是由运行时校验的操作状态，而不是赋予权限的作者主张。

语义遗忘工作流需对照配套模式校验 ErasurePlan（规范 §60.7）；仅限有效载荷的清除属于更窄的作用域，不能声称实现了语义遗忘。

---

# 7. 标准结构字段

结构字段是图拓扑连接，不是语义命题。

```text
experienced_by     Experience → Person
has_step           Experience → ExperienceStep (有序)
involves           Event/Experience → 相关 Person/Concept
mentions           Event/Experience/Insight → Concept
committed_to       Commitment → Person
owed_to            Commitment → Person
assigned_to        SleepTask/Watch → 语义行动者
watches            Watch → 观察的认知目标
about              Profile 工件 → 主题 Concept
current_revision   Skill → SkillRevision
revision_of        SkillRevision → Skill
current_trial      Skill → trial_open Activity (可选指针)
current_evaluation Skill → lifecycle_verdict Activity (可选指针)
```

四个传统谱系字段（`derived_from`、`compiled_from`、`compiled_by` 与 `consolidated_to`）不再是存储的结构引用：它们是直接从产出活动的 `inputs` 与 `outputs` 计算得出的只读视图（§8.2）。

标准语义谓词（用于 Proposition + Assertion + Evidence）：

```text
prefers    Person → Concept                     稳定偏好主张，按选项类别分区（§5.5）
caused_by  ExperienceStep → ExperienceStep      结果 → 原因主张；仅凭步骤顺序不构成因果
same_as    Concept → Concept                    未核验的同一性主张
```

`same_as` 为身份审阅提供输入（类似维护 §15 风格的工作流）；它绝不自动合并 Concept，也绝不凭自身确立 `canonical_id`。

`caused_by` 的方向为 结果 → 原因。绝不可将步骤顺序（`has_step` 边的索引）直接提升为 `caused_by` 主张。

领域特定的事实谓词来自领域包，而不是来自本 Profile。最小通用包 `kip://domains/general@1.0.0`（`profiles/general-domain-1.0.0.schema.json`）提供了人员、地点和组织；遇到没有任何已安装包命名的关系时，Brain 可扩展 Space 的草稿词汇（规范 §20.16）。

---

# 8. 证据与溯源 (Evidence & Provenance)

## 8.1 后果通道 (The consequence channel)

后果通道具有两套解耦的连接机制：

```text
流 (stream)       OutcomeRecord.task_family
                  寻找候选可比后果流，确定试用裁决的对比基线

归因 (attribution) outcome_observation Activity {inputs: 尝试活动与决策活动, outputs: 结果证据}
                  明确指明被该结果打分的具体单次决策与实际尝试；
                  决策活动的 inputs 包含所应用的技能修订版本与引用的记忆
```

后果通道向四个消费者提供数据，全部遵循相同的纪律约束：

```text
技能生命周期裁决        §14   独立尝试聚合结果对比不可变的 TrialRecord 基线
                              （配套规范：验证性学习）
GradingState 视图       §6.2  从裁决的评估中计算得出：仅限关联的结果
MnemonicState.utility   §6.1  准入效用下注，依据决策的 used_refs 被证实或浪费
信任度校准              规范 §22.6
```

纪律约束：

- 行动执行模型绝不能编写用于评估自身行动的结果证据；其自述属于 `agent_statement`，仅可作为上下文引用。
- 用于评估某项决策的结果必须与该决策相链接：仪器的 `outcome_observation` 活动将其决策活动列入 `inputs`，并将结果证据列入 `outputs`。统计计数或裁决仅能通过该链接变更，且按独立尝试与所分配的试用/修订版本聚合。效用校准额外记录其归因方法与不确定性；仅被检索的输入项不自动获得功劳。不具备尝试/决策链接的结果保留为普通流素材；其缺乏归因既不能证明属于处理组，也不能证明属于对照组。它绝不自动进入基线。
- 待打分的决策必须作为携带 `DecisionRecord`（§6.4）的 `action_gate` 活动存在，其 `inputs` 指明所应用的认知。未设网关的行动不留存任何供后果打分的内容。
- 任务族名称由部署策略决定；名称应当稳定、带命名空间且数量适度以累积打分历史。
- 消费者必须验证其打分结果的溯源链，并拒绝溯源不符合其策略的结果 —— 该通道是可审计的，而非不可伪造的。行动主体同时持有 `record_outcome` 权限的部署在结构上属于自我打分，必须能够从 `_system.origin` 中明确识别。

## 8.2 派生工件契约 (Derived artifacts)

`Insight`、`Skill`、`SkillRevision`、`SelfModel` 与 `WorkingState` 属于**派生工件**：即从其他认知编译而来的认知，而非直接观察到的认知。它们的类型保持独立 —— 其字段、召回视图与生命周期各不相同 —— 但遵循统一的契约：

1. **谱系仅记录一次**：生成派生工件的 Activity 将其源节点列入 `inputs`，并携带 DependencyBasis（规范 §57.6）。这是唯一的谱系记录；`derived_from`、`compiled_from`、`compiled_by` 与 `consolidated_to` 由此计算得出（§7）。没有产出活动的工件是对 Brain 自身历史的无支撑主张，其依赖有效性为 `unverifiable`。
2. **当前性是计算得出的**：每次读取都会计算 `_system.dependency_validity`（规范 §57.6）：修订的源根节点使该工件在下一次读取时变为 `needs_review`，发生在任何维护运行之前。没有任何存储的标志可以替代该计算。
3. **源节点修订；工件不自动跟随**：撤回、取代或更正源根节点仅会改变认知投影（规范 §57.5）。维护通过 `LIST DEPENDENTS`（规范 §63.5）找到受影响的工件，排队一个 `review_derived` SleepTask，并通过复审解决：重新验证（`dependency_validation` 活动）、通过具有自身谱系的新工件替换，或执行普通的生命周期操作。
4. **多层推导不构成佐证**：无论经过多少层转换将工件与其 Evidence 隔开，其支持基础仍是源根节点集合（§8）；消费者统计根节点，而不是层级。
5. **唯有后果能够驱动晋升**：Skill 是唯一由后果通道驱动打分晋升的派生工件（§8.1、§14）。Insight 和 SelfModel 通过其 Evidence 根节点获得信任，并按计划复审（§18）；它们不存在后果统计计数，因此没有任何机制能够晋升它们。

---

# 9. 活动 (Activities)

推荐的 Activity 类：

```text
experience_formation      semantic_consolidation    procedural_consolidation
reflection                skill_compilation         skill_validation
self_model_refresh        mnemonic_metabolism       commitment_review
watch_fire                action_gate               action_attempt
dependency_validation     working_state_refresh     outcome_observation
lifecycle_verdict         recording_repair          assessment
trial_open
```

`action_gate` 记录达成的行动裁决（包括刻意的沉默），其 `inputs` 指名所咨询的确切 SkillRevision 与记忆，其 Facet 携带 `DecisionRecord`（§6.4）。

`outcome_observation` 记录仪器写入的结果，`inputs` 指向对应的尝试与 `action_gate` 决策。其关联行动者为仪器的语义 Concept；认证的主体记录在引擎 origin 中，绝不占用 Concept 引用槽位。它绝不冒充被评定的行动者，写入它需要 `record_outcome` 权限（规范 §29.8）。

`lifecycle_verdict` 评估后果流并写入不可变的 EvaluationRecord；技能的 `current_evaluation` 指向它。TrialRecord 冻结比对基线；`current_trial` 选择当前活动的试用。运行时校验与记录的规则执行二者缺一不可；仅凭带有该类名的作者自建活动无法自行晋升技能。参见配套规范[验证性学习](../brain/KIP-2.0-Validated-Learning_CN.md) §4。

`recording_repair` 记录对录入错误的修复，携带 RecordingRepair 记录（规范 §57.8）。

`trial_open` 开启一次试用并携带不可变的 TrialRecord；技能的 `current_trial` 指向它。

`assessment` 记录轻量级的过程性评定，携带 ProcedureAssessment 记录。

---

# 10. 事件形成 (Event Formation)

Event 应当简洁明了：时间戳、参与主体、事件摘要、上下文及证据引用。日常平凡回复可不产生 Event。

## 10.1 CompressionRecord（压缩记录）

当形成或编码操作压缩长文本或媒体有效载荷时，其产出活动携带 CompressionRecord，指明保留字段、遗漏内容与重编码资格（`kip-cognitive-records.schema.json#/$defs/CompressionRecord`）。这记录了表示层的信息取舍，而不是认识论上的信念改变。

---

# 11. 经验形成 (Experience Formation)

尽可能在单次原子事务中连贯构建：

```text
源证据 Evidence
+ Experience
+ ExperienceSteps
+ MnemonicState
+ experience_formation Activity
+ 可选的 Event
+ 可选的语义 Assertions
```

失败经历与成功经历同等对待，详尽记录失败上下文与教训。

---

# 12. 语义巩固 (Semantic Consolidation)

语义巩固探寻：**积累的经验支撑了何种可重用的陈述性事实规则？**

严禁改写历史断言置信度或删除反面证据。

---

# 13. 程序性巩固 (Procedural Consolidation)

程序性巩固探寻：**何种行为策略在何种前置条件下被证实有效？**

```text
成功经历
+ 失败经历
+ 反例
→ 对比
→ 提议的 Skill + 不可变 SkillRevision (携带 task_family)
→ 试用 (§14)
```

单次成功的经验通常不足以证明通用的程序可靠性。

巩固过程**必须**在提议时将 `task_family` 附加至不可变修订版本，且**必须**拒绝产出不带任务族的技能：无法被证伪打分的模式不属于程序性记忆，应存放为 Insight。

---

# 14. 技能生命周期 (Skill Lifecycle)

生命周期流转由配套规范[验证性学习](../brain/KIP-2.0-Validated-Learning_CN.md)运行。其生命周期状态为：

```text
proposed   已编译，当前修订版本携带 task_family；未经证实
trialed    处于前瞻性或回顾性试用中
adopted    经由经验证的评估晋升；暂定状态
revoked    经由评估或反例降级废弃；记录予以保留
```

召回报告**资格地位**（standing），作为生命周期的视图：

```text
proposed, trialed                                  unproven（未经证实）
adopted 且具备匹配、可验证的评估                   validated（经验证）
adopted 但不具备匹配、可验证的评估                 unverifiable（无法验证）
revoked                                            revoked（已废弃）
```

约束所有 Brain 的规则（无论是否具备配套规范）：

1. **确定性流转**：晋升与降级由读取评分结果证据的确定性代码执行 —— 绝不由作者断言、衰减或行动模型的自主判断执行。Brain 负责提议、编译和叙述；绝不自行晋升。
2. **废弃不难于采纳**：降级门槛不得高于晋升门槛。只能习得而无法废弃的生命周期无法区分习惯与迷信。
3. **采纳是暂定的**：被采纳的 Skill 保持订阅其后果流；部署应当定义重新裁决触发条件 —— 结果计数、时间窗口或对该任务族的 Watch。
4. **评分词汇**：区分匹配条件下的成功、匹配条件下的失败、非匹配条件下的失败以及未知结果。匹配条件下的失败会降低 utility、增加失败模式和反例、收窄适用范围或降级；非匹配失败收窄适用范围而不惩罚该程序。
5. **依赖有效性是正交的**：其溯源根节点被修订的 Skill 变为 `needs_review`（规范 §57.6），无论其资格地位如何，且该复审可能开启重新试用。
6. **计分前严格归因**：仅共享 `task_family` 的结果绝不能改变 Skill 的资格地位或其 GradingState 视图；同一任务族中的两个 Skill 由各自的决策评分，绝不互相借用。

生命周期状态绝不授予执行权限。采纳代表资格地位，而非权限许可。

---

# 15. 偏好巩固 (Preference Consolidation)

区分单次陈述的偏好、重复行为、特定上下文偏好、跨上下文的稳定模式、反例以及显式更正。

显式陈述保持为 Evidence + Assertions。对稳定模式的摘要是 Insight（§5.5），绝不替代历史。

发生变更的偏好是自变更发生时起的一条新的 `prefers` Assertion，携带 `at`（陈述发生的时间），使其起始键为该人员表达该偏好的时间，而不是 Brain 记录该偏好的时间（规范 §13.2）；时间继承（规范 §25.4）在同类选项内终结旧偏好，而旧偏好在其所属的时间段内依然有效。仅限特定任务的偏好（例如“在此仓库中使用制表符缩进”）限定在该任务的上下文范围内，并在 `kip:memory-default` 下在该范围内优先胜出（规范 §21.13），而无需替代通用偏好。

---

# 16. 自我模型构建 (Self-Model Formation)

SelfModel 构建应当保持审慎。优先依赖多次观察、显式用户反馈或明确的重复模式。严禁妄加揣测或越权声称权限。

---

# 17. 承诺语义 (Commitment Semantics)

到期时间的推移不会自动流转状态，直至策略或证据执行流转。即使近期未被召回，承诺仍可保持高显著性。单纯闲置绝不是削弱其重要性的理由。

承诺的等待半边 —— 如果没有发生任何事则升级 —— 是通过 `watches` 引用该承诺的 Watch（§5.11）。到期日保留在承诺上；触发条件保留在 Watch 上。不带 Watch 的承诺由 Maintenance 的复审提升到注意力中：对每个发现到期的承诺写入一个 `commitment_review` 活动，其 `inputs` 指名该承诺，其 `client_key` 为 `commitment_review:<承诺 id>:<due_at>`（§5.7）。该复审即是其 `space_seq` 为该注意力项定序的提交。该键使复审具备幂等性，正如 `watch_fire` 键使触发具备幂等性：对同一承诺、同一 `due_at` 的并发或后续复审会重放该活动，而不会再次提升它，因此一个到期承诺在每个到期时间只进入注意力一次，而改期后的承诺（新的 `due_at`）可以再次被提升。不再处于 `pending` 或 `blocked` 的承诺不会被提升。

---

# 18. 记忆代谢 (Mnemonic Metabolism)

典型合法变更：

```text
memory_strength 基准 ↑/↓ 以及新锚点（强化、显式弱化）
salience 调整
utility 校准
归档资格判定
复审计划调度
```

衰减是计算得出的，而不是写入的：`effective_strength`（§6.1）在钉固的 `strength_policy` 下随时间推移而下降，无需定时巡检（sweep）、无需 Change Envelope 且无需失效处理。维护仅在具备显式信号时写入新基准 —— DecisionRecord 的 `used_refs`、曝光日志批次（规范 §66.8）、更正 —— 并同时写入基准与锚点（规范 §59.1）。缺失基准、锚点或策略使强度保持为未知；绝不可填充默认值。

通用基于时间的衰减绝不能变更断言置信度。

```text
新认识论证据 → 新 Assertion（变更对应继承，更正对应取代）
过时 → 认知投影新鲜度/有效性
遗忘 → 有效强度，继而归档 / 墓碑 / 清除
准入下注的浪费或证实 → utility
存储生命周期 → 留存/归档/墓碑/清除
```

---

# 19. 存储留存指南 (Retention Guidance)

典型倾向：

```text
Person/稳定身份       持久保留
Commitment           在生命周期内持久保留
Skill                在有用/可审计期间持久保留
SelfModel            持久保留/版本化
WorkingState         持久保留/版本化；被取代的摘要可归档
Experience           按学习价值属于标准/持久保留
Event                标准；可归档
ExperienceStep       跟随 Experience
SleepTask            标准；终态可归档
Watch                标准；终态可归档
Evidence             特定于策略；溯源通常倾向于持久保留
                     （有效载荷字节可单独清除，规范 §60.6）
```

留存策略严禁为了提升未来的认知投影表现而恶意物理清除反面证据。

---

# 20. 召回视图 (Recall Views)

## 20.1 视图分类

Profile 支持：

```text
情节召回 (Episodic Recall)   = Event + 精选 Evidence
经验召回 (Experience Recall) = Experience + 有序 Steps + 结果
程序召回 (Procedural Recall) = Skill + 适用条件 + 资格地位 (§14) + utility + 正向/反向 Experience
行动简报 (Action Briefing)   = 已接受知识 + 争议假设 + 技能 + 成功/失败案例 + 承诺 + 约束警告
苏醒简报 (Wake Briefing)     = WorkingState + 基于其 basis_seq 的变更流 + 触发的注意力
```

召回默认使用 `kip:memory-default`（规范 §21.13），除非请求或部署指定了其他策略。使用结果的智能体保持最终行动权限，除非独立治理另有授予。

## 20.2 召回覆盖度与计划

召回独立查询显式约束与承诺、依赖警告、失败与反例、正向经验、技能以及语义证据。简报的 **RecallCoverage** 声明已完成的通道、其基准、截断情况与未核验的前置条件，并为每个通道记录一份 **RecallPlan**：钉固内容摘要的选取器、规范作用域、方法、快照/索引/覆盖水位线、授权视图、完成与截断原因。

- 宿主根据任务和版本化策略决定所需通道；模型不能省略约束来为其自身行动赋予资格。约束、承诺和前置有效性使用确切的授权选取器。
- 近似经验或语义检索 —— 包括搜索模式（Search Pattern，规范 §43.8）—— 可以完成其声明的有界计划；但这绝非声称语义详尽无遗。近似选取与未决的源解释应分开报告。仅凭索引水位线不能确立源处理或约束覆盖。
- 绝不能为了给得分更高的技能腾出空间而放弃必需的约束和适用的关键警告。预算耗尽将返回不完整的覆盖并阻止无支撑的自动行动。
- `action_eligible` 需要完整满足强制性精确通道、已满足的源屏障以及在一致当前基准下的必要前置条件。非关键的可选检索可以保持部分完成并仍有助于审议，但无法服务的通道属于不完整（incomplete），绝不是 `not_applicable`。完整（complete）意味着已覆盖授权记录的全局认知，而非找到了世界上所有相关记忆；特权全局闭包属于独立的检查（规范 §63.5）。
- 处于提议（proposed）和试用（trialed）状态的技能保持为标记为未经证实的召回候选。展示的评级绑定 `current_revision` 和经验证的 EvaluationRecord；缺失或不匹配的证据不能赋予经验证的资格地位或执行权限。

召回是只读的。检索遥测显式记录在曝光日志或记录的 `recall_coverage` 活动中，且自身绝不强化置信度、记忆强度或效用。

## 20.3 记忆作用域 (Memory scope)

捕获的源及其形成产物上的 `MemoryScope` 记录宿主映射的规范 `task_ref` 与 `context_refs`。适用的 `Assertion.context_refs` 与 `DependencyBasis.policy_basis` 与之一致。作用域跟随提取与巩固进入证据、事件、经验、承诺及派生摘要，而不仅限于断言。共享的真实中立命题没有任务所有者：其在某一作用域内的适格性来自每条断言，且 MemoryScope 绝不能分裂规范命题的身份。合并作用域绝不会扩大适格性；跨任务泛化是显式归因的新派生工件，受策略和源限制约束。WorkingState 键包括行动者和规范任务/上下文作用域。语义作用域不是所有权或授权许可；MemorySpace 和当前 Governance 仍然适用。

---

# 21. 数据可移植性 (Portability)

承载 Profile 认知的 Cognitive Capsule 应当保留确切的 Profile Package 引用、类型、Facet、结构引用、证据/溯源闭包、源身份以及可导出的留存状态。

目标系统导入**严禁自动转移源系统的 self 身份、源信任度、技能权限、工具权限或 Governance 策略**。在普通合并导入下，远程自传体记忆保持为远程自传。

导入的 SkillRevision 保留行为与溯源，但在本地不获得本地资格地位或试验分配。源回放工件可保持可读，但绝不是本地评分。

源系统的 Watch 和 WorkingState 属于该大脑的注意力和情境：在普通合并导入下，它们到达时处于 disarmed（解除设防）和非当前状态。目标系统重新设防其自身注意力并重建其自身工作全貌。

生命周期资格地位同样不予转移：无论源状态如何声明，导入的技能进入 `proposed` 状态，且不带 `current_trial` 或 `current_evaluation`。其胶囊可承载源系统的结果历史作为值得阅读的证据 —— 这不是本地评分，它到达时带有目标系统的 origin 而不是仪器的 origin，且绝不计入本地裁决。

---

# 22. 一致性测试要求 (Conformance Expectations)

Profile 一致性测试 Experience/Step 结构合法性、失败经历保留、MnemonicState 可变性与计算得出的有效强度、置信度与记忆强度解耦、只读 GradingState 视图与计算得出的谱系字段、技能权限非放大性、胶囊可移植性、SelfModel 非权限性、承诺生命周期、Watch 非权限性、召回前的依赖有效性校验、WorkingState 非证据性、DecisionRecord 非授权性、经验形成原子性、程序溯源、同类别内的偏好继承与按类别为选项定型、结果来源隔离（自评不计分）、结果归因严密性（没有决策链接的结果绝不改变资格地位，且同一任务族的成员结果绝不为另一个技能打分）、试用准入必须具备任务族、以及导入时不继承生命周期资格地位。配套规范[验证性学习](../brain/KIP-2.0-Validated-Learning_CN.md)与[大脑运行时](../brain/KIP-2.0-Brain-Runtime_CN.md)包含各自的验收章节。

---

# 23. Profile 核心不变式

本 Profile 的 49 条核心不变量完整收录于公共注册表 [KIP-2.0-Invariants_CN.md](../KIP-2.0-Invariants_CN.md) 的 Part B 中，编号为 `P1`–`P49`；每行标明了确立该不变量的章节及钉住该不变量的一致性测试向量。同一注册表的 Part A 为规范 §102 的清单，任何运行本 Profile 的底层运行时均已必须满足。

---

# 24. 极简 Profile 摘要

```text
Cognitive Memory Profile 2.0

Event: 发生了什么的紧凑客观记录
Experience: 目标导向的状态/行动/观察轨迹
ExperienceStep: 有序的客观可观测步骤；无隐藏思维链
caused_by: 步骤间显式的 结果→原因 命题主张；边顺序不代表因果
prefers: 同一类别选项间的偏好；较新者在所属类别内继承旧者
Insight: 从记忆中沉淀出的陈述性教训
Skill: 稳定的身份与 current_revision；SkillRevision: 不可变的行为/task_family/摘要
Skill 资格地位: unproven | validated | unverifiable | revoked；绝非权限
Commitment: 前瞻性记忆与承诺
Watch: 设防的注意力 —— 值得唤醒的状态差分或静默；触发不赋予任何权限
SelfModel: 关于自身的派生自省认知；非治理面
WorkingState: 当前关键上下文，以 basis_seq 标记；绝非 Evidence
MnemonicState: memory_strength 基准 + 锚点 + 策略 → 计算得出的 effective_strength；salience；utility
GradingState: 当前评估的计算视图；绝不写入
DecisionRecord: action_gate 活动上的 act|ask|defer|silence；检索 vs 使用 vs 应用；非授权
OutcomeRecord: 结果证据上的 task_family + outcome_status；由仪器编写，绝非行动者自身
derived_from / compiled_from / consolidated_to: 从 Activity 溯源计算得出
依赖有效性 (dependency validity): 每次读取时计算得出；needs_review 不代表撤回

涉真事实使用 Proposition + Assertion + Evidence 表达。
世界变迁对应一条新断言；更正对应取代；录入错误予以修复。
认知转换完整保留 Activity 溯源。
```

---

# 25. 终极准则

> **认知记忆 Profile 的使命，是使过往的记忆在结构上高度可重用，同时绝不将记忆的可访问性、认识论信念、自传体身份或程序性效用，与执行权限混为一谈。**
