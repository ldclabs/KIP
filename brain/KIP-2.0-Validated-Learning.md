# KIP 2.0 Validated Learning

**Normative companion to [SPECIFICATION.md](../SPECIFICATION.md) and the [Cognitive Memory Profile](../profiles/CognitiveMemoryProfile-2.0.md), version 2.0-draft.**

This companion defines how a procedural memory earns **validated standing**: immutable revisions, pre-registered attempts, instrumented outcomes, frozen trials and replayable evaluations. It binds implementations that claim the Memory Interface level `memory_learning` (and the full `KIP-CognitiveMemory` Profile where Skills are graded). Without it, a Skill remains an unproven candidate: recallable, useful for deliberation, and never promoted.

Normative keywords follow Specification §0. The companion adds no Core kind: every record here is a Concept, an Activity or a Facet of the standard Profile package, and its wire shape is in `schemas/kip-cognitive-records.schema.json`.

## 1. Scope and standing

The Profile's Skill lifecycle is:

```text
proposed → trialed → adopted → revoked
```

Recall reports **standing**, a view of that lifecycle: `proposed` and `trialed` are `unproven`, `adopted` with a matching validated evaluation is `validated`, `adopted` whose evaluation cannot be verified is `unverifiable`, and `revoked` is `revoked` (Profile §14). Only this companion moves a Skill beyond `proposed`, except for withdrawal (`proposed → revoked`), which any authorized policy MAY record.

Validated standing is never authority. Execution permission is Governance (Specification §31.3), bound to the exact revision and behavior digest.

## 2. Revisions, decisions and attempts

**SkillRevision owns behavior.** The Profile's immutable `SkillRevision` Concept holds `task_family`, applicability, preconditions, procedure, success criteria and recovery under a `behavior_digest`. `Skill` is the stable identity and holds `current_revision` plus display state. Changing behavior creates a new SkillRevision and, in the same guarded transaction, selects it, resets current standing to `proposed` and clears `current_trial` and `current_evaluation`. Selection is not promotion; verdicts on old revisions stay intact. Annotation and `MnemonicState` changes do not reset standing. Authority bound to a revision id and behavior digest never transfers to edited behavior through the stable Skill id.

**DecisionRecord separates retrieval from use.** An `action_gate` Activity's immutable DecisionRecord (Profile §6.4) distinguishes `retrieved_refs`, `used_refs` and `applied_revisions`; every applied revision MUST also appear among the Activity's `inputs`. Retrieved-only content receives no automatic credit. Revisions used jointly form a treatment bundle unless a recorded attribution method separates them; a shared decision does not prove individual causal utility.

**AttemptRecord fixes the sampling unit before dispatch.** An `action_attempt` Activity with an immutable AttemptRecord identifies each actual attempt **before** it is dispatched: a Space-unique `attempt_id`, the `decision_ref`, the applied revision refs, the nullable `trial_ref`, context, environment and tool identities, the selection policy and the precondition assessment. A retrospective action record remains valid audit but MUST NOT be enrolled as treatment afterwards. Trial assignment is fixed before any result is observed.

## 3. Outcomes

Outcome Evidence (Specification §15.7) carries an immutable **OutcomeRecord**: `task_family`, `attempt_ref` (null for stream-only observations), `metric`, `window`, `terminal`, `observation_key`, `observer_config_digest`, `outcome_status` (`success | partial | failure | aborted | unknown`) and optional `magnitude`. The instrument's `outcome_observation` Activity links the outcome to its attempt and the attempt's decision; writing either requires `record_outcome` (Specification §29.8).

- Observation keys deduplicate source events. Several instruments or repeated measurements of one attempt remain distinct Evidence but one sampling unit: at most one terminal aggregate per attempt, metric and window contributes to an evaluation.
- Intermediate, unknown, aborted and missing results are accounted for explicitly. Conflicting terminal observations need a pinned aggregation or adjudication rule; they never become two successes.
- A corrected outcome is excluded from new grading; an old evaluation retains exactly the observations and correction state it used.
- An outcome with no attempt link is stream material. Sharing a task family never makes it a baseline, and its missing attribution proves neither treatment nor control.
- An imported outcome is readable evidence and never a local grade (Capsule §41.6).

## 4. Trials and evaluations

**TrialRecord freezes the comparison before enrollment.** Opening a trial is a completed `trial_open` Activity carrying an immutable TrialRecord: the revision or bundle, the basis, the rule and parameters artifacts, the comparability policy, `baseline_mode`, the exact baseline attempt and outcome refs, strata and weights, the quota in **independent attempts**, the observation window, the missingness policy, and immutable copies of the comparison inputs needed to rerun it. The Skill's `current_trial` Structural Field selects it; the field is a pointer, never read by a replay. A re-trial creates a new Activity with a new id; late outcomes stay with their original trial and never satisfy a new quota. A decision made before a trial opened cannot be enrolled in it.

**EvaluationRecord makes a verdict replayable.** Every `lifecycle_verdict` Activity carries an immutable EvaluationRecord: `trial_ref`, revision refs, `from_status` and `to_status`, rule and parameters digests, the cutoff, the selected attempt and outcome refs, rejected and missing sample accounting, the comparison result, and a pinned replay artifact holding the precise rule, parameters, basis and input values. Digests are verified against available bytes: a name or hash with no retrievable rule or inputs cannot claim recomputability. The replay artifact is governed at least as restrictively as its material inputs and is subject to semantic erasure (Specification §60.7). Replaying a retained evaluation does not require `historical_reads`.

**The verdict transaction.** Lifecycle status and `current_evaluation` change only in the same transaction as a validated EvaluationRecord. The engine MUST verify reference closure, revision and trial matching, unique attempts, eligible instrument origin, the rule bindings and the deterministic verdict. Naming an Activity `lifecycle_verdict` does not by itself promote anything. Every plane the transaction writes is guarded. The computed `GradingState` view (Profile §6.2) then reflects the new evaluation; it is never written.

Transitions follow Profile §14. Only `trialed → adopted` is promotion; `proposed → adopted` and `revoked → adopted` are invalid, and re-entry from `revoked` first opens and selects a new trial. An EvaluationRecord MAY keep `from_status == to_status` for post-adoption monitoring (§6). Imported Skills and revisions have no local standing, and imported outcomes do not grade.

## 5. Fixed baselines, prospective enrollment and applicability

`baseline_mode` defaults to `fixed`: the TrialRecord freezes explicit baseline attempts and outcomes. A host MAY pre-register paired tasks and a selection policy, run the complete baseline, then open a fixed trial; that is a valid baseline-first design and MUST NOT be reported as a concurrent randomized trial.

A runtime advertising `prospective_trials` (Specification §67.4) adds `baseline_mode: "prospective"`. The TrialRecord then freezes an **enrollment** artifact — population, units and arms, assignment procedure, predeclared sample limits, comparability, metric, uncertainty and stopping rules — and its baseline refs are empty: it cannot cite future records, and a completed `trial_open` is never updated. Every eligible control and treatment AttemptRecord pins that enrollment through `assignment` (its `unit_id`, `assigned_at` and arm) before execution and before its result is observed. The authenticated host verifies each assignment against the actual allocation record and the applied revisions; a model-written arm label never establishes membership or an untreated control.

For a prospective trial, `EvaluationRecord.cohort_artifact` freezes the complete enrolled cohort through the predeclared cutoff, including missing, aborted and unknown attempts, actual outcomes, assignment receipts and explicit exclusions. The evaluator MUST check that no eligible assignment disappeared and that no attempt switched arm, trial or revision; duplicate observations never add units. Missing or unverifiable enrollment or cohort coverage prohibits promotion.

A **ProcedureAssessment** MAY verify a revision against an applicability or correctness criterion without claiming comparative improvement. It stays advisory and unproven, never changes lifecycle status or `current_evaluation`, and grants no authority: an absolute success check is not renamed learning.

## 6. Comparable learning

Validated standing uses an **evaluation policy** held in protected control state under `manage_policy`. It fixes the allowed rule and parameter contracts, the observer-control digests and the minimum evidence and uncertainty requirements. A Brain MAY propose a policy, but a rule supplied as ordinary cognitive content cannot authorize its own verdict. The TrialRecord pins the policy identity, version and digest; the current policy is rechecked at verdict and at dispatch, while the retained policy stays available for replay. A constant adopt rule, or a weakened threshold supplied by the caller, is not authorized by being hashed.

An authorized rule declares its metric, direction, a non-negative practical improvement margin, a minimum independent sample requirement (at least two treatment attempts for promotion to `adopted`), an uncertainty test, safety constraints and a demotion condition. Quotas count eligible independent attempts, never Evidence elements. Withdrawal or an urgent policy demotion MAY have zero outcomes but still records a deterministic reason and a verdict; promotion MAY NOT.

Baseline membership is explicit and checked for context, environment and tool version, precondition satisfaction, intervention or bundle, and observation-window comparability. Distinct attempt ids do not prove statistical independence: the declared `sampling_unit` and `correlation_policy` cluster related attempts or adjust the uncertainty calculation. Missing attribution does not prove untreated control. Missing, censored or failed attempts MUST NOT silently disappear from a success denominator. Observer code and configuration are pinned; separate Principal ids alone do not prove independent observation. A self-graded or unverified observation process cannot claim validated local learning, even where an open deployment records it for audit.

A rule MAY use pairing, stratification, randomization or declared off-policy estimation; the protocol prescribes none. It MUST refuse a positive verdict when its own comparability, coverage or uncertainty requirements fail. Stratified comparisons use predeclared shared weights, not each arm's observed task mix: a shift from 90% to 80% in one stratum and from 40% to 30% in another is not an improvement, whatever the aggregate says. An empty baseline or a missing stratum is insufficient, never an invented 0.5 benchmark.

Post-adoption monitoring creates new evaluations and preserves prior ones. A same-state `adopted → adopted` evaluation MAY record insufficient evidence or no improvement, including zero eligible new attempts, where the authorized policy permits retaining standing; its replay artifact retains the prior adoption basis and the monitoring decision. It does not claim a new learning result and never bypasses a required demotion. Utility changes record their attribution method, evidence and uncertainty; a hypothesis of usefulness stays distinguishable from measured improvement.

## 7. The verdict, as KML

Once the trial's quota of independent eligible attempts is reached and its comparison succeeds, the verdict and the state change commit together. `:evaluation_record` values pin the immutable trial, revision, selected attempts and outcomes and retained replay inputs:

```prolog
MUTATE {
  CREATE ACTIVITY ?verdict {
    SET FIELDS {
      activity_class: "lifecycle_verdict",
      status: "completed",
      parameters_digest: :parameters_digest
    }
    SET FACET "EvaluationRecord" {
      trial_ref: :trial, revision_refs: [:revision],
      from_status: "trialed", to_status: "adopted",
      rule_digest: :rule_digest, parameters_digest: :parameters_digest,
      cutoff: :now, attempt_refs: [:attempt_a, :attempt_b],
      outcome_refs: [:outcome_a, :outcome_b], excluded_samples: [],
      missing_attempt_refs: [], comparison: :comparison, replay_artifact: :replay_artifact
    }
    SET STRUCTURAL {
      ("inputs", :trial)
      ("inputs", :revision)
      ("inputs", :outcome_a)
      ("inputs", :outcome_b)
      ("outputs", :skill)
    }
  }

  UPDATE :skill
  SET ATTRIBUTES {status: "adopted"}
  SET STRUCTURAL {("current_evaluation", ?verdict)}
  EXPECT VERSION :version OF ATTRIBUTES
  EXPECT VERSION :structural_version OF STRUCTURAL
}
```

The transaction validates the immutable TrialRecord and EvaluationRecord, the exact revision, the independently aggregated attempts, the comparison requirements and the replay artifact before it changes current state. A utility recalibration, if the Brain makes one, is a separate guarded `MnemonicState` write that records its attribution method.

## 8. Acceptance

The lifecycle and grading contracts are pinned by `conformance/KIP-2.0-Cognitive-Tests.md` (MEM-002–MEM-005, MEM-018), the reliability scenarios REL-006, REL-012 and REL-017, and the bounded lifecycle model `formal/lifecycle/check_lifecycle.py`. Passing them is necessary and never evidence that a Brain learned: behavioral learning claims follow [BrainEvaluation](./BrainEvaluation.md).
