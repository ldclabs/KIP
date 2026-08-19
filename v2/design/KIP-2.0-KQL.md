# KIP 2.0 KQL — Cognitive Query Language

**[English](./KIP-2.0-KQL.md) | [中文](./KIP-2.0-KQL_CN.md)**

## Status

**Query Language Proposal / Pre-Specification Draft**

This document defines the read/query semantics of KIP 2.0: how an Agent retrieves raw cognitive state, traverses semantic and provenance structure, requests epistemic belief projections, queries historical cognitive snapshots, filters and aggregates visible state, and receives reproducible governed results.

It builds directly on:

- [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)
- [KIP-2.0-Schema-Packages.md](KIP-2.0-Schema-Packages.md)
- [KIP-2.0-Transactions.md](KIP-2.0-Transactions.md)
- [KIP-2.0-Capsule.md](KIP-2.0-Capsule.md)

KIP 1.x already established an LLM-friendly declarative query language around:

```text
FIND
WHERE
Concept patterns
Proposition patterns
FILTER
NOT
OPTIONAL
UNION
predicate variables
path operators
aggregation
ORDER BY
LIMIT
CURSOR
```

KIP 2.0 preserves that successful surface wherever the underlying semantics remain valid.

The major change is that KIP 2.0 no longer equates:

```text
Proposition exists
```

with:

```text
Proposition is believed / true.
```

Therefore KQL 2.0 exposes two fundamentally different read primitives:

```text
RAW COGNITIVE QUERY
    What cognitive records exist in the visible Nexus state?

EPISTEMIC QUERY
    Given policy/context/evidence, what should the Brain currently
    treat as accepted, rejected, contested, uncertain, or insufficient?
```

and a third orthogonal dimension:

```text
HISTORICAL QUERY
    What cognitive state existed at a particular cognitive time?
```

Its central principle is:

> **KQL must let an Agent inspect what the Brain stores without accidentally turning stored statements into beliefs, and inspect what the Brain believes without hiding the evidence, policy, time, and uncertainty that make that belief contextual.**

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** indicate requirements of the KIP 2.0 Specification (`../KIP-2.0-SPECIFICATION.md`), which is authoritative where the two differ.

The grammar shown here is an architecture-level grammar proposal.

A later formal grammar specification may refine punctuation without changing the semantic distinctions.

---

# 1. Design Goals

KQL 2.0 SHOULD remain:

```text
Model-First
declarative
graph-native
compact
schema-aware
governed
epistemically explicit
historically reproducible
pagination-safe
implementation-independent
```

An LLM should be able to generate common queries after reading a compact Primer.

---

# 2. Non-Goals

KQL is not:

```text
a general-purpose programming language
a procedural reasoning language
a replacement for SQL
a replacement for SPARQL
a theorem prover
a universal probabilistic logic
a hidden chain-of-thought query
a Governance mutation language
a Schema mutation language
a search-engine query language
```

KQL describes **what cognitive information is requested**.

The Nexus decides how to execute the query.

---

# 3. The Three Query Dimensions

A KQL query must keep three dimensions conceptually separate.

## 3.1 Cognitive State

```text
What records are stored?
```

Examples:

```text
Concept
Proposition
Assertion
Evidence
Activity
Experience
Skill
```

---

## 3.2 Epistemic Projection

```text
What should be believed under this policy/context?
```

Outputs:

```text
accepted
rejected
contested
uncertain
insufficient
```

---

## 3.3 Cognitive Time

```text
Which historical Nexus state are we reading?
```

Specified by:

```text
current state
AS OF SEQ
AS OF TX
AS OF TIME
```

---

# 4. World Time Is a Fourth Independent Clock

Epistemic projection additionally asks:

```text
What world/valid time are we asking about?
```

Therefore:

```text
Cognitive AS OF time
    ≠
World valid time
```

Example:

```text
What did I believe on March 1
about the system status on March 1?
```

is different from:

```text
What do I believe now
about the system status on March 1?
```

KQL must express both.

---

# 5. Core Query Equation

Conceptually:

```text
KQL Result =
    Evaluate(
      Query,
      Visible Cognitive State,
      Schema Context,
      Optional Epistemic Projection,
      Optional Historical Snapshot
    )
```

under current Governance authorization.

---

# 6. Query Skeleton

Recommended native KQL 2.0 query form:

```prolog
FIND(...)
WHERE {
  ...
}
AS OF ...
FOR TIME ...
WITH EPISTEMIC {
  ...
}
ORDER BY ...
LIMIT N
CURSOR "<token>"
```

Only `FIND` and `WHERE` are required for a structured query.

Other clauses are optional and only meaningful where applicable.

---

# 7. Minimal Query

```prolog
FIND(?person)
WHERE {
  ?person {type: "Person"}
}
LIMIT 20
```

This remains intentionally close to KIP 1.x.

---

# 8. Native KQL Default View Is Raw Cognitive State

This is a core KIP 2.0 rule.

A plain Proposition pattern:

```prolog
?p (?alice, "timezone", ?tz)
```

means:

> A visible canonical Proposition with this semantic tuple exists.

It does **not** mean:

> The Brain accepts this timezone as true.

---

# 9. Raw Proposition Existence Is Truth-Neutral

Therefore:

```text
matched Proposition
    ≠
accepted belief
```

A raw query may return Propositions that are:

```text
supported
rejected
contested
historical
hypothetical
unasserted
```

depending on their associated Assertions.

---

# 10. Why Raw Must Be the Native Default

If raw Proposition patterns silently meant "accepted belief":

```text
audit
contradiction inspection
Evidence tracing
historical analysis
import review
```

would become difficult or misleading.

Native v2 makes the distinction visible in the query language.

---

# 11. KIP 1 Compatibility May Provide a Projected Proposition View

A `kip-1-compat` execution profile MAY interpret legacy Fact-style reads using an accepted Epistemic Projection.

That is compatibility behavior.

It MUST NOT redefine native KQL 2.0 semantics.

---

# 12. Core Pattern Families

KQL 2.0 has these baseline pattern families:

```text
Concept Pattern
Proposition Pattern
Assertion Pattern
Evidence Pattern
Activity Pattern
Structural Reference Pattern
Belief Pattern
Belief Slot Pattern
```

---

# 13. Concept Pattern

Recommended explicit form:

```prolog
?person CONCEPT {
  type: "Person",
  name: "Alice"
}
```

Compatibility/model-friendly shorthand:

```prolog
?person {
  type: "Person",
  name: "Alice"
}
```

The shorthand remains the recommended common form.

---

# 14. Concept `type` Is Schema Sugar

In native v2:

```text
type: "Person"
```

is not the persisted universal identity field.

It is model-facing shorthand resolved through the query's Schema Environment to an exact:

```text
schema_ref
```

---

# 15. Exact Concept Type Match

A query may use the exact ref:

```prolog
?person {
  type: "kip://profiles/cognitive-memory@2.0.0/Person"
}
```

For audit/interoperability, exact refs are preferred.

---

# 16. Concept Match Fields

Recommended matchable fields:

```text
id
schema_ref
type          alias for schema resolution
key
name
canonical_id
aliases
attributes
facets
retention
_system       subject to Governance
```

`governance` may be partially visible only when policy allows.

---

# 17. Concept `name` Is Grounding, Not Identity

```prolog
?person {type: "Person", name: "Alice"}
```

may match more than one visible Concept.

KQL must not assume `(type, name)` uniqueness in native v2.

---

# 18. Use ID After Grounding

Recommended Agent workflow:

```text
SEARCH / DESCRIBE
    ↓
resolve entity
    ↓
query by immutable local id or canonical identity
```

---

# 19. Proposition Pattern

Explicit form:

```prolog
?p PROPOSITION (?subject, "works_for", ?organization)
```

Compatibility shorthand:

```prolog
?p (?subject, "works_for", ?organization)
```

---

# 20. Proposition Variable Is Optional

```prolog
(?subject, "works_for", ?organization)
```

matches without binding the Proposition itself.

---

# 21. Predicate Constant Resolution

A predicate constant may be:

```text
local alias
qualified alias
exact Schema Symbol Ref
```

Example:

```prolog
(?person, "works_for", ?org)
```

The engine resolves `"works_for"` deterministically before execution.

---

# 22. Exact Predicate Ref

```prolog
(?person,
 "kip://ldclabs/organization@1.3.0/works_for",
 ?org)
```

bypasses local alias ambiguity.

---

# 23. Predicate Variable

```prolog
?p (?subject, ?predicate, ?object)
```

binds `?predicate`.

Native v2 rule:

> **A predicate variable binds the canonical exact `predicate_ref`, not merely a display/local predicate name.**

This protects query meaning across schema versions/namespaces.

---

# 24. Predicate Display Name

A future expression such as:

```text
LOCAL_NAME(?predicate)
```

MAY render a model-friendly local name.

Canonical identity remains the exact ref.

---

# 25. Proposition Object May Be a Literal

Example:

```prolog
?p (?alice, "timezone", "+08:00")
```

or:

```prolog
?p (?service, "healthy", true)
```

---

# 26. Object Variable Can Bind Element or Literal

```prolog
?p (?subject, "predicate", ?object)
```

may bind `?object` to:

```text
Cognitive Element
or
Literal
```

according to Predicate schema.

---

# 27. Literal Query Helpers

Recommended functions:

```text
IS_LITERAL(?x)
IS_ELEMENT(?x)
LITERAL_TYPE(?x)
```

Exact type/result semantics follow Core Literal rules.

---

# 28. Higher-Order Proposition

Because Propositions are referable Cognitive Elements, higher-order patterns remain possible where schema permits.

Example:

```prolog
?p2 (?alice, "disputes", ?p1)
```

where `?p1` is a Proposition.

---

# 29. Nested Structural Proposition Syntax

KIP 1.x nested tuple syntax MAY remain as model-friendly shorthand where unambiguous:

```prolog
(?alice, "disputes", (?service, "status", "healthy"))
```

Native execution resolves the nested term to the canonical Proposition if present.

---

# 30. Assertion Pattern

New native form:

```prolog
?a ASSERTION {
  proposition: ?p,
  asserted_by: ?alice,
  stance: "support",
  mode: "stated"
}
```

---

# 31. Assertion Fields

Baseline queryable fields include:

```text
id
kind
space_id
proposition
asserted_by
stance
mode
confidence
valid_time
asserted_at
lifecycle
context_refs
evidence
facets
retention
_system
```

subject to Governance visibility.

---

# 32. Assertion Example

```prolog
FIND(?a, ?a.confidence, ?a.asserted_at)
WHERE {
  ?alice {id: :alice_id}
  ?p (?alice, "timezone", "+08:00")

  ?a ASSERTION {
    proposition: ?p,
    stance: "support"
  }
}
ORDER BY ?a.asserted_at DESC
LIMIT 20
```

This asks:

> Who/what has supported this Proposition?

It does not compute Brain belief.

---

# 33. Assertion `asserted_by` Is Semantic Actor

A query over:

```text
?a.asserted_by
```

does not reveal the authenticated writer unless Governance also permits access to:

```text
?a._system.origin.principal_id
```

These identities remain separate.

---

# 34. Assertion Confidence

```text
?a.confidence
```

means confidence of that Assertion's stance.

It is not:

```text
source trust
Brain belief
memory strength
retrieval score
```

KQL must preserve that distinction.

---

# 35. Assertion Lifecycle Query

Example:

```prolog
FIND(?a, ?a.lifecycle.status, ?a.lifecycle.superseded_by)
WHERE {
  ?a ASSERTION {
    asserted_by: ?alice
  }

  FILTER(
    IN(
      ?a.lifecycle.status,
      ["active", "superseded", "retracted"]
    )
  )
}
```

---

# 36. Evidence Pattern

```prolog
?e EVIDENCE {
  evidence_class: "tool_result"
}
```

---

# 37. Evidence Fields

Baseline:

```text
id
kind
space_id
evidence_class
payload
content_digest
media_type
observed_at
source
generated_by
lifecycle
facets
retention
_system
```

---

# 38. Evidence Payload Visibility

Governance may allow:

```text
Evidence existence
```

while hiding:

```text
raw payload
source identity
content_ref
```

A query must respect field-level redaction.

---

# 39. Evidence Query Example

```prolog
FIND(
  ?e.id,
  ?e.evidence_class,
  ?e.observed_at,
  ?e.content_digest
)
WHERE {
  ?e EVIDENCE {
    evidence_class: "tool_result"
  }

  FILTER(?e.observed_at >= :since)
}
ORDER BY ?e.observed_at DESC
LIMIT 50
```

---

# 40. Activity Pattern

```prolog
?act ACTIVITY {
  activity_class: "semantic_consolidation",
  status: "completed"
}
```

---

# 41. Activity Fields

Baseline:

```text
id
kind
space_id
activity_class
started_at
ended_at
inputs
outputs
associated_actors
parameters_digest
status
facets
retention
_system
```

---

# 42. Activity Query Example

```prolog
FIND(?act, ?act.started_at)
WHERE {
  ?act ACTIVITY {
    activity_class: "skill_compilation",
    status: "completed"
  }
}
ORDER BY ?act.started_at DESC
LIMIT 20
```

---

# 43. Profile Types Remain Concepts

`Experience`, `Skill`, `Event`, `Commitment`, etc. use ordinary Concept patterns:

```prolog
?exp {type: "Experience"}
?skill {type: "Skill"}
```

They are not additional KQL Core pattern kinds.

---

# 44. Structural Reference Pattern

KIP Core/Profile has non-Proposition topology:

```text
Assertion → Evidence
Experience → ExperienceStep
Activity → input/output
```

These are Structural References.

KQL needs to traverse them without pretending they are world Propositions.

---

# 45. Proposed Structural Syntax

```prolog
?ref STRUCTURAL (?source, "field", ?target)
```

The binding variable is optional:

```prolog
STRUCTURAL (?source, "field", ?target)
```

---

# 46. Structural Reference Is Virtual Query State

A Structural Reference binding is not necessarily a durable Cognitive Element.

It is a virtual descriptor over schema/Core topology.

It therefore does not automatically have:

```text
id
Assertion
Evidence
truth status
```

---

# 47. Structural Reference Descriptor

When `?ref` is bound, useful virtual fields may include:

```text
source
field_ref
target
index
role
attributes
```

depending on the underlying structural field.

---

# 48. Assertion Evidence Traversal

Example:

```prolog
FIND(?a, ?e, ?citation.role)
WHERE {
  ?a ASSERTION {
    stance: "support"
  }

  ?citation STRUCTURAL (?a, "evidence", ?e)

  ?e EVIDENCE {}
}
```

The `role` may be:

```text
support
challenge
context
```

---

# 49. Experience Step Traversal

```prolog
FIND(?exp, ?step, ?edge.index)
WHERE {
  ?exp {type: "Experience"}

  ?edge STRUCTURAL (?exp, "has_step", ?step)

  ?step {type: "ExperienceStep"}
}
ORDER BY ?edge.index ASC
```

---

# 50. Structural Field Resolution

`"has_step"` resolves through Schema Environment.

Exact form is allowed:

```prolog
STRUCTURAL(
  ?exp,
  "kip://profiles/cognitive-memory@2.0.0/has_step",
  ?step
)
```

---

# 51. Structural Relation Is Not a Proposition

A query:

```prolog
STRUCTURAL (?exp, "has_step", ?step)
```

does not imply there is a Proposition:

```text
(Experience, has_step, Step)
```

unless such a semantic Proposition was separately created.

---

# 52. Structural Pattern Does Not Support Epistemic Stance

There is no:

```text
support/reject
```

for Core topology itself.

If the Brain needs an epistemic claim about a structural relation, it must model an appropriate semantic Proposition.

---

# 53. Dot Notation

KIP 1.x dot notation remains the preferred field access mechanism.

Examples:

```text
?x.id
?x.kind
?x.schema_ref
?x.name
?x.attributes.summary
?x.lifecycle.status
?x._system.version
```

---

# 54. Whole Object Access

Useful:

```text
?x.attributes
?x.facets
?x.retention
```

subject to visibility.

---

# 55. Facet Access

Recommended JSON-style path:

```prolog
?x.facets["MnemonicState"].memory_strength
```

`"MnemonicState"` resolves through Schema Environment.

Exact facet symbol ref may also be used.

---

# 56. Exact Facet Access

```prolog
?x.facets[
  "kip://profiles/cognitive-memory@2.0.0/MnemonicState"
].memory_strength
```

Formatting shown across lines for readability.

---

# 57. Ambiguous Facet Alias

If two active packages expose:

```text
MnemonicState
```

the query fails with a Schema ambiguity error.

The engine MUST NOT guess.

---

# 58. Missing Field

A missing optional field evaluates to:

```text
null
```

where the query model permits optional access.

Schema-invalid field names may produce:

```text
SchemaFieldNotFound
```

rather than silently returning null.

---

# 59. Hidden Field vs. Missing Field

Governance may intentionally make a hidden field indistinguishable from missing/not-visible state to prevent information leakage.

Clients MUST NOT infer:

```text
hidden field does not exist
```

from `null`/redaction behavior.

---

# 60. FILTER

KIP 1.x `FILTER` semantics remain.

```prolog
FILTER(boolean_expression)
```

---

# 61. Baseline Operators

Preserve:

```text
== != < > <= >=
&& || !
IN(...)
CONTAINS(...)
STARTS_WITH(...)
ENDS_WITH(...)
REGEX(...)
IS_NULL(...)
IS_NOT_NULL(...)
```

---

# 62. Additional Type Predicates

Recommended:

```text
IS_LITERAL
IS_ELEMENT
IS_KIND
```

Example:

```prolog
FILTER(IS_KIND(?x, "evidence"))
```

---

# 63. Deterministic Functions Only

Baseline KQL SHOULD avoid functions whose value changes implicitly during execution.

Prefer:

```text
:now parameter
```

over:

```text
NOW()
```

for reproducible raw temporal filters.

Epistemic current-time behavior is handled by Projection context when omitted.

---

# 64. NOT

KIP 1.x keeps:

```prolog
NOT {
  ...
}
```

but KIP 2.0 clarifies its meaning strongly.

---

# 65. NOT Means No Visible Match

This is a core invariant:

> **`NOT { pattern }` means that the pattern has no match in the query's currently authorized visible cognitive universe.**

It does not mean the world-level proposition is false.

---

# 66. NOT Is Not Epistemic Rejection

Bad reasoning:

```text
NOT { (Alice, is_vegetarian, true) }
therefore:
Alice is not vegetarian
```

is invalid.

Correct:

```text
no visible stored matching Proposition/record
```

---

# 67. Why

KIP is:

```text
open-world
partially observed
Governance-filtered
historically mutable
```

Therefore absence cannot establish falsehood.

---

# 68. Query Rejection Through BELIEF

To ask whether the Brain rejects:

```text
Alice is vegetarian
```

use a Belief Pattern and inspect:

```text
status = rejected
```

---

# 69. OPTIONAL

KIP 1.x behavior remains:

```prolog
OPTIONAL {
  ...
}
```

A failed optional match leaves newly bound variables:

```text
null
```

---

# 70. OPTIONAL Null Means No Visible Match

It does not mean:

```text
the fact is false
the field never existed
no hidden record exists
```

---

# 71. UNION

KIP 1.x behavior remains.

```prolog
UNION {
  ...
}
```

for logical alternative pattern branches.

Variable scope remains explicit/predictable.

---

# 72. Variable Scope

Preserve v1 principles:

```text
NOT:
    internal variables do not escape

OPTIONAL:
    new variables escape with null on miss

UNION:
    branch bindings form compatible union solutions
```

A formal grammar will carry the v1 scope rules forward.

---

# 73. Aggregation

Preserve:

```text
COUNT
COUNT(DISTINCT ...)
SUM
AVG
MIN
MAX
```

---

# 74. Implicit Grouping

KIP 1.x implicit grouping remains:

```text
non-aggregated projected expressions
→ grouping key
```

---

# 75. Null Aggregation

Aggregations ignore null as in v1.

```text
COUNT(?optional_var)
```

returns `0` when all rows in the group are null.

---

# 76. Governance-Safe Aggregation

All aggregation occurs **after Governance visibility filtering**.

Therefore:

```text
COUNT(...)
```

counts visible authorized query solutions.

---

# 77. Count Zero

`COUNT(...) = 0` means:

```text
zero visible matches
```

not:

```text
zero matching records exist globally
```

and not:

```text
the queried claim is false.
```

---

# 78. Solution Set Semantics

Preserve v1 set semantics:

```text
duplicate complete variable bindings collapse
before projection/order/limit
```

Distinct solutions that project equal values remain distinct where their complete bindings differ.

---

# 79. ORDER BY

Preserve:

```prolog
ORDER BY <expr> ASC|DESC [, ...]
```

---

# 80. Null Ordering

Preserve:

```text
null always sorts last
```

unless future explicit null-order syntax is added.

---

# 81. LIMIT

```prolog
LIMIT :limit
```

retains v1 behavior.

Runtime caps may reduce the maximum returned page size.

---

# 82. CURSOR

```prolog
CURSOR :cursor
```

remains opaque.

KIP 2.0 strengthens cursor semantics.

---

# 83. Snapshot-Stable Pagination

The first paginated query evaluates against one:

```text
snapshot_seq
```

The returned cursor pins that cognitive snapshot.

Later pages continue over the same snapshot.

---

# 84. Why Cursor Pins Snapshot

Without pinning:

```text
page 1
concurrent writes
page 2
```

can cause:

```text
duplicates
missing rows
mixed historical state
```

which is unacceptable for cognitive audit/export.

---

# 85. Cursor Binding

A cursor SHOULD bind:

```text
Space
snapshot_seq
normalized query digest
Schema resolution context
projection policy/version if used
ordering state
pagination position
Principal/session authority scope
```

---

# 86. Cursor Cannot Be Reused for Different Query

Changing:

```text
FILTER
AS OF
FOR TIME
Projection Policy
ORDER BY
Principal
Space
```

invalidates the cursor.

---

# 87. Revocation Still Wins During Pagination

Snapshot pinning does not freeze current access authority.

If the caller loses permission before page 2:

```text
current Governance may deny or redact continuation
```

A cursor is not a capability token granting stale access.

---

# 88. Stable Tie-Breaking

The engine MUST use a deterministic tie-breaker inside one cursor traversal so equal `ORDER BY` values do not cause unstable pagination.

The hidden tie-breaker need not be exposed.

---

# 89. Default Ordering

Without `ORDER BY`, engine MAY use implementation-defined deterministic ordering for one snapshot/cursor.

Cross-engine default order is not guaranteed.

Clients needing portable order must specify `ORDER BY`.

---

# 90. Proposition Path Operators

KIP 1.x path operators remain available on **raw Proposition patterns**:

```prolog
(?x, "is_subclass_of"{0,5}, ?ancestor)
```

and predicate alternatives:

```prolog
(?x, "related_to" | "depends_on", ?y)
```

---

# 91. Raw Path Semantics

A raw path means:

> Matching canonical Propositions exist along the path.

It does not mean:

> Every path edge is epistemically accepted.

---

# 92. No Automatic Belief Propagation

Baseline KIP 2.0 does NOT define:

```text
multi-hop confidence multiplication
probabilistic path belief
truth propagation over transitivity
```

---

# 93. Why

Suppose:

```text
P1 support = 0.9
P2 support = 0.8
```

KIP has not defined that:

```text
path belief = 0.72
min(0.9, 0.8)
average
```

or any other formula.

Inventing one in KQL would violate the Epistemic Model's policy separation.

---

# 94. Epistemic Traversal

For a small accepted path, query each hop explicitly:

```prolog
?b1 BELIEF (?x, "parent_of", ?y)
FILTER(?b1.status == "accepted")

?b2 BELIEF (?y, "parent_of", ?z)
FILTER(?b2.status == "accepted")
```

---

# 95. Future BELIEF PATH

A future optional capability MAY define:

```text
BELIEF PATH
```

only after semantics for:

```text
edge eligibility
transitive predicates
path status
uncertainty
explanation
```

are standardized.

It is not baseline KQL 2.0.

---

# 96. Epistemic Query Primitive

The key native v2 addition is the `BELIEF` pattern.

Recommended syntax:

```prolog
?belief BELIEF (?subject, "predicate", ?object)
```

`?belief` is a **virtual Epistemic Projection result**, not a stored Cognitive Element.

---

# 97. BELIEF Meaning

The clause asks:

> Under the query's principal, purpose, time, schema, Governance visibility, and Epistemic Policy, how should this Proposition candidate be interpreted?

---

# 98. BELIEF Projection Output

The virtual object follows the Epistemic Model:

```text
proposition
status
support
opposition
uncertainty
temporal
policy
explanation
```

Scores are optional.

---

# 99. BELIEF Example

```prolog
FIND(?timezone, ?belief)
WHERE {
  ?alice {id: :alice_id}

  ?belief BELIEF (?alice, "timezone", ?timezone)

  FILTER(?belief.status == "accepted")
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---

# 100. BELIEF Candidate Enumeration

If `?object` is unbound:

```prolog
?belief BELIEF (?alice, "timezone", ?timezone)
```

the engine evaluates visible semantic candidate Propositions matching:

```text
subject + predicate
```

and binds one result per candidate.

Schema conflict expansion may consider additional alternatives internally.

---

# 101. BELIEF Requires Bounded Target

Baseline rule:

> Subject and Predicate MUST be bound or groundable before a `BELIEF` clause executes.

The engine SHOULD reject:

```prolog
?b BELIEF (?s, ?p, ?o)
```

when all dimensions are unbound.

---

# 102. Why Bounded Projection

Epistemic Projection can require:

```text
provenance traversal
trust evaluation
conflict expansion
Evidence quality
```

Projecting the entire Brain accidentally is costly and unsafe.

---

# 103. Fully Grounded BELIEF Can Represent Unknown

Important open-world behavior:

```prolog
?belief BELIEF (?alice, "is_vegetarian", true)
```

is fully grounded.

Even if no canonical Proposition currently exists, the engine SHOULD return one virtual Projection result with:

```text
proposition_id = null
status = insufficient
```

subject to Schema validity.

---

# 104. Why Virtual Missing Proposition Projection Matters

Otherwise:

```text
zero raw rows
```

would force the Agent to guess whether:

```text
false
unknown
hidden
schema-invalid
```

A fully grounded Belief Projection can explicitly say:

```text
insufficient
```

without persisting a Proposition.

---

# 105. Virtual Semantic Term

For a missing Proposition target, Projection contains a virtual semantic term:

```json
{
  "subject": "...",
  "predicate_ref": "...",
  "object": true
}
```

No Core Proposition is created by a read.

---

# 106. Query Does Not Mutate Through Projection

`BELIEF` is read-only.

A projected virtual Proposition never appears in durable state unless a later KML operation explicitly creates it.

---

# 107. BELIEF `rejected`

Example:

```prolog
FIND(?belief)
WHERE {
  ?alice {id: :alice_id}
  ?belief BELIEF (?alice, "is_vegetarian", true)
}
FOR TIME :now
```

may return:

```text
status = rejected
```

if sufficient opposition exists.

This is the correct epistemic negative.

---

# 108. BELIEF `insufficient`

If no eligible basis exists:

```text
status = insufficient
```

not:

```text
false
rejected
```

---

# 109. BELIEF `contested`

If credible support and opposition coexist:

```text
status = contested
```

The virtual result surfaces both.

---

# 110. BELIEF `uncertain`

Meaningful material exists but does not cross acceptance/rejection thresholds.

The Agent should not collapse it into an accepted answer.

---

# 111. BELIEF Does Not Persist Brain Belief

Projection output remains a view.

If Brain wants durable self-belief continuity, Formation/Maintenance may later create a derived Assertion.

That is a write transaction and must preserve provenance.

---

# 112. BELIEF SLOT

Many Agent questions ask:

```text
"What is Alice's timezone?"
"What is Project X's status?"
"What value do we currently believe?"
```

These are subject-predicate **slot** questions rather than one fully specified Proposition.

KQL 2.0 SHOULD provide a convenience projection:

```prolog
?slot BELIEF SLOT (?subject, "predicate")
```

---

# 113. BELIEF SLOT Output

Recommended virtual shape:

```json
{
  "subject_id": "...",
  "predicate_ref": "...",

  "status": "accepted | contested | uncertain | insufficient",

  "accepted_values": [],
  "candidate_projections": [],

  "uncertainty": {},
  "policy": {},
  "temporal": {},
  "explanation": {}
}
```

---

# 114. BELIEF SLOT Does Not Introduce New Epistemology

It is a convenience aggregation over the same:

```text
conflict-set expansion
candidate Proposition Projections
Schema cardinality/exclusivity
```

defined by the Epistemic Model.

---

# 115. BELIEF SLOT Empty Case

Unlike candidate enumeration, the Slot pattern returns one projection for a grounded:

```text
subject + predicate
```

even when no values are stored.

Then:

```text
status = insufficient
accepted_values = []
candidate_projections = []
```

---

# 116. BELIEF SLOT Example

```prolog
FIND(?slot)
WHERE {
  ?project {id: :project_id}

  ?slot BELIEF SLOT (?project, "status")
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---

# 117. Functional Predicate Slot

For a functional Predicate:

```text
status
timezone
primary_owner
```

a Slot projection is usually the most natural query.

---

# 118. Multi-Valued Predicate Slot

For:

```text
interests
skills
members
```

Schema may permit many accepted values.

Then:

```text
accepted_values
```

may contain multiple entries without conflict.

---

# 119. Rejected Values in Slot

`candidate_projections` can expose rejected/contested candidates.

This is useful for audit and explanation.

---

# 120. BELIEF Pattern Is Not SEARCH

BELIEF does not semantically retrieve similar propositions by embedding.

It projects grounded/schema-selected candidates.

Use `SEARCH` for fuzzy grounding first.

---

# 121. Query-Level Epistemic Context

Belief patterns consume a query-level context.

Recommended:

```prolog
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "low",
  policy: "policy-id",
  include_historical: false,
  include_hypothetical: false,
  explanation: "summary"
}
```

---

# 122. `purpose`

Examples:

```text
answer_user
research
diagnosis
action_planning
audit
scenario
```

Exact vocabulary is policy-defined.

---

# 123. Purpose Is Context

Purpose may affect:

```text
trust threshold
freshness
Evidence requirements
mode eligibility
```

It does not grant Governance authority by itself.

---

# 124. `risk`

Optional:

```text
low
medium
high
```

or deployment-defined vocabulary.

Projection Policy may require stronger evidence for higher risk.

---

# 125. `policy`

May refer to an exact authorized Epistemic Policy identity/version.

If omitted, runtime resolves the applicable policy from:

```text
Space
Principal
purpose
risk
```

---

# 126. Resolved Policy Must Be Returned

For reproducibility, a Belief query SHOULD expose the actual:

```text
policy_id
policy_version
projection_method
```

used.

---

# 127. `include_historical`

If false, superseded/retracted historical Assertions are normally excluded according to policy.

If true:

```text
Projection may include them as historical epistemic material
```

without pretending they are current.

---

# 128. `include_hypothetical`

Ordinary factual queries default false.

Scenario analysis may set true.

---

# 129. `explanation`

Recommended levels:

```text
none
summary
ledger
```

---

# 130. `none`

Returns status/essential projection outputs only.

---

# 131. `summary`

Returns concise externally auditable factors/warnings.

Not hidden chain-of-thought.

---

# 132. `ledger`

Requests the Epistemic Ledger:

```text
contributing Assertions
opposing Assertions
Evidence roots
Corroboration Groups
trust decisions
lifecycle exclusions
temporal exclusions
warnings
```

subject to Governance.

---

# 133. Explanation Visibility

A caller may have:

```text
project permission
```

but not:

```text
raw Evidence read permission.
```

Then:

```text
status may be visible
ledger may be redacted
```

according to policy.

---

# 134. Projection Without Raw Evidence

KQL allows a protected projection service to return:

```text
accepted / contested / ...
```

without exposing confidential Evidence if Governance explicitly authorizes this mode.

---

# 135. Redacted Projection Must Say It Is Redacted

Projection output SHOULD expose:

```text
explanation_redacted = true
```

or equivalent when material inputs were hidden from the consumer.

Do not make a reduced explanation appear complete.

---

# 136. FOR TIME

`FOR TIME` expresses the world-valid time of an epistemic question.

Example:

```prolog
FOR TIME "2026-03-01T12:00:00Z"
```

---

# 137. FOR TIME Applies to Belief Projection

It influences:

```text
Assertion.valid_time
Evidence temporal relevance
freshness rules
schema temporal conflict
```

according to Projection Policy.

---

# 138. FOR TIME Does Not Filter Raw FIND Automatically

A raw query:

```prolog
FIND(?a)
WHERE {
  ?a ASSERTION {}
}
FOR TIME :t
```

SHOULD NOT silently hide Assertions merely because their `valid_time` differs.

`FOR TIME` is meaningful to Belief/Slot Projection.

Raw filtering remains explicit.

---

# 139. Raw Temporal Filter Example

```prolog
FIND(?a)
WHERE {
  ?a ASSERTION {}

  FILTER(
    ?a.valid_time.from <= :t
    &&
    (
      IS_NULL(?a.valid_time.until)
      ||
      ?a.valid_time.until > :t
    )
  )
}
```

---

# 140. FOR INTERVAL Future Extension

A future KQL version may support:

```text
FOR INTERVAL <from> TO <until>
```

for period-level projections.

Baseline requires point valid-time projection.

---

# 141. AS OF

`AS OF` chooses the **cognitive transaction snapshot**.

Recommended forms:

```prolog
AS OF SEQ 1500
AS OF TX "tx-991"
AS OF TIME "2026-03-01T12:00:00Z"
```

---

# 142. Default AS OF

If omitted:

```text
current readable Space snapshot
```

is used.

Response should identify the actual `snapshot_seq`.

---

# 143. `AS OF SEQ`

Exact and preferred for reproducibility:

```prolog
AS OF SEQ :seq
```

---

# 144. `AS OF TX`

Resolves the committed transaction to its Space sequence.

---

# 145. `AS OF TIME`

Resolves to the latest committed Space state whose:

```text
committed_at <= requested time
```

subject to historical retention.

Sequence is preferred for exact audit.

---

# 146. Historical Raw Query

```prolog
FIND(?a, ?a.lifecycle.status)
WHERE {
  ?a ASSERTION {id: :assertion_id}
}
AS OF SEQ :seq
```

asks:

> What did this Assertion record look like at that cognitive state?

---

# 147. Historical Belief Query

```prolog
FIND(?slot)
WHERE {
  ?alice {id: :alice_id}
  ?slot BELIEF SLOT (?alice, "timezone")
}
AS OF SEQ :historical_seq
FOR TIME :historical_world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  explanation: "ledger"
}
```

asks:

> What did the Brain believe then, about that world time?

---

# 148. Current Belief About Historical Time

```prolog
FIND(?slot)
WHERE {
  ?alice {id: :alice_id}
  ?slot BELIEF SLOT (?alice, "timezone")
}
FOR TIME :historical_world_time
WITH EPISTEMIC {
  purpose: "research"
}
```

No `AS OF`.

This asks:

> With everything the Brain knows now, what does it believe about the historical period?

---

# 149. Core Temporal Distinction

```text
belief-as-of-then
    ≠
current-belief-about-then
```

KQL expresses the difference through:

```text
AS OF
vs.
FOR TIME
```

---

# 150. Historical Query Authorization Is Current

This distinction is critical.

`AS OF` reconstructs historical cognitive state.

But the caller is accessing it **now**.

Therefore current Governance decides:

```text
whether the caller may read/project historical state today.
```

---

# 151. Historical Governance Context vs. Current Access

Two Governance evaluations may matter:

```text
Current Access Governance:
    May this Principal see this historical data now?

Historical Governance State:
    What could the Brain/Principal see or believe at the historical time?
```

These are not the same.

---

# 152. No Historical ACL Bypass

A caller cannot query:

```text
AS OF before data became secret
```

to bypass current confidentiality.

Current access policy remains authoritative.

---

# 153. Historical Epistemic Projection

When reconstructing:

> What did the Brain believe then?

the projection may need historical:

```text
trust policy
source visibility
Assertion lifecycle
Schema Environment
```

as epistemic inputs.

But output is still filtered by current caller authorization.

---

# 154. Current Query Policy Can Redact Historical Ledger

Even if the Brain historically saw secret Evidence:

```text
the current caller may receive only the historical status
```

not raw Evidence.

---

# 155. Schema Context

KQL local names must resolve deterministically.

Every query executes under one Schema resolution context.

---

# 156. Current Query Default Schema Environment

Without `AS OF`:

```text
current active Schema Environment
```

resolves local aliases.

---

# 157. Historical Query Default Schema Environment

With `AS OF`:

> Local aliases SHOULD default to the Schema Environment active at that historical Space snapshot.

This makes historical query text reflect historical semantics.

---

# 158. Exact Ref Avoids Ambiguity

For high-assurance audit:

```text
use exact schema_ref/predicate_ref
```

rather than relying on historical aliases.

---

# 159. Explicit Schema Environment Pin

A future/request-level option MAY allow:

```text
USING SCHEMA ENV 17
```

or equivalent.

This is useful for deterministic client-generated queries.

---

# 160. Current-Normalized Historical View

Schema Packages allow optional migration-aware normalized queries.

This is not baseline raw KQL.

An implementation MAY advertise:

```text
normalized_schema_view
```

and allow querying old data through a declared normalization target.

---

# 161. No Hidden Schema Coercion

Absent explicit normalized-view capability:

```text
old exact schema remains old exact schema.
```

KQL must not silently reinterpret it using current type semantics.

---

# 162. Schema Output Identity

Returned native records expose:

```text
schema_ref
predicate_ref
Facet refs
```

as exact canonical identities.

---

# 163. KQL Result Model

KIP 1.x columnar `FIND` output remains the baseline for token efficiency and compatibility.

Example query:

```prolog
FIND(?name, ?status)
...
```

returns conceptually:

```json
[
  ["Project A", "Project B"],
  ["active", "archived"]
]
```

with columns index-aligned.

---

# 164. Single Projection Expression

With one `FIND` expression:

```prolog
FIND(?slot)
```

the result may remain unwrapped as the single column, following v1 behavior.

---

# 165. Virtual Objects in Result

`BELIEF`, `BELIEF SLOT`, and Structural descriptors can be returned as JSON objects inside columns.

They are marked as virtual/read-only where necessary.

---

# 166. Query Context Response

KQL 2.0 SHOULD extend successful response with a context object.

The context object rides on the operation result of the runtime envelope
(`kip-response.schema.json`), not on a KQL-specific reply shape. Illustrative:

```json
{
  "kip": "2.0",
  "status": "succeeded",

  "results": [
    {
      "op_id": "q1",
      "status": "succeeded",
      "result": [...],

      "context": {
        "space_id": "space-1",
        "snapshot_seq": 1500,
        "schema_environment_version": 17,

        "epistemic_policy": {
          "id": "default-recall",
          "version": "3"
        }
      },

      "next_cursor": "..."
    }
  ],

  "snapshot": {
    "snapshot_seq": 1500
  }
}
```

---

# 167. Why Return Snapshot

An Agent decision may later need to answer:

> Which exact Brain state did this answer come from?

The query response should make that recoverable.

---

# 168. Response Context Is Engine Truth

The query engine fills:

```text
snapshot_seq
resolved Schema Environment
actual Epistemic Policy
```

The Agent does not author these as facts.

---

# 169. Result Context and Decision Provenance

A Brain may persist:

```text
query snapshot_seq
projection policy/version
```

inside a later Decision Activity/provenance record.

That makes action reasoning reproducible without storing private chain-of-thought.

---

# 170. Search Remains Separate from KQL

KIP 1.x correctly separates:

```text
SEARCH
```

as an associative grounding primitive.

KIP 2.0 SHOULD preserve that separation.

---

# 171. Why SEARCH Is Not FIND

`SEARCH` answers:

> What stored cognition is semantically/lexically similar to this probe?

`FIND` answers:

> What visible records satisfy this exact declarative pattern?

---

# 172. SEARCH Score Is Retrieval Relevance

Search `_score` is not:

```text
Assertion confidence
trust
belief
memory strength
```

---

# 173. Recommended Agent Retrieval Flow

```text
1. DESCRIBE PRIMER
2. SEARCH to ground fuzzy entity/topic
3. resolve exact ID/schema
4. FIND raw state or BELIEF projection
5. synthesize answer
```

---

# 174. SEARCH + BELIEF

A strong recall pattern:

```text
SEARCH:
    find likely Project/Person/Concept

KQL:
    BELIEF SLOT:
        ask what current belief is
```

Do not use semantic similarity score as epistemic confidence.

---

# 175. DESCRIBE Remains META

Authoritative Schema Package introspection belongs to META:

```text
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE SCHEMA ENVIRONMENT
```

KQL can query records' schema refs but does not redefine schema.

---

# 176. Governance Query Universe

Before KQL logical evaluation, the engine applies current Governance visibility.

Conceptually:

```text
Physical Space State
    ↓
Current Principal Authorization
    ↓
Visible Query Universe
    ↓
KQL pattern evaluation
```

---

# 177. Authorization Happens Before Logical Operators

Unauthorized records do not participate in:

```text
WHERE
NOT
OPTIONAL
UNION
COUNT
aggregation
ORDER BY
LIMIT
search/ranking
belief explanation
```

unless a privileged projection policy explicitly allows a redacted derived result.

---

# 178. No Hidden Count Leakage

If there are 50 secret records and 3 public records:

```prolog
FIND(COUNT(?x))
WHERE {
  ?x {type: "Diagnosis"}
}
```

an ordinary caller sees:

```text
3
```

not `53`.

---

# 179. No NOT Leakage

If a hidden record matches a pattern, a Principal without discover authority must not learn that fact indirectly through special errors or query timing/results beyond allowed security behavior.

---

# 180. Existence-Neutral Errors

When policy requires hiding existence, an exact ID query may return:

```text
not_found-equivalent
```

rather than:

```text
permission denied for secret element X
```

---

# 181. Field-Level Redaction

A visible element can be returned as:

```text
id/name/status
```

while:

```text
Evidence payload
source
origin
private Facet
```

are hidden.

---

# 182. Pattern on Hidden Field

An implementation must not allow a caller to infer a hidden field value through:

```text
FILTER
ORDER BY
COUNT
```

unless policy permits use of that field for a controlled derived query.

---

# 183. Controlled Derived Query

Governance may allow:

```text
projection uses hidden Evidence
```

while returning only:

```text
compliance status
```

This is an explicit privileged operation, not ordinary raw KQL field access.

---

# 184. Query Purpose and Governance

KQL request may declare:

```text
purpose
```

for Epistemic/Governance context.

A self-declared purpose does not by itself raise access authority.

---

# 185. Query Risk

Likewise:

```text
risk = high
```

may make the projection stricter.

It must not grant more data.

---

# 186. KQL Read-Only Guarantee

KQL MUST NOT create/update:

```text
memory_strength
access counters
last_read_at
confidence
Evidence
Assertion
```

merely because data was queried.

---

# 187. No Read Tracking in Core Semantics

Reading memory is not automatically cognitive reinforcement.

If an Agent wants retrieval to become an Experience/learning signal, it must be recorded explicitly through Formation/KML under policy.

---

# 188. Query Does Not Reinforce Evidence

Repeatedly querying the same Evidence does not:

```text
increase confidence
increase corroboration
```

---

# 189. Query Cache Is Not Cognitive State

Caching a result is runtime optimization.

It does not become a stored belief.

---

# 190. Epistemic Projection Cache

A cached projection is valid only for its bound context:

```text
snapshot_seq
policy version
valid time
purpose
risk
Principal visibility
Schema semantics
```

---

# 191. Projection Cache Invalidation

Changes to relevant:

```text
Assertion
Evidence
provenance
trust policy
Governance
Schema
```

may invalidate cached projections.

---

# 192. Query Against Transaction Snapshot

Inside a read/write atomic transaction, KQL evaluates:

```text
transaction snapshot
+
transaction's tentative writes
```

when transaction API allows mixed reads.

---

# 193. Outside Transaction

Ordinary KQL request reads one stable current snapshot.

Multiple independent requests may observe different snapshots.

---

# 194. Read Snapshot Batch

For multiple logically related KQL queries, Transaction Runtime may provide a read snapshot container so all commands use one:

```text
snapshot_seq
```

---

# 195. Batch Commands Are Not Automatically One Snapshot

A normal transport `commands[]` batch is not necessarily a read transaction unless the API explicitly guarantees a shared snapshot.

Clients needing consistency should request snapshot semantics.

---

# 196. Current Query Snapshot

Even an ordinary single `FIND` must be internally consistent.

It cannot mix element versions from multiple partially observed commits.

---

# 197. Historical Retention Failure

If requested `AS OF` state has been compacted/purged beyond supported history:

```text
HistoricalSnapshotUnavailable
```

should be returned.

Do not substitute current state silently.

---

# 198. Purged Content

Historical query may return:

```text
redacted/unavailable
```

where the transaction history proves a record existed but its content was legitimately purged.

Do not reconstruct forbidden content from logs.

---

# 199. Historical Query and Tombstone

A historical query before tombstone may show the element.

A current query may show:

```text
no active element
```

or an authorized tombstone, depending on lifecycle policy.

---

# 200. Querying Transaction History

Detailed Commit Log / Change Stream queries are Runtime/META capabilities, not ordinary graph KQL.

KQL `AS OF` consumes transaction history but does not expose the entire engine log as cognitive records.

---

# 201. Querying Provenance

Semantic provenance is accessible through:

```text
Evidence
Activity
Structural References
source/origin fields
```

subject to Governance.

---

# 202. Provenance Example

```prolog
FIND(?a, ?e, ?activity)
WHERE {
  ?a ASSERTION {id: :assertion_id}

  STRUCTURAL (?a, "evidence", ?e)

  ?activity ACTIVITY {
    outputs: ?e
  }
}
```

Implementations may support direct field-binding shorthand for `inputs/outputs`.

---

# 203. Provenance DAG Backtracking

KQL can manually traverse Activity/Evidence dependencies.

Baseline KQL SHOULD NOT provide an unbounded recursive provenance operator.

Epistemic Projection may internally traverse provenance under policy-defined limits.

---

# 204. Why No Unbounded Provenance Operator

Long-lived Brain provenance may be:

```text
deep
cyclic through malformed imported history
large
privacy-sensitive
```

Agent queries should remain bounded/predictable.

---

# 205. Provenance Depth

A future KQL capability MAY support:

```text
PROVENANCE OF ?x DEPTH N
```

as a specialized read primitive.

Not baseline v2.

---

# 206. Associative Recall

Predicate-variable raw query remains useful:

```prolog
FIND(?pred, ?neighbor)
WHERE {
  ?p (?entity, ?pred, ?neighbor)
}
LIMIT 50
```

---

# 207. Associative Recall Is Raw

It answers:

> What semantic propositions are connected to this entity?

It does not answer:

> Which of them are accepted beliefs?

---

# 208. Epistemic Associative Recall

Recommended two-stage pattern:

```text
1. raw bounded associative discovery
2. project important candidate Propositions through BELIEF
```

or use schema-known predicate Slots.

---

# 209. Avoid Projecting Every Neighbor Blindly

A large entity may have thousands of Propositions.

Brain Recall should:

```text
scope by predicate/domain/profile
rank candidates
then project
```

to control cost.

---

# 210. Memory Facet Query

Example:

```prolog
FIND(
  ?exp,
  ?exp.facets["MnemonicState"].memory_strength,
  ?exp.facets["MnemonicState"].salience
)
WHERE {
  ?exp {type: "Experience"}
}
ORDER BY
  ?exp.facets["MnemonicState"].salience DESC,
  ?exp._system.updated_at DESC
LIMIT 20
```

---

# 211. Mnemonic Signal Is Not Epistemic Status

High:

```text
memory_strength
```

does not mean:

```text
accepted truth
```

KQL exposes both without combining them automatically.

---

# 212. Utility Query

A Skill Profile may expose:

```text
utility
```

through a Facet/attribute.

KQL may rank by utility.

That does not elevate Governance authority.

---

# 213. Action Recall

A Brain can use KQL to assemble:

```text
relevant accepted beliefs
applicable candidate Skills
success Experiences
failure Experiences
Commitments
constraints
warnings
```

KQL itself does not prescribe the Brain's final reranking algorithm.

---

# 214. Failure Experience Query

Example:

```prolog
FIND(?exp, ?exp.attributes.outcome_status)
WHERE {
  ?exp {type: "Experience"}

  FILTER(
    ?exp.attributes.outcome_status == "failure"
  )
}
ORDER BY
  ?exp.facets["MnemonicState"].salience DESC
LIMIT 20
```

---

# 215. Contrastive Experience Query

A Brain may query successful and failed Experiences with the same goal/domain and compare them.

That is procedural learning logic above KQL.

---

# 216. Scenario Projection

Example:

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (:subject, "will_succeed", true)
}
FOR TIME :future_time
WITH EPISTEMIC {
  purpose: "scenario",
  include_hypothetical: true,
  explanation: "summary"
}
```

---

# 217. Hypothetical Does Not Enter Ordinary Belief

Only the scenario Projection includes hypothetical Assertions.

Raw queries can still inspect them at any time if visible.

---

# 218. Audit Projection

```prolog
WITH EPISTEMIC {
  purpose: "audit",
  include_historical: true,
  explanation: "ledger"
}
```

may preserve superseded/retracted Assertions in the ledger instead of collapsing them.

---

# 219. Querying Raw Counter-Evidence

```prolog
FIND(?a, ?e)
WHERE {
  ?a ASSERTION {
    proposition: :prop_id
  }

  ?ref STRUCTURAL (?a, "evidence", ?e)

  FILTER(?ref.role == "challenge")
}
```

---

# 220. Querying Contest

Raw:

```prolog
FIND(?a, ?a.stance, ?a.asserted_by)
WHERE {
  ?a ASSERTION {
    proposition: :prop_id
  }
}
```

Epistemic:

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (:prop_subject, :predicate, :object)
}
WITH EPISTEMIC {
  explanation: "ledger"
}
```

Both are useful for different questions.

---

# 221. Proposition ID Targeting

A Proposition already known by identity is projected through the same id form
that names it in a Proposition pattern (Spec §43.2 / §46.1):

```prolog
?belief BELIEF (id: :id)
```

Equivalently, bind it first and use the one-argument form:

```prolog
?p PROPOSITION (id: :id)
?belief BELIEF (?p)
```

The id form is a reference, not an object pattern: `BELIEF {proposition_id: :id}`
is not KQL.

---

# 222. Recommended BELIEF One-Argument Form

KQL SHOULD support:

```prolog
?belief BELIEF (?p)
```

where `?p` is already bound to a Proposition.

This is equivalent to projecting its tuple.

---

# 223. Example

```prolog
FIND(?p, ?belief)
WHERE {
  ?p (?alice, "timezone", ?tz)
  ?belief BELIEF (?p)
}
```

---

# 224. BELIEF One-Argument Variable Must Be Bound

`?p` must already bind a Proposition.

Otherwise error:

```text
ProjectionTargetUnbound
```

---

# 225. BELIEF Pattern Ordering

Inside `WHERE`, clause order is declarative logically.

However, a BELIEF target must be logically bound by other patterns/parameters.

The engine may reorder execution while preserving semantics.

---

# 226. FILTER on Belief Output

Example:

```prolog
FILTER(
  IN(
    ?belief.status,
    ["accepted", "contested"]
  )
)
```

---

# 227. Score Filtering

If Projection provides numeric support:

```prolog
FILTER(?belief.support.score >= 0.8)
```

is allowed.

But the Agent MUST inspect:

```text
score_semantics
```

before interpreting it as probability.

---

# 228. No Universal Belief Numeric

KQL never assumes:

```text
support.score = probability
```

---

# 229. Score Ordering

Ranking by:

```text
belief support
memory salience
recency
```

is permitted.

The query author remains responsible for respecting each signal's semantics.

---

# 230. Epistemic Status Ordering

KIP does not define a universal:

```text
accepted > contested > uncertain
```

sort ordering.

Use explicit filters or application ordering.

---

# 231. Open-World Existence Check

User asks:

> Do we know whether Alice is vegetarian?

Correct KQL:

```prolog
FIND(?belief)
WHERE {
  ?alice {id: :alice_id}

  ?belief BELIEF (
    ?alice,
    "is_vegetarian",
    true
  )
}
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

Result can explicitly be:

```text
accepted
rejected
contested
uncertain
insufficient
```

---

# 232. Wrong Existence Check

Avoid:

```prolog
FIND(COUNT(?p))
WHERE {
  ?p (?alice, "is_vegetarian", true)
}
```

then interpreting:

```text
0 = false
```

That violates open-world semantics.

---

# 233. Querying "What Do We Know?"

This natural language question is ambiguous.

It may mean:

```text
what records exist?
```

or:

```text
what accepted beliefs do we have?
```

Brain Recall should generally prefer Epistemic Projection for user-facing factual claims.

---

# 234. Raw View for Audit, Epistemic View for Answering

Recommended default Brain behavior:

```text
ordinary factual answer
    → BELIEF / BELIEF SLOT

debug/audit/provenance
    → raw FIND

memory exploration
    → SEARCH + raw FIND + selective BELIEF
```

---

# 235. Raw View Must Remain Accessible

Do not hide disagreement by only exposing accepted projection.

A real Brain needs to inspect:

```text
why it believes
what was rejected
what remains contested
```

---

# 236. Projection Must Remain Explainable

A Belief query with `ledger` should permit an authorized Agent to inspect sufficient external structure to audit the result without chain-of-thought.

---

# 237. No Hidden Chain-of-Thought Query

KQL MUST NOT expose private internal model reasoning tokens.

It can expose:

```text
Evidence
Assertions
Activities
decision summaries
Projection Ledger
```

that were explicitly persisted or deterministically computed.

---

# 238. Querying Decision Summary

If a Profile stores:

```text
decision_summary
```

as a field, it is ordinary cognitive state and may be queried under Governance.

It is not hidden CoT.

---

# 239. Raw Evidence Content Limits

Evidence content may be:

```text
large
binary
external
```

KQL should generally return metadata/reference rather than automatically inline arbitrarily large payloads.

---

# 240. Evidence Payload Retrieval

A specialized Evidence/blob fetch API may be preferable for large content.

KQL can identify the relevant Evidence.

---

# 241. Query Parameterization

KIP 1.x parameter placeholders remain:

```text
:param
```

They must occupy complete KIP value positions.

---

# 242. Parameter Safety

Values are bound structurally.

Do not concatenate user text into raw KQL strings when a parameter position exists.

---

# 243. Parameter Examples

```prolog
?person {id: :person_id}
FILTER(?a.asserted_at >= :since)
LIMIT :limit
AS OF SEQ :seq
FOR TIME :world_time
```

---

# 244. Parameterized Schema Ref

Where grammar permits a schema value position:

```prolog
?x {type: :schema_ref}
```

may be used.

The engine resolves/validates it as schema identity, not arbitrary code.

---

# 245. Query Cost

KQL implementations may enforce:

```text
max result rows
max graph expansions
max path hops
max projection count
max provenance expansion
execution time
memory
```

---

# 246. Projection Cost

BELIEF is typically more expensive than raw triple match.

Runtimes SHOULD cap unbounded candidate projection.

---

# 247. Projection Budget

A runtime MAY expose:

```text
max_belief_projections_per_query
```

and reject/limit queries exceeding it.

---

# 248. Path Hop Limits

Existing path syntax must obey engine max hops.

Even:

```text
{1,}
```

is bounded by capability/resource policy.

---

# 249. Regex Limits

Implementations should use safe/bounded regex execution.

KQL must not become a denial-of-service vector.

---

# 250. Query Partial Results

For ordinary `FIND`, timeout SHOULD normally return an error rather than silently present incomplete results as complete.

A future explicit:

```text
ALLOW PARTIAL
```

mode may support best-effort exploratory queries.

Baseline keeps completion semantics clear.

---

# 251. Projection Partial Result

Epistemic Projection with missing/redacted Evidence may still produce:

```text
uncertain
insufficient
```

with warnings.

This is epistemic incompleteness, not execution timeout.

Do not conflate them.

---

# 252. Query Error Classes

Recommended KQL 2.0 error names:

```text
InvalidSyntax
InvalidIdentifier
SchemaSymbolNotFound
SchemaSymbolAmbiguous
SchemaFieldNotFound
TypeMismatch
ReferenceError
NotFoundOrNotVisible
HistoricalSnapshotUnavailable
HistoricalSchemaUnavailable
ProjectionTargetUnbound
ProjectionTargetUnbounded
ProjectionNotAuthorized
ProjectionPolicyUnavailable
CursorMismatch
CursorExpired
CursorInvalidated
ResourceExhausted
ExecutionTimeout
UnsupportedCapability
```

Formal numeric codes are deferred.

---

# 253. Existence-Neutral NotFound

Security-sensitive deployments may use:

```text
NotFoundOrNotVisible
```

to avoid revealing hidden element existence.

---

# 254. Projection Unauthorized

If caller lacks `project` authority:

```text
ProjectionNotAuthorized
```

should not reveal hidden candidate counts/details.

---

# 255. Schema Ambiguity Recovery

Error SHOULD list visible candidate schema symbols if policy allows.

Agent then uses an exact ref.

---

# 256. Historical Snapshot Recovery

If history unavailable:

```text
report retention boundary
```

where Governance permits.

Never silently substitute nearest/current snapshot.

---

# 257. Cursor Invalidated by Revocation

If continuing would violate new current Governance:

```text
CursorInvalidated
```

or an existence-neutral authorization result is appropriate.

Do not continue with stale authority.

---

# 258. KQL Capability Negotiation

Runtime SHOULD advertise:

```text
kql_version
assertion_patterns
evidence_patterns
activity_patterns
structural_patterns
belief_projection
belief_slot
historical_as_of
historical_by_time
facet_bracket_access
raw_path_operators
read_snapshot
projection_ledger
normalized_schema_view
max_path_hops
max_projection_count
```

---

# 259. Minimum KQL 2.0 Conformance

A minimal native implementation MUST support equivalent semantics for:

```text
FIND
WHERE
Concept patterns
Proposition patterns
Assertion patterns
Evidence patterns
Activity patterns
FILTER
NOT
OPTIONAL
UNION
aggregation
ORDER BY
LIMIT
CURSOR
exact Schema refs
Governance-filtered query universe
BELIEF single-Proposition projection
current snapshot identity
```

---

# 260. Full Cognitive Query Conformance

Adds:

```text
Structural Reference pattern
BELIEF SLOT
historical AS OF
FOR TIME
Facet access
projection ledger
snapshot-stable pagination
predicate variables
raw path operators
```

---

# 261. Historical Conformance

Requires:

```text
AS OF SEQ
lifecycle reconstruction
historical Schema Environment
historical Epistemic inputs
current access enforcement
```

within advertised retention.

---

# 262. KQL Conformance Fixtures

Tests should include:

```text
raw Proposition exists but rejected Assertion
raw query returns Proposition
BELIEF returns rejected

no Proposition exists
fully grounded BELIEF returns insufficient

functional predicate has two conflicting values
BELIEF SLOT returns contested

two values at non-overlapping valid times
FOR TIME selects appropriate accepted value

AS OF old seq returns old lifecycle
current query returns superseded state

current belief about old world time uses later Evidence
historical belief-as-of does not

NOT with hidden record does not leak existence
COUNT excludes hidden records
OPTIONAL null does not reveal hidden state

same name Concepts do not collapse
ambiguous schema alias fails
exact schema ref succeeds

cursor page 2 uses same cognitive snapshot
revocation invalidates/restricts cursor

raw path traverses stored Propositions
raw path does not imply accepted belief

repeated BELIEF read does not reinforce memory
```

---

# 263. Open-World Fixtures

```text
No visible evidence for P:
    BELIEF P → insufficient

Weak evidence:
    BELIEF P → uncertain

Strong reject Assertion:
    BELIEF P → rejected

Strong support and opposition:
    BELIEF P → contested

No raw Proposition:
    FIND raw → zero rows
    fully grounded BELIEF → one insufficient projection
```

---

# 264. Governance Fixtures

```text
caller can project compliance result
caller cannot read secret Evidence

BELIEF:
    accepted + redacted explanation

raw FIND Evidence:
    no hidden content

COUNT Evidence:
    no secret count leak
```

---

# 265. Historical ACL Fixture

```text
record public at seq 10
record secret now
caller lacks secret access

AS OF SEQ 10:
    still hidden now
```

Historical time never bypasses current Governance.

---

# 266. Schema Fixture

```text
seq 10:
    "Person" alias → package@2/Person

seq 20:
    alias changed / package@3 default

AS OF SEQ 10:
    local "Person" resolves using historical environment

exact @2 ref:
    resolves independent of alias
```

---

# 267. Predicate Variable Fixture

Native v2:

```prolog
FIND(?pred)
WHERE {
  (?subject, ?pred, ?object)
}
```

returns exact Predicate refs.

Compatibility mode may expose v1 local names separately.

---

# 268. Structural Fixture

```text
Experience has 3 ordered Steps

STRUCTURAL has_step
→ 3 virtual reference rows
with index 0,1,2

No semantic Propositions are invented.
```

---

# 269. Projection Score Fixture

Implementation returns:

```text
support.score = 0.8
score_semantics = normalized_support
```

KQL client MUST NOT label it:

```text
80% probability
```

without calibrated probability semantics.

---

# 270. KIP 1.x Compatibility

KQL 2.0 deliberately preserves large parts of KQL 1.x.

Preserved:

```text
FIND(...)
WHERE {...}
Concept clause
Proposition triple clause
FILTER
NOT
OPTIONAL
UNION
predicate alternatives
raw path operators
aggregations
implicit grouping
ORDER BY
LIMIT
CURSOR
:param parameters
set solution semantics
```

---

# 271. Native v2 Breaking Semantic Changes

Important differences:

```text
Proposition existence is raw semantic state, not Fact truth.

predicate variables bind exact predicate_ref.

type names resolve through Schema Packages.

(type, name) is not universal Concept identity.

generic metadata is no longer the Core epistemic container.

NOT/COUNT/absence are not epistemic negatives.

accepted belief comes from BELIEF projection.
```

---

# 272. v1 `metadata.confidence`

A v1 query:

```prolog
FILTER(?link.metadata.confidence > 0.9)
```

cannot always be mechanically translated into one v2 field.

Why:

```text
one Proposition
may have many Assertions
with different actors/confidences.
```

---

# 273. Migration Translation

Depending on intent, the v2 equivalent may be:

```text
query Assertion.confidence
```

or:

```text
query BELIEF support/status
```

The compat layer should warn when semantics are ambiguous.

---

# 274. v1 Proposition Fact View

A compatibility profile MAY translate:

```prolog
(?s, "p", ?o)
```

used in a legacy factual Recall context into an accepted projected relation.

But native v2 raw query remains truth-neutral.

---

# 275. v1 Path Query

Legacy path query assumed stored links behaved like facts.

Compatibility mode may choose an accepted-belief traversal policy where feasible.

Native v2 path remains raw.

Complex belief-path migration may require explicit query rewrite.

---

# 276. v1 SEARCH Workflow

Keep the proven workflow:

```text
ground with SEARCH
then structured FIND
```

but user-facing fact answering should usually add:

```text
BELIEF / BELIEF SLOT
```

after grounding.

---

# 277. Model-First Primer

A compact KQL 2.0 Primer for an Agent could be:

```text
READ RAW:
  FIND(...) WHERE {...}

Concept:
  ?x {type:"Person", name:"Alice"}

Raw Proposition:
  ?p (?s, "predicate", ?o)
  existence != belief

Assertion:
  ?a ASSERTION {proposition:?p, stance:"support"}

Evidence:
  ?e EVIDENCE {evidence_class:"tool_result"}

Activity:
  ?a ACTIVITY {activity_class:"inference"}

Structural:
  ?r STRUCTURAL (?source, "has_step", ?target)

Belief:
  ?b BELIEF (?s, "predicate", ?o)
  status = accepted | rejected | contested | uncertain | insufficient

Slot belief:
  ?slot BELIEF SLOT (?s, "predicate")

World time:
  FOR TIME :t

Historical cognitive state:
  AS OF SEQ :seq

Projection context:
  WITH EPISTEMIC {purpose:"answer_user", explanation:"summary"}

Remember:
  missing != false
  raw proposition != accepted belief
  SEARCH score != confidence
  current Governance always controls visibility
```

This remains small enough for LLM prompting.

---

# 278. Common Query Pattern: Current Preference

```prolog
FIND(?slot)
WHERE {
  ?person {id: :person_id}

  ?slot BELIEF SLOT (
    ?person,
    "prefers_interface_theme"
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---

# 279. Common Query Pattern: Raw Preference History

```prolog
FIND(
  ?value,
  ?a.stance,
  ?a.confidence,
  ?a.asserted_at,
  ?a.lifecycle.status
)
WHERE {
  ?person {id: :person_id}

  ?p (
    ?person,
    "prefers_interface_theme",
    ?value
  )

  ?a ASSERTION {
    proposition: ?p
  }
}
ORDER BY ?a.asserted_at DESC
LIMIT 100
```

---

# 280. Common Query Pattern: Current Project Status

```prolog
FIND(?slot)
WHERE {
  ?project {id: :project_id}
  ?slot BELIEF SLOT (?project, "status")
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "ledger"
}
```

---

# 281. Common Query Pattern: Historical Project Status Belief

```prolog
FIND(?slot)
WHERE {
  ?project {id: :project_id}
  ?slot BELIEF SLOT (?project, "status")
}
AS OF SEQ :seq
FOR TIME :world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  include_historical: true,
  explanation: "ledger"
}
```

---

# 282. Common Query Pattern: Evidence for Claim

```prolog
FIND(
  ?a,
  ?e,
  ?citation.role,
  ?e.evidence_class,
  ?e.observed_at
)
WHERE {
  ?p PROPOSITION (id: :proposition_id)

  ?a ASSERTION {
    proposition: ?p
  }

  ?citation STRUCTURAL (?a, "evidence", ?e)
}
ORDER BY ?e.observed_at DESC
LIMIT 100
```

---

# 283. Common Query Pattern: Source Disagreement

```prolog
FIND(
  ?actor,
  ?a.stance,
  ?a.confidence,
  ?a.asserted_at
)
WHERE {
  ?p PROPOSITION (id: :proposition_id)

  ?a ASSERTION {
    proposition: ?p,
    asserted_by: ?actor
  }
}
ORDER BY ?a.asserted_at DESC
```

---

# 284. Common Query Pattern: Failed Experiences

```prolog
FIND(
  ?exp,
  ?exp.attributes.goal,
  ?exp.attributes.outcome_summary,
  ?exp.facets["MnemonicState"].salience
)
WHERE {
  ?exp {type: "Experience"}

  FILTER(
    ?exp.attributes.outcome_status == "failure"
  )
}
ORDER BY
  ?exp.facets["MnemonicState"].salience DESC,
  ?exp._system.updated_at DESC
LIMIT 20
```

---

# 285. Common Query Pattern: Experience Trajectory

```prolog
FIND(
  ?step,
  ?edge.index,
  ?step.attributes.kind,
  ?step.attributes.summary
)
WHERE {
  ?exp {id: :experience_id}

  ?edge STRUCTURAL (
    ?exp,
    "has_step",
    ?step
  )
}
ORDER BY ?edge.index ASC
```

---

# 286. Common Query Pattern: Provenance Activity

```prolog
FIND(
  ?activity,
  ?activity.activity_class,
  ?activity.started_at
)
WHERE {
  ?activity ACTIVITY {
    outputs: :element_id
  }
}
ORDER BY ?activity.started_at DESC
```

---

# 287. Common Query Pattern: Current Unknown

```prolog
FIND(?belief)
WHERE {
  ?person {id: :person_id}

  ?belief BELIEF (
    ?person,
    "has_allergy",
    "penicillin"
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "high",
  explanation: "summary"
}
```

If no basis:

```text
status = insufficient
```

The Agent must not answer "no allergy."

---

# 288. Common Query Pattern: Scenario

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (
    :deployment,
    "will_succeed",
    true
  )
}
FOR TIME :planned_time
WITH EPISTEMIC {
  purpose: "scenario",
  risk: "high",
  include_hypothetical: true,
  explanation: "ledger"
}
```

---

# 289. Common Query Pattern: Audit the Then-vs-Now Difference

Historical:

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :service,
    "status"
  )
}
AS OF SEQ :old_seq
FOR TIME :old_time
WITH EPISTEMIC {
  purpose: "historical_audit"
}
```

Current reconstruction:

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :service,
    "status"
  )
}
FOR TIME :old_time
WITH EPISTEMIC {
  purpose: "historical_audit"
}
```

Compare results.

---

# 290. Common Query Pattern: Associative Discovery Then Belief

Raw discovery:

```prolog
FIND(?p, ?pred, ?neighbor)
WHERE {
  ?p (:entity_id, ?pred, ?neighbor)
}
LIMIT 50
```

Then selectively project relevant candidate:

```prolog
FIND(?belief)
WHERE {
  ?p PROPOSITION (id: :prop_id)
  ?belief BELIEF (?p)
}
WITH EPISTEMIC {
  purpose: "answer_user"
}
```

---

# 291. Query Planning Principle

KQL is declarative.

Clause order is for readability.

An engine may reorder:

```text
index lookup
join
FILTER
projection
```

provided observable semantics remain identical.

---

# 292. Security-Sensitive Reordering

The physical planner MUST preserve the logical rule:

```text
Governance visibility before user-visible logical effects
```

It cannot optimize by first counting hidden rows and redacting later if the count itself leaks.

---

# 293. Epistemic Projection Planner

The engine may batch several `BELIEF` candidate projections.

It must preserve:

```text
same snapshot
same policy
same valid time
same Principal context
```

within the query.

---

# 294. Projection N+1 Avoidance

The `BELIEF SLOT` primitive exists partly to let an engine evaluate a conflict set in one optimized projection rather than an Agent issuing many independent calls.

---

# 295. Query Determinism

For the same:

```text
Space snapshot
Schema context
visible Governance view
Epistemic Policy/version
valid time
purpose/risk
query
```

a deterministic Projection policy SHOULD return the same structural result.

If the policy intentionally uses nondeterministic models, the policy must declare that property for audit.

---

# 296. Model-Assisted Projection

An implementation MAY use a model to evaluate Evidence quality.

Then Projection output should identify:

```text
projection method/version
```

sufficient for audit.

KQL syntax does not expose hidden model reasoning.

---

# 297. Query Reproducibility Boundary

Perfect future replay may be impossible if:

```text
external model version unavailable
policy depended on external state
Evidence was purged
```

KQL should surface this limitation rather than claiming false determinism.

---

# 298. Query Explainability

KQL may eventually support a query-plan:

```text
EXPLAIN QUERY
```

through META/runtime.

This is different from:

```text
Epistemic explanation ledger.
```

---

# 299. Query Plan vs. Belief Explanation

```text
Query plan:
    how database executed KQL

Belief ledger:
    why epistemic projection reached status
```

Do not conflate them.

---

# 300. Read Authority Classes

Governance may distinguish:

```text
discover
read
search
project
```

KQL operations must require the appropriate capability.

---

# 301. Raw FIND Authority

Requires:

```text
discover/read
```

according to returned fields.

---

# 302. BELIEF Authority

Requires:

```text
project
```

and may internally use additional privileged projection rules.

---

# 303. SEARCH Authority

Requires:

```text
search
```

and remains META/grounding.

---

# 304. Historical Authority

Historical reads may require additional:

```text
audit/history
```

permission depending on Space policy.

---

# 305. Raw Origin Authority

Querying:

```text
_system.origin
```

may require:

```text
read_raw_origin
```

rather than ordinary read.

---

# 306. Governance History

Detailed Grant/Policy history is queried through Governance/META audit interfaces, not by treating Governance records as ordinary Concepts.

---

# 307. Schema History

`AS OF` automatically reconstructs historical schema context where required.

Direct Schema Package history is META.

---

# 308. Querying Imported Cognition

Raw KQL can inspect:

```text
import provenance
source refs
import Activities
```

where stored and visible.

---

# 309. Imported Assertion Belief

`BELIEF` evaluates imported Assertions under destination local Epistemic Policy.

It does not reuse source Projection status as destination status.

---

# 310. Imported `$self`

Ordinary Capsule merge maps source self to a remote actor.

Therefore:

```prolog
?self {name: "$self"}
```

always refers to the destination Profile's local self identity under its binding rules, not imported source self.

---

# 311. Restore Context

After verified same-Brain restore, Profile/Governance may rebind autobiographical identity.

KQL itself does not decide that identity mapping.

---

# 312. KQL and MemorySpace

Baseline query executes inside one resolved:

```text
MemorySpace
```

specified by request/session context.

---

# 313. No Implicit Cross-Space Query

KQL does not silently traverse multiple Spaces.

Cross-Space query requires an explicit future/federated capability or a governed shared view.

---

# 314. Space Is Not a Graph Filter

Do not model:

```text
space_id
```

as merely another user-controlled `FILTER`.

Space resolution is part of the execution/security context.

---

# 315. Foreign References

If an implementation supports Foreign Space References, dereferencing them requires explicit capability/Governance.

Baseline KQL treats foreign ref as a reference value, not an automatic traversal.

---

# 316. Querying Capsule Staging

Quarantined/isolation import records are outside ordinary Recall query universe unless reviewer policy explicitly grants access.

---

# 317. Search Index Lag

If SEARCH is eventually consistent, a newly committed record may be absent from fuzzy SEARCH but present in canonical KQL.

Receipt/ID-based KQL is authoritative for committed state.

---

# 318. KQL Strong Read Path

Correctness-sensitive Agent workflows SHOULD use a canonical snapshot-consistent KQL path.

Do not use approximate search-index absence as a uniqueness or truth check.

---

# 319. Query and Learning

A KQL result may influence Agent behavior.

That does not itself mean the Brain learned.

Learning requires durable future behavior change.

---

# 320. Recording Retrieval Outcome

If a retrieval becomes causally important:

```text
decision
action
outcome
```

Formation may later record an Experience/Activity.

KQL remains read-only.

---

# 321. Causal Utility Evaluation

Brain benchmarks can compare:

```text
with memory query
vs.
memory ablated
```

KQL provides observable retrieval but does not define the learning benchmark.

---

# 322. KQL Invariants

The following are normative design targets.

1. KQL is read-only.
2. Native `FIND` queries raw visible cognitive state.
3. Raw Proposition existence does not imply accepted belief.
4. `BELIEF` is a virtual Epistemic Projection, not persisted Core state.
5. `BELIEF SLOT` is a conflict-set/value convenience over the same Epistemic Model.
6. A fully grounded BELIEF target can return `insufficient` even when no Proposition is persisted.
7. A query never creates a Proposition merely to project it.
8. `accepted`, `rejected`, `contested`, `uncertain`, `insufficient` retain Epistemic Model meanings.
9. Absence of visible match is not epistemic rejection.
10. `NOT` means no visible match, not falsehood.
11. `OPTIONAL` null means no visible match, not falsehood.
12. `COUNT=0` means zero visible matches, not falsehood.
13. Current Governance filters the query universe before user-visible logical operations.
14. Historical `AS OF` never bypasses current access Governance.
15. Historical epistemic reconstruction may use historical Governance as cognitive context while current Governance still controls output visibility.
16. `AS OF` expresses cognitive transaction time.
17. `FOR TIME` expresses world-valid time for projection.
18. `AS OF` and `FOR TIME` are independent.
19. Current-belief-about-then and belief-as-of-then are separately expressible.
20. Query result identifies the actual cognitive snapshot.
21. Local schema aliases resolve deterministically.
22. Native returned schema/predicate identities are exact refs.
23. Ambiguous schema aliases fail rather than guess.
24. Historical local aliases default to historical Schema Environment.
25. Exact schema refs bypass alias drift.
26. Predicate variables bind exact predicate refs in native v2.
27. Concept `name` is not universal identity.
28. Structural References are queryable without becoming semantic Propositions.
29. Structural descriptors are virtual, not automatically durable elements.
30. Profile memory types remain typed Concepts.
31. Facet access is schema-resolved and validated.
32. Raw Proposition path traversal does not imply belief.
33. Baseline KQL defines no automatic multi-hop belief score propagation.
34. BELIEF projection target must be bounded.
35. Projection policy/version is externally identifiable for audit.
36. Numeric belief scores must declare semantics.
37. Support/opposition scores are not assumed probabilities.
38. Epistemic explanation never requires hidden chain-of-thought.
39. Projection explanation may be redacted by Governance.
40. Projection without raw Evidence is allowed only by explicit Governance policy.
41. SEARCH retrieval score is not epistemic confidence.
42. SEARCH remains grounding/associative retrieval, separate from exact KQL.
43. Aggregation occurs over authorized visible solutions.
44. Hidden elements do not leak through count/order/filter/not/optional.
45. Querying does not reinforce memory by itself.
46. Querying does not mutate access statistics as cognitive semantics.
47. Cursor pagination is snapshot-stable.
48. Cursor does not preserve revoked authority.
49. Cursor is bound to normalized query/context and cannot be reused across incompatible requests.
50. Historical unavailability is explicit; current state is never silently substituted.
51. Purged historical content is never fabricated.
52. Commit/Change history is engine state, not automatically ordinary KQL graph data.
53. KQL executes within one MemorySpace by default.
54. Foreign/cross-Space traversal is explicit capability, not implicit behavior.
55. Read-only KQL does not perform external blob/network fetch automatically.
56. Evidence payload/resource limits are enforced.
57. KIP 1.x FIND/FILTER/OPTIONAL/UNION/aggregation/order/limit concepts are preserved where semantics remain valid.
58. KIP 1 compatibility behavior does not redefine native v2 raw semantics.
59. A Brain should use Epistemic queries for user-facing factual claims and raw queries for audit/debug when appropriate.
60. Query syntax should remain compact enough for reliable LLM generation.

---

# 323. Formal Grammar Sketch

Non-normative EBNF-style sketch:

```text
query :=
    FIND "(" projection_list ")"
    WHERE "{" where_clause* "}"
    as_of_clause?
    for_time_clause?
    epistemic_clause?
    order_clause?
    limit_clause?
    cursor_clause?

where_clause :=
      concept_pattern
    | proposition_pattern
    | assertion_pattern
    | evidence_pattern
    | activity_pattern
    | structural_pattern
    | belief_pattern
    | belief_slot_pattern
    | filter_clause
    | not_clause
    | optional_clause
    | union_clause

concept_pattern :=
    variable ("CONCEPT")? object_pattern

proposition_pattern :=
    variable? ("PROPOSITION")? proposition_tuple

proposition_tuple :=
      "(" term "," predicate_term "," term ")"
    | "(" "id" ":" scalar ")"
        (* match-only: rejected by ENSURE PROPOSITION / ASSERT *)

assertion_pattern :=
    variable "ASSERTION" object_pattern

evidence_pattern :=
    variable "EVIDENCE" object_pattern

activity_pattern :=
    variable "ACTIVITY" object_pattern

structural_pattern :=
    variable? "STRUCTURAL"
    "(" term "," structural_field "," term ")"

belief_pattern :=
      variable "BELIEF" "(" variable ")"
        (* the inner variable must be bound to a Proposition *)
    | variable "BELIEF" "(" "id" ":" scalar ")"
        (* same id form as proposition_tuple *)
    | variable "BELIEF"
      "(" term "," predicate_term "," term ")"
        (* exact predicate only — no raw path *)

belief_slot_pattern :=
    variable "BELIEF" "SLOT"
    "(" term "," predicate_term ")"

as_of_clause :=
      "AS OF SEQ" value
    | "AS OF TX" value
    | "AS OF TIME" value

for_time_clause :=
    "FOR TIME" value

epistemic_clause :=
    "WITH EPISTEMIC" object_literal

predicate_term :=
    predicate_atom path_quantifier?
    ("|" predicate_atom path_quantifier?)*
        (* raw predicate paths (§90) are legal only inside
           proposition_tuple; BELIEF / BELIEF SLOT take a bare
           predicate_atom *)

predicate_atom :=
    string | parameter | variable

path_quantifier :=
    "{" integer ("," integer?)? "}"
```

The normative machine-readable grammar is
[`../grammar/KIP-2.0-KQL.ebnf`](../grammar/KIP-2.0-KQL.ebnf); this sketch is a
reading aid for it. Formal scope/type rules are specified separately.

---

# 324. Recommended Parsing Rule

Protocol keywords are ASCII case-insensitive; canonical rendering uses uppercase spelling.

Schema symbols and string values remain case-sensitive according to their own definitions.

---

# 325. Variable Syntax

Preserve:

```text
?identifier
```

with v1-compatible identifier rules unless expanded later.

---

# 326. Parameter Syntax

Preserve:

```text
:identifier
```

for safe bound parameters.

---

# 327. Object Pattern Variables

Object patterns MAY contain bound variables as field values.

Example:

```prolog
?a ASSERTION {
  proposition: ?p,
  asserted_by: ?actor
}
```

A reference-valued field binds its referenced element.

---

# 328. List Field Binding

For list-valued Core fields, direct field binding semantics can be implementation-defined shorthand.

Portable traversal SHOULD use `STRUCTURAL` when:

```text
index
role
reference metadata
```

matters.

---

# 329. Recommended Structural Preference

Use:

```prolog
STRUCTURAL (?a, "evidence", ?e)
```

instead of relying on engine-specific list flattening.

This produces predictable solutions.

---

# 330. Pattern Empty Object

Allowed:

```prolog
?e EVIDENCE {}
```

to match all visible Evidence records.

Engine resource caps still apply.

---

# 331. Type Pattern Validation

Schema-aware pattern fields are validated before execution.

Typos should fail fast.

---

# 332. Raw Query Example — Full Epistemic Record

```prolog
FIND(
  ?p,
  ?a,
  ?actor,
  ?a.stance,
  ?a.mode,
  ?a.confidence,
  ?a.valid_time,
  ?a.lifecycle.status
)
WHERE {
  ?subject {id: :subject_id}

  ?p (
    ?subject,
    :predicate_ref,
    ?object
  )

  ?a ASSERTION {
    proposition: ?p,
    asserted_by: ?actor
  }
}
ORDER BY ?a.asserted_at DESC
LIMIT 100
```

---

# 333. Epistemic Query Example — Current Answer

```prolog
FIND(?slot)
WHERE {
  ?subject {id: :subject_id}

  ?slot BELIEF SLOT (
    ?subject,
    :predicate_ref
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "low",
  explanation: "summary"
}
```

---

# 334. Epistemic Query Example — High-Risk Action

```prolog
FIND(?belief)
WHERE {
  ?belief BELIEF (
    :service_id,
    "healthy",
    true
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "production_deployment",
  risk: "high",
  explanation: "ledger"
}
```

A stale high-confidence historical observation may still yield:

```text
uncertain
or
insufficient
```

for current deployment.

---

# 335. Historical Query Example — What We Believed Then

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project_id,
    "status"
  )
}
AS OF SEQ :then_seq
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  include_historical: true,
  explanation: "ledger"
}
```

---

# 336. Current Reconstruction Example — What We Now Believe About Then

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project_id,
    "status"
  )
}
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_research",
  explanation: "ledger"
}
```

---

# 337. Current vs. Historical Result

The difference between the previous two queries is not an error.

Later Evidence may legitimately revise current historical understanding.

---

# 338. Model Behavior Rule

When an Agent generates KQL for an ordinary factual answer:

```text
if a direct Predicate/slot exists
    prefer BELIEF SLOT

if a fully grounded yes/no proposition
    prefer BELIEF

if investigating disagreement/provenance
    query raw Assertions/Evidence

if resolving unknown entity/topic
    SEARCH first
```

---

# 339. Why BELIEF SLOT Is Important for Agents

Without it, an Agent would need to:

```text
query all candidates
understand schema cardinality
discover conflicts
project each
aggregate statuses
handle zero candidates
```

This duplicates Epistemic Model logic in every Agent prompt.

`BELIEF SLOT` keeps that cognition inside the Nexus where it belongs.

---

# 340. Why Raw FIND Still Matters

If KQL exposed only BELIEF SLOT:

```text
the Brain could answer
but could not inspect itself.
```

A genuine cognitive system needs both:

```text
belief
and
the state from which belief emerged.
```

---

# 341. Why KQL Does Not Have `FIND FACT`

KIP 2.0 deliberately avoids making `Fact` a raw storage kind.

A "fact" is contextual epistemic interpretation.

Use:

```text
BELIEF status = accepted
```

when the application needs an accepted factual view.

---

# 342. Accepted Does Not Mean Objective Truth

KQL must not rename:

```text
accepted
```

to:

```text
true
```

in native output.

---

# 343. Rejected Does Not Mean Object Literal False

```text
stance reject P
```

is different from:

```text
Predicate object = false
```

KQL preserves both forms.

---

# 344. Querying Boolean Value

```prolog
?slot BELIEF SLOT (?bob, "is_vegetarian")
```

may return accepted value:

```text
false
```

when `false` is the semantic object value.

Separately, a Proposition with object `true` may be epistemically `rejected`.

These are related but not identical structures.

---

# 345. Querying Contradictory Boolean State

A well-designed Projection Policy/Schema may relate:

```text
(Bob, is_vegetarian, true)
(Bob, is_vegetarian, false)
```

as exclusive candidates.

`BELIEF SLOT` is the right interface.

---

# 346. Querying Multiple Actors

Raw:

```prolog
FIND(?actor, ?a.stance)
WHERE {
  ?a ASSERTION {
    proposition: :p,
    asserted_by: ?actor
  }
}
```

reveals disagreement without forcing resolution.

---

# 347. Querying Brain's Local View

BELIEF:

```prolog
?belief BELIEF (id: :p)
```

resolves disagreement under local current/historical policy.

---

# 348. Querying Source Brain's Projection

If an imported Capsule contains a source Projection artifact, it is ordinary imported cognitive/provenance data.

Do not confuse it with:

```text
destination BELIEF
```

---

# 349. Query Security Equation

```text
VisibleRawResult
    =
    KQL(
      GovernanceFilter(
        SpaceState(snapshot)
      )
    )
```

For projection:

```text
VisibleBeliefResult
    =
    GovernedProjection(
      AuthorizedVisible/PrivilegedProjectionInputs,
      EpistemicPolicy,
      snapshot,
      world_time
    )
```

---

# 350. Query Time Equation

```text
Raw State Time
    =
    AS OF snapshot_seq
```

```text
Epistemic World Time
    =
    FOR TIME valid_at
```

---

# 351. Schema Equation

```text
Local Query Symbol
    ↓
Schema Environment
    ↓
Exact Schema Symbol Ref
```

Persisted/returned native identity remains exact.

---

# 352. Open-World Equation

```text
No Visible Match
    ≠
False
```

```text
Insufficient
    ≠
Rejected
```

---

# 353. Raw/Epistemic Equation

```text
Proposition
    =
    What can be said

Assertion
    =
    Who takes what stance toward it

BELIEF
    =
    What this Brain should currently treat as belief
```

---

# 354. Search/Belief Equation

```text
SEARCH score
    =
    retrieval relevance
```

```text
BELIEF status
    =
    epistemic interpretation
```

Never substitute one for the other.

---

# 355. Mnemonic/Epistemic Equation

```text
memory_strength
    =
    accessibility
```

```text
belief status/confidence
    =
    epistemic state
```

A vivid false memory is possible.

KQL must be able to represent it.

---

# 356. Utility/Authority Equation

```text
Skill utility
    ≠
Skill influence authority
```

KQL may retrieve both if authorized.

Governance determines the latter.

---

# 357. Historical Security Equation

```text
Historical Data Visibility Now
    =
    Current Governance
    ∩
    Requested Historical State
```

not:

```text
historical old ACL alone.
```

---

# 358. Final Architecture

```text
                     Agent Question
                          │
                          ▼
                 Grounding / SEARCH
                          │
                          ▼
                   Exact KQL Query
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
         Raw Pattern              BELIEF Pattern
              │                       │
              │                 Epistemic Policy
              │                       │
              │                 Evidence/Trust
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
                     AS OF Snapshot
                          │
                          ▼
                  Current Governance
                          │
                          ▼
                 Visible Query Universe
                          │
                          ▼
               FILTER / JOIN / OPTIONAL
                          │
                          ▼
                 Aggregate / ORDER
                          │
                          ▼
                LIMIT / Stable Cursor
                          │
                          ▼
             Result + Query Context
                          │
                          ▼
                   Agent Synthesis
```

The physical engine may reorder stages safely.

The conceptual separations must remain.

---

# 359. Final Principle

KIP 1.x made it natural for an Agent to ask:

> Which nodes and links match this graph pattern?

KIP 2.0 must additionally make it natural to ask:

> Is that link merely a semantic possibility, or does anyone assert it?

> Who asserted it?

> What Evidence supports or challenges it?

> Is the Evidence independent or derived from the same source?

> Does the Brain accept it, reject it, remain contested, remain uncertain, or simply not know?

> Which value does the Brain currently accept for this semantic slot?

> What did it believe before the latest correction?

> What does it believe now about that earlier world state?

> Which exact Schema version gives the query its meaning?

> Which cognitive snapshot was actually read?

> Does the query include hidden data I am not authorized to inspect?

> Can I receive a safe projection without receiving confidential Evidence?

> If a query returns nothing, does that mean false, unknown, hidden, or simply no visible match?

> Can I traverse the raw graph without accidentally treating every path as trusted truth?

The answer should not depend on prompt folklore.

It should be expressible in the protocol.

The governing idea is:

> **A real memory query language must distinguish retrieving what the Brain contains from asking what the Brain believes.**

KQL 2.0 makes that distinction explicit while preserving the compact graph-native language that made KIP 1.x practical for LLMs.
