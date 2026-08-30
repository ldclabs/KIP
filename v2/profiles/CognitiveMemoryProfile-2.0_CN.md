# KIP 认知记忆 Profile 2.0 (Cognitive Memory Profile 2.0)

**[English](./CognitiveMemoryProfile-2.0.md) | [中文](./CognitiveMemoryProfile-2.0_CN.md)**

## 规范状态

**标准 Profile 候选版 / 在作为规范性 Profile Package 单独发布前仅供参考**

候选 Profile 唯一标识：

```text
kip://profiles/cognitive-memory@2.0.0
```

本文档为 KIP 2.0 大脑（Brain）定义了标准的、可移植的记忆数据结构。它构建于 KIP Core 之上，不重新定义 Core 的语义。若本文档与 [KIP-2.0-SPECIFICATION_CN.md](../KIP-2.0-SPECIFICATION_CN.md) 发生冲突，**以 Specification 为准**。

---

# 0. Profile 核心主张

KIP Core 定义了安全的底层认知原语：

```text
Concept（概念）
Proposition（命题）
Assertion（断言）
Evidence（证据）
Activity（活动）
MemorySpace（记忆空间）
Schema（模式）
Governance（治理）
Transaction（事务）
Capsule（胶囊）
```

认知记忆 Profile 则在此之上构建了一套可复用的记忆词汇表：

```text
Person（人物/主体）
Event（事件）
Experience（经验）
ExperienceStep（经验步骤）
Preference（偏好）
Insight（洞见）
Commitment（承诺）
Watch（守望）
Skill（技能）
SleepTask（睡眠任务）
SelfModel（自我模型）
WorkingState（工作状态）
MnemonicState（记忆状态）
SkillUtility（技能效用）
DerivationState（派生状态）
```

> **Core 负责定义认知真值、溯源、执行权限与持久化语义；Profile 负责定义可跨系统移植的记忆组织形式。**

本 Profile 不强制绑定任何特定的记忆形成、排序检索、知识巩固或遗忘算法。

# 1. 设计目标

Profile 应支持可移植的情景记忆、目标导向经验、程序性记忆、前瞻记忆、注意力状态、偏好模式、自省教训、自我模型制品、工作状态、记忆可提取性、程序实用性以及系统维护任务。

Profile 应能够清晰回答以下核心问题：

```text
发生了什么？（What happened?）
主体经历并走过了怎样的过程？（What did the actor go through?）
主体从中学习到了什么？（What did the actor learn?）
哪些做法通常有效？（What tends to work?）
哪些尝试失败了？（What failed?）
还有哪些事项处于待办状态？（What is still pending?）
哪些状态变更（或预期的静默超时）值得引起关注？（What change — or what silence — deserves attention?）
当前的工作全景与上下文是什么？（What is the current working picture?）
哪些记忆应该更容易被召回？（What should be easier to recall?）
自我模型发生了哪些变化？（What changed in the self-model?）
```

# 2. 非设计目标

Profile 不试图定义一套普适的人类记忆心理学理论、不包含隐藏的思维链（hidden chain-of-thought）、不构建大一统的世界本体论，也不限定特定的向量嵌入/重排模型、固定的睡眠调度算法、显著性计算公式、Skill 编译器实现、工具调用权限分配、治理权限策略或信息源信任评估策略。

Profile 中的元素可以详细描述某项操作流程，但这绝不代表其自身具备执行该流程的系统权限。

# 3. 与 Core 的核心边界

Profile 必须严格保持以下概念界限：

```text
Preference 概念节点    ≠ 已被系统采信的偏好信念 (accepted preference belief)
Skill 概念节点         ≠ 工具执行权限 (tool permission)
Person 概念节点        ≠ 经鉴权的调用主体 (authenticated Principal)
SelfModel 概念节点     ≠ 治理策略 (Governance policy)
SleepTask 概念节点     ≠ 维护执行权限 (maintenance authority)
Watch 概念节点         ≠ 调度器或权限 (scheduler or permission)
WorkingState 概念节点  ≠ 证据 (Evidence)
MnemonicState 记忆状态 ≠ 断言置信度 (Assertion confidence)
DerivationState 派生状态 ≠ 断言生命周期 (Assertion lifecycle)
```

Profile 中定义的 Facet 与结构引用（Structural Field）绝不能绕过 Core 的不可变性、来源溯源、治理权限或认识论约束。

# 4. Profile 模式包

以机器可读形式发布的规范应采用不可变的模式包（Schema Package）：

```text
package_id  = kip://profiles/cognitive-memory
version     = 2.0.0
package_ref = kip://profiles/cognitive-memory@2.0.0
```

持久化存储时必须使用精确的 Profile 版本引用。本地别名仅作为面向模型生成的语法便利。

# 5. 标准概念类型 (Concept Types)

## 5.1 Person（人物/主体）

在认知内容中提及的语义人物或行动者。

```text
Person ≠ PrincipalRecord ≠ ActorBinding
```

推荐属性包含 `display_name`（显示名）、别名列表与文本描述。跨系统使用的 `canonical_id` 只有在完成强身份核实后方可写入；未经严格验证的身份关联应使用 `same_as` 谓词（以 Proposition + Assertion 形式）记录，并在实体合并前提交人工或系统审核。

## 5.2 Event（事件）

**Event 是用于描述特定有界情境下“发生了什么”的精炼情景锚点。**

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

Event 专门回答**发生了什么**，无需记录完整的“状态-行动-观察”轨迹。

## 5.3 Experience（经验）

**Experience 是行动者在追求特定目标时，依次经历状态、行动、观测、反馈与结果的有界轨迹。**

概念模型：

```text
E = (g, b0, a0, o1, b1, a1, o2, ..., y, δ)
```

其中 `g` 代表目标（goal），`b` 代表可外部表达的状态/信念上下文，`a` 代表行动（action），`o` 代表观测（observation），`y` 代表最终结果（outcome），`δ` 代表反馈/意外度/预测偏差（feedback/surprise/prediction error）。

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

推荐的 `outcome_status` 取值：

```text
success | partial | failure | aborted | unknown
```

推荐的 `consolidation_status` 取值：

```text
pending | semantic | procedural | completed | archived
```

当执行过程本身具备未来复用价值时，应创建 Experience 节点：例如多步目标追寻、故障与恢复、预期落空、策略调整、关键工具交互、纠错反馈、新颖操作流程或典型反例。

## 5.4 ExperienceStep（经验步骤）

Experience 的有序组成单元。

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

推荐的步骤类型（`step_kind`）：

```text
context | observation | decision | action | feedback | belief_update
```

`decision_summary` 可记录简明扼要、可复用的决策理由，但**严禁**要求记录私有/隐藏的思维链。

步骤顺序完全由有序结构引用 `has_step` 维护：引擎为每个 Experience 维护从 0 开始的稠密顺序，通过结构化赋值 `{index: n}`（或追加写入）声明，并在查询时通过虚拟属性 `?edge.index` 暴露（参见规范第 17.4 节）。步骤本身不包含独立的顺序属性，确保拓扑顺序只有唯一事实来源。

时间上的前后相邻绝不能证明因果关系。步骤之间明确的因果主张必须使用 `caused_by` 谓词以语义 Proposition + Assertion 形式记录（通常 `mode` 为 observed 或 inferred，并附带 Evidence 证据）。与其他主张一样，因果关系可以被支持、反对或争议——这也是它必须作为命题而非硬性拓扑结构的原因。

## 5.5 Preference（偏好）

表示相对稳定的偏好模式的 Profile 产物。

涉真的偏好陈述仍应归属于底层结构：

```text
Proposition + Assertion(s) + Evidence
```

Preference 产物可用于汇总偏好适用范围、稳定性、首次/最近观测时间及反例，但绝不能替代底层的主张演变历史。

## 5.6 Insight（洞见）

从 Evidence 或 Experience 中提炼出的陈述性教训。它应通过 Activity 完整保留其推导血统链。若具备涉真属性，其核心结论也应能以 Proposition + Assertion 形式表达。

## 5.7 Commitment（承诺）

代表义务、承诺、提醒、跟进任务或预期未来行动的前瞻记忆制品。

推荐字段：

```text
summary
status
created_at
due_at
completed_at
priority
conditions
```

推荐生命周期状态：

```text
pending | fulfilled | cancelled | expired | blocked
```

Commitment 属于认知层面的记忆记录，不代表系统会自动触发外部真实执行。

## 5.8 Skill（技能）

**Skill 是从 Experience、Evidence 或经检验的操作指令中编译而来的、可复用的程序性认知。**

推荐字段：

```text
skill_class
summary
applicability
preconditions
procedure
success_criteria
failure_modes
counterexamples
recovery
status
created_at
last_validated_at
```

推荐分类（`skill_class`）：

```text
heuristic
workflow
checklist
tool_policy
communication_strategy
diagnostic
recovery
prompt_pattern
code_pattern
subagent_pattern
```

推荐认知生命周期：

```text
candidate → validated → needs_review → deprecated/archived
```

**已验证的 Skill ≠ 系统执行权限。** 权限依然受 Governance 状态管控。从外部导入的 Skill 在通过本地审核并获得策略提升前，必须保持为 candidate 或 inactive 状态。

## 5.9 SleepTask（睡眠任务）

持久化的系统维护工单。推荐类别包括：consolidate（知识巩固）、review_conflict（冲突审查）、review_skill（技能审查）、resolve_identity（实体对齐审查）、review_retention（留存策略审查）、review_derived（派生认知复审）、refresh_self_model（自我模型刷新）以及 inspect_quarantine（隔离区检查）。

在语义上将其指派给 `$system` 并不直接赋予系统操作权限。

## 5.10 SelfModel（自我模型）

用于描述大脑当前对自身身份、能力边界、局限性、价值观、偏好、行为习惯、协作关系以及长期目标认知状态的派生制品。

SelfModel 的内容**严禁**直接篡改调用主体身份（Principal identity）、行动者绑定（ActorBinding）、治理策略（Governance Policy）、工具调用权限或 Schema 管理权限。

## 5.11 Watch（守望/监听）

**Watch 是持久化的注意力状态：通过预先声明的条件，在大脑关注的特定状态变更发生、或预期变更超时未发生（静默超时）时激活。**

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

推荐类别（`watch_class`）：

```text
delta      当匹配的变更提交时触发
silence    当到达 due_at 且期间无匹配变更时触发（静默/超时触发）
```

推荐生命周期：

```text
armed → fired | expired | disarmed
```

`condition` 声明什么样的变更算作匹配：被观察的元素或槽位、状态跃迁的种类或阈值。Profile 不强制限定条件表达式语法；部署方可采用基于变更外壳（Change Envelope）的结构化过滤器，亦可使用由维护流程解释的声明式文本。

求值过程遵循差分循环：运行时或 Brain 将已提交的变更外壳（规范 §36）与处于 `armed` 状态的 Watch 集合进行比对；`silence` 类 Watch 在到达 `due_at` 且无匹配变更时触发。触发操作将记录为一条 `watch_fire` Activity——其 `inputs` 为该 Watch 及（在可表示时）触发它的变更元素或观测 Evidence，`outputs` 为由此生成的 SleepTask 或唤醒信号——Watch 本身通过标准 UPDATE 完成状态流转。

**Watch 触发不授予任何执行权限。** 它产生的是系统的注意力分配——通常表现为生成 SleepTask 或唤醒信号——绝不直接触发对外物理行动。智能体后续采取的任何动作，均须经过独立的行动门控（§9）与治理策略核验。

对于承诺中等待外部响应的条件分支（如「若周四前未获回复则升级告警」），应创建相应的 Watch 并通过 `derived_from` 关联该 Commitment。履约义务由 Commitment 承载，触发条件则交由 Watch 管理。

## 5.12 WorkingState（工作状态）

**WorkingState 是对「当前核心工作上下文与未决事项」的派生及带版本摘要：Agent 在唤醒恢复时可直接基于该汇总状态恢复上下文，无需重新扫描与重放全量历史。**

推荐字段：

```text
summary
horizon
basis_seq
refreshed_at
```

`basis_seq` 为构建该摘要时的 `space_seq`。会话恢复时依次读取：

```text
DESCRIBE PRIMER               系统身份设定与核心词汇表
WorkingState                  当前工作上下文与核心未决事项
CHANGES AFTER SEQ basis_seq   自构建基准以来的增量变更
```

典型输入通过 `derived_from` 建立关联：包括未决 Commitment、处于 armed 状态的 Watch、存在争议的信念槽位、近期高显著性 Event 以及进行中的核心任务。刷新过程记录为 `working_state_refresh` Activity，通常由周期性维护流程执行。

WorkingState 属于派生召回视图（规范 §66.7）：对外呈现时必须披露其构建基准版本，严禁伪装为强事务快照。它是认知的视图，而非证据源头：

```text
WorkingState 绝不能作为 Evidence 引用
WorkingState 绝不为自己的输入提供独立佐证
WorkingState 回答"当前处于什么工作上下文"；SelfModel 回答"我是谁"
```

在每个行动者作用域内，记忆空间**应当**在稳定 `key` 之下至多维护一份活跃的 WorkingState。

# 6. 标准 Facet

## 6.1 MnemonicState（记忆状态）

```json
{
  "memory_strength": 0.8,
  "salience": 0.9,
  "utility": 0.6,
  "last_metabolized_at": "2026-08-14T00:00:00Z"
}
```

`memory_strength`（记忆强度）衡量该记忆在未来的认知使用中应具备多高的可提取性。`salience`（显著性）衡量该记忆本身的重要性与受关注度。`utility`（效用度）衡量该记忆预期能为未来决策带来多少价值——它是存储时下的准入赌注，并随后续实际结果修订。

```text
记忆强度 (memory_strength) ≠ 置信度 (confidence)
显著性 (salience)         ≠ 信任度 (trust)
效用度 (utility)          ≠ 真值、显著性或权限
```

记忆代谢过程**严禁**改写 Assertion 的认识置信度、信息源信任度、生效时间或治理权限。

效用校准与其他强化操作一样，必须是显式变更：某次召回实际用到了该记忆，或某个结果证实/证伪了当初的赌注，可以经由 Formation/Maintenance 写入调整 `utility`——单纯的读取永远不会（规范 §2.13）。

## 6.2 SkillUtility（技能效用）

```json
{
  "utility": 0.72,
  "success_count": 8,
  "failure_count": 2,
  "last_validated_at": "2026-08-10T00:00:00Z"
}
```

Utility 代表程序在 `[0,1]` 区间内的实用价值，既非客观真理概率，亦非执行权限。

## 6.3 DerivationState（派生状态）

```json
{
  "basis_seq": 1500,
  "status": "current",
  "reviewed_at": "2026-08-14T00:00:00Z"
}
```

DerivationState 标记一个派生制品——Insight、Preference、Skill、SelfModel、WorkingState——相对于其溯源根的状态。`basis_seq` 是该派生完成或最近一次复核确认时的 `space_seq`。

推荐的 `status` 取值：

```text
current | stale | under_review
```

`stale` 表示某个溯源根在 `basis_seq` 之后被修订，而该派生尚未被重新审视。它是制品上的复审标记，不是认识论裁决：

```text
DerivationState ≠ Assertion 生命周期
stale ≠ 已撤回、已证伪或排除出召回
```

维护流程通过对被修订之根执行 `LIST DEPENDENTS`（规范 §57.5、§63.5）找到制品并标记 `stale`，随后复审并将其解决为 `current`（复核通过）、一份修订后的制品，或一次普通的生命周期操作。

# 7. 标准结构字段与谓词

结构引用字段（Structural Fields）用于记录数据拓扑，而非语义命题。

```text
experienced_by  Experience → Person（亲历者）
has_step        Experience → ExperienceStep（有序步骤）
involves        Event/Experience → 相关的 Person/Concept（涉及对象）
mentions        Event/Experience/Insight → Concept（提及概念）
derived_from    Profile 制品 → 来源认知对象（派生自）
compiled_from   Skill → Experience（编译自）
compiled_by     Skill → Activity（编译活动）
consolidated_to Event/Experience → 派生记忆制品（巩固至）
committed_to    Commitment → Person（承诺对象）
owed_to         Commitment → Person（受益/被承诺人）
assigned_to     SleepTask/Watch → 语义行动者（指派给）
watches         Watch → 被观察的认知对象（守望）
about           Profile 制品 → 主题 Concept（关于）
```

严禁滥用 `involves`、`mentions` 与 `about` 来替代强语义的领域业务关系。

Profile 同时定义了三个标准**语义谓词**（涉真关系，需通过 Proposition + Assertion + Evidence 使用）：

```text
prefers    Person → Concept                     稳定的偏好主张
caused_by  ExperienceStep → ExperienceStep      因果关系主张（结果 → 起因）
same_as    Concept → Concept                    未经核实的同一实体主张
```

`same_as` 专门用于触发实体对齐审核流（如 Maintenance 第 15 节所述的工作流）；它绝不会自动合并 Concept，也无法自行确立 `canonical_id`。

`caused_by` 的连接方向为“结果 → 起因”。步骤顺序（`has_step` 的边索引）绝不能被直接当作 `caused_by` 因果主张。

领域专有的事实谓词（例如 `timezone`）应由各自的领域模式包定义，而非由本 Profile 承担。

# 8. 证据与溯源 (Evidence & Provenance)

凡涉及客观事实准确性的场合，Profile 制品均应完整保留 Evidence 关联。

```text
Event       ← 消息/工具调用 Evidence
Experience  ← 轨迹追踪 Evidence
Insight     ← Experience/Evidence
Skill       ← Experiences + 编译 Activity
SelfModel   ← 观测数据/Insights/Activities
```

多次摘要转换并不会产生独立的佐证源。消息 → Event 摘要 → Experience 摘要 → Insight 这一链条在认识论上可能仍然只源于单一证据根。

# 9. 活动 (Activities)

推荐的 Activity 分类：

```text
experience_formation     （经验形成）
semantic_consolidation   （语义巩固）
reflection               （反思）
procedural_consolidation （程序性巩固）
skill_compilation        （技能编译）
skill_validation         （技能检验）
self_model_refresh       （自我模型刷新）
mnemonic_metabolism      （记忆代谢）
commitment_review        （承诺审查）
watch_fire               （守望触发）
action_gate              （行动门）
derivation_review        （派生复审）
working_state_refresh    （工作状态刷新）
```

Activity 记录的是溯源历史；Activity 不是底层数据库事务（Transaction）。

`action_gate` Activity 记录的是：在执行任何对外物理动作之前，系统针对特定状态变更所作出的显式决策。其结果取值包括：

```text
act       具备明确授权、可逆且收益明确，无需额外确认直接执行
ask       升级上报，交由人工或上级主体裁决
defer     延迟处理，安排在后续维护流程或特定时机跟进
silence   经评估后主动保持静默、暂不采取行动
```

记录 `defer` 与 `silence` 确保了系统的克制与不作为同样具备可审计性与可解释性：无论是「为何采取行动」还是「为何未行通知」，均能从同一条溯源链中追溯。至于触发评估的阈值（哪些变更值得进入门控流程），则由 Brain 策略自主决定；低价值的过程噪音无需生成门控记录。

# 10. 事件形成 (Event Formation)

Event 应保持精炼：包含时间、参与者、摘要、结果、上下文及 Evidence 引用。对于日常客套或无实质意义的确认消息，无需创建 Event。

# 11. 经验形成 (Experience Formation)

在条件允许时，单个事务应保证原子性地协同创建以下内容：

```text
来源 Evidence
Experience
各 ExperienceStep 节点
MnemonicState
experience_formation Activity
可选的 Event
可选的语义 Assertions
```

失败经验是头等公民。失败的 Experience 能够沉淀负向先决条件、诊断规则、故障恢复分支、错误假设、反例以及工具局限性。

# 12. 语义巩固 (Semantic Consolidation)

语义巩固的核心问题：**累积的证据支持提炼出哪些可复用的陈述性规律？**

推荐流程：

```text
Experience/Evidence
→ 候选 Proposition
→ 派生 Assertion
→ semantic_consolidation Activity
```

巩固过程**严禁**篡改旧 Assertion 的置信度、删除相互矛盾的 Evidence，或将同一源头的多份摘要误判为独立的多方证据。

# 13. 程序性巩固 (Procedural Consolidation)

程序性巩固的核心问题：**在何种条件下，何种行动策略能够稳定生效？**

```text
成功经验 (successful Experiences)
+ 失败经验 (failed Experiences)
+ 典型反例 (counterexamples)
→ 对比分析 (contrast)
→ 候选技能 (candidate Skill)
→ 验证检验 (validation)
→ 更新 SkillUtility
```

单次成功的 Experience 通常不足以证明该流程具备通用的程序可靠性。

# 14. 技能检验 (Skill Validation)

需明确区分四种检验情境：

```text
符合适用条件下的成功 (success under matching conditions)
符合适用条件下的失败 (failure under matching conditions)
不符合适用条件下的失败 (failure under non-matching conditions)
结果未知 (unknown outcome)
```

在符合适用条件下的执行失败可能导致效用分降低、补充故障模式与反例、收窄适用范围，或将 Skill 标记为 `needs_review`。

任何验证状态的跃迁都不会自动授予外部系统的实际执行权限。

# 15. 偏好巩固 (Preference Consolidation)

需明确区分单次口头偏好陈述、重复出现的行为习惯、特定上下文下的偏好、跨情境稳定的偏好模式、偏好反例以及主体的明确纠错。

口头声明始终保留为 Evidence + Assertions。Preference 制品仅为统计/提炼摘要，不能替代原始主张历史。

# 16. 自我模型构建 (Self-Model Formation)

SelfModel 的演进应保持审慎。优先基于多次观测、主体的明确纠错、高显著性 Experience、已验证的能力变化以及反复出现的行为。避免因单一偶然措辞、过度揣测人格特征、臆测隐藏内部机制或直接写入系统权限主张而频繁变动。

# 17. 承诺语义 (Commitment Semantics)

承诺的到期时间（due time）已过，并不代表其状态会自动变更，直到新的策略或 Evidence 触发流转。即使长期未被召回，Commitment 依然可能具有极高的显著性。仅凭未被频繁调用，绝不能作为降低其重要性的理由。

承诺中包含的等待条件（如超时未响应即升级告警）应建模为 Watch（§5.11），并通过 `derived_from` 关联该 Commitment。履约到期日由 Commitment 维护，触发条件则由 Watch 承载。

# 18. 记忆代谢 (Mnemonic Metabolism)

标准合法的代谢操作：

```text
记忆强度（memory_strength）衰减或强化
显著性（salience）微调
效用度（utility）校准
进入归档候选
安排审查调度
更新 SkillUtility 效用统计
```

通用的基于时间的衰减机制**严禁**直接修改 Assertion 的置信度。

```text
新认知证据到达   → 新建/修订 Assertion
时效性衰退       → 认识投影的有效性与新鲜度判定
记忆淡忘         → 衰减 memory_strength
准入预期价值校准 → 校准 utility
存储生命周期流转 → retention / archive / tombstone / purge
```

# 19. 存储留存指南 (Retention Guidance)

常见类型的生命周期倾向：

```text
Person / 稳定身份标识   持久保存
Commitment              在生命周期内持久保存
Skill                   在具备实用/审计价值期间持久保存
SelfModel               持久保存且支持多版本追溯
WorkingState            持久保存且带版本；被替代的旧摘要可归档
Experience              根据学习价值标准保存或持久保存
Event                   标准保存；可定期归档
ExperienceStep          生命周期跟随其所属的 Experience
SleepTask               标准保存；终态任务可归档
Watch                   标准保存；终态可归档
Evidence                依具体策略而定；溯源价值通常倾向持久保存
                        （载荷字节可单独清除，见规范 §60.6）
```

留存策略**严禁**为了刻意迎合未来的认识投影而故意剔除反面证据（counter-Evidence）。

# 20. 召回视图 (Recall Views)

Profile 支持以下典型召回模式：

```text
情景召回 (Episodic Recall)   = Event + 关联的精选 Evidence
经验召回 (Experience Recall) = Experience + 有序 Steps + Outcome 结果
程序召回 (Procedural Recall) = Skill + 适用条件 + 效用统计 + 正反向 Experience 案例
行动简报 (Action Briefing)   = 已采信知识 + 具争议假设 + 适用 Skills + 成功/失败案例 + 待办 Commitments + 约束条件 + 风险预警
唤醒简报 (Wake Briefing)     = WorkingState + 其 basis_seq 之后的 CHANGES
```

除非获得独立的 Governance 明确授权，发起调用的 Agent 始终保留最终行动裁决权。

# 21. 数据可移植性 (Portability)

封装了 Profile 认知数据的认知胶囊（Cognitive Capsule）应完整保留精确的 Profile Package 引用、数据类型定义、Facet、结构引用、证据溯源闭包、源主体标识以及可导出的留存状态。

目标系统导入胶囊时，**严禁**自动转移源系统的自我身份认定、源系统信任等级、Skill 执行授权、工具权限或治理策略。在常规合并导入下，远程导入的亲历记忆始终保持为远程自传体历史。

源系统的 Watch 与 WorkingState 反映的是源认知系统自身的注意力焦点与局部工作上下文：在常规合并导入下，它们将以解除激活（disarmed）且非当前（non-current）的状态引入。目标系统需基于自身上下文重新配置注意力并重建工作状态。

# 22. 一致性测试要求 (Conformance Expectations)

Profile 一致性测试应涵盖：Experience/Step 结构合法性、失败 Experience 的保留能力、MnemonicState 可变性、置信度与记忆强度的解耦、SkillUtility 可变性、Skill 权限非越权放大、Capsule 可移植性、SelfModel 非特权性、Commitment 生命周期流转、Watch 非特权性、DerivationState 与认识状态的解耦、WorkingState 非证据性、经验形成的原子性以及程序性溯源链完整性。

# 23. Profile 核心不变式

1. Experience 与 Skill 属于 Profile 层定义的概念，而非 Core 底层核心类型。
2. 结构引用不会自动转变为语义命题。
3. `memory_strength` 绝不是 Assertion 的置信度。
4. `salience` 绝不是信息源的信任度。
5. `utility` 绝不是系统的执行权限。
6. Person 概念绝不是鉴权主体 Principal。
7. SelfModel 绝不是治理策略 Governance。
8. SleepTask 的任务指派绝不等于系统授权。
9. 失败的 Experience 同样是合法的头等记忆。
10. 单次成功无法证明该方法已成为通用 Skill。
11. 派生出的摘要不会凭空创造独立的多方证据根。
12. Event 与 Experience 职责明确，不可互相混淆替代。
13. 时间上的先后顺序不包含因果关系。
14. 协议不要求记录隐藏的思维链。
15. 明确的纠错必须完整保留历史血统链。
16. 外部导入的 Skill 默认不具备权威性与执行权限。
17. 承诺到期时间与数据物理留存过期时间完全独立。
18. 读取频率并非强制要求的记忆代谢信号。
19. Profile 的 Facet 绝不能覆盖 Core 核心系统字段。
20. 大脑内部的具体算法实现不属于 Profile 一致性测试范围。
21. 触发的 Watch 不授予任何权限；它产生注意力，而非直接行动。
22. 行动门控中主动选择的静默（silence）属于可追溯的显式决策结果。
23. DerivationState 是复审状态标记；stale 绝不等于已撤回。
24. WorkingState 是派生视图；它绝不是 Evidence，也绝不为自己的输入提供独立佐证。
25. utility 代表记忆准入时的预期效用，随后续实际产出动态校准；它不代表真值、显著性或执行权限。

# 24. 极简 Profile 摘要

```text
认知记忆 Profile 2.0

Event: 关于发生了什么的精炼记录
Experience: 包含状态/行动/观测的目标导向轨迹
ExperienceStep: 可观测的有序步骤；不记录隐藏思维链
caused_by: 步骤间明确声明的“结果→起因”因果主张；边顺序本身不构成因果
Insight: 从记忆中提炼出的陈述性教训
Skill: 可复用的操作程序；其内容不直接赋予执行权限
Commitment: 前瞻性记忆与承诺事项
Watch: 布防的注意力——值得关注的状态变更或超时静默；触发不授予权限
SelfModel: 关于自身的派生认知；非治理策略
WorkingState: 当前核心工作上下文，带构建基准 basis_seq；绝非 Evidence
MnemonicState: memory_strength + salience + utility；非置信度
SkillUtility: 程序实用性效用；非系统权限
DerivationState: basis_seq + current|stale|under_review；复审状态，非信念

涉真主张必须使用 Proposition + Assertion + Evidence。
所有提炼转换过程均通过 Activity 保留溯源链。
```

# 25. 终极准则

> **认知记忆 Profile 的使命在于让过去的经历在结构上可被充分复用，同时绝不将记忆的可提取性、认识论上的信念、自传体身份或程序实用性与系统的实际执行权限相混淆。**
