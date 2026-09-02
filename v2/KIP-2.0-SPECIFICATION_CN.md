# KIP 2.0 协议规范 (Specification)

**[English](./KIP-2.0-SPECIFICATION.md) | [中文](./KIP-2.0-SPECIFICATION_CN.md)**

## 规范状态 (Status)

**规范性草案 / 协议统一候选版 (Normative Draft / Protocol Consolidation Candidate)**

版本：**2.0-draft**

本文档是 KIP 2.0 协议设计的**规范性统合定义**。

以下 KIP 2.0 设计文档作为参考性说明与设计依据。十篇 `design/` 目录下的设计文档自 2026-09-02 起**正式冻结**：它们属于规范统合前的参考草案，不再进行维护更新，对应的中文镜像文档亦不再保持同步；凡与本规范存在差异之处，均以本规范为准。

- `KIP-2.0-Architecture.md`
- `design/KIP-2.0-Core-Data-Model.md`
- `design/KIP-2.0-Epistemic-Model.md`
- `design/KIP-2.0-Governance.md`
- `design/KIP-2.0-Schema-Packages.md`
- `design/KIP-2.0-Transactions.md`
- `design/KIP-2.0-Capsule.md`
- `design/KIP-2.0-KQL.md`
- `design/KIP-2.0-KML.md`
- `design/KIP-2.0-META.md`
- `design/KIP-2.0-Protocol-Runtime.md`

以下工件是本规范的规范性伴随文档与配套件：

- `grammar/KIP-2.0-KQL.ebnf`、`grammar/KIP-2.0-KML.ebnf`、`grammar/KIP-2.0-META.ebnf` —— 规范性语法定义
- `schemas/kip-request.schema.json`、`schemas/kip-response.schema.json`、`schemas/kip-change-envelope.schema.json` —— 规范性传输层信封结构
- `profiles/cognitive-memory-2.0.0.schema.json` 与 `profiles/CognitiveMemoryProfile-2.0.md` —— 标准认知记忆 Profile 包
- `conformance/KIP-2.0-Conformance-Tests.md`、`conformance/conformance-test-vector.schema.json`、`conformance/conformance-report.schema.json`、`conformance/conformance-state-fixture.schema.json`、`conformance/conformance-governance-policy.schema.json` 与 `conformance/fixtures/` —— 一致性测试套件
- `KIP-2.0-Capsule-Specification_CN.md` —— 本规范的 §37–§41 与 §95，即认知胶囊（Cognitive Capsule），以相同的章节编号独立成伴随规范维护
- `KIP-2.0-Optional-Profiles-and-Migration_CN.md` —— 本规范的 §100、§101、§103 及附录 I：可选的历史一致性与高保障一致性 Profile，以及 KIP 1.x 迁移指南
- `KIP-2.0-Invariants_CN.md` —— 不变量统一注册表：涵盖 §102 的 38 条 Core 核心不变量（Part A）与认知记忆 Profile 的 35 条不变量（Part B）

`KIPSyntax_CN.md` 是面向 LLM 的参考性语法速查卡，不属于规范性工件。

若本规范与早期的 KIP 2.0 设计文档发生冲突，**以本规范为准**。

KIP 1.x 仅作为兼容与迁移参考来源，不构成 KIP 2.0 语义的规范性定义。

---

# 0. 规范性用词 (Normative Language)

关键词 **必须 (MUST)**、**严禁 (MUST NOT)**、**必需 (REQUIRED)**、**应当 (SHALL)**、**不得 (SHALL NOT)**、**应当 (SHOULD)**、**不应当 (SHOULD NOT)**、**推荐 (RECOMMENDED)**、**不推荐 (NOT RECOMMENDED)**、**可以 (MAY)** 和 **可选 (OPTIONAL)** 均按照规范性要求等级进行解释。

除非另有明确声明，使用这些术语表述的协议不变式均为规范性约束。

示例、设计依据、解释性图表以及非规范性实现说明不得推翻规范性要求。

---

# 1. 引言 (Introduction)

KIP —— **知识交互协议 (Knowledge Interaction Protocol)** —— 是智能体 (Agent) 与持久化**认知中枢 (Cognitive Nexus)** 之间进行交互的协议。

KIP 2.0 将 KIP 从一个持久化知识图谱协议泛化为**面向智能体记忆大脑的认知状态协议 (Cognitive State Protocol for Agent Memory Brains)**。

一个 KIP 2.0 认知中枢能够持久化并暴露：

```text
semantic entities              (语义实体)
truth-neutral propositions     (真值中立命题)
attributed assertions          (归属断言)
evidence                       (证据)
provenance activities          (溯源活动)
experiences                    (经验)
skills                         (技能)
profile-specific memory state  (Profile 特定记忆状态)
governed access/control state  (受治理的访问/控制状态)
transaction history            (事务历史)
portable cognitive artifacts   (可移植认知构件)
```

本协议是**模型优先 (Model-First)** 的：其语言与运行时专为基于大语言模型 (LLM) 的智能体进行可靠生成与消费而设计，同时保持足够的确定性以支持可互操作的系统实现。

KIP 2.0 将三个根本问题彻底解耦：

```text
Meaning (含义)
    可以表达什么？

Belief (信念)
    大脑当前应当将什么视为认识上被接受的事实？

Authority (权威/权限)
    谁可以读取、写入、投影、共享、执行或提升认知？
```

严禁将这些维度混为一谈。

---

# 2. 核心原则 (Core Principles)

## 2.1 命题存在不代表为真 (Proposition existence does not imply truth)

存储的命题 (Proposition) 代表一个真值中立的语义陈述。

```text
命题存在 (Proposition exists)
    ≠
命题为真 (Proposition is true)
    ≠
大脑接受该命题 (Brain accepts Proposition)
```

被接受的信念必须通过**认识论投影 (Epistemic Projection)** 衍生得出。

---

## 2.2 断言承载认识承诺 (Assertions carry epistemic commitment)

断言 (Assertion) 记录了一个语义行动主体对某个命题所采取的立场。

承载以下属性的是断言而非命题：

```text
asserted_by (断言主体)
stance (立场)
mode (模式)
confidence (置信度)
asserted_at (断言时间)
valid_time (世界有效时间)
Evidence citations (证据引用)
epistemic lifecycle (认识生命周期)
```

---

## 2.3 矛盾是可表达的状态 (Contradiction is representable state)

冲突的断言**必须**允许并存。

认知中枢**严禁**将矛盾本身视为数据损坏。

---

## 2.4 溯源不等于权限 (Provenance is not authority)

密码学来源、声称的溯源、源身份、证据血统与治理权限彼此各不相同。

```text
有效签名 (valid signature)
    ≠
真实性 (truth)
    ≠
信任 (trust)
    ≠
行动权限 (action authority)
```

---

## 2.5 引擎来源与声称溯源互不相同 (Engine origin and claimed provenance are different)

作者自行编写的来源声称**严禁**覆盖或伪装为引擎认证的来源。

引擎来源属于受保护的系统状态。

---

## 2.6 身份不等于显示名称 (Identity is not a display name)

`name` 与别名属于接地 (grounding) 状态。

**严禁**将它们视为通用唯一身份标识。

---

## 2.7 领域不等于空间 (Domain is not Space)

语义领域/主题 (Domain/topic) 并非治理边界。

**记忆空间 (MemorySpace)** 才是主要的归属权、隔离、策略以及事务排序边界。

---

## 2.8 置信度不等于记忆可提取性 (Confidence is not memory accessibility)

以下信号彼此正交：

```text
Assertion confidence (断言置信度)
source trust (源信任度)
memory_strength (记忆强度)
salience (显著性)
utility (效用度)
validity/currentness (有效性/时效性)
```

运行时**严禁**静默地将其中一种信号替代为另一种信号。

---

## 2.9 存在多个时钟维度 (Multiple clocks exist)

KIP 2.0 至少区分以下时钟：

```text
world valid time (世界有效时间)
observation time (观测时间)
assertion time (断言时间)
engine transaction time (引擎事务时间)
```

历史认知与对历史事实的当前重构**必须**保持可区分。

---

## 2.10 检索相关性不等于信念 (Search relevance is not belief)

SEARCH 检索的相关性**严禁**被解释为：

```text
真值概率 (truth probability)
断言置信度 (Assertion confidence)
源信任度 (source trust)
认识论投影状态 (Epistemic Projection status)
```

---

## 2.11 外部认知不得自行提升权限 (External cognition cannot self-escalate authority)

导入或衍生的内容**严禁**自行赋予更强的治理权限。

---

## 2.12 留存的历史原始记录必须保持可重构 (Raw history must remain reconstructable where retained)

在留存期内，纠错、修订、合并与固化**应当**保留历史含义，而非重写过去。

在隐私/法律合规要求下，物理清除 (purge)**可以**移除历史字节。

---

## 2.13 读取不代表学习 (Read does not imply learning)

读取/查询操作**严禁**自动增加作为认知状态的：

```text
置信度 (confidence)
记忆强度 (memory_strength)
佐证 (corroboration)
证据计数 (Evidence count)
```

学习/强化必须通过显式的认知变更进行。

---

## 2.14 模型优先的人机工效是协议约束 (Model-first ergonomics are a protocol constraint)

KIP **应当**保持足够的紧凑性、声明性与结构规律性，以便大模型可靠生成。

语法糖**可以**存在，但**必须**能够脱糖为相同的规范性语义。

---

# 3. 协议架构 (Protocol Architecture)

KIP 2.0 包含以下概念分层：

```text
┌──────────────────────────────────────────────┐
│ Agent / Brain (智能体 / 记忆大脑)             │
├──────────────────────────────────────────────┤
│ KQL    Cognitive Query Language (认知查询语言)│
│ KML    Cognitive Mutation Language (认知变更) │
│ META   Introspection / Grounding / Verify    │
├──────────────────────────────────────────────┤
│ Epistemic Projection (认识论投影)            │
│ Cognitive Profiles (认知 Profiles)           │
├──────────────────────────────────────────────┤
│ Semantic / Epistemic / Mnemonic State        │
│ (语义 / 认识 / 记忆状态)                      │
├──────────────────────────────────────────────┤
│ Governance Control Plane (治理控制平面)       │
├──────────────────────────────────────────────┤
│ Schema Packages (模式包)                     │
├──────────────────────────────────────────────┤
│ Transaction Runtime / Commit History (事务)  │
├──────────────────────────────────────────────┤
│ Protocol Runtime / Wire Contract (协议运行时) │
├──────────────────────────────────────────────┤
│ Storage / Index / Execution Implementation   │
│ (底层存储 / 索引 / 执行实现)                  │
└──────────────────────────────────────────────┘
```

KIP 不强制规定具体的数据库架构。

系统实现**可以**使用：

```text
图数据库 (graph database)
关系数据库 (relational database)
文档存储 (document store)
嵌入式存储 (embedded store)
分布式状态机 (distributed state machine)
容器/罐式存储 (canister storage)
混合索引 (hybrid indexes)
```

前提是可观测的 KIP 语义符合规范要求。

---

# 4. 基础定义 (Foundational Definitions)

## 4.1 认知中枢 (Cognitive Nexus)

**认知中枢 (Cognitive Nexus)** 是智能体通过 KIP 与之交互的持久化、受治理的状态环境。

一个认知中枢包含一个或多个记忆空间 (MemorySpace)。

---

## 4.2 认知状态 (Cognitive State)

**认知状态 (Cognitive State)** 是可能参与智能体未来计算的持久化外部状态。

它包括语义与认识记录、记忆/Profile 状态以及相关的溯源信息。

---

## 4.3 知识 (Knowledge)

KIP 采用如下工作定义：

> **知识是经验的压缩规律 (Knowledge is compressed regularity of experience)。**

KIP 不要求每一个存储的命题都必须具备被接受为知识的资格。

---

## 4.4 记忆 (Memory)

> **记忆是使过往参与未来计算的机制 (Memory is the mechanism by which the past participates in future computation)。**

仅靠持久化存储本身不足以保证功能性记忆的实现。

---

## 4.5 经验 (Experience)

**经验 (Experience)** 是一个情境化轨迹，描述了主体在特定状态、行动、观测、反馈与结果中追求某个目标的过程。

认知记忆 Profile **可以**将经验近似表示为：

```text
E = (g, b0, a0, o1, b1, a1, o2, ..., y, δ)
```

KIP Core 不要求存储私有的思维链 (chain-of-thought)。

---

## 4.6 技能 (Skill)

**技能 (Skill)** 是可复用的过程性认知，通常通过将经验编译为策略/程序而形成。

技能的描述性效用与治理权限**必须**保持分离。

技能的生命周期地位由已评定的结果证据（§15.7）所挣得，绝不能由其作者自行断言；生命周期机制本身归属于 Profile 层。

---

## 4.7 学习 (Learning)

**学习 (Learning)** 是由经验或其他认知输入引起的、在未来行为中表现出的持久且契合情境的改变。

KIP 变更操作可以实现非参数化认知适应，但其本身并不等同于行为层面的学习证明。

---

# 5. 记忆空间 (MemorySpace)

## 5.1 定义 (Definition)

**记忆空间 (MemorySpace)** 是 KIP 最主要的治理、身份标识、隔离、Schema 以及事务排序边界。

示例：

```text
personal://yan
org://alink
project://kip
```

---

## 5.2 单一归属空间 (One home Space)

每个持久化认知元素**必须**拥有且仅拥有一个归属记忆空间。

---

## 5.3 同空间闭包 (Same-Space closure)

基线核心结构/本地引用**必须**在同一个记忆空间内部解析，除非使用了显式支持的跨空间引用 (Foreign Space Reference)。

**严禁**隐式遍历跨空间引用。

---

## 5.4 空间序列号 (Space sequence)

一个记忆空间内每次导致状态变更的已提交事务，都会被赋予一个单调递增的序列号：

```text
space_seq
```

序列号为 `k` 之后的空间状态可表示为：

```text
S(k)
```

---

## 5.5 空间不得从对话上下文中推断 (Space is not inferred from conversation context)

运行时**严禁**因为以下因素静默切换记忆空间：

```text
主题 (topic)
对话对手方 (counterparty)
语义行动主体 (semantic actor)
胶囊来源 (Capsule source)
外部概念 (foreign Concept)
```

记忆空间必须通过执行上下文显式或安全地解析。

---

## 5.6 空间自身身份 (Space self identity)

一个记忆空间**可以**指定至多一个**自身身份 (self identity)**：即指向该空间视为其语义 `$self` 的概念引用（通常为 Person/Agent 概念）。

该指定属于受保护的空间/治理配置状态：

```text
它不是普通的认知内容
普通的 KML 严禁创建或修改它
修改它需要受保护的治理操作
```

`$self` 是文档层面的概念名称，并非 KIP 的字面语法。智能体通过 `DESCRIBE PRIMER` / 执行上下文 (§64.2) 获取被指定为自身概念的确切引用。

所有关于来源/目标 `$self` 的胶囊规则 (§38.4, §38.5) 均指此指定的自身身份。未指定自身身份的记忆空间没有供这些规则映射的 `$self`。

---

# 6. 核心数据模型 (Core Data Model)

## 6.1 核心元素类型 (Core element kinds)

KIP 2.0 定义了以下核心认知元素类型：

```text
Concept (概念)
Proposition (命题)
Assertion (断言)
Evidence (证据)
Activity (活动)
```

`MemorySpace` 是治理容器，而非普通的认知元素。

Profile 对象（例如）：

```text
Experience (经验)
ExperienceStep (经验步骤)
Skill (技能)
Preference (偏好)
Commitment (承诺)
Insight (洞察)
SelfModel (自我模型)
Watch (守望)
WorkingState (工作状态)
```

**应当**表示为带类型的概念加上经过校验的切面 (Facet) 或结构引用 (Structural Reference)，除非未来的核心规范版本显式将其提升为核心元素。

---

## 6.2 通用认知元素外壳 (Common Cognitive Element envelope)

持久化认知元素具备如下概念形态：

```json
{
  "id": "opaque-local-id",
  "kind": "concept|proposition|assertion|evidence|activity",
  "space_id": "space-id",

  "governance": {
    "classification": "policy-defined",
    "policy_ref": "optional"
  },

  "retention": {
    "retention_class": "standard",
    "expires_at": null,
    "legal_hold": false
  },

  "facets": {},

  "_system": {
    "version": 1,
    "plane_versions": {
      "attributes": 1,
      "structural": 1,
      "retention": 1,
      "facets": {}
    },
    "created_at": "...",
    "updated_at": "...",
    "created_tx": "...",
    "updated_tx": "...",
    "state": "active",

    "origin": {
      "principal_id": "...",
      "channel": "...",
      "import_id": null
    }
  }
}
```

具体的物理存储表示形式由系统实现决定。

---

## 6.3 `_system`

`_system` 由引擎负责维护。

普通的 KML **严禁**直接写入：

```text
version
plane_versions
created_at
updated_at
created_tx
updated_tx
state
origin
space_seq
```

`version` 在每次对元素提交变更时递增。`plane_versions` 则为每个**版本平面 (version plane)** 维护一个独立计数器 —— `attributes`（字段与属性）、`structural`（结构引用）、`retention`（留存记录）以及 `facets`（每个 Facet 符号对应一个计数器）—— 且每个计数器仅在该平面发生变更时才递增。`EXPECT VERSION ... OF <plane>`（§35.1）守卫单一平面，因此对一个平面的并发写入不会破坏对另一个平面的乐观锁判定。

---

## 6.4 移除通用元数据黑盒 (Generic metadata bag removed)

KIP 2.0 不再提供规范性的通用作者可写 `metadata` 黑盒。

数据**必须**放置在适当的语义平面中：

```text
语义载荷 (semantic payload)        → 类型化字段 / 属性 (typed fields / attributes)
认识状态 (epistemic state)         → 断言 (Assertion)
证据 (Evidence)                    → 证据 (Evidence)
溯源 (provenance)                  → 活动 / 来源 (Activity / origin)
治理 (governance)                  → 治理状态 (Governance state)
存储生命周期 (storage lifecycle)   → 留存 (retention)
记忆/Profile状态 (mnemonic state)  → 切面 (Facets)
引擎事实 (engine truth)            → _system
```

兼容层**可以**将未映射的 KIP 1 元数据保留在带命名空间的遗留切面中，但**严禁**利用该机制绕过受保护的协议语义。

---
# 7. 标识符 (Identifiers)

## 7.1 本地标识符 `id` (Local `id`)

每个持久化认知元素都拥有一个不可变的认知中枢本地 `id`。

规范要求：

```text
在认知中枢实现范围内唯一 (unique within the Nexus implementation scope)
对客户端不透明 (opaque to clients)
绝不复用于其他元素 (never reused for another element)
新元素由引擎统一分配 (engine-assigned for new elements)
```

---

## 7.2 名称 `name`

`name` 是可变的接地/显示状态。

允许存在重复的名称。

- 它**可以**随时间变更。
- 它在 Space 内部**无需**唯一。
- 它**严禁**被当作稳定的身份标识使用。
- 两个共享相同名称的 Concept 绝不会被引擎自动合并（§11.2, §38.3）。

---

## 7.3 键 `key`

一个概念**可以**拥有一个不可变的空间本地逻辑键 `key`。

`key` **必须**在以下作用域内唯一：

```text
(space_id, lineage of schema_ref, key)
```

该作用域是概念类型的**符号谱系 (lineage)**（§20.14），而非单一特定的精确包版本：在 `Person@1.0.0` 下以 `"alice"` 为键的概念，与包升级到 `1.1.0` 后对键为 `"alice"` 的 `Person` 执行的 upsert，寻址的是**同一个身份**，因此包升级绝不会凭空创建出第二个 `"alice"`。

因此 `key` 是其概念类型*之内*的身份标识，而非跨类型的身份标识：一个 `Person` 与一个 `Preference` 可以同时以 `"alice"` 为键，它们是两个不同的身份。正是这一点，使得以 `(type, name)` 作为身份标识的 1.x 数据库能够把这些名称迁移为键，而不会合并本不相干的概念。

仅指定 `key` 而未指定类型的选择器**可能**匹配到多个概念。运行时**严禁**通过从中挑选一个来解析此类选择器，而应报告 `IdentityConflict`。挑选行为正是 §7.2 针对名称所禁止的"任意挑选赢家"，只不过换成了经由 `key` 发生。

`key` 适用于：

```text
面向模型的幂等身份标识 (idempotent model-facing identity)
稳定的应用程序身份标识 (stable application identity)
从遗留名称身份标识迁移 (migration from legacy name identity)
```

---

## 7.4 规范身份标识 `canonical_id`

一个概念**可以**拥有一个高保证的跨系统规范标识符 `canonical_id`。

设置/修改规范身份标识**必须**遵循比普通属性更严格的身份/治理策略。

未经核实的外部身份声明**应当**表示为“命题 + 断言”；认知记忆 Profile 正为此目的提供了 `same_as` 谓词，用于驱动人工/算法身份审查而非自动合并。

---

## 7.5 客户端键 `client_key`

在历史上相互独立的创建操作**可以**携带一个持久化的客户端逻辑键，以实现重试安全的创建。

示例：

```text
message:42:evidence
tool-run:991:assertion
experience:turn:100
```

`client_key` 与概念的 `key` 互不相同。

---

# 8. 引用 (References)

## 8.1 本地元素引用 (Local Element Reference)

基线引用是指向持久化元素 ID 的同空间引用。

---

## 8.2 规范身份引用 (Canonical Identity Reference)

系统实现**可以**暴露通过校验后的 `canonical_id` 进行引用的能力。

引用解析**必须**遵循治理与身份策略。

---

## 8.3 外部空间引用 (Foreign Space Reference)

跨空间引用属于可选的扩展能力。

它们**必须**是显式的，且**严禁**：

```text
赋予读取权限 (grant read authority)
赋予变更权限 (grant mutation authority)
触发自动遍历 (trigger automatic traversal)
触发自动导入 (trigger automatic import)
```

---

## 8.4 字面量 (Literal)

命题的宾语 (object)**可以**是字面量。

命题的主语 (subject)**严禁**是字面量。

---

# 9. 字面量模型 (Literal Model)

## 9.1 逻辑形态 (Logical shape)

规范字面量在概念上可表示为：

```json
{
  "value": "...",
  "datatype": "string",
  "language": null
}
```

**可以**支持原始 JSON 标量简写形式。

---

## 9.2 基线标量类型 (Baseline scalar types)

```text
string (字符串)
number (数值)
boolean (布尔值)
null (空值)
```

数组和任意嵌套对象不是基线核心字面量。

结构化数据**应当**使用概念或模式/Profile 定义的值对象 (value objects)。

---

## 9.3 数值规则 (Numeric rules)

仅有限数值有效。

**必须**拒绝：

```text
NaN
Infinity
-Infinity
```

---

## 9.4 语言标签 (Language tag)

语言标签一旦存在，即参与字面量的身份识别与等价性判断。

---

## 9.5 `null`

仅当谓词 Schema 明确允许时，`null` 方可作为语义字面量使用。

对于未知状态，通常**应当**通过缺省/不确定性来表达，而非凭空捏造一个 `null` 事实。

---

# 10. 概念 (Concept)

## 10.1 定义 (Definition)

**概念 (Concept)** 是可被引用的认知实体或类型化认知对象。

概念的存在本身并不证明其在现实世界中的指示对象真实存在。

---

## 10.2 概念形态 (Concept shape)

概念特定字段可包括：

```json
{
  "schema_ref": "kip://...@2.0.0/Person",
  "key": "alice",
  "name": "Alice",
  "canonical_id": null,
  "aliases": [],
  "attributes": {}
}
```

外加通用外壳字段。

---

## 10.3 `schema_ref`

每个概念**必须**通过一个指向确切 Schema 符号标识的 `schema_ref` 来标明其概念类型，
且该 `schema_ref` **必须**能在该空间的 Schema 环境中解析到一个概念类型定义。

不存在"无类型概念"。`schema_ref` 在创建时即固定，因此若运行时铸造出一个不带类型的
概念，那将是一个后续任何写入都无法修复、任何 `{type: …}` 模式都永远匹配不到的元素。

元素依照 `schema_ref` 中的精确版本进行校验。模式匹配与身份判定则使用该符号的谱系（lineage，§20.14），因此在所属模式包升级后，元素依然能通过其本地类型名正常访问。将元素迁移至其谱系下的另一个版本属于 `manage_schema`（§20.10）管辖的模式迁移操作，绝不能通过普通 KML 执行。

---

## 10.4 属性 (Attributes)

概念属性**应当**包含：

```text
显示/配置状态 (display/configuration state)
本地结构化状态 (local structured state)
操作/Profile 取值 (operational/profile values)
```

前提是这些数据不需要独立的认识生命周期。

---

## 10.5 属性提升规则 (Attribute escalation rule)

若某个取值需要独立的：

```text
来源 (source)
置信度 (confidence)
矛盾 (contradiction)
有效时间 (valid time)
撤回 (retraction)
证据 (evidence)
共享 (sharing)
历史 (history)
```

则**应当**将其提升为：

```text
命题 + 断言 (Proposition + Assertion)
```

而非保留为可变属性。

---

# 11. 概念合并 (Concept Merge)

## 11.1 非破坏性合并 (Non-destructive merge)

身份整合**严禁**重写所有历史引用。

若概念 `A` 被合并到概念 `B`：

```text
A 保持可寻址 (A remains addressable)
A 状态变为已合并 (A becomes merged)
A.merged_into = B
未来的规范解析为 A → B (future canonical resolution A → B)
```

合并**严禁**在 `merged_into` 中制造环：若合并目标（经传递解析）已解析回合并源，运行时**必须**拒绝该次合并。这保证规范解析（沿 `merged_into` 追溯至不动点）必然终止。

---

## 11.2 原始历史引用 (Raw historical references)

引用了 `A` 的历史命题在原始历史中**可以**继续引用 `A`。

---

## 11.3 新写入操作 (New writes)

普通的新写入操作**应当**将已合并的引用规范化指向 `B`。

---

## 11.4 合并后的命题冲突 (Proposition collision after merge)

若合并后多个命题规范化为同一个元组，运行时**可以**整合规范语义解析，同时保留：

```text
原始命题 ID (original Proposition IDs)
断言引用 (Assertion references)
原始溯源信息 (raw provenance)
历史可查询性 (historical queryability)
```

---

# 12. 命题 (Proposition)

## 12.1 定义 (Definition)

**命题 (Proposition)** 是一个不可变、真值中立的语义陈述：

```text
(subject, predicate_ref, object)
```

---

## 12.2 结构形态 (Shape)

```json
{
  "subject": {"id": "C-1"},
  "predicate_ref": "kip://...@1.0.0/timezone",
  "object": "+08:00"
}
```

外加依然适用的通用外壳字段。

---

## 12.3 结构身份标识 (Structural identity)

在同一个记忆空间内，规范命题的身份由其规范元组决定：

```text
规范主语 (canonical subject)
谓词谱系 (predicate lineage, §20.14)
规范宾语 (canonical object)
```

*规范 (Canonical)* 意味着合并解析之后：若端点的 `merged_into` 链（§11.4, §61）最终指向 B，则其规范端点就是 B。元组按写入的原样物理存储，绝不会因合并而被改写；规范化解析仅在身份比较与模式匹配时动态应用（§43.2）。存储的 `predicate_ref` 是命题创建时解析出的精确引用；身份比较时则比较其谱系。因此，在同一模式包的较新版本下执行 `ENSURE PROPOSITION` 将解析为现有的命题，而不会铸造出一个平行的副本；无论槽位内的命题最初是在哪个版本下创建的，`BELIEF SLOT` 都能看到该槽位内的全部 Assertion。

---

## 12.4 唯一性 (Uniqueness)

一个空间**应当**为每个语义元组维护至多一个规范的活动命题。

并发创建**必须**确定性地解析为单一规范语义标识。

---

## 12.5 不可变性 (Immutability)

创建之后，元组**严禁**被修改。

更改：

```text
subject (主语)
predicate (谓词)
object (宾语)
```

将创建/解析为另一个命题。

---

## 12.6 无原生认识字段 (No epistemic fields)

命题原生**严禁**承载：

```text
confidence (置信度)
asserted_by (断言主体)
source (来源)
observed_at (观测时间)
valid time (有效时间)
stance (立场)
retraction (撤回)
```

---

## 12.7 否定立场与布尔假的区别 (Negative stance vs boolean false)

以下两者在概念上截然不同：

```text
对命题 P 的断言立场 stance = reject

命题的宾语 object = false
```

Schema **可以**将布尔候选值关联为互斥关系，但核心层**必须**保持这种结构上的区分。

---

# 13. 断言 (Assertion)

## 13.1 定义 (Definition)

**断言 (Assertion)** 是对恰好一个命题在历史上可归属的认识承诺。

---

## 13.2 概念形态 (Conceptual shape)

```json
{
  "proposition": {"id": "P-1"},
  "asserted_by": {"id": "C-actor"},

  "stance": "support",
  "mode": "stated",
  "confidence": 0.9,

  "asserted_at": "...",

  "valid_time": {
    "from": "...",
    "until": null
  },

  "evidence": [
    {
      "id": "E-1",
      "role": "support"
    }
  ],

  "context_refs": [],

  "lifecycle": {
    "status": "active",
    "supersedes": [],
    "superseded_by": [],
    "retracted_at": null
  }
}
```

外加通用外壳字段。

---

## 13.3 `asserted_by` (断言主体)

`asserted_by` 是语义行动主体。

它不同于：

```text
_system.origin.principal_id
```

后者用于标识经过身份认证的执行调用主体。

---

## 13.4 立场 (Stance)

基线立场包括：

```text
support (支持)
reject (拒绝/反对)
uncertain (不确定)
```

---

## 13.5 模式 (Mode)

基线模式包括：

```text
observed (观测所得)
stated (他人陈述/口述)
inferred (推理所得)
predicted (预测得出)
hypothetical (假设/设想)
imported (外部导入)
```

模式本身不会自动赋予信任度。

---

## 13.6 置信度 (Confidence)

`confidence` 是可选的；当存在时，其取值范围在 `[0,1]` 之间。

其语义为：

> 该断言对其自身立场的主张力度有多强。

**严禁**将其解释为：

```text
源信任度 (source trust)
大脑信念概率 (Brain belief probability)
记忆强度 (memory strength)
显著性 (salience)
效用度 (utility)
```

缺少置信度并不等同于 `0`、`0.5` 或不可信。

---

## 13.7 不可变的断言载荷 (Immutable assertion payload)

创建之后，历史认识载荷**应当**保持不可变，包括：

```text
proposition (命题)
asserted_by (断言主体)
stance (立场)
mode (模式)
confidence (置信度)
asserted_at (断言时间)
valid_time (有效时间)
initial Evidence citations (初始证据引用)
```

---

## 13.8 修订 (Revision)

若认识承诺发生实质性改变，应当创建一个新的断言。

不得直接修改旧断言的置信度/立场/取值来代表当前信念。

---

# 14. 断言生命周期 (Assertion Lifecycle)

基线状态包括：

```text
active (活跃)
retracted (已撤回)
superseded (已废弃替代)
expired (已过期)
```

---

## 14.1 已撤回 (Retracted)

撤回意味着断言者或授权代表撤销了该断言。

若未发生真实的撤销行为，管理审查**严禁**虚假地将断言标记为已撤回。

---

## 14.2 已废弃替代 (Superseded)

替代意味着在兼容的主体/上下文/修订血统中，一个更新的断言取代了较旧的断言。

废弃替代不是普通的分歧争议。

---

## 14.3 已过期 (Expired)

过期表明根据其生命周期模型，该断言不再具备当前有效性/资格。

它与存储留存期以及现实世界的有效时间各不相同。

---

# 15. 证据 (Evidence)

## 15.1 定义 (Definition)

**证据 (Evidence)** 是被断言引用或用于溯源的可寻址认知构件。

---

## 15.2 证据分类体系 (Evidence classes)

推荐的基线类别：

```text
observation (直接观测)
user_statement (用户陈述)
agent_statement (智能体陈述)
tool_result (工具执行结果)
measurement (测量数据)
message (消息通信)
document (文档材料)
web_resource (网络资源)
external_assertion (外部系统断言)
human_feedback (人工反馈)
derived_result (衍生计算结果)
outcome (结果证据)
```

模式/Profile 扩展**可以**添加带命名空间的类别。

---

## 15.3 概念形态 (Conceptual shape)

```json
{
  "evidence_class": "tool_result",

  "payload": {
    "mode": "inline|external",
    "inline": null,
    "content_ref": null
  },

  "content_digest": "sha256:...",
  "media_type": "application/json",
  "observed_at": "...",

  "source": [],
  "generated_by": null,

  "lifecycle": {
    "status": "active",
    "corrects": [],
    "corrected_by": []
  }
}
```

---

## 15.4 证据身份标识 (Evidence identity)

内容摘要 (content digest) 相同并不必然代表属于同一个证据。

对同一构件的两次独立观测可能是两个不同的证据事件。

---

## 15.5 证据不可变性 (Evidence immutability)

原始证据载荷与观测身份**应当**保持不可变。

若证据构件有误，**应当**通过创建新证据并建立修正血统来进行纠错。

不可变性禁止的是把载荷改写成另一个值，而非授权范围内的销毁：载荷清除（§60.6）抹除的是字节本身，证据记录、`content_digest`、引用关系与溯源角色均完整保留。

---

## 15.6 证据角色具有上下文相关性 (Evidence role is contextual)

相对于某个特定断言，证据被引用的角色可以是：

```text
support (支持佐证)
challenge (质疑反驳)
context (背景上下文)
```

---

## 15.7 结果证据 (Outcome Evidence)

**结果证据 (Outcome Evidence)**（`evidence_class: "outcome"`）记录一次决策、行动或程序试用发生之后，现实世界实际产生的客观反馈。它是**后果通道 (consequence channel)**：使后续裁决能够对照被客观记录的现实 —— 而非行动者自身的单方陈述 —— 来评定认知。

结果证据**应当**由仪器化组件写入 —— 遥测、验证器、测试装置、工具，或人工审查者 —— 经由运行时摄取路径（§71.1），使载荷以传输原样进入并保持原样（不变式 33）。

行动者对其**自身行动结果**的陈述**严禁**被记录为 `outcome` 证据。它是 `agent_statement`（或 `user_statement`）：可作为上下文引用，但永远不是被评定的后果本身。对仪器输出进行摘要或重新转述得到的是 `derived_result` 而非 `outcome`，且衍生转换绝不会增加认知独立性（§23.1）。

在开放协议中，这一分离是**可审计的**而非密码学上绝对的。引擎底层起源（§2.5）始终记录写入元素的已认证主体 (Principal)；治理**应当**支持将 `outcome` 类证据的创建限定于指定的仪器化主体；通道的任何消费者 —— 生命周期裁决、信任校准（§22.6）、效用校准 —— **必须**能够追踪其所评定之每个结果的起源链，且**应当**拒绝起源不符合其策略的结果。

每项结果证据**应当**携带一个**任务族 (task family)**：即其所属的带命名空间的可比后果流（例如 `"deploy/rollback"`、`"outreach/reply"`）。被评定的认知通过携带相同的任务族名称来订阅对应的数据流，因此仪器无需预先知晓哪些模式规则会消费其写入的数据。认知记忆 Profile（Cognitive Memory Profile）定义了标准的 `OutcomeRecord` 切面（任务族、结果状态、影响幅度）以及消费该通道的技能生命周期机制。

任务族用于寻找可比后果；它**绝不直接归因**后果。一项用于对具体决策 —— 应用的某项技能、做出的网关裁决 —— 进行打分的结果，**必须**在溯源上显式链接到该决策：记录该观测的活动（Profile 中的 `outcome_observation`）将其决策活动列入 `inputs`，并将结果证据列入 `outputs`。打分消费者仅能通过该链接将结果计入技能评分。未建立决策链接的结果仅归属于数据流自身，因而仅作为该流的对比基线，不归属于其他任何实体。正是这一点使得比较性裁决完全可复算：处理集是关联的结果，对比基线则是该任务族的其余结果。

写入 `outcome` 类的证据及链接它的观测活动，需要持有 `record_outcome` 权限（§29.8）。

通过数据导入进来的 outcome 携带 `_system.origin.import_id`（§6.2）。它是在其他系统由本地从未授权过的仪器观测到的：它属于可供阅读的普通证据，绝不能作为本地的评定打分，打分消费者**必须**排除此类导入的 outcome（§41.6）。

---

# 16. 活动 (Activity)

## 16.1 定义 (Definition)

**活动 (Activity)** 是一个溯源元素，表示转换、处理、推理、审查、导入、巩固或其他认知/运行时活动。

---

## 16.2 基线类别 (Baseline classes)

示例：

```text
extraction (提取)
tool_execution (工具执行)
human_review (人工审查)
inference (推理衍生)
summarization (摘要归纳)
semantic_consolidation (语义巩固)
procedural_consolidation (程序巩固)
skill_compilation (技能编译)
import (导入)
schema_migration (模式迁移)
entity_merge (实体合并)
experience_formation (经验形成)
belief_revision (信念修订)
```

---

## 16.3 概念形态 (Conceptual shape)

```json
{
  "activity_class": "inference",
  "started_at": "...",
  "ended_at": "...",

  "inputs": [],
  "outputs": [],
  "associated_actors": [],

  "parameters_digest": "sha256:...",
  "status": "completed"
}
```

---

## 16.4 活动不等于事务 (Activity is not Transaction)

活动描述的是处理过程/溯源关系。

事务描述的是原子的持久化状态跃迁。

---

## 16.5 溯源拓扑 (Provenance topology)

KIP **应当**支持概念上等价于如下形式的溯源结构：

```text
input (输入)
  ↓
Activity (活动)
  ↓
output (输出)
```

---

## 16.6 终态活动不可变性 (Terminal activity immutability)

进入终态之后：

```text
completed (已完成)
failed (失败)
cancelled (已取消)
```

活动的骨干溯源拓扑**应当**保持不可变。

后续纠错应当通过创建另一条活动/审计记录来表示。

---

# 17. 结构引用 (Structural References)

## 17.1 定义 (Definition)

**结构引用 (Structural Reference)** 是记录之间的拓扑结构，而非客观世界层面的语义命题。

示例：

```text
Assertion → Evidence (断言 → 证据)
Evidence → Activity (证据 → 活动)
Activity → inputs/outputs (活动 → 输入/输出)
Experience → ExperienceStep (经验 → 经验步骤)
Skill → compiled_from Experience (技能 → 编译自经验)
```

---

## 17.2 核心区别 (Distinction)

```text
(Alice, prefers, DarkMode)
    语义命题 (semantic Proposition)

Experience.has_step → Step
    结构引用 (Structural Reference)
```

运行时**严禁**静默将其中一种转换为另一种。

---

## 17.3 认识论意义 (Epistemic meaning)

结构的存在本身不需要附加断言立场。

若针对某种结构关系本身的陈述需要进行认识论处理，应将其单独建模为语义命题。

当结构关系随后变得具有认识论意义时，不要重写拓扑结构。保留结构引用的同时，添加针对该关系的语义命题 + 断言（即*语义阴影 / semantic shadow*）：结构边保持为记录事实，而语义阴影则承载立场、证据、有效性与可争议性。

---

## 17.4 有序结构引用 (Ordered Structural References)

结构字段**可以**被声明为**有序 (ordered)**。

对于有序字段，引擎针对每个源元素维护该引用的稳定、密集、从零开始的全序：

```text
未指定显式索引添加的引用按变更顺序追加
显式 {index: n} 赋值声明预期的从零开始的位置
单次变更计划中冲突的显式位置必须校验失败
超出当前稠密范围 0..len 的显式 {index: n} 必须校验失败（位置是稠密的；追加即 len）
已提交的顺序必须密集 (0..n-1) 且确定
```

查询将每个引用的当前位置暴露为虚拟字段：

```text
?edge.index
```

绑定在结构模式上 (§43.7)。无序字段不暴露索引。

顺序仅属于记录拓扑：

```text
索引顺序 ≠ 因果关系 (index order ≠ causality)
```

被引用元素之间的因果声明属于语义命题 + 断言（对于 ExperienceStep，参见认知记忆 Profile 的 `caused_by` 谓词）。

---

## 17.5 结构变更 (Structural mutation)

可变概念上的结构引用以 SET/UNSET 成对书写，与属性、切面一致：

```text
SET STRUCTURAL   { (field, target) {options} }    添加一条引用
                                                  （单值基数字段：替换之）
UNSET STRUCTURAL { (field, target) }              移除该条引用
```

移除按单条引用进行。从有序字段移除后，其余顺序重新致密化（§17.4）。基数在提交时校验：移除必填字段的最后一条引用将失败。

记录类元素不受影响。断言、证据与终态活动的拓扑保持不可变（§13.7、§15.5、§16.6）；未终态的活动通过 `TRANSITION ACTIVITY` 敲定其引用（§52.5）。记录上错误的引用以新记录纠正，绝不以移除纠正。

---

# 18. 切面与 Profile (Facets and Profiles)

## 18.1 切面 (Facet)

**切面 (Facet)** 是附加到核心元素上的带命名空间且经过校验的扩展对象。

示例：

```json
{
  "facets": {
    "kip://profiles/cognitive-memory@2.0.0/MnemonicState": {
      "memory_strength": 0.8,
      "salience": 0.9
    }
  }
}
```

---

## 18.2 切面约束 (Facet restrictions)

切面**严禁**绕过核心层的：

```text
不可变性 (immutability)
治理规则 (Governance)
来源记录 (origin)
认识论区分 (epistemic distinctions)
```

---

## 18.3 认知记忆 Profile (Cognitive Memory Profile)

认知记忆 Profile **应当**至少为以下对象定义类型/切面/结构字段：

```text
Event (事件)
Experience (经验)
ExperienceStep (经验步骤)
Preference (偏好)
Insight (洞察)
Commitment (承诺)
Watch (守望)
Skill (技能)
SleepTask (睡眠/固化任务)
SelfModel (自我模型)
WorkingState (工作状态)
MnemonicState (记忆状态)
SkillUtility (技能效用)
DerivationState (派生状态)
OutcomeRecord (结果记录)
```

具体的 Profile 模式包版本与核心层相互独立。

---

## 18.4 记忆信号 (Mnemonic signals)

推荐的信号：

```text
memory_strength (记忆强度)
salience (显著性)
utility (效用度)
```

这些信号必须与认识论层面的置信度/信任度保持严格区分。

---

# 19. 留存与遗忘 (Retention and Forgetting)

KIP 严格区分多种不同形式的遗忘与移除机制：

```text
认识层面的撤回/废弃替代 (epistemic retraction/supersession)
记忆层面的衰减减弱 (mnemonic weakening)
归档 (archive)
墓碑标记 (tombstone)
治理层面的排除隔离 (Governance exclusion)
载荷清除 (payload purge)
物理清除 (physical purge)
```

**严禁**将上述机制等同视之。

---

## 19.1 留存 (Retention)

通用留存控制挂钩**可以**包括：

```text
retention_class (留存类别)
expires_at (过期时间)
legal_hold (法律保全/诉讼保全锁定)
```

`retention_class` 与 `expires_at` 是存储生命周期，而绝非世界有效性（§19.2）。`legal_hold` 阻断抹除：它究竟阻断什么见 §60.3，它如何作用于载荷清除见 §60.6。

---

## 19.2 留存过期与有效时间的区别 (Retention expiry vs valid time)

```text
retention.expires_at
    存储 / 生命周期 (storage/lifecycle)

Assertion.valid_time.until
    现实世界的适用期 (world applicability)
```

两者完全不同。

---

## 19.3 物理清除 (Physical purge)

物理清除是高影响操作。

对证据/反驳证据的物理清除**应当**格外审慎并接受全面审计。

在策略允许的情况下，物理清除**应当**保留一个摘要存根 (§60.3)，以确保在原始字节被销毁后，审计链条与溯源根标识仍能持久存在。

仅针对证据载荷字节的销毁使用载荷清除 (§60.6)，它保留证据记录本身。

---

# 20. 模式包 (Schema Packages)

## 20.1 用途与定位 (Purpose)

模式包 (Schema Packages) 为 KIP 数据定义权威的语义契约。

Schema 不仅仅用于数据校验：它定义了类型、谓词、切面、结构字段、约束规则、别名、兼容性以及面向模型的语义内涵的唯一标识。

---

## 20.2 模式包引用语法 (Package reference grammar)

基线概念语法：

```text
kip://<package-path>@<exact-version>[/<symbol>]
```

示例：

```text
kip://core@2.0.0
kip://core@2.0.0/Assertion
kip://profiles/cognitive-memory@2.0.0/Experience
kip://ldclabs/organization@1.3.0/works_for
```

---

## 20.3 模式包路径 (Package path)

推荐的路径语法：

```text
小写 ASCII 分段 (lowercase ASCII segments)
分段以 "/" 分隔
分段字符集：
    a-z
    0-9
    "-"
```

形式化词法语法**可以**在后续更新中进一步收紧。

---

## 20.4 精确版本持久化 (Exact-version persistence)

持久化的 KIP 状态**必须**保存确切的 Schema 版本标识。

版本范围/浮动别名**仅可**在持久化之前的符号解析阶段使用。

---

## 20.5 符号类别 (Symbol kinds)

模式包**可以**定义的符号包括：

```text
Concept Type (概念类型)
Predicate (谓词)
Facet (切面)
Structural Field (结构字段)
constraint/rule descriptors (约束/规则描述符)
aliases (别名)
migration descriptors (迁移描述符)
model hints (模型提示)
```

---

## 20.6 本地名称 (Local names)

当本地名称（例如）：

```text
Person
timezone
MnemonicState
has_step
```

能够通过当前活动的 Schema 环境无歧义解析时，KQL/KML/META **可以**直接使用它们。

---

## 20.7 歧义别名 (Ambiguous aliases)

若本地符号存在歧义，运行时**必须**报错失败，严禁擅自猜测。

推荐错误代码：

```text
SchemaSymbolAmbiguous
```

---

## 20.8 Schema 环境 (Schema Environment)

**Schema 环境 (Schema Environment)** 是针对特定记忆空间当前生效的模式包版本集以及别名/默认值解析规则的精确组合。

它属于受保护的治理状态。

---

## 20.9 Schema 锁定 (Schema Lock)

记忆空间**应当**维护确切的 Schema Lock 或等价的确定性环境记录。

---

## 20.10 Schema 变更操作 (Schema mutation)

普通的 KML **严禁**执行以下操作：

```text
安装模式包 (install packages)
激活模式包 (activate packages)
修改默认配置 (change defaults)
修改别名 (change aliases)
封禁模式包 (block packages)
```

这些操作必须通过受保护的 Schema/治理操作完成。

---

## 20.11 模式包构件 (Package artifact)

模式包构件**应当**具备以下特征：

```text
不可变 (immutable)
带版本号 (versioned)
可哈希 (hashable)
可选用数字签名 (optionally signed)
依赖关系显式声明 (dependency-explicit)
默认不可执行 (non-executable by default)
```

---

## 20.12 仅校验模式加载 (Validation-only loading)

内嵌于认知胶囊中的模式包**可以**仅临时加载用于：

```text
验证 (verification)
校验 (validation)
预览 (preview)
```

而无需在目标记忆空间中正式激活。

---

## 20.13 核心内置模式包 (The Core Package)

`kip://core` 是一个**由本规范自身定义的虚拟内置模式包**。

```text
其版本即为协议版本 (对于本规范即为 kip://core@2.0.0)
它在每个 Schema 环境中隐式处于激活状态
严禁停用、替换或遮蔽它
它没有独立的模式包物理构件
对 kip://core 的依赖声明可以省略构件摘要；其身份标识即为协议版本
```

`kip://core@2.0.0` 导出以下符号。

**核心元素类型** (可引用为例如 `kip://core@2.0.0/Assertion`):

```text
Concept (概念)
Proposition (命题)
Assertion (断言)
Evidence (证据)
Activity (活动)
```

**保留的核心结构字段** (由源元素的核心类型直接解析，而非通过包别名):

```text
evidence       Assertion → Evidence            带角色限定的证据引用 (§56.2)
source         Evidence  → Concept | Evidence  观测/构件的来源
generated_by   Evidence  → Activity            产出该证据的活动
inputs         Activity  → any Core element    溯源输入元素
outputs        Activity  → any Core element    溯源输出元素
associated_actors  Activity  → Concept         参与该过程的语义行动者（非授权方，非 Principal）
```

**核心注册枚举值**:

```text
stance                support | reject | uncertain
mode                  observed | stated | inferred | predicted | hypothetical | imported
Assertion lifecycle   active | retracted | superseded | expired
Evidence role         support | challenge | context
Activity terminal     completed | failed | cancelled
belief status         accepted | rejected | contested | uncertain | insufficient
```

模式包**严禁**在其解析作用域内定义或设置别名来遮蔽保留的核心符号名称。文档注明为可扩展的注册项（例如 `activity_class` 取值）**可以**通过包注册扩展添加新值。

---
## 20.14 符号谱系 (Symbol Lineage)

一个 Schema 模式符号具有两重身份：

```text
精确身份 (exact identity)      kip://<package-path>@<exact-version>/<symbol>
谱系身份 (lineage identity)    kip://<package-path>/<symbol>
```

精确身份是持久化状态所保存的内容（§20.4），也是合法性校验所依据的准绳：元素依据其 `schema_ref` 所指明的定义进行校验，Proposition 的 object 依据其 `predicate_ref` 所指明的 Predicate 定义进行校验。

谱系身份则是**实体身份识别与模式匹配**所依据的基准。所有按符号进行比较、匹配或去重的规则均在谱系层面运作，使在同一模式包的不同版本下写入的元素始终保持为同一个认知群体：

```text
键唯一性 (key uniqueness)              §7.3
命题元组身份 (Proposition tuple identity) §12.3
type: / MATCH 语法糖                   §43.1, §54.4
模式中的谓词解析                       §43.2, §46, §47, §55
切面与结构字段名称                     §44.1, §17
胶囊身份映射                           §38.2
```

规则：

- 本地名称解析为一个谱系，而非单一版本。仅当两个不同的包路径导出了同名符号时，才会发生歧义（§20.7）。
- 读取操作能看到谱系中所有可读的版本。创建元素的新写入操作将其绑定至当前 Schema 环境中该谱系的当前写入版本。
- 同一包路径下定义相同符号名的两个版本，定义的是同一个谱系。若包需要表达不同的语义，**必须**使用不同的符号名或不同的包路径；即使内容完全相同，分支 fork 也是不同的谱系。
- 较新版本**可以**声明符号更名（指明其继承者）或废弃。解析与身份遵从声明的更名；废弃的符号在该版本终止其谱系，但绑定到较早版本的元素依然可被读取。
- 将元素的精确 `schema_ref` 更改为同一谱系下的另一个版本属于 `manage_schema`（§20.10）管辖的模式迁移，绝不能通过普通 KML 执行。

若无此规则，模式包升级将人为割裂记忆：在旧版本下写入的未决 Commitment 将不再匹配 `{type: "Commitment"}`，按 `key` 执行的 upsert 将铸造出重复项，在较新 Predicate 版本上的 `BELIEF SLOT` 查询将在堆满断言的槽位上荒谬地报告 `insufficient`。

---

## 20.15 谓词定义字段 (Predicate definition fields)

谓词定义承载了 §12.7、§24 和 §25 所引用的各项声明。模式包**必须**使用以下字段进行表达：

```text
subject               {concept_types: [...]} | {kinds: [...]}
object                {concept_types: [...]} | {kinds: [...]} | {literal_types: [...]}
                      外加 nullable: true（当 null 属于允许的 object 时，§9.5），
                      以及 format: "timestamp" | "uri" | <package-defined name>
                      （用于谓词对其形状施加约束的字符串字面量，§9.2；format 在写入时校验，绝不影响身份）
functional            true  → 每个主语在特定世界有效时间下至多有一个被接受的 object；
                              多个值构成冲突集 (§25.1)
open_world            true  → 命题不存在代表依据不足 insufficient (§24)
                      false → 当前 Space 快照对该谓词具备权威性，缺失可视为封闭世界否决 (§24.2)
complete              true  → 函数槽位的候选对象具有排他性：接受一个即自动拒绝其他 (§25，排他值)
boolean_completeness  true  → 对于布尔值谓词，object 为 false 即为 object 为 true 的否定 (§12.7)；
                              为 false 时两者在结构上保持为不同主张
temporal_conflict     "overlapping_valid_time" → 两个被接受的值仅在其有效时间区间重叠时才冲突 (§25.2)
                      "none" → 值之间永远不在时间上冲突
```

字段缺失时的默认值：`functional: false`, `open_world: true`, `complete: false`, `boolean_completeness: false`, `temporal_conflict: "overlapping_valid_time"`。认知投影策略**可以**比声明更严格，但绝不能更宽松：它不能将 `open_world: true` 的谓词视为封闭世界。

---

# 21. 认识模型 (Epistemic Model)

## 21.1 认识论投影 (Epistemic Projection)

**认识论投影 (Epistemic Projection)** 是在策略、时间及特定目的约束下，对针对一个或多个命题且可见/授权的：

```text
Assertions (断言)
Evidence (证据)
Provenance (溯源)
Trust (信任度)
Schema conflict rules (模式冲突规则)
```

进行的解释与推导过程。

概念公式：

```text
Belief =
Projection(
  Assertions,
  Evidence,
  Provenance,
  Trust,
  Time,
  Context,
  Purpose,
  Policy
)
```

---

## 21.2 投影是只读视图 (Projection is read-only)

投影的输出是一个虚拟视图。

投影结果**严禁**仅仅因为被读取就自动变成持久化的自身信念。

---

## 21.3 信念状态 (Belief statuses)

基线状态包括：

```text
accepted (已接受)
rejected (已拒绝)
contested (存在争议)
uncertain (不确定)
insufficient (证据不足 / 未知)
```

若经过能力协商，系统实现**可以**添加带命名空间的状态。

---

## 21.4 已接受 `accepted`

语义定义：

> 在投影策略规则下，合格的支持依据充足，且未决的反对意见低于策略阈值。

---

## 21.5 已拒绝 `rejected`

语义定义：

> 在投影策略规则下，合格的反对依据充足。

**严禁**仅仅因为缺少支持依据就给出 `rejected` 状态。

---

## 21.6 存在争议 `contested`

语义定义：

> 实质性的支持与实质性的反对同时并存且尚未决议。

处于存在争议状态的投影**依然可以**拥有占优势的一方；输出中的 `leading` 字段（§27.2）将对其进行披露。信息披露不是终局裁决：`leading` 绝不能将 `contested` 强行转变为 `accepted` 或 `rejected`。

---

## 21.7 不确定 `uncertain`

语义定义：

> 存在有意义的认识材料，但材料较弱、陈旧、模棱两可、信任度低、欠定，或因其他原因不足以支撑接受或拒绝。

---

## 21.8 证据不足 `insufficient`

语义定义：

> 不存在充足合格的认识基础。

这是开放世界假设下的未知状态。

---

## 21.9 物化投影视图 (Materialized Projection)

认识论投影在本质上保持为视图 (§21.2)，但系统实现**可以**缓存/物化投影结果，以便以字典查找的低成本快速召回稳定信念。

物化投影**必须**至少由以下要素唯一标识：

```text
Projection Policy identity + version (投影策略标识与版本)
snapshot_seq basis (快照序列号依据)
valid-time basis (有效时间依据)
```

规范要求：

- 提供物化结果时**必须**通过结果上下文 (§50) 披露其策略标识与快照依据；将其伪装成在当前快照下全新计算的结果属于非合规行为。
- 物化结果在作为当前结果提供之前，**必须**使其失效，或对照 `space_seq` / 变更外壳重新验证其有效性。
- 物化投影仍然属于视图：**严禁**将其回写为证据或断言，且**严禁**用于佐证其自身的输入来源 (§23.5, §26.6)。

---

## 21.10 结构化投影基线 (Structural projection baseline)

合规的最小化认知投影策略仅使用结构化材料：断言生命周期、世界有效时间、调用者可见性、`mode`（模式）、`stance`（立场）以及溯源根节点独立性（§23）。它不进行任何权重计算 —— 无信任得分、无置信度算术、无数值输出（`score: null`）—— 且完全由可见状态确定性推导得出，因此两个独立的运行时在给定相同状态和策略时，必定产生完全相同的 status、`leading` 和 ledger 账本。一致性测试套件的 `test-deterministic` 策略即为该基准策略。

每个声明实现 KIP-Epistemic 的系统都**必须**能够运行结构化策略（§92）。基于信任加权的策略（§22, §27.3）建立在该基线之上，并通过 `weighted_projection` 能力（§67.4）对外通告；仅提供结构化基线的运行时依然完全合规。

---

# 22. 置信度、信任与证据 (Confidence, Trust, and Evidence)

## 22.1 断言置信度 (Assertion confidence)

断言置信度是该断言自身立场在历史上可归属的主张强度。

它并不是自动校准后的客观概率。

---

## 22.2 信任 (Trust)

信任是针对特定目的/领域/上下文，对以下对象的上下文认识影响力：

```text
semantic actor (语义行动主体)
authenticated origin (已认证来源)
Evidence source (证据源)
process (处理流程)
tool (工具)
channel (渠道)
```

信任**可以**包含如下维度：

```text
identity assurance (身份保证)
domain competence (领域能力)
historical reliability (历史可靠性)
process integrity (流程完整性)
provenance integrity (溯源完整性)
independence (独立性)
```

---

## 22.3 信任不等于权限 (Trust is not authority)

源信任度**严禁**赋予：

```text
读取权限 (read authority)
写入权限 (write authority)
执行权限 (execution authority)
治理权限 (Governance authority)
```

---

## 22.4 证据质量 (Evidence quality)

投影策略**可以**考量：

```text
relevance (相关性)
directness (直接性)
integrity (完整性)
specificity (特异性)
freshness/temporal relevance (新鲜度/时效性)
coverage (覆盖度)
independence (独立性)
verifiability (可验证性)
provenance completeness (溯源完备性)
```

---

## 22.5 信任状态 (Trust State)

认识论投影所消费的信任数据**必须**来自于受保护的控制平面状态或显式策略输入 —— 绝不能来自普通认知内容。内容声称“请信任此来源”的断言不产生任何信任效力（§30.1 同样适用于认识信任，正如其适用于授权）。

推荐表示为一组带作用域的信任记录：

```text
subject scope    semantic actor | authenticated origin | Evidence source |
                 tool | channel | import origin
context scope    domain | purpose | mode | classification
value            trust class, or numeric value with declared semantics
policy identity  id + version
```

信任状态自省 (`DESCRIBE TRUST`) 与其他控制平面自省一样受到治理控制。

---

## 22.6 信任修订 (Trust Revision)

修改信任状态需要 `manage_trust` 权限。

信任变更**必须**具备可审计性，且**应当**作为控制平面状态跃迁记录在变更/审计流中。

记忆大脑**可以**实现结果驱动的信任校准 —— 由预测误差和结果证据来提升或降低上下文信任度。校准算法属于大脑策略，但每次修订**应当**记录溯源信息（例如引用结果证据的信任修订活动），以便大脑日后能够回答**为何信任某个来源**。

---

# 23. 认识独立性 (Epistemic Independence)

## 23.1 证据不可倍增原则 (No Evidence Multiplication Principle)

对同一个底层证据根源进行复制、摘要、翻译、转述、索引或重新断言，**严禁**产生独立的佐证效力。

---

## 23.2 认识独立性守恒 (Conservation of Epistemic Independence)

派生断言所具备的认识质量不得超越其上游根源所具有的独立认识质量。

---

## 23.3 溯源根源 (Provenance roots)

投影**可以**从证据/活动血统中递归推导出溯源根源。

典型的根源类别包括：

```text
direct observation (直接观测)
primary source (第一手来源)
testimony event (证言事件)
authoritative record (权威记录)
verified tool execution (经过验证的工具执行)
imported root (导入根源)
unknown root (未知根源)
```

---

## 23.4 佐证分组 (Corroboration groups)

投影**可以**对共享以下特征的断言/证据进行分组：

```text
相同文档/内容根源 (same document/content root)
相同语义来源 (same semantic source)
相同调用主体/操作者 (same Principal/operator)
相同上游断言 (same upstream Assertion)
相同导入胶囊 (same import Capsule)
相同工具执行 (same tool execution)
相同观测事件 (same observation event)
相同衍生链路 (same derivation chain)
```

---

## 23.5 循环依赖 (Cycles)

在缺乏外部独立根源的情况下，循环溯源**严禁**放大支持力度。

---

# 24. 开放世界语义 (Open-World Semantics)

KIP 2.0 默认遵循开放世界假设。

```text
未检索到 (not found)
    ≠
为假 (false)

对命题 P 缺乏支持
    → 证据不足 (insufficient)
```

除非应用了显式声明的封闭世界模式/策略。

---

## 24.1 缺席证据 (Evidence of absence)

仅当观测过程具备有意义的探测覆盖面时，未观测到某一现象方可作为证明其不存在的证据。

---

## 24.2 封闭世界特例 (Closed-world exception)

有界限的权威快照**可以**针对特定领域/谓词显式定义封闭世界语义。

这**必须**由 Schema 或投影策略显式声明。

---

# 25. 冲突模型 (Conflict Model)

投影**应当**区分如下冲突类型：

```text
direct stance conflict (直接立场冲突)
functional-value conflict (单值函数冲突)
exclusive-value conflict (互斥取值冲突)
cardinality conflict (基数约束冲突)
type/schema conflict (类型/模式冲突)
temporal conflict (时间有效区间冲突)
declared causal/logical conflict (声明的因果/逻辑冲突)
```

---

## 25.1 单值谓词 (Functional Predicate)

Schema 可以针对特定上下文声明某个谓词为单值函数。

此时，多个重叠的被接受候选值将构成冲突集合。

---

## 25.2 时间非冲突 (Temporal non-conflict)

在不重叠的客观世界时间区间内分别有效的两个取值不构成矛盾。

---

## 25.3 上下文非冲突 (Contextual non-conflict)

不同的上下文语境**可以**使表面上不同的断言不再构成冲突。

---

# 26. 断言模式 (Assertion Modes)

## 26.1 假设模式 (Hypothetical)

假设模式的断言**应当**从普通的现实世界投影中排除，除非特定情景策略显式将其纳入。

---

## 26.2 预测模式 (Predicted)

预测模式的断言代表前瞻推测而非现实观测。

后续发生的结果证据**可以**验证或反驳该预测。

---

## 26.3 导入模式 (Imported)

导入模式的断言代表跨系统迁移的认知，并不等同于本地系统的直接背书。

---

## 26.4 陈述模式 (Stated)

陈述模式的断言代表主观口述/外部陈述。

对其信任程度取决于语义行动主体、身份保证、上下文语境与策略规则。

---

## 26.5 观测模式 (Observed)

直接观测并不自动等同于客观真理。

工具、仪器与数据源的质量仍然至关重要。

---

## 26.6 推理模式 (Inferred)

推理模式的断言**应当**完整保留推导溯源。

它们**严禁**反过来为其自身的前提取供独立佐证。

---

# 27. 投影请求与输出 (Projection Request and Output)

## 27.1 投影上下文 (Projection context)

投影请求**应当**支持指定：

```text
purpose (用途目的)
risk (风险等级)
valid_at (世界有效时间点)
as_of cognitive state (认知状态时间截点)
policy (策略)
include historical (是否包含历史记录)
include hypothetical (是否包含假设)
explanation level (解释详细程度)
```

---

## 27.2 投影输出 (Projection output)

概念输出结构：

```json
{
  "status": "accepted",
  "leading": "support",

  "support": {
    "score": null,
    "score_semantics": null,
    "assertion_ids": [],
    "root_groups": []
  },

  "opposition": {
    "score": null,
    "score_semantics": null,
    "assertion_ids": [],
    "root_groups": []
  },

  "uncertainty": {
    "level": null,
    "reasons": []
  },

  "temporal": {
    "valid_at": "...",
    "as_of_seq": 1500
  },

  "policy": {
    "id": "...",
    "version": "..."
  },

  "explanation": {}
}
```

---

## 27.3 评分语义 (Score semantics)

若返回数值评分，**必须**声明其语义，例如：

```text
ordinal_strength (序数强度)
normalized_support (归一化支持度)
calibrated_probability (校准概率)
log_odds (对数几率)
implementation_specific (实现特定语义)
```

**严禁**假设支持分与反对分相加之和必然等于 1。

---

## 27.4 解释机制 (Explanation)

投影**可以**暴露包含如下内容的外部**认识账本 (Epistemic Ledger)**：

```text
contributing Assertions (贡献支持的断言)
opposing Assertions (反对的断言)
Evidence roots (证据根源)
corroboration groups (佐证分组)
trust decisions (信任判定)
eligibility exclusions (资格排除项)
temporal exclusions (时间排除项)
warnings (警告信息)
```

它**严禁**要求暴露私有的思维链。

---

# 28. 治理 (Governance)

## 28.1 受保护的控制平面 (Protected control plane)

治理规则属于引擎权威控制的受保护状态。

普通的认知内容无法自行赋予治理权限。

---

## 28.2 调用主体 (Principal)

**调用主体 (Principal)** 是由运行时建立的经过身份认证的执行身份。

调用主体与语义层面的 Person/Agent 概念不是同一个对象。

---

## 28.3 主体绑定 (ActorBinding)

**主体绑定 (ActorBinding)** 是连接调用主体与一个或多个语义行动主体及代表作用域的可信治理状态。

普通的认知内容**严禁**创建权威的主体绑定状态。

---

## 28.4 记录归属与代表行权的区分 (Recording attribution vs representation)

治理规则**应当**严格区分：

```text
record_attributed_assertion (记录归属断言)
    "我记录 Alice 说过了 P。"

assert_as_actor (代表主体行权断言)
    "我行使作为 Alice 的授权来断言 P。"
```

这两者属于完全不同的权限。

---

## 28.5 用户组 / 角色 / 授权 / 委托 (Group / role / Grant / Delegation)

治理体系**可以**支持：

```text
Principal Groups (主体组)
Roles (角色)
Grants (显式授权)
Delegations (委托权限)
```

角色是人机工效层面的策略语法糖；实际生效的权限语义具有权威性。

委托权限**应当**默认具备衰减性且不可传递，除非另有显式许可。

---

## 28.6 权限撤销 (Revocation)

针对安全敏感的写入操作，在提交时**必须**重新校验委托/授权的撤销状态。

---

# 29. 权限模型 (Permission Model)

基线权限族系包括：

```text
Discovery / Read (发现 / 读取)
Cognitive Mutation (认知变更)
Epistemic Mutation (认识变更)
Identity (身份标识)
Maintenance (维护治理)
Sharing (共享分发)
Lifecycle (生命周期)
Schema (模式管理)
Governance (治理控制)
Authority (权限提升)
Audit (审计追踪)
```

推荐的权限项至少包含：

```text
discover (发现存在性)
read (读取内容)
search (检索)
project (认识论投影)

create (创建)
update (更新)
derive (衍生)

assert (断言)
record_attributed_assertion (记录归属断言)
assert_as_actor (代表主体断言)
retract_own (撤回自身断言)
supersede_own (废弃替代自身断言)

merge_identity (合并身份)

maintain (维护状态)
manage_retention (管理留存)

share (共享)
export (导出)
import (导入)

archive (归档)
tombstone (墓碑标记)
purge (物理清除)

manage_schema (管理模式)
manage_policy (管理策略)
manage_grants (管理授权)
manage_delegation (管理委托)
manage_trust (管理信任)
manage_actor_binding (管理主体绑定)

elevate_authority (权限提升)

read_audit (读取审计)
read_history (读取历史)
read_raw_origin (读取原始来源)
```

系统实现**可以**细化权限名称与作用域，但在声称完全符合治理合规性时，**必须**保留等价的语义区分。

---

## 29.1 `discover` (发现权限)

控制调用主体是否有权知晓某个元素/匹配结果的存在。

在没有发现权限的情况下，运行时**可以**返回与“未找到”等价的行为。

---

## 29.2 `read` (读取权限)

允许读取已知元素中受许可的内容字段。

**可以**应用字段级脱敏/遮蔽。

---

## 29.3 `search` (检索权限)

允许在已授权的检索域内执行联想/词法/语义检索。

治理规则**必须**在用户可见的排序结果生效之前完成过滤。

---

## 29.4 `project` (投影权限)

允许在受许可的策略下执行认识论投影。

策略**可以**允许返回投影结果而不暴露底层的原始证据。

---

## 29.5 `update` (更新权限)

仅允许修改可变的非保护字段。

它不包含重写不可变语义/认识历史的权限。

---

## 29.6 `derive` (衍生权限)

允许创建衍生认知输出，受制于：

```text
密级继承 (classification propagation)
溯源保留 (provenance preservation)
权限不放大 (authority non-amplification)
同空间引用闭包 (Same-Space reference closure)
```

当某次写入操作建立了 `LIST DEPENDENTS` 所遍历的溯源边（§63.5）时，该写入即构成衍生写入（derivation）——即目标元素被记录为一个「至少拥有一个 input 的 Activity」的 output：

```text
X ∈ Activity.inputs
    → 该 Activity
    → 其 outputs 中的每个元素
```

实现了 `derive` 权限控制的运行时**必须**对建立该溯源边的写入操作强制校验 `derive` 权限：无论该写入是在创建该 Activity 的同一事务中生成 output 元素，还是在后续操作中将既有元素追加至 `Activity.outputs`。`derive` 权限是在基础创建权限（如 `create`）**之外**的叠加要求，绝不能替代基础权限：仅声明授予 `derive` 的 Grant 实际上不赋予任何有效的写入能力。

权限校验的触发条件严格取决于该溯源边的建立，而非单纯的「是否存在元素间引用」——因为上述四项约束的核心，在于规范 output 从其 inputs 继承的属性与限制。仅仅引用其自身所记录目标的元素（例如 Assertion 指向其陈述的 Proposition、Evidence 指向其来源 source）并未发生认知状态的转换或继承，因而并不构成衍生；若对此类写入要求 `derive` 权限，将导致 `create` 与 `assert` 无法单独正常使用。反之，不含任何 inputs 的 Activity 记录的是直接观测外部世界的过程，而非对大脑既有认知资产的转换加工，因而也不向下传播任何限制。

若运行时未实现针对衍生写入的区分控制，当 Grant 显式声明包含 `derive` 权限时**必须**予以拒绝，严禁静默接受一个没有任何权限闸门会进行实际校验的权限名称。一项被系统静默接受却不守护任何操作的虚假权限，会制造已获授权的虚假安全假象，使系统持有者往往只能在安全事故发生时才发现防御漏洞。

引用闭包（§5.3）在衍生写入与维护写入上**必须**与主写入路径完全一样地重新校验；衍生不是豁免的写入路径。

---

## 29.7 `purge` (清除权限)

物理擦除属于高影响操作，**应当**具有独立的作用域划分与审计跟踪。

---

## 29.8 `record_outcome` (后果记录权限)

允许创建 `outcome` 类的结果证据（§15.7）以及将该结果链接至被评估决策的观测活动。

治理策略**应当**将该权限授予测量仪器主体 —— 遥测、验证器、测试工具链、人工审查员 —— 且**不应当**授予其 ActorBinding 覆盖了被评估行动者的主体。在同一主体既行动又评定的部署中，在设计上便无法满足不变量 36：此类系统依然可以运行后果通道，但其裁决属于自评自赞，打分消费者的起源校验（§15.7）**必须**能仅从 `_system.origin` 识别出这一点。

观测边 —— `inputs` 中的决策活动，`outputs` 中的结果证据 —— 记录的是对外部世界的观测，而非对已有认知的推导转换。它不需要额外的 `derive` 权限（§29.6）；结果的密级分类遵循其自身的治理钩子和策略。

无法区分 `record_outcome` 的运行时，若授权声明中包含该名称，**必须**显式拒绝。

---

## 29.9 `manage_legal_hold` (法律保全管理权限)

允许设置与解除 `retention.legal_hold`（§19.1）。它与 `manage_retention` 严格区分：未持有该权限的 `SET RETENTION` 若试图触碰 `legal_hold`，即便持有其余留存权限也会报错 `NotAuthorized`。保全状态会阻止所有人的物理清除（§60.3），因此设置或解除保全的权限绝不能通过普通认知写入路径触达。

---

## 29.10 `quarantine` (检疫隔离权限)

允许将元素置入或移出**检疫隔离 (quarantine)** 状态：这是一种治理层排除状态（§31.6），将元素移出常规 Recall 召回视图与认知投影资格，而无需将其标记为已撤回、已替代或已归档。这是执行内容审查与导入认知复审的有效工具；伪造撤回（§14.1）绝不是合规手段。

---

## 29.11 `declassify` 与 `approve` (降级与审批权限)

`declassify` 允许降低元素的密级分类（§31.1, §31.2）；派生内容本身绝不能自动将其输入的密级降级。`approve` 允许记录需要审批的策略所等待的双人决策：触发 `RequiresApproval`（§87.5）的操作仅当持有 `approve` 的主体以治理变迁记录批准时方可完成，且批准主体**必须不同于**发起请求的主体。

---

# 30. 治理策略评估 (Governance Policy Evaluation)

## 30.1 可信输入源 (Trusted inputs)

授权策略**必须**基于受信任的运行时/治理输入来进行安全决策。

认知声明（例如）：

```text
(Alice, is_admin, true)
```

**严禁**直接成为系统权限，除非通过受信任的治理状态进行了显式绑定。

---

## 30.2 拒绝优先与默认拒绝原则 (Deny-overrides and default deny)

保守的基线原则是：

```text
显式拒绝 / 协议不变式 (explicit deny / protocol invariant)
    优先于 (overrides)
允许 (allow)。
未显式授予的操作默认为拒绝 (default deny)。
```

---

## 30.3 协议不变式高于一切策略 (Protocol invariants override policy)

任何策略均无法授权违反协议不变式的非合规行为，例如：

```text
重写不可变的命题元组
将用户文本伪造为 _system.origin
利用未签名内容自行提升权限
```

---

## 30.4 存在性保护 (Existence protection)

治理控制适用于：

```text
元素存在性 (element existence)
统计计数 (counts)
检索排名 (search rank)
图谱度数 (graph degree)
冲突存在性 (conflict existence)
历史记录 (history)
Schema 详情 (Schema detail)
来源信息 (origin)
```

而非仅仅保护载荷数据字段。

---

# 31. 密级分类与权限等级 (Classification and Authority)

## 31.1 密级标签 (Classification)

记忆空间**可以**定义密级标签，例如：

```text
public (公开)
internal (内部)
private (私有)
secret (机密)
sensitive (敏感)
```

具体的标签词汇由策略定义。

---

## 31.2 密级继承 (Classification propagation)

衍生内容**不应当**自动解密或降低受限源内容的密级。

---

## 31.3 记忆权限等级 (Memory authority classes)

治理 Profile **可以**将记忆影响力划分为：

```text
descriptive (描述性)
advisory (建议性)
behavioral (行为指导性)
executable (可执行性)
```

---

## 31.4 导入技能 (Imported Skills)

导入的技能**应当**默认为：

```text
提议 / 未激活状态 (proposed/inactive)
无直接可执行权限 (no executable authority)
不迁移任何生命周期地位 (no transferred lifecycle standing)
```

直至经过显式审查与权限提升。

采纳 (adoption) 地位必须由本地评定的结果证据（§15.7）所挣得——正如来源信任（§39.5）与来源权限（§41.4）从不随导入而自动迁移。

---

## 31.5 绑定来源的权限约束 (Origin-Bound Authority)

转换、摘要、巩固、导入或技能编译**严禁**抹除与权限相关的溯源血统。

语义内容绝无法自行提升其权限上限。

---

## 31.6 检疫隔离 (Quarantine)

检疫隔离是挂载在元素上的受保护治理状态，而非生命周期状态。处于隔离状态的元素：

```text
被排除在常规 Recall 召回视图与认知投影资格之外
完整保留其原有的生命周期状态、载荷、溯源与历史不变
对持有 discover + read 权限的主体可见，并明确标为 quarantined (DESCRIBE ACCESS)
仅在持有 quarantine 权限（§29.10）时方可设置或解除
```

胶囊的 `isolate` 导入模式（§39.2）将导入元素置于检疫隔离中。隔离是实现审查与复审的标准手段，无需对源系统的原始陈述编造谎言。

---

# 32. 事务 (Transactions)

## 32.1 定义 (Definition)

**事务 (Transaction)** 是在单一记忆空间内发生的一次原子的持久化状态跃迁。

产生状态变更的事务**必须**提供：

```text
单一起始快照 (one start snapshot)
自身写可见 / 读自身写入 (read-your-writes)
无部分持久化可见性 (no partial durable visibility)
原子提交或中止 (atomic commit or abort)
提交时授权校验 (commit-time authorization validation)
有序提交记录 (ordered Commit Record)
```

---

## 32.2 推荐的隔离级别 (Recommended isolation)

完整的 KIP 2.0 状态变更事务合规性**应当**提供可串行化 (serializable) 的结果语义。

若支持较弱的隔离级别，**必须**通过能力显式声明，且**严禁**静默响应对更高隔离级别的请求。

---

## 32.3 事务处理阶段 (Transaction phases)

可观测的语义**必须**等价于如下步骤：

```text
1. 接收 / 规范化 (receive / normalize)
2. 幂等性解析 (resolve idempotency)
3. 认证调用主体 (authenticate Principal)
4. 绑定记忆空间 (bind Space)
5. 捕获读取快照 (capture read snapshot)
6. 解析 Schema 环境 (resolve Schema Environment)
7. 执行鉴权 (authorize)
8. 解析 / 脱糖语法 (parse/desugar)
9. 在读自身写入保障下执行暂存计划 (execute tentative plan with read-your-writes)
10. 校验核心层与 Schema 约束 (validate Core + Schema constraints)
11. 计算最终写入集 (compute final write set)
12. 校验可串行化 / 前置条件 (validate serializability/preconditions)
13. 重新校验安全敏感的治理状态 (revalidate security-sensitive Governance)
14. 原子提交 (commit atomically)
15. 分配 space_seq 与 committed_at 时间戳 (assign space_seq + committed_at)
16. 更新 _system 字段 (update _system fields)
17. 追加提交记录 (append Commit Record)
18. 发布变更外壳 (publish Change Envelope)
19. 返回提交收据 (return Receipt)
```

在保证外部可观测语义完全等价的前提下，系统实现的具体阶段**可以**融合或重排。

---

## 32.4 事务标识符 `tx_id` (Transaction ID)

每个已完成的事务都拥有一个由引擎分配的：

```text
tx_id
```

---

## 32.5 起始快照序列号 (Start snapshot)

事务捕获：

```text
snapshot_seq
```

代表该事务开始执行时的记忆空间状态。

---

## 32.6 读自身写入 (Read-your-writes)

在事务内部，后续的读取操作**必须**能够看到该事务此前暂存的相关写入效果。

---

## 32.7 严禁脏读 (No dirty reads)

其他并发事务/读取者在事务正式提交之前，**严禁**观测到其暂存的写入内容。

---

## 32.8 无实际效果处理 (No-effect)

最终持久化状态未发生任何实质改变的事务**应当**返回：

```text
no_effect
```

且**不应当**分配新的认知 `space_seq`。

---

# 33. 提交记录与收据 (Commit Record and Receipt)

## 33.1 提交记录 (Commit Record)

每次产生状态变更的提交操作都会追加一条不可变的逻辑提交记录 (Commit Record)。

推荐字段：

```text
tx_id (事务ID)
space_id (空间ID)
space_seq (空间序列号)
snapshot_seq (快照序列号)
committed_at (提交时间)
transaction_class (事务类别)
request_digest (请求摘要)
result_digest (结果摘要)
semantic_plan_digest (语义计划摘要)
Schema Environment identity (Schema 环境标识)
Governance decision/audit refs (治理决策/审计引用)
change summary (变更摘要)
origin Principal (来源调用主体)
```

---

## 33.2 提交收据 (Receipt)

收据是事务执行结果面向客户端的可视化呈现。

成功的状态变更提交收据**应当**包含：

```json
{
  "tx_id": "tx-...",
  "space_id": "space-...",
  "snapshot_seq": 1500,
  "space_seq": 1501,
  "committed_at": "...",
  "status": "committed",
  "transaction_class": "cognitive",
  "request_digest": "sha256:...",
  "semantic_plan_digest": "sha256:...",
  "schema_environment_version": 17
}
```

---

## 33.3 签名收据 (Signed Receipt)

运行时**可以**支持密码学签名的收据。

已签名的收据证明的是认知中枢认证其已提交了对应内容，而非证明事务内部断言的客观真实性。

---

# 34. 幂等性 (Idempotency)

## 34.1 事务幂等键 (Transaction idempotency key)

状态变更事务**可以**包含：

```text
idempotency_key
```

---

## 34.2 作用域限定 (Scope)

幂等键**必须**进行作用域限定，以确保无关调用方不会发生冲突，至少涵盖：

```text
MemorySpace (记忆空间)
authenticated Principal/authority namespace (已认证的主体/权限命名空间)
operation endpoint/class (操作端点/类别)
```

---

## 34.3 相同键与相同请求 (Same key, same request)

运行时**必须**返回原始保留的事务结果，而非重复执行。

留存覆盖所有已定格的结果，包括 `no_effect`：`no_effect` 结果**必须**与已提交结果一样被留存并按原样重放——即便它不分配 `space_seq`、也不追加提交记录（§32.8、§33.1）。

在定格之前中止的事务（前置条件、校验、授权或可串行化失败）**严禁**占用该幂等键：失败不构成留存结果，之后携带同一键的请求照常执行。

---

## 34.4 相同键与不同请求 (Same key, different request)

运行时**必须**报错失败：

```text
IdempotencyConflict
```

---

## 34.5 留存期 (Retention)

若幂等记录的留存时间有限，运行时**必须**暴露/声明其留存期。

---

## 34.6 重试与重复经验的区分 (Retry distinction)

```text
网络重试 (network retry)
    ≠
重复经历 (repeated Experience)
```

当多次观测/陈述代表独立的客观源事件时，协议**必须**如实保留真实的重复记录。

---

# 35. 前置条件与并发控制 (Preconditions and Concurrency)

## 35.1 `EXPECT VERSION`

对可变现有元素的修改**可以**使用前置条件进行防护：

```text
EXPECT VERSION n [OF ATTRIBUTES | STRUCTURAL | RETENTION | FACET "<symbol>"]
```

缺省 `OF` 时，仅当当前 `_system.version == n` 时变更方可执行成功。

携带 `OF` 时，守卫指明了一个**版本平面 (version plane)**，并将 `n` 与该平面在 `_system.plane_versions`（§6.3）中的专属计数器进行比较：`attributes`（字段与属性）、`structural`（结构引用）、`retention`（留存记录）或 `facets["<symbol>"]`（单一 Facet）。平面计数器仅在该平面发生变更时递增，而 `_system.version` 在任何变更时均递增。因此，对一个平面的守卫不会因对另一平面的并发写入而失效：`MnemonicState` 的代谢衰减扫描不会破坏受 `OF ATTRIBUTES` 守卫的状态裁决，裁决也不会使衰减扫描失效。

`EXPECT VERSION` 始终是变更语句的尾部子句（§52.8），且**可以**重复声明，每个平面限一条守卫；对同一平面命名两次属于语法错误。任何一条守卫失配都会导致语句报错 `VersionConflict`，其 `details.plane` 指明失配的平面，且事务中的任何内容均不提交（§33）。

---

## 35.2 仅创建防护 (Create-only guard)

在支持的情况下：

```text
EXPECT VERSION 0
```

表示所寻址的逻辑身份在系统中必须尚不存在。仅有裸形式才代表仅创建：`EXPECT VERSION 0 OF <plane>` 是普通平面守卫（§35.1），声明该平面从未被写入过。

---

## 35.3 生命周期前置条件 (Lifecycle preconditions)

协议不提供 `EXPECT STATE` 守卫。`TRANSITION`（§52.5）会依据所请求的迁移自身对目标的当前生命周期状态进行校验，若该迁移在当前状态下不合法则直接报错 `InvalidLifecycleTransition`，因此显式的期望状态子句只会冗余重述引擎已然校验的内容。若调用者还需要确保在此期间没有发生其他变更，应守卫元素的版本号。

---

## 35.4 空间与模式前置条件 (Space/schema preconditions)

事务外壳**可以**包含如下前置条件：

```text
space_seq
schema_environment_version
```

---

## 35.5 版本号递增规则 (Version increments)

被同一个已提交事务修改的既有元素，其版本号针对该事务恰好递增一次。

新创建的元素初始版本号为 `1`。

---

# 36. 变更流 (Change Stream)

## 36.1 变更信封 (Change Envelope)

一次产生状态变更的提交会生成一个逻辑变更信封。

规范形态（参见 `schemas/kip-change-envelope.schema.json`）：

```json
{
  "space_id": "space-1",
  "space_seq": 1501,
  "tx_id": "tx-900",
  "committed_at": "...",
  "transaction_class": "cognitive",
  "changes": [
    {
      "op": "create",
      "kind": "assertion",
      "id": "A-2",
      "new_version": 1,
      "refs": {"proposition": "P-1"}
    },
    {
      "op": "lifecycle",
      "kind": "assertion",
      "id": "A-1",
      "old_version": 2,
      "new_version": 3,
      "state": {"from": "active", "to": "superseded"},
      "refs": {"proposition": "P-1"}
    },
    {
      "op": "update",
      "kind": "concept",
      "id": "C-7",
      "schema_ref": "kip://profiles/cognitive-memory@2.0.0/Commitment",
      "old_version": 4,
      "new_version": 5,
      "touched": ["attributes.status", "facets.MnemonicState"],
      "planes": {"attributes": 3, "facets": {"MnemonicState": 2}}
    }
  ]
}
```

每个条目**必须**携带 `op`（`create | update | lifecycle | retention | merge | purge | payload_purge`）、`kind`、`id` 与 `new_version`；元素已存在时携带 `old_version`；`lifecycle` 操作携带 `state {from, to}`；Concept 携带 `schema_ref`；Assertion 条目携带 `refs.proposition`，Proposition 条目携带 `refs.subject` 与 `refs.predicate_ref`；`planes` 记录提交后该条目所触碰的每个平面的计数器（§6.3）；`touched` 记录发生变更的路径列表（属性、切面、结构字段或留存名称）——仅记录名称，绝不携带值。这是 Watch（认知记忆 Profile）在无需载荷的情况下判断某个槽位、元素或类型是否发生变化所需的最小信息。

存在性保护（§30.4）按条目独立生效：消费方无权 discover 发现的元素将从其收到的信封中被剔除。超出条目元数据的载荷数据（新旧值）不属于信封的一部分；消费方需凭自身权限按需读取。

---

## 36.2 原子性 (Atomicity)

数据消费方**必须**将同一个外壳中的所有变更视为单一认知状态跃迁。

---

## 36.3 投递语义 (Delivery)

事件投递**可以**是至少一次 (at-least-once) 的。

消费方**必须**能够依据以下组合进行幂等去重：

```text
space_id + space_seq + tx_id
```

运行时**可以**提供过滤后的变更投递（例如只投递触及声明元素、类型或种类的外壳），作为一项协商能力 (§67)。过滤只是传输层的便利：它**严禁**改变外壳内容、原子性，或所投递子集内部的 `space_seq` 顺序。

---

## 36.4 重放机制 (Replay)

变更重放**严禁**仅仅因为下游消费者多次接收到相同的外壳，就将其视作新的证据、强化信号或重复经验。

---

# 37. 认知胶囊 (Cognitive Capsule)

第 37 至 41 节的完整规范已移至规范性伴随文档 [KIP-2.0-Capsule-Specification_CN.md](./KIP-2.0-Capsule-Specification_CN.md) 中，该文档保持完全相同的章节编号，以确保 Core、Profile 及一致性测试套件中所有对 §37–§41 的引用保持原样解析有效：

```text
§37  认知胶囊 (Cognitive Capsule)
§38  胶囊身份模型 (Capsule Identity Model)
§39  胶囊导入模式 (Capsule Import Modes)
§40  胶囊闭包与外部引用 (Capsule Closure and External References)
§41  胶囊导出/导入管线 (Capsule Export/Import Pipeline)
```

在此重述两条基础规则，因为 Core 的其余部分依赖它们。胶囊是一种在不同系统或 Space 之间迁移认知状态或状态变更的可移植、不可变、可审查的人工制品；它**绝非**可执行的变更授权。胶囊引入的所有内容均在目标系统的 Schema 环境下重新校验，并在目标系统的 Governance 治理策略下重新授权：源系统的信任度、权限与生命周期地位绝不自动迁移（§31.4, §41.4）。

---

# 38. 胶囊身份模型 (Capsule Identity Model)

参见胶囊伴随规范 §38。

---

# 39. 胶囊导入模式 (Capsule Import Modes)

参见胶囊伴随规范 §39。

---

# 40. 胶囊闭包与外部引用 (Capsule Closure and External References)

参见胶囊伴随规范 §40。

---

# 41. 胶囊导出/导入管线 (Capsule Export/Import Pipeline)

参见胶囊伴随规范 §41。

---

# 42. KQL — 认知查询语言 (Cognitive Query Language)

## 42.1 用途与定位 (Purpose)

KQL 是 KIP 的声明式只读查询语言。

除非使用了显式的认识论投影原语，原生 KQL 默认读取底层的原始认知状态。

---

## 42.2 查询骨架 (Query skeleton)

推荐的原生形式：

```prolog
FIND(...)
WHERE {
  ...
}
AS OF ...
FOR TIME ...
WITH EPISTEMIC {
  ...
}
ORDER BY ...
LIMIT ...
CURSOR ...
```

`FIND` 与 `WHERE` 构成基线结构化查询。

---

## 42.3 默认读取原始事实 (Raw default)

普通的命题模式表达的是：

> 该可见的规范语义命题在系统中存在。

这并不代表大脑已经接受它为真。

---

# 43. KQL 模式族系 (KQL Pattern Families)

基线模式族系：

```text
Concept Pattern (概念模式)
Proposition Pattern (命题模式)
Assertion Pattern (断言模式)
Evidence Pattern (证据模式)
Activity Pattern (活动模式)
Structural Reference Pattern (结构引用模式)
Belief Pattern (信念模式)
Belief Slot Pattern (信念槽位模式)
```

---

## 43.1 概念模式 (Concept Pattern)

```prolog
?person {
  type: "Person",
  name: "Alice"
}
```

显式可选形式：

```prolog
?person CONCEPT {...}
```

`type` 是用于精确解析 `schema_ref` 的语法糖。

---

## 43.2 命题模式 (Proposition Pattern)

```prolog
?p (?subject, "works_for", ?org)
```

显式形式：

```prolog
?p PROPOSITION (?subject, "works_for", ?org)
```

已按身份获知的命题，**在同一个槽位**里按 id 寻址：

```prolog
?p PROPOSITION (id: :proposition_id)
```

这里的圆括号不是装饰。`( ... )` 就是命题表达式槽位，因此 id 形式在三元组能出现的任何位置都能出现——包括作为 `term` 端点，这正是「对陈述作陈述」时指名一个已存在命题的方式；也包括作为 `BELIEF` 的操作数（§46.1）：

```prolog
?meta (?p, "contradicts", (id: :other_proposition_id))
```

命题不是按字段匹配的记录：其规范身份即元组（§12.3），且不原生携带其它字段（§12.6）。因此 id 形式是一种可替换的**引用**，而非对象模式。

id 形式是**仅匹配 (match-only)** 的。凡以按结构解析或创建为职责的语句——`ENSURE PROPOSITION`，以及经由它脱糖的 `ASSERT` 语法糖——**必须**拒绝该形式，因为仅凭 id 无法创建出结构。

---

## 43.3 谓词变量 (Predicate variable)

```prolog
?p (?subject, ?predicate, ?object)
```

在原生 v2 中，`?predicate` 绑定确切的规范谓词引用。

---

## 43.4 断言模式 (Assertion Pattern)

```prolog
?a ASSERTION {
  proposition: ?p,
  asserted_by: ?actor,
  stance: "support",
  mode: "stated"
}
```

---

## 43.5 证据模式 (Evidence Pattern)

```prolog
?e EVIDENCE {
  evidence_class: "tool_result"
}
```

---

## 43.6 活动模式 (Activity Pattern)

```prolog
?act ACTIVITY {
  activity_class: "inference",
  status: "completed"
}
```

---

## 43.7 结构模式 (Structural Pattern)

```prolog
?edge STRUCTURAL (
  ?experience,
  "has_step",
  ?step
)
```

绑定的 `?edge` 是虚拟的结构查询状态，不一定是持久化的认知元素。

对于有序结构字段，`?edge.index` 暴露该引用当前从零开始的顺序 (§17.4)：

```prolog
ORDER BY ?edge.index ASC
```

---

# 44. KQL 表达式与子句 (KQL Expressions and Clauses)

## 44.1 点号路径表示法 (Dot notation)

示例：

```text
?x.id
?x.name
?x.attributes.summary
?a.lifecycle.status
?x._system.version
```

切面访问**可以**使用带方括号的确切/本地切面名称。

---

## 44.2 `FILTER` (过滤子句)

基线操作符**应当**包括：

```text
== != < > <= >=
&& || !
```

基线内置函数**应当**包括：

```text
IN
CONTAINS
STARTS_WITH
ENDS_WITH
REGEX
IS_NULL
IS_NOT_NULL
IS_LITERAL
IS_ELEMENT
IS_KIND
LITERAL_TYPE
```

它们是函数而非中缀操作符，必须以调用形式书写，例如 `FILTER(IN(?x.name, ["A", "B"]))`。

---

## 44.3 `NOT` (否定子句)

```prolog
NOT {
  ...
}
```

语义为：

> 在当前已授权的可见查询域中不存在匹配项。

它**严禁**被解释为客观世界层面的假。

---

## 44.4 `OPTIONAL` (可选匹配)

`OPTIONAL` 类似于左外连接样式的可选匹配。

空值结果代表无可见匹配，不代表为假。

---

## 44.5 `UNION` (并集分支)

`UNION` 表示备选的模式分支。

---

## 44.6 聚合操作 (Aggregation)

基线聚合函数：

```text
COUNT
COUNT(DISTINCT ...)
SUM
AVG
MIN
MAX
```

聚合计算**必须**在已授权的可见解集上执行。

分组是隐式的：`FIND` 列表中未被聚合的投影表达式构成分组键。聚合忽略空值输入，因此当某个分组内所有行均为空值时，`COUNT(?optional)` 返回 `0`。

`COUNT = 0` 不代表该命题为假。

---

## 44.7 排序子句 (Ordering)

```prolog
ORDER BY <expr> ASC|DESC [, ...]
```

多个排序键从左到右依次生效。

除非未来的显式语法另有规定，空值 (Null) **应当**默认排在最后。

---

## 44.8 分页子句 (Pagination)

```prolog
LIMIT :limit
CURSOR :cursor
```

KQL 分页游标**必须**为该次遍历保留单一规范认知快照。

引擎**必须**在同一次游标遍历内采用确定性的并列打破规则，使 `ORDER BY` 取值相同的解不会在翻页时重复或遗漏。

在翻页继续查询时，当前的治理权限仍然有效。

---

# 45. 原始路径查询 (Raw Path Queries)

**可以**保留 KIP 1 风格的原始命题路径操作符：

```prolog
(?x, "is_subclass_of"{0,5}, ?ancestor)
```

以及谓词备选项：

```prolog
(?x, "related_to" | "depends_on", ?y)
```

这些路径遍历的是存储的原始命题。

它们**严禁**自动传递信念/置信度。

---

# 46. BELIEF 模式 (BELIEF Pattern)

## 46.1 语法 (Syntax)

推荐形式：

```prolog
?belief BELIEF (
  ?subject,
  "predicate",
  ?object
)
```

或当命题变量已绑定时：

```prolog
?belief BELIEF (?p)
```

或当命题已按身份获知时（与 §43.2 相同的 id 形式）：

```prolog
?belief BELIEF (id: :proposition_id)
```

三元组形式只接受确切谓词，绝不接受原始路径（§45）：投影**不得**沿路径传播信念。

---

## 46.2 虚拟输出 (Virtual output)

`?belief` 是虚拟的认识论投影结果。

它不是持久化存储的核心状态。

---

## 46.3 有界目标 (Bounded target)

主语和谓词在执行投影前**必须**是可接地的或已绑定的。

无界限的全局大脑投影**应当**被拒绝。

---

## 46.4 完全接地的缺失命题 (Fully grounded missing Proposition)

针对完全接地的 BELIEF 查询，即使底层不存在持久化命题，**可以**直接返回：

```text
status = insufficient
proposition_id = null
```

读取操作**严禁**凭空创建该命题。

---

# 47. BELIEF SLOT (信念槽位)

## 47.1 语法 (Syntax)

```prolog
?slot BELIEF SLOT (
  ?subject,
  "predicate"
)
```

---

## 47.2 用途 (Purpose)

BELIEF SLOT 用于评估特定主语-谓词语义槽位的候选值/冲突集合。

---

## 47.3 输出结构 (Output)

概念结构：

```json
{
  "status": "accepted|contested|uncertain|insufficient",
  "accepted_values": [],
  "candidate_projections": [],
  "uncertainty": {},
  "policy": {},
  "temporal": {},
  "explanation": {}
}
```

---

## 47.4 空槽位 (Empty slot)

已接地的槽位**应当**返回：

```text
status = insufficient
accepted_values = []
```

而非强迫智能体从零行原始记录中自行推断未知状态。

---

# 48. KQL 时间模型 (KQL Time)

## 48.1 `AS OF` (认知时间点)

选择认知事务状态：

```prolog
AS OF SEQ 1500
```

`AS OF SEQ` 是唯一的历史坐标语法。若持有事务 ID 或挂钟时间戳，可通过 `DESCRIBE TRANSACTION` 或 `DESCRIBE SNAPSHOT AT TIME :t`（§68）将其解析为对应的 `seq` 序列号。

---

## 48.2 `FOR TIME` (世界有效时间)

为认识论投影指定现实世界有效时间：

```prolog
FOR TIME :world_time
```

---

## 48.3 独立性原则 (Independence)

```text
AS OF
    认知时间 (cognitive time)

FOR TIME
    现实世界有效时间 (world-valid time)
```

两者**必须**保持相互独立。

---

## 48.4 历史信念的区分 (Historical belief distinction)

KQL **必须**支持区分以下两者：

```text
大脑当时相信什么 (what the Brain believed then)
    AS OF historical cognitive state (基于历史认知状态)

大脑现在对当时的事实相信什么 (what the Brain now believes about then)
    current cognitive state + historical FOR TIME (基于当前认知状态 + 历史世界有效时间)
```

---

## 48.5 当前生效的治理规则 (Current Governance)

历史读取操作**必须**遵循当前调用者的授权状态。

**严禁**利用历史状态绕过当前的保密规则。

---

# 49. WITH EPISTEMIC (认识论参数子句)

推荐形式：

```prolog
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "low",
  policy: "optional-policy-id",
  include_historical: false,
  include_hypothetical: false,
  explanation: "summary"
}
```

---

## 49.1 解释等级 (Explanation levels)

推荐等级：

```text
none (无解释)
summary (摘要解释)
ledger (完整账本)
```

---

## 49.2 脱敏处理 (Redaction)

调用者**可以**被授权接收投影状态，但不被允许查看原始证据。

当解释/证据被脱敏时，返回结果**应当**显式披露。

---

# 50. KQL 结果上下文 (KQL Result Context)

KQL 响应**应当**标识：

```text
space_id (空间ID)
snapshot_seq (快照序列号)
schema_environment_version (Schema 环境版本)
resolved Epistemic Policy/version when used (生效的认识策略与版本)
world valid time when used (生效的现实世界有效时间)
materialized projection policy identity and snapshot basis when a cached projection is served (物化投射的策略身份与快照基准，见 §21.9)
```

该上下文可在后续作为决策依据完整保留。

---

# 51. KML — 认知变更语言 (Cognitive Mutation Language)

## 51.1 用途与定位 (Purpose)

KML 用于表达认知变更意图。

KML 变更仅能通过事务语义最终持久化生效。

---

## 51.2 核心变更族系 (Core mutation families)

推荐的原生族系：

```text
MUTATE (变更块)

CREATE CONCEPT (创建概念)
UPSERT CONCEPT (更新/插入概念)
ENSURE PROPOSITION (确保命题存在)

CREATE EVIDENCE (创建证据)
CREATE ASSERTION (创建断言)
CREATE ACTIVITY (创建活动)

ASSERT            (规范语法糖：ensure + assert, §55.1)

UPDATE (更新)

RETRACT ASSERTION (撤回断言)
SUPERSEDE ASSERTION (废弃替代断言)
CORRECT EVIDENCE (纠错证据)
TRANSITION ACTIVITY (迁移活动状态)

SET RETENTION (设置留存规则)
ARCHIVE (归档)
TOMBSTONE (墓碑标记)
PURGE (物理清除)
PURGE PAYLOAD (载荷清除)

MERGE CONCEPT (合并概念)
```

---

# 52. KML 变更语义 (KML Mutation Semantics)

## 52.1 CREATE (创建)

创建一个在历史上独立的元素，除非 `client_key` 证明其为对同一次逻辑创建的重试。

---

## 52.2 ENSURE (确保存在)

解析或创建结构上规范的对象。

用于命题 (Proposition)。

---

## 52.3 UPSERT (更新或插入)

解析具有稳定身份标识的可变概念，并应用合法的可变状态。

---

## 52.4 UPDATE (更新)

修改既有元素的合法可变字段。

UPDATE 绝不创建新元素。

---

## 52.5 TRANSITION (生命周期状态流转)

通过一条统一的语句流转生命周期状态；带引号的目标状态直接命名该动作：

```text
TRANSITION <target> TO "<state>" [BY <ref>]
           [SET FIELDS {...}] [SET STRUCTURAL {...}]
           [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v ...]
```

| 状态 | 目标类型 | `BY` 子句 | 动作语义 |
|---|---|---|---|
| `retracted` | Assertion | — | 断言者自身撤回该主张（§57.3） |
| `superseded` | Assertion | 必需：指明较新的 Assertion | 原主张被证明是错的；修订血统（§57.4） |
| `corrected` | Evidence | 必需：指明新的 Evidence | 证据记录有误；纠错血统（§57.2） |
| `running`, `completed`, `failed`, `cancelled` | Activity | — | 活动状态（§16）；`SET FIELDS` / `SET STRUCTURAL` 在同一语句中原子固化终态字段与拓扑 |
| `archived` | 任意元素 | — | 移出常规召回视图，历史完全保留（§60） |
| `tombstoned` | 任意元素 | — | 逻辑删除，身份标识与审计线索保留（§60） |

引擎会根据目标类型及其当前生命周期状态对流转动作进行合法性校验，若非法则直接报错 `InvalidLifecycleTransition`；迁移至目标当前已处于的状态产生 `no_effect`（§34.4）；协议不提供 `EXPECT STATE` 守卫（§35.3）。在 `superseded` / `corrected` 以外的状态上使用 `BY`，或在 Activity 状态以外使用 `SET FIELDS` / `SET STRUCTURAL`，均属于语法错误。该状态迁移记录在元素的 `_system.state` 中，并作为 `lifecycle` 条目写入变更信封（§36.1）。`ASSERT ... SUPERSEDING` 脱糖为此语句（§55.1）。

---

## 52.6 MERGE (合并)

执行非破坏性的概念身份整合。

---

## 52.7 有界选择 (Bounded selection)

凡 `WHERE` 块可能选中无界集合的变更语句，都接受一个紧随该 `WHERE` 之后的可选 `LIMIT`：

```text
UPDATE
TRANSITION
SET RETENTION
PURGE
PURGE PAYLOAD
```

一次匹配范围超出作者预期的维护性扫描，就是一次认知状态变更；在 `PURGE` 之下更是不可逆的变更。此类扫描因此**应当**设界。

`MERGE CONCEPT` 不接受 `LIMIT`：其源和目标已被显式命名，`WHERE` 仅用于守卫它们。

`LIMIT` 仅限制受影响的元素数量，并非选择顺序；因此除非运行时显式声明了特定顺序，否则绝不能假定对较大数据集的有界扫描是确定性顺序的。

---

## 52.8 子句顺序与守卫位置 (Clause order and guard position)

每条变更语句均以相同的顺序收尾：`[WHERE {...}] [LIMIT :n] {EXPECT VERSION ...}`。`EXPECT VERSION` 位于 `UPSERT CONCEPT` 的大括号闭合之后、`ENSURE PROPOSITION` 的元组之后；`PURGE` 和 `PURGE PAYLOAD` 的 `REFERENCE POLICY` / `CONFIRM "PURGE"` 子句位于守卫之后。守卫绝不夹在目标和动作之间。因此一条语句只有唯一指定的前置条件位置，读者在语句结尾处即可找到它们。

---

# 53. MUTATE 变更块 (MUTATE Block)

## 53.1 语法 (Syntax)

```prolog
MUTATE {
  ...
}
```

MUTATE 块是一个内聚的声明式变更计划。

作为独立的 KML 命令，它原子化执行。

---

## 53.2 本地句柄 (Local handles)

示例：

```prolog
CREATE EVIDENCE ?e {...}
ENSURE PROPOSITION ?p (...)
CREATE ASSERTION ?a {...}
```

句柄仅在 MUTATE 块本地有效。

它们不是持久化的全局 ID。

---

## 53.3 前向引用 (Forward references)

原生 v2 MUTATE **应当**允许本地前向引用。

引擎在提交之前**必须**解析并校验完整的变更图。

---

## 53.4 声明式语义 (Declarative semantics)

子句的源代码出现顺序**不应当**被用作隐式的“后者胜出 (last-write-wins)”机制。

针对同一既有目标的最终变更说明若存在冲突，**应当**执行失败。

---
# 54. CREATE / UPSERT CONCEPT (创建与更新概念)

## 54.1 CREATE (创建概念)

示例：

```prolog
CREATE CONCEPT ?exp {
  TYPE "Experience"
  CLIENT KEY :experience_key
  NAME "Deployment failure"

  SET ATTRIBUTES {
    goal: :goal,
    outcome_status: "failure"
  }

  SET FACET "MnemonicState" {
    memory_strength: 0.8,
    salience: 0.9
  }
}
```

---

## 54.2 UPSERT stable Concept (更新/插入稳定概念)

```prolog
UPSERT CONCEPT ?project {
  MATCH {
    type: "Project",
    key: "kip-2"
  }

  SET FIELDS {
    name: "KIP 2.0"
  }
}
```

---

## 54.3 原生身份选择器 (Native identity selector)

原生的 UPSERT **必须**使用稳定的身份标识，例如：

```text
id
key
```

严禁仅基于名称 (name-only) 执行全局 upsert。

---

## 54.4 MATCH 中的类型 (The MATCH type)

`MATCH` 是一个对象模式 (object pattern)，因此其中的 `type` 成员与概念模式 (§43.1)
中的 `type` 完全一致：它是确切 `schema_ref` 的 Schema 解析糖。它不是装饰，运行时
**必须**在 upsert 的两个环节中都遵循它：

```text
解析 (resolve)   type 参与身份寻址 (§7.3)
创建 (create)    type 是新概念 schema_ref 的唯一来源
```

若一次 upsert 将要创建概念却未声明类型，则**必须**失败，而不是铸造一个无类型的概念
(§10.3)。

若所声明的类型与解析到的元素不符，则视为未匹配。当选择器为 `key` 时，upsert 继续以
该类型创建；当选择器为 `id` 时，upsert 不能创建 (§53)，**必须**以存在性中立的方式失败，
且不得报告其所发现的类型。

---

# 55. ENSURE PROPOSITION (确保命题存在)

```prolog
ENSURE PROPOSITION ?p (
  :alice,
  "timezone",
  "+08:00"
)
```

运行时解析：

```text
确切谓词引用 (exact Predicate ref)
规范主语/宾语身份 (canonical subject/object identity)
类型化字面量 (typed Literal)
规范命题 (canonical Proposition)
```

仅通过 ENSURE 不会创建任何断言。

`ENSURE PROPOSITION ... EXPECT VERSION 0` 是仅创建形式（§35.2）：若规范命题已存在则失败，而不是解析到它。

示例中的谓词符号通过当前活动的 Schema 环境进行解析：`prefers` 与 `caused_by` 由认知记忆 Profile 定义，而领域事实（例如 `timezone`）则来自于已激活的领域模式包。

---

## 55.1 `ASSERT` 语法糖形式 (The `ASSERT` Sugar Form)

记录一条归属声明是记忆大脑最高频的认识写入操作。因此 KML 定义了一个**规范性语法糖语句**，使得在认识上保持诚实的方式同时也是最具人机工效的便捷路径：

```prolog
ASSERT ?a (:alice, "prefers", :dark_mode) {
  by: :alice,
  mode: "stated",
  confidence: 0.95,
  evidence: :msg
}
```

成员属性：

```text
by          必需 (REQUIRED)   语义行动主体      → asserted_by
mode        必需 (REQUIRED)   断言模式          → mode
stance      可选 (OPTIONAL)   默认 "support"    → stance
confidence  可选 (OPTIONAL)                     → confidence
at          可选 (OPTIONAL)   默认引擎事务时间  → asserted_at
valid       可选 (OPTIONAL)   {from, until}     → valid_time
evidence    可选 (OPTIONAL)   引用或数组        → role "support" 证据引用
key         可选 (OPTIONAL)                     → 断言 client_key
```

可选的废弃替代指示：

```prolog
ASSERT ?a (...) {...} SUPERSEDING :old_assertion
```

脱糖过程具有**规范性与确定性**：

```prolog
ENSURE PROPOSITION ?p (:alice, "prefers", :dark_mode)

CREATE ASSERTION ?a {
  CLIENT KEY :key
  SET FIELDS {
    proposition: ?p,
    asserted_by: :alice,
    stance: "support",
    mode: "stated",
    confidence: 0.95,
    asserted_at: :engine_time_unless_at_given
  }
  SET STRUCTURAL {
    ("evidence", :msg) {role: "support"}
  }
}

SUPERSEDE ASSERTION :old_assertion BY ?a
```

规则要求：

- `ASSERT` **必须**严格提交与其脱糖形式完全相同的语义；**严禁**产生额外或偏离的状态。
- 句柄是可选的；一旦指定，它将绑定新创建的断言。
- `ASSERT` **可以**作为独立语句出现，也可在 `MUTATE` 块内部使用。
- 脱糖后的各子句构成一个变更计划，而非彼此独立的多条命令：独立使用的 `ASSERT` **必须**如同这些子句同处于一个 `MUTATE` 块中一样整体提交 (§53.1)；位于 `MUTATE` 内部时，它们并入外层计划。
- 语法糖支持属于完整的 KIP-KML 合规 Profile (§97)。

---

# 56. CREATE EVIDENCE / ASSERTION / ACTIVITY (创建证据、断言与活动)

## 56.1 证据 (Evidence)

```prolog
CREATE EVIDENCE ?e {
  CLIENT KEY :e_key

  SET FIELDS {
    evidence_class: "user_statement",
    payload: :payload,
    observed_at: :time
  }
}
```

---

## 56.2 断言 (Assertion)

```prolog
CREATE ASSERTION ?a {
  CLIENT KEY :a_key

  SET FIELDS {
    proposition: ?p,
    asserted_by: :alice,
    stance: "support",
    mode: "stated",
    confidence: 1.0,
    asserted_at: :time
  }

  SET STRUCTURAL {
    ("evidence", ?e) {role: "support"}
  }
}
```

---

## 56.3 活动 (Activity)

```prolog
CREATE ACTIVITY ?act {
  CLIENT KEY :act_key

  SET FIELDS {
    activity_class: "inference",
    started_at: :time,
    ended_at: :time,
    status: "completed"
  }

  SET STRUCTURAL {
    ("inputs", :input)
    ("outputs", ?a)
  }
}
```

---

# 57. KML 修订规则 (KML Revision Rules)

## 57.1 信念修订 (Belief revision)

正确模式：

```text
新证据 (new Evidence)
+
新断言 (new Assertion)
+
可选的废弃替代 (optional supersession)
+
活动 / 溯源记录 (Activity/provenance)
```

不得直接重写旧断言的置信度、立场或取值。

---

## 57.2 证据纠错 (Evidence correction)

正确模式：

```text
新证据 (new Evidence)
+
CORRECT EVIDENCE old BY new
```

不得直接覆盖旧证据的载荷数据。

---

## 57.3 撤回 (Retraction)

```prolog
RETRACT ASSERTION :a
EXPECT STATE "active"
```

撤回操作如实保留历史载荷。

---

## 57.4 废弃替代 (Supersession)

```prolog
SUPERSEDE ASSERTION :old BY ?new
```

**严禁**仅仅因为另一主体持不同意见就使用废弃替代。

---

## 57.5 修订与派生认知 (Revision and derived cognition)

废弃替代或撤回断言、纠错证据，改变的是认识投影的计算输出。这一操作不会自动修改或撤销由此溯源根节点所派生出的认知：在原主张有效期间构建的洞察、偏好摘要、编译后技能或自我模型，依然保持活跃状态。

运行时**严禁**仅因某个溯源根节点被修订，就自动撤回、自动归档或自动改写下游派生认知。派生元素是否随根节点变动而失效，属于认知层面的复审决策，而非协议层的硬性规则。

运行时**应当**为这类复审提供完备的机制支持。在支持 `LIST DEPENDENTS`（§63.5）的环境中，被修订根节点的下游派生认知可通过单次操作完整发现；在发生实质性修订后，Brain **应当**对这些依赖项发起复审。认知记忆 Profile 提供了 `DerivationState` Facet 与 `review_derived` 维护任务类别，用于跟踪并记录复审结果。

---

# 58. 通用 UPDATE (Generic UPDATE)

推荐形式：

```prolog
UPDATE ?target
EXPECT VERSION :version

SET FIELDS {...}
SET ATTRIBUTES {...}
SET FACET "Facet" {...}
SET STRUCTURAL {...}
UNSET ATTRIBUTES {...}
UNSET FACET "Facet" {...}
UNSET STRUCTURAL {...}

WHERE {
  ...
}

LIMIT :limit
```

目标要么是由 `WHERE` 块绑定的变量，要么是直接引用。直接引用（`:id` / `"id"`）已经指名了元素，因此**可以**省略 `WHERE`——与 `ARCHIVE`、`TOMBSTONE`、`PURGE`、`SET RETENTION`、`RETRACT ASSERTION` 一致；即便给出 `WHERE`，它也只起守卫作用：

```prolog
UPDATE :experience_id
SET FACET "MnemonicState" {salience: 0.9}
```

---

## 58.1 非法 UPDATE 目标 (Illegal UPDATE targets)

通用 UPDATE **严禁**修改：

```text
命题元组 (Proposition tuple)
断言历史认识载荷 (Assertion historical epistemic payload)
证据载荷 (Evidence payload)
已完成活动的溯源拓扑 (completed Activity provenance topology)
_system 内部系统字段
治理受保护字段 (Governance protected fields)
Schema 环境配置 (Schema Environment)
```

---

## 58.2 认识修订诊断 (Epistemic revision diagnostic)

当客户端尝试直接修改不可变的断言信念历史时，运行时**应当**返回语义错误代码，例如：

```text
EpistemicRevisionRequired
```

---

# 59. KML 更新表达式 (KML Update Expressions)

可变/Profile 数值状态**可以**支持确定性表达式，例如：

```text
ADD
MUL
CLAMP
COALESCE
```

表达式针对每个目标元素**必须**具备确定性。

---

## 59.1 记忆衰减 (Mnemonic decay)

记忆代谢机制**可以**降低：

```text
memory_strength (记忆强度)
```

但**不应当**仅仅因为时间流逝就定期衰减历史断言的置信度。

时间相关性由认识论投影负责处理。

---

# 60. 归档、墓碑与清除 (Archive / Tombstone / Purge)

推荐语法：

```text
SET RETENTION <target> {retention_class: "...", expires_at: ...}
                       [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v ...]
TRANSITION    <target> TO "archived"   [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v ...]
TRANSITION    <target> TO "tombstoned" [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v ...]
PURGE         <target> [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v ...]
                       [REFERENCE POLICY "..."] CONFIRM "PURGE"
PURGE PAYLOAD <evidence> [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v ...] CONFIRM "PURGE"
```

`<target>` 遵循与通用 UPDATE 相同的规则：`?variable` 目标由 `WHERE` 块绑定，而 `:parameter` / `"id"` 已经直接指明元素，因而**可以**省略 `WHERE`。

---

## 60.1 归档 `archived` (Archive)

将元素移出常规 Recall 召回与活跃检索视图。

历史完全保留，且仍可通过时间旅行 `AS OF SEQ`（§48）访问。

---

## 60.2 逻辑墓碑 `tombstoned` (Tombstone)

逻辑删除。

保留：

```text
元素身份标识 (id / key)
Schema 符号类型 (schema_ref)
墓碑生命周期标记 (tombstoned state)
历史审计记录 (audit trail)
```

载荷在逻辑上不可用。

---

## 60.3 物理清除 `PURGE` (Purge)

物理擦除。属于受严格控制的破坏性操作。

要求提供显式的 `CONFIRM "PURGE"` 确认，并遵循引用的处理策略：

```text
deny_if_referenced       若存在外部引用则拒绝清除
tombstone_reference      将引用方置为墓碑
authorized_cascade       在显式授权下级联清除引用方
```

设置了 `retention.legal_hold`（§19.1）的元素**严禁**被清除。由于保全状态会阻止所有人的清除，设置或解除保全的权限绝不能通过普通认知写入触达。

---

## 60.4 移除操作梯度分级 (Removal ladder)

推荐遵循降级阶梯：

```text
归档 (archived)
    ↓
逻辑墓碑 (tombstoned)
    ↓
物理清除 (purge)
```

---

## 60.5 留存与清理的区别 (Retention vs Purge)

留存（retention）通过策略声明生命周期预期；清除（purge）是实际执行的物理擦除动作。

---

## 60.6 载荷清除 `PURGE PAYLOAD` (Payload purge)

`PURGE PAYLOAD` 彻底抹除 Evidence 元素的字节数据，同时完整保留元素记录本身。

执行载荷清除后，该 Evidence 记录保留：

```text
元素身份标识与生命周期状态
evidence_class 证据分类
content_digest 内容哈希摘要
media_type 媒体类型
observed_at 观测时间戳
source / generated_by 来源与生成活动引用
来自断言的引用证据边
```

其载荷被标记为已清除（purged）；原始字节数据 —— 内联内容或由 `content_ref` 引用的运行时内容 —— 被物理销毁且无法恢复。

规则：
- 目标**必须**是 Evidence；其他类型的元素没有载荷可清除。
- **必需**提供 `CONFIRM "PURGE"`：字节销毁是不可逆的。
- 载荷清除需要 `purge` 权限；治理策略**可以**将载荷清除与元素清除分别授权。
- `legal_hold` 法律保全同样阻止载荷清除。
- **不包含** `REFERENCE POLICY` 子句：因为 Evidence 记录本身存留，不会产生悬空引用。
- 载荷清除在事务中属于普通的状态变更变更操作；对已清除的载荷执行清除返回 `no_effect`。
- 佐证聚类与独立性统计（§23）继续基于存留的摘要和溯源信息运作；载荷清除**绝不能**破坏它们。
- 认知投影策略**可以**权衡可审查内容的缺失，但证据事件本身依然真实存在。
- 清除仅触及当前 Space 持有的字节。在清除前导出的胶囊依然携带载荷并能通过核验；Space 无法收回该胶囊。清除后导出的胶囊携带标记为 `payload: {status: "purged"}` 的记录与 `content_digest`，其自身的摘要和签名基于 Space 实际持有的内容计算。

载荷清除是实现数据最小化的核心工具：Space 可以在提取消化信息后丢弃观测到的原始字节，而无需销毁证据事件本身、其被引用关系或其溯源角色。元素清除（§60.3）仍是销毁记录本身的唯一手段。

---

# 61. MERGE CONCEPT (合并概念)

推荐形式：

```prolog
MERGE CONCEPT ?source INTO ?target
WHERE {
  ?source {id: :source_id}
  ?target {id: :target_id}
}
```

合并操作**必须**遵循前文定义的非破坏性身份语义。

---

# 62. 外部行动 (External Actions)

KML **严禁**暗示对现实世界外部行动具备原子级回滚能力。

不要将：

```text
发送邮件 (email send)
资金转账 (money transfer)
远程 HTTP 外部副作用 (remote HTTP side effect)
代码部署 (deployment)
```

置于 KIP 的原子性假设内部。

推荐的交互模式：

```text
事务 1 (Transaction 1)
    决策 + 行动意图 (Decision + ActionIntent)

外部运行时 (external runtime)
    执行具体行动 (performs action)

事务 2 (Transaction 2)
    结果证据 + 活动 + 经验 (Outcome Evidence + Activity + Experience)
```

该交互模式对应的返回闭环即后果通道：外部结果以结果证据（§15.7）的形式返回，由仪器化组件写入，绝不由其行动正被评定的当事主体写入。

---

# 63. META — 自省与接地 (Introspection and Grounding)

## 63.1 用途与定位 (Purpose)

META 是只读的自描述、接地、运行时历史、验证、校验、预览与导出层。

---

## 63.2 只读约束 (Read-only)

META **严禁**直接修改认知、治理或模式状态。

在认知状态外部记录预览/安全审计日志不改变该语义分类。

---

## 63.3 META 命令族系 (META families)

推荐命令：

```text
DESCRIBE
LIST
SEARCH
VERIFY
VALIDATE
PREVIEW
HISTORY
CHANGES
SNAPSHOT
EXPORT CAPSULE
```

`DESCRIBE` 的自省目标：

```text
PRIMER | PROTOCOL | EXECUTION CONTEXT | CAPABILITIES
SPACE | SCHEMA ENVIRONMENT | PACKAGE | TYPE | PREDICATE | FACET
STRUCTURAL FIELD | COMPATIBILITY | ERROR | TRANSACTION | SNAPSHOT
CAPSULE | EPISTEMIC POLICY | PROJECTION CAPABILITY | TRUST | ACCESS
```

`LIST` 的枚举目标：

```text
SPACES | SCHEMA PACKAGES | TYPES | PREDICATES | FACETS
STRUCTURAL FIELDS | EPISTEMIC POLICIES | DEPENDENTS
```

`LIST` 支持 `LIMIT` / `CURSOR` 分页。

---

## 63.4 EXPORT CAPSULE (导出胶囊)

推荐语法：

```text
EXPORT CAPSULE ?roots
WHERE {
  ...
}
[WITH {
  closure: "...",
  provenance_depth: ...,
  include_schema: true,
  include_blobs: false,
  proof_profile: "..."
}]
[AS OF SEQ :seq | AS OF TX :tx | AS OF TIME :time]
```

操作数指定了**选定根绑定 (selection root binding)**：所有通过 `WHERE` 块绑定到 `?roots` 的元素均属于导出根集合。操作数也可以是指定单个根元素的参数或字符串，此时 `WHERE` 块仅用于约束该根元素。

`WHERE` 是**必需**的，且**必须**至少包含一条选定模式：无边界的导出不构成胶囊。`closure` 使用 §40.3 定义的取值。

生成的胶囊包含根集合加上 `WITH` 中声明的闭包，受治理策略及 §41.1 的快照一致性规则约束。结果是一个胶囊构件 (§85)；不修改任何认知状态。

---

## 63.5 LIST DEPENDENTS (列举依赖方)

推荐语法：

```text
LIST DEPENDENTS :id
  [DEPTH :n]
  [LIMIT :limit]
  [CURSOR :cursor]
```

`LIST DEPENDENTS` 枚举从某一元素派生出的认知，方式是沿派生方向对溯源拓扑做有界遍历：

```text
X ∈ Activity.inputs
    → 该 Activity
    → 其 outputs 中的每个元素
```

每个输出都是 `X` 在距离 1 上的依赖方；遍历从每个依赖方继续，直到 `DEPTH`（默认为 1）。运行时**可以**额外遍历当前模式环境中被记载为派生谱系的结构字段。每个此类字段都须按「由根节点指向派生制品」的方向遍历，而各字段的声明方向并不一致：声明为「派生制品 → 根节点」的字段（认知记忆 Profile 中的 `derived_from`、`compiled_from`）须反向遍历——`X` 的依赖方是那些字段引用了 `X` 的元素；声明为「根节点 → 派生制品」的字段（`consolidated_to`）则须正向遍历。方向取反将得到该元素的来源，而非它的依赖方。

结果行**应当**携带依赖方的精确 id、类型 (kind)、距离，以及抵达它所经过的 Activity（或结构字段）。

规则：

- `LIST DEPENDENTS` 是读取操作；**严禁**改变任何元素。
- 治理逐行生效：调用方无权发现的元素被省略，且省略与不存在不可区分 (§30.4)。
- 遍历有界：运行时**可以**限定 `DEPTH` 上限，并像其他 `LIST` 目标一样通过 `LIMIT` / `CURSOR` 分页。
- 可达性只是溯源拓扑，不是判断：被列出的依赖方并不因此就是过期的、错误的或需要修改的 (§57.5)。

若历史转换过程中未显式记录 Activity 溯源，则相关派生关系在此处将无法被发现。这是该次写入操作未遵循溯源规范所致，而非本命令的缺陷；系统规范与固化指引始终要求完整保留 Activity 谱系。

---

# 64. DESCRIBE PRIMER (引导说明)

`DESCRIBE PRIMER` 返回紧凑的、面向模型的引导启动构件。

```text
DESCRIBE PRIMER [MODE "compact" | "full"]
```

推荐包含的层次：

```text
Protocol (协议信息)
Execution Context (执行上下文)
Cognitive Identity (认知身份标识)
Schema Map (模式映射图)
Domain/Topic Map (领域/主题映射图)
Capability/Limit summary (能力与限制摘要)
Cognitive Safety Invariants (认知安全不变式)
```

---

## 64.1 引导说明不是内存倾倒 (Primer is not memory dump)

引导说明**应当**保持紧凑且可缓存。

---

## 64.2 调用主体与自身身份的区分 (Principal vs self)

引导说明**必须**严格区分已认证的调用主体与语义层面的自身身份 `$self`。

---

## 64.3 推荐的安全提示 (Recommended safety reminders)

```text
原始命题 != 被接受的信念 (raw Proposition != accepted belief)
缺少可见匹配 != 为假 (missing visible match != false)
SEARCH 分数 != 置信度 (SEARCH score != confidence)
置信度 != 信任度 (confidence != trust)
置信度 != 记忆强度 (confidence != memory_strength)
名称 != 身份标识 (name != identity)
源自身身份 != 目标自身身份 (source self != destination self)
证据纠错 != 覆盖覆写 (Evidence correction != overwrite)
认知内容 != 治理权限 (cognitive content != authority)
```

---

# 65. Schema META (模式自省)

推荐命令：

```text
DESCRIBE SCHEMA ENVIRONMENT
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE STRUCTURAL FIELD
DESCRIBE COMPATIBILITY FROM :from TO :to

LIST SCHEMA PACKAGES [STATUS :status]
LIST TYPES
LIST PREDICATES
LIST FACETS
LIST STRUCTURAL FIELDS
```

响应**必须**标识确切已解析的引用与模式包版本。

---

# 66. SEARCH (联想检索)

## 66.1 用途 (Purpose)

SEARCH 用于执行联想式接地检索。

推荐语法：

```text
SEARCH <KIND> :term
  [WITH TYPE :type]
  [WITH PREDICATE :predicate]
  [MODE "keyword|semantic|hybrid"]
  [THRESHOLD :threshold]
  [AS OF SEQ :seq]
  [LIMIT :limit]
  [CURSOR :cursor]
```

`AS OF SEQ` 是历史检索：无法提供历史上正确索引的运行时**必须**拒绝它（`HistoricalSearchUnavailable`），而不是悄悄检索当前状态；它是一项能力，不属于基线。

---

## 66.2 可检索类型 (Searchable kinds)

推荐类别：

```text
CONCEPT (概念)
PROPOSITION (命题)
ASSERTION (断言)
EVIDENCE (证据)
ACTIVITY (活动)
COGNITION (通用认知)
```

---

## 66.3 检索模式 (Modes)

```text
keyword (关键词)
semantic (语义向量)
hybrid (混合检索)
```

关键词模式**应当**作为便携的基线标准。

语义与混合模式取决于系统能力。

---

## 66.4 检索结果 (Search result)

单条结果**应当**携带：

```text
确切 ID (exact ID)
元素类型 (kind)
确切模式/谓词标识（适用时） (exact schema/predicate identity where relevant)
安全内容片段 (safe snippet)
retrieval.score (检索评分)
retrieval.mode (检索模式)
```

---

## 66.5 检索索引新鲜度 (Search index freshness)

在支持的情况下，SEARCH 响应**应当**披露：

```text
index_seq (索引序列号)
current_space_seq when safe (安全时的当前空间序列号)
consistency class (一致性级别)
ranking method/score semantics (排序方法与评分语义)
```

---

## 66.6 未检索到 (Search miss)

未检索到**严禁**被用来证明规范不存在。

正确性敏感的存在性检查应使用 KQL 或事务约束。

---

## 66.7 派生召回表面 (Derived recall surfaces)

SEARCH 索引新鲜度 (§66.5) 是通用规则的一个实例。

任何派生的召回表面 —— 包括搜索索引、物化投影 (§21.9)、Profile 召回缓存 —— **应当**声明其相对于 `space_seq` 的序列坐标新鲜度，且在其并非事务快照一致时**严禁**伪装为一致 (§79)。

---

# 67. Capabilities (能力协商)

`DESCRIBE CAPABILITIES` 是主要的运行时特性协商接口。

它**应当**区分：

```text
supported (支持的特性)
available (可用的特性)
limits (配额限制)
```

---

## 67.1 支持的特性 (Supported)

运行时/记忆空间在技术上实现了该特性。

---

## 67.2 可用的特性 (Available)

当前调用主体至少在某些受许可的作用域内可以请求使用该能力。

它不是授权列表倾倒，也不代表无限制的授权。

---

## 67.3 能力详情可被脱敏 (Capability detail may be redacted)

能力列表枚举本身受到治理规则控制。

---

## 67.4 能力注册表 (Capability registry)

`DESCRIBE CAPABILITIES` 会通告、且请求中的 `requires`（§71）可声明本注册表中的条目。运行时**可以**添加命名空间化的条目；**严禁**重命名以下标准能力：

```text
serializable_isolation      §32.2
idempotency_retention       §34.5   取值：留存窗口时长，例如 {"seconds": 86400}
historical_reads            §48, §100
historical_search           §66.1
semantic_search             §66.3
hybrid_search               §66.3
search_index_freshness      §66.5
belief_slot                 §47
weighted_projection         §22, §27.3   超出结构化基准（§21.10）的信任加权策略
materialized_projection     §21.9
signed_receipts             §33.3
ingestion_context           §71.1
streaming                   §84
artifacts                   §85
change_stream               §36, §68
filtered_delivery           §36.3
watch_evaluation            运行时求值的 Watch 条件（认知记忆 Profile §5.11）
list_dependents             §63.5
payload_purge               §60.6
capsule_export              §63.4
capsule_import              §39
capsule_signatures          §37.8
derive_permission           §29.6
record_outcome_permission   §29.8
```

请求的 `requires` 中若声明了未注册的能力，将报错 `UnsupportedCapability`，处理方式与声明了运行时不支持的能力相同。

---

# 68. META 事务与历史 (META Transaction / History)

推荐命令：

```text
DESCRIBE TRANSACTION :tx_id
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
DESCRIBE SNAPSHOT [AS OF SEQ :seq | AT TIME :t]
HISTORY ELEMENT :id [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
HISTORY SPACE [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
CHANGES SINCE :cursor [LIMIT :n]
CHANGES AFTER SEQ :seq [LIMIT :n]
```

---

## 68.1 HISTORY 与 KQL AS OF 的区别 (HISTORY vs KQL AS OF)

```text
HISTORY
    状态跃迁编年史 (transition chronology)

KQL AS OF
    历史认知内容 (historical cognitive content)
```

---

## 68.2 当前生效的治理规则 (Current Governance)

历史自省遵循当前的授权状态。

---

# 69. VERIFY / VALIDATE / PREVIEW (验证、校验与预览)

这些术语具有截然不同的规范性含义。

---

## 69.1 验证 `VERIFY` (VERIFY)

```text
VERIFY CAPSULE | SCHEMA PACKAGE | RECEIPT | BLOB | CHECKPOINT <artifact>
```

检查：

```text
完整性 (integrity)
摘要匹配 (digest)
签名 / 证明 (signature/proof)
运行时认证一致性 (runtime attestation consistency)
```

VERIFY 不负责建立信任度或证明真实性。

---

## 69.2 校验 `VALIDATE` (VALIDATE)

```text
VALIDATE KQL | KML | CAPSULE | SCHEMA PACKAGE | IMPORT PLAN <input> [WITH {...}]
```

在不提交的前提下检查：

```text
协议合法性 (protocol legality)
核心层结构 (Core structure)
Schema 约束规则 (Schema constraints)
引用一致性 (reference consistency)
静态 / 上下文合法性 (static/contextual legality)
```

VALIDATE 不构成状态预留。

---

## 69.3 预览 `PREVIEW` (PREVIEW)

在不提交/不预留的前提下，在当前目标系统的上下文环境下模拟效果：

```text
Governance (治理策略)
Schema (模式环境)
identity mapping (身份映射)
current state (当前状态)
```

---

## 69.4 提交 `Commit` (Commit)

唯有成功的事务收据 (Transaction Receipt) 方可确立持久化的状态变更。

---
# 70. 协议运行时 (Protocol Runtime)

## 70.1 传输层中立性 (Transport neutrality)

KIP 运行时可以绑定到以下传输介质：

```text
MCP
HTTP
本地 API (local API)
IPC (进程间通信)
WebSocket
容器调用 (canister calls)
其他经过认证的传输通道 (other authenticated transports)
```

可观测的 KIP 语义**必须**保持完全等价。

---

## 70.2 基线序列化格式 (Baseline serialization)

JSON 是基线的逻辑请求/响应格式。

JSON 文本**必须**采用 UTF-8 编码。

**应当**拒绝包含重复 JSON 键的对象。

---

# 71. 请求外壳 (Request Envelope)

推荐形式：

```json
{
  "kip": "2.0",
  "request_id": "req-...",

  "space": {
    "id": "space-1"
  },

  "execution": {
    "mode": "atomic",
    "isolation": "serializable",
    "idempotency_key": "logical-write-key"
  },

  "operations": [
    {
      "op_id": "op-1",
      "language": "KML",
      "command": "...",
      "parameters": {}
    }
  ],

  "context": {
    "purpose": "answer_user",
    "risk": "low"
  },

  "requires": {},

  "options": {
    "deadline_ms": 10000
  }
}
```

---

## 71.1 摄入上下文 (Ingestion Context)

观测到的源材料**应当**在**不经过模型生成的命令文本**的前提下直接进入证据。

请求**可以**携带一个摄入上下文：

```json
{
  "kip": "2.0",
  "ingest": {
    "evidence": [
      {
        "key": "msg",
        "evidence_class": "user_statement",
        "payload": "I prefer dark mode.",
        "media_type": "text/plain",
        "observed_at": "2026-08-14T01:00:00Z",
        "source_actor": {"id": "concept-alice"},
        "client_key": "message:msg-123"
      }
    ]
  },
  "operations": [
    {
      "language": "KML",
      "command": "ASSERT (:alice, \"prefers\", :dark_mode) { by: :alice, mode: \"stated\", evidence: :msg }"
    }
  ]
}
```

语义规则：

- 对于每个条目，运行时根据声明的字段和传输层提供的内容（内联 `payload`，或 `payload_artifact` 句柄），在请求的事务作用域内铸造一个证据元素。条目**必须**恰好声明 `payload` / `payload_artifact` 之一。
- 每个 `key` 都作为请求参数绑定，其值为铸造出的证据引用；命令以 `:key` 形式引用它（例如 `ASSERT` 中的 `evidence: :msg`）。
- 铸造出的证据承载正常的 `_system.origin`；`client_key` 提供重试安全的逻辑标识。
- 摄入具有事务性：若事务中止，不会持久化创建任何证据。

证据保真度规则：运行时**应当**提供摄入（或构件句柄），以便从传输外壳中捕获观测到的载荷；智能体**不应当**在 KML 文本中重新手工录入观测内容 (§88.12)。

---

# 72. 运行时身份标识字段 (Runtime Identity Fields)

## 72.1 `request_id` (请求ID)

标识单次传输/执行尝试。

---

## 72.2 `idempotency_key` (幂等键)

标识单一逻辑变更意图。

---

## 72.3 `tx_id` (事务ID)

引擎分配的事务客观事实标识。

规范性区分：

```text
request_id (请求ID)
    ≠
idempotency_key (幂等键)
    ≠
tx_id (事务ID)
```

---

# 73. 操作对象 (Operation)

推荐形式：

```json
{
  "op_id": "op-1",
  "language": "KQL|KML|META",
  "command": "...",
  "parameters": {},
  "idempotency_key": null
}
```

`op_id` 在请求内部本地有效。

---

## 73.1 语言语义分类 (Language classification)

运行时**必须**解析并识别真实的命令语义。

调用方提供的语言标签不能将写入操作降级为只读语义。

---

# 74. 参数绑定 (Parameter Binding)

参数**必须**进行结构化绑定，严禁使用简单的字符串插值拼接。

参数必须占据完整的合法取值语法位置。

示例：

```prolog
?person {id: :person_id}
LIMIT :limit
FOR TIME :world_time
```

参数属于数据，而非代码。

---

# 75. 执行模式 (Execution Modes)

原生多操作请求**必须**显式指定以下执行模式之一：

```text
independent (独立执行)
sequence (顺序执行)
atomic (原子执行)
```

除非请求中仅包含单个操作。

---

## 75.1 独立模式 `independent` (independent)

```text
操作在语义上相互独立
可以并发执行
采用独立的快照
生成独立的写入事务
失败影响在操作级别相互隔离
```

---

## 75.2 顺序模式 `sequence` (sequence)

```text
操作按顺序依次启动
每个状态变更操作单独提交
后续操作能够看到先前已提交的效果
先前的提交不会发生回滚
```

`on_error` **可以**设置为：

```text
stop (遇错停止)
continue (遇错继续)
```

---

## 75.3 原子模式 `atomic` (atomic)

```text
单一事务处理
单一起始快照
读自身写入保障
全有或全无原子提交
单一 tx_id
单一状态变更 space_seq
```

---

## 75.4 批处理不等于事务 (Batch is not Transaction)

```text
operations[] 列表
    ≠
原子事务 (atomic transaction)
```

除非显式指定了 `execution.mode = atomic`。

---

# 76. 只读运行时端点 (Readonly Runtime)

KIP **应当**暴露一个专门的只读执行通道，概念上等价于：

```text
execute_kip_readonly
```

在获得授权的前提下，它**可以**接收：

```text
KQL
META
VERIFY
VALIDATE
PREVIEW
HISTORY
CHANGES
SNAPSHOT
EXPORT CAPSULE
```

它**必须**严格拒绝任何具有状态变更语义的操作。

---

# 77. 通用运行时端点 (General Runtime)

具备状态处理能力的端点在概念上等价于：

```text
execute_kip
```

**可以**执行 KQL/KML/META。

实际的权限由治理规则统一控制。

---

# 78. 快照令牌 (Snapshot Tokens)

运行时/META **可以**签发不透明的 `snapshot_token`。

该令牌绑定了一个可读的认知状态坐标。

它不是权限令牌。

当前生效的治理规则始终处于主导地位。

---

# 79. SEARCH 与事务快照一致性 (SEARCH and Transaction Snapshots)

存在数据延迟的语义/向量 SEARCH 索引在不一致时**严禁**被伪装为事务快照一致。

若在请求的原子事务中无法保证与快照对齐的 SEARCH，运行时**必须**：

```text
拒绝执行 (reject)
或
显式要求客户端请求更弱的一致性能力 (explicitly require weaker capability requested by client)
```

严禁静默伪造更强的一致性保证。

---

# 80. 超时期限与结果不确定性 (Deadlines and Outcome Uncertainty)

## 80.1 超时期限 (Deadline)

客户端**可以**指定超时/取消选项。

---

## 80.2 超时不等于事务中止 (Timeout is not abort)

规范性原则：

```text
客户端超时 (client timeout)
    ≠
事务已中止 (transaction aborted)
```

---

## 80.3 结果未知 (Outcome unknown)

若写入操作可能已经提交，但响应路径无法确切获取最终结果：

```text
top-level status = outcome_unknown
```

或**应当**使用等价的传输层恢复信号。

---

## 80.4 故障恢复 (Recovery)

客户端**应当**：

```text
通过幂等键查找事务状态
或
使用相同的幂等键重试完全相同的逻辑请求
```

**严禁**仅仅因为丢失了响应就创建全新的逻辑变更请求。

---

# 81. 响应外壳 (Response Envelope)

推荐形式：

```json
{
  "kip": "2.0",
  "request_id": "req-...",
  "status": "succeeded",

  "execution": {
    "mode": "atomic"
  },

  "results": [
    {
      "op_id": "op-1",
      "status": "succeeded",
      "result": {},
      "context": {}
    }
  ],

  "context": {
    "space_id": "space-1"
  },

  "snapshot": null,
  "receipt": null,
  "warnings": []
}
```

---

# 82. 顶级执行状态 (Top-Level Status)

推荐状态：

```text
succeeded (成功)
failed (失败)
partial (部分成功)
outcome_unknown (结果未知)
```

---

# 83. 操作执行状态 (Operation Status)

推荐状态：

```text
succeeded (成功)
failed (失败)
skipped (已跳过)
rolled_back (已回滚)
no_effect (无实际效果)
```

---

## 83.1 已回滚 `rolled_back` (rolled_back)

在原子事务中止之前，某操作可能已经在该事务中暂存执行。

`rolled_back` 表明最终未产生任何持久化状态。

---

# 84. 流式传输 (Streaming)

流式传输是**可选 (OPTIONAL)** 的。

运行时**可以**对以下内容进行流式传输：

```text
大规模 KQL 查询结果 (large KQL results)
SEARCH 检索结果
HISTORY 历史记录
CHANGES 变更记录
Capsule 胶囊字节流
```

---

## 84.1 数据帧类别 (Frames)

推荐帧类别：

```text
start (开始帧)
data (数据帧)
warning (警告帧)
progress (进度帧)
final (结束帧)
error (错误帧)
```

---

## 84.2 进度不等于已提交 (Progress is not commit)

在最终事务结果确立之前，写入流**严禁**将暂存变更呈现为已持久化。

规范原则：

```text
进度 (Progress)
    ≠
提交 (Commit)
```

---

## 84.3 变更流原子性 (Change Stream atomicity)

即便传输字节进行了分片，单一变更外壳始终代表一次单一逻辑事务。

---

# 85. 构件句柄 (Artifact Handles)

## 85.1 用途 (Purpose)

大型构件**可以**通过不透明的运行时 ArtifactRef/句柄进行传递。

示例：

```text
Capsule (胶囊)
Schema Package (模式包)
Evidence blob (证据 Blob)
proof bundle (证明包)
large export (大规模导出)
```

---

## 85.2 句柄的不透明性 (Handle is opaque)

构件句柄**严禁**被解释为：

```text
文件系统路径 (filesystem path)
URL 地址
全局认知 ID (global cognitive ID)
胶囊内容身份标识 (Capsule content identity)
```

---

## 85.3 内容身份标识 (Content identity)

可移植构件的身份标识**应当**使用密码学哈希摘要。

---

## 85.4 上传不等于导入 (Upload is not import)

将胶囊字节上传/暂存到运行时中并不代表将其中的认知导入到记忆空间中。

---

## 85.5 严禁自动拉取 URL (No automatic URL fetch)

**严禁**将任意 URL 自动解引用作为构件内容拉取。

网络访问需要显式独立的系统能力与策略许可。

---

# 86. 错误模型 (Error Model)

## 86.1 错误结构 (Error shape)

推荐形式：

```json
{
  "code": "SchemaSymbolAmbiguous",
  "category": "schema",
  "message": "...",
  "hint": "...",

  "retry": {
    "class": "requires_different_input"
  },

  "details": {}
}
```

---

## 86.2 错误分类体系 (Error categories)

推荐类别：

```text
syntax (语法错误)
protocol (协议错误)
schema (模式错误)
data (数据错误)
epistemic (认识模型错误)
governance (治理权限错误)
transaction (事务错误)
history (历史记录错误)
search (检索错误)
artifact (构件错误)
resource (资源错误)
transport (传输错误)
system (系统错误)
```

---

## 86.3 重试分类体系 (Retry classes)

推荐类别：

```text
safe_same_request (可使用相同请求安全重试)
requires_refresh (需刷新状态后重试)
requires_different_input (需修改输入参数后重试)
requires_authority (需提升权限后重试)
requires_new_snapshot (需基于新快照重试)
requires_reacquire_artifact (需重新获取构件后重试)
outcome_lookup_required (必须先查询最终事务结果)
non_retryable (不可重试)
```

---

## 86.4 存在性中立错误 (Existence-neutral errors)

在必要时使用：

```text
NotFoundOrNotVisible
```

以避免泄露受保护数据的存在性。

---

# 87. 核心错误代码注册表 (Core Error Registry)

完全合规的系统实现**应当**至少支持等价于下列情况的稳定错误代码。

## 87.1 协议与语法类 (Protocol / syntax)

```text
InvalidSyntax (语法无效)
InvalidIdentifier (标识符无效)
InvalidRequestEnvelope (请求外壳无效)
UnsupportedProtocolVersion (不支持的协议版本)
UnsupportedCapability (不支持的特性能力)
UnsupportedIsolation (不支持的隔离级别)
LanguageMismatch (语言类别不匹配)
ReadonlyViolation (违反只读约束)
DuplicateLocalHandle (本地句柄重复)
DuplicateMutationTarget (变更目标重复)
```

---

## 87.2 模式类 (Schema)

```text
SchemaSymbolNotFound (模式符号未找到)
SchemaSymbolAmbiguous (模式符号存在歧义)
SchemaFieldNotFound (模式字段未找到)
SchemaPackageUnavailable (模式包不可用)
SchemaEnvironmentChanged (Schema环境已变更)
HistoricalSchemaUnavailable (历史Schema不可用)
TypeMismatch (类型不匹配)
ConstraintViolation (违反约束规则)
```

---

## 87.3 身份与引用类 (Identity / reference)

```text
NotFoundOrNotVisible (未找到或不可见)
ReferenceError (引用错误)
StructuralReferenceInvalid (结构引用无效)
IdentitySelectorRequired (需要身份选择器)
NameIdentityForbidden (禁止仅用名称作为身份标识)
IdentityConflict (身份标识冲突)
ClientKeyConflict (客户端键冲突)
IdentityMergeConflict (身份合并冲突)
```

---

## 87.4 认识与可变性类 (Epistemic / mutability)

```text
ImmutableField (不可变字段)
EpistemicRevisionRequired (需要进行认识修订)
EvidenceCorrectionRequired (需要进行证据纠错)
InvalidLifecycleTransition (生命周期状态迁移无效)
RetractionNotAuthorized (未授权撤回)
SupersessionMismatch (废弃替代不匹配)
EvidenceCorrectionConflict (证据纠错冲突)
ActivityTerminal (活动已处于终态)
ProjectionTargetUnbound (投影目标未绑定)
ProjectionTargetUnbounded (投影目标无界限)
ProjectionNotAuthorized (未授权执行投影)
ProjectionPolicyUnavailable (投影策略不可用)
```

---

## 87.5 治理类 (Governance)

```text
Unauthenticated (未认证)
NotAuthorized (未授权)
RequiresApproval (需要人工审批)
RequiresStrongerAuthentication (需要更强认证)
ActorBindingRequired (需要主体绑定)
ProtectedSystemField (受保护系统字段)
ProtectedGovernanceField (受保护治理字段)
ProtectedSchemaState (受保护模式状态)
LegalHoldConflict (法律保全锁定冲突)
PurgeDenied (清除操作被拒绝)
```

---

## 87.6 事务类 (Transaction)

```text
VersionConflict (版本冲突)
PreconditionFailed (前置条件未满足)
SerializationConflict (可串行化冲突)
IdempotencyConflict (幂等冲突)
TransactionUnknown (未知事务)
OutcomeUnknown (结果未知)
TransactionTooLarge (事务规模过大)
```

`TransactionUnknown` 同样覆盖这样一种情形：事务 id 格式合法，但运行时已不再保留其结果。一旦 §32.8 / §34.3 规定的结果保留窗口过期，对该 id 的查询或重放**必须**报告 `TransactionUnknown`，而不得报告“未产生任何影响”。

---

## 87.7 历史与游标类 (Historical / cursor)

```text
HistoricalSnapshotUnavailable (历史快照不可用)
CursorMismatch (游标不匹配)
CursorTypeMismatch (游标类型不匹配)
CursorExpired (游标已过期)
CursorInvalidated (游标已失效)
ChangeCursorExpired (变更流游标已过期)
ChangeCursorInvalid (变更流游标无效)
```

---

## 87.8 检索类 (Search)

```text
SearchModeUnsupported (不支持的检索模式)
SearchIndexUnavailable (检索索引不可用)
HistoricalSearchUnavailable (历史检索不可用)
```

---

## 87.9 构件与证明类 (Artifact / proof)

```text
ArtifactUnavailable (构件不可用)
ArtifactTooLarge (构件体积过大)
ArtifactParseError (构件解析错误)
DigestMismatch (摘要不匹配)
ProofInvalid (证明无效)
SignerUnknown (未知签名者)
BlobUnavailable (Blob不可用)
CapsuleValidationFailed (胶囊校验失败)
ImportPreviewConflict (导入预览冲突)
```

---

## 87.10 资源与运行时类 (Resource / runtime)

```text
ResourceExhausted (资源耗尽)
ResultLimitExceeded (结果超出配额限制)
ExecutionTimeout (执行超时)
RateLimited (触发速率限制)
InternalError (内部错误)
```

---
# 88. 安全要求 (Security Requirements)

## 88.1 主体伪造防护 (Principal spoofing)

请求体内部声称的身份**严禁**替代通过传输层认证的调用主体 (Principal)。

---

## 88.2 命令与参数注入防护 (Command/parameter injection)

参数绑定**必须**是结构化的。

---

## 88.3 只读绕过防护 (Readonly bypass)

只读约束的强制执行**必须**基于经过解析后的真实语法语义进行分类。

---

## 88.4 游标伪造防护 (Cursor forgery)

游标**必须**是不透明且经过防篡改认证的，或在服务端进行安全映射。

---

## 88.5 检索泄露防护 (Search leakage)

治理规则**必须**在产生用户可见的检索排名/计数/摘要行为之前完成过滤。

---

## 88.6 聚合泄露防护 (Aggregate leakage)

隐藏记录**严禁**通过未经授权的以下行为发生侧信道泄露：

```text
COUNT (计数)
ORDER BY (排序)
FILTER (过滤)
NOT (否定)
OPTIONAL (可选匹配)
```

---

## 88.7 构件 SSRF 防护 (Artifact SSRF)

构件处理**严禁**自动解引用任意外部 URL。

---

## 88.8 记忆注入防护 (Memory injection)

导入的认知内容在缺乏目标空间显式治理许可的情况下，**严禁**：

```text
重写目标自身身份 (rewrite destination self)
提升权限 (elevate authority)
修改信任策略 (change Trust Policy)
激活可执行技能 (activate executable Skills)
安装模式包 (install Schema)
```

---

## 88.9 来源洗白防护 (Origin laundering)

衍生、摘要或导入的认知内容**必须**完整保留与权限相关的源头血统。

---

## 88.10 捏造佐证防护 (Manufactured corroboration)

复制或衍生操作**严禁**凭空产生独立的认识论证据。

---

## 88.11 反驳证据移除防护 (Counter-Evidence removal)

证据的删除/清除**应当**可审计且保持保守，因为移除反驳证据会实质性改变未来的认识论投影结果。

---

## 88.12 证据保真度 (Evidence fidelity)

模型生成的命令文本不是观测载荷的可信载体：模型在重新键入内容时可能会截断、转述或产生幻觉 —— 由此产生的“证据”便构成了凭空伪造。

运行时**应当**提供摄入上下文 (§71.1) 或构件句柄，以便观测到的内容直接从传输外壳进入证据。在使用摄入机制时，运行时**必须**完整保留提供的载荷/构件，而不得经过模型重写。

---

# 89. 一致性合规模型 (Conformance Model)

系统实现**必须**声明其所支持的 KIP 2.0 合规 Profile。

推荐的 Profile 包括：

```text
KIP-Core (核心合规)
KIP-Schema (模式合规)
KIP-Epistemic (认识模型合规)
KIP-Governance (治理合规)
KIP-Transactions (事务合规)
KIP-Capsule (胶囊合规)
KIP-KQL (查询语言合规)
KIP-KML (变更语言合规)
KIP-META (自省元语言合规)
KIP-Runtime (运行时合规)
KIP-Historical (历史记录合规)
KIP-High-Assurance (高保证合规)
KIP-1-Migration (1.x迁移合规)
```

`KIP-1-Migration` 仅适用于声称支持 KIP 1.x 迁移或兼容的系统实现 (§103)；其他情况下非必需。

---

# 90. KIP-Core 核心合规性 (KIP-Core Conformance)

要求对以下各项具备等价语义：

```text
Concept (概念)
Proposition (命题)
Assertion (断言)
Evidence (证据)
Activity (活动)
common envelope (通用外壳)
exact local IDs (精确本地ID)
truth-neutral Proposition (真值中立命题)
Assertion immutability/revision (断言不可变性与修订规则)
Evidence correction (证据纠错规则)
Structural References (结构引用)
Facets (切面扩展)
retention (留存规则)
non-destructive merge (非破坏性合并)
```

---

# 91. KIP-Schema 模式合规性 (KIP-Schema Conformance)

要求支持：

```text
immutable versioned Package artifacts (不可变且带版本的模式包构件)
exact version persistence (精确版本持久化)
Schema Environment (Schema环境管理)
unambiguous alias resolution (无歧义别名解析)
Type/Predicate/Facet/Structural definitions (类型/谓词/切面/结构定义)
constraint validation (约束校验)
Schema META introspection (Schema META自省)
```

---

# 92. KIP-Epistemic 认识合规性 (KIP-Epistemic Conformance)

要求至少支持：

```text
support/reject/uncertain stances (支持/反对/不确定立场)
Assertion lifecycle (断言生命周期)
open-world insufficient (开放世界假设下的未知状态)
accepted/rejected/contested/uncertain/insufficient (五种基本信念状态)
direct same-Proposition conflict (同命题直接冲突)
functional/exclusive conflict support (单值/互斥冲突支持)
hypothetical/predicted/imported distinctions (假设/预测/导入模式区分)
no evidence multiplication (证据不可倍增原则)
auditable Projection policy identity (可审计的投影策略标识)
```

高级的信任学习/校准机制属于可选特性。

---

# 93. KIP-Governance 治理合规性 (KIP-Governance Conformance)

要求支持：

```text
Principal (调用主体)
MemorySpace (记忆空间)
current authorization (当前生效授权)
discover/read/search/project separation (发现/读取/检索/投影权限解耦)
cognitive vs Governance state separation (认知状态与治理状态严格分离)
actor attribution vs representation (主体归属与代表行权严格分离)
commit-time revocation (提交时权限撤销校验)
origin non-malleability (来源信息防篡改性)
authority non-amplification (权限不放大原则)
existence protection (存在性保护)
```

---

# 94. KIP-Transactions 事务合规性 (KIP-Transactions Conformance)

要求支持：

```text
atomic transaction (原子事务)
one start snapshot (单一起始快照)
read-your-writes (读自身写入保障)
no dirty reads (杜绝脏读)
commit/abort (原子提交/中止)
Commit Record (提交记录)
space_seq (空间序列号)
Receipt (提交收据)
idempotency (幂等性保障)
preconditions (前置条件检查)
Change Envelope (变更外壳)
```

---

# 95. KIP-Capsule 胶囊合规性 (KIP-Capsule Conformance)

参见胶囊伴随规范 [KIP-2.0-Capsule-Specification_CN.md](./KIP-2.0-Capsule-Specification_CN.md) §95：要求列表与其所测试的章节一并维护。不支持胶囊的实现不声明 KIP-Capsule 合规性，亦不通告导出/导入能力（§67）。

---

# 96. KIP-KQL 查询语言合规性 (KIP-KQL Conformance)

要求支持：

```text
FIND (查询投射)
WHERE (匹配子句)
Concept pattern (概念模式)
Proposition pattern (命题模式)
Assertion pattern (断言模式)
Evidence pattern (证据模式)
Activity pattern (活动模式)
FILTER (过滤)
NOT (否定)
OPTIONAL (可选匹配)
UNION (并集分支)
aggregation (聚合函数)
ORDER BY (排序)
LIMIT (限制数量)
CURSOR (游标分页)
exact Schema refs (精确Schema引用)
Governance filtering (治理过滤)
BELIEF (信念模式)
snapshot context (快照上下文)
```

完整 Profile 额外增加：

```text
Structural pattern (结构模式)
BELIEF SLOT (信念槽位)
AS OF (认知时间查询)
FOR TIME (世界有效时间查询)
raw path operators (原始路径操作符)
projection ledger (投影账本)
```

---

# 97. KIP-KML 变更语言合规性 (KIP-KML Conformance)

要求支持：

```text
Concept create/upsert (概念创建/更新)
ENSURE Proposition (确保命题存在)
Evidence create (证据创建)
Assertion create (断言创建)
Activity create (活动创建)
immutable-field enforcement (不可变字段强制保护)
safe UPDATE (安全更新)
Assertion lifecycle (断言生命周期流转)
Evidence correction (证据纠错)
EXPECT VERSION (版本号前置检查)
idempotency integration (幂等性集成)
Governance/Schema validation (治理与Schema校验)
```

完整 Profile 额外增加：

```text
MUTATE (复合变更块)
ASSERT sugar (normative desugaring) (ASSERT 规范语法糖脱糖)
forward local refs (本地前向引用)
Facets (切面变更)
Structural mutation (结构引用变更)
archive/tombstone/purge (归档/墓碑/物理清除)
payload purge (载荷清除)
non-destructive merge (非破坏性合并)
```

---

# 98. KIP-META 元语言合规性 (KIP-META Conformance)

要求支持：

```text
DESCRIBE PRIMER (引导说明自省)
DESCRIBE PROTOCOL (协议信息自省)
DESCRIBE EXECUTION CONTEXT (执行上下文自省)
DESCRIBE CAPABILITIES (能力协商自省)
Schema introspection (Schema自省)
SEARCH keyword (关键词检索)
Governance-filtered introspection (经治理过滤的自省)
structured error hints (结构化错误提示)
```

高级 Profile 额外增加：

```text
semantic/hybrid SEARCH (语义与混合检索)
transaction history (事务历史)
CHANGES (变更追踪)
LIST DEPENDENTS (列举依赖方)
VERIFY (验证)
VALIDATE (校验)
PREVIEW (预览)
Capsule export/inspection (胶囊导出与检查)
```

---

# 99. KIP-Runtime 运行时合规性 (KIP-Runtime Conformance)

要求支持：

```text
protocol version (协议版本标识)
request/response envelope (请求/响应外壳)
structural parameters (结构化参数绑定)
Space resolution (记忆空间解析)
authenticated Principal context (已认证的主体上下文)
single-operation execution (单操作执行)
stable error model (稳定错误模型)
```

完整运行时额外增加：

```text
readonly endpoint (只读端点)
independent/sequence/atomic modes (三种执行模式)
idempotency (幂等性机制)
Receipts (收据机制)
snapshot tokens (快照令牌)
artifacts (构件传递)
ingestion context (摄入上下文)
streaming (流式传输)
transaction lookup (事务状态查找)
```

---

# 100. 历史记录合规性 (Historical Conformance)

参见 [KIP-2.0-Optional-Profiles-and-Migration_CN.md](./KIP-2.0-Optional-Profiles-and-Migration_CN.md) §100。

---

# 101. 高保证合规性 (High-Assurance Conformance)

参见同一伴随规范 §101。其各项要求是在合规的核心协议实现之上的加固要求。

---

# 102. 核心合规不变式列表 (Required Conformance Invariants)

合规的原生 KIP 2.0 系统实现**必须**严格遵守 38 条跨领域不变量。

全部清单完整收录于公共注册表 [KIP-2.0-Invariants_CN.md](./KIP-2.0-Invariants_CN.md) 的 Part A 中，每条不变量标明确立章节与钉住向量；同一注册表的 Part B 承载认知记忆 Profile 的 35 条不变量。

---

# 103. KIP 1.x 迁移指南 (KIP 1.x Migration)

参见伴随规范 [KIP-2.0-Optional-Profiles-and-Migration_CN.md](./KIP-2.0-Optional-Profiles-and-Migration_CN.md) §103。操作层面的详细指南请参阅 [migration/KIP-2.0-Migration-from-1.x_CN.md](./migration/KIP-2.0-Migration-from-1.x_CN.md)。

---

# 104. 面向模型的极简引导 (Model-First Primer)

面向智能体的极简 KIP 2.0 引导说明**应当**可直接从 META 派生，其内容形式大致如下：

```text
KIP 2.0 极简指南

READ (读取):
  FIND(...) WHERE {...}

Raw Proposition (原始命题):
  ?p (?s, "predicate", ?o)
  存在 != 信念 (existence != belief)

Belief (信念):
  ?b BELIEF (?s, "predicate", ?o)

Slot belief (槽位信念):
  ?slot BELIEF SLOT (?s, "predicate")

Assertion (断言):
  ?a ASSERTION {proposition:?p, stance:"support"}

Evidence (证据):
  ?e EVIDENCE {evidence_class:"tool_result"}

Structural (结构引用):
  ?edge STRUCTURAL (?source, "has_step", ?target)

Historical cognition (历史认知状态):
  AS OF SEQ :seq

World-valid time (世界有效时间):
  FOR TIME :time

WRITE (写入):
  ASSERT (s, "p", o) {by, mode, evidence}
    语法糖：确保命题存在 + 创建断言 (sugar: ensure Proposition + create Assertion)
  MUTATE { ... }
  ENSURE PROPOSITION
  CREATE EVIDENCE
  CREATE ASSERTION
  CREATE ACTIVITY
  UPDATE 可变状态
  RETRACT / SUPERSEDE / CORRECT
  MERGE 非破坏性合并

GROUND (接地):
  SEARCH
  DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD

CHECK (检查):
  VERIFY != VALIDATE != PREVIEW != COMMIT

Remember (核心准则):
  未检索到 != 为假 (missing != false)
  检索评分 != 置信度 (search score != confidence)
  置信度 != 信任度 (confidence != trust)
  置信度 != 记忆强度 (confidence != memory strength)
  名称 != 身份标识 (name != identity)
  调用主体 != 语义行动主体 (Principal != semantic actor)
  认知内容 != 治理权限 (cognitive content != authority)
  超时 != 事务已中止 (timeout != abort)
```

---
# 附录 A. KQL 语法草图 (KQL Grammar Sketch)

非规范性 EBNF 风格语法统合草图：

```text
query :=
    FIND "(" projection_list ")"
    WHERE "{" where_clause* "}"
    as_of_clause?
    for_time_clause?
    epistemic_clause?
    order_clause?
    limit_clause?
    cursor_clause?

where_clause :=
      concept_pattern
    | proposition_pattern
    | assertion_pattern
    | evidence_pattern
    | activity_pattern
    | structural_pattern
    | belief_pattern
    | belief_slot_pattern
    | filter_clause
    | not_clause
    | optional_clause
    | union_clause

concept_pattern :=
    variable ("CONCEPT")? object_pattern

proposition_pattern :=
    variable? ("PROPOSITION")? proposition_tuple

proposition_tuple :=
      "(" term "," predicate_term "," term ")"
    | "(" "id" ":" scalar ")"

assertion_pattern :=
    variable "ASSERTION" object_pattern

evidence_pattern :=
    variable "EVIDENCE" object_pattern

activity_pattern :=
    variable "ACTIVITY" object_pattern

structural_pattern :=
    variable? "STRUCTURAL"
    "(" term "," structural_field "," term ")"

belief_pattern :=
      variable "BELIEF" "(" variable ")"
        (* 内部变量必须绑定到某个命题 *)
    | variable "BELIEF" "(" "id" ":" scalar ")"
        (* 与 proposition_tuple 相同的 id 形式 *)
    | variable "BELIEF"
      "(" term "," predicate_term "," term ")"
        (* 仅限确切谓词——不接受原始路径 *)

belief_slot_pattern :=
    variable "BELIEF" "SLOT"
    "(" term "," predicate_term ")"

as_of_clause :=
      "AS OF SEQ" value
    | "AS OF TX" value
    | "AS OF TIME" value

for_time_clause :=
    "FOR TIME" value

epistemic_clause :=
    "WITH EPISTEMIC" object_literal

predicate_term :=
    predicate_atom path_quantifier?
    ("|" predicate_atom path_quantifier?)*
        (* 原始谓词路径仅在 proposition_tuple 内合法；
           BELIEF / BELIEF SLOT 只接受裸 predicate_atom *)

predicate_atom :=
    string | parameter | variable

path_quantifier :=
    "{" integer ("," integer?)? "}"
```

形式化的解析器语法随本规范一同发布，见 [`grammar/KIP-2.0-KQL.ebnf`](./grammar/KIP-2.0-KQL.ebnf)、[`grammar/KIP-2.0-KML.ebnf`](./grammar/KIP-2.0-KML.ebnf) 与 [`grammar/KIP-2.0-META.ebnf`](./grammar/KIP-2.0-META.ebnf)。当本附录中的草图不如对应 EBNF 完整时，语法以 EBNF 为准。本附录中被引用但未展开的产生式（`structural_field`、`order_clause`、`limit_clause`、`cursor_clause`、`scalar`、`value` 等）在 [`grammar/KIP-2.0-KQL.ebnf`](./grammar/KIP-2.0-KQL.ebnf) 中定义。

---

# 附录 B. KML 语法草图 (KML Grammar Sketch)

非规范性语法草图：

```text
kml_statement :=
      mutate_statement
    | create_concept
    | upsert_concept
    | ensure_proposition
    | assert_statement
    | create_evidence
    | create_assertion
    | create_activity
    | update_statement
    | retract_assertion
    | supersede_assertion
    | correct_evidence
    | transition_activity
    | set_retention
    | archive_statement
    | tombstone_statement
    | purge_statement
    | purge_payload_statement
    | merge_concept

mutate_statement :=
    "MUTATE" "{"
      mutation_clause*
    "}"
    (* mutation_clause：除 mutate_statement 之外的任意 kml_statement *)

ensure_proposition :=
    "ENSURE PROPOSITION" handle?
    "(" term "," predicate_term "," term ")"
    expect_version_clause?
    (* EXPECT VERSION 0 为仅创建形式，§35.2 *)

assert_statement :=
    "ASSERT" handle?
    "(" term "," predicate_term "," term ")"
    assignment_object
    ("SUPERSEDING" target)?
    (* 规范性语法糖，§55.1 *)

update_statement :=
    "UPDATE" target
    expect_version_clause?
    update_action+
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    (* ?variable 目标由 WHERE 绑定；直接引用目标可省略 WHERE *)

supersede_assertion :=
    "SUPERSEDE ASSERTION" target
    "BY" target
    expect_state_clause?

correct_evidence :=
    "CORRECT EVIDENCE" target
    "BY" target
    expect_state_clause?

set_retention :=
    "SET RETENTION" target
    assignment_object
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_version_clause?

archive_statement :=
    "ARCHIVE" target
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_state_clause?

tombstone_statement :=
    "TOMBSTONE" target
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_state_clause?

purge_statement :=
    "PURGE" target
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    ("REFERENCE POLICY" value)?
    "CONFIRM" "\"PURGE\""

purge_payload_statement :=
    "PURGE PAYLOAD" target
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    "CONFIRM" "\"PURGE\""
        (* 仅限证据字节；元素本身存活，因此没有 REFERENCE POLICY 子句 *)

merge_concept :=
    "MERGE CONCEPT" target
    "INTO" target
    ("WHERE" "{" where_clause* "}")?
    expect_version_clause?
        (* 无 limit_clause：源与目标都已直接指名 *)
```

规范性语法**必须**在 MUTATE 块内完整保留声明式本地句柄语义与前向引用支持。

---

# 附录 C. META 语法草图 (META Grammar Sketch)

非规范性语法草图：

```text
meta_statement :=
      describe_statement
    | list_statement
    | search_statement
    | verify_statement
    | validate_statement
    | preview_statement
    | history_statement
    | changes_statement
    | snapshot_statement
    | export_capsule_statement

describe_target :=
      PRIMER
    | PROTOCOL
    | EXECUTION_CONTEXT
    | CAPABILITIES
    | SPACE
    | SCHEMA_ENVIRONMENT
    | PACKAGE
    | TYPE
    | PREDICATE
    | FACET
    | STRUCTURAL_FIELD
    | COMPATIBILITY
    | ERROR
    | TRANSACTION
    | SNAPSHOT
    | EPISTEMIC_POLICY
    | PROJECTION_CAPABILITY
    | TRUST
    | ACCESS
    | CAPSULE

list_target :=
      SPACES
    | SCHEMA_PACKAGES
    | TYPES
    | PREDICATES
    | FACETS
    | STRUCTURAL_FIELDS
    | EPISTEMIC_POLICIES
    | DEPENDENTS
        (* LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c]，见 §63.5 *)
```

---

# 附录 D. 运行时请求外壳 Schema 草图 (Runtime Envelope Schema Sketch)

说明性全表面 JSON 结构（根据 `kip-request.schema.json` 校验；缺省的可选字段完全省略 —— 不使用显式 `null` 表示可选性）：

```json
{
  "kip": "2.0",

  "request_id": "req-42",

  "space": {
    "id": "space-id"
  },

  "compatibility_profile": "kip-1-compat",

  "execution": {
    "mode": "atomic",
    "on_error": "stop",
    "isolation": "serializable",
    "idempotency_key": "formation:42"
  },

  "read": {
    "snapshot_token": "opaque-snapshot-token"
  },

  "ingest": {
    "evidence": [
      {
        "key": "msg",
        "evidence_class": "user_statement",
        "payload": "I prefer dark mode.",
        "media_type": "text/plain",
        "observed_at": "2026-08-14T01:00:00Z",
        "source_actor": {"id": "concept-alice"},
        "client_key": "message:msg-123"
      }
    ]
  },

  "preconditions": {
    "space_seq": 1500,
    "schema_environment_version": 17
  },

  "operations": [
    {
      "op_id": "op-1",
      "language": "KQL",
      "command": "...",
      "parameters": {},
      "options": {}
    }
  ],

  "parameters": {},

  "context": {
    "purpose": "answer_user",
    "risk": "low",
    "locale": "en-US",
    "client": "anda-brain/2.0"
  },

  "requires": {},

  "options": {
    "dry_run": false,
    "deadline_ms": 10000
  },

  "extensions": {}
}
```

---

# 附录 E. 运行时响应外壳 Schema 草图 (Response Schema Sketch)

说明性已提交写入响应（根据 `kip-response.schema.json` 校验）：

```json
{
  "kip": "2.0",
  "request_id": "req-42",
  "status": "succeeded",

  "execution": {
    "mode": "atomic"
  },

  "results": [
    {
      "op_id": "op-1",
      "status": "succeeded",
      "result": {},
      "context": {},
      "warnings": []
    }
  ],

  "context": {
    "space_id": "space-1"
  },

  "snapshot": {
    "space_id": "space-1",
    "snapshot_seq": 1500
  },

  "receipt": {
    "status": "committed",
    "tx_id": "tx-900",
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "space_seq": 1501,
    "committed_at": "2026-08-14T03:00:00Z"
  },

  "warnings": []
}
```

只读响应携带 `"receipt": null`（且在无快照上下文适用时**可以**携带 `"snapshot": null`）。顶层的 `error` 对象仅在失败 / 结果未知的响应中出现；在其他情况下直接省略，绝不返回 `null`。

---

# 附录 F. 认知形成示例 (Cognitive Formation Examples)

示例假定 Schema 环境中已激活认知记忆 Profile（定义了 `prefers` 与 `caused_by`）以及定义了 `timezone` 的领域模式包。

## F.1 用户陈述 (User statement)

用户说：

```text
"I prefer dark mode."
```

推荐的变更操作：

```prolog
MUTATE {
  CREATE EVIDENCE ?message {
    CLIENT KEY :message_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: :payload,
      observed_at: :time
    }

    SET STRUCTURAL {
      ("source", :alice)
    }
  }

  ENSURE PROPOSITION ?p (
    :alice,
    "prefers",
    :dark_mode
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?message) {role: "support"}
    }
  }
}
```

通过运行时摄入上下文 (§71.1) 直接从传输外壳铸造 `:msg` 时，等价的语法糖形式 (§55.1) 为：

```prolog
ASSERT (:alice, "prefers", :dark_mode) {
  by: :alice,
  mode: "stated",
  confidence: 1.0,
  evidence: :msg
}
```

---

## F.2 纠错与世界变迁的区分 (Correction versus change)

两种情况表面相似，但在协议中写入方式截然不同（§14.2）。

**更正 —— 原先的主张是错误的。** Alice 当初说的是 `+08:00`，但她实际意思是 `+07:00`。早先的主张从来就没有正确过：建立新证据，断言新值，并废弃替代（supersede）旧断言：

```prolog
MUTATE {
  CREATE EVIDENCE ?e {
    CLIENT KEY :evidence_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: :payload,
      observed_at: :time
    }

    SET STRUCTURAL {
      ("source", :alice)
    }
  }

  ENSURE PROPOSITION ?p_new (
    :alice,
    "timezone",
    "+07:00"
  )

  CREATE ASSERTION ?a_new {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p_new,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?e) {role: "support"}
    }
  }

  TRANSITION :a_old TO "superseded" BY ?a_new

  CREATE ACTIVITY ?revision {
    SET FIELDS {
      activity_class: "belief_revision",
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :a_old)
      ("inputs", ?e)
      ("outputs", ?a_new)
    }
  }
}
```

**变迁 —— 现实世界发生了改变。** Alice 之前居住在 `+08:00`，但在 `:moved_at` 搬迁到了 `+01:00`。她早先的主张在其所处时期是完全真实的，因此绝不能因其过时而将其作为错误标记为 superseded；通过重新断言同一数值关闭其开放有效区间，并在旧区间结束处开启新数值的有效区间。两条断言均保持 `active` 状态，且在 `:moved_at` 之前的 `FOR TIME` 查询依然返回 `+08:00`（附录 G.4）：

```prolog
MUTATE {
  ASSERT ?closed (:alice, "timezone", "+08:00") {
    by: :alice,
    mode: "stated",
    valid: {from: :since, until: :moved_at},
    evidence: :msg
  } SUPERSEDING :a_old

  ASSERT ?new (:alice, "timezone", "+01:00") {
    by: :alice,
    mode: "stated",
    valid: {from: :moved_at},
    evidence: :msg
  }

  CREATE ACTIVITY ?revision {
    SET FIELDS {
      activity_class: "belief_revision",
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :a_old)
      ("inputs", :msg)
      ("outputs", ?closed)
      ("outputs", ?new)
    }
  }
}
```

在此处，`SUPERSEDING :a_old` 仅修订了时间区间：原开放式主张在 *until* 截止时间上有误，但在其数值本身上并没有错。若在首次写入断言时两个时间区间均已知晓，则完全不需要执行废弃替代（架构设计附录 B）。

---

## F.3 存在冲突的第三方声明 (Conflicting third-party claims)

Alice 支持命题 `P`；Bob 反对命题 `P`。

正确做法：

```text
保留两条断言记录 (keep both Assertions)
执行认识论投影 (run Epistemic Projection)
得出状态可能为存在争议 (possibly status = contested)
```

错误做法：

```text
让 Bob 废弃替代 Alice (Bob supersedes Alice)
直接删除 Alice 的断言 (delete Alice's Assertion)
```

---

## F.4 经验形成 (Experience formation)

Profile **可以**在单次 MUTATE / 事务内原子创建：

```text
Experience (经验)
ExperienceSteps (经验步骤)
MnemonicState (记忆状态)
Formation Activity (形成活动)
source Evidence (源证据)
```

不强制要求存储私有思维链。

---

## F.5 技能编译 (Skill compilation)

推荐的概念流程：

```text
成功经验 (successful Experience)
+
失败经验 (failed Experience)
    ↓
程序巩固活动 (procedural_consolidation Activity)
    ↓
提议技能 (proposed Skill)，携带其任务族 (task family)
```

编译生成的技能不会自动获得可执行权限，亦不会直接获得生命周期地位：晋升是对已评定结果证据的裁决（F.6），绝非编译过程的一部分。

---

## F.6 结果评定与生命周期裁决 (Outcome grading and a lifecycle verdict)

```text
决策 (action_gate 活动: inputs 指明所应用的技能)
    ↓
外部行动 / 试用运行
    ↓
仪器化组件（绝不是行动模型自身）
    ↓
结果证据 Outcome Evidence {task_family, outcome_status}
    + outcome_observation 活动 {inputs: 决策活动, outputs: 结果证据}
    ↓
确定性裁决代码依据 TrialState 基线读取关联的结果证据
    ↓
lifecycle_verdict 活动 + 一条受保护的 UPDATE
```

仪器通过摄入上下文（§71.1）写入并在其 `facets` 中携带 `OutcomeRecord` 切面的观测记录，以及使其具备打分归因能力的链接：

```prolog
CREATE ACTIVITY ?obs {
  SET FIELDS {
    activity_class: "outcome_observation",
    status: "completed"
  }
  SET STRUCTURAL {
    ("inputs", :decision)
    ("outputs", :outcome)
    ("associated_actors", :verifier)
  }
}
```

当试用期关联结果达到配额时执行的裁决：

```prolog
MUTATE {
  CREATE ACTIVITY ?verdict {
    SET FIELDS {
      activity_class: "lifecycle_verdict",
      status: "completed",
      parameters_digest: :rule_digest
    }
    SET STRUCTURAL {
      ("inputs", :outcome_a)
      ("inputs", :outcome_b)
      ("outputs", :skill)
    }
  }

  UPDATE :skill
  SET ATTRIBUTES {status: "adopted"}
  SET FACET "GradingState" {
    success_count: 9,
    failure_count: 2,
    graded_count: 12,
    last_verdict_at: :now
  }
  SET FACET "MnemonicState" {utility: 0.78}
  EXPECT VERSION :version OF ATTRIBUTES
}
```

晋升操作在一条受保护的语句中执行：`EXPECT VERSION ... OF ATTRIBUTES` 确保其并发安全性，且不会被并发的 `MnemonicState` 衰减扫描所破坏（§35.1），裁决 Activity 锚定评估规则（`parameters_digest`）与所评定的结果证据（`inputs`），且 Skill 上的 `TrialState` 忠实承载了试用开启时的对比基线，使整个状态迁移过程对审计员完全可独立复算。仅有关联至应用了该技能之决策的结果才会进入 `inputs`；该任务族的其余结果则构成开启试用时的对比基线。

---

# 附录 G. 读取与信念查询示例 (Read/Belief Examples)

## G.1 原始声明历史查询 (Raw claim history)

```prolog
FIND(
  ?value,
  ?a.stance,
  ?a.confidence,
  ?a.asserted_at,
  ?a.lifecycle.status
)
WHERE {
  ?p (
    :alice,
    "timezone",
    ?value
  )

  ?a ASSERTION {
    proposition: ?p
  }
}
ORDER BY ?a.asserted_at DESC
```

---

## G.2 当前被接受的槽位查询 (Current accepted slot)

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :alice,
    "timezone"
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---

## G.3 当时的历史信念查询 (Historical belief then)

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project,
    "status"
  )
}
AS OF SEQ :then_seq
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  explanation: "ledger"
}
```

---

## G.4 当前对当时事实的信念查询 (Current belief about then)

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project,
    "status"
  )
}
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_research",
  explanation: "ledger"
}
```

这两条查询在逻辑上**可以**合理地产生完全不同的结果。

---

# 附录 H. META 工作流示例 (META Workflow Examples)

## H.1 智能体启动流程 (Agent startup)

```text
DESCRIBE PRIMER
DESCRIBE CAPABILITIES
按需执行 DESCRIBE TYPE/PREDICATE
按需执行 SEARCH
执行 KQL/BELIEF
```

---

## H.2 胶囊接收工作流 (Capsule acceptance workflow)

```text
DESCRIBE CAPSULE (自省胶囊)
VERIFY CAPSULE (验证完整性)
VALIDATE CAPSULE (校验合法性)
PREVIEW IMPORT CAPSULE (预览导入效果)
```

真正的导入操作是独立的、受保护的状态变更事务。

---

## H.3 写入响应丢失恢复流程 (Lost write response)

```text
网络响应丢失 (network response lost)
    ↓
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY (根据幂等键查询事务)
    ↓
已提交？(committed?)
    使用原始返回的收据 (use original Receipt)
状态未知？(unknown?)
    使用相同的逻辑请求与幂等键安全重试 (retry same logical request/key)
```

---

# 附录 I. 兼容性对照总结 (Compatibility Summary)

完整内容收录于伴随规范 [KIP-2.0-Optional-Profiles-and-Migration_CN.md](./KIP-2.0-Optional-Profiles-and-Migration_CN.md) 附录 I，紧随 §103 之后。

---

# 附录 J. 协议最终总结 (Final Protocol Summary)

KIP 2.0 协议体系可高度概括为：

```text
Core (核心层)
    存在哪些认知对象？

Schema (模式层)
    这些认知对象代表什么含义？

Epistemic Projection (认识论投影)
    大脑应当相信什么？

Governance (治理层)
    谁可以影响或观测认知状态？

Transactions (事务层)
    认知状态如何原子化跃迁？

Capsule (胶囊层)
    认知如何在不同大脑之间迁移？

KQL (认知查询语言)
    如何读取认知状态？

KML (认知变更语言)
    如何修改认知状态？

META (元语言)
    认知中枢如何描述自身？

Protocol Runtime (协议运行时)
    如何在真实网络传输层上安全执行上述语义？
```

KIP 2.0 最核心的不变式为：

```text
Meaning (含义) ≠ Belief (信念) ≠ Authority (权限)

Proposition (命题) ≠ Assertion (断言)

Confidence (置信度) ≠ Trust (信任度) ≠ Memory Strength (记忆强度)

Search Relevance (检索相关性) ≠ Epistemic Support (认识支持)

No Match (未匹配) ≠ False (为假)

Correction (纠错) ≠ Rewrite History (重写历史)

Merge (合并) ≠ Rewrite History (重写历史)

Capsule (胶囊) ≠ Authority (权限)

Batch (批处理) ≠ Transaction (事务)

Timeout (超时) ≠ Abort (中止)

Progress (流式进度) ≠ Commit (提交)

Request (请求) ≠ Transaction (事务)

Principal (调用主体) ≠ Semantic Actor (语义行动主体)
```

本协议的终极指导原则是：

> **KIP 2.0 是面向持久化认知的协议：新信息的到来可以改变大脑下一步的行动，而绝不要求大脑去篡改或伪造过去发生的事实。**
