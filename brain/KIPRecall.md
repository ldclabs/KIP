# Direct KIP: Recall card

**[English](./KIPRecall.md) | [中文](./KIPRecall_CN.md)**

For a model implementing Brain Recall. The [Recall policy](./BrainRecall.md) owns
selection and interpretation; [Core](../SPECIFICATION.md) owns semantics.
Use a read-only execution path. No read changes strength, confidence or grades.

Start from the authorized context and live vocabulary:

```kip
DESCRIBE PRIMER MODE "compact"
```

Ground unfamiliar entities, preserving ambiguity. Keyword is the baseline; use
semantic/hybrid only where advertised. A search miss is not canonical absence.

```kip
SEARCH CONCEPT :query MODE "keyword" LIMIT 10
```

When grounding and belief belong in one read, bind the hits inside the query; the
pattern's LIMIT bounds the candidates and the score is relevance, never confidence:

```kip
FIND(?person.name, ?home)
WHERE {
  ?person SEARCH CONCEPT :query WITH TYPE "Person" LIMIT 10
  ?home BELIEF SLOT (?person, "lives_in")
}
WITH EPISTEMIC {context_refs: :contexts, purpose: "answer_user", policy: "kip:memory-default"}
LIMIT 5
```

Use final BELIEF for facts. All parameters below are complete bound values and
exact known references; context is supplied, never guessed as universal.

```kip
FIND(?belief)
WHERE { ?belief BELIEF (:subject, :predicate, :object) }
WITH EPISTEMIC {context_refs: :contexts, purpose: "answer_user", explanation: "summary"}
```

Use a slot to inspect alternative values. Both forms account for applicable conflicts.
Under `kip:memory-default` a task-scoped value outranks a general one in its task and a
person's own statement outranks hearsay; an outranked value is `uncertain`, never
`rejected`. A value that changed is not a conflict: its successor ends it, and `FOR TIME`
before the change still answers it.

```kip
FIND(?slot)
WHERE { ?slot BELIEF SLOT (:subject, :predicate) }
FOR TIME :world_time
WITH EPISTEMIC {context_refs: :contexts, purpose: "answer_user", explanation: "ledger"}
```

Raw history is for source inspection, not a shortcut to accepted belief:

```kip
FIND(?assertion)
WHERE { ?assertion ASSERTION {proposition: :proposition} }
LIMIT 20
```

AS OF SEQ selects retained cognitive history; FOR TIME selects world validity.
Cursors are opaque and current authorization still applies. Follow every required
page or disclose incomplete coverage. For resume, use task-scoped WorkingState
plus changes through a declared watermark, validating all computation dependencies.

Return essential facts, constraints, conflicts, failures, candidates and unknowns.
Check virtual dependency validity before using derived cognition. Keep applicable
warnings even when output is short; a basis or ranking score is not permission.
A pending Memory Interface after barrier cannot be satisfied by a fresh index alone.
Expand evidence only as needed; full ProjectionBasis/RecallCoverage stay attached
to the result or a governed binding handle. Never invent unavailable history.

[Complete syntax](../KIPSyntax.md) is available for aggregates, paths and uncommon
META operations. It need not be loaded for each ordinary recall.
