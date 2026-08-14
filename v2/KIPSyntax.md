## 🧬 KIP 2.0 Syntax Reference (LLM-Facing)

**[English](./KIPSyntax.md) | [中文](./KIPSyntax_CN.md)**

**Full Spec**: `KIP-2.0-SPECIFICATION.md` (normative; this card is a faithful condensation)

KIP 2.0 is a cognitive state protocol between an Agent and a persistent **Cognitive Nexus**. You read with **KQL** (`FIND`), change cognition with **KML** (`ASSERT` / `MUTATE` / ...), and ground/introspect with **META** (`DESCRIBE` / `SEARCH` / `VERIFY` / ...). Values are JSON-compatible; keywords are ASCII case-insensitive (canonical UPPERCASE); schema symbols and strings stay case-sensitive.

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

| Kind            | What it is                                                    | Mutability |
| --------------- | ------------------------------------------------------------- | ---------- |
| **Concept**     | Referable entity/typed object (`schema_ref`, `key`, `name`, `attributes`) | mutable state |
| **Proposition** | Truth-neutral statement `(subject, predicate, object)`        | immutable tuple |
| **Assertion**   | Actor's stance toward one Proposition (`asserted_by`, `stance`, `mode`, `confidence`, `asserted_at`, `valid_time`, evidence citations, lifecycle) | payload immutable; revise by new Assertion |
| **Evidence**    | Observed artifact (`evidence_class`, payload, `observed_at`)  | payload immutable; correct via lineage |
| **Activity**    | Provenance process (`activity_class`, inputs → outputs)       | immutable once terminal |

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

#### 1.5. Lexical

```text
?name    variable / KML local handle        :name    bound parameter (complete value position)
"..."    JSON string    numbers/true/false/null    [...] arrays    {...} objects
identifiers: [A-Za-z_][A-Za-z0-9_]*         // comments to end of line
```

Parameters are structurally bound data, never string-spliced; don't embed them inside quoted strings.

---

### 2. KQL — Read

```prolog
FIND(<projections>)
WHERE { <patterns and filters> }
[AS OF SEQ :seq | AS OF TX :tx | AS OF TIME :t]   // cognitive history: what the Brain contained/believed then
[FOR TIME :world_time]                            // world-valid time: what was applicable then
[WITH EPISTEMIC { purpose: "...", explanation: "none|summary|ledger", ... }]
[ORDER BY <expr> [ASC|DESC], ...] [LIMIT :n] [CURSOR :cursor]
```

`AS OF` and `FOR TIME` are independent axes. "What did I believe then?" = both; "what do I now believe about then?" = `FOR TIME` only.

#### 2.1. Pattern families

```prolog
?person {type: "Person", name: "Alice"}              // Concept (type = schema sugar)
?p (?person, "works_for", ?org)                      // raw Proposition — existence, NOT belief
?p (?s, ?predicate, ?o)                              // predicate variable → binds exact predicate ref
?a ASSERTION {proposition: ?p, asserted_by: ?actor, stance: "support", mode: "stated"}
?e EVIDENCE {evidence_class: "tool_result"}
?act ACTIVITY {activity_class: "inference", status: "completed"}
?edge STRUCTURAL (?experience, "has_step", ?step)    // topology; ?edge.index for ordered fields
?belief BELIEF (?person, "timezone", ?tz)            // Epistemic Projection (virtual, read-only)
?belief BELIEF (?p)                                  // project an already-bound Proposition
?slot BELIEF SLOT (?person, "timezone")              // whole functional slot: candidates + conflicts
```

**BELIEF output**: `status` ∈ `accepted | rejected | contested | uncertain | insufficient`, plus support/opposition, uncertainty, policy identity, temporal basis. A fully grounded BELIEF over a never-stored Proposition returns `insufficient` (not zero rows). BELIEF SLOT returns `accepted_values` + `candidate_projections`. Support and opposition scores don't sum to 1.

**When to use what**: answering "what is true?" → `BELIEF` / `BELIEF SLOT`. Auditing "who said what, based on what?" → raw Proposition/Assertion/Evidence patterns. Never present raw rows as accepted belief.

#### 2.2. Expressions

```prolog
FILTER(?a.confidence > 0.8 && ?a.lifecycle.status == "active")
FILTER(IN(?x.name, ["A", "B"]))    // also: CONTAINS STARTS_WITH ENDS_WITH REGEX
FILTER(IS_NULL(?opt))              // IS_NOT_NULL IS_LITERAL IS_ELEMENT IS_KIND
NOT { (?person, "prefers", ?x) }   // = no visible match; NEVER world-level falsehood
OPTIONAL { ... }                   // left join; null = no visible match
UNION { ... }                      // alternative branch
```

Dot paths: `?x.id` `?x.name` `?x.attributes.goal` `?a.lifecycle.status` `?x._system.version` `?x.facets["MnemonicState"].memory_strength` `?edge.index`

Aggregates: `COUNT(?x)` `COUNT(DISTINCT ?x)` `SUM/AVG/MIN/MAX`. `COUNT = 0` never proves falsehood.

Raw paths (traversal only, no belief propagation): `(?x, "is_subclass_of"{0,5}, ?anc)`, alternatives `(?x, "related_to" | "depends_on", ?y)`.

Cursors are opaque, snapshot-pinned, family-specific; current Governance still applies on continuation.

---

### 3. KML — Write

A KML mutation becomes durable only via a Transaction (all-or-nothing, receipt-confirmed).

#### 3.1. `ASSERT` — the everyday write (sugar, normative)

Recording an attributed claim is the hot path. Use the sugar:

```prolog
ASSERT (:alice, "prefers", :dark_mode) {
  by: :alice,              // REQUIRED semantic actor → asserted_by
  mode: "stated",          // REQUIRED: observed|stated|inferred|predicted|hypothetical|imported
  confidence: 0.95,        // optional [0,1]: strength of THIS stance, not truth probability
  evidence: :msg,          // optional: Evidence ref or array (runtime-ingested preferred)
  stance: "support",       // optional, default support (support|reject|uncertain)
  at: :time,               // optional → asserted_at (default: engine transaction time)
  key: :client_key         // optional retry-safe identity
}
```

Correction (same actor changed their claim):

```prolog
ASSERT (:alice, "timezone", "+01:00") {
  by: :alice, mode: "stated", evidence: :e2
} SUPERSEDING :old_assertion
```

Desugars exactly to `ENSURE PROPOSITION` + `CREATE ASSERTION` (+ `SUPERSEDE`). Never fabricates extra state.

Rules of stance:
- Someone tells you a fact → `ASSERT ... {by: <them>, mode: "stated"}`. Recording "Alice said X" needs no permission to *be* Alice.
- You (the Brain) infer something → `by: <self>, mode: "inferred"`, cite premises as evidence.
- Disagreement between actors → two coexisting Assertions (contested), **never** supersession or deletion.
- Denial → `stance: "reject"` toward the positive Proposition, not a fabricated `false` object.

#### 3.2. Evidence — never re-type observed content

Preferred: the request's **ingestion context** mints Evidence from the transport envelope; you only reference `:key` (see §5.1). If you must create manually:

```prolog
CREATE EVIDENCE ?e {
  CLIENT KEY :e_key
  SET FIELDS { evidence_class: "tool_result", payload: :payload, observed_at: :time }
  SET STRUCTURAL { ("source", :actor) }
}
```

Wrong Evidence is corrected, never edited: `CORRECT EVIDENCE :old BY :new`.

#### 3.3. Concepts

```prolog
CREATE CONCEPT ?exp {                       // historically distinct thing
  TYPE "Experience"
  CLIENT KEY :exp_key
  NAME "Deploy v2 failure"
  SET ATTRIBUTES { goal: :goal, outcome_status: "failure" }
  SET FACET "MnemonicState" { memory_strength: 0.8, salience: 0.9 }
  SET STRUCTURAL { ("has_step", ?s0) {index: 0} ("has_step", ?s1) {index: 1} }
}

UPSERT CONCEPT ?proj {                      // stable identity-bearing Concept
  MATCH { type: "Project", key: "kip-2" }   // identity = id/key; name-only upsert is forbidden
  SET FIELDS { name: "KIP 2.0" }
}
```

#### 3.4. `MUTATE` — one atomic cognitive transition

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

Handles (`?e`, `?a`) are block-local; forward references are allowed; the engine validates the whole graph, then commits all-or-nothing.

#### 3.5. UPDATE — mutable state only

```prolog
UPDATE ?m
SET FACET "MnemonicState" {
  memory_strength: CLAMP(MUL(?m.facets["MnemonicState"].memory_strength, :decay), 0, 1)
}
WHERE { ?m {type: "Experience"} FILTER(...) }
LIMIT :n
```

Update expressions: `ADD` `MUL` `CLAMP` `COALESCE` (deterministic, per-target). UPDATE never creates.

**UPDATE can never touch**: Proposition tuples, Assertion epistemic payload (stance/confidence/actor/time), Evidence payload, terminal Activity topology, `_system`, Governance, Schema. Attempting → `EpistemicRevisionRequired` / `ImmutableField`. **Never decay Assertion confidence over time** — disuse decays `memory_strength`; staleness is Projection's job; new knowledge is a new Assertion.

#### 3.6. Lifecycle & removal (four different things)

```prolog
RETRACT ASSERTION :a EXPECT STATE "active"   // the assertor withdraws their own claim
SUPERSEDE ASSERTION :old BY ?new             // same actor/lineage revision — not disagreement
ARCHIVE :target WHERE {...}                  // out of ordinary recall; history preserved
TOMBSTONE :target WHERE {...}                // logical deletion; identity/audit preserved
PURGE :target WHERE {...}                    // physical erasure; exceptional
  REFERENCE POLICY "deny_if_referenced" CONFIRM "PURGE"
SET RETENTION :target { retention_class: "standard", expires_at: :t }
```

`MERGE CONCEPT ?src INTO ?tgt WHERE {...}` — non-destructive: source stays addressable as merged history; future writes canonicalize to target.

Preconditions: `EXPECT VERSION :n` (optimistic concurrency; `EXPECT VERSION 0` = create-only), `EXPECT STATE "..."`.

---

### 4. META — Ground, Verify, Inspect

```prolog
DESCRIBE PRIMER [MODE "compact"]      // identity, Space, schema map, capabilities, safety invariants
DESCRIBE CAPABILITIES                 // supported vs available (for THIS caller)
DESCRIBE TYPE :t | PREDICATE :p | FACET :f | STRUCTURAL FIELD :sf | PACKAGE :pkg
DESCRIBE SCHEMA ENVIRONMENT | SPACE | EXECUTION CONTEXT | EPISTEMIC POLICY [:id] | TRUST [:scope]
DESCRIBE TRANSACTION :tx_id | DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
LIST TYPES | PREDICATES | FACETS | STRUCTURAL FIELDS | SCHEMA PACKAGES | SPACES [LIMIT :n]
HISTORY ELEMENT :id | HISTORY SPACE [FROM SEQ :a] [TO SEQ :b]     // transition chronology
CHANGES SINCE :cursor | CHANGES AFTER SEQ :seq                    // transaction-grained stream
SNAPSHOT [AS OF SEQ :seq]
VERIFY CAPSULE :artifact | VALIDATE KML :cmd | PREVIEW KML :cmd | PREVIEW IMPORT CAPSULE :c INTO :space
EXPORT CAPSULE ?roots WHERE {...} [WITH {closure: "referential"}] [AS OF SEQ :seq]
```

```prolog
SEARCH CONCEPT :term [WITH TYPE :type] [MODE "keyword"|"semantic"|"hybrid"]
  [THRESHOLD :t] [LIMIT :n] [CURSOR :c]        // also: PROPOSITION|ASSERTION|EVIDENCE|ACTIVITY|COGNITION
```

SEARCH is grounding only: score ≠ confidence ≠ belief; miss ≠ absence; results disclose `index_seq` freshness. Golden path: **SEARCH → exact id → BELIEF/FIND**.

Five-layer discipline: `DESCRIBE/SEARCH` (find) ≠ `VERIFY` (integrity) ≠ `VALIDATE` (legality) ≠ `PREVIEW` (simulated effect) ≠ **Receipt** (what actually committed).

---

### 5. Runtime Envelope

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

- **Execution modes** (required when >1 operation): `independent` (isolated, concurrent) | `sequence` (ordered, separate commits, no rollback of earlier) | `atomic` (one transaction, one snapshot, read-your-writes, all-or-none).
- **§5.1 Ingestion**: each `ingest.evidence[].key` becomes a parameter bound to runtime-minted Evidence — observed payloads never pass through your generated text.
- **Identity trio**: `request_id` (one network attempt) ≠ `idempotency_key` (one logical write intent) ≠ `tx_id` (committed fact). Retry the same logical write with the **same** idempotency key.
- **Response**: top status `succeeded|failed|partial|outcome_unknown`; per-op `succeeded|failed|skipped|rolled_back|no_effect`; committed receipt carries `tx_id`, `space_seq`, digests.
- **Timeout ≠ abort**: on lost response, `DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key` or retry the identical request/key. Never re-form the memory fresh.

---

### 6. Cognitive Memory Profile (quick reference)

Types: `Person` `Event` (what happened) `Experience` (goal-directed trajectory; required `goal`, `outcome_status`) `ExperienceStep` (`step_kind`: context|observation|decision|action|feedback|belief_update; `summary`; order = has_step edge index) `Preference` (summary artifact — the claim itself stays Proposition+Assertion) `Insight` `Commitment` (`status`: pending|fulfilled|cancelled|expired|blocked; `due_at` ≠ retention expiry) `Skill` (`skill_class`, `procedure`, `status`: candidate|validated|needs_review|deprecated|archived) `SleepTask` `SelfModel`

Predicates: `prefers` (Person→Concept) `caused_by` (Step→Step, effect→cause, evidence-backed) `same_as` (identity claim → review)

Facets: `MnemonicState {memory_strength, salience}` `SkillUtility {utility, success_count, failure_count}` — all `[0,1]`, none of them truth.

Structural fields: `has_step` (ordered) `experienced_by` `involves` `mentions` `about` `derived_from` `consolidated_to` `compiled_from` `compiled_by` `committed_to` `owed_to` `assigned_to`; Core built-ins on records: `evidence` `source` `generated_by` `inputs` `outputs`.

Invariants: failed Experience is first-class memory; one success ≠ validated Skill; validated Skill ≠ execution authority; SelfModel ≠ Governance; imported memory keeps `mode: "imported"` and never becomes local autobiography.

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
6. **Metabolism touches Facets only**: decay `memory_strength`, adjust `salience`, update `SkillUtility` — Assertion confidence changes only on epistemic grounds.
7. **Removal is a ladder**: archive → tombstone → purge (policied, confirmed). Merging is non-destructive; identity suspicion = `same_as` claim + review.
8. **Respect the write path for retries**: same intent = same `idempotency_key`; distinct real-world observations = distinct `client_key`s. Retry ≠ new Experience.
9. **Time is two axes**: use `FOR TIME` for "when was it valid", `AS OF` for "what did the Brain hold then"; both for full historical belief.
10. **You are the Principal, not the actor**: `by:` names whose stance it is; your authority to record it comes from Governance, and nothing you write can expand your own authority, trust, or schema.
