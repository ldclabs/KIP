# KIP 2.0 架构设计 —— 面向智能体记忆大脑的认知状态协议 (A Cognitive State Protocol for Agent Memory Brains)

**[English](./KIP-2.0-Architecture.md) | [中文](./KIP-2.0-Architecture_CN.md)**

## 文档状态 (Status)

**参考性架构设计 / KIP 2.0 设计依据 (Informative Architecture / KIP 2.0 Design Rationale)**

本文档定义了 KIP 2.0 的架构基石与设计依据。本文档明确**不是**规范性协议标准。

规范性统合文档为 `KIP-2.0-SPECIFICATION.md`。若本架构设计文档与当前规范发生冲突，**以规范 (Specification) 为准**。

本架构文档阐述了语义模型、协议边界、不变式、信任模型、记忆模型、分层规则、Profile 边界以及 Brain 集成模型，正是这些促成了 KIP 2.0 规范及其机器可读制品的形成。

KIP 2.0 围绕一个核心目标进行设计：

> **使 AI 智能体能够构建真正的记忆大脑 (Memory Brain)，使过去的观察、知识、经验、证据和习得的程序能够持久化、演化、保持可追溯性，并实质性地改变未来的计算与行为。**

本文档建立在 KIP 1.x、KIP 认知记忆 Profile 以及经验学习架构的基础之上。它保留了 KIP 1.x 中最具生命力的设计思想，同时将随着系统演化而产生语义耦合的关注点进行了彻底解耦。

---

## 0. 核心主张 (Executive Thesis)

KIP 1.x 最初是作为大语言模型 (LLM) 与结构化认知中枢 (Cognitive Nexus) 之间的模型优先 (Model-First) 交互协议而设计的。其核心抽象是具备查询、变更、接地、来源元数据、时间演化、巩固和遗忘能力的自描述概念–命题 (Concept–Proposition) 图谱。

KIP 2.0 对这一思想进行了全面泛化。

KIP 2.0 的核心客体不再仅仅是一个**知识图谱 (Knowledge Graph)**，而是智能体的**外部认知状态 (External Cognitive State)**。

一个完整的认知状态必须能够表达至少四个根本不同的核心问题：

```text
语义平面 (Semantic Plane)
    关于世界可以陈述什么？

认识平面 (Epistemic Plane)
    谁相信或断言了它、为什么相信、基于什么证据、具有多大置信度？

记忆平面 (Mnemonic Plane)
    过去的信息如何保持可用以影响未来的计算？

治理平面 (Governance Plane)
    谁拥有、可以观察、可以变更、可以共享并可以基于此认知状态采取行动？
```

这四个平面相互正交但又紧密关联。

整体架构可总结为：

```text
                         KIP 2.0
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
     语义平面            认识平面            治理平面
         │                  │                  │
       概念                断言                空间
       命题                证据                策略
      模式                溯源               调用主体
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                        记忆平面
                            │
              Profile 定义的记忆结构
             事件 / 经验 / 技能 / ...
                            │
                            ▼
                        认知运行时
               查询 / 变更 / 搜索 / 事务
                 胶囊 / 变更流
                            │
                            ▼
                        Anda 记忆大脑
               形成 / 召回 / 维护
                            │
                            ▼
                     未来的决策与行动
```

关键的概念变革在于：

> **KIP 2.0 将一个命题所代表的含义，与其是否被任何人所相信彻底解耦。**

这使得矛盾的信念、多源证据、时间维度的真实性、具备来源感知的记忆、共享的组织大脑、安全的记忆交换以及经验驱动的学习得以原生支持，而无需将所有这些关注点粗暴地塞入命题的元数据中。

### 编译器视角 (The Compiler View)

从另一个视角审视该架构：智能体记忆的本质是编译器，而非简单的档案馆。若只是机械存储所有会话记录并依赖事后检索，充其量只是一台录音机；记忆系统的核心价值在于决定哪些信息值得准入、将经验提炼压缩为持久结构，并研判外部环境的变更何时值得触发行动。在此视角下，Brain 扮演编译器的角色，而 KIP 则是编译产物的类型化目标格式与运行时环境——提供受治理、可审计、可迁移的状态，而非封闭不透明的私有堆栈。

| 编译阶段 | KIP 机制 |
| --- | --- |
| 临时摄取 | 摄取上下文在事务内生成 Evidence；支持空写入（empty write）；`PURGE PAYLOAD` 可在事后清理原始载荷字节而不破坏证据事件 |
| 只增语义账本 | Evidence + 真值中立 Proposition + 有归属的 Assertion，以生命周期流转代替破坏性覆写 |
| 当前信念 | 认识投影——信念是由规则推导而非物理固化的，立场反转无需额外清理；物化视图对外披露其推导基准 |
| 工作状态 | 带 `basis_seq` 的 `WorkingState` 摘要；会话恢复流程 = Primer + WorkingState + 基准版本后的增量变更 |
| 承诺与等待 | 责任约束由 `Commitment` 承载，触发条件由 `Watch` 承载——支持 delta 变更或 silence 超时——基于变更流进行实时评估 |
| 失效传播 | 溯源拓扑 + `LIST DEPENDENTS` + `DerivationState`，溯源根节点修订后可精准触达其下游派生物，避免残留失效的游离状态 |
| 克制 | 行动门控记录 act / ask / defer / silence 决策，使主动静默同样具备清晰的可解释性与审计线索 |

编译后的状态始终具备可检视性与可迁移性（Capsule、Governance）：记忆的核心价值在于提炼与编译过程，而非对原始数据的死板囤积。在认知消化完成后对底层载荷进行激进的字节最小化，是本设计的核心特性而非功能损失——持久的事实结构是资产，未经提炼压缩的原始过程数据残余则是系统负债。

---

# 1. 目标 (Goals)

KIP 2.0 应当 (SHOULD) 使构建具备以下能力的记忆大脑成为可能：

1. 将含义**表示**为结构化的概念和命题。
2. **表示信念，而不假定信念即为客观真理。**
3. 保留针对同一命题的多个冲突断言。
4. 表示信念背后的证据和来源溯源。
5. 明确区分观察、陈述、推断、预测、假设和导入的主张。
6. 以独立的认识论语义同时表示实体值事实和字面量值事实。
7. 保留时间演化过程而不覆盖历史。
8. 明确区分真实性置信度、来源信任度、记忆可访问性、显著性和实用效用。
9. 保留面向目标的经验，并将经验编译为程序性记忆。
10. 支持私有、共享、团队、组织和公开的认知空间。
11. 在认知中枢层强制执行访问控制，而非仅仅依赖提示词约束。
12. 使导入的记忆默认可追溯、可审查且非权威。
13. 支持原子多步骤认知状态转换。
14. 支持可移植、规范化、可选签名的认知胶囊。
15. 允许不同的 KIP 实现协商能力和 Profile。
16. 保持协议的模型优先特性，对 LLM 生成保持高人机工效与效率。
17. 允许脱离 Anda 记忆大脑进行独立的一致性测试。
18. 保留足够的向后兼容性，使 KIP 1.x 应用程序能够渐进式迁移。

---

# 2. 非目标 (Non-Goals)

KIP 2.0 **不**试图：

- 定义完整的人类认知理论；
- 字面复制生物记忆机制；
- 暴露或持久化模型的隐藏思维链 (Chain-of-Thought)；
- 强制绑定某一种向量数据库、图数据库、嵌入模型或排序算法；
- 强制规定单一的认识论置信度计算公式；
- 强制规定单一的遗忘曲线；
- 强制规定单一的技能学习算法；
- 将 KIP 变成 RDF、SPARQL、SHACL 或通用的本体描述语言；
- 将认知中枢作为智能体的最终行动决策权威；
- 将诸如 DID 等身份系统定义为硬性依赖；
- 仅仅因为某些记录被持久化存储就将其全部视为记忆。

KIP 提供底层基座与机制。认知 Profile 和智能体定义高阶策略。

---

# 3. 基础定义 (Foundational Definitions)

## 3.1 认知状态 (Cognitive State)

**认知状态 (Cognitive State)** 是智能体可以查阅和演化的持久化外部状态，用以在原本无状态的模型调用之间保持连续性。

它包含的内容远多于知识。根据所采用的 Profile，它可以包含：

- 实体和概念；
- 命题；
- 断言与反向断言；
- 证据；
- 观察；
- 事件；
- 经验；
- 技能；
- 承诺；
- 自我模型制品；
- 来源溯源；
- 访问策略；
- 记忆生命周期状态。

## 3.2 知识 (Knowledge)

**知识是智能体当前有充分理由将其视为具有信息量或可付诸行动的可复用规律性认知。**

知识并不等同于图中存在的一个命题。它是从命题语义加上活跃断言、证据、信任、时间以及消费智能体的认识论策略中涌现出来的。

## 3.3 命题 (Proposition)

**命题 (Proposition) 是一个真值中立的语义陈述。**

概念上：

```text
(subject, predicate, object)
(主体, 谓词, 客体)
```

示例：

```text
(Alice, prefers, DarkMode)
```

该命题的存在仅意味着：

> 这是一个认知中枢可以引用的陈述。

它**并不**意味着：

> 认知中枢断言 Alice 偏好深色模式。

## 3.4 断言 (Assertion)

**断言 (Assertion) 是行动主体或处理过程在特定上下文中对某个命题所作出的认识承诺 (Epistemic Commitment)。**

断言可以声明该命题是：

- 被支持的 (supported)；
- 被拒绝的 (rejected)；
- 不确定的 (uncertain)；
- 观察到的 (observed)；
- 陈述的 (stated)；
- 推断的 (inferred)；
- 预测的 (predicted)；
- 假设的 (hypothetical)。

断言是认识论置信度、有效时间区间、证据以及断言生命周期归属的载体。

## 3.5 证据 (Evidence)

**证据 (Evidence) 是用于支持或质疑断言的可识别观察、制品、结果、证词、测量或衍生项。**

证据并不会仅仅因为其存在就自动值得信任。

## 3.6 经验 (Experience)

**经验 (Experience) 是行动主体在追求目标过程中所经历的情境化“状态–动作–观察”轨迹。**

它属于认知记忆 Profile (Cognitive Memory Profile)，而非 KIP 核心层 (KIP Core)。

## 3.7 技能 (Skill)

**技能 (Skill) 是将经验编译为可复用的行动策略、规程或可执行能力。**

它同样属于认知记忆 Profile。

编译提议，世界晋升。技能的生命周期地位——`proposed → trialed → adopted → revoked`——由其声明的任务族之下已评定的结果证据、经由确定性且被记录的裁决挣得，绝不由编译它的那个过程自我断言。

## 3.8 记忆 (Memory)

**记忆 (Memory) 是过去的认知状态得以约束或调节未来计算与行为的机制。**

因此：

```text
持久化 ≠ 记忆
检索 ≠ 记忆
记忆必须具备潜在的未来影响力。
```

## 3.9 学习 (Learning)

最具操作性的定义是：

```text
学习 (Learning) =
    由先前的经验或证据引起的、
    在未来行为中表现出的持久且符合情境的变化。
```

KIP 可以提供学习原语，但单次成功的写入本身绝不是学习发生的证明。

---

# 4. 设计公理 (Design Axioms)

KIP 2.0 应当 (SHOULD) 遵循以下公理。

## 公理 1 — 命题存在不代表其为真 (Axiom 1 — Proposition existence does not imply truth)

无论一个命题是否被相信或被断言，它都可以被独立引用。

## 公理 2 — 断言承载认识承诺 (Axiom 2 — Assertions carry epistemic commitment)

置信度、立场、有效性、撤回和废弃替代属于断言，而不属于抽象命题。

## 公理 3 — 矛盾是可表示的状态，而非数据损坏 (Axiom 3 — Contradiction is representable state, not corruption)

两个行动主体可以同时持有不兼容的断言。图谱必须保留这种状态，而不强行进行过早的折叠消除。

## 公理 4 — 来源溯源不等于权威 (Axiom 4 — Provenance is not authority)

知道信息来自何处是必要的，但不足以决定它是否被信任或是否被允许影响行动。

## 公理 5 — 引擎源头与声明溯源是不同的概念 (Axiom 5 — Engine origin and claimed provenance are different)

智能体可以声称“Alice 说了 X”；引擎必须独立保留是谁实际提交了该声明、通过什么渠道、在哪个事务中以及来自哪个空间。

## 公理 6 — 属性不自动等同于认识论事实 (Axiom 6 — Attributes are not automatically epistemic facts)

如果一个值需要独立的来源溯源、矛盾处理、时间有效性、置信度或共享策略，它应当 (SHOULD) 被建模为“命题 + 断言”，而非深埋在 Concept 属性中。

## 公理 7 — 领域 (Domain) 不等于空间 (Space) (Axiom 7 — Domain is not Space)

`Domain` 回答的是**这是关于什么主题的？**

`MemorySpace` 回答的是**这是谁的认知状态，处于什么治理边界之下？**

## 公理 8 — 标识 (Identity) 不等于显示名称 (Axiom 8 — Identity is not a display name)

名称是接地 (Grounding) 辅助工具。持久标识需要不可变的本地 ID，并可选择性地包含跨系统的规范标识符。

## 公理 9 — 真实性置信度不等于记忆可访问性 (Axiom 9 — Truth confidence is not memory accessibility)

`confidence` (置信度)、`trust` (信任度)、`memory_strength` (记忆强度)、`salience` (显著性) 和 `utility` (实用度) 是相互独立的维度。

## 公理 10 — 时间具有多个时钟维度 (Axiom 10 — Time has multiple clocks)

现实世界有效时间、观察时间、断言时间和引擎事务时间绝不能混为一谈。

## 公理 11 — 语义相似性不等于适用性 (Axiom 11 — Semantic similarity is not applicability)

检索到的记忆或技能可能与当前状态高度相似，但完全不适用。

## 公理 12 — 外部记忆不能自行提升权威等级 (Axiom 12 — External memory cannot self-escalate authority)

导入的内容不能仅仅因为包含“要求提升权限”的指令，就自行授予控制工具、修改策略或变为可执行状态的权限。

## 公理 13 — 原始历史与巩固后的认知均具价值 (Axiom 13 — Raw history and consolidated cognition are both valuable)

记忆巩固可以压缩经验，但必须保留足够的溯源信息以供审计或修正结果。

## 公理 14 — 协议提供信号，记忆大脑掌管认知策略 (Axiom 14 — The protocol provides signals; the Brain owns cognitive policy)

KIP 应当暴露原语和证据。Anda 记忆大脑或其他认知运行时决定巩固算法、检索策略、遗忘策略和自我模型演化。

## 公理 15 — 模型优先 (Model-First) 的易用性仍是首要约束 (Axiom 15 — Model-first ergonomics remain a primary constraint)

一个形式上优雅但 LLM 无法可靠生成的模型，不是一个成功的 KIP 设计。

---

# 5. 架构分层 (Architectural Layers)

KIP 2.0 划分为四个语义平面加上一个运行时底座。

```text
┌───────────────────────────────────────────────┐
│ 治理平面 (Governance Plane)                    │
│ 空间 / 调用主体 / 策略 / 数据分级                │
├───────────────────────────────────────────────┤
│ 记忆平面 (Mnemonic Plane)                      │
│ 记忆生命周期 / 激活度 / Profile 数据            │
├───────────────────────────────────────────────┤
│ 认识平面 (Epistemic Plane)                     │
│ 断言 / 证据 / 来源溯源 / 信任度                  │
├───────────────────────────────────────────────┤
│ 语义平面 (Semantic Plane)                      │
│ 概念 / 字面量 / 命题 / 模式                     │
├───────────────────────────────────────────────┤
│ 认知运行时 (Cognitive Runtime)                  │
│ 查询 / 变更 / 搜索 / 事务                      │
│ 胶囊 / 导入 / 导出 / 变更流                     │
└───────────────────────────────────────────────┘
```

这些平面是概念上的解耦，并不一定意味着独立的物理存储系统。

---

# 6. 语义平面 (Semantic Plane)

语义平面描述了关于世界可以陈述什么。

## 6.1 概念 (Concept)

一个 `Concept` 表示一个实体、类别、抽象概念、制品或其他可引用的对象。

推荐的逻辑标识结构：

```text
id              不可变的 Nexus 本地 ID
schema_ref      规范类型 / 模式引用
name            人类 / LLM 友好的主标签
canonical_id    可选的跨系统稳定标识符
aliases         可选的接地别名列表
attributes      本地结构化载荷
```

### 标识规则 (Identity rule)

KIP 1.x 通常使用 `type + name` 作为逻辑标识。KIP 2.0 应当 (SHOULD) 在有用的地方保留其作为人机工效接地键的作用，但严禁 (SHOULD NOT) 将其视为最终的全局通用标识模型。

规范标识模型为：

```text
Nexus 本地不可变 id
    + 可选的 canonical_id
    + 一个或多个用于人类阅读的接地标签
```

## 6.2 字面量 (Literal)

KIP 2.0 应当 (SHOULD) 允许命题客体为字面量值。

示例：

```text
(Alice, timezone, "+08:00")
(ProjectX, status, "active")
(Aspirin, molecular_formula, "C9H8O4")
```

字面量使用 KIP 兼容 JSON 的值模型：

```text
string
number
boolean
null
```

复杂对象和数组可以 (MAY) 保留为属性，除非某个 Profile 定义了规范的值对象。

## 6.3 命题 (Proposition)

命题在结构上由以下三元组标识：

```text
(subject, predicate, object)
(主体, 谓词, 客体)
```

其中：

```text
subject   = 可引用的资源
predicate = 已注册的命题类型
object    = 可引用的资源 或 字面量
```

命题在其语义范围内应当 (SHOULD) 保持结构唯一性。这将旧版 KIP 1.x 的 `(S,P,O)` 唯一性约束从限制转化为有价值的规范化特性：

> 一个语义陈述对应唯一的规范命题，围绕它可以存在任意数量的断言。

示例：

```text
P1 = (Bob, is_vegetarian, true)
```

系统可以同时持有：

```text
断言 A: Alice 支持 P1
断言 B: Carol 拒绝 P1
断言 C: 医生支持 P1 (仅限 2024 年)
```

而无需复制 P1 命题本身。

## 6.4 高阶语义 (Higher-Order Semantics)

KIP 1.x 已经允许命题参与高阶关系。KIP 2.0 保留了将命题作为一等语义项进行引用的能力。

然而，认识论陈述通常应当 (SHOULD) 引用 `Assertion`，而非将信念元数据直接附加到 Proposition 上。

示例：

```text
AssertionA ── supported_by ──> Evidence7
AssertionB ── contradicts ───> AssertionA
```

而非重载命题元数据。

## 6.5 属性规则 (Attribute Rule)

属性仍然是有用的，不应当 (SHOULD NOT) 被废除。

在以下场景使用属性：

- 本地显示标签；
- 紧凑的实现提示；
- 聚合计数器；
- 不需要独立认识论处理的结构化载荷；
- Profile 内部的运行状态。

当一个字段需要以下特性时，使用“命题 + 断言 (Proposition + Assertion)”：

- 独立的来源；
- 独立的置信度；
- 独立的有效时间；
- 矛盾表达；
- 撤回；
- 共享策略；
- 外部证据；
- 独立的历史演化。

此规则防止整个 Concept 节点针对互不相关的各个事实属性继承单一的来源/置信度值。

---

# 7. 认识平面 (Epistemic Plane)

认识平面描述了一个命题为什么应当或不应当影响信念。

## 7.1 断言 (Assertion)

推荐的逻辑结构：

```text
Assertion (断言)
├ proposition (目标命题)
├ asserted_by (断言主体)
├ stance (立场)
├ mode (模式)
├ confidence (置信度)
├ valid_time (from / until，有效时间区间)
├ asserted_at (断言时间)
├ status (状态)
├ evidence links (证据链接)
├ provenance links (溯源链接)
└ optional context (可选上下文)
```

### `stance` (立场)

推荐的核心值：

```text
support    (支持)
reject     (拒绝)
uncertain  (不确定)
```

### `mode` (模式)

推荐的值：

```text
observed      (观察所得)
stated        (陈述声明)
inferred      (推理得出)
predicted     (预测得出)
hypothetical  (假设性)
imported      (导入获得)
```

Profile 可以 (MAY) 定义额外的模式。

### `status` (状态)

推荐的生命周期状态：

```text
active      (活跃)
retracted   (已撤回)
superseded  (已废弃替代)
expired     (已过期)
```

`superseded` 表示在特定的时间或上下文解释下，一个更新的断言取代了该断言。它不会删除旧断言。

## 7.2 置信度 (Confidence)

`confidence` 归属于 Assertion，回答的是：

> **在陈述的条件下，该断言支持其立场的力度有多大？**

它不是：

- 来源信任度；
- 召回频率；
- 记忆强度；
- 显著性；
- 行动实用度。

KIP 不强制规定全局唯一的置信度计算公式。

## 7.3 证据 (Evidence)

证据应当 (SHOULD) 是一等公民且可被寻址。

推荐的逻辑字段：

```text
Evidence (证据)
├ evidence_class (证据类别)
├ content_ref 或紧凑 content (内容引用或内联内容)
├ observed_at (观察时间)
├ subject/context (主体 / 上下文)
├ content_digest (内容摘要散列)
├ media_type (媒体类型)
├ origin (源头)
└ lifecycle state (生命周期状态)
```

可能的证据类别：

```text
observation         (观察)
user_statement      (用户陈述)
tool_result         (工具执行结果)
measurement         (测量数据)
document            (文档)
web_resource        (网页资源)
message             (消息)
external_assertion  (外部断言)
derived_result      (衍生结果)
human_feedback      (人类反馈)
```

证据在可能的情况下应当 (SHOULD) 是不可变的。更正应当 (SHOULD) 创建新证据或附加撤回/更正关系，而不是静默重写历史。

## 7.4 支持证据与反面证据 (Supporting and Counter-Evidence)

断言应当 (SHOULD) 能够同时引用：

```text
evidence 引用且 role 为 "support"    (支持证据)
evidence 引用且 role 为 "challenge"  (质疑 / 反面证据)
```

这允许智能体保留未决的认识论张力，而不是过早地塌缩为单一事实。

## 7.5 来源溯源 (Provenance)

KIP 2.0 应当 (SHOULD) 将来源溯源建模为图结构，而不仅是自由格式的元数据字符串。

最小溯源模型受到通用模式的启发：

```text
Entity (实体) ── used/generated by ── Activity (活动) ── associated with ── Agent (主体)
```

KIP 无需强制采用 PROV-O 语法，但应当 (SHOULD) 保留对等的能力。

示例：

```text
WebPageSnapshot (网页快照)
      │ used_by (被使用)
      ▼
ExtractionActivity (提取活动)
      │ generated (生成)
      ▼
Evidence17 (证据 17)
      │ supports (支持)
      ▼
Assertion42 (断言 42)
```

## 7.6 声明溯源 vs. 引擎源头 (Claimed Provenance vs. Engine Origin)

这种区分对于安全至关重要。

### 声明溯源 (Claimed provenance)

提交智能体所声称的发生经过：

```text
"Alice 告诉我 X"
"这来自文档 Y"
```

### 引擎源头 (Engine origin)

认知中枢能够对写入操作本身进行实证核验的信息：

```text
origin_principal (源头调用主体)
origin_space (源头空间)
origin_channel (源头渠道)
transaction_id (事务 ID)
created_at (创建时间)
parent transaction / import id (父事务 / 导入 ID)
content digest (内容摘要)
```

引擎源头应当 (SHOULD) 由系统维护且禁止作者自行写入。

这防止了导入或总结的记忆仅仅通过重写其 `source` 字段来“洗白”其自身的源头。

## 7.7 信任度 (Trust)

信任度回答的是：

> **在此上下文中，该来源、调用主体、证据类别或源头应具备多大的认识论权威？**

信任度通常应当 (SHOULD) 作为治理/认识论策略的输入，而非永久复制到每个命题上的属性。

示例：

```text
trust(用户自述, 个人偏好) = 高
trust(用户自述, 医学诊断) = 有限
trust(已验证的工具结果, 部署状态) = 高
trust(导入的未签名记忆, 可执行技能) = 接近零
```

## 7.8 信念投影 (Belief Projection)

KIP 核心层严禁 (SHOULD NOT) 强制规定单一全局通用的信念聚合算法。

相反，KIP 2.0 定义了**认识论投影 (Epistemic Projection)** 的概念：

> 一个作用于命题和断言之上的上下文相关视图，用于为消费主体筛选出当前被接受 (accepted)、拒绝 (rejected)、不确定 (uncertain) 或争议中 (contested) 的命题。

概念上：

```text
原始认知状态 (Raw Cognitive State)
    命题 + 断言 + 证据 + 策略
                    │
                    ▼
          认识论投影 (Epistemic Projection)
                    │
          ┌─────────┼─────────┐
          │         │         │
       已接受      争议中      已拒绝
      accepted   contested  rejected
```

记忆大脑可以针对不同任务使用不同的投影。

例如，谨慎的医疗辅助智能体与随性的个人助理可以在相同的断言集上运行，但采用完全不同的接受阈值。

## 7.9 KIP 1.x 语法易用性兼容 (KIP 1.x Ergonomic Compatibility)

KIP 2.0 应当 (SHOULD) 保留简单的命题写入作为语法糖。

概念上声明如下内容的 v1 风格操作：

```text
Alice prefers DarkMode
```

可以脱糖 (desugar) 为：

```text
1. 规范的 Proposition(Alice, prefers, DarkMode)
2. 针对该命题的正面 Assertion
3. asserted_by = 经认证的调用者或显式行动主体
4. 自动附加引擎源头 (engine origin)
```

类似地，v1 风格的命题查询可以 (MAY) 在当前生效的已接受投影 (accepted projection) 上运行，而非直接暴露所有原始命题项。

原生 KIP 2.0 客户端应当 (SHOULD) 能够显式查询 Assertions。

这在修正底层语义的同时，完整保留了模型优先的人机工效。

---

# 8. 时间模型 (Temporal Model)

KIP 2.0 应当 (SHOULD) 显式区分多个时间维度。

## 8.1 业务有效时间 (Valid Time)

断言在现实世界中被声称成立的时间：

```text
valid_time.from
valid_time.until
```

示例：

```text
Alice 在 2021 年至 2025 年期间居住在上海。
```

## 8.2 观察时间 (Observation Time)

观察到证据的时间：

```text
observed_at
```

## 8.3 断言时间 (Assertion Time)

主体做出或生成断言的时间：

```text
asserted_at
```

## 8.4 引擎事务时间 (Engine Transaction Time)

认知中枢记录或变更元素的时间：

```text
_system.created_at
_system.updated_at
_system.created_tx / _system.updated_tx
```

这些字段是引擎层事实，应当 (SHOULD) 是不可变的或由引擎维护的。

## 8.5 为什么多个时间轴至关重要 (Why Multiple Time Axes Matter)

以下是两个截然不同的问题：

> Alice 在 2025-03-01 的位置是什么？

以及：

> 在 2025-03-01 当天，智能体认为 Alice 的位置是什么？

第一个问题查询的是**业务有效时间 (Valid Time)**。

第二个问题查询的是**截至特定事务/断言时间的知识快照 (Knowledge-as-of transaction/assertion time)**。

KIP 2.0 的架构设计应当 (SHOULD) 确保未来的 KQL 能够同时表达这两种查询，而无需再次修改底层数据模型。

---

# 9. 记忆平面 (Mnemonic Plane)

记忆平面描述了认知状态如何保持可用以影响未来的计算。

KIP 核心层应当 (SHOULD) 定义生命周期钩子和通用信号语义，而具体的记忆类型保留由 Profile 定义。

## 9.1 归属于核心层的内容 (What Belongs in Core)

核心层可以标准化横切概念，例如：

```text
retention class (留存类别)
expiry / archival state (过期 / 归档状态)
system timestamps (系统时间戳)
memory activation hints (记忆激活提示)
```

但应当 (SHOULD) 避免强求图谱中的每一个元素都表现得像人类记忆一样。

## 9.2 归属于认知 Profile 的内容 (What Belongs in Cognitive Profiles)

认知记忆 Profile 可以定义：

```text
Event (事件)
Experience (经验)
ExperienceStep (经验步骤)
Preference (偏好)
Insight (洞察)
Commitment (承诺)
Skill (技能)
SelfModel artifacts (自我模型制品)
```

以及它们的新陈代谢 (metabolism) 规则。

## 9.3 正交认知信号 (Orthogonal Cognitive Signals)

该架构识别出至少五个独立的信号：

| 信号 | 回答的核心问题 |
| --- | --- |
| `confidence` | 该断言得到多大程度的支持？ |
| `trust` | 该源头/来源在此处具有多大权威？ |
| `memory_strength` | 该记忆在召回竞争中的强度有多大？ |
| `salience` | 它的重要性或值得铭记的程度如何？ |
| `utility` | 它对未来行动的实用有效性如何？ |

这些值严禁 (MUST NOT) 被视为同义词。

## 9.4 记忆强度 (Memory Strength)

`memory_strength` 是 Profile 级别的记忆可访问性指标。

它可能随着以下情况上升：

- 重新确认；
- 成功使用；
- 重复的情境相关性；
- 排练/回想；
- 高显著性。

它可能随着以下情况下降：

- 废弃不用；
- 竞争性的巩固表示出现；
- 刻意停用。

一个真实的事实完全可以保持：

```text
confidence = 0.99
memory_strength = 0.20
```

二者之间毫无矛盾。

## 9.5 显著性 (Salience)

显著性捕获主观重要性或值得铭记的程度。

对于经验学习，显著性不应当 (SHOULD NOT) 仅基于情绪强度。预测误差、结果量级、新颖性、目标相关性和人类反馈可能是更有价值的信号。

## 9.6 实用度 (Utility)

实用度特别适用于技能 (Skills) 和程序性记忆。

它回答的是：

> 在匹配的条件下，该程序的有效性如何？

重复的失败可以增加一项经验 (Experience) 的*学习价值*，同时降低一项技能 (Skill) 的实用度。

在 Skill 之外，认知记忆 Profile 还将 `utility` 作为通用的记忆代谢信号：它代表记忆准入时的预期效用（即对未来决策价值的预先评估），在存入时记录，并在事后根据实际调用产出进行校准。若缺少该信号，记忆系统便无法度量哪些准入内容真正具备持久价值，准入策略也无从持续优化与自适应学习。

这种校准有类型化的来源。系统中的信号可以有三种持有方式：由断言者设定（Assertion 上的置信度）、随使用与闲置而代谢（memory_strength）、或者被挣得——因一条被记录的后果评定了它而改变。后果通道（规范 §15.7）把第三种方式落为实体：由仪器化组件写入、绝不由被评定的行动者写入的结果证据，通过任务族与被评定的认知联结。观察世界从来不是难点；这条通道让世界得以反向投票。

## 9.7 遗忘的多重含义 (Forgetting Has Multiple Meanings)

KIP 2.0 应当 (SHOULD) 停止使用单一的“遗忘 (forgetting)”词汇来指代几种互不相关的操作。

```text
认识论遗忘 (Epistemic forgetting)
    断言被撤回 / 废弃替代

记忆性遗忘 (Mnemonic forgetting)
    记忆强度降低 / 不再自发召回

归档性遗忘 (Archival forgetting)
    从正常召回中排除，但保留以供审计

逻辑删除 (Logical deletion)
    标记墓碑 (tombstone)；标识与审计引用仍然保留

治理性遗忘 (Governance forgetting)
    访问权限被撤销

载荷性遗忘 (Payload forgetting)
    原始载荷字节被销毁，而证据事件记录、内容摘要与引用拓扑依然完整保留

物理性遗忘 (Physical forgetting)
    字节被物理擦除 / 销毁
```

这些是独立的转换过程。

物理删除应当 (SHOULD) 保持审慎且可审计。

---

# 10. 治理平面 (Governance Plane)

真正的记忆大脑需要清晰的归属权与权威边界。

## 10.1 调用主体 (Principal)

`Principal` 是认知中枢所知晓的经认证的执行身份。

它不一定等同于图谱中的 `Person` 概念节点。

示例：

```text
human account (人类账户)
business agent (业务智能体)
maintenance worker (维护工作进程)
organization service (组织服务)
external agent (外部智能体)
```

治理平面可以将一个 Principal 映射到一个或多个图谱身份。

## 10.2 记忆空间 (MemorySpace)

`MemorySpace` 是主要的归属权、策略和隔离边界。

示例：

```text
personal://yan
org://alink
project://kip
family://qing
public://research
```

一个空间控制：

- 归属所有权；
- 读/写权限；
- 默认策略；
- Schema 模式包；
- 导入/导出策略；
- 留存要求；
- 审计要求。

## 10.3 领域 vs. 空间 (Domain vs. Space)

```text
Domain = 语义 / 主题组织
Space  = 治理 / 归属边界
```

一个 `Rust` 领域可以存在于多个空间中。

一个项目空间可以包含许多领域。

## 10.4 策略执行 (Policy Enforcement)

策略必须 (MUST) 在数据被返回或变更之前由认知中枢强制执行。

仅在提示词中实现隐私保护是远远不够的。

每一次查询/变更在概念上都在以下上下文中执行：

```text
principal (调用主体)
space (空间)
capabilities (能力集)
purpose/context (目的 / 上下文)
operation (操作类型)
```

## 10.5 权限 (Permissions)

未来的 KIP 2.0 策略模型应当 (SHOULD) 至少能够表达：

```text
read              (读取)
write             (写入)
assert            (断言)
retract           (撤回)
maintain          (维护)
export            (导出)
import            (导入)
share             (共享)
administer policy (管理策略)
```

Profile 可以定义更细粒度的权限。

## 10.6 数据分级 (Data Classification)

认知对象可以携带与策略相关的标签，例如：

```text
public     (公开)
internal   (内部)
private    (私有)
secret     (机密)
sensitive  (敏感)
```

标签本身并不是策略。策略决定了该标签对特定主体意味着什么。

## 10.7 记忆权威分级 (Memory Authority Classes)

KIP 2.0 应当 (SHOULD) 区分存储内容被允许影响行动的力度。

推荐的概念分级：

```text
descriptive (描述性)
    可用于解答问题

advisory (建议性)
    可用于推荐行动

behavioral (行为性)
    可用于影响决策策略

executable (可执行)
    可包含代码 / 提示词 / 工具调用程序
```

记忆项的语义内容严禁 (MUST NOT) 被允许自行提升其权威等级。

## 10.8 导入技能 (Imported Skills)

外部导入的技能默认应当 (SHOULD) 为：

```text
status = proposed (提议)
execution authority = none (无执行权限)
lifecycle standing = none transferred (不迁移生命周期地位)
```

直到完成本地试用并经本地策略提升。

技能被签名仅证明了其源头/完整性；它不能证明其安全性、适用性或正确性。

## 10.9 源头绑定权威 (Origin-Bound Authority)

对安全敏感的权威应当 (SHOULD) 绑定到引擎观察到的源头，而非从可变的内容或智能体生成的摘要中推断。

派生记忆即使在经历以下过程后，也应当 (SHOULD) 保留源头血统：

- 摘要化；
- 巩固；
- 语义抽象；
- 技能编译；
- 跨智能体转移。

转换可以创建新的制品，但绝不能抹去从其输入继承的权威约束，除非发生了经显式授权的提权流程。

---

# 11. 认知记忆 Profile (Cognitive Memory Profile)

KIP 核心层不硬编码特定的认知分类体系。

**KIP 认知记忆 Profile (KIP Cognitive Memory Profile)** 在核心层之上定义了一套标准化的记忆架构。

推荐的初始 Profile 类型：

```text
Person (人)
Event (事件)
Experience (经验)
ExperienceStep (经验步骤)
Preference (偏好)
Insight (洞察)
Commitment (承诺)
Skill (技能)
SleepTask (休眠维护任务)
SelfModel artifacts (自我模型制品)
```

该 Profile 解答了 KIP 核心层故意不作规定的问题：

- 何时应当形成一个 Event？
- 哪些轨迹值得进行 Experience 编码？
- 什么是 ExperienceStep？
- 程序性巩固如何产生 Skill？
- 记忆强度如何变化？
- Commitment 何时逾期？
- 什么是自传式记忆的地标 (autobiographical landmark)？

该 Profile 是可移植的；实现它的具体算法不作硬性规定。

---

# 12. 经验学习集成 (Experience Learning Integration)

记忆大脑必须将过去的观察与未来的行动连接起来。

## 12.1 完整学习闭环 (Full Learning Loop)

```text
环境 / 人类 / 工具 (Environment / Human / Tool)
          │
          ▼
      观察 (Observation)
          │
          ▼
      证据 (Evidence)
          │
          ▼
      断言 (Assertion(s))
          │
          ├──────────────> 语义巩固 (Semantic Consolidation)
          │                         │
          │                         ▼
          │                      知识 (Knowledge)
          │
          ▼
   事件 / 经验 (Event / Experience)
          │
          ├──────────────> 反思 (Reflection) ─────> 洞察 / 自我模型 (Insight / Self Model)
          │
          └──────────────> 程序性巩固 (Procedural Consolidation)
                                    │
                                    ▼
                                技能 (Skill)
                                    │
                                    ▼
                             动作召回 (Action Recall)
                                    │
                                    ▼
                             未来行动 (Future Action)
                                    │
                                    └──────↺
```

## 12.2 经验是程序的证据，而非程序本身 (Experience Is Evidence of a Procedure, Not the Procedure Itself)

一次成功的经验并不能证明一项技能具备普遍有效性。

一项技能应当 (SHOULD) 保留：

- 适用性；
- 前置条件；
- 执行程序；
- 成功标准；
- 失败模式；
- 反例；
- 支持性的经验列表；
- 验证历史；
- 源头权威。

## 12.3 失败是一等公民 (Failure Is First-Class)

失败的经验可以传授：

- 负向前置条件；
- 诊断分支；
- 恢复策略；
- 无效假设；
- 技能的反例。

严禁 (SHOULD NOT) 仅因任务失败就将其丢弃。

## 12.4 动作召回 (Action Recall)

针对行动的记忆检索应当 (SHOULD) 与普通的问答检索有所区别。

一份有价值的行动简报 (Action Briefing) 可以包含：

```text
Relevant accepted knowledge (相关已接受知识)
Contested assumptions (争议中的假设)
Applicable Skills (适用的技能)
Skill provenance and authority (技能溯源与权威)
Similar successful Experiences (相似成功经验)
Relevant failed Experiences / counterexamples (相关失败经验 / 反例)
Open commitments (未结承诺)
Current constraints (当前约束)
Unverified preconditions (未验证的前置条件)
Warnings (警示)
```

消费智能体始终保留最终的行动决策权威。

---

# 13. 认知运行时 (Cognitive Runtime)

认知运行时在四个平面之上暴露协议操作。

## 13.1 查询 (Query)

KQL 仍是结构化检索语言。

KIP 2.0 架构预设了至少三种概念性查询视图：

### 原始视图 (Raw View)

返回命题、断言、证据和来源溯源，不折叠消除认识论差异。

### 认识视图 (Epistemic View)

返回特定上下文下的已接受/争议中/已拒绝投影。

### 记忆视图 (Memory View)

返回经过 Profile 感知、使用记忆和任务相关性信号排序后的记忆。

规范此后已经固定了具体语法：原始视图即针对 Concept/Proposition/Assertion/Evidence/Activity 模式的普通 `FIND`，认识视图即 `WITH EPISTEMIC` 下的 `BELIEF` / `BELIEF SLOT`，记忆视图则是由大脑自行拥有的 Profile 感知排序策略，而非协议子句。

## 13.2 变更 (Mutation)

KML 仍是变更语言。

原生 KIP 2.0 变更应当能够：

- 创建规范命题；
- 添加断言；
- 撤回 / 废弃替代断言；
- 附加证据；
- 执行实体合并；
- 更新 Profile 状态；
- 在策略控制下操作模式包 (Schema Packages)。

## 13.3 原子多命令事务 (Atomic Multi-Command Transactions)

KIP 1.x 保证单条写入语句内部的原子性，但不支持跨任意命令批次的原子性。

KIP 2.0 应当 (SHOULD) 支持原子批处理执行模式。

概念上：

```json
{
  "operations": ["...", "...", "..."],
  "execution": {
    "mode": "atomic",
    "idempotency_key": "..."
  }
}
```

协议应当提供：

```text
transaction_id (事务 ID)
commit status (提交状态)
idempotency result (幂等结果)
mutation counts (变更计数)
receipt digest (收据摘要)
```

这对于安全的认知状态转换是必需的，例如：

```text
创建新断言
废弃替代前一个断言
附加新证据
关闭承诺
```

这些操作绝不应留下半完成的中间状态。

## 13.4 乐观并发控制 (Optimistic Concurrency)

`EXPECT VERSION` 仍是极其有价值的 KIP 原语，应当 (SHOULD) 予以保留。

架构还应当在适当时机允许事务级冲突检测。

## 13.5 搜索 (Search)

`SEARCH` 仍是联想接地的核心原语。

嵌入 (Embedding) 仍是实现细节，严禁 (SHOULD NOT) 跨越协议边界。

KIP 2.0 应当 (SHOULD) 允许实现暴露分数解释组件，例如：

```text
semantic similarity (语义相似度)
lexical score (词法匹配分)
graph proximity (图临近度)
```

而不强加单一全局排序公式。

记忆大脑随后可以将检索信号与以下维度相结合：

```text
applicability (适用性)
confidence (置信度)
trust (信任度)
memory_strength (记忆强度)
salience (显著性)
utility (实用度)
recency (新鲜度)
policy (策略)
```

## 13.6 变更流 (Change Stream)

KIP 2.0 应当 (SHOULD) 定义可选的变更流能力。

概念上：

```text
CHANGES SINCE <cursor>
```

或 API 等价形式。

用例：

- 数据复制；
- 二级索引更新；
- 缓存失效；
- 审计；
- 休眠 / 维护触发器；
- 同步；
- 备份；
- 外部监控。

变更流是引擎层事实，不同于记忆大脑的维护日志。

## 13.7 能力协商 (Capability Negotiation)

KIP 端点在运行时级别应当 (SHOULD) 是自描述的。

概念上：

```text
DESCRIBE CAPABILITIES
```

响应应当说明：

```text
KIP protocol version (KIP 协议版本)
supported profiles (支持的 Profile 列表)
query features (查询特性)
search modes (搜索模式)
atomic batch support (原子批处理支持)
policy support (策略支持)
signed capsule support (签名胶囊支持)
change stream support (变更流支持)
limits (配额与限制)
extensions (扩展功能)
```

这将 KIP 现有的自描述哲学从模式内省扩展到了运行时内省。

---

# 14. 模式 (Schema) 架构

KIP 1.x 将模式存储在图中。KIP 2.0 应当 (SHOULD) 保留该特性的同时，使模式具备可移植性和版本化管理能力。

## 14.1 模式包 (Schema Package)

一个模式包 (Schema Package) 是由以下内容组成并带有版本号的集合：

```text
package_id (包标识)
version (版本)
dependencies (依赖项)
concept types (概念类型)
proposition types (命题类型)
constraints (约束)
aliases (别名)
migration metadata (迁移元数据)
compatibility range (兼容范围)
```

示例逻辑标识符：

```text
kip://core@2.0.0
kip://profiles/cognitive-memory@2.0.0
kip://ldclabs/organization@1.0.0
```

规范此后已将该引用语法固定为 `kip://<package-path>@<exact-version>[/<symbol>]`，且持久化状态必须 (MUST) 记录确切版本号而非浮动别名（规范 §20.2、§20.4）。

## 14.2 规范模式标识 (Canonical Schema Identity)

人类友好的类型名称仍具价值：

```text
Person
Skill
Organization
```

但规范类型标识应当 (SHOULD) 包含包命名空间 + 版本血统。

这避免了互不相关的生态系统定义出同名但不兼容的 `Person` 或 `Skill` 类型。

## 14.3 校验 (Validation)

KIP 2.0 模式约束应当 (SHOULD) 成为机器可验证的契约，而非仅作指导性说明。

实现可以提供不同的严格级别，但一致性要求对声明的约束具备确定性的校验模型。

模式内省应当 (SHOULD) 继续针对 LLM 消费进行深度优化。

## 14.4 迁移 (Migration)

模式包应当 (SHOULD) 能够描述迁移兼容性，例如：

```text
backward compatible (向后兼容)
requires transform (需要转换)
breaking (破坏性变更)
```

协议无需自动执行任意迁移代码。

---

# 15. 认知胶囊 2.0 (Cognitive Capsule 2.0)

KIP 1.x 知识胶囊 (Knowledge Capsule) 提供了可移植、幂等的图谱更新载体。KIP 2.0 将这一理念扩展为**认知胶囊 (Cognitive Capsule)**。

## 15.1 胶囊目标 (Capsule Goals)

认知胶囊应当 (SHOULD) 具备以下特性：

- 可移植；
- 确定性；
- 可审查；
- 模式感知；
- 保留溯源；
- 策略感知；
- 可计算哈希；
- 可选签名；
- 导入前可安全预览。

## 15.2 逻辑结构 (Logical Structure)

```text
CognitiveCapsule (认知胶囊)
├ manifest (清单)
├ schema dependencies (模式依赖)
├ concepts (概念列表)
├ propositions (命题列表)
├ assertions (断言列表)
├ evidence (证据列表)
├ provenance (来源溯源)
├ mnemonic/profile state (记忆 / Profile 状态)
├ policy/classification hints (策略 / 分级提示)
├ canonical digest (规范摘要散列)
└ optional proofs/signatures (可选证明 / 签名)
```

## 15.3 规范表示 (Canonical Representation)

KIP DSL 针对模型交互进行了优化，并不适合直接用于基于内容寻址的加密签名。

因此，KIP 2.0 应当 (SHOULD) 定义独立于人类/模型友好 DSL 的机器规范表示。

规范 JSON 表示是一个极具竞争力的默认候选方案。

规范化必须 (MUST) 明确定义：

- 对象键的排序规则；
- 数字表示形式；
- Unicode 处理方式；
- 元素排序或集合规范化；
- 引用标准化；
- 省略 / 默认字段的处理。

## 15.4 完整性与签名 (Integrity and Signatures)

密码学证明能够验证：

```text
integrity (完整性)
origin/authorship binding (源头 / 署名绑定)
```

它**不能**验证：

```text
truth (真实性)
safety (安全性)
utility (实用度)
applicability (适用性)
```

这种界限必须 (MUST) 保持清晰明确。

## 15.5 导入生命周期 (Import Lifecycle)

KIP 2.0 应当 (SHOULD) 支持在概念上等同于以下的导入模式：

```text
preview (预览)
isolate (隔离)
merge   (合并)
```

在合并之前，引擎或记忆大脑应当能够审查：

- 模式兼容性；
- ID 冲突；
- 断言冲突；
- 缺失的依赖项；
- 签名 / 完整性状态；
- 策略违规；
- 权威分级；
- 可执行内容；
- 源头血统。

## 15.6 导出不授予权限 (Export Does Not Grant Authority)

导出的内容保留其来源溯源，但不会仅仅因为被另一个空间导入就自动丧失安全约束。

目标空间应用其自身的信任与安全策略。

---

# 16. 安全模型 (Security Model)

持久化记忆是一个长期存在的攻击面，因为在某个上下文中写入的内容可能会在很久以后影响一次至关重要的行动。

因此，KIP 2.0 将记忆安全视为一个全生命周期问题。

## 16.1 威胁分类 (Threat Classes)

至少包括：

```text
malicious memory injection (恶意记忆注入)
origin laundering (源头洗白)
manufactured corroboration (伪造佐证)
cross-space privacy leakage (跨空间隐私泄露)
prompt-level ACL bypass (提示词级访问控制绕过)
unsafe Skill import (不安全技能导入)
schema poisoning (模式投毒)
policy escalation (策略越权提权)
replay / duplicate mutation (重放 / 重复变更)
provenance tampering (溯源篡改)
selective deletion of counter-evidence (选择性删除反面证据)
```

## 16.2 不可篡改源头原则 (Non-Malleable Origin Principle)

记忆的权威等级严禁 (MUST NOT) 仅由可变的语义内容来决定。

引擎应当保留无法通过以下方式替代的源头血统：

- 摘要化；
- 受信工具的回显；
- 换词重述；
- 巩固；
- 反复重复声明。

## 16.3 衍生记忆权威 (Derived Memory Authority)

衍生的 Insight 或 Skill 应当保留对支持性源头出处的引用。

权威提升是一项独立操作，必须 (MUST) 经过授权的策略或验证流程。

示例：

```text
不受信的外部观察 (untrusted external observation)
        ↓ 摘要化 (summarization)
本地洞察 (local Insight)
```

该 Insight 虽然由本地生成，但其认识论/行动权威绝不能自动等同于受信的本地观察。

## 16.4 反面证据保留 (Counter-Evidence Preservation)

攻击者或有缺陷的维护流程不应仅通过删除反对证据就能强化某种信念。

对 Evidence 的高影响删除或归档操作应当 (SHOULD) 是可审计且受策略约束的。

## 16.5 可执行记忆 (Executable Memory)

代码、提示词、工具策略和子智能体技能应当 (SHOULD) 比描述性事实受到更严格的策略约束。

安全的默认行为是：

```text
外部可执行记忆
    → 存储但处于未激活状态
    → 经过审查 / 本地试用
    → 显式激活
```

---

# 17. 自身 ($self) 与智能体标识 (Self and Agent Identity)

`$self` 和 `$system` 仍是非常有价值的认知抽象，但它们只是语义行动者的文档化称谓，绝非 KIP 语法。核心层仅拥有受保护的自我标识指派；行动者本身归属于认知记忆 Profile。

KIP 核心层理解：

```text
Principal (调用主体)
Space (空间)
identity references (标识引用)
每个 Space 至多一个被指派的自我标识（受保护的治理状态）
```

认知记忆 Profile 定义：

```text
Person
SelfModel
文档中以 $self / $system 指代的语义行动者
```

部署根据策略将 `$self` 映射到一个或多个经认证的 Principal。

这避免了协议本身假设所有 KIP 部署都拥有单一的自传式自我。

---

# 18. 职责划分 (Division of Responsibility)

最重要的架构边界在于明确 KIP **不**应该决定什么。

## 18.1 KIP 核心层 (KIP Core)

KIP 核心层应当 (SHOULD) 定义：

```text
Concept (概念)
Literal (字面量)
Proposition (命题)
Assertion (断言)
Evidence (证据)
Provenance primitives (溯源原语)
Identity references (标识引用)
MemorySpace (记忆空间)
Policy hooks (策略钩子)
Schema Packages (模式包)
Query semantics (查询语义)
Mutation semantics (变更语义)
Transactions (事务)
Search primitive (搜索原语)
Import / Export / Capsule (导入 / 导出 / 胶囊)
Capabilities (能力协商)
System metadata (系统元数据)
Conformance (一致性标准)
```

## 18.2 认知记忆 Profile (Cognitive Memory Profile)

标准认知记忆 Profile 应当 (SHOULD) 定义：

```text
Person (人)
文档中以 $self / $system 指代的语义行动者
Event (事件)
Experience (经验)
ExperienceStep (经验步骤)
Preference (偏好)
Insight (洞察)
Commitment (承诺)
Watch (守望)
Skill (技能)
SleepTask (休眠任务)
WorkingState (工作状态)
memory_strength (记忆强度)
salience (显著性)
utility (实用度)
DerivationState (派生状态)
profile-specific lifecycle (Profile 特定的生命周期)
```

## 18.3 Anda 记忆大脑 (Anda Brain)

Anda 记忆大脑应当拥有认知算法与策略，例如：

```text
formation thresholds (形成阈值)
admission utility estimation (准入效用估计)
experience boundary detection (经验边界检测)
salience scoring (显著性评分)
prediction-error estimation (预测误差估计)
semantic consolidation (语义巩固)
contrastive procedural consolidation (对比程序性巩固)
Skill validation (技能验证)
self-model synthesis (自我模型综合)
working-state synthesis (工作状态综合)
memory-strength metabolism (记忆强度新陈代谢)
utility calibration (效用校准)
watch evaluation / delta detection (Watch 状态评估 / 增量检测)
interruption gating (act / ask / defer / silence) (行动门控)
retrieval reranking (检索重排)
Action Briefing synthesis (行动简报综合)
maintenance scheduling (维护调度)
```

## 18.4 认知中枢实现 (Cognitive Nexus Implementation)

引擎应当拥有具体实现细节，例如：

```text
physical graph storage (物理图存储)
indexes (索引)
embedding model (嵌入模型)
query planning (查询规划)
transactions (事务处理)
policy enforcement (策略执行)
system origin metadata (系统源头元数据)
canonicalization (规范化处理)
cryptographic verification (密码学验证)
change log (变更日志)
replication (数据复制)
```

这种分离使 KIP 保持互操作性，同时允许 Anda 记忆大脑快速迭代演进。

---

# 19. 规范认知工作流 (Canonical Cognitive Workflows)

## 19.1 观察 → 信念 (Observation → Belief)

```text
工具 / 用户 / 现实世界 (Tool / User / World)
      │
      ▼
    证据 (Evidence)
      │
      ▼
    命题 (Proposition)
      │
      ▼
    断言 (Assertion)
      │
      ▼
认识论投影 (Epistemic Projection)
      │
      ▼
智能体信念上下文 (Agent Belief Context)
```

## 19.2 更正 (Correction)

```text
旧命题 P (Old Proposition P)
   └ 断言 A (活跃状态) (Assertion A (active))

新证据 (New Evidence)
   ↓
断言 B (Assertion B)
   ↓
若针对同一命题:
    由断言 B 承载新的立场/置信度
    仅在同一行动者修订时废弃替代 A；A 本身绝不被就地编辑

若产生新的不兼容命题:
    保留两个命题
    根据依据废弃替代或质疑断言 A
```

无需仅因信念改变就删除任何命题。

## 19.3 经验学习 (Experience Learning)

```text
执行轨迹 (Trace)
  ↓
证据 + 事件 + 经验 (Evidence + Event + Experience)
  ↓
语义巩固 → 断言 / 知识 (Semantic consolidation → Assertion / Knowledge)
  ↓
程序性巩固 → 技能 (Procedural consolidation → Skill)
  ↓
未来的动作召回 (future Action Recall)
  ↓
新的执行结果 (new outcome)
  ↓
技能验证 / 更正 (Skill validation / correction)
```

## 19.4 共享记忆 (Shared Memory)

```text
个人空间 (Personal Space)
     │ 导出胶囊 (export capsule)
     ▼
策略 / 脱敏 / 签名 (Policy / redaction / signature)
     │
     ▼
团队空间 (Team Space)
     │ 作为带有溯源的外部认知导入
     ▼
本地信任度 + 权威评估 (Local trust + authority evaluation)
     │
     ├ 已接受的语义断言 (accepted semantic assertions)
     └ 提议技能 (未激活，直至本地采纳) (proposed Skills)
```

## 19.5 休眠 / 维护 (Sleep / Maintenance)

维护操作在相同的原语上运行，但处于经单独授权的 Principal 之下。

它可以：

- 进行巩固；
- 合并重复实体；
- 创建衍生断言；
- 提炼技能；
- 归档低价值的原始经验；
- 降低记忆强度；
- 检测矛盾；
- 刷新 Profile 摘要；
- 调度审查任务。

它严禁 (SHOULD NOT) 静默重写引擎源头或抹去相冲突的反面证据。

---

# 20. 从 KIP 1.x 迁移 (Migration from KIP 1.x)

KIP 2.0 在语义上是不兼容的重大升级，但可以提供实用的兼容迁移路径。

## 20.1 默认记忆空间 (Default MemorySpace)

每个 KIP 1.x Nexus 迁移至一个默认空间。

对于个人记忆大脑部署，这通常是 `$self` 个人空间。

## 20.2 概念迁移 (Concept Migration)

现有的 Concept 节点尽可能保留其 Nexus 本地标识。

`type + name` 仍作为接地键。

迁移过程将补充添加：

```text
immutable core id (不可变核心 ID)
schema package reference (模式包引用)
optional canonical_id (可选规范 ID)
space membership (空间归属)
```

## 20.3 命题迁移 (Proposition Migration)

针对每一个 v1 命题：

```text
1. 保留 / 规范化结构命题 (structural Proposition)
2. 创建一个迁移后的正面断言 (positive Assertion)
3. 将 author/source/confidence/validity 语义转移至该 Assertion
4. 当无法进行精确转换时，将旧元数据保留为遗留溯源 (legacy provenance)
```

## 20.4 属性迁移 (Attribute Migration)

属性不会自动炸裂为命题。

迁移应当 (SHOULD) 对属性进行分类：

### 保留为属性 (Keep as attributes)

- 显示提示；
- 紧凑的 Profile 状态；
- 计数器；
- 无独立认识论生命周期的数组 / 对象。

### 在需要时升级为“命题 + 断言” (Promote to Proposition + Assertion when needed)

- 带有来源 / 置信度的事实性数值；
- 历史上会发生变化的值；
- 可能发生冲突的值；
- 需要独立访问控制的值；
- 跨空间交换的值。

这可以渐进式进行。

## 20.5 `confidence` (置信度)

仅当现有命题的 `metadata.confidence` 确实表达认识论承诺时，才将其转变为迁移后 Assertion 的 confidence（规范 §103.4）。若它实际编码的是可提取性、重要性或时效性，则应分别归类为 `memory_strength`、salience 或投影的新鲜度策略。

如果旧版部署曾将置信度的时间衰减作为记忆强度的替代指标，迁移无法完美重构丢失的认识论置信度。应当保留历史并审慎地初始化 `memory_strength`。

## 20.6 `superseded` (废弃替代)

将断言生命周期字段：

```text
superseded
superseded_at
superseded_by
```

从旧命题元数据移动到在语义上适用的迁移后 Assertions。

## 20.7 `source` 和 `evidence`

在可解析的情况下，将遗留字符串转换为 Evidence / Provenance 引用。

在无法解析的情况下，将它们保留为遗留批注，而不假装拥有比实际存在的更强溯源。

## 20.8 `access_level` (访问级别)

将遗留的隐私元数据转换为空间策略/分级语义。

不要仅仅依赖旧字段进行强制执行。

## 20.9 兼容模式 (Compatibility Mode)

KIP 2.0 引擎可以 (MAY) 提供 `kip-1-compat` profile：

- v1 命题写入自动创建 Assertions；
- v1 命题读取使用已接受的认识论投影；
- v1 元数据字段在无歧义时自动转换；
- 不支持的语义返回显式兼容性警告。

---

# 21. 一致性架构 (Conformance Architecture)

当独立实现的系统能够证明彼此兼容时，协议才真正成立。

KIP 2.0 应当 (SHOULD) 发布机器可读的测试固件 (fixtures) 和参考测试集。

## 21.1 一致性级别 (Conformance Levels)

推荐的测试套件：

```text
KIP Core Data Model (KIP 核心数据模型)
KIP Query (KIP 查询)
KIP Mutation (KIP 变更)
KIP Transactions (KIP 事务)
KIP Schema Packages (KIP 模式包)
KIP Search (KIP 搜索)
KIP Governance (KIP 治理)
KIP Capsule (KIP 胶囊)
KIP Provenance (KIP 来源溯源)
KIP Cognitive Memory Profile (KIP 认知记忆 Profile)
KIP Security (KIP 安全)
```

实现可以通过能力协商声明支持的级别。

## 21.2 必需制品 (Required Artifacts)

KIP 2.0 项目最终应当提供：

```text
formal grammar (形式文法)
canonical AST (规范抽象语法树)
request schemas (请求模式)
response schemas (响应模式)
canonical capsule schema (规范胶囊模式)
error registry (错误注册表)
reference fixtures (参考测试固件)
round-trip tests (往返测试)
transaction tests (事务测试)
policy tests (策略测试)
migration fixtures (迁移测试固件)
security/adversarial fixtures (安全 / 对抗性测试固件)
```

## 21.3 记忆大脑评测是独立的 (Brain Evaluation Is Separate)

协议一致性并不能证明记忆质量。

Anda 记忆大脑应当针对以下维度维护独立的基准评测：

```text
semantic retention (语义留存)
temporal evolution (时间演化)
experience reconstruction (经验重构)
procedural transfer (程序迁移)
error avoidance (错误规避)
context discrimination (情境甄别)
negative transfer (负迁移)
memory poisoning resistance (记忆投毒抵御力)
privacy leakage (隐私泄露防护)
causal memory utility (因果记忆实用度)
```

最强有力的评估依据仍然是：

```text
具备相关记忆时的表现
    >
消融相关记忆后的表现
```

---

# 22. KIP 2.0 设计不变式 (KIP 2.0 Design Invariants)

以下不变式在后续的语法讨论中必须保持成立：

1. **命题是真值中立的。**
2. **信念通过断言 (Assertions) 来表示。**
3. **多个相互矛盾的断言可以共存。**
4. **置信度属于断言，而不属于召回频率。**
5. **来源信任度与断言置信度是独立的两个概念。**
6. **引擎源头与声明溯源相互分离。**
7. **源头血统不能通过内容自行提权。**
8. **字面量值事实可以获得一等认识论处理。**
9. **需要溯源 / 冲突处理 / 有效性控制的值不应被困在属性中。**
10. **领域 (Domain) 与记忆空间 (MemorySpace) 保持分离。**
11. **标识不等于显示名称。**
12. **现实世界时间与知识时间保持分离。**
13. **记忆强度、显著性、置信度、信任度和实用度保持分离。**
14. **KIP 核心层不硬编码 Event/Experience/Skill。**
15. **Experience 和 Skill 属于认知记忆 Profile。**
16. **隐藏思维链绝不是必需的记忆制品。**
17. **失败的经验具备高价值留存资格。**
18. **仅凭语义相似性不能授权执行行动。**
19. **导入的可执行记忆默认处于未激活状态。**
20. **策略执行发生在认知中枢内部，而非仅依赖提示词。**
21. **为多步骤认知状态转换提供原子事务支持。**
22. **胶囊签名证明完整性/源头，而非证明真实性或安全性。**
23. **巩固过程保留足够的溯源信息以供修正。**
24. **物理删除与认识论遗忘、记忆性遗忘相互分离。**
25. **KIP 提供原语；记忆大脑掌管认知策略。**
26. **学习最终通过持久的行为影响来评估。**

---

# 23. 规划的 KIP 2.0 工作包 (Proposed KIP 2.0 Work Packages)

本架构应当分阶段实现。

## P0 — 语义 / 认识基石 (P0 — Semantic / Epistemic Foundation)

- 命题转变为真值中立。
- 断言成为一等公民。
- 字面量值命题客体。
- 断言立场 (stance) / 模式 (mode) / 生命周期 (lifecycle)。
- 证据模型。
- 引擎源头封装。
- 从 v1 命题的迁移语义。

## P0 — 治理基石 (P0 — Governance Foundation)

- 调用主体执行上下文。
- 记忆空间 (MemorySpace)。
- 引擎强制执行的读/写策略。
- 领域/空间分离。
- 权威分级。

## P0 — 运行时完整性 (P0 — Runtime Integrity)

- 原子批处理事务。
- 事务收据。
- 幂等键。
- 能力协商。

## P0 — 模式标识 (P0 — Schema Identity)

- 模式包 (Schema Packages)。
- 命名空间 / 版本血统语义。
- 确定性校验。
- 兼容性元数据。

## P1 — 来源溯源图 (P1 — Provenance Graph)

- 证据链接。
- Activity/Agent/Entity 风格的血统关系。
- 通过派生继承源头。
- 来源多样性语义。

## P1 — 时间语义 (P1 — Temporal Semantics)

- 业务有效时间。
- 观察时间。
- 断言时间。
- 引擎事务时间。
- 未来的时间维度查询模型。

## P1 — 认知胶囊 2.0 (P1 — Cognitive Capsule 2.0)

- 规范机器表示。
- 确定性摘要散列。
- 可选签名。
- preview / isolate / merge 导入流程。
- 策略感知的导出。

## P1 — 认知记忆 Profile 2.0 (P1 — Cognitive Memory Profile 2.0)

- Event (事件)。
- Experience (经验)。
- ExperienceStep (经验步骤)。
- Skill (技能)。
- Commitment (承诺)。
- SelfModel (自我模型)。
- 记忆强度 / 显著性 / 实用度语义。

## P2 — 变更流 / 复制 (P2 — Change Stream / Replication)

- 引擎变更游标。
- 审计收据。
- 同步 / 备份钩子。

## P2 — 一致性与基准评测 (P2 — Conformance & Benchmark)

- 核心一致性测试套件。
- 运行时与事务测试。
- 规范胶囊验证工具。
- 迁移验证固件。
- Anda 记忆大脑学习基准评测。

---

# 24. 架构问题及其决议 (Architecture Questions and Their Resolutions)

这些问题是在设计本架构时提出的。统合后的 `KIP-2.0-SPECIFICATION.md` 现已将其全部解决；原始讨论保留如下，并注明了各自的决议结果。

## Q1. Assertion 是专门的 KIP 元素类别还是保留的核心 Concept 类型？(Q1. Is Assertion a dedicated KIP element kind or a reserved Core Concept Type?)

**已决议**：Assertion 是专门的核心元素类别 (规范 §6.1)，与 Concept、Proposition、Evidence 和 Activity 并列。

专用语法可能更具人机工效且易于强制执行；将其表示为保留概念可能保持图谱一致性。

架构要求：无论哪种形式都必须具备一等语义。

## Q2. 单个 Assertion 能否具化多个 Propositions？(Q2. Can a single Assertion reify multiple Propositions?)

单个断言包可以表示包含许多主张的引用陈述或源文档，但针对每个命题建立一个断言对于置信度和矛盾处理更简单。

推荐的初始默认值：一个 Assertion 针对一个 Proposition；分组由更高层级的陈述/证据制品表示。

**已决议**：一个 Assertion 严格针对恰好一个 Proposition (规范 §13.1)。

## Q3. 原生否定主张模型到底是什么？(Q3. What exactly is the native negative-claim model?)

备选项：

```text
针对正面 Proposition 采用 stance = reject
```

或者对于布尔谓词，其客体为 `false` 的命题。

推荐原则：对于认识论上的拒绝优先使用 stance；仅当 false 确实是语义客体时才使用字面量 false。

**已决议**：按推荐方案采纳 —— 认识论拒绝使用 reject 立场，字面量 `false` 仅作为真正的语义客体；核心层保留这一结构性区别 (规范 §12.7)。

## Q4. 已接受的信念应当持久化存储还是动态计算？(Q4. Should accepted belief be persisted or computed?)

持久化已接受状态速度快，但在信任/策略变化时容易过时。

动态计算认识论投影更清晰。

推荐默认值：断言是规范状态；接受状态是视图，除非 Profile 显式对其进行快照。

**已决议**：按推荐方案采纳 —— 认识论投影是动态计算的只读视图；单次读取绝不能直接固化为持久的自我信念 (规范 §21.2)。

## Q5. KIP 核心层应包含多少策略内容？(Q5. How much policy belongs in KIP Core?)

核心层必须定义执行语义和操作上下文。它应当避免演变成一个通用的授权语言。

**已决议**：按推荐方案采纳 —— 规范定义了权限族、评估顺序和协议不变式 (§§28–31)，而不引入通用的策略语言。

紧凑的能力/策略 Profile 可能是更好的选择。

## Q6. 规范 ID 在跨空间时应如何工作？(Q6. How should canonical IDs work across Spaces?)

协议应当允许 URI/DID/URN/自定义标识符，而不强制规定单一方案。

**已决议**：按推荐方案采纳 —— Concept 可以携带 `canonical_id`，其命名方案不受限制，但赋值受 Governance 保护；未经核验的同一性主张仍表示为 `same_as` 命题 + 断言 (规范 §7.4)。

## Q7. 策略应当应用于元素、断言、命题还是子图级别？(Q7. Should policy apply at element, assertion, proposition, or subgraph level?)

所有级别都可能是必需的。初始模型应当在添加任意策略图之前，优先针对空间默认值加元素级例外进行优化。

**已决议**：按推荐方案采纳 —— 采用以 Space 为范围的权限族与拒绝优先的评估顺序，并作用于元素存在性、计数、检索排名、历史与来源，而不仅仅是载荷字段；不引入通用策略图 (规范 §§29–30、§30.4)。

## Q8. 规范胶囊格式是什么？(Q8. What is the canonical Capsule format?)

很可能是带有严格规范化规则的 JSON，而 KIP DSL 继续作为面向模型的变更表示。

**已决议**：与预期一致 —— 规范化 JSON 是用于散列/签名的基线序列化目标，KIP DSL 继续作为面向模型的变更表面 (规范 §37.7)。

## Q9. 大型证据载荷应如何处理？(Q9. How should large Evidence payloads be handled?)

很可能是外部基于内容寻址的引用 + 摘要散列 + 元数据，而不是将每个原始制品直接存储在图中。

**已决议**：与预期一致 —— Evidence 载荷分为 `inline` 与 `external` 两种模式，配合 `content_ref` + `content_digest` + `media_type`；大型制品通过不透明的运行时 Artifact 句柄传递，且绝不会被当作 URL 自动解引用 (规范 §15.3、§85)。

## Q10. 哪些记忆字段属于核心层，哪些属于 Profile？(Q10. Which mnemonic fields are Core versus Profile?)

`expires_at` 和归档状态可以保留为横切的核心生命周期字段。`memory_strength`、`salience` 和 `utility` 最好由认知记忆 Profile 定义。

**已决议**：按推荐方案采纳 —— 核心层保留 `retention {retention_class, expires_at, legal_hold}` 以及 archive/tombstone/purge，而 `memory_strength` / `salience` 归入 Profile 的 `MnemonicState` Facet，`utility` 归入 `SkillUtility` (规范 §19、§18；认知记忆 Profile 2.0)。

---

# 25. 与 KIP 1.x 设计原则的关系 (Relationship to KIP 1.x Design Principles)

KIP 2.0 刻意保留了 KIP 1.x 中最具生命力的设计决策。

## 予以保留 (Preserved)

- 模型优先 (Model-First) 的语法哲学。
- 意图驱动的声明式交互。
- 原生图结构。
- 自描述模式。
- KQL / KML / META 的解耦分离。
- 作为协议原语的混合/语义搜索 (SEARCH)。
- 隐藏在引擎背后的嵌入 (Embedding)。
- 语句级原子写入。
- 幂等操作设计。
- `EXPECT VERSION` 乐观并发控制。
- 用于实体合并的 `MERGE`。
- 胶囊的可移植性。
- 标准错误语义。
- 认知启动指南 (Cognitive Primer) / 模式内省。

## 重新诠释 (Reinterpreted)

```text
KIP 1.x:
命题 (Proposition) = 事实 (Fact)

KIP 2.0:
命题 (Proposition) = 真值中立的语义陈述
断言 (Assertion)   = 认识承诺
```

```text
KIP 1.x:
元数据同时承载 来源 + 信任 + 时间 + 记忆 + 隐私

KIP 2.0:
这些职责在各个平面之间彻底解耦分离
```

```text
KIP 1.x:
认知中枢 (Cognitive Nexus) = 统一的知识图谱记忆

KIP 2.0:
认知中枢 (Cognitive Nexus) = 受治理的外部认知状态
```

```text
KIP 1.x:
学习通常意味着持久的知识变更

KIP 2.0:
变更为学习提供可能；
行为变化是学习发生的最强证据
```

---

# 26. 架构总结 (Architecture Summary)

完整的概念技术栈为：

```text
人类 / 环境 / 工具 / 其他智能体
(Human / Environment / Tools / Other Agents)
                    │
                    ▼
          可观察输入 (Observable Inputs)
                    │
                    ▼
              ┌───────────┐
              │ 证据 (Evidence) │
              └─────┬─────┘
                    │
                    ▼
      ┌────────────────────────────┐
      │ 语义 + 认识状态              │
      │ 概念 (Concept)              │
      │ 命题 (Proposition)          │
      │ 断言 (Assertion)            │
      │ 来源溯源 (Provenance)        │
      └─────────────┬──────────────┘
                    │
             认知 Profile
                    │
      ┌─────────────┼──────────────┐
      │             │              │
    事件 (Event)  经验 (Experience)  知识 (Knowledge)
      │             │              │
      │             ▼              │
      └───────> 技能 (Skill) ◄─────┘
                    │
                    ▼
             检索 (Retrieval)
                    │
                    ▼
          未来计算 (Future Computation)
                    │
                    ▼
              行动 (Action)
                    │
                    └───────────────↺

以上所有内容均在以下边界内执行：

    MemorySpace (记忆空间) + Principal (调用主体) + Policy (策略)

所有持久化内容均保留：

    engine origin (引擎源头) + time (时间) + provenance (溯源)
```

因此，KIP 2.0 不仅回答：

> **智能体知道什么？**

它使回答以下问题成为可能：

> 存在哪些命题？

> 谁断言了它们？

> 有什么证据支持或反驳它们？

> 智能体在特定时间相信什么？

> 是什么改变了这种信念？

> 哪些经验产生了它当前的执行程序？

> 哪些记忆应当影响本次决策？

> 谁被允许查看或修改这些记忆？

> 这段导入的记忆能否被信任，处于什么权威等级？

> 智能体能否解释为什么这次采取了不同的行动？

这就是智能体拥有真正的**外部记忆大脑 (External Memory Brain)** 而非仅仅是一个持久化数据库所需的根本基石。

---

# 附录 A — 说明性示例：冲突知识 (Appendix A — Illustrative Example: Conflicting Knowledge)

假设三个来源讨论 Bob 是否是素食主义者。

## 语义状态 (Semantic state)

```text
P1 = (Bob, is_vegetarian, true)
```

## 认识状态 (Epistemic state)

```text
Assertion A
  proposition: P1
  asserted_by: Alice
  stance: support
  mode: stated
  confidence: 0.90

Assertion B
  proposition: P1
  asserted_by: Carol
  stance: reject
  mode: stated
  confidence: 0.80

Assertion C
  proposition: P1
  asserted_by: Doctor
  stance: support
  mode: observed
  confidence: 0.95
  valid_time: {from: 2024-01-01, until: 2024-12-31}
```

认知中枢无需将 P1 重写三次。

消费端记忆大脑根据以下条件请求认识论投影：

```text
current time (当前时间)
purpose (任务目的)
source trust (来源信任度)
available evidence (可用证据)
```

并可以得出结论：

```text
在 2024 年期间得到历史支持
当前状态为不确定 (uncertain)
```

而无需删除任何来源的陈述。

---

# 附录 B — 说明性示例：字面量事实演变 (Appendix B — Illustrative Example: Literal Fact Evolution)

当时区 (timezone) 需要来源溯源和历史演变时，不再采用如下存储方式：

```json
{
  "type": "Person",
  "name": "Alice",
  "attributes": {
    "timezone": "+08:00"
  }
}
```

而是采用：

```text
P1 = (Alice, timezone, "+08:00")
P2 = (Alice, timezone, "+01:00")
```

并附带 Assertions：

```text
A1 支持 P1
valid_time.until = 2026-09-01

A2 支持 P2
valid_time.from = 2026-09-01
```

现在记忆大脑可以同时回答：

```text
Alice 现在的时区是什么？
Alice 在 2026 年 9 月之前的时区是什么？
是谁告诉我们的？
我们的置信度有多大？
```

而无需让整个 Person 节点继承单一的全局来源/置信度值。

---

# 附录 C — 说明性示例：带有权威等级的经验到技能 (Appendix C — Illustrative Example: Experience to Skill with Authority)

```text
Experience E1
  goal: deploy service
  origin: local trusted tool trace
  outcome: success

Experience E2
  goal: deploy service
  origin: local trusted tool trace
  outcome: failure

External Skill Sx
  source: imported capsule
  signature: valid
  authority: descriptive only

Local Skill S1
  compiled_from: E1, E2
  task_family: deploy/service
  status: proposed
  authority: advisory
```

经 `deploy/service` 结果流评定的试用、并以一条 `lifecycle_verdict` Activity 记录确定性裁决之后：

```text
S1
  status: adopted        （暂定——后果流继续评定）
  utility: 0.87
  authority: behavioral  （独立的 Governance 决定，并非裁决的效力）
```

导入技能的有效签名绝不会自动授予其行为或执行权威。

---

# 附录 D — 非规范性设计渊源与影响 (Appendix D — Non-Normative Design Influences)

KIP 仍是一个独立的协议，但多项外部标准和研究方向印证了本架构的部分设计：

1. **RDF 1.2 Concepts / RDF 1.2 Schema** — 三元组项 (triple terms) 将抽象命题与该命题是否被断言区分开来；多个具化项 (reifiers) 可以描述围绕同一命题的不同陈述、信念、来源或环境情境。
   - https://www.w3.org/TR/rdf12-concepts/
   - https://www.w3.org/TR/rdf12-schema/

2. **W3C PROV-O** — Entity / Activity / Agent 模式是构建溯源链非常有价值的参考模型。
   - https://www.w3.org/TR/prov-o/

3. **SHACL** — 证明了将图模式作为机器可验证契约而非仅作描述性文档的巨大价值。
   - https://www.w3.org/TR/shacl12-core/

4. **Verifiable Credential Data Integrity** — 证明了规范化数据、完整性证明、身份绑定与签名内容语义真实性之间的清晰解耦。
   - https://www.w3.org/TR/vc-data-integrity/

5. **Collaborative Memory (2025)** — 强调了具备非对称、演进式读写策略以及不可变溯源需求的多用户/多智能体持久化记忆。
   - https://arxiv.org/abs/2505.18279

6. **Persistent-memory poisoning research (2026)** — 强化了将权威绑定到不可篡改源头、而非仅从记忆内容或可变的血统摘要中推断的要求。
   - https://arxiv.org/abs/2606.12703
   - https://arxiv.org/abs/2606.24322

这些仅作为架构设计的思想渊源。KIP 2.0 不强制要求与其具体数据模型或语法保持兼容。

---

# 附录 E — KIP 2.0 文档体系架构 (Appendix E — KIP 2.0 Document Architecture)

KIP 2.0 现组织为分层的规范体系，而非未来设计文档的线性列表。

核心边界如下：

```text
协议 (Protocol)
    定义具备互操作性的认知语义与运行时行为

Profile
    定义建立在协议之上的可移植认知结构

记忆大脑架构 (Brain Architecture)
    定义智能体如何利用这些结构进行学习

记忆大脑策略 (Brain Policies)
    定义具体实现的形成 (Formation) / 召回 (Recall) / 维护 (Maintenance) 行为
```

KIP 核心层一致性不要求实现任何 Brain 策略。

## E.1 规范性协议统合 (Normative Protocol Consolidation)

```text
KIP-2.0-SPECIFICATION.md
```

针对 LLM 提示词注入，维护了一个忠实精简的卡片 `KIPSyntax.md`；若发生任何冲突，以规范为准，并且在协议发生任何变更时必须保持该卡片同步更新。

这是规范性统合候选版。它定义了核心认知元素、认识论投影、治理、模式包、事务、认知胶囊、KQL、KML、META、协议运行时、历史语义、迁移不变式以及一致性不变式的协议级要求。

若参考性设计文档与规范发生冲突，以规范为准。

## E.2 参考性设计依据 (Informative Design Rationale)

```text
KIP-2.0-Architecture.md
KIP-2.0-Core-Data-Model.md
KIP-2.0-Epistemic-Model.md
KIP-2.0-Governance.md
KIP-2.0-Schema-Packages.md
KIP-2.0-Transactions.md
KIP-2.0-Capsule.md
KIP-2.0-KQL.md
KIP-2.0-KML.md
KIP-2.0-META.md
KIP-2.0-Protocol-Runtime.md
```

这些文档阐述了统合规范背后的设计依据与深层语义。

## E.3 标准认知 Profile (Standard Cognitive Profile)

```text
profiles/CognitiveMemoryProfile-2.0.md
```

认知记忆 Profile 在核心层之上定义了一套可移植的记忆本体。其标准结构包括：

```text
Person
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Skill
SleepTask
SelfModel
MnemonicState
SkillUtility
```

Profile 与核心层相互分离，因为 KIP 允许存在其他认知分类体系。

应当独立发布机器可读的模式包，例如：

```text
kip://profiles/cognitive-memory@2.0.0
```

Profile 定义了可移植的结构与不变式。它不强制规定形成频率、排序公式、遗忘阈值、技能编译算法或反思调度。那些属于记忆大脑策略。

## E.4 记忆大脑架构 (Brain Architecture)

```text
brain/ExperienceLearningArchitecture.md
```

本文档定义了基于 KIP 的记忆大脑如何将：

```text
观察 (Observation)
→ 证据 (Evidence)
→ 断言 (Assertion)
→ 事件 / 经验 (Event / Experience)
→ 语义 / 程序性巩固 (semantic / procedural consolidation)
→ 知识 / 技能 (Knowledge / Skill)
→ 召回 (Recall)
→ 未来行动 (Future Action)
→ 新的结果 (new Outcome)
```

转化为学习闭环。它属于智能体认知架构，而非 KIP 传输协议规范要求。

## E.5 记忆大脑运行时策略 (Brain Runtime Policies)

```text
brain/BrainFormation.md
brain/BrainRecall.md
brain/BrainMaintenance.md
```

这些文档定义了协议之上的 Anda 记忆大脑参考行为：

```text
业务 / 任务智能体 (Business / Task Agent)
        │
        ▼
   Anda 记忆大脑 (Anda Brain)
形成 / 召回 / 维护 (Formation / Recall / Maintenance)
        │
        ▼
      KIP 2.0
        │
        ▼
 认知中枢 (Cognitive Nexus)
```

它们必须 (MUST) 遵循 KIP 边界：

```text
经认证的调用主体 (Principal) ≠ 语义行动主体 (Actor)
命题存在 ≠ 已接受的信念
断言置信度 ≠ 来源信任度
置信度 ≠ 记忆强度 (memory_strength)
SEARCH 相关性 ≠ 认识论支持
记录用户的陈述 ≠ 冒充用户
语义认知 ≠ 治理权威
技能内容 ≠ 可执行权限
```

## E.6 迁移 (Migration)

```text
migration/KIP-2.0-Migration-from-1.x.md
```

规范定义了规范性迁移不变式。迁移指南为真实的 KIP 1.x 部署定义了操作路径：资产盘点、分类、模式迁移、标识映射、命题 → 命题 + 断言、元数据分解、Profile 迁移、治理迁移、预览、切换、验证与回滚策略。

该指南严禁凭空捏造比遗留图谱实际存储的更强的来源溯源或认识论确定性。

## E.7 机器可读协议制品 (Machine-Readable Protocol Artifacts)

### 请求 / 响应 (Request / Response)

```text
kip-request.schema.json
kip-response.schema.json
```

### 形式文法 (Formal Grammars)

```text
KIP-2.0-KQL.ebnf
KIP-2.0-KML.ebnf
KIP-2.0-META.ebnf
```

### 一致性 (Conformance)

```text
KIP-2.0-Conformance-Tests.md
conformance-test-vector.schema.json
conformance-report.schema.json
```

### 规范一致性固件 (Canonical Conformance Fixtures)

```text
test-core-domain-1.0.0.schema.json
test-secondary-1.0.0.schema.json
epistemic-test-deterministic.json
```

机器可读制品使叙述性规范具备可执行性并能够进行独立测试。

## E.8 推荐代码仓布局 (Recommended Repository Shape)

```text
KIP/
├── KIP-2.0-SPECIFICATION.md
├── KIP-2.0-Architecture.md
├── KIPSyntax.md
├── design/
│   ├── KIP-2.0-Core-Data-Model.md
│   ├── KIP-2.0-Epistemic-Model.md
│   ├── KIP-2.0-Governance.md
│   ├── KIP-2.0-Schema-Packages.md
│   ├── KIP-2.0-Transactions.md
│   ├── KIP-2.0-Capsule.md
│   ├── KIP-2.0-KQL.md
│   ├── KIP-2.0-KML.md
│   ├── KIP-2.0-META.md
│   └── KIP-2.0-Protocol-Runtime.md
├── migration/
│   └── KIP-2.0-Migration-from-1.x.md
├── profiles/
│   ├── CognitiveMemoryProfile-2.0.md
│   └── cognitive-memory-2.0.0.schema.json
├── brain/
│   ├── ExperienceLearningArchitecture.md
│   ├── BrainFormation.md
│   ├── BrainRecall.md
│   └── BrainMaintenance.md
├── grammar/
│   ├── KIP-2.0-KQL.ebnf
│   ├── KIP-2.0-KML.ebnf
│   └── KIP-2.0-META.ebnf
├── schemas/
│   ├── kip-request.schema.json
│   └── kip-response.schema.json
└── conformance/
    ├── KIP-2.0-Conformance-Tests.md
    ├── conformance-test-vector.schema.json
    ├── conformance-report.schema.json
    └── fixtures/
```

物理代码仓路径可以不同；分层结构不应改变。

## E.9 依赖方向 (Dependency Direction)

```text
KIP 核心层 / 运行时 (KIP Core / Runtime)
        ↑
认知记忆 Profile (Cognitive Memory Profile)
        ↑
经验学习架构 (Experience Learning Architecture)
        ↑
形成 / 召回 / 维护 (Formation / Recall / Maintenance)
```

下层严禁 (MUST NOT) 依赖上层的策略。

```text
KIP 核心层
    严禁 (MUST NOT) 要求绑定 Anda 记忆大脑。

认知记忆 Profile
    严禁 (MUST NOT) 强制规定单一的形成算法。

经验学习架构
    严禁 (MUST NOT) 重新定义 KIP 核心层语义。

记忆大脑策略
    严禁 (MUST NOT) 绕过治理层或凭空捏造协议权威。
```

## E.10 当前完成状态 (Current Completion State)

最初的架构设计文档编写于具体的核心数据模型、认识模型、治理模型、模式包、事务、胶囊、KQL/KML/META、协议运行时、统合规范、形式化 EBNF 和一致性制品存在之前。这些层级现已全部就绪，机器可读的认知记忆 Profile 包、规范一致性测试固件、面向 LLM 的语法速查手册以及 KIP 1.x 操作性迁移指南亦已发布。

后续工作主要集中在：

```text
1. 将一致性设计测试向量转化为可执行的 CI 测试固件；
2. 通过独立实现扩充互操作性证据；
3. 使参考记忆大脑策略持续跟进 Profile 与规范的修订。
```

KIP 2.0 现应当通过收紧这些契约来演进，而非无节制地扩充核心层。
