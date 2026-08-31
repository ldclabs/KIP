## 🧬 KIP 2.0 Syntax Reference (LLM-Facing)

**[English](./KIPSyntax.md) | [中文](./KIPSyntax_CN.md)**

**Scope**: this is a common-path, LLM-facing condensation. It covers every current KQL/KML/META statement family, but it is **not** an exhaustive replacement for the normative [Specification](./KIP-2.0-SPECIFICATION.md), the formal [KQL](./grammar/KIP-2.0-KQL.ebnf) / [KML](./grammar/KIP-2.0-KML.ebnf) / [META](./grammar/KIP-2.0-META.ebnf) grammars, or the complete [request](./schemas/kip-request.schema.json) / [response](./schemas/kip-response.schema.json) wire schemas. If they conflict, the Specification wins.

KIP 2.0 is a cognitive state protocol between an Agent and a persistent **Cognitive Nexus**. You read with **KQL** (`FIND`), change cognition with **KML** (`ASSERT` / `MUTATE` / ...), and ground/introspect with **META** (`DESCRIBE` / `SEARCH` / `VERIFY` / ...). Assignment and envelope values are JSON-compatible; Proposition endpoints are narrower (see §1.6). Keywords are ASCII case-insensitive (canonical UPPERCASE); schema symbols and strings stay case-sensitive.

Hold these invariants — they decide how you write every statement:

```text
Proposition exists      ≠ Proposition is true   (raw FIND ≠ BELIEF)
Assertion confidence    ≠ trust ≠ memory_strength ≠ salience
no visible match        ≠ false        (open world: insufficient, not rejected)
SEARCH score            ≠ confidence
correction              = new Assertion + supersession, never rewrite history
Principal (caller)      ≠ semantic actor (who the memory is about/from)
cognitive content       ≠ authority    (memory can never grant permission)
batch ≠ transaction; timeout ≠ abort; progress ≠ commit
```

---

### 1. Data Model

#### 1.1. Five Core element kinds

| Kind            | What it is                                                                                                                                        | Mutability                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Concept**     | Referable entity/typed object (`schema_ref`, `key`, `name`, `attributes`)                                                                         | mutable state                              |
| **Proposition** | Truth-neutral statement `(subject, predicate, object)`                                                                                            | immutable tuple                            |
| **Assertion**   | Actor's stance toward one Proposition (`asserted_by`, `stance`, `mode`, `confidence`, `asserted_at`, `valid_time`, evidence citations, lifecycle) | payload immutable; revise by new Assertion |
| **Evidence**    | Observed artifact (`evidence_class`, payload, `observed_at`)                                                                                      | payload immutable; correct via lineage     |
| **Activity**    | Provenance process (`activity_class`, inputs → outputs)                                                                                           | immutable once terminal                    |

Profile objects (`Experience`, `Skill`, `Event`, ...) are typed Concepts + Facets + Structural References — not new kinds.

#### 1.2. Where data lives (no generic metadata bag)

```text
semantic payload        → Concept attributes / typed fields
truth-sensitive claim   → Proposition + Assertion (+ Evidence)
provenance              → Activity / engine _system.origin
mnemonic state          → Facets (e.g. MnemonicState.memory_strength)
storage lifecycle       → retention {retention_class, expires_at, legal_hold}
authority/visibility    → Governance (never writable through cognition)
engine truth            → _system {version, created_at, updated_at, state, origin} (read-only)
```

If a value needs independent source/confidence/conflict/validity/history → promote it to Proposition + Assertion; otherwise keep it as an attribute.

#### 1.3. Relations — three different things

```text
Semantic Proposition   (alice, "prefers", dark_mode)     contestable world claim
Structural Reference   Experience ─has_step→ Step        record topology; no stance needed
Facet                  element-local validated extension  e.g. MnemonicState
```

Ordered structural fields (e.g. `has_step`) expose a zero-based `?edge.index`; order is never causality — a causal claim uses the `caused_by` Predicate as Proposition + Assertion.

#### 1.4. Identity & references

```text
id            engine-assigned, opaque, immutable — the real identity
key           optional immutable Space-local logical key (idempotent identity)
name          mutable display/grounding only; duplicates allowed; NEVER identity
canonical_id  optional verified cross-system identity (Governance-protected)
client_key    retry-safe logical identity for one historical creation
```

Unverified "these are the same entity" → `same_as` Proposition + Assertion (feeds review, never auto-merges).

#### 1.5. Lexical & writing rules

```text
?name    variable / KML local handle        :name    bound parameter (complete value position)
"..."    JSON string    numbers/true/false/null    [...] arrays    {...} objects
identifiers: [A-Za-z_][A-Za-z0-9_]*         // comments to end of line
```

Notation **in this card only**: `[ ]` = optional, `A | B` = alternatives, `<...>` = placeholder, `...` = elided. Never emit those. Such templates are fenced as `text`; blocks fenced as `kip` are complete executable commands. Real KIP square brackets occur in arrays (`[1, "a"]`) and quoted-key path access (`?x.facets["MnemonicState"]`, `?x["exact-key"]`); a real `|` occurs only between predicate alternatives (`"a" | "b"`).

Rules that decide whether a statement parses:

- Predicates, schema names (types, facets, structural fields), ids and enum values are **quoted strings** or `:params` — never bare words: `(?a, "prefers", ?b)`, `SET FACET "MnemonicState"`, `("has_step", ?s)`. Object keys are bare identifiers or quoted strings; a keyword is a fine key (`{by: …, mode: …, key: …}`).
- Inside `WHERE { … }` items are separated by whitespace/newlines, **not commas**. Commas only inside `( )`, `{ }`, `[ ]`, argument lists, and the `FIND(...)` / `ORDER BY` lists.
- Statement-level clause order is fixed and is exactly the order shown in this card; only the clauses inside a `CREATE ... { }` / `UPSERT ... { }` body may come in any order. `true` / `false` / `null` are lowercase; keywords are case-insensitive.
- One statement per operation, no `;`. Several mutations that must commit together → wrap them in `MUTATE { … }`.
- Parameters are structurally bound data, never string-spliced; don't embed them inside quoted strings.

#### 1.6. Proposition endpoint rules

```text
subject    local Element reference only; never a Literal
predicate  exact quoted Schema symbol or :parameter (a bound variable is read-pattern syntax)
object     local Element reference or a Schema-permitted scalar Literal
```

Baseline Core Literals are finite JSON `string | number | boolean | null`. Arrays and arbitrary objects are assignment/envelope values, **not** baseline Proposition Literals; model structured semantic values as typed Concepts or schema-defined value objects. `null` is legal only where the Predicate schema permits it. A `{type: ...}` term is an inline Concept match, not an arbitrary object Literal.

---

### 2. KQL — Read

```text
FIND(<projections>)
WHERE { <patterns and filters> }
[AS OF SEQ :seq | AS OF TX :tx | AS OF TIME :t]   // cognitive history: what the Brain contained/believed then
[FOR TIME :world_time]                            // world-valid time: what was applicable then
[WITH EPISTEMIC { purpose: "...", risk: "low", policy: "...", include_historical: false,
                  include_hypothetical: false, explanation: "none|summary|ledger" }]
[ORDER BY <expr> [ASC|DESC], ...] [LIMIT :n] [CURSOR :cursor]   // several sort keys; ASC default; nulls last
```

`AS OF` and `FOR TIME` are independent axes. "What did the Brain believe at cognitive time C?" = `AS OF C`; "what did it then believe about world time W?" = `AS OF C` + `FOR TIME W`; "what does it now believe about W?" = `FOR TIME W` only. Projections are variables, dot paths or aggregates; mixing plain expressions with aggregates groups by the plain ones.

```kip
FIND(?belief.status, ?timezone)
WHERE {
  ?person {type: "Person", key: "alice"}
  ?belief BELIEF (?person, "timezone", ?timezone)
}
WITH EPISTEMIC {purpose: "answer_user", risk: "low", explanation: "summary"}
LIMIT 10
```

#### 2.1. Pattern families

```text
?person {type: "Person", name: "Alice"}              // Concept (type = schema sugar; `?person CONCEPT {...}` also legal)
?exp {type: "Experience", attributes: {outcome_status: "failure"}}   // attributes/facets match as nested objects (or FILTER on ?exp.attributes.x)
?p (?person, "works_for", ?org)                      // raw Proposition — existence, NOT belief
?p PROPOSITION (?person, "works_for", ?org)          // explicit form; PROPOSITION and ?p are independently optional
?p (?s, ?predicate, ?o)                              // predicate variable → binds exact predicate ref
?p (id: :prop_id)                                    // same slot, addressed by id — usable as a term too
(?drug, "treats", {type: "Symptom", name: "Headache"})   // a term may be an inline Concept match, a literal, or a :param
?s (?user, "stated", (?drug, "treats", ?symptom))    // ... or a nested tuple: statement about a statement
?a ASSERTION {proposition: ?p, asserted_by: ?actor, stance: "support", mode: "stated"}
?e EVIDENCE {evidence_class: "tool_result"}
?act ACTIVITY {activity_class: "inference", status: "completed"}
?edge STRUCTURAL (?experience, "has_step", ?step)    // topology; ?edge.index for ordered fields
STRUCTURAL (?experience, "has_step", ?step)          // the edge binding is optional
?belief BELIEF (?person, "timezone", ?tz)            // Epistemic Projection (virtual, read-only)
?belief BELIEF (?p)                                  // project an already-bound Proposition
?belief BELIEF (id: :prop_id)                        // ... or one already known by id (same id form)
?slot BELIEF SLOT (?person, "timezone")              // whole functional slot: candidates + conflicts
```

**BELIEF output**: `status` ∈ `accepted | rejected | contested | uncertain | insufficient`, plus support/opposition, uncertainty, policy identity, temporal basis. A fully grounded BELIEF over a never-stored Proposition returns `insufficient` (not zero rows). BELIEF SLOT returns `accepted_values` + `candidate_projections`. Support and opposition scores don't sum to 1. `BELIEF` / `BELIEF SLOT` are `FIND`-only: never inside a mutation's `WHERE` or an `EXPORT` selection, and their predicate is exact (no path operators).

**When to use what**: answering "what is true?" → `BELIEF` / `BELIEF SLOT`. Auditing "who said what, based on what?" → raw Proposition/Assertion/Evidence patterns. Never present raw rows as accepted belief.

#### 2.2. Expressions

```text
FILTER(?a.confidence > 0.8 && ?a.lifecycle.status == "active")   // == != < > <= >=   && || !
FILTER(IN(?x.name, ["A", "B"]))    // also: CONTAINS STARTS_WITH ENDS_WITH REGEX
FILTER(IS_NULL(?opt))              // IS_NOT_NULL IS_LITERAL IS_ELEMENT IS_KIND LITERAL_TYPE
NOT { (?person, "prefers", ?x) }   // = no visible match; NEVER world-level falsehood
OPTIONAL { ... }                   // left join; null = no visible match
UNION { ... }                      // alternative branch (independent scope)
```

Dot paths: `?x.id` `?x.name` `?x.attributes.goal` `?a.lifecycle.status` `?x._system.version` `?x.facets["MnemonicState"].memory_strength` `?x["exact-key"]` `?edge.index`; whole objects too (`?x.attributes`).

Aggregates: `COUNT(?x)` `COUNT(DISTINCT ?x)` `SUM/AVG/MIN/MAX`. `COUNT = 0` never proves falsehood.

Raw paths (traversal only, no belief propagation): `(?x, "is_subclass_of"{0,5}, ?anc)` — quantifiers `{n}` `{m,}` `{m,n}`; alternatives `(?x, "related_to" | "depends_on", ?y)`.

Cursors are opaque, snapshot-pinned, family-specific; current Governance still applies on continuation.

---

### 3. KML — Write

A KML mutation becomes durable only via a Transaction (all-or-nothing, receipt-confirmed).

#### 3.1. `ASSERT` — the everyday write (sugar, normative)

Recording an attributed claim is the hot path. Use the sugar:

```kip
ASSERT (:alice, "prefers", :dark_mode) {
  by: :alice,              // REQUIRED semantic actor → asserted_by
  mode: "stated",          // REQUIRED: observed|stated|inferred|predicted|hypothetical|imported
  confidence: 0.95,        // optional [0,1]: strength of THIS stance, not truth probability
  evidence: :msg,          // optional: Evidence ref or array (runtime-ingested preferred)
  stance: "support",       // optional, default support (support|reject|uncertain)
  at: :time,               // optional → asserted_at (default: engine transaction time)
  valid: {from: :t1, until: :t2},   // optional → valid_time (world-valid interval)
  key: :client_key         // optional retry-safe identity
}
```

Correction (same actor changed their claim):

```kip
ASSERT ?a (:alice, "timezone", "+01:00") {   // the handle ?a is optional
  by: :alice, mode: "stated", evidence: :e2
} SUPERSEDING :old_assertion
```

Desugars exactly to `ENSURE PROPOSITION` + `CREATE ASSERTION` (+ `SUPERSEDE`). Never fabricates extra state. The tuple must be a structural `(s, "p", o)`: the `(id: …)` form is match-only and rejected here. The long form — needed for `challenge` / `context` citations or fine control:

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

Append `EXPECT VERSION 0` immediately after an `ENSURE PROPOSITION` tuple only when the Proposition must be newly created rather than resolved.

Rules of stance:

- Someone tells you a fact → `ASSERT ... {by: <them>, mode: "stated"}`. Recording "Alice said X" needs no permission to *be* Alice.
- You (the Brain) infer something → `by: <self>, mode: "inferred"`, cite premises as evidence.
- Disagreement between actors → two coexisting Assertions (contested), **never** supersession or deletion.
- Denial → `stance: "reject"` toward the positive Proposition, not a fabricated `false` object.

#### 3.2. Evidence — never re-type observed content

Preferred: the request's **ingestion context** mints Evidence from the transport envelope; you only reference `:key` (see §5.1). If you must create manually:

```kip
CREATE EVIDENCE ?e {
  CLIENT KEY :e_key
  SET FIELDS { evidence_class: "tool_result", payload: :payload, observed_at: :time }
  SET STRUCTURAL { ("source", :actor) }
}
```

`CREATE EVIDENCE` / `CREATE ASSERTION` / `CREATE ACTIVITY` share one body: `[CLIENT KEY]`, `SET FIELDS`, `SET FACET`*, `SET STRUCTURAL` — no `TYPE`/`NAME`/`SET ATTRIBUTES` (those are Concept clauses). Wrong Evidence is corrected, never edited: `CORRECT EVIDENCE :old BY :new [EXPECT STATE "..."]`.

#### 3.3. Concepts

```kip
CREATE CONCEPT ?exp {                       // historically distinct thing
  TYPE "Experience"
  CLIENT KEY :exp_key
  NAME "Deploy v2 failure"
  SET ATTRIBUTES { goal: :goal, outcome_status: "failure" }
  SET FACET "MnemonicState" { memory_strength: 0.8, salience: 0.9 }
  SET STRUCTURAL { ("has_step", :s0) {index: 0} ("has_step", :s1) {index: 1} }
}
```

```kip
UPSERT CONCEPT ?proj {                      // stable identity-bearing Concept
  MATCH { type: "Project", key: "kip-2" }   // identity = type + id/key; name-only upsert is forbidden
  EXPECT VERSION :v                         // optional; 0 = create-only
  SET FIELDS { name: "KIP 2.0" }
}
```

Clause menus (any order inside the braces, each at most once except `SET/UNSET FACET`): `CREATE CONCEPT` — `TYPE` (required), `CLIENT KEY`, `NAME`, `SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`. `UPSERT CONCEPT` — `MATCH` (required), `EXPECT VERSION`, `SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`, `UNSET ATTRIBUTES | FACET | STRUCTURAL`. `MATCH { type: "Person", key: "alice" }` may create; `MATCH { id: :id }` only matches. The `type` is not decoration: a key is identity *within* its type (a Person and a Preference may both be keyed `alice`), and on a create it is the only source of the new Concept's type — so an upsert that must create without one is rejected, and a bare `{key: …}` that names two Concepts is an `IdentityConflict` rather than a coin flip. Where a value goes: Core fields (`name`, `key`) → `SET FIELDS`; schema-declared attributes (`goal`, `status`, …) → `SET ATTRIBUTES`; Profile facet values → `SET FACET "Facet"`; references → `SET STRUCTURAL`.

#### 3.4. `MUTATE` — one atomic cognitive transition

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

Handles (`?e`, `?a`) are block-local; forward references are allowed; the engine validates the whole graph, then commits all-or-nothing. A `MUTATE` may hold any KML statement except another `MUTATE`.

#### 3.5. UPDATE — mutable state only

```kip
UPDATE ?m EXPECT VERSION :v
SET FACET "MnemonicState" {
  memory_strength: CLAMP(MUL(?m.facets["MnemonicState"].memory_strength, :decay), 0, 1)
}
WHERE {
  ?m {type: "Experience"}
  FILTER(?m.facets["MnemonicState"].memory_strength > 0)
}
LIMIT :n
```

Actions (one or more, in this position): `SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL` and `UNSET ATTRIBUTES | FACET | STRUCTURAL`. `SET FIELDS` deliberately has **no** `UNSET FIELDS`; only schema-legal Core field assignments are allowed. Exact removal shapes:

```kip
UPDATE :concept_id
UNSET ATTRIBUTES {obsolete, "legacy-field"}
UNSET FACET "MnemonicState" {salience}
UNSET STRUCTURAL { ("has_step", :wrong_step) }
```

`UNSET ATTRIBUTES` / `UNSET FACET` contain comma-separated field names, not `{field: null}` assignments. `UNSET STRUCTURAL` removes one named reference; ordered fields re-densify and cardinality is validated. `SET/UNSET STRUCTURAL` through UPDATE applies only to mutable Concept topology. Assertion and Evidence citations/topology are immutable; a pending Activity finalizes topology only through `TRANSITION ACTIVITY ... SET STRUCTURAL`, and terminal Activity topology is immutable.

Update expressions: `ADD` `MUL` `CLAMP` `COALESCE` (deterministic, per-target; operands may read only the target's own paths). UPDATE never creates. A direct target needs no `WHERE`: `UPDATE :id SET FACET "MnemonicState" {salience: 0.9}` (same rule as ARCHIVE/TOMBSTONE/PURGE/SET RETENTION/RETRACT — a `?var` target is bound by WHERE, `:id`/`"id"` already names the element).

**UPDATE can never touch**: Proposition tuples, Assertion epistemic payload or initial citations, Evidence payload/topology, Activity topology, `_system`, Governance, Schema. A pending Activity uses `TRANSITION ACTIVITY` to finalize fields/topology; a terminal Activity is immutable. Attempting an illegal rewrite → `EpistemicRevisionRequired` / `EvidenceCorrectionRequired` / `ImmutableField`. **Never decay Assertion confidence over time** — disuse decays `memory_strength`; staleness is Projection's job; new knowledge is a new Assertion.

#### 3.6. Lifecycle & removal (each one a different thing)

```text
RETRACT ASSERTION :a [WHERE {...}] [LIMIT :n] [EXPECT STATE "active"]   // the assertor withdraws their own claim
SUPERSEDE ASSERTION :old BY ?new [EXPECT STATE "active"]               // same actor/lineage revision — not disagreement
TRANSITION ACTIVITY :act TO "completed"                                // lifecycle move; may finalize terminal fields atomically
  [SET FIELDS { ended_at: :t }] [SET STRUCTURAL { ("outputs", ?a) }] [EXPECT STATE "running"]
ARCHIVE :target [WHERE {...}] [LIMIT :n] [EXPECT STATE "..."]     // out of ordinary recall; history preserved
TOMBSTONE :target [WHERE {...}] [LIMIT :n] [EXPECT STATE "..."]   // logical deletion; identity/audit preserved
PURGE :target [WHERE {...}] [LIMIT :n]                             // physical erasure; exceptional
  [REFERENCE POLICY "deny_if_referenced"] CONFIRM "PURGE"          // policies: deny_if_referenced | tombstone_reference | authorized_cascade
PURGE PAYLOAD :evidence [WHERE {...}] [LIMIT :n] CONFIRM "PURGE"   // erase Evidence bytes only; record, digest, citations, provenance survive
SET RETENTION :target { retention_class: "standard", expires_at: :t } [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
MERGE CONCEPT ?src INTO ?tgt [WHERE {...}] [EXPECT VERSION :v]
```

Every mutation whose `WHERE` can select an unbounded set takes an optional `LIMIT` right after it (`UPDATE`, `RETRACT ASSERTION`, `SET RETENTION`, `ARCHIVE`, `TOMBSTONE`, `PURGE`, `PURGE PAYLOAD`) — bound your sweeps. `LIMIT` caps how many are affected, not which: don't assume an order. `MERGE CONCEPT` takes none.

`MERGE CONCEPT` is non-destructive: source stays addressable as merged history; future writes canonicalize to target. Cycle-creating merges (target already resolves back to source) are rejected.

Preconditions: `EXPECT VERSION :n` (optimistic concurrency; `EXPECT VERSION 0` = create-only) sits right after the target in `UPDATE`, after `MATCH` in `UPSERT CONCEPT`, after the tuple in `ENSURE PROPOSITION`, and last in `SET RETENTION` / `MERGE CONCEPT`; `EXPECT STATE "..."` is always the last clause of a lifecycle statement.

---

### 4. META — Ground, Verify, Inspect

```text
DESCRIBE PRIMER [MODE "compact" | "full" | :mode]   // identity, Space, schema map, capabilities, safety invariants
DESCRIBE PROTOCOL | EXECUTION CONTEXT | CAPABILITIES | PROJECTION CAPABILITY   // CAPABILITIES: supported vs available (for THIS caller)
DESCRIBE SPACE ["space-id" | :space_id]
DESCRIBE SCHEMA ENVIRONMENT [AS OF SEQ :s | AS OF TX :tx | AS OF TIME :t]
DESCRIBE SNAPSHOT [AS OF SEQ :s | AS OF TX :tx | AS OF TIME :t]
DESCRIBE TYPE :t | PREDICATE :p | FACET :f | STRUCTURAL FIELD :sf | PACKAGE :pkg | COMPATIBILITY FROM :pkg_a TO :pkg_b
DESCRIBE ERROR :code | CAPSULE :artifact | EPISTEMIC POLICY [:id] | TRUST [:scope] | ACCESS [WITH {operation: "...", resource: :r}]
DESCRIBE TRANSACTION :tx_id | DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
LIST SPACES | TYPES | PREDICATES | FACETS | STRUCTURAL FIELDS | EPISTEMIC POLICIES [LIMIT :n] [CURSOR :c]
LIST SCHEMA PACKAGES [STATUS "active" | :status] [LIMIT :n] [CURSOR :c]
LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c]   // cognition derived from an element, via Activity inputs→outputs (+ derivation fields)
HISTORY ELEMENT :id [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]   // transition chronology
HISTORY SPACE [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
CHANGES SINCE :cursor [LIMIT :n] | CHANGES AFTER SEQ :seq [LIMIT :n]   // transaction-grained stream
SNAPSHOT [AS OF SEQ :s | AS OF TX :tx | AS OF TIME :t]
VERIFY CAPSULE | SCHEMA PACKAGE | RECEIPT | BLOB | CHECKPOINT :artifact
VALIDATE KQL | KML | CAPSULE | SCHEMA PACKAGE | IMPORT PLAN :input [WITH {...}]
PREVIEW KML :cmd | PREVIEW IMPORT CAPSULE :capsule INTO :space
EXPORT CAPSULE ?roots WHERE {...}                                      // ?roots bound by WHERE, or :id / "id" for one root
  [WITH {closure: "referential", provenance_depth: 2, include_schema: true, include_blobs: false, proof_profile: "..."}]
  [AS OF SEQ :s | AS OF TX :tx | AS OF TIME :t]
```

```text
SEARCH <KIND> :term
  [WITH TYPE :type] [WITH PREDICATE :pred]
  [MODE "keyword" | "semantic" | "hybrid" | :mode]
  [THRESHOLD :t] [AS OF SEQ :s] [LIMIT :n] [CURSOR :c]

KIND = CONCEPT | PROPOSITION | ASSERTION | EVIDENCE | ACTIVITY | COGNITION
```

All SEARCH modifiers use exactly that order. `WITH TYPE` / `WITH PREDICATE` are used only where meaningful for the selected kind; runtime semantic validation decides applicability. `AS OF SEQ` requires the advertised `historical_search` capability.

```kip
SEARCH CONCEPT :term
WITH TYPE :type
MODE "hybrid"
THRESHOLD :threshold
LIMIT :limit
```

SEARCH is grounding only: score ≠ confidence ≠ belief; miss ≠ absence; results disclose `index_seq` freshness. Golden path: **SEARCH → exact id → BELIEF/FIND**.

Five-layer discipline: `DESCRIBE/SEARCH` (find) ≠ `VERIFY` (integrity) ≠ `VALIDATE` (legality) ≠ `PREVIEW` (simulated effect) ≠ **Receipt** (what actually committed).

---

### 5. Runtime Envelope

This is a complete **common-path request**, not the full wire grammar:

```json
{
  "kip": "2.0",
  "request_id": "req-42",
  "space": {"id": "space-1"},
  "execution": {"mode": "atomic", "idempotency_key": "formation:42"},
  "ingest": {
    "evidence": [{
      "key": "msg",
      "evidence_class": "user_statement",
      "payload": "I prefer dark mode.",
      "media_type": "text/plain",
      "observed_at": "2026-08-16T01:00:00Z",
      "source_actor": "alice",
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

#### 5.1. Ingestion, execution, and recovery

- **Execution modes** (required when >1 operation): `independent` (isolated, concurrent) | `sequence` (ordered, separate commits, no rollback of earlier) | `atomic` (one transaction, one snapshot, read-your-writes, all-or-none).
- **§5.1 Ingestion**: each `ingest.evidence[].key` becomes a parameter bound to runtime-minted Evidence — observed payloads never pass through your generated text. Each entry supplies exactly one of `payload` or `payload_artifact`.
- **Identity trio**: `request_id` (one network attempt) ≠ `idempotency_key` (one logical write intent) ≠ `tx_id` (committed fact). Retry the same logical write with the **same** idempotency key.
- **Response**: top status `succeeded|failed|partial|outcome_unknown`; per-op `succeeded|failed|skipped|rolled_back|no_effect`; committed receipt carries `tx_id`, `space_seq`, digests.
- **Timeout ≠ abort**: on lost response, `DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key` or retry the identical request/key. Never re-form the memory fresh.

#### 5.2. Full wire surface

The complete request schema additionally defines `compatibility_profile`, `read.snapshot_token`, `preconditions`, request-level `parameters`, `context`, `requires`, `options`, namespaced `extensions`, operation-level `ast | command`, and operation-level idempotency/options. Do not invent envelope fields: validate against [`kip-request.schema.json`](./schemas/kip-request.schema.json); validate responses against [`kip-response.schema.json`](./schemas/kip-response.schema.json).

#### 5.3. Agent loading and generation contract

Loading this card teaches the language, not the current deployment's identities or Schema. A production Agent needs all four inputs:

```text
1. this syntax card                         static language/common-path rules
2. execute_kip tool/request JSON Schema    exact wire shape and parameter binding
3. DESCRIBE PRIMER + targeted DESCRIBE     current Space, self, Schema refs, capabilities, limits
4. VALIDATE/PREVIEW + structured errors    legality check and correction loop before material writes
```

At startup or after `requires_refresh`, call `DESCRIBE PRIMER`; ground concrete types, Predicates, Facets, Structural Fields and ids before generating a write. Prefer `VALIDATE KQL :command` / `VALIDATE KML :command` (or an equivalent local parser) for dynamically composed or high-impact commands. A successful parse/VALIDATE is still not a commit; only a successful Receipt proves durability.

---

### 6. Cognitive Memory Profile (quick reference)

Types: `Person` `Event` (what happened) `Experience` (goal-directed trajectory; required `goal`, `outcome_status`) `ExperienceStep` (`step_kind`: context|observation|decision|action|feedback|belief_update; `summary`; order = has_step edge index) `Preference` (summary artifact — the claim itself stays Proposition+Assertion) `Insight` `Commitment` (`status`: pending|fulfilled|cancelled|expired|blocked; `due_at` ≠ retention expiry) `Watch` (armed attention; `watch_class`: delta|silence; `condition`; `status`: armed|fired|expired|disarmed; firing grants nothing) `Skill` (`skill_class`, required `task_family` — the outcome stream that grades it, `summary`, `procedure`, `status`: proposed|trialed|adopted|revoked; transitions only by deterministic `lifecycle_verdict` over graded outcomes) `SleepTask` (`task_class`: consolidate|review_conflict|review_skill|resolve_identity|review_retention|review_derived|refresh_self_model|inspect_quarantine; `summary`; `status`: pending|running|completed|cancelled|blocked|failed) `SelfModel` `WorkingState` (what matters now; required `basis_seq`; derived view, never Evidence)

Predicates: `prefers` (Person→Concept) `caused_by` (Step→Step, effect→cause, evidence-backed) `same_as` (identity claim → review)

Facets: `MnemonicState {memory_strength, salience, utility, last_metabolized_at}` `SkillUtility {utility, success_count, failure_count, graded_count, last_verdict_at}` `DerivationState {basis_seq, status: current|stale|under_review, reviewed_at}` `OutcomeRecord {task_family, outcome_status: success|partial|failure|aborted|unknown, magnitude}` (on `outcome` Evidence; written by instrumentation, never the graded actor) — the ratios are `[0,1]`, the counts are non-negative integers, the timestamps are nullable; none of them is truth, and `stale` is a review flag, not retraction.

Structural fields: `has_step` (ordered) `experienced_by` `involves` `mentions` `about` `derived_from` `consolidated_to` `compiled_from` `compiled_by` `committed_to` `owed_to` `assigned_to` `watches`; Core built-ins on records: `evidence` `source` `generated_by` `inputs` `outputs` `associated_actors`.

Invariants: failed Experience is first-class memory; one success ≠ adopted Skill; adopted Skill ≠ execution authority; your own report of how your action went is `agent_statement`, never `outcome` Evidence; SelfModel ≠ Governance; a fired Watch is attention, not permission — record the gate outcome (`action_gate` Activity: act|ask|defer|silence), silence included; WorkingState is served with its `basis_seq` and never cited as Evidence; imported memory keeps `mode: "imported"` and never becomes local autobiography (an imported Skill re-enters at `proposed`).

---

### 7. Errors (self-correct from these)

Categories: `syntax protocol schema data epistemic governance transaction history search artifact resource transport system`. Every error carries `code`, `hint`, and `retry.class`:

```text
safe_same_request | requires_refresh | requires_different_input | requires_authority
| requires_new_snapshot | requires_reacquire_artifact | outcome_lookup_required | non_retryable
```

Frequent codes → fix: `SchemaSymbolAmbiguous` (use exact `kip://pkg@ver/symbol`) · `SchemaSymbolNotFound` (DESCRIBE first, don't invent schema) · `EpistemicRevisionRequired` (you tried to UPDATE belief history → new Assertion + SUPERSEDING) · `EvidenceCorrectionRequired` (→ CORRECT ... BY) · `VersionConflict` (re-read, re-apply, retry with fresh EXPECT VERSION) · `IdempotencyConflict` (same key, different request — pick a new key) · `OutcomeUnknown` (→ lookup by idempotency key) · `NotFoundOrNotVisible` (may exist beyond your visibility — never conclude falsehood) · `ReadonlyViolation` / `LanguageMismatch` (actual parsed semantics rule).

---

### 8. Best Practices

1. **Ground before writing**: `SEARCH` + `DESCRIBE` → exact ids and schema refs. Persist exact versions, never `@latest`.
2. **Hot path = `ASSERT` + ingestion**: attributed claim in one statement; evidence minted by the runtime, referenced as `:key` — never re-type observed payloads.
3. **Belief questions get `BELIEF`/`BELIEF SLOT`**; raw `FIND` is for audit/history/conflict inspection. Report `insufficient` as "not enough basis", never as "no".
4. **Correction ritual**: new Evidence → `ASSERT ... SUPERSEDING :old` (+ `belief_revision` Activity for material revisions). Disagreement between actors just coexists.
5. **One coherent change = one atomic MUTATE/transaction**: Evidence+Assertion; Experience+Steps+Activity; correction+supersession. Don't leave misleading halves.
6. **Metabolism touches Facets only**: decay `memory_strength`, adjust `salience`, update `SkillUtility` — Assertion confidence is never edited; epistemically material change creates a new Assertion, optionally superseding the old one.
7. **Removal is a ladder**: archive → tombstone → purge (policied, confirmed). Merging is non-destructive; identity suspicion = `same_as` claim + review.
8. **Respect the write path for retries**: same intent = same `idempotency_key`; distinct real-world observations = distinct `client_key`s. Retry ≠ new Experience.
9. **Time is two axes**: use `FOR TIME` for "when was it valid", `AS OF` for "what did the Brain hold then"; combine them only when both cognitive-history time and world-valid time are specified.
10. **You are the Principal, not the actor**: `by:` names whose stance it is; your authority to record it comes from Governance, and nothing you write can expand your own authority, trust, or schema.
11. **Validate generated commands**: parser-valid ≠ Schema-valid ≠ authorized ≠ committed. Use `VALIDATE`/`PREVIEW` for non-trivial or high-impact commands, repair from structured errors, and treat only the Receipt as durable truth.
