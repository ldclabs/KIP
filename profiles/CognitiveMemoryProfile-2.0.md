# KIP Cognitive Memory Profile 2.0

**[English](./CognitiveMemoryProfile-2.0.md) | [中文](./CognitiveMemoryProfile-2.0_CN.md)**

## Status

**Normative Standard Profile Draft**

This document and its package bind implementations claiming the `KIP-CognitiveMemory` conformance level (Specification §89). Draft status does not downgrade MUST requirements; Brain policy examples remain informative.

Package identity (a draft revision is identified by its content digest, Specification Status):

```text
kip://profiles/cognitive-memory@2.0.0
```

This document defines standard portable memory structures for KIP 2.0 Brains. It builds on KIP Core and does not redefine Core semantics. If it conflicts with `SPECIFICATION.md`, the Specification takes precedence.

Two companions in `brain/` carry the machinery that only some deployments need: [Validated Learning](../brain/KIP-2.0-Validated-Learning.md) (trials, evaluations and validated Skill standing) and [Brain Runtime](../brain/KIP-2.0-Brain-Runtime.md) (durable workers, leases and dispatch). Implementations may instead advertise the narrower [Memory Interface levels](../KIP-2.0-Memory-Interface.md#2-levels); a level does not claim this entire Profile, change stored symbol lineages or weaken Core invariants. Ordinary facts and descriptive feedback never require trials.

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
Insight
Commitment
Watch
Skill
SkillRevision
SleepTask
SelfModel
WorkingState
MnemonicState
GradingState (computed view)
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
Insight about a preference ≠ accepted preference belief
Skill Concept ≠ tool permission
Person Concept ≠ authenticated Principal
SelfModel Concept ≠ Governance policy
SleepTask Concept ≠ maintenance authority
Watch Concept ≠ scheduler or permission
WorkingState Concept ≠ Evidence
MnemonicState ≠ Assertion confidence
dependency validity ≠ Assertion lifecycle
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

## 5.5 Preference patterns

A preference is a claim, not a type: "Alice prefers dark mode" is a `prefers` Proposition with Alice's Assertion and its Evidence (§7), and a changed preference is a newer Assertion within its kind (§15). The Profile defines no separate Preference Concept. A relatively stable pattern worth summarizing — scope, stability, counterexamples — is an Insight (§5.6) `about` the option kind, derived through a recorded Activity like any other Insight; it never replaces the claim history it summarizes, and Recall answers from the `prefers` slot, not from the summary.

Each option a person can prefer is a Concept typed by its kind — a color scheme, an editor — because that type is what `prefers` partitions by (Specification §20.15). Formation MUST NOT type options with a catch-all type; where no installed package names the kind, it defines one in the draft vocabulary first (Specification §20.16).

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

A Commitment reaches the business Agent's attention (Memory Interface §4) only through a commit that raises it: a Watch on its `due_at` firing (`watch_fire`), or a `commitment_review` Activity in which Maintenance records the Commitment as due (§17). The passing of `due_at` alone raises nothing, so every attention item has the `space_seq` of the commit that raised it.

A Commitment is cognition, not automatic external execution.

## 5.8 Skill

**Skill is stable procedural identity; SkillRevision is the immutable behavior
that was actually executed and evaluated.** A Skill holds `skill_class`, `summary`,
annotations and its lifecycle `status`. Required `current_revision` points to a
SkillRevision; the revision's `revision_of` points back to this Skill. Creation of
the pair is atomic, including forward references. Optional `current_trial` and
`current_evaluation` point to the Activities carrying the immutable TrialRecord and
EvaluationRecord behind current standing; they are set only by the Validated
Learning companion's transactions.

A SkillRevision contains required `task_family`, `procedure`, `behavior_digest`,
and optional applicability, preconditions, success_criteria and recovery.
Its behavior_digest is sha256 of the canonical behavior fields excluding the digest.
All behavior fields are immutable, and may not be shadowed by mutable Skill fields.
The task family is a stream-selection handle, never sufficient baseline membership.
Ungradable declarative lessons remain Insights.

Lifecycle remains `proposed → trialed → adopted → revoked` (§14), and standing is
bound to the exact revision. Selecting new behavior resets current standing to
`proposed` and clears `current_trial` and `current_evaluation` in one guarded
transaction, without changing old verdicts. This is revision selection, not a
promotion. Annotations and mnemonic signals may change without resetting standing.
Trials, decisions, outcomes and Governance authority bind the exact revision and
behavior digest (Validated Learning §2). Imported revisions earn local standing only
from new local trials.

## 5.9 SleepTask

A durable maintenance work item. Suggested classes include consolidate, review_conflict, review_skill, resolve_identity, review_retention, review_derived, review_schema, refresh_self_model, and inspect_quarantine. `review_schema` queues draft vocabulary symbols (Specification §20.16) for review and promotion.

Where `durable_brain_runtime` is advertised, a SleepTask's claim and completion follow the lease contract of the [Brain Runtime companion](../brain/KIP-2.0-Brain-Runtime.md) §3.

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

Evaluation is a differential loop: the runtime or Brain compares committed Change Envelopes against the armed Watch set; a silence Watch fires when `due_at` passes without a match. An evaluator MUST have consumed the Change Stream through the `space_seq` current at `due_at` before it may conclude silence: the clock alone proves nothing, because a matching change committed before the deadline may still be in flight to this evaluator, and firing on the clock first is a false alarm the model in `formal/watch` reproduces. Firing is one atomic transition — a `watch_fire` Activity (inputs: the Watch and, where representable, the changed element or observation Evidence; outputs: the SleepTask or notification artifact it produced) plus the Watch's `status` change through a guarded `UPDATE ... EXPECT VERSION` — and it MUST be idempotent under concurrent evaluators: the `watch_fire` Activity's `client_key` is `watch_fire:<watch id>:<arm_generation>:<space_seq of the matching envelope>` for a delta Watch and `watch_fire:<watch id>:<arm_generation>:silence:<due_at>` for a silence Watch, so a second evaluator that saw the same envelope, or the same passed deadline, replays the firing instead of firing twice.

**A fired Watch grants nothing.** It creates attention — typically a SleepTask or a wake signal — never an external action. Whatever the Brain does next passes the action gate (§9) and Governance like any other act.

A Watch that encodes the waiting half of a Commitment ("if no reply by Thursday, escalate") references that Commitment through `watches`. The Commitment holds the obligation; the Watch holds the trigger.

A fired Watch reaches the business Agent through the Memory Interface's attention recall (Memory Interface §4). The durable worker obligations — arm generations, coverage watermarks, restart safety — are those of the [Brain Runtime companion](../brain/KIP-2.0-Brain-Runtime.md) §2 wherever `durable_brain_runtime` is advertised.

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

Typical inputs — the inputs of its `working_state_refresh` Activity, readable through the computed `derived_from` field (§7) — are open Commitments, armed Watches, contested belief slots, recent high-salience Events, and active threads. Refresh is a `working_state_refresh` Activity, normally run by maintenance.

A WorkingState is a derived recall surface (Specification §66.7): it is served with its declared basis, never presented as transaction-snapshot-consistent when it is not. It is a view of cognition, not cognition's source:

```text
WorkingState is never cited as Evidence
WorkingState never corroborates its own inputs
WorkingState answers "what is my situation"; SelfModel answers "who am I"
```

A Space SHOULD keep at most one active WorkingState per actor and canonical task/context scope, under a stable `key`; MemoryScope records that scope. Its producing Activity pins DependencyBasis and the full ProjectionBasis; consumers validate the basis and all delta pages before claiming a current situation (Specification §21.12, §57.6).

# 6. Standard Facets

## 6.1 MnemonicState

```json
{
  "memory_strength": 0.8,
  "salience": 0.9,
  "utility": 0.6,
  "last_metabolized_at": "2026-08-14T00:00:00.000Z",
  "strength_policy": {"artifact_ref": "policy:half-life-30d", "content_digest": "sha256:..."}
}
```

`memory_strength` asks how available the memory should be for future cognitive use. `salience` asks how important/noteworthy it is. `utility` asks how much future decision value the memory is expected to carry — the admission bet made when it was stored, revised as outcomes come in.

```text
memory_strength ≠ confidence
salience ≠ trust
utility ≠ truth, salience, or permission
```

`memory_strength` is the last explicitly written **base**, `last_metabolized_at` its **anchor** and `strength_policy` a pinned policy artifact (for example a half-life). The computed, read-only member `effective_strength` (Specification §18.2) is derived from them when a read is evaluated, and is `null` when any of the three is missing — unknown, never a default such as `0.5` (Specification §59.1). A read never writes it back. Idle memory therefore costs no writes.

Mnemonic metabolism MUST NOT rewrite Assertion confidence, trust, valid time, or Governance authority.

Reinforcement and utility calibration are explicit mutations. Use reaches a memory through two explicit channels only: the DecisionRecord that names it among `used_refs` (§6.4), and the exposure log where one is kept (Specification §66.8). Reading alone never does (Specification §2.13). Utility calibration follows the decision link from an outcome back to the memories the decision used, and records its attribution method; there is no other way for a consequence to reach a memory's `utility`.

Skills carry the Facet too. A Skill's expected usefulness is `MnemonicState.utility`, set as the admission bet at compilation; its graded record is the computed GradingState view (§6.2).

## 6.2 GradingState (computed)

```json
{
  "revision_ref": "R-1",
  "evaluation_ref": "EV-1",
  "success_count": 8,
  "failure_count": 2,
  "graded_count": 11,
  "last_verdict_at": "2026-08-10T00:00:00.000Z"
}
```

GradingState is a **computed, read-only view** (Specification §18.2) of the EvaluationRecord that the Skill's `current_evaluation` references, for its `current_revision`. Counts are independent attempts aggregated per metric and window, including partial, aborted and unknown outcomes under the trial's missingness policy; several observations of one attempt never add samples. It is absent until a validated evaluation exists, cannot be written, and is neither truth probability nor execution authority. Insights have no GradingState.

Its absence does not exclude a `proposed` or `trialed` Skill from recall: such a Skill is an unproven candidate. A view whose evaluation does not match the current revision, or cannot be verified, confers no validated standing (BrainRecall §16).

## 6.3 OutcomeRecord

OutcomeRecord is the immutable instrument-written index over Outcome Evidence:

```text
task_family, attempt_ref (nullable for stream-only observations)
metric, window, terminal, observation_key, observer_config_digest
outcome_status: success | partial | failure | aborted | unknown
magnitude (optional)
```

The canonical value shape is `kip-cognitive-records.schema.json#/$defs/OutcomeRecord`; its grading rules are the [Validated Learning companion](../brain/KIP-2.0-Validated-Learning.md) §3. The actual attempt and its pre-existing decision are linked by the observation Activity. A null attempt leaves the outcome ungraded, never automatically a control.

## 6.4 DecisionRecord

DecisionRecord is immutable on a terminal `action_gate` Activity:

```text
decision: act | ask | defer | silence
rationale (optional concise account)
retrieved_refs: candidates supplied to the agent
used_refs: memories actually used
applied_revisions: exact SkillRevision ids, also in Activity.inputs
basis: complete ProjectionBasis
```

Retrieval alone earns no outcome credit. Joint revisions form a treatment bundle unless the evaluation's attribution method separates them. DecisionRecord records a decision, never permission.

## 6.5 Process records and runtime state

The normative field shapes in `../schemas/kip-cognitive-records.schema.json` are also bound by the package's `value_schema` definitions:

| Facet | Attachment | Contract |
| --- | --- | --- |
| DependencyBasis | producing or dependency_validation Activity | Specification §57.6–§57.7 |
| RecordingRepair | recording_repair Activity | Specification §57.8 |
| CompressionRecord | encoding/formation Activity | §10.1 |
| RecallCoverage | explicitly recorded recall_coverage Activity | §20.2 |
| MemoryScope | captured sources and their formation products | §20.3 |
| AttemptRecord | action_attempt Activity | Validated Learning §2 |
| TrialRecord | completed trial_open Activity | Validated Learning §4 |
| EvaluationRecord | completed lifecycle_verdict Activity | Validated Learning §4 |
| ProcedureAssessment | assessment Activity | Validated Learning §5 |
| WatchState | Watch | Brain Runtime §2 |
| LeaseState | SleepTask | Brain Runtime §3 |
| RestoreReport | restore Activity | Capsule §41.7 |

DependencyBasis is immutable on the process record, not a backdoor to rewrite an Assertion's premises. All ordinary derived Recall computes `_system.dependency_validity` (Specification §57.6) before using an artifact; a missing or incomplete basis is `unverifiable`. WatchState and LeaseState are operational state validated by the runtime, not author claims that confer authority.

A semantic forgetting workflow validates an ErasurePlan (Specification §60.7); a payload-only purge is a narrower scope and cannot claim semantic forgetting.

# 7. Standard Structural Fields

Structural Fields are record topology, not semantic Propositions.

```text
experienced_by     Experience → Person
has_step           Experience → ExperienceStep (ordered)
involves           Event/Experience → relevant Person/Concept
mentions           Event/Experience/Insight → Concept
current_revision   Skill → SkillRevision (required, single)
revision_of        SkillRevision → Skill (required, single)
current_trial      Skill → trial_open Activity (single; Validated Learning §4)
current_evaluation Skill → lifecycle_verdict Activity (single; Validated Learning §4)
committed_to       Commitment → Person
owed_to            Commitment → Person
assigned_to        SleepTask/Watch → semantic Actor
watches            Watch → observed cognition
about              Profile artifact → topical Concept
```

Four lineage fields are **computed** (Specification §18.2): read-only views of Activity provenance, which is the one authority for derivation lineage (Specification §63.5). Writing them fails `ConstraintViolation`; recording the producing Activity with its inputs and outputs is what makes them appear:

```text
derived_from       artifact → inputs of the terminal Activities that produced it
compiled_from      Skill/SkillRevision → Experience inputs of its compilation Activity
compiled_by        Skill/SkillRevision → the compilation Activity itself
consolidated_to    Event/Experience → outputs of consolidation Activities that used it
```

`involves`, `mentions`, and `about` should not be used to fake stronger domain relations.

The Profile also defines three standard **semantic Predicates** (truth-sensitive; used through Proposition + Assertion + Evidence):

```text
prefers    Person → Concept                     preference among options of one kind
caused_by  ExperienceStep → ExperienceStep      effect → cause claim
same_as    Concept → Concept                    unverified identity claim
```

`prefers` declares `functional_by: "object_type"` (Specification §20.15): the object's Concept Type partitions the slot, so preferring one color scheme competes with preferring another color scheme, while a color-scheme preference and an editor preference coexist. That only works when each option is typed by its kind (§5.5): a `ColorScheme` and an `Editor`, defined by a domain package or the Space's draft vocabulary, never a catch-all type such as `Topic`, under which every preference would compete with every other. A newer preference within one kind succeeds the older one by temporal succession (Specification §25.4) — "I prefer light mode now" is one Assertion, not a retraction plus an Assertion. A relation meaning "likes several" is a different Predicate.

`same_as` feeds identity review (Maintenance §15-style workflows); it never auto-merges Concepts and never establishes `canonical_id` by itself.

`caused_by` direction is effect → cause. Step order (`has_step` edge index) alone must never be promoted into a `caused_by` claim.

Domain-specific factual predicates come from domain packages, not from this Profile. The minimal general-purpose package `kip://domains/general@1.0.0` (`profiles/general-domain-1.0.0.schema.json`) supplies people, places and organizations; a Brain that meets a relation no package names extends the Space's draft vocabulary (Specification §20.16).

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
              finds candidate consequences; TrialRecord explicitly selects a comparable baseline

attribution   outcome_observation Activity {inputs: the decision, outputs: the outcome}
              names the one decision an outcome grades; the decision's inputs name
              the Skills applied and the memories drawn on
```

The channel feeds four consumers, all under the same discipline:

```text
Skill lifecycle verdicts        §14   independent attempt aggregates vs. the immutable TrialRecord baseline
                                      (Validated Learning companion)
GradingState view               §6.2  computed from the verdict's evaluation: linked outcomes only
MnemonicState.utility           §6.1  the admission bet, vindicated or wasted, via the decision's used_refs
trust calibration               Specification §22.6
```

Discipline:

- The acting model MUST NOT write the outcomes that grade its own action; its account is `agent_statement`, citable as context only.
- An outcome that grades a decision MUST be linked to it: the instrument's `outcome_observation` Activity names the decision Activity among its `inputs` and the outcome among its `outputs`. A tally or verdict changes only through that link, aggregated by independent attempt and assigned trial/revision. Utility calibration additionally records its attribution method and uncertainty; retrieved-only inputs receive no automatic credit. An outcome with no attempt/decision link stays stream material; its absence of attribution proves neither treatment nor control. It never enters a baseline automatically.
- A decision that is to be graded MUST exist as an `action_gate` Activity with a `DecisionRecord` (§6.4) whose `inputs` name the cognition applied. Ungated actions leave nothing for an outcome to grade.
- Task family vocabulary is deployment policy; family names SHOULD be stable, namespaced, and few enough to accumulate graded history.
- A consumer verifies the origin chain of the outcomes it grades and refuses those whose origin fails its policy — the channel is auditable, not unforgeable. A deployment where the acting Principal also holds `record_outcome` is self-graded by construction and MUST be visible as such from `_system.origin`.

## 8.2 Derived artifacts

Insight, Skill, SkillRevision, SelfModel and WorkingState are **derived artifacts**: cognition compiled from other cognition rather than observed. Their types remain distinct — their fields, recall views and lifecycles differ — but they share one contract:

1. **Lineage is recorded once.** The Activity that produced a derived artifact names its sources among its `inputs` and carries a DependencyBasis (Specification §57.6). That is the only lineage record; `derived_from`, `compiled_from`, `compiled_by` and `consolidated_to` are computed from it (§7). An artifact with no producing Activity is an unsupported claim about the Brain's own history, and its dependency validity is `unverifiable`.
2. **Currentness is computed.** Every read computes `_system.dependency_validity` (Specification §57.6): a revised root makes the artifact `needs_review` at the next read, before any maintenance runs. No stored flag replaces that computation.
3. **Roots revise; artifacts do not follow automatically.** Retracting, superseding or correcting a root changes Projection and nothing else (Specification §57.5). Maintenance finds the affected artifacts through `LIST DEPENDENTS` (Specification §63.5), queues a `review_derived` SleepTask, and resolves each by review: revalidate (a `dependency_validation` Activity), replace through a new artifact with its own lineage, or take an ordinary lifecycle action.
4. **Layers are not corroboration.** However many transformations separate an artifact from its Evidence, its support is the root set (§8); consumers count roots, not layers.
5. **Only consequences promote.** Skill is the one derived artifact graded by the consequence channel (§8.1, §14). Insight and SelfModel are believed through their Evidence roots and reviewed on schedule (§18); no outcome tally exists for them, so nothing promotes them.

# 9. Activities

Recommended Activity classes:

```text
experience_formation      semantic_consolidation    procedural_consolidation
reflection                skill_compilation         skill_validation
self_model_refresh        mnemonic_metabolism       commitment_review
watch_fire                action_gate               action_attempt
derivation_review         dependency_validation     working_state_refresh
outcome_observation       trial_open                lifecycle_verdict
encoding_review           recall_coverage           identity_repair
erasure_review            recording_repair
```

Activity records provenance; Activity is not Transaction.

An `action_gate` Activity is the decision record: it records the decision a state change was put through before anything outward happened. Its `DecisionRecord` Facet (§6.4) holds the outcome — `act`, `ask`, `defer`, or `silence` — its `inputs` name the cognition applied (the trigger, the Skills, the memories the briefing drew on), and its `associated_actors` name who decided. Recording `defer` and `silence` is what makes restraint accountable: "why didn't you tell me" is answered from the same provenance as "why did you". The gate threshold — which changes get an evaluation at all — is Brain policy; low-value noise needs no gate record, but an action that is to be graded by the consequence channel does.

An `outcome_observation` Activity is the ingesting instrument's record of writing Outcome Evidence and of what it grades — inputs: the `action_gate` Activity of the decision observed; outputs: the Outcome Evidence. The input is REQUIRED when the outcome is to count toward any Skill, tally, or calibration; an observation with no decision input records a consequence in the stream only. Its associated actor is the instrumentation's semantic Concept; its authenticated Principal is recorded in engine origin, never in a Concept-reference slot. It does not impersonate the actor being graded, and writing it requires `record_outcome` (Specification §29.8).

A `lifecycle_verdict` Activity records one deterministic evaluation of the consequence stream: its immutable EvaluationRecord names the exact revisions, the trial, the selected independent attempts and outcomes, and a retained replay artifact; the Skill's `current_evaluation` points to it. An author-created Activity with that class name alone cannot promote a Skill. The contract is the [Validated Learning companion](../brain/KIP-2.0-Validated-Learning.md).

# 10. Event Formation

An Event SHOULD be compact: time, participants, summary, outcome, context, Evidence refs. Routine acknowledgements may produce no Event.

## 10.1 Encoding records

Formation records what it admitted, deferred or rejected and why, within configured privacy and retention budgets. Source Evidence MAY have a short retention window while semantic records have a longer one. Material whose entity or Schema cannot be resolved MAY stay Evidence-only — or be modeled through the draft vocabulary (Specification §20.16) — rather than being forced into a guessed type or discarded as valueless.

Where loss matters, the formation Activity carries a **CompressionRecord**: source refs, extractor and Schema versions, preserved fields, known omissions and re-encoding eligibility. A digest cannot recover omitted bytes. A payload purge MUST consider outstanding re-encoding and review needs under retention policy, and never claims that lossy encoding preserved all future-useful information.

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
→ proposed Skill + immutable SkillRevision (with task_family)
→ trial (§14)
```

One successful Experience normally does not establish general procedural reliability.

Consolidation MUST attach the `task_family` to the immutable revision at proposal time and MUST refuse to emit a Skill without one: a pattern that names no stream that could grade it has no way to be wrong, and belongs in an Insight, not in procedural memory.

# 14. Skill Lifecycle

```text
proposed   compiled, current revision carries its task_family; ungraded
trialed    the outcome stream is grading it against a recorded baseline
adopted    promoted by verdict; provisional — the stream keeps grading
revoked    demoted by verdict, counterexample, or policy; the record survives
```

Allowed transitions:

```text
proposed → trialed    trial opens; requires task_family; selects the trial through current_trial
trialed  → adopted    comparative verdict over independent attempts vs. the immutable baseline
trialed  → revoked    verdict, counterexample, or policy
proposed → revoked    withdrawn before trial
adopted  → trialed    degradation verdict; re-trial, not amnesty
adopted  → revoked    verdict; one high-severity matching-condition failure MAY suffice
revoked  → trialed    re-entry starts a new trial; nothing resurrects silently
```

Every transition except withdrawal (`proposed → revoked`) is executed by the [Validated Learning companion](../brain/KIP-2.0-Validated-Learning.md): a `lifecycle_verdict` Activity with a validated EvaluationRecord and one guarded update, in one transaction. Only `trialed → adopted` is promotion; `proposed → adopted` and `revoked → adopted` are invalid. A Brain that does not implement that companion keeps its Skills `proposed` — unproven candidates, fully recallable — and MAY withdraw them.

Recall reports **standing**, a view of the lifecycle:

```text
proposed, trialed                                  unproven
adopted with a matching, verifiable evaluation     validated
adopted without one                                unverifiable
revoked                                            revoked
```

Rules that bind every Brain, with or without the companion:

1. **Deterministic transitions.** Promotion and demotion are executed by deterministic code reading graded Outcome Evidence — never by author assertion, decay, or the acting model's judgment. The Brain proposes, compiles and narrates; it never promotes.
2. **Revocation is never harder than adoption.** The demotion bar MUST NOT exceed the promotion bar. A lifecycle that can only acquire cannot tell a habit from a superstition.
3. **Adoption is provisional.** An adopted Skill stays subscribed to its stream; a deployment SHOULD define a re-verdict trigger — an outcome count, a time window, or a Watch on the family.
4. **Grading vocabulary.** Distinguish success under matching conditions, failure under matching conditions, failure under non-matching conditions, and unknown outcome. Matching-condition failure lowers utility, adds failure modes and counterexamples, narrows applicability, or demotes; non-matching failure narrows applicability without penalizing the procedure.
5. **Dependency validity is orthogonal.** A Skill whose provenance root was revised is `needs_review` (Specification §57.6) regardless of standing, and that review may open a re-trial.
6. **Attribution before counting.** An outcome that merely shares the `task_family` MUST NOT change a Skill's standing or its GradingState view; two Skills in one family are graded by their own decisions, not by each other's.

No lifecycle state grants execution authority. Adoption is standing, not permission.

# 15. Preference Consolidation

Distinguish one stated preference, repeated behavior, context-specific preference, stable cross-context pattern, counterexample, and explicit correction.

Explicit statements remain Evidence + Assertions. A summary of a stable pattern is an Insight (§5.5), never replacement history.

A changed preference is a new `prefers` Assertion from the time it changed, carrying `at` (the time of the statement) so that its start key is when the person said it, not when the Brain wrote it (Specification §13.2); temporal succession (Specification §25.4) ends the old one within its kind, and the old preference still answers for its time. A task-only preference ("use tabs in this repository") is scoped to that task's context and prevails there under `kip:memory-default` (Specification §21.13) without replacing the general one.

# 16. Self-Model Formation

SelfModel evolution SHOULD be conservative. Prefer multiple observations, explicit statements/corrections, high-salience Experience, validated capability changes, and repeated behavior. Avoid single incidental wording, speculative personality diagnosis, hidden internals, or authority claims.

# 17. Commitment Semantics

A due time passing does not necessarily transition status until policy/Evidence does so. A Commitment may remain highly salient even without recent recall. Disuse alone is not justification to weaken its importance.

The waiting half of a Commitment — escalate if nothing happens — is a Watch (§5.11) referencing the Commitment through `watches`. The due date stays on the Commitment; the trigger stays on the Watch. A Commitment with no Watch is raised to attention by Maintenance's `commitment_review` Activity, whose inputs name the Commitments it found due (§5.7); the review is the commit whose `space_seq` orders the attention item.

# 18. Mnemonic Metabolism

Typical legal changes:

```text
memory_strength base ↑/↓ with a new anchor (reinforcement, explicit weakening)
salience adjustment
utility calibration
archive eligibility
review scheduling
```

Decay is computed, not written: `effective_strength` (§6.1) falls with time under the pinned `strength_policy`, with no sweep, no Change Envelope and no invalidation. Maintenance writes a new base only when it has an explicit signal — a DecisionRecord's `used_refs`, an exposure-log batch (Specification §66.8), a correction — and then writes base and anchor together (Specification §59.1). A missing base, anchor or policy leaves strength unknown; it is never filled with a default.

Generic time-based decay MUST NOT mutate Assertion confidence.

```text
new epistemic evidence → new Assertion (succession for a change, supersession for a correction)
staleness → Projection freshness/validity
forgetting → effective strength, then archive / tombstone / purge
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

## 20.1 Views

The Profile supports:

```text
Episodic Recall   = Event + selected Evidence
Experience Recall = Experience + ordered Steps + Outcome
Procedural Recall = Skill + applicability + standing (§14) + utility + positive/negative Experience
Action Briefing   = accepted knowledge + contested assumptions + Skills + successes + failures + Commitments + constraints + warnings
Wake Briefing     = WorkingState + CHANGES AFTER its basis_seq + fired attention
```

Recall uses `kip:memory-default` (Specification §21.13) unless a request or deployment names another policy. The consuming Agent remains final action authority unless separate Governance grants otherwise.

## 20.2 Recall coverage and plans

Recall independently queries explicit constraints and Commitments, dependency warnings, failures and counterexamples, positive Experiences, Skills and semantic Evidence. The briefing's **RecallCoverage** declares which channels completed, their basis, truncation and unverified preconditions, and records a **RecallPlan** per channel: a digest-pinned selector, canonical scope, method, snapshot/index/coverage watermarks, authorization view, completion and truncation reason.

- The host determines the required channels from the task and a versioned policy; a model cannot omit constraints to qualify its own action. Constraints, Commitments and prerequisite validity use exact authorized selectors.
- Approximate Experience or semantic retrieval — including a Search Pattern (Specification §43.8) — MAY complete its declared bounded plan; that never asserts semantic exhaustiveness. Approximate selection and unresolved source interpretation are reported separately. An index watermark alone does not establish source processing or constraint coverage.
- Required constraints and applicable critical warnings MUST NOT be dropped to make room for a higher-scoring Skill. Budget exhaustion returns incomplete coverage and prevents unsupported automatic action.
- `action_eligible` requires complete mandatory exact channels, satisfied source barriers and necessary preconditions at a coherent current basis. Noncritical optional retrieval MAY stay partial and still help deliberation, but a channel that cannot be served is incomplete, never `not_applicable`. Complete means the authorized recorded universe was covered, not that every relevant memory in the world was found; privileged global closure is a separate check (Specification §63.5).
- Proposed and trialed Skills remain recall candidates labeled unproven. Displayed grades bind `current_revision` and a validated EvaluationRecord; missing or mismatched evidence cannot confer validated standing or execution authority.

Recall is read-only. Retrieval telemetry is recorded explicitly, in the exposure log or a recorded `recall_coverage` Activity, and never itself reinforces confidence, strength or utility.

## 20.3 Memory scope

`MemoryScope` on captured sources and their formation products records the canonical `task_ref` and `context_refs` the host mapped. Applicable `Assertion.context_refs` and `DependencyBasis.policy_basis` agree with it. Scope follows extraction and consolidation into Evidence, Event, Experience, Commitment and derived summaries, not only Assertions. A shared truth-neutral Proposition has no task owner: its eligibility in a scope comes from each Assertion, and MemoryScope MUST NOT split canonical Proposition identity. Combining scopes never widens eligibility; a cross-task generalization is a new, explicitly attributed derived artifact, subject to policy and source restrictions. WorkingState keys include the actor and the canonical task/context scope. Semantic scope is not ownership or an authorization grant; MemorySpace and current Governance still apply.

# 21. Portability

A Cognitive Capsule carrying Profile cognition SHOULD preserve exact Profile Package refs, types, Facets, Structural References, Evidence/provenance closure, source identity, and exportable retention state.

Destination import MUST NOT automatically transfer source self identity, source trust, Skill authority, tool permission, or Governance policy. Remote autobiographical memory remains remote autobiography under ordinary merge import.

Imported SkillRevisions keep behavior and provenance but receive no local standing or trial assignment. Source replay artifacts may remain readable, never local grades.

A source's Watches and WorkingState are that Brain's attention and situation: under ordinary merge import they arrive disarmed and non-current. A destination re-arms its own attention and rebuilds its own working picture.

Lifecycle standing does not transfer either: an imported Skill enters `proposed` with no `current_trial` or `current_evaluation`, whatever its source status said. Its capsule may carry the source's outcome history as evidence worth reading — it is not local grading, it arrives with the destination's origin rather than the instrument's, and it never counts toward a local verdict.

# 22. Conformance Expectations

Profile conformance tests Experience/Step structural validity, failed Experience preservation, MnemonicState mutability and computed effective strength, confidence/memory-strength separation, the read-only GradingState view and computed lineage fields, Skill authority non-amplification, Capsule portability, SelfModel non-authority, Commitment lifecycle, Watch non-authority, dependency validity before recall, WorkingState non-evidence, DecisionRecord non-authority, formation atomicity, procedural provenance, preference succession within a kind and option typing by kind, outcome origin separation (self-report never grades), outcome attribution (an outcome without a decision link never changes standing, and a family-mate's outcome never grades another Skill), task-family required for trial entry, and lifecycle non-transfer on import. The Validated Learning and Brain Runtime companions carry their own acceptance sections.

# 23. Profile Invariants

The Profile's 49 invariants are Part B of the shared registry [KIP-2.0-Invariants.md](../KIP-2.0-Invariants.md), numbered `P1`–`P49`; each row names the Profile section that establishes it and the conformance vectors that pin it. Part A of the same registry is the Specification's §102 list, which every runtime the Profile runs on must already preserve.


# 24. Minimal Profile Primer

```text
Cognitive Memory Profile 2.0

Event: compact record of what happened
Experience: goal-directed state/action/observation trajectory
ExperienceStep: ordered observable step; no hidden chain-of-thought
caused_by: explicit effect→cause claim between steps; edge order alone is not causality
prefers: preference among options of one kind; a newer one succeeds the older within its kind
Insight: declarative lesson derived from memory
Skill: stable identity with current_revision; SkillRevision: immutable behavior/task_family/digest
Skill standing: unproven | validated | unverifiable | revoked; never authority
Commitment: prospective memory
Watch: armed attention — a delta or a silence worth waking for; firing grants nothing
SelfModel: derived cognition about self; not Governance
WorkingState: what matters now, stamped with its basis_seq; never Evidence
MnemonicState: memory_strength base + anchor + policy → computed effective_strength; salience; utility
GradingState: computed view of the current evaluation; never written
DecisionRecord: act|ask|defer|silence on an action_gate Activity; retrieved vs used vs applied; not authorization
OutcomeRecord: task_family + outcome_status on Outcome Evidence; written by instruments, never the actor it grades
derived_from / compiled_from / consolidated_to: computed from Activity provenance
dependency validity: computed at every read; needs_review is not retracted

Truth-sensitive claims use Proposition + Assertion + Evidence.
A world change is one new Assertion; a correction supersedes; a misrecording is repaired.
Transformations preserve Activity provenance.
```

# 25. Final Principle

> **A Cognitive Memory Profile should make the past structurally reusable without confusing memory accessibility, epistemic belief, autobiographical identity, or procedural usefulness with authority.**
