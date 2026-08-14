# KIP 2.0 KML — Cognitive Mutation Language

## Status

**Mutation Language Proposal / Pre-Specification Draft**

This document defines the mutation semantics of KIP 2.0: how an Agent records new cognitive state, creates truth-neutral Propositions, records Assertions and Evidence, preserves provenance through Activities, revises belief without rewriting history, updates mutable memory/profile state, manages lifecycle transitions, consolidates identity, and expresses compound cognitive changes safely inside Transactions.

It builds directly on:

- [KIP-2.0-Architecture.md](KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)
- [KIP-2.0-Transactions.md](KIP-2.0-Transactions.md)
- [KIP-2.0-Capsule.md](KIP-2.0-Capsule.md)
- [KIP-2.0-KQL.md](KIP-2.0-KQL.md)

KIP 1.x defines KML as the language for knowledge evolution, centered on:

```text
UPSERT
UPDATE
DELETE
MERGE
EXPECT VERSION
```

Those primitives contain several strong ideas:

```text
declarative mutation
model-friendly syntax
local handles
idempotent writes
optimistic concurrency
bulk metabolism
atomic merge
```

KIP 2.0 preserves those ideas, but the data model has changed fundamentally.

In KIP 1.x, a Proposition link can simultaneously behave like:

```text
semantic relation
fact
assertion
confidence carrier
source carrier
lifecycle record
```

KIP 2.0 separates these meanings:

```text
Proposition
    = truth-neutral semantic statement

Assertion
    = historically attributable epistemic commitment

Evidence
    = durable cognitive artifact cited by Assertions

Activity
    = provenance process

Facet
    = profile-specific cognitive/mnemonic state

Governance
    = protected authority/security state

Transaction
    = one indivisible durable cognitive state transition
```

Therefore KML 2.0 must also change.

Its central thesis is:

> **A Cognitive Mutation Language should make it easy to add new cognition and deliberately hard to rewrite the past.**

The most important semantic distinction is:

```text
State Edit
    ≠
Cognitive Claim Revision
```

Changing:

```text
Experience.memory_strength
Skill.validation_count
Concept.display_name
```

may be an ordinary state edit.

Changing:

```text
"Alice's timezone is +08:00"
```

to:

```text
"Alice's timezone is +01:00"
```

is not an UPDATE of an old Fact.

It is a new cognitive event:

```text
new Evidence
+
new Proposition if needed
+
new Assertion
+
possible supersession of an older Assertion
+
provenance Activity
```

The language must preserve that distinction by construction.

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** indicate intended requirements for the future KIP 2.0 specification.

The grammar shown here is an architecture-level proposal.

A future formal grammar may refine punctuation while preserving the mutation semantics and safety invariants.

---

# 1. KML 2.0 Design Goals

KML 2.0 SHOULD be:

```text
Model-First
declarative
append-friendly
history-preserving
schema-aware
provenance-aware
transaction-native
idempotency-safe
governed
LLM-readable
implementation-independent
```

The language should make common Agent memory writes compact without hiding their epistemic meaning.

---

# 2. Non-Goals

KML is not:

```text
a general-purpose programming language
a database administration shell
a Governance policy language
a Schema Package language
a trust-policy language
an arbitrary migration-script runtime
an external tool execution language
a hidden chain-of-thought recorder
a substitute for Transaction semantics
```

KML expresses cognitive mutation intent.

The Transaction Runtime decides when one or more intents commit atomically.

---

# 3. Mutation Planes

KIP 2.0 distinguishes mutation planes.

## 3.1 Cognitive Content

Examples:

```text
Concept
Proposition
Evidence
Activity
Experience
Skill
Profile Facets
```

---

## 3.2 Epistemic State

Examples:

```text
Assertion creation
Assertion retraction
Assertion supersession
Evidence correction lineage
```

---

## 3.3 Mnemonic / Profile State

Examples:

```text
memory_strength
salience
utility
review state
consolidation state
```

---

## 3.4 Retention / Lifecycle

Examples:

```text
archive
tombstone
purge
expiry scheduling
```

---

## 3.5 Protected Control State

Examples:

```text
Governance classification
Grant
Delegation
Policy
Trust Resolver
Schema Environment
authority elevation
ActorBinding
canonical identity binding
```

Ordinary KML MUST NOT mutate this plane.

Protected control-plane operations may share the same underlying Transaction Runtime, but they use Governance/Schema operations rather than ordinary cognitive mutation syntax.

---

# 4. Core Mutation Equation

A KML mutation produces:

```text
proposed cognitive delta
```

A Transaction turns that delta into:

```text
authorized
validated
atomic
historically ordered
durable state
```

Therefore:

```text
KML
    =
    Mutation Intent

Transaction
    =
    Durable State-Transition Boundary
```

---

# 5. KML Command vs. Transaction

A standalone state-changing KML statement executes in one implicit transaction.

Example:

```prolog
UPDATE ?exp
SET FACET "MnemonicState" {
  memory_strength: 0.8
}
WHERE {
  ?exp {id: :experience_id}
}
```

is one atomic state transition.

---

# 6. Multiple Commands Are Not Automatically Atomic

A transport request:

```text
commands[]
```

does not become a transaction merely because commands were sent together.

If:

```text
Evidence creation
Assertion creation
supersession
Activity creation
```

must succeed together, use:

```text
one MUTATE block
```

or:

```text
an explicit multi-command Transaction
```

---

# 7. The Native KML Statement Families

Recommended KML 2.0 families:

```text
MUTATE

CREATE CONCEPT
UPSERT CONCEPT

ENSURE PROPOSITION

CREATE EVIDENCE
CREATE ASSERTION
CREATE ACTIVITY

UPDATE

RETRACT ASSERTION
SUPERSEDE ASSERTION
CORRECT EVIDENCE
TRANSITION ACTIVITY

SET RETENTION
ARCHIVE
TOMBSTONE
PURGE

MERGE CONCEPT
```

Ergonomic syntactic sugar such as `ASSERT` may compile to these primitives.

---

# 8. Why KML 2.0 Uses Different Creation Verbs

Not every Core element has the same identity/lifecycle semantics.

```text
Concept
    may be long-lived and mutable

Proposition
    structurally canonical and immutable

Evidence
    historically distinct artifact

Assertion
    historically distinct epistemic event

Activity
    historically distinct provenance process
```

A single universal `UPSERT EVERYTHING` would erase these differences.

---

# 9. State Mutation Classes

KML internally distinguishes:

```text
create
ensure
upsert
update
transition
merge
archive
tombstone
purge
```

Each has different idempotency and history rules.

---

# 10. `CREATE`

Meaning:

> Create one historically distinct element, unless an explicit durable `client_key` proves this is a retry of the same logical creation.

Used for:

```text
Evidence
Assertion
Activity
event-like/profile Concepts
```

---

# 11. `ENSURE`

Meaning:

> Resolve or create the canonical element identified by semantic structure.

Used primarily for:

```text
Proposition
```

because a Space maintains a canonical Proposition for one semantic tuple.

---

# 12. `UPSERT`

Meaning:

> Resolve one stable identity-bearing mutable Concept and apply the requested mutable state.

Used for:

```text
Person
Project
Organization
durable Skill identity
stable profile/configuration Concepts
```

where schema and policy permit.

---

# 13. `UPDATE`

Meaning:

> Mutate allowed mutable fields of already-existing elements selected by a pattern.

It never creates semantic history.

---

# 14. `TRANSITION`

Meaning:

> Move a lifecycle state through an explicitly valid state machine.

Examples:

```text
Assertion active → retracted
Assertion active → superseded
Activity running → completed
```

---

# 15. `MERGE`

Meaning:

> Consolidate identity resolution without rewriting raw historical references.

---

# 16. `TOMBSTONE`

Meaning:

> Logically remove an element from ordinary active use while preserving minimal identity/reference history.

---

# 17. `PURGE`

Meaning:

> Physically remove bytes under explicit high-impact authority and reference-aware policy.

---

# 18. The `MUTATE` Compound Statement

KIP 2.0 introduces a native compound mutation container:

```prolog
MUTATE {
  ...
}
```

A `MUTATE` block represents one coherent mutation plan and executes atomically as one implicit transaction.

---

# 19. Why `MUTATE`, Not `UPSERT`, Is the Compound Container

A compound cognitive transition may contain:

```text
create Evidence
ensure Proposition
create Assertion
supersede old Assertion
create Activity
```

Calling the whole operation `UPSERT` would imply that all elements are mutable identity slots.

They are not.

`MUTATE` describes the transaction-neutral intent more accurately.

---

# 20. Illustrative `MUTATE`

```prolog
MUTATE {
  CREATE EVIDENCE ?e {
    CLIENT KEY :evidence_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: {
        mode: "inline",
        inline: {
          text: "My timezone is now +01:00."
        }
      },
      observed_at: :observed_at
    }
  }

  ENSURE PROPOSITION ?p (
    :alice_id,
    "timezone",
    "+01:00"
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice_id,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :observed_at
    }

    SET STRUCTURAL {
      ("evidence", ?e) {role: "support"}
    }
  }

  SUPERSEDE ASSERTION :old_assertion_id BY ?a

  CREATE ACTIVITY ?activity {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "belief_revision",
      started_at: :observed_at,
      ended_at: :observed_at,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :old_assertion_id)
      ("inputs", ?e)
      ("outputs", ?a)
    }
  }
}
```

Either the entire transition commits or none of it becomes visible.

---

# 21. Mutation Block Is Declarative, Not Sequential

KIP 1.x `UPSERT` executes local blocks sequentially and requires define-before-use.

KIP 2.0 SHOULD change this for `MUTATE`.

All local handles declared in one `MUTATE` block are resolved as one declarative mutation graph before commit.

Therefore:

```text
forward local references are allowed.
```

---

# 22. Why Forward References Are Needed

Core provenance can naturally contain:

```text
Evidence.generated_by → Activity
Activity.outputs       → Evidence
```

That is a legitimate structural cycle.

A strict define-before-use DAG would force:

```text
create one
commit
update the other
```

and break atomic provenance formation.

---

# 23. Two-Phase Mutation Planning

Conceptually:

```text
Phase 1:
    parse all clauses
    allocate/resolve local handles
    resolve exact Schema symbols
    canonicalize Propositions

Phase 2:
    construct final mutation graph
    validate references/cycles/cardinality
    validate mutability
    authorize
    commit atomically
```

No partial local-handle state is externally visible.

---

# 24. Clause Order Has No Mutation Semantics

Inside a native `MUTATE` block:

```text
source order is for readability
```

not:

```text
imperative execution order.
```

An engine may reorder planning operations.

---

# 25. Duplicate Local Handle

A handle may be declared exactly once inside a `MUTATE` block.

Example invalid:

```prolog
CREATE EVIDENCE ?x {...}
CREATE ASSERTION ?x {...}
```

Expected:

```text
DuplicateLocalHandle
```

---

# 26. Local Handle Scope

A local handle:

```text
?e
?p
?a
```

exists only inside one `MUTATE` statement.

It is not a durable ID.

The result maps it to the actual local element ID.

---

# 27. Local Handles Are Not KQL Variables

Both use:

```text
?name
```

for model consistency, but their semantics differ:

```text
KQL ?x
    query solution variable

KML MUTATE ?x
    local mutation handle
```

The statement context makes the meaning unambiguous.

---

# 28. Single Final Mutation Per Existing Target

Inside one `MUTATE`, an existing mutable element SHOULD have one declarative final mutation specification.

Conflicting subclauses that depend on source order should fail with:

```text
DuplicateMutationTarget
```

rather than using hidden last-write-wins order.

---

# 29. Lifecycle Clauses May Reference Created Handles

Allowed:

```prolog
SUPERSEDE ASSERTION :old BY ?new
```

where `?new` is created in the same block.

---

# 30. Preconditions

KML 2.0 preserves:

```prolog
EXPECT VERSION :v
```

for mutable existing elements.

---

# 31. `EXPECT VERSION`

Meaning:

```text
commit only if current element _system.version == expected
```

A changed element increments version once for the committed transaction.

---

# 32. Create-Only Guard

Where an identity-addressed creation can resolve an existing logical element:

```prolog
EXPECT VERSION 0
```

means:

```text
must not already exist.
```

---

# 33. State Guard

Lifecycle operations SHOULD support:

```prolog
EXPECT STATE "active"
```

or equivalent.

Example:

```prolog
RETRACT ASSERTION :assertion_id
EXPECT STATE "active"
```

This protects against stale lifecycle transitions.

---

# 34. Transaction-Level Preconditions

Broader guards such as:

```text
Space sequence
Schema Environment version
query predicate guard
Governance binding version
```

belong to the Transaction envelope.

KML does not need to reproduce every transaction precondition syntax.

---

# 35. Native Identity Rules

KML 2.0 does not use:

```text
type + name
```

as universal identity.

---

# 36. `id`

An immutable local:

```text
id
```

addresses an existing element.

A client cannot choose a new engine ID through ordinary KML.

---

# 37. Concept `key`

A stable Space-local Concept key may provide idempotent model-facing identity.

Example:

```text
person:alice
project:kip
skill:deploy-database-migration
```

---

# 38. `client_key`

Historically distinct, non-canonical elements may use:

```text
client_key
```

for durable logical creation identity.

Examples:

```text
message:abc:assertion
tool-run:991:evidence
experience:conversation:20260813:42
activity:consolidation:run-9:item-12
```

---

# 39. `key` vs. `client_key`

```text
Concept.key
    stable semantic identity of a Concept

client_key
    stable client-side identity of a creation event/artifact
```

They solve different problems.

---

# 40. Transaction Idempotency vs. Element Idempotency

```text
transaction idempotency_key
    protects replay of one whole transaction

client_key
    protects durable logical creation of one non-canonical element

Concept key
    grounds a stable identity-bearing Concept

Proposition tuple
    gives structural canonical identity
```

---

# 41. Repetition Must Not Be Erased

If Alice says the same sentence on Monday and Tuesday, these are potentially two real cognitive events.

Do not deduplicate solely because:

```text
same Proposition
same asserted_by
same stance
same text
```

Use source-event/client-key identity to distinguish:

```text
retry
```

from:

```text
genuine repetition.
```

---

# 42. `CREATE CONCEPT`

For a historically distinct or newly introduced Concept:

```prolog
CREATE CONCEPT ?exp {
  TYPE "Experience"
  CLIENT KEY :experience_key

  NAME "Deployment failure 2026-08-13"

  SET ATTRIBUTES {
    goal: "Deploy release 2.1",
    outcome_status: "failure"
  }
}
```

---

# 43. `CREATE CONCEPT` Semantics

The engine:

```text
resolves TYPE to exact schema_ref
validates schema
creates a new local ID
binds ?exp
```

If `CLIENT KEY` exists:

```text
same client_key + same immutable creation identity
    → existing result / no-effect retry

same client_key + conflicting immutable identity
    → ClientKeyConflict
```

---

# 44. Create Without `CLIENT KEY`

A repeated execution is a new logical creation unless the surrounding Transaction idempotency key proves it is the same request replay.

This is intentional for:

```text
Events
Experiences
observations
```

---

# 45. Concept Name Is Mutable Grounding State

`NAME` is a display/grounding label.

It is not the Concept's universal identity.

---

# 46. `CREATE CONCEPT` May Set Attributes

Only Schema-declared creation fields are allowed.

If an attribute represents an epistemic fact that needs:

```text
source
confidence
validity
contradiction
history
```

Schema/profile design SHOULD model it as:

```text
Proposition + Assertion
```

rather than a mutable attribute.

---

# 47. `CREATE CONCEPT` Facets

A Profile may allow:

```prolog
SET FACET "MnemonicState" {
  memory_strength: 0.7,
  salience: 0.9
}
```

Facet semantics are Schema Package-defined.

---

# 48. `CREATE CONCEPT` Structural Fields

Example:

```prolog
SET STRUCTURAL {
  ("experienced_by", :self_id)
}
```

Structural fields are validated against Schema definitions.

---

# 49. `UPSERT CONCEPT`

Long-lived identity-bearing Concepts can be safely created-or-updated by a stable identity selector.

Recommended syntax:

```prolog
UPSERT CONCEPT ?project {
  MATCH {
    type: "Project",
    key: "kip-2"
  }

  SET FIELDS {
    name: "KIP 2.0"
  }

  SET ATTRIBUTES {
    description: "KIP 2.0 protocol redesign"
  }
}
```

---

# 50. Native `UPSERT CONCEPT` Identity Selector

A native upsert selector MUST contain a stable identity such as:

```text
id
or
key
```

according to schema.

---

# 51. Name-Only Upsert Is Forbidden in Native v2

Invalid:

```prolog
UPSERT CONCEPT ?alice {
  MATCH {
    type: "Person",
    name: "Alice"
  }
}
```

because:

```text
same name
≠
same identity.
```

---

# 52. Compatibility Exception

A `kip-1-compat` profile may translate legacy:

```text
type + name
```

into a migrated:

```text
key
```

for types that historically used name identity.

Native v2 does not restore universal name identity.

---

# 53. Upsert by `id`

```prolog
UPSERT CONCEPT ?x {
  MATCH {id: :id}
  EXPECT VERSION :v

  SET ATTRIBUTES {...}
}
```

requires the Concept to exist.

It does not create an arbitrary caller-chosen ID.

---

# 54. Upsert by `key`

```prolog
MATCH {
  type: "Person",
  key: "alice"
}
```

may create the Concept if absent and schema/policy permits.

The engine assigns the local ID.

---

# 55. `canonical_id` Is Not Ordinary Upsert Authority

An imported/caller-provided:

```text
canonical_id
```

must not force identity consolidation through ordinary KML.

Protected canonical identity binding uses Governance identity authority.

---

# 56. `SET FIELDS`

KML may use:

```prolog
SET FIELDS {
  name: "New display name"
}
```

for Core fields that the mutability matrix permits.

---

# 57. Field Mutability Is Enforced by Element Kind

Examples:

```text
Concept.name
    mutable

Concept.schema_ref
    normally immutable

Concept.key
    immutable

Proposition tuple
    immutable

Assertion epistemic payload
    immutable

Evidence payload
    immutable

completed Activity topology
    immutable

_system
    engine-only

governance
    protected control-plane
```

---

# 58. `ENSURE PROPOSITION`

Native Proposition creation is structural:

```prolog
ENSURE PROPOSITION ?p (
  :alice_id,
  "timezone",
  "+08:00"
)
```

---

# 59. ENSURE Semantics

The engine:

```text
resolves predicate alias → exact predicate_ref
canonicalizes merged endpoint references
canonicalizes typed Literal
validates Predicate schema
looks up canonical Proposition tuple
creates it if absent
returns the canonical Proposition ID
```

---

# 60. Proposition Is Truth-Neutral

`ENSURE PROPOSITION` does not create an Assertion.

After:

```prolog
ENSURE PROPOSITION ?p (
  :alice_id,
  "timezone",
  "+08:00"
)
```

the Brain has only:

> A referable semantic statement exists.

It does not yet mean the Brain or Alice believes it.

---

# 61. Proposition Tuple Is Immutable

There is no:

```prolog
UPDATE PROPOSITION
SET object = "+01:00"
```

in native KML.

A changed tuple becomes:

```text
another canonical Proposition.
```

---

# 62. Proposition Has No Native Epistemic Metadata

Native Proposition KML MUST NOT accept:

```text
confidence
source
author
asserted_by
observed_at
valid_from
valid_until
superseded
```

Those belong elsewhere.

---

# 63. Proposition Arbitrary Attributes Are Not Native

Do not encode n-ary relation qualifiers by mutating Proposition attributes.

Use:

```text
relation/event Concept
or
Propositions about a Proposition
or
profile-defined structure
```

as specified by Core/Schema.

---

# 64. Merged Endpoint Resolution

If Concept A has:

```text
merged_into = B
```

a normal new:

```prolog
ENSURE PROPOSITION (... A ...)
```

canonicalizes the endpoint to B.

---

# 65. Historical Raw Endpoint Creation

Creating a new Proposition intentionally against a historical merged identity should be restricted to:

```text
migration
import
audit reconstruction
```

modes with explicit semantics.

Ordinary Agent writes should target canonical identity.

---

# 66. `CREATE EVIDENCE`

Evidence is append-oriented.

Example:

```prolog
CREATE EVIDENCE ?e {
  CLIENT KEY :evidence_key

  SET FIELDS {
    evidence_class: "tool_result",

    payload: {
      mode: "external",
      content_ref: :content_ref
    },

    content_digest: :digest,
    media_type: "application/json",
    observed_at: :observed_at
  }

  SET STRUCTURAL {
    ("source", :monitoring_service)
  }
}
```

---

# 67. Evidence Identity

Evidence is not deduplicated merely because:

```text
content_digest matches
payload bytes match
source matches
```

Two observations of the same artifact may be distinct Evidence events.

---

# 68. Evidence Retry

Use:

```text
client_key
or
transaction idempotency_key
```

to deduplicate a retry of the same logical Evidence creation.

---

# 69. Evidence Payload Is Immutable

After creation, ordinary KML MUST NOT modify:

```text
payload
content_digest
media_type where semantic identity depends on it
original observed_at
original source observation identity
```

according to Core schema.

---

# 70. Wrong Evidence Is Corrected, Not Rewritten

If Evidence E1 was wrong:

```text
keep E1
create E2
CORRECT EVIDENCE E1 BY E2
```

---

# 71. Evidence Source Is Claimed Provenance

An author-written:

```text
source
source_refs
```

does not become trusted engine origin.

Engine origin remains in protected:

```text
_system.origin
```

---

# 72. Engine-Observed Evidence

If Evidence came directly from an integrated trusted runtime/tool, the engine/runtime may attach stronger origin/attestation state.

Ordinary KML content cannot self-label itself:

```text
engine_observed
```

with authoritative effect.

---

# 73. Large Evidence

KML SHOULD permit:

```text
content-addressed external payload
```

rather than forcing large bytes inline.

Creating an external reference does not automatically fetch that content.

---

# 74. `CREATE ASSERTION`

Assertion records an epistemic event.

Example:

```prolog
CREATE ASSERTION ?a {
  CLIENT KEY :assertion_key

  SET FIELDS {
    proposition: ?p,
    asserted_by: :alice_id,
    stance: "support",
    mode: "stated",
    confidence: 0.95,
    asserted_at: :time,

    valid_time: {
      from: :valid_from,
      until: null
    }
  }

  SET STRUCTURAL {
    ("evidence", ?e) {role: "support"}
  }
}
```

---

# 75. Assertion Creation Is Append-Oriented

A materially new epistemic commitment creates a new Assertion.

Do not mutate an old Assertion into the new belief.

---

# 76. Assertion Immutable Payload

After creation, ordinary KML MUST NOT change:

```text
proposition
asserted_by
stance
mode
confidence
asserted_at
valid_time
initial evidence citations
```

unless a future explicit correction profile defines a safe exceptional migration path.

---

# 77. Confidence Is Historical

If:

```text
January confidence = 0.6
March confidence = 0.9 because new evidence arrived
```

create:

```text
A1 confidence = 0.6
A2 confidence = 0.9
A2 supersedes A1
```

Do not:

```text
UPDATE A1 confidence 0.6 → 0.9
```

---

# 78. New Evidence Does Not Attach Retroactively by Default

If Evidence E2 arrives later, ordinary KML SHOULD create:

```text
new Assertion revision
or
derived Assertion
```

rather than adding E2 to the immutable historical citation set of A1.

---

# 79. Assertion Mode

Core modes include:

```text
observed
stated
inferred
predicted
hypothetical
imported
```

KML validates mode semantics.

---

# 80. `mode = observed`

Should normally have:

```text
observation/tool/measurement Evidence
```

with sufficient provenance.

A caller cannot gain stronger trust merely by selecting the string `"observed"`.

---

# 81. `mode = inferred`

A derived Assertion SHOULD have:

```text
derivation Activity
input Assertions/Evidence
method/parameters identity where available
```

The `derive` Governance permission may be required.

---

# 82. `mode = imported`

Ordinary Capsule import usually uses the Capsule Import pipeline rather than hand-authored KML.

A manual imported-mode write must not erase source provenance.

---

# 83. `asserted_by` Is Semantic Content

`asserted_by` says:

> Which semantic actor is claimed to hold/produce the Assertion?

It is not:

```text
the authenticated Principal who wrote it.
```

---

# 84. KML Cannot Self-Grant Representation Authority

Writing:

```prolog
asserted_by: "CEO"
```

does not prove the caller represents the CEO.

Governance determines:

```text
assert
record_attributed_assertion
assert_as_actor
```

authority using trusted ActorBinding/provenance.

---

# 85. Attributed Assertion

If the Agent records:

> Alice said P.

the operation should have Evidence such as:

```text
message
transcript
signed statement
```

and Governance may authorize it as:

```text
record_attributed_assertion
```

This is not impersonation.

---

# 86. Represented Assertion

If the authenticated caller intends to exercise authority as Alice, the engine must verify:

```text
ActorBinding
scope
authentication
```

under `assert_as_actor`.

No KML field can bypass that requirement.

---

# 87. Assertion Evidence Roles

Structural roles:

```text
support
challenge
context
```

are preserved.

---

# 88. Counter-Evidence Does Not Rewrite Assertion

New challenge Evidence can produce:

```text
new Assertion
new derived Assertion
new Activity
```

according to context.

The original assertion remains historical.

---

# 89. `CREATE ACTIVITY`

Activity records provenance transformation.

Example:

```prolog
CREATE ACTIVITY ?act {
  CLIENT KEY :activity_key

  SET FIELDS {
    activity_class: "inference",
    started_at: :started_at,
    ended_at: :ended_at,
    parameters_digest: :params_digest,
    status: "completed"
  }

  SET STRUCTURAL {
    ("inputs", ?e1)
    ("inputs", ?a1)
    ("outputs", ?a2)
    ("associated_actors", :brain_actor)
  }
}
```

---

# 90. Activity Is Not Transaction

A Transaction says:

> This state change committed.

An Activity says:

> This cognitive/world/process transformation occurred or was reported.

They are different records.

---

# 91. Activity Record Mode Is Protected Provenance Semantics

Possible provenance assurance:

```text
engine_observed
actor_reported
imported
```

Ordinary author content cannot upgrade:

```text
actor_reported
→ engine_observed.
```

The runtime assigns the strongest attestation it can actually support.

---

# 92. Pending Activity

Long-running cognitive/runtime processes may create:

```text
pending
running
```

Activity state before completion.

---

# 93. Terminal Activity

Terminal states:

```text
completed
failed
cancelled
```

After terminal transition, provenance topology SHOULD become immutable:

```text
inputs
outputs
associated actors
parameters digest
start/end time
```

---

# 94. Activity Correction

Do not rewrite a completed provenance history.

Create:

```text
new correction Activity
or
audit correction record
```

---

# 95. `SET STRUCTURAL`

Core/Profile topology uses explicit Structural References.

Recommended block:

```prolog
SET STRUCTURAL {
  ("field_name", ?target)
  ("field_name", ?target) {role: "support"}
  ("has_step", ?step) {index: 0}
}
```

---

# 96. Structural Field Resolution

`"field_name"` resolves through the transaction's Schema Environment to an exact structural field definition.

An exact ref may be used directly.

---

# 97. Structural Reference Is Not a Proposition

`SET STRUCTURAL` does not create:

```text
truth-neutral Proposition
Assertion
Evidence
```

It modifies record topology defined by Core/Profile schema.

---

# 98. Structural Cardinality

Schema validates:

```text
required
single
optional
set
ordered-list
role-bearing refs
```

---

# 99. Ordered Structural Field

Example:

```prolog
SET STRUCTURAL {
  ("has_step", ?step0) {index: 0}
  ("has_step", ?step1) {index: 1}
}
```

The Profile defines whether index is required/unique/contiguous.

---

# 100. Structural Cycles

Structural cycles MAY exist where Core/Profile explicitly permits them.

The mutation planner must detect illegal cycles, not reject every cycle mechanically.

---

# 101. Forward Structural Reference

Allowed:

```prolog
CREATE EVIDENCE ?e {
  SET STRUCTURAL {
    ("generated_by", ?act)
  }
}

CREATE ACTIVITY ?act {
  SET STRUCTURAL {
    ("outputs", ?e)
  }
}
```

inside the same `MUTATE`.

---

# 102. Generic `UPDATE`

Pattern-matched mutation remains a core KML primitive.

Recommended syntax:

```prolog
UPDATE ?target

SET FIELDS {
  ...
}

SET ATTRIBUTES {
  ...
}

SET FACET "FacetName" {
  ...
}

UNSET ATTRIBUTES {
  "old_field"
}

UNSET FACET "FacetName" {
  "old_field"
}

WHERE {
  ...
}

LIMIT :limit
```

Only legal mutable fields are applied.

---

# 103. UPDATE Never Creates

If `WHERE` finds no target:

```text
updated = 0
```

unless the operation requires exactly-one semantics.

---

# 104. UPDATE Uses KQL Raw Matching

`WHERE` follows raw KQL visible-state semantics.

It does not automatically mutate only accepted beliefs.

---

# 105. UPDATE Cannot Mutate Projection Results

A virtual:

```text
BELIEF
BELIEF SLOT
Structural descriptor
```

is not a durable update target.

---

# 106. UPDATE Target Kinds

Typical legal uses:

```text
Concept mutable fields
Concept attributes
Profile Facets
non-terminal Activity mutable state where allowed
maintenance markers
mnemonic state
utility counters
```

---

# 107. UPDATE Forbidden Targets

Generic UPDATE MUST NOT mutate:

```text
Proposition tuple
Assertion epistemic payload
Evidence payload
completed Activity provenance topology
_system
Governance fields
protected canonical identity binding
Schema Package state
Trust Policy
```

---

# 108. Lifecycle Fields Prefer Lifecycle Commands

Although Assertion/Evidence lifecycle is mutable, native KML SHOULD require:

```text
RETRACT
SUPERSEDE
CORRECT
ARCHIVE
TOMBSTONE
```

rather than arbitrary:

```text
UPDATE lifecycle.status = ...
```

This lets the engine validate transition semantics and preserve history.

---

# 109. `SET FIELDS` on Concept

Example:

```prolog
UPDATE ?person
SET FIELDS {
  name: "Alice Chen"
}
WHERE {
  ?person {id: :alice_id}
}
```

This changes grounding label, not historical name facts.

---

# 110. Historical Name Fact

If it matters that Alice used another name from 2019–2022, create:

```text
Proposition
Assertion
valid_time
Evidence
```

Do not rely solely on current `name`/`aliases`.

---

# 111. `SET ATTRIBUTES`

Use for Schema-defined non-epistemic/profile content.

Example:

```prolog
UPDATE ?project
SET ATTRIBUTES {
  ui_icon: "folder"
}
WHERE {
  ?project {id: :project_id}
}
```

---

# 112. Epistemic Attribute Anti-Pattern

Bad:

```prolog
UPDATE ?person
SET ATTRIBUTES {
  timezone: "+01:00"
}
...
```

when timezone needs:

```text
source
validity
contradiction
history
```

Prefer Proposition + Assertion.

---

# 113. Schema Should Help Prevent Attribute Abuse

Schema Packages SHOULD identify which fields are:

```text
attributes
structural
facets
semantic predicates
```

KML rejects fields that do not belong in the requested plane.

---

# 114. `SET FACET`

Example:

```prolog
UPDATE ?exp
SET FACET "MnemonicState" {
  memory_strength: 0.75,
  salience: 0.9
}
WHERE {
  ?exp {id: :experience_id}
}
```

---

# 115. Facet Mutability Is Profile-Defined

A Profile may declare:

```text
mutable
append-only
derived-only
maintenance-only
terminal
```

for particular Facet fields.

KML enforces the profile contract.

---

# 116. Generic Metadata Is Removed

Native KML 2.0 SHOULD NOT have:

```prolog
WITH METADATA {...}
SET METADATA {...}
DELETE METADATA {...}
```

as a universal author-writable bag.

---

# 117. Why

KIP 1.x metadata mixed:

```text
epistemic confidence
source
validity
storage lifecycle
governance-like access
operational markers
engine bookkeeping
```

KIP 2.0 has explicit homes:

```text
Assertion
Evidence
Activity/provenance
retention
Facets
Governance
_system
```

---

# 118. Metadata Migration Rule

A legacy metadata field must be classified before translation.

Do not mechanically create:

```text
facets.legacy_metadata
```

for fields whose semantics are security/epistemic-critical.

---

# 119. `_system` Is Never Author-Writable

KML MUST reject attempts to write:

```text
version
created_at
updated_at
created_tx
updated_tx
origin
space_seq
tombstone state directly
```

inside `_system`.

Engine operations assign them.

---

# 120. Governance Fields Are Never Ordinary KML State

KML MUST reject ordinary writes to:

```text
classification
policy_ref
authority ceiling
quarantine state
Grant
Delegation
Trust Resolver
ActorBinding
```

even if the syntax tries to place them in attributes/facets.

---

# 121. Cognitive Claim of Authority Remains Cognitive

An Agent may store a Proposition:

```text
(Alice, is_admin, true)
```

if schema permits.

It does not modify actual Governance authority.

---

# 122. More Restrictive Requests

A deployment MAY expose a separate protected operation allowing a cognitive writer to request:

```text
more restrictive classification
```

but that is Governance semantics, not generic `UPDATE`.

---

# 123. Update Expressions

KIP 1.x numeric update expressions remain useful for mutable/profile state:

```text
ADD(a,b)
MUL(a,b)
CLAMP(x,lo,hi)
COALESCE(x,default)
```

---

# 124. Per-Target Determinism

An update expression may use:

```text
literal
parameter
nested update expression
field path on ?target
```

but SHOULD NOT depend on arbitrary other query rows.

This keeps bulk UPDATE order-independent.

---

# 125. Null Expression

If a numeric operand is null/non-numeric and not handled with `COALESCE`, the affected field update may be skipped or fail according to final formal rule.

The implementation must behave deterministically.

---

# 126. Mnemonic Metabolism Example

Correct v2 sleep-cycle pattern:

```prolog
UPDATE ?memory

SET FACET "MnemonicState" {
  memory_strength: CLAMP(
    MUL(
      COALESCE(
        ?memory.facets["MnemonicState"].memory_strength,
        1.0
      ),
      :decay_factor
    ),
    0.0,
    1.0
  ),

  last_metabolized_at: :cycle_time
}

WHERE {
  ?memory {type: "Experience"}

  FILTER(
    IS_NULL(
      ?memory.facets["MnemonicState"].last_metabolized_at
    )
    ||
    ?memory.facets["MnemonicState"].last_metabolized_at
      < :cycle_start
  )
}

LIMIT 500
```

---

# 127. KIP 2.0 Removes Generic Confidence Decay

This is a major correction from KIP 1.x-style metabolism.

Do NOT periodically mutate:

```text
Assertion.confidence
```

merely because time passed.

---

# 128. Why

A historically strong observation does not become historically less credible because it is old.

Instead:

```text
confidence
    epistemic property of the historical Assertion

temporal relevance
    current Projection concern

memory_strength
    recall accessibility concern
```

---

# 129. Stale Current Status

An old Assertion may remain:

```text
confidence = 0.99
```

while a current Epistemic Projection says:

```text
insufficient for "status now"
```

because fresh Evidence is missing.

No confidence mutation is necessary.

---

# 130. Reconfirmation Does Not Mutate Old Confidence

If a user reconfirms something:

```text
create new Evidence
create/revise Assertion as appropriate
```

or update explicitly derived aggregate/profile counters backed by preserved evidence.

Do not silently strengthen the original historical Assertion.

---

# 131. Memory Reinforcement

Repeated successful recall/use may update:

```text
memory_strength
utility
validated use counters
```

only when the Profile/learning policy defines those signals.

A read alone does not automatically reinforce.

---

# 132. `LIMIT` on UPDATE

`LIMIT` is a blast-radius cap, not a semantic ordering mechanism.

Without `ORDER BY` mutation semantics, which matching rows are chosen under a cap may be implementation-defined.

---

# 133. Large Maintenance Sweep

Use:

```text
structural shard
+
cycle marker
+
repeat until updated < limit
```

rather than scanning the entire graph blindly.

---

# 134. Maintenance Marker Location

In v2, cycle markers belong to an operational/profile Facet or explicit maintenance field.

They should not be hidden in generic epistemic metadata.

---

# 135. UPDATE Atomicity

One standalone UPDATE is one implicit transaction.

All selected mutations commit or none do.

---

# 136. No-Effect UPDATE

If the final durable value equals current state:

```text
version unchanged
updated_at unchanged
no cognitive Change Envelope
```

for that element.

---

# 137. `RETRACT ASSERTION`

Recommended syntax:

```prolog
RETRACT ASSERTION ?a
WHERE {
  ?a ASSERTION {id: :assertion_id}
}
EXPECT STATE "active"
```

---

# 138. Retraction Meaning

Retraction means:

> The assertor or an authorized representative explicitly withdrew the Assertion.

It is not generic moderation.

---

# 139. Retraction Does Not Delete

After retraction:

```text
Assertion remains addressable
historical projection can recover it
current projection excludes/handles it by lifecycle
```

---

# 140. Retraction Authorization

Governance requires appropriate:

```text
retract_own
or stronger explicit authority
```

based on semantic representation.

---

# 141. Administrator Must Not Forge Retraction

If an administrator wants an Assertion excluded but the original actor did not retract it:

```text
quarantine
moderate
restrict
tombstone
```

under Governance.

Do not falsely write:

```text
retracted
```

as though the actor withdrew the claim.

---

# 142. Retraction Provenance

A meaningful retraction SHOULD be accompanied by:

```text
Evidence of withdrawal
or
Activity/audit provenance
```

in the same Transaction when available.

---

# 143. Retraction Example

```prolog
MUTATE {
  CREATE EVIDENCE ?withdrawal {
    CLIENT KEY :withdrawal_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: {
        mode: "inline",
        inline: {
          text: "I withdraw my earlier claim."
        }
      },
      observed_at: :time
    }
  }

  RETRACT ASSERTION :old_assertion
  EXPECT STATE "active"

  CREATE ACTIVITY ?act {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "assertion_retraction",
      started_at: :time,
      ended_at: :time,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :old_assertion)
      ("inputs", ?withdrawal)
      ("outputs", :old_assertion)
    }
  }
}
```

The lifecycle transition and its Evidence commit together.

---

# 144. `SUPERSEDE ASSERTION`

Recommended:

```prolog
SUPERSEDE ASSERTION :old_id BY :new_id
```

or inside one `MUTATE`:

```prolog
SUPERSEDE ASSERTION :old_id BY ?new
```

---

# 145. Supersession Meaning

Supersession means:

> A newer Assertion replaces an older Assertion for a defined actor/context/temporal interpretation.

---

# 146. Supersession Is Not Contradiction

Two different actors may disagree:

```text
Alice supports P
Bob rejects P
```

without either Assertion superseding the other.

---

# 147. Supersession Validation

The engine/Profile/Epistemic schema SHOULD validate compatibility such as:

```text
same represented actor or authorized cognitive process
compatible semantic slot/conflict set
reasonable temporal/context lineage
new Assertion exists and is active
old Assertion eligible for supersession
```

Exact policy may vary.

---

# 148. Supersession Atomic State

A successful command atomically records:

```text
old.lifecycle.status = superseded
old.superseded_by includes new

new.lifecycle.supersedes includes old
```

or equivalent Core representation.

---

# 149. Supersession Does Not Rewrite Old Payload

The old:

```text
stance
confidence
valid_time
evidence
```

remain unchanged.

---

# 150. Belief Correction Pattern

```prolog
MUTATE {
  CREATE EVIDENCE ?e2 {...}

  ENSURE PROPOSITION ?p2 (
    :alice,
    "timezone",
    "+01:00"
  )

  CREATE ASSERTION ?a2 {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p2,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?e2) {role: "support"}
    }
  }

  SUPERSEDE ASSERTION :a1 BY ?a2

  CREATE ACTIVITY ?revision {
    ...
  }
}
```

---

# 151. Temporal Change May Not Be Contradiction

Suppose:

```text
timezone +08 valid until September 1
timezone +01 valid from September 1
```

Both can remain accepted for their respective world times.

Supersession/lifecycle should reflect actor/history semantics rather than blindly declaring logical contradiction.

---

# 152. `CORRECT EVIDENCE`

Recommended syntax:

```prolog
CORRECT EVIDENCE :old_evidence BY ?new_evidence
```

---

# 153. Evidence Correction Semantics

Atomic result:

```text
old Evidence remains immutable
old lifecycle records corrected_by
new Evidence records corrects
```

where Core/Profile defines the fields.

---

# 154. Correction Is Not Deletion

A wrong measurement is still a historical artifact that existed and influenced cognition.

Preserve it unless privacy/legal purge requires removal.

---

# 155. Evidence Correction May Trigger Assertion Revision

If corrected Evidence materially changes belief:

```text
new Evidence
+
new Assertion
+
supersession if appropriate
+
correction Activity
```

should be one coherent Transaction.

---

# 156. `TRANSITION ACTIVITY`

Recommended:

```prolog
TRANSITION ACTIVITY :activity_id
TO "completed"
EXPECT STATE "running"
```

with allowed terminal fields.

---

# 157. Completing an Activity

Before terminal commit, the operation may atomically finalize:

```text
outputs
ended_at
status
```

if those fields were not known earlier.

---

# 158. Terminal Immutability

Once terminal:

```text
inputs/outputs/actors/parameters/time
```

become immutable according to Core.

A later correction creates a new provenance record.

---

# 159. Engine Runtime Activities

For tool/runtime execution, the engine may create/transition Activity through a privileged runtime integration rather than model-generated KML.

This can support genuine:

```text
engine_observed
```

attestation.

---

# 160. `SET RETENTION`

Retention is not ordinary cognitive content.

Recommended protected operation:

```prolog
SET RETENTION ?target {
  retention_class: "episodic-short",
  expires_at: :expires_at
}
WHERE {
  ?target {id: :id}
}
```

---

# 161. Retention Permission

Requires appropriate:

```text
manage_retention
maintain
```

scope.

Ordinary `update` permission alone does not imply it.

---

# 162. Retention Is Not Assertion Validity

Do not confuse:

```text
retention.expires_at
```

with:

```text
Assertion.valid_time.until
```

One concerns storage/memory lifecycle.

The other concerns world applicability.

---

# 163. `ARCHIVE`

Recommended:

```prolog
ARCHIVE ?target
WHERE {
  ?target {id: :id}
}
```

---

# 164. Archive Meaning

Archive means:

```text
exclude/deprioritize from ordinary Recall
retain for audit/history
```

It is not physical deletion.

---

# 165. Archive Does Not Mean False

Archiving an Assertion/Evidence/Experience does not change its historical epistemic content.

---

# 166. `TOMBSTONE`

Recommended:

```prolog
TOMBSTONE ?target
WHERE {
  ?target {id: :id}
}
```

with explicit lifecycle permission.

---

# 167. Tombstone Meaning

The engine transitions:

```text
_system.state → tombstoned
```

or equivalent protected state.

The caller never writes `_system` directly.

---

# 168. Tombstone Preserves Identity

A tombstone SHOULD retain enough information to prevent:

```text
ID reuse
dangling required refs
silent provenance collapse
```

---

# 169. Tombstone Does Not Mean Retraction

For an Assertion:

```text
retracted
```

means actor withdrawal.

```text
tombstoned
```

means storage/logical deletion state.

They are different.

---

# 170. `PURGE`

Physical purge is an explicit high-impact operation.

Recommended form:

```prolog
PURGE ?target

WHERE {
  ?target EVIDENCE {id: :evidence_id}
}

REFERENCE POLICY "deny_if_referenced"

CONFIRM "PURGE"
```

Exact confirmation grammar may change.

The explicitness should remain.

---

# 171. Purge Permission

Requires:

```text
purge
```

or equivalent stronger Governance authority.

---

# 172. Evidence Purge Is Especially Sensitive

Counter-Evidence deletion can artificially strengthen later belief.

High-impact Evidence purge SHOULD be:

```text
authorized
audited
change-stream visible
reference-aware
conservative
```

---

# 173. Reference Policy

Recommended values:

```text
deny_if_referenced
tombstone_reference
authorized_cascade
```

Default:

```text
deny_if_referenced
```

---

# 174. No Implicit Destructive Cascade

KIP 1.x `DELETE CONCEPT DETACH` can transitively delete connected/higher-order links.

KIP 2.0 SHOULD NOT make destructive cascade the ordinary default.

---

# 175. Why

In a cognitive history:

```text
Assertion
Evidence
Activity
Experience
```

may refer to the target.

Deleting the whole dependency chain can falsify history.

---

# 176. Authorized Cascade

A specialized purge policy may cascade where:

```text
legal/privacy requirement
temporary generated data
known disposable subgraph
```

makes that appropriate.

The impact must be previewable/auditable.

---

# 177. Legal Purge

If law/policy requires physical erasure:

```text
privacy obligation wins
```

over historical preservation.

KIP may retain only allowed minimal tombstone/audit information.

---

# 178. Generic `DELETE` Is Demoted in Native v2

Native KML SHOULD NOT encourage:

```text
DELETE PROPOSITION
DELETE CONCEPT DETACH
DELETE METADATA
```

as routine memory evolution.

Prefer explicit lifecycle semantics.

---

# 179. Attribute Removal

Mutable field removal uses:

```text
UNSET ATTRIBUTES
UNSET FACET
```

not destructive element deletion.

---

# 180. Proposition Garbage Collection

An unasserted, unreferenced canonical Proposition may be physically garbage-collected by system maintenance under safe Core rules.

Ordinary Agent KML need not manually delete it.

---

# 181. `MERGE CONCEPT`

KIP 2.0 keeps entity consolidation but changes its semantics.

Recommended:

```prolog
MERGE CONCEPT ?source INTO ?target
WHERE {
  ?source {id: :source_id}
  ?target {id: :target_id}
}
```

---

# 182. Merge Is Non-Destructive

After commit:

```text
source remains addressable
source state = merged
source merged_into = target
canonical resolution source → target
```

---

# 183. Old Propositions Are Not Rewritten

If an old Proposition referenced source:

```text
P_old.subject = source
```

raw historical query continues to recover that fact.

---

# 184. New Writes Resolve Canonically

After merge:

```text
ordinary new references to source
→ target
```

through canonical resolution.

---

# 185. Merge Is an Identity Operation

Because it changes interpretation across the graph, it requires stronger:

```text
merge_identity
```

authority than generic `update`.

---

# 186. Merge Compatibility

The source/target must satisfy schema identity compatibility.

Unlike v1, "same display type string" alone may not be sufficient.

Schema Package identity/version compatibility rules apply.

---

# 187. Canonical Proposition Collision

Suppose:

```text
P1 = (source, knows, Bob)
P2 = (target, knows, Bob)
```

After merge they canonicalize to one semantic tuple.

The engine may mark one Proposition as canonically merged/redirected.

It MUST preserve:

```text
raw Proposition IDs
Assertion references
source provenance
historical queryability
```

---

# 188. Merge Does Not Merge Actors' Assertions

Identity consolidation can change semantic endpoint resolution.

It must not collapse independent Assertions merely because their Propositions now canonicalize together.

---

# 189. Merge Receipt

Recommended result:

```json
{
  "source_id": "...",
  "target_id": "...",
  "source_state": "merged",
  "canonical_redirects": 12,
  "proposition_collisions": 3,
  "history_rewritten": false
}
```

plus Transaction Receipt.

---

# 190. Merge Retry

A repeated merge of an already-merged source into the same target SHOULD be:

```text
no_effect
or
self-diagnosing already_merged
```

rather than destructive error where practical.

---

# 191. Merge Conflict

If source already merged to another incompatible target:

```text
IdentityMergeConflict
```

requires explicit identity review.

Do not chain arbitrary conflicting redirects silently.

---

# 192. Derived Cognitive Output

Creating a derived:

```text
Insight
Assertion
Skill
summary
```

SHOULD preserve provenance through Activity.

---

# 193. `derive` Governance Permission

A Principal may have:

```text
read inputs
derive outputs
```

without having:

```text
assert_as_actor
manage_trust
elevate_authority
```

---

# 194. Classification Propagation

Derived content must obey Governance classification propagation.

KML content cannot declassify itself by summarizing secret inputs.

---

# 195. Authority Non-Amplification

Derived Skill/Insight/Assertion cannot become more authoritative merely because:

```text
trusted Agent generated it
Activity says "validated"
summary is confident
```

Authority elevation remains a separate Governance operation.

---

# 196. Origin Non-Malleability

A derived output retains source provenance roots.

Transformation does not erase:

```text
import origin
untrusted source
shared Evidence root
```

---

# 197. No Hidden Chain-of-Thought

An inference Activity may store:

```text
method
input refs
parameters_digest
decision_summary
result summary
```

It SHOULD NOT require private token-level reasoning.

---

# 198. Observation Recipe

A typical observation should atomically form:

```text
Evidence
Proposition
Assertion(mode=observed)
Activity
```

when the observation expresses one semantic claim.

---

# 199. Observation Example

```prolog
MUTATE {
  CREATE ACTIVITY ?observe {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "tool_observation",
      started_at: :time,
      ended_at: :time,
      parameters_digest: :params_digest,
      status: "completed"
    }

    SET STRUCTURAL {
      ("associated_actors", :agent_id)
      ("outputs", ?e)
      ("outputs", ?a)
    }
  }

  CREATE EVIDENCE ?e {
    CLIENT KEY :evidence_key

    SET FIELDS {
      evidence_class: "tool_result",
      payload: {
        mode: "external",
        content_ref: :result_ref
      },
      content_digest: :result_digest,
      media_type: "application/json",
      observed_at: :time
    }

    SET STRUCTURAL {
      ("generated_by", ?observe)
      ("source", :tool_id)
    }
  }

  ENSURE PROPOSITION ?p (
    :service_id,
    "healthy",
    true
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :observation_actor,
      stance: "support",
      mode: "observed",
      confidence: :observation_confidence,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?e) {role: "support"}
    }
  }
}
```

The runtime, not the text, decides whether the Activity/Evidence can receive engine-observed attestation.

---

# 200. User Statement Recipe

User says:

> "I prefer dark mode."

Recommended cognitive formation:

```text
message Evidence
Proposition(Alice, prefers, DarkMode)
Assertion by Alice, mode=stated
conversation/ingest Activity
```

---

# 201. User Statement Example

```prolog
MUTATE {
  CREATE EVIDENCE ?message {
    CLIENT KEY :message_evidence_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: {
        mode: "inline",
        inline: {
          text: "I prefer dark mode."
        }
      },
      observed_at: :time
    }

    SET STRUCTURAL {
      ("source", :alice_id)
    }
  }

  ENSURE PROPOSITION ?p (
    :alice_id,
    "prefers",
    :dark_mode_id
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice_id,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?message) {role: "support"}
    }
  }
}
```

The Agent is recording Alice's statement.

It is not claiming to be Alice.

---

# 202. Repeated User Statement

If Alice says the same thing next month:

```text
new message Evidence
new source event identity
possibly new Assertion or new consolidation input
```

depending on Profile policy.

Do not silently overwrite the old statement.

---

# 203. Inference Recipe

Derived belief:

```text
input Evidence/Assertions
→ inference Activity
→ inferred Assertion
```

---

# 204. Inference Example

```prolog
MUTATE {
  ENSURE PROPOSITION ?p (
    :project_id,
    "at_risk",
    true
  )

  CREATE ASSERTION ?derived {
    CLIENT KEY :derived_assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :brain_actor,
      stance: "support",
      mode: "inferred",
      confidence: :confidence,
      asserted_at: :time
    }
  }

  CREATE ACTIVITY ?inference {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "inference",
      started_at: :time,
      ended_at: :time,
      parameters_digest: :method_digest,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :evidence_1)
      ("inputs", :evidence_2)
      ("inputs", :assertion_3)
      ("outputs", ?derived)
      ("associated_actors", :brain_actor)
    }
  }
}
```

The Activity preserves derivation without storing hidden chain-of-thought.

---

# 205. Contradiction Recipe

If Bob says the opposite of Alice:

```text
create Bob's Evidence
create Bob's Assertion
```

Do NOT:

```text
supersede Alice
delete Alice
overwrite Proposition confidence
```

unless Bob is actually an authorized revision of the same actor/process.

---

# 206. Conflict Is First-Class

The Epistemic Projection later decides:

```text
accepted
rejected
contested
uncertain
insufficient
```

KML preserves the inputs.

---

# 207. Correction Recipe

A source corrects itself:

```text
new Evidence
new Assertion
supersede own prior Assertion
correction Activity
```

This is the canonical belief-revision pattern.

---

# 208. Experience Formation

The Cognitive Memory Profile represents:

```text
Experience
ExperienceStep
```

as typed Concepts plus Structural References/Facets.

KML Core does not need special element kinds.

---

# 209. Experience Formation Example

```prolog
MUTATE {
  CREATE CONCEPT ?exp {
    TYPE "Experience"
    CLIENT KEY :experience_key

    NAME :experience_name

    SET ATTRIBUTES {
      goal: :goal,
      initial_state_summary: :initial_state,
      outcome_summary: :outcome,
      outcome_status: :outcome_status,
      surprise_score: :surprise,
      learning_value: :learning_value
    }

    SET FACET "MnemonicState" {
      memory_strength: :memory_strength,
      salience: :salience
    }

    SET STRUCTURAL {
      ("experienced_by", :self_id)
      ("has_step", ?step0) {index: 0}
      ("has_step", ?step1) {index: 1}
      ("has_step", ?step2) {index: 2}
      ("formed_by", ?formation)
    }
  }

  CREATE CONCEPT ?step0 {
    TYPE "ExperienceStep"
    CLIENT KEY :step0_key

    SET ATTRIBUTES {
      kind: "observation",
      summary: :step0_summary
    }
  }

  CREATE CONCEPT ?step1 {
    TYPE "ExperienceStep"
    CLIENT KEY :step1_key

    SET ATTRIBUTES {
      kind: "action",
      summary: :step1_summary,
      decision_summary: :decision_summary
    }
  }

  CREATE CONCEPT ?step2 {
    TYPE "ExperienceStep"
    CLIENT KEY :step2_key

    SET ATTRIBUTES {
      kind: "feedback",
      summary: :step2_summary
    }
  }

  CREATE ACTIVITY ?formation {
    CLIENT KEY :formation_key

    SET FIELDS {
      activity_class: "experience_formation",
      started_at: :time,
      ended_at: :time,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :event_or_evidence)
      ("outputs", ?exp)
      ("outputs", ?step0)
      ("outputs", ?step1)
      ("outputs", ?step2)
    }
  }
}
```

Forward local references make the full trajectory atomic.

---

# 210. Experience Is Not Automatically a Skill

Recording an Experience does not directly mutate a Skill.

Procedural consolidation may happen later.

---

# 211. Failed Experience Is First-Class

KML must allow:

```text
outcome_status = failure
```

without deleting or lowering memory merely because the attempt failed.

Failures may have high learning value.

---

# 212. Experience Decision Summary

A Profile may store concise:

```text
decision_summary
expected outcome
actual outcome
prediction error
```

for reusable learning.

It must not require hidden chain-of-thought.

---

# 213. Skill Compilation

Skill formation is a derived cognitive process:

```text
Experiences
success/failure contrast
→ procedural consolidation Activity
→ candidate Skill
```

---

# 214. Skill Compilation Example

```prolog
MUTATE {
  CREATE CONCEPT ?skill {
    TYPE "Skill"
    CLIENT KEY :skill_version_key

    NAME :skill_name

    SET ATTRIBUTES {
      skill_class: :skill_class,
      summary: :summary,
      applicability: :applicability,
      procedure: :procedure,
      success_criteria: :success_criteria,
      failure_modes: :failure_modes,
      recovery: :recovery,
      status: "candidate"
    }

    SET FACET "SkillUtility" {
      utility: :initial_utility,
      success_count: 0,
      failure_count: 0
    }

    SET STRUCTURAL {
      ("compiled_from", :experience_success)
      ("compiled_from", :experience_failure)
      ("compiled_by", ?compile_activity)
    }
  }

  CREATE ACTIVITY ?compile_activity {
    CLIENT KEY :activity_key

    SET FIELDS {
      activity_class: "procedural_consolidation",
      started_at: :time,
      ended_at: :time,
      parameters_digest: :method_digest,
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :experience_success)
      ("inputs", :experience_failure)
      ("outputs", ?skill)
      ("associated_actors", :brain_actor)
    }
  }
}
```

---

# 215. Skill Creation Does Not Elevate Authority

Even if:

```text
status = candidate
utility = high
```

KML cannot set protected:

```text
behavioral/executable authority
```

to a higher level without Governance approval.

---

# 216. Skill Revision

If a Skill's procedure changes materially, the Profile SHOULD decide whether to:

```text
create a new Skill version
supersede old Skill
or update explicitly mutable operational fields
```

KML follows the Profile's mutability contract.

---

# 217. Skill Utility Update

Outcome learning may legitimately update:

```text
success_count
failure_count
utility
last_validated_at
```

if Profile defines them as mutable.

Underlying Experiences remain.

---

# 218. Skill Validation Example

```prolog
UPDATE ?skill

SET FACET "SkillUtility" {
  success_count: ADD(
    COALESCE(
      ?skill.facets["SkillUtility"].success_count,
      0
    ),
    1
  ),

  last_validated_at: :time
}

WHERE {
  ?skill {id: :skill_id}
}

LIMIT 1
```

The success Experience/Activity that justifies this update SHOULD also be preserved in the same logical learning workflow.

---

# 219. Semantic Consolidation

Maintenance may derive stable semantic knowledge from multiple Experiences.

Recommended:

```text
raw Experiences remain
Activity records consolidation
new derived Assertion expresses reusable regularity
```

---

# 220. Consolidation Does Not Manufacture Corroboration

If several Experiences ultimately derive from one Evidence root, the derived Assertion provenance must preserve that dependency.

KML copy/rewrite does not create independent Evidence.

---

# 221. Contrastive Consolidation

A useful Skill/Insight may come from:

```text
successful Experience
+
failed Experience
```

to identify the discriminating condition/action.

KML records both as Activity inputs.

---

# 222. Self-Model Mutation

A Profile may maintain:

```text
SelfModel
identity narrative
values
strengths
weaknesses
```

but durable epistemic claims about self should still use Assertions where history/contradiction matters.

---

# 223. Self Narrative Is Not Governance Identity

Changing:

```text
"I am an administrator"
```

inside SelfModel does not grant actual administrative permissions.

---

# 224. Commitments

A Commitment may be a typed Concept with structural fields.

Creating/fulfilling a Commitment should preserve:

```text
who committed
to whom
what
due time
status transition
Evidence/Activity
```

according to Profile schema.

---

# 225. Commitment Status

A generic Profile may allow controlled status transitions:

```text
open → fulfilled
open → cancelled
open → expired
```

rather than free-form attribute overwrite.

A future Profile KML macro may compile to Core `UPDATE`/Activity semantics.

---

# 226. Profile Mutation Macros

Schema/Profile Packages MAY publish model hints for higher-level macros such as:

```text
FORM EXPERIENCE
COMPILE SKILL
FULFILL COMMITMENT
```

but Core KML does not require these macros.

---

# 227. Macro Safety

A macro is syntactic/planning sugar.

It MUST compile to legal Core KML/Transactions and MUST NOT weaken:

```text
immutability
Governance
origin
provenance
authority
Schema validation
```

---

# 228. `ASSERT` Ergonomic Sugar

KML 2.0 MAY standardize:

```prolog
ASSERT ?a (
  :alice,
  "timezone",
  "+08:00"
) {
  asserted_by: :alice,
  stance: "support",
  mode: "stated",
  confidence: 1.0,
  asserted_at: :time,

  evidence: [
    {ref: ?e, role: "support"}
  ],

  client_key: :assertion_key
}
```

---

# 229. ASSERT Desugaring

Conceptually:

```text
ENSURE PROPOSITION tuple
+
CREATE ASSERTION targeting canonical Proposition
```

The Evidence refs must already exist or be local handles in the same `MUTATE`.

---

# 230. ASSERT Does Not Mean Accepted

The shorthand creates an Assertion record.

It does not persist:

```text
BELIEF status = accepted.
```

Epistemic Projection decides later.

---

# 231. ASSERT Does Not Grant Actor Authority

The `asserted_by` semantics still go through Governance representation checks.

---

# 232. Why Keep Sugar Small

KML should not create dozens of cognitive verbs that duplicate Profile semantics.

The stable Core primitives should remain:

```text
create
ensure
update
transition
merge
lifecycle
```

with schema/profile composition above them.

---

# 233. Schema Resolution

Every KML statement executes under the Transaction's captured Schema Environment.

Local names such as:

```text
"Person"
"timezone"
"MnemonicState"
"has_step"
```

resolve to exact Package Symbol Refs before mutation.

---

# 234. Persist Exact Refs

Durable state stores:

```text
exact schema_ref
exact predicate_ref
exact facet/structural definition identity
```

not floating aliases.

---

# 235. Schema Ambiguity

If:

```text
two active packages expose "Skill"
```

and local resolution is ambiguous:

```text
SchemaSymbolAmbiguous
```

The engine MUST NOT guess.

---

# 236. Exact Ref

High-assurance mutation may use:

```text
kip://profiles/cognitive-memory@2.0.0/Experience
```

directly.

---

# 237. Schema Default Change During Mutation

A transaction resolves schema against one snapshot.

A concurrent default-version change cannot silently reinterpret already-resolved KML.

---

# 238. Schema Block Before Commit

If the exact package becomes security-blocked before commit:

```text
abort
```

according to Transaction rules.

---

# 239. KML Cannot Activate Schema

Ordinary KML statements such as:

```text
CREATE CONCEPT
UPDATE
ASSERT
```

cannot:

```text
install package
set defaults
change Schema Lock
activate embedded Capsule schema
```

Those are `manage_schema` operations.

---

# 240. Constraint Validation

Before commit, engine validates:

```text
required fields
value datatypes
cardinality
subject/object kinds
literal types
structural fields
Facet schema
lifecycle state machine
immutable fields
cross-element schema constraints
```

---

# 241. Validation Sees Tentative State

Inside one `MUTATE`, schema validation sees the complete tentative mutation graph.

This permits:

```text
new Assertion → new Proposition
new Evidence → new Activity
new Experience → new Steps
```

to validate atomically.

---

# 242. Governance Authorization

KML syntax expresses cognitive intent.

Governance determines whether the authenticated Principal may execute it.

---

# 243. Authorization Is Per Mutation Semantics

One `MUTATE` may require:

```text
create Evidence
record attributed Assertion
derive output
supersede own Assertion
```

The entire transaction must satisfy all required authorities.

---

# 244. One Unauthorized Clause Aborts MUTATE

Because `MUTATE` is atomic:

```text
one denied required mutation
→ entire block aborts.
```

No partial cognitive transition is exposed.

---

# 245. Authority Is Revalidated at Commit

If a Grant/Delegation is revoked before commit:

```text
transaction aborts.
```

KML does not retain stale authority from parsing time.

---

# 246. Cognitive Fields Cannot Expand Authority

A KML clause cannot create:

```text
attributes.is_admin = true
```

and then rely on it in the same transaction to gain `manage_policy`.

Protected authorization uses trusted Governance state.

---

# 247. Derived Content Cannot Declassify Itself

A summary/Skill derived from restricted Evidence remains subject to classification propagation.

Declassification is a separate protected operation.

---

# 248. KML and Epistemic Trust

KML can record:

```text
source claims
Evidence
Assertions about reliability
```

but cannot directly change the protected Trust Resolver through ordinary cognition.

---

# 249. KML and Capsule Import

Native Cognitive Capsule import is NOT specified as:

```text
execute arbitrary KML contained in Capsule.
```

The Capsule is an artifact.

The importer:

```text
validates
maps identities
applies local Governance
builds an Import Plan
commits a destination transaction
```

---

# 250. Why Capsule Is Not KML Script in v2

Otherwise a remote Capsule could try to:

```text
merge local identities
set trust
activate Skill authority
rewrite $self
install Schema
```

through executable mutation text.

Native Capsule import remains a protected semantic pipeline.

---

# 251. KML and External Tool Calls

KML MUST NOT embed arbitrary external side effects such as:

```text
SEND EMAIL
TRANSFER MONEY
HTTP POST
DEPLOY
DELETE REMOTE FILE
```

inside an atomic cognitive transaction.

---

# 252. Why

KIP can roll back its own uncommitted state.

It cannot roll back the world.

---

# 253. Action Pattern

Use:

```text
Transaction 1:
    Decision + ActionIntent

External runtime:
    perform action

Transaction 2:
    Outcome Evidence + Activity + Experience
```

---

# 254. KML Can Record Action Intent

A Profile may define an `ActionIntent` Concept.

KML persists it as cognition.

Execution is a separate runtime authority.

---

# 255. KML Does Not Grant Tool Authority

A Skill/ActionIntent saying:

```text
"execute shell command"
```

does not authorize the shell.

Governance/tool runtime decides action authority.

---

# 256. Transaction Idempotency

The API/Transaction envelope MAY provide:

```text
idempotency_key
```

for the entire KML transaction.

---

# 257. KML Request Digest

Equivalent normalized KML/AST semantics should produce a stable request digest for transaction-idempotency comparison.

Whitespace changes should not cause false idempotency conflicts.

---

# 258. Element-Level Idempotency

Use `client_key` on:

```text
Evidence
Assertion
Activity
event-like Concept
```

when the logical source event has stable identity.

---

# 259. Same Client Key + Same Immutable Payload

Expected:

```text
resolve original element
no duplicate creation
```

---

# 260. Same Client Key + Different Immutable Payload

Expected:

```text
ClientKeyConflict
```

Do not silently treat a different event as retry.

---

# 261. Proposition Idempotency

`ENSURE PROPOSITION` is structurally idempotent by canonical tuple.

Concurrent creation resolves to one canonical active Proposition.

---

# 262. UPSERT Idempotency

`UPSERT CONCEPT` with stable key is idempotent with respect to final requested mutable state.

---

# 263. No-Effect Rule

If a mutation's final durable state equals current state:

```text
no version increment
no updated_at change
no cognitive change event
```

---

# 264. Why

Otherwise retries generate:

```text
false memory activity
maintenance noise
cache invalidation
version churn
```

---

# 265. Version Increment

A pre-existing element changed multiple times internally in one committed Transaction increments:

```text
_system.version
```

exactly once.

---

# 266. New Element Version

A new durable element begins:

```text
version = 1
```

under Core/Transaction rules.

---

# 267. Engine Time

`_system.updated_at` uses transaction commit time.

Semantic times remain explicit content:

```text
Evidence.observed_at
Assertion.asserted_at
Assertion.valid_time
Activity.started_at
```

---

# 268. Client-Supplied Time Is Semantic, Not Engine Truth

A caller can supply:

```text
observed_at
asserted_at
```

according to schema/provenance.

It cannot set:

```text
committed_at.
```

---

# 269. Mutation Receipt

A successful standalone KML mutation SHOULD return:

```text
semantic result
+
Transaction Receipt
```

---

# 270. `MUTATE` Result

Illustrative:

```json
{
  "handles": {
    "e": {
      "id": "evidence-1",
      "created": true
    },

    "p": {
      "id": "prop-9",
      "created": false,
      "canonical": true
    },

    "a": {
      "id": "assertion-3",
      "created": true
    }
  },

  "transitions": [
    {
      "id": "assertion-old",
      "from": "active",
      "to": "superseded"
    }
  ],

  "receipt": {
    "tx_id": "tx-...",
    "space_seq": 901,
    "status": "committed"
  }
}
```

---

# 271. Handle Result Is Helpful to Agents

The Agent can use returned durable IDs in future KQL without an extra search.

---

# 272. Canonical Reuse Is Explicit

If `ENSURE PROPOSITION` reused an existing Proposition, result should say so.

This helps explain idempotency and avoids confusing "not created" with error.

---

# 273. No-Effect Receipt

An entirely no-effect mutation can return:

```text
status = no_effect
space_seq = null
```

according to Transaction model.

---

# 274. UPDATE Result

Recommended:

```json
{
  "matched": 12,
  "updated": 8,
  "no_effect": 4,
  "receipt": {...}
}
```

Counts are over authorized visible mutation targets.

---

# 275. Lifecycle Result

Recommended:

```json
{
  "element_id": "...",
  "transition": {
    "from": "active",
    "to": "retracted"
  },
  "receipt": {...}
}
```

---

# 276. Purge Result

Must expose authorized impact information such as:

```text
purged elements
tombstoned refs
cascade count
redacted history count
```

subject to Governance.

---

# 277. Dry Run

Transaction Runtime MAY support:

```text
dry_run / preview
```

for KML.

It parses, resolves, authorizes, validates, and computes a predicted write set without committing.

---

# 278. Preview Is Not Reservation

A later commit can fail because:

```text
version changed
Grant revoked
Schema blocked
new reference appeared
```

Commit always revalidates.

---

# 279. Mutation Preview Is Important for High-Impact Operations

Especially:

```text
MERGE
TOMBSTONE
PURGE
bulk UPDATE
large maintenance
```

---

# 280. Bulk UPDATE and Serializable Semantics

Write transactions SHOULD have serializable outcomes.

A bulk update that depends on:

```text
read predicate
cross-element invariant
```

must not silently suffer write skew where the Transaction conformance promises serializability.

---

# 281. External Reasoning Before Write

Common Agent pattern:

```text
KQL read
LLM reasoning
KML write
```

is not automatically one transaction.

Use:

```text
EXPECT VERSION
transaction preconditions
```

to guard stale reasoning.

---

# 282. Do Not Hold Transaction While LLM Thinks

Preferred:

```text
read snapshot
reason outside
submit bounded KML with guards
```

not:

```text
begin transaction
wait for long LLM/tool reasoning
commit.
```

---

# 283. KML Mutation History

Every durable write connects to:

```text
created_tx
updated_tx
space_seq
origin
```

through engine-managed history.

---

# 284. KML Does Not Need to Store Audit as Generic Metadata

The Transaction log and Activity/provenance layers provide explicit audit/history.

---

# 285. Correction Is a New Transaction

After a wrong committed mutation:

```text
do not rollback committed cognitive history as if it never happened.
```

Create a compensating/correction transaction.

---

# 286. Privacy Exception

If policy requires purge:

```text
historical content may be physically removed.
```

This is not ordinary cognitive correction.

---

# 287. KML Error Classes

Recommended native errors:

```text
InvalidSyntax
InvalidIdentifier

SchemaSymbolNotFound
SchemaSymbolAmbiguous
SchemaFieldNotFound
TypeMismatch
ConstraintViolation

IdentitySelectorRequired
NameIdentityForbidden
IdentityConflict
ClientKeyConflict
CanonicalPropositionConflict

ImmutableField
ProtectedSystemField
ProtectedGovernanceField
ProtectedSchemaState
EpistemicRevisionRequired
EvidenceCorrectionRequired
ActivityTerminal

ReferenceError
ForwardReferenceUnresolved
StructuralReferenceInvalid
DuplicateLocalHandle
DuplicateMutationTarget
ReferenceIntegrityConflict

InvalidLifecycleTransition
RetractionNotAuthorized
SupersessionMismatch
EvidenceCorrectionConflict
IdentityMergeConflict

VersionConflict
PreconditionFailed
SerializationConflict

PurgeDenied
PurgeReferenceConflict
LegalHoldConflict

ResourceExhausted
TransactionTooLarge
ExecutionTimeout
```

Exact numeric registry is deferred.

---

# 288. `EpistemicRevisionRequired`

Useful diagnostic:

```text
Attempted to UPDATE Assertion confidence/stance/proposition.
Create a new Assertion revision and supersede the old one.
```

This teaches the Agent the correct memory operation.

---

# 289. `EvidenceCorrectionRequired`

Useful diagnostic:

```text
Attempted to overwrite Evidence payload.
Create new Evidence and CORRECT the old Evidence.
```

---

# 290. `NameIdentityForbidden`

Useful diagnostic:

```text
Native UPSERT cannot use type+name as unique identity.
Ground the Concept and use id/key.
```

---

# 291. `ProtectedGovernanceField`

Useful diagnostic:

```text
classification/authority/policy/trust state cannot be changed by ordinary KML.
Use authorized Governance operation.
```

---

# 292. `ActivityTerminal`

Useful diagnostic:

```text
Completed Activity provenance topology is immutable.
Create a correction Activity instead.
```

---

# 293. Error Recovery Should Be Semantic

KML errors SHOULD include a safe:

```text
hint
```

that tells an Agent whether to:

```text
re-read version
create new Assertion
create corrected Evidence
use exact Schema ref
request Governance authority
preview purge
```

---

# 294. Retry Version Conflict

On:

```text
VersionConflict
```

correct flow:

```text
re-read current state
re-run merge/reasoning
retry with fresh version
```

Do not blindly retry stale update.

---

# 295. Retry Ambiguous Network Failure

If transaction outcome is unknown:

```text
reuse same transaction idempotency key
or lookup transaction status
```

Do not create new Evidence/Assertion with a new logical key until outcome is known.

---

# 296. KML Capability Negotiation

Runtime SHOULD advertise:

```text
kml_version

mutate_block
forward_local_refs

create_concept
upsert_concept
ensure_proposition
create_evidence
create_assertion
create_activity

update
update_expressions
facet_mutation
structural_mutation

assertion_retraction
assertion_supersession
evidence_correction
activity_transition

archive
tombstone
purge
non_destructive_merge

expect_version
expect_state
client_key
dry_run

max_mutate_clauses
max_update_targets
max_purge_targets
```

---

# 297. Minimum KML 2.0 Conformance

A minimal native implementation MUST support equivalent semantics for:

```text
stable Concept create/upsert
canonical Proposition ensure
Evidence creation
Assertion creation
Activity creation
immutable field protection
Assertion lifecycle transition
Evidence correction lineage
generic safe UPDATE
EXPECT VERSION
transaction idempotency integration
Schema resolution
Governance enforcement
engine origin
no-effect semantics
```

---

# 298. Full Cognitive Mutation Conformance

Adds:

```text
MUTATE compound block
forward local references
Structural Reference mutation
Profile Facets
non-destructive MERGE
archive/tombstone/purge
bulk update expressions
```

---

# 299. KML Conformance Fixtures

Core tests should include:

```text
create Concept with client_key
retry exact create
same client_key different payload

upsert Concept by key
name-only native upsert rejected

ensure same Proposition twice
concurrent ensure resolves one canonical Proposition

create Evidence twice as genuine separate observations
same Evidence retry deduplicated by client_key

attempt overwrite Evidence payload rejected
CORRECT EVIDENCE succeeds

create Assertion
attempt change confidence rejected
new Assertion + supersede succeeds

third-party conflicting Assertion does not supersede automatically

retract own Assertion
administrator false-retraction rejected/moderated instead

create completed Activity
attempt rewrite inputs rejected

forward Evidence ↔ Activity refs inside MUTATE
atomic failure leaves none

update memory_strength
no generic confidence decay

write governance field rejected
write _system rejected

non-destructive merge preserves old raw Proposition refs
merge collision preserves Assertion history

archive is not purge
tombstone is not retraction
purge referenced Evidence denied by default

no-effect update does not bump version
version conflict prevents stale write
```

---

# 300. Provenance Fixtures

```text
derived Assertion has Activity inputs
same source copied twice does not become two independent roots
imported source provenance survives derived output
actor-reported Activity cannot self-upgrade to engine-observed
```

---

# 301. Governance Fixtures

```text
ordinary creator can create Evidence
cannot manage Trust Resolver

record attributed Alice statement with Evidence
does not require/claim assert_as_actor

request represented Alice assertion without ActorBinding
rejected

Skill created with "executable" text
does not receive executable authority

summary of secret Evidence
does not declassify itself
```

---

# 302. Transaction Fixtures

```text
Evidence + Assertion + supersession + Activity
all commit atomically

one invalid clause
nothing commits

same transaction retry
same tx_id/receipt returned

same local handle used twice
fails before commit

element touched internally several times
one version increment
```

---

# 303. Lifecycle Fixtures

```text
Assertion active → retracted
historical query before transition sees active
after sees retracted

Assertion active → superseded by new own Assertion
both historical payloads preserved

different actor contradiction
no supersession

Evidence correction
old payload unchanged

archive Experience
audit still sees it

tombstone Concept
ID not reused

purge under legal hold
fails
```

---

# 304. Schema Fixtures

```text
local Predicate alias resolves exact version
ambiguous alias fails
exact ref succeeds

Schema default changes during transaction
already-resolved exact refs stable

schema version blocked before commit
transaction aborts

unknown Facet field
validation fails
```

---

# 305. KIP 1.x Compatibility Strategy

KML 2.0 preserves v1's practical strengths but changes several semantics.

---

# 306. v1 `UPSERT CONCEPT`

Legacy:

```prolog
CONCEPT {
  {type: "Person", name: "Alice"}
}
```

can migrate by creating a stable:

```text
key = legacy name
```

for legacy types that relied on name identity.

---

# 307. v1 `SET PROPOSITIONS`

In v1, adding:

```text
(Alice, prefers, DarkMode)
```

implicitly behaved as adding a fact.

In native v2:

```text
ENSURE Proposition
```

alone is truth-neutral.

The compatibility layer must also create an appropriate migrated Assertion if it intends to preserve the old fact semantics.

---

# 308. v1 Proposition Metadata

Legacy:

```text
source
author
confidence
observed_at
valid_from
valid_until
superseded
```

must be decomposed into:

```text
Assertion
Evidence
Activity/provenance
lifecycle
retention
legacy annotation where unresolved
```

---

# 309. v1 `WITH METADATA`

There is no universal native v2 translation.

Migration must classify each key.

---

# 310. v1 Confidence UPDATE

Legacy metabolic pattern:

```text
confidence *= decay
```

SHOULD NOT be carried into native v2 Assertion semantics.

Possible intended migrations:

```text
memory accessibility decay
    → MnemonicState.memory_strength

current applicability decay
    → Epistemic Projection freshness rule

new evidence changed belief
    → new Assertion revision
```

---

# 311. v1 Evidence Count Reinforcement

If `evidence_count` was only a cached aggregate:

```text
migrate to derived/profile counter
```

while preserving actual Evidence where available.

Do not use the aggregate as proof of independent corroboration.

---

# 312. v1 `DELETE METADATA`

Classify the field first.

Examples:

```text
confidence
    cannot simply be deleted from Proposition
    migrate Assertion

expires_at
    retention

access_level
    Governance

operational marker
    Facet
```

---

# 313. v1 `DELETE PROPOSITIONS`

Native v2 ordinary behavior should usually become:

```text
Assertion lifecycle
archive
tombstone
system GC of unreferenced Proposition
```

rather than deleting semantic history.

---

# 314. v1 `DELETE CONCEPT DETACH`

Native migration default SHOULD be conservative:

```text
TOMBSTONE
```

or explicit high-impact purge plan.

Do not automatically reproduce transitive destructive cascade.

---

# 315. v1 `MERGE`

v1 repoints edges and deletes source.

Native v2:

```text
source remains
merged_into target
canonical resolution changes
raw historical refs remain
```

This is an intentional semantic break.

---

# 316. v1 Local Handle Ordering

v1 requires define-before-use.

Native v2 `MUTATE` allows declarative forward refs.

A `kip-1-compat` parser can preserve v1 sequential syntax while compiling to a v2 mutation graph.

---

# 317. v1 Knowledge Capsule Script

A v1 UPSERT Capsule can be translated through the migration/import adapter.

A native v2 Cognitive Capsule is not executed as arbitrary KML.

---

# 318. KML 2.0 Primer

A compact model-facing Primer could be:

```text
WRITE COGNITION:

Compound atomic write:
  MUTATE { ... }

Stable Concept:
  UPSERT CONCEPT ?x {
    MATCH {type:"Person", key:"alice"}
    SET FIELDS {...}
    SET ATTRIBUTES {...}
    SET FACET "..." {...}
  }

New event-like Concept:
  CREATE CONCEPT ?x {
    TYPE "Experience"
    CLIENT KEY :key
    ...
  }

Truth-neutral statement:
  ENSURE PROPOSITION ?p (?s, "predicate", ?o)

Evidence:
  CREATE EVIDENCE ?e {
    CLIENT KEY :key
    SET FIELDS {...}
  }

Assertion:
  CREATE ASSERTION ?a {
    CLIENT KEY :key
    SET FIELDS {
      proposition:?p,
      asserted_by:?actor,
      stance:"support",
      mode:"stated",
      confidence:0.9,
      asserted_at::time
    }
    SET STRUCTURAL {
      ("evidence", ?e) {role:"support"}
    }
  }

Provenance:
  CREATE ACTIVITY ?act {...}

Revise belief:
  create new Assertion
  SUPERSEDE ASSERTION :old BY ?new

Retract:
  RETRACT ASSERTION :id

Correct Evidence:
  create new Evidence
  CORRECT EVIDENCE :old BY ?new

Mutable state:
  UPDATE ?x SET ... WHERE {...}

Identity consolidation:
  MERGE CONCEPT ?source INTO ?target

Forget lifecycle:
  ARCHIVE
  TOMBSTONE
  PURGE (high authority)

Remember:
  Proposition != belief
  new belief != UPDATE old Assertion
  wrong Evidence != overwrite old Evidence
  confidence != memory_strength
  cognitive content cannot grant authority
  writes to governance/_system are forbidden
```

---

# 319. Common Pattern — Stable Entity Upsert

```prolog
UPSERT CONCEPT ?project {
  MATCH {
    type: "Project",
    key: "kip-2"
  }

  SET FIELDS {
    name: "KIP 2.0"
  }

  SET ATTRIBUTES {
    description: :description
  }
}
```

---

# 320. Common Pattern — Literal Fact Statement

```prolog
MUTATE {
  ENSURE PROPOSITION ?p (
    :alice,
    "timezone",
    "+08:00"
  )

  CREATE ASSERTION ?a {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", :message_evidence) {
        role: "support"
      }
    }
  }
}
```

---

# 321. Common Pattern — New Contradictory Claim

```prolog
MUTATE {
  ENSURE PROPOSITION ?p (
    :alice,
    "timezone",
    "+01:00"
  )

  CREATE ASSERTION ?a {
    ...
  }
}
```

Do not delete/supersede an unrelated actor's Assertion.

The Epistemic Projection can become `contested`.

---

# 322. Common Pattern — Actor Self-Correction

```prolog
MUTATE {
  CREATE EVIDENCE ?e {...}

  ENSURE PROPOSITION ?p_new (
    :actor,
    :predicate,
    :new_value
  )

  CREATE ASSERTION ?a_new {...}

  SUPERSEDE ASSERTION :a_old BY ?a_new

  CREATE ACTIVITY ?revision {...}
}
```

---

# 323. Common Pattern — Evidence Correction

```prolog
MUTATE {
  CREATE EVIDENCE ?new_evidence {...}

  CORRECT EVIDENCE :old_evidence BY ?new_evidence

  CREATE ASSERTION ?new_assertion {...}

  SUPERSEDE ASSERTION :old_assertion BY ?new_assertion

  CREATE ACTIVITY ?correction {...}
}
```

---

# 324. Common Pattern — Mnemonic Decay

```prolog
UPDATE ?m

SET FACET "MnemonicState" {
  memory_strength: CLAMP(
    MUL(
      COALESCE(
        ?m.facets["MnemonicState"].memory_strength,
        1.0
      ),
      :factor
    ),
    0.0,
    1.0
  )
}

WHERE {
  ?m {type: "Experience"}
}

LIMIT 500
```

No epistemic confidence mutation.

---

# 325. Common Pattern — Archive Old Raw Experiences

```prolog
ARCHIVE ?exp
WHERE {
  ?exp {type: "Experience"}

  FILTER(
    ?exp.facets["MnemonicState"].memory_strength
      < :archive_threshold
  )

  FILTER(
    ?exp.attributes.consolidation_status
      == "consolidated"
  )
}
LIMIT 200
```

Actual archive eligibility remains Profile/Governance policy.

---

# 326. Common Pattern — Identity Merge

```prolog
MERGE CONCEPT ?duplicate INTO ?canonical

WHERE {
  ?duplicate {id: :duplicate_id}
  ?canonical {id: :canonical_id}
}
```

Result:

```text
duplicate remains historical
canonical future resolution → canonical target
```

---

# 327. Common Pattern — Create Skill Candidate

```prolog
MUTATE {
  CREATE CONCEPT ?skill {
    TYPE "Skill"
    CLIENT KEY :skill_version_key

    SET ATTRIBUTES {
      skill_class: :skill_class,
      summary: :summary,
      applicability: :applicability,
      procedure: :procedure,
      status: "candidate"
    }

    SET STRUCTURAL {
      ("compiled_from", :experience_1)
      ("compiled_from", :experience_2)
      ("compiled_by", ?act)
    }
  }

  CREATE ACTIVITY ?act {
    ...
  }
}
```

Authority remains locally governed.

---

# 328. Common Pattern — No Hidden CoT Inference

Store:

```text
inputs
method identity
parameters digest
decision summary
output
```

not:

```text
private model token trace.
```

---

# 329. Common Pattern — Action Outcome

After an external action:

```prolog
MUTATE {
  CREATE EVIDENCE ?outcome {
    CLIENT KEY :external_operation_id

    SET FIELDS {
      evidence_class: "tool_result",
      payload: :result_payload,
      observed_at: :time
    }
  }

  CREATE ACTIVITY ?action_result {
    ...
  }

  CREATE CONCEPT ?experience {
    TYPE "Experience"
    ...
  }
}
```

Repeated delivery of the same external operation uses stable client/transaction identity.

---

# 330. Common Anti-Pattern — Rewrite Fact

Bad:

```prolog
UPDATE ?p
SET FIELDS {
  object: "+01:00"
}
WHERE {
  ?p (:alice, "timezone", "+08:00")
}
```

Correct:

```text
new Proposition
new Assertion
possible supersession
```

---

# 331. Common Anti-Pattern — Confidence Decay

Bad:

```prolog
UPDATE ?a
SET FIELDS {
  confidence: MUL(?a.confidence, 0.9)
}
...
```

Correct:

```text
leave historical Assertion confidence
apply temporal relevance in Projection
or decay memory_strength.
```

---

# 332. Common Anti-Pattern — Delete Contradiction

Bad:

```text
new evidence disagrees
→ delete old Assertion
```

Correct:

```text
preserve contradiction
or supersede only when real revision semantics exist.
```

---

# 333. Common Anti-Pattern — Fake Retraction

Bad:

```text
admin dislikes Alice's Assertion
→ mark Alice retracted it.
```

Correct:

```text
Governance moderation/quarantine.
```

---

# 334. Common Anti-Pattern — Evidence Rewrite

Bad:

```text
measurement was wrong
→ replace old payload bytes.
```

Correct:

```text
new Evidence
CORRECT old BY new.
```

---

# 335. Common Anti-Pattern — Name-Based Identity Merge

Bad:

```text
both named Alice
→ MERGE.
```

Correct:

```text
identity evidence/review
merge_identity authority.
```

---

# 336. Common Anti-Pattern — Authority in Attribute

Bad:

```prolog
UPDATE ?skill
SET ATTRIBUTES {
  authority: "executable"
}
```

Correct:

```text
separate Governance elevation.
```

---

# 337. Common Anti-Pattern — Capsule as Code

Bad:

```text
download remote Capsule
execute its KML verbatim
```

Correct:

```text
verify
validate
preview
map identity
apply local Governance
Import Transaction.
```

---

# 338. KML Mutation Decision Tree

```text
Do you need to add a stable entity/profile object?
    → CREATE / UPSERT CONCEPT

Do you need a semantic statement to be referable?
    → ENSURE PROPOSITION

Did somebody/something take a stance?
    → CREATE ASSERTION

What artifact/observation supports it?
    → CREATE EVIDENCE

Was the result derived/transformed?
    → CREATE ACTIVITY

Did belief materially change?
    → CREATE new Assertion
      + SUPERSEDE when semantically valid

Was Evidence wrong?
    → CREATE new Evidence
      + CORRECT old BY new

Are you changing mnemonic/profile state?
    → UPDATE allowed Facet/attribute

Are two Concepts the same identity?
    → MERGE CONCEPT under identity authority

Do you want ordinary forgetting?
    → ARCHIVE / retention

Do you want logical deletion?
    → TOMBSTONE

Do you need physical erasure?
    → PURGE under high authority
```

---

# 339. KML Core Invariants

The following are normative design targets.

1. KML expresses mutation intent; Transaction defines durable atomic commit.
2. A standalone KML write executes in one implicit transaction.
3. Transport batches are not automatically atomic.
4. `MUTATE` is one compound atomic cognitive mutation.
5. `MUTATE` is declarative, not sequential.
6. Local handles may be forward-referenced inside one `MUTATE`.
7. Local handles are not durable IDs.
8. Duplicate local handles are invalid.
9. Conflicting source-order-dependent mutations to one target are invalid.
10. Every durable element keeps one immutable Nexus-local ID.
11. Ordinary KML cannot choose new engine IDs.
12. Concept `name` is not universal identity.
13. Native Concept upsert requires stable identity such as ID/key.
14. Name-only native upsert is forbidden.
15. `client_key` distinguishes durable creation retry from repetition.
16. Same client key with conflicting immutable payload fails.
17. Proposition creation is canonical `ENSURE` by semantic tuple.
18. Proposition existence does not create belief.
19. Proposition tuple is immutable.
20. Proposition has no native epistemic confidence/source.
21. Proposition arbitrary semantic attributes are discouraged/not native.
22. Evidence is append-oriented.
23. Evidence payload is historically immutable.
24. Evidence correction creates new Evidence and lineage.
25. Digest equality does not imply Evidence identity.
26. Assertion is append-oriented.
27. Assertion targets exactly one Proposition.
28. Assertion epistemic payload is historically immutable.
29. New belief creates a new Assertion.
30. Assertion confidence is not routinely mutated by time/reinforcement.
31. New evidence normally creates a new Assertion revision/derivation rather than modifying old citations.
32. Assertion retraction is a lifecycle transition, not deletion.
33. Retraction means real actor/authorized withdrawal.
34. Administrative exclusion must not forge retraction.
35. Supersession is not generic contradiction.
36. Supersession preserves old Assertion payload.
37. Conflicting third-party Assertions may coexist indefinitely.
38. Evidence support/challenge citations are Structural References.
39. Activity records provenance process, not database transaction.
40. Engine-observed Activity/Evidence status cannot be self-asserted by content.
41. Completed Activity provenance topology is immutable.
42. Structural References are not semantic Propositions.
43. Structural cycles may exist where schema permits.
44. UPDATE never creates elements.
45. UPDATE cannot target virtual KQL projection objects.
46. UPDATE obeys Core/Profile mutability rules.
47. Generic UPDATE cannot mutate Proposition tuple.
48. Generic UPDATE cannot mutate Assertion epistemic payload.
49. Generic UPDATE cannot mutate Evidence payload.
50. Generic UPDATE cannot mutate completed Activity provenance.
51. Generic UPDATE cannot mutate `_system`.
52. Generic UPDATE cannot mutate protected Governance state.
53. Native KML has no universal author-writable metadata bag.
54. Profile Facets are schema-defined, not generic metadata.
55. Memory strength is distinct from Assertion confidence.
56. Generic confidence decay is not a KIP 2.0 memory-metabolism primitive.
57. Temporal relevance belongs to Projection, not historical-confidence decay.
58. Reconfirmation creates new evidence/history or justified derived counters.
59. Reads do not automatically reinforce memory.
60. Retention is distinct from world valid time.
61. Archive is distinct from retraction.
62. Archive is distinct from tombstone.
63. Tombstone is distinct from purge.
64. Purge is reference-aware and high-authority.
65. Evidence purge receives stricter scrutiny.
66. Destructive cascade is never the ordinary default.
67. MERGE CONCEPT is non-destructive.
68. Merge preserves source Concept as historical identity.
69. Raw historical Proposition refs are not rewritten by merge.
70. New writes resolve merged identities canonically.
71. Merge requires identity authority.
72. Canonical Proposition collisions after merge preserve Assertion/provenance history.
73. Derived cognitive output preserves provenance roots.
74. Derivation cannot amplify authority.
75. Derivation cannot silently declassify.
76. Cognitive content cannot grant Governance authority.
77. KML cannot install/activate Schema Packages.
78. Local Schema aliases resolve under one Transaction Schema Environment.
79. Persisted semantic refs are exact-version refs.
80. Ambiguous schema aliases fail rather than guess.
81. `_system.origin` is engine-maintained.
82. Claimed source/provenance does not replace engine origin.
83. `asserted_by` is semantic actor, not authenticated writer.
84. KML cannot self-grant `assert_as_actor`.
85. Governance authorization is revalidated at commit.
86. Revocation before commit prevents dependent commit.
87. One unauthorized required MUTATE clause aborts the whole compound write.
88. No-effect final state does not bump version.
89. A changed element increments version once per transaction.
90. Semantic timestamps are distinct from engine commit time.
91. KML does not execute arbitrary external world side effects.
92. External actions use intent/outcome patterns.
93. Native Capsule import is not arbitrary KML execution.
94. Capsule import cannot gain authority through KML text.
95. Correction is a new state transition, not erasure of committed history.
96. Legal/privacy purge may override ordinary historical preservation.
97. KML errors should teach the Agent the correct semantic mutation.
98. Compatibility translation must not silently collapse v2 epistemic distinctions.
99. Profile macros may simplify syntax but cannot weaken Core invariants.
100. A real cognitive write should leave the Brain more historically explainable, not less.

---

# 340. Formal Grammar Sketch

Non-normative EBNF-style sketch:

```text
kml_statement :=
      mutate_statement
    | create_concept
    | upsert_concept
    | ensure_proposition
    | create_evidence
    | create_assertion
    | create_activity
    | update_statement
    | retract_assertion
    | supersede_assertion
    | correct_evidence
    | transition_activity
    | set_retention
    | archive_statement
    | tombstone_statement
    | purge_statement
    | merge_concept

mutate_statement :=
    "MUTATE" "{"
      mutation_clause*
    "}"

mutation_clause :=
      create_concept
    | upsert_concept
    | ensure_proposition
    | create_evidence
    | create_assertion
    | create_activity
    | retract_assertion
    | supersede_assertion
    | correct_evidence
    | transition_activity

create_concept :=
    "CREATE CONCEPT" handle
    "{"
      type_clause
      client_key_clause?
      name_clause?
      set_fields_clause?
      set_attributes_clause?
      set_facet_clause*
      set_structural_clause?
    "}"

upsert_concept :=
    "UPSERT CONCEPT" handle
    "{"
      match_clause
      expect_version_clause?
      set_fields_clause?
      set_attributes_clause?
      unset_attributes_clause?
      set_facet_clause*
      unset_facet_clause*
      set_structural_clause?
    "}"

ensure_proposition :=
    "ENSURE PROPOSITION" handle?
    "(" term "," predicate_term "," term ")"

create_evidence :=
    "CREATE EVIDENCE" handle
    "{"
      client_key_clause?
      set_fields_clause
      set_facet_clause*
      set_structural_clause?
    "}"

create_assertion :=
    "CREATE ASSERTION" handle
    "{"
      client_key_clause?
      set_fields_clause
      set_facet_clause*
      set_structural_clause?
    "}"

create_activity :=
    "CREATE ACTIVITY" handle
    "{"
      client_key_clause?
      set_fields_clause
      set_facet_clause*
      set_structural_clause?
    "}"

update_statement :=
    "UPDATE" variable
    update_clause+
    "WHERE" "{"
      kql_clause*
    "}"
    limit_clause?

retract_assertion :=
    "RETRACT ASSERTION" target
    where_clause?
    expect_state_clause?

supersede_assertion :=
    "SUPERSEDE ASSERTION" target
    "BY" target

correct_evidence :=
    "CORRECT EVIDENCE" target
    "BY" target

transition_activity :=
    "TRANSITION ACTIVITY" target
    "TO" value
    expect_state_clause?

merge_concept :=
    "MERGE CONCEPT" variable
    "INTO" variable
    "WHERE" "{"
      kql_clause*
    "}"
```

Formal grammar will need exact rules for standalone IDs, local handles, fields, references, and lifecycle options.

---

# 341. Recommended Syntax Philosophy

Prefer:

```text
few stable verbs
explicit element kind
JSON-like field blocks
graph-native references
```

over:

```text
large SQL-like grammar
many special-case keywords
implicit epistemic meaning
```

---

# 342. Model-First Reasoning

An LLM should be able to reason:

```text
"this is a new observation"
→ create Evidence

"this statement can be referred to"
→ ensure Proposition

"Alice said it"
→ create Assertion

"this changes her earlier own claim"
→ supersede

"I inferred it from prior inputs"
→ create Activity

"I am only changing accessibility"
→ update memory_strength
```

without needing database implementation knowledge.

---

# 343. KML vs. "Learning"

Executing KML changes external cognitive state.

That is not automatically equivalent to learning in the strongest behavioral sense.

---

# 344. Strong Learning Criterion

A stronger criterion remains:

```text
Experience
    ↓
durable memory/procedure update
    ↓
future behavior changes in relevant context
```

KML is the persistence/mutation substrate that enables this loop.

---

# 345. Non-Parametric Learning

Graph/Profile updates can create:

```text
non-parametric cognitive adaptation
```

even if model weights do not change.

But protocol documentation should distinguish:

```text
memory mutation
```

from:

```text
demonstrated behavioral learning.
```

---

# 346. Causal Evaluation

The strongest evidence that KML-formed memory matters is:

```text
behavior with memory
vs.
behavior with memory ablated
```

not merely:

```text
records exist.
```

---

# 347. Final Architecture

```text
                      Agent / Brain
                           │
                           ▼
                     Mutation Intent
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          CREATE         UPDATE       TRANSITION
             │             │             │
             ├ Evidence    ├ Facets      ├ Retract
             ├ Assertion   ├ Attributes  ├ Supersede
             ├ Activity    └ Mutable     ├ Correct
             ├ Concept       Fields      └ Activity state
             └ Proposition
                ENSURE
             │
             └─────────────┬─────────────┘
                           ▼
                     MUTATE Planner
                           │
                  resolve local handles
                  resolve exact Schema
                  canonicalize identity
                  validate references
                           │
                           ▼
                 Governance Authorization
                           │
                           ▼
                 Core / Profile Validation
                           │
                           ▼
                    Transaction Runtime
                           │
                 serializable validation
                 commit-time revocation
                           │
                     ┌─────┴─────┐
                     │           │
                    abort       commit
                     │           │
                     ▼           ▼
                 no change   Space S(k+1)
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ▼               ▼               ▼
              elements        tx history      change stream
                 │               │               │
                 └───────────────┼───────────────┘
                                 ▼
                              Receipt
                                 │
                                 ▼
                         Future Cognition
```

---

# 348. Core KML Equations

```text
Proposition Update
    =
    create/resolve another Proposition
```

not:

```text
rewrite tuple
```

---

```text
Belief Revision
    =
    New Assertion
    +
    Optional Supersession
    +
    Provenance
```

not:

```text
UPDATE old confidence/value
```

---

```text
Evidence Correction
    =
    New Evidence
    +
    Correction Lineage
```

not:

```text
overwrite historical artifact
```

---

```text
Mnemonic Forgetting
    =
    memory_strength / retention evolution
```

not:

```text
truth confidence decay
```

---

```text
Identity Consolidation
    =
    canonical resolution change
    +
    preserved raw historical identity
```

not:

```text
rewrite all past references
```

---

```text
Cognitive Mutation
    ≠
Governance Mutation
```

---

```text
Derived Content
    ≠
Higher Authority
```

---

```text
Transaction Retry
    ≠
Repeated Experience
```

---

```text
KML Commit
    ≠
External World Commit
```

---

# 349. Final Principle

KIP 1.x made knowledge mutation practical by giving an Agent a compact way to:

```text
UPSERT
UPDATE
DELETE
MERGE
```

a graph.

KIP 2.0 asks a harder question:

> **What should mutation mean when the graph is no longer merely a database of facts, but the durable cognitive history of an Agent?**

A real memory brain must be able to answer after every important write:

> What exactly was newly observed?

> Which semantic statement was created only as a truth-neutral Proposition?

> Who actually asserted it?

> Was the caller recording someone else's statement or acting with verified representation authority?

> Which Evidence existed at that moment?

> Which Activity produced the derived result?

> Did new Evidence revise an earlier belief, or merely contradict another actor?

> If belief changed, can we still reconstruct the old belief?

> If Evidence was wrong, can we recover the artifact that misled us?

> Did a maintenance cycle reduce accessibility or improperly rewrite confidence?

> Did identity consolidation improve future grounding without rewriting old source references?

> Did a derived Skill inherit provenance without inheriting executable authority?

> Was a deletion archival, logical, or physical?

> Could counter-Evidence have been silently erased?

> Did a network retry create duplicate memory?

> Did a revoked writer still manage to commit?

> Which exact Schema version gave every field and Predicate meaning?

> Did any cognitive content try to grant itself authority?

These questions should be answered by the protocol's structure, not by hoping every Agent prompt follows an informal convention.

The governing idea is:

> **A Brain learns safely when new cognition can change the future without falsifying the past.**

KML 2.0 is the language of that change.
