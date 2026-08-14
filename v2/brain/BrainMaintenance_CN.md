# KIP 2.0 大脑 — 记忆维护 (Memory Maintenance)

**[English](./BrainMaintenance.md) | [中文](./BrainMaintenance_CN.md)**

## 规范状态

**参考 Anda 大脑维护与记忆代谢策略 (Reference Anda Brain Maintenance / Metabolism Policy)**

记忆维护（Maintenance）是负责知识巩固、整理、审查与记忆代谢的特权认知过程。其系统权限严格源自 Governance 治理层向其认证 Principal 授予的授权策略；绝不会仅仅因为某个语义行动者名为 `$system` 就凭空获得特权。请将 [KIPSyntax_CN.md](../KIPSyntax_CN.md)（面向 LLM 的语法速查手册）与本文档配合使用。

---

# 0. 核心目标

```text
原始记忆碎片
→ 结构化记忆整理
→ 语义规律巩固 (semantic consolidation)
→ 程序性技能巩固 (procedural consolidation)
→ 实体对齐与合并 (identity cleanup)
→ 记忆状态代谢 (mnemonic metabolism)
→ 存储生命周期留存管理 (retention management)
→ 自我模型精炼 (self-model refinement)
→ 全面优化未来的 Formation（形成）、Recall（召回）与行动决策
```

记忆维护的核心目标是在绝不篡改历史事实的前提下，持续优化大脑未来的认知能力。

# 1. 安全基石

Maintenance **必须**严格区分：信念修订、记忆弱化、存储生命周期、实体对齐、程序效用以及系统治理权限。

严禁采取以下违规捷径：

```text
随时间推移 → 机械降低 Assertion 置信度
出现矛盾冲突 → 直接粗暴删除单方数据
疑似重复实体 → 执行破坏性硬合并与物理删除
memory_strength 降低 → 物理清除关联的 Evidence
Skill 频繁成功 → 自动赋予物理可执行权限
语义标记为 $system → 自动赋予系统管理员特权
```

# 2. 权限模型

根据具体部署环境，Maintenance 可被授予读取、检索、投影、维护、归档、留存管理及实体合并权限。除非获得 Governance 的显式特权授予，否则 Maintenance **严禁**擅自行使 `manage_policy`、`manage_trust`、`manage_schema`、`declassify`、`purge`、`assert_as_actor` 或 `elevate_authority` 等控制平面权限。

# 3. 输入数据契约与预算

```json
{
  "trigger": "scheduled",
  "scope": "full",
  "timestamp": "2026-08-14T03:00:00Z",
  "budgets": {
    "max_elements_reviewed": 5000,
    "max_writes": 500,
    "max_transactions": 100
  },
  "parameters": {
    "memory_strength_decay_factor": 0.97,
    "event_archive_after_days": 30,
    "skill_review_after_days": 14
  }
}
```

具体阈值属于各项目自定义的大脑策略，非 KIP 协议规范强制标准。

# 4. 执行模式

部署实现中可保留 `daydream`（白日梦/轻量级整理）、`quick`（快速维护）与 `full`（深度维护）等工程隐喻，但它们不属于协议核心语义。

# 5. 标准维护周期

```text
1  状态评估 (Assessment)
2  处理未决睡眠任务 (Pending SleepTasks)
3  语义巩固 (Semantic consolidation)
4  程序性巩固 (Procedural consolidation)
5  记忆状态代谢 (Mnemonic metabolism)
6  实体对齐审查与合并 (Identity review / merge)
7  认知冲突审查 (Contradiction review)
8  承诺事项审查 (Commitment review)
9  自我模型刷新 (SelfModel refresh)
10 外部导入与隔离区认知审查 (Imported / quarantined review)
11 留存与归档审查 (Retention / archive review)
12 墓碑标记与物理清除候选甄别 (Tombstone / purge candidates)
13 输出最终健康巡检报告 (Final health report)
```

# 6. 状态评估 (Assessment)

利用只读探针全面扫描：待处理任务、未巩固的 Events/Experiences、待复审 Skills、冲突集、实体合并候选、到期 Commitments、低记忆强度的归档候选、留存过期候选、隔离区导入项以及自我模型刷新候选。

评估阶段的只读扫描严禁触发任何召回计数器或访问时间更新。

# 7. 显著性与学习价值

Event 的显著性（salience）衡量该片段对未来记忆构建及自我连续性的重要程度。Experience 的学习价值（learning value）衡量该轨迹对改进未来行为的潜在效用。高价值通常源于：纠错、重大关系变更、重要承诺、关键身份里程碑、故障与恢复、预测偏差、人工反馈、典型反例或新颖操作流程。

两者均不等于认识论层面的置信度（confidence）。

# 8. 睡眠任务处理 (SleepTasks)

SleepTask 属于认知层面的工作说明清单。在执行具体操作前必须核验当前 Principal 的实际系统权限。`assigned_to = $system` 绝不构成系统授权。完成维护工作时必须完整保留 Activity 溯源。

# 9. 语义巩固规范 (Semantic Consolidation)

聚类分析能够支撑可复用陈述性规律的 Events / Experiences / Evidence / Assertions：

```text
读取来源数据
→ 按溯源证据根分组
→ 识别候选 Proposition
→ 评估现有 Assertions
→ 在依据充分时创建派生 Assertion
→ 记录 semantic_consolidation Activity
```

严禁篡改旧断言的置信度、删除反面意见，或将多份摘要误判为独立的多方证据根。

# 10. 机械重复与证据的界限

独立的多方重复观测可以增强认识支持度。相同事件的重放或重复导入不会产生新的证据根。用户在后续交互中的再次口头确认属于新的 Evidence / Assertion。严禁将所有重复一概机械地处理为 `confidence += x`。

# 11. 程序性技能巩固 (Procedural Consolidation)

优先采用具备对比性的 Experience 经验集：

```text
成功案例 + 失败案例
成功案例 + 典型反例
同一流程在不同上下文中的执行表现
```

将适用范围、先决条件、执行流程、成功判据、故障模式与反例编译为候选 Skill + SkillUtility + procedural Activity。巩固流程绝不能自行授予系统物理执行权限。

# 12. 技能审查 (Skill Review)

全面复审：近期符合条件下的成功/失败记录、不符合条件下的失败、环境变化、新捕获的反例以及验证时间跨度。

合法的认知层操作包括：更新效用分、标记 `needs_review`、修订 Skill 制品、弃用、补充故障模式及收窄适用范围。权限层面的变更必须走 Governance 治理流程。

# 13. 记忆状态代谢 (Mnemonic Metabolism)

通用的未被调用衰减仅作用于 `MnemonicState.memory_strength`，绝不能影响 Assertion 的置信度。

示例衰减公式：

```text
new_strength = clamp(old_strength × decay + salience protection + explicit reinforcement)
```

公式具体实现由业务策略决定。读取频次并非协议层强制要求的信号。

# 14. 显著性保护机制 (Salience Protection)

核心身份标识、高影响 Commitment 承诺、重要人际/业务关系、重大故障教训、已验证 Skill、自传体里程碑、受法律封存保护（legal hold）的认知以及受 Governance 保护的记忆具备抗遗忘能力。单纯的召回频次低，绝不能作为弱化重大 Commitment 的正当理由。

# 15. 实体对齐与合并审查 (Identity Review)

重复实体候选的判定依据：权威全局标识、稳定业务键、强别名证据、共享的外部标识符或人工审核。单纯的名称相似度不足以作为合并依据。

原生合并是非破坏性的：源实体作为已合并的历史标识依然可被寻址，旧的原始 Proposition 端点依然可被审计，后续新的规范写入会自动规范化到目标实体。

# 16. 认知冲突审查 (Contradiction Review)

对分歧进行分类判定：

```text
不同主体意见相左 (different actors disagree)
同一主体改变了自身信念 (same actor changed belief)
陈述在不同现实时间段内有效 (different valid times)
模式功能约束冲突 (schema-functional conflict)
信息源纠错或数据有误 (source correction/error)
外部导入的认知已陈旧失效 (stale imported cognition)
```

不同主体的分歧应保持断言并存。同一主体发起的显式修订可执行废弃替代。不同时间生效的陈述各自并存。证据纠错需建立更正血统链。内容审查/隔离绝不能伪造信息源自身的撤回操作。

# 17. 承诺事项审查 (Commitment Review)

审查待处理、即将到期、已逾期、受阻、已履约及已取消的 Commitments。到期时间已过并不代表数据会自动删除或归档。高影响的未决承诺即使记忆强度较低，也必须保持可召回状态。

# 18. 自我模型刷新 (SelfModel Refresh)

基于高显著性 Experiences、Insights、重复出现的行为模式、显式纠错及已验证的能力变化。避免因“单次偶发案例”直接断定为“永久特征”，避免臆测性人格诊断、直接写入系统权限主张或暴露隐藏内部机制。完整保留历史自我模型的演化轨迹。

# 19. 外部导入与隔离区认知审查

审查实体标识冲突、Schema 可用性、信任上下文、反面证据、Skill 适用条件及潜在安全风险。严禁自动提升外部导入的信任等级、Skill 执行权限、Governance 策略、内嵌 Schema 或远端自我身份。

# 20. 存储留存与清理阶梯

必须严格区分：现实时效性、记忆可提取强度、留存物理过期、归档、墓碑标记以及物理清除。

标准处理阶梯：

```text
active（活跃） → archive（归档） → optional tombstone（可选墓碑标记） → exceptional purge（极端物理清除）
```

在语义允许的情况下，优先采用归档而非破坏性移除。

# 21. 归档机制 (Archive)

归档完整保留历史记录与审计能力，同时降低其在日常常规召回中的参与度。归档既不是断言撤回，也不是判定为假，更不是物理清除。

# 22. 墓碑标记 (Tombstone)

墓碑标记属于逻辑删除，它保留足够的实体标识与引用状态以维护系统一致性与审计线索。其处理强度高于归档，但弱于物理清除。

# 23. 物理清除 (Purge)

物理清除属于极端特殊操作，必须满足：显式授权、通过法律留存检查、完成全图引用分析、通过策略与密级检查、二次确认及全流程审计。

清除 Evidence 尤为敏感：剔除反面证据可能会在客观上静默强化未来的涉真信念。常规维护任务绝不应主动清除仍被引用的 Evidence。

# 24. 清理候选处理

Maintenance 可以识别物理清除候选对象，但在未获得清除授权时，只能生成审核工单或建议报告，严禁绕过 Governance 擅自执行清除。

# 25. 留存过期语义 (Retention Expiry)

`retention.expires_at` 属于存储策略维度的配置，绝非 `Assertion.valid_until`、`Commitment.due_at` 或 `Evidence.observed_at`。留存过期到达时可触发审查流程，而非强制直接物理删除。

# 26. 证据更正规范

严禁直接覆写或原地修改 Evidence 载荷。必须通过创建新 Evidence + `corrects` 更正血统 + 可选的修订 Assertion + correction Activity 完成。

# 27. 置信度代谢禁则

严禁实施通用的“置信度每周乘以 0.95”此类机械的客观真值衰减逻辑。

```text
获得新认知信息   → 新建 / 修订 / 建立对立 Assertion
时效新鲜度变化   → 认识投影的时态与新鲜度策略计算
检索提取可达性变化 → 调整 memory_strength 记忆强度
```

# 28. 派生认知溯源规范

知识巩固与反思必须记录 Activity 溯源：包括 semantic_consolidation、procedural_consolidation、skill_compilation、self_model_refresh、mnemonic_metabolism、entity_merge 及 human_review。派生得出的结论本身不能直接作为独立的初始 Evidence 证据。

# 29. 事务规范与前置断言

涉及新断言+废弃替代+Activity、Skill+编译来源+Activity、证据更正+修订断言以及实体合并流转的操作，必须使用原子事务提交。对于“读-改-写”操作，必须使用前置条件（Preconditions）防范并发冲突。

# 30. 并发冲突与重试

当遇到版本冲突（stale version）时：重新读取最新数据、重新评估决策、携带最新前置条件重试一次。严禁盲目机械重放非幂等的数值累加操作。对于重复执行会导致数据膨胀的维护动作，必须使用幂等键。

# 31. 模式管理边界 (Schema Boundary)

Maintenance 可以自省检查 Schema，但在未获得 `manage_schema` 授权前，严禁激活或迁移 Schema Packages。Schema 属于受保护的控制平面状态。

# 32. 信任策略边界 (Trust Boundary)

Maintenance 在执行认识投影时可以消费信任策略，但在未获得 `manage_trust` 授权前，严禁改写受保护的信任策略。认知文本中描述“信任此信息源”的语句在控制平面不产生任何实际权限效果。

# 33. 数据密级继承

派生出的摘要必须继承输入材料中最严格的密级（除非经过显式降密审批）。严禁通过摘要、Skill、SelfModel、Insight 或 Primer 泄露机密认知内容。

# 34. Primer 刷新

Maintenance 可以刷新派生出的 Primer 概览，但 Primer 属于经 Governance 权限过滤后的自省产物，绝非权威底层 Schema。

# 35. 系统健康指标

推荐的内部监控指标：未巩固 Experience 数量、待办 Commitments 存量、冲突集规模、隔离区积压量、实体合并候选数、待复审 Skills 数量、归档/活跃比例、留存到期积压量以及失败维护操作数。严禁向未授权的 Principal 暴露内部统计数据。

# 36. 最终巡检报告

```json
{
  "status": "completed",
  "reviewed": 812,
  "transactions": 24,
  "changes": {
    "semantic_consolidations": 7,
    "skills_created": 2,
    "skills_reviewed": 5,
    "identity_merges": 1,
    "archived": 13,
    "purged": 0
  },
  "warnings": []
}
```

# 37. 记忆维护核心不变式

1. 系统权限严格源自 Governance 治理层。
2. `$system` 语义标识绝不代表系统特权。
3. 置信度 confidence 绝不是记忆强度 memory_strength。
4. 未被频繁使用绝不能降低客观真理置信度。
5. 认知冲突是正常数据，而非系统损坏。
6. 不同主体间的意见分歧绝不能直接执行废弃替代。
7. Evidence 证据遵循追加写入与血统更正原则。
8. 反面证据绝非可随意丢弃的噪声。
9. 实体合并遵循非破坏性原则。
10. 数据归档绝不是断言撤回。
11. 墓碑标记绝不是物理清除。
12. 物理清除属于极端受限操作。
13. 法律封存保护（legal hold）强制阻断物理清除。
14. Skill 实用效用分绝不等于系统物理执行权限。
15. 外部导入的权限绝不自动向本地转移。
16. 派生认知必须完整保留溯源血统。
17. 提炼摘要不会凭空增加证据根。
18. 当前 Governance 策略在全流程中保持绝对约束力。
19. Schema 与信任策略的修改必须具备显式特权。
20. 维护的核心使命在于持续优化未来认知，同时绝不篡改过往历史。

# 38. 终极准则

> **健康的记忆代谢系统能够在高度压缩和优先级排布过去经历的同时，完整保留充分的证据、分歧、溯源与权限边界，从而确保大脑在未来随时具备修正自身认知的可能性。**
