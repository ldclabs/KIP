# KIP 2.0 事务模型设计 (Transactions)

**[English](./KIP-2.0-Transactions.md) | [中文](./KIP-2.0-Transactions_CN.md)**

## 规范状态 (Status)

**事务模型提案 / 预规范草案 (Transaction Model Proposal / Pre-Specification Draft)**

本文档定义了 KIP 2.0 的事务架构：阐述认知、认识论、模式（Schema）、治理、维护、迁移和导入等状态转换如何在认知中枢（Cognitive Nexus）中成为原子性（atomic）、持久性（durable）、幂等性（idempotent）、可审计（auditable）且具备历史可重构性（historically reconstructable）的变更。

它直接构建于以下规范基础之上：

- [KIP-2.0-Architecture.md](KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)

核心数据模型（Core Data Model）要求每次持久化写入必须归属于一个引擎事务，并将事务确立为以下机制的历史底层基质：

```text
audit (审计)
change stream (变更流)
migration (迁移)
origin (起源)
idempotency (幂等性)
bitemporal reconstruction (双时态重构)
```

认识模型（Epistemic Model）要求断言（Assertion）的生命周期转换必须在历史上具备可重构性。

治理模型（Governance）要求高影响力的权限变更必须是原子性的且在历史上可解释。

模式包模型（Schema Packages）要求每个事务必须针对一个已解析的模式环境快照（Schema Environment snapshot）执行，且模式环境本身的激活也必须是原子的。

本文档将这些要求具象化落地。

其核心论点是：

> **KIP 事务是大脑认知状态中最小的不可分割的持久化变更。**

事务绝不仅仅是：

```text
a batch of commands (一组批处理命令)
a database session (一个数据库会话)
a transport optimization (一种传输层优化)
a list of mutations (一系列变更突变列表)
```

它代表了一次连贯一致的状态转换，认知中枢在未来的认知历史中可以将其解释为：

> **“在认知历史的这一刻，在此模式与权限上下文之下，发生了这一完整的变更。”**

---

# 0. 规范性用词定义 (Normative Language)

关键词 **必须 (MUST)**、**严禁 (MUST NOT)**、**必需 (REQUIRED)**、**应当 (SHOULD)**、**不得 (SHOULD NOT)**、**可以 (MAY)** 和 **可选 (OPTIONAL)** 用于表示未来 KIP 2.0 规范的预期要求。

除非另有明确说明，具体的 API 名称、请求 JSON 和 KML 语法仅作为说明性示例。

事务的语义才是规范的核心所在。

---

# 1. 为什么事务属于认知语义范畴 (Why Transactions Are Cognitive Semantics)

考虑一次信念修正（Belief Correction）的场景：

```text
Evidence E1 (证据 E1)
    supported old Assertion A1 (支持旧断言 A1)

new Evidence E2 arrives (新证据 E2 到达)
```

一次正确的修正可能需要执行以下步骤：

```text
1. create Evidence E2 (创建证据 E2)
2. create Assertion A2 (创建断言 A2)
3. mark A1 superseded (将 A1 标记为被废弃替代)
4. create Activity C1 linking E2/A1 → A2 (创建活动 C1 将 E2/A1 关联至 A2)
```

如果只有步骤 1–2 成功：

```text
old Assertion remains active (旧断言仍然保持活跃)
new Assertion exists (新断言同时存在)
```

如果只有步骤 1–3 成功：

```text
the provenance Activity is missing (溯源活动丢失)
```

如果只有步骤 3 成功：

```text
the Brain loses its active belief with no replacement (大脑失去了活跃信念且无替代项)
```

这些问题不仅仅是数据库层面的不一致。

它们直接改变了智能体（Agent）所坚信的内容。

因此：

> **原子性是认知正确性（Cognitive Correctness）不可分割的一部分。**

---

# 2. 核心事务方程 (Core Transaction Equation)

一个已提交的 KIP 事务表示：

```text
State_before (变更前状态)
      │
      │ authorized + validated transition (已授权且已验证的转换)
      ▼
State_after (变更后状态)
```

从而保证任何观察者都绝不可能观察到：

```text
some-but-not-all (部分发生而非全部发生)
```

的已提交持久化变更。

从概念上定义：

```text
T:
    S_n → S_n+1
```

其中 `S_n` 是一个连贯一致的记忆空间状态（Space state）。

---

# 3. 事务 vs. 命令 (Transaction vs. Command)

**命令（Command）** 表达的是一次操作。

**事务（Transaction）** 则定义了围绕一个或多个操作的原子性、快照、授权、验证、提交、历史记录和回执凭证边界。

因此：

```text
Command ≠ Transaction (命令 ≠ 事务)
```

单个命令可以在一个隐式事务中运行。

多个命令可以依据请求的不同：

```text
independently (各自独立运行)
or (或者)
inside one explicit transaction (在单个显式事务内运行)
```

---

# 4. 传输批处理 vs. 原子事务 (Transport Batch vs. Atomic Transaction)

这一区分具有规范性约束力。

## 4.1 传输批处理 (Transport Batch)

传输批处理（Transport Batch）：

```text
commands[]
```

其存在的目的是减少网络往返延迟。

各命令依据常规命令语义独立执行。

先前的成功写入绝不会仅仅因为后续命令失败而发生回滚。

---

## 4.2 原子事务 (Atomic Transaction)

显式事务（Explicit Transaction）意味着：

```text
all durable mutations commit (所有持久化突变全部提交)
or (或者)
none become visible (全部对外不可见)
```

如果任何必要的操作发生失败：

```text
transaction aborts (事务中止)
```

且不会暴露任何持久化的部分中间状态。

---

# 5. 为什么两者都需要 (Why Both Are Needed)

传输批处理适用于高效率执行以下操作：

```text
DESCRIBE (描述)
FIND (查找)
SEARCH (搜索)
unrelated maintenance actions (互不相关的维护操作)
best-effort administrative work (尽力而为的管理工作)
```

原子事务则是以下操作的必需保障：

```text
belief revision (信念修正)
Experience formation across multiple elements (跨多个元素的经验形成)
Skill validation state transition (技能验证状态转换)
entity merge (实体合并)
import merge (导入合并)
schema activation (模式激活)
Grant replacement (授权替换)
declassification (降密/去分类)
high-impact lifecycle change (高影响力的生命周期变更)
```

KIP 不应当强迫每个批处理都退化为开销昂贵的事务。

但也绝严禁让廉价的批处理伪装成原子认知。

---

# 6. 事务作用域 (Transaction Scope)

KIP 2.0 基准事务原子性的作用域限定在 **单个记忆空间（MemorySpace）** 内。

对于空间所属的持久化状态，事务 **必须 (MUST)** 明确指定唯一的首要标识：

```text
space_id
```

---

# 7. 为什么单空间原子性是基准 (Why Single-Space Atomicity Is the Baseline)

记忆空间（MemorySpace）是以下维度的绝对边界：

```text
ownership (所有权)
Governance (治理)
Schema Environment (模式环境)
trust policy (信任策略)
retention (留存)
audit (审计)
```

跨空间事务会引入：

```text
distributed failure (分布式故障)
independent Governance domains (独立的治理域)
different schema locks (不同的模式锁)
different policy versions (不同的策略版本)
partial network availability (部分网络可用性)
cross-owner rollback semantics (跨所有者的回滚语义)
```

KIP 基准规范避免要求空间之间实现分布式共识。

---

# 8. 跨空间原子性非核心要求 (Cross-Space Atomicity Is Not Core)

基准 KIP 2.0 实现 **严禁 (MUST NOT)** 声明跨多个记忆空间的原子性。

跨空间工作流应当采用：

```text
Capsule export/import (胶囊导出/导入)
idempotent transfer (幂等传输)
outbox/inbox (发件箱/收件箱)
saga/compensation (Saga / 补偿机制)
application-level coordination (应用层协调)
```

未来可选的高级能力可能会声明支持：

```text
multi_space_atomic
```

但客户端绝不能默认假设该能力存在。

---

# 9. 中枢级受保护状态 (Nexus-Level Protected State)

某些中枢全局（Nexus-wide）控制状态天然不归属于某单个记忆空间。

示例包括：

```text
global package cache (全局模式包缓存)
authentication registry (身份认证注册表)
engine configuration (引擎配置)
```

此类状态属于部署控制平面，处于常规 KIP 空间事务之外，除非未来规范另有明确定义。

---

# 10. 事务基质可在单空间内跨越多个平面 (Transaction Substrate Can Span Planes Within One Space)

在单个空间内，事务引擎是以下各平面的共同持久化基质：

```text
Cognitive Plane (认知平面)
Epistemic state (认识论状态)
Governance Control Plane (治理控制平面)
Schema Environment (模式环境)
Mnemonic/Profile state (记忆/Profile 状态)
```

这并不意味着常规 KML 可以任意修改每个平面。

每一次突变修改仍然需要通过恰当的操作通道和治理权限授权。

---

# 11. 混合平面事务 (Mixed-Plane Transactions)

受保护的引擎操作 **可以 (MAY)** 原子性地跨越影响多个平面。

示例：一次经过授权的降密（Declassification）操作可能需要：

```text
create redacted cognitive derivative (创建脱敏的认知衍生项)
set protected destination classification (设置受保护的目标密级)
record Declassification Activity (记录降密活动)
record Governance approval/audit (记录治理审批/审计)
```

这些操作可以封装在同一个事务中。

常规 KML 绝不能仅仅因为事务底层基质支持混合平面提交，就越权获取治理平面的突变权限。

---

# 12. 事务类别 (Transaction Classes)

推荐的概念类别包括：

```text
cognitive (认知)
epistemic (认识论)
maintenance (维护)
import (导入)
migration (迁移)
governance (治理)
schema_environment (模式环境)
declassification (降密)
system (系统)
```

一个事务可以拥有一个主类别和可选的子类别。

类别属于描述性/审计性状态。

类别本身并不授予任何权限。

---

# 13. 事务标识 (Transaction Identity)

每次事务尝试都会获得一个由引擎受控的标识：

```text
tx_id
```

`tx_id` 在认知中枢（Nexus）内部 **必须 (MUST)** 保持唯一。

它 **应当 (SHOULD)** 是全局唯一的，或具备安全的命名空间限定，以便支持可移植的审计引用。

---

# 14. 事务尝试 vs. 提交 (Transaction Attempt vs. Commit)

事务的终态可以是：

```text
committed (已提交)
aborted (已中止)
no_effect (无效果)
```

只有造成持久化状态改变的提交，才会作为已提交状态转换记录进入空间提交日志（Space Commit Log）。

具体实现可以单独对失败/中止的尝试进行审计。

---

# 15. `committed` (已提交状态)

所有持久化变更原子性地对外可见。

事务将获得：

```text
space_seq (空间提交序列号)
committed_at (提交时间戳)
```

---

# 16. `aborted` (已中止状态)

提议的持久化事务突变没有任何一项对外可见。

中止原因可能包括：

```text
validation failure (验证失败)
authorization failure (授权失败)
version conflict (版本冲突)
serialization conflict (可串行化冲突)
schema block (模式封锁)
resource limit (资源超限)
client cancellation before commit (提交前客户端主动取消)
```

---

# 17. `no_effect` (无效果状态)

请求在语义上执行成功，但未产生任何持久化状态增量（Delta）。

示例包括：

```text
idempotent UPSERT finds exact same state (幂等 UPSERT 发现状态完全一致)
MERGE already canonical under a no-op form (MERGE 操作在空操作形态下已是规范形态)
SET field to existing identical value (SET 字段为已有完全相同的值)
```

`no_effect` **不得 (SHOULD NOT)** 仅仅为了证明请求曾发生过而递增元素版本号。

幂等注册表/审计日志仍可记录该请求。

---

# 18. 空间提交序列 (Space Commit Sequence)

每一个产生状态变更的已提交事务都会获得一个空间局部的单调递增提交位置：

```text
space_seq
```

其性质包括：

```text
strictly increasing (严格单调递增)
totally orders committed Space state transitions (全序排列已提交的空间状态转换)
engine-maintained (由引擎自主维护)
not semantic cognition (不属于语义认知内容)
not based on wall-clock ordering (不依赖物理挂钟时间排序)
not necessarily contiguous (不一定连续无空隙)
```

---

# 19. 为什么 `space_seq` 至关重要 (Why `space_seq` Matters)

物理挂钟时间可能会出现：

```text
skew (时钟漂移)
jump (时钟跳变)
share equal timestamps (具有完全相同的时间戳)
```

记忆大脑需要对以下问题给出确定无误的回答：

> 哪一个认知状态在先发生？

`space_seq` 提供了明确的逻辑全序。

---

# 20. 空间状态 (Space State)

定义：

```text
S(k)
```

表示提交序列号 `k` 刚完成后的记忆空间状态。

那么：

```text
S(k+1)
```

由一个已提交的状态变更事务生成。

这为以下机制提供了干净的确定性基础：

```text
historical epistemic projection (历史认识论投影)
historical Governance (历史治理)
change stream (变更流)
replication (复制)
cache invalidation (缓存失效)
audit (审计)
```

---

# 21. 统一空间提交顺序 (Unified Space Commit Order)

KIP 2.0 推荐语义：

> **所有影响单个 MemorySpace 的已提交状态转换共享同一个逻辑 `space_seq` 顺序，包括认知、治理和模式环境的转换。**

物理存储实现可以有所不同。

但逻辑历史是高度统一的。

---

# 22. 为什么统一排序至关重要 (Why Unified Ordering Is Important)

假设发生以下序列：

```text
seq 100: Agent still has write authority (智能体仍具备写入权限)
seq 101: Grant revoked (授权被撤销)
seq 102: Assertion created (断言被创建)
```

历史审计可以立即研判：

> 该断言在当时是否获得了有效授权？

同样地：

```text
seq 200: Schema Environment v5 (模式环境 v5)
seq 201: Experience created (经验被创建)
seq 202: Schema Environment v6 (模式环境 v6)
```

该经验拥有一个清晰明确的语义执行上下文。

---

# 23. 提交时间戳 (Commit Timestamp)

已提交的事务还会记录：

```text
committed_at
```

该时间戳使用引擎时间。

`committed_at` 有利于人类理解与解读。

当需要精确的时序判定时，权威依据始终是：

```text
space_seq
```

---

# 24. 事务信封 (Transaction Envelope)

说明性的逻辑请求结构：

```json
{
  "space_id": "space-1",

  "transaction": {
    "mode": "atomic",

    "idempotency_key": "formation:run-42",

    "options": {
      "isolation": "serializable",
      "dry_run": false
    },

    "preconditions": {
      "schema_environment_version": 12
    },

    "operations": [
      {
        "language": "KML",
        "command": "..."
      }
    ]
  }
}
```

具体线路传输格式在此不作硬性限定。

---

# 25. 事务执行上下文 (Transaction Execution Context)

在启动时，引擎会绑定一个受信任的上下文，其中包括：

```text
tx_id (事务 ID)
space_id (空间 ID)
authenticated Principal (已认证的主体)
Delegation chain (委托链)
request purpose/risk (请求目的与风险等级)
start time (启动时间)
read snapshot (读快照)
Schema Environment snapshot (模式环境快照)
Governance authorization context (治理授权上下文)
idempotency identity (幂等性标识)
```

---

# 26. 事务快照 (Transaction Snapshot)

每个事务均针对一个连贯一致的逻辑起始快照执行：

```text
snapshot_seq
```

事务读取截至该序列号为止的记忆空间状态，加上事务自身产生的暂存写入。

---

# 27. 读你所写 (Read-Your-Writes)

在原子事务内部：

> **后续操作 必须 (MUST) 能够观察到同一事务中先前的暂存写入。**

例如：

```text
create Evidence E (创建证据 E)
then create Assertion referencing E (随后创建引用 E 的断言)
```

必须能够在无需预先提交 E 的情况下正常执行。

---

# 28. 无脏读 (No Dirty Reads)

其他事务 **严禁 (MUST NOT)** 观察到未提交的暂存写入。

在正式提交之前：

```text
new Evidence (新证据)
new Assertion (新断言)
Governance changes (治理变更)
Schema changes (模式变更)
```

对外部观察者均保持不可见。

---

# 29. 原子可见性 (Atomic Visibility)

在成功提交的瞬间，事务产生的所有持久化变更作为一个单一的逻辑状态转换对外可见。

观察者只能看到：

```text
state before (变更前的状态)
or (或者)
state after (变更后的状态)
```

而绝不可能看到持久化的部分中间状态。

---

# 30. 隔离目标 (Isolation Goal)

KIP 2.0 **应当 (SHOULD)** 独立于底层数据库技术来定义事务行为。

具体实现可以采用：

```text
MVCC (多版本并发控制)
optimistic concurrency (乐观并发控制 OCC)
locking (悲观锁)
single-writer serialization (单写入者串行化)
distributed consensus inside one Space (单空间内部分布式共识)
```

对外可观察的语义才是规范的重点。

---

# 31. 必需的写隔离级别 (Required Write Isolation)

对产生状态变更的事务推荐的基准要求是：

> **单 MemorySpace 内部的可串行化（Serializable）结果。**

一个事务要么：

```text
commits in a result equivalent to some serial order (提交并产生等价于某种串行执行顺序的结果)
```

要么：

```text
aborts with a conflict (因冲突而中止)
```

---

# 32. 为什么仅有快照隔离是不够的 (Why Snapshot Isolation Alone Is Not Enough)

快照隔离（Snapshot Isolation）可以防止许多丢失更新（Lost Updates），但仍允许写偏斜（Write Skew）。

示例：

```text
T1 reads "no active primary Skill" (T1 读取到“当前无活跃主技能”)
T2 reads "no active primary Skill" (T2 读取到“当前无活跃主技能”)

T1 activates Skill A (T1 激活技能 A)
T2 activates Skill B (T2 激活技能 B)
```

在弱快照隔离下两者可能都能提交成功，即使 Profile 要求只能存在一个活跃主技能。

对于智能体认知与治理而言，这会破坏跨元素不变式（Cross-Element Invariants）。

---

# 33. 可串行化不等于全局大锁 (Serializable Does Not Mean Global Lock)

具体实现可以通过以下机制提供可串行化语义：

```text
OCC read-set validation (OCC 读集合验证)
predicate locks (谓词锁)
serializable MVCC (可串行化 MVCC)
coarse Space write lock (粗粒度空间写锁)
conflict graph (冲突图分析)
```

KIP 不限定具体的底层机制。

---

# 34. 一致性回退声明 (Conformance Fallback)

如果某种实现无法保证写事务的可串行化，则 **必须 (MUST)** 显式声明其较弱的隔离能力。

高保障客户端 **可以 (MAY)** 要求：

```text
serializable
```

并拒绝连接较弱的端点。

基准 KIP 实现 **应当 (SHOULD)** 以可串行化语义为目标。

---

# 35. 读快照隔离 (Read Snapshot Isolation)

只读事务应当在其所有查询中观察到稳定一致的：

```text
snapshot_seq
```

这比传输批处理更强，在传输批处理中各个命令可能会观察到后续并发提交的新状态。

---

# 36. 多查询读事务 (Multi-Query Read Transaction)

适用于以下场景：

```text
audit (审计)
complex Agent planning (复杂的智能体规划)
schema exploration (模式探索)
projection preparation (投影准备)
migration preview (迁移预览)
```

示例：

```text
Query A at snapshot 500 (快照 500 下执行查询 A)
Query B at snapshot 500 (快照 500 下执行查询 B)
Query C at snapshot 500 (快照 500 下执行查询 C)
```

即使有写操作正在并发提交，查询结果依然严格一致。

---

# 37. 快照令牌 (Snapshot Token)

运行时 **可以 (MAY)** 暴露一个不透明的：

```text
snapshot_token
```

代表一个可读取的历史快照。

它可以编码或引用：

```text
space_id (空间 ID)
snapshot_seq (快照序列号)
schema context (模式上下文)
expiry (过期时间)
```

客户端 **必须 (MUST)** 将其视为不透明令牌。

---

# 38. 快照生命周期 (Snapshot Lifetime)

读快照的留存期可能是有限的。

运行时能力 **应当 (SHOULD)** 声明：

```text
historical_read_window (历史读取窗口)
snapshot_token_ttl (快照令牌生存时间)
```

长期的历史重构可能依赖于归档历史，而非实时的在线 MVCC 快照。

---

# 39. 外部先读后写模式 (External Read Followed by Write)

智能体常常采用如下流程：

```text
1. FIND state (查找状态)
2. reason outside Nexus (在中枢外部进行推理思考)
3. submit mutation (提交变更突变)
```

这并不是单个数据库事务。

状态在步骤 1 和步骤 3 之间可能会发生变化。

因此写入操作 **应当 (SHOULD)** 携带显式前置条件。

---

# 40. 前置条件 (Preconditions)

推荐的事务前置条件包括：

```text
element version (元素版本)
element exists (元素存在)
element absent (元素不存在)
Space revision (空间修订号)
Schema Environment version (模式环境版本)
Governance version/binding (治理版本/绑定)
query/result guard (查询/结果守卫)
client logical key expectation (客户端逻辑键预期)
```

具体的 KML/请求语法在此不作硬性限定。

---

# 41. 元素版本守卫 (Element Version Guard)

沿用现有的 KIP 语义：

```text
EXPECT VERSION n
```

其含义为：

```text
commit only if target version matches n (仅当目标版本与 n 匹配时才提交)
```

---

# 42. 仅创建守卫 (Create-Only Guard)

```text
EXPECT VERSION 0
```

或等价语法表示：

```text
the addressed logical element must not already exist (被寻址的逻辑元素必须尚不存在)
```

该守卫须遵循元素身份标识规则。

---

# 43. 版本按元素独立维护 (Version Is Per Element)

每个可变认知元素均携带：

```text
_system.version
```

这不是空间提交序列号。

在概念上：

```text
element version (元素版本)
    protects local object revision (保护局部对象修订版本)

space_seq (空间序列号)
    orders whole-Space committed transitions (全序排列全空间已提交的转换)
```

---

# 44. 元素版本递增规则 (Element Version Increment Rule)

推荐的规范细化规则：

> **对于一个已存在的元素，若其对外可见的持久化状态在单个已提交事务中发生改变，则其 `_system.version` 在该事务中 严格递增一次，无论内部有多少次操作触碰了该元素。**

新创建的元素：

```text
version = 1
```

无效果的终态（No-effect final state）：

```text
version unchanged (版本保持不变)
```

---

# 45. 为什么每次事务只递增一次版本 (Why One Version Increment Per Transaction)

一个事务是一次对外可见的状态转换。

内部突变的顺序在原子提交后不再具有独立的对外可观察性。

这使得：

```text
EXPECT VERSION (预期版本守卫)
audit (审计)
change stream (变更流)
```

更加简洁且具备确定性。

---

# 46. `_system.updated_at`

对于被事务修改的元素：

```text
_system.updated_at = transaction committed_at (事务提交时间)
```

而不是某个中间操作的发生时间。

---

# 47. `_system.updated_tx`

对于被事务修改的元素：

```text
_system.updated_tx = tx_id
```

新创建的元素还会获得：

```text
created_tx = tx_id
```

---

# 48. 可选序列字段 (Optional Sequence Fields)

具体实现 **可以 (MAY)** 额外暴露：

```text
_system.created_seq
_system.updated_seq
```

作为引擎维护的便利字段。

它们必须对应于事务的 `space_seq`。

如果通过事务查询能够恢复该映射，则核心历史语义不得强依赖于它们的存在。

---

# 49. 空间修订守卫 (Space Revision Guard)

粗粒度前置条件可以要求：

```text
current_space_seq == expected_seq
```

其含义是：

> 自我的读快照以来，空间内不得提交任何新的事务。

这种约束非常强，可能会导致不必要的冲突。

仅在对全空间新鲜度有极高要求的场合使用。

---

# 50. 查询/谓词守卫 (Query/Predicate Guard)

对于依赖于读取结果的跨元素不变式，未来的 KML/事务 API **应当 (SHOULD)** 支持等价于如下的前置条件：

```text
query Q still has expected result/hash/count (查询 Q 仍具有预期的结果/哈希/计数)
```

或者在内部强制执行等价的可串行化验证。

这避免了仅依赖单个元素版本号的局限。

---

# 51. 读集合 (Read Set)

可串行化实现会在概念上跟踪足够的事务读依赖项，以检测并发提交是否破坏了有效性。

这可以包括：

```text
element reads (元素读取)
index/range reads (索引/范围读取)
predicate matches (谓词匹配)
schema reads (模式读取)
Governance decision dependencies (治理决策依赖项)
```

读集合无需暴露给客户端。

---

# 52. 写集合 (Write Set)

引擎在概念上会在提交前计算最终的持久化写集合：

```text
created (已创建)
updated (已更新)
lifecycle_changed (生命周期已改变)
merged (已合并)
tombstoned (已设置墓碑)
purged (已清除)
Governance_changed (治理已改变)
schema_environment_changed (模式环境已改变)
```

---

# 53. 提交验证 (Commit Validation)

在状态对外可见之前，引擎负责验证：

```text
authorization still valid (授权仍然有效)
required approvals still valid (所需审批仍然有效)
preconditions (前置条件成立)
element versions (元素版本匹配)
serializability conflicts (无串行化冲突)
schema availability (模式可用)
schema validation (模式验证通过)
Core invariants (核心不变式满足)
Governance invariants (治理不变式满足)
reference integrity (引用完整性满足)
resource limits (未超出资源限制)
```

---

# 54. 事务执行阶段 (Transaction Phases)

概念处理流水线：

```text
1. Receive / normalize request (接收并规范化请求)
2. Resolve idempotency (解析幂等性)
3. Authenticate Principal (认证调用主体)
4. Bind Space (绑定记忆空间)
5. Capture read snapshot (捕获读快照)
6. Resolve Schema Environment (解析模式环境)
7. Authorize requested operations (对请求操作进行授权)
8. Parse / desugar operations (解析并对操作进行脱糖展开)
9. Execute tentatively with read-your-writes (在读你所写语义下暂存执行)
10. Validate Core + Package constraints (验证核心与模式包约束)
11. Compute final write set (计算最终写集合)
12. Validate serializability/preconditions (验证可串行化与前置条件)
13. Revalidate security-sensitive Governance (重新验证安全敏感的治理状态)
14. Commit atomically (原子提交)
15. assign space_seq + committed_at (分配空间序列号与提交时间戳)
16. update element system fields (更新元素系统字段)
17. append Commit Record (追加提交记录)
18. publish Change Envelope (发布变更信封)
19. return Receipt (返回回执凭证)
```

具体实现可以融合某些阶段。

对外可观察的语义必须与此一致。

---

# 55. 脱糖发生在提交之前 (Desugaring Happens Before Commit)

面向模型的友好语法可能会展开为：

```text
Concept (概念)
Proposition (命题)
Assertion (断言)
Evidence (证据)
Activity (活动)
```

整个脱糖后的计划依然保持在同一事务内部。

在提交之前，任何底层生成的对象都不会对外暴露可见。

---

# 56. 模式解析时机 (Schema Resolution Time)

局部类型/谓词别名针对事务捕获的模式环境（Schema Environment）进行解析。

解析完成后，语义执行计划均使用精确引用。

并发的默认模式变更绝不能静默地重新解释已解析完毕的操作。

---

# 57. 模式环境快照 (Schema Environment Snapshot)

每个写事务都会记录或能够重构用于解析/验证的：

```text
schema_environment_version
```

高保障回执 **应当 (SHOULD)** 包含该信息。

---

# 58. 事务执行期间的模式变更 (Schema Changes During Transaction)

如果另一个事务在当前事务运行期间激活了新的默认模式：

```text
already resolved exact refs remain exact (已解析的精确引用保持精确不变)
```

若满足以下条件，当前事务 **可以 (MAY)** 依然正常提交：

```text
those package versions remain active/writable (所引用的模式包版本依然处于活跃/可写状态)
all current security constraints remain satisfied (所有当前安全约束依然满足)
```

---

# 59. 事务执行期间模式被封锁 (Schema Block During Transaction)

如果在提交前，锁定的模式包版本变为：

```text
blocked (已封锁)
quarantined (已隔离)
not writable (不可写)
```

则事务 **应当 (SHOULD)** 中止。

安全响应必须优先于业务便利性。

---

# 60. 模式变更冲突 (Schema Change Conflict)

推荐返回的错误包括：

```text
SchemaEnvironmentChanged
or
SchemaVersionNoLongerWritable
```

并附带安全的重试指引。

---

# 61. 治理快照 (Governance Snapshot)

授权规划始于治理快照。

引擎记录足够的身份标识，以解释哪些：

```text
Policy (策略)
Grant (授权)
Delegation (委托)
ActorBinding (执行者绑定)
approvals (审批)
```

与该操作相关。

---

# 62. 提交时治理重新验证 (Commit-Time Governance Revalidation)

安全敏感的权限 **必须 (MUST)** 在提交时刻针对当前受保护状态进行重新验证。

这防止了以下情况：

```text
transaction starts (事务启动)
Grant revoked (授权被撤销)
transaction commits using stale authority (事务使用过期的旧权限完成提交)
```

---

# 63. 撤销优先原则 (Revocation Wins)

如果所需的权限在提交之前被撤销：

```text
transaction aborts (事务中止)
```

即使事务开始时是处于已授权状态。

这是一项经过深思熟虑的防范检查时到使用时冲突（TOCTOU）的安全设计。

---

# 64. 与事务无关的治理变更 (Governance Changes Unrelated to Transaction)

并发发生的无关治理突变无需导致所有事务中止。

具体实现可以只验证对授权产生实质影响的治理依赖项。

粗粒度的实现可以使用空间治理版本号，从而更频繁地中止事务。

---

# 65. 审批重新验证 (Approval Revalidation)

一项审批可能会：

```text
expire (过期)
be revoked (被撤销)
be consumed (已被消耗使用)
lose prerequisite authority (失去前置权限)
```

提交阶段会重新检查适用的审批状态。

---

# 66. 回执中的策略版本 (Policy Version in Receipt)

高影响力的回执 **应当 (SHOULD)** 包含：

```text
policy_id/version (策略 ID 与版本)
effective Principal (生效的主体)
Delegation chain identity (委托链标识)
approval refs (审批引用)
```

具体内容受读取者权限约束。

---

# 67. 起源分配 (Origin Assignment)

引擎起源（Engine Origin）在提交时刻分配。

对于每个创建/更新的元素，其 `_system.origin` 和事务字段反映已认证的事务上下文。

作者提交的内容无法自行伪造这些字段。

---

# 68. 同一事务共享相同起源 (Same Transaction, Common Origin)

由同一个事务创建的元素共享：

```text
created_tx (创建事务 ID)
Space (记忆空间)
commit position (提交位置)
authenticated operation context (已认证的操作上下文)
```

而语义层面的 `asserted_by` 值可以各不相同。

---

# 69. 起源不替代溯源 (Origin Does Not Replace Provenance)

事务起源回答的是：

> 是谁在此中枢（Nexus）中引发了这次写入？

活动/证据溯源（Activity/Evidence provenance）回答的是：

> 语义内容是如何生成的？

两者共同存续。

---

# 70. 幂等性问题 (Idempotency Problem)

智能体系统常常因为以下原因发生重试：

```text
network timeout (网络超时)
tool interruption (工具中断)
response loss (响应丢失)
process restart (进程重启)
at-least-once job delivery (至少一次作业投递)
```

客户端可能无法得知某个事务是否已经成功提交。

KIP 必须确保重试是安全的。

---

# 71. 事务幂等键 (Transaction Idempotency Key)

客户端 **可以 (MAY)** 为原子事务提供：

```text
idempotency_key
```

该键的作用域至少由以下维度限定：

```text
MemorySpace (记忆空间)
authenticated Principal / authority context (已认证的主体 / 权限上下文)
operation endpoint/class (操作端点 / 类别)
```

以防止互不相关的调用者发生键冲突。

---

# 72. 幂等绑定 (Idempotency Binding)

在首次确定事务终态时，引擎将：

```text
idempotency scope + key (幂等作用域 + 键)
```

绑定至：

```text
canonical request digest (规范请求摘要)
transaction outcome (事务结果)
receipt (回执凭证)
```

---

# 73. 精确重试 (Exact Retry)

如果使用相同的限定作用域键和相同的规范请求摘要发起重试：

```text
do not execute again (不再重复执行)
return the original finalized result/receipt (直接返回原始的终态结果/回执)
```

这包括以下场景：

```text
original commit succeeded (原始提交已经成功)
response was lost (但网络响应在传输中丢失)
```

---

# 74. 幂等冲突 (Idempotency Conflict)

如果在复用相同的作用域键时传入了不同的规范请求：

```text
abort with IdempotencyConflict (因 IdempotencyConflict 而中止)
```

系统绝不得擅自猜测客户端意图执行哪一个请求。

---

# 75. 规范请求摘要 (Canonical Request Digest)

幂等摘要 **应当 (SHOULD)** 针对规范化的语义请求结构进行计算，而非原始的空白字符。

等价的代码格式排版不应产生误判的不匹配。

可能的输入包括：

```text
parsed operation AST (解析后的操作抽象语法树 AST)
normalized parameter values (规范化的参数值)
transaction options (事务选项)
target Space (目标记忆空间)
declared preconditions (声明的前置条件)
```

---

# 76. 已解析模式与幂等性 (Resolved Schema and Idempotency)

请求摘要基于所提交的语义请求生成。

原始回执（Receipt）记录了当时所使用的确切模式环境（Schema Environment）。

在模式发生变更后发生重试时：

```text
idempotency hit (幂等命中)
→ return original outcome (→ 返回原始执行结果)
```

而不是重新解析并再次执行。

---

# 77. 幂等留存 (Idempotency Retention)

具体实现 **应当 (SHOULD)** 声明：

```text
idempotency_retention_window (幂等留存窗口)
```

高保障部署可以持久化保留这些映射关系。

需要永久逻辑去重的客户端还应当使用元素级的 `client_key`。

---

# 78. 事务幂等 vs. 元素幂等 (Transaction Idempotency vs. Element Idempotency)

两者解决不同的问题：

```text
transaction idempotency_key (事务幂等键)
    prevents replaying one request (防止重放单次请求)

element client_key (元素客户端键)
    gives durable logical identity to a non-canonical created element (为非规范创建的元素赋予持久的逻辑身份)
```

两者可以结合使用。

---

# 79. 示例：记忆形成重试 (Example: Formation Retry)

记忆形成（Formation）运行具有：

```text
idempotency_key = formation:conversation-991
```

该事务创建了：

```text
Evidence E (证据 E)
Event V (事件 V)
Experience X (经验 X)
Assertions A* (断言集合 A*)
```

网络响应丢失。

使用相同的键进行重试：

```text
returns same Receipt (返回完全相同的回执)
creates nothing new (不会创建任何重复的新内容)
```

---

# 80. 示例：真实的重复陈述 (Example: Genuine Repeated Statement)

Alice 在两次不同的对话事件中陈述了相同的偏好。

此时应当使用不同的逻辑源事件/客户端键。

这是两次独立的证据/断言事件（Evidence/Assertion events）。

绝不能仅仅因为语义文本完全相同就对其进行去重。

---

# 81. 客户端键冲突 (Client Key Conflict)

对于非规范元素的创建：

```text
same client_key (相同的 client_key)
different immutable semantic payload (但不可变语义负载不同)
```

**应当 (SHOULD)** 产生逻辑身份冲突而失败。

这能够有效区分：

```text
retry (合法的重试)
```

与：

```text
attempt to reuse event identity for different event (试图将同一事件标识复用于不同事件的错误)
```

---

# 82. 命题幂等性 (Proposition Idempotency)

命题的创建在结构上保持规范化（Canonical）：

```text
(space, subject, predicate, object) (空间, 主体, 谓词, 客体)
```

并发的“获取或创建”（Get-or-create）必须解析为同一个规范命题。

---

# 83. 并发规范命题创建 (Concurrent Canonical Proposition Creation)

如果 T1 和 T2 均暂存创建相同的命题：

```text
one commit may create it first (其中一个提交会率先创建成功)
```

另一个可串行化事务可以：

```text
resolve to the already-created canonical Proposition (解析为已经创建的规范命题)
and continue (并继续执行)
```

前提是其语义依然合法，否则中止并重试。

它 **严禁 (MUST NOT)** 创建重复的规范命题。

---

# 84. 断言幂等性 (Assertion Idempotency)

断言不会仅仅依据以下结构进行去重：

```text
proposition + actor + stance (命题 + 行动者 + 立场)
```

因为重复的陈述本身具有认识论意义。

应当使用：

```text
transaction idempotency (事务幂等)
client_key (客户端键)
source event identity (源事件标识)
```

来进行重试检测。

---

# 85. 事务无效果语义 (Transaction No-Op Semantics)

最终规范持久化状态与起始状态完全相同的事务 **应当 (SHOULD)** 被归类为：

```text
no_effect
```

并且 **不得 (SHOULD NOT)**：

```text
increment element versions (递增元素版本号)
change updated_at (改变 updated_at 时间戳)
emit cognitive change records (发出认知变更记录)
```

---

# 86. 为什么无效果必须无副作用 (Why No-Op Must Be Side-Effect Free)

否则会出现以下链式反应：

```text
repeated idempotent write (重复的幂等写入)
→ version increases (→ 版本号递增)
→ change stream event (→ 产生变更流事件)
→ cache invalidation (→ 触发缓存失效)
→ maintenance trigger (→ 触发维护任务)
```

这将彻底破坏实际工程中的幂等性。

---

# 87. 审计例外 (Audit Exception)

安全策略 **可以 (MAY)** 为以下情况记录审计事件：

```text
attempted Governance action (尝试执行治理操作)
no-op high-risk request (无效果的高风险请求)
denied request (被拒绝的请求)
```

此类审计记录与声明“认知状态发生了改变”是完全独立的。

---

# 88. 写事务内的读操作 (Read Operations Inside Write Transaction)

原子事务 **可以 (MAY)** 包含用于以下目的的读操作：

```text
bind IDs (绑定 ID)
check state (检查状态)
compute update targets (计算更新目标)
return resulting state (返回结果状态)
```

这些读取操作使用事务快照加上自身产生的写入。

---

# 89. 返回的读结果 (Returned Read Results)

如果事务根据暂存状态返回查询结果，则响应仅在成功提交后才交付给客户端。

如果提交中止：

```text
tentative results must not be presented as committed truth (暂存结果严禁作为已提交的真实数据呈现)
```

引擎可以单独返回诊断信息。

---

# 90. KQL 与 KML 混合 (KQL and KML Mixing)

未来的显式事务 API **可以 (MAY)** 允许在单个事务内：

```text
KQL read (KQL 读取)
KML write (KML 写入)
KQL verify (KQL 校验)
```

具体语法在此不作硬性限定。

---

# 91. 模型复杂度警告 (Model Complexity Warning)

在事务范围内进行任意的复杂脚本编写会增加大语言模型（LLM）使用 KIP 的难度。

基准设计 **应当 (SHOULD)** 倾向于：

```text
small number of declarative operations (少量的声明式操作)
clear preconditions (清晰的前置条件)
deterministic desugaring (确定性的脱糖展开)
```

而非设计一种过程式的事务脚本语言。

---

# 92. 事务局部句柄 (Transaction-Local Handles)

KML 可以在单个突变语句中支持局部句柄。

未来的显式事务 **可以 (MAY)** 支持事务局部的结果绑定。

基准 v2 版本不需要跨命令的可变变量。

在可行的情况下应当使用：

```text
one structured mutation (单一结构化突变)
client_key (客户端键)
canonical references (规范引用)
```

---

# 93. 嵌套事务 (Nested Transactions)

基准 KIP 2.0 **不得 (SHOULD NOT)** 暴露嵌套事务语义。

在活动事务内部调用的操作要么参与外层事务，要么作为不受支持而被拒绝。

在外部事务提交之前，任何独立的内部提交都绝不得对外可见。

---

# 94. 保存点 (Savepoints)

保存点（Savepoints）不是基准 KIP 的必需特性。

智能体事务应当保持足够小，以便作为一个单一认知变更进行整体中止与重试。

具体实现可以将保存点作为非可移植能力提供。

---

# 95. 事务大小 (Transaction Size)

运行时 **可以 (MAY)** 对以下指标设置上限：

```text
operations (操作数量)
mutated elements (突变元素数量)
Evidence bytes (证据字节数)
execution time (执行时间)
read set size (读集合大小)
write set size (写集合大小)
```

系统能力 **应当 (SHOULD)** 显式公开这些限制。

---

# 96. 资源耗尽 (Resource Exhaustion)

如果原子事务在提交前超出了硬性资源限制：

```text
abort entirely (整体全部中止)
```

绝不得对部分前缀操作进行部分提交。

---

# 97. 批量维护 (Bulk Maintenance)

大型维护作业 **应当 (SHOULD)** 被划分为具有边界的原子事务。

示例：

```text
maintenance run (维护运行)
    batch 1 tx (批次 1 事务)
    batch 2 tx (批次 2 事务)
    batch 3 tx (批次 3 事务)
```

整个维护作业本身不是一个单一的庞大事务。

---

# 98. 维护运行标识 (Maintenance Run Identity)

Profile 或系统可以为整个作业赋予：

```text
run_id
```

而每个原子批次拥有其自身的：

```text
tx_id
idempotency_key
```

这支持了作业的可恢复执行（Resumability）。

---

# 99. 部分多事务作业 (Partial Multi-Transaction Job)

如果在批次 1–2 提交后批次 3 发生失败：

```text
batches 1–2 remain valid (批次 1–2 依然有效)
```

作业可以从持久化的检查点恢复执行。

这并不违反事务原子性，因为该作业由多个明确的认知转换单元构成。

---

# 100. 原子边界必须基于语义 (Atomicity Boundary Must Be Semantic)

根据以下原则确定事务大小：

> 如果这些变更被分开单独观察，是否会导致状态不合法或语义错误？

绝不要仅仅根据随意设定的命令数量来切分。

---

# 101. 断言修订事务 (Assertion Revision Transaction)

推荐的原子集合：

```text
new Evidence (新证据)
new Assertion (新断言)
old self-Assertion lifecycle → superseded (自身旧断言生命周期 → 被废弃替代)
derivation/correction Activity (衍生/更正活动)
```

前提是所有这些组成部分表达的是同一次信念修正。

---

# 102. 第三方矛盾事务 (Third-Party Contradiction Transaction)

当收到新的第三方主张时：

```text
create Evidence (创建证据)
create third-party Assertion (创建第三方断言)
```

不要自动废弃替代已有的独立行动者的断言。

后续的维护事务可以衍生出：

```text
contested summary (争议摘要)
review task (审查任务)
```

---

# 103. 撤回事务 (Retraction Transaction)

行动者合法的撤回操作可以原子性地：

```text
transition Assertion active → retracted (将断言从 active 转换为 retracted)
record retracted_at (记录撤回时间)
record transaction origin (记录事务起源)
optionally create Evidence of retraction (可选创建撤回证据)
create Activity if required (若需要则创建活动)
```

---

# 104. 撤回是一项生命周期事件 (Retraction Is a Lifecycle Event)

历史重构必须能够获知：

```text
when (发生时间)
who authorized it (谁授权了该操作)
under which transaction (在哪个事务下发生)
```

而不仅仅是当前的：

```text
status = retracted
```

---

# 105. 生命周期转换历史 (Lifecycle Transition History)

以下状态转换：

```text
active → superseded (活跃 → 被废弃替代)
active → retracted (活跃 → 已撤回)
active → expired (活跃 → 已过期)
active → quarantined [Governance] (活跃 → 已隔离 [治理])
```

对于声明支持历史投影的部署，**必须 (MUST)** 能够从以下途径重构：

```text
transaction/change history (事务/变更历史)
or (或者)
equivalent append-preserving version history (等价的仅追加版本历史)
```

---

# 106. 当前字段 vs. 历史转换 (Current Field vs. Historical Transition)

当前断言可以存储：

```text
lifecycle.status = superseded
```

而事务日志记录：

```text
seq 800:
    status active → superseded
```

两者均具有重要价值。

---

# 107. 生命周期转换合法性 (Lifecycle Transition Validity)

非法的状态转换应当直接失败。

示例：

```text
retracted → active (已撤回 → 活跃)
```

这可能需要创建一个新的断言，而非直接复活旧断言。

精确的生命周期状态机归属于核心/认识论模式（Core/Epistemic schemas）。

事务负责原子性地强制执行声明的状态转换。

---

# 108. 证据更正事务 (Evidence Correction Transaction)

一次证据更正可以原子性地：

```text
create Evidence E2 (创建证据 E2)
mark E1 corrected (将 E1 标记为已更正)
link E1.corrected_by = E2 (关联 E1.corrected_by = E2)
create new Assertion if conclusion changes (若结论改变则创建新断言)
create correction Activity (创建更正活动)
```

---

# 109. 经验形成事务 (Experience Formation Transaction)

单个经验（Experience）的形成可以原子性地创建：

```text
Experience (经验)
ExperienceSteps (经验步骤)
Event link/reference (事件关联/引用)
Evidence refs (证据引用)
learning-value Facet (学习价值切面)
SleepTask for procedural consolidation (用于过程巩固的睡眠任务)
```

前提是部分孤立的呈现状态属于不合法状态。

---

# 110. 技能编译事务 (Skill Compilation Transaction)

过程巩固（Procedural Consolidation）可以原子性地：

```text
create/update Skill (创建/更新技能)
link source Experiences (关联源经验)
update Skill validation counters (更新技能验证计数器)
record procedural consolidation Activity (记录过程巩固活动)
set candidate authority/profile state (设置候选权限/Profile 状态)
```

治理权限的提升是独立的操作，除非特权操作明确包含了权限提升。

---

# 111. 实体合并事务 (Identity Merge Transaction)

概念合并必须是原子的，因为规范身份会直接影响：

```text
Proposition resolution (命题解析)
query results (查询结果)
Epistemic Conflict Sets (认识论冲突集合)
Governance-sensitive identity interpretation (治理敏感的身份解释)
```

KIP 2.0 非破坏性合并可以原子性地：

```text
mark source merged (将源标记为已合并)
set merged_into (设置 merged_into 目标)
update canonical resolution index (更新规范解析索引)
resolve canonical Proposition collisions (解决规范命题冲突)
record merge Activity/audit (记录合并活动/审计)
```

且无需重写原始的历史引用。

---

# 112. 治理替换事务 (Governance Replacement Transaction)

示例：

```text
revoke Grant G1 (撤销授权 G1)
create Grant G2 (创建授权 G2)
update group membership (更新组员身份)
```

当临时重叠或权限空隙可能导致不安全时，这些操作可以封装在同一个事务中。

---

# 113. 模式环境激活事务 (Schema Environment Activation Transaction)

原子激活可以修改：

```text
installed package states (已安装模式包状态)
exact Schema Lock (精确模式锁)
aliases (别名映射)
write defaults (写入默认值)
blocked/deprecated states (封锁/废弃状态)
environment version (环境版本)
Governance audit (治理审计)
```

任何观察者都绝不可能看到处于半解析状态的模式环境。

---

# 114. 模式迁移通常与激活分离 (Schema Migration Is Usually Separate from Activation)

推荐实践：

```text
Tx A:
    activate new schema environment (激活新模式环境)

Tx B..N:
    migrate data in bounded batches (以有边界的批次迁移数据)
```

因为数据迁移的规模可能非常庞大。

旧模式版本在双版本过渡期内保持可读。

---

# 115. 激活伴随小型迁移 (Activation-With-Small-Migration)

对于规模较小、紧密耦合的模式转换，特权操作 **可以 (MAY)** 在单个原子事务中结合激活与数据迁移。

该操作必须严格遵守事务大小限制。

---

# 116. 迁移事务 (Migration Transaction)

迁移事务应当记录：

```text
source schema version (源模式版本)
target schema version (目标模式版本)
migration descriptor/method (迁移描述符/方法)
input element refs (输入元素引用)
output element refs (输出元素引用)
Activity (迁移活动)
```

并使用幂等键。

---

# 117. 迁移重试 (Migration Retry)

批量迁移应当通过以下机制确保重试安全：

```text
transaction idempotency (事务幂等)
element client_key (元素客户端键)
migration marker (迁移标记)
exact source version preconditions (精确源版本前置条件)
```

---

# 118. 导入事务 (Import Transaction)

将有边界的胶囊导入单个空间可以是一个原子事务。

它包括：

```text
local ID resolution (本地 ID 解析)
canonical Proposition resolution (规范命题解析)
Evidence/Assertion creation (证据/断言创建)
destination origin (目标端起源分配)
classification/authority defaults (密级/权限默认值分配)
import provenance (导入溯源)
```

---

# 119. 大型胶囊导入 (Large Capsule Import)

大型胶囊的导入可能会超出事务限制。

此时导入应当采用：

```text
staging/quarantine (暂存区 / 隔离区)
chunked durable staging (分块持久化暂存)
final activation/merge transaction (最终激活/合并事务)
```

而不是将仅完成一半导入的认知暴露为常规活跃记忆。

---

# 120. 分阶段导入 (Staged Import)

概念架构：

```text
Capsule (胶囊)
    ↓
quarantine staging transactions (隔离区暂存事务集合)
    ↓
validation complete (验证完成)
    ↓
atomic publish/activate transaction (原子发布/激活事务)
```

暂存数据对常规记忆召回（Recall）不可见。

---

# 121. 降密事务 (Declassification Transaction)

经过授权的降密操作应当原子性地：

```text
read restricted source snapshot (读取受限源快照)
create derivative (创建衍生项)
assign approved classification (分配已批准的密级)
record Declassification Activity (记录降密活动)
record approval refs (记录审批引用)
record audit (记录审计)
```

从而确保绝不会出现丢失治理状态的公开衍生项。

---

# 122. 清除事务 (Purge Transaction)

物理清除（Purge）可能会影响：

```text
Evidence bytes (证据字节)
references (引用关系)
tombstones (墓碑标记)
dependent records (依赖记录)
audit receipts (审计回执)
```

清除计划必须在提交前经过严格验证。

如果策略要求级联清除，允许的级联在事务限制内保持原子性。

---

# 123. 法定清除与历史重构 (Legal Purge and Historical Reconstruction)

物理清除可能会使某些历史状态变得无法重构。

事务历史 **严禁 (MUST NOT)** 伪造已删除的内容。

在法律/策略允许的前提下，它可以保留合法的回执说明，例如：

```text
element existed (元素曾经存在)
purged under policy X at seq N (在序列 N 依据策略 X 被清除)
content unavailable (内容不可用)
```

---

# 124. 事务日志不是保留违禁数据的借口 (Transaction Log Is Not an Excuse to Retain Forbidden Data)

可审计性不能凌驾于隐私与法律删除要求之上。

变更记录可能需要依据治理策略执行：

```text
redaction (脱敏)
cryptographic tombstone (密码学墓碑)
minimal metadata (最小化元数据)
complete purge (彻底物理清除)
```

---

# 125. 外部副作用 (External Side Effects)

KIP 事务仅对认知中枢事务引擎所控制的状态保证原子性。

**严禁 (MUST NOT)** 声称对任意外部动作提供原子回滚保证，例如：

```text
send email (发送电子邮件)
send payment (发起支付)
deploy service (部署服务)
call third-party API (调用第三方 API)
delete external file (删除外部文件)
execute shell command (执行 Shell 命令)
```

---

# 126. 物理世界无法被 KIP 回滚 (The World Cannot Be Rolled Back by KIP)

这是一条关键的智能体原则：

```text
KIP transaction abort (KIP 事务中止)
```

无法撤回已经发生的物理世界行为：

```text
an email (一封已发出的邮件)
a bank transfer (一笔已完成的银行转账)
a production deployment (一次已执行的生产部署)
```

因此外部副作用必须显式建模。

---

# 127. 外部工具调用不应在原子提交内运行 (External Tool Calls Should Not Run Inside Atomic Commit)

KIP 事务 **不得 (SHOULD NOT)** 在调用任意外部工具时持有锁或快照。

原因包括：

```text
unbounded latency (无界的延迟)
non-repeatability (不可重复性)
irreversible effects (不可逆的影响)
network uncertainty (网络不确定性)
deadlocks (死锁风险)
security (安全风险)
```

---

# 128. 行动意图模式 (Action Intent Pattern)

推荐架构：

```text
Tx 1:
    persist Decision / ActionIntent (持久化决策 / 行动意图)
    persist belief snapshot/audit context (持久化信念快照/审计上下文)
    commit (提交)

External Action Runtime: (外部行动运行时)
    execute authorized tool action (执行已授权的工具动作)

Tx 2:
    persist outcome Evidence (持久化结果证据)
    persist Activity result (持久化活动结果)
    update Experience (更新经验)
```

---

# 129. 发件箱模式 (Outbox Pattern)

部署可以采用事务性发件箱记录：

```text
Tx:
    cognitive decision (认知决策)
    +
    ActionRequest/Outbox item (行动请求 / 发件箱项)
```

提交后，外部工作进程负责消费该发件箱。

这确保了：

```text
no action request without durable decision state (无持久化决策状态则绝不会发出行动请求)
```

---

# 130. 收件箱/结果模式 (Inbox/Outcome Pattern)

工具执行结果返回时携带外部：

```text
operation_id
```

记忆形成模块使用幂等事务记录该结果。

这可以防止在“至少一次”（at-least-once）投递下产生重复的结果证据。

---

# 131. 外部仅一次无法由 KIP 保证 (External Exactly-Once Is Not Guaranteed by KIP)

KIP 能够提供：

```text
exactly-once durable memory commit (幂等键下的精准一次持久化记忆提交)
```

但它无法普遍提供外部动作的“精准一次”语义。

外部工具需要自身具备幂等与事务机制。

---

# 132. 事务回执 (Transaction Receipt)

每个最终确定的显式事务 **应当 (SHOULD)** 返回结构化的回执凭证（Receipt）。

回执是关于事务执行结果的引擎层客观事实。

---

# 133. 回执逻辑形态 (Receipt Logical Shape)

说明性结构：

```json
{
  "tx_id": "tx-123",
  "status": "committed",

  "space_id": "space-1",
  "space_seq": 912,
  "snapshot_seq": 910,

  "committed_at": "2026-08-13T14:00:00Z",

  "idempotency": {
    "key": "formation:991",
    "request_digest": "sha256:..."
  },

  "execution": {
    "transaction_class": "cognitive",
    "isolation": "serializable"
  },

  "schema": {
    "environment_version": 17
  },

  "governance": {
    "decision_ref": "gov-decision-...",
    "policy_versions": []
  },

  "changes": {
    "created": ["evidence-1", "assertion-2"],
    "updated": ["assertion-1"],
    "tombstoned": [],
    "purged": []
  },

  "change_cursor": "opaque-cursor",

  "warnings": []
}
```

---

# 134. 回执默认不是认知证据 (Receipt Is Not Cognitive Evidence by Default)

回执证明了：

```text
the Nexus committed this state transition (认知中枢提交了该状态转换)
```

它并不证明：

```text
the semantic Assertions are true (语义断言在客观世界中为真)
```

如果大脑希望对某次事务结果进行推理，可以通过证据/溯源关系引用该回执。

---

# 135. 回执隐私 (Receipt Privacy)

回执可能包含：

```text
Principal IDs (主体 ID)
hidden element IDs (隐藏元素 ID)
policy identities (策略标识)
classification details (密级详情)
```

治理机制控制回执的可见性与脱敏规则。

公开调用者可能只会收到精简版的回执。

---

# 136. 最小回执 (Minimal Receipt)

已提交事务向已授权调用者暴露的最小回执 **应当 (SHOULD)** 包含：

```text
tx_id
status
space_id
space_seq
committed_at
result summary (结果摘要)
```

以及足够支持安全重试的信息。

---

# 137. 高保障回执 (High-Assurance Receipt)

可以包含：

```text
snapshot_seq (快照序列号)
request_digest (请求摘要)
schema_environment_version (模式环境版本)
package digests (模式包摘要)
policy versions (策略版本)
effective Principal (生效主体)
Delegation refs (委托引用)
approval refs (审批引用)
mutation IDs (突变 ID)
result digest (结果摘要)
change cursor (变更游标)
```

---

# 138. 回执摘要 (Receipt Digest)

高保障实现 **可以 (MAY)** 计算：

```text
receipt_digest
```

该摘要基于规范化的回执形态。

胶囊与证明规范未来可以定义针对该摘要的签名与证明。

---

# 139. 失败回执 (Failed Receipt)

已中止的事务可以返回：

```json
{
  "tx_id": "tx-124",
  "status": "aborted",
  "snapshot_seq": 912,
  "error": {
    "code": "VersionConflict"
  }
}
```

对于未改变状态的中止，不会分配 `space_seq`。

---

# 140. 无效果回执 (No-Effect Receipt)

示例：

```json
{
  "tx_id": "tx-125",
  "status": "no_effect",
  "snapshot_seq": 912,
  "space_seq": null
}
```

幂等映射可以保留该结果。

---

# 141. 事务查找 (Transaction Lookup)

运行时 **应当 (SHOULD)** 允许授权客户端将：

```text
tx_id
or
idempotency key
```

解析为最终的事务状态/回执。

这在处理不确定的网络故障后至关重要。

---

# 142. 未知结果恢复 (Unknown Outcome Recovery)

客户端发送事务。

网络连接中断。

正确的恢复流程为：

```text
lookup/retry same idempotency key (使用相同的幂等键查询或重试)
```

绝非：

```text
blindly submit a fresh logical transaction (盲目提交一个全新的逻辑事务)
```

---

# 143. 提交记录 (Commit Record)

对于每一次产生状态变更的提交，引擎都会存储一条逻辑上不可变的 **提交记录 (Commit Record)**。

它代表了持久化的历史状态转换。

---

# 144. 提交记录逻辑字段 (Commit Record Logical Fields)

推荐字段：

```text
tx_id (事务 ID)
space_id (空间 ID)
space_seq (空间序列号)
snapshot_seq (快照序列号)
committed_at (提交时间)
transaction class (事务类别)
request/result digest (请求/结果摘要)
schema environment identity (模式环境标识)
Governance decision/audit refs (治理决策/审计引用)
change summary (变更摘要)
origin Principal (起源主体)
```

具体保留的详细程度受治理与留存策略控制。

---

# 145. 提交记录仅追加保留 (Commit Record Is Append-Preserving)

后续的更正会创建另一条提交记录。

绝严禁为了迎合当前的信念而篡改重写：

```text
what committed at seq N (在序列 N 实际提交的内容)
```

---

# 146. 变更流 (Change Stream)

空间提交日志可以通过可恢复的 **变更流 (Change Stream)** 对外暴露。

概念操作：

```text
CHANGES SINCE <cursor>
```

或等价的 API。

---

# 147. 变更信封 (Change Envelope)

一个产生状态变更的事务生成一个逻辑变更信封：

```json
{
  "space_id": "space-1",
  "space_seq": 912,
  "tx_id": "tx-123",
  "committed_at": "...",

  "transaction_class": "cognitive",

  "changes": [
    {
      "op": "create",
      "kind": "evidence",
      "id": "E1",
      "new_version": 1
    },
    {
      "op": "update",
      "kind": "assertion",
      "id": "A1",
      "old_version": 2,
      "new_version": 3
    }
  ]
}
```

---

# 148. 变更排序 (Change Ordering)

变更信封按以下序列全序排列：

```text
space_seq
```

单个信封内部的变更具有确定性的引擎定义顺序。

消费者必须将整个信封作为一个原子提交来处理。

---

# 149. 变更流交付 (Change Stream Delivery)

变更流可以提供：

```text
at-least-once delivery (至少一次交付保证)
```

并带有可恢复的游标。

消费者通过以下标识去重：

```text
space_seq
tx_id
```

KIP 不强制要求推送式传输，轮询（Polling）机制已足够满足需求。

---

# 150. 游标不透明 (Cursor Is Opaque)

客户端绝严禁通过随意猜测 `space_seq` 来构造变更游标。

运行时可以单独允许显式的序列号查询。

游标内部可以编码：

```text
authorization view (授权视图)
stream class (流类别)
position (位置)
expiry (过期时间)
```

---

# 151. 变更流过滤 (Change Stream Filtering)

经过授权的流可以按以下条件过滤：

```text
transaction class (事务类别)
element kind (元素种类)
schema package (模式包)
Governance event class (治理事件类别)
```

过滤绝不得泄露被隐藏的变更。

---

# 152. 统一流 vs. 专用流 (Unified vs. Specialized Streams)

逻辑空间排序是统一的。

运行时 **可以 (MAY)** 暴露专用视图：

```text
cognitive changes (认知变更)
Governance audit changes (治理审计变更)
schema changes (模式变更)
```

它们应当保留事务与空间的排序引用。

---

# 153. 变更负载级别 (Change Payload Levels)

可能支持的授权级别：

```text
existence only (仅存在性)
ID/version (ID 与版本)
field diff (字段差异)
before/after (变更前后对照)
full element (完整元素)
```

治理机制控制其暴露范围。

---

# 154. 字段差异并非总能保留 (Field Diff Is Not Always Retainable)

敏感或已被清除的数据可能阻止保留旧值。

事务历史依然可以保留：

```text
field changed (字段发生改变)
version changed (版本发生改变)
```

而无需保留被禁止的内容。

---

# 155. 变更流与缓存失效 (Change Stream and Cache Invalidation)

消费者可以使用变更流使以下组件失效：

```text
Epistemic Projection cache (认识论投影缓存)
search indexes (搜索索引)
Schema primers (模式预热器)
authorization caches (授权缓存)
Recall caches (记忆召回缓存)
materialized views (物化视图)
```

---

# 156. 变更流与维护 (Change Stream and Maintenance)

大脑 **可以 (MAY)** 根据变更流触发维护任务：

```text
new contradiction (新矛盾)
new Experience (新经验)
new Evidence (新证据)
new Commitment (新承诺)
```

但读取变更流本身绝不得自动强化记忆强度。

---

# 157. 变更流与复制 (Change Stream and Replication)

副本可以按 `space_seq` 顺序应用已提交的事务信封。

规范的复制格式可以与面向用户的变更输出有所不同。

---

# 158. 事务日志 vs. 认知活动 (Transaction Log vs. Cognitive Activity)

事务日志陈述的是：

> 状态发生了改变。

`Activity`（活动）陈述的是：

> 发生了一次语义/溯源过程。

两者截然不同。

一次巩固事务可能会创建：

```text
Activity C
```

而其提交记录证明了认知中枢存储了该活动。

---

# 159. 历史重构 (Historical Reconstruction)

KIP 需要清晰区分：

```text
current state (当前状态)
historical state (历史状态)
```

历史重构可以采用：

```text
versioned storage (多版本存储)
change log replay (变更日志重放)
periodic snapshots + log (定期快照 + 日志)
event-sourced representation (事件溯源呈现)
```

KIP 不限定具体的物理架构。

---

# 160. 所需逻辑能力 (Required Logical Capability)

声明支持以下特性的实现：

```text
historical_projection (历史投影)
historical_governance (历史治理)
```

**必须 (MUST)** 保留足够经过授权的历史数据以重构请求的状态，但受清除与留存限制的约束。

---

# 161. `AS OF space_seq`

在概念上，历史读取可以请求：

```text
Space state as of sequence N (截至序列 N 为止的空间状态)
```

具体的 KQL/META 语法在此不作硬性限定。

---

# 162. `AS OF tx_id`

因为每个已提交的事务都映射到一个序列号，具体实现 **可以 (MAY)** 支持：

```text
AS OF tx_id
```

---

# 163. `AS OF time`

基于时间的历史查询可以解析为：

```text
latest committed space_seq (满足 committed_at <= T 的最新已提交 space_seq)
```

受时钟语义约束。

为了实现精确的历史复现，序列号/事务标识是首选依据。

---

# 164. 历史认识论投影 (Historical Epistemic Projection)

为了回答：

> 智能体截至序列号 N 时相信什么？

需要重构：

```text
Cognitive Elements as of N (截至 N 的认知元素)
Assertion lifecycle as of N (截至 N 的断言生命周期)
Evidence available as of N (截至 N 可用的证据)
Schema Environment as of N (截至 N 的模式环境)
Trust/Governance policy state as of N (截至 N 的信任/治理策略状态)
```

随后运行选定的历史认识论投影（Epistemic Projection）语义。

---

# 165. 关于历史世界时间的当前信念 (Current Belief About Historical World Time)

这是完全不同的另一类查询：

> 智能体现如今对于世界时间 T 抱有何种信念？

应当使用：

```text
current cognitive state (当前认知状态)
current Evidence (当前证据)
current policy (当前策略)
Assertion valid_time around T (在 T 附近的断言有效时间)
```

事务使得这两种时间维度的区分具有可重现性。

---

# 166. 历史治理 (Historical Governance)

为了回答：

> 主体 P 在序列号 N 时是否可以读取元素 X？

需要重构截至 N 时的：

```text
Grant (授权)
Delegation (委托)
Group membership (组员身份)
Policy (策略)
ActorBinding (执行者绑定)
classification (密级)
Schema/Governance state (模式/治理状态)
```

---

# 167. 历史模式 (Historical Schema)

为了正确解释旧元素：

```text
schema_ref exact version (schema_ref 精确版本)
```

解析出其不可变的模式包工件（Package Artifact）。

模式环境历史还额外解释了：

```text
whether that version was active/default then (该版本在当时是否处于活跃/默认状态)
```

---

# 168. 历史起源 (Historical Origin)

`created_tx` / `updated_tx` 将元素连接至确切的提交记录（Commit Records）。

这允许追溯：

```text
when did this enter memory? (此内容何时进入记忆？)
which Principal wrote it? (由哪位主体写入？)
under which policy/schema? (在何种策略/模式下写入？)
```

---

# 169. 历史版本重构 (Historical Version Reconstruction)

如果一个元素经历以下变更：

```text
seq 100 version 1
seq 130 version 2
seq 190 version 3
```

在 seq 150 的查询将返回版本 2。

物理实现可以直接存储多版本或动态重构版本。

---

# 170. 历史留存类别 (History Retention Classes)

部署 **可以 (MAY)** 保留不同详细程度的历史：

```text
full history (完整历史)
lifecycle history (生命周期历史)
audit-only history (仅审计历史)
recent history (近期历史)
minimal receipts (最小回执)
```

系统能力必须准确声明支持哪些历史查询。

---

# 171. 清除边界 (Purge Boundary)

如果所需数据已依法被物理清除：

```text
historical reconstruction may return unavailable/redacted (历史重构可以返回“不可用/已脱敏”)
```

而不是伪造历史内容。

---

# 172. 快照压缩 (Snapshot Compaction)

具体实现 **可以 (MAY)** 将旧事务日志压缩为：

```text
historical snapshots (历史快照)
Merkle checkpoints (Merkle 检查点)
archive segments (归档段)
```

前提是必须保留所需的逻辑历史与审计语义。

---

# 173. 提交日志完整性 (Commit Log Integrity)

高保障实现 **应当 (SHOULD)** 保护提交历史免遭静默篡改。

可能的技术手段：

```text
append-only storage (仅追加存储)
hash chaining (哈希链)
Merkle structures (Merkle 树结构)
signed checkpoints (签名检查点)
replication (多副本复制)
```

KIP 2.0 基准不强制要求单一的密码学方案。

胶囊与证明规范后续可以定义可移植的证明格式。

---

# 174. 事务哈希链 (Transaction Hash Chain)

可选概念：

```text
commit_digest_n =
    H(commit_record_n, commit_digest_previous)
```

这可以提供防篡改的空间历史证明。

这并非所有实现的硬性要求。

---

# 175. 哈希链 vs. 真理 (Hash Chain vs. Truth)

防篡改的提交历史证明了：

```text
record history integrity (记录历史的完整性)
```

而非断言在语义层面的真理性。

---

# 176. 试运行 / 预览 (Dry Run / Preview)

事务 **可以 (MAY)** 支持：

```text
dry_run
preview
validate_only
```

其含义是：

```text
parse (解析)
resolve schema (解析模式)
authorize (授权检查)
evaluate planned mutations (评估计划中的突变)
validate constraints (验证约束)
estimate result (估算结果)
do not commit (不执行提交)
```

---

# 177. 预览不是预留 (Preview Is Not a Reservation)

状态在预览之后可能会发生变化。

因此：

```text
preview success (预览成功)
≠
future commit guaranteed (保证未来的提交必定成功)
```

实际提交时会重新验证所有相关条件。

---

# 178. 预览回执 (Preview Receipt)

预览可以返回：

```text
snapshot_seq (快照序列号)
schema environment (模式环境)
predicted write set (预计写集合)
validation warnings (验证警告)
authorization constraints (授权约束)
estimated impact (预估影响)
```

它必须明确声明：

```text
not committed (未提交)
```

---

# 179. 迁移预览 (Migration Preview)

特别适用于预估：

```text
affected element count (受影响元素数量)
incompatible fields (不兼容字段)
conflict changes (冲突变更)
Governance impact (治理影响)
estimated transaction batches (预计事务批次)
```

---

# 180. 导入预览 (Import Preview)

可以在提交前展示：

```text
new Concepts (新概念)
canonical merges (规范合并)
conflicts (冲突)
Schema dependencies (模式依赖)
classification (密级)
authority defaults (权限默认值)
untrusted executable artifacts (不受信任的可执行工件)
```

---

# 181. 治理预览 (Governance Preview)

高风险的策略/授权变更可以预览：

```text
who gains access (谁获得了访问权)
who loses access (谁失去了访问权)
which delegations become invalid (哪些委托关系失效)
```

但实际激活仍需依赖当前的审批状态。

---

# 182. 事务取消 (Transaction Cancellation)

客户端 **可以 (MAY)** 在提交前请求取消事务。

取消属于尽力而为（Best-effort）操作。

如果提交已经完成确定：

```text
cannot roll back by cancellation (无法通过取消操作进行回滚)
```

可能需要执行补偿事务。

---

# 183. 已提交认知历史无通用回滚 (No General Rollback of Committed Cognitive History)

KIP **不得 (SHOULD NOT)** 暴露：

```text
ROLLBACK COMMITTED TX (回滚已提交的事务)
```

以伪装成该历史从未发生过。

一个已提交的认知事件是关于该中枢的历史客观事实。

更正必须通过新的事务来完成。

---

# 184. 补偿机制 (Compensation)

为了撤销当前效果：

```text
create compensating state transition (创建补偿性的状态转换)
```

示例：

```text
wrong Grant created (创建了错误的授权)
    ↓
new tx revokes Grant (新事务撤销该授权)
```

原始提交仍然保留在审计日志中。

---

# 185. 认知更正是补偿而非时间旅行 (Cognitive Correction Is Compensation, Not Time Travel)

自身错误信念：

```text
A1 committed (A1 已提交)
```

后续更正：

```text
A2 supersedes A1 (A2 废弃替代 A1)
```

绝不要抹除 A1 曾存在过的历史事实，除非隐私策略要求物理清除。

---

# 186. 事务失败分类 (Transaction Failure Categories)

推荐类别：

```text
SyntaxError (语法错误)
ValidationError (验证错误)
AuthorizationDenied (授权拒绝)
ApprovalRequired (需要审批)
VersionConflict (版本冲突)
SerializationConflict (可串行化冲突)
PreconditionFailed (前置条件失败)
SchemaResolutionError (模式解析错误)
SchemaEnvironmentChanged (模式环境已改变)
SchemaVersionBlocked (模式版本已被封锁)
IdempotencyConflict (幂等冲突)
ReferenceConflict (引用冲突)
UniquenessConflict (唯一性冲突)
ResourceExhausted (资源耗尽)
TransactionTooLarge (事务过大)
CrossSpaceAtomicityUnsupported (不支持跨空间原子性)
ExternalSideEffectUnsupported (不支持外部副作用)
InternalError (内部错误)
```

具体的 KIP 错误代码在此不作硬性限定。

---

# 187. 可重试性 (Retryability)

错误 **应当 (SHOULD)** 标明：

```text
retryable (可直接重试)
non_retryable (不可重试)
retry_after_refresh (刷新状态后重试)
requires_approval (需要审批)
requires_schema_update (需要模式更新)
```

---

# 188. 版本冲突恢复 (Version Conflict Recovery)

正确的恢复模式：

```text
re-read current state (重新读取当前状态)
re-run reasoning/merge (重新执行推理/合并)
submit new transaction (提交新事务)
```

绝非：

```text
blind retry with same stale version (使用相同的过期版本盲目重试)
```

除非重试仅仅是为了通过幂等键确认之前不确定的提交结果。

---

# 189. 可串行化冲突恢复 (Serialization Conflict Recovery)

正确做法：

```text
retry whole transaction against fresh snapshot (针对最新的新鲜快照重试整个事务)
```

因为依赖于读取结果的推理逻辑可能已经发生改变。

---

# 190. 授权冲突恢复 (Authorization Conflict Recovery)

如果权限发生了变化：

```text
do not auto-retry under assumed old authority (绝不要在假设旧权限有效的前提下自动重试)
```

智能体应当审查当前生效的实际权限。

---

# 191. 模式冲突恢复 (Schema Conflict Recovery)

如果模式环境发生了变化：

```text
DESCRIBE current schema (描述当前模式)
re-resolve aliases (重新解析别名)
revalidate plan (重新验证执行计划)
```

除非幂等查询表明原始事务已经确定提交。

---

# 192. 幂等冲突恢复 (Idempotency Conflict Recovery)

绝不要通过生成一个随机的新键来掩盖“同键不同请求”的程序缺陷，除非已经明确决定替换原始逻辑操作。

该冲突是客户端状态混乱的明确信号。

---

# 193. 事务过期 (Transaction Expiry)

事务 **可以 (MAY)** 设置：

```text
max_execution_time (最大执行时间)
deadline (截止期限)
```

如果在提交前截止期限到期：

```text
abort (中止)
```

---

# 194. 长事务 (Long Transactions)

长时间运行的写事务会增加：

```text
conflict probability (冲突概率)
snapshot retention (快照留存压力)
revocation delay pressure (权限撤销延迟压力)
resource usage (资源占用)
```

KIP 智能体工作流 **应当 (SHOULD)** 优先采用短小精悍的原子写操作。

在可能的情况下在事务外部进行推理，然后使用显式前置条件执行写入。

---

# 195. 勿在 LLM 思考时持有大脑事务 (Do Not Hold Brain Transaction While LLM Thinks)

推荐流程：

```text
read snapshot/state (读取快照/状态)
    ↓
LLM reasoning outside transaction (在事务外部进行 LLM 推理)
    ↓
write transaction with preconditions (携带前置条件执行写事务)
```

绝非：

```text
BEGIN transaction (开启事务)
call LLM for 30 seconds (调用 LLM 等待 30 秒)
commit (提交)
```

---

# 196. 原因 (Why)

LLM 的推理过程具有：

```text
slow (延迟高)
non-deterministic (非确定性)
potentially tool-calling (可能调用外部工具)
```

因此绝不应当长期占用事务资源。

---

# 197. 事务意图摘要 (Transaction Intent Digest)

大脑可以记录一个可选的语义：

```text
intent_digest
```

描述执行该事务的高层原因。

这属于审计元数据，它不能替代实际的操作与溯源。

---

# 198. 人类可读事务摘要 (Human-Readable Transaction Summary)

回执或审计记录 **可以 (MAY)** 包含：

```text
"Corrected Alice's timezone based on new direct statement." (根据最新的直接陈述更正了 Alice 的时区)
```

该摘要仅作为非权威的便利性描述。

实际的变更集合始终具有规范性。

---

# 199. 事务溯源活动 (Transaction Provenance Activity)

某些认知操作 **应当 (SHOULD)** 同时创建语义 `Activity`。

示例：

```text
transaction class = maintenance (事务类别 = 维护)
Activity class = semantic_consolidation (活动类别 = 语义巩固)
```

事务证明了存储状态的转换。

活动表达了认知的处理过程。

---

# 200. 事务不替代活动 (Transaction Does Not Replace Activity)

并非每次事务都意味着需要在图谱中存储世界/认知活动。

示例：

```text
cache-neutral reindex (无损缓存的重新索引)
schema lock administrative update (模式锁管理更新)
Grant revoke (授权撤销)
```

完全可以通过事务/治理审计得到充分解释。

---

# 201. 提交后钩子 (Commit Hooks)

引擎内部系统可以在提交后触发：

```text
index update (索引更新)
change notification (变更通知)
cache invalidation (缓存失效)
replication (数据复制)
maintenance scheduling (维护调度)
```

即使下游钩子执行失败，这些钩子 **严禁 (MUST NOT)** 导致原始事务变为部分提交状态。

---

# 202. 通知前先持久化提交 (Durable Commit Before Notification)

推荐顺序：

```text
durable state + Commit Record (持久化状态 + 提交记录)
    ↓
commit finalized (提交正式确立)
    ↓
notifications/change delivery (发送通知 / 变更投递)
```

如果通知投递失败，消费者通过变更流（Change Stream）进行补偿恢复。

---

# 203. 索引一致性 (Index Consistency)

搜索索引可以在提交后异步更新。

如果是异步更新，运行时能力必须声明：

```text
search consistency lag (搜索一致性延迟)
```

基于 ID/状态的规范 KQL 读取必须按照声明的一致性反映已提交的真实数据源。

---

# 204. 搜索不是提交权威 (Search Is Not Commit Authority)

刚提交的元素可能会在最终一致的语义索引中短暂缺失。

这并不意味着事务失败。

回执与基于 ID 的读取才是权威依据。

---

# 205. 读一致性级别 (Read Consistency Levels)

运行时 **可以 (MAY)** 声明不同的读取通道：

```text
strong (强一致性)
snapshot (快照一致性)
eventual-index (最终一致索引)
```

对于正确性敏感的智能体工作流，KIP 规范状态操作应当提供强一致/快照读取路径。

---

# 206. 事务与搜索规划 (Transaction and Search Planning)

智能体不应当将最终一致搜索结果中的“不存在”作为仅创建保证。

应当使用：

```text
canonical identity (规范身份)
client_key (客户端键)
EXPECT VERSION (版本守卫)
transaction precondition (事务前置条件)
```

---

# 207. 试运行 ID (Dry-Run IDs)

预览应当尽可能避免分配持久化 ID。

它 **可以 (MAY)** 返回：

```text
temporary handles (临时句柄)
predicted canonical matches (预估的规范匹配)
```

但客户端绝不能假设预览 ID 会被正式提交，除非有明确支持的预留机制。

---

# 208. ID 分配 (ID Allocation)

ID 可以在内部提交前进行分配。

如果复用被中止的 ID 可能会混淆审计/引用系统，则 **不得 (SHOULD NOT)** 复用。

核心模型倾向于 ID 永不复用。

---

# 209. 事务本地时间 (Transaction Local Time)

引擎维护的所有事务时间戳应当使用一致的提交时间基准。

语义时间依然保持独立：

```text
Evidence.observed_at (证据观察时间)
Assertion.asserted_at (断言主张时间)
Assertion.valid_time (断言有效时间)
```

---

# 210. 事务时间不是世界时间 (Transaction Time Is Not World Time)

今天提交的记忆可能描述的是去年发生的事件：

```text
committed_at = today (提交时间 = 今天)
valid_time   = last year (有效时间 = 去年)
```

绝不能单纯从事务提交顺序推断现实世界的时序。

---

# 211. 事务时间是认知可用时间 (Transaction Time Is Cognitive Availability Time)

事务提交回答的是：

> 该中枢（Nexus）何时获取或改变了该持久化认知状态？

这使得事务时间成为双时态认知（Bitemporal Cognition）的核心基石。

---

# 212. 并发证据的事务排序 (Transaction Ordering of Concurrent Evidence)

两次观察在真实世界中的发生时序可能是：

```text
E1 observed_at 10:00 (E1 在 10:00 被观察到)
E2 observed_at 10:01 (E2 在 10:01 被观察到)
```

但由于网络延迟等原因，它们可能以相反的顺序提交。

这两个时钟维度均被保留：

```text
observation order ≠ cognitive commit order (观察顺序 ≠ 认知提交顺序)
```

---

# 213. 事务排序与信念修订 (Transaction Ordering and Belief Revision)

大脑可能会收到关于较早现实世界时间的迟到证据。

新事务可以修订“当前关于历史的信念”，而无需改写“历史某时刻当时的信念”。

---

# 214. 并发写入期间的一致投影 (Consistent Projection During Concurrent Writes)

认识论投影（Epistemic Projection）**应当 (SHOULD)** 针对单一确定的快照执行：

```text
snapshot_seq
```

以确保支持集与反对集不会混用来自不同提交的不一致状态。

---

# 215. 投影结果快照标识 (Projection Result Snapshot Identity)

投影输出 **应当 (SHOULD)** 能够包含：

```text
snapshot_seq (快照序列号)
schema environment (模式环境)
policy version (策略版本)
```

以便未来能够精确复现该决策。

---

# 216. 决策溯源 (Decision Provenance)

决策活动（Decision Activity）可以引用：

```text
Projection audit (投影审计)
snapshot_seq (快照序列号)
```

在产生结果之后，大脑可以明确回答：

> 究竟是哪些确切的认知状态指导了该决策？

---

# 217. 治理决策快照 (Governance Decision Snapshot)

KIP 写入操作的授权与智能体决策所采用的认识论投影是不同的。

两者可能引用相同的空间序列号，但属于不同的策略系统。

切勿混淆：

```text
allowed to write (被允许写入)
```

与：

```text
believed premise (被采信的前提)
```

---

# 218. 模式快照与历史决策 (Schema Snapshot and Historical Decision)

历史决策可以依据：

```text
schema definitions active/used then (当时生效/使用的模式定义)
```

进行审计，而非使用当前的类型语义。

---

# 219. 变更流背压 (Change Stream Backpressure)

消费者可能会发生消费滞后。

运行时 **应当 (SHOULD)** 提供：

```text
cursor resume (游标恢复)
retention window (留存窗口)
checkpoint/snapshot recovery (检查点/快照恢复)
```

而非强制要求实时消费。

---

# 220. 变更流留存 (Change Stream Retention)

如果详细的变更记录已过期，运行时应当根据一致性级别提供恢复策略，例如：

```text
current snapshot + later stream (当前快照 + 后续流)
archive fetch (从归档获取)
```

---

# 221. 消费者检查点 (Consumer Checkpoint)

消费者在其自身状态内部或外部存储：

```text
last applied cursor/space_seq (最后应用的游标 / 空间序列号)
```

重复处理必须保持幂等。

---

# 222. 流重新交付 (Stream Redelivery)

“至少一次”交付的流意味着：

```text
same Change Envelope may arrive again (相同的变更信封可能会再次到达)
```

消费者依据事务标识进行去重。

---

# 223. 变更流不是断言流 (Change Stream Is Not an Assertion Feed)

变更记录表明的是：

```text
Assertion A was created (断言 A 被创建了)
```

而非：

```text
Proposition P became true (命题 P 变为了真)
```

认识论投影依然负责判定信念。

---

# 224. 变更流默认不是记忆强化信号 (Change Stream Is Not a Memory-Reinforcement Signal by Default)

对同一变更信封的重复消费/重放绝严禁：

```text
increase confidence (增加置信度)
increase evidence count (增加证据计数)
create duplicate Experience (创建重复的经验)
```

必须要求消费者具备幂等性。

---

# 225. 事务与事件溯源 (Transaction and Event Sourcing)

KIP 不强制要求纯粹的事件溯源（Event Sourcing）。

合法的实现方式包括：

```text
current-state store + append log (当前状态存储 + 追加日志)
MVCC database (多版本并发控制数据库)
event store + projections (事件存储 + 投影)
snapshot database + audit log (快照数据库 + 审计日志)
```

只要能够满足 KIP 对外可观察的语义即可。

---

# 226. 当前状态仍是一等公民 (Current State Is Still First-Class)

KIP 不应强迫每次常规查询都去重放事务日志。

日志的存在是为了：

```text
history (历史)
audit (审计)
replication (复制)
change stream (变更流)
```

当前认知图谱针对记忆召回（Recall）进行了专门优化。

---

# 227. 事务日志是引擎状态而非普通图谱 (Transaction Log Is Engine State, Not Ordinary Graph)

提交记录和底层变更记录属于引擎/审计状态。

它们 **不得 (SHOULD NOT)** 自动作为普通概念（Concept）出现。

Profile **可以 (MAY)** 选择性地将高层事务镜像映射为事件/活动（Events/Activities）。

---

# 228. 事务可见性 (Transaction Visibility)

治理规则同样适用于事务历史。

主体可能被允许读取某个元素，但不被允许获知：

```text
who originally wrote it (最初由谁写入)
internal policy decision (内部策略决策)
other hidden changes in same transaction (同一事务中的其他隐藏变更)
```

回执与历史可以进行脱敏处理。

---

# 229. 原子事务与隐藏变更 (Atomic Transaction and Hidden Changes)

如果一个事务同时修改了可见记录与隐藏记录，低权限的变更流视图绝不能泄露隐藏变更的计数或细节。

它可以暴露：

```text
one visible change envelope projection (一个可见的变更信封投影)
```

或其他符合策略的安全呈现方式。

---

# 230. 事务大小侧信道 (Transaction Size Side Channel)

详细的突变计数可能会泄露隐藏状态。

治理机制可以对以下信息进行脱敏：

```text
total changes (总变更数)
hidden IDs (隐藏 ID)
exact affected counts (精确受影响计数)
```

---

# 231. 跨空间传输模式 (Cross-Space Transfer Pattern)

推荐模式：

```text
Source Space Tx/Read Snapshot: (源空间事务/读快照)
    export Capsule C at source_seq (在 source_seq 导出胶囊 C)

Transfer: (传输层)
    durable external/capsule identity (持久化外部/胶囊标识)

Destination Tx: (目标空间事务)
    import C with idempotency_key (携带 idempotency_key 导入 C)
```

不声称任何分布式原子性。

---

# 232. 源端导出突变 (Source Export Mutation)

纯粹的导出属于只读操作，无需创建认知状态事务。

如果策略要求对导出进行审计：

```text
Governance audit transaction/event (治理审计事务/事件)
```

可以记录该导出行为的发生。

---

# 233. 目标端导入标识 (Destination Import Identity)

导入回执应当记录：

```text
source Capsule digest (源胶囊摘要)
source origin receipt if available (源端起源回执，若可用)
destination tx_id (目标端事务 ID)
destination space_seq (目标端空间序列号)
```

这支持了端到端的传输审计。

---

# 234. 传输重试 (Transfer Retry)

目标端重试使用：

```text
idempotency_key derived from transfer/capsule identity (源自传输/胶囊标识派生的幂等键)
```

以避免重复导入。

---

# 235. 跨空间 Saga (Cross-Space Saga)

对于在目标端导入完成后要求源端执行突变的工作流：

```text
1. destination import commits (目标端导入提交)
2. source receives acknowledgement (源端收到确认通知)
3. source marks transfer state (源端标记传输状态)
```

如果步骤 3 失败，发起重试。

绝不要伪造分布式回滚。

---

# 236. 治理传输风险 (Governance Transfer Risk)

源端的导出权限与目标端的导入权限是独立评估的。

在一端获得授权的主体绝不会自动在另一端获得相应权限。

---

# 237. 事务能力协商 (Transaction Capabilities)

运行时能力协商 **应当 (SHOULD)** 声明：

```text
atomic_transactions (原子事务)
serializable_transactions (可串行化事务)
read_snapshots (读快照)
historical_reads (历史读取)
idempotency (幂等性)
idempotency_retention (幂等留存期)
change_stream (变更流)
change_stream_retention (变更流留存期)
transaction_lookup (事务查询)
dry_run (试运行)
max_transaction_operations (最大事务操作数)
max_transaction_writes (最大事务写入数)
multi_space_atomic (跨空间原子性)
```

---

# 238. 事务一致性级别 (Transaction Conformance Levels)

可能的测试套件分类：

```text
KIP Transactions Core (核心事务)
KIP Transactions Serializable (可串行化事务)
KIP Transactions Historical (历史事务)
KIP Transactions Change Stream (变更流事务)
KIP Transactions High Assurance (高保障事务)
```

---

# 239. 核心事务一致性 (Core Transaction Conformance)

一个最小符合规范的 KIP 2.0 事务实现 **必须 (MUST)** 对以下语义提供等价支持：

```text
single-Space atomic write (单空间原子写)
no dirty reads (无脏读)
read-your-writes within transaction (事务内读你所写)
all-or-nothing commit (全有或全无提交)
engine transaction ID (引擎事务 ID)
element versioning (元素版本控制)
optimistic version guards (乐观版本守卫)
Schema Environment binding (模式环境绑定)
Governance authorization (治理授权)
idempotent transaction retry (幂等事务重试)
Receipt (回执凭证)
```

---

# 240. 可串行化一致性 (Serializable Conformance)

增加：

```text
serializable outcome (可串行化结果)
predicate/range conflict protection (谓词/范围冲突保护)
write-skew prevention (防范写偏斜)
```

---

# 241. 历史一致性 (Historical Conformance)

增加：

```text
Space commit ordering (空间提交全序)
historical state reconstruction (历史状态重构)
lifecycle reconstruction (生命周期重构)
historical Governance/schema context (历史治理/模式上下文)
```

---

# 242. 变更流一致性 (Change Stream Conformance)

增加：

```text
resumable cursor (可恢复游标)
ordered transaction envelopes (有序事务信封)
at-least-once-safe identity (至少一次安全标识)
authorized filtering/redaction (经过授权的过滤/脱敏)
```

---

# 243. 高保障一致性 (High-Assurance Conformance)

可以增加：

```text
tamper-evident commit log (防篡改提交日志)
signed/checkpointed receipts (已签名/检查点回执)
strong audit retention (强审计留存)
policy/Schema digest receipts (策略/模式摘要回执)
```

---

# 244. 事务一致性测试用例 (Transaction Conformance Fixtures)

测试集应当包括：

```text
multi-element belief revision commits atomically (跨多元素的信念修正原子提交)
middle operation failure leaves zero durable changes (中间操作失败确保零持久化残留)
read-your-writes (读你所写验证)
concurrent version conflict (并发版本冲突)
write skew under serializable mode (可串行化模式下的写偏斜防范)
same idempotency key exact retry (相同幂等键精确重试)
same key different request (相同键不同请求检测)
network-loss lookup/retry (网络丢失下的查询/重试)
same canonical Proposition concurrent creation (相同规范命题并发创建)
no-op write does not bump element version (无效果写入不递增元素版本)
schema alias resolved consistently during transaction (事务中模式别名一致解析)
schema blocked before commit (提交前模式被封锁)
Grant revoked before commit (提交前授权被撤销)
approval revoked before commit (提交前审批被撤销)
large transaction abort (大型事务中止)
change envelope order (变更信封排序)
historical lifecycle reconstruction (历史生命周期重构)
purged history returns unavailable (已被清除的历史返回不可用)
transport batch remains non-atomic (传输批处理保持非原子性)
cross-space atomic request rejected unless capability (除非声明能力否则拒绝跨空间原子请求)
external tool action not claimed as rollback-safe (外部工具动作不声称回滚安全)
```

---

# 245. 幂等性测试用例 (Idempotency Fixtures)

```text
commit succeeds, response lost, retry (提交成功但响应丢失后的重试)
abort before commit, retry after correction (提交前中止，修正后的重试)
same request different whitespace (相同请求不同空白排版)
same key different parameter (相同键不同参数)
key reuse by different Principal (不同主体复用相同键)
key retention expiry (键留存期过期)
client_key collision (client_key 冲突)
repeated genuine user statement (用户真实重复陈述的处理)
```

---

# 246. 隔离性测试用例 (Isolation Fixtures)

```text
T1/T2 update same element (T1/T2 更新同一元素)
T1/T2 create same canonical Proposition (T1/T2 创建相同规范命题)
T1/T2 activate mutually exclusive profile state (T1/T2 激活互斥的 Profile 状态)
range query + concurrent insert causing write skew (范围查询 + 并发插入导致写偏斜)
Governance revoke during transaction (事务执行期间治理撤销)
Schema Environment activation during transaction (事务执行期间模式环境激活)
```

---

# 247. 历史测试用例 (Historical Fixtures)

```text
Assertion active at seq 10 (断言在 seq 10 处于活跃状态)
superseded at seq 20 (在 seq 20 被废弃替代)
query seq 15 → active (在 seq 15 查询 → 活跃)
query seq 25 → superseded (在 seq 25 查询 → 被替代)

Grant active at seq 30 (授权在 seq 30 处于活跃状态)
revoked at seq 40 (在 seq 40 被撤销)
authorization-as-of 35 → allowed (截至 35 的授权查询 → 允许)
authorization-as-of 45 → denied (截至 45 的授权查询 → 拒绝)

Schema @2 default at seq 50 (模式 @2 在 seq 50 为默认)
Schema @3 default at seq 60 (模式 @3 在 seq 60 为默认)
element created seq 55 → @2 (在 seq 55 创建的元素 → 关联 @2)
element created seq 65 → @3 (在 seq 65 创建的元素 → 关联 @3)
```

---

# 248. 变更流测试用例 (Change Stream Fixtures)

```text
one transaction changes five elements (一个事务修改五个元素)
→ one envelope (→ 生成单个变更信封)

consumer receives envelope twice (消费者收到两次相同信封)
→ applies once (→ 仅应用一次)

hidden Evidence changed in same tx (同一事务中修改了隐藏证据)
→ unauthorized stream does not leak hidden detail (→ 未授权流不泄露隐藏细节)

cursor resumes after reconnect (重新连接后游标恢复)
→ no committed transaction lost (→ 不丢失任何已提交事务)
```

---

# 249. 外部副作用测试用例 (External Side-Effect Fixtures)

```text
transaction attempts embedded HTTP call (事务尝试内嵌 HTTP 调用)
→ reject/unsupported (→ 拒绝 / 不受支持)

ActionIntent commits (行动意图 ActionIntent 提交)
worker executes once with external idempotency (工作进程在外部幂等下执行一次)
outcome delivered twice (结果被投递两次)
→ one durable outcome Evidence through KIP idempotency (→ 通过 KIP 幂等性仅生成一条持久化结果证据)
```

---

# 250. 事务不变式 (Transaction Invariants)

以下为规范性设计目标：

1. KIP 事务是原子性的持久认知/控制状态转换。
2. 传输批处理不是原子事务。
3. 先前的成功传输批处理写入不会因后续批处理错误而被追溯回滚。
4. 显式事务的突变操作遵循全有或全无（All-or-nothing）原则。
5. 基准事务原子性的作用域限定在单个 MemorySpace 内。
6. 跨空间原子性不是核心规范的保证。
7. 每次产生状态变更的提交都会获得一个 `tx_id`。
8. 空间内每次产生状态变更的提交都会获得一个单调递增的 `space_seq`。
9. `space_seq` 是逻辑排序的权威依据，而非物理挂钟时间戳。
10. 单个空间在认知、治理和模式环境状态转换中 **应当 (SHOULD)** 共享统一的逻辑提交顺序。
11. 每个事务均从一个连贯一致的起始快照中读取数据。
12. 事务能够读取自身产生的暂存写入（读你所写）。
13. 未提交的写入对外部观察者严格保持不可见。
14. 提交操作作为一个单一的原子状态转换对外呈现。
15. 产生状态变更的写事务 **应当 (SHOULD)** 提供可串行化（Serializable）结果。
16. 规范不强制限定底层的数据库实现策略。
17. 外部的“先读后写”推理过程不会自动合并为同一个事务。
18. 依赖于读取结果的外部推理应当使用显式前置条件。
19. `EXPECT VERSION` 保护的是具体元素的修订版本，而非全空间状态。
20. 元素版本与空间序列号属于不同的维度。
21. 被修改的已存在元素在单个已提交事务中版本号严格递增一次。
22. 新创建的元素初始版本号为 1。
23. 无效果的写入操作不得递增元素版本号。
24. 对于被修改的元素，`updated_at` 反映其事务提交时间。
25. `updated_tx` 明确标识执行提交的事务。
26. 模式局部名称针对捕获的单一模式环境进行解析。
27. 持久化的引用均使用精确的模式版本。
28. 并发的模式默认值变更绝不得静默地重新解释正在运行中的事务。
29. 在提交前被封锁的模式包会导致事务失效。
30. 权限在提交前必须重新进行验证。
31. 在提交前被撤销的权限会阻止事务提交（撤销优先）。
32. 在提交前被撤销或过期的审批会阻止依赖该审批的事务提交。
33. 认知内容本身绝不得篡改事务的授权上下文。
34. 事务起源由引擎严格控制。
35. 事务起源不能替代语义溯源。
36. 事务幂等性与逻辑元素幂等性彼此分离。
37. 相同的限定作用域幂等键 + 相同的请求会返回原始的已确立结果。
38. 相同的限定作用域幂等键 + 不同的请求会直接失败。
39. 在遇到不确定的网络丢失后进行重试应当使用事务查找/幂等机制。
40. 命题的结构唯一性在并发创建中得以维持。
41. 重复的断言绝不会仅仅因语义相等而被自动去重。
42. 无效果的幂等写入不得产生认知变更噪声。
43. 在声明支持历史一致性的部署中，历史生命周期转换必须具备可重构性。
44. 撤回历史绝不会被当前的生命周期状态所抹除。
45. 更正操作体现为一个新的事务，而不是改写过去的事务历史。
46. 已提交的事务历史遵循仅追加保留原则，受法律/隐私清除规则的约束。
47. 对已提交认知历史进行通用回滚不属于 KIP 的语义范畴。
48. 撤销当前效果必须采用补偿事务。
49. KIP 事务不会对物理外部世界的副作用提供原子回滚保证。
50. 任意的外部工具调用不应当在 KIP 原子提交内部执行。
51. 外部动作工作流应当采用持久化的意图/结果模式。
52. 事务回执证明的是提交事实，而非语义层面的真理性。
53. 回执的可见性受治理策略控制。
54. 变更流按照已提交的事务标识/序列号进行排序。
55. 变更流的交付可以采用至少一次保证。
56. 消费者必须对变更信封进行去重。
57. 重放变更信封不会生成新的证据或产生记忆强化。
58. 事务历史属于引擎/审计状态，不会自动成为认知图谱内容。
59. 活动（Activity）与事务（Transaction）是完全独立的不同概念。
60. 模式迁移历史必须保留语义版本上下文。
61. 模式环境的激活是原子性的。
62. 写事务针对单一模式环境快照执行。
63. 当权限空隙或重叠至关重要时，治理替换操作可以是原子性的。
64. 导入有边界的单一空间必须是原子的，或显式进行暂存/隔离。
65. 大型维护/迁移/导入作业可以由多个有明确边界的事务构成。
66. 当批次边界清晰明确时，作业级别的局部进展不破坏事务原子性。
67. 试运行/预览并不预留未来的提交成功。
68. 提交时会对预览时的假设条件进行全面重新验证。
69. 提交完成后发起事务取消无法抹去已发生历史。
70. 历史重构可能受合法清除的限制，且绝严禁伪造已删除的内容。

---

# 251. 推荐事务 API 形式 (Recommended Transaction API Shape)

说明性结构：

```json
{
  "space_id": "space-1",

  "transaction": {
    "mode": "atomic",

    "idempotency_key": "memory-formation:msg-991",

    "isolation": "serializable",

    "preconditions": {
      "schema_environment_version": 17
    },

    "operations": [
      {
        "command": "..."
      },
      {
        "command": "..."
      }
    ]
  }
}
```

最终 API 也可以提供：

```text
execute_transaction(...)
```

以确保原子性边界绝不会与已有的 `execute_kip(commands=...)` 发生混淆。

---

# 252. 推荐命名决策 (Recommended Naming Decision)

因为 KIP 1.x 已经使用：

```text
commands[]
```

来表示非原子的批处理执行，因此 KIP 2.0 **应当 (SHOULD)** 避免通过添加隐蔽的标记参数：

```text
commands[] + transaction=true
```

来引入事务。

采用一个独立的顶层事务形式或专用 API 更加安全且具备自解释性。

---

# 253. 可能的接口分离 (Possible Interface Separation)

推荐的概念接口：

```text
execute_kip
    one command / transport batch (单命令 / 传输批处理)

execute_kip_transaction
    explicit atomic transaction (显式原子事务)

execute_kip_readonly
    ordinary read (常规只读读取)

execute_kip_snapshot
    multiple reads pinned to one snapshot (绑定至单一快照的多重读取)

transaction_status
    lookup by tx_id / idempotency key (按 tx_id / 幂等键查询事务状态)

changes
    resumable Space Change Stream (可恢复的空间变更流)
```

---

# 254. 为什么显式接口有助于智能体 (Why Explicit Interface Helps Agents)

大语言模型（LLM）能够清晰理解：

```text
"These four changes must succeed together." (这四个变更必须全部同时成功)
```

并主动选择：

```text
transaction (事务)
```

而不是意外依赖批处理的非原子行为。

原子性在工具模型中变得显式可见。

---

# 255. 示例：原子信念修正 (Example: Atomic Belief Correction)

概念事务：

```text
TRANSACTION:
    create Evidence E2 (创建证据 E2)
        "Alice now says timezone is +01:00" (Alice 现在陈述其时区为 +01:00)

    canonicalize Proposition P2 (规范化命题 P2)
        (Alice, timezone, "+01:00")

    create Assertion A2 (创建断言 A2)
        support P2
        asserted_by Alice
        evidence E2

    supersede self-derived Assertion A1 (废弃替代自身衍生的断言 A1)

    create Activity C (创建活动 C)
        correction / consolidation
        inputs A1, E2
        output A2
```

提交结果：

```text
either all five relationships/state changes exist (要么这五个关系/状态变更全部存在)
or none do (要么全部不存在)
```

---

# 256. 示例：并发维护冲突 (Example: Concurrent Maintenance Conflict)

记忆形成模块读取到：

```text
Preference version 4 (偏好版本 4)
```

维护模块同时也读取到版本 4。

记忆形成事务成功提交并产生版本 5。

维护模块尝试提交：

```text
EXPECT VERSION 4
```

执行结果：

```text
VersionConflict (版本冲突)
```

维护模块重新读取并重新评估，而不是直接覆盖记忆形成模块的更新。

---

# 257. 示例：写偏斜 (Example: Write Skew)

两个维护工作进程同时观察到：

```text
no current canonical Skill for goal G (目标 G 当前尚无规范技能)
```

两者均计划创建一个技能。

可串行化事务语义确保：

```text
one commits first (其中一个率先提交)
second revalidates conflict/invariant (第二个重新验证冲突/不变式)
```

而不是在 Profile 声明了唯一性不变式的情况下静默创建两个“当前主技能”。

---

# 258. 示例：提交期间治理撤销 (Example: Governance Revocation During Commit)

```text
seq 100:
Agent has export authority. (智能体拥有导出权限)

Agent starts export-audit transaction. (智能体启动导出审计事务)

seq 101:
Owner revokes export authority. (所有者撤销了导出权限)

Agent reaches commit. (智能体事务到达提交阶段)
```

提交时刻的治理重新验证判定：

```text
deny/abort (拒绝 / 中止)
```

权限在被撤销后绝严禁再被使用。

---

# 259. 示例：形成期间模式升级 (Example: Schema Upgrade During Formation)

记忆形成启动时所处的环境：

```text
Schema Environment v17
Experience → @2.0.0
```

治理激活了新环境 v18：

```text
default @2.1.0 (默认模式版本为 @2.1.0)
```

如果 `@2.0.0` 仍然处于可写状态：

```text
Formation may commit exact @2.0.0 refs (形成事务可以提交精确的 @2.0.0 引用)
Receipt records environment v17 (回执记录使用环境 v17)
```

如果 `@2.0.0` 因安全原因已被封锁：

```text
abort (事务中止)
```

---

# 260. 示例：网络超时 (Example: Network Timeout)

客户端提交事务：

```text
idempotency_key = run-991
```

中枢成功提交：

```text
tx-500
space_seq 900
```

网络响应丢失。

客户端使用相同的键发起重试。

中枢直接返回：

```text
tx-500
space_seq 900
```

不会重复创建任何多余的证据/断言。

---

# 261. 示例：相同幂等键，不同载荷 (Example: Same Idempotency Key, Different Payload)

首次请求：

```text
run-991 → Alice timezone +08 (Alice 时区为 +08)
```

后续程序缺陷导致：

```text
run-991 → Alice timezone +01 (Alice 时区为 +01)
```

预期结果：

```text
IdempotencyConflict (幂等冲突)
```

绝不会将第二次请求静默视为合法重试。

---

# 262. 示例：读事务 (Example: Read Transaction)

智能体需要一个连贯一致的审计视图：

```text
FIND Assertion (查找断言)
FIND Evidence (查找证据)
DESCRIBE schema (描述模式)
PROJECT belief (执行信念投影)
```

读事务锁定：

```text
snapshot_seq = 1200
```

所有查询结果均引用同一个连贯一致的状态。

---

# 263. 示例：行动流程 (Example: Action Flow)

```text
Tx 1:
    Decision Activity (决策活动)
    ActionIntent (行动意图)
    projection snapshot ref (投影快照引用)
    commit (提交)

External worker: (外部工作进程)
    sends email (发送电子邮件)

Tx 2:
    Evidence: email API accepted (证据：邮件 API 已接收)
    Activity outcome (活动结果)
    Experience update (经验更新)
```

如果 Tx 2 失败，邮件依然已经发出。

使用外部操作 ID/幂等性重试 Tx 2。

KIP 绝不会假装该邮件可以被回滚撤销。

---

# 264. 示例：大型导入 (Example: Large Import)

包含 100,000 个元素的胶囊。

替代一个巨大的单事务：

```text
Stage chunks into quarantine (将分块暂存至隔离区)
    tx 1..N

Validate complete staged package (验证暂存包完整性)

Final tx: (最终事务)
    publish/import manifest (发布/导入清单)
    activate visibility (激活可见性)
```

常规记忆召回（Recall）绝不可能看到只导入了一半的不完整状态。

---

# 265. 示例：历史信念 (Example: Historical Belief)

```text
seq 10:
A1 active (A1 处于活跃状态)

seq 20:
A2 created (A2 被创建)
A1 superseded (A1 被替代)

seq 30:
counter-Evidence arrives (反面证据到达)
```

查询：

```text
belief as of seq 15 (截至序列 15 的信念)
```

重构得到 A1 处于活跃状态。

查询：

```text
belief as of seq 25 (截至序列 25 的信念)
```

重构得到 A1 被替代 + A2 处于活跃状态。

而关于同一历史世界时期的当前最新信念，还可以额外使用 seq 30 到达的证据。

---

# 266. 示例：历史授权 (Example: Historical Authorization)

```text
seq 40:
Grant G active (授权 G 处于活跃状态)

seq 50:
G revoked (授权 G 被撤销)
```

在：

```text
seq 45
```

提交的写入操作可以被确凿证明是在 G 依然有效时发生的。

而在 seq 50 之后的写入尝试绝无法再依赖 G。

---

# 267. 示例：无效果 UPSERT (Example: No-Op UPSERT)

当前状态：

```text
Concept.name = "Alice"
version = 7
```

事务设置：

```text
name = "Alice"
```

最终规范状态未发生改变。

执行结果：

```text
no_effect (无效果)
version remains 7 (版本号保持为 7)
updated_at unchanged (updated_at 时间戳保持不变)
no cognitive Change Envelope (不发出任何认知变更信封)
```

---

# 268. 示例：语义事件 vs. 提交事件 (Example: Semantic Event vs. Commit Event)

现实世界：

```text
Alice changed jobs on July 1. (Alice 于 7 月 1 日跳槽)
```

大脑在 8 月 13 日获知该信息。

断言记录：

```text
valid_from = July 1 (有效起始时间 = 7 月 1 日)
asserted_at = August 13 (主张时间 = 8 月 13 日)
```

事务记录：

```text
committed_at = August 13 (提交时间 = 8 月 13 日)
space_seq = 2000 (空间序列号 = 2000)
```

这三个时间线均得到忠实保留。

---

# 269. 与核心数据模型的关系 (Relationship to Core Data Model)

事务机制正式落实了核心模型的若干规范要求：

```text
_system.version (元素版本)
created_tx (创建事务)
updated_tx (更新事务)
atomic cognitive transition (原子认知转换)
client_key interaction (client_key 交互)
canonical Proposition concurrency (规范命题并发控制)
```

核心模型定义了持久化元素模型。

事务定义了元素状态如何连贯一致地发生转换。

---

# 270. 与认识模型的关系 (Relationship to Epistemic Model)

事务提供了：

```text
Assertion lifecycle history (断言生命周期历史)
Evidence availability history (证据可用性历史)
belief-as-of boundaries (特定时点信念边界)
decision snapshot identity (决策快照标识)
```

这是执行历史认识论投影（Historical Epistemic Projection）的必备基石。

---

# 271. 与治理模型的关系 (Relationship to Governance)

事务提供了：

```text
atomic Grant/Policy changes (原子性授权/策略变更)
commit-time revocation safety (提交时刻撤销安全性)
Governance audit ordering (治理审计全序排列)
historical authorization (历史授权回溯)
approval binding (审批绑定)
```

治理负责裁决权限。

事务确保权限敏感的状态变更具备持久性与确定时序。

---

# 272. 与模式包的关系 (Relationship to Schema Packages)

事务提供了：

```text
Schema Environment snapshot (模式环境快照)
exact resolution boundary (精确解析边界)
atomic activation (原子激活)
migration batching (迁移批次划分)
upgrade conflict handling (升级冲突处理)
receipt schema version (回执中的模式版本)
```

---

# 273. 与认知胶囊的关系 (Relationship to Cognitive Capsule)

本文档确立了对 [KIP-2.0-Capsule.md](KIP-2.0-Capsule.md) 的要求：

```text
snapshot-consistent export (快照一致性导出)
source Space sequence (源端空间序列号)
destination idempotent import (目标端幂等导入)
import transaction receipt (导入事务回执)
staged large imports (大型导入的分阶段暂存)
source/destination transaction lineage (源/目标事务历史血统)
```

---

# 274. 与 KQL 的关系 (Relationship to KQL)

KQL 最终应当支持：

```text
snapshot/as-of reads (快照 / as-of 读取)
transaction-pinned reads (事务绑定的读取)
transaction ID/system history lookup where authorized (在授权下进行事务 ID/系统历史查询)
```

具体语法在此不作硬性限定。

---

# 275. 与 KML 的关系 (Relationship to KML)

KML 最终应当支持：

```text
transaction-safe mutations (事务安全突变)
element version guards (元素版本守卫)
create-only guards (仅创建守卫)
client keys (客户端键)
lifecycle transitions (生命周期转换)
deterministic desugaring (确定性脱糖展开)
```

KML 命令语法本身不定义多命令原子性。

事务容器负责定义原子性。

---

# 276. 与 META 的关系 (Relationship to META)

META 应当暴露：

```text
transaction capabilities (事务能力)
current Space sequence (当前空间序列号)
Schema Environment version (模式环境版本)
transaction status (事务状态)
change stream capability (变更流能力)
history capability (历史能力)
```

并且可以包含：

```text
DESCRIBE TRANSACTION (描述事务)
```

用于授权审计。

---

# 277. 与 Anda Brain 的关系 (Relationship to Anda Brain)

Anda Brain 应当将事务选择作为记忆策略的重要部分。

记忆形成（Formation）：

```text
one semantic memory encoding (单次语义记忆编码)
→ one bounded transaction (→ 单个有界事务)
```

记忆维护（Maintenance）：

```text
one coherent consolidation/revision unit (单次连贯的巩固/修订单元)
→ one transaction (→ 单个事务)
```

大型睡眠整理（Large sleep）：

```text
many resumable transactions (多个可恢复事务)
```

外部行动（Action）：

```text
decision transaction (决策事务)
external action (外部动作)
outcome transaction (结果事务)
```

---

# 278. 大脑事务设计启发式 (Transaction Design Heuristic for Brain)

核心自问：

> **如果另一个智能体只观察到这些变更中的一半，大脑的状态是否会在语义上失效或产生误导？**

如果是：

```text
put them in one transaction. (将它们放入同一个事务中)
```

如果不是：

```text
separate transactions may be safer and more scalable. (分为独立事务可能更安全且更具扩展性)
```

---

# 279. 最终架构 (Final Architecture)

```text
                   Agent / Human / System (智能体 / 人类 / 系统)
                             │
                             ▼
                    Transaction Request (事务请求)
                             │
                             ▼
                     Idempotency Gate (幂等性网关)
                             │
                             ▼
                Authentication / Governance (身份认证 / 治理鉴权)
                             │
                             ▼
                     Snapshot Sequence (快照序列号)
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
        Schema Snapshot   Cognitive     Governance
         (模式快照)       Operations    Operations
                         (认知操作)     (治理操作)
               │             │             │
               └─────────────┼─────────────┘
                             ▼
                      Tentative State (暂存状态)
                             │
                             ▼
                 Core / Schema Validation (核心/模式验证)
                             │
                             ▼
                  Serializable Validation (可串行化验证)
                             │
                             ▼
                Commit-Time Authorization (提交时刻授权重验)
                             │
                      ┌──────┴──────┐
                      │             │
                     fail          pass
                      │             │
                      ▼             ▼
                    Abort      Atomic Commit (原子提交)
                   (中止)           │
                                    ▼
                            assign space_seq (分配 space_seq)
                                    │
                  ┌─────────────────┼──────────────────┐
                  │                 │                  │
                  ▼                 ▼                  ▼
              State Update       Commit Log       Change Stream
               (状态更新)        (提交日志)         (变更流)
                  │                 │                  │
                  └─────────────────┼──────────────────┘
                                    ▼
                                 Receipt (回执凭证)
                                    │
                                    ▼
                            Future Cognition (未来认知)
```

---

# 280. 核心事务方程 (Core Transaction Equations)

```text
Transport Batch (传输批处理)
    ≠
Atomic Transaction (原子事务)
```

```text
Transaction (事务)
    =
    One Indivisible Durable Cognitive Transition (一次不可分割的持久认知转换)
```

```text
Element Version (元素版本)
    ≠
Space Commit Sequence (空间提交序列号)
```

```text
World Time (世界时间)
    ≠
Observation Time (观察时间)
    ≠
Assertion Time (主张时间)
    ≠
Transaction Time (事务时间)
```

```text
Preview Success (预览成功)
    ≠
Commit Guarantee (提交保证)
```

```text
KIP Commit (KIP 提交)
    ≠
External World Commit (外部物理世界提交)
```

```text
Rollback of Current Effect (撤销当前效果)
    =
    New Compensating Transaction (创建新的补偿事务)
```

而非：

```text
erase committed history (抹除已提交的历史)
```

且：

```text
Historical Brain State (历史大脑状态)
    =
    Reconstruct(
      Cognitive State,
      Epistemic Lifecycle,
      Governance,
      Schema Environment
      AS OF space_seq
    )
```

---

# 281. 终极原则 (Final Principle)

KIP 1.x 已经具备若干极具价值的事务性原语：

```text
atomic UPSERT blocks (原子 UPSERT 块)
atomic MERGE (原子 MERGE)
EXPECT VERSION (版本守卫)
idempotent mutation intent (幂等突变意图)
batch execution (批处理执行)
```

KIP 2.0 将这些零散部件融合为一个连贯一致的认知历史模型。

一个真正的智能体记忆大脑必须能够回答以下问题：

> 这一信念修正是否完整发生？

> 证据与断言是否一同提交？

> 当我进行思考推理时，是否有另一个智能体改变了状态？

> 我的写入是否基于一个连贯一致的快照？

> 是哪一个模式版本赋予了这些字段语义？

> 写入者在提交的确切时刻是否依然拥有有效权限？

> 如果网络响应在传输中丢失，事务究竟是否真实发生？

> 我是否可以安全发起重试而不会复制经验或断言？

> 在该变更发生之前，确切存在何种状态？

> 在该变更发生之后，大脑立即相信了什么？

> 是哪项治理策略与委托关系允许了该操作？

> 我能否在数年之后重构某个断言的完整生命周期？

> 我能否将变更流式传输给索引与维护工作进程，而不会导致它们重复学习？

> 如果我修正了一个错误，我能否保留我曾经犯过该错误的历史事实？

> 如果智能体发送了一封邮件或部署了生产系统，记忆系统是否理解外部世界无法像数据库那样进行回滚？

KIP 2.0 通过将事务历史确立为 **认知中枢的时间脊梁（Temporal Spine of the Cognitive Nexus）** 来回答所有这些问题。

其统领一切的核心思想是：

> **记忆不仅仅是大脑所包含的内容。记忆更是大脑如何一步步演进成为当前模样的有序历史。**

事务正是这一演进历程中最小的不可分割的原子单元。
