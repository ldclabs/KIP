# KIP Experience Learning

> **Historical archive.** Frozen at the repository layout migration; see the [v1 archive notice](./README.md). Current KIP 2.0 documentation is at the repository root.

KIP defines how an intelligent agent turns situated interaction into durable, actionable cognition while keeping the protocol substrate independent of any one memory profile.

## Language

**Event**:
An objective, time-bounded occurrence: what happened in the world or interaction history. An Event may provide evidence for an Experience, but does not by itself encode a goal-directed trajectory.
_Avoid_: Experience, trajectory

**Experience**:
A subject-relative, goal-directed trajectory through state, decision, action, observation, feedback, and outcome. An Experience is composed of ordered ExperienceSteps and preserves where expectation and reality diverged.
_Avoid_: Event, transcript, process summary

**ExperienceStep**:
One ordered transition record within an Experience, classified as an observation, decision, action, or feedback. Its index expresses temporal order; causality requires a separate `caused_by` assertion.
_Avoid_: Event, log line

**Memory**:
The mechanism by which past state can condition future computation, retrieval, prediction, or action. Stored information that cannot influence a future situation is an archive, not functional memory.
_Avoid_: Storage, archive

**Knowledge**:
A durable, decontextualized regularity compressed from evidence or experience. It is a functional role realized by domain concepts, not a universal entity type.
_Avoid_: Experience, raw evidence

**Insight**:
A concise, self-reflective lesson extracted from one or more Events or Experiences. It is declarative and actionable, but is not itself an executable policy.
_Avoid_: Skill, fact

**Skill**:
An action-selecting policy compiled from experience and evidence, including the conditions under which it applies and how success or failure is recognized. A Skill may remain advisory or point to an executable implementation.
_Avoid_: Insight, runbook, instruction text

**Action Briefing**:
A recall result that prepares a future action by combining relevant goals, constraints, knowledge, prior Experiences, applicable Skills, risks, and commitments.
_Avoid_: Search result, memory dump

**Confidence**:
Epistemic support for an assertion: how strongly the available evidence warrants believing it.
_Avoid_: Memory strength, retrieval score

**Memory strength**:
The current availability and retention priority of a memory, represented by `metadata.memory_strength`. Reinforcement and decay may change memory strength without changing whether the assertion is true.
_Avoid_: Confidence, salience

**Salience**:
The encoding and consolidation priority of an Event or Experience, influenced by goal relevance, novelty, prediction error, outcome magnitude, emotion, and reusability.
_Avoid_: Confidence, memory strength

**SkillRevision**:
The immutable behavior of a stable Skill: task family, procedure, applicability,
preconditions, success criteria and recovery, bound by a behavior digest. Decisions,
trials, grades and procedural authority refer to a revision, never just a mutable Skill ID.
_Avoid_: Current summary, display revision

**Attempt**:
One actual application of a decision under recorded conditions, enrolled into a trial
before its outcome is observed. Multiple observations of one attempt are not multiple trials.
_Avoid_: Outcome, observation, retry

**TrialRecord / EvaluationRecord**:
Immutable comparison basis and immutable verdict with retained rule, parameter and
input artifacts. TrialState and GradingState are current caches of these records.
_Avoid_: Mutable counters as historical evidence

**Memory Interface**:
The business Agent's five memory intents (observe, recall, revise, feedback, forget)
at the Agent-to-Brain seam. A Brain Adapter executes them through the existing KIP
state Interface; no new Core kind or command language is implied.
_Avoid_: Raw KIP command, a mandatory second LLM

**Processing receipt**:
An intake identity whose progress distinguishes durable recording, completed
processing disposition and availability to recall. An after barrier requires the
specified inputs to be accounted for; a fresh Space snapshot alone is insufficient.
_Avoid_: Transaction Receipt, proof of belief, permanent freshness
