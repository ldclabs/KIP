# KIP 2.0 Memory Interface

**[English](./KIP-2.0-Memory-Interface.md) | [中文](./KIP-2.0-Memory-Interface_CN.md)**

**Normative optional binding, 2.0-draft.** This document defines the small Interface between a business Agent and a Brain Module. The Brain uses KQL/KML/META to operate a Cognitive Nexus. No Core kind or Schema identity is added. The wire shapes are in `schemas/kip-memory.schema.json`; acceptance scenarios are in `conformance/KIP-2.0-Memory-Interface-Tests.md`. Normative keywords follow Specification §0: only capitalized keywords state requirements.

## 1. Two Interfaces, one state contract

```text
Business Agent      observe / recall / revise / feedback / forget
                          ↕ Memory Interface
Brain Module        task interpretation, formation, retrieval and policy
                          ↕ KIP: KQL / KML / META
Cognitive Nexus     governed, attributable, correctable durable state
```

A Brain can be embedded in the acting Agent, implemented with a dedicated model, or combine deterministic code and selective model calls. These are Adapters at the same Interface. A binding MUST preserve Core and every contract its level names; a smaller Interface never weakens them.

The five intents below have one request shape, one intent per request. Raw KIP remains available to authorized tooling; a Memory Interface request is not command text and MUST NOT be sent to a KQL/KML parser. Implementing a Nexus alone does not imply implementing this binding.

## 2. Levels

The level registry is `profiles/memory-bundles.json`. Each level names the Nexus conformance level it runs on (Specification §89) and the capabilities it adds (Specification §67.4). Levels are named combinations of obligations, not new Schema packages.

| Level | Required behavior | Runs on | Depends on |
| --- | --- | --- | --- |
| `memory_basic` | All five intents; source-first admission, final belief under `kip:memory-default`, one-write world change, the misrecording route, scoped recall, attention recall, governed forgetting and progress barriers | KIP-Core with `kip://profiles/cognitive-memory@2.0.0` activated | — |
| `memory_experience` | Event/Experience reconstruction and immutable, explicitly unproven procedural candidates | KIP-CognitiveMemory | memory_basic |
| `memory_learning` | Instrumented independent attempts, comparable trials, replayable evaluations and validated standing ([Validated Learning](./brain/KIP-2.0-Validated-Learning.md)) | KIP-CognitiveMemory | memory_experience |

A deployment MUST advertise level dependencies transitively. An operation of an unadvertised level fails `UnsupportedCapability`; an available type name never implies that its lifecycle or worker behavior is implemented. A basic implementation MAY use only the domain and memory symbols it needs, and MUST NOT accept unsupported procedural mutations, claim validated learning, or invent empty coverage for an unimplemented channel.

Restart-safe attention, leases and dispatch ([Brain Runtime](./brain/KIP-2.0-Brain-Runtime.md)) and governed Capsule exchange are not levels: a binding advertises the Nexus capabilities `durable_brain_runtime`, `receiver_fencing`, `capsule_export` and `capsule_import` (Specification §67.4) beside its levels, and claims exactly what those capabilities define.

`memory_basic` needs no trial, no grading and no durable worker: ordinary facts, preferences and recalled failures are memory without them. It does need the standard memory package: `prefers`, Commitment and Watch are its symbols, so the level runs on a KIP-Core Nexus with `cognitive-memory@2.0.0` activated, without requiring the dependency-validity and computed-strength engine features of the KIP-CognitiveMemory level. Dependency validity (Specification §57.6) binds any derived artifact the Brain writes; a Brain that writes none needs no DependencyBasis. A procedural candidate MAY inform deliberation as unproven under `memory_experience`; only `memory_learning` confers validated standing, and consumers MUST still validate the retained evaluation when they read it. The full `KIP-CognitiveMemory` Profile remains the standard contract; a narrower level does not claim it, and stored symbol refs keep their lineage.

A deployment advertising `memory_interface` exposes the binding's transport in its normal connection setup. Its descriptor identifies the binding version (`kip_memory`), the available levels, a safe default Space and scope, the supported tokenizer and the default output and deadline budgets; it MAY be included in `DESCRIBE PRIMER`'s extension data. A raw Nexus MUST NOT advertise a binding or level its connected Brain cannot serve. Capability availability is never permission to read or mutate any object.

## 3. Request and scope

`kip_memory` is the binding's wire version. A draft revision of this binding is identified by the digest of `schemas/kip-memory.schema.json`, not by a dated contract name (Specification Status).

The optional `requires` list names the levels a request needs. The Adapter MUST check all of them before intake or mutation; an unknown or unavailable level fails `UnsupportedCapability`. Omitting the list means `memory_basic`, never a guessed advanced level. This check never replaces per-operation Governance.

```json
{
  "kip_memory": "2.0",
  "operation": "observe",
  "scope": {"task_ref": "task-9"},
  "idempotency_key": "observe:source-77",
  "input": {"source_ref": "source-77"}
}
```

Runtime authentication and authorized Space resolution use Core rules; `space` MAY be omitted only when the connection has a safe default. `scope.task_ref` is an existing, authorized task or context handle, and `context_refs` are exact references. The Adapter resolves these into the canonical context set of the ProjectionBasis (Specification §25.3). Task labels, topic strings and message content MUST NOT select ownership or authority. An unknown or ambiguous scope fails or is explicitly deferred; it is never silently widened. A task-scoped observation stays scoped through extraction and consolidation (Profile §20.3): a one-task instruction does not become a durable global preference.

`source_ref` names an immutable source already captured by the host — a message, a tool trace, an Evidence element or a staged source artifact. The host supplies its exact bytes, source identity and digest, and the model cites the handle instead of re-typing the payload. A `source_ref` is not a URL or a credential. A missing source fails existence-neutrally; a fabricated source role, observer identity or `outcome` classification never bypasses Governance.

Mutation requests REQUIRE an idempotency key. The Adapter or SDK SHOULD generate and retain it from the logical input identity; models need not invent retry metadata. The key's scope includes the authenticated namespace, Space and intent; its semantic digest covers the intent, the resolved scope and the input, including the immutable source identity and digest, and excludes transport `request_id` and response budgets.

```text
same key, same meaning       replay the original acknowledgement; never re-run extraction
                             or re-enqueue work; a retry is never new evidence
same key, different meaning  IdempotencyConflict
expired retention            reported explicitly under Core recovery rules (§80.4),
                             never treated as a fresh observation
```

A replay uses the retained input identity and capture digest and rechecks current access; it MUST NOT require an already captured staging handle to remain live. Changed input or a conflicting source digest still fails.

## 4. Five intents

| Intent | Input | Effect |
| --- | --- | --- |
| observe | source_ref | Capture/resolve the source, admit useful memory, or explicitly retain, defer or skip it |
| recall | query, target_ref or mode `attention`; optional mode, context and after | Read a bounded briefing, expand an earlier result, or collect raised attention |
| revise | source_ref; optional target_ref and change_kind | Record a correction, a world change or a misrecording, each with its own history |
| feedback | source_ref; optional decision_ref/attempt_ref | Preserve feedback with its actual origin; it is not automatically a grade |
| forget | target_ref and mode `payload_only` or `semantic` | Execute a bounded, governed ErasurePlan and report actual coverage |

**recall.** `mode` is `answer` (default), `action`, `resume` or `attention`.

- `resume` is scoped to the current task: a global WorkingState is filtered or rebuilt at the requested scope, never served as another task's working context, and a resume briefing MUST include the attention items raised in that scope since the task's last attention cursor.
- `attention` returns the attention the Brain raised — fired Watches (`watch_fired`) and due Commitments (`commitment_due`), as `AttentionItem`s — after the request's `attention_cursor`, with a new cursor. Every item is raised by a commit: a `watch_fire` Activity, or a `commitment_review` Activity that recorded the Commitment as due (Profile §5.7, §17); the item's `raised_seq` is that commit's `space_seq`, which is what the cursor orders by. The passing of a due time raises nothing by itself. This is how proactive memory reaches the business Agent without a push channel; a deployment MAY additionally deliver the same items over a push transport it advertises. Attention recall is read-only: the host keeps the cursor, and consuming an item changes nothing in memory. **An attention item grants nothing** (Profile §5.11); acting on it passes the action gate and Governance like any other act.
- `input.context` is transient caller-supplied situation, never an implicit write. `detail: "evidence"` expands a target under current Governance; it is not a sixth intent and mutates nothing.
- `input.time` separates `valid_at` (world time) from `as_of_seq` (retained cognitive history). Historical reads require the underlying capability and retained historical control state (Specification §48.6); unsupported requests fail explicitly. An `after` barrier newer than an explicitly fixed `as_of_seq` fails `PreconditionFailed` rather than waiting forever or silently advancing the snapshot.

**revise.** `change_kind` names which of three histories the source describes (Specification §14.2):

```text
correction     the actor's earlier claim was wrong          → supersession by the same actor
world_change   the world moved on                           → one new Assertion from the change;
                                                               temporal succession ends the old one (§25.4)
misrecorded    the Brain recorded what the actor never said → recording repair (§57.8)
unspecified    the Adapter decides and discloses its choice; it never supersedes on a guess
```

`change_kind` expresses intent, not authority to supersede another actor. For `misrecorded`, a Brain whose Nexus advertises `recording_repair` MUST use it; one without it MUST NOT map the request to `correction` or `world_change` — which would forge the actor's withdrawal — and instead fails `UnsupportedCapability`, or, where the deployment grants `quarantine`, quarantines the extraction and returns `partial` with that disclosure. An unclear actor, target, context or change time stays explicit: the Adapter preserves the Evidence and reports the gap rather than manufacturing a precise revision, and a change time it does not know is written as a time bound, never as an invented instant (Specification §25.5). For a value-only correction, the Adapter explicitly preserves the corrected world interval under Specification §14.2; `asserted_at` remains the correction time, not the original statement time. Each coherent revision is atomic.

**feedback.** Self-reports are recorded as `agent_statement` and human feedback as attributed Evidence. Only authorized instrumentation with the required decision, attempt and observer bindings writes gradable outcomes (Validated Learning §3). Feedback never promotes a Skill by itself, and ordinary descriptive feedback requires no learning level.

**forget.** Forgetting runs an ErasurePlan (Specification §60.7). The target is an exact, bounded selection handle or element reference, never model-generated command text. The plan rechecks scope, holds, authority and concurrent copies. An acknowledgement is not completed erasure: pending, partial or blocked coverage stays visible, and `completed` is returned only after every in-scope controlled surface is verified. Prior external exports remain outside the local guarantee. Policy-required approval goes through existing Governance (§29.11); the binding grants no additional authority, and under the single-agent preset (Specification §30.5) a `semantic` forget is the owner's decision.

## 5. Processing receipt and read barrier

A successful intake durably records its source and intent, and either its result or its pending work, before returning an opaque `receipt_ref`. The immutable acknowledgement contains the intent, Space and `accepted_seq`. It is distinct from a KIP Transaction Receipt: one memory intent MAY produce several later transactions. A same-key replay returns the original acknowledgement; current progress is a separately identified read view, never a rewritten transaction outcome, so an intake replay MAY repeat its original acknowledgement after work finishes while `recall` with `after` reads current progress.

Admission and retention checks precede persistent source capture. When policy requires skipping the source bytes, the Adapter retains only permitted non-content intake and disposition data; it MUST NOT store a secret first merely to issue a receipt. A no-effect skip MAY use the current Space sequence without allocating a cognitive commit. A denied intake binds no idempotency key and fabricates no capture.

Progress has four phases:

| Phase | Meaning |
| --- | --- |
| recorded | Intake is durable; semantic processing may still be pending or deferred |
| processed | All admitted input has a terminal disposition; `resolved_seq` pins the completed formation effects |
| available | Recall can include those effects and omissions at `available_seq`, through aligned indexes or exact/source fallback |
| failed | Processing cannot complete; the reason is explicit, never reported as successful memory |

Processed dispositions are `formed`, `evidence_only` or `skipped`; `erased` is used only for a completed forget. `evidence_only` and `skipped` are honest terminal outcomes, not claims of learned knowledge. Deferred work remains `recorded`. A failure MAY leave durable source material, which is not described as rolled back when it was committed. A retry of intake does not restart failed work; a new explicit processing attempt keeps the same source identity and has its own audited operation.

For each receipt, `accepted_seq <= resolved_seq <= available_seq` where present. Phases are monotone, except that a `recorded` or `processed` operation MAY fail. `available` records the completed processing horizon — not permanent truth, retention, permission or index freshness — and later corrections and erasure do not resurrect data because an old receipt was once available. Every recall still checks its current ProjectionBasis, dependencies and Governance.

For mutation responses, `succeeded` REQUIRES available progress; recorded or processed work returns `pending` or `partial`, and a terminal processing failure returns `failed` with its error. For `forget`, `succeeded` additionally REQUIRES completed erasure and the `erased` disposition. For `recall`, `succeeded` REQUIRES complete declared coverage and every `after` barrier; anything less is `pending` or `partial` with `action_eligible: false`. No status by itself means a belief is accepted or an external action is authorized.

```json
{
  "kip_memory": "2.0",
  "operation": "recall",
  "scope": {"task_ref": "task-9"},
  "budget": {"max_output_tokens": 1200, "deadline_ms": 3000},
  "input": {
    "query": "Continue the deployment; what changed since my last observation?",
    "mode": "action",
    "after": ["receipt-77"]
  }
}
```

`after` is a processing barrier, not a request for an old snapshot. Every named receipt MUST be authorized, from the same Space, and accounted for. A successful barrier REQUIRES available progress and a recall basis at least as new as its `available_seq`; the Adapter additionally checks the requested scope and every current basis dependency. Source processing, index freshness and query completeness are separate obligations: an aligned index alone does not mean extraction ran, and an `evidence_only` or `skipped` disposition satisfies processing accounting, not semantic coverage. Evidence-only results remain retrievable with their unresolved meaning disclosed. When unresolved source material may change a task-critical answer, the Adapter discloses the gap and marks the affected channel or precondition incomplete; it MUST NOT present an older structured fact as an unqualified current answer. A policy skip that contradicts an explicit correction request is explained, never hidden as successful learning.

At the deadline, pending input yields `pending` or `partial`, explicit unresolved receipt refs and `action_eligible: false`; failed input yields `failed` or `partial` with its reason. Missing, expired or inaccessible progress cannot satisfy a barrier (`NotFoundOrNotVisible` or `ArtifactUnavailable`, without hidden counts). A fallback MAY satisfy a barrier only after processing has a terminal disposition and recall can include it; raw source availability never stands in for extraction that did not run. Recall performs no cognitive mutation: workers progress independently, and recall waits, inspects or returns `pending`.

### 5.1 Source order

Host-captured **SourceOrder** identifies a source stream and event, a stable ordinal, and explicit predecessor processing receipts. These are transport attestations, never ordering claims inferred from payload text or worker completion times. A revision MUST NOT be formed before its required predecessors have terminal dispositions; failed or deferred predecessors remain visible blockers. Independent streams MAY progress concurrently, and an ordinal does not assert that missing predecessors are complete. A late historical observation keeps its world time and never overwrites the current value merely because its processing committed later — temporal succession orders values by their start, not by commit order (Specification §25.4). The Adapter therefore writes every Assertion it forms from a captured source with `asserted_at` set to the source's observed time (Specification §13.2), never to the time formation ran: a source processed late otherwise takes today's start key and ends the current value.

Formation MAY implement this with a durable per-stream queue or with a verified commutative revision reconciler; either way, the same causally ordered corrections converge under every worker completion order, including retries and restarts. Session adapters retain the set of outstanding receipts and supply `recall.after` automatically (the `MemorySession` helper in `@ldclabs/kip-lang`); they never replace an incomplete earlier receipt with a maximum sequence.

## 6. Compact recall with expandable evidence

The binding returns a summary, typed items, coverage and an opaque `basis_ref`. Each truth-sensitive item carries its final epistemic status under the disclosed policy (by default `kip:memory-default`, Specification §21.13); raw source material is labeled `source`, never silently presented as accepted knowledge. Every item has an immutable result reference and evidence refs. Expanding a reference reads the version and basis that produced the item, subject to current Governance and retention; it never silently substitutes a newer version. Unknowns and important warnings appear in the compact result, not behind the expansion handle.

Procedure items disclose standing — `unproven`, `validated`, `revoked` or `unverifiable` (Profile §14) — and their result references pin the exact SkillRevision and any evaluation used. An action gate resolves and rechecks that version and never substitutes a later `current_revision`. Validated standing is served only under the learning level and still grants no execution permission.

The Adapter retains the actual per-channel RecallPlans (Profile §20.2), the full ProjectionBasis, the dependency decisions and the RecallCoverage behind `basis_ref`; `detail: "evidence"` returns them in their normative shapes. This changes the model-facing view, not the KQL wire contract. A reference does not grant access, and expired audit material is reported unavailable. Where the Nexus keeps an exposure log (Specification §66.8), the Adapter records `retrieved` for the items it returns.

A `continuation_ref` used as a recall `target_ref` continues the same query and basis. Changing its scope, query or required `after` horizon fails `CursorMismatch` when the traversal cannot be preserved; start a new recall instead of mixing pages from different bases. Current authorization applies to every expansion and page.

Coverage names the channels `constraints`, `commitments`, `dependencies`, `failures`, `experiences`, `skills` and `evidence`, each `complete`, `incomplete` or `not_applicable`. `not_applicable` REQUIRES an authoritative determination that the channel is irrelevant or absent in this scope; missing support or incomplete traversal MUST NOT be relabeled `not_applicable`, and retained content whose channel cannot be served makes coverage incomplete. An unadvertised level alone does not establish that its channels are absent: an existing Space, raw KIP tooling or Capsule import may have retained content in them. A basic deployment MAY report such a channel `not_applicable` only after an authoritative scoped absence or irrelevance determination; if retained relevant content cannot be served, the channel is `incomplete`. These guarantees concern the authorized recorded universe, never a claim to have searched the world.

Critical applicable constraints and warnings take priority over ordinary similarity. A truncated required channel, an unsatisfied barrier or an unverified necessary precondition prevents automatic application. `action_eligible` describes memory sufficiency, never authorization to execute. Read-only exposure never reinforces confidence, strength or utility. Requested budgets are bounded, and unsatisfied coverage is returned explicitly rather than hidden to fit a short answer.

`max_output_tokens` bounds the serialized successful model-facing result under the advertised tokenizer (or an explicitly supported requested one), counting metadata as well as prose. When even the mandatory diagnostics and coverage cannot fit, the Adapter returns a bounded `ResultLimitExceeded` diagnostic; it never drops warnings or treats a byte or character count as a token count. Errors MAY exceed an impossibly small content budget. The descriptor publishes defaults and the minimum useful response size; expansions have their own budget.

## 7. Responsibility and use of facts

Models choose semantic intent, the evidence they actually used and the ambiguity they could not resolve. Adapters generate mechanical digests, capture real read pins, retain idempotency keys, process pagination and manage worker and receipt state. Adapters MUST NOT invent which evidence a model used, restamp stale inputs or fill in missing numeric confidence, salience or utility; a supplied estimate stays attributed, and an ordinary memory is admitted without guessed scores.

Authorized factual memory MAY inform a decision within its allowed purpose and scope; it needs no procedural promotion merely because a plan uses the fact. Instruction adoption and external execution remain separately controlled: Core §31.3 authority classes specify permitted uses and enforceable operation checks, and do not claim that a Nexus can prove an exposed token had no internal influence on a model. Self-model content never becomes policy or permission.

## 8. Conformance

Raw KIP clients and the full Cognitive Memory Profile keep their contracts; the Memory Interface is optional and advertised explicitly. The common path loads `brain/MemoryInterface.md`; direct KIP users load only the role card they need. Binding obligations are tested through the five intents (`conformance/KIP-2.0-Memory-Interface-Tests.md`), including delayed formation, pending barriers, source-only retrieval, task isolation, idempotent intake, feedback origin, erasure, constrained output, and the positive memory scenarios: a new fact becomes recallable, a correction changes the answer, a world change answers old and new times, a preference changes within its kind, a misrecording is repaired without an actor withdrawal, an unasked constraint surfaces, and a due Commitment reaches attention recall. Model results are not engine results. Compare raw KIP with the binding over the same Nexus, memory policy and input corpus before claiming lower cost or higher model reliability (BrainEvaluation §6).
