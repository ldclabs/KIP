# KIP 2.0 Formal Verification Report

**[English](./REPORT.md) | [中文](./REPORT_CN.md)**

**Date**: 2026-08-15
**Target**: `v2/KIP-2.0-SPECIFICATION.md` (2.0-draft) and `v2/grammar/*.ebnf`
**Artifacts**: [`alloy/kip-core.als`](./alloy/kip-core.als), [`tla/KipTransactions.tla`](./tla/KipTransactions.tla), [`governance/check_governance.py`](./governance/check_governance.py), [`grammar/check_ebnf.py`](./grammar/check_ebnf.py), [`run.sh`](./run.sh)

---

## 1. What "formal verification" means here — and what it cannot mean

KIP 2.0 splits cleanly into layers with very different verifiability:

| Layer                               | Verifiable?                    | Method used                                 |
| ----------------------------------- | ------------------------------ | ------------------------------------------- |
| Grammar (KQL/KML/META EBNF)         | Yes, mechanically              | static consistency analysis (this suite)    |
| Core data model invariants (§5–§23) | Yes, bounded                   | Alloy 6 temporal model checking             |
| Transaction runtime (§32–§36)       | Yes, bounded                   | TLA+ / TLC explicit-state model checking    |
| Governance evaluation (§29–§31)     | Yes, bounded-exhaustive        | exhaustive decision-procedure checking      |
| Epistemic Projection *policies*     | No — deliberately unprescribed | (frame properties only)                     |
| Memory/learning as behavior         | No — empirical, Brain-level    | §21.3-style ablation benchmarks, not proofs |

Two standing caveats apply to every result below:

1. **Bounded, not unbounded**: Alloy/TLC verify all behaviors within finite
   scopes (small-scope hypothesis). They are refutation-complete within the
   scope: any invariant violation expressible with ≤ N atoms / steps would
   have been found.
2. **Model–spec gap**: the models formalize *our reading* of the prose
   specification. Where the spec was ambiguous, the ambiguity itself is
   reported as a finding rather than silently resolved.

---

## 2. Suite 1 — Alloy 6 temporal model of the Core data model

`alloy/kip-core.als` models Concept / Proposition / Assertion / Evidence
(+ Capsule import, derivation via Activity, authority classes, merge) as a
transition system. Spec-mandated immutability (§6.3 `_system.origin`,
§12.5 Proposition tuple, §13.7 Assertion payload) is encoded structurally:
those fields *cannot* change, by construction. Mutable state (element
creation, lifecycle status, `merged_into`, authority, elevation audit)
evolves only through events that encode the spec's write operations.

### Theorems checked (expected UNSAT = no counterexample in scope)

| #   | Property                                                                                                                | Spec                | Result                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------ |
| C1  | Canonical Proposition uniqueness is preserved by all operation interleavings without merge                              | §12.3–§12.4         | **verified**                               |
| C2  | History is monotone — no operation removes elements (purge excluded from scope)                                         | §11.1, §13.8, §15.5 | **verified**                               |
| C3  | No lifecycle resurrection: retracted/superseded/expired assertions never return to active                               | §14                 | **verified**                               |
| C4  | Same-Space closure holds after every operation, including derived writes                                                | §5.3                | **verified** (after model repair — see F3) |
| C5  | Cycle-guarded merge keeps canonical resolution well-defined                                                             | §11 (repaired)      | **verified**                               |
| C6  | No element with imported ancestry ever exceeds Descriptive authority unless an explicit elevation exists in its lineage | §29.6, §31.4, §31.5 | **verified**                               |
| C7  | Derivation never mints new epistemic roots (No Evidence Multiplication)                                                 | §23.1–§23.2         | **verified**                               |

### Witness traces (expected SAT = scenario is representable/reachable)

| #   | Scenario                                                                                                                                                                    | Spec         | Result        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------- |
| R1  | A merge really can make two live Propositions collide on one canonical tuple — the reason §11.4's MAY-consolidate clause must exist                                         | §11.4        | **witnessed** |
| R2  | **FINDING F1**: §11 as written permits a merge cycle (A→B, then B→A), making canonical resolution undefined                                                                 | §11          | **witnessed** |
| R3  | With a derive that ignores input authority (violating §29.6), imported content is laundered to Executable authority with no elevation — demonstrating §29.6 is load-bearing | §29.6        | **witnessed** |
| R4  | Three supporting Evidence items collapse to a single independent root: copy/derive chains manufacture no corroboration                                                      | §23.1, §23.4 | **witnessed** |

C6 deserves emphasis: it is an inductive security property over *all*
interleavings of create/derive/import/elevate/merge/lifecycle events —
exactly the "origin cannot be laundered by summarization/consolidation
chains" guarantee that Architecture §16.2 promises. The paired R3 trace
shows the guarantee disappears the moment an implementation computes
derived authority from anything other than input lineage.

**Scopes and cost.** Checks run with 2 Spaces, 2 Principals, and per-kind
element scopes of 2–4 atoms over traces of 6–8 steps (glucose backend).
Most obligations solve in seconds; C6 is the expensive one — its published
scope (2 Concept / 3 Evidence / 1 Capsule / 6 steps, ~40 s) is sized to
the minimal laundering chain *import → derive → derive → elevate* plus
merge interaction, and one element/step beyond that scope already exceeds
a 10-minute SAT budget. Within scope the checks are exhaustive over all
event interleavings.

---

## 3. Suite 2 — TLA+/TLC model of the transaction runtime

`tla/KipTransactions.tla` models concurrent clients submitting write
batches with optional `EXPECT VERSION` guards and idempotency keys
(§32–§36). The engine's commit is one atomic step (that is §32.1's own
obligation, assumed); what is *checked* is the protocol logic above it.

### Spec-conformant mode (`KipTransactions_spec.cfg`)

2 clients × 2 elements × 3 keys × 2 values; **771,913 distinct states**,
all six invariants hold:

| Invariant                   | Meaning                                                                                                      | Spec                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `LogExpectationsConsistent` | every committed guarded write observed exactly the version it expected (no lost update)                      | §32.3 (12), §35.1, §35.5 |
| `AnswersConsistent`         | one idempotency key never returns two different successful outcomes                                          | §34.3                    |
| `SeqDense`                  | `space_seq` is dense, monotone, allocated only by state-changing commits, and equals the Commit Record index | §32.8, §33.1, §36.1      |
| `IdemUniqueCommit`          | at most one Commit Record per idempotency key                                                                | §34                      |
| `VersionsMatchLog`          | `_system.version` equals the number of committed writes of that element                                      | §35.5                    |
| `TypeOK`                    | state typing                                                                                                 | —                        |

### Bug-injection mode 1: snapshot-time validation (`_toctou.cfg`)

Validating `EXPECT VERSION` against the prepare-time snapshot instead of
commit-time state (forbidden by §32.3 phase 12) yields a **5-state
counterexample**: c1 snapshots version 0 and submits `EXPECT VERSION 0`;
c2 commits first (version → 1); c1's stale commit is accepted — a classic
lost update. This demonstrates the commit-time revalidation requirement is
load-bearing, not stylistic.

### Bug-injection mode 2: no_effect not retained (`_noretain.cfg`)

An implementation that retains only *state-changing* outcomes under
idempotency keys (a plausible misreading of §32.8 + §33.1) violates
§34.3: submit(k) → `no_effect`; another transaction changes the state;
retry(k) with identical bytes now *commits*. One key produced two
different successful outcomes. **This is FINDING F2** — see §6.

---

## 4. Suite 3 — Governance evaluation decision procedure

`governance/check_governance.py` formalizes §30 (deny-overrides, protocol
invariants override policy, default deny) as a pure decision procedure
and exhaustively checks, over a bounded-complete domain (90 possible
rules with wildcard scopes × 28 requests × all rule sets to size 2 × all
permutations × all 1-rule extensions — **10,939,388 decision checks**):

| Property                 | Meaning                                                    | Result    |
| ------------------------ | ---------------------------------------------------------- | --------- |
| P1 Totality              | every request decides to exactly allow/deny                | **holds** |
| P2 Order-independence    | policy rule *lists* behave as rule *sets*                  | **holds** |
| P3 Deny-monotonicity     | adding a deny can never flip deny→allow                    | **holds** |
| P4 Allow-cannot-override | explicit-deny / invariant denials survive any added allows | **holds** |
| P5 Invariant supremacy   | §30.3 protocol-invalid ops denied under *every* policy     | **holds** |
| P6 Duplicate idempotence | duplicating a rule changes nothing                         | **holds** |

These are the properties §30 relies on but never states; they now hold by
checked construction for the natural reading of the evaluation order.

---

## 5. Suite 4 — EBNF grammar consistency

`grammar/check_ebnf.py` parses the three ISO-14977-style grammars:

| Check                             | KQL (77 rules) | KML (106 rules) | META (109 rules) |
| --------------------------------- | -------------- | --------------- | ---------------- |
| G1 well-formedness                | ok             | ok              | ok               |
| G2 no duplicate definitions       | ok             | ok              | ok               |
| G3 no undefined nonterminals      | ok             | ok              | ok               |
| G4 all rules reachable from start | ok             | ok              | ok               |

Cross-grammar (G5): 60 shared nonterminals. Three alias groups verified
definitionally equivalent (`meta_value` ≡ `scalar_or_parameter` ≡
`scalar_value`; `structural_field` ≡ `schema_symbol`). Two divergences
are real but intentional, now pinned in a reviewed whitelist:

- `proposition_tuple` — KQL alone permits raw predicate *path
  expressions*; KML/META require an exact `predicate_atom` (documented
  KQL grammar decision 4);
- `where_clause` — KQL alone has `BELIEF` / `BELIEF SLOT` patterns
  (projection is query-side; the mutation language has no belief match).

Any *new* drift in shared rules now fails CI. See F4 for a hygiene
recommendation.

---

## 6. Findings

> **Status**: the recommendations below were applied on 2026-08-15 in the
> same change set that adds this report — Specification §11.1 / §29.6 /
> §34.3 (EN + CN), the three grammar headers, `KIPSyntax.md` (EN + CN),
> and `design/KIP-2.0-Transactions.md` §17 (EN + CN).

### F1 — §11 Concept Merge permits a resolution cycle (normative gap)

§11.1 constrains only the *source* of a merge ("A not already merged" is
not even stated — the model grants it charitably). Nothing forbids
merging A→B and then B→A: Alloy reaches the cycle in two merge events
(witness R2), after which canonical resolution (`follow merged_into to
fixpoint`) never terminates and `canon[]` is undefined — with knock-on
effects on §12.3 canonical Proposition identity, §11.4 collision
consolidation, and any implementation that resolves references through
merge chains.

**Recommendation**: add to §11 — "A merge MUST NOT create a cycle in
`merged_into`; the runtime MUST reject a merge whose target resolves
(transitively) to the source." The guarded variant is verified acyclic
(C5).

### F2 — §32.8 × §34.3 interaction is underspecified (clarification)

§34.3 requires returning "the original retained transaction outcome" for
a repeated key, which presupposes the outcome was retained. §32.8 says a
`no_effect` transaction allocates no `space_seq`, and §33.1 attaches
Commit Records only to state-changing commits. An implementer who
concludes that `no_effect` outcomes therefore need no idempotency
retention ships a §34.3 violation that TLC finds mechanically (Suite 2,
mode 2).

**Recommendation**: add one sentence to §34: "Retention applies to every
finalized outcome, including `no_effect`; a `no_effect` outcome MUST be
retained and replayed like any committed outcome." (Whether *aborted*
transactions are retained is likewise unstated and worth an explicit
sentence; the model treats aborts as not retained.)

### F3 — Same-Space closure must be revalidated on derived writes (guidance)

An early version of the Alloy model guarded §5.3 closure on primary
creation paths only; the checker immediately produced a derived Assertion
whose Proposition lived in a foreign Space (C4 counterexample). The spec
is not wrong — §5.3 states the closure universally — but §29.6's list of
`derive` obligations (classification propagation, provenance
preservation, authority non-amplification) does not mention reference
closure, and derived/inference writes are exactly where an implementation
is most likely to skip revalidation.

**Recommendation**: mention Same-Space closure explicitly in §29.6 or in
the §32.3 phase-10 validation description as applying to *every* write
path, including derived and maintenance writes.

### F4 — Same-name, different-shape grammar rules (hygiene)

`proposition_tuple` and `where_clause` are intentionally different across
the three grammars while sharing a name; `scalar_value` /
`scalar_or_parameter` / `meta_value` are intentionally identical while
having three names. Both directions invite silent drift on future edits.

**Recommendation**: either rename divergent rules (e.g. KQL
`raw_proposition_tuple`) and unify alias names, or keep
`grammar/check_ebnf.py` in CI so the reviewed whitelist is the single
source of truth for permitted divergence.

### Positive assurance worth stating

- The §23 Epistemic Independence machinery does exactly what
  `post/Knowledge_Experience_Memory_Skill.md` demands: copy/summarize/derive chains cannot
  manufacture corroboration (C7 + R4), and circular provenance cannot
  amplify support because engine-verified lineage is acyclic by
  construction and imported claimed lineage collapses to one capsule
  root.
- The origin/authority security core (Architecture §16, Spec §31.5) is
  inductively sound in scope (C6) and demonstrably load-bearing (R3).
- The §30 governance evaluation order is confluent: policy sets, not
  policy lists.

---

## 7. What was deliberately not verified

- **Belief/projection policies, confidence formulas, forgetting curves,
  ranking** — the spec deliberately does not prescribe them (Architecture
  §2 Non-Goals); there is no normative content to verify. Only frame
  properties (e.g. §21.2 projection is read-only) are modeled.
- **Memory-as-behavior** (§4.4) and **learning** (§4.7) — these are
  empirical properties of a Brain + model; the spec itself says the right
  instrument is ablation benchmarking (§21.3-adjacent, Architecture
  §21.3), not proof.
- **Physical purge (§19.3, §29.7)** — excluded from the Alloy scope
  (`Live` is monotone); modeling audited purge is listed as future work.
- **Capsule canonicalization/digests (§37.7)** — deterministic
  serialization is a test-vector problem (the conformance suite's job),
  not a model-checking problem.
- **Cryptographic properties** — signatures are assumed correct;
  §37.8's "integrity ≠ truth" separation is enforced structurally in the
  authority model instead.

## 8. Reproducing

```bash
export ALLOY_JAR=/path/to/org.alloytools.alloy.dist.jar   # Alloy ≥ 6.2
export TLA_JAR=/path/to/tla2tools.jar
v2/formal/run.sh
```

Java 17+ and Python 3.10+ required. The script asserts the *expected*
result of every obligation — including that the bug-injection
configurations do produce counterexamples — so a green run means the
whole argument above still holds.
