# KIP 2.0 META — 认知中枢自省与接地 (Introspection & Grounding)

**[English](./KIP-2.0-META.md) | [中文](./KIP-2.0-META_CN.md)**

## 规范状态 (Status)

**META 协议提案 / 预规范草案 (META Protocol Proposal / Pre-Specification Draft)**

本文档定义了 KIP 2.0 的自省、接地、验证 (Verification)、校验 (Validation)、能力协商、运行时历史及可移植工件检查层。

它直接构建于以下规范之上：

- [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)
- [KIP-2.0-Transactions.md](KIP-2.0-Transactions.md)
- [KIP-2.0-Capsule.md](KIP-2.0-Capsule.md)
- [KIP-2.0-KQL.md](KIP-2.0-KQL.md)
- [KIP-2.0-KML.md](KIP-2.0-KML.md)

KIP 1.x 将 META 定义为以只读知识探索为中心的层：

```text
DESCRIBE
SEARCH
EXPORT
```

这种职责分离是原协议中最具优势的部分之一。

它认识到智能体（Agent）绝不应盲目生成图查询或状态变更。

在采取行动之前，智能体通常需要了解：

```text
这是什么协议？
此中枢能做什么？
哪个 Schema 处于活动状态？
这里的 "Person" 是什么含义？
用户所指的是哪个 "Alice"？
当前的 Space 是什么？
具体是哪笔事务提交了我上一次的写入？
此搜索索引的新鲜度如何？
此 Capsule 能否被验证？
此 Capsule 能否安全合并至此？
我能否检查历史记录？
我被授权发现哪些内容？
```

KIP 2.0 保留了只读 META 边界，但大幅扩展了其职责范围。

认知中枢（Cognitive Nexus）现在不仅是：

```text
概念与命题的有向图
```

而且是一个受治理的认知状态，包含：

```text
概念 (Concepts)
命题 (Propositions)
断言 (Assertions)
证据 (Evidence)
活动 (Activities)
Profile 配置文件
Schema 环境 (Schema Environments)
认识论策略 (Epistemic Policies)
事务历史 (Transaction History)
认知胶囊 (Cognitive Capsules)
```

因此，META 2.0 成为中枢解释**其如何被使用**的协议层。

其核心论点是：

> **在智能体能够对大脑进行推理之前，大脑必须能够描述自身的语义坐标、操作能力、时态状态与安全边界。**

META 在实现这一目标的同时，不会将自省权限转变为变更授权。

---

# 0. 规范性用词定义 (Normative Language)

关键字 **必须 (MUST)**、**严禁 (MUST NOT)**、**必需 (REQUIRED)**、**应当 (SHOULD)**、**不得 (SHOULD NOT)**、**可以 (MAY)** 和 **可选 (OPTIONAL)** 用于表示 KIP 2.0 规范 (`../KIP-2.0-SPECIFICATION.md`) 的要求；两者不一致时以该规范为准。

此处展示的命令语法为架构级提案。

具体的传输协议与工件句柄语法可能会有所调整。

语义边界是主要的规范性目标。

---

# 1. META 2.0 核心目标 (META 2.0 Purpose)

META 的存在有六大核心目标：

```text
1. 认知引导 (Priming)
2. Schema 自省 (Schema Introspection)
3. 接地 / 联想式检索 (Grounding / Associative Retrieval)
4. 运行时能力协商 (Runtime Capability Negotiation)
5. 历史 / 回执检查 (History / Receipt Inspection)
6. 工件验证 / 校验 / 预览 (Artifact Verification / Validation / Preview)
```

---

# 2. META 具备只读性 (META Is Read-Only)

META 操作严禁 (MUST NOT) 直接变更：

```text
认知元素 (Cognitive Elements)
认识状态 (Epistemic State)
治理状态 (Governance State)
Schema 环境 (Schema Environment)
信任策略 (Trust Policy)
记忆强度 (Memory Strength)
留存状态 (Retention State)
事务历史 (Transaction History)
```

作为检查操作的语义副作用。

---

# 3. 只读并不意味着不受限制 (Read-Only Does Not Mean Unrestricted)

META 虽然是只读的，但仍然受到治理约束。

根据策略，调用方可能会被拒绝：

```text
发现某个 Space
列出某个 Schema 包
查看历史事务
查看原始源头出处
搜索机密证据
检查私有 Capsule
获知某个元素的存在
```

具体取决于治理策略。

---

# 4. 自省本身即信息通道 (Introspection Is an Information Channel)

这是一条核心安全原则。

诸如下列命令：

```text
DESCRIBE
SEARCH
类 COUNT 聚合摘要
CAPABILITIES
HISTORY
```

即使不写入任何内容，也可能泄露敏感信息。

因此：

> **只读自省必须 (MUST) 遵循与 KQL 相同的防信息泄露原则。**

---

# 5. META 不授予权限能力 (META Does Not Grant Capability)

返回如下内容的响应：

```text
atomic_transactions = supported
```

并不意味着：

```text
调用方可以执行任意事务。
```

同样：

```text
manage_schema supported
```

并不意味着：

```text
调用方拥有 manage_schema 权限。
```

---

# 6. 支持与已授权的区别 (Supported vs. Authorized)

META 2.0 明确区分：

```text
运行时支持 (Runtime Support)
    此实现/协议端点在技术上能够做什么。

有效可用性 (Effective Availability)
    当前经过身份验证的调用主体 (Principal)
    在此执行上下文中当前可以使用什么。
```

这种区分是能力协商的基础。

---

# 7. META 操作族 (META Operation Families)

推荐的原生操作族：

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

`EXPORT CAPSULE` 属于读取/导出操作，而非变更操作。

`IMPORT CAPSULE` 不属于 META，因为其会改变目标端状态。

---

# 8. `LIST` 存在的原因 (Why `LIST` Exists)

KIP 1.x 通过复数形式的 `DESCRIBE` 命令表达许多集合操作。

KIP 2.0 可以 (MAY) 保留这些别名，但清晰的原生划分是：

```text
DESCRIBE
    单个事物 / 紧凑上下文

LIST
    集合
```

示例：

```text
DESCRIBE TYPE "Person"
LIST TYPES
```

---

# 9. 兼容类别名 (Compatibility Aliases)

为符合模型习惯，显式启用的兼容性配置档 (§306) 应当 (SHOULD) 接受诸如以下的等价命令：

```text
DESCRIBE TYPES
    ≈ LIST TYPES

DESCRIBE PREDICATES
    ≈ LIST PREDICATES

DESCRIBE PACKAGES
    ≈ LIST SCHEMA PACKAGES
```

响应语义应当保持一致。

这些复数形式的 `DESCRIBE` 拼写并不属于原生 KIP 2.0 META 文法：原生端点会将其作为无效语法拒绝，而不会静默地当作别名接受。

---

# 10. META 与 KQL 的关系 (META vs. KQL)

META 回答：

```text
我该如何使用此大脑？
我该如何找到坐标？
此 Schema 是什么含义？
运行时执行了什么？
此工件能否被安全解析？
```

KQL 回答：

```text
哪些认知记录满足此结构化查询？
大脑相信什么？
```

---

# 11. META 与 KML 的关系 (META vs. KML)

META 可以：

```text
校验 (validate)
预览 (preview)
描述 (describe)
```

某个变更操作。

KML 负责实际提议该变更。

---

# 12. META 与治理的关系 (META vs. Governance)

META 在获得授权的情况下可以描述有效权限。

它无法：

```text
授予 (grant)
委托 (delegate)
撤销 (revoke)
提权 (elevate)
解密/降密 (declassify)
修改策略 (change policy)
```

---

# 13. META 与 Schema 管理的关系 (META vs. Schema Management)

META 可以：

```text
描述 Package
验证 Package 摘要/签名
校验兼容性
展示活动 Schema 环境
```

它无法：

```text
安装 (install)
激活 (activate)
设为默认 (set default)
封禁 (block)
升级 (upgrade)
```

某个 Schema 包。

---

# 14. META 与事务运行时的关系 (META vs. Transaction Runtime)

META 可以检查：

```text
快照 (snapshot)
事务回执 (transaction receipt)
提交历史 (commit history)
变更流 (change stream)
```

它本身不定义事务原子性。

---

# 15. META 与 Capsule 导入的关系 (META vs. Capsule Import)

META 可以：

```text
DESCRIBE CAPSULE
VERIFY CAPSULE
VALIDATE CAPSULE
PREVIEW IMPORT CAPSULE
EXPORT CAPSULE
```

它无法执行：

```text
IMPORT CAPSULE
```

因为导入操作会改变认知状态。

---

# 16. META 契约 (The META Contract)

META 结果在相关时应当 (SHOULD) 标识足够的上下文，使智能体能够了解：

```text
检查了什么内容
在哪个 Space 下
处于何种认知状态
使用何种 Schema 上下文
具备何种可见性
具备何种实现能力
```

---

# 17. META 响应上下文 (META Response Context)

推荐的通用响应信封：

```json
{
  "op_id": "op-1",
  "status": "succeeded",
  "result": {},
  "context": {
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "schema_environment_version": 17
  },
  "warnings": [],
  "next_cursor": "opaque-cursor"
}
```

并非每个操作都需要包含所有字段。

主体/行动者 (Principal/actor) 坐标不承载于此信封中；它们由 `DESCRIBE EXECUTION CONTEXT` (§42) 在治理约束下返回。

---

# 18. 上下文由引擎维护 (Context Is Engine-Maintained)

诸如以下的字段：

```text
snapshot_seq
schema_environment_version
runtime_version
index_seq
transaction status
```

均为运行时输出。

调用方不得自行编写或指定这些字段。

---

# 19. `DESCRIBE PRIMER`

KIP 1.x 引入认知引导词 (Cognitive Primer) 作为告知 LLM 的手段：

```text
我是谁？
我知道什么？
```

KIP 2.0 保留了这一思想，但细化了身份边界。

推荐语法：

```text
DESCRIBE PRIMER
```

可选形式：

```text
DESCRIBE PRIMER MODE "compact"
DESCRIBE PRIMER MODE "full"
```

---

# 20. Primer 是引导自举工件 (Primer Is a Bootstrapping Artifact)

Primer 旨在回答：

> 在模型生成 KQL/KML/META 之前，其应当了解的最小上下文是什么？

它应当足够精简以便自动注入。

---

# 21. Primer 严禁成为全量记忆转储 (Primer Must Not Be a Memory Dump)

Primer 是：

```text
语义坐标
能力摘要
安全身份摘要
领域/主题图谱
协议提醒
```

而非：

```text
所有重要记忆。
```

---

# 22. Primer 分层结构 (Primer Layers)

推荐的 KIP 2.0 Primer 分层：

```text
1. 协议层 (Protocol Layer)
2. 执行上下文层 (Execution Context Layer)
3. 认知身份层 (Cognitive Identity Layer)
4. Schema 图谱层 (Schema Map Layer)
5. 领域 / 主题图谱层 (Domain / Topic Map Layer)
6. 能力与限制层 (Capability & Limit Layer)
7. 认知安全不变式层 (Cognitive Safety Invariants)
```

---

# 23. 协议层 (Protocol Layer)

包含：

```text
KIP 版本
KQL 版本
KML 版本
META 版本
核心模型版本
已启用的兼容性 Profile
```

示例：

```json
{
  "kip": "2.0",
  "kql": "2.0",
  "kml": "2.0",
  "meta": "2.0",
  "compatibility_profile": null
}
```

---

# 24. 执行上下文层 (Execution Context Layer)

在受治理约束的前提下，包含诸如下列安全信息：

```text
当前 MemorySpace 标识/URI
当前 snapshot_seq
Schema 环境版本
经过身份验证的 Principal 类别/摘要
当前有效行动者绑定的摘要
```

---

# 25. 调用主体不等于 `$self` (Principal Is Not `$self`)

Primer 必须明确防止将：

```text
经身份验证的主体 (authenticated Principal)
=
语义自我身份 (semantic self identity)
```

等同起来，除非经过验证的 ActorBinding 明确如此声明。

---

# 26. 认知身份层 (Cognitive Identity Layer)

可以通过经治理批准的投影总结：

```text
大脑的本地 $self
角色
目标
稳定的自我描述
高层 Profile 身份
```

---

# 27. 认知身份属于认知状态 (Cognitive Identity Is Cognitive State)

Primer 中的自我摘要不等同于：

```text
治理主体 (Governance Principal)
所有者凭证
管理员权限
```

它是面向模型的认知身份投影。

---

# 28. 自我摘要可以通过认识论进行投影 (Self Summary May Be Epistemically Projected)

部署可以 (MAY) 从以下来源派生 Primer 身份：

```text
已接受的 SelfModel
稳定的角色配置
Profile 定义的身份投影
```

而非直接复制任意当前的 Concept 属性。

---

# 29. Primer 必须标记动态身份 (Primer Must Mark Dynamic Identity)

如果自我描述派生自认知状态，Primer 在有益时应当 (SHOULD) 标识：

```text
snapshot_seq
投影策略/版本
```

---

# 30. Schema 图谱层 (Schema Map Layer)

包含紧凑的图谱映射：

```text
活动包
常见 Concept 类型
常见 Predicate 谓词
重要 Facet 切面
重要结构字段 (Structural Fields)
别名
```

而非每个完整的 Schema 定义。

---

# 31. 领域 / 主题图谱层 (Domain / Topic Map Layer)

包含紧凑的语义导航提示，例如：

```text
顶级领域/主题
重要实体
高频使用的关系族
Profile 记忆分类
```

---

# 32. 领域图谱不具备 Schema 权威性 (Domain Map Is Not Schema Authority)

语义领域/主题图谱可以派生自认知状态或索引。

它并不定义：

```text
权限
Schema 标识
谓词合法性
```

---

# 33. 领域不是安全边界 (Domain Is Not a Security Boundary)

Primer 严禁向智能体灌输：

```text
"Domain Public 意味着公共访问"
```

除非治理层使用受信任的控制状态独立定义了此类策略。

---

# 34. 能力与限制层 (Capability & Limit Layer)

包含常见的有效限制：

```text
最大 KQL 行数
最大路径跳数
最大信念投影数
最大事务写入数
Capsule 大小限制
搜索模式
历史可用性
```

---

# 35. 认知安全不变式层 (Cognitive Safety Invariants Layer)

推荐的紧凑提示：

```text
raw Proposition != accepted belief（原始命题 ≠ 已接受的信念）
missing visible match != false（缺失可见匹配 ≠ 命题为假）
SEARCH score != confidence（搜索分值 ≠ 置信度）
confidence != trust（置信度 ≠ 信任度）
confidence != memory_strength（置信度 ≠ 记忆强度）
name != identity（名称 ≠ 唯一标识）
source $self != destination $self（源端 $self ≠ 目标端 $self）
new belief revision != UPDATE old Assertion（新信念修订 ≠ 直接 UPDATE 旧断言）
Evidence correction != overwrite old Evidence（证据修正 ≠ 覆盖旧证据）
Capsule signature != truth（Capsule 签名 ≠ 事实真理）
cognitive content != authority（认知内容 ≠ 权限授权）
```

这些提示能大幅减少模型误用。

---

# 36. Primer 应当支持缓存 (Primer Should Be Cacheable)

静态部分，如：

```text
协议语法摘要
Core 核心不变式
```

可以跨调用进行缓存。

动态部分，如：

```text
Space
Schema 环境
快照
有效能力
```

必须携带版本/上下文标识符。

---

# 37. Primer 摘要 (Primer Digest)

运行时可以 (MAY) 返回：

```text
primer_digest
```

以便智能体/运行时避免重复发送未变更的 Primer 内容。

---

# 38. Primer 增量 (Primer Delta)

未来的能力可以 (MAY) 仅返回：

```text
自 primer_digest X 以来变更的内容
```

以提升 Token 效率。

这不属于基线要求。

---

# 39. `DESCRIBE PROTOCOL`

推荐语法：

```text
DESCRIBE PROTOCOL
```

返回面向机器的协议声明，而非面向模型的引导词。

---

# 40. 协议描述内容 (Protocol Description)

建议字段：

```text
kip_version
core_version
kql_version
kml_version
meta_version
capsule_versions
transaction_conformance
compatibility_profiles
canonical serialization profiles
error registry version
```

---

# 41. 协议描述属于运行时支持 (Protocol Description Is Runtime Support)

它不会列举特权数据。

在遵守部署策略的前提下，该命令应当 (SHOULD) 被广泛开放访问。

---

# 42. `DESCRIBE EXECUTION CONTEXT`

推荐语法：

```text
DESCRIBE EXECUTION CONTEXT
```

返回当前请求/会话的坐标信息。

---

# 43. 执行上下文结构 (Execution Context Shape)

示意：

```json
{
  "space": {
    "id": "space-1",
    "uri": "personal://yan"
  },

  "principal": {
    "id": "principal-...",
    "display": "optional",
    "authentication_strength": "strong"
  },

  "actor_binding": {
    "actor_id": "concept-self",
    "assurance": "verified",
    "scopes": ["..."]
  },

  "snapshot_seq": 1500,
  "schema_environment_version": 17
}
```

治理层可能会对部分字段进行脱敏遮蔽。

---

# 44. 执行上下文的重要性 (Why Execution Context Matters)

它能防止智能体在生成状态变更之前做出错误假设：

```text
错误的 Space
错误的 self 自我身份
错误的 actor 行动者
错误的 schema
错误的授权上下文
```

---

# 45. `LIST SPACES`

可选的受治理操作：

```text
LIST SPACES
```

仅返回当前 Principal 有权发现的 Space。

---

# 46. 严禁 Space 枚举泄露 (No Space Enumeration Leak)

被隐藏的 Space 严禁出现在：

```text
计数 (counts)
分页总量 (pagination totals)
错误提示 (error hints)
时序差异 (timing distinctions)
```

除非在允许的泄露策略范围内。

---

# 47. `DESCRIBE SPACE`

推荐语法：

```text
DESCRIBE SPACE
DESCRIBE SPACE :space_id
```

---

# 48. Space 描述内容 (Space Description)

可以包含：

```text
id
uri
name
status
current space_seq
Schema Environment identity
retention/historical boundaries
safe capability summary
classification default summary
```

具体受治理层约束。

---

# 49. Space 描述不是治理转储 (Space Description Is Not Governance Dump)

它不应当自动暴露：

```text
所有成员
所有 Grant 授权
所有机密策略
所有受信任的主体
```

查看这些内容需要专门的治理审计权限。

---

# 50. Schema 自省是 META 的头等职责 (Schema Introspection Is a First-Class META Responsibility)

KIP 2.0 的权威 Schema 存在于不可变的 Schema 包中。

META 将其投影为模型友好的自省视图。

推荐操作：

```text
DESCRIBE SCHEMA ENVIRONMENT
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE STRUCTURAL FIELD
DESCRIBE COMPATIBILITY

LIST SCHEMA PACKAGES
LIST TYPES
LIST PREDICATES
LIST FACETS
LIST STRUCTURAL FIELDS
```

---

# 51. `DESCRIBE SCHEMA ENVIRONMENT`

推荐语法：

```text
DESCRIBE SCHEMA ENVIRONMENT
```

可选的时态形式：

```text
DESCRIBE SCHEMA ENVIRONMENT AS OF SEQ :seq
```

---

# 52. Schema 环境响应 (Schema Environment Response)

推荐字段：

```text
environment_version
resolved_at_seq
active package exact refs
package digests
default versions
local aliases
blocked package state visible to caller
compatibility profile
lock digest
```

---

# 53. Schema 环境即语义上下文 (Schema Environment Is Semantic Context)

它回答了：

> 在此 Space 中，具体是哪个语义宇宙赋予了本地 KIP 符号确切含义？

---

# 54. Schema 环境不仅是已安装包的清单 (Schema Environment Is Not Installed-Package Inventory Alone)

中枢可能知晓许多 Package，但在单个 Space 中仅激活其中的一个子集。

因此：

```text
available package（可用包）
    ≠
active package（活动包）
```

---

# 55. 历史 Schema 环境 (Historical Schema Environment)

对于：

```text
AS OF SEQ 500
```

审计人员可能需要知晓：

```text
在 seq 500 时激活的是哪些包版本。
```

当历史数据得到留存且调用方获得授权时，META 应当公开该信息。

---

# 56. `LIST SCHEMA PACKAGES`

推荐语法：

```text
LIST SCHEMA PACKAGES
  [STATUS "active|available|blocked"]
  [LIMIT N]
  [CURSOR "..."]
```

具体过滤参数属于预规范内容。

---

# 57. 包列表返回确切标识 (Package Listing Returns Exact Identity)

至少包含：

```text
package_id
version
digest
status in current Space
publisher identity summary where visible
```

---

# 58. `DESCRIBE PACKAGE`

推荐语法：

```text
DESCRIBE PACKAGE "kip://profiles/cognitive-memory@2.0.0"
```

---

# 59. 包描述内容 (Package Description)

可以包含：

```text
manifest 清单
确切的包标识
version 版本
digest 摘要
dependencies 依赖项
definitions 模式定义摘要
aliases 别名
compatibility declarations 兼容性声明
migration descriptors 迁移描述符
signature/proof 签名/证明摘要
documentation/model hints 文档与模型提示
```

---

# 60. 包签名不等于包信任 (Package Signature Is Not Package Trust)

META 必须将以下概念严格区分开：

```text
密码学签名有效性
发布者身份
本地信任/放行状态
激活状态
```

---

# 61. `LIST TYPES`

返回可见/活动的 Concept 类型符号。

推荐结果行：

```json
{
  "schema_ref": "kip://.../Person",
  "local_name": "Person",
  "package": "kip://...@2.0.0",
  "description": "...",
  "aliases": []
}
```

---

# 62. `DESCRIBE TYPE`

推荐语法：

```text
DESCRIBE TYPE "Person"
```

或使用确切引用：

```text
DESCRIBE TYPE "kip://...@2.0.0/Person"
```

---

# 63. 必须返回别名解析结果 (Alias Resolution Must Be Returned)

即使使用本地名称发起请求：

```text
Person
```

响应也必须 (MUST) 标识所解析出的确切：

```text
schema_ref
package/version/digest
```

---

# 64. 类型描述内容 (Type Description)

推荐内容：

```text
schema_ref
local_name
description
abstract/concrete
stable identity fields
attribute schema
allowed Facets
Structural Fields
model hints
mutability hints
compatibility/migration notes
```

---

# 65. 类型描述属于权威 Schema 投影 (Type Description Is Authoritative Schema Projection)

与名为：

```text
"Person"
```

的普通认知 Concept 不同，此响应来自于活动的 Schema 包。

---

# 66. `LIST PREDICATES`

返回活动的 Predicate（谓词）定义。

推荐的紧凑字段：

```text
predicate_ref
local_name
subject constraints
object constraints
cardinality
functional/exclusive hints
```

---

# 67. `DESCRIBE PREDICATE`

推荐语法：

```text
DESCRIBE PREDICATE "timezone"
```

或使用确切引用。

---

# 68. 谓词描述内容 (Predicate Description)

推荐内容：

```text
predicate_ref
package/version/digest
description
subject kinds/types
object kinds/types
literal datatypes
cardinality
functional semantics
exclusive/conflict-set semantics
temporal semantics
inverse/symmetry/transitivity declarations if standardized
model hints
```

---

# 69. 谓词描述不声明当前真理 (Predicate Description Does Not Declare Current Truth)

它解释的是：

> 此 Predicate 是什么含义，以及它该如何被使用？

它并不回答：

> 使用该谓词的哪些 Proposition 是被接受的？

应使用 KQL/BELIEF 来回答此类问题。

---

# 70. `LIST FACETS`

返回活动的 Profile/Core Facet（切面）定义。

---

# 71. `DESCRIBE FACET`

推荐语法：

```text
DESCRIBE FACET "MnemonicState"
```

---

# 72. 切面描述内容 (Facet Description)

应当暴露：

```text
exact facet ref
applicable Core kinds/types
fields
datatypes
defaults
mutability
maintenance-only fields
derived-only fields
authority sensitivity
model hints
```

---

# 73. 切面可变性对智能体的重要性 (Why Facet Mutability Matters to Agents)

在生成如下操作之前：

```prolog
UPDATE ?x
SET FACET "MnemonicState" {...}
```

智能体需要知晓哪些字段是允许变更的。

META 提供了该契约规范。

---

# 74. `LIST STRUCTURAL FIELDS`

返回 Schema 定义的记录拓扑结构字段。

示例：

```text
has_step
experienced_by
evidence
inputs
outputs
compiled_from
```

---

# 75. `DESCRIBE STRUCTURAL FIELD`

推荐语法：

```text
DESCRIBE STRUCTURAL FIELD "has_step"
```

---

# 76. 结构字段描述内容 (Structural Field Description)

应当暴露：

```text
exact field ref
source kinds/types
target kinds/types
cardinality
ordered/set semantics
edge metadata schema
required/optional
mutability
allowed cycle behavior
model hints
```

---

# 77. 结构字段不是谓词 (Structural Field Is Not Predicate)

META 必须明确此项区别。

```text
has_step structural field（结构字段）
    ≠
semantic Proposition predicate（语义命题谓词）
```

除非 Schema 对两者进行了分别定义。

---

# 78. `DESCRIBE COMPATIBILITY`

推荐语法：

```text
DESCRIBE COMPATIBILITY
  FROM "package@2.0.0"
  TO "package@3.0.0"
```

---

# 79. 兼容性结果 (Compatibility Result)

可以包含：

```text
declared compatibility class 声明的兼容类别
breaking changes 破坏性变更
renames/aliases 重命名与别名
migration descriptors 迁移描述符
type/predicate mappings 类型/谓词映射
data-review requirements 数据审查要求
```

---

# 80. 兼容性声明不等于迁移证明 (Compatibility Declaration Is Not Migration Proof)

某个 Package 声明：

```text
compatible
```

并不证明每个应用程序的迁移都是安全的。

META 分别报告声明状态与校验状态。

---

# 81. `DESCRIBE ERROR`

推荐语法：

```text
DESCRIBE ERROR "ImmutableField"
```

操作数是稳定的注册表错误代码 (规范 §87)；KIP 2.0 不定义数字型错误代码。

---

# 82. 错误描述内容 (Error Description)

返回：

```text
category 类别
meaning 含义
typical cause 典型原因
retryability 可重试性
recommended recovery 推荐恢复方案
related command 相关命令
```

这为智能体的自我修正提供了支持。

---

# 83. 错误提示属于建议性质 (Error Hints Are Advisory)

错误提示不能越权授权受保护的变通方案。

示例：

```text
"Use Governance operation"（使用治理操作）
```

并不意味着调用方具备该权限。

---

# 84. SEARCH 是联想式接地原语 (SEARCH Is the Associative Grounding Primitive)

KIP 2.0 保留 SEARCH 作为一等 META 操作。

SEARCH 回答：

> 哪些可见的已存储认知项与当前词法/语义探测最为相关？

它并不回答：

> 哪些主张是真实的？

---

# 85. SEARCH 与 KQL 的对比 (SEARCH vs. KQL)

```text
SEARCH
    模糊 / 基于索引 / 联想式

KQL FIND
    精确的结构化规范查询

BELIEF
    认识论解释
```

---

# 86. 推荐的 SEARCH 语法 (Recommended SEARCH Syntax)

基线：

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

`WITH PREDICATE` 用于限定命题检索（§110）；`AS OF SEQ` 是可选的历史检索能力（§126），不属于基线。

---

# 87. 可搜索的元素类别 (Searchable Kinds)

推荐类别：

```text
CONCEPT
PROPOSITION
ASSERTION
EVIDENCE
ACTIVITY
COGNITION
```

其中：

```text
COGNITION
```

用于跨多种允许的认知类别执行联合搜索。

---

# 88. 扩展超出 Concept/Proposition 范围的原因 (Why Expand Beyond Concept/Proposition)

真实的智能体回忆可能始于：

```text
"上周一次失败的部署"
"Alice 纠正我的那条消息"
"那次监控结果"
"关于回滚的技能"
```

这些内容可能最适合接地至：

```text
Experience 经验 Concept
Evidence 证据
Assertion 断言
Activity 活动
```

而不仅仅是语义 Concept。

---

# 89. 默认搜索范围 (Default Search Surface)

实现可以 (MAY) 将：

```text
SEARCH COGNITION
```

默认设置为精选的可搜索集合。

它必须 (MUST) 声明对哪些元素类别建立了索引。

---

# 90. 搜索不必然对所有内容建立索引 (Search Does Not Index Everything Necessarily)

出于安全与性能考虑，部署可能会将以下内容排除在可搜索文本/向量索引之外：

```text
原始 Evidence 有效载荷
机密 Facet
引擎出处源头
大型 Blob 二进制数据
```

---

# 91. 搜索模式 (SEARCH Modes)

必需/可选模式：

```text
keyword 关键词
semantic 语义
hybrid 混合
```

---

# 92. `keyword` 模式

在已授权的接地字段上执行词法索引搜索。

这应当 (SHOULD) 是最低限度的可移植模式。

---

# 93. `semantic` 模式

基于语义/向量的检索。

属于可选能力。

---

# 94. `hybrid` 模式

结合词法与语义信号。

属于可选能力。

KIP 不强制规定唯一的混合排序公式。

---

# 95. 搜索分值 (Search Score)

SEARCH 返回一个瞬态的检索分值。

推荐响应字段：

```json
{
  "retrieval": {
    "score": 0.82,
    "score_semantics": "normalized_hybrid_relevance"
  }
}
```

---

# 96. 搜索分值不是存储的元数据 (Search Score Is Not Stored Metadata)

KIP 2.0 不应当 (SHOULD NOT) 将搜索分值暴露为：

```text
element.metadata._score
```

因为通用的 metadata 杂物袋已不复存在。

它属于查询结果信封的一部分。

---

# 97. 搜索分值不等于置信度 (Search Score Is Not Confidence)

```text
retrieval.score（检索分值）
    ≠
Assertion.confidence（断言置信度）
```

---

# 98. 搜索分值不等于信念 (Search Score Is Not Belief)

```text
high semantic similarity（高语义相似度）
    ≠
accepted belief（已接受的信念）
```

---

# 99. 搜索分值不等于信任度 (Search Score Is Not Trust)

高度相关的文档可能是完全不受信任的。

---

# 100. 搜索分值不等于记忆强度 (Search Score Is Not Memory Strength)

极少被回忆的记忆在语义上仍可能高度相关。

---

# 101. 必须指明分值语义 (Score Semantics Must Be Named)

如果运行时对分值进行了归一化，响应中应当 (SHOULD) 至少在粗粒度级别指明：

```text
score_semantics 分值语义
ranking_method/version 排序方法/版本
```

---

# 102. 严禁跨引擎通用分值校准假设 (No Universal Cross-Engine Score Calibration)

来自某一个嵌入/混合引擎的：

```text
0.8
```

不能保证等同于来自另一个引擎的：

```text
0.8
```

除非一致性 Profile 明确规定了校准标准，否则阈值的可移植性是有限的。

---

# 103. 搜索结果结构 (Search Result Shape)

推荐的紧凑结果格式：

```json
{
  "id": "concept-123",
  "kind": "concept",
  "schema_ref": "kip://.../Person",
  "name": "Alice Chen",
  "snippet": "...",

  "retrieval": {
    "score": 0.88,
    "mode": "hybrid",
    "matched_fields": ["name", "aliases"]
  }
}
```

---

# 104. 命题搜索结果 (Proposition Search Result)

应当包含：

```text
id
predicate_ref
紧凑的主体标签
紧凑的客体标签/字面量
检索分值
```

且不暗示其属于已被接受的信念。

---

# 105. 断言搜索结果 (Assertion Search Result)

在治理允许的前提下，可以包含安全的：

```text
stance 立场
mode 模式
asserted_by 标签
asserted_at 断言时间
Proposition 命题摘要
```

---

# 106. 证据搜索结果 (Evidence Search Result)

可以返回：

```text
Evidence ID
class 证据类别
安全摘要片段
observed_at 观察时间
digest 摘要
```

但不得返回隐藏的原始有效载荷。

---

# 107. 活动搜索结果 (Activity Search Result)

在可见性允许的前提下，可以返回：

```text
Activity ID
class 活动类别
status 状态
time 时间
安全的输入/输出摘要
```

---

# 108. 按类型限定搜索 (Type-Scoped Search)

示例：

```text
SEARCH CONCEPT "Alice"
WITH TYPE "Person"
LIMIT 10
```

类型别名通过当前的 Schema 环境进行解析。

---

# 109. 精确搜索类型引用 (Exact Search Type Ref)

针对确定性客户端：

```text
WITH TYPE "kip://...@2.0.0/Person"
```

---

# 110. 按谓词限定命题搜索 (Predicate-Scoped Proposition Search)

对于 `SEARCH PROPOSITION`，`WITH TYPE` 可以 (MAY) 保留以兼容 v1，但原生语法应当 (SHOULD) 优先使用：

```text
WITH PREDICATE :predicate_ref
```

以避免对 "type" 产生概念重载。

---

# 111. 搜索过滤条件应当保持精简 (Search Filters Should Stay Small)

SEARCH 不应演化为第二套 KQL。

有价值的缩减维度可包括：

```text
kind 元素类别
type/schema_ref 类型/引用
predicate_ref 谓词引用
time window 时间窗口
profile class 配置文件类别
```

复杂的逻辑过滤应在接地完成后交由 KQL 处理。

---

# 112. SEARCH 在排序前先执行治理过滤 (SEARCH Is Governance-Filtered Before Ranking)

未授权的候选项目严禁 (MUST NOT) 参与用户可见的：

```text
ranking 排序
scores 分值计算
counts 计数
snippets 摘要片段
pagination 分页
```

除非受保护的派生搜索策略明确允许。

---

# 113. 隐藏候选者不得将可见结果挤压下沉 (Hidden Candidate Must Not Push Visible Results Down)

一种幼稚的排序流程：

```text
对所有机密 + 公开项目统一排序
然后再剔除机密项目
```

可能通过排名位置泄露信息。

逻辑语义要求在产生用户可见的排序行为之前完成授权。

---

# 114. 搜索索引新鲜度 (Search Index Freshness)

搜索可能是最终一致的。

每次 SEARCH 响应在策略允许时均应当 (SHOULD) 披露新鲜度。

推荐格式：

```json
{
  "context": {
    "space_id": "space-1",
    "search": {
      "index_seq": 1498,
      "current_space_seq": 1500,
      "consistency": "lagging",
      "mode": "hybrid"
    }
  }
}
```

---

# 115. `index_seq`

含义：

> 当前搜索索引/搜索分区针对查询相关索引视图所反映的最高 Space 提交序号。

确切的多索引语义可能需要索引检查点描述符。

---

# 116. 后端可近似提供 Index Seq (Index Seq May Be Approximate by Backend)

如果搜索后端无法提供精确的提交序号对齐，它必须 (MUST) 声明：

```text
consistency = eventual_unsequenced
```

或等效信息。

严禁伪造序号。

---

# 117. 搜索未命中不等于规范性不存在 (Search Miss Is Not Canonical Absence)

如果：

```text
SEARCH 未命中 X
```

智能体严禁 (MUST NOT) 得出结论：

```text
X 不存在。
```

特别是当：

```text
index_seq < current_space_seq
```

时。

---

# 118. 对正确性敏感的存在性检查 (Correctness-Sensitive Existence Check)

应使用规范的：

```text
基于 ID/键/精确模式的 KQL 查询
```

或事务唯一性约束。

---

# 119. 搜索结果应当携带精确 ID (Search Result Should Carry Exact IDs)

接地搜索的主要目的在于解析：

```text
模糊提及 → 精确的规范 ID
```

后续的 KQL/KML 操作应当使用这些 ID。

---

# 120. 搜索分页 (Search Pagination)

`SEARCH` 可以使用：

```text
LIMIT
CURSOR
```

---

# 121. 搜索游标上下文 (Search Cursor Context)

游标应当根据需要绑定：

```text
query
mode
filters
Principal visibility context
index checkpoint
ranking method/version
```

---

# 122. 搜索游标不是 KQL 快照游标 (Search Cursor Is Not KQL Snapshot Cursor)

KQL 游标锁定规范认知快照。

SEARCH 游标锁定索引/排序遍历上下文。

它们可能具有不同的一致性模型。

---

# 123. 分页期间的搜索索引变更 (Search Index Changes During Pagination)

搜索后端应当尽可能保留单个排序检查点/游标视图。

如果无法做到，必须通过系统能力明确披露较弱的分页稳定性。

---

# 124. 历史 SEARCH (Historical SEARCH)

KIP 2.0 基线不要求：

```text
SEARCH ... AS OF SEQ
```

因为历史向量/词法索引可能成本高昂且存在歧义。

---

# 125. 历史接地工作流 (Historical Grounding Workflow)

推荐工作流：

```text
SEARCH 当前索引
    ↓
解析出候选实体的精确 ID
    ↓
针对历史快照执行 KQL AS OF
```

如果仍然存在身份/历史歧义，请使用原始历史记录/自省机制。

---

# 126. 可选的历史搜索能力 (Optional Historical Search)

运行时可以声明：

```text
historical_search
```

并支持：

```text
SEARCH ... AS OF SEQ :seq
```

结合历史上准确的索引/检查点进行查询。

---

# 127. 历史搜索严禁将当前索引伪装为历史索引 (Historical Search Must Not Pretend Current Index Is Historical)

如果无法重构真正的历史索引：

```text
HistoricalSearchUnavailable
```

优于静默搜索当前状态。

---

# 128. 搜索隔离区语义 (Search Quarantine Semantics)

普通回忆 SEARCH 应当排除：

```text
quarantined Capsule staging
moderated-hidden imported content
```

除非调用主体对这些范围拥有审查/搜索权限。

---

# 129. 搜索与记忆强度 (Search and Memory Strength)

运行时可以将记忆强度合并到特定于大脑的回忆排序中。

如果执行合并，必须明确区分：

```text
semantic relevance score
mnemonic boost
recency boost
```

或公开说明综合评分计算方法。

---

# 130. 可移植 SEARCH 基线 (Portable SEARCH Baseline)

为了协议的可移植性，KIP 应当标准化请求/结果的语义，而不是限定单一的嵌入模型。

具体实现可以使用不同的：

```text
index engines
embedding models
lexical analyzers
hybrid rankers
```

---

# 131. 能力协商 (Capability Negotiation)

KIP 2.0 需要一个权威的位置用于发现运行时特性。

推荐：

```text
DESCRIBE CAPABILITIES
```

---

# 132. 能力分层 (Capability Layers)

响应应当区分：

```text
protocol support
runtime support
Space-specific support
effective Principal availability
limits
```

---

# 133. 能力声明示例 (Capability Example)

```json
{
  "protocol": {
    "kql": "2.0",
    "kml": "2.0",
    "meta": "2.0"
  },

  "supported": {
    "belief_projection": true,
    "historical_reads": true,
    "semantic_search": true,
    "atomic_transactions": true,
    "signed_capsules": true
  },

  "available": {
    "belief_projection": true,
    "historical_reads": true,
    "capsule_export": false
  },

  "limits": {
    "max_query_rows": 1000,
    "max_transaction_writes": 500,
    "max_capsule_bytes": 104857600
  }
}
```

---

# 134. `supported` 字段含义 (`supported`)

表示：

> 该运行时/空间在技术上实现了该能力。

---

# 135. `available` 字段含义 (`available`)

表示：

> 在当前已认证的调用主体与执行上下文下，至少可以在某些被允许的范围内请求使用该能力。

这并不等同于拥有无限制的授权。

---

# 136. `available` 不是权限全量倾倒 (`available` Is Not a Grant Dump)

调用方看到：

```text
capsule_export = true
```

并不会获知所有确切的导出范围/记录。

实际的操作级授权仍然会执行。

---

# 137. 能力枚举本身受治理控制 (Capability Enumeration Itself Is Governed)

如果区分特性未支持与调用方未授权会泄露敏感的安全配置，部署可以返回粗粒度的：

```text
"not available"
```

而不明确指出是：

```text
feature unsupported
or
caller unauthorized
```

---

# 138. 能力详细级别 (Capability Detail Levels)

推荐级别：

```text
public
effective
diagnostic
```

---

# 139. 公开能力 (Public Capabilities)

安全的实现级别支持。

示例：

```text
KQL 2.0
semantic search implemented
Capsule format 2.0
```

---

# 140. 有效能力 (Effective Capabilities)

特定于调用主体/空间的可用性。

需要经过认证的上下文。

---

# 141. 诊断能力 (Diagnostic Capabilities)

可能暴露：

```text
backend names
index checkpoint details
retention internals
proof suites
resource ceilings
```

并且可能需要管理/调试权限。

---

# 142. KQL 能力 (KQL Capabilities)

应当包括：

```text
assertion_patterns
evidence_patterns
activity_patterns
structural_patterns
belief_projection
belief_slot
historical_as_of
historical_by_time
raw_path_operators
projection_ledger
normalized_schema_view
max_path_hops
max_projection_count
```

---

# 143. KML 能力 (KML Capabilities)

应当包括：

```text
mutate_block
forward_local_refs
create_concept
upsert_concept
ensure_proposition
create_evidence
create_assertion
create_activity
assert_sugar
facet_mutation
structural_mutation
assertion_retraction
assertion_supersession
evidence_correction
activity_transition
archive
tombstone
purge
set_retention
non_destructive_merge
dry_run
client_key
```

---

# 144. 事务能力 (Transaction Capabilities)

应当包括：

```text
atomic_transactions
serializable_transactions
read_snapshots
historical_reads
idempotency
idempotency_retention
change_stream
change_stream_retention
transaction_lookup
dry_run
max_transaction_operations
max_transaction_writes
multi_space_atomic
```

---

# 145. 胶囊能力 (Capsule Capabilities)

应当包括：

```text
capsule_format_versions
snapshot_export
delta_capsule
signed_capsule
embedded_schema
external_blobs
protected_envelope
preview_import
isolate_import
merge_import
restore_import
capsule_sets
max_capsule_size
supported_digest_algorithms
supported_proof_suites
```

---

# 146. Schema 能力 (Schema Capabilities)

应当包括：

```text
schema_packages
multi_version_schema
historical_schema_environment
validation_only_schema_loading
compatibility_introspection
package_signature_verification
normalized_schema_view
```

---

# 147. 搜索能力 (Search Capabilities)

应当包括：

```text
keyword_search
semantic_search
hybrid_search
historical_search
search_kinds
index_consistency
score_semantics
max_search_results
```

---

# 148. 能力版本化 (Capability Versioning)

能力名称与结果 Schema 应当进行命名空间划分/版本化，或与 META 版本紧密绑定。

避免未版本化的供应商特定标志意外演变为标准协议语义。

---

# 149. 扩展能力 (Extension Capabilities)

供应商/Profile 扩展可以出现在：

```text
extensions
```

字段下，并带有全局/命名空间化的标识符。

非关键的未知能力扩展可以被安全忽略。

---

# 150. 能力协商工作流 (Capability Negotiation Workflow)

推荐的智能体启动流程：

```text
DESCRIBE PRIMER
        ↓
根据需要执行 DESCRIBE CAPABILITIES
        ↓
DESCRIBE 所需的精确 Schema 符号
        ↓
SEARCH 进行实体/概念接地
        ↓
执行 KQL/KML
```

---

# 151. 不得在每个回合中查询所有能力 (Do Not Ask for Every Capability Every Turn)

运行时/智能体可以根据以下维度缓存系统能力：

```text
runtime identity
Space
Principal/effective capability version
Schema Environment
```

并在失效时进行刷新。

---

# 152. 有效能力版本 (Effective Capability Version)

运行时可以公开：

```text
capability_context_version
```

或治理修订版本号，以便客户端能够检测到相关的能力变更。

---

# 153. 事务自省 (Transaction Introspection)

事务是空间状态的有序历史序列。

META 应当向获得授权的调用方暴露事务检查能力。

推荐命令：

```text
DESCRIBE TRANSACTION :tx_id
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
```

---

# 154. 事务查找的目的 (Transaction Lookup Purpose)

对于以下场景至关重要：

```text
ambiguous network failure
audit
debugging
change provenance
idempotent retry
```

---

# 155. 事务状态枚举 (Transaction Statuses)

推荐状态：

```text
pending
committed
aborted
no_effect
unknown
```

传输层/运行时可以公开额外的瞬态状态。

---

# 156. `unknown` 状态含义 (`unknown`)

表示：

> 查找服务无法为此标识符建立已知且已保留的事务记录。

绝不能将其与以下状态混淆：

```text
aborted.
```

---

# 157. 事务描述内容 (Transaction Description)

对于获得授权的调用方，可能包含：

```text
tx_id
status
space_id
snapshot_seq
space_seq
committed_at
transaction_class
request digest
result digest
Schema Environment identity
origin Principal summary
change summary
idempotency key/digest status
Governance decision/audit refs
```

具体受治理策略约束。

---

# 158. 事务请求体并不总是全量返回 (Transaction Request Body Is Not Always Returned)

一个事务可能包含：

```text
secret Evidence payload
sensitive KML
private policy operation
```

因此，查看原始请求/变更细节需要相应的读取/审计权限。

---

# 159. 模糊失败后的事务查找 (Transaction Lookup After Ambiguous Failure)

正确的智能体行为模式：

```text
write request loses response
        ↓
DESCRIBE TRANSACTION by idempotency key
        ↓
if committed:
    use original receipt
if absent/unknown:
    retry same idempotency key according to policy
```

绝不要自动创建全新的逻辑写入请求。

---

# 160. 凭据验证 (Receipt Verification)

推荐：

```text
VERIFY RECEIPT :receipt
```

适用于签发密码学可验证执行凭据的运行时。

---

# 161. 凭据验证检查项 (Receipt Verification)

可以检查：

```text
receipt digest
runtime signature/proof
tx_id binding
space_seq binding
result digest
```

除运行时所签署证实的内容外，它并不能证明语义上的绝对正确性。

---

# 162. `DESCRIBE SNAPSHOT` (`DESCRIBE SNAPSHOT`)

推荐：

```text
DESCRIBE SNAPSHOT
DESCRIBE SNAPSHOT AS OF SEQ :seq
DESCRIBE SNAPSHOT AS OF TX :tx
```

---

# 163. 快照描述内容 (Snapshot Description)

可能包含：

```text
space_id
resolved snapshot_seq
commit time boundary
Schema Environment version
historical readability
retention boundary
checkpoint digest if available
```

---

# 164. 快照不会将整个大脑物化拉取 (Snapshot Does Not Materialize the Whole Brain)

`DESCRIBE SNAPSHOT` 描述的是一个状态坐标。

它不是：

```text
EXPORT SPACE.
```

---

# 165. `SNAPSHOT TOKEN` (`SNAPSHOT TOKEN`)

推荐的只读运行时操作：

```text
SNAPSHOT
```

或：

```text
SNAPSHOT AS OF SEQ :seq
```

在受支持时返回一个不透明的：

```text
snapshot_token
```

---

# 166. 快照令牌的目的 (Snapshot Token Purpose)

用于：

```text
multi-query consistent planning
audit
complex Recall
migration preview
Capsule export
```

---

# 167. 快照令牌是不透明的 (Snapshot Token Is Opaque)

客户端严禁解析令牌以获取：

```text
permissions
Space IDs
expiry
```

即使具体实现的编码格式看起来可读。

---

# 168. 快照令牌不是权限凭证 (Snapshot Token Is Not Authority)

它锁定了可读的状态坐标。

当前的治理规则仍然控制每次读取访问。

---

# 169. 快照令牌过期 (Snapshot Token Expiry)

在安全的前提下，运行时应当公开：

```text
expires_at
historical fallback availability
```

---

# 170. 提交历史属于引擎历史 (Commit History Is Engine History)

KQL 图记录与提交记录不是同一概念。

META/运行时负责管理引擎历史的自省。

---

# 171. `HISTORY ELEMENT` (`HISTORY ELEMENT`)

推荐：

```text
HISTORY ELEMENT :element_id
  [FROM SEQ :from]
  [TO SEQ :to]
  [LIMIT :limit]
  [CURSOR :cursor]
```

---

# 172. 元素历史的目的 (Element History Purpose)

回答以下问题：

```text
When was this element created?
Which transactions changed it?
Which versions existed?
Was it tombstoned?
Which lifecycle transitions occurred?
```

---

# 173. HISTORY 默认不返回所有历史载荷 (HISTORY Does Not Return Every Historical Payload by Default)

紧凑的历史记录可以返回：

```text
version
tx_id
space_seq
operation class
changed field categories
```

使用：

```text
KQL AS OF
```

重构获得授权的历史认知内容。

---

# 174. 将 HISTORY 与 KQL AS OF 分离的原因 (Why Separate HISTORY from KQL AS OF)

```text
HISTORY
    explains transition chronology

KQL AS OF
    reconstructs cognitive content
```

这使得引擎日志与认知图语义保持清晰分离。

---

# 175. 历史可见性 (History Visibility)

对缺乏发现/历史权限的调用方，`HISTORY ELEMENT secret-id` 严禁泄露该元素的存在性。

---

# 176. `HISTORY SPACE` (`HISTORY SPACE`)

可选的特权操作：

```text
HISTORY SPACE
  FROM SEQ :from
  TO SEQ :to
```

可以在不暴露具体数据细节的前提下汇总事务历史。

---

# 177. 历史汇总内容 (History Summary)

可能包含的行信息：

```text
space_seq
tx_id
time
transaction_class
changed kind counts
Governance/schema/cognitive category
```

---

# 178. 审计权限 (Audit Authority)

根据请求字段的不同，详细的历史记录可能需要：

```text
read_audit
read_raw_origin
read_governance_history
```

权限。

---

# 179. `CHANGES SINCE` (`CHANGES SINCE`)

变更流（Change Stream）自然属于 META/运行时读取操作。

推荐：

```text
CHANGES SINCE :cursor
  [LIMIT :limit]
```

或在受支持时使用：

```text
CHANGES AFTER SEQ :seq
```

---

# 180. 变更信封 (Change Envelope)

每个已提交的状态变更事务生成一个逻辑信封：

```json
{
  "space_id": "space-1",
  "space_seq": 912,
  "tx_id": "tx-123",
  "committed_at": "...",
  "transaction_class": "cognitive",
  "changes": [...]
}
```

---

# 181. 原子信封语义 (Atomic Envelope Semantics)

消费者必须将单个信封内的所有变更视为：

```text
one committed cognitive transition.
```

不得将每个记录作为独立的学习事件来处理。

---

# 182. 变更投递可能为至少一次 (Change Delivery May Be At-Least-Once)

消费者必须基于以下字段进行去重：

```text
space_seq
tx_id
```

---

# 183. 变更重放不是新经验 (Change Replay Is Not New Experience)

两次接收到相同的信封严禁导致：

```text
evidence_count += 2
memory_strength reinforcement twice
duplicate Experience formation
duplicate Assertion
```

---

# 184. 变更流游标 (Change Stream Cursor)

游标是不透明的，且在所声明的留存期内支持恢复消费。

---

# 185. 变更流留存 (Change Stream Retention)

在受允许的情况下，系统能力应当公开：

```text
change_stream_retention
earliest_available_seq
```

---

# 186. 变更窗口丢失 (Missing Change Window)

如果游标超出了留存期范围：

```text
ChangeCursorExpired
```

附带安全的恢复建议，例如：

```text
request Snapshot Capsule / rebuild from current snapshot.
```

---

# 187. 变更流针对每个消费者单独受治理约束 (Change Stream Is Governed Per Consumer)

特权副本同步服务可能比普通智能体看到更多的变更记录。

严禁向未获授权的消费者暴露机密变更计数。

---

# 188. 变更流中的治理变更 (Governance Changes in Change Stream)

由于一个空间使用统一的 `space_seq`，变更流可能包含：

```text
cognitive
Governance
Schema
```

事务类别。

具体载荷内容会根据调用方权限进行过滤。

---

# 189. 历史中的 Schema 变更 (Schema Changes in History)

客户端可以结合使用：

```text
transaction history
+
DESCRIBE SCHEMA ENVIRONMENT AS OF SEQ
```

重构出当年管辖该历史写入的具体语义契约。

---

# 190. `VERIFY` (`VERIFY`)

META 2.0 赋予 `VERIFY` 精确的语义：

> **检查完整性、密码学证明或运行时证实的一致性，而不对语义真实性或目标端可接受性做出判断。**

---

# 191. VERIFY 不是 VALIDATE (VERIFY Is Not VALIDATE)

```text
VERIFY
    Are the claimed bytes/proofs internally authentic or intact?

VALIDATE
    Is the object/command structurally/legal-semantically valid?

PREVIEW
    What would happen here, now, under this destination context?
```

---

# 192. VERIFY 不是信任 (VERIFY Is Not Trust)

签名在密码学上有效，但签名者本身可能完全不受信任。

---

# 193. VERIFY 不是真理 (VERIFY Is Not Truth)

一份拥有完美签名的胶囊可能包含虚假的断言。

---

# 194. VERIFY 目标 (VERIFY Targets)

根据声明的能力，推荐支持：

```text
VERIFY CAPSULE
VERIFY SCHEMA PACKAGE
VERIFY RECEIPT
VERIFY BLOB
VERIFY CHECKPOINT
```

---

# 195. 验证结果维度 (Verification Result Dimensions)

推荐维度：

```text
integrity_valid
digest_algorithm
digest_valid
proofs[]
signer resolution
cryptographic validity
attestation scope
revocation status if checked
warnings
```

---

# 196. 签名者信任必须分离 (Signer Trust Must Be Separate)

可选结果：

```json
{
  "proof": {
    "cryptographically_valid": true,
    "signer_identity": "resolved",
    "local_trust": "unknown"
  }
}
```

绝不能粗暴合并为：

```text
verified = trustworthy.
```

---

# 197. 验证可以离线进行 (Verification May Be Offline)

若所有必需的密钥材料/证明均可用，摘要/签名验证可以在没有实时目标空间的情况下执行。

治理规则仍然可以控制对工件原始字节的访问。

---

# 198. 外部吊销检查 (External Revocation Checking)

如果验证需要获取外部密钥/吊销状态：

```text
network access
```

属于独立的系统能力/策略。

META 严禁静默发起对任意 URL 的网络请求。

---

# 199. `VALIDATE` (`VALIDATE`)

META `VALIDATE` 的含义是：

> **在不提交状态变更的前提下，检查对象或命令是否符合声明的核心模型、Schema、协议以及上下文约束。**

---

# 200. 校验目标 (Validation Targets)

推荐：

```text
VALIDATE KQL
VALIDATE KML
VALIDATE CAPSULE
VALIDATE SCHEMA PACKAGE
VALIDATE IMPORT PLAN
```

---

# 201. `VALIDATE KQL` (`VALIDATE KQL`)

检查：

```text
syntax
variable scope
field existence
Schema symbol resolution
type compatibility
bounded BELIEF targets
supported capabilities
resource-risk estimate
authorization feasibility where safe
```

而不实际执行并返回查询结果。

---

# 202. KQL 校验不能证明结果存在 (KQL Validation Does Not Prove Result Exists)

一条合法的查询可能返回：

```text
zero rows.
```

校验仅表明该查询符合协议规范。

---

# 203. `VALIDATE KML` (`VALIDATE KML`)

检查：

```text
syntax
Schema resolution
mutability
reference legality
lifecycle state requirements
required permissions
resource estimate
precondition syntax
```

而不实际提交变更。

---

# 204. 动态 KML 校验 (Dynamic KML Validation)

若针对当前空间状态运行校验，校验可以额外检查：

```text
current versions
current lifecycle
current referenced elements
current authority
```

但这仍然属于预览时的即时观察。

---

# 205. 校验不是预留 (Validation Is Not Reservation)

在：

```text
VALIDATE
```

与：

```text
commit
```

之间，外部世界可能会发生变化：

```text
version changes
Grant revoked
Schema blocked
reference created/deleted
```

提交时会重新进行校验。

---

# 206. 校验结果应当说明其有效边界 (Validation Result Should Say Its Boundary)

推荐格式：

```json
{
  "valid": true,
  "checked_at_seq": 1500,
  "schema_environment_version": 17,
  "authorization_checked": true,
  "commit_guaranteed": false
}
```

---

# 207. `VALIDATE SCHEMA PACKAGE` (`VALIDATE SCHEMA PACKAGE`)

检查：

```text
manifest shape
package identity/version
canonical digest
dependency declarations
symbol uniqueness
constraint consistency
migration descriptor syntax
non-executable restrictions
```

这不会激活该 Package。

---

# 208. `VALIDATE CAPSULE` (`VALIDATE CAPSULE`)

根据请求的校验深度，检查：

```text
format
canonicalization
digest
Schema dependencies
Core record structure
closure/reference integrity
resource limits
identity conflicts
Governance compatibility
procedural-risk classification
```

---

# 209. 胶囊校验可以按仅校验模式加载嵌入式 Schema (Capsule Validation Can Load Embedded Schema Validation-Only)

严禁对这些包执行：

```text
activate
install as trusted
set default
```

---

# 210. 校验不代表信任发送者 (Validation Does Not Trust Sender)

一份在结构上完全合法的胶囊仍然可能是：

```text
malicious
false
irrelevant
unsafe
```

---

# 211. `PREVIEW` (`PREVIEW`)

META `PREVIEW` 的含义是：

> **在不提交变更或预留状态的前提下，模拟可能的操作在特定上下文中的实际执行效果。**

---

# 212. 预览目标 (Preview Targets)

推荐：

```text
PREVIEW KML
PREVIEW IMPORT CAPSULE
```

`PREVIEW MERGE`、`PREVIEW PURGE` 与 `PREVIEW SCHEMA MIGRATION` 属于保留的预览目标：
其操作数语法尚未在 KIP 2.0 META 文法中冻结，因此 2.0 运行时严禁 (MUST NOT) 将其作为基线语法接受。

部分操作可以委托给受保护的子系统 dry-run 逻辑。

---

# 213. PREVIEW KML (PREVIEW KML)

可以返回：

```text
resolved local handles
existing vs new canonical Propositions
matched update count
predicted lifecycle transitions
required permissions
predicted classification
estimated write count
precondition state
warnings
```

无需永久预留任何 ID。

---

# 214. 预览分配的 ID 不具备持久性 (Preview-Allocated IDs Are Not Durable)

如果预览展示了假设性分配的 ID，必须明确标记为：

```text
temporary
```

或直接省略。

提交时可能会分配不同的局部 ID，除非协议明确提供预留保证。基线协议不提供预留保证。

---

# 215. `PREVIEW IMPORT CAPSULE` (`PREVIEW IMPORT CAPSULE`)

这是关键的只读胶囊操作。

它负责评估：

```text
artifact verification
Schema resolution
identity mapping plan
canonical_id conflicts
Proposition canonicalization
Assertion/Evidence import mapping
Governance handling mapping
authority defaults
quarantine decisions
record-level accept/reject
resource estimate
required approvals
```

---

# 216. 导入预览因目标端而异 (Import Preview Is Destination-Specific)

同一份胶囊在不同的目标端中预览结果可能截然不同：

```text
Space A
Space B
```

因为两者的：

```text
existing identities
Schema Environment
Governance
trust
authority
classification
```

互不相同。

---

# 217. 预览不会执行导入 (Preview Does Not Import)

不会创建任何持久化的：

```text
Concept
Proposition
Assertion
Evidence
Activity
Import Mapping
```

---

# 218. 预览不会激活嵌入式 Schema (Preview Does Not Activate Embedded Schema)

至多进行：

```text
validation-only temporary resolution.
```

---

# 219. 预览不会提升技能执行权限 (Preview Does Not Elevate Skill)

导入技能的预览可能会提示：

```text
would import as candidate / inactive
```

这绝不会执行或激活该技能。

---

# 220. 预览必须保护隐藏的目标端实体标识 (Preview Must Protect Hidden Destination Identity)

身份解析预览严禁向缺乏发现权限的导入方泄露：

```text
secret local Concept exists
```

的信息。

此时应当返回：

```text
mapping unavailable / requires privileged review
```

作为替代。

---

# 221. 预览与提交之间的竞态条件 (Preview Commit Race)

在预览之后：

```text
identity could merge
Schema could change
Grant could revoke
target could be created
```

因此：

```text
preview_plan_digest
```

结合提交时的前提条件可以减少竞态冲突，但预览绝不能保证后续提交必定成功。

---

# 222. 校验与预览示例 (Validation vs. Preview Example)

针对胶囊 C：

```text
VALIDATE CAPSULE C
    → structurally valid

PREVIEW IMPORT CAPSULE C INTO Space A
    → identity conflict, would quarantine

PREVIEW IMPORT CAPSULE C INTO Space B
    → no conflict, merge allowed
```

这种区分是经过深思熟虑的设计。

---

# 223. `DESCRIBE CAPSULE` (`DESCRIBE CAPSULE`)

推荐的只读工件概要检查命令。

返回：

```text
format/version
content digest
kind snapshot/delta
source Nexus/Space summary
source snapshot
record counts
Schema dependencies
closure/completeness
handling/classification
risk classes
proof summary
blob summary
```

---

# 224. DESCRIBE 不必然自动执行完整验证 (DESCRIBE Does Not Verify Automatically Necessarily)

快速描述可以仅解析声明的元数据，而不验证每个 Blob/签名。

响应必须明确区分：

```text
declared
vs.
verified
```

字段。

---

# 225. 安全的胶囊描述 (Safe Capsule Describe)

对于不受信任的超大工件，具体实现应在深度描述前执行大小与解析器限制检查。

---

# 226. `VERIFY CAPSULE` (`VERIFY CAPSULE`)

执行：

```text
canonical content digest verification
proof/signature verification
embedded Package digest verification
inline/external blob digest verification when bytes available
source/checkpoint proof validation where supported
```

---

# 227. 外部 Blob 验证 (External Blob Verification)

若 Blob 字节数据未提供：

```text
status = unavailable/not_checked
```

除非触发了经过独立授权的拉取操作。

严禁自动发起拉取。

---

# 228. `EXPORT CAPSULE` (`EXPORT CAPSULE`)

KIP 2.0 将导出保留在 META/只读范畴中。

推荐的概念语法：

```text
EXPORT CAPSULE ?target
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
[AS OF SEQ :seq]
```

操作数命名的是**选择根绑定 (selection root binding)**：`WHERE` 块绑定到它的每个元素都属于导出根集合。它也可以 (MAY) 是命名单个根元素的参数或字符串。`WITH` 与 `AS OF` 均为可选。

---

# 229. 导出使用 KQL 选择集 (Export Uses KQL Selection)

选择集代表当前治理策略约束下的结构化认知状态。

---

# 230. 导出具备快照一致性 (Export Is Snapshot-Consistent)

所有记录均来自单个锁定的：

```text
source snapshot_seq.
```

---

# 231. 导出比读取具有更高的权限要求 (Export Is More Privileged Than Read)

调用主体可能被允许：

```text
read
```

但被拒绝：

```text
export.
```

META 并不会因为导出是只读操作而绕过这一权限约束。

---

# 232. 导出治理在序列化前生效 (Export Governance Applies Before Serialization)

未获授权的记录严禁通过以下途径发生泄露：

```text
record count
ExternalRef
Schema hint
proof tree
selection diagnostic
```

除非策略明确允许脱敏的存在性信号。

---

# 233. 导出结果 (Export Result)

推荐包含：

```text
Capsule artifact handle/bytes
content digest
source snapshot_seq
selection completeness
record counts
proof status
```

---

# 234. 工件句柄 (Artifact Handle)

传输层可以通过以下方式传递胶囊/Package：

```text
file/artifact handle
content-addressed ref
binary upload reference
```

而不是在 META 命令文本中嵌入巨大的 JSON。

具体 API 取决于传输层实现。

---

# 235. META 严禁将工件 URL 视为安全资源 (META Does Not Treat Artifact URL as Safe)

作为工件引用提供的 URL/字符串不会被系统自动拉取。

外部网络拉取需要独立的系统能力与策略支持。

---

# 236. 基于工件句柄的 `DESCRIBE CAPSULE` (`DESCRIBE CAPSULE` on Artifact Handle)

运行时可以解析已经提供的本地工件句柄。

这仍然属于只读操作。

---

# 237. Schema 包验证 (Schema Package Verification)

推荐：

```text
VERIFY SCHEMA PACKAGE :artifact
```

检查：

```text
canonical digest
signature/proof
package identity binding
```

---

# 238. 包验证不会激活该包 (Package Verification Does поя Activate)

即使是带有有效签名的 Package，在治理层执行 Schema 管理前仍然处于：

```text
uninstalled/untrusted/inactive
```

状态。

---

# 239. `VALIDATE IMPORT PLAN` (`VALIDATE IMPORT PLAN`)

目标端可以物化一个显式的预览计划：

```text
Capsule digest
target Space
identity mappings
record decisions
handling mappings
authority defaults
```

META 可以校验该计划的一致性。

---

# 240. 导入计划摘要 (Import Plan Digest)

推荐：

```text
import_plan_digest
```

绑定规划出的解释推导方案。

后续的导入事务可以引用该摘要并附带最新的前提条件。

---

# 241. 导入计划不是授权令牌 (Import Plan Is Not Authorization Token)

持有一份有效的计划不能绕过：

```text
current import permission
commit-time Governance
Schema state
identity state
```

---

# 242. META 与认识论投影 (META and Epistemic Projection)

META 不应当重复 KQL `BELIEF` 的功能。

然而 META 可以自省投影机制本身。

推荐：

```text
DESCRIBE EPISTEMIC POLICY
DESCRIBE PROJECTION CAPABILITY
```

仅在治理策略允许时使用。

---

# 243. `DESCRIBE EPISTEMIC POLICY` (`DESCRIBE EPISTEMIC POLICY`)

可以公开安全的策略元数据：

```text
policy_id/version
purpose/risk vocabulary
supported statuses
score semantics
freshness behavior
historical handling
explanation levels
```

---

# 244. 信任规则可能包含敏感信息 (Trust Rules May Be Sensitive)

信任状态自省使用：

```text
DESCRIBE TRUST
DESCRIBE TRUST :signer
```

并与其他控制平面自省一样受治理约束。

详细的：

```text
which sources are trusted
exact trust values
security rules
```

可能需要 `manage_trust`/审计权限。

普通智能体可能只能接收到可使用的策略契约。

---

# 245. 投影契约与信任配置分离 (Projection Contract vs. Trust Configuration)

智能体通常需要了解：

```text
what purpose/risk values are legal
what outputs mean
```

而不是：

```text
the entire private Trust Resolver.
```

META 应当将两者严格分离。

---

# 246. `LIST EPISTEMIC POLICIES` (`LIST EPISTEMIC POLICIES`)

可选的受治理操作。

仅返回调用主体有权发现/使用的策略。

---

# 247. META 与治理自省 (META and Governance Introspection)

META 可以提供安全的实际访问权限检查：

```text
DESCRIBE ACCESS
```

但必须避免成为全量策略渗透泄露的面。

---

# 248. `DESCRIBE ACCESS` (`DESCRIBE ACCESS`)

推荐用途：

> 为什么我可以/不能执行此项协议操作？

输入列表通过可选的 `WITH` 对象传递：

```text
DESCRIBE ACCESS
WITH {
  operation: "purge",
  resource_kind: "Concept",
  space: :space_id,
  purpose: "maintenance"
}
```

---

# 249. 访问自省结果 (Access Result)

可以返回：

```text
allowed
denied
requires approval
requires stronger authentication
requires ActorBinding
```

而不暴露隐藏的策略内部细节。

---

# 250. 访问自省绝非机密资源的策略评估预言机 (Access Introspection Is Not Policy Evaluation Oracle for Secret Resources)

调用方严禁通过：

```text
DESCRIBE ACCESS WITH {resource: :guessed_id}
```

枚举猜测的机密 ID 并推断其是否存在。

必须遵循存在性中立原则。

---

# 251. 实际 Actor 绑定自省 (Effective Actor Binding Introspection)

`DESCRIBE EXECUTION CONTEXT` 可以暴露：

```text
current verified actor bindings
representation scopes
```

以帮助 KML 在以下模式间做出选择：

```text
record_attributed_assertion
assert_as_actor
```

---

# 252. 绑定细节受治理保护 (Binding Details Are Governance-Protected)

严禁向普通用户暴露完整的调用主体 ↔ actor 映射关系。

---

# 253. META 与规范化查询/命令 (META and Normalized Query/Command)

在可行的情况下，校验应当返回规范化的语义形式/摘要。

例如：

```text
"Person"
→ exact schema_ref

"timezone"
→ exact predicate_ref
```

---

# 254. 规范化形式的重要性 (Why Normalized Form Matters)

有助于：

```text
debug ambiguity
transaction idempotency
audit
cross-language implementations
Agent self-correction
```

---

# 255. 规范化 KML 不会被执行 (Normalized KML Is Not Executed)

智能体可以选择在后续提交它。

META 校验本身始终保持只读。

---

# 256. 规范化 KQL (Normalized KQL)

校验响应可以暴露：

```text
resolved predicates
resolved types
projection policy binding
historical snapshot binding
```

而不实际执行数据行。

---

# 257. 查询计划解释 (Query Plan Explanation)

可选的诊断操作：

```text
DESCRIBE QUERY PLAN
```

或：

```text
VALIDATE KQL :query WITH {plan: true}
```

可以暴露数据库执行计划。

这不属于强制的基线要求。`DESCRIBE QUERY PLAN` 并不属于 KIP 2.0 META 文法；
只有 `VALIDATE ... WITH {...}` 选项形式是合法语法，且两者都仍受能力开关约束，仅作诊断用途。

---

# 258. 查询计划可能泄露底层基础设施信息 (Query Plan Can Leak Infrastructure)

详细的：

```text
index names
partition topology
cardinality estimates
```

应当仅供诊断使用。

---

# 259. 查询计划不是认识论解释 (Query Plan Is Not Epistemic Explanation)

```text
query plan
    how the engine retrieves rows

Epistemic Ledger
    why the Brain reached a belief projection
```

严禁将两者混为一谈。

---

# 260. 资源消耗预估 (Resource Estimates)

VALIDATE/PREVIEW 可以返回粗粒度的：

```text
estimated rows
estimated writes
estimated blob bytes
estimated projection count
estimated path expansion
```

---

# 261. 资源预估仅供参考 (Resource Estimate Is Advisory)

并发的状态/索引变更可能会改变实际开销。

除非运行时显式支持资源预留，否则不得将其视为硬性的执行保证。

---

# 262. META 默认不提供资源预留 (No META Reservation by Default)

META 校验/预览不会预留：

```text
IDs
versions
capacity
permissions
Schema state
transaction slot
```

---

# 263. 与 Dry Run 的关系 (Dry Run Relationship)

KML/事务运行时可以公开：

```text
dry_run = true
```

META `PREVIEW KML` 可以利用该基础设施来实现。

在语义上：

```text
PREVIEW
    = read-only simulated mutation
```

---

# 264. Dry Run 严禁递增计数器 (Dry Run Must Not Increment Counters)

Dry run 严禁：

```text
increment element version
create Change Envelope
consume client_key permanently
record cognitive Activity
reinforce memory
```

除非由独立的网络安全审计策略记录该尝试性操作。

---

# 265. 安全审计例外 (Security Audit Exception)

高安全级别运行时可以记录：

```text
denied
previewed
high-risk attempted
```

管理事件。

该安全审计与认知层状态变更完全解耦。

---

# 266. META 历史时间 (META Historical Time)

当目标对象具有历史意义时，部分 META 操作可以接受：

```text
AS OF SEQ
AS OF TX
AS OF TIME
```

---

# 267. 良好的历史 META 目标 (Good Historical META Targets)

示例：

```text
DESCRIBE SCHEMA ENVIRONMENT AS OF SEQ
DESCRIBE SNAPSHOT AS OF SEQ
HISTORY ELEMENT
HISTORY SPACE
```

---

# 268. 当前系统能力通常针对当前时刻 (Current Capabilities Are Usually Current)

`DESCRIBE CAPABILITIES AS OF SEQ` 不属于基线，因为：

```text
runtime support today
```

不必然能够重构为历史空间状态。

---

# 269. 历史治理与当前授权的关系 (Historical Governance vs. Current Authorization)

与 KQL 一致：

```text
historical state
```

仅在满足以下条件时才能被重构：

```text
current caller is authorized to inspect it now.
```

---

# 270. 历史 META 严禁绕过当前安全策略 (Historical META Cannot Bypass Current Security)

历史上属于公开、但当下被划为机密的记录，在当前访问策略下仍然受到严格保护。

---

# 271. META 分页机制 (META Pagination)

集合类操作在适当时使用：

```text
LIMIT
CURSOR
```

---

# 272. 受治理的分页游标 (Governed Pagination)

游标根据相关性绑定：

```text
operation
parameters
Space/context
Principal visibility
snapshot/index checkpoint
ordering
```

---

# 273. 游标是不透明的 (Cursor Is Opaque)

客户端严禁自行构造或篡改游标。

---

# 274. 游标失效与吊销 (Cursor Revocation)

游标不会永久保留旧的访问权限。

若调用主体在此期间失去了权限：

```text
continuation may be denied/redacted.
```

---

# 275. LIST 快照一致性 (LIST Snapshot Consistency)

针对 Schema/运行时状态的规范 LIST 操作应当明确标识生成该列表时所依据的快照/环境。

---

# 276. 搜索游标一致性 (Search Cursor Consistency)

SEARCH 可能会绑定索引检查点，而非规范的空间快照。

结果必须公开其一致性级别。

---

# 277. 变更流游标一致性 (Change Cursor Consistency)

CHANGES 游标绑定提交日志位置与留存边界。

它既不是 KQL 游标，也不是 SEARCH 游标。

---

# 278. 游标类型不可互换 (Cursor Types Are Not Interchangeable)

运行时应当拒绝：

```text
KQL cursor used in SEARCH
SEARCH cursor used in CHANGES
```

并返回：

```text
CursorTypeMismatch
```

或等价错误。

---

# 279. META 错误类别体系 (META Error Categories)

推荐错误类别：

```text
InvalidSyntax
UnsupportedCapability

NotFoundOrNotVisible
NotAuthorized
RequiresApproval
RequiresStrongerAuthentication

SchemaSymbolNotFound
SchemaSymbolAmbiguous
SchemaPackageUnavailable
HistoricalSchemaUnavailable
ConstraintViolation

SearchModeUnsupported
SearchIndexUnavailable
CursorInvalidated
HistoricalSearchUnavailable

TransactionUnknown
HistoricalSnapshotUnavailable
ChangeCursorExpired
ChangeCursorInvalid

ArtifactParseError
DigestMismatch
ProofInvalid
SignerUnknown
BlobUnavailable
CapsuleValidationFailed
ImportPreviewConflict

ResourceExhausted
ExecutionTimeout
```

以上每个代码均来自核心错误注册表 (规范 §87)；META 不新增私有错误代码命名空间。

---

# 280. 错误响应应当维护系统安全性 (Error Response Should Preserve Security)

当这种区分会泄露受保护的存在性时，严禁区分：

```text
secret thing exists but denied
```

与：

```text
thing absent
```

在适当时使用：

```text
NotFoundOrNotVisible
```

---

# 281. 验证错误与校验错误对比 (Verification Errors vs. Validation Errors)

示例：

```text
DigestMismatch
    verification failure

ConstraintViolation / CapsuleValidationFailed
    validation failure

ImportPreviewConflict
    destination preview failure
```

严禁将其粗暴合并为泛化的：

```text
invalid.
```

---

# 282. 重试能力元数据 (Retryability Metadata)

META 错误应当分类说明：

```text
safe_same_request
requires_refresh
requires_different_input
requires_authority
requires_new_snapshot
requires_reacquire_artifact
outcome_lookup_required
non_retryable
```

---

# 283. 智能体恢复示例 — 符号歧义 (Agent Recovery Example)

`SchemaSymbolAmbiguous`:

```text
DESCRIBE/LIST candidate symbols
choose exact ref
retry query
```

---

# 284. 智能体恢复示例 — 搜索索引不可用 (Agent Recovery Example)

`SearchIndexUnavailable`:

```text
use keyword fallback
or
KQL exact grounding if possible
```

---

# 285. 智能体恢复示例 — 变更游标过期 (Agent Recovery Example)

`ChangeCursorExpired`:

```text
obtain current Snapshot Capsule
rebuild mirror
resume from new checkpoint
```

---

# 286. 智能体恢复示例 — 摘要不匹配 (Agent Recovery Example)

`DigestMismatch`:

```text
reacquire artifact
do not import.
```

---

# 287. 智能体恢复示例 — 网络中断后事务未知 (Agent Recovery Example)

网络断开后出现 `TransactionUnknown`:

```text
retry same idempotency key according to transaction semantics
```

而不是发起新的逻辑写入。

---

# 288. META 能力一致性分级 (META Capability Conformance)

推荐的一致性分组：

```text
META Core
META Schema
META Search
META Runtime History
META Capsule
META Verification
META Preview
META High Assurance
```

---

# 289. META Core 一致性要求 (META Core Conformance)

必须为以下操作提供等价语义支持：

```text
DESCRIBE PRIMER
DESCRIBE PROTOCOL
DESCRIBE EXECUTION CONTEXT
DESCRIBE CAPABILITIES
basic LIST/Schema discovery
structured error hints
Governance-filtered introspection
```

---

# 290. META Schema 一致性要求 (META Schema Conformance)

增加支持：

```text
DESCRIBE SCHEMA ENVIRONMENT
PACKAGE
TYPE
PREDICATE
FACET
STRUCTURAL FIELD
COMPATIBILITY
historical Schema description where advertised
```

---

# 291. META Search 一致性要求 (META Search Conformance)

增加支持：

```text
SEARCH CONCEPT
SEARCH PROPOSITION
keyword mode
retrieval result context
Governance-first ranking
index freshness declaration
```

语义/混合搜索可以属于更高的一致性能力级别。

---

# 292. META 运行时历史一致性 (META Runtime History Conformance)

增加支持：

```text
DESCRIBE TRANSACTION
DESCRIBE SNAPSHOT
HISTORY ELEMENT
CHANGES
transaction lookup
change retention
```

---

# 293. META 胶囊一致性 (META Capsule Conformance)

根据所支持的胶囊 Profile，增加支持：

```text
DESCRIBE CAPSULE
VERIFY CAPSULE
VALIDATE CAPSULE
PREVIEW IMPORT CAPSULE
EXPORT CAPSULE
```

---

# 294. META 验证一致性 (META Verification Conformance)

为以下对象增加标准化的验证维度支持：

```text
Capsule
Schema Package
Receipt
Blob
Checkpoint
```

---

# 295. META 预览一致性 (META Preview Conformance)

在不发生状态变更/预留的前提下，增加支持：

```text
PREVIEW KML
PREVIEW IMPORT CAPSULE
high-impact mutation dry-run
```

---

# 296. 高保证级别 META (High-Assurance META)

可能要求：

```text
signed receipts
historical Schema environment
auditable capability versions
index checkpoint identity
deterministic validation digest
proof-suite registry
existence-neutral errors
strict resource ceilings
```

---

# 297. 一致性测试夹具 — Primer (Conformance Fixtures — Primer)

测试验证：

```text
Primer contains exact protocol versions
Primer distinguishes Principal from `$self`
Primer identifies Space/Schema context
Primer does not expose secret Domains
Primer includes raw Proposition != belief reminder
Primer digest changes when dynamic context materially changes
```

---

# 298. 一致性测试夹具 — Schema (Conformance Fixtures — Schema)

```text
DESCRIBE TYPE local alias returns exact ref
ambiguous alias fails
exact ref succeeds
Package digest returned
historical Schema Environment reconstructed
ordinary cognitive Concept named "Person" does not redefine result
```

---

# 299. 一致性测试夹具 — Search (Conformance Fixtures — Search)

```text
high-score untrusted Assertion is still only a search hit
SEARCH score never appears as Assertion confidence
hidden Evidence never affects visible ranking
search miss with lagging index not reported as canonical absence
result returns exact IDs
semantic search unsupported → capability/error
```

---

# 300. 一致性测试夹具 — Capability (Conformance Fixtures — Capability)

```text
runtime supports purge but caller unavailable
supported=true
available=false/coarsened

caller loses permission
effective capability refresh changes

hidden Space not enumerated through capability detail
```

---

# 301. 一致性测试夹具 — Transaction (Conformance Fixtures — Transaction)

```text
committed tx lookup returns original receipt
aborted tx distinguishable from committed
unknown tx not treated as aborted
idempotency-key lookup resolves committed network-lost write
secret transaction payload redacted from ordinary caller
```

---

# 302. 一致性测试夹具 — History (Conformance Fixtures — History)

```text
element version history ordered by space_seq
KQL AS OF reconstructs content
HISTORY explains transitions

historical public-now-secret record remains hidden
```

---

# 303. 一致性测试夹具 — Change Stream (Conformance Fixtures — Change Stream)

```text
one transaction with five writes
→ one Change Envelope

same envelope delivered twice
→ consumer can dedupe

expired cursor
→ explicit recovery error
```

---

# 304. 一致性测试夹具 — Verify/Validate/Preview (Conformance Fixtures — Verify/Validate/Preview)

```text
valid signature + structurally invalid Capsule
VERIFY succeeds
VALIDATE fails

valid Capsule + identity conflict in target
VALIDATE structural succeeds
PREVIEW IMPORT reports conflict

valid Package signature
does not activate Package

preview KML
does not increment versions
does not reserve client_key
does not create Change Envelope
```

---

# 305. 一致性测试夹具 — Governance (Conformance Fixtures — Governance)

```text
DESCRIBE hidden ID → not_found-equivalent

SEARCH secret Evidence
→ no hit/count/rank leak

PREVIEW import against hidden local Concept
→ no identity existence leak to unauthorized importer

DESCRIBE ACCESS guessed secret resource
→ existence-neutral response
```

---

# 306. KIP 1.x 兼容性 (KIP 1.x Compatibility)

META 2.0 有意保留了 v1 的核心精神与绝大部分语法结构。

---

# 307. v1 `DESCRIBE PRIMER` (v1 `DESCRIBE PRIMER`)

予以保留。

但 v2 Primer 额外明确区分：

```text
Principal
semantic `$self`
Space
Schema Environment
capabilities
cognitive invariants
```

而不是将身份混淆为单一未分层的概念。

---

# 308. v1 `DESCRIBE DOMAINS` (v1 `DESCRIBE DOMAINS`)

由 `DESCRIBE PRIMER` 的领域 / 主题图谱层提供（§31）；不存在单独的原生命令。兼容适配器把 v1 拼写映射到该层，正如它把 `DESCRIBE CONCEPT TYPES` 映射到 `LIST TYPES`（§310）。

在 v2 中，该图谱被明确定义为：

```text
semantic/navigation state
```

而非权威的 Schema 或治理规则。

---

# 309. v1 概念类型 / 命题类型 (v1 Concept Types / Proposition Types)

在 v1 中：

```text
$ConceptType
$PropositionType
```

是自描述的图 Concept。

v2 的权威自省机制改为读取：

```text
Schema Package definitions
```

并返回对模型友好的认知视图。

---

# 310. 旧版类型列表 (Legacy Type Listing)

兼容性命令：

```text
DESCRIBE CONCEPT TYPES
```

可以映射到：

```text
LIST TYPES
```

---

# 311. 旧版命题类型列表 (Legacy Proposition Type Listing)

兼容性命令：

```text
DESCRIBE PROPOSITION TYPES
```

可以映射到：

```text
LIST PREDICATES
```

---

# 312. 旧版 `SEARCH CONCEPT` (Legacy `SEARCH CONCEPT`)

几乎完全直接保留。

原生的 v2 响应将检索评分从泛型元数据中移至：

```text
retrieval
```

响应上下文中。

---

# 313. 旧版 `SEARCH PROPOSITION` (Legacy `SEARCH PROPOSITION`)

作为原始语义接地机制予以保留。

它绝不意味着匹配到的 Proposition 已被接受为当前信念。

---

# 314. 旧版 SEARCH `WITH TYPE` (Legacy SEARCH `WITH TYPE`)

在兼容模式下接受。

原生的 v2 根据所搜索的对象类别更倾向于使用：

```text
WITH TYPE
WITH PREDICATE
```

---

# 315. 旧版 SEARCH 评分 (Legacy SEARCH Score)

v1 的 `_score` 语义在概念上得以延续：

```text
transient retrieval relevance
```

但不再存在于通用的元数据命名空间中。

---

# 316. 旧版 `EXPORT` (Legacy `EXPORT`)

v1 EXPORT 返回幂等的 KML UPSERT 脚本。

原生的 v2：

```text
EXPORT CAPSULE
```

返回规范的认知胶囊工件。

---

# 317. 原生导出必须变更的原因 (Why Native Export Must Change)

KIP 2.0 的可移植性要求包含：

```text
Assertion
Evidence
Activity
exact Schema dependencies
source snapshot
origin receipts
handling
digest
proofs
```

这些信息无法仅凭通用的 UPSERT 脚本安全表达。

---

# 318. 旧版 EXPORT 兼容性 (Legacy EXPORT Compatibility)

v2 运行时仍然可以公开：

```text
EXPORT LEGACY KIP1
```

以支持迁移与互操作。

应明确将其标记为较低保真度。

---

# 319. v1 只读工具边界 (v1 Readonly Tool Boundary)

v1 中关于专用的：

```text
execute_kip_readonly
```

的强力设计理念应当在概念上得以延续。

KIP 2.0 只读端点在获得授权的前提下应当允许：

```text
KQL
META
Capsule describe/verify/validate/export
dry-run/preview
```

---

# 320. 只读端点必须拒绝变更操作 (Readonly Endpoint Must Reject Mutation)

即使字符串包含合法的 KML，只读端点也必须拒绝所有具备提交能力的变更操作。

---

# 321. 只读端点上的预览操作 (Preview on Readonly Endpoint)

由于 KML preview/dry-run 不产生持久状态变更，因此可以被允许执行。

运行时必须保证：

```text
no reservation
no client-key consumption
no version changes
no cognitive side effects
```

---

# 322. v1 工作流演进 (v1 Workflow Evolution)

原始流程：

```text
Explore & Ground META
    ↓
Generate KQL/KML
    ↓
Execute
    ↓
Solidify
```

v2 演进为：

```text
Prime / Negotiate
        ↓
Explore / Ground
        ↓
Structured Query / Belief Projection
        ↓
Reason / Decide
        ↓
Validate / Preview when needed
        ↓
Cognitive Mutation Transaction
        ↓
Receipt / History
```

---

# 323. 推荐的智能体启动工作流 (Recommended Agent Startup Workflow)

```text
1. DESCRIBE PRIMER

2. If needed:
   DESCRIBE CAPABILITIES

3. If schema unclear:
   DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD

4. If entity unclear:
   SEARCH

5. Query:
   KQL FIND / BELIEF

6. If writing:
   VALIDATE/PREVIEW KML for risky operations
   then KML/Transaction

7. If outcome ambiguous:
   DESCRIBE TRANSACTION / receipt lookup

8. If sharing:
   EXPORT/DESCRIBE/VERIFY/VALIDATE/PREVIEW CAPSULE
```

---

# 324. 面向 META 的最小模型引导词 (Minimal Model Primer for META)

```text
META is read-only introspection/grounding.

Use:
  DESCRIBE PRIMER
  DESCRIBE CAPABILITIES
  DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD
  SEARCH
  DESCRIBE TRANSACTION
  HISTORY / CHANGES
  VERIFY
  VALIDATE
  PREVIEW
  EXPORT CAPSULE

Remember:
  supported != authorized
  SEARCH score != confidence
  search miss != absence
  VERIFY != trust
  VERIFY != VALIDATE
  VALIDATE != PREVIEW
  PREVIEW != commit
  historical inspection obeys current Governance
```

---

# 325. 常见模式 — 人员概念接地 (Common Pattern — Ground a Person)

```text
SEARCH CONCEPT "Alice Chen"
WITH TYPE "Person"
MODE "hybrid"
THRESHOLD 0.7
LIMIT 10
```

然后在 KQL 中使用返回的精确 ID。

---

# 326. 常见模式 — 理解谓词定义 (Common Pattern — Understand a Predicate)

```text
DESCRIBE PREDICATE "timezone"
```

然后使用返回的精确 `predicate_ref`。

---

# 327. 常见模式 — 确定查询能力 (Common Pattern — Determine Query Capability)

```text
DESCRIBE CAPABILITIES
```

Check:

```text
belief_slot
historical_reads
projection_ledger
```

在生成高级 KQL 之前进行检查。

---

# 328. 常见模式 — 高影响变更前的安全 KML 演练 (Common Pattern — Safe KML Before High-Impact Mutation)

```text
PREVIEW KML :command
```

Inspect:

```text
resolved schema
matched targets
required authority
predicted writes
warnings
```

随后在适当时提交受保护的变更操作。

---

# 329. 常见模式 — 恢复丢失的写入响应 (Common Pattern — Recover Lost Write Response)

```text
DESCRIBE TRANSACTION
BY IDEMPOTENCY KEY :key
```

If committed:

```text
reuse Receipt
```

不要重新创建该事件。

---

# 330. 常见模式 — 审计信念修正轨迹 (Common Pattern — Audit Belief Correction)

```text
HISTORY ELEMENT :old_assertion
```

Then:

```text
KQL AS OF old seq
KQL current
```

以对比历史与当前的认知状态。

---

# 331. 常见模式 — 副本消费者数据同步 (Common Pattern — Replication Consumer)

```text
CHANGES SINCE :cursor
LIMIT 100
```

Process each envelope atomically and deduplicate by:

```text
tx_id / space_seq.
```

---

# 332. 常见模式 — 检查认知胶囊 (Common Pattern — Inspect Capsule)

```text
DESCRIBE CAPSULE :artifact
VERIFY CAPSULE :artifact
VALIDATE CAPSULE :artifact
PREVIEW IMPORT CAPSULE :artifact INTO :space
```

每个阶段回答一个不同的问题。

---

# 333. 常见模式 — 导出记忆包 (Common Pattern — Export a Memory Bundle)

```text
EXPORT CAPSULE ?exp
WHERE {
  ?exp {id: :experience_id}
}
WITH {
  closure: "referential",
  provenance_depth: 3,
  include_schema: true
}
```

输出记录单个源快照。

---

# 334. 常见反模式 — 将搜索结果视为事实真理 (Common Anti-Pattern — Search as Truth)

错误做法 (Bad)：

```text
top SEARCH result
→ answer as fact.
```

正确做法 (Correct)：

```text
SEARCH
→ ground exact record/entity
→ BELIEF / KQL
→ answer.
```

---

# 335. 常见反模式 — 将搜索未命中视为不存在 (Common Anti-Pattern — Search Miss as Nonexistence)

错误做法 (Bad)：

```text
SEARCH returns none
→ memory absent.
```

正确做法 (Correct)：

```text
check index freshness
use exact KQL when correctness matters.
```

---

# 336. 常见反模式 — 将有效签名视为事实真理 (Common Anti-Pattern — Valid Signature as Truth)

错误做法 (Bad)：

```text
VERIFY CAPSULE succeeds
→ believe all Assertions.
```

正确做法 (Correct)：

```text
verify integrity
validate structure
import under local Governance
project belief under local Epistemic Policy.
```

---

# 337. 常见反模式 — 将有效 Schema 视为活动 Schema (Common Anti-Pattern — Valid Schema as Active Schema)

错误做法 (Bad)：

```text
VERIFY/VALIDATE Package
→ use it as active.
```

正确做法 (Correct)：

```text
Schema activation requires manage_schema.
```

---

# 338. 常见反模式 — 将预览视为提交承诺 (Common Anti-Pattern — Preview as Commit Promise)

错误做法 (Bad)：

```text
PREVIEW says allowed
→ assume future commit cannot fail.
```

正确做法 (Correct)：

```text
commit revalidates current state/authority.
```

---

# 339. 常见反模式 — 将系统能力视为调用权限 (Common Anti-Pattern — Capabilities as Permissions)

错误做法 (Bad)：

```text
purge supported
→ caller may purge.
```

正确做法 (Correct)：

```text
supported = implementation
available = effective coarse access
actual operation still authorizes exact target.
```

---

# 340. 常见反模式 — 企图通过历史查询绕过当前 ACL (Common Anti-Pattern — Historical ACL Bypass)

错误做法 (Bad)：

```text
DESCRIBE SNAPSHOT before secret classification
→ reveal old bytes.
```

正确做法 (Correct)：

```text
current Governance controls historical visibility.
```

---

# 341. 常见反模式 — 将 Domain 视为安全权威 (Common Anti-Pattern — Domain as Authority)

错误做法 (Bad)：

```text
Primer Domain/Topic Map says Public
→ bypass Governance.
```

正确做法 (Correct)：

```text
Domain is semantic navigation unless protected policy explicitly says otherwise.
```

---

# 342. 常见反模式 — 将访问自省作为机密嗅探预言机 (Common Anti-Pattern — Detailed Access Oracle)

错误做法 (Bad)：

```text
loop DESCRIBE ACCESS over guessed IDs
→ enumerate secrets.
```

正确做法 (Correct)：

```text
existence-neutral authorization introspection.
```

---

# 343. META 核心不变式 (META Core Invariants)

以下是规范性的设计目标。

1. META 在认知/协议语义层面始终是只读的。
2. 只读 META 仍然受到治理策略的严格控制。
3. 自省机制本身被视为可能的潜在信息泄露通道。
4. META 绝不直接授予任何调用权限。
5. 运行时系统支持与调用主体授权属于两个不同的维度。
6. `supported` 绝不代表 `allowed`。
7. `available` 仅代表粗粒度的有效能力，而非无限制的授权范围。
8. 能力枚举本身可能会被脱敏或粗粒度隐藏。
9. `DESCRIBE PRIMER` 保持紧凑且面向大模型优化。
10. Primer 绝不是内存全量倾倒。
11. Primer 明确区分已认证的调用主体与语义自指实体 `$self`。
12. Primer 明确暴露 Schema 坐标，而非依赖系统提示词的模糊约定。
13. Primer 中的领域/主题图属于语义导航，而非安全治理边界。
14. Primer 应当包含关键的 v2 认知安全不变式。
15. 动态 Primer 状态明确标识其所关联的协议版本与快照。
16. 权威的 Schema 自省机制直接读取不可变的 Package 状态。
17. 普通认知图节点无法重新定义或篡改 Schema 自省结果。
18. 响应中的 Schema 别名始终解析为精确的规范引用。
19. 存在歧义的 Schema 符号直接报错失败，而非进行猜测。
20. Package 签名的有效性与 Package 的信任/激活状态相互分离。
21. Type/Predicate/Facet/Structural Field 自省机制暴露 KQL/KML 所需的可变性与约束。
22. 结构字段（Structural Fields）严禁被静默表示为语义谓词。
23. SEARCH 始终属于联想相关性接地，而非规范的 KQL 查询。
24. SEARCH 可以是最终一致的。
25. SEARCH 返回并声明索引新鲜度或一致性级别。
26. SEARCH 未命中绝不能证明对象在客观上不存在。
27. SEARCH 评分仅代表瞬态检索相关性。
28. SEARCH 评分绝不是断言的置信度。
29. SEARCH 评分绝不是认识论信念。
30. SEARCH 评分绝不是信任度。
31. SEARCH 评分绝不是记忆强度。
32. SEARCH 排序在产生用户可见的排名/评分效果前先行应用治理过滤。
33. 隐藏的候选对象绝不通过排名、计数或摘要片段发生泄露。
34. SEARCH 返回精确的 ID/Schema 引用，供后续结构化使用。
35. 复杂的逻辑过滤属于 KQL 的职责，而非 SEARCH。
36. 历史 SEARCH 属于可选能力，若支持则必须是真实的历史索引。
37. 当前索引严禁伪装为历史索引。
38. `DESCRIBE CAPABILITIES` 是 KIP 特性支持的核心协商接口。
39. 系统能力除了布尔值外还包含具体的配额限制。
40. 扩展能力具备命名空间与版本感知。
41. 事务查找属于只读的 META/运行时自省操作。
42. `unknown` 事务执行结果绝不等同于 `aborted`。
43. 模糊写入结果的恢复必须使用事务/幂等键查找机制。
44. 提交记录始终是不可变的引擎历史。
45. HISTORY 解释状态转换轨迹；KQL AS OF 重构历史认知内容。
46. 当前治理策略严格控制历史 META 的可见性。
47. 历史查询严禁绕过当前的机密安全策略。
48. 变更流严格保留事务信封的原子边界。
49. 变更流投递可能为至少一次。
50. 变更重放绝不是全新的认知经验。
51. 消费者基于 `tx_id` / `space_seq` 对变更信封进行去重。
52. 变更流游标与 KQL/SEARCH 游标相互独立。
53. 游标类型严禁混用或互换。
54. 快照令牌是一个状态坐标，而非权限凭证。
55. 快照令牌是不透明的。
56. VERIFY 代表完整性/密码学证明验证，而非信任判断。
57. VERIFY 不能确立语义真实性。
58. VALIDATE 代表结构/协议/Schema 的合法性检查，而非真理判定。
59. VALIDATE 绝不预留系统状态。
60. VALIDATE 不能对未来的提交成功做出硬性保证。
61. PREVIEW 代表目标端/上下文模拟，而非产生状态变更。
62. PREVIEW 默认不预留 ID、client_key 或版本号。
63. PREVIEW 不创建变更信封。
64. PREVIEW 不激活 Schema。
65. PREVIEW 不提升调用权限。
66. 仅用于校验的 Schema 加载绝不激活相关包。
67. 胶囊描述明确区分声明字段与已验证字段。
68. 胶囊验证绝不触发自动的外部网络拉取。
69. 胶囊校验绝不盲目信任发送者。
70. 胶囊导入预览因具体目标端而异。
71. 胶囊导入预览严格保护隐藏的本地实体身份。
72. `EXPORT CAPSULE` 属于读取/导出操作，但可能需要比普通读取更高的权限。
73. 导出具备快照一致性。
74. 导出治理在序列化与计数之前先行过滤。
75. 原生胶囊是一个自包含工件，而非可执行的 KML 脚本。
76. Schema 包验证不会安装或激活该包。
77. 导入计划不是授权令牌。
78. META 可以在不暴露私有信任解析器内部细节的前提下公开投影契约。
79. 访问自省绝不能沦为机密资源的存在性预言机。
80. 调用主体 ↔ actor 绑定细节受治理策略保护。
81. 规范化的命令/查询形式对审计极为有用，但其本身并不直接执行。
82. 查询计划解释绝不是认识论解释。
83. 除非显式预留，否则资源预估仅供参考。
84. Dry-run/预览严禁修改任何规范认知状态。
85. 对预览/拒绝的安全审计与认知层状态变更完全解耦。
86. META 集合分页严格服从当前治理策略。
87. 游标不会保留已被吊销的权限。
88. META 错误应当清晰区分验证、校验和预览失败类别。
89. 存在性敏感的错误可以使用等价于 not-found 的响应。
90. 错误提示支持智能体自我修正，但绝不直接授予权限。
91. KIP 1.x 的 DESCRIBE/SEARCH 概念在体系中清晰可辨。
92. KIP 1.x 的 `_score` 转变为响应级别的检索上下文。
93. KIP 1.x 图定义的 Schema 转变为基于 Package 的自省机制。
94. KIP 1.x 的 EXPORT 转变为原生的认知胶囊导出。
95. 旧版导出作为可选的兼容机制保留，而非原生可移植语义。
96. 应当始终提供专用的只读执行通道。
97. 只读执行通道必须坚决拒绝具备提交能力的 KML。
98. META 应当通过暴露精确的语义坐标来减少幻觉性的协议使用。
99. META 应当使运行时不确定性显式化，而非进行静默猜测。
100. 一个自描述的大脑，必须能够像描述其内容一样清晰地描述其边界。

---

# 344. 形式化命令轮廓 (Formal Command Sketch)

参考性说明 (Non-normative)：

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

describe_statement :=
    "DESCRIBE" describe_target describe_args?

describe_target :=
      "PRIMER"
    | "PROTOCOL"
    | "EXECUTION CONTEXT"
    | "CAPABILITIES"
    | "SPACE"
    | "SCHEMA ENVIRONMENT"
    | "PACKAGE"
    | "TYPE"
    | "PREDICATE"
    | "FACET"
    | "STRUCTURAL FIELD"
    | "COMPATIBILITY"
    | "ERROR"
    | "TRANSACTION"
    | "SNAPSHOT"
    | "EPISTEMIC POLICY"
    | "PROJECTION CAPABILITY"
    | "TRUST"
    | "ACCESS"
    | "CAPSULE"

list_statement :=
    "LIST" list_target list_options?

list_target :=
      "SPACES"
    | "SCHEMA PACKAGES"
    | "TYPES"
    | "PREDICATES"
    | "FACETS"
    | "STRUCTURAL FIELDS"
    | "EPISTEMIC POLICIES"
    | "DEPENDENTS"
        (* LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c]，
           见规范 §63.5：沿 Activity inputs → outputs 的有界反向溯源闭包 *)

search_statement :=
    "SEARCH" search_kind value
    search_options?

search_kind :=
      "CONCEPT"
    | "PROPOSITION"
    | "ASSERTION"
    | "EVIDENCE"
    | "ACTIVITY"
    | "COGNITION"

verify_statement :=
    "VERIFY" verify_target artifact_ref

verify_target :=
      "CAPSULE"
    | "SCHEMA PACKAGE"
    | "RECEIPT"
    | "BLOB"
    | "CHECKPOINT"

validate_statement :=
    "VALIDATE" validate_target validation_input

validate_target :=
      "KQL"
    | "KML"
    | "CAPSULE"
    | "SCHEMA PACKAGE"
    | "IMPORT PLAN"

preview_statement :=
    "PREVIEW" preview_target preview_input

preview_target :=
      "KML"
    | "IMPORT CAPSULE"
    (* reserved, not 2.0 syntax: "MERGE" | "PURGE" | "SCHEMA MIGRATION" *)

history_statement :=
      "HISTORY ELEMENT" element_ref history_options?
    | "HISTORY SPACE" history_options?

changes_statement :=
    "CHANGES" changes_position changes_options?

snapshot_statement :=
    "SNAPSHOT" snapshot_selector?

export_capsule_statement :=
    "EXPORT CAPSULE" selection
    export_options?
```

具体的工件/请求参数语法仍然取决于传输层协议。

---

# 345. 推荐响应语义 (Recommended Response Semantics)

所有 META 响应应当使不确定的维度显式化。

当存在多种含义时，推荐使用：

```json
{
  "verified": true,
  "trusted": "unknown",
  "validated": false,
  "reason": "missing schema dependency"
}
```

而不是简化的：

```json
{
  "ok": true
}
```

---

# 346. 五个截然不同的问题 (Five Distinct Questions)

```text
1. What is this?
2. Is it authentic/intact?
3. Is it structurally valid?
4. Would it be accepted here?
5. Did it actually commit?
```

分别对应：

```text
DESCRIBE / SEARCH
VERIFY
VALIDATE
PREVIEW
TRANSACTION RECEIPT
```

---

# 347. META 与智能体幻觉 (META and Agent Hallucination)

许多智能体在协议交互中的失败并非推理能力缺陷。

而是坐标迷失：

```text
invented field
wrong type
wrong predicate
wrong Space
wrong ID
wrong actor
unsupported capability
stale search result
unavailable history
```

META 的存在正是为了将这些隐式假设转化为可检查的确切状态。

---

# 348. META 与认知谦逊 (META and Cognitive Humility)

一个优秀的大脑应当具备清晰表达不确定性的能力：

```text
I don't know what this type means.
I cannot resolve that alias.
My search index is behind by two commits.
I cannot see that history.
This signature is valid but the signer is untrusted.
This Capsule is valid but conflicts with local identity.
This preview succeeded but commit is not guaranteed.
This transaction outcome is unknown.
```

这些是协议层面对不确定性的规范表达，而不是系统故障。

---

# 349. 与 KQL 的关系 (Relationship to KQL)

KQL 消费 META 的输出：

```text
SEARCH result ID
exact Schema ref
snapshot
capability
```

以构建合法的结构化查询。

META 并不替代：

```text
FIND
BELIEF
BELIEF SLOT
AS OF
```

---

# 350. 与 KML 的关系 (Relationship to KML)

KML 消费 META 的输出：

```text
exact schema
field mutability
Structural Field definition
actor binding summary
effective capability
version/precondition state
preview result
```

以构建安全的变更事务。

---

# 351. 与认识论模型的关系 (Relationship to Epistemic Model)

META 可以自省：

```text
Projection capability
policy contract
explanation levels
```

但认识论投影本身始终属于 KQL/BELIEF 的范畴。

---

# 352. 与治理模型的关系 (Relationship to Governance)

META 服从于以下权限：

```text
discover
read
search
project
audit
history
export
```

以及专门的治理可见性规则。

它无法修改任何权限配置。

---

# 353. 与 Schema 包的关系 (Relationship to Schema Packages)

META 是不可变 Schema 包面向模型的主要投影层。

```text
Package Artifact
    ↓
META DESCRIBE
    ↓
LLM-readable schema contract
```

---

# 354. 与事务模型的关系 (Relationship to Transactions)

META 公开：

```text
snapshot coordinate
Transaction status
Receipt
Commit history
Change Stream
```

而事务运行时负责保障原子性。

---

# 355. 与认知胶囊的关系 (Relationship to Capsule)

META 负责管理胶囊生命周期的读取侧操作：

```text
EXPORT
DESCRIBE
VERIFY
VALIDATE
PREVIEW
```

变更侧的物理导入始终受到严格保护。

---

# 356. 与 Anda Brain 的关系 (Relationship to Anda Brain)

Anda Brain 可以将 META 作为认知的**定向反射 (orientation reflex)**：

```text
wake
    ↓
understand current Brain context
    ↓
ground entities/schema
    ↓
recall
    ↓
act/learn
    ↓
inspect receipts/history
```

---

# 357. META 作为大脑的"本体感觉" (META as the Brain's "Proprioception")

一个形象的比喻：

```text
KQL
    perception of remembered content

KML
    controlled modification of memory

META
    proprioception of the memory system itself
```

META 告知智能体：

```text
where it is
what semantic coordinate system it is using
what interfaces are available
how fresh its retrieval substrate is
what historical coordinate it is inspecting
```

---

# 358. 最终整体架构 (Final Architecture)

```text
                        Agent
                          │
                          ▼
                  DESCRIBE PRIMER
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
      Protocol/Schema   Context     Capabilities
            │             │             │
            └─────────────┼─────────────┘
                          ▼
                        SEARCH
                   associative grounding
                          │
                          ▼
                   exact IDs / refs
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
             KQL                     KML
        read / BELIEF             mutation intent
              │                       │
              │                   VALIDATE /
              │                    PREVIEW
              │                       │
              └───────────┬───────────┘
                          ▼
                  Cognitive Nexus
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
         Snapshot     Transaction    Capsule
             │            │            │
             ▼            ▼            ▼
         DESCRIBE       HISTORY      DESCRIBE
         SNAPSHOT       CHANGES      VERIFY
                        RECEIPT      VALIDATE
                                     PREVIEW
```

---

# 359. META 核心等式 (Core META Equations)

```text
DESCRIBE
    =
    Understand Coordinates
```

```text
SEARCH
    =
    Ground by Relevance
```

```text
VERIFY
    =
    Check Integrity / Proof
```

```text
VALIDATE
    =
    Check Legality / Structure
```

```text
PREVIEW
    =
    Simulate Local Effect
```

```text
RECEIPT
    =
    Establish Committed Outcome
```

---

```text
Supported
    ≠
Authorized
```

---

```text
Search Match
    ≠
Fact
```

---

```text
Search Miss
    ≠
Absence
```

---

```text
Valid Signature
    ≠
Trusted Source
```

---

```text
Valid Artifact
    ≠
Safe Import
```

---

```text
Successful Preview
    ≠
Successful Future Commit
```

---

```text
Historical State
    ≠
Historical Access Authority
```

---

# 360. 终极设计原则 (Final Principle)

一个持久化的智能体大脑（Agent Brain）绝不能依赖模型去死记硬背每一条协议规则、每一个活动 Schema 版本、每一项系统能力、每一种身份绑定、每一道历史留存边界或每一项具体实现的配额限制。

这些要素属于环境本身。

环境必须是可自省的。

一个成熟的认知中枢（Cognitive Nexus）应当赋能智能体在采取行动之前，能够主动提问：

> 我当前以何种身份通过认证？

> 我正在哪个大脑/空间中执行操作？

> 我被允许代表哪位语义 actor？

> 当前活跃的 KIP/KQL/KML/META 版本是什么？

> 该运行时在技术上能够支持哪些操作？

> 我在此处究竟可以使用哪些功能？

> 是哪些精确的 Schema 包定义了我的语义词汇表？

> 该 Type、Predicate、Facet 或 Structural Field 的确切含义是什么？

> 我即将使用的局部名称是否存在歧义？

> 这个自然语言请求大概率指向哪一个 "Alice"？

> 为我提供该结果的搜索索引新鲜度如何？

> 我当前看到的是一条规范记录，还是仅仅是一条联想命中？

> 我正在读取哪个认知快照？

> 究竟是哪笔事务提交了我之前的写入操作？

> 刚刚的网络故障是发生在提交之前还是提交之后？

> 哪些事务修改了这份记忆？

> 我能否安全地恢复变更流的消费？

> 该认知胶囊仅仅是可解析、密码学已验证、结构合法，还是真正可以安全导入此处？

> 一项导入操作是否会合并实体身份、产生重复数据、隔离某个技能，还是需要人工审批？

> 该 Schema 包是否已签名、有效、受信、处于活动状态，还是仅仅可用？

> 某次预览成功后，后续是否可能因权限或状态变更而导致最终提交失败？

> 某个看似不存在的记录，是否实际上仅仅因为我缺乏发现权限或索引滞后而处于未知状态？

这些问题的答案绝不应仅存在于静态文档或系统提示词（System Prompts）中。

它们必须能够直接从认知中枢本身进行查询。

其核心指导思想是：

> **一个真正自描述的大脑，不仅能够暴露它所知道的内容；更能暴露运用这些知识所必需的坐标、能力、溯源、边界与不确定性。**

META 2.0 正是构筑这一自描述能力的核心协议层。
