# KIP 2.0 Formal Verification Report

**[English](./REPORT.md) | [中文](./REPORT_CN.md)**

**Date**: 2026-08-15; addendum 2026-09-02 (suites 5–7); last full run of all seven suites 2026-09-02 (§12)
**Target**: `v2/KIP-2.0-SPECIFICATION.md` (2.0-draft), `v2/profiles/CognitiveMemoryProfile-2.0.md`, and `v2/grammar/*.ebnf`
**Artifacts**: [`alloy/kip-core.als`](./alloy/kip-core.als), [`tla/KipTransactions.tla`](./tla/KipTransactions.tla), [`governance/check_governance.py`](./governance/check_governance.py), [`grammar/check_ebnf.py`](./grammar/check_ebnf.py), [`lifecycle/check_lifecycle.py`](./lifecycle/check_lifecycle.py), [`watch/check_watch.py`](./watch/check_watch.py), [`purge/check_purge.py`](./purge/check_purge.py), [`run.sh`](./run.sh)

---

## 1. What "formal verification" means here — and what it cannot mean

KIP 2.0 splits cleanly into layers with very different verifiability:

| Layer                               | Verifiable?                    | Method used                                 |
| ----------------------------------- | ------------------------------ | ------------------------------------------- |
| Grammar (KQL/KML/META EBNF)         | Yes, mechanically              | static consistency analysis (this suite)    |
| Core data model invariants (§5–§23) | Yes, bounded                   | Alloy 6 temporal model checking             |
| Transaction runtime (§32–§36)       | Yes, bounded                   | TLA+ / TLC explicit-state model checking    |
| Governance evaluation (§29–§31)     | Yes, bounded-exhaustive        | exhaustive decision-procedure checking      |
| Consequence channel / Skill lifecycle (§15.7, §29.8, §41.6; Profile §6, §14, §21) | Yes, bounded-exhaustive | explicit-state Python model checking (suite 5) |
| Watch firing under concurrency (Profile §5.11) | Yes, bounded | explicit-state Python model checking (suite 6) |
| Erasure: purge, legal hold, payload purge (§19.1, §60) | Yes, bounded-exhaustive | explicit-state Python model checking (suite 7) |
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
different successful outcomes. **This is FINDING F2** — see §9.

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

## 6. Suite 5 — Consequence channel and Skill lifecycle (added 2026-09-02)

`lifecycle/check_lifecycle.py` is an explicit-state model checker in the
style of suite 3: a breadth-first search over every interleaving of recording
a decision (an `action_gate` whose inputs name the Skills applied), observing
outcomes (instrument-written, acting-Principal-written, or imported), opening
trials, and running the deterministic verdict rule, for two Skills that
share one task family plus a third Skill that arrives by import already
`adopted` at its source. Every reachable state and transition is checked.

| Property | Meaning | Spec / Profile |
| --- | --- | --- |
| I1 AttributionOnly | a verdict's inputs, hence a Skill's `GradingState`, contain only outcomes linked to a decision that applied it, with instrument origin; observing an outcome changes no tally by itself | Spec §15.7, Inv. 37; Profile §6.2, §14 rule 7 |
| I2 BasisBeforeCount | a verdict on a trialed/adopted Skill finds a `TrialState` whose basis precedes every graded outcome | Profile §6.5, §14 rule 2 |
| I3 VerdictOnly | the lifecycle status changes only in a step that appends a `lifecycle_verdict` | Profile §9, §14 rule 1 |
| I4 Recomputable | re-running the rule on the recorded basis and inputs reproduces every recorded transition | Profile §14 rule 2 |
| I5 RevocationNotHarder | demotion bar ≤ promotion bar; `adopted → revoked` reachable with fewer graded outcomes than adoption needed | Profile §14 rule 3 |
| I6 ImportResets | an imported Skill starts `proposed` with no grading and no trial; an imported outcome is in no verdict's inputs | Profile §21; Spec §41.6 |
| I7 SelfGradingVisible | under the `record_outcome` gate no acting-Principal outcome exists; without the gate every verdict that consumed one is flagged from origin alone | Spec §29.8, Inv. 36 |

Results (`run.sh` section 5): spec mode **368,247 states, all properties
hold, all three witnesses reachable** (adoption; adoption then revocation on
one linked failure; S1 adopted while its family-mate S2 stays ungraded).
The self-graded-deployment variant (`--self-graded`, 2.1M states) holds.
Four bug injections each produce their counterexample: `--family-join` (the
pre-2026-09-02 design: the family is the attribution) violates I1 with S2
graded by S1's outcome; `--skip-trialstate` violates I2; `--count-imported`
violates I1 and I6; `--no-gate` (acting-Principal outcomes accepted and not
flagged) violates I7.

---

## 7. Suite 6 — Watch firing under concurrency (added 2026-09-02)

`watch/check_watch.py` models two maintenance workers consuming one Change
Stream at their own pace, with at-least-once redelivery, both trying to fire
the same Watch through the transition Profile §5.11 prescribes: a
`watch_fire` Activity keyed `watch_fire:<watch>:<seq>` (or
`…:silence:<due_at>`) plus a guarded `UPDATE … EXPECT VERSION` of the status,
in one transaction. Four scenarios (delta with one and two matches, silence
with and without a match before `due_at`) are explored exhaustively.

| Property | Meaning |
| --- | --- |
| W1 OncePerKey | at most one `watch_fire` Activity and one SleepTask per firing key |
| W2 FiredIsOnce | a `fired` Watch has exactly one firing |
| W3 MatchOnly | a delta Watch fires only on an envelope its condition matches |
| W4 VersionOnce | the Watch's version advanced exactly once (§35.5) |
| W5 SilenceSound | a silence Watch fires only after the evaluator consumed the stream through the due point and saw no match |
| W6 Reachable | firing is reachable where it should be |

Results (`run.sh` section 6): spec mode holds. **Either guard alone
suffices** when the firing is one transaction — `--no-client-key` (EXPECT
VERSION only) and `--no-guard` (client_key only) both hold — and the double
fire needs both absent (`--no-guard --no-client-key`: two Activities and two
SleepTasks for `watch_fire:W:2`, violating W1/W2). `--premature-silence`
(fire on the clock without having consumed the stream through the due point)
violates W5: the silence Watch fires although a matching change committed
before `due_at`. **This is FINDING F5.**

---

## 8. Suite 7 — Purge, legal hold, payload purge (added 2026-09-02)

`purge/check_purge.py` enumerates, over a five-element universe (two
Evidence, an Assertion citing one of them, an Activity with provenance
references to all three, a Concept with an optional structural reference),
every legal-hold assignment (32) and every purge sequence of length ≤ 3 over
element purge under the three reference policies and payload purge —
26,248 operations — checking after each:

| Property | Meaning | Spec |
| --- | --- | --- |
| P1 HeldNeverErased | a held element is never stubbed, erased, or payload-purged, including as a cascade dependent | §19.1, §60.3 |
| P2 DenyRespectsRefs | `deny_if_referenced` never erases an element a required reference points to | §60.3 |
| P3 NoDanglingRequired | a required reference from a live or tombstoned element resolves to live, tombstoned, or stub — never nothing | §60.3 stub |
| P4 CascadeStopsAtHold | an authorized cascade erases unheld dependents and never a held one | §60.3 |
| P5 PayloadPurgeKeeps | after `PURGE PAYLOAD` the record is live, citations and provenance survive, and a repeat is `no_effect` | §60.6, Inv. 34 |
| P6 NoResurrection | a stub never becomes live; a purged payload never returns | §60.3, §60.6 |

Results (`run.sh` section 7): spec mode holds with all witnesses (a cascade
erasing an unheld dependent, a hold stopping a cascade, a payload purge).
`--hold-after-policy` violates P1 (a held element erased under
`authorized_cascade`), `--no-stub` violates P3 (the Assertion's citation
dangles the moment its Evidence is purged under `tombstone_reference`), and
`--payload-drops-citations` violates P5.

---

## 9. Findings

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

### F5 — A silence Watch must consume the stream through its due point (Profile gap, applied 2026-09-02)

Profile §5.11 said a silence Watch "fires when `due_at` passes without a
match", which an evaluator can read as a clock check. Suite 6 shows the
race: a matching change commits before `due_at`, the evaluator sees the
clock pass before it has fetched that envelope, and fires the silence Watch
on a silence that never happened (`--premature-silence`, scenario
`envelopes=(True, False), due=2`). **Applied**: §5.11 now requires the
evaluator to have consumed the Change Stream through the `space_seq` current
at `due_at` before concluding silence; BrainMaintenance §17 says the same.

### F6 — The family-level join was the wrong attribution (design defect, applied 2026-09-02)

Suite 5's `--family-join` mode reproduces the consequence channel as
drafted on 2026-08-31, where the task family was the join between outcomes
and Skills: with two Skills in one family, an outcome produced by a decision
that applied S1 grades S2 as well, and an outcome linked to no decision
grades both. The redesign — attribution only through the
`outcome_observation → action_gate` link, `TrialState` written at trial
opening, the family reduced to the baseline stream — holds under every
interleaving in scope (I1–I7). The model is the mechanical form of review
finding P0-2.

### F7 — The hold is evaluated before the policy, and the stub is load-bearing (confirmation)

Suite 7 confirms two sentences of §60.3 that read like drafting choices:
evaluating `legal_hold` after the reference policy lets an
`authorized_cascade` erase a held element (`--hold-after-policy`), and an
element purge that leaves no digest stub dangles every required reference to
it (`--no-stub`) — the Assertion that cited the purged Evidence would point
at nothing. Both are already normative; the suite keeps them so.

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

## 10. What was deliberately not verified

- **Version planes (§35.1, 2026-09-02).** `KipTransactions.tla` keeps one version counter per element, i.e. the bare `EXPECT VERSION`. That a guard `OF ATTRIBUTES` is not spoiled by a Facet sweep, and that two guards on different planes commit together, is stated by TX-027 / TX-028 and not yet model-checked; extending the TLA+ model is one more counter per plane and a guard that names one.

- **Belief/projection policies, confidence formulas, forgetting curves,
  ranking** — the spec deliberately does not prescribe them (Architecture
  §2 Non-Goals); there is no normative content to verify. Only frame
  properties (e.g. §21.2 projection is read-only) are modeled.
- **Memory-as-behavior** (§4.4) and **learning** (§4.7) — these are
  empirical properties of a Brain + model; the spec itself says the right
  instrument is ablation benchmarking (§21.3-adjacent, Architecture
  §21.3), not proof.
- **Physical purge inside the Alloy model (§19.3, §29.7)** — the Alloy scope
  keeps `Live` monotone; erasure is verified separately by suite 7, which
  does not model the Alloy properties' interaction with purge (a purged
  Evidence root still counts for independence through its stub, by §60.3;
  that interaction is asserted, not checked).
- **The verdict rule itself** — suite 5 fixes one deterministic rule
  (`adopt-if-better-v1`) to have something to run; which rule a Brain uses
  is policy, and the properties checked are about attribution, basis, and
  recomputability, not about whether the rule is wise.
- **Capsule canonicalization/digests (§37.7)** — deterministic
  serialization is a test-vector problem (the conformance suite's job),
  not a model-checking problem.
- **Cryptographic properties** — signatures are assumed correct;
  §37.8's "integrity ≠ truth" separation is enforced structurally in the
  authority model instead.

## 11. Reproducing

```bash
export ALLOY_JAR=/path/to/org.alloytools.alloy.dist.jar   # Alloy ≥ 6.2
export TLA_JAR=/path/to/tla2tools.jar
v2/formal/run.sh
```

Java 17+ and Python 3.10+ required. The script asserts the *expected*
result of every obligation — including that the bug-injection
configurations do produce counterexamples — so a green run (exit 0) means
the whole argument above still holds. Without the jars, suites 1–2 are
skipped and the run exits 3 after suites 3–7: the Python suites alone take
about a minute, most of it suite 5's self-graded variant.

---

## 12. Last full run — 2026-09-02

All seven suites, run by `run.sh` on one machine (Java 17.0.20, Alloy 6.2.0, TLC 2.19, Python 3), wall clock 4 min 33 s, exit code 0:

| Suite | Result |
|---|---|
| 1 Alloy Core data model | C1–C7 UNSAT (no counterexample in scope); R1–R4 SAT (witness traces found) |
| 2 TLC transactions | `_spec.cfg` all invariants hold; `_toctou.cfg` and `_noretain.cfg` produce the expected counterexamples |
| 3 Governance evaluation | 10,939,388 decision checks, P1–P6 hold |
| 4 EBNF grammars | G1–G5 PASS (post-`TRANSITION` grammars) |
| 5 Consequence channel / Skill lifecycle | spec and self-graded variant hold I1–I7; the four bug injections each produce their counterexample |
| 6 Watch firing | spec and both single-guard variants hold W1–W6; `--no-guard --no-client-key` double-fires, `--premature-silence` fires without cause |
| 7 Purge / legal hold / payload purge | P1–P6 hold; the three bug injections each produce their counterexample |

The run postdates the 2026-09-02 draft revisions (§14.2 supersession as revision, §35.1 version planes, §52.5 `TRANSITION`, §31.3 `governance.authority_class`). None of those changed what the models check: the Alloy `authority` relation is the field §31.3 now names, the lifecycle moves in suites 1 and 5 are the moves `TRANSITION` spells, and the TLA+ model's single per-element counter is the bare `EXPECT VERSION`. What the models do **not** yet cover is listed in §10: the plane counters of §35.1 are the one new mechanism with no model.
