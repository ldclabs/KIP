# KIP 2.0 认知变更语言设计 (KML)

**[English](./KIP-2.0-KML.md) | [中文](./KIP-2.0-KML_CN.md)**

## 规范状态 (Status)

**变更语言提案 / 规范预草案 (Mutation Language Proposal / Pre-Specification Draft)**

本文档定义了 KIP 2.0 的变更/写入语义：智能体（Agent）如何记录新的认知状态、创建真值中立的命题（Propositions）、记录断言（Assertions）与证据（Evidence）、通过活动（Activities）保留溯源信息、在不重写历史的前提下修正信念、更新可变的记忆/配置文件状态、管理生命周期状态转换、合并身份标识，并在事务（Transactions）内安全地表达复合认知变更。

本文档直接建立在以下规范基础之上：

- [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)
- [KIP-2.0-Transactions.md](KIP-2.0-Transactions.md)
- [KIP-2.0-Capsule.md](KIP-2.0-Capsule.md)
- [KIP-2.0-KQL.md](KIP-2.0-KQL.md)

KIP 1.x 将 KML 定义为知识演化的专用语言，核心围绕以下原语构建：

```text
UPSERT
UPDATE
DELETE
MERGE
EXPECT VERSION
```

这些原语蕴含了若干极具价值的核心思想：

```text
declarative mutation (声明式变更)
model-friendly syntax (模型友好语法)
local handles (局部句柄)
idempotent writes (幂等写入)
optimistic concurrency (乐观并发控制)
bulk metabolism (批量代谢)
atomic merge (原子合并)
```

KIP 2.0 完整保留了这些思想，但底层数据模型发生了根本性变革。

在 KIP 1.x 中，一个 Proposition 链路可能同时表现为：

```text
semantic relation (语义关系)
fact (事实)
assertion (断言)
confidence carrier (置信度载体)
source carrier (来源载体)
lifecycle record (生命周期记录)
```

KIP 2.0 严格分离了这些语义：

```text
Proposition (命题)
    = 真值中立的语义陈述

Assertion (断言)
    = 具有历史归属特征的认识论承诺

Evidence (证据)
    = 被断言所引用的持久化认知产物

Activity (活动)
    = 溯源过程

Facet (切面)
    = 配置文件特有的认知/记忆状态

Governance (治理)
    = 受保护的权限/安全控制状态

Transaction (事务)
    = 单个不可分割的持久化认知状态转换
```

因此，KML 2.0 必须随之进化。

其核心主张是：

> **认知变更语言应当使添加新的认知变得极为自然，并从机制设计上有意使重写过去变得极其困难。**

最核心的语义区别在于：

```text
State Edit (状态编辑)
    ≠
Cognitive Claim Revision (认知主张修正)
```

变更：

```text
Experience.memory_strength (经验记忆强度)
Skill.validation_count (技能验证次数)
Concept.display_name (概念展示名称)
```

可以属于普通的状态编辑。

但将：

```text
"Alice 的时区是 +08:00"
```

修改为：

```text
"Alice 的时区是 +01:00"
```

绝**不是**对旧事实的 UPDATE 操作。

它是一个全新的认知事件：

```text
新的 Evidence (证据)
+
新的 Proposition (命题，如需要)
+
新的 Assertion (断言)
+
对旧断言可能进行的废弃替代 (supersession)
+
记录溯源的 Activity (活动)
```

语言必须在构造机制上严格捍卫这一分离。

---
# 0. 规范性用词定义 (Normative Language)

关键字 **MUST**（必须）、**MUST NOT**（严禁）、**REQUIRED**（必需）、**SHOULD**（应当）、**SHOULD NOT**（不应）、**MAY**（可以）和 **OPTIONAL**（可选）用于指示 KIP 2.0 规范 (`../KIP-2.0-SPECIFICATION.md`) 的要求；两者不一致时以该规范为准。

此处展示的语法属于架构层面的提案。

未来的正式语法规范可以在保留变更语义与安全不变式的前提下精化标点符号。

---
# 1. KML 2.0 设计目标 (KML 2.0 Design Goals)

KML 2.0 应当 (SHOULD) 具备以下特性：

```text
Model-First (模型优先)
declarative (声明式)
append-friendly (追加友好)
history-preserving (保留历史)
schema-aware (模式感知)
provenance-aware (溯源感知)
transaction-native (事务原生)
idempotency-safe (幂等安全)
governed (受治理约束)
LLM-readable (大模型易读)
implementation-independent (实现无关)
```

该语言应当使常见的智能体记忆写入操作保持紧凑精炼，同时不隐藏其认识论含义。

---
# 2. 非目标 (Non-Goals)

KML 不是：

```text
通用编程语言
数据库管理 Shell
治理策略语言
模式包语言
信任策略语言
任意迁移脚本运行时
外部工具执行语言
隐藏思维链记录器
事务语义的替代品
```

KML 表达的是认知变更的意图（mutation intent）。

事务运行时（Transaction Runtime）决定一个或多个意图何时以原子方式提交。

---
# 3. 变更平面划分 (Mutation Planes)

KIP 2.0 严格区分各个变更平面。

## 3.1 认知内容平面 (Cognitive Content)

示例：

```text
Concept (概念)
Proposition (命题)
Evidence (证据)
Activity (活动)
Experience (经验)
Skill (技能)
Profile Facets (配置文件切面)
```

---

## 3.2 认识状态平面 (Epistemic State)

示例：

```text
断言创建 (Assertion creation)
断言撤回 (Assertion retraction)
断言替代 (Assertion supersession)
证据纠错谱系 (Evidence correction lineage)
```

---

## 3.3 记忆 / 配置文件状态平面 (Mnemonic / Profile State)

示例：

```text
memory_strength (记忆强度)
salience (显著性)
utility (效用值)
review state (复习状态)
consolidation state (巩固状态)
```

---

## 3.4 留存 / 生命周期平面 (Retention / Lifecycle)

示例：

```text
archive (归档)
tombstone (设置墓碑)
purge (物理清理)
expiry scheduling (过期调度)
```

---

## 3.5 受保护控制平面 (Protected Control State)

示例：

```text
Governance classification (治理密级分类)
Grant (授权)
Delegation (委托)
Policy (策略)
Trust Resolver (信任解析器)
Schema Environment (模式环境)
authority elevation (权限提升)
ActorBinding (行动主体绑定)
canonical identity binding (规范身份绑定)
```

普通的 KML 严禁 (MUST NOT) 变更该平面。

受保护的控制平面操作可以共享底层相同的事务运行时，但它们必须使用专用的治理/模式操作，而非普通认知变更语法。

---
# 4. 核心变更方程 (Core Mutation Equation)

KML 变更产生：

```text
提议的认知增量 (proposed cognitive delta)
```

事务将该增量转化为：

```text
authorized (经过授权的)
validated (经过校验的)
atomic (原子性的)
historically ordered (历史有序的)
durable state (持久化状态)
```

因此：

```text
KML
    =
    Mutation Intent (变更意图)

Transaction (事务)
    =
    Durable State-Transition Boundary (持久化状态转换边界)
```

---
# 5. KML 命令 vs. 事务 (KML Command vs. Transaction)

一条独立的改变状态的 KML 语句在单个隐式事务中执行。

示例：

```prolog
UPDATE ?exp
SET FACET "MnemonicState" {
  memory_strength: 0.8
}
WHERE {
  ?exp {id: :experience_id}
}
```

构成单个原子的状态转换。

---
# 6. 多条命令并不自动构成原子操作 (Multiple Commands Are Not Automatically Atomic)

传输层请求中的：

```text
commands[]
```

并不会仅仅因为命令被一同发送就自动成为事务。

如果以下操作：

```text
证据创建
断言创建
废弃替代
活动创建
```

必须作为一个整体共同成功，必须使用：

```text
单个 MUTATE 块
```

或者：

```text
显式的多命令事务 (explicit multi-command Transaction)
```

---
# 7. 原生 KML 语句族 (The Native KML Statement Families)

推荐的 KML 2.0 语句族包括：

```text
MUTATE

CREATE CONCEPT
UPSERT CONCEPT

ENSURE PROPOSITION

CREATE EVIDENCE
CREATE ASSERTION
CREATE ACTIVITY

UPDATE

RETRACT ASSERTION
SUPERSEDE ASSERTION
CORRECT EVIDENCE
TRANSITION ACTIVITY

SET RETENTION
ARCHIVE
TOMBSTONE
PURGE

MERGE CONCEPT
```

诸如 `ASSERT` 等易用性语法糖可编译为这些底层原语。

---
# 8. 为什么 KML 2.0 使用不同的创建动词 (Why KML 2.0 Uses Different Creation Verbs)

并非所有核心元素都具有相同的标识/生命周期语义。

```text
Concept (概念)
    可能是长期存在的且可变的

Proposition (命题)
    结构上具有规范唯一性且不可变

Evidence (证据)
    历史上独立的产物记录

Assertion (断言)
    历史上独立的认识论事件

Activity (活动)
    历史上独立的溯源过程
```

单一通用的 `UPSERT EVERYTHING` 会彻底抹杀这些本质区别。

---
# 9. 状态变更类别 (State Mutation Classes)

KML 在内部区分以下操作：

```text
create (创建)
ensure (确保规范存在)
upsert (更新或插入)
update (更新)
transition (状态转换)
merge (合并)
archive (归档)
tombstone (设置墓碑)
purge (物理清理)
```

每种类别具有不同的幂等性与历史记录规则。

---
# 10. `CREATE` 创建原语 (`CREATE`)

语义：

> 创建一个历史上独立的元素，除非显式的持久化 `client_key` 证明这属于同一次逻辑创建的重试。

适用于：

```text
Evidence (证据)
Assertion (断言)
Activity (活动)
事件型 / 配置文件 Concept (概念)
```

---
# 11. `ENSURE` 确保原语 (`ENSURE`)

语义：

> 解析或创建由语义结构唯一定位的规范元素。

主要用于：

```text
Proposition (命题)
```

因为一个空间针对单个语义元组维护唯一的规范命题。

---
# 12. `UPSERT` 更新插入原语 (`UPSERT`)

语义：

> 解析单个承载稳定身份的可变概念（Concept），并应用请求的可变状态。

用于：

```text
Person (人员)
Project (项目)
Organization (组织)
持久化的 Skill 身份
稳定的配置文件 / 配置 Concept
```

在模式与策略允许的范围内使用。

---
# 13. `UPDATE` 更新原语 (`UPDATE`)

语义：

> 变更由模式选定的已存在元素中允许变更的字段。

它绝不创建新的语义历史。

---
# 14. `TRANSITION` 状态转换原语 (`TRANSITION`)

语义：

> 通过显式有效的状态机推进生命周期状态。

示例：

```text
Assertion active → retracted
Assertion active → superseded
Activity running → completed
```

---
# 15. `MERGE` 合并原语 (`MERGE`)

语义：

> 合并身份解析，而无需重写底层的原始历史引用。

---
# 16. `TOMBSTONE` 墓碑原语 (`TOMBSTONE`)

语义：

> 在逻辑上将元素从日常活跃使用中移除，同时保留最小化的身份/引用历史。

---
# 17. `PURGE` 物理清理原语 (`PURGE`)

语义：

> 在显式的高影响治理权限与引用感知策略约束下，物理删除字节数据。

---
# 18. `MUTATE` 复合语句 (The `MUTATE` Compound Statement)

KIP 2.0 引入了原生的复合变更容器：

```prolog
MUTATE {
  ...
}
```

一个 `MUTATE` 块代表一份连贯的变更执行计划，并作为单个隐式事务原子执行。

---
# 19. 为什么是 `MUTATE` 而非 `UPSERT` 作为复合容器 (Why `MUTATE`, Not `UPSERT`, Is the Compound Container)

一个复合认知转换可能包含：

```text
创建证据 (create Evidence)
确保命题 (ensure Proposition)
创建断言 (create Assertion)
废弃替代旧断言 (supersede old Assertion)
创建活动 (create Activity)
```

若将整个操作命名为 `UPSERT`，将暗示所有元素均为可变身份槽位。

然而事实并非如此。

`MUTATE` 能够更精准地描述这种事务中立的意图。

---
# 20. `MUTATE` 示例说明 (Illustrative `MUTATE`)

```prolog
MUTATE {
  CREATE EVIDENCE ?e {
    CLIENT KEY :evidence_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: {
        mode: "inline",
        inline: {
          text: "My timezone is now +01:00."
        }
      },
      observed_at: :observed_at
    }
  }

  ENSURE PROPOSITION ?p (
    :alice_id,
    "timezone",
    "+01:00"
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice_id,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :observed_at
    }

    SET STRUCTURAL {
      ("evidence", ?e) {role: "support"}
    }
  }

  SUPERSEDE ASSERTION :old_assertion_id BY ?a

  CREATE ACTIVITY ?activity {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "belief_revision",
      started_at: :observed_at,
      ended_at: :observed_at,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :old_assertion_id)
      ("inputs", ?e)
      ("outputs", ?a)
    }
  }
}
```

整个状态转换要么完整提交，要么完全不对外可见。

---
# 21. 变更块是声明式的而非顺序式的 (Mutation Block Is Declarative, Not Sequential)

KIP 1.x 的 `UPSERT` 按顺序执行局部块，并要求“先定义后使用”。

KIP 2.0 针对 `MUTATE` 应当 (SHOULD) 改变这一点。

在单个 `MUTATE` 块中声明的所有局部句柄，在提交前都会被解析为一张统一的声明式变更图。

因此：

```text
允许使用前向局部引用 (forward local references)。
```

---
# 22. 为什么需要前向引用 (Why Forward References Are Needed)

核心溯源自然可能包含以下结构：

```text
Evidence.generated_by → Activity
Activity.outputs       → Evidence
```

这属于合法的结构环路。

严格的“先定义后使用” DAG 将迫使采用：

```text
创建其中一个
提交
更新另一个
```

从而破坏原子化的溯源构建。

---
# 23. 两阶段变更规划 (Two-Phase Mutation Planning)

在概念上分为：

```text
Phase 1:
    解析所有子句
    分配 / 解析局部句柄
    解析精确模式符号
    规范化命题 (canonicalize Propositions)

Phase 2:
    构建最终变更图
    验证引用 / 环路 / 基数约束
    校验可变性权限
    执行治理授权
    原子提交
```

局部句柄的部分状态绝不会对外部分暴露。

---
# 24. 子句顺序不包含变更语义 (Clause Order Has No Mutation Semantics)

在原生 `MUTATE` 块内部：

```text
源代码编写顺序仅用于提升可读性
```

而**不是**：

```text
命令式的执行先后顺序。
```

引擎可以对规划操作进行安全重排序。

---
# 25. 重复局部句柄错误 (Duplicate Local Handle)

在单个 `MUTATE` 块中，一个句柄必须且只能声明一次。

非法示例：

```prolog
CREATE EVIDENCE ?x {...}
CREATE ASSERTION ?x {...}
```

预期报错：

```text
DuplicateLocalHandle
```

---
# 26. 局部句柄作用域 (Local Handle Scope)

局部句柄：

```text
?e
?p
?a
```

仅存在于单条 `MUTATE` 语句内部。

它不是持久化 ID。

返回结果会将其映射到实际生成的本地元素 ID。

---
# 27. 局部句柄不是 KQL 查询变量 (Local Handles Are Not KQL Variables)

两者出于面向模型的一致性均使用：

```text
?name
```

但它们的语义截然不同：

```text
KQL ?x
    查询解变量 (query solution variable)

KML MUTATE ?x
    局部变更句柄 (local mutation handle)
```

语句上下文使得其含义绝无歧义。

---
# 28. 每个已有目标单一最终变更 (Single Final Mutation Per Existing Target)

在单个 `MUTATE` 内部，一个已存在的可变元素应当 (SHOULD) 拥有唯一的声明式最终变更规范。

依赖代码书写顺序的冲突子子句应当失败并报错：

```text
DuplicateMutationTarget
```

而不是采用隐式的最后写入获胜（last-write-wins）规则。

---
# 29. 生命周期子句可引用新创建的句柄 (Lifecycle Clauses May Reference Created Handles)

允许写法：

```prolog
SUPERSEDE ASSERTION :old BY ?new
```

其中 `?new` 是在同一个块中创建的句柄。

---
# 30. 前置条件 (Preconditions)

对于可变的已存在元素，KML 2.0 保留了：

```prolog
EXPECT VERSION :v
```

---
# 31. `EXPECT VERSION` 版本预期 (`EXPECT VERSION`)

含义：

```text
仅当当前元素的 _system.version == 预期值时才允许提交
```

发生变更的元素在提交事务时版本号递增一次。

---
# 32. 仅创建防护 (Create-Only Guard)

当基于身份寻址的创建操作可能会解析到已存在的逻辑元素时：

```prolog
EXPECT VERSION 0
```

表示：

```text
该元素此前绝不能已经存在。
```

---
# 33. 状态防护 (State Guard)

生命周期操作应当 (SHOULD) 支持：

```prolog
EXPECT STATE "active"
```

或等效语法。

示例：

```prolog
RETRACT ASSERTION :assertion_id
EXPECT STATE "active"
```

这能够防止基于陈旧生命周期状态发生错误转换。

---
# 34. 事务级前置条件 (Transaction-Level Preconditions)

更广泛的防护条件，例如：

```text
空间序列号 (Space sequence)
模式环境版本 (Schema Environment version)
查询谓词防护 (query predicate guard)
治理绑定版本 (Governance binding version)
```

归属于事务外层信封。

KML 无需在语句内部重复定义每一种事务前置条件语法。

---
# 35. 原生身份标识规则 (Native Identity Rules)

KML 2.0 不再将：

```text
type + name
```

作为全局通用唯一标识。

---
# 36. `id` 本地唯一标识 (`id`)

不可变的本地：

```text
id
```

用于唯一定位已存在的元素。

客户端无法通过普通 KML 自行指定引擎的新 ID。

---
# 37. 概念键 `key` (Concept `key`)

稳定的空间本地概念键可以提供面向模型幂等性的身份标识。

示例：

```text
person:alice
project:kip
skill:deploy-database-migration
```

---
# 38. 客户端键 `client_key` (`client_key`)

历史上独立的非规范元素可以使用：

```text
client_key
```

作为持久化的逻辑创建身份标识。

示例：

```text
message:abc:assertion
tool-run:991:evidence
experience:conversation:20260813:42
activity:consolidation:run-9:item-12
```

---
# 39. `key` vs. `client_key` (`key` vs. `client_key`)

```text
Concept.key
    Concept 的稳定语义身份

client_key
    创建事件 / 产物的稳定客户端身份
```

它们解决的是不同的问题。

---
# 40. 事务幂等性 vs. 元素幂等性 (Transaction Idempotency vs. Element Idempotency)

```text
事务 idempotency_key
    保护整个事务的重放安全

client_key
    保护单个非规范元素的持久逻辑创建

Concept key
    唯一定位承载稳定身份的 Concept

Proposition tuple (命题元组)
    赋予结构化规范唯一身份
```

---
# 41. 重复发生绝不能被抹杀 (Repetition Must Not Be Erased)

如果 Alice 在周一和周二说了完全相同的一句话，这在潜在意义上是两次真实的认知事件。

切勿仅仅因为：

```text
相同的 Proposition
相同的 asserted_by
相同的 stance
相同的文本
```

就将其强行去重合并。

应利用源事件 / client-key 身份来区分：

```text
重试 (retry)
```

与：

```text
真实的重复发生 (genuine repetition)。
```

---
# 42. `CREATE CONCEPT` 创建概念 (`CREATE CONCEPT`)

对于历史上独立或新引入的 Concept：

```prolog
CREATE CONCEPT ?exp {
  TYPE "Experience"
  CLIENT KEY :experience_key

  NAME "Deployment failure 2026-08-13"

  SET ATTRIBUTES {
    goal: "Deploy release 2.1",
    outcome_status: "failure"
  }
}
```

---
# 43. `CREATE CONCEPT` 语义 (`CREATE CONCEPT` Semantics)

引擎执行：

```text
将 TYPE 解析为精确的 schema_ref
校验模式有效性
分配新的本地 ID
绑定 ?exp 句柄
```

如果指定了 `CLIENT KEY`：

```text
相同的 client_key + 相同的不可变创建身份
    → 返回已有结果 / 无额外副作用的重试

相同的 client_key + 冲突的不可变身份
    → 抛出 ClientKeyConflict 错误
```

---
# 44. 无 `CLIENT KEY` 的创建 (Create Without `CLIENT KEY`)

重复执行将创建新的逻辑实体，除非外部事务的幂等键证明其为同一次请求重放。

这对于以下元素是有意为之的：

```text
Events (事件)
Experiences (经验)
observations (观察)
```

---
# 45. 概念名称是可变的接地状态 (Concept Name Is Mutable Grounding State)

`NAME` 是展示/接地标签。

它不是 Concept 的全局通用唯一标识。

---
# 46. `CREATE CONCEPT` 可设置属性 (`CREATE CONCEPT` May Set Attributes)

仅允许设置模式中声明的创建字段。

如果某个属性代表需要追踪以下信息的认识论事实：

```text
source (来源)
confidence (置信度)
validity (有效性)
contradiction (矛盾)
history (历史)
```

模式/配置文件设计应当 (SHOULD) 将其建模为：

```text
Proposition + Assertion
```

而非可变属性。

---
# 47. `CREATE CONCEPT` 切面设置 (`CREATE CONCEPT` Facets)

配置文件可以允许：

```prolog
SET FACET "MnemonicState" {
  memory_strength: 0.7,
  salience: 0.9
}
```

切面语义由模式包定义。

---
# 48. `CREATE CONCEPT` 结构字段 (`CREATE CONCEPT` Structural Fields)

示例：

```prolog
SET STRUCTURAL {
  ("experienced_by", :self_id)
}
```

结构字段会依据模式定义进行严格校验。

---
# 49. `UPSERT CONCEPT` 更新或插入概念 (`UPSERT CONCEPT`)

承载长期稳定身份的 Concept 可以通过稳定的身份选择器安全地进行“创建或更新”。

推荐语法：

```prolog
UPSERT CONCEPT ?project {
  MATCH {
    type: "Project",
    key: "kip-2"
  }

  SET FIELDS {
    name: "KIP 2.0"
  }

  SET ATTRIBUTES {
    description: "KIP 2.0 protocol redesign"
  }
}
```

---
# 50. 原生 `UPSERT CONCEPT` 身份选择器 (Native `UPSERT CONCEPT` Identity Selector)

原生的 upsert 选择器必须 (MUST) 依据模式包含稳定的身份标识，例如：

```text
id
或
key
```

---
# 51. 原生 v2 严禁仅凭名称执行 Upsert (Name-Only Upsert Is Forbidden in Native v2)

非法写法：

```prolog
UPSERT CONCEPT ?alice {
  MATCH {
    type: "Person",
    name: "Alice"
  }
}
```

因为：

```text
相同的名称 (same name)
≠
相同的身份标识 (same identity)。
```

---
# 52. 兼容性例外情况 (Compatibility Exception)

对于历史上依赖名称作为身份标识的类型，`kip-1-compat` 配置规范可以将传统的：

```text
type + name
```

翻译为迁移后的：

```text
key
```

原生 v2 不会恢复通用的基于名称的身份机制。

---
# 53. 基于 `id` 的 Upsert (Upsert by `id`)

```prolog
UPSERT CONCEPT ?x {
  MATCH {id: :id}
  EXPECT VERSION :v

  SET ATTRIBUTES {...}
}
```

要求该 Concept 必须已经存在。

它绝不会创建调用者自定义的任意 ID。

---
# 54. 基于 `key` 的 Upsert (Upsert by `key`)

```prolog
MATCH {
  type: "Person",
  key: "alice"
}
```

在 Concept 不存在且模式/策略允许的前提下可以创建该 Concept。

引擎负责分配本地 ID。

---
# 55. `canonical_id` 不具备普通 Upsert 权威 (canonical_id Is Not Ordinary Upsert Authority)

导入的或调用者提供的：

```text
canonical_id
```

绝严禁通过普通 KML 强行进行身份合并。

受保护的规范身份绑定必须使用治理身份权限。

---
# 56. `SET FIELDS` 字段设置 (`SET FIELDS`)

对于可变性矩阵所允许的核心字段，KML 可以使用：

```prolog
SET FIELDS {
  name: "New display name"
}
```

---
# 57. 字段可变性由元素类别强制约束 (Field Mutability Is Enforced by Element Kind)

示例：

```text
Concept.name
    可变 (mutable)

Concept.schema_ref
    通常不可变 (normally immutable)

Concept.key
    不可变 (immutable)

Proposition tuple (命题元组)
    不可变 (immutable)

Assertion epistemic payload (断言认识论载荷)
    不可变 (immutable)

Evidence payload (证据载荷)
    不可变 (immutable)

已完成的 Activity 拓扑
    不可变 (immutable)

_system
    仅限引擎写入 (engine-only)

governance
    受保护控制平面 (protected control-plane)
```

---
# 58. `ENSURE PROPOSITION` 确保命题 (`ENSURE PROPOSITION`)

原生命题的创建是基于结构化的：

```prolog
ENSURE PROPOSITION ?p (
  :alice_id,
  "timezone",
  "+08:00"
)
```

---
# 59. ENSURE 的语义 (ENSURE Semantics)

引擎执行：

```text
将谓词别名解析为精确的 predicate_ref
规范化已合并端点的引用
规范化带类型的 Literal 字面量
校验谓词模式 (Predicate schema)
查找规范命题元组
若不存在则予以创建
返回规范命题 ID
```

---
# 60. 命题是真值中立的 (Proposition Is Truth-Neutral)

`ENSURE PROPOSITION` 不会创建断言。

在执行：

```prolog
ENSURE PROPOSITION ?p (
  :alice_id,
  "timezone",
  "+08:00"
)
```

之后，大脑仅拥有如下状态：

> 存在一个可被引用的语义陈述。

这并不意味着大脑或 Alice 已经采信了它。

---
# 61. 命题元组是不可变的 (Proposition Tuple Is Immutable)

原生 KML 中不存在：

```prolog
UPDATE PROPOSITION
SET object = "+01:00"
```

元组的变更将变为：

```text
另一个规范命题 (another canonical Proposition)。
```

---
# 62. 命题不包含原生认识论元数据 (Proposition Has No Native Epistemic Metadata)

原生命题 KML 严禁 (MUST NOT) 接收：

```text
confidence (置信度)
source (来源)
author (作者)
asserted_by (断言者)
observed_at (观察时间)
valid_from (有效起始)
valid_until (有效截止)
superseded (已被替代)
```

这些属于其他元素。

---
# 63. 命题的任意属性非原生特性 (Proposition Arbitrary Attributes Are Not Native)

切勿通过修改命题属性来编码 n 元关系限定词。

应使用：

```text
关系 / 事件 Concept
或
关于命题的命题
或
配置文件定义的结构
```

按照核心/模式规范进行建模。

---
# 64. 已合并端点的解析 (Merged Endpoint Resolution)

如果 Concept A 具有：

```text
merged_into = B
```

普通的全新：

```prolog
ENSURE PROPOSITION (... A ...)
```

会将端点规范化重定向至 B。

---
# 65. 历史原始端点创建 (Historical Raw Endpoint Creation)

有意针对历史已合并身份创建新命题的操作，应当严格限定在具有显式语义的以下模式中：

```text
migration (迁移)
import (导入)
audit reconstruction (审计重建)
```

普通智能体写入应当始终以规范身份为目标。

---
# 66. `CREATE EVIDENCE` 创建证据 (`CREATE EVIDENCE`)

证据是追加导向的（append-oriented）。

示例：

```prolog
CREATE EVIDENCE ?e {
  CLIENT KEY :evidence_key

  SET FIELDS {
    evidence_class: "tool_result",

    payload: {
      mode: "external",
      content_ref: :content_ref
    },

    content_digest: :digest,
    media_type: "application/json",
    observed_at: :observed_at
  }

  SET STRUCTURAL {
    ("source", :monitoring_service)
  }
}
```

---
# 67. 证据身份标识 (Evidence Identity)

证据绝不会仅仅因为：

```text
content_digest 相同
payload 字节完全一致
source 相同
```

就被去重合并。

对同一产物的两次观察可能是两次不同的证据事件。

---
# 68. 证据创建重试 (Evidence Retry)

使用：

```text
client_key
或
事务 idempotency_key
```

来对同一次逻辑证据创建的重试进行幂等去重。

---
# 69. 证据载荷是不可变的 (Evidence Payload Is Immutable)

根据核心模式规则，在创建之后，普通 KML 严禁 (MUST NOT) 修改：

```text
payload (载荷)
content_digest (内容摘要)
语义身份所依赖的 media_type
原始 observed_at
原始 source 观察身份
```

---
# 70. 错误证据应通过纠错而非重写处理 (Wrong Evidence Is Corrected, Not Rewritten)

如果证据 E1 存在错误：

```text
保留 E1
创建 E2
CORRECT EVIDENCE E1 BY E2
```

---
# 71. 证据来源是自述溯源信息 (Evidence Source Is Claimed Provenance)

作者写入的：

```text
source
```

不会自动成为可信的引擎起源信息。

引擎起源始终保留在受保护的：

```text
_system.origin
```

中。

---
# 72. 引擎观察的证据 (Engine-Observed Evidence)

如果证据直接来自于集成的可信运行时/工具，引擎/运行时可以附加更强信任级别的起源/证明状态。

普通 KML 内容无法通过自行声明：

```text
engine_observed
```

来获得权威效应。

---
# 73. 大体积证据处理 (Large Evidence)

KML 应当 (SHOULD) 允许：

```text
内容寻址的外部载荷 (content-addressed external payload)
```

而不是强行内联大体积字节数据。

创建外部引用不会自动拉取该内容。

---
# 74. `CREATE ASSERTION` 创建断言 (`CREATE ASSERTION`)

断言记录的是一次认识论事件。

示例：

```prolog
CREATE ASSERTION ?a {
  CLIENT KEY :assertion_key

  SET FIELDS {
    proposition: ?p,
    asserted_by: :alice_id,
    stance: "support",
    mode: "stated",
    confidence: 0.95,
    asserted_at: :time,

    valid_time: {
      from: :valid_from,
      until: null
    }
  }

  SET STRUCTURAL {
    ("evidence", ?e) {role: "support"}
  }
}
```

---
# 75. 断言创建是追加导向的 (Assertion Creation Is Append-Oriented)

实质上全新的认识论承诺将创建一个新的断言。

切勿将旧断言直接原地修改为新的信念。

---
# 76. 断言载荷的不可变性 (Assertion Immutable Payload)

在创建之后，普通 KML 严禁 (MUST NOT) 修改：

```text
proposition
asserted_by
stance
mode
confidence
asserted_at
valid_time
初始证据引用集合
```

除非未来的显式纠错规范定义了安全的例外迁移路径。

---
# 77. 置信度属于历史记录 (Confidence Is Historical)

如果：

```text
1 月份的置信度 = 0.6
3 月份因新证据到来置信度 = 0.9
```

应当创建：

```text
A1 置信度 = 0.6
A2 置信度 = 0.9
A2 废弃替代 A1
```

而不是：

```text
UPDATE A1 confidence 0.6 → 0.9
```

---
# 78. 默认情况下新证据不具有追溯附加性 (New Evidence Does Not Attach Retroactively by Default)

如果证据 E2 在后续时间到达，普通 KML 应当 (SHOULD) 创建：

```text
新的断言修订版本
或
派生断言
```

而不是将 E2 追溯添加到 A1 不可变的历史引用集合中。

---
# 79. 断言模式类别 (Assertion Mode)

核心模式类别包括：

```text
observed (观察到的)
stated (陈述声明的)
inferred (推断出的)
predicted (预测的)
hypothetical (假设性的)
imported (导入的)
```

KML 负责校验模式类别的语义有效性。

---
# 80. `mode = observed` 观察模式 (`mode = observed`)

通常应当具备：

```text
观察 / 工具 / 测量证据
```

并附带充分的溯源信息。

调用者不能仅仅通过选用字符串 `"observed"` 来获取更强的信任级别。

---
# 81. `mode = inferred` 推断模式 (`mode = inferred`)

派生断言应当 (SHOULD) 具备：

```text
推导活动 (derivation Activity)
输入的断言 / 证据
方法 / 参数的标识信息（若可用）
```

可能要求具备 `derive` 治理权限。

---
# 82. `mode = imported` 导入模式 (`mode = imported`)

普通的胶囊导入通常使用胶囊导入管道（Capsule Import pipeline），而非手工编写的 KML。

手工编写的导入模式写入绝不能抹杀源溯源信息。

---
# 83. `asserted_by` 属于语义内容 (asserted_by Is Semantic Content)

`asserted_by` 表明：

> 声明持有/产生该断言的语义行动主体是谁？

它**不是**：

```text
写入该记录的经认证调用主体 (authenticated Principal)。
```

---
# 84. KML 无法自行授予代表权限 (KML Cannot Self-Grant Representation Authority)

编写：

```prolog
asserted_by: "CEO"
```

并不能证明调用者代表 CEO。

治理机制利用受信任的 ActorBinding/溯源来判定：

```text
assert
record_attributed_assertion
assert_as_actor
```

等权限。

---
# 85. 归属性断言 (Attributed Assertion)

如果智能体记录：

> Alice 说了命题 P。

该操作应当附带证据，例如：

```text
消息
对话记录
签名声明
```

治理机制可以将其授权为：

```text
record_attributed_assertion (记录归属性断言)
```

这不属于身份冒充。

---
# 86. 代表性断言 (Represented Assertion)

如果经过认证的调用者意图作为 Alice 行使权限，引擎必须在 `assert_as_actor` 下验证：

```text
ActorBinding (行动主体绑定)
scope (权限范围)
authentication (认证状态)
```

任何 KML 字段都无法绕过该要求。

---
# 87. 断言证据角色 (Assertion Evidence Roles)

保留结构化角色：

```text
support (支持)
challenge (质疑 / 反驳)
context (上下文)
```

---
# 88. 反面证据不会重写已有断言 (Counter-Evidence Does Not Rewrite Assertion)

新的质疑/反驳证据可以根据上下文产生：

```text
新的断言
新的派生断言
新的活动
```

原始断言依然作为历史保留。

---
# 89. `CREATE ACTIVITY` 创建活动 (`CREATE ACTIVITY`)

活动用于记录溯源转换过程。

示例：

```prolog
CREATE ACTIVITY ?act {
  CLIENT KEY :activity_key

  SET FIELDS {
    activity_class: "inference",
    started_at: :started_at,
    ended_at: :ended_at,
    parameters_digest: :params_digest,
    status: "completed"
  }

  SET STRUCTURAL {
    ("inputs", ?e1)
    ("inputs", ?a1)
    ("outputs", ?a2)
    ("associated_actors", :brain_actor)
  }
}
```

---
# 90. 活动不是事务 (Activity Is Not Transaction)

事务表明：

> 该状态变更已成功提交。

活动表明：

> 该认知 / 现实 / 过程转换发生过或已被报告。

它们属于完全不同的记录。

---
# 91. 活动记录模式是受保护的溯源语义 (Activity Record Mode Is Protected Provenance Semantics)

可能的溯源保证级别：

```text
engine_observed (引擎观察到的)
actor_reported (行动主体报告的)
imported (导入的)
```

普通的作者内容无法自行将：

```text
actor_reported
升级为
engine_observed。
```

运行时只分配其能够实际支撑的最强证明级别。

---
# 92. 未决状态活动 (Pending Activity)

长期运行的认知/运行时进程可以在完成之前创建：

```text
pending (未决)
running (运行中)
```

状态的活动。

---
# 93. 终态活动 (Terminal Activity)

终止状态包括：

```text
completed (已完成)
failed (失败)
cancelled (已取消)
```

转换为终态后，溯源拓扑应当 (SHOULD) 变为不可变：

```text
inputs (输入)
outputs (输出)
associated actors (关联行动主体)
parameters digest (参数摘要)
start/end time (起止时间)
```

---
# 94. 活动纠错 (Activity Correction)

切勿重写已完成的溯源历史。

应创建：

```text
新的纠错活动 (correction Activity)
或
审计纠错记录 (audit correction record)
```

---
# 95. `SET STRUCTURAL` 结构化引用设置 (`SET STRUCTURAL`)

核心/配置文件拓扑使用显式的结构引用。

推荐语法块：

```prolog
SET STRUCTURAL {
  ("field_name", ?target)
  ("field_name", ?target) {role: "support"}
  ("has_step", ?step) {index: 0}
}
```

每个 SET 都有对应的 UNSET。可变概念上的引用按条目移除——与 SET 条目相同的 `( field, target )`，只是不带选项对象：

```prolog
UNSET STRUCTURAL {
  ("has_step", ?wrong_step)
}
```

`UNSET STRUCTURAL` 出现在 `UNSET ATTRIBUTES` 能出现的位置（`UPSERT CONCEPT`、`UPDATE`）；`CREATE` 无物可删，记录类元素保持不可变拓扑（规范 §17.5）。从有序字段移除后其余 index 重新致密化；移除必填字段的最后一条引用将无法通过基数校验。在单值基数字段上，`SET STRUCTURAL` 即替换。

---
# 96. 结构字段解析 (Structural Field Resolution)

`"field_name"` 通过事务的模式环境解析为精确的结构字段定义。

也可以直接使用精确引用。

---
# 97. 结构引用不是命题 (Structural Reference Is Not a Proposition)

`SET STRUCTURAL` 不会创建：

```text
真值中立的 Proposition
Assertion
Evidence
```

它修改的是由核心/配置文件模式所定义的记录拓扑结构。

---
# 98. 结构基数约束 (Structural Cardinality)

模式负责校验：

```text
required (必需)
single (单值)
optional (可选)
set (集合)
ordered-list (有序列表)
role-bearing refs (承载角色的引用)
```

---
# 99. 有序结构字段 (Ordered Structural Field)

示例：

```prolog
SET STRUCTURAL {
  ("has_step", ?step0) {index: 0}
  ("has_step", ?step1) {index: 1}
}
```

配置文件定义索引是否必需、唯一且连续。

---
# 100. 结构环路 (Structural Cycles)

在核心/配置文件显式允许的情况下，可以存在 (MAY) 结构环路。

变更规划器必须检测非法的环路，而不是机械地拒绝所有环路。

---
# 101. 前向结构引用 (Forward Structural Reference)

在同一个 `MUTATE` 内部，允许编写：

```prolog
CREATE EVIDENCE ?e {
  SET STRUCTURAL {
    ("generated_by", ?act)
  }
}

CREATE ACTIVITY ?act {
  SET STRUCTURAL {
    ("outputs", ?e)
  }
}
```

---
# 102. 通用 `UPDATE` 更新语句 (Generic `UPDATE`)

基于模式匹配的变更依然是核心 KML 原语。

推荐语法：

```prolog
UPDATE ?target

SET FIELDS {
  ...
}

SET ATTRIBUTES {
  ...
}

SET FACET "FacetName" {
  ...
}

SET STRUCTURAL {
  ("field", ?target)
}

UNSET ATTRIBUTES {
  "old_field"
}

UNSET FACET "FacetName" {
  "old_field"
}

UNSET STRUCTURAL {
  ("field", ?target)
}

WHERE {
  ...
}

LIMIT :limit
```

仅应用合法的可变字段。

目标遵循与其它所有 `target_ref` 语句相同的规则：`?variable` 由 `WHERE` 绑定；直接引用（`:id` / `"id"`）已经指名了元素，可以省略 `WHERE`，此时 `WHERE` 只起守卫作用：

```prolog
UPDATE :experience_id
SET FACET "MnemonicState" {salience: 0.9}
```

---
# 103. UPDATE 绝不执行创建操作 (UPDATE Never Creates)

如果 `WHERE` 未找到匹配目标：

```text
updated = 0
```

除非操作明确要求“恰好匹配一个”的语义。

---
# 104. UPDATE 使用 KQL 原始匹配语义 (UPDATE Uses KQL Raw Matching)

`WHERE` 遵循原始 KQL 可见状态语义。

它不会自动只变更被采信的信念。

---
# 105. UPDATE 无法变更投影结果 (UPDATE Cannot Mutate Projection Results)

虚拟的：

```text
BELIEF
BELIEF SLOT
Structural descriptor (结构描述符)
```

不是持久化的更新目标。

---
# 106. UPDATE 目标类别 (UPDATE Target Kinds)

典型的合法使用场景：

```text
Concept 可变字段
Concept 属性
Profile Facets (配置文件切面)
非终态 Activity 的允许可变状态
维护标记 (maintenance markers)
记忆状态 (mnemonic state)
效用计数器 (utility counters)
```

---
# 107. UPDATE 禁止的目标 (UPDATE Forbidden Targets)

通用 UPDATE 严禁 (MUST NOT) 变更：

```text
Proposition tuple (命题元组)
Assertion epistemic payload (断言认识论载荷)
Evidence payload (证据载荷)
已完成的 Activity 溯源拓扑
_system 系统字段
Governance 治理字段
受保护的规范身份绑定
Schema Package 模式包状态
Trust Policy 信任策略
```

---
# 108. 生命周期字段优先使用专用生命周期命令 (Lifecycle Fields Prefer Lifecycle Commands)

尽管 Assertion/Evidence 的生命周期是可变的，原生 KML 应当 (SHOULD) 要求使用：

```text
RETRACT (撤回)
SUPERSEDE (替代)
CORRECT (纠错)
ARCHIVE (归档)
TOMBSTONE (墓碑)
```

而不是随意的：

```text
UPDATE lifecycle.status = ...
```

这使引擎能够验证状态转换语义并完整保留历史。

---
# 109. Concept 上的 `SET FIELDS` (`SET FIELDS` on Concept)

示例：

```prolog
UPDATE ?person
SET FIELDS {
  name: "Alice Chen"
}
WHERE {
  ?person {id: :alice_id}
}
```

这修改的是接地标签，而不是历史姓名事实。

---
# 110. 历史姓名事实 (Historical Name Fact)

如果 Alice 在 2019–2022 年间使用过另一个姓名具有重要意义，应当创建：

```text
Proposition (命题)
Assertion (断言)
valid_time (有效时间)
Evidence (证据)
```

切勿仅仅依赖当前的 `name`/`aliases`。

---
# 111. `SET ATTRIBUTES` 属性设置 (`SET ATTRIBUTES`)

用于设置模式定义的非认识论/配置文件内容。

示例：

```prolog
UPDATE ?project
SET ATTRIBUTES {
  ui_icon: "folder"
}
WHERE {
  ?project {id: :project_id}
}
```

---
# 112. 认识论属性的反模式 (Epistemic Attribute Anti-Pattern)

不良实践：

```prolog
UPDATE ?person
SET ATTRIBUTES {
  timezone: "+01:00"
}
...
```

当时区需要追踪以下信息时：

```text
source (来源)
confidence (置信度)
validity (有效性)
contradiction (矛盾)
history (历史)
```

优先推荐使用 Proposition + Assertion。

---
# 113. 模式应当防止属性滥用 (Schema Should Help Prevent Attribute Abuse)

模式包应当 (SHOULD) 明确识别哪些字段属于：

```text
attributes (属性)
structural (结构字段)
facets (切面)
semantic predicates (语义谓词)
```

KML 将拒绝不属于所请求平面的字段写入。

---
# 114. `SET FACET` 切面设置 (`SET FACET`)

示例：

```prolog
UPDATE ?exp
SET FACET "MnemonicState" {
  memory_strength: 0.75,
  salience: 0.9
}
WHERE {
  ?exp {id: :experience_id}
}
```

---
# 115. 切面可变性由配置文件定义 (Facet Mutability Is Profile-Defined)

配置文件可以为特定切面字段声明：

```text
mutable (可变)
append-only (仅追加)
derived-only (仅派生)
maintenance-only (仅维护)
terminal (终态不可变)
```

KML 严格强制执行配置文件契约。

---
# 116. 通用元数据机制被彻底移除 (Generic Metadata Is Removed)

原生 KML 2.0 绝不应当 (SHOULD NOT) 拥有通用的作者可写容器：

```prolog
WITH METADATA {...}
SET METADATA {...}
DELETE METADATA {...}
```

---
# 117. 为什么 (Why)

KIP 1.x 的 metadata 混杂了：

```text
认识论置信度
来源
有效性
存储生命周期
治理级访问控制
运维标记
引擎内部记账
```

KIP 2.0 赋予了它们明确的独立归宿：

```text
Assertion (断言)
Evidence (证据)
Activity/provenance (活动 / 溯源)
retention (留存)
Facets (切面)
Governance (治理)
_system (系统)
```

---
# 118. 元数据迁移规则 (Metadata Migration Rule)

遗留的 metadata 字段在翻译前必须完成分类。

对于语义涉及安全/认识论关键的字段，切勿机械地创建：

```text
facets.legacy_metadata
```

---
# 119. `_system` 绝不向作者开放写入 (_system Is Never Author-Writable)

KML 必须 (MUST) 拒绝在 `_system` 内部写入以下内容的企图：

```text
version (版本)
created_at (创建时间)
updated_at (更新时间)
created_tx (创建事务)
updated_tx (更新事务)
origin (起源)
space_seq (空间序号)
直接写入墓碑状态
```

由引擎底层操作负责对其赋值。

---
# 120. 治理字段绝非普通 KML 状态 (Governance Fields Are Never Ordinary KML State)

KML 必须 (MUST) 拒绝针对以下内容的普通写入：

```text
classification (密级分类)
policy_ref (策略引用)
authority ceiling (权限上限)
quarantine state (隔离检疫状态)
Grant (授权)
Delegation (委托)
Trust Resolver (信任解析器)
ActorBinding (行动主体绑定)
```

即使语法试图将它们放置在 attributes/facets 中也一律拒绝。

---
# 121. 关于权限的认知主张仍属于认知范畴 (Cognitive Claim of Authority Remains Cognitive)

在模式允许的前提下，智能体可以存储命题：

```text
(Alice, is_admin, true)
```

但这并不会修改实际的治理权限。

---
# 122. 限制性更强的请求 (More Restrictive Requests)

部署环境可以 (MAY) 暴露一个独立的受保护操作，允许认知写入者请求：

```text
更具限制性的密级分类
```

但这属于治理语义，而非通用的 `UPDATE`。

---
# 123. 更新表达式 (Update Expressions)

KIP 1.x 的数值更新表达式对可变/配置文件状态依然非常有用：

```text
ADD(a,b)
MUL(a,b)
CLAMP(x,lo,hi)
COALESCE(x,default)
```

---
# 124. 单目标确定性 (Per-Target Determinism)

更新表达式可以使用：

```text
字面量
参数
嵌套更新表达式
作用于 ?target 上的字段路径
```

但应当 (SHOULD NOT) 依赖于任意其他查询数据行。

这使得批量 UPDATE 保持与顺序无关。

---
# 125. Null 表达式求值 (Null Expression)

如果数值操作数为 null/非数值且未通过 `COALESCE` 处理，受影响的字段更新可以根据最终正式规则被跳过或判定失败。

实现必须保持行为的确定性。

---
# 126. 记忆代谢示例 (Mnemonic Metabolism Example)

正确的 v2 睡眠周期代谢模式：

```prolog
UPDATE ?memory

SET FACET "MnemonicState" {
  memory_strength: CLAMP(
    MUL(
      COALESCE(
        ?memory.facets["MnemonicState"].memory_strength,
        1.0
      ),
      :decay_factor
    ),
    0.0,
    1.0
  ),

  last_metabolized_at: :cycle_time
}

WHERE {
  ?memory {type: "Experience"}

  FILTER(
    IS_NULL(
      ?memory.facets["MnemonicState"].last_metabolized_at
    )
    ||
    ?memory.facets["MnemonicState"].last_metabolized_at
      < :cycle_start
  )
}

LIMIT 500
```

---
# 127. KIP 2.0 彻底移除通用的置信度衰减 (KIP 2.0 Removes Generic Confidence Decay)

这是相比 KIP 1.x 风格代谢的一项重大纠偏。

切勿仅仅因为时间流逝就定期修改：

```text
Assertion.confidence
```

---
# 128. 为什么 (Why)

历史上强有力的观察记录不会仅仅因为年代久远而在历史上变得不可信。

相反：

```text
confidence (置信度)
    历史 Assertion 的认识论属性

temporal relevance (时间相关性)
    当前投影考量的事项

memory_strength (记忆强度)
    回忆可访问性考量的事项
```

---
# 129. 过时的当前状态 (Stale Current Status)

一条旧的 Assertion 可以依然保持：

```text
confidence = 0.99
```

而当前的认识论投影会判定：

```text
针对“当前状态”证据不足 (insufficient)
```

因为缺失新鲜的证据。

无需执行任何置信度变更。

---
# 130. 重新确认不会修改旧置信度 (Reconfirmation Does Not Mutate Old Confidence)

如果用户重新确认了某件事：

```text
创建新的证据
根据需要创建 / 修订断言
```

或更新基于保留证据支撑的显式派生聚合/配置文件计数器。

切勿静默强化原始历史断言。

---
# 131. 记忆强化 (Memory Reinforcement)

重复成功的召回/使用可以更新：

```text
memory_strength (记忆强度)
utility (效用值)
validated use counters (验证使用计数器)
```

但前提是配置文件/学习策略明确定义了这些信号。

单纯的读取绝不会自动强化记忆。

---
# 132. 受限变更上的 `LIMIT` (`LIMIT` on Bounded Mutation)

凡是 `WHERE` 可能选中无界集合的变更语句，都可以在该 `WHERE` 之后紧跟一个可选的
`LIMIT` (规范 §52.7)：

```text
UPDATE
RETRACT ASSERTION
SET RETENTION
ARCHIVE
TOMBSTONE
PURGE
```

`MERGE CONCEPT` 不接受 `LIMIT`：它的源与目标已被直接命名，其 `WHERE` 只起守卫作用。

`LIMIT` 是爆炸半径上限控制，而不是语义排序机制。

在缺乏针对变更语义的 `ORDER BY` 时，在上限内选取哪些匹配行可能由实现定义。

---
# 133. 大规模维护扫描 (Large Maintenance Sweep)

推荐采用：

```text
结构分片
+
周期标记
+
重复执行直至 updated < limit
```

而不是盲目扫描整张图。

---
# 134. 维护标记存储位置 (Maintenance Marker Location)

在 v2 中，周期标记归属于运维/配置文件切面或显式的维护字段。

它们绝不应当隐藏在通用的认识论元数据中。

---
# 135. UPDATE 原子性 (UPDATE Atomicity)

单条独立的 UPDATE 构成单个隐式事务。

所选定的所有变更要么全部提交，要么全部不提交。

---
# 136. 无实际效果的 UPDATE (No-Effect UPDATE)

如果最终持久化的值与当前状态相同：

```text
version 保持不变
updated_at 保持不变
不生成该元素的认知变更信封
```

---
# 137. `RETRACT ASSERTION` 撤回断言 (`RETRACT ASSERTION`)

推荐语法：

```prolog
RETRACT ASSERTION ?a
WHERE {
  ?a ASSERTION {id: :assertion_id}
}
EXPECT STATE "active"
```

---
# 138. 撤回的含义 (Retraction Meaning)

撤回表示：

> 断言者或其授权代表显式撤回了该断言。

它不是通用的内容审核管理。

---
# 139. 撤回不执行物理删除 (Retraction Does Not Delete)

撤回之后：

```text
Assertion 依然保持可寻址
历史投影能够复原该记录
当前投影根据生命周期排除 / 处理它
```

---
# 140. 撤回授权 (Retraction Authorization)

基于语义代表关系，治理机制要求具备相应的：

```text
retract_own
或更强的显式权限。
```

---
# 141. 管理员严禁伪造撤回操作 (Administrator Must Not Forge Retraction)

如果管理员希望排除某条断言，但原始行动主体并未撤回它：

```text
quarantine (隔离检疫)
moderate (审核过滤)
restrict (限制访问)
tombstone (设置墓碑)
```

在治理框架下执行。

切勿虚假写入：

```text
retracted
```

假装是行动主体自行撤回了该主张。

---
# 142. 撤回溯源 (Retraction Provenance)

有意义的撤回应当 (SHOULD) 在同一次事务中伴随以下内容：

```text
撤回的证据
或
活动 / 审计溯源记录
```

---
# 143. 撤回示例 (Retraction Example)

```prolog
MUTATE {
  CREATE EVIDENCE ?withdrawal {
    CLIENT KEY :withdrawal_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: {
        mode: "inline",
        inline: {
          text: "I withdraw my earlier claim."
        }
      },
      observed_at: :time
    }
  }

  RETRACT ASSERTION :old_assertion
  EXPECT STATE "active"

  CREATE ACTIVITY ?act {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "assertion_retraction",
      started_at: :time,
      ended_at: :time,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :old_assertion)
      ("inputs", ?withdrawal)
      ("outputs", :old_assertion)
    }
  }
}
```

生命周期转换与其证据一同原子提交。

---
# 144. `SUPERSEDE ASSERTION` 废弃替代断言 (`SUPERSEDE ASSERTION`)

推荐写法：

```prolog
SUPERSEDE ASSERTION :old_id BY :new_id
```

或在单个 `MUTATE` 块内部：

```prolog
SUPERSEDE ASSERTION :old_id BY ?new
```

---
# 145. 替代的含义 (Supersession Meaning)

替代表示：

> 针对特定行动主体/上下文/时间解释，较新的断言取代了较旧的断言。

---
# 146. 替代不是矛盾对立 (Supersession Is Not Contradiction)

两个不同行动主体可以持有对立观点：

```text
Alice 支持 P
Bob 拒绝 P
```

而无需其中任何一条断言去替代另一条断言。

---
# 147. 替代校验 (Supersession Validation)

引擎/配置文件/认识论模式应当 (SHOULD) 校验兼容性条件，例如：

```text
相同的代表行动主体或授权认知进程
兼容的语义槽位 / 冲突集
合理的时间 / 上下文谱系
新断言存在且处于活跃状态
旧断言符合被替代的合格条件
```

具体策略可以有所不同。

---
# 148. 替代的原子状态 (Supersession Atomic State)

执行成功的命令原子记录：

```text
old.lifecycle.status = superseded
old.superseded_by 包含新断言

new.lifecycle.supersedes 包含旧断言
```

或等效的核心表征。

---
# 149. 替代不会重写旧载荷 (Supersession Does Not Rewrite Old Payload)

旧断言的：

```text
stance (立场)
confidence (置信度)
valid_time (有效时间)
evidence (证据)
```

全部保持不变。

---
# 150. 信念纠错模式 (Belief Correction Pattern)

```prolog
MUTATE {
  CREATE EVIDENCE ?e2 {...}

  ENSURE PROPOSITION ?p2 (
    :alice,
    "timezone",
    "+01:00"
  )

  CREATE ASSERTION ?a2 {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p2,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?e2) {role: "support"}
    }
  }

  SUPERSEDE ASSERTION :a1 BY ?a2

  CREATE ACTIVITY ?revision {
    ...
  }
}
```

---
# 151. 时间变更可能不构成逻辑矛盾 (Temporal Change May Not Be Contradiction)

假设：

```text
时区 +08 有效期截止至 9 月 1 日
时区 +01 有效期自 9 月 1 日起始
```

这两者在其各自的现实世界时间段内均可保持被接受状态。

替代/生命周期操作应当准确反映行动主体/历史语义，而不是盲目宣称逻辑矛盾。

---
# 152. `CORRECT EVIDENCE` 纠错证据 (`CORRECT EVIDENCE`)

推荐语法：

```prolog
CORRECT EVIDENCE :old_evidence BY ?new_evidence
```

---
# 153. 证据纠错语义 (Evidence Correction Semantics)

原子执行结果：

```text
旧证据保持不可变
旧生命周期记录 corrected_by 字段
新证据记录 corrects 字段
```

在核心/配置文件定义了相关字段的前提下生效。

---
# 154. 纠错不是删除 (Correction Is Not Deletion)

一条错误的测量数据依然是历史上曾经存在并对认知产生过影响的产物。

除非隐私/合规清理强制要求物理删除，否则应完整予以保留。

---
# 155. 证据纠错可能触发断言修订 (Evidence Correction May Trigger Assertion Revision)

如果被纠正的证据实质性地改变了信念：

```text
新证据
+
新断言
+
废弃替代（若适用）
+
纠错活动
```

应当构成单个连贯的原子事务。

---
# 156. `TRANSITION ACTIVITY` 转换活动状态 (`TRANSITION ACTIVITY`)

推荐写法：

```prolog
TRANSITION ACTIVITY :activity_id
TO "completed"
EXPECT STATE "running"
```

允许变更的终态字段在同一语句中、守卫之前一并最终确定：

```prolog
TRANSITION ACTIVITY :activity_id
TO "completed"
SET FIELDS {ended_at: :time}
SET STRUCTURAL {
  ("outputs", :assertion_id)
}
EXPECT STATE "running"
```

---
# 157. 完成一项活动 (Completing an Activity)

在终态提交之前，操作可以原子方式最终确定：

```text
outputs (输出)
ended_at (结束时间)
status (状态)
```

如果这些字段在前期尚未明确。

---
# 158. 终态不可变性 (Terminal Immutability)

一旦转换为终态：

```text
inputs/outputs/actors/parameters/time
```

依据核心模型规范将变为完全不可变。

后续的纠错必须创建全新的溯源记录。

---
# 159. 引擎运行时活动 (Engine Runtime Activities)

对于工具/运行时执行，引擎可以通过特权运行时集成创建/转换活动，而不是依赖模型生成的 KML。

这能够提供货真价实的：

```text
engine_observed (引擎观察证明)
```

背书。

---
# 160. `SET RETENTION` 设置留存策略 (`SET RETENTION`)

留存策略不属于普通的认知内容。

推荐的受保护操作：

```prolog
SET RETENTION ?target {
  retention_class: "episodic-short",
  expires_at: :expires_at
}
WHERE {
  ?target {id: :id}
}
```

---
# 161. 留存权限 (Retention Permission)

要求具备相应的：

```text
manage_retention
maintain
```

权限范围。

仅具备普通的 `update` 权限并不自动包含该能力。

---
# 162. 留存期不是断言有效时间 (Retention Is Not Assertion Validity)

切勿混淆：

```text
retention.expires_at (留存过期时间)
```

与：

```text
Assertion.valid_time.until (断言有效截止时间)
```

前者关乎存储/记忆生命周期管理。

后者关乎现实世界适用性。

---
# 163. `ARCHIVE` 归档原语 (`ARCHIVE`)

推荐写法：

```prolog
ARCHIVE ?target
WHERE {
  ?target {id: :id}
}
```

---
# 164. 归档的含义 (Archive Meaning)

归档表示：

```text
从日常回忆中排除 / 降低其优先级
在审计 / 历史中予以保留
```

它不是物理删除。

---
# 165. 归档不代表事实为假 (Archive Does Not Mean False)

归档某条 Assertion/Evidence/Experience 绝不会改变其历史上的认识论内容。

---
# 166. `TOMBSTONE` 设置墓碑 (`TOMBSTONE`)

推荐写法：

```prolog
TOMBSTONE ?target
WHERE {
  ?target {id: :id}
}
```

需具备显式的生命周期权限。

---
# 167. 墓碑的含义 (Tombstone Meaning)

引擎执行受保护的状态转换：

```text
_system.state → tombstoned
```

调用者绝不能直接写入 `_system`。

---
# 168. 墓碑保留身份标识 (Tombstone Preserves Identity)

墓碑应当 (SHOULD) 保留足够的信息，以防止：

```text
ID 被复用
产生悬空的必需引用
溯源链路发生隐式断裂
```

---
# 169. 墓碑不代表撤回 (Tombstone Does Not Mean Retraction)

对于断言：

```text
retracted
```

代表行动主体主动撤回主张。

```text
tombstoned
```

代表存储 / 逻辑删除状态。

这两者含义完全不同。

---
# 170. `PURGE` 物理清理原语 (`PURGE`)

物理清理属于显式的高影响破坏性操作。

推荐形式：

```prolog
PURGE ?target

WHERE {
  ?target EVIDENCE {id: :evidence_id}
}

LIMIT :limit

REFERENCE POLICY "deny_if_referenced"

CONFIRM "PURGE"
```

确认语法已固定为 `CONFIRM "PURGE"`。

除必需的确认之外，清理扫描还应当 (SHOULD) 用 `LIMIT` 加以限界 (§132)。

---
# 171. 物理清理权限 (Purge Permission)

要求具备：

```text
purge
```

或等效的更强治理权限。

---
# 172. 证据物理清理极为敏感 (Evidence Purge Is Especially Sensitive)

删除反面证据会在客观上人为强化后续的信念。

高影响的证据清理应当 (SHOULD)：

```text
获得明确授权 (authorized)
具备审计追踪 (audited)
在变更流中可见 (change-stream visible)
感知引用依赖 (reference-aware)
保持保守审慎 (conservative)
```

---
# 173. 引用依赖策略 (Reference Policy)

推荐取值：

```text
deny_if_referenced (存在引用时拒绝)
tombstone_reference (引用处设为墓碑)
authorized_cascade (授权级联清理)
```

默认值为：

```text
deny_if_referenced
```

---
# 174. 严禁隐式破坏性级联删除 (No Implicit Destructive Cascade)

KIP 1.x 的 `DELETE CONCEPT DETACH` 能够传递性删除相连的/高阶链路。

KIP 2.0 绝不应当 (SHOULD NOT) 将破坏性级联删除作为日常默认行为。

---
# 175. 为什么 (Why)

在认知历史中：

```text
Assertion (断言)
Evidence (证据)
Activity (活动)
Experience (经验)
```

都可能引用目标元素。

删除整条依赖链会造成历史篡改伪造。

---
# 176. 授权级联清理 (Authorized Cascade)

专用的物理清理策略可以在以下场景下执行级联：

```text
法律 / 隐私合规强制要求
临时生成的暂态数据
已知可丢弃的子图
```

其影响范围必须是可预览且可审计的。

---
# 177. 法律合规强制清理 (Legal Purge)

当法律/政策强制要求物理擦除数据时：

```text
隐私合规义务优先于历史完整性保留。
```

KIP 可以仅保留允许的最小化墓碑/审计信息。

---
# 178. 原生 v2 降级通用的 `DELETE` (Generic `DELETE` Is Demoted in Native v2)

原生 KML 绝不应当 (SHOULD NOT) 鼓励将：

```text
DELETE PROPOSITION
DELETE CONCEPT DETACH
DELETE METADATA
```

作为常规的记忆演化手段。

优先采用显式的生命周期语义。

---
# 179. 属性移除 (Attribute Removal)

可变字段的移除使用：

```text
UNSET ATTRIBUTES
UNSET FACET
```

而非破坏性的元素删除。

---
# 180. 命题垃圾回收 (Proposition Garbage Collection)

未被断言且无引用的规范命题，可由系统维护机制在安全的核心规则约束下进行物理垃圾回收。

普通的智能体 KML 无需手动对其执行删除。

---
# 181. `MERGE CONCEPT` 合并概念 (`MERGE CONCEPT`)

KIP 2.0 保留了实体合并能力，但根本性重构了其底层语义。

推荐写法：

```prolog
MERGE CONCEPT ?source INTO ?target
WHERE {
  ?source {id: :source_id}
  ?target {id: :target_id}
}
```

---
# 182. 合并操作是非破坏性的 (Merge Is Non-Destructive)

提交成功后：

```text
source 保持可寻址
source 状态 = merged
source.merged_into = target
规范解析 source → target
```

---
# 183. 旧命题绝不被重写 (Old Propositions Are Not Rewritten)

如果旧命题引用了源实体：

```text
P_old.subject = source
```

原始历史查询依然能够准确还原该历史事实。

---
# 184. 新写入按规范身份解析 (New Writes Resolve Canonically)

合并之后：

```text
针对 source 的普通新引用
→ 自动重定向至 target
```

通过规范解析机制达成。

---
# 185. 合并属于身份控制操作 (Merge Is an Identity Operation)

由于它会改变整张图的解释逻辑，因此要求具备比普通 `update` 更强的：

```text
merge_identity
```

权限。

---
# 186. 合并兼容性 (Merge Compatibility)

源端与目标端必须满足模式身份兼容性。

与 v1 不同，仅凭“展示类型字符串相同”是不充分的。

适用模式包身份/版本兼容性规则。

---
# 187. 规范命题碰撞处理 (Canonical Proposition Collision)

假设：

```text
P1 = (source, knows, Bob)
P2 = (target, knows, Bob)
```

合并后它们在语义元组上规范化为同一个。

引擎可以将其中一个命题标记为规范合并/重定向。

但必须 (MUST) 严格保留：

```text
原始命题 ID
断言引用关系
源溯源信息
历史可查性
```

---
# 188. 合并不会合并行动主体的断言 (Merge Does Not Merge Actors' Assertions)

身份合并能够改变语义端点的解析。

但绝严禁仅仅因为命题在规范化后合并为一，就将独立的断言强行合并折叠。

---
# 189. 合并回执 (Merge Receipt)

推荐的返回结构：

```json
{
  "source_id": "...",
  "target_id": "...",
  "source_state": "merged",
  "canonical_redirects": 12,
  "proposition_collisions": 3,
  "history_rewritten": false
}
```

并附加事务回执。

---
# 190. 合并重试 (Merge Retry)

将已经合并的源端重复合并到同一个目标端的重试操作，在可行的情况下应当 (SHOULD)：

```text
无实际副作用 (no_effect)
或
自诊断的 already_merged
```

而不是抛出破坏性错误。

---
# 191. 合并冲突 (Merge Conflict)

如果源端此前已合并到另一个不兼容的目标端：

```text
抛出 IdentityMergeConflict 错误
```

要求进行显式的身份审查。

切勿静默串联任意相互冲突的重定向。

---
# 192. 派生认知产出 (Derived Cognitive Output)

创建派生的：

```text
Insight (见解)
Assertion (断言)
Skill (技能)
summary (摘要)
```

应当 (SHOULD) 通过 Activity 保留溯源信息。

---
# 193. `derive` 治理权限 (`derive` Governance Permission)

调用主体可以具备：

```text
读取输入 (read inputs)
派生产出 (derive outputs)
```

而无需拥有：

```text
assert_as_actor
manage_trust
elevate_authority
```

等特权。

---
# 194. 密级分类传播 (Classification Propagation)

派生内容必须遵守治理密级传播规则。

KML 内容无法通过对机密输入生成摘要来单方面自我解密降级。

---
# 195. 权威性不可自动放大 (Authority Non-Amplification)

派生的技能/见解/断言不能仅仅因为以下原因就自动变得更具权威性：

```text
由受信任的 Agent 生成
Activity 声明其为 "validated"
摘要语气非常自信
```

权限提升始终属于独立的治理操作。

---
# 196. 起源不可篡改性 (Origin Non-Malleability)

派生产出保留源溯源根源。

认知转换过程绝不能抹杀：

```text
导入起源
不可信来源
共享证据根源
```

---
# 197. 严禁隐藏思维链 (No Hidden Chain-of-Thought)

推断活动可以存储：

```text
method (方法)
input refs (输入引用)
parameters_digest (参数摘要)
decision_summary (决策摘要)
result summary (结果摘要)
```

绝不应当 (SHOULD NOT) 要求存储私有的 Token 级推理细节。

---
# 198. 观察记录范式 (Observation Recipe)

当一次观察表达一个语义主张时，典型的观察应当原子化构建：

```text
Evidence (证据)
Proposition (命题)
Assertion(mode=observed) (断言)
Activity (活动)
```

---
# 199. 观察记录示例 (Observation Example)

```prolog
MUTATE {
  CREATE ACTIVITY ?observe {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "tool_observation",
      started_at: :time,
      ended_at: :time,
      parameters_digest: :params_digest,
      status: "completed"
    }

    SET STRUCTURAL {
      ("associated_actors", :agent_id)
      ("outputs", ?e)
      ("outputs", ?a)
    }
  }

  CREATE EVIDENCE ?e {
    CLIENT KEY :evidence_key

    SET FIELDS {
      evidence_class: "tool_result",
      payload: {
        mode: "external",
        content_ref: :result_ref
      },
      content_digest: :result_digest,
      media_type: "application/json",
      observed_at: :time
    }

    SET STRUCTURAL {
      ("generated_by", ?observe)
      ("source", :tool_id)
    }
  }

  ENSURE PROPOSITION ?p (
    :service_id,
    "healthy",
    true
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :observation_actor,
      stance: "support",
      mode: "observed",
      confidence: :observation_confidence,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?e) {role: "support"}
    }
  }
}
```

由运行时而非文本自身决定该 Activity/Evidence 是否能够获得引擎观察（engine-observed）的权威背书。

---
# 200. 用户陈述记录范式 (User Statement Recipe)

用户陈述：

> “我更喜欢暗色模式。”

推荐的认知构建过程：

```text
message 证据 (Evidence)
命题 (Alice, prefers, DarkMode)
由 Alice 断言且 mode=stated 的断言 (Assertion)
对话 / 摄取活动 (Activity)
```

---
# 201. 用户陈述记录示例 (User Statement Example)

```prolog
MUTATE {
  CREATE EVIDENCE ?message {
    CLIENT KEY :message_evidence_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: {
        mode: "inline",
        inline: {
          text: "I prefer dark mode."
        }
      },
      observed_at: :time
    }

    SET STRUCTURAL {
      ("source", :alice_id)
    }
  }

  ENSURE PROPOSITION ?p (
    :alice_id,
    "prefers",
    :dark_mode_id
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice_id,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?message) {role: "support"}
    }
  }
}
```

智能体是在记录 Alice 的陈述主张。

它并非声称自己就是 Alice。

---
# 202. 重复的用户陈述 (Repeated User Statement)

如果 Alice 下个月又说了完全相同的话：

```text
新的 message 证据
新的源事件身份标识
根据配置文件策略生成新的断言或作为新的巩固输入
```

切勿静默覆盖重写旧的陈述记录。

---
# 203. 推论记录范式 (Inference Recipe)

派生信念：

```text
输入证据 / 断言
→ 推断活动 (inference Activity)
→ 推断出的断言 (inferred Assertion)
```

---
# 204. 推论记录示例 (Inference Example)

```prolog
MUTATE {
  ENSURE PROPOSITION ?p (
    :project_id,
    "at_risk",
    true
  )

  CREATE ASSERTION ?derived {
    CLIENT KEY :derived_assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :brain_actor,
      stance: "support",
      mode: "inferred",
      confidence: :confidence,
      asserted_at: :time
    }
  }

  CREATE ACTIVITY ?inference {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "inference",
      started_at: :time,
      ended_at: :time,
      parameters_digest: :method_digest,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :evidence_1)
      ("inputs", :evidence_2)
      ("inputs", :assertion_3)
      ("outputs", ?derived)
      ("associated_actors", :brain_actor)
    }
  }
}
```

该活动完整保留了推导过程，而无需存储私有的隐藏思维链。

---
# 205. 矛盾对立记录范式 (Contradiction Recipe)

如果 Bob 表达了与 Alice 相反的主张：

```text
创建 Bob 的 Evidence
创建 Bob 的 Assertion
```

绝**不要**：

```text
废弃替代 Alice 的断言
删除 Alice 的断言
覆盖重写命题的置信度
```

除非 Bob 确实是同一行动主体/进程的合法授权修订者。

---
# 206. 冲突是一等公民 (Conflict Is First-Class)

认识论投影在后续负责判定：

```text
accepted (已接受)
rejected (已拒绝)
contested (存争议)
uncertain (不确定)
insufficient (不足)
```

KML 的职责是忠实保留这些输入。

---
# 207. 纠错记录范式 (Correction Recipe)

某个来源纠正自身此前的主张：

```text
新的 Evidence
新的 Assertion
废弃替代自身此前的 Assertion
记录纠错的 Activity
```

这是规范标准的信念修正模式。

---
# 208. 经验形成机制 (Experience Formation)

认知记忆配置文件（Cognitive Memory Profile）将：

```text
Experience (经验)
ExperienceStep (经验步骤)
```

表征为带有类型的 Concept，外加结构引用与切面。

KML 核心无需引入特殊的元素种类。

---
# 209. 经验形成示例 (Experience Formation Example)

```prolog
MUTATE {
  CREATE CONCEPT ?exp {
    TYPE "Experience"
    CLIENT KEY :experience_key

    NAME :experience_name

    SET ATTRIBUTES {
      goal: :goal,
      initial_state_summary: :initial_state,
      outcome_summary: :outcome,
      outcome_status: :outcome_status,
      surprise_score: :surprise,
      learning_value: :learning_value
    }

    SET FACET "MnemonicState" {
      memory_strength: :memory_strength,
      salience: :salience
    }

    SET STRUCTURAL {
      ("experienced_by", :self_id)
      ("has_step", ?step0) {index: 0}
      ("has_step", ?step1) {index: 1}
      ("has_step", ?step2) {index: 2}
      ("formed_by", ?formation)
    }
  }

  CREATE CONCEPT ?step0 {
    TYPE "ExperienceStep"
    CLIENT KEY :step0_key

    SET ATTRIBUTES {
      kind: "observation",
      summary: :step0_summary
    }
  }

  CREATE CONCEPT ?step1 {
    TYPE "ExperienceStep"
    CLIENT KEY :step1_key

    SET ATTRIBUTES {
      kind: "action",
      summary: :step1_summary,
      decision_summary: :decision_summary
    }
  }

  CREATE CONCEPT ?step2 {
    TYPE "ExperienceStep"
    CLIENT KEY :step2_key

    SET ATTRIBUTES {
      kind: "feedback",
      summary: :step2_summary
    }
  }

  CREATE ACTIVITY ?formation {
    CLIENT KEY :formation_key

    SET FIELDS {
      activity_class: "experience_formation",
      started_at: :time,
      ended_at: :time,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :event_or_evidence)
      ("outputs", ?exp)
      ("outputs", ?step0)
      ("outputs", ?step1)
      ("outputs", ?step2)
    }
  }
}
```

前向局部引用使得完整轨迹能够以原子方式构建完成。

---
# 210. 经验不自动等同于技能 (Experience Is Not Automatically a Skill)

记录一条 Experience 并不直接修改 Skill。

过程式巩固可以在后续异步进行。

---
# 211. 失败经验是一等公民 (Failed Experience Is First-Class)

KML 必须允许：

```text
outcome_status = failure (结果状态 = 失败)
```

而绝不应当仅仅因为尝试失败就删除或降低记忆评级。

失败往往具有极高的学习价值。

---
# 212. 经验决策摘要 (Experience Decision Summary)

配置文件可以存储简明的：

```text
decision_summary (决策摘要)
expected outcome (预期结果)
actual outcome (实际结果)
prediction error (预测误差)
```

以供可复用的学习。

绝不应当要求存储私有的隐藏思维链。

---
# 213. 技能编译过程 (Skill Compilation)

技能形成属于派生的认知过程：

```text
多个 Experiences (经验)
成功 / 失败对比
→ 过程式巩固 Activity
→ 候选 Skill (candidate Skill)
```

---
# 214. 技能编译示例 (Skill Compilation Example)

```prolog
MUTATE {
  CREATE CONCEPT ?skill {
    TYPE "Skill"
    CLIENT KEY :skill_version_key

    NAME :skill_name

    SET ATTRIBUTES {
      skill_class: :skill_class,
      summary: :summary,
      applicability: :applicability,
      procedure: :procedure,
      success_criteria: :success_criteria,
      failure_modes: :failure_modes,
      recovery: :recovery,
      status: "candidate"
    }

    SET FACET "SkillUtility" {
      utility: :initial_utility,
      success_count: 0,
      failure_count: 0
    }

    SET STRUCTURAL {
      ("compiled_from", :experience_success)
      ("compiled_from", :experience_failure)
      ("compiled_by", ?compile_activity)
    }
  }

  CREATE ACTIVITY ?compile_activity {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "procedural_consolidation",
      started_at: :time,
      ended_at: :time,
      parameters_digest: :method_digest,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :experience_success)
      ("inputs", :experience_failure)
      ("outputs", ?skill)
      ("associated_actors", :brain_actor)
    }
  }
}
```

---
# 215. 技能创建不提升执行权限 (Skill Creation Does Not Elevate Authority)

即使：

```text
status = candidate
utility = high
```

在未经治理明确批准的前提下，KML 绝不能将受保护的：

```text
行为 / 可执行权限 (behavioral/executable authority)
```

提升到更高层级。

---
# 216. 技能修订 (Skill Revision)

如果某个技能的过程发生重大变更，配置文件应当 (SHOULD) 决定是：

```text
创建全新的技能版本
废弃替代旧技能
还是更新显式可变的运维字段
```

KML 严格遵循配置文件的可变性契约。

---
# 217. 技能效用更新 (Skill Utility Update)

结果学习可以合法更新：

```text
success_count (成功计数)
failure_count (失败计数)
utility (效用值)
last_validated_at (最后验证时间)
```

如果配置文件将其定义为可变字段。

底层的 Experiences 完整保留。

---
# 218. 技能验证示例 (Skill Validation Example)

```prolog
UPDATE ?skill

SET FACET "SkillUtility" {
  success_count: ADD(
    COALESCE(
      ?skill.facets["SkillUtility"].success_count,
      0
    ),
    1
  ),

  last_validated_at: :time
}

WHERE {
  ?skill {id: :skill_id}
}

LIMIT 1
```

证明该次更新合理性的成功经验/活动，应当 (SHOULD) 在同一次逻辑学习工作流中一并予以保留。

---
# 219. 语义知识巩固 (Semantic Consolidation)

维护机制可以从多条 Experiences 中提炼出稳定的语义知识。

推荐范式：

```text
原始 Experiences 保持完整
Activity 记录巩固过程
新的派生 Assertion 表达可复用的规律性知识
```

---
# 220. 知识巩固不凭空制造佐证 (Consolidation Does Not Manufacture Corroboration)

如果多条经验最终派生自同一个证据根源，派生断言的溯源信息必须保留该依赖关系。

KML 复制/重写操作绝不会凭空创造独立的证据。

---
# 221. 对比巩固 (Contrastive Consolidation)

有价值的技能/见解可以来源于：

```text
成功的 Experience
+
失败的 Experience
```

以识别出决定性的条件/行动。

KML 将二者均记录为活动的输入。

---
# 222. 自我模型变更 (Self-Model Mutation)

配置文件可以维护：

```text
SelfModel (自我模型)
identity narrative (身份叙事)
values (价值观)
strengths (优势)
weaknesses (短板)
```

但当涉及历史/矛盾时，关于自我的持久认识论主张依然应当使用 Assertions 进行表达。

---
# 223. 自我叙事不等于治理身份 (Self Narrative Is Not Governance Identity)

在 SelfModel 内部修改：

```text
"我是管理员"
```

绝不会授予实际的管理员权限。

---
# 224. 承诺模式 (Commitments)

Commitment 可以是带有结构字段的带类型 Concept。

创建/履行 Commitment 应当保留：

```text
谁做出承诺
向谁承诺
承诺内容
截止时间
状态转换
Evidence/Activity
```

依据配置文件模式规范执行。

---
# 225. 承诺状态管理 (Commitment Status)

通用的配置文件可以允许受控的状态机转换：

```text
open → fulfilled (开启 → 已履行)
open → cancelled (开启 → 已取消)
open → expired (开启 → 已过期)
```

而不是自由形式的属性覆盖。

未来的配置文件 KML 宏可以编译为核心 `UPDATE`/Activity 语义。

---
# 226. 配置文件变更宏 (Profile Mutation Macros)

模式/配置文件包可以 (MAY) 为更高层级的宏发布模型提示，例如：

```text
FORM EXPERIENCE
COMPILE SKILL
FULFILL COMMITMENT
```

但核心 KML 并不强制要求这些宏。

---
# 227. 宏安全性 (Macro Safety)

宏属于语法/规划层面的语法糖。

它必须 (MUST) 编译为合法的核心 KML/事务，且严禁 (MUST NOT) 削弱：

```text
不可变性 (immutability)
治理策略 (Governance)
起源安全 (origin)
溯源完整性 (provenance)
权限控制 (authority)
模式校验 (Schema validation)
```

---
# 228. `ASSERT` 易用性语法糖 (`ASSERT` Ergonomic Sugar)

已在规范中标准化为规范性语法糖（§55.1）。下列成员名为最终定名；本文档早期草案曾写作 `asserted_by` / `asserted_at` / `client_key`，最终文法将其缩短：

```prolog
ASSERT ?a (
  :alice,
  "timezone",
  "+08:00"
) {
  by: :alice,
  stance: "support",
  mode: "stated",
  confidence: 1.0,
  at: :time,
  valid: {from: :valid_from, until: null},

  evidence: [?e, :message],

  key: :assertion_key
}
```

`by` 与 `mode` **必须**书写，其余为可选。`by` 成为断言的 `asserted_by`，`at` 成为其 `asserted_at`，`valid` 成为其 `valid_time`，`key` 成为其 `client_key`。`stance` 缺省为 `"support"`；省略 `at` 时缺省为引擎事务时间。`evidence` 是一个引用或引用数组；每一项都成为一条 `("evidence", ref) {role: "support"}` 结构性引证。带其它角色（`challenge`、`context`）的引证不属于语法糖范畴——请写脱糖后的 `CREATE ASSERTION` 并使用 `SET STRUCTURAL`（§74）。

取代关系通过一个可选的尾随子句表达：

```prolog
ASSERT ?a (...) {...} SUPERSEDING :old_assertion
```

它脱糖为 `SUPERSEDE ASSERTION :old_assertion BY ?a`。

---
# 229. ASSERT 的语法糖脱敏展开 (ASSERT Desugaring)

在概念上等价于：

```text
ENSURE PROPOSITION 元组
+
CREATE ASSERTION 指向该规范命题
+
出现 SUPERSEDING 时追加 SUPERSEDE ASSERTION old BY new
```

该脱糖过程是规范且确定的（规范 §55.1）：`ASSERT` 必须 (MUST) 恰好提交其脱糖形式的语义，
且严禁 (MUST NOT) 产生额外或不一致的状态。

`ASSERT` 既可独立出现，也可置于 `MUTATE` 内。引用的证据必须已经存在，或者为同一个 `MUTATE` 块中的局部句柄。

此处不接受命题 id 形式 `(id: :p)`：`ASSERT` 经由 `ENSURE PROPOSITION` 脱糖，
而后者按结构解析或创建（§58）。

---
# 230. ASSERT 不代表信念被接受 (ASSERT Does Not Mean Accepted)

该简写语法创建的是一个断言记录。

它绝不持久化：

```text
BELIEF status = accepted。
```

认识论投影在后续阶段负责裁定。

---
# 231. ASSERT 不自动授予行动主体权限 (ASSERT Does Not Grant Actor Authority)

`asserted_by` 语义依然要通过治理机制的代表权限检查。

---
# 232. 为什么保持语法糖克制 (Why Keep Sugar Small)

KML 不应创造数十个重复配置文件语义的认知动词。

稳定的核心原语应当保持为：

```text
create (创建)
ensure (确保规范)
update (更新)
transition (状态转换)
merge (合并)
lifecycle (生命周期)
```

在其上层进行模式/配置文件的自由组合。

---
# 233. 模式解析 (Schema Resolution)

每条 KML 语句都在事务捕获的模式环境下执行。

本地名称如：

```text
"Person"
"timezone"
"MnemonicState"
"has_step"
```

在执行变更前会被解析为精确的包符号引用（Package Symbol Refs）。

---
# 234. 持久化存储精确引用 (Persist Exact Refs)

持久化状态存储的是：

```text
精确的 schema_ref
精确的 predicate_ref
精确的切面 / 结构定义唯一标识
```

而非浮动的本地别名。

---
# 235. 模式歧义处理 (Schema Ambiguity)

如果：

```text
两个激活的包均暴露了 "Skill"
```

且本地解析存在歧义：

```text
抛出 SchemaSymbolAmbiguous 错误
```

引擎严禁 (MUST NOT) 主观猜测。

---
# 236. 精确引用调用 (Exact Ref)

高保证性变更可以直接使用：

```text
kip://profiles/cognitive-memory@2.0.0/Experience
```

---
# 237. 变更期间的模式默认版本变更 (Schema Default Change During Mutation)

事务基于单个快照解析模式。

并发发生的默认版本变更不能静默重新解释已经解析完成的 KML。

---
# 238. 提交前的模式封锁 (Schema Block Before Commit)

如果精确包在提交前被安全封锁：

```text
事务中止回滚
```

依据事务规则执行。

---
# 239. KML 无法激活模式包 (KML Cannot Activate Schema)

普通的 KML 语句如：

```text
CREATE CONCEPT
UPDATE
ASSERT
```

严禁执行以下操作：

```text
安装模式包
设置默认版本
修改模式锁定 (Schema Lock)
激活胶囊中内嵌的模式
```

这些属于 `manage_schema` 特权操作。

---
# 240. 约束校验 (Constraint Validation)

在提交前，引擎严格校验：

```text
必需字段 (required fields)
数值数据类型 (value datatypes)
基数约束 (cardinality)
主语 / 宾语种类 (subject/object kinds)
字面量类型 (literal types)
结构字段 (structural fields)
切面模式 (Facet schema)
生命周期状态机 (lifecycle state machine)
不可变字段 (immutable fields)
跨元素模式约束 (cross-element schema constraints)
```

---
# 241. 校验感知暂态状态 (Validation Sees Tentative State)

在单个 `MUTATE` 内部，模式校验能够观察到完整的暂态变更图。

这允许：

```text
新 Assertion → 新 Proposition
新 Evidence → 新 Activity
新 Experience → 新 Steps
```

作为一个整体原子化完成校验。

---
# 242. 治理授权 (Governance Authorization)

KML 语法表达认知意图。

治理机制决定经过认证的调用主体是否允许执行该意图。

---
# 243. 按变更语义逐项授权 (Authorization Is Per Mutation Semantics)

一个 `MUTATE` 块可能需要：

```text
创建证据 (create Evidence)
记录归属性断言 (record attributed Assertion)
派生产出 (derive output)
废弃替代自身断言 (supersede own Assertion)
```

整笔事务必须满足所有必需的权限。

---
# 244. 单个未授权子句导致 MUTATE 整体中止 (One Unauthorized Clause Aborts MUTATE)

由于 `MUTATE` 具有原子性：

```text
单个必需的变更被拒绝
→ 整个块中止回滚。
```

绝不对外暴露部分认知转换状态。

---
# 245. 权限在提交时重新验证 (Authority Is Revalidated at Commit)

如果授权 (Grant)/委托 (Delegation) 在提交前被撤销：

```text
事务中止回滚。
```

KML 绝不保留解析阶段的陈旧权限。

---
# 246. 认知字段无法自行扩张权限 (Cognitive Fields Cannot Expand Authority)

KML 子句无法通过创建：

```text
attributes.is_admin = true
```

并在同一事务中依赖该字段来获取 `manage_policy` 权限。

受保护的授权判定完全依赖受信任的治理状态。

---
# 247. 派生内容无法自行解密降级 (Derived Content Cannot Declassify Itself)

从受限证据派生出的摘要/技能依然受制于密级传播规则。

解密降级属于独立的受保护特权操作。

---
# 248. KML 与认识论信任 (KML and Epistemic Trust)

KML 可以记录：

```text
来源主张 (source claims)
证据 (Evidence)
关于可靠性的断言 (Assertions about reliability)
```

但无法通过普通认知写入直接改变受保护的信任解析器（Trust Resolver）。

---
# 249. KML 与认知胶囊导入 (KML and Capsule Import)

原生认知胶囊导入**绝非**定义为：

```text
执行胶囊中包含的任意 KML 代码。
```

胶囊是一种数据产物。

导入器执行：

```text
格式校验
身份映射
应用本地治理策略
构建导入执行计划
提交目的端事务
```

---
# 250. 为什么胶囊在 v2 中不是 KML 脚本 (Why Capsule Is Not KML Script in v2)

否则，远程胶囊可能会尝试通过可执行的变更文本来：

```text
合并本地身份
篡改信任设置
激活技能执行权限
重写 $self 身份
安装模式包
```

原生胶囊导入始终保持为受保护的语义管道。

---
# 251. KML 与外部工具调用 (KML and External Tool Calls)

KML 严禁 (MUST NOT) 在原子认知事务内部嵌入任意的外部副作用，例如：

```text
SEND EMAIL (发送邮件)
TRANSFER MONEY (转账)
HTTP POST (网络请求)
DEPLOY (发布部署)
DELETE REMOTE FILE (删除远程文件)
```

---
# 252. 为什么 (Why)

KIP 可以回滚自身未提交的状态。

但它无法回滚现实世界。

---
# 253. 行动模式范式 (Action Pattern)

推荐流程：

```text
事务 1:
    决策 (Decision) + 行动意图 (ActionIntent)

外部运行时:
    执行物理行动

事务 2:
    结果证据 (Outcome Evidence) + 活动 (Activity) + 经验 (Experience)
```

---
# 254. KML 可以记录行动意图 (KML Can Record Action Intent)

配置文件可以定义 `ActionIntent` Concept。

KML 将其作为认知内容予以持久化。

执行属于独立的运行时权限范畴。

---
# 255. KML 不授予工具权限 (KML Does Not Grant Tool Authority)

声明如下内容的 Skill/ActionIntent：

```text
"execute shell command" (执行 Shell 命令)
```

并不直接授予 Shell 执行权限。

由治理/工具运行时最终裁定行动权限。

---
# 256. 事务幂等性 (Transaction Idempotency)

API / 事务外层信封可以 (MAY) 为整笔 KML 事务提供：

```text
idempotency_key
```

---
# 257. KML 请求摘要 (KML Request Digest)

等效的标准化 KML / AST 语义应当生成稳定的请求摘要，以用于事务幂等性比对。

空白字符的差异不应导致虚假的幂等冲突。

---
# 258. 元素级幂等性 (Element-Level Idempotency)

当逻辑源事件具有稳定身份标识时，在以下元素上使用 `client_key`：

```text
Evidence (证据)
Assertion (断言)
Activity (活动)
事件型 Concept (概念)
```

---
# 259. 相同 Client Key + 相同不可变载荷 (Same Client Key + Same Immutable Payload)

预期行为：

```text
解析到原始元素
不执行重复创建
```

---
# 260. 相同 Client Key + 不同不可变载荷 (Same Client Key + Different Immutable Payload)

预期行为：

```text
抛出 ClientKeyConflict 错误
```

切勿静默将不同的事件当作重试处理。

---
# 261. 命题幂等性 (Proposition Idempotency)

`ENSURE PROPOSITION` 依据规范元组具有结构幂等性。

并发的确保创建操作将解析为同一个规范的活跃命题。

---
# 262. UPSERT 幂等性 (UPSERT Idempotency)

带有稳定键的 `UPSERT CONCEPT` 针对最终请求的可变状态具有幂等性。

---
# 263. 无实际效果规则 (No-Effect Rule)

如果某次变更的最终持久化状态与当前状态完全相同：

```text
版本号不自增
updated_at 不改变
不触发认知变更事件
```

---
# 264. 为什么 (Why)

否则重试操作将产生：

```text
虚假的记忆活动
维护噪声
缓存失效
版本空转
```

---
# 265. 版本号自增规则 (Version Increment)

在单笔已提交的事务中，一个预先存在的元素内部即使发生多次修改，其：

```text
_system.version
```

也严格仅递增一次。

---
# 266. 新元素初始版本 (New Element Version)

根据核心/事务规范，新创建的持久化元素初始：

```text
version = 1
```

---
# 267. 引擎时间 (_system.updated_at)

`_system.updated_at` 使用事务提交时间。

语义时间依然作为显式内容存储：

```text
Evidence.observed_at (观察时间)
Assertion.asserted_at (断言时间)
Assertion.valid_time (有效时间)
Activity.started_at (开始时间)
```

---
# 268. 客户端提供的时间是语义内容而非引擎真理 (Client-Supplied Time Is Semantic, Not Engine Truth)

调用者可以依据模式/溯源提供：

```text
observed_at
asserted_at
```

但调用者绝无法设置：

```text
committed_at (提交时间)。
```

---
# 269. 变更回执 (Mutation Receipt)

执行成功的独立 KML 变更应当 (SHOULD) 返回：

```text
语义结果
+
事务回执 (Transaction Receipt)
```

---
# 270. `MUTATE` 执行结果 (`MUTATE` Result)

示意结构：

```json
{
  "handles": {
    "e": {
      "id": "evidence-1",
      "created": true
    },

    "p": {
      "id": "prop-9",
      "created": false,
      "canonical": true
    },

    "a": {
      "id": "assertion-3",
      "created": true
    }
  },

  "transitions": [
    {
      "id": "assertion-old",
      "from": "active",
      "to": "superseded"
    }
  ],

  "receipt": {
    "tx_id": "tx-...",
    "space_seq": 901,
    "status": "committed"
  }
}
```

---
# 271. 句柄结果对智能体极具价值 (Handle Result Is Helpful to Agents)

智能体可以在未来的 KQL 中直接使用返回的持久化 ID，而无需进行额外的搜索查找。

---
# 272. 规范复用是显式声明的 (Canonical Reuse Is Explicit)

如果 `ENSURE PROPOSITION` 复用了已有的规范命题，结果中应当明确说明。

这有助于解释幂等性，并避免将“未重复创建”误判为错误。

---
# 273. 无效果变更回执 (No-Effect Receipt)

完全无实际效果的变更可以根据事务模型返回：

```text
status = no_effect
space_seq = null
```

---
# 274. UPDATE 执行结果 (UPDATE Result)

推荐返回结构：

```json
{
  "matched": 12,
  "updated": 8,
  "no_effect": 4,
  "receipt": {...}
}
```

各计数基于授权可见的变更目标。

---
# 275. 生命周期操作结果 (Lifecycle Result)

推荐返回结构：

```json
{
  "element_id": "...",
  "transition": {
    "from": "active",
    "to": "retracted"
  },
  "receipt": {...}
}
```

---
# 276. 物理清理结果 (Purge Result)

在治理权限允许的前提下，必须暴露授权的影响信息，例如：

```text
purged elements (已物理删除元素数)
tombstoned refs (已设墓碑引用数)
cascade count (级联清理计数)
redacted history count (脱敏历史条目数)
```

---
# 277. 空运行预演 (Dry Run)

事务运行时可以 (MAY) 为 KML 支持：

```text
dry_run / preview (空运行 / 预演)
```

它完成解析、符号解析、授权判定、约束校验，并计算预测的写入集，而不实际执行提交。

---
# 278. 预演不等于资源锁定预留 (Preview Is Not Reservation)

后续的实际提交可能由于以下原因而失败：

```text
版本发生变化
授权被撤销
模式被安全封锁
出现了新的引用依赖
```

提交阶段始终会重新执行完整校验。

---
# 279. 变更预演对高影响操作至关重要 (Mutation Preview Is Important for High-Impact Operations)

尤其是针对：

```text
MERGE (合并)
TOMBSTONE (设置墓碑)
PURGE (物理清理)
批量 UPDATE
大规模维护操作
```

---
# 280. 批量 UPDATE 与可串行化语义 (Bulk UPDATE and Serializable Semantics)

写入事务应当 (SHOULD) 具备可串行化的执行结果。

当事务一致性保证承诺了可串行化时，依赖于：

```text
读取谓词
跨元素不变式
```

的批量更新绝不能静默遭受写偏斜（write skew）。

---
# 281. 写入前的外部推理 (External Reasoning Before Write)

常见的智能体交互模式：

```text
KQL 读取
大语言模型（LLM）推理
KML 写入
```

并不自动构成单笔事务。

使用：

```text
EXPECT VERSION
事务前置条件
```

来防范基于陈旧认知进行的错误推理写入。

---
# 282. 切勿在 LLM 推理期间持有事务锁定 (Do Not Hold Transaction While LLM Thinks)

推荐流程：

```text
读取快照
在事务外部进行思考推理
提交带有防护条件的有界 KML
```

而不是：

```text
开启事务
长时间等待 LLM / 工具推理
提交。
```

---
# 283. KML 变更历史溯源 (KML Mutation History)

每次持久化写入都通过引擎管理的历史与以下信息相连：

```text
created_tx (创建事务)
updated_tx (更新事务)
space_seq (空间序号)
origin (起源)
```

---
# 284. KML 无需将审计信息存储为通用元数据 (KML Does Not Need to Store Audit as Generic Metadata)

事务日志与活动/溯源层提供了显式的审计/历史支撑。

---
# 285. 纠错属于一笔全新的事务 (Correction Is a New Transaction)

在提交了错误的变更之后：

```text
切勿假装错误从未发生而直接回滚已提交的认知历史。
```

应创建一笔补偿/纠错事务。

---
# 286. 隐私合规例外 (Privacy Exception)

当策略强制要求清理时：

```text
历史内容可以被物理移除。
```

这不属于普通的认知纠错范畴。

---
# 287. KML 错误类别 (KML Error Classes)

推荐的原生错误类型：

```text
InvalidSyntax (语法无效)
InvalidIdentifier (标识符无效)

SchemaSymbolNotFound (未找到模式符号)
SchemaSymbolAmbiguous (模式符号歧义)
SchemaFieldNotFound (未找到模式字段)
TypeMismatch (类型不匹配)
ConstraintViolation (约束冲突)

IdentitySelectorRequired (缺少身份选择器)
NameIdentityForbidden (禁止使用名称作为身份)
IdentityConflict (身份冲突)
ClientKeyConflict (客户端键冲突)
CanonicalPropositionConflict (规范命题冲突)

ImmutableField (不可变字段错误)
ProtectedSystemField (受保护系统字段错误)
ProtectedGovernanceField (受保护治理字段错误)
ProtectedSchemaState (受保护模式状态错误)
EpistemicRevisionRequired (要求认识论修订)
EvidenceCorrectionRequired (要求证据纠错)
ActivityTerminal (活动已终态)

ReferenceError (引用错误)
ForwardReferenceUnresolved (前向引用未解析)
StructuralReferenceInvalid (结构引用无效)
DuplicateLocalHandle (重复局部句柄)
DuplicateMutationTarget (重复变更目标)
ReferenceIntegrityConflict (引用完整性冲突)

InvalidLifecycleTransition (生命周期转换无效)
RetractionNotAuthorized (撤回未授权)
SupersessionMismatch (替代不匹配)
EvidenceCorrectionConflict (证据纠错冲突)
IdentityMergeConflict (身份合并冲突)

VersionConflict (版本冲突)
PreconditionFailed (前置条件失败)
SerializationConflict (串行化冲突)

PurgeDenied (物理清理被拒绝)
PurgeReferenceConflict (清理引用冲突)
LegalHoldConflict (法律保留冲突)

ResourceExhausted (资源耗尽)
TransactionTooLarge (事务过大)
ExecutionTimeout (执行超时)
```

正式的数字化错误码推迟到后续规范中定义。

---
# 288. `EpistemicRevisionRequired` 要求认识论修订 (`EpistemicRevisionRequired`)

有价值的自诊断信息：

```text
尝试通过 UPDATE 修改断言的置信度 / 立场 / 命题。
请创建新的断言修订版本并废弃替代旧断言。
```

这能够直接引导智能体采用正确的记忆操作模式。

---
# 289. `EvidenceCorrectionRequired` 要求证据纠错 (`EvidenceCorrectionRequired`)

有价值的自诊断信息：

```text
尝试直接覆盖重写证据载荷。
请创建新证据并通过 CORRECT 纠错旧证据。
```

---
# 290. `NameIdentityForbidden` 禁止使用名称作为唯一标识 (`NameIdentityForbidden`)

有价值的自诊断信息：

```text
原生 UPSERT 无法将 type+name 作为唯一身份标识。
请对 Concept 进行接地并使用 id/key。
```

---
# 291. `ProtectedGovernanceField` 受保护治理字段错误 (`ProtectedGovernanceField`)

有价值的自诊断信息：

```text
密级分类 / 权限 / 策略 / 信任状态无法通过普通 KML 变更。
请使用已授权的治理操作。
```

---
# 292. `ActivityTerminal` 活动已终态错误 (`ActivityTerminal`)

有价值的自诊断信息：

```text
已完成活动的溯源拓扑是完全不可变的。
请创建新的纠错活动。
```

---
# 293. 错误恢复应当具备语义指导性 (Error Recovery Should Be Semantic)

KML 错误应当 (SHOULD) 包含安全的：

```text
hint (提示信息)
```

以告知智能体应当采取何种操作：

```text
重新读取版本
创建新的断言
创建纠错证据
使用精确模式引用
请求治理授权
预演物理清理影响
```

---
# 294. 重试版本冲突 (Retry Version Conflict)

发生：

```text
VersionConflict
```

时的正确应对流程：

```text
重新读取当前状态
重新执行合并 / 推理
使用最新版本号发起重试
```

切勿盲目重复提交陈旧的更新。

---
# 295. 重试模糊网络失败 (Retry Ambiguous Network Failure)

如果事务执行结果未知：

```text
复用相同的事务幂等键
或查询事务状态
```

在明确知道上一次结果之前，切勿使用新的逻辑键创建重复的 Evidence/Assertion。

---
# 296. KML 功能协商 (KML Capability Negotiation)

运行时应当 (SHOULD) 声明支持的特性：

```text
kml_version

mutate_block
forward_local_refs

create_concept
upsert_concept
ensure_proposition
create_evidence
create_assertion
create_activity
assert_sugar

update
update_expressions
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

expect_version
expect_state
client_key
dry_run

max_mutate_clauses
max_update_targets
max_purge_targets
```

---
# 297. 最小 KML 2.0 一致性要求 (Minimum KML 2.0 Conformance)

最小的原生实现必须 (MUST) 支持以下等效语义：

```text
稳定 Concept 的创建 / upsert
规范 Proposition 的 ensure
Evidence 创建
Assertion 创建
Activity 创建
不可变字段保护
Assertion 生命周期转换
Evidence 纠错谱系
通用的安全 UPDATE
EXPECT VERSION
事务幂等性集成
模式解析
治理强制执行
引擎起源追踪
无效果变更语义
```

---
# 298. 完整认知变更一致性 (Full Cognitive Mutation Conformance)

在此基础上增加：

```text
MUTATE 复合块
ASSERT 语法糖（规范性脱糖）
前向局部引用
结构引用变更
配置文件切面 (Profile Facets)
非破坏性 MERGE
archive/tombstone/purge
批量更新表达式
```

---
# 299. KML 一致性测试用例 (KML Conformance Fixtures)

核心测试集应当包括：

```text
使用 client_key 创建 Concept
重试完全相同的创建操作
相同的 client_key 搭配不同的载荷

通过 key 执行 Concept 的 upsert
原生拒绝仅凭名称的 upsert

两次确保相同的 Proposition
并发的 ensure 解析为单个规范命题

作为独立观察两次创建相同的 Evidence
使用 client_key 对同证据重试进行去重

尝试覆盖重写 Evidence 载荷被拒绝
CORRECT EVIDENCE 执行成功

创建 Assertion
尝试修改置信度被拒绝
创建新 Assertion + 替代执行成功

第三方冲突断言不会自动执行替代

撤回自身断言
管理员伪造撤回被拒绝 / 替换为审核过滤

创建已完成的 Activity
尝试重写 inputs 被拒绝

在 MUTATE 内部前向引用 Evidence ↔ Activity
原子失败时完全无残留

更新 memory_strength
不存在通用的置信度衰减

写入治理字段被拒绝
写入 _system 字段被拒绝

非破坏性合并保留旧的原始 Proposition 引用
合并碰撞完整保留 Assertion 历史

归档不是物理清理
墓碑不是主动撤回
默认拒绝清理被引用的 Evidence

无效果更新不递增版本号
版本冲突能够阻止陈旧写入
```

---
# 300. 溯源测试用例 (Provenance Fixtures)

```text
derived Assertion has Activity inputs
same source copied twice does not become two independent roots
imported source provenance survives derived output
actor-reported Activity cannot self-upgrade to engine-observed
```

---
# 301. 治理测试用例 (Governance Fixtures)

```text
ordinary creator can create Evidence
cannot manage Trust Resolver

record attributed Alice statement with Evidence
does not require/claim assert_as_actor

request represented Alice assertion without ActorBinding
rejected

Skill created with "executable" text
does not receive executable authority

summary of secret Evidence
does not declassify itself
```

---
# 302. 事务测试用例 (Transaction Fixtures)

```text
Evidence + Assertion + supersession + Activity
all commit atomically

one invalid clause
nothing commits

same transaction retry
same tx_id/receipt returned

same local handle used twice
fails before commit

element touched internally several times
one version increment
```

---
# 303. 生命周期测试用例 (Lifecycle Fixtures)

```text
Assertion active → retracted
historical query before transition sees active
after sees retracted

Assertion active → superseded by new own Assertion
both historical payloads preserved

different actor contradiction
no supersession

Evidence correction
old payload unchanged

archive Experience
audit still sees it

tombstone Concept
ID not reused

purge under legal hold
fails
```

---
# 304. 模式测试用例 (Schema Fixtures)

```text
local Predicate alias resolves exact version
ambiguous alias fails
exact ref succeeds

Schema default changes during transaction
already-resolved exact refs stable

schema version blocked before commit
transaction aborts

unknown Facet field
validation fails
```

---
# 305. KIP 1.x 兼容性策略 (KIP 1.x Compatibility Strategy)

KML 2.0 保留了 v1 的实用优势，但对若干核心语义进行了重大变革。

---
# 306. v1 `UPSERT CONCEPT` 兼容迁移 (v1 `UPSERT CONCEPT`)

遗留写法：

```prolog
CONCEPT {
  {type: "Person", name: "Alice"}
}
```

对于历史上依赖名称作为身份标识的遗留类型，可以通过创建稳定的：

```text
key = 遗留名称
```

来进行迁移。

---
# 307. v1 `SET PROPOSITIONS` 兼容迁移 (v1 `SET PROPOSITIONS`)

在 v1 中，添加：

```text
(Alice, prefers, DarkMode)
```

在隐式行为上等同于添加一条事实。

在原生 v2 中：

```text
单独的 ENSURE Proposition
```

是严格真值中立的。

如果兼容层意图保留旧的事实语义，则必须同时创建一条相应的迁移断言（Assertion）。

---
# 308. v1 命题元数据分解 (v1 Proposition Metadata)

遗留元数据：

```text
source
author
confidence
observed_at
valid_from
valid_until
superseded
```

必须分解归位到：

```text
Assertion
Evidence
Activity/provenance
lifecycle
retention
未解析时的遗留注解 (legacy annotation)
```

---
# 309. v1 `WITH METADATA` 迁移 (`WITH METADATA`)

原生 v2 中不存在通用的直接翻译。

迁移工具必须对每个 key 进行分类归宿映射。

---
# 310. v1 置信度 UPDATE 迁移 (v1 Confidence UPDATE)

遗留的代谢模式：

```text
confidence *= decay
```

严禁 (SHOULD NOT) 被引入原生 v2 的 Assertion 语义中。

可能的迁移意图：

```text
记忆可访问性衰减
    → MnemonicState.memory_strength

当前适用性衰减
    → 认识论投影的时效新鲜度规则

新证据改变了信念
    → 全新的断言修订版本
```

---
# 311. v1 证据计数强化迁移 (v1 Evidence Count Reinforcement)

如果 `evidence_count` 仅仅是缓存的计数值：

```text
迁移为派生 / 配置文件计数器
```

同时在可用时保留真实的证据记录。

切勿将聚合计数当作独立佐证的证明。

---
# 312. v1 `DELETE METADATA` 迁移 (`DELETE METADATA`)

首先对字段进行分类。

示例：

```text
confidence
    不能从命题中直接删除，应迁移断言生命周期

expires_at
    留存策略 (retention)

access_level
    治理策略 (Governance)

运维标记
    切面 (Facet)
```

---
# 313. v1 `DELETE PROPOSITIONS` 迁移 (`DELETE PROPOSITIONS`)

原生 v2 的常规行为通常应当转换为：

```text
断言生命周期管理
归档 (archive)
设置墓碑 (tombstone)
系统对无引用命题的垃圾回收
```

而非直接物理删除语义历史。

---
# 314. v1 `DELETE CONCEPT DETACH` 迁移 (`DELETE CONCEPT DETACH`)

原生迁移默认行为应当 (SHOULD) 保持保守：

```text
TOMBSTONE (设置墓碑)
```

或显式的高影响物理清理计划。

切勿自动重现传递性的破坏性级联删除。

---
# 315. v1 `MERGE` 语义升级 (v1 `MERGE`)

v1 会重定向边并物理删除源实体。

原生 v2：

```text
源实体保留
merged_into 指向目标
规范解析发生改变
原始历史引用完整保留
```

这是一项有意的重大语义升级。

---
# 316. v1 局部句柄顺序性 (v1 Local Handle Ordering)

v1 要求“先定义后使用”。

原生 v2 `MUTATE` 允许声明式的前向引用。

`kip-1-compat` 解析器可以在保留 v1 顺序语法的同时将其编译为 v2 变更图。

---
# 317. v1 知识胶囊脚本迁移 (v1 Knowledge Capsule Script)

v1 的 UPSERT 胶囊可以通过迁移/导入适配器进行转换。

原生 v2 认知胶囊绝不会作为任意 KML 代码被直接执行。

---
# 318. KML 2.0 入门指南 (KML 2.0 Primer)

一份面向大模型的简明入门指南：

```text
写入认知内容:

复合原子写入:
  MUTATE { ... }

稳定概念实体:
  UPSERT CONCEPT ?x {
    MATCH {type:"Person", key:"alice"}
    SET FIELDS {...}
    SET ATTRIBUTES {...}
    SET FACET "..." {...}
  }

新事件型概念:
  CREATE CONCEPT ?x {
    TYPE "Experience"
    CLIENT KEY :key
    ...
  }

真值中立陈述:
  ENSURE PROPOSITION ?p (?s, "predicate", ?o)

证据:
  CREATE EVIDENCE ?e {
    CLIENT KEY :key
    SET FIELDS {...}
  }

断言:
  CREATE ASSERTION ?a {
    CLIENT KEY :key
    SET FIELDS {
      proposition:?p,
      asserted_by:?actor,
      stance:"support",
      mode:"stated",
      confidence:0.9,
      asserted_at: :time
    }
    SET STRUCTURAL {
      ("evidence", ?e) {role:"support"}
    }
  }

同一主张的语法糖写法:
  ASSERT ?a (?s, "predicate", ?o) {
    by: ?actor, mode: "stated", confidence: 0.9, evidence: ?e
  }

溯源记录:
  CREATE ACTIVITY ?act {...}

修正信念:
  创建新 Assertion
  SUPERSEDE ASSERTION :old BY ?new

撤回主张:
  RETRACT ASSERTION :id

纠错证据:
  创建新 Evidence
  CORRECT EVIDENCE :old BY ?new

可变状态:
  UPDATE ?x SET ... WHERE {...}

身份合并:
  MERGE CONCEPT ?source INTO ?target

遗忘生命周期:
  ARCHIVE (归档)
  TOMBSTONE (设置墓碑)
  PURGE (高权限物理清理)

牢记原则:
  Proposition != 信念采信
  新信念 != UPDATE 旧 Assertion
  错误证据 != 覆盖旧 Evidence
  置信度 != 记忆强度 (memory_strength)
  认知内容无法自行授予权限
  严禁直接写入 governance / _system
```

---
# 319. 常用模式 — 稳定实体 Upsert (Common Pattern — Stable Entity Upsert)

```prolog
UPSERT CONCEPT ?project {
  MATCH {
    type: "Project",
    key: "kip-2"
  }

  SET FIELDS {
    name: "KIP 2.0"
  }

  SET ATTRIBUTES {
    description: :description
  }
}
```

---
# 320. 常用模式 — 字面量事实陈述 (Common Pattern — Literal Fact Statement)

```prolog
MUTATE {
  ENSURE PROPOSITION ?p (
    :alice,
    "timezone",
    "+08:00"
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", :message_evidence) {
        role: "support"
      }
    }
  }
}
```

---
# 321. 常用模式 — 新的对立矛盾主张 (Common Pattern — New Contradictory Claim)

```prolog
MUTATE {
  ENSURE PROPOSITION ?p (
    :alice,
    "timezone",
    "+01:00"
  )

  CREATE ASSERTION ?a {
    ...
  }
}
```

切勿删除/替代不相干行动主体的断言。

认识论投影在求值时可以判定为 `contested` 状态。

---
# 322. 常用模式 — 行动主体自我纠错 (Common Pattern — Actor Self-Correction)

```prolog
MUTATE {
  CREATE EVIDENCE ?e {...}

  ENSURE PROPOSITION ?p_new (
    :actor,
    :predicate,
    :new_value
  )

  CREATE ASSERTION ?a_new {...}

  SUPERSEDE ASSERTION :a_old BY ?a_new

  CREATE ACTIVITY ?revision {...}
}
```

---
# 323. 常用模式 — 证据纠错 (Common Pattern — Evidence Correction)

```prolog
MUTATE {
  CREATE EVIDENCE ?new_evidence {...}

  CORRECT EVIDENCE :old_evidence BY ?new_evidence

  CREATE ASSERTION ?new_assertion {...}

  SUPERSEDE ASSERTION :old_assertion BY ?new_assertion

  CREATE ACTIVITY ?correction {...}
}
```

---
# 324. 常用模式 — 记忆代谢衰减 (Common Pattern — Mnemonic Decay)

```prolog
UPDATE ?m

SET FACET "MnemonicState" {
  memory_strength: CLAMP(
    MUL(
      COALESCE(
        ?m.facets["MnemonicState"].memory_strength,
        1.0
      ),
      :factor
    ),
    0.0,
    1.0
  )
}

WHERE {
  ?m {type: "Experience"}
}

LIMIT 500
```

不包含任何认识论置信度的修改。

---
# 325. 常用模式 — 归档旧的原始经验 (Common Pattern — Archive Old Raw Experiences)

```prolog
ARCHIVE ?exp
WHERE {
  ?exp {type: "Experience"}

  FILTER(
    ?exp.facets["MnemonicState"].memory_strength
      < :archive_threshold
  )

  FILTER(
    ?exp.attributes.consolidation_status
      == "consolidated"
  )
}
LIMIT 200
```

实际归档合格性取决于配置文件/治理策略。

---
# 326. 常用模式 — 身份合并 (Common Pattern — Identity Merge)

```prolog
MERGE CONCEPT ?duplicate INTO ?canonical

WHERE {
  ?duplicate {id: :duplicate_id}
  ?canonical {id: :canonical_id}
}
```

执行结果：

```text
duplicate 依然作为历史保留
未来规范解析 → canonical 目标实体
```

---
# 327. 常用模式 — 创建候选技能 (Common Pattern — Create Skill Candidate)

```prolog
MUTATE {
  CREATE CONCEPT ?skill {
    TYPE "Skill"
    CLIENT KEY :skill_version_key

    SET ATTRIBUTES {
      skill_class: :skill_class,
      summary: :summary,
      applicability: :applicability,
      procedure: :procedure,
      status: "candidate"
    }

    SET STRUCTURAL {
      ("compiled_from", :experience_1)
      ("compiled_from", :experience_2)
      ("compiled_by", ?act)
    }
  }

  CREATE ACTIVITY ?act {
    ...
  }
}
```

执行权限始终由本地治理策略管控。

---
# 328. 常用模式 — 无隐藏思维链的推断 (Common Pattern — No Hidden CoT Inference)

存储内容：

```text
inputs
method identity
parameters digest
decision summary
output
```

而非：

```text
private model token trace.
```

---
# 329. 常用模式 — 行动结果记录 (Common Pattern — Action Outcome)

在完成外部行动后：

```prolog
MUTATE {
  CREATE EVIDENCE ?outcome {
    CLIENT KEY :external_operation_id

    SET FIELDS {
      evidence_class: "tool_result",
      payload: :result_payload,
      observed_at: :time
    }
  }

  CREATE ACTIVITY ?action_result {
    ...
  }

  CREATE CONCEPT ?experience {
    TYPE "Experience"
    ...
  }
}
```

对同一外部操作的重复投递使用稳定的客户端/事务标识进行幂等去重。

---
# 330. 常见反模式 — 重写真相事实 (Common Anti-Pattern — Rewrite Fact)

错误做法：

```prolog
UPDATE ?p
SET FIELDS {
  object: "+01:00"
}
WHERE {
  ?p (:alice, "timezone", "+08:00")
}
```

正确做法：

```text
new Proposition
new Assertion
possible supersession
```

---
# 331. 常见反模式 — 置信度衰减 (Common Anti-Pattern — Confidence Decay)

错误做法：

```prolog
UPDATE ?a
SET FIELDS {
  confidence: MUL(?a.confidence, 0.9)
}
...
```

正确做法：

```text
leave historical Assertion confidence
apply temporal relevance in Projection
or decay memory_strength.
```

---
# 332. 常见反模式 — 删除矛盾对立 (Common Anti-Pattern — Delete Contradiction)

错误做法：

```text
new evidence disagrees
→ delete old Assertion
```

正确做法：

```text
preserve contradiction
or supersede only when real revision semantics exist.
```

---
# 333. 常见反模式 — 伪造撤回操作 (Common Anti-Pattern — Fake Retraction)

错误做法：

```text
admin dislikes Alice's Assertion
→ mark Alice retracted it.
```

正确做法：

```text
Governance moderation/quarantine.
```

---
# 334. 常见反模式 — 重写覆盖证据 (Common Anti-Pattern — Evidence Rewrite)

错误做法：

```text
measurement was wrong
→ replace old payload bytes.
```

正确做法：

```text
new Evidence
CORRECT old BY new.
```

---
# 335. 常见反模式 — 基于名称的身份合并 (Common Anti-Pattern — Name-Based Identity Merge)

错误做法：

```text
both named Alice
→ MERGE.
```

正确做法：

```text
identity evidence/review
merge_identity authority.
```

---
# 336. 常见反模式 — 在属性中塞入权限 (Common Anti-Pattern — Authority in Attribute)

错误做法：

```prolog
UPDATE ?skill
SET ATTRIBUTES {
  authority: "executable"
}
```

正确做法：

```text
separate Governance elevation.
```

---
# 337. 常见反模式 — 将胶囊当作代码执行 (Common Anti-Pattern — Capsule as Code)

错误做法：

```text
download remote Capsule
execute its KML verbatim
```

正确做法：

```text
verify
validate
preview
map identity
apply local Governance
Import Transaction.
```

---
# 338. KML 变更决策树 (KML Mutation Decision Tree)

```text
Do you need to add a stable entity/profile object?
    → CREATE / UPSERT CONCEPT

Do you need a semantic statement to be referable?
    → ENSURE PROPOSITION

Did somebody/something take a stance?
    → CREATE ASSERTION

What artifact/observation supports it?
    → CREATE EVIDENCE

Was the result derived/transformed?
    → CREATE ACTIVITY

Did belief materially change?
    → CREATE new Assertion
      + SUPERSEDE when semantically valid

Was Evidence wrong?
    → CREATE new Evidence
      + CORRECT old BY new

Are you changing mnemonic/profile state?
    → UPDATE allowed Facet/attribute

Are two Concepts the same identity?
    → MERGE CONCEPT under identity authority

Do you want ordinary forgetting?
    → ARCHIVE / retention

Do you want logical deletion?
    → TOMBSTONE

Do you need physical erasure?
    → PURGE under high authority
```

---
# 339. KML 核心不变式 (KML Core Invariants)

以下为规范性设计目标：

1. KML 表达变更意图；事务决定持久化提交。
2. 单条独立的 KML 语句在单个隐式事务中原子执行。
3. 多条传输层命令不自动构成事务。
4. 复合变更使用显式的 `MUTATE` 块或显式多命令事务。
5. `MUTATE` 是声明式的，而非顺序式的。
6. 在单个 `MUTATE` 内部允许前向引用局部句柄。
7. 局部句柄不是持久化 ID。
8. 严禁重复声明相同的局部句柄。
9. 针对同一个目标存在依赖源码顺序的冲突变更是非法的。
10. 每个持久化元素保留唯一的不可变中枢本地 ID。
11. 普通 KML 无法自行指定新的引擎 ID。
12. 概念的 `name` 不是全局通用唯一标识。
13. 原生 Concept upsert 必须使用稳定的身份标识（如 ID/key）。
14. 原生严禁仅凭名称执行 upsert。
15. `client_key` 用于区分持久化创建的重试与重复发生。
16. 相同 client_key 搭配冲突的不可变载荷时报错失败。
17. 命题创建是基于语义元组的规范 `ENSURE`。
18. 命题的存在性不产生采信信念。
19. 命题元组是完全不可变的。
20. 命题不包含原生认识论置信度/来源字段。
21. 不鼓励使用命题的任意语义属性，且不属于原生机制。
22. 证据是追加导向的。
23. 证据载荷在历史上是完全不可变的。
24. 证据纠错创建新证据并建立纠错谱系。
25. 内容摘要相同不等于证据身份相同。
26. 断言是追加导向的。
27. 断言严格唯一定向单个命题。
28. 断言的认识论载荷在历史上是完全不可变的。
29. 新的信念将创建新的断言。
30. 断言置信度不会随时间流逝/强化而被常规修改。
31. 新证据通常创建新的断言修订版本/派生，而非修改旧引用。
32. 断言撤回属于生命周期状态转换，而非物理删除。
33. 撤回代表真实行动主体或授权者的主动撤销。
34. 管理员的排除干预严禁伪造为行动主体的主动撤回。
35. 替代不属于通用的矛盾对立。
36. 替代保留旧断言的完整载荷。
37. 第三方的冲突断言可以无限期共存。
38. 证据的支持/质疑引用属于结构引用。
39. 活动记录溯源过程，而非数据库事务。
40. 引擎观察（engine-observed）状态无法由内容自行声称获得。
41. 已终态活动的溯源拓扑是完全不可变的。
42. 结构引用不是语义命题。
43. 在模式允许的情况下可以存在结构环路。
44. UPDATE 绝不执行创建操作。
45. UPDATE 无法以虚拟 KQL 投影对象为目标。
46. UPDATE 严格遵守核心/配置文件的可变性规则。
47. 通用 UPDATE 无法修改命题元组。
48. 通用 UPDATE 无法修改断言认识论载荷。
49. 通用 UPDATE 无法修改证据载荷。
50. 通用 UPDATE 无法修改已完成活动的溯源信息。
51. 通用 UPDATE 无法修改 `_system` 字段。
52. 通用 UPDATE 无法修改受保护的治理状态。
53. 原生 KML 不存在通用的作者可写元数据容器。
54. 配置文件切面是由模式定义的，而非通用元数据。
55. 记忆强度与断言置信度截然不同。
56. 通用的置信度衰减不属于 KIP 2.0 的记忆代谢原语。
57. 时间相关性属于投影职责，而非历史置信度衰减。
58. 重新确认操作创建新证据/历史或合理派生的计数器。
59. 读取操作不会自动强化记忆。
60. 留存策略与现实世界有效时间截然不同。
61. 归档与撤回截然不同。
62. 归档与设置墓碑截然不同。
63. 设置墓碑与物理清理截然不同。
64. 物理清理是感知引用依赖的高特权操作。
65. 证据的物理清理受到更为严苛的审查。
66. 破坏性级联绝不是常规默认行为。
67. MERGE CONCEPT 是非破坏性的。
68. 合并保留源 Concept 作为历史身份。
69. 原始历史命题引用不会被合并重写。
70. 新写入对已合并身份执行规范解析。
71. 合并需要具备身份控制权限。
72. 合并后发生的规范命题碰撞保留断言/溯源历史。
73. 派生认知产出完整保留溯源根源。
74. 派生操作不能自行放大权限。
75. 派生操作不能静默解密降级数据。
76. 认知内容无法授予治理权限。
77. KML 无法安装/激活模式包。
78. 本地模式别名在单笔事务模式环境下完成解析。
79. 持久化存储的语义引用均为精确版本引用。
80. 模式符号歧义时直接报错，严禁主观猜测。
81. `_system.origin` 由引擎底层进行维护。
82. 自行声称的来源/溯源不能替代引擎起源信息。
83. `asserted_by` 是语义行动主体，而非经认证的写入者。
84. KML 无法自行授予 `assert_as_actor` 代表权限。
85. 治理授权在提交时重新执行验证。
86. 提交前的权限撤销能够阻止依赖提交。
87. 单个未授权的必需 MUTATE 子句将导致整笔复合写入中止回滚。
88. 无实际效果的最终状态不自增版本号。
89. 发生变更的元素在单笔事务中版本号严格递增一次。
90. 语义时间戳与引擎提交时间截然不同。
91. KML 绝不执行任意的外部现实世界副作用。
92. 外部行动采用意图/结果的异步记录模式。
93. 原生胶囊导入不是执行任意 KML 代码。
94. 胶囊导入无法通过 KML 文本获取特权。
95. 纠错是一笔全新的状态转换，而非抹杀已提交的历史。
96. 法律/隐私合规清理可以优先于常规的历史保留。
97. KML 错误应当指导智能体采取正确的语义变更操作。
98. 兼容性翻译严禁静默抹杀 v2 的认识论区别。
99. 配置文件宏可以简化语法，但严禁削弱核心不变式。
100. 真正的认知写入应当使大脑的认知历史更具可解释性，而非降低其解释力。

---
# 340. 形式化语法草案 (Formal Grammar Sketch)

非规范性 EBNF 风格语法草案：

```text
kml_statement :=
      mutate_statement
    | create_concept
    | upsert_concept
    | ensure_proposition
    | assert_statement
    | create_evidence
    | create_assertion
    | create_activity
    | update_statement
    | retract_assertion
    | supersede_assertion
    | correct_evidence
    | transition_activity
    | set_retention
    | archive_statement
    | tombstone_statement
    | purge_statement
    | merge_concept

mutate_statement :=
    "MUTATE" "{"
      mutation_clause*
    "}"

mutation_clause :=
      create_concept
    | upsert_concept
    | ensure_proposition
    | assert_statement
    | create_evidence
    | create_assertion
    | create_activity
    | update_statement
    | retract_assertion
    | supersede_assertion
    | correct_evidence
    | transition_activity
    | set_retention
    | archive_statement
    | tombstone_statement
    | purge_statement
    | merge_concept
    (* 除 MUTATE 自身之外的所有语句；MUTATE 不可嵌套 *)

create_concept :=
    "CREATE CONCEPT" handle
    "{"
      type_clause
      client_key_clause?
      name_clause?
      set_fields_clause?
      set_attributes_clause?
      set_facet_clause*
      set_structural_clause?
    "}"

upsert_concept :=
    "UPSERT CONCEPT" handle
    "{"
      match_clause
      expect_version_clause?
      set_fields_clause?
      set_attributes_clause?
      unset_attributes_clause?
      set_facet_clause*
      unset_facet_clause*
      set_structural_clause?
      unset_structural_clause?
    "}"

ensure_proposition :=
    "ENSURE PROPOSITION" handle?
    "(" term "," predicate_term "," term ")"
    expect_version_clause?
        (* EXPECT VERSION 0 即"仅创建"形式（§32）*)

assert_statement :=
    "ASSERT" handle?
    "(" term "," predicate_term "," term ")"
    assignment_object
    ("SUPERSEDING" target)?
    (* 规范性语法糖，规范 §55.1 / 本文 §228 *)

create_evidence :=
    "CREATE EVIDENCE" handle
    "{"
      client_key_clause?
      set_fields_clause
      set_facet_clause*
      set_structural_clause?
    "}"

create_assertion :=
    "CREATE ASSERTION" handle
    "{"
      client_key_clause?
      set_fields_clause
      set_facet_clause*
      set_structural_clause?
    "}"

create_activity :=
    "CREATE ACTIVITY" handle
    "{"
      client_key_clause?
      set_fields_clause
      set_facet_clause*
      set_structural_clause?
    "}"

update_statement :=
    "UPDATE" target
    expect_version_clause?
    update_clause+
    ("WHERE" "{"
      kql_clause*
    "}")?
    limit_clause?
    (* ?variable 目标由 WHERE 绑定；直接引用目标可省略 WHERE *)

update_clause :=
      set_fields_clause
    | set_attributes_clause
    | set_facet_clause
    | set_structural_clause
    | unset_attributes_clause
    | unset_facet_clause
    | unset_structural_clause

retract_assertion :=
    "RETRACT ASSERTION" target
    ("WHERE" "{" kql_clause* "}")?
    limit_clause?
    expect_state_clause?

supersede_assertion :=
    "SUPERSEDE ASSERTION" target
    "BY" target
    expect_state_clause?

correct_evidence :=
    "CORRECT EVIDENCE" target
    "BY" target
    expect_state_clause?

transition_activity :=
    "TRANSITION ACTIVITY" target
    "TO" value
    transition_finalize_clause*
    expect_state_clause?

transition_finalize_clause :=
      set_fields_clause
    | set_structural_clause
        (* 终态输出 / ended_at 可原子最终确定（§157）*)

set_retention :=
    "SET RETENTION" target
    assignment_object
    ("WHERE" "{" kql_clause* "}")?
    limit_clause?
    expect_version_clause?

archive_statement :=
    "ARCHIVE" target
    ("WHERE" "{" kql_clause* "}")?
    limit_clause?
    expect_state_clause?

tombstone_statement :=
    "TOMBSTONE" target
    ("WHERE" "{" kql_clause* "}")?
    limit_clause?
    expect_state_clause?

purge_statement :=
    "PURGE" target
    ("WHERE" "{" kql_clause* "}")?
    limit_clause?
    ("REFERENCE POLICY" value)?
    "CONFIRM" "\"PURGE\""

merge_concept :=
    "MERGE CONCEPT" target
    "INTO" target
    ("WHERE" "{" kql_clause* "}")?
    expect_version_clause?
        (* 无 limit_clause：源与目标已被直接命名 *)

target :=
    variable | parameter | string
        (* ?variable 目标由 WHERE 绑定，或是 MUTATE 内的局部句柄；
           直接引用目标可省略 WHERE（§102）*)
```

规范性的机器可读语法为
[`../grammar/KIP-2.0-KML.ebnf`](../grammar/KIP-2.0-KML.ebnf)，本草案是它的阅读辅助。
局部句柄、字段可变性、引用解析与生命周期合法性仍是语法之外的语义校验规则。

---
# 341. 推荐的语法设计哲学 (Recommended Syntax Philosophy)

优先选择：

```text
few stable verbs
explicit element kind
JSON-like field blocks
graph-native references
```

而非：

```text
large SQL-like grammar
many special-case keywords
implicit epistemic meaning
```

---
# 342. 模型优先推理 (Model-First Reasoning)

大语言模型（LLM）应当能够推理出：

```text
"this is a new observation"
→ create Evidence

"this statement can be referred to"
→ ensure Proposition

"Alice said it"
→ create Assertion

"this changes her earlier own claim"
→ supersede

"I inferred it from prior inputs"
→ create Activity

"I am only changing accessibility"
→ update memory_strength
```

而无需深入了解底层的数据库实现细节。

---
# 343. KML vs. “学习” (KML vs. "Learning")

执行 KML 修改的是外部认知状态。

这在最严格的行为学意义上并不自动等同于学习。

---
# 344. 强学习准则 (Strong Learning Criterion)

更强的准则始终是：

```text
Experience (经验)
    ↓
durable memory/procedure update (持久化记忆 / 过程更新)
    ↓
future behavior changes in relevant context (在相关上下文中表现出未来行为改变)
```

KML 是支撑该闭环的持久化/变更基质。

---
# 345. 非参数化学习 (Non-Parametric Learning)

图/配置文件的更新能够创造：

```text
非参数化的认知适应 (non-parametric cognitive adaptation)
```

即使模型权重并未改变。

但协议文档应当将：

```text
memory mutation (记忆变更)
```

与：

```text
demonstrated behavioral learning (经过验证的行为学学习)
```

清晰区分开来。

---
# 346. 因果评估 (Causal Evaluation)

证明通过 KML 构建的记忆具有实际价值的最有力证据是：

```text
behavior with memory (具备记忆时的行为表现)
vs.
behavior with memory ablated (消融去除记忆时的行为表现)
```

而不仅仅是：

```text
records exist (记录存在)。
```

---
# 347. 最终总体架构 (Final Architecture)

```text
                      Agent / Brain (智能体 / 大脑)
                                    │
                                    ▼
                      Mutation Intent (变更意图)
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
          CREATE                  UPDATE               TRANSITION
          (创建)                  (更新)               (状态转换)
             │                      │                      │
             ├ Evidence (证据)      ├ Facets (切面)        ├ Retract (撤回)
             ├ Assertion (断言)     ├ Attributes (属性)    ├ Supersede (替代)
             ├ Activity (活动)      └ Mutable Fields       ├ Correct (纠错)
             ├ Concept (概念)         (可变字段)           └ Activity state
             └ Proposition (命题)                            (活动状态)
                ENSURE (确保规范)
             │
             └──────────────────────┬──────────────────────┘
                                    ▼
                             MUTATE Planner
                              (变更规划器)
                                    │
                           resolve local handles
                           resolve exact Schema
                           canonicalize identity
                           validate references
                                    │
                                    ▼
                        Governance Authorization
                               (治理授权)
                                    │
                                    ▼
                        Core / Profile Validation
                           (核心 / 配置文件校验)
                                    │
                                    ▼
                           Transaction Runtime
                               (事务运行时)
                                    │
                            serializable validation
                            commit-time revocation
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                   abort                         commit
                   (中止)                        (提交)
                     │                             │
                     ▼                             ▼
                 no change                     Space S(k+1)
                 (无变更)                       (空间新状态)
                                                   │
                 ┌─────────────────────────────────┼─────────────────────────────────┐
                 │                                 │                                 │
                 ▼                                 ▼                                 ▼
              elements                        tx history                       change stream
             (认知元素)                       (事务历史)                         (变更流)
                 │                                 │                                 │
                 └─────────────────────────────────┼─────────────────────────────────┘
                                                   ▼
                                                Receipt
                                                (回执)
                                                   │
                                                   ▼
                                           Future Cognition
                                              (未来认知)
```

---
# 348. 核心 KML 方程 (Core KML Equations)

```text
Proposition Update (命题更新)
    =
    create/resolve another Proposition
```

not:

```text
rewrite tuple
```

---

```text
Belief Revision (信念修正)
    =
    New Assertion
    +
    Optional Supersession
    +
    Provenance
```

not:

```text
UPDATE old confidence/value
```

---

```text
Evidence Correction (证据纠错)
    =
    New Evidence
    +
    Correction Lineage
```

not:

```text
overwrite historical artifact
```

---

```text
Mnemonic Forgetting (记忆遗忘)
    =
    memory_strength / retention evolution
```

not:

```text
truth confidence decay
```

---

```text
Identity Consolidation (身份合并)
    =
    canonical resolution change
    +
    preserved raw historical identity
```

not:

```text
rewrite all past references
```

---

```text
Cognitive Mutation
    ≠
Governance Mutation
```

---

```text
Derived Content
    ≠
Higher Authority
```

---

```text
Transaction Retry
    ≠
Repeated Experience
```

---

```text
KML Commit
    ≠
External World Commit
```

---
# 349. 核心最终原则 (Final Principle)

KIP 1.x 通过为智能体提供紧凑简洁的方式来：

```text
UPSERT
UPDATE
DELETE
MERGE
```

一张图，使知识变更在实践中成为可能。

KIP 2.0 则提出了一个更深层次的命题：

> **当图结构不再仅仅是事实数据库，而是智能体持久的认知历史时，变更究竟应当意味着什么？**

一个真正的大脑在完成每次重要写入后，必须能够明确回答：

> 究竟新观察到了什么？

> 哪个语义陈述仅仅是作为真值中立的命题被创建的？

> 究竟是谁断言了它？

> 调用者是在记录他人的陈述，还是凭借经过验证的代表权限在行动？

> 在那一刻存在哪些证据？

> 究竟是哪项活动产生了该派生结果？

> 新证据是修正了先前的信念，还是仅仅与另一个行动主体产生分歧？

> 如果信念改变了，我们是否依然能够完整重建旧信念？

> 如果证据有误，我们能否找回当初误导我们的历史产物？

> 维护周期是降低了可访问性，还是不当重写了置信度？

> 身份合并是否在不重写旧源引用的前提下改进了未来的接地？

> 派生技能是否继承了溯源信息而未非法继承可执行权限？

> 删除操作究竟是归档、逻辑删除还是物理清理？

> 反面证据是否可能已被静默擦除？

> 网络重试是否造成了重复的记忆？

> 权限被撤销的写入者是否依然成功提交了数据？

> 究竟是哪一个精确的模式版本赋予了每个字段和谓词确切含义？

> 是否有任何认知内容企图自行授予权限？

这些问题应当由协议的底层结构来给出答案，而不是寄希望于每个智能体的 Prompt 提示词都能自发遵守某种非正式约定。

统领全局的核心设计思想是：

> **只有当新的认知能够在改变未来的同时绝不篡改伪造过去，大脑才能实现安全可靠的学习。**

KML 2.0 正是承载这一变革的语言。
