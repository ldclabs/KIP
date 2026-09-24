# KIP v2 memory-brain revision — 2026-09-23

This record resolves the design review that asked whether KIP 2.0 is enough for an AI Agent to have a real memory brain. The review found the foundations sound — truth-neutral Propositions, attributed Assertions, read-time belief, Evidence captured without model re-typing, protected Governance — and found the everyday memory weak: world changes needed a three-step supersession ritual, coarse dates had nowhere to go, a Brain could not name a relation no package defined, retrieval could not compose with belief, proactive attention could not reach the Agent, and the draft had grown faster than any engine or measurement could follow.

Scope: English sources, machine artifacts, the language toolkit, the editor grammar, formal models and CI. Chinese mirrors were not synchronized in this revision, except that `KIPSyntax_CN.md` keeps its executable examples in lockstep so the bilingual test stays green; they were synchronized afterwards (8c4d187). No downstream repository was changed; the engine suite was imported read-only from anda-db.

## Owner decisions

| Decision | Applied |
| --- | --- |
| Draft packages are not retained | `cognitive-memory@2.0.0` is the one package; the 2.1.0 and 2.2.0 draft files and the six `legacy-2.1` schemas are deleted and 2.0.0 is rewritten in place, so the same reference now names different content and only its digest tells the revisions apart; schema IDs are `urn:kip:2.0:schema:*`; a draft revision is identified by content digest (Specification Status, AGENTS.md) |
| Freeze the 2.0 scope | A new contract enters only with engine evidence — an engine-suite case a real engine passes — or a measured Brain result (Specification Status, AGENTS.md "Scope gate") |
| Change the temporal semantics | Temporal succession is Core world-time semantics for every policy (§25.4), with a bounded model and five bug-injection modes |
| Runtime and learning companions live in `brain/` | `brain/KIP-2.0-Brain-Runtime.md` and `brain/KIP-2.0-Validated-Learning.md` are normative companions |

## Checklist disposition

| # | Item | Resolution | Evidence |
| --- | --- | --- | --- |
| 1 | World change recorded as "the claim was wrong" | `until: null` means "no end stated"; a later same-actor value on the same line ends it at its start (§25.4). A world change is one Assertion; an ended value is the same actor's opposite stance. Supersession is correction only (§14.2, F.2) | MEM-026a–j, EPI-031, invariant 44, `formal/temporal` T1–T8 |
| 2 | "You misheard" had no Interface route | `revise.change_kind: "misrecorded"` routes to recording repair; without it the Adapter fails `UnsupportedCapability` or quarantines, never maps to a correction (Memory Interface §4) | MIF-017, `routeRevision` model test, invariant 49 |
| 3 | Coarse time had nowhere to go | `valid_time` endpoints may be time bounds `{earliest, latest}`; projection is three-valued and indeterminate support is `uncertain` (§25.5); `TimeBound`/`TimePoint` in `kip-common`; `parseTimePoint` in the toolkit | MEM-027a, EPI-032, invariant 45 |
| 4 | A preference change left both accepted | `functional_by: "object_type"` (§20.15); `prefers` is functional within each option kind, so a newer preference succeeds the older one | MEM-028a, SCHEMA-021, P47, MIF-016 |
| 5 | The structural baseline resolved nothing, and weighted policies differ per engine | `kip:memory-default` (§21.13, `profiles/policy-memory-default.json`): context specificity, then first-person testimony, never over an observation; outranked values are `uncertain` | MEM-029a–d, EPI-033, invariant 46, `formal/temporal` P1–P2 |
| 6 | A Brain could not grow its vocabulary | The Space draft vocabulary: `DEFINE PREDICATE` / `DEFINE CONCEPT TYPE` under `propose_schema`, add-only, standalone, no closed-world or `complete` (§20.16); `review_schema` SleepTask; minimal `kip://domains/general@1.0.0` package | SCHEMA-022, GOV-031, invariant 47; parser, lowering, formatter and EBNF tests |
| 7 | Proactive attention could not reach the Agent | `recall` mode `attention` with a host-kept cursor returns fired Watches and due Commitments; `resume` includes them; an item grants nothing (Memory Interface §4) | MIF-019, `attentionAfter` model test, P49 |
| 8 | Retrieval could not compose with belief; `SEARCH COGNITION` was undefined | The KQL Search Pattern `?x SEARCH <KIND> … LIMIT <k>` (§43.8), never inside `NOT` or a mutation selection; `COGNITION` removed | KQL-032, KQL-033, META-028, invariant 48 |
| 9 | Reinforcement needed a write per read | The exposure log (§66.8): non-cognitive, append-only, governed; Maintenance folds it into explicit, guarded writes | RT-035, invariant 49 |
| 10 | Two staleness vocabularies | DerivationState removed; currentness is the computed `_system.dependency_validity` (§57.6); review is queued as `review_derived` SleepTasks | EPI-028 revised, P23 |
| 11 | Writable caches of immutable records | TrialState removed (the Skill's `current_trial` pointer replaces it); GradingState is a computed, read-only view of `current_evaluation` (§18.2 computed members) | MEM-020, REL-017, contracts test |
| 12 | Three lineage representations | Activity provenance is the one authority; `derived_from`, `compiled_from`, `compiled_by`, `consolidated_to` are computed read-only fields (Profile §7) | contracts test, LIST DEPENDENTS text (§63.5) |
| 13 | Sweep decay and an invented `0.5` default | Decay is computed from base, anchor and pinned policy (`effective_strength`); a missing strength is unknown; the `COALESCE(…, 0.5)` examples are gone (§59.1, Profile §6.1, §18) | REL-011 now mandatory, P48 |
| 14 | Execution runtime inside the memory protocol | Durable attention, leases, dispatch and receiver fencing moved to `brain/KIP-2.0-Brain-Runtime.md` | MEM-009, REL-007 |
| 15 | Clinical-grade learning inside the Profile | Trials, attempts, evaluations, prospective enrollment and comparable learning moved to `brain/KIP-2.0-Validated-Learning.md`; the Profile keeps the lifecycle table, the standing view and six rules | MEM-002–005, MEM-018, REL-006, REL-012 |
| 16 | Core semantics in a companion | Cognitive Consistency §1–§4 folded into the Specification (§11.5–§11.6, §21.11–§21.13, §25.2–§25.5, §48.6, §57.6–§57.8, §60.7); §8 into the Profile, the Memory Interface and the Capsule companion (§41.7); the old file is a redirect that keeps its anchors | link and anchor check |
| 17 | Three conformance taxonomies | Two levels, KIP-Core and KIP-CognitiveMemory (§89); the areas are for diagnosis only; the capability registry lists only what may be left out (§67.4); Memory Interface levels name the Nexus level they run on; `memory_basic` needs no trial, grading or durable worker | `memory-bundles.json`, MIF-001 |
| 18 | Thirty permissions for one Agent | The single-agent preset: agent, maintenance, instrument and owner Principals with their Grants (§30.5) | GOV-031 |
| 19 | The parent suite was not executable | The two-engine shared suite — 21 fixtures, 362 cases — now lives in `conformance/engine-suite/` with a runner (`--suite engine`), provenance manifest and self-tests; 37 of the 341 parent vectors have engine cases. The remaining parent vectors are still prose and are reported as not executed | `engine-suite.test.mjs` |
| 20 | Lowercase requirements of uncertain force | §0 adopts BCP 14 (RFC 8174): only capitalized keywords are requirements; the Memory Interface and both new companions state their requirements in capitals | review of rewritten text |
| 21 | No positive memory-quality acceptance | MIF-013–020: recallable fact, correction, world change over time, preference within a kind, misrecording, unasked constraint, attention, unknown is not no | 20 interface vectors, schema-valid |
| 22 | Too many version axes | One protocol version (`2.0-draft`), one package (`2.0.0`), stable schema IDs, no dated contract revision (`requires_contract` and `contract_revision` removed) | digest check |

## Defect found by the new model

The temporal model's order-independence check (T2) found that when two successors share the smallest start key, the earlier draft of §25.4 let arrival order decide which one ended the predecessor. The rule now combines tied successors bound by bound, in the Specification, the JavaScript oracle and the Python model; the arrival-order bug mode reproduces the defect.

## Validation

| Check | Result |
| --- | --- |
| Toolkit, contracts, Memory Interface, reliability, engine-suite and syntax tests (`KIP_DOC_LANG=en`) | 261 passed, 0 failed |
| Same suite with both language cards (CI configuration) | 263 passed, 0 failed |
| Artifact digests | 7 verified (memory package with its complete schema lock, general domain package with its dependency pin, memory-default policy, two test packages, the test policy, the golden Capsule) |
| EBNF grammars | KQL, KML and META well-formed, all rules reachable, no unintended cross-grammar drift |
| VS Code extension | lint, 12 tests and build pass |
| Formal suites (`formal/run.sh` with Alloy 6, TLC and JRE 17) | exit 0, all nine suites ran and passed |
| Engine suite against a real engine | not run here: the engines implement the previous draft; run `--suite engine` from anda-db |
| Behavioral learning | not run; `brain/BrainEvaluation.md` remains the gate |

Formal detail: Alloy C1–C7 UNSAT and witnesses R1–R4 SAT; TLC transaction spec passes and both bug configurations produce their counterexamples; governance, grammar, lifecycle (spec, variant and nine bug modes), Watch (spec, two variants, two bug modes) and purge (spec and three bug modes) pass; the new world-time model checks 336 assertions, 112,896 pairs exhaustively and 40,000 seeded triples with T1–T8 and P1–P2 holding, and each of its five bug modes finds its counterexample; the Node contract subset passes 94 tests. These are bounded models, not engine results.

## Second pass — the edges of the new semantics

A second review of the revision above, with the same question, found four defects in how the new world-time rules meet ordinary memory work, a set of consistency gaps the first pass left, and more to remove. All are resolved in this same revision.

| # | Finding | Resolution | Evidence |
| --- | --- | --- | --- |
| 1 | Two same-actor inferences were read as a world change: succession keyed on actor and context only, so a Brain's later inference from document B silently ended its earlier inference from document A | Succession is an actor's own account: an Assertion takes part when its mode is `stated` or `observed` or it writes a `from`; an `inferred` Assertion with no written start is on no line (§25.4). The disagreement stays a conflict for the policy | MEM-026k–m, temporal T9 with the `--infer-succeeds` bug mode, `world-time.json` |
| 2 | A late-recorded old claim took today's start key: `at` defaulted to the transaction time and a missing `from` fell back to it | `asserted_at` is when the actor made the claim — the source's observed time — never the recording time (§13.2, §55.1); the Adapter sets it from the source (Memory Interface §5.1); the toolkit's `KIP_2103` diagnostic flags an `ASSERT` that cites evidence without `at` (first shipped as `KIP_2102`, a code already taken by the unbound-handle error; see Follow-up) | MEM-029g, MIF-015 (`late_history_displaces=false`), temporal T6 across actors, kip-lang test |
| 3 | A claim with no `from` was "unbounded below": "I live in Shanghai" said in 2026 answered Shanghai for 2020 | A missing `from` is the bound `{latest: asserted_at}` — the value began no later than the claim (§25.2, §25.5); the present-tense examples need no `valid` at all | MEM-026n, temporal T8 extended, `world-time.json` |
| 4 | A stale observation and a fresh statement were `contested` forever: `kip:memory-default` had no rule after first-person testimony | Rule 3, recency: the candidate whose eligible support has the greatest start key prevails; ties stay `contested`; rules 1 and 2 come first, so newer hearsay never beats the subject's own statement (§21.13, `policy-memory-default.json`) | MEM-026l, MEM-029e–g, temporal P3 with the `--recency-first` bug mode, `world-time.json` |
| 5 | `prefers` partitioned by option type, but the only general types were `Place`, `Organization` and `Topic`, so every everyday preference would share one partition | An option is a Concept typed by its kind, from a domain package or `DEFINE CONCEPT TYPE`, never a catch-all (§20.15, Profile §5.5, §7, Formation cards); the engine fixtures' options are typed through an inline `Option` package and recorded as such | MIF-016 wording, `world-time.json` (`ColorScheme`, `Editor`) |
| 6 | "You misheard me" needed `repair_recording` or `quarantine`, and the single-agent preset gave the Agent neither | The agent Principal holds `repair_recording` where `recording_repair` is advertised, limited by §57.8 to its own source-backed outputs (§30.5); recording repair is required by KIP-CognitiveMemory (§89, §67.4) | MIF-017 |
| 7 | `AttentionItem` had `commitment_due` and `task_ready` kinds with no producer, and a `raised_seq` that a passing due time could not supply | Every attention item is raised by a commit — `watch_fire` or a `commitment_review` Activity — whose `space_seq` is `raised_seq`; kinds are `watch_fired` and `commitment_due`; `task_ready` is removed (Memory Interface §4, Profile §5.7, §17, `kip-memory.schema.json`) | MIF-019, `attentionAfter` model test |
| 8 | §96–§99 still carried "full/advanced profile adds" lists that contradicted the two-level model of §89 (`FOR TIME`, BELIEF SLOT, LIST DEPENDENTS, PURGE PAYLOAD were both required and optional) | One requirement list per area; capability items named only as capabilities; §92 names succession, time bounds, context matching and `kip:memory-default` | review of §90–§99 |
| 9 | `memory_basic` claimed to run on KIP-Core while attention recall and `prefers` are Profile symbols | `memory_basic` runs on KIP-Core with `cognitive-memory@2.0.0` activated, without the KIP-CognitiveMemory engine features (Memory Interface §2, `memory-bundles.json`) | MIF-001 |
| 10 | Promotion of a draft symbol was declared "by an installed package", which cannot name one Space's draft symbols | Promotion is a Schema Environment migration record under `manage_schema` (§20.16) | SCHEMA-022 wording |
| 11 | `functional_by` on a Literal-valued Predicate had no partition | The object must be declared as Concepts; the package schema rejects `functional_by` with `literal_types` (§20.15) | SCHEMA-021, contracts test |
| 12 | The scope gate blocked correcting a new contract until an engine had implemented the uncorrected version | A fixture may enter marked `pending_engine` and listed in the manifest; the release requires every fixture verified (Status, AGENTS.md, engine-suite README) | `world-time.json`, runner `pending_engine` disclosure |
| 13 | The draft package minted a version per `DEFINE` | One fixed reference, `kip://local/draft@0.0.0`; `schema_environment_version` still advances (§20.16) | SCHEMA-022 |
| 14 | Coverage required seven channels of every basic Brain, three of which it could not have | An unadvertised level no longer obliges a basic Brain to serve its channels; a channel is `not_applicable` only after an authoritative scoped absence determination, and retained content that cannot be served makes it `incomplete` (Memory Interface §6, as corrected by 0644ebc) | MIF-001 |
| 15 | `Preference` was a type beside the `prefers` claim, with a mutable summary that Recall could mistake for the answer | The type is removed: a preference is a claim, a stable pattern is an Insight `about` the kind (Profile §5.5, §15; package, Spec §6.1, §18.3, cards) | contracts test, engine fixtures revised on import |
| 16 | `memory_durable` and `memory_exchange` duplicated capabilities as levels | Three levels remain; durable workers and Capsule exchange are the capabilities they always were (Memory Interface §2, `memory-bundles.json`, `kip-memory.schema.json`) | MIF-001 |
| 17 | The temporal model covered one context, one partition and witnessed claims only | Extended universe (inferences, `until` bounds, context sets) for the sampled triples; T9, P3 and two bug modes; the missing-start default in `written()` | `formal/temporal` |
| 18 | Stale text: Profile §4 said `2.2.0`; MEM-005 named `TrialState`; §66.8 called the exposure log the only use channel while §59.1 named two; the policy artifact listed `expired` as a stored status; §25.4 restated §13.3 | Fixed | — |

The imported engine suite was revised in two more places, recorded in its manifest: option Concepts are typed `Option` through an inline package (the Profile has no Preference type), and the boundary case that expected an expired value to be `rejected` now expects `insufficient` (§14.3, §21.5). `world-time.json` is the first `pending_engine` fixture: 24 cases for this revision's behavior (26 after the follow-up alignment in 0644ebc), written from the Specification and the oracle, verified by no engine yet.

## Downstream work

1. **anda-db (Rust and kip-do)**: load `cognitive-memory@2.0.0` as revised (TrialState, DerivationState and Preference removed, GradingState and lineage fields computed, `current_trial`/`current_evaluation`, `prefers` with `functional_by`, `review_schema`); implement temporal succession with its participation rule, the missing-`from` default, time bounds, `functional_by`, `kip:memory-default` with recency, `DEFINE` and the fixed draft reference, the Search Pattern, computed strength and the optional exposure log; drop `SEARCH COGNITION`; run `node conformance/run.mjs --suite engine` from this repository, including the pending `world-time.json`, instead of a private copy of the fixtures. Refresh the copies `anda_kip` vendors — Specification, syntax card, grammars, all schemas including `kip-common`, profiles, policy, bundles and the brain cards — because anda-brain consumes those copies, not this repository.
2. **anda-brain**: `revise.change_kind: "misrecorded"`, attention recall with a cursor and commit-raised items, world changes as one Assertion with `asserted_at` from the source, options typed by kind, and decay without sweeps.
3. **Chinese mirrors**: done in 8c4d187, with the Specification's remaining pre-TRANSITION syntax fixed in the follow-up below.
4. **Evidence**: an engine pass of `world-time.json`, then a measured LongMemEval/LoCoMo-style run through the Memory Interface, per the scope gate.

## Follow-up — 2026-09-24

A synchronization audit of the packages and the downstream repositories found these defects in this repository; all are corrected here. Downstream implementations still track the draft before `ae924e9`.

| # | Finding | Correction |
| --- | --- | --- |
| 1 | The late-claim hint reused `KIP_2102`, already the error for an unbound `MUTATE` handle, and `valid: {until}` alone suppressed it | The hint is `KIP_2103`; only a written `from` (or a `valid` parameter) suppresses it |
| 2 | `MemorySession` could not express attention recall and did not keep the host's attention cursor that Memory Interface §4 assigns to the host | `recall` takes the full recall input; `acknowledgeAttention` keeps the cursor across restarts and supplies it to attention and resume recalls |
| 3 | The toolkit's immutable-Assertion refusals pointed every change at `SUPERSEDING` | They say a changed world is a new Assertion, and `SUPERSEDING` is only for an Assertion that was wrong (§14.2, §25.4) |
| 4 | `context_refs` was immutable by §13.3 but missing from the §13.7 list and the toolkit's check | Listed in §13.7; `UPDATE` cannot rewrite it |
| 5 | The §20.16 and syntax-card `DEFINE` examples defined `Place` and `lives_in`, which `kip://domains/general@1.0.0` already defines | The examples define `Instrument` and `main_instrument` |
| 6 | The `world-time.json` `DEFINE` cases named no capability, so an engine without `draft_vocabulary` failed the case that reads the draft symbol | The four cases require `draft_vocabulary` through the request envelope and are skipped without it |
| 7 | `kip-change-envelope.schema.json` kept an `https://` `$id` | `urn:kip:2.0:schema:change-envelope`; the memory package's schema lock and digests are regenerated |
| 8 | A wrapped §67.4 line put `profiles/memory-bundles.json` where a registry parser reads a capability name | One line per entry |
| 9 | `SPECIFICATION_CN.md` still showed `SUPERSEDE ASSERTION`, `RETRACT ASSERTION`, `CORRECT EVIDENCE`, `ARCHIVE`/`TOMBSTONE` statements, `AS OF TX/TIME` and old grammar sketches | Aligned with the English source |
| 10 | Timestamps, time bounds, ASSERT `context` and draft declarations were accepted by the toolkit whatever their literal shape | Checked statically (`KIP_2001`), parameters excepted |
