# KIP 2.0 — 面向智能体记忆的认知状态协议

**[English](./README.md) | [中文](./README_CN.md)**

## 规范状态

**规范性草案。** KIP [v1.0-RC11](../SPECIFICATION.md) 仍为当前线上正式发布的稳定版本契约，现有客户端目前无需进行任何改动。2.0 草案完整覆盖了其预期的规范能力：其 Core（核心模型）、后果通道（consequence channel）、Watch 触发与擦除规则均具备[形式化验证模型](./formal/README_CN.md)支撑，主动性层的其余部分由一致性测试向量全面覆盖。目前已有两个独立的引擎实现正在跟进该草案 —— [Rust](https://github.com/ldclabs/anda-db/tree/main/rs/anda_cognitive_nexus) 参考实现与 [Cloudflare Durable Object](https://github.com/ldclabs/anda-db/tree/main/ts/kip-do) 实现，两者通过共享的[一致性测试套件](./conformance/KIP-2.0-Conformance-Tests.md)保持严格对齐。`v2/` 目录下的所有内容目前均未正式发布。

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./diagrams/kip-2.0-information-architecture-dark.png">
    <img src="./diagrams/kip-2.0-information-architecture.png" alt="KIP 2.0 信息架构：Agent/Brain 通过网络契约使用 KQL、KML 和 META；读取时通过认知投影 (Epistemic Projection) 投影出认知状态 (Cognitive State)；写入时通过事务运行时 (Transaction Runtime) 进行提交；提交后发布变更流 (Change Stream)，以状态差分形式回传给 Agent；治理面 (Governance) 与模式包 (Schema) 构成受保护的控制面；认知状态可导出为认知胶囊 (Cognitive Capsule)。" width="100%">
  </picture>
</p>

<p align="center"><sub>提供支持平移、缩放、关系溯源及五重视角引导的<a href="./diagrams/kip-2.0-information-architecture.html">交互式信息架构图</a>，该图为自包含文件：可直接下载并在浏览器中打开。</sub></p>

## 核心洞见

如果记忆系统无法将*“说了什么”*与*“什么是真的”*明确区分开来，最终必然会以极度自信的姿态向其拥有者编造谎言。KIP 2.0 坚决拒绝折叠以下三个根本问题：

```text
含义 (Meaning)    系统究竟能够表达什么
信念 (Belief)     大脑当前接受什么为真
权威 (Authority)  谁有权进行读、写、投影或提升权限
```

因此，存储的**命题（Proposition）**是价值中立的。**断言（Assertion）**则承载了单一行动者对该命题的立场陈述，包含陈述模式（mode）、置信度（confidence）、时效范围（validity）与支撑证据（evidence）。信念并非存储在数据库中的静态字段，而是在读取时基于所有合法断言动态计算出的**认知投影（Epistemic Projection）**：

```text
命题存在  ≠  命题为真  ≠  大脑接受该命题
```

这就是为什么观点的反转与更正无需付出高昂代价。“其实我现在吃素了”是一条废弃替代旧断言的新断言；下一次执行认知投影时，系统直接报告新值。没有需要就地补丁篡改的可变信念映射表，被替代的旧偏好历史完整可审计，绝不会悄然蒸发。

证据、溯源与模式定义同样遵循这一理念：[证据（Evidence）](./KIP-2.0-SPECIFICATION_CN.md#15-证据-evidence)与[活动（Activity）](./KIP-2.0-SPECIFICATION_CN.md#16-活动-activity)是一等公民元素，而非随意的元数据黑盒；模式定义则存放于带版本控制、指纹摘要锁定的[模式包（Schema Packages）](./KIP-2.0-SPECIFICATION_CN.md#20-模式包-schema-packages)之中。

## 主动性层

仅在被提问时才作答的记忆，只能算半个记忆。另外半个记忆，是大脑在无人与之对话时所进行的离线运作 —— 而且它绝不能退化为简陋的定时任务（cron job）。KIP 2.0 为这另外半个记忆提供了四项机制，且没有任何一项机制会越俎代庖替大脑做策略决策：

| 机制 | 机制定义与职责 |
| --- | --- |
| [`Watch`](./profiles/CognitiveMemoryProfile-2.0_CN.md#511-watch关注警戒) | 持久化关注状态。声明在何种条件下的变更 —— **或在何种条件下的未变更（静默）** —— 值得引起注意。处于设防状态（armed）的 watch 会依据已提交的[变更信封（Change Envelopes）](./KIP-2.0-SPECIFICATION_CN.md#36-变更流-change-stream)进行求值；*静默（silence）* watch 则在其 `due_at` 到期且无匹配变更时触发。主动性由此建立在状态差分之上 —— 增量 watch 在提交变更时触发，静默 watch 在到期扫描时触发 —— 而非盲目的定时轮询。**触发的 Watch 不赋予任何特权**：它仅唤起注意，绝不代表执行许可。 |
| [`action_gate`](./profiles/CognitiveMemoryProfile-2.0_CN.md#9-活动类定义) | 一种记录网关裁决的 Activity 类 —— `act`（行动）、`ask`（询问）、`defer`（推迟）或 `silence`（克制沉默） —— 并记录权衡考量所依据的各项输入。事后最难证明其合理性的是克制与不作为，因此深思熟虑的沉默与其它操作结果一样，必须被明确记录在案。 |
| [`LIST DEPENDENTS`](./KIP-2.0-SPECIFICATION_CN.md#635-list-dependents) | 溯源拓扑的有界反向遍历。当修正某一源头时，从其编译派生出的认知 —— 洞察、偏好摘要、技能、自我模型 —— 可在单次操作中被完整发现，而不会悄然失效落后。[§57.5](./KIP-2.0-SPECIFICATION_CN.md#575-修订与派生认知) 明确了这一规则：根节点的修订**严禁**自动撤回其派生依赖项，而**必须**将它们保留为可复审状态。依赖项是否存续取决于复审裁决，而非协议层规则。 |
| [`PURGE PAYLOAD`](./KIP-2.0-SPECIFICATION_CN.md#606-载荷清除-payload-purge) | 销毁 Evidence 元素的观测字节数据，同时完整保留其记录本身：摘要散列、分类、观测时间、来源以及依赖于它的各项引用。实现数据最小化而不破坏溯源血统 —— 基于存留摘要，[独立证据统计与佐证计算](./KIP-2.0-SPECIFICATION_CN.md#23-认知独立性-epistemic-independence)仍可正常运作。此操作与彻底销毁记录本身的元素[清除（purge）](./KIP-2.0-SPECIFICATION_CN.md#603-清除-purge)严格区分。 |

配套的支撑状态定义在[认知记忆 Profile（Cognitive Memory Profile）](./profiles/CognitiveMemoryProfile-2.0_CN.md)中：[`WorkingState`](./profiles/CognitiveMemoryProfile-2.0_CN.md#512-workingstate工作状态) 是标有 `basis_seq` 的固化恢复摘要，使大脑能从编译后的状态外加增量差分中苏醒，而无需重读全部历史；[`DerivationState`](./profiles/CognitiveMemoryProfile-2.0_CN.md#6-标准切面-facets) 承载依赖复审写回的 `current | stale | under_review` 状态标志；`MnemonicState.utility` 则记录准入下注（预期该记忆有多大效用）—— 该值刻意与显著性 `salience`、记忆强度 `memory_strength` 以及认知置信度 `confidence` 保持严格分离。

## 后果通道

上述所有机制让系统能更敏锐地洞察世界。而后果通道（consequence channel），则是世界反过来审视与反馈系统的途径。

[结果证据（Outcome Evidence）](./KIP-2.0-SPECIFICATION_CN.md#157-结果证据-outcome-evidence)记录了某项决策、行动或试用流程发生之后的真实客观结果 —— 由外部测量与仪器（遥测系统、验证器、测试工具链、人工审查）写入，**绝对不得由被评估行动的执行者自身写入**。行动主体自身对行动过程的陈述属于 `agent_statement`，仅可作为上下文背景引用；这一隔离是一致性不变式，并通过可审计性严格保障 —— 引擎的底层起源 `_system.origin` 始终忠实记录写入者身份，且 Governance 能够精确限制谁有权写入 outcome —— 开放协议即便无法杜绝单体部署中的自评自赞，也必须让这种自评自赞完全公开透明。

每项结果均携带一个**任务族（task family）**：即该后果所归属的可比后果流。任务族用于确定评估基线；它绝不直接用于归因。一项结果仅能通过测量仪器的 `outcome_observation` Activity 指向应用了该技能的 [`action_gate`](./profiles/CognitiveMemoryProfile-2.0_CN.md#9-活动类定义) 活动 —— 其挂载的 [`DecisionRecord`](./profiles/CognitiveMemoryProfile-2.0_CN.md#66-decisionrecord) 及输入明确记录了当初做了什么决策、应用了什么认知 —— 因此同属一个任务族的两个技能完全由各自的决策结果独立打分，绝不会相互混淆。[技能（Skill）](./profiles/CognitiveMemoryProfile-2.0_CN.md#58-skill技能)在进入试用期之前，必须先声明其基线来源的任务族 —— 即其评分锚点；无法被证伪的模式不属于程序性记忆。在后果通道之上运转着严谨的[技能生命周期（Skill lifecycle）](./profiles/CognitiveMemoryProfile-2.0_CN.md#14-技能生命周期-skill-lifecycle)：

```text
proposed (提议) → trialed (试用) → adopted (采纳) → revoked (废弃)
```

状态流转仅作为关联结果之上的确定性裁决执行 —— 记录为 [`lifecycle_verdict`](./profiles/CognitiveMemoryProfile-2.0_CN.md#9-活动类定义) 活动与[单次受守卫的 UPDATE 语句](./KIP-2.0-SPECIFICATION_CN.md#f6-基于结果打分与生命周期裁决)，审计员可依据开启试用时记录在 [`TrialState`](./profiles/CognitiveMemoryProfile-2.0_CN.md#65-trialstate) 中的基线完整复算裁决结果 —— 绝不取决于作者断言、绝不凭空衰减、绝不依赖执行模型的主观判断。技能采纳是比较性的（相较于所记录的基线，*证明比之前表现更好*；比较方式的具体构建仍属 Brain 策略范畴），且属于临时性的（后果流会持续评估，表现劣化将导致降级）。废弃操作绝不应比采纳更困难，且技能的生命周期资格在跨系统导入时不予继承：导入的技能必须重置为 `proposed` 重新受评，因为采纳 —— 与信任和权威一样 —— 必须在其实际生效之处重新赢取。

## 协议提供客观信号；大脑拥有主观策略

KIP 不定义具体的准入阈值、打断策略、显著性算法、巩固调度周期或技能编译器。它定义的是这些决策应将它们的输入与凭证记录存放在何处。如果协议硬编码了某一种具体的效用函数，它就不再是通用协议 —— 任何实际部署都会被迫分叉协议。

策略层是一个完全独立、可插拔替换的组件：

- **[Brain 2.0](./brain/README_CN.md)** —— 参考架构设计：**Formation**（交互中评估哪些信息具备持久留存价值）、**Recall**（提取能够指导当前行动的过往经验与知识）、**Maintenance**（离线阶段的记忆代谢：知识巩固、技能编译、冲突复审与记忆强度调节）。
- **[`$self` / `$system`](./SelfInstructions_CN.md)** —— 适用于单智能体的轻量级双心智方案，作为叠加在上述 Brain 策略之上的轻量 Delta：`$self` 作为清醒心智负责交互与经历沉淀，`$system` 作为沉睡心智负责离线整合与代谢。
- **[经验学习架构](./brain/ExperienceLearningArchitecture_CN.md)** —— Brain 实现的闭环学习机制，以行为改善与决策质量作为衡量学习成效的核心指标，而非单纯追求存储规模。

这一分层解耦在两个维度上都至关重要：正因为策略独立于协议，采用不同准入与评估算法的两个 Brain 实现可以无缝共享同一个 Cognitive Nexus 认知中枢；同时正因为核心信号与状态规范在协议内严格定义，任何一方 Brain 做出的决策对另一方而言均保持完全的可审计性。

## 记忆应当具备可迁移性与数据主权

若记忆是智能体核心价值的载体，最封闭的做法便是将其锁定在私有系统内令人无法脱离。KIP 采取完全相反的开放立场：认知数据可通过签名校验的[认知胶囊（Cognitive Capsule）](./KIP-2.0-SPECIFICATION_CN.md#37-认知胶囊-cognitive-capsule)导出与迁移，而导入过程严格受目标系统的治理策略管辖 —— 胶囊签名仅证明其数据来源与传输完整性，绝不自动赋予真实性、信任等级或执行权限。导入的技能在目标系统显式授权前始终不可执行；源系统的 `$self` 身份也绝不会篡夺或覆盖目标系统的本地身份。

## 文档索引

| 文档 | 内容概述 |
| --- | --- |
| [📖 2.0 规范](./KIP-2.0-SPECIFICATION_CN.md) | 规范性草案（[English](./KIP-2.0-SPECIFICATION.md)） |
| [📦 2.0 胶囊规范](./KIP-2.0-Capsule-Specification_CN.md) | 规范 §37–§41 与 §95：可移植、可校验的记忆工件（[English](./KIP-2.0-Capsule-Specification.md)） |
| [🧭 可选 Profile 与迁移](./KIP-2.0-Optional-Profiles-and-Migration_CN.md) | 规范 §100、§101、§103 及附录 I：历史一致性、高保障一致性及 KIP 1.x 迁移（[English](./KIP-2.0-Optional-Profiles-and-Migration.md)） |
| [📜 不变量注册表](./KIP-2.0-Invariants_CN.md) | 38 条 Core 不变量与 35 条 Profile 不变量合一清单，标明确立章节与钉住向量（[English](./KIP-2.0-Invariants.md)） |
| [🏛 2.0 架构](./KIP-2.0-Architecture_CN.md) | 规范背后的设计理据（[English](./KIP-2.0-Architecture.md)） |
| [📐 2.0 语法速查](./KIPSyntax_CN.md) | 面向 LLM 的 KQL / KML / META 速查卡（[English](./KIPSyntax.md)） |
| [🧩 2.0 认知记忆 Profile](./profiles/CognitiveMemoryProfile-2.0_CN.md) | Experience、Skill、Commitment、Watch、WorkingState 等记忆类型（[English](./profiles/CognitiveMemoryProfile-2.0.md)） |
| [🧠 2.0 Brain](./brain/README_CN.md) | Formation / Recall / Maintenance 记忆认知中枢（[English](./brain/README.md)） |
| [🤖 `$self` / ⚙️ `$system`](./SelfInstructions_CN.md) | 单智能体提示词对，基于 Brain 2.0 的精简增量（[`$system`](./SystemInstructions_CN.md)） |
| [🗂 设计文档](./design/) | 十篇规范统合前的参考性设计草稿，自 2026-09-02 起冻结 |
| [🔤 语法与 Schema](./grammar/) | 规范性 EBNF，以及[传输层 Schema](./schemas/) |
| [🧪 一致性测试套件](./conformance/KIP-2.0-Conformance-Tests.md) | 覆盖 13 个一致性 Profile 的 331 条可移植测试向量 |
| [🔬 形式化验证](./formal/README_CN.md) | Alloy 与 TLA+ 模型及其验证结论 |
| [🔀 从 1.x 迁移](./migration/KIP-2.0-Migration-from-1.x_CN.md) | 升级变更点与遗留语义迁移约束 |

`v2/` 下的每份文档均保持中英双语同步维护：每个 `X.md` 均有对应的 `X_CN.md`。

## 根本原则

> **KIP 2.0 是面向持久认知的状态协议：新信息的输入可以持续改变智能体未来的决策与行动，而无需以篡改或否认过往历史为代价。**
