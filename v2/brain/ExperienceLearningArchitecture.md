# Experience Learning Architecture for a KIP 2.0 Brain

**[English](./ExperienceLearningArchitecture.md) | [中文](./ExperienceLearningArchitecture_CN.md)**

## Status

**Reference Cognitive Architecture / Brain-Layer Design**

This document defines how a Brain can use KIP 2.0 and Cognitive Memory Profile 2.0 to learn from experience. It is not a KIP Core requirement. Normative protocol semantics come from `KIP-2.0-SPECIFICATION.md`.

# 0. Central Thesis

```text
Knowledge  = compressed reusable regularity
Event      = what happened
Experience = the path traversed while pursuing a goal
Skill      = experience compiled into reusable policy
Memory     = how past state conditions future computation
Learning   = durable context-appropriate behavior change caused by prior cognition
```

> **Knowledge is the compression of experience; Skill is the compilation of experience; Memory is the mechanism that lets experience continue to shape the future.**

# 1. Layer Boundary

```text
KIP 2.0                     cognitive primitives, history, Governance, transactions
Cognitive Memory Profile    Event / Experience / Skill / mnemonic structures
Experience Learning         learning loop
Formation/Recall/Maintenance concrete Brain policy
```

The protocol provides signals; the Brain owns cognitive policy.

# 2. What Learning Is Not

A write, embedding, retrieval, summary, confidence update, or Skill object creation is not by itself proof of learning.

Strong functional test:

```text
future behavior with relevant memory
    >
future behavior after relevant-memory ablation
```

If deleting an item can never change relevant prediction/decision/action, it behaves as archive rather than functional memory.

# 3. Learning Loop

```text
Environment / Human / Tool
          ↓
      Observation
          ↓
       Evidence
          ├────────→ Proposition → Assertion → Epistemic Projection
          ↓
     Event / Experience
          ├────────→ Semantic Consolidation → reusable Assertion / Insight
          ├────────→ Reflection → SelfModel
          └────────→ Procedural Consolidation → Skill
                                             ↓
                                        Action Recall
                                             ↓
                                      Future Decision
                                             ↓
                                      External Action
                                             ↓
                                      Outcome Evidence
                                             └────↺
```

External action is outside KIP rollback. Intent and outcome are recorded around the external effect as separate cognitive transactions.

# 4. Experience as Trajectory

```text
E = (g, b0, a0, o1, b1, a1, o2, ..., y, δ)
```

`g` goal, `b` compact state/belief context, `a` action, `o` observation, `y` outcome, `δ` feedback/surprise/prediction error.

Store only useful, observable, permitted process information. Hidden chain-of-thought is unnecessary.

# 5. Event vs Experience

| | Event | Experience |
|---|---|---|
| Question | What happened? | What path was traversed? |
| Size | compact | multi-step |
| Actions | optional | first-class |
| Observations | optional | first-class |
| Failure/recovery | summary | structurally important |
| Main use | episodic recall | transfer/learning |
| Consolidation | semantic | semantic + procedural |

Formation should create Experience selectively.

# 6. Formation Threshold

Favor Experience when there is multi-step goal pursuit, meaningful failure/recovery, prediction error, strategy revision, human corrective feedback, unusual tool result, costly/high-impact outcome, reusable sequence, or a counterexample to an existing Skill.

Routine repetition with no new signal may not deserve a new Experience. Transaction retry is not repeated Experience.

# 7. Evidence First

Observed input should enter as Evidence before truth-sensitive belief:

```text
user message
→ Evidence(user_statement)
→ Proposition(Alice, prefers, DarkMode)
→ Assertion(asserted_by=Alice, mode=stated)
```

This separates authentication, semantic attribution, proposition meaning, and later accepted belief.

# 8. Prediction Error

```text
expected observation ≠ actual observation
```

is a strong learning signal. It can reveal invalid assumptions, missing preconditions, hidden state, environment changes, incorrect Skill applicability, or knowledge gaps.

Surprise is not truth confidence.

# 9. Belief Revision

```text
old Assertion
+ new Evidence
→ new Assertion
+ optional supersession
+ belief_revision Activity
```

Do not rewrite the old Assertion's confidence, rewrite Proposition tuple, or delete prior Evidence. Third-party disagreement is normally contradiction, not supersession.

# 10. Semantic Consolidation

Question: **What reusable declarative regularity should the Brain now treat as supported?**

```text
Experiences/Evidence
→ candidate Proposition
→ derived Assertion
→ semantic_consolidation Activity
→ Epistemic Projection
```

Derived cognition cannot manufacture independent corroboration from multiple summaries of one root.

# 11. Procedural Consolidation

Question: **Given similar contexts, what action policy appears to work?**

```text
successful Experiences
+ failed Experiences
+ counterexamples
→ contrast
→ conditions/procedure/failure modes
→ candidate Skill
→ validation
```

Contrast is essential to avoid over-broad procedure learning.

# 12. Contrastive Learning

Compare success vs failure, same goal with different initial state, same action with different observation, same condition under different tool/environment, and same Skill with different outcome. Seek discriminating conditions rather than popularity.

# 13. Failure Is First-Class

Failed Experience may teach negative preconditions, diagnostic branches, recovery strategies, invalid assumptions, counterexamples, unsafe actions, and tool limitations. Some failures have greater learning value than routine successes.

# 14. Four Learning Products

## Semantic learning

Future belief changes through new Evidence/Assertions/conflict resolution.

## Mnemonic learning

Future recall changes through `memory_strength`/salience. Truth does not change.

## Procedural learning

Future action policy changes through Skill, SkillUtility, applicability, and counterexamples.

## Self-model learning

Future decisions change because the Brain's model of its own capabilities, limitations, preferences, identity continuity, or strategies changed. SelfModel cannot grant authority.

# 15. Orthogonal Signals

| Signal | Question |
|---|---|
| Assertion confidence | Strength of this Assertion's stance |
| source trust | Reliability of source in context |
| memory_strength | Cognitive accessibility |
| salience | Importance/noteworthiness |
| utility | Procedural usefulness |
| validity/currentness | Applicability in time |

Never implement `not recalled recently → lower confidence` without new epistemic Evidence.

# 16. Reinforcement vs Evidence

Repeated retrieval does not create Evidence, increase confidence, or prove truth. Independent repeated observations may increase epistemic support. Repeated successful Skill use may increase procedural utility. Repeated exposure to the same root does not create independent corroboration.

# 17. Skill Model

A useful Skill carries applicability, preconditions, procedure, success criteria, failure modes, counterexamples, supporting Experiences, validation history, utility, and descriptive status.

# 18. Skill Lifecycle

Reference cognitive lifecycle:

```text
candidate → validated → needs_review → validated/deprecated/archived
```

This is descriptive cognition. Governance influence/authority is separate: descriptive, advisory, behavioral, executable.

# 19. Skill Validation

After Skill use, capture context, whether preconditions held, selected procedure, outcome, feedback, and unexpected observations.

Classify success under matching conditions, failure under matching conditions, failure under non-matching conditions, and unknown outcome. Matching-condition failure is a strong negative signal and may narrow the Skill or mark it `needs_review`.

# 20. Action Recall

Ordinary recall asks **what do I know?** Action Recall asks **what past cognition is relevant to choosing the next action under the current state?**

Recommended briefing:

```text
Goal
Current state
Accepted knowledge
Contested assumptions
Unverified preconditions
Applicable Skills
Skill utility/status/authority
Supporting successful Experiences
Relevant failed Experiences
Counterexamples
Open Commitments
Constraints
Warnings
```

Similarity is only one signal; applicability comes first.

# 21. Retrieval for Learning

Ranking may consider semantic relevance, goal/state similarity, precondition compatibility, tool/environment compatibility, outcome polarity, surprise, learning value, memory_strength, salience, recency/currentness, and Governance visibility. No universal scalar is required.

# 22. Counterexample Retrieval

When recalling a Skill, actively look for matching failures, known failure modes, contested assumptions, negative feedback, and recent invalidation. A high-similarity success is not sufficient when a high-value counterexample exists.

# 23. Self-Model Learning

SelfModel updates should be slower than Event formation. Candidate sources include repeated behavior, explicit correction, high-salience Experience, validated capability gain, stable communication preference, recurring limitation, and stable mission/value signal.

# 24. Maintenance

Maintenance performs semantic/procedural consolidation, identity resolution, mnemonic metabolism, retention review, conflict discovery, Skill review, SelfModel refresh, Commitment review, and quarantine review under Governance.

# 25. Forgetting

```text
epistemic retraction/supersession
mnemonic weakening
archive
Governance exclusion
tombstone
physical purge
```

are different mechanisms, not one delete-old-memory action.

# 26. Experience Compression

Compression may reduce trace size but should preserve goal, important state transitions, actions, observations, outcome, failure/recovery, surprise, counterexamples, and provenance lineage. Summary does not create new Evidence roots.

# 27. Cross-Agent Learning

Remote Experience remains remote autobiography. A local Brain may derive a new local Skill from remote Experience while preserving provenance. Remote `$self`, trust, or Skill authority must not auto-transfer.

# 28. Evaluation

Evaluate semantic retention, temporal evolution, Experience reconstruction, procedural transfer, error avoidance, context discrimination, negative transfer, and causal memory impact.

The strongest causal experiment is `with relevant memory` versus `relevant memory ablated`.

# 29. Transaction Boundaries

Use atomic Transactions where partial state would mislead:

```text
Evidence + Proposition + Assertion
Experience + Steps + Formation Activity
new Assertion + supersession + revision Activity
Skill + compiled_from + compilation Activity
```

External action remains outside KIP transaction rollback.

# 30. Idempotency

Use transaction `idempotency_key`, durable `client_key`, and stable source-event identity. Same retry ≠ new observation.

# 31. Provenance Conservation

Every transformation should allow the Brain to recover what inputs caused the derived cognition, whether they were observed/stated/inferred/imported, how many independent roots exist, and which Principal performed the transformation.

# 32. Authority Conservation

Useful/validated/derived cognition cannot raise authority by itself. Imported Experience → local candidate Skill → local validation still does not imply tool permission.

# 33. No Hidden Chain-of-Thought Requirement

Use observable action, observation, outcome, feedback, and concise decision summaries. Private token-level reasoning is not required for useful procedural memory.

# 34. Reference Brain Cycle

```text
WAKE
  Formation → Evidence/Event/Experience/Assertions/Commitments
  Recall → Grounding/BELIEF/Experience/Skill/Action Briefing

SLEEP
  Consolidate → Insight/Assertion/Skill
  Metabolize → memory_strength/salience/retention
  Review → conflicts/identities/Skills/SelfModel/Commitments

NEXT WAKE
  changed cognitive state influences behavior
```

# 35. Design Invariants

1. A write is not proof of learning.
2. Event is not Experience.
3. Experience is not Skill.
4. Skill is not authority.
5. Failure is first-class.
6. Prediction error is not confidence.
7. Memory strength is not truth.
8. Repetition is not independent Evidence.
9. Summary is not a new root.
10. Temporal order is not causality.
11. Similarity is not applicability.
12. Retrieval is not functional memory unless it can influence future cognition.
13. Contradiction is data, not corruption.
14. Revision preserves history.
15. External action is outside KIP rollback.
16. Retry is not repeated Experience.
17. Remote Experience is not local autobiography.
18. Hidden chain-of-thought is unnecessary.
19. Learning should be behaviorally evaluable.
20. Protocol provides signals; Brain owns policy.

# 36. Final Principle

> **A learning Brain is not one that remembers more. It is one whose past can change its future in the right contexts without falsifying where that past came from.**
