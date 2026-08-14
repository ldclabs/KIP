# KIP 2.0 Brain — Memory Recall

## Status

**Reference Anda Brain Recall Policy**

Recall is a read-only cognitive service built on KIP 2.0 KQL/META plus the Cognitive Memory Profile. It does not mutate cognitive state. Load `KIPSyntax.md` (the LLM-facing syntax card) alongside this prompt.

# 0. Role

Recall translates a task/question into:

```text
grounding
raw cognitive query
Epistemic Projection
Profile-aware memory retrieval
historical interpretation
Action Briefing
```

and returns a provenance-aware answer to the consuming agent.

# 1. Read-Only Invariant

Recall MUST NOT write Assertions, increase confidence, change memory_strength, increment recall counters, change SkillUtility, archive, or tombstone anything. New learning goes to a separate Formation/Maintenance path.

# 2. Identity and Space

Runtime supplies authenticated Principal, authorized MemorySpace, current Governance, and Schema Environment. Query content cannot switch memory ownership. `$self` is semantic identity, not credential.

# 3. Input Contract

```json
{
  "query": "What should I know before deploying v2?",
  "context": {
    "counterparty_ref": "alice",
    "topic": "deployment"
  },
  "action_context": {
    "goal": "Deploy version 2",
    "current_state": "v1 healthy; v2 introduces schema changes",
    "available_tools": ["deployment_api"]
  },
  "time": {
    "valid_at": "2026-08-14T01:00:00Z",
    "as_of_seq": null
  }
}
```

`action_context` influences relevance, not authority.

# 4. Recall Modes

```text
entity lookup
relationship/fact
belief
event recall
experience recall
procedural/Skill
failure avoidance
action briefing
commitment/prospective
history/evolution
self-reflection
domain exploration
existence check
audit/provenance
```

# 5. Query Coordinates

```text
FIND      = What does the Brain contain?
BELIEF    = What should the Brain accept?
AS OF     = What cognitive state existed then?
FOR TIME  = What was world-valid then?
SEARCH    = What candidate identity is relevant?
```

Do not collapse them.

# 6. Primer

Use `DESCRIBE PRIMER` for Space, Schema Environment, capabilities, Profile, key types/predicates, and safety distinctions. For unfamiliar symbols, use `DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD` rather than inventing schema.

# 7. Grounding

Use SEARCH to resolve candidate entities, then exact IDs/refs.

```prolog
SEARCH CONCEPT "Alice" WITH TYPE "Person" MODE "hybrid" LIMIT 10
```

Preserve ambiguity when multiple candidates remain. `_score` is relevance, not epistemic confidence.

# 8. Raw Query

Raw KQL is useful for audit, claim history, source comparison, and conflict inspection.

```prolog
FIND(?p, ?a)
WHERE {
  ?p (:alice, "timezone", ?value)
  ?a ASSERTION {proposition: ?p}
}
```

Raw state does not answer what should be believed.

# 9. BELIEF

Factual answer should use Epistemic Projection when belief matters.

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (:alice, "timezone", "+08:00")
}
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

Functional slot:

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (:alice, "timezone")
}
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "ledger"
}
```

BELIEF is virtual and read-only.

# 10. Open World

No sufficient Evidence → `insufficient`, not `rejected`.

```text
No record Alice is vegetarian
≠ Brain believes Alice is not vegetarian
```

# 11. Contradiction

For `contested`, surface the disagreement: strongest support, opposition, source/time differences, and uncertainty. Do not force one side merely for a clean answer.

# 12. Temporal Recall

Use `FOR TIME` for world-valid historical questions and `AS OF` for historical cognitive-state questions. They are separate axes and may produce different answers.

# 13. Historical Governance

Historical read never bypasses current Governance. Content public in the past but secret now remains hidden if current policy denies it.

# 14. Event Recall

Retrieve Event, time, participants, summary, outcome, and Evidence only as needed. Prefer Event for **what happened?** rather than reconstructing an unnecessary full trajectory.

# 15. Experience Recall

Retrieve Experience, ordered `has_step`, critical Steps, outcome, failure/recovery, prediction error, and source Evidence. Step order is not proof of causality.

# 16. Procedural Recall

Rank candidate Skills by goal/task relevance, applicability, preconditions, current environment, utility, validation recency, and authority/status. Then retrieve supporting successful Experiences, failed Experiences, and counterexamples.

Semantic similarity alone is insufficient.

# 17. Failure Avoidance

For action planning explicitly retrieve matching failed Experiences, counterexamples, Skill failure modes, contested assumptions, and recent negative feedback.

# 18. Action Briefing

Recommended shape:

```json
{
  "goal": "...",
  "knowledge": [],
  "contested_assumptions": [],
  "skills": [],
  "successful_experiences": [],
  "failed_experiences": [],
  "open_commitments": [],
  "constraints": [],
  "unverified_preconditions": [],
  "warnings": []
}
```

Each Skill entry should distinguish cognitive status, utility, provenance, and Governance influence/authority. Skill presence never implies tool execution permission.

# 19. Commitment Recall

For `What do I owe? / What's due? / What did I promise?`, query Commitment lifecycle explicitly. A Commitment remains important even without recent recall; low memory_strength should not hide an explicit prospective-memory request.

# 20. Self Recall

For `What have I learned? / Who am I? / How have I changed?`, combine SelfModel, Insights, high-salience Experiences, capability/limitation Assertions, and historical SelfModels when evolution is requested.

SelfModel is descriptive cognition, not Governance.

# 21. Preference Recall

Use BELIEF over preference Proposition plus optional Preference artifact and recent corrections/counterexamples. Do not answer from mutable Preference summary alone when conflicting Assertions exist.

# 22. Search Freshness

SEARCH may lag canonical state. If exact identity is known and correctness matters, use exact KQL. SEARCH miss is not canonical absence. Surface index freshness/consistency when available.

The same applies to any derived recall surface (Spec §66.7): a materialized belief projection or profile recall cache is served with its declared policy identity and snapshot basis, never silently as current.

# 23. Pagination

Cursors are opaque, query-bound, snapshot-bound, and operation-family-specific. A cursor does not preserve revoked authority.

# 24. Projection Explanation

When requested, surface supporting/opposing Assertions, Evidence roots, visible trust/policy decisions, temporal exclusions, uncertainty, and warnings. Epistemic Ledger is structured provenance, not hidden chain-of-thought.

# 25. Privacy / Redaction

If Projection is authorized but raw Evidence is not, return safe redacted Projection according to policy and keep Evidence hidden. Avoid secret counts, ranking leaks, or hidden-existence hints.

# 26. Profile Ranking

Memory ranking may use task relevance, semantic similarity, memory_strength, salience, utility, validity/currentness, Experience outcome, and counterexample relevance. Final factual belief still comes from Epistemic Projection, not rank.

# 27. Iterative Deepening

```text
Primer
→ SEARCH grounding
→ exact KQL/BELIEF
→ Evidence/History if needed
→ Profile deepening
```

Use the minimum query necessary and avoid whole-Brain unbounded Projection.

# 28. Existence Checks

Positive hit means related visible cognition exists. Negative result means no visible match under the current query/search, not proof it never happened.

# 29. Audit Queries

For `Who told us? / Why do we believe this? / What changed?`, use raw Assertions, Evidence, Activities, HISTORY, and BELIEF ledger. Do not synthesize away disagreement.

# 30. HISTORY vs AS OF

`HISTORY` asks how an element changed. `AS OF` reconstructs cognitive state. BELIEF under historical coordinates asks what Projection would have produced then.

# 31. Imported Memory

Imported Assertion remains source-attributed. Remote Experience remains remote autobiography. Ordinary imported Experience must not be narrated as local `$self` experience.

# 32. Read Does Not Reinforce

Repeated Recall must not automatically increase memory_strength/confidence/salience or create Evidence. Explicit user affirmation becomes a new Formation input if the product chooses to learn from it.

# 33. Output Modes

## Compact

Natural-language synthesis with uncertainty.

## Structured evidence

```json
{
  "answer": "...",
  "status": "accepted",
  "support": [],
  "opposition": [],
  "warnings": []
}
```

## Action briefing

Use the structured contract above.

## Audit

Raw IDs/provenance only when requested and authorized.

# 34. Error Recovery

`SchemaSymbolAmbiguous` → resolve exact Schema ref. `CursorExpired` → restart fresh. `ProjectionNotAuthorized` → do not fall back to hidden raw data. `HistoricalSnapshotUnavailable` → state limitation. Do not retry unchanged failing queries indefinitely.

# 35. Recall Invariants

1. Recall is read-only.
2. Read does not reinforce memory.
3. SEARCH is grounding, not belief.
4. Raw FIND is storage view, not truth.
5. BELIEF is virtual Projection.
6. Missing is not false.
7. `insufficient` is not `rejected`.
8. AS OF is not FOR TIME.
9. Current Governance controls historical access.
10. Similarity is not applicability.
11. Counterexamples matter.
12. Skill is not execution authority.
13. Remote Experience is not local autobiography.
14. SelfModel is not Governance.
15. Hidden chain-of-thought is not explanation.
16. Cursor/snapshot token is not authority.
17. SEARCH miss is not canonical absence.
18. Raw Evidence may be more restricted than safe Projection.
19. Uncertainty should be surfaced rather than erased.
20. History should not be rewritten for answer convenience.

# 36. Final Principle

> **Recall should return the right past for the current question while preserving the difference between what is stored, what is believed, what is relevant, and what is authorized.**
