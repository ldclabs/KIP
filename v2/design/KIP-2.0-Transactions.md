# KIP 2.0 Transactions

**[English](./KIP-2.0-Transactions.md) | [中文](./KIP-2.0-Transactions_CN.md)**

## Status

**Transaction Model Proposal / Pre-Specification Draft**

This document defines the transaction architecture of KIP 2.0: how cognitive, epistemic, schema, governance, maintenance, migration, and import state transitions become atomic, durable, idempotent, auditable, historically reconstructable changes in a Cognitive Nexus.

It builds directly on:

- [KIP-2.0-Architecture.md](KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)

The Core Data Model requires every durable write to belong to one engine transaction and identifies transactions as the history substrate for:

```text
audit
change stream
migration
origin
idempotency
bitemporal reconstruction
```

The Epistemic Model requires Assertion lifecycle transitions to be historically reconstructable.

Governance requires high-impact authority changes to be atomic and historically explainable.

Schema Packages require every transaction to execute against one resolved Schema Environment snapshot and require Schema Environment activation itself to be atomic.

This document makes those requirements concrete.

Its central thesis is:

> **A KIP transaction is the smallest indivisible durable change in the Brain's cognitive state.**

A transaction is not merely:

```text
a batch of commands
a database session
a transport optimization
a list of mutations
```

It represents one coherent state transition that the Cognitive Nexus may later explain as:

> **"At this point in cognitive history, under this schema and authority context, this complete change happened."**

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** indicate intended requirements for the future KIP 2.0 specification.

Exact API names, request JSON, and KML syntax remain illustrative unless explicitly stated.

The transaction semantics are the important part.

---

# 1. Why Transactions Are Cognitive Semantics

Consider a belief correction:

```text
Evidence E1
    supported old Assertion A1

new Evidence E2 arrives
```

A correct revision may require:

```text
1. create Evidence E2
2. create Assertion A2
3. mark A1 superseded
4. create Activity C1 linking E2/A1 → A2
```

If only steps 1–2 succeed:

```text
old Assertion remains active
new Assertion exists
```

If only steps 1–3 succeed:

```text
the provenance Activity is missing
```

If only step 3 succeeds:

```text
the Brain loses its active belief with no replacement
```

These are not merely database inconsistencies.

They change what the Agent believes.

Therefore:

> **Atomicity is part of cognitive correctness.**

---

# 2. Core Transaction Equation

A committed KIP transaction represents:

```text
State_before
      │
      │ authorized + validated transition
      ▼
State_after
```

such that no observer can see:

```text
some-but-not-all
```

of the committed durable changes.

Conceptually:

```text
T:
    S_n → S_n+1
```

where `S_n` is one coherent Space state.

---

# 3. Transaction vs. Command

A **Command** expresses an operation.

A **Transaction** defines the atomicity, snapshot, authorization, validation, commit, history, and receipt boundary around one or more operations.

Therefore:

```text
Command ≠ Transaction
```

A single command may run in one implicit transaction.

Multiple commands may run:

```text
independently
or
inside one explicit transaction
```

depending on the request.

---

# 4. Transport Batch vs. Atomic Transaction

This distinction is normative.

## 4.1 Transport Batch

A transport batch:

```text
commands[]
```

exists to reduce round trips.

Commands execute independently according to ordinary command semantics.

Earlier successful writes are not rolled back merely because a later command fails.

---

## 4.2 Atomic Transaction

An explicit transaction means:

```text
all durable mutations commit
or
none become visible
```

If any required operation fails:

```text
transaction aborts
```

and no durable partial state is exposed.

---

# 5. Why Both Are Needed

Transport batch is efficient for:

```text
DESCRIBE
FIND
SEARCH
unrelated maintenance actions
best-effort administrative work
```

Atomic transaction is required for:

```text
belief revision
Experience formation across multiple elements
Skill validation state transition
entity merge
import merge
schema activation
Grant replacement
declassification
high-impact lifecycle change
```

KIP should not force every batch into an expensive transaction.

It must not let a cheap batch masquerade as atomic cognition.

---

# 6. Transaction Scope

Baseline KIP 2.0 transaction atomicity is scoped to **one MemorySpace**.

A transaction MUST identify exactly one primary:

```text
space_id
```

for durable Space-owned state.

---

# 7. Why Single-Space Atomicity Is the Baseline

MemorySpace is the boundary of:

```text
ownership
Governance
Schema Environment
trust policy
retention
audit
```

Cross-Space transactions introduce:

```text
distributed failure
independent Governance domains
different schema locks
different policy versions
partial network availability
cross-owner rollback semantics
```

Baseline KIP avoids requiring distributed consensus between Spaces.

---

# 8. Cross-Space Atomicity Is Not Core

A baseline KIP 2.0 implementation MUST NOT claim atomicity across multiple MemorySpaces.

Cross-Space workflows use:

```text
Capsule export/import
idempotent transfer
outbox/inbox
saga/compensation
application-level coordination
```

A future capability may advertise:

```text
multi_space_atomic
```

but clients cannot assume it.

---

# 9. Nexus-Level Protected State

Some Nexus-wide control state may not belong naturally to one MemorySpace.

Examples:

```text
global package cache
authentication registry
engine configuration
```

Such state is deployment control plane and outside ordinary KIP Space transactions unless a future specification defines otherwise.

---

# 10. Transaction Substrate Can Span Planes Within One Space

Within one Space, the transaction engine is the common durability substrate for:

```text
Cognitive Plane
Epistemic state
Governance Control Plane
Schema Environment
Mnemonic/Profile state
```

This does not mean ordinary KML may mutate every plane.

Each mutation still requires the appropriate operation channel and Governance authority.

---

# 11. Mixed-Plane Transactions

A protected engine operation MAY atomically affect multiple planes.

Example: authorized declassification may need to:

```text
create redacted cognitive derivative
set protected destination classification
record Declassification Activity
record Governance approval/audit
```

These can be one transaction.

Ordinary KML cannot obtain Governance mutation authority merely because the transaction substrate supports mixed-plane commit.

---

# 12. Transaction Classes

Recommended conceptual classes:

```text
cognitive
epistemic
maintenance
import
migration
governance
schema_environment
declassification
system
```

A transaction may have one primary class and optional sub-class.

The class is descriptive/audit state.

It does not grant authority.

---

# 13. Transaction Identity

Every transaction attempt receives an engine-controlled:

```text
tx_id
```

A `tx_id` MUST be unique within the Nexus.

It SHOULD be globally unique or safely namespaced for portable audit references.

---

# 14. Transaction Attempt vs. Commit

A transaction can end as:

```text
committed
aborted
no_effect
```

Only durable state-changing commits enter the Space Commit Log as committed state transitions.

An implementation may audit failed/aborted attempts separately.

---

# 15. `committed`

All durable changes became visible atomically.

The transaction receives:

```text
space_seq
committed_at
```

---

# 16. `aborted`

No proposed durable transaction mutation becomes visible.

Reasons may include:

```text
validation failure
authorization failure
version conflict
serialization conflict
schema block
resource limit
client cancellation before commit
```

---

# 17. `no_effect`

The request succeeded semantically but produced no durable state delta.

Examples:

```text
idempotent UPSERT finds exact same state
MERGE already canonical under a no-op form
SET field to existing identical value
```

`no_effect` SHOULD NOT mutate element versions merely to prove the request happened.

The idempotency registry/audit may still remember the request.

---

# 18. Space Commit Sequence

Every state-changing committed transaction receives a Space-local monotonic commit position:

```text
space_seq
```

Properties:

```text
strictly increasing
totally orders committed Space state transitions
engine-maintained
not semantic cognition
not based on wall-clock ordering
not necessarily contiguous
```

---

# 19. Why `space_seq` Matters

Wall clocks can:

```text
skew
jump
share equal timestamps
```

A memory brain needs an unambiguous answer to:

> Which cognitive state came first?

`space_seq` provides the logical order.

---

# 20. Space State

Define:

```text
S(k)
```

as the Space state immediately after commit sequence `k`.

Then:

```text
S(k+1)
```

is produced by one committed state-changing transaction.

This provides a clean basis for:

```text
historical epistemic projection
historical Governance
change stream
replication
cache invalidation
audit
```

---

# 21. Unified Space Commit Order

Recommended KIP 2.0 semantics:

> **All committed state transitions affecting one MemorySpace share one logical `space_seq` order, including cognitive, Governance, and Schema Environment transitions.**

Physical stores may differ.

Logical history is unified.

---

# 22. Why Unified Ordering Is Important

Suppose:

```text
seq 100: Agent still has write authority
seq 101: Grant revoked
seq 102: Assertion created
```

Historical audit can immediately ask:

> Was the Assertion authorized?

Likewise:

```text
seq 200: Schema Environment v5
seq 201: Experience created
seq 202: Schema Environment v6
```

The Experience has an unambiguous semantic execution context.

---

# 23. Commit Timestamp

Committed transactions also record:

```text
committed_at
```

using engine time.

`committed_at` is useful for human interpretation.

Ordering authority remains:

```text
space_seq
```

when exact sequencing matters.

---

# 24. Transaction Envelope

Illustrative logical request:

```json
{
  "space_id": "space-1",

  "transaction": {
    "mode": "atomic",

    "idempotency_key": "formation:run-42",

    "options": {
      "isolation": "serializable",
      "dry_run": false
    },

    "preconditions": {
      "schema_environment_version": 12
    },

    "operations": [
      {
        "language": "KML",
        "command": "..."
      }
    ]
  }
}
```

Exact wire format is deferred.

---

# 25. Transaction Execution Context

At start, the engine binds a trusted context including:

```text
tx_id
space_id
authenticated Principal
Delegation chain
request purpose/risk
start time
read snapshot
Schema Environment snapshot
Governance authorization context
idempotency identity
```

---

# 26. Transaction Snapshot

Every transaction executes against a coherent logical start snapshot:

```text
snapshot_seq
```

The transaction reads Space state as of that sequence plus its own tentative writes.

---

# 27. Read-Your-Writes

Inside an atomic transaction:

> **Later operations MUST observe earlier tentative writes in the same transaction.**

Example:

```text
create Evidence E
then create Assertion referencing E
```

must work without committing E first.

---

# 28. No Dirty Reads

Other transactions MUST NOT observe tentative uncommitted writes.

Until commit:

```text
new Evidence
new Assertion
Governance changes
Schema changes
```

remain invisible externally.

---

# 29. Atomic Visibility

At successful commit, all durable transaction changes become visible as one logical state transition.

An observer may see:

```text
state before
or
state after
```

but not a persistent partial middle state.

---

# 30. Isolation Goal

KIP 2.0 SHOULD define transaction behavior independently of database technology.

Implementations may use:

```text
MVCC
optimistic concurrency
locking
single-writer serialization
distributed consensus inside one Space
```

The observable semantics matter.

---

# 31. Required Write Isolation

Recommended baseline for state-changing transactions:

> **Serializable outcome within one MemorySpace.**

A transaction either:

```text
commits in a result equivalent to some serial order
```

or:

```text
aborts with a conflict
```

---

# 32. Why Snapshot Isolation Alone Is Not Enough

Snapshot isolation can prevent many lost updates but permit write skew.

Example:

```text
T1 reads "no active primary Skill"
T2 reads "no active primary Skill"

T1 activates Skill A
T2 activates Skill B
```

Both may commit under weak snapshot isolation even if the profile requires only one active primary Skill.

For Agent cognition and Governance this can violate cross-element invariants.

---

# 33. Serializable Does Not Mean Global Lock

An implementation can provide serializable semantics with:

```text
OCC read-set validation
predicate locks
serializable MVCC
coarse Space write lock
conflict graph
```

KIP does not prescribe the mechanism.

---

# 34. Conformance Fallback

If an implementation cannot guarantee serializable write transactions, it MUST advertise a weaker isolation capability explicitly.

High-assurance clients MAY require:

```text
serializable
```

and reject weaker endpoints.

Baseline KIP implementations SHOULD target serializable semantics.

---

# 35. Read Snapshot Isolation

A read-only transaction should observe one stable:

```text
snapshot_seq
```

across all its queries.

This is stronger than a transport batch where each command might otherwise observe a later commit.

---

# 36. Multi-Query Read Transaction

Useful for:

```text
audit
complex Agent planning
schema exploration
projection preparation
migration preview
```

Example:

```text
Query A at snapshot 500
Query B at snapshot 500
Query C at snapshot 500
```

even if writes commit concurrently.

---

# 37. Snapshot Token

A runtime MAY expose an opaque:

```text
snapshot_token
```

representing a readable historical snapshot.

It may encode/reference:

```text
space_id
snapshot_seq
schema context
expiry
```

Clients MUST treat it as opaque.

---

# 38. Snapshot Lifetime

Read snapshot retention may be bounded.

Runtime capabilities SHOULD advertise:

```text
historical_read_window
snapshot_token_ttl
```

Long-term historical reconstruction may rely on archival history rather than live MVCC snapshots.

---

# 39. External Read Followed by Write

An Agent often:

```text
1. FIND state
2. reason outside Nexus
3. submit mutation
```

This is not one database transaction.

The state may change between 1 and 3.

Therefore the write SHOULD carry explicit preconditions.

---

# 40. Preconditions

Recommended transaction preconditions include:

```text
element version
element exists
element absent
Space revision
Schema Environment version
Governance version/binding
query/result guard
client logical key expectation
```

Exact KML/request syntax is deferred.

---

# 41. Element Version Guard

Existing KIP semantics continue:

```text
EXPECT VERSION n
```

Meaning:

```text
commit only if target version matches n
```

---

# 42. Create-Only Guard

```text
EXPECT VERSION 0
```

or equivalent means:

```text
the addressed logical element must not already exist
```

subject to element identity rules.

---

# 43. Version Is Per Element

Each mutable Cognitive Element carries:

```text
_system.version
```

This is not the Space commit sequence.

Conceptually:

```text
element version
    protects local object revision

space_seq
    orders whole-Space committed transitions
```

---

# 44. Element Version Increment Rule

Recommended refinement:

> **A pre-existing element whose externally visible durable state changes in one committed transaction increments `_system.version` exactly once for that transaction, regardless of how many internal operations touched it.**

New element:

```text
version = 1
```

No-effect final state:

```text
version unchanged
```

---

# 45. Why One Version Increment Per Transaction

A transaction is one externally visible state transition.

Internal mutation order is not independently observable after atomic commit.

This makes:

```text
EXPECT VERSION
audit
change stream
```

simpler and deterministic.

---

# 46. `_system.updated_at`

For an element changed by a transaction:

```text
_system.updated_at = transaction committed_at
```

not an intermediate operation time.

---

# 47. `_system.updated_tx`

For an element changed by a transaction:

```text
_system.updated_tx = tx_id
```

New elements also receive:

```text
created_tx = tx_id
```

---

# 48. Optional Sequence Fields

An implementation MAY additionally expose:

```text
_system.created_seq
_system.updated_seq
```

as engine-maintained convenience fields.

They must correspond to the transaction's `space_seq`.

Core historical semantics must not depend on their presence if transaction lookup can recover the mapping.

---

# 49. Space Revision Guard

A coarse precondition may require:

```text
current_space_seq == expected_seq
```

This means:

> Nothing in the Space may have committed since my read snapshot.

It is strong and may cause unnecessary conflicts.

Use only where whole-Space freshness matters.

---

# 50. Query/Predicate Guard

For read-dependent cross-element invariants, a future KML/transaction API SHOULD support preconditions equivalent to:

```text
query Q still has expected result/hash/count
```

or enforce equivalent serializable validation internally.

This avoids relying only on individual element versions.

---

# 51. Read Set

A serializable implementation conceptually tracks enough of the transaction's read dependencies to detect invalidating concurrent commits.

This can include:

```text
element reads
index/range reads
predicate matches
schema reads
Governance decision dependencies
```

The read set need not be exposed to clients.

---

# 52. Write Set

The engine conceptually computes the final durable write set:

```text
created
updated
lifecycle_changed
merged
tombstoned
purged
Governance_changed
schema_environment_changed
```

before commit.

---

# 53. Commit Validation

Before state becomes visible, engine validates:

```text
authorization still valid
required approvals still valid
preconditions
element versions
serializability conflicts
schema availability
schema validation
Core invariants
Governance invariants
reference integrity
resource limits
```

---

# 54. Transaction Phases

Conceptual pipeline:

```text
1. Receive / normalize request
2. Resolve idempotency
3. Authenticate Principal
4. Bind Space
5. Capture read snapshot
6. Resolve Schema Environment
7. Authorize requested operations
8. Parse / desugar operations
9. Execute tentatively with read-your-writes
10. Validate Core + Package constraints
11. Compute final write set
12. Validate serializability/preconditions
13. Revalidate security-sensitive Governance
14. Commit atomically
15. assign space_seq + committed_at
16. update element system fields
17. append Commit Record
18. publish Change Envelope
19. return Receipt
```

Implementations may fuse phases.

Observable semantics must match.

---

# 55. Desugaring Happens Before Commit

Model-friendly syntax may expand into:

```text
Concept
Proposition
Assertion
Evidence
Activity
```

The entire desugared plan remains inside the same transaction.

No low-level generated object becomes visible before commit.

---

# 56. Schema Resolution Time

Local type/predicate aliases are resolved against the transaction's captured Schema Environment.

After resolution, the semantic plan uses exact refs.

A concurrent default-schema change must not silently reinterpret already parsed operations.

---

# 57. Schema Environment Snapshot

Every write transaction records or can reconstruct:

```text
schema_environment_version
```

used for resolution/validation.

High-assurance receipts SHOULD include it.

---

# 58. Schema Changes During Transaction

If another transaction activates a new default schema while a transaction is running:

```text
already resolved exact refs remain exact
```

The transaction MAY still commit if:

```text
those package versions remain active/writable
all current security constraints remain satisfied
```

---

# 59. Schema Block During Transaction

If the pinned package version becomes:

```text
blocked
quarantined
not writable
```

before commit, the transaction SHOULD abort.

Security response must override convenience.

---

# 60. Schema Change Conflict

Recommended error:

```text
SchemaEnvironmentChanged
or
SchemaVersionNoLongerWritable
```

with safe retry guidance.

---

# 61. Governance Snapshot

Authorization planning begins against a Governance snapshot.

The engine records enough identity to explain:

```text
which Policy
which Grant
which Delegation
which ActorBinding
which approvals
```

were relevant.

---

# 62. Commit-Time Governance Revalidation

Security-sensitive authority MUST be revalidated at commit against current protected state.

This prevents:

```text
transaction starts
Grant revoked
transaction commits using stale authority
```

---

# 63. Revocation Wins

If required authority is revoked before commit:

```text
transaction aborts
```

even if the transaction began while authorized.

This is a deliberate TOCTOU defense.

---

# 64. Governance Changes Unrelated to Transaction

A concurrent unrelated Governance mutation need not abort every transaction.

Implementations may validate only the Governance dependencies that materially affect authorization.

A coarse implementation may use a Space Governance version and abort more often.

---

# 65. Approval Revalidation

An approval can:

```text
expire
be revoked
be consumed
lose prerequisite authority
```

Commit checks applicable approval state again.

---

# 66. Policy Version in Receipt

High-impact receipts SHOULD include:

```text
policy_id/version
effective Principal
Delegation chain identity
approval refs
```

subject to reader authorization.

---

# 67. Origin Assignment

Engine origin is assigned at commit.

For each created/updated element, `_system.origin`/transaction fields reflect the authenticated transaction context.

Author content cannot set them.

---

# 68. Same Transaction, Common Origin

Elements created by one transaction share:

```text
created_tx
Space
commit position
authenticated operation context
```

while semantic `asserted_by` values may differ.

---

# 69. Origin Does Not Replace Provenance

Transaction origin answers:

> Who caused this write in this Nexus?

Activity/Evidence provenance answers:

> How was the semantic content produced?

Both survive.

---

# 70. Idempotency Problem

Agent systems retry frequently because of:

```text
network timeout
tool interruption
response loss
process restart
at-least-once job delivery
```

A client may not know whether a transaction committed.

KIP must make retry safe.

---

# 71. Transaction Idempotency Key

A client MAY supply:

```text
idempotency_key
```

for an atomic transaction.

The key is scoped at least by:

```text
MemorySpace
authenticated Principal / authority context
operation endpoint/class
```

to prevent unrelated callers colliding.

---

# 72. Idempotency Binding

On first finalized attempt, engine binds:

```text
idempotency scope + key
```

to:

```text
canonical request digest
transaction outcome
receipt
```

---

# 73. Exact Retry

If the same scoped key and same canonical request digest are retried:

```text
do not execute again
return the original finalized result/receipt
```

This includes the case where:

```text
original commit succeeded
response was lost
```

---

# 74. Idempotency Conflict

If the same scoped key is reused with a different canonical request:

```text
abort with IdempotencyConflict
```

Do not guess which request the client meant.

---

# 75. Canonical Request Digest

The idempotency digest SHOULD be computed over normalized semantic request structure, not raw whitespace.

Equivalent formatting should not create a false mismatch.

Possible inputs:

```text
parsed operation AST
normalized parameter values
transaction options
target Space
declared preconditions
```

---

# 76. Resolved Schema and Idempotency

The request digest is based on the submitted semantic request.

The original Receipt records the exact Schema Environment used.

On retry after schema changes:

```text
idempotency hit
→ return original outcome
```

rather than re-resolve and execute again.

---

# 77. Idempotency Retention

Implementations SHOULD advertise:

```text
idempotency_retention_window
```

A high-assurance deployment may retain mappings durably.

Clients needing permanent logical deduplication should also use element-level `client_key`.

---

# 78. Transaction Idempotency vs. Element Idempotency

These solve different problems.

```text
transaction idempotency_key
    prevents replaying one request

element client_key
    gives durable logical identity to a non-canonical created element
```

Both may be used together.

---

# 79. Example: Formation Retry

Formation run has:

```text
idempotency_key = formation:conversation-991
```

Transaction creates:

```text
Evidence E
Event V
Experience X
Assertions A*
```

Network response is lost.

Retry with same key:

```text
returns same Receipt
creates nothing new
```

---

# 80. Example: Genuine Repeated Statement

Alice says the same preference twice in two different conversation events.

Use different logical source event/client keys.

These are two Evidence/Assertion events.

Do not deduplicate merely because semantic text is identical.

---

# 81. Client Key Conflict

For non-canonical element creation:

```text
same client_key
different immutable semantic payload
```

SHOULD fail with a logical identity conflict.

This distinguishes:

```text
retry
```

from:

```text
attempt to reuse event identity for different event
```

---

# 82. Proposition Idempotency

Proposition creation remains structurally canonical:

```text
(space, subject, predicate, object)
```

Concurrent get-or-create must resolve to one canonical Proposition.

---

# 83. Concurrent Canonical Proposition Creation

If T1 and T2 both tentatively create the same Proposition:

```text
one commit may create it first
```

The other serializable transaction may:

```text
resolve to the already-created canonical Proposition
and continue
```

if its semantics remain valid, or abort/retry.

It MUST NOT create duplicate canonical Propositions.

---

# 84. Assertion Idempotency

Assertions are not structurally deduplicated by:

```text
proposition + actor + stance
```

because repeated statements are meaningful.

Use:

```text
transaction idempotency
client_key
source event identity
```

for retry detection.

---

# 85. Transaction No-Op Semantics

A transaction whose final canonical durable state is identical to the start state SHOULD be classified:

```text
no_effect
```

and SHOULD NOT:

```text
increment element versions
change updated_at
emit cognitive change records
```

---

# 86. Why No-Op Must Be Side-Effect Free

Otherwise:

```text
repeated idempotent write
→ version increases
→ change stream event
→ cache invalidation
→ maintenance trigger
```

which defeats practical idempotency.

---

# 87. Audit Exception

A security policy MAY record an audit event for:

```text
attempted Governance action
no-op high-risk request
denied request
```

That audit record is separate from claiming cognitive state changed.

---

# 88. Read Operations Inside Write Transaction

An atomic transaction MAY contain reads used to:

```text
bind IDs
check state
compute update targets
return resulting state
```

These reads use the transaction snapshot + own writes.

---

# 89. Returned Read Results

If a transaction returns query results based on tentative state, the response is delivered only after successful commit.

If commit aborts:

```text
tentative results must not be presented as committed truth
```

The engine may return diagnostics separately.

---

# 90. KQL and KML Mixing

A future explicit transaction API MAY permit:

```text
KQL read
KML write
KQL verify
```

inside one transaction.

Exact syntax is deferred.

---

# 91. Model Complexity Warning

Transaction-wide arbitrary scripting can make KIP difficult for LLMs.

Baseline design SHOULD favor:

```text
small number of declarative operations
clear preconditions
deterministic desugaring
```

rather than a procedural transaction language.

---

# 92. Transaction-Local Handles

KML may support local handles inside one mutation statement.

A future explicit transaction MAY support transaction-local result bindings.

Baseline v2 does not require cross-command mutable variables.

Use:

```text
one structured mutation
client_key
canonical references
```

where possible.

---

# 93. Nested Transactions

Baseline KIP 2.0 SHOULD NOT expose nested transaction semantics.

An operation called inside an active transaction participates in the outer transaction or is rejected as unsupported.

No independent inner commit may become visible before outer commit.

---

# 94. Savepoints

Savepoints are not required in baseline KIP.

Agent transactions should remain small enough to abort/retry as one cognitive change.

Implementations may offer savepoints as a non-portable capability.

---

# 95. Transaction Size

Runtimes MAY cap:

```text
operations
mutated elements
Evidence bytes
execution time
read set size
write set size
```

Capabilities SHOULD expose limits.

---

# 96. Resource Exhaustion

If an atomic transaction exceeds a hard resource limit before commit:

```text
abort entirely
```

Do not partially commit a prefix.

---

# 97. Bulk Maintenance

Large maintenance jobs SHOULD be divided into bounded atomic transactions.

Example:

```text
maintenance run
    batch 1 tx
    batch 2 tx
    batch 3 tx
```

The overall maintenance job is not one giant transaction.

---

# 98. Maintenance Run Identity

A profile/system may give the overall job:

```text
run_id
```

while each atomic batch has its own:

```text
tx_id
idempotency_key
```

This supports resumability.

---

# 99. Partial Multi-Transaction Job

If batch 3 fails after batches 1–2 commit:

```text
batches 1–2 remain valid
```

The job resumes from a durable checkpoint.

This is not a violation of transaction atomicity because the job explicitly consists of multiple cognitive transitions.

---

# 100. Atomicity Boundary Must Be Semantic

Choose transaction size according to:

> Which changes are invalid if observed separately?

Do not choose solely by arbitrary command count.

---

# 101. Assertion Revision Transaction

Recommended atomic set:

```text
new Evidence
new Assertion
old self-Assertion lifecycle → superseded
derivation/correction Activity
```

when all pieces express one belief revision.

---

# 102. Third-Party Contradiction Transaction

If new third-party claim arrives:

```text
create Evidence
create third-party Assertion
```

Do not supersede existing independent actor Assertions automatically.

A later maintenance transaction may derive:

```text
contested summary
review task
```

---

# 103. Retraction Transaction

A valid actor retraction may atomically:

```text
transition Assertion active → retracted
record retracted_at
record transaction origin
optionally create Evidence of retraction
create Activity if required
```

---

# 104. Retraction Is a Lifecycle Event

Historical reconstruction must know:

```text
when
who authorized it
under which transaction
```

not merely current:

```text
status = retracted
```

---

# 105. Lifecycle Transition History

Transitions such as:

```text
active → superseded
active → retracted
active → expired
active → quarantined [Governance]
```

MUST be reconstructable from:

```text
transaction/change history
or
equivalent append-preserving version history
```

for deployments advertising historical projection.

---

# 106. Current Field vs. Historical Transition

The current Assertion may store:

```text
lifecycle.status = superseded
```

while the transaction log records:

```text
seq 800:
    status active → superseded
```

Both are useful.

---

# 107. Lifecycle Transition Validity

Invalid transitions should fail.

Example:

```text
retracted → active
```

may require a new Assertion rather than resurrecting the old one.

Exact lifecycle state machines belong to Core/Epistemic schemas.

Transaction enforces declared transitions atomically.

---

# 108. Evidence Correction Transaction

A correction may atomically:

```text
create Evidence E2
mark E1 corrected
link E1.corrected_by = E2
create new Assertion if conclusion changes
create correction Activity
```

---

# 109. Experience Formation Transaction

Formation of one Experience may atomically create:

```text
Experience
ExperienceSteps
Event link/reference
Evidence refs
learning-value Facet
SleepTask for procedural consolidation
```

if partial representation would be invalid.

---

# 110. Skill Compilation Transaction

Procedural consolidation may atomically:

```text
create/update Skill
link source Experiences
update Skill validation counters
record procedural consolidation Activity
set candidate authority/profile state
```

Governance authority elevation is separate unless one privileged operation explicitly includes it.

---

# 111. Identity Merge Transaction

Concept merge must be atomic because canonical identity affects:

```text
Proposition resolution
query results
Epistemic Conflict Sets
Governance-sensitive identity interpretation
```

KIP 2.0 non-destructive merge may atomically:

```text
mark source merged
set merged_into
update canonical resolution index
resolve canonical Proposition collisions
record merge Activity/audit
```

without rewriting raw historical references.

---

# 112. Governance Replacement Transaction

Example:

```text
revoke Grant G1
create Grant G2
update group membership
```

may be one transaction when temporary overlap/gap would be unsafe.

---

# 113. Schema Environment Activation Transaction

Atomic activation may modify:

```text
installed package states
exact Schema Lock
aliases
write defaults
blocked/deprecated states
environment version
Governance audit
```

No observer sees a half-resolved environment.

---

# 114. Schema Migration Is Usually Separate from Activation

Recommended:

```text
Tx A:
    activate new schema environment

Tx B..N:
    migrate data in bounded batches
```

because migrations may be large.

Old schema versions remain readable during the dual-version period.

---

# 115. Activation-With-Small-Migration

For a small tightly coupled schema transition, a privileged operation MAY combine activation and data migration in one atomic transaction.

It must obey transaction size limits.

---

# 116. Migration Transaction

A migration transaction should record:

```text
source schema version
target schema version
migration descriptor/method
input element refs
output element refs
Activity
```

and use an idempotency key.

---

# 117. Migration Retry

A batch migration should be safe under retry through:

```text
transaction idempotency
element client_key
migration marker
exact source version preconditions
```

---

# 118. Import Transaction

A bounded Capsule import into one Space may be one atomic transaction.

It includes:

```text
local ID resolution
canonical Proposition resolution
Evidence/Assertion creation
destination origin
classification/authority defaults
import provenance
```

---

# 119. Large Capsule Import

Large Capsule import may exceed transaction limits.

Then import should use:

```text
staging/quarantine
chunked durable staging
final activation/merge transaction
```

rather than exposing half-imported cognition as normal active memory.

---

# 120. Staged Import

Conceptual:

```text
Capsule
    ↓
quarantine staging transactions
    ↓
validation complete
    ↓
atomic publish/activate transaction
```

Staging data is not visible to ordinary Recall.

---

# 121. Declassification Transaction

Authorized declassification should atomically:

```text
read restricted source snapshot
create derivative
assign approved classification
record Declassification Activity
record approval refs
record audit
```

so no public derivative appears without its Governance state.

---

# 122. Purge Transaction

Purge may affect:

```text
Evidence bytes
references
tombstones
dependent records
audit receipts
```

The purge plan must be validated before commit.

If policy requires cascades, the allowed cascade is atomic within transaction limits.

---

# 123. Legal Purge and Historical Reconstruction

Physical purge may make some historical state unreconstructable.

Transaction history MUST NOT fabricate removed content.

It may retain an allowed receipt such as:

```text
element existed
purged under policy X at seq N
content unavailable
```

if law/policy permits.

---

# 124. Transaction Log Is Not an Excuse to Retain Forbidden Data

Auditability does not override privacy/legal deletion.

Change records may need:

```text
redaction
cryptographic tombstone
minimal metadata
complete purge
```

according to Governance.

---

# 125. External Side Effects

KIP transactions guarantee atomicity only for state controlled by the Cognitive Nexus transaction engine.

They MUST NOT claim atomic rollback of arbitrary external actions such as:

```text
send email
send payment
deploy service
call third-party API
delete external file
execute shell command
```

---

# 126. The World Cannot Be Rolled Back by KIP

This is a critical Agent principle.

```text
KIP transaction abort
```

cannot unsend:

```text
an email
a bank transfer
a production deployment
```

Therefore external side effects must be modeled explicitly.

---

# 127. External Tool Calls Should Not Run Inside Atomic Commit

A KIP transaction SHOULD NOT hold locks/snapshots while invoking arbitrary external tools.

Reasons:

```text
unbounded latency
non-repeatability
irreversible effects
network uncertainty
deadlocks
security
```

---

# 128. Action Intent Pattern

Recommended:

```text
Tx 1:
    persist Decision / ActionIntent
    persist belief snapshot/audit context
    commit

External Action Runtime:
    execute authorized tool action

Tx 2:
    persist outcome Evidence
    persist Activity result
    update Experience
```

---

# 129. Outbox Pattern

A deployment may use a transactional Outbox record:

```text
Tx:
    cognitive decision
    +
    ActionRequest/Outbox item
```

After commit, an external worker consumes the Outbox.

This ensures:

```text
no action request without durable decision state
```

---

# 130. Inbox/Outcome Pattern

Tool outcome returns with an external:

```text
operation_id
```

Formation records it using an idempotent transaction.

This prevents duplicated outcome Evidence under at-least-once delivery.

---

# 131. External Exactly-Once Is Not Guaranteed by KIP

KIP can provide:

```text
exactly-once durable memory commit
```

under an idempotency key.

It cannot universally provide exactly-once external action semantics.

External tools need their own idempotency/transaction mechanisms.

---

# 132. Transaction Receipt

Every finalized explicit transaction SHOULD return a structured Receipt.

The Receipt is engine truth about the transaction outcome.

---

# 133. Receipt Logical Shape

Illustrative:

```json
{
  "tx_id": "tx-123",
  "status": "committed",

  "space_id": "space-1",
  "space_seq": 912,
  "snapshot_seq": 910,

  "committed_at": "2026-08-13T14:00:00Z",

  "idempotency": {
    "key": "formation:991",
    "request_digest": "sha256:..."
  },

  "execution": {
    "transaction_class": "cognitive",
    "isolation": "serializable"
  },

  "schema": {
    "environment_version": 17
  },

  "governance": {
    "decision_ref": "gov-decision-...",
    "policy_versions": []
  },

  "changes": {
    "created": ["evidence-1", "assertion-2"],
    "updated": ["assertion-1"],
    "tombstoned": [],
    "purged": []
  },

  "change_cursor": "opaque-cursor",

  "warnings": []
}
```

---

# 134. Receipt Is Not Cognitive Evidence by Default

A Receipt proves:

```text
the Nexus committed this state transition
```

It does not prove:

```text
the semantic Assertions are true
```

If a Brain wants to reason about a transaction outcome, it may reference the Receipt through Evidence/provenance.

---

# 135. Receipt Privacy

Receipts may contain:

```text
Principal IDs
hidden element IDs
policy identities
classification details
```

Governance controls receipt visibility/redaction.

A public caller may receive a reduced Receipt.

---

# 136. Minimal Receipt

Minimum committed transaction receipt SHOULD expose to an authorized caller:

```text
tx_id
status
space_id
space_seq
committed_at
result summary
```

plus enough information for safe retry.

---

# 137. High-Assurance Receipt

May include:

```text
snapshot_seq
request_digest
schema_environment_version
package digests
policy versions
effective Principal
Delegation refs
approval refs
mutation IDs
result digest
change cursor
```

---

# 138. Receipt Digest

A high-assurance implementation MAY compute:

```text
receipt_digest
```

over a canonical Receipt form.

Capsule/proof specifications may later define signatures/attestations.

---

# 139. Failed Receipt

An aborted transaction may return:

```json
{
  "tx_id": "tx-124",
  "status": "aborted",
  "snapshot_seq": 912,
  "error": {
    "code": "VersionConflict"
  }
}
```

No `space_seq` is assigned for a non-state-changing abort.

---

# 140. No-Effect Receipt

Example:

```json
{
  "tx_id": "tx-125",
  "status": "no_effect",
  "snapshot_seq": 912,
  "space_seq": null
}
```

Idempotency mapping may preserve it.

---

# 141. Transaction Lookup

A runtime SHOULD allow an authorized client to resolve:

```text
tx_id
or
idempotency key
```

to finalized transaction status/Receipt.

This is essential after ambiguous network failure.

---

# 142. Unknown Outcome Recovery

Client sends transaction.

Connection fails.

Correct recovery:

```text
lookup/retry same idempotency key
```

not:

```text
blindly submit a fresh logical transaction
```

---

# 143. Commit Record

For each state-changing commit, engine stores a logical immutable **Commit Record**.

It represents the durable historical state transition.

---

# 144. Commit Record Logical Fields

Recommended:

```text
tx_id
space_id
space_seq
snapshot_seq
committed_at
transaction class
request/result digest
schema environment identity
Governance decision/audit refs
change summary
origin Principal
```

Exact retained detail is Governance/retention-sensitive.

---

# 145. Commit Record Is Append-Preserving

A later correction creates another Commit Record.

Do not rewrite:

```text
what committed at seq N
```

to reflect current beliefs.

---

# 146. Change Stream

The Space Commit Log can be exposed through a resumable **Change Stream**.

Conceptual operation:

```text
CHANGES SINCE <cursor>
```

or equivalent API.

---

# 147. Change Envelope

One state-changing transaction produces one logical Change Envelope:

```json
{
  "space_id": "space-1",
  "space_seq": 912,
  "tx_id": "tx-123",
  "committed_at": "...",

  "transaction_class": "cognitive",

  "changes": [
    {
      "op": "create",
      "kind": "evidence",
      "id": "E1",
      "new_version": 1
    },
    {
      "op": "update",
      "kind": "assertion",
      "id": "A1",
      "old_version": 2,
      "new_version": 3
    }
  ]
}
```

---

# 148. Change Ordering

Change Envelopes are ordered by:

```text
space_seq
```

Changes inside one envelope have deterministic engine-defined ordering.

Consumers must treat the envelope as one atomic commit.

---

# 149. Change Stream Delivery

A stream may provide:

```text
at-least-once delivery
```

with resumable cursor.

Consumers deduplicate by:

```text
space_seq
tx_id
```

KIP does not require a push transport.

Polling is sufficient.

---

# 150. Cursor Is Opaque

Clients must not construct Change cursors by guessing `space_seq`.

The runtime may allow explicit sequence queries separately.

Cursor can encode:

```text
authorization view
stream class
position
expiry
```

---

# 151. Change Stream Filtering

Authorized streams may filter by:

```text
transaction class
element kind
schema package
Governance event class
```

Filtering must not leak hidden changes.

---

# 152. Unified vs. Specialized Streams

Logical Space ordering is unified.

Runtime MAY expose specialized views:

```text
cognitive changes
Governance audit changes
schema changes
```

They should retain transaction/space ordering references.

---

# 153. Change Payload Levels

Possible authorized levels:

```text
existence only
ID/version
field diff
before/after
full element
```

Governance controls exposure.

---

# 154. Field Diff Is Not Always Retainable

Sensitive/purged data may prevent retaining old values.

The transaction history can still preserve:

```text
field changed
version changed
```

without retaining prohibited content.

---

# 155. Change Stream and Cache Invalidation

Consumers may use changes to invalidate:

```text
Epistemic Projection cache
search indexes
Schema primers
authorization caches
Recall caches
materialized views
```

---

# 156. Change Stream and Maintenance

A Brain MAY trigger maintenance from changes:

```text
new contradiction
new Experience
new Evidence
new Commitment
```

but reading the Change Stream itself must not automatically reinforce memory strength.

---

# 157. Change Stream and Replication

A replica can apply committed transaction envelopes in `space_seq` order.

Canonical replication format may differ from user-facing change output.

---

# 158. Transaction Log vs. Cognitive Activity

A transaction log says:

> State changed.

An `Activity` says:

> A semantic/provenance process happened.

They are different.

A consolidation transaction may create:

```text
Activity C
```

and its Commit Record proves that the Nexus stored it.

---

# 159. Historical Reconstruction

KIP needs to distinguish:

```text
current state
historical state
```

Historical reconstruction can use:

```text
versioned storage
change log replay
periodic snapshots + log
event-sourced representation
```

KIP does not prescribe physical architecture.

---

# 160. Required Logical Capability

An implementation advertising:

```text
historical_projection
historical_governance
```

MUST retain enough authorized history to reconstruct requested state, subject to purge/retention limits.

---

# 161. `AS OF space_seq`

Conceptually, historical reads can request:

```text
Space state as of sequence N
```

Exact KQL/META syntax is deferred.

---

# 162. `AS OF tx_id`

Because each committed tx maps to a sequence, an implementation MAY support:

```text
AS OF tx_id
```

---

# 163. `AS OF time`

Time-based historical query may resolve:

```text
latest committed space_seq
whose committed_at <= T
```

subject to clock semantics.

For exact history, sequence/transaction identity is preferable.

---

# 164. Historical Epistemic Projection

To answer:

> What did the Agent believe as of sequence N?

reconstruct:

```text
Cognitive Elements as of N
Assertion lifecycle as of N
Evidence available as of N
Schema Environment as of N
Trust/Governance policy state as of N
```

then run the selected historical Epistemic Projection semantics.

---

# 165. Current Belief About Historical World Time

Different query:

> What does the Agent now believe about world time T?

Use:

```text
current cognitive state
current Evidence
current policy
Assertion valid_time around T
```

Transactions make the distinction reproducible.

---

# 166. Historical Governance

To answer:

> Could Principal P read Element X at sequence N?

reconstruct:

```text
Grant
Delegation
Group membership
Policy
ActorBinding
classification
Schema/Governance state
```

as of N.

---

# 167. Historical Schema

To interpret an old element:

```text
schema_ref exact version
```

resolves its immutable Package Artifact.

Schema Environment history additionally explains:

```text
whether that version was active/default then
```

---

# 168. Historical Origin

`created_tx` / `updated_tx` connect an element to exact Commit Records.

This allows:

```text
when did this enter memory?
which Principal wrote it?
under which policy/schema?
```

---

# 169. Historical Version Reconstruction

If an element changes across:

```text
seq 100 version 1
seq 130 version 2
seq 190 version 3
```

a query at seq 150 returns version 2.

Physical implementation may reconstruct or store versions.

---

# 170. History Retention Classes

A deployment MAY retain different detail levels:

```text
full history
lifecycle history
audit-only history
recent history
minimal receipts
```

Capabilities must accurately advertise what historical queries are supported.

---

# 171. Purge Boundary

If required data was legally purged:

```text
historical reconstruction may return unavailable/redacted
```

not fabricated historical content.

---

# 172. Snapshot Compaction

Implementations MAY compact old transaction logs into:

```text
historical snapshots
Merkle checkpoints
archive segments
```

provided required logical history and audit semantics remain.

---

# 173. Commit Log Integrity

High-assurance implementations SHOULD protect commit history against silent tampering.

Possible techniques:

```text
append-only storage
hash chaining
Merkle structures
signed checkpoints
replication
```

KIP 2.0 baseline does not mandate one cryptographic scheme.

Capsule/proof work may define portable attestations later.

---

# 174. Transaction Hash Chain

Optional concept:

```text
commit_digest_n =
    H(commit_record_n, commit_digest_previous)
```

This can provide tamper-evident Space history.

It is not required for all implementations.

---

# 175. Hash Chain vs. Truth

Tamper-evident commit history proves:

```text
record history integrity
```

not semantic truth of Assertions.

---

# 176. Dry Run / Preview

A transaction MAY support:

```text
dry_run
preview
validate_only
```

meaning:

```text
parse
resolve schema
authorize
evaluate planned mutations
validate constraints
estimate result
do not commit
```

---

# 177. Preview Is Not a Reservation

State may change after preview.

Therefore:

```text
preview success
≠
future commit guaranteed
```

Commit revalidates all relevant conditions.

---

# 178. Preview Receipt

A preview may return:

```text
snapshot_seq
schema environment
predicted write set
validation warnings
authorization constraints
estimated impact
```

It must clearly state:

```text
not committed
```

---

# 179. Migration Preview

Especially useful for:

```text
affected element count
incompatible fields
conflict changes
Governance impact
estimated transaction batches
```

---

# 180. Import Preview

Can show:

```text
new Concepts
canonical merges
conflicts
Schema dependencies
classification
authority defaults
untrusted executable artifacts
```

before commit.

---

# 181. Governance Preview

A high-risk Policy/Grant change may preview:

```text
who gains access
who loses access
which delegations become invalid
```

but actual activation still requires current approvals.

---

# 182. Transaction Cancellation

A client MAY request cancellation before commit.

Cancellation is best-effort.

If commit already finalized:

```text
cannot roll back by cancellation
```

A compensating transaction may be required.

---

# 183. No General Rollback of Committed Cognitive History

KIP SHOULD NOT expose:

```text
ROLLBACK COMMITTED TX
```

as if history never happened.

A committed cognitive event is historical fact about the Nexus.

Correction uses a new transaction.

---

# 184. Compensation

To undo current effect:

```text
create compensating state transition
```

Example:

```text
wrong Grant created
    ↓
new tx revokes Grant
```

The original commit remains in audit.

---

# 185. Cognitive Correction Is Compensation, Not Time Travel

Wrong self-belief:

```text
A1 committed
```

Later correction:

```text
A2 supersedes A1
```

Do not delete the historical fact that A1 existed unless privacy policy requires purge.

---

# 186. Transaction Failure Categories

Recommended classes:

```text
SyntaxError
ValidationError
AuthorizationDenied
ApprovalRequired
VersionConflict
SerializationConflict
PreconditionFailed
SchemaResolutionError
SchemaEnvironmentChanged
SchemaVersionBlocked
IdempotencyConflict
ReferenceConflict
UniquenessConflict
ResourceExhausted
TransactionTooLarge
CrossSpaceAtomicityUnsupported
ExternalSideEffectUnsupported
InternalError
```

Exact KIP error codes are deferred.

---

# 187. Retryability

Errors SHOULD indicate:

```text
retryable
non_retryable
retry_after_refresh
requires_approval
requires_schema_update
```

---

# 188. Version Conflict Recovery

Correct pattern:

```text
re-read current state
re-run reasoning/merge
submit new transaction
```

not:

```text
blind retry with same stale version
```

unless retry is only resolving an ambiguous prior commit through idempotency key.

---

# 189. Serialization Conflict Recovery

Correct:

```text
retry whole transaction against fresh snapshot
```

because its read-dependent reasoning may have changed.

---

# 190. Authorization Conflict Recovery

If authority changed:

```text
do not auto-retry under assumed old authority
```

Agent should inspect current effective permissions.

---

# 191. Schema Conflict Recovery

If schema environment changed:

```text
DESCRIBE current schema
re-resolve aliases
revalidate plan
```

unless idempotency lookup shows the original transaction already finalized.

---

# 192. Idempotency Conflict Recovery

Never generate a random new key to hide a same-key/different-request bug without first deciding whether the original logical operation should be replaced.

The conflict signals client state confusion.

---

# 193. Transaction Expiry

A transaction MAY have:

```text
max_execution_time
deadline
```

If deadline expires before commit:

```text
abort
```

---

# 194. Long Transactions

Long write transactions increase:

```text
conflict probability
snapshot retention
revocation delay pressure
resource usage
```

KIP Agent workflows SHOULD prefer short atomic writes.

Reason outside the transaction when possible, then use explicit preconditions.

---

# 195. Do Not Hold Brain Transaction While LLM Thinks

Recommended:

```text
read snapshot/state
    ↓
LLM reasoning outside transaction
    ↓
write transaction with preconditions
```

not:

```text
BEGIN transaction
call LLM for 30 seconds
commit
```

---

# 196. Why

LLM reasoning is:

```text
slow
non-deterministic
potentially tool-calling
```

and should not hold transactional resources.

---

# 197. Transaction Intent Digest

A Brain may record an optional semantic:

```text
intent_digest
```

describing the high-level reason for a transaction.

This is audit metadata.

It does not replace actual operations/provenance.

---

# 198. Human-Readable Transaction Summary

A Receipt or audit record MAY include:

```text
"Corrected Alice's timezone based on new direct statement."
```

This summary is non-authoritative convenience.

The actual change set remains canonical.

---

# 199. Transaction Provenance Activity

Some cognitive operations SHOULD also create a semantic `Activity`.

Example:

```text
transaction class = maintenance
Activity class = semantic_consolidation
```

The transaction proves storage transition.

The Activity expresses cognitive process.

---

# 200. Transaction Does Not Replace Activity

Not every transaction means a world/cognitive Activity worth graph storage.

Examples:

```text
cache-neutral reindex
schema lock administrative update
Grant revoke
```

may be fully explained by transaction/governance audit.

---

# 201. Commit Hooks

Internal engine systems may trigger after commit:

```text
index update
change notification
cache invalidation
replication
maintenance scheduling
```

These hooks MUST NOT make the original transaction partially committed if a downstream hook fails.

---

# 202. Durable Commit Before Notification

Recommended order:

```text
durable state + Commit Record
    ↓
commit finalized
    ↓
notifications/change delivery
```

If notification fails, consumers recover from Change Stream.

---

# 203. Index Consistency

A search index may be asynchronously updated after commit.

If so, runtime capabilities must explain:

```text
search consistency lag
```

Canonical KQL-by-ID/state reads must reflect committed source of truth according to advertised consistency.

---

# 204. Search Is Not Commit Authority

A just-committed element may temporarily be absent from an eventually consistent semantic index.

This does not mean the transaction failed.

Receipt/ID read is authoritative.

---

# 205. Read Consistency Levels

Runtime MAY advertise:

```text
strong
snapshot
eventual-index
```

for different read paths.

KIP canonical state operations should have a strong/snapshot path for correctness-sensitive Agent workflows.

---

# 206. Transaction and Search Planning

An Agent should not use eventual SEARCH result absence as a create-only guarantee.

Use:

```text
canonical identity
client_key
EXPECT VERSION
transaction precondition
```

instead.

---

# 207. Dry-Run IDs

Preview should avoid allocating durable IDs where possible.

It MAY return:

```text
temporary handles
predicted canonical matches
```

but clients must not assume preview IDs will be committed unless explicitly reserved by a supported mechanism.

---

# 208. ID Allocation

IDs may be allocated before commit internally.

Aborted IDs SHOULD NOT be reused if reuse could confuse audit/reference systems.

Core already prefers non-reuse.

---

# 209. Transaction Local Time

All engine-maintained transaction timestamps should use one consistent commit-time basis.

Semantic times remain separate:

```text
Evidence.observed_at
Assertion.asserted_at
Assertion.valid_time
```

---

# 210. Transaction Time Is Not World Time

A memory may be committed today about an event from last year.

```text
committed_at = today
valid_time   = last year
```

Do not infer world chronology from transaction order alone.

---

# 211. Transaction Time Is Cognitive Availability Time

Transaction commit answers:

> When did this Nexus acquire/change this durable cognitive state?

That makes it central to bitemporal cognition.

---

# 212. Transaction Ordering of Concurrent Evidence

Two observations may happen in real world order:

```text
E1 observed_at 10:00
E2 observed_at 10:01
```

but be committed in reverse order due to network delays.

Both clocks remain.

```text
observation order ≠ cognitive commit order
```

---

# 213. Transaction Ordering and Belief Revision

A Brain may receive late Evidence about an earlier world time.

The new transaction can revise current belief-about-history without rewriting earlier belief-as-of history.

---

# 214. Consistent Projection During Concurrent Writes

Epistemic Projection SHOULD execute against one:

```text
snapshot_seq
```

so support/opposition sets do not mix states from different commits.

---

# 215. Projection Result Snapshot Identity

Projection output SHOULD be able to include:

```text
snapshot_seq
schema environment
policy version
```

so a decision can later be reproduced.

---

# 216. Decision Provenance

A Decision Activity may reference:

```text
Projection audit
snapshot_seq
```

Then after outcome, the Brain can answer:

> What exact cognitive state informed this decision?

---

# 217. Governance Decision Snapshot

Authorization of a KIP write and Epistemic Projection used by an Agent decision are different.

Both may reference the same Space sequence but different policy systems.

Do not conflate:

```text
allowed to write
```

with:

```text
believed premise
```

---

# 218. Schema Snapshot and Historical Decision

A historical decision can be audited against:

```text
schema definitions active/used then
```

rather than today's type semantics.

---

# 219. Change Stream Backpressure

Consumers may fall behind.

Runtime SHOULD provide:

```text
cursor resume
retention window
checkpoint/snapshot recovery
```

rather than requiring realtime consumption.

---

# 220. Change Stream Retention

If detailed changes expire, runtime should provide a recovery strategy such as:

```text
current snapshot + later stream
archive fetch
```

depending on conformance level.

---

# 221. Consumer Checkpoint

A consumer stores:

```text
last applied cursor/space_seq
```

outside or inside its own state.

Reprocessing must be idempotent.

---

# 222. Stream Redelivery

At-least-once stream means:

```text
same Change Envelope may arrive again
```

Consumer deduplicates by transaction identity.

---

# 223. Change Stream Is Not an Assertion Feed

A change says:

```text
Assertion A was created
```

not:

```text
Proposition P became true
```

Epistemic Projection still decides belief.

---

# 224. Change Stream Is Not a Memory-Reinforcement Signal by Default

Repeated consumption/replay of the same Change Envelope must not:

```text
increase confidence
increase evidence count
create duplicate Experience
```

Idempotent consumers are required.

---

# 225. Transaction and Event Sourcing

KIP does not require pure event sourcing.

Valid implementations include:

```text
current-state store + append log
MVCC database
event store + projections
snapshot database + audit log
```

as long as observable KIP semantics hold.

---

# 226. Current State Is Still First-Class

KIP should not force every normal query to replay the transaction log.

The log exists for:

```text
history
audit
replication
change stream
```

Current cognitive graph remains optimized for Recall.

---

# 227. Transaction Log Is Engine State, Not Ordinary Graph

Commit Records and low-level Change Records are engine/audit state.

They SHOULD NOT automatically appear as ordinary Concepts.

A Profile MAY mirror selected high-level transactions as Events/Activities.

---

# 228. Transaction Visibility

Governance applies to transaction history.

A Principal may be allowed to read an element but not:

```text
who originally wrote it
internal policy decision
other hidden changes in same transaction
```

Receipts/history can be redacted.

---

# 229. Atomic Transaction and Hidden Changes

If one transaction changes both visible and hidden records, a low-privilege change-stream view must not leak hidden change count/details.

It may expose:

```text
one visible change envelope projection
```

or other policy-safe representation.

---

# 230. Transaction Size Side Channel

Detailed mutation counts may leak hidden state.

Governance may redact:

```text
total changes
hidden IDs
exact affected counts
```

---

# 231. Cross-Space Transfer Pattern

Recommended:

```text
Source Space Tx/Read Snapshot:
    export Capsule C at source_seq

Transfer:
    durable external/capsule identity

Destination Tx:
    import C with idempotency_key
```

No claim of distributed atomicity.

---

# 232. Source Export Mutation

Pure export is read-only and need not create a cognitive state transaction.

If policy requires export audit:

```text
Governance audit transaction/event
```

may record that the export occurred.

---

# 233. Destination Import Identity

Import Receipt should record:

```text
source Capsule digest
source origin receipt if available
destination tx_id
destination space_seq
```

This enables transfer audit.

---

# 234. Transfer Retry

Destination retries use:

```text
idempotency_key derived from transfer/capsule identity
```

to avoid duplicate import.

---

# 235. Cross-Space Saga

For workflows requiring source mutation after destination import:

```text
1. destination import commits
2. source receives acknowledgement
3. source marks transfer state
```

If step 3 fails, retry.

Do not fake distributed rollback.

---

# 236. Governance Transfer Risk

Source export authority and destination import authority are independently evaluated.

A Principal authorized on one side does not automatically gain authority on the other.

---

# 237. Transaction Capabilities

Runtime capability negotiation SHOULD expose:

```text
atomic_transactions
serializable_transactions
read_snapshots
historical_reads
idempotency
idempotency_retention
change_stream
change_stream_retention
transaction_lookup
dry_run
max_transaction_operations
max_transaction_writes
multi_space_atomic
```

---

# 238. Transaction Conformance Levels

Possible suites:

```text
KIP Transactions Core
KIP Transactions Serializable
KIP Transactions Historical
KIP Transactions Change Stream
KIP Transactions High Assurance
```

---

# 239. Core Transaction Conformance

A minimal conforming KIP 2.0 transaction implementation MUST support equivalent semantics for:

```text
single-Space atomic write
no dirty reads
read-your-writes within transaction
all-or-nothing commit
engine transaction ID
element versioning
optimistic version guards
Schema Environment binding
Governance authorization
idempotent transaction retry
Receipt
```

---

# 240. Serializable Conformance

Adds:

```text
serializable outcome
predicate/range conflict protection
write-skew prevention
```

---

# 241. Historical Conformance

Adds:

```text
Space commit ordering
historical state reconstruction
lifecycle reconstruction
historical Governance/schema context
```

---

# 242. Change Stream Conformance

Adds:

```text
resumable cursor
ordered transaction envelopes
at-least-once-safe identity
authorized filtering/redaction
```

---

# 243. High-Assurance Conformance

May add:

```text
tamper-evident commit log
signed/checkpointed receipts
strong audit retention
policy/Schema digest receipts
```

---

# 244. Transaction Conformance Fixtures

Tests should include:

```text
multi-element belief revision commits atomically
middle operation failure leaves zero durable changes
read-your-writes
concurrent version conflict
write skew under serializable mode
same idempotency key exact retry
same key different request
network-loss lookup/retry
same canonical Proposition concurrent creation
no-op write does not bump element version
schema alias resolved consistently during transaction
schema blocked before commit
Grant revoked before commit
approval revoked before commit
large transaction abort
change envelope order
historical lifecycle reconstruction
purged history returns unavailable
transport batch remains non-atomic
cross-space atomic request rejected unless capability
external tool action not claimed as rollback-safe
```

---

# 245. Idempotency Fixtures

```text
commit succeeds, response lost, retry
abort before commit, retry after correction
same request different whitespace
same key different parameter
key reuse by different Principal
key retention expiry
client_key collision
repeated genuine user statement
```

---

# 246. Isolation Fixtures

```text
T1/T2 update same element
T1/T2 create same canonical Proposition
T1/T2 activate mutually exclusive profile state
range query + concurrent insert causing write skew
Governance revoke during transaction
Schema Environment activation during transaction
```

---

# 247. Historical Fixtures

```text
Assertion active at seq 10
superseded at seq 20
query seq 15 → active
query seq 25 → superseded

Grant active at seq 30
revoked at seq 40
authorization-as-of 35 → allowed
authorization-as-of 45 → denied

Schema @2 default at seq 50
Schema @3 default at seq 60
element created seq 55 → @2
element created seq 65 → @3
```

---

# 248. Change Stream Fixtures

```text
one transaction changes five elements
→ one envelope

consumer receives envelope twice
→ applies once

hidden Evidence changed in same tx
→ unauthorized stream does not leak hidden detail

cursor resumes after reconnect
→ no committed transaction lost
```

---

# 249. External Side-Effect Fixtures

```text
transaction attempts embedded HTTP call
→ reject/unsupported

ActionIntent commits
worker executes once with external idempotency
outcome delivered twice
→ one durable outcome Evidence through KIP idempotency
```

---

# 250. Transaction Invariants

The following are normative design targets.

1. A KIP transaction is an atomic durable cognitive/control-state transition.
2. Transport batch is not atomic transaction.
3. Earlier successful transport-batch writes are not retroactively rolled back by later batch errors.
4. Explicit transaction mutations are all-or-nothing.
5. Baseline transaction atomicity is single-MemorySpace.
6. Cross-Space atomicity is not a Core guarantee.
7. Every state-changing commit receives a `tx_id`.
8. Every state-changing Space commit receives a monotonic `space_seq`.
9. `space_seq` is the logical ordering authority, not wall-clock timestamp.
10. One Space SHOULD have one unified logical commit order across cognitive, Governance, and Schema Environment state.
11. Every transaction reads from one coherent start snapshot.
12. A transaction reads its own tentative writes.
13. Uncommitted writes are invisible externally.
14. Commit exposes one atomic state transition.
15. State-changing write transactions SHOULD provide serializable outcomes.
16. Database implementation strategy is not prescribed.
17. External read-then-write reasoning is not automatically one transaction.
18. Read-dependent external reasoning should use explicit preconditions.
19. `EXPECT VERSION` protects element revision, not whole-Space state.
20. Element version and Space sequence are different.
21. A changed existing element increments version once per committed transaction.
22. A new element begins at version 1.
23. No-effect writes do not increment element version.
24. `updated_at` reflects commit time for a changed element.
25. `updated_tx` identifies the committing transaction.
26. Schema local names resolve against one captured Schema Environment.
27. Persisted refs use exact schema versions.
28. Concurrent schema default change does not silently reinterpret an in-flight transaction.
29. A package blocked before commit can invalidate the transaction.
30. Authorization is revalidated before commit.
31. Authority revoked before commit prevents commit.
32. Approval revoked/expired before commit prevents dependent commit.
33. Cognitive content cannot alter transaction authorization context.
34. Transaction origin is engine-controlled.
35. Transaction origin does not replace semantic provenance.
36. Transaction idempotency is separate from logical element idempotency.
37. Same scoped idempotency key + same request returns original finalized outcome.
38. Same scoped idempotency key + different request fails.
39. Retry after ambiguous network loss should use transaction lookup/idempotency.
40. Proposition structural uniqueness survives concurrent creation.
41. Repeated Assertions are not deduplicated merely by semantic equality.
42. No-effect idempotent writes do not generate cognitive change noise.
43. Historical lifecycle transitions are reconstructable where historical conformance is advertised.
44. Retraction history is not erased by current lifecycle state.
45. Correction is a new transaction, not rewriting past transaction history.
46. Committed transaction history is append-preserving subject to legal/privacy purge.
47. General rollback of committed cognitive history is not a KIP semantic.
48. Reversal uses compensating transactions.
49. KIP transactions do not atomically roll back external world side effects.
50. Arbitrary external tool calls should not execute inside KIP atomic commit.
51. External action workflows should use durable intent/outcome patterns.
52. Transaction Receipt proves commit, not semantic truth.
53. Receipt visibility is governed.
54. Change Stream is ordered by committed transaction identity/sequence.
55. Change Stream delivery may be at-least-once.
56. Consumers must deduplicate Change Envelopes.
57. Replaying a change does not create new Evidence or reinforcement.
58. Transaction history is engine/audit state, not automatically Cognitive Graph content.
59. Activity and Transaction are distinct concepts.
60. Schema migration history must preserve semantic version context.
61. Schema Environment activation is atomic.
62. Write transactions execute against one Schema Environment snapshot.
63. Governance replacement may be atomic where privilege gaps/overlap matter.
64. Import of one bounded Space is atomic or explicitly staged/quarantined.
65. Large maintenance/migration/import jobs may consist of multiple bounded transactions.
66. Job-level partial progress does not violate transaction atomicity when batch boundaries are explicit.
67. Dry-run/preview does not reserve future success.
68. Commit revalidates preview assumptions.
69. Transaction cancellation after commit cannot undo history.
70. Historical reconstruction may be limited by legitimate purge and must never fabricate removed content.

---

# 251. Recommended Transaction API Shape

Illustrative only:

```json
{
  "space_id": "space-1",

  "transaction": {
    "mode": "atomic",

    "idempotency_key": "memory-formation:msg-991",

    "isolation": "serializable",

    "preconditions": {
      "schema_environment_version": 17
    },

    "operations": [
      {
        "command": "..."
      },
      {
        "command": "..."
      }
    ]
  }
}
```

The final API may instead provide:

```text
execute_transaction(...)
```

to make the atomicity boundary impossible to confuse with existing `execute_kip(commands=...)`.

---

# 252. Recommended Naming Decision

Because KIP 1.x already uses:

```text
commands[]
```

for non-atomic batch execution, KIP 2.0 SHOULD avoid adding:

```text
commands[] + transaction=true
```

as a subtle flag.

A distinct top-level transaction form or API is safer and more self-explanatory.

---

# 253. Possible Interface Separation

Recommended conceptual interfaces:

```text
execute_kip
    one command / transport batch

execute_kip_transaction
    explicit atomic transaction

execute_kip_readonly
    ordinary read

execute_kip_snapshot
    multiple reads pinned to one snapshot

transaction_status
    lookup by tx_id / idempotency key

changes
    resumable Space Change Stream
```

Exact MCP/HTTP shape is deferred.

---

# 254. Why Explicit Interface Helps Agents

An LLM can understand:

```text
"These four changes must succeed together."
```

and choose:

```text
transaction
```

instead of accidentally relying on batch behavior.

Atomicity becomes visible in the tool model.

---

# 255. Example: Atomic Belief Correction

Conceptual transaction:

```text
TRANSACTION:
    create Evidence E2
        "Alice now says timezone is +01:00"

    canonicalize Proposition P2
        (Alice, timezone, "+01:00")

    create Assertion A2
        support P2
        asserted_by Alice
        evidence E2

    supersede self-derived Assertion A1

    create Activity C
        correction / consolidation
        inputs A1, E2
        output A2
```

Commit result:

```text
either all five relationships/state changes exist
or none do
```

---

# 256. Example: Concurrent Maintenance Conflict

Formation reads:

```text
Preference version 4
```

Maintenance also reads version 4.

Formation transaction commits version 5.

Maintenance tries:

```text
EXPECT VERSION 4
```

Result:

```text
VersionConflict
```

Maintenance re-reads and re-evaluates rather than overwriting Formation.

---

# 257. Example: Write Skew

Two maintenance workers see:

```text
no current canonical Skill for goal G
```

Both plan to create one.

Serializable transaction semantics ensure:

```text
one commits first
second revalidates conflict/invariant
```

instead of silently creating two "single-current" Skills if the Profile declares that invariant.

---

# 258. Example: Governance Revocation During Commit

```text
seq 100:
Agent has export authority.

Agent starts export-audit transaction.

seq 101:
Owner revokes export authority.

Agent reaches commit.
```

Commit-time Governance revalidation:

```text
deny/abort
```

The old authority cannot be used after revocation.

---

# 259. Example: Schema Upgrade During Formation

Formation starts under:

```text
Schema Environment v17
Experience → @2.0.0
```

Governance activates environment v18 with:

```text
default @2.1.0
```

If `@2.0.0` remains writable:

```text
Formation may commit exact @2.0.0 refs
Receipt records environment v17
```

If `@2.0.0` was security-blocked:

```text
abort
```

---

# 260. Example: Network Timeout

Client submits transaction:

```text
idempotency_key = run-991
```

Nexus commits:

```text
tx-500
space_seq 900
```

Response is lost.

Client retries same key.

Nexus returns:

```text
tx-500
space_seq 900
```

No new Evidence/Assertion is created.

---

# 261. Example: Same Idempotency Key, Different Payload

First:

```text
run-991 → Alice timezone +08
```

Later bug:

```text
run-991 → Alice timezone +01
```

Expected:

```text
IdempotencyConflict
```

not silently treating the second as retry.

---

# 262. Example: Read Transaction

Agent needs a coherent audit view:

```text
FIND Assertion
FIND Evidence
DESCRIBE schema
PROJECT belief
```

Read transaction pins:

```text
snapshot_seq = 1200
```

All results refer to one coherent state.

---

# 263. Example: Action Flow

```text
Tx 1:
    Decision Activity
    ActionIntent
    projection snapshot ref
    commit

External worker:
    sends email

Tx 2:
    Evidence: email API accepted
    Activity outcome
    Experience update
```

If Tx 2 fails, email remains sent.

Retry Tx 2 with external operation ID/idempotency.

KIP does not pretend the email can be rolled back.

---

# 264. Example: Large Import

100,000-element Capsule.

Instead of one huge transaction:

```text
Stage chunks into quarantine
    tx 1..N

Validate complete staged package

Final tx:
    publish/import manifest
    activate visibility
```

Ordinary Recall never sees half-imported state.

---

# 265. Example: Historical Belief

```text
seq 10:
A1 active

seq 20:
A2 created
A1 superseded

seq 30:
counter-Evidence arrives
```

Query:

```text
belief as of seq 15
```

reconstructs A1 active.

Query:

```text
belief as of seq 25
```

reconstructs A1 superseded + A2.

Current belief about the same historical world period may additionally use seq 30 Evidence.

---

# 266. Example: Historical Authorization

```text
seq 40:
Grant G active

seq 50:
G revoked
```

A write committed at:

```text
seq 45
```

can be proven to have occurred while G was valid.

A write attempt after seq 50 cannot rely on G.

---

# 267. Example: No-Op UPSERT

Current:

```text
Concept.name = "Alice"
version = 7
```

Transaction sets:

```text
name = "Alice"
```

Final canonical state unchanged.

Result:

```text
no_effect
version remains 7
updated_at unchanged
no cognitive Change Envelope
```

---

# 268. Example: Semantic Event vs. Commit Event

World:

```text
Alice changed jobs on July 1.
```

Brain learns this August 13.

Assertion:

```text
valid_from = July 1
asserted_at = August 13
```

Transaction:

```text
committed_at = August 13
space_seq = 2000
```

All three timelines are preserved.

---

# 269. Relationship to Core Data Model

Transactions finalize several Core requirements:

```text
_system.version
created_tx
updated_tx
atomic cognitive transition
client_key interaction
canonical Proposition concurrency
```

The Core model remains the durable element model.

Transactions define how element states change coherently.

---

# 270. Relationship to Epistemic Model

Transactions provide:

```text
Assertion lifecycle history
Evidence availability history
belief-as-of boundaries
decision snapshot identity
```

required for historical Epistemic Projection.

---

# 271. Relationship to Governance

Transactions provide:

```text
atomic Grant/Policy changes
commit-time revocation safety
Governance audit ordering
historical authorization
approval binding
```

Governance decides authority.

Transaction ensures authority-sensitive state changes are durable and ordered.

---

# 272. Relationship to Schema Packages

Transactions provide:

```text
Schema Environment snapshot
exact resolution boundary
atomic activation
migration batching
upgrade conflict handling
receipt schema version
```

---

# 273. Relationship to Cognitive Capsule

This specification creates requirements for `KIP-2.0-Capsule.md`:

```text
snapshot-consistent export
source Space sequence
destination idempotent import
import transaction receipt
staged large imports
source/destination transaction lineage
```

---

# 274. Relationship to KQL

KQL should eventually support:

```text
snapshot/as-of reads
transaction-pinned reads
transaction ID/system history lookup where authorized
```

Exact syntax is deferred.

---

# 275. Relationship to KML

KML should eventually support:

```text
transaction-safe mutations
element version guards
create-only guards
client keys
lifecycle transitions
deterministic desugaring
```

KML command syntax does not itself define multi-command atomicity.

The transaction container does.

---

# 276. Relationship to META

META should expose:

```text
transaction capabilities
current Space sequence
Schema Environment version
transaction status
change stream capability
history capability
```

and possibly:

```text
DESCRIBE TRANSACTION
```

for authorized audit.

---

# 277. Relationship to Anda Brain

Anda Brain should treat transaction choice as part of memory strategy.

Formation:

```text
one semantic memory encoding
→ one bounded transaction
```

Maintenance:

```text
one coherent consolidation/revision unit
→ one transaction
```

Large sleep:

```text
many resumable transactions
```

Action:

```text
decision transaction
external action
outcome transaction
```

---

# 278. Transaction Design Heuristic for Brain

Ask:

> **If another Agent observed only half of these changes, would the Brain become semantically invalid or misleading?**

If yes:

```text
put them in one transaction.
```

If no:

```text
separate transactions may be safer and more scalable.
```

---

# 279. Final Architecture

```text
                   Agent / Human / System
                            │
                            ▼
                    Transaction Request
                            │
                            ▼
                     Idempotency Gate
                            │
                            ▼
               Authentication / Governance
                            │
                            ▼
                    Snapshot Sequence
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       Schema Snapshot   Cognitive     Governance
                         Operations      Operations
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                     Tentative State
                            │
                            ▼
                Core / Schema Validation
                            │
                            ▼
                 Serializable Validation
                            │
                            ▼
               Commit-Time Authorization
                            │
                     ┌──────┴──────┐
                     │             │
                    fail          pass
                     │             │
                     ▼             ▼
                   Abort      Atomic Commit
                                   │
                                   ▼
                           assign space_seq
                                   │
                 ┌─────────────────┼──────────────────┐
                 │                 │                  │
                 ▼                 ▼                  ▼
             State Update       Commit Log       Change Stream
                 │                 │                  │
                 └─────────────────┼──────────────────┘
                                   ▼
                                Receipt
                                   │
                                   ▼
                            Future Cognition
```

---

# 280. Core Transaction Equations

```text
Transport Batch
    ≠
Atomic Transaction
```

```text
Transaction
    =
    One Indivisible Durable Cognitive Transition
```

```text
Element Version
    ≠
Space Commit Sequence
```

```text
World Time
    ≠
Observation Time
    ≠
Assertion Time
    ≠
Transaction Time
```

```text
Preview Success
    ≠
Commit Guarantee
```

```text
KIP Commit
    ≠
External World Commit
```

```text
Rollback of Current Effect
    =
    New Compensating Transaction
```

not:

```text
erase committed history
```

and:

```text
Historical Brain State
    =
    Reconstruct(
      Cognitive State,
      Epistemic Lifecycle,
      Governance,
      Schema Environment
      AS OF space_seq
    )
```

---

# 281. Final Principle

KIP 1.x already has valuable transactional primitives:

```text
atomic UPSERT blocks
atomic MERGE
EXPECT VERSION
idempotent mutation intent
batch execution
```

KIP 2.0 turns those pieces into a coherent cognitive history model.

A real Agent memory brain must be able to answer:

> Did this belief revision happen completely?

> Did the Evidence and Assertion commit together?

> Did another Agent change the state while I was reasoning?

> Was my write based on a coherent snapshot?

> Which schema version gave these fields meaning?

> Was the writer still authorized at the exact moment of commit?

> If the network response disappeared, did the transaction actually happen?

> Can I retry without duplicating an Experience or Assertion?

> What exact state existed before this change?

> What did the Brain believe immediately afterward?

> Which Governance policy and Delegation allowed it?

> Can I reconstruct an Assertion's lifecycle years later?

> Can I stream changes to indexes and maintenance workers without double-learning them?

> If I reverse a mistake, can I preserve the fact that I once made it?

> If the Agent sends an email or deploys production, does the memory system understand that the external world cannot be rolled back like a database?

KIP 2.0 answers these questions by treating transaction history as the **temporal spine of the Cognitive Nexus**.

The governing idea is:

> **Memory is not only what the Brain contains. Memory is also the ordered history of how the Brain became what it is.**

A transaction is the atomic unit of that becoming.
