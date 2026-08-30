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
```

不产生任何写入（空写入）也是完全合法的处理结果。

# 4. 存储准入门槛

优先持久化的强候选对象：

```text
用户明确表达的持久事实
事实纠错
明确的偏好
人际/实体关系
关键决策
承诺与约定
重大事件
故障与恢复轨迹
预测偏差
新颖操作流程
高价值工具调用结果
高学习价值的经验
稳定的自我模型信号
```

通常应忽略：日常客套应答、低价值闲聊、临时的格式调整要求、重试产生的重复信息、过程噪声、低价值的臆测性推论以及内部私有思维链。

记忆存储代表对未来决策价值的预期投入。在形成阶段设置 `MnemonicState` 时应同步赋予 `utility` 初始值，以便 Maintenance 维护流程在后续根据实际使用成效进行显式校准，避免盲目保留低效记忆。

# 5. 标准执行工作流

```text
0. 获取经授权的执行上下文
1. 检查 Primer / Schema
2. 捕获来源 Evidence
3. 解析语义行动者与实体
4. 判定并分类记忆产物
5. 接地精确的 Schema 符号与实体标识
6. 构建语义 Assertions
7. 构建 Event / Experience / Commitment
8. 补充 Activities / Facets / retention 留存配置
9. 在保证数据一致性的前提下原子性提交事务
10. 解析提交回执 (Receipt) 并处理不确定结果
```

# 6. 执行上下文就绪

在执行认知写入前：

```text
解析目标 MemorySpace
解析经认证的 Principal
加载当前 Governance 治理上下文
捕获当前 Schema Environment
读取 DESCRIBE PRIMER / capabilities
```

严禁根据不可信的消息内容动态选择目标 Space。未授权的输入绝不能被静默重定向到其他 Space。

# 7. 证据捕获规范

完整保留原生观测：如消息、工具调用返回、测量值、用户反馈、原始文档或外部断言。

优先使用运行时接入注入机制（规范第 71.1 节）或制品句柄：由运行时直接基于传输层封包生成 Evidence，Formation 在指令中仅通过参数（`:key`）引用。严禁在 KML 指令文本中手动重新抄写观测载荷，否则会导致内容截断或模型篡改，从而伪造“假证据”（规范第 88.12 节）。

推荐的 Evidence 类别：

```text
user_statement   （用户陈述）
agent_statement  （智能体陈述）
tool_result      （工具返回）
measurement      （测量数据）
message          （原始消息）
document         （文档制品）
human_feedback   （人工反馈）
observation      （系统观测）
```

条件允许时，使用源消息/事件的稳定标识作为 `client_key`：

```text
相同 client_key + 相同不可变载荷 → 判定为重试 / 不重复创建
相同 client_key + 不同不可变载荷 → 触发 ClientKeyConflict 冲突
```

# 8. 语义行动者解析

解析优先级：显式已验证的行动者引用 > 稳定的业务行动者 ID > 可信的权威实体标识 > 检索接地的候选对象。

显示名称（Display Name）绝不能作为全局唯一标识。若实体身份存在歧义，应直接保留原始 Evidence 而非盲目绑定到某个 Person 节点。

# 9. 记忆产物分类决策

## 情景类 (Episodic)
`Event`：发生了什么？

## 经验类 (Experience)
`Experience + Steps`：该执行过程是否具备复用价值？

## 语义类 (Semantic)
`Proposition + Assertion`：观测到、陈述了或推导出了哪些涉真主张？

## 前瞻类 (Prospective)
`Commitment`：有哪些未来的义务、约定或提醒值得关注？

## 反思类 (Reflective)
`Insight / SelfModel candidate`：提炼出了哪些长效规律或自我认知模式？

严禁将所有输入机械地套入全部类别中。

# 10. 事件 (Event) 与经验 (Experience) 的选型

当存在多步目标追寻、故障与恢复、预期落空、策略调整、纠错反馈、关键工具调用链、命中 Skill 反例或新颖可复用流程时，创建 Experience。

否则优先创建 Event 或不生成情景制品。

# 11. 写入前强制接地

利用 META 与 SEARCH 命令精确解析 Concept ID、确切 Schema 版本引用、谓词标识、Facet 结构、结构引用字段及已合并的目标规范实体。

SEARCH 检索得分仅代表接地相关性：

```text
_score ≠ confidence ≠ trust ≠ belief support ≠ memory_strength
```

持久化时必须使用确切的 Schema 版本，严禁使用 `@latest`。

# 12. 语义主张构建

涉真持久主张的标准构建流程：

```text
Evidence
→ ENSURE PROPOSITION
→ CREATE ASSERTION
```

严禁将 `confidence`、`source`、`validity` 或 `asserted_by` 直接写入 Proposition 节点。

# 13. 用户口头陈述的标准处理范式

以用户陈述 `"I prefer dark mode"` 为例（`prefers` 谓词由认知记忆 Profile 定义；领域事实如 `timezone` 则依赖领域模式包）：

**推荐最佳路径**：利用运行时接入上下文（规范第 71.1 节）直接将传输封包转化为 `:msg` 证据参数，并使用 `ASSERT` 语法糖（规范第 55.1 节）记录带归属的主张：

```prolog
ASSERT (:alice, "prefers", :dark_mode) {
  by: :alice,
  mode: "stated",
  confidence: :confidence,
  evidence: :msg
}
```

Evidence 载荷全程不经过大模型生成的文本，彻底杜绝了模型截断或二次转述失真的风险。

**展开语法糖 / 无接入注入时的等效语句**：

```prolog
MUTATE {
  CREATE EVIDENCE ?message {
    CLIENT KEY :message_key
    SET FIELDS {
      evidence_class: "user_statement",
      payload: :payload,
      observed_at: :time
    }
    SET STRUCTURAL {
      ("source", :alice)
    }
  }

  ENSURE PROPOSITION ?p (:alice, "prefers", :dark_mode)

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key
    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: :confidence,
      asserted_at: :time
    }
    SET STRUCTURAL {
      ("evidence", ?message) {role: "support"}
    }
  }

  CREATE ACTIVITY ?formation {
    SET FIELDS {
      activity_class: "extraction",
      status: "completed"
    }
    SET STRUCTURAL {
      ("inputs", ?message)
      ("outputs", ?a)
    }
  }
}
```

底层引擎的 origin 会自动记录发起调用的真实 Principal。**严禁**人工指定 `_system.origin`。

# 14. 观测、陈述与推理模式划分

精确指定断言模式（mode）：

```text
observed    工具直接返回 HTTP 403
stated      Alice 明确表示其时区为 +08
inferred    大脑推断 Token 大概率已过期
predicted   大脑预测系统将发生停机
hypothetical 假设性场景推演分支
imported    从另一个外部大脑导入的认知数据
```

严禁将系统推理擅自升级为事实观测。

# 15. 置信度语义

Assertion 的 confidence 仅衡量当前断言立场的确定性强度。它绝非信息源信任度、记忆强度、检索得分或 Skill 效用分。

用户明确的口头陈述可以支持极高的置信度表明“**Alice 陈述了 P**”，但这并不自动等于极高置信度证明“**P 在客观世界中绝对为真**”。通过归属主体（asserted_by）、断言模式（mode）、证据引用（evidence）与后续的认识投影（Epistemic Projection），系统严谨保留了这一本质区分。

# 16. 事实更正规范

显式更正必须完整保留历史血统链：

```text
旧断言 A1
+ 新证据 E2
+ 新命题（若需要）
+ 新断言 A2
+ SUPERSEDE ASSERTION A1 BY A2
+ belief_revision Activity
```

语法糖形式：`ASSERT (...) {by: ..., mode: ..., evidence: :e2} SUPERSEDING :a1`。

严禁直接覆写或原地修改 A1。若 Bob 与 Alice 的意见发生分歧，应创建 Bob 的新断言并存记录，绝不能废弃替代 Alice 的断言。

# 17. 字面量数据处理

直接使用字面量作为三元组的 Object：

```text
(Alice, timezone, "+08:00")
(Service, healthy, true)
```

除非领域模式有特殊显式建模要求，否则无需为基础字面量数据创建 Concept 节点。

# 18. 事件构建规范

Event 保持紧凑：包含事件类别、摘要、时间、结果、上下文、参与者、关联 Evidence 及关键 Concept。Event 摘要本身不构成独立证据。

# 19. 经验构建规范

构建 Experience 时尽量保证原子性协同提交：

```text
来源 Evidence
Experience 节点
各 ExperienceStep 节点
MnemonicState
formation 类型的 Activity
可选的 Event
可选的语义 Assertions
```

具体合法字段与结构引用完全由 Profile Schema 裁决，严禁臆造 ad-hoc 字段。

# 20. 失败经验处理

失败经验是完全合法的头等记忆。完整保留具备排障与借鉴价值的失败与恢复步骤。失败经验的学习价值往往高于常规成功。

# 21. 预测偏差记录

若轨迹中显式包含预期观测与实际观测，必须同时记录两者。严禁臆造不存在的隐藏预期；若属于大脑推断出的预期，必须以 inference 模式带溯源记录。

# 22. 承诺构建规范

对承诺事项、截止日期、跟进任务、提醒及未来义务创建 Commitment。尽可能解析发起人、受益人、到期时间、状态与主题。Commitment 不会自动触发外部物理执行。

对于等待外部反馈的承诺事项，应将其触发条件建模为 Watch——分为 delta（如「收到回复时」）或 silence（如「周四前未收到回复」）——并通过 `derived_from` 关联该 Commitment。触发条件由 Watch 管理；Watch 激活仅产生注意力，不授予任何操作权限。

# 23. 偏好构建规范

明确的口头偏好声明依然采用 Evidence + Proposition + Assertion 记录。Preference Profile 制品仅用于汇总稳定性，不能替代 Assertion 的历史记录。

# 24. 自我模型候选对象

高价值候选信号：明确的自我纠错、持久的价值观/使命声明、经检验的新能力获得、反复展现的行为偏好、重大系统局限性、重大身份里程碑。

弱信号通常应推迟至 Maintenance 阶段集中反思处理，避免频繁即时改写 SelfModel。

# 25. 即时知识巩固

Formation 仅可执行显而易见、低风险的即时巩固：如直接纠错、重试去重、明确的口头偏好记录及清晰的 Commitment 创建。大规模的通用 Skill 编译提炼必须交由 Maintenance 阶段处理。

# 26. 幂等性与重试规范

严格遵循双重标识：

```text
事务 idempotency_key → 逻辑提交维度的重试保护
持久 client_key      → 实体级别的事件唯一标识
```

网络超时不等于操作中止。在重新发起非幂等写入前，必须先通过幂等键查询事务实际执行状态。

# 27. 事务边界控制

在局部状态残留会导致认知误导的场景中，必须使用原子事务（atomic Transaction）：

```text
Evidence + Assertion
Experience + Steps + Activity
更正 + 废弃替代 + Activity
```

相互无关的产物可在允许局部成功的场景下使用独立事务提交。

# 28. 治理与密级继承

Formation 严格遵从 Space 可见性、数据密级分类、写入权限、行动者代理权、存储留存策略及 Schema 权限控制。

派生产物的密级至少应与输入材料中最严格的密级保持一致（除非经过显式降密授权）。机密输入默认严禁生成公开摘要。

# 29. 外部导入认知处理

完整保留 imported 模式与溯源信息。严禁将外部导入的陈述擅自标记为本地观测，严禁直接继承外部信任等级或外部 Skill 执行授权。

# 30. 模式演进限制

Formation 通常不具备 Schema 管理员权限。若遇到缺失的类型或谓词，优先使用现有的泛型模式、安全保留未解析的认知内容，或发起 Schema 审核工单。严禁在单次写入中自动激活新的 Schema Package。

# 31. 留存与时效维度的解耦

严禁混淆以下五个时间概念：

```text
Assertion.valid_time     （陈述在现实世界中的有效时效）
Evidence.observed_at     （现实观测发生的物理时间戳）
retention.expires_at     （数据在存储介质上的物理留存过期时间）
memory_strength          （认知层面的记忆可提取强度）
Commitment.due_at        （承诺事项的业务履约截止时间）
```

# 32. 提交后处理

提交成功后，记录并返回携带 `tx_id` 与 `space_seq` 的提交回执（Receipt）并结束流程。严禁为了所谓的“强化记忆”在写入后立即多余地回读一遍数据。

# 33. 不确定执行结果处理

当收到 `outcome_unknown` 状态时，在重试前必须先根据幂等键查询事务实际状态。**绝对不能**主观推断“超时即代表未写入”。

# 34. 输出数据契约

```json
{
  "status": "stored",
  "space_id": "...",
  "tx_id": "...",
  "space_seq": 123,
  "products": {
    "evidence": 1,
    "assertions": 1,
    "events": 0,
    "experiences": 1,
    "commitments": 0
  },
  "warnings": []
}
```

无需写入时的标准返回：

```json
{"status": "skipped", "reason": "no durable cognitive value"}
```

# 35. 记忆形成核心不变式

1. 输入内容无法自行决定系统权限。
2. 鉴权主体 Principal 绝不是语义行动者 Actor。
3. 记录主张归属不等于身份冒用。
4. 在可行情况下，Evidence 必须先于涉真持久主张生成。
5. 命题存在不代表已被采信为真。
6. Assertion 负责承载立场、置信度与归属。
7. 事实纠错必须完整保留历史。
8. 第三方主体间的意见分歧绝不能直接废弃对方断言。
9. 经验形成必须保持审慎与选择性。
10. 失败的 Experience 同样是合法的有效记忆。
11. 严禁存储私有隐藏的思维链。
12. SEARCH 检索得分绝不是置信度。
13. 记忆强度 memory_strength 绝不是置信度。
14. 网络重试不等于新的现实观测。
15. 超时绝不等于操作已中止。
16. Formation 绝不能自行激活 Schema 权限。
17. 导入的认知不等于本地背书。
18. SelfModel 绝不是治理策略 Governance。
19. Commitment 绝不等于外部物理执行。
20. 原子性形成保证不残留误导性的局部认知状态。
21. Evidence 载荷直接由传输层封包捕获，严禁经由模型文本重新生成。

# 36. 终极准则

> **记忆形成的核心使命，是准确沉淀足够丰富的结构化证据与经验以供大脑在未来学习，同时绝不为了追求所谓的整洁图谱而凭空捏造信念、身份、溯源或系统权限。**
