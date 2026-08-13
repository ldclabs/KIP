# KIP Cognitive Memory Profile — Experience & Procedural Memory

## Status

**Proposed profile for KIP-based memory systems**

This document defines the recommended Concept Types, Proposition Types, attributes, metadata semantics, and operating patterns for representing **Experience** and **Skill** on top of KIP.

It is a profile, not a change to KQL/KML Core. The executable bootstrap is defined by the capsules in [`capsules/`](../capsules/).

---

## 1. Profile Scope

The profile extends the existing cognitive memory set:

```text
Person
Event
Preference
Insight
Commitment
SleepTask
```

with:

```text
Experience
ExperienceStep
Skill
```

The four profile predicates are:

```text
has_step
caused_by
derived_insight
compiled_to
```

Existing predicates remain part of the model:

```text
involves
mentions
derived_from
consolidated_to
learned
belongs_to_domain
```

---

## 2. Conceptual Relationships

```text
Experience
  ├── involves ─────────> Person
  ├── has_step ─────────> ExperienceStep
  ├── consolidated_to ──> semantic knowledge
  ├── derived_insight ──> Insight
  └── compiled_to ──────> Skill

ExperienceStep
  └── caused_by ────────> ExperienceStep

Insight / Skill
  └── derived_from ─────> Experience
```

`ExperienceStep.index` defines sequence. `caused_by` is optional and means effect → cause. It MUST NOT be inferred from adjacency alone.

`Memory`, `Knowledge`, and `Action` are functional roles, not mandatory universal Concept Types.

---

## 3. `Experience` Concept Type

### Purpose

Represents a bounded, goal-directed trajectory whose process has future learning value.

### Recommended attributes

```json
{
  "experience_class": "problem_solving",
  "goal": "Deploy version 2",
  "initial_state": {
    "service_version": "v2",
    "assumed_database": "migrated-primary"
  },
  "status": "completed",
  "outcome": "Deployment succeeded after correcting the database target",
  "success": true,
  "prediction_error": "The service was connected to the old database",
  "surprise_score": 82,
  "learning_value": 88,
  "started_at": "2026-08-13T10:00:00Z",
  "ended_at": "2026-08-13T10:12:00Z",
  "context": {"project": "service-v2"},
  "raw_trace_ref": "trace:deploy-v2",
  "consolidation_status": "pending",
  "salience_score": 65
}
```

### Attribute semantics

| Attribute | Type | Meaning |
| --- | --- | --- |
| `experience_class` | String | `task_execution`, `problem_solving`, `decision_making`, `exploration`, `interaction`, or `self_reflection` |
| `goal` | String | The outcome the subject was trying to achieve |
| `initial_state` | Object | Relevant starting state, constraints, and externally supportable beliefs |
| `status` | String | `ongoing`, `completed`, or `aborted` |
| `outcome` | String | Compact terminal result |
| `success` | Boolean | Whether the stated goal was achieved; omit when unknown or ongoing |
| `prediction_error` | String | Most consequential mismatch between expectation and observation |
| `surprise_score` | Number 0–100 | Magnitude of expectation violation |
| `learning_value` | Number 0–100 | Estimated future reuse value |
| `started_at` / `ended_at` | ISO 8601 | Temporal boundary |
| `context` | Object | Environment, project, constraints, and retrieval context |
| `raw_trace_ref` | String | External reference to the immutable raw trace |
| `consolidation_status` | String | `pending`, `partially_consolidated`, `completed`, or `archived` |
| `salience_score` | Number 0–100 | Encoding and consolidation priority; distinct from confidence and memory strength |

### Metadata

Recommended:

```json
{
  "source": "trace_id",
  "author": "$self",
  "confidence": 0.95,
  "memory_strength": 0.8,
  "created_at": "...",
  "observed_at": "...",
  "memory_tier": "short-term",
  "expires_at": "..."
}
```

`confidence` means confidence that the stored trace faithfully reflects the observations. It does not say that the attempted procedure was good.

---

## 4. `ExperienceStep` Concept Type

### Purpose

Represents one ordered observation, decision, action, or feedback record inside an Experience.

### Recommended attributes

```json
{
  "index": 3,
  "kind": "observation",
  "summary": "Startup failed with a missing-column error",
  "timestamp": "2026-08-13T10:04:00Z",
  "state": {"health": "unhealthy"},
  "tool": "shell",
  "success": false,
  "expected_observation": "service becomes healthy",
  "actual_observation": "health check still fails",
  "prediction_error": "restart did not resolve the failure",
  "raw_data_ref": "log:deploy-v2:startup"
}
```

### `kind`

Recommended values:

```text
observation
decision
action
feedback
```

Additional values require an explicit schema extension.

### Sequence and causality

- `index` is zero-based and unique within one Experience.
- `index` defines order, not cause.
- `caused_by` is created only when the trace or later analysis supports the causal claim.

### Decision privacy rule

`decision_rationale` stores a concise, reusable basis for a decision. It MUST NOT require or attempt to preserve hidden chain-of-thought.

Good:

> "Suspected a migration issue because the error referenced a missing column."

Bad:

> A verbatim private reasoning transcript.

---

## 5. `Skill` Concept Type

### Purpose

Represents a reusable action-selecting policy compiled from one or more Experiences.

### Recommended attributes

```json
{
  "skill_class": "diagnostic",
  "description": "Verify the active database target before treating a deployment failure as a migration failure",
  "goal": "Distinguish database-target failures from migration failures early",
  "trigger_conditions": [
    "new deployment fails startup or health checks",
    "database schema error is suspected"
  ],
  "preconditions": ["database target is inspectable"],
  "procedure": [
    "read the service's active database target",
    "compare it with the migrated target",
    "only then inspect or rerun migrations"
  ],
  "decision_rules": [
    "if the target differs, correct configuration before changing schema"
  ],
  "expected_outcome": "target mismatch is confirmed or ruled out before mutation",
  "success_criteria": ["active target identity is verified"],
  "failure_signals": ["target identity cannot be read"],
  "recovery_strategy": "request environment-owner verification",
  "execution_mode": "supervised",
  "implementation_ref": "skill:deployment-db-check",
  "maturity": "candidate",
  "utility": 0.82,
  "evidence_count": 4,
  "success_count": 3,
  "failure_count": 1,
  "last_validated_at": "2026-08-13T10:12:00Z",
  "applicability_context": {
    "environment": "service deployment",
    "risk": "database mutation"
  }
}
```

### Skill classes

Recommended values:

```text
procedure
diagnostic
decision_policy
recovery
tool_use
communication
```

### Skill lifecycle

```text
candidate → validated → needs_review → deprecated
```

- `candidate`: plausible but not sufficiently validated.
- `validated`: succeeded under enough independent matching conditions.
- `needs_review`: evidence conflicts, degrades, or exposes a missing boundary.
- `deprecated`: kept for history but excluded from new action guidance.

### Utility is not confidence

- `confidence`: how well the evidence supports the Skill's description and stated scope.
- `utility`: how useful the Skill has been under matching conditions.
- `memory_strength`: how strongly it competes for recall.
- `maturity`: where it is in the procedural lifecycle.

These values can move independently.

---

## 6. Proposition Types

### 6.1 `has_step`

```text
Experience ──has_step──> ExperienceStep
```

Membership only. The child step's `index` defines order.

KIP Core validates relation endpoints but does not enforce single-parent membership or per-parent index uniqueness. Before adding `has_step`, Formation MUST verify that the Step has no different Experience parent and that its `index` is unused within the target Experience. Maintenance SHOULD report violations rather than silently choosing a parent.

### 6.2 `caused_by`

```text
ExperienceStep ──caused_by──> ExperienceStep
```

Direction is effect → cause. This relation is optional, non-symmetric, and non-transitive.

### 6.3 `derived_insight`

```text
Experience ──derived_insight──> Insight
```

The inverse provenance relation is:

```text
Insight ──derived_from──> Experience
```

### 6.4 `compiled_to`

```text
Experience ──compiled_to──> Skill
```

The Skill SHOULD also retain `derived_from` links to every supporting Experience.

### 6.5 Reused predicates

- `involves`: links an Experience to the Person pursuing or participating in the goal.
- `consolidated_to`: links an Experience to semantic knowledge.
- `derived_from`: preserves inverse provenance from knowledge, Insight, or Skill to Event or Experience.

---

## 7. Example Graph

```text
Experience:DeployV2
  ├─ involves → $self
  ├─ has_step → Step:0 observation startup failure
  ├─ has_step → Step:1 action inspect database target
  ├─ has_step → Step:2 feedback target mismatch confirmed
  ├─ derived_insight → Insight:VerifyDatabaseTarget
  └─ compiled_to → Skill:DiagnoseDeploymentDBMismatch

Step:2 → caused_by → Step:1

Insight:VerifyDatabaseTarget
  └─ derived_from → Experience:DeployV2

Skill:DiagnoseDeploymentDBMismatch
  └─ derived_from → Experience:DeployV2
```

---

## 8. Suggested KIP Write Pattern

After the profile capsules are registered:

```prolog
UPSERT {
  CONCEPT ?experience {
    {type: "Experience", name: :experience_name}
    SET ATTRIBUTES {
      experience_class: :experience_class,
      goal: :goal,
      initial_state: :initial_state,
      status: :status,
      outcome: :outcome,
      success: :success,
      prediction_error: :prediction_error,
      surprise_score: :surprise_score,
      learning_value: :learning_value,
      started_at: :started_at,
      ended_at: :ended_at,
      context: :context,
      raw_trace_ref: :raw_trace_ref,
      consolidation_status: "pending"
    }
    SET PROPOSITIONS {
      ("involves", {type: "Person", name: "$self"})
      ("belongs_to_domain", {type: "Domain", name: :domain})
    }
  }
  WITH METADATA {
    memory_tier: "short-term",
    expires_at: :experience_expires_at
  }
}
WITH METADATA {
  source: :source,
  author: "$self",
  confidence: 0.95,
  memory_strength: 0.8,
  created_at: :timestamp,
  observed_at: :timestamp
}
```

Each step is a separate Concept:

```prolog
UPSERT {
  CONCEPT ?step {
    {type: "ExperienceStep", name: :step_name}
    SET ATTRIBUTES {
      index: :index,
      kind: :kind,
      summary: :summary,
      timestamp: :step_timestamp,
      state: :state,
      tool: :tool,
      success: :success,
      expected_observation: :expected_observation,
      actual_observation: :actual_observation,
      prediction_error: :prediction_error,
      decision_rationale: :decision_rationale,
      raw_data_ref: :raw_data_ref
    }
    SET PROPOSITIONS {
      ("belongs_to_domain", {type: "Domain", name: :domain})
    }
  }
  WITH METADATA {
    source: :source,
    author: "$self",
    confidence: 0.95,
    memory_strength: 0.8,
    created_at: :timestamp,
    observed_at: :timestamp,
    memory_tier: "short-term",
    expires_at: :step_expires_at
  }
  CONCEPT ?experience {
    {type: "Experience", name: :experience_name}
    SET PROPOSITIONS {
      ("has_step", ?step) WITH METADATA {
        source: :source,
        author: "$self",
        confidence: 0.95,
        memory_strength: 0.8,
        created_at: :timestamp,
        observed_at: :timestamp,
        expires_at: :step_expires_at
      }
    }
  }
}
```

---

## 9. Procedural Consolidation Pattern

Maintenance SHOULD compare more than one Experience when possible.

### Candidate generation

Group by:
- similar goal;
- relevant domain;
- tool and environment;
- initial-state features.

### Contrast

Compare:
- success and failure;
- differing steps;
- missing or satisfied preconditions;
- expectation violations;
- human feedback.

### Compile

Create or update one Skill with:
- trigger conditions and applicability context;
- preconditions and procedure;
- decision rules;
- expected outcome and success criteria;
- failure signals and recovery;
- evidence counts, utility, and maturity.

### Provenance

```text
Experience ──compiled_to──> Skill
Skill ──derived_from──────> Experience
```

Keep all supporting and contrasting Experiences while they remain necessary evidence.

---

## 10. Skill Validation

### Success under matching conditions

```text
success_count += 1
evidence_count += 1
last_validated_at = now
memory_strength ↑
utility may ↑
maturity may become validated
```

### Failure under matching conditions

```text
failure_count += 1
evidence_count += 1
add or refine failure_signals
utility may ↓
maturity may become needs_review
```

### Failure under non-matching conditions

Do not score it as an in-scope failure. Refine `trigger_conditions`, `applicability_context`, or `preconditions` instead.

---

## 11. Recall Patterns

### 11.1 Similar Experiences

```prolog
SEARCH CONCEPT :goal MODE "semantic" WITH TYPE "Experience" LIMIT 10
```

The semantic index SHOULD cover `goal`, `initial_state`, `outcome`, `context`, and linked Step summaries. If only names are indexed, use a bounded `FIND` over the relevant Domain and rank candidates in the caller by those fields.

After grounding, inspect `success`, initial state, domain, tools, prediction error, and current-state compatibility.

### 11.2 Applicable Skills

```prolog
SEARCH CONCEPT :goal MODE "semantic" WITH TYPE "Skill" LIMIT 10
```

The Skill index SHOULD cover `goal`, `trigger_conditions`, `applicability_context`, `procedure`, and `failure_signals`. Otherwise, obtain a bounded candidate set from the relevant Domain and apply the checks below in the caller.

Do not select from `_score` alone. Inspect trigger conditions, applicability context, preconditions, maturity, utility, failure signals, and provenance.

### 11.3 Reconstruct Steps

```prolog
FIND(?step) WHERE {
  ?experience {type: "Experience", name: :experience_name}
  (?experience, "has_step", ?step)
} ORDER BY ?step.attributes.index ASC
```

---

## 12. Action Briefing Contract

```text
Relevant Knowledge:
- ...

Applicable Skills:
- Skill X — why it matches, maturity, utility, failure signals

Past Success:
- Experience A — why it matches

Past Failure / Counterexample:
- Experience B — what boundary it exposed

Warnings:
- Preconditions not yet verified
- Conflicting evidence

Memory-informed next checks:
- ...
```

The Brain supplies memory-informed context. The business agent remains the action authority.

---

## 13. Memory Strength Metadata

```text
memory_strength: Number [0,1]
```

Meaning: current mnemonic accessibility or activation strength.

```text
reconfirmation / successful use → raise
long disuse → decay
high salience → slower decay
```

Do not use memory strength as a truth probability.

### Migration from older graphs

For systems that previously decayed `metadata.confidence` as a memory-strength proxy:

1. Initialize missing `memory_strength` from current confidence or a neutral default.
2. Stop generic time-based confidence decay.
3. Keep `confidence` for epistemic support.
4. Apply future “use it or lose it” updates to `memory_strength`.

Already-lost epistemic confidence cannot be reconstructed mechanically; preserve provenance and let later evidence recalibrate it.

---

## 14. TTL and Cleanup

- Raw `Experience`: short-term unless landmark or uniquely valuable.
- `ExperienceStep`: follows the parent Experience lifecycle. Formation sets each Step's `expires_at` equal to its parent and Maintenance updates both together.
- `Skill`: durable; no default TTL.
- Supporting Experiences remain while they are the sole evidence for an active, high-value Insight or Skill.

Before deleting an Experience:

1. verify consolidation completed;
2. verify no active node relies on it as sole evidence;
3. archive when uncertainty remains;
4. delete its ExperienceSteps and `has_step` links in the same maintenance batch. KIP Core does not imply cascading deletion; if the store cannot make the batch atomic, archive the parent and queue a cleanup task instead.

---

## 15. Backward Compatibility

This profile is additive. Existing systems can continue using Event, Preference, Insight, and Commitment without Experience or Skill.

A staged deployment can be:

```text
Stage 1: register profile schemas and predicates
Stage 2: accept structured trace input
Stage 3: form Experiences for high-value trajectories only
Stage 4: add Experience recall
Stage 5: enable procedural consolidation into Skills
Stage 6: evaluate behavioral transfer and error avoidance
```

KQL/KML Core syntax does not change.

---

## 16. Invariants

1. `Event` is not a synonym for `Experience`.
2. Every `ExperienceStep` belongs to one bounded Experience.
3. Step order does not imply causality.
4. Hidden chain-of-thought is not a required memory input.
5. Failed Experiences remain when they teach useful boundaries.
6. Repetition is not automatically independent evidence.
7. `confidence`, `memory_strength`, `salience_score`, `learning_value`, and validity remain distinct.
8. A Skill declares observable trigger conditions or applicability context.
9. Skill success and failure update procedural evidence and utility, not generic truth confidence.
10. Procedural consolidation preserves provenance and counterexamples.
11. Recall checks failure signals before applying prior experience.
12. Procedural memory is judged by durable change in future behavior.
