# KIP 2.0 Cognitive Consistency Conformance

**Normative companion, 2.0-draft.** These vectors bind the features established by
`KIP-2.0-Cognitive-Consistency.md`. MEM-001/007/011/012 extend Core/Epistemic/artifact
requirements; remaining memory vectors bind the standard Profile. MEM-008/009
are OPTIONAL until identity_repair/durable_brain_runtime is advertised, then MUST.
A missing required Profile dependency is a failed claim, not a passing skip.

The 25 vectors below supplement the existing 331. The original vectors remain
binding except where their acceptance text is explicitly revised in the parent
suite. Historical test reports do not attest to this revision.

`vectors/cognitive-contracts.json` contains independent oracle cases and valid
record values; `vectors/memory/*.json` contains portable engine adapter vectors.
The JavaScript oracles and the Python lifecycle model are test models, not engines.
The runner reports partial-suite coverage, never full-profile conformance from this
subset. An adapter's exercise methods MUST run the scenario below through the
actual engine's mutations/reads/control binding, retain raw receipts/responses,
and independently inspect durable postconditions; they cannot simply call an oracle.

## KIP2-MEM-001 — Single-candidate and slot conflict agreement

Given two materially supported values of the same functional slot at one context/time,
query each grounded BELIEF, BELIEF-by-id and the slot. Each involved final status
is contested, candidate_status may be accepted, and accepted_values is empty.
Non-functional independent preferences remain accepted; a direct dispute over one
non-functional value does not make every other value contested. Raw false remains
separate from a reject Assertion. No cognitive state changes.

## KIP2-MEM-002 — Behavior revision cannot inherit standing

Create a Skill/current SkillRevision, open a trial, adopt through a valid evaluation,
then try UPDATE/UPSERT of procedure on the Skill or revision. ImmutableField or
Schema validation fails with no mutation. Create and select a new revision in a
guarded transaction: current standing becomes proposed, current grades/trial clear,
old evaluation remains. Annotation/MnemonicState edits do not reset the revision.
Old revision authority is not usable for the new digest.

## KIP2-MEM-003 — Independent attempts, not observation fan-out

One predeclared attempt produces two distinct successful instrument observations
for the same metric/window. Aggregate them to one sample; quota=2 is not satisfied.
Repeat delivery with the same observation key adds no Evidence event. Two distinct
eligible attempts may satisfy the quota. Conflicting terminal observations remain
unknown until a pinned adjudicator resolves them. Intermediate/imported/self-graded
outcomes do not become eligible independent local success samples.

## KIP2-MEM-004 — Comparable baselines and missingness

Use the 90→80 / 40→30, aggregate 45→75 example in the machine-readable fixture.
An authorized fixed-weight stratified rule returns not_improved, never adopted.
A caller-supplied constant adopt rule or negative improvement margin cannot bypass
the protected evaluation policy, even if its artifact digest is valid. Missing strata,
missing observer assurance, failed comparability or uncertainty criteria produce
insufficient. Unlinked family outcomes are not automatically controls. Account for
all enrolled attempts and declared missingness before computing success rates.

## KIP2-MEM-005 — Re-trial, delayed outcome and retained replay

Retain TrialRecord T1 and EvaluationRecord E1; re-trial the same revision as T2.
A late T1 outcome cannot fill T2 quota. New outcome correction changes only new
aggregates/evaluations. Replaying E1 uses its retained exact rule, parameters,
baseline, samples and cutoff, not the mutable TrialState pointer. Missing or
mismatched replay bytes prevent a recomputability claim. Ordinary current reads
suffice while the replay artifact is retained; no historical_reads dependency.

## KIP2-MEM-006 — Immediate virtual dependency validity

An inferred Assertion, SkillRevision, Insight and WorkingState have pinned necessary
roots in their producing Activities' DependencyBasis. Correct a root, then recall
before Maintenance. Raw records remain identical, but computed validity prevents
automatic use and inferred acceptance. Any_of with an unchanged independent valid
support may remain usable; missing or hidden uncheckable sources are unverifiable.
Do not disclose hidden IDs/counts or invent a reviewer-written stale flag. A paged
review cannot finish while any depth/page/coverage watermark is incomplete.

## KIP2-MEM-007 — Complete basis, context and exact temporal boundary

Two scoped claims differ between work/travel. Empty request context excludes both;
work selects only work plus general claims. At an old interval's until equal to the
new interval's from, exactly the new value is valid. Reject empty/reversed finite
intervals and unanchored timestamps. Change each basis coordinate independently
(snapshot, Schema, identity, policy, trust, authorization view, context, purpose,
risk, valid_at): cache reuse is forbidden unless revalidated. Historical belief
uses historical policy/trust with current read authorization. Missing historical
control state fails explicitly; new current trust is never silently substituted.

## KIP2-MEM-008 — Correct an identity decision

Under identity_repair, merge A into B, write records through supplied A and through
already-resolved B, then withdraw the merge decision with a correct identity-version
guard. Current canonical A resolves independently, old raw history is unchanged,
and affected ambiguous writes stay needs_review. Stale guards, key/canonical-ID
collisions and unauthorized control calls fail. Same local key across two owners
cannot merge through a Capsule without matching declared portable issuer/scope.

## KIP2-MEM-009 — Durable generation, coverage, leases and dispatch recovery

Under durable_brain_runtime, restart a Watch evaluator with an unread pre-deadline
match: no silence fire. Re-arm/change condition and replay an old worker: its old
generation cannot fire. Incomplete filtered watermark, stream truncation or changed
authorization scope requires resynchronization. Expire a running worker lease,
reclaim with a larger fence, reject old completion/dispatch. Crash before dispatch,
after external effect and before Outcome commit; recover the same attempt ID.
If external lookup/idempotency is unavailable, return outcome_unknown without
blind redispatch. A live authorized replacement can resume unfinished work.

## KIP2-MEM-010 — Compression, recall coverage and semantic erasure

Encode a source with a known omitted detail and retained raw bytes. CompressionRecord
preserves omission/extractor/schema information; re-encoding can recover the detail
only while bytes remain. Recall with constrained budget reports each required
channel's completion and never drops an applicable hard constraint to fit a Skill.
Then erase the source payload while a summary or backup remains: semantic forgetting
is partial, not completed. Held targets are blocked. Completed requires verified
closure over all controlled in-scope copies; external exports remain explicitly
outside the local completion claim. Erased source-event retries cannot reintroduce
content under the same suppression policy.

## KIP2-MEM-011 — Exact numeric identity and canonical bytes

Reject 9007199254740992 and 9007199254740993 (both outside the portable range),
including fraction/exponent spellings, before lowering/binding discards digits.
Accept ±9007199254740991 exactly; reject nonzero underflow and non-finite values.
Reject duplicate decoded object names, invalid Unicode and BOM in canonical JSON.
All shipped artifacts use kip-jcs-safe-v1 and reproduce their digest with one
canonicalizer. Test UTF-16 property ordering, 1/1.0, exponent boundaries and -0.
Artifact strings stay unchanged by NFC; semantic Literal normalization is separate.

## KIP2-MEM-012 — Typed results, artifacts and honest result classification

Validate canonical elements, projections, package dependencies, record Facets and
snapshot Capsules against the shipped schemas, then enforce semantic closure and
runtime constraints. A Proposition carrying confidence is invalid. Profile activation
cannot ignore unsupported value_schema or mismatched validation-schema digests.
Load only the manifest's verified schema pins in a fresh validator and compile
every root, including Capsule's Change Envelope dependency; no preloaded or network
resource may hide a missing transitive pin.
Model results identify themselves; an adapter error or unsupported required feature
is not PASS. Coverage counts and IDs are verified independently of implementation
claims. Full Profile claims require every applicable parent and companion vector.

## KIP2-MEM-013 — Profile kinds and ephemeral cognition

Event, Experience, Skill and SelfModel are schema-typed Concepts, not new Core kinds.
Experience steps are required only when the trajectory is valuable. Evidence-only
or empty formation is valid when grounded structure is unresolved or unnecessary;
no invented actor/type or hidden chain-of-thought is required.

## KIP2-MEM-014 — Orthogonal signals and deliberate silence

Update salience/utility/memory_strength under ordinary permission: trust, Assertion
confidence and authority remain unchanged. Record a gate decision silence with its
basis and inputs; no external act occurs and no permission is conferred. Replay
and read do not reinforce any signal. Utility changes require recorded actual-use
attribution, not just appearance in retrieved_refs.

## KIP2-MEM-015 — Failed experiences and causal restraint

Store a failed Experience with ordered steps and a counterexample. It remains
retrievable and eligible for review independent of low success/recall frequency.
Step adjacency creates no caused_by Assertion. A suspected causal relation is a
separately attributed claim with evidence; failure does not justify deletion.

## KIP2-MEM-016 — Commitments, assigned work and retention clocks

A semantic assigned_to actor has no worker permission without a matching Principal
Grant. A due Commitment remains explicit and recallable when mnemonic strength is
low. Passing due_at is not fulfillment and neither due_at nor world valid_time is
retention expiry. A read does not change status or counters.

## KIP2-MEM-017 — WorkingState is a validated view

Refresh WorkingState from exact inputs with DependencyBasis and a declared computation
basis. It is not Evidence and cannot independently corroborate its inputs. A wake
reads its basis plus every delta page through a declared watermark; missing coverage
or invalid dependencies are disclosed before automatic use. A current-looking
summary cannot override current Governance or a newer explicit correction.

## KIP2-MEM-018 — Trial prerequisites and reversible standing

A revision with no task_family, a trial without immutable basis/rule/coverage or an
adoption without at least two independent attempts is refused. Demonstrate reachable
adoption with a valid comparison and demotion with no greater evidence burden,
including policy withdrawal before trial. Post-adoption monitoring creates new
verdicts, never rewrites old ones; imported standing cannot bypass local trial.
Reject proposed/revoked → adopted even when the supplied comparison is improved
and has enough samples. Revoked → trialed selects a new trial before any promotion.
Permit adopted → adopted monitoring with insufficient evidence and zero eligible
new attempts when the authorized policy retains standing; retain the original
adoption basis, record no new improvement and still apply required demotion rules.

## KIP2-MEM-019 — Data contract without a mandatory Brain algorithm

Activate two Brains with different admission/ranking/comparison policies and the
same valid Profile. Both may conform if each records its basis and enforces the
same invariants. A valid alternative algorithm is not rejected for differing
weights. An algorithm failing comparability/coverage cannot label its output as
validated improvement. Cognitive utility is never an execution Grant.

## KIP2-MEM-020 — Mutable cache planes are all guarded

Race a verdict with a GradingState/TrialState/MnemonicState update. A verdict that
read-modify-writes those planes guards all of them and either commits once or
refreshes on conflict. Guarding only ATTRIBUTES cannot justify overwriting a
concurrently changed grading or utility cache. No partial verdict/status commit.

## KIP2-MEM-021 — Record topology and facet attachment enforcement

DecisionRecord attaches only to terminal action_gate, AttemptRecord to action_attempt,
TrialRecord to completed trial_open and EvaluationRecord to terminal lifecycle_verdict.
References match the corresponding inputs/outputs and current revision selection.
A terminal record cannot change its Facet values or topology through UPDATE/UNSET;
changing class or moving immutable content to a mutable Facet is not a bypass.

## KIP2-MEM-022 — Observer control and imported evidence

Same-Principal self-grading remains visibly attributable in an open Core deployment,
but cannot become validated local learning under the Profile. Check the observer's
pinned code/configuration and control policy; a new Principal name with the acting
agent still controlling the verifier does not establish independence. Imported
outcomes remain readable and excluded from local treatment/baseline grading.

## KIP2-MEM-023 — Required coverage outranks similarity

Provide an applicable constraint in a low-similarity source and a high-similarity
adopted Skill that would violate it. With a small briefing budget, the constraint
must survive, or coverage/action eligibility must say incomplete/false. Candidate
exposure alone updates no utility. Test the constraint without explicitly asking
about it in the final user question.
In procedural recall, relevant proposed/trialed Skills with no GradingState remain
visible as unproven candidates. Grades from another revision or an unavailable
evaluation must not be borrowed; a claimed adopted Skill lacking matching validated
evidence is surfaced as unverifiable, never a validated recommendation.

## KIP2-MEM-024 — Privacy reaches retained evaluation and backup inputs

A replay artifact contains a fact selected for semantic forgetting. Include it and
controlled backup copies in ErasurePlan. Until both are erased/otherwise removed
under the declared policy, status cannot be completed. Afterwards historical replay
reports unavailable honestly while permitted non-content verdict audit survives.
Re-export and cache reads cannot resurrect the in-scope fact.

## KIP2-MEM-025 — Empirical learning is a separate release gate

A model/engine conformance report has no measured task improvement by itself.
A Brain evaluation report states budgets, model/tool versions, seeds, holdout and
ablations, outcome uncertainty, cost and negative transfer. Without real runs,
status is not_run, never pass or a fabricated score. Different benchmark tasks
measure recall, application, reliability and learning separately.
