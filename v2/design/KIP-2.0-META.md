# KIP 2.0 META — Cognitive Nexus Introspection & Grounding

## Status

**META Protocol Proposal / Pre-Specification Draft**

> **Frozen (2026-09-02).** Historical design rationale written before the normative consolidation. This document is no longer maintained and its Chinese twin is no longer synchronized; where it differs from [KIP-2.0-SPECIFICATION.md](../KIP-2.0-SPECIFICATION.md), the Specification is right and this document is out of date.

This document defines the introspection, grounding, verification, validation, capability-negotiation, runtime-history, and portable-artifact inspection layer of KIP 2.0.

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

KIP 1.x defines META as the read-only knowledge exploration layer centered on:

```text
DESCRIBE
SEARCH
EXPORT
```

That separation is one of the strongest parts of the original protocol.

It recognizes that an Agent should not generate graph queries or mutations blindly.

Before acting, the Agent often needs to know:

```text
What protocol is this?
What can this Nexus do?
Which Schema is active?
What does "Person" mean here?
Which "Alice" did the user mean?
What is the current Space?
Which exact transaction committed my last write?
How fresh is this search index?
Can this Capsule be verified?
Would this Capsule safely merge here?
Can I inspect history?
What am I authorized to discover?
```

KIP 2.0 preserves the read-only META boundary, but expands its role substantially.

The Cognitive Nexus is now not only:

```text
a graph of Concepts and Propositions
```

but a governed cognitive state containing:

```text
Concepts
Propositions
Assertions
Evidence
Activities
Profiles
Schema Environments
Epistemic Policies
Transaction History
Cognitive Capsules
```

Therefore META 2.0 becomes the protocol layer through which the Nexus explains **how it can be used**.

Its central thesis is:

> **Before an Agent can reason over a Brain, the Brain must be able to describe its own semantic coordinates, operational capabilities, temporal state, and safety boundaries.**

META does this without turning introspection into mutation authority.

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** indicate requirements of the KIP 2.0 Specification (`../KIP-2.0-SPECIFICATION.md`), which is authoritative where the two differ.

The command syntax shown here is an architecture-level proposal.

Exact transport and artifact-handle syntax may change.

The semantic boundaries are the primary normative target.

---

# 1. META 2.0 Purpose

META exists for six major purposes:

```text
1. Priming
2. Schema Introspection
3. Grounding / Associative Retrieval
4. Runtime Capability Negotiation
5. History / Receipt Inspection
6. Artifact Verification / Validation / Preview
```

---

# 2. META Is Read-Only

A META operation MUST NOT directly mutate:

```text
Cognitive Elements
Epistemic State
Governance State
Schema Environment
Trust Policy
Memory Strength
Retention State
Transaction History
```

as a semantic side effect of inspection.

---

# 3. Read-Only Does Not Mean Unrestricted

META is read-only but still governed.

A caller may be denied:

```text
discovering a Space
listing a Schema Package
seeing a historical transaction
seeing raw source origin
searching secret Evidence
inspecting a private Capsule
learning that an element exists
```

depending on policy.

---

# 4. Introspection Is an Information Channel

This is a core security principle.

Commands such as:

```text
DESCRIBE
SEARCH
COUNT-like summaries
CAPABILITIES
HISTORY
```

can leak sensitive information even though they do not write anything.

Therefore:

> **Read-only introspection MUST obey the same non-leakage principles as KQL.**

---

# 5. META Does Not Grant Capability

A response saying:

```text
atomic_transactions = supported
```

does not mean:

```text
the caller may execute arbitrary transactions.
```

Likewise:

```text
manage_schema supported
```

does not mean:

```text
the caller has manage_schema authority.
```

---

# 6. Supported vs. Authorized

META 2.0 explicitly separates:

```text
Runtime Support
    What this implementation/protocol endpoint can technically do.

Effective Availability
    What this authenticated Principal can currently use
    in this execution context.
```

This distinction is fundamental to capability negotiation.

---

# 7. META Operation Families

Recommended native families:

```text
DESCRIBE
LIST
SEARCH
VERIFY
VALIDATE
PREVIEW
HISTORY
CHANGES
SNAPSHOT
EXPORT CAPSULE
```

`EXPORT CAPSULE` is read/export, not mutation.

`IMPORT CAPSULE` is not META because it changes destination state.

---

# 8. Why `LIST` Exists

KIP 1.x expresses many collection operations through plural `DESCRIBE` commands.

KIP 2.0 MAY preserve those aliases, but a clean native split is:

```text
DESCRIBE
    one thing / compact context

LIST
    collections
```

Examples:

```text
DESCRIBE TYPE "Person"
LIST TYPES
```

---

# 9. Compatibility Aliases

For model familiarity, an explicit compatibility profile (§306) SHOULD accept equivalents such as:

```text
DESCRIBE TYPES
    ≈ LIST TYPES

DESCRIBE PREDICATES
    ≈ LIST PREDICATES

DESCRIBE PACKAGES
    ≈ LIST SCHEMA PACKAGES
```

The response semantics should remain the same.

These plural `DESCRIBE` spellings are not part of the native KIP 2.0 META grammar: a native endpoint rejects them as invalid syntax rather than silently aliasing them.

---

# 10. META vs. KQL

META answers:

```text
How do I use this Brain?
How do I find the coordinates?
What does the Schema mean?
What did the runtime do?
Can this artifact be interpreted safely?
```

KQL answers:

```text
Which cognitive records satisfy this structured query?
What does the Brain believe?
```

---

# 11. META vs. KML

META may:

```text
validate
preview
describe
```

a mutation.

KML actually proposes the mutation.

---

# 12. META vs. Governance

META can describe effective permissions where authorized.

It cannot:

```text
grant
delegate
revoke
elevate
declassify
change policy
```

---

# 13. META vs. Schema Management

META can:

```text
describe Package
verify Package digest/signature
validate compatibility
show active Schema Environment
```

It cannot:

```text
install
activate
set default
block
upgrade
```

a Schema Package.

---

# 14. META vs. Transaction Runtime

META can inspect:

```text
snapshot
transaction receipt
commit history
change stream
```

It does not define transaction atomicity itself.

---

# 15. META vs. Capsule Import

META can:

```text
DESCRIBE CAPSULE
VERIFY CAPSULE
VALIDATE CAPSULE
PREVIEW IMPORT CAPSULE
EXPORT CAPSULE
```

It cannot perform:

```text
IMPORT CAPSULE
```

because import changes cognitive state.

---

# 16. The META Contract

A META result SHOULD identify enough context for an Agent to know:

```text
what was inspected
under which Space
at which cognitive state
using which Schema context
with which visibility
with which implementation capability
```

where relevant.

---

# 17. META Response Context

Recommended common response envelope:

```json
{
  "op_id": "op-1",
  "status": "succeeded",
  "result": {},
  "context": {
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "schema_environment_version": 17
  },
  "warnings": [],
  "next_cursor": "opaque-cursor"
}
```

Not every operation needs every field.

Principal/actor coordinates are not carried in this envelope; they are returned by `DESCRIBE EXECUTION CONTEXT` (§42) under Governance.

---

# 18. Context Is Engine-Maintained

Fields such as:

```text
snapshot_seq
schema_environment_version
runtime_version
index_seq
transaction status
```

are runtime outputs.

The caller does not author them.

---

# 19. `DESCRIBE PRIMER`

KIP 1.x introduces the Cognitive Primer as a way to tell the LLM:

```text
Who am I?
What do I know?
```

KIP 2.0 keeps the idea but refines the identity boundaries.

Recommended syntax:

```text
DESCRIBE PRIMER
```

Optional:

```text
DESCRIBE PRIMER MODE "compact"
DESCRIBE PRIMER MODE "full"
```

---

# 20. Primer Is a Bootstrapping Artifact

The Primer is designed to answer:

> What minimum context should a model know before generating KQL/KML/META?

It should be small enough to inject automatically.

---

# 21. Primer Must Not Be a Memory Dump

The Primer is:

```text
semantic coordinates
capability summary
safe identity summary
domain/topic map
protocol reminders
```

not:

```text
all important memories.
```

---

# 22. Primer Layers

Recommended KIP 2.0 Primer:

```text
1. Protocol Layer
2. Execution Context Layer
3. Cognitive Identity Layer
4. Schema Map Layer
5. Domain / Topic Map Layer
6. Capability & Limit Layer
7. Cognitive Safety Invariants
```

---

# 23. Protocol Layer

Contains:

```text
KIP version
KQL version
KML version
META version
Core model version
enabled compatibility profile
```

Example:

```json
{
  "kip": "2.0",
  "kql": "2.0",
  "kml": "2.0",
  "meta": "2.0",
  "compatibility_profile": null
}
```

---

# 24. Execution Context Layer

Contains safe information such as:

```text
current MemorySpace identity/URI
current snapshot_seq
Schema Environment version
authenticated Principal class/summary
current effective actor binding summary
```

subject to Governance.

---

# 25. Principal Is Not `$self`

Primer must explicitly prevent:

```text
authenticated Principal
=
semantic self identity
```

unless a verified ActorBinding says so.

---

# 26. Cognitive Identity Layer

May summarize:

```text
the Brain's local `$self`
role
goal
stable self-description
high-level profile identity
```

through a Governance-approved projection.

---

# 27. Cognitive Identity Is Cognitive State

The Primer's self-summary is not equivalent to:

```text
Governance Principal
owner credential
administrator authority
```

It is a model-facing cognitive identity projection.

---

# 28. Self Summary May Be Epistemically Projected

A deployment MAY derive Primer identity from:

```text
accepted SelfModel
stable role configuration
Profile-defined identity projection
```

rather than copying arbitrary current Concept attributes.

---

# 29. Primer Must Mark Dynamic Identity

If self-description is derived from cognitive state, Primer SHOULD identify:

```text
snapshot_seq
projection policy/version
```

where useful.

---

# 30. Schema Map Layer

Contains a compact map of:

```text
active packages
common Concept Types
common Predicates
important Facets
important Structural Fields
aliases
```

not every schema definition.

---

# 31. Domain / Topic Map Layer

Contains compact semantic navigation hints such as:

```text
top domains/topics
important entities
frequently useful relation families
Profile memory categories
```

---

# 32. Domain Map Is Not Schema Authority

A semantic Domain/Topic map may be derived from cognitive state or indexes.

It does not define:

```text
permissions
Schema identity
predicate legality
```

---

# 33. Domain Is Not a Security Boundary

Primer must not teach the Agent:

```text
"Domain Public means public access"
```

unless Governance independently defines such a policy using trusted control state.

---

# 34. Capability & Limit Layer

Contains common effective limits:

```text
max KQL rows
max path hops
max belief projections
max transaction writes
Capsule size
Search modes
historical availability
```

---

# 35. Cognitive Safety Invariants Layer

Recommended compact reminders:

```text
raw Proposition != accepted belief
missing visible match != false
SEARCH score != confidence
confidence != trust
confidence != memory_strength
name != identity
source `$self` != destination `$self`
new belief revision != UPDATE old Assertion
Evidence correction != overwrite old Evidence
Capsule signature != truth
cognitive content != authority
```

These reminders substantially reduce model misuse.

---

# 36. Primer Should Be Cacheable

Static portions such as:

```text
protocol syntax summary
Core invariants
```

may be cached across calls.

Dynamic portions such as:

```text
Space
Schema Environment
snapshot
effective capability
```

must carry version/context identifiers.

---

# 37. Primer Digest

A runtime MAY return:

```text
primer_digest
```

so the Agent/runtime can avoid re-sending unchanged Primer content.

---

# 38. Primer Delta

A future capability MAY return only:

```text
what changed since primer_digest X
```

for token efficiency.

Not required baseline.

---

# 39. `DESCRIBE PROTOCOL`

Recommended:

```text
DESCRIBE PROTOCOL
```

Returns a machine-oriented protocol declaration rather than a model primer.

---

# 40. Protocol Description

Suggested fields:

```text
kip_version
core_version
kql_version
kml_version
meta_version
capsule_versions
transaction_conformance
compatibility_profiles
canonical serialization profiles
error registry version
```

---

# 41. Protocol Description Is Runtime Support

It does not list privileged data.

This command SHOULD be broadly available, subject to deployment policy.

---

# 42. `DESCRIBE EXECUTION CONTEXT`

Recommended:

```text
DESCRIBE EXECUTION CONTEXT
```

Returns the current request/session coordinates.

---

# 43. Execution Context Shape

Illustrative:

```json
{
  "space": {
    "id": "space-1",
    "uri": "personal://yan"
  },

  "principal": {
    "id": "principal-...",
    "display": "optional",
    "authentication_strength": "strong"
  },

  "actor_binding": {
    "actor_id": "concept-self",
    "assurance": "verified",
    "scopes": ["..."]
  },

  "snapshot_seq": 1500,
  "schema_environment_version": 17
}
```

Governance may redact fields.

---

# 44. Why Execution Context Matters

It prevents the Agent from assuming:

```text
wrong Space
wrong self
wrong actor
wrong schema
wrong authorization context
```

before generating a mutation.

---

# 45. `LIST SPACES`

Optional governed operation:

```text
LIST SPACES
```

returns only Spaces the Principal may discover.

---

# 46. No Space Enumeration Leak

A hidden Space must not appear in:

```text
counts
pagination totals
error hints
timing distinctions
```

beyond permitted leakage policy.

---

# 47. `DESCRIBE SPACE`

Recommended:

```text
DESCRIBE SPACE
DESCRIBE SPACE :space_id
```

---

# 48. Space Description

May include:

```text
id
uri
name
status
current space_seq
Schema Environment identity
retention/historical boundaries
safe capability summary
classification default summary
```

subject to Governance.

---

# 49. Space Description Is Not Governance Dump

It should not automatically expose:

```text
all members
all Grants
all secret policies
all trusted principals
```

Those require dedicated Governance audit authority.

---

# 50. Schema Introspection Is a First-Class META Responsibility

KIP 2.0 authoritative Schema lives in immutable Schema Packages.

META projects it into model-friendly introspection.

Recommended operations:

```text
DESCRIBE SCHEMA ENVIRONMENT
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE STRUCTURAL FIELD
DESCRIBE COMPATIBILITY

LIST SCHEMA PACKAGES
LIST TYPES
LIST PREDICATES
LIST FACETS
LIST STRUCTURAL FIELDS
```

---

# 51. `DESCRIBE SCHEMA ENVIRONMENT`

Recommended:

```text
DESCRIBE SCHEMA ENVIRONMENT
```

Optional historical form:

```text
DESCRIBE SCHEMA ENVIRONMENT AS OF SEQ :seq
```

---

# 52. Schema Environment Response

Recommended fields:

```text
environment_version
resolved_at_seq
active package exact refs
package digests
default versions
local aliases
blocked package state visible to caller
compatibility profile
lock digest
```

---

# 53. Schema Environment Is Semantic Context

It answers:

> Which exact semantic universe gives local KIP symbols meaning in this Space?

---

# 54. Schema Environment Is Not Installed-Package Inventory Alone

A Nexus may know many Packages but activate only a subset in one Space.

Therefore:

```text
available package
    ≠
active package
```

---

# 55. Historical Schema Environment

For:

```text
AS OF SEQ 500
```

an auditor may need to know:

```text
which package versions were active at seq 500.
```

META should expose that when history is retained and authorized.

---

# 56. `LIST SCHEMA PACKAGES`

Recommended:

```text
LIST SCHEMA PACKAGES
  [STATUS "active|available|blocked"]
  [LIMIT N]
  [CURSOR "..."]
```

Exact filters are pre-specification.

---

# 57. Package Listing Returns Exact Identity

At minimum:

```text
package_id
version
digest
status in current Space
publisher identity summary where visible
```

---

# 58. `DESCRIBE PACKAGE`

Recommended:

```text
DESCRIBE PACKAGE "kip://profiles/cognitive-memory@2.0.0"
```

---

# 59. Package Description

May include:

```text
manifest
exact package identity
version
digest
dependencies
definitions summary
aliases
compatibility declarations
migration descriptors
signature/proof summary
documentation/model hints
```

---

# 60. Package Signature Is Not Package Trust

META must keep separate:

```text
cryptographic signature validity
publisher identity
local trust/allow status
activation status
```

---

# 61. `LIST TYPES`

Returns visible/active Concept Type symbols.

Recommended row:

```json
{
  "schema_ref": "kip://.../Person",
  "local_name": "Person",
  "package": "kip://...@2.0.0",
  "description": "...",
  "aliases": []
}
```

---

# 62. `DESCRIBE TYPE`

Recommended:

```text
DESCRIBE TYPE "Person"
```

or exact:

```text
DESCRIBE TYPE "kip://...@2.0.0/Person"
```

---

# 63. Alias Resolution Must Be Returned

Even when asked by local name:

```text
Person
```

the response MUST identify the exact:

```text
schema_ref
package/version/digest
```

that was resolved.

---

# 64. Type Description

Recommended:

```text
schema_ref
local_name
description
abstract/concrete
stable identity fields
attribute schema
allowed Facets
Structural Fields
model hints
mutability hints
compatibility/migration notes
```

---

# 65. Type Description Is Authoritative Schema Projection

Unlike an ordinary cognitive Concept named:

```text
"Person"
```

this response comes from the active Schema Package.

---

# 66. `LIST PREDICATES`

Returns active Predicate definitions.

Recommended compact fields:

```text
predicate_ref
local_name
subject constraints
object constraints
cardinality
functional/exclusive hints
```

---

# 67. `DESCRIBE PREDICATE`

Recommended:

```text
DESCRIBE PREDICATE "timezone"
```

or exact ref.

---

# 68. Predicate Description

Recommended:

```text
predicate_ref
package/version/digest
description
subject kinds/types
object kinds/types
literal datatypes
cardinality
functional semantics
exclusive/conflict-set semantics
temporal semantics
inverse/symmetry/transitivity declarations if standardized
model hints
```

---

# 69. Predicate Description Does Not Declare Current Truth

It explains:

> What does this Predicate mean and how may it be used?

It does not answer:

> Which Propositions using it are accepted?

Use KQL/BELIEF for that.

---

# 70. `LIST FACETS`

Returns active Profile/Core Facet definitions.

---

# 71. `DESCRIBE FACET`

Recommended:

```text
DESCRIBE FACET "MnemonicState"
```

---

# 72. Facet Description

Should expose:

```text
exact facet ref
applicable Core kinds/types
fields
datatypes
defaults
mutability
maintenance-only fields
derived-only fields
authority sensitivity
model hints
```

---

# 73. Why Facet Mutability Matters to Agents

Before generating:

```prolog
UPDATE ?x
SET FACET "MnemonicState" {...}
```

the Agent needs to know which fields are legal to mutate.

META supplies that contract.

---

# 74. `LIST STRUCTURAL FIELDS`

Returns schema-defined record topology fields.

Examples:

```text
has_step
experienced_by
evidence
inputs
outputs
compiled_from
```

---

# 75. `DESCRIBE STRUCTURAL FIELD`

Recommended:

```text
DESCRIBE STRUCTURAL FIELD "has_step"
```

---

# 76. Structural Field Description

Should expose:

```text
exact field ref
source kinds/types
target kinds/types
cardinality
ordered/set semantics
edge metadata schema
required/optional
mutability
allowed cycle behavior
model hints
```

---

# 77. Structural Field Is Not Predicate

META must make the distinction explicit.

```text
has_step structural field
    ≠
semantic Proposition predicate
```

unless the Schema separately defines both.

---

# 78. `DESCRIBE COMPATIBILITY`

Recommended:

```text
DESCRIBE COMPATIBILITY
  FROM "package@2.0.0"
  TO "package@3.0.0"
```

---

# 79. Compatibility Result

May include:

```text
declared compatibility class
breaking changes
renames/aliases
migration descriptors
type/predicate mappings
data-review requirements
```

---

# 80. Compatibility Declaration Is Not Migration Proof

A Package saying:

```text
compatible
```

does not prove every application migration is safe.

META reports the declaration and validation status separately.

---

# 81. `DESCRIBE ERROR`

Recommended:

```text
DESCRIBE ERROR "ImmutableField"
```

The operand is a stable registry code (§87 of the Specification); KIP 2.0 defines no numeric error codes.

---

# 82. Error Description

Returns:

```text
category
meaning
typical cause
retryability
recommended recovery
related command
```

This supports Agent self-correction.

---

# 83. Error Hints Are Advisory

A hint cannot authorize a protected workaround.

Example:

```text
"Use Governance operation"
```

does not mean the caller has that permission.

---

# 84. SEARCH Is the Associative Grounding Primitive

KIP 2.0 preserves SEARCH as first-class META.

SEARCH answers:

> Which visible stored cognitive items are most relevant to this lexical/semantic probe?

It does not answer:

> Which claims are true?

---

# 85. SEARCH vs. KQL

```text
SEARCH
    fuzzy / indexed / associative

KQL FIND
    exact structured canonical query

BELIEF
    epistemic interpretation
```

---

# 86. Recommended SEARCH Syntax

Baseline:

```text
SEARCH <KIND> :term
  [WITH TYPE :type]
  [WITH PREDICATE :predicate]
  [MODE "keyword|semantic|hybrid"]
  [THRESHOLD :threshold]
  [AS OF SEQ :seq]
  [LIMIT :limit]
  [CURSOR :cursor]
```

`WITH PREDICATE` scopes Proposition search (§110); `AS OF SEQ` is the optional
historical-search capability (§126), not baseline.

---

# 87. Searchable Kinds

Recommended:

```text
CONCEPT
PROPOSITION
ASSERTION
EVIDENCE
ACTIVITY
COGNITION
```

where:

```text
COGNITION
```

searches multiple allowed cognitive kinds.

---

# 88. Why Expand Beyond Concept/Proposition

Real Agent recall may begin from:

```text
"a failed deployment last week"
"a message where Alice corrected me"
"that monitoring result"
"the skill about rollback"
```

which may ground best to:

```text
Experience Concept
Evidence
Assertion
Activity
```

not only a semantic Concept.

---

# 89. Default Search Surface

An implementation MAY default:

```text
SEARCH COGNITION
```

to a curated searchable set.

It MUST declare which kinds are indexed.

---

# 90. Search Does Not Index Everything Necessarily

For security/performance, a deployment may omit:

```text
raw Evidence payload
secret Facets
engine origin
large blobs
```

from searchable text/vector indexes.

---

# 91. SEARCH Modes

Required/optional modes:

```text
keyword
semantic
hybrid
```

---

# 92. `keyword`

Lexical index over authorized grounding fields.

This SHOULD be the minimum portable mode.

---

# 93. `semantic`

Semantic/vector retrieval.

Optional capability.

---

# 94. `hybrid`

Combines lexical and semantic signals.

Optional capability.

KIP does not mandate one hybrid-ranking formula.

---

# 95. Search Score

SEARCH returns a transient retrieval score.

Recommended response field:

```json
{
  "retrieval": {
    "score": 0.82,
    "score_semantics": "normalized_hybrid_relevance"
  }
}
```

---

# 96. Search Score Is Not Stored Metadata

KIP 2.0 SHOULD NOT expose search score as:

```text
element.metadata._score
```

because generic metadata no longer exists.

It belongs to the query result envelope.

---

# 97. Search Score Is Not Confidence

```text
retrieval.score
    ≠
Assertion.confidence
```

---

# 98. Search Score Is Not Belief

```text
high semantic similarity
    ≠
accepted belief
```

---

# 99. Search Score Is Not Trust

A highly relevant document may be untrusted.

---

# 100. Search Score Is Not Memory Strength

A rarely recalled memory may still be semantically relevant.

---

# 101. Score Semantics Must Be Named

If a runtime normalizes scores, response SHOULD identify:

```text
score_semantics
ranking_method/version
```

at least at a coarse level.

---

# 102. No Universal Cross-Engine Score Calibration

A:

```text
0.8
```

from one embedding/hybrid engine is not guaranteed equivalent to:

```text
0.8
```

from another.

Threshold portability is limited unless a conformance profile specifies calibration.

---

# 103. Search Result Shape

Recommended compact result:

```json
{
  "id": "concept-123",
  "kind": "concept",
  "schema_ref": "kip://.../Person",
  "name": "Alice Chen",
  "snippet": "...",

  "retrieval": {
    "score": 0.88,
    "mode": "hybrid",
    "matched_fields": ["name", "aliases"]
  }
}
```

---

# 104. Proposition Search Result

Should include:

```text
id
predicate_ref
compact subject label
compact object label/literal
retrieval score
```

without implying belief.

---

# 105. Assertion Search Result

May include safe:

```text
stance
mode
asserted_by label
asserted_at
Proposition summary
```

subject to Governance.

---

# 106. Evidence Search Result

May return:

```text
Evidence ID
class
safe snippet
observed_at
digest
```

but not hidden raw payload.

---

# 107. Activity Search Result

May return:

```text
Activity ID
class
status
time
safe input/output summary
```

subject to visibility.

---

# 108. Type-Scoped Search

Example:

```text
SEARCH CONCEPT "Alice"
WITH TYPE "Person"
LIMIT 10
```

Type alias resolves through current Schema Environment.

---

# 109. Exact Search Type Ref

For deterministic clients:

```text
WITH TYPE "kip://...@2.0.0/Person"
```

---

# 110. Predicate-Scoped Proposition Search

For `SEARCH PROPOSITION`, `WITH TYPE` MAY preserve v1 compatibility but native syntax SHOULD prefer:

```text
WITH PREDICATE :predicate_ref
```

to avoid overloading "type".

---

# 111. Search Filters Should Stay Small

SEARCH should not grow into a second KQL.

Useful narrowing may include:

```text
kind
type/schema_ref
predicate_ref
time window
profile class
```

Complex logical filters belong to KQL after grounding.

---

# 112. SEARCH Is Governance-Filtered Before Ranking

Unauthorized candidates MUST NOT participate in user-visible:

```text
ranking
scores
counts
snippets
pagination
```

unless a protected derived-search policy explicitly allows otherwise.

---

# 113. Hidden Candidate Must Not Push Visible Results Down

A naive ranking pipeline:

```text
rank all secret + public
then remove secret
```

can leak through rank positions.

Logical semantics require authorization before user-visible ranking behavior.

---

# 114. Search Index Freshness

Search may be eventually consistent.

Every SEARCH response SHOULD disclose freshness.

Recommended:

```json
{
  "context": {
    "space_id": "space-1",
    "search": {
      "index_seq": 1498,
      "current_space_seq": 1500,
      "consistency": "lagging",
      "mode": "hybrid"
    }
  }
}
```

where policy permits.

---

# 115. `index_seq`

Meaning:

> Highest Space commit sequence reflected by this search index/search partition for the query's relevant index view.

Exact multi-index semantics may require an index checkpoint descriptor.

---

# 116. Index Seq May Be Approximate by Backend

If a search backend cannot provide exact commit alignment, it MUST advertise:

```text
consistency = eventual_unsequenced
```

or equivalent.

Do not fabricate a sequence.

---

# 117. Search Miss Is Not Canonical Absence

If:

```text
SEARCH misses X
```

the Agent MUST NOT conclude:

```text
X does not exist.
```

Especially when:

```text
index_seq < current_space_seq.
```

---

# 118. Correctness-Sensitive Existence Check

Use canonical:

```text
KQL by ID/key/exact pattern
```

or Transaction uniqueness constraints.

---

# 119. Search Result Should Carry Exact IDs

Grounding output should provide:

```text
id
kind
exact schema_ref/predicate_ref
```

so the next KQL/KML command does not have to rely on names.

---

# 120. Search Pagination

SEARCH may use:

```text
LIMIT
CURSOR
```

---

# 121. Search Cursor Context

Cursor SHOULD bind:

```text
query
mode
filters
Principal visibility context
index checkpoint
ranking method/version
```

as needed.

---

# 122. Search Cursor Is Not KQL Snapshot Cursor

KQL cursor pins canonical cognitive snapshot.

SEARCH cursor pins an index/ranking traversal context.

These may have different consistency models.

---

# 123. Search Index Changes During Pagination

A search backend SHOULD keep one ranking checkpoint/cursor view if possible.

If not possible, it must disclose weaker pagination stability through capabilities.

---

# 124. Historical SEARCH

Baseline KIP 2.0 does not require:

```text
SEARCH ... AS OF SEQ
```

because historical vector/lexical indexing can be expensive and ambiguous.

---

# 125. Historical Grounding Workflow

Recommended:

```text
SEARCH current index
    ↓
resolve exact candidate IDs
    ↓
KQL AS OF historical snapshot
```

If identity/history ambiguity remains, use raw history/introspection.

---

# 126. Optional Historical Search

A runtime MAY advertise:

```text
historical_search
```

and support:

```text
SEARCH ... AS OF SEQ :seq
```

with a historically correct index/checkpoint.

---

# 127. Historical Search Must Not Pretend Current Index Is Historical

If a true historical index cannot be reconstructed:

```text
HistoricalSearchUnavailable
```

is preferable to silently searching present state.

---

# 128. Search Quarantine Semantics

Ordinary Recall SEARCH SHOULD exclude:

```text
quarantined Capsule staging
moderated-hidden imported content
```

unless the Principal has review/search authority for those scopes.

---

# 129. Search and Memory Strength

A runtime MAY combine memory strength into a Brain-specific recall rank.

If it does, it MUST distinguish:

```text
semantic relevance score
mnemonic boost
recency boost
```

or disclose a combined score method.

---

# 130. Portable SEARCH Baseline

For protocol portability, KIP should standardize the request/result meaning but not one embedding model.

Implementations may use different:

```text
index engines
embedding models
lexical analyzers
hybrid rankers
```

---

# 131. Capability Negotiation

KIP 2.0 needs one authoritative place for runtime feature discovery.

Recommended:

```text
DESCRIBE CAPABILITIES
```

---

# 132. Capability Layers

Response SHOULD separate:

```text
protocol support
runtime support
Space-specific support
effective Principal availability
limits
```

---

# 133. Capability Example

```json
{
  "protocol": {
    "kql": "2.0",
    "kml": "2.0",
    "meta": "2.0"
  },

  "supported": {
    "belief_projection": true,
    "historical_reads": true,
    "semantic_search": true,
    "atomic_transactions": true,
    "signed_capsules": true
  },

  "available": {
    "belief_projection": true,
    "historical_reads": true,
    "capsule_export": false
  },

  "limits": {
    "max_query_rows": 1000,
    "max_transaction_writes": 500,
    "max_capsule_bytes": 104857600
  }
}
```

---

# 134. `supported`

Means:

> This runtime/Space technically implements the capability.

---

# 135. `available`

Means:

> Under the current authenticated Principal and execution context, the capability can be requested at least in some permitted scope.

It is not necessarily unlimited authorization.

---

# 136. `available` Is Not a Grant Dump

A caller seeing:

```text
capsule_export = true
```

does not learn all exact export scopes/records.

Actual operation-level authorization still runs.

---

# 137. Capability Enumeration Itself Is Governed

A deployment may return coarse:

```text
"not available"
```

without saying whether:

```text
feature unsupported
or
caller unauthorized
```

when distinguishing them would leak security-sensitive configuration.

---

# 138. Capability Detail Levels

Recommended:

```text
public
effective
diagnostic
```

---

# 139. Public Capabilities

Safe implementation-level support.

Example:

```text
KQL 2.0
semantic search implemented
Capsule format 2.0
```

---

# 140. Effective Capabilities

Principal/Space-specific availability.

Requires authenticated context.

---

# 141. Diagnostic Capabilities

May expose:

```text
backend names
index checkpoint details
retention internals
proof suites
resource ceilings
```

and may require administrative/debug authority.

---

# 142. KQL Capabilities

Should include:

```text
assertion_patterns
evidence_patterns
activity_patterns
structural_patterns
belief_projection
belief_slot
historical_as_of
historical_by_time
raw_path_operators
projection_ledger
normalized_schema_view
max_path_hops
max_projection_count
```

---

# 143. KML Capabilities

Should include:

```text
mutate_block
forward_local_refs
create_concept
upsert_concept
ensure_proposition
create_evidence
create_assertion
create_activity
assert_sugar
facet_mutation
structural_mutation
assertion_retraction
assertion_supersession
evidence_correction
activity_transition
archive
tombstone
purge
set_retention
non_destructive_merge
dry_run
client_key
```

---

# 144. Transaction Capabilities

Should include:

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

# 145. Capsule Capabilities

Should include:

```text
capsule_format_versions
snapshot_export
delta_capsule
signed_capsule
embedded_schema
external_blobs
protected_envelope
preview_import
isolate_import
merge_import
restore_import
capsule_sets
max_capsule_size
supported_digest_algorithms
supported_proof_suites
```

---

# 146. Schema Capabilities

Should include:

```text
schema_packages
multi_version_schema
historical_schema_environment
validation_only_schema_loading
compatibility_introspection
package_signature_verification
normalized_schema_view
```

---

# 147. Search Capabilities

Should include:

```text
keyword_search
semantic_search
hybrid_search
historical_search
search_kinds
index_consistency
score_semantics
max_search_results
```

---

# 148. Capability Versioning

Capability names and result schemas SHOULD be namespaced/versioned or tied to META version.

Avoid unversioned vendor flags becoming accidental standard semantics.

---

# 149. Extension Capabilities

Vendor/Profile extensions may appear under:

```text
extensions
```

with globally/namespaced identities.

Unknown capability extensions can be ignored if non-critical.

---

# 150. Capability Negotiation Workflow

Recommended Agent startup:

```text
DESCRIBE PRIMER
        ↓
DESCRIBE CAPABILITIES if needed
        ↓
DESCRIBE exact Schema symbols needed
        ↓
SEARCH grounding
        ↓
KQL/KML
```

---

# 151. Do Not Ask for Every Capability Every Turn

The runtime/Agent may cache capabilities keyed by:

```text
runtime identity
Space
Principal/effective capability version
Schema Environment
```

and refresh when invalidated.

---

# 152. Effective Capability Version

A runtime MAY expose:

```text
capability_context_version
```

or Governance revision so clients can detect relevant changes.

---

# 153. Transaction Introspection

Transactions are the ordered history of Space state.

META should expose authorized transaction inspection.

Recommended:

```text
DESCRIBE TRANSACTION :tx_id
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
```

---

# 154. Transaction Lookup Purpose

Critical for:

```text
ambiguous network failure
audit
debugging
change provenance
idempotent retry
```

---

# 155. Transaction Statuses

Recommended:

```text
pending
committed
aborted
no_effect
unknown
```

A transport/runtime may expose additional transient states.

---

# 156. `unknown`

Means:

> The lookup service cannot establish a known retained transaction for this identifier.

It should not be conflated with:

```text
aborted.
```

---

# 157. Transaction Description

For authorized caller, may include:

```text
tx_id
status
space_id
snapshot_seq
space_seq
committed_at
transaction_class
request digest
result digest
Schema Environment identity
origin Principal summary
change summary
idempotency key/digest status
Governance decision/audit refs
```

subject to policy.

---

# 158. Transaction Request Body Is Not Always Returned

A transaction may contain:

```text
secret Evidence payload
sensitive KML
private policy operation
```

Therefore raw request/changes require appropriate read/audit authority.

---

# 159. Transaction Lookup After Ambiguous Failure

Correct Agent pattern:

```text
write request loses response
        ↓
DESCRIBE TRANSACTION by idempotency key
        ↓
if committed:
    use original receipt
if absent/unknown:
    retry same idempotency key according to policy
```

Do not create a fresh logical write automatically.

---

# 160. Receipt Verification

Recommended:

```text
VERIFY RECEIPT :receipt
```

for runtimes that issue cryptographically verifiable receipts.

---

# 161. Receipt Verification

May check:

```text
receipt digest
runtime signature/proof
tx_id binding
space_seq binding
result digest
```

It does not prove semantic correctness beyond what the runtime attested.

---

# 162. `DESCRIBE SNAPSHOT`

Recommended:

```text
DESCRIBE SNAPSHOT
DESCRIBE SNAPSHOT AS OF SEQ :seq
DESCRIBE SNAPSHOT AS OF TX :tx
```

---

# 163. Snapshot Description

May include:

```text
space_id
resolved snapshot_seq
commit time boundary
Schema Environment version
historical readability
retention boundary
checkpoint digest if available
```

---

# 164. Snapshot Does Not Materialize the Whole Brain

`DESCRIBE SNAPSHOT` describes a state coordinate.

It is not:

```text
EXPORT SPACE.
```

---

# 165. `SNAPSHOT TOKEN`

Recommended read-only runtime operation:

```text
SNAPSHOT
```

or:

```text
SNAPSHOT AS OF SEQ :seq
```

returns an opaque:

```text
snapshot_token
```

when supported.

---

# 166. Snapshot Token Purpose

Used for:

```text
multi-query consistent planning
audit
complex Recall
migration preview
Capsule export
```

---

# 167. Snapshot Token Is Opaque

Clients must not parse it for:

```text
permissions
Space IDs
expiry
```

even if implementation encoding appears readable.

---

# 168. Snapshot Token Is Not Authority

It pins a readable state coordinate.

Current Governance still controls each read.

---

# 169. Snapshot Token Expiry

Runtime should expose:

```text
expires_at
historical fallback availability
```

where safe.

---

# 170. Commit History Is Engine History

KQL graph records are not the same thing as Commit Records.

META/runtime owns engine-history inspection.

---

# 171. `HISTORY ELEMENT`

Recommended:

```text
HISTORY ELEMENT :element_id
  [FROM SEQ :from]
  [TO SEQ :to]
  [LIMIT :limit]
  [CURSOR :cursor]
```

---

# 172. Element History Purpose

Answers:

```text
When was this element created?
Which transactions changed it?
Which versions existed?
Was it tombstoned?
Which lifecycle transitions occurred?
```

---

# 173. HISTORY Does Not Return Every Historical Payload by Default

A compact history may return:

```text
version
tx_id
space_seq
operation class
changed field categories
```

Use:

```text
KQL AS OF
```

to reconstruct authorized historical content.

---

# 174. Why Separate HISTORY from KQL AS OF

```text
HISTORY
    explains transition chronology

KQL AS OF
    reconstructs cognitive content
```

This keeps engine logs separate from cognitive graph semantics.

---

# 175. History Visibility

`HISTORY ELEMENT secret-id` must not reveal existence to callers lacking discovery/history authority.

---

# 176. `HISTORY SPACE`

Optional privileged operation:

```text
HISTORY SPACE
  FROM SEQ :from
  TO SEQ :to
```

May summarize transactions without exposing every data detail.

---

# 177. History Summary

Possible rows:

```text
space_seq
tx_id
time
transaction_class
changed kind counts
Governance/schema/cognitive category
```

---

# 178. Audit Authority

Detailed history may require:

```text
read_audit
read_raw_origin
read_governance_history
```

depending on fields.

---

# 179. `CHANGES SINCE`

Change Stream belongs naturally in META/runtime read operations.

Recommended:

```text
CHANGES SINCE :cursor
  [LIMIT :limit]
```

or:

```text
CHANGES AFTER SEQ :seq
```

where supported.

---

# 180. Change Envelope

One committed state-changing transaction yields one logical envelope:

```json
{
  "space_id": "space-1",
  "space_seq": 912,
  "tx_id": "tx-123",
  "committed_at": "...",
  "transaction_class": "cognitive",
  "changes": [...]
}
```

---

# 181. Atomic Envelope Semantics

Consumers must treat all changes in one envelope as:

```text
one committed cognitive transition.
```

Do not process each record as an independent learning event.

---

# 182. Change Delivery May Be At-Least-Once

Consumers must deduplicate by:

```text
space_seq
tx_id
```

---

# 183. Change Replay Is Not New Experience

Receiving the same envelope twice MUST NOT cause:

```text
evidence_count += 2
memory_strength reinforcement twice
duplicate Experience formation
duplicate Assertion
```

---

# 184. Change Stream Cursor

Cursor is opaque and resumable within advertised retention.

---

# 185. Change Stream Retention

Capabilities SHOULD expose:

```text
change_stream_retention
earliest_available_seq
```

where permitted.

---

# 186. Missing Change Window

If cursor falls outside retention:

```text
ChangeCursorExpired
```

with a safe recovery hint such as:

```text
request Snapshot Capsule / rebuild from current snapshot.
```

---

# 187. Change Stream Is Governed Per Consumer

A privileged replication service may see more changes than an ordinary Agent.

Do not expose secret change counts to unauthorized consumers.

---

# 188. Governance Changes in Change Stream

Because one Space uses unified `space_seq`, the stream may include:

```text
cognitive
Governance
Schema
```

transaction classes.

The detailed payload is filtered by caller authority.

---

# 189. Schema Changes in History

A client can use:

```text
transaction history
+
DESCRIBE SCHEMA ENVIRONMENT AS OF SEQ
```

to reconstruct which semantic contract governed a historical write.

---

# 190. `VERIFY`

META 2.0 gives `VERIFY` a precise meaning:

> **Check integrity, cryptographic proof, or runtime-attestation consistency without deciding semantic truth or destination acceptability.**

---

# 191. VERIFY Is Not VALIDATE

```text
VERIFY
    Are the claimed bytes/proofs internally authentic or intact?

VALIDATE
    Is the object/command structurally/legal-semantically valid?

PREVIEW
    What would happen here, now, under this destination context?
```

---

# 192. VERIFY Is Not Trust

A signature can be cryptographically valid while the signer is untrusted.

---

# 193. VERIFY Is Not Truth

A perfectly signed Capsule may contain false Assertions.

---

# 194. VERIFY Targets

Recommended:

```text
VERIFY CAPSULE
VERIFY SCHEMA PACKAGE
VERIFY RECEIPT
VERIFY BLOB
VERIFY CHECKPOINT
```

depending on advertised capabilities.

---

# 195. Verification Result Dimensions

Recommended:

```text
integrity_valid
digest_algorithm
digest_valid
proofs[]
signer resolution
cryptographic validity
attestation scope
revocation status if checked
warnings
```

---

# 196. Signer Trust Must Be Separate

Optional result:

```json
{
  "proof": {
    "cryptographically_valid": true,
    "signer_identity": "resolved",
    "local_trust": "unknown"
  }
}
```

Never collapse into:

```text
verified = trustworthy.
```

---

# 197. Verification May Be Offline

Digest/signature verification MAY work without a live destination Space if all required key material/proofs are available.

Governance may still control access to the artifact bytes.

---

# 198. External Revocation Checking

If verification requires fetching external key/revocation state:

```text
network access
```

is a separate capability/policy.

META must not silently fetch arbitrary URLs.

---

# 199. `VALIDATE`

META `VALIDATE` means:

> **Check whether an object or command conforms to declared Core, Schema, protocol, and contextual constraints without committing mutation.**

---

# 200. Validation Targets

Recommended:

```text
VALIDATE KQL
VALIDATE KML
VALIDATE CAPSULE
VALIDATE SCHEMA PACKAGE
VALIDATE IMPORT PLAN
```

---

# 201. `VALIDATE KQL`

Checks:

```text
syntax
variable scope
field existence
Schema symbol resolution
type compatibility
bounded BELIEF targets
supported capabilities
resource-risk estimate
authorization feasibility where safe
```

without executing the query result.

---

# 202. KQL Validation Does Not Prove Result Exists

A valid query may return:

```text
zero rows.
```

Validation only says the query is legal.

---

# 203. `VALIDATE KML`

Checks:

```text
syntax
Schema resolution
mutability
reference legality
lifecycle state requirements
required permissions
resource estimate
precondition syntax
```

without committing.

---

# 204. Dynamic KML Validation

If run against current Space state, validation MAY additionally inspect:

```text
current versions
current lifecycle
current referenced elements
current authority
```

but it remains a preview-time observation.

---

# 205. Validation Is Not Reservation

Between:

```text
VALIDATE
```

and:

```text
commit
```

the world may change:

```text
version changes
Grant revoked
Schema blocked
reference created/deleted
```

Commit revalidates.

---

# 206. Validation Result Should Say Its Boundary

Recommended:

```json
{
  "valid": true,
  "checked_at_seq": 1500,
  "schema_environment_version": 17,
  "authorization_checked": true,
  "commit_guaranteed": false
}
```

---

# 207. `VALIDATE SCHEMA PACKAGE`

Checks:

```text
manifest shape
package identity/version
canonical digest
dependency declarations
symbol uniqueness
constraint consistency
migration descriptor syntax
non-executable restrictions
```

It does not activate the Package.

---

# 208. `VALIDATE CAPSULE`

Checks:

```text
format
canonicalization
digest
Schema dependencies
Core record structure
closure/reference integrity
resource limits
identity conflicts
Governance compatibility
procedural-risk classification
```

depending on requested validation depth.

---

# 209. Capsule Validation Can Load Embedded Schema Validation-Only

It must not:

```text
activate
install as trusted
set default
```

those packages.

---

# 210. Validation Does Not Trust Sender

A structurally valid Capsule can still be:

```text
malicious
false
irrelevant
unsafe
```

---

# 211. `PREVIEW`

META `PREVIEW` means:

> **Simulate the context-dependent effect of a possible operation without committing or reserving state.**

---

# 212. Preview Targets

Recommended:

```text
PREVIEW KML
PREVIEW IMPORT CAPSULE
```

`PREVIEW MERGE`, `PREVIEW PURGE`, and `PREVIEW SCHEMA MIGRATION` are reserved
preview targets: their operand syntax is not frozen in the KIP 2.0 META grammar,
so a 2.0 runtime MUST NOT accept them as baseline syntax.

Some may delegate to protected subsystem dry-run logic.

---

# 213. PREVIEW KML

May return:

```text
resolved local handles
existing vs new canonical Propositions
matched update count
predicted lifecycle transitions
required permissions
predicted classification
estimated write count
precondition state
warnings
```

No IDs need be permanently reserved.

---

# 214. Preview-Allocated IDs Are Not Durable

If preview shows hypothetical IDs, they must be clearly marked:

```text
temporary
```

or omitted.

Commit may allocate different local IDs unless protocol guarantees reservations.

Baseline makes no reservation guarantee.

---

# 215. `PREVIEW IMPORT CAPSULE`

This is the key read-only Capsule operation.

It evaluates:

```text
artifact verification
Schema resolution
identity mapping plan
canonical_id conflicts
Proposition canonicalization
Assertion/Evidence import mapping
Governance handling mapping
authority defaults
quarantine decisions
record-level accept/reject
resource estimate
required approvals
```

---

# 216. Import Preview Is Destination-Specific

The same Capsule may preview differently in:

```text
Space A
Space B
```

because:

```text
existing identities
Schema Environment
Governance
trust
authority
classification
```

differ.

---

# 217. Preview Does Not Import

No durable:

```text
Concept
Proposition
Assertion
Evidence
Activity
Import Mapping
```

is created.

---

# 218. Preview Does Not Activate Embedded Schema

At most:

```text
validation-only temporary resolution.
```

---

# 219. Preview Does Not Elevate Skill

An imported Skill preview may say:

```text
would import as candidate / inactive
```

It does not execute or activate it.

---

# 220. Preview Must Protect Hidden Destination Identity

Identity-resolution preview must not reveal:

```text
secret local Concept exists
```

to an importer lacking discovery authority.

It may return:

```text
mapping unavailable / requires privileged review
```

instead.

---

# 221. Preview Commit Race

After preview:

```text
identity could merge
Schema could change
Grant could revoke
target could be created
```

Therefore:

```text
preview_plan_digest
```

plus commit-time preconditions may reduce races, but preview never guarantees success.

---

# 222. Validation vs. Preview Example

Capsule C:

```text
VALIDATE CAPSULE C
    → structurally valid

PREVIEW IMPORT CAPSULE C INTO Space A
    → identity conflict, would quarantine

PREVIEW IMPORT CAPSULE C INTO Space B
    → no conflict, merge allowed
```

This distinction is intentional.

---

# 223. `DESCRIBE CAPSULE`

Recommended read-only artifact summary.

Returns:

```text
format/version
content digest
kind snapshot/delta
source Nexus/Space summary
source snapshot
record counts
Schema dependencies
closure/completeness
handling/classification
risk classes
proof summary
blob summary
```

---

# 224. DESCRIBE Does Not Verify Automatically Necessarily

A fast description may parse declared metadata without verifying every blob/signature.

Response must indicate:

```text
declared
vs.
verified
```

fields.

---

# 225. Safe Capsule Describe

For an untrusted huge artifact, implementation should enforce size/parser limits before deep description.

---

# 226. `VERIFY CAPSULE`

Performs:

```text
canonical content digest verification
proof/signature verification
embedded Package digest verification
inline/external blob digest verification when bytes available
source/checkpoint proof validation where supported
```

---

# 227. External Blob Verification

If blob bytes are not present:

```text
status = unavailable/not_checked
```

unless separately authorized fetch occurs.

Do not fetch automatically.

---

# 228. `EXPORT CAPSULE`

KIP 2.0 keeps export in META/read-only.

Recommended conceptual syntax:

```text
EXPORT CAPSULE ?target
WHERE {
  ...
}
[WITH {
  closure: "...",
  provenance_depth: ...,
  include_schema: true,
  include_blobs: false,
  proof_profile: "..."
}]
[AS OF SEQ :seq]
```

The operand names the selection root binding: every element bound to it by the `WHERE` block belongs to the export root set. It MAY instead be a parameter or string naming a single root element. `WITH` and `AS OF` are optional.

---

# 229. Export Uses KQL Selection

The selection is structured cognitive state under current Governance.

---

# 230. Export Is Snapshot-Consistent

All records come from one pinned:

```text
source snapshot_seq.
```

---

# 231. Export Is More Privileged Than Read

A Principal may be allowed:

```text
read
```

but denied:

```text
export.
```

META does not bypass this because export is read-only.

---

# 232. Export Governance Applies Before Serialization

Unauthorized records must not leak through:

```text
record count
ExternalRef
Schema hint
proof tree
selection diagnostic
```

unless policy permits a redacted existence signal.

---

# 233. Export Result

Recommended:

```text
Capsule artifact handle/bytes
content digest
source snapshot_seq
selection completeness
record counts
proof status
```

---

# 234. Artifact Handle

Transport may pass Capsules/Packages through:

```text
file/artifact handle
content-addressed ref
binary upload reference
```

rather than embedding huge JSON in META command text.

Exact API is transport-specific.

---

# 235. META Does Not Treat Artifact URL as Safe

A URL/string supplied as artifact reference is not automatically fetched.

External fetch needs separate capability/policy.

---

# 236. `DESCRIBE CAPSULE` on Artifact Handle

The runtime may parse an already-provided local artifact handle.

This remains read-only.

---

# 237. Schema Package Verification

Recommended:

```text
VERIFY SCHEMA PACKAGE :artifact
```

checks:

```text
canonical digest
signature/proof
package identity binding
```

---

# 238. Package Verification Does Not Activate

Even a signed Package remains:

```text
uninstalled/untrusted/inactive
```

until Governance schema management.

---

# 239. `VALIDATE IMPORT PLAN`

A destination may materialize an explicit preview plan:

```text
Capsule digest
target Space
identity mappings
record decisions
handling mappings
authority defaults
```

META can validate its consistency.

---

# 240. Import Plan Digest

Recommended:

```text
import_plan_digest
```

binds the planned interpretation.

Later import transaction can reference it plus fresh preconditions.

---

# 241. Import Plan Is Not Authorization Token

Possessing a valid plan does not bypass:

```text
current import permission
commit-time Governance
Schema state
identity state
```

---

# 242. META and Epistemic Projection

META should not duplicate KQL `BELIEF`.

However META can introspect projection machinery.

Recommended:

```text
DESCRIBE EPISTEMIC POLICY
DESCRIBE PROJECTION CAPABILITY
```

only where Governance permits.

---

# 243. `DESCRIBE EPISTEMIC POLICY`

May expose safe policy metadata:

```text
policy_id/version
purpose/risk vocabulary
supported statuses
score semantics
freshness behavior
historical handling
explanation levels
```

---

# 244. Trust Rules May Be Sensitive

Trust state introspection uses:

```text
DESCRIBE TRUST
DESCRIBE TRUST :signer
```

and is governed like other control-plane introspection.

Detailed:

```text
which sources are trusted
exact trust values
security rules
```

may require `manage_trust`/audit authority.

An ordinary Agent may receive only the usable contract.

---

# 245. Projection Contract vs. Trust Configuration

An Agent usually needs:

```text
what purpose/risk values are legal
what outputs mean
```

not:

```text
the entire private Trust Resolver.
```

META should keep those separate.

---

# 246. `LIST EPISTEMIC POLICIES`

Optional governed operation.

Returns only policies the Principal may discover/use.

---

# 247. META and Governance Introspection

META MAY provide safe effective-access inspection:

```text
DESCRIBE ACCESS
```

but must avoid becoming a full policy exfiltration surface.

---

# 248. `DESCRIBE ACCESS`

Recommended use:

> Why can/can't I perform this protocol operation?

The input list travels in the optional `WITH` object:

```text
DESCRIBE ACCESS
WITH {
  operation: "purge",
  resource_kind: "Concept",
  space: :space_id,
  purpose: "maintenance"
}
```

---

# 249. Access Result

May say:

```text
allowed
denied
requires approval
requires stronger authentication
requires ActorBinding
```

without exposing hidden policy internals.

---

# 250. Access Introspection Is Not Policy Evaluation Oracle for Secret Resources

A caller cannot enumerate guessed secret IDs through:

```text
DESCRIBE ACCESS WITH {resource: :guessed_id}
```

and infer which exist.

Existence-neutral behavior applies.

---

# 251. Effective Actor Binding Introspection

`DESCRIBE EXECUTION CONTEXT` may expose:

```text
current verified actor bindings
representation scopes
```

to help KML choose between:

```text
record_attributed_assertion
assert_as_actor
```

---

# 252. Binding Details Are Governance-Protected

Do not expose every Principal ↔ actor mapping to ordinary users.

---

# 253. META and Normalized Query/Command

Validation SHOULD return a normalized semantic form/digest where practical.

Example:

```text
"Person"
→ exact schema_ref

"timezone"
→ exact predicate_ref
```

---

# 254. Why Normalized Form Matters

It helps:

```text
debug ambiguity
transaction idempotency
audit
cross-language implementations
Agent self-correction
```

---

# 255. Normalized KML Is Not Executed

The Agent may choose to submit it later.

META validation itself remains read-only.

---

# 256. Normalized KQL

A validation response may expose:

```text
resolved predicates
resolved types
projection policy binding
historical snapshot binding
```

without executing result rows.

---

# 257. Query Plan Explanation

An optional diagnostic operation:

```text
DESCRIBE QUERY PLAN
```

or:

```text
VALIDATE KQL :query WITH {plan: true}
```

may expose database execution planning.

This is not required baseline. `DESCRIBE QUERY PLAN` is not part of the KIP 2.0
META grammar; only the `VALIDATE ... WITH {...}` option form is grammatical, and
both remain capability-gated diagnostics.

---

# 258. Query Plan Can Leak Infrastructure

Detailed:

```text
index names
partition topology
cardinality estimates
```

may be diagnostic-only.

---

# 259. Query Plan Is Not Epistemic Explanation

```text
query plan
    how the engine retrieves rows

Epistemic Ledger
    why the Brain reached a belief projection
```

Do not conflate them.

---

# 260. Resource Estimates

VALIDATE/PREVIEW MAY return coarse:

```text
estimated rows
estimated writes
estimated blob bytes
estimated projection count
estimated path expansion
```

---

# 261. Resource Estimate Is Advisory

Concurrent state/index changes can alter actual cost.

Do not make it a hard execution guarantee unless runtime explicitly supports reservations.

---

# 262. No META Reservation by Default

META validation/preview does not reserve:

```text
IDs
versions
capacity
permissions
Schema state
transaction slot
```

---

# 263. Dry Run Relationship

KML/Transaction runtime may expose:

```text
dry_run = true
```

META `PREVIEW KML` can be implemented using that facility.

Semantically:

```text
PREVIEW
    = read-only simulated mutation
```

---

# 264. Dry Run Must Not Increment Counters

A dry run must not:

```text
increment element version
create Change Envelope
consume client_key permanently
record cognitive Activity
reinforce memory
```

unless a separate security audit policy records the attempted operation.

---

# 265. Security Audit Exception

A high-security runtime MAY log:

```text
denied
previewed
high-risk attempted
```

administrative events.

That audit is separate from cognitive mutation.

---

# 266. META Historical Time

Some META operations may accept:

```text
AS OF SEQ
AS OF TX
AS OF TIME
```

when their object has historical meaning.

---

# 267. Good Historical META Targets

Examples:

```text
DESCRIBE SCHEMA ENVIRONMENT AS OF SEQ
DESCRIBE SNAPSHOT AS OF SEQ
HISTORY ELEMENT
HISTORY SPACE
```

---

# 268. Current Capabilities Are Usually Current

`DESCRIBE CAPABILITIES AS OF SEQ` is not baseline because:

```text
runtime support today
```

is not necessarily reconstructable as historical Space state.

---

# 269. Historical Governance vs. Current Authorization

As with KQL:

```text
historical state
```

can be reconstructed only if:

```text
current caller is authorized to inspect it now.
```

---

# 270. Historical META Cannot Bypass Current Security

A record that was public historically but is secret now remains protected under current access policy.

---

# 271. META Pagination

Collection operations use:

```text
LIMIT
CURSOR
```

where appropriate.

---

# 272. Governed Pagination

Cursor is bound to:

```text
operation
parameters
Space/context
Principal visibility
snapshot/index checkpoint
ordering
```

as relevant.

---

# 273. Cursor Is Opaque

Clients must not construct or edit cursors.

---

# 274. Cursor Revocation

A cursor does not preserve old access authority.

If the Principal loses permission:

```text
continuation may be denied/redacted.
```

---

# 275. LIST Snapshot Consistency

Canonical LIST operations over Schema/runtime state SHOULD identify the snapshot/environment against which the list was generated.

---

# 276. Search Cursor Consistency

SEARCH may bind an index checkpoint rather than canonical Space snapshot.

The result must expose its consistency class.

---

# 277. Change Cursor Consistency

CHANGES cursor binds commit-log position and retention.

It is neither KQL nor SEARCH cursor.

---

# 278. Cursor Types Are Not Interchangeable

A runtime should reject:

```text
KQL cursor used in SEARCH
SEARCH cursor used in CHANGES
```

with:

```text
CursorTypeMismatch
```

or equivalent.

---

# 279. META Error Categories

Recommended:

```text
InvalidSyntax
UnsupportedCapability

NotFoundOrNotVisible
NotAuthorized
RequiresApproval
RequiresStrongerAuthentication

SchemaSymbolNotFound
SchemaSymbolAmbiguous
SchemaPackageUnavailable
HistoricalSchemaUnavailable
ConstraintViolation

SearchModeUnsupported
SearchIndexUnavailable
CursorInvalidated
HistoricalSearchUnavailable

TransactionUnknown
HistoricalSnapshotUnavailable
ChangeCursorExpired
ChangeCursorInvalid

ArtifactParseError
DigestMismatch
ProofInvalid
SignerUnknown
BlobUnavailable
CapsuleValidationFailed
ImportPreviewConflict

ResourceExhausted
ExecutionTimeout
```

Every code above comes from the Core Error Registry (§87 of the Specification); META adds no private code namespace.

---

# 280. Error Response Should Preserve Security

Do not distinguish:

```text
secret thing exists but denied
```

from:

```text
thing absent
```

when that distinction leaks protected existence.

Use:

```text
NotFoundOrNotVisible
```

where appropriate.

---

# 281. Verification Errors vs. Validation Errors

Example:

```text
DigestMismatch
    verification failure

ConstraintViolation / CapsuleValidationFailed
    validation failure

ImportPreviewConflict
    destination preview failure
```

These must not be collapsed into generic:

```text
invalid.
```

---

# 282. Retryability Metadata

META errors SHOULD classify:

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

# 283. Agent Recovery Example

`SchemaSymbolAmbiguous`:

```text
DESCRIBE/LIST candidate symbols
choose exact ref
retry query
```

---

# 284. Agent Recovery Example

`SearchIndexUnavailable`:

```text
use keyword fallback
or
KQL exact grounding if possible
```

---

# 285. Agent Recovery Example

`ChangeCursorExpired`:

```text
obtain current Snapshot Capsule
rebuild mirror
resume from new checkpoint
```

---

# 286. Agent Recovery Example

`DigestMismatch`:

```text
reacquire artifact
do not import.
```

---

# 287. Agent Recovery Example

`TransactionUnknown` after network loss:

```text
retry same idempotency key according to transaction semantics
```

not a new logical write.

---

# 288. META Capability Conformance

Recommended conformance groups:

```text
META Core
META Schema
META Search
META Runtime History
META Capsule
META Verification
META Preview
META High Assurance
```

---

# 289. META Core Conformance

MUST support equivalent semantics for:

```text
DESCRIBE PRIMER
DESCRIBE PROTOCOL
DESCRIBE EXECUTION CONTEXT
DESCRIBE CAPABILITIES
basic LIST/Schema discovery
structured error hints
Governance-filtered introspection
```

---

# 290. META Schema Conformance

Adds:

```text
DESCRIBE SCHEMA ENVIRONMENT
PACKAGE
TYPE
PREDICATE
FACET
STRUCTURAL FIELD
COMPATIBILITY
historical Schema description where advertised
```

---

# 291. META Search Conformance

Adds:

```text
SEARCH CONCEPT
SEARCH PROPOSITION
keyword mode
retrieval result context
Governance-first ranking
index freshness declaration
```

Semantic/hybrid search may be higher capability levels.

---

# 292. META Runtime History Conformance

Adds:

```text
DESCRIBE TRANSACTION
DESCRIBE SNAPSHOT
HISTORY ELEMENT
CHANGES
transaction lookup
change retention
```

---

# 293. META Capsule Conformance

Adds:

```text
DESCRIBE CAPSULE
VERIFY CAPSULE
VALIDATE CAPSULE
PREVIEW IMPORT CAPSULE
EXPORT CAPSULE
```

according to supported Capsule profiles.

---

# 294. META Verification Conformance

Adds standardized verification dimensions for:

```text
Capsule
Schema Package
Receipt
Blob
Checkpoint
```

---

# 295. META Preview Conformance

Adds:

```text
PREVIEW KML
PREVIEW IMPORT CAPSULE
high-impact mutation dry-run
```

without mutation/reservation.

---

# 296. High-Assurance META

May require:

```text
signed receipts
historical Schema environment
auditable capability versions
index checkpoint identity
deterministic validation digest
proof-suite registry
existence-neutral errors
strict resource ceilings
```

---

# 297. Conformance Fixtures — Primer

Tests:

```text
Primer contains exact protocol versions
Primer distinguishes Principal from `$self`
Primer identifies Space/Schema context
Primer does not expose secret Domains
Primer includes raw Proposition != belief reminder
Primer digest changes when dynamic context materially changes
```

---

# 298. Conformance Fixtures — Schema

```text
DESCRIBE TYPE local alias returns exact ref
ambiguous alias fails
exact ref succeeds
Package digest returned
historical Schema Environment reconstructed
ordinary cognitive Concept named "Person" does not redefine result
```

---

# 299. Conformance Fixtures — Search

```text
high-score untrusted Assertion is still only a search hit
SEARCH score never appears as Assertion confidence
hidden Evidence never affects visible ranking
search miss with lagging index not reported as canonical absence
result returns exact IDs
semantic search unsupported → capability/error
```

---

# 300. Conformance Fixtures — Capability

```text
runtime supports purge but caller unavailable
supported=true
available=false/coarsened

caller loses permission
effective capability refresh changes

hidden Space not enumerated through capability detail
```

---

# 301. Conformance Fixtures — Transaction

```text
committed tx lookup returns original receipt
aborted tx distinguishable from committed
unknown tx not treated as aborted
idempotency-key lookup resolves committed network-lost write
secret transaction payload redacted from ordinary caller
```

---

# 302. Conformance Fixtures — History

```text
element version history ordered by space_seq
KQL AS OF reconstructs content
HISTORY explains transitions

historical public-now-secret record remains hidden
```

---

# 303. Conformance Fixtures — Change Stream

```text
one transaction with five writes
→ one Change Envelope

same envelope delivered twice
→ consumer can dedupe

expired cursor
→ explicit recovery error
```

---

# 304. Conformance Fixtures — Verify/Validate/Preview

```text
valid signature + structurally invalid Capsule
VERIFY succeeds
VALIDATE fails

valid Capsule + identity conflict in target
VALIDATE structural succeeds
PREVIEW IMPORT reports conflict

valid Package signature
does not activate Package

preview KML
does not increment versions
does not reserve client_key
does not create Change Envelope
```

---

# 305. Conformance Fixtures — Governance

```text
DESCRIBE hidden ID → not_found-equivalent

SEARCH secret Evidence
→ no hit/count/rank leak

PREVIEW import against hidden local Concept
→ no identity existence leak to unauthorized importer

DESCRIBE ACCESS guessed secret resource
→ existence-neutral response
```

---

# 306. KIP 1.x Compatibility

META 2.0 intentionally preserves the spirit and much of the syntax of v1.

---

# 307. v1 `DESCRIBE PRIMER`

Preserved.

But the v2 Primer additionally separates:

```text
Principal
semantic `$self`
Space
Schema Environment
capabilities
cognitive invariants
```

rather than treating identity as one undifferentiated layer.

---

# 308. v1 `DESCRIBE DOMAINS`

Served by the Domain / Topic Map layer of `DESCRIBE PRIMER` (§31); there is
no separate native command. A compatibility adapter maps the v1 spelling to
that layer, as it maps `DESCRIBE CONCEPT TYPES` to `LIST TYPES` (§310).

In v2 the map is explicitly:

```text
semantic/navigation state
```

not authoritative Schema or Governance.

---

# 309. v1 Concept Types / Proposition Types

v1:

```text
$ConceptType
$PropositionType
```

are self-describing graph Concepts.

v2 authoritative introspection instead reads:

```text
Schema Package definitions
```

and returns a cognitive/model-friendly view.

---

# 310. Legacy Type Listing

Compatibility command:

```text
DESCRIBE CONCEPT TYPES
```

may map to:

```text
LIST TYPES
```

---

# 311. Legacy Proposition Type Listing

Compatibility:

```text
DESCRIBE PROPOSITION TYPES
```

may map to:

```text
LIST PREDICATES
```

---

# 312. Legacy `SEARCH CONCEPT`

Preserved almost directly.

Native v2 response moves retrieval score out of generic metadata into:

```text
retrieval
```

response context.

---

# 313. Legacy `SEARCH PROPOSITION`

Preserved as raw semantic grounding.

It must not imply the matched Proposition is accepted belief.

---

# 314. Legacy SEARCH `WITH TYPE`

Accepted in compatibility mode.

Native v2 may prefer:

```text
WITH TYPE
WITH PREDICATE
```

depending on searched kind.

---

# 315. Legacy SEARCH Score

v1 `_score` semantics survive conceptually:

```text
transient retrieval relevance
```

but no longer live in universal metadata namespace.

---

# 316. Legacy `EXPORT`

v1 EXPORT returns an idempotent KML UPSERT script.

Native v2:

```text
EXPORT CAPSULE
```

returns a canonical Cognitive Capsule artifact.

---

# 317. Why Native Export Must Change

KIP 2.0 portability requires:

```text
Assertion
Evidence
Activity
exact Schema dependencies
source snapshot
origin receipts
handling
digest
proofs
```

which cannot be represented safely as only a generic UPSERT script.

---

# 318. Legacy EXPORT Compatibility

A v2 runtime may still expose:

```text
EXPORT LEGACY KIP1
```

for migration/interoperability.

It should be clearly marked lower-fidelity.

---

# 319. v1 Readonly Tool Boundary

The strong v1 idea of a dedicated:

```text
execute_kip_readonly
```

should continue conceptually.

KIP 2.0 read-only endpoint should permit:

```text
KQL
META
Capsule describe/verify/validate/export
dry-run/preview
```

subject to authority.

---

# 320. Readonly Endpoint Must Reject Mutation

Even if a string contains valid KML, the readonly endpoint rejects commit-capable operations.

---

# 321. Preview on Readonly Endpoint

A KML preview/dry-run may be allowed because it has no durable mutation.

The runtime must guarantee:

```text
no reservation
no client-key consumption
no version changes
no cognitive side effects
```

---

# 322. v1 Workflow Evolution

Original flow:

```text
Explore & Ground META
    ↓
Generate KQL/KML
    ↓
Execute
    ↓
Solidify
```

v2 becomes:

```text
Prime / Negotiate
        ↓
Explore / Ground
        ↓
Structured Query / Belief Projection
        ↓
Reason / Decide
        ↓
Validate / Preview when needed
        ↓
Cognitive Mutation Transaction
        ↓
Receipt / History
```

---

# 323. Recommended Agent Startup Workflow

```text
1. DESCRIBE PRIMER

2. If needed:
   DESCRIBE CAPABILITIES

3. If schema unclear:
   DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD

4. If entity unclear:
   SEARCH

5. Query:
   KQL FIND / BELIEF

6. If writing:
   VALIDATE/PREVIEW KML for risky operations
   then KML/Transaction

7. If outcome ambiguous:
   DESCRIBE TRANSACTION / receipt lookup

8. If sharing:
   EXPORT/DESCRIBE/VERIFY/VALIDATE/PREVIEW CAPSULE
```

---

# 324. Minimal Model Primer for META

```text
META is read-only introspection/grounding.

Use:
  DESCRIBE PRIMER
  DESCRIBE CAPABILITIES
  DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD
  SEARCH
  DESCRIBE TRANSACTION
  HISTORY / CHANGES
  VERIFY
  VALIDATE
  PREVIEW
  EXPORT CAPSULE

Remember:
  supported != authorized
  SEARCH score != confidence
  search miss != absence
  VERIFY != trust
  VERIFY != VALIDATE
  VALIDATE != PREVIEW
  PREVIEW != commit
  historical inspection obeys current Governance
```

---

# 325. Common Pattern — Ground a Person

```text
SEARCH CONCEPT "Alice Chen"
WITH TYPE "Person"
MODE "hybrid"
THRESHOLD 0.7
LIMIT 10
```

Then use the returned exact ID in KQL.

---

# 326. Common Pattern — Understand a Predicate

```text
DESCRIBE PREDICATE "timezone"
```

Then use returned exact `predicate_ref`.

---

# 327. Common Pattern — Determine Query Capability

```text
DESCRIBE CAPABILITIES
```

Check:

```text
belief_slot
historical_reads
projection_ledger
```

before generating advanced KQL.

---

# 328. Common Pattern — Safe KML Before High-Impact Mutation

```text
PREVIEW KML :command
```

Inspect:

```text
resolved schema
matched targets
required authority
predicted writes
warnings
```

Then submit guarded mutation if appropriate.

---

# 329. Common Pattern — Recover Lost Write Response

```text
DESCRIBE TRANSACTION
BY IDEMPOTENCY KEY :key
```

If committed:

```text
reuse Receipt
```

Do not recreate the event.

---

# 330. Common Pattern — Audit Belief Correction

```text
HISTORY ELEMENT :old_assertion
```

Then:

```text
KQL AS OF old seq
KQL current
```

to compare historical vs. current cognitive state.

---

# 331. Common Pattern — Replication Consumer

```text
CHANGES SINCE :cursor
LIMIT 100
```

Process each envelope atomically and deduplicate by:

```text
tx_id / space_seq.
```

---

# 332. Common Pattern — Inspect Capsule

```text
DESCRIBE CAPSULE :artifact
VERIFY CAPSULE :artifact
VALIDATE CAPSULE :artifact
PREVIEW IMPORT CAPSULE :artifact INTO :space
```

Each stage answers a different question.

---

# 333. Common Pattern — Export a Memory Bundle

```text
EXPORT CAPSULE ?exp
WHERE {
  ?exp {id: :experience_id}
}
WITH {
  closure: "referential",
  provenance_depth: 3,
  include_schema: true
}
```

The output records one source snapshot.

---

# 334. Common Anti-Pattern — Search as Truth

Bad:

```text
top SEARCH result
→ answer as fact.
```

Correct:

```text
SEARCH
→ ground exact record/entity
→ BELIEF / KQL
→ answer.
```

---

# 335. Common Anti-Pattern — Search Miss as Nonexistence

Bad:

```text
SEARCH returns none
→ memory absent.
```

Correct:

```text
check index freshness
use exact KQL when correctness matters.
```

---

# 336. Common Anti-Pattern — Valid Signature as Truth

Bad:

```text
VERIFY CAPSULE succeeds
→ believe all Assertions.
```

Correct:

```text
verify integrity
validate structure
import under local Governance
project belief under local Epistemic Policy.
```

---

# 337. Common Anti-Pattern — Valid Schema as Active Schema

Bad:

```text
VERIFY/VALIDATE Package
→ use it as active.
```

Correct:

```text
Schema activation requires manage_schema.
```

---

# 338. Common Anti-Pattern — Preview as Commit Promise

Bad:

```text
PREVIEW says allowed
→ assume future commit cannot fail.
```

Correct:

```text
commit revalidates current state/authority.
```

---

# 339. Common Anti-Pattern — Capabilities as Permissions

Bad:

```text
purge supported
→ caller may purge.
```

Correct:

```text
supported = implementation
available = effective coarse access
actual operation still authorizes exact target.
```

---

# 340. Common Anti-Pattern — Historical ACL Bypass

Bad:

```text
DESCRIBE SNAPSHOT before secret classification
→ reveal old bytes.
```

Correct:

```text
current Governance controls historical visibility.
```

---

# 341. Common Anti-Pattern — Domain as Authority

Bad:

```text
Primer Domain/Topic Map says Public
→ bypass Governance.
```

Correct:

```text
Domain is semantic navigation unless protected policy explicitly says otherwise.
```

---

# 342. Common Anti-Pattern — Detailed Access Oracle

Bad:

```text
loop DESCRIBE ACCESS over guessed IDs
→ enumerate secrets.
```

Correct:

```text
existence-neutral authorization introspection.
```

---

# 343. META Core Invariants

The following are normative design targets.

1. META is read-only at the cognitive/protocol semantic level.
2. Read-only META remains Governance-controlled.
3. Introspection itself is treated as a possible information leak.
4. META does not grant authority.
5. Runtime support and Principal authorization are distinct.
6. `supported` does not mean `allowed`.
7. `available` is a coarse effective capability, not unlimited Grant scope.
8. Capability enumeration may itself be redacted/coarsened.
9. `DESCRIBE PRIMER` remains compact/model-oriented.
10. Primer is not a memory dump.
11. Primer distinguishes authenticated Principal from semantic `$self`.
12. Primer exposes Schema coordinates rather than relying on prompt folklore.
13. Primer Domain/Topic Map is semantic navigation, not Governance.
14. Primer SHOULD include critical v2 cognitive safety invariants.
15. Dynamic Primer state identifies its relevant versions/snapshot.
16. Authoritative Schema introspection reads immutable Package state.
17. Ordinary cognitive graph nodes cannot redefine Schema introspection.
18. Schema aliases always resolve to exact canonical refs in responses.
19. Ambiguous Schema symbols fail rather than guess.
20. Package signature validity is separate from Package trust/activation.
21. Type/Predicate/Facet/Structural Field introspection exposes mutability/constraints needed for KQL/KML.
22. Structural Fields are never silently represented as semantic Predicates.
23. SEARCH remains associative grounding, not canonical KQL.
24. SEARCH may be eventually consistent.
25. SEARCH returns/declares index freshness or consistency class.
26. SEARCH miss does not prove absence.
27. SEARCH score is transient retrieval relevance.
28. SEARCH score is not Assertion confidence.
29. SEARCH score is not Epistemic belief.
30. SEARCH score is not Trust.
31. SEARCH score is not memory strength.
32. SEARCH ranking applies Governance before user-visible rank/score effects.
33. Hidden candidates do not leak through ranks/counts/snippets.
34. SEARCH returns exact IDs/schema refs for subsequent structured use.
35. Complex logical filtering belongs to KQL, not SEARCH.
36. Historical SEARCH is optional and must be genuinely historical if supported.
37. Current index must never masquerade as historical index.
38. `DESCRIBE CAPABILITIES` is the negotiation surface for KIP feature support.
39. Capabilities include limits as well as booleans.
40. Extension capabilities are namespaced/version-aware.
41. Transaction lookup is read-only META/runtime introspection.
42. `unknown` transaction outcome is not the same as `aborted`.
43. Ambiguous write recovery uses transaction/idempotency lookup.
44. Commit Records remain immutable engine history.
45. HISTORY explains transitions; KQL AS OF reconstructs content.
46. Current Governance controls historical META visibility.
47. Historical queries cannot bypass current secrecy.
48. Change Stream preserves transaction envelope boundaries.
49. Change Stream may be at-least-once.
50. Change replay is not new cognition.
51. Consumers deduplicate Change Envelopes by tx_id/space_seq.
52. Change Stream cursor is distinct from KQL/SEARCH cursor.
53. Cursor types are not interchangeable.
54. Snapshot token is a coordinate, not authority.
55. Snapshot token is opaque.
56. VERIFY means integrity/proof verification, not trust.
57. VERIFY does not establish semantic truth.
58. VALIDATE means structural/protocol/Schema legality, not truth.
59. VALIDATE does not reserve state.
60. VALIDATE does not guarantee future commit.
61. PREVIEW means destination/context simulation, not mutation.
62. PREVIEW does not reserve IDs/client_keys/versions by default.
63. PREVIEW does not create Change Envelopes.
64. PREVIEW does not activate Schema.
65. PREVIEW does not elevate authority.
66. Validation-only Schema loading does not activate packages.
67. Capsule description distinguishes declared vs. verified fields.
68. Capsule verification does not trigger automatic external network fetch.
69. Capsule validation does not trust sender.
70. Capsule import preview is destination-specific.
71. Capsule import preview protects hidden local identities.
72. EXPORT CAPSULE is read/export but may require stronger authority than read.
73. Export is snapshot-consistent.
74. Export Governance filters before serialization and counts.
75. Native Capsule is an artifact, not executable KML.
76. Schema Package verification does not install/activate Package.
77. Import Plan is not an authorization token.
78. META may expose projection contracts without exposing private Trust Resolver internals.
79. Access introspection must not become a secret-resource existence oracle.
80. Principal↔actor binding details are Governance-protected.
81. Normalized command/query forms are useful for audit but not execution by themselves.
82. Query-plan explanation is not Epistemic explanation.
83. Resource estimates are advisory unless explicitly reserved.
84. Dry-run/preview does not mutate cognitive state.
85. Security audit of previews/denials is separate from cognitive mutation.
86. META collection pagination obeys current Governance.
87. Cursors do not preserve revoked authority.
88. META errors should distinguish verification, validation, and preview failure classes.
89. Existence-sensitive errors may use not-found-equivalent responses.
90. Error hints support Agent self-correction without granting authority.
91. KIP 1.x DESCRIBE/SEARCH concepts remain recognizable.
92. KIP 1.x `_score` becomes response-level retrieval context.
93. KIP 1.x graph-defined schema becomes Package-backed introspection.
94. KIP 1.x EXPORT becomes native Cognitive Capsule export.
95. Legacy export remains optional compatibility, not native portability semantics.
96. A dedicated read-only execution path SHOULD remain available.
97. Read-only execution must reject commit-capable KML.
98. META should reduce hallucinated protocol use by exposing exact semantic coordinates.
99. META should make runtime uncertainty explicit rather than silently guess.
100. A self-describing Brain must describe its boundaries as clearly as its contents.

---

# 344. Formal Command Sketch

Non-normative:

```text
meta_statement :=
      describe_statement
    | list_statement
    | search_statement
    | verify_statement
    | validate_statement
    | preview_statement
    | history_statement
    | changes_statement
    | snapshot_statement
    | export_capsule_statement

describe_statement :=
    "DESCRIBE" describe_target describe_args?

describe_target :=
      "PRIMER"
    | "PROTOCOL"
    | "EXECUTION CONTEXT"
    | "CAPABILITIES"
    | "SPACE"
    | "SCHEMA ENVIRONMENT"
    | "PACKAGE"
    | "TYPE"
    | "PREDICATE"
    | "FACET"
    | "STRUCTURAL FIELD"
    | "COMPATIBILITY"
    | "ERROR"
    | "TRANSACTION"
    | "SNAPSHOT"
    | "EPISTEMIC POLICY"
    | "PROJECTION CAPABILITY"
    | "TRUST"
    | "ACCESS"
    | "CAPSULE"

list_statement :=
    "LIST" list_target list_options?

list_target :=
      "SPACES"
    | "SCHEMA PACKAGES"
    | "TYPES"
    | "PREDICATES"
    | "FACETS"
    | "STRUCTURAL FIELDS"
    | "EPISTEMIC POLICIES"
    | "DEPENDENTS"
        (* LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c],
           Spec §63.5: bounded reverse provenance closure through
           Activity inputs → outputs *)

search_statement :=
    "SEARCH" search_kind value
    search_options?

search_kind :=
      "CONCEPT"
    | "PROPOSITION"
    | "ASSERTION"
    | "EVIDENCE"
    | "ACTIVITY"
    | "COGNITION"

verify_statement :=
    "VERIFY" verify_target artifact_ref

verify_target :=
      "CAPSULE"
    | "SCHEMA PACKAGE"
    | "RECEIPT"
    | "BLOB"
    | "CHECKPOINT"

validate_statement :=
    "VALIDATE" validate_target validation_input

validate_target :=
      "KQL"
    | "KML"
    | "CAPSULE"
    | "SCHEMA PACKAGE"
    | "IMPORT PLAN"

preview_statement :=
    "PREVIEW" preview_target preview_input

preview_target :=
      "KML"
    | "IMPORT CAPSULE"
    (* reserved, not 2.0 syntax: "MERGE" | "PURGE" | "SCHEMA MIGRATION" *)

history_statement :=
      "HISTORY ELEMENT" element_ref history_options?
    | "HISTORY SPACE" history_options?

changes_statement :=
    "CHANGES" changes_position changes_options?

snapshot_statement :=
    "SNAPSHOT" snapshot_selector?

export_capsule_statement :=
    "EXPORT CAPSULE" selection
    export_options?
```

Exact artifact/request parameter syntax remains transport-dependent.

---

# 345. Recommended Response Semantics

All META responses SHOULD make uncertain dimensions explicit.

Prefer:

```json
{
  "verified": true,
  "trusted": "unknown",
  "validated": false,
  "reason": "missing schema dependency"
}
```

over:

```json
{
  "ok": true
}
```

when multiple meanings exist.

---

# 346. Five Distinct Questions

KIP 2.0 should force the following questions apart:

```text
1. Can I parse/find it?
2. Can I cryptographically verify it?
3. Is it structurally valid?
4. Would it be accepted here?
5. Did it actually commit?
```

Mapped to:

```text
DESCRIBE / SEARCH
VERIFY
VALIDATE
PREVIEW
TRANSACTION RECEIPT
```

---

# 347. META and Agent Hallucination

Many Agent protocol failures are not reasoning failures.

They are coordinate failures:

```text
invented field
wrong type
wrong predicate
wrong Space
wrong ID
wrong actor
unsupported capability
stale search result
unavailable history
```

META exists to turn those hidden assumptions into inspectable state.

---

# 348. META and Cognitive Humility

A good Brain should be able to say:

```text
I don't know what this type means.
I cannot resolve that alias.
My search index is behind by two commits.
I cannot see that history.
This signature is valid but the signer is untrusted.
This Capsule is valid but conflicts with local identity.
This preview succeeded but commit is not guaranteed.
This transaction outcome is unknown.
```

These are protocol-level expressions of uncertainty, not failure.

---

# 349. Relationship to KQL

KQL consumes META output:

```text
SEARCH result ID
exact Schema ref
snapshot
capability
```

to form correct structured queries.

META does not replace:

```text
FIND
BELIEF
BELIEF SLOT
AS OF
```

---

# 350. Relationship to KML

KML consumes META output:

```text
exact schema
field mutability
Structural Field definition
actor binding summary
effective capability
version/precondition state
preview result
```

to form safe mutations.

---

# 351. Relationship to Epistemic Model

META can introspect:

```text
Projection capability
policy contract
explanation levels
```

but Epistemic Projection itself remains KQL/BELIEF.

---

# 352. Relationship to Governance

META is subject to:

```text
discover
read
search
project
audit
history
export
```

and specialized governance visibility.

It cannot mutate authority.

---

# 353. Relationship to Schema Packages

META is the primary model-facing projection of immutable Schema Packages.

```text
Package Artifact
    ↓
META DESCRIBE
    ↓
LLM-readable schema contract
```

---

# 354. Relationship to Transactions

META exposes:

```text
snapshot coordinate
Transaction status
Receipt
Commit history
Change Stream
```

while Transaction Runtime owns atomicity.

---

# 355. Relationship to Capsule

META owns the read-side Capsule lifecycle:

```text
EXPORT
DESCRIBE
VERIFY
VALIDATE
PREVIEW
```

Mutation-side import remains protected.

---

# 356. Relationship to Anda Brain

Anda Brain can use META as the **orientation reflex** of cognition:

```text
wake
    ↓
understand current Brain context
    ↓
ground entities/schema
    ↓
recall
    ↓
act/learn
    ↓
inspect receipts/history
```

---

# 357. META as the Brain's "Proprioception"

A useful analogy:

```text
KQL
    perception of remembered content

KML
    controlled modification of memory

META
    proprioception of the memory system itself
```

META tells the Agent:

```text
where it is
what semantic coordinate system it is using
what interfaces are available
how fresh its retrieval substrate is
what historical coordinate it is inspecting
```

---

# 358. Final Architecture

```text
                        Agent
                          │
                          ▼
                  DESCRIBE PRIMER
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
      Protocol/Schema   Context     Capabilities
            │             │             │
            └─────────────┼─────────────┘
                          ▼
                        SEARCH
                   associative grounding
                          │
                          ▼
                   exact IDs / refs
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
             KQL                     KML
        read / BELIEF             mutation intent
              │                       │
              │                   VALIDATE /
              │                    PREVIEW
              │                       │
              └───────────┬───────────┘
                          ▼
                  Cognitive Nexus
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
         Snapshot     Transaction    Capsule
             │            │            │
             ▼            ▼            ▼
         DESCRIBE       HISTORY      DESCRIBE
         SNAPSHOT       CHANGES      VERIFY
                        RECEIPT      VALIDATE
                                     PREVIEW
```

---

# 359. Core META Equations

```text
DESCRIBE
    =
    Understand Coordinates
```

```text
SEARCH
    =
    Ground by Relevance
```

```text
VERIFY
    =
    Check Integrity / Proof
```

```text
VALIDATE
    =
    Check Legality / Structure
```

```text
PREVIEW
    =
    Simulate Local Effect
```

```text
RECEIPT
    =
    Establish Committed Outcome
```

---

```text
Supported
    ≠
Authorized
```

---

```text
Search Match
    ≠
Fact
```

---

```text
Search Miss
    ≠
Absence
```

---

```text
Valid Signature
    ≠
Trusted Source
```

---

```text
Valid Artifact
    ≠
Safe Import
```

---

```text
Successful Preview
    ≠
Successful Future Commit
```

---

```text
Historical State
    ≠
Historical Access Authority
```

---

# 360. Final Principle

A persistent Agent Brain cannot rely on the model to remember every protocol rule, every active Schema version, every capability, every identity binding, every historical retention boundary, or every implementation limit.

Those things are part of the environment.

The environment must be inspectable.

A mature Cognitive Nexus should let an Agent ask, before acting:

> Who am I authenticated as?

> Which Brain/Space am I operating in?

> Which semantic actor may I represent?

> Which KIP/KQL/KML/META versions are active?

> What can this runtime technically do?

> What can I actually use here?

> Which exact Schema Packages define my semantic vocabulary?

> What does this Type, Predicate, Facet, or Structural Field mean?

> Is the local name I am about to use ambiguous?

> Which "Alice" is this natural-language request probably referring to?

> How fresh is the search index that gave me this result?

> Am I looking at a canonical record or only an associative hit?

> Which cognitive snapshot am I reading?

> What transaction actually committed my previous write?

> Did the network failure happen before or after commit?

> Which transactions changed this memory?

> Can I resume the Change Stream safely?

> Is this Capsule merely parseable, cryptographically verified, structurally valid, or actually safe to import here?

> Will an import merge identities, create duplicates, quarantine a Skill, or require approval?

> Is this Schema Package signed, valid, trusted, active, or merely available?

> Can a preview fail later because authority or state changed?

> Is an apparent absence actually unknown because I lack discovery authority or the index is stale?

These answers should not live only in documentation or system prompts.

They should be queryable from the Nexus itself.

The governing idea is:

> **A truly self-describing Brain does not only expose what it knows; it exposes the coordinates, capabilities, provenance, limits, and uncertainty required to know how to use what it knows.**

META 2.0 is that self-description layer.
