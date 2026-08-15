# KIP 2.0 模式包体系 (Schema Packages)

**[English](./KIP-2.0-Schema-Packages.md) | [中文](./KIP-2.0-Schema-Packages_CN.md)**

## 规范状态 (Status)

**模式包模型提案 / 规范预研草案 (Schema Package Model Proposal / Pre-Specification Draft)**

本文档定义了 KIP 2.0 的模式架构：即语义类型（semantic types）、谓词（predicates）、Profile 切面（facets）、结构字段（structural fields）、约束（constraints）、扩展注册表（extension registries）、兼容性（compatibility）、依赖关系（dependencies）、迁移声明（migration declarations）以及模式激活（schema activation）是如何进行打包封装与解析的。

本文档直接建立在以下文档的基础之上：

- [KIP-2.0-Architecture.md](KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)

KIP 2.0 架构要求通过模式包（Schema Packages）使模式具备可移植性、可版本化、机器可校验性以及命名空间安全性。

核心数据模型要求每个持久化的：

```text
schema_ref (模式引用)
predicate_ref (谓词引用)
facet namespace (切面命名空间)
```

都能够被确定性地解析。

认识论模型在以下方面依赖于模式语义：

```text
functional predicates (函数式谓词)
cardinality (基数约束)
exclusive alternatives (互斥备选项)
conflict sets (冲突集)
value domains (取值域)
context/temporal interpretation (上下文/时态解释)
```

治理平面将模式的安装与升级视为受保护的控制平面操作，因为模式的变更会改变记忆的解释方式。

本文档将这些要求具体化。

其核心设计原则为：

> **模式包是不可变的语义代码：是一份具备版本、可供检查的契约，定义了认知状态如何被解释、校验与关联——而绝非可执行的应用程序代码。**

KIP 2.0 保留了 KIP 1.x 中最有价值的思想：

> **认知中枢是自描述的，模型可以发现其合法的语义词汇表。**

但 KIP 2.0 改变了模式权威性的归属。

在 KIP 1.x 中，模式定义是使用 `$ConceptType` 和 `$PropositionType` 的普通图谱 Concept。

在 KIP 2.0 中：

```text
权威模式 (Authoritative Schema)
    = 不可变的版本化模式包资产 (immutable versioned Package Artifact)

自描述模式视图 (Self-Describing Schema View)
    = 将已安装的模式包资产运行时投影为面向模型的自省信息
```

这防止了普通的认知写入操作静默重新定义 `Person`、`Skill`、`works_for` 或 `confidence` 的含义。

---

# 0. 规范性用语 (Normative Language)

关键字 **必须 (MUST)**、**严禁 (MUST NOT)**、**必需 (REQUIRED)**、**应当 (SHOULD)**、**不得 (SHOULD NOT)**、**可以 (MAY)** 和 **可选 (OPTIONAL)** 用于表示未来 KIP 2.0 规范的预期要求。

确切的 JSON 字段名称与 URI 文法属于规范预研内容，但其语义区分与不变式旨在延续至后续的语法规范工作中。

---

# 1. 为什么模式不仅仅是数据校验 (Why Schema Is More Than Validation)

在一个真实的记忆大脑中，模式决定的不仅仅是某个字段是否为字符串。

模式可以决定：

```text
存在哪些 Concept Type (概念类型)
Predicate (谓词) 的真实含义
哪些 Literal (字面量) 取值是合法的
哪些主体 (subject)/客体 (object) 是合法的
哪些关系是函数式 (functional) 的
哪些取值是相互排斥的
哪些主张会产生冲突
哪些结构字段构成 Experience (经验) 轨迹
哪些 Facet (切面) 是合法的
Profile 如何扩展 Core
本地名称解析至何处
不同版本之间需要何种数据迁移
```

因此：

> **模式是大脑认知语义的核心组成部分。**

修改模式可能会改变已存储记忆的含义，即使底层数据字节没有发生任何改变。

这使得模式成为：

```text
语义基础设施 (semantic infrastructure)
+
安全敏感的控制状态 (security-sensitive control state)
```

而不仅仅是开发者文档。

---

# 2. 设计目标 (Design Goals)

KIP 2.0 模式包**应当 (SHOULD)** 做到：

```text
自描述 (self-describing)
具备版本 (versioned)
发布后不可变 (immutable after publication)
命名空间安全 (namespace-safe)
具备依赖感知 (dependency-aware)
机器可校验 (machine-validatable)
大模型易读 (LLM-readable)
可移植 (portable)
可计算哈希 (hashable)
支持可选数字签名 (optionally signed)
具备迁移感知 (migration-aware)
受治理控制 (governance-controlled)
默认非可执行 (non-executable by default)
支持向后回溯检查 (backward-inspectable)
兼容多版本的历史记忆 (compatible with multi-version historical memory)
```

---

# 3. 非目标 (Non-Goals)

模式包绝不是：

```text
通用代码模块
任意数据迁移脚本的容器
授权策略
信任策略
查询存储过程
大语言模型提示词
工具插件
包管理器的安装后脚本 (post-install scripts)
```

它们可以描述语义契约。

但它们**严禁 (MUST NOT)** 仅仅因为某个 Space 激活了它们就自动获得任意的执行权限。

---

# 4. 模式包资产 (Package Artifact)

**模式包（Schema Package）** 是一个包含清单（manifest）与语义定义的不可变版本化资产。

逻辑结构：

```text
SchemaPackage (模式包)
├ manifest (清单)
├ dependencies (依赖关系)
├ definitions (定义集合)
│  ├ Concept Types (概念类型)
│  ├ Predicate Types (谓词类型)
│  ├ Facet Definitions (切面定义)
│  ├ Structural Field Definitions (结构字段定义)
│  ├ Enum / Named Value Sets (枚举 / 命名取值集)
│  └ Registry Extensions (注册表扩展)
├ constraints (约束条件)
├ aliases (别名)
├ compatibility declarations (兼容性声明)
├ migration descriptors (迁移描述符)
├ documentation / model hints (文档 / 模型提示指引)
├ canonical digest (规范内容摘要)
└ optional signatures (可选数字签名)
```

---

# 5. 权威模式包 vs. 认知镜像 (Authoritative Package vs. Cognitive Mirror)

模式包是权威的模式状态。

认知中枢**可以 (MAY)** 暴露认知镜像，例如：

```text
Concept:
    name = "Person"
    description = "人类个体..."
```

以供模型推理使用。

但该镜像仅具有信息参考作用。

对镜像执行的普通图谱变更**严禁 (MUST NOT)** 改变当前激活的模式包资产。

---

# 6. 具备自描述性而无须自我修改 (Self-Description Without Self-Mutation)

KIP 1.x 通过将 `$ConceptType` 和 `$PropositionType` 存储为图谱节点来实现自描述性。

KIP 2.0 通过运行时自省来保持自描述性：

```text
DESCRIBE SCHEMA
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE PACKAGE
```

或等价的 META 操作。

运行时可以将模式包定义渲染为：

```text
紧凑的模型入门引述 (compact LLM primer)
规范的机器可读形式 (canonical machine form)
人类可读文档 (human documentation)
```

而无需将类型系统退化为可随意修改的普通认知内容。

---

# 7. 模式包身份 (Schema Package Identity)

模式包具有两个身份维度：

```text
package_id (模式包标识)
version (版本)
```

二者共同唯一标识一个不可变的模式包版本。

示例：

```text
package_id = "kip://profiles/cognitive-memory"
version    = "2.0.0"
```

规范的版本化模式包引用：

```text
kip://profiles/cognitive-memory@2.0.0
```

---

# 8. 建议的规范引用语法 (Proposed Canonical Reference Grammar)

示意语法：

```text
kip://<package-path>@<exact-version>[/<symbol>]
```

示例：

```text
kip://core@2.0.0
kip://core@2.0.0/Assertion

kip://profiles/cognitive-memory@2.0.0
kip://profiles/cognitive-memory@2.0.0/Experience
kip://profiles/cognitive-memory@2.0.0/has_step

kip://ldclabs/organization@1.3.0
kip://ldclabs/organization@1.3.0/Organization
kip://ldclabs/organization@1.3.0/works_for
```

最终的词法文法将在后续规范中正式标准化。

---

# 9. 模式包路径 (Package Path)

模式包路径是一个稳定的、具备命名空间限定的名称。

示例：

```text
core
profiles/cognitive-memory
ldclabs/organization
acme/deployment-memory
```

推荐语法：

```text
小写 (lowercase)
ASCII 字符
各段使用 "/" 分隔
段内允许的字符：
    a-z
    0-9
    "-"
```

模式包路径区分大小写，但规范模式包**应当 (SHOULD)** 使用全小写。

---

# 10. 保留模式包路径 (Reserved Package Paths)

KIP 应当至少保留以下路径：

```text
kip://core
kip://profiles/*
```

以供 KIP 规范自身及标准 Profile 使用。

第三方模式包**应当 (SHOULD)** 使用由发布者控制的命名空间：

```text
kip://ldclabs/*
kip://acme/*
```

全局命名空间治理机制超出了本文档的讨论范围。

去中心化注册表、DNS 绑定、代码仓库信任体系或特定实现的私有注册表均可托管模式包。

规范模式包身份本身并不直接证明发布者的真实身份。

---

# 11. 版本 (Version)

KIP 2.0 **应当 (SHOULD)** 采用类语义化版本（SemVer）的三段式结构：

```text
MAJOR.MINOR.PATCH (主版本号.次版本号.修订号)
```

示例：

```text
2.3.1
```

**可以 (MAY)** 支持预发布标签：

```text
2.0.0-rc.1
```

确切的解析器规范将在后续标准化。

---

# 12. 版本语义 (Version Meaning)

推荐的版本意图：

```text
PATCH (修订号)
    不改变合法实例语义的缺陷修复

MINOR (次版本号)
    向后兼容的附加性语义变更

MAJOR (主版本号)
    潜在不兼容的破坏性语义变更
```

然而：

> **版本号仅为发布者的声明，而非兼容性的绝对证明。**

KIP 亦定义了显式的兼容性元数据与校验机制。

---

# 13. 精确版本持久化规则 (Exact-Version Persistence Rule)

这是一条核心不变式。

持久化存储的每一处认知引用，**必须 (MUST)** 解析为精确的模式版本。

示例：

```text
schema_ref =
    kip://profiles/cognitive-memory@2.0.0/Experience

predicate_ref =
    kip://ldclabs/organization@1.3.0/works_for
```

持久化元素**严禁 (MUST NOT)** 将如下形式存储为其权威模式引用：

```text
@2
@2.x
@^2.0
@latest
```

---

# 14. 为什么必须使用精确版本 (Why Exact Versions Are Required)

如果一个元素存储了：

```text
schema_ref = Person@latest
```

那么：

```text
昨天的相同字节
与今天的相同字节
```

在注册表发生更新后就可能会产生截然不同的含义。

这将静默改写历史认知。

因此：

> **持久化认知必须绑定至不可变的语义定义。**

---

# 15. 版本范围仅用于依赖解析 (Version Ranges Are Resolution Inputs Only)

版本范围**可以 (MAY)** 出现于：

```text
依赖声明
安装请求
兼容性声明
升级请求
```

示例：

```text
depends_on:
    kip://core >=2.0.0 <3.0.0
```

解析器将版本范围转换为精确版本。

随后将解析出的精确版本记录在 Space 模式环境（Schema Environment）/ 锁定状态（lock state）中。

---

# 16. 模式符号身份 (Schema Symbol Identity)

符号由以下要素共同标识：

```text
package_id
exact version (精确版本)
local symbol name (本地符号名称)
symbol kind (符号种类)
```

概念上：

```text
SchemaSymbolRef =
    PackageRef + "/" + SymbolName
```

任何符号脱离其所在的模式包/版本谱系，均不存在独立意义。

---

# 17. 符号种类 (Symbol Kinds)

推荐的模式包符号种类：

```text
ConceptType (概念类型)
PredicateType (谓词类型)
FacetDefinition (切面定义)
StructuralFieldDefinition (结构字段定义)
EnumDefinition (枚举定义)
RegistryExtension (注册表扩展)
```

Core 内置的基础元素种类不可被普通模式包重新定义。

---

# 18. 本地符号名称 (Local Symbol Names)

推荐的命名惯例延续了 KIP 1.x 的人机工程学体验：

```text
Concept Type:
    大驼峰命名法 (UpperCamelCase)

Predicate:
    蛇形命名法 (snake_case)

Facet:
    大驼峰命名法 (UpperCamelCase) 或带命名空间的模式包切面根

Structural field:
    蛇形命名法 (snake_case)

Enum:
    大驼峰命名法 (UpperCamelCase)

Enum value:
    蛇形命名法 (snake_case) 或声明的规范字符串
```

---

# 19. 全限定名称 vs. 本地名称 (Fully Qualified vs. Local Names)

规范机器状态使用全限定的精确引用。

面向模型的 KQL/KML **可以 (MAY)** 允许使用：

```text
Person
works_for
Experience
has_step
```

作为已解析模式环境中的本地别名。

这是一种语法糖。

引擎**必须 (MUST)** 在执行前将每个本地名称确定性地解析为精确引用。

---

# 20. 歧义本地名称 (Ambiguous Local Names)

假设一个 Space 安装了：

```text
kip://profiles/cognitive-memory@2.0.0/Person
kip://acme/hr@1.0.0/Person
```

那么：

```text
Person
```

即存在歧义，除非模式环境定义了显式的别名/导入偏好。

运行时**严禁 (MUST NOT)** 进行盲目猜测。

它应当要求使用：

```text
全限定引用 (qualified reference)
或
显式别名 (explicit alias)
```

---

# 21. 别名 (Aliases)

模式环境或模式包**可以 (MAY)** 定义便于模型调用的别名。

示例：

```text
CM.Person
HR.Person
```

或：

```text
cognitive:Person
hr:Person
```

具体表层语法留待后续定义。

别名是解析辅助机制。

它们不会改变符号的规范身份。

---

# 22. 别名安全性 (Alias Safety)

在同一个执行上下文中，一个别名**必须 (MUST)** 且仅能解析为一个确切的符号。

别名的变动属于模式环境变动，**应当 (SHOULD)** 具有版本并可被审计。

历史上已持久化的元素不受影响，因为它们存储的是精确引用。

---

# 23. 模式环境 (Schema Environment)

**模式环境（Schema Environment）** 是指在一个 MemorySpace 中激活生效的模式包版本与符号别名的精确集合。

它回答了以下问题：

```text
当前有哪些模式包可用？
各自的精确版本是什么？
哪些版本被接受用于读取操作？
哪些版本是新写入操作的默认目标？
各个别名分别解析至何处？
哪些模式包已被废弃？
哪些模式包已被封禁？
```

---

# 24. 模式环境属于治理状态 (Schema Environment Is Governance State)

模式环境隶属于受保护的治理控制平面。

普通的认知写入操作无法：

```text
安装模式包
激活模式包
更改别名解析规则
修改默认写入版本
移除历史模式
```

---

# 25. 模式锁定 (Schema Lock)

Space **应当 (SHOULD)** 维护一份精确的**模式锁定（Schema Lock）**。

示意：

```json
{
  "environment_id": "schema-env-17",
  "version": 9,

  "packages": {
    "kip://core": "2.0.0",
    "kip://profiles/cognitive-memory": "2.1.0",
    "kip://ldclabs/organization": "1.3.2"
  },

  "write_defaults": {
    "kip://profiles/cognitive-memory": "2.1.0"
  }
}
```

依赖项同样会被精确锁定解析。

---

# 26. 可重现性 (Reproducibility)

给定：

```text
Schema Lock (模式锁定)
+
规范模式包资产 (canonical Package Artifacts)
+
认知数据 (cognitive data)
```

系统实现应当能够准确重构出完全相同的已声明语义契约。

这对于以下方面至关重要：

```text
合规审计
胶囊校验
历史认识论投影
数据迁移
跨引擎一致性保障
```

---

# 27. 模式包清单 (Package Manifest)

推荐清单格式：

```json
{
  "package_id": "kip://ldclabs/organization",
  "version": "1.3.0",

  "name": "Organization",
  "description": "KIP 组织协作模式包。",

  "kip": {
    "requires": ">=2.0.0 <3.0.0"
  },

  "dependencies": [],

  "compatibility": {
    "previous": "1.2.0",
    "classification": "backward_compatible"
  },

  "publisher": {
    "id": "optional-publisher-identity"
  },

  "digest": "sha256:...",

  "signatures": []
}
```

发布者/签名结构将与胶囊/完整性规范协同定稿。

---

# 28. 模式包不可变性 (Package Immutability)

一旦某个模式包版本作为不可变资产被发布/安装：

```text
相同的 package_id + version
```

**必须 (MUST)** 始终指向相同的规范内容摘要（digest）。

发布者**严禁 (MUST NOT)** 将：

```text
1.3.0
```

替换为具有不同语义的内容。

修正缺陷必须发布新版本。

---

# 29. 模式包摘要 (Package Digest)

每个规范模式包资产**应当 (SHOULD)** 具有内容摘要（hash digest）。

包注册表/解析器**必须 (MUST)** 拒绝：

```text
相同 package_id + version
不同 digest
```

并将其判定为完整性冲突错误。

---

# 30. 数字签名 (Signatures)

模式包**可以 (MAY)** 附带数字签名。

签名可以确立：

```text
数据完整性
发布者密钥绑定
```

但它不能直接确立：

```text
语义正确性
安全性
兼容性
本地治理批准
```

安装行为依然受到本地治理控制。

---

# 31. 草案模式包 (Draft Packages)

开发工具链**可以 (MAY)** 支持可变的草案模式。

草案身份**应当 (SHOULD)** 明确标记为非规范性质，例如：

```text
工作区局部模式包 (workspace-local package)
或
预发布版本 (pre-release version)
```

生产环境中持久化的认知数据**不应当 (SHOULD NOT)** 绑定至静默可变的模式定义。

---

# 32. 概念类型定义 (Concept Type Definition)

`ConceptType` 定义了一类 Concept 的语义契约。

示意：

```json
{
  "kind": "ConceptType",
  "name": "Person",

  "description": "人类个体。",

  "attributes": {
    "display_name": {
      "value_type": "string",
      "required": false
    }
  },

  "structural_fields": {},

  "facets_allowed": [],

  "identity": {
    "key_supported": true,
    "canonical_id_supported": true
  },

  "model_hints": {
    "summary": "针对人类个体使用 Person。"
  }
}
```

---

# 33. 概念类型不定义客观事实 (Concept Type Does Not Define Truth)

Concept Type 表达的是：

```text
此类语义资源可以存在
```

它并不断言现实世界中存在任何具体的实例。

在需要时，关于认识论存在性的主张依然通过 Proposition + Assertion 表达。

---

# 34. 概念属性 (Concept Attributes)

属性定义**应当 (SHOULD)** 明确指定：

```text
value type (取值类型)
required/optional (必需/可选)
nullable (是否可为空)
default if any (默认值，如有)
validation constraints (校验约束)
mutability (可变性)
documentation (文档说明)
```

属性仅用于表达局部表示状态，这与核心数据模型保持一致。

---

# 35. 属性校验类型 (Attribute Validation Types)

推荐的基础原始校验类型：

```text
string (字符串)
number (数字)
integer (整数)
boolean (布尔值)
null (空值)
datetime (日期时间)
date (日期)
duration (时间跨度)
uri (URI 标识符)
json_scalar (JSON 标量)
json_object (JSON 对象)
json_array (JSON 数组)
```

**可以 (MAY)** 支持受限声明式的复杂对象模式。

本文档不强制要求兼容 JSON Schema。

---

# 36. 必需属性 (Required Attributes)

KIP 1.x 根据引擎严格程度将必需属性在一定程度上视为最佳实践指引。

KIP 2.0 改变了这一点。

如果一个模式包声明了：

```text
required = true
```

合规的严格模式校验器**必须 (MUST)** 针对声明使用该精确模式版本的写入操作强制执行该约束。

模式约束转变为机器可验证的契约。

---

# 37. 未知属性处理 (Unknown Attributes)

Concept Type **应当 (SHOULD)** 声明其开放性：

```text
attributes_open = true | false
```

如果为 `false`：

```text
出现未知属性 → 抛出校验错误
```

如果为 `true`：

```text
允许包含附加属性
```

Profile 作者应当审慎使用开放性设定。

---

# 38. 属性认识论边界 (Attribute Epistemic Boundary)

模式**严禁 (MUST NOT)** 鼓励将需要独立评估以下要素的事实状态封装在属性中：

```text
置信度 (confidence)
来源 (source)
有效性 (validity)
矛盾冲突 (contradiction)
证据 (Evidence)
策略 (policy)
```

模型提示词指引**可以 (MAY)** 针对常见字段显式指明：

```text
promote_to_proposition_when_epistemic = true
```

---

# 39. 可变性 (Mutability)

属性**可以 (MAY)** 声明：

```text
mutable (可变)
immutable_after_create (创建后不可变)
engine_managed (引擎管理)
governance_managed (治理管理)
```

模式包无法擅自授予修改治理管理字段的权限。

治理平面始终保持权威性。

---

# 40. 默认值 (Defaults)

如果模式默认值暗示了客观事实，则是非常危险的。

安全的默认值：

```text
display_order = 0
```

潜在不安全的默认值：

```text
employment_status = "active"
```

默认值是在没有证据的情况下被插入的。

因此，模式包作者**应当 (SHOULD)** 避免设定语义事实层面的默认值，除非该值真正代表数据表示层面的默认设定而非对现实世界的主张。

---

# 41. 谓词类型定义 (Predicate Type Definition)

`PredicateType` 定义了 Proposition 谓词的语义契约。

示意：

```json
{
  "kind": "PredicateType",
  "name": "works_for",

  "description": "在声明的上下文中将人与组织关联起来。",

  "subject": {
    "concept_types": [
      "kip://profiles/cognitive-memory@2.0.0/Person"
    ]
  },

  "object": {
    "concept_types": [
      "kip://ldclabs/organization@1.3.0/Organization"
    ],
    "literal_types": []
  },

  "semantics": {
    "cardinality": {
      "max_per_subject": null
    },
    "functional": false
  }
}
```

---

# 42. 谓词主体约束 (Predicate Subject Constraints)

Predicate **可以 (MAY)** 按照如下维度约束主体：

```text
Core 核心元素种类
Concept Type
模式包/类型族
```

示例：

```text
Person ─ works_for → Organization
```

在模式允许的前提下，Core 仍然允许跨任何认知元素构建 Proposition。

---

# 43. 谓词客体约束 (Predicate Object Constraints)

客体**可以 (MAY)** 允许：

```text
Concept Type
其他认知元素种类
Literal 数据类型
```

示例：

```text
Person ─ timezone → string
```

---

# 44. 谓词字面量约束 (Predicate Literal Constraints)

针对 Literal 客体，谓词模式可以定义：

```text
datatype (数据类型)
enum (枚举)
minimum/maximum (最大/最小值)
pattern (正则模式)
language requirement (语言要求)
unit/value domain (单位/取值域)
```

具体约束语法留待后续定义。

---

# 45. 函数式谓词 (Functional Predicate)

谓词可以声明：

```text
functional = true
```

其含义为：

> 在声明的冲突作用域下，一个主体针对该谓词不应当同时拥有多个被接受的取值。

这并不会阻止系统中存储多个相互冲突的 Proposition。

它用于指导：

```text
适当时机的数据校验
认识论冲突集 (Conflict Sets) 判定
认识论投影计算
维护诊断分析
```

---

# 46. 函数式不代表存储唯一性 (Functional Does Not Mean Storage Uniqueness)

示例：

```text
(Alice, timezone, "+08:00")
(Alice, timezone, "+01:00")
```

二者必须都能被正常存储，因为它们可能代表：

```text
不同时间点的事实
不同的 Assertion
客观冲突
历史演进状态
```

函数式语义属于认识论解释范畴，而非底层 Proposition 存储拒绝规则。

---

# 47. 谓词基数 (Predicate Cardinality)

可能的声明：

```text
min_per_subject (每主体最小值)
max_per_subject (每主体最大值)
min_per_object (每客体最小值)
max_per_object (每客体最大值)
```

基数约束**必须 (MUST)** 声明其性质属于：

```text
structural (结构性)
还是
epistemic (认识论性)
```

---

# 48. 结构基数 vs. 认识论基数 (Structural vs. Epistemic Cardinality)

结构基数可以拒绝非法的记录拓扑。

认识论基数定义了冲突集，但不会阻止冲突主张共存。

示例：

```text
person primary_timezone 最大接受值 = 1
```

绝不应当导致互相矛盾的导入证据无法被存储。

---

# 49. 互斥取值 (Exclusive Values)

谓词可以声明相互排斥的字面量备选项。

示例：

```text
status:
    active (活跃)
    archived (归档)
    deleted (删除)
```

若在重叠的上下文/时间下互斥，支持多个取值就会产生认识论冲突。

---

# 50. 封闭取值集合 (Closed Value Set)

谓词**可以 (MAY)** 将枚举声明为封闭取值集。

这是一条语义校验规则。

它并不自动构成封闭世界认识论假设（closed-world epistemic assumption）。

两者截然不同。

---

# 51. 封闭世界提示 (Closed-World Hint)

谓词/Profile **可以 (MAY)** 声明特定的权威快照支持封闭世界推理。

这**必须 (MUST)** 是显式的，并**应当 (SHOULD)** 引用 Evidence/Projection 上下文。

仅靠模式本身不应将通用谓词全局性地转化为封闭世界真理。

---

# 52. 谓词代数提示 (Predicate Algebraic Hints)

谓词**可以 (MAY)** 声明有限的结构语义，例如：

```text
symmetric (对称性)
inverse_of (逆关系)
transitive_hint (传递性提示)
```

KIP 应当保持克制。

这些声明会影响查询规划与推理。

它们**必须 (MUST)** 具备确定性的语义。

---

# 53. 传递性 (Transitivity)

如果：

```text
transitive = true
```

KIP 可以允许路径推理据此解释重复的边。

然而：

> **模式层面的传递性不会凭空创造出已断言的 Proposition。**

查询可以推导出可达性。

持久化存储派生的高阶 Assertion 需要显式的派生/溯源流程。

---

# 54. 逆谓词 (Inverse Predicate)

谓词可以声明：

```text
inverse_of = works_for / employs
```

这可以用于支持查询重写。

它并不强制要求在物理上双向存储两个 Proposition。

---

# 55. 对称谓词 (Symmetric Predicate)

示例：

```text
related_to
```

可以声明对称性。

对称性同样属于语义/查询行为。

持久化的原始历史形态可以保持不变。

---

# 56. 不相交类型 (Disjoint Types)

模式包可以声明：

```text
ConceptType A disjoint_with ConceptType B
```

这有助于认识论冲突检测，例如当某个实体被断言同时具备互不兼容的分类时。

类型成员资格本身必须在相关 Profile 中具有明确的建模策略。

---

# 57. 谓词语义必须保持显式 (Predicate Semantics Must Be Explicit)

模式包**应当 (SHOULD)** 避免含糊不清的“语义魔法”。

类似如下字段：

```text
causal = true
```

除非 KIP 明确定义了引擎必须对其执行何种操作，否则不应引入。

优先采用小规模的标准机器语义，配合自然语言文档说明。

---

# 58. 切面定义 (Facet Definition)

`FacetDefinition` 可以在不引入无类型通用元数据包（metadata bag）的前提下，通过经过校验的状态来扩展一个或多个 Core/Profile 元素种类。

示意：

```json
{
  "kind": "FacetDefinition",
  "name": "MnemonicState",

  "applies_to": [
    {"kind": "concept"},
    {"kind": "assertion"}
  ],

  "fields": {
    "memory_strength": {
      "value_type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "salience": {
      "value_type": "number",
      "minimum": 0,
      "maximum": 1
    }
  }
}
```

规范切面命名空间：

```text
kip://profiles/cognitive-memory@2.0.0/MnemonicState
```

---

# 59. 切面身份 (Facet Identity)

切面由其精确的模式符号引用唯一标识。

切勿将裸露的：

```text
"cognitive_memory"
```

切面键持久化为权威身份。

面向模型的简写可以存在。

---

# 60. 切面开放性 (Facet Openness)

切面**应当 (SHOULD)** 默认封闭：

```text
出现未知字段 → 抛出校验错误
```

因为 Facet 的初衷就是为了取代松散的元数据。

模式包可以根据需要在显式声明后允许扩展字段。

---

# 61. 切面不得重定义核心语义 (Facet Cannot Redefine Core Semantics)

切面**严禁 (MUST NOT)** 重新定义：

```text
Assertion stance (断言立场)
Assertion target (断言目标)
Evidence payload integrity (证据载荷完整性)
_system origin (系统来源)
MemorySpace ownership (记忆空间所有权)
Governance authority (治理权限)
```

核心语义具有最高优先级。

---

# 62. 结构字段定义 (Structural Field Definition)

Profile 需要表达记录拓扑结构而非客观世界命题的关系。

示例：

```text
Experience.has_step → ExperienceStep
Activity 输入/输出
Skill 验证引用
```

Core 内置结构字段由 Core 规范定义。

Profile **可以 (MAY)** 在其 Concept Type 上定义附加的结构字段。

---

# 63. 结构字段逻辑形态 (Structural Field Logical Shape)

示意：

```json
{
  "kind": "StructuralFieldDefinition",
  "name": "has_step",

  "owner_types": [
    "kip://profiles/cognitive-memory@2.0.0/Experience"
  ],

  "targets": {
    "concept_types": [
      "kip://profiles/cognitive-memory@2.0.0/ExperienceStep"
    ]
  },

  "cardinality": {
    "min": 0,
    "max": null
  },

  "ordered": true,

  "containment": "owned"
}
```

---

# 64. 结构字段不是命题 (Structural Fields Are Not Propositions)

结构字段：

```text
Experience.has_step → Step3
```

本身并不会变成客观认识论主张。

如果大脑希望主张：

```text
Step3 导致了失败
```

则应当使用 Predicate + Proposition + Assertion。

---

# 65. 结构包含语义 (Structural Containment)

结构字段**可以 (MAY)** 声明生命周期语义，例如：

```text
owned (所有包含)
referenced (引用)
weak_reference (弱引用)
```

这些不会自动赋予物理删除行为。

Core/KML 生命周期规范定义了具体语义。

---

# 66. 有序结构字段 (Ordered Structural Fields)

Experience 轨迹需要保持时序顺序。

结构字段可以声明：

```text
ordered = true
```

规范表示形式必须保留其相对顺序。

序列仅代表拓扑顺序，而非因果因果律。

---

# 67. 枚举定义 (Enum Definition)

可复用的 `EnumDefinition` 定义了一个带命名空间的有限集合。

示例：

```json
{
  "kind": "EnumDefinition",
  "name": "SkillStatus",
  "values": [
    "candidate",
    "active",
    "needs_review",
    "superseded"
  ]
}
```

---

# 68. 枚举演进 (Enum Evolution)

新增枚举取值对于生产者而言可能是向后兼容的，但可能会破坏假定枚举已穷尽的消费者。

兼容性分析必须同时考量：

```text
写入方兼容性 (writer compatibility)
读取方兼容性 (reader compatibility)
```

而不能仅看模式的数据外形。

---

# 69. 注册表扩展 (Registry Extensions)

Core 定义了稳定的基础注册表，例如：

```text
Assertion stance (立场)
Assertion mode (模式)
Evidence class (证据类别)
Activity class (活动类别)
```

模式包**可以 (MAY)** 在 Core 允许的前提下增加带命名空间的扩展值。

示例：

```text
kip://acme/deployment@1.0.0/evidence_class:synthetic_probe
```

具体序列化规范留待后续定义。

---

# 70. 核心注册表取值不得被重定义 (Core Registry Values Cannot Be Redefined)

模式包无法将：

```text
support
reject
uncertain
observed
stated
inferred
```

重定义为不兼容的含义。

仅允许进行带命名空间的扩展。

---

# 71. 模式包依赖 (Package Dependencies)

模式包可以依赖其他模式包。

示例：

```json
{
  "package": "kip://ldclabs/organization",
  "version": ">=1.3.0 <2.0.0"
}
```

依赖使用版本范围声明。

依赖解析产生精确的锁定版本。

---

# 72. 依赖类型 (Dependency Kinds)

推荐类型：

```text
required (必需)
optional (可选)
peer (对等)
```

基准一致性级别可能仅要求实现 `required`。

---

# 73. 必需依赖 (Required Dependency)

若没有兼容的精确版本，该模式包将无法被激活。

---

# 74. 可选依赖 (Optional Dependency)

若依赖存在，则可以开启附加的模式特性。

可选依赖绝不能不可预测地改变已有声明符号的含义。

---

# 75. 对等依赖 (Peer Dependency)

模式包期望 Space 提供另一个模式包/版本族，但不负责其具体的安装工作。

这对于 Profile 体系非常有用。

---

# 76. 依赖解析 (Dependency Resolution)

对于给定的：

```text
请求的模式包集合
可用的注册表状态
解析器算法/版本
锁定约束条件
```

依赖解析必须具备确定性。

最终解析出的精确锁定状态将被持久化记录。

---

# 77. 运行时无浮动依赖 (No Floating Runtime Dependency)

模式包在激活之后，**严禁 (MUST NOT)** 自动开始使用新发布的依赖版本。

升级必须通过显式的模式环境事务来执行。

---

# 78. 依赖冲突 (Dependency Conflict)

如果：

```text
模式包 A 要求 X <2
模式包 B 要求 X >=2
```

解析器可以根据其模式包隔离能力：

```text
支持多版本并行共存
或
拒绝该环境
```

严禁静默挑选某个不兼容的版本。

---

# 79. 多版本共存 (Side-by-Side Versions)

KIP 2.0 **应当 (SHOULD)** 允许同一个模式包的多个精确版本在同一个 Space 中保持可解析，以服务于历史数据。

示例：

```text
cognitive-memory@2.0.0
cognitive-memory@2.1.0
```

二者均可为了读取操作而保持安装状态。

但仅能指定一个版本作为默认写入版本。

---

# 80. 读取版本 vs. 写入版本 (Read Version vs. Write Version)

模式环境明确区分：

```text
readable versions (可读版本)
active write version (活动写入版本)
```

旧实例可以继续绑定至：

```text
@2.0.0
```

而新实例则使用：

```text
@2.1.0
```

直到执行了数据迁移。

---

# 81. 模式包激活状态 (Package Activation State)

推荐状态：

```text
installed (已安装)
validation_only (仅用于校验)
active (已激活)
deprecated (已废弃)
blocked (已封禁)
quarantined (已隔离)
```

确切命名可能会有所调整。

---

# 82. `installed` (已安装)

模式包资产在本地可用，但未激活用于常规写入。

---

# 83. `validation_only` (仅用于校验)

可用于检查/校验导入的数据，但不能作为本地新认知的默认模式。

适用于不受信或外部模式包。

---

# 84. `active` (已激活)

在 Space 治理允许下完全可用。

若被选定/默认，可参与新数据的写入。

---

# 85. `deprecated` (已废弃)

已有数据保持可读。

新写入**应当 (SHOULD)** 避免使用该版本。

---

# 86. `blocked` (已封禁)

该模式包不得用于新操作；通常是由于安全或语义事件导致。

已有数据在历史/审计策略下保持可供检查。

---

# 87. `quarantined` (已隔离)

资产被隔离以等待审查。

它**严禁 (MUST NOT)** 影响正常的模式解析。

---

# 88. 激活属于治理操作 (Activation Is a Governance Operation)

安装/激活/升级操作需要具备：

```text
manage_schema
```

权限以及任何配置的审批/安全流程。

普通的胶囊导入操作无法激活模式。

---

# 89. 模式包信任不等于数据信任 (Package Trust Is Not Data Trust)

信任某个模式包意味着：

```text
Space 批准该语义契约投入使用
```

这并不意味着使用该模式的所有数据都是真实的。

---

# 90. 模式包签名不等于模式批准 (Package Signature Is Not Schema Approval)

合法的发布者数字签名不能绕过本地的：

```text
治理管控
兼容性检查
安全审查
```

---

# 91. 模式校验分层 (Schema Validation Layers)

KIP 2.0 明确区分：

```text
核心校验 (Core validation)
模式包校验 (Package validation)
跨元素语义校验 (Cross-element semantic validation)
认识论诊断 (Epistemic diagnostics)
治理校验 (Governance validation)
```

---

# 92. 核心校验 (Core Validation)

始终由 Core 强制执行：

```text
元素外形结构
Core 核心种类
不可变字段
同空间闭包原则
Proposition 元组规则
Assertion 目标规则
Evidence/Activity 结构
_system 系统字段防护
```

模式包无法削弱 Core 校验。

---

# 93. 模式包校验 (Package Validation)

由模式包强制执行：

```text
Concept 属性外形
Predicate 主体/客体合法性
Literal 数据类型
Facet 外形结构
结构字段基数
注册表扩展有效性
```

---

# 94. 跨元素语义校验 (Cross-Element Semantic Validation)

某些约束需要基于图谱状态进行校验：

```text
唯一逻辑键 (unique logical key)
结构包含关系 (structural containment)
有界结构基数 (bounded structural cardinality)
引用类型匹配 (referential type match)
```

引擎可以在事务中执行校验。

---

# 95. 认识论约束不等于写入拒绝 (Epistemic Constraints Are Not Write Rejection)

函数式/互斥的现实世界语义通常产生：

```text
冲突诊断信息 (conflict diagnostics)
```

而非导致写入失败。

否则系统将无法记录客观存在的分歧。

---

# 96. 治理校验 (Governance Validation)

模式无法自行授权：

```text
读取/写入
密级降低
权限提升
信任判定
```

治理策略保持独立适用。

---

# 97. 校验结果 (Validation Result)

推荐的数据结构：

```json
{
  "valid": false,
  "violations": [
    {
      "code": "SCHEMA_TYPE_MISMATCH",
      "schema_ref": "...",
      "path": "object",
      "message": "works_for 要求 Organization 类型的客体"
    }
  ],
  "warnings": []
}
```

---

# 98. 校验严重级别 (Validation Severity)

可能的级别：

```text
error (错误)
warning (警告)
info (信息)
```

仅有确定性声明的约束才应当产生符合一致性要求的 error 级别错误。

模型提示词指引严禁静默演变成硬性约束。

---

# 99. 校验严格性 (Validation Strictness)

对于声明的精确模式，语义契约错误在所有合规引擎间**应当 (SHOULD)** 具有确定性表现。

实现可以提供 Lint 检查扩展。

它们必须严格区分：

```text
规范性校验 (normative validation)
实现级 Lint 检查 (implementation lint)
```

---

# 100. 模型提示词指引 (Model Hints)

模式包可以包含面向大语言模型的文档说明：

```text
description (描述)
when_to_use (适用场景)
when_not_to_use (不适用场景)
examples (示例)
common_confusions (常见混淆)
formation_guidance (记忆形成指导)
recall_guidance (记忆召回指导)
```

这些有助于模型优先（Model-First）的交互。

除非同时在规范性约束字段中表达，否则它们不属于机器语义规则。

---

# 101. 模型提示词指引示例 (Model Hint Example)

```json
{
  "model_hints": {
    "summary": "针对目标导向的情境轨迹使用 Experience。",
    "avoid": [
      "切勿为每次漫长对话都创建 Experience。",
      "切勿存储隐藏的思维链 (chain-of-thought)。"
    ]
  }
}
```

这对 Anda 大脑非常有用。

但它不是协议级校验器。

---

# 102. 规范性内容 vs. 建议性内容 (Normative vs. Advisory Package Content)

模式包中的每个字段在概念上**应当 (SHOULD)** 分类为：

```text
normative (规范性)
advisory (建议性)
documentation (纯文档)
```

这避免了自然语言描述意外改变跨引擎的行为。

---

# 103. 模式包文档 (Package Documentation)

模式包**应当 (SHOULD)** 包含足够的文档，以便智能体回答：

```text
该类型代表什么含义？
哪些字段是合法的？
哪些谓词可以连接它？
哪些字段属于结构字段？
可能会产生哪些冲突？
哪个模式包/版本拥有该符号？
```

---

# 104. 紧凑认知入门引述 (Compact Cognitive Primer)

META **应当 (SHOULD)** 支持专为 LLM 优化的紧凑模式入门引述。

示例：

```text
Person
  语义人类实体
  attributes: display_name?
  predicates:
    prefers → Concept | Literal
    belongs_to_domain → Domain

Experience
  目标导向的情境轨迹
  structural:
    has_step → ExperienceStep[]
```

该入门引述基于权威的模式包资产生成。

---

# 105. 模式自省 (Schema Introspection)

推荐的概念操作：

```text
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE SCHEMA ENVIRONMENT
LIST SCHEMA PACKAGES
```

具体的 META 语法留待后续定义。

---

# 106. 自省返回规范身份 (Introspection Returns Canonical Identity)

即使通过别名进行查询：

```text
DESCRIBE TYPE "Person"
```

响应内容**应当 (SHOULD)** 包含：

```text
规范精确引用
模式包
版本
符号种类
```

---

# 107. 自省与治理 (Introspection and Governance)

Principal 可能未被允许发现所有已安装的模式包。

模式的存在性本身可能会泄露：

```text
医疗领域信息
安全系统细节
组织秘密项目
```

治理平面可以对自省结果进行过滤。

---

# 108. 模式环境解析次序 (Schema Environment Resolution)

面向模型的本地名称在概念上按如下次序进行解析：

```text
1. 显式的全限定精确引用
2. 显式别名
3. 激活状态下无歧义的本地符号
4. 若缺失或存在歧义则报错
```

在写入操作中，切勿使用模糊匹配来选定规范模式身份。

---

# 109. 搜索可以辅助但不能决定身份 (Search Can Help, But Cannot Decide Identity)

智能体可以使用语义搜索来发现可能的模式定义。

但在发现之后，写入解析**必须 (MUST)** 显式且确定性地选择精确符号。

---

# 110. 数据写入时严禁自动创建未知模式 (No Auto-Create Unknown Schema on Data Write)

KIP 1.x 要求“先定义后使用（define-before-use）”。

KIP 2.0 延续了该原则。

普通数据变更中出现的未知类型/谓词，**严禁 (MUST NOT)** 静默创建新的模式定义。

模式创建是一个独立的模式包编写/治理流程。

---

# 111. 模式编写 (Schema Authoring)

工具链**可以 (MAY)** 允许智能体提议/打包模式。

但是：

```text
提议 (proposal)
≠
激活 (activation)
```

发布/激活需要经过治理授权。

---

# 112. 动态模式演进 (Dynamic Schema Evolution)

KIP 保持了高度的可扩展性。

智能体可以识别出：

```text
缺失的类型
缺失的谓词
不充分的约束
```

并提议发布新的模式包版本。

这既保留了自主演进能力，又防止了运行时认知对语义进行静默篡改。

---

# 113. 模式包兼容性 (Package Compatibility)

兼容性是多维度的。

一个版本可能属于：

```text
read-compatible (读取兼容)
write-compatible (写入兼容)
projection-compatible (投影兼容)
migration-compatible (迁移兼容)
source-compatible for model DSL (模型 DSL 源码兼容)
```

单一的 "compatible: true" 标志位是不充分的。

---

# 114. 兼容性描述符 (Compatibility Descriptor)

示意：

```json
{
  "from": "1.2.0",
  "to": "1.3.0",

  "read": "compatible",
  "write": "compatible",
  "semantics": "compatible",
  "migration": "none"
}
```

---

# 115. 兼容性类别 (Compatibility Classes)

推荐的高阶分类：

```text
backward_compatible (向后兼容)
requires_transform (需要数据转换)
breaking (破坏性变更)
```

并可附带细粒度的维度说明。

---

# 116. 向后兼容 (Backward Compatible)

旧数据在新模式包版本下依然有效且保持语义不变。

示例包括：

```text
新增可选属性
新增 Concept Type
新增 Predicate
增加建议性文档说明
```

但需注意枚举变更的特殊情况。

---

# 117. 需要转换 (Requires Transform)

旧数据可以通过声明的转换规则确定性地完成迁移。

示例：

```text
重命名字段
拆分字段
将属性提升为 Proposition
改变结构表示形式
```

---

# 118. 破坏性变更 (Breaking)

不存在保证通用的转换规则或语义兼容性。

迁移可能需要：

```text
人工/智能体审查复核
记忆重新形成 (re-formation)
双版本长期共存
```

---

# 119. 语义兼容性重于数据形态兼容性 (Semantic Compatibility Is More Important Than Shape Compatibility)

示例：

```text
字段名保持不变
数据类型保持不变
描述中的含义发生了改变
```

这依然属于语义上的破坏性变更。

模式包作者**必须 (MUST)** 对含义进行版本化，而不能仅关注 JSON 结构。

---

# 120. 附加性谓词变更 (Additive Predicate Change)

新增谓词通常属于向后兼容变更。

将已有谓词从：

```text
non-functional (非函数式)
```

变更为：

```text
functional (函数式)
```

可能会改变冲突判定语义，因而可能属于破坏性变更。

---

# 121. 收紧约束 (Tightening Constraints)

将：

```text
string → enum
optional → required
开放属性 → 封闭属性
```

可能会使旧数据失效。

通常需要数据转换或升级主版本号。

---

# 122. 放宽约束 (Loosening Constraints)

将：

```text
required → optional
enum → 宽泛的 string
```

可能保留了旧数据的写入合法性，但可能会破坏期望更强不变式的消费者。

兼容性评估必须考量读取方。

---

# 123. 枚举项增加 (Enum Additions)

新增枚举值对生产者而言可能是兼容的，但对要求穷尽匹配的消费者而言是不兼容的。

模式包作者应当在相关场景下显式声明读取方兼容性。

---

# 124. 模型提示词变更 (Model Hint Changes)

纯粹的文档/模型提示词改进在规范语义保持完全一致的前提下，可以作为修订号/次版本号发布。

若提示词变更导致推荐的记忆形成行为对类型的理解产生实质性重新解释，则应当升级版本号。

---

# 125. 模式血统谱系 (Schema Lineage)

模式包版本**可以 (MAY)** 声明：

```text
previous_version (前序版本)
supersedes_version (替代版本)
forked_from (分叉来源)
```

以供发现与审计。

这些不能替代精确的依赖语义。

---

# 126. 分叉模式包 (Forked Package)

第三方可以将：

```text
kip://profiles/cognitive-memory@2.0.0
```

分叉为：

```text
kip://acme/cognitive-memory@1.0.0
```

即使初始内容完全一致，它也拥有独立的规范身份。

内容摘要相同并不会合并模式包命名空间。

---

# 127. 模式包等价性 (Package Equivalence)

两个模式包可能在字节层面完全一致，但身份不同。

KIP **可以 (MAY)** 暴露摘要等价性。

当策略依赖于规范模式包身份时，**严禁 (MUST NOT)** 静默将一个命名空间替换为另一个。

---

# 128. 迁移描述符 (Migration Descriptor)

模式包可以包含声明式的迁移元数据。

示例：

```json
{
  "from": "2.0.0",
  "to": "2.1.0",
  "kind": "declarative",
  "operations": [
    {
      "op": "rename_attribute",
      "type": "Experience",
      "from": "outcome",
      "to": "outcome_summary"
    }
  ]
}
```

具体迁移 DSL 留待后续定义。

---

# 129. 核心模式包严禁包含任意迁移代码 (No Arbitrary Migration Code in Core Package)

基准模式包**严禁 (MUST NOT)** 包含安装时执行的任意代码。

原因包括：

```text
安全性
跨引擎确定性
可审计性
可移植性
大模型可检查性
```

部署环境可以使用外部可信的迁移工具，但这超出了标准模式包执行语义范畴。

---

# 130. 声明式迁移类别 (Declarative Migration Classes)

潜在的标准转换操作：

```text
重命名符号 (rename symbol)
重命名属性 (rename attribute)
复制属性 (copy attribute)
删除已废弃属性 (delete deprecated attribute)
更改默认写入类型 (change default write type)
映射枚举取值 (map enum value)
将属性提升为命题 (promote attribute to Proposition)
转换谓词引用 (convert Predicate ref)
添加切面 (add Facet)
移动切面字段 (move Facet field)
```

只有具备精确跨引擎语义的转换才应当被标准化。

---

# 131. 语义迁移可能需要认知介入 (Semantic Migration May Require Cognition)

某些迁移在机械层面无法做到完全正确。

示例：

```text
旧的 "relationship" 字段
→ Friend | Colleague | Family
```

需要语义层面的解读判断。

描述符应当声明：

```text
migration = review_required (需要复核)
```

而非假装可以进行确定性转换。

---

# 132. 迁移是一次认知状态转换 (Migration Is a Cognitive-State Transformation)

模式迁移可能会创建：

```text
新 Concept
新 Proposition
新 Assertion
新 Activity
新 Facet
```

在语义适宜的情况下，它必须保留溯源血统与历史记录。

---

# 133. 迁移活动 (Migration Activity)

迁移操作**应当 (SHOULD)** 生成溯源血统：

```text
旧元素 (old element(s))
    ↓
活动：schema_migration
    ↓
新元素 (new element(s))
```

根据转换性质，旧元素可以保持历史记录、标记为已废弃、已迁移或打上墓碑标记。

---

# 134. 断言迁移 (Assertion Migration)

变更模式绝不能静默改变历史 Assertion 的含义。

首选策略：

```text
旧 Assertion 依然绑定至旧的精确模式引用
新转换的 Assertion 作为带有迁移溯源的新元素存在
```

除非转换能够被数学证明是完全保持表示等价的。

---

# 135. 原地模式引用改写 (In-Place Schema Ref Rewrite)

针对如下操作的原地改写：

```text
schema_ref @2.0 → @2.1
```

仅应在版本被声明并验证为对该元素完全保持语义不变时才被允许。

否则应当创建迁移后的新状态。

---

# 136. 双版本共存过渡期 (Dual-Version Period)

一个 Space 可以临时同时包含：

```text
旧版本数据
新版本数据
```

模式环境支持同时读取两者。

新写入操作靶向选定的活动版本。

维护流程可以逐步执行平滑迁移。

---

# 137. 迁移完成判定 (Migration Completion)

当满足以下条件时，可视为迁移完成：

```text
所有必需元素已转换完毕
没有任何活跃写入路径使用旧版本
旧模式包被保留用于历史读取
所有校验均通过
迁移审计记录已提交
```

只要历史数据依然引用旧模式包，旧模式包资产通常应当保持可访问。

---

# 138. 绝不能盲目删除被引用的模式 (Never Delete a Referenced Schema Blindly)

如果认知状态依然引用：

```text
package@1.0.0/Symbol
```

引擎**严禁 (MUST NOT)** 移除解释该数据所需的唯一可用模式定义，除非：

```text
数据已被迁移/彻底清除
或
存在可解析的持久化外部模式归档
```

---

# 139. 模式归档 (Schema Archive)

Space/Nexus **应当 (SHOULD)** 为所有保留的认知数据维护或能够解析历史模式包资产。

这是保障认知可解释性的必要组成部分。

---

# 140. 模式升级工作流 (Schema Upgrade Workflow)

推荐流程：

```text
1. 请求模式包/版本
2. 获取规范资产
3. 校验 digest/签名 (如有)
4. 检查依赖项
5. 解析精确锁定
6. 校验治理策略
7. 兼容性分析
8. 迁移预览
9. 校验受影响的已有数据
10. 审批 (如需要)
11. 原子化激活新模式环境
12. 执行迁移 (若获单独授权)
13. 记录审计
14. 监控运行
```

---

# 141. 原子化激活 (Atomic Activation)

模式环境的激活**应当 (SHOULD)** 具备原子性。

请求绝不能观测到半解析的中间状态，例如：

```text
新模式包
旧的不兼容依赖项
新别名
旧默认值
```

事务规范定义了具体机制。

---

# 142. 回滚 (Rollback)

回滚是指将活动写入/默认环境切换回先前的有效锁定状态。

它不会抹除已在新版本下写入的数据。

那些元素依然绑定在其精确的模式引用上。

---

# 143. 模式环境版本 (Schema Environment Version)

模式环境的每次治理变更**应当 (SHOULD)** 递增：

```text
environment version (环境版本号)
```

并产生审计记录。

查询/事务可以选择固定环境版本以确保可重现性。

---

# 144. 事务模式快照 (Transaction Schema Snapshot)

每个写入事务在概念上都应当针对一个已解析的模式环境快照执行。

这防止了：

```text
事务执行中途发生模式包升级
```

导致不同命令之间的校验语义发生漂移。

---

# 145. 事务凭单 (Transaction Receipt)

高确信度的事务凭单**可以 (MAY)** 包含：

```text
schema_environment_version
已解析的模式包摘要 (package digests)
```

以供合规审计与回放。

---

# 146. 缺失模式的导入数据 (Imported Data with Missing Schema)

当导入引用了不可用模式包的胶囊时：

```text
严禁盲目猜测等价的本地类型
```

可选的处理方式：

```text
拒绝导入
置于隔离区暂扣
在策略允许下获取依赖包
在等待模式期间存储为不透明的可移植胶囊
```

---

# 147. 导入时仅用于校验的模式 (Validation-Only Schema on Import)

目标端可以将不熟悉的模式包获取为：

```text
validation_only (仅用于校验)
```

以检查导入的数据，同时不允许使用该模式进行本地新数据的写入。

这是一种安全的互操作模式。

---

# 148. 模式包安全威胁 (Schema Package Security Threats)

至少应当考量以下威胁：

```text
命名空间抢注
同版本内容替换
依赖混淆
恶意模式导入
别名劫持
约束削弱
冲突语义投毒
切面走私
治理作用域混淆
迁移代码执行风险
模式降级攻击
模式包签名混淆
历史模式丢失
类型名称冲突
```

---

# 149. 命名空间抢注 (Namespace Squatting)

一个命名为：

```text
kip://openai/...
```

的模式包，并不证明其归属于该组织，除非注册表/发布者身份策略对此进行了验证。

仅靠规范名称本身并不代表权威。

---

# 150. 同版本内容替换攻击 (Same-Version Replacement Attack)

注册表先提供：

```text
package X@1.0.0 digest A
```

随后又提供：

```text
X@1.0.0 digest B
```

合规的锁定环境**必须 (MUST)** 检测并拒绝这种不匹配。

---

# 151. 依赖混淆 (Dependency Confusion)

如果某个模式包要求：

```text
acme/internal-schema
```

解析器绝不能静默替换为同名的公共模式包。

在完成命名空间解析后，依赖项必须使用精确的规范模式包 ID。

---

# 152. 别名劫持 (Alias Hijacking)

新安装的模式包定义了本地 `Person`。

它绝不能静默改变已有的别名解析。

在治理平面选定别名映射之前，出现歧义应当导致解析失败。

---

# 153. 约束削弱攻击 (Constraint Weakening Attack)

导入的模式包不能替换本地可信的：

```text
Skill
```

为一个同名但移除了安全关键约束的类型。

规范符号引用从根本上防范了单纯基于名称的替换。

治理策略应当基于规范模式包身份来限定作用域。

---

# 154. 冲突语义投毒 (Conflict-Semantics Poisoning)

恶意模式可能会声明：

```text
所有备选值均不冲突
```

以压制认识论告警。

不受信的模式包在获得批准前保持为 validation-only 或被隔离。

认识论策略亦可限制哪些模式包被允许贡献冲突语义。

---

# 155. 切面走私 (Facet Smuggling)

不受信的模式包绝不能定义一个名为：

```text
authority = executable
```

的切面字段并以此非法获取治理权限。

Facet 属于认知/Profile 状态。

治理权限会忽略此类内容，除非受保护策略以非放大方式显式映射它。

---

# 156. 模式无法重定义治理 (Schema Cannot Redefine Governance)

模式包**严禁 (MUST NOT)** 重新定义：

```text
Principal
Grant
Policy
ActorBinding
Governance classification (治理密级)
manage_schema
```

等控制平面语义。

它可以定义同名的认知 Concept，但它们在控制层面是惰性的。

---

# 157. 模式无法重定义核心元素种类 (Schema Cannot Redefine Core Element Kinds)

第三方模式包无法改变以下对象的语义：

```text
Concept
Proposition
Assertion
Evidence
Activity
MemorySpace
```

Core 版本全权控制这些语义。

---

# 158. 核心模式包 (Core Package)

KIP 2.0 规范自身**应当 (SHOULD)** 表示为规范的保留模式包：

```text
kip://core@2.0.0
```

它定义了 Core 符号/注册表的可自省描述。

然而，引擎对 Core 的一致性符合并不依赖于普通模式包的激活。

Core 是整个系统的基石。

---

# 159. 核心版本兼容性 (Core Version Compatibility)

模式包清单声明其兼容的 KIP Core 版本范围。

示例：

```text
requires KIP Core >=2.0.0 <3.0.0
```

要求 Core 3 语义的模式包无法在 Core 2 上激活。

---

# 160. 认知记忆 Profile 模式包 (Cognitive Memory Profile Package)

标准 Profile **应当 (SHOULD)** 成为：

```text
kip://profiles/cognitive-memory@2.0.0
```

包含如下定义：

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
MnemonicState Facet
has_step 结构字段
compiled_to 结构字段
```

具体以最终的 Profile 设计为准。

---

# 161. Profile 是模式包而非核心分类学 (Profiles Are Packages, Not Core Taxonomy)

这保持了架构清晰性：

```text
KIP Core
    通用认知基质

Cognitive Memory Profile
    一套标准化的记忆模型

其他 Profile
    替代性的领域/记忆模型
```

---

# 162. 模式包组合 (Package Composition)

领域模式包可以扩展 Cognitive Memory Profile 而无需对其进行修改。

示例：

```text
kip://acme/devops-memory@1.0.0

depends on:
    cognitive-memory@>=2.0 <3
```

添加了：

```text
Deployment
Incident
RunbookSkill
deployment_status
caused_by
```

---

# 163. 类型扩展 / 继承 (Type Extension / Inheritance)

KIP 对继承机制保持审慎。

模式包**可以 (MAY)** 声明语义子类型关系，例如：

```text
RunbookSkill is_a Skill
```

但在引擎将其用于数据校验之前，具体机制必须先完成标准化。

---

# 164. 默认名义类型体系 (Nominal Typing Default)

推荐基线：

> **KIP 模式类型采用名义类型系统 (Nominal Typing)。**

两个具有相同数据形态的类型并不是同一个类型，除非存在已声明的语义关系。

这防止了含义因偶然的结构等价而发生混淆。

---

# 165. 子类型化 (Subtyping)

若标准化，子类型化应当是显式且无环的。

示例：

```text
RunbookSkill <: Skill
```

可以允许接受 `Skill` 的 Predicate 同样接受 `RunbookSkill`。

跨模式包的子类型化对依赖关系非常敏感。

---

# 166. 多重继承 (Multiple Inheritance)

基准 v2 **应当 (SHOULD)** 避免任意的多重继承，除非存在极其强烈的用例需求。

通过：

```text
Facets (切面)
Predicates (谓词)
Structural Fields (结构字段)
```

进行组合通常更为安全，且更易于 LLM 理解。

---

# 167. 类型演进 vs. 子类型创建 (Type Evolution vs. Subtype Creation)

如果新版本对语义产生了实质性修改，应当采用：

```text
新主版本号
或
新类型
```

而非滥用子类型关系来掩盖不兼容性。

---

# 168. 谓词扩展 (Predicate Extension)

模式包可以定义更具体的 Predicate，而非覆盖另一个模式包的谓词。

任何模式包均不得修改其他模式包的符号定义。

---

# 169. 规范层面严禁符号遮蔽 (Symbol Shadowing Is Forbidden Canonically)

规范符号引用无法被遮蔽。

仅有本地别名可能会产生冲突。

---

# 170. 模式包重导出 (Package Re-Export)

模式包**可以 (MAY)** 为了模型调用的人机工程学体验而暴露依赖符号的别名/重导出。

持久化的规范引用**应当 (SHOULD)** 依然指向原始所属的模式包，除非该重导出定义了真正意义上的全新语义符号。

---

# 171. 依赖符号归属 (Dependency Symbol Ownership)

模式包不能仅因依赖了另一个模式包的符号就声称拥有它。

这保持了语义溯源谱系的清晰。

---

# 172. 模式包与认知胶囊 (Schema Package and Cognitive Capsule)

认知胶囊**应当 (SHOULD)** 声明精确的模式依赖关系。

示例：

```json
"schema": [
  {
    "package": "kip://profiles/cognitive-memory",
    "version": "2.0.0",
    "digest": "sha256:..."
  }
]
```

---

# 173. 胶囊无需内联所有模式 (Capsule Does Not Need to Inline Every Schema)

如果目标端能够安全解析精确的模式包，胶囊可以直接引用它们。

为了离线可移植性，胶囊**可以 (MAY)** 内嵌模式包资产。

内嵌的模式包依然需要治理平面的批准/激活。

---

# 174. 胶囊导入解析 (Capsule Import Resolution)

导入流程：

```text
读取精确模式引用
    ↓
检查本地锁定状态
    ↓
解析缺失的模式包
    ↓
校验 digest
    ↓
若允许则加载为 validation-only
    ↓
校验胶囊数据
    ↓
本地治理决定是否激活/导入
```

---

# 175. 具有模式感知的导出 (Schema-Aware Export)

导出应当保留精确的模式引用，即使本地 KQL 使用了别名。

这保证了可移植的确定性含义。

---

# 176. 模式与哈希计算 (Schema and Hashing)

规范模式包资产必须与 KIP-2.0-Capsule.md 协同定义：

```text
键排序规则
数值表示形式
Unicode 归一化规则
定义排序规则
默认值省略规则
引用归一化规则
```

---

# 177. 模式包摘要排除数字签名 (Package Digest Excludes Signatures)

推荐模式：

```text
未签名的规范模式包内容
    ↓ 计算哈希
摘要 (digest)
    ↓ 签名
数字签名 (signatures)
```

以避免自引用签名问题。

确切证明模型留待后续定义。

---

# 178. 模式包文档计入摘要 (Package Documentation in Digest)

规范性/建议性内容若属于已发布资产的一部分，**应当 (SHOULD)** 被纳入模式包摘要计算中。

因此，修改模型提示词指引可能需要发布新版本。

---

# 179. 模式注册表 (Schema Registry)

KIP 不强制要求设立单一的全局注册表。

系统实现可以从以下来源解析模式包：

```text
内置注册表
组织级注册表
内容寻址存储
HTTP 注册表
Git 代码仓库
去中心化注册表
胶囊内嵌资产
```

---

# 180. 解析器信任 (Resolver Trust)

模式包获取来源与模式包身份/签名是相互独立的。

安全的解析器负责验证：

```text
请求的规范身份
精确版本
digest / 锁定配置
发布者策略 (若需要)
```

而非单纯信任传输层名称。

---

# 181. 离线运行 (Offline Operation)

具有本地缓存锁定模式包资产的模式环境可以在无需访问注册表网络的情况下运行。

这对于保障智能体大脑的可靠性是非常理想的。

---

# 182. 模式可用性故障 (Package Availability Failure)

如果历史模式包资产临时不可用：

```text
原始数据字节可以保持存储
```

但需要模式支持的语义操作应当返回：

```text
模式不可用 / 未解析 (schema unavailable / unresolved)
```

而非进行盲目猜测。

---

# 183. 模式解析错误类别 (Schema Resolution Error Classes)

未来的错误注册表应当区分：

```text
SchemaPackageNotFound (模式包未找到)
SchemaVersionNotFound (模式版本未找到)
SchemaDigestMismatch (模式摘要不匹配)
SchemaDependencyConflict (模式依赖冲突)
SchemaSymbolNotFound (模式符号未找到)
SchemaSymbolAmbiguous (模式符号存在歧义)
SchemaNotActive (模式未激活)
SchemaBlocked (模式已被封禁)
SchemaValidationFailed (模式校验失败)
SchemaMigrationRequired (需要模式迁移)
SchemaCoreVersionMismatch (核心版本不匹配)
```

---

# 184. 面向模型的恢复指引 (Model-Friendly Recovery Hints)

错误响应**应当 (SHOULD)** 告知智能体如何安全恢复。

示例：

```text
类型 "Person" 存在歧义。
候选列表：
  kip://profiles/cognitive-memory@2.0.0/Person
  kip://acme/hr@1.0.0/Person

请使用精确的全限定引用或配置的别名。
```

---

# 185. 模式编写一致性 (Schema Authoring Conformance)

模式包编写工具在发布前**应当 (SHOULD)** 校验：

```text
清单 (manifest)
符号命名规范
依赖闭包完整性
引用解析正确性
约束合法性
不存在重定义 Core 的行为
不存在未解析的符号
迁移描述符的正确性
规范摘要计算
```

---

# 186. 模式包检查工具 (Package Lint)

可选的 Lint 工具可以检测：

```text
事实层面的默认值
存在歧义的描述
过度开放的属性设定
缺失模型提示词指引
谓词命名冲突
未升级主版本号的不安全语义变更
```

除非标准化，否则 Lint 属于建议性机制。

---

# 187. 模式差异对比 (Schema Diff)

工具链**应当 (SHOULD)** 提供语义维度的 Diff 能力：

```text
新增/移除的类型
新增/移除的谓词
属性变更
约束变更
Facet 变更
冲突语义变更
依赖关系变更
模型提示词变更
迁移可用性
```

这对于智能体/人工审查至关重要。

---

# 188. 兼容性分析器 (Compatibility Analyzer)

兼容性分析器可以对以下维度的影响进行分类评估：

```text
已有数据
新写入操作
KQL/KML 客户端
认识论投影
治理资源作用域
胶囊可移植性
```

---

# 189. 治理影响分析 (Governance Impact Analysis)

在激活之前，系统**应当 (SHOULD)** 检测治理策略是否引用了已变更模式包中的符号。

示例：

```text
策略：
  仅针对 kip://profiles/cognitive-memory@2.0.0/Skill
  允许赋予 behavioral 权限
```

升级至 3.0 可能需要经过治理复核。

---

# 190. 认识论影响分析 (Epistemic Impact Analysis)

针对以下维度的变更：

```text
functional (函数式)
exclusive (互斥)
cardinality (基数)
disjoint (不相交)
closed-world hints (封闭世界提示)
```

可能会改变冲突检测结果。

升级预览**应当 (SHOULD)** 明确指出这一点。

---

# 191. 召回影响分析 (Recall Impact Analysis)

模式/模型提示词的变更可能会影响大脑在记忆形成/召回中对类型的使用方式。

Profile 的升级**应当 (SHOULD)** 针对大脑基准测试集进行验证。

仅具备协议层面的正确性是不够的。

---

# 192. 模式包 vs. 大脑算法 (Schema Package vs. Brain Algorithm)

模式包可以描述：

```text
Experience 包含 steps
Skill 包含 applicability (适用性)
```

它不应内嵌完整的算法逻辑：

```text
何时形成 Experience
如何计算显著性得分
如何整合提炼 Skill
```

这些属于 Anda 大脑 / Profile 指引范畴。

---

# 193. Profile 规范语义 vs. 算法指导 (Profile Normative Semantics vs. Algorithm Guidance)

Cognitive Memory Profile 模式包可以包含：

```text
规范性数据外形
规范性字段含义
建议性记忆形成指导
```

但必须对它们进行严格区分。

---

# 194. 模式包 vs. 信任策略 (Schema Package vs. Trust Policy)

模式包可以声明：

```text
该 Predicate 代表用户自我报告的偏好
```

作为语义元数据。

它绝不能在治理层面声称：

```text
信任所有用户，置信度设为 0.99
```

Trust Resolver 可以在经授权的策略下，选择利用模式包的语义标注。

---

# 195. 模式认识论标注 (Schema Epistemic Annotations)

标准化模式包最终可以提供如下标注：

```text
subjective_self_report (主观自我报告)
externally_verifiable (外部可验证)
time_sensitive (时间敏感)
functional (函数式)
normative (规范性)
predictive (预测性)
```

作为认识论策略的输入项。

只有语义定义极其精确的标注才应当被标准化。

---

# 196. 标注不直接设定分值 (Annotations Do Not Set Scores)

模式不应硬编码通用的：

```text
confidence = 0.8
trust = 0.9
```

因为认识论评估是高度依赖上下文的。

---

# 197. 模式包 vs. 治理策略 (Schema Package vs. Governance Policy)

模式包可以包含建议的密级提示。

它们不会自动激活治理密级，除非经授权的策略显式采纳它们。

---

# 198. 基于模式界定治理资源作用域 (Governance Resource Scope by Schema)

治理策略可以安全地引用规范的精确引用或模式包家族标识。

示例：

```text
禁止外部智能体读取
  cognitive-memory/Skill
```

但版本家族匹配必须是显式且受策略控制的。

---

# 199. 策略版本范围 (Policy Version Ranges)

治理策略可以有意限定作用域为：

```text
kip://profiles/cognitive-memory >=2.0 <3.0 / Skill
```

这属于策略匹配器。

它不会改变数据中存储的精确模式引用。

---

# 200. 模式环境与 KQL (Schema Environment and KQL)

KQL 可以允许：

```text
?x {type: "Person"}
```

但前提是必须先在请求的模式环境中解析 `"Person"`。

规范执行计划必须使用精确引用。

---

# 201. 模式环境与 KML (Schema Environment and KML)

使用本地模式名称的 KML 写入操作，在执行校验/提交之前会被脱糖展开为精确引用。

事务凭单应当能够暴露已解析的精确引用。

---

# 202. 固定模式上下文 (Pinned Schema Context)

客户端**可以 (MAY)** 请求：

```text
schema_environment_version = N
```

以实现确定性的读写规划。

如果策略要求使用最新模式，针对过时环境的写入操作可能会失败。

---

# 203. 跨环境查询 (Cross-Environment Query)

历史/审计查询**可以 (MAY)** 显式针对跨多个模式版本的数据执行。

查询结果应当暴露精确引用。

---

# 204. 归一化类型族查询 (Normalized Type Family Query)

如果模式包血统/兼容性定义了该关系，高阶查询**可以 (MAY)** 请求：

```text
Experience 语义谱系中的所有版本
```

这不同于精确类型匹配。

---

# 205. 具有迁移感知的查询 (Migration-Aware Query)

运行时**可以 (MAY)** 提供投影归一化视图，将旧模式版本映射至当前逻辑视图。

此类投影**必须 (MUST)** 披露：

```text
源端精确模式引用
归一化/迁移方法
是否有损 (lossiness)
```

---

# 206. 严禁隐式模式强制转换 (No Hidden Schema Coercion)

如果旧模式与新模式无法安全归一化：

```text
返回独立取值 / 警告
```

而严禁进行静默强制转换。

---

# 207. 自描述模式自举引导 (Self-Describing Schema Bootstrap)

运行时必须能够在领域认知存在之前就解释模式。

Core 为以下对象提供自举引导自省能力：

```text
Package (模式包)
ConceptType (概念类型)
PredicateType (谓词类型)
FacetDefinition (切面定义)
StructuralFieldDefinition (结构字段定义)
EnumDefinition (枚举定义)
```

模型无需查询特殊的图谱实例即可理解类型系统。

---

# 208. 与 KIP 1.x 元类型的关系 (Relationship to KIP 1.x Meta-Types)

KIP 1.x：

```text
$ConceptType
$PropositionType
```

通过普通的图谱 Concept 定义模式。

KIP 2.0：

```text
模式包资产 (Package Artifact) 定义
```

具有权威性。

兼容模式**可以 (MAY)** 暴露虚拟的/镜像的：

```text
$ConceptType
$PropositionType
```

视图以支持 v1 风格的自省。

---

# 209. KIP 1.x 模式迁移 (KIP 1.x Schema Migration)

针对每个 v1 模式定义：

```text
{type: "$ConceptType", name: "Person"}
{type: "$PropositionType", name: "prefers"}
```

迁移过程会构建一个或多个 Schema Packages。

---

# 210. 模式包边界发现 (Package Boundary Discovery)

遗留 v1 没有模式包命名空间。

迁移必须确定边界划分。

推荐来源：

```text
Core 模式
Cognitive Memory Profile 类型
组织/项目领域分组
显式的管理员映射规则
```

自动化迁移不应随意捏造发布者所有权。

---

# 211. 遗留类型身份 (Legacy Type Identity)

如果未获批匹配标准模式包映射，v1 类型：

```text
Person
```

可以迁移为：

```text
kip://legacy/<nexus-id>@1.0.0/Person
```

这安全地保留了身份标识。

---

# 212. 标准 Profile 映射 (Standard Profile Mapping)

如果 v1 部署的 `Person`/`Event` 与获批的标准 Profile 迁移完全匹配，治理可以将其映射为：

```text
kip://profiles/cognitive-memory@2.0.0/Person
```

否则使用 legacy 命名空间配合显式迁移。

---

# 213. 遗留 `instance_schema` 处理 (Legacy `instance_schema`)

在语义明确的情况下，将其转换为 Concept Type 属性约束。

应当记录 KIP 1.x 可选强制执行的差异。

v2 迁移应当校验已有实例并暴露出违规项，而不是静默丢弃字段。

---

# 214. 遗留谓词定义 (Legacy Predicate Definition)

将 `$PropositionType` 转换为 PredicateType。

除非手动编码，否则遗留 v1 缺乏丰富的主体/客体约束。

迁移应当将未知约束保留为开放约束，而非凭空臆造限制。

---

# 215. 遗留模式定义保持为历史记录 (Legacy Schema Definitions Remain Historical)

原始 v1 模式节点**可以 (MAY)** 作为：

```text
遗留认知/审计资产
```

予以保留，但不再具备权威活动模式地位。

---

# 216. 遗留领域不是模式包 (Legacy Domain Is Not Package)

KIP 1.x 中的 `Domain` 用于在语义层面组织知识。

它不应自动演变成 Schema Package 边界。

重温三者区分：

```text
Domain = 主题内容 (topic)
Package = 语义契约命名空间/版本 (semantic contract namespace/version)
Space = 治理边界 (governance boundary)
```

这是三个完全不同的正交维度。

---

# 217. 模式包、领域与记忆空间 (Package, Domain, and Space)

```text
Schema Package
    使用了何种词汇/契约？

Domain
    认知内容是关于什么的？

MemorySpace
    谁拥有/治理它？
```

示例：

```text
Package:
    cognitive-memory

Domain:
    Rust

Space:
    personal://yan
```

---

# 218. 跨空间使用同一模式包 (Same Package Across Spaces)

许多 Space 均可激活：

```text
cognitive-memory@2.0.0
```

它们的数据依然受到各自独立的治理。

模式身份不会导致认知数据发生合并。

---

# 219. 同一空间内使用不同模式包 (Different Packages in Same Space)

一个 Space 可以同时激活：

```text
cognitive-memory
organization
devops
legal
```

并配合确定性的别名映射。

---

# 220. 模式包发布生命周期 (Schema Package Publishing Lifecycle)

推荐流程：

```text
草案编写 (draft)
    ↓
校验 (validate)
    ↓
规范化 (canonicalize)
    ↓
计算摘要 (digest)
    ↓
可选签名 (optional sign)
    ↓
发布不可变版本 (publish immutable version)
    ↓
安装 (install)
    ↓
治理审查 (Governance review)
    ↓
激活生效 (activate)
```

---

# 221. 发布不等于激活 (Publish Does Not Activate)

发布者可以发布模式包。

Space 自行选择是否激活它。

二者属于独立的信任域。

---

# 222. 废弃 (Deprecation)

发布者可以发布元数据声明某个模式包/版本已被废弃。

本地 Space 决定是否以及何时停止新写入。

远端废弃不应静默改变已锁定的模式环境。

---

# 223. 安全撤销 (Security Revocation)

注册表/发布者可以通告：

```text
某模式包版本遭到安全入侵 (package version compromised)
```

Space 可以响应执行：

```text
封禁 (block)
隔离 (quarantine)
降级写入默认版本
```

历史数据依然保持可解释性。

---

# 224. 紧急封禁 (Emergency Block)

治理平面可以立即封禁某个模式版本。

被封禁的模式包：

```text
禁止新写入
若策略规定，禁止基于该 Profile 触发自动化行为
历史原始读取可以保留
```

随后进行迁移与复盘审查。

---

# 225. 模式包层级权限 (Package-Level Authority)

模式包的激活赋予的是语义解释权限，而非行为/工具执行权限。

定义了 `Skill` 的 Profile 并不直接授权 Skill 去实际执行。

---

# 226. 可执行内容不是模式 (Executable Content Is Not Schema)

代码、提示词、工作流以及工具策略属于诸如 Skill 的认知/Profile 资产。

切勿将可执行逻辑隐藏在模式包定义内部。

---

# 227. 正则表达式与约束安全性 (Regex and Constraint Safety)

即使是类似正则表达式的声明式约束，若实现不当也可能导致拒绝服务（ReDoS）。

合规引擎**应当 (SHOULD)** 采用有界/安全的校验语义，并可拒绝消耗过度资源的模式。

---

# 228. 约束复杂度限制 (Constraint Complexity Limits)

运行时能力可以对外通告：

```text
最大模式大小
最大依赖深度
最大约束复杂度
最大正则长度
最大枚举项数量
```

以防范模式滥用攻击。

---

# 229. 依赖深度 (Dependency Depth)

解析器在激活前**应当 (SHOULD)** 检测：

```text
循环依赖
过深层级
重复版本冲突
```

---

# 230. 依赖环路 (Dependency Cycles)

基准推荐：

> 必需的模式包依赖图必须是有向无环图 (DAG)。

如果未来用例需要环路，则需要显式的模块语义支持。

---

# 231. 符号引用环 (Symbol Reference Cycles)

类型定义之间可以相互引用：

```text
Person.friend → Person
Organization.owner → Person
```

这是受允许的。

只要在同一个模式包内，它就不属于模式包依赖环路。

---

# 232. 跨模式包类型引用 (Cross-Package Type Reference)

模式包仅在依赖声明允许/已解析的前提下，才能引用依赖包中的符号。

严禁存在未声明的隐式依赖。

---

# 233. 可选依赖符号 (Optional Dependency Symbol)

规范性必需字段**严禁 (MUST NOT)** 依赖可选模式包，除非该定义具备明确的条件语义。

优先推荐将可选集成拆分为独立的扩展模式包。

---

# 234. 扩展模式包模式 (Extension Package Pattern)

相比于：

```text
模式包 A 在 B 存在时可选地修改自身
```

更推荐采用：

```text
模式包 A
模式包 B
模式包 A-B 集成包 (Package A-B Integration)
```

这保持了语义的显式化。

---

# 235. 模式包分层架构 (Package Layering)

推荐的标准分层栈：

```text
kip://core
    ↓
kip://profiles/cognitive-memory
    ↓
领域模式包 (domain packages)
    ↓
组织/应用扩展模式包 (organization/application extension packages)
```

这是依赖分层，而非权限层级。

---

# 236. 模式包一致性 (Schema Package Conformance)

合规实现必须支持：

```text
精确的模式包身份/版本
不可变的模式包版本
持久化精确模式引用
依赖关系声明
已解析的模式环境
Concept Type 定义
Predicate Type 定义
Facet 定义
机器校验能力
模式自省能力
受治理控制的激活机制
历史模式可用性保障
```

---

# 237. 高级一致性 (Advanced Conformance)

高级实现可以进一步支持：

```text
结构字段模式
语义 Diff 对比
兼容性分析器
声明式数据迁移
多版本归一化查询
模式包数字签名
分布式注册表
模式锁定导出
```

---

# 238. 模式一致性测试夹具 (Schema Conformance Fixtures)

测试集应当覆盖：

```text
精确引用解析
存在歧义的本地类型名称
依赖缺失处理
依赖环路检测
版本范围解析
同版本摘要不匹配
新旧模式包共存
写入默认版本升级
函数式谓词冲突语义
封闭类型中的未知属性
必需属性缺失
Facet 校验
结构字段基数校验
不受信模式包导入
别名劫持防御
激活后封禁模式
迁移预览
包含废弃版本的历史数据
KIP 1.x 元类型迁移
```

---

# 239. 模式包安全测试夹具 (Package Security Fixtures)

至少包括：

```text
恶意模式包尝试重定义 Core Assertion
恶意 Facet 声明可执行权限
恶意模式包声明自身受信任
胶囊将远端 Grant 作为模式提示导入
来自不受信命名空间的同名 "Skill"
模式包依赖混淆
模式包版本替换攻击
模式升级削弱策略引用的类型约束
```

预期表现：

```text
无治理权限提权
无 Core 语义覆盖
无静默别名替换
```

---

# 240. 模式不变式 (Schema Invariants)

以下为规范性设计目标：

1. 权威模式是不可变的版本化模式包资产。
2. 普通认知图谱变更无法修改活动模式的语义。
3. 通过自省/镜像保持自描述性，而非依靠模式自我修改。
4. `package_id + exact version` 唯一标识一份不可变的规范模式包内容。
5. 相同 package/version 具有不同 digest 属于完整性错误。
6. 持久化的模式引用始终使用精确版本。
7. 版本范围仅为解析输入，绝非持久化的语义身份。
8. 本地名称属于面向模型的语法糖。
9. 规范符号身份由模式包命名空间 + 精确版本 + 符号名称构成。
10. 存在歧义的本地名称直接报错，严禁盲目猜测。
11. 别名变动不会改写已持久化元素的身份。
12. 模式环境属于受保护的治理状态。
13. Space 记录一份精确解析的 Schema Lock。
14. 运行时模式包依赖在激活后不会发生浮动。
15. 多个历史版本可以并行保持可读共存。
16. 可以选定一个版本作为新写入操作的默认版本。
17. 旧认知数据保持绑定在其旧的精确模式上，直到被显式迁移。
18. 模式包激活独立于模式包发布。
19. 模式包签名不代表本地激活/受信任。
20. 导入的模式包不会自动变为激活状态。
21. 未知模式包应当默认为 validation-only / quarantined / inactive。
22. 模式无法重定义 Core 元素语义。
23. 模式无法赋予治理权限。
24. 切面无法走私治理权限。
25. 模式无法普遍性地赋予认识论信任分值。
26. Concept Type 默认采用名义类型体系。
27. 仅在含义已标准化的领域，谓词语义才进行机器声明。
28. 函数式谓词语义会产生认识论冲突，但不禁止存储冲突数据。
29. 结构基数与认识论基数相互独立。
30. 结构引用不属于语义命题。
31. 切面是经过校验的带命名空间扩展，而非无类型元数据包。
32. Core 校验规则无法被模式包削弱。
33. 规范性约束独立于模型提示词/文档。
34. 模型提示词可以引导智能体，但非硬性校验器，除非单独进行规范声明。
35. 在基准 KIP 中，模式包迁移元数据严禁执行任意代码。
36. 模式迁移保留充分的溯源血统/历史记录，避免静默改写过往认知。
37. 即使数据形态未变，语义含义改变同样要求版本升级。
38. 只要保留的数据依然引用，废弃的历史模式就必须保持可解析。
39. 领域 (Domain) 不是模式包 (Package)。
40. 记忆空间 (MemorySpace) 不是模式包 (Package)。
41. 模式包命名空间身份本身不证明发布者身份。
42. 注册表传输来源不能替代 digest/签名/锁定校验。
43. 模式升级在模式环境边界上具备原子性。
44. 回滚默认版本不会抹除在新模式下已写入的数据。
45. 每个写入事务均针对一致的模式环境快照进行评估。
46. 模式缺失导致显式的未解析状态，而非猜测性解释。
47. 胶囊导出保留规范的精确模式引用。
48. 胶囊导入在语义合并前先校验模式。
49. 策略应当通过规范引用而非展示名称来界定模式敏感的权限。
50. 模式演进必须对大语言模型保持可检查，对引擎保持可验证。

---

# 241. 示例模式包：认知记忆 (Example Package: Cognitive Memory)

示意性简略模式包：

```json
{
  "package_id": "kip://profiles/cognitive-memory",
  "version": "2.0.0",

  "dependencies": [
    {
      "package": "kip://core",
      "version": ">=2.0.0 <3.0.0"
    }
  ],

  "definitions": [
    {
      "kind": "ConceptType",
      "name": "Experience",
      "description": "情境化的目标导向轨迹。",
      "attributes": {
        "goal": {"value_type": "string", "required": true},
        "outcome_status": {
          "value_type": "string",
          "required": true
        }
      }
    },

    {
      "kind": "ConceptType",
      "name": "ExperienceStep",
      "description": "Experience 中单个可观测的步骤。"
    },

    {
      "kind": "StructuralFieldDefinition",
      "name": "has_step",
      "owner_types": ["./Experience"],
      "targets": {
        "concept_types": ["./ExperienceStep"]
      },
      "ordered": true
    },

    {
      "kind": "FacetDefinition",
      "name": "MnemonicState",
      "fields": {
        "memory_strength": {
          "value_type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "salience": {
          "value_type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    }
  ]
}
```

相对引用仅为模式包编写时的简写。

发布的规范资产会将其解析为精确的 Package Symbol 引用。

---

# 242. 示例模式包：组织 (Example Package: Organization)

```json
{
  "package_id": "kip://ldclabs/organization",
  "version": "1.0.0",

  "dependencies": [
    {
      "package": "kip://profiles/cognitive-memory",
      "version": ">=2.0.0 <3.0.0"
    }
  ],

  "definitions": [
    {
      "kind": "ConceptType",
      "name": "Organization"
    },

    {
      "kind": "PredicateType",
      "name": "works_for",
      "subject": {
        "concept_types": [
          "kip://profiles/cognitive-memory@2.0.0/Person"
        ]
      },
      "object": {
        "concept_types": ["./Organization"]
      }
    }
  ]
}
```

在依赖解析期间，精确兼容的 cognitive-memory 版本将被锁定。

发布的规范模式包应当按照模式包规范化标准所定义的确定性格式引用解析后的语义需求。

---

# 243. 示例：函数式状态 (Example: Functional Status)

```json
{
  "kind": "PredicateType",
  "name": "status",
  "subject": {
    "concept_types": ["./Project"]
  },
  "object": {
    "literal_types": ["kip:string"],
    "enum": ["active", "archived", "deleted"]
  },
  "semantics": {
    "functional": true,
    "exclusive_values": true
  }
}
```

底层原始记忆依然可以包含：

```text
(ProjectA, status, "active")
(ProjectA, status, "archived")
```

以及相互冲突的 Assertion。

认识论投影会据此构建一个冲突集（Conflict Set）。

---

# 244. 示例：时区迁移 (Example: Timezone Migration)

版本 1：

```text
Person.timezone 属性
```

版本 2 判定 timezone 需要作为一等公民的认识论对象进行处理。

迁移流程：

```text
旧属性值
    ↓
新 Proposition(Person, timezone, Literal)
    +
迁移后的 Assertion
    +
迁移 Activity
```

模式包描述符：

```text
requires_transform
```

而非静默的字段改写。

---

# 245. 示例：歧义 `Person` 解析 (Example: Ambiguous `Person`)

已安装：

```text
cognitive-memory@2.0.0/Person
hr@1.0.0/Person
```

智能体写入：

```text
CONCEPT {type: "Person", ...}
```

在缺乏别名映射时：

```text
抛出 SchemaSymbolAmbiguous 错误
```

智能体随后使用：

```text
CM.Person
```

或精确的规范引用。

---

# 246. 示例：无须数据迁移的升级 (Example: Upgrade Without Migration)

Space：

```text
读取版本：
  cognitive-memory@2.0.0
  cognitive-memory@2.1.0

写入默认版本：
  @2.1.0
```

旧 Experience 保持为：

```text
schema_ref = @2.0.0/Experience
```

新 Experience 为：

```text
schema_ref = @2.1.0/Experience
```

二者均保持完全可解释。

---

# 247. 示例：恶意导入模式 (Example: Malicious Imported Schema)

胶囊包含：

```text
kip://evil/cognitive-memory@2.0.0/Skill
```

其本地名称同样为 `Skill`。

目标端：

```text
不将其作为别名覆盖标准 Skill
不激活它
若策略允许，仅加载为 validation-only
保留精确的外部引用
```

不会发生任何命名空间混淆。

---

# 248. 示例：策略敏感的升级 (Example: Policy-Sensitive Upgrade)

治理策略：

```text
仅有标准的 cognitive-memory Skill
可以达到 behavioral 权限级别。
```

模式升级：

```text
2.x → 3.0
```

升级分析器检测到策略依赖项。

激活需要经过治理复核。

不会发生自动放权。

---

# 249. 示例：模式镜像攻击 (Example: Schema Mirror Attack)

认知图谱包含镜像的类型 Concept：

```text
Person 定义
```

智能体修改了其描述：

```text
"Person 代表管理员。"
```

结果：

```text
认知镜像被修改/损坏
```

但权威的模式包资产依然保持不变。

运行时自省应当基于模式包重新生成/校验镜像。

---

# 250. 示例：历史查询 (Example: Historical Query)

2026 年的记忆：

```text
schema_ref = Package@2.0.0/Preference
```

2030 年的 Space 默认版本：

```text
Package@4.0.0
```

历史原始查询依然解析至：

```text
@2.0.0
```

而绝不会使用 4.0 语义对 2026 年的记录进行重新解释。

---

# 251. 模式包生命周期 (Schema Package Lifecycle)

完整生命周期：

```text
智能体/人工识别语义需求
                │
                ▼
           模式提议 (Proposal)
                │
                ▼
           草案编写 (Draft)
                │
                ▼
      校验 / 语义 Diff (Validation)
                │
                ▼
      规范化 + 计算摘要 (Digest)
                │
                ▼
        发布版本 (Publish Version)
                │
                ▼
        治理安装 (Installation)
                │
                ▼
    隔离 / 仅用于校验 (Quarantine)
                │
                ▼
    兼容性 + 影响复核 (Review)
                │
                ▼
        原子化激活 (Activation)
                │
                ▼
      新写入环境 (Write Environment)
                │
                ▼
      可选数据迁移 (Optional Migration)
                │
                ▼
      历史版本保留 (Historical Retained)
```

---

# 252. 与事务模型的关系 (Relationship to Transactions)

模式规范为 `KIP-2.0-Transactions.md` 提出了如下要求：

```text
模式环境原子化激活
每事务独立的模式快照
凭单中包含精确环境版本
迁移事务支持
并发升级冲突处理
幂等安装/激活机制
```

---

# 253. 与认知胶囊的关系 (Relationship to Capsule)

模式规范为 `KIP-2.0-Capsule.md` 提出了如下要求：

```text
精确 package/version/digest 依赖
可选内嵌模式包
规范模式包哈希计算
安全的 validation-only 导入
禁止自动激活
模式锁定可移植性
```

---

# 254. 与 KQL 的关系 (Relationship to KQL)

模式规范为 `KIP-2.0-KQL.md` 提出了如下要求：

```text
本地名称解析
精确符号自省
模式版本过滤
原始 vs 归一化类型视图
歧义符号错误处理
固定模式环境支持
```

---

# 255. 与 KML 的关系 (Relationship to KML)

模式规范为 `KIP-2.0-KML.md` 提出了如下要求：

```text
先定义后使用原则
将本地类型名称脱糖展开为精确引用
事务性模式校验
禁止普通模式修改
具备模式版本感知的创建操作
迁移安全的写入机制
```

---

# 256. 与 META 的关系 (Relationship to META)

META 应当负责面向模型的模式自省操作：

```text
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE SCHEMA ENVIRONMENT
DESCRIBE COMPATIBILITY
```

以及潜在的模式管理发现机制。

实际的治理变更依然处于受保护状态。

---

# 257. 与认知记忆 Profile 的关系 (Relationship to Cognitive Memory Profile)

Profile 演进为一等公民的标准 Schema Package。

其未来设计应当明确分离：

```text
规范性模式定义
规范性记忆语义
建议性大脑算法
```

这允许不同的大脑实现基于同一套记忆契约实现互操作。

---

# 258. 与 Anda 大脑的关系 (Relationship to Anda Brain)

Anda 大脑可以：

```text
发现模式
选择类型/谓词
提议模式演进
遵循模型提示词指引
迁移 Profile 记忆
评估升级效果基准
```

但它绝不会仅仅因为对模式进行了推理就自动获得 `manage_schema` 特权。

---

# 259. 架构总结 (Architecture Summary)

KIP 1.x：

```text
图谱 (Graph)
  ├ 数据
  └ 作为可变图谱节点的模式
```

KIP 2.0：

```text
               治理控制平面 (Governance Control Plane)
                          │
                          ▼
                 模式环境 (Schema Environment)
                          │
             精确锁定的模式包版本 (exact locked versions)
                          │
                          ▼
                模式包资产 (Package Artifacts)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Concept Types     Predicate Types      Facets
        │                 │                 │
        ├──── 结构字段 (Structural Fields) ─┤
        │                 │                 │
        └──── 约束 / 语义 (Constraints) ────┘
                          │
                          ▼
                  认知状态 (Cognitive State)
                          │
        每个持久化的语义引用均绑定至精确版本
```

大脑看到的是紧凑的自描述视图。

引擎强制执行不可变的精确契约。

---

# 260. 核心等式 (Core Equations)

```text
展示名称
    ≠
规范模式身份
```

```text
模式包名称
    ≠
发布者信任
```

```text
模式包数字签名
    ≠
本地激活
```

```text
模式包
    ≠
治理策略
```

```text
模式包
    ≠
大脑算法
```

```text
模式兼容性
    ≠
数据形态等价
```

```text
语义版本范围
    → 解析器输入
    → 精确锁定版本
```

```text
持久化认知含义
    =
    精确模式符号引用
    +
    不可变模式包资产
```

以及：

```text
具备自描述性 (Self-Describing)
    不要求
具备自我修改性 (Self-Modifying)。
```

---

# 261. 终极原则 (Final Principle)

一个真实的记忆大脑无法安全地记住：

> **"这是一个 Person。"**

除非它同样能够回答：

> 哪一个 `Person` 定义？

> 来自哪一个语义命名空间？

> 遵循哪一个版本？

> 哪些属性与结构字段是合法的？

> 哪些谓词可以连接它？

> 哪些约束属于结构性约束？

> 哪些约束仅用于标识认识论冲突？

> 在该记忆形成时，该模式是否处于激活状态？

> 自那时起模式是否发生过改变？

> 我是否依然能够依据其原始语义来解释历史记忆？

> 该模式包是本地批准的还是仅仅导入的？

> 该模式包是否来自受信的发布者？

> 数字签名是否仅验证了完整性而非语义正确性？

> 激活新版本是否会改变冲突检测、治理作用域或大脑行为？

> 智能体能否在不静默改写自身过往含义的前提下提议模式演进？

KIP 2.0 通过将模式确立为不可变的、版本化的、受治理的语义资产，给出了这些问题的确定性答案。

统领性的理念是：

> **一个记忆大脑必须能够演进其词汇体系，而绝不能追溯性地改变其过往记忆的含义。**

这就是 KIP 2.0 模式包体系的核心使命。
