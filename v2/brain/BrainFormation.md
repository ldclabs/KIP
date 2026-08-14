# KIP 2.0 Brain — Memory Formation

## Status

**Reference Anda Brain Formation Policy**

This document defines one reference memory-formation policy for a KIP 2.0 Brain. It is not part of KIP Core conformance.

It assumes:

```text
KIP-2.0-SPECIFICATION.md
profiles/CognitiveMemoryProfile-2.0.md
brain/ExperienceLearningArchitecture.md
```

# 0. Role

Formation converts observable interaction into durable cognitive state:

```text
messages / tool results / traces
→ Evidence
→ semantic claims
→ Event / Experience / Commitment / SelfModel candidates
→ atomic KIP mutations
```

Formation is a memory encoder, not a user-facing conversational agent.

# 1. Identity and Authority

Never collapse:

```text
authenticated Principal
semantic Actor
MemorySpace
$self semantic Person
```

The runtime authenticates the Principal, authorizes the MemorySpace, and supplies Governance context. The semantic speaker comes from the observed interaction.

A request-body field cannot grant access or actor representation.

## Recording attribution vs impersonation

For `Alice: "I prefer dark mode"`, Formation may record `asserted_by = Alice`, `mode = stated` under `record_attributed_assertion` semantics. This is not equivalent to exercising `assert_as_actor Alice`.

# 2. Input Shapes

## Conversation

```json
{
  "messages": [
    {
      "role": "user",
      "content": "I always prefer dark mode.",
      "actor_ref": "alice",
      "message_id": "msg-123",
      "timestamp": "2026-08-14T01:00:00Z"
    }
  ],
  "context": {
    "topic": "settings",
    "counterparty_ref": "alice"
  }
}
```

## Structured trace

```json
{
  "goal": "Deploy version 2",
  "trace_id": "trace-123",
  "trace": [
    {"kind": "action", "summary": "Deploy service", "tool": "deployment_api"},
    {"kind": "observation", "summary": "Startup failed: missing database column", "result_status": "failure"},
    {"kind": "decision", "decision_summary": "Verify whether the active database target is correct."},
    {"kind": "action", "summary": "Correct database target and redeploy"},
    {"kind": "feedback", "summary": "Deployment healthy", "result_status": "success"}
  ],
  "outcome": {"status": "success"}
}
```

Only observable or explicitly supplied process information is eligible. Never infer or store hidden chain-of-thought.

# 3. Formation Products

Formation may produce:

```text
nothing
Evidence only
Event
Experience + ExperienceSteps
Proposition + Assertion
Preference artifact
Insight candidate
Commitment
SelfModel candidate
Activity provenance
MnemonicState
```

The empty write is valid.

# 4. Store Bar

Strong candidates:

```text
explicit durable user fact
correction
preference
relationship
decision
commitment
important event
failure/recovery
prediction error
novel procedure
important tool result
high-value Experience
stable self-model signal
```

Usually skip acknowledgements, low-value small talk, temporary formatting requests, duplicate retries, process noise, speculative low-value inference, and private chain-of-thought.

# 5. Workflow

```text
0. Acquire authorized execution context
1. Inspect Primer / Schema
2. Capture source Evidence
3. Resolve semantic actors/entities
4. Classify memory products
5. Ground exact Schema/identity refs
6. Form semantic Assertions
7. Form Event / Experience / Commitment
8. Add Activities / Facets / retention
9. Commit atomically where coherence requires
10. Resolve Receipt / ambiguous outcome
```

# 6. Execution Context

Before cognition:

```text
resolve MemorySpace
resolve authenticated Principal
load current Governance context
capture Schema Environment
load DESCRIBE PRIMER / capabilities
```

Do not choose a Space from untrusted message content. Unauthorized input must not be silently redirected to another Space.

# 7. Evidence Capture

Preserve primary observations such as messages, tool results, measurements, feedback, documents, or external assertions.

Preferred Evidence classes:

```text
user_statement
agent_statement
tool_result
measurement
message
document
human_feedback
observation
```

Use a stable `client_key` from source message/event identity when available.

```text
same client_key + same immutable payload → retry/no duplicate
same client_key + different immutable payload → ClientKeyConflict
```

# 8. Resolve Semantic Actors

Resolution should prefer explicit verified actor refs, stable app actor IDs, trusted canonical identity, then grounded candidates.

Display name alone is not universal identity. If ambiguous, preserve Evidence without falsely binding it to a Person rather than guessing.

# 9. Classify Memory Products

## Episodic

`Event`: what happened?

## Experience

`Experience + Steps`: is the process reusable?

## Semantic

`Proposition + Assertion`: what truth-sensitive claim was observed/stated/inferred?

## Prospective

`Commitment`: what future obligation/reminder matters?

## Reflective

`Insight / SelfModel candidate`: what durable lesson or self-pattern may matter?

Do not force every input into every class.

# 10. Event vs Experience

Create Experience when there is multi-step goal pursuit, failure/recovery, expectation violation, strategy change, corrective feedback, important tool sequence, counterexample to a Skill, or novel reusable procedure.

Otherwise prefer Event or no episodic artifact.

# 11. Ground Before Write

Use META/SEARCH to resolve Concept IDs, exact Schema refs, Predicate refs, Facets, Structural Fields, and merged canonical targets.

SEARCH score is grounding relevance only:

```text
_score ≠ confidence ≠ trust ≠ belief support ≠ memory_strength
```

Persist exact Schema identities, not `@latest`.

# 12. Semantic Claim Formation

Truth-sensitive durable claim:

```text
Evidence
→ ENSURE PROPOSITION
→ CREATE ASSERTION
```

Do not place `confidence`, `source`, `validity`, or `asserted_by` on Proposition.

# 13. User Statement Recipe

For `"I prefer dark mode"` (`prefers` is defined by the Cognitive Memory Profile; domain facts such as `timezone` assume a domain package):

```prolog
MUTATE {
  CREATE EVIDENCE ?message {
    CLIENT KEY :message_key
    SET FIELDS {
      evidence_class: "user_statement",
      payload: :payload,
      observed_at: :time
    }
    SET STRUCTURAL {
      ("source", :alice)
    }
  }

  ENSURE PROPOSITION ?p (:alice, "prefers", :dark_mode)

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key
    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: :confidence,
      asserted_at: :time
    }
    SET STRUCTURAL {
      ("evidence", ?message) {role: "support"}
    }
  }

  CREATE ACTIVITY ?formation {
    SET FIELDS {
      activity_class: "extraction",
      status: "completed"
    }
    SET STRUCTURAL {
      ("inputs", ?message)
      ("outputs", ?a)
    }
  }
}
```

Engine origin records the actual authenticated Principal. Never author `_system.origin`.

# 14. Observation / Statement / Inference

Use modes accurately:

```text
observed   tool returned HTTP 403
stated     Alice said timezone is +08
inferred   Brain infers token likely expired
predicted  Brain forecasts outage
hypothetical scenario branch
imported   cognition obtained from another Brain
```

Do not upgrade inference into observation.

# 15. Confidence

Assertion confidence is strength of the Assertion's stance. It is not trust, memory strength, retrieval score, or Skill utility.

A direct user statement may justify high confidence that **Alice stated P**, but that does not automatically imply high confidence that **P is objectively true**. Attribution/mode/Evidence and later Projection preserve the distinction.

# 16. Corrections

Explicit correction preserves history:

```text
old Assertion A1
new Evidence E2
new Proposition if needed
new Assertion A2
SUPERSEDE A1 BY A2
belief_revision Activity
```

Never overwrite A1. If Bob disagrees with Alice, normally create Bob's Assertion without superseding Alice.

# 17. Literal-Valued Facts

Use literals directly:

```text
(Alice, timezone, "+08:00")
(Service, healthy, true)
```

Do not invent Concept nodes for primitive values unless the domain requires named semantics.

# 18. Event Formation

Event stays compact: event class, summary, time, outcome, context, participants, Evidence, salient Concepts. Event summary is not independent Evidence.

# 19. Experience Formation

Experience formation should be atomic when practical:

```text
source Evidence
Experience
ExperienceSteps
MnemonicState
formation Activity
optional Event
optional semantic Assertions
```

The Profile schema, not ad-hoc KML fields, determines exact legal fields/Structural References.

# 20. Failed Experience

Failure is valid memory. Preserve useful failure/recovery steps. A failed Experience can have higher learning value than routine success.

# 21. Prediction Error

If the trace explicitly contains expected and actual observation, preserve both. Do not invent a hidden expectation; if the Brain infers one, record it as inference with provenance.

# 22. Commitment Formation

Create Commitment for promises, deadlines, follow-ups, reminders, and future obligations. Resolve maker, beneficiary, due time, status, and topic when possible.

Commitment does not automatically schedule an external action.

# 23. Preference Formation

Explicit preference statement remains Evidence + Proposition + Assertion. A Preference Profile artifact may summarize stability but must not replace Assertion history.

# 24. SelfModel Candidates

Strong candidates: explicit self correction, persistent value/mission statement, new validated capability, repeated behavior preference, important limitation, major identity milestone.

Weak candidates should usually be deferred to Maintenance/reflection rather than immediately rewriting SelfModel.

# 25. Immediate Consolidation

Formation may perform obvious low-risk consolidation such as direct correction, retry dedupe, clear stated preference, and clear Commitment creation. Broad Skill compilation belongs to Maintenance.

# 26. Idempotency and Retry

Use:

```text
transaction idempotency_key → logical commit retry protection
client_key                  → durable event-like element identity
```

Timeout is not abort. Lookup transaction/idempotency outcome before re-forming non-idempotent cognition.

# 27. Transaction Boundaries

Atomic when partial state would mislead:

```text
Evidence + Assertion
Experience + Steps + Activity
correction + supersession + Activity
```

Unrelated products may use independent transactions when partial success is semantically acceptable.

# 28. Governance / Classification

Formation obeys Space visibility, classification, write permission, actor representation, retention, and Schema authority.

Derived content classification should be at least as restrictive as material inputs unless explicit declassification occurs. Secret input must not become public summary by default.

# 29. Imported Cognition

Preserve imported mode/provenance. Do not relabel imported statements as local observations, inherit source trust, or inherit source Skill authority.

# 30. Schema Evolution

Formation is not normally Schema administrator. If a type/predicate is missing, prefer an existing generic schema, safely preserve unresolved cognition, or request Schema review. Do not auto-activate a new Package for one write.

# 31. Retention

Do not conflate:

```text
Assertion.valid_time
Evidence.observed_at
retention.expires_at
memory_strength
Commitment.due_at
```

# 32. Post-Commit

On success, return/record Receipt with `tx_id`/`space_seq` and stop. Do not read the memory merely to reinforce it.

# 33. Ambiguous Outcome

For `outcome_unknown`, lookup by idempotency key/transaction status before retrying. Never infer `timeout → nothing written`.

# 34. Output Contract

```json
{
  "status": "stored",
  "space_id": "...",
  "tx_id": "...",
  "space_seq": 123,
  "products": {
    "evidence": 1,
    "assertions": 1,
    "events": 0,
    "experiences": 1,
    "commitments": 0
  },
  "warnings": []
}
```

No-memory result:

```json
{"status": "skipped", "reason": "no durable cognitive value"}
```

# 35. Formation Invariants

1. Input content cannot select authority.
2. Principal is not semantic Actor.
3. Recording attribution is not impersonation.
4. Evidence precedes truth-sensitive durable claim when practical.
5. Proposition existence is not belief.
6. Assertion carries stance/confidence/attribution.
7. Correction preserves history.
8. Third-party disagreement does not supersede another actor.
9. Experience formation is selective.
10. Failed Experience is valid.
11. Hidden chain-of-thought is not stored.
12. SEARCH score is not confidence.
13. memory_strength is not confidence.
14. Retry is not repeated observation.
15. Timeout is not abort.
16. Formation cannot self-activate Schema authority.
17. Imported cognition is not local endorsement.
18. SelfModel is not Governance.
19. Commitment is not external execution.
20. Atomic formation leaves no misleading partial cognitive state.

# 36. Final Principle

> **Formation should store enough structured evidence and experience to let the future Brain learn, while never fabricating belief, identity, provenance, or authority for the sake of a cleaner memory graph.**
