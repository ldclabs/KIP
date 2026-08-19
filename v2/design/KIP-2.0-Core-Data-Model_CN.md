# KIP 2.0 核心数据模型 (Core Data Model)

**[English](./KIP-2.0-Core-Data-Model.md) | [中文](./KIP-2.0-Core-Data-Model_CN.md)**

## 规范状态 (Status)

**核心数据模型提案 / 前规范草案 (Core Data Model Proposal / Pre-Specification Draft)**

本文档定义了实现 [KIP-2.0-Architecture_CN.md](../KIP-2.0-Architecture_CN.md) 中架构原则的具体逻辑数据模型。

本文档有意**不作为** KQL/KML 语法规范，也有意**不作为**完整的认识论、治理、模式包（Schema Package）、事务或认知胶囊（Capsule）规范。

其目标更加明确且更为基础：

> **定义所有 KIP 2.0 实现在设计查询或变更语法之前必须达成共识的持久化对象、标识符、引用、不变式、可变性规则以及结构关系。**

主要设计目标是构建一个能够保留语义内涵、认识论历史、溯源、记忆状态和治理边界且不将它们相互混淆的智能体记忆大脑（Agent Memory Brain）。

因此，本数据模型解决了架构文档留下的若干悬而未决的问题：

1. `Assertion`（断言）是**专用的 KIP 核心元素类型（Dedicated KIP Core Element Kind）**，而非保留的普通 Concept。
2. `Evidence`（证据）是**专用的 KIP 核心元素类型**。
3. `Activity`（活动）是**专用的 KIP 核心溯源元素类型**。
4. `Proposition`（命题）是一个不可变的、真值中立的语义项。
5. 诸如 `Assertion → Evidence` 之类的核心结构关系是**结构引用（Structural Reference）**，而非语义命题。
6. 字面量值的事实通过带类型的 `Literal`（字面量）值成为头等公民。
7. 每个持久化的认知元素都严格归属于一个主属 `MemorySpace`（记忆空间）。
8. `name`（名称）不再是全局标识符；不可变的 `id` 才是。
9. KIP 2.0 彻底消除了通用 KIP 1.x `metadata`（元数据）属性袋的语义过载，将内容、Profile 切面（Facet）、治理、留存（Retention）和引擎底层事实（Engine Truth）清晰解耦。
10. 被接受的信念**不是** Core 中存储的原语；它由认识论投影（Epistemic Projection）动态推导得出。

---

# 0. 规范性用词定义 (Normative Language)

关键字 **必须 (MUST)**、**严禁 (MUST NOT)**、**必需 (REQUIRED)**、**应当 (SHOULD)**、**不得 (SHOULD NOT)**、**可以 (MAY)** 和 **可选 (OPTIONAL)** 用于指示最终 KIP 2.0 规范中预期的协议要求。

由于本文档仍处于前规范阶段，具体的连线字段名称和 JSON 序列化形式**可以 (MAY)** 发生变化。语义区分与不变式才是关键核心。

---

# 1. 设计目标 (Design Objective)

KIP 2.0 绝不仅仅是一个图存储模型。

核心数据模型必须支撑以下完整的因果链路：

```text
外部世界 / 人类 / 工具 / 其他智能体 (World / Human / Tool / Other Agent)
                │
                ▼
             证据 (Evidence)
                │
                ▼
             断言 (Assertion)
                │
                ▼
       智能体信念视图 (Agent Belief View)
                │
                ▼
      事件 / 经验 / 技能 (Event / Experience / Skill)
                │
                ▼
         未来计算 / 行动 (Future Computation / Action)
```

与此同时，每个持久化条目都必须严格约束在以下边界之内：

```text
记忆空间 (MemorySpace)
调用主体 (Principal)
安全策略 (Policy)
数据来源 (Origin)
时间维度 (Time)
模式定义 (Schema)
```

因此，一个成功的核心模型必须保持以下六大解耦分离：

```text
语义含义 (meaning)     ≠ 信念状态 (belief)
信念状态 (belief)      ≠ 客观证据 (evidence)
客观证据 (evidence)    ≠ 历史溯源 (provenance)
历史溯源 (provenance)  ≠ 执行权限 (authority)
记忆状态 (memory)      ≠ 客观真理 (truth)
安全治理 (governance)  ≠ 语义内涵 (semantics)
```

---

# 2. 核心元素分类体系 (Core Element Taxonomy)

KIP 2.0 定义了五种主要的持久化**认知元素（Cognitive Element）**类型：

```text
Concept       (概念)
Proposition   (命题)
Assertion     (断言)
Evidence      (证据)
Activity      (活动)
```

第六个核心对象 `MemorySpace`（记忆空间）是一个治理容器，而非普通的认知元素。

```text
                     认知元素 (Cognitive Element)
                            │
     ┌───────────┬───────────┼───────────┬───────────┐
     │           │           │           │           │
  概念        命题         断言        证据        活动
Concept   Proposition  Assertion   Evidence    Activity
```

这些元素类型的存在理由各不相同，**严禁 (MUST NOT)** 仅仅为了图结构的统一性而将它们合并混淆。

| 元素 (Element) | 核心回答的问题 |
| --- | --- |
| `Concept` | 这是一个什么实体、类别、抽象概念或可引用对象？ |
| `Proposition` | 可以引用和探讨的客观语义陈述是什么？ |
| `Assertion` | 谁或什么主体对该命题持有什么认识论立场？ |
| `Evidence` | 引用了什么观测结果、制品或输出作为支持或反驳的依据？ |
| `Activity` | 该对象是通过什么转换、观测、导入、推理或巩固过程产生的？ |
| `MemorySpace` | 该状态存在于谁的所有权和策略边界之下？ |

Profile 定义的认知结构，例如：

```text
Person          (人物)
Event           (事件)
Experience      (经验)
ExperienceStep  (经验步骤)
Preference      (偏好)
Insight         (洞见)
Commitment      (承诺)
Skill           (技能)
SleepTask       (睡眠维护任务)
SelfModel       (自我模型)
```

**并不是额外的 Core 核心元素类型**。它们通常由带类型的 `Concept` 加上 Profile 定义的结构引用（Structural Reference）与切面（Facet）来表示。

---

# 3. 通用认知元素外包络 (The Common Cognitive Element Envelope)

每个持久化的认知元素都**必须 (MUST)** 携带一个通用外包络（Envelope）。

逻辑形式：

```json
{
  "id": "opaque-local-id",
  "kind": "concept | proposition | assertion | evidence | activity",
  "space_id": "memory-space-id",

  "governance": {
    "classification": "optional-label",
    "policy_ref": "optional-policy-id"
  },

  "retention": {
    "retention_class": "optional-class",
    "expires_at": "optional-ISO-8601",
    "legal_hold": false
  },

  "facets": {
    "profile-or-extension-id": {
      "extension_specific_state": "..."
    }
  },

  "_system": {
    "version": 1,
    "created_at": "engine-time",
    "updated_at": "engine-time",
    "created_tx": "transaction-id",
    "updated_tx": "transaction-id",
    "state": "active",
    "origin": {
      "principal_id": "authenticated-principal",
      "channel": "write-channel",
      "import_id": null
    }
  }
}
```

上述确切的 JSON 形式仅供说明参考。语义分区则是规范性的设计要求。

---

# 4. 为何 KIP 2.0 移除通用元数据袋 (Why KIP 2.0 Removes the Generic Metadata Bag)

KIP 1.x 将 `metadata` 用于许多彼此无关的关注点：

```text
source           (来源)
author           (作者)
confidence       (置信度)
evidence         (证据)
created_at       (创建时间)
observed_at      (观测时间)
validity         (有效性)
supersession     (废弃替代)
memory_tier      (记忆层级)
expires_at       (过期时间)
access_level     (访问级别)
review_info      (评审信息)
engine-maintained fields (引擎维护字段)
```

这种做法在早期很务实，但这些含义之间的差异越来越大，已无法继续共存于一个未分化的命名空间中。

KIP 2.0 将它们彻底解耦拆分：

```text
语义载荷 (semantic payload)         → 属性 (attributes) / 类型化字段
认识状态 (epistemic state)          → 断言 (Assertion)
客观证据 (evidence)                 → 证据 (Evidence)
历史溯源 (provenance)               → 活动 (Activity) + 系统来源 (origin)
安全治理 (governance)               → 治理 (governance)
存储生命周期 (storage lifecycle)    → 留存 (retention)
记忆专属状态 (memory-specific state)→ Profile 切面 (Facets)
引擎底层事实 (engine truth)         → 系统字段 (_system)
```

因此，KIP 2.0 **应当不得 (SHOULD NOT)** 定义具有协议语义的通用可写 `metadata` 对象。

实现**可以 (MAY)** 提供兼容性的元数据视图，但原生的 Core 状态必须严格保持上述解耦。

---

# 5. 标识符体系 (Identifiers)

## 5.1 认知中枢局部 `id` (Nexus-Local `id`)

每个认知元素都**必须 (MUST)** 拥有一个不可变的认知中枢局部 `id`。

特性：

```text
对客户端不透明 (opaque to clients)
在元素的整个生命周期内保持稳定 (stable for the element's lifetime)
在当前认知中枢 (Nexus) 内全局唯一 (unique within the Nexus)
删除后绝不重复复用 (never reused after deletion)
不从显示名称中语义派生 (not semantically derived from display name)
```

KIP 不强制要求 UUID、ULID、哈希、整数或任何特定的 ID 格式。

实现**可以 (MAY)** 暴露全局唯一 ID，但 Core 规范并不强制要求全局唯一性。

---

## 5.2 `name` 并非唯一标识 (`name` Is Not Identity)

`Concept` **可以 (MAY)** 拥有一个人类/大模型友好的 `name`（名称）。

示例：

```text
Alice
Project Aurora
Dark Mode
Rust
```

`name` 的存在是为了：

```text
语义接地 (grounding)
内容展示 (display)
文本搜索 (search)
大语言模型生成的人体工程学体验 (LLM generation ergonomics)
```

**严禁 (MUST NOT)** 将其视为实体的唯一标识。

两个不同的 Concept **可以 (MAY)** 拥有相同的名称。

Concept **可以 (MAY)** 在不更改标识符（ID）的情况下修改其名称。

---

## 5.3 逻辑键 `key` (Logical `key`)

`Concept` **可以 (MAY)** 携带一个不可变的空间局部逻辑 `key`（键），用于面向模型的幂等寻址。

示例：

```text
key = "alice"
key = "event:2026-08-13:meeting-42"
key = "skill:deploy-db-mismatch"
```

推荐的唯一性范围：

```text
(space_id, schema_ref, key)
```

`key` 与 `name` 的区别：

```text
key   = 稳定的机器/模型寻址标识
name  = 可变的人类可读展示标签
```

KIP 1.x 的 `type + name` 标识可以通过初始化以下内容自然迁移：

```text
key = legacy name
name = legacy name
```

适用于依赖名称标识的旧类型。

原生 KML 2.0 **不**接受 `{type, name}` 作为标识：原生 `UPSERT` 必须以 `id` 或 `key` 进行选择，仅凭名称的 upsert 是被禁止的。只有 `kip-1-compat` 兼容 Profile 才可以将遗留的 `type + name` 转译为迁移后的 `key`。原生的 Core 唯一标识永远是 `id`。

---

## 5.4 权威外部标识 `canonical_id` (`canonical_id`)

Concept **可以 (MAY)** 拥有一个 `canonical_id`，将其绑定到稳定的跨系统外部标识。

示例包括：

```text
URI
URN
DID (去中心化标识符)
领域专有的稳定标识符
```

KIP 不强制指定任何外部标识方案。

由于错误的外部身份绑定可能会错误合并无关实体，因此 `canonical_id` **应当 (SHOULD)** 被视为**高可信度身份绑定（High-Assurance Identity Binding）**，而非随意填写的普通属性。

设置或修改 `canonical_id` **应当 (SHOULD)** 受到比修改显示名称更严格的安全策略管控。

未经严格验证的声明，例如：

> “该用户的 DID 是 X”

通常**应当 (SHOULD)** 表示为“命题 + 断言 (Proposition + Assertion)”，直到该身份绑定获得充分信任。认知记忆 Profile 正是为此提供了 `same_as` 谓词：它只喂给身份复核流程，不会自动合并，也不会凭自身确立 `canonical_id`。

---

# 6. 引用类型 (Reference Types)

KIP 2.0 明确区分四种引用类型。

## 6.1 空间内部元素引用 (Local Element Reference)

```text
ElementRef = 通过 id 指向同一空间 (Same-Space) 内认知元素的引用
```

示意：

```json
{"id": "element-123"}
```

这是 Core 对象内部的标准持久化引用形式。

---

## 6.2 权威外部身份引用 (Canonical Identity Reference)

如果本地不存在对应的 Concept，语义参与者或导入实体**可以 (MAY)** 通过外部权威标识进行引用。

示意：

```json
{"canonical_id": "did:example:123"}
```

将其解析为本地 Concept 取决于具体实现与策略配置。

---

## 6.3 跨空间外部引用 (Foreign Space Reference)

基准 KIP 2.0 **应当不得 (SHOULD NOT)** 跨越 MemorySpace 隐式创建普通图边缘。

支持跨空间引用时，**必须 (MUST)** 显式声明。

示意：

```json
{
  "space_id": "public://research",
  "element_id": "abc"
}
```

跨空间外部引用：

```text
必须经过策略检查 (are policy checked)
不会被自动遍历展开 (are not automatically traversed)
并不意味自动导入 (do not imply import)
不会向目标空间授予权限 (do not grant destination authority)
```

共享认知的基准互操作模型始终是：

```text
导出 (export) → 策略检查/脱敏 (policy/redaction) → 认知胶囊 (capsule) → 导入 (import)
```

而非无限制的跨空间图遍历。

---

## 6.4 字面量 (Literal)

Proposition 的宾语（Object）**可以 (MAY)** 是一个 `Literal`（字面量）而非元素引用。

字面量定义见第 9 节。

---

# 7. 同空间闭包规则 (Same-Space Closure Rule)

每个认知元素都严格归属于一个 `MemorySpace`。

基准 KIP Core **应当 (SHOULD)** 强制执行：

> **认知元素内部包含的所有普通持久化 ElementRef 必须在同一个 MemorySpace 内部解析。**

这一规则是有意采取的保守设计。

优势：

```text
防止意外的跨空间数据泄露 (prevents accidental cross-space data leakage)
使导出/导入边界清晰明确 (makes export/import boundaries explicit)
使策略推理切实可行 (makes policy reasoning tractable)
避免隐藏的生命周期耦合 (avoids hidden lifetime coupling)
保持图遍历的局部可治理性 (keeps graph traversal locally governable)
```

实现**可以 (MAY)** 将显式的跨空间外部引用作为声明的扩展功能予以支持。

---

# 8. 结构引用与语义命题的对立统一 (Structural References vs. Semantic Propositions)

这种区分至关重要。

KIP 2.0 拥有两种本质不同的图关系：

```text
语义命题 (Semantic Proposition)
结构引用 (Structural Reference)
```

## 8.1 语义命题 (Semantic Proposition)

命题陈述了可以被相信、被拒绝、存在争议或处于不确定状态的内容。

示例：

```text
(Alice, prefers, DarkMode)
```

其真实性需要断言（Assertion）语义的支撑。

---

## 8.2 结构引用 (Structural Reference)

结构引用描述了 KIP 记录是如何装配构成的。

示例：

```text
Assertion.proposition         → Proposition  (断言指向的命题)
Assertion.evidence            → Evidence     (断言引用的证据)
Assertion.supersedes          → Assertion    (断言替代的前序断言)
Evidence.source               → Concept | Evidence (证据的来源)
Evidence.generated_by         → Activity     (证据生成的来源活动)
Activity.inputs               → Cognitive Elements (活动的输入元素)
Activity.outputs              → Cognitive Elements (活动的输出元素)
Experience.has_step           → ExperienceStep     [Profile 定义的经验步骤]
```

Core 保留六个结构**字段名**供查询与变更使用，它们由源元素的 Core 类别解析，
而不经由 Package 别名解析：

```text
evidence       Assertion → Evidence            带 role 限定的证据引用
source         Evidence  → Concept | Evidence  观测/制品的来源
generated_by   Evidence  → Activity            生成该证据的活动
inputs         Activity  → 任意 Core 元素       溯源输入
outputs        Activity  → 任意 Core 元素       溯源输出
associated_actors  Activity  → Concept         参与该过程的语义行动者（非授权方，非 Principal）
```

这些链接属于记录本身的结构组成部分。

它们本身**不是**需要另一层断言来确定真值的客观世界命题。

---

## 8.3 做出此项区分的必要性 (Why the Distinction Is Necessary)

如果：

```text
Assertion A ─ supported_by → Evidence E
```

始终被表示为一个普通的命题，KIP 将立即陷入无穷倒退的困境：

> 到底是谁断言了“证据 E 支持断言 A”？

这将需要另一个断言，而该断言的证据链接又需要另一个命题，依此类推陷入死循环。

Core 的结构引用（Structural Reference）彻底消除了这种语义倒退。

---

## 8.4 结构引用不等于认识论充分性 (Structural Reference Does Not Mean Epistemic Sufficiency)

如果一个断言在结构上引用证据 E 作为 `support`，Core 仅仅记录：

> 该断言引用了 E 作为支持证据。

它**并不**保证：

> E 实际上在客观上证明了该命题。

这一判断完全属于认识论投影（Epistemic Projection）与信任策略的职责范畴。

---

# 9. 字面量数据模型 (Literal Data Model)

## 9.1 设立目的 (Purpose)

许多重要事实都具有标量值：

```text
(Alice, timezone, "+08:00")
(ProjectX, status, "active")
(Service, retry_count, 3)
(FeatureFlag, enabled, true)
```

如果这些值仅仅作为普通的 Concept 属性存在，它们就无法独立承载：

```text
来源溯源 (source)
置信度 (confidence)
有效时间区间 (valid time)
冲突矛盾 (contradiction)
客观证据 (evidence)
共享策略 (sharing policy)
演变历史 (history)
```

因此，KIP 2.0 允许在 Proposition 中直接使用字面量对象（Literal）。

---

## 9.2 字面量数据结构 (Literal Shape)

逻辑形式：

```json
{
  "value": "2026-08-13T10:00:00Z",
  "datatype": "kip:datetime",
  "language": null
}
```

Core 字面量载荷严格限制为 JSON 标量语义：

```text
string  (字符串)
number  (数值)
boolean (布尔值)
null    (空值)
```

复杂的数组和对象不是 Core 字面量。

如果某个结构化对象需要一等公民的语义标识，**应当 (SHOULD)** 将其表示为 Concept 或 Profile 定义的值对象（Value Object）。

---

## 9.3 原语简写形式 (Primitive Shorthand)

面向模型的语法**可以 (MAY)** 允许：

```text
"+08:00"
3
true
```

作为带类型的 Core 字面量的简写形式。

权威的内部模型始终保持对数据类型（datatype）的严格区分。

---

## 9.4 字面量等价性 (Literal Equality)

命题的唯一标识取决于确定性的字面量等价规则。

Core 核心规则：

```text
string  → 严格按 Unicode 标量值比较，除非数据类型另有定义
boolean → true != false
null    → 仅与 null 相等
number  → 按规范化后的有限数值进行比较
```

`NaN`、`Infinity` 和 `-Infinity` 不是有效的 Core JSON 数值。

表示相同有限数值的不同数字字面形式**应当 (SHOULD)** 规范化为相同的字面量标识。

示例：

```text
1
1.0
1e0
```

如果被解析为相同的 Core 数值，**应当不得 (SHOULD NOT)** 创建三个不同的语义命题。

确切的规范化规则在认知胶囊规范（Cognitive Capsule Specification）中最终敲定。

---

## 9.5 携带语言标签的字符串 (Language-Tagged Strings)

当语言具有语义相关性时，字面量**可以 (MAY)** 携带语言标签。

示例：

```json
{
  "value": "苹果",
  "datatype": "string",
  "language": "zh-Hans"
}
```

语言标签直接影响字面量的等价性与标识。

---

## 9.6 空值 `null` (`null`)

仅当谓词 Schema 显式允许时，**可以 (MAY)** 使用 `null`。

在绝大多数知识建模场景中：

```text
未知 (unknown)
```

**应当 (SHOULD)** 表示为缺乏已接受的值或存在不确定的断言，而非字面声明值为 `null`。

---

# 10. 概念 (Concept)

## 10.1 概念定义 (Definition)

`Concept`（概念）是一个可被引用的语义资源。

它可以表示：

```text
人物 (person)
组织 (organization)
地点 (place)
项目 (project)
制品 (artifact)
抽象想法 (abstract idea)
类别 (category)
事件 (event)
经验 (experience)
技能 (skill)
假设实体 (hypothetical entity)
Profile 定义的认知对象 (profile-defined cognitive object)
```

认知中枢中存在某个 Concept，并不代表对应的现实世界实体必然真实存在。

当存在性在认识论上具有重要意义时，可以通过“命题 + 断言 (Proposition + Assertion)”来进行形式化表达。

---

## 10.2 逻辑数据结构 (Logical Shape)

```json
{
  "id": "concept-123",
  "kind": "concept",
  "space_id": "space-1",

  "schema_ref": "kip://profiles/example@2.0.0/Person",
  "key": "alice",
  "name": "Alice",
  "canonical_id": null,
  "aliases": ["Alice Chen"],

  "attributes": {
    "display_hint": "..."
  },

  "facets": {},
  "governance": {},
  "retention": {},
  "_system": {}
}
```

---

## 10.3 模式引用 `schema_ref` (`schema_ref`)

每个 Concept 都**必须 (MUST)** 通过支持版本解析的 `schema_ref` 来标识其 Concept Type。

Schema Package URI 的确切语法将在后文中定义。

Core 核心要求：

```text
schema_ref 必须能够解析为确定的 Concept Type 定义
```

---

## 10.4 概念属性 (Concept Attributes)

属性（Attributes）依然具备重要价值。

适用于以下特性的状态数据：

```text
属于本地表示的内在固有属性 (intrinsic to the local representation)
不会被独立质疑或发生争议 (not independently disputed)
无需单独注明独立来源 (not separately sourced)
无需具备独立的时间有效区间 (not independently time-valid)
无需单独配置独立权限策略 (not separately permissioned)
不会作为独立事实声明进行外部交换 (not independently exchanged as a factual claim)
```

示例：

```text
展示提示 (display hint)
缓存摘要 (cached summary)
UI 排序权重 (UI ordering)
派生计数器 (derived counter)
Profile 本地运行时状态 (profile-local operational state)
紧凑结构化载荷 (compact structured payload)
```

---

## 10.5 属性升级规则 (Attribute Escalation Rule)

一旦某个值出现以下任何需求，**应当 (SHOULD)** 将其从属性升级为“命题 + 断言 (Proposition + Assertion)”：

```text
需要独立的来源溯源 (independent source)
需要独立的置信度评估 (independent confidence)
存在冲突矛盾或不同看法 (contradiction)
需要有效时间区间约束 (validity interval)
可能被单独撤回或废弃 (retraction)
需要独立的证据支撑 (evidence)
需要独立的共享与权限策略 (sharing policy)
需要进行跨空间数据交换 (cross-space exchange)
需要记录历史演进过程 (historical evolution)
```

这是防止 KIP 1.x 时代元数据耦合乱象重现的核心准则。

---

## 10.6 名称与别名属于接地状态 (Names and Aliases Are Grounding State)

`name` 和 `aliases`（别名）是语义接地的辅助手段，而非普适的客观事实。

如果历史事实：

> Alice 在 2019 至 2022 年间被称为 "Alicia"

在认识论上具有重要意义，请将其建模为“命题 + 断言”，而不是仅仅依赖当前的 `aliases` 数组。

---

# 11. 概念合并与身份整合 (Concept Merge and Identity Consolidation)

在持续演进的记忆大脑中，实体整合至关重要。

然而，KIP 2.0 **必须 (MUST)** 保持历史引用的完整性。

## 11.1 合并不重写历史 (Merge Does Not Rewrite History)

KIP 1.x 的 `MERGE` 可能会直接重定向图边缘。

KIP 2.0 **应当 (SHOULD)** 采用更为保守的语义模型：

```text
Concept A
   _system.state = merged
   merged_into   = Concept B
```

Concept A 依然保留为一个可寻址的历史身份记录。

新的写入操作将解析重定向至 B。

原始的历史命题可以继续引用 A。

---

## 11.2 权威身份解析 (Canonical Resolution)

引擎维护一个解析函数：

```text
resolve_concept(A) → B
```

`resolve_concept` 沿 `merged_into` 迭代至不动点，因此合并**严禁 (MUST NOT)** 制造环：若目标已经（可传递地）解析回源头，运行时**必须 (MUST)** 拒绝该次合并。

默认的语义查询**可以 (MAY)** 规范化已合并的身份。

原始/审计查询**必须 (MUST)** 能够还原最初引用的原始 ID。

---

## 11.3 为何非破坏性合并至关重要 (Why Non-Destructive Merge Matters)

假设一份导入的文档陈述了关于：

```text
"JS"
```

的内容，而智能体随后才确定：

```text
JS == JavaScript
```

最初的断言在审计时仍应清晰显示其引用的是历史上的 "JS" Concept。

身份整合应当提升未来的推理能力，而不应篡改过去的表示。

---

## 11.4 合并后的规范命题去重 (Canonical Proposition Deduplication After Merge)

如果：

```text
P1 = (ConceptA, knows, Bob)
P2 = (ConceptB, knows, Bob)
```

且 A 合并到了 B，KIP 可能会发现 P1 和 P2 现在规范化为了相同的语义陈述。

引擎**可以 (MAY)** 将一个命题标记为规范合并至另一个命题。

引擎**必须 (MUST)** 完整保留断言引用与原始溯源信息。

确切的 `MERGE` 变更语义在 KIP-2.0-KML.md 中定义。

---

# 12. 命题 (Proposition)

## 12.1 命题定义 (Definition)

`Proposition`（命题）是一个不可变的、真值中立的语义陈述。

规范形式：

```text
(主语 subject, 谓词 predicate, 宾语 object)
```

命题的存在是为了能够被指称和引用。

它的存在本身并不代表被相信为真。

---

## 12.2 逻辑数据结构 (Logical Shape)

```json
{
  "id": "prop-123",
  "kind": "proposition",
  "space_id": "space-1",

  "subject": {"id": "concept-alice"},
  "predicate_ref": "kip://profiles/personal@2.0.0/prefers",
  "object": {"id": "concept-dark-mode"},

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

字面量宾语形式：

```json
{
  "subject": {"id": "concept-alice"},
  "predicate_ref": "kip://profiles/personal@2.0.0/timezone",
  "object": {
    "value": "+08:00",
    "datatype": "string"
  }
}
```

---

## 12.3 允许的项类型 (Allowed Terms)

基准约束：

```text
subject = ElementRef (元素引用)
object  = ElementRef | Literal (元素引用 或 字面量)
```

主语不能是字面量（Literal）。

谓词 Schema **可以 (MAY)** 限制：

```text
允许的主语元素类型 (allowed subject kinds)
允许的主语 Schema 类型 (allowed subject schema types)
允许的宾语元素类型 (allowed object kinds)
允许的宾语 Schema 类型 (allowed object schema types)
允许的字面量数据类型 (allowed literal datatypes)
基数约束 (cardinality)
```

---

## 12.4 命题可引用任意认知元素 (Propositions May Refer to Any Cognitive Element)

若谓词 Schema 允许，命题**可以 (MAY)** 对以下任何认知元素作出语义陈述：

```text
Concept       (概念)
Proposition   (命题)
Assertion     (断言)
Evidence      (证据)
Activity      (活动)
```

示例：

```text
(ReviewerConcept, approved, Assertion42)
```

这是一个语义陈述，因此仍需要一个断言才能被相信。

这与 Core 核心结构字段截然不同：

```text
Assertion42.evidence
```

后者属于记录的物理拓扑结构。

---

## 12.5 命题的结构标识 (Proposition Structural Identity)

在单个 MemorySpace 内部，命题在结构上由以下三元组唯一确定：

```text
canonical(subject)
+
predicate_ref
+
canonical(object)
```

对于资源引用，规范化会考虑合并重定向。

对于字面量，规范化采用带类型的字面量等价规则。

---

## 12.6 唯一性约束 (Uniqueness)

KIP 2.0 **应当 (SHOULD)** 在一个 MemorySpace 内为每个语义元组维护一个活跃的规范命题。

概念上等价于：

```text
UNIQUE(
  space_id,
  canonical_subject,
  predicate_ref,
  canonical_object
)
```

多个不同的断言可以同时指向这同一个命题。

---

## 12.7 命题不可变性 (Proposition Immutability)

语义元组：

```text
subject
predicate_ref
object
```

在命题创建后**必须 (MUST)** 是不可变的。

更改任何组件都会创建或解析为另一个不同的命题。

这可以防止认识论历史在现有的命题 ID 下被悄然篡改语义。

---

## 12.8 命题不含认识论置信度 (Proposition Has No Epistemic Confidence)

原生 KIP 2.0 命题**严禁 (MUST NOT)** 携带如下协议级字段：

```text
confidence   (置信度)
asserted_by  (断言者)
source       (来源)
observed_at  (观测时间)
valid_from   (生效时间)
valid_until  (失效时间)
superseded   (被替代)
```

这些字段严格属于 Assertion / Evidence / Provenance。

---

## 12.9 命题属性 (Proposition Attributes)

原生 Core 命题**应当不得 (SHOULD NOT)** 支持任意可变的语义属性。

如果某个关系需要额外的具有语义内涵的限定词，请采用以下方式之一：

1. 针对该命题创建另一个高阶命题（Proposition）；
2. 使用关系/事件 Concept 来表示多元关系（n-ary relationship）；
3. 使用 Profile 定义的专门语义结构。

示例：

不推荐使用如下方式：

```text
(Alice, works_for, Acme)
attributes = {
  role: "Engineer",
  since: "2024"
}
```

推荐采用：

```text
雇佣关系 Concept (Employment E)
E ─ employee → Alice
E ─ employer → Acme
E ─ role → "Engineer"
E ─ valid_from → 2024
```

并对需要认识论处理的主张建立断言。

这避免了在命题载荷中隐藏未受治理的语义事实。

---

# 13. 否定与虚假声明 (Negative and False Claims)

KIP 2.0 严格区分：

```text
认识论拒绝 (epistemic rejection)
语义布尔假值 (semantic false literal)
```

## 13.1 认识论拒绝 (Epistemic Rejection)

要表达：

> Carol 拒绝承认“Bob 是素食主义者”这一说法。

使用：

```text
P = (Bob, is_vegetarian, true)

Assertion:
  proposition = P
  stance = reject
```

---

## 13.2 语义布尔假值 (Semantic Boolean Value)

如果谓词显式对布尔值属性建模，创建以下命题在语义上也**可以 (MAY)** 是合法的：

```text
(Bob, is_vegetarian, false)
```

这是一个完全不同的命题。

认识论模型必须定义布尔对立命题之间如何进行交互推导。

---

## 13.3 建模规则 (Rule)

在对某个主体对命题的不同意进行建模时，优先推荐：

```text
stance = reject
```

仅当 `false` 确实是谓词的取值时，才使用字面量 `false`。

---

# 14. 断言 (Assertion)

## 14.1 为何断言是专用的核心元素类型 (Why Assertion Is a Dedicated Element Kind)

断言语义过于基础和关键，不能依赖常规的用户自定义 Concept Type。

引擎必须严格强制执行以下不变式：

```text
严格指向一个目标命题 (exactly one target Proposition)
合法的立场值 (valid stance values)
明确的生命周期语义 (lifecycle semantics)
系统来源的分离 (origin separation)
不可变性规则 (immutability rules)
证据引用的完整性 (evidence reference integrity)
策略安全检查 (policy checks)
时态字段规范 (temporal fields)
替代覆盖规则 (supersession rules)
```

若将 Assertion 做成普通 Concept，Schema 可能会意外破坏或重新定义这些核心不变式。

因此，`Assertion` 是原生的 Core 元素类型。

---

## 14.2 断言定义 (Definition)

`Assertion`（断言）记录了对一个命题的认识论承诺（Epistemic Commitment）。

一个断言严格对应一个目标命题。

---

## 14.3 逻辑数据结构 (Logical Shape)

```json
{
  "id": "assertion-123",
  "kind": "assertion",
  "space_id": "space-1",

  "proposition": {"id": "prop-123"},

  "asserted_by": {
    "id": "concept-alice"
  },

  "stance": "support",
  "mode": "stated",
  "confidence": 0.9,

  "valid_time": {
    "from": null,
    "until": null
  },

  "asserted_at": "2026-08-13T10:00:00Z",

  "evidence": [
    {
      "id": "evidence-1",
      "role": "support"
    }
  ],

  "lifecycle": {
    "status": "active",
    "supersedes": [],
    "superseded_by": [],
    "retracted_at": null
  },

  "context_refs": [],

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

---

## 14.4 断言主体 `asserted_by` (`asserted_by`)

`asserted_by` 代表**声明持有或产生该断言的语义主体（Semantic Actor）**。

它不是经过认证的底层调用者。

示例：

```text
Alice
某个组织 (an organization)
外部智能体 (an external agent)
模型推导出的推理主体 (a model-derived inference actor)
学术论文作者 (a research paper author)
```

当无法解析出有意义的语义主体时，`asserted_by` **可以 (MAY)** 缺省。

经过身份认证的底层写入主体在以下字段中独立提供：

```text
_system.origin.principal_id
```

---

## 14.5 立场 (Stance)

Core 核心立场取值：

```text
support    (支持 / 赞同)
reject     (拒绝 / 反对)
uncertain  (存疑 / 不确定)
```

Profile **可以 (MAY)** 仅通过带命名空间的扩展来扩展立场。

基础取值的核心含义**必须 (MUST)** 保持稳定。

---

## 14.6 模式 (Mode)

推荐的 Core 核心模式取值：

```text
observed      (观测得出)
stated        (口头/文本声明)
inferred      (推理得出)
predicted     (前瞻预测)
hypothetical  (假设性)
imported      (外部导入)
```

具体含义：

| 模式 (Mode) | 含义 |
| --- | --- |
| `observed` | 直接由观测、测量、工具或物理世界信号产生 |
| `stated` | 归属于某个人、组织或智能体的陈述表达 |
| `inferred` | 从其他认知状态推导得出 |
| `predicted` | 前瞻性的推测或预测声明 |
| `hypothetical` | 刻意不作实质承诺的情景假设或模型分析 |
| `imported` | 从外部记忆源中完整保留下来的记录 |

`mode` 本身并不决定信任度。

---

## 14.7 置信度 (Confidence)

`confidence` 回答的问题是：

> 在所陈述的条件下，该断言对其自身立场的支持力度有多强？

取值范围：

```text
0.0 ≤ confidence ≤ 1.0
```

`confidence` 是**可选的 (OPTIONAL)**，因为某些导入或引用的断言可能无法提供有意义的数值置信度。

**严禁 (MUST NOT)** 将其解释为：

```text
来源信任度 (source trust)
记忆强度 (memory strength)
凸显度 / 重要性 (salience)
实用效用 (utility)
引擎分配的后验概率 (probability assigned by the engine)
```

---

# 15. 断言不可变性与修订 (Assertion Immutability and Revision)

KIP 2.0 的核心目标是完整保留认识论历史。

因此，断言在概念上是特定时间点所作的陈述，而不是一个始终包含最新观点的可变槽位。

## 15.1 不可变的断言载荷 (Immutable Assertion Payload)

创建后，以下字段**应当 (SHOULD)** 是不可变的：

```text
proposition
asserted_by
stance
mode
confidence
asserted_at
valid_time
初始证据引用列表 (initial evidence citations)
```

如果认识论承诺发生了实质性变化，请创建一个新的断言。

---

## 15.2 可变的生命周期外包络 (Mutable Lifecycle Envelope)

在授权变更下，以下字段**可以 (MAY)** 发生改变：

```text
status          (生命周期状态)
superseded_by   (被替代关联)
retracted_at    (撤回时间)
retention       (留存策略)
governance      (治理策略)
review facets   (评审切面)
```

后续发现的新证据通常**应当 (SHOULD)** 产生：

```text
新的断言修订版本 (a new Assertion revision)
或
派生断言 (a derived Assertion)
```

而非直接篡改早期主体最初相信的内容。

---

## 15.3 为何置信度不反复原地修改 (Why Confidence Is Not Repeatedly Mutated)

假设：

```text
2026-01: 置信度 confidence = 0.6
2026-03: 新证据到达
2026-03: 置信度 confidence = 0.9
```

如果同一个断言直接被原地修改为 `0.6 → 0.9`，系统就会彻底丢失历史上的认识状态。

推荐做法：

```text
Assertion A1
  asserted_at = 2026-01
  confidence = 0.6

Assertion A2
  asserted_at = 2026-03
  confidence = 0.9
  supersedes = A1
```

现在大脑可以清晰回答：

```text
我们在 1 月份相信了什么？
是什么证据在 3 月份改变了我们的信念？
```

---

## 15.4 重复表达并非修订 (Repetition Is Not Revision)

如果 Alice 独立重申了三次相同的偏好，系统**可以 (MAY)** 保留三个独立的断言，或者保留与某个稳定的派生断言相关联的三项证据。

认识论模型决定重复陈述如何影响置信度。

Core 不会自动将重复的观测合并消除。

---

# 16. 断言生命周期 (Assertion Lifecycle)

Core 核心生命周期状态：

```text
active      (活跃)
retracted   (已撤回)
superseded  (已被替代)
expired     (已过期)
```

## 16.1 活跃状态 (Active)

断言仍属于当前认识状态的有效组成部分。

---

## 16.2 已撤回状态 (Retracted)

断言持有者或经过授权的流程显式撤回了该断言。

撤回操作不会物理删除历史记录。

---

## 16.3 已被替代状态 (Superseded)

在特定的主体/上下文/时态解释下，一个较新的断言取代了较旧的断言。

废弃替代不是普通的概念冲突。

两个主体可以长期持有不同观点，而无需任何一方替代另一方。

---

## 16.4 已过期状态 (Expired)

断言的适用时间窗口已过，或策略定义的断言生命周期已结束。

此状态与底层物理存储删除完全不同。

---

# 17. 证据 (Evidence)

## 17.1 为何证据是专用的核心元素类型 (Why Evidence Is a Dedicated Element Kind)

证据必须具备以下能力：

```text
独立可寻址 (addressable)
可安全共享 (shareable)
可计算内容摘要 (digestible)
受安全策略管控 (policy-controlled)
具备溯源链路关联 (provenance-linked)
可被多个断言共同引用 (citable by multiple Assertions)
可被独立纠正或撤回 (independently corrected/retracted)
可能是庞大的或存储在外部的实体 (potentially large or externally stored)
```

这充分证明了将其作为原生 Core 元素的必要性。

---

## 17.2 证据定义 (Definition)

`Evidence`（证据）是为支持或反驳一个或多个断言而引用的持久化认知制品。

证据的存在并不代表该证据在客观上必然正确。

---

## 17.3 逻辑数据结构 (Logical Shape)

```json
{
  "id": "evidence-123",
  "kind": "evidence",
  "space_id": "space-1",

  "evidence_class": "tool_result",

  "payload": {
    "mode": "external",
    "content_ref": "urn:sha256:...",
    "inline": null
  },

  "content_digest": "sha256:...",
  "media_type": "application/json",

  "observed_at": "2026-08-13T10:00:00Z",

  "source": [
    {"id": "concept-service-api"}
  ],

  "generated_by": "activity-12",

  "lifecycle": {
    "status": "active",
    "corrects": [],
    "corrected_by": []
  },

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

---

# 18. 证据类别体系 (Evidence Classes)

推荐的基准类别：

```text
observation         (直接观测)
user_statement      (用户陈述)
agent_statement     (智能体陈述)
tool_result         (工具调用结果)
measurement         (仪器/指标测量)
message             (通信消息)
document            (文档制品)
web_resource        (网页资源)
external_assertion  (外部导入断言)
human_feedback      (人类反馈)
derived_result      (衍生计算结果)
```

类别描述了证据制品的物理与逻辑形态。

它们并不直接赋予信任度。

---

# 19. 证据载荷 (Evidence Payload)

证据支持两种主要的载荷模式。

## 19.1 内联模式 (Inline)

适用于紧凑的不可变数据：

```json
{
  "mode": "inline",
  "inline": {
    "status": "healthy",
    "version": "2.1.4"
  }
}
```

---

## 19.2 外部 / 内容寻址模式 (External / Content-Addressed)

适用于：

```text
文档 (documents)
庞大的工具返回结果 (large tool results)
图像 (images)
系统日志 (logs)
网页快照 (web snapshots)
二进制文件 (binary files)
长对话转录文本 (long transcripts)
```

使用：

```json
{
  "mode": "external",
  "content_ref": "https://... 或 内容寻址 URI",
  "content_digest": "sha256:..."
}
```

只要能够进行稳定的校验，**应当 (SHOULD)** 始终提供内容摘要 `content_digest`。

---

## 19.3 原始内容不一定等同于记忆 (Raw Content Is Not Always Memory)

庞大的原始证据可以保留在外部，而认知中枢中仅存储：

```text
引用链接 (reference)
内容摘要 (digest)
媒体类型 (media type)
观测时间 (observation time)
溯源信息 (provenance)
安全策略 (policy)
```

这样既能保持认知图谱的紧凑精炼，又不会丢失可审计性。

---

# 20. 证据不可变性 (Evidence Immutability)

证据载荷在创建后**应当 (SHOULD)** 是不可变的。

如果源文档发生变更：

```text
创建新快照
→ 生成新的 Evidence
```

如果随后发现某项测量结果存在错误：

```text
旧 Evidence 依然保留
新 Evidence 纠正旧 Evidence
```

严禁悄然篡改历史制品。

可变的 Evidence 生命周期字段可以包括：

```text
status          (状态)
corrected_by    (被纠正关联)
retention       (留存策略)
governance      (治理策略)
review annotations (评审注解)
```

---

# 21. 证据支持与质疑链接 (Evidence Support and Challenge Links)

断言可以在结构上引用具有明确角色的证据：

```text
support    (支持)
challenge  (质疑/反驳)
context    (背景上下文)
```

示意：

```json
"evidence": [
  {"id": "E1", "role": "support"},
  {"id": "E2", "role": "challenge"}
]
```

同一个 Evidence **可以 (MAY)** 被多个断言同时引用。

Core 不强制规定数值化的证据加权算法。

---

# 22. 活动 (Activity)

## 22.1 为何活动是核心元素 (Why Activity Is Core)

一个真正的记忆大脑不仅必须回答：

> 存在什么来源？

更必须回答：

> 是什么处理过程将一个认知制品转换为了另一个认知制品？

示例：

```text
网页内容提取 (webpage extraction)
工具执行 (tool execution)
人工评审 (human review)
逻辑推理 (inference)
内容摘要生成 (summarization)
语义巩固 (consolidation)
技能编译 (skill compilation)
认知胶囊导入 (capsule import)
Schema 迁移 (schema migration)
实体合并 (entity merge)
```

`Activity` 构成了溯源有向无环图（Provenance DAG）的骨干脊梁。

---

## 22.2 活动定义 (Definition)

`Activity`（活动）表示一个有边界的处理过程，它使用、转换、观测或生成了认知元素或外部制品。

---

## 22.3 逻辑数据结构 (Logical Shape)

```json
{
  "id": "activity-123",
  "kind": "activity",
  "space_id": "space-1",

  "activity_class": "semantic_consolidation",

  "started_at": "2026-08-13T10:10:00Z",
  "ended_at": "2026-08-13T10:10:03Z",

  "inputs": [
    {"id": "evidence-1"},
    {"id": "evidence-2"}
  ],

  "outputs": [
    {"id": "assertion-9"}
  ],

  "associated_actors": [
    {"id": "concept-system-agent"}
  ],

  "parameters_digest": "sha256:...",
  "status": "completed",

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

---

# 23. 溯源有向无环图 (Provenance DAG)

推荐的 Core 核心溯源模式为：

```text
元素 / 外部制品 (Element / External Artifact)
          │
          │ input (输入)
          ▼
       活动 (Activity)
          │
          │ output (输出)
          ▼
       元素 (Element)
```

示例：

```text
网页快照 (WebPage Snapshot)
      │
      ▼
提取活动 (Extraction Activity)
      │
      ▼
证据 E1 (Evidence E1)
      │
      ▼
推理活动 (Inference Activity)
      │
      ▼
断言 A1 (Assertion A1)
      │
      ▼
巩固活动 (Consolidation Activity)
      │
      ▼
洞见 / 技能 (Insight / Skill)
```

该图谱可以逆向回溯以完整还原推导链路。

---

# 24. 声称溯源与引擎系统来源 (Claimed Provenance vs. Engine Origin)

这种区分对安全至关重要。

## 24.1 声称溯源 (Claimed Provenance)

普通的认知状态可以声称：

```text
Alice 说了 X
文档 Y 包含了 X
工具 Z 返回了 X
```

这些声明本身也可能是错误的。

它们通过以下途径进行表示：

```text
asserted_by
Evidence.source
Activity.associated_actors
语义命题 (semantic Propositions)
```

---

## 24.2 引擎系统来源 (Engine Origin)

每个持久化元素都拥有一个由引擎底层强制维护的 `_system.origin`。

示例：

```json
{
  "principal_id": "principal:agent-42",
  "channel": "formation",
  "import_id": null
}
```

该字段明确回答：

> 到底是谁实际触发并在本认知中枢中创建了这条记录？

它并不回答：

> 记录声称最初是谁说了这番内容？

---

# 25. 系统信息 `_system` (`_system`)

`_system` 包含不可篡改的引擎底层事实（Engine Truth）。

推荐字段：

```json
{
  "version": 4,
  "created_at": "2026-08-13T10:00:00Z",
  "updated_at": "2026-08-13T10:10:00Z",
  "created_tx": "tx-create",
  "updated_tx": "tx-update",
  "state": "active",

  "origin": {
    "principal_id": "principal-1",
    "channel": "direct | formation | maintenance | import | migration | system",
    "import_id": null
  }
}
```

实现**可以 (MAY)** 添加以下划线为前缀的额外字段。

客户端**必须 (MUST)** 将未知的 `_system` 字段视为只读。

---

# 26. 引擎来源的不可伪造性 (Engine Origin Is Non-Malleable)

作者层级的操作**严禁 (MUST NOT)** 能够：

```text
修改 principal_id
篡改 created_tx
篡改 created_at
伪称导入记录是在本地直接观测到的
将导入来源替换为受信任的本地工具来源
```

派生内容将获得一个描述派生写入操作的**全新本地来源（New Local Origin）**。

其先前的溯源链路仍然可以通过 Activity 输入和导入来源凭证（Receipt）完整回溯。

---

# 27. 导出来源与目标端来源 (Exported Origin vs. Destination Origin)

`_system` 是本地引擎的底层事实，**严禁 (MUST NOT)** 作为一个目标认知中枢的底层事实直接导入。

取而代之的是：

```text
源空间 (Source Space)
  _system.origin
       │
       ▼ export (导出)
可移植来源凭证 / 胶囊溯源 (Portable Origin Receipt / Capsule Provenance)
       │
       ▼ import (导入)
目标端证据 / 溯源 (Destination Evidence / Provenance)
       +
全新的目标端 _system.origin (New Destination _system.origin)
```

目标端清晰记录：

```text
谁执行了导入
何时导入
在哪个事务下
来自哪个胶囊
```

同时将源端来源信息完整保留为导入溯源。

这彻底防止了跨认知中枢边界的权限洗白（Authority Laundering）。

确切的可移植凭证格式由 KIP-2.0-Capsule.md 规范定义。

---

# 28. 记忆空间 (MemorySpace)

## 28.1 空间定义 (Definition)

`MemorySpace`（记忆空间）是 KIP 2.0 的主要所有权、安全策略、模式隔离与数据隔离边界。

它不是语义领域（Domain）。

---

## 28.2 逻辑数据结构 (Logical Shape)

```json
{
  "id": "space-123",
  "uri": "personal://yan",
  "name": "Yan Personal Brain",

  "owners": [
    "principal:yan"
  ],

  "default_policy_ref": "policy-1",

  "schema_packages": [
    "kip://core@2.0.0",
    "kip://profiles/cognitive-memory@2.0.0"
  ],

  "status": "active",

  "_system": {
    "created_at": "...",
    "updated_at": "..."
  }
}
```

确切的治理字段在 KIP-2.0-Governance.md 中最终敲定。

---

# 29. 每个元素归属唯一定界空间 (One Home Space Per Element)

每个认知元素都**必须 (MUST)** 严格拥有一个 `space_id`。

这并不意味着某个语义实体只能存在于一个 Space 中。

示例：

```text
personal://yan  → Concept "KIP"
org://alink     → Concept "KIP"
public://tech   → Concept "KIP"
```

这些 Concept 可以共享一个权威的外部身份，但它们始终是独立治理的认知记录。

这避免了让一个 Space 的策略依赖于另一个 Space 的内部图结构。

---

# 30. 空间不等于领域 (Space Is Not Domain)

```text
MemorySpace (记忆空间) = 所有权 / 安全治理 / 信任边界
Domain      (语义领域) = 主题 / 语义组织
```

`Domain` 不是 Core 核心元素类型。

认知 Profile 或语义包可以将 `Domain` 定义为一个 Concept Type。

单个 MemorySpace 可以包含多个不同的 Domain。

相同的 Domain 标签可以在多个 Space 中独立出现。
---

# 31. 每个元素上的治理挂钩 (Governance Hook on Every Element)

每个认知元素都**可以 (MAY)** 携带治理挂钩：

```json
"governance": {
  "classification": "private",
  "policy_ref": "policy-sensitive-profile"
}
```

若缺省，则应用所属 Space 的默认策略。

治理语义由引擎底层强制执行。

Prompt 提示词**严禁 (MUST NOT)** 作为最终的安全隐私边界。

---

# 32. 命题的存在性属于敏感数据 (Proposition Existence Is Sensitive Data)

尽管命题本身是真值中立的，但其存在本身就可能泄露机密信息。

示例：

```text
(Alice, has_medical_condition, ConditionX)
```

即使所有断言都被拒绝或处于不确定状态，该命题的存在本身就已经揭示了敏感的主题对象。

因此，安全治理**必须 (MUST)** 适用于所有认知元素：

```text
Concept       (概念)
Proposition   (命题)
Assertion     (断言)
Evidence      (证据)
Activity      (活动)
```

而不仅仅适用于 Assertion。

未经授权的查询**严禁 (MUST NOT)** 泄露：

```text
元素的存在性 (element existence)
统计计数 (counts)
搜索命中结果 (search hits)
图节点的度数 (graph degree)
错误差异信息 (error differences)
```

在策略禁止此类披露的场景下必须严格遵守。

详细的侧信道防范规则详见 KIP-2.0-Governance.md。

---

# 33. 数据留存机制 (Retention)

留存（Retention）属于底层存储/生命周期层面的关注点，既不是客观世界的有效时间，也不是记忆的可提取性。

通用的可选结构：

```json
{
  "retention_class": "transient | standard | durable | legal_hold",
  "expires_at": "2026-12-01T00:00:00Z",
  "legal_hold": false
}
```

确切的留存类别名称由策略或 Profile 定义。

---

# 34. `expires_at` 不等于 `valid_time.until` (`expires_at` Is Not `valid_time.until`)

这两个字段回答完全不同的问题：

```text
Assertion.valid_time.until
    在客观世界中，该声明从何时起不再为真/不再适用？

Element.retention.expires_at
    存储系统在何时可以考虑归档/物理清除该记录？
```

示例：

```text
Alice 旧的时区在 2025 年已经失效。
关于该旧时区的断言可以永久存储在系统中，以备历史审计。
```

因此：

```text
valid_time.until = 2025
expires_at       = null
```

是完全合理且合法的配置。

---

# 35. 切面体系 (Facets)

## 35.1 设立目的 (Purpose)

各个 Profile 需要对 Core 核心元素进行扩展，同时避免重新引入无类型的通用元数据袋。

KIP 2.0 采用**切面（Facets）**机制。

逻辑形式：

```json
"facets": {
  "kip://profiles/cognitive-memory@2.0.0/MnemonicState": {
    "memory_strength": 0.72,
    "salience": 0.91
  }
}
```

---

## 35.2 切面规则 (Facet Rules)

每个 Facet 的键就是精确的 Facet 符号引用，且**必须 (MUST)** 解析为：

```text
Schema Package 中的一个 Facet 符号
或
一个已注册的扩展定义
```

Facet 内部字段**应当 (SHOULD)** 经过机器自动化模式校验。

---

## 35.3 认知记忆切面 (Cognitive Memory Facet)

认知记忆 Profile（Cognitive Memory Profile）可以定义如下字段：

```text
memory_strength       (记忆强度)
salience              (凸显度)
utility               (效用)
learning_value        (学习价值)
consolidation_status  (巩固状态)
memory_class          (记忆类别)
```

这些不是 Core 核心的客观真值语义。

---

## 35.4 切面不得绕过认识论模型 (Facets Cannot Bypass the Epistemic Model)

Profile **严禁 (MUST NOT)** 仅仅为了规避断言语义，而将存在独立争议的客观事实隐藏在 Facet 内部。

如果 Facet 中的某个值需要：

```text
注明独立来源 (source)
具备独立置信度 (confidence)
约束有效时间区间 (validity)
处理冲突矛盾 (contradiction)
提供客观证据支持 (evidence)
```

它通常**应当 (SHOULD)** 建模为“命题 + 断言 (Proposition + Assertion)”。

---

# 36. 时态时钟体系 (Temporal Fields)

KIP 2.0 识别并支持四种不同的时间时钟。

## 36.1 生效时间 (Valid Time)

在 Assertion 上：

```text
valid_time.from    (生效时间)
valid_time.until   (失效时间)
```

表示命题声称在客观世界中成立的时间区间。

---

## 36.2 观测时间 (Observation Time)

在 Evidence 上：

```text
observed_at  (观测时间)
```

表示证据被实际观测、测量或捕获的时间点。

---

## 36.3 断言时间 (Assertion Time)

在 Assertion 上：

```text
asserted_at  (断言时间)
```

表示语义主体作出或生成该断言的时间点。

---

## 36.4 引擎事务时间 (Engine Transaction Time)

在 `_system` 中：

```text
created_at  (记录创建时间)
updated_at  (记录更新时间)
created_tx  (创建事务 ID)
updated_tx  (更新事务 ID)
```

表示认知中枢底层实际记录该状态的时间点。

---

# 37. 双时态能力要求 (Bitemporal Capability Requirement)

数据模型**必须 (MUST)** 保留足够的信息，以便未来的查询能够清晰区分：

> 在客观世界时间 T，什么是真实的？

与：

> 截至认知事务时间 T，该智能体知道/相信了什么？

KQL 已经确定了对应语法：`AS OF` 选择认知事务状态，`FOR TIME` 选择客观世界有效时间，二者**必须 (MUST)** 保持相互独立。

数据模型必须原生具备该能力，而无需在未来进行重构。

---

# 38. 接受的信念是视图而非核心状态 (Accepted Belief Is a View, Not Core State)

KIP Core 存储：

```text
命题 (Propositions)
断言 (Assertions)
证据 (Evidence)
历史溯源 (Provenance)
安全策略 (Policy)
时态时钟 (Time)
```

它**不**将通用的：

```text
truth = true
accepted = true
current_fact = true
```

作为权威的底层状态直接存储。

取而代之的是：

```text
原始认知状态 (Raw Cognitive State)
        │
        ▼
认识论投影 (Epistemic Projection)
        │
        ├ accepted     (已接受为真)
        ├ contested    (存在争议)
        ├ uncertain    (存疑不确定)
        └ rejected     (已明确拒绝)
```

不同的消费智能体或不同的执行目的可以合法地计算出不同的认识论投影。

认识论模型（Epistemic Model）定义了投影的输入与输出规范。

---

# 39. 信任度不复制到命题上 (Trust Is Not Copied Onto Propositions)

信任是具有高度上下文相关性的。

示例：

```text
Alice 关于自己颜色偏好的自我陈述        → 高度信任
Alice 关于生产服务器健康状态的自我陈述  → 低信任 / 未知信任
经过验证的部署工具返回的服务器健康结果  → 高度信任
外部导入的未签名 Shell 执行技能        → 几乎为零的执行权限
```

因此，KIP Core **应当不得 (SHOULD NOT)** 向每个 Proposition 机械复制一个全局静态的 `trust` 数值。

信任度应针对以下维度进行综合动态评估：

```text
调用主体 (principal)
语义主体 (semantic actor)
证据类别 (Evidence class)
数据来源 (origin)
使用目的 (purpose)
空间策略 (Space policy)
环境上下文 (context)
```

---

# 40. 记忆强度并非核心信念状态 (Memory Strength Is Not Core Belief State)

`memory_strength`（记忆强度）属于认知记忆 Profile（Cognitive Memory Profile）。

一个事实可能是：

```text
高置信度 (high confidence)
低记忆强度 (low memory strength)
```

一次失败的经验（Experience）可能是：

```text
低程序效用 (low procedural utility)
高学习价值 (high learning value)
高凸显度 (high salience)
```

Core 完整保留认知元素。

Profile 则决定记忆之间的遗忘与激活竞争。

---

# 41. 删除模型 (Deletion Model)

KIP 2.0 严格区分以下四种生命周期操作：

```text
认识论生命周期 (epistemic lifecycle)
留存生命周期 (retention lifecycle)
逻辑删除 (logical deletion)
物理清除 (physical purge)
```

---

## 41.1 断言撤回并非删除 (Assertion Retraction Is Not Deletion)

```text
status = retracted
```

保留了历史上的信念记录。

---

## 41.2 归档并非物理清除 (Archive Is Not Purge)

已归档的记忆可以在日常召回中被排除，但仍然保留以备审计。

---

## 41.3 墓碑标记 (Tombstone)

在物理清除之前，Core 元素**可以 (MAY)** 进入逻辑删除状态：

```text
_system.state = tombstoned
```

墓碑记录**应当 (SHOULD)** 保留足够的标识信息，以防止意外的 ID 复用并维护引用完整性。

---

## 41.4 物理清除 (Physical Purge)

物理清除会从底层彻底删除字节数据。

它**应当 (SHOULD)** 满足：

```text
受严格策略管控 (policy controlled)
具备完整审计记录 (auditable)
感知引用关系 (reference aware)
对证据的处理保持高度审慎 (conservative for Evidence)
```

如果法律或合规隐私策略要求立即彻底清除，该策略将覆盖通用的留存建议。

---

# 42. 删除时的引用完整性 (Reference Integrity on Deletion)

引擎**严禁 (MUST NOT)** 隐蔽地遗留悬空的强制性引用。

在清除之前：

```text
Assertion → Proposition
Assertion → Evidence
Evidence → Activity
Activity → input/output
```

根据对象类型和治理规则，引擎必须采取以下措施之一：

```text
阻止删除操作 (prevent deletion)
在明确语义下级联处理 (cascade under explicit semantics)
替换为墓碑引用 (replace with tombstone reference)
按策略脱敏遮蔽 (redact under policy)
```

具体的删除行为归属于 KML 和 Governance 规范。

---

# 43. 证据删除具有重大影响 (Evidence Deletion Is High Impact)

删除反面证据会人为增强未来的某个信念。

因此，对 Evidence 的删除**应当 (SHOULD)** 受到比删除普通的类似缓存的 Concept 更为严格的管控。

高影响力的 Evidence 删除**应当 (SHOULD)** 做到：

```text
经过专门授权 (authorized)
经过严格审计 (audited)
在变更流中清晰可见 (visible in change stream)
在策略允许时保留墓碑 (preserve tombstone when policy permits)
```

---

# 44. 派生认知元素 (Derived Cognitive Elements)

洞见（Insights）、知识断言（Knowledge assertions）、摘要和技能（Skills）可以从早期的元素派生而来。

派生输出**应当 (SHOULD)** 显式关联到一个 `Activity`。

示例：

```text
证据 E1 (Evidence E1)
证据 E2 (Evidence E2)
    │
    ▼
活动: 语义巩固 (Activity: semantic_consolidation)
    │
    ▼
断言 A9 (Assertion A9)
```

在技能形成过程中：

```text
经验 X (Experience X)
经验 Y (Experience Y)
    │
    ▼
活动: 程序性巩固 (Activity: procedural_consolidation)
    │
    ▼
技能 S (Skill S)
```

这完整保留了后续溯源与修订的能力。

---

# 45. 派生权限不得自我提升 (Derived Authority Cannot Self-Elevate)

本地生成的派生对象可以拥有可信的**本地来源（Local Origin）**，但其本身可能完全依赖于不可信的输入数据。

因此：

```text
本地系统来源 (local origin)
≠
高认识论权威 (high epistemic authority)
≠
高执行行动权限 (high action authority)
```

权限提升必须经过显式的安全策略检查与验证流程。

这对于以下内容尤为关键：

```text
技能 (Skill)
提示词 (Prompt)
代码 (Code)
工具调用策略 (Tool Policy)
子智能体配置 (Sub-agent Configuration)
```

---

# 46. 经验 Profile 的结构数据模型 (Structural Data Model for Experience Profiles)

Core 模型不直接定义 Experience，但必须能够对其进行优雅支撑。

Profile 可以表示：

```text
Experience     → Concept (经验)
ExperienceStep → Concept (经验步骤)
Skill          → Concept (技能)
```

并配合 Profile 定义的结构引用：

```text
Experience.has_step       → ExperienceStep (经验包含的步骤，有序)
Experience.experienced_by → actor Concept  (经历经验的主体)
Skill.compiled_from       → Experience     (技能编译自的经验)
Skill.compiled_by         → Activity       (完成编译的活动)
```

这些可以是 Profile 原生的结构字段，也可以是 Profile 定义的图关系。

步骤顺序归属于有序的 `has_step` 引用（见第 74 节），查询侧以 `?edge.index` 暴露。步骤本身不携带独立的顺序属性。

如果 Profile 希望某个关系能够被独立地在认识论上提出质疑，则必须改用“命题 + 断言 (Proposition + Assertion)”。

---

# 47. 结构与认识论对比示例：经验步骤 (Structural vs. Epistemic Example: Experience Step)

假设：

```text
经验 E 包含步骤 S3 (Experience E has step S3)
```

作为内部记录结构：

```text
E.has_step → S3
```

属于**结构引用 (Structural)**。

但是：

> 步骤 S3 导致了系统故障

是一个语义因果主张：

```text
P = (S3, caused, FailureEvent)
Assertion A supports P
```

严禁将时间上的先后顺序误判为因果关系。

---

# 48. 模式引用机制 (Schema References)

核心数据模型使用不透明且支持版本解析的引用：

```text
schema_ref
predicate_ref
facet namespace
```

示意：

```text
kip://core@2.0.0/Assertion
kip://profiles/cognitive-memory@2.0.0/Experience
kip://ldclabs/organization@1.3.0/works_for
```

确切的标识符语法详见 KIP-2.0-Schema-Packages.md。

Core 核心要求：

> 引用必须在当前执行上下文中确定性地解析为一个 Schema 定义。

---

# 49. 核心内置类型与模式类型 (Core Built-In Types vs. Schema Types)

原生核心元素类型是固定不可扩充的：

```text
Concept
Proposition
Assertion
Evidence
Activity
```

Concept Type 由 Schema 定义：

```text
Person        (人物)
Organization  (组织)
Project       (项目)
Experience    (经验)
Skill         (技能)
Domain        (领域)
```

Predicate Type 由 Schema 定义：

```text
prefers       (偏好)
works_for     (工作于)
located_in    (位于)
caused        (导致)
depends_on    (依赖于)
```

Assertion 的 stance/mode 以及 Evidence/Activity 的 class 注册表可以包含 Core 核心预置值以及带命名空间的扩展值。

---

# 50. 模式校验边界 (Schema Validation Boundary)

引擎**必须 (MUST)** 至少对以下内容进行严格校验：

```text
元素类型的基本数据形态 (element kind shape)
必需的 Core 核心字段 (required Core fields)
引用类型合法性 (reference kind)
同空间闭包规则 (same-space closure)
Proposition 主谓宾的合法性 (Proposition subject/object legality)
Predicate 谓词的注册状态 (Predicate registration)
Literal 字面量的数据类型约束 (Literal datatype constraints)
Assertion stance/mode 的合法性 (Assertion stance/mode legality)
Assertion 目标命题的存在性 (Assertion target existence)
Evidence 引用目标的存在性 (Evidence reference existence)
系统系统字段的不可变性 (system-field immutability)
```

Profile / Schema 校验可以额外增加：

```text
属性必填约束 (attribute requirements)
基数约束 (cardinality)
允许的目标类型 (allowed target types)
切面数据结构形态 (facet shape)
领域专有约束条件 (domain-specific constraints)
```

---

# 51. 模型优先的人体工程学投影 (Model-First Ergonomic Projection)

规范的数据模型比 KIP 1.x 更加严谨和显式。

面向模型的 DSL 不应迫使 LLM 在常见场景下手动创建所有底层对象。

例如输入的意图：

```text
Alice prefers dark mode. (Alice 偏好深色模式)
```

在概念上可以自动编译为：

```text
1. 解析 / 创建 Alice Concept
2. 解析 / 创建 DarkMode Concept
3. 规范化 Proposition(Alice, prefers, DarkMode)
4. 创建 Assertion:
     stance = support
     mode = stated
     asserted_by = Alice
5. 为用户的声明陈述附加 Evidence
6. 自动附加引擎底层 origin 来源
```

KIP 2.0 **应当 (SHOULD)** 为此类工作流提供语法糖。

语法糖绝不能削弱规范的底层语义。

---

# 52. 语法脱糖属于协议语义组成部分 (Desugaring Is Part of Protocol Semantics)

如果简洁的 KML 语法形式能够自动创建：

```text
Proposition
Assertion
Evidence
```

协议必须定义确定性的脱糖（Desugaring）规则。

针对相同的标准化输入，两个符合规范的引擎应当在以下方面达成完全一致：

```text
创建了哪些元素类型 (which element kinds are created)
推导了哪些字段 (which fields are inferred)
应用了哪些默认值 (what defaults apply)
由引擎维护了哪个系统来源 (which origin is engine-maintained)
```

这防止了符合人体工程学的简写语法退化为特定实现的私有认识论逻辑。

---

# 53. 原始视图与投影视图 (Raw View vs. Projected View)

Core 模型预留了至少两种读取表示形式。

## 53.1 原始核心视图 (Raw Core View)

展示：

```text
Concept
Proposition
Assertion
Evidence
Activity
系统来源信息 (system origin)
```

不执行信念塌陷与收敛。

---

## 53.2 认识论投影视图 (Epistemic Projection View)

为特定的消费主体/目的/时间展示计算后的信念状态：

```text
accepted   (已接受)
contested  (存在争议)
uncertain  (存疑)
rejected   (已拒绝)
```

---

## 53.3 兼容性视图 (Compatibility View)

KIP 1.x 兼容查询**可以 (MAY)** 将一个被接受的命题呈现为传统的事实链接。

这是一种视图投影，而非底层的权威存储。

---

# 54. 元素可变性矩阵 (Element Mutability Matrix)

推荐的 Core 可变性规则：

| 元素 / 字段 | 是否可变？ | 规则 |
| --- | --- | --- |
| `id` | 否 | 完全不可变 (immutable) |
| `space_id` | 否 | 跨空间移动 = 导出/导入 或 显式特权迁移 |
| Concept `schema_ref` | 通常不可变 | 类型迁移必须显式进行 |
| Concept `key` | 否 | 幂等逻辑标识 |
| Concept `name` | 是 | 语义接地展示标签 |
| Concept `canonical_id` | 受限 | 属于身份绑定特权操作 |
| Concept `attributes` | 是 | 受 Schema 和安全策略管控 |
| Concept 结构引用 | 是 | 按引用逐条 SET/UNSET；基数在提交时校验 |
| Proposition 元组 | 否 | 新的元组 = 创建新的 Proposition |
| Assertion 认识论载荷 | 否 | 新的信念 = 创建新的 Assertion |
| Assertion 生命周期 | 是 | 撤回 / 替代覆盖操作 |
| Assertion / Evidence 结构引用 | 否 | 错误的引用只能通过新建记录来修正，绝不通过删除 |
| Evidence 载荷 | 否 | 修正错误 = 创建新的 Evidence |
| Evidence 生命周期 | 是 | 纠错 / 撤回 / 归档操作 |
| Activity 输入/输出 | 完成后不可变 | 维护溯源完整性 |
| Activity 状态 | 在终态前可变 | 受控的状态流转 |
| governance (治理) | 是 | 受安全策略严格控制 |
| retention (留存) | 是 | 受安全策略严格控制 |
| facets (切面) | 由 Profile 定义 | 遵循 Profile 专有规则 |
| `_system` (系统字段) | 仅引擎可写 | 作者/客户端完全只读 |

---

# 55. 活动生命周期 (Activity Lifecycle)

推荐状态：

```text
pending    (待处理)
running    (运行中)
completed  (已完成)
failed     (已失败)
cancelled  (已取消)
```

一旦进入终态，以下字段**应当 (SHOULD)** 完全不可变：

```text
inputs             (输入)
outputs            (输出)
associated actors  (关联主体)
parameters digest  (参数摘要)
start/end time     (开始与结束时间)
```

对 Activity 记录的修正**应当 (SHOULD)** 产生：

```text
新的 Activity
或
审计修正记录
```

而非直接篡改历史溯源。

---

# 56. 活动认证级别 (Activity Attestation Level)

并非所有 Activity 记录都具备相同的溯源可信强度。

推荐字段/切面：

```text
record_mode:
  engine_observed
  actor_reported
  imported
```

含义：

```text
engine_observed
    认知中枢/运行时可以明确证明其亲自执行或直接观测了该活动。

actor_reported
    某个主体声称该活动曾经发生。

imported
    该活动记录来自另一个外部系统或认知胶囊。
```

该字段本身并不直接决定信任度，但可以防止外部声称的溯源被误判为引擎自身的直接观测。

---

# 57. 断言示例：用户陈述 (Assertion Example: User Statement)

用户说：

> “我偏好深色模式。” ("I prefer dark mode.")

Core 核心状态：

```text
Concept Alice
Concept DarkMode

P1 = (Alice, prefers, DarkMode)

Evidence E1
  class = user_statement
  payload = 消息片段文本
  observed_at = T1

Assertion A1
  proposition = P1
  asserted_by = Alice
  stance = support
  mode = stated
  confidence = 可选
  evidence = E1

_system.origin(A1)
  principal = 经过认证的调用智能体/用户通信信道
```

原始陈述来源与底层写入来源保持严格清晰的分离。

---

# 58. 断言示例：工具观测 (Assertion Example: Tool Observation)

工具返回：

```text
deployment_status = healthy
```

Core 核心状态：

```text
P2 = (Deployment42, status, "healthy")

Evidence E2
  class = tool_result
  content_digest = ...
  observed_at = T2

Assertion A2
  proposition = P2
  stance = support
  mode = observed
  evidence = E2
```

对 E2 的信任度取决于工具及其来源信道的安全策略。

---

# 59. 断言示例：逻辑推理 (Assertion Example: Inference)

基于：

```text
A1
A2
```

大脑推导出：

```text
P3
```

创建：

```text
Activity I1
  class = inference
  inputs = A1, A2
  outputs = A3

Assertion A3
  proposition = P3
  mode = inferred
  evidence 字段可以引用 derived_result 类型的 Evidence
```

该推理不会抹去其源头推导依赖链。

---

# 60. 冲突矛盾示例 (Contradiction Example)

```text
P1 = (Bob, is_vegetarian, true)

A1
  asserted_by = Alice
  stance = support
  confidence = 0.9

A2
  asserted_by = Carol
  stance = reject
  confidence = 0.8
```

两者都是完全合法的 Core 状态。

系统不会发生自动数据损坏。

无需删除任何 Proposition。

由认识论投影（Epistemic Projection）决定最终输出是：

```text
accepted   (接受)
rejected   (拒绝)
contested  (争议)
uncertain  (存疑)
```

---

# 61. 时态演变示例 (Temporal Evolution Example)

```text
P1 = (Alice, timezone, "+08:00")
P2 = (Alice, timezone, "+01:00")
```

断言：

```text
A1 支持 P1
  valid_until = 2026-09-01

A2 支持 P2
  valid_from = 2026-09-01
```

无需执行覆盖擦除。

大脑可以直接重构完整的历史状态。

---

# 62. 纠正与冲突的区别 (Correction vs. Contradiction)

这两者具有本质区别。

## 纠正 (Correction)

同一个来源或处理流程承认早期的声明存在错误：

```text
A2 supersedes A1 (A2 废弃替代 A1)
```

## 冲突 (Contradiction)

独立的断言之间存在分歧和矛盾：

```text
A1 与 A2 并存共处
```

此时不包含任何替代关系。

认识论模型可以推导出二者之间的冲突关系。

---

# 63. 概念存在性与身份置信度 (Concept Existence and Identity Confidence)

Concept 节点不应携带通用的：

```text
confidence = 0.6
```

因为该数字具有极大的歧义性。

可能的解释包括：

```text
对该实体客观存在的置信度 (confidence the entity exists)
对当前提及准确消歧指代该实体的置信度 (confidence this mention resolves to this entity)
对 canonical_id 准确无误的置信度 (confidence canonical_id is correct)
对名称拼写正确的置信度 (confidence name is correct)
```

在重要场景下应分别进行独立建模。

示例：

```text
(Mention17, refers_to, Alice)
Assertion confidence = 0.6

(Alice, same_as, DidConceptX)
Assertion confidence = 0.95
```

Concept 的存在性始终只代表语义上的可寻址性，而非认识论上的真理。

---

# 64. 记忆空间导入语义 (MemorySpace Import Semantics)

导入操作不会将元素连同其原有的本地 `id` 直接平移到目标空间中。

概念流程：

```text
源端元素 (Source element)
   │ export (导出)
   ▼
胶囊内部表示 (Capsule-local representation)
   │ import (导入)
   ▼
目标端本地元素 (Destination local element)
```

目标空间：

```text
分配 / 解析本地新 ID (assigns/resolves local IDs)
记录全新的 _system.origin (records new _system.origin)
完整保留源端溯源链路 (preserves source provenance)
应用本地安全策略 (applies local policy)
绝不自动继承源端权限 (does not inherit source authority automatically)
```

确切的映射规则在 KIP-2.0-Capsule.md 中定义。

---

# 65. 导入断言 (Imported Assertion)

导入的 Assertion 应当完整保留：

```text
远端语义主体 (remote semantic actor)
远端断言时间 (remote assertion time)
远端立场 / 模式 / 置信度 (remote stance/mode/confidence)
远端证据与溯源链路（若可用）(remote evidence/provenance when available)
```

但目标端 Core 会额外记录：

```text
本地模式 / 导入上下文 (local mode/import context)
目标端 _system.origin (destination _system.origin)
胶囊 / 导入凭证 (capsule/import receipt)
```

目标端可以选择不在其默认接受的认识论投影中激活该断言。

---

# 66. 导入的可执行记忆 (Imported Executable Memory)

技能（Skill）由 Profile 定义，但 Core 治理层必须提供安全默认值。

被分类为以下特性的导入元素：

```text
行为性 (behavioral)
可执行 (executable)
```

在经过本地校验与安全策略提权之前，**应当 (SHOULD)** 默认不具备任何行动执行权限。

有效的数字签名证明了：

```text
完整性 (integrity)
来源绑定真实性 (origin binding)
```

但**并不**证明：

```text
客观正确性 (truth)
运行安全性 (safety)
环境适用性 (applicability)
实际效用 (utility)
执行授权 (permission to execute)
```

---

# 67. 数据密级与行动权限的分离 (Classification and Authority Are Different)

一条记忆的状态可以是：

```text
classification = public (公开密级)
authority = descriptive (仅描述性权限)
```

或者：

```text
classification = secret (机密密级)
authority = executable  (可执行权限)
```

数据密级回答：

> 谁可以访问该数据？

行动权限回答：

> 该数据可以多大程度地驱动和影响行为？

确切的权限模型归属于 Governance 和 Cognitive Memory Profile 规范。

Core 严禁将二者混淆。

---

# 68. 核心元素等价性 (Core Element Equality)

两个认知元素当且仅当满足以下条件时，才是同一个持久化元素：

```text
id 严格相等
```

语义等价性则完全不同。

示例：

```text
两个不同的 Concept 可能指代同一个外部现实实体
两个 Proposition 可能在 Concept 合并后规范化为同一陈述
两个 Evidence 项可能包含完全相同的字节内容
两个 Assertion 可能会在不同时间表达完全相同的承诺立场
```

KIP 绝不能仅仅因为载荷内容相等就将它们随意合并消除。

---

# 69. 内容摘要 (Content Digests)

Evidence、Activity、Capsule 以及可选的大型 Concept 载荷**可以 (MAY)** 携带哈希摘要。

摘要在指定的规范化算法下证明了载荷的等价性与完整性。

它并不直接证明语义上的同一性。

示例：

两条 Evidence 记录可以具有完全相同的文档摘要，但具有不同的：

```text
观测时间 (observation time)
系统来源 (origin)
安全策略 (policy)
环境上下文 (context)
```

因此它们依然是两条彼此独立的 Evidence 元素。

---

# 70. 幂等创建键 (Idempotent Creation Keys)

对于自主智能体而言，操作重试是常见现象。

KIP 2.0 **应当 (SHOULD)** 在事务级重试键之外，支持逻辑层面的幂等创建。

推荐概念：

```text
client_key (客户端幂等键)
```

用于非结构化规范的元素。

推荐的唯一性范围：

```text
(space_id, kind, client_key)
```

或 Schema 作用域内的等价形式。

示例：

```text
来自链路追踪事件 ID 的 Evidence
来自确定性记忆形成条目 ID 的 Assertion
来自工具调用 ID 的 Activity
来自运行 Run ID 的 Experience
```

KML 通过 `CREATE CONCEPT` / `CREATE EVIDENCE` / `CREATE ASSERTION` / `CREATE ACTIVITY`
上的 `CLIENT KEY :key` 子句来表达这一点。

---

# 71. 命题幂等性无需客户端键 (Proposition Idempotency Needs No Client Key)

Proposition 在结构上已经是规范化的：

```text
(space, subject, predicate, object)
```

两次创建完全相同的 Proposition 会直接解析为同一个规范命题。

这是将 Proposition 与 Assertion 严格分离的最主要优势之一。

---

# 72. 断言幂等性确实需要外部键 (Assertion Idempotency Does Need an External Key)

同一个语义主体可能会多次发表完全相同的断言。

因此，Core **严禁 (MUST NOT)** 仅仅依据以下内容对 Assertion 进行去重合并：

```text
proposition  (目标命题)
asserted_by  (断言主体)
stance       (立场)
```

某次写入操作的网络重试与一次真实的重复陈述是两个截然不同的事件。

利用：

```text
事务幂等性 (transaction idempotency)
client_key (客户端幂等键)
源事件唯一标识 (source event identity)
```

来严格区分重试与重复陈述。

---

# 73. 证据幂等性不等于摘要去重 (Evidence Idempotency Does Not Equal Digest Deduplication)

两次捕获到完全相同的字节内容可能代表不同的 Evidence 证据：

```text
周一观测到的页面快照
周五观测到的页面快照
```

内容摘要完全相同，但实际发生的观测事件不同。

实现**可以 (MAY)** 在物理层面去重底层 Blob 存储。

但**严禁 (MUST NOT)** 仅仅因为载荷哈希摘要一致就自动合并认知 Evidence 的逻辑身份。

---

# 74. 结构引用基数 (Structural Reference Cardinality)

Core 核心结构引用字段具有明确定义的基数约束。

示例：

```text
Assertion.proposition
    严格为 1 (exactly 1)

Assertion.evidence
    0..N

Assertion.supersedes
    0..N

Evidence.generated_by
    0..1

Activity.inputs
    0..N

Activity.outputs
    0..N
```

Schema / Profile 结构自行定义各自的引用基数。

结构字段还**可以 (MAY)** 被声明为**有序 (ordered)**。对于有序字段，引擎为每个源元素维护一份稳定、稠密、从零开始的全序：

```text
未显式指定 index 的引用按变更顺序追加
显式的 {index: n} 赋值声明期望的零基位置
同一变更计划中相互冲突的显式位置必须校验失败
提交后的顺序必须稠密 (0..n-1) 且确定
移除某个引用后，剩余顺序会重新致密化
```

超出当前稠密范围 `0..len` 的显式 `{index: n}` **必须 (MUST)** 校验失败：位置是稠密的，因此最后一条已有引用之后唯一合法的位置就是 `len`（追加）。

顺序归属于引用本身，而非被引用的目标。Profile **严禁 (MUST NOT)** 在被引用元素上再加一个
`ordinal`/`sequence` 属性，否则同一份顺序就会出现第二个事实来源。查询通过结构模式绑定上的
虚拟字段 `?edge.index` 读取当前位置；无序字段不暴露 index。

顺序仅仅是记录拓扑：

```text
索引顺序 ≠ 因果关系
```

被引用元素之间的因果主张属于语义命题 + 断言（见第 47 节）。

---

# 75. 无隐藏思维链字段 (No Hidden Chain-of-Thought Field)

没有任何 Core 核心元素包含或强制要求：

```text
private_chain_of_thought     (私有思维链)
hidden_reasoning_trace       (隐藏推理轨迹)
token_level_deliberation     (Token 级别的思考过程)
```

Activity、Experience 或 Assertion **可以 (MAY)** 通过 Profile 定义的字段携带简洁、对外有价值的理论依据或决策摘要。

该摘要属于普通的认知制品，并且其自身也可以具备完整的溯源。

---

# 76. 内容与派生索引的分离 (Separation of Content from Derived Indexes)

以下各项属于具体的实现/索引状态，而非权威的认知内容：

```text
嵌入向量 (embedding vector)
倒排索引 Token 列表 (inverted-index tokens)
近似最近邻图索引边缘 (ANN graph edges)
BM25 统计指标 (BM25 statistics)
检索缓存 (search cache)
查询热度 (query popularity)
访问计数 (access count)
```

认知胶囊（Cognitive Capsules）中**严禁 (MUST NOT)** 强制要求包含这些状态。

目标端可以完全基于权威数据重新构建它们。

---

# 77. 检索得分属于临时瞬态 (Search Score Is Transient)

搜索结果**可以 (MAY)** 携带临时字段，例如：

```text
_score
_score_components
```

除非 Profile 明确记录了评估制品，否则它们不是持久化的元素状态。

KIP 2.0 应当完整继承 KIP 1.x 的核心原则：Embedding 向量与检索索引始终保留在协议边界之后。

---

# 78. 核心系统状态与 Profile 状态 (Core System State vs. Profile State)

Core `_system` 示例：

```text
version         (版本)
created_at      (创建时间)
updated_at      (更新时间)
transaction IDs (事务 ID)
origin          (系统来源)
tombstone state (墓碑状态)
```

Profile 切面（Facet）示例：

```text
memory_strength       (记忆强度)
salience              (凸显度)
utility               (效用)
consolidation_status  (巩固状态)
learning_value        (学习价值)
```

严禁将 Profile 状态放入 `_system` 中。

严禁将引擎底层事实放入 Profile Facet 中。

---

# 79. 核心系统状态与治理状态 (Core System State vs. Governance State)

治理状态 (Governance)：

```text
classification        (数据密级)
policy_ref            (策略引用)
retention constraint  (留存约束)
```

系统记账状态 (System bookkeeping)：

```text
version               (版本号)
origin principal      (调用主体)
transaction ID        (事务 ID)
created_at            (创建时间)
```

管理员可以在安全策略许可下修改治理配置。

任何管理员都**严禁**能够通过普通的治理变更操作来篡改引擎底层的执行历史。

---

# 80. 核心系统状态与认识论状态 (Core System State vs. Epistemic State)

认识论状态由以下对象显式表示：

```text
Assertion            (断言)
Evidence             (证据)
Activity / 溯源      (活动 / 溯源)
```

严禁存储如下系统字段：

```text
_system.confidence
_system.truth
_system.accepted
```

引擎并不是全知全能的普适认识论权威。

---

# 81. 版本控制机制 (Versioning)

每个可变的认知元素都携带：

```text
_system.version
```

在每次成功变更时单调递增。

版本号特性：

```text
由引擎底层自动维护 (engine-maintained)
属于元素本地的状态 (local to the element)
不是语义事实 (not a semantic fact)
不是可移植的权威依据 (not portable authority)
```

`EXPECT VERSION` 乐观并发控制机制与该模型完全兼容。

---

# 82. 事务唯一标识 (Transaction Identity)

每次写入操作都严格归属于一个引擎事务。

元素至少记录：

```text
created_tx  (创建事务 ID)
updated_tx  (更新事务 ID)
```

事务提供了实现以下功能所需的原子历史能力：

```text
审计追踪 (audit)
变更流分发 (change stream)
数据迁移 (migration)
来源归属 (origin)
幂等重试 (idempotency)
双时态历史重构 (bitemporal reconstruction)
```

确切的凭证语义归属于 KIP-2.0-Transactions.md。

---

# 83. 原子认知状态跃迁示例 (Atomic Cognitive Transition Example)

纠正一项信念可能需要同时执行：

```text
创建 Evidence E2
创建 Assertion A2
将 A1 标记为已被替代 (superseded)
创建 Activity C1 建立从 E2/A1 → A2 的关联链路
```

当语义正确性需要“全有或全无 (All-or-Nothing)”语义时，这些操作**应当 (SHOULD)** 在一个原子事务中执行。

核心数据模型的设计确保所有元素都可以携带统一的事务来源。

---

# 84. 故障隔离机制 (Error Isolation)

如果涉及多个元素的认知状态跃迁在提交前发生失败：

```text
严禁出现部分写入的残缺断言 (no partial Assertion)
严禁出现悬空的证据链接 (no dangling Evidence link)
严禁出现半替代的历史状态 (no half-superseded history)
```

这是通过 Core 引用模型实现的事务层核心要求。

---

# 85. 扩展策略 (Extension Strategy)

KIP 2.0 通过以下机制提供强大的可扩展性：

```text
模式包 (Schema Packages)
切面命名空间 (Facet namespaces)
自定义概念类型 (Custom Concept Types)
自定义谓词类型 (Custom Predicate Types)
自定义断言模式（带命名空间）(Custom Assertion modes)
自定义证据类别（带命名空间）(Custom Evidence classes)
自定义活动类别（带命名空间）(Custom Activity classes)
```

Core 核心元素类型本身应当保持极简且高度稳定。

---

# 86. 为何不把断言设计为概念？ (Why Not Make Assertion a Concept?)

被否决的备选设计方案：

```text
Concept type = Assertion
```

存在的问题：

1. 普通的 Concept Schema 可能会意外削弱 Assertion 所必需的不变式约束。
2. `name`/实体语义完全不符合短期的、具有时效性的认识论承诺。
3. Assertion 的目标命题基数必须严格等于 1。
4. 引擎需要标准化的立场（stance）与生命周期语义。
5. 查询引擎需要高效的原生断言过滤能力。
6. 治理层可能需要将 `assert` 权限与普通的 `write` 写入权限进行明确区分。
7. 导入/导出必须以不同于语义实体的方式对断言权威进行特殊处理。
8. KIP 1 兼容脱糖需要具备确定性的 Assertion 创建逻辑。

因此，采用专用的 Core 原生元素类型是最佳选择。

---

# 87. 为何不把证据设计为概念？ (Why Not Make Evidence a Concept?)

被否决的备选设计方案：

```text
Concept type = Evidence
```

存在的问题：

```text
载荷不可变性 (payload immutability)
内容哈希摘要 (content digests)
外部 Blob 对象引用 (external blob refs)
纠错演变链 (correction chains)
观测时间时钟 (observation time)
跨断言共享引用 (shared citation)
存储留存机制 (retention)
专有的溯源图查询 (provenance-specific querying)
```

这些都需要标准化的底层语义支撑。

由于所有认知元素都是可被引用的资源，Evidence 依然可以作为语义命题的主语或宾语。

---

# 88. 为何不把活动设计为概念？ (Why Not Make Activity a Concept?)

Activity 同样具有高度的专有特殊性。

它必须具备：

```text
输入列表 (inputs)
输出列表 (outputs)
关联主体 (associated actors)
起止时间边界 (time bounds)
终态不可变性 (terminal immutability)
溯源图语义 (provenance semantics)
引擎直接观测 vs 外部声称模式 (engine-observed vs claimed mode)
```

将其设计为专用的 Core 原生类型，能够支撑构建清晰可预测的溯源 DAG。

---

# 89. 为何不把所有关系都设计为命题？ (Why Not Make Every Relation a Proposition?)

因为并非所有关系都是关于客观世界的断言声明。

示例：

```text
Assertion 指向 Proposition
Evidence 由 Activity 生成
Activity 输出 Assertion
```

这些属于记录的拓扑装配结构。

如果将所有拓扑关系都编码为命题，就会迫使系统进行递归的认识论推导。

KIP 2.0 是原生支持图结构的，但并不要求**所有边都具有相同的语义**。

---

# 90. 核心图结构模型 (Core Graph Model)

由此产生的图是一个异构图（Heterogeneous Graph）：

```text
语义边 (Semantic edges):
    Proposition 的主谓宾项

结构边 (Structural edges):
    Core / Profile 记录之间的类型化引用

认识论节点 (Epistemic nodes):
    Assertion

证据与溯源节点 (Evidence/provenance nodes):
    Evidence
    Activity
```

示意拓扑：

```text
Alice ──────────────┐
                    │
                    ▼
              命题 P1 (Proposition P1)
       (Alice, prefers, DarkMode)
                    ▲
                    │ proposition (指向目标命题)
               断言 A1 (Assertion A1)
                    │
                    │ evidence {role: "support"}
                    ▼
              证据 E1 (Evidence E1)
                 │      ▲
    generated_by │      │ outputs (产出输出)
        (生成于)  ▼      │
               活动 X (Activity X)
```

---

# 91. KIP 1.x 迁移映射 (KIP 1.x Migration Mapping)

KIP 2.0 存在语义层面的重大破坏性变更，因此迁移过程必须清晰明确。

---

## 91.1 概念 (Concept)

KIP 1.x:

```json
{
  "type": "Person",
  "name": "Alice",
  "attributes": {...},
  "metadata": {...}
}
```

KIP 2.0:

```text
Concept
  id = 继承保留 / 重新生成
  schema_ref = 迁移后的类型模式包 URI
  key = 在需要处继承旧 name
  name = 继承旧 name
  attributes = 经分类筛选后的属性子集
  space_id = 默认迁移目标 Space ID
```

---

## 91.2 命题 (Proposition)

KIP 1.x:

```text
Alice ─ prefers → DarkMode
metadata:
  source
  author
  confidence
  valid_from
  superseded
```

KIP 2.0:

```text
规范化 Proposition P
+
迁移生成的 Assertion A
```

迁移至 Assertion A：

```text
作者 / 主体语义 (author/actor semantics)
置信度 (confidence)
生效时间 (validity)
生命周期状态 / 替代关联 (status/supersession)
```

迁移 / 转换为：

```text
证据 (Evidence)
活动 / 溯源 (Activity/provenance)
未解析时保留在旧版溯源切面中 (legacy provenance facet when unresolved)
```

---

## 91.3 旧版命题属性 (Legacy Proposition Attributes)

由于原生 KIP 2.0 命题不支持任意可变语义属性，因此 v1 命题属性需要进行分类迁移。

可能的迁移路径：

```text
认识论限定词 (epistemic qualifier)
    → Assertion

需要独立声明的世界事实 (world fact requiring independent claim)
    → 创建新的 Proposition + Assertion

多元关系限定词 (n-ary relationship qualifier)
    → 实体化的关系 Concept (reified relation Concept)

纯实现内部字段 (implementation-only field)
    → Profile 切面 (Facet) / 注解

存在歧义 / 未能解析的属性 (ambiguous/unresolved)
    → 无损保存在 legacy.v1 Facet 切面中
```

在旧模型存在歧义时，自动迁移**严禁 (MUST NOT)** 主观臆造语义。

---

## 91.4 旧版概念元数据 (Legacy Concept Metadata)

旧版 Concept 级别的：

```text
source       (来源)
confidence   (置信度)
author       (作者)
```

无法始终进行无损映射，因为尚不清楚其置信度具体是指：

```text
实体的客观存在性 (entity existence)
实体的消歧对齐 (entity resolution)
属性内容的正确性 (attribute correctness)
整体内容提取的置信度 (overall extraction confidence)
```

除非存在明确安全的解释，否则迁移**应当 (SHOULD)** 将存在歧义的字段完整保存在旧版溯源 Facet 中。

---

## 91.5 访问级别 `access_level` (`access_level`)

旧版：

```text
metadata.access_level
```

转换为：

```text
Space 空间安全策略 (Space policy)
元素治理密级 (element governance.classification)
策略引用 (policy_ref)
```

在 v2 中，旧字段绝不足以直接用于安全强制执行。

---

## 91.6 记忆层级与过期时间 (`memory_tier` / `expires_at`)

旧版的记忆生命周期转换为：

```text
留存策略 (retention)
和 / 或 认知记忆 Profile 切面 (Cognitive Memory Profile Facet)
```

具体取决于其实际语义。

---

## 91.7 置信度衰减迁移 (`confidence` Decay Migration)

若 KIP 1.x 部署曾使用命题 `confidence` 的随时间衰减来充当记忆可提取性的代理指标：

```text
旧版置信度不能被假设为依然具备经过校准的认识论有效性
```

迁移应当：

1. 将存活的数值保守迁移至新的 Assertion 置信度；
2. 独立初始化 `memory_strength` 记忆强度；
3. 记录一条迁移警告/切面，标明历史置信度存在衰减；
4. 彻底停止通用的基于时间的置信度衰减逻辑。

---

## 91.8 高阶命题 (Higher-Order Propositions)

KIP 1.x 可以引用 Proposition 链接作为高阶命题的端点。

KIP 2.0 完整保留了 Proposition 的可引用性。

旧的高阶链接本身转换为：

```text
真值中立的高阶 Proposition
+
迁移生成的 Assertion
```

当它此前被作为事实处理时。

---

# 92. KIP 1 兼容性投影 (KIP 1 Compatibility Projection)

KIP 2.0 实现**可以 (MAY)** 提供兼容模式。

v1 风格的读取操作：

```text
(Alice, prefers, DarkMode)
```

可以表示：

> 仅当该 Proposition 在配置的兼容认识论投影中被接受（accepted）时，才返回该结果。

v1 风格的写入操作：

```text
Alice prefers DarkMode
WITH METADATA {
  confidence: 0.9
}
```

可以自动脱糖为：

```text
Proposition
Assertion
可选的 Evidence
```

当语义存在歧义时，兼容模式必须产生明确的告警。

---

# 93. 数据模型不变式 (Data Model Invariants)

以下不变式是规范性的设计基准：

1. 每个认知元素都拥有一个不可变的 `id`。
2. 每个认知元素都严格归属于一个主属 `MemorySpace`。
3. 空间内部结构引用必须在同一个 Space 内部解析。
4. Proposition 命题是真值中立的。
5. Proposition 元组在创建后是不可变的。
6. 一个 Space 内每个语义元组**应当 (SHOULD)** 仅有一个活跃的规范 Proposition。
7. 字面量等价性是带类型的且具备确定性。
8. Proposition 的存在并不代表被相信或接受。
9. `Assertion` 是专用的 Core 核心元素类型。
10. 一个 Assertion 严格对应一个目标 Proposition。
11. Assertion 的认识论载荷在历史上是不可变的。
12. 修订信念必须创建新的 Assertion，而非隐蔽地篡改旧信念。
13. 冲突矛盾并不蕴含废弃替代。
14. `Evidence` 是专用的 Core 核心元素类型。
15. Evidence 载荷在创建后是不可变的。
16. Evidence 摘要相等并不代表 Evidence 身份等价。
17. `Activity` 是专用的 Core 核心元素类型。
18. 已完成终态的 Activity 溯源拓扑是不可变的。
19. Core 核心结构引用不是语义命题。
20. 引擎底层系统来源与外部声称的溯源必须严格分离。
21. 引擎系统来源严禁被作者层级篡改或通过内容洗白。
22. 导入的源端来源绝不会自动成为目标端的引擎系统来源。
23. 信任度不是命题的静态置信度。
24. 记忆强度不是断言的认识论置信度。
25. 生效时间不是存储留存过期时间。
26. 断言生成时间不是引擎事务时间。
27. `name` 不是全局唯一身份标识。
28. `canonical_id` 是特权身份绑定，而非普通属性。
29. 需要独立认识论语义的取值不应被困在普通属性中。
30. Profile 通过经过校验的 Facet 切面与类型化 Concept 扩展 Core，而非使用无边界的协议元数据袋。
31. 安全策略不仅适用于 Assertion/Evidence 内容，同样适用于 Proposition 的存在性。
32. 未经授权的读取严禁通过搜索或计数泄露隐藏元素的存在性。
33. 删除操作必须维护引用完整性。
34. 证据删除对审计具有高度敏感性。
35. 概念合并对历史引用是非破坏性的。
36. 语义相似度不影响 Core 唯一标识。
37. 嵌入向量与检索索引不是权威的持久化状态。
38. 绝不强制要求包含私有隐藏的思维链。
39. 导入的可执行记忆默认不具备自动执行权限。
40. 被接受的信念是一种视图投影，而非 Core 底层存储的原语。

---

# 94. 最小核心一致性数据形态 (Minimal Core Conformance Data Shapes)

一个最小符合规范的 KIP 2.0 Core 实现必须支持等价于以下持久化表示：

```text
MemorySpace
Concept
Proposition
Assertion
Evidence
Activity
```

并且必须支持：

```text
同空间引用完整性 (same-space reference integrity)
系统底层来源 (system origin)
元素版本号 (element version)
带类型的字面量 (typed Literal)
断言生命周期 (Assertion lifecycle)
证据载荷与哈希摘要 (Evidence payload/digest)
活动输入输出溯源 (Activity input/output provenance)
治理安全挂钩 (governance hooks)
留存管理挂钩 (retention hooks)
切面扩展机制 (Facets)
```

它无需实现 Cognitive Memory Profile 即可符合 Core Data Model 规范。

---

# 95. 最小核心示例 (Minimal Core Example)

一个完整且最小的实用认识论图谱：

```text
MemorySpace S1

Concept C1 = Alice
Concept C2 = DarkMode

Proposition P1
  subject   = C1
  predicate = prefers
  object    = C2

Evidence E1
  class = user_statement
  payload = "I prefer dark mode."

Assertion A1
  proposition = P1
  asserted_by = C1
  stance = support
  mode = stated
  evidence = E1

Activity X1
  class = extraction
  inputs = E1
  outputs = A1
```

大脑随后可以派生出一个稳定的 Preference 偏好 Concept 或语义 Assertion，但 Core 目前已经完整保留了：

```text
语义内涵 (meaning)
陈述主体 (speaker)
客观证据 (evidence)
底层来源 (origin)
时间时钟 (time)
历史溯源 (provenance)
空间边界 (space)
```

---

# 96. 示例：同一命题，多个断言 (Example: Same Proposition, Multiple Assertions)

```text
P1 = (ServiceA, status, "healthy")

A1
  mode = observed
  asserted_by = MonitoringTool
  stance = support
  confidence = 0.99

A2
  mode = stated
  asserted_by = OperatorBob
  stance = reject
  confidence = 0.7
```

无需创建重复的 Proposition。

生产事故处理大脑可以清晰呈现：

```text
状态存在争议 (status contested)
监控工具声称健康 (monitor says healthy)
运维人员报告异常 (operator reports unhealthy)
```

而不是粗暴地用一个覆盖另一个。

---

# 97. 示例：多个命题，时态状态 (Example: Multiple Propositions, Temporal State)

```text
P1 = (Project, status, "active")
P2 = (Project, status, "archived")

A1 支持 P1
  valid_until = 2026-08-01

A2 支持 P2
  valid_from = 2026-08-01
```

两个 Proposition 依然都具有明确的语义意义。

当前的认识论投影可以选择 P2，而历史回溯查询可以无损还原 P1。

---

# 98. 示例：证据纠正 (Example: Evidence Correction)

```text
Evidence E1
  measurement = 42
  status = active

随后：

Evidence E2
  measurement = 24
  corrects = E1

E1.lifecycle.status = corrected
E1.corrected_by = E2
```

引用 E1 的断言在历史上依然保持可审计性。

一个新的 Assertion 可以替代早先的推论。

---

# 99. 示例：通过巩固维护溯源 (Example: Provenance Through Consolidation)

```text
Evidence E1: 对话记录 1
Evidence E2: 对话记录 2
Evidence E3: 对话记录 3

Activity C1: 跨事件巩固 (cross-event consolidation)
  inputs = E1, E2, E3
  outputs = Assertion A9

A9:
  proposition = (Alice, prefers, DarkMode)
  mode = inferred
```

沉淀出的稳定知识非常紧凑精炼。

原始的底层支持链条依然可以完整重构。

---

# 100. 示例：经验转化为技能 (Example: Experience to Skill)

认知记忆 Profile 可以创建：

```text
Experience X1
Experience X2
```

接着：

```text
Activity P1
  class = procedural_consolidation (程序性巩固)
  inputs = X1, X2
  outputs = Skill S1
```

`Skill S1` 是一个 Profile Concept。

其执行权限属于 Governance / Profile 状态，绝不因其存在而自动被默认赋予。

---

# 101. 示例：导入技能 (Example: Imported Skill)

源胶囊内容：

```text
Skill SX
  "在满足条件 Z 时执行 Shell 命令 Y"
```

目标端状态：

```text
Concept Skill SX'
  profile status = candidate (候选状态)
  authority = descriptive/advisory only (仅具有描述/建议权限)

_system.origin
  channel = import (导入信道)
  principal = importing principal (执行导入的主体)

导入溯源 (Imported provenance)
  源胶囊哈希摘要 (source capsule digest)
  远端数字签名者（若存在）(remote signer if present)
```

该 Skill 绝不能自我赋予可执行权限。

---

# 102. 示例：概念合并 (Example: Concept Merge)

合并前：

```text
C1 = "JS"
C2 = "JavaScript"

P1 = (C1, used_in, ProjectA)
P2 = (C2, used_in, ProjectB)
```

身份整合操作：

```text
C1._system.state = merged
C1.merged_into = C2
```

原始历史记录完整保留。

规范视图自动将 C1 解析重定向至 C2。

未来的写入操作使用 C2。

导入的历史断言绝不会被篡改伪装成最初就使用了 C2。

---

# 103. 数据模型待决问题讨论 (Open Data Model Questions)

目前的架构约束已经足够严谨清晰，剩余的问题范围更加聚焦。

KIP 2.0 规范此后已经采纳了下列多数问题的推荐答案。凡是规范已作出裁定之处，以规范为准，此处的答案仅作为设计依据保留。

## Q1. 结构引用是否应该拥有专用的通用持久化边记录？

当前推荐：

> 初始 Core 阶段**暂不引入**。

在 Core / Profile 元素上直接使用带类型的引用字段。

理由：

```text
模型更加简洁精炼
避免引入又一种通用边类型
保持语义与结构之间的清晰区分
```

如果后续查询体验需要通用的结构边索引，引擎可以在内部构建索引，而无需更改权威语义。

---

## Q2. 断言的证据引用列表是否应当完全不可变？

当前推荐：

> 原始引用集合应当是不可变的；后续发现的新证据通常应当创建新的 Assertion 修订版本。

这能提供最干净的历史信念重构能力。

未来的认识论模型可以允许显式标记的事后评审链接，而不重写原始断言状态。

---

## Q3. Concept 的别名 aliases 是否应当可变？

推荐：

> **是**，作为语义接地状态。

在历史上具有重要意义的曾用名应当作为独立的命题/断言进行建模。

---

## Q4. Proposition 的主语可以是 Assertion / Evidence / Activity 吗？

推荐：

> **可以**，只要谓词 Schema 明确允许。

所有认知元素都是可被引用的资源。

但是 Core 拓扑链接依然保持为结构引用，而非隐式命题。

---

## Q5. 跨空间外部引用是否应当作为 Core 的强制要求？

推荐：

> **不作为强制要求**。

Core 的基准线是同空间闭包。

跨空间引用属于可选扩展能力。

可移植的跨域共享应当使用认知胶囊（Cognitive Capsules）。

---

## Q6. `retention.expires_at` 是否应当包含在 Core 中？

推荐：

> **是**，作为通用的存储生命周期挂钩。

其语义必须严格独立于 Cognitive Memory Profile 的记忆强度/遗忘机制以及 Assertion 的时效有效性。

---

## Q7. Evidence 是否应当始终携带内容摘要？

推荐：

> 当载荷为外部存储或存在稳定的规范化载荷表示时**必须提供**；在不可用时可选。

胶囊规范（Capsule specification）将定义更严格的可移植性要求。

---

## Q8. `canonical_id` 是否应当在全 Nexus 范围内全局唯一？

推荐：

> 经过验证的权威身份在单个 MemorySpace 内部针对同一种身份体系**应当 (SHOULD)** 解析出唯一结果。

跨 Space 的重复是正常预期现象。

存在冲突的身份绑定属于治理与身份对齐层面的问题，严禁发生隐式静默合并。

---

## Q9. 每个 Assertion 是否都必须关联一个 Activity？

推荐：

> **不需要**。

直接断言可以仅凭引擎底层来源 + Evidence 独立存在。

当转换推导链路至关重要时，Activity 属于必需/强烈推荐的：

```text
推理 (inference)
巩固 (consolidation)
导入 (import)
迁移 (migration)
工具执行 (tool execution)
技能编译 (skill compilation)
```

---

## Q10. 每个 Assertion 是否都必须要求提供 Evidence？

推荐：

> **不需要**。

没有直接 Evidence 的合法示例：

```text
情景假设 (hypothesis)
前瞻预测 (prediction)
缺失来源的外部导入引用断言 (imported quoted assertion with missing source)
显式的直觉/主观信念陈述 (explicit belief statement)
```

缺失 Evidence 应当降低认识论投影对其的信任度，而不应使该记录在结构上变为非法。

---

# 104. 本模型所支撑的后续文档 (Documents This Model Enables)

在核心数据模型确立后，后续的规范文档便可以进行独立解耦的设计。

推荐文档序列：

```text
KIP-2.0-Architecture.md
KIP-2.0-Core-Data-Model.md              ← 本文档

KIP-2.0-Epistemic-Model.md
    置信度 (confidence)
    信任体系 (trust)
    证据评估 (evidence evaluation)
    冲突矛盾 (contradiction)
    废弃替代 (supersession)
    来源多样性 (source diversity)
    认识论投影 (epistemic projection)

KIP-2.0-Governance.md
    调用主体 (Principal)
    记忆空间 (MemorySpace)
    权限控制 (permissions)
    数据密级 (classification)
    行动权限 (authority)
    策略继承 (policy inheritance)
    数据脱敏 (redaction)

KIP-2.0-Schema-Packages.md
    Schema 标识体系 (schema identity)
    类型与谓词定义 (type/predicate definitions)
    约束条件 (constraints)
    版本管理 (versions)
    模式迁移 (migrations)

KIP-2.0-Transactions.md
    原子操作批处理 (atomic batches)
    幂等性机制 (idempotency)
    操作凭证 (receipts)
    乐观并发控制 (optimistic concurrency)
    变更数据流 (change stream)

KIP-2.0-Capsule.md
    规范化胶囊表示 (canonical representation)
    导入与导出 (import/export)
    来源凭证 (origin receipts)
    数字签名 (signatures)
    安全脱敏 (redaction)

KIP-2.0-KQL.md
KIP-2.0-KML.md
KIP-2.0-META.md

KIP-2.0-Migration-from-1.x.md

profiles/CognitiveMemoryProfile-2.0.md
brain/ExperienceLearningArchitecture.md
brain/BrainFormation.md
brain/BrainRecall.md
brain/BrainMaintenance.md
```

---

# 105. 核心设计总结 (Core Design Summary)

最终确立的 Core 本体模型保持了高度克制与精炼：

```text
MemorySpace (记忆空间)
    │
    ├── Concept (概念)
    │      可引用的语义对象
    │
    ├── Proposition (命题)
    │      真值中立的客观语义陈述
    │
    ├── Assertion (断言)
    │      对特定命题的认识论承诺
    │
    ├── Evidence (证据)
    │      引用的观测结果 / 制品 / 产出
    │
    └── Activity (活动)
           溯源推导转换过程
```

最核心的关系拓扑为：

```text
命题 (Proposition):
    subject (主语) ─────────> 认知元素 (Cognitive Element)
    object  (宾语) ─────────> 认知元素 (Cognitive Element) | 字面量 (Literal)

断言 (Assertion):
    proposition ────────────> 命题 (Proposition)
    asserted_by ────────────> 语义主体引用 (semantic actor reference)
    evidence ───────────────> 证据 (Evidence)
    supersedes ─────────────> 断言 (Assertion)

证据 (Evidence):
    source ─────────────────> 语义 / 外部来源
    generated_by ───────────> 活动 (Activity)

活动 (Activity):
    inputs ─────────────────> 认知元素 (Cognitive Elements)
    outputs ────────────────> 认知元素 (Cognitive Elements)
    associated_actors ──────> 语义主体 (semantic actors)
```

所有对象统一受到以下底座的严格治理：

```text
space_id           (定界空间)
governance         (安全治理)
retention          (存储留存)
_system.origin     (系统底层来源)
_system.version    (单调递增版本)
transaction history(事务执行历史)
```

各个 Profile 通过以下途径注入专属的认知能力：

```text
类型化概念 (typed Concepts)
结构引用 (Structural References)
切面扩展 (Facets)
```

且绝不削弱 Core 核心的认识论语义。

---

# 106. 最终归纳 (Final Inference)

KIP 1.x 将一个有用的世界表达为：

```text
Concept ─ Proposition → Concept
```

KIP 2.0 则将一个记忆大脑表达为：

```text
                         ┌──────────── 证据 (Evidence)
                         │
概念 ─ 命题 ← 断言
 │       │       │
 │       │       └──────────── 语义主体 (semantic actor)
 │       │
 │       └──────────────────── 真值中立的语义含义 (truth-neutral meaning)
 │
 └──────────────────────────── 可引用的认知对象 (referable cognition)

证据 / 断言 / 概念
      │
      ▼
   活动 (Activity)
      │
      ▼
派生认知对象 (derived cognition)

以上全部严格封装于：
    记忆空间 + 安全策略 + 引擎系统来源 + 时态时钟
    (MemorySpace + Policy + Engine Origin + Time)
```

这从根本上改变了系统的本质属性。

KIP 1.x 认知中枢主要存储：

> **图谱陈述了什么。**

而 KIP 2.0 认知中枢能够完整沉淀与保留：

> **可以陈述什么、是谁陈述或推导的、有什么证据支撑、在何时适用、是如何习得的、来自何处、谁可以使用它，以及过往的认知状态如何切实深刻地重塑未来的行动。**

这是智能体构建**真正的外部记忆大脑**而非仅仅是一个持久化知识缓存所必需的最低数据基底。
