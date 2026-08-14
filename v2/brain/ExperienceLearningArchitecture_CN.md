# KIP 2.0 大脑经验学习架构 (Experience Learning Architecture)

**[English](./ExperienceLearningArchitecture.md) | [中文](./ExperienceLearningArchitecture_CN.md)**

## 规范状态

**参考认知架构 / 大脑层设计方案**

本文档定义了大脑（Brain）如何利用 KIP 2.0 及认知记忆 Profile 2.0 从实践经验中沉淀与学习。本文档不属于 KIP Core 的强制要求；规范性协议语义请参见 [KIP-2.0-SPECIFICATION_CN.md](../KIP-2.0-SPECIFICATION_CN.md)。

---

# 0. 核心主张

```text
Knowledge（知识）   = 高度压缩的可复用规律
Event（事件）       = 发生了什么事实
Experience（经验）  = 追求目标过程中实际走过的状态与行动轨迹
Skill（技能）       = 经验编译而成的可执行策略
Memory（记忆）      = 让过去的状态持续约束并参与未来计算的机制
Learning（学习）    = 由过往认知引发的、在适配情境下稳定持久的行为改变
```

> **知识是经验的压缩；技能是经验的编译；记忆则是让经验得以持续重塑未来的底层机制。**

# 1. 分层边界

```text
KIP 2.0                     认知底层原语、历史追溯、Governance 治理、事务机制
Cognitive Memory Profile    Event / Experience / Skill 及记忆状态数据结构
Experience Learning         经验学习闭环架构
Formation/Recall/Maintenance 大脑具体的认知策略实现
```

协议层负责提供标准信号，大脑层全权掌控认知策略。

# 2. 学习的本质判据

仅仅将数据写入存储、生成向量嵌入、执行检索、生成摘要、调整置信度或创建 Skill 对象，本身均不能证明智能体已经“学会”。

决定性的功能性检验判据：

```text
具备相关记忆时的未来行为表现
          >
消融（移除）相关记忆后的未来行为表现
```

若删除某条记忆无论如何都无法改变智能体未来的预测、决策与行动，那么该条目在本质上只是冷归档数据，而非具备认知功能的记忆。

# 3. 经验学习闭环

```text
外部环境 / 人类交互 / 工具调用
           ↓
        输入观测
           ↓
        生成证据 (Evidence)
           ├────────→ 命题 (Proposition) → 断言 (Assertion) → 认识投影 (Epistemic Projection)
           ↓
     事件 (Event) / 经验 (Experience)
           ├────────→ 语义巩固 (Semantic Consolidation) → 可复用断言 / 洞见 (Insight)
           ├────────→ 自省反思 (Reflection) → 自我模型 (SelfModel)
           └────────→ 程序性巩固 (Procedural Consolidation) → 技能 (Skill)
                                              ↓
                                         行动召回 (Action Recall)
                                              ↓
                                         未来决策 (Future Decision)
                                              ↓
                                         外部执行 (External Action)
                                              ↓
                                         结果证据 (Outcome Evidence)
                                              └────↺
```

外部世界的物理执行不在 KIP 数据库事务的回滚范围内。执行意图与执行结果作为独立的认知事务记录在外部效应的前后。

# 4. 轨迹视角的经验模型

```text
E = (g, b0, a0, o1, b1, a1, o2, ..., y, δ)
```

其中 `g` 代表目标，`b` 代表紧凑的状态/信念上下文，`a` 代表行动，`o` 代表观测，`y` 代表结果，`δ` 代表反馈/意外度/预测偏差。

仅记录有价值、可观测且合规的过程信息，无需存储私有隐藏的思维链。

# 5. 事件 (Event) 与经验 (Experience) 的区别

| 维度 | 事件 (Event) | 经验 (Experience) |
|---|---|---|
| **核心问题** | 发生了什么？ | 走过了怎样的执行路径？ |
| **颗粒度** | 精炼紧凑 | 多步骤完整轨迹 |
| **行动记录** | 可选 | 头等公民 |
| **观测记录** | 可选 | 头等公民 |
| **故障与恢复** | 概要总结 | 具备重要的拓扑结构价值 |
| **主要用途** | 情景召回 | 迁移泛化与学习 |
| **巩固方式** | 语义巩固 | 语义巩固 + 程序性巩固 |

记忆形成阶段应审慎且有选择地创建 Experience。

# 6. 经验形成门槛

优先在以下场景创建 Experience：多步目标追寻、重大故障与恢复、出现预测偏差、策略调整、收到人类纠错反馈、异常工具返回结果、高成本/高影响的执行结果、具有复用价值的步骤序列，或命中现有 Skill 的反例。

对于未带来任何新信号的日常重复操作，不应重复创建 Experience。底层事务的失败重试绝不属于新的 Experience。

# 7. 证据优先原则 (Evidence First)

观测到的输入必须先作为 Evidence 接入，随后再形成涉真信念：

```text
用户输入消息
→ Evidence(user_statement)
→ Proposition(Alice, prefers, DarkMode)
→ Assertion(asserted_by=Alice, mode=stated)
```

该机制严格解耦了鉴权身份、语义归属、命题含义以及后续系统是否采信。

# 8. 预测偏差 (Prediction Error)

```text
预期观测 (expected observation) ≠ 实际观测 (actual observation)
```

预测偏差是最强烈的学习信号。它能够揭示错误假设、遗漏的前置条件、隐藏状态、环境变化、Skill 适用条件错误或知识盲区。意外度（Surprise）绝不等同于客观真理置信度。

# 9. 信念修订 (Belief Revision)

```text
旧 Assertion
+ 新 Evidence
→ 新 Assertion
+ 可选的废弃替代 (supersession)
+ belief_revision 类型的 Activity
```

严禁直接篡改旧 Assertion 的置信度、修改 Proposition 元组或物理删除历史 Evidence。第三方主体之间的意见分歧属于正常的认知冲突，绝不能直接执行废弃替代。

# 10. 语义巩固 (Semantic Consolidation)

核心问题：**大脑当前应将哪些可复用的陈述性规律视为具备充分依据支持？**

```text
Experiences / Evidence
→ 候选 Proposition
→ 派生 Assertion
→ semantic_consolidation Activity
→ 认识投影 (Epistemic Projection)
```

派生出的认知绝不能将源自同一证据根的多份摘要误判为独立的多方佐证。

# 11. 程序性巩固 (Procedural Consolidation)

核心问题：**在相似的上下文中，何种行动策略能够稳定奏效？**

```text
成功经验 (successful Experiences)
+ 失败经验 (failed Experiences)
+ 典型反例 (counterexamples)
→ 对比分析 (contrast)
→ 适用条件 / 执行流程 / 故障模式
→ 候选 Skill
→ 检验评估 (validation)
```

对比分析是避免习得过度泛化无效策略的关键。

# 12. 对比学习 (Contrastive Learning)

深入对比：成功 vs 失败、相同目标下的不同初始状态、相同行动下的不同观测结果、相同条件在不同工具/环境下的表现，以及相同 Skill 产生的不同结果。寻找决定性的鉴别条件，而非盲目追随使用频次。

# 13. 失败经验是头等公民

失败的 Experience 能够沉淀负向先决条件、诊断分支、容灾恢复策略、错误假设、反例、高危操作及工具局限性。许多失败经验的学习价值远超常规的顺利执行。

# 14. 四类学习产物

## 语义学习 (Semantic learning)
通过新 Evidence、新 Assertion 及冲突解决，改变大脑未来的认识信念。

## 记忆状态学习 (Mnemonic learning)
通过 `memory_strength` 与 `salience` 调整未来召回的可提取性，客观真值保持不变。

## 程序性学习 (Procedural learning)
通过 Skill、SkillUtility、适用条件及反例，优化未来的行动策略。

## 自我模型学习 (Self-model learning)
通过更新大脑对自身能力、局限、偏好、身份连续性或长期策略的认知，改善未来决策。SelfModel 绝不能自行赋予系统执行权限。

# 15. 正交信号体系

| 信号 | 衡量维度 |
|---|---|
| **Assertion confidence** | 当前立场陈述的确信强度 |
| **source trust** | 该信息源在此情境下的可信度 |
| **memory_strength** | 认知层面的检索可提取度 |
| **salience** | 记忆自身的重要性与受关注度 |
| **utility** | 流程在实践中的程序实用性 |
| **validity / currentness** | 在时间维度上的现实适用性 |

严禁在缺乏新的认识论 Evidence 的情况下，仅凭“近期未被召回”就机械降低 Assertion 的置信度。

# 16. 强化与证据的界限

重复检索不会凭空产生证据、不能提高置信度，也无法证明命题为真。独立的多方重复观测方可增强认识支持度。Skill 的重复成功使用可提升其程序效用分。反复查看同一来源的内容不能构成独立多方佐证。

# 17. 技能模型 (Skill Model)

高价值的 Skill 包含适用场景、先决条件、具体流程、成功判据、故障模式、典型反例、支撑 Experience、验证历史、效用评估以及描述性生命周期状态。

# 18. 技能生命周期

参考认知生命周期：

```text
candidate（候选） → validated（已验证） → needs_review（需复审） → validated / deprecated / archived
```

以上属于描述性认知状态。治理层面的授权（Governance authority）严格独立：分为描述性（descriptive）、建议性（advisory）、行为引导（behavioral）以及可执行（executable）。

# 19. 技能检验 (Skill Validation)

每次调用 Skill 后，捕获上下文环境、先决条件是否满足、所选具体流程、执行结果、反馈及意外观测。

细分四种情况：符合条件下的成功、符合条件下的失败、不符合条件下的失败、结果未知。符合条件下的执行失败属于强烈的负向信号，应据此收窄 Skill 适用范围或将其标记为 `needs_review`。

# 20. 行动导向召回 (Action Recall)

常规召回询问**我知道什么？** 行动导向召回询问**在当前状态下，哪些过往认知有助于做出最佳的下一步行动决策？**

推荐的行动简报结构：

```text
当前目标 (Goal)
当前环境状态 (Current state)
已采信的知识 (Accepted knowledge)
具争议的假设 (Contested assumptions)
未验证的先决条件 (Unverified preconditions)
可适用的技能 (Applicable Skills)
技能效用 / 状态 / 授权级别 (Skill utility/status/authority)
支撑性的成功经验 (Supporting successful Experiences)
相关的失败经验 (Relevant failed Experiences)
典型反例 (Counterexamples)
未完结的承诺 (Open Commitments)
边界约束 (Constraints)
风险预警 (Warnings)
```

相似度仅为参考信号之一，适用性（applicability）永远置于首位。

# 21. 面向学习的检索策略

排序计算可综合考虑：语义相关性、目标/状态相似度、前置条件兼容性、工具/环境兼容性、结果极性、意外度、学习价值、记忆强度、显著性、时效性以及 Governance 可见性。协议不强制要求固化单一标量公式。

# 22. 反例优先检索

召回某项 Skill 时，必须主动检索匹配的失败案例、已知故障模式、具争议假设、负向反馈及最近的失效记录。当存在高价值反例时，单纯高相似度的成功案例不足以作为采信依据。

# 23. 自我模型学习机制

SelfModel 的更新节奏应显著慢于日常 Event 形成。推荐的数据源：重复行为模式、主体的明确纠错、高显著性 Experience、经检验的能力提升、稳定的沟通习惯、反复出现的局限性，以及长期使命/价值观信号。

# 24. 睡眠期维护 (Maintenance)

维护任务在后台执行：语义与程序性巩固、实体对齐对账、记忆状态代谢、存储留存审查、认知冲突发现、Skill 复审、SelfModel 刷新、Commitment 审查，以及治理规则下的隔离区检查。

# 25. 遗忘的多维机制

```text
认识层面的撤回 / 废弃替代 (retraction / supersession)
记忆状态的提取度弱化 (memory_strength decay)
逻辑归档 (archive)
治理层面的权限排除 (Governance exclusion)
墓碑标记 (tombstone)
底层物理清除 (purge)
```

上述各项属于不同维度的独立机制，绝非单一的“删除旧记忆”操作。

# 26. 经验压缩 (Experience Compression)

轨迹压缩可精简调用链体积，但必须完整保留核心目标、关键状态迁移、行动、观测、最终结果、故障与恢复、意外偏差、反例以及溯源血统链。生成摘要不能创造新的证据根。

# 27. 跨智能体协同学习

远端导入的 Experience 始终属于远端主体的自传体历史。本地大脑可在保留溯源的前提下，基于远端 Experience 编译提炼出新的本地 Skill。源系统的 `$self` 身份、源系统信任度或 Skill 执行权限绝不能自动转移。

# 28. 效果评估体系

全方位评估：语义保留度、时间演变准确性、经验重构保真度、程序性迁移能力、避错能力、情境甄别度、负迁移规避，以及记忆对因果行为的实际影响。

最具说服力的因果检验实验：**提供相关记忆**与**消融（移除）相关记忆**的对照测试。

# 29. 事务边界控制

在局部状态不一致会导致误导的场景中，必须使用原子事务：

```text
Evidence + Proposition + Assertion
Experience + Steps + Formation Activity
新 Assertion + 废弃替代 + revision Activity
Skill + compiled_from + 编译 Activity
```

外部世界的真实行动始终在 KIP 事务回滚范畴之外。

# 30. 幂等性保障

利用事务的 `idempotency_key`、持久化的 `client_key` 以及稳定的源事件标识。相同的重试请求绝不等于新的输入观测。

# 31. 溯源守恒

每次认知转换都应确保大脑能够准确追溯：派生认知的输入来源、输入是观测/陈述/推理还是导入、存在多少个独立的证据根，以及由哪个 Principal 主体执行了该转换。

# 32. 权限守恒

具备实用价值、已验证或派生得出的认知，绝不能自动提升自身的系统执行权限。从“导入 Experience → 本地候选 Skill → 本地验证通过”，依然不代表自动获取了外部工具的调用权限。

# 33. 无需隐藏思维链

充分利用可观测的行动、观测结果、反馈以及简明的决策总结。构建高实用价值的程序性记忆，不需要记录内部私有的逐 Token 推理思维链。

# 34. 参考大脑认知周期

```text
清醒期 (WAKE)
  记忆形成 → 沉淀 Evidence / Event / Experience / Assertions / Commitments
  记忆召回 → 实体接地 / BELIEF / Experience / Skill / 生成行动简报

睡眠期 (SLEEP)
  知识巩固 → 提炼 Insight / Assertion / Skill
  记忆代谢 → 调节 memory_strength / salience / 留存状态
  认知审查 → 审查冲突 / 实体标识 / Skills / SelfModel / Commitments

下一个清醒期 (NEXT WAKE)
  更新后的认知状态精准指导与改变未来行为
```

# 35. 架构设计核心不变式

1. 成功写入不等于完成学习。
2. Event 绝不是 Experience。
3. Experience 绝不是 Skill。
4. Skill 绝不直接等同于系统权限。
5. 失败经验是头等公民。
6. 预测偏差不等于置信度。
7. 记忆强度不等于客观真理。
8. 机械重复不构成独立证据。
9. 提炼摘要不产生新的证据根。
10. 时间先后顺序不构成因果关系。
11. 相似度不等于情境适用性。
12. 检索结果若不能改变未来计算，就不是功能性记忆。
13. 认知矛盾是宝贵数据，而非系统损坏。
14. 状态修订必须完整保留历史。
15. 外部世界行动不受 KIP 事务回滚管控。
16. 网络重试不等于新的经历。
17. 远端经验绝不能伪造成本地亲历传记。
18. 不需要强制记录私有思维链。
19. 学习效果必须在行为层面可验证。
20. 协议负责提供标准信号，大脑负责掌控认知策略。

# 36. 终极准则

> **具备学习能力的大脑，不在于它记住了多少海量数据，而在于过去的经历能否在恰当的情境下切实重塑未来的行为，同时绝不伪造这些经历最初的来龙去脉。**
