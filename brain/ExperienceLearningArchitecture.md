# Experience Learning Architecture for KIP Brain

## Status

**Proposed Cognitive Architecture Extension**

This document defines the conceptual model for extending a KIP-based Brain from persistent knowledge memory into an **experience learning system**. It does not require changes to the core KQL/KML syntax. The existing Concept / Proposition model is sufficient to represent the structures described here.

The concrete recommended schemas and predicates are defined in [CognitiveMemoryProfile.md](CognitiveMemoryProfile.md).

---

## 1. Why This Extension Exists

Most long-term memory systems for language agents are optimized for a retrieval question:

> "What past information is similar or relevant to the current query?"

That is useful, but insufficient for learning from experience.

A learning agent also needs to answer:

> "When I was in a similar state before, what did I try, what did I expect, what actually happened, why did I revise my belief, and what should I do differently now?"

The distinction is fundamental:

```text
Knowledge:   what is generally true?
Event:       what happened?
Experience:  what did an actor go through while pursuing a goal?
Skill:       what tends to work under specified conditions?
Memory:      how can the past participate in future computation?
```

The proposed architecture therefore treats **Experience** and **Skill** as first-class memory products alongside semantic and episodic memory.

---

## 2. Core Definitions

### 2.1 Knowledge

**Knowledge is a compressed regularity of experience or evidence.**

It is usually decontextualized enough to be reusable across many situations.

Examples:

- "This API returns 403 when the token is expired."
- "Alice prefers dark mode."
- "Wet roads reduce tire traction."

Knowledge answers:

> **What is true, likely true, or generally useful to believe?**

In KIP, semantic knowledge is naturally represented by Concept Nodes and Proposition Links.

### 2.2 Event

**An Event is an episodic anchor describing what happened in a bounded situation.**

An Event normally preserves:
- time;
- participants;
- context;
- summary;
- outcome;
- salient concepts.

It intentionally does **not** have to preserve every action or observation.

Example:

> "The v2 deployment initially failed and succeeded after the database target was corrected."

This is a good Event summary. It may be enough for autobiographical recall but not enough for procedural transfer.

### 2.3 Experience

**Experience is a situated causal trajectory traversed by an actor while pursuing a goal.**

A useful abstract form is:

```text
Experience =
  Goal
  + Initial State / Belief
  + [Action → Observation → Belief Update]*
  + Outcome
  + Feedback
```

An Experience answers:

> **What state was I in, what did I do, what did I observe, and how did that change the path to the outcome?**

The word "causal" must be used carefully. The trace preserves temporal order by default. Explicit causal links should be recorded only when supported, not inferred from mere adjacency.

### 2.4 Insight

**An Insight is a declarative lesson abstracted from one or more experiences.**

Typical structure:

```text
trigger
correction
context
```

Example:

> "When a deployment reports a missing column, verify the active database target before assuming migrations failed."

An Insight is valuable, but it is still declarative knowledge: *I know what I should consider*.

### 2.5 Skill

**A Skill is experience compiled into an actionable policy or procedure.**

A Skill answers:

> **When these conditions hold, what should I do?**

A Skill may be represented as:
- a heuristic;
- a workflow;
- a checklist;
- a tool policy;
- a prompt;
- code;
- a sub-agent configuration.

A Skill should carry trigger conditions, applicability context, success criteria, failure signals, and validation evidence. It must not be treated as globally correct merely because it worked once.

### 2.6 Memory

**Memory is not a data type. Memory is the mechanism by which past state can condition future computation.**

A storage system can contain millions of records without functioning as memory if none of them affect later prediction or behavior.

A practical functional test is:

> If deleting a stored item cannot change any relevant future internal state, prediction, or action, that item is archival information rather than functional memory.

---

## 3. The Experience Learning Loop

```text
Current Goal + State
        │
        ▼
   Agent Decision
        │
        ▼
      Action
        │
        ▼
   Environment / Tool
        │
        ▼
    Observation
        │
        ▼
Outcome / Feedback
        │
        ▼
Experience Formation
        │
        ├──────────> Semantic Consolidation ──> Knowledge
        │
        ├──────────> Reflection ──────────────> Insight / Self-model
        │
        └──────────> Procedural Consolidation ─> Skill
                                                     │
                                                     ▼
                                                Action Recall
                                                     │
                                                     ▼
                                             Future Decision
                                                     │
                                                     └────↺
```

Learning is complete only when later behavior can be changed by the consolidated result.

---

## 4. Event vs. Experience

The two should not be conflated.

| | Event | Experience |
| --- | --- | --- |
| Main question | What happened? | What path did the actor traverse? |
| Typical size | compact | potentially multi-step |
| Primary use | episodic recall, provenance, autobiographical anchors | learning, transfer, failure avoidance |
| Order | coarse time | explicit ordered steps |
| Actions | optional | first-class |
| Observations | optional | first-class |
| Expectations | optional | useful when present |
| Outcome | usually one summary | outcome + step-level feedback |
| Consolidation target | semantic knowledge | semantic knowledge + Skills |

Not every Event deserves an Experience. A greeting, routine status update, or simple preference statement should remain an Event or semantic fact.

Create an Experience only when the **process has future utility**.

---

## 5. What Counts as a Valuable Experience

Formation should prefer Experience encoding when at least one applies:

1. **Goal-directed multi-step work** occurred.
2. A meaningful **failure or recovery** occurred.
3. An observation **violated an expectation**.
4. The agent changed its hypothesis or strategy because of feedback.
5. Tool use revealed a reusable operational pattern.
6. Human feedback validated or rejected the result.
7. The trajectory is likely to help on a related future task.

Do not create Experience objects merely because a conversation contains many turns.

---

## 6. Experience Steps

An Experience contains ordered `ExperienceStep`s.

Recommended step kinds:

```text
observation
decision
action
feedback
```

A step can carry:

```text
index
timestamp
summary
tool
input_summary
expected_observation
actual_observation
success
prediction_error
decision_rationale
```

### 6.1 Decision Summary, Not Hidden Chain-of-Thought

A memory system should **not depend on or persist private model chain-of-thought**.

It may store a concise, externally useful rationale:

> "Suspected a migration issue because the error referenced a missing column."

It should not attempt to capture hidden token-by-token internal deliberation.

The design target is an **observable decision trace**, not a transcript of private cognition.

---

## 7. Expectation and Prediction Error

The most informative part of an experience is often not the action itself, but the mismatch between expectation and reality:

```text
Expectation
    ↓
Action
    ↓
Observation
    ↓
Prediction Error
    ↓
Belief / Strategy Update
```

Example:

```text
Expected: service becomes healthy after restart
Observed: health check still fails
Consequence: restart hypothesis weakened; investigate configuration
```

KIP Brain does not need a mathematically calibrated prediction-error value. It can persist:
- `expected_observation`;
- `actual_observation`;
- `surprise_score`.

This enables maintenance to prioritize experiences where the world materially violated the agent's model.

---

## 8. Salience and Learning Value

Episodic salience and learning value overlap but are not identical.

A useful conceptual scoring model is:

```text
LearningValue =
  f(
    goal_relevance,
    prediction_error,
    outcome_magnitude,
    novelty,
    human_feedback,
    reusability
  )
```

Emotional or autobiographical salience may also matter for `$self`, but procedural learning should not depend on emotional intensity alone.

A low-emotion tool failure can be more educational than a highly salient conversation.

---

## 9. Semantic vs. Procedural Consolidation

Maintenance should run two parallel pipelines.

### 9.1 Semantic Consolidation — "What is true?"

```text
Event / Experience
      ↓
extract recurring or stable regularity
      ↓
Knowledge / Preference / Insight / relationship
```

Example:

```text
Three deployment incidents show that expired credentials produce 403
→ semantic knowledge about the API
```

### 9.2 Procedural Consolidation — "What works?"

```text
Experience(s)
      ↓
compare state + action + outcome
      ↓
infer applicability and discriminating steps
      ↓
Skill
```

Example:

```text
Several deployment recoveries
→ Skill: diagnose deployment DB mismatch
```

A Skill is not simply a prose summary of the experience. It should capture a reusable policy.

---

## 10. Contrastive Experience Consolidation

The strongest procedural learning often comes from comparison.

```text
Successful Experience
        +
Failed Experience
        ↓
What differed?
        ↓
Condition / Action / Observation that discriminates outcomes
        ↓
Skill refinement
```

Maintenance should actively search for:

- same or similar goal;
- overlapping initial state;
- different actions;
- different outcomes.

It should ask:

1. Which step differs?
2. Did the successful case satisfy a precondition absent in the failed case?
3. Did a failed action produce a useful diagnostic observation?
4. Is the apparent difference causal, merely correlated, or uncertain?
5. What counterexample should be retained with the Skill?

This is **contrastive consolidation**, not simple frequency counting.

---

## 11. Failure Is First-Class Memory

Repeated failure is not evidence that a procedure is correct.

For semantic assertions:

```text
independent supporting evidence → confidence may rise
```

For procedural learning:

```text
success / failure outcomes → utility and applicability are updated
```

A failed Experience can produce:
- one or more `failure_signals`;
- a `counterexample`;
- a diagnostic step;
- a recovery branch;
- a negative precondition ("do not apply when...").

Recall should often retrieve both:
- one relevant successful experience;
- one relevant failed experience.

This reduces blind experience-following.

---

## 12. Confidence, Memory Strength, Salience, and Validity

These must remain orthogonal.

### 12.1 Epistemic Confidence

`confidence` means:

> How strongly is this assertion supported as true?

It changes with:
- independent evidence;
- explicit confirmation;
- contradiction;
- source quality;
- retraction.

It should **not** mechanically decay because the fact was not recently recalled.

### 12.2 Memory Strength

`memory_strength` means:

> How strongly should this memory compete for spontaneous or associative recall?

It can:
- rise with reinforcement;
- fall with disuse;
- be restored by renewed evidence or use.

A fact may have:

```text
confidence = 0.99
memory_strength = 0.35
```

This means "almost certainly true, but not currently cognitively active."

### 12.3 Salience

`salience_score` or a related attribute captures importance / memorability, especially for episodic or autobiographical memory.

### 12.4 Validity

`valid_from`, `valid_until`, and `superseded` capture whether an assertion still applies.

Truth support, accessibility, importance, and current applicability are different axes.

---

## 13. Reinforcement vs. Evidence

A repeated mention from the same source and independent evidence are not equivalent.

Example:

```text
Alice says "I prefer dark mode" three times
```

This is strong evidence of stable preference and high memory accessibility.

But in general:

```text
same source repeats X
≠
three independent sources support X
```

Brain should therefore avoid a universal rule such as:

```text
every repetition → confidence + 0.05
```

A safer policy:

```text
repetition / successful recall use → memory_strength ↑
independent corroboration → confidence ↑
contradiction → confidence ↓ or superseded
```

Type-specific logic may still treat repeated self-report as evidence of a stable preference.

---

## 14. Skill Lifecycle

Recommended maturity lifecycle:

```text
candidate
  ↓ successful validation
validated
  ↓ conflicting / degraded evidence
needs_review
  ↓ newer better procedure
deprecated
```

A Skill write must satisfy the capsule schema. The required fields are:

```text
skill_class
description
goal
trigger_conditions
procedure
expected_outcome
```

The remaining profile fields are optional but commonly used:

```text
applicability_context
preconditions
decision_rules
success_criteria
failure_signals
recovery_strategy
execution_mode
implementation_ref
evidence_count
success_count
failure_count
last_validated_at
utility
maturity
```

### 14.1 Skill Utility

A Skill's utility is not the same as epistemic confidence.

A simple implementation can estimate:

```text
utility ≈ weighted_success / weighted_attempts
```

but must consider:
- similarity of task conditions;
- recency;
- human evaluation;
- cost;
- side effects.

Avoid a single global success rate when contexts differ materially.

---

## 15. Formation API: From Messages to Trace

The existing conversation interface remains valid:

```json
{
  "messages": [
    {"role": "user", "content": "I prefer dark mode."}
  ],
  "context": {},
  "timestamp": "..."
}
```

To capture Experience, Formation SHOULD also accept a structured observable trace:

```json
{
  "goal": "Deploy version 2",
  "trace": [
    {
      "kind": "message",
      "role": "user",
      "content": "Deploy v2"
    },
    {
      "kind": "action",
      "summary": "Deploy service",
      "tool": "shell"
    },
    {
      "kind": "observation",
      "summary": "Startup failed: missing database column",
      "result_status": "failure"
    },
    {
      "kind": "decision",
      "decision_rationale": "Suspect migration was not applied"
    },
    {
      "kind": "action",
      "summary": "Run migration"
    },
    {
      "kind": "observation",
      "summary": "Failure persists; connection points to legacy database",
      "result_status": "failure"
    },
    {
      "kind": "action",
      "summary": "Correct database target and redeploy"
    },
    {
      "kind": "feedback",
      "summary": "Deployment healthy",
      "result_status": "success"
    }
  ],
  "outcome": {
    "status": "success"
  },
  "timestamp": "..."
}
```

Before encoding, normalize the input trace. A `message` contributes conversation or Event context and does not become a Step unless its observable role is normalized to `observation` or `feedback`. Only `observation`, `decision`, `action`, and `feedback` are stored as `ExperienceStep.kind`. For observations, actions, and feedback, `result_status: "success"` maps to `success: true`, `result_status: "failure"` maps to `success: false`, and any other value is omitted. `result_status` is not a stored schema field.

`messages[]` is therefore a backward-compatible subset of a broader observation interface.

---

## 16. Action Recall

Traditional recall asks:

> What should I tell the user?

Action Recall asks:

> What past state should change my next decision?

A pre-action briefing should ideally contain:

```text
Goal / current state
Relevant semantic knowledge
Applicable Skills
Similar successful Experiences
Relevant failed / counterexample Experiences
Constraints and commitments
Uncertainty / warnings
```

The consuming business agent remains responsible for the final decision.

---

## 17. Retrieval Principles for Experience and Skills

### 17.1 Do Not Rank by Semantic Similarity Alone

For Experience retrieval, useful similarity includes:
- goal similarity;
- initial-state similarity;
- tool / environment similarity;
- constraint similarity;
- outcome class.

### 17.2 Context Applicability Comes Before Popularity

A highly successful Skill can still be wrong for the current state.

Rank approximately by:

```text
trigger and applicability-context match
× validation quality
× current relevance
× memory accessibility
```

### 17.3 Include Counterexamples

When a Skill has known failure modes, Recall should surface them with the Skill.

---

## 18. Memory Lifecycle

Raw Experience is expensive and should not live forever by default.

A typical lifecycle:

```text
raw trace
  ↓ formation
Experience + ExperienceSteps
  ↓ maintenance
Knowledge / Insight / Skill
  ↓ sufficient consolidation + provenance checks
archive / TTL raw detail
```

Do not delete an Experience if it remains the sole evidence for an active high-value Insight or Skill.

Landmark autobiographical Experiences may be promoted to long-term memory.

---

## 19. Learning Criterion

KIP can provide the primitives for persistence and evolution, but a system should reserve the strongest use of **learning** for behavioral change.

A practical criterion is:

```text
Learning =
past experience causes a durable improvement
or durable change in future behavior
under relevant conditions
```

The strongest evaluation is causal:

```text
performance with relevant memory
>
performance after relevant memory ablation
```

---

## 20. Evaluation Framework

Recommended benchmark dimensions:

### Semantic Retention
Can the system recover stable facts?

### Temporal Evolution
Can it distinguish previous and current state?

### Experience Reconstruction
Can it recover the relevant action-observation trajectory?

### Procedural Transfer
Can it solve a related task by applying a Skill?

### Error Avoidance
Does it avoid a previously observed failure?

### Context Discrimination
Does it avoid applying a learned procedure when preconditions differ?

### Negative Transfer
Does retrieval of a superficially similar but inappropriate Experience hurt performance?

### Causal Memory Impact
Does removing the relevant memory reduce task success?

Suggested ablation:

```text
A. LLM only
B. LLM + text/vector retrieval
C. LLM + KIP semantic memory
D. C + Experience
E. D + Skill consolidation
```

---

## 21. Design Principle Summary

Knowledge is a stable abstraction consolidated from evidence and Experience. Skill is an action policy compiled from Experience and bounded by explicit applicability conditions. A stored past state functions as memory only when it can affect later computation; learning is present only when Experience produces durable behavioral change.

KIP Brain is therefore an **Experience Learning System**: it preserves useful trajectories, consolidates them into knowledge and Skill, and returns them when they can improve action.
