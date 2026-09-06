# KIP 认知记忆 Profile 2.0 (Cognitive Memory Profile 2.0)

**[English](./CognitiveMemoryProfile-2.0.md) | [中文](./CognitiveMemoryProfile-2.0_CN.md)**

## 规范状态

**规范性标准 Profile 草案。** 本文档及其模式包对声明实现标准认知记忆 Profile 的系统具有约束力。[认知一致性契约](../KIP-2.0-Cognitive-Consistency_CN.md)提供了必需的跨领域契约。草案状态绝不降低 MUST 等级的强制要求；记忆大脑策略示例保持为参考性内容。

当前草案包标识（2.1.0；先前的 2.0.0 工件按字节完全保留以供迁移参考）：

```text
kip://profiles/cognitive-memory@2.1.0
```

本文档定义了面向 KIP 2.0 大脑的标准可移植记忆结构。它建立在 KIP Core 基础之上，并不重新定义 Core 语义。若本文档与 `KIP-2.0-SPECIFICATION_CN.md` 发生冲突，以规范为准。

本文档依然是**完整**的标准 Profile。实现也可以改为声明更窄的[记忆接口能力包 (Memory Interface capability bundles)](../KIP-2.0-Memory-Interface_CN.md#2-能力包-capability-bundles)：基础记忆（basic memory）、经验（experience）、学习（learning）、持久工作（durable work）与交换（exchange）。声明某个能力包并不等同于声称支持整个 Profile，也不会改变已存储符号的血统 (symbol lineages) 或削弱 Core 不变式。相同的 Schema 包提供词汇表；其符号的可用性并不承诺支持每一项关联的运行时操作。经过验证的 Skill 资格地位要求满足学习契约；普通事实和描述性反馈不需要进行试验。

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

遵循 KIP 2.0 Core 边界：

```text
Concept 是对象状态，而非真理载体
Proposition 是价值中立的陈述三元组
Assertion 是具名行动者对命题的立场陈述
Evidence 包含不可变的观测载荷
Activity 记录确定性的溯源拓扑
Facet 是局部的结构化属性集
```

本 Profile 绝不绕过核心不变量：
- 记忆不用导致的衰减仅作用于 `MnemonicState`，**严禁修改 Assertion 置信度**。
- 偏好、洞察的更正**必须通过创建新断言并废弃替代旧断言实现**，绝不就地抹除历史。
- 技能的采纳**绝不自动赋予底层工具或系统的执行权限**（Governance 严格独立）。
- `WorkingState` 概念绝不能作为提供事实佐证的 `Evidence`。
- `task_family` 用于确定评估基线；只有从决策到结果的观测链接才能归因后果。
- `TrialState` 忠实记录试用基线，使生命周期裁决完全可复算。

---

# 4. Profile 模式包

机器可读发布**应当**使用不可变模式包：

```text
package_id  = kip://profiles/cognitive-memory
version     = 2.1.0
package_ref = kip://profiles/cognitive-memory@2.1.0
```

持久化精确的 Profile 引用。本地别名保持为面向模型的便利工具。

定义的核心符号：

```text
Concept 类型:
  Person
  Event
  Experience
  ExperienceStep
  Preference
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
  GradingState
  DerivationState
  OutcomeRecord
  TrialState
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
  derived_from
  compiled_from
  compiled_by
  consolidated_to
  committed_to
  owed_to
  assigned_to
  watches
  about
  current_revision
  revision_of
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

## 5.5 Preference（偏好）

用户偏好或智能体协作倾向的抽象摘要。

```text
name         偏好名称
attributes:
  topic      所属主题
  summary    偏好内容陈述
  strength   归纳强度 [0, 1]
```

核心规则：具体的事实主张必须始终表现为 `(Person, "prefers", Concept)` 的 Proposition + Assertion。`Preference` 概念实体仅作为聚合或元数据承载物。

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
- `derived_from`：支撑该洞见的历史经历或证据。

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

注意：触发通知或到期升级机制应通过引用该承诺的 `Watch`（关注警戒）实现，条件不再内嵌于承诺本身。

---

## 5.8 Skill（技能）与 SkillRevision（技能修订版本）

**Skill 是稳定的程序性身份；SkillRevision 是实际被执行与评估的不可变行为。** Skill 持有 `skill_class`、`summary`、注释以及当前生命周期/缓存状态。必填的 `current_revision` 指向一个 SkillRevision；修订版本的 `revision_of` 指回该 Skill。这两者的创建在单个原子操作中完成，包括前向引用。

SkillRevision 包含必填的 `task_family`、`procedure`、`behavior_digest`，以及可选的 `applicability`、`preconditions`、`success_criteria` 与 `recovery`。其 `behavior_digest` 是除摘要本身以外的规范化行为字段的 sha256。所有行为字段均不可变，且绝不能被 Skill 上的可变字段遮蔽。任务族是流选择手柄，绝不自动充当充分的基线成员资格。不可证伪的陈述性教训保持为 Insight。

生命周期流转依然遵循 `proposed → trialed → adopted → revoked`，但资格地位绑定到确切的修订版本。选择新行为将在单个受保护的事务中将当前资格重置为 `proposed` 并清空当前评分/试用指针，绝不改变旧裁决。这属于修订版本选择，而非晋升。注释与记忆代谢信号可以在不重置资格的情况下变更。试用、决策、结果与治理权限绑定确切的修订版本/行为摘要（[认知一致性 §5–§6](../KIP-2.0-Cognitive-Consistency_CN.md)）。导入的修订版本需通过本地新试用重新挣得本地资格。

---

## 5.9 SleepTask（睡眠任务）

在离线代谢阶段（Maintenance）供智能体处理的自省与维护任务。

```text
name         任务名称
attributes:
  task_class "consolidate", "review_conflict", "review_skill", "resolve_identity",
             "review_retention", "review_derived", "refresh_self_model", "inspect_quarantine"
  summary    任务目的说明
  status     "pending", "running", "completed", "cancelled", "blocked", "failed"
```

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

触发机制：
- 触发表现为一个受守卫的 UPDATE（将 status 改为 `fired`），并记录一条客户端键对于 delta Watch 为 `watch_fire:<id>:<arm_generation>:<space_seq>`、对于 silence Watch 为 `watch_fire:<id>:<arm_generation>:silence:<due_at>` 的 `watch_fire` 活动，杜绝重复触发。
- 静默（silence）watch 仅在变更流消费进度正式推进越过其 `due_at` 时刻且无任何匹配事件时触发，绝不能仅凭挂钟时间触发。
- **触发的 Watch 不赋予任何行动权限**：它仅引起注意，随后必须由 `action_gate` 决定后续动作。

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

`WorkingState` 是派生视图，绝不能作为 `Evidence` 引用或充当佐证源泉。生产它的 Activity 锚定 DependencyBasis 与完整的 ProjectionBasis；消费方在声称当前情境之前必须校验基准及所有增量变更页（[认知一致性 §2–§3](../KIP-2.0-Cognitive-Consistency_CN.md)）。

---

# 6. 标准 Facet

## 6.1 MnemonicState（记忆状态）

挂载于 Concept 上（包括 Skill），管理其记忆生命周期信号：

```json
{
  "memory_strength": 0.85,
  "salience": 0.70,
  "utility": 0.60,
  "last_metabolized_at": "2026-08-16T00:00:00Z"
}
```

- `memory_strength` [0, 1]：记忆持久强度。随未被访问的时间而衰减；被有价值地召回时得到巩固。
- `salience` [0, 1]：认知显著性/重要程度。
- `utility` [0, 1]：预期效用下注。编译时给出的准入预估，由后果流裁决持续校准。
- 记忆代谢**严禁篡改断言置信度**。

---

## 6.2 GradingState（评分状态）

挂载于携带 `task_family` 的工件（Skill）上，作为特定修订版本之不可变 EvaluationRecord 的可变缓存：

```json
{
  "revision_ref": "R-1",
  "evaluation_ref": "EV-1",
  "success_count": 8,
  "failure_count": 2,
  "graded_count": 11,
  "last_verdict_at": "2026-08-10T00:00:00Z"
}
```

计数为在每个度量指标/时间窗口内聚合的**独立尝试（Attempt）**，包括试验缺失策略下的部分完成、中止与未知结果。对同一次尝试的多次 Evidence 观察绝不会增加样本数。缓存更新引用其对应的评估并随裁决一同提交；空的新技能无 GradingState。它既非真值概率，亦非执行权限。未评分状态不排除候选者召回，但采纳状态若无经检验匹配的证据支持，绝不能作为经证实的推荐对外提供（[BrainRecall §16](../brain/BrainRecall_CN.md)）。

---

## 6.3 DerivationState（派生状态）

记录派生工件相对于其源认知谱系的状态：

```json
{
  "basis_seq": 1500,
  "status": "current",
  "reviewed_at": "2026-08-14T00:00:00Z"
}
```

- `status`：`current` | `stale` | `under_review`。
- 源节点发生修订后，通过 `LIST DEPENDENTS` 检索并标记为 `stale`；`stale` 仅代表需复审，绝不代表已撤回或在召回中被屏蔽。

---

## 6.4 OutcomeRecord（结果记录）

挂载于 `outcome` 类的结果证据（Outcome Evidence）上的不可变仪器化索引：

```text
task_family, attempt_ref (可为空，用于纯数据流观察)
metric, window, terminal, observation_key, observer_config_digest
outcome_status: success | partial | failure | aborted | unknown
magnitude (可选)
```

规范数值形态定义于 `kip-cognitive-records.schema.json#/$defs/OutcomeRecord`。实际尝试与预先存在的决策由观测 Activity 链接。空的 attempt_ref 使结果保持未评分，绝不自动充当对照组。独立样本是聚合的尝试，而非观察本身（[认知一致性 §5](../KIP-2.0-Cognitive-Consistency_CN.md)）。

---

## 6.5 TrialState（试用状态）

指向承载不可变 TrialRecord 的 `trial_open` 活动的指针缓存：

```json
{"trial_ref": "TR-1", "revision_ref": "R-1"}
```

重新准入选择具有新 ID 的新试验；旧裁决从旧 TrialRecord/回放工件中回放，绝非从当前指针回放。TrialRecord 冻结基线尝试/结果、比对输入、规则与参数、分层、独立尝试配额、缺失性与观察窗口策略（[认知一致性 §5–§6](../KIP-2.0-Cognitive-Consistency_CN.md)）。

---

## 6.6 DecisionRecord（决策记录）

不可变地挂载于终态 `action_gate` 活动上：

```text
decision: act | ask | defer | silence
rationale (可选的简要说明)
retrieved_refs: 提供给智能体的候选记忆
used_refs: 实际使用的记忆
applied_revisions: 确切的 SkillRevision ID，亦记录在 Activity.inputs
basis: 完备的 ProjectionBasis
```

仅被检索并不获得结果功劳归属。联合修订版本构成处理包，除非评估归因方法将其解耦。DecisionRecord 记录决策，绝非权限。携带 AttemptRecord 的 `action_attempt` 活动在观测到任何结果之前固定实际尝试归属于哪个决策/修订版本/试验/环境（[认知一致性 §5](../KIP-2.0-Cognitive-Consistency_CN.md)）。

---

## 6.7 不可变过程记录与操作缓存 (Immutable process records and operational caches)

`../schemas/kip-cognitive-records.schema.json` 中的规范字段形态同时受到模式包中 `value_schema` 定义的约束：

| 切面 (Facet) | 挂载对象 (Attachment) | 用途 (Purpose) |
| --- | --- | --- |
| DependencyBasis | 产出活动或 dependency_validation 活动 | 钉固的前提条件与计算基线的不可变组 |
| AttemptRecord | action_attempt 活动 | 独立的实际尝试、预先指定的试用与确切修订版本 |
| TrialRecord | 已完成的 trial_open 活动 | 不可变的比对契约与基线回放输入 |
| EvaluationRecord | 已完成的 lifecycle_verdict 活动 | 不可变的裁决结果、样本与回放工件 |
| WatchState | Watch | 受保护的臂世代（arm generation）、条件与覆盖水位线 |
| LeaseState | SleepTask | 受保护的认证所有者、围栏令牌（fencing token）与过期时间 |
| CompressionRecord | 编码/形成活动 | 保留字段、遗漏项、源引用与重新编码资格 |
| RecallCoverage | 显式记录的 recall_coverage 活动 | 已完成的召回通道、截断情况与行动适格性 |

---

# 7. 标准结构字段

结构字段是图拓扑连接，不是语义命题。

```text
experienced_by  Experience → Person
has_step        Experience → ExperienceStep (有序)
involves        Event/Experience → 相关 Person/Concept
mentions        Event/Experience/Insight → Concept
derived_from    Profile 工件 → 源认知
compiled_from   Skill → Experience
compiled_by     Skill → Activity
consolidated_to Event/Experience → 派生记忆工件
committed_to    Commitment → Person
owed_to         Commitment → Person
assigned_to     SleepTask/Watch → 语义行动者
watches         Watch → 观察的认知目标
about           Profile 工件 → 主题 Concept
current_revision Skill → SkillRevision
revision_of      SkillRevision → Skill
```

标准语义谓词（用于 Proposition + Assertion + Evidence）：

```text
prefers    Person → Concept                     稳定的偏好主张
caused_by  ExperienceStep → ExperienceStep      结果 → 原因主张
same_as    Concept → Concept                    未核验的同一性主张
```

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

后果通道向四个消费者提供数据：
1. **技能生命周期裁决**（§14）：关联结果与 `TrialRecord` 基线对比。
2. **GradingState 计数**（§6.2）：仅统计独立尝试聚合结果。
3. **MnemonicState.utility 校准**（§6.1）：根据决策 inputs 反向更新记忆效用下注。
4. **信任度校准**：依据规范 §22.6。

纪律约束：
- 行动执行模型绝不能编写用于评估自身行动的结果证据。
- 结果必须通过 `outcome_observation` 显式链接到尝试与决策，才能用于打分。
- 未建立网关决策记录的裸行动无法被打分。
- 任务族名称由部署策略决定；名称应当稳定、带命名空间且数量适度以累积打分历史。

## 8.2 派生工件契约 (Derived artifacts)

`Insight`、`Preference`、`Skill`、`SkillRevision`、`SelfModel` 与 `WorkingState` 属于派生工件，遵循统一契约：
1. **谱系必须明确记录**：通过 `derived_from` 或 `compiled_from` 连接源节点，生成活动必须将源节点列入 `inputs`。
2. **绑定 DerivationState**：派生工件可携带审阅者维护的 `DerivationState`（§6.3）。其生产/验证活动**必须**携带 DependencyBasis；普通 Recall 在审阅者写入 stale 之前即可检查计算得出的 `dependency_validity`。
3. **源节点修订不自动撤回工件**：通过 `LIST DEPENDENTS` 发现受影响工件并置为 `stale`，由复审流程做出处理。
4. **多层推导不增加独立证据效力**：佐证计算仅统计溯源根节点。
5. **唯有后果能够驱动晋升**：Skill 是唯一由后果通道驱动晋升的派生工件。

---

# 9. 活动 (Activities)

推荐的 Activity 类：

```text
experience_formation    (经验沉淀)
semantic_consolidation  (语义巩固)
reflection              (反思自省)
procedural_consolidation (程序性归纳)
skill_compilation       (技能编译)
skill_validation        (技能校验)
self_model_refresh      (自我模型刷新)
mnemonic_metabolism     (记忆代谢更新)
commitment_review       (承诺复审)
watch_fire              (关注警戒触发)
action_gate             (行动网关裁决)
derivation_review       (派生复审)
working_state_refresh   (工作状态刷新)
outcome_observation     (后果观测记录)
lifecycle_verdict       (生命周期裁决)
```

`action_gate` 记录做出的行动裁决（包括刻意的沉默），其 `inputs` 记录引用的确切技能修订版本与记忆。

`outcome_observation` 记录仪器写入的结果，`inputs` 指向对应的尝试与 `action_gate` 决策。其关联行动者为仪器的语义 Concept；认证的主体记录在引擎 origin 中，绝不占用 Concept 引用槽位。它绝不冒充被评定的行动者，写入它需要 `record_outcome` 权限（规范 §29.8）。

`lifecycle_verdict` 记录对后果流的一次确定性评估 —— 其不可变的 EvaluationRecord 指名确切修订版本、试验、选定的独立尝试/结果以及保留的回放工件。TrialRecord 冻结对比基准；TrialState 仅选择当前试验。运行时校验与记录的规则执行二者缺一不可。仅凭该类名的作者创建活动无法晋升技能。参见[认知一致性 §5–§6](../KIP-2.0-Cognitive-Consistency_CN.md)。

---

# 10. 事件形成 (Event Formation)

Event 应当简洁明了：时间戳、参与主体、事件摘要、上下文及证据引用。日常平凡回复可不产生 Event。

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

```text
proposed   已编译，当前修订版本携带 task_family；未评分
trialed    后果流正在依据记录的基线对其进行打分
adopted    经裁决晋升；暂定 —— 后果流持续监督
revoked    经裁决、反例或策略废弃；记录保留
```

允许的状态流转（每一项均作为 `lifecycle_verdict` 活动外加一条受保护的 UPDATE 执行，规范附录 F.6）：

```text
proposed → trialed    开启试用；必需 task_family；开启记录冻结 TrialRecord 并通过 TrialState 选择它 (§6.5)
trialed  → adopted    对照不可变的 TrialRecord 基线聚合独立尝试的比较性裁决；单次成功绝不足够
trialed  → revoked    裁决、反例或策略废弃
proposed → revoked    试用前撤回
adopted  → trialed    性能劣化裁决；重新试用，非无条件豁免
adopted  → revoked    裁决废弃；单次高严重度的匹配条件失败可能足以废弃
revoked  → trialed    重新准入开启新试用；任何技能绝不暗中复活
```

仅 `trialed → adopted` 属于晋升；`proposed → adopted` 与 `revoked → adopted` 均非法。EvaluationRecord 可以保持 `from_status == to_status`，例如在采纳后监控期间刷新 GradingState。此类评估遵循授权的监控/降级策略，可以记录证据不足或无改善，而无需声称新的晋升。保留采纳状态会在回放工件中保留先前经验证的采纳基准；它绝不豁免必需的降级。如 §5.8 所述，选择新修订版本将在该裁决流转表之外将当前资格重置。

流转规则：
1. **确定性流转**：状态晋升与降级必须由读取结果证据的确定性代码执行，严禁作者主观断言或执行模型自主裁定。
2. **比较性、可复算的采纳**：试用裁决回答的是*是否比既往基线表现更好*，而非*是否表现良好*。比对如何构建属于大脑策略；记录其基线属于 Profile 纪律：开启试用必须保留不可变的 TrialRecord 并通过 TrialState 选择它；裁决必须保留 EvaluationRecord 与完整回放输入，聚合独立尝试并钉固确切修订版本、规则与参数，且裁决应当可表达为关于该技能的命题 + 断言，以纳入可审计的主张图谱。
3. **废弃不难于采纳**：降级门槛不得高于晋升门槛。
4. **采纳是临时性的**：采纳的技能持续接受后果流监督，劣化将导致重新试用或废弃。
5. **细分评分语义**：区分匹配条件下的成功、匹配条件下的失败、非匹配条件下的失败等。
6. **正交的复审状态**：溯源根节点修订使技能进入 `stale`/`under_review`，可触发重新试用。
7. **打分前严格归因**：处理集由在执行前分配给该试验与修订版本的独立聚合尝试组成；基线是 TrialRecord 中冻结的显式选择的可比尝试（[认知一致性 §5–§6](../KIP-2.0-Cognitive-Consistency_CN.md)）。仅共享 task_family 的结果绝不修改技能的 GradingState 或改变其生命周期；同一任务族中的两项技能由各自的决策独立评分，绝不互相借用。

生命周期状态绝不授予执行权限。采纳代表资格地位，而非权限许可。

---

# 15. 偏好巩固 (Preference Consolidation)

显式陈述保持为 Evidence + Assertions。Preference 实体仅充当摘要索引，绝不替代历史。

---

# 16. 自我模型构建 (Self-Model Formation)

SelfModel 构建应当保持审慎，基于大量重复行为或显式更正归纳，严禁妄加揣测或越权声称权限。

---

# 17. 承诺语义 (Commitment Semantics)

到期时间的推移不会自动流转状态，直至策略或证据执行流转。等待与升级机制由关联的 `Watch` 承担。

---

# 18. 记忆代谢 (Mnemonic Metabolism)

典型合法变更：
- `memory_strength` 升降
- `salience` 调整
- `utility` 校准
- 归档资格判定
- 复审计划调度
- `GradingState` 累加（仅通过关联结果）

严禁基于时间衰减断言置信度。

---

# 19. 存储留存指南 (Retention Guidance)

留存策略严禁为了提升未来的认知投影表现而恶意物理清除反面证据。

---

# 20. 召回视图 (Recall Views)

```text
情节召回 (Episodic Recall)   = Event + 精选 Evidence
经验召回 (Experience Recall) = Experience + 有序 Steps + 结果
程序召回 (Procedural Recall) = Skill + 适用条件 + 可用的修订版本匹配评分 + utility + 经验范例
行动简报 (Action Briefing)   = 已接受知识 + 争议假设 + 技能 + 成功/失败案例 + 承诺 + 约束警告
苏醒简报 (Wake Briefing)     = WorkingState + 基于 basis_seq 的后续变更流
```

---

# 21. 数据可移植性 (Portability)

胶囊导入目标系统时，**严禁自动转移源系统的 self 身份、信任度、技能权限或治理策略**。

导入的 SkillRevision 保留行为与溯源，但在本地不获得本地资格或试验分配。源系统的回放工件保持可读，但绝不是本地评分。导入的技能重置为 `proposed` 状态，其在源系统的评分数据不予转移。源系统的 Watch 和 WorkingState 导入后默认为 disarmed（解除设防）与非当前状态。

---

# 22. 一致性测试要求 (Conformance Expectations)

Profile 一致性应当测试 Experience/Step 结构合法性、失败经历保留、MnemonicState 可变性、置信度与记忆强度解耦、GradingState 计数可变性、技能权限非放大性、胶囊可移植性、SelfModel 非权限性、承诺生命周期、Watch 非权限性、DerivationState 与认识论解耦、WorkingState 非证据性、DecisionRecord 非授权性、经验形成原子性、程序溯源、结果来源隔离（自评不计分）、结果归因严密性、试用必须具备任务族、试用开启写入 TrialState、裁决确定性与可复算性、以及导入时不继承生命周期资格。

---

# 23. Profile 核心不变式

本 Profile 的 46 条核心不变量完整收录于公共注册表 [KIP-2.0-Invariants_CN.md](../KIP-2.0-Invariants_CN.md) 的 Part B 中，编号为 `P1`–`P46`；每行标明了确立该不变量的章节及钉住该不变量的一致性测试向量。同一注册表的 Part A 为规范 §102 的清单，任何运行本 Profile 的底层运行时均已必须满足。

---

# 24. 极简 Profile 摘要

```text
Cognitive Memory Profile 2.0

Event: 发生了什么的紧凑客观记录
Experience: 目标导向的状态/行动/观察轨迹
ExperienceStep: 有序的客观可观测步骤；无隐藏思维链
caused_by: 步骤间显式的 结果→原因 命题主张；边顺序不代表因果
Insight: 从记忆中沉淀出的陈述性教训
Skill: 稳定的身份与 current_revision；SkillRevision: 不可变的行为/task_family/摘要；资格绝非执行权限
Commitment: 前瞻性记忆与承诺
Watch: 设防的注意力 —— 值得唤醒的状态差分或静默；触发不赋予任何权限
SelfModel: 关于自身的派生自省认知；非治理面
WorkingState: 当前关键上下文，以 basis_seq 标记；绝非 Evidence
MnemonicState: memory_strength + salience + utility；非置信度；Skill 同样具备
GradingState: 关联至应用了该工件的决策的结果计数；非权限
TrialState: 当前 trial_ref/revision_ref 指针；TrialRecord 冻结基线；EvaluationRecord 冻结裁决/回放
DerivationState: basis_seq + current|stale|under_review；复审状态，非信念
DecisionRecord: action_gate 活动上的 act|ask|defer|silence，inputs 指明所用认知；非授权
OutcomeRecord: 结果证据上的 task_family + outcome_status；由仪器编写，绝非行动者自身
task_family 用于寻找候选后果；TrialRecord 显式选择可比的基线尝试；outcome_observation 将结果链接至尝试与决策
lifecycle_verdict: 确定性、有记录、可复算的裁决；Skill 状态流转的唯一合法路径

涉真事实使用 Proposition + Assertion + Evidence 表达。
派生认知完整保留 Activity 溯源。
```

---

# 25. 终极准则

> **认知记忆 Profile 的使命，是使过往的记忆在结构上高度可重用，同时绝不将记忆的可访问性、认识论信念、自传体身份或程序性效用，与执行权限混为一谈。**
