# Anda Brain implementation evidence — 2026-09-23

> **Historical record.** It describes the revision it names. The later [memory-brain revision](../KIP-2.0-Memory-Brain-Resolution.md) removed the retained draft packages (a single `cognitive-memory@2.0.0` remains), dissolved the Cognitive Consistency companion into the Specification and the `brain/` companions, and replaced TrialState and DerivationState.

The earlier design review was based on this protocol repository. Reading the actual
Brain changes the implementation assessment: a complete service already exists.
This report separates that evidence from the new KIP contracts.

## Inspected revision and actual run

Repository: [ldclabs/anda-brain](https://github.com/ldclabs/anda-brain/tree/f723f96).
Inspected HEAD: `f723f96` (clean checkout). Its workspace pins `anda_kip = 0.13.1`
and uses `anda_cognitive_nexus 0.13.4`; the Worker uses its own published engine.

Executed locally from that repository:

```sh
RUST_MIN_STACK=16777216 cargo test -p anda_brain --lib --all-features --offline
```

Result: **538 passed, 0 failed, 0 ignored**, test execution 21.32 seconds. This ran
Rust library tests with real in-memory/local Nexus/storage paths and controlled
models/executors. It did not call a live model provider, run the Worker suite, deploy
anything or measure held-out learning. The Brain repository was not modified.

## What the implementation already supplies

| Reviewed concern | Existing implementation | Consequence for this revision |
| --- | --- | --- |
| No runnable Brain | Formation/Recall/Maintenance agents plus native Nexus and APIs | Correct the review: the missing evidence was in KIP, not the implementation's existence |
| Formation ordering | `src/agents/processing.rs`, `src/agents/formation.rs`, shared writer admission | Preserve sequential processing; specify portable source-causality requirements for other bindings |
| Recall limits | `src/agents/recall/budgeted.rs`, `src/recall_budget/`, mandatory constraint tests | Preserve honest bounded packets; a packet is not semantic completeness or permission |
| Learning | `src/learning/plan.rs`, `paired.rs`, `contracts.rs`, native journal/evaluator | Existing pre-registered paired plan runs baseline before trial; prospective controls are an additive contract |
| Dispatch | `src/action/dispatch.rs`, native begin_wake_dispatch and durable permit | Define its native-admission boundary honestly; receiver fencing is a separately advertised stronger capability |
| Learning validation | `learning::contracts::paired_trial_replays_a_real_protected_adoption_transaction` passed | Evidence of the mechanism, not measured improvement by a real model |
| Evaluation integration | experiments feature and documented external MIB workflow | Reuse that workflow; do not recreate the retired evaluator inside Brain |

## Remaining deployment gates

> **Superseded naming.** Package 2.2.0 and the retained 2.1.0 artifacts no longer exist; read "2.2.0" below as the current `cognitive-memory@2.0.0` identified by its digest. Current downstream work is listed in the [memory-brain revision](../KIP-2.0-Memory-Brain-Resolution.md#downstream-work).

The 538 existing tests do **not** certify package 2.2.0, new schema IDs, prospective
trial enrollment, recording repair, selection-dependency tokens or receiver fencing.
An engine/Brain must implement and advertise each corresponding new contract and run
`KIP2-REL-*` scenarios through an actual adapter before claiming that coverage.
Do not import the reference-model functions into an engine adapter.

A new package alone grants no deployed capability. Existing 2.1.0 artifacts and schema
locks remain available unchanged. Cross-engine Capsule exchange and current-validation
mapping need real Rust/Worker adapter runs; REL-016 defines the acceptance scenario.

Real behavioral measurements remain **not_run**. `fixtures/brain-evaluation-not-run.json`
is deliberately unchanged in status/scores. No corpus, model-provider spending or
production executor binding was configured by this protocol change. The release gate
is the existing BrainEvaluation workflow, including costs and relevant-memory ablation.
