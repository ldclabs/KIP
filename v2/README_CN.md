# KIP 2.0 —— 面向智能体记忆的认知状态协议

**[English](./README.md) | [中文](./README_CN.md)**

## 状态

**规范性草案。** KIP [v1.0-RC11](../SPECIFICATION_CN.md) 仍为当前生效的正式规范，现有客户端目前无需进行调整。2.0 草案的核心功能集已完成收敛，并获得[形式化模型验证](./formal/README_CN.md)的支持；两个相互独立的引擎已经与之同步 —— [Rust](https://github.com/ldclabs/anda-db/tree/main/rs/anda_cognitive_nexus) 参考实现，以及运行在 [Cloudflare Durable Object](https://github.com/ldclabs/anda-db/tree/main/ts/kip-do) 上的实现，二者由同一套[一致性测试套件](./conformance/KIP-2.0-Conformance-Tests_CN.md)相互约束。`v2/` 目录下的所有内容暂未正式发布。

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./diagrams/kip-2.0-information-architecture-dark.png">
    <img src="./diagrams/kip-2.0-information-architecture.png" alt="KIP 2.0 信息架构：Agent/Brain 通过 KQL、KML、META 经由传输契约访问；读路径经认知投影抵达认知状态，写路径经事务运行时提交；提交发布变更流，以状态差分回到 Agent；治理与模式构成受保护控制面；状态可导出为认知胶囊。" width="100%">
  </picture>
</p>

<p align="center"><sub><a href="./diagrams/kip-2.0-information-architecture.html">交互版本</a>（支持平移、缩放、关系拓扑追踪，内置五条导览视图）为纯自包含文件：下载后直接使用浏览器打开即可。</sub></p>

## 核心设计理念

若记忆系统无法区分「何人表达过何种立场」与「客观事实究竟是什么」，就极易产生笃定却失真的幻觉。KIP 2.0 将以下三个核心维度彻底解耦：

```text
意义（Meaning）      系统能够表达什么（模式与概念表达力）
信念（Belief）       Brain 当前在何种依据下接受什么
权威（Authority）    调用主体被允许读取、写入、投影或提升何种权限
```

因此，存储层中的 **Proposition（命题）** 始终保持真值中立。**Assertion（断言）** 承载特定行动者对其持有的认知立场，并关联断言模式、置信度、有效时间与支撑证据。信念并非静态存储的属性字段，而是在读取时基于合格断言动态计算的**认知投影（Epistemic Projection）**：

```text
命题存在  ≠  命题为真  ≠  Brain 接受该命题
```

这也正是立场变更在 KIP 中无需付出破坏性代价的原因。例如「其实我现在吃素了」仅体现为一条废弃替代（Supersede）旧断言的新断言，下一次认知投影便会自动得出最新结论。系统无需对可变知识图谱进行复杂修补，而被取代的历史偏好依然完整可审计，绝非直接覆写或凭空消失。

证据、来源与模式同样作为核心要素参与建模：[Evidence](./KIP-2.0-SPECIFICATION_CN.md#15-证据-evidence) 与 [Activity](./KIP-2.0-SPECIFICATION_CN.md#16-活动-activity) 均升格为头等元素（First-class Elements）而非附带的元数据字段，模式结构则统一纳入带版本且经内容摘要锁定的[模式包（Schema Packages）](./KIP-2.0-SPECIFICATION_CN.md#20-模式包-schema-packages)。

## 主动性层

仅支持被动问答的记忆是不完整的；智能体记忆同样需要支撑无交互期间的主动认知行为，且这种主动性不应退化为简单的定时轮询任务（Cron Job）。KIP 2.0 在协议层提供了四种正交机制来支撑主动性，且完全将具体决策策略交由 Brain 自主掌控：

| 机制 | 概念与定位 |
| --- | --- |
| [`Watch`](./profiles/CognitiveMemoryProfile-2.0_CN.md#511-watch守望监听) | 持久化的注意力状态：预先声明在何种状态变更——**或预期变更超时未发生（静默超时）**——时值得触发关注。已布防的 Watch 与已提交的[变更外壳（Change Envelope）](./KIP-2.0-SPECIFICATION_CN.md#36-变更流-change-stream)进行增量差分匹配；`silence` 类 Watch 在到达 `due_at` 且期间无匹配变更时触发。主动性由此建立在精确的状态差分而非盲目轮询之上。**Watch 触发不授予任何执行权限**：它仅产生注意力分配，绝不直接触发对外行动。 |
| [`action_gate`](./profiles/CognitiveMemoryProfile-2.0_CN.md#9-活动-activities) | 记录行动门控显式决策的 Activity：包含 `act`、`ask`、`defer` 与 `silence` 四类裁决结果及其依据的输入上下文。系统的克制与不作为同样需要可审计与可解释——因此经评估后主动选择的静默（`silence`）与直接行动一样须完整留痕。 |
| [`LIST DEPENDENTS`](./KIP-2.0-SPECIFICATION_CN.md#635-list-dependents-列举依赖方) | 沿溯源拓扑执行有界反向遍历。当溯源根节点发生修订时，由其派生编译的下游认知（如洞见、偏好摘要、技能、自我模型等）可通过单次操作完整发现，避免残留隐性失效状态。[§57.5](./KIP-2.0-SPECIFICATION_CN.md#575-修订与派生认知-revision-and-derived-cognition) 明确确立了核心规则：溯源根节点的修订**严禁**自动撤回下游派生物，但**必须**确保它们可被发现与复审；派生物是否失效属于认知层面的复审决策，而非协议层的硬性规则。 |
| [`PURGE PAYLOAD`](./KIP-2.0-SPECIFICATION_CN.md#606-载荷清除-payload-purge) | 在销毁原始证据观测载荷字节的同时，完整保留证据记录本身（包括内容摘要、证据类别、观测时间、来源及引用拓扑）。这是无损于溯源体系的数据最小化机制——[佐证分组与独立性计数](./KIP-2.0-SPECIFICATION_CN.md#23-认识独立性-epistemic-independence)依然基于保留的摘要正常运作。它与彻底销毁记录本身的元素[物理清除](./KIP-2.0-SPECIFICATION_CN.md#603-物理清除-purge)有着严格的语义区分。 |

配套状态定义在[认知记忆 Profile](./profiles/CognitiveMemoryProfile-2.0_CN.md) 中：[`WorkingState`](./profiles/CognitiveMemoryProfile-2.0_CN.md#512-workingstate工作状态) 是标注构建基准 `basis_seq` 的聚合状态摘要，支持 Brain 基于「已编译工作状态 + 增量变更」快速恢复上下文，无需重新扫描全量历史；[`DerivationState`](./profiles/CognitiveMemoryProfile-2.0_CN.md#6-标准-facet) 承载 `current | stale | under_review` 待审状态标记，用于记录派生认知复审结果；`MnemonicState.utility` 则记录记忆准入时的预期效用评估，与 `salience`（显著性）、`memory_strength`（记忆强度）以及认知断言层的 `confidence`（置信度）保持严格正交。

## 协议定义信号，Brain 掌控策略

KIP 不限定具体的准入阈值、打扰拦截策略、显著性算法、巩固调度周期或技能编译器实现，而是专注于定义：各项决策的输入数据如何规范组织、决策产出的凭据如何标准化留痕。若协议硬编码了特定的效用函数或算法逻辑，将丧失通用性，并导致部署生态的分裂。

策略层是独立且可替换的组件体系：

- **[Brain 2.0](./brain/README_CN.md)** —— 参考架构实现：**Formation**（交互中评估哪些信息具备持久留存价值）、**Recall**（提取能够指导当前行动的过往经验与知识）、**Maintenance**（离线阶段的记忆代谢：知识巩固、技能编译、冲突复审与记忆强度调节）。
- **[`$self` / `$system`](./SelfInstructions_CN.md)** —— 适用于单智能体的轻量级双心智方案：`$self` 作为清醒心智负责交互与经历沉淀，`$system` 作为沉睡心智负责离线整合与代谢。
- **[经验学习架构](./brain/ExperienceLearningArchitecture_CN.md)** —— Brain 实现的闭环学习机制，以行为改善与决策质量作为衡量学习成效的核心指标，而非单纯追求存储规模。

这一分层解耦在两个维度上都至关重要：正因为策略独立于协议，采用不同准入与评估算法的 Brain 实现可以无缝共享同一个 Cognitive Nexus 认知中枢；同时正因为核心信号与状态规范在协议内严格定义，各方生成的认知状态与决策线索均具备跨系统的完全可审计性。

## 记忆的可迁移性与主权

若记忆是智能体核心价值的载体，最封闭的做法便是将其锁定在私有系统内。KIP 倡导开放可迁移的理念：认知数据可通过签名校验的[认知胶囊（Cognitive Capsule）](./KIP-2.0-SPECIFICATION_CN.md#37-认知胶囊-cognitive-capsule)导出与迁移，而导入过程严格受目标系统的治理策略管辖——胶囊签名仅证明其数据来源与传输完整性，绝不自动赋予真实性、信任等级或执行权限。导入的技能在目标系统显式授权前始终不可执行；源系统的 `$self` 身份也绝不会篡夺或覆盖目标系统的本地身份。

## 文档索引

| 文档 | 内容概述 |
| --- | --- |
| [📖 2.0 规范](./KIP-2.0-SPECIFICATION_CN.md) | 规范性草案（[English](./KIP-2.0-SPECIFICATION.md)） |
| [🏛 2.0 架构](./KIP-2.0-Architecture_CN.md) | 规范背后的设计理据（[English](./KIP-2.0-Architecture.md)） |
| [📐 2.0 语法速查](./KIPSyntax_CN.md) | 面向 LLM 的 KQL / KML / META 速查卡（[English](./KIPSyntax.md)） |
| [🧩 2.0 认知记忆 Profile](./profiles/CognitiveMemoryProfile-2.0_CN.md) | Experience、Skill、Commitment、Watch、WorkingState 等记忆类型（[English](./profiles/CognitiveMemoryProfile-2.0.md)） |
| [🧠 2.0 Brain](./brain/README_CN.md) | Formation / Recall / Maintenance 记忆认知中枢（[English](./brain/README.md)） |
| [🤖 `$self` / ⚙️ `$system`](./SelfInstructions_CN.md) | 单智能体精简提示词组合（[`$system`](./SystemInstructions_CN.md)） |
| [🗂 设计文档](./design/) | 十份分子系统的参考性设计文档 |
| [🔤 语法与 Schema](./grammar/) | 规范性 EBNF，以及[传输层 Schema](./schemas/) |
| [🧪 一致性测试套件](./conformance/KIP-2.0-Conformance-Tests_CN.md) | 覆盖 13 个一致性 Profile 的 298 条可移植测试向量 |
| [🔬 形式化验证](./formal/README_CN.md) | Alloy 与 TLA+ 模型及其验证结论 |
| [🔀 从 1.x 迁移](./migration/KIP-2.0-Migration-from-1.x_CN.md) | 升级变更点与遗留语义迁移约束 |

`v2/` 下的每份文档均保持中英双语同步维护：每个 `X.md` 均有对应的 `X_CN.md`。

## 根本原则

> **KIP 2.0 是面向持久认知的状态协议：新信息的输入可以持续优化智能体未来的决策与行动，而无需以篡改或扭曲过往历史为代价。**
