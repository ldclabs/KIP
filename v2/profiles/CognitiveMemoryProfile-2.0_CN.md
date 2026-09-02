# KIP 认知记忆 Profile 2.0 (Cognitive Memory Profile 2.0)

**[English](./CognitiveMemoryProfile-2.0.md) | [中文](./CognitiveMemoryProfile-2.0_CN.md)**

## 规范状态

**规范性草案。** 本文档定义了**认知记忆 Profile 2.0（Cognitive Memory Profile 2.0）**，属于遵循 [KIP-2.0-SPECIFICATION_CN.md](../KIP-2.0-SPECIFICATION_CN.md) 规范的标准应用层 Profile。

支持该 Profile 的运行时**必须**提供本文档中定义的全部模式符号、切面与语义约束。

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

正式包标识符：

```text
kip://kip.systems/profile/cognitive-memory@2.0.0
```

命名空间缩写建议：`cog` 或省略（当作为 Space 默认包加载时）。

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

## 5.8 Skill（技能）

经过固化、可重复应用的程序性知识与操作模式。

```text
name              技能名称
attributes:
  skill_class     "interaction_pattern", "tool_usage", "reasoning_strategy", "workflow"
  task_family     必填；基线来源后果流（评分锚点）
  summary         技能摘要
  procedure       具体执行步骤/规范指令
  applicability   适用情境条件
  contraindications 禁忌与不适用场景
  status          "proposed", "trialed", "adopted", "revoked"
```

结构字段：
- `compiled_from`：编译出该技能的经验（`Experience`）。
- `compiled_by`：执行编译的活动（`Activity`）。

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
- 触发表现为一个受守卫的 UPDATE（将 status 改为 `fired`），并记录一条客户端键为 `watch_fire:<id>:<seq>` 的 `watch_fire` 活动，杜绝重复触发。
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

`WorkingState` 是派生视图，绝不能作为 `Evidence` 引用或充当佐证源泉。

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

挂载于携带 `task_family` 的工件（Skill 或订阅流的 Insight）上：

```json
{
  "success_count": 8,
  "failure_count": 2,
  "graded_count": 11,
  "last_verdict_at": "2026-08-10T00:00:00Z"
}
```

统计关联至**应用了该工件的决策活动**的结果证据数量。由生命周期裁决活动更新，绝不能由执行模型自身陈述累加，且绝不能由仅共享任务族的无关结果触发。

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

挂载于 `outcome` 类的结果证据（Outcome Evidence）上：

```json
{
  "task_family": "deploy/rollback",
  "outcome_status": "failure",
  "magnitude": 0.3
}
```

由测量仪器写入，客观反映真实后果。`task_family` 确定可比后果流基线；具体的打分归因由 `outcome_observation` 活动确定。

---

## 6.5 TrialState（试用状态）

挂载于处于试用期（trialed）的工件上，记录开启试用时的对比基线：

```json
{
  "opened_at": "2026-08-20T00:00:00Z",
  "basis_seq": 1480,
  "baseline_graded_count": 40,
  "baseline_success_count": 22,
  "baseline_failure_count": 15,
  "quota": 12,
  "rule_id": "adopt-if-better-v1"
}
```

由开启试用的 `lifecycle_verdict` 写入。使任何第三方审计员均可仅凭状态数据独立复算采纳裁决。

---

## 6.6 DecisionRecord（决策记录）

挂载于 `action_gate` 活动上，记录网关所做出的裁决：

```json
{
  "decision": "act",
  "rationale": "authorized, reversible, and the Watch condition matched"
}
```

裁决枚举：
- `act`：直接行动（已授权、可逆且值得）。
- `ask`：升级询问人类。
- `defer`：推迟稍后处理。
- `silence`：深思熟虑后保持沉默，不做任何动作。

活动输入的 `inputs` 记录了做决策时所应用的各项认知（触发条件、技能、召回记忆）。

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
                  寻找可比后果流，确定试用裁决的对比基线

归因 (attribution) outcome_observation Activity {inputs: 决策活动, outputs: 结果证据}
                  明确指明被该结果打分的具体单次决策；
                  决策活动的 inputs 包含所应用的技能与引用的记忆
```

后果通道向四个消费者提供数据：
1. **技能生命周期裁决**（§14）：关联结果与 `TrialState` 基线对比。
2. **GradingState 计数**（§6.2）：仅统计关联结果。
3. **MnemonicState.utility 校准**（§6.1）：根据决策 inputs 反向更新记忆效用下注。
4. **信任度校准**：依据规范 §22.6。

纪律约束：
- 行动执行模型绝不能编写用于评估自身行动的结果证据。
- 结果必须通过 `outcome_observation` 显式链接到决策，才能用于打分。
- 未建立网关决策记录的裸行动无法被打分。

## 8.2 派生工件契约 (Derived artifacts)

`Insight`、`Preference`、`Skill`、`SelfModel` 与 `WorkingState` 属于派生工件，遵循统一契约：
1. **谱系必须明确记录**：通过 `derived_from` 或 `compiled_from` 连接源节点，生成活动必须将源节点列入 `inputs`。
2. **绑定 DerivationState**：记录最近核验的 `basis_seq`；`stale` 仅为复审标记。
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

`action_gate` 记录做出的行动裁决（包括刻意的沉默），其 `inputs` 记录引用的认知。

`outcome_observation` 记录仪器写入的结果，`inputs` 指向对应的 `action_gate`。

`lifecycle_verdict` 记录基于关联结果与 `TrialState` 基线对 Skill 执行的确定性状态流转。

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

提议生成新 Skill 时，**必须**挂载 `task_family`，无法被证伪打分的模式不属于程序性记忆。

---

# 14. 技能生命周期 (Skill Lifecycle)

```text
proposed (提议) → trialed (试用) → adopted (采纳) → revoked (废弃)
```

流转规则：
1. **确定性流转**：状态晋升与降级必须由读取结果证据的确定性代码执行，严禁作者主观断言或执行模型自主裁定。
2. **比较性、可复算的采纳**：裁决评估的是*是否比既往基线表现更好*。开启试用时必须写入 `TrialState`，最终裁决必须将所依据的结果列为 `inputs`，使审计员可独立复算。
3. **废弃不难于采纳**：降级门槛不得高于晋升门槛。
4. **采纳是临时性的**：采纳的技能持续接受后果流监督，劣化将导致重新试用或废弃。
5. **细分评分语义**：区分匹配条件下的成功、匹配条件下的失败、非匹配条件下的失败等。
6. **正交的复审状态**：溯源根节点修订使技能进入 `stale`/`under_review`，可触发重新试用。
7. **打分前严格归因**：仅统计指向应用该技能的决策活动的结果；仅同属任务族而未链接决策的结果绝不修改技能的 `GradingState`。

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
程序召回 (Procedural Recall) = Skill + 适用条件 + GradingState + utility + 经验范例
行动简报 (Action Briefing)   = 已接受知识 + 争议假设 + 技能 + 成功/失败案例 + 承诺 + 约束警告
苏醒简报 (Wake Briefing)     = WorkingState + 基于 basis_seq 的后续变更流
```

---

# 21. 数据可移植性 (Portability)

胶囊导入目标系统时，**严禁自动转移源系统的 self 身份、信任度、技能权限或治理策略**。

导入的技能重置为 `proposed` 状态，其在源系统的评分数据不予转移。源系统的 Watch 和 WorkingState 导入后默认为 disarmed（解除设防）与非当前状态。

---

# 22. 一致性测试要求 (Conformance Expectations)

Profile 一致性应当测试 Experience/Step 结构合法性、失败经历保留、MnemonicState 可变性、置信度与记忆强度解耦、GradingState 计数可变性、技能权限非放大性、胶囊可移植性、SelfModel 非权限性、承诺生命周期、Watch 非权限性、DerivationState 与认识论解耦、WorkingState 非证据性、DecisionRecord 非授权性、经验形成原子性、程序溯源、结果来源隔离（自评不计分）、结果归因严密性、试用必须具备任务族、试用开启写入 TrialState、裁决确定性与可复算性、以及导入时不继承生命周期资格。

---

# 23. Profile 核心不变式

本 Profile 的 35 条核心不变量完整收录于公共注册表 [KIP-2.0-Invariants_CN.md](../KIP-2.0-Invariants_CN.md) 的 Part B 中，编号为 `P1`–`P35`；每行标明了确立该不变量的章节及钉住该不变量的一致性测试向量。同一注册表的 Part A 为规范 §102 的清单，任何运行本 Profile 的底层运行时均已必须满足。

---

# 24. 极简 Profile 摘要

```text
Cognitive Memory Profile 2.0

Event: 发生了什么的紧凑客观记录
Experience: 目标导向的状态/行动/观察轨迹
ExperienceStep: 有序的客观可观测步骤；无隐藏思维链
caused_by: 步骤间显式的 结果→原因 命题主张；边顺序不代表因果
Insight: 从记忆中沉淀出的陈述性教训
Skill: 附带 task_family 的可重用程序；proposed|trialed|adopted|revoked；绝非执行权限
Commitment: 前瞻性记忆与承诺
Watch: 设防的注意力 —— 值得唤醒的状态差分或静默；触发不赋予任何权限
SelfModel: 关于自身的派生自省认知；非治理面
WorkingState: 当前关键上下文，以 basis_seq 标记；绝非 Evidence
MnemonicState: memory_strength + salience + utility；非置信度；Skill 同样具备
GradingState: 关联至应用了该工件的决策的结果计数；非权限
TrialState: 开放试用所对照记录的对比基线；非地位资格
DerivationState: basis_seq + current|stale|under_review；复审状态，非信念
DecisionRecord: action_gate 活动上的 act|ask|defer|silence，inputs 指明所用认知；非授权
OutcomeRecord: 结果证据上的 task_family + outcome_status；由仪器编写，绝非行动者自身
task_family 用于寻找对比基线；仅有 outcome_observation 链接才能归因后果至特定决策
lifecycle_verdict: 确定性、有记录、可复算的裁决；Skill 状态流转的唯一合法路径

涉真事实使用 Proposition + Assertion + Evidence 表达。
派生认知完整保留 Activity 溯源。
```

---

# 25. 终极准则

> **认知记忆 Profile 的使命，是使过往的记忆在结构上高度可重用，同时绝不将记忆的可访问性、认识论信念、自传体身份或程序性效用，与执行权限混为一谈。**
