# KIP 2.0 Core Data Model

**[English](./KIP-2.0-Core-Data-Model.md) | [中文](./KIP-2.0-Core-Data-Model_CN.md)**

## Status

**Core Data Model Proposal / Pre-Specification Draft**

This document defines the concrete logical data model that implements the architectural principles in [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md).

It is intentionally **not** a KQL/KML grammar specification and is intentionally **not** the complete epistemic, governance, schema-package, transaction, or capsule specification.

Its purpose is narrower and more foundational:

> **Define the persistent objects, identities, references, invariants, mutability rules, and structural relationships that every KIP 2.0 implementation must agree on before query or mutation syntax is designed.**

The primary design target is an Agent memory brain that can preserve semantic meaning, epistemic history, provenance, memory state, and governance boundaries without conflating them.

The data model therefore resolves several questions left open by the architecture document:

1. `Assertion` is a **dedicated KIP Core element kind**, not a reserved ordinary Concept.
2. `Evidence` is a **dedicated KIP Core element kind**.
3. `Activity` is a **dedicated KIP Core provenance element kind**.
4. A `Proposition` is an immutable, truth-neutral semantic term.
5. Core structural relationships such as `Assertion → Evidence` are **Structural References**, not semantic Propositions.
6. Literal-valued facts are first-class through typed `Literal` values.
7. Every durable cognitive element has exactly one home `MemorySpace`.
8. `name` is no longer universal identity; an immutable `id` is.
9. KIP 2.0 removes the semantic overload of the generic KIP 1.x `metadata` bag and separates content, profile facets, governance, retention, and engine truth.
10. Accepted belief is **not** a stored primitive in Core; it is derived by an Epistemic Projection.

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** are used to indicate intended protocol requirements for the eventual KIP 2.0 specification.

Because this document is still pre-specification, exact wire field names and JSON serialization MAY change. The semantic distinctions and invariants are the important part.

---

# 1. Design Objective

KIP 2.0 is not merely a graph storage model.

The Core Data Model must support this complete causal path:

```text
World / Human / Tool / Other Agent
                │
                ▼
             Evidence
                │
                ▼
            Assertion
                │
                ▼
          Agent Belief View
                │
                ▼
        Event / Experience / Skill
                │
                ▼
       Future Computation / Action
```

while every durable item remains bounded by:

```text
MemorySpace
Principal
Policy
Origin
Time
Schema
```

A successful Core model must therefore preserve six separations:

```text
meaning      ≠ belief
belief       ≠ evidence
evidence     ≠ provenance
provenance   ≠ authority
memory       ≠ truth
governance   ≠ semantics
```

---

# 2. Core Element Taxonomy

KIP 2.0 defines five primary persistent **Cognitive Element** kinds:

```text
Concept
Proposition
Assertion
Evidence
Activity
```

A sixth core object, `MemorySpace`, is a governance container rather than an ordinary Cognitive Element.

```text
                    Cognitive Element
                           │
   ┌───────────┬───────────┼───────────┬───────────┐
   │           │           │           │           │
Concept   Proposition  Assertion   Evidence    Activity
```

These element kinds exist for different reasons and MUST NOT be collapsed merely for graph uniformity.

| Element | Primary question |
| --- | --- |
| `Concept` | What entity, category, abstraction, or referable object is this? |
| `Proposition` | What semantic statement can be referred to? |
| `Assertion` | Who or what takes what epistemic stance toward that proposition? |
| `Evidence` | What observation/artifact/result is cited as support or challenge? |
| `Activity` | Through what transformation, observation, import, inference, or consolidation was something produced? |
| `MemorySpace` | Under whose ownership and policy boundary does this state exist? |

Profile-defined cognitive structures such as:

```text
Person
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Skill
SleepTask
SelfModel
```

are **not additional Core element kinds**. They are normally represented as typed `Concept`s plus profile-defined Structural References and Facets.

---

# 3. The Common Cognitive Element Envelope

Every persistent Cognitive Element MUST carry a common envelope.

Logical form:

```json
{
  "id": "opaque-local-id",
  "kind": "concept | proposition | assertion | evidence | activity",
  "space_id": "memory-space-id",

  "governance": {
    "classification": "optional-label",
    "policy_ref": "optional-policy-id"
  },

  "retention": {
    "retention_class": "optional-class",
    "expires_at": "optional-ISO-8601",
    "legal_hold": false
  },

  "facets": {
    "profile-or-extension-id": {
      "extension_specific_state": "..."
    }
  },

  "_system": {
    "version": 1,
    "created_at": "engine-time",
    "updated_at": "engine-time",
    "created_tx": "transaction-id",
    "updated_tx": "transaction-id",
    "state": "active",
    "origin": {
      "principal_id": "authenticated-principal",
      "channel": "write-channel",
      "import_id": null
    }
  }
}
```

The exact JSON shape is illustrative. The semantic partitions are normative design requirements.

---

# 4. Why KIP 2.0 Removes the Generic Metadata Bag

KIP 1.x uses `metadata` for many unrelated concerns:

```text
source
author
confidence
evidence
created_at
observed_at
validity
supersession
memory_tier
expires_at
access_level
review_info
engine-maintained fields
```

This was pragmatic, but the meanings are no longer compatible enough to remain one undifferentiated namespace.

KIP 2.0 separates them:

```text
semantic payload     → attributes / typed fields
epistemic state      → Assertion
evidence             → Evidence
provenance           → Activity + origin
governance           → governance
storage lifecycle    → retention
memory-specific state→ profile Facets
engine truth         → _system
```

KIP 2.0 therefore SHOULD NOT define a universal author-writable `metadata` object with protocol semantics.

Implementations MAY expose compatibility metadata views, but native Core state must preserve the distinctions above.

---

# 5. Identifiers

## 5.1 Nexus-Local `id`

Every Cognitive Element MUST have an immutable Nexus-local `id`.

Properties:

```text
opaque to clients
stable for the element's lifetime
unique within the Nexus
never reused after deletion
not semantically derived from display name
```

KIP does not mandate UUID, ULID, hash, integer, or any specific ID format.

An implementation MAY expose globally unique IDs, but global uniqueness is not required by Core.

---

## 5.2 `name` Is Not Identity

A `Concept` MAY have a human/LLM-friendly `name`.

Example:

```text
Alice
Project Aurora
Dark Mode
Rust
```

`name` exists for:

```text
grounding
display
search
LLM generation ergonomics
```

It MUST NOT be treated as the universal identity of the entity.

Two Concepts MAY have the same name.

A Concept MAY change its name without changing identity.

---

## 5.3 Logical `key`

A `Concept` MAY carry an immutable Space-local logical `key` for idempotent model-facing addressing.

Example:

```text
key = "alice"
key = "event:2026-08-13:meeting-42"
key = "skill:deploy-db-mismatch"
```

Recommended uniqueness:

```text
(space_id, schema_ref, key)
```

`key` differs from `name`:

```text
key   = stable machine/model address
name  = mutable human-facing label
```

KIP 1.x `type + name` identity can migrate naturally by initializing:

```text
key = legacy name
name = legacy name
```

for types that relied on name identity.

Native KML 2.0 does **not** accept `{type, name}` as identity: a native `UPSERT` must select on `id` or `key`, and name-only upsert is forbidden. Only a `kip-1-compat` profile may translate legacy `type + name` into a migrated `key`. Native Core identity is always `id`.

---

## 5.4 `canonical_id`

A Concept MAY have a `canonical_id` that binds it to a stable cross-system identity.

Examples may include:

```text
URI
URN
DID
domain-specific stable identifier
```

KIP does not mandate any identity scheme.

Because a wrong external identity binding can merge unrelated entities, `canonical_id` SHOULD be treated as a **high-assurance identity binding**, not a casual attribute.

Setting or changing a `canonical_id` SHOULD require stronger policy than changing a display name.

Unverified claims such as:

> "This person is DID X"

SHOULD normally be represented as a Proposition + Assertion until the binding is trusted. The Cognitive Memory Profile provides the `same_as` Predicate for exactly this purpose; it feeds identity review rather than automatic merging, and never establishes `canonical_id` by itself.

---

# 6. Reference Types

KIP 2.0 distinguishes four kinds of reference.

## 6.1 Local Element Reference

```text
ElementRef = same-Space reference to a Cognitive Element by id
```

Illustrative:

```json
{"id": "element-123"}
```

This is the normal persisted reference inside Core objects.

---

## 6.2 Canonical Identity Reference

A semantic actor or imported entity MAY be referred to by a canonical external identity if no local Concept exists.

Illustrative:

```json
{"canonical_id": "did:example:123"}
```

Resolution into a local Concept is implementation/policy dependent.

---

## 6.3 Foreign Space Reference

Baseline KIP 2.0 SHOULD NOT silently create ordinary graph edges across MemorySpaces.

A cross-space reference, when supported, MUST be explicit.

Illustrative:

```json
{
  "space_id": "public://research",
  "element_id": "abc"
}
```

Foreign references:

```text
are policy checked
are not automatically traversed
do not imply import
do not grant destination authority
```

The baseline interoperability model for shared cognition remains:

```text
export → policy/redaction → capsule → import
```

rather than unrestricted cross-space graph traversal.

---

## 6.4 Literal

A Proposition object MAY be a `Literal` rather than an element reference.

Literals are defined in Section 9.

---

# 7. Same-Space Closure Rule

Every Cognitive Element belongs to exactly one `MemorySpace`.

Baseline KIP Core SHOULD enforce:

> **All ordinary persisted ElementRefs inside a Cognitive Element resolve inside the same MemorySpace.**

This rule is intentionally conservative.

Benefits:

```text
prevents accidental cross-space data leakage
makes export/import boundaries explicit
makes policy reasoning tractable
avoids hidden lifetime coupling
keeps graph traversal locally governable
```

Implementations MAY support explicit Foreign Space References as an advertised extension.

---

# 8. Structural References vs. Semantic Propositions

This distinction is fundamental.

KIP 2.0 has two kinds of graph relationship:

```text
Semantic Proposition
Structural Reference
```

## 8.1 Semantic Proposition

A Proposition says something that can be believed, rejected, contested, or uncertain.

Example:

```text
(Alice, prefers, DarkMode)
```

Its truth requires Assertion semantics.

---

## 8.2 Structural Reference

A Structural Reference describes how KIP records are assembled.

Examples:

```text
Assertion.proposition         → Proposition
Assertion.evidence            → Evidence
Assertion.supersedes          → Assertion
Evidence.source               → Concept | Evidence
Evidence.generated_by         → Activity
Activity.inputs               → Cognitive Elements
Activity.outputs              → Cognitive Elements
Experience.has_step           → ExperienceStep   [profile]
```

Core reserves six structural **field names** for query and mutation, resolved
by the source element's Core kind rather than through package aliases:

```text
evidence       Assertion → Evidence            role-qualified citation
source         Evidence  → Concept | Evidence  origin of the observation/artifact
generated_by   Evidence  → Activity            producing Activity
inputs         Activity  → any Core element    provenance inputs
outputs        Activity  → any Core element    provenance outputs
associated_actors  Activity  → Concept         semantic actors involved in the process (not authority, not the Principal)
```

These links are part of record structure.

They are not themselves truth-neutral world propositions requiring another Assertion.

---

## 8.3 Why the Distinction Is Necessary

If:

```text
Assertion A ─ supported_by → Evidence E
```

were always represented as an ordinary Proposition, KIP would immediately face:

> Who asserts that Evidence E supports Assertion A?

which would require another Assertion, whose evidence link would itself require another Proposition, and so on.

Core Structural References prevent this semantic regress.

---

## 8.4 Structural Reference Does Not Mean Epistemic Sufficiency

If an Assertion structurally cites Evidence E as `support`, Core only records:

> This Assertion cites E as supporting evidence.

It does **not** guarantee:

> E actually proves the Proposition.

That judgment belongs to Epistemic Projection and trust policy.

---

# 9. Literal Data Model

## 9.1 Purpose

Many important facts have scalar values:

```text
(Alice, timezone, "+08:00")
(ProjectX, status, "active")
(Service, retry_count, 3)
(FeatureFlag, enabled, true)
```

If these values remain ordinary Concept attributes, they cannot independently carry:

```text
source
confidence
valid time
contradiction
evidence
sharing policy
history
```

KIP 2.0 therefore allows Literal objects in Propositions.

---

## 9.2 Literal Shape

Logical form:

```json
{
  "value": "2026-08-13T10:00:00Z",
  "datatype": "kip:datetime",
  "language": null
}
```

Core literal payload is restricted to JSON scalar semantics:

```text
string
number
boolean
null
```

Complex arrays and objects are not Core literals.

If a structured object needs first-class semantic identity, it SHOULD be represented as a Concept or profile-defined Value Object.

---

## 9.3 Primitive Shorthand

A model-facing syntax MAY allow:

```text
"+08:00"
3
true
```

as shorthand for typed Core Literals.

The canonical internal model still distinguishes datatype.

---

## 9.4 Literal Equality

Proposition identity depends on deterministic Literal equality.

Core rules:

```text
string  → exact Unicode scalar value unless datatype defines otherwise
boolean → true != false
null    → equal only to null
number  → equal by normalized finite numeric value
```

`NaN`, `Infinity`, and `-Infinity` are not valid Core JSON numbers.

Numeric lexical forms that represent the same finite value SHOULD canonicalize to the same Literal identity.

Example:

```text
1
1.0
1e0
```

SHOULD NOT create three distinct semantic Propositions if parsed as the same Core number.

Exact canonicalization is finalized in the Cognitive Capsule specification.

---

## 9.5 Language-Tagged Strings

A Literal MAY carry a language tag when language is semantically relevant.

Example:

```json
{
  "value": "苹果",
  "datatype": "string",
  "language": "zh-Hans"
}
```

Language affects Literal identity.

---

## 9.6 `null`

`null` MAY be used only when the Predicate schema explicitly permits it.

In most knowledge modeling:

```text
unknown
```

SHOULD be represented as absence of an accepted value or an uncertain Assertion, not as a literal claim of `null`.

---

# 10. Concept

## 10.1 Definition

A `Concept` is a referable semantic resource.

It may denote:

```text
person
organization
place
project
artifact
abstract idea
category
event
experience
skill
hypothetical entity
profile-defined cognitive object
```

A Concept existing in the Nexus does not prove that the corresponding real-world entity exists.

Existence itself, when epistemically important, can be represented through a Proposition + Assertion.

---

## 10.2 Logical Shape

```json
{
  "id": "concept-123",
  "kind": "concept",
  "space_id": "space-1",

  "schema_ref": "kip://profiles/example@2.0.0/Person",
  "key": "alice",
  "name": "Alice",
  "canonical_id": null,
  "aliases": ["Alice Chen"],

  "attributes": {
    "display_hint": "..."
  },

  "facets": {},
  "governance": {},
  "retention": {},
  "_system": {}
}
```

---

## 10.3 `schema_ref`

Every Concept MUST identify its Concept Type through a version-resolvable `schema_ref`.

The exact Schema Package URI grammar is defined later.

Core requirement:

```text
schema_ref must resolve to a Concept Type definition
```

---

## 10.4 Concept Attributes

Attributes remain valuable.

Use them for state that is:

```text
intrinsic to the local representation
not independently disputed
not separately sourced
not independently time-valid
not separately permissioned
not independently exchanged as a factual claim
```

Examples:

```text
display hint
cached summary
UI ordering
derived counter
profile-local operational state
compact structured payload
```

---

## 10.5 Attribute Escalation Rule

A value SHOULD be promoted from an attribute into Proposition + Assertion if any of these become necessary:

```text
independent source
independent confidence
contradiction
validity interval
retraction
evidence
sharing policy
cross-space exchange
historical evolution
```

This is the primary rule preventing the reappearance of KIP 1.x metadata coupling.

---

## 10.6 Names and Aliases Are Grounding State

`name` and `aliases` are grounding aids, not universal world facts.

If the historical fact:

> Alice was known as "Alicia" from 2019–2022

matters epistemically, represent it as a Proposition + Assertion rather than relying only on the current `aliases` array.

---

# 11. Concept Merge and Identity Consolidation

Entity consolidation is essential in an evolving memory brain.

However, KIP 2.0 MUST preserve historical referential integrity.

## 11.1 Merge Does Not Rewrite History

KIP 1.x `MERGE` may repoint graph edges.

KIP 2.0 SHOULD adopt a more conservative semantic model:

```text
Concept A
   _system.state = merged
   merged_into   = Concept B
```

Concept A remains an addressable historical identity record.

New writes resolve to B.

Raw historical Propositions may continue to reference A.

---

## 11.2 Canonical Resolution

The engine maintains a resolution function:

```text
resolve_concept(A) → B
```

`resolve_concept` follows `merged_into` to its fixpoint, so a merge MUST NOT create a cycle: the runtime MUST reject a merge whose target already resolves, transitively, to the source.

Default semantic queries MAY canonicalize merged identities.

Raw/audit queries MUST be able to recover the original referenced ID.

---

## 11.3 Why Non-Destructive Merge Matters

Suppose an imported document asserted something about:

```text
"JS"
```

before the agent later determined:

```text
JS == JavaScript
```

The original Assertion should still be auditable as having referenced the historical "JS" Concept.

Identity consolidation should improve future reasoning without falsifying the past representation.

---

## 11.4 Canonical Proposition Deduplication After Merge

If:

```text
P1 = (ConceptA, knows, Bob)
P2 = (ConceptB, knows, Bob)
```

and A merges into B, KIP may discover that P1 and P2 now canonicalize to the same semantic statement.

The engine MAY mark one Proposition as canonically merged into the other.

It MUST preserve Assertion references and raw provenance.

The exact `MERGE` mutation semantics are defined in KIP-2.0-KML.md.

---

# 12. Proposition

## 12.1 Definition

A `Proposition` is an immutable, truth-neutral semantic statement.

Canonical form:

```text
(subject, predicate, object)
```

The Proposition exists so it can be referred to.

Its existence is not a belief.

---

## 12.2 Logical Shape

```json
{
  "id": "prop-123",
  "kind": "proposition",
  "space_id": "space-1",

  "subject": {"id": "concept-alice"},
  "predicate_ref": "kip://profiles/personal@2.0.0/prefers",
  "object": {"id": "concept-dark-mode"},

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

Literal object:

```json
{
  "subject": {"id": "concept-alice"},
  "predicate_ref": "kip://profiles/personal@2.0.0/timezone",
  "object": {
    "value": "+08:00",
    "datatype": "string"
  }
}
```

---

## 12.3 Allowed Terms

Baseline:

```text
subject = ElementRef
object  = ElementRef | Literal
```

A subject cannot be a Literal.

A Predicate schema MAY restrict:

```text
allowed subject kinds
allowed subject schema types
allowed object kinds
allowed object schema types
allowed literal datatypes
cardinality
```

---

## 12.4 Propositions May Refer to Any Cognitive Element

A Proposition MAY make a semantic statement about:

```text
Concept
Proposition
Assertion
Evidence
Activity
```

if the Predicate schema permits it.

Example:

```text
(ReviewerConcept, approved, Assertion42)
```

This is a semantic statement and therefore still needs an Assertion to become believed.

This is different from the Core structural field:

```text
Assertion42.evidence
```

which is record structure.

---

## 12.5 Proposition Structural Identity

Within one MemorySpace, a Proposition is structurally identified by:

```text
canonical(subject)
+
predicate_ref
+
canonical(object)
```

For resource references, canonicalization accounts for merge redirects.

For literals, canonicalization uses typed Literal equality.

---

## 12.6 Uniqueness

KIP 2.0 SHOULD maintain one active canonical Proposition per semantic tuple within a MemorySpace.

Conceptually:

```text
UNIQUE(
  space_id,
  canonical_subject,
  predicate_ref,
  canonical_object
)
```

Many Assertions may target that one Proposition.

---

## 12.7 Proposition Immutability

The semantic tuple:

```text
subject
predicate_ref
object
```

MUST be immutable after Proposition creation.

Changing any component creates or resolves to another Proposition.

This prevents epistemic history from silently changing meaning under an existing Proposition ID.

---

## 12.8 Proposition Has No Epistemic Confidence

A native KIP 2.0 Proposition MUST NOT carry protocol-level fields such as:

```text
confidence
asserted_by
source
observed_at
valid_from
valid_until
superseded
```

Those belong to Assertion/Evidence/Provenance.

---

## 12.9 Proposition Attributes

Native Core Propositions SHOULD NOT support arbitrary mutable semantic attributes.

If a relation requires additional semantically meaningful qualifiers, use one of:

1. another Proposition about the Proposition;
2. a relation/event Concept representing an n-ary relationship;
3. a profile-defined semantic structure.

Example:

Instead of:

```text
(Alice, works_for, Acme)
attributes = {
  role: "Engineer",
  since: "2024"
}
```

prefer:

```text
Employment E
E ─ employee → Alice
E ─ employer → Acme
E ─ role → "Engineer"
E ─ valid_from → 2024
```

with Assertions over claims that need epistemic treatment.

This avoids hidden semantic facts inside proposition payload.

---

# 13. Negative and False Claims

KIP 2.0 distinguishes:

```text
epistemic rejection
semantic false literal
```

## 13.1 Epistemic Rejection

To express:

> Carol rejects the claim that Bob is vegetarian.

Use:

```text
P = (Bob, is_vegetarian, true)

Assertion:
  proposition = P
  stance = reject
```

---

## 13.2 Semantic Boolean Value

If a Predicate explicitly models a boolean-valued property, it MAY also be semantically valid to create:

```text
(Bob, is_vegetarian, false)
```

This is a different Proposition.

The Epistemic Model must define how boolean opposites interact.

---

## 13.3 Rule

Prefer:

```text
stance = reject
```

when modeling an actor's disagreement with a proposition.

Use literal `false` only when `false` is genuinely the value of the Predicate.

---

# 14. Assertion

## 14.1 Why Assertion Is a Dedicated Element Kind

Assertion semantics are too fundamental to rely on a conventional user-defined Concept Type.

The engine needs to enforce:

```text
exactly one target Proposition
valid stance values
lifecycle semantics
origin separation
immutability rules
evidence reference integrity
policy checks
temporal fields
supersession rules
```

Making Assertion an ordinary Concept would allow schemas to accidentally redefine those invariants.

Therefore `Assertion` is a native Core element kind.

---

## 14.2 Definition

An `Assertion` records an epistemic commitment toward one Proposition.

One Assertion targets exactly one Proposition.

---

## 14.3 Logical Shape

```json
{
  "id": "assertion-123",
  "kind": "assertion",
  "space_id": "space-1",

  "proposition": {"id": "prop-123"},

  "asserted_by": {
    "id": "concept-alice"
  },

  "stance": "support",
  "mode": "stated",
  "confidence": 0.9,

  "valid_time": {
    "from": null,
    "until": null
  },

  "asserted_at": "2026-08-13T10:00:00Z",

  "evidence": [
    {
      "id": "evidence-1",
      "role": "support"
    }
  ],

  "lifecycle": {
    "status": "active",
    "supersedes": [],
    "superseded_by": [],
    "retracted_at": null
  },

  "context_refs": [],

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

---

## 14.4 `asserted_by`

`asserted_by` represents the **semantic actor claimed to hold or produce the assertion**.

It is not the authenticated caller.

Examples:

```text
Alice
an organization
an external agent
a model-derived inference actor
a research paper author
```

`asserted_by` MAY be absent when no meaningful semantic actor can be resolved.

The authenticated writer remains available independently in:

```text
_system.origin.principal_id
```

---

## 14.5 Stance

Core stance values:

```text
support
reject
uncertain
```

Profiles MAY extend stance only through namespaced extensions.

The base meanings MUST remain stable.

---

## 14.6 Mode

Recommended Core modes:

```text
observed
stated
inferred
predicted
hypothetical
imported
```

Meaning:

| Mode | Meaning |
| --- | --- |
| `observed` | Produced directly from an observation/measurement/tool/world signal |
| `stated` | Attributed to a person/organization/agent statement |
| `inferred` | Derived from other cognitive state |
| `predicted` | Forward-looking claim |
| `hypothetical` | Deliberately non-committed scenario/model |
| `imported` | Preserved from an external memory source |

`mode` does not determine trust.

---

## 14.7 Confidence

`confidence` answers:

> How strongly does this Assertion support its own stance under the stated conditions?

Range:

```text
0.0 ≤ confidence ≤ 1.0
```

`confidence` is OPTIONAL because some imported or quoted assertions may not provide a meaningful numeric confidence.

It MUST NOT be interpreted as:

```text
source trust
memory strength
salience
utility
probability assigned by the engine
```

---

# 15. Assertion Immutability and Revision

A core goal of KIP 2.0 is preserving epistemic history.

Therefore an Assertion is conceptually a statement made at a time, not a mutable slot containing the latest opinion.

## 15.1 Immutable Assertion Payload

After creation, these fields SHOULD be immutable:

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

If the epistemic commitment materially changes, create a new Assertion.

---

## 15.2 Mutable Lifecycle Envelope

These fields MAY change under authorized mutation:

```text
status
superseded_by
retracted_at
retention
governance
review facets
```

New evidence discovered later SHOULD usually produce:

```text
a new Assertion revision
or
a derived Assertion
```

rather than rewriting what the earlier actor originally believed.

---

## 15.3 Why Confidence Is Not Repeatedly Mutated

Suppose:

```text
2026-01: confidence = 0.6
2026-03: new evidence arrives
2026-03: confidence = 0.9
```

If one Assertion is mutated from `0.6 → 0.9`, the system loses the historical epistemic state.

Prefer:

```text
Assertion A1
  asserted_at = 2026-01
  confidence = 0.6

Assertion A2
  asserted_at = 2026-03
  confidence = 0.9
  supersedes = A1
```

Now the Brain can answer:

```text
What did we believe in January?
What evidence changed our belief in March?
```

---

## 15.4 Repetition Is Not Revision

If Alice independently states the same preference three times, the system MAY preserve three Assertions or three Evidence items associated with a derived stable Assertion.

The Epistemic Model decides how repetition affects confidence.

Core does not collapse repeated observations automatically.

---

# 16. Assertion Lifecycle

Core lifecycle values:

```text
active
retracted
superseded
expired
```

## 16.1 Active

The Assertion remains part of current epistemic state.

---

## 16.2 Retracted

The assertor or an authorized process explicitly withdraws the Assertion.

Retraction does not delete history.

---

## 16.3 Superseded

A newer Assertion replaces the older one for a defined actor/context/temporal interpretation.

Supersession is not generic contradiction.

Two actors can disagree indefinitely without either Assertion superseding the other.

---

## 16.4 Expired

The Assertion's applicability window has passed or a policy-defined assertion lifecycle has ended.

This status is distinct from storage deletion.

---

# 17. Evidence

## 17.1 Why Evidence Is a Dedicated Element Kind

Evidence must be:

```text
addressable
shareable
digestible
policy-controlled
provenance-linked
citable by multiple Assertions
independently corrected/retracted
potentially large or externally stored
```

This justifies a native Core element.

---

## 17.2 Definition

`Evidence` is a durable cognitive artifact cited in support of or challenge to one or more Assertions.

Evidence existence does not prove the Evidence is correct.

---

## 17.3 Logical Shape

```json
{
  "id": "evidence-123",
  "kind": "evidence",
  "space_id": "space-1",

  "evidence_class": "tool_result",

  "payload": {
    "mode": "external",
    "content_ref": "urn:sha256:...",
    "inline": null
  },

  "content_digest": "sha256:...",
  "media_type": "application/json",

  "observed_at": "2026-08-13T10:00:00Z",

  "source": [
    {"id": "concept-service-api"}
  ],

  "generated_by": "activity-12",

  "lifecycle": {
    "status": "active",
    "corrects": [],
    "corrected_by": []
  },

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

---

# 18. Evidence Classes

Recommended baseline classes:

```text
observation
user_statement
agent_statement
tool_result
measurement
message
document
web_resource
external_assertion
human_feedback
derived_result
```

Classes describe what kind of evidence artifact this is.

They do not assign trust.

---

# 19. Evidence Payload

Evidence supports two primary payload modes.

## 19.1 Inline

For compact immutable data:

```json
{
  "mode": "inline",
  "inline": {
    "status": "healthy",
    "version": "2.1.4"
  }
}
```

---

## 19.2 External / Content-Addressed

For:

```text
documents
large tool results
images
logs
web snapshots
binary files
long transcripts
```

use:

```json
{
  "mode": "external",
  "content_ref": "https://... or content-addressed URI",
  "content_digest": "sha256:..."
}
```

A digest SHOULD be present whenever stable verification is possible.

---

## 19.3 Raw Content Is Not Always Memory

Large raw evidence may be retained externally while the Cognitive Nexus stores only:

```text
reference
digest
media type
observation time
provenance
policy
```

This keeps the cognitive graph compact without losing auditability.

---

# 20. Evidence Immutability

Evidence payload SHOULD be immutable after creation.

If a source document changes:

```text
new snapshot
→ new Evidence
```

If a measurement is later discovered to be wrong:

```text
old Evidence remains
new Evidence corrects old Evidence
```

Do not silently rewrite the historical artifact.

Mutable Evidence lifecycle fields may include:

```text
status
corrected_by
retention
governance
review annotations
```

---

# 21. Evidence Support and Challenge Links

An Assertion may structurally cite Evidence with a role:

```text
support
challenge
context
```

Illustrative:

```json
"evidence": [
  {"id": "E1", "role": "support"},
  {"id": "E2", "role": "challenge"}
]
```

The same Evidence MAY be cited by multiple Assertions.

Core does not prescribe numeric evidence weighting.

---

# 22. Activity

## 22.1 Why Activity Is Core

A real memory brain must answer not only:

> What source existed?

but:

> What process transformed one cognitive artifact into another?

Examples:

```text
webpage extraction
tool execution
human review
inference
summarization
consolidation
skill compilation
capsule import
schema migration
entity merge
```

`Activity` provides the backbone of the provenance DAG.

---

## 22.2 Definition

An `Activity` represents a bounded process that used, transformed, observed, or generated Cognitive Elements or external artifacts.

---

## 22.3 Logical Shape

```json
{
  "id": "activity-123",
  "kind": "activity",
  "space_id": "space-1",

  "activity_class": "semantic_consolidation",

  "started_at": "2026-08-13T10:10:00Z",
  "ended_at": "2026-08-13T10:10:03Z",

  "inputs": [
    {"id": "evidence-1"},
    {"id": "evidence-2"}
  ],

  "outputs": [
    {"id": "assertion-9"}
  ],

  "associated_actors": [
    {"id": "concept-system-agent"}
  ],

  "parameters_digest": "sha256:...",
  "status": "completed",

  "governance": {},
  "retention": {},
  "facets": {},
  "_system": {}
}
```

---

# 23. Provenance DAG

The recommended Core provenance pattern is:

```text
Element / External Artifact
          │
          │ input
          ▼
       Activity
          │
          │ output
          ▼
       Element
```

Example:

```text
WebPage Snapshot
      │
      ▼
Extraction Activity
      │
      ▼
Evidence E1
      │
      ▼
Inference Activity
      │
      ▼
Assertion A1
      │
      ▼
Consolidation Activity
      │
      ▼
Insight / Skill
```

The graph can be traversed backward to recover derivation.

---

# 24. Claimed Provenance vs. Engine Origin

This separation is security-critical.

## 24.1 Claimed Provenance

Ordinary cognitive state may claim:

```text
Alice said X
Document Y contained X
Tool Z returned X
```

These claims can themselves be wrong.

They are represented through:

```text
asserted_by
Evidence.source
Activity.associated_actors
semantic Propositions
```

---

## 24.2 Engine Origin

Every persisted element has an engine-maintained `_system.origin`.

Example:

```json
{
  "principal_id": "principal:agent-42",
  "channel": "formation",
  "import_id": null
}
```

This answers:

> Who actually caused this record to be created in this Nexus?

It does not answer:

> Who does the record claim originally said the content?

---

# 25. `_system`

`_system` contains engine truth.

Recommended fields:

```json
{
  "version": 4,
  "created_at": "2026-08-13T10:00:00Z",
  "updated_at": "2026-08-13T10:10:00Z",
  "created_tx": "tx-create",
  "updated_tx": "tx-update",
  "state": "active",

  "origin": {
    "principal_id": "principal-1",
    "channel": "direct | formation | maintenance | import | migration | system",
    "import_id": null
  }
}
```

Implementations MAY add additional underscore-prefixed fields.

Clients MUST treat unknown `_system` fields as read-only.

---

# 26. Engine Origin Is Non-Malleable

Author-level operations MUST NOT be able to:

```text
change principal_id
rewrite created_tx
rewrite created_at
pretend an imported record was locally observed
replace an import origin with a trusted tool origin
```

Derived content gets a **new local origin** describing the derivation write.

Its earlier provenance remains reachable through Activity inputs and imported origin receipts.

---

# 27. Exported Origin vs. Destination Origin

`_system` is local engine truth and MUST NOT be imported into another Nexus as if it were destination engine truth.

Instead:

```text
Source Space
  _system.origin
       │
       ▼ export
Portable Origin Receipt / Capsule Provenance
       │
       ▼ import
Destination Evidence / Provenance
       +
new destination _system.origin
```

The destination records:

```text
who imported it
when
under what transaction
from which capsule
```

while preserving source-origin information as imported provenance.

This prevents authority laundering across Nexus boundaries.

The exact portable receipt format is defined by KIP-2.0-Capsule.md.

---

# 28. MemorySpace

## 28.1 Definition

A `MemorySpace` is the primary ownership, policy, schema, and isolation boundary of KIP 2.0.

It is not a semantic Domain.

---

## 28.2 Logical Shape

```json
{
  "id": "space-123",
  "uri": "personal://yan",
  "name": "Yan Personal Brain",

  "owners": [
    "principal:yan"
  ],

  "default_policy_ref": "policy-1",

  "schema_packages": [
    "kip://core@2.0.0",
    "kip://profiles/cognitive-memory@2.0.0"
  ],

  "status": "active",

  "_system": {
    "created_at": "...",
    "updated_at": "..."
  }
}
```

The exact governance fields are finalized in KIP-2.0-Governance.md.

---

# 29. One Home Space Per Element

Every Cognitive Element MUST have exactly one `space_id`.

This does not mean a semantic entity can exist in only one Space.

Example:

```text
personal://yan  → Concept "KIP"
org://alink     → Concept "KIP"
public://tech   → Concept "KIP"
```

These Concepts may share a canonical external identity but remain separately governed cognitive records.

This avoids making one Space's policy dependent on another Space's internal graph.

---

# 30. Space Is Not Domain

```text
MemorySpace = ownership / governance / trust boundary
Domain      = topic / semantic organization
```

`Domain` is not a Core element kind.

A Cognitive Profile or semantic package may define `Domain` as a Concept Type.

A single MemorySpace may contain many Domains.

The same Domain label may occur independently in many Spaces.

---

# 31. Governance Hook on Every Element

Every Cognitive Element may carry:

```json
"governance": {
  "classification": "private",
  "policy_ref": "policy-sensitive-profile"
}
```

If absent, Space defaults apply.

Governance semantics are engine-enforced.

A prompt MUST NOT be the final privacy boundary.

---

# 32. Proposition Existence Is Sensitive Data

Even though a Proposition is truth-neutral, its existence can leak information.

Example:

```text
(Alice, has_medical_condition, ConditionX)
```

reveals a sensitive subject even if all Assertions are rejected or uncertain.

Therefore governance MUST apply to:

```text
Concept
Proposition
Assertion
Evidence
Activity
```

not only to Assertions.

Unauthorized queries MUST NOT leak:

```text
element existence
counts
search hits
graph degree
error differences
```

where policy forbids such disclosure.

Detailed side-channel rules belong in KIP-2.0-Governance.md.

---

# 33. Retention

Retention is a storage/lifecycle concern, not world validity and not memory accessibility.

Common optional structure:

```json
{
  "retention_class": "transient | standard | durable | legal_hold",
  "expires_at": "2026-12-01T00:00:00Z",
  "legal_hold": false
}
```

Exact class names are policy/profile-defined.

---

# 34. `expires_at` Is Not `valid_time.until`

These fields answer different questions.

```text
Assertion.valid_time.until
    When is the claim said to stop being true/applicable in the world?

Element.retention.expires_at
    When may the storage system consider archiving/purging this record?
```

Example:

```text
Alice's old timezone stopped being valid in 2025.
The Assertion about that old timezone may remain stored forever for history.
```

Therefore:

```text
valid_time.until = 2025
expires_at       = null
```

is perfectly valid.

---

# 35. Facets

## 35.1 Purpose

Profiles need to extend Core elements without reintroducing an untyped metadata bag.

KIP 2.0 uses **Facets**.

Logical form:

```json
"facets": {
  "kip://profiles/cognitive-memory@2.0.0/MnemonicState": {
    "memory_strength": 0.72,
    "salience": 0.91
  }
}
```

---

## 35.2 Facet Rules

Each Facet key is the exact Facet symbol reference and MUST resolve to:

```text
a Facet symbol in a Schema Package
or
a registered extension definition
```

Facet fields SHOULD be machine validated.

---

## 35.3 Cognitive Memory Facet

The Cognitive Memory Profile may define:

```text
memory_strength
salience
utility
learning_value
consolidation_status
memory_class
```

These are not Core truth semantics.

---

## 35.4 Facets Cannot Bypass the Epistemic Model

A profile MUST NOT hide independently disputed world facts inside a Facet merely to avoid Assertion semantics.

If a Facet value requires:

```text
source
confidence
validity
contradiction
evidence
```

it should generally become a Proposition + Assertion.

---

# 36. Temporal Fields

KIP 2.0 recognizes four clocks.

## 36.1 Valid Time

On Assertion:

```text
valid_time.from
valid_time.until
```

When the Proposition is claimed to hold in the world.

---

## 36.2 Observation Time

On Evidence:

```text
observed_at
```

When the evidence was observed or captured.

---

## 36.3 Assertion Time

On Assertion:

```text
asserted_at
```

When the semantic actor made/generated the assertion.

---

## 36.4 Engine Transaction Time

In `_system`:

```text
created_at
updated_at
created_tx
updated_tx
```

When the Nexus recorded state.

---

# 37. Bitemporal Capability Requirement

The data model MUST preserve enough information for future queries to distinguish:

> What was true at world time T?

from:

> What did this agent know/believe as of cognitive transaction time T?

KQL has since settled that syntax: `AS OF` selects cognitive transaction state
and `FOR TIME` selects world-valid time, and the two MUST remain independent.

The data model must not need another redesign to support it.

---

# 38. Accepted Belief Is a View, Not Core State

KIP Core stores:

```text
Propositions
Assertions
Evidence
Provenance
Policy
Time
```

It does not store one universal:

```text
truth = true
accepted = true
current_fact = true
```

as canonical state.

Instead:

```text
Raw Cognitive State
        │
        ▼
Epistemic Projection
        │
        ├ accepted
        ├ contested
        ├ uncertain
        └ rejected
```

Different consuming agents or purposes may legitimately compute different projections.

The Epistemic Model defines projection inputs and outputs.

---

# 39. Trust Is Not Copied Onto Propositions

Trust is contextual.

Example:

```text
Alice self-report about Alice's color preference → high trust
Alice self-report about production server health → low/unknown trust
Verified deployment tool result about server health → high trust
Imported unsigned Skill about shell execution → near-zero action authority
```

Therefore KIP Core SHOULD NOT copy a global `trust` number onto every Proposition.

Trust is evaluated over:

```text
principal
semantic actor
Evidence class
origin
purpose
Space policy
context
```

---

# 40. Memory Strength Is Not Core Belief State

`memory_strength` belongs to the Cognitive Memory Profile.

A fact may be:

```text
high confidence
low memory strength
```

A failed Experience may be:

```text
low procedural utility
high learning value
high salience
```

Core preserves the element.

The profile decides mnemonic competition.

---

# 41. Deletion Model

KIP 2.0 distinguishes:

```text
epistemic lifecycle
retention lifecycle
logical deletion
physical purge
```

---

## 41.1 Assertion Retraction Is Not Deletion

```text
status = retracted
```

preserves historical belief.

---

## 41.2 Archive Is Not Purge

An archived memory can be excluded from normal recall while remaining available for audit.

---

## 41.3 Tombstone

A Core element MAY enter a logical deletion state:

```text
_system.state = tombstoned
```

before physical purge.

A tombstone SHOULD preserve enough identity to prevent accidental ID reuse and to maintain reference integrity.

---

## 41.4 Physical Purge

Physical purge removes bytes.

It SHOULD be:

```text
policy controlled
auditable
reference aware
conservative for Evidence
```

If legal/privacy policy requires immediate purge, that policy overrides retention recommendations.

---

# 42. Reference Integrity on Deletion

An engine MUST NOT silently leave dangling mandatory references.

Before purging:

```text
Assertion → Proposition
Assertion → Evidence
Evidence → Activity
Activity → input/output
```

the engine must either:

```text
prevent deletion
cascade under explicit semantics
replace with tombstone reference
redact under policy
```

depending on object type and governance rules.

The exact delete behavior belongs in KML and Governance.

---

# 43. Evidence Deletion Is High Impact

Deleting counter-evidence can artificially strengthen a future belief.

Therefore Evidence deletion SHOULD receive stricter treatment than deleting an ordinary cache-like Concept.

High-impact Evidence deletion SHOULD be:

```text
authorized
audited
visible in change stream
preserve tombstone when policy permits
```

---

# 44. Derived Cognitive Elements

Insights, Knowledge assertions, summaries, and Skills may be derived from earlier elements.

Derived outputs SHOULD be associated with an `Activity`.

Example:

```text
Evidence E1
Evidence E2
    │
    ▼
Activity: semantic_consolidation
    │
    ▼
Assertion A9
```

For Skill formation:

```text
Experience X
Experience Y
    │
    ▼
Activity: procedural_consolidation
    │
    ▼
Skill S
```

This preserves revision capability.

---

# 45. Derived Authority Cannot Self-Elevate

A locally generated derived object can have a trusted **local origin** while still depending on untrusted inputs.

Therefore:

```text
local origin
≠
high epistemic authority
≠
high action authority
```

Authority elevation requires explicit policy/validation.

This is especially important for:

```text
Skill
prompt
code
tool policy
sub-agent configuration
```

---

# 46. Structural Data Model for Experience Profiles

The Core model does not define Experience, but it must support it cleanly.

A profile may represent:

```text
Experience        → Concept
ExperienceStep    → Concept
Skill             → Concept
```

with profile Structural References such as:

```text
Experience.has_step       → ExperienceStep   (ordered)
Experience.experienced_by → actor Concept
Skill.compiled_from       → Experience
Skill.compiled_by         → Activity
```

These may be profile-native structural fields or profile-defined graph relations.

Step order belongs to the ordered `has_step` references (Section 74), exposed to queries as `?edge.index`. Steps carry no separate order attribute.

If the profile wants a relation to be independently epistemically disputable, it must use a Proposition + Assertion instead.

---

# 47. Structural vs. Epistemic Example: Experience Step

Suppose:

```text
Experience E has step S3
```

As an internal record structure:

```text
E.has_step → S3
```

is Structural.

But:

> Step S3 caused the failure

is a semantic causal claim:

```text
P = (S3, caused, FailureEvent)
Assertion A supports P
```

Sequence must not be mistaken for causality.

---

# 48. Schema References

Core Data Model uses opaque version-resolvable references:

```text
schema_ref
predicate_ref
facet namespace
```

Illustrative:

```text
kip://core@2.0.0/Assertion
kip://profiles/cognitive-memory@2.0.0/Experience
kip://ldclabs/organization@1.3.0/works_for
```

The exact identifier grammar is deferred to KIP-2.0-Schema-Packages.md.

Core requirement:

> A reference must resolve deterministically to one schema definition in the execution context.

---

# 49. Core Built-In Types vs. Schema Types

Native element kinds are fixed:

```text
Concept
Proposition
Assertion
Evidence
Activity
```

Concept Types are schema-defined:

```text
Person
Organization
Project
Experience
Skill
Domain
```

Predicate Types are schema-defined:

```text
prefers
works_for
located_in
caused
depends_on
```

Assertion stance/mode and Evidence/Activity class registries may have Core values plus namespaced extension values.

---

# 50. Schema Validation Boundary

The engine MUST validate at least:

```text
element kind shape
required Core fields
reference kind
same-space closure
Proposition subject/object legality
Predicate registration
Literal datatype constraints
Assertion stance/mode legality
Assertion target existence
Evidence reference existence
system-field immutability
```

Profile/schema validation may add:

```text
attribute requirements
cardinality
allowed target types
facet shape
domain-specific constraints
```

---

# 51. Model-First Ergonomic Projection

The canonical data model is more explicit than KIP 1.x.

The model-facing DSL should not force an LLM to manually create all low-level objects for common cases.

Example input intent:

```text
Alice prefers dark mode.
```

may compile conceptually to:

```text
1. resolve/create Alice Concept
2. resolve/create DarkMode Concept
3. canonicalize Proposition(Alice, prefers, DarkMode)
4. create Assertion:
     stance = support
     mode = stated
     asserted_by = Alice
5. attach Evidence for the user statement
6. attach engine origin automatically
```

KIP 2.0 SHOULD provide sugar for this workflow.

The sugar must not weaken the canonical semantics.

---

# 52. Desugaring Is Part of Protocol Semantics

If a concise KML form auto-creates:

```text
Proposition
Assertion
Evidence
```

the protocol must define deterministic desugaring.

Two conforming engines given the same normalized input should agree on:

```text
which element kinds are created
which fields are inferred
what defaults apply
which origin is engine-maintained
```

This prevents ergonomic syntax from becoming implementation-specific epistemology.

---

# 53. Raw View vs. Projected View

The Core model anticipates at least two read representations.

## 53.1 Raw Core View

Shows:

```text
Concept
Proposition
Assertion
Evidence
Activity
system origin
```

without belief collapse.

---

## 53.2 Epistemic Projection View

Shows:

```text
accepted
contested
uncertain
rejected
```

for a consuming principal/purpose/time.

---

## 53.3 Compatibility View

A KIP 1.x-compatible query MAY see an accepted Proposition as if it were a traditional fact link.

This is a view, not canonical storage.

---

# 54. Element Mutability Matrix

Recommended Core mutability:

| Element / field | Mutable? | Rule |
| --- | --- | --- |
| `id` | No | immutable |
| `space_id` | No | move = export/import or explicit privileged migration |
| Concept `schema_ref` | Normally No | type migration is explicit |
| Concept `key` | No | idempotent logical identity |
| Concept `name` | Yes | grounding label |
| Concept `canonical_id` | Restricted | identity-binding operation |
| Concept `attributes` | Yes | schema/policy governed |
| Concept Structural References | Yes | SET/UNSET per reference; cardinality validated at commit |
| Proposition tuple | No | new tuple = new Proposition |
| Assertion epistemic payload | No | new belief = new Assertion |
| Assertion lifecycle | Yes | retract/supersede |
| Assertion / Evidence Structural References | No | wrong reference is corrected by a new record, never removed |
| Evidence payload | No | correction = new Evidence |
| Evidence lifecycle | Yes | correction/retraction/archive |
| Activity inputs/outputs | No after completion | provenance integrity |
| Activity status | Yes until terminal | controlled transition |
| governance | Yes | policy-controlled |
| retention | Yes | policy-controlled |
| facets | Profile-defined | profile rules |
| `_system` | Engine only | non-author-writable |

---

# 55. Activity Lifecycle

Recommended:

```text
pending
running
completed
failed
cancelled
```

Once terminal, these SHOULD become immutable:

```text
inputs
outputs
associated actors
parameters digest
start/end time
```

A correction to an Activity record SHOULD create:

```text
new Activity
or
audit correction record
```

rather than rewriting provenance.

---

# 56. Activity Attestation Level

Not all Activity records have equal provenance strength.

Recommended field/facet:

```text
record_mode:
  engine_observed
  actor_reported
  imported
```

Meaning:

```text
engine_observed
    Nexus/runtime can attest it executed or directly observed the activity.

actor_reported
    An actor claims the activity happened.

imported
    The activity record came from another system/capsule.
```

This field does not itself determine trust but prevents provenance claims from being mistaken for engine observation.

---

# 57. Assertion Example: User Statement

User says:

> "I prefer dark mode."

Core state:

```text
Concept Alice
Concept DarkMode

P1 = (Alice, prefers, DarkMode)

Evidence E1
  class = user_statement
  payload = message fragment
  observed_at = T1

Assertion A1
  proposition = P1
  asserted_by = Alice
  stance = support
  mode = stated
  confidence = optional
  evidence = E1

_system.origin(A1)
  principal = authenticated calling agent/user channel
```

The source statement and writer origin remain distinct.

---

# 58. Assertion Example: Tool Observation

Tool returns:

```text
deployment_status = healthy
```

Core state:

```text
P2 = (Deployment42, status, "healthy")

Evidence E2
  class = tool_result
  content_digest = ...
  observed_at = T2

Assertion A2
  proposition = P2
  stance = support
  mode = observed
  evidence = E2
```

Trust in E2 depends on tool/origin policy.

---

# 59. Assertion Example: Inference

From:

```text
A1
A2
```

the Brain infers:

```text
P3
```

Create:

```text
Activity I1
  class = inference
  inputs = A1, A2
  outputs = A3

Assertion A3
  proposition = P3
  mode = inferred
  evidence may cite derived_result Evidence
```

The inference does not erase its source chain.

---

# 60. Contradiction Example

```text
P1 = (Bob, is_vegetarian, true)

A1
  asserted_by = Alice
  stance = support
  confidence = 0.9

A2
  asserted_by = Carol
  stance = reject
  confidence = 0.8
```

Both are valid Core state.

No automatic corruption exists.

No Proposition needs deletion.

An Epistemic Projection decides whether the result is:

```text
accepted
rejected
contested
uncertain
```

---

# 61. Temporal Evolution Example

```text
P1 = (Alice, timezone, "+08:00")
P2 = (Alice, timezone, "+01:00")
```

Assertions:

```text
A1 supports P1
  valid_until = 2026-09-01

A2 supports P2
  valid_from = 2026-09-01
```

No overwrite is necessary.

The Brain can reconstruct history directly.

---

# 62. Correction vs. Contradiction

These are different.

## Correction

Same source/process acknowledges earlier claim was wrong:

```text
A2 supersedes A1
```

## Contradiction

Independent assertions disagree:

```text
A1 and A2 coexist
```

No supersession is implied.

The Epistemic Model may derive conflict relationships.

---

# 63. Concept Existence and Identity Confidence

A Concept node should not carry generic:

```text
confidence = 0.6
```

because that number is ambiguous.

Possible interpretations include:

```text
confidence the entity exists
confidence this mention resolves to this entity
confidence canonical_id is correct
confidence name is correct
```

These should be modeled separately when important.

Examples:

```text
(Mention17, refers_to, Alice)
Assertion confidence = 0.6

(Alice, same_as, DidConceptX)
Assertion confidence = 0.95
```

Concept existence remains semantic addressability, not epistemic truth.

---

# 64. MemorySpace Import Semantics

Import does not move an element into the destination with its old local `id`.

Conceptually:

```text
Source element
   │ export
   ▼
Capsule-local representation
   │ import
   ▼
Destination local element
```

The destination:

```text
assigns/resolves local IDs
records new _system.origin
preserves source provenance
applies local policy
does not inherit source authority automatically
```

The exact mapping is defined in KIP-2.0-Capsule.md.

---

# 65. Imported Assertion

An imported Assertion should preserve:

```text
remote semantic actor
remote assertion time
remote stance/mode/confidence
remote evidence/provenance when available
```

but destination Core additionally records:

```text
local mode/import context
destination _system.origin
capsule/import receipt
```

The destination may choose not to activate the assertion in its accepted Epistemic Projection.

---

# 66. Imported Executable Memory

A Skill is profile-defined, but Core Governance must support a safe default.

Imported elements classified as:

```text
behavioral
executable
```

SHOULD default to no action authority until local validation/policy elevation.

A valid signature proves:

```text
integrity
origin binding
```

not:

```text
truth
safety
applicability
utility
permission to execute
```

---

# 67. Classification and Authority Are Different

A memory can be:

```text
classification = public
authority = descriptive
```

or:

```text
classification = secret
authority = executable
```

Classification answers:

> Who may access it?

Authority answers:

> How strongly may it influence behavior?

The exact authority model belongs in Governance/Cognitive Memory Profile.

Core must not conflate the two.

---

# 68. Core Element Equality

Two Cognitive Elements are the same persistent element iff:

```text
id is equal
```

Semantic equivalence is different.

Examples:

```text
two Concepts may denote the same external entity
two Propositions may canonicalize after a Concept merge
two Evidence items may contain identical bytes
two Assertions may express identical commitments at different times
```

KIP must not collapse these merely by payload equality.

---

# 69. Content Digests

Evidence, Activities, Capsules, and optionally large Concept payloads MAY carry digests.

A digest proves payload equality/integrity under the specified canonicalization.

It does not prove semantic identity.

Example:

Two Evidence records can have the same document digest but different:

```text
observation time
origin
policy
context
```

and therefore remain distinct Evidence elements.

---

# 70. Idempotent Creation Keys

For autonomous agents, retries are normal.

KIP 2.0 SHOULD support idempotent logical creation beyond transaction-level retry keys.

Recommended concept:

```text
client_key
```

for elements that are not structurally canonical.

Possible uniqueness:

```text
(space_id, kind, client_key)
```

or schema-scoped equivalent.

Examples:

```text
Evidence from trace event ID
Assertion from deterministic formation item ID
Activity from tool call ID
Experience from run ID
```

KML expresses this as the `CLIENT KEY :key` clause on `CREATE CONCEPT` /
`CREATE EVIDENCE` / `CREATE ASSERTION` / `CREATE ACTIVITY`.

---

# 71. Proposition Idempotency Needs No Client Key

A Proposition is already structurally canonical:

```text
(space, subject, predicate, object)
```

Creating the same Proposition twice resolves to the same canonical Proposition.

This is one of the major advantages of separating Proposition from Assertion.

---

# 72. Assertion Idempotency Does Need an External Key

The same semantic actor may make the same Assertion multiple times.

Therefore Core MUST NOT deduplicate Assertions solely by:

```text
proposition
asserted_by
stance
```

A retry of one write and a genuine repeated statement are different events.

Use:

```text
transaction idempotency
client_key
source event identity
```

to distinguish retry from repetition.

---

# 73. Evidence Idempotency Does Not Equal Digest Deduplication

Two captures of identical bytes can be different Evidence:

```text
same page observed on Monday
same page observed on Friday
```

The content digest is equal, but observation events differ.

Implementations MAY deduplicate physical blob storage.

They MUST NOT automatically collapse cognitive Evidence identity merely because payload digests match.

---

# 74. Structural Reference Cardinality

Core Structural Reference fields have defined cardinality.

Examples:

```text
Assertion.proposition
    exactly 1

Assertion.evidence
    0..N

Assertion.supersedes
    0..N

Evidence.generated_by
    0..1

Activity.inputs
    0..N

Activity.outputs
    0..N
```

Schema/Profile structures define their own cardinalities.

A Structural Field MAY additionally be declared **ordered**. For an ordered field the engine maintains one stable, dense, zero-based total order of references per source element:

```text
references added without an explicit index append in mutation order
an explicit {index: n} assignment declares the intended zero-based position
conflicting explicit positions in one mutation plan MUST fail validation
the committed order MUST be dense (0..n-1) and deterministic
removing a reference re-densifies the remaining order
```

An explicit `{index: n}` outside the current dense range `0..len` MUST fail validation: positions are dense, so the only position past the last existing reference is `len` (append).

Order lives on the reference, not on the target. A profile MUST NOT add an
`ordinal`/`sequence` attribute to the referenced element, because that would
create a second source of truth for the same order. Queries read the current
position through the virtual field `?edge.index` on the Structural Pattern
binding; unordered fields expose no index.

Order is record topology only:

```text
index order ≠ causality
```

A causal claim between referenced elements is a semantic Proposition +
Assertion (Section 47).

---

# 75. No Hidden Chain-of-Thought Field

No Core element includes or requires:

```text
private_chain_of_thought
hidden_reasoning_trace
token_level_deliberation
```

An Activity, Experience, or Assertion MAY carry a concise externally useful rationale or decision summary through profile-defined fields.

That summary is an ordinary cognitive artifact and may itself have provenance.

---

# 76. Separation of Content from Derived Indexes

The following are implementation/index state, not canonical cognitive content:

```text
embedding vector
inverted-index tokens
ANN graph edges
BM25 statistics
search cache
query popularity
access count
```

They MUST NOT be required in Cognitive Capsules.

A destination can rebuild them.

---

# 77. Search Score Is Transient

Search results MAY carry transient fields such as:

```text
_score
_score_components
```

These are not persistent element state unless a profile explicitly records an evaluation artifact.

KIP 2.0 should preserve the KIP 1.x principle that embeddings and retrieval indexes stay behind the protocol boundary.

---

# 78. Core System State vs. Profile State

Core `_system` examples:

```text
version
created_at
updated_at
transaction IDs
origin
tombstone state
```

Profile Facet examples:

```text
memory_strength
salience
utility
consolidation_status
learning_value
```

Do not place profile state in `_system`.

Do not place engine truth in profile Facets.

---

# 79. Core System State vs. Governance State

Governance:

```text
classification
policy_ref
retention constraint
```

System bookkeeping:

```text
version
origin principal
transaction ID
created_at
```

An administrator may change governance under policy.

No administrator should be able to rewrite engine history as ordinary governance mutation.

---

# 80. Core System State vs. Epistemic State

Epistemic state is represented by:

```text
Assertion
Evidence
Activity/provenance
```

Do not store:

```text
_system.confidence
_system.truth
_system.accepted
```

The engine is not the universal epistemic authority.

---

# 81. Versioning

Each mutable Cognitive Element carries:

```text
_system.version
```

which monotonically increases on successful mutation.

Version is:

```text
engine-maintained
local to the element
not a semantic fact
not portable authority
```

`EXPECT VERSION` remains compatible with this model.

---

# 82. Transaction Identity

Every write belongs to one engine transaction.

Elements record at least:

```text
created_tx
updated_tx
```

Transactions provide the atomic history needed for:

```text
audit
change stream
migration
origin
idempotency
bitemporal reconstruction
```

Exact receipt semantics belong in KIP-2.0-Transactions.md.

---

# 83. Atomic Cognitive Transition Example

Correcting a belief may require:

```text
create Evidence E2
create Assertion A2
mark A1 superseded
create Activity C1 linking E2/A1 → A2
```

These SHOULD be executed atomically where semantic correctness requires all-or-nothing behavior.

The Core Data Model is designed so all elements can carry one transaction origin.

---

# 84. Error Isolation

If a multi-element cognitive transition fails before commit:

```text
no partial Assertion
no dangling Evidence link
no half-superseded history
```

should become visible.

This is a transaction-layer requirement enabled by the Core reference model.

---

# 85. Extension Strategy

KIP 2.0 supports extensibility through:

```text
Schema Packages
Facet namespaces
custom Concept Types
custom Predicate Types
custom Assertion modes (namespaced)
custom Evidence classes (namespaced)
custom Activity classes (namespaced)
```

Core element kinds themselves should remain small and stable.

---

# 86. Why Not Make Assertion a Concept?

Rejected design:

```text
Concept type = Assertion
```

Problems:

1. Ordinary Concept schemas could weaken required Assertion invariants.
2. `name`/entity semantics do not fit ephemeral epistemic commitments.
3. Assertion target cardinality must be exactly one Proposition.
4. Engine needs standardized stance/lifecycle semantics.
5. Query engines need efficient native assertion filtering.
6. Governance may distinguish `assert` permission from ordinary `write`.
7. Import/export must preserve assertion authority differently from semantic entities.
8. KIP 1 compatibility desugaring needs deterministic Assertion creation.

Therefore dedicated Core kind is preferred.

---

# 87. Why Not Make Evidence a Concept?

Rejected design:

```text
Concept type = Evidence
```

Problems:

```text
payload immutability
content digests
external blob refs
correction chains
observation time
shared citation
retention
provenance-specific querying
```

deserve standardized semantics.

Evidence can still be the subject/object of semantic Propositions because every Cognitive Element is referable.

---

# 88. Why Not Make Activity a Concept?

Activity is similarly specialized.

It needs:

```text
inputs
outputs
associated actors
time bounds
terminal immutability
provenance semantics
engine-observed vs claimed mode
```

Making it a dedicated Core kind enables a predictable provenance DAG.

---

# 89. Why Not Make Every Relation a Proposition?

Because not every relationship is a claim about the world.

Examples:

```text
Assertion targets Proposition
Evidence generated by Activity
Activity outputs Assertion
```

are record topology.

Encoding all topology as Propositions would force recursive epistemic interpretation.

KIP 2.0 is graph-native without requiring **all edges to have the same semantics**.

---

# 90. Core Graph Model

The resulting graph is heterogeneous:

```text
Semantic edges:
    Proposition terms

Structural edges:
    typed references between Core/Profile records

Epistemic nodes:
    Assertion

Evidence/provenance nodes:
    Evidence
    Activity
```

Illustrative:

```text
Alice ──────────────┐
                    │
                    ▼
             Proposition P1
      (Alice, prefers, DarkMode)
                    ▲
                    │ proposition
               Assertion A1
                    │
                    │ evidence {role: "support"}
                    ▼
             Evidence E1
                 │      ▲
    generated_by │      │ outputs
                 ▼      │
               Activity X
```

---

# 91. KIP 1.x Migration Mapping

KIP 2.0 is semantically breaking, so migration must be explicit.

---

## 91.1 Concept

KIP 1.x:

```json
{
  "type": "Person",
  "name": "Alice",
  "attributes": {...},
  "metadata": {...}
}
```

KIP 2.0:

```text
Concept
  id = preserved/generated
  schema_ref = migrated type package
  key = legacy name where needed
  name = legacy name
  attributes = classified subset
  space_id = default migrated Space
```

---

## 91.2 Proposition

KIP 1.x:

```text
Alice ─ prefers → DarkMode
metadata:
  source
  author
  confidence
  valid_from
  superseded
```

KIP 2.0:

```text
canonical Proposition P
+
migrated Assertion A
```

Move to A:

```text
author/actor semantics
confidence
validity
status/supersession
```

Move/convert source/evidence to:

```text
Evidence
Activity/provenance
legacy provenance facet when unresolved
```

---

## 91.3 Legacy Proposition Attributes

Because native KIP 2.0 Propositions do not support arbitrary mutable semantic attributes, v1 proposition attributes require classification.

Possible migration:

```text
epistemic qualifier
    → Assertion

world fact requiring independent claim
    → new Proposition + Assertion

n-ary relationship qualifier
    → reified relation Concept

implementation-only field
    → profile Facet / annotation

ambiguous/unresolved
    → legacy.v1 Facet preserved losslessly
```

Automatic migration MUST NOT invent semantics where the old model is ambiguous.

---

## 91.4 Legacy Concept Metadata

Legacy Concept-level:

```text
source
confidence
author
```

cannot always be losslessly mapped because it is unclear whether confidence referred to:

```text
entity existence
entity resolution
attribute correctness
overall extraction confidence
```

Migration SHOULD preserve ambiguous fields in a legacy provenance Facet unless a safe interpretation exists.

---

## 91.5 `access_level`

Legacy:

```text
metadata.access_level
```

becomes:

```text
Space policy
element governance.classification
policy_ref
```

The old field is never sufficient for enforcement in v2.

---

## 91.6 `memory_tier` / `expires_at`

Legacy memory lifecycle becomes:

```text
retention
and/or Cognitive Memory Profile Facet
```

depending on meaning.

---

## 91.7 `confidence` Decay Migration

If a KIP 1.x deployment used time decay on proposition `confidence` as a memory accessibility proxy:

```text
legacy confidence cannot be assumed to remain epistemically calibrated
```

Migration should:

1. move the surviving value conservatively to migrated Assertion confidence;
2. initialize `memory_strength` separately;
3. record a migration warning/facet indicating historical confidence decay;
4. stop future generic time-based confidence decay.

---

## 91.8 Higher-Order Propositions

KIP 1.x can refer to Proposition links as higher-order endpoints.

KIP 2.0 preserves Proposition referability.

A legacy higher-order link itself becomes:

```text
truth-neutral higher-order Proposition
+
migrated Assertion
```

when it was previously treated as a fact.

---

# 92. KIP 1 Compatibility Projection

A KIP 2.0 implementation MAY expose a compatibility mode.

A v1-style read:

```text
(Alice, prefers, DarkMode)
```

can mean:

> Return this Proposition only if it is accepted in the configured compatibility Epistemic Projection.

A v1-style write:

```text
Alice prefers DarkMode
WITH METADATA {
  confidence: 0.9
}
```

can desugar into:

```text
Proposition
Assertion
optional Evidence
```

Compatibility mode must produce warnings when semantics are ambiguous.

---

# 93. Data Model Invariants

The following invariants are normative design targets.

1. Every Cognitive Element has one immutable `id`.
2. Every Cognitive Element has exactly one home `MemorySpace`.
3. Local Structural References resolve inside the same Space.
4. A Proposition is truth-neutral.
5. A Proposition tuple is immutable.
6. One Space SHOULD have one canonical active Proposition per semantic tuple.
7. Literal equality is typed and deterministic.
8. Proposition existence does not imply acceptance.
9. `Assertion` is a dedicated Core element kind.
10. One Assertion targets exactly one Proposition.
11. Assertion epistemic payload is historically immutable.
12. Belief revision creates a new Assertion rather than silently rewriting old belief.
13. Contradiction does not imply supersession.
14. `Evidence` is a dedicated Core element kind.
15. Evidence payload is immutable.
16. Evidence digest equality does not imply Evidence identity.
17. `Activity` is a dedicated Core element kind.
18. Completed Activity provenance topology is immutable.
19. Core Structural References are not semantic Propositions.
20. Engine origin is separate from claimed provenance.
21. Engine origin cannot be author-written or content-laundered.
22. Imported source origin does not become destination engine origin.
23. Trust is not Proposition confidence.
24. Memory strength is not Assertion confidence.
25. Valid time is not retention expiry.
26. Assertion time is not engine transaction time.
27. `name` is not universal identity.
28. `canonical_id` is a privileged identity binding, not a casual attribute.
29. Values requiring independent epistemic semantics should not be trapped in attributes.
30. Profiles extend Core through validated Facets and typed Concepts, not an unbounded protocol metadata bag.
31. Policy applies to Proposition existence as well as Assertion/Evidence content.
32. Unauthorized reads must not leak hidden element existence through search or counts.
33. Deletion must preserve reference integrity.
34. Evidence deletion is audit-sensitive.
35. Concept merge is non-destructive to historical references.
36. Semantic similarity does not affect Core identity.
37. Embeddings/indexes are not canonical state.
38. Hidden chain-of-thought is never required.
39. Imported executable memory has no automatic execution authority.
40. Accepted belief is a projection, not canonical Core storage.

---

# 94. Minimal Core Conformance Data Shapes

A minimal conforming KIP 2.0 Core implementation must support persistent representations equivalent to:

```text
MemorySpace
Concept
Proposition
Assertion
Evidence
Activity
```

and must support:

```text
same-space reference integrity
system origin
element version
typed Literal
Assertion lifecycle
Evidence payload/digest
Activity input/output provenance
governance hooks
retention hooks
Facets
```

It need not implement the Cognitive Memory Profile to conform to the Core Data Model.

---

# 95. Minimal Core Example

A complete smallest useful epistemic graph:

```text
MemorySpace S1

Concept C1 = Alice
Concept C2 = DarkMode

Proposition P1
  subject   = C1
  predicate = prefers
  object    = C2

Evidence E1
  class = user_statement
  payload = "I prefer dark mode."

Assertion A1
  proposition = P1
  asserted_by = C1
  stance = support
  mode = stated
  evidence = E1

Activity X1
  class = extraction
  inputs = E1
  outputs = A1
```

The Brain may later derive a stable Preference Concept or semantic Assertion, but Core already preserves:

```text
meaning
speaker
evidence
origin
time
provenance
space
```

---

# 96. Example: Same Proposition, Multiple Assertions

```text
P1 = (ServiceA, status, "healthy")

A1
  mode = observed
  asserted_by = MonitoringTool
  stance = support
  confidence = 0.99

A2
  mode = stated
  asserted_by = OperatorBob
  stance = reject
  confidence = 0.7
```

No duplicate Proposition is required.

A production incident Brain can surface:

```text
status contested
monitor says healthy
operator reports unhealthy
```

instead of overwriting one with the other.

---

# 97. Example: Multiple Propositions, Temporal State

```text
P1 = (Project, status, "active")
P2 = (Project, status, "archived")

A1 supports P1
  valid_until = 2026-08-01

A2 supports P2
  valid_from = 2026-08-01
```

Both Propositions remain semantically meaningful.

The current Epistemic Projection can select P2 while historical queries recover P1.

---

# 98. Example: Evidence Correction

```text
Evidence E1
  measurement = 42
  status = active

later:

Evidence E2
  measurement = 24
  corrects = E1

E1.lifecycle.status = corrected
E1.corrected_by = E2
```

Assertions that cited E1 remain historically auditable.

A new Assertion may supersede the earlier conclusion.

---

# 99. Example: Provenance Through Consolidation

```text
Evidence E1: conversation 1
Evidence E2: conversation 2
Evidence E3: conversation 3

Activity C1: cross-event consolidation
  inputs = E1, E2, E3
  outputs = Assertion A9

A9:
  proposition = (Alice, prefers, DarkMode)
  mode = inferred
```

The stable knowledge is compact.

The raw support chain remains reconstructable.

---

# 100. Example: Experience to Skill

The Cognitive Memory Profile may create:

```text
Experience X1
Experience X2
```

Then:

```text
Activity P1
  class = procedural_consolidation
  inputs = X1, X2
  outputs = Skill S1
```

`Skill S1` is a profile Concept.

Its execution authority is Governance/Profile state, not implied by the fact that it exists.

---

# 101. Example: Imported Skill

Source capsule says:

```text
Skill SX
  "Run shell command Y when condition Z"
```

Destination:

```text
Concept Skill SX'
  profile status = candidate
  authority = descriptive/advisory only

_system.origin
  channel = import
  principal = importing principal

Imported provenance
  source capsule digest
  remote signer if present
```

The Skill cannot grant itself executable authority.

---

# 102. Example: Concept Merge

Before:

```text
C1 = "JS"
C2 = "JavaScript"

P1 = (C1, used_in, ProjectA)
P2 = (C2, used_in, ProjectB)
```

Identity consolidation:

```text
C1._system.state = merged
C1.merged_into = C2
```

Raw history remains.

Canonical view resolves C1 → C2.

Future writes use C2.

No imported historical Assertion is rewritten to pretend it originally used C2.

---

# 103. Open Data Model Questions

The architecture is now sufficiently constrained that remaining questions are narrower.

The KIP 2.0 Specification has since adopted the recommendation below for most of
these questions. Where the Specification settles one, the Specification is
authoritative and the answer here is retained only as design rationale.

## Q1. Should Structural References have their own generic persisted edge records?

Current recommendation:

> No for the initial Core.

Use typed reference fields on Core/Profile elements.

Reason:

```text
simpler model
avoids another generic edge type
preserves clear semantic vs structural distinction
```

If query ergonomics later require generic structural edge indexing, engines may index them internally without changing canonical meaning.

---

## Q2. Should Assertion evidence citations be immutable?

Current recommendation:

> The original citation set should be immutable; later evidence should normally create a new Assertion revision.

This gives the cleanest historical belief reconstruction.

A future Epistemic Model may permit explicitly marked post-hoc review links that do not rewrite original assertion state.

---

## Q3. Should Concept aliases be mutable?

Recommendation:

> Yes, as grounding state.

Historically important names should be modeled separately as propositions/assertions.

---

## Q4. Can a Proposition subject be an Assertion/Evidence/Activity?

Recommendation:

> Yes, if Predicate schema permits.

All Cognitive Elements are referable resources.

But Core topology links remain Structural References rather than implicit Propositions.

---

## Q5. Should foreign-space references be Core-required?

Recommendation:

> No.

Core baseline is same-space closure.

Foreign references are an optional capability.

Portable sharing should use Cognitive Capsules.

---

## Q6. Should `retention.expires_at` be Core?

Recommendation:

> Yes, as a generic storage lifecycle hook.

Its semantics must remain distinct from Cognitive Memory Profile strength/forgetting and Assertion validity.

---

## Q7. Should Evidence always have a content digest?

Recommendation:

> Required when the payload is external or when a stable canonical payload representation exists; optional when unavailable.

The Capsule specification will define stronger portability requirements.

---

## Q8. Should `canonical_id` be unique Nexus-wide?

Recommendation:

> A verified canonical identity SHOULD resolve uniquely within one MemorySpace for one identity scheme.

Cross-Space duplicates are expected.

Conflicting bindings are a governance/identity-resolution issue, not a silent merge.

---

## Q9. Should Activity be required for every Assertion?

Recommendation:

> No.

Direct Assertions can exist with only engine origin + Evidence.

Activity is required/recommended when transformation lineage matters:

```text
inference
consolidation
import
migration
tool execution
skill compilation
```

---

## Q10. Should every Assertion require Evidence?

Recommendation:

> No.

Examples without direct Evidence:

```text
hypothesis
prediction
imported quoted assertion with missing source
explicit belief statement
```

Missing Evidence should reduce what an Epistemic Projection is willing to trust, not make the record structurally invalid.

---

# 104. Documents This Model Enables

With the Core Data Model fixed, the next specifications can now be designed independently.

Recommended sequence:

```text
KIP-2.0-Architecture.md
KIP-2.0-Core-Data-Model.md              ← this document

KIP-2.0-Epistemic-Model.md
    confidence
    trust
    evidence evaluation
    contradiction
    supersession
    source diversity
    epistemic projection

KIP-2.0-Governance.md
    Principal
    MemorySpace
    permissions
    classification
    authority
    policy inheritance
    redaction

KIP-2.0-Schema-Packages.md
    schema identity
    type/predicate definitions
    constraints
    versions
    migrations

KIP-2.0-Transactions.md
    atomic batches
    idempotency
    receipts
    optimistic concurrency
    change stream

KIP-2.0-Capsule.md
    canonical representation
    import/export
    origin receipts
    signatures
    redaction

KIP-2.0-KQL.md
KIP-2.0-KML.md
KIP-2.0-META.md

KIP-2.0-Migration-from-1.x.md

profiles/CognitiveMemoryProfile-2.0.md
brain/ExperienceLearningArchitecture.md
brain/BrainFormation.md
brain/BrainRecall.md
brain/BrainMaintenance.md
```

---

# 105. Core Design Summary

The final Core ontology is intentionally small:

```text
MemorySpace
    │
    ├── Concept
    │      referable semantic object
    │
    ├── Proposition
    │      truth-neutral semantic statement
    │
    ├── Assertion
    │      epistemic commitment toward one Proposition
    │
    ├── Evidence
    │      cited observation/artifact/result
    │
    └── Activity
           provenance transformation/process
```

The most important relationships are:

```text
Proposition:
    subject ────────────────> Cognitive Element
    object ─────────────────> Cognitive Element | Literal

Assertion:
    proposition ────────────> Proposition
    asserted_by ────────────> semantic actor reference
    evidence ───────────────> Evidence
    supersedes ─────────────> Assertion

Evidence:
    source ─────────────────> semantic/external sources
    generated_by ───────────> Activity

Activity:
    inputs ─────────────────> Cognitive Elements
    outputs ────────────────> Cognitive Elements
    associated_actors ──────> semantic actors
```

Everything is governed by:

```text
space_id
governance
retention
_system.origin
_system.version
transaction history
```

Profiles add memory-specific cognition through:

```text
typed Concepts
Structural References
Facets
```

without weakening Core epistemic semantics.

---

# 106. Final Inference

KIP 1.x represented a useful world as:

```text
Concept ─ Proposition → Concept
```

KIP 2.0 represents a memory brain as:

```text
                         ┌──────────── Evidence
                         │
Concept ─ Proposition ← Assertion
   │          │            │
   │          │            └──────────── semantic actor
   │          │
   │          └──────────────────────── truth-neutral meaning
   │
   └────────────────────────────────── referable cognition

Evidence / Assertion / Concepts
             │
             ▼
          Activity
             │
             ▼
      derived cognition

all inside:
    MemorySpace + Policy + Engine Origin + Time
```

This changes the nature of the system.

A KIP 1.x Nexus primarily stores:

> **what the graph says.**

A KIP 2.0 Nexus can preserve:

> **what can be said, who said or inferred it, what supports it, when it applied, how it was learned, where it came from, who may use it, and how that past state can influence future action.**

That is the minimum data substrate required for an Agent to build a **real external memory brain** rather than a persistent knowledge cache.
