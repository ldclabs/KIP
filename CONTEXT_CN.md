# KIP 经验学习

KIP 定义智能体如何把具体情境中的交互转化为持久、可用于行动的认知结构，同时保持协议底层与任何单一记忆 Profile 解耦。

## 领域语言

**Event（事件）**：
一次有明确时间边界的发生，用来记录世界或交互历史中发生了什么。Event 可以是 Experience 的证据，但本身不编码目标导向的轨迹。
_避免混用_：Experience、trajectory

**Experience（经验）**：
某个主体为了达成目标，经历状态、决策、行动、观察、反馈和结果所形成的轨迹。Experience 由有序的 ExperienceStep 组成，并保留预期与现实偏离的位置。
_避免混用_：Event、转录、过程摘要

**ExperienceStep（经验步骤）**：
Experience 中的一条有序转换记录，类型为观察、决策、行动或反馈。`index` 只表示时间顺序；因果关系需要单独的 `caused_by` 断言。
_避免混用_：Event、日志行

**Memory（记忆）**：
让过去状态能够影响未来计算、检索、预测或行动的机制。如果一条存储信息无法影响今后的任何情境，它是档案，不是功能性记忆。
_避免混用_：存储、档案

**Knowledge（知识）**：
从证据或经验中形成、能够脱离单次情境而保留的稳定事实或规律。KIP 不规定通用的 `Knowledge` Concept Type；稳定知识由具体领域概念与 Proposition 承载。
_避免混用_：Experience、原始证据

**Insight（洞察）**：
从一次或多次 Event / Experience 中提取的简洁、反思性教训。Insight 是陈述性的，可以指导行动，但本身不是可执行策略。
_避免混用_：Skill、事实

**Skill（技能）**：
从经验和证据中编译得到的行动选择策略，包括适用条件，以及判断成功或失败的方式。Skill 可以只提供建议，也可以指向可执行实现。
_避免混用_：Insight、runbook、单纯指令文本

**Action Briefing（行动简报）**：
一种面向未来行动的召回结果，将相关目标、约束、知识、过往 Experience、适用 Skill、风险和承诺组合起来。
_避免混用_：搜索结果、记忆倾倒

**Confidence（置信度）**：
对一条断言的认知支持强度：已有证据在多大程度上足以支持相信它。
_避免混用_：记忆强度、检索分数

**Memory strength（记忆强度）**：
一条记忆当前的可访问性，由 `metadata.memory_strength` 表示。强化与衰减可以改变记忆强度，却不必改变断言是否为真。
_避免混用_：置信度、显著性

**Salience（显著性）**：
Event 或 Experience 的编码与整合优先级，受目标相关性、新颖性、预期偏差、结果影响、情绪和可复用性影响。
_避免混用_：置信度、记忆强度

**SkillRevision（技能修订版本）**：
稳定 Skill 的不可变行为表现：任务族、具体流程、适用条件、前置条件、成功判据与故障恢复，由行为摘要（behavior digest）严格绑定。决策、试用、评分成绩以及程序性授权均明确指向某一个具体的修订版本，绝不只指向一个可变 Skill ID。
_避免混用_：当前概要、显示修订版本

**Attempt（执行尝试）**：
在已记录条件下对某项决策的一次实际执行应用，在观测到结果之前即注册至试用中。对同一次尝试的多次观测绝不能算作多次试用。
_避免混用_：结果 (Outcome)、观测 (Observation)、重试 (Retry)

**TrialRecord / EvaluationRecord（试用记录 / 评估裁决记录）**：
不可变的比对基准与不可变的裁决结果，完整留存规则、参数和输入工件。TrialState 与 GradingState 仅为这些记录的当前缓存切面。
_避免混用_：将可变计数器作为历史证据

**Memory Interface（记忆接口）**：
业务智能体在智能体到大脑接缝（Agent-to-Brain seam）处的五种记忆意图（observe、recall、revise、feedback、forget）。Brain 适配器通过既有的 KIP 状态接口执行它们；不引入新的 Core 类型或命令语言。
_避免混用_：原始 KIP 命令、强制要求第二个 LLM

**Processing receipt（处理回执）**：
摄入操作的标识，其处理进度区分了持久记录、完成的处理处置（disposition）以及对召回的可用性。after 屏障要求所指定的输入均已得到核算；仅仅获取一个崭新的 Space 快照是不够的。
_避免混用_：事务回执 (Transaction Receipt)、信念证明、永久新鲜度
