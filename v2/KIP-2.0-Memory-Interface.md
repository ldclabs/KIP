# KIP 2.0 Memory Interface

**[English](./KIP-2.0-Memory-Interface.md) | [中文](./KIP-2.0-Memory-Interface_CN.md)**

**Normative optional binding, 2.0-draft.** This document defines the small Interface
between a business Agent and a Brain Module. The Brain uses KQL/KML/META to operate
a Cognitive Nexus. No new KIP command keyword, Core kind or Schema identity is added.
The wire shapes are in `schemas/kip-memory.schema.json`; acceptance scenarios are in
`conformance/KIP-2.0-Memory-Interface-Tests.md`.

## 1. Two Interfaces, one state contract

```text
Business Agent      observe / recall / revise / feedback / forget
                          ↕ Memory Interface
Brain Module        task interpretation, formation, retrieval and policy
                          ↕ KIP: KQL / KML / META
Cognitive Nexus     governed, attributable, correctable durable state
```

A Brain can be embedded in the acting Agent, implemented with a dedicated model,
or combine deterministic code and selective model calls. These are Adapters at
the same Interface. A binding MUST preserve Core and the applicable Cognitive
Consistency contracts; using a smaller Interface never weakens them.

The five intents below have one request shape, one intent per request. Raw KIP
remains available to authorized tooling independently; a Memory Interface request
is not command text and MUST NOT be sent to a KQL/KML parser. Implementing a Nexus
alone does not imply implementing this binding.

## 2. Capability bundles

The bundle registry is `profiles/memory-bundles.json`. These are named combinations
of obligations, not new Schema packages or new meanings of existing profiles.

| Bundle | Required behavior | Depends on |
| --- | --- | --- |
| `memory_basic` | All five intents; source-first admission, final belief, scoped recall, explicit correction, governed forgetting and progress barriers | Core read/write semantics |
| `memory_experience` | Event/Experience reconstruction and immutable, explicitly unproven procedural candidates | memory_basic |
| `memory_learning` | Instrumented independent attempts, comparable trials, replayable evaluations and validated standing | memory_experience |
| `memory_durable` | Restart-safe attention, leases, dispatch and reconciliation | memory_basic |
| `memory_exchange` | Governed Capsule export/import, identity and origin preservation | memory_basic |

Bundle dependencies MUST be advertised transitively. Unsupported bundle operations
fail `UnsupportedCapability`; an available type name never implies its lifecycle
or worker behavior is implemented. A basic implementation MAY use only the domain
and memory symbols it needs. It MUST NOT accept unsupported procedural mutations,
claim validated learning, or invent empty coverage for an unimplemented channel.

The existing `KIP-CognitiveMemory` profile remains the full standard contract.
A narrower bundle claim does not claim that profile. Existing stored symbol refs,
including `kip://profiles/cognitive-memory@2.1.0`, retain their meaning and lineage;
no Person/Skill identity is moved to a new package path to achieve this split.
A package is a vocabulary/validation artifact, not an automatic claim that every
operation in its vocabulary is available. All Core protections apply in every bundle.

`memory_basic` includes `ASSERT`, `MUTATE`, ingestion, read-only execution,
idempotency and dependency validation for derived content. Ordinary facts,
preferences and recalled failures need no trial or GradingState. A procedural
candidate may inform deliberation as unproven under `memory_experience`; only
`memory_learning` may confer validated local standing. Its consumers MUST still
validate retained evaluations when reading claimed standing.

A deployment advertising `memory_interface` exposes the binding's transport in its
normal connection setup. Its descriptor identifies the binding version, available
bundles, safe default Space/scope, supported tokenizer and default output/deadline
budgets. It may be included in `DESCRIBE PRIMER`'s extension data. A raw Nexus must
not advertise a binding or bundle that its connected Brain cannot actually serve.
Capability availability is never permission to read or mutate every object.

## 3. Request and scope

The optional requires list names bundles needed by this request. The Adapter checks
all of them before intake or mutation; unknown/unavailable requirements fail
UnsupportedCapability. Omitting the list uses memory_basic, not a guessed advanced
capability. This requirement check never replaces per-operation Governance.

```json
{
  "kip_memory": "2.0",
  "operation": "observe",
  "scope": {"task_ref": "task-9"},
  "idempotency_key": "observe:source-77",
  "input": {"source_ref": "source-77"}
}
```

Runtime authentication and authorized Space resolution use Core rules. `space`
is optional only when the connection has a safe default. `scope.task_ref` is an
existing, authorized task/context handle; `context_refs` are exact references.
The Adapter resolves these into the canonical context set of ProjectionBasis.
Task labels, topic strings and message content cannot select ownership or authority.
An unknown/ambiguous scope fails or is explicitly deferred, never widened silently.
A task-scoped observation stays scoped through extraction and consolidation; a
one-task instruction is not automatically promoted into a durable global preference.

`source_ref` names an immutable source already captured by the host: a message,
tool trace, Evidence or staged source artifact. The host supplies its exact bytes,
source identity and digest. The model cites the handle instead of re-typing payload.
It is not a URL or a credential. Missing sources fail existence-neutrally; fabricated
source role, observer identity and `outcome` classification never bypass Governance.

Mutation requests require an idempotency key. The Adapter/SDK should generate and
retain it from the logical input identity; models need not invent retry metadata.
The scope includes authenticated namespace, Space and intent. The semantic digest
covers intent, resolved scope and input, including immutable source identity/digest;
transport request_id and response budgets are excluded. Same key and same meaning
replay the original acknowledgement without re-running extraction or re-enqueuing
work. Different meaning fails `IdempotencyConflict`. A retry is never new evidence.
Replay uses the retained input identity/capture digest and rechecks current access;
it MUST NOT require an already captured staging handle to remain live. Changed
input or a conflicting source digest still fails. Expired idempotency retention is
reported explicitly using Core recovery rules, never treated as a fresh observation.


## 4. Five intents

| Intent | Input | Effect |
| --- | --- | --- |
| observe | source_ref | Capture/resolve source, admit useful memory or explicitly retain/defer/skip it |
| recall | query or target_ref; optional mode, context and after | Read a bounded task briefing or expand an earlier result's evidence |
| revise | source_ref; optional target_ref and change_kind | Record correction or world change using new Assertions and appropriate intervals |
| feedback | source_ref; optional decision_ref/attempt_ref | Preserve feedback with its actual origin; it is not automatically a grade |
| forget | target_ref and mode: payload_only or semantic | Execute a bounded, governed ErasurePlan and report actual coverage |

`recall.mode` is answer (default), action or resume. Resume is scoped to the current
task; a global WorkingState is filtered/rebuilt at the requested scope, never served
as another task's working context. `input.context` is transient caller-supplied
situation, not an implicit write. `detail: evidence` expands a target under current
Governance; it does not add a sixth intent or mutate recall counters.
Optional input.time separates valid_at (world time) from as_of_seq (retained cognitive
history). Historical reads require the underlying capability and historical control
state; unsupported requests fail explicitly. An after barrier newer than an explicitly
fixed as_of_seq fails PreconditionFailed rather than waiting forever or silently
advancing the requested historical snapshot.


`revise.change_kind` is correction, world_change or unspecified. It expresses
intent, not authority to supersede another actor. Unclear actor, target, context or
change time remains explicit; the Adapter preserves Evidence and reports the gap
rather than manufacturing a precise revision. Each coherent revision is atomic.

`feedback` accepts self-reports as agent_statement and human feedback as attributed
Evidence. Only authorized instrumentation with the required decision/attempt and
observer bindings can write gradable outcomes. Feedback never promotes a Skill by
itself and requires no learning bundle for ordinary descriptive feedback.

`forget` reuses Cognitive Consistency §8 and Core §60. The target is an exact,
bounded selection handle or element reference, not arbitrary model-generated code.
The plan rechecks scope, holds, authority and concurrent copies. An acknowledgement
is not completed erasure. Pending, partial or blocked coverage stays visible;
completed is returned only after all in-scope controlled surfaces are verified.
Prior external exports remain outside the local guarantee. Policy-required approval
is handled through existing Governance; the binding grants no additional authority.

## 5. Processing receipt and read barrier

A successful intake durably records its source/intent and either its result or its
pending work before returning an opaque `receipt_ref`. The immutable acknowledgement
contains intent, Space and accepted_seq. It is distinct from the underlying KIP
Transaction Receipt; one memory intent may produce several later transactions.
A same-key replay returns that original acknowledgement. Current progress is a
separately identified read view, never a rewritten original transaction outcome.
An intake replay may therefore repeat its original recorded acknowledgement after
work finishes; recall with after reads current progress. It does not regress it.

Admission and retention checks precede persistent source capture. If policy requires
skipping source bytes, retain only permitted non-content intake/disposition data;
do not store a secret first merely to issue a receipt. A no-effect skip may use the
current Space sequence without allocating a cognitive commit. Denied intake does
not bind an idempotency key or fabricate successful capture.

Progress has four phases:

| Phase | Meaning |
| --- | --- |
| recorded | Intake is durable; semantic processing may still be pending/deferred |
| processed | All admitted input has a terminal disposition; resolved_seq pins the completed formation effects |
| available | Recall can include those effects and omissions at available_seq through aligned indexes or exact/source fallback |
| failed | Processing cannot complete; the reason is explicit, never reported as successful memory |

Processed dispositions are formed, evidence_only or skipped; erased is used only
for completed forget. Evidence-only/skipped is an honest terminal outcome, not a
claim of learned knowledge. Deferred work remains recorded, not processed. A failure
may leave durable source material, which must not be described as rolled back if it
was already committed. A retry of intake does not restart failed work; a new explicit
processing attempt keeps the same source identity and its own audited operation.

For each receipt, accepted_seq <= resolved_seq <= available_seq where present.
The progress phases are monotone, except a recorded/processed operation may fail.
Available records the completed processing horizon, not permanent truth, retention,
permission or index freshness. Later corrections and erasure do not resurrect data
because an old receipt was once available. Every recall still checks its current
ProjectionBasis, dependencies and Governance.

For mutation responses, succeeded requires available progress; recorded/processed
work returns pending or partial. A terminal processing failure returns failed with
its error. For forget, succeeded additionally requires completed erasure and the
erased disposition. For recall, succeeded requires complete declared coverage and
all after barriers; incomplete results are pending/partial with action_eligible=false.
No status by itself means a belief is accepted or an external action is authorized.

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

`after` is a processing barrier, not a request to return an old snapshot. Every
named receipt must be authorized, from the same Space, and accounted for. A
successful barrier requires available progress and a recall basis at least as new
as its available_seq. The Adapter additionally checks the requested scope and all
current basis dependencies. Source processing, index freshness and query completeness
are separate obligations. Evidence-only results remain retrievable with their
unresolved meaning disclosed; an aligned index alone does not mean extraction ran.
An Evidence-only/skipped disposition satisfies processing accounting, not semantic
coverage. If unresolved source material may change a task-critical answer, disclose
that gap and mark the affected channel/precondition incomplete; do not present the
older structured fact as an unqualified current answer. A policy skip that contradicts
an explicit correction request must be explained, never hidden as successful learning.

At deadline, pending input yields pending/partial, explicit unresolved receipt refs
and action_eligible=false. Failed input yields a failed/partial result with its
reason. Missing, expired or inaccessible progress cannot satisfy a barrier; use
`NotFoundOrNotVisible` or `ArtifactUnavailable` as applicable, without hidden counts.
A fallback may satisfy a barrier only after actual processing has a terminal
disposition and recall can include it; raw source availability alone cannot silently
stand in for unperformed extraction. Recall itself performs no cognitive mutation:
workers progress independently; it may wait, inspect or return pending.

## 6. Compact recall with expandable evidence

The binding returns summary, typed items, coverage and an opaque basis_ref. Each
truth-sensitive item carries final epistemic status; raw source material is labeled
source rather than being silently presented as accepted knowledge. Every item has
an immutable result reference and evidence refs. Reference expansion reads the
version/basis that produced the item, subject to current Governance and retention;
it never silently substitutes a newer version. Unknowns and important warnings
are surfaced in the compact result, not hidden behind the expansion handle.

Procedure items also disclose standing: unproven, validated, revoked or unverifiable.
Their result references pin the exact SkillRevision and any evaluation used. An
action gate resolves and rechecks that version; it never substitutes the stable
Skill's later current_revision. Validated standing is served only under a learning
contract, and still grants no execution permission.

The Adapter retains the full ProjectionBasis, dependency decisions and RecallCoverage
behind basis_ref; evidence detail returns them in the normative shapes. This changes
the model-facing view, not the underlying KQL wire contract. A reference does not
grant access, and expired audit material is reported unavailable.

A continuation_ref is used as recall target_ref to continue the same query/basis.
Changing its scope, query or required after horizon fails CursorMismatch when it
cannot preserve that traversal. Start a new recall instead of silently mixing pages
from different bases. Current authorization still applies on every expansion/page.

Coverage names constraints, commitments, dependencies, failures, experiences, skills
and evidence. Each is complete, incomplete or not_applicable. The latter requires
an authoritative determination that the channel is irrelevant/absent in this scope;
missing support or incomplete traversal cannot be relabeled not_applicable. Retained
content whose channel cannot be served makes coverage incomplete. These guarantees
concern the authorized recorded universe, never a claim to have searched the world.

Critical applicable constraints and warnings take priority over ordinary similarity.
A truncated required channel, unsatisfied after barrier or unverified necessary
precondition prevents automatic application. action_eligible describes memory
sufficiency, never authorization to execute. Read-only exposure never reinforces
confidence, strength or utility. Requested output and time budgets are bounded;
unsatisfied coverage is returned explicitly rather than hidden to fit a short answer.

max_output_tokens bounds the serialized successful model-facing result using the
advertised tokenizer (or an explicitly supported requested one). Count metadata as
well as prose. If even the mandatory diagnostic/coverage cannot fit, return a bounded
ResultLimitExceeded diagnostic, never drop warnings or pretend a byte/character count
is a token count. Errors may exceed an impossibly small content budget. The descriptor
publishes defaults and minimum useful response size. Expansions have their own budget.

## 7. Responsibility and use of facts

Models choose semantic intent, actual evidence used and unresolved ambiguity.
Adapters generate mechanical digests, capture real read pins, retain idempotency
keys, process pagination and manage worker/receipt state. They MUST NOT invent
which evidence a model used, restamp stale inputs or fill missing numeric confidence.
A supplied estimate remains attributed; absent confidence/salience/utility need not
be guessed to admit a valid ordinary memory.

Authorized factual memory may inform a decision within its allowed purpose and
scope. It does not need procedural promotion merely because a plan uses the fact.
Instruction adoption and external execution remain separately controlled. Core
§31.3 authority classes specify permitted uses and enforceable operation checks;
they do not claim that a Nexus can prove an exposed token had no internal model
influence. Self-model content never becomes policy or permission.

## 8. Conformance and migration

Existing raw KIP clients and the full Cognitive Memory Profile retain their contracts.
The Memory Interface is optional and advertised explicitly. The common path uses
`brain/MemoryInterface.md`; direct KIP users load only the applicable role card.
All binding obligations are tested through the same five intents, including delayed
formation, pending barriers, source-only retrieval, task isolation, idempotent intake,
feedback origin, erasure and constrained output. Model results are not engine results.
Compare raw KIP versus the binding over the same Nexus, memory policy and input
corpus before claiming lower cost or higher model reliability (BrainEvaluation §6).
