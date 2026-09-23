## 🧬 KIP 2.0 Syntax Reference (LLM-Facing)

This is the complete command-family reference. Business Agents may use the smaller
[Memory Interface card](./brain/MemoryInterface.md). Direct callers start with
[Recall](./brain/KIPRecall.md), [Formation](./brain/KIPFormation.md) or
[Maintenance](./brain/KIPMaintenance.md) and load this reference only as needed.

**[English](./KIPSyntax.md) | [中文](./KIPSyntax_CN.md)**

**Scope**: this is the full command-family, LLM-facing reference. It covers every current KQL/KML/META statement family, but it is **not** an exhaustive replacement for the normative [Specification](./SPECIFICATION.md), the formal [KQL](./grammar/KIP-2.0-KQL.ebnf) / [KML](./grammar/KIP-2.0-KML.ebnf) / [META](./grammar/KIP-2.0-META.ebnf) grammars, or the complete [request](./schemas/kip-request.schema.json) / [response](./schemas/kip-response.schema.json) wire schemas. If they conflict, the Specification wins.

KIP 2.0 is a cognitive state protocol between an Agent and a persistent **Cognitive Nexus**. You read with **KQL** (`FIND`), change cognition with **KML** (`ASSERT` / `MUTATE` / ...), and ground/introspect with **META** (`DESCRIBE` / `SEARCH` / `VERIFY` / ...). Assignment and envelope values are JSON-compatible; Proposition endpoints are narrower (see §1.6). Keywords are ASCII case-insensitive (canonical UPPERCASE); schema symbols and strings stay case-sensitive.

Hold these invariants — they decide how you write every statement:

```text
Proposition exists      ≠ Proposition is true   (raw FIND ≠ BELIEF)
Assertion confidence    ≠ trust ≠ memory_strength ≠ salience
no visible match        ≠ false        (open world: insufficient, not rejected)
SEARCH score            ≠ confidence
correction              = new Assertion + supersession, never rewrite history
world change            = one new Assertion from when it began (succession ends the old one)
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
schema_ref    exact package version, persisted and used for validation; matching, keys and
              Proposition identity use the symbol LINEAGE (package path + symbol), so a
              package upgrade never splits memory (Spec §20.14)
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

Baseline Core Literals are JSON `string | number | boolean | null` (numbers: finite binary64, integer-valued results restricted to ±9007199254740991, no nonzero underflow). Arrays and arbitrary objects are assignment/envelope values, **not** baseline Proposition Literals; model structured semantic values as typed Concepts or schema-defined value objects. `null` is legal only where the Predicate schema permits it. A `{type: ...}` term is an inline Concept match, not an arbitrary object Literal.

#### 1.7. Timestamps

All protocol timestamps and time-valued parameters MUST use UTC strings with exactly three fractional-second digits: `YYYY-MM-DDTHH:mm:ss.SSSZ`, for example `"2026-08-16T01:00:00.123Z"` (whole seconds use `.000Z`). See [Specification §6.5](./SPECIFICATION.md#65-timestamp-format-and-precision).

This includes `_system.created_at` / `updated_at`, `asserted_at`, `observed_at`, `valid_time.from` / `until`, `started_at` / `ended_at`, `retention.expires_at`, `committed_at`, `format: "timestamp"`, and parameters bound to `at`, `FOR TIME` or `DESCRIBE SNAPSHOT AT TIME`. `null` or omission is allowed only where the field's contract permits it.

A `valid_time` endpoint may instead be a **time bound** `{earliest, latest}` (either may be omitted) when the instant is only known within a range — "in 2019" is `{earliest: "2019-01-01T00:00:00.000Z", latest: "2019-12-31T23:59:59.999Z"}`. A missing `from` is already the bound `{latest: asserted_at}` — the value began no later than the claim — so `asserted_at` (`at`) must be when the claim was made, not when it was recorded. Never pick an instant inside a range; a projection inside it answers `uncertain` (`temporal_indeterminate`).

Missing or non-three-digit fractions, non-`Z` offsets and invalid dates/times are rejected as `ConstraintViolation`; numeric epoch values and other non-string timestamps are `TypeMismatch`. Inputs are never silently normalized. Engine-generated timestamps truncate sub-millisecond clock resolution. Millisecond precision does not imply uniqueness or commit ordering; use `space_seq` for per-Space commit order. Durations retain their declared units.

---

### 2. KQL — Read

```text
FIND(<projections>)
WHERE { <patterns and filters> }
[AS OF SEQ :seq]                                  // cognitive history: what the Brain contained/believed then (a tx id or instant → seq via DESCRIBE TRANSACTION / DESCRIBE SNAPSHOT AT TIME)
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
?person SEARCH CONCEPT :query WITH TYPE "Person" LIMIT 10   // associative retrieval bound in the query; LIMIT required
```

**Time and policy**: an open `until` means "no end stated", not "forever": a later same-actor value in a functional slot ends it at its own start (temporal succession) when both are that actor's own account — `stated`/`observed`, or with a written `from` — so the old value still answers `FOR TIME` before the change; two `inferred` claims without a written start never succeed one another. Recall uses the standard policy `kip:memory-default` unless told otherwise: among conflicting values a task-scoped one prevails in its task, a person's own statement about themselves prevails over hearsay (never over an observation), and otherwise the value most recently claimed to hold prevails (by start key, never by recording order); the outranked value is `uncertain` with reason `outranked`.

**BELIEF output**: `status` ∈ `accepted | rejected | contested | uncertain | insufficient`, `leading` ∈ `support | opposition | none` (the heavier side under `contested`; disclosure, never a verdict), plus support/opposition, uncertainty, policy identity, temporal basis. A fully grounded BELIEF over a never-stored Proposition returns `insufficient` (not zero rows). BELIEF SLOT returns `accepted_values` + `candidate_projections`. Support and opposition scores don't sum to 1. `BELIEF` / `BELIEF SLOT` are `FIND`-only: never inside a mutation's `WHERE` or an `EXPORT` selection, and their predicate is exact (no path operators).

**Merges**: raw Proposition patterns match through `merged_into` — a term naming `B` finds tuples recorded on an `A` merged into `B`, and naming `A` finds them too. `?p.subject` / `?p.object` are the stored endpoints, `?p.canonical_subject` / `?p.canonical_object` the merge-resolved ones; the tuple itself is never rewritten.

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

**Scope** ([Spec §42.4–§44.5](./SPECIFICATION.md#424-solutions-bindings-and-scope)): ordinary patterns unify existing bindings. `NOT` reads incoming bindings but exports no new variables. `OPTIONAL` reads incoming bindings and exports every compatible match; on a miss it keeps the input once, with new variables unbound and their projected paths null. A filter inside `OPTIONAL` restricts optional matches; the same filter outside can remove the fallback row. Each `UNION` right branch starts independently, even when the preceding result is empty; repeat constraints needed there. Branch-only variables project as null in other rows. Clauses after `UNION` apply to its combined results. These rules nest; no binding escapes an enclosing `NOT`.

Identical complete solutions deduplicate before aggregation/projection/pagination. Different elements with equal projected names remain separate rows; use `COUNT(DISTINCT ?x)` for distinct aggregate inputs. An aggregate-only query has one group even on no matches: COUNT is 0, other aggregates null. With grouping expressions, no matches means no rows. Null comparisons do not pass filters; use `IS_NULL` / `IS_NOT_NULL` explicitly.

Aggregates: `COUNT(?x)` `COUNT(DISTINCT ?x)` `SUM/AVG/MIN/MAX`. `COUNT = 0` never proves falsehood.

Raw paths (traversal only, no belief propagation): `(?x, "is_subclass_of"{0,5}, ?anc)` — quantifiers `{n}` `{m,}` `{m,n}`; alternatives `(?x, "related_to" | "depends_on", ?y)`.

Zero hops include the same visible endpoint without requiring a self-edge. Quantified/alternative paths use exact Predicate symbols or symbol parameters, not predicate variables. `LIMIT` bounds output rows, not traversal work or Projection Evidence.

Cursors are opaque, snapshot-pinned, family-specific; current Governance still applies on continuation.

A **Search Pattern** runs retrieval inside the query, so grounding, filtering and belief happen against one snapshot. Its `LIMIT` bounds the candidate set and is required; `?x.retrieval.score` may be filtered and ordered but is never confidence. It may not appear inside `NOT` (a miss proves nothing) or in a mutation's `WHERE`:

```kip
FIND(?person.name, ?home)
WHERE {
  ?person SEARCH CONCEPT :query WITH TYPE "Person" MODE "hybrid" LIMIT 20
  ?home BELIEF SLOT (?person, "lives_in")
}
ORDER BY ?person.retrieval.score DESC
LIMIT 5
```

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
  at: :time,               // optional → asserted_at: when the actor made the claim (default: engine transaction time; set it for captured sources)
  valid: {from: :t1, until: :t2},   // optional → valid_time (world-valid interval)
  key: :client_key         // optional retry-safe identity
}
```

Optional `context: :contexts` lowers to immutable `context_refs` for task-scoped
claims. It is independent of Evidence citation roles. The host resolves the context
set; omission keeps the general scope.

Correction — the same actor's earlier claim was wrong:

```kip
ASSERT ?a (:alice, "timezone", "+01:00") {   // the handle ?a is optional
  by: :alice, mode: "stated", evidence: :e2
} SUPERSEDING :old_assertion
```

Change — the world moved and the old claim was true for its time. Write **one** Assertion for the new value from when it began; temporal succession ends the old one there, nothing is superseded, and `FOR TIME` before the move still answers the old value. Unknown date → no `valid` at all (a missing start already means "no later than the claim") and `at: :stated_at`, because `asserted_at` is the start key:

```kip
ASSERT (:alice, "timezone", "+01:00") {by: :alice, mode: "stated", valid: {from: :moved_at}, evidence: :msg}
```

End — the value simply stopped (left a job, no new one): the same actor's opposite stance from the end date:

```kip
ASSERT (:alice, "works_for", :acme) {by: :alice, mode: "stated", stance: "reject", valid: {from: :left_at}, evidence: :msg}
```

Misrecording — the Brain wrote down what the actor never said ("you misheard me"): not a correction and not a change. It is a protected recording repair (Spec §57.8, Memory Interface `revise` with `change_kind: "misrecorded"`); never supersede or retract on the actor's behalf.

Desugars exactly to `ENSURE PROPOSITION` + `CREATE ASSERTION` (+ `TRANSITION ... TO "superseded" BY` the new Assertion). Never fabricates extra state. The tuple must be a structural `(s, "p", o)`: the `(id: …)` form is match-only and rejected here. The long form — needed for `challenge` / `context` citations or fine control:

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

- Someone tells you a fact → `ASSERT ... {by: <them>, mode: "stated"}`. Recording "Alice said X" needs no permission to *be* Alice: `by` naming an actor you are not bound to needs `record_attributed_assertion`; naming yourself needs `assert`; speaking *as* a reserved actor needs `assert_as_actor` and a binding.
- `SUPERSEDING` means "that claim was wrong". A fact that stopped being true is not wrong: assert the new value with `valid.from` (or the opposite stance from the end) and let succession end the old one.
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

`CREATE EVIDENCE` / `CREATE ASSERTION` / `CREATE ACTIVITY` share one body: `[CLIENT KEY]`, `SET FIELDS`, `SET FACET`*, `SET STRUCTURAL` — no `TYPE`/`NAME`/`SET ATTRIBUTES` (those are Concept clauses). Wrong Evidence is corrected, never edited: `TRANSITION :old TO "corrected" BY :new`.

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
  SET FIELDS { name: "KIP 2.0" }
} EXPECT VERSION :v                         // optional trailing guard; 0 = create-only
```

Clause menus (any order inside the braces, each at most once except `SET/UNSET FACET`): `CREATE CONCEPT` — `TYPE` (required), `CLIENT KEY`, `NAME`, `SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`. `UPSERT CONCEPT` — `MATCH` (required), `SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL`, `UNSET ATTRIBUTES | FACET | STRUCTURAL`, then `EXPECT VERSION` after the closing brace. `MATCH { type: "Person", key: "alice" }` may create; `MATCH { id: :id }` only matches. The `type` is not decoration: a key is identity *within* its type (a Person and a Topic may both be keyed `alice`), and on a create it is the only source of the new Concept's type — so an upsert that must create without one is rejected, and a bare `{key: …}` that names two Concepts is an `IdentityConflict` rather than a coin flip. Where a value goes: Core fields (`name`, `key`) → `SET FIELDS`; schema-declared attributes (`goal`, `status`, …) → `SET ATTRIBUTES`; Profile facet values → `SET FACET "Facet"`; references → `SET STRUCTURAL`.

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
UPDATE ?m
SET FACET "MnemonicState" {
  salience: :salience
}
WHERE {
  ?m {type: "Commitment", attributes: {status: "pending"}}
  FILTER(?m.facets["MnemonicState"].salience < :salience)
}
LIMIT :n
EXPECT VERSION :v OF FACET "MnemonicState"
```

Actions (one or more, in this position): `SET FIELDS | ATTRIBUTES | FACET | STRUCTURAL` and `UNSET ATTRIBUTES | FACET | STRUCTURAL`. `SET FIELDS` deliberately has **no** `UNSET FIELDS`; only schema-legal Core field assignments are allowed. Exact removal shapes:

```kip
UPDATE :concept_id
UNSET ATTRIBUTES {obsolete, "legacy-field"}
UNSET FACET "MnemonicState" {salience}
UNSET STRUCTURAL { ("has_step", :wrong_step) }
```

`UNSET ATTRIBUTES` / `UNSET FACET` contain comma-separated field names, not `{field: null}` assignments. `UNSET STRUCTURAL` removes one named reference; ordered fields re-densify and cardinality is validated. `SET/UNSET STRUCTURAL` through UPDATE applies only to mutable Concept topology. Assertion and Evidence citations/topology are immutable; a pending Activity finalizes topology only through `TRANSITION ... TO "completed" SET STRUCTURAL`, and terminal Activity topology is immutable.

Update expressions: `ADD` `MUL` `CLAMP` `COALESCE` (deterministic, per-target; operands may read only the target's own paths). UPDATE never creates. A direct target needs no `WHERE`: `UPDATE :id SET FACET "MnemonicState" {salience: 0.9}` (same rule as TRANSITION/PURGE/SET RETENTION — a `?var` target is bound by WHERE, `:id`/`"id"` already names the element).

**UPDATE can never touch**: Proposition tuples, Assertion epistemic payload or citations, Evidence payload/topology, Activity topology, `_system`, Governance, Schema. A pending Activity uses `TRANSITION` to finalize fields/topology; a terminal Activity is immutable. Attempting an illegal rewrite → `EpistemicRevisionRequired` / `EvidenceCorrectionRequired` / `ImmutableField`. **Never decay Assertion confidence over time.** Decay is computed, not written: `memory_strength` is a base, `last_metabolized_at` its anchor, and the read-only `?m.facets["MnemonicState"].effective_strength` falls under the pinned `strength_policy`. Reinforce by writing a new base and anchor together from an explicit use signal; never fill a missing strength with a default. Staleness is Projection's job; new knowledge is a new Assertion.

#### 3.6. Lifecycle & removal — one `TRANSITION`, the state names the move

```text
TRANSITION :a TO "retracted" [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]   // the assertor withdraws their own claim
TRANSITION :old TO "superseded" BY ?new                                    // same actor's claim was wrong — not disagreement, not world change
TRANSITION :old TO "corrected" BY :new                                     // wrong Evidence: new record + lineage, never an edit
TRANSITION :act TO "completed" [SET FIELDS {ended_at: :t}] [SET STRUCTURAL {("outputs", ?a)}]   // Activity: running|completed|failed|cancelled; may finalize atomically
TRANSITION :target TO "archived" [WHERE {...}] [LIMIT :n]                  // out of ordinary recall; history preserved
TRANSITION :target TO "tombstoned" [WHERE {...}] [LIMIT :n]                // logical deletion; identity/audit preserved
PURGE :target [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]                 // physical erasure; exceptional
  [REFERENCE POLICY "deny_if_referenced"] CONFIRM "PURGE"                  // policies: deny_if_referenced | tombstone_reference | authorized_cascade
PURGE PAYLOAD :evidence [WHERE {...}] [LIMIT :n] CONFIRM "PURGE"           // erase Evidence bytes only; record, digest, citations, provenance survive
SET RETENTION :target { retention_class: "standard", expires_at: :t } [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
MERGE CONCEPT ?src INTO ?tgt [WHERE {...}] [EXPECT VERSION :v]
```

The engine checks the state against the target's kind and its current state: an Assertion goes to `retracted` or `superseded` (`BY` the newer Assertion), Evidence to `corrected` (`BY` the new Evidence), an Activity to `running` or a terminal state, and any element to `archived` or `tombstoned`. A move from the wrong state fails `InvalidLifecycleTransition`, so there is no `EXPECT STATE`.

Every mutation whose `WHERE` can select an unbounded set takes an optional `LIMIT` right after it (`UPDATE`, `TRANSITION`, `SET RETENTION`, `PURGE`, `PURGE PAYLOAD`) — bound your sweeps. `LIMIT` caps how many are affected, not which: don't assume an order. `MERGE CONCEPT` takes none.

#### 3.7. `DEFINE` — a relation no package names

When a needed relation or type is missing, don't force it into a wrong Predicate and don't leave it Evidence-only: add it to the Space's draft vocabulary (needs `propose_schema`; `draft_vocabulary` capability). `DEFINE` only adds, never changes, commits alone (never inside `MUTATE`), and the new symbol resolves for later operations:

```kip
DEFINE PREDICATE "mentors" {
  description: "The subject mentors the object person.",
  subject: {concept_types: ["Person"]},
  object: {concept_types: ["Person"]}
}
```

`DEFINE CONCEPT TYPE "Place" {description: "..."}` adds a type. Draft Predicates are open-world, and may be `functional` or `functional_by: "object_type"`; they cannot be closed-world or `complete`. A name that already resolves fails `SchemaSymbolConflict`. Promotion into an installed package is an owner's Schema migration.

`MERGE CONCEPT` is non-destructive: source stays addressable as merged history; future writes canonicalize to target. Cycle-creating merges (target already resolves back to source) are rejected.

Preconditions: `EXPECT VERSION :n [OF ATTRIBUTES | STRUCTURAL | RETENTION | FACET "X"]` (optimistic concurrency; `0` = create-only; a plane guards only that plane's own version, so a status verdict is not spoiled by a Facet sweep) is always the **last** clause of a mutation — after `WHERE` and `LIMIT`, after `UPSERT`'s closing brace, after `ENSURE PROPOSITION`'s tuple — and may repeat, one guard per plane.

---

### 4. META — Ground, Verify, Inspect

```text
DESCRIBE PRIMER [MODE "compact" | "full" | :mode]   // identity, Space, execution context, schema map, capabilities, safety invariants
DESCRIBE PROTOCOL | CAPABILITIES                      // CAPABILITIES: supported vs available (for THIS caller), projection capabilities included
DESCRIBE SPACE ["space-id" | :space_id]
DESCRIBE SCHEMA ENVIRONMENT [AS OF SEQ :s]
DESCRIBE SNAPSHOT [AS OF SEQ :s | AT TIME :t]         // the snapshot coordinate; AT TIME resolves an instant to a seq
DESCRIBE TYPE :t | PREDICATE :p | FACET :f | STRUCTURAL FIELD :sf | PACKAGE :pkg | COMPATIBILITY FROM :pkg_a TO :pkg_b
DESCRIBE ERROR :code | CAPSULE :artifact | EPISTEMIC POLICY [:id] | TRUST [:scope] | ACCESS [WITH {operation: "...", resource: :r}]
DESCRIBE TRANSACTION :tx_id | DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
LIST SPACES | TYPES | PREDICATES | FACETS | STRUCTURAL FIELDS | EPISTEMIC POLICIES [LIMIT :n] [CURSOR :c]
LIST SCHEMA PACKAGES [STATUS "active" | :status] [LIMIT :n] [CURSOR :c]
LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c]   // cognition derived from an element, via Activity inputs→outputs (+ derivation fields)
HISTORY ELEMENT :id [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]   // transition chronology
HISTORY SPACE [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
CHANGES SINCE :cursor [LIMIT :n] | CHANGES AFTER SEQ :seq [LIMIT :n]   // transaction-grained stream
VERIFY CAPSULE | SCHEMA PACKAGE | RECEIPT :artifact
VALIDATE KQL | KML | CAPSULE | SCHEMA PACKAGE | IMPORT PLAN :input [WITH {...}]
PREVIEW KML :cmd | PREVIEW IMPORT CAPSULE :capsule INTO :space
EXPORT CAPSULE ?roots WHERE {...}                                      // ?roots bound by WHERE, or :id / "id" for one root
  [WITH {closure: "referential", provenance_depth: 2, include_schema: true, include_blobs: false, proof_profile: "..."}]
  [AS OF SEQ :s]
```

```text
SEARCH <KIND> :term
  [WITH TYPE :type] [WITH PREDICATE :pred]
  [MODE "keyword" | "semantic" | "hybrid" | :mode]
  [THRESHOLD :t] [AS OF SEQ :s] [LIMIT :n] [CURSOR :c]

KIND = CONCEPT | PROPOSITION | ASSERTION | EVIDENCE | ACTIVITY
```

All SEARCH modifiers use exactly that order. `WITH TYPE` / `WITH PREDICATE` are used only where meaningful for the selected kind; runtime semantic validation decides applicability. `AS OF SEQ` requires the advertised `historical_search` capability.

```kip
SEARCH CONCEPT :term
WITH TYPE :type
MODE "hybrid"
THRESHOLD :threshold
LIMIT :limit
```

SEARCH is grounding only: score ≠ confidence ≠ belief; miss ≠ absence; results disclose `index_seq` freshness. Golden path: **SEARCH → exact id → BELIEF/FIND**, or one `FIND` with a Search Pattern (§2) when grounding and belief belong in the same read.

Five-layer discipline: `DESCRIBE/SEARCH` (find) ≠ `VERIFY` (integrity) ≠ `VALIDATE` (legality) ≠ `PREVIEW` (simulated effect) ≠ **Receipt** (what actually committed).

---

### 5. Runtime Envelope

This is a complete **common-path request**, not the full wire grammar:

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
      "observed_at": "2026-08-16T01:00:00.000Z",
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

#### 5.1. Ingestion, execution, and recovery

- **Execution modes** (required when >1 operation): `independent` (isolated, concurrent; each result states its `snapshot_seq`) | `sequence` (ordered, separate commits, no rollback of earlier; `on_error` defaults to `stop`) | `atomic` (one transaction, one snapshot, read-your-writes, all-or-none). `atomic` is the `atomic_batch` capability (§67.4, §75.3): an engine that does not advertise it refuses the request rather than running it as a sequence, and a single `MUTATE` block is already one transaction. In `sequence`/`independent` each write's Receipt is in `results[].receipt`; only `atomic` has the top-level `receipt`. `execution.idempotency_key` is echoed back.
- **§5.1 Ingestion**: each `ingest.evidence[].key` becomes a parameter bound to runtime-minted Evidence — observed payloads never pass through your generated text. Each entry supplies exactly one of `payload` or `payload_artifact`, and may carry `facets` (e.g. `OutcomeRecord` on an `outcome`). Writing `outcome` Evidence needs `record_outcome`; an outcome grades a decision only through an `outcome_observation` Activity that names the `action_gate` among its inputs.
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

Types: `Person`, `Event`, `Experience`, `ExperienceStep`, `Insight`, `Commitment`, `Watch`, `SleepTask`, `SelfModel`, `WorkingState`, `Skill`, `SkillRevision` (no Preference type: a preference is a `prefers` claim, its summary an Insight). Skill is stable identity; required current_revision points to immutable behavior (task_family, procedure, optional applicability/preconditions/success_criteria/recovery, behavior_digest). Standing (`unproven | validated | unverifiable | revoked`) and authority bind that revision; only the Validated Learning companion promotes. Selecting new behavior resets current standing to proposed; ordinary UPDATE cannot rewrite behavior. See the normative Cognitive Memory Profile.

Predicates: `prefers` (Person→Concept, one preference per kind of option, each option typed by its kind — `ColorScheme`, `Editor`, from a domain package or `DEFINE CONCEPT TYPE`, never a catch-all — a newer one succeeds the older within its kind) `caused_by` (Step→Step, effect→cause, evidence-backed) `same_as` (identity claim → review). Everyday facts come from `kip://domains/general@1.0.0`: `lives_in` `located_in` `works_for` `member_of` `knows` `timezone` `speaks` `interested_in` over `Place` `Organization` `Topic`; anything else → `DEFINE`.

Facets: `MnemonicState` (base `memory_strength` + anchor `last_metabolized_at` + `strength_policy` → computed `effective_strength`; `salience`; `utility`), `GradingState` (computed, read-only view of the current evaluation). Immutable Activity facets: `DependencyBasis`, `DecisionRecord` (retrieved/used/applied revisions + basis), `AttemptRecord`, `TrialRecord`, `EvaluationRecord`, `CompressionRecord`, `RecallCoverage`. Immutable Evidence facet: `OutcomeRecord`. Guarded operational facets: `WatchState`, `LeaseState`. Field shapes are in `schemas/kip-cognitive-records.schema.json`. Required dependencies are checked through the computed `_system.dependency_validity` before use, without rewriting history.

Structural fields: `has_step` (ordered) `experienced_by` `involves` `mentions` `about` `current_revision` `revision_of` `current_trial` `current_evaluation` `committed_to` `owed_to` `assigned_to` `watches`; computed from Activity provenance (read-only): `derived_from` `compiled_from` `compiled_by` `consolidated_to`; Core built-ins on records: `evidence` `source` `generated_by` `inputs` `outputs` `associated_actors`.

Invariants: failed Experience is first-class memory; one success ≠ adopted Skill; adopted Skill ≠ execution authority; your own report of how your action went is `agent_statement`, never `outcome` Evidence; SelfModel ≠ Governance; a fired Watch is attention, not permission — record the gate decision (`action_gate` Activity + `DecisionRecord`: act|ask|defer|silence, inputs = what you applied), silence included; an outcome grades a Skill only through the `outcome_observation` link to that decision, never by sharing its `task_family`; WorkingState is served with its `basis_seq` and never cited as Evidence; imported memory keeps `mode: "imported"` and never becomes local autobiography (an imported Skill re-enters at `proposed`).

---

### 7. Errors (self-correct from these)

Categories: `syntax protocol schema data epistemic governance transaction history search artifact resource transport system`. Every error carries `code`, `hint`, and `retry.class`:

```text
safe_same_request | requires_refresh | requires_different_input | requires_authority
| requires_new_snapshot | requires_reacquire_artifact | outcome_lookup_required | non_retryable
```

Frequent codes → fix: `SchemaSymbolAmbiguous` (use exact `kip://pkg@ver/symbol`) · `SchemaSymbolNotFound` (DESCRIBE first; if the relation truly is missing, `DEFINE` it) · `SchemaSymbolConflict` (that name already exists — use it) · `EpistemicRevisionRequired` (you tried to UPDATE belief history → new Assertion + SUPERSEDING) · `EvidenceCorrectionRequired` (→ CORRECT ... BY) · `VersionConflict` (re-read, re-apply, retry with fresh EXPECT VERSION) · `IdempotencyConflict` (same key, different request — pick a new key) · `OutcomeUnknown` (→ lookup by idempotency key) · `NotFoundOrNotVisible` (may exist beyond your visibility — never conclude falsehood) · `ReadonlyViolation` / `LanguageMismatch` (actual parsed semantics rule).

---

### 8. Best Practices

1. **Ground before writing**: `SEARCH` + `DESCRIBE` → exact ids and schema refs. Persist exact versions, never `@latest`.
2. **Hot path = `ASSERT` + ingestion**: attributed claim in one statement; evidence minted by the runtime, referenced as `:key` — never re-type observed payloads.
3. **Belief questions get `BELIEF`/`BELIEF SLOT`**; raw `FIND` is for audit/history/conflict inspection. Report `insufficient` as "not enough basis", never as "no".
4. **Three kinds of revision**: the actor was wrong → `ASSERT ... SUPERSEDING :old` (+ `belief_revision` Activity for material revisions); the world changed → one `ASSERT` with `valid.from`; the Brain misrecorded → recording repair. Disagreement between actors just coexists.
5. **One coherent change = one atomic MUTATE/transaction**: Evidence+Assertion; Experience+Steps+Activity; correction+supersession. Don't leave misleading halves.
6. **Metabolism touches Facets only**: decay is computed; reinforce by writing a new base and anchor; adjust `salience` — Assertion confidence is never edited, and `GradingState` is never written; epistemically material change creates a new Assertion.
7. **Removal is a ladder**: archive → tombstone → purge (policied, confirmed). Merging is non-destructive; identity suspicion = `same_as` claim + review.
8. **Respect the write path for retries**: same intent = same `idempotency_key`; distinct real-world observations = distinct `client_key`s. Retry ≠ new Experience.
9. **Time is two axes**: use `FOR TIME` for "when was it valid", `AS OF` for "what did the Brain hold then"; combine them only when both cognitive-history time and world-valid time are specified.
10. **You are the Principal, not the actor**: `by:` names whose stance it is; your authority to record it comes from Governance, and nothing you write can expand your own authority, trust, or schema.
11. **Validate generated commands**: parser-valid ≠ Schema-valid ≠ authorized ≠ committed. Use `VALIDATE`/`PREVIEW` for non-trivial or high-impact commands, repair from structured errors, and treat only the Receipt as durable truth.
