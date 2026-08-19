# KIP 2.0 协议运行时 (Protocol Runtime)

**[English](./KIP-2.0-Protocol-Runtime.md) | [中文](./KIP-2.0-Protocol-Runtime_CN.md)**

## 规范状态 (Status)

**协议运行时提案 / 前规范草案 (Protocol Runtime Proposal / Pre-Specification Draft)**

本文档定义了 KIP 2.0 的执行与连线级运行时契约：即 KQL、KML、META、事务（Transactions）、快照（snapshots）、参数（parameters）、工件（artifacts）、流式结果（streaming results）、收据（receipts）、错误（errors）、身份认证上下文（authentication context）以及能力协商（capability negotiation）如何在智能体（Agent）与认知中枢（Cognitive Nexus）之间传递。

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
- [KIP-2.0-META.md](KIP-2.0-META.md)

KIP 1.x 提供了一个刻意保持简化的交互模型：

```text
execute_kip
execute_kip_readonly
command | commands[]
parameters
dry_run
JSON response
```

这种简洁性应当予以保留。

然而，KIP 2.0 拥有更强有力的语义，运行时必须将其显式化：

```text
原始读取 vs 认识论投影 (raw read vs epistemic projection)
只读 vs 状态变更执行 (readonly vs state-changing execution)
批处理 vs 事务 (batch vs transaction)
当前快照 vs 固定快照 (current snapshot vs pinned snapshot)
传输重试 vs 逻辑写入重试 (transport retry vs logical write retry)
请求标识 vs 事务标识 (request identity vs transaction identity)
模式别名 vs 精确语义标识 (Schema alias vs exact semantic identity)
内联值 vs 工件引用 (inline value vs artifact reference)
流式交付 vs 逻辑结果 (stream delivery vs logical result)
超时 vs 明确中止 (timeout vs known abort)
校验 vs 预览 vs 提交 (validation vs preview vs commit)
源执行者 vs 认证主体 (source actor vs authenticated Principal)
```

因此，运行时绝不仅仅是围绕解析器的 API 包装层。

它是将智能体生成的命令转化为以下特征交互的协议边界：

```text
已绑定 (bound)
已认证 (authenticated)
已治理 (governed)
模式已解析 (schema-resolved)
快照一致 (snapshot-consistent)
幂等 (idempotent)
可审计 (auditable)
传输安全 (transport-safe)
```

与认知中枢进行交互。

其核心论题是：

> **KIP 连线协议应当使执行语义足够清晰可见，以便智能体能够明确获知：读取了什么、尝试了什么、提交了什么，以及在传输失败后仍存在哪些不确定性。**

---

# 0. 规范性用词定义 (Normative Language)

关键字 **必须 (MUST)**、**严禁 (MUST NOT)**、**必需 (REQUIRED)**、**应当 (SHOULD)**、**不得 (SHOULD NOT)**、**可以 (MAY)** 和 **可选 (OPTIONAL)** 用于指示 KIP 2.0 规范 (`../KIP-2.0-SPECIFICATION.md`) 中的协议要求；两者不一致时以该规范为准。

此处展示的 JSON 字段名称是提议的基准连线表示。

未来的正式规范可以在保留语义区分和不变式的前提下细化字段命名。

---

# 1. 运行时范围 (Runtime Scope)

协议运行时定义了以下内容：

```text
请求信封 (request envelopes)
响应信封 (response envelopes)
操作分类 (operation classification)
批处理执行模式 (batch execution modes)
事务调用 (transaction invocation)
参数绑定 (parameter binding)
快照绑定 (snapshot binding)
幂等性 (idempotency)
截止时间 / 取消 (deadlines/cancellation)
身份认证上下文 (authentication context)
空间解析 (Space resolution)
工件句柄 (artifact handles)
流式传输 (streaming)
分页 / 游标 (pagination/cursors)
收据 (receipts)
错误传播 (error propagation)
能力握手 (capability handshake)
兼容性协商 (compatibility negotiation)
```

---

# 2. 运行时非目标 (Runtime Non-Goals)

协议运行时不定义以下内容：

```text
数据库引擎 (database engine)
存储布局 (storage layout)
MVCC 实现 (MVCC implementation)
向量索引实现 (vector index implementation)
加密密钥管理后端 (cryptographic key-management backend)
HTTP 服务器框架 (HTTP server framework)
MCP 服务器框架 (MCP server framework)
LLM 编排框架 (LLM orchestration framework)
外部行动执行 (external action execution)
模式创作语言 (Schema authoring language)
治理策略语言 (Governance policy language)
```

它定义的是可观测的协议语义。

---

# 3. 传输层无关性 (Transport Independence)

KIP 2.0 保持传输层中立。

相同的逻辑请求可以通过以下通道承载：

```text
本地函数调用 (local function call)
MCP
HTTP
WebSocket
Unix/域套接字 (Unix/domain socket)
IPC (进程间通信)
Canister 调用 (canister call)
消息队列 (message queue)
嵌入式库 API (embedded library API)
```

特定传输层的身份认证、帧封装、压缩和连接生命周期可以有所不同。

---

# 4. 逻辑协议与传输层 (Logical Protocol vs. Transport)

在概念上：

```text
KIP 操作 (KIP Operation)
    ↓
协议运行时信封 (Protocol Runtime Envelope)
    ↓
传输层绑定 (Transport Binding)
    ↓
已认证的中枢运行时 (Authenticated Nexus Runtime)
```

KIP 语义含义存在于传输层之上。

---

# 5. 基准序列化 (Baseline Serialization)

基准逻辑连线表示 **应当 (SHOULD)** 为 JSON。

原因包括：

```text
LLM / 工具友好性 (LLM/tool friendliness)
可调试性 (debuggability)
广泛的编程语言支持 (wide language support)
便捷的参数绑定 (easy parameter binding)
互操作性 (interoperability)
```

二进制绑定（如规范 CBOR）**可以 (MAY)** 在后续进行标准化。

---

# 6. 传输 JSON 不等同于胶囊规范 JSON (Wire JSON Is Not Capsule Canonical JSON)

KIP 请求/响应 JSON 是一种交互格式。

认知胶囊（Cognitive Capsule）规范 JSON 是一种确定性工件格式，用于：

```text
哈希计算 (hashing)
签名验证 (signing)
便携式标识 (portable identity)
```

普通的请求 JSON 无需使用胶囊规范化 Profile，除非请求摘要需要规范化语义。

---

# 7. 顶级请求信封 (Top-Level Request Envelope)

推荐的基准结构：

```json
{
  "kip": "2.0",

  "request_id": "req-...",

  "space": {
    "id": "space-1"
  },

  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  },

  "operations": [
    {
      "op_id": "op-1",
      "command": "DESCRIBE PRIMER",
      "parameters": {}
    }
  ],

  "context": {
    "purpose": "answer_user",
    "risk": "low"
  },

  "options": {
    "deadline_ms": 10000
  }
}
```

并非每个字段都是必需的。

信封还 **可以 (MAY)** 携带摄入上下文 (ingestion context)，使被观测的源材料直接从传输信封进入
Evidence，而不是在模型生成的命令文本中被重新誊写：

```json
{
  "ingest": {
    "evidence": [
      {
        "key": "msg",
        "evidence_class": "user_statement",
        "payload": "I prefer dark mode.",
        "media_type": "text/plain",
        "observed_at": "2026-08-14T01:00:00Z",
        "source_actor": "alice",
        "client_key": "message:msg-123"
      }
    ]
  }
}
```

每个条目在该请求的事务范围内铸造 (mint) 一个 Evidence 元素，并将其 `key` 绑定为请求参数，
参数值即所铸造 Evidence 的引用，因此命令以 `:msg` 引用它（例如 `evidence: :msg`）。每个条目
**必须 (MUST)** 且只能声明 `payload` / `payload_artifact` 之一；运行时 **必须 (MUST)** 原样保留
所提供的载荷，严禁由模型改写；`source_actor` 仅记录为 Evidence 来源，绝不作为 Principal 身份；
摄入是事务性的：如果事务中止，则不会持久创建任何 Evidence。

---

# 8. 最小化请求 (Minimal Request)

最简单的逻辑请求形式可以是：

```json
{
  "kip": "2.0",
  "operations": [
    {
      "command": "DESCRIBE PRIMER"
    }
  ]
}
```

运行时自动解析：

```text
已认证的主体 (authenticated Principal)
默认空间 (若存在唯一且允许的默认空间)
执行默认值 (execution defaults)
当前快照 (current snapshot)
模式环境 (Schema Environment)
```

---

# 9. 协议版本 `kip` (`kip`)

`kip` 声明所请求的协议主/次版本 Profile。

推荐值：

```text
"2.0"
```

运行时可以协商兼容的次版本号。

主版本号不匹配 **应当 (SHOULD)** 显式报错失败。

---

# 10. 版本协商 (Version Negotiation)

客户端 **应当 (SHOULD)** 通过以下方式获知受支持的版本：

```text
DESCRIBE PROTOCOL
```

或通过传输层握手。

客户端 **不得 (SHOULD NOT)** 仅仅因为存在相似的命令词而猜测 v1 运行时能接受 v2 语义。

---

# 11. 请求标识 `request_id` (`request_id`)

`request_id` 标识客户端可见的单次传输/执行尝试。

它适用于：

```text
日志记录 (logging)
链路追踪 (tracing)
关联性分析 (correlation)
支持 / 调试 (support/debugging)
数据流关联 (stream association)
```

---

# 12. 请求 ID 不等同于幂等性键 (Request ID Is Not Idempotency)

此规则为规范性要求：

```text
request_id
    ≠
idempotency_key
```

调用方可以使用新的传输请求 ID 重试某次逻辑变更，同时复用相同的幂等性键。

---

# 13. 请求 ID 不等同于事务 ID (Request ID Is Not Transaction ID)

```text
request_id
    客户端 / 请求关联标识 (client/request correlation)

tx_id
    引擎分配的事务标识 (engine-assigned transaction identity)
```

客户端 **严禁 (MUST NOT)** 伪造已提交的 `tx_id`。

---

# 14. 请求 ID 唯一性 (Request ID Uniqueness)

客户端 **应当 (SHOULD)** 生成在其操作追踪范围内足够唯一的请求 ID。

认知中枢 **可以 (MAY)** 在一个较短的活动时间窗口内拒绝重复的请求 ID 以防止流歧义，但请求 ID 并不是持久化的重放防护机制。

---

# 15. 空间选择 (Space Selection)

除非显式支持的跨空间操作另有说明，每个认知操作都解析至一个主属 MemorySpace（记忆空间）。

推荐形式：

```json
{
  "space": {
    "id": "space-1"
  }
}
```

或者：

```json
{
  "space": {
    "uri": "personal://yan"
  }
}
```

---

# 16. 空间解析 (Space Resolution)

若同时提供了 `id` 与 `uri`：

```text
它们必须解析至同一个已授权的空间 (they MUST resolve to the same authorized Space)
```

否则请求失败。

---

# 17. 默认空间 (Default Space)

会话 / 运行时 **可以 (MAY)** 定义一个明确无歧义的默认空间。

如果存在多个候选空间且无法安全做出显式选择：

```text
InvalidRequestEnvelope
```

返回显式的请求信封错误优于盲目猜测。

---

# 18. 上下文不能选择空间 (Context Does Not Select Space)

以下字段：

```text
counterparty (交易方 / 对方)
agent (智能体)
topic (主题)
source (来源)
purpose (意图)
```

**严禁 (MUST NOT)** 静默改变 MemorySpace。

空间是治理边界（Governance boundary），而非对话上下文提示。

---

# 19. 跨空间请求 (Cross-Space Requests)

KIP 2.0 基准执行是空间局部的（Space-local）。

跨空间联邦或跨空间原子性属于可选能力。

请求 **严禁 (MUST NOT)** 仅因为某个 Concept 或 Capsule 包含外部引用就静默遍历或修改另一个空间。

---

# 20. 身份认证为带外受信任上下文 (Authentication Is Out-of-Band Trusted Context)

已认证的主体（Principal）由传输层 / 运行时建立：

```text
OAuth / 会话 (OAuth/session)
签名请求 (signed request)
mTLS (双向 TLS)
Canister 调用方身份 (canister caller)
本地进程身份 (local process identity)
MCP 连接身份 (MCP connection identity)
```

或等效机制。

---

# 21. 主体 ID 不信任请求体输入 (Principal ID Is Not Trusted from Request Body)

调用方提供的：

```json
{
  "principal_id": "admin"
}
```

**严禁 (MUST NOT)** 成为身份认证权限依据。

它最多只能被拒绝，或者被视为非权威的客户端元数据。

---

# 22. 语义执行者是不同的概念 (Semantic Actor Is Different)

KML 中可以包含：

```text
asserted_by
experienced_by
associated_actor
```

这些属于语义执行者（Semantic Actor）引用。

治理策略决定已认证的主体（Principal）是否可以：

```text
记录归属 (record attribution)
或
以此执行者身份行动 (act as that actor)。
```

---

# 23. 委托上下文 (Delegation Context)

委托 / ActorBinding 凭据由治理层 / 运行时进行验证。

在传输设计允许的情况下，请求可以引用已有的：

```text
委托令牌 / 绑定句柄 (delegation token / binding handle)
```

调用方不能通过普通 JSON 任意自行构建有效的作用域。

---

# 24. 请求上下文 (Request Context)

推荐的非权威 / 请求意图字段：

```json
{
  "context": {
    "purpose": "answer_user",
    "risk": "low",
    "locale": "zh-CN",
    "client": "anda-brain"
  }
}
```

---

# 25. 意图声明不赋予权限 (Purpose Does Not Grant Authority)

请求中声明：

```text
purpose = audit
```

并不会直接获得审计权限。

治理策略可以将声明的意图用作应用更严格安全策略的输入之一。

---

# 26. 风险声明不赋予权限 (Risk Does Not Grant Authority)

请求中声明：

```text
risk = high
```

可能会提高认识论门槛要求。

但 **严禁 (MUST NOT)** 凭此提升数据访问权限。

---

# 27. 客户端元数据 (Client Metadata)

`client` / `locale` 可以指导：

```text
结果渲染 (rendering)
遥测统计 (telemetry)
Primer 引导格式 (Primer format)
错误提示信息 (error hints)
```

它们不是受信任的身份凭证。

---

# 28. 操作对象 (Operation Object)

推荐形式：

```json
{
  "op_id": "op-1",
  "language": "META",
  "command": "DESCRIBE PRIMER",
  "parameters": {}
}
```

---

# 29. 操作标识 `op_id` (`op_id`)

`op_id` 标识请求内部的单个操作。

它属于请求局部标识（request-local）。

它适用于：

```text
结果映射 (result mapping)
流式帧标识 (stream frames)
原子回滚诊断 (atomic rollback diagnostics)
链路追踪 (tracing)
```

---

# 30. 操作 ID 不是持久化标识 (Operation ID Is Not Durable Identity)

`op_id` 不会成为：

```text
元素 ID (element ID)
事务 ID (transaction ID)
客户端键 (client_key)
幂等性键 (idempotency key)
```

---

# 31. 语言标识 `language` (`language`)

推荐的可选值：

```text
KQL
KML
META
```

兼容性运行时也可以暴露：

```text
KIP1
```

或指定的命名 Profile。

---

# 32. 语言标签不是安全边界 (Language Label Is Not a Security Boundary)

引擎 **必须 (MUST)** 对实际命令进行解析与分类。

调用方不能在发送具有状态变更作用的 KML 命令时将其标注为：

```text
language = META
```

以此来绕过只读端点（readonly endpoint）。

---

# 33. 语言不匹配 (Language Mismatch)

如果提供了 `language` 但与解析出的实际语义不符：

```text
LanguageMismatch
```

返回语言不匹配错误优于直接忽略该差异。

---

# 34. 语言可被省略 (Language May Be Omitted)

引擎 **可以 (MAY)** 直接从语法中推断：

```text
KQL / KML / META
```

显式提供语言标签对校验与开发工具有益。

---

# 35. 命令文本 (Command Text)

基准操作使用：

```text
command
```

作为 KIP 文本语法。

这保留了协议的模型优先（Model-First）特性。

---

# 36. 结构化 AST 绑定 (Structured AST Binding)

运行时 **可以 (MAY)** 可选地接受：

```json
{
  "ast": {...}
}
```

以替代命令文本。

若同时提供了 `command` 与 `ast`，运行时 **必须 (MUST)** 明确定义哪一方具有权威性，或者拒绝该请求。

基准规范建议两者仅提供其一。

---

# 37. AST 绝不能演变为厂商专用语义 (AST Must Not Become Vendor-Specific Semantics)

如果将来进行标准化，AST 必须与 KIP 语言语义一一映射。

它绝不是用于承载任意后端专有指令的后门逃生通道。

---

# 38. 参数 (Parameters)

操作可以携带参数：

```json
{
  "parameters": {
    "alice_id": "C-123",
    "limit": 20,
    "now": "2026-08-14T00:00:00+08:00"
  }
}
```

---

# 39. 参数绑定是结构化的 (Parameter Binding Is Structural)

KIP 2.0 **严禁 (MUST NOT)** 将参数实现为简单的字符串文本拼接插值。

正确的概念处理流水线：

```text
解析占位符 (parse placeholder)
    ↓
绑定带类型的 JSON 值 (bind typed JSON value)
    ↓
校验语法位置 / 类型 (validate grammar position/type)
    ↓
构建规范化 AST (build normalized AST)
```

---

# 40. 为什么 (Why)

简单的文本插值会导致：

```text
语法注入 (syntax injection)
转义歧义 (escaping ambiguity)
Unicode 歧义 (Unicode ambiguity)
数值精度歧义 (numeric ambiguity)
引号混淆 (quote confusion)
```

以及不稳定的请求摘要。

---

# 41. 全位置参数规则 (Full-Position Parameter Rule)

参数占位符必须占据语法中允许的某个完整值位置。

示例：

```prolog
?person {id: :person_id}
LIMIT :limit
FOR TIME :world_time
```

---

# 42. 严禁字符串模板注入 (No String Template Injection)

非法用法：

```prolog
name: "Hello :name"
```

应当使用完整值的参数：

```text
"Hello Alice"
```

或者在 KIP 外部构建该字符串。

---

# 43. 参数值类型 (Parameter Value Types)

基准 JSON 值类型：

```text
string
number
boolean
null
array
object
```

仅在 KIP 语法 / 模式允许的位置进行绑定。

---

# 44. 数值精度安全 (Number Safety)

传输层 / 解析器必须拒绝或规范化无法安全映射至 KIP 核心字面量（Core Literal）数值语义的数值。

严禁使用：

```text
NaN
Infinity
-Infinity
```

---

# 45. 标识符参数 (Identifier Parameters)

参数仅在语法明确允许值 / 引用参数的位置才能占据模式 / ID 位置。

运行时根据预期类型校验：

```text
元素 ID (element ID)
模式引用 (Schema ref)
谓词引用 (predicate ref)
工件句柄 (artifact handle)
```

---

# 46. 参数是数据，不是代码 (Parameter Is Data, Not Code)

参数无法向命令中注入以下关键字或子句：

```text
WHERE
UPDATE
PURGE
附加子句 (additional clauses)
```

---

# 47. 共享请求参数 (Shared Request Parameters)

传输层 **可以 (MAY)** 支持由各操作继承的顶级请求参数。

推荐的优先级规则：

```text
operation.parameters (操作级参数)
    覆盖 (overrides)
request.parameters (请求级参数)
```

当命名冲突时以此生效。

---

# 48. 避免隐式参数变异 (Avoid Hidden Parameter Mutation)

参数绑定对于单次操作执行是不可变的。

前一个命令无法更改后续操作所使用的参数对象。

---

# 49. 规范化操作 (Normalized Operation)

在完成解析与绑定之后，运行时会构建一个规范化的操作表示。

它会消除无关的词法差异，例如：

```text
空白符 (whitespace)
注释 (comments)
格式排版 (formatting)
```

同时完整保留语义 Token。

---

# 50. 操作请求摘要 (Operation Request Digest)

规范化的操作 / 请求摘要 **可以 (MAY)** 基于以下内容计算：

```text
协议版本 (protocol version)
空间选择器标识 (Space selector identity)
规范化命令 AST (normalized command AST)
已绑定的参数值 (bound parameter values)
影响执行的选项 (execution-affecting options)
```

---

# 51. 传输请求摘要与语义执行计划摘要 (Wire Request Digest vs. Semantic Plan Digest)

KIP 2.0 **应当 (SHOULD)** 明确区分：

```text
request_digest
    客户端请求的原始内容 (what the client asked)

semantic_plan_digest
    运行时解析/脱糖后的语义计划 (what the runtime resolved/desugared)
```

---

# 52. 请求摘要 (Request Digest)

适用于：

```text
幂等性冲突检测 (idempotency conflict detection)
日志记录 (logging)
传输重放 (transport replay)
```

它 **应当 (SHOULD)** 在面对无关的格式变化时保持稳定。

---

# 53. 语义执行计划摘要 (Semantic Plan Digest)

在以下步骤完成后计算：

```text
模式别名解析 (Schema alias resolution)
KML 脱糖转换 (KML desugaring)
标识规范化规划 (identity canonicalization planning)
操作分类 (operation classification)
```

若适用。

它适用于高保障审计。

---

# 54. 为何需要两个摘要 (Why Two Digests)

假设：

```text
"Person"
```

是一个本地别名。

即使活动模式随后发生变化，相同请求的重试仍应通过幂等性被正确识别。

而原始已提交的收据（Receipt）则可以记录提交时所使用的精确语义执行计划。

---

# 55. 请求摘要必须包含有意义的选项 (Request Digest Must Include Meaningful Options)

改变以下内容：

```text
目标空间 (target Space)
原子性 (atomicity)
导入模式 (import mode)
标识映射 (identity mapping)
演练模式 (dry_run)
KML 参数值 (KML parameter values)
```

必须改变请求摘要。

---

# 56. 纯观测性选项 (Observational Options)

纯传输 / 渲染选项，例如：

```text
美化输出 (pretty-print)
客户端追踪标签 (client trace label)
```

**不得 (SHOULD NOT)** 改变逻辑变更的幂等性摘要。

---

# 57. 执行模式 (Execution Modes)

原生 KIP 2.0 使批处理语义显式化。

推荐模式：

```text
independent (独立模式)
sequence    (顺序模式)
atomic      (原子模式)
```

---

# 58. 为何需要显式模式 (Why Explicit Modes)

仅凭裸数组：

```text
commands[]
```

无法告知智能体：

```text
后续操作能否看到先前的写入？ (Can operations see prior writes?)
失败是否会回滚早期的写入？ (Does failure roll back earlier writes?)
引擎能否对其进行重排序？ (Can the engine reorder them?)
是否存在单一共享快照？ (Does one shared snapshot exist?)
```

运行时必须对此明确说明。

---

# 59. 独立执行模式 `independent` (`independent`)

示例：

```json
{
  "execution": {
    "mode": "independent"
  }
}
```

含义：

```text
每个操作在逻辑上相互独立 (each operation is logically independent)
每个操作获取自己的执行上下文/事务 (each operation obtains its own execution context/transaction)
任何操作均不可依赖其他操作的结果 (no operation may depend on another operation's result)
运行时可以并发执行各操作 (the runtime MAY execute operations concurrently)
```

---

# 60. 独立读取操作 (Independent Read Operations)

非常适用于：

```text
并行 SEARCH 探测 (parallel SEARCH probes)
并行 DESCRIBE 调用 (parallel DESCRIBE calls)
互不相关的 KQL 读取 (unrelated KQL reads)
```

---

# 61. 独立写入操作 (Independent Writes)

仅在调用方有意声明它们相互独立时才被允许。

每个状态变更操作在各自的事务中提交。

操作之间不存在全有或全无（all-or-nothing）的原子性保证。

---

# 62. 独立执行顺序 (Independent Ordering)

请求顺序并不意味着提交顺序。

响应保留 `op_id`，并且除非流式传输显式暴露完成顺序，否则 **应当 (SHOULD)** 按照请求顺序进行序列化。

---

# 63. 独立失败处理 (Independent Failure)

一个操作的失败不会自动导致另一个操作失败。

每个结果拥有独立的状态。

---

# 64. 顺序执行模式 `sequence` (`sequence`)

示例：

```json
{
  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  }
}
```

含义：

```text
操作按请求顺序依次开始 (operations begin in request order)
每个状态变更操作均为独立事务 (each state-changing operation is its own transaction)
后续操作在前一操作产生最终结果后开始 (later operations begin after earlier terminal result)
先前已提交的状态具有持久性 (earlier committed state is durable)
跨操作边界不发生回滚 (no rollback across operation boundaries)
```

---

# 65. 顺序执行可见性 (Sequence Visibility)

同一空间中的后续操作 **必须 (MUST)** 至少能够观察到先前成功的顺序操作所产生的已提交效果。

其快照还可以包含在它开始之前发生的其他不相关的并发提交。

---

# 66. 顺序模式并非单一快照 (Sequence Is Not One Snapshot)

因为每个操作分别启动：

```text
操作 1 快照 = 100
操作 1 提交 = 101

第三方并发提交 = 102

操作 2 快照可能 = 102
```

这是符合预期的。

---

# 67. 顺序模式失败处理 (Sequence Failure)

配置为：

```text
on_error = stop
```

某个操作失败会导致后续操作被标记为：

```text
skipped
```

先前已提交的事务保持已提交状态。

---

# 68. 顺序模式遇错继续 `continue` (Sequence Continue)

可选配置：

```text
on_error = continue
```

允许后续操作继续运行。

调用方接受部分成功的结果。

---

# 69. 遇错继续应当谨慎使用 (Sequence Continue Should Be Used Carefully)

它适用于：

```text
按稳定顺序执行的独立诊断读取 (independent diagnostic reads in stable order)
尽力而为的维护操作 (best-effort maintenance)
```

但绝不适用于其各组成部分必须保持一致的认知状态转换。

应使用 `atomic`。

---

# 70. 原子执行模式 `atomic` (`atomic`)

示例：

```json
{
  "execution": {
    "mode": "atomic",
    "isolation": "serializable",
    "idempotency_key": "formation:run-42"
  }
}
```

含义：

```text
所有操作均归属于同一个事务 (all operations belong to one Transaction)
单一启动快照 (one start snapshot)
读己之写 (read-your-writes)
无脏读 (no dirty reads)
全部提交或全部不提交 (all commit or none commit)
单一 tx_id (one tx_id)
单一状态变更 space_seq (one state-changing space_seq)
单一收据 (one Receipt)
```

---

# 71. 原子操作顺序 (Atomic Operation Order)

操作具有用于以下目的的逻辑请求顺序：

```text
读己之写 (read-your-writes)
对暂存状态的结果依赖 (result dependencies on tentative state)
```

即使引擎在物理层对执行进行了优化。

---

# 72. 原子模式失败处理 (Atomic Failure)

如果任何必需的操作失败：

```text
整个事务中止 (entire transaction aborts)
不产生持久化的认知部分状态 (no durable cognitive partial state)
```

---

# 73. 原子只读批处理 (Atomic Read-Only Batch)

`atomic` 模式 **可以 (MAY)** 仅包含 KQL / META 读取操作。

此时它是一个共享读取事务：

```text
单一 snapshot_seq (one snapshot_seq)
```

且不产生状态变更 `space_seq`。

---

# 74. 原子读写混合批处理 (Atomic Mixed Read/Write)

示例：

```text
KQL 读取当前技能 (KQL read current Skill)
KML 创建经验 (KML create Experience)
KQL 验证暂存经验 (KQL verify tentative Experience)
KML 更新技能效用 (KML update Skill utility)
```

若受支持，可以在单个事务中执行。

后续读取可观察到前面的暂存写入。

---

# 75. 原子模式下的 META 操作限制 (Atomic META Restrictions)

仅在事务内安全的 META 操作方可包含在内。

示例：

```text
模式描述 (Schema describe)
校验 (validation)
当前上下文 (current context)
```

可能涉及外部 / 基于索引的操作，例如：

```text
语义 SEARCH (semantic SEARCH)
远程工件验证 (remote artifact verification)
```

可能在写入事务内部被禁止，因为它们并未被事务固定锁定。

能力协商必须对此进行声明。

---

# 76. 严禁原子外部副作用 (Atomic External Side Effects Are Forbidden)

KIP 事务内部的任何操作都不能假定能够回滚以下外部行为：

```text
电子邮件 (email)
HTTP 副作用 (HTTP side effect)
资金转账 (money transfer)
部署上线 (deployment)
远程删除 (remote deletion)
```

外部行动始终处于 KIP 原子状态边界之外。

---

# 77. 遗留 `commands[]` 数组 (Legacy `commands[]`)

KIP 1 兼容性绑定 **可以 (MAY)** 将裸遗留命令数组映射为：

```text
sequence (顺序执行)
on_error = 遗留语义 (legacy semantics)
```

原生 v2 客户端 **应当 (SHOULD)** 始终显式声明执行模式。

---

# 78. 默认执行模式 (Default Execution Mode)

对于单个操作：

```text
隐式单操作执行 (implicit single-operation execution)
```

即已足够。

对于多个原生 v2 操作，运行时 **必须 (MUST)** 要求显式提供 `execution.mode` 而不是盲目猜测。

---

# 79. 遇错处理策略 `on_error` (`on_error`)

仅在具有实际意义时有效。

推荐值：

```text
stop     (停止)
continue (继续)
```

---

# 80. 原子模式忽略 `continue` (Atomic Ignores Continue)

对于：

```text
execution.mode = atomic
```

生效的失败策略为：

```text
abort (中止)
```

运行时 **应当 (SHOULD)** 拒绝：

```text
on_error = continue
```

将其视为语义自相矛盾。

---

# 81. 独立状态变更命令 (State-Changing Standalone Command)

单个 KML 操作在由 KML / 事务规范定义的单个隐式事务中运行。

---

# 82. 复合变更新建 `MUTATE` (Compound `MUTATE`)

单个 KML：

```text
MUTATE { ... }
```

本身即表示一次复合变更。

如果它出现在外部原子多操作请求内部，它会参与同一个外部事务，而不是创建嵌套的独立提交。

---

# 83. 嵌套事务语义 (Nested Transaction Semantics)

KIP 2.0 基准规范 **不得 (SHOULD NOT)** 暴露任意的嵌套提交 / 保存点语义。

原子信封内部的 `MUTATE` 会被扁平化并入外部事务执行计划中。

---

# 84. 保存点 (Savepoints)

未来的可选能力 **可以 (MAY)** 为高级维护定义保存点。

它们不属于面向智能体的基准语义。

---

# 85. 事务类别 (Transaction Class)

状态变更事务根据其包含的操作被赋予一个类别，例如：

```text
cognitive   (认知)
maintenance (维护)
import      (导入)
migration   (迁移)
governance  (治理)
schema      (模式)
mixed       (混合)
```

普通的 KML 无法自行声明获得更高特权的类别。

---

# 86. 幂等性键 (Idempotency Key)

状态变更原子 / 独立操作 **应当 (SHOULD)** 支持：

```text
idempotency_key
```

以实现重试安全的执行。

---

# 87. 幂等性键作用域 (Idempotency Key Scope)

推荐的逻辑作用域：

```text
认知中枢 (Nexus)
+
记忆空间 (MemorySpace)
+
已认证客户端/主体幂等性命名空间 (authenticated client/Principal idempotency namespace)
+
键值 (key)
```

精确的多租户作用域属于实现细节，但 **必须 (MUST)** 防止不相关的主体发生意外冲突。

---

# 88. 幂等性键为客户端指定的逻辑标识 (Idempotency Key Is Client-Chosen Logical Identity)

示例：

```text
conversation:893:formation:turn:12
external-job:991:outcome
capsule-import:sha256:ABC:plan:XYZ
```

它应当标识一次逻辑写入意图。

---

# 89. 相同键 + 相同请求 (Same Key + Same Request)

返回原始已知的事务结果：

```text
相同的 tx_id
相同的已提交 space_seq (若已提交)
相同的收据 (Receipt)
```

而不会重新执行该逻辑变更。

---

# 90. 相同键 + 不同请求 (Same Key + Different Request)

必须报错失败：

```text
IdempotencyConflict
```

---

# 91. 幂等性解析先于重新执行 (Idempotency Resolution Happens Before Re-Execution)

在尽可能安全的前提下，运行时应当在执行以下昂贵步骤之前检查留存的幂等性记录：

```text
解析大型工件 (parsing expensive artifacts)
执行写入 (performing writes)
分配 ID (allocating IDs)
```

---

# 92. 幂等性留存周期 (Idempotency Retention)

运行时能力 **必须 (MUST)** 暴露或说明文档化：

```text
idempotency_retention
```

因为重放安全性不能被假定为永久有效。

---

# 93. 过期的幂等性记录 (Expired Idempotency Record)

超过留存时间窗口后，相同的键可能不再能够解析出旧事务。

高保障客户端应当自行留存：

```text
tx_id
收据 (Receipt)
工件 / 源事件标识 (artifact/source event identity)
```

以实现长期去重。

---

# 94. 客户端键不等同于事务幂等性 (Client Key Is Not Transaction Idempotency)

KML `client_key` 标识单个持久化元素的创建事件。

事务幂等性标识整个逻辑请求。

两者可以配合使用。

---

# 95. 请求 ID vs. 幂等性键 vs. 事务 ID (Request ID vs. Idempotency Key vs. TX ID)

规范性区分：

```text
request_id
    单次传输/执行尝试 (one transport/execution attempt)

idempotency_key
    单次客户端逻辑变更意图 (one client logical mutation intent)

tx_id
    单次引擎事务客观事实 (one engine transaction fact)
```

---

# 96. 重试示例 (Example Retry)

尝试 1：

```text
request_id = req-1
idempotency_key = formation-42
```

服务器提交：

```text
tx_id = tx-900
space_seq = 1200
```

响应在网络中丢失。

重试：

```text
request_id = req-2
idempotency_key = formation-42
相同的请求摘要 (same request digest)
```

返回：

```text
tx-900
space_seq 1200
```

---

# 97. 重试严禁产生重复经验 (No Duplicate Experience on Retry)

重试 **严禁 (MUST NOT)**：

```text
再次创建证据 (create Evidence again)
再次创建断言 (create Assertion again)
强化记忆 (reinforce memory)
累加计数器 (increment counters)
发出第二条变更信封 (emit second Change Envelope)
```

---

# 98. 幂等性与顺序模式 (Idempotency and Sequence Mode)

因为顺序模式包含多个独立的提交边界，除非运行时定义了按操作派生的键，否则单个顶级幂等性键不足以安全地标识每个操作。

原生推荐做法：

```text
状态变更顺序操作应当携带操作级幂等性键 (state-changing sequence operations SHOULD carry per-operation idempotency keys)
```

或者请求应当改用 `atomic`。

---

# 99. 操作级幂等性字段 (Operation Idempotency Field)

推荐形式：

```json
{
  "op_id": "op-2",
  "idempotency_key": "write:2",
  "command": "..."
}
```

适用于非原子状态变更的顺序 / 独立操作。

---

# 100. 原子模式幂等性字段 (Atomic Idempotency Field)

对于原子模式，主幂等性键归属于：

```text
execution.idempotency_key
```

并覆盖整个事务请求。

---

# 101. 嵌套幂等性冲突约束 (Conflicting Nested Idempotency)

在单个原子事务内部，操作级幂等性键 **可以 (MAY)** 标识所创建的源事件，但 **严禁 (MUST NOT)** 创建可单独重放的子事务。

外部事务始终保持为唯一的提交标识。

---

# 102. 快照绑定 (Snapshot Binding)

读取语义可以绑定至：

```text
当前快照 (current snapshot)
KQL 中显式的 AS OF (explicit AS OF in KQL)
快照令牌 (snapshot token)
事务启动快照 (transaction start snapshot)
```

---

# 103. 快照令牌 (Snapshot Token)

运行时 / META 可以返回：

```text
snapshot_token
```

以实现跨请求的一致性。

推荐的请求字段：

```json
{
  "read": {
    "snapshot_token": "opaque..."
  }
}
```

---

# 104. 快照令牌是不透明的 (Snapshot Token Is Opaque)

客户端 **严禁 (MUST NOT)** 解析或修改它。

---

# 105. 快照令牌不代表访问权限 (Snapshot Token Is Not Authority)

当前的治理策略仍然控制每次读取。

---

# 106. 快照令牌作用域 (Snapshot Token Scope)

令牌 **应当 (SHOULD)** 至少绑定：

```text
认知中枢 (Nexus)
记忆空间 (Space)
快照序列号 snapshot_seq (snapshot_seq)
留存 / 过期上下文 (retention/expiry context)
```

并 **可以 (MAY)** 绑定：

```text
主体可见性类别 (Principal visibility class)
模式上下文 (Schema context)
```

---

# 107. 权限撤销优先原则 (Current Revocation Wins)

如果在令牌签发后权限被撤销：

```text
令牌无法保留原有的旧访问权限 (token does not preserve old access)
```

---

# 108. 写入事务中的快照令牌 (Snapshot Token on Write Transaction)

若受支持，写入事务 **可以 (MAY)** 使用客户端获取的快照令牌作为：

```text
请求的启动快照 / 前置条件 (requested start snapshot / precondition)
```

引擎在提交时仍然必须：

```text
重新验证治理权限 (revalidate Governance)
验证可串行化冲突 (validate serializability)
```

---

# 109. 快照令牌与期望版本 EXPECT Version (Snapshot Token vs. EXPECT Version)

快照令牌表明：

```text
我是基于哪个全局状态进行推理的 (which state I reasoned from)
```

元素 `EXPECT VERSION` 表明：

```text
该特定元素必须仍然处于版本 N (this particular element must still have version N)
```

它们互为补充。

---

# 110. 空间序列前置条件 (Space Sequence Precondition)

事务 **可以 (MAY)** 支持：

```json
{
  "preconditions": {
    "space_seq": 1500
  }
}
```

含义：

```text
自 1500 以来空间未发生任何提交 (no Space commit since 1500)
```

在支持精确语义的场景下。

---

# 111. 模式环境前置条件 (Schema Environment Precondition)

推荐形式：

```json
{
  "preconditions": {
    "schema_environment_version": 17
  }
}
```

适用于需要精确本地符号解释的客户端。

---

# 112. 强一致性读取快照 (Strong Read Snapshot)

规范的 KQL 操作读取单一内部一致的空间快照。

它 **严禁 (MUST NOT)** 混合来自部分可观察提交的版本。

---

# 113. 独立模式批处理快照 (Independent Batch Snapshots)

在 `independent` 模式下：

```text
每个操作可能观察到不同的当前快照 (each operation may observe a different current snapshot)
```

响应上下文会对各自进行标识。

---

# 114. 顺序模式批处理快照 (Sequence Batch Snapshots)

在 `sequence` 模式下：

```text
每个操作拥有单独的快照 (each operation has a separate snapshot)
其顺序排在先前成功的顺序提交之后 (ordered after prior successful sequence commit)
```

---

# 115. 原子模式批处理快照 (Atomic Batch Snapshot)

在 `atomic` 模式下：

```text
所有操作共享同一个启动快照 (all operations share one start snapshot)
+
暂存的读己之写 (tentative read-your-writes)
```

---

# 116. SEARCH 搜索快照差异 (SEARCH Snapshot Difference)

SEARCH 可能会在索引检查点（index checkpoint）而非规范空间快照上运行。

其结果必须暴露：

```text
索引序列号 / 一致性状态 (index_seq / consistency)
```

由 META 规范定义。

---

# 117. 严禁假定 SEARCH 使用事务快照 (Do Not Pretend SEARCH Uses Transaction Snapshot)

处于滞后状态的语义 / 向量索引不能仅通过放入原子信封中就被赋予可串行化能力。

如果后端无法使 SEARCH 与事务快照对齐：

```text
该原子事务内部禁止执行 SEARCH (SEARCH is disallowed inside that atomic transaction)
```

或者必须显式声明较弱的一致性语义。

---

# 118. 认识论投影快照 (Epistemic Projection Snapshot)

KQL `BELIEF` 投影基于 KQL 认知快照加上其解析出的以下要素进行求值：

```text
认识论策略 (Epistemic Policy)
世界有效时间 (world valid time)
治理视图 (Governance view)
模式上下文 (Schema context)
```

响应应当暴露这些坐标。

---

# 119. 只读执行路径 (Read-Only Execution Path)

KIP **应当 (SHOULD)** 保留专用的只读工具 / 端点。

概念形式：

```text
execute_kip_readonly
```

---

# 120. 只读模式允许的操作 (Readonly Allowed Operations)

典型操作包括：

```text
KQL
META DESCRIBE
META LIST
META SEARCH
VERIFY
VALIDATE
PREVIEW
HISTORY
CHANGES
SNAPSHOT
EXPORT CAPSULE
```

受制于具体操作的授权策略。

---

# 121. 导出在语义上仍属于只读 (Export Is Still Readonly Semantically)

`EXPORT CAPSULE` 不会变更认知状态。

它仍可能需要：

```text
export
```

比普通读取更严格的导出权限。

---

# 122. 预览在语义上属于只读 (Preview Is Readonly Semantically)

`PREVIEW KML` 与 `PREVIEW IMPORT CAPSULE` 不会进行提交。

对预览尝试进行的安全审计属于单独的管理性副作用，不属于认知状态。

---

# 123. 只读端点必须解析实际语义 (Readonly Must Parse Actual Semantics)

无论调用方提供了何种语言标签，只读端点 **必须 (MUST)** 拒绝具有状态变更作用的命令。

---

# 124. 只读违规拒绝 (Readonly Rejection)

推荐的错误类型：

```text
ReadonlyViolation
```

附带提示：

```text
Use the state-changing execution endpoint if authorized. (如已获得授权，请使用状态变更执行端点。)
```

---

# 125. 通用执行路径 (General Execution Path)

概念形式：

```text
execute_kip
```

可以接受：

```text
KQL
KML
META
```

以及显式的原子执行模式。

---

# 126. 只读优先原则 (Readonly Preference)

智能体在不打算进行持久化变更时 **应当 (SHOULD)** 使用只读执行。

优势：

```text
更小的权限暴露面 (smaller authority surface)
更安全的工具选择 (safer tool selection)
更易于沙箱化 (easier sandboxing)
更低的意外写入风险 (lower accidental-write risk)
```

---

# 127. 受保护的治理与模式操作 (Protected Governance/Schema Operations)

治理与模式管理可以在内部共享事务运行时。

它们 **应当 (SHOULD)** 使用单独的受保护 API / 操作类型，而非将特权变更隐藏在任意 KML 字符串中。

---

# 128. 混合平面事务 (Mixed-Plane Transaction)

特权运行时 **可以 (MAY)** 在需要时原子化执行：

```text
认知变更 (cognitive)
+
治理变更 (Governance)
+
模式变更 (Schema)
```

该能力并不意味着普通智能体具有相应访问权限。

---

# 129. 操作分类由引擎控制 (Operation Classification Is Engine-Controlled)

运行时在完成解析 / 符号解析后决定操作属于：

```text
只读 (readonly)
认知写入 (cognitive-write)
治理写入 (governance-write)
模式写入 (schema-write)
外部工件读取 (external-artifact-read)
```

客户端无法降级此分类。

---

# 130. 演练模式 Dry Run (Dry Run)

推荐的请求选项：

```json
{
  "options": {
    "dry_run": true
  }
}
```

或 META 命令：

```text
PREVIEW KML
```

---

# 131. 演练模式语义 (Dry Run Semantics)

演练模式 **可以 (MAY)**：

```text
解析语法 (parse)
绑定参数 (bind)
解析模式 (resolve Schema)
读取当前状态 (read current state)
验证授权 (authorize)
构建暂存写入集 (construct tentative write set)
校验一致性 (validate)
估算资源开销 (estimate resources)
```

但 **严禁 (MUST NOT)**：

```text
进行持久化提交 (commit)
递增版本号 (increment version)
持久化消耗 client_key (consume client_key durably)
将元素 ID 确定性保留为最终状态 (reserve element ID as final)
发出认知变更信封 (emit cognitive Change Envelope)
修改记忆强度 (modify memory strength)
```

---

# 132. 演练通过不代表提交保证 (Dry Run Is Not Commit Guarantee)

正式提交时必须重新验证。

---

# 133. 仅校验模式 (Validation-Only Mode)

更轻量的选项可以仅执行：

```text
语法 + 模式 + 静态校验 (syntax + Schema + static validation)
```

而不进行当前状态模拟。

META 明确区分：

```text
VALIDATE (静态校验)
vs.
PREVIEW (动态预览)
```

---

# 134. 截止时间 (Deadline)

推荐形式：

```json
{
  "options": {
    "deadline_ms": 10000
  }
}
```

或传输层绝对截止时间戳。

---

# 135. 截止时间是客户端执行边界 (Deadline Is a Client Execution Bound)

它请求：

> 如果可以安全取消，请不要在有用的客户端窗口之外继续保持此请求处于活跃状态。

它并不是事务已中止的证明。

---

# 136. 客户端超时不等同于事务结果 (Timeout vs. Transaction Outcome)

此规则为规范性要求：

```text
客户端超时 (client timeout)
    ≠
事务已中止 (transaction aborted)
```

---

# 137. 模棱两可的写入结果 (Ambiguous Write Outcome)

如果连接断开或截止时间在提交开始后触发，客户端可能无法获知：

```text
提交是否已经发生 (commit happened)
```

运行时在能够确定时应当返回显式的模棱两可错误：

```text
OutcomeUnknown
```

---

# 138. 正确的恢复机制 (Correct Recovery)

使用：

```text
DESCRIBE TRANSACTION
BY IDEMPOTENCY KEY
```

或使用相同的幂等性键 / 请求进行重试。

---

# 139. 错误的恢复做法 (Wrong Recovery)

严禁执行以下操作：

```text
生成新的幂等性键 (generate a new idempotency key)
重新创建证据 (create new Evidence)
假定超时即代表未发生写入 (assume timeout means no write)
```

---

# 140. 提交前服务端确认取消 (Server Cancellation Before Commit)

如果服务端在事务到达提交阶段之前明确观察到取消并且事务已中止：

```text
status = aborted
```

可以返回中止状态。

---

# 141. 提交过程中的取消竞争 (Cancellation During Commit)

如果取消操作与提交发生并发竞争：

```text
调用方可能无法获知确切结果 (outcome may be unknown to caller)
```

通过事务查询进行解决。

---

# 142. 读取操作的取消 (Read Cancellation)

只读查询 / 搜索 / 导出生成通常可以安全取消。

不存在认知层面的提交。

---

# 143. 写入取消属于尽力而为 (Write Cancellation Is Best-Effort)

一旦状态变更事务进入提交处理流程，就无法假定取消能够回滚该事务。

---

# 144. 外部行动的取消 (External Action Cancellation)

KIP 不管理外部现实世界行动的回滚。

它们不应当嵌入在 KIP 写入事务中。

---

# 145. 资源限制配额 (Resource Limits)

运行时可以设置上限：

```text
请求字节数 (request bytes)
每请求操作数 (operations per request)
参数字节数 (parameters bytes)
查询结果行数 (query result rows)
投影数量 (projection count)
路径跳数 (path hops)
事务写入数 (transaction writes)
事务操作数 (transaction operations)
工件字节数 (artifact bytes)
流式持续时长 (stream duration)
历史查询范围 (history range)
变更批次大小 (change batch size)
```

---

# 146. 限制必须可被发现 (Limits Must Be Discoverable)

`DESCRIBE CAPABILITIES` **应当 (SHOULD)** 暴露安全相关的能力上限。

---

# 147. 客户端指定的更低限制 (Client-Supplied Lower Limits)

请求可以要求更严格的限制：

```json
{
  "options": {
    "extensions": {
      "vendor.example/limits": {
        "max_result_rows": 100,
        "max_write_elements": 50
      }
    }
  }
}
```

以降低影响爆炸半径（blast radius）。

基线 `options` 仅定义 `dry_run` 与 `deadline_ms`；在后续协议修订将其标准化之前，请求级上限属于带命名空间的扩展字段。

---

# 148. 更低限制无法突破运行时上限 (Lower Limit Cannot Raise Runtime Ceiling)

客户端无法通过请求：

```text
max_write_elements = 1,000,000
```

来绕过配置的运行时硬性上限。

---

# 149. 资源限制超额失败 (Resource Limit Failure)

推荐的错误类型：

```text
ResourceExhausted
```

或更精确的错误：

```text
TransactionTooLarge
ResultLimitExceeded
ArtifactTooLarge
```

---

# 150. 部分读取结果 (Partial Read Results)

基准规范 KQL **应当 (SHOULD)** 倾向于返回：

```text
完整结果页 (complete page)
或
显式错误 (explicit error)
```

而非静默地将不完整的分页伪装为完整结果返回。

---

# 151. 显式部分读取模式 (Explicit Partial Mode)

未来 / 可选的：

```text
allow_partial = true
```

可以支持探索性操作。

响应 **必须 (MUST)** 标记：

```text
partial = true (部分返回标识)
reason         (原因)
resume state   (恢复状态，若可用)
```

---

# 152. 原子模式内部严禁部分写入 (Partial Writes Are Not Allowed Inside Atomic Mode)

原子写入：

```text
全部提交 (all commit)
或
全部不提交 (none)。
```

资源耗尽会中止整个事务。

---

# 153. 顺序模式部分成功显式化 (Sequence Partial Success Is Explicit)

顺序模式可能出现：

```text
操作 1 已提交 (op1 committed)
操作 2 失败 (op2 failed)
操作 3 已跳过 (op3 skipped)
```

响应必须使该状态清晰可见。

---

# 154. 独立模式部分成功显式化 (Independent Partial Success Is Explicit)

每个操作分别汇报自己的最终终止状态。

---

# 155. 顶级响应信封 (Top-Level Response Envelope)

推荐结构：

```json
{
  "kip": "2.0",
  "request_id": "req-...",
  "status": "succeeded",

  "execution": {
    "mode": "sequence"
  },

  "results": [
    {
      "op_id": "op-1",
      "status": "succeeded",
      "result": {}
    }
  ],

  "context": {
    "space_id": "space-1"
  },

  "warnings": []
}
```

---

# 156. 顶级状态 (Top-Level Status)

推荐状态值：

```text
succeeded       (成功)
failed          (失败)
partial         (部分成功)
outcome_unknown (结果未知)
```

---

# 157. 成功状态 `succeeded` (`succeeded`)

所有必需的操作均已达到成功的终态语义。

---

# 158. 失败状态 `failed` (`failed`)

未能达成任何必需的成功契约。

对于原子写入，这通常意味着：

```text
事务已中止 / 未发生提交 (transaction aborted / no commit)
```

---

# 159. 部分成功状态 `partial` (`partial`)

可能出现在：

```text
sequence (顺序模式)
independent (独立模式)
显式部分读取模式 (explicit partial read mode)
```

**严禁 (MUST NOT)** 用于表示发生了部分持久化的原子提交。

---

# 160. 结果未知状态 `outcome_unknown` (`outcome_unknown`)

在运行时 / 客户端无法在响应路径中确定最终写入结果时使用。

它是一个恢复状态（recovery state），而非事务客观状态。

---

# 161. 操作结果对象 (Operation Result)

推荐形式：

```json
{
  "op_id": "op-2",
  "status": "succeeded",
  "result": {...},
  "context": {
    "snapshot_seq": 1500
  }
}
```

---

# 162. 操作状态值 (Operation Statuses)

推荐值：

```text
succeeded   (成功)
failed      (失败)
skipped     (已跳过)
rolled_back (已回滚)
no_effect   (无效果)
```

---

# 163. 已回滚状态 `rolled_back` (`rolled_back`)

在原子模式下，某个操作可能在后续发生错误之前已暂存执行。

它可以被报告为：

```text
rolled_back
```

用于诊断目的。

未产生任何持久化状态。

---

# 164. 已跳过状态 `skipped` (`skipped`)

在顺序模式且配置了 `on_error=stop` 时，后续操作未被执行。

---

# 165. 无效果状态 `no_effect` (`no_effect`)

操作在语义上执行成功，但未改变任何持久化认知状态。

示例：

```text
幂等 Upsert 目标已处于请求状态 (idempotent upsert already at requested state)
针对同一目标的重复合并 (repeat merge to same target)
无操作更新 (no-op update)
```

---

# 166. 原子模式响应 (Atomic Response)

推荐结构：

```json
{
  "status": "succeeded",

  "execution": {
    "mode": "atomic"
  },

  "results": [...],

  "receipt": {
    "tx_id": "tx-900",
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "space_seq": 1501,
    "committed_at": "...",
    "status": "committed"
  }
}
```

---

# 167. 只读原子收据 (Read-Only Atomic Receipt)

只读原子批处理可以返回读取上下文：

```json
{
  "snapshot": {
    "snapshot_seq": 1500
  }
}
```

而非状态变更收据。

---

# 168. 状态变更收据 (State-Changing Receipt)

事务收据（Receipt）是权威的成功提交结果。

推荐字段：

```text
tx_id
space_id
snapshot_seq
space_seq
committed_at
status
transaction_class
request_digest
semantic_plan_digest
result_digest
schema_environment_version
变更摘要 (change summary)
```

受治理策略约束。

---

# 169. 收据为引擎底层事实 (Receipt Is Engine Truth)

客户端无法自行伪造：

```text
space_seq
committed_at
tx_id
源主体 (origin Principal)
```

---

# 170. 收据状态值 (Receipt Statuses)

推荐的持久化状态值：

```text
committed (已提交)
aborted   (已中止)
no_effect (无效果)
```

查询时还可以额外报告：

```text
pending (进行中)
unknown (未知)
```

---

# 171. 无效果事务 (No-Effect Transaction)

如果尝试进行的状态变更事务未产生任何持久化状态改变：

```text
status = no_effect
```

并且 **不得 (SHOULD NOT)** 分配新的认知 `space_seq`。

安全审计仍可单独记录该次尝试。

---

# 172. 已中止事务 (Aborted Transaction)

已中止的事务不会产生：

```text
持久化认知写入集 (durable cognitive write set)
状态变更 space_seq (state-changing space_seq)
变更信封 (Change Envelope)
```

---

# 173. 提交记录 (Commit Record)

已提交的状态变更事务会追加一条不可变的提交记录（Commit Record）。

连线收据（Wire Receipt）是该持久化事实的投影。

---

# 174. 结果摘要 (Result Digest)

高保障运行时 **可以 (MAY)** 对规范化结果 / 收据有效载荷进行哈希计算。

结合签名 / 证明有助于检测：

```text
响应损坏 (response corruption)
收据替换 (receipt substitution)
```

---

# 175. 签名收据 (Signed Receipt)

可选能力：

```text
signed_receipts
```

可以通过密码学方式绑定：

```text
认知中枢标识 (Nexus identity)
tx_id
空间 (Space)
space_seq
请求 / 结果摘要 (request/result digest)
提交时间 (commit time)
```

---

# 176. 签名收据不证明语义真理 (Signed Receipt Does Not Prove Semantic Truth)

它仅证明中枢确认其提交了何种内容。

该事务内部的断言（Assertion）仍然可能为假。

---

# 177. 错误对象 (Error Object)

推荐结构：

```json
{
  "error": {
    "code": "SchemaSymbolAmbiguous",
    "category": "schema",
    "message": "Predicate alias 'status' is ambiguous.",
    "hint": "Use DESCRIBE PREDICATE and retry with an exact ref.",
    "retry": {
      "class": "requires_different_input"
    }
  }
}
```

---

# 178. 错误类别 (Error Categories)

推荐类别：

```text
syntax      (语法错误)
protocol    (协议错误)
schema      (模式错误)
data        (数据错误)
epistemic   (认识论错误)
governance  (治理错误)
transaction (事务错误)
history     (历史错误)
search      (搜索错误)
artifact    (工件错误)
resource    (资源错误)
transport   (传输错误)
system      (系统错误)
```

---

# 179. 错误码稳定性 (Error Code Stability)

人类可读的提示信息可以随时间改进。

机器可读的字段：

```text
code (错误代码)
category (错误类别)
retry class (重试类别)
```

在同一个协议版本内应当保持稳定。

---

# 180. 错误提示 (Error Hint)

提示是面向模型的恢复指导。

它们 **严禁 (MUST NOT)**：

```text
授予权限 (grant authority)
泄露隐藏资源的存在 (leak hidden resource existence)
建议不安全的绕过手段 (recommend unsafe bypass)
```

---

# 181. 错误详细信息 (Error Details)

可选的结构化信息：

```json
{
  "details": {
    "field": "confidence",
    "expected": "immutable",
    "operation": "UPDATE"
  }
}
```

受治理策略约束。

---

# 182. 存在性中立错误 (Existence-Neutral Errors)

在需要时，使用：

```text
NotFoundOrNotVisible
```

而非区分：

```text
秘密对象存在但被拒绝访问 (secret object exists but denied)
```

与对象不存在。

---

# 183. 授权错误 (Authorization Error)

安全通用的形式：

```text
NotAuthorized                  (未授权)
RequiresApproval               (需要审批)
RequiresStrongerAuthentication (需要更强身份认证)
ActorBindingRequired           (需要执行者绑定)
```

而不暴露受保护的策略内部细节。

---

# 184. 事务冲突错误 (Transaction Conflict Errors)

示例：

```text
VersionConflict          (版本冲突)
SerializationConflict    (可串行化冲突)
SchemaEnvironmentChanged (模式环境已改变)
IdempotencyConflict      (幂等性冲突)
PreconditionFailed       (前置条件失败)
```

---

# 185. 模棱两可的传输错误 (Ambiguous Transport Error)

传输层可能会产生：

```text
截止时间已过 (deadline exceeded)
连接被重置 (connection reset)
数据流丢失 (stream lost)
```

如果状态变更请求可能已到达服务端，面向客户端的工具应当尽可能暴露：

```text
outcome_unknown = true (结果未知标识)
idempotency_key        (幂等性键)
lookup hint            (查询建议)
```

---

# 186. 重试类别 (Retry Classes)

推荐分类：

```text
safe_same_request         (相同请求可安全重试)
requires_refresh          (需要刷新后再重试)
requires_different_input  (需要修改输入后再重试)
requires_authority        (需要更高权限)
requires_new_snapshot     (需要新快照)
requires_reacquire_artifact (需要重新获取工件)
outcome_lookup_required   (需要查询最终结果)
non_retryable             (不可重试)
```

---

# 187. 安全的同请求重试 (Safe Same Request)

示例：

```text
瞬态搜索后端不可用 (transient search backend unavailable)
读取超时 (read timeout)
```

对于写入操作，复用相同的幂等性键。

---

# 188. 需要刷新状态后再重试 (Requires Refresh)

示例：

```text
VersionConflict
SchemaEnvironmentChanged
CursorExpired
```

智能体应当重新读取 / 描述并重新推理。

---

# 189. 需要修改输入后再重试 (Requires Different Input)

示例：

```text
SchemaSymbolAmbiguous
NameIdentityForbidden
ImmutableField
```

---

# 190. 需要查询最终结果 (Outcome Lookup Required)

示例：

```text
提交期间连接丢失 (connection lost during commit)
提交开始后触发截止时间 (deadline after commit began)
```

---

# 191. 响应顺序 (Response Ordering)

非流式 `results[]` **应当 (SHOULD)** 与请求操作顺序对应。

`op_id` 始终具有权威性。

---

# 192. 独立操作的内部完成顺序 (Independent Internal Completion)

引擎可以并发执行独立操作。

它可以在内部先完成 op-3 再完成 op-1。

非流式结果排序仍然保持确定性。

---

# 193. 警告信息 (Warnings)

警告是非致命的语义警示。

示例：

```text
搜索索引滞后 (search index lagging)
投影解释被脱敏删节 (projection explanation redacted)
历史数据已被部分清理 (history partially purged)
使用了兼容性别名 (compatibility alias used)
废弃的模式符号 (deprecated Schema symbol)
胶囊外部 Blob 未被校验 (Capsule external blob not checked)
```

---

# 194. 警告严禁掩盖失败 (Warning Must Not Hide Failure)

必需的校验失败属于错误，而非警告。

---

# 195. 结果上下文 (Result Context)

按操作划分的上下文可以包括：

```text
space_id
snapshot_seq
schema_environment_version
认识论策略 (epistemic policy)
valid_at (世界有效时间基准)
搜索索引检查点 (search index checkpoint)
游标 (cursor)
```

取决于具体操作。

---

# 196. 上下文有助于未来的历史溯源 (Context Helps Future Provenance)

智能体随后可以持久化记录：

```text
基于 snapshot_seq 1500 作出的决策
投影策略 v3
```

而无需存储隐藏的思维链。

---

# 197. 结果体积控制 (Result Size)

庞大的结果 **应当 (SHOULD)** 使用：

```text
游标分页 (cursor pagination)
流式传输 (streaming)
工件句柄 (artifact handles)
```

而非单个巨型 JSON 对象。

---

# 198. 游标分类 (Cursors)

KIP 包含多种不透明的游标类别：

```text
KQL 分页游标 (KQL pagination cursor)
SEARCH 搜索游标 (SEARCH cursor)
LIST 列表游标 (LIST cursor)
CHANGES 变更游标 (CHANGES cursor)
工件流游标/偏移量 (artifact stream cursor/offset)
```

它们之间互不通用。

---

# 199. 游标类型绑定 (Cursor Type Binding)

运行时 **应当 (SHOULD)** 在内部将游标绑定至：

```text
操作族类别 (operation family)
查询摘要 (query digest)
空间 (Space)
主体可见性上下文 (Principal visibility context)
快照/索引检查点 (snapshot/index checkpoint)
位置 (position)
过期时间 (expiry)
```

依适用情况而定。

---

# 200. 游标是不透明的 (Cursor Is Opaque)

客户端 **严禁 (MUST NOT)** 通过解码猜测的游标内部数据来派生：

```text
space_seq
授权信息 (authorization)
排序等级 (rank)
ID
```

---

# 201. 游标不匹配 (Cursor Mismatch)

在以下要素改变的情况下使用游标：

```text
查询 (query)
空间 (Space)
主体 (Principal)
排序方式 (ordering)
认识论策略 (Epistemic Policy)
搜索模式 (Search mode)
```

将报错失败：

```text
CursorMismatch
```

---

# 202. 游标与权限撤销 (Cursor and Revocation)

游标绝不保留过期的旧权限。

---

# 203. KQL 查询游标 (KQL Cursor)

固定绑定：

```text
规范认知快照 (canonical cognitive snapshot)
规范化查询 (normalized query)
排序状态 (ordering state)
```

以实现稳定的分页遍历。

---

# 204. SEARCH 搜索游标 (SEARCH Cursor)

固定绑定：

```text
索引/排序遍历上下文 (index/ranking traversal context)
```

附带声明的一致性级别。

它并不意味着具有规范的 KQL 快照一致性。

---

# 205. CHANGES 变更游标 (CHANGES Cursor)

在留存期内固定绑定：

```text
提交日志流位置 (commit-log stream position)
授权流类别 (authorization stream class)
```

---

# 206. 游标过期 (Cursor Expiry)

运行时应当返回清晰的错误：

```text
CursorExpired
```

附带恢复指引。

---

# 207. 流式传输 (Streaming)

KIP 2.0 **可以 (MAY)** 支持以下场景的传输层流式传输：

```text
大型 KQL 结果 (large KQL results)
SEARCH 搜索结果 (SEARCH results)
变更流 Change Stream (Change Stream)
胶囊导出字节 (Capsule export bytes)
大型历史记录 (large history)
工件数据传输 (artifact transfer)
```

---

# 208. 逻辑结果与交付帧 (Logical Result vs. Delivery Frames)

流式帧属于传输交付单元。

它们并不是独立的 KIP 认知操作。

---

# 209. 数据流标识 (Stream Identity)

推荐形式：

```text
stream_id
```

关联至：

```text
request_id
op_id
```

---

# 210. 通用流式帧结构 (Generic Stream Frame)

示例结构：

```json
{
  "stream_id": "stream-1",
  "frame_seq": 3,
  "kind": "data",
  "data": {...}
}
```

---

# 211. 帧类型 (Frame Kinds)

推荐类型：

```text
start    (起始帧)
data     (数据帧)
warning  (警告帧)
progress (进度帧)
final    (终止帧)
error    (错误帧)
```

并非所有传输层都需要全部帧类型。

---

# 212. 帧序号 `frame_seq` (`frame_seq`)

在单个数据流内单调递增。

适用于：

```text
保序 (ordering)
传输重试时的去重 (若受支持)
调试排查 (debugging)
```

---

# 213. 起始帧 (Start Frame)

可以声明：

```text
操作类型 (operation)
快照/索引上下文 (snapshot/index context)
媒体类型 (media type)
预估大小 (estimated size)
模式定义 (schema)
```

---

# 214. 数据帧 (Data Frame)

根据数据流类型承载：

```text
结果行 (result rows)
变更信封 (Change Envelopes)
工件字节/数据块 (artifact bytes/chunks)
历史条目 (history entries)
```

---

# 215. 终止帧 (Final Frame)

必须声明最终终态语义：

```text
完成状态 (complete)
部分返回 (partial)
错误 (error)
摘要 (digest)
下一游标 (next cursor)
收据 (若适用)
```

---

# 216. 数据流丢失处理 (Stream Loss)

对于读取流：

```text
若受支持，使用游标/偏移量重新启动或恢复。
```

对于写入事务流：

```text
丢失可能导致结果不确定。
```

使用事务查询进行确认。

---

# 217. 严禁流式传输暂存写入的成功 (Do Not Stream Tentative Write Success)

状态变更原子事务在正式提交前 **严禁 (MUST NOT)** 发送暗示以下内容的流式帧：

```text
证据已被永久创建 (Evidence permanently created)
断言已被永久废弃替代 (Assertion permanently superseded)
```

---

# 218. 写入进度帧 (Write Progress)

运行时 **可以 (MAY)** 发送非权威的进度帧：

```text
progress
```

例如：

```text
正在校验 (validating)
正在规划 (planning)
```

但它们 **必须 (MUST)** 标记为临时状态，且 **严禁 (MUST NOT)** 将未提交的状态暴露为持久化事实。

---

# 219. 写入终止帧 (Write Final Frame)

只有终态的：

```text
收据 (Receipt)
已中止状态 (aborted status)
结果未知 (outcome_unknown)
```

才能确立客户端可见的写入结果。

---

# 220. KQL 查询流式传输 (KQL Streaming)

各个数据行 / 数据块 **必须 (MUST)** 全部属于相同的 KQL 快照 / 游标语义。

---

# 221. 聚合查询流式传输 (Aggregate Query Streaming)

需要观察完整解集的聚合操作 **应当 (SHOULD)** 通常仅在最终确定时发出聚合结果。

严禁将临时计数作为最终值进行流式传输。

---

# 222. SEARCH 搜索流式传输 (SEARCH Streaming)

若受支持，排序检查点必须保持足够稳定以满足所声明的一致性级别。

---

# 223. 变更流式传输 (Change Streaming)

即使传输层分片传输字节，每个变更信封（Change Envelope）在逻辑上仍是一个原子的帧有效载荷。

严禁将单个事务拆分为独立的认知事件。

---

# 224. 胶囊流式传输 (Capsule Streaming)

胶囊字节传输可以分块进行。

分块传输 **严禁 (MUST NOT)** 改变：

```text
胶囊规范有效载荷 (Capsule canonical payload)
内容摘要 (content digest)
胶囊标识 (Capsule identity)
```

---

# 225. 胶囊最终摘要 (Capsule Final Digest)

流式传输的工件在传输完成后，其终止帧 **应当 (SHOULD)** 暴露：

```text
content_digest
size (大小)
artifact handle (工件句柄)
```

---

# 226. 工件传输 (Artifact Transport)

大型二进制 / 文本对象不应当被强制塞入命令字符串中。

运行时 **可以 (MAY)** 支持不透明的：

```text
artifact_handle
```

句柄引用。

---

# 227. 工件句柄应用场景 (Artifact Handle Use Cases)

```text
认知胶囊输入 / 输出 (Cognitive Capsule input/output)
模式包工件 (Schema Package artifact)
证据二进制 Blob (Evidence blob)
收据 / 证明包 (Receipt/proof bundle)
大型导出文件 (large export)
```

---

# 228. 工件句柄结构 (Artifact Handle Shape)

示例形式：

```json
{
  "artifact": {
    "handle": "art-opaque",
    "media_type": "application/kip-capsule+json",
    "size": 98231,
    "digest": "sha256:..."
  }
}
```

---

# 229. 句柄是不透明的 (Handle Is Opaque)

客户端 **严禁 (MUST NOT)** 将：

```text
art-opaque
```

视为：

```text
文件系统路径 (filesystem path)
URL
数据库 ID (database ID)
全局标识 (global identity)
```

---

# 230. 工件句柄不等同于认知标识 (Artifact Handle Is Not Cognitive Identity)

它标识的是单次运行时可访问的工件表示。

胶囊的：

```text
content_digest
```

才是便携式的内容标识。

---

# 231. 工件句柄访问受治理约束 (Artifact Handle Access Is Governed)

获知句柄并不必然代表已获权读取它。

运行时必须根据情况校验：

```text
调用主体 (Principal)
空间 / 上下文 (Space/context)
过期时间 (expiry)
工件策略 (artifact policy)
```

---

# 232. 不记名句柄 (Bearer Handles)

如果实现有意使用不记名能力句柄（bearer-capability handles），它 **必须 (MUST)** 公开声明该安全模型，并生成足够不可猜测的作用域令牌。

基准规范建议使用经过身份认证的访问，而非假定所有句柄都是安全的不记名凭证。

---

# 233. 工件过期 (Artifact Expiry)

临时句柄可以包含：

```text
expires_at
```

或受运行时留存策略治理。

句柄的过期不会改变底层胶囊摘要的语义。

---

# 234. 内联工件 (Inline Artifact)

小型工件 **可以 (MAY)** 直接内联嵌入：

```json
{
  "artifact": {
    "inline": {...}
  }
}
```

受请求大小限制约束。

---

# 235. 内联二进制字节 (Inline Bytes)

二进制字节 **应当 (SHOULD)** 使用传输层定义的二进制主体或安全编码。

不要依赖任意 JSON 字符串来承载巨型二进制载荷。

---

# 236. 工件上传流程 (Artifact Upload)

传输层绑定 **可以 (MAY)** 提供：

```text
上传工件 (upload artifact)
→ 返回句柄 + 摘要 (returns handle + digest)
→ KIP 命令引用该句柄 (KIP command references handle)
```

仅上传字节本身不会导入任何认知数据。

---

# 237. 工件下载流程 (Artifact Download)

读取 / 导出操作可以返回：

```text
artifact handle (工件句柄)
```

随后通过传输层特定的工件获取接口拉取字节。

这种解耦保持了 KIP 语义响应的紧凑精炼。

---

# 238. 任意 URL 不等同于工件句柄 (Arbitrary URL Is Not Artifact Handle)

**严禁 (MUST NOT)** 仅仅因为参数期望工件数据就自动对调用方提供的任意 URL 进行解引用。

---

# 239. 外部网络拉取 (External Fetch)

网络拉取需要具备：

```text
显式工具 / 网络能力 (explicit tool/network capability)
治理策略授权 (Governance)
资源配额限制 (resource limits)
摘要校验 (在预期时)
```

---

# 240. 工件摘要校验 (Artifact Digest)

如果请求声明了预期摘要，运行时在进行语义使用前 **必须 (MUST)** 验证所提供的工件字节。

---

# 241. 工件类型识别 (Artifact Type)

媒体 / 类型元数据属于建议性质，除非已通过实际解析器 / 内容进行验证。

运行时基于以下要素选择解析器：

```text
操作预期 (operation expectation)
已验证的媒体 Profile (verified media profile)
```

而非仅凭文件名。

---

# 242. 工件隔离解析 (Artifact Isolation)

不可信的胶囊 / 模式工件 **应当 (SHOULD)** 在资源受限的隔离环境中进行解析。

---

# 243. 解压缩安全防护 (Decompression Safety)

传输层 / 运行时必须防范：

```text
解压缩炸弹 (decompression bombs)
Zip 炸弹 (zip bombs)
深层嵌套 JSON (deeply nested JSON)
巨型数组 (huge arrays)
畸形 Unicode (malformed Unicode)
解析器炸弹 (parser bombs)
```

---

# 244. 工件暂存不等同于认知暂存 (Artifact Staging Is Not Cognitive Staging)

保存胶囊字节的运行时工件存储属于传输状态。

它并不是：

```text
向 MemorySpace 进行胶囊隔离导入 (Capsule isolate import)
```

---

# 245. 工件生命周期与事务 (Artifact Lifecycle and Transaction)

原子的认知事务可以引用已经暂存的工件。

工件上传本身不属于认知事务的一部分。

---

# 246. 提交期间工件缺失 (Missing Artifact During Commit)

如果必需的临时工件在事务校验前已过期：

```text
ArtifactUnavailable
```

事务报错中止。

---

# 247. 对工件的参数引用 (Parameter References to Artifacts)

推荐的参数形式：

```json
{
  "parameters": {
    "capsule": {
      "$artifact": "art-123"
    }
  }
}
```

具体标记形式属于前规范阶段内容。

---

# 248. 工件引用是强类型的 (Artifact Reference Is Typed)

绑定器将其识别为：

```text
ArtifactRef
```

而非普通的字符串。

---

# 249. 结果工件引用 (Result Artifact Reference)

大型 META `EXPORT CAPSULE` 可以直接返回一个 ArtifactRef。

---

# 250. 传输层流式传输与变更流的区别 (Protocol Streaming vs. Change Stream)

明确区分：

```text
传输层流式传输 (transport streaming)
    字节/结果如何到达 (how bytes/results arrive)

KIP 变更流 (KIP Change Stream)
    逻辑上有序的提交推送流 (logical ordered commit feed)
```

变更流完全可以通过轮询实现，无需流式传输通道。

---

# 251. 同步执行基准 (Synchronous Baseline)

在可行的情况下，基准命令执行 **应当 (SHOULD)** 同步执行直至得到最终操作结果。

这对于智能体的工具调用尤为重要。

---

# 252. 长时间运行的读取作业 (Long-Running Read Work)

未来可选的 Job API **可以 (MAY)** 处理：

```text
巨型胶囊导出 (huge Capsule export)
大规模校验 (large validation)
深度迁移分析 (deep migration analysis)
```

而无需一直保持网络长连接。

它不属于必需的基准要求。

---

# 253. 写入事务应当保持短小有界 (Write Transactions Should Be Bounded)

KIP 写入事务 **应当 (SHOULD)** 保持短小且有界。

严禁在以下耗时操作期间一直保持原子写入事务开启：

```text
等待人类响应 (waiting for human)
调用 LLM 数分钟 (calling LLM for minutes)
执行远程工作流 (executing remote workflow)
等待外部工具 (waiting for external tool)
```

---

# 254. 长周期认知工作流 (Long Cognitive Workflow)

正确的模式流程：

```text
读取快照 (read snapshot)
进行推理 (reason)
有界写入事务 (bounded write transaction)
外部行动 (external action)
有界结果事务 (bounded outcome transaction)
```

---

# 255. 异步作业不改变事务语义 (Asynchronous Jobs Do Not Change Transaction Semantics)

如果维护作业在后台长期准备结果：

```text
其最终的持久化写入仍然通过有界事务进行提交。 (its final durable write still commits through a bounded Transaction.)
```

---

# 256. 服务端推送属于可选特性 (Server Push Is Optional)

KIP 不强制要求：

```text
WebSocket
SSE (服务端发送事件)
Webhook
```

以满足协议一致性。

轮询方式同样可以实现：

```text
事务查询 (transaction lookup)
变更流获取 (change stream)
作业状态跟踪 (job status)
```

---

# 257. 传输层身份认证失败 (Transport Authentication Failure)

发生在 KIP 语义执行之前。

推荐的传输层 / 协议映射：

```text
Unauthenticated
```

严禁泄露任何关于空间存在性的信息。

---

# 258. 升级更强身份认证 (Stronger Authentication)

治理策略可以针对以下操作要求递进式认证（step-up authentication）：

```text
彻底物理清除 (purge)
导出机密 (export secret)
恢复胶囊 (restore Capsule)
管理模式 (manage Schema)
权限提升 (authority elevation)
```

运行时可以返回：

```text
RequiresStrongerAuthentication
```

---

# 259. 重新认证与重试 (Reauthentication and Retry)

在完成递进式认证后，系统状态可能已发生变化。

客户端应当重新运行预览 / 前置条件检查，而非假定旧计划仍然有效。

---

# 260. 委托过期 (Delegation Expiry)

委托凭证在提交时会被重新验证。

委托在提交前已过期的长耗时请求将中止。

---

# 261. 收据中的主体上下文 (Principal Context in Receipt)

高保障收据可以包含经授权且非敏感的引用：

```text
源主体 (origin Principal)
委托链摘要 (delegation chain digest)
所使用的 ActorBinding (ActorBinding used)
```

用于审计。

---

# 262. 客户端无法重写来源主体 (Client Cannot Rewrite Origin)

即使请求体声明：

```text
origin = "Alice"
```

引擎仍会记录实际经过身份认证的来源主体。

---

# 263. 审计日志中的请求意图 (Request Purpose in Audit)

运行时可以记录：

```text
意图 (purpose)
风险级别 (risk)
客户端请求标签 (client request label)
```

作为声明的请求上下文。

必须将这些内容与引擎底层事实区分开来。

---

# 264. API 接口形态 (API Surface)

最小化实现可以暴露两个逻辑入口点：

```text
execute_kip_readonly(request)
execute_kip(request)
```

---

# 265. 为何需要两个入口 (Why Two Entry Points)

该解耦拆分适用于：

```text
工具权限控制 (tool permissions)
安全沙箱化 (sandboxing)
智能体工具选择 (Agent tool selection)
最小特权原则 (least privilege)
审计跟踪 (auditing)
```

即使两者在内部使用相同的引擎。

---

# 266. 可选的专用入口点 (Optional Specialized Entry Points)

运行时 **可以 (MAY)** 出于易用性 / 流式传输原因额外暴露：

```text
execute_transaction
artifact_put/get
changes
transaction_lookup
```

它们 **必须 (MUST)** 保持相同的逻辑语义。

---

# 267. 跨传输绑定的语义一致性 (No Semantic Difference Across Bindings)

通过以下方式进行的原子 KML 事务：

```text
HTTP
MCP
本地 API (local API)
```

必须具有完全相同的 KIP 提交语义。

---

# 268. 函数调用绑定 (Function-Calling Binding)

模型工具调用的形式可为：

```json
{
  "name": "execute_kip_readonly",
  "arguments": {
    "kip": "2.0",
    "space": {"id": "space-1"},
    "execution": {"mode": "atomic"},
    "operations": [
      {
        "op_id": "q1",
        "command": "FIND(...) WHERE {...}",
        "parameters": {}
      }
    ]
  }
}
```

---

# 269. MCP 绑定 (MCP Binding)

MCP 工具可以将相同的信封暴露为结构化参数。

MCP 连接身份提供已认证的主体（Principal）上下文。

---

# 270. HTTP 绑定 (HTTP Binding)

一种可能的绑定方式：

```text
POST /kip/v2/execute
POST /kip/v2/readonly
```

仅作示例说明，不具规范性。

---

# 271. HTTP 状态不等同于 KIP 事务状态 (HTTP Status Is Not KIP Transaction Status)

```text
HTTP 200
```

响应内部可能包含 KIP 操作错误。

传输失败也可能在事务已经提交之后发生。

客户端必须检查 KIP 信封。

---

# 272. HTTP 202 可选异步作业 (HTTP 202 Optional Job)

如果传输层使用异步作业，`202` 仅表示作业已被接受，而不代表认知状态已提交。

对于写入操作，最终仍需获取事务收据（Receipt）。

---

# 273. 压缩 (Compression)

**可以 (MAY)** 使用传输层压缩。

压缩仅改变网络连线上的字节，不改变逻辑请求 / 胶囊的语义标识。

---

# 274. 内容类型协商 (Content-Type Negotiation)

传输层绑定 **应当 (SHOULD)** 明确区分：

```text
KIP 请求 JSON (KIP request JSON)
胶囊规范 JSON (Capsule canonical JSON)
二进制工件 (binary artifact)
流式帧格式 (stream framing)
```

---

# 275. 字符编码 (Character Encoding)

JSON 文本使用：

```text
UTF-8
```

基准解析器必须拒绝畸形输入。

---

# 276. 重复 JSON 键处理 (Duplicate JSON Keys)

协议 JSON **应当 (SHOULD)** 拒绝包含重复对象键的输入。

这可以避免：

```text
解析器差异 (parser discrepancy)
签名/摘要歧义 (signature/digest ambiguity)
安全混淆 (security confusion)
```

---

# 277. 未知请求字段 (Unknown Request Fields)

向前兼容的处理方式：

```text
未知的非关键扩展 (unknown non-critical extension)
    可以被忽略或保留 (may be ignored/preserved)

未知的关键扩展 (unknown critical extension)
    必须报错失败 (must fail)
```

---

# 278. 扩展字段 (Extensions)

推荐形式：

```json
{
  "extensions": {
    "vendor.example/feature": {...}
  }
}
```

---

# 279. 关键扩展 (Critical Extensions)

扩展可以声明：

```text
critical = true
```

以便无法理解该扩展的运行时报错失败，而非在篡改语义的情况下继续执行。

---

# 280. 严禁未命名空间的语义字段 (No Unnamespaced Semantic Fields)

厂商扩展不应添加可能与未来标准 KIP 语义发生冲突的顶级字段。

---

# 281. 兼容性 Profile (Compatibility Profiles)

若受支持，请求 **可以 (MAY)** 指定：

```text
compatibility_profile = "kip-1-compat"
```

---

# 282. 兼容性必须是显式的 (Compatibility Is Explicit)

原生 v2 运行时 **不得 (SHOULD NOT)** 仅仅因为语法看起来相似就静默地将遗留语义当作原生语义处理。

---

# 283. KIP 1 命令信封映射 (KIP 1 Command Envelope Mapping)

遗留格式：

```json
{
  "command": "...",
  "parameters": {...},
  "dry_run": false
}
```

自然地映射至单个原生操作。

---

# 284. 遗留 `commands[]` 映射 (Legacy `commands[]`)

根据兼容性 Profile 映射至显式的原生顺序执行语义。

响应中应当披露：

```text
compatibility_profile_used
```

---

# 285. 遗留写错误停止策略 (Legacy Stop-on-Write-Error)

v1 兼容性 Profile 可以保留旧的行为：

```text
读取 META/KQL 错误相互隔离 (read META/KQL errors are isolated)
状态变更失败停止后续命令 (state-changing failure stops subsequent commands)
```

原生 v2 通过显式的执行模式 / 遇错处理策略避免了这种隐式的混合规则。

---

# 286. 遗留响应结构 (Legacy Response Shape)

兼容性包装层可以返回旧的结构：

```text
result
error
next_cursor
```

原生 v2 应当倾向于使用统一的操作 / 结果信封。

---

# 287. 遗留 `_score` 字段 (`_score`)

搜索得分映射至：

```text
result.retrieval.score
```

而非持久化元数据。

---

# 288. 遗留 EXPORT 导出 (Legacy EXPORT)

遗留导出可能会返回一段 KML UPSERT 脚本。

原生：

```text
EXPORT CAPSULE
```

返回一个认知胶囊工件。

这两种结果媒体类型必须能够清晰区分。

---

# 289. 协议握手 (Protocol Handshake)

客户端可以从以下命令开始：

```text
DESCRIBE PROTOCOL
DESCRIBE CAPABILITIES
```

或传输层等效机制。

---

# 290. 握手结果 (Handshake Result)

应当确立：

```text
协议版本 (protocol version)
最大请求大小 (max request size)
受支持的执行模式 (supported execution modes)
只读端点 (readonly endpoint)
流式传输支持 (streaming support)
工件支持 (artifact support)
事务一致性等级 (transaction conformance)
胶囊格式 (Capsule formats)
错误注册表 (error registry)
```

处于安全的能力级别。

---

# 291. 握手信息可缓存 (Handshake Is Cacheable)

运行时支持变更的频率低于认知状态。

客户端可以按以下维度进行缓存：

```text
中枢/运行时标识 (Nexus/runtime identity)
协议能力版本 (protocol capability version)
```

---

# 292. 生效能力更具动态性 (Effective Capabilities Are More Dynamic)

特定于主体 / 空间的：

```text
可用 (available)
```

能力可能随治理策略而改变。

当权限上下文发生变化时应当予以刷新。

---

# 293. 能力降级 (Capability Downgrade)

如果缓存的能力变得不可用：

```text
操作授权判断优先 (operation authorization wins)
```

运行时返回当前的拒绝响应，而非沿用陈旧的缓存。

---

# 294. 请求能力前置条件 (Request Capability Preconditions)

客户端 **可以 (MAY)** 声明：

```json
{
  "requires": {
    "serializable_transactions": true,
    "belief_slot": true
  }
}
```

---

# 295. 能力前置条件语义 (Capability Precondition Semantics)

如果运行时无法满足所有声明的要求，必须在执行前报错：

```text
UnsupportedCapability
```

---

# 296. 为什么 (Why)

智能体通常倾向于快速失败，而非静默接受以下弱化降级：

```text
可串行化 → 快照隔离 (serializable → snapshot isolation)
历史快照 → 当前快照 (historical → current)
语义搜索 → 关键字搜索 (semantic search → keyword)
签名收据 → 未签名收据 (signed receipt → unsigned)
```

---

# 297. 严禁静默语义降级 (No Silent Semantic Downgrade)

此规则为规范性要求。

如果请求所需的语义保证运行时无法提供：

```text
必须显式报错失败。 (fail explicitly.)
```

---

# 298. 可选特性降级回退策略 (Optional Feature Fallback)

客户端可以根据需要提供显式的回退策略。

示例：

```json
{
  "options": {
    "extensions": {
      "vendor.example/search_fallback": {
        "modes": ["hybrid", "keyword"]
      }
    }
  }
}
```

响应必须指明实际使用的是哪种模式。

---

# 299. 隔离级别请求 (Isolation Request)

原子写入可以请求：

```text
serializable (可串行化)
```

---

# 300. 默认禁止隔离级别降级 (Isolation Downgrade Forbidden by Default)

如果请求了可串行化但该隔离级别不可用：

```text
UnsupportedIsolation
```

报错失败，而非静默使用更弱的隔离级别。

---

# 301. 运行时默认隔离级别 (Runtime Default Isolation)

当省略该选项时，运行时使用其声明的 KIP 默认值。

对于 KIP 2.0 状态变更事务，推荐的目标为可串行化终态语义。

---

# 302. 跨操作引用先前结果 (Operation Results Referencing Prior Results)

基准规范 KIP 2.0 **不得 (SHOULD NOT)** 在独立 / 顺序操作之间引入通用的字符串插值，例如：

```text
${op1.result.id}
```

此类机制难以进行强类型安全校验，且会使请求摘要与执行顺序语义变得复杂。

---

# 303. 推荐的依赖机制 (Preferred Dependency Mechanisms)

推荐使用：

```text
单个带有本地句柄的 KML MUTATE
单个原子事务 (其中后续 KQL 可观察暂存写入)
或者
使用返回的持久化 ID 进行多轮客户端往返交互
```

---

# 304. 为何避免结果模板注入 (Why Avoid Result Templates)

通用的结果模板机制会引入：

```text
动态代码构造 (dynamic code construction)
类型歧义 (type ambiguity)
错误传播复杂性 (error propagation complexity)
隐式时序依赖 (hidden sequencing)
注入安全风险 (injection risk)
```

---

# 305. 未来的强类型绑定 (Future Typed Bindings)

未来 AST 级别的协议 **可以 (MAY)** 支持类型化的操作结果引用。

当前不属于基准规范。

---

# 306. 原子模式下的 KQL 至 KML 依赖 (Atomic KQL-to-KML Dependency)

在单个原子请求内部，KML 命令可以在内部或通过 KML WHERE 使用常规查询模式，而非对先前结果进行文本插值。

倾向于使用声明式的状态选择。

---

# 307. 确定性命令分类 (Deterministic Command Classification)

解析器在执行前必须识别命令属于：

```text
KQL 读取 (KQL read)
KML 写入 (KML write)
META 读取 (META read)
```

语法扩展严禁在读取关键字背后隐藏状态变更逻辑。

---

# 308. META 预览操作分类 (META Preview Classification)

`PREVIEW KML` 属于只读操作，因为其语义契约严禁产生持久化变更。

---

# 309. META 导出操作分类 (META Export Classification)

`EXPORT CAPSULE` 在认知状态层面上属于只读，但在治理层面上具有：

```text
export (导出)
```

分类。

---

# 310. KQL BELIEF 信念操作分类 (KQL BELIEF Classification)

`BELIEF` 属于读取 / 投影操作。

它可以要求 `project` 权限，但不会执行写入。

---

# 311. 查询副作用 (Query Side Effects)

运行时监控埋点可以记录：

```text
遥测指标 (telemetry)
安全审计 (security audit)
计费计量 (billing)
速率限制 (rate limiting)
```

这些处于认知状态之外。

KQL / META 在语义上始终保持只读。

---

# 312. 只读认知保证 (Read-Only Cognitive Guarantee)

执行读取操作严禁静默改变：

```text
记忆强度 (memory_strength)
显著性 (salience)
置信度 (confidence)
作为认知状态的最后回忆时间 (last_recalled_at)
证据数量 (Evidence count)
```

除非发生了单独且显式的记忆形成 / 学习写入操作。

---

# 313. 速率限制 (Rate Limiting)

传输层 / 运行时可以返回：

```text
RateLimited
```

附带安全的重试元数据。

速率限制计数器属于运维控制状态，不属于认知状态。

---

# 314. 配额管理 (Quotas)

按主体 / 空间的配额可以管控：

```text
写入量 (writes)
存储空间 (storage)
搜索次数 (search)
胶囊导出 (Capsule export)
历史记录 (history)
```

除了产生显式错误 / 达到上限之外，它们不会改变语义查询结果。

---

# 315. 背压控制 (Backpressure)

流式传输 **应当 (SHOULD)** 支持背压机制或有界缓冲区。

缓慢的消费方严禁迫使服务端使用无界内存。

---

# 316. 数据流取消 (Stream Cancellation)

客户端可以取消读取流。

服务端随之释放相应资源。

---

# 317. 变更流背压 (Change Stream Backpressure)

落后于留存窗口的消费方必须从快照中进行恢复，而非迫使服务端无期限保留历史记录。

---

# 318. 顺序请求背压 (Sequence Request Backpressure)

对于大型顺序批处理，运行时可以强制执行最大操作数上限。

---

# 319. 原子请求大小限制 (Atomic Request Size)

超出以下限制的事务：

```text
max_transaction_operations (最大事务操作数)
max_transaction_writes     (最大事务写入数)
```

在提交前报错失败。

大型导入应使用暂存 / 发布机制。

---

# 320. 大型胶囊导入流程 (Large Capsule Import)

协议推荐模式：

```text
上传工件 (artifact upload)
    ↓
META 校验 / 预览 (META VALIDATE/PREVIEW)
    ↓
暂存导入操作 (staging import operations)
    ↓
最终原子发布事务 (final atomic publish transaction)
```

连线协议无需将整个胶囊塞进单个 KML 字符串中。

---

# 321. 恢复模式导入 (Restore Import)

恢复导入需要更强的治理权限和显式的导入模式。

通用运行时负责传输请求，但不会从胶囊内容中推断：

```text
合并 vs 恢复 (merge vs restore)
```

---

# 322. `$self` 映射 (`$self` Mapping)

协议运行时绝不会自动将源胶囊中的 `$self` 替换为目标空间的 `$self`。

该决策归属于胶囊导入 / 治理层恢复语义。

---

# 323. 模式工件加载 (Schema Artifact Loading)

模式包的工件句柄可用于：

```text
VERIFY   (验证)
VALIDATE (校验)
PREVIEW  (预览)
```

而无需立即激活。

激活属于单独的受保护操作。

---

# 324. 事务历史查询 (Transaction History Query)

在已获授权的情况下，META 事务查询可以使用：

```text
tx_id
幂等性键 (idempotency key)
```

---

# 325. 按请求 ID 查询 (Lookup by Request ID)

运行时 **可以 (MAY)** 支持按请求 ID 进行运维关联。

但严禁假定：

```text
一个请求 ID = 一个已提交的事务
```

因为顺序请求可能会创建多个事务。

---

# 326. 顺序请求收据 (Sequence Request Receipts)

每个成功的状态变更操作均返回各自的收据。

因此顶级请求可以包含：

```text
0..N 个事务收据 (0..N transaction Receipts)
```

---

# 327. 独立请求收据 (Independent Request Receipts)

同样每个状态变更操作对应一个收据。

---

# 328. 原子请求收据 (Atomic Request Receipt)

整个事务严格对应恰好一个事务收据。

---

# 329. 读取请求无提交收据 (Read Request Has No Commit Receipt)

读取请求可以返回：

```text
快照上下文 (snapshot context)
查询摘要 (query digest)
游标 (cursor)
```

但绝不能返回虚假的事务提交收据。

---

# 330. 搜索请求包含索引上下文 (Search Request Has Index Context)

SEARCH 返回：

```text
索引检查点 / 新鲜度 (index checkpoint/freshness)
```

除非特别支持，否则不提供规范的认知快照保证。

---

# 331. 导出收据 (Export Receipt)

`EXPORT CAPSULE` 可以返回导出工件 / 审计描述符。

这不属于认知提交收据，除非记录了单独的源审计事务。

---

# 332. 源导出审计 (Source Export Audit)

如果治理策略要求针对导出记录审计事件，这可能会创建一个独立于只读导出认知快照的受保护审计事务。

响应必须明确区分：

```text
胶囊源快照 (Capsule source snapshot)
导出审计事务 (export audit transaction)
```

---

# 333. 请求日志隐私保护 (Request Logging Privacy)

运行时日志可能包含：

```text
KQL / KML 文本
证据有效载荷 (Evidence payload)
ID 标识
胶囊元数据 (Capsule metadata)
```

这些属于安全敏感数据。

KIP 一致性规范应当建议进行脱敏与最小化记录。

---

# 334. 命令中的机密凭据 (Secrets in Commands)

客户端 **应当 (SHOULD)** 倾向于使用：

```text
工件 / 机密句柄 (artifact/secret handles)
受保护的运行时引用 (protected runtime references)
```

而非在 KIP 命令文本中直接嵌入长期有效的机密。

---

# 335. KIP 不是机密保险库 API (KIP Is Not a Secret Vault API)

机密凭证管理应当由专用的受保护子系统处理。

关于凭据的认知断言（Cognitive Assertions）并不会直接创建运行时访问凭据。

---

# 336. 链路追踪上下文 (Trace Context)

传输层 **可以 (MAY)** 承载：

```text
trace_id
span_id
```

用于可观测性。

它们不属于语义标识。

---

# 337. 追踪信息严禁自动转化为历史溯源 (Tracing Must Not Become Provenance Automatically)

如果显式构建，Activity 活动可以引用运维链路追踪 ID。

但追踪 ID 不会自动成为认知历史溯源。

---

# 338. 确定性错误定位 (Deterministic Error Localization)

语法 / 模式错误 **应当 (SHOULD)** 明确指出：

```text
op_id
源码位置 (source location)
字段 / 路径 (field/path)
已解析符号 (在安全的情况下)
```

以支持模型自主纠错。

---

# 339. 命令源码位置定位 (Command Source Location)

针对文本命令的建议形式：

```json
{
  "location": {
    "line": 3,
    "column": 14
  }
}
```

---

# 340. 参数错误位置定位 (Parameter Error Location)

绑定器错误应当指出：

```text
参数名称 (parameter name)
预期类型 (expected type)
实际类型 (actual type)
```

而无需不必要地回显敏感值。

---

# 341. 工件解析错误 (Artifact Parse Error)

应当指出：

```text
工件句柄 / 摘要 (artifact handle/digest)
格式 (format)
安全解析位置 (safe parse position)
```

而非直接输出未经过滤的机密载荷。

---

# 342. 操作前协议错误 (Protocol Error Before Operation)

如果顶级请求信封非法：

```text
任何操作均不会被执行。 (no operations execute.)
```

---

# 343. 独立模式下的操作解析错误 (Operation Parse Error in Independent Mode)

在顶级信封合法的情况下，仅该特定操作失败。

其他独立操作可以正常运行。

---

# 344. 顺序模式下的操作解析错误 (Operation Parse Error in Sequence Mode)

在配置了 `on_error=stop` 的情况下：

```text
后续操作全部跳过。 (later operations skipped.)
```

先前已提交的事务保持有效。

---

# 345. 原子模式下的操作解析错误 (Operation Parse Error in Atomic Mode)

整个事务在提交前报错失败。

---

# 346. 顶级授权失败 (Top-Level Authorization Failure)

如果调用方完全无法访问所选空间：

```text
任何操作均不会被执行。 (no operations execute.)
```

在必要时使用存在性中立响应。

---

# 347. 操作级授权 (Operation-Level Authorization)

调用方可以访问该空间，但可能针对特定操作缺乏以下权限：

```text
export   (导出)
project  (投影)
purge    (物理清除)
history  (历史查询)
```

结果将根据批处理语义反映该特定操作的拒绝状态。

---

# 348. 原子授权 (Atomic Authorization)

单个必需操作被拒绝将中止整个原子事务。

---

# 349. 顺序授权 (Sequence Authorization)

单个操作被拒绝将遵循 `on_error` 策略。

先前已提交的事务保持有效。

---

# 350. 独立授权 (Independent Authorization)

每个操作分别进行独立授权。

---

# 351. 模式解析错误 (Schema Resolution Error)

发生在受影响命令的语义执行之前。

原子请求将报错中止。

---

# 352. 顺序模式中的模式快照 (Schema Snapshot in Sequence)

如果模式环境在各操作之间发生了变化，每个顺序操作可以针对更新的模式环境进行解析。

响应会汇报各自的环境版本。

---

# 353. 原子模式中的模式快照 (Schema Snapshot in Atomic)

所有本地别名均在事务捕获的模式环境下进行解析。

---

# 354. 高保障精确引用 (High-Assurance Exact Refs)

需要长期语义确定性的客户端应当使用：

```text
精确的 schema_ref
精确的 predicate_ref
精确的包版本/摘要前置条件 (exact package version/digest preconditions)
```

而非浮动的别名。

---

# 355. 读取快照留存周期 (Read Snapshot Retention)

即使历史 `AS OF SEQ` 仍可从归档历史中重建，快照令牌也可能会过期。

能力描述明确区分：

```text
实时快照令牌 TTL (live snapshot token TTL)
历史读取留存期 (historical read retention)
```

---

# 356. 快照令牌续期 (Snapshot Token Renewal)

运行时 **可以 (MAY)** 允许为相同的已留存历史序列申请新令牌。

当前的治理策略仍然适用。

---

# 357. 时间表示值 (Time Values)

协议层面的引擎时间 **应当 (SHOULD)** 使用标准时间戳表示，通常为兼容 RFC 3339 / ISO 8601 的字符串。

精确的规范时间戳规则归属于正式规范。

---

# 358. 时区处理 (Timezone)

引擎提交顺序绝不依赖于客户端时区。

精确排序使用：

```text
space_seq
```

---

# 359. 客户端时钟 (Client Clock)

客户端提供的：

```text
observed_at (观察时间)
asserted_at (断言时间)
```

可以作为语义证据时间。

它们不是受信任的引擎提交时间。

---

# 360. 时钟偏差 (Clock Skew)

运行时 **可以 (MAY)** 针对难以置信的客户端语义时间戳发出警告。

除非策略明确定义了规范化规则，否则不应静默重写历史断言声明。

---

# 361. 当前时间参数绑定 (Current Time Parameters)

为了实现可复现的智能体操作，在语义当前时间敏感的场景下，客户端 **应当 (SHOULD)** 绑定显式的：

```text
:now
```

引擎仍然独立记录自己的提交时间。

---

# 362. 请求语言区域 (Request Locale)

语言区域可以影响：

```text
错误提示信息 (error messages)
人类可读标签 (human labels)
Primer 引导渲染 (Primer rendering)
```

而不影响规范的模式标识。

---

# 363. 响应自然语言 (Response Language)

面向人类的 `message` / `hint` **可以 (MAY)** 进行本地化。

机器错误码与精确引用保持稳定。

---

# 364. 结果渲染模式 (Result Rendering)

在能力允许的情况下，客户端可以请求：

```text
compact    (紧凑模式)
standard   (标准模式)
diagnostic (诊断模式)
```

渲染方式。

渲染格式绝不能改变语义结果。

---

# 365. 紧凑智能体模式 (Compact Agent Mode)

紧凑响应可以省略：

```text
冗余的描述信息 (redundant descriptions)
详尽的模式文档 (verbose schema docs)
```

同时保留：

```text
ID 标识
状态值 (statuses)
快照/收据坐标 (snapshot/receipt coordinates)
关键警告信息 (critical warnings)
```

---

# 366. 诊断模式 (Diagnostic Mode)

受治理策略约束，可以额外暴露：

```text
规范化 AST (normalized AST)
执行计划摘要 (plan digest)
各阶段耗时 (timings)
索引检查点 (index checkpoint)
授权依赖摘要 (authorization dependency summaries)
```

---

# 367. 诊断模式的信息泄露风险 (Diagnostic Mode Can Leak)

底层基础设施细节可能需要更高的调试 / 审计权限。

---

# 368. 耗时度量指标 (Timing Metrics)

运行时 **可以 (MAY)** 返回：

```text
parse_ms      (解析耗时)
search_ms     (搜索耗时)
projection_ms (投影耗时)
commit_ms     (提交耗时)
```

用于可观测性。

必须注意防止耗时度量成为推断机密存在性的实际预言机（oracle）。

---

# 369. 协议一致性等级 (Protocol Conformance Levels)

推荐的运行时测试套件：

```text
KIP Runtime Core (运行时核心)
KIP Runtime Readonly (运行时只读)
KIP Runtime Transactions (运行时事务)
KIP Runtime Streaming (运行时流式传输)
KIP Runtime Artifacts (运行时工件)
KIP Runtime Historical (运行时历史)
KIP Runtime High Assurance (运行时高保障)
```

---

# 370. 运行时核心套件 (Runtime Core)

**必须 (MUST)** 支持以下等效语义：

```text
KIP 版本字段 (KIP version field)
单操作执行 (single-operation execution)
KQL/KML/META 分类 (KQL/KML/META classification)
结构化参数绑定 (structural parameter binding)
空间解析 (Space resolution)
已认证的主体上下文 (authenticated Principal context)
标准响应/错误信封 (standard response/error envelope)
请求 ID (request IDs)
操作 ID (operation IDs)
能力描述 (capability description)
```

---

# 371. 运行时只读套件 (Runtime Readonly)

增加：

```text
专用只读入口点 (dedicated readonly entry point)
KQL/META 强制约束 (KQL/META enforcement)
演练/预览安全保证 (dry-run/preview safety)
只读违规检测 (readonly violation detection)
```

---

# 372. 运行时事务套件 (Runtime Transactions)

增加：

```text
原子执行 (atomic execution)
读己之写 (read-your-writes)
可串行化能力声明 (serializable capability declaration)
幂等性保证 (idempotency)
收据机制 (Receipts)
事务查询 (transaction lookup)
前置条件约束 (preconditions)
提交时授权重新验证 (commit-time authorization revalidation)
```

---

# 373. 运行时流式传输套件 (Runtime Streaming)

增加：

```text
通用流式帧封装 (generic stream framing)
KQL/历史/搜索流式传输 (KQL/history/search streaming)
变更流传输 (Change Stream transport)
取消与背压控制 (cancellation/backpressure)
终态终止帧 (terminal final frames)
```

---

# 374. 运行时工件套件 (Runtime Artifacts)

增加：

```text
工件句柄 (artifact handles)
上传与下载 (upload/download)
摘要校验 (digest verification)
胶囊/模式工件传输 (Capsule/Schema artifact transport)
资源受限的隔离解析 (resource-limited parsing)
```

---

# 375. 运行时历史套件 (Runtime Historical)

增加：

```text
快照令牌 (snapshot tokens)
历史 AS OF 查询 (historical AS OF)
事务历史记录 (transaction history)
变更留存管理 (change retention)
历史模式重建 (historical Schema reconstruction)
```

---

# 376. 运行时高保障套件 (Runtime High Assurance)

可以要求：

```text
签名收据 (signed Receipts)
规范请求/计划摘要 (canonical request/plan digests)
严格拒绝重复键 (strict duplicate-key rejection)
可审计的能力版本 (auditable capability versions)
精确索引检查点 (exact index checkpoints)
存在性中立安全行为 (existence-neutral security behavior)
强隔离级别 (strong isolation)
防篡改提交记录/检查点 (tamper-evident Commit Record/checkpoints)
```

---

# 377. 一致性测试夹具 —— 参数 (Conformance Fixtures — Parameters)

```text
包含引号的参数无法注入语法
包含 "WHERE" 的参数保持为字符串字面量
数值规范化稳定一致
拒绝 NaN 输入
缺失必需参数在执行前报错失败
多余未知参数根据既定规则发出警告或忽略
相同命令格式化产生相同的规范化请求摘要
```

---

# 378. 一致性测试夹具 —— 执行模式 (Conformance Fixtures — Execution Modes)

```text
独立读取可以使用不同的快照
独立写入可以按不同顺序提交

顺序模式中操作 1 写入提交
操作 2 读取可观察到操作 1 的变更
操作 2 报错失败
在 on_error=stop 下操作 3 被跳过
操作 1 的提交保持有效

原子模式中操作 1 创建证据
操作 2 创建断言
操作 3 报错失败
所有操作均不提交
```

---

# 379. 一致性测试夹具 —— 读己之写 (Conformance Fixtures — Read-Your-Writes)

```text
原子模式：
创建证据 E
后续断言引用 E
后续 KQL 读取可观察到 E
外部并发读取方在提交前绝无法观察到 E
```

---

# 380. 一致性测试夹具 —— 幂等性 (Conformance Fixtures — Idempotency)

```text
相同键 + 相同规范化请求
→ 相同收据 (Receipt)

相同键 + 不同参数
→ 幂等性冲突 (IdempotencyConflict)

相同 request_id + 新幂等性键
→ 不被视为同一逻辑写入

新 request_id + 相同幂等性键
→ 重试原始逻辑写入
```

---

# 381. 一致性测试夹具 —— 超时处理 (Conformance Fixtures — Timeout)

```text
服务端已提交
响应在传输中丢失
客户端触发超时
使用相同幂等性键重试
→ 返回原始事务收据

客户端在提交前明确取消并中止
→ 返回 aborted

取消与提交发生并发竞争
→ 返回 outcome_unknown / 需要查询
```

---

# 382. 一致性测试夹具 —— 只读模式 (Conformance Fixtures — Readonly)

```text
KQL 查询被接受
META 查询被接受
PREVIEW KML 被接受
KML 提交被拒绝
错误标注为 META 但解析为 KML 的命令被拒绝
```

---

# 383. 一致性测试夹具 —— 空间边界 (Conformance Fixtures — Space)

```text
显式空间 ID 解析成功
错误的 URI + ID 配对报错失败
context.counterparty 不会切换空间
隐藏空间返回存在性中立失败
跨空间引用不会自动遍历
```

---

# 384. 一致性测试夹具 —— 主体与执行者 (Conformance Fixtures — Principal / Actor)

```text
请求体中的 principal_id="admin" 被忽略或拒绝
传输层认证的主体保持权威性

KML 中声明 asserted_by Alice
在未获 assert_as_actor 授权时
仅在治理策略允许时记录归属
严禁假冒 Alice 身份
```

---

# 385. 一致性测试夹具 —— 模式管理 (Conformance Fixtures — Schema)

```text
原子事务一次性解析别名
并发默认值改变
语义计划保持精确不变

顺序模式中操作 1 使用旧模式
模式发生改变
操作 2 可以使用新模式
响应披露各自的版本

请求可串行化但不可用
→ 严禁静默降级
```

---

# 386. 一致性测试夹具 —— 搜索一致性 (Conformance Fixtures — Search)

```text
SEARCH 返回 index_seq 98
当前空间序列 space_seq 为 100
客户端可感知滞后

可串行化原子事务内部不支持 SEARCH
→ 显式报错
不伪造快照语义
```

---

# 387. 一致性测试夹具 —— 游标行为 (Conformance Fixtures — Cursors)

```text
在 SEARCH 中使用 KQL 游标
→ 报 CursorMismatch/TypeMismatch 错误

主体在获取下一页前权限被撤销
→ 继续遍历被拒绝

相同查询 + 相同 KQL 游标
→ 稳定的快照分页结果
```

---

# 388. 一致性测试夹具 —— 流式传输 (Conformance Fixtures — Streaming)

```text
原子写入发出进度帧
后续发生中止
先前的帧绝未声明已持久化创建

写入终态确认不明后数据流中断
客户端执行事务查询确认

KQL 流式数据行全部共享相同的快照
```

---

# 389. 一致性测试夹具 —— 工件处理 (Conformance Fixtures — Artifacts)

```text
工件句柄不被当作 URL/路径处理
错误摘要报错失败
过期句柄报错失败
胶囊上传不会导入认知数据
嵌入的包校验不会激活模式
```

---

# 390. 一致性测试夹具 —— 结果状态 (Conformance Fixtures — Results)

```text
顺序模式部分响应清晰标记：
操作 1 成功 + 收据
操作 2 失败
操作 3 已跳过

原子中止将暂存的先前操作标记为 rolled_back
不产生 space_seq

原子提交返回一个收据
```

---

# 391. 安全测试夹具 (Security Fixtures)

```text
调用方将 PURGE 命令标注为 META
只读端点予以拒绝

调用方提供 principal_id=owner
权限不发生改变

调用方篡改不透明游标
报错失败

调用方猜测工件句柄
治理策略予以拒绝

调用方在工件参数中嵌入 URL
不发生自动网络拉取

调用方发送包含重复 JSON 键的载荷
解析器予以拒绝

调用方尝试发送巨型深层嵌套载荷
资源限制予以拒绝

调用方依赖陈旧的能力缓存
当前治理策略予以拒绝
```

---

# 392. 协议交互工作流 (Protocol Interaction Workflow)

推荐的 v2 智能体交互流程：

```text
              ┌────────────────────┐
              │ DESCRIBE PRIMER    │ (获取引导信息)
              └─────────┬──────────┘
                        ▼
              capabilities/schema? (检查能力与模式)
                        │
                        ▼
            SEARCH / DESCRIBE grounding (搜索/描述以锚定概念)
                        │
                        ▼
                   KQL / BELIEF (查询/认识论投影)
                        │
                        ▼
                 reason outside tx (在事务外部进行推理)
                        │
                 ┌──────┴──────┐
                 │             │
                 ▼             ▼
             no write       write needed (需要写入)
             (无需写入)         │
                               ▼
                       VALIDATE/PREVIEW (校验/预览)
                         if appropriate
                               │
                               ▼
                      guarded KML/MUTATE (受守卫的 KML 变更)
                               │
                               ▼
                       atomic Transaction (原子事务提交)
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
                 Receipt            outcome unknown (结果未知)
                 (收据确认)                │
                                          ▼
                                DESCRIBE TRANSACTION (查询事务状态)
                                          │
                                          ▼
                                       Receipt (获取最终收据)
```

---

# 393. 读取路径示例 (Read Path Example)

请求：

```json
{
  "kip": "2.0",
  "request_id": "req-100",

  "space": {
    "uri": "personal://yan"
  },

  "execution": {
    "mode": "atomic"
  },

  "operations": [
    {
      "op_id": "q1",
      "language": "KQL",
      "command": "FIND(?slot) WHERE { ?slot BELIEF SLOT (:project_id, \"status\") } FOR TIME :now WITH EPISTEMIC {purpose:\"answer_user\", explanation:\"summary\"}",
      "parameters": {
        "project_id": "C-project",
        "now": "2026-08-14T00:00:00+08:00"
      }
    }
  ]
}
```

响应：

```json
{
  "kip": "2.0",
  "request_id": "req-100",
  "status": "succeeded",

  "results": [
    {
      "op_id": "q1",
      "status": "succeeded",
      "result": {
        "status": "accepted",
        "accepted_values": ["active"]
      },
      "context": {
        "snapshot_seq": 1500,
        "schema_environment_version": 17,
        "epistemic_policy": {
          "id": "default-recall",
          "version": "3"
        }
      }
    }
  ],

  "snapshot": {
    "snapshot_seq": 1500
  }
}
```

---

# 394. 原子形成写入示例 (Atomic Formation Example)

请求：

```json
{
  "kip": "2.0",
  "request_id": "req-101",

  "space": {
    "uri": "personal://yan"
  },

  "execution": {
    "mode": "atomic",
    "isolation": "serializable",
    "idempotency_key": "conversation:42:formation:turn:9"
  },

  "operations": [
    {
      "op_id": "write-memory",
      "language": "KML",
      "command": "MUTATE { CREATE EVIDENCE ?e { CLIENT KEY :e_key SET FIELDS { evidence_class:\"user_statement\", payload::payload, observed_at::time } } ENSURE PROPOSITION ?p (:alice, \"prefers\", :dark_mode) CREATE ASSERTION ?a { CLIENT KEY :a_key SET FIELDS { proposition:?p, asserted_by::alice, stance:\"support\", mode:\"stated\", confidence:1.0, asserted_at::time } SET STRUCTURAL { (\"evidence\", ?e) {role:\"support\"} } } }",
      "parameters": {
        "e_key": "message:42:evidence",
        "a_key": "message:42:assertion",
        "alice": "C-alice",
        "dark_mode": "C-dark-mode",
        "time": "2026-08-14T00:00:00+08:00",
        "payload": {
          "mode": "inline",
          "inline": {
            "text": "I prefer dark mode."
          }
        }
      }
    }
  ]
}
```

响应：

```json
{
  "kip": "2.0",
  "request_id": "req-101",
  "status": "succeeded",

  "results": [
    {
      "op_id": "write-memory",
      "status": "succeeded",
      "result": {
        "handles": {
          "e": {"id": "E-1", "created": true},
          "p": {"id": "P-7", "created": false},
          "a": {"id": "A-9", "created": true}
        }
      }
    }
  ],

  "receipt": {
    "tx_id": "tx-900",
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "space_seq": 1501,
    "committed_at": "2026-08-14T00:00:01+08:00",
    "status": "committed",
    "schema_environment_version": 17,
    "request_digest": "sha256:...",
    "semantic_plan_digest": "sha256:..."
  }
}
```

此处为便于阅读，将被观测的载荷表示为绑定参数。当运行时提供摄入上下文 (§7) 时，载荷
**应当 (SHOULD)** 通过 `ingest.evidence[]` 传输，命令 **应当 (SHOULD)** 以 `:key` 引用所铸造的
Evidence，而不是携带由模型撰写的被观测内容。

---

# 395. 响应丢失恢复示例 (Lost Response Example)

客户端未收到任何响应。

严禁直接断定：

```text
记忆未能存入。 (memory was not stored.)
```

执行查询：

```text
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY
"conversation:42:formation:turn:9"
```

可以返回：

```json
{
  "status": "committed",
  "tx_id": "tx-900",
  "space_seq": 1501
}
```

---

# 396. 顺序模式示例 (Sequence Example)

```json
{
  "kip": "2.0",

  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  },

  "operations": [
    {
      "op_id": "ground",
      "command": "SEARCH CONCEPT :name WITH TYPE \"Person\" LIMIT 5",
      "parameters": {"name": "Alice"}
    },

    {
      "op_id": "query",
      "command": "FIND(?x) WHERE {...}"
    },

    {
      "op_id": "write",
      "command": "MUTATE { ... }",
      "idempotency_key": "..."
    }
  ]
}
```

每个操作具有单独的执行边界。

跨操作不发生回滚。

---

# 397. 为何顺序模式不支持隐式结果注入 (Why Sequence Does Not Support Implicit Result Injection)

在单个文本请求内部，`query` 命令无法神奇地直接引用：

```text
ground.result[0].id
```

客户端应当：

```text
在接地锚定 (grounding) 后进行多轮往返交互 (round-trip after grounding)
```

或者使用预先已知的确定性精确选择器。

这保证了连线协议的强类型与可预测性。

---

# 398. 独立接地锚定示例 (Independent Grounding Example)

```json
{
  "kip": "2.0",

  "execution": {
    "mode": "independent"
  },

  "operations": [
    {
      "op_id": "zh",
      "command": "SEARCH CONCEPT :term MODE \"hybrid\" LIMIT 5",
      "parameters": {"term": "深色模式"}
    },

    {
      "op_id": "en",
      "command": "SEARCH CONCEPT :term MODE \"hybrid\" LIMIT 5",
      "parameters": {"term": "dark mode"}
    }
  ]
}
```

这些搜索操作可以并发运行。

---

# 399. 共享快照读取示例 (Shared Snapshot Read Example)

```json
{
  "kip": "2.0",

  "execution": {
    "mode": "atomic"
  },

  "operations": [
    {
      "op_id": "belief",
      "command": "..."
    },
    {
      "op_id": "experience",
      "command": "..."
    },
    {
      "op_id": "commitments",
      "command": "..."
    }
  ]
}
```

所有规范读取操作共享同一个快照。

---

# 400. 胶囊预览示例 (Capsule Preview Example)

```json
{
  "kip": "2.0",

  "space": {
    "id": "space-target"
  },

  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  },

  "operations": [
    {
      "op_id": "verify",
      "language": "META",
      "command": "VERIFY CAPSULE :capsule",
      "parameters": {
        "capsule": {
          "$artifact": "art-capsule-1"
        }
      }
    },

    {
      "op_id": "validate",
      "language": "META",
      "command": "VALIDATE CAPSULE :capsule",
      "parameters": {
        "capsule": {
          "$artifact": "art-capsule-1"
        }
      }
    },

    {
      "op_id": "preview",
      "language": "META",
      "command": "PREVIEW IMPORT CAPSULE :capsule INTO :space",
      "parameters": {
        "capsule": {
          "$artifact": "art-capsule-1"
        },
        "space": "space-target"
      }
    }
  ]
}
```

这些操作中的任何一个都不会导入认知数据。

---

# 401. 实际胶囊导入 (Actual Capsule Import)

实际导入使用带有以下要素的状态变更受保护操作 / 事务：

```text
胶囊摘要 (Capsule digest)
目标空间 (target Space)
导入模式 (import mode)
导入执行计划摘要/映射 (import plan digest/mappings)
幂等性键 (idempotency key)
提交时治理验证 (commit-time Governance)
```

它有意不被伪装为 META。

---

# 402. 变更消费方示例 (Change Consumer Example)

请求：

```text
CHANGES SINCE :cursor LIMIT 100
```

响应可以流式传输：

```text
信封序号 1501 (Envelope seq 1501)
信封序号 1502 (Envelope seq 1502)
...
```

消费方仅在根据其自身语义对信封进行了持久化处理之后才记录游标。

---

# 403. 不预设精确一次交付 (Exactly-Once Is Not Assumed)

变更交付可能是：

```text
至少一次交付 (at-least-once)
```

消费方根据以下维度去重：

```text
Space + space_seq + tx_id
```

---

# 404. 请求重放不等同于变更重放 (Request Replay Is Not Change Replay)

两个独立的层级：

```text
幂等性注册表 (idempotency registry)
    防止重复的写入执行 (prevents duplicate write execution)

变更消费方去重 (change consumer dedupe)
    防止下游重复处理 (prevents duplicate downstream processing)
```

两者均不可或缺。

---

# 405. 协议安全边界 (Protocol Security Boundaries)

运行时必须防范：

```text
命令注入 (command injection)
参数注入 (parameter injection)
主体身份冒用 (Principal spoofing)
空间混淆 (Space confusion)
语言标签伪造 (language-label spoofing)
游标伪造 (cursor forgery)
工件句柄猜测 (artifact-handle guessing)
URL 网络拉取注入 (URL fetch injection)
请求重放 (request replay)
幂等性冲突碰撞 (idempotency collision)
超时导致重复写入 (timeout duplicate writes)
模式降级 (Schema downgrade)
隔离级别降级 (isolation downgrade)
只读模式绕过 (readonly bypass)
资源耗尽 (resource exhaustion)
数据流混淆 (stream confusion)
错误信息侧信道泄露 (error side channels)
```

---

# 406. 命令注入防御 (Command Injection Defense)

结构化参数绑定可防止输入值转变为可执行的 KIP 语法。

---

# 407. 主体身份冒用防御 (Principal Spoofing Defense)

受信任的主体来自传输层身份认证，绝不来自命令文本。

---

# 408. 空间混淆防御 (Space Confusion Defense)

响应回显已解析的空间标识。

事务收据显式绑定实际空间。

---

# 409. 语言标签伪造防御 (Language Spoofing Defense)

运行时必须解析 / 分类命令的实际语义。

---

# 410. 游标伪造防御 (Cursor Forgery Defense)

游标是不透明 / 经认证的，或在服务端映射。

非法篡改将报错失败。

---

# 411. 工件句柄越权防御 (Artifact Handle Defense)

采用不透明、不可猜测或经过访问控制的句柄。

不具备路径遍历语义。

---

# 412. URL 网络拉取注入防御 (URL Fetch Defense)

工件引用不会引发任意的网络访问。

---

# 413. 请求重放防御 (Replay Defense)

写入操作适时使用幂等性键和元素客户端键。

---

# 414. 超时重复写入防御 (Timeout Duplicate Defense)

未知结果触发查询 / 相同键重试机制。

---

# 415. 模式降级防御 (Schema Downgrade Defense)

精确的语义要求与能力前置条件无法满足时报错失败，而非静默降级。

---

# 416. 隔离级别降级防御 (Isolation Downgrade Defense)

所请求的隔离级别必须得到满足，否则报错拒绝。

---

# 417. 只读模式绕过防御 (Readonly Bypass Defense)

以语义解析器的分类结果为权威依据。

---

# 418. 资源耗尽攻击防御 (Resource Exhaustion Defense)

在尽可能可行的情况下，在执行昂贵操作前强制实施配额限制。

---

# 419. 数据流混淆防御 (Stream Confusion Defense)

数据帧严格绑定：

```text
stream_id
request_id
op_id
frame_seq
```

以及传输层身份认证上下文。

---

# 420. 错误侧信道防御 (Error Side-Channel Defense)

存在性中立错误与治理优先过滤可防止机密被轻易穷举探测。

---

# 421. 请求规范化安全性 (Request Canonicalization Security)

规范化请求摘要绝不能依赖于解析器的歧义行为。

重复的 JSON 键与畸形 Unicode 会被直接拒绝。

---

# 422. 幂等性摘要安全性 (Idempotency Digest Security)

相同的幂等性键绑定至：

```text
request digest (请求摘要)
```

从而防止攻击者 / 客户端 Bug 静默将同一键复用于另一次状态变更。

---

# 423. 收据替换防御 (Receipt Substitution Defense)

高保障客户端验证：

```text
请求摘要 (request digest)
空间 (Space)
tx_id
结果摘要 (result digest)
签名/证明 (若受支持)
```

---

# 424. 结果历史溯源 (Result Provenance)

智能体后续的行动在有益时可以保留：

```text
源查询请求摘要 (source query request digest)
snapshot_seq
事务收据 (tx Receipt)
胶囊摘要 (Capsule digest)
```

作为外部决策历史溯源。

---

# 425. 运行时不存储思维链 (Runtime Does Not Store Chain-of-Thought)

请求 / 响应日志可以包含：

```text
KIP 命令 (KIP commands)
结构化决策摘要 (structured decision summaries)
```

但 KIP 不强制要求存储私有模型的推理思考过程痕迹。

---

# 426. 模型工具人机工程学 (Model Tool Ergonomics)

运行时契约应当保持易于封装为一个或两个模型工具的形式。

模型无需理解 HTTP 状态码、TCP 重试或数据库底层事务即可正确使用 KIP。

---

# 427. 工具描述应当教会三件事 (Tool Description Should Teach Three Things)

至少包含：

```text
读取使用只读工具 (use readonly for reads)
写入使用幂等性键 (use idempotency key for writes)
多项变更需同时提交时使用原子模式 (use atomic mode when changes must commit together)
```

---

# 428. 工具描述应当阐明结果不确定性 (Tool Description Should Teach Outcome Uncertainty)

对于写入操作：

```text
超时/网络失败
→ 查询/使用相同幂等性键重试
```

必须写入工具契约中，而不仅仅体现在文档中。

---

# 429. 工具描述应当阐明搜索边界 (Tool Description Should Teach Search Boundary)

```text
SEARCH 负责接地锚定 (SEARCH grounds)
KQL/BELIEF 负责建立结构化认知结果 (KQL/BELIEF establishes structured cognitive result)
```

---

# 430. 工具描述应当阐明主体与自我边界 (Tool Description Should Teach Principal/Self Boundary)

工具所使用的已认证用户 / 智能体身份并不自动等同于语义上的 `$self`。

---

# 431. 推荐的 `execute_kip_readonly` 输入 (`execute_kip_readonly` Input)

概念结构：

```json
{
  "kip": "2.0",
  "request_id": "...",
  "space": {...},
  "execution": {...},
  "operations": [...],
  "context": {...},
  "options": {...}
}
```

无需单独的特定语法。

---

# 432. 推荐的 `execute_kip` 输入 (`execute_kip` Input)

相同的信封结构。

差别在于工具 / 端点的权限范围。

---

# 433. 只读工具应当更容易被授权 (Readonly Tool Should Be Easier to Grant)

部署环境可以向智能体子进程：

```text
广泛授予只读工具 (readonly tool broadly)
严格限制写入工具 (write tool narrowly)
```

---

# 434. 记忆形成大脑 (Formation Brain)

记忆形成组件可以获得：

```text
只读接地锚定 (readonly grounding)
+
写入事务权限 (write transaction)
```

---

# 435. 记忆回忆大脑 (Recall Brain)

回忆组件可以仅获得：

```text
只读 KQL/META/搜索/投影 (readonly KQL/META/search/project)
```

权限，不暴露任何 KML 提交接口。

---

# 436. 记忆维护大脑 (Maintenance Brain)

维护组件可以获得：

```text
只读 (readonly)
+
维护 (maintain)
+
留存管理 (retention)
+
有界的 Profile 更新 (bounded Profile updates)
```

权限，而不具备：

```text
管理治理策略 (manage Governance)
以此任意执行者身份断言 (assert_as arbitrary actor)
```

---

# 437. 外部业务智能体 (External Business Agent)

可以完全没有直接的 KIP 写入权限。

它可以与记忆形成 / 大脑服务进行交互通信。

这属于部署架构设计，而非协议硬性要求。

---

# 438. 运行时最小特权原则 (Runtime Principle of Least Authority)

协议暴露面应当使按组件进行细粒度工具授权变得切合实际。

---

# 439. 形式化信封草图 (Formal Envelope Sketch)

非规范性描述：

```text
request :=
{
  kip,
  request_id?,
  space?,
  compatibility_profile?,
  execution?,
  read?,
  ingest?,
  preconditions?,
  operations[1..N],
  parameters?,
  context?,
  requires?,
  options?,
  extensions?
}

operation :=
{
  op_id?,
  language?,
  command | ast,
  parameters?,
  idempotency_key?,
  options?,
  extensions?
}

execution :=
{
  mode: independent | sequence | atomic,
  on_error?: stop | continue,
  isolation?,
  idempotency_key?,
  extensions?
}

response :=
{
  kip,
  request_id?,
  status,
  execution?,
  results[],
  context?,
  snapshot?,
  receipt?,
  warnings?,
  next_cursor?,
  error?,
  extensions?
}
```

---

# 440. 请求校验处理顺序 (Request Validation Order)

推荐流程：

```text
1. 传输层身份认证 (transport authentication)
2. 解析顶级请求信封 (parse top-level envelope)
3. 协议/版本协商 (protocol/version negotiation)
4. 解析目标空间 (resolve Space)
5. 校验执行模式 (validate execution mode)
6. 校验操作数量/大小 (validate operation count/size)
7. 解析/分类操作命令 (parse/classify operations)
8. 绑定参数 (bind parameters)
9. 执行只读/写入端点守卫校验 (enforce readonly/write entry point)
10. 解析幂等性 (若适用)
11. 绑定快照/模式/治理上下文 (bind snapshot/Schema/Governance context)
12. 按指定模式执行 (execute according to mode)
```

对于原子事务，随后进入详细的事务执行阶段。

---

# 441. 为何身份认证排在最前 (Why Authentication Comes First)

在披露以下信息之前：

```text
空间存在性 (Space existence)
模式定义 (Schema)
能力详情 (capabilities)
错误细节 (error detail)
```

运行时必须先建立受信任的主体（Principal）上下文。

公共协议能力端点可以有意允许有限受限视图的匿名访问。

---

# 442. 为何空间解析先于模式解析 (Why Space Resolution Precedes Schema Resolution)

模式环境（Schema Environment）是特定于具体空间的。

谓词别名在另一个空间中可能会解析为完全不同的语义。

---

# 443. 为何只读分类先于执行 (Why Readonly Classification Precedes Execution)

在应用只读守卫校验之前，绝不应执行任何状态变更的解析器分支路径。

---

# 444. 为何幂等性检查先于写入重执行 (Why Idempotency Precedes Write Re-Execution)

已知的先前事务应当直接返回其结果，而非重新运行昂贵或具破坏性的逻辑。

---

# 445. 为何提交阶段必须重新验证治理权限 (Why Commit Revalidates Governance)

请求发出时的授权判断可能会随时间失效。

在正式提交前，权限撤销始终具有最高优先权。

---

# 446. 形式化响应状态机 (Formal Response State Machine)

```text
请求已接收 (request accepted)
      │
      ▼
解析/绑定 (parsing/binding)
      │
      ├ 失败 → failed
      ▼
执行阶段 (execution)
      │
      ├ 只读成功 → succeeded
      │
      ├ 顺序混合结果 → partial
      │
      ├ 原子中止 → failed
      │
      ├ 原子提交 → succeeded
      │
      └ 传输不确定性 → outcome_unknown
```

---

# 447. 事务状态 vs. 请求状态 (Transaction State vs. Request State)

某个请求的状态可能是：

```text
outcome_unknown (结果未知)
```

而其底层的事务实际上已经：

```text
committed (已提交)
```

明确这一区分至关重要。

---

# 448. 智能体友好型恢复状态 (Agent-Friendly Recovery State)

`outcome_unknown` 响应 **应当 (SHOULD)** 包含足够的安全数据以便进行恢复：

```text
request_id
idempotency_key
可能的事务查询方法 (possible tx lookup method)
```

---

# 449. 运行时客户端严禁自动重试重复写入 (No Automatic Duplicate Retry by Runtime Client)

通用客户端库应当在安全的情况下自动重试只读请求。

对于写入请求，仅在满足以下条件且在明确定义的重试策略下，才可以自动重试：

```text
相同的幂等性键 (same idempotency key)
相同的请求摘要 (same request digest)
```

---

# 450. 客户端 SDK 重试策略 (Client Library Retry)

推荐策略：

```text
只读瞬态失败
    → 自动重试 (retry)

幂等写入传输失败
    → 使用相同键重试/查询 (same-key retry/lookup)

无键非幂等写入
    → 暴露结果未知的不确定状态 (surface outcome uncertainty)
```

---

# 451. 无幂等性键的写入操作 (Write Without Idempotency Key)

运行时 **可以 (MAY)** 允许该行为。

客户端应当明确知晓：

```text
网络失败可能导致无法进行安全重试。 (network failure may make safe retry impossible.)
```

高可靠性的智能体运行时在处理外部事件 / 重要写入时 **应当 (SHOULD)** 要求提供幂等性键。

---

# 452. 自动生成的幂等性键 (Auto-Generated Idempotency Key)

客户端 SDK **可以 (MAY)** 为单次调用生成键。

但如果应用程序在崩溃 / 重试过程中丢失了该键，该保护机制就会失效。

基于源事件派生的键在可用时保障更强。

---

# 453. 幂等性键的隐私保护 (Idempotency Privacy)

键可能包含敏感的外部标识符。

如果日志 / 收据会暴露该键，客户端 **应当 (SHOULD)** 对其进行哈希处理或命名空间隔离，而非嵌入私有明文。

---

# 454. 事务查询隐私保护 (Transaction Lookup Privacy)

按幂等性键进行查询必须要求匹配已授权的命名空间 / 主体。

严禁将其演变为全局事务枚举 API。

---

# 455. 收据留存周期 (Receipt Retention)

在存在留存上限的情况下，运行时能力应当说明：

```text
transaction_lookup_retention (事务查询留存期)
receipt_retention            (收据留存期)
```

---

# 456. 客户端持久化收据 (Durable Client Receipts)

客户端可以出于长期审计目的在外部持久化存储收据。

收据副本并不代表有权修改认知中枢。

---

# 457. 签名收据的便携性 (Signed Receipt Portability)

签名收据可以作为证明某个中枢提交了特定事务的便携式证据。

其他系统是否信任该中枢仍属于本地策略范畴。

---

# 458. 变更信封的权威溯源 (Change Envelope Origin)

变更信封引用该事务实际的：

```text
tx_id
space_seq
```

而非将客户端请求 ID 作为排序权威依据。

---

# 459. 搜索索引消费方 (Search Index Consumer)

搜索索引更新 **应当 (SHOULD)** 幂等地消费变更信封。

如果某个信封被重放：

```text
索引状态不会重复累加认知计数器。 (index state does not double-apply cognitive counters.)
```

---

# 460. 投影缓存消费方 (Projection Cache Consumer)

认识论缓存失效可以使用变更流中的以下信息：

```text
space_seq
已变更的元素类型 (changed kinds)
治理/模式变更 (Governance/schema changes)
```

---

# 461. 运行时自描述能力 (Runtime Self-Description)

META `DESCRIBE PROTOCOL/CAPABILITIES` 本身即是运行时契约的一部分。

运行时不应当要求通过带外文档来发现受支持的基本语义。

---

# 462. 错误注册表 (Error Registry)

`DESCRIBE ERROR` 允许模型客户端在无需随附庞大静态错误手册的情况下自主恢复。

---

# 463. 模式引导 Primer 自动注入 (Schema Primer Injection)

运行时 / SDK 可以为模型会话自动注入 / 缓存：

```text
DESCRIBE PRIMER
```

它应当保留 Primer 的版本 / 摘要信息。

---

# 464. 自动 Primer 不属于隐藏语义输入 (Auto-Primer Is Not Hidden Semantic Input)

客户端 / 智能体应当能够检查其接收到了哪个 Primer 及其版本。

---

# 465. 协议运行时与可复现性 (Protocol Runtime and Reproducibility)

高保障决策可以记录：

```text
请求摘要 (request digest)
快照序列号 snapshot_seq (snapshot_seq)
模式环境 (Schema Environment)
认识论策略 (Epistemic Policy)
收据 (Receipt)
工件摘要 (artifact digest)
```

足以重建外部决策输入。

---

# 466. 可复现性是有界的 (Reproducibility Is Bounded)

在以下情况下，完美重放可能会失败：

```text
历史证据已被物理清除 (historical Evidence purged)
模型辅助投影不可用 (model-assisted Projection unavailable)
外部工件不可用 (external artifact unavailable)
旧模式包丢失 (old Schema package lost)
```

运行时应当声明这些局限性。

---

# 467. 协议运行时与确定性 (Protocol Runtime and Determinism)

KIP 在规范指定的地方要求确定性的结构语义。

它不强制要求所有的：

```text
语义搜索 (semantic SEARCH)
模型辅助投影 (model-assisted Projection)
```

在数学上完全确定。

响应必须充分标识其方法 / 版本 / 上下文。

---

# 468. 事务确定性 (Transaction Determinism)

无论底层采用何种执行计划实现：

```text
已提交的持久化状态 (committed durable state)
收据 (Receipt)
space_seq 排序 (space_seq ordering)
```

都必须清晰无歧义。

---

# 469. 包含非确定性读取的请求摘要 (Request Digest with Nondeterministic Read)

读取请求摘要标识的是请求本身，而不必然代表未来完全相同的搜索结果。

解释结果的可复现性需要依赖快照 / 索引 / 方法上下文。

---

# 470. 状态转换权威性 (State Transition Authority)

只有：

```text
已提交的事务 (committed Transaction)
```

才能改变 KIP 的持久化状态。

以下任何状态：

```text
请求已接收 (request accepted)
预览 (preview)
校验 (validation)
进度帧 (progress frame)
```

均无法改变持久化状态。

---

# 471. 协议运行时不变式 (Protocol Runtime Invariants)

以下为规范性设计目标：

1. KIP 运行时语义与传输层完全无关。
2. 身份认证主体（Principal）来自受信任的传输层 / 运行时上下文。
3. 调用方提供的 Principal 字段无法自行授予权限。
4. 语义执行者（Semantic Actor）标识与经过认证的主体（Principal）相互独立。
5. 每个认知操作均解析至一个 MemorySpace，除非显式适用了跨空间能力。
6. 上下文提示绝不会静默改变空间。
7. 请求中明确标识 KIP 协议版本。
8. `request_id` 标识单次传输尝试。
9. `request_id` 不是幂等性键。
10. `request_id` 不是事务 ID。
11. `op_id` 属于请求局部标识。
12. 操作语言标签会根据解析后的实际语义进行核验。
13. 语言标签无法绕过只读强制约束。
14. 命令参数采用结构化绑定，严禁文本拼接插值。
15. 参数无法向命令中注入 KIP 语法。
16. 非法的 Core 数值必须被拒绝。
17. 规范化请求摘要忽略无关的格式排版差异。
18. 请求摘要与语义执行计划摘要相互独立。
19. 原生多操作请求必须显式声明执行模式。
20. `independent` 独立操作之间不存在跨操作语义依赖。
21. 独立操作可以并发执行。
22. 独立状态变更操作分别独立提交。
23. `sequence` 顺序操作按序依次启动。
24. 顺序状态变更操作分别独立提交。
25. 顺序模式不会回滚先前的提交。
26. 顺序模式中的后续操作至少能观察到先前已提交的效果。
27. 顺序模式在各操作之间可以观察到不相关的并发提交。
28. `atomic` 原子操作在单个事务中执行。
29. 原子模式具有单一启动快照。
30. 原子模式提供读己之写（read-your-writes）保证。
31. 原子模式杜绝脏读。
32. 原子写入全部提交或全部不提交。
33. 原子写入具有单一 tx_id 与单一状态变更 space_seq。
34. 原子只读批处理可以共享单一快照而不产生状态变更收据。
35. 原子模式内部的 `MUTATE` 不会创建嵌套提交语义。
36. 外部现实世界的副作用不受 KIP 回滚管理。
37. 所请求的隔离级别严禁被静默降级。
38. 所请求的语义能力严禁被静默降级。
39. 状态变更重试 **应当 (SHOULD)** 使用幂等性键。
40. 幂等性键标识逻辑变更意图。
41. 相同幂等性键 + 相同请求返回原始终态结果。
42. 相同幂等性键 + 不同请求报错失败。
43. 幂等性留存期是可发现且有界的。
44. `client_key` 与事务幂等性解决的是不同层面的问题。
45. 请求 ID、幂等性键与事务 ID 保持严格区分。
46. 快照令牌是不透明的。
47. 快照令牌不代表访问权限。
48. 当前治理策略优先于旧快照令牌的访问权限。
49. 独立操作可以读取不同的快照。
50. 顺序操作可以读取不同有序排列的快照。
51. 原子操作共享同一个事务快照。
52. SEARCH 索引检查点不自动等同于规范事务快照。
53. 原子模式内部不支持快照一致性 SEARCH 时显式报错，而非伪造一致性。
54. **应当 (SHOULD)** 存在专用的只读执行路径。
55. 只读路径校验实际语义，而非仅看调用方标签。
56. 只读 KQL / META 绝不改变认知状态。
57. 预览 / 演练模式默认不持久化保留 ID。
58. 预览 / 演练模式不持久化消耗客户端键。
59. 预览 / 演练模式不生成变更信封。
60. 预览 / 演练模式不保证未来必然能成功提交。
61. 截止时间 / 超时不是事务已中止的证明。
62. 在提交阶段周围，对写入操作的取消属于尽力而为。
63. 模棱两可的写入结果需要通过事务查询或相同键重试来解决。
64. 客户端严禁仅因响应丢失就创建全新的逻辑写入。
65. 在安全的前提下，资源限制是显式且可被发现的。
66. 原子写入在遭遇资源超限失败时绝不进行部分提交。
67. 顺序 / 独立模式的部分成功状态必须显式表示。
68. 顶级请求状态与底层事务状态相互独立。
69. `outcome_unknown` 属于请求观测状态，而非持久化事务状态。
70. 操作结果明确标识 op_id 与状态。
71. 事务中止后，暂存执行的原子操作可以被报告为 `rolled_back`。
72. 状态变更收据是关于提交事实的引擎底层真相。
73. 客户端无法伪造 tx_id / space_seq / committed_at。
74. 无效果的状态变更不产生认知版本 / space_seq 的无谓递增。
75. 错误对象具有稳定的机器代码与类别。
76. 错误提示无法授予权限或泄露受保护对象的存在性。
77. 在策略需要时使用存在性中立错误。
78. 各游标类别是不透明且互不通用的。
79. 游标绝不保留已被撤销的权限。
80. KQL 分页游标固定规范快照语义。
81. SEARCH 游标固定声明的索引 / 排序语义，而非规范真理。
82. CHANGES 游标固定提交日志流位置。
83. 流式帧属于传输交付单元，而非认知提交。
84. 原子写入进度帧无法声明未提交的数据已具有持久性。
85. 最终收据 / 终态状态确立写入结果。
86. 变更信封完整保留事务边界。
87. 变更重放不属于新的认知操作。
88. 工件句柄是不透明的运行时引用。
89. 工件句柄不是文件系统路径或 URL。
90. 工件句柄不是便携式的认知标识。
91. 工件访问受治理策略管控。
92. 工件上传本身不会导入任何认知数据。
93. 任意外部 URL 不会被自动拉取。
94. 声明的工件摘要在受信任的语义使用前必须经过校验。
95. 不可信工件在严格的资源限制下进行解析。
96. 传输层分块不改变胶囊标识。
97. 运行时支持能力与实际生效授权是可内省但彼此解耦的。
98. 兼容性 Profile 必须显式声明。
99. 原生 v2 不会静默继承 v1 的混合批处理错误规则。
100. 运行时必须始终能够清晰区分“已请求”、“已预览”、“已提交”与“结果未知”。

---

# 472. 核心运行时等式 (Core Runtime Equations)

```text
请求 ID (Request ID)
    ≠
幂等性键 (Idempotency Key)
    ≠
事务 ID (Transaction ID)
```

---

```text
批处理 (Batch)
    ≠
事务 (Transaction)
```

---

```text
独立模式 (Independent)
    =
    共享传输 (Shared Transport)
    +
    独立语义 (Separate Semantics)
```

---

```text
顺序模式 (Sequence)
    =
    有序操作 (Ordered Operations)
    +
    独立提交 (Separate Commits)
```

---

```text
原子模式 (Atomic)
    =
    单一快照 (One Snapshot)
    +
    读己之写 (Read-Your-Writes)
    +
    单一提交边界 (One Commit Boundary)
```

---

```text
超时 (Timeout)
    ≠
中止 (Abort)
```

---

```text
进度 (Progress)
    ≠
提交 (Commit)
```

---

```text
预览 (Preview)
    ≠
保留 (Reservation)
    ≠
提交 (Commit)
```

---

```text
搜索索引状态 (Search Index State)
    ≠
规范认知状态 (Canonical Cognitive State)
```

---

```text
工件句柄 (Artifact Handle)
    ≠
工件内容标识 (Artifact Content Identity)
```

---

```text
认证主体 (Authenticated Principal)
    ≠
语义执行者 (Semantic Actor)
```

---

```text
受支持的能力 (Supported Capability)
    ≠
已授权的操作 (Authorized Operation)
```

---

# 473. 终极架构蓝图 (Final Architecture)

```text
                         智能体 / 客户端 (Agent / Client)
                               │
                               ▼
                      KIP 请求信封 (KIP Request Envelope)
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
       request_id          参数 (parameters)    执行控制 (execution)
       空间 (Space)         工件 (artifacts)     模式 (mode)
       意图/风险 (purpose/risk) 快照 (snapshot)  幂等性 (idempotency)
           │                   │                   │
           └───────────────────┼───────────────────┘
                               ▼
                     传输层身份认证 (Transport Authentication)
                               │
                               ▼
                       已认证主体 (Authenticated Principal)
                               │
                               ▼
                        解析空间 (Resolve MemorySpace)
                               │
                               ▼
                  解析 / 分类 / 绑定命令 (Parse / Classify / Bind)
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
              KQL             KML             META
               │               │               │
               └───────────────┼───────────────┘
                               ▼
                       执行语义 (Execution Semantics)
                  independent / sequence / atomic
                               │
               ┌───────────────┼───────────────┐
               │                               │
               ▼                               ▼
           读取运行时 (Read Runtime)     事务运行时 (Transaction Runtime)
               │                               │
       快照 / 索引 (snapshot / index)    快照 + 模式 (snapshot + schema)
       治理 (Governance)               治理 + 幂等性 (Governance + idempotency)
       投影 (projection)               暂存写入集 (tentative write set)
               │                               │
               │                       提交时重新校验 (commit-time revalidation)
               │                               │
               └───────────────┬───────────────┘
                               ▼
                           结果状态 (Result State)
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
           读取结果         收据 (Receipt)    错误 / 结果未知
           + 上下文         tx_id / seq      error / outcome_unknown
               │               │               │
               └───────────────┼───────────────┘
                               ▼
                     响应 / 流式帧 (Response / Stream Frames)
                               │
                               ▼
                         智能体 / 客户端 (Agent / Client)
```

---

# 474. 一句话概括运行时契约 (The Runtime Contract in One Sentence)

协议运行时为每一次交互回答四个核心问题：

```text
你请求了什么？ (What did you ask?)
在何种受信任的上下文下对其进行了解释？ (Under which trusted context was it interpreted?)
认知中枢实际观察 / 改变了什么状态？ (What state did the Nexus actually observe/change?)
我们对该操作已成功提交有多大程度的确定性？ (How certain are we that the operation committed?)
```

---

# 475. 核心治理原则 (Final Principle)

如果在运行时边界上智能体无法再清晰区分以下概念，则记忆协议宣告失效：

```text
请求 vs 事务 (a request from a transaction)
重试 vs 重复经验 (a retry from a repeated experience)
超时 vs 中止 (a timeout from an abort)
搜索命中 vs 规范状态 (a search hit from canonical state)
预览 vs 提交 (a preview from a commit)
调用主体 vs 语义执行者 (a Principal from a semantic actor)
普通批处理 vs 原子变更 (a batch from an atomic change)
流式进度消息 vs 持久化历史 (a streamed progress message from durable history)
工件句柄 vs 工件内容标识 (an artifact handle from the artifact's identity)
受支持的特性 vs 已授权的能力 (a supported feature from an authorized capability)
```

这些区分绝非无关紧要的实现细枝末节。

它们决定了一个长期存在的智能体大脑（Agent Brain）是否能够在真实的不可靠网络、各类故障、重试重放、模式演变、并发智能体交互以及多系统实现之间，始终完整保留：

```text
准确的历史记录 (correct history)
安全的执行权限 (safe authority)
一致的身份标识 (consistent identity)
幂等的学习机制 (idempotent learning)
可复现的回忆能力 (reproducible recall)
可审计的行动记录 (auditable action)
便携的记忆资产 (portable memory)
```

核心指导思想是：

> **只有当智能体能够明确区分“它想要做什么”与“大脑能够证明实际发生了什么”之间的差异时，认知中枢（Cognitive Nexus）才是真正可靠的。**

KIP 2.0 协议运行时就是使这一差异清晰可见的基石契约。
