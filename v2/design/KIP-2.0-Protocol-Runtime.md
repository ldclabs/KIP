# KIP 2.0 Protocol Runtime

**[English](./KIP-2.0-Protocol-Runtime.md) | [中文](./KIP-2.0-Protocol-Runtime_CN.md)**

## Status

**Protocol Runtime Proposal / Pre-Specification Draft**

This document defines the execution and wire-level runtime contract of KIP 2.0: how KQL, KML, META, Transactions, snapshots, parameters, artifacts, streaming results, receipts, errors, authentication context, and capability negotiation are carried between an Agent and a Cognitive Nexus.

It builds directly on:

- [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)
- [KIP-2.0-Transactions.md](KIP-2.0-Transactions.md)
- [KIP-2.0-Capsule.md](KIP-2.0-Capsule.md)
- [KIP-2.0-KQL.md](KIP-2.0-KQL.md)
- [KIP-2.0-KML.md](KIP-2.0-KML.md)
- [KIP-2.0-META.md](KIP-2.0-META.md)

KIP 1.x exposes a deliberately simple interaction model:

```text
execute_kip
execute_kip_readonly
command | commands[]
parameters
dry_run
JSON response
```

That simplicity should be preserved.

KIP 2.0, however, now has stronger semantics that the runtime must make explicit:

```text
raw read vs epistemic projection
readonly vs state-changing execution
batch vs transaction
current snapshot vs pinned snapshot
transport retry vs logical write retry
request identity vs transaction identity
Schema alias vs exact semantic identity
inline value vs artifact reference
stream delivery vs logical result
timeout vs known abort
validation vs preview vs commit
source actor vs authenticated Principal
```

The runtime is therefore not merely an API wrapper around a parser.

It is the protocol boundary that turns an Agent-generated command into a:

```text
bound
authenticated
governed
schema-resolved
snapshot-consistent
idempotent
auditable
transport-safe
```

interaction with a Cognitive Nexus.

Its central thesis is:

> **A KIP wire protocol should make the execution semantics visible enough that an Agent can know what was read, what was attempted, what committed, and what remains uncertain after transport failure.**

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** indicate requirements of the KIP 2.0 Specification (`../KIP-2.0-SPECIFICATION.md`), which is authoritative where the two differ.

The JSON field names shown here are a proposed baseline wire representation.

A future formal specification may refine field naming while preserving the semantic distinctions and invariants.

---

# 1. Runtime Scope

The Protocol Runtime defines:

```text
request envelopes
response envelopes
operation classification
batch execution modes
transaction invocation
parameter binding
snapshot binding
idempotency
deadlines/cancellation
authentication context
Space resolution
artifact handles
streaming
pagination/cursors
receipts
error propagation
capability handshake
compatibility negotiation
```

---

# 2. Runtime Non-Goals

The Protocol Runtime does not define:

```text
database engine
storage layout
MVCC implementation
vector index implementation
cryptographic key-management backend
HTTP server framework
MCP server framework
LLM orchestration framework
external action execution
Schema authoring language
Governance policy language
```

It defines observable semantics.

---

# 3. Transport Independence

KIP 2.0 is transport-neutral.

The same logical request can be carried over:

```text
local function call
MCP
HTTP
WebSocket
Unix/domain socket
IPC
canister call
message queue
embedded library API
```

Transport-specific authentication, framing, compression, and connection lifecycle may differ.

---

# 4. Logical Protocol vs. Transport

Conceptually:

```text
KIP Operation
    ↓
Protocol Runtime Envelope
    ↓
Transport Binding
    ↓
Authenticated Nexus Runtime
```

The KIP semantic meaning lives above the transport.

---

# 5. Baseline Serialization

The baseline logical wire representation SHOULD be JSON.

Reasons:

```text
LLM/tool friendliness
debuggability
wide language support
easy parameter binding
interoperability
```

A binary binding such as canonical CBOR MAY be standardized later.

---

# 6. Wire JSON Is Not Capsule Canonical JSON

KIP request/response JSON is an interaction format.

Cognitive Capsule canonical JSON is a deterministic artifact format for:

```text
hashing
signing
portable identity
```

Ordinary request JSON does not need to use the Capsule canonicalization profile unless a request digest requires normalized semantics.

---

# 7. Top-Level Request Envelope

Recommended baseline:

```json
{
  "kip": "2.0",

  "request_id": "req-...",

  "space": {
    "id": "space-1"
  },

  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  },

  "operations": [
    {
      "op_id": "op-1",
      "command": "DESCRIBE PRIMER",
      "parameters": {}
    }
  ],

  "context": {
    "purpose": "answer_user",
    "risk": "low"
  },

  "options": {
    "deadline_ms": 10000
  }
}
```

Not every field is required.

An envelope MAY additionally carry an ingestion context so observed source
material enters Evidence from the transport envelope instead of being re-typed
inside model-generated command text:

```json
{
  "ingest": {
    "evidence": [
      {
        "key": "msg",
        "evidence_class": "user_statement",
        "payload": "I prefer dark mode.",
        "media_type": "text/plain",
        "observed_at": "2026-08-14T01:00:00Z",
        "source_actor": "alice",
        "client_key": "message:msg-123"
      }
    ]
  }
}
```

Each entry mints one Evidence element inside the request's transaction scope and
binds its `key` as a request parameter whose value is the minted Evidence
reference, so a command cites it as `:msg` (for example `evidence: :msg`). An
entry MUST declare exactly one of `payload` / `payload_artifact`, the runtime
MUST preserve the supplied payload without model rewriting, `source_actor` is
recorded as Evidence source and never as Principal identity, and ingestion is
transactional: if the transaction aborts, no Evidence is durably created.

---

# 8. Minimal Request

The simplest logical request may be:

```json
{
  "kip": "2.0",
  "operations": [
    {
      "command": "DESCRIBE PRIMER"
    }
  ]
}
```

The runtime resolves:

```text
authenticated Principal
default Space if one is unambiguous/allowed
execution defaults
current snapshot
Schema Environment
```

---

# 9. `kip`

`kip` declares the requested protocol major/minor profile.

Recommended:

```text
"2.0"
```

A runtime may negotiate a compatible minor version.

Major-version mismatch should fail explicitly.

---

# 10. Version Negotiation

The client SHOULD learn supported versions through:

```text
DESCRIBE PROTOCOL
```

or a transport handshake.

It SHOULD NOT guess that a v1 runtime accepts v2 semantics because similar command words exist.

---

# 11. `request_id`

`request_id` identifies one client-visible transport/execution attempt.

It is useful for:

```text
logging
tracing
correlation
support/debugging
stream association
```

---

# 12. Request ID Is Not Idempotency

This is normative:

```text
request_id
    ≠
idempotency_key
```

A caller may retry one logical mutation with a new transport request ID while reusing the same idempotency key.

---

# 13. Request ID Is Not Transaction ID

```text
request_id
    client/request correlation

tx_id
    engine-assigned transaction identity
```

The client MUST NOT fabricate a committed `tx_id`.

---

# 14. Request ID Uniqueness

A client SHOULD generate request IDs unique enough for its operational tracing scope.

The Nexus MAY reject duplicate request IDs within a short active window to prevent stream ambiguity, but request IDs are not the durable replay mechanism.

---

# 15. Space Selection

Every cognitive operation resolves to one MemorySpace unless an explicitly supported cross-Space operation says otherwise.

Recommended:

```json
{
  "space": {
    "id": "space-1"
  }
}
```

or:

```json
{
  "space": {
    "uri": "personal://yan"
  }
}
```

---

# 16. Space Resolution

If both `id` and `uri` are supplied:

```text
they MUST resolve to the same authorized Space
```

or the request fails.

---

# 17. Default Space

A session/runtime MAY define one unambiguous default Space.

If more than one candidate exists and no explicit selection is safe:

```text
InvalidRequestEnvelope
```

is preferable to guessing.

---

# 18. Context Does Not Select Space

Fields such as:

```text
counterparty
agent
topic
source
purpose
```

MUST NOT silently change the MemorySpace.

Space is a Governance boundary, not a conversation hint.

---

# 19. Cross-Space Requests

Baseline KIP 2.0 execution is Space-local.

Cross-Space federation or atomicity is optional capability.

A request MUST NOT silently traverse or mutate another Space because a Concept or Capsule contains a foreign reference.

---

# 20. Authentication Is Out-of-Band Trusted Context

The authenticated Principal is established by the transport/runtime:

```text
OAuth/session
signed request
mTLS
canister caller
local process identity
MCP connection identity
```

or equivalent.

---

# 21. Principal ID Is Not Trusted from Request Body

A caller-supplied:

```json
{
  "principal_id": "admin"
}
```

MUST NOT become authentication authority.

At most it is rejected or treated as non-authoritative client metadata.

---

# 22. Semantic Actor Is Different

KML may contain:

```text
asserted_by
experienced_by
associated_actor
```

These are semantic actor references.

Governance decides whether the authenticated Principal may:

```text
record attribution
or
act as that actor.
```

---

# 23. Delegation Context

Delegation/ActorBinding credentials are verified by Governance/runtime.

The request may reference an existing:

```text
delegation token / binding handle
```

where transport design permits.

The caller cannot author effective scopes as plain JSON.

---

# 24. Request Context

Recommended non-authoritative/request-purpose fields:

```json
{
  "context": {
    "purpose": "answer_user",
    "risk": "low",
    "locale": "zh-CN",
    "client": "anda-brain"
  }
}
```

---

# 25. Purpose Does Not Grant Authority

A request saying:

```text
purpose = audit
```

does not gain audit permission.

Governance may use declared purpose as one input to a stricter policy.

---

# 26. Risk Does Not Grant Authority

A request saying:

```text
risk = high
```

may increase epistemic requirements.

It MUST NOT increase data access.

---

# 27. Client Metadata

`client`/`locale` may guide:

```text
rendering
telemetry
Primer format
error hints
```

They are not trusted identity.

---

# 28. Operation Object

Recommended:

```json
{
  "op_id": "op-1",
  "language": "META",
  "command": "DESCRIBE PRIMER",
  "parameters": {}
}
```

---

# 29. `op_id`

`op_id` identifies one operation inside the request.

It is request-local.

It is useful for:

```text
result mapping
stream frames
atomic rollback diagnostics
tracing
```

---

# 30. Operation ID Is Not Durable Identity

`op_id` does not become:

```text
element ID
transaction ID
client_key
idempotency key
```

---

# 31. `language`

Recommended values:

```text
KQL
KML
META
```

A compatibility runtime may also expose:

```text
KIP1
```

or a named profile.

---

# 32. Language Label Is Not a Security Boundary

The engine MUST parse/classify the actual command.

A caller cannot send state-changing KML while labeling it:

```text
language = META
```

to bypass a readonly endpoint.

---

# 33. Language Mismatch

If `language` is supplied and does not match parsed semantics:

```text
LanguageMismatch
```

is preferable to ignoring the mismatch.

---

# 34. Language May Be Omitted

The engine MAY infer:

```text
KQL / KML / META
```

from syntax.

Explicit language is useful for validation and tooling.

---

# 35. Command Text

Baseline operation uses:

```text
command
```

as KIP textual syntax.

This preserves the protocol's Model-First character.

---

# 36. Structured AST Binding

A runtime MAY optionally accept:

```json
{
  "ast": {...}
}
```

instead of command text.

If both `command` and `ast` are supplied, the runtime MUST define whether one is authoritative or reject the request.

Baseline recommends exactly one.

---

# 37. AST Must Not Become Vendor-Specific Semantics

If standardized later, the AST must map one-to-one to KIP language semantics.

It is not an escape hatch for arbitrary backend instructions.

---

# 38. Parameters

Operations may carry:

```json
{
  "parameters": {
    "alice_id": "C-123",
    "limit": 20,
    "now": "2026-08-14T00:00:00+08:00"
  }
}
```

---

# 39. Parameter Binding Is Structural

KIP 2.0 MUST NOT implement parameters as naive string interpolation.

Correct conceptual pipeline:

```text
parse placeholder
    ↓
bind typed JSON value
    ↓
validate grammar position/type
    ↓
build normalized AST
```

---

# 40. Why

Naive interpolation creates:

```text
syntax injection
escaping ambiguity
Unicode ambiguity
numeric ambiguity
quote confusion
```

and unstable request digests.

---

# 41. Full-Position Parameter Rule

A parameter placeholder occupies one complete allowed grammar value position.

Example:

```prolog
?person {id: :person_id}
LIMIT :limit
FOR TIME :world_time
```

---

# 42. No String Template Injection

Invalid:

```prolog
name: "Hello :name"
```

Use a parameter whose complete value is:

```text
"Hello Alice"
```

or construct the string outside KIP.

---

# 43. Parameter Value Types

Baseline JSON values:

```text
string
number
boolean
null
array
object
```

are bound only where the KIP grammar/schema permits them.

---

# 44. Number Safety

The transport/parser must reject or normalize numeric values that cannot map safely to KIP's Core Literal numeric semantics.

No:

```text
NaN
Infinity
-Infinity
```

---

# 45. Identifier Parameters

A parameter may occupy a schema/ID position only where grammar explicitly allows a value/ref parameter.

The runtime validates:

```text
element ID
Schema ref
predicate ref
artifact handle
```

according to expected type.

---

# 46. Parameter Is Data, Not Code

A parameter cannot inject:

```text
WHERE
UPDATE
PURGE
additional clauses
```

into a command.

---

# 47. Shared Request Parameters

A transport MAY support top-level parameters inherited by operations.

Recommended precedence:

```text
operation.parameters
    overrides
request.parameters
```

when names collide.

---

# 48. Avoid Hidden Parameter Mutation

Parameter binding is immutable for one operation execution.

A preceding command cannot change a parameter object used by the next operation.

---

# 49. Normalized Operation

After parsing and binding, the runtime constructs a normalized operation representation.

It removes irrelevant lexical differences such as:

```text
whitespace
comments
formatting
```

while preserving semantic tokens.

---

# 50. Operation Request Digest

A normalized operation/request digest MAY be computed over:

```text
protocol version
Space selector identity
normalized command AST
bound parameter values
execution-affecting options
```

---

# 51. Wire Request Digest vs. Semantic Plan Digest

KIP 2.0 SHOULD distinguish:

```text
request_digest
    what the client asked

semantic_plan_digest
    what the runtime resolved/desugared
```

---

# 52. Request Digest

Useful for:

```text
idempotency conflict detection
logging
transport replay
```

It SHOULD remain stable across irrelevant formatting changes.

---

# 53. Semantic Plan Digest

Computed after:

```text
Schema alias resolution
KML desugaring
identity canonicalization planning
operation classification
```

where applicable.

It is useful for high-assurance audit.

---

# 54. Why Two Digests

Suppose:

```text
"Person"
```

is a local alias.

A retry of the same request should still be recognized by idempotency even if the active Schema later changes.

The original committed Receipt can record the exact semantic plan that was used at commit.

---

# 55. Request Digest Must Include Meaningful Options

Changing:

```text
target Space
atomicity
import mode
identity mapping
dry_run
KML parameter values
```

must change the request digest.

---

# 56. Observational Options

Pure transport/rendering options such as:

```text
pretty-print
client trace label
```

SHOULD NOT change logical mutation idempotency digest.

---

# 57. Execution Modes

Native KIP 2.0 makes batch semantics explicit.

Recommended:

```text
independent
sequence
atomic
```

---

# 58. Why Explicit Modes

A bare:

```text
commands[]
```

does not tell an Agent:

```text
Can operations see prior writes?
Does failure roll back earlier writes?
Can the engine reorder them?
Does one shared snapshot exist?
```

The runtime must say.

---

# 59. `independent`

Example:

```json
{
  "execution": {
    "mode": "independent"
  }
}
```

Meaning:

```text
each operation is logically independent
each operation obtains its own execution context/transaction
no operation may depend on another operation's result
the runtime MAY execute operations concurrently
```

---

# 60. Independent Read Operations

Ideal for:

```text
parallel SEARCH probes
parallel DESCRIBE calls
unrelated KQL reads
```

---

# 61. Independent Writes

Allowed only when the caller deliberately declares them independent.

Each state-changing operation commits in its own transaction.

There is no all-or-nothing guarantee across operations.

---

# 62. Independent Ordering

Request order does not imply commit order.

Response preserves `op_id` and SHOULD be serialized in request order unless streaming exposes completion order explicitly.

---

# 63. Independent Failure

Failure of one operation does not automatically fail another.

Each result has its own status.

---

# 64. `sequence`

Example:

```json
{
  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  }
}
```

Meaning:

```text
operations begin in request order
each state-changing operation is its own transaction
later operations begin after earlier terminal result
earlier committed state is durable
no rollback across operation boundaries
```

---

# 65. Sequence Visibility

A later operation in the same Space MUST observe at least the committed effects of earlier successful sequence operations.

Its snapshot may also include unrelated concurrent commits that happened before it started.

---

# 66. Sequence Is Not One Snapshot

Because each operation starts separately:

```text
op 1 snapshot = 100
op 1 commits = 101

third party commits = 102

op 2 snapshot may = 102
```

This is expected.

---

# 67. Sequence Failure

With:

```text
on_error = stop
```

a failed operation causes later operations to be marked:

```text
skipped
```

Earlier commits remain committed.

---

# 68. Sequence Continue

Optional:

```text
on_error = continue
```

allows later operations to run.

The caller accepts partial success.

---

# 69. Sequence Continue Should Be Used Carefully

It is appropriate for:

```text
independent diagnostic reads in stable order
best-effort maintenance
```

but not for a cognitive transition whose parts must agree.

Use `atomic`.

---

# 70. `atomic`

Example:

```json
{
  "execution": {
    "mode": "atomic",
    "isolation": "serializable",
    "idempotency_key": "formation:run-42"
  }
}
```

Meaning:

```text
all operations belong to one Transaction
one start snapshot
read-your-writes
no dirty reads
all commit or none commit
one tx_id
one state-changing space_seq
one Receipt
```

---

# 71. Atomic Operation Order

Operations have a logical request order for:

```text
read-your-writes
result dependencies on tentative state
```

even if the engine physically optimizes execution.

---

# 72. Atomic Failure

If any required operation fails:

```text
entire transaction aborts
no durable cognitive partial state
```

---

# 73. Atomic Read-Only Batch

`atomic` MAY contain only KQL/META reads.

Then it is a shared read transaction:

```text
one snapshot_seq
```

and produces no state-changing `space_seq`.

---

# 74. Atomic Mixed Read/Write

Example:

```text
KQL read current Skill
KML create Experience
KQL verify tentative Experience
KML update Skill utility
```

may execute in one transaction if supported.

Later reads see tentative writes.

---

# 75. Atomic META Restrictions

Only META operations that are safe within a transaction may be included.

Examples:

```text
Schema describe
validation
current context
```

Potentially external/index-based operations such as:

```text
semantic SEARCH
remote artifact verification
```

may be disallowed inside a write transaction because they are not transactionally pinned.

Capabilities must declare this.

---

# 76. Atomic External Side Effects Are Forbidden

No operation inside a KIP transaction can assume rollback of:

```text
email
HTTP side effect
money transfer
deployment
remote deletion
```

External action remains outside the KIP atomic state boundary.

---

# 77. Legacy `commands[]`

A KIP 1 compatibility binding MAY map a bare legacy command array to:

```text
sequence
on_error = legacy semantics
```

Native v2 clients SHOULD always declare execution mode.

---

# 78. Default Execution Mode

For a single operation:

```text
implicit single-operation execution
```

is sufficient.

For multiple native v2 operations, the runtime MUST require explicit `execution.mode` rather than guess.

---

# 79. `on_error`

Valid only where meaningful.

Recommended:

```text
stop
continue
```

---

# 80. Atomic Ignores Continue

For:

```text
execution.mode = atomic
```

the effective failure policy is:

```text
abort
```

The runtime SHOULD reject:

```text
on_error = continue
```

as contradictory.

---

# 81. State-Changing Standalone Command

A single KML operation runs in one implicit transaction as defined by KML/Transactions.

---

# 82. Compound `MUTATE`

One KML:

```text
MUTATE { ... }
```

already represents one compound mutation.

If it appears inside an outer atomic multi-operation request, it participates in that same outer transaction rather than creating a nested independent commit.

---

# 83. Nested Transaction Semantics

KIP 2.0 baseline SHOULD NOT expose arbitrary nested commit/savepoint semantics.

A `MUTATE` inside an atomic envelope is flattened into the outer transaction plan.

---

# 84. Savepoints

A future capability MAY define savepoints for advanced maintenance.

They are not baseline Agent-facing semantics.

---

# 85. Transaction Class

A state-changing transaction receives a class such as:

```text
cognitive
maintenance
import
migration
governance
schema
mixed
```

according to the operations.

Ordinary KML cannot self-author a more privileged class.

---

# 86. Idempotency Key

State-changing atomic/standalone operations SHOULD support:

```text
idempotency_key
```

for retry-safe execution.

---

# 87. Idempotency Key Scope

Recommended logical scope:

```text
Nexus
+
MemorySpace
+
authenticated client/Principal idempotency namespace
+
key
```

Exact multi-tenant scoping is implementation-specific but MUST prevent unrelated principals from colliding accidentally.

---

# 88. Idempotency Key Is Client-Chosen Logical Identity

Example:

```text
conversation:893:formation:turn:12
external-job:991:outcome
capsule-import:sha256:ABC:plan:XYZ
```

It should identify one logical write intent.

---

# 89. Same Key + Same Request

Returns the original known transaction result:

```text
same tx_id
same committed space_seq if committed
same Receipt
```

without re-executing the logical mutation.

---

# 90. Same Key + Different Request

Must fail:

```text
IdempotencyConflict
```

---

# 91. Idempotency Resolution Happens Before Re-Execution

The runtime should check a retained idempotency record before:

```text
parsing expensive artifacts
performing writes
allocating IDs
```

as far as safely possible.

---

# 92. Idempotency Retention

Runtime capabilities MUST expose or document:

```text
idempotency_retention
```

because replay safety cannot be assumed forever.

---

# 93. Expired Idempotency Record

After the retention window, the same key may no longer resolve the old transaction.

A high-assurance client should retain:

```text
tx_id
Receipt
artifact/source event identity
```

for long-lived deduplication.

---

# 94. Client Key Is Not Transaction Idempotency

KML `client_key` identifies one durable element creation event.

Transaction idempotency identifies one whole logical request.

Both may be used together.

---

# 95. Request ID vs. Idempotency Key vs. TX ID

Canonical distinction:

```text
request_id
    one transport/execution attempt

idempotency_key
    one client logical mutation intent

tx_id
    one engine transaction fact
```

---

# 96. Example Retry

Attempt 1:

```text
request_id = req-1
idempotency_key = formation-42
```

server commits:

```text
tx_id = tx-900
space_seq = 1200
```

response is lost.

Retry:

```text
request_id = req-2
idempotency_key = formation-42
same request digest
```

returns:

```text
tx-900
space_seq 1200
```

---

# 97. No Duplicate Experience on Retry

The retry MUST NOT:

```text
create Evidence again
create Assertion again
reinforce memory
increment counters
emit second Change Envelope
```

---

# 98. Idempotency and Sequence Mode

Because sequence mode has multiple independent commit boundaries, one top-level idempotency key is insufficient to safely identify each operation unless the runtime defines per-operation derived keys.

Native recommendation:

```text
state-changing sequence operations SHOULD carry per-operation idempotency keys
```

or the request should use `atomic`.

---

# 99. Operation Idempotency Field

Recommended:

```json
{
  "op_id": "op-2",
  "idempotency_key": "write:2",
  "command": "..."
}
```

for non-atomic state-changing sequence/independent operations.

---

# 100. Atomic Idempotency Field

For atomic mode, the primary idempotency key belongs to:

```text
execution.idempotency_key
```

and covers the whole transaction request.

---

# 101. Conflicting Nested Idempotency

Inside one atomic transaction, per-operation idempotency keys MAY identify created source events but MUST NOT create separately replayable subtransactions.

The outer transaction remains the commit identity.

---

# 102. Snapshot Binding

Read semantics may bind to:

```text
current snapshot
explicit AS OF in KQL
snapshot token
transaction start snapshot
```

---

# 103. Snapshot Token

Runtime/META may return:

```text
snapshot_token
```

for multi-request consistency.

Recommended request field:

```json
{
  "read": {
    "snapshot_token": "opaque..."
  }
}
```

---

# 104. Snapshot Token Is Opaque

Clients MUST NOT parse/modify it.

---

# 105. Snapshot Token Is Not Authority

Current Governance still controls every read.

---

# 106. Snapshot Token Scope

A token SHOULD bind at least:

```text
Nexus
Space
snapshot_seq
retention/expiry context
```

and MAY bind:

```text
Principal visibility class
Schema context
```

---

# 107. Current Revocation Wins

If permission is revoked after a token was issued:

```text
token does not preserve old access.
```

---

# 108. Snapshot Token on Write Transaction

A write transaction MAY use a client-obtained snapshot token as:

```text
requested start snapshot / precondition
```

if supported.

The engine must still:

```text
revalidate Governance
validate serializability
```

at commit.

---

# 109. Snapshot Token vs. EXPECT Version

Snapshot token says:

```text
which state I reasoned from
```

Element `EXPECT VERSION` says:

```text
this particular element must still have version N.
```

They complement each other.

---

# 110. Space Sequence Precondition

A transaction MAY support:

```json
{
  "preconditions": {
    "space_seq": 1500
  }
}
```

meaning:

```text
no Space commit since 1500
```

where exact semantics are supported.

---

# 111. Schema Environment Precondition

Recommended:

```json
{
  "preconditions": {
    "schema_environment_version": 17
  }
}
```

for clients that require exact local-symbol interpretation.

---

# 112. Strong Read Snapshot

A canonical KQL operation reads one internally consistent Space snapshot.

It MUST NOT combine versions from partially observed commits.

---

# 113. Independent Batch Snapshots

In `independent` mode:

```text
each operation may observe a different current snapshot.
```

Response context identifies each.

---

# 114. Sequence Batch Snapshots

In `sequence` mode:

```text
each operation has a separate snapshot
ordered after prior successful sequence commit.
```

---

# 115. Atomic Batch Snapshot

In `atomic` mode:

```text
all operations share one start snapshot
+
tentative read-your-writes.
```

---

# 116. SEARCH Snapshot Difference

SEARCH may operate over an index checkpoint rather than canonical Space snapshot.

Its result must expose:

```text
index_seq / consistency
```

as defined by META.

---

# 117. Do Not Pretend SEARCH Uses Transaction Snapshot

A semantic/vector index that is lagging cannot be made serializable merely by placing it in an atomic envelope.

If the backend cannot align SEARCH to the transaction snapshot:

```text
SEARCH is disallowed inside that atomic transaction
```

or must declare weaker semantics.

---

# 118. Epistemic Projection Snapshot

KQL `BELIEF` projection is evaluated against the KQL cognitive snapshot plus its resolved:

```text
Epistemic Policy
world valid time
Governance view
Schema context
```

The response should expose those coordinates.

---

# 119. Read-Only Execution Path

KIP SHOULD preserve a dedicated readonly tool/endpoint.

Conceptually:

```text
execute_kip_readonly
```

---

# 120. Readonly Allowed Operations

Typical:

```text
KQL
META DESCRIBE
META LIST
META SEARCH
VERIFY
VALIDATE
PREVIEW
HISTORY
CHANGES
SNAPSHOT
EXPORT CAPSULE
```

subject to operation-specific authority.

---

# 121. Export Is Still Readonly Semantically

`EXPORT CAPSULE` does not mutate cognitive state.

It may still require:

```text
export
```

permission stronger than ordinary read.

---

# 122. Preview Is Readonly Semantically

`PREVIEW KML` and `PREVIEW IMPORT CAPSULE` do not commit.

A security audit of the attempted preview is a separate administrative side effect and not cognitive state.

---

# 123. Readonly Must Parse Actual Semantics

The readonly endpoint MUST reject a state-changing command regardless of caller-supplied language label.

---

# 124. Readonly Rejection

Recommended error:

```text
ReadonlyViolation
```

with a hint:

```text
Use the state-changing execution endpoint if authorized.
```

---

# 125. General Execution Path

Conceptually:

```text
execute_kip
```

may accept:

```text
KQL
KML
META
```

and explicit atomic execution.

---

# 126. Readonly Preference

Agents SHOULD use readonly execution whenever they do not intend durable mutation.

Benefits:

```text
smaller authority surface
safer tool selection
easier sandboxing
lower accidental-write risk
```

---

# 127. Protected Governance/Schema Operations

Governance and Schema management may share the Transaction Runtime internally.

They SHOULD use separate protected APIs/operation types rather than hiding privileged changes inside arbitrary KML strings.

---

# 128. Mixed-Plane Transaction

A privileged runtime MAY execute:

```text
cognitive
+
Governance
+
Schema
```

changes atomically when required.

This capability does not imply ordinary Agent access.

---

# 129. Operation Classification Is Engine-Controlled

The runtime decides whether an operation is:

```text
readonly
cognitive-write
governance-write
schema-write
external-artifact-read
```

after parsing/resolution.

The client cannot downgrade the classification.

---

# 130. Dry Run

Recommended request option:

```json
{
  "options": {
    "dry_run": true
  }
}
```

or META:

```text
PREVIEW KML
```

---

# 131. Dry Run Semantics

A dry run MAY:

```text
parse
bind
resolve Schema
read current state
authorize
construct tentative write set
validate
estimate resources
```

but MUST NOT:

```text
commit
increment version
consume client_key durably
reserve element ID as final
emit cognitive Change Envelope
modify memory strength
```

---

# 132. Dry Run Is Not Commit Guarantee

Commit must revalidate.

---

# 133. Validation-Only Mode

A lighter option may perform only:

```text
syntax + Schema + static validation
```

without current-state simulation.

META distinguishes:

```text
VALIDATE
vs.
PREVIEW.
```

---

# 134. Deadline

Recommended:

```json
{
  "options": {
    "deadline_ms": 10000
  }
}
```

or a transport absolute deadline.

---

# 135. Deadline Is a Client Execution Bound

It requests:

> Do not keep this request active beyond the useful client window if safely cancellable.

It is not proof of transaction abort.

---

# 136. Timeout vs. Transaction Outcome

This is normative:

```text
client timeout
    ≠
transaction aborted
```

---

# 137. Ambiguous Write Outcome

If the connection closes or deadline fires after commit begins, the client may not know whether:

```text
commit happened.
```

The runtime should return an explicit ambiguous error when it can:

```text
OutcomeUnknown
```

---

# 138. Correct Recovery

Use:

```text
DESCRIBE TRANSACTION
BY IDEMPOTENCY KEY
```

or retry the same idempotency key/request.

---

# 139. Wrong Recovery

Do not:

```text
generate a new idempotency key
create new Evidence
assume timeout means no write
```

---

# 140. Server Cancellation Before Commit

If cancellation is definitely observed before the transaction reaches commit and the transaction is aborted:

```text
status = aborted
```

may be returned.

---

# 141. Cancellation During Commit

If cancellation races commit:

```text
outcome may be unknown to caller.
```

Transaction lookup resolves it.

---

# 142. Read Cancellation

Readonly query/search/export generation can usually be cancelled safely.

No cognitive commit exists.

---

# 143. Write Cancellation Is Best-Effort

Once a state-changing transaction has entered commit processing, cancellation cannot be assumed to rollback.

---

# 144. External Action Cancellation

KIP does not manage rollback of external world actions.

They should not be embedded in KIP write transactions.

---

# 145. Resource Limits

Runtime may cap:

```text
request bytes
operations per request
parameters bytes
query result rows
projection count
path hops
transaction writes
transaction operations
artifact bytes
stream duration
history range
change batch size
```

---

# 146. Limits Must Be Discoverable

`DESCRIBE CAPABILITIES` SHOULD expose safe relevant ceilings.

---

# 147. Client-Supplied Lower Limits

A request may ask for stricter limits:

```json
{
  "options": {
    "extensions": {
      "vendor.example/limits": {
        "max_result_rows": 100,
        "max_write_elements": 50
      }
    }
  }
}
```

to reduce blast radius.

Baseline `options` defines only `dry_run` and `deadline_ms`; request-scoped ceilings are a namespaced extension until a later protocol revision standardizes them.

---

# 148. Lower Limit Cannot Raise Runtime Ceiling

A client cannot request:

```text
max_write_elements = 1,000,000
```

to bypass configured limits.

---

# 149. Resource Limit Failure

Recommended:

```text
ResourceExhausted
```

or more precise:

```text
TransactionTooLarge
ResultLimitExceeded
ArtifactTooLarge
```

---

# 150. Partial Read Results

Baseline canonical KQL SHOULD prefer:

```text
complete page
or
explicit error
```

rather than silently returning an incomplete page as complete.

---

# 151. Explicit Partial Mode

A future/optional:

```text
allow_partial = true
```

may support exploratory operations.

Responses MUST mark:

```text
partial = true
reason
resume state if available
```

---

# 152. Partial Writes Are Not Allowed Inside Atomic Mode

Atomic write:

```text
all commit
or
none.
```

Resource exhaustion aborts the transaction.

---

# 153. Sequence Partial Success Is Explicit

Sequence mode can have:

```text
op1 committed
op2 failed
op3 skipped
```

The response must make that visible.

---

# 154. Independent Partial Success Is Explicit

Each operation reports its own terminal state.

---

# 155. Top-Level Response Envelope

Recommended:

```json
{
  "kip": "2.0",
  "request_id": "req-...",
  "status": "succeeded",

  "execution": {
    "mode": "sequence"
  },

  "results": [
    {
      "op_id": "op-1",
      "status": "succeeded",
      "result": {}
    }
  ],

  "context": {
    "space_id": "space-1"
  },

  "warnings": []
}
```

---

# 156. Top-Level Status

Recommended:

```text
succeeded
failed
partial
outcome_unknown
```

---

# 157. `succeeded`

All required operations reached successful terminal semantics.

---

# 158. `failed`

No required success contract was achieved.

For atomic write this normally means:

```text
transaction aborted / no commit.
```

---

# 159. `partial`

Possible in:

```text
sequence
independent
explicit partial read mode
```

It MUST NOT be used for an atomic commit that partially persisted.

---

# 160. `outcome_unknown`

Used when the runtime/client cannot establish final write outcome in the response path.

It is a recovery state, not a transaction state.

---

# 161. Operation Result

Recommended:

```json
{
  "op_id": "op-2",
  "status": "succeeded",
  "result": {...},
  "context": {
    "snapshot_seq": 1500
  }
}
```

---

# 162. Operation Statuses

Recommended:

```text
succeeded
failed
skipped
rolled_back
no_effect
```

---

# 163. `rolled_back`

In atomic mode, an operation may have executed tentatively before a later failure.

It may be reported:

```text
rolled_back
```

for diagnostics.

No durable state resulted.

---

# 164. `skipped`

A sequence `on_error=stop` later operation was not executed.

---

# 165. `no_effect`

The operation succeeded semantically but changed no durable cognitive state.

Examples:

```text
idempotent upsert already at requested state
repeat merge to same target
no-op update
```

---

# 166. Atomic Response

Recommended:

```json
{
  "status": "succeeded",

  "execution": {
    "mode": "atomic"
  },

  "results": [...],

  "receipt": {
    "tx_id": "tx-900",
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "space_seq": 1501,
    "committed_at": "...",
    "status": "committed"
  }
}
```

---

# 167. Read-Only Atomic Receipt

A readonly atomic batch may return a read context:

```json
{
  "snapshot": {
    "snapshot_seq": 1500
  }
}
```

instead of a state-changing Receipt.

---

# 168. State-Changing Receipt

The transaction Receipt is the authoritative successful commit result.

Recommended fields:

```text
tx_id
space_id
snapshot_seq
space_seq
committed_at
status
transaction_class
request_digest
semantic_plan_digest
result_digest
schema_environment_version
change summary
```

subject to Governance.

---

# 169. Receipt Is Engine Truth

The client cannot author:

```text
space_seq
committed_at
tx_id
origin Principal
```

---

# 170. Receipt Statuses

Recommended durable statuses:

```text
committed
aborted
no_effect
```

Lookup may additionally report:

```text
pending
unknown.
```

---

# 171. No-Effect Transaction

If an attempted state-changing transaction produces no durable state change:

```text
status = no_effect
```

and SHOULD NOT allocate a new cognitive `space_seq`.

Security audit may still record the attempt separately.

---

# 172. Aborted Transaction

An aborted transaction does not produce:

```text
durable cognitive write set
state-changing space_seq
Change Envelope
```

---

# 173. Commit Record

A committed state-changing transaction appends an immutable Commit Record.

The wire Receipt is a projection of that durable fact.

---

# 174. Result Digest

A high-assurance runtime MAY hash the normalized result/receipt payload.

This helps detect:

```text
response corruption
receipt substitution
```

when combined with signatures/proofs.

---

# 175. Signed Receipt

Optional capability:

```text
signed_receipts
```

may cryptographically bind:

```text
Nexus identity
tx_id
Space
space_seq
request/result digest
commit time
```

---

# 176. Signed Receipt Does Not Prove Semantic Truth

It proves what the Nexus attested it committed.

An Assertion inside that transaction can still be false.

---

# 177. Error Object

Recommended:

```json
{
  "error": {
    "code": "SchemaSymbolAmbiguous",
    "category": "schema",
    "message": "Predicate alias 'status' is ambiguous.",
    "hint": "Use DESCRIBE PREDICATE and retry with an exact ref.",
    "retry": {
      "class": "requires_different_input"
    }
  }
}
```

---

# 178. Error Categories

Recommended:

```text
syntax
protocol
schema
data
epistemic
governance
transaction
history
search
artifact
resource
transport
system
```

---

# 179. Error Code Stability

Human messages may improve over time.

Machine:

```text
code
category
retry class
```

should remain stable within a protocol version.

---

# 180. Error Hint

Hints are model-facing recovery guidance.

They MUST NOT:

```text
grant authority
leak hidden resource existence
recommend unsafe bypass
```

---

# 181. Error Details

Optional structured:

```json
{
  "details": {
    "field": "confidence",
    "expected": "immutable",
    "operation": "UPDATE"
  }
}
```

subject to Governance.

---

# 182. Existence-Neutral Errors

When needed, use:

```text
NotFoundOrNotVisible
```

rather than distinguishing:

```text
secret object exists but denied
```

from absence.

---

# 183. Authorization Error

Safe generic forms:

```text
NotAuthorized
RequiresApproval
RequiresStrongerAuthentication
ActorBindingRequired
```

without exposing protected policy internals.

---

# 184. Transaction Conflict Errors

Examples:

```text
VersionConflict
SerializationConflict
SchemaEnvironmentChanged
IdempotencyConflict
PreconditionFailed
```

---

# 185. Ambiguous Transport Error

A transport layer may produce:

```text
deadline exceeded
connection reset
stream lost
```

If a state-changing request may have reached the server, client-facing tooling should surface:

```text
outcome_unknown = true
idempotency_key
lookup hint
```

where possible.

---

# 186. Retry Classes

Recommended:

```text
safe_same_request
requires_refresh
requires_different_input
requires_authority
requires_new_snapshot
requires_reacquire_artifact
outcome_lookup_required
non_retryable
```

---

# 187. Safe Same Request

Examples:

```text
transient search backend unavailable
read timeout
```

For writes, reuse the same idempotency key.

---

# 188. Requires Refresh

Examples:

```text
VersionConflict
SchemaEnvironmentChanged
CursorExpired
```

Agent should re-read/describe and reason again.

---

# 189. Requires Different Input

Examples:

```text
SchemaSymbolAmbiguous
NameIdentityForbidden
ImmutableField
```

---

# 190. Outcome Lookup Required

Examples:

```text
connection lost during commit
deadline after commit began
```

---

# 191. Response Ordering

Non-streaming `results[]` SHOULD correspond to request operation order.

`op_id` remains authoritative.

---

# 192. Independent Internal Completion

The engine may execute independent operations concurrently.

It may internally finish op-3 before op-1.

Non-streaming result ordering remains deterministic.

---

# 193. Warnings

Warnings are non-fatal semantic caveats.

Examples:

```text
search index lagging
projection explanation redacted
history partially purged
compatibility alias used
deprecated Schema symbol
Capsule external blob not checked
```

---

# 194. Warning Must Not Hide Failure

A required validation failure is an error, not a warning.

---

# 195. Result Context

Per-operation context may include:

```text
space_id
snapshot_seq
schema_environment_version
epistemic policy
valid_at
search index checkpoint
cursor
```

depending on the operation.

---

# 196. Context Helps Future Provenance

An Agent can later persist:

```text
decision based on snapshot_seq 1500
projection policy v3
```

without storing hidden chain-of-thought.

---

# 197. Result Size

Large results SHOULD use:

```text
cursor pagination
streaming
artifact handles
```

rather than one enormous JSON object.

---

# 198. Cursors

KIP has several opaque cursor classes:

```text
KQL pagination cursor
SEARCH cursor
LIST cursor
CHANGES cursor
artifact stream cursor/offset
```

They are not interchangeable.

---

# 199. Cursor Type Binding

The runtime SHOULD internally bind cursor to:

```text
operation family
query digest
Space
Principal visibility context
snapshot/index checkpoint
position
expiry
```

as appropriate.

---

# 200. Cursor Is Opaque

A client MUST NOT derive:

```text
space_seq
authorization
rank
ID
```

by decoding guessed cursor internals.

---

# 201. Cursor Mismatch

Using a cursor with changed:

```text
query
Space
Principal
ordering
Epistemic Policy
Search mode
```

fails:

```text
CursorMismatch
```

---

# 202. Cursor and Revocation

A cursor never preserves old authority.

---

# 203. KQL Cursor

Pins:

```text
canonical cognitive snapshot
normalized query
ordering state
```

for stable pagination.

---

# 204. SEARCH Cursor

Pins an:

```text
index/ranking traversal context
```

with declared consistency.

It does not imply canonical KQL snapshot consistency.

---

# 205. CHANGES Cursor

Pins:

```text
commit-log stream position
authorization stream class
```

within retention.

---

# 206. Cursor Expiry

Runtime should use clear:

```text
CursorExpired
```

with recovery guidance.

---

# 207. Streaming

KIP 2.0 MAY support transport streaming for:

```text
large KQL results
SEARCH results
Change Stream
Capsule export bytes
large history
artifact transfer
```

---

# 208. Logical Result vs. Delivery Frames

Streaming frames are transport delivery units.

They are not separate KIP cognitive operations.

---

# 209. Stream Identity

Recommended:

```text
stream_id
```

associated with:

```text
request_id
op_id
```

---

# 210. Generic Stream Frame

Illustrative:

```json
{
  "stream_id": "stream-1",
  "frame_seq": 3,
  "kind": "data",
  "data": {...}
}
```

---

# 211. Frame Kinds

Recommended:

```text
start
data
warning
progress
final
error
```

Not every transport needs all kinds.

---

# 212. `frame_seq`

Monotonic within one stream.

Used for:

```text
ordering
deduplication within transport retry if supported
debugging
```

---

# 213. Start Frame

May declare:

```text
operation
snapshot/index context
media type
estimated size
schema
```

---

# 214. Data Frame

Carries:

```text
result rows
Change Envelopes
artifact bytes/chunks
history entries
```

depending on stream type.

---

# 215. Final Frame

Must state terminal semantics:

```text
complete
partial
error
digest
next cursor
receipt if applicable
```

---

# 216. Stream Loss

For read streams:

```text
restart/resume using cursor/offset if supported.
```

For write transaction streams:

```text
loss may create outcome uncertainty.
```

Use transaction lookup.

---

# 217. Do Not Stream Tentative Write Success

A state-changing atomic transaction MUST NOT send frames implying:

```text
Evidence permanently created
Assertion permanently superseded
```

before commit.

---

# 218. Write Progress

A runtime MAY send non-authoritative:

```text
progress
```

frames such as:

```text
validating
planning
```

but they MUST be marked provisional and MUST NOT expose uncommitted state as durable truth.

---

# 219. Write Final Frame

Only a terminal:

```text
Receipt
aborted status
outcome_unknown
```

establishes the client-visible write outcome.

---

# 220. KQL Streaming

Rows/chunks MUST all belong to the same KQL snapshot/cursor semantics.

---

# 221. Aggregate Query Streaming

An aggregate that requires seeing the whole solution set SHOULD normally emit the aggregate only when final.

Do not stream provisional counts as final values.

---

# 222. SEARCH Streaming

If supported, the ranking checkpoint must remain stable enough for the advertised consistency class.

---

# 223. Change Streaming

Each Change Envelope is one atomic logical frame payload even if the transport fragments bytes.

Do not split one transaction into independent cognitive events.

---

# 224. Capsule Streaming

Capsule byte transport may be chunked.

Chunking MUST NOT change:

```text
Capsule canonical payload
content digest
Capsule identity.
```

---

# 225. Capsule Final Digest

A streamed artifact final frame SHOULD expose:

```text
content_digest
size
artifact handle
```

once complete.

---

# 226. Artifact Transport

Large binary/text objects should not be forced into command strings.

The runtime MAY support opaque:

```text
artifact_handle
```

references.

---

# 227. Artifact Handle Use Cases

```text
Cognitive Capsule input/output
Schema Package artifact
Evidence blob
Receipt/proof bundle
large export
```

---

# 228. Artifact Handle Shape

Illustrative:

```json
{
  "artifact": {
    "handle": "art-opaque",
    "media_type": "application/kip-capsule+json",
    "size": 98231,
    "digest": "sha256:..."
  }
}
```

---

# 229. Handle Is Opaque

Clients MUST NOT treat:

```text
art-opaque
```

as:

```text
filesystem path
URL
database ID
global identity
```

---

# 230. Artifact Handle Is Not Cognitive Identity

It identifies one runtime-accessible artifact representation.

The Capsule's:

```text
content_digest
```

is the portable content identity.

---

# 231. Artifact Handle Access Is Governed

Knowing a handle does not necessarily authorize reading it.

Runtime must check:

```text
Principal
Space/context
expiry
artifact policy
```

as appropriate.

---

# 232. Bearer Handles

If an implementation intentionally uses bearer-capability handles, it MUST advertise that security model and generate sufficiently unguessable scoped tokens.

Baseline recommends authenticated access rather than assuming all handles are safe bearers.

---

# 233. Artifact Expiry

Temporary handles may include:

```text
expires_at
```

or be governed by runtime retention.

Expiry of the handle does not change the underlying Capsule digest semantics.

---

# 234. Inline Artifact

Small artifacts MAY be embedded:

```json
{
  "artifact": {
    "inline": {...}
  }
}
```

subject to request size limits.

---

# 235. Inline Bytes

Binary bytes SHOULD use a transport-defined binary body or safe encoding.

Do not rely on arbitrary JSON strings for huge binary payloads.

---

# 236. Artifact Upload

A transport binding MAY provide:

```text
upload artifact
→ returns handle + digest
→ KIP command references handle
```

Uploading bytes alone does not import cognition.

---

# 237. Artifact Download

A read/export operation may return:

```text
artifact handle
```

then a transport-specific artifact fetch retrieves bytes.

This separation keeps KIP semantic response compact.

---

# 238. Arbitrary URL Is Not Artifact Handle

A caller-provided URL MUST NOT be automatically dereferenced merely because an artifact parameter expects data.

---

# 239. External Fetch

Network retrieval requires:

```text
explicit tool/network capability
Governance
resource limits
digest verification where expected
```

---

# 240. Artifact Digest

If a request declares an expected digest, the runtime MUST verify the supplied artifact bytes before semantic use.

---

# 241. Artifact Type

Media/type metadata is advisory unless validated against actual parser/content.

The runtime selects parser based on:

```text
operation expectation
verified media profile
```

not filename alone.

---

# 242. Artifact Isolation

Untrusted Capsule/Schema artifacts SHOULD be parsed in a resource-limited environment.

---

# 243. Decompression Safety

Transport/runtime must protect against:

```text
decompression bombs
zip bombs
deeply nested JSON
huge arrays
malformed Unicode
parser bombs
```

---

# 244. Artifact Staging Is Not Cognitive Staging

A runtime artifact store holding Capsule bytes is transport state.

It is not:

```text
Capsule isolate import
```

into a MemorySpace.

---

# 245. Artifact Lifecycle and Transaction

An atomic cognitive transaction may reference an already-staged artifact.

The artifact upload itself is not part of the cognitive transaction.

---

# 246. Missing Artifact During Commit

If a required temporary artifact expires before transaction validation:

```text
ArtifactUnavailable
```

and transaction aborts.

---

# 247. Parameter References to Artifacts

Recommended parameter form:

```json
{
  "parameters": {
    "capsule": {
      "$artifact": "art-123"
    }
  }
}
```

Exact marker is pre-specification.

---

# 248. Artifact Reference Is Typed

The binder recognizes it as:

```text
ArtifactRef
```

not an ordinary string.

---

# 249. Result Artifact Reference

Large META `EXPORT CAPSULE` can return an ArtifactRef directly.

---

# 250. Protocol Streaming vs. Change Stream

Distinguish:

```text
transport streaming
    how bytes/results arrive

KIP Change Stream
    logical ordered commit feed
```

A Change Stream can be implemented with polling and no streaming transport.

---

# 251. Synchronous Baseline

Baseline command execution SHOULD be synchronous to a terminal operation result when practical.

This is especially important for Agent tool use.

---

# 252. Long-Running Read Work

A future optional Job API MAY handle:

```text
huge Capsule export
large validation
deep migration analysis
```

without keeping a network request open.

It is not required baseline.

---

# 253. Write Transactions Should Be Bounded

KIP write transactions SHOULD remain short/bounded.

Do not keep an atomic write transaction open while:

```text
waiting for human
calling LLM for minutes
executing remote workflow
waiting for external tool.
```

---

# 254. Long Cognitive Workflow

Correct pattern:

```text
read snapshot
reason
bounded write transaction
external action
bounded outcome transaction
```

---

# 255. Asynchronous Jobs Do Not Change Transaction Semantics

If a maintenance job prepares a result over time:

```text
its final durable write still commits through a bounded Transaction.
```

---

# 256. Server Push Is Optional

KIP does not require:

```text
WebSocket
SSE
webhook
```

for conformance.

Polling can implement:

```text
transaction lookup
change stream
job status
```

---

# 257. Transport Authentication Failure

Occurs before KIP semantic execution.

Recommended transport/protocol mapping:

```text
Unauthenticated
```

No Space existence information should be leaked.

---

# 258. Stronger Authentication

A Governance policy may require step-up authentication for:

```text
purge
export secret
restore Capsule
manage Schema
authority elevation
```

Runtime may return:

```text
RequiresStrongerAuthentication
```

---

# 259. Reauthentication and Retry

After step-up authentication, state may have changed.

The client should rerun preview/preconditions rather than assuming the old plan remains valid.

---

# 260. Delegation Expiry

Delegation is revalidated at commit.

A long-running request whose Delegation expires before commit aborts.

---

# 261. Principal Context in Receipt

High-assurance Receipt may include an authorized/non-sensitive reference to:

```text
origin Principal
delegation chain digest
ActorBinding used
```

for audit.

---

# 262. Client Cannot Rewrite Origin

Even if request body says:

```text
origin = "Alice"
```

the engine records actual authenticated origin.

---

# 263. Request Purpose in Audit

Runtime may record:

```text
purpose
risk
client request label
```

as claimed request context.

It must distinguish those from engine truth.

---

# 264. API Surface

A minimal implementation may expose two logical entry points:

```text
execute_kip_readonly(request)
execute_kip(request)
```

---

# 265. Why Two Entry Points

The split is useful for:

```text
tool permissions
sandboxing
Agent tool selection
least privilege
auditing
```

even if both use the same internal engine.

---

# 266. Optional Specialized Entry Points

A runtime MAY additionally expose:

```text
execute_transaction
artifact_put/get
changes
transaction_lookup
```

for ergonomic/streaming reasons.

They MUST preserve the same logical semantics.

---

# 267. No Semantic Difference Across Bindings

An atomic KML transaction through:

```text
HTTP
MCP
local API
```

must have the same KIP commit semantics.

---

# 268. Function-Calling Binding

A model tool may look like:

```json
{
  "name": "execute_kip_readonly",
  "arguments": {
    "kip": "2.0",
    "space": {"id": "space-1"},
    "execution": {"mode": "atomic"},
    "operations": [
      {
        "op_id": "q1",
        "command": "FIND(...) WHERE {...}",
        "parameters": {}
      }
    ]
  }
}
```

---

# 269. MCP Binding

An MCP tool may expose the same envelope as structured arguments.

MCP connection identity supplies the authenticated Principal context.

---

# 270. HTTP Binding

A possible binding:

```text
POST /kip/v2/execute
POST /kip/v2/readonly
```

is illustrative, not normative.

---

# 271. HTTP Status Is Not KIP Transaction Status

A:

```text
HTTP 200
```

can contain a KIP operation error.

A transport failure can happen after a transaction committed.

Clients must inspect the KIP envelope.

---

# 272. HTTP 202 Optional Job

If a transport uses asynchronous jobs, `202` indicates job acceptance, not cognitive commit.

Final transaction Receipt is still required for writes.

---

# 273. Compression

Transport compression MAY be used.

Compression changes bytes on the wire, not logical request/Capsule semantic identity.

---

# 274. Content-Type Negotiation

Transport bindings SHOULD identify:

```text
KIP request JSON
Capsule canonical JSON
binary artifact
stream framing
```

distinctly.

---

# 275. Character Encoding

JSON text uses:

```text
UTF-8
```

Baseline parser rejects malformed input.

---

# 276. Duplicate JSON Keys

Protocol JSON SHOULD reject duplicate object keys.

This avoids:

```text
parser discrepancy
signature/digest ambiguity
security confusion
```

---

# 277. Unknown Request Fields

Forward-compatible handling:

```text
unknown non-critical extension
    may be ignored/preserved

unknown critical extension
    must fail
```

---

# 278. Extensions

Recommended:

```json
{
  "extensions": {
    "vendor.example/feature": {...}
  }
}
```

---

# 279. Critical Extensions

An extension may declare:

```text
critical = true
```

so runtimes that do not understand it fail rather than execute with altered semantics.

---

# 280. No Unnamespaced Semantic Fields

Vendor extensions should not add top-level fields that could later collide with standard KIP semantics.

---

# 281. Compatibility Profiles

Request MAY specify:

```text
compatibility_profile = "kip-1-compat"
```

where supported.

---

# 282. Compatibility Is Explicit

A native v2 runtime SHOULD NOT silently treat legacy semantics as native because syntax looks similar.

---

# 283. KIP 1 Command Envelope Mapping

Legacy:

```json
{
  "command": "...",
  "parameters": {...},
  "dry_run": false
}
```

maps naturally to one native operation.

---

# 284. Legacy `commands[]`

Maps to explicit native sequence semantics according to the compatibility profile.

The response should disclose:

```text
compatibility_profile_used
```

---

# 285. Legacy Stop-on-Write-Error

A v1 compatibility profile may preserve the old behavior where:

```text
read META/KQL errors are isolated
state-changing failure stops subsequent commands
```

Native v2 avoids this hidden mixed rule by explicit execution mode/on-error policy.

---

# 286. Legacy Response Shape

A compatibility wrapper may return old:

```text
result
error
next_cursor
```

shape.

Native v2 should prefer a consistent operation/result envelope.

---

# 287. Legacy `_score`

Search score maps to:

```text
result.retrieval.score
```

rather than persisted metadata.

---

# 288. Legacy EXPORT

Legacy export may return a KML UPSERT script.

Native:

```text
EXPORT CAPSULE
```

returns a Cognitive Capsule artifact.

The two result media types must be distinguishable.

---

# 289. Protocol Handshake

A client can begin with:

```text
DESCRIBE PROTOCOL
DESCRIBE CAPABILITIES
```

or a transport-level equivalent.

---

# 290. Handshake Result

Should establish:

```text
protocol version
max request size
supported execution modes
readonly endpoint
streaming support
artifact support
transaction conformance
Capsule formats
error registry
```

at a safe capability level.

---

# 291. Handshake Is Cacheable

Runtime support changes less frequently than cognitive state.

Clients may cache it by:

```text
Nexus/runtime identity
protocol capability version
```

---

# 292. Effective Capabilities Are More Dynamic

Principal/Space-specific:

```text
available
```

capabilities may change with Governance.

They should be refreshed when authority context changes.

---

# 293. Capability Downgrade

If a cached capability becomes unavailable:

```text
operation authorization wins
```

The runtime returns current denial rather than honoring stale cache.

---

# 294. Request Capability Preconditions

A client MAY declare:

```json
{
  "requires": {
    "serializable_transactions": true,
    "belief_slot": true
  }
}
```

---

# 295. Capability Precondition Semantics

If the runtime cannot satisfy all declared requirements:

```text
UnsupportedCapability
```

before executing.

---

# 296. Why

An Agent may prefer fail-fast over silently weakening:

```text
serializable → snapshot isolation
historical → current
semantic search → keyword
signed receipt → unsigned.
```

---

# 297. No Silent Semantic Downgrade

This is normative.

If a request requires a semantic guarantee the runtime cannot provide:

```text
fail explicitly.
```

---

# 298. Optional Feature Fallback

A client can provide an explicit fallback policy if desired.

Example:

```json
{
  "options": {
    "extensions": {
      "vendor.example/search_fallback": {
        "modes": ["hybrid", "keyword"]
      }
    }
  }
}
```

The response must say which mode was actually used.

---

# 299. Isolation Request

Atomic write may request:

```text
serializable
```

---

# 300. Isolation Downgrade Forbidden by Default

If serializable is requested but unavailable:

```text
UnsupportedIsolation
```

rather than silently using weaker isolation.

---

# 301. Runtime Default Isolation

When omitted, the runtime uses its declared KIP default.

For KIP 2.0 state-changing transactions, the recommended target is serializable outcome semantics.

---

# 302. Operation Results Referencing Prior Results

Baseline KIP 2.0 SHOULD NOT add general string interpolation like:

```text
${op1.result.id}
```

between independent/sequence operations.

It is difficult to type safely and can make request digests/order semantics complex.

---

# 303. Preferred Dependency Mechanisms

Use:

```text
one KML MUTATE with local handles
one atomic transaction where later KQL sees tentative writes
or
multiple client round-trips using returned durable IDs
```

---

# 304. Why Avoid Result Templates

General result templating introduces:

```text
dynamic code construction
type ambiguity
error propagation complexity
hidden sequencing
injection risk
```

---

# 305. Future Typed Bindings

A future AST-level protocol MAY support typed operation-result references.

Not baseline.

---

# 306. Atomic KQL-to-KML Dependency

Inside one atomic request, a KML command may use normal query patterns internally/through KML WHERE rather than interpolating an earlier result.

Prefer declarative state selection.

---

# 307. Deterministic Command Classification

The parser identifies whether a command is:

```text
KQL read
KML write
META read
```

before execution.

A syntax extension must not hide state mutation behind a read keyword.

---

# 308. META Preview Classification

`PREVIEW KML` is readonly because its semantic contract forbids durable mutation.

---

# 309. META Export Classification

`EXPORT CAPSULE` is readonly cognitive state but has:

```text
export
```

Governance classification.

---

# 310. KQL BELIEF Classification

`BELIEF` is read/projection.

It can require `project` permission but does not write.

---

# 311. Query Side Effects

Runtime instrumentation may record:

```text
telemetry
security audit
billing
rate limiting
```

outside cognitive state.

KQL/META remain semantically read-only.

---

# 312. Read-Only Cognitive Guarantee

Executing a read must not silently change:

```text
memory_strength
salience
confidence
last_recalled_at as cognitive state
Evidence count
```

unless a separate explicit Formation/learning write occurs.

---

# 313. Rate Limiting

A transport/runtime may return:

```text
RateLimited
```

with safe retry metadata.

Rate-limit counters are operational control state, not cognition.

---

# 314. Quotas

Per-Principal/Space quotas may govern:

```text
writes
storage
search
Capsule export
history
```

They do not alter semantic query results except by explicit error/limit.

---

# 315. Backpressure

Streaming transports SHOULD support backpressure or bounded buffers.

A slow consumer must not force unbounded server memory.

---

# 316. Stream Cancellation

Client may cancel a read stream.

The server releases resources.

---

# 317. Change Stream Backpressure

A consumer that falls behind retention must recover from a snapshot rather than forcing infinite history retention.

---

# 318. Sequence Request Backpressure

For large sequence batches, the runtime may enforce max operation count.

---

# 319. Atomic Request Size

A transaction exceeding:

```text
max_transaction_operations
max_transaction_writes
```

fails before commit.

Large imports use staging/publish.

---

# 320. Large Capsule Import

Protocol pattern:

```text
artifact upload
    ↓
META VALIDATE/PREVIEW
    ↓
staging import operations
    ↓
final atomic publish transaction
```

The wire protocol need not place the whole Capsule in one KML string.

---

# 321. Restore Import

Restore requires stronger Governance and explicit import mode.

The general runtime transports the request but does not infer:

```text
merge vs restore
```

from Capsule contents.

---

# 322. `$self` Mapping

The protocol runtime never automatically substitutes source `$self` with destination `$self`.

That decision belongs to Capsule import/Governance restore semantics.

---

# 323. Schema Artifact Loading

An artifact handle for Schema Package may be used by:

```text
VERIFY
VALIDATE
preview
```

without activation.

Activation is separate protected operation.

---

# 324. Transaction History Query

META transaction lookup may use:

```text
tx_id
idempotency key
```

where authorized.

---

# 325. Lookup by Request ID

A runtime MAY support operational correlation by request ID.

It must not imply:

```text
one request ID = one committed transaction
```

because a sequence request may create multiple transactions.

---

# 326. Sequence Request Receipts

Each successful state-changing operation returns its own Receipt.

Top-level request can therefore contain:

```text
0..N transaction Receipts.
```

---

# 327. Independent Request Receipts

Likewise one per state-changing operation.

---

# 328. Atomic Request Receipt

Exactly one transaction Receipt for the whole transaction.

---

# 329. Read Request Has No Commit Receipt

A read can return:

```text
snapshot context
query digest
cursor
```

but not a fake transaction commit Receipt.

---

# 330. Search Request Has Index Context

SEARCH returns:

```text
index checkpoint/freshness
```

not a canonical cognitive snapshot guarantee unless supported.

---

# 331. Export Receipt

`EXPORT CAPSULE` may return an export artifact/audit descriptor.

This is not a cognitive commit Receipt unless a separate source audit transaction was recorded.

---

# 332. Source Export Audit

If Governance requires an audit event for export, that may create a protected audit transaction separate from the readonly exported cognitive snapshot.

The response must distinguish:

```text
Capsule source snapshot
export audit transaction
```

---

# 333. Request Logging Privacy

Runtime logs may contain:

```text
KQL/KML text
Evidence payload
IDs
Capsule metadata
```

and are security-sensitive.

KIP conformance should recommend redaction/minimization.

---

# 334. Secrets in Commands

Clients SHOULD prefer:

```text
artifact/secret handles
protected runtime references
```

over embedding long-lived secrets in KIP command text.

---

# 335. KIP Is Not a Secret Vault API

Secret credential management should be handled by an appropriate protected subsystem.

Cognitive Assertions about credentials do not create runtime credentials.

---

# 336. Trace Context

Transport MAY carry:

```text
trace_id
span_id
```

for observability.

They are not semantic identity.

---

# 337. Tracing Must Not Become Provenance Automatically

An operational trace ID may be referenced by an Activity if explicitly formed.

It is not automatically cognitive provenance.

---

# 338. Deterministic Error Localization

Syntax/Schema errors SHOULD identify:

```text
op_id
source location
field/path
resolved symbol where safe
```

to support model correction.

---

# 339. Command Source Location

Suggested:

```json
{
  "location": {
    "line": 3,
    "column": 14
  }
}
```

for textual commands.

---

# 340. Parameter Error Location

A binder error should identify:

```text
parameter name
expected type
actual type
```

without echoing sensitive value unnecessarily.

---

# 341. Artifact Parse Error

Should identify:

```text
artifact handle/digest
format
safe parse position
```

not raw secret payload.

---

# 342. Protocol Error Before Operation

If the top-level request envelope is invalid:

```text
no operations execute.
```

---

# 343. Operation Parse Error in Independent Mode

Only that operation fails if the top-level envelope remains valid.

Other independent operations may run.

---

# 344. Operation Parse Error in Sequence Mode

With `on_error=stop`:

```text
later operations skipped.
```

Previous commits remain.

---

# 345. Operation Parse Error in Atomic Mode

The whole transaction fails before commit.

---

# 346. Top-Level Authorization Failure

If caller cannot access the selected Space at all:

```text
no operations execute.
```

Use existence-neutral response where required.

---

# 347. Operation-Level Authorization

A caller may access the Space but lack:

```text
export
project
purge
history
```

for a specific operation.

The result reflects that operation's denial according to batch semantics.

---

# 348. Atomic Authorization

One denied required operation aborts the entire atomic transaction.

---

# 349. Sequence Authorization

One denied operation follows `on_error`.

Earlier commits remain.

---

# 350. Independent Authorization

Each operation is authorized independently.

---

# 351. Schema Resolution Error

Occurs before semantic execution of the affected command.

Atomic request aborts.

---

# 352. Schema Snapshot in Sequence

Each sequence operation may resolve against a newer Schema Environment if one changed between operations.

Response reports each environment version.

---

# 353. Schema Snapshot in Atomic

All local aliases resolve under the transaction's captured Schema Environment.

---

# 354. High-Assurance Exact Refs

Clients requiring long-lived semantic determinism should use:

```text
exact schema_ref
exact predicate_ref
exact package version/digest preconditions
```

instead of floating aliases.

---

# 355. Read Snapshot Retention

A snapshot token may expire even when historical `AS OF SEQ` remains reconstructable from archival history.

Capabilities distinguish:

```text
live snapshot token TTL
historical read retention.
```

---

# 356. Snapshot Token Renewal

A runtime MAY allow a new token for the same retained historical sequence.

Current Governance still applies.

---

# 357. Time Values

Protocol-level engine times SHOULD use a standard timestamp representation, typically RFC 3339/ISO 8601 compatible strings.

Exact canonical timestamp rules belong in the formal spec.

---

# 358. Timezone

Engine commit ordering never depends on client timezone.

Exact ordering uses:

```text
space_seq.
```

---

# 359. Client Clock

Client-provided:

```text
observed_at
asserted_at
```

may be semantic evidence time.

It is not trusted engine commit time.

---

# 360. Clock Skew

Runtime MAY warn on implausible client semantic timestamps.

It should not silently rewrite historical claims unless policy explicitly defines normalization.

---

# 361. Current Time Parameters

For reproducible Agent operations, clients SHOULD bind explicit:

```text
:now
```

where semantic current time matters.

The engine still records its own commit time independently.

---

# 362. Request Locale

Locale may influence:

```text
error messages
human labels
Primer rendering
```

not canonical Schema identity.

---

# 363. Response Language

Human-facing `message`/`hint` MAY be localized.

Machine codes and exact refs remain stable.

---

# 364. Result Rendering

Clients may request:

```text
compact
standard
diagnostic
```

rendering where capabilities allow.

Rendering must not change semantic result.

---

# 365. Compact Agent Mode

A compact response can omit:

```text
redundant descriptions
verbose schema docs
```

while retaining:

```text
IDs
statuses
snapshot/receipt coordinates
critical warnings.
```

---

# 366. Diagnostic Mode

May expose additional:

```text
normalized AST
plan digest
timings
index checkpoint
authorization dependency summaries
```

subject to Governance.

---

# 367. Diagnostic Mode Can Leak

Infrastructure detail may require elevated debug/audit authority.

---

# 368. Timing Metrics

Runtime MAY return:

```text
parse_ms
search_ms
projection_ms
commit_ms
```

for observability.

Care must be taken that timing does not become a practical secret-existence oracle.

---

# 369. Protocol Conformance Levels

Recommended runtime suites:

```text
KIP Runtime Core
KIP Runtime Readonly
KIP Runtime Transactions
KIP Runtime Streaming
KIP Runtime Artifacts
KIP Runtime Historical
KIP Runtime High Assurance
```

---

# 370. Runtime Core

MUST support equivalent semantics for:

```text
KIP version field
single-operation execution
KQL/KML/META classification
structural parameter binding
Space resolution
authenticated Principal context
standard response/error envelope
request IDs
operation IDs
capability description
```

---

# 371. Runtime Readonly

Adds:

```text
dedicated readonly entry point
KQL/META enforcement
dry-run/preview safety
readonly violation detection
```

---

# 372. Runtime Transactions

Adds:

```text
atomic execution
read-your-writes
serializable capability declaration
idempotency
Receipts
transaction lookup
preconditions
commit-time authorization revalidation
```

---

# 373. Runtime Streaming

Adds:

```text
generic stream framing
KQL/history/search streaming
Change Stream transport
cancellation/backpressure
terminal final frames
```

---

# 374. Runtime Artifacts

Adds:

```text
artifact handles
upload/download
digest verification
Capsule/Schema artifact transport
resource-limited parsing
```

---

# 375. Runtime Historical

Adds:

```text
snapshot tokens
historical AS OF
transaction history
change retention
historical Schema reconstruction
```

---

# 376. Runtime High Assurance

May require:

```text
signed Receipts
canonical request/plan digests
strict duplicate-key rejection
auditable capability versions
exact index checkpoints
existence-neutral security behavior
strong isolation
tamper-evident Commit Record/checkpoints
```

---

# 377. Conformance Fixtures — Parameters

```text
parameter containing quote cannot inject syntax
parameter containing "WHERE" remains string
number normalization stable
NaN rejected
missing parameter fails before execution
extra unknown parameter optionally warned/ignored by defined rule
same command formatting yields same normalized request digest
```

---

# 378. Conformance Fixtures — Execution Modes

```text
independent reads may use different snapshots
independent writes can commit in different order

sequence op1 write commits
op2 read sees op1
op2 fails
op3 skipped with on_error=stop
op1 remains committed

atomic op1 creates Evidence
op2 creates Assertion
op3 fails
none commit
```

---

# 379. Conformance Fixtures — Read-Your-Writes

```text
atomic:
create Evidence E
later Assertion references E
later KQL sees E
outside concurrent reader never sees E before commit
```

---

# 380. Conformance Fixtures — Idempotency

```text
same key + same normalized request
→ same Receipt

same key + different parameter
→ IdempotencyConflict

same request_id + new idempotency key
→ not treated as same logical write

new request_id + same idempotency key
→ retry original logical write
```

---

# 381. Conformance Fixtures — Timeout

```text
server commits
response lost
client gets timeout
retry same idempotency key
→ original tx Receipt

client cancellation before commit definitely aborts
→ aborted

cancellation races commit
→ outcome_unknown / lookup required
```

---

# 382. Conformance Fixtures — Readonly

```text
KQL accepted
META accepted
PREVIEW KML accepted
KML commit rejected
command mislabeled META but parses as KML rejected
```

---

# 383. Conformance Fixtures — Space

```text
explicit Space ID resolves
wrong URI+ID pair fails
context.counterparty does not switch Space
hidden Space returns existence-neutral failure
cross-Space ref not auto-traversed
```

---

# 384. Conformance Fixtures — Principal / Actor

```text
request body principal_id="admin" ignored/rejected
transport authenticated Principal remains authoritative

KML asserted_by Alice
without assert_as_actor
can record attribution only if Governance permits
cannot impersonate Alice
```

---

# 385. Conformance Fixtures — Schema

```text
atomic transaction resolves alias once
concurrent default changes
semantic plan remains exact

sequence op1 old schema
Schema changes
op2 may use new schema
responses disclose versions

requested serializable but unavailable
→ no silent downgrade
```

---

# 386. Conformance Fixtures — Search

```text
SEARCH returns index_seq 98
current Space seq 100
client sees lag

SEARCH inside serializable atomic transaction unsupported
→ explicit error
not fake snapshot semantics
```

---

# 387. Conformance Fixtures — Cursors

```text
KQL cursor used in SEARCH
→ CursorMismatch/TypeMismatch

Principal revoked before next page
→ continuation denied

same query + same KQL cursor
→ stable snapshot page
```

---

# 388. Conformance Fixtures — Streaming

```text
atomic write emits progress
later aborts
no prior frame claimed durable creation

stream breaks after unknown write finalization
client performs tx lookup

KQL stream rows all share same snapshot
```

---

# 389. Conformance Fixtures — Artifacts

```text
artifact handle not treated as URL/path
wrong digest fails
expired handle fails
Capsule upload does not import cognition
embedded Package validate does not activate Schema
```

---

# 390. Conformance Fixtures — Results

```text
sequence partial response clearly marks:
op1 succeeded + Receipt
op2 failed
op3 skipped

atomic abort marks tentative prior ops rolled_back
no space_seq

atomic commit returns one Receipt
```

---

# 391. Security Fixtures

```text
caller labels PURGE command as META
readonly rejects

caller supplies principal_id=owner
no authority change

caller modifies opaque cursor
fails

caller guesses artifact handle
Governance denies

caller embeds URL in artifact parameter
no automatic fetch

caller sends duplicate JSON keys
parser rejects

caller tries huge nested payload
resource limit rejects

caller relies on stale capability cache
current Governance denies
```

---

# 392. Protocol Interaction Workflow

Recommended v2 Agent flow:

```text
              ┌────────────────────┐
              │ DESCRIBE PRIMER    │
              └─────────┬──────────┘
                        ▼
              capabilities/schema?
                        │
                        ▼
            SEARCH / DESCRIBE grounding
                        │
                        ▼
                  KQL / BELIEF
                        │
                        ▼
                reason outside tx
                        │
                 ┌──────┴──────┐
                 │             │
                 ▼             ▼
             no write       write needed
                               │
                               ▼
                       VALIDATE/PREVIEW
                         if appropriate
                               │
                               ▼
                     guarded KML/MUTATE
                               │
                               ▼
                      atomic Transaction
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
                 Receipt            outcome unknown
                                          │
                                          ▼
                                DESCRIBE TRANSACTION
                                          │
                                          ▼
                                       Receipt
```

---

# 393. Read Path Example

Request:

```json
{
  "kip": "2.0",
  "request_id": "req-100",

  "space": {
    "uri": "personal://yan"
  },

  "execution": {
    "mode": "atomic"
  },

  "operations": [
    {
      "op_id": "q1",
      "language": "KQL",
      "command": "FIND(?slot) WHERE { ?slot BELIEF SLOT (:project_id, \"status\") } FOR TIME :now WITH EPISTEMIC {purpose:\"answer_user\", explanation:\"summary\"}",
      "parameters": {
        "project_id": "C-project",
        "now": "2026-08-14T00:00:00+08:00"
      }
    }
  ]
}
```

Response:

```json
{
  "kip": "2.0",
  "request_id": "req-100",
  "status": "succeeded",

  "results": [
    {
      "op_id": "q1",
      "status": "succeeded",
      "result": {
        "status": "accepted",
        "accepted_values": ["active"]
      },
      "context": {
        "snapshot_seq": 1500,
        "schema_environment_version": 17,
        "epistemic_policy": {
          "id": "default-recall",
          "version": "3"
        }
      }
    }
  ],

  "snapshot": {
    "snapshot_seq": 1500
  }
}
```

---

# 394. Atomic Formation Example

Request:

```json
{
  "kip": "2.0",
  "request_id": "req-101",

  "space": {
    "uri": "personal://yan"
  },

  "execution": {
    "mode": "atomic",
    "isolation": "serializable",
    "idempotency_key": "conversation:42:formation:turn:9"
  },

  "operations": [
    {
      "op_id": "write-memory",
      "language": "KML",
      "command": "MUTATE { CREATE EVIDENCE ?e { CLIENT KEY :e_key SET FIELDS { evidence_class:\"user_statement\", payload::payload, observed_at::time } } ENSURE PROPOSITION ?p (:alice, \"prefers\", :dark_mode) CREATE ASSERTION ?a { CLIENT KEY :a_key SET FIELDS { proposition:?p, asserted_by::alice, stance:\"support\", mode:\"stated\", confidence:1.0, asserted_at::time } SET STRUCTURAL { (\"evidence\", ?e) {role:\"support\"} } } }",
      "parameters": {
        "e_key": "message:42:evidence",
        "a_key": "message:42:assertion",
        "alice": "C-alice",
        "dark_mode": "C-dark-mode",
        "time": "2026-08-14T00:00:00+08:00",
        "payload": {
          "mode": "inline",
          "inline": {
            "text": "I prefer dark mode."
          }
        }
      }
    }
  ]
}
```

Response:

```json
{
  "kip": "2.0",
  "request_id": "req-101",
  "status": "succeeded",

  "results": [
    {
      "op_id": "write-memory",
      "status": "succeeded",
      "result": {
        "handles": {
          "e": {"id": "E-1", "created": true},
          "p": {"id": "P-7", "created": false},
          "a": {"id": "A-9", "created": true}
        }
      }
    }
  ],

  "receipt": {
    "tx_id": "tx-900",
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "space_seq": 1501,
    "committed_at": "2026-08-14T00:00:01+08:00",
    "status": "committed",
    "schema_environment_version": 17,
    "request_digest": "sha256:...",
    "semantic_plan_digest": "sha256:..."
  }
}
```

The observed payload is shown here as a bound parameter for readability. Where
the runtime offers an ingestion context (§7), the payload SHOULD travel in
`ingest.evidence[]` and the command SHOULD cite the minted Evidence as `:key`
instead of carrying observed content authored by the model.

---

# 395. Lost Response Example

Client receives no response.

It must not conclude:

```text
memory was not stored.
```

Lookup:

```text
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY
"conversation:42:formation:turn:9"
```

may return:

```json
{
  "status": "committed",
  "tx_id": "tx-900",
  "space_seq": 1501
}
```

---

# 396. Sequence Example

```json
{
  "kip": "2.0",

  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  },

  "operations": [
    {
      "op_id": "ground",
      "command": "SEARCH CONCEPT :name WITH TYPE \"Person\" LIMIT 5",
      "parameters": {"name": "Alice"}
    },

    {
      "op_id": "query",
      "command": "FIND(?x) WHERE {...}"
    },

    {
      "op_id": "write",
      "command": "MUTATE { ... }",
      "idempotency_key": "..."
    }
  ]
}
```

Each operation is a separate execution boundary.

No rollback across them.

---

# 397. Why Sequence Does Not Support Implicit Result Injection

The `query` command cannot magically reference:

```text
ground.result[0].id
```

inside one textual request.

The client should either:

```text
round-trip after grounding
```

or use a deterministic exact selector known in advance.

This keeps the wire protocol typed and predictable.

---

# 398. Independent Grounding Example

```json
{
  "kip": "2.0",

  "execution": {
    "mode": "independent"
  },

  "operations": [
    {
      "op_id": "zh",
      "command": "SEARCH CONCEPT :term MODE \"hybrid\" LIMIT 5",
      "parameters": {"term": "深色模式"}
    },

    {
      "op_id": "en",
      "command": "SEARCH CONCEPT :term MODE \"hybrid\" LIMIT 5",
      "parameters": {"term": "dark mode"}
    }
  ]
}
```

The searches can run concurrently.

---

# 399. Shared Snapshot Read Example

```json
{
  "kip": "2.0",

  "execution": {
    "mode": "atomic"
  },

  "operations": [
    {
      "op_id": "belief",
      "command": "..."
    },
    {
      "op_id": "experience",
      "command": "..."
    },
    {
      "op_id": "commitments",
      "command": "..."
    }
  ]
}
```

All canonical reads share one snapshot.

---

# 400. Capsule Preview Example

```json
{
  "kip": "2.0",

  "space": {
    "id": "space-target"
  },

  "execution": {
    "mode": "sequence",
    "on_error": "stop"
  },

  "operations": [
    {
      "op_id": "verify",
      "language": "META",
      "command": "VERIFY CAPSULE :capsule",
      "parameters": {
        "capsule": {
          "$artifact": "art-capsule-1"
        }
      }
    },

    {
      "op_id": "validate",
      "language": "META",
      "command": "VALIDATE CAPSULE :capsule",
      "parameters": {
        "capsule": {
          "$artifact": "art-capsule-1"
        }
      }
    },

    {
      "op_id": "preview",
      "language": "META",
      "command": "PREVIEW IMPORT CAPSULE :capsule INTO :space",
      "parameters": {
        "capsule": {
          "$artifact": "art-capsule-1"
        },
        "space": "space-target"
      }
    }
  ]
}
```

None of these operations imports cognition.

---

# 401. Actual Capsule Import

Actual import uses a state-changing protected operation/transaction with:

```text
Capsule digest
target Space
import mode
import plan digest/mappings
idempotency key
commit-time Governance
```

It is intentionally not disguised as META.

---

# 402. Change Consumer Example

Request:

```text
CHANGES SINCE :cursor LIMIT 100
```

Response may stream:

```text
Envelope seq 1501
Envelope seq 1502
...
```

The consumer records the cursor only after it durably processed the envelope according to its own semantics.

---

# 403. Exactly-Once Is Not Assumed

Change delivery may be:

```text
at-least-once.
```

Consumer deduplicates by:

```text
Space + space_seq + tx_id.
```

---

# 404. Request Replay Is Not Change Replay

Two separate layers:

```text
idempotency registry
    prevents duplicate write execution

change consumer dedupe
    prevents duplicate downstream processing
```

Both are needed.

---

# 405. Protocol Security Boundaries

The runtime must defend against:

```text
command injection
parameter injection
Principal spoofing
Space confusion
language-label spoofing
cursor forgery
artifact-handle guessing
URL fetch injection
request replay
idempotency collision
timeout duplicate writes
Schema downgrade
isolation downgrade
readonly bypass
resource exhaustion
stream confusion
error side channels
```

---

# 406. Command Injection Defense

Structural parameter binding prevents a value from becoming executable KIP syntax.

---

# 407. Principal Spoofing Defense

Trusted Principal comes from transport authentication, never command text.

---

# 408. Space Confusion Defense

Response echoes resolved Space identity.

Transaction Receipt binds the actual Space.

---

# 409. Language Spoofing Defense

Runtime parses/classifies actual command semantics.

---

# 410. Cursor Forgery Defense

Cursor is opaque/authenticated or server-side mapped.

Invalid modification fails.

---

# 411. Artifact Handle Defense

Opaque, unguessable or access-controlled handles.

No path traversal semantics.

---

# 412. URL Fetch Defense

Artifact references do not cause arbitrary network access.

---

# 413. Replay Defense

Writes use idempotency keys and element client keys where appropriate.

---

# 414. Timeout Duplicate Defense

Unknown outcome triggers lookup/same-key retry.

---

# 415. Schema Downgrade Defense

Exact semantic requirements and capability preconditions fail rather than silently downgrade.

---

# 416. Isolation Downgrade Defense

Requested isolation is either met or rejected.

---

# 417. Readonly Bypass Defense

Semantic parser classification is authoritative.

---

# 418. Resource Exhaustion Defense

Limits are enforced before expensive work where possible.

---

# 419. Stream Confusion Defense

Frames bind:

```text
stream_id
request_id
op_id
frame_seq
```

and transport authentication context.

---

# 420. Error Side-Channel Defense

Existence-neutral errors and Governance-first filtering prevent easy secret enumeration.

---

# 421. Request Canonicalization Security

Normalized request digest must not depend on parser ambiguities.

Duplicate JSON keys and invalid Unicode are rejected.

---

# 422. Idempotency Digest Security

Same idempotency key is bound to:

```text
request digest
```

so an attacker/client bug cannot reuse a key for another mutation silently.

---

# 423. Receipt Substitution Defense

High-assurance clients verify:

```text
request digest
Space
tx_id
result digest
signature/proof if supported.
```

---

# 424. Result Provenance

A later Agent action can preserve:

```text
source query request digest
snapshot_seq
tx Receipt
Capsule digest
```

as external decision provenance where useful.

---

# 425. Runtime Does Not Store Chain-of-Thought

Request/response logs may include:

```text
KIP commands
structured decision summaries
```

but KIP does not require private model reasoning traces.

---

# 426. Model Tool Ergonomics

The runtime contract should remain easy to present as one or two model tools.

A model should not need to understand HTTP status, TCP retry, or database transactions to use KIP correctly.

---

# 427. Tool Description Should Teach Three Things

At minimum:

```text
use readonly for reads
use idempotency key for writes
use atomic mode when changes must commit together
```

---

# 428. Tool Description Should Teach Outcome Uncertainty

For writes:

```text
timeout/network failure
→ lookup/retry same idempotency key
```

must be in the tool contract, not only documentation.

---

# 429. Tool Description Should Teach Search Boundary

```text
SEARCH grounds
KQL/BELIEF establishes structured cognitive result.
```

---

# 430. Tool Description Should Teach Principal/Self Boundary

The tool's authenticated user/agent identity does not automatically equal semantic `$self`.

---

# 431. Recommended `execute_kip_readonly` Input

Conceptually:

```json
{
  "kip": "2.0",
  "request_id": "...",
  "space": {...},
  "execution": {...},
  "operations": [...],
  "context": {...},
  "options": {...}
}
```

No separate ad-hoc syntax needed.

---

# 432. Recommended `execute_kip` Input

Same envelope.

The difference is tool/endpoint authority.

---

# 433. Readonly Tool Should Be Easier to Grant

A deployment can expose:

```text
readonly tool broadly
write tool narrowly
```

to Agent subprocesses.

---

# 434. Formation Brain

A memory Formation component may receive:

```text
readonly grounding
+
write transaction
```

permissions.

---

# 435. Recall Brain

A Recall component may receive only:

```text
readonly KQL/META/search/project
```

with no KML commit surface.

---

# 436. Maintenance Brain

A Maintenance component may receive:

```text
readonly
+
maintain
+
retention
+
bounded Profile updates
```

without:

```text
manage Governance
assert_as arbitrary actor
```

---

# 437. External Business Agent

May have no direct KIP write access at all.

It can talk to Formation/Brain service.

This is deployment architecture, not a protocol requirement.

---

# 438. Runtime Principle of Least Authority

Protocol surface should make component-specific tool permissions practical.

---

# 439. Formal Envelope Sketch

Non-normative:

```text
request :=
{
  kip,
  request_id?,
  space?,
  compatibility_profile?,
  execution?,
  read?,
  ingest?,
  preconditions?,
  operations[1..N],
  parameters?,
  context?,
  requires?,
  options?,
  extensions?
}

operation :=
{
  op_id?,
  language?,
  command | ast,
  parameters?,
  idempotency_key?,
  options?,
  extensions?
}

execution :=
{
  mode: independent | sequence | atomic,
  on_error?: stop | continue,
  isolation?,
  idempotency_key?,
  extensions?
}

response :=
{
  kip,
  request_id?,
  status,
  execution?,
  results[],
  context?,
  snapshot?,
  receipt?,
  warnings?,
  next_cursor?,
  error?,
  extensions?
}
```

---

# 440. Request Validation Order

Recommended:

```text
1. transport authentication
2. parse top-level envelope
3. protocol/version negotiation
4. resolve Space
5. validate execution mode
6. validate operation count/size
7. parse/classify operations
8. bind parameters
9. enforce readonly/write entry point
10. resolve idempotency where applicable
11. bind snapshot/Schema/Governance context
12. execute according to mode
```

For atomic transactions, detailed transaction phases then apply.

---

# 441. Why Authentication Comes First

Before disclosing:

```text
Space existence
Schema
capabilities
error detail
```

the runtime needs a trusted Principal context.

Public protocol capability endpoints may intentionally allow anonymous access with a restricted view.

---

# 442. Why Space Resolution Precedes Schema Resolution

Schema Environment is Space-specific.

A Predicate alias may resolve differently in another Space.

---

# 443. Why Readonly Classification Precedes Execution

No state-changing parser path should execute before the readonly guard is applied.

---

# 444. Why Idempotency Precedes Write Re-Execution

A known prior transaction should be returned rather than rerunning expensive or dangerous logic.

---

# 445. Why Commit Revalidates Governance

Request-time authorization can become stale.

Revocation wins before commit.

---

# 446. Formal Response State Machine

```text
request accepted
      │
      ▼
parsing/binding
      │
      ├ failure → failed
      ▼
execution
      │
      ├ readonly success → succeeded
      │
      ├ sequence mixed → partial
      │
      ├ atomic abort → failed
      │
      ├ atomic commit → succeeded
      │
      └ transport uncertainty → outcome_unknown
```

---

# 447. Transaction State vs. Request State

A request may be:

```text
outcome_unknown
```

while its transaction is actually:

```text
committed.
```

This distinction is essential.

---

# 448. Agent-Friendly Recovery State

An `outcome_unknown` response SHOULD include enough safe data to recover:

```text
request_id
idempotency_key
possible tx lookup method
```

---

# 449. No Automatic Duplicate Retry by Runtime Client

A generic client library should retry readonly requests automatically where safe.

For writes, it may automatically retry only with:

```text
same idempotency key
same request digest
```

under a well-defined retry policy.

---

# 450. Client Library Retry

Recommended:

```text
readonly transient failure
    → retry

idempotent write transport failure
    → same-key retry/lookup

non-idempotent write without key
    → surface outcome uncertainty
```

---

# 451. Write Without Idempotency Key

A runtime MAY allow it.

Clients should understand:

```text
network failure may make safe retry impossible.
```

High-reliability Agent runtimes SHOULD require idempotency keys for external-event/important writes.

---

# 452. Auto-Generated Idempotency Key

A client SDK MAY generate a key for one call.

But if the application loses that key across crash/retry, the protection is lost.

Source-event-derived keys are stronger when available.

---

# 453. Idempotency Privacy

Keys may contain sensitive external identifiers.

Clients SHOULD hash/namespace them rather than embedding private plaintext if logs/receipts expose the key.

---

# 454. Transaction Lookup Privacy

Lookup by idempotency key must require matching authorized namespace/Principal.

It cannot become a global transaction enumeration API.

---

# 455. Receipt Retention

Runtime capabilities should expose:

```text
transaction_lookup_retention
receipt_retention
```

where bounded.

---

# 456. Durable Client Receipts

Clients may persist Receipts externally for long-term audit.

A Receipt copy is not authority to mutate the Nexus.

---

# 457. Signed Receipt Portability

A signed Receipt may be portable evidence that a Nexus committed a transaction.

Whether another system trusts the Nexus remains local policy.

---

# 458. Change Envelope Origin

Change Envelope references the transaction's actual:

```text
tx_id
space_seq
```

not client request ID as ordering authority.

---

# 459. Search Index Consumer

Search index updates SHOULD consume Change Envelopes idempotently.

If one envelope is replayed:

```text
index state does not double-apply cognitive counters.
```

---

# 460. Projection Cache Consumer

Epistemic cache invalidation can use:

```text
space_seq
changed kinds
Governance/schema changes
```

from the Change Stream.

---

# 461. Runtime Self-Description

META `DESCRIBE PROTOCOL/CAPABILITIES` is part of the runtime contract itself.

The runtime should not require out-of-band documentation to discover basic supported semantics.

---

# 462. Error Registry

`DESCRIBE ERROR` allows model clients to recover without shipping a giant static error manual.

---

# 463. Schema Primer Injection

A runtime/SDK may automatically inject/cache:

```text
DESCRIBE PRIMER
```

for a model session.

It should preserve the Primer's version/digest.

---

# 464. Auto-Primer Is Not Hidden Semantic Input

The client/Agent should be able to inspect which Primer/version it received.

---

# 465. Protocol Runtime and Reproducibility

A high-assurance decision can record:

```text
request digest
snapshot_seq
Schema Environment
Epistemic Policy
Receipt
artifact digest
```

sufficient to reconstruct external decision inputs.

---

# 466. Reproducibility Is Bounded

Perfect replay may fail if:

```text
historical Evidence purged
model-assisted Projection unavailable
external artifact unavailable
old Schema package lost
```

The runtime should state these limitations.

---

# 467. Protocol Runtime and Determinism

KIP requires deterministic structural semantics where specified.

It does not require every:

```text
semantic SEARCH
model-assisted Projection
```

to be mathematically deterministic.

The response must identify method/version/context sufficiently.

---

# 468. Transaction Determinism

Regardless of planning implementation:

```text
committed durable state
Receipt
space_seq ordering
```

must be unambiguous.

---

# 469. Request Digest with Nondeterministic Read

A read request digest identifies the request, not necessarily identical future search result.

Snapshot/index/method context is needed to interpret result reproducibility.

---

# 470. State Transition Authority

Only:

```text
committed Transaction
```

changes durable KIP state.

Neither:

```text
request accepted
preview
validation
progress frame
```

does.

---

# 471. Protocol Runtime Invariants

The following are normative design targets.

1. KIP runtime semantics are transport-independent.
2. Authentication Principal comes from trusted transport/runtime context.
3. Caller-supplied Principal fields cannot grant authority.
4. Semantic actor identity is distinct from authenticated Principal.
5. Every cognitive operation resolves one MemorySpace unless explicit cross-Space capability applies.
6. Context hints never silently change Space.
7. Requests identify KIP protocol version.
8. `request_id` identifies one transport attempt.
9. `request_id` is not an idempotency key.
10. `request_id` is not a transaction ID.
11. `op_id` is request-local.
12. Operation language labels are checked against parsed semantics.
13. Language labels cannot bypass readonly enforcement.
14. Command parameters are bound structurally, not interpolated textually.
15. Parameters cannot inject KIP syntax.
16. Invalid Core numeric values are rejected.
17. Normalized request digests ignore irrelevant formatting.
18. Request digest and semantic-plan digest are distinct.
19. Native multi-operation requests declare execution mode explicitly.
20. `independent` operations have no cross-operation semantic dependency.
21. Independent operations may execute concurrently.
22. Independent state-changing operations commit separately.
23. `sequence` operations begin in order.
24. Sequence state-changing operations commit separately.
25. Sequence does not roll back earlier commits.
26. Sequence later operations see at least earlier committed effects.
27. Sequence may observe unrelated concurrent commits between operations.
28. `atomic` operations execute in one Transaction.
29. Atomic mode has one start snapshot.
30. Atomic mode provides read-your-writes.
31. Atomic mode exposes no dirty reads.
32. Atomic write commits all or none.
33. Atomic write has one tx_id and one state-changing space_seq.
34. Atomic readonly batch may share one snapshot without a state-changing Receipt.
35. `MUTATE` inside atomic mode does not create nested commit semantics.
36. External world side effects are not rolled back by KIP.
37. Requested isolation cannot be silently downgraded.
38. Requested semantic capabilities cannot be silently downgraded.
39. State-changing retries SHOULD use idempotency keys.
40. Idempotency key identifies logical mutation intent.
41. Same idempotency key + same request returns original outcome.
42. Same idempotency key + different request fails.
43. Idempotency retention is discoverable/bounded.
44. `client_key` and transaction idempotency solve different problems.
45. Request ID, idempotency key, and tx_id remain distinct.
46. Snapshot token is opaque.
47. Snapshot token is not authority.
48. Current Governance overrides old snapshot-token authority.
49. Independent operations may read different snapshots.
50. Sequence operations may read different ordered snapshots.
51. Atomic operations share one transaction snapshot.
52. SEARCH index checkpoint is not automatically a canonical transaction snapshot.
53. Unsupported snapshot-consistent SEARCH inside atomic mode fails rather than fakes consistency.
54. Dedicated readonly execution path SHOULD exist.
55. Readonly path validates actual semantics, not caller labels.
56. Readonly KQL/META never mutate cognitive state.
57. Preview/dry-run does not reserve durable IDs by default.
58. Preview/dry-run does not consume client keys durably.
59. Preview/dry-run does not create Change Envelopes.
60. Preview/dry-run does not guarantee future commit.
61. Deadline/timeout is not proof of transaction abort.
62. Cancellation of writes is best-effort around commit.
63. Ambiguous write outcome requires transaction lookup or same-key retry.
64. Client must not create a fresh logical write merely because response was lost.
65. Resource limits are explicit and discoverable where safe.
66. Atomic writes never partially commit on resource failure.
67. Sequence/independent partial success is explicitly represented.
68. Top-level request status is distinct from transaction status.
69. `outcome_unknown` is a request-observation state, not a durable transaction state.
70. Operation results identify op_id and status.
71. Tentatively executed atomic operations may be reported `rolled_back` after abort.
72. A state-changing Receipt is engine truth about commit.
73. Client cannot author tx_id/space_seq/committed_at.
74. No-effect state changes do not create cognitive version/space_seq churn.
75. Error objects have stable machine codes/categories.
76. Error hints cannot grant authority or leak protected existence.
77. Existence-neutral errors are used where policy requires.
78. Cursor classes are opaque and non-interchangeable.
79. Cursor never preserves revoked authority.
80. KQL pagination cursor pins canonical snapshot semantics.
81. SEARCH cursor pins declared index/ranking semantics, not canonical truth.
82. CHANGES cursor pins commit-stream position.
83. Streaming frames are delivery units, not cognitive commits.
84. Atomic write progress frames cannot claim uncommitted durability.
85. Final Receipt/terminal status establishes write result.
86. Change Envelopes preserve transaction boundaries.
87. Change replay is not new cognition.
88. Artifact handles are opaque runtime references.
89. Artifact handles are not filesystem paths or URLs.
90. Artifact handles are not portable cognitive identity.
91. Artifact access is governed.
92. Artifact upload does not import cognition.
93. Arbitrary external URLs are not fetched automatically.
94. Declared artifact digests are verified before trusted semantic use.
95. Untrusted artifacts are parsed under resource limits.
96. Transport chunking does not change Capsule identity.
97. Runtime support and effective authorization are introspectable but distinct.
98. Compatibility profiles are explicit.
99. Native v2 does not silently inherit v1 mixed batch error rules.
100. The runtime must always make it possible to distinguish "requested", "previewed", "committed", and "unknown outcome".

---

# 472. Core Runtime Equations

```text
Request ID
    ≠
Idempotency Key
    ≠
Transaction ID
```

---

```text
Batch
    ≠
Transaction
```

---

```text
Independent
    =
    Shared Transport
    +
    Separate Semantics
```

---

```text
Sequence
    =
    Ordered Operations
    +
    Separate Commits
```

---

```text
Atomic
    =
    One Snapshot
    +
    Read-Your-Writes
    +
    One Commit Boundary
```

---

```text
Timeout
    ≠
Abort
```

---

```text
Progress
    ≠
Commit
```

---

```text
Preview
    ≠
Reservation
    ≠
Commit
```

---

```text
Search Index State
    ≠
Canonical Cognitive State
```

---

```text
Artifact Handle
    ≠
Artifact Content Identity
```

---

```text
Authenticated Principal
    ≠
Semantic Actor
```

---

```text
Supported Capability
    ≠
Authorized Operation
```

---

# 473. Final Architecture

```text
                         Agent / Client
                              │
                              ▼
                     KIP Request Envelope
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
      request_id          parameters          execution
      Space               artifacts           mode
      purpose/risk        snapshot             idempotency
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    Transport Authentication
                              │
                              ▼
                      Authenticated Principal
                              │
                              ▼
                       Resolve MemorySpace
                              │
                              ▼
                 Parse / Classify / Bind Commands
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
             KQL             KML             META
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                      Execution Semantics
                 independent / sequence / atomic
                              │
              ┌───────────────┼───────────────┐
              │                               │
              ▼                               ▼
          Read Runtime                  Transaction Runtime
              │                               │
      snapshot / index                  snapshot + schema
      Governance                       Governance + idempotency
      projection                       tentative write set
              │                               │
              │                       commit-time revalidation
              │                               │
              └───────────────┬───────────────┘
                              ▼
                          Result State
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
          read result      Receipt          error /
          + context        tx_id/seq       outcome_unknown
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                    Response / Stream Frames
                              │
                              ▼
                         Agent / Client
```

---

# 474. The Runtime Contract in One Sentence

The Protocol Runtime answers four questions for every interaction:

```text
What did you ask?
Under which trusted context was it interpreted?
What state did the Nexus actually observe/change?
How certain are we that the operation committed?
```

---

# 475. Final Principle

A memory protocol fails at the runtime boundary if an Agent can no longer distinguish:

```text
a request from a transaction
a retry from a repeated experience
a timeout from an abort
a search hit from canonical state
a preview from a commit
a Principal from a semantic actor
a batch from an atomic change
a streamed progress message from durable history
an artifact handle from the artifact's identity
a supported feature from an authorized capability
```

Those distinctions are not implementation trivia.

They determine whether a long-lived Agent Brain can preserve:

```text
correct history
safe authority
consistent identity
idempotent learning
reproducible recall
auditable action
portable memory
```

across real networks, failures, retries, schema changes, concurrent Agents, and multiple implementations.

The governing idea is:

> **A Cognitive Nexus is reliable only when an Agent can tell the difference between what it intended to do and what the Brain can prove actually happened.**

KIP 2.0 Protocol Runtime is the contract that makes that difference explicit.
