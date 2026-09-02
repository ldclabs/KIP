# KIP Cognitive Memory Profile 2.0

**[English](./CognitiveMemoryProfile-2.0.md) | [中文](./CognitiveMemoryProfile-2.0_CN.md)**

## Status

**Standard Profile Candidate / Informative until separately published as a normative Profile Package**

Candidate Profile identity:

```text
kip://profiles/cognitive-memory@2.0.0
```

This document defines standard portable memory structures for KIP 2.0 Brains. It builds on KIP Core and does not redefine Core semantics. If it conflicts with `KIP-2.0-SPECIFICATION.md`, the Specification takes precedence.

---

# 0. Profile Thesis

KIP Core defines safe cognitive primitives:

```text
Concept
Proposition
Assertion
Evidence
Activity
MemorySpace
Schema
Governance
Transaction
Capsule
```

The Cognitive Memory Profile defines a reusable memory vocabulary on top:

```text
Person
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Watch
Skill
SleepTask
SelfModel
WorkingState
MnemonicState
GradingState
TrialState
DerivationState
DecisionRecord
OutcomeRecord
```

> **Core defines cognitive truth, provenance, authority, and durability semantics; the Profile defines portable memory forms.**

The Profile does not mandate one formation, ranking, consolidation, or forgetting algorithm.

# 1. Goals

The Profile SHOULD support portable episodic memory, goal-directed experience, procedural memory, prospective memory, attention state, preference patterns, self-reflective lessons, self-model artifacts, working state, mnemonic accessibility, procedural utility, graded consequences, and maintenance tasks.

It SHOULD make the following questions answerable:

```text
What happened?
What did the actor go through?
What did the actor learn?
What tends to work?
What failed?
What did the world do after we acted?
What has earned adoption — and what lost it?
What is still pending?
What change — or what silence — deserves attention?
What is the current working picture?
What should be easier to recall?
What changed in the self-model?
```

# 2. Non-Goals

The Profile does not define a theory of human memory, hidden chain-of-thought, a universal ontology, one embedding/ranking model, one sleep schedule, one salience algorithm, one Skill compiler, one adoption threshold or comparison construction, tool permission, Governance authority, or source trust policy.

A Profile element may describe a procedure without being authorized to execute it.

# 3. Core Boundaries

The Profile MUST preserve these distinctions:

```text
Preference Concept ≠ accepted preference belief
Skill Concept ≠ tool permission
Person Concept ≠ authenticated Principal
SelfModel Concept ≠ Governance policy
SleepTask Concept ≠ maintenance authority
Watch Concept ≠ scheduler or permission
WorkingState Concept ≠ Evidence
MnemonicState ≠ Assertion confidence
DerivationState ≠ Assertion lifecycle
Outcome Evidence ≠ the acting model's self-report
task_family ≠ attribution
DecisionRecord ≠ authorization to act
adopted Skill ≠ executable authority
```

Profile Facets and Structural Fields MUST NOT bypass Core immutability, origin, Governance, or Epistemic semantics.

# 4. Profile Package

A machine-readable publication SHOULD use an immutable Schema Package:

```text
package_id  = kip://profiles/cognitive-memory
version     = 2.0.0
package_ref = kip://profiles/cognitive-memory@2.0.0
```

Persist exact Profile refs. Local aliases remain model-facing conveniences.

# 5. Standard Concept Types

## 5.1 Person

A semantic person/actor used in cognitive content.

```text
Person ≠ PrincipalRecord ≠ ActorBinding
```

Recommended attributes include `display_name`, aliases, and description. Cross-system `canonical_id` should be used only after stronger identity verification; an unverified identity claim is expressed with the `same_as` Predicate (Proposition + Assertion) and reviewed before any merge.

## 5.2 Event

**An Event is a compact episodic anchor describing what happened in a bounded situation.**

Recommended fields:

```text
event_class
summary
started_at
ended_at
outcome_status
outcome_summary
context_summary
```

Event answers **what happened**. It does not need the full state-action-observation path.

## 5.3 Experience

**An Experience is a bounded goal-directed trajectory traversed by an actor through state, action, observation, feedback, and outcome.**

Conceptually:

```text
E = (g, b0, a0, o1, b1, a1, o2, ..., y, δ)
```

where `g` is goal, `b` is externally representable state/belief context, `a` action, `o` observation, `y` outcome, and `δ` feedback/surprise/prediction error.

Recommended fields:

```text
experience_class
goal
initial_state_summary
outcome_status
outcome_summary
started_at
ended_at
step_count
surprise
learning_value
consolidation_status
```

Suggested `outcome_status`:

```text
success | partial | failure | aborted | unknown
```

Suggested `consolidation_status`:

```text
pending | semantic | procedural | completed | archived
```

Create Experience when the path itself has future value: multi-step goal pursuit, failure/recovery, expectation violation, strategy change, important tool interaction, corrective feedback, novel procedure, or counterexample.

## 5.4 ExperienceStep

One ordered unit of an Experience.

Recommended fields:

```text
step_kind
summary
timestamp
tool
result_status
expected_observation
actual_observation
decision_summary
```

Suggested kinds:

```text
context | observation | decision | action | feedback | belief_update
```

`decision_summary` may store a concise reusable rationale but MUST NOT require hidden chain-of-thought.

Step order lives on the ordered `has_step` Structural References: the engine maintains a dense zero-based order per Experience, written via structural `{index: n}` assignments (or appended), and exposed to queries as the virtual `?edge.index` (Specification §17.4). Steps carry no separate order attribute, so order has exactly one source of truth.

Temporal adjacency does not prove causality. An explicit causal claim between steps uses the `caused_by` Predicate as a semantic Proposition + Assertion (typically `mode` observed/inferred, with Evidence). Like any claim, it can be supported, opposed, or contested — which is precisely why it is not structural topology.

## 5.5 Preference

A Profile artifact representing a relatively stable preference pattern.

Truth-sensitive preference claims still belong in:

```text
Proposition + Assertion(s) + Evidence
```

A Preference artifact may summarize scope, stability, first/last observation, and counterexamples, but should not replace underlying claim history.

## 5.6 Insight

A declarative lesson derived from Evidence or Experience. It SHOULD preserve derivation through Activity. If truth-apt, its claim SHOULD also be representable as Proposition + Assertion.

## 5.7 Commitment

A prospective memory artifact representing an obligation, promise, reminder, follow-up, or intended future action.

Recommended fields:

```text
summary
status
created_at
due_at
completed_at
priority
```

Suggested lifecycle:

```text
pending | fulfilled | cancelled | expired | blocked
```

A condition under which the Commitment becomes due or lapses is a Watch (§5.11) that targets it, not a field: the Watch is what the runtime evaluates, and the Commitment stays a plain prospective record.

A Commitment is cognition, not automatic external execution.

## 5.8 Skill

**A Skill is reusable procedural cognition compiled from Experience, Evidence, or validated instruction.**

Recommended fields:

```text
skill_class
task_family
summary
applicability
preconditions
procedure
success_criteria
failure_modes
counterexamples
recovery
status
created_at
```

Suggested classes:

```text
heuristic
workflow
checklist
tool_policy
communication_strategy
diagnostic
recovery
prompt_pattern
code_pattern
subagent_pattern
```

`task_family` is the Skill's **scoring handle**: the Outcome Evidence stream (Specification §15.7) that can prove it wrong. It is required — a pattern that names no stream that could grade it is not procedural memory; store it as an Insight instead. The family is where the Skill's baseline comes from; it is not how outcomes reach the Skill. An outcome counts toward this Skill only when it is provenance-linked to a decision that applied it (§8.1): the `action_gate` Activity names the Skill among its `inputs`, and the instrument's `outcome_observation` Activity names that decision among its own. Changing `task_family` is an ordinary audited mutation, and a verdict binds to the family and the linked outcomes it actually graded, so re-labeling never inherits grades.

Cognitive lifecycle:

```text
proposed → trialed → adopted → revoked
```

Every promotion or demotion is a deterministic verdict over graded Outcome Evidence (§14) — never author assertion, never decay, never the acting model's judgment. The graded record lives in `GradingState` (§6.2), the open trial in `TrialState` (§6.5), and the expected usefulness — the admission bet — in `MnemonicState.utility` (§6.1), exactly as for any other memory.

**An adopted Skill ≠ executable authority.** Authority remains Governance state. Imported Skills enter `proposed`/inactive with no transferred lifecycle standing (Specification §31.4) until locally trialed and reviewed.

## 5.9 SleepTask

A durable maintenance work item. Suggested classes include consolidate, review_conflict, review_skill, resolve_identity, review_retention, review_derived, refresh_self_model, and inspect_quarantine.

Semantic assignment to `$system` does not grant permission.

## 5.10 SelfModel

A derived artifact describing the Brain's current model of its identity, capabilities, limitations, values, preferences, habits, relationships, and goals.

SelfModel content MUST NOT modify Principal identity, ActorBinding, Governance Policy, tool permission, or Schema authority.

## 5.11 Watch

**A Watch is durable attention state: a declared condition under which a change — or the absence of one — deserves the Brain's attention.**

Recommended fields:

```text
watch_class
summary
condition
due_at
status
priority
created_at
fired_at
```

Suggested classes:

```text
delta      fire when a matching change is committed
silence    fire when due_at passes with no matching change
```

Suggested lifecycle:

```text
armed → fired | expired | disarmed
```

`condition` declares what counts as a matching change. Its baseline form is a structured filter over Change Envelope entries (Specification §36.1), so that a runtime advertising `watch_evaluation` can evaluate it without reading payload:

```json
{
  "element": "C-42",
  "slot": {"subject": "C-1", "predicate": "timezone"},
  "type": "Commitment",
  "ops": ["create", "lifecycle"],
  "touched": ["attributes.status"],
  "text": "any reply from Alice about the migration plan"
}
```

`element`, `slot`, and `type` select what is watched (at least one; `slot` matches Assertion entries whose `refs.proposition` belongs to the subject–predicate slot, and `type` resolves through the symbol lineage); `ops` and `touched` narrow which entries count, and default to any. `text` is the fallback a maintenance process interprets when the structured members cannot express the condition; a Watch that carries only `text` is Brain-evaluated, not runtime-evaluated.

Evaluation is a differential loop: the runtime or Brain compares committed Change Envelopes against the armed Watch set; a silence Watch fires when `due_at` passes without a match. An evaluator MUST have consumed the Change Stream through the `space_seq` current at `due_at` before it may conclude silence: the clock alone proves nothing, because a matching change committed before the deadline may still be in flight to this evaluator, and firing on the clock first is a false alarm the model in `formal/watch` reproduces. Firing is one atomic transition — a `watch_fire` Activity (inputs: the Watch and, where representable, the changed element or observation Evidence; outputs: the SleepTask or notification artifact it produced) plus the Watch's `status` change through a guarded `UPDATE ... EXPECT VERSION` — and it MUST be idempotent under concurrent evaluators: the `watch_fire` Activity's `client_key` is `watch_fire:<watch id>:<space_seq of the matching envelope>` for a delta Watch and `watch_fire:<watch id>:silence:<due_at>` for a silence Watch, so a second evaluator that saw the same envelope, or the same passed deadline, replays the firing instead of firing twice.

**A fired Watch grants nothing.** It creates attention — typically a SleepTask or a wake signal — never an external action. Whatever the Brain does next passes the action gate (§9) and Governance like any other act.

A Watch that encodes the waiting half of a Commitment ("if no reply by Thursday, escalate") references that Commitment through `derived_from`. The Commitment holds the obligation; the Watch holds the trigger.

## 5.12 WorkingState

**A WorkingState is a derived, versioned digest of what matters now: the consolidated state a waking Agent resumes from instead of re-reading raw history.**

Recommended fields:

```text
summary
horizon
basis_seq
refreshed_at
```

`basis_seq` is the `space_seq` the digest was built at. Wake-up then reads:

```text
DESCRIBE PRIMER               who am I, what vocabulary
WorkingState                  what matters now
CHANGES AFTER SEQ basis_seq   what moved since it was built
```

Typical inputs, linked through `derived_from`: open Commitments, armed Watches, contested belief slots, recent high-salience Events, and active threads. Refresh is a `working_state_refresh` Activity, normally run by maintenance.

A WorkingState is a derived recall surface (Specification §66.7): it is served with its declared basis, never presented as transaction-snapshot-consistent when it is not. It is a view of cognition, not cognition's source:

```text
WorkingState is never cited as Evidence
WorkingState never corroborates its own inputs
WorkingState answers "what is my situation"; SelfModel answers "who am I"
```

A Space SHOULD keep at most one active WorkingState per actor scope, under a stable `key`.

# 6. Standard Facets

## 6.1 MnemonicState

```json
{
  "memory_strength": 0.8,
  "salience": 0.9,
  "utility": 0.6,
  "last_metabolized_at": "2026-08-14T00:00:00Z"
}
```

`memory_strength` asks how available the memory should be for future cognitive use. `salience` asks how important/noteworthy it is. `utility` asks how much future decision value the memory is expected to carry — the admission bet made when it was stored, revised as outcomes come in.

```text
memory_strength ≠ confidence
salience ≠ trust
utility ≠ truth, salience, or permission
```

Mnemonic metabolism MUST NOT rewrite Assertion confidence, trust, valid time, or Governance authority.

Utility calibration is explicit mutation like any other reinforcement: an outcome that vindicated or wasted the bet may adjust `utility` through Formation/Maintenance writes. Reading alone never does (Specification §2.13). The data path is the decision record (§9): a memory an Action Briefing drew on is named in the `action_gate` Activity's `inputs`, the outcome is linked to that decision, and calibration follows the link back — there is no other way for a consequence to reach a memory's `utility`.

Skills carry the Facet too. A Skill's expected usefulness is `MnemonicState.utility`, set as the admission bet at compilation and revised by verdicts; its graded record is `GradingState`.

## 6.2 GradingState

```json
{
  "success_count": 8,
  "failure_count": 2,
  "graded_count": 11,
  "last_verdict_at": "2026-08-10T00:00:00Z"
}
```

GradingState is the graded record of an artifact that carries a `task_family` — a Skill, or an Insight that subscribes to a stream. The counts are tallies of Outcome Evidence **linked to a decision that applied the artifact** (§8.1), maintained by verdict and grading Activities — never by the acting model's own report, and never by an outcome that merely shares the family. `graded_count` counts every linked graded outcome including `partial`, `aborted`, and `unknown`, so the two named tallies never have to pretend to be exhaustive.

```text
GradingState ≠ utility      the record of what happened, not the bet on what will
GradingState ≠ authority    a perfect record still grants no permission
```

## 6.3 DerivationState

```json
{
  "basis_seq": 1500,
  "status": "current",
  "reviewed_at": "2026-08-14T00:00:00Z"
}
```

DerivationState marks how a derived artifact — Insight, Preference, Skill, SelfModel, WorkingState — stands relative to its provenance roots. `basis_seq` is the `space_seq` at which the derivation was made or last revalidated.

Suggested `status`:

```text
current | stale | under_review
```

`stale` means a provenance root was revised after `basis_seq` and the derivation has not been re-examined. It is a review flag on the artifact, not an epistemic verdict:

```text
DerivationState ≠ Assertion lifecycle
stale ≠ retracted, wrong, or excluded from recall
```

Maintenance sets `stale` after finding the artifact through `LIST DEPENDENTS` on a revised root (Specification §57.5, §63.5), reviews it, and resolves it to `current` (revalidated), a revised artifact, or an ordinary lifecycle action.

## 6.4 OutcomeRecord

```json
{
  "task_family": "deploy/rollback",
  "outcome_status": "failure",
  "magnitude": 0.3
}
```

OutcomeRecord attaches to Outcome Evidence (Specification §15.7) and makes the consequence queryable: `task_family` names the stream of comparable consequences, `outcome_status` uses the Experience vocabulary (`success | partial | failure | aborted | unknown`), and optional `magnitude` carries a deployment-defined size on `[0,1]`. The raw instrument output stays untouched in the Evidence payload; the Facet is the graded index over it.

```text
OutcomeRecord ≠ the actor's opinion of how it went
task_family   = the stream key; it finds comparable consequences and never attributes one
attribution   = the outcome_observation Activity that names the decision (§9)
```

## 6.5 TrialState

```json
{
  "opened_at": "2026-08-20T00:00:00Z",
  "basis_seq": 1480,
  "baseline_graded_count": 40,
  "baseline_success_count": 22,
  "baseline_failure_count": 15,
  "quota": 12,
  "rule_id": "adopt-if-better-v1"
}
```

TrialState is the recorded comparison basis of an open trial (§14). It is written by the `lifecycle_verdict` that opens the trial and rewritten only by a later verdict: `basis_seq` is the `space_seq` at which the trial opened; the `baseline_*` tallies are the family's outcomes, not linked to this artifact, that the rule counted up to that basis; `quota` is how many linked graded outcomes the rule needs before it will decide; `rule_id` names the deterministic rule, and matches the verdict Activity's `parameters_digest`. With the basis recorded on the artifact and the treatment set recorded as the verdict's `inputs`, an auditor can recompute the verdict from state alone.

```text
TrialState ≠ the verdict     it is what the verdict was measured against
TrialState ≠ standing         an open trial is not adoption
```

## 6.6 DecisionRecord

```json
{
  "decision": "act",
  "rationale": "authorized, reversible, and the Watch condition matched"
}
```

DecisionRecord attaches to an `action_gate` Activity (§9) and records what the gate decided:

```text
act       acted without asking — authorized, reversible, worth it
ask       escalated to a person
defer     scheduled for later attention
silence   deliberately did nothing
```

The Activity's `inputs` carry the cognition the decision applied — the trigger, the Skills, the memories the briefing drew on — and its `associated_actors` name who decided. That is the decision half of the consequence channel: an outcome grades a decision by naming this Activity (§8.1), and a memory's `utility` is calibrated by following the link back to the `inputs` that were drawn on. `rationale` is a concise, reusable account, never hidden chain-of-thought.

```text
DecisionRecord ≠ authorization    recording that the gate said act is not permission to act
```

# 7. Standard Structural Fields

Structural Fields are record topology, not semantic Propositions.

```text
experienced_by  Experience → Person
has_step        Experience → ExperienceStep (ordered)
involves        Event/Experience → relevant Person/Concept
mentions        Event/Experience/Insight → Concept
derived_from    Profile artifact → source cognition
compiled_from   Skill → Experience
compiled_by     Skill → Activity
consolidated_to Event/Experience → derived memory artifact
committed_to    Commitment → Person
owed_to         Commitment → Person
assigned_to     SleepTask/Watch → semantic Actor
watches         Watch → observed cognition
about           Profile artifact → topical Concept
```

`involves`, `mentions`, and `about` should not be used to fake stronger domain relations.

The Profile also defines two standard **semantic Predicates** (truth-sensitive; used through Proposition + Assertion + Evidence):

```text
prefers    Person → Concept                     stable preference claim
caused_by  ExperienceStep → ExperienceStep      effect → cause claim
same_as    Concept → Concept                    unverified identity claim
```

`same_as` feeds identity review (Maintenance §15-style workflows); it never auto-merges Concepts and never establishes `canonical_id` by itself.

`caused_by` direction is effect → cause. Step order (`has_step` edge index) alone must never be promoted into a `caused_by` claim.

Domain-specific factual predicates (for example `timezone`) come from domain packages, not from this Profile.

# 8. Evidence and Provenance

Profile artifacts SHOULD preserve Evidence linkage whenever factual fidelity matters.

```text
Event       ← message/tool Evidence
Experience  ← trace Evidence
Insight     ← Experience/Evidence
Skill       ← Experiences + compilation Activity
SelfModel   ← observations/Insights/Activities
```

Repeated transformation does not create independent corroboration. Message → Event summary → Experience summary → Insight may still have one epistemic root.

## 8.1 The consequence channel

Everything above lets the system watch the world. The consequence channel is how the world watches back: Outcome Evidence (Specification §15.7) carrying an `OutcomeRecord` Facet, written by instrumentation — telemetry, verifiers, test harnesses, tooling, human review — under `record_outcome` authority (Specification §29.8).

The channel has two joins, and they do different jobs:

```text
stream        OutcomeRecord.task_family
              finds the comparable consequences: the baseline a trial is measured against

attribution   outcome_observation Activity {inputs: the decision, outputs: the outcome}
              names the one decision an outcome grades; the decision's inputs name
              the Skills applied and the memories drawn on
```

The channel feeds four consumers, all under the same discipline:

```text
Skill lifecycle verdicts        §14   linked outcomes vs. the TrialState baseline
GradingState tallies            §6.2  linked outcomes only
MnemonicState.utility           §6.1  the admission bet, vindicated or wasted, via the decision's inputs
trust calibration               Specification §22.6
```

Discipline:

- The acting model MUST NOT write the outcomes that grade its own action; its account is `agent_statement`, citable as context only.
- An outcome that grades a decision MUST be linked to it: the instrument's `outcome_observation` Activity names the decision Activity among its `inputs` and the outcome among its `outputs`. A tally, a verdict, or a utility calibration changes only through that link. An outcome with no decision link belongs to the stream — and therefore to the baseline — and to nothing else.
- A decision that is to be graded MUST exist as an `action_gate` Activity with a `DecisionRecord` (§6.6) whose `inputs` name the cognition applied. Ungated actions leave nothing for an outcome to grade.
- Task family vocabulary is deployment policy; family names SHOULD be stable, namespaced, and few enough to accumulate graded history.
- A consumer verifies the origin chain of the outcomes it grades and refuses those whose origin fails its policy — the channel is auditable, not unforgeable. A deployment where the acting Principal also holds `record_outcome` is self-graded by construction and MUST be visible as such from `_system.origin`.

## 8.2 Derived artifacts

Insight, Preference, Skill, SelfModel and WorkingState are **derived artifacts**: cognition compiled from other cognition rather than observed. They stay five types — their fields, recall views and lifecycles differ, and one `DerivedArtifact` type would only move that difference into an untyped `kind` attribute — but they share one contract:

1. **Lineage is recorded, not implied.** A derived artifact reaches its sources through `derived_from` (all of them), `compiled_from` / `compiled_by` (Skill) or `consolidated_to` from the source side (§7), and the Activity that produced it names those sources among its `inputs` (§9). An artifact with no recorded lineage is an unsupported claim about the Brain's own history.
2. **DerivationState travels with it.** Every derived artifact carries `DerivationState` (§6.3) with the `basis_seq` of its last validation; `stale` is a review flag, never an epistemic verdict.
3. **Roots revise; artifacts do not follow automatically.** Retracting, superseding or correcting a root changes Projection and nothing else (Specification §57.5). Maintenance finds the affected artifacts through `LIST DEPENDENTS` (Specification §63.5), marks them `stale`, and resolves each by review: revalidate, replace through a new artifact with its own lineage, or take an ordinary lifecycle action.
4. **Layers are not corroboration.** However many transformations separate an artifact from its Evidence, its support is the root set (§8); consumers count roots, not layers.
5. **Only consequences promote.** Skill is the one derived artifact graded by the consequence channel (§8.1, §14). Insight, Preference and SelfModel are believed through their Evidence roots and reviewed on schedule (§18); no outcome tally exists for them, so nothing promotes them.

# 9. Activities

Recommended Activity classes:

```text
experience_formation
semantic_consolidation
reflection
procedural_consolidation
skill_compilation
skill_validation
self_model_refresh
mnemonic_metabolism
commitment_review
watch_fire
action_gate
derivation_review
working_state_refresh
outcome_observation
lifecycle_verdict
```

Activity records provenance; Activity is not Transaction.

An `action_gate` Activity is the decision record: it records the decision a state change was put through before anything outward happened. Its `DecisionRecord` Facet (§6.6) holds the outcome — `act`, `ask`, `defer`, or `silence` — its `inputs` name the cognition applied (the trigger, the Skills, the memories the briefing drew on), and its `associated_actors` name who decided. Recording `defer` and `silence` is what makes restraint accountable: "why didn't you tell me" is answered from the same provenance as "why did you". The gate threshold — which changes get an evaluation at all — is Brain policy; low-value noise needs no gate record, but an action that is to be graded by the consequence channel does.

An `outcome_observation` Activity is the ingesting instrument's record of writing Outcome Evidence and of what it grades — inputs: the `action_gate` Activity of the decision observed; outputs: the Outcome Evidence. The input is REQUIRED when the outcome is to count toward any Skill, tally, or calibration; an observation with no decision input records a consequence in the stream only. Its associated actor is the instrumentation Principal, never the actor whose action is being graded, and writing it requires `record_outcome` (Specification §29.8).

A `lifecycle_verdict` Activity records one deterministic evaluation of the consequence stream — inputs: the linked Outcome Evidence it graded; outputs: the Skill whose lifecycle it moved; `parameters_digest` pins the rule identity, and the Skill's `TrialState` (§6.5) holds the basis the comparison was made against, so the verdict is recomputable by an auditor from state alone. A verdict is executed code reading recorded outcomes. It is not model judgment, and a transition without a verdict Activity is not a lifecycle transition — it is an unexplained edit.

# 10. Event Formation

An Event SHOULD be compact: time, participants, summary, outcome, context, Evidence refs. Routine acknowledgements may produce no Event.

# 11. Experience Formation

When possible, one Transaction SHOULD coherently form:

```text
source Evidence
Experience
ExperienceSteps
MnemonicState
experience_formation Activity
optional Event
optional semantic Assertions
```

Failure is first-class. Failed Experiences may teach negative preconditions, diagnostics, recovery branches, invalid assumptions, counterexamples, and tool limitations.

# 12. Semantic Consolidation

Semantic consolidation asks: **What reusable declarative regularity is supported by accumulated evidence?**

Recommended flow:

```text
Experience/Evidence
→ candidate Proposition
→ derived Assertion
→ semantic_consolidation Activity
```

It MUST NOT rewrite old Assertion confidence, delete contradictory Evidence, or count summaries of one root as independent Evidence.

# 13. Procedural Consolidation

Procedural consolidation asks: **What action policy seems to work under which conditions?**

```text
successful Experiences
+ failed Experiences
+ counterexamples
→ contrast
→ proposed Skill (with task_family)
→ trial (§14)
```

One successful Experience normally does not establish general procedural reliability.

Consolidation MUST attach the `task_family` at proposal time and MUST refuse to emit a Skill without one: a pattern that names no stream that could grade it has no way to be wrong, and belongs in an Insight, not in procedural memory.

# 14. Skill Lifecycle

```text
proposed   compiled, carries its task_family; ungraded
trialed    the outcome stream is grading it against a recorded baseline
adopted    promoted by verdict; provisional — the stream keeps grading
revoked    demoted by verdict, counterexample, or policy; the record survives
```

Allowed transitions, every one executed as a `lifecycle_verdict` Activity plus one guarded UPDATE (Specification F.6):

```text
proposed → trialed    trial opens; requires task_family; the opening verdict writes TrialState (§6.5)
trialed  → adopted    comparative verdict over linked outcomes vs. the TrialState baseline; no single success suffices
trialed  → revoked    verdict, counterexample, or policy
proposed → revoked    withdrawn before trial
adopted  → trialed    degradation verdict; re-trial, not amnesty
adopted  → revoked    verdict; one high-severity matching-condition failure MAY suffice
revoked  → trialed    re-entry starts a new trial; nothing resurrects silently
```

Rules:

1. **Deterministic transitions.** Promotion and demotion MUST be executed by deterministic code reading graded Outcome Evidence — not author assertion, not decay, not the acting model's judgment. The Brain proposes, compiles, and narrates; it never promotes.
2. **Comparative, recomputable adoption.** A trial verdict answers *did things go better than they were going*, not *did things go well*. How the comparison is constructed is Brain policy; that its basis is recorded is Profile discipline: the opening verdict MUST write `TrialState` (basis sequence, baseline tallies, quota, rule identity), the deciding verdict MUST list the linked outcomes it graded as its `inputs` and pin the rule in `parameters_digest`, and the verdict SHOULD also be expressible as a Proposition + Assertion about the Skill so it enters the auditable claim graph.
3. **Revocation is never harder than adoption.** The demotion bar MUST NOT exceed the promotion bar. A lifecycle that can only acquire cannot tell a habit from a superstition.
4. **Adoption is provisional.** An adopted Skill stays subscribed to its stream. A deployment SHOULD define a re-verdict trigger — an outcome count, a time window, or a Watch on the family — so adoption ages with the world instead of outliving it.
5. **Grading vocabulary.** Distinguish success under matching conditions, failure under matching conditions, failure under non-matching conditions, and unknown outcome. Matching-condition failure lowers utility, adds failure modes and counterexamples, narrows applicability, or demotes; non-matching failure narrows applicability without penalizing the procedure.
6. **Orthogonal review states.** DerivationState (§6.3) still applies: a Skill whose provenance root was revised goes `stale`/`under_review` regardless of lifecycle standing, and that review may open a re-trial.
7. **Attribution before counting.** The treatment set of a trial is the outcomes linked to a decision that applied the Skill (§8.1); the baseline is the rest of the family. An outcome that merely shares the `task_family` MUST NOT change the Skill's `GradingState` or move its lifecycle; two Skills in one family are graded by their own decisions, not by each other's.

No lifecycle state grants execution authority. Adoption is standing, not permission.

# 15. Preference Consolidation

Distinguish one stated preference, repeated behavior, context-specific preference, stable cross-context pattern, counterexample, and explicit correction.

Explicit statements remain Evidence + Assertions. Preference artifact state is a summary, not replacement history.

# 16. Self-Model Formation

SelfModel evolution SHOULD be conservative. Prefer multiple observations, explicit statements/corrections, high-salience Experience, validated capability changes, and repeated behavior. Avoid single incidental wording, speculative personality diagnosis, hidden internals, or authority claims.

# 17. Commitment Semantics

A due time passing does not necessarily transition status until policy/Evidence does so. A Commitment may remain highly salient even without recent recall. Disuse alone is not justification to weaken its importance.

The waiting half of a Commitment — escalate if nothing happens — is a Watch (§5.11) referencing the Commitment through `derived_from`. The due date stays on the Commitment; the trigger stays on the Watch.

# 18. Mnemonic Metabolism

Typical legal changes:

```text
memory_strength ↓/↑
salience adjustment
utility calibration
archive eligibility
review scheduling
GradingState tallies (through linked outcomes only)
```

Generic time-based decay MUST NOT mutate Assertion confidence.

```text
new epistemic evidence → new/revised Assertion
staleness → Projection freshness/validity
forgetting → memory_strength
wasted or vindicated admission bet → utility
storage lifecycle → retention/archive/tombstone/purge
```

# 19. Retention Guidance

Typical tendencies:

```text
Person/stable identity     durable
Commitment                 durable through lifecycle
Skill                      durable while useful/auditable
SelfModel                  durable/versioned
WorkingState               durable/versioned; superseded digests may archive
Experience                 standard/durable by learning value
Event                      standard; may archive
ExperienceStep             follows Experience
SleepTask                  standard; terminal may archive
Watch                      standard; terminal may archive
Evidence                   policy-specific; provenance often favors durability
                           (payload bytes may be purged separately, Spec §60.6)
```

Retention MUST NOT remove counter-Evidence merely to improve future Projection.

# 20. Recall Views

The Profile supports:

```text
Episodic Recall   = Event + selected Evidence
Experience Recall = Experience + ordered Steps + Outcome
Procedural Recall = Skill + applicability + GradingState + utility + positive/negative Experience
Action Briefing   = accepted knowledge + contested assumptions + Skills + successes + failures + Commitments + constraints + warnings
Wake Briefing     = WorkingState + CHANGES AFTER its basis_seq
```

The consuming Agent remains final action authority unless separate Governance grants otherwise.

# 21. Portability

A Cognitive Capsule carrying Profile cognition SHOULD preserve exact Profile Package refs, types, Facets, Structural References, Evidence/provenance closure, source identity, and exportable retention state.

Destination import MUST NOT automatically transfer source self identity, source trust, Skill authority, tool permission, or Governance policy. Remote autobiographical memory remains remote autobiography under ordinary merge import.

A source's Watches and WorkingState are that Brain's attention and situation: under ordinary merge import they arrive disarmed and non-current. A destination re-arms its own attention and rebuilds its own working picture.

Lifecycle standing does not transfer either: an imported Skill enters `proposed` with empty `GradingState` and no `TrialState`, whatever its source status said. Its capsule may carry the source's outcome history as evidence worth reading — it is not local grading, it arrives with the destination's origin rather than the instrument's, and it never counts toward a local verdict.

# 22. Conformance Expectations

Profile conformance SHOULD test Experience/Step structural validity, failed Experience preservation, MnemonicState mutability, confidence/memory-strength separation, GradingState mutability, Skill authority non-amplification, Capsule portability, SelfModel non-authority, Commitment lifecycle, Watch non-authority, DerivationState/epistemic separation, WorkingState non-evidence, DecisionRecord non-authority, formation atomicity, procedural provenance, outcome origin separation (self-report never grades), outcome attribution (an outcome without a decision link never changes a tally, and a family-mate's outcome never grades another Skill), task-family required for trial entry, TrialState written at trial opening, verdict determinism and recomputability, and lifecycle non-transfer on import.

# 23. Profile Invariants

The Profile's 35 invariants are Part B of the shared registry [KIP-2.0-Invariants.md](../KIP-2.0-Invariants.md), numbered `P1`–`P35` in the order this section gave them; each row names the Profile section that establishes it and the conformance vectors that pin it. Part A of the same registry is the Specification's §102 list, which every runtime the Profile runs on must already preserve.


# 24. Minimal Profile Primer

```text
Cognitive Memory Profile 2.0

Event: compact record of what happened
Experience: goal-directed state/action/observation trajectory
ExperienceStep: ordered observable step; no hidden chain-of-thought
caused_by: explicit effect→cause claim between steps; edge order alone is not causality
Insight: declarative lesson derived from memory
Skill: reusable procedure with a task_family; proposed|trialed|adopted|revoked; never execution authority
Commitment: prospective memory
Watch: armed attention — a delta or a silence worth waking for; firing grants nothing
SelfModel: derived cognition about self; not Governance
WorkingState: what matters now, stamped with its basis_seq; never Evidence
MnemonicState: memory_strength + salience + utility; not confidence; Skills carry it too
GradingState: tallies of outcomes linked to decisions that applied the artifact; not authority
TrialState: the recorded basis an open trial is measured against; not standing
DerivationState: basis_seq + current|stale|under_review; review state, not belief
DecisionRecord: act|ask|defer|silence on an action_gate Activity whose inputs name what was applied; not authorization
OutcomeRecord: task_family + outcome_status on Outcome Evidence; written by instruments, never the actor it grades
task_family finds the baseline; only the outcome_observation link attributes an outcome to a decision
lifecycle_verdict: deterministic, recorded, recomputable; the only path between Skill lifecycle states

Truth-sensitive claims use Proposition + Assertion + Evidence.
Transformations preserve Activity provenance.
```

# 25. Final Principle

> **A Cognitive Memory Profile should make the past structurally reusable without confusing memory accessibility, epistemic belief, autobiographical identity, or procedural usefulness with authority.**
