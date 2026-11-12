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

KIP Core 定义安全的认知原语：

```text
Concept
Proposition
Assertion
Evidence
Activity
MemorySpace
Schema
Governance
Transaction
Capsule
```

认知记忆 Profile 在其之上定义可复用的记忆词汇表：

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

> **Core 定义认知的真值、溯源、权限与持久性语义；Profile 定义可移植的记忆形态。**

本 Profile 不强制规定任何单一的形成、排序、巩固或遗忘算法。

---

# 1. 设计目标

本 Profile **应当**支持可移植的情节记忆、目标导向的经验、程序性记忆、前瞻记忆、注意力状态、偏好模式、自我反思所得的教训、自我模型工件、工作状态、记忆可及性、程序效用、经评定的后果以及维护任务。

它**应当**使以下问题可以得到回答：

```text
发生了什么？
行动者经历了什么？
行动者学到了什么？
什么做法往往奏效？
什么失败了？
我们行动之后，世界发生了什么？
什么赢得了采纳——什么又失去了它？
什么仍然悬而未决？
什么变化——或什么沉默——值得注意？
当前的工作图景是什么？
什么应当更容易被回忆起来？
自我模型中有什么发生了变化？
```

---

# 2. 非设计目标

本 Profile 不定义人类记忆理论、隐藏的思维链、通用本体、某一种嵌入/排序模型、某一种睡眠调度、某一种显著性算法、某一种技能编译器、某一种采纳阈值或对照构造方式、工具权限、Governance 权限或来源信任策略。

Profile 元素可以描述一个程序，而不被授权执行它。

---

# 3. 与 Core 的核心边界

Profile **必须**保持以下界限：

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

Profile 的 Facet 与结构字段**严禁**绕过 Core 的不可变性、起源、Governance 治理或认知语义。

---

# 4. Profile 模式包

机器可读发布**应当**使用不可变模式包：

```text
package_id  = kip://profiles/cognitive-memory
version     = 2.0.0
package_ref = kip://profiles/cognitive-memory@2.0.0
```

持久化精确的 Profile 引用。本地别名保持为面向模型的便利工具。

---

# 5. 标准概念类型 (Concept Types)

## 5.1 Person（人物/主体）

认知内容中使用的语义人物/行动者。

```text
Person ≠ PrincipalRecord ≠ ActorBinding
```

推荐的属性包括 `display_name`、别名与描述。跨系统的 `canonical_id` 只应在经过更强的身份验证之后使用；未经验证的身份主张以 `same_as` 谓词（Proposition + Assertion）表达，并在任何合并之前接受审查。

---

## 5.2 Event（事件）

**Event 是一个紧凑的情节锚点，描述在一个有边界的情境中发生了什么。**

推荐字段：

```text
event_class
summary
started_at
ended_at
outcome_status
outcome_summary
context_summary
```

Event 回答**发生了什么**。它不需要完整的状态-行动-观测路径。

---

## 5.3 Experience（经验）

**Experience 是行动者经由状态、行动、观测、反馈与结果所走过的一段有边界的目标导向轨迹。**

概念上：

```text
E = (g, b0, a0, o1, b1, a1, o2, ..., y, δ)
```

其中 `g` 为目标，`b` 为可外部表征的状态/信念上下文，`a` 为行动，`o` 为观测，`y` 为结果，`δ` 为反馈/意外/预测误差。

推荐字段：

```text
experience_class
goal
initial_state_summary
outcome_status
outcome_summary
started_at
ended_at
step_count
surprise
learning_value
consolidation_status
```

建议的 `outcome_status`：

```text
success | partial | failure | aborted | unknown
```

建议的 `consolidation_status`：

```text
pending | semantic | procedural | completed | archived
```

当路径本身具有未来价值时创建 Experience：多步骤的目标追求、失败/恢复、预期被违背、策略变更、重要的工具交互、纠正性反馈、新颖的程序或反例。

---

## 5.4 ExperienceStep（经验步骤）

Experience 中的一个有序单元。

推荐字段：

```text
step_kind
summary
timestamp
tool
result_status
expected_observation
actual_observation
decision_summary
```

建议的类别：

```text
context | observation | decision | action | feedback | belief_update
```

`decision_summary` 可以存储简明、可复用的理由，但**严禁**要求隐藏的思维链。

步骤顺序存在于有序的 `has_step` 结构引用上：引擎为每个 Experience 维护从零开始的稠密顺序，通过结构化的 `{index: n}` 赋值写入（或追加），并以虚拟的 `?edge.index` 暴露给查询（规范 §17.4）。步骤不携带单独的顺序属性，因此顺序只有唯一的事实来源。

时间上的相邻并不证明因果。步骤之间的显式因果主张使用 `caused_by` 谓词，作为语义 Proposition + Assertion（`mode` 通常为 observed/inferred，并附 Evidence）。与任何主张一样，它可以被支持、反对或争议——这正是它不属于结构拓扑的原因。

---

## 5.5 偏好模式 (Preference patterns)

偏好是一项主张，而不是一种类型：“爱丽丝偏好深色模式”是带有爱丽丝的断言及其证据的 `prefers` 命题（§7），发生变更的偏好是其所属类别内的一条较新的断言（§15）。本 Profile 未定义独立的 Preference 概念。值得概括的相对稳定模式——作用域、稳定性、反例——是一条 `about` 该选项类别的 Insight（§5.6），如同其他 Insight 一样通过有记录的 Activity 派生；它绝不替代其所概括的主张历史，且召回始终从 `prefers` 槽位回答，而非从该概括中回答。

一个人可以偏好的每个选项都是按其类别定型的 Concept——某种配色方案、某种编辑器——因为该类型正是 `prefers` 进行分区的依据（规范 §20.15）。形成过程**严禁**使用包罗万象的兜底类型为选项定型；若尚无已安装的包为该类别命名，则先在草稿词汇中定义一个（规范 §20.16）。

---

## 5.6 Insight（洞见）

从 Evidence 或 Experience 派生的陈述性教训。它**应当**通过 Activity 保留其派生关系。若它具有真值可判定性，其主张还**应当**可以表示为 Proposition + Assertion。

---

## 5.7 Commitment（承诺）

一种前瞻记忆工件，表示义务、承诺、提醒、跟进事项或有意进行的未来行动。

推荐字段：

```text
summary
status
created_at
due_at
completed_at
priority
```

建议的生命周期：

```text
pending | fulfilled | cancelled | expired | blocked
```

使承诺变为到期或失效的条件是以该承诺为目标的 Watch（§5.11），而非其上的字段：Watch 是运行时求值的对象，承诺则保持为纯粹的前瞻性记录。

承诺只有通过提升它的提交才能进入业务智能体的注意力（记忆接口 §4）：监听其 `due_at` 的 Watch 触发（`watch_fire`），或 Maintenance 在其中将该承诺记录为到期的 `commitment_review` Activity（§17）。单凭 `due_at` 的流逝不会提升任何事项，因此每个注意力项都带有提升它的那次提交的 `space_seq`。

承诺属于认知，而非自动的外部执行。

---

## 5.8 Skill（技能）与 SkillRevision（技能修订版本）

**Skill 是稳定的程序性身份；SkillRevision 是实际被执行与评估的不可变行为。** Skill 持有 `skill_class`、`summary`、注释及其生命周期 `status`。必填的 `current_revision` 指向一个 SkillRevision；该修订版本的 `revision_of` 指回这个 Skill。二者的创建是原子的，包括前向引用。可选的 `current_trial` 与 `current_evaluation` 指向承载当前资格地位背后不可变 TrialRecord 与 EvaluationRecord 的 Activity；它们仅由已验证学习配套规范的事务设置。

SkillRevision 包含必填的 `task_family`、`procedure`、`behavior_digest`，以及可选的 applicability、preconditions、success_criteria 与 recovery。其 behavior_digest 是除该摘要之外的规范化行为字段的 sha256。所有行为字段均不可变，且不得被 Skill 上的可变字段遮蔽。任务族是流选择句柄，绝不足以构成基线成员资格。无法评定的陈述性教训仍保持为 Insight。

生命周期保持为 `proposed → trialed → adopted → revoked`（§14），资格地位绑定到确切的修订版本。选定新行为会在一个受保护的事务中将当前资格地位重置为 `proposed` 并清空 `current_trial` 与 `current_evaluation`，而不改变旧的裁决。这是修订版本选择，而非晋升。注释与记忆代谢信号可以变更而不重置资格地位。试验、决策、结果与 Governance 权限均绑定确切的修订版本与行为摘要（已验证学习 §2）。导入的修订版本只能通过新的本地试验挣得本地资格地位。

---

## 5.9 SleepTask（睡眠任务）

持久的维护工作项。建议的类别包括 consolidate、review_conflict、review_skill、resolve_identity、review_retention、review_derived、review_schema、refresh_self_model 以及 inspect_quarantine。`review_schema` 将草稿词汇符号（规范 §20.16）排队以供审阅与晋升：定义符号的大脑为该符号排入一个睡眠任务，其 `client_key` 为 `review_schema:<kind>:<确切符号引用>`，其中 `kind` 为 `ConceptType` 或 `PredicateType`。任务同时指明类别和确切引用，因此不同类别即使同名也保持独立，而重试的定义绝不会重复排队。审阅可以把近义词并入既有符号的用法、提议晋升或了结该任务；只有持有 `manage_schema` 的主体才执行晋升。

在声明了 `durable_brain_runtime` 的实现中，SleepTask 的认领与完成遵循[大脑运行时配套规范](../brain/KIP-2.0-Brain-Runtime_CN.md) §3 的租约契约。

语义上分配给 `$system` 不授予权限。

---

## 5.10 SelfModel（自我模型）

一种派生工件，描述大脑当前对自身身份、能力、局限、价值观、偏好、习惯、关系与目标的模型。

SelfModel 的内容**严禁**修改 Principal 身份、ActorBinding、Governance 策略、工具权限或 Schema 权限。

---

## 5.11 Watch（守望/关注警戒）

**Watch 是持久的注意力状态：一个声明的条件，在该条件下某项变化——或变化的缺席——值得大脑注意。**

推荐字段：

```text
watch_class
summary
condition
due_at
status
priority
created_at
fired_at
```

建议的类别：

```text
delta      当匹配的变更被提交时触发
silence    当 due_at 已过而没有匹配的变更时触发
```

建议的生命周期：

```text
armed → fired | expired | disarmed
```

`condition` 声明什么算作匹配的变更。其基线形式是针对变更信封（Change Envelope）条目的结构化过滤器（规范 §36.1），使声明了 `watch_evaluation` 的运行时无需读取载荷即可对其求值：

```json
{
  "element": "C-42",
  "slot": {"subject": "C-1", "predicate": "timezone"},
  "type": "Commitment",
  "ops": ["create", "lifecycle"],
  "touched": ["attributes.status"],
  "text": "any reply from Alice about the migration plan"
}
```

`element`、`slot` 与 `type` 选择被监听的对象（至少其一；`slot` 匹配其 `refs.proposition` 属于该主语–谓词槽位的 Assertion 条目，`type` 经由符号谱系解析）；`ops` 与 `touched` 收窄哪些条目算数，默认为任意。`text` 是结构化成员无法表达该条件时由维护流程解释的兜底形式；仅携带 `text` 的 Watch 由大脑求值，而非由运行时求值。

求值是一个差分循环：运行时或大脑将已提交的变更信封与处于设防状态的 Watch 集合进行比对；silence 型 Watch 在 `due_at` 已过而没有匹配时触发。求值者在可以断定沉默之前，**必须**已消费变更流直至 `due_at` 时刻的当前 `space_seq`：时钟本身证明不了任何事情，因为在截止时间之前提交的匹配变更可能仍在送达该求值者的途中，先凭时钟触发是一次误报，`formal/watch` 中的模型复现了这一情形。触发是一次原子迁移——一条 `watch_fire` Activity（inputs：该 Watch，以及在可表示时发生变更的元素或观测 Evidence；outputs：它所产生的 SleepTask 或通知工件）加上通过受保护的 `UPDATE ... EXPECT VERSION` 完成的 Watch `status` 变更——并且在并发求值者之下**必须**是幂等的：对于 delta 型 Watch，`watch_fire` Activity 的 `client_key` 为 `watch_fire:<watch id>:<arm_generation>:<匹配信封的 space_seq>`；对于 silence 型 Watch，为 `watch_fire:<watch id>:<arm_generation>:silence:<due_at>`，因此看到同一信封或同一已过截止时间的第二个求值者会重放该次触发，而不是触发两次。

**触发的 Watch 不授予任何东西。** 它产生注意力——通常是一个 SleepTask 或唤醒信号——绝不产生外部行动。大脑接下来所做的任何事情，都如同其他行为一样要通过行动网关（§9）与 Governance。

编码承诺之等待半边（“若周四前未收到回复则升级”）的 Watch 通过 `watches` 引用该承诺。承诺承载义务；Watch 承载触发条件。

触发的 Watch 通过记忆接口的注意力召回（记忆接口 §4）触达业务智能体。在声明了 `durable_brain_runtime` 的实现中，持久工作者的义务——设防世代、覆盖水位线、重启安全性——遵循[大脑运行时配套规范](../brain/KIP-2.0-Brain-Runtime_CN.md) §2。

---

## 5.12 WorkingState（工作状态）

**WorkingState 是对当下重要事项的一份派生的、带版本的摘要：苏醒的智能体从这份已巩固的状态恢复，而不是重新阅读原始历史。**

推荐字段：

```text
summary
horizon
basis_seq
refreshed_at
```

`basis_seq` 是构建该摘要时的 `space_seq`。于是苏醒时读取：

```text
DESCRIBE PRIMER               我是谁，使用什么词汇
WorkingState                  当下重要的是什么
CHANGES AFTER SEQ basis_seq   自它构建以来发生了什么变动
```

典型输入——即其 `working_state_refresh` Activity 的 inputs，可通过计算得出的 `derived_from` 字段（§7）读取——包括未决承诺、设防的 Watch、有争议的信念槽位、近期的高显著性 Event 以及活跃线程。刷新是一条 `working_state_refresh` Activity，通常由维护流程运行。

WorkingState 是派生召回面（规范 §66.7）：它连同其声明的基准一并提供，在并非事务快照一致时绝不呈现为一致。它是认知的视图，而非认知的来源：

```text
WorkingState 绝不被引为 Evidence
WorkingState 绝不佐证其自身的输入
WorkingState 回答“我的处境如何”；SelfModel 回答“我是谁”
```

一个 Space **应当**在每个行动者及规范任务/上下文作用域内，于稳定的 `key` 之下至多保留一个活跃的 WorkingState；MemoryScope 记录该作用域。产出它的 Activity 钉住 DependencyBasis 与完整的 ProjectionBasis；消费方在声称当前处境之前须校验该基准及所有增量页（规范 §21.12、§57.6）。

---

# 6. 标准 Facet

## 6.1 MnemonicState（记忆状态）

```json
{
  "memory_strength": 0.8,
  "salience": 0.9,
  "utility": 0.6,
  "last_metabolized_at": "2026-08-14T00:00:00.000Z",
  "strength_policy": {"artifact_ref": "kip:strength-half-life-30d", "content_digest": "sha256:..."}
}
```

`memory_strength` 回答该记忆对未来认知使用应当有多可及。`salience` 回答它有多重要/值得注意。`utility` 回答该记忆预期承载多少未来决策价值——即存储时所作的准入下注，随结果的到来而修订。

```text
memory_strength ≠ confidence（置信度）
salience ≠ trust（信任）
utility ≠ 真值、显著性或许可
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

规范数值形态定义于 `kip-cognitive-records.schema.json#/$defs/OutcomeRecord`；其打分规则参见配套规范[已验证学习](../brain/KIP-2.0-Validated-Learning_CN.md) §3。实际尝试与预先存在的决策由观测 Activity 链接。空的 attempt_ref 使结果保持未评分，绝不自动充当对照组。

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
| AttemptRecord | action_attempt 活动 | 已验证学习 §2 |
| TrialRecord | 已完成的 trial_open 活动 | 已验证学习 §4 |
| EvaluationRecord | 已完成的 lifecycle_verdict 活动 | 已验证学习 §4 |
| ProcedureAssessment | skill_validation 活动 | 已验证学习 §5 |
| WatchState | Watch | 大脑运行时 §2 |
| LeaseState | SleepTask | 大脑运行时 §3 |
| RestoreReport | import 活动 | 胶囊 §41.7 |

DependencyBasis 是过程记录上的不可变内容，不是重写断言前提的后门。所有普通的派生召回在读取工件之前都会计算 `_system.dependency_validity`（规范 §57.6）；缺失或不完整的基准为 `unverifiable`。WatchState 与 LeaseState 是由运行时校验的操作状态，而不是赋予权限的作者主张。

语义遗忘工作流需校验独立的 **ErasurePlan**（`../schemas/kip-cognitive-records.schema.json#/$defs/ErasurePlan`，规范 §60.7）；与上表中的切面不同，`ErasurePlan` 是控制/工作流契约而非元素切面（Facet），因为它统辖并在元素清除之后继续留存。仅限有效载荷的清除属于更窄的作用域，不能声称实现了语义遗忘。

---

# 7. 标准结构字段

结构字段是记录拓扑，不是语义命题。

```text
experienced_by     Experience → Person
has_step           Experience → ExperienceStep (有序)
involves           Event/Experience → 相关 Person/Concept
mentions           Event/Experience/Insight → Concept
current_revision   Skill → SkillRevision (必填，单值)
revision_of        SkillRevision → Skill (必填，单值)
current_trial      Skill → trial_open Activity (单值；已验证学习 §4)
current_evaluation Skill → lifecycle_verdict Activity (单值；已验证学习 §4)
committed_to       Commitment → Person
owed_to            Commitment → Person
assigned_to        SleepTask/Watch → 语义行动者
watches            Watch → 被观察的认知
about              Profile 工件 → 主题 Concept
```

四个谱系字段是**计算得出的**（规范 §18.2）：它们是 Activity 溯源的只读视图，而 Activity 溯源是派生谱系的唯一权威（规范 §63.5）。写入它们以 `ConstraintViolation` 失败；记录产出 Activity 及其 inputs 与 outputs，才是使它们出现的方式：

```text
derived_from       工件 → 产出它的终态 Activity 的 inputs
compiled_from      Skill/SkillRevision → 其编译 Activity 的 Experience inputs
compiled_by        Skill/SkillRevision → 编译 Activity 本身
consolidated_to    Event/Experience → 使用过它的巩固 Activity 的 outputs
```

`involves`、`mentions` 与 `about` 不应被用来伪装更强的领域关系。

本 Profile 还定义了三个标准**语义谓词**（对真值敏感；通过 Proposition + Assertion + Evidence 使用）：

```text
prefers    Person → Concept                     同一类别选项之间的偏好
caused_by  ExperienceStep → ExperienceStep      结果 → 原因主张
same_as    Concept → Concept                    未核验的同一性主张
```

`prefers` 声明 `functional_by: "object_type"`（规范 §20.15）：宾语的概念类型对槽位进行分区，因此偏好一种配色方案与偏好另一种配色方案相互竞争，而配色方案偏好与编辑器偏好可以共存。这只有在每个选项都按其类别定型时才成立（§5.5）：由领域包或 Space 的草稿词汇定义的 `ColorScheme` 与 `Editor`，绝不是诸如 `Topic` 之类的兜底类型——在那样的类型之下，每一项偏好都会与其他所有偏好竞争。同一类别内较新的偏好通过时间继承（规范 §25.4）接替较旧的偏好——“我现在偏好浅色模式”是一条断言，而不是一次撤回加一条断言。表示“喜欢若干个”的关系是另一个不同的谓词。

`same_as` 为身份审阅提供输入（类似维护 §15 风格的工作流）；它绝不自动合并 Concept，也绝不凭自身确立 `canonical_id`。

`caused_by` 的方向为 结果 → 原因。绝不可仅凭步骤顺序（`has_step` 边的索引）将其提升为 `caused_by` 主张。

领域特定的事实谓词来自领域包，而不是来自本 Profile。最小通用包 `kip://domains/general@1.0.0`（`profiles/general-domain-1.0.0.schema.json`）提供了人员、地点和组织；遇到没有任何包命名的关系时，Brain 扩展 Space 的草稿词汇（规范 §20.16）。

---

# 8. 证据与溯源 (Evidence & Provenance)

只要事实保真度重要，Profile 工件就**应当**保留与 Evidence 的链接。

```text
Event       ← 消息/工具 Evidence
Experience  ← 轨迹 Evidence
Insight     ← Experience/Evidence
Skill       ← 若干 Experience + 编译 Activity
SelfModel   ← 观测/Insight/Activity
```

反复转换不会产生独立的佐证。消息 → Event 摘要 → Experience 摘要 → Insight 可能仍然只有一个认知根。

## 8.1 后果通道 (The consequence channel)

以上的一切让系统得以观察世界。后果通道则是世界回望的方式：携带 `OutcomeRecord` Facet 的结果证据（规范 §15.7），由仪器化组件——遥测、验证器、测试工具链、工具、人工审查——在 `record_outcome` 权限（规范 §29.8）下写入。

该通道有两个联结，各司其职：

```text
流 (stream)        OutcomeRecord.task_family
                   寻找候选后果；TrialRecord 显式选定可比基线

归因 (attribution) outcome_observation Activity {inputs: 决策, outputs: 结果}
                   指名该结果所评定的那一次决策；决策的 inputs 指名
                   所应用的技能与所依据的记忆
```

后果通道向四个消费者提供数据，全部遵循相同的纪律约束：

```text
技能生命周期裁决        §14   独立尝试聚合结果对比不可变的 TrialRecord 基线
                              （配套规范：已验证学习）
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
derivation_review         dependency_validation     working_state_refresh
outcome_observation       trial_open                lifecycle_verdict
encoding_review           recall_coverage           identity_repair
erasure_review            recording_repair
```

Activity 记录溯源；Activity 不是事务。

`action_gate` Activity 是决策记录：它记录一次状态变更在任何对外动作发生之前所经过的决策。其 `DecisionRecord` Facet（§6.4）持有决策结果——`act`、`ask`、`defer` 或 `silence`——其 `inputs` 指名所应用的认知（触发因素、技能、简报所依据的记忆），其 `associated_actors` 指名由谁决定。记录 `defer` 与 `silence` 使克制变得可问责：“你为什么没告诉我”与“你为什么这么做”由同一份溯源来回答。网关阈值——哪些变更需要评估——属于大脑策略；低价值的噪声不需要网关记录，但要由后果通道评定的行动需要。

`outcome_observation` Activity 是摄取仪器对其写入结果证据及该证据所评定对象的记录——inputs：被观测决策的 `action_gate` Activity；outputs：结果证据。当该结果要计入任何技能、计数或校准时，该 input 是**必需的**；没有决策 input 的观测仅在流中记录一项后果。其关联行动者为仪器的语义 Concept；其经认证的 Principal 记录在引擎起源中，绝不占用 Concept 引用槽位。它不冒充被评定的行动者，写入它需要 `record_outcome`（规范 §29.8）。

`lifecycle_verdict` Activity 记录对后果流的一次确定性评估：其不可变的 EvaluationRecord 指名确切的修订版本、试验、所选的独立尝试与结果，以及一份保留的重放工件；技能的 `current_evaluation` 指向它。仅凭带有该类名的作者自建 Activity 无法晋升技能。其契约为[已验证学习配套规范](../brain/KIP-2.0-Validated-Learning_CN.md)。

---

# 10. 事件形成 (Event Formation)

Event **应当**紧凑：时间、参与者、摘要、结果、上下文、Evidence 引用。例行的应答可以不产生 Event。

## 10.1 编码记录 (Encoding records)

形成过程在配置的隐私与留存预算之内，记录它接纳、推迟或拒绝了什么以及原因。源 Evidence **可以**具有较短的留存窗口，而语义记录具有较长的留存窗口。其实体或 Schema 无法解析的材料**可以**保持为仅 Evidence——或通过草稿词汇（规范 §20.16）建模——而不是被强行归入一个猜测的类型，或被当作无价值而丢弃。

在信息损失事关重大之处，形成 Activity 携带一条 **CompressionRecord**：源引用、提取器与 Schema 版本、保留的字段、已知的遗漏以及重新编码资格。摘要无法恢复被遗漏的字节。载荷清除**必须**在留存策略下考虑尚未完成的重新编码与审阅需求，且绝不声称有损编码保留了所有未来有用的信息。

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

语义巩固探寻：**积累的证据支撑了何种可复用的陈述性规律？**

推荐流程：

```text
Experience/Evidence
→ 候选 Proposition
→ 派生 Assertion
→ semantic_consolidation Activity
```

它**严禁**改写旧断言的置信度、删除相互矛盾的 Evidence，或将同一根源的摘要计为独立 Evidence。

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

```text
proposed   已编译，当前修订版本携带其 task_family；尚未评定
trialed    结果流正在对照已记录的基线对其评定
adopted    经裁决晋升；暂定——结果流持续评定
revoked    经裁决、反例或策略降级；记录予以保留
```

允许的迁移：

```text
proposed → trialed    试验开启；要求具备 task_family；通过 current_trial 选定该试验
trialed  → adopted    基于独立尝试对照不可变基线的比较性裁决
trialed  → revoked    裁决、反例或策略
proposed → revoked    在试验之前撤下
adopted  → trialed    退化裁决；重新试验，而非赦免
adopted  → revoked    裁决；一次高严重度的匹配条件失败**可以**即已足够
revoked  → trialed    重新进入将开启一次新的试验；没有任何东西会悄然复活
```

除撤下（`proposed → revoked`）之外的每一次迁移都由[已验证学习配套规范](../brain/KIP-2.0-Validated-Learning_CN.md)执行：一条带有经验证的 EvaluationRecord 的 `lifecycle_verdict` Activity 加一次受保护的更新，处于同一事务之中。只有 `trialed → adopted` 是晋升；`proposed → adopted` 与 `revoked → adopted` 无效。未实现该配套规范的 Brain 将其技能保持为 `proposed`——未经证实的候选，完全可被召回——并且**可以**撤下它们。

召回报告**资格地位**（standing），作为生命周期的视图：

```text
proposed, trialed                                  unproven（未经证实）
adopted 且具备匹配、可验证的评估                   validated（经验证）
adopted 但不具备                                   unverifiable（无法验证）
revoked                                            revoked（已撤销）
```

约束所有 Brain 的规则（无论是否具备该配套规范）：

1. **确定性迁移。** 晋升与降级由读取已评定结果证据的确定性代码执行——绝不由作者断言、衰减或行动模型的判断执行。Brain 负责提议、编译和叙述；它绝不晋升。
2. **撤销绝不难于采纳。** 降级门槛**严禁**高于晋升门槛。只能习得的生命周期无法区分习惯与迷信。
3. **采纳是暂定的。** 被采纳的 Skill 保持订阅其结果流；部署**应当**定义重新裁决的触发条件——结果计数、时间窗口或对该任务族的 Watch。
4. **评定词汇。** 区分匹配条件下的成功、匹配条件下的失败、非匹配条件下的失败以及未知结果。匹配条件下的失败会降低 utility、增加失败模式和反例、收窄适用范围或降级；非匹配条件下的失败收窄适用范围而不惩罚该程序。
5. **依赖有效性是正交的。** 其溯源根被修订的 Skill 无论资格地位如何都是 `needs_review`（规范 §57.6），且该审阅可以开启一次重新试验。
6. **先归因，后计数。** 仅仅共享 `task_family` 的结果**严禁**改变 Skill 的资格地位或其 GradingState 视图；同一任务族中的两个 Skill 由各自的决策评定，而非由彼此的决策评定。

任何生命周期状态都不授予执行权限。采纳是资格地位，而非许可。

---

# 15. 偏好巩固 (Preference Consolidation)

区分单次陈述的偏好、重复行为、特定上下文偏好、跨上下文的稳定模式、反例以及显式更正。

显式陈述保持为 Evidence + Assertions。对稳定模式的摘要是 Insight（§5.5），绝不替代历史。

发生变更的偏好是自变更发生时起的一条新的 `prefers` Assertion，携带 `at`（陈述发生的时间），使其起始键为该人员表达该偏好的时间，而不是 Brain 记录该偏好的时间（规范 §13.2）；时间继承（规范 §25.4）在同类选项内终结旧偏好，而旧偏好在其所属的时间段内依然有效。仅限特定任务的偏好（例如“在此仓库中使用制表符缩进”）限定在该任务的上下文范围内，并在 `kip:memory-default` 的 `context_specificity` 能决定整个冲突集时胜过通用竞争候选（规范 §21.13），而无需替代通用历史。由于继承链按 `(actor, context_refs)` 分区，修订或解除该任务级主张本身需要在同一 `context_refs` 作用域内写入新断言或撤回原断言；较新的通用偏好（`context_refs: []`）仅更新通用继承链。若没有候选能凭 `context_specificity` 胜过整个集合，后续规则仍可能将通用偏好选为最终信念，但不会终结局部主张。

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
新认知证据 → 新 Assertion（变更对应继承，更正对应取代）
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
苏醒简报 (Wake Briefing)     = WorkingState + CHANGES AFTER 其 basis_seq + 触发的注意力
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

Profile 一致性测试 Experience/Step 结构合法性、失败经历保留、MnemonicState 可变性与计算得出的有效强度、置信度与记忆强度解耦、只读 GradingState 视图与计算得出的谱系字段、技能权限非放大性、胶囊可移植性、SelfModel 非权限性、承诺生命周期、Watch 非权限性、召回前的依赖有效性校验、WorkingState 非证据性、DecisionRecord 非授权性、经验形成原子性、程序溯源、同类别内的偏好继承与按类别为选项定型、结果来源隔离（自评不计分）、结果归因严密性（没有决策链接的结果绝不改变资格地位，且同一任务族的成员结果绝不为另一个技能打分）、试用准入必须具备任务族、以及导入时不继承生命周期资格地位。配套规范[已验证学习](../brain/KIP-2.0-Validated-Learning_CN.md)与[大脑运行时](../brain/KIP-2.0-Brain-Runtime_CN.md)包含各自的验收章节。

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

> **认知记忆 Profile 的使命，是使过往的记忆在结构上高度可重用，同时绝不将记忆的可访问性、信念、自传体身份或程序性效用，与执行权限混为一谈。**
