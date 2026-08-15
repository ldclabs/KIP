## 🧬 KIP 2.0 语法速查手册（面向 LLM）

**[English](./KIPSyntax.md) | [中文](./KIPSyntax_CN.md)**

**完整规范**：[KIP-2.0-SPECIFICATION_CN.md](./KIP-2.0-SPECIFICATION_CN.md)（具有规范性效力；本手册为其精准提炼版）

KIP 2.0 是智能体（Agent）与持久化**认知中枢（Cognitive Nexus）**之间的认知状态交互协议。系统通过 **KQL**（`FIND`）读取数据，通过 **KML**（`ASSERT` / `MUTATE` / ...）变更认知状态，通过 **META**（`DESCRIBE` / `SEARCH` / `VERIFY` / ...）实现实体接地与自省。数据值与 JSON 兼容；关键字不区分 ASCII 大小写（规范推荐大写）；模式符号与字符串值严格区分大小写。

编写任何语句时，必须严格遵循以下不变式：

```text
命题存在 (Proposition exists)   ≠ 命题为真 (Proposition is true)  （原始 FIND ≠ BELIEF）
断言置信度 (Assertion confidence) ≠ 信任度 (trust) ≠ 记忆强度 (memory_strength) ≠ 显著性 (salience)
无可见匹配 (no visible match)    ≠ 为假 (false)                   （开放世界：依据不足，而非被证伪）
SEARCH 检索得分 (score)           ≠ 置信度 (confidence)
更正事实 (correction)            = 新建断言 + 废弃替代 (supersession)，严禁篡改历史
调用主体 (Principal)             ≠ 语义行动者 (semantic actor)      （记忆所指/所述的主体）
认知内容 (cognitive content)      ≠ 执行权限 (authority)            （记忆内容绝不能赋予权限）
批处理 (batch) ≠ 事务 (transaction)；超时 (timeout) ≠ 中止 (abort)；有进展 (progress) ≠ 已提交 (commit)
```

---

### 1. 数据模型

#### 1.1. 五大核心元素类型

| 类型 (Kind) | 说明 | 可变性 |
| :--- | :--- | :--- |
| **Concept（概念）** | 可引用的实体/类型化对象（`schema_ref`、`key`、`name`、`attributes`） | 可变状态 |
| **Proposition（命题）** | 价值中立的陈述三元组 `(subject, predicate, object)` | 不可变元组 |
| **Assertion（断言）** | 行动者对某一命题的立场陈述（`asserted_by`、`stance`、`mode`、`confidence`、`asserted_at`、`valid_time`、证据引用、生命周期） | 载荷不可变；通过新断言修订 |
| **Evidence（证据）** | 观测到的人工制品（`evidence_class`、载荷、`observed_at`） | 载荷不可变；通过血统链更正 |
| **Activity（活动）** | 溯源过程记录（`activity_class`、inputs → outputs） | 一旦进入终态即不可变 |

Profile 定义的对象（`Experience`、`Skill`、`Event` 等）属于类型化 Concept + Facet + 结构引用（Structural Reference），而非新增的核心底层类型。

#### 1.2. 数据存储定位（杜绝泛型元数据黑盒）

```text
语义载荷 (semantic payload)      → Concept attributes / 类型化字段
涉真主张 (truth-sensitive claim) → Proposition + Assertion (+ Evidence)
溯源信息 (provenance)            → Activity / 引擎 _system.origin
记忆状态 (mnemonic state)        → Facet (如 MnemonicState.memory_strength)
存储生命周期 (storage lifecycle)  → retention {retention_class, expires_at, legal_hold}
权限/可见性 (authority)          → Governance (绝不能通过认知层直接写入)
引擎真值 (engine truth)          → _system {version, created_at, updated_at, state, origin} (只读)
```

若某个属性值需要独立的来源、置信度、冲突裁决、时效性或历史追溯，必须将其提升为 Proposition + Assertion；否则保持为 Concept 的普通属性。

#### 1.3. 三类不同关系

```text
语义命题 (Semantic Proposition) (alice, "prefers", dark_mode)     可争议的世界陈述
结构引用 (Structural Reference) Experience ─has_step→ Step        记录拓扑结构；无需认知立场
切面 (Facet)                    元素局部的强校验扩展属性            如 MnemonicState
```

有序结构字段（如 `has_step`）会暴露从 0 开始的 `?edge.index`；顺序绝不代表因果关系——因果关系必须使用 `caused_by` 谓词以 Proposition + Assertion 形式声明。

#### 1.4. 标识符与引用

```text
id            引擎分配、不透明、不可变——真正的实体唯一标识
key           可选、不可变、空间局部逻辑键（幂等写入标识）
name          可变显示名/接地名称；允许重复；绝不能当作唯一标识
canonical_id  可选、跨系统已校验标识（受 Governance 保护）
client_key    单次历史创建操作的重试安全逻辑标识
```

未经严格核实的“两者为同一实体”主张，应使用 `same_as` Proposition + Assertion 表达（供人工或规则审核，严禁自动合并）。

#### 1.5. 词法与书写规则

```text
?name    变量 / KML 局部句柄                 :name    绑定参数（占据完整值位置）
"..."    JSON 字符串    数字/true/false/null   [...] 数组    {...} 对象
标识符: [A-Za-z_][A-Za-z0-9_]*             // 行尾注释
```

**仅用于本卡片**的记法：`[ ]` = 可选，`A | B` = 二选一，`<...>` = 占位符，`...` = 省略。绝不要把它们写进语句。真正的 KIP 方括号只出现在数组（`[1, "a"]`）与切面访问（`?x.facets["MnemonicState"]`）中；真正的 `|` 只出现在谓词备选之间（`"a" | "b"`）。

决定语句能否被解析的规则：

- 谓词、模式名（类型、切面、结构字段）、id 与枚举值都是**带引号的字符串**或 `:param`——绝不写裸词：`(?a, "prefers", ?b)`、`SET FACET "MnemonicState"`、`("has_step", ?s)`。对象键是裸标识符或带引号字符串；关键字可以作键（`{by: …, mode: …, key: …}`）。
- `WHERE { … }` 内各项以空白/换行分隔，**不加逗号**。逗号只出现在 `( )`、`{ }`、`[ ]`、参数列表以及 `FIND(...)` / `ORDER BY` 列表内部。
- 语句级子句顺序是固定的，即本卡片所示的顺序；只有 `CREATE ... { }` / `UPSERT ... { }` 语句体内部的子句可以任意排列。`true` / `false` / `null` 小写；关键字不区分大小写。
- 每个操作一条语句，不写 `;`。多条必须一起提交的变更 → 包进 `MUTATE { … }`。
- 参数采用结构化绑定，绝非字符串拼接；严禁将参数直接嵌入带引号的字符串内部。

---

### 2. KQL — 读取

```prolog
FIND(<projections>)
WHERE { <patterns and filters> }
[AS OF SEQ :seq | AS OF TX :tx | AS OF TIME :t]   // 认知历史：大脑在当时包含/确信的状态
[FOR TIME :world_time]                            // 现实生效时间：陈述在现实世界中适用的时间
[WITH EPISTEMIC { purpose: "...", risk: "low", policy: "...", include_historical: false,
                  include_hypothetical: false, explanation: "none|summary|ledger" }]
[ORDER BY <expr> [ASC|DESC], ...] [LIMIT :n] [CURSOR :cursor]   // 可多个排序键；默认 ASC；null 排最后
```

`AS OF` 与 `FOR TIME` 是相互独立的时间维度。“我当时相信什么？”需同时指定两者；“我现在认为当时的情况是什么？”仅指定 `FOR TIME`。投影可以是变量、点路径或聚合；普通表达式与聚合混用时，按普通表达式分组。

#### 2.1. 模式族

```prolog
?person {type: "Person", name: "Alice"}              // Concept（type 为 schema 语法糖；`?person CONCEPT {...}` 亦合法）
?exp {type: "Experience", attributes: {outcome_status: "failure"}}   // attributes/facets 以嵌套对象匹配（或对 ?exp.attributes.x 用 FILTER）
?p (?person, "works_for", ?org)                      // 原始 Proposition——仅代表存在，不代表为真
?p (?s, ?predicate, ?o)                              // 谓词变量 → 绑定精确谓词引用
?p (id: :prop_id)                                    // 同一槽位、按 id 寻址——也可作为 term 端点
(?drug, "treats", {type: "Symptom", name: "Headache"})   // term 可以是内联的 Concept 匹配、字面量或 :param
?s (?user, "stated", (?drug, "treats", ?symptom))    // ……或嵌套元组：对陈述作陈述
?a ASSERTION {proposition: ?p, asserted_by: ?actor, stance: "support", mode: "stated"}
?e EVIDENCE {evidence_class: "tool_result"}
?act ACTIVITY {activity_class: "inference", status: "completed"}
?edge STRUCTURAL (?experience, "has_step", ?step)    // 拓扑结构；有序字段可用 ?edge.index
?belief BELIEF (?person, "timezone", ?tz)            // 认识投影 (Epistemic Projection)（虚拟、只读）
?belief BELIEF (?p)                                  // 投影已绑定的命题
?belief BELIEF (id: :prop_id)                        // ……或已按 id 获知的命题（同一 id 形式）
?slot BELIEF SLOT (?person, "timezone")              // 完整功能槽位：候选值与冲突集
```

**BELIEF 输出**：`status` ∈ `accepted | rejected | contested | uncertain | insufficient`，附带支持度/反对度、不确定性、策略标识、时间基准。若对从未存储过的命题进行全量接地 BELIEF 查询，返回 `insufficient`（而非 0 行）。`BELIEF SLOT` 返回 `accepted_values` + `candidate_projections`。支持度与反对度得分之和不强制等于 1。`BELIEF` / `BELIEF SLOT` 仅限 `FIND`：绝不出现在变更语句的 `WHERE` 或 `EXPORT` 选择块中，且其谓词必须是确切谓词（不带路径算子）。

**选型准则**：回答“什么是真的？”使用 `BELIEF` / `BELIEF SLOT`。审计“谁基于什么证据说了什么？”使用原始 Proposition/Assertion/Evidence 模式。绝不能将原始数据行直接当作已被采信的信念。

#### 2.2. 表达式

```prolog
FILTER(?a.confidence > 0.8 && ?a.lifecycle.status == "active")   // == != < > <= >=   && || !
FILTER(IN(?x.name, ["A", "B"]))    // 亦支持：CONTAINS STARTS_WITH ENDS_WITH REGEX
FILTER(IS_NULL(?opt))              // IS_NOT_NULL IS_LITERAL IS_ELEMENT IS_KIND
NOT { (?person, "prefers", ?x) }   // = 无可见匹配；绝不代表现实世界中为假
OPTIONAL { ... }                   // 左连接；null 表示无可见匹配
UNION { ... }                      // 分支联合（独立作用域）
```

点路径访问：`?x.id` `?x.name` `?x.attributes.goal` `?a.lifecycle.status` `?x._system.version` `?x.facets["MnemonicState"].memory_strength` `?edge.index`；也可取整个对象（`?x.attributes`）。

聚合函数：`COUNT(?x)` `COUNT(DISTINCT ?x)` `SUM/AVG/MIN/MAX`。`COUNT = 0` 绝不证明陈述为假。

原始路径遍历（仅用于图遍历，不传播信念）：`(?x, "is_subclass_of"{0,5}, ?anc)`——量词 `{n}` `{m,}` `{m,n}`；分支备选 `(?x, "related_to" | "depends_on", ?y)`。

游标（Cursor）为不透明、绑定快照、特定模式族的凭证；翻页时当前 Governance 权限依然生效。

---

### 3. KML — 写入

KML 变更仅在事务（Transaction）内生效并持久化（全成功或全失败，附带提交回执）。

#### 3.1. `ASSERT` — 核心写入语法糖（规范推荐）

记录归属明确的主张是最常用的高频路径，优先使用语法糖：

```prolog
ASSERT (:alice, "prefers", :dark_mode) {
  by: :alice,              // 必填：语义行动者 → asserted_by
  mode: "stated",          // 必填：observed|stated|inferred|predicted|hypothetical|imported
  confidence: 0.95,        // 可选 [0,1]：当前立场的强度，非客观真理概率
  evidence: :msg,          // 可选：Evidence 引用或数组（推荐由运行时接入层注入）
  stance: "support",       // 可选，默认 support (support|reject|uncertain)
  at: :time,               // 可选 → asserted_at（默认：引擎事务时间）
  valid: {from: :t1, until: :t2},   // 可选 → valid_time（现实世界生效区间）
  key: :client_key         // 可选：重试安全的逻辑标识
}
```

事实更正（同一行动者更新先前的主张）：

```prolog
ASSERT ?a (:alice, "timezone", "+01:00") {   // 句柄 ?a 可选
  by: :alice, mode: "stated", evidence: :e2
} SUPERSEDING :old_assertion
```

该语法严格等价于 `ENSURE PROPOSITION` + `CREATE ASSERTION` (+ `SUPERSEDE`)，绝不伪造多余状态。元组必须是结构化的 `(s, "p", o)`：`(id: …)` 形式仅用于匹配，在此会被拒绝。展开的长形式——需要 `challenge` / `context` 角色引证或精细控制时使用：

```prolog
ENSURE PROPOSITION ?p (:alice, "prefers", :dark_mode)   // 解析或创建规范元组；[EXPECT VERSION 0] = 必须是新建
CREATE ASSERTION ?a {
  CLIENT KEY :a_key
  SET FIELDS { proposition: ?p, asserted_by: :alice, stance: "support", mode: "stated",
               confidence: 0.95, asserted_at: :time, valid_time: {from: :t1, until: :t2} }
  SET STRUCTURAL { ("evidence", :msg) {role: "support"} ("evidence", :counter) {role: "challenge"} }
}
```

立场判定规则：
- 他人陈述事实 → `ASSERT ... {by: <them>, mode: "stated"}`。记录“Alice 说了 X”不需要具备代表 Alice 的鉴权权限。
- 大脑自身推理得出结论 → `by: <self>, mode: "inferred"`，并将前提引用为证据。
- 不同行动者意见分歧 → 生成两条并存的 Assertion（状态为 contested），**严禁**直接废弃替代或删除对方断言。
- 否定某事实 → 针对肯定式命题建立 `stance: "reject"` 的断言，严禁伪造包含 `false` 的对象。

#### 3.2. Evidence — 严禁手动重新输入观测载荷

最佳实践：请求的**接入上下文（ingestion context）**直接基于传输层封包生成 Evidence；语句中只需引用 `:key`（见第 5.1 节）。若必须手动创建：

```prolog
CREATE EVIDENCE ?e {
  CLIENT KEY :e_key
  SET FIELDS { evidence_class: "tool_result", payload: :payload, observed_at: :time }
  SET STRUCTURAL { ("source", :actor) }
}
```

`CREATE EVIDENCE` / `CREATE ASSERTION` / `CREATE ACTIVITY` 共享同一语句体：`[CLIENT KEY]`、`SET FIELDS`、`SET FACET`*、`SET STRUCTURAL`——没有 `TYPE`/`NAME`/`SET ATTRIBUTES`（那些是 Concept 的子句）。发现证据有误时应建立更正链，严禁直接原地修改：`CORRECT EVIDENCE :old BY :new [EXPECT STATE "..."]`。

#### 3.3. 概念（Concept）

```prolog
CREATE CONCEPT ?exp {                       // 历史上独立的实体
  TYPE "Experience"
  CLIENT KEY :exp_key
  NAME "Deploy v2 failure"
  SET ATTRIBUTES { goal: :goal, outcome_status: "failure" }
  SET FACET "MnemonicState" { memory_strength: 0.8, salience: 0.9 }
  SET STRUCTURAL { ("has_step", ?s0) {index: 0} ("has_step", ?s1) {index: 1} }
}

UPSERT CONCEPT ?proj {                      // 具备稳定标识的 Concept
  MATCH { type: "Project", key: "kip-2" }   // 标识匹配仅限 id/key；严禁仅凭 name 进行 upsert
  EXPECT VERSION :v                         // 可选；0 = 仅创建
  SET FIELDS { name: "KIP 2.0" }
}
```

子句清单（花括号内顺序不限，除 `SET/UNSET FACET` 外每种至多一次）：`CREATE CONCEPT`——`TYPE`（必填）、`CLIENT KEY`、`NAME`、`SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`。`UPSERT CONCEPT`——`MATCH`（必填）、`EXPECT VERSION`、`SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`、`UNSET ATTRIBUTES | FACET | STRUCTURAL`。`MATCH { type: "Person", key: "alice" }` 可创建；`MATCH { id: :id }` 仅匹配已有元素。值该写在哪：核心字段（`name`、`key`）→ `SET FIELDS`；模式声明的属性（`goal`、`status` 等）→ `SET ATTRIBUTES`；Profile 切面值 → `SET FACET "Facet"`；引用 → `SET STRUCTURAL`。

#### 3.4. `MUTATE` — 原子认知状态迁移

```prolog
MUTATE {
  CREATE EVIDENCE ?e {...}
  ASSERT ?a (:alice, "timezone", "+01:00") { by: :alice, mode: "stated", evidence: ?e }
    SUPERSEDING :a_old
  CREATE ACTIVITY ?rev {
    SET FIELDS { activity_class: "belief_revision", status: "completed" }
    SET STRUCTURAL { ("inputs", :a_old) ("inputs", ?e) ("outputs", ?a) }
  }
}
```

局部句柄（`?e`, `?a`）的作用域限定在块内，支持前向引用；引擎会对整图进行校验，随后原子性全量提交。`MUTATE` 可容纳除另一个 `MUTATE` 之外的任意 KML 语句。

#### 3.5. UPDATE — 仅用于可变状态

```prolog
UPDATE ?m [EXPECT VERSION :v]
SET FACET "MnemonicState" {
  memory_strength: CLAMP(MUL(?m.facets["MnemonicState"].memory_strength, :decay), 0, 1)
}
WHERE { ?m {type: "Experience"} FILTER(...) }
LIMIT :n
```

动作（一个或多个，位于此处）：`SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL` 与 `UNSET ATTRIBUTES | FACET | STRUCTURAL`——每个 SET 都有对应的 UNSET；`UNSET STRUCTURAL { ("has_step", ?wrong_step) }` 移除一条引用（有序字段重新致密化；基数受校验）。更新表达式：`ADD`、`MUL`、`CLAMP`、`COALESCE`（针对每个目标确定性计算；操作数只能读取目标自身的路径）。UPDATE 绝不执行创建。直接引用目标无需 `WHERE`：`UPDATE :id SET FACET "MnemonicState" {salience: 0.9}`（与 ARCHIVE/TOMBSTONE/PURGE/SET RETENTION/RETRACT 同一规则——`?var` 目标由 WHERE 绑定，`:id`/`"id"` 已经指名了元素）。

**UPDATE 严禁触碰的区域**：Proposition 元组、Assertion 认识载荷（stance/confidence/actor/time）、Evidence 载荷、终态 Activity 拓扑、`_system`、Governance、Schema。违规操作将抛出 `EpistemicRevisionRequired` 或 `ImmutableField`。**严禁随时间推移衰减 Assertion 置信度**——未被调用的记忆衰减的是 `memory_strength`；时效性由认识投影负责；认知更新必须创建新 Assertion。

#### 3.6. 生命周期与移除（四类不同操作）

```prolog
RETRACT ASSERTION :a [WHERE {...}] [LIMIT :n] [EXPECT STATE "active"]   // 断言者撤回自身的主张
SUPERSEDE ASSERTION :old BY ?new [EXPECT STATE "active"]               // 同一行动者/血统链的版本迭代——非分歧
TRANSITION ACTIVITY :act TO "completed"                                // 生命周期跃迁；可原子地一并敲定终态字段
  [SET FIELDS { ended_at: :t }] [SET STRUCTURAL { ("outputs", ?a) }] [EXPECT STATE "running"]
ARCHIVE :target [WHERE {...}] [LIMIT :n] [EXPECT STATE "..."]     // 移出常规召回范围；完整保留历史
TOMBSTONE :target [WHERE {...}] [LIMIT :n] [EXPECT STATE "..."]   // 逻辑删除；保留标识与审计记录
PURGE :target [WHERE {...}] [LIMIT :n]                             // 物理抹除；极端特殊操作
  [REFERENCE POLICY "deny_if_referenced"] CONFIRM "PURGE"          // 策略：deny_if_referenced | tombstone_reference | authorized_cascade
SET RETENTION :target { retention_class: "standard", expires_at: :t } [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
MERGE CONCEPT ?src INTO ?tgt [WHERE {...}] [EXPECT VERSION :v]
```

凡 `WHERE` 可能选中无界集合的变更语句，都在其后接受可选的 `LIMIT`（`UPDATE`、`RETRACT ASSERTION`、`SET RETENTION`、`ARCHIVE`、`TOMBSTONE`、`PURGE`）——请为你的扫描设界。`LIMIT` 限定影响的数量而非选择的对象：不要假定顺序。`MERGE CONCEPT` 不接受 `LIMIT`。

`MERGE CONCEPT` 为非破坏性合并：源节点作为已合并历史依然可寻址；后续新写入会自动规范化到目标节点。会制造环的合并（目标已传递解析回源）将被拒绝。

前置状态断言：`EXPECT VERSION :n`（乐观并发控制；`EXPECT VERSION 0` 代表仅允许新建）在 `UPDATE` 中紧跟目标之后、在 `UPSERT CONCEPT` 中位于 `MATCH` 之后、在 `ENSURE PROPOSITION` 中位于元组之后、在 `SET RETENTION` / `MERGE CONCEPT` 中位于最后；`EXPECT STATE "..."` 永远是生命周期语句的最后一个子句。

---

### 4. META — 接地、校验与自省

```prolog
DESCRIBE PRIMER [MODE "compact" | "full"]   // 获取标识、Space、模式映射、支持能力及安全不变式
DESCRIBE PROTOCOL | EXECUTION CONTEXT | CAPABILITIES | PROJECTION CAPABILITY   // CAPABILITIES：系统支持的能力 vs 当前调用者可用的能力
DESCRIBE SPACE [:space_id] | SCHEMA ENVIRONMENT [AS OF SEQ :s] | SNAPSHOT [AS OF SEQ :s]
DESCRIBE TYPE :t | PREDICATE :p | FACET :f | STRUCTURAL FIELD :sf | PACKAGE :pkg | COMPATIBILITY FROM :pkg_a TO :pkg_b
DESCRIBE ERROR :code | CAPSULE :artifact | EPISTEMIC POLICY [:id] | TRUST [:scope] | ACCESS [WITH {operation: "...", resource: :r}]
DESCRIBE TRANSACTION :tx_id | DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
LIST SPACES | TYPES | PREDICATES | FACETS | STRUCTURAL FIELDS | EPISTEMIC POLICIES [LIMIT :n] [CURSOR :c]
LIST SCHEMA PACKAGES [STATUS "active"] [LIMIT :n] [CURSOR :c]
HISTORY ELEMENT :id [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]   // 查看状态迁移时间线
HISTORY SPACE [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
CHANGES SINCE :cursor [LIMIT :n] | CHANGES AFTER SEQ :seq [LIMIT :n]   // 事务级变更流
SNAPSHOT [AS OF SEQ :s]                                                // AS OF 亦接受 TX :tx | TIME :t
VERIFY CAPSULE | SCHEMA PACKAGE | RECEIPT | BLOB | CHECKPOINT :artifact
VALIDATE KQL | KML | CAPSULE | SCHEMA PACKAGE | IMPORT PLAN :input [WITH {...}]
PREVIEW KML :cmd | PREVIEW IMPORT CAPSULE :capsule INTO :space
EXPORT CAPSULE ?roots WHERE {...}                                      // ?roots 由 WHERE 绑定，或用 :id / "id" 指定单个根
  [WITH {closure: "referential", provenance_depth: 2, include_schema: true, include_blobs: false, proof_profile: "..."}]
  [AS OF SEQ :s]
```

```prolog
SEARCH CONCEPT :term [WITH TYPE :type] [MODE "keyword" | "semantic" | "hybrid"]   // 子句顺序严格如此
  [THRESHOLD :t] [AS OF SEQ :s] [LIMIT :n] [CURSOR :c]      // 类别：CONCEPT | PROPOSITION | ASSERTION | EVIDENCE | ACTIVITY | COGNITION
SEARCH PROPOSITION :term [WITH PREDICATE :pred] [MODE "hybrid"] [LIMIT :n]   // AS OF SEQ 仅在运行时声明 historical_search 时可用
```

SEARCH 仅用于检索接地：检索得分 ≠ 置信度 ≠ 确信事实；未命中 ≠ 现实不存在；检索结果会声明索引版本 `index_seq`。标准流程为：**SEARCH 检索 → 锁定精确 id → BELIEF/FIND 精确查询**。

五层校验原则：`DESCRIBE/SEARCH`（定位） ≠ `VERIFY`（完整性） ≠ `VALIDATE`（合法性） ≠ `PREVIEW`（模拟执行效果） ≠ **Receipt**（实际提交生效的内容）。

---

### 5. 运行时请求封包

```json
{
  "kip": "2.0",
  "request_id": "req-42",
  "space": {"id": "space-1"},
  "execution": {"mode": "atomic", "idempotency_key": "formation:42"},
  "ingest": {"evidence": [{"key": "msg", "evidence_class": "user_statement",
                            "payload": "I prefer dark mode.", "observed_at": "...",
                            "source_actor": "alice", "client_key": "message:123"}]},
  "operations": [{"op_id": "op-1", "language": "KML", "command": "ASSERT (...) { ... evidence: :msg }",
                    "parameters": {}}]
}
```

- **执行模式（操作数 > 1 时必填）**：`independent`（相互隔离、并发执行） | `sequence`（有序执行、独立提交、先前步骤不回滚） | `atomic`（单一事务、单一快照、读己所写、全成功或全回滚）。
- **第 5.1 节 接入注入**：每个 `ingest.evidence[].key` 会绑定为运行时直接生成的 Evidence 参数——观测载荷绝不需要经由模型生成的指令文本中转。
- **三重标识体系**：`request_id`（单次网络请求） ≠ `idempotency_key`（单次逻辑写入意图） ≠ `tx_id`（已提交的事实记录）。对于相同的逻辑写入，重试时必须保持 `idempotency_key` **完全一致**。
- **响应结构**：顶层状态包含 `succeeded|failed|partial|outcome_unknown`；逐操作状态包含 `succeeded|failed|skipped|rolled_back|no_effect`；提交回执携带 `tx_id`、`space_seq` 及数据摘要。
- **超时 ≠ 中止**：网络丢包或响应丢失时，使用 `DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key` 查询或使用原请求/原幂等键重试。绝不能直接重新生成一份新记忆写入。

---

### 6. 认知记忆 Profile（速查）

核心类型：`Person`、`Event`（发生了什么）、`Experience`（目标导向轨迹；必须包含 `goal`、`outcome_status`）、`ExperienceStep`（`step_kind`: context|observation|decision|action|feedback|belief_update；`summary`；顺序由 has_step 边索引决定）、`Preference`（总结性产物——主张本身仍为 Proposition+Assertion）、`Insight`、`Commitment`（`status`: pending|fulfilled|cancelled|expired|blocked；`due_at` 与 retention 过期时间不同）、`Skill`（`skill_class`、`procedure`、`status`: candidate|validated|needs_review|deprecated|archived）、`SleepTask`、`SelfModel`。

核心谓词：`prefers`（Person→Concept）、`caused_by`（Step→Step，结果→起因，基于证据）、`same_as`（同一性主张 → 触发审核）。

核心 Facet：`MnemonicState {memory_strength, salience}`、`SkillUtility {utility, success_count, failure_count}`——取值均为 `[0,1]`，均不代表真假。

结构引用字段：`has_step`（有序）、`experienced_by`、`involves`、`mentions`、`about`、`derived_from`、`consolidated_to`、`compiled_from`、`compiled_by`、`committed_to`、`owed_to`、`assigned_to`；内置底层记录字段：`evidence`、`source`、`generated_by`、`inputs`、`outputs`。

核心不变式：失败的 Experience 是头等记忆；单次成功 ≠ 已验证的 Skill；已验证的 Skill ≠ 执行权限；SelfModel ≠ Governance 权限策略；导入的记忆保持 `mode: "imported"`，绝不会伪造成本地亲历传记。

---

### 7. 错误体系（据此自主纠错）

错误分类：`syntax`、`protocol`、`schema`、`data`、`epistemic`、`governance`、`transaction`、`history`、`search`、`artifact`、`resource`、`transport`、`system`。每个错误均包含 `code`、`hint` 与 `retry.class`：

```text
safe_same_request | requires_refresh | requires_different_input | requires_authority
| requires_new_snapshot | requires_reacquire_artifact | outcome_lookup_required | non_retryable
```

高频错误与修复方案：`SchemaSymbolAmbiguous`（改用精确的 `kip://pkg@ver/symbol`） · `SchemaSymbolNotFound`（先执行 DESCRIBE 了解结构，严禁臆造 schema） · `EpistemicRevisionRequired`（试图直接 UPDATE 信念历史 → 改用新 Assertion + SUPERSEDING） · `EvidenceCorrectionRequired`（→ 改用 CORRECT ... BY） · `VersionConflict`（重新读取、重新应用、携带最新 EXPECT VERSION 重试） · `IdempotencyConflict`（相同幂等键对应不同请求内容 → 更换新键） · `OutcomeUnknown`（→ 通过幂等键查询事务结果） · `NotFoundOrNotVisible`（目标可能存在于权限范围之外——绝不能得出“事实不存在”的结论） · `ReadonlyViolation` / `LanguageMismatch`（由实际解析出的语义规则裁定）。

---

### 8. 最佳实践指南

1. **写入前先接地**：使用 `SEARCH` + `DESCRIBE` 确定精确 id 与 schema 引用。持久化时使用确切版本号，严禁使用 `@latest`。
2. **高频路径 = `ASSERT` + 数据接入注入**：单条语句完成带归属的主张记录；证据由运行时直接生成并通过 `:key` 引用——绝不在生成的指令文本中复述观测载荷。
3. **涉真提问使用 `BELIEF`/`BELIEF SLOT`**：原始 `FIND` 仅用于审计、历史分析与冲突排查。对 `insufficient` 明确解释为“依据不足”，绝不能断言为“否”。
4. **更正标准规范**：新证据到达 → `ASSERT ... SUPERSEDING :old`（重大修订补充 `belief_revision` Activity）。不同主体间的分歧并存记录即可。
5. **单次认知状态跃迁 = 单个原子 MUTATE/事务**：Evidence+Assertion、Experience+Steps+Activity、更正+废弃替代均应打包，严禁残留不一致的半成品。
6. **记忆代谢仅触及 Facet**：衰减 `memory_strength`、调整 `salience`、更新 `SkillUtility`——Assertion 置信度仅可因认识论层面的证据变化而改变。
7. **数据移除阶梯**：archive（归档） → tombstone（墓碑） → purge（物理清除，需策略与二次确认）。合并操作是非破坏性的；疑似同一实体使用 `same_as` 主张加审核流处理。
8. **严格遵循幂等重试规范**：相同意图使用相同的 `idempotency_key`；不同物理现实的观测使用不同的 `client_key`。重试操作不等于生成新的 Experience。
9. **明确时间双轴**：`FOR TIME` 表示“现实世界的适用时效”，`AS OF` 表示“大脑当时所认知的内容”；两者结合方可还原完整认知历史。
10. **你是调用主体而非语义行动者**：`by:` 指明当前立场归属于谁；你记录该立场的权限源自 Governance，你的任何记忆写入操作都无法自行扩大自身的系统权限、信任度或模式定义。
