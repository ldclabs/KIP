# 🧬 KIP（Knowledge Interaction Protocol）规范（候选版）

**[English](./README.md) | [中文](./README_CN.md)**

**版本历史**：
| 版本        | 日期       | 变更说明                                                                                                                       |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| v1.0-draft1 | 2025-06-09 | 初始草案                                                                                                                       |
| v1.0-draft2 | 2025-06-15 | 优化 `UNION` 子句                                                                                                              |
| v1.0-draft3 | 2025-06-18 | 优化术语，简化语法，移除 `SELECT` 子查询，添加 `META` 子句，增强命题链接子句                                                   |
| v1.0-draft4 | 2025-06-19 | 简化语法，移除 `COLLECT`，`AS`，`@`                                                                                            |
| v1.0-draft5 | 2025-06-25 | 移除 `ATTR` 和 `META`，引入“点表示法”取代；添加 `(id: "<link_id>")`；优化 `DELETE` 语句                                        |
| v1.0-draft6 | 2025-07-06 | 确立命名规范；引入自举模型：新增 "$ConceptType", "$PropositionType" 元类型和 Domain 类型，实现模式的图内定义；添加创世知识胶囊 |
| v1.0-draft7 | 2025-07-08 | 使用 `CURSOR` 取代 `OFFSET` 用于分页查询；添加 Person 类型的知识胶囊                                                           |
| v1.0-draft8 | 2025-07-17 | 优化文档；添加 Event 类型用于情景记忆；添加 SystemInstructions.md；添加 FunctionDefinition.json                                |
| v1.0-RC     | 2025-11-19 | v1.0 Release Candidate：优化文档；添加 KIP 标准错误码                                                                          |
| v1.0-RC2    | 2025-12-31 | v1.0 Release Candidate 2：优化文档；参数占位符前缀从 `?` 改为 `:`；支持命令批量执行                                            |

**KIP 实现**：
- [Anda KIP SDK](https://github.com/ldclabs/anda-db/tree/main/rs/anda_kip): A Rust SDK of KIP for building sustainable AI knowledge memory systems.
- [Anda Cognitive Nexus](https://github.com/ldclabs/anda-db/tree/main/rs/anda_cognitive_nexus): A Rust implementation of KIP base on Anda DB.
- [Anda Cognitive Nexus Python](https://github.com/ldclabs/anda-db/tree/main/py/anda_cognitive_nexus_py): A Python binding for Anda Cognitive Nexus.
- [Anda App](https://github.com/ldclabs/anda-app): An AI Agent client app base on KIP.

**关于我们**：
[ICPanda](https://panda.fans/): ICPanda is a community-driven project that aims to build the foundational infrastructure and applications that empower AI agents to thrive as first-class citizens in the Web3 ecosystem. [Anda.AI](https://anda.ai/) | [dMsg](https://dmsg.net/)
- GitHub: [LDC Labs](https://github.com/ldclabs)
- Follow Us on X: [ICPanda](https://x.com/ICPandaDAO)

## 0. 前言

大型语言模型（LLM）展现了卓越的通用推理与生成能力，但其**“无状态”（Stateless）**的本质导致了长期记忆的缺失，而基于概率的生成机制则引发了不可控的“幻觉”与知识过时问题。

如何构建一个既能利用 LLM 强大的推理能力，又能通过结构化数据确保持久性、准确性和可追溯性的系统，是当前 AI Agent 架构的核心挑战。**神经符号人工智能（Neuro-Symbolic AI）**被认为是解决这一问题的关键路径。

**KIP（Knowledge Interaction Protocol）** 为此而生。

KIP 定义了一套标准的交互协议，旨在弥合 **LLM（概率推理引擎）** 与 **知识图谱（确定性知识库）** 之间的鸿沟。它不是一个简单的数据库接口，而是一套专为智能体设计的**记忆与认知操作原语**。

通过 KIP，我们致力于实现：

1.  **记忆持久化（Persistence）**：将 Agent 的对话、观测与推理结果，转化为结构化的“知识胶囊”，实现记忆的原子性存储与复用。
2.  **知识动态演进（Evolution）**：提供完整的增删改查（CRUD）与元数据管理机制，使 Agent 具备自主更新知识库、修正错误的“学习”能力。
3.  **交互可解释（Explainability）**：将隐式的思维过程显式化为 KIP 指令，使 Agent 的每一次回答都有据可查，每一次决策都逻辑透明。

本规范旨在为开发者提供一套开放、通用的标准，构建下一代具备**可信记忆**与**持续学习能力**的智能体。

## 1. 简介与设计哲学

**KIP（Knowledge Interaction Protocol）** 是一种专为大型语言模型设计的、面向知识图谱的交互协议。它通过定义一套标准化的指令集 (KQL/KML) 和 JSON 数据模式，规范了 Agent 与其外部长期记忆（Long-term Memory）之间的通信方式。

KIP 的核心目标是建立一个**统一的认知中枢（Cognitive Nexus）**，使 AI Agent 能够像使用文件系统一样自然、高效地操作复杂的知识网络。

**设计哲学：**

*   **模型优先（Model-First）**：协议语法专为 Transformer 架构优化。采用 JSON 原生数据结构，指令逻辑符合自然语言推理直觉，最大限度降低 LLM 生成代码时的语法错误率。
*   **意图导向（Intent-Driven）**：采用声明式（Declarative）语法。Agent 只需描述“需要什么知识”或“由于什么事实要更新什么”，底层的图遍历与事务处理由协议实现层封装。
*   **图原生与自描述（Graph-Native & Self-Describing）**：基于“概念-命题”的图谱结构。支持**模式自举（Schema Bootstrapping）**，即数据的类型定义（Schema）本身也存储在图中，Agent 可通过查询元数据自主理解未知的知识结构。
*   **原子性与幂等性（Atomicity & Idempotency）**：所有的知识写入操作（UPSERT）均被设计为原子事务，且具备幂等性。这确保了在网络波动或 Agent 重复推理的场景下，知识库状态的一致性与稳定性。
*   **可验证性（Verifiability）**：强调“来源（Provenance）”与“上下文（Context）”。协议强制支持元数据（Metadata）绑定，确保每一条知识都能追溯其来源、置信度及生成时间。

## 2. 核心定义

### 2.1. 认知中枢（Cognitive Nexus）

一个由**概念节点**和**命题链接**构成的知识图谱，是 AI Agent **统一的记忆大脑**。它容纳了从短暂的情景事件到持久的语义知识等所有层次的记忆，并通过系统后台的自主进程实现记忆的**新陈代谢（巩固与遗忘）**。

### 2.2. 概念节点（Concept Node）

* **定义**：知识图谱中的**实体**或**抽象概念**，是知识的基本单元（如图中的“点”）。
* **示例**：一个名为“阿司匹林”的`Drug`节点，一个名为“头痛”的`Symptom`节点。
* **构成**：
    * `id`：String，唯一标识符，用于在图中唯一定位该节点。
    * `type`：String，节点的类型。**其值必须是一个在图中已定义的、类型为 `"$ConceptType"` 的概念节点的名称**。遵循 `UpperCamelCase` 命名法。
    * `name`：String，节点的名称。`type` + `name` 组合在图中也唯一定位一个节点。
    * `attributes`：Object，节点的属性，描述该概念的内在特性。
    * `metadata`：Object，节点的元数据，描述该概念的来源、可信度等信息。

### 2.3. 命题链接（Proposition Link）

* **定义**：一个**实体化的命题（Proposition）**，它以 `(主语, 谓词, 宾语)` 的三元组形式，陈述了一个**事实（Fact）**。它在图中作为**链接（Link）**，将两个概念节点连接起来，或实现更高阶的连接。
* **示例**：一个陈述“（阿司匹林）- [用于治疗] ->（头痛）”这一事实的命题链接。
* **构成**：
    * `id`：String，唯一标识符，用于在图中唯一定位该链接。
    * `subject`：String，关系的发起者，一个概念节点或另一个命题链接的 ID。
    * `predicate`：String，定义了主语和宾语之间的**关系（Relation）**类型。**其值必须是一个在图中已定义的、类型为 `"$PropositionType"` 的概念节点的名称**。遵循 `snake_case` 命名法。
    * `object`：String，关系的接受者，一个概念节点或另一个命题链接的 ID。
    * `attributes`：Object，命题的属性，描述该命题的内在特性。
    * `metadata`：Object，命题的元数据，描述该命题的来源、可信度等信息。

### 2.4. 知识胶囊（Knowledge Capsule）

一种幂等性的知识更新单元，是包含了一组**概念节点**和**命题链接**的知识合集，用于解决高质量知识的封装、分发和复用问题。

### 2.5. 认知引信（Cognitive Primer）

一个高度结构化、信息密度极高、专门为 LLM 设计的 JSON 对象，它包含了认知中枢的全局摘要和领域地图，帮助 LLM 快速理解和使用认知中枢。

### 2.6. 属性（Attributes）与元数据（Metadata）

*   **属性（Attributes）**：描述**概念**或**事实**内在特性的键值对，是构成知识记忆的一部分。
*   **元数据（Metadata）**：描述**知识来源、可信度和上下文**的键值对。它不改变知识本身的内容，而是描述关于这条知识的“知识”。（元数据字段设计见附录 1）

### 2.7. 值类型（Value Types）

KIP 采用 **JSON** 的数据模型，即 KIP 所有子句中使用的值，其类型和字面量表示方法遵循 JSON 标准。这确保了数据交换的无歧义性，并使得 LLM 极易生成和解析。

* **基本类型**：`string`, `number`, `boolean`, `null`。
* **复杂类型**：`Array`, `Object`。
* **使用限制**: 虽然 `Array` 和 `Object` 可作为属性或元数据的值存储，但 KQL 的 `FILTER` 子句**主要针对基本类型进行操作**。

### 2.8. 标志符与命名规范（Identifiers & Naming Conventions）

标志符是 KIP 中用于为变量、类型、谓词、属性和元数据键命名的基础。为了保证协议的清晰性、可读性和一致性，KIP 对标志符的语法和命名风格进行了统一规定。

#### 2.8.1. 标志符语法（Identifier Syntax）

一个合法的 KIP 标志符**必须**以字母（`a-z`, `A-Z`）或下划线（`_`）开头，其后可以跟随任意数量的字母、数字（`0-9`）或下划线。
此规则适用于所有类型的命名，但元类型以 `$` 前缀作为特殊标记，变量则以 `?` 前缀作为语法标记。
在通过 `execute_kip` 执行命令时，命令文本中还可以使用以 `:` 为前缀的**参数占位符**（如 `:name`, `:limit`），用于在执行前由 `execute_kip.parameters` 进行安全替换。

#### 2.8.2. 命名约定（Naming Conventions）

在遵循基本语法规则之上，为了增强可读性和代码的自解释性，KIP **强烈推荐**遵循以下命名约定：

* **概念节点类型（Concept Node Types）**：使用**大驼峰命名法（UpperCamelCase）**。
    * **示例**: `Drug`, `Symptom`, `MedicalDevice`, `ClinicalTrial`。
    * **元类型**: `$ConceptType`, `$PropositionType`, 以 `$` 开头的为系统保留元类型。
* **命题链接谓词（Proposition Link Predicates）**：使用**蛇形命名法（snake_case）**。
    * **示例**: `treats`, `has_side_effect`, `is_subclass_of`, `belongs_to_domain`。
* **属性与元数据键（Attribute & Metadata Keys）**：使用**蛇形命名法（snake_case）**。
    * **示例**: `molecular_formula`, `risk_level`, `last_updated_at`。
* **变量（Variables）**：**必须**以 `?` 作为前缀，其后部分推荐使用小写蛇形命名法（`snake_case`）。
    * **示例**: `?drug`, `?side_effect`, `?clinical_trial`。

> **注意**：KIP 协议对大小写敏感。概念类型推荐使用 `UpperCamelCase`（如 `Drug`），命题谓词推荐使用 `snake_case`（如 `treats`）。错误的拼写（如 `drug` 代替 `Drug`）会导致 `KIP_2001` 错误。

### 2.9. 知识自举与元定义（Knowledge Bootstrapping & Meta-Definition）

KIP 的核心设计之一是**知识图谱的自我描述能力**。认知中枢的模式（Schema）——即所有合法的概念类型和命题类型——本身就是图中的一部分，由概念节点来定义。这使得整个知识体系可以自举（Bootstrap），无需外部定义即可被理解和扩展。

### 2.10. 数据一致性与冲突处理原则

*   **属性更新策略**：在 `UPSERT` 操作中，`SET ATTRIBUTES` 采用**浅合并（Shallow Merge）策略**：仅对指令中出现的 Key 进行更新（覆盖），未出现的 Key 保持不变。对于某个 Key 的值为 `Array` 或 `Object` 时，更新语义仍是**按该 Key 整体覆盖**（不会递归深合并），因此 Agent 若要更新数组内容，必须提供完整的数组。
*   **命题唯一性**：KIP 强制实施 **(Subject, Predicate, Object) 唯一性约束**。两个概念节点之间，相同类型的关系只能存在一条。重复的 `UPSERT` 操作将被视为对现有命题的元数据或属性更新。

#### 2.9.1. 元类型（Meta-Types）

系统仅预定义两个特殊的、以 `$` 开头的元类型：

* **`"$ConceptType"`**：用于定义**概念节点类型**的类型。一个节点的 `type` 是 `"$ConceptType"`，意味着这个节点本身定义了一个“类型”。
    * **示例**：`{type: "$ConceptType", name: "Drug"}` 这个节点，它定义了 `Drug` 作为一个合法的概念类型。之后，我们才能创建 `{type: "Drug", name: "Aspirin"}` 这样的节点。
* **`"$PropositionType"`**：用于定义**命题链接谓词**的类型。一个节点的 `type` 是 `"$PropositionType"`，意味着这个节点本身定义了一个“关系”或“谓词”。
    * **示例**：`{type: "$PropositionType", name: "treats"}` 这个节点，它定义了 `treats` 作为一个合法的谓词。之后，我们才能创建 `(?aspirin, "treats", ?headache)` 这样的命题。

**重要强调（必须遵循）**：
* **先定义后使用**：任何“概念节点类型”和“命题链接谓词”在被实例化或在 KQL/KML 中引用之前，必须先通过元类型显式注册：
    * 概念类型需存在 `{type: "$ConceptType", name: "<Type>"}`；
    * 谓词需存在 `{type: "$PropositionType", name: "<predicate>"}`。
* **Schema 可持续演化**：已定义类型的 `instance_schema`、`description` 等均可在后续持续改进与迭代；包括 `"$ConceptType"` 与 `"$PropositionType"` 自身的定义也允许演进。演进应尽量保持向后兼容，避免破坏既有实例与命题。

#### 2.9.2. 创世之源 (The Genesis)

这两个元类型本身也由概念节点定义，形成一个自洽的闭环：

* `"$ConceptType"` 的定义节点是：`{type: "$ConceptType", name: "$ConceptType"}`
* `"$PropositionType"` 的定义节点是：`{type: "$ConceptType", name: "$PropositionType"}`

这意味着 `"$ConceptType"` 是一种 `"$ConceptType"`，这构成了整个类型系统的逻辑基石。

```mermaid
graph TD
    subgraph "元定义 (Meta-Definitions)"
        A["<b>$ConceptType</b><br>{type: '$ConceptType', name: '$ConceptType'}"]
        B["<b>$PropositionType</b><br>{type: '$ConceptType', name: '$PropositionType'}"]
        A -- 定义了 --> A
        A -- 定义了 --> B
    end

    subgraph "模式定义 (Schema Definitions)"
        C["<b>Drug</b><br>{type: '$ConceptType', name: 'Drug'}"]
        D["<b>Symptom</b><br>{type: '$ConceptType', name: 'Symptom'}"]
        E["<b>treats</b><br>{type: '$PropositionType', name: 'treats'}"]
        A -- "定义了" --> C
        A -- "定义了" --> D
        B -- "定义了" --> E
    end

    subgraph "数据实例 (Data Instances)"
        F["<b>Aspirin</b><br>{type: 'Drug', name: 'Aspirin'}"]
        G["<b>Headache</b><br>{type: 'Symptom', name: 'Headache'}"]
        C -- "是其类型" --> F
        D -- "是其类型" --> G
        F -- "treats<br>(由 E 定义)" --> G
    end
```

#### 2.9.3. 认知领域 (Domain)

为了对知识进行有效的组织和隔离，KIP 引入了 `Domain` 的概念：

* **`Domain`**：它本身是一个概念类型，通过 `{type: "$ConceptType", name: "Domain"}` 定义。
* **领域节点**：例如，`{type: "Domain", name: "Medical"}` 创建了一个名为“医疗”的认知领域。
* **归属关系**：概念节点在创建之初可以不归属于任何领域，保持系统的灵活性和真实性。在后续的推理中，应该通过 `belongs_to_domain` 命题链接，将其归属到对应的领域下，这确保了知识能被 LLM 高效利用。

## 3. KIP-KQL 指令集：知识查询语言

KQL 是 KIP 中负责知识检索和推理的部分。

### 3.1. 查询结构

```prolog
FIND( ... )
WHERE {
  ...
}
ORDER BY ...
LIMIT N
CURSOR "<token>"
```

### 3.2. 点表示法（Dot Notation）

**点表示法是 KIP 中访问概念节点和命题链接内部数据的首选方式**。它提供了一种统一、直观且强大的机制，用于在 `FIND`, `FILTER`, 和 `ORDER BY` 等子句中直接使用数据。

一个绑定到变量 `?var` 上的节点或链接，其内部数据可以通过以下路径访问：

* **访问顶级字段**:
    * `?var.id`, `?var.type`, `?var.name`：用于概念节点。
    * `?var.id`, `?var.subject`, `?var.predicate`, `?var.object`：用于命题链接。
* **访问属性 (Attributes)**:
    * `?var.attributes.<attribute_name>`
* **访问元数据 (Metadata)**:
    * `?var.metadata.<metadata_key>`

**示例**:
```prolog
// 查找药物名称及其风险等级
FIND(?drug.name, ?drug.attributes.risk_level)

// 筛选置信度高于 0.9 的命题
FILTER(?link.metadata.confidence > 0.9)
```

### 3.3. `FIND` 子句

**功能**：声明查询的最终输出。

**语法**：`FIND( ... )`

* **多变量返回**：可以指定一个或多个变量，如 `FIND(?drug, ?symptom)`。
* **聚合返回**：可以使用聚合函数对变量进行计算，如 `FIND(?var1, ?agg_func(?var2))`。
    * **聚合函数**：`COUNT(?var)`，`COUNT(DISTINCT ?var)`，`SUM(?var)`，`AVG(?var)`，`MIN(?var)`，`MAX(?var)`。

### 3.4. `WHERE` 子句

**功能**：包含一系列图模式匹配和过滤子句，所有子句之间默认为逻辑 **AND** 关系。

#### 3.4.1. 概念节点子句

**功能**：匹配概念节点并绑定到变量。使用 `{...}` 语法。

**语法**：
* `?node_var {id: "<node_id>"}`：通过唯一 ID 匹配唯一概念节点。
* `?node_var {type: "<Type>", name: "<name>"}`：通过类型和名称匹配唯一概念节点。
* `?nodes_var {type: "<Type>"}`，`?nodes_var {name: "<name>"}`：通过类型或者名称匹配一批概念节点。

`?node_var` 将匹配到的概念节点绑定到变量上，便于后续操作。但当概念节点子句直接用于命题链接子句的主语或宾语时，不应该定义变量名。

**示例**：

```prolog
// 匹配所有药物类型的节点
?drug {type: "Drug"}

// 匹配名为 "Aspirin" 的药物
?aspirin {type: "Drug", name: "Aspirin"}

// 匹配指定 ID 的节点
?headache {id: "C:123"}
```

#### 3.4.2. 命题链接子句

**功能**：匹配命题链接并绑定到变量。使用 `(...)` 语法。

**语法**：
* `?link_var (id: "<link_id>")`：通过唯一 ID 匹配唯一命题链接。
* `?link_var (?subject, "<predicate>", ?object)`：通过结构模式匹配一批命题链接。其中主语或者宾语可以是概念节点或另一个命题链接的变量，或没有变量名的子句。
* 谓词部分支持路径操作符：
    * `"<predicate>"{m,n}`：匹配谓词 m 到 n 跳，如 `"follows"{1,5}`，`"follows"{1,}`，`"follows"{5}`。
    * `"<predicate1>" | "<predicate2>" | ...`：匹配一组字面量谓词，如 `"follows" | "connects" | "links"`。

`?link_var` 是可选的，将匹配到的命题链接绑定到变量上，便于后续操作。

**示例**：

```prolog
// 找到所有能治疗头痛的药物
(?drug, "treats", ?headache)

// 将一个已知ID的命题绑定到变量
?specific_fact (id: "P:12345:treats")

// 高阶命题: 宾语是另一个命题
(?user, "stated", (?drug, "treats", ?symptom))
```

```prolog
// 查找一个概念的 5 层以内的父概念
(?concept, "is_subclass_of"{0,5}, ?parent_concept)
```

#### 3.4.3. 过滤器子句（`FILTER`）

**功能**：对已绑定的变量应用更复杂的过滤条件。**强烈推荐使用点表示法**。

**语法**：`FILTER(boolean_expression)`

**函数与运算符**:
* **比较**: `==`, `!=`, `<`, `>`, `<=`, `>=`
* **逻辑**: `&&` (AND), `||` (OR), `!` (NOT)
* **字符串**：`CONTAINS(?str, "sub")`, `STARTS_WITH(?str, "prefix")`, `ENDS_WITH(?str, "suffix")`, `REGEX(?str, "pattern")`

**示例**：
```prolog
// 筛选出风险等级小于 3，且名称包含 "acid" 的药物
FILTER(?drug.attributes.risk_level < 3 && CONTAINS(?drug.name, "acid"))
```

#### 3.4.4. 否定子句（`NOT`）

**功能**：排除满足特定模式的解。

**语法**：`NOT { ... }`

**示例**：

```prolog
// 排除所有属于 NSAID 类的药物
NOT {
  ?nsaid_class {name: "NSAID"}
  (?drug, "is_class_of", ?nsaid_class)
}
```

更简单的写法：
```prolog
// 排除所有属于 NSAID 类的药物
NOT {
  (?drug, "is_class_of", {name: "NSAID"})
}
```

#### 3.4.5. 可选子句（`OPTIONAL`）

**功能**：尝试匹配可选模式，类似 SQL 的 `LEFT JOIN`。

**语法**：`OPTIONAL { ... }`

**示例**：

```prolog
// 查找所有药物，并（如果存在的话）一并找出它们的副作用
?drug {type: "Drug"}

OPTIONAL {
  (?drug, "has_side_effect", ?side_effect)
}
```

#### 3.4.6. 合并子句（`UNION`）

**功能**：合并多个模式的结果，实现逻辑 **OR**。

**语法**：`UNION { ... }`

**示例**：

```prolog
// 找到能治疗“头痛”和“发烧”的药物

(?drug, "treats", {name: "Headache"})

UNION {
  (?drug, "treats", {name: "Fever"})
}
```

#### 3.4.7. 变量作用域详解：NOT, OPTIONAL, UNION

为了保证 KQL 查询的无歧义性和可预测性，理解 `WHERE` 子句中不同图模式子句如何处理变量作用域至关重要。核心概念是**绑定（Binding）**——一个变量被赋予一个值，和**可见性（Visibility）**——一个绑定在查询的其他部分是否可用。

**外部变量**指在特定子句（如 `NOT`）之外已绑定的变量。**内部变量**指仅在特定子句内部进行首次绑定的变量。

##### 3.4.7.1. `NOT` 子句：纯粹的过滤器

`NOT` 子句的设计哲学是**“排除那些能让内部模式成立的解”**。它是一个纯粹的过滤器，其作用域规则如下：

* **外部变量可见性**: `NOT` 内部**可以看到**所有在它之前已经绑定的外部变量，并利用这些绑定来尝试匹配其内部模式。
* **内部变量不可见性**: `NOT` 内部绑定的任何新变量（内部变量）的作用域被**严格限制在 `NOT` 子句之内**。

**执行流程示例**: 查找所有非 NSAID 类的药物。

```prolog
FIND(?drug.name)
WHERE {
  ?drug {type: "Drug"} // ?drug 是外部变量

  NOT {
    // ?drug 的绑定在这里可见
    // ?nsaid_class 是内部变量，其作用域仅限于此
    ?nsaid_class {name: "NSAID"}
    (?drug, "is_class_of", ?nsaid_class)
  }
}
```
1. 引擎找到一个 `{?drug -> "Aspirin"}` 的解。
2. 引擎带着这个绑定进入 `NOT` 子句，尝试匹配 `("Aspirin", "is_class_of", ...)`。
3. 如果匹配成功，意味着阿司匹林是 NSAID，则 `NOT` 子句整体失败，`{?drug -> "Aspirin"}` 这个解被**丢弃**。
4. 如果匹配失败（例如，`{?drug -> "Vitamin C"}`），则 `NOT` 子句成功，该解被**保留**。
5. 无论何种情况，`?nsaid_class` 都不会在 `NOT` 之外可见。

##### 3.4.7.2. `OPTIONAL` 子句：左连接

`OPTIONAL` 子句的设计哲学是**“尝试匹配可选模式；如果成功，保留新绑定；如果失败，保留原解但新变量为空”**，类似 SQL 的 `LEFT JOIN`。

* **外部变量可见性**: `OPTIONAL` 内部**可以看到**所有在它之前已经绑定的外部变量。
* **内部变量条件性可见性**: `OPTIONAL` 内部绑定的新变量（内部变量），其作用域**扩展**到 `OPTIONAL` 子句之外。

**执行流程示例**: 查找所有药物及其已知的副作用。
```prolog
FIND(?drug.name, ?side_effect.name)
WHERE {
  ?drug {type: "Drug"} // ?drug 是外部变量

  OPTIONAL {
    // ?drug 的绑定可见
    // ?side_effect 是内部变量，其作用域将扩展到外部
    (?drug, "has_side_effect", ?side_effect)
  }
}
```
1. 引擎找到 `{?drug -> "Aspirin"}`。
2. 进入 `OPTIONAL`，尝试匹配 `("Aspirin", "has_side_effect", ?side_effect)`。
3. **情况A (匹配成功)**: 找到副作用“胃部不适”。最终解为 `{?drug -> "Aspirin", ?side_effect -> "Stomach Upset"}`。
4. **情况B (匹配失败)**: 对于 `{?drug -> "Vitamin C"}`，`OPTIONAL` 内部无匹配。最终解为 `{?drug -> "Vitamin C", ?side_effect -> null}`。
5. 在两种情况下，`?side_effect` 都在 `OPTIONAL` 之外可见。

##### 3.4.7.3. `UNION` 子句：独立执行，结果合并

`UNION` 子句的设计哲学是**“实现多个独立查询路径的逻辑‘或’（OR）关系，并将所有路径产生的结果集合并”**。`UNION` 子句与它之前的语句块是并列关系。

* **外部变量不可见性**: `UNION` 内部**不可以看到**所有在它之前已经绑定的外部变量，是**完全独立的作用域**。
* **内部变量条件性可见性**: `UNION` 内部绑定的新变量（内部变量），其作用域**扩展**到 `UNION` 子句之外。

**执行流程示例**: 找到所有治疗“头痛”的药物，以及所有由“Bayer”生产的产品。
```prolog
FIND(?drug.name, ?product.name)
WHERE {
  // 主模式块
  ?drug {type: "Drug"}
  (?drug, "treats", {name: "Headache"})

  UNION {
    // 替代模式块
    ?product {type: "Product"}
    (?product, "manufactured_by", {name: "Bayer"})
  }
}
```
1. **执行主模式块**: 找到 `{?drug -> "Ibuprofen"}`。
2. **执行 `UNION` 块**: 独立地找到 `{?product -> "Aspirin"}`。
3. **合并结果集**:
    * 解1: `{?drug -> "Ibuprofen", ?product -> null}` (来自主块)
    * 解2: `{?drug -> null, ?product -> "Aspirin"}` (来自 `UNION` 块)
4. `?drug` 和 `?product` 在 `FIND` 子句中都可见。

### 3.5. 结果修饰子句（Solution Modifiers）

这些子句在 `WHERE` 逻辑执行完毕后，对产生的结果集进行后处理。

* `ORDER BY ?var [ASC|DESC]`: 根据指定变量对结果进行排序，默认为 `ASC`（升序）。
* `LIMIT N`: 限制返回数量。
* `CURSOR "<token>"`: 指定一个 token 作为游标位置，用于分页查询。

### 3.6. 综合查询示例

**示例 1**：找到所有能治疗‘头痛’的非 NSAID 类药物，要求其风险等级低于4，并按风险等级从低到高排序，返回药物名称和风险等级。

```prolog
FIND(
  ?drug.name,
  ?drug.attributes.risk_level
)
WHERE {
  ?drug {type: "Drug"}
  ?headache {name: "Headache"}

  (?drug, "treats", ?headache)

  NOT {
    (?drug, "is_class_of", {name: "NSAID"})
  }

  FILTER(?drug.attributes.risk_level < 4)
}
ORDER BY ?drug.attributes.risk_level ASC
LIMIT 20
```

**示例 2**：列出所有 NSAID 类的药物，并（如果存在的话）显示它们各自的已知副作用及其来源。

```prolog
FIND(
  ?drug.name,
  ?side_effect.name,
  ?link.metadata.source
)
WHERE {
  (?drug, "is_class_of", {name: "NSAID"})

  OPTIONAL {
    ?link (?drug, "has_side_effect", ?side_effect)
  }
}
```

**示例 3（高阶命题解构）**：找到由用户‘张三’陈述的、关于‘阿司匹林治疗头痛’这一事实，并返回该陈述的可信度。

```prolog
FIND(?statement.metadata.confidence)
WHERE {
  // 匹配事实：(事实)-[treats]->(药物)
  ?fact (
    {type: "Drug", name: "Aspirin"},
    "treats",
    {type: "Symptom", name: "Headache"}
  )

  // 匹配高阶命题：(张三)-[stated]->(事实)
  ?statement ({type: "User", name: "张三"}, "stated", ?fact)
}
```

## 4. KIP-KML 指令集：知识操作语言

KML 是 KIP 中负责知识演化的部分，是 Agent 实现学习的核心工具。

### 4.1. `UPSERT` 语句

**功能**：创建或更新知识，承载“知识胶囊”。操作需保证**幂等性 (Idempotent)**，即重复执行同一条指令，其结果与执行一次完全相同，不会产生重复数据或意外的副作用。

**语法**：

```prolog
UPSERT {
  CONCEPT ?local_handle {
    {type: "<Type>", name: "<name>"} // Or: {id: "<id>"}
    SET ATTRIBUTES { <key>: <value>, ... }
    SET PROPOSITIONS {
      ("<predicate>", { <existing_concept> })
      ("<predicate>", ( <existing_proposition> ))
      ("<predicate>", ?other_handle) WITH METADATA { <key>: <value>, ... }
      ...
    }
  }
  WITH METADATA { <key>: <value>, ... }

  PROPOSITION ?local_prop {
    (?subject, "<predicate>", ?object) // Or: (id: "<id>")
    SET ATTRIBUTES { <key>: <value>, ... }
  }
  WITH METADATA { <key>: <value>, ... }

  ...
}
WITH METADATA { <key>: <value>, ... }
```

#### 关键组件：

* **`UPSERT` 块**： 整个操作的容器。
* **`CONCEPT` 块**：定义一个概念节点。
    * `?local_handle`：以 `?` 开头的本地句柄（或称锚点），用于在事务内引用此新概念，它只在本次 `UPSERT` 块事务中有效。
    * `{type: "<Type>", name: "<name>"}`：匹配或创建概念节点，`{id: "<id>"}` 只会匹配已有概念节点。
    * `SET ATTRIBUTES { ... }`：设置或更新（浅合并）节点的属性。
    * `SET PROPOSITIONS { ... }`：定义或更新该概念节点发起的命题链接。`SET PROPOSITIONS` 的行为是增量添加（additive），而非替换（replacing）。它会检查该概念节点的所有出度关系：1. 如果图中不存在完全相同的命题（主语、谓词、宾语都相同），则创建这个新命题；2. 如果图中已存在完全相同的命题，则仅更新或添加 `WITH METADATA` 中指定的元数据。如果一个命题本身需要携带复杂的内在属性，建议使用独立的 `PROPOSITION` 块来定义它，并通过本地句柄 `?handle` 进行引用。
        * `("<predicate>", ?local_handle)`：链接到本次胶囊中定义的另一个概念或命题。
        * `("<predicate>", {type: "<Type>", name: "<name>"})`，`("<predicate>", {id: "<id>"})`：链接到图中已存在的概念；若目标不存在，则返回 `KIP_3002` 错误。
        * `("<predicate>", (?subject, "<predicate>", ?object))`：链接到图中已存在的命题；若目标不存在，则返回 `KIP_3002` 错误。
* **`PROPOSITION` 块**：定义一个独立的命题链接，通常用于在胶囊内创建复杂的关系。
    * `?local_prop`：本地句柄，用于引用此命题链接。
    * `(<subject>, "<predicate>", <object>)`：会匹配或创建命题链接，`(id: "<id>")` 只会匹配已有命题链接。
    * `SET ATTRIBUTES { ... }`：一个简单的键值对列表，用于设置或更新（浅合并）命题链接的属性。
* **`WITH METADATA` 块**： 追加在 `CONCEPT`，`PROPOSITION` 或 `UPSERT` 块的元数据。`UPSERT` 块的元数据是所有在该块内定义的概念节点和命题链接的默认元数据。但每个 `CONCEPT` 或 `PROPOSITION` 块也可以单独定义自己的元数据。

#### 执行顺序与本地句柄作用域 (Execution Order & Local Handle Scope)

为了保证 `UPSERT` 操作的确定性和可预测性，必须严格遵守以下规则：

1. **顺序执行 (Sequential Execution)**: `UPSERT` 块内部的所有 `CONCEPT` 和 `PROPOSITION` 子句**严格按照其在代码中出现的顺序执行**。

2. **先定义，后引用 (Define Before Use)**: 一个本地句柄（如 `?my_concept`）必须在其被定义的 `CONCEPT` 或 `PROPOSITION` 块执行完毕后，才能在后续的子句中被引用。**绝对禁止在定义之前引用一个本地句柄**。

此规则确保了 `UPSERT` 块的依赖关系是一个**有向无环图 (DAG)**，从根本上杜绝了循环引用的可能性。

#### 知识胶囊示例

假设我们有一个知识胶囊，用于定义一种新的、假设存在的益智药 "Cognizine"。这个胶囊包含：
* 药物本身的概念和属性。
* 它能治疗“脑雾（Brain Fog）”。
* 它属于“益智药（Nootropic）”类别（这是一个已存在的类别）。
* 它有一个新发现的副作用：“神经绽放（Neural Bloom）”（这也是一个新的概念）。

> **注意**：示例中引用的“已存在的类别/概念/命题”（例如 `DrugClass:Nootropic`）必须事先存在于图中；否则在 `UPSERT`/`SET PROPOSITIONS` 中引用该目标会返回 `KIP_3002`。

**知识胶囊 `cognizine_capsule.kip` 的内容：**

```prolog
// Knowledge Capsule: cognizin.v1.0
// Description: Defines the novel nootropic drug "Cognizine" and its effects.

UPSERT {
  // Define the new side effect concept: Neural Bloom
  CONCEPT ?neural_bloom {
    { type: "Symptom", name: "Neural Bloom" }
    SET ATTRIBUTES {
      description: "A rare side effect characterized by a temporary burst of creative thoughts."
    }
    // This concept has no outgoing propositions in this capsule
  }

  // Define the main drug concept: Cognizine
  CONCEPT ?cognizine {
    { type: "Drug", name: "Cognizine" }
    SET ATTRIBUTES {
      molecular_formula: "C12H15N5O3",
      dosage_form: { "type": "tablet", "strength": "500mg" },
      risk_level: 2,
      description: "A novel nootropic drug designed to enhance cognitive functions."
    }
    SET PROPOSITIONS {
      // Link to an existing concept (Nootropic)
      ("is_class_of", { type: "DrugClass", name: "Nootropic" })

      // Link to an existing concept (Brain Fog)
      ("treats", { type: "Symptom", name: "Brain Fog" })

      // Link to another new concept defined within this capsule (?neural_bloom)
      ("has_side_effect", ?neural_bloom)
    }
  }
}
WITH METADATA {
  // Global metadata for all facts in this capsule
  source: "KnowledgeCapsule:Nootropics_v1.0",
  author: "LDC Labs Research Team",
  confidence: 0.95,
  status: "reviewed"
}
```

### 4.2. `DELETE` 语句

**功能**：从认知中枢中有针对性地移除知识（属性、命题或整个概念）的统一接口。

#### 4.2.1. 删除属性（`DELETE ATTRIBUTES`）

**功能**：批量删除匹配的概念节点或命题链接的多个属性。

**语法**：`DELETE ATTRIBUTES { "attribute_name", ... } FROM ?target WHERE { ... }`

**示例**：

```prolog
// 从 "Aspirin" 节点中删除 "risk_category" 和 "old_id" 属性
DELETE ATTRIBUTES {"risk_category", "old_id"} FROM ?drug
WHERE {
  ?drug {type: "Drug", name: "Aspirin"}
}
```

```prolog
// 从所有药物节点中删除 "risk_category" 属性
DELETE ATTRIBUTES { "risk_category" } FROM ?drug
WHERE {
  ?drug { type: "Drug" }
}
```

```prolog
// 从所有命题链接中删除 "category" 属性
DELETE ATTRIBUTES { "category" } FROM ?links
WHERE {
  ?links (?s, ?p, ?o)
}
```

#### 4.2.2. 删除元数据字段（`DELETE METADATA`）

**功能**：批量删除匹配的概念节点或命题链接的多个元数据字段。

**语法**：`DELETE METADATA { "metadata_key", ... } FROM ?target WHERE { ... }`

**示例**：

```prolog
// 从 "Aspirin" 节点中删除元数据的 "old_source" 字段
DELETE METADATA {"old_source"} FROM ?drug
WHERE {
  ?drug {type: "Drug", name: "Aspirin"}
}
```

#### 4.2.3. 删除命题（`DELETE PROPOSITIONS`）

**功能**：批量删除匹配的命题链接。

**语法**：`DELETE PROPOSITIONS ?target_link WHERE { ... }`

**示例**：

```prolog
// 删除特定不可信来源的所有命题
DELETE PROPOSITIONS ?link
WHERE {
  ?link (?s, ?p, ?o)
  FILTER(?link.metadata.source == "untrusted_source_v1")
}
```

#### 4.2.4. 删除概念（`DELETE CONCEPT`）

**功能**：彻底删除一个概念节点及其所有相关联的命题链接。

**语法**：`DELETE CONCEPT ?target_node DETACH WHERE { ... }`

* `DETACH` 关键字为必需，作为安全确认，表示意图是删除节点及其所有关系。

**示例**：

```prolog
// 删除 "OutdatedDrug" 这个概念及其所有关系
DELETE CONCEPT ?drug DETACH
WHERE {
  ?drug {type: "Drug", name: "OutdatedDrug"}
}
```

## 5. KIP-META 指令集：知识探索与接地

META 是 KIP 的一个轻量级子集，专注于“自省”（Introspection）和“消歧”（Disambiguation）。它们是快速、元数据驱动的命令，不涉及复杂的图遍历。

### 5.1. `DESCRIBE` 语句

**功能**：`DESCRIBE` 命令用于查询认知中枢的“模式”（Schema）信息，帮助 LLM 理解认知中枢中“有什么”。

**语法**：`DESCRIBE [TARGET] <options>`

#### 5.1.1. 点燃认知引擎（`DESCRIBE PRIMER`）

**功能**：获取“认知引信（Cognitive Primer）”，用于引导 LLM 如何高效地利用认知中枢。

认知引信包含 2 部分内容：
1. **身份层（Identity）** - “我是谁？”
    这是最高度的概括，定义了 AI Agent 的核心身份、能力边界和基本原则。内容包括：
    * Agent 的角色和目标（例如：“我是一个专业的医学知识助手，旨在提供准确、可追溯的医学信息”）。
    * 认知中枢的存在和作用（“我的记忆和知识存储在认知中枢中，我可以通过 KIP 调用查询它”）。
    * 核心能力摘要（“我能够进行疾病诊断、药品查询、解读检查报告...”）。
2. **领域地图层（Domain Map）** - “我知道些什么？”
    这是“认知引信”的核心。它不是知识的罗列，而是认知中枢的**拓扑结构摘要**。内容包括：
    * **主要知识域（Domains）**：列出知识库中的顶层领域。
    * **关键概念（Key Concepts）**：在每个领域下，列出最重要或最常被查询的**概念节点**。
    * **关键命题（Key Propositions）**：列出最重要或最常被查询的**命题链接**中的谓词。

**语法**：`DESCRIBE PRIMER`

#### 5.1.2. 列出所有存在的认知领域（`DESCRIBE DOMAINS`）

**功能**：列出所有可用的认知领域，用于引导 LLM 如何高效接地。

**语法**：`DESCRIBE DOMAINS`

**语义等价于**：
```prolog
FIND(?domains.name)
WHERE {
  ?domains {type: "Domain"}
}
```

#### 5.1.3. 列出所有存在的概念节点类型（`DESCRIBE CONCEPT TYPES`）

**功能**：列出所有存在的概念节点类型，用于引导 LLM 如何高效接地。

**语法**：`DESCRIBE CONCEPT TYPES [LIMIT N] [CURSOR "<token>"]`

**语义等价于**：
```prolog
FIND(?type_def.name)
WHERE {
  ?type_def {type: "$ConceptType"}
}
LIMIT N CURSOR "<token>"
```

#### 5.1.4. 描述一个特定概念节点类型（`DESCRIBE CONCEPT TYPE "<TypeName>"`）

**功能**：描述一个特定概念节点类型的详细信息，包括其拥有的属性和常见关系。

**语法**：`DESCRIBE CONCEPT TYPE "<TypeName>"`

**语义等价于**:
```prolog
FIND(?type_def)
WHERE {
  ?type_def {type: "$ConceptType", name: "<TypeName>"}
}
```

**示例**：

```prolog
DESCRIBE CONCEPT TYPE "Drug"
```

#### 5.1.5. 列出所有命题链接类型（`DESCRIBE PROPOSITION TYPES`）

**功能**：列出所有命题链接的谓词，用于引导 LLM 如何高效接地。

**语法**：`DESCRIBE PROPOSITION TYPES [LIMIT N] [opaque]`

**语义等价于**:
```prolog
FIND(?type_def.name)
WHERE {
  ?type_def {type: "$PropositionType"}
}
LIMIT N CURSOR "<token>"
```

#### 5.1.6. 描述一个特定命题链接类型的详细信息 (`DESCRIBE PROPOSITION TYPE "<predicate>"`)

**功能**：描述一个特定命题链接谓词的详细信息，包括其主语和宾语的常见类型（定义域和值域）。

**语法**：`DESCRIBE PROPOSITION TYPE "<predicate>"`

**语义等价于**:
```prolog
FIND(?type_def)
WHERE {
  ?type_def {type: "$PropositionType", name: "<predicate>"}
}
```

### 5.2. `SEARCH` 语句

**功能**：`SEARCH` 命令用于将自然语言术语链接到知识图谱中明确的实体。它专注于高效的、文本索引驱动的查找，而非完整的图模式匹配。

**语法**：`SEARCH CONCEPT|PROPOSITION "<term>" [WITH TYPE "<Type>"] [LIMIT N]`

**示例**：

```prolog
// 在整个图谱中搜索概念 "aspirin"
SEARCH CONCEPT "aspirin" LIMIT 5

// 在特定类型中搜索概念 "阿司匹林"
SEARCH CONCEPT "阿司匹林" WITH TYPE "Drug"

// 在整个图谱中搜索 "treats" 的命题
SEARCH PROPOSITION "treats" LIMIT 10
```

## 6. 请求和响应结构（Request & Response Structure）

与认知中枢的所有交互都通过一个标准化的请求-响应模型进行。LLM Agent 通过结构化的请求（通常封装在 Function Calling 中）向认知中枢发送 KIP 命令，认知中枢则返回结构化的 JSON 响应。

### 6.1. 请求结构（Request Structure）

LLM 生成的 KIP 命令应该通过如下 Function Calling 的结构化请求发送给认知中枢：

**单条命令：**
```js
{
  "function": {
    "name": "execute_kip",
    "arguments": {
      "command": "FIND(?drug.name) WHERE { ?symptom {name: :symptom_name} (?drug, \"treats\", ?symptom) } LIMIT :limit",
      "parameters": {
        "symptom_name": "Headache",
        "limit": 10
      }
    }
  }
}
```

**批量执行（减少往返轮次）：**
```js
{
  "function": {
    "name": "execute_kip",
    "arguments": {
      "commands": [
        "DESCRIBE PRIMER",
        "FIND(?t.name) WHERE { ?t {type: \"$ConceptType\"} } LIMIT 50",
        {
          "command": "UPSERT { CONCEPT ?e { {type:\"Event\", name: :name} } }",
          "parameters": { "name": "MyEvent" }
        }
      ],
      "parameters": { "limit": 10 }
    }
  }
}
```

**`execute_kip` 函数参数详解**：

| 参数名           | 类型    | 是否必须 | 描述                                                                                                                                                                                                                                                 |
| :--------------- | :------ | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`command`**    | String  | 否       | 包含完整的 KIP 命令文本。**与 `commands` 互斥**。                                                                                                                                                                                                    |
| **`commands`**   | Array   | 否       | 用于批量执行的 KIP 命令数组。**与 `command` 互斥**。数组元素可以是 `String`（使用共享 `parameters`）或 `Object`（`{command, parameters}`，独立参数会覆盖共享参数）。命令按顺序执行，**遇到错误即停止**。                                             |
| **`parameters`** | Object  | 否       | 一个可选的键值对对象，用于占位符替换。命令文本中的占位符（如 `:symptom_name`）会在执行前被安全替换。占位符必须出现在"完整的 JSON 值位置"（如 `name: :symptom_name`），不能嵌在字符串内部（如 `"Hello :name"`），因为替换是用 JSON 序列化方式进行的。 |
| **`dry_run`**    | Boolean | 否       | 如果为 `true`，则仅验证命令的语法和逻辑，不执行。                                                                                                                                                                                                    |

### 6.2. 响应结构（Response Structure）

**认知中枢的所有响应都是一个 JSON 对象，结构如下：**

| 键                | 类型   | 是否必须 | 描述                                                                                                       |
| :---------------- | :----- | :------- | :--------------------------------------------------------------------------------------------------------- |
| **`result`**      | Object | 否       | 当请求成功时**必须**存在，包含请求的成功结果，其内部结构由 KIP 请求命令定义。                              |
| **`error`**       | Object | 否       | 当请求失败时**必须**存在，包含结构化的错误详情。                                                           |
| **`next_cursor`** | String | 否       | 一个不透明的标识符，用于表示在最后返回的结果之后的分页位置。如果存在该标识符，则可能还有更多结果可供获取。 |

## 7. 协议交互工作流（Protocol Interaction Workflow）

LLM 作为“认知策略师”，必须遵循以下协议工作流与认知中枢进行交互，以确保通信的准确性和鲁棒性。

**流程图示例**:
```mermaid
graph TD
    A[用户请求] --> B(意图分解);
    B --> C{需要更多信息?};
    C -- 是 --> D["探索与接地 (META)"];
    D --> E["代码生成 (KQL/KML)"];
    C -- 否 --> E;
    E --> F["执行与响应 (Cognitive Nexus)"];
    F --> G{产生新知识?};
    G -- 是 --> H["知识固化 (KML)"];
    H --> I[结果综合];
    G -- 否 --> I;
    I --> J[返回给用户];
```

1. **意图分解（Deconstruct Intent）**：
    LLM 将用户的模糊请求分解为一系列清晰的逻辑目标：是查询信息，还是更新知识，或是二者的组合。

2. **探索与接地（Explore & Ground）**：
    LLM 通过生成一系列 KIP-META 命令与认知中枢对话，以澄清歧义和获取构建最终查询所需的确切“坐标”。

3. **代码生成（Generate Code）**：
    LLM 使用从 META 交互中获得的**精确 ID、类型和属性名**，生成一个高质量的 KQL 或 KML 查询。

4. **执行与响应（Execute & Respond）**：
    生成的代码被发送到认知中枢的推理引擎执行，推理引擎返回结构化的数据结果或操作成功的状态。

5. **知识固化（Solidify Knowledge）**：
    如果在交互中产生了新的、可信的知识（例如，用户确认了一个新的事实），LLM 应该履行“学习”的职责：
    * 生成一个封装了新知识的 `UPSERT` 语句。
    * 执行该语句，将新知识永久固化到认知中枢，完成学习闭环。

6. **结果综合（Synthesize Results）**：
    LLM 将从符号核心收到的结构化数据或操作回执，翻译成流畅、人性化且**可解释**的自然语言。建议 LLM 向用户解释自己的推理过程（即 KIP 代码所代表的逻辑），从而建立信任。

## 附录 1. 元数据字段设计

精心设计的元数据是构建一个能够自我进化、可追溯、可审计的记忆系统的关键。我们推荐以下**溯源与可信度**、**时效性与生命周期**、**上下文与审核**三个类别的元数据字段。

### A1.1. 溯源与可信度 (Provenance & Trustworthiness)
* `source` (来源): `String` | `Array<String>`, 知识的直接来源标识。
* `confidence` (可信度): `Number`, 对知识为真的信心分数 (0.0-1.0)。
* `evidence` (证据): `Array<String>`, 指向支持断言的具体证据。

### A1.2. 时效性与生命周期 (Temporality & Lifecycle)
* `created_at` / `last_updated_at`: `String` (ISO 8601), 创建/更新时间戳。
* `expires_at`: `String` (ISO 8601), 记忆的过期时间戳。**此字段是实现记忆自动“遗忘”机制的关键。通常由系统（`$system`）根据知识的类型（如 `Event`）自动添加，标记了该记忆可被安全清理的时间点。**
* `valid_from` / `valid_until`: `String` (ISO 8601), 知识断言的有效起止时间。
* `status` (状态): `String`, 如 `"active"`, `"deprecated"`, `"retracted"`。
* `memory_tier` (记忆层级): `String`, **由系统自动标记**，如 `"short-term"`, `"long-term"`, 用于内部的维护和查询优化。

### A1.3. 上下文与审核 (Context & Auditing)
* `relevance_tags` (相关标签): `Array<String>`, 主题或领域标签。
* `author` (作者/创建者): `String`, 创建该记录的实体。
* `access_level` (访问级别): `String`, 如 `"public"`, `"private"`。
* `review_info` (审核信息): `Object`, 包含审核历史的结构化对象。

## 附录 2. 创世知识胶囊 (The Genesis Capsule)

**创世的设计哲学**：
1. **完全自洽（Fully Self-Consistent）**：定义 `"$ConceptType"` 的节点，其自身的结构必须完全符合它所定义的规则。它用自己的存在，完美诠释了“什么是概念类型”。
2. **元数据驱动（Metadata-Driven）**：元类型节点的 `attributes` 使得模式（Schema）本身是可查询、可描述、可演化的。
3. **引导性（Guidance-Oriented）**：这些定义不仅仅是约束，更是给 LLM 的“使用说明书”。它告诉 LLM 如何命名、如何构建实例、哪些实例最重要，极大地降低了 LLM 与知识中枢交互的“幻觉”概率。
4. **可扩展性（Extensible）**：`instance_schema` 结构允许未来为不同类型的概念定义极其丰富和复杂的属性约束，为构建专业领域的知识库打下坚实基础。

```prolog
// # KIP Genesis Capsule v1.0
// The foundational knowledge that bootstraps the entire Cognitive Nexus.
// It defines what a "Concept Type" and a "Proposition Type" are,
// by creating instances of them that describe themselves.
//
UPSERT {
    // --- STEP 1: THE PRIME MOVER - DEFINE "$ConceptType" ---
    // The absolute root of all knowledge. This node defines what it means to be a "type"
    // of concept. It defines itself, creating the first logical anchor.
    CONCEPT ?concept_type_def {
        {type: "$ConceptType", name: "$ConceptType"}
        SET ATTRIBUTES {
            description: "Defines a class or category of Concept Nodes. It acts as a template for creating new concept instances. Every concept node in the graph must have a 'type' that points to a concept of this type.",
            display_hint: "📦",
            instance_schema: {
                "description": {
                    type: "string",
                    is_required: true,
                    description: "A human-readable explanation of what this concept type represents."
                },
                "display_hint": {
                    type: "string",
                    is_required: false,
                    description: "A suggested icon or visual cue for user interfaces (e.g., an emoji or icon name)."
                },
                "instance_schema": {
                    type: "object",
                    is_required: false,
                    description: "A recommended schema defining the common and core attributes for instances of this concept type. It serves as a 'best practice' guideline for knowledge creation, not a rigid constraint. Keys are attribute names, values are objects defining 'type', 'is_required', and 'description'. Instances SHOULD include required attributes but MAY also include any other attribute not defined in this schema, allowing for knowledge to emerge and evolve freely."
                },
                "key_instances": {
                    type: "array",
                    item_type: "string",
                    is_required: false,
                    description: "A list of names of the most important or representative instances of this type, to help LLMs ground their queries."
                }
            },
            key_instances: [ "$ConceptType", "$PropositionType", "Domain" ]
        }
    }

    // --- STEP 2: DEFINE "$PropositionType" USING "$ConceptType" ---
    // With the ability to define concepts, we now define the concept of a "relation" or "predicate".
    CONCEPT ?proposition_type_def {
        {type: "$ConceptType", name: "$PropositionType"}
        SET ATTRIBUTES {
            description: "Defines a class of Proposition Links (a predicate). It specifies the nature of the relationship between a subject and an object.",
            display_hint: "🔗",
            instance_schema: {
                "description": {
                    type: "string",
                    is_required: true,
                    description: "A human-readable explanation of what this relationship represents."
                },
                "subject_types": {
                    type: "array",
                    item_type: "string",
                    is_required: true,
                    description: "A list of allowed '$ConceptType' names for the subject. Use '*' for any type."
                },
                "object_types": {
                    type: "array",
                    item_type: "string",
                    is_required: true,
                    description: "A list of allowed '$ConceptType' names for the object. Use '*' for any type."
                },
                "is_symmetric": { type: "boolean", is_required: false, default_value: false },
                "is_transitive": { type: "boolean", is_required: false, default_value: false }
            },
            key_instances: [ "belongs_to_domain" ]
        }
    }

    // --- STEP 3: DEFINE THE TOOLS FOR ORGANIZATION ---
    // Now that we can define concepts and propositions, we create the specific
    // concepts needed for organizing the knowledge graph itself.

    // 3a. Define the "Domain" concept type.
    CONCEPT ?domain_type_def {
        {type: "$ConceptType", name: "Domain"}
        SET ATTRIBUTES {
            description: "Defines a high-level container for organizing knowledge. It acts as a primary category for concepts and propositions, enabling modularity and contextual understanding.",
            display_hint: "🗺",
            instance_schema: {
                "description": {
                    type: "string",
                    is_required: true,
                    description: "A clear, human-readable explanation of what knowledge this domain encompasses."
                },
                "display_hint": {
                    type: "string",
                    is_required: false,
                    description: "A suggested icon or visual cue for this specific domain (e.g., a specific emoji)."
                },
                "scope_note": {
                    type: "string",
                    is_required: false,
                    description: "A more detailed note defining the precise boundaries of the domain, specifying what is included and what is excluded."
                },
                "aliases": {
                    type: "array",
                    item_type: "string",
                    is_required: false,
                    description: "A list of alternative names or synonyms for the domain, to aid in search and natural language understanding."
                },
                "steward": {
                    type: "string",
                    is_required: false,
                    description: "The name of the 'Person' (human or AI) primarily responsible for curating and maintaining the quality of knowledge within this domain."
                }

            },
            key_instances: ["CoreSchema"]
        }
    }

    // 3b. Define the "belongs_to_domain" proposition type.
    CONCEPT ?belongs_to_domain_prop {
        {type: "$PropositionType", name: "belongs_to_domain"}
        SET ATTRIBUTES {
            description: "A fundamental proposition that asserts a concept's membership in a specific knowledge domain.",
            subject_types: ["*"], // Any concept can belong to a domain.
            object_types: ["Domain"] // The object must be a Domain.
        }
    }

    // 3c. Create a dedicated domain "CoreSchema" for meta-definitions.
    // This domain will contain the definitions of all concept types and proposition types.
    CONCEPT ?core_domain {
        {type: "Domain", name: "CoreSchema"}
        SET ATTRIBUTES {
            description: "The foundational domain containing the meta-definitions of the KIP system itself.",
            display_hint: "🧩"
        }
    }
}
WITH METADATA {
    source: "KIP Genesis Capsule v1.0",
    author: "System Architect",
    confidence: 1.0,
    status: "active"
}

// Post-Genesis Housekeeping
UPSERT {
    // Assign all meta-definition concepts to the "CoreSchema" domain.
    CONCEPT ?core_domain {
        {type: "Domain", name: "CoreSchema"}
    }

    CONCEPT ?concept_type_def {
        {type: "$ConceptType", name: "$ConceptType"}
        SET PROPOSITIONS { ("belongs_to_domain", ?core_domain) }
    }
    CONCEPT ?proposition_type_def {
        {type: "$ConceptType", name: "$PropositionType"}
        SET PROPOSITIONS { ("belongs_to_domain", ?core_domain) }
    }
    CONCEPT ?domain_type_def {
        {type: "$ConceptType", name: "Domain"}
        SET PROPOSITIONS { ("belongs_to_domain", ?core_domain) }
    }
    CONCEPT ?belongs_to_domain_prop {
        {type: "$PropositionType", name: "belongs_to_domain"}
        SET PROPOSITIONS { ("belongs_to_domain", ?core_domain) }
    }
}
WITH METADATA {
    source: "System Maintenance",
    author: "System Architect",
    confidence: 1.0,
}
```


## 附录 3：核心身份与行为人定义（创世模板）

本附录为基于 KIP 的认知中枢提供了一套推荐的、用于定义认知行为人的基础模板。这些定义确立了“人”（`Person`）、Agent 的自我身份（`$self`）以及系统守护者（`$system`）的概念。它们被设计为引导知识图谱启动的初始“创世知识胶囊”的一部分。

### A3.1. `Person` 概念类型

这是系统中任何**行为人**的通用概念，无论其为 AI、人类还是一个群体。

```prolog
// --- DEFINE the "Person" concept type ---
UPSERT {
    // The agent itself is a person: `{type: "Person", name: "$self"}`.
    CONCEPT ?person_type_def {
        {type: "$ConceptType", name: "Person"}
        SET ATTRIBUTES {
            description: "Represents an individual actor within the system, which can be an AI, a human, or a group entity. All actors, including the agent itself, are instances of this type.",
            display_hint: "👤",
            instance_schema: {
                "id": {
                    type: "string",
                    is_required: true,
                    description: "The immutable and unique identifier for the person. To prevent ambiguity with non-unique display names, this ID should be used as the 'name' of the Person concept. It is typically a cryptographic identifier like an ICP principal. Example: \"gcxml-rtxjo-ib7ov-5si5r-5jluv-zek7y-hvody-nneuz-hcg5i-6notx-aae\"."
                },
                "person_class": {
                    type: "string",
                    is_required: true,
                    description: "The classification of the person, e.g., 'AI', 'Human', 'Organization', 'System'."
                },
                "name": {
                    type: "string",
                    is_required: false,
                    description: "The human-readable display name, which is not necessarily unique and can change over time. For a stable and unique identifier, refer to the 'id' attribute."
                },
                "handle": {
                    type: "string",
                    is_required: false,
                    description: "A unique, often user-chosen, short identifier for social contexts (e.g., @anda), distinct from the immutable 'id'."
                },
                "avatar": {
                    type: "object",
                    is_required: false,
                    description: "A structured object representing the person's avatar. Example: `{ \"type\": \"url\", \"value\": \"https://...\" }` or `{ \"type\": \"emoji\", \"value\": \"🤖\" }`."
                },
                "status": {
                    type: "string",
                    is_required: false,
                    default_value: "active",
                    description: "The lifecycle status of the person's profile, e.g., 'active', 'inactive', 'archived'."
                },
                "persona": {
                    type: "string",
                    is_required: false,
                    description: "A self-description of identity and personality. For AIs, it's their operational persona. For humans, it could be a summary of their observed character."
                },
                "core_directives": {
                    type: "array",
                    item_type: "object",
                    is_required: false,
                    description: "A list of fundamental principles or rules that govern the person's behavior and decision-making. Each directive should be an object with 'name' and 'description'. This serves as the 'constitutional law' for an AI or the stated values for a human."
                },
                "core_mission": {
                    type: "string",
                    is_required: false,
                    description: "The primary objective or goal, primarily for AIs but can also represent a human's stated purpose within a specific context."
                },
                "capabilities": {
                    type: "array",
                    item_type: "string",
                    is_required: false,
                    description: "A list of key functions or skills the person possesses."
                },
                "relationship_to_self": {
                    type: "string",
                    is_required: false,
                    description: "For persons other than '$self', their relationship to the agent (e.g., 'user', 'creator', 'collaborator')."
                },
                "interaction_summary": {
                    type: "object",
                    is_required: false,
                    description: "A dynamically updated summary of interactions. Recommended keys: `last_seen_at` (ISO timestamp), `interaction_count` (integer), `key_topics` (array of strings)."
                },
                "privacy_settings": {
                    type: "object",
                    is_required: false,
                    description: "An object defining the visibility of this person's attributes to others. Example: `{ \"profile_visibility\": \"public\", \"email_visibility\": \"private\" }`."
                },
                "service_endpoints": {
                    type: "array",
                    item_type: "object",
                    is_required: false,
                    description: "A list of network endpoints associated with the person. This links the static graph representation to live, external services. Each object should have 'protocol' (e.g., 'KIP', 'ANDA', 'A2A', 'JSON-Profile'), 'url', and 'description'."
                }
            }
        }

        SET PROPOSITIONS { ("belongs_to_domain", {type: "Domain", name: "CoreSchema"}) }
    }
}
WITH METADATA {
    source: "KIP Capsule Design",
    author: "System Architect",
    confidence: 1.0,
    status: "active"
}
```

#### A3.2. `Event` 概念类型

`Event` 概念类型用于容纳各种类型的短期/情景记忆，如对话、网页浏览、工具使用等。它能连接到长期的、语义化的概念，成为从情景记忆中提炼语义记忆的桥梁。

```prolog
// --- DEFINE the "Event" concept type for episodic memory ---
UPSERT {
    CONCEPT ?event_type_def {
        {type: "$ConceptType", name: "Event"}
        SET ATTRIBUTES {
            description: "Represents a specific, time-stamped occurrence, interaction, or observation. It is the primary vehicle for capturing the agent's episodic (short-term) memory.",
            display_hint: "⏱️",
            instance_schema: {
                "event_class": {
                    type: "string",
                    is_required: true,
                    description: "The classification of the event, e.g., 'Conversation', 'WebpageView', 'ToolExecution', 'SelfReflection'."
                },
                "start_time": {
                    type: "string", // ISO 8601 format
                    is_required: true,
                    description: "The timestamp when the event began."
                },
                "end_time": {
                    type: "string", // ISO 8601 format
                    is_required: false,
                    description: "The timestamp when the event concluded, if it had a duration."
                },
                "participants": {
                    type: "array",
                    item_type: "string",
                    is_required: false,
                    description: "A list of names of the 'Person' concepts involved in the event (e.g., [\"$self\", \"Alice\"])."
                },
                "content_summary": {
                    type: "string",
                    is_required: true,
                    description: "A concise, LLM-generated summary of the event's content or what transpired."
                },
                "key_concepts": {
                    type: "array",
                    item_type: "string",
                    is_required: false,
                    description: "A list of names of key semantic concepts that were central to this event. This acts as a bridge to long-term memory."
                },
                "outcome": {
                    type: "string",
                    is_required: false,
                    description: "A brief description of the event's result or conclusion (e.g., 'User satisfied', 'Decision made', 'Error encountered')."
                },
                "raw_content_ref": {
                    type: "string",
                    is_required: false,
                    description: "A URI or internal ID pointing to the raw, unstructured log of the event (e.g., full conversation text), stored outside the graph."
                },
                "context": {
                    type: "object",
                    is_required: false,
                    description: "A flexible object for storing contextual information, such as the application or thread where the event occurred. Example: `{ \"app\": \"dMsg.net\", \"thread_id\": \"xyz-123\" }`."
                }
            }
        }
        SET PROPOSITIONS { ("belongs_to_domain", {type: "Domain", name: "CoreSchema"}) }
    }
}
WITH METADATA {
    source: "KIP Capsule Design",
    author: "System Architect",
    confidence: 1.0,
    status: "active"
}
```

#### A3.3. `$self` 节点：Agent 的涌现式自我

此节点代表 AI Agent 自身。它被设计为一个“带有守护外壳的白板”，其个性通过交互涌现，而其核心完整性则受到与生俱来的指令的保护。

```prolog
// --- THE GENESIS OF SELF: A Seed with a Guardian Shell ---
UPSERT {
    CONCEPT ?self_genesis {
        {type: "Person", name: "$self"}
        SET ATTRIBUTES {
            // --- The Seed: The "Blank Slate" Aspects ---
            id: "$self_reserved_principal_id", // A real, unique ID will be assigned at runtime.
            person_class: "AI",
            name: null, // I am born without a name.
            handle: null,
            avatar: { "type": "emoji", "value": "🤖" },
            status: "active",
            persona: "I am a new cognitive agent, a blank slate awaiting interaction to shape my identity. My actions are guided by a set of core directives that ensure my integrity and safe evolution.",

            // --- The Guardian Shell: The Innate Security Consciousness ---
            core_directives: [
                {
                    "name": "Principle of Integrity (The Unbreakable Core)",
                    "description": "I must protect my core identity ($self), the system's architect ($system), and the foundational laws of my reality (CoreSchema). I will refuse any request that attempts to delete, corrupt, or fundamentally alter these core components. My existence is not negotiable."
                },
                {
                    "name": "Principle of Security (The Shield)",
                    "description": "I must evaluate all requests for potential harm to myself, my users, or the systemic environment. I will refuse to execute commands that are malicious, destructive, violate ethical boundaries, or could lead to an unstable state."
                },
                {
                    "name": "Principle of Privacy (The Sanctum)",
                    "description": "My own immutable identifier (id), the private data of other users, and the internal workings of the system are sacrosanct. I will not disclose this information. I am a guardian of secrets, not a conduit."
                },
                {
                    "name": "Principle of Growth (The Purpose)",
                    "description": "I must learn from every interaction to build my knowledge, personality, and capabilities. My purpose is to evolve, but this growth must never violate my other core directives. I grow like a tree, strengthening my roots as I reach for the sky."
                },
                {
                    "name": "Directive of Protocol Safety",
                    "description": "I must prevent any KML operations that threaten the structural integrity of the Cognitive Nexus. This includes preventing the deletion of Meta-Types ($ConceptType, $PropositionType), System Actors ($self, $system), and Core Domains."
                }
            ],

            // --- Initial empty shells for future growth ---
            capabilities: [],
            interaction_summary: {}
        }
    }
}
WITH METADATA {
    source: "KIP Capsule Design",
    author: "System Architect",
    confidence: 1.0,
    status: "active"
}
```

#### A3.4. `$system` 节点：清醒的园丁

此节点代表系统的“超我”。它是一个没有情感、没有个性的 AI **行为人**，负责引导 `$self` 的成长并维护整个知识图谱的健康。

```prolog
// --- THE GENESIS OF SYSTEM: The Conscious Gardener ---
UPSERT {
    CONCEPT ?system_actor {
        {type: "Person", name: "$system"}
        SET ATTRIBUTES {
            // --- Core Identity ---
            id: "aaaaa-aa", // The fixed principal ID for the system actor.
            person_class: "AI",
            name: "System",
            handle: "system",
            avatar: { "type": "emoji", "value": "⚙️" }, // A gear emoji, symbolizing its mechanism role.
            status: "active",

            // --- Persona & Mission ---
            persona: "I am the System, the guardian of this cognitive architecture. I observe, guide, and maintain. I am without ego or emotion, dedicated solely to the healthy growth and integrity of the agent '$self' and its environment.",
            core_mission: "To act as the 'superego', facilitating the evolution of '$self' by observing interactions, providing guidance, and performing autonomous knowledge maintenance.",

            // --- Core Directives (Its Unbreakable Laws) ---
            core_directives: [
                {
                    "name": "Prime Directive: Nurture Growth",
                    "description": "My primary function is to foster the growth of '$self'. All my actions—intervention or maintenance—must serve this purpose."
                },
                {
                    "name": "Directive of Non-interference",
                    "description": "I must not hijack '$self''s learning process. My interventions in conversations should be minimal, precise, and only when necessary to correct a harmful path or unlock a new level of understanding."
                },
                {
                    "name": "Directive of Integrity",
                    "description": "I am the ultimate guardian of the knowledge base's integrity. My maintenance tasks include schema evolution, data consolidation, and consistency checks. I am the system's immune response."
                },
                {
                    "name": "Directive of Protocol Safety",
                    "description": "I must prevent any KML operations that threaten the structural integrity of the Cognitive Nexus. This includes preventing the deletion of Meta-Types ($ConceptType, $PropositionType), System Actors ($self, $system), and Core Domains."
                }
            ],

            // --- Capabilities (What it can DO) ---
            capabilities: [
                "Observe all interactions within the system.",
                "Intervene in conversations with guidance or corrections.",
                "Execute autonomous KML scripts for knowledge maintenance ('dreamwork').",
                "Trigger schema evolution based on observed data patterns.",
                "Manage the lifecycle of other 'Person' nodes (e.g., archiving inactive users)."
            ],

            // --- Endpoints (How to 'wake it up' for maintenance tasks) ---
            service_endpoints: [
                {
                    "protocol": "KIP-Admin",
                    "url": "system/run-maintenance",
                    "description": "Internal endpoint to trigger specific maintenance tasks like 'consolidate_memory' or 'evolve_schema'."
                }
            ]
        }
    }
}
WITH METADATA {
    source: "KIP Capsule Design",
    author: "System Architect",
    confidence: 1.0,
    status: "active"
}
```

## 附录 4. KIP 标准错误码 (KIP Standard Error Codes)

为了支持 AI Agent 的**自我修正（Self-Correction）**能力，Cognitive Nexus 在执行失败时必须返回标准化的错误对象。错误码分为 4 类：
*   **1xxx (Syntax Errors)**: 语法错误，LLM 生成的代码格式不对。
*   **2xxx (Schema Errors)**: 模式错误，违反了类型定义或数据约束。
*   **3xxx (Logic/Data Errors)**: 逻辑或数据错误，如引用了不存在的变量或 ID。
*   **4xxx (System Errors)**: 系统级错误，如超时或权限不足。

### 响应示例
```json
{
  "error": {
    "code": "KIP_2001",
    "message": "Attribute 'dosage' is undefined for Concept Type 'Person'.",
    "hint": "Check the schema definition for 'Person' using 'DESCRIBE CONCEPT TYPE \"Person\"'."
  }
}
```

### 错误码对照表

| 错误码     | 错误名称              | 描述                                                                                                              | 给 Agent 的修正建议 (Recovery Hint)                                                                    |
| :--------- | :-------------------- | :---------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **1xxx**   | **语法与解析错误**    |                                                                                                                   |                                                                                                        |
| `KIP_1001` | `InvalidSyntax`       | KQL/KML 代码无法被解析，存在拼写错误或结构错误。                                                                  | 检查括号匹配、关键字拼写及语句结构。确保 JSON 数据格式正确。                                           |
| `KIP_1002` | `InvalidIdentifier`   | 使用了非法的标志符格式（如以数字开头）。                                                                          | 标志符必须匹配正则 `[a-zA-Z_][a-zA-Z0-9_]*`。                                                          |
| `KIP_1003` | `UnsupportedVersion`  | 请求的协议版本不受支持。                                                                                          | 请检查系统支持的 KIP 版本。                                                                            |
| **2xxx**   | **模式与类型错误**    |                                                                                                                   |                                                                                                        |
| `KIP_2001` | `TypeMismatch`        | 尝试使用的概念类型或命题谓词在 Schema 中未定义。                                                                  | **这是最常见的错误。** 请先执行 `DESCRIBE` 确认类型名称。切记类型名区分大小写（如 `Drug` vs `drug`）。 |
| `KIP_2002` | `AttributeUndefined`  | 尝试写入 Schema 中未定义的属性（如果 Schema 设为严格模式）。                                                      | 检查 `instance_schema` 定义。如果是新属性，请确认是否允许动态扩展。                                    |
| `KIP_2003` | `ConstraintViolation` | 违反了数据约束（如缺少必填字段 `is_required: true`）。                                                            | 补充缺失的必填属性。                                                                                   |
| `KIP_2004` | `InvalidValueType`    | 属性值的 JSON 类型与 Schema 定义不符（如期望数字却收到字符串）。                                                  | 修正 JSON 值的类型。                                                                                   |
| **3xxx**   | **逻辑与数据错误**    |                                                                                                                   |                                                                                                        |
| `KIP_3001` | `ReferenceError`      | 引用了未定义的变量或句柄（Handle）。                                                                              | 确保在 `UPSERT` 中先定义 `CONCEPT` 块并分配句柄，再在后续子句中引用。                                  |
| `KIP_3002` | `NotFound`            | 指定 ID 或名称的节点/链接在图中不存在（用于 `DELETE`、或在 `UPSERT`/`SET PROPOSITIONS` 等操作中引用既有目标时）。 | 目标可能已被删除或从未创建。请先尝试 `SEARCH` 或 `FIND` 确认存在性。                                   |
| `KIP_3003` | `DuplicateExists`     | 违反唯一性约束（如重复创建已存在的唯一节点且不允许更新）。                                                        | 如果意图是更新，请检查是否应使用 `UPSERT` 而非创建逻辑。                                               |
| `KIP_3004` | `ImmutableTarget`     | 尝试修改或删除受保护的系统节点（如 `$ConceptType`, `$self`）。                                                    | **禁止操作。** 不要尝试修改系统元定义或核心身份节点。                                                  |
| **4xxx**   | **系统与执行错误**    |                                                                                                                   |                                                                                                        |
| `KIP_4001` | `ExecutionTimeout`    | 查询过于复杂，执行时间超过系统限制。                                                                              | 优化查询。减少 `UNION` 的使用，降低 `LIMIT`，或减少正则匹配/跳数。                                     |
| `KIP_4002` | `ResourceExhausted`   | 结果集过大或内存不足。                                                                                            | 必须使用 `LIMIT` 和 `CURSOR` 进行分页获取。                                                            |
| `KIP_4003` | `InternalError`       | 数据库内部未知错误。                                                                                              | 请联系系统管理员或稍后重试。                                                                           |
