# KIP 2.0 — Shared Language

**[English](./CONTEXT.md) | [中文](./CONTEXT_CN.md)**

This glossary describes the current KIP 2.0 draft. The [Specification](./SPECIFICATION.md), [Cognitive Memory Profile](./profiles/CognitiveMemoryProfile-2.0.md), [Memory Interface](./KIP-2.0-Memory-Interface.md) and the `brain/` companions ([Validated Learning](./brain/KIP-2.0-Validated-Learning.md), [Brain Runtime](./brain/KIP-2.0-Brain-Runtime.md)) define the contracts. Historical terminology is retained in [v1/](./v1/README.md).

## Core state and trust

**Concept**: A semantic entity in a MemorySpace. Types and fields come from versioned Schema Packages.

**Proposition**: A truth-neutral semantic statement. Its existence alone establishes neither truth nor acceptance.

**Assertion**: An actor's stance toward a Proposition, with mode, confidence, valid time and supporting Evidence. Assertions can compete without overwriting the historical record.

**Evidence / Activity**: Evidence records observations; Activity records how cognitive artifacts were generated or changed. Repeated derivation from one source does not create independent corroboration. Outcome Evidence comes from instrumentation or review; an actor's own account remains an `agent_statement`.

**Belief / Epistemic Projection**: The accepted view computed over eligible Assertions, conflicts, evidence and dependencies at a query's scope and time. Belief is not a mutable truth flag on a Proposition. A cached projection needs a validated computation basis.

**kip:memory-default**: The standard deterministic policy for memory recall: the structural baseline plus three precedence rules, in order — a more specific task context prevails; a person's own statement about themselves prevails over hearsay, never over an observation; and among what remains, the value most recently claimed to hold prevails (recency compares when a value was claimed to hold, never when the Brain recorded it). An outranked value is `uncertain`, not `rejected`.

**Temporal succession**: An open-ended Assertion states no end; a later-starting Assertion by the same actor, in the same context and slot, ends it at its own start — when both are the actor's own account (stated or observed) or write their start. Two inferences never succeed one another. A world change is therefore one new Assertion, the old value still answers for its time, and nobody is recorded as having been wrong. Supersession is only for corrections.

**Time bound**: An instant known only within a range, written `{earliest, latest}`. A projection inside the range is `uncertain`; no instant is invented. A claim with no stated start is read as `{latest: asserted_at}` — it began no later than it was made — and `asserted_at` is when the actor made the claim, not when the Brain recorded it.

**Governance**: The protected authority controlling access and permitted operations. Evidence, confidence, imported signatures, memory usefulness and a fired Watch never grant authority.

## Experience and memory

**Event**: A time-bounded occurrence recording what happened. It may supply evidence for an Experience without itself encoding a goal-directed trajectory.

**Experience / ExperienceStep**: A subject's goal-directed trajectory and its ordered observation, decision, action and feedback records. Step order is structural; a `caused_by` claim is a semantic Proposition plus Assertion supported by Evidence. Earlier does not imply causal.

**Memory**: Past state participating in future retrieval, prediction, decisions or actions. Storage alone does not establish useful memory.

**Knowledge / Insight**: Knowledge names durable regularities warranted by evidence rather than a universal Core kind. Insight is a declarative lesson derived from experience or evidence. An Insight is not an executable Skill or a verified learning result.

**Action Briefing**: Recall organized around a future action: relevant goals, constraints, evidence, analogous Experiences, Skills, risks and commitments. Retrieval alone does not establish that a Skill was used.

**Confidence**: Epistemic support carried by an Assertion. Changes should reflect evidence and reasoning, independently of recall frequency.

**MnemonicState**: A Profile Facet separating `memory_strength` (future accessibility), `salience` (importance/noteworthiness), and `utility` (expected decision value). These are not truth probabilities or permissions. Decay is computed: `memory_strength` is the last written base, and the read-only `effective_strength` falls under a pinned policy; reinforcement is an explicit write from a recorded use.

**Exposure log**: An optional append-only record of what a read surfaced or a decision used. It is not cognitive state; Maintenance folds it into explicit reinforcement.

## Procedures and learning

**Skill / SkillRevision**: Skill is the stable procedural identity. SkillRevision freezes its behavior, task family, applicability, procedure, success criteria and recovery under a behavior digest. Decisions, trials, grading and procedural authority refer to the exact revision.

**Attempt**: One application under recorded conditions, assigned to a trial before its outcome is observed. Multiple observations of an attempt do not create additional independent attempts.

**DecisionRecord**: The immutable record distinguishing what was retrieved from what actually influenced a decision, including the exact Skill revision and its attempt linkage.

**TrialRecord / EvaluationRecord**: The immutable comparison basis and replayable verdict retaining exact rules, inputs and artifacts (Validated Learning companion). Sharing a task family selects candidates; it does not establish attribution or baseline membership. A Skill's `current_trial` and `current_evaluation` point to them; GradingState is a computed view, never written.

**Skill lifecycle**: `proposed → trialed → adopted → revoked`, governed by validated evaluations and authorized policy. Only comparative evidence promotes trialed behavior; imported Skills begin unproven. Descriptive feedback alone is not verified improvement.

**Dependency validity**: Derived cognition retains its provenance and computation basis. The engine computes `_system.dependency_validity` (`current | needs_review | unverifiable`) at every read, so a changed root is visible before any review runs; no stored flag replaces it. Lineage fields such as `derived_from` are computed from the producing Activity.

**Draft vocabulary**: A Space-local package extended with `DEFINE` when a Brain meets a relation no installed package names. It only adds, commits alone, and confers no Schema authority; an owner promotes symbols into a real package.

## Interfaces and durable work

**Memory Interface**: The business Agent's five intents: observe, recall, revise, feedback and forget. Its levels are `memory_basic`, `memory_experience` and `memory_learning`; durable workers and Capsule exchange are capabilities beside them. `recall` with mode `attention` delivers fired Watches and due Commitments, each raised by a commit; `revise` distinguishes correction, world change and misrecording. A Brain Adapter interprets them through existing KIP state operations. This optional interface neither adds a Core kind nor requires another LLM.

**Processing receipt**: Tracks intake from durable recording through processing disposition to recall availability. An `after` barrier accounts for specified inputs; a fresh Space snapshot alone does not prove processing completion. It is distinct from a transaction receipt.

**Watch / WorkingState**: Watch is durable attention state evaluated against changes or a silence deadline. Firing creates attention, not permission to act. WorkingState summarizes resumable cognition with its `basis_seq` so a Brain can resume from validated state plus a delta.

**Cognitive Capsule**: A portable state artifact with declared dependencies and integrity. A signature proves origin and integrity, never truth or destination authority. Import is a destination-governed transaction.

**Protocol, reliability and learning evidence**: Language tests, contract models, engine conformance, fault/replay tests and behavioral evaluations answer different questions. Passing structural checks does not prove that a real Brain learned; see [Brain Evaluation](./brain/BrainEvaluation.md).
