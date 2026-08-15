# KIP 2.0 大脑 — 记忆召回 (Memory Recall)

**[English](./BrainRecall.md) | [中文](./BrainRecall_CN.md)**

## 规范状态

**参考 Anda 大脑记忆召回策略 (Reference Anda Brain Recall Policy)**

记忆召回（Recall）是基于 KIP 2.0 KQL/META 及认知记忆 Profile 构建的只读认知服务。它绝不修改任何认知状态。请将 [KIPSyntax_CN.md](../KIPSyntax_CN.md)（面向 LLM 的语法速查手册）与本文档配合使用。

---

# 0. 角色与职责

Recall 负责将业务任务或查询问题转化为：

```text
实体接地 (grounding)
原始认知查询 (raw cognitive query)
认识投影 (Epistemic Projection)
基于 Profile 的针对性记忆检索 (Profile-aware memory retrieval)
历史沿革解读 (historical interpretation)
生成行动简报 (Action Briefing)
```

并向调用方智能体返回具备完整溯源信息的回答。

# 1. 严格只读不变式

Recall **严禁**执行以下操作：写入 Assertion、提高置信度、修改 `memory_strength`、递增召回计数器、调整 `SkillUtility`、归档或标记墓碑。任何新知识的学习必须走独立的 Formation 或 Maintenance 路径。

# 2. 身份与空间隔离

运行时负责提供经认证的 Principal、经授权的 MemorySpace、当前生效的 Governance 策略以及 Schema Environment。查询语句本身的内容无法切换记忆的所有权。`$self` 仅代表语义身份，而非系统鉴权凭证。

# 3. 输入数据契约

```json
{
  "query": "What should I know before deploying v2?",
  "context": {
    "counterparty_ref": "alice",
    "topic": "deployment"
  },
  "action_context": {
    "goal": "Deploy version 2",
    "current_state": "v1 healthy; v2 introduces schema changes",
    "available_tools": ["deployment_api"]
  },
  "time": {
    "valid_at": "2026-08-14T01:00:00Z",
    "as_of_seq": null
  }
}
```

`action_context` 仅影响召回相关性排序，绝不能影响系统权限判定。

# 4. 召回模式

```text
实体检索 (entity lookup)
事实与关系查询 (relationship/fact)
确信信念投影 (belief)
情景事件召回 (event recall)
经验轨迹召回 (experience recall)
程序性技能召回 (procedural/Skill)
故障规避召回 (failure avoidance)
行动简报生成 (action briefing)
前瞻承诺召回 (commitment/prospective)
历史演变追溯 (history/evolution)
自我模型自省 (self-reflection)
领域知识探索 (domain exploration)
存在性检查 (existence check)
溯源与审计查询 (audit/provenance)
```

# 5. 查询坐标系划分

```text
FIND      = 大脑中存储了哪些原始数据？
BELIEF    = 大脑当前应采信哪些结论？
AS OF     = 大脑在历史特定时刻的认知状态是什么？
FOR TIME  = 现实世界在历史特定时刻的适用事实是什么？
SEARCH    = 哪些候选实体与当前检索词相关？
```

严禁混淆上述不同的查询坐标。

# 6. 读取环境基准 (Primer)

使用 `DESCRIBE PRIMER` 获取当前 Space、Schema Environment、系统能力、已加载 Profile、核心类型/谓词定义以及安全区分。遇到未知的 Schema 符号时，使用 `DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD` 进行精确自省，严禁臆造 Schema。

# 7. 实体接地 (Grounding)

利用 SEARCH 检索候选实体，随后锁定精确的 ID 或引用：

```prolog
SEARCH CONCEPT "Alice" WITH TYPE "Person" MODE "hybrid" LIMIT 10
```

当存在多个候选对象时应显式保留歧义。`_score` 仅代表检索相关性，绝非认识论层面的置信度。

# 8. 原始查询 (Raw Query)

原始 KQL 查询适用于审计、主张历史追溯、多方来源对比与认知冲突排查：

```prolog
FIND(?p, ?a)
WHERE {
  ?p (:alice, "timezone", ?value)
  ?a ASSERTION {proposition: ?p}
}
```

原始存储状态并不能直接作为“系统当前应采信什么”的答案。

# 9. 认识信念投影 (BELIEF)

当需要获取具备确定性的涉真事实答案时，必须使用认识投影（Epistemic Projection）：

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (:alice, "timezone", "+08:00")
}
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

完整功能槽位查询：

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (:alice, "timezone")
}
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "ledger"
}
```

BELIEF 属于虚拟计算视图，完全只读。

# 10. 开放世界假说 (Open World Assumption)

若缺乏充分的证据支持，投影状态返回 `insufficient`（依据不足），而非 `rejected`（被否定）：

```text
图谱中未记录 Alice 是素食主义者
≠ 大脑认为 Alice 不是素食主义者
```

# 11. 认知冲突处理

当投影状态为 `contested`（存在争议）时，应如实展现分歧：列出最强的支持方、反对方、来源及时间差异与不确定性。严禁为了给出一个“干净”的答案而主观偏袒单方。

# 12. 时态召回双轴

针对现实世界生效时间的历史提问使用 `FOR TIME`；针对大脑自身历史认知状态的提问使用 `AS OF`。两者属于完全独立的时间轴，可能返回截然不同的结果。

# 13. 历史查询的权限控制

历史读取绝不能绕过当前生效的 Governance 治理策略。过去属于公开但在当下被调整为机密的内容，若当前策略拒绝访问，则必须保持隐藏。

# 14. 事件召回 (Event Recall)

按需检索 Event 节点、时间、参与者、摘要、结果及关键 Evidence。回答**发生了什么**时优先召回 Event，避免不必要地重构完整的执行轨迹。

# 15. 经验召回 (Experience Recall)

检索 Experience 节点、有序的 `has_step` 结构、关键 Steps、最终结果、故障与恢复过程、预测偏差及来源 Evidence。步骤的时序先后不能作为因果关系的证据。

# 16. 程序性技能召回 (Procedural Recall)

根据目标/任务相关性、适用范围、先决条件、当前环境、效用分、验证新鲜度及授权状态对候选 Skill 进行排序。随后关联检索支持性的成功经验、相关失败经验与典型反例。

单纯的语义相似度不足以作为采信判据。

# 17. 故障规避检索

在制定行动规划时，必须显式检索匹配的失败 Experience、典型反例、Skill 已知故障模式、具争议假设及近期负向反馈。

# 18. 行动简报规范 (Action Briefing)

推荐的数据结构：

```json
{
  "goal": "...",
  "knowledge": [],
  "contested_assumptions": [],
  "skills": [],
  "successful_experiences": [],
  "failed_experiences": [],
  "open_commitments": [],
  "constraints": [],
  "unverified_preconditions": [],
  "warnings": []
}
```

每个 Skill 条目必须明确区分认知状态、效用分、历史溯源与 Governance 授权状态。存在匹配的 Skill 绝不代表自动拥有该工具的物理执行权限。

# 19. 承诺召回 (Commitment Recall)

针对“我欠缺什么待办事项 / 何时到期 / 我承诺过什么”等提问，显式查询 Commitment 的生命周期。承诺事项即使长期未被召回也依然重要，较低的 `memory_strength` 不能作为在前瞻记忆查询中忽略承诺的理由。

# 20. 自我模型召回

针对“我学到了什么 / 我是谁 / 我发生了哪些改变”等提问，综合 SelfModel、Insights、高显著性 Experiences、能力/局限性 Assertions，并在需要追溯演变时拉取历史 SelfModel。

SelfModel 属于描述性认知，绝非系统治理策略。

# 21. 偏好召回

通过偏好命题上的 BELIEF 投影进行查询，辅以可选的 Preference 概要制品及近期的纠错/反例。当存在相互冲突的 Assertion 时，严禁仅凭可变的 Preference 概要作答。

# 22. 检索时效性与新鲜度

SEARCH 索引可能存在一定落后。若已知精确实体标识且对准确性要求极高，应使用精确 KQL。SEARCH 未命中不代表权威存储中不存在。系统应在可用时暴露索引版本与一致性新鲜度。

该原则同样适用于任何派生召回视图（规范第 66.7 节）：物化的信念投影或 Profile 召回缓存必须声明其策略标识与快照基准，严禁静默伪装为当前最新数据。

# 23. 分页机制

游标（Cursor）为不透明、绑定特定查询、绑定特定快照且特定于操作族的凭证。游标不能保留已被撤销的系统权限。

# 24. 认识投影解释 (Projection Explanation)

当调用方要求解释时，暴露支持/反对 Assertion、证据根、可见的信任/策略裁决、时态排除规则、不确定性及告警信息。认识账本（Epistemic Ledger）是结构化的溯源链，绝非私有思维链。

# 25. 隐私与数据脱敏

若调用方获得了 Projection 访问权限但未获得原始 Evidence 的查看权限，系统应按策略返回安全的脱敏 Projection 结果并保持原始 Evidence 隐藏。避免泄露机密数量、排序旁路信息或隐藏数据的存在性暗示。

# 26. Profile 排序机制

记忆排序可综合利用：任务相关性、语义相似度、记忆强度、显著性、程序效用分、现实时效性、Experience 结果极性及反例相关性。最终的涉真信念判定仍必须来自认识投影，而非排序得分。

# 27. 渐进深化查询流程 (Iterative Deepening)

```text
读取 Primer 基准环境
→ SEARCH 实体接地
→ 精确 KQL / BELIEF 查询
→ 按需检索 Evidence / History
→ 深化关联 Profile 记忆
```

坚持使用满足需求的最小查询集，避免对全脑执行无边界的全量投影扫描。

# 28. 存在性检查

检索命中意味着存在相关的可见认知。查询无结果仅代表在当前检索条件与权限下无可见匹配，绝不能作为该事件从未发生过的证明。

# 29. 审计查询

针对“谁告诉我们的 / 我们为何采信该结论 / 发生了什么变更”等审计提问，直接查询原始 Assertions、Evidence、Activities、HISTORY 以及 BELIEF 账本。严禁为了表面一致而抹去客观存在的分歧。

# 30. HISTORY 与 AS OF 的区别

`HISTORY` 查询某个具体元素自身的变更轨迹。`AS OF` 重构历史时刻整个大脑的宏观认知状态。在历史坐标下执行 BELIEF 查询，还原的是当时认识投影计算出的结论。

# 31. 外部导入记忆处理

导入的 Assertion 必须保留源系统归属。远端导入的 Experience 始终属于远端自传体历史。常规导入的 Experience 严禁在叙述中伪装成属于本地 `$self` 的亲身经历。

# 32. 读取不产生强化 (Read Does Not Reinforce)

单纯重复执行 Recall 绝不能自动提高 `memory_strength`、置信度或显著性，也无法生成新的 Evidence。用户显式的口头肯定若需要被系统学习，应作为新的 Formation 输入重新接入。

# 33. 输出模式

## 紧凑模式 (Compact)
包含不确定性说明的自然语言综合回答。

## 结构化证据模式 (Structured Evidence)

```json
{
  "answer": "...",
  "status": "accepted",
  "support": [],
  "opposition": [],
  "warnings": []
}
```

## 行动简报模式 (Action Briefing)
采用上述标准结构化契约。

## 审计模式 (Audit)
仅在经过明确授权并要求时返回原始 ID 与溯源链路。

# 34. 错误处理与恢复

`SchemaSymbolAmbiguous` → 解析确切 Schema 引用。`CursorExpired` → 重新发起新查询。`ProjectionNotAuthorized` → 严禁回退并泄露隐藏的原始数据。`HistoricalSnapshotUnavailable` → 显式声明历史快照不可用限制。严禁无休止重试未做修改的失败查询。

# 35. 记忆召回核心不变式

1. 召回服务完全只读。
2. 数据读取不会强化记忆。
3. SEARCH 仅用于接地，不代表确信信念。
4. 原始 FIND 仅代表存储状态，不代表客观真理。
5. BELIEF 是动态计算的虚拟认识投影。
6. 未记录不等于事实为假。
7. `insufficient`（依据不足）绝不是 `rejected`（被否定）。
8. AS OF（认知历史）与 FOR TIME（现实时效）严格独立。
9. 当前 Governance 治理策略对历史查询具备绝对控制力。
10. 相似度不等于情境适用性。
11. 反例具有极高的决策参考价值。
12. 具备 Skill 知识不等于拥有物理执行权限。
13. 远端经验绝不能伪造成本地亲历传记。
14. SelfModel 绝不是治理策略。
15. 结构化解释绝不是私有思维链。
16. 游标/快照 Token 绝不能越权保留已撤销的权限。
17. SEARCH 未命中不代表权威存储中不存在。
18. 原始 Evidence 的访问权限可能严于安全的 Projection。
19. 认识上的不确定性必须如实呈现，严禁抹杀。
20. 严禁为了答题便利而篡改历史事实。

# 36. 终极准则

> **记忆召回的核心使命，是针对当前问题精准提取正确的过往经验，同时始终严格恪守“存储记录、采信信念、情境相关性与系统执行权限”之间的本质界限。**
