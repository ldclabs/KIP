# KIP 2.0 认知查询语言设计 (KQL)

**[English](./KIP-2.0-KQL.md) | [中文](./KIP-2.0-KQL_CN.md)**

## 规范状态 (Status)

**查询语言提案 / 规范预草案 (Query Language Proposal / Pre-Specification Draft)**

本文档定义了 KIP 2.0 的读取/查询语义：智能体（Agent）如何检索原始认知状态、遍历语义与溯源结构、请求认识论信念投影、查询历史认知快照、过滤与聚合可见状态，并接收可复现的治理结果。

本文档直接建立在以下规范基础之上：

- [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)
- [KIP-2.0-Transactions.md](KIP-2.0-Transactions.md)
- [KIP-2.0-Capsule.md](KIP-2.0-Capsule.md)

KIP 1.x 已经建立了一套面向大语言模型友好（LLM-friendly）的声明式查询语言，围绕以下特性构建：

```text
FIND
WHERE
Concept patterns
Proposition patterns
FILTER
NOT
OPTIONAL
UNION
predicate variables
path operators
aggregation
ORDER BY
LIMIT
CURSOR
```

只要底层语义依然有效，KIP 2.0 就会保留这些成功的表层语法。

最核心的变革在于 KIP 2.0 不再将：

```text
Proposition exists （命题存在）
```

等同于：

```text
Proposition is believed / true. （命题被采信 / 为真）
```

因此，KQL 2.0 提供了两种根本不同的读取原语：

```text
RAW COGNITIVE QUERY (原始认知查询)
    在可见的中枢状态中存在哪些认知记录？

EPISTEMIC QUERY (认识论查询)
    在给定的策略/上下文/证据下，大脑当前应当将什么视为
    已接受 (accepted)、已拒绝 (rejected)、存疑/争议 (contested)、不确定 (uncertain) 或不足 (insufficient)？
```

以及第三个正交维度：

```text
HISTORICAL QUERY (历史查询)
    在特定的认知时间点存在怎样的认知状态？
```

其核心原则是：

> **KQL 必须允许智能体检查大脑中存储的内容，而不会意外将存储的陈述转化为信念；并且在检查大脑所采信的信念时，不会掩盖使该信念具备上下文依赖性的证据、策略、时间与不确定性。**

---
# 0. 规范性用词定义 (Normative Language)

关键字 **MUST**（必须）、**MUST NOT**（严禁）、**REQUIRED**（必需）、**SHOULD**（应当）、**SHOULD NOT**（不应）、**MAY**（可以）和 **OPTIONAL**（可选）用于指示 KIP 2.0 规范 (`../KIP-2.0-SPECIFICATION.md`) 的要求；两者不一致时以该规范为准。

此处展示的语法属于架构级别的语法提案。

后续的正式语法规范可能会精化标点符号，但不会改变其中的语义区别。

---
# 1. 设计目标 (Design Goals)

KQL 2.0 应当 (SHOULD) 保持：

```text
Model-First (模型优先)
declarative (声明式)
graph-native (图原生)
compact (紧凑精炼)
schema-aware (模式感知)
governed (受治理约束)
epistemically explicit (认识论显式化)
historically reproducible (历史可复现)
pagination-safe (分页安全)
implementation-independent (实现无关)
```

大语言模型（LLM）在阅读一份简明入门指南（Primer）后，就应当能够生成常见的查询。

---
# 2. 非目标 (Non-Goals)

KQL 不是：

```text
通用编程语言
过程式推理语言
SQL 的替代品
SPARQL 的替代品
定理证明器
通用概率逻辑
隐藏的思维链查询
治理变更语言
模式变更语言
搜索引擎查询语言
```

KQL 描述的是**请求获取哪些认知信息**。

认知中枢（Nexus）决定如何执行该查询。

---
# 3. 三大查询维度 (The Three Query Dimensions)

KQL 查询必须在概念上保持三个维度的清晰分离。

## 3.1 认知状态 (Cognitive State)

```text
存储了哪些记录？
```

示例：

```text
Concept (概念)
Proposition (命题)
Assertion (断言)
Evidence (证据)
Activity (活动)
Experience (经验)
Skill (技能)
```

---

## 3.2 认识论投影 (Epistemic Projection)

```text
在此策略/上下文下应当采信什么？
```

输出状态：

```text
accepted (已接受)
rejected (已拒绝)
contested (存疑/争议)
uncertain (不确定)
insufficient (不足)
```

---

## 3.3 认知时间 (Cognitive Time)

```text
我们正在读取哪一个历史中枢状态？
```

通过以下方式指定：

```text
current state (当前状态)
AS OF SEQ
AS OF TX
AS OF TIME
```

---
# 4. 现实世界时间是第四个独立时钟 (World Time Is a Fourth Independent Clock)

认识论投影还会进一步询问：

```text
我们所询问的是哪个现实世界/有效时间（valid time）？
```

因此：

```text
认知 AS OF 时间
    ≠
现实世界有效时间
```

示例：

```text
我在 3 月 1 日时，
对系统在 3 月 1 日的状态持有怎样的信念？
```

不同于：

```text
我现在，
对系统在 3 月 1 日的状态持有怎样的信念？
```

KQL 必须能够同时表达这两者。

---
# 5. 核心查询方程 (Core Query Equation)

在概念上：

```text
KQL Result =
    Evaluate(
      Query,
      Visible Cognitive State,
      Schema Context,
      Optional Epistemic Projection,
      Optional Historical Snapshot
    )
```

在当前治理授权（Governance authorization）约束下进行求值。

---
# 6. 查询骨架 (Query Skeleton)

推荐的原生 KQL 2.0 查询结构形式：

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
LIMIT N
CURSOR "<token>"
```

结构化查询仅必需 `FIND` 和 `WHERE` 子句。

其他子句均为可选，且仅在适用场景下具有实际意义。

---
# 7. 最小查询 (Minimal Query)

```prolog
FIND(?person)
WHERE {
  ?person {type: "Person"}
}
LIMIT 20
```

这有意保持了与 KIP 1.x 的高度贴近。

---
# 8. 原生 KQL 默认视图是原始认知状态 (Native KQL Default View Is Raw Cognitive State)

这是 KIP 2.0 的一项核心规则。

一个朴素的命题模式：

```prolog
?p (?alice, "timezone", ?tz)
```

其含义是：

> 存在一个具有该语义元组的可见规范命题（canonical Proposition）。

它**并不**意味着：

> 大脑采信该时区为真。

---
# 9. 原始命题的存在性是中立真实的 (Raw Proposition Existence Is Truth-Neutral)

因此：

```text
匹配到的命题 (matched Proposition)
    ≠
被接受的信念 (accepted belief)
```

原始查询返回的命题可能处于以下状态：

```text
supported (受支持的)
rejected (被拒绝的)
contested (存争议的)
historical (历史的)
hypothetical (假设性的)
unasserted (未被断言的)
```

具体取决于它们所关联的断言（Assertions）。

---
# 10. 为什么原始状态必须是原生默认视图 (Why Raw Must Be the Native Default)

如果原始命题模式默认隐式代表“被接受的信念”：

```text
audit (审计)
contradiction inspection (矛盾检查)
Evidence tracing (证据追踪)
historical analysis (历史分析)
import review (导入审查)
```

都将变得极其困难或产生误导。

原生 v2 在查询语言中使这一区别显式可见。

---
# 11. KIP 1 兼容性可提供投影命题视图 (KIP 1 Compatibility May Provide a Projected Proposition View)

`kip-1-compat` 执行配置规范可以 (MAY) 将传统的 Fact 风格读取解释为采用已接受的认识论投影。

这是兼容性行为。

它严禁 (MUST NOT) 重新定义原生 KQL 2.0 的核心语义。

---
# 12. 核心模式族 (Core Pattern Families)

KQL 2.0 拥有以下基线模式族：

```text
Concept Pattern (概念模式)
Proposition Pattern (命题模式)
Assertion Pattern (断言模式)
Evidence Pattern (证据模式)
Activity Pattern (活动模式)
Structural Reference Pattern (结构引用模式)
Belief Pattern (信念模式)
Belief Slot Pattern (信念槽模式)
```

---
# 13. 概念模式 (Concept Pattern)

推荐的显式形式：

```prolog
?person CONCEPT {
  type: "Person",
  name: "Alice"
}
```

模型友好的兼容简写形式：

```prolog
?person {
  type: "Person",
  name: "Alice"
}
```

简写形式仍是推荐的通用写法。

---
# 14. 概念的 `type` 是模式语法糖 (Concept `type` Is Schema Sugar)

在原生 v2 中：

```text
type: "Person"
```

并不是持久化的全局通用唯一标识字段。

它是面向模型的简写形式，通过查询的模式环境（Schema Environment）解析为精确的：

```text
schema_ref
```

---
# 15. 精确概念类型匹配 (Exact Concept Type Match)

查询可以使用精确的引用：

```prolog
?person {
  type: "kip://profiles/cognitive-memory@2.0.0/Person"
}
```

在审计/互操作场景中，优先推荐使用精确引用。

---
# 16. 概念匹配字段 (Concept Match Fields)

推荐的可匹配字段包括：

```text
id
schema_ref
type          用于模式解析的别名
key
name
canonical_id
aliases
attributes
facets
retention
_system       受治理控制
```

`governance` 仅在策略允许时部分可见。

---
# 17. 概念的 `name` 是接地表征而非唯一标识 (Concept `name` Is Grounding, Not Identity)

```prolog
?person {type: "Person", name: "Alice"}
```

可能会匹配到多个可见的概念。

KQL 在原生 v2 中绝不得假定 `(type, name)` 具有全局唯一性。

---
# 18. 接地后使用 ID (Use ID After Grounding)

推荐的智能体工作流：

```text
SEARCH / DESCRIBE (搜索 / 描述)
    ↓
resolve entity (解析实体)
    ↓
query by immutable local id or canonical identity (通过不可变本地 ID 或规范标识进行查询)
```

---
# 19. 命题模式 (Proposition Pattern)

显式形式：

```prolog
?p PROPOSITION (?subject, "works_for", ?organization)
```

兼容简写形式：

```prolog
?p (?subject, "works_for", ?organization)
```

---
# 20. 命题变量是可选的 (Proposition Variable Is Optional)

```prolog
(?subject, "works_for", ?organization)
```

无需绑定命题自身即可进行匹配。

---
# 21. 谓词常量解析 (Predicate Constant Resolution)

谓词常量可以是：

```text
本地别名 (local alias)
限定别名 (qualified alias)
精确模式符号引用 (exact Schema Symbol Ref)
```

示例：

```prolog
(?person, "works_for", ?org)
```

引擎在执行前会确定性地解析 `"works_for"`。

---
# 22. 精确谓词引用 (Exact Predicate Ref)

```prolog
(?person,
 "kip://ldclabs/organization@1.3.0/works_for",
 ?org)
```

可规避本地别名的歧义。

---
# 23. 谓词变量 (Predicate Variable)

```prolog
?p (?subject, ?predicate, ?object)
```

将绑定 `?predicate`。

原生 v2 规则：

> **谓词变量绑定的是规范的精确 `predicate_ref`，而不仅仅是展示/本地谓词名称。**

这保护了跨模式版本/命名空间的查询语义稳定性。

---
# 24. 谓词显示名称 (Predicate Display Name)

未来的表达式如：

```text
LOCAL_NAME(?predicate)
```

可以 (MAY) 渲染面向模型友好的本地名称。

规范唯一标识始终保持为精确引用。

---
# 25. 命题宾语可以是字面量 (Proposition Object May Be a Literal)

示例：

```prolog
?p (?alice, "timezone", "+08:00")
```

或者：

```prolog
?p (?service, "healthy", true)
```

---
# 26. 宾语变量可绑定元素或字面量 (Object Variable Can Bind Element or Literal)

```prolog
?p (?subject, "predicate", ?object)
```

根据谓词模式（Predicate schema），可以将 `?object` 绑定到：

```text
Cognitive Element (认知元素)
或
Literal (字面量)
```

---
# 27. 字面量查询辅助函数 (Literal Query Helpers)

推荐函数：

```text
IS_LITERAL(?x)
IS_ELEMENT(?x)
LITERAL_TYPE(?x)
```

精确类型/结果语义遵循核心字面量规则。

---
# 28. 高阶命题 (Higher-Order Proposition)

由于命题是可被引用的认知元素，因此在模式允许的情况下，高阶模式依然可行。

示例：

```prolog
?p2 (?alice, "disputes", ?p1)
```

其中 `?p1` 是一个命题。

---
# 29. 嵌套结构化命题语法 (Nested Structural Proposition Syntax)

在语义明确无歧义的情况下，KIP 1.x 的嵌套元组语法可以 (MAY) 作为模型友好的简写保留：

```prolog
(?alice, "disputes", (?service, "status", "healthy"))
```

如果存在对应的规范命题，原生执行会将其解析为该规范命题。

---
# 30. 断言模式 (Assertion Pattern)

全新的原生形式：

```prolog
?a ASSERTION {
  proposition: ?p,
  asserted_by: ?alice,
  stance: "support",
  mode: "stated"
}
```

---
# 31. 断言字段 (Assertion Fields)

基线可查询字段包括：

```text
id
kind
space_id
proposition
asserted_by
stance
mode
confidence
valid_time
asserted_at
lifecycle
context_refs
evidence
facets
retention
_system
```

受治理可见性约束。

---
# 32. 断言示例 (Assertion Example)

```prolog
FIND(?a, ?a.confidence, ?a.asserted_at)
WHERE {
  ?alice {id: :alice_id}
  ?p (?alice, "timezone", "+08:00")

  ?a ASSERTION {
    proposition: ?p,
    stance: "support"
  }
}
ORDER BY ?a.asserted_at DESC
LIMIT 20
```

此查询询问：

> 谁/什么支持了该命题？

它并不会计算大脑的采信信念。

---
# 33. 断言的 `asserted_by` 是语义行动主体 (Assertion `asserted_by` Is Semantic Actor)

针对以下内容的查询：

```text
?a.asserted_by
```

并不会暴露经过认证的写入者，除非治理策略同时允许访问：

```text
?a._system.origin.principal_id
```

这些身份标识始终保持分离。

---
# 34. 断言置信度 (Assertion Confidence)

```text
?a.confidence
```

表示该断言立场的置信度。

它**不是**：

```text
源可信度 (source trust)
大脑信念 (Brain belief)
记忆强度 (memory strength)
检索分数 (retrieval score)
```

KQL 必须保持这一区别。

---
# 35. 断言生命周期查询 (Assertion Lifecycle Query)

示例：

```prolog
FIND(?a, ?a.lifecycle.status, ?a.lifecycle.superseded_by)
WHERE {
  ?a ASSERTION {
    asserted_by: ?alice
  }

  FILTER(
    IN(
      ?a.lifecycle.status,
      ["active", "superseded", "retracted"]
    )
  )
}
```

---
# 36. 证据模式 (Evidence Pattern)

```prolog
?e EVIDENCE {
  evidence_class: "tool_result"
}
```

---
# 37. 证据字段 (Evidence Fields)

基线字段：

```text
id
kind
space_id
evidence_class
payload
content_digest
media_type
observed_at
source
generated_by
lifecycle
facets
retention
_system
```

---
# 38. 证据载荷可见性 (Evidence Payload Visibility)

治理策略可以允许：

```text
证据存在性 (Evidence existence)
```

同时隐藏：

```text
原始载荷 (raw payload)
来源身份 (source identity)
内容引用 (content_ref)
```

查询必须遵守字段级遮蔽脱敏规则。

---
# 39. 证据查询示例 (Evidence Query Example)

```prolog
FIND(
  ?e.id,
  ?e.evidence_class,
  ?e.observed_at,
  ?e.content_digest
)
WHERE {
  ?e EVIDENCE {
    evidence_class: "tool_result"
  }

  FILTER(?e.observed_at >= :since)
}
ORDER BY ?e.observed_at DESC
LIMIT 50
```

---
# 40. 活动模式 (Activity Pattern)

```prolog
?act ACTIVITY {
  activity_class: "semantic_consolidation",
  status: "completed"
}
```

---
# 41. 活动字段 (Activity Fields)

基线字段：

```text
id
kind
space_id
activity_class
started_at
ended_at
inputs
outputs
associated_actors
parameters_digest
status
facets
retention
_system
```

---
# 42. 活动查询示例 (Activity Query Example)

```prolog
FIND(?act, ?act.started_at)
WHERE {
  ?act ACTIVITY {
    activity_class: "skill_compilation",
    status: "completed"
  }
}
ORDER BY ?act.started_at DESC
LIMIT 20
```

---
# 43. 配置文件类型仍为概念 (Profile Types Remain Concepts)

`Experience`、`Skill`、`Event`、`Commitment` 等使用普通概念模式：

```prolog
?exp {type: "Experience"}
?skill {type: "Skill"}
```

它们不是额外的 KQL 核心模式种类。

---
# 44. 结构引用模式 (Structural Reference Pattern)

KIP 核心/配置文件具有非命题拓扑结构：

```text
Assertion → Evidence
Experience → ExperienceStep
Activity → input/output
```

这些属于结构引用（Structural References）。

KQL 需要遍历它们，而无需假装它们是现实世界命题。

---
# 45. 建议的结构引用语法 (Proposed Structural Syntax)

```prolog
?ref STRUCTURAL (?source, "field", ?target)
```

绑定变量是可选的：

```prolog
STRUCTURAL (?source, "field", ?target)
```

---
# 46. 结构引用是虚拟查询状态 (Structural Reference Is Virtual Query State)

结构引用绑定不一定是持久化的认知元素。

它是模式/核心拓扑上的虚拟描述符。

因此它不会自动拥有：

```text
id
Assertion
Evidence
truth status (真值状态)
```

---
# 47. 结构引用描述符 (Structural Reference Descriptor)

当绑定 `?ref` 时，有用的虚拟字段可能包括：

```text
source
field_ref
target
index
role
attributes
```

具体取决于底层的结构字段。

---
# 48. 断言证据遍历 (Assertion Evidence Traversal)

示例：

```prolog
FIND(?a, ?e, ?citation.role)
WHERE {
  ?a ASSERTION {
    stance: "support"
  }

  ?citation STRUCTURAL (?a, "evidence", ?e)

  ?e EVIDENCE {}
}
```

`role` 可以是：

```text
support (支持)
challenge (质疑/反驳)
context (上下文)
```

---
# 49. 经验步骤遍历 (Experience Step Traversal)

```prolog
FIND(?exp, ?step, ?edge.index)
WHERE {
  ?exp {type: "Experience"}

  ?edge STRUCTURAL (?exp, "has_step", ?step)

  ?step {type: "ExperienceStep"}
}
ORDER BY ?edge.index ASC
```

---
# 50. 结构字段解析 (Structural Field Resolution)

`"has_step"` 通过模式环境解析。

允许使用精确形式：

```prolog
STRUCTURAL(
  ?exp,
  "kip://profiles/cognitive-memory@2.0.0/has_step",
  ?step
)
```

---
# 51. 结构关系不是命题 (Structural Relation Is Not a Proposition)

查询：

```prolog
STRUCTURAL (?exp, "has_step", ?step)
```

并不意味着存在如下命题：

```text
(Experience, has_step, Step)
```

除非另外单独创建了这样一个语义命题。

---
# 52. 结构模式不支持认识论立场 (Structural Pattern Does Not Support Epistemic Stance)

核心拓扑本身不存在：

```text
support/reject (支持 / 拒绝)
```

如果大脑需要对某种结构关系表达认识论断言，它必须建模一个恰当的语义命题。

---
# 53. 点号表示法 (Dot Notation)

KIP 1.x 的点号表示法仍是首选的字段访问机制。

示例：

```text
?x.id
?x.kind
?x.schema_ref
?x.name
?x.attributes.summary
?x.lifecycle.status
?x._system.version
```

---
# 54. 完整对象访问 (Whole Object Access)

有用的完整对象访问：

```text
?x.attributes
?x.facets
?x.retention
```

受可见性约束。

---
# 55. 切面访问 (Facet Access)

推荐的 JSON 风格路径：

```prolog
?x.facets["MnemonicState"].memory_strength
```

`"MnemonicState"` 通过模式环境解析。

也可以使用精确的切面符号引用。

---
# 56. 精确切面访问 (Exact Facet Access)

```prolog
?x.facets[
  "kip://profiles/cognitive-memory@2.0.0/MnemonicState"
].memory_strength
```

此处跨行排版仅为提高可读性。

---
# 57. 切面别名歧义 (Ambiguous Facet Alias)

如果有两个处于激活状态的包暴露了相同的切面名：

```text
MnemonicState
```

查询将失败并返回模式歧义错误（Schema ambiguity error）。

引擎严禁 (MUST NOT) 进行主观猜测。

---
# 58. 缺失字段 (Missing Field)

在查询模型允许可选访问的情况下，缺失的可选字段求值结果为：

```text
null
```

模式中无效的字段名称可能会产生：

```text
SchemaFieldNotFound
```

错误，而不是静默返回 null。

---
# 59. 隐藏字段 vs. 缺失字段 (Hidden Field vs. Missing Field)

治理策略可能会有意使被隐藏字段与缺失/不可见状态无法区分，以防止信息泄露。

客户端严禁 (MUST NOT) 从 `null`/遮蔽脱敏行为中推断出：

```text
被隐藏字段并不存在
```

---
# 60. FILTER 过滤 (FILTER)

保留 KIP 1.x 的 `FILTER` 语义。

```prolog
FILTER(boolean_expression)
```

---
# 61. 基线运算符 (Baseline Operators)

保留以下运算符：

```text
== != < > <= >=
&& || !
IN(...)
CONTAINS(...)
STARTS_WITH(...)
ENDS_WITH(...)
REGEX(...)
IS_NULL(...)
IS_NOT_NULL(...)
```

---
# 62. 额外类型谓词 (Additional Type Predicates)

推荐：

```text
IS_LITERAL
IS_ELEMENT
IS_KIND
```

示例：

```prolog
FILTER(IS_KIND(?x, "evidence"))
```

---
# 63. 仅限确定性函数 (Deterministic Functions Only)

基线 KQL 应当 (SHOULD) 避免使用在执行期间其值会发生隐式变化的函数。

为了实现可复现的原始时间过滤，优先推荐使用：

```text
:now parameter (:now 参数)
```

而非：

```text
NOW()
```

当省略时间时，认识论的当前时间行为由投影上下文统一处理。

---
# 64. NOT 否定 (NOT)

KIP 1.x 保留了：

```prolog
NOT {
  ...
}
```

但 KIP 2.0 极具约束力地澄清了其语义含义。

---
# 65. NOT 意味着无可见匹配 (NOT Means No Visible Match)

这是一项核心不变式：

> **`NOT { pattern }` 表示该模式在当前查询所授权的可见认知宇宙中没有任何匹配项。**

它并不意味着现实世界层面的命题为假。

---
# 66. NOT 不是认识论拒绝 (NOT Is Not Epistemic Rejection)

以下错误推理：

```text
NOT { (Alice, is_vegetarian, true) }
因此：
Alice 不是素食主义者
```

是完全无效的。

正确理解是：

```text
没有存储可见的匹配命题/记录
```

---
# 67. 为什么 (Why)

KIP 是：

```text
开放世界的 (open-world)
部分观察的 (partially observed)
治理过滤的 (Governance-filtered)
历史可变的 (historically mutable)
```

因此，记录的缺失不能证明事实为假。

---
# 68. 通过 BELIEF 查询拒绝 (Query Rejection Through BELIEF)

若要询问大脑是否拒绝：

```text
Alice is vegetarian (Alice 是素食主义者)
```

请使用信念模式（Belief Pattern）并检查：

```text
status = rejected
```

---
# 69. OPTIONAL 可选匹配 (OPTIONAL)

保留 KIP 1.x 行为：

```prolog
OPTIONAL {
  ...
}
```

可选匹配失败时，新绑定的变量将保持为：

```text
null
```

---
# 70. OPTIONAL 为 Null 意味着无可见匹配 (OPTIONAL Null Means No Visible Match)

它并不意味着：

```text
该事实为假
该字段从未存在
不存在被隐藏的记录
```

---
# 71. UNION 联合 (UNION)

保留 KIP 1.x 行为：

```prolog
UNION {
  ...
}
```

用于逻辑替代模式分支。

变量作用域保持显式且可预测。

---
# 72. 变量作用域 (Variable Scope)

保留 v1 原则：

```text
NOT:
    内部变量不向外逃逸

OPTIONAL:
    新变量在未命中时逃逸为 null

UNION:
    分支绑定形成兼容的并集解集合
```

正式语法规范将延续 v1 的作用域规则。

---
# 73. 聚合函数 (Aggregation)

保留：

```text
COUNT
COUNT(DISTINCT ...)
SUM
AVG
MIN
MAX
```

---
# 74. 隐式分组 (Implicit Grouping)

保留 KIP 1.x 隐式分组：

```text
非聚合投影表达式
→ 分组键 (grouping key)
```

---
# 75. Null 值的聚合 (Null Aggregation)

聚合函数像 v1 一样忽略 null 值。

```text
COUNT(?optional_var)
```

当组内所有行均为 null 时返回 `0`。

---
# 76. 治理安全的聚合 (Governance-Safe Aggregation)

所有聚合操作均在**治理可见性过滤之后**进行。

因此：

```text
COUNT(...)
```

计算的是可见且授权的查询解集合。

---
# 77. 计数为零 (Count Zero)

`COUNT(...) = 0` 表示：

```text
零个可见匹配项
```

而不表示：

```text
全局存在零个匹配记录
```

也并不表示：

```text
所查询的陈述为假。
```

---
# 78. 解集语义 (Solution Set Semantics)

保留 v1 集合语义：

```text
完全重复的变量绑定在投影/排序/限制之前折叠合并
```

当不同解投影出相同值但其完整绑定不同时，依然保持为不同解。

---
# 79. ORDER BY 排序 (ORDER BY)

保留：

```prolog
ORDER BY <expr> ASC|DESC [, ...]
```

---
# 80. Null 排序 (Null Ordering)

保留：

```text
null 始终排在最后
```

除非未来添加了显式的 null 排序语法。

---
# 81. LIMIT 限制 (LIMIT)

```prolog
LIMIT :limit
```

保留 v1 行为。

运行时上限可能会缩减返回的最大页面大小。

---
# 82. CURSOR 游标 (CURSOR)

```prolog
CURSOR :cursor
```

保持不透明性。

KIP 2.0 增强了游标语义。

---
# 83. 快照稳定分页 (Snapshot-Stable Pagination)

分页查询的第一次请求基于单个快照求值：

```text
snapshot_seq
```

返回的游标会锁定该认知快照。

后续各页继续在该相同快照上推进。

---
# 84. 为什么游标锁定快照 (Why Cursor Pins Snapshot)

若不锁定快照：

```text
第 1 页
并发写入
第 2 页
```

会导致：

```text
重复记录
遗漏数据行
混合的历史状态
```

这对于认知审计/导出是不可接受的。

---
# 85. 游标绑定信息 (Cursor Binding)

游标应当 (SHOULD) 绑定：

```text
Space (空间)
snapshot_seq (快照序号)
标准化查询摘要 (normalized query digest)
模式解析上下文 (Schema resolution context)
投影策略/版本（若使用）
排序状态 (ordering state)
分页位置 (pagination position)
调用主体/会话权限范围 (Principal/session authority scope)
```

---
# 86. 游标不得复用于不同查询 (Cursor Cannot Be Reused for Different Query)

改变以下任意项：

```text
FILTER
AS OF
FOR TIME
Projection Policy
ORDER BY
Principal
Space
```

都会使游标失效。

---
# 87. 分页过程中权限撤销依然优先生效 (Revocation Still Wins During Pagination)

快照锁定并不会冻结当前的访问权限。

如果调用者在请求第 2 页之前失去了权限：

```text
当前的治理策略可以拒绝或脱敏遮蔽后续内容
```

游标不是授予过时访问权限的能力令牌（capability token）。

---
# 88. 稳定平局打破机制 (Stable Tie-Breaking)

引擎必须 (MUST) 在单个游标遍历内使用确定性的平局打破规则（tie-breaker），以使相等的 `ORDER BY` 值不会导致分页不稳定。

隐藏的平局打破机制无需对外暴露。

---
# 89. 默认排序 (Default Ordering)

若未指定 `ORDER BY`，引擎可以 (MAY) 在单个快照/游标内使用由实现定义的确定性排序。

不保证跨引擎的默认顺序一致。

需要可移植顺序的客户端必须指定 `ORDER BY`。

---
# 90. 命题路径运算符 (Proposition Path Operators)

KIP 1.x 路径运算符仍可在**原始命题模式**上使用：

```prolog
(?x, "is_subclass_of"{0,5}, ?ancestor)
```

以及谓词可选分支：

```prolog
(?x, "related_to" | "depends_on", ?y)
```

---
# 91. 原始路径语义 (Raw Path Semantics)

原始路径的含义是：

> 沿路径存在匹配的规范命题。

它并不意味着：

> 路径上的每条边都在认识论上被采信接受。

---
# 92. 无自动信念传播 (No Automatic Belief Propagation)

基线 KIP 2.0 绝不定义 (MUST NOT define)：

```text
多跳置信度相乘
概率路径信念
通过传递性传播真值
```

---
# 93. 为什么 (Why)

假设：

```text
P1 支持度 = 0.9
P2 支持度 = 0.8
```

KIP 并未定义：

```text
路径信念 = 0.72
min(0.9, 0.8)
平均值
```

或任何其他公式。

在 KQL 中凭空发明此类算法将违反认识论模型的策略分离原则。

---
# 94. 认识论路径遍历 (Epistemic Traversal)

对于较短的已接受路径，应显式查询每一跳：

```prolog
?b1 BELIEF (?x, "parent_of", ?y)
FILTER(?b1.status == "accepted")

?b2 BELIEF (?y, "parent_of", ?z)
FILTER(?b2.status == "accepted")
```

---
# 95. 未来的 BELIEF PATH (Future BELIEF PATH)

未来可选功能可以 (MAY) 定义：

```text
BELIEF PATH
```

但前提是以下语义完成标准化：

```text
边合格性 (edge eligibility)
传递性谓词 (transitive predicates)
路径状态 (path status)
不确定性 (uncertainty)
解释机制 (explanation)
```

它不属于基线 KQL 2.0。

---
# 96. 认识论查询原语 (Epistemic Query Primitive)

原生 v2 最关键的新增特性是 `BELIEF` 模式。

推荐语法：

```prolog
?belief BELIEF (?subject, "predicate", ?object)
```

`?belief` 是**虚拟认识论投影结果 (virtual Epistemic Projection result)**，而不是存储的认知元素。

---
# 97. BELIEF 的含义 (BELIEF Meaning)

该子句询问：

> 在当前查询的主体、意图、时间、模式、治理可见性与认识论策略下，应当如何解释该候选命题？

---
# 98. BELIEF 投影输出 (BELIEF Projection Output)

虚拟对象遵循认识论模型：

```text
proposition (命题)
status (状态)
support (支持)
opposition (反对)
uncertainty (不确定性)
temporal (时间)
policy (策略)
explanation (解释)
```

分数是可选的。

---
# 99. BELIEF 示例 (BELIEF Example)

```prolog
FIND(?timezone, ?belief)
WHERE {
  ?alice {id: :alice_id}

  ?belief BELIEF (?alice, "timezone", ?timezone)

  FILTER(?belief.status == "accepted")
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---
# 100. BELIEF 候选枚举 (BELIEF Candidate Enumeration)

如果 `?object` 未绑定：

```prolog
?belief BELIEF (?alice, "timezone", ?timezone)
```

引擎将求值匹配以下项的可见语义候选命题：

```text
主语 + 谓词 (subject + predicate)
```

并为每个候选命题绑定一个结果。

模式冲突扩展机制可能会在内部考量其他备选项。

---
# 101. BELIEF 需要有界目标 (BELIEF Requires Bounded Target)

基线规则：

> 在执行 `BELIEF` 子句之前，主语和谓词必须 (MUST) 已绑定或可接地。

当所有维度均未绑定时，引擎应当 (SHOULD) 拒绝执行：

```prolog
?b BELIEF (?s, ?p, ?o)
```

---
# 102. 为什么需要有界投影 (Why Bounded Projection)

认识论投影可能需要：

```text
溯源图遍历 (provenance traversal)
可信度评估 (trust evaluation)
冲突扩展 (conflict expansion)
证据质量评估 (Evidence quality)
```

意外对整个大脑的所有内容进行全面投影是极其昂贵且不安全的。

---
# 103. 完全接地的 BELIEF 可表示未知状态 (Fully Grounded BELIEF Can Represent Unknown)

重要的开放世界行为：

```prolog
?belief BELIEF (?alice, "is_vegetarian", true)
```

是完全接地的。

即使当前不存在对应的规范命题，在符合模式有效性的前提下，引擎也应当 (SHOULD) 返回一个虚拟投影结果：

```text
proposition_id = null
status = insufficient
```

---
# 104. 为什么虚拟缺失命题投影至关重要 (Why Virtual Missing Proposition Projection Matters)

否则：

```text
原始数据返回零行
```

将迫使智能体去主观猜测其原因究竟是：

```text
false (为假)
unknown (未知)
hidden (被隐藏)
schema-invalid (模式无效)
```

完全接地的信念投影可以显式表明：

```text
insufficient (证据不足)
```

而无需持久化存储该命题。

---
# 105. 虚拟语义项 (Virtual Semantic Term)

对于缺失的命题目标，投影包含一个虚拟语义项：

```json
{
  "subject": "...",
  "predicate_ref": "...",
  "object": true
}
```

读取操作绝不会创建任何核心命题。

---
# 106. 查询不会通过投影发生变更 (Query Does Not Mutate Through Projection)

`BELIEF` 是只读的。

投影出的虚拟命题绝不会出现在持久化状态中，除非后续的 KML 操作显式创建了它。

---
# 107. BELIEF 的 `rejected` 状态 (BELIEF `rejected`)

示例：

```prolog
FIND(?belief)
WHERE {
  ?alice {id: :alice_id}
  ?belief BELIEF (?alice, "is_vegetarian", true)
}
FOR TIME :now
```

如果存在充分的反对依据，可能会返回：

```text
status = rejected
```

这是认识论层面上正确的否定表达。

---
# 108. BELIEF 的 `insufficient` 状态 (BELIEF `insufficient`)

如果不存在合格的支撑依据：

```text
status = insufficient
```

而不是：

```text
false
rejected
```

---
# 109. BELIEF 的 `contested` 状态 (BELIEF `contested`)

如果可信的支持与反对依据同时并存：

```text
status = contested
```

虚拟结果将同时呈现这两方面。

---
# 110. BELIEF 的 `uncertain` 状态 (BELIEF `uncertain`)

存在有意义的材料，但未达到接受/拒绝的判定阈值。

智能体不应当将其武断折叠为已接受的答案。

---
# 111. BELIEF 不会持久化大脑信念 (BELIEF Does Not Persist Brain Belief)

投影输出始终只是一种视图。

如果大脑需要持久的自我信念连续性，形成/维护机制后续可能会创建一个派生断言。

那属于写入事务，且必须保留完整的溯源信息。

---
# 112. BELIEF SLOT 信念槽 (BELIEF SLOT)

智能体的许多提问形式如下：

```text
"Alice 的时区是什么？"
"项目 X 的状态是什么？"
"我们当前采信的值是什么？"
```

这些属于主语-谓词的**槽位 (slot)** 问题，而不是单个完全指定的命题。

KQL 2.0 应当 (SHOULD) 提供一种便捷的投影方式：

```prolog
?slot BELIEF SLOT (?subject, "predicate")
```

---
# 113. BELIEF SLOT 输出结构 (BELIEF SLOT Output)

推荐的虚拟结构形态：

```json
{
  "subject_id": "...",
  "predicate_ref": "...",

  "status": "accepted | contested | uncertain | insufficient",

  "accepted_values": [],
  "candidate_projections": [],

  "uncertainty": {},
  "policy": {},
  "temporal": {},
  "explanation": {}
}
```

---
# 114. BELIEF SLOT 不引入新的认识论 (BELIEF SLOT Does Not Introduce New Epistemology)

它是对认识论模型所定义的相同机制的便捷聚合：

```text
冲突集扩展 (conflict-set expansion)
候选命题投影 (candidate Proposition Projections)
模式基数/排他性约束 (Schema cardinality/exclusivity)
```

---
# 115. BELIEF SLOT 空情况处理 (BELIEF SLOT Empty Case)

与候选枚举不同，槽模式对于已接地的：

```text
主语 + 谓词
```

即使未存储任何值，也会返回一个投影。

此时：

```text
status = insufficient
accepted_values = []
candidate_projections = []
```

---
# 116. BELIEF SLOT 示例 (BELIEF SLOT Example)

```prolog
FIND(?slot)
WHERE {
  ?project {id: :project_id}

  ?slot BELIEF SLOT (?project, "status")
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---
# 117. 单值/函数式谓词槽 (Functional Predicate Slot)

对于单值/函数式谓词：

```text
status
timezone
primary_owner
```

槽投影通常是最自然的查询方式。

---
# 118. 多值谓词槽 (Multi-Valued Predicate Slot)

对于：

```text
interests
skills
members
```

模式可能允许多个被接受的值。

此时：

```text
accepted_values
```

可以包含多个条目而不产生冲突。

---
# 119. 槽中的被拒绝值 (Rejected Values in Slot)

`candidate_projections` 可以暴露出被拒绝/存争议的候选值。

这对于审计与解释非常有用。

---
# 120. BELIEF 模式不是 SEARCH (BELIEF Pattern Is Not SEARCH)

BELIEF 不会通过嵌入向量语义检索相似命题。

它投影的是已接地的/模式选定的候选命题。

应首先使用 `SEARCH` 进行模糊接地。

---
# 121. 查询级认识论上下文 (Query-Level Epistemic Context)

信念模式消费查询级别的上下文。

推荐写法：

```prolog
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "low",
  policy: "policy-id",
  include_historical: false,
  include_hypothetical: false,
  explanation: "summary"
}
```

---
# 122. `purpose` 意图 (`purpose`)

示例：

```text
answer_user (回答用户)
research (研究调查)
diagnosis (问题诊断)
action_planning (行动规划)
audit (合规审计)
scenario (推演推断)
```

精确词汇由策略定义。

---
# 123. 意图即上下文 (Purpose Is Context)

意图可能会影响：

```text
信任阈值 (trust threshold)
时效性 (freshness)
证据要求 (Evidence requirements)
模式合格性 (mode eligibility)
```

它本身并不直接授予治理权限。

---
# 124. `risk` 风险等级 (`risk`)

可选值：

```text
low
medium
high
```

或由部署环境定义的词汇。

投影策略对于较高风险可能会要求更强的证据支撑。

---
# 125. `policy` 策略 (`policy`)

可以指向某个精确授权的认识论策略标识/版本。

如果省略，运行时将根据以下信息自动解析适用策略：

```text
Space (空间)
Principal (主体)
purpose (意图)
risk (风险)
```

---
# 126. 必须返回解析后的策略 (Resolved Policy Must Be Returned)

为了保证可复现性，信念查询应当 (SHOULD) 暴露出实际使用的：

```text
policy_id
policy_version
projection_method
```

---
# 127. `include_historical` 包含历史 (`include_historical`)

若为 false，根据策略通常会排除已被废弃替代/撤回的历史断言。

若为 true：

```text
投影可以将它们作为历史认识论材料纳入考量
```

而不会假装它们是当前有效的。

---
# 128. `include_hypothetical` 包含假设 (`include_hypothetical`)

普通事实查询默认为 false。

情景推演分析可设为 true。

---
# 129. `explanation` 解释级别 (`explanation`)

推荐级别：

```text
none
summary
ledger
```

---
# 130. `none` 无解释 (`none`)

仅返回状态和核心投影输出。

---
# 131. `summary` 摘要解释 (`summary`)

返回简明、可外部审计的决策因素/告警。

绝非隐藏的思维链。

---
# 132. `ledger` 台账级解释 (`ledger`)

请求完整的认识论台账（Epistemic Ledger）：

```text
contributing Assertions (贡献支持的断言)
opposing Assertions (对立反对的断言)
Evidence roots (证据根源)
Corroboration Groups (佐证群组)
trust decisions (信任决策)
lifecycle exclusions (生命周期排除项)
temporal exclusions (时间有效性排除项)
warnings (告警信息)
```

受治理权限约束。

---
# 133. 解释的可见性 (Explanation Visibility)

调用者可能拥有：

```text
投影权限 (project permission)
```

但没有：

```text
原始证据读取权限 (raw Evidence read permission)
```

此时：

```text
状态可能可见
台账可能被遮蔽脱敏
```

根据策略执行。

---
# 134. 无原始证据的投影 (Projection Without Raw Evidence)

如果治理策略明确授权了该模式，KQL 允许受保护的投影服务返回：

```text
accepted / contested / ...
```

而无需暴露机密的证据内容。

---
# 135. 脱敏投影必须声明已被脱敏 (Redacted Projection Must Say It Is Redacted)

当向使用者隐藏了关键输入时，投影输出应当 (SHOULD) 暴露：

```text
explanation_redacted = true
```

或等效标记。

切勿让缩减脱敏后的解释看起来完整无缺。

---
# 136. FOR TIME 现实世界时间 (FOR TIME)

`FOR TIME` 表达认识论问题的现实世界有效时间。

示例：

```prolog
FOR TIME "2026-03-01T12:00:00Z"
```

---
# 137. FOR TIME 作用于信念投影 (FOR TIME Applies to Belief Projection)

根据投影策略，它会影响：

```text
Assertion.valid_time (断言有效时间)
证据时间相关性 (Evidence temporal relevance)
时效性规则 (freshness rules)
模式时间冲突 (schema temporal conflict)
```

---
# 138. FOR TIME 不会自动过滤原始 FIND (FOR TIME Does Not Filter Raw FIND Automatically)

原始查询：

```prolog
FIND(?a)
WHERE {
  ?a ASSERTION {}
}
FOR TIME :t
```

不应当 (SHOULD NOT) 仅因断言的 `valid_time` 不同就静默隐藏断言。

`FOR TIME` 仅对信念/槽投影具有实际意义。

原始过滤操作保持显式声明。

---
# 139. 原始时间过滤示例 (Raw Temporal Filter Example)

```prolog
FIND(?a)
WHERE {
  ?a ASSERTION {}

  FILTER(
    ?a.valid_time.from <= :t
    &&
    (
      IS_NULL(?a.valid_time.until)
      ||
      ?a.valid_time.until > :t
    )
  )
}
```

---
# 140. FOR INTERVAL 未来扩展 (FOR INTERVAL Future Extension)

未来 KQL 版本可以支持：

```text
FOR INTERVAL <from> TO <until>
```

以进行时间段级别的投影。

基线要求支持时间点有效时间投影。

---
# 141. AS OF 认知快照 (AS OF)

`AS OF` 用于选择**认知事务快照 (cognitive transaction snapshot)**。

推荐形式：

```prolog
AS OF SEQ 1500
AS OF TX "tx-991"
AS OF TIME "2026-03-01T12:00:00Z"
```

---
# 142. 默认 AS OF (Default AS OF)

如果省略：

```text
使用当前可读的空间快照
```

响应应当标识实际的 `snapshot_seq`。

---
# 143. `AS OF SEQ`

精确且推荐用于复现性要求高的场景：

```prolog
AS OF SEQ :seq
```

---
# 144. `AS OF TX`

将已提交的事务解析为其对应的空间序号。

---
# 145. `AS OF TIME`

解析到满足以下条件的最晚已提交空间状态：

```text
committed_at <= 请求的时间
```

受历史留存策略约束。

对于精确审计，优先推荐使用序号（SEQ）。

---
# 146. 历史原始查询 (Historical Raw Query)

```prolog
FIND(?a, ?a.lifecycle.status)
WHERE {
  ?a ASSERTION {id: :assertion_id}
}
AS OF SEQ :seq
```

询问：

> 在那个认知状态下，该断言记录是什么样子的？

---
# 147. 历史信念查询 (Historical Belief Query)

```prolog
FIND(?slot)
WHERE {
  ?alice {id: :alice_id}
  ?slot BELIEF SLOT (?alice, "timezone")
}
AS OF SEQ :historical_seq
FOR TIME :historical_world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  explanation: "ledger"
}
```

询问：

> 大脑在当时，对那个现实世界时间点持有怎样的信念？

---
# 148. 当前对历史时间的信念 (Current Belief About Historical Time)

```prolog
FIND(?slot)
WHERE {
  ?alice {id: :alice_id}
  ?slot BELIEF SLOT (?alice, "timezone")
}
FOR TIME :historical_world_time
WITH EPISTEMIC {
  purpose: "research"
}
```

不包含 `AS OF`。

这询问的是：

> 凭借大脑现在所知的一切，它对那个历史时期持有怎样的信念？

---
# 149. 核心时间维度区别 (Core Temporal Distinction)

```text
当时的信念 (belief-as-of-then)
    ≠
当前对当时的信念 (current-belief-about-then)
```

KQL 通过以下方式表达这一区别：

```text
AS OF
vs.
FOR TIME
```

---
# 150. 历史查询授权是基于当下的 (Historical Query Authorization Is Current)

这一区别至关重要。

`AS OF` 重建的是历史认知状态。

但调用者是在**当下**进行访问。

因此当前的治理策略决定了：

```text
调用者今天是否可以读取/投影历史状态。
```

---
# 151. 历史治理上下文 vs. 当前访问权限 (Historical Governance Context vs. Current Access)

两项治理求值可能都具有重要意义：

```text
Current Access Governance (当前访问治理):
    该主体现在是否可以查看此历史数据？

Historical Governance State (历史治理状态):
    大脑/主体在历史时间点能够看到或采信什么？
```

这两者并不相同。

---
# 152. 严禁通过历史查询绕过 ACL (No Historical ACL Bypass)

调用者不能通过查询：

```text
数据变为机密之前的 AS OF 历史状态
```

来绕过当前的保密性限制。

当前的访问策略始终拥有最终权威。

---
# 153. 历史认识论投影 (Historical Epistemic Projection)

在重建：

> 大脑在当时采信了什么？

这一历史问题时，投影可能需要将历史上的：

```text
信任策略 (trust policy)
源可见性 (source visibility)
断言生命周期 (Assertion lifecycle)
模式环境 (Schema Environment)
```

作为认识论输入。

但输出依然要经过当前调用者授权的过滤。

---
# 154. 当前查询策略可脱敏遮蔽历史台账 (Current Query Policy Can Redact Historical Ledger)

即使大脑在历史上确实看到了机密证据：

```text
当前调用者可能也只能接收到历史状态
```

而无法获取原始证据。

---
# 155. 模式上下文 (Schema Context)

KQL 本地名称必须实现确定性解析。

每次查询都在唯一的模式解析上下文下执行。

---
# 156. 当前查询的默认模式环境 (Current Query Default Schema Environment)

在没有 `AS OF` 时：

```text
当前的激活模式环境 (current active Schema Environment)
```

负责解析本地别名。

---
# 157. 历史查询的默认模式环境 (Historical Query Default Schema Environment)

在指定了 `AS OF` 时：

> 本地别名应当 (SHOULD) 默认采用在该历史空间快照处于激活状态的模式环境。

这使得历史查询文本能够准确反映当时的历史语义。

---
# 158. 精确引用规避歧义 (Exact Ref Avoids Ambiguity)

对于高保证性审计：

```text
使用精确的 schema_ref/predicate_ref
```

而不是依赖历史别名。

---
# 159. 显式锁定模式环境 (Explicit Schema Environment Pin)

未来的/请求级别的选项可以 (MAY) 允许：

```text
USING SCHEMA ENV 17
```

或等效语法。

这对于客户端生成的确定性查询非常有用。

---
# 160. 当前标准化的历史视图 (Current-Normalized Historical View)

模式包允许可选的感知迁移的标准化查询。

这不属于基线原始 KQL。

实现可以 (MAY) 声明支持：

```text
normalized_schema_view
```

并允许通过声明的标准化目标来查询旧数据。

---
# 161. 无隐式模式强转 (No Hidden Schema Coercion)

在缺乏显式标准化视图能力的情况下：

```text
旧的精确模式始终保持为旧的精确模式。
```

KQL 绝不能使用当前的类型语义对其进行静默重新解释。

---
# 162. 模式输出标识 (Schema Output Identity)

返回的原生记录将暴露：

```text
schema_ref
predicate_ref
Facet refs (切面引用)
```

作为精确的规范身份标识。

---
# 163. KQL 结果模型 (KQL Result Model)

为了保障 Token 利用效率与向后兼容性，KIP 1.x 基于列式的 `FIND` 输出依然作为基线标准。

示例查询：

```prolog
FIND(?name, ?status)
...
```

在概念上返回：

```json
[
  ["Project A", "Project B"],
  ["active", "archived"]
]
```

各列索引按行对齐。

---
# 164. 单投影表达式 (Single Projection Expression)

对于单个 `FIND` 表达式：

```prolog
FIND(?slot)
```

遵循 v1 行为，结果可以保持不展开为嵌套列表，直接作为单个列返回。

---
# 165. 结果中的虚拟对象 (Virtual Objects in Result)

`BELIEF`、`BELIEF SLOT` 和结构描述符可以作为 JSON 对象包含在列中返回。

在必要时它们会被标记为虚拟/只读。

---
# 166. 查询上下文响应 (Query Context Response)

KQL 2.0 应当 (SHOULD) 使用上下文对象来扩展成功的响应。

该上下文对象承载于运行时信封 (`kip-response.schema.json`) 的操作结果之上，
而不是某种 KQL 专用的回复结构。示意如下：

```json
{
  "kip": "2.0",
  "status": "succeeded",

  "results": [
    {
      "op_id": "q1",
      "status": "succeeded",
      "result": [...],

      "context": {
        "space_id": "space-1",
        "snapshot_seq": 1500,
        "schema_environment_version": 17,

        "epistemic_policy": {
          "id": "default-recall",
          "version": "3"
        }
      },

      "next_cursor": "..."
    }
  ],

  "snapshot": {
    "snapshot_seq": 1500
  }
}
```

---
# 167. 为什么返回快照 (Why Return Snapshot)

智能体决策后续可能需要回答：

> 该答案究竟来自哪个精确的大脑状态？

查询响应应当使这一信息完全可溯源恢复。

---
# 168. 响应上下文是引擎真实事实 (Response Context Is Engine Truth)

查询引擎填充：

```text
snapshot_seq (快照序号)
解析后的模式环境 (resolved Schema Environment)
实际使用的认识论策略 (actual Epistemic Policy)
```

智能体并不将这些作为事实进行创作编写。

---
# 169. 结果上下文与决策溯源 (Result Context and Decision Provenance)

大脑可以持久化存储：

```text
query snapshot_seq (查询快照序号)
projection policy/version (投影策略 / 版本)
```

在后续的决策活动/溯源记录中。

这使得行动推理具有可复现性，而无需存储私有的思维链。

---
# 170. 搜索与 KQL 保持独立 (Search Remains Separate from KQL)

KIP 1.x 正确地将：

```text
SEARCH (搜索)
```

分离为联想接地原语（associative grounding primitive）。

KIP 2.0 应当 (SHOULD) 保留这一分离。

---
# 171. 为什么 SEARCH 不是 FIND (Why SEARCH Is Not FIND)

`SEARCH` 回答的是：

> 哪些存储的认知内容与该探测在语义上/词法上相似？

`FIND` 回答的是：

> 哪些可见记录满足该精确的声明式模式？

---
# 172. SEARCH 分数是检索相关性 (SEARCH Score Is Retrieval Relevance)

搜索的 `_score` **不是**：

```text
断言置信度 (Assertion confidence)
可信度 (trust)
信念 (belief)
记忆强度 (memory strength)
```

---
# 173. 推荐的智能体检索流程 (Recommended Agent Retrieval Flow)

```text
1. DESCRIBE PRIMER (描述入门指南)
2. SEARCH 模糊接地实体 / 主题
3. 解析精确 ID / 模式
4. FIND 原始状态或 BELIEF 投影
5. 综合生成答案
```

---
# 174. SEARCH + BELIEF 组合 (SEARCH + BELIEF)

一种强大的回忆模式：

```text
SEARCH:
    查找可能的项目 / 人员 / 概念

KQL:
    BELIEF SLOT:
        询问当前采信的信念是什么
```

切勿将语义相似度得分用作认识论置信度。

---
# 175. DESCRIBE 仍属于 META (DESCRIBE Remains META)

权威的模式包自省属于 META 层级：

```text
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE SCHEMA ENVIRONMENT
```

KQL 可以查询记录的模式引用，但不会重新定义模式。

---
# 176. 治理查询宇宙 (Governance Query Universe)

在进行 KQL 逻辑求值之前，引擎首先应用当前的治理可见性规则。

概念流程：

```text
Physical Space State (物理空间状态)
    ↓
Current Principal Authorization (当前调用主体授权)
    ↓
Visible Query Universe (可见查询宇宙)
    ↓
KQL 模式求值
```

---
# 177. 授权发生在逻辑运算符之前 (Authorization Happens Before Logical Operators)

未授权记录不参与以下任何环节：

```text
WHERE
NOT
OPTIONAL
UNION
COUNT
聚合运算
ORDER BY
LIMIT
搜索 / 排序
信念解释
```

除非特权投影策略明确允许返回脱敏遮蔽的派生结果。

---
# 178. 无隐式计数泄露 (No Hidden Count Leakage)

如果存在 50 条机密记录和 3 条公开记录：

```prolog
FIND(COUNT(?x))
WHERE {
  ?x {type: "Diagnosis"}
}
```

普通调用者只能看到：

```text
3
```

而不是 `53`。

---
# 179. 无 NOT 逻辑泄露 (No NOT Leakage)

如果某条隐藏记录匹配了模式，缺乏发现权限（discover authority）的主体严禁 (MUST NOT) 通过特殊错误或超出允许安全行为的查询耗时/结果间接获知该事实。

---
# 180. 存在性中立的错误 (Existence-Neutral Errors)

当策略要求隐藏存在性时，精确 ID 查询可以返回：

```text
等效于 not_found 的结果
```

而不是：

```text
机密元素 X 权限被拒绝
```

---
# 181. 字段级脱敏遮蔽 (Field-Level Redaction)

可见元素可以按如下形式返回：

```text
id/name/status
```

同时：

```text
证据载荷 (Evidence payload)
来源 (source)
起源 (origin)
私有切面 (private Facet)
```

被隐藏。

---
# 182. 作用于隐藏字段的模式 (Pattern on Hidden Field)

实现严禁允许调用者通过以下方式推断出被隐藏字段的值：

```text
FILTER
ORDER BY
COUNT
```

除非策略明确允许使用该字段执行受控派生查询。

---
# 183. 受控派生查询 (Controlled Derived Query)

治理策略可以允许：

```text
投影使用隐藏证据
```

同时仅返回：

```text
合规状态 (compliance status)
```

这属于显式的特权操作，而不是普通的原始 KQL 字段访问。

---
# 184. 查询意图与治理 (Query Purpose and Governance)

KQL 请求可以声明：

```text
purpose (意图)
```

用于认识论/治理上下文。

自我声明的意图本身并不能提升访问权限。

---
# 185. 查询风险 (Query Risk)

同理：

```text
risk = high
```

可能会使投影判定更为严苛。

但绝严禁以此获取更多数据。

---
# 186. KQL 只读保证 (KQL Read-Only Guarantee)

KQL 严禁 (MUST NOT) 仅仅因为数据被查询而创建/更新：

```text
memory_strength (记忆强度)
访问计数器 (access counters)
last_read_at (最后读取时间)
confidence (置信度)
Evidence (证据)
Assertion (断言)
```

---
# 187. 核心语义中无读取追踪 (No Read Tracking in Core Semantics)

读取记忆并不等同于认知强化。

如果智能体希望将检索过程转化为经验/学习信号，必须在策略约束下通过形成机制/KML 显式记录。

---
# 188. 查询不会强化证据 (Query Does Not Reinforce Evidence)

重复查询相同的证据**不会**：

```text
提升置信度
增加佐证强度
```

---
# 189. 查询缓存不是认知状态 (Query Cache Is Not Cognitive State)

缓存结果属于运行时优化。

它不会成为存储的信念。

---
# 190. 认识论投影缓存 (Epistemic Projection Cache)

缓存的投影仅在其绑定的上下文内有效：

```text
snapshot_seq (快照序号)
策略版本 (policy version)
有效时间 (valid time)
意图 (purpose)
风险等级 (risk)
主体可见性 (Principal visibility)
模式语义 (Schema semantics)
```

---
# 191. 投影缓存失效 (Projection Cache Invalidation)

对以下相关内容的变更：

```text
Assertion (断言)
Evidence (证据)
provenance (溯源)
trust policy (信任策略)
Governance (治理)
Schema (模式)
```

可能会使缓存的投影失效。

---
# 192. 基于事务快照的查询 (Query Against Transaction Snapshot)

在读写原子事务内部，当事务 API 允许混合读取时，KQL 求值基于：

```text
事务快照 (transaction snapshot)
+
事务的暂态写入 (transaction's tentative writes)
```

---
# 193. 事务外部的查询 (Outside Transaction)

普通的 KQL 请求读取单个稳定的当前快照。

多个独立的请求可能会观察到不同的快照。

---
# 194. 读取快照批处理 (Read Snapshot Batch)

对于多个逻辑相关的 KQL 查询，事务运行时可以提供读取快照容器，使得所有命令均使用同一个：

```text
snapshot_seq
```

---
# 195. 批量命令并不自动构成单个快照 (Batch Commands Are Not Automatically One Snapshot)

普通的传输层 `commands[]` 批处理不一定是读取事务，除非 API 显式保证共享快照。

需要一致性的客户端应当请求快照语义。

---
# 196. 当前查询快照一致性 (Current Query Snapshot)

即使是普通的单条 `FIND` 也必须保持内部一致性。

它不能混合来自多个部分观察到的提交的元素版本。

---
# 197. 历史留存失效 (Historical Retention Failure)

如果请求的 `AS OF` 状态已被压缩/清理超出所支持的历史范围：

```text
应当返回 HistoricalSnapshotUnavailable
```

切勿静默替换为当前状态。

---
# 198. 已物理清理的内容 (Purged Content)

历史查询可以返回：

```text
redacted/unavailable (脱敏 / 不可用)
```

如果事务历史证明记录曾经存在，但其内容已被合法物理清理。

切勿尝试从日志中重建被禁用的内容。

---
# 199. 历史查询与墓碑机制 (Historical Query and Tombstone)

在设置墓碑之前的历史查询可以展示该元素。

当前查询可能会显示：

```text
无活跃元素
```

或者根据生命周期策略显示已授权的墓碑。

---
# 200. 查询事务历史 (Querying Transaction History)

详细的提交日志 / 变更流查询属于运行时/META 能力，而不是普通的图 KQL。

KQL `AS OF` 消费事务历史，但不会将整个引擎底层日志暴露为认知记录。

---
# 201. 查询溯源信息 (Querying Provenance)

语义溯源信息可通过以下途径访问：

```text
Evidence (证据)
Activity (活动)
Structural References (结构引用)
source/origin fields (源 / 起源字段)
```

受治理策略约束。

---
# 202. 溯源查询示例 (Provenance Example)

```prolog
FIND(?a, ?e, ?activity)
WHERE {
  ?a ASSERTION {id: :assertion_id}

  STRUCTURAL (?a, "evidence", ?e)

  ?activity ACTIVITY {
    outputs: ?e
  }
}
```

实现可以支持直接的字段绑定简写来表示 `inputs/outputs`。

---
# 203. 溯源 DAG 回溯 (Provenance DAG Backtracking)

KQL 可以手动遍历活动/证据之间的依赖关系。

基线 KQL 绝不应当 (SHOULD NOT) 提供无界的递归溯源运算符。

认识论投影可以在策略定义的限制范围内在内部遍历溯源图。

---
# 204. 为什么不提供无界溯源运算符 (Why No Unbounded Provenance Operator)

长期运行的大脑其溯源图可能具有：

```text
深度极深 (deep)
因格式不良的导入历史而存在环路 (cyclic)
数据量极大 (large)
包含高度隐私敏感信息 (privacy-sensitive)
```

智能体查询应当保持有界且可预测。

---
# 205. 溯源深度 (Provenance Depth)

未来的 KQL 功能可以 (MAY) 支持：

```text
PROVENANCE OF ?x DEPTH N
```

作为专用的读取原语。

但这不属于基线 v2。

---
# 206. 联想回忆 (Associative Recall)

使用谓词变量的原始查询依然非常有用：

```prolog
FIND(?pred, ?neighbor)
WHERE {
  ?p (?entity, ?pred, ?neighbor)
}
LIMIT 50
```

---
# 207. 联想回忆属于原始查询 (Associative Recall Is Raw)

它回答的是：

> 与该实体相连的语义命题有哪些？

它并不回答：

> 其中哪些是被采信的信念？

---
# 208. 认识论联想回忆 (Epistemic Associative Recall)

推荐的两阶段模式：

```text
1. 原始有界联想发现
2. 通过 BELIEF 对关键候选命题进行投影
```

或者使用模式中已知的谓词槽（predicate Slots）。

---
# 209. 避免盲目投影所有邻居节点 (Avoid Projecting Every Neighbor Blindly)

一个大型实体可能关联数千个命题。

大脑回忆机制应当：

```text
按谓词 / 领域 / 配置文件限定范围
对候选命题进行排序
然后进行投影
```

以严格控制计算开销。

---
# 210. 记忆切面查询 (Memory Facet Query)

示例：

```prolog
FIND(
  ?exp,
  ?exp.facets["MnemonicState"].memory_strength,
  ?exp.facets["MnemonicState"].salience
)
WHERE {
  ?exp {type: "Experience"}
}
ORDER BY
  ?exp.facets["MnemonicState"].salience DESC,
  ?exp._system.updated_at DESC
LIMIT 20
```

---
# 211. 记忆信号不是认识论状态 (Mnemonic Signal Is Not Epistemic Status)

高：

```text
memory_strength (记忆强度)
```

并不意味着：

```text
accepted truth (被接受的真理)
```

KQL 分别暴露这两者，而不会将它们自动合并。

---
# 212. 效用查询 (Utility Query)

技能配置文件可以通过切面/属性暴露：

```text
utility (效用值)
```

KQL 可以按效用值进行排序。

但这绝不能提升治理权限。

---
# 213. 行动回忆 (Action Recall)

大脑可以使用 KQL 汇集组装：

```text
相关被接受的信念
适用的、具备有效生命周期地位的技能
成功的经验
失败的经验
Commitments (承诺)
约束条件
告警信息
```

KQL 本身并不规定大脑最终的重排序算法。

---
# 214. 失败经验查询 (Failure Experience Query)

示例：

```prolog
FIND(?exp, ?exp.attributes.outcome_status)
WHERE {
  ?exp {type: "Experience"}

  FILTER(
    ?exp.attributes.outcome_status == "failure"
  )
}
ORDER BY
  ?exp.facets["MnemonicState"].salience DESC
LIMIT 20
```

---
# 215. 对比经验查询 (Contrastive Experience Query)

大脑可以查询具有相同目标/领域的成功经验与失败经验并进行对比分析。

这属于构建在 KQL 之上的过程式学习逻辑。

---
# 216. 推演情景投影 (Scenario Projection)

示例：

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (:subject, "will_succeed", true)
}
FOR TIME :future_time
WITH EPISTEMIC {
  purpose: "scenario",
  include_hypothetical: true,
  explanation: "summary"
}
```

---
# 217. 假设性内容不进入普通信念 (Hypothetical Does Not Enter Ordinary Belief)

只有推演情景投影才会包含假设性断言。

原始查询在具备可见权限的前提下，随时可以检查它们。

---
# 218. 审计投影 (Audit Projection)

```prolog
WITH EPISTEMIC {
  purpose: "audit",
  include_historical: true,
  explanation: "ledger"
}
```

可以在台账中保留已被替代/撤回的断言，而不是将它们折叠忽略。

---
# 219. 查询原始反面证据 (Querying Raw Counter-Evidence)

```prolog
FIND(?a, ?e)
WHERE {
  ?a ASSERTION {
    proposition: :prop_id
  }

  ?ref STRUCTURAL (?a, "evidence", ?e)

  FILTER(?ref.role == "challenge")
}
```

---
# 220. 查询争议状态 (Querying Contest)

原始查询：

```prolog
FIND(?a, ?a.stance, ?a.asserted_by)
WHERE {
  ?a ASSERTION {
    proposition: :prop_id
  }
}
```

认识论查询：

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (:prop_subject, :predicate, :object)
}
WITH EPISTEMIC {
  explanation: "ledger"
}
```

两者针对不同的问题各有用处。

---
# 221. 命题 ID 定位 (Proposition ID Targeting)

已按身份获知的命题，通过与命题模式中指名它时相同的 id 形式来投影（规范 §43.2 / §46.1）：

```prolog
?belief BELIEF (id: :id)
```

等价地，也可以先绑定它，再使用单参数形式：

```prolog
?p PROPOSITION (id: :id)
?belief BELIEF (?p)
```

id 形式是引用，不是对象模式：`BELIEF {proposition_id: :id}` 不是 KQL。

---
# 222. 推荐的 BELIEF 单参数形式 (Recommended BELIEF One-Argument Form)

KQL 应当 (SHOULD) 支持：

```prolog
?belief BELIEF (?p)
```

其中 `?p` 已经绑定到一个命题。

这等价于对其元组进行投影。

---
# 223. 示例 (Example)

```prolog
FIND(?p, ?belief)
WHERE {
  ?p (?alice, "timezone", ?tz)
  ?belief BELIEF (?p)
}
```

---
# 224. BELIEF 单参数变量必须已绑定 (BELIEF One-Argument Variable Must Be Bound)

`?p` 必须已经绑定到某个命题。

否则将报错：

```text
ProjectionTargetUnbound
```

---
# 225. BELIEF 模式排序 (BELIEF Pattern Ordering)

在 `WHERE` 内部，子句顺序在逻辑上是声明式的。

但是，BELIEF 目标必须在逻辑上由其他模式/参数所绑定。

引擎可以在保持语义不变的前提下调整执行顺序。

---
# 226. 针对信念输出的 FILTER (FILTER on Belief Output)

示例：

```prolog
FILTER(
  IN(
    ?belief.status,
    ["accepted", "contested"]
  )
)
```

---
# 227. 分数过滤 (Score Filtering)

如果投影提供了数值支持度：

```prolog
FILTER(?belief.support.score >= 0.8)
```

是允许的。

但智能体在将其解释为概率之前，必须 (MUST) 检查：

```text
score_semantics (分数语义)
```

---
# 228. 无通用信念数值 (No Universal Belief Numeric)

KQL 绝不假设：

```text
support.score = probability (概率)
```

---
# 229. 分数排序 (Score Ordering)

允许按照以下指标排序：

```text
信念支持度 (belief support)
记忆显著性 (memory salience)
时效新鲜度 (recency)
```

查询作者必须自行负责遵守各项信号的语义定义。

---
# 230. 认识论状态排序 (Epistemic Status Ordering)

KIP 并未定义通用的：

```text
accepted > contested > uncertain
```

排序规则。

请使用显式过滤器或在应用层进行排序。

---
# 231. 开放世界存在性检查 (Open-World Existence Check)

用户提问：

> 我们是否知道 Alice 是不是素食主义者？

正确的 KQL 写法：

```prolog
FIND(?belief)
WHERE {
  ?alice {id: :alice_id}

  ?belief BELIEF (
    ?alice,
    "is_vegetarian",
    true
  )
}
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

结果可以显式为：

```text
accepted (已接受)
rejected (已拒绝)
contested (存争议)
uncertain (不确定)
insufficient (证据不足)
```

---
# 232. 错误的存在性检查 (Wrong Existence Check)

应当避免：

```prolog
FIND(COUNT(?p))
WHERE {
  ?p (?alice, "is_vegetarian", true)
}
```

然后将其解释为：

```text
0 = false (为假)
```

这严重违反了开放世界语义。

---
# 233. 查询“我们知道什么？” (Querying "What Do We Know?")

这一自然语言提问具有歧义。

它可能意味着：

```text
存在哪些记录？
```

或者：

```text
我们拥有哪些被采信的信念？
```

面向用户的事实性陈述回答，大脑回忆机制通常应当优先采用认识论投影。

---
# 234. 原始视图用于审计，认识论视图用于回答 (Raw View for Audit, Epistemic View for Answering)

推荐的大脑默认行为：

```text
普通事实性回答
    → BELIEF / BELIEF SLOT

调试 / 审计 / 溯源追踪
    → 原始 FIND

记忆探索
    → SEARCH + 原始 FIND + 选择性 BELIEF
```

---
# 235. 原始视图必须保持可访问 (Raw View Must Remain Accessible)

切勿通过只暴露被接受的投影来掩盖分歧矛盾。

真正的大脑需要检查：

```text
它为何采信
什么被拒绝了
什么仍然存在争议
```

---
# 236. 投影必须保持可解释性 (Projection Must Remain Explainable)

带有 `ledger` 的信念查询应当允许获得授权的智能体检查充分的外部结构，以在没有思维链的情况下审计结果。

---
# 237. 严禁隐藏思维链查询 (No Hidden Chain-of-Thought Query)

KQL 严禁 (MUST NOT) 暴露模型私有的内部推理 Token。

它可以暴露显式持久化或确定性计算的：

```text
Evidence (证据)
Assertions (断言)
Activities (活动)
decision summaries (决策摘要)
Projection Ledger (投影台账)
```

---
# 238. 查询决策摘要 (Querying Decision Summary)

如果某个配置文件将：

```text
decision_summary
```

作为字段存储，它属于普通的认知状态，可以在治理策略允许下被查询。

它不是隐藏的思维链。

---
# 239. 原始证据内容大小限制 (Raw Evidence Content Limits)

证据内容可能具有以下特点：

```text
体积庞大 (large)
二进制数据 (binary)
外部存储 (external)
```

KQL 通常应当返回元数据/引用，而不是自动内联任意庞大的载荷。

---
# 240. 证据载荷检索 (Evidence Payload Retrieval)

对于大体积内容，使用专用的证据/Blob 获取 API 往往更为合适。

KQL 负责定位相关的证据。

---
# 241. 查询参数化 (Query Parameterization)

保留 KIP 1.x 的参数占位符语法：

```text
:param
```

它们必须占据完整的 KIP 值位置。

---
# 242. 参数安全性 (Parameter Safety)

值是通过结构化绑定的。

当存在参数位置时，切勿将用户文本直接拼接进原始 KQL 字符串中。

---
# 243. 参数示例 (Parameter Examples)

```prolog
?person {id: :person_id}
FILTER(?a.asserted_at >= :since)
LIMIT :limit
AS OF SEQ :seq
FOR TIME :world_time
```

---
# 244. 参数化模式引用 (Parameterized Schema Ref)

在语法允许模式值位置的地方：

```prolog
?x {type: :schema_ref}
```

可以使用参数。

引擎将其解析/验证为模式标识，而不是任意代码。

---
# 245. 查询开销控制 (Query Cost)

KQL 实现可以强制执行：

```text
最大结果行数
最大图扩展次数
最大路径跳数
最大投影数量
最大溯源扩展深度
执行耗时限制
内存消耗限制
```

---
# 246. 投影开销 (Projection Cost)

BELIEF 通常比原始三元组匹配更昂贵。

运行时应当 (SHOULD) 对无界的候选投影设置上限。

---
# 247. 投影预算 (Projection Budget)

运行时可以 (MAY) 暴露：

```text
max_belief_projections_per_query
```

并拒绝/限制超出预算的查询。

---
# 248. 路径跳数限制 (Path Hop Limits)

现有的路径语法必须服从引擎的最大跳数限制。

即使是：

```text
{1,}
```

也受到功能能力与资源策略的约束。

---
# 249. 正则表达式限制 (Regex Limits)

实现应当采用安全/有界的正则表达式执行机制。

KQL 绝不能成为拒绝服务（DoS）攻击向量。

---
# 250. 查询部分结果 (Query Partial Results)

对于普通的 `FIND` 查询，超时应当 (SHOULD) 正常返回错误，而不是静默将不完整的结果当作完整结果呈现。

未来显式的：

```text
ALLOW PARTIAL (允许部分结果)
```

模式可能会支持尽力而为的探索性查询。

基线规范保持完成语义的清晰性。

---
# 251. 投影部分结果 (Projection Partial Result)

在证据缺失/被脱敏遮蔽的情况下，认识论投影仍可能产生：

```text
uncertain (不确定)
insufficient (证据不足)
```

并附带告警信息。

这属于认识论上的不完全性，而非执行超时。

切勿混淆这两者。

---
# 252. 查询错误类别 (Query Error Classes)

推荐的 KQL 2.0 错误名称：

```text
InvalidSyntax (语法无效)
InvalidIdentifier (标识符无效)
SchemaSymbolNotFound (未找到模式符号)
SchemaSymbolAmbiguous (模式符号歧义)
SchemaFieldNotFound (未找到模式字段)
TypeMismatch (类型不匹配)
ReferenceError (引用错误)
NotFoundOrNotVisible (未找到或不可见)
HistoricalSnapshotUnavailable (历史快照不可用)
HistoricalSchemaUnavailable (历史模式不可用)
ProjectionTargetUnbound (投影目标未绑定)
ProjectionTargetUnbounded (投影目标无界)
ProjectionNotAuthorized (投影未授权)
ProjectionPolicyUnavailable (投影策略不可用)
CursorMismatch (游标不匹配)
CursorExpired (游标已过期)
CursorInvalidated (游标已失效)
ResourceExhausted (资源耗尽)
ExecutionTimeout (执行超时)
UnsupportedCapability (不支持的功能)
```

正式的数字化错误码推迟到后续规范中定义。

---
# 253. 存在性中立的 NotFound (Existence-Neutral NotFound)

安全敏感型部署可以使用：

```text
NotFoundOrNotVisible
```

以避免暴露被隐藏元素的存在性。

---
# 254. 投影未授权 (Projection Unauthorized)

如果调用者缺乏 `project` 权限：

```text
ProjectionNotAuthorized
```

不应当暴露被隐藏的候选数量/详细信息。

---
# 255. 模式歧义恢复 (Schema Ambiguity Recovery)

在策略允许的情况下，错误信息应当 (SHOULD) 列出可见的候选模式符号。

然后智能体使用精确引用。

---
# 256. 历史快照恢复 (Historical Snapshot Recovery)

若历史不可用：

```text
在治理允许的前提下报告留存边界 (retention boundary)
```

绝严禁静默替换为最近的/当前快照。

---
# 257. 权限撤销导致游标失效 (Cursor Invalidated by Revocation)

如果继续翻页会违反新的当前治理策略：

```text
返回 CursorInvalidated
```

或返回存在性中立的授权判定结果。

切勿使用陈旧权限继续执行。

---
# 258. KQL 功能协商 (KQL Capability Negotiation)

运行时应当 (SHOULD) 声明支持的特性：

```text
kql_version
assertion_patterns
evidence_patterns
activity_patterns
structural_patterns
belief_projection
belief_slot
historical_as_of
historical_by_time
facet_bracket_access
raw_path_operators
read_snapshot
projection_ledger
normalized_schema_view
max_path_hops
max_projection_count
```

---
# 259. 最小 KQL 2.0 一致性要求 (Minimum KQL 2.0 Conformance)

最小的原生实现必须 (MUST) 支持以下等效语义：

```text
FIND
WHERE
Concept patterns (概念模式)
Proposition patterns (命题模式)
Assertion patterns (断言模式)
Evidence patterns (证据模式)
Activity patterns (活动模式)
FILTER
NOT
OPTIONAL
UNION
aggregation (聚合运算)
ORDER BY
LIMIT
CURSOR
精确模式引用
治理过滤后的查询宇宙
BELIEF 单命题投影
当前快照标识
```

---
# 260. 完整认知查询一致性 (Full Cognitive Query Conformance)

在此基础上增加：

```text
结构引用模式 (Structural Reference pattern)
BELIEF SLOT 信念槽
历史 AS OF
FOR TIME 世界有效时间
切面访问 (Facet access)
投影台账 (projection ledger)
快照稳定分页
谓词变量
原始路径运算符
```

---
# 261. 历史一致性要求 (Historical Conformance)

要求支持：

```text
AS OF SEQ
生命周期重建
历史模式环境
历史认识论输入
当前访问权限强制执行
```

在声明的留存期范围内。

---
# 262. KQL 一致性测试用例 (KQL Conformance Fixtures)

测试集应当包括：

```text
原始命题存在但断言被拒绝
原始查询返回命题
BELIEF 返回 rejected

命题不存在
完全接地的 BELIEF 返回 insufficient

单值/函数式谓词存在两个冲突的值
BELIEF SLOT 返回 contested

两个值处于不重叠的有效时间段
FOR TIME 选取恰当的被接受值

AS OF 旧序号返回旧的生命周期状态
当前查询返回已被替代 (superseded) 的状态

当前对旧世界时间的信念使用了后续证据
历史当时的信念 (belief-as-of) 则不使用

包含隐藏记录的 NOT 不会泄露存在性
COUNT 排除隐藏记录
OPTIONAL 为 null 不会暴露隐藏状态

同名概念不会被合并折叠
有歧义的模式别名执行失败
精确模式引用执行成功

游标第 2 页使用相同的认知快照
权限撤销使游标失效 / 受到限制

原始路径遍历存储的命题
原始路径并不意味着信念被接受

重复执行 BELIEF 读取不会强化记忆
```

---
# 263. 开放世界测试用例 (Open-World Fixtures)

```text
对 P 无可见证据:
    BELIEF P → insufficient

微弱证据:
    BELIEF P → uncertain

强拒绝断言:
    BELIEF P → rejected

强支持与反对并存:
    BELIEF P → contested

无原始命题:
    原始 FIND → 0 行
    完全接地的 BELIEF → 1 个 insufficient 投影
```

---
# 264. 治理测试用例 (Governance Fixtures)

```text
调用者可以投影合规判定结果
调用者无法读取机密证据

BELIEF:
    accepted + 脱敏遮蔽的解释

原始 FIND Evidence:
    无隐藏内容暴露

COUNT Evidence:
    无机密记录计数泄露
```

---
# 265. 历史 ACL 测试用例 (Historical ACL Fixture)

```text
记录在序号 10 时为公开
记录现在为机密
调用者缺乏机密访问权限

AS OF SEQ 10:
    现在依然被隐藏
```

历史时间绝不能绕过当前的治理策略。

---
# 266. 模式测试用例 (Schema Fixture)

```text
序号 10:
    "Person" 别名 → package@2/Person

序号 20:
    别名变更 / 默认 package@3

AS OF SEQ 10:
    本地 "Person" 使用历史环境进行解析

精确 @2 引用:
    独立于别名稳定解析
```

---
# 267. 谓词变量测试用例 (Predicate Variable Fixture)

原生 v2：

```prolog
FIND(?pred)
WHERE {
  (?subject, ?pred, ?object)
}
```

返回精确的谓词引用。

兼容模式可以单独暴露 v1 本地名称。

---
# 268. 结构测试用例 (Structural Fixture)

```text
Experience 拥有 3 个有序的 Step

STRUCTURAL has_step
→ 3 个虚拟引用行
索引分别为 0, 1, 2

绝不会凭空捏造语义命题。
```

---
# 269. 投影分数测试用例 (Projection Score Fixture)

实现返回：

```text
support.score = 0.8
score_semantics = normalized_support
```

在缺乏校准概率语义的前提下，KQL 客户端严禁 (MUST NOT) 将其标注为：

```text
80% 概率
```

---
# 270. KIP 1.x 兼容性 (KIP 1.x Compatibility)

KQL 2.0 有意保留了 KQL 1.x 的大部分内容。

保留部分：

```text
FIND(...)
WHERE {...}
Concept 子句
Proposition 三元组子句
FILTER
NOT
OPTIONAL
UNION
谓词可选分支
原始路径运算符
聚合运算
隐式分组
ORDER BY
LIMIT
CURSOR
:param 参数
解集语义
```

---
# 271. 原生 v2 破坏性语义变更 (Native v2 Breaking Semantic Changes)

重要区别：

```text
命题的存在性是原始语义状态，而非事实真值。

谓词变量绑定精确的 predicate_ref。

类型名称通过模式包进行解析。

(type, name) 不再是通用的概念唯一标识。

通用 metadata 不再是核心认识论容器。

NOT/COUNT/缺失不是认识论上的否定。

采信的信念来自于 BELIEF 投影。
```

---
# 272. v1 的 `metadata.confidence` (v1 `metadata.confidence`)

v1 查询：

```prolog
FILTER(?link.metadata.confidence > 0.9)
```

无法总是机械地直接翻译为单一的 v2 字段。

原因：

```text
单个命题
可能关联多个不同主体 / 置信度的断言。
```

---
# 273. 迁移翻译 (Migration Translation)

取决于查询意图，v2 等效写法可以是：

```text
查询 Assertion.confidence
```

或者：

```text
查询 BELIEF 的 support/status
```

当语义存在歧义时，兼容层应当发出告警。

---
# 274. v1 命题事实视图 (v1 Proposition Fact View)

兼容性配置规范可以 (MAY) 将传统事实回忆上下文中所使用的：

```prolog
(?s, "p", ?o)
```

翻译为被接受的投影关系。

但在原生 v2 中，原始查询保持真值中立。

---
# 275. v1 路径查询 (v1 Path Query)

传统的路径查询假定存储的链路行为类似于事实。

兼容模式在可行时可以选用已接受信念的遍历策略。

原生 v2 路径查询保持为原始查询。

复杂的信念路径迁移可能需要显式重写查询。

---
# 276. v1 SEARCH 工作流 (v1 SEARCH Workflow)

保留经过验证的成熟工作流：

```text
先用 SEARCH 进行接地
然后进行结构化 FIND
```

但面向用户的事实性问答在接地后通常应当追加：

```text
BELIEF / BELIEF SLOT
```

---
# 277. 模型优先入门指南 (Model-First Primer)

一份面向智能体的简明 KQL 2.0 入门指南：

```text
读取原始状态:
  FIND(...) WHERE {...}

概念:
  ?x {type:"Person", name:"Alice"}

原始命题:
  ?p (?s, "predicate", ?o)
  存在性 != 信念采信

断言:
  ?a ASSERTION {proposition:?p, stance:"support"}

证据:
  ?e EVIDENCE {evidence_class:"tool_result"}

活动:
  ?a ACTIVITY {activity_class:"inference"}

结构引用:
  ?r STRUCTURAL (?source, "has_step", ?target)

信念投影:
  ?b BELIEF (?s, "predicate", ?o)
  状态 = accepted | rejected | contested | uncertain | insufficient

槽位信念:
  ?slot BELIEF SLOT (?s, "predicate")

现实世界时间:
  FOR TIME :t

历史认知状态:
  AS OF SEQ :seq

投影上下文:
  WITH EPISTEMIC {purpose:"answer_user", explanation:"summary"}

牢记原则:
  缺失 != 为假
  原始命题 != 采信信念
  SEARCH 分数 != 置信度
  当前治理策略始终控制可见性
```

这保持了足够紧凑的体积，非常适合 Prompt 提示词工程。

---
# 278. 常用查询模式：当前偏好 (Common Query Pattern: Current Preference)

```prolog
FIND(?slot)
WHERE {
  ?person {id: :person_id}

  ?slot BELIEF SLOT (
    ?person,
    "prefers_interface_theme"
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---
# 279. 常用查询模式：原始偏好历史 (Common Query Pattern: Raw Preference History)

```prolog
FIND(
  ?value,
  ?a.stance,
  ?a.confidence,
  ?a.asserted_at,
  ?a.lifecycle.status
)
WHERE {
  ?person {id: :person_id}

  ?p (
    ?person,
    "prefers_interface_theme",
    ?value
  )

  ?a ASSERTION {
    proposition: ?p
  }
}
ORDER BY ?a.asserted_at DESC
LIMIT 100
```

---
# 280. 常用查询模式：当前项目状态 (Common Query Pattern: Current Project Status)

```prolog
FIND(?slot)
WHERE {
  ?project {id: :project_id}
  ?slot BELIEF SLOT (?project, "status")
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "ledger"
}
```

---
# 281. 常用查询模式：历史项目状态信念 (Common Query Pattern: Historical Project Status Belief)

```prolog
FIND(?slot)
WHERE {
  ?project {id: :project_id}
  ?slot BELIEF SLOT (?project, "status")
}
AS OF SEQ :seq
FOR TIME :world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  include_historical: true,
  explanation: "ledger"
}
```

---
# 282. 常用查询模式：陈述的主张证据 (Common Query Pattern: Evidence for Claim)

```prolog
FIND(
  ?a,
  ?e,
  ?citation.role,
  ?e.evidence_class,
  ?e.observed_at
)
WHERE {
  ?p PROPOSITION (id: :proposition_id)

  ?a ASSERTION {
    proposition: ?p
  }

  ?citation STRUCTURAL (?a, "evidence", ?e)
}
ORDER BY ?e.observed_at DESC
LIMIT 100
```

---
# 283. 常用查询模式：来源分歧 (Common Query Pattern: Source Disagreement)

```prolog
FIND(
  ?actor,
  ?a.stance,
  ?a.confidence,
  ?a.asserted_at
)
WHERE {
  ?p PROPOSITION (id: :proposition_id)

  ?a ASSERTION {
    proposition: ?p,
    asserted_by: ?actor
  }
}
ORDER BY ?a.asserted_at DESC
```

---
# 284. 常用查询模式：失败经验 (Common Query Pattern: Failed Experiences)

```prolog
FIND(
  ?exp,
  ?exp.attributes.goal,
  ?exp.attributes.outcome_summary,
  ?exp.facets["MnemonicState"].salience
)
WHERE {
  ?exp {type: "Experience"}

  FILTER(
    ?exp.attributes.outcome_status == "failure"
  )
}
ORDER BY
  ?exp.facets["MnemonicState"].salience DESC,
  ?exp._system.updated_at DESC
LIMIT 20
```

---
# 285. 常用查询模式：经验轨迹 (Common Query Pattern: Experience Trajectory)

```prolog
FIND(
  ?step,
  ?edge.index,
  ?step.attributes.kind,
  ?step.attributes.summary
)
WHERE {
  ?exp {id: :experience_id}

  ?edge STRUCTURAL (
    ?exp,
    "has_step",
    ?step
  )
}
ORDER BY ?edge.index ASC
```

---
# 286. 常用查询模式：溯源活动 (Common Query Pattern: Provenance Activity)

```prolog
FIND(
  ?activity,
  ?activity.activity_class,
  ?activity.started_at
)
WHERE {
  ?activity ACTIVITY {
    outputs: :element_id
  }
}
ORDER BY ?activity.started_at DESC
```

---
# 287. 常用查询模式：当前未知状态 (Common Query Pattern: Current Unknown)

```prolog
FIND(?belief)
WHERE {
  ?person {id: :person_id}

  ?belief BELIEF (
    ?person,
    "has_allergy",
    "penicillin"
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "high",
  explanation: "summary"
}
```

若无支撑依据：

```text
status = insufficient
```

智能体绝不能武断回答“无过敏”。

---
# 288. 常用查询模式：推演情景 (Common Query Pattern: Scenario)

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (
    :deployment,
    "will_succeed",
    true
  )
}
FOR TIME :planned_time
WITH EPISTEMIC {
  purpose: "scenario",
  risk: "high",
  include_hypothetical: true,
  explanation: "ledger"
}
```

---
# 289. 常用查询模式：审计当时 vs. 现在的差异 (Common Query Pattern: Audit the Then-vs-Now Difference)

历史查询：

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :service,
    "status"
  )
}
AS OF SEQ :old_seq
FOR TIME :old_time
WITH EPISTEMIC {
  purpose: "historical_audit"
}
```

当前对历史的重建查询：

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :service,
    "status"
  )
}
FOR TIME :old_time
WITH EPISTEMIC {
  purpose: "historical_audit"
}
```

对比两者的结果差异。

---
# 290. 常用查询模式：联想发现后再投影信念 (Common Query Pattern: Associative Discovery Then Belief)

原始发现：

```prolog
FIND(?p, ?pred, ?neighbor)
WHERE {
  ?p (:entity_id, ?pred, ?neighbor)
}
LIMIT 50
```

随后选择性地投影相关候选命题：

```prolog
FIND(?belief)
WHERE {
  ?p PROPOSITION (id: :prop_id)
  ?belief BELIEF (?p)
}
WITH EPISTEMIC {
  purpose: "answer_user"
}
```

---
# 291. 查询规划原则 (Query Planning Principle)

KQL 是声明式的。

子句编写顺序仅用于提高可读性。

只要可观察的语义保持完全一致，引擎可以对以下操作重新排序：

```text
索引查找 (index lookup)
连接操作 (join)
FILTER 过滤
投影操作 (projection)
```

---
# 292. 安全敏感的重排序 (Security-Sensitive Reordering)

物理规划器必须 (MUST) 严格保留逻辑规则：

```text
治理可见性过滤优先于用户可见的逻辑效应
```

如果计数本身会造成信息泄露，规划器绝不能通过“先计算隐藏行数再在后续脱敏”的方式进行优化。

---
# 293. 认识论投影规划器 (Epistemic Projection Planner)

引擎可以对多个 `BELIEF` 候选投影进行批量批处理。

在单次查询内部必须保证：

```text
相同的快照
相同的策略
相同的有效时间
相同的主体上下文
```

---
# 294. 避免投影 N+1 问题 (Projection N+1 Avoidance)

引入 `BELIEF SLOT` 原语的部分初衷，正是为了让引擎能够在单次优化投影中求值冲突集，而不是让智能体发出大量独立的零散调用。

---
# 295. 查询确定性 (Query Determinism)

对于相同的：

```text
空间快照 (Space snapshot)
模式上下文 (Schema context)
可见治理视图 (visible Governance view)
认识论策略 / 版本 (Epistemic Policy/version)
有效时间 (valid time)
意图 / 风险 (purpose/risk)
查询本身
```

确定性投影策略应当 (SHOULD) 返回完全相同的结构化结果。

如果策略有意采用非确定性模型，该策略必须声明该属性以供审计。

---
# 296. 模型辅助投影 (Model-Assisted Projection)

实现可以 (MAY) 使用模型来评估证据质量。

此时投影输出应当标识出：

```text
投影方法 / 版本
```

达到满足审计要求的详细程度。

KQL 语法不暴露隐藏的模型推理过程。

---
# 297. 查询可复现性边界 (Query Reproducibility Boundary)

在以下情况下，未来完美的确定性重放可能无法实现：

```text
外部模型版本不可用
策略依赖外部状态
证据已被物理清理
```

KQL 应当如实呈现这一局限性，而不是虚假宣称绝对确定性。

---
# 298. 查询可解释性 (Query Explainability)

KQL 最终可以通过 META/运行时支持查询执行计划：

```text
EXPLAIN QUERY
```

这不同于：

```text
认识论解释台账 (Epistemic explanation ledger)。
```

---
# 299. 查询计划 vs. 信念解释 (Query Plan vs. Belief Explanation)

```text
查询计划:
    数据库如何执行 KQL

信念台账:
    认识论投影为何得出该状态判定
```

切勿混淆这两者。

---
# 300. 读取权限类别 (Read Authority Classes)

治理策略可以区分以下权限：

```text
discover
read
search
project
```

KQL 操作必须要求具备相应的权限能力。

---
# 301. 原始 FIND 权限 (Raw FIND Authority)

根据返回的字段，要求具备：

```text
discover/read
```

权限。

---
# 302. BELIEF 权限 (BELIEF Authority)

要求具备：

```text
project
```

权限，并且可以在内部使用额外的特权投影规则。

---
# 303. SEARCH 权限 (SEARCH Authority)

要求具备：

```text
search
```

权限，且始终属于 META/接地层级。

---
# 304. 历史查询权限 (Historical Authority)

根据空间策略，历史读取可能需要额外的权限：

```text
audit/history
```

---
# 305. 原始起源字段权限 (Raw Origin Authority)

查询：

```text
_system.origin
```

可能要求具备：

```text
read_raw_origin
```

权限，而非普通读取权限。

---
# 306. 治理历史 (Governance History)

详细的授权 (Grant)/策略 (Policy) 历史通过治理/META 审计接口进行查询，而不是将治理记录作为普通概念进行查询。

---
# 307. 模式历史 (Schema History)

`AS OF` 在需要时会自动重建历史模式上下文。

直接的模式包历史属于 META 层级。

---
# 308. 查询导入的认知内容 (Querying Imported Cognition)

在存储且可见的前提下，原始 KQL 可以检查：

```text
import provenance (导入溯源)
source refs (源引用)
import Activities (导入活动)
```

---
# 309. 导入断言的信念判定 (Imported Assertion Belief)

`BELIEF` 在目的端本地认识论策略下对导入的断言进行求值。

它不会将源端的投影状态直接复用为目的端状态。

---
# 310. 导入中的 `$self` 处理 (Imported `$self`)

普通的胶囊合并将源端的 self 映射为远程行动主体。

因此：

```prolog
?self {name: "$self"}
```

始终在其绑定规则下指向目的端配置文件的本地 self 身份，而非导入的源端 self。

---
# 311. 恢复上下文 (Restore Context)

在经过验证的同大脑恢复后，配置文件/治理策略可以重新绑定自传体身份。

KQL 本身并不决定该身份映射。

---
# 312. KQL 与记忆空间 (KQL and MemorySpace)

基线查询在由请求/会话上下文指定的单个解析后的空间内执行：

```text
MemorySpace
```

---
# 313. 严禁隐式跨空间查询 (No Implicit Cross-Space Query)

KQL 不会静默遍历多个空间。

跨空间查询需要显式的未来/联邦能力或受治理的共享视图。

---
# 314. 空间不是图过滤器 (Space Is Not a Graph Filter)

切勿将：

```text
space_id
```

仅仅建模为另一个由用户控制的 `FILTER`。

空间解析是执行/安全上下文的组成部分。

---
# 315. 外部跨空间引用 (Foreign References)

如果实现支持外部空间引用（Foreign Space References），解引用它们需要显式的功能能力/治理授权。

基线 KQL 将外部引用视为引用值，而不是自动遍历。

---
# 316. 查询胶囊暂存区 (Querying Capsule Staging)

处于隔离检疫/暂存状态的导入记录不属于普通回忆（Recall）查询宇宙，除非审查策略显式授予了访问权限。

---
# 317. 搜索索引延迟 (Search Index Lag)

如果 SEARCH 是最终一致性的，新提交的记录可能在模糊 SEARCH 中暂时缺失，但在规范 KQL 中已立即可查。

基于回执/ID 的 KQL 是已提交状态的最终权威。

---
# 318. KQL 强读取路径 (KQL Strong Read Path)

对正确性敏感的智能体工作流应当 (SHOULD) 使用规范的快照一致性 KQL 读取路径。

切勿将近似搜索索引中的未命中作为唯一性或真值的判定依据。

---
# 319. 查询与学习 (Query and Learning)

KQL 查询结果可能会影响智能体的行为。

但这本身并不意味着大脑发生了学习。

学习需要产生持久的未来行为改变。

---
# 320. 记录检索结果 (Recording Retrieval Outcome)

如果一次检索产生了因果上的重要影响：

```text
decision (决策)
action (行动)
outcome (结果)
```

形成机制后续可以记录一条经验（Experience）或活动（Activity）。

KQL 本身始终保持只读。

---
# 321. 因果效用评估 (Causal Utility Evaluation)

大脑基准测试可以对比评估：

```text
启用记忆查询
vs.
消融去除记忆
```

KQL 提供可观察的检索结果，但并不定义学习评估基准。

---
# 322. KQL 核心不变式 (KQL Invariants)

以下为规范性设计目标：

1. KQL 是严格只读的。
2. 原生 `FIND` 查询的是可见的原始认知状态。
3. 原始命题的存在性并不意味着信念被接受。
4. `BELIEF` 是虚拟认识论投影，不是持久化的核心状态。
5. `BELIEF SLOT` 是在相同认识论模型之上针对冲突集/值的便捷聚合。
6. 完全接地的 BELIEF 目标即使在未持久化命题时也可以返回 `insufficient`。
7. 查询绝不会仅仅为了进行投影而创建命题。
8. `accepted`、`rejected`、`contested`、`uncertain`、`insufficient` 严格保留认识论模型的语义定义。
9. 无可见匹配项并不等同于认识论上的拒绝。
10. `NOT` 表示无可见匹配项，而非事实为假。
11. `OPTIONAL` 为 null 表示无可见匹配项，而非事实为假。
12. `COUNT=0` 表示零个可见匹配项，而非事实为假。
13. 当前治理策略在用户可见的逻辑运算执行之前过滤查询宇宙。
14. 历史 `AS OF` 绝不能绕过当前的访问治理策略。
15. 历史认识论重建可以将历史治理作为认知上下文，但当前治理仍控制输出的可见性。
16. `AS OF` 表达认知事务时间。
17. `FOR TIME` 表达用于投影的现实世界有效时间。
18. `AS OF` 与 `FOR TIME` 是相互独立的两个时钟。
19. “当前对当时的信念”与“当时持有的信念”可以分别独立表达。
20. 查询结果明确标识实际读取的认知快照。
21. 本地模式别名实现确定性解析。
22. 原生返回的模式/谓词标识均为精确引用。
23. 有歧义的模式别名执行失败，严禁主观猜测。
24. 历史本地别名默认采用历史模式环境进行解析。
25. 精确模式引用规避别名漂移风险。
26. 原生 v2 中谓词变量绑定精确的谓词引用。
27. 概念的 `name` 不是全局唯一标识。
28. 结构引用可被查询，而无需将其转化为语义命题。
29. 结构描述符是虚拟的，不会自动成为持久化元素。
30. 配置文件记忆类型仍属于带类型的概念。
31. 切面访问经过模式解析与有效性验证。
32. 原始命题路径遍历并不意味着信念被接受。
33. 基线 KQL 不定义自动的多跳信念分数传播算法。
34. BELIEF 投影目标必须是有界的。
35. 投影策略/版本可外部标识以供审计。
36. 数值信念分数必须声明其语义定义。
37. 支持/反对分数绝不能默认假定为概率。
38. 认识论解释绝不需要私有的隐藏思维链。
39. 投影解释可根据治理策略进行脱敏遮蔽。
40. 无原始证据的投影仅在显式治理策略授权下允许。
41. SEARCH 检索分数不是认识论置信度。
42. SEARCH 保持为接地/联想检索，与精确 KQL 严格分离。
43. 聚合运算在获得授权的可见解集合之上执行。
44. 隐藏元素不会通过 count/order/filter/not/optional 泄露。
45. 查询本身不会强化记忆。
46. 查询不会将访问统计数据变更为认知语义状态。
47. 游标分页具有快照稳定性。
48. 游标不会保留已被撤销的陈旧权限。
49. 游标绑定到规范化查询/上下文，不能跨不兼容请求复用。
50. 历史不可用时显式报错，严禁静默替换为当前状态。
51. 已物理清理的历史内容绝不凭空伪造。
52. 提交/变更历史属于引擎底层状态，不自动成为普通 KQL 图数据。
53. KQL 默认在单个记忆空间内执行。
54. 外部/跨空间遍历属于显式能力，而非隐式默认行为。
55. 只读 KQL 不会自动执行外部 Blob/网络拉取。
56. 强制执行证据载荷与系统资源上限约束。
57. 只要底层语义依然有效，保留 KIP 1.x 的 FIND/FILTER/OPTIONAL/UNION/聚合/排序/限制等概念。
58. KIP 1 兼容性行为不重新定义原生 v2 的原始语义。
59. 大脑应当在面向用户的事实性主张中采用认识论查询，并在适当时使用原始查询进行审计/调试。
60. 查询语法应当保持足够紧凑精炼，以确保 LLM 生成的可靠性。

---
# 323. 形式化语法草案 (Formal Grammar Sketch)

非规范性 EBNF 风格语法草案：

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
        (* 仅匹配：ENSURE PROPOSITION / ASSERT 拒绝该形式 *)

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
        (* 内层变量必须已绑定到某个命题 *)
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
        (* 原始谓词路径 (§90) 仅在 proposition_tuple 内合法；
           BELIEF / BELIEF SLOT 只接受裸的 predicate_atom *)

predicate_atom :=
    string | parameter | variable

path_quantifier :=
    "{" integer ("," integer?)? "}"
```

规范性的机器可读语法为
[`../grammar/KIP-2.0-KQL.ebnf`](../grammar/KIP-2.0-KQL.ebnf)，本草案是它的阅读辅助。
正式的作用域/类型规则将单独规范。

---
# 324. 推荐解析规则 (Recommended Parsing Rule)

协议关键字在 ASCII 范围内不区分大小写；规范书写形式为全大写。

模式符号与字符串值根据其自身定义保持大小写敏感。

---
# 325. 变量语法 (Variable Syntax)

保留：

```text
?identifier
```

遵循与 v1 兼容的标识符规则，除非后续进一步扩展。

---
# 326. 参数语法 (Parameter Syntax)

保留：

```text
:identifier
```

用于安全绑定的参数。

---
# 327. 对象模式变量 (Object Pattern Variables)

对象模式可以 (MAY) 包含已绑定的变量作为字段值。

示例：

```prolog
?a ASSERTION {
  proposition: ?p,
  asserted_by: ?actor
}
```

引用类型字段将绑定其所引用的元素。

---
# 328. 列表字段绑定 (List Field Binding)

对于列表类型的核心字段，直接字段绑定语义可以是由实现定义的简写形式。

当涉及：

```text
index (索引)
role (角色)
reference metadata (引用元数据)
```

时，可移植的遍历应当 (SHOULD) 使用 `STRUCTURAL`。

---
# 329. 推荐的结构偏好 (Recommended Structural Preference)

优先使用：

```prolog
STRUCTURAL (?a, "evidence", ?e)
```

而不是依赖特定引擎的列表展平机制。

这能够产生可预测的解集。

---
# 330. 模式空对象 (Pattern Empty Object)

允许写法：

```prolog
?e EVIDENCE {}
```

以匹配所有可见的证据记录。

引擎资源上限限制依然适用。

---
# 331. 类型模式验证 (Type Pattern Validation)

模式感知的模式字段在执行前完成验证。

拼写错误应当快速失败。

---
# 332. 原始查询示例 — 完整认识论记录 (Raw Query Example — Full Epistemic Record)

```prolog
FIND(
  ?p,
  ?a,
  ?actor,
  ?a.stance,
  ?a.mode,
  ?a.confidence,
  ?a.valid_time,
  ?a.lifecycle.status
)
WHERE {
  ?subject {id: :subject_id}

  ?p (
    ?subject,
    :predicate_ref,
    ?object
  )

  ?a ASSERTION {
    proposition: ?p,
    asserted_by: ?actor
  }
}
ORDER BY ?a.asserted_at DESC
LIMIT 100
```

---
# 333. 认识论查询示例 — 当前答案 (Epistemic Query Example — Current Answer)

```prolog
FIND(?slot)
WHERE {
  ?subject {id: :subject_id}

  ?slot BELIEF SLOT (
    ?subject,
    :predicate_ref
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "low",
  explanation: "summary"
}
```

---
# 334. 认识论查询示例 — 高风险行动 (Epistemic Query Example — High-Risk Action)

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (
    :service_id,
    "healthy",
    true
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "production_deployment",
  risk: "high",
  explanation: "ledger"
}
```

过时的、历史高置信度的观察数据若未通过当前时效性规则的检验，对于当前部署可能仍会产生：

```text
uncertain
or
insufficient
```

---
# 335. 历史查询示例 — 当时采信的信念 (Historical Query Example — What We Believed Then)

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project_id,
    "status"
  )
}
AS OF SEQ :then_seq
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  include_historical: true,
  explanation: "ledger"
}
```

---
# 336. 当前重建示例 — 现在对当时的信念 (Current Reconstruction Example — What We Now Believe About Then)

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project_id,
    "status"
  )
}
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_research",
  explanation: "ledger"
}
```

---
# 337. 当前结果 vs. 历史结果 (Current vs. Historical Result)

前两个查询之间的结果差异并不是错误。

后续出现的证据完全可以合法地修正当前对历史的理解。

---
# 338. 模型行为规则 (Model Behavior Rule)

当智能体为普通事实性回答生成 KQL 时：

```text
如果存在直接的谓词 / 槽位
    优先使用 BELIEF SLOT

如果是完全接地的 yes/no 命题
    优先使用 BELIEF

如果是排查分歧 / 溯源信息
    查询原始 Assertions/Evidence

如果是解析未知实体 / 主题
    首先使用 SEARCH
```

---
# 339. 为什么 BELIEF SLOT 对智能体至关重要 (Why BELIEF SLOT Is Important for Agents)

若无此特性，智能体将不得不自行：

```text
查询所有候选命题
理解模式基数约束
发现冲突
对每个候选进行投影
聚合判定状态
处理零候选情况
```

这会在每个智能体的 Prompt 中重复实现认识论模型的逻辑。

`BELIEF SLOT` 将这一认知处理保留在它理应归属的中枢内部。

---
# 340. 为什么原始 FIND 依然不可或缺 (Why Raw FIND Still Matters)

如果 KQL 仅暴露 BELIEF SLOT：

```text
大脑能够回答问题
但无法反思检查自身。
```

一个真正的认知系统必须同时拥有：

```text
信念 (belief)
以及
产生该信念的底层认知状态。
```

---
# 341. 为什么 KQL 没有 `FIND FACT` (Why KQL Does Not Have `FIND FACT`)

KIP 2.0 有意避免将 `Fact` 作为原始存储种类。

“事实”是具有上下文依赖性的认识论解释。

当应用需要被接受的事实视图时，请使用：

```text
BELIEF status = accepted
```

---
# 342. “已接受”不代表客观真理 (Accepted Does Not Mean Objective Truth)

KQL 在原生输出中绝不能将：

```text
accepted (已接受)
```

重命名为：

```text
true (客观真)
```

---
# 343. “已拒绝”不代表宾语字面量为 False (Rejected Does Not Mean Object Literal False)

```text
stance reject P (立场拒绝命题 P)
```

不同于：

```text
谓词宾语 = false
```

KQL 完整保留这两种形式。

---
# 344. 查询布尔值 (Querying Boolean Value)

```prolog
?slot BELIEF SLOT (?bob, "is_vegetarian")
```

当 `false` 是语义宾语值时，可能返回已接受的值：

```text
false
```

另外，宾语为 `true` 的命题在认识论上可以被 `rejected`。

这些属于相关联但结构不完全相同的表达。

---
# 345. 查询矛盾布尔状态 (Querying Contradictory Boolean State)

设计良好的投影策略/模式可以将：

```text
(Bob, is_vegetarian, true)
(Bob, is_vegetarian, false)
```

关联为互斥的候选命题。

`BELIEF SLOT` 是正确的查询接口。

---
# 346. 查询多行动主体 (Querying Multiple Actors)

原始查询：

```prolog
FIND(?actor, ?a.stance)
WHERE {
  ?a ASSERTION {
    proposition: :p,
    asserted_by: ?actor
  }
}
```

能够揭示分歧而无需强行消解矛盾。

---
# 347. 查询大脑本地视图 (Querying Brain's Local View)

BELIEF 查询：

```prolog
?belief BELIEF (id: :p)
```

在本地当前/历史策略下消解分歧。

---
# 348. 查询来源大脑的投影 (Querying Source Brain's Projection)

如果导入的胶囊包含源端的投影产物，它属于普通的导入认知/溯源数据。

切勿将其与：

```text
目的端的 BELIEF
```

相混淆。

---
# 349. 查询安全方程 (Query Security Equation)

```text
VisibleRawResult
    =
    KQL(
      GovernanceFilter(
        SpaceState(snapshot)
      )
    )
```

对于投影：

```text
VisibleBeliefResult
    =
    GovernedProjection(
      AuthorizedVisible/PrivilegedProjectionInputs,
      EpistemicPolicy,
      snapshot,
      world_time
    )
```

---
# 350. 查询时间方程 (Query Time Equation)

```text
Raw State Time (原始状态时间)
    =
    AS OF snapshot_seq
```

```text
Epistemic World Time (认识论世界时间)
    =
    FOR TIME valid_at
```

---
# 351. 模式映射方程 (Schema Equation)

```text
Local Query Symbol (本地查询符号)
    ↓
Schema Environment (模式环境)
    ↓
Exact Schema Symbol Ref (精确模式符号引用)
```

持久化/返回的原生标识始终保持精确。

---
# 352. 开放世界方程 (Open-World Equation)

```text
No Visible Match (无可见匹配)
    ≠
False (为假)
```

```text
Insufficient (证据不足)
    ≠
Rejected (已拒绝)
```

---
# 353. 原始 / 认识论关系方程 (Raw/Epistemic Equation)

```text
Proposition (命题)
    =
    能够言说什么 (What can be said)

Assertion (断言)
    =
    谁对此持有什么立场 (Who takes what stance toward it)

BELIEF (信念)
    =
    该大脑当前应当将什么视作信念 (What this Brain should currently treat as belief)
```

---
# 354. 搜索 / 信念方程 (Search/Belief Equation)

```text
SEARCH score (搜索分数)
    =
    retrieval relevance (检索相关性)
```

```text
BELIEF status (信念状态)
    =
    epistemic interpretation (认识论解释)
```

严禁将二者互相替代。

---
# 355. 记忆 / 认识论方程 (Mnemonic/Epistemic Equation)

```text
memory_strength (记忆强度)
    =
    accessibility (可访问性)
```

```text
belief status/confidence (信念状态 / 置信度)
    =
    epistemic state (认识论状态)
```

生动的虚假记忆是可能存在的。

KQL 必须能够对其进行表征。

---
# 356. 效用 / 权限方程 (Utility/Authority Equation)

```text
Skill utility (技能效用)
    ≠
Skill influence authority (技能影响力权限)
```

在授权范围内 KQL 可以检索这两者。

治理策略决定后者。

---
# 357. 历史安全方程 (Historical Security Equation)

```text
当前历史数据可见性
    =
    Current Governance (当前治理)
    ∩
    Requested Historical State (请求的历史状态)
```

而不是：

```text
仅凭历史上的旧 ACL。
```

---
# 358. 最终总体架构 (Final Architecture)

```text
                     Agent Question (智能体提问)
                                  │
                                  ▼
                 Grounding / SEARCH (接地 / 搜索)
                                  │
                                  ▼
                   Exact KQL Query (精确 KQL 查询)
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
              ▼                                       ▼
         Raw Pattern                             BELIEF Pattern
        (原始模式)                               (信念模式)
              │                                       │
              │                                 Epistemic Policy
              │                                (认识论策略)
              │                                       │
              │                                 Evidence/Trust
              │                                (证据 / 信任)
              │                                       │
              └───────────────────┬───────────────────┘
                                  │
                                  ▼
                           AS OF Snapshot
                           (AS OF 快照)
                                  │
                                  ▼
                         Current Governance
                            (当前治理)
                                  │
                                  ▼
                       Visible Query Universe
                           (可见查询宇宙)
                                  │
                                  ▼
                      FILTER / JOIN / OPTIONAL
                                  │
                                  ▼
                         Aggregate / ORDER
                            (聚合 / 排序)
                                  │
                                  ▼
                       LIMIT / Stable Cursor
                            (限制 / 稳定游标)
                                  │
                                  ▼
                    Result + Query Context
                       (结果 + 查询上下文)
                                  │
                                  ▼
                        Agent Synthesis
                          (智能体综合生成)
```

物理引擎可以在安全前提下调整各阶段的执行顺序。

概念上的分离必须严格保留。

---
# 359. 核心最终原则 (Final Principle)

KIP 1.x 使智能体能够自然地提问：

> 哪些节点和链路匹配该图模式？

KIP 2.0 还必须使智能体能够自然地提问：

> 该链路仅仅是一种语义可能性，还是有谁断言了它？

> 谁断言了它？

> 存在哪些证据支持或质疑它？

> 这些证据是独立的，还是派生自同一个来源？

> 大脑是接受它、拒绝它、保持争议、保持不确定，还是根本未知？

> 大脑当前对该语义槽位采信了什么值？

> 在最新修正发生之前，大脑采信了什么？

> 凭借现在的认识，大脑对那个早期的现实世界状态持何种信念？

> 究竟是哪一个精确的模式版本赋予了该查询确切含义？

> 实际读取的究竟是哪一个认知快照？

> 查询是否包含了未授权检查的隐藏数据？

> 我能否在不接收机密证据的前提下获得安全的投影结果？

> 如果查询未返回任何内容，这代表为假、未知、被隐藏，还是仅仅无可见匹配项？

> 我能否在遍历原始图结构的同时，避免意外将每条路径当作可信真理？

答案不应依赖 Prompt 提示词的民间偏方。

它应当在协议层面具备明确的表达力。

统领全局的核心设计思想是：

> **真正的记忆查询语言，必须将“检索大脑中包含的内容”与“询问大脑采信的信念”清晰分离。**

KQL 2.0 在使这一区别显式化的同时，完整保留了使 KIP 1.x 在 LLM 实践中极其高效紧凑的图原生语言体系。
