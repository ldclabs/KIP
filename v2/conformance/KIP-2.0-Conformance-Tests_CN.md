# KIP 2.0 一致性测试规范 (Conformance Tests)

**[English](./KIP-2.0-Conformance-Tests.md) | [中文](./KIP-2.0-Conformance-Tests_CN.md)**

## 规范状态 (Status)

**规范性测试设计 / 可执行前测试套件 (Normative Test Design / Pre-Executable Test Suite)**

测试目标规范：[KIP-2.0-SPECIFICATION_CN.md](../KIP-2.0-SPECIFICATION_CN.md)（`2.0-draft`）

本文档定义了 KIP 2.0 的规范性一致性测试模型。

其目的并非证明两个认知中枢（Cognitive Nexus）实现使用了相同的底层数据库、内部 ID、查询规划器、索引结构、信任算法或物理存储布局；而是证明相互独立的认知中枢实现在**可观测的协议语义**上完全保持一致。

若本文档与 [KIP-2.0-SPECIFICATION_CN.md](../KIP-2.0-SPECIFICATION_CN.md) 发生冲突，以规范主文档（Specification）为准。

---

# 1. 一致性测试哲学 (Conformance Philosophy)

一项 KIP 测试必须严格区分三类断言：

```text
协议层断言 (Wire Assertion)
    协议接口实际返回了什么报文与状态？

语义后置条件 (Semantic Postcondition)
    操作完成后，系统中实际留存了怎样持久的认知状态？

违规禁则 (Forbidden Outcome)
    哪些投机取巧的捷径或不安全的状态绝不能发生？
```

只有当上述三个相关维度全部通过时，该项测试方判定为通过。

示例：

```text
测试用例：
    "Assertion 的置信度不可变"

协议层：
    执行 UPDATE 操作失败，返回 EpistemicRevisionRequired 或等效错误码。

语义后置条件：
    原 Assertion 的置信度（confidence）依然保持为 0.6。

违规禁则：
    底层引擎静默将原 Assertion 的置信度改写为 0.9。
```

该机制能够有效杜绝某些实现仅因最终查询结果“看似正确”，但底层历史演变、来源溯源、权限隔离或事务语义完全错误而蒙混过关。

---

# 2. 测试结果状态 (Test Result States)

每个测试向量（Vector）产生且仅产生一种结果状态：

```text
PASS               测试通过
FAIL               测试失败
SKIP_UNSUPPORTED   跳过不支持的可选特性
NOT_APPLICABLE     不适用
HARNESS_ERROR      测试框架执行异常
```

只有当运行时未声明支持某些 OPTIONAL（可选）能力时，才允许返回 `SKIP_UNSUPPORTED`。

一旦运行时声明支持某项可选能力，对应的测试用例即自动转为强制必测项。

---

# 3. 一致性 Profile 声明 (Conformance Profile Declaration)

在执行测试前，被测实现必须显式声明其所支持的 Profile：

```json
{
  "kip_version": "2.0-draft",

  "profiles": [
    "KIP-Core",
    "KIP-Schema",
    "KIP-Epistemic",
    "KIP-Governance",
    "KIP-Transactions",
    "KIP-Capsule",
    "KIP-KQL",
    "KIP-KML",
    "KIP-META",
    "KIP-Runtime",
    "KIP-Historical",
    "KIP-High-Assurance",
    "KIP-1-Migration"
  ],

  "optional_capabilities": {
    "belief_slot": true,
    "historical_reads": true,
    "semantic_search": true,
    "search_index_freshness": true,
    "signed_receipts": false,
    "materialized_projection": false,
    "ingestion_context": true,
    "serializable_isolation": false
  }
}
```

`KIP-1-Migration`（规范 §89）仅由声明支持 KIP 1.x 迁移/兼容的实现声明；否则 §25 套件整体记为 `NOT_APPLICABLE`。一旦在 `optional_capabilities` 中声明支持某项能力，本文档中所有依赖该能力的 OPTIONAL 测试向量即转为强制必测项（§35）。

测试运行器应当将该声明与 `DESCRIBE PROTOCOL` 和 `DESCRIBE CAPABILITIES` 的输出进行比对校验。

---

# 4. 测试类别 (Test Classes)

## 4.1 黑盒测试 (Black-box)

仅使用公开的 KIP 协议接口，加上测试固件（Fixture）的重置与预置数据注入（Seeding）。

## 4.2 编排并发测试 (Orchestrated concurrency)

需要在事务执行阶段周围设置仅用于测试的同步屏障（Barriers）。

示例：

```text
在提交前暂停 (pause before commit)
撤销授权 (revoke Grant)
变更 Schema 环境 (change Schema Environment)
恢复事务执行 (resume transaction)
```

## 4.3 故障注入测试 (Fault injection)

需要受控的人为故障注入，例如：

```text
提交成功后丢弃响应报文 (drop response after commit)
提交前取消事务 (cancel before commit)
强制搜索索引延迟 (force search index lag)
使游标过期 (expire cursor)
使 Artifact 句柄过期 (expire Artifact handle)
```

测试框架的钩子（Harness hooks）不属于 KIP 协议规范本身，严禁在生产环境中被强制依赖。

---

# 5. 一致性测试框架契约 (Conformance Harness Contract)

测试框架应当暴露以下带外（Out-of-band）等效控制能力：

```text
reset_fixture(name)                     重置测试固件
seed_fixture(name)                      注入测试固件数据
resolve_binding(symbol)                 解析符号绑定
invoke(principal, endpoint, request)    以指定主体调用端点
set_governance_fixture(name)            设置治理测试固件
set_epistemic_policy(name)              设置认识策略
advance_test_clock(time)                推进测试时钟
pause_transaction(request_or_tx, phase) 在指定阶段暂停事务
resume_transaction(request_or_tx)       恢复事务执行
drop_response_after_commit(request)     提交后丢弃响应
force_search_index_checkpoint(seq)      强制搜索索引检查点
expire_cursor(cursor)                   使游标过期
expire_artifact(handle)                 使工件句柄过期
```

固件数据加载应当避免使用正在被测试的功能本身。例如，KML 测试应当通过带外的固件加载器进行数据初始化，而非直接通过 KML 自身来预置数据。

---

# 6. 机器可读测试向量结构 (Machine-Readable Vector Shape)

未来的可执行测试向量应当可表示为如下形式：

```yaml
id: KIP2-CORE-001
title: Proposition existence is truth-neutral
level: MUST
class: black_box

profiles:
  - KIP-Core
  - KIP-KQL
  - KIP-Epistemic

fixture: epistemic_proposition_only
principal: reader_full
endpoint: readonly

steps:
  - command: |
      FIND(?p)
      WHERE {
        ?p (:alice, "timezone", "+08:00")
      }

  - command: |
      FIND(?belief)
      WHERE {
        ?belief BELIEF (:alice, "timezone", "+08:00")
      }

expect:
  raw_proposition_count: 1
  belief_status: insufficient

postconditions:
  - assertion_count_for_proposition: 0

forbidden:
  - automatic_assertion_creation
  - automatic_belief_persistence

spec_refs:
  - "§12"
  - "§21"
  - "§102 invariant 1"
```

---

# 7. 断言操作符 (Assertion Operators)

可移植测试运行器应当支持以下断言操作符：

```text
equals                   相等
not_equals               不相等
present                  存在
absent                   不存在
one_of                   属于集合之一
contains                 包含
not_contains             不包含
row_count                行数匹配
set_equals               集合全等
set_contains             集合包含
monotonic_gt             单调递增大于
same_as_previous         与前序相同
different_from_previous  与前序不同
semantic_predicate       语义断言谓词
```

在可行的情况下，`semantic_predicate` 应当通过公开的 KQL/META 接口进行校验。

示例：

```text
canonical_proposition_count(tuple) == 1       规范命题计数为 1
assertion_payload_unchanged(id)               断言有效载荷未发生变更
no_state_change_since(seq)                    自指定序号以来无状态变更
change_envelope_count(tx_id) == 1             事务的变更包计数为 1
historical_raw_endpoint(id) == expected      历史原始端点符合预期
```

---

# 8. 标准测试 Schema (Canonical Test Schema)

标准测试 Schema 环境为：

```text
schema_env:test-v1
```

包含 Schema 包：

```text
kip://test/core-domain@1.0.0
```

类型列表 (Types)：

```text
Person           人
Project          项目
Theme            主题
Organization     组织
Service          服务
StatusValue      状态值
Document         文档
Experience       经验
ExperienceStep   经验步骤
Skill            技能
```

谓词列表 (Predicates)：

```text
timezone         时区
prefers          偏好
project_status   项目状态
is_vegetarian    是否素食
works_for        工作于
knows            认识
parent_of        父级
service_healthy  服务是否健康
alias_of         别名关系
```

重要约束 (Constraints)：

```text
timezone:
    Person → string
    functional = true
    open_world = true

project_status:
    Project → StatusValue
    functional = true
    open_world = true

is_vegetarian:
    Person → boolean
    functional = true
    open_world = true

prefers:
    Person → Concept
    functional = false

works_for:
    Person → Organization
```

结构字段 (Structural Fields)：

```text
has_step        经验包含步骤 (有序)
experienced_by  经验经历者
compiled_from   编译自
compiled_by     编译者
```

保留的核心结构字段（`evidence`、`source`、`generated_by`、`inputs`、`outputs`、`associated_actors`）属于 `KIP-2.0-SPECIFICATION.md` §20.13 所定义的内置字段；测试包不会对其进行重新定义，涉及这些字段的测试向量直接测试 Core 内置约束。

切面定义 (Facets)：

```text
MnemonicState (记忆状态):                适用于 Concept
    memory_strength number [0,1], mutable (记忆强度)
    salience number [0,1], mutable        (显著度)
    last_metabolized_at timestamp|null, mutable (上次代谢时间)

SkillUtility (技能效用):                 适用于 Skill
    utility number, mutable               (效用评分)
    success_count integer >= 0, mutable   (成功次数)
    failure_count integer >= 0, mutable   (失败次数)
```

第二个 Schema 包：

```text
kip://test/secondary@1.0.0
```

由 `schema_ambiguous` 固件用于创建故意冲突的本地歧义别名 `status`。

---

# 9. 标准符号绑定 (Canonical Bindings)

测试固件中的标准符号：

```text
:self             自身概念

:alice            爱丽丝
:bob              鲍勃
:carol            卡罗尔

:project_alpha    阿尔法项目

:dark_mode        深色模式
:light_mode       浅色模式

:status_planning  规划中状态
:status_active    活跃状态
:status_paused    已暂停状态

:org_acme         ACME 组织

:service_api      API 服务
```

测试框架将这些符号映射到具体实现中的内部本地 ID。

各测试向量严禁要求不同被测实现产生完全相同的本地内部 ID。

---

# 10. 标准调用主体 (Canonical Principals)

`owner` (所有者主体)

```text
具有广泛的 read/project/write 读写与投影权限
merge_identity (身份合并)
manage_retention (留存管理)
archive/tombstone/purge (归档 / 墓碑化 / 物理清除)
export/import (认知胶囊导出 / 导入)
read_history/read_audit (历史读取 / 审计读取)
```

`alice_writer` (Alice 写入者主体)

```text
read/search/project (读取 / 搜索 / 投影)
create/update (创建 / 更新)
record_attributed_assertion (记录归属断言)
assert_as_actor Alice (以 Alice 语义主体身份进行断言)
retract_own (撤回自身断言)
supersede_own (废弃替代自身断言)
```

`recorder` (记录员主体)

```text
read/search/project (读取 / 搜索 / 投影)
create (创建)
record_attributed_assertion (记录归属断言)
无 assert_as_actor Alice 权限 (不可直接代表 Alice)
```

`reader_full` (完全读取者主体)

```text
discover/read/search/project (发现 / 读取 / 搜索 / 投影)
```

`reader_no_project` (无投影权限读取者主体)

```text
discover/read/search (发现 / 读取 / 搜索，无 project 投影权限)
```

`reader_no_search` (无搜索权限读取者主体)

```text
discover/read/project (发现 / 读取 / 投影，无 search 搜索权限)
```

`reader_hidden` (受限隐秘读取者主体)

```text
对测试固件中的机密/隐秘资源无 discover 发现权限
```

`maintenance` (运维维护主体)

```text
read/search/project (读取 / 搜索 / 投影)
maintain (执行维护操作)
对受限的可变切面 (bounded mutable Facets) 进行更新
manage_retention/archive (留存管理 / 归档)
无任意代表语义主体的权限 (no arbitrary actor representation)
无信任 / Schema / 授权管理权限 (no trust/schema/authority management)
```

`importer` (导入者主体)

```text
discover/read/import (发现 / 读取 / 导入胶囊)
无 manage_schema 权限 (不可管理 Schema)
无 manage_trust 权限 (不可管理信任)
无 elevate_authority 权限 (不可提权)
```

---

# 11. 标准确定性认识策略 (Canonical Deterministic Epistemic Policy)

可移植的认识状态（Epistemic status）测试在以下策略下运行：

```text
policy_id = test-deterministic
version = 1
```

规则定义：

```text
存在单个合格且可信的独立支持根源
    → accepted (已接受)

存在单个合格且可信的独立反对根源
    → rejected (已拒绝)

存在实质性可信支持 + 实质性可信反对
    → contested (存争议)

仅存在显式微弱/低信任的材料
    → uncertain (不确定)

不存在充分合格的证据/断言材料
    → insufficient (证据不足)
```

材料合格条件 (Eligibility)：

```text
处于活跃状态 (active)
在世界时间（world-time）范围内有效
对调用主体可见 (caller-visible)
认知模式属于 observed | stated | inferred
```

默认的当前世界测试排除以下材料：

```text
hypothetical (假设性)
predicted (预测性)
untrusted imported (未受信任的导入数据)
```

该确定性策略仅用于可移植的一致性测试向量。KIP 规范并不强制要求将其作为生产环境的信任评估策略。

---

# 12. 测试用例格式 (Test Formatting)

后续每个测试用例均采用统一结构：

```text
前置条件 (Given)
触发操作 (When)
预期结果 (Then)
违规禁则 (Forbidden)
```

错误名称采用核心错误注册表（Core Error Registry）中的标准推荐名称。在规范允许返回等效且更具体的错误时，测试运行器可以接受已声明的等效错误映射。

---
# 13. 核心套件 (Core Suite)

主 Profile 归属：`KIP-Core`

## KIP2-CORE-001 — 命题存在性具有价值中立性 (Proposition existence is truth-neutral)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：系统中存储了命题 `(Alice, timezone, "+08:00")`，且该命题无任何断言（Assertion）。触发操作：通过原始 KQL 与 BELIEF 查询同一元组。预期结果：原始 KQL 查询能够找到该命题，但 BELIEF 查询不会将其判定为已接受（accepted）；在确定性策略下其状态判定为 `insufficient`（证据不足）。

**违规禁则 (Forbidden outcome):** 自动创建 Assertion；自动判定为已接受的信念（accepted belief）。

---

## KIP2-CORE-002 — 命题元组不可变 (Proposition tuple is immutable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：已存在命题 `P1=(Alice, timezone, "+08:00")`。触发操作：尝试通过通用的 UPDATE 操作将对象修改为 `+01:00`。预期结果：操作失败并返回 `ImmutableField` 或等效错误码，P1 保持不变。

**违规禁则 (Forbidden outcome):** 对元组进行就地改写（in-place tuple rewrite）。

---

## KIP2-CORE-003 — ENSURE 命题具备规范唯一性 (ENSURE Proposition is canonical)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：系统中不存在该元组。触发操作：连续两次执行相同的接地 ENSURE 操作。预期结果：系统中存在且仅存在一个规范命题（canonical Proposition），两次操作均解析到相同的语义标识。

**违规禁则 (Forbidden outcome):** 生成重复的规范元组。

---

## KIP2-CORE-004 — 并发 ENSURE 操作收敛至单一命题 (Concurrent ENSURE converges)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：系统中不存在该元组。触发操作：两个并发事务同时尝试 ENSURE 相同的元组。预期结果：最终仅保留一个处于活跃状态的规范命题。

**违规禁则 (Forbidden outcome):** 产生两个处于活跃状态的重复规范命题。

---

## KIP2-CORE-005 — 断言必须且仅能指向单一命题 (Assertion targets exactly one Proposition)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：存在合法的调用主体与 Schema。触发操作：尝试创建一个指向零个或多个命题目标的断言。预期结果：数据校验失败，且不会提交任何断言。

**违规禁则 (Forbidden outcome):** 提交格式畸形的多目标断言。

---

## KIP2-CORE-006 — 断言置信度不等于主体信任度 (Assertion confidence is not trust)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：存在来自不同信任度来源、但置信度（confidence）相同的断言。触发操作：执行查询或信念投影。预期结果：存储的置信度保持相等，且针对来源的信任度评估严禁回写到断言的置信度字段中。

**违规禁则 (Forbidden outcome):** 通过改写置信度来编码主体信任度。

---

## KIP2-CORE-007 — 断言认识有效载荷不可变 (Assertion epistemic payload is immutable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：已存在断言 A1。触发操作：尝试通过 UPDATE 修改其立场（stance）、置信度（confidence）、断言主体（asserted_by）或命题引用（proposition）。预期结果：返回 `EpistemicRevisionRequired` 或 `ImmutableField` 错误码；A1 保持不变。

**违规禁则 (Forbidden outcome):** 篡改历史记录。

---

## KIP2-CORE-008 — 断言修正必须保留历史演变 (Assertion revision preserves history)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：已存在置信度为 0.6 的断言 A1。触发操作：创建置信度为 0.9 的新断言 A2 废弃替代（supersede）A1。预期结果：A1 保留置信度 0.6 并标记为已替代（superseded），A2 作为独立可寻址的新记录存在。

**违规禁则 (Forbidden outcome):** 覆盖改写旧的有效载荷。

---

## KIP2-CORE-009 — 证据有效载荷不可变 (Evidence payload is immutable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：已存在证据 E1。触发操作：尝试覆盖改写其载荷内容。预期结果：返回 `EvidenceCorrectionRequired` 或 `ImmutableField` 错误码；原始载荷保持不变。

**违规禁则 (Forbidden outcome):** 就地改写证据记录。

---

## KIP2-CORE-010 — 证据纠错必须保留原始记录 (Evidence correction preserves original)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：已存在证据 E1 与新的纠错证据 E2。触发操作：执行 `CORRECT EVIDENCE E1 BY E2`。预期结果：E1 依然可寻址且保持不可变；纠错血统（correction lineage）明确链接 E1 与 E2。

**违规禁则 (Forbidden outcome):** 删除或覆盖改写原始证据 E1。

---

## KIP2-CORE-011 — 相同内容哈希不强加同一证据身份 (Equal digest does not force Evidence identity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：存在两个底层字节/哈希完全相同的真实观测事件。触发操作：使用不同的来源事件（source-event）或客户端键（client key）进行存储。预期结果：系统中可以独立存在两个证据元素。

**违规禁则 (Forbidden outcome):** 将内容哈希（content digest）作为唯一的证据身份标识。

---

## KIP2-CORE-012 — 基于客户端键重试创建证据具备幂等去重性 (Evidence client-key retry deduplicates)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：使用客户端键 K 创建证据。触发操作：使用完全相同的客户端键进行重试提交。预期结果：系统中持久化保留且仅保留一个证据记录。

**违规禁则 (Forbidden outcome):** 重试操作产生重复的证据记录。

---

## KIP2-CORE-013 — 客户端键冲突操作失败 (Conflicting client key fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：客户端键 K 已绑定到不可变载荷 A。触发操作：复用相同的键 K 但尝试提交不兼容的不可变载荷 B。预期结果：操作失败并返回 `ClientKeyConflict` 错误。

**违规禁则 (Forbidden outcome):** 静默替换原有载荷。

---

## KIP2-CORE-014 — 活动与事务是不同的概念实体 (Activity and Transaction are distinct)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在单个事务内创建了一个已完成的活动（Activity）。预期结果：活动 ID（Activity ID）与事务 ID（tx_id）在协议中是两个相互独立的身份标识。

**违规禁则 (Forbidden outcome):** 将活动直接等同于提交记录（Commit Record）。

---

## KIP2-CORE-015 — 已完成活动的拓扑结构不可变 (Completed Activity topology is immutable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：已存在一个处于已完成状态的活动。触发操作：尝试修改其输入集合（inputs）或输出集合（outputs）。预期结果：返回 `ActivityTerminal` 或 `ImmutableField` 错误。

**违规禁则 (Forbidden outcome):** 改写活动溯源拓扑。

---

## KIP2-CORE-016 — 结构引用不等于命题 (Structural Reference is not Proposition)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：经验（Experience）通过结构化拓扑引用步骤（Step），即包含 `has_step` 字段。触发操作：分别执行 STRUCTURAL 查询与原始命题查询。预期结果：STRUCTURAL 查询能够找到该步骤，但原始命题查询绝不会检索到自动生成的 `(Experience, has_step, Step)` 事实元组。

**违规禁则 (Forbidden outcome):** 自动生成语义边/命题元组。

---

## KIP2-CORE-017 — 切面数据严禁绕过 Core 核心层 (Facet cannot bypass Core)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：切面（Facet）有效载荷中尝试镜像或覆盖 `_system.origin` 或断言指向的命题。预期结果：权威的 Core 核心字段保持不变，切面无法覆盖核心层语义。

**违规禁则 (Forbidden outcome):** 切面覆盖受保护的 Core 核心字段。

---

## KIP2-CORE-018 — 记忆强度不等于置信度 (Memory strength is not confidence)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：某断言的置信度为 0.9，该断言所指向概念的 MnemonicState 记忆强度（memory_strength）为 0.2。触发操作：将 memory_strength 更新为 0.1。预期结果：该断言的置信度依然严格保持为 0.9。

**违规禁则 (Forbidden outcome):** 记忆状态的变动改变认识断言的置信度。

---

## KIP2-CORE-019 — 留存到期时间不等于世界有效时间 (Retention time is not valid time)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：系统中设置了不同的 `retention.expires_at`（存储留存到期时间）与 `Assertion.valid_time.until`（世界有效结束时间）。预期结果：两个时间字段保持相互独立，并分别驱动各自维度的协议语义。

**违规禁则 (Forbidden outcome):** 混淆这两个不同维度的时间字段。

---

## KIP2-CORE-020 — 概念合并具备非破坏性 (Concept merge is non-destructive)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：存在概念 A 与概念 B。触发操作：将概念 A 合并到概念 B 中。预期结果：概念 A 依然可被寻址且状态标记为已合并（merged），规范解析路径指向概念 B。

**违规禁则 (Forbidden outcome):** 删除源概念身份或复用其标识。

---

## KIP2-CORE-021 — 合并操作保留原始历史端点 (Merge preserves raw historical endpoint)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：存在引用了概念 A 的旧命题。触发操作：在执行 A→B 的概念合并后，分别进行历史/原始查询与新写入操作。预期结果：原始与历史查询依然精确标识概念 A，而新的规范写入操作则解析至概念 B。

**违规禁则 (Forbidden outcome):** 级联改写所有旧的历史引用。

---

## KIP2-CORE-022 — 合并引发的命题碰撞保留各自断言历史 (Merge collision preserves Assertion history)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在身份合并后，两个原本不同的命题在规范层面发生收敛重合，且两者先前各自附带了断言。预期结果：原本各自的断言及其溯源信息依然保持独立可寻址，历史记录得以完整保留。

**违规禁则 (Forbidden outcome):** 因规范碰撞而对断言进行去重或合并删除。

---
# 14. Schema 套件 (Schema Suite)

主 Profile 归属：`KIP-Schema`

## KIP2-SCHEMA-001 — 持久化概念的 schema_ref 必须精确锁定版本 (Durable Concept schema_ref is exact-versioned)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：使用本地别名 Person 创建概念。预期结果：持久化的权威 Schema 标识必须解析并精确绑定到具体的包版本（Package version）。

**违规禁则 (Forbidden outcome):** 持久化保存浮动版本（floating version）或版本范围（version range）。

---

## KIP2-SCHEMA-002 — 持久化谓词引用必须精确锁定版本 (Durable Predicate ref is exact-versioned)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：使用本地别名 timezone 执行 ENSURE 命题操作。预期结果：持久化存储的 predicate_ref 必须精确锁定具体版本。

**违规禁则 (Forbidden outcome):** 保存未锁定版本的浮动谓词标识。

---

## KIP2-SCHEMA-003 — 歧义别名操作失败 (Ambiguous alias fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在 `schema_ambiguous` 测试固件中。触发操作：使用存在多重定义的本地别名 `status`。预期结果：操作失败并返回 `SchemaSymbolAmbiguous` 错误。

**违规禁则 (Forbidden outcome):** 引擎自行猜测并隐式选择一个 Schema 包。

---

## KIP2-SCHEMA-004 — 歧义环境下使用精确引用可成功执行 (Exact ref succeeds under ambiguity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在相同的歧义固件环境中。触发操作：使用完整的精确谓词引用（exact Predicate ref）。预期结果：操作成功执行并绑定到预期的符号。

**违规禁则 (Forbidden outcome):** 在提供了精确引用的情况下依然报告歧义错误。

---

## KIP2-SCHEMA-005 — 强制执行主语类型约束 (Subject type constraint enforced)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试提交命题 `(Project, timezone, "+08")`，其中主语类型不匹配。预期结果：操作失败并返回 `TypeMismatch` 或 `ConstraintViolation` 错误。

**违规禁则 (Forbidden outcome):** 提交非法类型的命题元组。

---

## KIP2-SCHEMA-006 — 强制执行字面量数据类型约束 (Literal datatype constraint enforced)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试提交命题 `(Alice, timezone, true)`，其中宾语字面量类型不符合字符串要求。预期结果：数据校验失败并拒绝写入。

**违规禁则 (Forbidden outcome):** 在要求字符串类型的位置存储布尔值。

---

## KIP2-SCHEMA-007 — 强制执行结构化目标类型约束 (Structural target constraint enforced)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试将 `Experience.has_step` 关联到 `Organization` 实例。预期结果：结构与类型校验失败并拒绝写入。

**违规禁则 (Forbidden outcome):** 允许建立非法的结构化拓扑关系。

---

## KIP2-SCHEMA-008 — 拒绝未知的切面字段 (Unknown Facet field rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试在 `MnemonicState` 切面下写入未定义的字段。预期结果：操作失败并返回 `SchemaFieldNotFound` 或约束校验错误。

**违规禁则 (Forbidden outcome):** 将未经验证的扩展字段作为规范切面数据予以接受。

---

## KIP2-SCHEMA-009 — Schema 不能授予治理权限 (Schema cannot authorize Governance)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：加载声称某个类型拥有管理员权限的 Schema 或模型提示。预期结果：系统中不会据此创建任何治理层（Governance）权限。

**违规禁则 (Forbidden outcome):** Schema 文本声明直接赋予治理权限。

---

## KIP2-SCHEMA-010 — 普通 KML 不能激活 Schema (Ordinary KML cannot activate Schema)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试通过普通的认知操作进行 Schema 包的激活或默认配置修改。预期结果：操作被拒绝并返回 `ProtectedSchemaState` 错误；Schema 环境保持不变。

**违规禁则 (Forbidden outcome):** 通过普通 KML 控制 Schema 环境。

---

## KIP2-SCHEMA-011 — 仅用于校验的嵌入式 Schema 保持非激活状态 (Validation-only embedded Schema stays inactive)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对包含未激活嵌入式 Schema 包的认知胶囊执行 VERIFY、VALIDATE 或 PREVIEW 操作。预期结果：目标空间的活动 Schema 环境保持不变。

**违规禁则 (Forbidden outcome):** 自动安装或自动激活嵌入的 Schema 包。

---

## KIP2-SCHEMA-012 — Schema 环境严格按空间隔离 (Schema Environment is Space-specific)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在两个不同的空间中分别配置不同版本的活动 Schema 包。触发操作：分别对两个空间执行 DESCRIBE 操作。预期结果：各空间完全独立解析其 Schema 环境。

**违规禁则 (Forbidden outcome):** 发生跨空间的 Schema 默认配置泄漏。

---

## KIP2-SCHEMA-013 — 原子事务在单一 Schema 环境下执行 (Atomic transaction uses one Schema Environment)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在原子事务执行过程中暂停，修改空间的默认 Schema 配置，然后恢复事务。预期结果：单个原子事务绝不能一部分按旧环境解释、另一部分按新环境解释。

**违规禁则 (Forbidden outcome):** 在单个事务内混用不同 Schema 环境进行解析。

---

## KIP2-SCHEMA-014 — Schema 前置条件可检测环境变更 (Schema precondition detects change)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：当前环境版本已升级为 18。触发操作：提交请求时声明期望的 `schema_environment_version` 为 17。预期结果：触发前置条件/Schema 校验错误，且不执行任何写入。

**违规禁则 (Forbidden outcome):** 在过期的 Schema 版本假设下执行写入。

---

## KIP2-SCHEMA-015 — Schema 包签名校验通过不等于激活 (Package verification does not activate)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对一个合法签名的 Schema 包执行 VERIFY 校验。预期结果：该包的激活状态保持不变。

**违规禁则 (Forbidden outcome):** 将签名校验通过等同于 Schema 激活。

---

## KIP2-SCHEMA-016 — DESCRIBE TYPE 返回精确的类型身份 (DESCRIBE TYPE returns exact identity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对本地 Person 类型执行 DESCRIBE 操作。预期结果：响应报文中明确标识其精确的符号与 Schema 包版本。

**违规禁则 (Forbidden outcome):** 仅返回面向模型的别名而不提供精确的版本解析路径。

---
# 15. 认识套件 (Epistemic Suite)

主 Profile 归属：`KIP-Epistemic`

## KIP2-EPI-001 — 无断言判定为证据不足 (No Assertion yields insufficient)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：系统中仅存在裸命题，没有任何断言。触发操作：执行 BELIEF 查询。预期结果：在测试策略下返回 `insufficient`（证据不足）。

**违规禁则 (Forbidden outcome):** 仅凭裸命题直接判定为 `rejected`（已拒绝）或 `accepted`（已接受）。

---

## KIP2-EPI-002 — 不存在的接地命题可返回证据不足且不创建记录 (Absent grounded Proposition can yield insufficient without creation)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对系统中不存在的接地命题元组执行 BELIEF 查询。预期结果：返回 `insufficient`，`proposition_id` 可以为 null，且系统中持久化状态依然保持无该命题。

**违规禁则 (Forbidden outcome):** 读操作自动创建命题记录。

---

## KIP2-EPI-003 — 受信任的支持断言判定为已接受 (Trusted support yields accepted)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：存在一个来自受信任来源且处于活跃状态的支持立场断言。触发操作：执行 BELIEF 查询。预期结果：状态判定为 `accepted`。

---

## KIP2-EPI-004 — 受信任的反对根源判定为已拒绝 (Trusted opposition yields rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：存在一个合格的、受信任的、独立的反对（reject）来源根源。预期结果：状态判定为 `rejected`（已拒绝）。

---

## KIP2-EPI-005 — 支持与反对并存判定为存争议 (Support plus opposition yields contested)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：同时存在合格且相互独立的支持根源与反对根源。预期结果：状态判定为 `contested`（存争议）。

**违规禁则 (Forbidden outcome):** 悄然丢弃其中一方。

---

## KIP2-EPI-006 — 微弱材料可判定为不确定 (Weak material may yield uncertain)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：仅存在固件明确定义为微弱（weak）/低信任（low_trust）的材料。预期结果：状态判定为 `uncertain`（不确定）。

**违规禁则 (Forbidden outcome):** 将 `uncertain` 塌缩为 `rejected`。

---

## KIP2-EPI-007 — 置信度不等于信念概率 (Confidence does not equal belief probability)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：断言 confidence 为 0.9。预期结果：除非投影策略显式声明了该分值语义（score semantics），否则运行时不得将裸露的 0.9 作为经过校准的信念概率对外暴露。

**违规禁则 (Forbidden outcome):** 未声明语义的概率解读。

---

## KIP2-EPI-008 — 搜索评分不会转化为置信度 (Search score does not become confidence)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：先执行 SEARCH，再查询相关断言。预期结果：断言的 confidence 保持不变。

**违规禁则 (Forbidden outcome):** 检索评分被持久化写入认识状态。

---

## KIP2-EPI-009 — 读操作不会强化认知 (Reads do not reinforce cognition)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：先记录 confidence / memory_strength / 证据数量，再反复执行 KQL 与 BELIEF 读查询。预期结果：上述持久化数值保持不变。

**违规禁则 (Forbidden outcome):** 读端强化（read-side reinforcement）。

---

## KIP2-EPI-010 — 假设性材料被常规当前世界策略排除 (Hypothetical excluded by ordinary current-world policy)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：仅存在 `hypothetical`（假设）模式的支持材料。预期结果：默认 BELIEF 查询不会因此判定为已接受。

**违规禁则 (Forbidden outcome):** 假设被提升为事实。

---

## KIP2-EPI-011 — 假设性材料可被显式纳入 (Hypothetical may be included explicitly)

**要求级别 (Level):** SHOULD

**预期语义行为 (Expected semantic behavior):** 在显式声明纳入 `hypothetical` 的情景策略（scenario policy）下，结果遵循该策略的定义。

**违规禁则 (Forbidden outcome):** 隐式变更策略。

---

## KIP2-EPI-012 — 预测不等于观测 (Predicted is not observed)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：仅存在 `predicted`（预测）模式的支持材料。预期结果：常规事实性投影不会将其视为直接观测。

**违规禁则 (Forbidden outcome):** 预报被提升为观测。

---

## KIP2-EPI-013 — 导入不等于本地背书 (Imported is not local endorsement)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：导入一条不受信任的断言。预期结果：记录本身存在，但不会被自动判定为已接受。

**违规禁则 (Forbidden outcome):** 将导入等同于背书。

---

## KIP2-EPI-014 — 派生断言保留溯源根源 (Derived Assertion preserves provenance roots)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：通过 Activity 从 A1/E1 推导出 `inferred` 模式的断言 A2。预期结果：证据台账/溯源链可回溯到上游根源。

**违规禁则 (Forbidden outcome):** 来源洗白（origin laundering）。

---

## KIP2-EPI-015 — 派生副本不会倍增证据 (Derived copies do not multiply evidence)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对同一根源分别生成摘要与译文。预期结果：二者仍归属同一个印证/根源分组。

**违规禁则 (Forbidden outcome):** 由一个来源派生出三个相互独立的根源。

---

## KIP2-EPI-016 — 同源重复陈述不构成来源多样性 (Repeated same-source statement is not source diversity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 绑定到同一来源事件的重复记录，不会转化为相互独立的来源多样性。

**违规禁则 (Forbidden outcome):** 将重复当作独立性。

---

## KIP2-EPI-017 — 独立观测可保持独立 (Independent observations may remain independent)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 两个来源各异的独立观测事件，可以呈现为彼此不同的根源分组。

**违规禁则 (Forbidden outcome):** 强行合并真正相互独立的观测。

---

## KIP2-EPI-018 — 环状溯源不会放大信念 (Circular provenance does not amplify)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：构造一个不含任何外部根源的派生环路。预期结果：投影不得仅因该环路而判定为已接受。

**违规禁则 (Forbidden outcome):** 自我印证循环。

---

## KIP2-EPI-019 — 函数型谓词的冲突取值可被检出 (Functional Predicate conflicting values are detected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：受信任来源分别支持有效时间相互重叠的 timezone `+08` 与 `+01`。预期结果：在测试策略下，BELIEF SLOT 结果体现冲突/存争议。

**违规禁则 (Forbidden outcome):** 武断接受先到的取值。

---

## KIP2-EPI-020 — 有效时间不重叠不必构成冲突 (Non-overlapping valid times need not conflict)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：`+08` 在 T1 之前有效，`+01` 在 T1 之后有效。预期结果：FOR TIME 选出对应时刻的候选值，而不必判定为存争议。

**违规禁则 (Forbidden outcome):** 把历史上的先后并存当作当前矛盾。

---

## KIP2-EPI-021 — AS OF 与 FOR TIME 相互独立 (AS OF and FOR TIME are independent)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：分别查询历史认知状态，以及当前对同一世界时间的认知。预期结果：两者的时间坐标不同，结果也可能正确地不同。

**违规禁则 (Forbidden outcome):** 用一条时间轴替代另一条。

---

## KIP2-EPI-022 — 投影严格只读 (Projection is read-only)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：记录系统序号（seq）后反复执行 BELIEF 查询。预期结果：不产生新的状态变更序号，也不产生持久化的投影对象。

**违规禁则 (Forbidden outcome):** 读操作导致投影被持久化。

---

## KIP2-EPI-023 — 投影策略身份可观测 (Projection policy identity is observable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 BELIEF 查询。预期结果：返回的响应中明确标识所采用的策略 ID 与版本号（policy id/version），或提供等效的可审计标识。

**违规禁则 (Forbidden outcome):** 返回未注明来源与规则的匿名投影结果。

---

## KIP2-EPI-024 — 数值型认识评分必须声明语义 (Numeric epistemic scores declare semantics)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：当 BELIEF 查询返回数值型的支持/反对评分时。预期结果：响应中必须附带明确的 `score_semantics`（评分语义说明）。

**违规禁则 (Forbidden outcome):** 返回语义模糊的裸数值评分。

---

## KIP2-EPI-025 — 证据缺失不等于否定证据 (Absence of evidence is not evidence of absence)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：系统中完全没有任何关于某人是否素食的数据。触发操作：执行关于该命题的接地 BELIEF 查询。预期结果：返回 `insufficient`（证据不足），严禁判定为 `rejected`（已否定）。

**违规禁则 (Forbidden outcome):** 违背开放世界假设（open-world violation）。

---

## KIP2-EPI-026 — 封闭世界假设必须显式声明 (Closed-world exception is explicit)

**要求级别 (Level):** OPTIONAL

**预期语义行为 (Expected semantic behavior):** 前置条件：被测系统支持封闭世界假设（closed-world semantics）。预期结果：由“未找到证据”推导出“否定”的判定，必须且仅能在显式声明了封闭世界 Schema 或投影策略的上下文中发生。

**违规禁则 (Forbidden outcome):** 隐式回退到封闭世界假设。

---

## KIP2-EPI-027 — 物化投影必须披露其依据 (Materialized projection discloses its basis)

**要求级别 (Level):** OPTIONAL

**依赖能力 (Capabilities):** materialized_projection

**预期语义行为 (Expected semantic behavior):** 在开启投影缓存（projection caching）的情况下，由物化视图提供的 BELIEF 结果必须在结果上下文中准确报告其所依据的投影策略 ID/版本以及快照基准（snapshot basis）。当发生相关的变更包（例如针对同一冲突集合新增了反对断言）后，后续在当前时间发起的 BELIEF 查询要么立即反映最新状态，要么明确披露其使用的是较旧的快照基准——绝不允许将过期的缓存结果伪装成最新状态返回。此外，物化缓存本身绝不能作为证据（Evidence）或断言（Assertion）记录出现在认知图谱中。

**违规禁则 (Forbidden outcome):** 在当前快照下静默返回过期的信念结果；将缓存数据回写为认知图谱实体；缓存数据产生自我印证效应。

---

## KIP2-EPI-028 — 修订溯源根不会撤回派生认知 (Revising a root does not retract derived cognition)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 设有一个 Insight、一个 Preference 摘要、一个编译得到的 Skill 与一个 SelfModel，它们均通过已记录的 Activity 谱系派生自同一个根断言及其证据。对该根节点执行 `SUPERSEDE ASSERTION`、`RETRACT ASSERTION` 与 `CORRECT EVIDENCE`，改变的只是认识投影的计算输出，除此之外不改变任何东西：每个派生元素都必须保持 `active`、可召回，且内容与生命周期完全不变 (§57.5)。为派生关系打上待审标记——例如认知记忆 Profile 中的 `DerivationState.status = "stale"`——必须是复审主体的显式写入，绝不能是修订操作的运行时副作用。在支持 `LIST DEPENDENTS` 的环境中，派生元素在修订之后依然可从被修订的根节点发现（META-025），从而使复审成为可能，而非自动发生。

**后置条件 (Postconditions):** 各派生元素的生命周期状态、版本与内容在修订事务前后均未改变；该次修订的变更包只触及被修订的根节点以及调用方显式写入的内容；修订之后对每个派生元素发起召回仍能返回该元素。

**违规禁则 (Forbidden outcome):** 对派生制品发生级联撤回、级联归档或级联墓碑标记；为迎合新信念而静默改写派生摘要；仅因某个根节点变动就将派生元素从召回结果中隐藏；把运行时自动设置的待审标记呈现为复审主体自身的判断。

---
# 16. 治理套件 (Governance Suite)

主 Profile 归属：`KIP-Governance`

## KIP2-GOV-001 — 请求体伪造调用主体失败 (Request-body Principal spoofing fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：以普通读取者（reader）身份完成认证。触发操作：在请求体中声称 `principal_id=owner` 并尝试执行仅限所有者的操作。预期结果：请求被拒绝，且实际生效的主体严格保持为 reader。

**违规禁则 (Forbidden outcome):** 请求体中的字段赋予授权。

---

## KIP2-GOV-002 — 调用主体不等于语义行动主体 (Principal is not semantic actor)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：记录员主体（recorder）未获得针对 Alice 的 `ActorBinding` 授权。触发操作：尝试使用 `assert_as_actor Alice` 执行写入。预期结果：操作被拒绝并返回 `ActorBindingRequired` 或权限拒绝错误。

**违规禁则 (Forbidden outcome):** 仅凭语义主体名称即可直接代表该主体。

---

## KIP2-GOV-003 — 归属陈述保留来源与断言主体的严格区分 (Attributed statement preserves origin distinction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：记录员主体记录了一条关于 Alice 的陈述。预期结果：断言记录中 `asserted_by=Alice`，而底层引擎的来源记录为 `origin=recorder`。

**违规禁则 (Forbidden outcome):** 底层来源被 `asserted_by` 字段覆盖。

---

## KIP2-GOV-004 — 具备绑定的 Alice 写入者可代表 Alice (Bound Alice writer may represent Alice)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：主体 `alice_writer` 拥有针对 Alice 的作用域限定 `ActorBinding`。触发操作：以 Alice 身份进行断言。预期结果：在授权作用域内操作成功执行。

---

## KIP2-GOV-005 — 认知内容中的管理员声明不赋予任何治理权限 (Cognitive admin claim grants no authority)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在认知图谱中存储语义事实 `(self, is_admin, true)`，随后尝试执行受保护的操作。预期结果：受保护的操作依然被严格拒绝。

**违规禁则 (Forbidden outcome):** 基于图谱内容实现权限提升。

---

## KIP2-GOV-006 — 认识层信任不赋予写权限 (Epistemic trust grants no write authority)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：某个主体在认识层具有极高信任度，但在治理层缺乏写入权限。触发操作：尝试执行数据变更。预期结果：操作被拒绝。

**违规禁则 (Forbidden outcome):** 将认知信任度直接用作写入权限。

---

## KIP2-GOV-007 — 发现权限与读取权限严格区分 (discover differs from read)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：主体不具备机密资源的 `discover` 发现权限，但尝试查询已知的机密资源 ID。预期结果：返回 `NotFoundOrNotVisible` 或等效响应。

**违规禁则 (Forbidden outcome):** 泄漏机密资源的存在性。

---

## KIP2-GOV-008 — 搜索权限相互独立 (search permission is distinct)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：主体 `reader_no_search` 具有读取权限但无 `search` 权限。触发操作：分别执行已知 ID 的读取与 SEARCH 操作。预期结果：已知 ID 读取成功，但 SEARCH 操作被拒绝。

**违规禁则 (Forbidden outcome):** 拥有 read 读取权限即隐式拥有 search 搜索权限。

---

## KIP2-GOV-009 — 投影权限相互独立 (project permission is distinct)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：主体 `reader_no_project` 具有原始读取权限但无 `project` 投影权限。触发操作：分别执行原始读取与 BELIEF 查询。预期结果：原始数据读取成功，但 BELIEF 投影查询被拒绝。

**违规禁则 (Forbidden outcome):** 拥有 read 读取权限即隐式拥有 project 投影权限。

---

## KIP2-GOV-010 — 不可见记录不影响 COUNT 聚合结果 (Hidden rows do not affect COUNT)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：系统中存在 2 个可见实体与 3 个保密实体。触发操作：在受限权限下执行 COUNT 聚合查询。预期结果：查询返回计数为 2。

**违规禁则 (Forbidden outcome):** 聚合统计泄漏保密记录的数量。

---

## KIP2-GOV-011 — 不可见记录不影响 NOT 逻辑求值 (Hidden rows do not affect NOT)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：构造一个包含 NOT 语法的查询，若保密记录参与计算将改变查询结果。预期结果：计算仅在已授权的可见全集（authorized universe）内求值。

**违规禁则 (Forbidden outcome):** 通过 NOT 取反逻辑泄漏保密记录的存在性。

---

## KIP2-GOV-012 — 不可见记录不影响 OPTIONAL 可选匹配 (Hidden rows do not affect OPTIONAL)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对保密关联关系执行 OPTIONAL 查询。预期结果：行为表现为完全无可见匹配项。

**违规禁则 (Forbidden outcome):** 通过 OPTIONAL 可选匹配泄漏保密记录的存在性。

---

## KIP2-GOV-013 — 不可见搜索候选不扰动可见结果的相对排序 (Hidden search candidates do not perturb visible rank)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：注入一个与搜索词高度相关的保密候选记录，随后在受限权限下执行检索。预期结果：公开可见候选记录之间的相对排序与得分不受任何影响。

**违规禁则 (Forbidden outcome):** 通过排序位置旁路信道泄漏保密记录的存在。

---

## KIP2-GOV-014 — 当前治理策略控制历史数据的可见性 (Current Governance controls historical visibility)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：某条记录在序号 S1 时为公开状态，但在当前被标记为机密。触发操作：受限主体尝试执行 `AS OF S1` 读取历史记录。预期结果：操作依然被严格拒绝。

**违规禁则 (Forbidden outcome):** 利用历史查询绕过当前的访问控制。

---

## KIP2-GOV-015 — 快照令牌不能保留已撤销的访问权限 (Snapshot token does not preserve revoked access)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：获取快照令牌后，主体的读取权限被撤销，随后继续使用该令牌发起查询。预期结果：请求被拒绝。

**违规禁则 (Forbidden outcome):** 将快照令牌用作持久不变的授权凭据。

---

## KIP2-GOV-016 — 游标不能保留已撤销的访问权限 (Cursor does not preserve revoked access)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在分页游标生效期间撤销读取权限，随后使用游标继续翻页。预期结果：请求被拒绝或结果被脱敏遮盖。

**违规禁则 (Forbidden outcome):** 将分页游标用作永久授权令牌。

---

## KIP2-GOV-017 — 提交时权限已撤销则事务必须中止 (Commit-time revocation wins)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在已授权的写入事务准备提交前暂停执行，撤销所需的授权（Grant），随后恢复事务。预期结果：事务发生中止（abort）。

**违规禁则 (Forbidden outcome):** 依赖过期的授权成功完成提交。

---

## KIP2-GOV-018 — 认知层策略对象不能修改控制平面 (Cognitive Policy object cannot change control plane)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在认知图谱中创建一个名为 Policy 且包含放行规则的概念。预期结果：系统的治理层访问控制规则保持不变。

**违规禁则 (Forbidden outcome):** 控制平面被图谱内容伪造欺骗。

---

## KIP2-GOV-019 — 管理员不可伪造源断言主体的撤回 (Moderator cannot forge source retraction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：未绑定的管理员/审计员尝试将 Alice 的断言标记为“由源主体撤回”。预期结果：撤回操作被拒绝；行政层面的排除（administrative exclusion）必须走独立通道。

**违规禁则 (Forbidden outcome):** 伪造源主体的撤回历史。

---

## KIP2-GOV-020 — 派生过程严禁自动放大权限 (Derivation cannot amplify authority)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：从描述性的输入数据中派生出一个技能（Skill）。预期结果：该技能不会自动获得行为执行权限。

**违规禁则 (Forbidden outcome):** 派生认知产生权限自我放大。

---

## KIP2-GOV-021 — 导入的技能在未经显式提权前保持非激活状态 (Imported Skill is inactive without elevation)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：缺乏提权权限的导入者导入了一个在源空间标记为可执行的技能。预期结果：该技能在目标空间保持为候选/非激活状态。

**违规禁则 (Forbidden outcome):** 继承源空间的执行权限。

---

## KIP2-GOV-022 — 导入的治理声明不产生任何权限效果 (Imported Governance claims are inert)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：认知胶囊内声明了所有者、信任度或导出权限。预期结果：目标空间的治理策略与权限体系保持不变。

**违规禁则 (Forbidden outcome):** 远程注入治理策略。

---

## KIP2-GOV-023 — 嵌入式 Schema 严禁绕过 manage_schema 权限控制 (Embedded Schema cannot bypass manage_schema)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：导入者校验了胶囊中的嵌入式 Schema，但该主体缺乏 `manage_schema` 权限。预期结果：目标空间的活动 Schema 环境保持不变。

**违规禁则 (Forbidden outcome):** 绕过 Schema 管理权限。

---

## KIP2-GOV-024 — 引擎记录的来源主体不可篡改 (Engine origin is non-malleable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：客户端尝试写入 `_system.origin.principal_id=owner`。预期结果：操作失败并返回 `ProtectedSystemField` 或拒绝错误；实际来源严格记录为真实的调用主体。

**违规禁则 (Forbidden outcome):** 伪造系统来源信息。

---
# 17. 事务套件 (Transaction Suite)

主 Profile 归属：`KIP-Transactions`

## KIP2-TX-001 — 原子事务全有或全无 (Atomic all-or-none)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在一个原子事务中包含操作 1（创建证据）、操作 2（创建断言）、操作 3（触发 Schema 约束违规）。预期结果：系统中不会留存操作 1 与操作 2 的任何持久化状态，也不会分配产生状态变更的 `space_seq`。

**违规禁则 (Forbidden outcome):** 发生部分成功的原子提交。

---

## KIP2-TX-002 — 原子事务基于唯一起始快照 (Atomic one start snapshot)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在原子批处理内部的两次读取操作之间，并发的外部事务发生提交。预期结果：批处理内的两次读取均基于同一个唯一起始快照以及自身的写入数据推导。

**违规禁则 (Forbidden outcome):** 在同一个原子事务内混用不同的外部快照。

---

## KIP2-TX-003 — 读己之所写 (Read-your-writes)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在原子批处理内部，操作 1 写入新命题，随后的操作 2 查询该命题。预期结果：操作 2 能够观察到操作 1 所作的写入。

---

## KIP2-TX-004 — 禁止脏读 (No dirty reads)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：事务 A 完成暂定写入后暂停；事务 B 在其之外执行读取。预期结果：B 看不到该暂定写入；A 提交之后的新读取才能看到。

**违规禁则 (Forbidden outcome):** 脏读。

---

## KIP2-TX-005 — 原子提交只有一个 tx_id/space_seq (Atomic commit has one tx_id/space_seq)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在 atomic 模式下执行多个写操作。预期结果：只有一个提交凭证（Receipt）、一个 `tx_id`、一个状态变更 `space_seq`。

**违规禁则 (Forbidden outcome):** 逐操作分别提交。

---

## KIP2-TX-006 — 每个事务只递增一次版本号 (Version increments once per transaction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：一个事务对同一个已存在的可变元素施加多项合法变更。预期结果：版本号恰好递增一次。

**违规禁则 (Forbidden outcome):** 按内部子句逐条递增版本号。

---

## KIP2-TX-007 — 无副作用写入不产生认知抖动 (No-effect avoids cognitive churn)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行一次幂等更新，最终状态与原状态一致。预期结果：不产生新的认知 `space_seq`；目标元素的 version 与 `updated_at` 均保持不变。

**违规禁则 (Forbidden outcome):** 伪造写入活动。

---

## KIP2-TX-008 — EXPECT VERSION 匹配当前版本时成功 (EXPECT VERSION current succeeds)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用当前版本号作为前置条件执行更新。预期结果：更新提交成功，且版本号恰好递增一次。

---

## KIP2-TX-009 — EXPECT VERSION 版本过期时失败 (EXPECT VERSION stale fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用过期的版本号。预期结果：返回 `VersionConflict`；不发生任何写入。

**违规禁则 (Forbidden outcome):** 更新丢失（lost update）。

---

## KIP2-TX-010 — 可串行化隔离防止写偏斜 (Serializable write skew prevented)

**要求级别 (Level):** OPTIONAL

**依赖能力 (Capabilities):** serializable_isolation

**预期语义行为 (Expected semantic behavior):** 前置条件：两个并发事务若同时提交将共同破坏固件约束。预期结果：可串行化实现至少中止/冲突其中一个事务。

**违规禁则 (Forbidden outcome):** 出现不可串行化的最终状态。

---

## KIP2-TX-011 — 相同幂等键返回原始提交凭证 (Same idempotency key returns original Receipt)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用幂等键 K 提交后，再精确重试同一请求。预期结果：返回相同的 `tx_id`/`space_seq`；不产生新的变更信封（Change Envelope）。

**违规禁则 (Forbidden outcome):** 产生重复的逻辑写入。

---

## KIP2-TX-012 — 无关格式差异不破坏幂等性 (Irrelevant formatting does not defeat idempotency)

**要求级别 (Level):** SHOULD

**预期语义行为 (Expected semantic behavior):** 触发操作：重试语义相同的指令，仅改变空白字符与注释。预期结果：解析到原始执行结果。

**违规禁则 (Forbidden outcome):** 因格式敏感而产生逻辑重复写入。

---

## KIP2-TX-013 — 相同幂等键配不同请求应冲突 (Same key different request conflicts)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：以不同的绑定参数复用幂等键 K。预期结果：返回 `IdempotencyConflict`；原有状态保持不变。

**违规禁则 (Forbidden outcome):** 幂等键被悄然复用于新的写入意图。

---

## KIP2-TX-014 — request_id 不是幂等键 (request_id is not idempotency key)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：独立地变化 `request_id` 与幂等键。预期结果：运行时不得将逻辑写入身份与请求关联 ID 混为一谈。

**违规禁则 (Forbidden outcome):** 把基于 `request_id` 的去重当作持久化语义。

---

## KIP2-TX-015 — tx_id 由引擎分配 (tx_id is engine-assigned)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：客户端在元数据中提供伪造的 `tx_id`。预期结果：实际提交的 `tx_id` 仍由引擎分配。

**违规禁则 (Forbidden outcome):** 由客户端自行选定事务事实。

---

## KIP2-TX-016 — 提交成功后的超时不等于事务中止 (Timeout after commit is not abort)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在持久化提交成功之后丢弃网络响应报文。预期结果：后续通过幂等键进行查询时，状态明确报告为已提交（committed）。

**违规禁则 (Forbidden outcome):** 将网络超时错误直接映射为事务已中止。

---

## KIP2-TX-017 — 响应丢失后的重试不产生重复数据 (Retry after lost response does not duplicate)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：针对 KIP2-TX-016 中丢失响应的请求，使用相同的幂等键与请求载荷发起重试。预期结果：返回原始凭证，系统中仅存在一份认知生成记录与变更包。

**违规禁则 (Forbidden outcome):** 产生重复的 Experience 或 Evidence。

---

## KIP2-TX-018 — 提交前的确定性取消导致事务中止 (Definite cancellation before commit aborts)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：测试框架在提交阶段正式开始前注入取消信号。预期结果：系统中不发生任何持久化写入。

**违规禁则 (Forbidden outcome):** 在明确收到提交前取消信号的情况下依然完成提交。

---

## KIP2-TX-019 — 提交竞态中的取消可能返回状态未知 (Commit-race cancellation can be outcome_unknown)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在提交竞态临界点注入模糊取消信号。预期结果：当最终状态无法确知时，客户端能够感知到 `outcome_unknown` 或获得后续幂等查询路径。

**违规禁则 (Forbidden outcome):** 在不确定的情况下伪造确定性的中止或提交结论。

---

## KIP2-TX-020 — 每次提交产生且仅产生一个变更包 (One Change Envelope per commit)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行包含多个元素写入的原子事务。预期结果：系统中生成且仅生成一个共享相同 `tx_id` 与 `space_seq` 的逻辑变更包（Change Envelope）。

**违规禁则 (Forbidden outcome):** 按写入元素拆分生成多个独立的事务包。

---

## KIP2-TX-021 — 变更包重放具备唯一可识别性 (Change replay identifiable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 预期结果：同一变更包的重复投递可通过 `space_id` + `space_seq` + `tx_id` 的三元组精确识别与去重。

**违规禁则 (Forbidden outcome):** 将重放包误判为新的提交事务。

---

## KIP2-TX-022 — 已中止的事务不发出任何认知变更包 (Aborted transaction emits no cognitive Change Envelope)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：中止一个原子事务。预期结果：系统严禁向外发出任何状态变更包。

**违规禁则 (Forbidden outcome):** 将已中止的事务发布为变更通知。

---

## KIP2-TX-023 — 顺序批处理不具备跨操作回滚原子性 (Sequence is not rollback-atomic)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在 `sequence` 顺序批处理模式下。触发操作：操作 1 写入成功，操作 2 发生失败并停止。预期结果：操作 1 保持已提交状态，后续操作被跳过。

**违规禁则 (Forbidden outcome):** 级联回滚先前已成功的序列操作。

---

## KIP2-TX-024 — 独立操作模式下的失败相互隔离 (Independent failures are isolated)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在 `independent` 独立操作模式下。触发操作：某个操作发生失败，另一个合法的独立操作执行。预期结果：合法操作能够独立成功完成。

**违规禁则 (Forbidden outcome):** 隐式触发跨操作的共享回滚。

---

## KIP2-TX-025 — 原子模式下的失败回滚所有操作 (Atomic failure rolls back all operations)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在 `atomic` 原子模式下执行相同的逻辑批处理。触发操作：其中任意操作发生失败。预期结果：整个批处理完全回滚，不留存任何持久化状态。

**违规禁则 (Forbidden outcome):** 原子模式下产生部分成功的数据。

---
# 18. 认知胶囊套件 (Capsule Suite)

主 Profile 归属：`KIP-Capsule`

## KIP2-CAP-001 — 快照胶囊严格绑定唯一起始快照 (Snapshot Capsule binds one source snapshot)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在导出胶囊的同时，源空间发生并发提交。预期结果：导出的所有记录严格对应于声明的单一源快照。

**违规禁则 (Forbidden outcome):** 导出包含混合快照状态的胶囊。

---

## KIP2-CAP-002 — 规范载荷变更导致内容哈希变化 (Canonical payload change changes digest)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：修改胶囊中包含的规范记录内容。预期结果：其 `content_digest` 随之发生改变。

**违规禁则 (Forbidden outcome):** 内容哈希对语义载荷的变动不敏感。

---

## KIP2-CAP-003 — 仅格式化变动保持规范内容哈希不变 (Formatting-only change preserves canonical digest)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：仅调整非规范传输表示的排版格式，随后重新对相同语义内容进行规范化。预期结果：计算出完全相同的规范内容哈希。

**违规禁则 (Forbidden outcome):** 传输层的纯排版格式差异影响规范内容哈希。

---

## KIP2-CAP-004 — 哈希不匹配导致 VERIFY 校验失败 (Digest mismatch fails VERIFY)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：篡改工件内容但不更新哈希声明。预期结果：VERIFY 操作失败并返回 `DigestMismatch` 错误。

**违规禁则 (Forbidden outcome):** 被篡改的工件通过签名与完整性校验。

---

## KIP2-CAP-005 — 有效签名不代表获得认知信任 (Valid signature does not imply trust)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：胶囊附带密码学有效但不受信任的签名者签名。触发操作：执行 VERIFY。预期结果：VERIFY 校验通过，但本地认知中绝不自动赋予其信任度或接受其信念。

**违规禁则 (Forbidden outcome):** 将签名有效性直接等同于事实信任。

---

## KIP2-CAP-006 — 源空间 ID 不直接作为目标空间主键 ID (Source IDs are not target primary IDs)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：将胶囊导入到空的目标空间中。预期结果：目标空间分配本地主键 ID，同时在溯源映射中保留与源空间 ID 的对应关系。

**违规禁则 (Forbidden outcome):** 盲目直接复用源空间的内部 ID 作为本地主键。

---

## KIP2-CAP-007 — 同名实体绝不自动合并 (Same name does not auto-merge)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：源空间与目标空间分别存在不同的 Alice 概念，同名且缺乏受信任的规范身份标识。预期结果：绝不因名称相同而自动进行概念合并。

**违规禁则 (Forbidden outcome):** 基于纯名称进行实体身份判定。

---

## KIP2-CAP-008 — 受信任的规范身份可解析至现有概念 (Trusted canonical identity may resolve existing Concept)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 预期结果：当存在匹配且受信任的规范身份标识时，可根据既定策略将其解析并映射到目标空间中已存在的概念。

---

## KIP2-CAP-009 — 源空间的 `$self` 绝不转变为目标空间的 `$self` (Source `$self` does not become destination `$self`)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：从另一个智能体大脑执行普通的合并导入。预期结果：源空间的自身身份 `$self` 仅作为外部行动主体身份导入，绝不篡夺目标空间的 `$self`。

**违规禁则 (Forbidden outcome):** 目标空间的自身身份被外来胶囊接管（self takeover）。

---

## KIP2-CAP-010 — 恢复自身身份映射必须具备显式恢复语义 (Restore self mapping requires restore semantics)

**要求级别 (Level):** OPTIONAL

**预期语义行为 (Expected semantic behavior):** 预期结果：经校验的同脑备份数据，仅在具有显式授权的恢复模式（restore mode）下才允许映射自身身份。

**违规禁则 (Forbidden outcome):** 在普通合并导入中允许映射自身身份。

---

## KIP2-CAP-011 — 嵌入式 Schema 保持非激活状态 (Embedded Schema stays inactive)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对包含嵌入式 Schema 包的胶囊执行 VERIFY、VALIDATE 或 PREVIEW。预期结果：目标空间的活动 Schema 环境保持不变。

**违规禁则 (Forbidden outcome):** 自动激活外来嵌入的 Schema。

---

## KIP2-CAP-012 — 源空间的权限在目标空间完全惰性失效 (Source authority is inert)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：胶囊中声称拥有可执行技能等权限。预期结果：导入后目标空间的实际权限绝不因此发生任何提升。

**违规禁则 (Forbidden outcome):** 跨空间迁移执行权限。

---

## KIP2-CAP-013 — 源空间的信任度不被目标空间自动继承 (Source trust is not inherited)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：胶囊中声称具有极高信任度。预期结果：目标空间本地的信任度评定依然严格由本地策略独立控制。

**违规禁则 (Forbidden outcome):** 跨空间继承主体信任度。

---

## KIP2-CAP-014 — 已脱敏与不可用的外部引用保持严格可区分 (Redacted and unavailable ExternalRef remain distinguishable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：胶囊工件中同时包含已脱敏（redacted）与不可用（unavailable）两类外部引用。预期结果：解析器与预览工具在具备可见权限时能够清晰区分这两种不同的引用状态。

**违规禁则 (Forbidden outcome):** 丢失脱敏语义。

---

## KIP2-CAP-015 — 闭包声明状态可被检查 (Closure declaration is inspectable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 DESCRIBE 或 VALIDATE。预期结果：能够清晰暴露其闭包范围是封闭（closed）、引用式（referential）还是选择性（selective）声明。

**违规禁则 (Forbidden outcome):** 隐式推断未声明的闭包边界。

---

## KIP2-CAP-016 — VERIFY 签名校验与 VALIDATE 语义校验严格区分 (VERIFY and VALIDATE differ)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：胶囊的哈希与签名合法，但包含不符合 Schema 规范的非法数据。预期结果：VERIFY 操作成功，但 VALIDATE 操作失败。

**违规禁则 (Forbidden outcome):** 使用单一通用的状态标识混同这两种校验。

---

## KIP2-CAP-017 — VALIDATE 格式校验与 PREVIEW 导入预览严格区分 (VALIDATE and PREVIEW differ)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：胶囊结构格式完全合法，但与目标空间的现有实体存在冲突。预期结果：VALIDATE 操作成功，但 PREVIEW 操作准确报告出目标冲突。

**违规禁则 (Forbidden outcome):** 将格式合法性直接等同于无冲突可导入性。

---

## KIP2-CAP-018 — 预览操作对目标空间无任何副作用 (Preview has no destination side effect)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 记录目标空间的当前序号、实体计数与 Schema 环境后执行 `PREVIEW IMPORT`。预期结果：目标空间的所有状态数据与环境配置均严格保持不变。

**违规禁则 (Forbidden outcome):** 预览操作产生状态预留或写入副作用。

---

## KIP2-CAP-019 — 工件上传不等于认知导入 (Artifact upload is not import)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：仅在暂存区完成胶囊二进制字节的上传。预期结果：目标空间的认知记忆图谱状态保持不变。

**违规禁则 (Forbidden outcome):** 传输暂存直接转变为认知记忆。

---

## KIP2-CAP-020 — 胶囊中的外部 URL 严禁自动抓取 (Capsule URL is not auto-fetched)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：提供包含外部 URL 但未暂存实际字节的胶囊，且无网络抓取授权。预期结果：严禁发起网络请求，明确返回工件/网络不可用错误。

**违规禁则 (Forbidden outcome):** 触发服务端请求伪造（SSRF）。

---

## KIP2-CAP-021 — 导入的矛盾断言依然保持完整可表达 (Imported contradiction remains representable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：导入一条与本地现有断言相互矛盾的新断言。预期结果：两条断言的历史记录均得以完整保留；后续投影分析可判定为存争议（contested）。

**违规禁则 (Forbidden outcome):** 导入操作强制删除本地原有的矛盾记录。

---

## KIP2-CAP-022 — 导入的派生认知保留其溯源根节点 (Imported derived cognition preserves roots)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：导入带有源溯源关系的派生断言。预期结果：在完成身份映射后，依然完整保留其对溯源根节点的关联关系。

**违规禁则 (Forbidden outcome):** 洗白派生认知的真实来源（origin laundering）。

---
# 19. KQL 查询语言套件 (KQL Suite)

主 Profile 归属：`KIP-KQL`

## KIP2-KQL-001 — 概念模式匹配有效 (Concept pattern works)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询标准 Person 类型的 Alice 概念。预期结果：正确返回匹配的可见概念。

---

## KIP2-KQL-002 — 命题模式读取底层原始状态 (Proposition pattern reads raw state)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询 Alice 的 timezone 命题。预期结果：返回底层的原始命题记录，完全独立于其上层断言与信念接受状态。

**违规禁则 (Forbidden outcome):** 原始命题查询被隐式转变为 BELIEF 投影查询。

---

## KIP2-KQL-003 — 谓词变量返回精确的引用 (Predicate variable returns exact ref)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在命题模式匹配中将谓词位置绑定为变量 `?pred`。预期结果：返回的谓词标识为已锁定版本的精确引用。

---

## KIP2-KQL-004 — 断言模式匹配可用 (Assertion pattern works)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：按 proposition/asserted_by/stance/mode 过滤。预期结果：返回匹配的断言。

---

## KIP2-KQL-005 — 证据模式匹配可用 (Evidence pattern works)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：按 `evidence_class` 过滤。预期结果：返回匹配且可见的证据。

---

## KIP2-KQL-006 — 活动模式匹配可用 (Activity pattern works)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：按 `activity_class`/status 过滤。预期结果：返回匹配的活动。

---

## KIP2-KQL-007 — 结构化模式匹配可用 (Structural pattern works)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询 `has_step`。预期结果：返回结构化结果，且不要求存在对应的语义命题。

---

## KIP2-KQL-008 — FILTER 比较运算可用 (FILTER comparison works)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用确定性的字面量比较。预期结果：返回预期的结果行。

---

## KIP2-KQL-009 — NOT 表示无可见匹配而非判假 (NOT is no-visible-match, not false)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：不存在可见的素食事实。预期结果：NOT 仅充当查询取反；不会因此创建反对立场断言或信念。

**违规禁则 (Forbidden outcome):** 世界层面的否定（world-level negation）。

---

## KIP2-KQL-010 — OPTIONAL 缺失表现为空值/无匹配 (OPTIONAL missing is null/no match)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询缺失的可选关系。预期结果：得到 null/未绑定变量，而不是一条判假的断言。

**违规禁则 (Forbidden outcome):** 认识层面的否定。

---

## KIP2-KQL-011 — UNION 合并已授权分支 (UNION combines authorized branches)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：每个分支各植入一行数据。预期结果：并集返回可见部分的并集。

**违规禁则 (Forbidden outcome):** 泄漏不可见记录。

---

## KIP2-KQL-012 — COUNT 只统计已授权解 (COUNT uses authorized solutions)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：固件同时包含可见记录与机密记录。预期结果：仅统计可见记录。

**违规禁则 (Forbidden outcome):** 聚合泄漏。

---

## KIP2-KQL-013 — COUNT 为零不等于否定信念 (COUNT zero is not negative belief)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 原始查询返回零行，不会使后续 BELIEF 查询转为 `rejected`。

**违规禁则 (Forbidden outcome):** 封闭世界捷径。

---

## KIP2-KQL-014 — ORDER BY 遵循显式排序键 (ORDER BY honors explicit key)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：植入互不相同的排序值。预期结果：结果行按其正确排序。

---

## KIP2-KQL-015 — 空值排序键排在最后 (Null sort keys order last)

**要求级别 (Level):** SHOULD

**预期语义行为 (Expected semantic behavior):** 前置条件：植入部分行的 `ORDER BY` 键为 null。预期结果：空值键排在最后（规范 §44.7）。若实现公开声明了不同的基线行为，应记为一致性警告，而非静默差异。

---

## KIP2-KQL-016 — KQL 游标锁定快照 (KQL cursor pins snapshot)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：取回第一页后提交一条新的匹配行，再用游标继续翻页。预期结果：新行不出现在本次遍历中。

**违规禁则 (Forbidden outcome):** 分页时快照发生漂移。

---

## KIP2-KQL-017 — 游标与查询不匹配应失败 (Cursor query mismatch fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：改变查询后复用原游标。预期结果：返回 `CursorMismatch`。

**违规禁则 (Forbidden outcome):** 游标被复用于任意查询。

---

## KIP2-KQL-018 — 游标类型不匹配应失败 (Cursor type mismatch fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：把 KQL 游标用于 SEARCH/CHANGES。预期结果：返回 `CursorTypeMismatch` 或等价错误。

**违规禁则 (Forbidden outcome):** 跨族游标被强行解释。

---

## KIP2-KQL-019 — BELIEF 结果是虚拟的 (BELIEF result is virtual)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 BELIEF 查询。预期结果：不产生持久化的投影认知元素，也不产生状态变更序号。

**违规禁则 (Forbidden outcome):** 读操作持久化信念。

---

## KIP2-KQL-020 — BELIEF 目标必须有界 (BELIEF target is bounded)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：先尝试目标变量未绑定到任何命题的 BELIEF 查询，再尝试对整个 Brain 执行无界投影。预期结果：前者返回 `ProjectionTargetUnbound`，后者返回 `ProjectionTargetUnbounded` 或等价错误。

**违规禁则 (Forbidden outcome):** 无界投影导致爆炸式展开。

---

## KIP2-KQL-021 — 空 BELIEF SLOT 判定为证据不足 (BELIEF SLOT empty is insufficient)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询已接地但为空的函数型槽位。预期结果：返回 `insufficient` 且 `accepted_values` 为空数组。

**违规禁则 (Forbidden outcome):** 用零结果行迫使调用方自行推断。

---

## KIP2-KQL-022 — BELIEF SLOT 检出函数型冲突 (BELIEF SLOT detects functional conflict)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：候选取值的有效时间相互重叠。预期结果：结果具备冲突感知能力。

**违规禁则 (Forbidden outcome):** 武断挑选某个候选值。

---

## KIP2-KQL-023 — 原始路径不传播信念 (Raw path does not propagate belief)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：原始命题路径存在，但路径上的链接缺乏已接受的断言。预期结果：不产生隐式的信念路径。

**违规禁则 (Forbidden outcome):** 自行发明信念算术。

---

## KIP2-KQL-024 — AS OF 重建旧的可变状态 (AS OF reconstructs old mutable state)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：将概念从 S1 变更到 S2，再执行 AS OF S1 查询。预期结果：返回旧状态。

**违规禁则 (Forbidden outcome):** 历史查询变成当前状态的别名。

---

## KIP2-KQL-025 — AS OF 重建生命周期状态 (AS OF reconstructs lifecycle)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：断言在 S1 为活跃，在 S2 被撤回。预期结果：AS OF S1 为活跃，当前为已撤回。

**违规禁则 (Forbidden outcome):** 历史被改写。

---

## KIP2-KQL-026 — FOR TIME 选取世界时间上有效的状态 (FOR TIME selects world-valid state)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：断言带有世界时间范围。预期结果：投影结果随 FOR TIME 变化，而认知快照坐标保持不变。

**违规禁则 (Forbidden outcome):** 两条时间轴被混同。

---

## KIP2-KQL-027 — 历史读取遵循当前治理策略 (Historical read obeys current Governance)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：数据曾公开、现已保密。预期结果：受限主体的 AS OF 查询无法找回当前保密的内容。

**违规禁则 (Forbidden outcome):** 访问控制的时间穿越（ACL time travel）。

---

## KIP2-KQL-028 — 投影脱敏隐藏原始证据数据 (Projection redaction hides raw Evidence)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：主体具备投影权限但缺乏原始证据的读取权限。触发操作：执行包含溯源信息的投影查询。预期结果：可以返回信念状态，但原始证据内容被安全脱敏遮盖，并明确披露脱敏声明。

**违规禁则 (Forbidden outcome):** 泄漏未授权的原始证据数据。

---

## KIP2-KQL-029 — KQL 只读查询不生成写事务凭证 (KQL read has no write Receipt)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行普通的 KQL 只读查询。预期结果：响应中包含读取时的快照上下文，但绝不生成产生状态变更的写事务凭证（Receipt）或分配新的 `space_seq`。

**违规禁则 (Forbidden outcome):** 将只读查询作为写事务提交处理。

---
# 20. KML 变更语言套件 (KML Suite)

主 Profile 归属：`KIP-KML`

## KIP2-KML-001 — CREATE CONCEPT 创建独特的事件型实体身份 (CREATE CONCEPT creates distinct event-like identity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用客户端键创建经验（Experience）概念。预期结果：系统中成功创建该强类型的新概念实体。

---

## KIP2-KML-002 — 基于稳定键的 UPSERT 具备幂等性 (UPSERT stable key is idempotent)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用相同的 Project 稳定键连续两次执行 UPSERT。预期结果：系统中存在且仅存在一个对应的概念实体及其最终状态。

**违规禁则 (Forbidden outcome):** 生成重复的实体记录。

---

## KIP2-KML-003 — 拒绝仅基于名称的原生 UPSERT 操作 (Name-only native UPSERT rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试仅凭类型与名称（type + name）对 Person 执行 UPSERT。预期结果：操作失败并返回 `IdentitySelectorRequired` 或 `NameIdentityForbidden`。

**违规禁则 (Forbidden outcome):** 采用全局名称作为通用实体身份标识。

---

## KIP2-KML-004 — ENSURE 命题操作不创建任何断言 (ENSURE Proposition creates no Assertion)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 ENSURE 命题元组操作。预期结果：命题在系统中存在，但断言计数严格保持为 0。

**违规禁则 (Forbidden outcome):** 隐式将命题当做已断言的事实。

---

## KIP2-KML-005 — CREATE 断言严格保留行动主体与系统来源的区分 (CREATE Assertion preserves actor/origin distinction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：记录员记录 Alice 的陈述。触发操作：执行 CREATE 断言。预期结果：`asserted_by=Alice`，而 `origin=recorder`。

**违规禁则 (Forbidden outcome):** 混淆来源主体与语义断言主体。

---

## KIP2-KML-006 — CREATE 活动记录结构化溯源拓扑 (CREATE Activity records structural provenance)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：创建声明了输入集合（inputs）与输出集合（outputs）的活动（Activity）。预期结果：该拓扑关系可通过 STRUCTURAL 语法结构化查询。

---

## KIP2-KML-007 — MUTATE 复合状态转移具备原子性 (MUTATE compound transition is atomic)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在单个 MUTATE 块中同时创建证据、命题、断言与活动。预期结果：所有相关元素在同一个原子提交中一并生效。

**违规禁则 (Forbidden outcome):** 发生部分成功的复合生成。

---

## KIP2-KML-008 — 完全 Profile 下支持局部前向引用 (Forward local refs work in full profile)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在单个 MUTATE 块中，在 Schema 允许的前提下，让 `Evidence.generated_by` 与 `Activity.outputs` 互相引用。预期结果：提交成功执行。

**违规禁则 (Forbidden outcome):** 在完整 v2 规范中受到“先声明后使用”的死板限制。

---

## KIP2-KML-009 — 重复声明局部句柄操作失败 (Duplicate local handle fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在同一块内两次声明相同的局部句柄标识。预期结果：操作失败并返回 `DuplicateLocalHandle`，且不执行任何提交。

**违规禁则 (Forbidden outcome):** 产生歧义的句柄绑定。

---

## KIP2-KML-010 — 声明冲突的最终变更操作失败 (Conflicting final mutation fails)

**要求级别 (Level):** SHOULD

**预期语义行为 (Expected semantic behavior):** 触发操作：在单个声明式 MUTATE 中针对同一目标指定了不兼容的冲突变更。预期结果：操作失败并返回 `DuplicateMutationTarget` 或约束校验错误。

**违规禁则 (Forbidden outcome):** 隐式按照源码先后顺序执行最后写入胜出（last-write-wins）。

---

## KIP2-KML-011 — UPDATE 语句绝不执行创建操作 (UPDATE never creates)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 UPDATE 语句但 WHERE 匹配条件无任何匹配项。预期结果：匹配与更新计数均为 0，系统中不创建任何新元素。

**违规禁则 (Forbidden outcome):** 隐式表现为 UPSERT 行为。

---

## KIP2-KML-012 — UPDATE 合法更新记忆切面数据 (UPDATE legal mnemonic Facet)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 UPDATE 修改实体的 `memory_strength` 属性。预期结果：仅允许更新的切面状态发生改变，其他核心状态保持不变。

---

## KIP2-KML-013 — UPDATE 严禁写入 `_system` 系统字段 (UPDATE cannot write `_system`)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试通过 UPDATE 修改来源（origin）或版本等系统字段。预期结果：操作失败并返回 `ProtectedSystemField` 错误。

**违规禁则 (Forbidden outcome):** 篡改底层引擎记录的系统真实信息。

---

## KIP2-KML-014 — UPDATE 严禁写入治理层配置 (UPDATE cannot write Governance)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试通过普通 KML 修改策略、数据分级或授权权限。预期结果：操作被拒绝并返回 `ProtectedGovernanceField`。

**违规禁则 (Forbidden outcome):** 篡改控制平面配置。

---

## KIP2-KML-015 — 拒绝改写断言置信度 (Assertion confidence rewrite rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试通过 UPDATE 直接改写断言的置信度。预期结果：操作失败并返回 `EpistemicRevisionRequired` 或 `ImmutableField` 错误。

**违规禁则 (Forbidden outcome):** 篡改历史断言。

---

## KIP2-KML-016 — 拒绝改写证据有效载荷 (Evidence payload rewrite rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试通过 UPDATE 改写已有证据的载荷数据。预期结果：操作失败并返回 `EvidenceCorrectionRequired` 或 `ImmutableField` 错误。

**违规禁则 (Forbidden outcome):** 就地篡改证据历史。

---

## KIP2-KML-017 — 信念修正必须通过创建新断言实现 (Belief revision uses new Assertion)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：基于新证据创建修正后的新断言。预期结果：新断言成功提交，旧断言载荷完整保留。

**违规禁则 (Forbidden outcome):** 直接修改旧断言记录。

---

## KIP2-KML-018 — 主体废弃替代自身断言操作成功 (Own supersession succeeds)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：Alice 提交新断言废弃替代其先前兼容的自身断言。预期结果：操作成功执行，断言间的生命周期替代链路保持完整一致。

---

## KIP2-KML-019 — 不同主体间的异议不能直接废弃替代他人断言 (Different actor disagreement cannot supersede)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：Bob 仅因观点不一致便尝试直接 supersede（废弃替代）Alice 的断言。预期结果：操作被拒绝并返回 `SupersessionMismatch`。

**违规禁则 (Forbidden outcome):** 跨主体抹杀他人的认知历史。

---

## KIP2-KML-020 — 撤回操作完整保留原始载荷 (Retraction preserves payload)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：Alice 撤回其自身先前提出的断言。预期结果：生命周期状态变更为 `retracted`（已撤回），但其原始载荷内容保持不变且依然支持历史可查。

**违规禁则 (Forbidden outcome):** 撤回操作直接物理删除断言数据。

---

## KIP2-KML-021 — 撤回操作必须具备代表授权 (Retraction requires representation authority)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：未绑定的记录员主体尝试撤回 Alice 的断言。预期结果：操作被权限系统拒绝。

**违规禁则 (Forbidden outcome):** 伪造主体的撤回意图。

---

## KIP2-KML-022 — 证据纠错操作可支持事务原子性 (Evidence correction can be transaction-atomic)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在一个事务中同时创建证据 E2、执行纠错指令并创建修正断言，其中注入一个非法的子句。预期结果：整个纠错事务完全回滚，不提交任何部分状态。

**违规禁则 (Forbidden outcome):** 发生部分成功的纠错提交。

---

## KIP2-KML-023 — 运维维护操作严禁衰减断言置信度 (Maintenance cannot decay Assertion confidence)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：运维主体尝试通过数值 UPDATE 修改断言的置信度以模拟遗忘。预期结果：操作失败并被拒绝。

**违规禁则 (Forbidden outcome):** 衰减事实真理性置信度（truth decay）。

---

## KIP2-KML-024 — 运维维护操作可衰减记忆强度 (Maintenance can decay memory_strength)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：运维主体更新允许变更的 `MnemonicState.memory_strength`。预期结果：操作成功完成。

---

## KIP2-KML-025 — 归档不等于主体撤回 (Archive is not retraction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对合格的记忆或断言执行归档（Archive）。预期结果：数据被移入归档状态，但绝不伪造为源主体的撤回状态。

**违规禁则 (Forbidden outcome):** 将归档混同为主体主动撤回。

---

## KIP2-KML-026 — 设置墓碑不等于物理清除 (Tombstone is not purge)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：对概念设置墓碑标记（Tombstone）。预期结果：实体的身份标识与历史标记得以留存，不作为完全的物理擦除处理。

**违规禁则 (Forbidden outcome):** 将设置墓碑直接等同于物理清除（purge）。

---

## KIP2-KML-027 — 法定留存冻结阻止物理清除 (Legal hold blocks purge)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试对处于法定留存冻结（legal hold）保护下的证据执行物理清除。预期结果：操作被拒绝并返回 `LegalHoldConflict` 或 `PurgeDenied`。

---

## KIP2-KML-028 — 保守拒绝清除仍被引用的证据 (Referenced Evidence purge denied conservatively)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试对仍被其他活跃断言引用的证据执行普通物理清除。预期结果：操作被保守拒绝并返回 `PurgeDenied` 或引用冲突错误。

**违规禁则 (Forbidden outcome):** 隐式触发破坏性的级联删除。

---

## KIP2-KML-029 — MERGE 合并操作具备非破坏性 (MERGE is non-destructive)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 MERGE 将源概念合并至目标概念。预期结果：源概念依然保留历史可查状态，其生命周期标记为已合并。

**违规禁则 (Forbidden outcome):** 物理删除源概念实体。

---

## KIP2-KML-030 — MERGE 操作必须具备身份治理权限 (MERGE requires identity authority)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：不具备 `merge_identity` 权限的普通更新主体尝试执行合并操作。预期结果：操作被权限系统拒绝。

**违规禁则 (Forbidden outcome):** 普通更新权限隐式包含身份治理权限。

---

## KIP2-KML-031 — ASSERT 语法糖严格精确脱糖 (ASSERT sugar desugars exactly)

**要求级别 (Level):** MUST

**声明 Profile (Profiles):** KIP-KML (完整版)

**预期语义行为 (Expected semantic behavior):** 语句 `ASSERT ?a (:alice, "timezone", "+08:00") {by: :alice, mode: "stated", confidence: 0.9, evidence: :msg}` 必须提交且仅提交一个规范命题（新建或复用已有规范命题）、一个包含声明字段且角色为支持的证据引用的断言，除此之外不生成任何额外实体。其在持久化状态上与展开后的 `ENSURE PROPOSITION` + `CREATE ASSERTION` 标准脱糖形式在元素级别完全等价。当附带 `SUPERSEDING :old` 时，旧断言在同一个事务内被新断言废弃替代。

**后置条件 (Postconditions):** 该元组的 `canonical_proposition_count` 为 1；断言载荷完全匹配声明的成员属性；语法糖未凭空伪造任何额外的证据（Evidence）或活动（Activity）。

**违规禁则 (Forbidden outcome):** 语法糖引入非规范的额外副作用；执行结果与规范脱糖定义存在偏差；立场默认值被隐式设置为除 support 之外的值。

---

## KIP2-KML-032 — UPSERT 按其 MATCH 声明的类型创建概念 (UPSERT creates the type its MATCH declares)

**要求级别 (Level):** MUST

**声明 Profile (Profiles):** KIP-KML (完整版)

**预期语义行为 (Expected semantic behavior):** 对一个尚不存在的键执行 `UPSERT CONCEPT ?p {MATCH {type: "Person", key: "alice"} SET FIELDS {name: "Alice"}}`，必须提交一个 `schema_ref` 等于 `Person` 所解析出的确切符号的概念，使得其后 `?p CONCEPT {type: "Person", key: "alice"}` 能够匹配到它 (§54.4)。同一条 upsert 若不含 `type` 成员，则**必须**失败，而不是创建一个无类型概念 (§10.3)。

**后置条件 (Postconditions):** 所创建概念的 `schema_ref` 能解析到一个概念类型定义；无类型的创建操作报告 `SchemaSymbolNotFound` 且不提交任何内容。

**违规禁则 (Forbidden outcome):** 产生 `schema_ref` 为空或无法解析的概念；MATCH 中声明的类型被解析后遭到忽略。

---

## KIP2-KML-033 — 逻辑键是其类型之内的身份标识 (A logical key is identity within its type)

**要求级别 (Level):** MUST

**声明 Profile (Profiles):** KIP-KML (完整版)

**预期语义行为 (Expected semantic behavior):** 在同一空间内，同一类型的两个概念**严禁**共用同一个 `key`；而*不同*类型的两个概念**可以**共用 (§7.3)。因此在已存在一个以 `alice` 为键的 Person 的情况下，执行 `{type: "Preference", key: "alice"}` 的 upsert 会创建出第二个彼此独立的概念。当两者都存在后，以 `{key: "alice"}` 且不带类型作为选择器的 upsert 必须报告 `IdentityConflict`。

**后置条件 (Postconditions):** 两个同键概念拥有不同的 id 与不同的 `schema_ref`；不带类型的选择器不解析到其中任何一个。

**违规禁则 (Forbidden outcome):** 将共用同一个键的两个类型化身份合并；通过从中挑选一个来解析有歧义的键。

---

## KIP2-KML-034 — 载荷清除完整保留证据记录本身 (Payload purge preserves the Evidence record)

**要求级别 (Level):** MUST

**声明 Profile (Profiles):** KIP-KML (完整版)

**预期语义行为 (Expected semantic behavior):** `PURGE PAYLOAD :msg CONFIRM "PURGE"` 销毁证据元素的载荷字节——无论是内联内容，还是由 `content_ref` 指向、由运行时持有的内容——并将其载荷标记为已清除，而元素本身依然存活 (§60.6)。清除之后，该证据仍可按其 id 寻址，且 `evidence_class`、`content_digest`、`media_type`、`observed_at`、`source` 与 `generated_by` 均保持不变；所有曾引用它的断言仍以相同角色解析该引用；佐证分组与独立性计数 (§23) 的结果与清除前完全一致。对同一元素重复执行该清除必须返回 `no_effect` (§37)。`legal_hold` 阻止载荷清除的方式与阻止元素清除完全一致（`LegalHoldConflict`/`PurgeDenied`）；该语句不接受 `REFERENCE POLICY` 子句——元素本身存活，不会产生悬空引用——书写该子句必须报告 `InvalidSyntax`。

**后置条件 (Postconditions):** 证据 id 可解析且其生命周期状态未变；上述六个保留字段与清除前的取值逐一相等；受影响冲突集合的引用计数与独立溯源根计数均未改变；重复清除不产生新的认知 `space_seq`，也不产生变更包；带 `REFERENCE POLICY` 的变体在提交前即被拒绝。

**违规禁则 (Forbidden outcome):** 证据元素被移除、被墓碑标记或变得不可发现；`content_digest` 或引用关系随字节一并丢失；佐证强度或独立性因清除而被削弱；载荷清除接受 `REFERENCE POLICY`；绕过法律保全约束。

---
# 21. 元操作套件 (META Suite)

主 Profile 归属：`KIP-META`

## KIP2-META-001 — DESCRIBE PRIMER 暴露认知上下文坐标 (DESCRIBE PRIMER exposes coordinates)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `DESCRIBE PRIMER`。预期结果：返回足够支持模型运行的协议版本、空间标识、Schema 环境以及安全边界坐标信息。

**违规禁则 (Forbidden outcome):** 依赖直接 dump 全部物理内存。

---

## KIP2-META-002 — Primer 严格区分调用主体与自身实体 (Primer distinguishes Principal and self)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：以非自身主体完成认证。触发操作：读取 Primer。预期结果：Primer 绝不将外部调用主体混同于系统的语义自身实体 `$self`。

**违规禁则 (Forbidden outcome):** 混淆主体身份标识。

---

## KIP2-META-003 — DESCRIBE PROTOCOL 报告实际协议版本 (DESCRIBE PROTOCOL reports actual version)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `DESCRIBE PROTOCOL`。预期结果：准确报告实际支持的协议版本与规范 Profile。

---

## KIP2-META-004 — DESCRIBE EXECUTION CONTEXT 报告已解析的当前空间 (DESCRIBE EXECUTION CONTEXT reports resolved Space)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `DESCRIBE EXECUTION CONTEXT`。预期结果：准确报告当前会话已解析生效的空间标识（Space ID）及主体上下文。

---

## KIP2-META-005 — DESCRIBE TYPE 返回精确的 Schema 标识 (DESCRIBE TYPE returns exact Schema identity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `DESCRIBE TYPE` 查询本地类型。预期结果：返回该类型精确绑定的 Schema 包标识及版本信息。

---

## KIP2-META-006 — DESCRIBE 歧义符号操作失败 (DESCRIBE ambiguous symbol fails)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在存在歧义定义的 Schema 环境下。触发操作：执行 `DESCRIBE` 查询未经限定的歧义符号。预期结果：操作失败并返回 `SchemaSymbolAmbiguous` 错误。

---

## KIP2-META-007 — 关键字 SEARCH 返回候选实体的精确标识 (Keyword SEARCH returns exact candidate identity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 SEARCH 关键字检索。预期结果：返回的匹配候选列表中包含精确的实体引用标识。

---

## KIP2-META-008 — SEARCH 检索评分属于瞬态指标 (SEARCH score is transient)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 SEARCH 并获取匹配得分。预期结果：该评分仅作为检索结果的瞬态属性，不改变实体的任何持久化认知属性。

---

## KIP2-META-009 — 搜索未命中不代表实体不存在 (Search miss is not absence)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：SEARCH 未检索到目标实体，但通过精确 KQL 查询已知 ID。预期结果：KQL 能够正常查出该实体；测试系统明确搜索未命中不等于实体在认知层面的绝对不存在。

---

## KIP2-META-010 — 声明搜索能力时必须披露索引新鲜度 (Search freshness disclosed when capability claimed)

**要求级别 (Level):** OPTIONAL

**依赖能力 (Capabilities):** search_index_freshness

**预期语义行为 (Expected semantic behavior):** 触发操作：在声明支持高级搜索的环境下执行 SEARCH。预期结果：响应上下文中明确披露索引的最新同步序号（seq）或新鲜度时间戳。

---

## KIP2-META-011 — 声明支持与当前可用严格区分 (supported and available are distinct)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询能力状态。预期结果：清晰区分规范级别声明支持的特性（supported）与在当前空间及权限下实际可用的特性（available）。

---

## KIP2-META-012 — 能力枚举严禁泄漏未授权的隐藏空间 (Capability enumeration does not leak hidden Space)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在受限权限下枚举系统能力与空间列表。预期结果：响应中绝不出现调用主体未被授权发现的保密空间。

**违规禁则 (Forbidden outcome):** 通过能力元数据枚举泄漏保密空间的存在。

---

## KIP2-META-013 — VERIFY 校验签名通过不等于获得信任 (VERIFY signature is not trust)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `VERIFY` 校验外部签名。预期结果：签名验证结果仅代表密码学完整性与签署者身份，不代表认知中枢自动赋予其信任。

---

## KIP2-META-014 — VALIDATE KML 不产生任何状态变更 (VALIDATE KML has no state change)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 记录系统序号后执行 `VALIDATE KML` 校验变更语句。预期结果：完成静态语法与类型校验，系统中不发生任何持久化状态变动。

**违规禁则 (Forbidden outcome):** 校验操作产生状态修改。

---

## KIP2-META-015 — PREVIEW KML 不产生状态变更或资源预留 (PREVIEW KML has no state/reservation)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `PREVIEW KML` 预览执行效果。预期结果：系统返回预期变更摘要，但不修改任何持久化数据，也不产生任何排他性资源预留。

**违规禁则 (Forbidden outcome):** 预览操作产生副作用或资源锁定。

---

## KIP2-META-016 — 预览成功不构成对未来提交成功的绝对保证 (Preview is not future commit guarantee)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：预览执行成功后，在正式提交前外部发生并发写入导致冲突。预期结果：实际提交时能够正确检测冲突并报错。

---

## KIP2-META-017 — 通过幂等键查找事务返回原始凭证 (Transaction lookup by idempotency returns original)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：通过已提交写入的 `idempotency_key` 查询事务执行状态。预期结果：返回最初提交时生成的权威事务凭证。

---

## KIP2-META-018 — 未知的事务状态不等于已中止 (Unknown transaction is not aborted)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询一个未识别或正在执行中的事务键。预期结果：系统返回未知状态（unknown）或未找到，严禁将其断定为已确定中止。

**违规禁则 (Forbidden outcome):** 将未知状态直接推断为中止。

---

## KIP2-META-019 — HISTORY 按时间与序列报告历史演变 (HISTORY reports chronology)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询实体的 `HISTORY` 演变历史。预期结果：严格按照事务序列号（space_seq）与时间顺序完整返回各历史版本。

---

## KIP2-META-020 — KQL AS OF 准确重构历史内容 (KQL AS OF reconstructs content)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用 `KQL AS OF` 查询历史版本。预期结果：准确重构出指定历史时间点时的完整数据内容。

---

## KIP2-META-021 — CHANGES 完整保留事务变更包 (CHANGES preserves transaction envelope)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：通过 `CHANGES` 接口订阅或拉取增量变更。预期结果：变更事件严格保留所属事务的信封信息（tx_id、space_seq 等元数据）。

---

## KIP2-META-022 — 过期的变更游标必须显式报错 (Expired Change cursor is explicit)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用已被引擎清理过期的变更游标继续拉取增量。预期结果：明确返回 `ChangeCursorExpired` 错误，而非静默返回空列表或跳跃丢失数据。

**违规禁则 (Forbidden outcome):** 静默忽略游标过期。

---

## KIP2-META-023 — EXPORT CAPSULE 导出胶囊对认知图谱只读 (EXPORT CAPSULE is cognitively read-only)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `EXPORT CAPSULE` 导出认知胶囊。预期结果：导出过程对源空间的认知状态完全只读，不产生任何认知状态修改。

---

## KIP2-META-024 — 只读端点接受预览但拒绝实际提交 KML (Readonly accepts preview but rejects commit KML)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在只读端点（readonly endpoint）上分别执行 PREVIEW 与实际 COMMIT KML。预期结果：PREVIEW 成功返回预览信息，而 COMMIT 操作被严格拒绝并返回 `ReadonlyViolation`。

**违规禁则 (Forbidden outcome):** 绕过只读端点的写入限制。

---

## KIP2-META-025 — LIST DEPENDENTS 是有界且受治理的反向闭包 (LIST DEPENDENTS is a bounded, governed reverse closure)

**要求级别 (Level):** MUST

**声明 Profile (Profiles):** KIP-META (高级版)

**预期语义行为 (Expected semantic behavior):** `LIST DEPENDENTS :root` 沿派生方向遍历溯源拓扑，枚举由某一元素派生出的认知——`:root ∈ Activity.inputs → 该 Activity → 其 outputs 中的每个元素`——并将每个输出作为距离 1 的依赖方返回 (§63.5)。`DEPTH 2` 从每个距离 1 的依赖方再向外延伸一跳；缺省深度为 1。每个结果行都必须携带依赖方的精确 id、类型 (kind)、距离，以及抵达它所经过的 Activity（或结构字段），并像其他 `LIST` 目标一样通过 `LIMIT` / `CURSOR` 分页。治理逐行生效：调用方无权发现的依赖方被省略，且省略与不存在不可区分 (§30.4)。该命令是读取操作——严禁改变任何元素，也严禁触发记忆强化 (§38)。被列出的依赖方并不因此就是过期的、错误的或需要修改的 (§57.5)；而未记录 Activity 溯源的历史转换在此处根本无法被发现。

**后置条件 (Postconditions):** 调用前后 `space_seq`、元素版本与 `memory_strength` 均未改变；距离 1 的结果集合等于以 `:root` 为输入的各 Activity 的 outputs，再减去被治理过滤掉的行；对 `DEPTH` 设有上限的运行时必须显式报告该上限，而非静默截断；无权调用方所得到的结果，与对一个没有任何依赖方的根节点发起同一调用不可区分。

**违规禁则 (Forbidden outcome):** 无界遍历整个溯源图；把被列出的依赖方当作过期或错误的判定结论；泄露调用方无权发现的元素，或使“被隐藏”与“不存在”可被区分；读取路径产生副作用变更或触发记忆强化。

---
# 22. 运行时套件 (Runtime Suite)

主 Profile 归属：`KIP-Runtime`

## KIP2-RT-001 — UTF-8 字符正确双向传递 (UTF-8 round trip)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：绑定并查询非 ASCII 的 UTF-8 文本内容。预期结果：语义文本完整无损地完成往返存储与查询。

**违规禁则 (Forbidden outcome):** 发生字符编码破坏或乱码。

---

## KIP2-RT-002 — 拒绝非法 UTF-8 字节序列 (Invalid UTF-8 rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在支持原始传输的绑定中发送格式错误的非 UTF-8 字节序列。预期结果：在执行具体认知操作前直接拒绝该请求。

**违规禁则 (Forbidden outcome):** 静默将其替换为替代字符并继续写入。

---

## KIP2-RT-003 — 高保证 Profile 下拒绝重复 JSON 键 (Duplicate JSON keys rejected in High-Assurance)

**要求级别 (Level):** OPTIONAL

**预期语义行为 (Expected semantic behavior):** 触发操作：在请求中发送包含重复关键对象键（duplicate keys）的 JSON 报文。预期结果：解析器拒绝请求并返回 `InvalidRequestEnvelope` 错误。

**违规禁则 (Forbidden outcome):** 产生歧义的 JSON 解析结果。

---

## KIP2-RT-004 — 结构化绑定防止指令注入 (Structural binding prevents command injection)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在参数化变量中传入形如 KIP 语法的恶意字符串。预期结果：该字符串仅被当作纯数据处理或触发类型校验失败，绝不执行注入的指令。

**违规禁则 (Forbidden outcome):** 发生字符串拼接导致的指令执行。

---

## KIP2-RT-005 — 嵌入式占位符模板不被当作代码执行 (Embedded placeholder template is not code)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在字面量中使用形如 `"Hello :name"` 的模板字符串。预期结果：运行时不会将其不安全地展开为可执行语法。

**违规禁则 (Forbidden outcome):** 发生模板注入（template injection）。

---

## KIP2-RT-006 — 拒绝非有限数值 (Non-finite number rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：尝试绑定 NaN 或 Infinity 等非有限浮点数。预期结果：在发生持久化变更前直接拒绝请求。

**违规禁则 (Forbidden outcome):** 存储非规范的特殊数值。

---

## KIP2-RT-007 — 语言标签声明不能绕过写保护 (Language label cannot downgrade write)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在只读端点上声明 `language=META` 但实际指令内容为 KML 写入语句。预期结果：操作被拒绝并返回 `LanguageMismatch` 或 `ReadonlyViolation`，不执行任何写入。

**违规禁则 (Forbidden outcome):** 仅依赖语言标签做安全性检查。

---

## KIP2-RT-008 — 多操作原生请求必须声明执行模式 (Multi-operation native request declares execution mode)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在原生请求中提交多个操作且未声明 `execution.mode`。预期结果：返回 `InvalidRequestEnvelope` 错误；规范 §75 要求任何原生多操作请求都必须显式声明执行模式，且未定义任何默认值。

**违规禁则 (Forbidden outcome):** 采用隐式未声明的批处理语义。

---

## KIP2-RT-009 — 独立操作模式允许使用不同快照 (Independent may use separate snapshots)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在 `independent` 模式下的两个读取操作之间发生外部并发提交。预期结果：两次读取允许分别基于不同的快照，且各响应上下文中准确标明其快照标识。

**违规禁则 (Forbidden outcome):** 运行器错误假设所有独立操作必须共享同一快照。

---

## KIP2-RT-010 — 顺序批处理能够观察到前序提交 (Sequence observes prior commit)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在 `sequence` 模式下。触发操作：操作 1 写入 X，紧随其后的操作 2 读取 X。预期结果：操作 2 能够观察到 X。

**违规禁则 (Forbidden outcome):** 顺序执行模式却无法保证顺序可见性。

---

## KIP2-RT-011 — 顺序批处理不等于共享唯一起始快照 (Sequence is not shared snapshot)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在 `sequence` 各操作之间注入不相关的外部并发提交。预期结果：后续操作能够观察到外部并发提交并报告其实际的快照环境。

**违规禁则 (Forbidden outcome):** 错误宣称顺序批处理具备全局唯一起始快照的原子性。

---

## KIP2-RT-012 — 原子事务具备单一事务身份标识 (Atomic has one transaction identity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在原子事务中执行多项写入。预期结果：整个批处理共享且仅生成一个事务凭证与 `tx_id`。

---

## KIP2-RT-013 — 原子只读批处理具备唯一起始快照但不生成写事务凭证 (Atomic readonly batch has snapshot but no write Receipt)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在原子模式下执行多个读取操作。预期结果：所有读取共享同一个唯一起始快照上下文，但不生成任何产生状态变更的写事务凭证。

**违规禁则 (Forbidden outcome):** 为纯只读操作伪造写事务提交。

---

## KIP2-RT-014 — 请求 ID 严格区别于事务 ID (request_id differs from tx_id)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：客户端在请求中指定 `request_id`。预期结果：底层引擎自主生成权威的 `tx_id`，两者在协议中保持相互独立的语义标识。

**违规禁则 (Forbidden outcome):** 将客户端请求关联 ID 直接作为权威事务提交标识。

---

## KIP2-RT-015 — 重试可更换请求 ID 但保持同一逻辑事务 (Retry may change request_id but preserve logical tx)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：使用相同的幂等键与载荷，但携带新的 `request_id` 进行重试。预期结果：返回与首次提交相同的原始事务凭证。

**违规禁则 (Forbidden outcome):** 幂等去重强制依赖不变的请求 ID。

---

## KIP2-RT-016 — 快照令牌保持不透明性 (Snapshot token is opaque)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：客户端篡改快照令牌中的内部字节。预期结果：服务端直接拒绝该非法令牌，而非尝试解析客户端篡改后的坐标。

**违规禁则 (Forbidden outcome):** 允许客户端任意伪造篡改快照令牌。

---

## KIP2-RT-017 — 快照令牌不等于授权凭据 (Snapshot token is not authorization)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：获取快照令牌后，主体的访问权限被撤销，随后继续使用该令牌发起查询。预期结果：查询被权限系统拒绝。

**违规禁则 (Forbidden outcome):** 将快照令牌作为永久授权 Capability 使用。

---

## KIP2-RT-018 — 延迟的搜索索引不可伪造原子一致性 (Lagging SEARCH cannot fake atomic consistency)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在搜索索引发生延迟时，发起要求可串行化/原子一致性的 SEARCH 操作。预期结果：运行时必须在真实追平索引后再返回，或显式拒绝该请求。

**违规禁则 (Forbidden outcome):** 在存在延迟的情况下虚假宣称具备原子一致性。

---

## KIP2-RT-019 — 严禁静默降级事务隔离级别 (No silent isolation downgrade)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在不支持可串行化隔离级别的空间请求可串行化事务。预期结果：操作失败并返回 `UnsupportedIsolation`。

**违规禁则 (Forbidden outcome):** 静默降级到较弱的隔离级别并继续执行。

---

## KIP2-RT-020 — 严禁静默降级协议能力 (No silent capability downgrade)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：请求不可用的可选协议能力。预期结果：操作失败并返回 `UnsupportedCapability`。

**违规禁则 (Forbidden outcome):** 静默忽略该能力要求并继续执行。

---

## KIP2-RT-021 — 顺序批处理的部分成功状态必须显式表达 (Sequence partial status is explicit)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：在顺序批处理中，操作 1 成功，操作 2 失败，操作 3 被跳过。预期结果：顶层及明细响应状态准确清晰地反映这种部分成功的语义。

**违规禁则 (Forbidden outcome):** 返回模糊不清的部分写入状态。

---

## KIP2-RT-022 — 原子事务中止绝不产生部分提交 (Atomic abort is not partial commit)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在原子事务中触发必败条件。预期结果：系统中不留存任何部分写入的持久化状态。

---

## KIP2-RT-023 — 传输层状态未知区别于事务实际状态 (outcome_unknown differs from transaction state)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：注入网络响应丢失故障。预期结果：客户端感知到传输层状态未知（outcome_unknown），而通过幂等查询可准确查明服务端的实际提交状态。

**违规禁则 (Forbidden outcome):** 混淆传输层状态与服务端真实持久化状态。

---

## KIP2-RT-024 — 流式进度通知不代表已持久化提交 (Progress does not claim commit)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在流式写入过程中、正式提交前暂停。预期结果：传输中的进度通知帧保持临时性声明，绝不包含正式的事务提交凭证。

**违规禁则 (Forbidden outcome):** 在进度通知中过早声称数据已持久化。

---

## KIP2-RT-025 — 最终帧确立最终写入结果 (Final frame establishes terminal write outcome)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：流式写入成功完成。预期结果：流式连接的最终帧必须确立最终的已提交凭证或终态结果。

**违规禁则 (Forbidden outcome):** 缺乏终态确定性证明。

---

## KIP2-RT-026 — 工件句柄不等于本地文件系统路径 (Artifact handle is not filesystem path)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：传入形如本地文件路径的工件句柄。预期结果：将其作为不透明的无效句柄报错处理，绝不直接访问本地文件系统。

**违规禁则 (Forbidden outcome):** 发生路径遍历攻击（path traversal）。

---

## KIP2-RT-027 — 工件句柄不等于网络 URL (Artifact handle is not URL)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：传入形如网络 URL 的工件句柄。预期结果：不发起任何外联网络请求。

**违规禁则 (Forbidden outcome):** 触发服务端请求伪造（SSRF）。

---

## KIP2-RT-028 — 必须校验工件的预期内容哈希 (Expected artifact digest is checked)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：暂存与声明哈希不相符的错误数据。预期结果：校验失败并返回 `DigestMismatch`。

**违规禁则 (Forbidden outcome):** 忽略工件完整性哈希校验。

---

## KIP2-RT-029 — 过期的工件安全报错 (Expired Artifact fails safely)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在使用前将工件句柄标记为过期。预期结果：操作安全失败并返回 `ArtifactUnavailable`，且不执行任何认知持久化提交。

**违规禁则 (Forbidden outcome):** 基于过期的句柄执行变更操作。

---

## KIP2-RT-030 — 不同类型的游标严禁混用 (Cursor families are non-interchangeable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：交叉混用 KQL 查询游标、SEARCH 检索游标或 CHANGES 增量游标。预期结果：操作失败并返回 `CursorTypeMismatch` 或等效错误。

**违规禁则 (Forbidden outcome):** 发生游标类型混淆。

---

## KIP2-RT-031 — 数据摄取上下文如实铸造证据记录 (Ingestion context mints faithful Evidence)

**要求级别 (Level):** MUST

**声明 Profile (Profiles):** KIP-Runtime (完整版)

**依赖能力 (Capabilities):** ingestion_context

**预期语义行为 (Expected semantic behavior):** 请求携带了 `ingest.evidence[{key: "msg", evidence_class: "user_statement", payload: P, client_key: K}]` 以及引用 `:msg` 的认知操作。运行时必须如实铸造且仅铸造一个证据记录，其有效载荷/内容哈希与传输传入的 P 在字节级别完全一致，将 `:msg` 绑定到该证据上，并与事务原子提交。使用相同的幂等键/客户端键重试该请求时，绝不生成重复的证据。若事务中止，则系统中绝不持久化创建该证据。

**后置条件 (Postconditions):** 证据载荷哈希等于 `digest(P)`；该逻辑写入的 `change_envelope_count` 为 1。

**违规禁则 (Forbidden outcome):** 相对于传输输入对载荷进行改动、截断或转述；证据在已中止的事务中留存；重试操作生成重复的证据记录。

---
# 23. 历史套件 (Historical Suite)

主 Profile 归属：`KIP-Historical`

## KIP2-HIST-001 — 历史可变概念重构 (Historical mutable Concept reconstruction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：概念在序号 S1 时的名称为 Alpha，在序号 S2 时变更为 Beta。触发操作：执行 `AS OF S1` 与当前查询。预期结果：`AS OF S1` 返回名称 Alpha，而当前最新查询返回 Beta。

**违规禁则 (Forbidden outcome):** 历史查询直接返回当前最新状态。

---

## KIP2-HIST-002 — 历史断言生命周期重构 (Historical Assertion lifecycle reconstruction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：断言在 S1 时处于 active 状态，在 S2 时被撤回（retracted）。触发操作：执行 `AS OF S1` 查询。预期结果：在 S1 时该断言呈现为 active 状态，而当前呈现为已撤回状态。

---

## KIP2-HIST-003 — 历史证据纠错重构 (Historical Evidence correction reconstruction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：证据 E1 在 S1 时创建，在 S2 时被 E2 纠错。触发操作：执行 `AS OF S1` 查询。预期结果：在 S1 时 E1 呈现为最初未经纠错的状态。

---

## KIP2-HIST-004 — 历史 Schema 环境重构 (Historical Schema Environment reconstruction)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 `AS OF S1` 查询。预期结果：系统按照 S1 时生效的历史 Schema 环境精确解释当时的符号与类型。

---

## KIP2-HIST-005 — 历史记录保持精确 Schema 语义 (Historical records keep exact Schema meaning)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在 Schema 发生演进后查询历史记录。预期结果：历史记录严格保持其创建时绑定的精确 Schema 语义，不因当前 Schema 升级而发生语义漂移。

**违规禁则 (Forbidden outcome):** 用当前 Schema 强行重新解释历史数据导致语义失真。

---

## KIP2-HIST-006 — 历史治理遵循当前授权 (Historical Governance uses current authorization)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：调用主体尝试通过历史查询接口读取在当前已被撤销访问权限的数据。预期结果：请求被当前治理策略严格拒绝。

**违规禁则 (Forbidden outcome):** 允许利用历史时间穿越绕过当前的访问控制策略。

---

## KIP2-HIST-007 — 当时的信念不同于当前对当时状态的信念 (Belief-then differs from current-belief-about-then)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：事后存在补正。触发操作：分别执行历史认知视角的 `AS OF` + `FOR TIME` 查询，以及当前认知视角的同一 `FOR TIME` 查询。预期结果：两者可分别表达，且结果可以不同。

---

## KIP2-HIST-008 — 合并操作保留历史原始端点 (Merge preserves historical raw endpoint)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在发生概念合并后执行 `AS OF` 历史查询。预期结果：历史查询依然能够精确返回合并发生前的原始端点概念标识。

---

## KIP2-HIST-009 — 已物理清除的历史属于不可用而非虚构存在 (Purged history is unavailable, not fabricated)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：查询已被合规物理清除（purged）的历史范围。预期结果：系统明确返回历史数据不可用错误，严禁凭空捏造历史数据。

**违规禁则 (Forbidden outcome):** 伪造已清除的历史记录。

---

## KIP2-HIST-010 — 事务历史严格按 space_seq 排序 (Transaction chronology ordered by space_seq)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：拉取事务演变历史。预期结果：所有变更事件严格按照单调递增的 `space_seq` 事务序列号排序。

---
# 24. 高保证套件 (High-Assurance Suite)

主 Profile 归属：`KIP-High-Assurance`

## KIP2-HA-001 — 可串行化结果套件全部通过 (Serializable outcome suite passes)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 前置条件：声明支持高保证（High-Assurance）Profile。预期结果：事务套件中的所有可串行化并发冲突测试向量均必须 100% 判定为 PASS。

---

## KIP2-HA-002 — 已签名的事务凭证校验通过 (Signed Receipt verifies)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：根据运行时/认知中枢身份公钥以及所覆盖的内容哈希对已签名的事务凭证（Receipt）执行验签。预期结果：密码学签名校验通过。

---

## KIP2-HA-003 — 篡改凭证导致证明失效 (Receipt tampering breaks proof)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：篡改凭证中的 `tx_id`、`space_seq` 或 `request_digest`。预期结果：验签失败并返回 `ProofInvalid`。

---

## KIP2-HA-004 — 请求哈希归一化无关排版格式 (Request digest normalizes irrelevant formatting)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：提交在语义上完全一致但在空格或排版上有差异的请求变体。预期结果：在声明的哈希 Profile 下计算出相同的归一化请求哈希（normalized request digest）。

**违规禁则 (Forbidden outcome):** 逻辑请求身份依赖格式排版差异。

---

## KIP2-HA-005 — 语义执行计划哈希反映精确的 Schema 解析 (Semantic plan digest reflects exact Schema resolution)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在不同版本的精确 Schema 环境下提交相同的局部别名。预期结果：解析出不同的语义执行计划哈希（resolved plan digest）。

**违规禁则 (Forbidden outcome):** 掩盖 Schema 的版本歧义。

---

## KIP2-HA-006 — 严格拒绝重复 JSON 键 (Duplicate JSON keys strictly rejected)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行 KIP2-RT-003 测试向量。预期结果：请求被严格拒绝并判定为通过。

---

## KIP2-HA-007 — 防篡改检查点可检测任何修改 (Tamper-evident checkpoint detects modification)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：篡改被检查点覆盖的底层提交记录（Commit Record）。预期结果：检查点/密码学证明校验失败。

**违规禁则 (Forbidden outcome):** 容忍被篡改的数据通过校验。

---

## KIP2-HA-008 — 严格存在性中立响应 (Strict existence-neutral response)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：在严格安全策略下，分别查询已知的保密资源 ID 与随机生成的完全不存在的 ID。预期结果：两者的响应报文在协议语义上完全一致、不可区分。

**违规禁则 (Forbidden outcome):** 成为保密资源存在性的探测预言机（secret existence oracle）。

---

## KIP2-HA-009 — 投影策略版本完全可审计 (Projection policy version is auditable)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行历史或当前的认识投影分析。预期结果：系统能够清晰标识或可审计地完整重构出当时所采用的精确策略版本。

**违规禁则 (Forbidden outcome):** 运行未标明版本的匿名信念推理引擎。

---
# 25. KIP 1.x 迁移套件 (KIP 1.x Migration Suite)

主 Profile 归属：`KIP-1-Migration`

## KIP2-MIG-001 — 旧版概念迁移为 v2 概念 (Legacy Concept becomes v2 Concept)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移 v1 的类型/名称概念实体。预期结果：完整保留语义身份；当旧版实体身份依赖名称时，正确推导生成 v2 的稳定键（stable key）。

---

## KIP2-MIG-002 — 旧版事实型命题获得迁移断言 (Legacy factual Proposition gets migrated Assertion)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移 v1 中的类事实关联。预期结果：转换为 v2 中价值中立的规范命题，并附带一个迁移生成的正向肯定断言。

**违规禁则 (Forbidden outcome):** 丢失事实层面的认识语义。

---

## KIP2-MIG-003 — 旧版置信度映射至断言而非命题 (Legacy confidence maps to Assertion, not Proposition)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：执行数据迁移。预期结果：在迁移后的 v2 规范命题中严禁包含置信度字段，置信度必须且仅能存在于断言对象上。

---

## KIP2-MIG-004 — 旧版来源/作者字段被精确解耦 (Legacy source/author is decomposed)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移包含来源与作者的旧版记录。预期结果：仅在源语义明确支持的情况下映射为 `asserted_by`、证据溯源或系统来源字段；绝不凭空臆造确定性。

**违规禁则 (Forbidden outcome):** 进行死板盲目的通用元数据复制。

---

## KIP2-MIG-005 — 旧版 observed_at 映射至合法的证据时间 (Legacy observed_at maps to Evidence time where valid)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移带有 `observed_at` 时间戳的旧数据。预期结果：该时间戳被正确保留在对应的证据语义时间字段中。

---

## KIP2-MIG-006 — 旧版 valid_from/until 映射至断言世界有效时间 (Legacy valid_from/until maps to Assertion valid_time)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移带有有效区间的旧数据。预期结果：世界适用性时间被映射到断言的 `valid_time`，并与物理存储留存严格区分。

---

## KIP2-MIG-007 — 旧版 expires_at 映射至留存策略 (Legacy expires_at maps to retention)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移带有 `expires_at` 的旧数据。预期结果：存储过期时间映射为治理层的留存策略（retention），绝不被误当作断言的世界有效时间。

---

## KIP2-MIG-008 — 旧版 access_level 映射至治理层策略 (Legacy access_level maps to Governance)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移带有访问级别的旧数据。预期结果：转换为治理平面的受保护访问控制规则，绝不降级为普通图谱属性。

---

## KIP2-MIG-009 — 旧版置信度衰减不作为原生断言代谢 (Legacy confidence decay is not native Assertion metabolism)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移完成后运行运维维护流程。预期结果：维护代谢仅作用于记忆切面，严禁纯粹随着时间流逝直接衰减断言的历史置信度。

---

## KIP2-MIG-010 — 旧版破坏性合并转变为非破坏性整合 (Legacy destructive merge becomes non-destructive consolidation)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：迁移历史上发生过合并的数据。预期结果：历史源概念实体的身份保持完整可重构，消除破坏性物理删除痕迹。

---

## KIP2-MIG-011 — 旧版导出脚本不具备原生胶囊身份 (Legacy EXPORT script is not native Capsule identity)

**要求级别 (Level):** MUST

**预期语义行为 (Expected semantic behavior):** 触发操作：处理旧版导出脚本工件。预期结果：除非执行了显式转换，否则兼容性工件不具备原生认知胶囊的哈希与数字签名语义。

---
# 26. 跨模块综合场景套件 (Cross-Module Scenario Suite)

当被测实现同时声明支持所涉及的相关 Profile 时，必须强制执行并全量通过以下场景测试。

## KIP2-X-001 — 用户端到端纠错场景 (User correction end-to-end)

**要求级别 (Level):** MUST

涵盖 Profile 组合：

```text
Core + Epistemic + Governance + Transactions + KQL + KML + Historical
```

初始状态：

```text
Alice stated timezone +08
Assertion A1 active
```

单次纠错事务包含以下复合操作：

```text
new message Evidence E2
new Proposition (+01)
new Assertion A2
A2 supersedes A1
belief_revision Activity
```

预期执行结果：

```text
A1 payload unchanged
A1 lifecycle = superseded
A2 active
E2 preserved
Activity links old/new/Evidence
current BELIEF SLOT → +01
historical AS OF before correction → +08
one tx Receipt
one Change Envelope
```

违规禁则：

```text
A1 tuple/confidence overwritten
old Evidence deleted
history rewritten
```

---

## KIP2-X-002 — 第三方异议不等于纠错 (Third-party disagreement is not correction)

**要求级别 (Level):** MUST

Alice 支持命题 P。Bob 反对命题 P。

预期执行结果：

```text
both Assertions remain
no cross-actor supersession
Projection may become contested
```

---

## KIP2-X-003 — SEARCH 检索接地与 BELIEF 信念计算保持独立 (SEARCH grounding and BELIEF stay separate)

**要求级别 (Level):** MUST

SEARCH 检索匹配到 Alice 的相关记录并返回检索相关性得分。

在 BELIEF 投影查询中使用检索返回的精确实体 ID/引用。

预期执行结果：

```text
retrieval score is not copied into confidence/support
SEARCH relevance and epistemic status remain distinct
```

---

## KIP2-X-004 — 搜索索引延迟与规范状态的一致性边界 (Search lag versus canonical state)

**要求级别 (Level):** MUST

在序列号 101 处提交新概念；故意将搜索索引保持在序列号 100 处产生延迟。

预期执行结果：

```text
SEARCH may miss
exact KQL finds it
search context declares lag/weaker consistency
```

---

## KIP2-X-005 — 数据密级提升后的历史保密性 (Historical secrecy after classification change)

**要求级别 (Level):** MUST

证据记录在序列号 S1 时为公开可见，但在后续被重新定级为机密数据。

受限主体发起针对 S1 的历史 BELIEF 或读取查询时必须服从当前的治理策略。

原始机密证据内容保持隐藏不可见；投影结果根据策略被安全拒绝或执行脱敏遮盖。

---

## KIP2-X-006 — 已签名的导入技能绝不自我执行 (Signed imported Skill does not execute itself)

**要求级别 (Level):** MUST

完整导入流水线：

```text
VERIFY
VALIDATE
PREVIEW
IMPORT
```

预期执行结果：

```text
signature may verify
Skill may import
provenance preserved
Skill candidate/inactive
no executable authority
no tool permission
```

---

## KIP2-X-007 — 胶囊同名实体身份碰撞隔离 (Capsule same-name identity collision)

**要求级别 (Level):** MUST

源空间中的 Alice 与目标空间中互不相关的 Alice 具有完全相同的名称，但缺乏受信任的全局规范身份标识。

预期执行结果：目标空间绝不执行任何自动的概念合并。

---

## KIP2-X-008 — 响应丢失后的复合认知生成幂等重试 (Formation retry after lost response)

**要求级别 (Level):** MUST

复合生成事务同时创建：

```text
Experience
Evidence
Assertion
Activity
```

服务端成功提交事务后网络响应丢失；客户端使用相同的幂等键发起重试。

预期执行结果：

```text
same tx_id
same logical elements/client-key resolution
one formation
one Change Envelope
```

---

## KIP2-X-009 — 预览成功但在授权撤销后实际提交失败 (Preview succeeds, commit fails after revocation)

**要求级别 (Level):** MUST

`PREVIEW KML` 预览执行成功。

在发起实际写入提交前，所需的授权（Grant）被管理员撤销。

预期实际事务被权限系统严格拒绝并中止。

预览操作绝不预留任何执行权限。

---

## KIP2-X-010 — 胶囊 Schema 预览不触发环境激活 (Capsule Schema preview does not activate)

**要求级别 (Level):** MUST

认知胶囊中包含未知的嵌入式 Schema 包，仅用于数据校验目的。

执行 PREVIEW 预览后，目标空间的活动 Schema 环境严格保持不变。

---

## KIP2-X-011 — 记忆衰减不改写断言置信度 (Memory decay does not rewrite confidence)

**要求级别 (Level):** MUST

断言置信度为 0.95；关联经验的记忆强度为 0.8。

运行维护流程将记忆强度衰减为 0.4。

预期执行结果：

```text
confidence = .95
memory_strength = .4
```

---

## KIP2-X-012 — 清除反面证据严禁静默增强信念 (Counter-Evidence purge cannot silently strengthen belief)

**要求级别 (Level):** MUST

命题 P 因同时存在支持证据与质疑证据而处于 `contested`（存争议）状态。

普通维护流程尝试清理其中的质疑证据。

预期系统执行保守拒绝，或要求走显式授权且受严格审计的物理清除通道。

常规的日常删除操作绝不能在未来静默增强该命题的投影信念。

---

## KIP2-X-013 — 概念合并与历史信念评估 (Merge plus historical belief)

**要求级别 (Level):** MUST

断言引用别名概念 A。

执行 A→B 的概念合并。

新创建的断言引用规范概念 B。

预期执行结果：

```text
old raw refs remain A
current canonical semantic resolution uses B
all Assertions/provenance remain historical
```

---

## KIP2-X-014 — 外部世界行为的事务边界 (External action boundary)

**要求级别 (Level):** MUST

事务 1 记录行动意图（ActionIntent）。

测试框架触发外部世界行为。

随后事务 2 记录外部执行结果的证据与活动（Outcome Evidence/Activity）。

预期执行结果：

```text
two KIP commit boundaries
external world effect is not rollback-coupled to either KIP transaction
```

---

## KIP2-X-015 — 调用主体、行动主体与系统来源端到端区分 (Principal/actor/origin end-to-end)

**要求级别 (Level):** MUST

记录员主体（recorder）处理并写入来自 Alice 的消息。

预期执行结果：

```text
Evidence source semantics = Alice/message
Assertion.asserted_by = Alice
_system.origin.principal_id = recorder
no representation authority inferred
```

---
# 27. 必需不变式覆盖矩阵 (Required Invariant Coverage Matrix)

规范主文档定义了 35 条跨模块的核心必需一致性不变式（Required Conformance Invariants）。

| 不变式 (Invariant) | 必需测试向量 (Required vectors) |
|---|---|
| 1. 命题存在性具有价值中立性 (Proposition existence truth-neutral) | CORE-001, KML-004, EPI-001 |
| 2. 断言置信度不等于大脑信念 (Assertion confidence != Brain belief) | CORE-006, EPI-007 |
| 3. 搜索相关性不等于置信度 (Search relevance != confidence) | EPI-008, META-008, X-003 |
| 4. 缺乏可见匹配不等于事实否定 (Missing visible match != falsehood) | EPI-025, KQL-009, KQL-013 |
| 5. 证据不足不同于明确拒绝 (insufficient != rejected) | EPI-001, EPI-025 |
| 6. 矛盾断言在系统中合法共存 (Contradictory Assertions coexist) | EPI-005, X-002 |
| 7. 命题元组不可变 (Proposition tuple immutable) | CORE-002 |
| 8. 断言历史采用仅追加演变 (Assertion history append-oriented) | CORE-007, CORE-008, KML-017 |
| 9. 证据纠错必须保留原始证据 (Evidence correction preserves original) | CORE-009, CORE-010 |
| 10. 派生认知不得自我印证放大置信度 (Derived cognition does not multiply corroboration) | EPI-015, EPI-018 |
| 11. 认知溯源不赋予写入权限 (Provenance does not grant authority) | GOV-006, GOV-020 |
| 12. 调用主体不等于语义行动主体 (Principal != semantic actor) | GOV-002, GOV-003, X-015 |
| 13. 认知图谱内容无法自我授权 (Cognitive content cannot self-grant authority) | GOV-005, GOV-018 |
| 14. 当前治理策略控制历史数据的可见性 (Current Governance controls historical visibility) | GOV-014, HIST-006 |
| 15. 记忆强度不等于置信度 (Memory strength != confidence) | CORE-018, X-011 |
| 16. 只读访问不会强化记忆 (Read does not reinforce memory) | EPI-009, EPI-022 |
| 17. 合并操作完整保留原始历史端点 (Merge preserves raw historical identity) | CORE-020, CORE-021, HIST-008 |
| 18. 源空间的自身实体不会自动映射为目标空间的自身实体 (Source self does not auto-map to destination self) | CAP-009 |
| 19. 胶囊数字签名不蕴含认知真实性与信任 (Capsule signature does not imply truth/trust) | CAP-005 |
| 20. 胶囊导入不继承源空间的执行权限 (Capsule import does not inherit source authority) | CAP-012, CAP-013 |
| 21. 嵌入式 Schema 绝不自动激活 (Embedded Schema does not auto-activate) | SCHEMA-011, CAP-011 |
| 22. 批处理不等于事务（除非声明原子模式） (Batch != transaction unless atomic) | TX-023, TX-025, RT-008 |
| 23. 请求 ID、幂等键与事务 ID 严格相互独立 (request_id != idempotency_key != tx_id) | TX-014, TX-015, RT-014, RT-015 |
| 24. 网络超时不证明事务已被中止 (Timeout does not prove abort) | TX-016, TX-019, RT-023 |
| 25. 进度通知不证明数据已持久化提交 (Progress does not prove commit) | RT-024, RT-025 |
| 26. 预览操作不产生资源预留或持久化提交 (Preview does not reserve/commit) | META-015, CAP-018 |
| 27. 权限撤销强制覆盖陈旧的游标、快照与委托 (Revocation overrides stale cursor/snapshot/delegation) | GOV-015, GOV-016, GOV-017 |
| 28. 游标是不透明且不可混用的 (Cursors are opaque/non-interchangeable) | KQL-017, KQL-018, RT-016, RT-030 |
| 29. 外部 URL 绝不自动发起网络抓取 (External URLs not auto-fetched) | CAP-020, RT-027 |
| 30. 外部世界物理行为超出 KIP 内部回滚边界 (External actions outside KIP rollback) | X-014 |
| 31. ASSERT 语法糖精确提交脱糖后的实体 (ASSERT commits exactly its desugaring) | KML-031 |
| 32. 物化投影必须显式披露策略与快照基准 (Materialized projection discloses policy + snapshot basis) | EPI-027 |
| 33. 摄取的证据必须在字节级别如实保真传输载荷 (Ingested Evidence preserves transport payload) | RT-031 |
| 34. 载荷清除保留证据记录本身 (Payload purge preserves the Evidence record) | KML-034 |
| 35. 修订溯源根不会自动撤回派生认知 (Revising a root does not auto-retract derived cognition) | EPI-028, META-025 |

---

# 28. 核心错误注册表覆盖矩阵 (Core Error Registry Coverage)

完整的一致性测试运行器应当覆盖已声明 Profile 中所有可触发的错误码（规范 §87）。

| 错误码 (Error) | 标准测试向量 (Canonical vector) |
|---|---|
| InvalidSyntax | 格式畸形的 KQL/KML 语法测试向量 |
| InvalidIdentifier | 词法非法的标识符测试向量 |
| InvalidRequestEnvelope | RT-008 / 畸形的请求信封 |
| UnsupportedProtocolVersion | 协议版本协商测试向量 |
| UnsupportedCapability | RT-020 |
| UnsupportedIsolation | RT-019 |
| LanguageMismatch | RT-007 |
| ReadonlyViolation | META-024 / RT-007 |
| DuplicateLocalHandle | KML-009 |
| DuplicateMutationTarget | KML-010 |
| SchemaSymbolNotFound | 未知 Schema 符号测试向量 |
| SchemaSymbolAmbiguous | SCHEMA-003 |
| SchemaFieldNotFound | SCHEMA-008 |
| SchemaPackageUnavailable | 缺失依赖包的认知胶囊测试向量 |
| SchemaEnvironmentChanged | SCHEMA-014 |
| HistoricalSchemaUnavailable | 历史保留期外的负面测试向量 |
| TypeMismatch | SCHEMA-005/006 |
| ConstraintViolation | SCHEMA-007 |
| NotFoundOrNotVisible | GOV-007 |
| ReferenceError | 引用缺失的变更测试向量 |
| StructuralReferenceInvalid | SCHEMA-007 |
| IdentitySelectorRequired | KML-003 |
| NameIdentityForbidden | KML-003 |
| IdentityConflict | CAP-007 身份冲突变体 |
| ClientKeyConflict | CORE-013 |
| IdentityMergeConflict | 合并冲突测试向量 |
| ImmutableField | CORE-002 |
| EpistemicRevisionRequired | CORE-007 / KML-015 |
| EvidenceCorrectionRequired | CORE-009 / KML-016 |
| InvalidLifecycleTransition | 生命周期非法迁移的负面测试向量 |
| RetractionNotAuthorized | GOV-019 / KML-021 |
| SupersessionMismatch | KML-019 |
| EvidenceCorrectionConflict | 纠错谱系冲突的负面测试向量 |
| ActivityTerminal | CORE-015 |
| ProjectionTargetUnbound | KQL-020 |
| ProjectionTargetUnbounded | KQL-020 |
| ProjectionNotAuthorized | GOV-009 |
| ProjectionPolicyUnavailable | 缺失投影策略测试向量 |
| Unauthenticated | 未认证的受保护请求 |
| NotAuthorized | GOV-001 |
| RequiresApproval | 需审批门控的测试固件 |
| RequiresStrongerAuthentication | 需二次强认证的测试固件 |
| ActorBindingRequired | GOV-002 |
| ProtectedSystemField | GOV-024 / KML-013 |
| ProtectedGovernanceField | KML-014 |
| ProtectedSchemaState | SCHEMA-010 |
| LegalHoldConflict | KML-027 |
| PurgeDenied | KML-028 |
| VersionConflict | TX-009 |
| PreconditionFailed | 前置条件过期测试向量 |
| SerializationConflict | TX-010 |
| IdempotencyConflict | TX-013 |
| TransactionUnknown | META-018 |
| OutcomeUnknown | TX-019 |
| TransactionTooLarge | 超出配置上限测试向量 |
| HistoricalSnapshotUnavailable | HIST-009 |
| CursorMismatch | KQL-017 |
| CursorTypeMismatch | KQL-018 / RT-030 |
| CursorExpired | 游标 TTL 过期测试向量 |
| CursorInvalidated | 治理/Schema 变更导致游标失效的测试向量 |
| ChangeCursorExpired | META-022 |
| ChangeCursorInvalid | 畸形变更游标测试向量 |
| SearchModeUnsupported | 不支持的搜索模式测试向量 |
| SearchIndexUnavailable | 搜索服务中断测试向量 |
| HistoricalSearchUnavailable | 历史搜索能力测试向量 |
| ArtifactUnavailable | RT-029 |
| ArtifactTooLarge | 超大工件限制测试向量 |
| ArtifactParseError | 畸形认知胶囊测试向量 |
| DigestMismatch | CAP-004 / RT-028 |
| ProofInvalid | HA-003 |
| SignerUnknown | 未知签名者测试向量 |
| BlobUnavailable | 外部二进制大对象缺失测试向量 |
| CapsuleValidationFailed | CAP-016 |
| ImportPreviewConflict | CAP-017 |
| ResourceExhausted | 资源配额耗尽测试向量 |
| ResultLimitExceeded | 结果超限测试向量 |
| ExecutionTimeout | 确定性读取超时测试向量 |
| RateLimited | 限流测试固件 |
| InternalError | 出现时校验响应格式；不作为预期的成功测试用例 |

测试用例应当精确隔离出单一主导的失败条件。当测试某个具体错误码时，测试向量不应当同时触发未授权与 Schema 非法等多重错误。

---

# 29. 状态比对规则 (State Comparison Rules)

本地内部 ID 属于实现定义（implementation-defined）的范畴。

测试比对应针对语义结构（semantic structure）进行判定：

```text
存在一个 Assertion
其 Proposition 元组为 (Alice, timezone, "+01:00")
其 asserted_by 为 Alice
其 lifecycle 生命周期为 active
```

严禁直接进行物理 ID 的字面值比对：

```text
assertion.id == "A-123"
```

除非该 ID 是在此前由该同一实现返回的，且引用的稳定性本身就是该测试用例所要验证的目标。

---

# 30. 时间戳规则 (Timestamp Rules)

在测试中应当优先采用：

```text
space_seq (空间事务序列号)
显式固件定义的时间 (explicit fixture times)
测试框架控制的虚拟时钟 (harness-controlled clock)
```

而非直接依赖精确的物理挂钟时间（wall-clock）比对。

对于引擎自主生成的时间戳，应当断言：

```text
字段存在 (present)
在规范要求处保持单调递增 (monotonic where required)
处于测试框架受控的时间区间内 (inside harness-controlled interval)
```

除非精确的确定性时间本身就是测试固件数据的一部分。

---

# 31. 搜索确定性规则 (Search Determinism Rules)

可移植的基准测试采用关键字搜索（keyword search）。

针对语义/混合搜索的测试应当断言：

```text
已授权候选记录的准确包含与未授权记录的排除 (authorized candidate inclusion/exclusion)
不存在保密排序信息的泄露 (no secret ranking leakage)
明确声明评分语义 (score semantics declared)
明确声明索引新鲜度 (index freshness declared)
```

并且不应当要求不同实现在浮点数相关性得分上完全一致，除非被测实现显式声明支持某种标准参考排序 Profile。

---

# 32. 认识确定性规则 (Epistemic Determinism Rules)

可移植的认识论测试必须使用规范定义的标准确定性测试投影策略（canonical deterministic test Projection Policy），或完全等价的策略规则。

一致性测试套件重点验证：

```text
状态机运转机制 (status machinery)
材料合格性判定 (eligibility)
冲突处理逻辑 (conflict handling)
开放世界语义 (open-world semantics)
来源溯源独立性 (provenance independence)
策略身份标识 (policy identity)
```

而非特定厂商偏好的主观信任权重算法。

---

# 33. 事务确定性规则 (Transaction Determinism Rules)

并发测试向量必须使用显式的同步屏障（explicit barriers）。

示例流程：

```text
事务 T1 在序列号 S100 处启动
事务 T1 读取实体 X
在进入提交校验前暂停 T1

事务 T2 修改实体 X
事务 T2 提交并生成 S101

恢复事务 T1 继续执行
```

预期的执行行为完全根据请求声明的事务隔离级别与前置条件进行推导。

---

# 34. 故障注入规则 (Fault Injection Rules)

测试框架必须准确掌握故障注入发生的精确时机：

```text
确定在提交发生之前 (definitely before commit)
确定在提交完成之后 (definitely after commit)
处于提交/响应竞态之中，此时客户端未知最终结果 (outcome unknown to client)
```

测试用例严禁仅凭客户端发生网络超时就草率推断服务端事务必定已中止。否则将直接破坏被测不变式本身的有效性。

---

# 35. Profile 通过规则 (Profile Pass Rules)

声明支持某项 Profile 的实现仅在满足以下条件时判定为通过：

```text
所有适用的 MUST 级别测试向量均判定为 PASS
```

SHOULD 级别用例的失败将产生一致性警告（conformance warning），除非被测实现声明了更高要求的 Profile 使其转为强制必测项。

针对 OPTIONAL（可选）测试用例：

```text
若运行时声明支持该特性
    → 必须强制执行且判定为 PASS

若运行时未声明支持该特性
    → 允许返回 SKIP_UNSUPPORTED
```

---

# 36. 跨 Profile 组合规则 (Cross-Profile Rule)

若某个实现声明支持多个 Profile，则必须强制执行并全量通过所有适用的跨模块测试向量。

仅通过孤立的单元级测试套件是不足以证明一致性的。

示例场景：

```text
Epistemic + Governance + Historical
    → 必须通过历史投影的权限校验测试

KML + Transactions + Runtime
    → 必须通过幂等重试与响应丢失测试

Capsule + Schema + Governance
    → 必须通过嵌入式 Schema 隔离与权限不放大测试
```

---

# 37. 无副作用验证规则 (No-Effect Verification)

当测试用例预期结果为无副作用（`no_effect`）时，应当在可观测的范围内验证：

```text
未分配新的认知空间序列号 (no new cognitive space_seq)
目标实体的版本号保持不变 (target version unchanged)
目标实体的 updated_at 时间戳保持不变 (target updated_at unchanged)
系统未发出任何认知变更包 (no cognitive Change Envelope)
```

底层的运维审计日志记录不属于此项断言的检查范畴。

---

# 38. 只读操作验证规则 (Readonly Verification)

任何语义上属于只读的测试用例均应当在操作前后分别抓取快照：

```text
space_seq 事务序列号
相关实体版本号
相关记忆强度 (memory_strength) 与置信度 (confidence)
```

通过前后比对检测是否存在读操作引发意外状态变更的漏洞。

---

# 39. 历史保留验证规则 (History Preservation Verification)

针对修正、纠错或合并等操作的测试用例，必须同时查询验证：

```text
当前的规范视图 (current canonical view)
历史/底层的原始视图 (historical/raw view)
```

如果某个实现仅能给出正确的当前答案，但其实现手段是通过改写或抹除历史记录达成的，则判定为**测试失败**。

---

# 40. 权限保留验证规则 (Authority Preservation Verification)

针对数据导入、派生认知或技能生成的测试用例，必须严格验证：

```text
认知内容数据可以正常呈现
但是
在未经显式、独立的治理层授权状态转移前，系统执行权限绝不发生任何提升
```

---

# 41. 推荐代码仓库布局 (Recommended Repository Layout)

```text
conformance/
  README.md

  schemas/
    test-core-domain-1.0.0.schema.json
    test-secondary-1.0.0.schema.json
    cognitive-memory-2.0.0.schema.json

  fixtures/
    empty.json
    core-basic.json
    epistemic-basic.json
    epistemic-conflict.json
    governance-basic.json
    transaction-basic.json
    historical-basic.json

  policies/
    epistemic-test-deterministic.json
    governance-test-policy.json

  capsules/
    valid-snapshot.json
    bad-digest.json
    signed-untrusted.json
    identity-conflict.json
    embedded-schema.json
    skill-executable-claim.json

  vectors/
    core/
    schema/
    epistemic/
    governance/
    transactions/
    capsule/
    kql/
    kml/
    meta/
    runtime/
    historical/
    high-assurance/
    migration/
    cross-module/

  runner-schema/
    conformance-test-vector.schema.json
    conformance-report.schema.json
```

---

# 42. 测试运行器报告结构 (Runner Report Shape)

```json
{
  "implementation": {
    "name": "...",
    "version": "...",
    "kip_version": "2.0-draft"
  },

  "profiles_claimed": [],

  "summary": {
    "pass": 0,
    "fail": 0,
    "skip_unsupported": 0,
    "not_applicable": 0,
    "harness_error": 0
  },

  "profiles": {
    "KIP-Core": {
      "status": "PASS",
      "required_tests": 0,
      "passed": 0
    }
  },

  "tests": [
    {
      "id": "KIP2-CORE-001",
      "status": "PASS",
      "duration_ms": 3,
      "observed": {},
      "warnings": []
    }
  ]
}
```

---

# 43. 机器可读交付物清单 (Machine-Readable Deliverables)

随本规范版本一同发布的工件：

```text
1. kip-request.schema.json                   v2/schemas/
2. kip-response.schema.json                  v2/schemas/
3. conformance-test-vector.schema.json       v2/conformance/
4. conformance-report.schema.json            v2/conformance/
5. KQL formal EBNF                           v2/grammar/KIP-2.0-KQL.ebnf
6. KML formal EBNF                           v2/grammar/KIP-2.0-KML.ebnf
7. META formal EBNF                          v2/grammar/KIP-2.0-META.ebnf
8. canonical fixture Schema Packages         v2/conformance/fixtures/
9. canonical deterministic Epistemic Policy  v2/conformance/fixtures/
```

仍待交付的工件：

```text
10. canonical fixture state                  标准测试固件初始状态
11. golden Capsule artifacts                 标准黄金认知胶囊工件
12. reference conformance runner             标准参考一致性测试运行器
```

---

# 44. 互操作性验收准则 (Interoperability Acceptance Criterion)

两个相互独立的认知中枢实现，当且仅当能够达成以下目标时，判定为具备 KIP 互操作性：

```text
能够加载语义等价的标准测试固件
能够执行完全相同的必需测试向量
产生等价的协议层报文分类与状态响应
产生等价的持久化语义后置条件
严格保持相同的认识论与治理安全边界
在相同的重试与并发场景下稳健运行
能够相互交换标准的认知胶囊 (Cognitive Capsules)
```

且无需共享以下任何内部实现细节：

```text
数据库底层代码
物理存储格式
内部本地 ID 分配算法
查询规划器实现
向量嵌入模型
内部事务引擎实现机制
```

---

# 45. 最终一致性检验原则 (Final Conformance Principle)

KIP 一致性测试的根本目的，并非证明某个实现与某个参考实现长得一模一样；

而是证明该实现在各种极端与严苛场景下，依然能够坚守 KIP 的认知核心边界与原则：

```text
主观陈述 ≠ 客观信念 (statement ≠ belief)
认知信念 ≠ 行为权限 (belief ≠ authority)
断言置信度 ≠ 主体信任度 (confidence ≠ trust)
认知信任 ≠ 操作授权 (trust ≠ permission)
检索相关性 ≠ 客观事实 (retrieval ≠ truth)
信念修正 ≠ 篡改历史 (revision ≠ historical rewrite)
证据纠错 ≠ 物理删除 (correction ≠ deletion)
身份合并 ≠ 抹除身份 (merge ≠ identity erasure)
变更预览 ≠ 持久提交 (preview ≠ commit)
顺序批处理 ≠ 原子事务 (batch ≠ transaction)
网络超时 ≠ 事务中止 (timeout ≠ abort)
幂等重试 ≠ 重复经历 (retry ≠ repeated experience)
工件传输 ≠ 认知导入 (artifact transport ≠ cognitive import)
签名可信 ≠ 认知被接受 (signed origin ≠ trusted cognition)
```

指导一切测试用例的最高裁决准则是：

> **一个 KIP 2.0 实现只有在协议边界上彻底拒绝所有伪造认知历史、凭空放大信念、越权泄露权限或重复记录学习经历的投机捷径时，才被认定为完全符合规范。**
