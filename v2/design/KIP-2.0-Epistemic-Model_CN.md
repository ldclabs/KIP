# KIP 2.0 认识论模型设计 (Epistemic Model)

**[English](./KIP-2.0-Epistemic-Model.md) | [中文](./KIP-2.0-Epistemic-Model_CN.md)**

## 规范状态 (Status)

**认识论模型提案 / 前规范草案 (Epistemic Model Proposal / Pre-Specification Draft)**

本文档定义了 KIP 2.0 的认识论语义：认知中枢（Cognitive Nexus）如何解释多个断言（Assertion）、证据（Evidence）、溯源链（Provenance Chains）、信任策略（Trust Policies）、时态上下文（Temporal Context）、冲突矛盾（Contradictions）和不确定性（Uncertainty），从而为智能体生成**上下文相关的信念视图（Context-Dependent Belief View）**。

它直接构建于以下文档之上：

- [KIP-2.0-Architecture_CN.md](../KIP-2.0-Architecture_CN.md)
- [KIP-2.0-Core-Data-Model_CN.md](./KIP-2.0-Core-Data-Model_CN.md)

核心数据模型（Core Data Model）定义了**存储了什么 (What is stored)**：

```text
Concept       (概念)
Proposition   (命题)
Assertion     (断言)
Evidence      (证据)
Activity      (活动)
MemorySpace   (记忆空间)
```

本文档则定义了**这些存储对象如何参与信念的形成 (How those stored objects participate in belief)**。

其核心对象是**认识论投影（Epistemic Projection）**：

```text
认识论投影 (Epistemic Projection) =
    针对一个或多个命题，基于受安全策略约束、受时间约束、
    受使用目的约束对“断言 + 证据 + 历史溯源 + 信任体系”进行的综合解释推导。
```

核心设计目标是：

> **赋能智能体保留相互冲突的主张而不提前粗暴塌陷合并，评估为何某些主张应获得比其他主张更大的影响力，在不篡改历史的前提下修订信念，并以能够安全指导未来推理与行动的形式暴露不确定性。**

KIP Core **不**强制规定统一的真理算法、贝叶斯模型、投票公式、信任评分或证据加权方程。

KIP 2.0 标准化的是：

1. 认识论信号的具体语义；
2. 区分历史、假设、已撤回和当前有效断言的适用资格规则（Eligibility Rules）；
3. 感知溯源图的证据依赖关系；
4. 来源独立性与防重复计算原则；
5. 冲突分类体系；
6. 信念修订语义；
7. 认识论投影的输入/输出规范契约；
8. 解释性生成要求；
9. 防止通过复制、转述、派生、导入或自我声明高置信度而导致认识论自我放大的安全不变式。

---

# 0. 规范性用词定义 (Normative Language)

关键字 **必须 (MUST)**、**严禁 (MUST NOT)**、**必需 (REQUIRED)**、**应当 (SHOULD)**、**不得 (SHOULD NOT)**、**可以 (MAY)** 和 **可选 (OPTIONAL)** 用于指示未来 KIP 2.0 规范中预期的协议要求。

除非另有明确说明，具体的连线格式仍仅供说明参考。

---

# 1. 核心主张 (Executive Thesis)

记忆大脑绝不能将存储的每一条陈述都视为同等为真。

真实的认知状态往往呈现如下结构：

```text
命题 P (Proposition P)
    │
    ├── 断言 A1 (Assertion A1)
    │      source (来源): Alice
    │      stance (立场): support (支持)
    │      mode (模式): stated (陈述)
    │      confidence (置信度): 0.95
    │      evidence (证据): E1
    │
    ├── 断言 A2 (Assertion A2)
    │      source (来源): MonitoringTool (监控工具)
    │      stance (立场): reject (拒绝)
    │      mode (模式): observed (观测)
    │      confidence (置信度): 0.90
    │      evidence (证据): E2
    │
    └── 断言 A3 (Assertion A3)
           source (来源): Brain (大脑)
           stance (立场): uncertain (存疑)
           mode (模式): inferred (推理)
           evidence (证据): A1 + A2 的溯源血统
```

认知中枢不应机械地询问：

> 哪条记录获胜了？

而应当询问：

```text
具体的问题是什么？ (What is the question?)
是谁在发起询问？ (Who is asking?)
出于什么目的？ (For what purpose?)
在客观世界的哪个时间点？ (At what world time?)
截至认知系统的哪个时间点？ (As of what cognitive time?)
哪些断言具备有效资格？ (Which Assertions are eligible?)
底层到底支撑了哪些客观证据？ (What Evidence actually underlies them?)
哪些证据是真正独立的？ (Which Evidence is independent?)
在当前上下文中，相关来源的可信度如何？ (How trustworthy are the relevant origins?)
哪些主张在语义上存在冲突？ (Which claims conflict semantically?)
还残留多少不确定性？ (How much uncertainty remains?)
```

唯有在此之后，大脑才能获得一个信念视图。

因此：

```text
存储的断言 (Stored Assertion)
    ≠
接受的信念 (Accepted Belief)
```

且：

```text
断言置信度 (Assertion.confidence)
    ≠
投影置信度 (Projection confidence)
    ≠
来源信任度 (Source trust)
```

---

# 2. 认识论状态 (Epistemic State)

MemorySpace 的**认识论状态（Epistemic State）**是认知状态中与信念形成相关的子集：

```text
命题 (Propositions)
断言 (Assertions)
证据 (Evidence)
活动 / 溯源图 (Activities / provenance)
身份绑定 (Identity bindings)
模式约束 (Schema constraints)
治理可见的信任策略 (Governance-visible trust policy)
时态上下文 (Temporal state)
```

一个实用的抽象表示为：

```text
E_state =
    (
      P,          命题集 (propositions)
      A,          断言集 (assertions)
      E,          证据集 (evidence)
      V,          溯源有向无环图 (provenance DAG)
      T,          信任上下文 (trust context)
      S,          模式语义 (schema semantics)
      τ,          时态上下文 (temporal context)
      G           治理可见性 (governance visibility)
    )
```

认识论投影是作用于该状态的一个函数：

```text
Projection =
    F(E_state, principal, purpose, query_scope, policy)
```

函数 `F` 取决于策略与 Profile。

KIP 标准化的是其契约与不变式，而非单一的通用公式。

---

# 3. 基础认识论概念区分 (Foundational Epistemic Distinctions)

KIP 2.0 明确区分以下不同概念。

## 3.1 命题 (Proposition)

```text
正在考量的客观陈述是什么？
```

真值中立 (Truth-neutral)。

---

## 3.2 断言 (Assertion)

```text
谁或什么主体对该命题持有什么认识论立场？
```

具备历史可归属性 (Historically attributable)。

---

## 3.3 证据 (Evidence)

```text
引用了什么观测结果、制品、产出、证言或衍生项作为依据？
```

证据可能是微弱的、强有力的、误导性的、重复的、高度相关的、不完整的、陈旧的或错误的。

---

## 3.4 历史溯源 (Provenance)

```text
该证据或断言是如何产生的？
```

溯源描述推导演变过程。

它本身并不直接确立信任。

---

## 3.5 信任体系 (Trust)

```text
针对该命题、目的和上下文，该来源 / 渠道 / 过程应当被赋予多大的认识论权威？
```

信任具有高度上下文相关性 (Trust is contextual)。

---

## 3.6 断言置信度 (Assertion Confidence)

```text
断言本身表达/支持其立场的力度有多强？
```

属于断言本地的属性。

---

## 3.7 投影支持度 (Projection Support)

```text
在综合评估合格断言、证据、信任、独立性、时态、冲突和溯源之后，
当前投影支持或反对某个命题的综合强度有多大？
```

相对于评估主体而言。

---

## 3.8 信念状态 (Belief Status)

```text
accepted     (已接受)
rejected     (已拒绝)
contested    (存在争议)
uncertain    (存疑)
insufficient (证据不足)
```

这是投影计算的结果，而非底层存储的真理。

---

# 4. 最重要原则：断言置信度不等于大脑信念 (The Most Important Rule: Assertion Confidence Is Not Brain Belief)

假设一个不可信的外部导入源写入：

```text
Assertion:
    proposition = P
    stance = support
    confidence = 0.99
```

目标端大脑**严禁 (MUST NOT)** 直接得出结论：

```text
belief(P) = 0.99
```

因为 `0.99` 可能仅仅意味着：

> 远端断言者声称自己拥有极高的确定性。

实际的认识论投影必须综合考量：

```text
身份保证度 (identity assurance)
系统来源真实性 (origin integrity)
来源信任度 (source trust)
证据质量 (evidence quality)
证据独立性 (evidence independence)
时态时效性 (temporal relevance)
反面证据 (counter-evidence)
语义冲突 (semantic conflict)
投影目的 (projection purpose)
```

概念形式：

```text
projection_support(P)
    =
    evaluate(
      assertion_confidence,
      trust,
      evidence,
      provenance,
      independence,
      time,
      conflict,
      policy
    )
```

没有单一因素能够占据绝对支配地位。

---

# 5. 置信度语义 (Confidence Semantics)

## 5.1 断言置信度 (Assertion Confidence)

`Assertion.confidence` 回答：

> **在所陈述的条件下，该断言对其自身立场的支持力度有多强？**

它不强制要求是一个校准后的概率值。

它可以源自：

```text
人类自我报告的确定性 (human self-reported certainty)
模型推理置信度 (model inference confidence)
测量仪器置信度 (measurement confidence)
源文档声明的置信度 (source document confidence)
导入的远端置信度 (imported remote confidence)
大脑推导得出的置信度 (Brain-derived confidence)
```

投影**严禁 (MUST NOT)** 假设不同主体产生的值是在同一尺度上校准的。

---

## 5.2 缺失置信度 (Missing Confidence)

断言**可以 (MAY)** 省略置信度。

缺失置信度代表：

```text
没有可用的显式断言级数值置信度
```

它并不自动代表：

```text
0.0
0.5
不可信 (untrusted)
```

投影策略（Projection Policy）决定如何处理缺失的置信度。

---

## 5.3 置信度校准 (Confidence Calibration)

投影策略**可以 (MAY)** 应用针对主体/模式/领域的校准机制。

概念形式：

```text
calibrated_signal =
    calibrate(
      raw_assertion_confidence,
      asserted_by,
      mode,
      domain,
      predicate,
      历史校准记录
    )
```

示例：

```text
对于系统性过度自信（频繁给出 0.9）的模型
    → 置信度可能会被向下校准

对于经过验证具有 99.9% 精度的测量系统
    → 置信度可以被赋予更强的权重
```

校准属于策略层面的认知处理，而非 Core 原生数据的原地篡改。

---

## 5.4 置信度在历史上不可变 (Confidence Is Historically Immutable)

如果新证据改变了大脑的信念：

```text
严禁直接修改旧断言的置信度
```

推荐采用：

```text
新的断言 (new Assertion)
+
废弃替代 / 派生关系 (supersession/derivation relation)
+
新的溯源记录 (new provenance)
```

这完整保留了信念的演变轨迹。

---

# 6. 信任体系 (Trust)

## 6.1 信任定义 (Definition)

信任是一种上下文相关的评估：

> **针对这一特定目的和语义上下文，应当赋予该主体、调用者、证据源、溯源流程或信道多大的认识论影响力？**

信任不是一个普适的、静态的单一性格评分。

---

## 6.2 信任具有上下文相关性 (Trust Is Contextual)

示例：

```text
用户自我陈述
    个人偏好 (personal preference)   → 潜在的权威来源
    医学诊断 (medical diagnosis)     → 不能自动视为权威

部署监控工具
    服务器健康 (server health)       → 潜在的权威来源
    员工积极性 (employee motivation) → 无关且无权威

带签名的外部智能体
    完整性 / 作者身份 (integrity/authorship) → 经过验证
    陈述内容的真实性 (truth)                 → 并未因此得到证明
```

---

## 6.3 信任评估的输入 (Trust Inputs)

信任解析器（Trust Resolver）**可以 (MAY)** 综合考虑：

```text
语义主体身份 (semantic actor identity)
身份保证度 (identity assurance)
经过身份验证的调用主体 (authenticated origin principal)
系统来源信道 (origin channel)
证据类别 (Evidence class)
活动类别 (Activity class)
领域 / 谓词 (domain/predicate)
使用目的 (purpose)
历史可靠性记录 (historical reliability)
声明的专业能力 (declared competence)
验证核验状态 (verification status)
利益冲突情况 (conflict of interest)
溯源完整性 (provenance integrity)
导入状态 (import status)
本地安全策略 (local policy)
```

不强制要求统一定义唯一的计算公式。

---

## 6.4 信任向量 (Trust Vector)

成熟的实现**可以 (MAY)** 将信任评估为一个多维向量而非单一数值：

```text
identity_assurance      (身份保证度)
domain_competence       (领域专业能力)
historical_reliability  (历史可靠性)
process_integrity       (处理过程完整性)
provenance_integrity    (溯源完整性)
independence            (独立性)
```

投影策略随后可以在内部将其折算为一个综合影响力权重。

KIP 不强制要求将该向量持久化存储。

---

## 6.5 信任解析结果契约 (Trust Result Contract)

信任解析器**应当 (SHOULD)** 能够解释其推导结果。

示意：

```json
{
  "subject": "concept:monitoring-tool",
  "context": {
    "predicate": "deployment_status",
    "purpose": "production-diagnosis"
  },
  "trust": {
    "score": 0.92,
    "semantics": "normalized_influence",
    "reasons": [
      "已认证的工具调用主体 (authenticated tool principal)",
      "与事后事故验证具有极高的历史一致性 (high historical agreement with post-incident validation)",
      "直接相关的业务领域 (directly relevant domain)"
    ]
  }
}
```

数值评分是可选的。

明确的解释原因比虚假的数值精度重要得多。

---

# 7. 信任不等于行动执行权限 (Trust Is Not Action Authority)

认识论信任回答：

> 该信息是否应当影响我的信念？

行动执行权限回答：

> 该记忆是否可以直接驱动或执行外部行为？

二者截然不同。

外部安全研究员对某个漏洞的报告可能高度可信，但其本身具有：

```text
零 Shell 命令执行权限
```

安全治理层定义行动执行权限。

认识论投影严禁自我提权。

---

# 8. 身份保证度 (Identity Assurance)

对声称主体的信任部分取决于其身份归属是否可信。

区分：

```text
asserted_by = Alice
```

与：

```text
引擎底层确认经过认证的写入者确实是 Alice
```

核心数据模型在设计上明确解耦：

```text
Assertion.asserted_by
_system.origin.principal_id
```

投影**应当 (SHOULD)** 考量二者之间的对齐关系。

可能的状态：

```text
经过验证的主体绑定 (verified actor binding)
强推导的主体绑定 (strongly inferred actor binding)
未经核验的声称归属 (unverified attribution)
相互冲突的归属 (conflicting attribution)
匿名主体 (anonymous)
```

未经核验的身份**应当不得 (SHOULD NOT)** 仅仅因为 `asserted_by` 包含一个权威显赫的名字就获得高信任度。

---

# 9. 证据语义 (Evidence Semantics)

证据不是一个简单的二元开关。

一项证据在多个维度上可能存在显著差异：

```text
相关性 (relevance)
直接性 (directness)
完整性 (integrity)
专一性 (specificity)
时效性 (freshness)
覆盖面 (coverage)
独立性 (independence)
可核验性 (verifiability)
溯源完整度 (provenance completeness)
```

认识论模型将这些标准化为评估维度，而非通用的静态数值权重。

---

# 10. 证据角色 (Evidence Roles)

断言可以引用具有明确角色的证据：

```text
support    (支持)
challenge  (质疑 / 反驳)
context    (背景上下文)
```

解释时需结合断言自身的立场（Stance）。

示例：

```text
Assertion stance = reject
Evidence role = support
```

表示：

> 证据支持了该“拒绝”立场。

`context` 提供解释背景，除非策略特别提升，否则其本身不计为支持依据。

---

# 11. 直接证据与派生证据 (Direct and Derived Evidence)

## 11.1 直接证据 (Direct Evidence)

当证据记录了目标现象且不主要依赖于另一项认识论主张时，该证据相对直接。

示例：

```text
传感器测量数据 (sensor measurement)
工具调用执行结果 (tool result)
用户关于自身偏好的陈述 (user's own statement of preference)
带有数字签名的一手原始文档 (signed primary document)
现场直接观测 (direct observation)
```

直接并不代表客观正确。

---

## 11.2 派生证据 (Derived Evidence)

当证据是通过以下过程生成时，属于派生证据：

```text
内容摘要提取 (summarization)
逻辑推理 (inference)
数据聚合 (aggregation)
分类处理 (classification)
跨事件语义巩固 (cross-event consolidation)
模型抽取 (model extraction)
格式转换 (transformation)
```

派生证据在认识论上完全继承对其输入源的依赖。

---

# 12. 证据不可凭空增殖原则 (No Evidence Multiplication Principle)

这是 KIP 2.0 认识论的核心不变式：

> **对相同的底层证据进行转换、复制、摘要、转述、索引或重复声明，绝不会产生独立的相互佐证。**

示例：

```text
原始文章 A (Original Article A)
      │
      ├── 摘要 B (Summary B)
      ├── 智能体 C 阅读 A 并撰写笔记 C (Agent C reads A and writes note C)
      ├── 智能体 D 阅读 B 并撰写笔记 D (Agent D reads B and writes note D)
      └── 搜索索引片段 E (Search index snippet E)
```

若所有路径均回溯至文章 A，大脑**严禁 (MUST NOT)** 将其计为五个独立的佐证来源。

概念逻辑：

```text
认识论根节点 roots(B) = {A}
认识论根节点 roots(C) = {A}
认识论根节点 roots(D) = {A}
认识论根节点 roots(E) = {A}
```

---

# 13. 认识论独立性守恒 (Conservation of Epistemic Independence)

派生断言在认知上可能极具价值。

它可以：

```text
高度压缩 (compress)
泛化规律 (generalize)
建立关联 (connect)
提供解释 (explain)
提升召回检索效率 (make retrieval easier)
```

但派生本身绝不能凭空创造出额外的独立认识论分量。

如果：

```text
A3 = inference(A1, A2)
```

则认识论投影**严禁 (MUST NOT)** 将：

```text
A1 + A2 + A3
```

视为对同一结论的三次独立确认。

A3 的支持根源完全依赖于 A1/A2 的溯源血统。

---

# 14. 溯源根节点 (Provenance Roots)

为了进行认识论评估，定义概念函数：

```text
roots(x)
```

递归向后遍历溯源图，直到达到终端或策略定义的根证据/根源。

示例：

```text
roots(原始工具观测)
    = {工具观测}

roots(工具观测的摘要)
    = {工具观测}

roots(基于 E1 和 E2 的推理)
    = roots(E1) ∪ roots(E2)
```

确切的根节点边界由策略决定。

---

# 15. 根节点类别 (Root Types)

有价值的根节点类别可以包括：

```text
直接观测事件 (direct observation event)
一手原始制品 (primary source artifact)
人类亲口证言事件 (human testimony event)
外部权威官方记录 (external authoritative record)
经过验证的工具执行 (verified tool execution)
导入的外部溯源根 (imported provenance root)
未知 / 未能解析的根 (unknown/unresolved root)
```

单一的哈希摘要并不一定等同于根节点身份。

在不同时间对相同字节内容的两次观测，在保持时态一致性的前提下可以作为两个独立的根节点，同时共享一个源制品。

---

# 16. 来源身份与观测独立性 (Source Identity vs. Observation Independence)

两项 Evidence 可以是：

```text
不同的观测事件 (different observations)
相同的来源主体 (same source)
```

或者：

```text
不同的来源主体 (different sources)
相同的上游根源 (same upstream origin)
```

这两者并不等价。

示例：

```text
Alice 在 1 月份说：“我偏好深色模式”
Alice 在 6 月份再次重申该偏好
```

这不是独立多源佐证。

但它可以提供强有力的：

```text
时态稳定性证据 (temporal stability evidence)
重复性验证证据 (repetition evidence)
偏好持久性证据 (preference persistence)
```

因此 KIP 严格区分：

```text
来源独立性 (source independence)
观测重复性 (observation repetition)
时态一致性 (temporal consistency)
```

投影与 Profile 可以对这三者采取不同的评估策略。

---

# 17. 相互佐证分组 (Corroboration Groups)

投影引擎**应当 (SHOULD)** 能够将 Evidence/Assertion 聚合为**佐证组（Corroboration Groups）**。

一个佐证组代表不应被视为完全独立支持的条目集合。

可能的聚类输入：

```text
共享相同的溯源根节点 (shared provenance root)
相同的文档哈希摘要 (same document digest)
相同的语义来源主体 (same semantic source)
相同的认证调用主体 (same authenticated principal)
相同的上游断言 (same upstream Assertion)
来自相同的导入胶囊 (same import capsule)
相同的工具执行调用 (same tool execution)
相同的观测事件 (same observation event)
已知的聚合分发关系 (known syndication relationship)
已知的推导派生链 (known derivation chain)
```

这些分组可以临时动态计算。

它们无需作为 Core 持久化元素存储。

---

# 18. 真正的独立多源佐证 (Independent Corroboration)

真正的独立多源佐证其证明力度远强于重复确认。

概念形式：

```text
E1 根节点 = 独立测量 A
E2 根节点 = 独立测量 B
E3 根节点 = 独立见证人 C
```

所提供的认识论多样性远高于：

```text
E1 根节点 = 文档 A
E2 根节点 = 文档 A
E3 根节点 = 文档 A
```

然而：

> **来源多样性是一种信号，而非真理的必然证明。**

多个不同来源可能：

```text
相互抄袭抄录 (copy each other)
串通串供 (collude)
共享同一个损坏的传感器 (share the same faulty sensor)
共享同一个错误的前提假设 (share the same mistaken assumption)
受同一个恶意攻击者控制 (be controlled by one attacker)
```

因此，单纯的来源计数多数决绝非 KIP 的认识论规则。

---

# 19. 人造共识防范 (Manufactured Corroboration)

强大的记忆大脑**必须 (MUST)** 能够抵御：

```text
单一源头
→ 衍生大量转述
→ 多个智能体反复重申
→ 形成虚假共识
```

投影**应当 (SHOULD)** 能够检测：

```text
共享的内容摘要 (shared content digest)
共享的溯源根节点 (shared provenance roots)
共享的导入血统 (shared import lineage)
已知的引用 / 转载关系 (known quoting/syndication)
相同的上游断言 (same upstream Assertion)
相同的观测活动 (same observation Activity)
```

并折叠或大幅扣减重复的认识论影响力。

---

# 20. 女巫佐证攻击防范 (Sybil Corroboration)

多个调用主体并不自动等同于多个独立的来源。

治理/信任层**可以 (MAY)** 获知：

```text
主体 A
主体 B
主体 C
```

实际上归属于同一个组织、运营商、模型集群或信任域。

投影**可以 (MAY)** 出于独立性评估目的将它们归为一组。

KIP 不强制要求实现通用的身份聚类系统。

---

# 21. 循环证据防范 (Circular Evidence)

认识论支持度绝不能通过循环依赖而自我增殖。

示例：

```text
A1 支持 P，依据是 A2
A2 支持 P，依据是 A3
A3 支持 P，依据是 A1
```

这没有产生任何独立的证明基础。

投影**必须 (MUST)** 检测溯源与依赖中的环路。

推荐处理策略：

```text
折叠强连通循环分量 (collapse strongly connected cycle)
将环路整体视为一个单一的依赖组件 (treat cycle as one dependent component)
寻找外部引入的根节点 (find external incoming roots)
若无外部根节点：
    不赋予任何独立的证据增强加成 (assign no independent evidential amplification)
```

溯源实现在通常情况下**应当 (SHOULD)** 保持为 DAG，但导入或遗留数据可能会打破该假设。

---

# 22. 证据依赖图 (Evidence Dependency Graph)

针对某次投影计算，构建认识论依赖图：

```text
断言 (Assertion)
    │
    ▼
引用的证据 (cited Evidence)
    │
    ▼
生成该证据的活动 (generating Activities)
    │
    ▼
输入的断言 / 证据 (input Assertions / Evidence)
    │
    ▼
根证据 / 根源 (root Evidence / origin)
```

该图谱的存在是为了回答：

```text
到底是什么在实际支撑这一信念？
哪些支持是重复冗余的？
哪些支持实际上依赖于结论本身？
哪些支持来自外部导入？
哪些支持来自真正独立的现场观测？
```

---

# 23. 证据质量评估维度 (Evidence Quality Dimensions)

投影**可以 (MAY)** 从以下维度评估证据：

## 23.1 相关性 (Relevance)

证据是否确实与目标命题具有直接关系？

---

## 23.2 直接性 (Directness)

从证据到目标现象之间隔了多少层认识论转换步骤？

---

## 23.3 完整性 (Integrity)

内容与来源的完整性是否能够得到密码学或机制层面的验证？

---

## 23.4 专一性 (Specificity)

证据是精准支持了当前命题，还是仅仅支持了某个宽泛的宏观话题？

---

## 23.5 时态相关性 (Temporal Relevance)

证据是否适用于所查询的客观世界时间点？

---

## 23.6 覆盖面 (Coverage)

观测过程如果处于正常状态，是否具备合理概率在现象存在时捕获到它？

---

## 23.7 独立性 (Independence)

它是否确实增加了全新的认识论根节点？

---

## 23.8 溯源完整度 (Provenance Completeness)

其完整的推导演变链路是否能够被充分检查与审计？

---

# 24. 缺乏证据不等于证据表明不存在 (Absence of Evidence Is Not Evidence of Absence)

KIP 2.0 默认遵循开放世界假定（Open-World Assumption）。

如果没有合资格的断言支持：

```text
命题 P
```

计算结果通常应当是：

```text
insufficient (证据不足)
```

而不是：

```text
rejected (已拒绝)
```

同理：

```text
未检索到 ≠ 为假
(not found ≠ false)
```

这对于所存储知识必然不完备的记忆系统而言至关重要。

---

# 25. 证明不存在的证据 (Evidence of Absence)

唯当观测过程具备有意义的检测覆盖能力时，未观测到现象才能转化为反面证据。

示例：

```text
“监控未报告服务中断”
```

唯当监控系统满足以下条件时，才能作为未发生服务中断的证据：

```text
监控处于活跃运行状态
全面覆盖了相关目标服务
在发生故障时具有极高概率能够检测到
具有新鲜实时的观测数据
```

因此，投影在将“未观测到”视作反面证据之前，**应当 (SHOULD)** 校验其覆盖面上下文。

---

# 26. 封闭世界假定例外 (Closed-World Exceptions)

某些有明确边界的上下文可以合法地采用封闭世界假定（Closed-World Assumption）。

示例：

```text
权威完整花名册中的成员列表
完整目录快照返回的文件列表
完整配置快照中已启用的特性开关
```

投影策略**可以 (MAY)** 为特定的谓词/来源/快照声明：

```text
closed_world_scope (封闭世界作用域)
```

封闭世界语义**必须 (MUST)** 显式声明。

它绝不能成为通用 KIP 记忆系统的默认策略。

---

# 27. 断言有效资格 (Assertion Eligibility)

在聚合计算之前，投影必须判定哪些断言具备有效资格。

断言通常基于以下维度进行资格审查：

```text
治理可见性权限 (governance visibility)
生命周期状态 (lifecycle status)
客观世界有效时间 (world valid time)
认知系统当前时间 (as-of cognitive time)
模式类别 (mode)
上下文兼容性 (context compatibility)
身份消歧解析 (identity resolution)
投影使用目的 (projection purpose)
模式合法性 (schema validity)
溯源可用性 (provenance availability)
```

资格判定与信任度评估并不相同。

---

# 28. 生命周期资格 (Lifecycle Eligibility)

针对当前的实时投影：

```text
active (活跃)      → 通常具备资格
retracted (已撤回) → 不作为活跃支持；保留用于解释与历史审计
superseded (已替代)→ 不作为已被替代上下文的活跃支持；属于历史
expired (已过期)   → 通常不作为当前支持
```

历史回溯投影可以显式包含早期的生命周期状态。

---

# 29. 撤回机制 (Retraction)

撤回代表：

> 早期的断言已被显式撤回。

撤回直接影响当前的有效资格。

它不会物理抹除：

```text
命题本身 (the Proposition)
原始断言记录 (the original Assertion)
客观证据 (the Evidence)
该主体曾经相信/陈述过该内容的事实历史
```

投影解释**应当 (SHOULD)** 严格区分：

```text
“已被声明者撤回 (was retracted)”
```

与：

```text
“被他人反驳质疑 (was contradicted by someone else)”
```

---

# 30. 废弃替代机制 (Supersession)

废弃替代代表：

> 在特定的主体/上下文/时态解释下，一个较新的断言取代了较旧的断言。

典型场景：

```text
同一主体修订自身信念 (same actor revises belief)
同一系统更新具有时效性的状态 (same system updates a time-sensitive state)
后期的推理推翻并取代早期的推理 (later inference supersedes earlier inference)
```

**严禁 (SHOULD NOT)** 仅仅因为两个断言存在分歧就自动推断存在废弃替代关系。

---

# 31. 冲突对立不等于废弃替代 (Contradiction Is Not Supersession)

示例：

```text
Alice 支持 P
Carol 拒绝 P
```

这是观点冲突。

没有任何一个断言替代了另一个断言。

投影可以将命题 P 标记为存在争议（contested）。

---

# 32. 时态演变不一定构成冲突 (Temporal Evolution Is Not Necessarily Contradiction)

示例：

```text
P1 = (Alice, timezone, "+08:00")
有效期至 2026-09-01

P2 = (Alice, timezone, "+01:00")
有效期自 2026-09-01 起
```

这两条陈述可以同时被系统接受。

它们的生效时间区间在实质上互不重叠。

冲突检测引擎在将它们标记为矛盾之前，**必须 (MUST)** 结合时间维度进行综合研判。

---

# 33. 上下文差异不一定构成冲突 (Contextual Difference Is Not Necessarily Contradiction)

示例：

```text
Alice 在编写代码时偏好深色模式。
Alice 在户外阅读时偏好浅色模式。
```

如果上下文环境不同，两者可以同时为真。

冲突检测必须深入考量：

```text
context_refs (上下文引用)
predicate semantics (谓词语义)
domain qualifiers (领域限定词)
valid time (生效时间)
```

而不仅仅依据字面上的对立。

---

# 34. 冲突分类体系 (Conflict Types)

KIP 2.0 识别并支持若干在概念上截然不同的冲突类别。

## 34.1 直接立场冲突 (Direct Stance Conflict)

针对完全相同的命题：

```text
support (支持) vs reject (拒绝)
```

---

## 34.2 函数型单值冲突 (Functional-Value Conflict)

相同主语 + 函数型单值谓词 + 重叠的上下文与时间：

```text
(Alice, timezone, "+08:00")
(Alice, timezone, "+01:00")
```

当 Schema 明确声明只能应用单一取值时。

---

## 34.3 互斥取值冲突 (Exclusive-Value Conflict)

谓词 Schema 声明了若干不可并存的互斥选项。

---

## 34.4 基数越界冲突 (Cardinality Conflict)

在有界基数约束下，同时被接受的值数量超过了上限。

---

## 34.5 类型 / 模式冲突 (Type/Schema Conflict)

不同断言推导出了互不兼容的 Schema 分类。

---

## 34.6 时态重叠冲突 (Temporal Conflict)

在重叠的生效时间区间内，不同主张陈述了互不兼容的状态。

---

## 34.7 因果与逻辑冲突 (Causal/Logical Conflict)

领域或 Schema 逻辑规则识别出了互不相容的命题。

KIP Core 本身不执行任意复杂的自动定理证明。

唯有显式声明或 Profile 支撑的规则才应触发此类冲突。

---

# 35. 冲突集合 (Conflict Sets)

投影**应当 (SHOULD)** 针对**冲突集合（Conflict Set）**进行整体推理，而非总是孤立考量单一命题。

示例：

```text
冲突集:
    P1 = 项目状态为 "active"
    P2 = 项目状态为 "archived"
    P3 = 项目状态为 "deleted"
```

当状态属于单值属性时。

投影综合评估：

```text
对各个备选选项的支持力度
对各个备选选项的反对力度
时态与上下文的兼容性
```

进而最终判定状态。

冲突集可以动态临时生成。

---

# 36. 模式在冲突检测中的作用 (Schema Role in Conflict Detection)

Schema Package **应当 (SHOULD)** 最终能够声明如下约束：

```text
函数型单值谓词 (functional predicate)
最大基数 (max cardinality)
互斥值枚举 (exclusive values)
不相交类型 (disjoint types)
逆谓词关系 (inverse predicates)
对称谓词关系 (symmetric predicates)
值域范围约束 (value domains)
时态适用性规则 (temporal applicability)
```

认识论模型消费并执行这些约束。

它并不重新定义 Schema 描述语言。

---

# 37. 布尔对立逻辑 (Boolean Opposition)

针对布尔值属性：

```text
P_true  = (Bob, is_vegetarian, true)
P_false = (Bob, is_vegetarian, false)
```

Schema 可以声明它们在重叠的生效时间内互斥。

此外：

```text
reject(P_true)
```

属于对肯定命题的认识论拒绝。

除非在当前投影上下文中该谓词被明确声明为完备二值的，否则它**并不自动等同于**：

```text
support(P_false)
```

这完整保持了开放世界假定。

---

# 38. 假设性断言 (Hypothetical Assertions)

`mode = hypothetical` 代表：

> 该主张是刻意为情景推演和模拟分析而表达的，不代表对客观世界的实质承诺。

标准的现实世界事实投影**应当 (SHOULD)** 在已接受事实中排除假设性断言。

情景模拟投影**可以 (MAY)** 将其纳入考量。

---

# 39. 预测性断言 (Predicted Assertions)

`mode = predicted` 代表面向未来的前瞻性信念。

当前的现实事实投影不应将预测误当作观测。

前瞻预测投影可以对其进行评估。

一旦预测的时间节点过去，大脑可以将预测与后续的实际证据进行比对，生成校准与经验学习制品。

原始的预测记录保持完全不变。

---

# 40. 外部导入断言 (Imported Assertions)

`mode = imported` 或带有导入溯源，代表目标端完整保留了一份远端的认识论制品。

导入操作并不蕴含本地的主观认可。

投影综合审查：

```text
数字签名与完整性 (signature/integrity)
远端主体身份 (remote actor identity)
远端历史溯源 (remote provenance)
本地信任策略 (local trust policy)
客观证据可用性 (evidence availability)
使用目的 (purpose)
```

一个带有有效签名的断言依然可能是：

```text
虚假的 (false)
不安全的 (unsafe)
不相关的 (irrelevant)
过时的 (outdated)
不可信的 (untrusted)
```

---

# 41. 口头与陈述性断言 (Stated Assertions)

`mode = stated` 记录证言或言论声明。

对于自我指涉的主题，证言可能具备极高的权威性。

示例：

```text
Alice 说：
“我偏好深色模式。”
```

对于外部客观事实领域，同一主体可能仅具备有限的权威性。

模式类别与语义主题两者都至关重要。

---

# 42. 观测性断言 (Observed Assertions)

`mode = observed` 代表断言直接基于某个观测过程。

它并不意味着：

```text
自动为真 (automatically true)
自动获得高信任 (automatically high trust)
```

投影依然可以审查：

```text
仪器仪表的可靠性 (instrument reliability)
工具来源的真实性 (tool origin)
检测覆盖面 (coverage)
测量误差 (measurement error)
人为篡改风险 (tampering)
观测时间点 (observation time)
```

---

# 43. 推理型断言 (Inferred Assertions)

`mode = inferred` **必须 (MUST)** 完整保留依赖溯源链路。

派生断言**应当 (SHOULD)** 明确标识：

```text
所属活动 (Activity)
输入的断言与证据 (input Assertions/Evidence)
算法或策略标识符（在重要时）(method/policy identifier)
```

投影严禁将推理结果计为其自身前提条件的独立多源佐证。

---

# 44. 语义主体断言与大脑主观认可 (Semantic Actor Assertion vs. Brain Endorsement)

KIP 2.0 允许大脑清晰记住：

> Alice 相信命题 P。

而大脑自身并不相信 P。

形式化表示为：

```text
Assertion A1
    proposition = P
    asserted_by = Alice
    stance = support
```

大脑当前对 P 的接受状态是认识论投影计算的结果。

如果大脑决定将自身的主观持久信念固化下来，它会创建一个独立的派生断言：

```text
Assertion A2
    proposition = P
    asserted_by = $self
    mode = inferred
```

并带有指向 A1 及相关证据的完整溯源。

这两个层次**严禁 (MUST NOT)** 相互混淆。

---

# 45. 持久化自我信念 (Durable Self-Belief)

当持久的信念连续性具有重要价值时，大脑**可以 (MAY)** 将特定的认识论投影计算结果固化为 `$self` 断言。

推荐的应用场景：

```text
稳定的语义知识 (stable semantic knowledge)
重要的自我模型信念 (important self-model belief)
长期的决策前提条件 (long-lived decision premise)
具有重大影响的组织级知识 (high-impact organizational knowledge)
```

严禁对每次投影都无节制地进行快照固化。

否则会导致：

```text
图谱数据恶性膨胀 (graph explosion)
自我确认死循环 (self-confirmation loops)
重复加权计算 (double counting)
陈旧过时的派生信念积压 (stale derived beliefs)
```

---

# 46. 投影快照不得自我佐证 (Projection Snapshot Must Not Self-Corroborate)

如果：

```text
A_self = projection(A1, A2, E1, E2)
```

未来的投影**必须 (MUST)** 保持：

```text
roots(A_self) = roots(A1, A2, E1, E2)
```

A_self 绝不能被计为一个全新的独立来源。

否则会导致如下致命缺陷：

```text
源证据
→ 产生投影快照
→ 后续投影同时看到源证据与快照
→ 信念凭空自我强化
```

这是一个严重的认识论反馈漏洞。

---

# 47. 认识论投影 (Epistemic Projection)

## 47.1 投影定义 (Definition)

**认识论投影（Epistemic Projection）**是对原始认识论状态的一种只读、上下文相关的综合解释推导。

它回答：

> 在给定的调用主体、使用目的、时间时钟、安全策略和可见认知状态下，应当将哪些内容视为已接受、已拒绝、存在争议、存疑或证据不足？

---

# 48. 投影本质上是视图 (Projection Is a View)

投影的计算结果并不是权威的 Core 持久化存储。

它们可以：

```text
按需动态计算 (computed on demand)
进行中间缓存 (cached)
临时物化 (materialized temporarily)
显式持久化为派生断言 (persisted explicitly as derived Assertions)
```

但权威的底层状态始终是基础的“断言 + 证据 + 溯源”。

---

# 49. 投影请求契约 (Projection Request)

请求契约示意：

```json
{
  "space_id": "space-1",
  "principal_id": "principal-agent",

  "scope": {
    "proposition_ids": ["prop-1"],
    "subject_ids": [],
    "predicate_refs": []
  },

  "purpose": "answer_user | action_planning | audit | research | diagnosis",

  "valid_at": "2026-08-13T13:00:00Z",
  "as_of_transaction": "tx-or-time",

  "context_refs": [],

  "policy_ref": "epistemic-policy-id",

  "risk": "low | medium | high",

  "options": {
    "include_historical": false,
    "include_hypothetical": false,
    "include_explanations": true,
    "include_evidence_ledger": true
  }
}
```

确切的连线字段名称稍后确定。

---

# 50. 投影输入依赖 (Projection Inputs)

在概念上，一次投影计算至少依赖于：

```text
经过认证的调用主体 (authenticated principal)
所属记忆空间 (MemorySpace)
可见的命题集 (visible Propositions)
合资格的断言集 (eligible Assertions)
可见的证据集 (visible Evidence)
溯源有向无环图 (provenance graph)
模式语义与约束 (schema semantics)
信任策略配置 (trust policy)
客观世界有效时间 (world valid time)
认知系统当前时间 (cognitive as-of time)
使用目的 (purpose)
风险级别与上下文 (risk/context)
```

投影**严禁 (MUST NOT)** 访问治理层对当前消费主体所拒绝的隐藏数据。

---

# 51. 使用目的决定解释结果 (Purpose Matters)

相同的原始数据在不同目的下可能产生不同的投影结果。

示例：

```text
目的：日常闲聊对话
    用户自我陈述可能就已足够

目的：医疗决策支持
    需要极其严苛的证据支撑

目的：生产环境发布
    优先采信最新、经过验证的工具直接观测

目的：历史追溯审计
    绝不折叠已被废弃替代的断言
```

这绝不是逻辑不一致。

这是真正的上下文认识论。

---

# 52. 风险敏感型投影 (Risk-Sensitive Projection)

高风险高后果的行动可能要求：

```text
更高的信任门槛 (higher trust)
更完整的溯源链路 (better provenance)
更充分的独立多源佐证 (more independent corroboration)
更新鲜实时的证据 (fresher Evidence)
更低的未决冲突容忍度 (lower unresolved conflict)
显式的人工复核确认 (explicit human review)
```

KIP 不定义一刀切的通用阈值。

阈值由具体的投影策略定义。

---

# 53. 投影策略 (Projection Policy)

投影策略是一组可明确标识的认识论规则集合。

概念组成：

```text
policy_id               (策略标识)
version                 (策略版本)
purpose/risk            (目的与风险适配度)
trust resolver          (信任解析器)
mode eligibility        (模式资格规则)
temporal rules          (时态计算规则)
source-independence     (来源独立性规则)
conflict rules          (冲突裁决规则)
aggregation method      (聚合推导算法)
decision thresholds     (决策判定阈值)
explanation requirements(解释生成要求)
```

其存储与治理表示归属于 KIP-2.0-Governance.md。

---

# 54. 策略版本是审计的必需项 (Policy Version Is Required for Audit)

投影生成的解释**应当 (SHOULD)** 明确标识：

```text
policy_id           (策略 ID)
policy_version      (策略版本)
projection_method   (投影方法)
as_of time/tx       (认知系统时间/事务)
valid_at            (客观世界时间)
```

否则，未来的观察者将无法解释为何在策略演进后相同的原始记忆产生了不同的信念视图。

---

# 55. 投影处理流水线 (Projection Pipeline)

一次健壮的投影计算在概念上遵循如下阶段：

```text
1. 治理可见性过滤 (Governance visibility)
2. 语义接地解析 (Semantic grounding)
3. 冲突集合扩展 (Conflict-set expansion)
4. 生命周期资格审查 (Lifecycle eligibility)
5. 时态时效资格审查 (Temporal eligibility)
6. 模式与上下文资格审查 (Mode/context eligibility)
7. 溯源拓扑展开 (Provenance expansion)
8. 根节点与佐证分组 (Root/corroboration grouping)
9. 信任度动态评估 (Trust evaluation)
10. 证据质量评估 (Evidence-quality evaluation)
11. 正反力量聚合 (Support/opposition aggregation)
12. 不确定性分析 (Uncertainty analysis)
13. 信念状态分类判定 (Belief-state classification)
14. 解释生成 (Explanation generation)
```

具体实现可以针对执行性能进行优化。

但必须严格保全上述语义。

---

# 56. 阶段 1 — 治理可见性过滤 (Stage 1 — Governance Visibility)

优先进行安全过滤。

未经授权的元素严禁参与：

```text
投影计算 (projection)
统计计数 (counts)
检索召回 (search)
冲突提示 (conflict hints)
解释内容 (explanations)
```

除非策略显式允许暴露经过脱敏的存在性信号。

---

# 57. 阶段 2 — 语义接地解析 (Stage 2 — Semantic Grounding)

解析并对齐：

```text
目标命题 (target Proposition)
备选竞争命题 (alternative Propositions)
相关 Schema 与谓词 (relevant schema/predicate)
规范合并后的 Concept (canonical merged Concepts)
```

原始审计模式必须完整保留历史 ID。

---

# 58. 阶段 3 — 冲突集合扩展 (Stage 3 — Conflict-Set Expansion)

利用 Schema 与谓词语义识别竞争对立的命题。

示例：

```text
status = active
status = archived
```

当 status 属于函数型单值谓词时。

---

# 59. 阶段 4 — 生命周期资格审查 (Stage 4 — Lifecycle Eligibility)

清晰拆分：

```text
当前活跃主张 (current active claims)
已撤回的历史记录 (retracted history)
已被替代的历史记录 (superseded history)
已过期的适用主张 (expired applicability)
```

历史回溯与审计投影可以显式将其包含在内。

---

# 60. 阶段 5 — 时态时效资格审查 (Stage 5 — Temporal Eligibility)

评估并校验：

```text
valid_from / valid_until (生效起止时间)
observed_at (观测时间)
asserted_at (断言时间)
与查询的 valid_at 的时态交集
与查询的 as-of transaction 的认知时间对齐
```
---

# 61. 阶段 6 — 模式与上下文资格审查 (Stage 6 — Mode and Context Eligibility)

示例：

```text
hypothetical (假设性模式)
    从常规的现实事实投影中排除

predicted (预测性模式)
    包含在前瞻预测投影中，而非直接观测投影中

stated (陈述性模式)
    受主体信任度约束后允许准入

observed (观测性模式)
    受观测质量与仪器可靠性约束后允许准入

inferred (推理型模式)
    允许准入，但严格依赖其推导溯源链路
```

必须对上下文兼容性进行全面审查。

---

# 62. 阶段 7 — 溯源拓扑展开 (Stage 7 — Provenance Expansion)

通过以下链路进行递归逆向遍历：

```text
证据 (Evidence)
活动 (Activity)
输入的断言 (input Assertions)
输入的证据 (input Evidence)
导入凭证 (import receipts)
```

直到到达策略定义的根节点边界。

重点检测：

```text
环路依赖 (cycles)
溯源缺失 (missing provenance)
不可用或已脱敏遮蔽的根节点 (unavailable redacted roots)
未知的系统来源 (unknown origin)
```

---

# 63. 阶段 8 — 根节点与佐证分组 (Stage 8 — Root and Corroboration Grouping)

综合计算：

```text
溯源根节点 (provenance roots)
来源主体分组 (source groups)
观测事件分组 (observation groups)
相关性分组 (correlated groups)
```

以彻底防止重复加权计算。

---

# 64. 阶段 9 — 信任度动态评估 (Stage 9 — Trust Evaluation)

针对每个相关的认识论组件，评估其在当前具体上下文中的信任度。

信任度可针对以下对象独立评估：

```text
声明的主体 (asserted actor)
系统调用主体 (origin principal)
证据提供来源 (Evidence source)
执行工具 (tool)
活动处理过程 (Activity process)
导入数字签名者 (import signer)
身份绑定关系 (identity binding)
```

---

# 65. 阶段 10 — 证据质量评估 (Stage 10 — Evidence Quality Evaluation)

在可用时至少从以下维度评估：

```text
相关性 (relevance)
直接性 (directness)
完整性 (integrity)
专一性 (specificity)
时态时效性 (temporal relevance)
覆盖面 (coverage)
独立性 (independence)
溯源完整度 (provenance completeness)
```

---

# 66. 阶段 11 — 正反力量聚合 (Stage 11 — Support and Opposition Aggregation)

投影从两个宏观方向汇总认识论力量：

```text
对命题 P 的支持力量 (support for P)
对命题 P 的反对力量 (opposition to P)
```

反对力量可以产生于：

```text
针对命题 P 的 reject 立场断言
对在语义上互斥的备选命题的 support 断言
反面证据 (counter-Evidence)
Schema 模式冲突 (schema conflict)
```

聚合公式由具体策略定义。

---

# 67. 阶段 12 — 不确定性分析 (Stage 12 — Uncertainty Analysis)

不确定性绝不仅仅是：

```text
1 - confidence
```

产生不确定性的可能原因：

```text
缺乏客观证据 (little Evidence)
证据信任度低下 (low-trust Evidence)
正反双方势均力敌 (balanced conflict)
溯源链路缺失 (missing provenance)
主体身份存在歧义 (identity ambiguity)
观测数据陈旧过时 (stale observation)
上下文不匹配 (context mismatch)
时态时钟存在歧义 (temporal ambiguity)
模式定义存在歧义 (schema ambiguity)
检测覆盖不完全 (incomplete coverage)
导入信任未决 (unresolved import trust)
```

投影**应当 (SHOULD)** 显式暴露这些具体原因。

---

# 68. 阶段 13 — 信念状态分类判定 (Stage 13 — Belief-State Classification)

推荐的 Core 核心投影状态：

```text
accepted     (已接受)
rejected     (已拒绝)
contested    (存在争议)
uncertain    (存疑)
insufficient (证据不足)
```

---

# 69. 已接受状态 `accepted` (`accepted`)

含义：

> 在当前投影策略和上下文下，支持力量充足，且未决的反对力量低于策略规定的接受门槛。

这不代表普适的绝对真理。

---

# 70. 已拒绝状态 `rejected` (`rejected`)

含义：

> 在当前投影策略和上下文下，反对/拒绝力量足以明确拒绝该命题。

这与单纯缺乏支持证据截然不同。

---

# 71. 存在争议状态 `contested` (`contested`)

含义：

> 实质性的支持与实质性的反对力量并存共处，且该冲突未被时间、上下文或废弃替代机制所消解。

存在争议的信念依然可以呈现主导的一方。

投影应当将双方均清晰呈现。

---

# 72. 存疑状态 `uncertain` (`uncertain`)

含义：

> 存在有意义的认识论素材，但支持的质量或强度不足以作出接受或拒绝的判定。

典型成因：

```text
证据微弱 (weak evidence)
信任度低 (low trust)
推理存在歧义 (ambiguous inference)
观测陈旧过时 (stale observation)
身份对齐存疑 (identity uncertainty)
```

---

# 73. 证据不足状态 `insufficient` (`insufficient`)

含义：

> 没有足够相关或具备资格的认识论依据来表达任何有效立场。

该状态直接体现了开放世界规则：

```text
未知 ≠ 为假
(unknown ≠ false)
```

---

# 74. 可选的不可用状态 `not_applicable` (Optional `not_applicable`)

未来的 Profile **可以 (MAY)** 暴露：

```text
not_applicable
```

用于表示生效或上下文领域不适用的命题。

基准 KIP 通常可以通过解释信息来表达该语义，而无需将其作为强制要求的第六种状态。

---

# 75. 投影输出数据结构 (Projection Output)

示意形式：

```json
{
  "proposition_id": "prop-1",

  "status": "contested",

  "support": {
    "score": 0.78,
    "score_semantics": "normalized_support_not_probability",
    "assertion_ids": ["A1", "A3"],
    "root_groups": ["G1", "G2"]
  },

  "opposition": {
    "score": 0.71,
    "score_semantics": "normalized_support_not_probability",
    "assertion_ids": ["A2"],
    "root_groups": ["G3"]
  },

  "uncertainty": {
    "level": "medium",
    "reasons": [
      "双方均存在可信的独立证据 (credible independent evidence exists on both sides)",
      "最新的直接观测数据已有 4 小时历史 (latest direct observation is 4 hours old)"
    ]
  },

  "temporal": {
    "valid_at": "2026-08-13T13:00:00Z",
    "as_of_transaction": "tx-991"
  },

  "policy": {
    "id": "production-status",
    "version": "3"
  },

  "explanation": {
    "leading_factors": [],
    "warnings": []
  }
}
```

评分是**可选的 (OPTIONAL)**。

---

# 76. 必须声明评分语义 (Score Semantics Must Be Declared)

若投影输出了数值评分，**必须 (MUST)** 明确声明其具体含义。

可能的语义：

```text
ordinal_strength        (序数相对强度)
normalized_support      (归一化支持度)
calibrated_probability  (校准后的概率)
log_odds                (对数几率)
implementation_specific (实现专有语义)
```

实现**严禁 (MUST NOT)** 将通用的归一化评分伪装成校准后的概率值。

---

# 77. 支持与反对评分之和无需为 1 (Support and Opposition Scores Are Not Required to Sum to 1)

在开放世界系统中：

```text
support = 0.2
opposition = 0.1
```

可以代表：

```text
绝大部分处于未知状态
```

同理：

```text
support = 0.9
opposition = 0.85
```

可以代表：

```text
高度激烈的争议对立
```

因此：

```text
support + opposition = 1
```

绝非 KIP 的不变式。

---

# 78. 不确定性是一等公民输出 (Uncertainty Is a First-Class Output)

投影**应当 (SHOULD)** 显式暴露不确定性，而非强行输出一个单一的获胜评分。

有价值的字段：

```text
不确定性级别 / 评分 (uncertainty level/score)
不确定性具体原因 (uncertainty reasons)
缺失的证据 (missing evidence)
溯源断裂缺口 (provenance gaps)
身份歧义 (identity ambiguity)
时态歧义 (temporal ambiguity)
冲突概要 (conflict summary)
```

这对于安全可靠的行动召回（Action Recall）至关重要。

---

# 79. 解释账本 (Explanation Ledger)

启用解释功能的投影**应当 (SHOULD)** 返回一份**认识论账本（Epistemic Ledger）**。

概念结构：

```text
已接受 / 争议状态
    │
    ├── 贡献支持力量的断言 (contributing Assertions)
    │
    ├── 产生反对力量的断言 (opposing Assertions)
    │
    ├── 证据根节点 (Evidence roots)
    │
    ├── 佐证组 (Corroboration Groups)
    │
    ├── 信任决策依据 (trust decisions)
    │
    ├── 生命周期排除原因 (lifecycle exclusions)
    │
    ├── 时态排除原因 (temporal exclusions)
    │
    └── 警告与缺失信息 (warnings / missing information)
```

其目的不是为了暴露私有的模型隐藏思维链。

其核心目标是暴露外部可审计的认识论拓扑结构。

---

# 80. 解释不等于私有思维链 (Explanation Is Not Chain-of-Thought)

一个合法的解释可以表述为：

```text
之所以接受，是因为：
- 有两项经过验证的独立工具观测支持该主张；
- 唯一相反的用户陈述在当前领域的信任度较低；
- 所有证据均精准适用于所查询的时间点。
```

它不需要包含私有的 Token 级别推理。

---

# 81. 时态时效性与置信度衰减 (Temporal Relevance vs. Confidence Decay)

对于“当前实时”查询，陈旧的观测数据其参考价值可能会降低，但这并不意味着其历史可信度发生了任何减损。

示例：

```text
昨天：
    服务状态 = healthy
    以极高置信度观测得出

今天：
    没有任何新的观测数据到达
```

严禁直接篡改：

```text
Assertion.confidence 0.99 → 0.50
```

取而代之的是，当前的实时投影应用：

```text
temporal_relevance = low (时态相关性低)
```

并输出：

```text
针对当前状态判定为 uncertain / insufficient
```

旧的断言在历史上依然是一条强有力的事实主张。

---

# 82. 时效性策略 (Freshness Policy)

不同的谓词对时效性的要求截然不同。

示例：

```text
出生日期 (date_of_birth)
    时效性要求 ≈ 无要求

当前服务器健康状态 (current server health)
    时效性要求 = 分钟级

个人偏好 (personal preference)
    时效性取决于具体上下文与稳定性

工作职务 (job title)
    时效性可以是几个月
```

时效性定义归属于 Projection Policy / Schema / Profile。

不存在一刀切的通用时间衰减公式。

---

# 83. 观测时间与生效时间 (Observation Time vs. Valid Time)

某个来源可能在以下时间进行观测：

```text
observed_at = 10:00
```

而该状态在以下区间内客观有效：

```text
valid_from = 09:00
valid_until = 11:00
```

投影应使用生效时间判定世界适用性，使用观测时间判定证据时效性与可用性。

二者不可互换。

---

# 84. 断言时间与证据时间 (Assertion Time vs. Evidence Time)

一个人可以在今天就昨天发生的事件发表声明。

```text
Evidence observed_at = 昨天
Assertion asserted_at = 今天
```

两者都必须完整保留。

---

# 85. 历史认识论投影 (Historical Epistemic Projection)

历史回溯查询询问：

> 截至认知时间 T，智能体当时相信了什么？

这需要完整重构：

```text
截至 T 已经存在的断言列表
截至 T 这些断言的生命周期状态
截至 T 已经可用的证据
截至 T 适用的或显式选定的信任/投影策略版本
```

因为断言生命周期后续可能会发生流转，声明支持历史投影的一致性实现**必须 (MUST)** 保留足够的事务/变更历史以还原早期的生命周期状态。

这依赖于 KIP-2.0-Transactions.md 规范。

---

# 86. 世界历史投影 (World-Historical Projection)

这是完全不同的问题：

> 智能体现在认为在客观世界时间 T 什么是真实的？

其推导方式为：

```text
使用当前所有可用的证据
但将断言的生效时间过滤约束在时间 T 附近
```

后续发现的新证据可能会改变答案。

因此：

```text
当时相信了什么 (belief-as-of-then)
≠
现在关于当时相信什么 (current-belief-about-then)
```

KIP 2.0 在概念上必须同时支持这两者。

---

# 87. 信念修订 (Belief Revision)

当新的认识论材料改变了投影计算结果时，便发生了信念修订。

原始历史始终保持只追加的特性。

概念过程：

```text
状态 t:
  断言 A1, A2
  投影 → 接受命题 P (accepted P)

新证据 E3 到达
新断言 A3 产生

状态 t+1:
  投影 → 命题 P 存在争议 (contested P)
```

无需删除命题 P，也无需篡改 A1/A2。

---

# 88. 同一主体自身的修订 (Revision by Same Actor)

若某个主体显式改变了立场：

```text
Alice:
  1 月份支持 P
  3 月份拒绝 P
```

3 月份的断言可以废弃替代 1 月份的断言，作为 Alice 当前的有效立场。

两个断言在历史上依然清晰可见。

---

# 89. 大脑自身的信念修订 (Revision by Brain)

若大脑自身持久固化的信念发生改变：

```text
$self 断言 B1
    mode = inferred
    支持 P (support P)

随后：
$self 断言 B2
    mode = inferred
    存疑/拒绝 P (uncertain/reject P)
    supersedes B1 (替代 B1)
```

两者完整保留了大脑袋信念演变的原因。

产生活动应当关联新的证据与断言。

---

# 90. 纠错机制 (Correction)

纠错是一种特殊的修订，即来源或流程承认早期的内容存在实质错误。

推荐的历史记录形态：

```text
证据 E1
断言 A1

随后：
证据 E2 纠正 E1 (E2 corrects E1)
断言 A2 替代 A1 (A2 supersedes A1)
纠错活动 Correction 使用 E1/A1/E2 → 产出 A2
```

投影应当清晰呈现：

> 早期的声明已被纠正。

---

# 91. 无替代的单纯撤回 (Retraction Without Replacement)

来源可以在不提供新立场的情况下直接撤回断言。

此时：

```text
A1 = retracted
```

当前投影失去该支持力量。

它并不会自动增加反对力量。

---

# 92. 未消解的长期冲突 (Conflict Without Resolution)

大脑应当被允许长期保持：

```text
contested (存在争议)
```

状态。

强行提前消除冲突会破坏极其有价值的不确定性信息。

成熟的记忆大脑必须能够清晰记住：

> 我们目前尚不知道。

---

# 93. 证据分量不是简单的出现频次 (Evidence Weight Is Not Frequency Count)

错误的加权规则：

```text
每重复提及一次，置信度 += 0.05
```

正确的语义区分：

```text
同一来源的重复提及
    → 稳定性 / 记忆强化信号 (stability / mnemonic reinforcement)

真正的独立多源佐证
    → 认识论支持信号 (epistemic support)

未来成功的预测验证
    → 校准 / 信任提升信号 (calibration / trust)

矛盾对立的客观观测
    → 反对 / 修订信号 (opposition / revision)
```

---

# 94. 重复的自我陈述 (Repeated Self-Report)

对于某些谓词，同一主体在较长时间跨度内的重复陈述极具价值。

示例：

```text
Alice 在六个月内反复重申同一种偏好。
```

这能够强力支撑：

```text
偏好的稳定性 (preference stability)
```

尽管来源独立性始终只有这一个主体。

谓词/Profile 可以将重复的自我陈述定义为有意义的纵向证据。

严禁将其在全局上误当作多个独立的见证人。

---

# 95. 预测性验证 (Predictive Validation)

预测能够提供极其强大的信任与校准信号。

工作流程：

```text
断言 PRED
    mode = predicted

随后：
证据 OBS
    实际观测到了客观结果

活动 VALIDATE
    比对预测与实际结果
```

大脑/Profile **可以 (MAY)** 更新：

```text
来源校准参数 (source calibration)
模型可靠性 (model reliability)
技能效用 (Skill utility)
```

而无需篡改历史上的预测记录。

---

# 96. 工具可靠性评估 (Tool Reliability)

工具证据可以结合历史表现进行动态评估：

```text
工具历史输出 (tool outputs)
事后验证的实际结果 (later verified outcomes)
历史错误率 (error rates)
检测覆盖失效记录 (coverage failures)
篡改事故 (tampering incidents)
```

因此，对工具的信任度是持续动态演化的。

KIP 认识论模型定义了这种机制的可能性。

大脑/治理 Profile 则定义具体的学习算法。

---

# 97. 信任状态的学习与固化 (Trust Learning)

信任本身也可以表示为认知状态。

语义主张示例：

```text
(MonitorTool, reliability_for, DeploymentStatus)
```

附带断言与证据。

然而，投影系统必须严格杜绝无限制的自指提升（即某个来源断言自身高度可信从而自我提权）。

安全治理层应严格控制哪些信任状态允许影响投影计算。

---

# 98. 信任冷启动引导 (Trust Bootstrapping)

一个全新的来源可以起始于：

```text
未知信任 (unknown trust)
策略默认值 (policy default)
受限影响力 (restricted influence)
```

而不是自动为零，也不是自动完全信任。

信任可以通过以下途径增长或降低：

```text
客观核验 (verification)
历史校准 (historical calibration)
人工审批 (human approval)
独立多源佐证 (independent corroboration)
观测到的失败错误 (observed failures)
显式吊销 (revocation)
```

---

# 99. 信任吊销 (Trust Revocation)

如果某个来源遭到入侵或发生信任危机：

```text
未来的投影计算
```

可以立即大幅降低其影响力。

历史上的断言保持不变。

这是信任度绝不能永久硬编码复制到每个 Assertion 上的另一个关键原因。

---

# 100. 信任策略的演进 (Trust Policy Evolution)

如果信任策略发生变更：

```text
相同的原始断言
→ 计算出不同的当前投影结果
```

这是符合预期的正常现象。

投影输出必须明确标识策略版本，以确保这种变化是完全可解释的。

---

# 101. 认识论安全威胁 (Epistemic Security Threats)

真实的记忆大脑容易受到长期持续的认识论攻击。

至少包括：

```text
高置信度不可信断言注入 (high-confidence untrusted assertion injection)
来源身份冒用 (source impersonation)
系统来源洗白 (origin laundering)
人造虚假共识 (manufactured corroboration)
女巫来源膨胀攻击 (Sybil source inflation)
溯源环路放大 (provenance cycle amplification)
派生断言重复加权计算 (derived-assertion double counting)
选择性删除反面证据 (selective counter-evidence deletion)
利用陈旧证据 (stale-evidence exploitation)
将假设提升为客观事实 (hypothesis-to-fact promotion)
将预测洗白为直接观测 (prediction-to-observation laundering)
导入带签名但内容虚假的主张 (signed-but-false import)
信任自我提权 (trust self-escalation)
投影快照自我循环确认 (projection snapshot self-confirmation)
```

---

# 102. 高置信度不赋予信任 (High Confidence Does Not Grant Trust)

攻击者声明：

```text
confidence = 1.0
```

严禁绕过：

```text
信任评估 (trust)
证据要求 (evidence)
溯源审计 (provenance)
安全策略 (policy)
```

这是一致性测试的必检用例。

---

# 103. 数字签名不代表客观真理 (Signature Does Not Grant Truth)

有效的数字签名仅证明：

```text
该签名者确实对这串字节进行了签名
```

它并不证明：

```text
该命题在客观上为真 (the Proposition is true)
该来源具备专业能力 (the source is competent)
该来源诚实无欺 (the source is honest)
证据充分确凿 (the Evidence is sufficient)
```

投影仅将签名作为完整性与身份归属的支撑证据。

---

# 104. 溯源不赋予权限 (Provenance Does Not Grant Authority)

完美的溯源可以揭示：

> 这句话确实来自一个不可信的来源。

这很有价值。

但这绝不会让这句话变得可信。

---

# 105. 本地派生不洗白远端来源 (Local Derivation Does Not Launder Remote Origin)

如果一个不可信的导入主张变成了：

```text
本地摘要 (local summary)
本地洞见 (local Insight)
本地推理断言 (local inferred Assertion)
```

该派生对象虽然拥有本地引擎系统来源，但依然保留着对导入素材的依赖根源。

投影**必须 (MUST)** 能够全程追踪该依赖链路。

---

# 106. 反面证据删除攻击 (Counter-Evidence Deletion Attack)

如果存在：

```text
支持证据 E1
反驳证据 E2
```

若攻击者删除了 E2，幼稚的投影就会变得盲目过度自信。

缓解措施：

```text
严格的 Evidence 删除管控策略
审计追踪与变更流 (audit/change stream)
墓碑机制 (tombstones)
投影缓存失效 (projection invalidation)
历史解释追踪 (historical explanation)
```

治理层定义授权。

认识论模型要求系统必须感知此风险。

---

# 107. 溯源缺失处理 (Missing Provenance)

缺失溯源的断言依然可以被表示。

投影**应当 (SHOULD)** 显式暴露：

```text
溯源不完整 (provenance incomplete)
```

而非悄然伪造一个虚假的来源。

策略可以：

```text
降低其影响力 (reduce influence)
要求人工复核 (require review)
在高风险上下文中予以排除 (exclude in high-risk context)
```

---

# 108. 溯源脱敏与隐私 (Redacted Provenance)

某个调用主体可能被授权查看某个断言，但无权查看其敏感的证据或来源详情。

此时投影可以依据：

```text
脱敏后的证据摘要 (redacted evidence summary)
在特权层计算得出的信任结果 (trust result computed in privileged layer)
```

进行计算（若治理策略允许）。

解释生成时严禁泄露隐藏的真实身份。

合规的解释：

```text
“受到一个策略信任但已脱敏的来源支持。”
```

而不是：

```text
“来源存在，但你无权知道是谁。”
```

除非策略允许暴露这种存在性信号。

---

# 109. 投影与侧信道隐私防范 (Projection and Privacy)

投影引擎必须避免侧信道数据泄露。

对于被隐藏的 Evidence，未授权用户严禁推断出：

```text
隐藏来源的精确计数
隐藏图节点的度数
隐藏冲突的存在性
隐藏搜索的匹配命中
隐藏的置信度数值
```

治理规范定义了具体的脱敏语义。

---

# 110. 召回场景下的认识论投影 (Epistemic Projection for Recall)

普通的日常召回通常需要：

```text
已被接受的稳定知识 (accepted stable knowledge)
加上实质性的关键不确定性 (material uncertainty)
```

推荐行为：

```text
以已接受的信念为主导
在与决策相关时浮现争议或存疑状态
避免向用户倾泻大量低价值的历史断言碎片
```

原始审计模式仍可独立使用。

---

# 111. 行动规划召回的认识论投影 (Epistemic Projection for Action Recall)

行动规划应当采用更加严格的投影策略。

一份有价值的行动简报包含：

```text
已接受的前提条件 (accepted premises)
存在争议的前提条件 (contested premises)
未知的先决依赖 (unknown prerequisites)
陈旧过时的观测 (stale observations)
适用的技能 (applicable Skills)
技能的推导溯源 (Skill provenance)
反例与失败经验 (counterexamples)
高影响力的不确定性 (high-impact uncertainty)
```

严禁将低风险的对话投影与高风险的行动规划投影混为一谈。

---

# 112. 实质性不确定性 (Material Uncertainty)

并非所有的微小不确定性都值得引起用户注意。

大脑可以依据以下维度对不确定性进行优先级排序：

```text
与当前决策的相关性 (decision relevance)
潜在危害后果 (potential harm)
行动的可逆性 (reversibility)
试错成本 (cost)
对核心目标的依赖度 (goal dependency)
```

这属于大脑策略范畴。

KIP 负责暴露结构化的不确定性信息。

---

# 113. 投影缓存机制 (Projection Caching)

认识论投影**可以 (MAY)** 进行缓存。

缓存键应当至少包含：

```text
space                  (记忆空间)
principal              (调用主体)
scope                  (查询范围)
purpose                (使用目的)
valid_at               (生效时间)
as_of                  (认知时间)
policy version         (策略版本)
relevant state version (相关状态版本 / 变更游标)
```

当底层相关的认识论状态或策略发生变化时，缓存的投影立即失效。

---

# 114. 投影默认不是证据 (Projection Is Not Evidence by Default)

计算或缓存的投影结果并不自动成为证据。

若大脑将其作为认知制品固化：

```text
创建派生的 Assertion / Evidence
+
关联 Activity
+
保留完整的依赖溯源链
```

否则它始终是临时的视图。

---

# 115. 确定性与可复现性 (Determinism and Reproducibility)

KIP 2.0 不强制要求所有投影算法在数学上绝对完全确定。

但投影**应当 (SHOULD)** 声明：

```text
method_id              (推导方法 ID)
method_version         (方法版本)
deterministic: true/false (是否确定)
policy_id / version    (策略 ID 与版本)
input / as-of 边界     (输入数据边界)
```

对于高保障部署，强烈推荐使用确定性或经过可复现校准的投影方法。

---

# 116. 大模型辅助的证据评估 (LLM-Assisted Evidence Evaluation)

实现**可以 (MAY)** 使用大语言模型来评估：

```text
证据相关性 (evidence relevance)
语义冲突矛盾 (semantic conflict)
来源关联关系 (source relationship)
上下文兼容性 (context compatibility)
```

在此情况下：

```text
LLM 的输出仅仅是评估信号 (evaluator signal)
而不是权威的真理
```

具有重大影响的决策**应当 (SHOULD)** 记录：

```text
模型与方法标识
输入引用列表
评估活动 Activity
置信度与不确定性
```

在操作适宜时予以持久化保留。

---

# 117. 投影 Profile 体系 (Projection Profiles)

未来 KIP 可以标准化命名投影 Profile。

可能的示例：

```text
structural (结构性)
conservative (保守型)
personal-assistant (个人助理型)
high-assurance (高保障型)
audit (审计型)
```

本文档不预设其具体阈值。

不带版本号的 Profile 名称不足以满足可复现性要求。

---

# 118. 结构性投影 (Structural Projection)

一个最小符合规范的实现可以提供确定性的**结构性投影（Structural Projection）**，而不尝试复杂的信任加权计算。

它可以：

```text
过滤生命周期与时态
分组支持与拒绝断言
识别显式声明的 Schema 冲突
回溯追踪溯源根节点
准确报告 contested / insufficient
```

而无需计算全局数值信念分。

这提供了一个低复杂度的基准一致性底线。

---

# 119. 得分型投影 (Scored Projection)

更高级的实现可以输出：

```text
support_score     (支持度评分)
opposition_score  (反对度评分)
uncertainty_score (不确定性评分)
```

并带有自描述的评分语义。

其聚合算法由具体实现与策略定义。

---

# 120. 概率型投影 (Probabilistic Projection)

仅当实现能够满足以下声明并有据可查时，**可以 (MAY)** 暴露校准概率：

```text
score_semantics = calibrated_probability
```

并提供校准领域的完整文档。

KIP 不假设所有信念都是概率性的。
---

# 121. 证据账本推导示例 (Evidence Ledger Example)

假设：

```text
命题 P = ServiceA 的状态为 "healthy"
```

存在以下证据：

```text
E1: 监控系统 API 返回 healthy
E2: 独立的综合拨测探针返回 healthy
E3: 运维人员人工报告 unhealthy
E4: 智能体对 E1 进行摘要提取后的结果
```

投影引擎应当精准识别出：

```text
E4 与 E1 共享完全相同的溯源根节点
```

因此实际的认识论力量拓扑结构为：

```text
支持根节点 (support roots):
  G1 = E1 + E4 (同一根源的分支)
  G2 = E2      (真正独立的测量)

反对根节点 (opposition roots):
  G3 = E3      (人工报告)
```

而不是粗暴计为：

```text
3 票支持 vs 1 票反对
```

---

# 122. 佐证示例：新闻回声效应 (Corroboration Example: News Echo)

```text
文章 A 发表了主张 X。
网站 B 转载并引用了文章 A。
智能体 C 对网站 B 进行了摘要总结。
搜索引擎 D 对内容 C 建立了搜索索引。
```

四个检索命中结果绝不等于四次独立的客观确认。

感知溯源的投影引擎会自动将推导链：

```text
A ← B ← C ← D
```

折叠合并为一个主要的根节点，除非客观存在另一个真正独立的源头。

---

# 123. 重复观测示例 (Repeated Observation Example)

部署监控工具在十分钟内每分钟都报告一次 healthy。

这代表：

```text
10 次观测事件 (10 observation events)
1 个工具 / 来源 (1 tool/source)
```

这能够提供：

```text
强有力的时态一致性 (strong temporal consistency)
```

但这绝不是来自十个独立组织的多源佐证。

投影能够清晰区分：

```text
观测重复强度 (observation repetition strength)
来源多样性强度 (source diversity strength)
```

---

# 124. 专家观点冲突示例 (Conflicting Expert Example)

```text
命题 P = 药物 D 针对病症 C 是安全的

断言 A1: 专家 X 明确支持
断言 A2: 专家 Y 明确拒绝
```

投影可以深入审查：

```text
专家的领域专业能力 (expert domain competence)
客观证据的质量 (Evidence quality)
是否存在利益冲突 (conflicts of interest)
临床研究的推导溯源 (study provenance)
时间时效性 (time)
使用目的与风险等级 (purpose/risk)
```

并最终判定输出：

```text
contested (存在争议)
```

即使某一方在数值评分上略微领先。

高风险的安全策略可能要求更高级别的争议化解流程。

---

# 125. 个人偏好示例 (Personal Preference Example)

Alice 说：

```text
“我偏好深色模式。”
```

若使用目的为：

```text
配置 Alice 本人的用户界面
```

Alice 的自我陈述几乎具有绝对的权威性。

若使用目的为：

```text
预测绝大多数用户的界面偏好
```

同一项证据的相关性则微乎其微。

信任度与使用目的密切相关。

---

# 126. 当前状态与历史状态示例 (Current Status Example)

昨天：

```text
经过验证的工具报告：
服务 healthy
置信度极高
```

今天：

```text
没有任何新鲜的证据到达
```

针对如下查询的投影：

```text
“昨天的服务状态如何？”
```

可以完全接受 healthy。

而针对如下查询的投影：

```text
“现在的实时服务状态如何？”
```

则可能返回 insufficient / stale（证据不足或陈旧）。

这期间无需对置信度执行任何人为的数学衰减。

---

# 127. 历史信念演变示例 (Historical Belief Example)

1 月份：

```text
断言 A1 支持 P
投影计算 → accepted (接受)
```

3 月份：

```text
新证据 E2 到达
断言 A2 拒绝 P
投影计算 → contested (争议)
```

6 月份：

```text
新证据 E3 验证了拒绝立场
断言 A3 替代了自我信念 B1
投影计算 → rejected (拒绝)
```

KIP 能够清晰回答：

```text
我们在 1 月份相信了什么？
怀疑与分歧最初是在何时出现的？
是什么关键证据导致了 6 月份的彻底反转？
我们现在相信什么？
```

---

# 128. 投影到学习的闭环 (Projection-to-Learning Loop)

认识论投影深度参与智能体的经验学习闭环：

```text
证据 (Evidence)
   ↓
断言 (Assertions)
   ↓
认识论投影 (Projection)
   ↓
决策 / 预测 (Decision / prediction)
   ↓
客观实际结果 (Outcome)
   ↓
产生新证据 (new Evidence)
   ↓
校准 / 信任更新 / 信念修订 (calibration / trust update / belief revision)
```

这彻底打通了记忆与未来行为之间的闭环链路。

---

# 129. 与经验学习架构的关系 (Relationship to Experience Learning)

经验（Experience）与技能（Skill）属于认知记忆 Profile。

认识论模型为其提供底层支撑：

```text
在行动前存在什么初始信念
有哪些现场观测对其提出了挑战
发生了怎样的预测偏差 (prediction error)
哪些结果证据是完全可信的
派生出的技能主张是否获得了充分的证据支持
```

因此，一次 Experience 能够完整保留：

```text
行动前信念 (belief_before)
执行行动 (action)
现场观测 (observation)
行动后信念 (belief_after)
```

而不将这些信念与跨越时间的绝对真理相混淆。

---

# 130. 技能的认识论评估 (Skill Epistemics)

关于一个 Skill，至少存在两个截然不同的认识论问题：

```text
关于该技能的步骤描述是否客观准确？
该技能在当前环境下是否真正有效且适用？
```

这两者并不等同。

一个技能可能具有：

```text
对执行流程准确描述的高置信度
但在当前环境条件下的极低实用效用
```

或者：

```text
极高的历史效用记录
但在当前陌生环境中的不确定适用性
```

认知记忆 Profile 定义效用与适用性。

认识论模型则负责评估关于它们的具体断言。

---

# 131. 程序性证据 (Procedural Evidence)

经验的执行结果构成了评估技能效用的客观证据。

示例：

```text
技能 S
经验 E1: 执行成功
经验 E2: 执行失败
```

大脑不应将：

```text
两次经验
```

直接转化为关于该技能的普适真理。

它必须综合评估：

```text
环境条件匹配度 (condition match)
独立性 (independence)
结果可靠性 (outcome reliability)
上下文相似度 (context similarity)
反例与失败场景 (counterexamples)
```

---

# 132. 负迁移警告 (Negative Transfer Warning)

一个此前高度成功的技能在不同的上下文中可能完全不再适用。

行动规划投影应当清晰区分：

```text
在认识论上具有充分证据支撑的技能 (epistemically well-supported Skill)
```

与：

```text
在当前具体情境下切实适用的技能 (currently applicable Skill)
```

单纯的语义相似度绝不足以保证适用性。

---

# 133. 认识论投影与自我模型 (Epistemic Projection and Self-Model)

自我模型的某些断言在认识论上可能非常脆弱。

示例：

```text
“我不擅长商务谈判。”
```

绝不应该仅仅因为发生了一次失败事件，就固化为不可变的自我身份标签。

自我模型 Profile 可以要求：

```text
多次独立经验 (multiple Experiences)
纵向长期一致性 (longitudinal consistency)
积极寻找反例 (counterexamples)
人机协作或自我反思 (human/self reflection)
```

在形成强有力的持久自我断言之前进行充分验证。

这属于 Profile 策略，但认识论模型为其提供了完备的证据拓扑结构。

---

# 134. 认识论投影与承诺追踪 (Epistemic Projection and Commitments)

承诺（Commitment）不仅是一个静态事实。

对于前瞻性记忆，投影可以询问：

```text
该承诺目前是否依然有效？
它是否已经被履行完成？
它是否已被中途取消？
有什么客观证据能够证明其已完成？
```

当前的承诺状态应当保留生命周期的证据链，而非仅仅依赖一个可变的字符串字段。

认知记忆 Profile 可以利用 Core 断言使高价值的承诺状态完全具备可审计性。

---

# 135. 领域知识与个人知识 (Domain Knowledge vs. Personal Knowledge)

不同的领域需要应用不同的认识论策略。

示例：

```text
个人偏好 (personal preferences)
组织规章流程 (organization procedures)
科学定理主张 (scientific claims)
医疗健康记录 (medical records)
软件发布部署状态 (software deployment state)
财务审计事实 (financial facts)
家庭个人记忆 (family memory)
```

KIP 不强制强加单一的信任层级体系。

MemorySpace + Schema + Projection Policy 共同定义具体的执行环境。

---

# 136. 投影解释级别 (Projection Explanation Levels)

推荐的解释级别：

```text
none     (不提供解释)
summary  (摘要级别)
evidence (证据级别)
audit    (全审计级别)
```

## `summary` (摘要级别)

面向人类或智能体友好的核心理由概要。

## `evidence` (证据级别)

包含贡献力量的断言与证据根节点。

## `audit` (全审计级别)

在安全治理许可下包含：

```text
策略信息 (policy)
信任决策依据 (trust decisions)
完整溯源路径 (provenance paths)
被排除的断言 (excluded Assertions)
冲突集合 (conflict sets)
各项具体评分 (scores)
时态过滤细节 (temporal filtering)
```

---

# 137. 投影排除原因分类 (Projection Exclusion Reasons)

当某个断言被排除在投影计算之外时，引擎**应当 (SHOULD)** 能够准确归类其具体原因：

```text
not_visible                     (治理权限不可见)
retracted                       (已被声明者撤回)
superseded                      (已被新断言替代)
expired                         (适用时效已过期)
outside_valid_time              (超出所查询的客观世界时间)
outside_as_of_time              (超出所查询的认知系统时间)
hypothetical_not_requested      (未请求包含假设性模式)
prediction_not_requested        (未请求包含预测性模式)
context_mismatch                (上下文环境不匹配)
invalid_schema                  (Schema 校验不合法)
unresolved_identity             (主体身份未能消歧解析)
policy_excluded                 (受安全策略显式排除)
provenance_required_but_missing (要求具备溯源但实际缺失)
```

针对未授权主体，排除原因本身可能需要进行脱敏。

---

# 138. 信任决策原因分类 (Trust Decision Reasons)

标准化的原因类别：

```text
verified_identity        (经过验证的权威身份)
unverified_identity      (未经核验的声称身份)
trusted_tool             (受信任的自动化工具)
domain_competence        (具备相关领域的专业能力)
historical_reliability   (具备良好的历史可靠性记录)
imported_source          (来自外部导入源)
unsigned_import          (未经数字签名的导入数据)
provenance_incomplete    (溯源链路不完整)
known_compromise         (已知存在安全风险或被攻破)
conflict_of_interest     (存在利益冲突)
policy_default           (应用策略默认值)
```

确切的词汇体系可以使用命名空间进行扩展。

---

# 139. 不确定性成因分类 (Uncertainty Reason Categories)

推荐的标准分类：

```text
insufficient_evidence (客观证据不足)
conflicting_evidence  (证据存在矛盾冲突)
low_source_trust      (来源信任度过低)
missing_provenance    (推导溯源缺失)
identity_ambiguity    (主体身份存在歧义)
temporal_staleness    (观测数据陈旧过时)
validity_ambiguity    (生效时间区间存疑)
context_ambiguity     (上下文环境存在歧义)
schema_ambiguity      (模式定义存在歧义)
correlated_sources    (多个来源高度相关缺乏独立性)
coverage_gap          (检测覆盖面存在盲区)
derived_only          (仅有推论缺乏一手证据)
```

这些结构化原因比单一的标量不确定性数值更具可解释性与指导意义。

---

# 140. 佐证结构解释 (Corroboration Explanation)

投影应当能够清晰解释：

```text
存在 3 个可见的断言
但实际仅溯源到 1 个独立的客观证据根节点
```

这对于智能体的安全决策与科研推理的可解释性至关重要。

---

# 141. 证据多样性指标 (Evidence Diversity Metrics)

实现**可以 (MAY)** 暴露如下描述性指标：

```text
assertion_count           (断言总数)
evidence_count            (证据总数)
root_count                (溯源根节点总数)
source_actor_count        (语义主体总数)
origin_principal_count    (底层调用主体总数)
corroboration_group_count (佐证组总数)
independent_root_count    (独立根节点总数)
```

这些属于客观的描述性指标。

绝不能将其中的任何单一指标直接等同于真理。

---

# 142. 来源多样性不等于简单民主多数决 (Source Diversity Is Not Democracy)

错误的规则：

```text
多数来源支持即为真理
```

KIP 坚决拒绝将此作为普适的认识论准则。

理由：

```text
不同来源在专业能力上存在巨大鸿沟
不同来源可能会相互抄袭与转述
不同来源可能共同继承了一个上游错误
某些领域存在绝对权威的官方原始记录
客观真理绝非由投票人数决定
```

多样性是证据拓扑结构的一种属性，而非真理本身。

---

# 143. 一手来源与二手来源 (Primary vs. Secondary Source)

投影策略**可以 (MAY)** 结合溯源信息区分：

```text
一手原始来源 (primary source)
二手解释推论 (secondary interpretation)
三手摘要概括 (tertiary summary)
```

这种区分具有领域专有性。

一手来源本身依然可能存在错误。

---

# 144. 权威基准记录 (Authority Records)

在某些特定领域，权威记录直接定义了运行时的权威事实。

示例：

```text
官方的访问控制权限配置
组织官方的权威员工花名册
经过数字签名的发布部署清单
```

策略**可以 (MAY)** 针对这些有边界的谓词赋予此类 Evidence 极高的决定性权重。

这属于策略的选择配置。

KIP Core 本身不硬编码任何来源为绝对权威。

---

# 145. 利益冲突识别 (Conflict of Interest)

信任评估**可以 (MAY)** 考量利益冲突因素。

示例：

```text
供应商对自己产品性能的自我陈述
```

这并不意味着该证据完全不可用。

但在某些策略下可以合理降低其独立性或信任权重。

---

# 146. 证据的时效性与历史保留 (Evidence Freshness Without Forgetting)

陈旧的证据可以同时具备：

```text
极高的历史重要性
完备的数据完整性
极高的历史置信度
```

同时在当前的实时状态查询中被判定为证据不足。

这种明确区分防止了记忆维护机制为了保持实时答案的新鲜度而盲目销毁极具价值的历史事实。

---

# 147. 认识论压缩 (Epistemic Compression)

记忆维护机制可以从大量的原始断言中提炼生成一个紧凑的派生断言。

示例：

```text
50 次一致的偏好事件记录
    ↓
沉淀为一个稳定的 Preference 偏好断言
```

派生断言：

```text
显著提升了检索与召回的效率
```

但必须完整保留对 50 次事件的溯源根节点关联。

原始证据随后可以在满足策略和留存规则的前提下进行归档。

---

# 148. 压缩不创造独立性 (Compression Does Not Create Independence)

如果一个稳定的派生断言概括了 50 次事件，而在后续的投影中系统同时看到了：

```text
派生断言
+
相同的 50 次原始事件
```

系统必须严格避免对相同的根节点进行重复二次加权。

---

# 149. 认识论缓存与认识论记忆 (Epistemic Cache vs. Epistemic Memory)

物化后的投影结果可以作为缓存处理。

持久化的 `$self` 断言则作为信念记忆处理。

二者的区分必须清晰明确。

这防止了每一次查询操作都被递归当作新的证据。

---

# 150. 读取操作不强化客观真理 (Read Does Not Reinforce Truth)

仅仅检索或读取某个断言，**严禁 (MUST NOT)** 提升其认识论置信度。

否则会导致：

```text
被频繁查询的错误信念
→ 信任度不断自我强化
```

这是一个灾难性的正反馈死循环。

召回频次可以影响认知记忆 Profile 中的 `memory_strength`（记忆强度），但绝不影响真值置信度。

---

# 151. 用户显式确认 (User Confirmation)

当用户显式确认了一条被召回的事实时，该确认构成了**全新的 Evidence**。

标准模式：

```text
召回命题 P
用户显式确认该事实
    ↓
生成新的 Evidence E_new
创建新的 Assertion A_new 或修订派生信念
```

而不是：

```text
读取计数 read_count++
置信度 confidence 自动递增++
```

---

# 152. 用户沉默不等于确认 (User Silence Is Not Confirmation)

如果智能体陈述了一条记忆中的事实而用户未提出异议，通常不足以构成充分的确认证据。

Profile 仅当上下文能够明确支撑该推论时，**可以 (MAY)** 将特定行为作为隐式证据处理。

---

# 153. 行动成功作为证据 (Action Success as Evidence)

如果基于命题 P 做出的决策取得了成功，该成功可以作为与以下方面相关的客观证据：

```text
技能的实用效用 (Skill utility)
决策前提假设的有效性 (decision premise validity)
环境模型的准确性 (environment model)
```

但成功并不必然证明每一个前提假设在客观上都绝对为真。

归因分配（Credit Assignment）属于大脑经验学习的职责。

投影应当避免对所有上游断言进行无差别的盲目强化。

---

# 154. 行动失败作为证据 (Action Failure as Evidence)

同理，行动失败并不自动证伪每一个前提假设。

它可能暗示：

```text
前置条件判断错误 (wrong precondition)
选用了错误的技能 (wrong Skill)
外部环境发生突变 (environment change)
底层工具调用故障 (tool failure)
缺失了关键状态 (missing state)
信念本身确实存在错误 (incorrect belief)
```

经验学习应当完整保留执行轨迹，以便后续进行对比巩固。

---

# 155. 认识论归因分配 (Epistemic Credit Assignment)

认识论模型支持但不强制限定具体的归因算法。

大脑可以创建：

```text
Activity: retrospective_evaluation (事后评估活动)
```

建立关联：

```text
决策前提假设 (decision premises)
执行行动 (actions)
客观结果证据 (outcome Evidence)
```

并产生新的断言，指明哪些假设被削弱或被强化。

---

# 156. 证据复用机制 (Evidence Reuse)

同一个 Evidence **可以 (MAY)** 同时支持多个不同的断言。

示例：

```text
同一份部署日志记录
```

可以同时支持：

```text
服务启动失败
数据库目标配置错误
数据迁移脚本已执行完成
```

每种关联都必须具有语义相关性。

证据的复用并不意味着在各个断言上具有完全相同的支持强度。

---

# 157. 单一断言可包含混合证据 (One Assertion May Have Mixed Evidence)

一个断言可以同时引用：

```text
支持性证据 (supporting Evidence)
质疑性证据 (challenging Evidence)
背景性证据 (context Evidence)
```

这有助于完整保留声明者的立场，同时客观记录已知的相反信号。

投影引擎可以对完整的证据账本进行全面审查。

---

# 158. 断言的存疑立场 `uncertain` (Assertion `uncertain` Stance)

`stance = uncertain` 代表断言者显式拒绝强烈支持或拒绝该命题。

这与：

```text
低置信度的支持 (low confidence support)
```

截然不同。

示例：

```text
stance = uncertain
confidence = 0.9
```

代表：

> 断言者高度确信当前最正确的认识论状态就是“不确定”。

这是完全合理且有价值的。

投影策略绝不能将立场与置信度粗暴合并为单一标量。

---

# 159. 拒绝立场的置信度 (Confidence on Reject Stance)

```text
stance = reject
confidence = 0.95
```

代表：

> 极其强烈的明确拒绝。

它并不代表：

```text
命题 P 成立的概率为 0.05
```

除非特定的经过校准的概率策略显式做出此类规定。

---

# 160. 存疑立场的置信度 (Confidence on Uncertain Stance)

置信度描述的是对所声明立场的承诺强度。

因此：

```text
uncertain (存疑) + high confidence (高置信度)
```

具有明确且重要的语义内涵。

这再次印证了认识论投影必须采用多维语义模型的原因。

---

# 161. 存疑断言的投影处理 (Projection of Uncertain Assertions)

一个 `uncertain` 断言可以贡献于：

```text
不确定性成因分析 (uncertainty reasons)
证据盲区提示 (evidence gaps)
冲突感知告警 (conflict awareness)
```

而非普通的正向支持或反向反对力量。

具体处理方式由策略定义。

---

# 162. 模式不蕴含立场 (Mode Does Not Imply Stance)

在语义合理的前提下，任何模式都可以与任何立场自由组合：

```text
observed + support    (直接观测到支持)
observed + reject     (直接观测到反驳)
inferred + uncertain  (推理得出存疑结论)
predicted + support   (预测其将发生)
stated + reject       (声明予以拒绝)
```

这两个维度保持严格正交。

---

# 163. 时态预测 (Temporal Predictions)

对于预测性断言，生效时间可能处于遥远的未来。

投影必须清晰区分：

```text
预测的目标时间点 (prediction target time)
断言做出的时间点 (assertion time)
事后实际核验的时间点 (later validation time)
```

以全面支持校准与学习机制。

---

# 164. 溯源完整度分级 (Provenance Completeness Levels)

投影**可以 (MAY)** 对溯源完整度进行分级：

```text
complete (完备)
partial  (部分)
opaque   (不透明)
missing  (缺失)
```

具体的定义由策略或 Profile 规定。

一个外部导入的黑盒断言可能是：

```text
数字签名完整经过验证 (integrity verified)
推导溯源完全不透明 (provenance opaque)
```

两者完全不同。

---

# 165. 证据完整性级别 (Evidence Integrity Levels)

可能的完整性状态：

```text
digest_verified          (哈希摘要校验通过)
signature_verified       (数字签名校验通过)
transport_authenticated  (传输信道安全认证)
engine_observed          (引擎自身直接观测)
unverified               (未经核验)
tampered                 (已被篡改破坏)
```

这些状态绝不能自动折算为信任度。

---

# 166. 证据可用性状态 (Evidence Availability)

证据的状态可以是：

```text
available                   (当前立即可用)
redacted                    (已被脱敏遮蔽)
offline                     (处于离线存储)
expired_external_reference  (外部引用已失效)
purged                      (已被物理清除)
```

投影应当清晰区分：

```text
该证据在历史上曾经存在过
```

与：

```text
该证据当前能够被重新检查与读取
```

---

# 167. 证据物理清除后的投影计算 (Projection Under Purged Evidence)

若隐私或合规策略彻底清除了证据但保留了合规的墓碑凭证：

```text
投影可以获知该支持推导链路在历史上曾经存在过
```

但根据策略配置，置信度可能需要相应下调或标记为不可重新核验。

严禁凭空编造已不可用的证据内容。

---

# 168. 模式不确定性 (Schema Uncertainty)

若谓词的语义不够明确或 Schema 存在版本冲突，投影严禁主观编造冲突逻辑。

输出：

```text
schema_ambiguity (模式存在歧义)
```

并优先采取保守稳妥的解释方案。

---

# 169. 实体消歧不确定性 (Entity Resolution Uncertainty)

若两个名为 "Alice" 的 Concept 可能指代同一个人但尚未完成规范合并：

```text
严禁隐蔽地将二者的断言合并计算
```

投影可以显式浮现身份歧义。

身份整合与信念聚合属于完全独立的两个阶段。

---

# 170. 权威合并与投影 (Canonical Merge and Projection)

当 Concept A 合并至 B 时：

```text
规范查询可以将涉及 A 与 B 的命题视为在语义上指代同一实体
```

而原始审计查询依然完整保留各自最初的 ID。

投影解释应当能够注明：

```text
“历史断言引用了别名身份 A，当前已规范解析为 B。”
```

---

# 171. 跨空间认识论语义 (Cross-Space Epistemics)

每个 Space 均依据其本地安全策略对导入的认知数据进行独立评估。

因此：

```text
同一个带有数字签名的断言
```

完全可以呈现为：

```text
在空间 A 中被接受 (accepted)
在空间 B 中存疑 (uncertain)
在空间 C 中被拒绝或直接排除 (rejected/excluded)
```

具体取决于各自的信任策略与使用目的。

这完全符合系统设计预期。

---

# 172. 信任度绝不跨空间自动传递 (Trust Does Not Transfer Automatically Across Spaces)

源空间中：

```text
trust(source X) = high
```

目标空间绝不会仅仅因为导入了源端的策略或结论就自动继承该信任度。

信任评估必须在本地完全自主进行。

---

# 173. 导入的投影计算结果 (Imported Projection Results)

远端系统可能导出：

```text
“我们系统此前接受了命题 P”
```

目标端应当将其严格视为：

```text
一条关于远端系统持有该信念的客观断言
```

而非直接将其作为本地已接受的真理。

若执行导入，溯源应当在可用时注明远端的投影算法与策略版本。

---

# 174. 组织级记忆体系 (Organization Memory)

在组织级大脑中，断言可能源自：

```text
员工个人 (employees)
智能体 (agents)
官方业务系统 (official systems)
制度文档 (documents)
会议纪要 (meetings)
管理政策 (policies)
外部信息源 (external sources)
```

成熟的投影能够清晰区分：

```text
官方组织级权威声明 (official organizational assertion)
员工个人主观信念 (individual employee belief)
观测到的客观业务事实 (observed operational fact)
外部咨询建议 (external advice)
历史已被废弃的旧制度 (historical superseded policy)
```

而不将它们扁平化混为一谈。

---

# 175. 制度政策与事实断言的区别 (Policy vs. Factual Assertion)

组织可能有：

```text
管理制度规定必须执行 X
```

这与：

```text
X 实际上已经切实发生
```

完全不是一回事。

Schema / Profile 应当严格区分规范性命题（Normative propositions）与描述性命题（Descriptive propositions）。

投影目的决定关注哪一类。

---

# 176. 规范性主张 (Normative Claims)

未来 Schema / Profile 可以将谓词标记为：

```text
descriptive (描述性)
normative   (规范性 / 应然性)
predictive  (预测性)
```

认识论投影必须严格避免将：

```text
“应当 (must)”
```

误判为：

```text
“是 (is)”
```

本文档不标准化具体的道义逻辑（Deontic logic）。

---

# 177. 自我陈述特权领域 (Self-Report Domains)

某些谓词赋予了主体天然的特权权威。

示例：

```text
个人偏好 (preference)
主观感受 (subjective feeling)
个人意图 (personal intention)
自我设定的目标 (self-declared goal)
```

投影策略可以定义：

```text
subject_self_report_authority = high (主体自我陈述权威高)
```

同时依然完整保留随时间演变而产生的观点差异。

---

# 178. 外部可核验领域 (Externally Verifiable Domains)

其他谓词则必须深度依赖外部客观观测：

```text
账户余额 (account balance)
服务器运行状态 (server status)
软件包版本号 (package version)
航班起飞时间 (flight departure time)
```

单纯的自我陈述完全不足以确立事实。

Schema 与安全策略共同定义具体的认识论预期。

---

# 179. 来源-领域能力矩阵 (Source-Domain Competence)

信任体系应当支持：

```text
来源主体 × 领域 / 谓词 (source × domain/predicate)
```

而非单一维度的全局评分。

示例：

```text
专业医生:
  医学诊断 → 高权威
  Kubernetes 运维部署 → 未知

SRE 运维智能体:
  Kubernetes 运维部署 → 高权威
  医学诊断 → 未知
```

---

# 180. 使用目的与业务领域的交互 (Purpose-Domain Interaction)

即使针对完全相同的谓词，使用目的的改变也会显著重塑证据要求。

示例：

```text
“服务大概率健康吗？”
    日常宏观概览
    
“我现在可以触发不可逆的主备容灾切换吗？”
    高风险高后果的重大行动
```

第二种投影将要求更新鲜实时且经过独立多源核验的严格证据。
---

# 181. 认识论判定阈值 (Epistemic Thresholds)

策略**可以 (MAY)** 为以下维度定义阈值：

```text
accept                (接受门槛)
reject                (拒绝门槛)
contest               (争议判定门槛)
uncertainty           (存疑容忍门槛)
minimum root diversity(最低根节点多样性要求)
minimum trust         (最低信任要求)
freshness             (时效性新鲜度要求)
high-risk review      (高风险人工复核门槛)
```

KIP 不强制预设通用的全局数值。

---

# 182. 阈值迟滞回差机制 (Threshold Hysteresis)

为了防止信念在临界阈值附近发生高频震荡，实现**可以 (MAY)** 采用迟滞回差机制（Hysteresis）：

```text
切换至新状态需要更高的阈值 (higher threshold to switch state)
维持在当前状态允许较低的阈值 (lower threshold to remain in state)
```

若使用该机制，必须在策略中显式声明。

严禁隐藏有状态的阈值逻辑。

---

# 183. 投影稳定性 (Projection Stability)

大脑可能倾向于保持相对稳定的信念，同时对强有力的客观新证据保持敏锐响应。

投影稳定性可以综合考量：

```text
先前的持久自我信念 (previous durable self-belief)
证据变化的幅度大小 (evidence change magnitude)
来源的可靠性 (source reliability)
冲突的激烈程度 (conflict strength)
```

但是，先前的信念**严禁 (MUST NOT)** 仅仅因为此前被接受过就演变为独立的支撑证据。

---

# 184. 避免确认偏差 (Avoiding Confirmation Bias)

先前从证据派生出的 `$self` 自我断言，绝不能仅仅因为它是“我自己的信念”就自动获得额外的认识论加权。

策略可以看重认知的连续性，但必须严格保全以下两者之间的根本界限：

```text
先验先入之见 (prior)
与
客观证据 (evidence)
```

---

# 185. 信念惯性 (Belief Inertia)

如果系统刻意引入信念惯性，必须将其作为显式的：

```text
投影策略行为 (projection policy behavior)
```

予以声明，而不是隐蔽地编码在断言的置信度内部。

这保持了历史证据的清晰可解释性。

---

# 186. 校准记录 (Calibration Records)

高级大脑可以系统性记录校准证据：

```text
来源预测了结果 X
实际客观结果为 Y
```

并派生出可靠性断言。

这些记录可以为信任解析器（Trust Resolver）提供动态输入。

这构筑了一个具备自主学习进化能力的认识论系统。

---

# 187. 认识论学习 (Epistemic Learning)

KIP 赋能大脑不仅能够学习客观事实，更能够学习：

```text
哪些信息源是高度可靠的
哪些自动化工具经常陈旧过时
哪些推理方法容易发生过拟合
哪些业务领域需要更强有力的多源佐证
哪些前提假设在实践中频繁失灵
```

这属于元认识论学习（Meta-Epistemic Learning）。

具体的学习算法归属于 Brain / Profile。

---

# 188. 元认识论断言 (Meta-Epistemic Assertions)

示例：

```text
(MonitorX, reliable_for, ServerHealth)
(ModelY, overconfident_on, LegalQuestions)
(SourceZ, frequently_copies, SourceA)
```

这些属于标准的“命题 + 断言”。

安全治理层决定它们是否能够实际影响信任解析。

---

# 189. 信任策略严禁被不可信内容自我修改 (Trust Policy Cannot Be Self-Modified by Untrusted Content)

一条导入的断言声称：

```text
“完全信任 SourceX。”
```

绝不能仅仅因为其被存储下来就直接篡改信任解析器的逻辑。

修改安全策略必须具备治理层的显式特权授权。

这彻底防止了认识论特权提权漏洞。

---

# 190. 投影审计记录 (Projection Audit Record)

对于重大关键决策，实现**可以 (MAY)** 持久化一份审计记录：

```text
投影请求哈希摘要 (projection request digest)
策略 ID 与版本 (policy id/version)
认知时间边界 (as-of boundary)
计算得出的状态 (result status)
支持与反对的根节点 ID 列表 (support/opposition root IDs)
被排除的关键项 (important exclusions)
输出内容哈希摘要 (output digest)
```

该审计记录不自动成为新的认识论来源。

它是一个纯粹的审计制品。

---

# 191. 决策溯源 (Decision Provenance)

智能体可以将一次决策行动 Activity 显式关联到所依据的投影审计记录上。

随后系统可以清晰回答：

> 智能体在做出该决策时，当时到底相信了什么？

这是真正的记忆大脑的核心能力。

---

# 192. 决策复盘与反思 (Decision Review)

在后续的客观结果证据到达后：

```text
决策活动 (Decision Activity)
    +
当时的投影快照 (Projection snapshot)
    +
实际结果证据 (Outcome Evidence)
```

可以共同输入给一个事后复盘反思活动（Retrospective Activity）。

大脑可以从中精准复盘反思：

```text
信念错误 (wrong belief)
信任策略失当 (bad trust policy)
依据了陈旧证据 (stale evidence)
技能选择错误 (wrong Skill)
遗漏了未观测的关键前置条件 (unobserved condition)
```

---

# 193. 投影与认知底护底脑 (Projection and Cognitive Primer)

认知底护（Cognitive Primer）通常应当使用稳定且已被接受的确定知识。

应当严格避免将：

```text
存在争议的主张 (contested)
情景假设 (hypothetical)
陈旧过时的数据 (stale)
低信任度的主张 (low-trust)
```

隐蔽地提升为身份或领域的核心底护摘要。

重要的未决不确定性可以显式注明。

---

# 194. 底护溯源 (Primer Provenance)

如果 Primer 包含一条持久化摘要：

```text
“用户偏好深色模式。”
```

其底层支撑的已接受投影应当保持全程可溯源。

Primer 本身不是权威的真理来源。

---

# 195. 投影与检索的关系 (Projection and Search)

`SEARCH` 负责检索候选集。

认识论投影则负责裁定其在信念层面的相关性与可信度。

因此：

```text
高语义相关性得分 (_score)
≠
高认识论支持力度 (high epistemic support)
```

搜索可能会高分检索出一条高度相关但已被证伪或撤回的声明。

投影必须对其进行严格的过滤与评估。

---

# 196. 针对原始状态与已接受状态的检索 (Search Over Raw vs. Accepted State)

未来 KQL / META 可以暴露：

```text
SEARCH RAW        (检索原始状态)
SEARCH ACCEPTED   (检索已接受信念)
SEARCH CONTESTED  (检索争议状态)
```

或等价的视图。

具体语法稍后制定。

认识论模型要求在概念上对它们进行严格区分。

---

# 197. 检索反面证据 (Retrieval of Counter-Evidence)

对于高风险决策，召回机制**应当 (SHOULD)** 能够主动检索：

```text
最强有力的支持力量 (strongest support)
最强有力的反对力量 (strongest opposition)
相关的失败反例 (relevant counterexample)
未决的关键不确定性 (unresolved uncertainty)
```

而非仅仅检索排名最高的正面确认记忆。

这有助于强力抵御确认偏差（Confirmation Bias）与负迁移（Negative Transfer）。

---

# 198. 投影质量评估指标 (Projection Quality Metrics)

实现可以通过以下维度评估投影算法的质量：

```text
校准度 (calibration)
准确率 (accuracy)
布里尔分数 / 对数损失（在概率场景下）(Brier/log loss)
冲突检测的精准度 (conflict detection precision)
来源独立性检测能力 (source-independence detection)
历史状态重构还原度 (historical reconstruction)
解释的忠实可信度 (explanation faithfulness)
决策实用效用 (decision utility)
对抗恶意攻击的鲁棒性 (adversarial robustness)
```

协议一致性与认知推导质量是两个独立的维度。

---

# 199. 认识论一致性测试套件 (Epistemic Conformance Suite)

KIP 2.0 认识论实现最终应当针对如下经典用例进行严格测试：

```text
高置信度的不可信来源 (high-confidence untrusted source)
两个相互冲突的可信来源 (two conflicting credible sources)
来自单一根节点的三个转述文本 (three paraphrases from one root)
派生断言与其自身前提同时存在 (derived Assertion plus its own premises)
同一来源在时间跨度上的重复陈述 (same source repeated over time)
时间区间互不重叠的时态陈述 (non-overlapping temporal state)
已被显式撤回的断言 (retracted Assertion)
同一主体自身废弃替代的前序断言 (superseded same-actor Assertion)
假设性情景断言 (hypothetical Assertion)
前瞻预测与事后观测对比 (prediction vs later observation)
语义布尔假值与认识论拒绝立场 (boolean false vs reject stance)
客观证据缺失的情况 (missing Evidence)
溯源依赖中存在环路 (circular provenance)
导入带有数字签名但内容虚假的主张 (imported signed false claim)
反面证据被恶意删除 (counter-evidence deletion)
指定历史 cognitive as-of 时间的投影 (historical as-of projection)
未知状态与拒绝状态的区分 (unknown vs rejected)
函数型单值谓词冲突 (functional predicate conflict)
实体身份存在歧义 (identity ambiguity)
证据被脱敏遮蔽 (redacted Evidence)
```

---

# 200. 必需的一致性不变式 (Required Conformance Invariants)

一个符合规范的认识论模型**必须 (MUST)** 严格保全以下不变式：

1. 命题的存在并不代表其为客观真理。
2. 存储了断言并不代表本地系统的认可与接受。
3. 断言置信度不等于来源信任度。
4. 断言置信度不等于投影概率。
5. 缺乏支持证据并不代表被否定拒绝。
6. 默认的世界模型是开放世界假定（Open-World）。
7. 撤回操作移除了当前的有效支持，而不物理删除历史记录。
8. 废弃替代不是普通的观点冲突。
9. 不同主体之间可以长期持有分歧，而无需相互替代。
10. 时间区间互不重叠的主张不自动构成矛盾冲突。
11. 上下文环境存在差异的主张不自动构成矛盾冲突。
12. 假设性断言不是常规的现实事实信念。
13. 前瞻预测不是直接观测。
14. 外部导入的断言默认不被本地直接接受。
15. 数字签名仅证明完整性与身份归属，不证明客观真理性。
16. 具备历史溯源不等于具备信任权威。
17. 推理派生绝不凭空创造独立的佐证力量。
18. 转述与复制绝不凭空创造独立的佐证力量。
19. 投影快照绝不能为其自身的溯源根节点提供独立佐证。
20. 溯源环路绝不能自我放大支持力量。
21. 来源计数多数决绝非普适的真理判据。
22. 同一来源的重复表达与真正独立的多源佐证严格有别。
23. 时态时效性判定绝非通用的数值置信度衰减。
24. 检索读取频次绝不提升认识论置信度。
25. 用户保持沉默绝不等于确认认可。
26. 用户的显式确认构成了全新的证据。
27. 反面证据是一等公民。
28. 证据的删除对认识论具有重大影响。
29. 冲突矛盾允许长期保持未决状态。
30. 被接受的信念严格依赖于上下文、策略与时间时钟。
31. 投影策略与版本必须明确可标识，以满足审计要求。
32. 信任度依来源、领域与使用目的而动态变化。
33. 行动执行权限与认识论信任严格解耦。
34. 身份保证度与声称的 `asserted_by` 严格分离。
35. 历史上的信念与当前关于历史的信念截然不同。
36. 投影在推导前必须严格遵循治理层的可见性权限。
37. 隐藏的证据严禁通过投影的侧信道发生数据泄露。
38. 数值评分必须自描述其具体评分语义。
39. 支持度与反对度评分之和无需等于 1。
40. 不确定性必须能够独立于支持与反对力量进行一等公民表达。

---

# 201. 最小认识论投影一致性要求 (Minimal Epistemic Projection Conformance)

最小实现无需复杂的评分加权算法。

但**必须 (MUST)** 能够：

```text
准确识别合资格的断言 (identify eligible Assertions)
清晰区分 support / reject / uncertain 立场 (separate stances)
按生命周期与当前时间进行精准过滤 (filter lifecycle/current-time)
保全开放世界的 insufficient 证据不足状态 (preserve open-world insufficient)
识别针对同一命题的直接立场冲突 (identify direct conflict)
消费并执行 Schema 声明的互斥冲突规则 (consume schema value conflicts)
遍历溯源图以检测直接的派生重复加权 (detect derivation duplication)
清晰区分 imported / hypothetical / predicted 模式 (distinguish modes)
输出完全具备可审计性的状态 (emit an auditable status)
```

这确保了 KIP 在尚未引入高级信任学习机制之前就已经极具实用价值。

---

# 202. 高级认识论投影能力 (Advanced Epistemic Projection Capability)

高级实现可以额外增加：

```text
来源动态校准 (source calibration)
信任自主学习 (trust learning)
根节点独立性聚类 (root-independence clustering)
语义证据相关性评估 (semantic evidence relevance scoring)
概率化聚合推导 (probabilistic aggregation)
风险敏感型动态阈值 (risk-sensitive thresholds)
时效性衰减模型 (freshness models)
利益冲突识别模型 (conflict-of-interest models)
大模型辅助的证据评估 (LLM-assisted evidence evaluation)
元认识论学习 (meta-epistemic learning)
```

这些必须保持自描述性。

---

# 203. 推荐的投影输出契约 (Recommended Projection Output Contract)

成熟的实现**应当 (SHOULD)** 暴露在逻辑上等价于如下字段的输出：

```text
目标命题 / 冲突集 (target proposition / conflict set)
计算得出的信念状态 (status)
支持力量概要 (support summary)
反对力量概要 (opposition summary)
不确定性分析 (uncertainty)
合资格的断言列表 (eligible Assertions)
被排除的断言概要 (excluded Assertion summary)
独立的证据根节点分组 (independent root groups)
时态上下文 (temporal context)
策略标识与版本 (policy identity/version)
评分语义说明 (score semantics)
结构化解释账本 (explanation)
警告与提示信息 (warnings)
```

确切的连线 JSON 格式在 KQL / META 规范中确定。

---

# 204. 与 KIP 核心数据模型的关系 (Relationship to KIP Core Data Model)

核心数据模型（Core Data Model）在其核心职责上保持完全不变：

```text
Proposition = 不可变的客观语义项
Assertion   = 具备历史可溯源性的认识论承诺
Evidence    = 不可变的已引用客观制品
Activity    = 溯源推导演变过程
_system     = 引擎不可篡改的底层事实
MemorySpace = 所有权与安全治理边界
```

本认识论模型刻意不在 Core 中添加可变字段：

```text
Proposition.truth
Proposition.current_confidence
Proposition.accepted
```

否则会重新陷入 KIP 1.x 时代的语义耦合困境。

---

# 205. 建议的核心模型微调：可审计的生命周期流转 (Proposed Small Core Refinement: Auditable Lifecycle Transitions)

历史认识论投影不仅需要知道断言当前的生命周期状态，更需要知道状态流转发生的时间点。

因此，事务与数据模型规范**应当 (SHOULD)** 确保如下生命周期状态流转：

```text
active → retracted
active → superseded
active → expired
```

能够通过以下机制完整重构还原：

```text
事务执行历史 (transaction history)
变更数据流 (change stream)
或只追加的生命周期事件记录 (append-only lifecycle events)
```

认识论模型不强制规定单一的底层物理存储形式。

但对于声明支持历史投影的实现，必须满足历史可重构性的要求。

---

# 206. 建议的核心模型微调：溯源根节点的可见性 (Proposed Small Core Refinement: Provenance Root Visibility)

如果 Evidence / Activity API 能够高效暴露以下内容，将大幅提升投影计算性能：

```text
上游输入依赖列表 (upstream inputs)
来源 / 导入凭证 (origin/import receipt)
内容哈希摘要 (content digest)
来源引用列表 (source refs)
记录模式 (record mode)
```

这无需引入全新的 Core 核心元素。

应当作为指导 KQL / META 查询设计的输入。

---

# 207. 建议的核心模型微调：证据引用的初始性与事后追加 (Proposed Small Core Refinement: Evidence Citation Origin)

若后续的证据仅是通过事后评审关联到历史断言上的，系统**应当 (SHOULD)** 严格区分：

```text
最初声明时的原始引用 (original citation)
事后评审时追加的引用 (post-hoc review citation)
```

以完整保全声明者在断言发生时实际知晓的内容。

未来的 Core / KML 微调可以将事后追加引用表示为审计/评审结构，而非直接原地篡改不可变的断言载荷。

---

# 208. 认识论投影伪代码 (Epistemic Projection Pseudocode)

以下为非规范性参考：

```text
function project(target, request):

    visible_state =
        governance_filter(request.principal, request.space)

    conflict_set =
        semantic_expand(target, schema, request.context)

    assertions =
        select_assertions(conflict_set)

    assertions =
        filter_as_of(assertions, request.as_of)

    assertions =
        filter_lifecycle(assertions, request)

    assertions =
        filter_valid_time(assertions, request.valid_at)

    assertions =
        filter_mode_and_context(assertions, request.purpose)

    dependency_graph =
        expand_provenance(assertions)

    dependency_graph =
        detect_and_collapse_cycles(dependency_graph)

    root_groups =
        build_corroboration_groups(dependency_graph)

    trust =
        resolve_contextual_trust(root_groups, assertions, request)

    evidence_quality =
        evaluate_evidence(root_groups, request)

    support, opposition =
        aggregate(
            assertions,
            root_groups,
            trust,
            evidence_quality,
            policy
        )

    uncertainty =
        analyze_uncertainty(
            support,
            opposition,
            missingness,
            conflicts,
            provenance_gaps,
            temporal_gaps
        )

    status =
        classify(
            support,
            opposition,
            uncertainty,
            policy
        )

    return explainable_projection(...)
```

算法流程仅供参考。

---

# 209. 投影示例：用户偏好 (Example Projection: User Preference)

原始状态：

```text
命题 P = (Alice, prefers, DarkMode)

断言 A1:
  asserted_by = Alice
  stance = support
  mode = stated
  Evidence = 用户的直接消息输入

断言 A2:
  asserted_by = FriendBob
  stance = reject
  mode = stated
  Evidence = Bob 声称 Alice 偏好浅色模式
```

使用目的：

```text
配置 Alice 本人的 UI 界面
```

策略配置：

```text
Alice 的自我陈述 → 具备极高的领域权威
Bob 的转述陈述   → 相对权威极低
```

投影计算输出：

```text
accepted P (接受命题 P)
```

同时完整保留 A2 记录以备审计。

---

# 210. 投影示例：医疗诊断主张 (Example Projection: Medical Claim)

相同的拓扑结构：

```text
用户本人支持诊断命题 P (置信度 1.0)
专业医生明确拒绝 P
经过验证的医学化验 Evidence 反驳质疑 P
```

医疗领域的认识论策略输出：

```text
rejected / contested
```

即使用户本人的置信度声明为 1.0。

完全相同的协议结构。

截然不同的认识论上下文。

---

# 211. 投影示例：单一源头，多次转述 (Example Projection: One Root, Many Repetitions)

```text
命题 P = 主张 X

断言 A1 来自文章 A
断言 A2 来自智能体对 A 的摘要
断言 A3 来自另一个智能体对 A2 的阅读笔记
断言 A4 来自针对 A 的搜索引擎索引
```

幼稚的做法：

```text
4 次独立确认
```

KIP 2.0 的做法：

```text
1 个溯源根节点
1 个佐证组
```

投影支持度绝不会膨胀为四倍。

---

# 212. 投影示例：独立多源测量 (Example Projection: Independent Measurements)

```text
传感器 A 测得数值 42
传感器 B 测得数值 42
人工手动测量得出数值 41.9
```

若各来源彼此独立且均受信任：

```text
具备 3 个认识论上高度多样化的独立根节点
```

支持力度获得实质性增强。

---

# 213. 投影示例：循环共识 (Example Projection: Circular Consensus)

```text
智能体 A 引用 智能体 B
智能体 B 引用 智能体 C
智能体 C 引用 智能体 A
```

完全不存在外部的客观 Evidence 根节点。

投影计算输出：

```text
corroboration = none/low (佐证度极低或无)
warning = circular provenance (告警：存在循环溯源依赖)
```

绝不误判为：

```text
3 个独立智能体达成高度共识
```

---

# 214. 投影示例：前瞻预测 (Example Projection: Prediction)

昨天：

```text
预测断言 A_pred:
  “本次部署将会失败”
  mode = predicted
```

今天：

```text
观测证据 E_obs:
  部署实际取得了圆满成功
```

原始的预测记录完整保留。

大脑可以推导得出：

```text
预测已被客观结果证伪
来源的校准参数被相应下调
```

而绝不重写篡改历史记录。

---

# 215. 投影示例：陈旧但高质量的证据 (Example Projection: Old High-Quality Evidence)

```text
命题 P = Alice 的出生日期
证据 E = 10 年前的官方出生证明
```

对于高度稳定的静态谓词，时间久远并不意味着当前时效性降低。

策略对该领域的时效性要求基本上为零。

---

# 216. 投影示例：陈旧的服务器状态 (Example Projection: Old Server Status)

```text
命题 P = 服务器当前健康
证据 E = 10 小时前经过验证的监控工具观测结果
```

该证据在历史上依然具有极高的可信度，但当前实时投影判定为：

```text
针对当前状态证据不足 (insufficient for now)
```

这充分印证了：

```text
真值置信度 ≠ 时态相关性
(truth confidence ≠ temporal relevance)
```

---

# 217. 投影示例：同一主体自身修订 (Example Projection: Same Actor Revision)

```text
1 月份：
Alice 支持 P

3 月份：
Alice 拒绝 P 并显式自我纠正
```

当前的实时投影可以将 1 月份的记录视为已被废弃替代。

历史回溯投影则完整无损呈现二者。

---

# 218. 投影示例：不同主体之间的观点对立 (Example Projection: Different Actor Conflict)

```text
Alice 支持 P
Carol 拒绝 P
```

绝不发生自动替代覆盖。

投影判定输出：

```text
contested (存在争议)
```

---

# 219. 投影示例：函数型单值谓词 (Example Projection: Functional Predicate)

```text
P1 = (Project, status, "active")
P2 = (Project, status, "archived")
```

Schema 声明：

```text
status 谓词的最大基数为 1 (max cardinality = 1)
```

重叠的生效时间将二者纳入同一个冲突集合。

投影综合比对各个备选项的证据强弱。

---

# 220. 投影示例：时态不重叠的非冲突状态 (Example Projection: Non-Conflict Across Time)

相同的 P1 与 P2，但：

```text
P1 valid_until = 8 月 1 日
P2 valid_from  = 8 月 1 日
```

在客观时间上不存在实质性重叠。

在历史上两者都可以同时被系统接受。

---

# 221. 投影示例：存疑立场 (Example Projection: Uncertain Stance)

专家表示：

```text
“基于目前可用的证据，我无法确定命题 P 是否成立。”
```

断言：

```text
stance = uncertain
confidence = 0.95
```

这是表明专家高度确信该状态目前处于“未决”状态的强有力证据。

它绝不是对命题 P 的微弱正向支持。

---

# 222. 投影示例：证据缺失 (Example Projection: Missing Evidence)

一条导入的断言：

```text
confidence = 0.99
证据完全不可用
推导溯源完全不透明
数字签名者未知
```

高风险投影策略输出：

```text
uncertain / insufficient
```

尽管断言自身声称具备 0.99 的极高置信度。

---

# 223. 投影示例：带签名的外部断言 (Example Projection: Signed External Assertion)

```text
数字签名验证通过
asserted_by = ExternalAgentX
confidence = 1.0
```

本地策略对智能体 X 的专业能力一无所知。

投影分析：

```text
integrity = high       (完整性高)
identity binding = high(身份绑定确定性高)
domain trust = unknown (领域信任度未知)
```

严禁将这些直接折算为“完全可信”。

---

# 224. 投影示例：导入的组织制度 (Example Projection: Imported Organizational Policy)

一份带有官方签名的正式组织制度在回答以下问题时具有极高的决定性权威：

```text
“官方制度规定了什么？”
```

但在回答如下问题时则不具备同等权威：

```text
“员工在实际工作中是否切实遵守了该制度？”
```

完全相同的文档，对应完全不同的命题与使用目的。

---

# 225. 投影示例：自我确认的摘要 (Example Projection: Self-Confirming Summary)

原始状态：

```text
证据 E1 支持命题 P
大脑从 E1 推导生成了摘要断言 A2
```

后续的投影同时看到了 E1 与 A2。

正确的处理：

```text
仅计为 1 个根节点
```

错误的处理：

```text
计为 2 次独立确认
```

---

# 226. 投影示例：用户确认召回事实 (Example Projection: User Confirms Recall)

大脑询问：

```text
“你偏好深色模式，对吧？”
```

用户回答：

```text
“是的。”
```

这生成了全新的证据 E2。

E2 支持偏好的长期纵向稳定性。

这绝不仅仅是一次简单的读取操作。

---

# 227. 投影示例：用户未作纠正 (Example Projection: User Does Not Correct)

大脑陈述：

```text
“你偏好深色模式。”
```

用户继续讨论其他话题，未对此进行纠正。

严禁将其推断为全新的显式确认证据。

---

# 228. 投影示例：工具回声 (Example Projection: Tool Echo)

智能体调用工具 A。

工具 B 仅仅返回了工具 A 的缓存输出。

若无溯源追踪：

```text
误判为 2 个工具达成一致
```

若具备溯源追踪：

```text
精准识别为仅有 1 次底层实际观测
```

这正是 Activity 与溯源必须作为 Core 原生核心机制的根本原因。

---

# 229. 投影示例：共同的缺陷底层依赖 (Example Projection: Common Faulty Dependency)

传感器 A 与传感器 B 共同依赖于一个存在故障的上游时钟源。

从设备身份来看它们看似独立，但实际上共享了因果依赖。

若溯源或策略获知该信息，佐证组应当相应扣减其独立性权重。

KIP 能够完备表达该知识，但不强制要求实现完美的自动因果发现。

---

# 230. 认识论模型的边界与局限 (Limits of the Epistemic Model)

KIP 2.0 无法在客观上绝对保证所有真理。

即使拥有完美的结构，也无法彻底消除：

```text
未知的未知 (unknown unknowns)
协同蓄意欺诈 (coordinated deception)
损坏失效的传感器 (bad sensors)
设计不良的模式定义 (bad schemas)
误导性但内部自洽的伪证 (misleading evidence)
模型自身的逻辑推理错误 (model reasoning errors)
缺失的关键上下文 (missing context)
```

系统的目标不是实现全知全能的神性。

核心目标在于：

> **使不确定性、来源依赖性、信念修订和历史溯源具备足够充分的显式结构，从而使智能体能够清晰推理自己“知道什么、依据何在”，而非仅仅机械存储自己“看到了什么”。**

---

# 231. 各层职责边界划分 (Division of Responsibility)

## KIP 核心数据模型 (KIP Core Data Model)

定义：

```text
Assertion   (断言)
Evidence    (证据)
Activity    (活动)
Proposition (命题)
origin      (系统来源)
time        (时态时钟)
references  (结构引用)
immutability(不可变性规则)
```

---

## KIP 认识论模型 (KIP Epistemic Model)

定义：

```text
置信度语义 (confidence semantics)
信任评估语义 (trust semantics)
有效资格规则 (eligibility)
证据依赖关系 (evidence dependency)
多源佐证体系 (corroboration)
冲突分类与裁决 (conflict)
开放世界假定 (open-world behavior)
信念修订语义 (belief revision)
认识论投影契约 (Epistemic Projection contract)
结构化解释账本 (explanation)
```

---

## KIP 安全治理 (KIP Governance)

定义：

```text
谁有权查看 (who may see)
谁有权断言 (who may assert)
谁有权修改信任策略 (who may alter trust policy)
行动执行权限 (authority)
数据密级分类 (classification)
安全脱敏规则 (redaction)
```

---

## 模式包体系 (Schema Packages)

定义：

```text
谓词具体语义 (predicate meaning)
基数约束 (cardinality)
互斥规则 (exclusivity)
类型约束 (type constraints)
领域冲突语义 (conflict semantics)
```

---

## 认知记忆 Profile (Cognitive Memory Profile)

定义：

```text
Event           (事件)
Experience      (经验)
Skill           (技能)
memory strength (记忆强度)
salience        (凸显度)
utility         (效用)
memory lifecycle(记忆生命周期)
```

---

## Anda 大脑层 (Anda Brain)

全权掌控：

```text
选用何种 Projection Policy
信任学习算法的具体实现
置信度校准算法
证据相关性估计逻辑
信念快照固化策略
记忆形成阈值
记忆维护与睡眠策略
行动简报生成 (Action Briefing)
经验学习闭环控制
```

---

# 232. 核心架构设计全景总结 (Design Summary)

完整的认识论推导因果链路为：

```text
             原始认知状态 (Raw Cognitive State)
                        │
                        ▼
             治理权限过滤 (Governance Visibility)
                        │
                        ▼
             合资格的断言 (Eligible Assertions)
                        │
                        ▼
          溯源与证据 DAG (Provenance / Evidence DAG)
                        │
                        ▼
             佐证分组 (Corroboration Groups)
                        │
                        ▼
          上下文信任模型 (Contextual Trust Model)
                        │
                        ▼
     支持力量 / 反对力量 / 未知 (Support / Opposition / Unknown)
                        │
                        ▼
             冲突裁决 (Conflict Resolution)
                        │
                        ▼
             认识论投影 (Epistemic Projection)
          ┌────────┬─────────┬─────────┐
          │        │         │         │
      已接受    已拒绝    存在争议    存疑不确定
     accepted  rejected  contested  uncertain
                                       │
                                       └── 证据不足 (insufficient)
                        │
                        ▼
             召回 / 决策 (Recall / Decision)
                        │
                        ▼
                 执行行动 (Action)
                        │
                        ▼
               产生新证据 (New Evidence)
                        │
                        └──────────────↺
```

---

# 233. 核心概念等式 (Core Equations)

整个认识论模型可以通过一组精炼的概念等式予以凝练：

```text
存储的断言 ≠ 接受的信念
(Stored Assertion ≠ Accepted Belief)
```

```text
断言置信度 ≠ 来源信任度
(Assertion Confidence ≠ Source Trust)
```

```text
认识论支持度 ≠ 断言简单计数
(Epistemic Support ≠ Assertion Count)
```

```text
独立多源佐证 ≠ 重复提及
(Independent Corroboration ≠ Repetition)
```

```text
派生认知绝不创造独立证据
(Derived Cognition does not create Independent Evidence)
```

```text
缺乏证据 ≠ 证据表明不存在
(Absence of Evidence ≠ Evidence of Absence)
```

```text
历史真实性 ≠ 当前时效相关性
(Historical Credibility ≠ Current Temporal Relevance)
```

```text
信念视图 =
    认识论投影(
      断言集,
      证据集,
      推导溯源,
      信任体系,
      时态时钟,
      环境上下文,
      使用目的,
      安全策略
    )
```

对于智能体记忆大脑而言：

```text
认识论学习 =
    产生新的客观证据
    → 持久修订信念策略或认知状态
    → 显著提升未来的预测与行动表现
```

---

# 234. 终极准则 (Final Principle)

KIP 1.x 使得智能体能够记住：

> **“Alice 偏好深色模式。”**

KIP 2.0 Core 使得智能体能够记住：

> **“Alice 在这个时间，基于这条消息，通过这个来源渠道，发表了她偏好深色模式的断言声明。”**

而认识论模型（Epistemic Model）最终使得智能体能够清晰知道：

> **“出于为 Alice 配置其本人界面的目的，我当前接受该偏好，因为 Alice 的亲口陈述在该领域具有绝对权威；较早的一条相反陈述已被废弃替代；支撑证据完全独立且保持了充分的时效性；并且我能够向外部完全清晰地解释为何这一信念应当指导我的下一步行动。”**

这一跨越，正是单纯存储无差别数据与构建**具备信念能力的记忆大脑**之间的本质区别。

真正的记忆大脑绝不仅仅是保留“说了什么”。

它完整保留：

```text
声称了什么主张 (what was claimed)
是谁做出的主张 (who claimed it)
有什么客观依据作为支撑 (what supported it)
支撑依据具体源自何处 (where that support came from)
支撑依据是否彼此独立 (whether support is independent)
存在什么相反的矛盾证据 (what contradicts it)
该主张在何时适用 (when it applied)
在当前情境下该来源有多大分量 (how much the source should matter here)
还有哪些关键信息尚处于未知 (what remains unknown)
为何信念会发生修订改变 (why belief changed)
以及该信念是否应当切实深刻地影响下一次行动决策 (and whether that belief should affect the next decision)
```

这正是 KIP 2.0 所奠定的坚不可摧的认识论基石。
