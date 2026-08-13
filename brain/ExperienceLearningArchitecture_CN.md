# KIP Brain 经验学习架构

## 状态

**认知架构扩展提案**

本文定义如何把基于 KIP 的 Brain 从持久知识记忆扩展成一套**经验学习系统**。它不要求修改 KQL/KML Core 语法；现有 Concept / Proposition 模型足以表示这里的结构。

具体 Schema 与谓词见 [CognitiveMemoryProfile_CN.md](CognitiveMemoryProfile_CN.md)。

---

## 1. 为什么需要这项扩展

多数面向语言智能体的长期记忆系统，主要在回答一个检索问题：

> 过去有哪些信息与当前问题相似或相关？

这很有用，但还不等于从经验中学习。一个会学习的智能体还需要回答：

> 上次处在相似状态时，我尝试了什么、预期什么、实际发生了什么、为什么修正判断，这次应该怎样做得不同？

几个概念的边界如下：

```text
Knowledge：通常什么是真的？
Event：发生了什么？
Experience：主体追求目标时经历了什么？
Skill：在给定条件下，什么做法通常有效？
Memory：过去如何参与未来计算？
```

因此，这套架构把 **Experience** 与 **Skill** 和语义记忆、情景记忆一样，视为一等记忆产物。

---

## 2. 核心定义

### 2.1 Knowledge

**Knowledge 是从经验或证据中压缩出的规律。**

它通常已经脱离具体情境，可以在不同场景中复用。例如：

- “令牌过期时，这个 API 返回 403。”
- “Alice 偏好深色模式。”
- “湿滑路面会降低轮胎抓地力。”

Knowledge 回答的是：

> **哪些事情是真的、很可能是真的，或者通常值得相信？**

在 KIP 中，语义知识自然由 Concept Node 与 Proposition Link 表示。

### 2.2 Event

**Event 是一段有边界情境中“发生了什么”的情景锚点。**

Event 通常保留时间、参与者、上下文、摘要、结果和关键概念，不必保存每一个动作或观察。

例如：

> “v2 部署最初失败，修正数据库目标后成功。”

这是一条合格的 Event 摘要，足以支持情景召回和自传式记忆，却不足以支持流程迁移。

### 2.3 Experience

**Experience 是主体为了一个目标，在具体情境中实际走过的轨迹。**

可以抽象为：

```text
Experience =
  目标
  + 初始状态 / 信念
  + [行动 → 观察 → 判断更新]*
  + 结果
  + 反馈
```

它回答：

> **当时处于什么状态，做了什么，看到了什么，这些观察又怎样改变了通往结果的路径？**

这里必须谨慎使用“因果”一词。轨迹默认只保存时间顺序；只有证据充分时，才创建显式 `caused_by` 关系，不能把相邻步骤直接当成因果。

### 2.4 Insight

**Insight 是从一段或多段 Experience 中抽象出的陈述式教训。**

典型结构是：

```text
trigger
correction
context
```

例如：

> “部署报告缺失字段时，先核对实际数据库目标，不要立即认定迁移失败。”

Insight 很有用，但它仍是陈述性知识：我知道下次应该考虑什么。

### 2.5 Skill

**Skill 是由 Experience 编译出的可执行策略或流程。**

它回答：

> **满足这些条件时，我应该怎么做？**

Skill 可以表现为启发式规则、工作流、检查清单、工具策略、提示词、代码或子智能体配置。它应保存触发条件、适用上下文、成功标准、失败信号和验证证据。一次成功不足以证明它处处适用。

### 2.6 Memory

**Memory 不是一种数据类型，而是过去状态影响未来计算的机制。**

一个系统可以存下数百万条记录；如果这些记录不会改变后续预测或行为，它仍然没有形成真正的功能性记忆。

可以用一个简单标准判断：

> 如果删除某条存储内容，不会改变任何相关的未来内部状态、预测或行动，那么它只是档案，不是正在发挥作用的记忆。

---

## 3. 经验学习闭环

```text
当前目标 + 状态
       │
       ▼
   智能体决策
       │
       ▼
      行动
       │
       ▼
   环境 / 工具
       │
       ▼
      观察
       │
       ▼
   结果 / 反馈
       │
       ▼
 Experience Formation
       │
       ├────────> 语义巩固 ─────> Knowledge
       ├────────> 反思 ─────────> Insight / Self-model
       └────────> 程序性巩固 ───> Skill
                                     │
                                     ▼
                                Action Recall
                                     │
                                     ▼
                                  未来决策
                                     │
                                     └────↺
```

只有巩固结果能改变后续行为，这个闭环才算完成。

---

## 4. Event 与 Experience

两者不能混为一谈。

| | Event | Experience |
| --- | --- | --- |
| 主要问题 | 发生了什么？ | 主体走过了什么路径？ |
| 常见大小 | 紧凑 | 可能包含多步 |
| 主要用途 | 情景召回、溯源、自传锚点 | 学习、迁移、避免重错 |
| 顺序 | 粗粒度时间 | 显式有序步骤 |
| 行动 | 可选 | 一等字段 |
| 观察 | 可选 | 一等字段 |
| 预期 | 可选 | 有则很有价值 |
| 结果 | 通常是一段摘要 | 总结果 + 分步反馈 |
| 巩固目标 | 语义知识 | 语义知识 + Skill |

不是每个 Event 都值得形成 Experience。问候、例行状态更新或一句简单偏好，保留为 Event 或语义事实即可。

只有当**过程本身对未来有用**时，才创建 Experience。

---

## 5. 什么样的经历值得形成 Experience

满足以下任一条件时，Formation 应优先考虑 Experience：

1. 完成了有目标的多步任务；
2. 出现了有意义的失败或恢复过程；
3. 观察结果违背了预期；
4. 智能体因反馈改变了假设或策略；
5. 工具使用揭示了可复用的操作模式；
6. 人类反馈明确验证或否定了结果；
7. 这条轨迹可能帮助未来的相关任务。

对话轮次多，不等于值得创建 Experience。

---

## 6. ExperienceStep

Experience 由有序的 `ExperienceStep` 构成。推荐 `kind`：

```text
observation
decision
action
feedback
```

Step 可以保存：

```text
index
timestamp
kind
summary
state
tool
expected_observation
actual_observation
prediction_error
success
decision_rationale
raw_data_ref
```

### 6.1 记录决策依据，不记录隐式思维链

记忆系统不应依赖或保存模型内部思维链。它可以保存简洁、对外有用的判断依据：

> “错误提到缺失字段，因此先怀疑迁移没有执行。”

它不应尝试捕获逐 token 的内部推演。目标是保存**可观察的决策轨迹**，不是复制私有认知过程。

---

## 7. 预期与预测误差

一段 Experience 中信息密度最高的地方，往往不是行动本身，而是预期与现实的差值：

```text
预期
  ↓
行动
  ↓
观察
  ↓
预测误差
  ↓
信念 / 策略更新
```

例如：

```text
预期：重启后服务恢复健康
观察：健康检查仍然失败
后果：重启假设被削弱，转而检查配置
```

KIP Brain 不要求数学上严格校准预测误差，但可以保存：

- `expected_observation`；
- `actual_observation`；
- `prediction_error`；
- `surprise_score`。

Maintenance 因而可以优先处理那些明显推翻了旧模型的 Experience。

---

## 8. 显著性与学习价值

情景显著性与学习价值有交集，但不是一回事。

```text
LearningValue =
  f(
    goal_relevance,
    prediction_error,
    outcome_magnitude,
    novelty,
    human_feedback,
    reusability
  )
```

情绪和自传意义可能影响 `$self`，但程序性学习不能只看情绪强度。一次安静的工具失败，可能比一场印象深刻的对话更有教学价值。

---

## 9. 语义巩固与程序性巩固

Maintenance 应运行两条并行管线。

### 9.1 语义巩固——什么是真的？

```text
Event / Experience
      ↓
提取反复出现或稳定的规律
      ↓
Knowledge / Preference / Insight / 关系
```

例如：

```text
三次部署事故都显示凭证过期会返回 403
→ 关于该 API 的语义知识
```

### 9.2 程序性巩固——什么做法有效？

```text
Experience(s)
      ↓
比较状态 + 行动 + 结果
      ↓
推断触发条件和区分结果的步骤
      ↓
Skill
```

Skill 不是 Experience 的文字摘要，而是可复用的行动策略。

---

## 10. 对照式 Experience 巩固

最强的程序性学习往往来自比较：

```text
成功 Experience
       +
失败 Experience
       ↓
差异在哪里？
       ↓
能够区分结果的条件 / 行动 / 观察
       ↓
收窄或增强 Skill
```

Maintenance 应主动寻找：

- 相同或相似目标；
- 重叠的初始状态；
- 不同的行动；
- 不同的结果。

它需要追问：

1. 哪一步不同？
2. 成功案例是否满足了失败案例缺失的前置条件？
3. 失败动作是否产生了有用的诊断观察？
4. 表面差异是因果、相关，还是仍不确定？
5. 哪个反例应该和 Skill 一起保留？

这是**对照式巩固**，不是简单计数。

---

## 11. 失败是一等记忆

同一流程反复失败，不会证明它正确。

对语义断言：

```text
独立支持证据 → confidence 可能上升
```

对程序性学习：

```text
成功 / 失败结果 → utility 与适用边界发生变化
```

失败 Experience 可以产生：

- 一个或多个 `failure_signals`；
- 反例；
- 诊断步骤；
- 恢复分支；
- 否定性前置条件（“在……时不要使用”）。

Recall 往往应该同时返回一个相关成功经验和一个相关失败经验，以免智能体机械照搬旧做法。

---

## 12. Confidence、Memory Strength、Salience 与 Validity

这几个维度必须独立。

### 12.1 认知置信度

`confidence` 表示：

> 证据在多大程度上支持这条断言为真？

它随独立证据、明确确认、矛盾、来源质量和撤回而变化，不应因为长期未被召回而机械衰减。

### 12.2 记忆强度

`memory_strength` 表示：

> 这段记忆在自发或联想召回中应有多强的竞争力？

它可以因强化而升高、因长期不用而降低，也可以在再次获得证据或复用后恢复。

```text
confidence = 0.99
memory_strength = 0.35
```

意思是：“几乎可以确定为真，但当前并不活跃。”

### 12.3 显著性

`salience_score` 表示重要性或难忘程度，尤其适用于情景记忆和自传式记忆。

### 12.4 有效性

`valid_from`、`valid_until` 与 `superseded` 表示一条断言在当前是否仍然适用。

真值支持、可访问性、重要性和当前适用性是四个不同维度。

---

## 13. 强化与证据

同一来源反复提及，与多个独立来源支持，不是一回事。

```text
Alice 三次说“我喜欢深色模式”
```

这通常足以支持稳定偏好，也会提高记忆可访问性。但一般而言：

```text
同一来源重复 X
≠
三个独立来源支持 X
```

Brain 不应使用“每次重复都给 confidence +0.05”之类的通用规则。更稳妥的做法是：

```text
重复 / 成功召回使用 → memory_strength ↑
独立佐证 → confidence ↑
矛盾 → confidence ↓ 或 superseded
```

具体类型仍可有自己的证据规则，例如重复自述可作为稳定偏好的证据。

---

## 14. Skill 生命周期

推荐成熟度：

```text
candidate
  ↓ 成功验证
validated
  ↓ 证据冲突或退化
needs_review
  ↓ 新流程取代或不再适用
deprecated
```

Skill 写入必须满足 capsule schema。必填字段是：

```text
skill_class
description
goal
trigger_conditions
procedure
expected_outcome
```

以下字段可选，但实际使用中通常也会涉及：

```text
applicability_context
preconditions
decision_rules
success_criteria
failure_signals
recovery_strategy
execution_mode
implementation_ref
evidence_count
success_count
failure_count
last_validated_at
utility
maturity
```

### 14.1 Skill Utility

Skill 的 `utility` 不等于 `confidence`。简单实现可以估算：

```text
utility ≈ weighted_success / weighted_attempts
```

但还要考虑任务条件相似度、时效性、人工评价、成本和副作用。上下文明显不同时，不能使用一个全局成功率。

---

## 15. Formation API：从消息到轨迹

现有会话接口继续有效：

```json
{
  "messages": [
    {"role": "user", "content": "I prefer dark mode."}
  ],
  "context": {},
  "timestamp": "..."
}
```

为了形成 Experience，Formation 还应接受结构化、可观察的轨迹：

```json
{
  "goal": "Deploy version 2",
  "trace": [
    {"kind": "message", "role": "user", "content": "Deploy v2"},
    {"kind": "action", "summary": "Deploy service", "tool": "shell"},
    {
      "kind": "observation",
      "summary": "Startup failed: missing database column",
      "result_status": "failure"
    },
    {
      "kind": "decision",
      "decision_rationale": "Suspect migration was not applied"
    },
    {"kind": "action", "summary": "Run migration"},
    {
      "kind": "observation",
      "summary": "Failure persists; connection points to legacy database",
      "result_status": "failure"
    },
    {"kind": "action", "summary": "Correct database target and redeploy"},
    {"kind": "feedback", "summary": "Deployment healthy", "result_status": "success"}
  ],
  "outcome": {"status": "success"},
  "timestamp": "..."
}
```

编码前先归一化输入轨迹。`message` 用于补充对话或 Event 上下文；除非其可观察作用可归为 `observation` 或 `feedback`，否则不生成 Step。只有 `observation`、`decision`、`action` 和 `feedback` 可写入 `ExperienceStep.kind`。对观察、行动和反馈，把 `result_status: "success"` 映射为 `success: true`，把 `result_status: "failure"` 映射为 `success: false`；其他值不写。`result_status` 不是持久化 schema 字段。

因此，`messages[]` 是更广义观察接口的向后兼容子集。

---

## 16. Action Recall

传统 Recall 问：

> 我应该告诉用户什么？

Action Recall 问：

> 哪段过去应该改变我下一步的判断？

行动前简报最好包含：

```text
目标 / 当前状态
相关语义知识
适用 Skill
相似的成功 Experience
相关失败 / 反例 Experience
约束与承诺
不确定性 / 警告
```

最终决定仍由消费这些记忆的业务智能体负责。

---

## 17. Experience 与 Skill 的检索原则

### 17.1 不能只按语义相似度排序

Experience 的有效相似性包括：目标、初始状态、工具与环境、约束以及结果类型。

### 17.2 上下文适用性优先于流行度

一个成功率很高的 Skill，在当前状态下仍可能完全错误。排序可以近似考虑：

```text
触发条件与适用上下文匹配
× 验证质量
× 当前相关性
× 记忆可访问性
```

### 17.3 同时带回反例

Skill 有已知失败信号时，Recall 应把它们和 Skill 一起返回。

---

## 18. 记忆生命周期

原始 Experience 成本较高，默认不应永久保存：

```text
raw trace
  ↓ Formation
Experience + ExperienceStep
  ↓ Maintenance
Knowledge / Insight / Skill
  ↓ 巩固充分 + 溯源检查
归档 / 回收原始细节
```

如果一段 Experience 仍是高价值 Insight 或 Skill 的唯一证据，就不能删除。具有地标意义的自传式 Experience 可以晋升为长期记忆。

---

## 19. 学习判据

KIP 可以提供持久化和演化所需的原语，但“学习”这个词最好留给真实的行为变化：

```text
Learning =
过去经验在相关条件下
造成持久的未来行为改变或改进
```

最强的评估是因果对照：

```text
有相关记忆时的表现
>
移除相关记忆后的表现
```

---

## 20. 评估框架

### 语义保持

系统能否找回稳定事实？

### 时间演变

能否区分过去状态和当前状态？

### Experience 重建

能否重建相关的行动—观察轨迹？

### 程序迁移

能否应用 Skill 完成相关任务？

### 避免重错

能否避开已经观察过的失败？

### 上下文辨别

当前置条件不同时，能否拒绝套用旧流程？

### 负迁移

表面相似但不适用的 Experience 会不会损害表现？

### 记忆的因果影响

移除相关记忆后，任务成功率是否下降？

建议消融组：

```text
A. 仅 LLM
B. LLM + 文本 / 向量检索
C. LLM + KIP 语义记忆
D. C + Experience
E. D + Skill 巩固
```

---

## 21. 设计原则小结

Knowledge 是从证据与 Experience 中巩固出的稳定抽象；Skill 是从 Experience 中编译出的行动策略，并受明确的适用条件约束。过去状态只有在能影响后续计算时才构成 Memory；Experience 只有造成持久的行为变化时才构成 Learning。

因此，KIP Brain 是一套**经验学习系统**：保存有用轨迹，把它们巩固为 Knowledge 与 Skill，并在能改善行动时召回。
