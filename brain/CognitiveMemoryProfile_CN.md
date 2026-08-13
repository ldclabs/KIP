# KIP 认知记忆 Profile——Experience 与程序性记忆

## 状态

**面向 KIP 记忆系统的 Profile 提案**

本文规定如何在 KIP 之上表示 **Experience** 与 **Skill**，包括推荐的 Concept Type、Proposition Type、属性、元数据语义和运行模式。

它是一套 Profile，不修改 KQL/KML Core。可执行的自举定义以 [`capsules/`](../capsules/) 下的胶囊为准。

---

## 1. Profile 范围

现有认知记忆集合：

```text
Person
Event
Preference
Insight
Commitment
SleepTask
```

新增：

```text
Experience
ExperienceStep
Skill
```

Profile 新增四个谓词：

```text
has_step
caused_by
derived_insight
compiled_to
```

继续复用既有谓词：

```text
involves
mentions
derived_from
consolidated_to
learned
belongs_to_domain
```

---

## 2. 概念关系

```text
Experience
  ├── involves ─────────> Person
  ├── has_step ─────────> ExperienceStep
  ├── consolidated_to ──> 语义知识
  ├── derived_insight ──> Insight
  └── compiled_to ──────> Skill

ExperienceStep
  └── caused_by ────────> ExperienceStep

Insight / Skill
  └── derived_from ─────> Experience
```

`ExperienceStep.index` 定义顺序。`caused_by` 是可选关系，方向为“结果 → 原因”，不能仅凭时间相邻推断。

`Memory`、`Knowledge` 和 `Action` 是功能角色，不是必须注册的通用 Concept Type。

---

## 3. `Experience` Concept Type

### 用途

表示一段有边界、有目标的轨迹，并且这段过程本身对未来学习有价值。

### 推荐属性

```json
{
  "experience_class": "problem_solving",
  "goal": "Deploy version 2",
  "initial_state": {
    "service_version": "v2",
    "assumed_database": "migrated-primary"
  },
  "status": "completed",
  "outcome": "Deployment succeeded after correcting the database target",
  "success": true,
  "prediction_error": "The service was connected to the old database",
  "surprise_score": 82,
  "learning_value": 88,
  "started_at": "2026-08-13T10:00:00Z",
  "ended_at": "2026-08-13T10:12:00Z",
  "context": {"project": "service-v2"},
  "raw_trace_ref": "trace:deploy-v2",
  "consolidation_status": "pending",
  "salience_score": 65
}
```

### 属性语义

| 属性 | 类型 | 含义 |
| --- | --- | --- |
| `experience_class` | String | `task_execution`、`problem_solving`、`decision_making`、`exploration`、`interaction` 或 `self_reflection` |
| `goal` | String | 主体试图达成的结果 |
| `initial_state` | Object | 相关初始状态、约束和有外部依据的信念 |
| `status` | String | `ongoing`、`completed` 或 `aborted` |
| `outcome` | String | 简洁的最终结果 |
| `success` | Boolean | 是否达成目标；进行中或未知时省略 |
| `prediction_error` | String | 最重要的预期—观察差异 |
| `surprise_score` | Number 0–100 | 预期违背程度 |
| `learning_value` | Number 0–100 | 估计的未来复用价值 |
| `started_at` / `ended_at` | ISO 8601 | 时间边界 |
| `context` | Object | 环境、项目、约束和检索上下文 |
| `raw_trace_ref` | String | 指向图外不可变原始轨迹的引用 |
| `consolidation_status` | String | `pending`、`partially_consolidated`、`completed` 或 `archived` |
| `salience_score` | Number 0–100 | 编码和巩固优先级，与置信度、记忆强度分离 |

### 元数据

推荐：

```json
{
  "source": "trace_id",
  "author": "$self",
  "confidence": 0.95,
  "memory_strength": 0.8,
  "created_at": "...",
  "observed_at": "...",
  "memory_tier": "short-term",
  "expires_at": "..."
}
```

`confidence` 表示记录是否忠实反映了观察到的轨迹，不表示所用流程是否正确。

---

## 4. `ExperienceStep` Concept Type

### 用途

表示 Experience 中一条有序的观察、决策、行动或反馈记录。

### 推荐属性

```json
{
  "index": 3,
  "kind": "observation",
  "summary": "Startup failed with a missing-column error",
  "timestamp": "2026-08-13T10:04:00Z",
  "state": {"health": "unhealthy"},
  "tool": "shell",
  "success": false,
  "expected_observation": "service becomes healthy",
  "actual_observation": "health check still fails",
  "prediction_error": "restart did not resolve the failure",
  "raw_data_ref": "log:deploy-v2:startup"
}
```

### `kind`

推荐值：

```text
observation
decision
action
feedback
```

如需其他值，必须显式扩展 Schema。

### 顺序与因果

- `index` 从 0 开始，在同一 Experience 内唯一。
- `index` 只表示顺序，不表示原因。
- 只有轨迹或后续分析支持因果判断时，才创建 `caused_by`。

### 决策隐私规则

`decision_rationale` 保存简洁、可复用的决策依据，不得依赖或尝试保存隐式思维链。

合格：

> “错误提到缺失字段，因此先怀疑 Schema 迁移没有执行。”

不合格：

> 逐字保存模型内部的私有推理过程。

---

## 5. `Skill` Concept Type

### 用途

表示从一段或多段 Experience 中编译出的、可复用的行动策略。

### 推荐属性

```json
{
  "skill_class": "diagnostic",
  "description": "Verify the active database target before treating a deployment failure as a migration failure",
  "goal": "Distinguish database-target failures from migration failures early",
  "trigger_conditions": [
    "new deployment fails startup or health checks",
    "database schema error is suspected"
  ],
  "preconditions": ["database target is inspectable"],
  "procedure": [
    "read the service's active database target",
    "compare it with the migrated target",
    "only then inspect or rerun migrations"
  ],
  "decision_rules": [
    "if the target differs, correct configuration before changing schema"
  ],
  "expected_outcome": "target mismatch is confirmed or ruled out before mutation",
  "success_criteria": ["active target identity is verified"],
  "failure_signals": ["target identity cannot be read"],
  "recovery_strategy": "request environment-owner verification",
  "execution_mode": "supervised",
  "implementation_ref": "skill:deployment-db-check",
  "maturity": "candidate",
  "utility": 0.82,
  "evidence_count": 4,
  "success_count": 3,
  "failure_count": 1,
  "last_validated_at": "2026-08-13T10:12:00Z",
  "applicability_context": {
    "environment": "service deployment",
    "risk": "database mutation"
  }
}
```

### Skill 分类

推荐值：

```text
procedure
diagnostic
decision_policy
recovery
tool_use
communication
```

### Skill 生命周期

```text
candidate → validated → needs_review → deprecated
```

- `candidate`：看起来可行，但验证不足。
- `validated`：在足够多的独立匹配情境中成功。
- `needs_review`：证据发生冲突、退化，或暴露出缺失边界。
- `deprecated`：为历史保留，但不再指导新行动。

### Utility 不等于 Confidence

- `confidence`：证据在多大程度上支持 Skill 的描述和适用范围。
- `utility`：Skill 在匹配条件下实际有多有用。
- `memory_strength`：它在召回时有多强的竞争力。
- `maturity`：它在程序性生命周期中所处的阶段。

这些值可以独立变化。

---

## 6. Proposition Type

### 6.1 `has_step`

```text
Experience ──has_step──> ExperienceStep
```

只表示归属；子 Step 的 `index` 定义顺序。

KIP Core 会校验关系端点，但不保证 Step 只有一个父 Experience，也不保证 `index` 在父节点内唯一。Formation 添加 `has_step` 前必须检查：该 Step 没有其他父 Experience，且目标 Experience 中没有占用相同 `index` 的 Step。Maintenance 发现冲突时应报告，不得擅自选择父节点。

### 6.2 `caused_by`

```text
ExperienceStep ──caused_by──> ExperienceStep
```

方向为“结果 → 原因”。该关系可选、非对称、非传递。

### 6.3 `derived_insight`

```text
Experience ──derived_insight──> Insight
```

反向溯源关系为：

```text
Insight ──derived_from──> Experience
```

### 6.4 `compiled_to`

```text
Experience ──compiled_to──> Skill
```

Skill 还应通过 `derived_from` 指向每一段支持它的 Experience。

### 6.5 复用的谓词

- `involves`：连接 Experience 与追求或参与该目标的 Person。
- `consolidated_to`：连接 Experience 与语义知识。
- `derived_from`：保留 Knowledge、Insight 或 Skill 到 Event / Experience 的反向来源。

---

## 7. 示例图

```text
Experience:DeployV2
  ├─ involves → $self
  ├─ has_step → Step:0 observation startup failure
  ├─ has_step → Step:1 action inspect database target
  ├─ has_step → Step:2 feedback target mismatch confirmed
  ├─ derived_insight → Insight:VerifyDatabaseTarget
  └─ compiled_to → Skill:DiagnoseDeploymentDBMismatch

Step:2 → caused_by → Step:1

Insight:VerifyDatabaseTarget
  └─ derived_from → Experience:DeployV2

Skill:DiagnoseDeploymentDBMismatch
  └─ derived_from → Experience:DeployV2
```

---

## 8. 推荐 KIP 写入模式

加载 Profile 胶囊后，可以这样写入 Experience：

```prolog
UPSERT {
  CONCEPT ?experience {
    {type: "Experience", name: :experience_name}
    SET ATTRIBUTES {
      experience_class: :experience_class,
      goal: :goal,
      initial_state: :initial_state,
      status: :status,
      outcome: :outcome,
      success: :success,
      prediction_error: :prediction_error,
      surprise_score: :surprise_score,
      learning_value: :learning_value,
      started_at: :started_at,
      ended_at: :ended_at,
      context: :context,
      raw_trace_ref: :raw_trace_ref,
      consolidation_status: "pending"
    }
    SET PROPOSITIONS {
      ("involves", {type: "Person", name: "$self"})
      ("belongs_to_domain", {type: "Domain", name: :domain})
    }
  }
  WITH METADATA {
    memory_tier: "short-term",
    expires_at: :experience_expires_at
  }
}
WITH METADATA {
  source: :source,
  author: "$self",
  confidence: 0.95,
  memory_strength: 0.8,
  created_at: :timestamp,
  observed_at: :timestamp
}
```

每个 Step 单独写成 Concept：

```prolog
UPSERT {
  CONCEPT ?step {
    {type: "ExperienceStep", name: :step_name}
    SET ATTRIBUTES {
      index: :index,
      kind: :kind,
      summary: :summary,
      timestamp: :step_timestamp,
      state: :state,
      tool: :tool,
      success: :success,
      expected_observation: :expected_observation,
      actual_observation: :actual_observation,
      prediction_error: :prediction_error,
      decision_rationale: :decision_rationale,
      raw_data_ref: :raw_data_ref
    }
    SET PROPOSITIONS {
      ("belongs_to_domain", {type: "Domain", name: :domain})
    }
  }
  WITH METADATA {
    source: :source,
    author: "$self",
    confidence: 0.95,
    memory_strength: 0.8,
    created_at: :timestamp,
    observed_at: :timestamp,
    memory_tier: "short-term",
    expires_at: :step_expires_at
  }
  CONCEPT ?experience {
    {type: "Experience", name: :experience_name}
    SET PROPOSITIONS {
      ("has_step", ?step) WITH METADATA {
        source: :source,
        author: "$self",
        confidence: 0.95,
        memory_strength: 0.8,
        created_at: :timestamp,
        observed_at: :timestamp,
        expires_at: :step_expires_at
      }
    }
  }
}
```

---

## 9. 程序性巩固模式

条件允许时，Maintenance 应比较多段 Experience。

### 候选生成

按以下条件聚类：

- 相似目标；
- 相关 Domain；
- 工具和环境；
- 初始状态特征。

### 对照

比较：

- 成功与失败；
- 步骤差异；
- 缺失或满足的前置条件；
- 预期违背；
- 人类反馈。

### 编译

创建或更新一个 Skill，内容包括：

- 触发条件和适用上下文；
- 前置条件和流程；
- 决策分支；
- 预期结果和成功标准；
- 失败信号和恢复办法；
- 证据计数、utility 与 maturity。

### 溯源

```text
Experience ──compiled_to──> Skill
Skill ──derived_from──────> Experience
```

只要支持或反对它的 Experience 仍是必要证据，就应继续保留。

---

## 10. Skill 验证

### 匹配条件下成功

```text
success_count += 1
evidence_count += 1
last_validated_at = now
memory_strength ↑
utility 可能 ↑
maturity 可能转为 validated
```

### 匹配条件下失败

```text
failure_count += 1
evidence_count += 1
新增或收窄 failure_signals
utility 可能 ↓
maturity 可能转为 needs_review
```

### 非匹配条件下失败

不要计为 Skill 在适用范围内失败，应改为收窄 `trigger_conditions`、`applicability_context` 或 `preconditions`。

---

## 11. Recall 模式

### 11.1 相似 Experience

```prolog
SEARCH CONCEPT :goal MODE "semantic" WITH TYPE "Experience" LIMIT 10
```

语义索引应覆盖 `goal`、`initial_state`、`outcome`、`context` 和所连 Step 的摘要。如果部署只索引名称，则按相关 Domain 做有界 `FIND`，再由调用方依据上述字段排序。

接地后，继续检查 `success`、初始状态、Domain、工具、预测误差和当前状态兼容性。

### 11.2 适用 Skill

```prolog
SEARCH CONCEPT :goal MODE "semantic" WITH TYPE "Skill" LIMIT 10
```

Skill 索引应覆盖 `goal`、`trigger_conditions`、`applicability_context`、`procedure` 和 `failure_signals`。如果这些字段未进入索引，则从相关 Domain 取得有限候选集，再由调用方执行下述检查。

不能只看 `_score`。还要检查触发条件、适用上下文、前置条件、成熟度、utility、失败信号和来源。

### 11.3 重建 Step

```prolog
FIND(?step) WHERE {
  ?experience {type: "Experience", name: :experience_name}
  (?experience, "has_step", ?step)
} ORDER BY ?step.attributes.index ASC
```

---

## 12. Action Briefing 约定

```text
相关知识：
- ...

适用 Skill：
- Skill X —— 为什么匹配、成熟度、utility、失败信号

过去的成功：
- Experience A —— 为什么匹配

过去的失败 / 反例：
- Experience B —— 它暴露了什么边界

警告：
- 前置条件尚未核验
- 证据存在冲突

由记忆支持的下一步检查：
- ...
```

Brain 提供记忆支持的上下文，最终行动权仍属于业务智能体。

---

## 13. Memory Strength 元数据

```text
memory_strength: Number [0,1]
```

含义：记忆当前的可访问性或激活强度。

```text
再次确认 / 成功复用 → 提高
长期不用 → 衰减
高显著性 → 衰减更慢
```

不能把它当成事实为真的概率。

### 旧图迁移

对于曾经把 `metadata.confidence` 当作记忆强度并随时间衰减的系统：

1. 用当前 confidence 或中性默认值初始化缺失的 `memory_strength`。
2. 停止通用的时间置信度衰减。
3. `confidence` 只保留认知证据语义。
4. 后续“用进废退”只作用于 `memory_strength`。

已经损失的认知置信度无法机械恢复；应保留来源，让后续证据重新校准。

---

## 14. TTL 与清理

- 原始 `Experience`：默认短期保存，地标或具有唯一价值时除外。
- `ExperienceStep`：跟随父 Experience 的生命周期。Formation 创建 Step 时把 `expires_at` 设为与父 Experience 相同，Maintenance 延期时同步更新两者。
- `Skill`：持久保存，默认不设 TTL。
- 当 Experience 仍是活跃高价值 Insight 或 Skill 的唯一证据时，必须保留。

删除 Experience 前：

1. 确认巩固已经完成；
2. 确认没有活跃节点只依赖它这一条证据；
3. 有疑问时先归档；
4. 在同一维护批次删除其 ExperienceStep 和 `has_step` 链接。KIP Core 不提供隐式级联删除；如果存储层无法保证该批次原子执行，则先归档父 Experience，并创建清理任务。

---

## 15. 向后兼容

Profile 是纯增量扩展。现有系统可以继续只使用 Event、Preference、Insight 和 Commitment。

推荐分阶段上线：

```text
阶段 1：注册 Profile Schema 与谓词
阶段 2：接受结构化轨迹输入
阶段 3：只为高价值轨迹形成 Experience
阶段 4：增加 Experience Recall
阶段 5：启用 Experience → Skill 程序性巩固
阶段 6：评估行为迁移与避免重错
```

KQL/KML Core 语法不变。

---

## 16. 不变量

1. `Event` 不是 `Experience` 的同义词。
2. 每个 `ExperienceStep` 只属于一段有边界的 Experience。
3. Step 顺序不蕴含因果。
4. 隐式思维链不是必需的记忆输入。
5. 失败 Experience 在揭示有用边界时必须保留。
6. 重复不自动等于独立证据。
7. `confidence`、`memory_strength`、`salience_score`、`learning_value` 和有效性彼此分离。
8. Skill 必须声明可观察的触发条件或适用上下文。
9. Skill 的成功与失败更新程序性证据和 utility，不更新通用真值置信度。
10. 程序性巩固保留来源和反例。
11. Recall 在应用旧经验前检查失败信号。
12. 程序性记忆最终以未来行为能否持续改变来衡量。
