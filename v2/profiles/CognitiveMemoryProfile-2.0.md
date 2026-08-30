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
SkillUtility
DerivationState
```

> **Core defines cognitive truth, provenance, authority, and durability semantics; the Profile defines portable memory forms.**

The Profile does not mandate one formation, ranking, consolidation, or forgetting algorithm.

# 1. Goals

The Profile SHOULD support portable episodic memory, goal-directed experience, procedural memory, prospective memory, attention state, preference patterns, self-reflective lessons, self-model artifacts, working state, mnemonic accessibility, procedural utility, and maintenance tasks.

It SHOULD make the following questions answerable:

```text
What happened?
What did the actor go through?
What did the actor learn?
What tends to work?
What failed?
What is still pending?
What change — or what silence — deserves attention?
What is the current working picture?
What should be easier to recall?
What changed in the self-model?
```

# 2. Non-Goals

The Profile does not define a theory of human memory, hidden chain-of-thought, a universal ontology, one embedding/ranking model, one sleep schedule, one salience algorithm, one Skill compiler, tool permission, Governance authority, or source trust policy.

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
conditions
```

Suggested lifecycle:

```text
pending | fulfilled | cancelled | expired | blocked
```

A Commitment is cognition, not automatic external execution.

## 5.8 Skill

**A Skill is reusable procedural cognition compiled from Experience, Evidence, or validated instruction.**

Recommended fields:

```text
skill_class
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
last_validated_at
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

Suggested cognitive lifecycle:

```text
candidate → validated → needs_review → deprecated/archived
```

**Validated Skill ≠ executable authority.** Authority remains Governance state. Imported Skills remain candidate/inactive until local review and policy elevation.

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

`condition` declares what counts as a matching change: the observed element or slot, the kind of transition, thresholds. The Profile does not fix a condition language; a deployment may use structured filters over Change Envelopes or plain text that a maintenance process interprets.

Evaluation is a differential loop: the runtime or Brain compares committed Change Envelopes (Specification §36) against the armed Watch set; a silence Watch fires when `due_at` passes without a match. Firing is recorded as a `watch_fire` Activity — inputs: the Watch and, where representable, the changed element or observation Evidence; outputs: the SleepTask or notification artifact it produced — and the Watch transitions through ordinary UPDATE.

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

Utility calibration is explicit mutation like any other reinforcement: a recall that used the memory, or an outcome that vindicated or wasted the bet, may adjust `utility` through Formation/Maintenance writes. Reading alone never does (Specification §2.13).

## 6.2 SkillUtility

```json
{
  "utility": 0.72,
  "success_count": 8,
  "failure_count": 2,
  "last_validated_at": "2026-08-10T00:00:00Z"
}
```

Utility is procedural usefulness on a `[0,1]` scale, not probability and not authority.

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

# 7. Standard Structural Fields and Predicates

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
```

Activity records provenance; Activity is not Transaction.

An `action_gate` Activity records the decision a state change was put through before anything outward happened. Its outcomes:

```text
act       acted without asking — authorized, reversible, worth it
ask       escalated to a person
defer     scheduled for later attention
silence   deliberately did nothing
```

Recording `defer` and `silence` is what makes restraint accountable: "why didn't you tell me" is answered from the same provenance as "why did you". The gate threshold — which changes get an evaluation at all — is Brain policy; low-value noise needs no gate record.

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
→ candidate Skill
→ validation
→ SkillUtility
```

One successful Experience normally does not establish general procedural reliability.

# 14. Skill Validation

Distinguish:

```text
success under matching conditions
failure under matching conditions
failure under non-matching conditions
unknown outcome
```

Matching-condition failure may reduce utility, add failure modes/counterexamples, narrow applicability, or mark the Skill `needs_review`.

No validation state transition grants execution authority automatically.

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
SkillUtility updates
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
Procedural Recall = Skill + applicability + utility + positive/negative Experience
Action Briefing   = accepted knowledge + contested assumptions + Skills + successes + failures + Commitments + constraints + warnings
Wake Briefing     = WorkingState + CHANGES AFTER its basis_seq
```

The consuming Agent remains final action authority unless separate Governance grants otherwise.

# 21. Portability

A Cognitive Capsule carrying Profile cognition SHOULD preserve exact Profile Package refs, types, Facets, Structural References, Evidence/provenance closure, source identity, and exportable retention state.

Destination import MUST NOT automatically transfer source self identity, source trust, Skill authority, tool permission, or Governance policy. Remote autobiographical memory remains remote autobiography under ordinary merge import.

A source's Watches and WorkingState are that Brain's attention and situation: under ordinary merge import they arrive disarmed and non-current. A destination re-arms its own attention and rebuilds its own working picture.

# 22. Conformance Expectations

Profile conformance SHOULD test Experience/Step structural validity, failed Experience preservation, MnemonicState mutability, confidence/memory-strength separation, SkillUtility mutability, Skill authority non-amplification, Capsule portability, SelfModel non-authority, Commitment lifecycle, Watch non-authority, DerivationState/epistemic separation, WorkingState non-evidence, formation atomicity, and procedural provenance.

# 23. Profile Invariants

1. Experience and Skill are Profile concepts, not Core kinds.
2. Structural References do not automatically become Propositions.
3. `memory_strength` is not Assertion confidence.
4. `salience` is not source trust.
5. `utility` is not execution authority.
6. Person is not Principal.
7. SelfModel is not Governance.
8. SleepTask assignment is not permission.
9. Failed Experiences are valid memory.
10. One success does not prove a general Skill.
11. Derived summaries do not create independent Evidence roots.
12. Event and Experience are not interchangeable.
13. Temporal order does not imply causality.
14. Hidden chain-of-thought is not required.
15. Explicit correction preserves history.
16. Imported Skill remains non-authoritative by default.
17. Commitment expiry and retention expiry are distinct.
18. Read frequency is not a required mnemonic signal.
19. Profile Facets cannot override Core fields.
20. Brain algorithms remain outside Profile conformance.
21. A fired Watch grants nothing; it creates attention, not action.
22. Deliberate silence at the action gate is a recordable outcome.
23. DerivationState is review state; stale is not retracted.
24. WorkingState is a derived view; it is never Evidence and never corroborates its inputs.
25. utility is the admission bet, revised by outcomes; it is not truth, salience, or permission.

# 24. Minimal Profile Primer

```text
Cognitive Memory Profile 2.0

Event: compact record of what happened
Experience: goal-directed state/action/observation trajectory
ExperienceStep: ordered observable step; no hidden chain-of-thought
caused_by: explicit effect→cause claim between steps; edge order alone is not causality
Insight: declarative lesson derived from memory
Skill: reusable procedure; content does not grant execution authority
Commitment: prospective memory
Watch: armed attention — a delta or a silence worth waking for; firing grants nothing
SelfModel: derived cognition about self; not Governance
WorkingState: what matters now, stamped with its basis_seq; never Evidence
MnemonicState: memory_strength + salience + utility; not confidence
SkillUtility: procedural usefulness; not authority
DerivationState: basis_seq + current|stale|under_review; review state, not belief

Truth-sensitive claims use Proposition + Assertion + Evidence.
Transformations preserve Activity provenance.
```

# 25. Final Principle

> **A Cognitive Memory Profile should make the past structurally reusable without confusing memory accessibility, epistemic belief, autobiographical identity, or procedural usefulness with authority.**
