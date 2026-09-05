## 🧬 KIP 2.0 语法速查手册（面向 LLM）

**[English](./KIPSyntax.md) | [中文](./KIPSyntax_CN.md)**

**适用范围**：本手册是面向 LLM 的常用路径提炼版，覆盖当前 KQL/KML/META 的全部语句家族，但**不能**替代具有规范性效力的[完整规范](./KIP-2.0-SPECIFICATION_CN.md)、正式 [KQL](./grammar/KIP-2.0-KQL.ebnf) / [KML](./grammar/KIP-2.0-KML.ebnf) / [META](./grammar/KIP-2.0-META.ebnf) 语法，以及完整的[请求](./schemas/kip-request.schema.json) / [响应](./schemas/kip-response.schema.json) wire schema。若存在冲突，以完整规范为准。

KIP 2.0 是智能体（Agent）与持久化**认知中枢（Cognitive Nexus）**之间的认知状态交互协议。系统通过 **KQL**（`FIND`）读取数据，通过 **KML**（`ASSERT` / `MUTATE` / ...）变更认知状态，通过 **META**（`DESCRIBE` / `SEARCH` / `VERIFY` / ...）实现实体接地与自省。赋值与封包值兼容 JSON；Proposition 端点的范围更窄（见 §1.6）。关键字不区分 ASCII 大小写（规范推荐大写）；模式符号与字符串值严格区分大小写。

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

| 类型 (Kind)             | 说明                                                                                                                         | 可变性                     |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| **Concept（概念）**     | 可引用的实体/类型化对象（`schema_ref`、`key`、`name`、`attributes`）                                                         | 可变状态                   |
| **Proposition（命题）** | 价值中立的陈述三元组 `(subject, predicate, object)`                                                                          | 不可变元组                 |
| **Assertion（断言）**   | 行动者对某一命题的立场陈述（`asserted_by`、`stance`、`mode`、`confidence`、`asserted_at`、`valid_time`、证据引用、生命周期） | 载荷不可变；通过新断言修订 |
| **Evidence（证据）**    | 观测到的人工制品（`evidence_class`、载荷、`observed_at`）                                                                    | 载荷不可变；通过血统链更正 |
| **Activity（活动）**    | 溯源过程记录（`activity_class`、inputs → outputs）                                                                           | 一旦进入终态即不可变       |

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
schema_ref    精确模式包版本，用于持久化存储与校验；匹配、键唯一性与命题身份使用
              符号谱系 LINEAGE（包路径 + 符号），包升级绝不会割裂记忆（规范 §20.14）
```

未经严格核实的“两者为同一实体”主张，应使用 `same_as` Proposition + Assertion 表达（供人工或规则审核，严禁自动合并）。

#### 1.5. 词法与书写规则

```text
?name    变量 / KML 局部句柄                 :name    绑定参数（占据完整值位置）
"..."    JSON 字符串    数字/true/false/null   [...] 数组    {...} 对象
标识符: [A-Za-z_][A-Za-z0-9_]*             // 行尾注释
```

**仅用于本卡片**的记法：`[ ]` = 可选，`A | B` = 二选一，`<...>` = 占位符，`...` = 省略。绝不要把它们写进语句。这类模板统一使用 `text` 代码块；标为 `kip` 的代码块均为完整可执行命令。真正的 KIP 方括号出现在数组（`[1, "a"]`）与带引号键的路径访问（`?x.facets["MnemonicState"]`、`?x["exact-key"]`）中；真正的 `|` 只出现在谓词备选之间（`"a" | "b"`）。

决定语句能否被解析的规则：

- 谓词、模式名（类型、切面、结构字段）、id 与枚举值都是**带引号的字符串**或 `:param`——绝不写裸词：`(?a, "prefers", ?b)`、`SET FACET "MnemonicState"`、`("has_step", ?s)`。对象键是裸标识符或带引号字符串；关键字可以作键（`{by: …, mode: …, key: …}`）。
- `WHERE { … }` 内各项以空白/换行分隔，**不加逗号**。逗号只出现在 `( )`、`{ }`、`[ ]`、参数列表以及 `FIND(...)` / `ORDER BY` 列表内部。
- 语句级子句顺序是固定的，即本卡片所示的顺序；只有 `CREATE ... { }` / `UPSERT ... { }` 语句体内部的子句可以任意排列。`true` / `false` / `null` 小写；关键字不区分大小写。
- 每个操作一条语句，不写 `;`。多条必须一起提交的变更 → 包进 `MUTATE { … }`。
- 参数采用结构化绑定，绝非字符串拼接；严禁将参数直接嵌入带引号的字符串内部。

#### 1.6. Proposition 端点规则

```text
subject    仅限本地 Element 引用；绝不能是 Literal
predicate  带引号的精确 Schema 符号或 :parameter（绑定变量属于读取模式语法）
object     本地 Element 引用，或 Predicate Schema 允许的标量 Literal
```

基线 Core Literal 仅包括有限 JSON `string | number | boolean | null`。数组与任意对象可以作为赋值/封包值，但**不是**基线 Proposition Literal；结构化语义值应建模为类型化 Concept 或 Schema 定义的值对象。`null` 仅在 Predicate Schema 允许时合法。term 中的 `{type: ...}` 是内联 Concept 匹配，而不是任意对象 Literal。

---

### 2. KQL — 读取

```text
FIND(<projections>)
WHERE { <patterns and filters> }
[AS OF SEQ :seq]                                  // 认知历史：大脑当时所包含/相信的内容（tx id 或时间戳通过 DESCRIBE TRANSACTION / DESCRIBE SNAPSHOT AT TIME 转为 seq）
[FOR TIME :world_time]                            // 世界有效时间：在现实世界什么时间适用
[WITH EPISTEMIC { purpose: "...", risk: "low", policy: "...", include_historical: false,
                  include_hypothetical: false, explanation: "none|summary|ledger" }]
[ORDER BY <expr> [ASC|DESC], ...] [LIMIT :n] [CURSOR :cursor]   // 多排序键；默认 ASC；null 排最后
```

`AS OF` 和 `FOR TIME` 是相互独立的正交时间轴。“大脑在认知时间点 C 相信什么？” = `AS OF C`；“大脑在认知时间点 C 对现实时间点 W 持何种信念？” = `AS OF C` + `FOR TIME W`；“大脑当前对现实时间点 W 持何种信念？” = 仅使用 `FOR TIME W`。投影项可为变量、点路径表达式或聚合；混合普通表达式与聚合将按普通表达式分组。

```kip
FIND(?belief.status, ?timezone)
WHERE {
  ?person {type: "Person", key: "alice"}
  ?belief BELIEF (?person, "timezone", ?timezone)
}
WITH EPISTEMIC {purpose: "answer_user", risk: "low", explanation: "summary"}
LIMIT 10
```

#### 2.1. 模式家族

```text
?person {type: "Person", name: "Alice"}              // Concept (type 属于 schema 糖；`?person CONCEPT {...}` 亦合法)
?exp {type: "Experience", attributes: {outcome_status: "failure"}}   // attributes/facets 作为嵌套对象匹配 (或使用 FILTER(?exp.attributes.x))
?p (?person, "works_for", ?org)                      // 原始 Proposition —— 代表存在性，而非信念真假
?p PROPOSITION (?person, "works_for", ?org)          // 显式形式；PROPOSITION 与 ?p 均可独立缺省
?p (?s, ?predicate, ?o)                              // 谓词变量 → 绑定精确 predicate ref
?p (id: :prop_id)                                    // 同一槽位，按 id 定位 —— 亦可用作 term
(?drug, "treats", {type: "Symptom", name: "Headache"})   // term 可以是内联 Concept 匹配、字面量或 :param
?s (?user, "stated", (?drug, "treats", ?symptom))    // ... 或嵌套元组：对陈述的陈述
?a ASSERTION {proposition: ?p, asserted_by: ?actor, stance: "support", mode: "stated"}
?e EVIDENCE {evidence_class: "tool_result"}
?act ACTIVITY {activity_class: "inference", status: "completed"}
?edge STRUCTURAL (?experience, "has_step", ?step)    // 拓扑边；有序字段提供 ?edge.index
STRUCTURAL (?experience, "has_step", ?step)          // 边的绑定变量是可选的
?belief BELIEF (?person, "timezone", ?tz)            // 认知投影 (虚拟只读视图)
?belief BELIEF (?p)                                  // 投影一个已绑定的 Proposition
?belief BELIEF (id: :prop_id)                        // ... 或已知 id 的命题 (相同 id 形式)
?slot BELIEF SLOT (?person, "timezone")              // 整个函数槽位：候选值 + 冲突集
```

**BELIEF 输出**：`status` ∈ `accepted | rejected | contested | uncertain | insufficient`，`leading` ∈ `support | opposition | none`（在 `contested` 状态下占优势的一方；仅作信息披露，绝非最终裁定），加上支持/反对依据、不确定性信息、生效策略标识与时间基准。对一个从未存储过的命题进行充分绑定的 BELIEF 查询将返回 `insufficient`（而非 0 行结果）。BELIEF SLOT 返回 `accepted_values` + `candidate_projections`。支持度与反对度得分之和不强制为 1。`BELIEF` / `BELIEF SLOT` 仅用于 `FIND`：绝不能出现在 mutation 的 `WHERE` 块或 `EXPORT` 选择集内，且其谓词必须是精确名称（不支持路径运算符）。

**合并（Merges）**：原始 Proposition 模式会穿透 `merged_into` 匹配——查询 term 包含 `B` 能检索出记录在已合并至 `B` 的 `A` 上的元组，term 包含 `A` 也能检索出来。`?p.subject` / `?p.object` 暴露物理存储端点，`?p.canonical_subject` / `?p.canonical_object` 暴露经合并解析后的端点；元组本身永远不会被改写。

**选用原则**：回答“什么是真的？” → `BELIEF` / `BELIEF SLOT`。审计“谁在什么依据下说了什么？” → 原始 Proposition / Assertion / Evidence 模式。严禁把原始存储的行直接当作已接受的信念呈现给用户。

#### 2.2. 表达式

```text
FILTER(?a.confidence > 0.8 && ?a.lifecycle.status == "active")   // == != < > <= >=   && || !
FILTER(IN(?x.name, ["A", "B"]))    // 以及: CONTAINS STARTS_WITH ENDS_WITH REGEX
FILTER(IS_NULL(?opt))              // IS_NOT_NULL IS_LITERAL IS_ELEMENT IS_KIND LITERAL_TYPE
NOT { (?person, "prefers", ?x) }   // = 无可见匹配；绝不代表现实世界为假
OPTIONAL { ... }                   // 左连接；null = 无可见匹配
UNION { ... }                      // 分支选择（作用域相互独立）
```

点路径：`?x.id` `?x.name` `?x.attributes.goal` `?a.lifecycle.status` `?x._system.version` `?x.facets["MnemonicState"].memory_strength` `?x["exact-key"]` `?edge.index`；支持访问整个对象（`?x.attributes`）。

聚合操作：`COUNT(?x)` `COUNT(DISTINCT ?x)` `SUM/AVG/MIN/MAX`。`COUNT = 0` 绝不证明命题为假。

原始路径（仅用于图遍历，不传播信念）：`(?x, "is_subclass_of"{0,5}, ?anc)` —— 量词 `{n}` `{m,}` `{m,n}`；备选路径 `(?x, "related_to" | "depends_on", ?y)`。

游标是不透明的、锁定快照的、绑定于操作族的；游标继续翻页时当前 Governance 权限依然生效。

---

### 3. KML — 写入

KML 变更仅通过事务持久化生效（全有或全无原子性，以回执 Receipt 确认）。

#### 3.1. `ASSERT` — 高频日常写入（语法糖，规范性定义）

记录带归属的立场陈述是最常用路径，推荐使用语法糖：

```kip
ASSERT (:alice, "prefers", :dark_mode) {
  by: :alice,              // 必需：语义行动者 → asserted_by
  mode: "stated",          // 必需：observed|stated|inferred|predicted|hypothetical|imported
  confidence: 0.95,        // 可选 [0,1]：本立场陈述的强度，绝非客观真值概率
  evidence: :msg,          // 可选：Evidence 引用或数组（推荐使用摄取上下文 Evidence）
  stance: "support",       // 可选，默认 support (support|reject|uncertain)
  at: :time,               // 可选 → asserted_at（默认：引擎事务时间）
  valid: {from: :t1, until: :t2},   // 可选 → valid_time（现实世界有效区间）
  key: :client_key         // 可选：重试安全的客户端逻辑键
}
```

修订——同一行动者此前的陈述被证明是错的：

```kip
ASSERT ?a (:alice, "timezone", "+01:00") {   // 句柄 ?a 是可选的
  by: :alice, mode: "stated", evidence: :e2
} SUPERSEDING :old_assertion
```

世界变迁——世界本身发生了变化，旧断言在当时是正确的。绝不能因其过时而将其作为错误标记为 superseded；应通过重新断言关闭其开放区间，并在其结束处开启新断言的有效区间（两者均保持 active 状态；在变迁之前的 `FOR TIME` 查询仍返回旧值）：

```text
ASSERT (:alice, "timezone", "+08:00") {by: :alice, mode: "stated", valid: {from: :since, until: :moved_at}, evidence: :msg} SUPERSEDING :old_assertion
ASSERT (:alice, "timezone", "+01:00") {by: :alice, mode: "stated", valid: {from: :moved_at}, evidence: :msg}
```

该语法糖精确脱糖为 `ENSURE PROPOSITION` + `CREATE ASSERTION`（+ 通过新断言 `TRANSITION ... TO "superseded" BY` 旧断言）。绝不无端捏造额外状态。三元组必须是结构化的 `(s, "p", o)`：`(id: …)` 仅用于读取匹配，在写入时会被拒绝。用于 `challenge` / `context` 证据引用或精细控制的完整写法：

```kip
MUTATE {
  ENSURE PROPOSITION ?p (:alice, "prefers", :dark_mode)
  CREATE ASSERTION ?a {
    CLIENT KEY :a_key
    SET FIELDS { proposition: ?p, asserted_by: :alice, stance: "support", mode: "stated",
                 confidence: 0.95, asserted_at: :time, valid_time: {from: :t1, until: :t2} }
    SET STRUCTURAL { ("evidence", :msg) {role: "support"} ("evidence", :counter) {role: "challenge"} }
  }
}
```

仅当必须明确断言新建而非解析现有命题时，才在 `ENSURE PROPOSITION` 元组之后追加 `EXPECT VERSION 0`。

立场规则：

- 他人告知事实 → `ASSERT ... {by: <them>, mode: "stated"}`。记录“Alice 说了 X”不需要拥有*代表* Alice 的权限：`by` 指向未绑定的行动者需要 `record_attributed_assertion` 权限；`by` 指向自己需要 `assert` 权限；以受保护行动者的名义*代理*发言则需要 `assert_as_actor` 及绑定。
- `SUPERSEDING` 意味着“原陈述是错的”。不再适用的事实并不是错误的：应通过重新断言为旧断言补充 `valid.until`，并为新断言标明 `valid.from`。
- 大脑自身推理得出 → `by: <self>, mode: "inferred"`，将前提作为证据引用。
- 行动者之间意见不合 → 两条断言共存（产生争议 contested），**绝不能**废弃替代或删除。
- 否定事实 → 对正面肯定命题表达 `stance: "reject"`，而不是捏造 `false` 对象。

#### 3.2. 证据（Evidence）— 严禁直接重复键入观测内容

推荐做法：通过请求的**摄取上下文（ingestion context）**直接由传输层信封生成 Evidence；智能体仅引用其 `:key`（见 §5.1）。如需手动创建：

```kip
CREATE EVIDENCE ?e {
  CLIENT KEY :e_key
  SET FIELDS { evidence_class: "tool_result", payload: :payload, observed_at: :time }
  SET STRUCTURAL { ("source", :actor) }
}
```

`CREATE EVIDENCE` / `CREATE ASSERTION` / `CREATE ACTIVITY` 共享统一的语句体：`[CLIENT KEY]`、`SET FIELDS`、`SET FACET`*、`SET STRUCTURAL` —— 不使用 `TYPE`/`NAME`/`SET ATTRIBUTES`（这些是 Concept 专属子句）。错误的证据只更正、不编辑：`TRANSITION :old TO "corrected" BY :new`。

#### 3.3. 概念（Concept）

```kip
CREATE CONCEPT ?exp {                       // 历史唯一的全新实体
  TYPE "Experience"
  CLIENT KEY :exp_key
  NAME "Deploy v2 failure"
  SET ATTRIBUTES { goal: :goal, outcome_status: "failure" }
  SET FACET "MnemonicState" { memory_strength: 0.8, salience: 0.9 }
  SET STRUCTURAL { ("has_step", :s0) {index: 0} ("has_step", :s1) {index: 1} }
}
```

```kip
UPSERT CONCEPT ?proj {                      // 具备稳定标识的可变 Concept
  MATCH { type: "Project", key: "kip-2" }   // 标识 = type + id/key; 严禁仅基于 name 进行 upsert
  SET FIELDS { name: "KIP 2.0" }
} EXPECT VERSION :v                         // 可选的尾部版本守卫；0 = 仅新建
```

子句规则（大括号内可任意排列，除 `SET/UNSET FACET` 外各子句至多出现一次）：`CREATE CONCEPT` —— `TYPE`（必填）、`CLIENT KEY`、`NAME`、`SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`。`UPSERT CONCEPT` —— `MATCH`（必填）、`SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`、`UNSET ATTRIBUTES | FACET | STRUCTURAL`，大括号闭合后跟 `EXPECT VERSION`。`MATCH { type: "Person", key: "alice" }` 允许新建；`MATCH { id: :id }` 仅匹配现有对象。`type` 不是装饰字段：`key` 是其类型*内部*的唯一标识（Person 与 Preference 可以共享 key `alice`），在创建时它是新 Concept 类型的唯一来源——因此缺失 type 且需要新建的 upsert 会被拒绝，同时匹配两个 Concept 的裸 `{key: …}` 会触发 `IdentityConflict`。字段归属：核心系统字段（`name`, `key`）→ `SET FIELDS`；Schema 声明的业务属性（`goal`, `status`, …）→ `SET ATTRIBUTES`；Profile 切面值 → `SET FACET "Facet"`；拓扑引用 → `SET STRUCTURAL`。

#### 3.4. `MUTATE` — 原子认知变迁块

```kip
MUTATE {
  CREATE EVIDENCE ?e {
    CLIENT KEY :e_key
    SET FIELDS { evidence_class: "user_statement", payload: :payload, observed_at: :time }
    SET STRUCTURAL { ("source", :alice) }
  }
  ASSERT ?a (:alice, "timezone", "+01:00") { by: :alice, mode: "stated", evidence: ?e }
    SUPERSEDING :a_old
  CREATE ACTIVITY ?rev {
    SET FIELDS { activity_class: "belief_revision", status: "completed" }
    SET STRUCTURAL { ("inputs", :a_old) ("inputs", ?e) ("outputs", ?a) }
  }
}
```

句柄（`?e`, `?a`）仅在块内部有效；允许前向引用；引擎会对整张变迁图进行预校验，随后全有或全无提交。`MUTATE` 块内可以包含除嵌套 `MUTATE` 以外的任何 KML 语句。

#### 3.5. UPDATE — 仅用于可变状态

```kip
UPDATE ?m
SET FACET "MnemonicState" {
  memory_strength: CLAMP(MUL(?m.facets["MnemonicState"].memory_strength, :decay), 0, 1)
}
WHERE {
  ?m {type: "Experience"}
  FILTER(?m.facets["MnemonicState"].memory_strength > 0)
}
LIMIT :n
EXPECT VERSION :v OF FACET "MnemonicState"
```

变更动作（一或多个，位于该位置）：`SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL` 以及 `UNSET ATTRIBUTES | FACET | STRUCTURAL`。`SET FIELDS` 刻意**不提供** `UNSET FIELDS`；仅允许进行符合模式规范的核心字段赋值。精确清除形式：

```kip
UPDATE :concept_id
UNSET ATTRIBUTES {obsolete, "legacy-field"}
UNSET FACET "MnemonicState" {salience}
UNSET STRUCTURAL { ("has_step", :wrong_step) }
```

`UNSET ATTRIBUTES` / `UNSET FACET` 包含逗号分隔的字段名列表，而不是 `{field: null}` 赋值。`UNSET STRUCTURAL` 移除一个具名引用；有序字段将重新紧凑编号并验证基数限制。通过 UPDATE 执行的 `SET/UNSET STRUCTURAL` 仅适用于可变的 Concept 拓扑。Assertion 和 Evidence 的引用与拓扑是不可变的；处于 pending 状态的 Activity 仅能通过 `TRANSITION ... TO "completed" SET STRUCTURAL` 一次性固化拓扑，终态 Activity 的拓扑完全不可变。

更新表达式：`ADD` `MUL` `CLAMP` `COALESCE`（确定性，按目标独立求值；操作数只能读取目标自身的路径）。UPDATE 绝不负责新建。直接指定目标对象时无需 `WHERE` 子句：`UPDATE :id SET FACET "MnemonicState" {salience: 0.9}`（与 TRANSITION/PURGE/SET RETENTION 规则一致——`?var` 目标由 WHERE 绑定，`:id`/`"id"` 则直接指明元素）。

**UPDATE 严禁触碰**：Proposition 元组、Assertion 涉真载荷与引用、Evidence 载荷与拓扑、终态 Activity 拓扑、`_system` 内部状态、Governance 治理面、Schema 模式包。处于 pending 状态的 Activity 使用 `TRANSITION` 固化字段与拓扑；终态 Activity 不可变。尝试非法重写将触发 `EpistemicRevisionRequired` / `EvidenceCorrectionRequired` / `ImmutableField`。**严禁随时间推移衰减断言置信度（Assertion confidence）**——置信度代表表达时的坚信程度，记忆不用会降低 `memory_strength`；过期处理是投影的职责；产生新认知应创建新断言。

#### 3.6. 生命周期与移除 — 统一 `TRANSITION`，目标状态命名动作

```text
TRANSITION :a TO "retracted" [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]   // 断言者撤回自身的主张
TRANSITION :old TO "superseded" BY ?new                                    // 同一行动者的主张被证明错误 —— 非观点分歧，非世界变迁
TRANSITION :old TO "corrected" BY :new                                     // 证据错误：建立新记录与血统链，严禁原位编辑
TRANSITION :act TO "completed" [SET FIELDS {ended_at: :t}] [SET STRUCTURAL {("outputs", ?a)}]   // Activity: running|completed|failed|cancelled; 可原子固化
TRANSITION :target TO "archived" [WHERE {...}] [LIMIT :n]                  // 移出常规召回视图；历史完全保留
TRANSITION :target TO "tombstoned" [WHERE {...}] [LIMIT :n]                // 逻辑删除；身份标识与审计线索保留
PURGE :target [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]                 // 物理彻底抹除；受严格控制的高危操作
  [REFERENCE POLICY "deny_if_referenced"] CONFIRM "PURGE"                  // 策略: deny_if_referenced | tombstone_reference | authorized_cascade
PURGE PAYLOAD :evidence [WHERE {...}] [LIMIT :n] CONFIRM "PURGE"           // 仅清除 Evidence 数据载荷；记录元数据、摘要、引用与溯源完整保留
SET RETENTION :target { retention_class: "standard", expires_at: :t } [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
MERGE CONCEPT ?src INTO ?tgt [WHERE {...}] [EXPECT VERSION :v]
```

引擎会根据目标类型及其当前生命周期状态对流转动作进行合法性校验：Assertion 可流转至 `retracted` 或 `superseded`（通过 `BY` 指定新断言），Evidence 可流转至 `corrected`（通过 `BY` 指定新证据），Activity 可流转至 `running` 或终态，任意元素均可流转至 `archived` 或 `tombstoned`。从非法状态发起的流转将直接报错 `InvalidLifecycleTransition`，因此协议无需 `EXPECT STATE` 守卫。

所有其 `WHERE` 块可能选中无界集合的变更语句，都支持紧随其后的可选 `LIMIT`（`UPDATE`, `TRANSITION`, `SET RETENTION`, `PURGE`, `PURGE PAYLOAD`）——对批处理维护操作进行范围限制。`LIMIT` 仅限制受影响的最大数量，不保证特定顺序：除非运行时显式声明，否则不要假设特定顺序。`MERGE CONCEPT` 不接受 `LIMIT`。

`MERGE CONCEPT` 属于非破坏性操作：源实体作为历史合并记录依然保持可寻址；未来的写入将自动规范化指向目标实体。导致环状依赖的合并（目标已解析回源实体）将被拒绝。

前置条件：`EXPECT VERSION :n [OF ATTRIBUTES | STRUCTURAL | RETENTION | FACET "X"]`（乐观并发控制；`0` = 仅新建；指定平面仅守卫该平面自身的版本计数器，使状态裁决与切面扫描互不抢锁）始终位于变更语句的**最后**——排在 `WHERE` 和 `LIMIT` 之后、`UPSERT` 大括号闭合之后、`ENSURE PROPOSITION` 元组之后——并且可以重复声明，每个平面限守卫一条。

---

### 4. META — 实体接地、验证与自省

```text
DESCRIBE PRIMER [MODE "compact" | "full" | :mode]   // 身份、空间、执行上下文、模式映射、能力集与安全不变式
DESCRIBE PROTOCOL | CAPABILITIES                      // CAPABILITIES: 支持能力 vs 可用能力 (针对当前调用者)，包含投影能力
DESCRIBE SPACE ["space-id" | :space_id]
DESCRIBE SCHEMA ENVIRONMENT [AS OF SEQ :s]
DESCRIBE SNAPSHOT [AS OF SEQ :s | AT TIME :t]         // 快照坐标；AT TIME 可将时间戳解析为 seq
DESCRIBE TYPE :t | PREDICATE :p | FACET :f | STRUCTURAL FIELD :sf | PACKAGE :pkg | COMPATIBILITY FROM :pkg_a TO :pkg_b
DESCRIBE ERROR :code | CAPSULE :artifact | EPISTEMIC POLICY [:id] | TRUST [:scope] | ACCESS [WITH {operation: "...", resource: :r}]
DESCRIBE TRANSACTION :tx_id | DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
LIST SPACES | TYPES | PREDICATES | FACETS | STRUCTURAL FIELDS | EPISTEMIC POLICIES [LIMIT :n] [CURSOR :c]
LIST SCHEMA PACKAGES [STATUS "active" | :status] [LIMIT :n] [CURSOR :c]
LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c]   // 遍历 Activity inputs→outputs (+派生字段) 枚举从某一元素派生出的认知
HISTORY ELEMENT :id [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]   // 状态变迁编年史
HISTORY SPACE [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
CHANGES SINCE :cursor [LIMIT :n] | CHANGES AFTER SEQ :seq [LIMIT :n]   // 事务粒度变更流
VERIFY CAPSULE | SCHEMA PACKAGE | RECEIPT :artifact
VALIDATE KQL | KML | CAPSULE | SCHEMA PACKAGE | IMPORT PLAN :input [WITH {...}]
PREVIEW KML :cmd | PREVIEW IMPORT CAPSULE :capsule INTO :space
EXPORT CAPSULE ?roots WHERE {...}                                      // ?roots 由 WHERE 绑定，或使用 :id / "id" 指定单个根
  [WITH {closure: "referential", provenance_depth: 2, include_schema: true, include_blobs: false, proof_profile: "..."}]
  [AS OF SEQ :s]
```

```text
SEARCH <KIND> :term
  [WITH TYPE :type] [WITH PREDICATE :pred]
  [MODE "keyword" | "semantic" | "hybrid" | :mode]
  [THRESHOLD :t] [AS OF SEQ :s] [LIMIT :n] [CURSOR :c]

KIND = CONCEPT | PROPOSITION | ASSERTION | EVIDENCE | ACTIVITY | COGNITION
```

SEARCH 的所有修饰子句必须严格遵循上述顺序。`WITH TYPE` / `WITH PREDICATE` 仅在对所选类型有意义时使用；由运行时语义校验决定其适用性。`AS OF SEQ` 要求运行时声明具备 `historical_search` 能力。

```kip
SEARCH CONCEPT :term
WITH TYPE :type
MODE "hybrid"
THRESHOLD :threshold
LIMIT :limit
```

SEARCH 仅用于关联接地：得分 (score) ≠ 置信度 ≠ 信念；未搜到 ≠ 不存在；结果必须披露 `index_seq` 索引新鲜度。推荐工作流黄金路径：**SEARCH → 获取精确 ID → 执行 BELIEF/FIND**。

五层安全纪律：`DESCRIBE/SEARCH`（定位发现）≠ `VERIFY`（完整性校验）≠ `VALIDATE`（语法与规则合法性）≠ `PREVIEW`（影响模拟）≠ **Receipt**（实际持久化提交）。

---

### 5. 运行时信封（Runtime Envelope）

以下是一个完整的**常用请求示例**，非完整协议线上传输语法的全部穷举：

```json
{
  "kip": "2.0",
  "request_id": "req-42",
  "space": {"id": "space-1"},
  "execution": {"mode": "sequence", "idempotency_key": "formation:42"},
  "ingest": {
    "evidence": [{
      "key": "msg",
      "evidence_class": "user_statement",
      "payload": "I prefer dark mode.",
      "media_type": "text/plain",
      "observed_at": "2026-08-16T01:00:00Z",
      "source_actor": {"id": "concept-alice"},
      "client_key": "message:123"
    }]
  },
  "operations": [{
    "op_id": "op-1",
    "language": "KML",
    "command": "ASSERT (:alice, \"prefers\", :dark_mode) { by: :alice, mode: \"stated\", evidence: :msg }",
    "parameters": {
      "alice": {"id": "concept-alice"},
      "dark_mode": {"id": "concept-dark-mode"}
    }
  }]
}
```

#### 5.1. 摄取、执行与故障恢复

- **执行模式（Execution modes）**（包含 1 个以上操作时必填）：`independent`（相互隔离并发执行；每个结果独立返回其 `snapshot_seq`）| `sequence`（按序逐个提交，前面的提交不回滚；`on_error` 默认为 `stop`）| `atomic`（单一事务，单一致快照，read-your-writes，全有或全无）。`atomic` 是 `atomic_batch` 能力（§67.4、§75.3）：未声明该能力的引擎会拒绝请求，而不是降级成 sequence 执行；单个 `MUTATE` 块本身已是一个事务。在 `sequence`/`independent` 下每个写入操作的回执位于 `results[].receipt`；只有 `atomic` 具有顶层 `receipt`。`execution.idempotency_key` 将在响应中原样回显。
- **§5.1 摄取（Ingestion）**：每个 `ingest.evidence[].key` 都会成为绑定到运行时铸造的 Evidence 的参数——观测到的原始载荷无需穿透智能体生成的文本。每个条目必须且仅能提供 `payload` 或 `payload_artifact` 之一，并可携带 `facets`（例如 `outcome` 上的 `OutcomeRecord`）。写入 `outcome` 证据必须持有 `record_outcome` 权限；结果证据仅能通过 `inputs` 包含 `action_gate` 的 `outcome_observation` 活动来为特定决策打分。
- **三组身份标识**：`request_id`（网络层单次重试）≠ `idempotency_key`（单次逻辑写入意图）≠ `tx_id`（已提交事实）。重试同一逻辑写入时，必须使用**完全相同**的 idempotency key。
- **响应状态**：顶层状态包含 `succeeded|failed|partial|outcome_unknown`；逐操作状态包含 `succeeded|failed|skipped|rolled_back|no_effect`；提交成功的回执包含 `tx_id`、`space_seq` 及摘要信息。
- **超时 ≠ 中止**：网络丢失响应时，使用 `DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key` 确认状态，或使用完全相同的请求与幂等键重试。绝不能重新构建全新的认知。

#### 5.2. 完整网络传输层规范

完整的请求 Schema 还定义了 `compatibility_profile`、`read.snapshot_token`、`preconditions`、请求级 `parameters`、`context`、`requires`、`options`、命名空间化 `extensions`、操作级 `ast | command` 以及操作级幂等性/选项。绝不要自行发明信封字段：请依据 [`kip-request.schema.json`](./schemas/kip-request.schema.json) 进行校验；依据 [`kip-response.schema.json`](./schemas/kip-response.schema.json) 校验响应。

#### 5.3. 智能体加载与生成契约

阅读本速查手册仅掌握语言本身，而非具体部署环境的实体或 Schema。生产环境智能体必须同时获取这四项输入：

```text
1. 本语法速查卡                              静态语言规则与常用路径
2. execute_kip 工具 / 请求 JSON Schema       精确的传输层结构与参数绑定
3. DESCRIBE PRIMER + 针对性的 DESCRIBE        当前 Space、self 标识、Schema 引用、能力与配额
4. VALIDATE/PREVIEW + 结构化错误反馈          在实际写入前执行合法性检查与自愈修正循环
```

系统启动时或遇到 `requires_refresh` 错误后，调用 `DESCRIBE PRIMER`；在生成写入命令前必须对具体的类型、谓词、切面、结构字段和 id 进行接地。动态拼接或高风险命令应优先使用 `VALIDATE KQL :command` / `VALIDATE KML :command`（或等价的本地解析器）。解析通过和 VALIDATE 成功依然不是 commit；只有返回成功的 Receipt 回执才证明数据已被持久化。

---

### 6. 认知记忆 Profile（速查参考）

概念类型（Types）：`Person` `Event`（客观发生的事）`Experience`（目标导向的经历轨迹；必填 `goal`, `outcome_status`）`ExperienceStep`（`step_kind`: context|observation|decision|action|feedback|belief_update; `summary`; 顺序由 has_step 边索引确定）`Preference`（偏好摘要工件——主张本身仍为 Proposition+Assertion）`Insight`（洞察；可选的 `task_family` 可将其订阅至后果流）`Commitment`（承诺；`status`: pending|fulfilled|cancelled|expired|blocked; `due_at` ≠ retention 过期）`Watch`（关注警戒；`watch_class`: delta|silence; `condition` = `{element | slot: {subject, predicate} | type, ops, touched, text}` over Change Envelope entries, `text` alone is Brain-evaluated; `status`: armed|fired|expired|disarmed; firing is a guarded UPDATE + `watch_fire` Activity keyed `watch_fire:<id>:<seq>` so it never double-fires; a silence Watch is decided only after the stream is consumed through `due_at`, never on the clock alone; firing grants nothing）`Skill`（技能；`skill_class`, required `task_family` — the stream its baseline comes from, `summary`, `procedure`, `status`: proposed|trialed|adopted|revoked; transitions only by deterministic `lifecycle_verdict` over outcomes linked to decisions that applied it）`SleepTask`（睡眠任务；`task_class`: consolidate|review_conflict|review_skill|resolve_identity|review_retention|review_derived|refresh_self_model|inspect_quarantine; `summary`; `status`: pending|running|completed|cancelled|blocked|failed）`SelfModel`（自我模型）`WorkingState`（当前工作记忆摘要；必填 `basis_seq`；派生视图，绝不能作为 Evidence 引用）

谓词（Predicates）：`prefers` (Person→Concept) `caused_by` (Step→Step, 结果→原因, 证据支撑) `same_as` (同一性主张 → 人工/规则复审)

切面（Facets）：`MnemonicState {memory_strength, salience, utility, last_metabolized_at}`（Skill 也包含：`utility` 是准入下注）`GradingState {success_count, failure_count, graded_count, last_verdict_at}`（Skill / 订阅流的 Insight；仅统计指向应用该认知的决策的结果）`TrialState {opened_at, basis_seq, baseline_graded_count, baseline_success_count, baseline_failure_count, quota, rule_id}`（由开启试用的裁决写入）`DerivationState {basis_seq, status: current|stale|under_review, reviewed_at}` `DecisionRecord {decision: act|ask|defer|silence, rationale}`（挂在 `action_gate` 活动上，其 `inputs` 指明所应用的 Skill 与记忆）`OutcomeRecord {task_family, outcome_status: success|partial|failure|aborted|unknown, magnitude}`（挂在 `outcome` Evidence 上；由仪器写入，绝非被评估的行动者自身）—— 比例值为 `[0,1]`，计数为非负整数，时间戳可为空；它们都不是真值，`stale` 是复审标记而非撤回，`task_family` 寻找基线但绝不直接用于归因。

结构字段：`has_step`（有序）`experienced_by` `involves` `mentions` `about` `derived_from` `consolidated_to` `compiled_from` `compiled_by` `committed_to` `owed_to` `assigned_to` `watches`；记录类内置字段：`evidence` `source` `generated_by` `inputs` `outputs` `associated_actors`。

核心不变量：失败的经历也是一等公民记忆；单次成功 ≠ 采纳技能；采纳技能 ≠ 具备执行权限；自身关于行动结果的叙述属于 `agent_statement`，绝非 `outcome` Evidence；SelfModel ≠ 治理权限；触发的 Watch 仅代表引起注意，绝非执行许可 —— 记录网关决策（`action_gate` 活动 + `DecisionRecord`: act|ask|defer|silence, inputs = 所应用的技能与记忆），包括刻意的沉默；结果证据仅能通过 `outcome_observation` 指向决策活动来为 Skill 打分，绝不能仅凭同属 `task_family` 计分；WorkingState 必须携带 `basis_seq` 且绝不能被引为 Evidence；导入的记忆保留 `mode: "imported"` 且绝不能变成具备本地权威的自传（导入的 Skill 重置为 `proposed` 重新受评）。

---

### 7. 错误代码与自愈指南

错误大类：`syntax protocol schema data epistemic governance transaction history search artifact resource transport system`。每个错误均包含 `code`、`hint` 与 `retry.class`：

```text
safe_same_request | requires_refresh | requires_different_input | requires_authority
| requires_new_snapshot | requires_reacquire_artifact | outcome_lookup_required | non_retryable
```

高频错误自愈对策：`SchemaSymbolAmbiguous`（使用全限定 URI `kip://pkg@ver/symbol`）· `SchemaSymbolNotFound`（先执行 DESCRIBE，严禁臆造 Schema 符号）· `EpistemicRevisionRequired`（试图 UPDATE 信念历史 → 新建 Assertion + SUPERSEDING）· `EvidenceCorrectionRequired`（→ CORRECT ... BY）· `VersionConflict`（重新读取最新版本，重新计算，以最新 EXPECT VERSION 重试）· `IdempotencyConflict`（同一 idempotency key 尝试发送不同请求内容 → 更换新 key）· `OutcomeUnknown`（→ 按幂等键查询事务状态）· `NotFoundOrNotVisible`（对象可能存在但超出调用者可见权限 —— 绝不能判定其不存在）· `ReadonlyViolation` / `LanguageMismatch`（以解析出的实际语义规则为准）。

---

### 8. 黄金守则

1. **写前接地**：`SEARCH` + `DESCRIBE` → 获取精确 ID 与 Schema 引用。持久化时使用精确版本，绝不使用 `@latest`。
2. **高频路径 = `ASSERT` + 摄取**：单条语句完成归属陈述；证据由运行时自动生成并以 `:key` 引用 —— 严禁手动重新键入观测到的载荷。
3. **涉真问题必须使用 `BELIEF`/`BELIEF SLOT`**；原始 `FIND` 仅用于审计、历史分析与冲突排查。对 `insufficient` 应如实告知“依据不足”，绝不能判定为“假/否”。
4. **更正规范**：出现新证据 → `ASSERT ... SUPERSEDING :old`（重大变更补充记录 `belief_revision` 活动）。不同主体间的观点分歧应保持共存。
5. **单次认知变迁 = 单一原子 MUTATE / 事务**：证据+断言；经历+步骤+活动；更正+废弃。绝不能留下残缺状态。
6. **代谢仅触碰 Facet**：衰减 `memory_strength`、调节 `salience`、依据关联结果累加 `GradingState` —— 断言置信度绝不能原位修改；产生认识论层面的新认知应创建新断言，并可选择废弃旧断言。
7. **移除操作梯度分级**：归档（archive）→ 逻辑删除（tombstone）→ 物理抹除（purge，受策略控制，需显式确认）。合并是非破坏性的；发现同一性疑点 = 声明 `same_as` 主张并提交复审。
8. **重试遵循规范写入路径**：相同意图 = 相同的 `idempotency_key`；现实世界中不同独立观测 = 不同的 `client_key`。重试不等于产生了新经历。
9. **严格区分双时间轴**：`FOR TIME` 表达“现实世界在何时有效”，`AS OF` 表达“大脑在当时认知状态下相信什么”；仅在两者均明确指定时才同时使用。
10. **你是调用主体（Principal），而非行动者本身**：`by:` 标明立场属于谁；记录该立场的权限来自 Governance，智能体写下的任何认知内容都不能自动扩张其自身的权限、信任或模式。
11. **验证生成的命令**：解析合法 (parser-valid) ≠ Schema 合法 (Schema-valid) ≠ 具备执行授权 ≠ 实际提交持久化。针对复杂或关键命令，优先使用 `VALIDATE`/`PREVIEW`，依据结构化错误反馈自愈，并以 Receipt 回执作为持久化确认的唯一事实。
