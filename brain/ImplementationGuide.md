# Implementing the reference Brain with KIP 2.0

This guide is a concrete default policy above the protocol, not an additional Core
kind or a universal cognitive algorithm. The production implementation is
[Anda Brain](https://github.com/ldclabs/anda-brain), not the small models under
`conformance/reference/`. Read the [implementation evidence](../conformance/Brain-Implementation-Evidence.md)
before interpreting a model test as engine or behavioral evidence.

## Default memory path

1. The authenticated host captures an immutable source with identity/digest and
   canonical task/context scope. Apply admission and retention policy before storing
   sensitive bytes. Persist a source-order dependency and intake acknowledgement.
2. Serialize related formation work. Record exact statements and explicit corrections
   first; unrelated streams may proceed independently. Use source order and valid
   time, never worker completion time as a latest-value rule. Anda Brain already has
   a shared Formation/Maintenance admission gate and a sequential conversation queue.
3. Preserve source material within an explicit short-term budget. Extract the smallest
   useful claim set, retaining digest-bound source locators and extractor versions.
   An unresolved actor/Schema stays evidence-only. Low-value input can be skipped with
   an explicit disposition. No guessed numeric scores are required.
4. A plain fact normally needs Evidence, Proposition and Assertion. Add an Event only
   when its episodic grouping helps; add Experience/Steps only when the trajectory
   teaches something. Preference, Insight and SelfModel are optional derived views,
   not mandatory copies of each message. Preserve required transformation lineage.
5. Recall resolves identity/scope, enumerates critical constraints and Commitments,
   checks BELIEF/prerequisites, then retrieves bounded experiences and semantic material.
   Each channel has a recorded plan. Approximate candidate discovery is not semantic
   completeness. The host preserves mandatory warnings before model selection.
6. If extraction omitted potentially decisive information and source bytes survive,
   return the source or queue explicit re-encoding. Read-only recall does not secretly
   mutate cognition. Unknown/stale external facts may create a verification request
   through the action gate; freshness is predicate/context policy, not confidence decay.
7. Repair encoding mistakes through recording_repair. Use actor supersession for an
   actual change of statement and complementary valid intervals for a world change.
   These routes have different origins, permissions and historical explanations.
8. Resume a task from its scoped WorkingState plus all delta pages and current basis
   checks. The SDK carries outstanding processing receipts automatically, including
   earlier unfinished inputs when later ones finish first.

Formation, Recall and Maintenance may use one model, multiple models or deterministic
host code. A protocol revision does not require a new LLM process. The existing Anda
Brain service has real provider calls and native Nexus seams; reusable evaluation
belongs in its external MIB workflow. Do not build a second comprehensive evaluator
inside Brain merely to claim this checklist complete.

## Cheap maintenance and one authoritative record

Persist explicit reinforcement and policy changes. For optional lazy mnemonic decay,
`MnemonicState.memory_strength` is the last explicitly written base,
`last_metabolized_at` its time anchor and `strength_policy` a pinned policy artifact
(e.g. a declared half-life). A missing base/anchor/policy stays unknown; never invent
0.5. Compute effective strength as a read-only ranking value. No read writes back a
new base, advances a version, increments a use count or changes confidence. A
periodic compaction may explicitly refresh the anchor if equivalence is preserved.
Unsupported policies fail explicitly. Numeric results obey the portable number domain.

Compare lazy and sweep modes against the same policy and corpus before claiming
savings. Measure idle writes, emitted envelopes, cache invalidations, backlog and
p50/p95 recall cost. Lazy mode avoids routine per-element decay writes, not required
retention, correction or lease work. It is advertised as `lazy_mnemonic_strength`.

Retain revision/trial/evaluation pointers and immutable records. Compute GradingState
counts from the selected validated evaluation; validate them if an engine stores a
cache. Treat DerivationState as review progress; currentness comes from dependency
validation. Do not create another competing set of mutable truth flags.

Activity/DependencyBasis are the dependency authority. Generate or check redundant
lineage edges in the same mutation, keeping semantic prerequisites separate from
context/disclosure. Compatibility views may preserve existing Facet/Structural names.
Tests discard materializations and rebuild them; authoritative history stays unchanged.

## Host ergonomics

The five Memory Interface intents remain the business Agent surface. Use the exported
`MemorySession` helper for scoped outstanding-receipt bookkeeping and checkpoint its
snapshot with the host session. Record every acknowledged receipt; only a trusted
recall response that actually accounts for a receipt may clear it. Overflow requires
bounded draining or host storage, never dropping an older pending receipt. Source
capture, stable idempotency generation and handle authorization belong to the host.
The helper does not validate wire responses or confer receipt access.

Scoped `ASSERT {context: :contexts}` expands to the existing context_refs field.
Explicit CREATE ASSERTION remains available for older parsers and fine-grained
Evidence roles. `context` is not an Evidence citation role or an ownership grant.

Timestamp parsing is shared through `parseTimestamp`; hosts map non-string failures
to TypeMismatch and format/calendar failures to ConstraintViolation. Protocol inputs
are not repaired silently. External dates may be explicitly converted at ingestion,
with the original source and its precision/anchor retained.

## Evaluation order

Run actual engine/host reliability tests first. Then run a held-out behavioral
experiment through the existing [BrainEvaluation](BrainEvaluation.md) contract and
MIB integration, with pinned model/tools, training-only memories and total costs.
Separate extraction recall, candidate recall, answer correctness, outdated answers,
constraint misses, abstention, repair success and repeated avoidable mistakes.
Measure raw-retained versus compressed memory and relevant-memory ablation.

A ProcedureAssessment can establish applicability under a criterion without a new
Skill status. Only a comparative authorized evaluation earns adopted standing.
Mechanism passes, deterministic fake-model tests and accurate source retrieval alone
are never reported as real-model learning gains. An unavailable provider/dataset or
unsupported MIB condition remains an explicit unexecuted gate.
