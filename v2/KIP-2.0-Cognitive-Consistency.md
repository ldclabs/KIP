# KIP 2.0 Cognitive Consistency and Reliable Learning

**Normative companion to KIP-2.0-SPECIFICATION.md, 2.0-draft.**

This companion defines the cross-cutting contracts referenced by Core §9, §11,
§21, §27, §57, §62 and the Cognitive Memory Profile. It introduces no new Core
kind. Profile records remain Concepts, Activities and Facets. Core rules in
§1–§4 apply wherever their parent feature is supported; §5–§8 bind the standard
Cognitive Memory Profile. Durable workers and identity repair are capabilities,
never implied execution authority. Brain ranking and evaluation algorithms remain
replaceable, subject to the recorded inputs and acceptance conditions below.

## 1. Conflict-complete belief

Projection has two stages. First compute `candidate_status` from one candidate's
eligible support/opposition. Then evaluate the visible, eligible candidates in
the same subject–predicate slot under the same ProjectionBasis (§2).

A functional/exclusive conflict between materially supported candidates MUST be
reflected in the final `status` of every involved candidate, including a grounded
single-Proposition BELIEF and BELIEF-by-id. Under the structural baseline those
candidates are `contested`, their `slot_status` is `contested`, and they are absent
from `accepted_values`. A policy may resolve a conflict only through its declared
rules and ledger; query shape MUST NOT resolve it. A non-functional multi-value
slot is not contested merely for having several supported values.

`candidate_status` is diagnostic, never an action verdict. `status` is the final
consumer-facing result. `conflict_refs` contains only discoverable references;
`conflict_reasons` names constraints such as `functional_value`. The constraint
is opposition to accepting the candidate, not a conversion of an object `false`
into a stored reject Assertion. Direct stance conflicts remain representable.
A candidate with no eligible support does not become accepted because another
candidate exists. `leading` is recomputed over the final conflict set, with the
policy's tie-break; a structural tie returns `none`. Slot and candidate queries
MUST agree on final acceptance when evaluated at the same basis.

## 2. ProjectionBasis, context and clocks

Every projected result MUST carry `basis`, conforming to
`schemas/kip-projection.schema.json#/$defs/ProjectionBasis`:

- Space and cognitive snapshot sequence;
- Schema Environment version and identity-resolution version;
- Projection Policy id/version and protected trust-state version;
- opaque current authorization-view identity (not a Grant or hidden count);
- canonical sorted context reference set, purpose and risk;
- `valid_at`, and the next known temporal invalidation instant or null.

A cache key MUST include all these computation inputs, except the computed
`next_invalid_at`. Reuse requires current authorization and validation of every
basis dependency. Trust, identity, Schema or authorization changes invalidate
relevant cached results even if no Assertion changed. When the clock reaches a
known boundary the result MUST be recomputed or explicitly served as historical.
Engines MAY use dependency-specific invalidation instead of rejecting every
unrelated Space commit; they MUST prove equivalence to fresh computation.
WorkingState and other compiled views carry the same basis where applicable.

Core context matching is set inclusion: an Assertion's `context_refs` must be a
subset of the requested set. Empty Assertion context is general; a scoped
Assertion is ineligible for an empty request context. Context IDs use the identity
resolution at the basis, never name similarity or an asserted `same_as` claim.
Additional context inheritance requires an explicit versioned policy; conflicting
context dimensions declared by a package MUST fail validation. Unknown context
is not an invented universal scope. Exclusions appear as `context_mismatch` when
permitted. `WITH EPISTEMIC {context_refs: [...]}` supplies the request set.

World intervals are **[from, until)**. Missing/null from is unbounded below;
missing/null until is unbounded above. Finite bounds require from < until.
At t = until the old value is excluded; a value beginning at t is eligible.
Timestamps MUST carry an offset, compare as instants, and normalize to UTC in
result bases. Coarse or uncertain dates SHOULD retain their precision/anchor as
Evidence or Profile state; Formation MUST NOT invent an exact instant. A missing
valid interval follows the declared policy, never retention expiry.

Historical cognition uses historical Schema, identity, trust and Projection
Policy versions by default. Current authorization always controls disclosure.
A request to reinterpret old data under a current policy must explicitly select
that policy and disclose it in the basis; it is not "what was believed then".
Missing historical control state fails `HistoricalSnapshotUnavailable` rather
than substituting today's trust silently.

## 3. Dependency validity without rewriting history

A derived Assertion or Profile artifact MUST have an immutable input contract
on its producing Activity in `DependencyBasis`: its basis sequence and groups of pinned source
references. Each pin includes the id, relevant version/planes, and temporal or
policy dependencies. The engine validates the supplied read pins against retained source versions or same-transaction new inputs under read-your-writes; it
MUST NOT restamp an old read with current versions at commit. Committing an
honestly older derivation is allowed only with that disclosed basis and the computed
needs_review/unverifiable result where appropriate. A group's role is `all_of` (every prerequisite is necessary),
`any_of` (alternative support), or `context` (disclosure only). Group membership
is fixed for that derivation; a changed derivation creates a new record.

The engine exposes the read-only virtual `_system.dependency_validity`:
`current | needs_review | unverifiable`, plus visible reasons, checked basis and
`action_eligible`. It is never a persisted reviewer-written DerivationState.
Any changed necessary pin, loss of all alternative support, corrected/retracted
root, identity repair or expired prerequisite prevents automatic application
until revalidation. An unchanged alternative may keep an any_of group valid;
changed context is disclosed without alone rejecting the derivation. A numeric
version mismatch is a conservative review trigger, not proof the claim is false.

This check applies recursively to derived Assertions as well as Concepts.
Cycles without a usable external basis are unverifiable. An engine MUST NOT
report current when traversal is incomplete, a source is unavailable, or the
recorded dependency contract is missing. Governance may authorize internal
validation without revealing sources; otherwise the result is unverifiable,
with no hidden-source identities or counts. Absence of a DependencyBasis on an
ungraded legacy derived artifact therefore never implies currentness.

All ordinary Profile Recall and belief projection of inferred derivations MUST
perform this check at their read basis, before Maintenance runs. A supported but
unverified derivation becomes `uncertain` (or remains contested/rejected if that
is already warranted); it is not silently accepted. Raw history stays readable.
Action briefings surface the result and cannot recommend automatic application
when `action_eligible` is false. Revalidation creates a terminal `dependency_validation` Activity with a new
DependencyBasis and the validated element in outputs. Its engine-captured output
version binds it to that exact artifact version. A validation cannot substitute
new epistemic premises for an old Assertion; that requires a new Assertion. Mutable
WorkingState refreshes produce a new version with their own producing Activity.

`LIST DEPENDENTS` review traverses all pages and depths required by the task,
records its processed watermark, and never marks a truncated scan complete.
Required dependency links are also traversed by the engine independently of
optional extra lineage fields. An action gate pins the checked dependencies;
the external executor revalidates them and Governance immediately before acting.
A detected change defers or re-plans; it never authorizes execution itself.

## 4. Repairable identity and portable keys

MERGE remains non-destructive, but every merge is a protected, immutable
identity-resolution decision with id, source, target, actor origin, basis and
resolution version. Engine audit preserves the references actually supplied
and their canonical resolution per write, including ASSERT's endpoints. For a
reference already canonicalized by a caller, the engine records only what it
received; it MUST NOT claim knowledge of a lost earlier referent.

The `identity_repair` capability provides a protected operation under
`merge_identity` with this logical input:

    {decision_id, expected_identity_version, action: "withdraw", reason_evidence}

Its transport is the same implementation-specific protected control binding
used for Governance operations; ordinary KML cannot set merged_into. It atomically
withdraws the named resolution for current reads, verifies acyclicity and identity
constraints, advances the identity version and emits an identity control-change
notification. It retains the prior decision for AS OF/history. The source becomes
resolvable independently again; raw Proposition tuples and old Assertions are
not moved or rewritten. Conflicting keys/canonical IDs fail `IdentityConflict`.

The repair produces a review set of writes made under the affected resolution.
Unambiguous as-supplied references guide new, explicitly corrected Assertions;
writes whose intended referent is lost remain `needs_review`, excluded from
automatic application. Dependents, caches and imported mappings are invalidated.
This is a current interpretation repair, never a claim to perfectly split data
whose attribution was not retained. A capability lacking this behavior MUST reject
the operation rather than delete/recreate the merged source.

A Concept key is Space-local unless its package explicitly declares portable
identity with `issuer_namespace`, `key_scope` and normalization rules. Capsule
mapping by key MUST match all of lineage, verified issuer, scope and normalized
key. Equal local keys in different owners' Spaces otherwise create separate
identities. A repair never grants new trust or authority.

## 5. Revision, attempt, trial and evaluation identities

The Profile's immutable `SkillRevision` Concept owns behavior: task_family,
applicability, preconditions, procedure, success criteria and recovery. `Skill`
is the stable family identity and holds current_revision plus display state.
Legacy behavior fields on Skill are compatibility views of current_revision,
never independently writable. Changing behavior creates a new SkillRevision and
atomically selects it, resets current standing to proposed and clears current
trial/grade pointers. This selection is not a promotion; old revision verdicts
remain intact. Annotation or MnemonicState changes do not reset standing.
Execution authority is bound to revision id + behavior_digest and scope; it
never transfers to edited behavior through a stable Skill ID.

A decision's immutable DecisionRecord distinguishes `retrieved_refs`, `used_refs`
and `applied_revisions`. Every applied revision must also occur in action_gate
inputs. Retrieved-only content receives no automatic credit. Revisions used
jointly form a treatment bundle unless a recorded attribution method separates
them; a shared decision does not prove individual causal utility.

An `action_attempt` Activity with immutable AttemptRecord identifies each actual
attempt **before** dispatch: attempt_id (Space-unique), decision_ref, applied
revision refs, nullable trial_ref, context/environment/tool identities, selection
policy and precondition assessment. Retrospective action records remain valid audit but cannot be retroactively enrolled
as treatment. A trial assignment is fixed before observing
results, not chosen after seeing success. At most one terminal aggregate per
attempt + metric + window contributes to an evaluation.

Instrumented OutcomeRecord includes attempt_ref, metric, window, terminal flag,
observation_key and observer_config_digest in addition to task_family/status.
The instrument's outcome_observation Activity links the attempt and its decision.
Observation keys deduplicate source events; multiple instruments or repeated
measurements of one attempt remain distinct Evidence but not independent trials.
Intermediate, unknown, aborted and missing results are accounted for explicitly.
Conflicting terminal observations require a pinned aggregation/adjudication rule;
they never become two successes. Corrected outcomes are excluded from new grading;
old evaluations retain the exact observations and correction state they used.
Unlinked outcomes are stream material, never automatically the baseline.

A completed `trial_open` Activity carries immutable TrialRecord: revision/bundle,
basis, rule artifact, parameters artifact, comparability policy, exact baseline
attempt/outcome refs, strata/weights, quota in **independent attempts**, observation
window, missingness policy and immutable copies of the comparison inputs needed
to rerun it. TrialState is only a pointer/cache of this record. A re-trial creates
a new Activity/id; late outcomes stay assigned to the old trial and cannot satisfy
the new quota. A decision from before a trial cannot be enrolled retrospectively.

Every lifecycle_verdict carries immutable EvaluationRecord: trial_ref, revision
refs, from_status/to_status, rule/parameters digests, cutoff, selected attempt and
outcome refs, rejected/missing sample accounting, comparison result, and a pinned
replay artifact containing the precise rule, parameters, basis and input values.
Digests are verified against available bytes. A name/hash with no retrievable
rule or inputs cannot claim recomputability. The replay artifact is governed at
least as restrictively as its material inputs and subject to erasure (§8).
Optional historical_reads is not required to reproduce a retained evaluation.

Lifecycle and GradingState may change only in the same transaction as the validated
EvaluationRecord. The engine verifies reference closure, revision/trial matching,
unique attempts, eligible instrument origin, rule bindings and the deterministic
verdict. Merely naming an arbitrary Activity lifecycle_verdict cannot promote a
Skill. State caches pin evaluation_ref and revision_ref; all planes they write
are guarded, including GradingState, TrialState and MnemonicState, not only status.
EvaluationRecord state pairs follow the Profile §14 transition table or keep the
same state. Only trialed → adopted is promotion; revoked/proposed cannot jump
directly to adopted. Re-entry from revoked first opens and selects a new trial.
Imported Skills/revisions have no local standing; imported outcomes do not grade.

## 6. Comparable learning, not just repeatable arithmetic

Validated standing uses an evaluation policy from protected control state under
manage_policy. It fixes allowed rule/parameter contracts, observer-control digests
and minimum evidence/uncertainty requirements. A Brain may propose new policies,
but a rule supplied as ordinary cognitive content cannot authorize its own verdict.
TrialRecord pins the policy identity/version/digest; the current policy is rechecked
at verdict and dispatch, while the retained policy remains available for old replay.
A constant adopt rule or a weakened caller-supplied threshold is not authorized by
merely hashing it.

A trial's authorized rule declares its metric, direction, nonnegative practical improvement margin,
minimum independent sample requirement (at least two treatment attempts for
promotion to adopted), uncertainty test, safety constraints and demotion condition. Quota
counts eligible independent attempts, never Evidence elements. Withdrawal or an
urgent policy demotion may have zero outcomes but still records a deterministic
reason/evidence and a verdict; promotion may not.

Baseline membership is explicit and checked for context, environment/tool version,
precondition satisfaction, intervention/bundle and observation-window comparability. Distinct attempt IDs
alone do not prove statistical independence: the declared sampling_unit and
correlation_policy cluster related attempts or adjust the uncertainty calculation.
Missing attribution does not prove untreated control. Missing, censored or failed
attempts cannot silently disappear from a success denominator. Observer code and
configuration are pinned; separate Principal IDs alone do not prove independent
control. Self-graded or unverified observation processes cannot claim validated
local learning, even when an open deployment permits recording them for audit.

A rule may use pairing, stratification, randomization or declared off-policy
estimation. The protocol prescribes none universally. It MUST refuse a positive
learning verdict when its own comparability, coverage or uncertainty requirements
fail. Policy-dependent admission may remain advisory and unproven. Stratified
comparisons use predeclared shared weights, not each policy's observed task mix;
the 90%→80%, 40%→30%, aggregate 45%→75% example is not improvement. Empty baseline
or missing strata is insufficient, never an invented 0.5 benchmark.

Post-adoption monitoring creates new evaluations, preserves prior ones, and applies
the declared demotion bar. A same-state adopted → adopted evaluation may record
insufficient evidence or no improvement, including zero eligible new attempts, if
the authorized policy permits retaining standing. Its replay artifact retains the
prior validated adoption basis and the monitoring decision; it does not claim a
new positive learning result or bypass a required demotion. The promotion-only
sample minimum and improved comparison do not apply to this cache refresh.
An outcome that is eligible for review is not by itself
proof of causal credit for every memory in the decision's inputs. Utility changes
record the attribution method, evidence and uncertainty; hypotheses of usefulness
stay distinguishable from measured improvement.

## 7. Durable attention, work and external actions

A runtime advertising `durable_brain_runtime` MUST provide durable, bounded workers.
WatchState pins arm_generation, armed_seq, condition_digest, authorization_view,
consumed_seq and match state. Re-arm/condition change atomically advances generation
and resets the coverage interval. Firing keys include generation:
`watch_fire:<id>:<generation>:<seq>` or
`watch_fire:<id>:<generation>:silence:<due_at>`. A stale worker cannot fire a new arm.

Structured selectors combine by AND; arrays in ops/touched match any member, and
an omitted filter imposes no restriction. Text-only conditions require an explicit
Brain evaluator. Silence covers (armed_seq, due_seq] under the pinned condition
and authorized observation scope, after a complete stream watermark through the
deadline. Filtered streams must provide a completeness watermark; sequence gaps
are not proof of silence. Stream truncation or authorization changes require
resynchronization and a new coverage basis, never a silent false alarm. Incoming
matches, deadline resolution, progress and firing survive restart. Time-dependent bases schedule validation work at next_invalid_at without
fabricating expired-Assertion Change Envelopes. A delta Watch still needs a matching
commit and a silence Watch still needs complete authorized coverage.

SleepTask claim/renew/complete uses LeaseState: authenticated owner, monotonically
increasing fencing_token, expires_at and attempt count. Acquisition and takeover
are compare-and-set transactions; a worker whose lease expired or whose token was
replaced cannot complete a task or issue a side effect. Authorized ready workers
can reclaim expired running work. Terminal writes and their outputs are atomic and
retry-safe. Backlog budgets defer work with a checkpoint, never silently drop it.

An attempt plus dispatch intent is durably enqueued before external action. The
executor uses attempt_id as its external idempotency key and rechecks Governance,
revision authority, original revision-selection preconditions, dependency basis and
lease fence just before dispatch. A newer current_revision cannot silently replace
or validate the revision chosen by the recorded decision.
After a crash it queries/retries the **same** external identity, not a fresh one.
If the external system cannot support idempotency or outcome lookup, the state is
outcome_unknown and automatic redispatch is forbidden; reconcile or ask under
policy. KIP never claims exactly-once external effects solely from its own atomicity.
An independent instrument records the returned outcome against that same attempt.

## 8. Encoding, recall coverage and erasure

Formation records what it admitted, deferred or rejected and why, within configured
privacy/retention budgets. Source Evidence may have a short retention window while
semantic records have longer retention. Unresolved Schema/entity material can stay
Evidence-only; it is not forced into a guessed type or discarded as valueless.
CompressionRecord records source refs, extractor/schema versions, preserved fields,
known omissions and re-encoding eligibility. A digest cannot recover omitted bytes.
Payload purge must consider outstanding re-encoding/review needs under retention
policy; it never claims that lossy encoding preserved all future-useful information.

Recall independently queries explicit constraints/Commitments, dependency warnings,
failures/counterexamples, positive experiences, Skills and semantic evidence. The
briefing's RecallCoverage declares which channels completed, their basis, truncation
and unverified preconditions. Required constraints and applicable critical warnings
cannot be dropped merely to make room for a high-scoring Skill. Budget exhaustion
returns incomplete coverage and prevents unsupported automatic action. Instrumented
retrieval telemetry remains separate from read-only KIP cognition; recording exposure
requires explicit mutation and never itself reinforces confidence or utility.
Proposed/trialed Skills without GradingState remain recall candidates labeled
unproven. Any displayed grades bind current_revision and a validated EvaluationRecord;
missing or mismatched evidence cannot confer adopted standing or execution authority.

A user-level forgetting operation uses an ErasurePlan under purge authority. The
plan states the intended scope (payload-only or semantic forgetting), basis and
matched source events; enumerates retained semantic copies, dependent summaries,
replay artifacts, indexes/caches, runtime-held blobs and controlled backup copies;
and records holds, unavailable surfaces and external exports. Derived copies may
need redaction or replacement instead of unrelated whole-record deletion. Every
step preserves enough non-content audit to prove what was done where policy allows.

The executor revalidates authorization, holds and closure against concurrent writes,
checkpoints bounded erasure batches, invalidates materializations and verifies all
in-scope controlled surfaces. `completed` is forbidden while any in-scope controlled
copy, pending backup erasure or unprocessed dependency remains. Outcomes are
completed / partial / blocked with a coverage manifest and receipts. It does not
claim recall of prior external exports. Re-ingestion of erased source events is
prevented within the stated retention policy by non-content source-event tombstones;
a new authorized observation is a separate policy decision. Replay whose inputs were
erased reports unavailable, never fabricates a successful historical recomputation.

## 9. Acceptance and deployment claims

`conformance/KIP-2.0-Cognitive-Tests.md` pins these contracts as portable vectors.
Executable finite models and artifact validation are separate from Nexus adapters.
A model PASS cannot be reported as an engine PASS. An adapter must drive the engine's
real query/mutation/control paths and compare observable results and postconditions.
The machine-readable contract cases include independent expected outcomes; unsupported
capabilities are reported as such, not passed. All Profile invariants have a vector.

`brain/BrainEvaluation.md` defines separate protocol, runtime reliability and
behavioral-learning gates. Brain benchmarks must record model/tool/token budgets,
seeds, costs, memory construction, holdouts and ablation conditions. Learning claims
require positive held-out behavioral impact with uncertainty and negative-transfer
checks; passing these structural contracts is necessary, not empirical learning.
