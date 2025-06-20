# 🧬 KIP（Knowledge Interaction Protocol）规范（草案）

**[English](./README.md) | [中文](./README_CN.md)**

**版本历史**：
| 版本        | 日期       | 变更说明                                                                     |
| ----------- | ---------- | ---------------------------------------------------------------------------- |
| v1.0-draft1 | 2025-06-09 | 初始草案                                                                     |
| v1.0-draft2 | 2025-06-15 | 优化 `UNION` 子句                                                            |
| v1.0-draft3 | 2025-06-18 | 优化术语，简化语法，移除 `SELECT` 子查询，添加 `META` 子句，增强命题链接子句 |
| v1.0-draft4 | 2025-06-19 | 简化语法，移除 `COLLECT`，`AS`，`@`                                          |

**KIP 实现**：
- [Anda KIP](https://github.com/ldclabs/anda-db/tree/main/rs/anda_kip): A Rust implementation of KIP for building sustainable AI knowledge memory systems.

**关于我们**：
- [ICPanda DAO](https://panda.fans/): ICPanda is a technical panda fully running on the [Internet Computer](https://internetcomputer.org/) blockchain, building chain-native infrastructures, Anda.AI and dMsg.net.
- [Anda.AI](https://anda.ai/): Create next-generation AI agents with persistent memory, decentralized trust, and swarm intelligence.
- GitHub: [LDC Labs](https://github.com/ldclabs/KIP)
- Follow Us on X: [ICPanda DAO](https://x.com/ICPandaDAO)

## 0. 前言

我们正处在一个由大型语言模型（*LLM*）驱动的认知革命的黎明。LLM 以其强大的自然语言理解、生成和推理能力，展现了通用人工智能（*AGI*）的曙光。然而，当前的 LLM 如同一个**才华横溢却健忘的天才**：它拥有惊人的即时推理能力，却缺乏稳定、可累积、可追溯的长期记忆。它能进行精彩的对话，但对话结束后，知识便随风消散；它可能产生令人信服的“幻觉”，却无法对其知识来源进行核查与验证。

这种“神经核心”与持久化、结构化知识之间的鸿沟，是阻碍 AI Agent 从“聪明的工具”迈向“真正的智能伙伴”的核心障碍。如何为这个强大的“神经核心”构建一个同样强大的、可信赖的、能够伴随其共同进化的“符号核心”？这正是我们必须回答的时代之问。

**KIP（Knowledge Interaction Protocol）正是为回答这一时代之问而生。**

它不仅是一套技术规范，更是一种设计哲学，一种全新的 AI 架构范式。KIP 的核心使命是构建一座坚实、高效的桥梁，连接 LLM 瞬时、流动的“工作记忆”与知识图谱持久、稳固的“长期记忆”。
KIP 将 AI 与知识库的交互范式，**从单向的“工具调用”，升维为双向的“认知共生”**：
- **神经核心**（LLM）提供实时推理能力
- **符号核心**（知识图谱）提供结构化记忆
- **KIP** 实现两者的协同进化

在本规范中，我们致力于实现三大核心目标：

1.  **赋予 AI 持久记忆（Persistent Memory）**：通过 KIP，AI Agent 能够将对话、观察和推理中获得的新知识，以结构化的“知识胶囊”形式，原子性地、可靠地固化到其知识图谱中。记忆不再是易失的，而是可沉淀、可复利的资产。

2.  **实现 AI 自我进化（Self-Evolution）**：学习与遗忘是智能的标志。KIP 提供了完整的知识操作语言（KML），使 Agent 能够根据新的证据，自主地更新、修正甚至删除过时的知识。这为构建能够持续学习、自我完善、适应环境变化的 AI 奠定了基础。

3.  **构建 AI 可信基石（Foundation of Trust）**：信任源于透明。KIP 的每一次交互都是一次明确的、可审计的“思维链”。当 AI 给出答案时，它不仅能说出“是什么”，更能通过其生成的 KIP 代码，清晰地展示“我是如何知道的”。这为构建负责任的、可解释的 AI 系统提供了不可或缺的底层支持。

本规范致力于为所有开发者、架构师和研究者，提供一套构建下一代智能体的开放、通用且强大的标准。我们相信，智能的未来，并非源于一个孤立的、无所不知的“黑箱”，而是源于一个懂得如何学习、如何与可信知识高效协作的开放系统。

欢迎您与我们一道，共同探索并完善 KIP，开启 AI 自我进化与可持续学习的新纪元。

## 1. 简介与设计哲学

**KIP（Knowledge Interaction Protocol）** 是一种专为大型语言模型 (LLM) 设计的知识交互协议。它通过一套标准化的指令集 (KQL/KML) 和数据结构，定义了神经核心 (LLM) 与符号核心 (知识图谱) 之间进行高效、可靠、双向知识交换的完整模式，旨在为 AI Agent 构建可持续学习、自我进化的长期记忆系统。

**设计原则：**

*   **模型友好（LLM-Friendly）**：语法结构清晰，对 LLM 的代码生成任务友好。
*   **声明式（Declarative）**：交互的发起者只需描述“意图”，无需关心“实现”。
*   **图原生（Graph-Native）**：为知识图谱的结构和查询模式进行了深度优化。
*   **可解释性（Explainable）**：KIP 代码本身就是 LLM 推理过程的透明记录，是可审计、可验证的“思维链”。
*   **全面性（Comprehensive）**：提供从数据查询到知识演化的完整生命周期管理能力，是 Agent 实现真正学习的基础。

## 2. 核心定义

### 2.1. 认知中枢（Cognitive Nexus）

一个由**概念节点**和**命题链接**构成的知识图谱，是 AI Agent 的长期记忆系统。

### 2.2. 概念节点（Concept Node）

*   **定义**：知识图谱中的**实体**或**抽象概念**，是知识的基本单元（如图中的“点”）。
*   **示例**：一个名为“阿司匹林”的`药物`节点，一个名为“头痛”的`症状`节点。
*   **构成**：
    *   `id`：String，唯一标识符，用于在图中唯一定位该节点。
    *   `type`：String，节点的类型，如 `Drug`、`Symptom` 等。
    *   `name`：String，节点的名称，如“阿司匹林”、“头痛”等。`type` + `name` 组合在图中也唯一定位一个节点。
    *   `attributes`：Object，节点的属性，描述该概念的内在特性，如 `molecular_formula`、`risk_level` 等。
    *   `metadata`：Object，节点的元数据，描述该概念的来源、可信度等信息，如 `source`、`confidence` 等。

### 2.3. 命题链接（Proposition Link）

*   **定义**：一个**实体化的命题（Proposition）**，它以 `(主语, 谓词, 宾语)` 的三元组形式，陈述了一个**事实（Fact）**。它在图中作为**链接（Link）**，将两个概念节点连接起来，或实现更高阶的连接（即高阶命题，Reification），其中主语或宾语本身就是另一个命题链接。
*   **示例**：一个陈述“（阿司匹林）- [用于治疗] ->（头痛）”这一事实的命题链接。
*   **构成**：
    *   `subject`：对象 ID，关系的发起者，可以是一个概念节点或另一个命题链接。
    *   `predicate`：String，定义了主语和宾语之间的**关系（Relation）**类型。
    *   `object`：对象 ID，关系的接受者，可以是一个概念节点或另一个命题链接。
    *   `attributes`：Object，命题的属性，描述该命题的内在特性。
    *   `metadata`：Object，命题的元数据，描述该命题的来源、可信度等信息，如 `source`、`confidence` 等。

### 2.4. 知识胶囊（Knowledge Capsule）

一种原子性的知识更新单元，是包含了一组**概念节点**和**命题链接**的知识合集，用于解决高质量知识的封装、分发和复用问题。

### 2.5. 认知引信（Cognitive Primer）

一个高度结构化、信息密度极高、专门为 LLM 设计的 JSON 对象，它包含了认知中枢的全局摘要和领域地图，帮助 LLM 快速理解和使用认知中枢。

### 2.6. 属性（Attributes）

*   **定义**：描述**概念**或**事实**内在特性的键值对，是构成知识记忆的一部分。
*   **示例**：
    *   **概念属性**：药物“阿司匹林”的 `molecular_formula` 是 "C9H8O4"。
    *   **命题属性**：“阿司匹林用于治疗头痛”这一事实的 `dosage`（剂量）是 "500mg"。

### 2.7. 元数据（Metadata）

*   **定义**：描述**知识来源、可信度和上下文**的键值对。它不改变知识本身的内容，而是描述关于这条知识的“知识”。元数据字段设计见附录 1。
*   **示例**：一个概念或命题的 `source`（来源）是 "《柳叶刀》2023年某论文"，其 `confidence`（可信度）是 `0.98`。

### 2.8. 值类型（Value Types）

KIP 采用 **JSON** 的数据模型，即 KIP 所有子句中使用的值，其类型和字面量表示方法遵循 JSON 标准。这确保了数据交换的无歧义性，并使得 LLM 极易生成和解析。

#### 2.8.1. 基本类型

*   **String (字符串)**：一个由双引号 `"` 包围的字符序列。
*   **Number (数字)**：一个整数或浮点数。
*   **Boolean (布尔值)**：逻辑值 `true` 或 `false`。
*   **Null (空值)**：代表“无”或“未定义”的特殊值 `null`。

#### 2.8.2. 复杂类型

*   **Array (数组)**：一个由方括号 `[]` 包围的、有序的值列表。数组元素可以是任何 KIP 支持的值类型。
*   **Object (对象)**：一个由花括号 `{}` 包围的、无序的键值对集合。键必须是字符串，值可以是任何 KIP 支持的值类型。

#### 2.8.3. 使用限制

虽然 `Array` 和 `Object` 类型可以作为属性或元数据的值存储，但 KQL 的 `FILTER` 子句**主要针对基本类型（String, Number, Boolean, Null）进行操作**。KIP 核心查询引擎不保证支持对数组元素或对象内部字段的直接索引和过滤（例如 `FILTER(?array[0] == "value")` 这样的语法是不支持的）。

### 2.9. 标志符（Identifier）

KIP 的标识符以字母或下划线开头，后跟字母、数字或下划线的任意组合。标志符用于变量名、属性名、元数据键等。

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
OFFSET M
```

### 3.2. `FIND` 子句

**功能**：声明查询的最终输出。

**语法**：`FIND( ... )`

*   **多变量返回**：可以指定一个或多个变量，如 `FIND(?drug, ?symptom)`。
*   **聚合返回**：可以使用聚合函数对变量进行计算，如 `FIND(?var1, ?agg_func(?var2))`。

    **聚合函数（Aggregation Functions）**：
    *   `COUNT(?var)`：计算 `?var` 被绑定的次数。`COUNT(DISTINCT ?var)` 计算不同绑定的数量。
    *   `SUM(?var)`, `AVG(?var)`, `MIN(?var)`, `MAX(?var)`：其它常见的数学聚合函数。

**示例**：

```prolog
// 返回概念节点对象
FIND(?drug)

// 返回多个变量
FIND(?drug_name, ?symptom_name)

// 返回一个变量和它的计数值
FIND(?drug_class, COUNT(?drug))
```

### 3.3. `WHERE` 子句

**功能**：包含一系列图模式匹配和过滤子句，所有子句之间默认为逻辑 **AND** 关系。

**语法**：`WHERE { ... }`

*   **概念节点子句**：`?node_var {type: "<type>", name: "<name>", id: "<id>"}`
*   **命题链接子句**：`?link_var (?subject, "<predicate>", ?object)`
*   **属性子句（`ATTR`）**：`ATTR(?node, "<attribute_name>", ?value_var)`
*   **元数据子句（`META`）**：`META(?node, "<metadata_key>", ?value_var)`
*   **过滤器子句（`FILTER`）**：`FILTER(boolean_expression)`
*   **否定子句（`NOT`）**：`NOT { ... }`
*   **可选子句（`OPTIONAL`）**：`OPTIONAL { ... }`
*   **合并子句（`UNION`）**：`UNION { ... }`

#### 3.3.1. 概念节点子句

**功能**：在知识图谱中根据 `type`、`name` 或 `id` 匹配概念节点，可绑定到变量。

**语法**：`?node_var {type: "<type>", name: "<name>", id: "<id>"}`

*   `?node_var` 是可选的，将匹配到的概念节点绑定到变量上，便于后续操作。
*   `type`、`name`、`id` 参数是可选的，但至少提供一个，并且 `id` 或者 `type` + `name` 组合必须唯一定位一个节点。

**示例**：

```prolog
// 将药物类型的节点绑定到 ?drug 变量
?drug {type: "Drug"}

// 将 "Aspirin" 节点绑定到 ?aspirin 变量
?aspirin {type: "Drug", name: "Aspirin"}

// 将指定 ID 的节点绑定到 ?headache 变量
?headache {id: "snomedct_25064002"}
```

#### 3.3.2. 命题链接子句

**功能**：在知识图谱中按 `(主语, 谓词, 宾语)` 模式匹配命题链接，可绑定到变量。

**语法**：`?link_var (?subject, "<predicate>", ?object)`

*   `?link_var` 是可选的，将匹配到的命题链接绑定到变量上，便于后续操作。
*   命题也可以作为主语或宾语，如 `?link_var (?subject, "predicate", (?drug, "treats", ?symptom))` 使用命题作为宾语，表示宾语必须匹配 `(?drug, "treats", ?symptom)` 的模式。
*   主语和宾语不仅可以是已绑定的变量，也可以是内联定义的概念节点子句，例如 `(?drug, "treats", {name: "Headache"})`，这种写法可以使查询更紧凑。
*   谓词部分支持路径操作符：
    *   `predicate{m,n}`：匹配 m 到 n 跳，如 `"follows"{1,5}`，`"follows"{1,}`，`"follows"{5}`。
    *   `predicate1 | predicate2`：匹配 `predicate1` 或 `predicate2`，如 `"follows" | "connects" | "links"`。

**示例**：

```prolog
// 找到所有能治疗头痛的药物
(?drug, "treats", ?headache)

// 将所有 "treats" 命题绑定到变量 ?treatment_link
?treatment_link (?drug, "treats", ?headache)
```

```prolog
// 查找一个概念的 5 层以内的父概念
(?concept, "is_subclass_of{0,5}", ?parent_concept)
```

#### 3.3.3. 属性子句（`ATTR`）

**功能**：获取一个**概念节点**或一个**命题链接**的内在属性值，并将其绑定到变量。

**语法**：`ATTR(?target_variable, "<attribute_name>", ?value_variable)`

**示例**：

```prolog
// 获取 ?drug 节点的 "name" 属性值，绑定到 ?drug_name 变量
ATTR(?drug, "name", ?drug_name)

// 获取 ?treatment_link 命题的 "dosage" 属性值，绑定到 ?dosage 变量
ATTR(?treatment_link, "dosage", ?dosage)
```

#### 3.3.4. 元数据子句（`META`）

**功能**：获取一个**概念节点**或一个**命题链接**的元数据，并将其绑定到变量。

**语法**：`META(?target_variable, "<metadata_key>", ?value_variable)`

**示例**：

```prolog
// 获取 ?treatment_link 命题的元数据的 confidence 值，绑定到 ?conf 变量
META(?treatment_link, "confidence", ?conf)
```

#### 3.3.5. 过滤器子句（`FILTER`）

**功能**：对已绑定的变量（通常是 `ATTR` 或 `META` 获取的值）应用更复杂的过滤条件。

**语法**：`FILTER(boolean_expression)`

**过滤器函数与运算符（Filter Functions & Operators）**：

*   **比较运算符**：`==`, `!=`, `<`, `>`, `<=`, `>=`
*   **逻辑运算符**：`&&`（AND）, `||`（OR）, `!`（NOT）
*   **字符串函数**：`CONTAINS(?str, "sub")`, `STARTS_WITH(?str, "prefix")`, `ENDS_WITH(?str, "suffix")`, `REGEX(?str, "pattern")`

**示例**：
```prolog
// 筛选出风险等级小于 3 的药物
ATTR(?drug, "risk_level", ?risk)
FILTER(?risk < 3)

// 筛选出名称包含 "acid" 的药物
ATTR(?drug, "name", ?drug_name)
FILTER(CONTAINS(?drug_name, "acid"))
```

```prolog
// 查找所有置信度高于 0.9 的 "treats" 关系
FIND(?drug_name, ?symptom_name)
WHERE {
  ?drug {type: "Drug"}
  ?symptom {type: "Symptom"}

  // 将 "treats" 命题绑定到变量 ?treatment_link
  ?treatment_link (?drug, "treats", ?symptom)
  // 使用 META 子句获取 ?treatment_link 的元数据
  META(?treatment_link, "confidence", ?conf)
  FILTER(?conf > 0.9)

  ATTR(?drug, "name", ?drug_name)
  ATTR(?symptom, "name", ?symptom_name)
}
```

#### 3.3.6. 否定子句（`NOT`）

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

#### 3.3.7. 可选子句（`OPTIONAL`）

**功能**：尝试匹配一个可选的模式。如果模式匹配成功，则其内部变量被绑定；如果失败，查询继续，但内部变量为未绑定状态。这类似于 SQL 的 `LEFT JOIN`。

**语法**：`OPTIONAL { ... }`

**示例**：

```prolog
// 查找所有药物，并（如果存在的话）一并找出它们的副作用
?drug {type: "Drug"}

OPTIONAL {
  (?drug, "has_side_effect", ?side_effect)
  ATTR(?side_effect, "name", ?side_effect_name)
}
```

#### 3.3.8. 合并子句（`UNION`）

**功能**：合并子句的结果，实现逻辑 **OR**。注意，`where` 块所有子句之间默认为逻辑 **AND** 关系。

**语法**：`UNION { ... }`

**示例**：

```prolog
// 找到能治疗“头痛”或“发烧”的药物

(?drug, "treats", {name: "Headache"})

UNION {
  (?drug, "treats", {name: "Fever"})
}
```

### 3.4. 结果修饰子句（Solution Modifiers）

这些子句在 `WHERE` 逻辑执行完毕后，对产生的结果集进行后处理。

*   **`ORDER BY ?var [ASC|DESC]`**：
    根据指定变量对结果进行排序，默认为 `ASC`（升序）。
*   **`LIMIT N`**：
    限制返回结果的数量为 N。
*   **`OFFSET M`**：
    跳过前 M 条结果，通常与 `LIMIT` 联用实现分页。

### 3.5. 综合查询示例

**示例 1**：带过滤和排序的高级查询

**意图**："找到所有能治疗‘头痛’的非 NSAID 类药物，要求其风险等级低于4，并按风险等级从低到高排序，返回药物名称和风险等级。"

```prolog
FIND(?drug_name, ?risk)
WHERE {
  ?drug {type: "Drug"}
  ?headache {name: "Headache"}

  (?drug, "treats", ?headache)

  NOT {
    (?drug, "is_class_of", {name: "NSAID"})
  }

  ATTR(?drug, "name", ?drug_name)
  ATTR(?drug, "risk_level", ?risk)
  FILTER(?risk < 4)
}
ORDER BY ?risk ASC
LIMIT 20
```

**示例 2**：使用聚合分析查询

**意图**："按药物类别，列出该类别下所有药物的名称。"

```prolog
FIND(?class_name, COUNT(?drug_name))
WHERE {
  ?class {type: "DrugClass"}
  ATTR(?class, "name", ?class_name)

  ?drug {type: "Drug"}
  (?drug, "is_class_of", ?class)
  ATTR(?drug, "name", ?drug_name)
}
ORDER BY ?class_name
```

**示例 3**：使用 `OPTIONAL` 处理缺失信息

**意图**："列出所有 NSAID 类的药物，并（如果存在的话）显示它们各自的已知副作用。"

```prolog
FIND(?drug_name, ?side_effect_name)
WHERE {
  (?drug, "is_class_of", {name: "NSAID"})

  ATTR(?drug, "name", ?drug_name)

  OPTIONAL {
    (?drug, "has_side_effect", ?side_effect)
    ATTR(?side_effect, "name", ?side_effect_name)
  }
}
```
*   **注意**：对于没有副作用的药物，`?side_effect_name` 的值将为空，但药物本身 `?drug_name` 依然会出现在结果中。

**示例 4**：使用命题作为宾语

**意图**："找到一篇由‘张三’陈述的、关于‘一篇论文引用了一个证据’的断言。"

```prolog
FIND(?paper_doi, ?drug_name)
WHERE {
  ?paper { type: "Paper" }
  (
    {type: "User", name: "张三"},
    "stated",
    (?paper, "cites_as_evidence", (?drug, "treats", ?symptom))
  )

  // 后续操作
  ATTR(?paper, "doi", ?paper_doi)
  ATTR(?drug, "name", ?drug_name)
  ...
}
```

## 4. KIP-KML 指令集：知识操作语言

KML 是 KIP 中负责知识演化的部分，是 Agent 实现学习的核心工具。

### 4.1. `UPSERT` 语句

**功能**：**原子性地**创建或更新知识，是承载“**知识胶囊（Knowledge Capsule）**”的主要方式。
`UPSERT` 操作需保证**幂等性 (Idempotent)**，即重复执行同一条指令，其结果与执行一次完全相同，不会产生重复数据或意外的副作用。

**语法**：

```prolog
UPSERT {
  CONCEPT ?local_handle {
    {type: "<type>", name: "<name>", id: "<id>"}
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
    (?subject, "<predicate>", ?object)
    SET ATTRIBUTES { <key>: <value>, ... }
  }
  WITH METADATA { <key>: <value>, ... }

  CONCEPT ?local_handle_2 {
    {type: "<type>", name: "<name>", id: "<id>"}
    SET PROPOSITIONS {
      ("<predicate>", ?local_prop)
    }
  }
  ...
}
WITH METADATA { <key>: <value>, ... }
```

**关键组件**：

*   **`UPSERT` 块**： 整个操作的容器，保证内部所有操作的原子性。
*   **`CONCEPT` 块**：定义一个概念节点。
    *   `?local_handle`：以 `?` 开头的本地句柄（或称锚点），用于在事务内引用此新概念，它只在本次 `UPSERT` 块事务中有效。
    *   `{type: "<type>", name: "<name>", id: "<id>"}`：概念子句，`id` 或者 `type` + `name` 的组合，定义唯一概念节点，若匹配到已有节点则更新。如果期望不存在则创建，应该使用 `type` + `name` 定义子句，如 `{type: "Drug", name: "Aspirin"}`。
    *   `SET ATTRIBUTES { ... }`：设置或更新节点的属性。
    *   `SET PROPOSITIONS { ... }`：定义或更新该概念节点发起的命题链接。SET PROPOSITIONS 的行为是增量式的。对于每一个定义的 PROPOSITION，如果命题已存在，则更新其元数据（如果有）；不存在则创建该新命题。注意，此子句用于快速建立关系并附加元数据。如果一个命题本身需要携带复杂的内在属性，建议使用独立的 `PROPOSITION` 块来定义它，并通过本地句柄 `?handle` 进行引用。
        *   `("<predicate>", ?local_handle)`：链接到本次胶囊中定义的另一个概念或命题。
        *   `("<predicate>", {type: "<type>", name: "<name>"})`，`("<predicate>", {id: "<id>"})`：链接到图中已存在的概念，不存在则忽略。
        *   `("<predicate>", (?subject, "<predicate>", ?object))`：链接到图中已存在的命题，不存在则忽略。
*   **`PROPOSITION` 块**：定义一个独立的命题链接，通常用于在胶囊内创建复杂的关系。
    *   `?local_prop`：本地句柄，用于引用此命题链接。
    *   `(<subject>, "<predicate>", <object>)`：定义一个命题链接，主语和宾语可以是现有概念或其它命题链接。
    *   `SET ATTRIBUTES { ... }`：一个简单的键值对列表，用于设置或更新命题链接的属性。
*   **`WITH METADATA` 块**： 追加在 `CONCEPT`，`PROPOSITION` 或 `UPSERT` 块的元数据。

**示例**：

假设我们有一个知识胶囊，用于定义一种新的、假设存在的益智药 "Cognizine"。这个胶囊包含：
*   药物本身的概念和属性。
*   它能治疗“脑雾（Brain Fog）”。
*   它属于“益智药（Nootropic）”类别（这是一个已存在的类别）。
*   它有一个新发现的副作用：“神经绽放（Neural Bloom）”（这也是一个新的概念）。

**知识胶囊 `cognizine_capsule.kip` 的内容：**

```prolog
// Knowledge Capsule: cognizin.v1.0
// Description: Defines the novel nootropic drug "Cognizine" and its effects.

UPSERT {
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
      ("has_side_effect", ?neural_bloom) WITH METADATA {
        // This specific proposition has its own metadata
        confidence: 0.75,
        source: "Preliminary Clinical Trial NCT012345"
      }
    }
  }

  // Define the new side effect concept: Neural Bloom
  CONCEPT ?neural_bloom {
    { type: "Symptom", name: "Neural Bloom" }
    SET ATTRIBUTES {
      description: "A rare side effect characterized by a temporary burst of creative thoughts."
    }
    // This concept has no outgoing propositions in this capsule
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

**功能**：批量删除 `WHERE` 匹配的概念节点或命题链接的多个属性。

**语法**：`DELETE ATTRIBUTES { "attribute_name", ... } WHERE { ... }`

*   **`{ "attribute_name", ... }`**：一个包含要删除的属性名称的集合﹙Set﹚。
*   **`WHERE { ... }`**：要删除属性的概念节点或命题链接的匹配条件。

**示例**：

```prolog
// 从 "Aspirin" 节点中删除 "risk_category" 属性
DELETE ATTRIBUTES { "risk_category" }
WHERE {
  { type: "Drug", name: "Aspirin" }
}
```

```prolog
// 从所有药物节点中删除 "risk_category" 属性
DELETE ATTRIBUTES { "risk_category" }
WHERE {
  { type: "Drug" }
}
```

```prolog
// 从所有命题链接中删除 "category" 属性
DELETE ATTRIBUTES { "category" }
WHERE {
  (?s, ?p, ?o)
}
```

#### 4.2.2. 删除命题（`DELETE PROPOSITIONS`）

**功能**：批量删除 `WHERE` 匹配的命题链接。

**语法**：`DELETE PROPOSITIONS WHERE { ... }`

**示例**：

```prolog
// 删除特定不可信来源的所有命题
DELETE PROPOSITIONS
WHERE {
  ?all_links (?s, ?p, ?o)
  META(?all_links, "source", ?source)
  FILTER(?source == "untrusted_source_v1")
}
```

#### 4.2.3. 删除概念（`DELETE CONCEPT`）

**功能**：彻底删除一个概念节点及其附带的所有（入度和出度）命题链接。

**语法**：`DELETE CONCEPT {type: "<type>", name: "<name>", id: "<id>"} DETACH`

*   `{type: "<type>", name: "<name>", id: "<id>"}` 描述要删除的概念节点，应该提供 `type` + `name` 或者唯一的 `id`，没有匹配到唯一节点则忽略。
*   必须使用 `DETACH` 关键字。这是一种安全机制，强制 LLM 确认其意图——即同时删除概念和与之相关的所有关系，避免产生孤立的关系。

**示例**：

```prolog
// 删除 "OutdatedDrug" 这个概念及其所有关系
DELETE CONCEPT
{ type: "Drug", name: "OutdatedDrug" }
DETACH
```

## 5. KIP-META 指令集：知识探索与接地

META 是 KIP 的一个轻量级子集，专注于“自省”（Introspection）和“消歧”（Disambiguation）。它们是快速、元数据驱动的命令，不涉及复杂的图遍历。

### 5.1. `DESCRIBE` 语句

**功能**：`DESCRIBE` 命令用于查询认知中枢的“模式”（Schema）信息，帮助 LLM 理解认知中枢中“有什么”。

**语法**：`DESCRIBE [TARGET] <options>`

#### 5.1.1. 点燃认知引擎（`DESCRIBE PRIMER`）

**功能**：获取“认知引信（Cognitive Primer）”，用于引导 LLM 如何高效地利用认知中枢。

认知引信包含 2 部分内容：
1.  **全局摘要层（Universal Abstract）** - “我是谁？”
    这是最高度的概括，定义了 AI Agent 的核心身份、能力边界和基本原则。内容包括：

    *   Agent 的角色和目标（例如：“我是一个专业的医学知识助手，旨在提供准确、可追溯的医学信息”）。
    *   认知中枢 的存在和作用（“我的记忆和知识存储在认知中枢中，我可以通过 KIP 调用查询它”）。
    *   核心能力摘要（“我能够进行疾病诊断、药品查询、解读检查报告...”）。
2.  **领域地图层（Domain Map）** - “我知道些什么？”
    这是“认知引信”的核心。它不是知识的罗列，而是认知中枢的**拓扑结构摘要**。内容包括：

    *   **主要知识域（Domains）**：列出知识库中的顶层领域。
    *   **关键概念（Key Concepts）**：在每个领域下，列出最重要或最常被查询的**概念节点**。
    *   **关键命题（Key Propositions）**：列出最重要或最常被查询的**命题链接**中的谓词。

**语法**：`DESCRIBE PRIMER`

#### 5.1.2. 列出所有存在的认知领域（`DESCRIBE DOMAINS`）

**功能**：列出所有可用的认知领域，用于引导 LLM 如何高效接地。

**语法**：`DESCRIBE DOMAINS`

#### 5.1.3. 列出所有存在的概念节点类型（`DESCRIBE CONCEPT TYPES`）

**功能**：列出所有存在的概念节点类型，用于引导 LLM 如何高效接地。

**语法**：`DESCRIBE CONCEPT TYPES`

#### 5.1.4. 描述一个特定节点类型（`DESCRIBE CONCEPT TYPE "<type_name>"`）

**功能**：描述一个特定节点类型的详细信息，包括其拥有的属性和常见关系。

**语法**：`DESCRIBE CONCEPT TYPE "<type_name>"`

**示例**：

```prolog
DESCRIBE CONCEPT TYPE "Drug"
```

#### 5.1.5. 列出所有命题链接类型（`DESCRIBE PROPOSITION TYPES`）

**功能**：列出所有命题链接的谓词，用于引导 LLM 如何高效接地。

**语法**：`DESCRIBE PROPOSITION TYPES`

#### 5.1.6. 描述一个特定命题链接类型的详细信息 (`DESCRIBE PROPOSITION TYPE "<predicate>"`)

**功能**：描述一个特定命题链接谓词的详细信息，包括其主语和宾语的常见类型（定义域和值域）。

**语法**：`DESCRIBE PROPOSITION TYPE "<predicate>"`

### 5.2. `SEARCH` 语句

**功能**：`SEARCH` 命令用于将自然语言术语链接到知识图谱中明确的实体。它专注于高效的、文本索引驱动的查找，而非完整的图模式匹配。

**语法**：`SEARCH [CONCEPT|PROPOSITION] "<search_term>" <options>`。选项 (`<options>`)：
*   `WITH TYPE "<type_name>"`：将搜索范围限制在某个节点类型内。
*   `LIMIT N`：限制返回结果数量，默认为 10。

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
```js
{
  "id": "call_abc123",
  "type": "function",
  "function": {
    "name": "execute_kip",
    "arguments": JSON.stringify({
      "command": `
        FIND(?drug_name)
        WHERE {
          ?symptom {name: $symptom_name}
          (?drug, "treats", ?symptom)
          ATTR(?drug, "name", ?drug_name)
        }
        LIMIT $limit
      `,
      "parameters": {
        "symptom_name": "Headache",
        "limit": 10
      }
    })
  }
}
```

**`execute_kip` 函数参数详解**：

| 参数名           | 类型    | 是否必须 | 描述                                                                                                                                                                                            |
| :--------------- | :------ | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`command`**    | String  | 是       | 包含完整、未经修改的 KIP 命令文本。使用多行字符串以保持格式和可读性。                                                                                                                           |
| **`parameters`** | Object  | 否       | 一个可选的键值对对象，用于传递命令文本之外的执行上下文参数。命令文本中的占位符（如$symptom_name）会在执行前被 `parameters` 对象中对应的值安全地替换。这有助于防止注入攻击，并使命令模板可复用。 |
| **`dry_run`**    | Boolean | 否       | 如果为 `true`，则仅验证命令的语法和逻辑，不执行或持久化任何变更。                                                                                                                               |

### 6.2. 响应结构（Response Structure）

**认知中枢的所有响应都是一个 JSON 对象，结构如下：**

| 键           | 类型   | 是否必须 | 描述                                                                          |
| :----------- | :----- | :------- | :---------------------------------------------------------------------------- |
| **`result`** | Object | 否       | 当请求成功时**必须**存在，包含请求的成功结果，其内部结构由 KIP 请求命令定义。 |
| **`error`**  | Object | 否       | 当请求失败时**必须**存在，包含结构化的错误详情。                              |

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

1.  **意图分解（Deconstruct Intent）**：
    LLM 将用户的模糊请求分解为一系列清晰的逻辑目标：是查询信息，还是更新知识，或是二者的组合。

2.  **探索与接地（Explore & Ground）**：
    LLM 通过生成一系列 KIP-META 命令与认知中枢对话，以澄清歧义和获取构建最终查询所需的确切“坐标”。

3.  **代码生成（Generate Code）**：
    LLM 使用从 META 交互中获得的**精确 ID、类型和属性名**，生成一个高质量的 KQL 或 KML 查询。

4.  **执行与响应（Execute & Respond）**：
    生成的代码被发送到认知中枢的推理引擎执行，推理引擎返回结构化的数据结果或操作成功的状态。

5.  **知识固化（Solidify Knowledge）**：
    如果在交互中产生了新的、可信的知识（例如，用户确认了一个新的事实），LLM 应该履行“学习”的职责：
    *   生成一个封装了新知识的 `UPSERT` 语句。
    *   执行该语句，将新知识永久固化到认知中枢，完成学习闭环。

6.  **结果综合（Synthesize Results）**：
    LLM 将从符号核心收到的结构化数据或操作回执，翻译成流畅、人性化且**可解释**的自然语言。建议 LLM 向用户解释自己的推理过程（即 KIP 代码所代表的逻辑），从而建立信任。

## 附录 1. 元数据字段设计

精心设计的元数据是构建一个能够自我进化、可追溯、可审计的记忆系统的关键。除了基础的 `source` 和 `confidence`，我们还推荐以下**溯源与可信度（Provenance & Trustworthiness）**、**时效性与生命周期（Temporality & Lifecycle）**、**上下文与审核（Context & Auditing）**这三个类别的元数据字段，它们共同构成了一个强大的记忆管理框架。

### 1.1. 溯源与可信度 (Provenance & Trustworthiness)

这类元数据回答了“**这条知识从哪来？我们应该多信任它？**”

*   **`source` (来源)** - **（核心）**
    *   **类型**: `String` 或 `Array<String>`。
    *   **描述**: 记录知识的直接来源。这应该是尽可能具体和可追溯的标识符。
    *   **示例**: `"PMID:31536137"`, `"https://en.wikipedia.org/wiki/Aspirin"`, `"UserInteraction:session_xyz123"`, `"KnowledgeCapsule:nootropics_v1.2"`。如果是从多个来源融合的，可以使用数组。

*   **`confidence` (可信度)** - **（核心）**
    *   **类型**: `Number` (通常在 0.0 到 1.0 之间)。
    *   **描述**: 对这条知识断言为真的信心分数。这个值可以由多种因素计算得出，如来源的权威性、多来源的佐证、用户的反馈等。
    *   **示例**: `0.95`。

*   **`evidence` (证据)**
    *   **类型**: `Array<String>`。
    *   **描述**: 指向支持该知识断言的具体证据的链接或引用。`source` 可能是知识的“容器”（如一篇论文），而 `evidence` 则是容器内的具体“内容”（如图表、句子）。
    *   **示例**: `["Table 2 in PMID:31536137", "Quote: 'Aspirin significantly reduced risk...'"]`。

### 1.2. 时效性与生命周期 (Temporality & Lifecycle)

这类元数据回答了“**这条知识何时有效？它现在还适用吗？**”

*   **`created_at` (创建时间)**
    *   **类型**: `String` (ISO 8601 格式)。
    *   **描述**: 这条知识记录被首次添加到认知中枢的时间戳。对于追踪记忆的演化至关重要。
    *   **示例**: `"2023-10-27T10:00:00Z"`。

*   **`last_updated_at` (最后更新时间)**
    *   **类型**: `String` (ISO 8601 格式)。
    *   **描述**: 这条知识记录（包括其属性或元数据）最后一次被修改的时间戳。
    *   **示例**: `"2024-05-21T15:30:00Z"`。

*   **`valid_from` (生效时间)**
    *   **类型**: `String` (ISO 8601 格式)。
    *   **描述**: 知识断言开始有效的日期。对于描述合同、历史事件、政策等有时效性的事实非常有用。
    *   **示例**: 对于一份2025年生效的合同，其 `valid_from` 为 `"2025-01-01T00:00:00Z"`。

*   **`valid_until` (失效时间)**
    *   **类型**: `String` (ISO 8601 格式)。
    *   **描述**: 知识断言失效或过期的日期。
    *   **示例**: 优惠券的有效期截止 `valid_until` 为 `"2024-12-31T23:59:59Z"`。

*   **`status` (状态)**
    *   **类型**: `String`。
    *   **描述**: 知识的生命周期状态。这比直接删除知识更有用，因为它保留了历史记录。
    *   **枚举值建议**: `"active"` (活动的), `"deprecated"` (不推荐使用), `"retracted"` (已撤回/证伪), `"pending_review"` (待审核)。
    *   **示例**: `"active"`。

### 1.3. 上下文与审核 (Context & Auditing)

这类元数据回答了“**这条知识是如何产生的？谁对它负责？**”

*   **`relevance_tags` (相关标签)**
    *   **类型**: `Array<String>`。
    *   **描述**: 用于标记这条知识的主题或领域等，便于快速分类和检索。
    *   **示例**: `["cardiology", "stroke prevention", "high-risk patients"]`。

*   **`author` (作者/创建者)**
    *   **类型**: `String`。
    *   **描述**: 创建这条知识记录的实体。这可以是 AI Agent 自身、特定的用户、或者一个自动化的数据导入管道。
    *   **示例**: `"Agent:self_learning"`, `"User:john_doe"`。

*   **`access_level` (访问级别)**
    *   **类型**: `String`。
    *   **描述**: 定义了谁可以访问或使用这条知识。对于构建多租户或有隐私要求的系统至关重要。
    *   **枚举值建议**: `"public"`, `"private"`, `"internal"`。
    *   **示例**: `"public"`。

*   **`review_info` (审核信息)**
    *   **类型**: `Object`
    *   **描述**: 一个包含审核历史和状态的结构化对象。
    *   **示例**:
        ```json
        {
          "last_reviewed_by": "Expert:dr_jane_smith",
          "last_reviewed_at": "2024-01-15T09:00:00Z",
          "review_notes": "Confirmed with latest clinical trials."
        }
        ```

**元数据字段综合示例**：

```prolog
// Aspirin 以 100mg 的剂量用于预防高危成年人的中风。
UPSERT {
  PROPOSITION ?prevention_link {
    (
      { type: "Drug", name: "Aspirin" },
      "prevents",
      { type: "Condition", name: "Stroke" }
    )
    // 事实的内在属性
    SET ATTRIBUTES {
      dosage: "100mg",
      patient_group: "high-risk adults"
    }
  }
  // 关于这个事实的元数据
  WITH METADATA {
    source: "Clinical Guideline XYZ-2023",
    confidence: 0.98,
    evidence: ["Section 3.1, Guideline XYZ-2023"],
    created_at: "2023-11-10T14:20:10Z",
    last_updated_at: "2023-11-10T14:20:10Z",
    valid_from: "2023-01-01T00:00:00Z",
    status: "active",
    author: "DataPipeline:guideline_importer",
    access_level: "public",
    review_info: {
      "last_reviewed_by": "Expert:dr_smith",
      "last_reviewed_at": "2024-02-20T11:00:00Z"
    }
  }
}
```