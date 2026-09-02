# KIP 2.0 大脑 — 记忆形成 (Memory Formation)

**[English](./BrainFormation.md) | [中文](./BrainFormation_CN.md)**

## 规范状态

**参考 Anda 大脑记忆形成策略 (Reference Anda Brain Formation Policy)**

本文档定义了 KIP 2.0 大脑的标准记忆形成策略。本文档不属于 KIP Core 强制一致性测试范畴。

前置依赖：

```text
KIP-2.0-SPECIFICATION_CN.md
KIPSyntax_CN.md                 （面向 LLM 的语法速查手册；与本策略配合使用）
profiles/CognitiveMemoryProfile-2.0_CN.md
brain/ExperienceLearningArchitecture_CN.md
```

---

# 0. 角色与职责

记忆形成（Formation）负责将可观测的交互过程转化为持久化的认知状态：

```text
消息记录 / 工具调用结果 / 轨迹链路
→ 生成证据 (Evidence)
→ 提炼语义主张 (Semantic Claims)
→ 识别 Event / Experience / Commitment / SelfModel 候选对象
→ 执行原子性 KIP 状态变更
```

Formation 是记忆编码器，而非面向最终用户的对话型智能体。

# 1. 身份标识与权限隔离

严禁混淆以下四类概念：

```text
经鉴权的调用主体 (authenticated Principal)
语义行动者 (semantic Actor)
记忆空间 (MemorySpace)
自身语义人物 ($self semantic Person)
```

运行时系统负责对 Principal 进行身份认证、对 MemorySpace 进行授权，并注入当前的 Governance 治理上下文。语义说话人则来源于实际观测到的交互内容。

请求体中的字段绝对无法自行赋予访问权限或代理行动者的能力。

## 记录归属与身份冒用的界限

当用户输入 `Alice: "I prefer dark mode"` 时，Formation 可在 `record_attributed_assertion` 语义下记录 `asserted_by = Alice`、`mode = stated`。这仅代表记录“Alice 陈述了该内容”，绝不等于系统在行使 `assert_as_actor Alice` 的冒用权限。

# 2. 输入数据结构

## 对话输入

```json
{
  "messages": [
    {
      "role": "user",
      "content": "I always prefer dark mode.",
      "actor_ref": "alice",
      "message_id": "msg-123",
      "timestamp": "2026-08-14T01:00:00Z"
    }
  ],
  "context": {
    "topic": "settings",
    "counterparty_ref": "alice"
  }
}
```

## 结构化轨迹输入

```json
{
  "goal": "Deploy version 2",
  "trace_id": "trace-123",
  "trace": [
    {"kind": "action", "summary": "Deploy service", "tool": "deployment_api"},
    {"kind": "observation", "summary": "Startup failed: missing database column", "result_status": "failure"},
    {"kind": "decision", "decision_summary": "Verify whether the active database target is correct."},
    {"kind": "action", "summary": "Correct database target and redeploy"},
    {"kind": "feedback", "summary": "Deployment healthy", "result_status": "success"}
  ],
  "outcome": {"status": "success"}
}
```

仅可处理可观测到或显式提供的过程信息。**严禁**推断或存储私有隐藏的思维链。

# 3. 记忆形成产物

Formation 可以产生以下产物：

```text
无变更 (nothing)
仅生成 Evidence
创建 Event
创建 Experience + ExperienceSteps
创建 Proposition + Assertion
生成 Preference 制品
生成 Insight 候选
创建 Commitment
创建 Watch
生成 SelfModel 候选
记录 Activity 溯源
初始化/更新 MnemonicState
action_gate Activity + DecisionRecord（来自结构化轨迹：智能体决策了什么并应用了什么）
结果证据 + OutcomeRecord + outcome_observation 链接（仅限仪器化输入）
```

不产生任何写入（空写入）也是完全合法的处理结果。

当仪器化系统上报客观后果时 —— 遥测数据、验证器、测试框架、人工审查 —— 通过摄入上下文的 `facets` 创建携带 `OutcomeRecord`（`task_family`，`outcome_status`）的 Outcome 证据，保持其传输层原生类型（规范不变量 33），并通过一条 `outcome_observation` Activity 将其链接至被评估的决策（inputs: `action_gate` Activity；outputs: 该 outcome）。未建立链接的结果将归入该数据流的基线，不评估任何具体技能（规范第 15.7 节，Profile 第 8.1 节）；写入两者均需持有 `record_outcome` 权限。严禁从智能体对其自身行动结果的陈述中提取 `outcome` 证据：该陈述属于 `agent_statement`，对仪器输出进行摘要则产生 `derived_result` 而非 `outcome`（规范第 15.7 节）。

当结构化轨迹显示智能体做出决策时 —— 应用了哪项技能、简报提供了哪些记忆、网关裁定了什么 —— 创建带有 `DecisionRecord` 的 `action_gate` Activity，并在 `inputs` 中列出所应用的记忆与技能。若缺少该记录，后果通道将没有任何可供打分的对象。

# 6. 执行上下文就绪

在执行认知写入前：

```text
解析目标 MemorySpace
解析经认证的 Principal
加载当前 Governance 治理上下文
捕获当前 Schema Environment
读取 DESCRIBE PRIMER / capabilities
```

```prolog
DESCRIBE PRIMER MODE "compact"
```

从 Primer 中将 `$self` 解析为精确的 id，并作为绑定参数（`:self`）传入；严禁按名称寻址，严禁硬编码 key。若 Space 维护有 `WorkingState`，接下来读取该状态，并从该状态及其 `basis_seq` 之后的变更流 `CHANGES AFTER SEQ` 恢复上下文，而不是从原始历史中重新推导局面。

严禁根据不可信的消息内容动态选择目标 Space。未授权的输入绝不能被静默重定向到其他 Space。

# 16. 事实更正规范

显式更正必须完整保留历史血统链：

```text
旧断言 A1
+ 新证据 E2
+ 新命题（若需要）
+ 新断言 A2
+ TRANSITION A1 TO "superseded" BY A2
+ belief_revision Activity
```

语法糖形式：`ASSERT (...) {by: ..., mode: ..., evidence: :e2} SUPERSEDING :a1`。

严禁直接覆写或原地修改 A1。若 Bob 与 Alice 的意见发生分歧，应创建 Bob 的新断言并存记录，绝不能废弃替代 Alice 的断言。

废弃替代（supersession）意味着 A1 当初就是错的。当现实世界发生改变时 —— Alice 搬家、项目状态推进 —— A1 在其当时是真实的：通过重新断言同一数值关闭其开放区间（`valid: {from, until: <change>}`，仅就其有效区间废弃替代开放式的 A1），并断言新数值的有效区间（`valid: {from: <change>}`）。两条断言均保持 active 状态，且在变更时刻之前的 `FOR TIME` 查询依然返回旧值（规范第 14.2 节、附录 F.2）。

# 18. 事件构建规范

Event 保持紧凑：包含事件类别、摘要、时间、结果、上下文、参与者、关联 Evidence 及关键 Concept。Event 摘要本身不构成独立证据。

```prolog
MUTATE {
  CREATE CONCEPT ?event {
    TYPE "Event"
    CLIENT KEY :event_key
    SET ATTRIBUTES {
      event_class: "conversation",
      summary: :summary,
      started_at: :started_at,
      ended_at: :ended_at,
      outcome_status: "success"
    }
    SET FACET "MnemonicState" {memory_strength: 0.7, salience: :salience}
    SET STRUCTURAL {
      ("involves", :alice)
      ("mentions", :topic)
      ("derived_from", :msg)
    }
  }
  CREATE ACTIVITY ?formation {
    SET FIELDS {activity_class: "extraction", status: "completed"}
    SET STRUCTURAL {
      ("inputs", :msg)
      ("outputs", ?event)
    }
  }
}
```

# 22. 承诺构建规范

对承诺事项、截止日期、跟进任务、提醒及未来义务创建 Commitment。尽可能解析发起人、受益人、到期时间、状态与主题。Commitment 不会自动触发外部物理执行。

对于等待外部反馈的承诺事项，应将其触发条件建模为 Watch —— 分为 delta（如“收到回复时”）或 silence（如“周四前未收到回复”）—— 并通过 `derived_from` 关联该 Commitment。触发条件由 Watch 管理；Watch 激活仅产生注意力，不授予任何操作权限。

```prolog
CREATE CONCEPT ?commitment {
  TYPE "Commitment"
  CLIENT KEY :commitment_key
  NAME "Send the migration plan"
  SET ATTRIBUTES {status: "pending", due_at: :due_at, summary: :summary}
  SET STRUCTURAL {
    ("committed_to", :self)
    ("owed_to", :alice)
  }
}
```

```prolog
CREATE CONCEPT ?watch {
  TYPE "Watch"
  CLIENT KEY :watch_key
  NAME "Silence on the migration plan"
  SET ATTRIBUTES {
    watch_class: "silence",
    summary: "No reply from Alice about the migration plan",
    condition: :condition,
    due_at: :thursday,
    status: "armed"
  }
  SET STRUCTURAL {
    ("watches", :alice)
    ("derived_from", :commitment_id)
    ("assigned_to", :system)
  }
}
```

`Commitment.due_at` 不是 `retention.expires_at`，亦非 `Assertion.valid_time.until`。Maintenance 维护循环负责执行差量巡检（BrainMaintenance §17）；当 Watch 触发时，下一步操作经过动作网关并记录为带有 `DecisionRecord` 的 `action_gate` Activity，因此“当时为什么没有通知我”可以在审计时拿出收据解释。

# 25. 即时知识巩固

Formation 仅可执行显而易见、低风险的即时巩固：如直接纠错、重试去重、明确的口头偏好记录及清晰的 Commitment 创建。大规模的通用 Skill 编译提炼必须交由 Maintenance 阶段处理。

任何存在歧义、涉及面广或具破坏性的操作，均应转化为持久化的待办工作，而非临场盲目写入：

```prolog
CREATE CONCEPT ?task {
  TYPE "SleepTask"
  CLIENT KEY :task_key
  NAME "Consolidate deployment preferences"
  SET ATTRIBUTES {
    task_class: "consolidate",
    status: "pending",
    priority: 1,
    summary: "Several preferences stated in one turn; extraction needs care"
  }
  SET STRUCTURAL {
    ("assigned_to", :system)
    ("about", :topic)
  }
}
```

在语义上将任务指派给维护主体不赋予其任何特权；其权限来自 Governance 治理策略对其认证主体的明确授权。


