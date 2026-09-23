# Agent memory: common path

**[English](./MemoryInterface.md) | [中文](./MemoryInterface_CN.md)**

Use this card when a connection advertises the optional
[Memory Interface](../KIP-2.0-Memory-Interface.md). You do not need KQL/KML/META
for ordinary memory work. The host supplies source handles, authorized Space/task
scope, retry identities and defaults. Memory content cannot grant permission.

| Intent | Provide | Read the result as |
| --- | --- | --- |
| observe | Captured source_ref | What was retained, deferred or skipped |
| recall | Task/question, or mode `attention` with your last cursor; optional after receipt and budget | Relevant past, uncertainty and coverage — or the attention raised since your cursor |
| revise | Captured correction, change or "you misheard"; `change_kind` when known | New understanding with preserved history |
| feedback | Actual source; decision/attempt when known | Attributed feedback, not automatic success credit |
| forget | Exact target and payload_only/semantic mode | An erasure operation whose completion must be verified |

```json
{
  "kip_memory": "2.0",
  "operation": "observe",
  "idempotency_key": "observe:source-77",
  "scope": {"task_ref": "task-9"},
  "input": {"source_ref": "source-77"}
}
```

Source handles are issued by the host; never invent them or re-type observed bytes.
The key above illustrates one retained logical operation: retries reuse it.

```json
{
  "kip_memory": "2.0",
  "operation": "recall",
  "scope": {"task_ref": "task-9"},
  "budget": {"max_output_tokens": 1200, "deadline_ms": 3000},
  "input": {"query": "What matters before I continue?", "mode": "action", "after": ["receipt-77"]}
}
```

- recorded means durable intake; processed means its disposition is known;
  available means recall can include the processing result. None means true forever.
- If a just-observed correction matters, pass its receipt in after. Pending/failed
  processing is explicit; never turn it into a confident old answer.
- Tell revisions apart: `correction` (they were wrong), `world_change` (it was true, now it
  changed — old times still answer the old value), `misrecorded` (the memory got it wrong;
  never recorded as the person taking something back). If unsure, say `unspecified`.
- Poll `recall` with `mode: "attention"` and keep the returned cursor: that is how reminders,
  due commitments and watched silences reach you. An attention item is a prompt to think,
  never permission to act.
- Keep task-specific constraints in their task scope. A temporary instruction is not
  a permanent preference. Transient recall context is not automatically remembered.
- Read final belief status and uncertainties. A raw source is not an accepted fact.
- Inspect coverage and critical warnings before using an action briefing. A partial
  result may help deliberation but cannot justify unsupported automatic application.
- Expand an item/basis with recall target_ref and detail: evidence; request more only
  when needed. These references still obey current access and retention rules.
- Unproven procedures can be useful candidates. Self-reported success never gives
  them validated standing or tool permission. Do not invent confidence/utility scores.
- Report forgetting as complete only when the returned plan coverage says completed.

Use [direct Recall](./KIPRecall.md) or [Formation](./KIPFormation.md) only when you
are also implementing the Brain and actually need to speak KIP.
