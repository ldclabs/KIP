# KIP 2.0 — 共享领域语言

**[English](./CONTEXT.md) | [中文](./CONTEXT_CN.md)**

本术语表描述当前 KIP 2.0 草案。契约由[主规范](./SPECIFICATION_CN.md)、[认知一致性契约](./KIP-2.0-Cognitive-Consistency_CN.md)、[认知记忆 Profile](./profiles/CognitiveMemoryProfile-2.0_CN.md)与[记忆接口](./KIP-2.0-Memory-Interface_CN.md)定义。历史术语保存在 [v1/](./v1/README_CN.md) 中。

## 核心状态与信任

**Concept（概念）**：MemorySpace 中的语义实体，类型与字段由带版本的 Schema Package 定义。

**Proposition（命题）**：真值中立的语义陈述。存在一条命题不代表它为真，也不代表大脑接受它。

**Assertion（断言）**：某个行动者对命题的立场，带有模式、置信度、有效时间与支撑证据。相互竞争的断言可以共存，无需覆盖历史。

**Evidence / Activity（证据 / 活动）**：Evidence 记录观测，Activity 记录认知工件如何产生或变化。从同一来源反复派生不会增加独立佐证。Outcome Evidence 来自测量或评审；行动者自己的叙述仍是 `agent_statement`。

**Belief / Epistemic Projection（信念 / 认知投影）**：在查询指定的范围和时间，对合法断言、冲突、证据与依赖求值得到的接受视图。信念不是 Proposition 上可修改的真值标志；缓存投影必须有经过校验的计算依据。

**Governance（治理）**：控制访问与操作许可的受保护权威。证据、置信度、导入签名、记忆效用或已触发的 Watch 都不会授予权限。

## 经验与记忆

**Event（事件）**：有时间边界的发生，用来记录发生了什么。它可以为 Experience 提供证据，但自身不编码目标导向的轨迹。

**Experience / ExperienceStep（经验 / 经验步骤）**：主体的目标导向轨迹及其有序观测、决策、行动与反馈记录。步骤顺序属于结构；`caused_by` 因果主张通过有证据支持的语义 Proposition 与 Assertion 表达。先发生不等于构成原因。

**Memory（记忆）**：让过去状态参与今后的检索、预测、决策或行动。仅完成存储不能证明记忆有用。

**Knowledge / Insight（知识 / 洞察）**：Knowledge 指由证据支持的持久规律，不是通用 Core 类型。Insight 是从经验或证据派生的陈述式教训，不等于可执行 Skill 或已验证的学习结果。

**Action Briefing（行动简报）**：围绕未来行动组织的召回，包含相关目标、约束、证据、类似经验、技能、风险与承诺。检索到 Skill 本身不代表实际使用了它。

**Confidence（置信度）**：Assertion 携带的认知支持程度，应随证据和推理变化，与召回频率独立。

**MnemonicState（记忆状态）**：Profile 切面，区分 `memory_strength`（未来可访问性）、`salience`（重要或显著程度）和 `utility`（预期决策价值）。它们都不是真值概率或权限。KIP 2.0 使用此切面，替代 v1 的 `metadata.memory_strength` 字段。

## 程序与学习

**Skill / SkillRevision（技能 / 技能修订）**：Skill 是稳定的程序性身份；SkillRevision 通过行为摘要冻结具体行为、任务族、适用条件、流程、成功标准与恢复方式。决策、试用、评分及程序性授权引用精确的修订版本。

**Attempt（执行尝试）**：在已记录条件下的一次应用，在观测结果前完成试用分配。同一次尝试的多次观测不会产生更多独立尝试。

**DecisionRecord（决策记录）**：不可变记录，区分检索到的内容与实际影响决策的内容，包括精确的 Skill 修订和执行尝试关联。

**TrialRecord / EvaluationRecord（试用记录 / 评估记录）**：不可变比对依据与可重放裁决，保留精确规则、输入与工件。共享任务族用于筛选候选结果，不构成归因或基线成员关系；TrialState 和 GradingState 是这些记录的当前缓存。

**Skill 生命周期**：`proposed → trialed → adopted → revoked`，受经过验证的评估与授权策略约束。试用行为只能通过比较证据晋升；导入技能从未验证状态开始。描述性反馈本身不构成已验证的改进。

**依赖有效性**：派生认知保留溯源与计算依据。来源变化使受影响的派生物可供复审，复用必须校验依据；过期的存储摘要无法自行证明有效。

## 接口与持久工作

**Memory Interface（记忆接口）**：业务智能体的五种意图：observe、recall、revise、feedback、forget。Brain 适配器通过既有 KIP 状态操作解释执行。此可选接口不新增 Core 类型，也不要求另一个 LLM。

**Processing receipt（处理回执）**：跟踪摄入从持久记录，到处理处置，再到可供召回的进度。`after` 屏障要求核算指定输入；新鲜的 Space 快照不能独立证明处理完成。它与事务回执不同。

**Watch / WorkingState（关注状态 / 工作状态）**：Watch 是针对变更或静默截止时间求值的持久注意力状态，触发只产生关注，不产生行动许可。WorkingState 携带 `basis_seq` 汇总可恢复认知，使大脑能够从经校验的状态加增量恢复。

**Cognitive Capsule（认知胶囊）**：带有依赖声明和完整性信息的可移植状态工件。签名证明来源和完整性，不证明真值或目标端权限。导入是受目标端治理的事务。

**协议、可靠性与学习证据**：语言测试、契约模型、引擎一致性、故障与重放测试，以及行为评测回答不同问题。结构检查通过不证明真实 Brain 已学习，详见 [Brain 评测](./brain/BrainEvaluation_CN.md)。
