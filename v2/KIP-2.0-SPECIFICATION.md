# KIP 2.0 Specification

**[English](./KIP-2.0-SPECIFICATION.md) | [中文](./KIP-2.0-SPECIFICATION_CN.md)**

## Status

**Normative Draft / Protocol Consolidation Candidate**

Version: **2.0-draft**

This document is the normative consolidation of the KIP 2.0 design.

The following KIP 2.0 design documents are informative references and design rationale. The ten `design/` notes are **frozen** as of 2026-09-02: they are the pre-consolidation drafts, are no longer maintained, and their Chinese twins are no longer synchronized; where they differ from this Specification they are out of date.

- `KIP-2.0-Architecture.md`
- `design/KIP-2.0-Core-Data-Model.md`
- `design/KIP-2.0-Epistemic-Model.md`
- `design/KIP-2.0-Governance.md`
- `design/KIP-2.0-Schema-Packages.md`
- `design/KIP-2.0-Transactions.md`
- `design/KIP-2.0-Capsule.md`
- `design/KIP-2.0-KQL.md`
- `design/KIP-2.0-KML.md`
- `design/KIP-2.0-META.md`
- `design/KIP-2.0-Protocol-Runtime.md`

The following artifacts are normative companions to this Specification:

- `grammar/KIP-2.0-KQL.ebnf`, `grammar/KIP-2.0-KML.ebnf`, `grammar/KIP-2.0-META.ebnf` — normative syntax
- `schemas/kip-request.schema.json`, `schemas/kip-response.schema.json`, `schemas/kip-change-envelope.schema.json` — normative wire shapes
- `profiles/cognitive-memory-2.0.0.schema.json` and `profiles/CognitiveMemoryProfile-2.0.md` — the standard Profile package
- `conformance/KIP-2.0-Conformance-Tests.md`, `conformance/conformance-test-vector.schema.json`, `conformance/conformance-report.schema.json`, `conformance/conformance-state-fixture.schema.json`, `conformance/conformance-governance-policy.schema.json` and `conformance/fixtures/` — the conformance suite
- `KIP-2.0-Capsule-Specification.md` — §37–§41 and §95 of this Specification, the Cognitive Capsule, carried in a companion under the same numbering
- `KIP-2.0-Optional-Profiles-and-Migration.md` — §100, §101, §103 and Appendix I of this Specification: historical reads, high-assurance hardening, and KIP 1.x migration — each a capability (§67.4), not a profile
- `KIP-2.0-Invariants.md` — the invariant registry: §102's 38 Core invariants (Part A) and the Cognitive Memory Profile's 35 (Part B), one list

`KIPSyntax.md` is an informative LLM-facing syntax card, not a normative artifact.

If this Specification conflicts with an earlier KIP 2.0 design document, **this Specification takes precedence**.

KIP 1.x remains a compatibility/migration source, not a normative definition of KIP 2.0 semantics.

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as normative requirement levels.

Unless explicitly marked otherwise, protocol invariants stated with these terms are normative.

Examples, rationale, explanatory diagrams, and non-normative implementation notes do not override normative requirements.

---

# 1. Introduction

KIP — the **Knowledge Interaction Protocol** — is a protocol for interaction between an Agent and a persistent **Cognitive Nexus**.

KIP 2.0 generalizes KIP from a persistent knowledge graph protocol into a **Cognitive State Protocol for Agent Memory Brains**.

A KIP 2.0 Cognitive Nexus can persist and expose:

```text
semantic entities
truth-neutral propositions
attributed assertions
evidence
provenance activities
experiences
skills
profile-specific memory state
governed access/control state
transaction history
portable cognitive artifacts
```

The protocol is **Model-First**: the language and runtime are designed to be reliably generated and consumed by LLM-based Agents while remaining deterministic enough for interoperable implementations.

KIP 2.0 separates three fundamental questions:

```text
Meaning
    What can be represented?

Belief
    What should the Brain currently treat as epistemically accepted?

Authority
    Who may read, write, project, share, execute, or elevate cognition?
```

These dimensions MUST NOT be collapsed.

---

# 2. Core Principles

## 2.1 Proposition existence does not imply truth

A stored Proposition represents a truth-neutral semantic statement.

```text
Proposition exists
    ≠
Proposition is true
    ≠
Brain accepts Proposition
```

Accepted belief is derived through **Epistemic Projection**.

---

## 2.2 Assertions carry epistemic commitment

An Assertion records that a semantic actor takes a stance toward one Proposition.

The Assertion, not the Proposition, carries:

```text
asserted_by
stance
mode
confidence
asserted_at
valid_time
Evidence citations
epistemic lifecycle
```

---

## 2.3 Contradiction is representable state

Conflicting Assertions MUST be allowed to coexist.

A Nexus MUST NOT treat contradiction itself as data corruption.

---

## 2.4 Provenance is not authority

Cryptographic origin, claimed provenance, source identity, Evidence lineage, and Governance authority are distinct.

```text
valid signature
    ≠
truth
    ≠
trust
    ≠
action authority
```

---

## 2.5 Engine origin and claimed provenance are different

Author-written claims about origin MUST NOT overwrite or masquerade as engine-authenticated origin.

Engine origin is protected system state.

---

## 2.6 Identity is not a display name

`name` and aliases are grounding state.

They MUST NOT be treated as universal identity.

---

## 2.7 Domain is not Space

A semantic Domain/topic is not a Governance boundary.

A **MemorySpace** is the primary ownership, isolation, policy, and transaction-ordering boundary.

---

## 2.8 Confidence is not memory accessibility

The following signals are orthogonal:

```text
Assertion confidence
source trust
memory_strength
salience
utility
validity/currentness
```

A runtime MUST NOT silently substitute one for another.

---

## 2.9 Multiple clocks exist

KIP 2.0 distinguishes at least:

```text
world valid time
observation time
assertion time
engine transaction time
```

Historical cognition and current reconstruction of historical facts MUST remain distinguishable.

---

## 2.10 Search relevance is not belief

SEARCH retrieval relevance MUST NOT be interpreted as:

```text
truth probability
Assertion confidence
source trust
Epistemic Projection status
```

---

## 2.11 External cognition cannot self-escalate authority

Imported or derived content MUST NOT grant itself stronger Governance authority.

---

## 2.12 Raw history must remain reconstructable where retained

Corrections, revisions, merges, and consolidations SHOULD preserve historical meaning rather than rewrite the past.

Privacy/legal purge MAY remove historical bytes where required.

---

## 2.13 Read does not imply learning

A read/query MUST NOT automatically increase:

```text
confidence
memory_strength
corroboration
Evidence count
```

as cognitive state.

Learning/reinforcement requires an explicit cognitive mutation.

---

## 2.14 Model-first ergonomics are a protocol constraint

KIP SHOULD remain compact, declarative, and structurally regular enough for reliable model generation.

Ergonomic sugar MAY exist, but MUST desugar to the same normative semantics.

---

# 3. Protocol Architecture

KIP 2.0 consists of the following conceptual layers:

```text
┌──────────────────────────────────────────────┐
│ Agent / Brain                                │
├──────────────────────────────────────────────┤
│ KQL    Cognitive Query Language              │
│ KML    Cognitive Mutation Language           │
│ META   Introspection / Grounding / Verify    │
├──────────────────────────────────────────────┤
│ Epistemic Projection                         │
│ Cognitive Profiles                           │
├──────────────────────────────────────────────┤
│ Semantic / Epistemic / Mnemonic State        │
├──────────────────────────────────────────────┤
│ Governance Control Plane                     │
├──────────────────────────────────────────────┤
│ Schema Packages                              │
├──────────────────────────────────────────────┤
│ Transaction Runtime / Commit History         │
├──────────────────────────────────────────────┤
│ Protocol Runtime / Wire Contract             │
├──────────────────────────────────────────────┤
│ Storage / Index / Execution Implementation   │
└──────────────────────────────────────────────┘
```

KIP does not mandate a database architecture.

An implementation MAY use:

```text
graph database
relational database
document store
embedded store
distributed state machine
canister storage
hybrid indexes
```

provided observable KIP semantics conform.

---

# 4. Foundational Definitions

## 4.1 Cognitive Nexus

A **Cognitive Nexus** is the persistent, governed state environment with which an Agent interacts through KIP.

A Nexus contains one or more MemorySpaces.

---

## 4.2 Cognitive State

**Cognitive State** is the durable external state that may participate in future Agent computation.

It includes semantic and epistemic records, memory/profile state, and related provenance.

---

## 4.3 Knowledge

KIP uses the working definition:

> **Knowledge is compressed regularity of experience.**

KIP does not require every stored Proposition to qualify as accepted knowledge.

---

## 4.4 Memory

> **Memory is the mechanism by which the past participates in future computation.**

Persistent storage alone is not sufficient to guarantee functional memory.

---

## 4.5 Experience

An **Experience** is a situated trajectory involving a subject pursuing a goal through state/action/observation/feedback/outcome.

A Cognitive Memory Profile MAY represent Experience approximately as:

```text
E = (g, b0, a0, o1, b1, a1, o2, ..., y, δ)
```

KIP Core does not require private chain-of-thought storage.

---

## 4.6 Skill

A **Skill** is reusable procedural cognition, often formed by compiling Experience into a policy/procedure.

A Skill's descriptive usefulness and Governance authority MUST remain separate.

A Skill's lifecycle standing is earned from graded Outcome Evidence (§15.7), never asserted by its author; the lifecycle itself is Profile machinery.

---

## 4.7 Learning

**Learning** is a durable context-appropriate change in future behavior caused by Experience or other cognitive input.

KIP mutations can implement non-parametric cognitive adaptation but do not by themselves prove behavioral learning.

---

# 5. MemorySpace

## 5.1 Definition

A **MemorySpace** is the primary KIP governance, identity, isolation, schema, and transaction-ordering boundary.

Examples:

```text
personal://yan
org://alink
project://kip
```

---

## 5.2 One home Space

Every durable Cognitive Element MUST have exactly one home MemorySpace.

---

## 5.3 Same-Space closure

Baseline Core structural/local references MUST resolve inside the same MemorySpace unless an explicitly supported Foreign Space Reference is used.

Cross-Space references MUST NOT be implicitly traversed.

---

## 5.4 Space sequence

Each state-changing committed transaction in a Space is assigned a monotonically ordered:

```text
space_seq
```

A Space state after sequence `k` may be denoted:

```text
S(k)
```

---

## 5.5 Space is not inferred from conversation context

The runtime MUST NOT silently change Space because of:

```text
topic
counterparty
semantic actor
Capsule source
foreign Concept
```

Space must be explicitly or safely resolved through execution context.

---

## 5.6 Space self identity

A MemorySpace MAY designate at most one **self identity**: a reference to a Concept (typically a Person/Agent Concept) that the Space treats as its semantic `$self`.

The designation is protected Space/Governance configuration state:

```text
it is not ordinary cognitive content
ordinary KML MUST NOT create or change it
changing it requires a protected Governance operation
```

`$self` is a documentation name, not literal KIP syntax. An Agent obtains the designated self Concept's exact reference through `DESCRIBE PRIMER` / execution context (§64.2).

All Capsule rules about source/destination `$self` (§38.4, §38.5) refer to this designated self identity. A Space without a designated self identity has no `$self` for those rules to map onto.

---

# 6. Core Data Model

## 6.1 Core element kinds

KIP 2.0 defines these Core Cognitive Element kinds:

```text
Concept
Proposition
Assertion
Evidence
Activity
```

`MemorySpace` is a Governance container, not an ordinary Cognitive Element.

Profile objects such as:

```text
Experience
ExperienceStep
Skill
Preference
Commitment
Insight
SelfModel
Watch
WorkingState
```

SHOULD be represented as typed Concepts plus validated Facets/Structural References unless a future Core version explicitly promotes them.

---

## 6.2 Common Cognitive Element envelope

A durable Cognitive Element has the conceptual shape:

```json
{
  "id": "opaque-local-id",
  "kind": "concept|proposition|assertion|evidence|activity",
  "space_id": "space-id",

  "governance": {
    "classification": "policy-defined",
    "authority_class": "descriptive",
    "policy_ref": "optional"
  },

  "retention": {
    "retention_class": "standard",
    "expires_at": null,
    "legal_hold": false
  },

  "facets": {},

  "_system": {
    "version": 1,
    "created_at": "...",
    "updated_at": "...",
    "created_tx": "...",
    "updated_tx": "...",
    "state": "active",

    "origin": {
      "principal_id": "...",
      "channel": "...",
      "import_id": null
    }
  }
}
```

The exact physical storage representation is implementation-defined.

---

## 6.3 `_system`

`_system` is engine-maintained.

Ordinary KML MUST NOT directly write:

```text
version
plane_versions
created_at
updated_at
created_tx
updated_tx
state
origin
space_seq
```

`version` advances on every committed change to the element. `plane_versions` holds one counter per **version plane** — `attributes` (fields and attributes), `structural` (Structural References), `retention` (the retention record) and `facets` (one counter per Facet symbol) — and each counter advances only when its plane changes. `EXPECT VERSION ... OF <plane>` (§35.1) guards one plane, so a concurrent write to another plane of the same element does not conflict with it. Lifecycle moves and merges advance `version` and, when they touch a plane's content, that plane's counter; a `no_effect` replay advances nothing.

---

## 6.4 Generic metadata bag removed

KIP 2.0 has no normative universal author-writable `metadata` bag.

Data MUST be placed in the appropriate semantic plane:

```text
semantic payload       → typed fields / attributes
epistemic state        → Assertion
Evidence               → Evidence
provenance             → Activity / origin
governance             → Governance state
storage lifecycle      → retention
mnemonic/profile state → Facets
engine truth           → _system
```

A compatibility layer MAY preserve unmapped KIP 1 metadata in a namespaced legacy Facet, but MUST NOT use that mechanism to bypass protected semantics.

---

# 7. Identifiers

## 7.1 Local `id`

Every durable Cognitive Element has an immutable Nexus-local `id`.

Requirements:

```text
unique within the Nexus implementation scope
opaque to clients
never reused for another element
engine-assigned for new elements
```

---

## 7.2 `name`

`name` is mutable grounding/display state.

Duplicate names are allowed.

---

## 7.3 `key`

A Concept MAY have an immutable Space-local logical `key`.

A `key` MUST be unique within:

```text
(space_id, lineage of schema_ref, key)
```

The scope is the Concept Type's **lineage** (§20.14), not one exact package
version: a Concept keyed `"alice"` under `Person@1.0.0` and an upsert of
`Person` keyed `"alice"` after the package moved to `1.1.0` address the same
identity, so a package upgrade never mints a second `"alice"`.

A `key` is therefore identity within its Concept Type, not across types: a
`Person` and a `Preference` may both be keyed `"alice"` and they are two
identities, which is what lets a 1.x database whose identity was `(type, name)`
migrate those names into keys without merging unrelated Concepts.

A selector that names a `key` without a type MAY match more than one Concept. A
runtime MUST NOT resolve such a selector by choosing among them; it reports
`IdentityConflict`. Choosing would be the arbitrary winner §7.2 forbids for
names, reached through `key` instead.

`key` is useful for:

```text
idempotent model-facing identity
stable application identity
migration from legacy name identity
```

---

## 7.4 `canonical_id`

A Concept MAY have a high-assurance cross-system `canonical_id`.

Setting/changing a canonical identity MUST be subject to stronger identity/Governance policy than ordinary attributes.

An unverified external identity claim SHOULD instead be represented as a Proposition + Assertion; the Cognitive Memory Profile provides the `same_as` Predicate for exactly this purpose, feeding identity review rather than automatic merging.

---

## 7.5 `client_key`

A historically distinct creation MAY carry a durable client logical key for retry-safe creation.

Examples:

```text
message:42:evidence
tool-run:991:assertion
experience:turn:100
```

`client_key` is different from Concept `key`.

---

# 8. References

## 8.1 Local Element Reference

The baseline reference is a same-Space reference to a durable element ID.

---

## 8.2 Canonical Identity Reference

An implementation MAY expose a reference by validated `canonical_id`.

Resolution MUST obey Governance and identity policy.

---

## 8.3 Foreign Space Reference

Foreign references are optional extension capability.

They MUST be explicit and MUST NOT:

```text
grant read authority
grant mutation authority
trigger automatic traversal
trigger automatic import
```

---

## 8.4 Literal

A Proposition object MAY be a Literal.

A Proposition subject MUST NOT be a Literal.

---

# 9. Literal Model

## 9.1 Logical shape

A Literal is written as a primitive JSON scalar — a string, a number, a boolean, or `null` (§9.5) — and its `datatype` is the JSON type it was written in:

```json
"+08:00"
42
true
```

Conceptually a Literal is the pair `{value, datatype}` (§9.6), but that pair is never spelled on the wire: an object in a Literal position is not a Literal, and a Predicate whose value needs more structure declares a `format` (§20.15) or a schema-defined value object (§9.2). A runtime therefore never has to decide whether an object is a Literal or a value.

---

## 9.2 Baseline scalar types

```text
string
number
boolean
null
```

Arrays and arbitrary objects are not baseline Core Literals.

Structured values SHOULD use Concepts or schema/profile-defined value objects.

`datatype` is one of these four names, and a Predicate's `literal_types` (§20.15) draws from the same vocabulary; there is no other baseline datatype. A finer value shape — a timestamp, a URI, an identifier — is a `format` constraint declared by the Predicate (§20.15) or a schema-defined value object: validated on write, never part of Literal identity (§9.6).

---

## 9.3 Numeric rules

Only finite numeric values are valid.

```text
NaN
Infinity
-Infinity
```

MUST be rejected.

---

## 9.4 No language tag

The baseline Literal carries no language tag, and §9.1 leaves it nowhere to put one: a string Literal is the string alone. Multilingual text is modelled where its identity rules can be stated: a Concept with per-language attributes, or a schema-defined value object (§9.2) whose package declares how two tagged strings compare.

---

## 9.5 `null`

`null` is a semantic Literal only where the Predicate schema permits it.

Unknown state SHOULD normally be represented by absence/uncertainty rather than an invented `null` fact.

---

## 9.6 Canonical form

Literal identity (§12.3) compares canonical forms, and a runtime MUST canonicalize a Literal on write:

```text
string      Unicode scalar values after NFC normalization; no trimming, no case folding
number      mathematical value: 1, 1.0 and 1e0 are one Literal; -0 is 0;
            an integer and a float of equal value are equal
boolean     by value
null        by value, where the Predicate permits it (§9.5)
```

Two Literals with the same canonical `value` and `datatype` are the same Literal. Capsule serialization (§37.7) MUST emit the canonical form, so that a digest computed on one engine reproduces on another.

---

# 10. Concept

## 10.1 Definition

A **Concept** is a referable cognitive entity or typed cognitive object.

Concept existence alone does not prove that its real-world referent exists.

---

## 10.2 Concept shape

Concept-specific fields may include:

```json
{
  "schema_ref": "kip://...@2.0.0/Person",
  "key": "alice",
  "name": "Alice",
  "canonical_id": null,
  "aliases": [],
  "attributes": {}
}
```

plus the common envelope.

---

## 10.3 `schema_ref`

Every Concept MUST identify its Concept Type through a `schema_ref` naming an
exact Schema symbol identity, and that `schema_ref` MUST resolve to a Concept
Type definition in the Space's Schema Environment.

There is no untyped Concept. A `schema_ref` is fixed at creation, so a runtime
that minted one without a type would have created an element no later write
could repair and no `{type: …}` pattern could ever match.

The exact version in `schema_ref` is what the element validates against.
Matching and identity use the symbol's lineage (§20.14), so the element stays
reachable by its local type name after its package is upgraded. Moving an
element to another version of its lineage is a Schema migration under
`manage_schema` (§20.10), never ordinary KML.

---

## 10.4 Attributes

Concept attributes SHOULD contain:

```text
display/configuration state
local structured state
operational/profile values
```

that do not require independent epistemic lifecycle.

---

## 10.5 Attribute escalation rule

If a value requires independent:

```text
source
confidence
contradiction
valid time
retraction
evidence
sharing
history
```

it SHOULD be promoted to:

```text
Proposition + Assertion
```

rather than remain a mutable attribute.

---

# 11. Concept Merge

## 11.1 Non-destructive merge

Identity consolidation MUST NOT rewrite all historical references.

If Concept `A` is merged into Concept `B`:

```text
A remains addressable
A becomes merged
A.merged_into = B
future canonical resolution A → B
```

A merge MUST NOT create a cycle in `merged_into`: the runtime MUST reject a merge whose target already resolves, transitively, to the source. This keeps canonical resolution (following `merged_into` to its fixpoint) terminating.

---

## 11.2 Raw historical references

A historical Proposition that referenced `A` MAY continue to refer to `A` in raw history.

---

## 11.3 New writes

Ordinary new writes SHOULD canonicalize merged references to `B`.

---

## 11.4 Proposition collision after merge

If multiple Propositions canonicalize to the same tuple after a merge, the runtime MAY consolidate canonical semantic resolution while preserving:

```text
original Proposition IDs
Assertion references
raw provenance
historical queryability
```

---

# 12. Proposition

## 12.1 Definition

A **Proposition** is an immutable, truth-neutral semantic statement:

```text
(subject, predicate_ref, object)
```

---

## 12.2 Shape

```json
{
  "subject": {"id": "C-1"},
  "predicate_ref": "kip://...@1.0.0/timezone",
  "object": "+08:00"
}
```

plus common envelope fields that remain applicable.

---

## 12.3 Structural identity

Within one MemorySpace, canonical Proposition identity is determined by the canonical tuple:

```text
canonical subject
predicate lineage (§20.14)
canonical object
```

*Canonical* means merge-resolved: an endpoint whose `merged_into` chain (§11.4, §61) ends at B is canonically B. A tuple is stored as written and is never rewritten by a merge; canonicalization is applied when identities are compared and when a pattern is matched (§43.2). The stored `predicate_ref` is the exact reference resolved when the Proposition was created; identity compares its lineage. `ENSURE PROPOSITION` under a later version of the same package therefore resolves to the existing Proposition instead of minting a parallel one, and a `BELIEF SLOT` sees every Assertion in the slot whichever version its Proposition was created under.

---

## 12.4 Uniqueness

A Space SHOULD maintain one canonical active Proposition for one semantic tuple.

Concurrent creation MUST resolve deterministically to one canonical semantic identity.

---

## 12.5 Immutability

After creation, the tuple MUST NOT be updated.

Changing:

```text
subject
predicate
object
```

creates/resolves another Proposition.

---

## 12.6 No epistemic fields

A Proposition MUST NOT natively carry:

```text
confidence
asserted_by
source
observed_at
valid time
stance
retraction
```

---

## 12.7 Negative stance vs boolean false

The following are different:

```text
Assertion stance = reject toward P

Proposition object = false
```

A Schema MAY relate boolean candidate values as exclusive, but Core MUST preserve the structural distinction.

---

# 13. Assertion

## 13.1 Definition

An **Assertion** is a historically attributable epistemic commitment toward exactly one Proposition.

---

## 13.2 Conceptual shape

```json
{
  "proposition": {"id": "P-1"},
  "asserted_by": {"id": "C-actor"},

  "stance": "support",
  "mode": "stated",
  "confidence": 0.9,

  "asserted_at": "...",

  "valid_time": {
    "from": "...",
    "until": null
  },

  "evidence": [
    {
      "id": "E-1",
      "role": "support"
    }
  ],

  "context_refs": [],

  "lifecycle": {
    "status": "active",
    "supersedes": [],
    "superseded_by": [],
    "retracted_at": null
  }
}
```

plus common envelope.

---

## 13.3 `asserted_by`

`asserted_by` is a semantic actor, and it is REQUIRED: a claim whose actor cannot be resolved is recorded as Evidence, not asserted.

It is different from:

```text
_system.origin.principal_id
```

which identifies the authenticated execution origin.

`context_refs` is OPTIONAL: references to Concepts that scope the Assertion — the situation, purpose, or domain under which the stance holds (§25.3). It is set at creation through `SET FIELDS` and is part of the immutable payload (§13.7); a Projection Policy MAY exclude an Assertion whose context does not match the request's (`context_mismatch`).

---

## 13.4 Stance

Baseline stances:

```text
support
reject
uncertain
```

---

## 13.5 Mode

Baseline modes:

```text
observed
stated
inferred
predicted
hypothetical
imported
```

A mode does not automatically grant trust.

---

## 13.6 Confidence

`confidence` is optional and, when present, is in `[0,1]`.

It means:

> how strongly this Assertion takes its own stance.

It MUST NOT be interpreted as:

```text
source trust
Brain belief probability
memory strength
salience
utility
```

Missing confidence is not equivalent to `0`, `0.5`, or untrusted.

---

## 13.7 Immutable assertion payload

The historical epistemic payload SHOULD be immutable after creation, including:

```text
proposition
asserted_by
stance
mode
confidence
asserted_at
valid_time
Evidence citations (fixed at creation, §17.5)
```

---

## 13.8 Revision

If epistemic commitment materially changes, create a new Assertion.

Do not update the old Assertion's confidence/stance/value to represent current belief.

---

# 14. Assertion Lifecycle

Baseline states:

```text
active
retracted
superseded
expired
```

---

## 14.1 Retracted

Retraction means the assertor or an authorized representative withdrew the Assertion.

Administrative moderation MUST NOT falsely mark an Assertion as retracted if no real withdrawal occurred.

---

## 14.2 Superseded

Supersession means a newer Assertion replaces the older Assertion in a compatible actor/context/revision lineage.

Supersession is **revision**: the superseding Assertion says the superseded one was wrong — in its value, or in the interval it claimed — for the time it covered. Projection therefore drops a superseded Assertion for every `FOR TIME`, not only for the present.

Supersession is not generic disagreement, and it is not how the world changing over time is recorded. A value that held and then stopped holding is two `active` Assertions with complementary `valid_time` intervals (§25.2), and the Brain keeps answering "what was true then" from the earlier one (§48.4, Appendix G.4). When the earlier Assertion was written open-ended, the change is recorded by a superseding re-assertion of the same value with its interval closed, plus a new Assertion for the new value from the change date (Appendix F.2). Superseding a claim that was true for its time erases history the protocol exists to keep.

---

## 14.3 Expired

`expired` is a **computed** status, never a stored one: an Assertion whose `valid_time.until` lies before a projection's `valid_at` (`FOR TIME`) is `expired` for that projection. No KML statement produces it, a Change Envelope never carries it, and the stored lifecycle status remains `active`, `retracted`, or `superseded`. `HISTORY` shows no transition to `expired`, because none is committed.

It is distinct from storage retention and from world valid time.

---

# 15. Evidence

## 15.1 Definition

**Evidence** is an addressable cognitive artifact cited by Assertions or used in provenance.

---

## 15.2 Evidence classes

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
outcome
```

Schema/Profile extensions MAY add namespaced classes.

---

## 15.3 Conceptual shape

```json
{
  "evidence_class": "tool_result",

  "payload": {
    "mode": "inline|external",
    "inline": null,
    "content_ref": null
  },

  "content_digest": "sha256:...",
  "media_type": "application/json",
  "observed_at": "...",

  "source": [],
  "generated_by": null,

  "lifecycle": {
    "status": "active",
    "corrects": [],
    "corrected_by": []
  }
}
```

---

## 15.4 Evidence identity

Equal content digests do not necessarily imply identical Evidence.

Two observations of the same artifact may be distinct Evidence events.

---

## 15.5 Evidence immutability

The original Evidence payload and observation identity SHOULD be immutable.

A wrong Evidence artifact SHOULD be corrected by creating new Evidence and correction lineage.

Immutability forbids rewriting the payload into a different value. It does not forbid authorized destruction: payload purge (§60.6) erases the bytes while the record, `content_digest`, citations, and provenance role survive.

---

## 15.6 Evidence role is contextual

Evidence may be cited as:

```text
support
challenge
context
```

relative to an Assertion.

---

## 15.7 Outcome Evidence

**Outcome Evidence** (`evidence_class: "outcome"`) records what the world did after a decision, action, or trialed procedure. It is the consequence channel: the stream that lets later verdicts grade cognition against recorded reality instead of against the actor's own account of it.

Outcome Evidence SHOULD be written by instrumentation — telemetry, a verifier, a test harness, tooling, or a human reviewer — through the runtime ingestion path (§71.1), so the payload arrives transport-typed and stays that way (Invariant 33).

An actor's report about the result of its own action MUST NOT be recorded as `outcome` Evidence. It is `agent_statement` (or `user_statement`): citable as context, never as the graded consequence. Summarizing or re-typing instrumentation output yields `derived_result`, not `outcome`, and derived transformation never adds epistemic independence (§23.1).

In an open protocol this separation is auditable rather than cryptographically absolute. Engine origin (§2.5) always records which authenticated Principal wrote the element; Governance SHOULD restrict `outcome`-class Evidence creation to designated instrumentation Principals; and a consumer of the channel — a lifecycle verdict, trust calibration (§22.6), utility calibration — MUST be able to trace the origin chain of every outcome it graded, and SHOULD refuse outcomes whose origin fails its policy.

Each Outcome Evidence SHOULD carry a **task family**: the namespaced stream of comparable consequences it belongs to (for example `"deploy/rollback"`, `"outreach/reply"`). Graded cognition subscribes to a stream by carrying the same task family value, so an instrument never needs to know which patterns will read what it writes. The Cognitive Memory Profile defines the standard `OutcomeRecord` Facet (task family, outcome status, magnitude) and the Skill lifecycle machinery that consumes the channel.

A task family finds comparable consequences; it never attributes one. An outcome that is to grade a specific decision — a Skill applied, a gate decision taken — MUST be provenance-linked to that decision: the Activity that records the observation (the Profile's `outcome_observation`) names the decision Activity among its `inputs` and the Outcome Evidence among its `outputs`. A grading consumer counts an outcome toward a Skill only through that link. An outcome with no decision link belongs to the stream, and therefore to the stream's baseline, and to nothing else. This is what makes a comparative verdict recomputable: the treatment set is the linked outcomes, the baseline is the rest of the family.

Writing `outcome`-class Evidence, and the observation Activity that links it, requires `record_outcome` (§29.8).

An outcome that arrived by import carries `_system.origin.import_id` (§6.2). It was observed elsewhere, by an instrument the destination never authorized: it is readable evidence, never a local grade, and a grading consumer MUST exclude it (§41.6).

---

# 16. Activity

## 16.1 Definition

An **Activity** is a provenance element representing a transformation, process, inference, review, import, consolidation, or other cognitive/runtime activity.

---

## 16.2 Baseline classes

Examples:

```text
extraction
tool_execution
human_review
inference
summarization
semantic_consolidation
procedural_consolidation
skill_compilation
import
schema_migration
entity_merge
experience_formation
belief_revision
```

---

## 16.3 Conceptual shape

```json
{
  "activity_class": "inference",
  "started_at": "...",
  "ended_at": "...",

  "inputs": [],
  "outputs": [],
  "associated_actors": [],

  "parameters_digest": "sha256:...",
  "status": "completed"
}
```

---

## 16.4 Activity is not Transaction

An Activity describes a process/provenance relation.

A Transaction describes an atomic durable state transition.

---

## 16.5 Provenance topology

KIP SHOULD support a provenance structure conceptually equivalent to:

```text
input
  ↓
Activity
  ↓
output
```

---

## 16.6 Terminal activity immutability

After terminal state:

```text
completed
failed
cancelled
```

the Activity's core provenance topology SHOULD be immutable.

A correction should be represented by another Activity/audit record.

---

# 17. Structural References

## 17.1 Definition

A **Structural Reference** is record topology, not a world-level semantic Proposition.

Examples:

```text
Assertion → Evidence
Evidence → Activity
Activity → inputs/outputs
Experience → ExperienceStep
Skill → compiled_from Experience
```

---

## 17.2 Distinction

```text
(Alice, prefers, DarkMode)
    semantic Proposition

Experience.has_step → Step
    Structural Reference
```

A runtime MUST NOT silently convert one into the other.

---

## 17.3 Epistemic meaning

Structural existence does not itself require an Assertion stance.

If a statement about a structural relation needs epistemic treatment, model it as a semantic Proposition separately.

When a structural relation later becomes epistemically interesting, do not rewrite the topology. Keep the Structural Reference and add a semantic Proposition + Assertion **about** the relation (a *semantic shadow*): the structural edge remains record truth, while the shadow carries stance, evidence, validity, and contestability.

---

## 17.4 Ordered Structural References

A Structural Field MAY be declared **ordered**.

For an ordered field, the engine maintains one stable, dense, zero-based total order of references per source element:

```text
references added without an explicit index append in mutation order
an explicit {index: n} assignment declares the intended zero-based position
conflicting explicit positions in one mutation plan MUST fail validation
an explicit {index: n} outside the current dense range 0..len MUST fail validation (positions are dense; append = len)
the committed order MUST be dense (0..n-1) and deterministic
```

Queries expose the current position of each reference as the virtual field:

```text
?edge.index
```

on the Structural Pattern binding (§43.7). Unordered fields expose no index.

Order is record topology only:

```text
index order ≠ causality
```

A causal claim between referenced elements is a semantic Proposition + Assertion (for ExperienceSteps, see the Cognitive Memory Profile's `caused_by` Predicate).

---

## 17.5 Structural mutation

Structural References on a mutable Concept are written as a SET/UNSET pair, like attributes and Facets:

```text
SET STRUCTURAL   { (field, target) {options} }    add a reference
                                                  (on a single-cardinality field: replace it)
UNSET STRUCTURAL { (field, target) }              remove that reference
```

Removal is per reference. Removing from an ordered field re-densifies the remaining order (§17.4). Cardinality is validated at commit: removing the last reference of a required field fails.

Record kinds are not affected. Assertion, Evidence and terminal Activity topology stays immutable (§13.7, §15.5, §16.6); a pending Activity finalizes its references through `TRANSITION ... TO "completed" SET STRUCTURAL` (§52.5). A wrong reference on a record is corrected by a new record, never by removal.

---

# 18. Facets and Profiles

## 18.1 Facet

A **Facet** is a validated namespaced extension attached to a Core element.

Example:

```json
{
  "facets": {
    "kip://profiles/cognitive-memory@2.0.0/MnemonicState": {
      "memory_strength": 0.8,
      "salience": 0.9
    }
  }
}
```

---

## 18.2 Facet restrictions

A Facet MUST NOT bypass Core:

```text
immutability
Governance
origin
epistemic distinctions
```

---

## 18.3 Cognitive Memory Profile

A Cognitive Memory Profile SHOULD define types/facets/structural fields for at least:

```text
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Watch
Skill
SleepTask
SelfModel
WorkingState
MnemonicState
GradingState
TrialState
DerivationState
DecisionRecord
OutcomeRecord
```

The exact Profile Package version is separate from Core.

---

## 18.4 Mnemonic signals

Recommended:

```text
memory_strength
salience
utility
```

These remain distinct from epistemic confidence/trust.

---

# 19. Retention and Forgetting

KIP distinguishes multiple forms of forgetting/removal:

```text
epistemic retraction/supersession
mnemonic weakening
archive
tombstone
Governance exclusion
payload purge
physical purge
```

These MUST NOT be treated as equivalent.

---

## 19.1 Retention

The generic retention hook MAY include:

```text
retention_class
expires_at
legal_hold
```

`retention_class` and `expires_at` are storage lifecycle and never world validity (§19.2). `legal_hold` blocks erasure: see §60.3 for what it stops and §60.6 for how it applies to payload purge.

---

## 19.2 Retention expiry vs valid time

```text
retention.expires_at
    storage/lifecycle

Assertion.valid_time.until
    world applicability
```

They are different.

---

## 19.3 Physical purge

Physical purge is a high-impact operation.

Evidence/counter-Evidence purge SHOULD be especially conservative and audited.

Where policy permits, purge SHOULD leave a digest stub (§60.3) so audit and provenance-root identity survive byte destruction.

Byte destruction that targets only an Evidence payload uses payload purge (§60.6), which preserves the Evidence record itself.

---

# 20. Schema Packages

## 20.1 Purpose

Schema Packages define the authoritative semantic contract for KIP data.

Schema is more than validation: it defines identity of types, Predicates, Facets, structural fields, constraints, aliases, compatibility, and model-facing meaning.

---

## 20.2 Package reference grammar

Baseline conceptual grammar:

```text
kip://<package-path>@<exact-version>[/<symbol>]
```

Examples:

```text
kip://core@2.0.0
kip://core@2.0.0/Assertion
kip://profiles/cognitive-memory@2.0.0/Experience
kip://ldclabs/organization@1.3.0/works_for
```

---

## 20.3 Package path

Recommended path grammar:

```text
lowercase ASCII segments
segments separated by "/"
segment chars:
    a-z
    0-9
    "-"
```

Formal lexical grammar MAY be tightened in a later patch.

---

## 20.4 Exact-version persistence

Durable KIP state MUST persist exact Schema version identities.

Version ranges/floating aliases MAY be used only for resolution before persistence.

---

## 20.5 Symbol kinds

A Package MAY define symbols including:

```text
Concept Type
Predicate
Facet
Structural Field
constraint/rule descriptors
aliases
migration descriptors
model hints
```

---

## 20.6 Local names

KQL/KML/META MAY use local names such as:

```text
Person
timezone
MnemonicState
has_step
```

when they resolve unambiguously through the active Schema Environment.

---

## 20.7 Ambiguous aliases

If a local symbol is ambiguous, the runtime MUST fail rather than guess.

Recommended error:

```text
SchemaSymbolAmbiguous
```

---

## 20.8 Schema Environment

A **Schema Environment** is the exact active set of Package versions and alias/default resolution for one MemorySpace.

It is protected Governance state.

---

## 20.9 Schema Lock

A Space SHOULD maintain an exact Schema Lock or equivalent deterministic environment record.

---

## 20.10 Schema mutation

Ordinary KML MUST NOT:

```text
install packages
activate packages
change defaults
change aliases
block packages
```

These require protected Schema/Governance operations.

---

## 20.11 Package artifact

A Package Artifact SHOULD be:

```text
immutable
versioned
hashable
optionally signed
dependency-explicit
non-executable by default
```

---

## 20.12 Validation-only loading

A Schema Package embedded in a Capsule MAY be loaded temporarily for:

```text
verification
validation
preview
```

without being activated in the destination Space.

---

## 20.13 The Core Package

`kip://core` is a **virtual, built-in Schema Package defined by this Specification itself**.

```text
its version is the protocol version (kip://core@2.0.0 for this Specification)
it is implicitly active in every Schema Environment
it MUST NOT be deactivated, replaced, or shadowed
it has no separate package artifact
a dependency declaration on kip://core MAY therefore omit an artifact digest;
its identity is the protocol version
```

`kip://core@2.0.0` exports the following symbols.

**Core element kinds** (referable as, e.g., `kip://core@2.0.0/Assertion`):

```text
Concept
Proposition
Assertion
Evidence
Activity
```

**Reserved Core structural fields** (resolved by the source element's Core kind, not through package aliases):

```text
evidence       Assertion → Evidence            role-qualified citation (§56.2)
source         Evidence  → Concept | Evidence  origin of the observation/artifact
generated_by   Evidence  → Activity            producing Activity
inputs         Activity  → any Core element    provenance inputs
outputs        Activity  → any Core element    provenance outputs
associated_actors  Activity  → Concept         semantic actors involved in the process (not authority, not the Principal)
```

**Core registries**:

```text
stance                support | reject | uncertain
mode                  observed | stated | inferred | predicted | hypothetical | imported
Assertion lifecycle   active | retracted | superseded | expired (computed, §14.3)
Evidence lifecycle    active | corrected (§57.2)
Evidence role         support | challenge | context
Activity status       pending | running | completed | failed | cancelled
Activity terminal     completed | failed | cancelled
belief status         accepted | rejected | contested | uncertain | insufficient
```

A Schema Package MUST NOT define or alias a symbol that shadows a reserved Core symbol name in its resolution scope. Registries documented as extensible (for example `activity_class` values) MAY be extended with additional values through package registry extensions.

---

## 20.14 Symbol Lineage

A Schema symbol has two identities:

```text
exact identity      kip://<package-path>@<exact-version>/<symbol>
lineage identity    kip://<package-path>/<symbol>
```

The exact identity is what durable state persists (§20.4) and what validation uses: an element is validated against the definition its `schema_ref` names, and a Proposition's object is validated against the Predicate definition its `predicate_ref` names.

The lineage identity is what **identity and matching** use. Every rule that compares, matches, or deduplicates by symbol operates on the lineage, so that elements written under different versions of one package remain one population:

```text
key uniqueness                       §7.3
Proposition tuple identity           §12.3
type: / MATCH sugar                  §43.1, §54.4
Predicate resolution in patterns     §43.2, §46, §47, §55
Facet and Structural Field names     §44.1, §17
Capsule identity mapping             §38.2
```

Rules:

- A local name resolves to a lineage, not to one version. It is ambiguous (§20.7) only when two distinct package paths export it.
- A read sees every readable version of a lineage. A write that creates an element binds it to the Schema Environment's current write version of that lineage.
- Two versions of one package path that define the same symbol name define the same lineage. A package that intends a different meaning MUST use a different symbol name or a different package path; a fork is a distinct lineage even when its content is identical.
- A later version MAY declare a symbol renamed, naming its successor, or retired. Resolution and identity follow a declared rename; a retired symbol ends its lineage at that version, and elements bound to earlier versions remain readable under it.
- Changing an element's exact `schema_ref` to another version of its lineage is a Schema migration under `manage_schema` (§20.10), never ordinary KML.

Without this rule a package upgrade would partition memory: pending Commitments written under the old version would stop matching `{type: "Commitment"}`, an upsert by `key` would mint a duplicate, and a `BELIEF SLOT` over the new Predicate version would report `insufficient` above a slot full of Assertions.

---

## 20.15 Predicate definition fields

A Predicate definition carries the declarations that §12.7, §24, and §25 refer to. A Package MUST express them with these fields:

```text
subject               {concept_types: [...]} | {kinds: [...]}
object                {concept_types: [...]} | {kinds: [...]} | {literal_types: [...]}
                      plus nullable: true where null is a permitted object (§9.5),
                      and format: "timestamp" | "uri" | <package-defined name> for a
                      string Literal whose shape the Predicate constrains (§9.2);
                      format is validated on write and never affects identity
functional            true  → at most one accepted object per subject at one valid time;
                              more form a conflict set (§25.1)
open_world            true  → absence of a Proposition means insufficient (§24)
                      false → the Space's snapshot is authoritative for this Predicate
                              and absence may be read as closed-world (§24.2)
complete              true  → the candidate objects of a functional slot are exclusive:
                              accepting one rejects the others (§25, exclusive-value)
boolean_completeness  true  → for a boolean-valued Predicate, object false is the
                              negation of object true (§12.7); false keeps them
                              structurally distinct claims
temporal_conflict     "overlapping_valid_time" → two accepted values conflict only
                              when their valid intervals overlap (§25.2)
                      "none" → values never conflict on time
```

Defaults when a field is absent: `functional: false`, `open_world: true`, `complete: false`, `boolean_completeness: false`, `temporal_conflict: "overlapping_valid_time"`. A Projection Policy MAY be stricter than a declaration, never looser: it cannot treat an `open_world: true` Predicate as closed.

---

# 21. Epistemic Model

## 21.1 Epistemic Projection

An **Epistemic Projection** is a policy-bound, time-bound, purpose-bound interpretation of visible/authorized:

```text
Assertions
Evidence
Provenance
Trust
Schema conflict rules
```

over one or more Propositions.

Conceptually:

```text
Belief =
Projection(
  Assertions,
  Evidence,
  Provenance,
  Trust,
  Time,
  Context,
  Purpose,
  Policy
)
```

---

## 21.2 Projection is read-only

Projection output is a virtual view.

A projection MUST NOT become durable self-belief merely because it was read.

---

## 21.3 Belief statuses

Baseline statuses:

```text
accepted
rejected
contested
uncertain
insufficient
```

An implementation MAY add namespaced statuses if capability-negotiated.

---

## 21.4 `accepted`

Meaning:

> eligible support is sufficient under the Projection Policy and unresolved opposition is below the policy boundary.

---

## 21.5 `rejected`

Meaning:

> eligible opposition is sufficient under the Projection Policy.

It MUST NOT be produced merely because support is absent.

---

## 21.6 `contested`

Meaning:

> material support and material opposition coexist and remain unresolved.

A contested projection MAY still have a leading side; the output's `leading` field (§27.2) discloses it. Disclosure is not resolution: `leading` never turns `contested` into `accepted` or `rejected`.

---

## 21.7 `uncertain`

Meaning:

> meaningful epistemic material exists but is weak, stale, ambiguous, low-trust, underdetermined, or otherwise insufficient for acceptance/rejection.

---

## 21.8 `insufficient`

Meaning:

> no sufficient eligible epistemic basis exists.

This is the open-world unknown state.

---

## 21.9 Materialized Projection

Epistemic Projection remains a view (§21.2), but an implementation MAY cache/materialize projection results so that stable beliefs can be recalled at lookup cost.

A materialized projection MUST be identified by at least:

```text
Projection Policy identity + version
snapshot_seq basis
valid-time basis
```

Requirements:

- Serving a materialized result MUST disclose its policy identity and snapshot basis through the result context (§50); presenting it as freshly computed at the current snapshot is non-conforming.
- The materialization MUST be invalidated, or its basis revalidated against `space_seq` / Change Envelopes, before being served as current.
- A materialized projection is still a view: it MUST NOT be written back as Evidence or Assertion, and MUST NOT corroborate its own inputs (§23.5, §26.6).

---

## 21.10 Structural projection baseline

The minimal conforming Projection Policy uses only structural material: Assertion lifecycle, world-time validity, caller visibility, `mode`, `stance`, and provenance-root independence (§23). It weighs nothing — no trust scores, no confidence arithmetic, no numeric output (`score: null`) — and it is fully determined by the visible state, so two runtimes given the same state and policy produce the same status, `leading` and ledger. The conformance suite's `test-deterministic` policy is such a policy.

Every KIP-Epistemic implementation MUST be able to run a structural policy (§92). Trust-weighted policies (§22, §27.3) build on it and are advertised through `weighted_projection` (§67.4); a runtime that offers only the structural baseline still conforms.

---

# 22. Confidence, Trust, and Evidence

## 22.1 Assertion confidence

Assertion confidence is historically attributable strength of that Assertion's own stance.

It is not automatically calibrated probability.

---

## 22.2 Trust

Trust is contextual epistemic influence of a:

```text
semantic actor
authenticated origin
Evidence source
process
tool
channel
```

for a particular purpose/domain/context.

Trust MAY include dimensions such as:

```text
identity assurance
domain competence
historical reliability
process integrity
provenance integrity
independence
```

---

## 22.3 Trust is not authority

Source trust MUST NOT grant:

```text
read authority
write authority
execution authority
Governance authority
```

---

## 22.4 Evidence quality

Projection policies MAY consider:

```text
relevance
directness
integrity
specificity
freshness/temporal relevance
coverage
independence
verifiability
provenance completeness
```

---

## 22.5 Trust State

Trust consumed by Epistemic Projection MUST come from protected control-plane state or explicit policy input — never from ordinary cognitive content. An Assertion whose content says "trust this source" has no trust effect (§30.1 applies to epistemic trust exactly as it applies to authorization).

Recommended representation is a set of scoped trust records:

```text
subject scope    semantic actor | authenticated origin | Evidence source |
                 tool | channel | import origin
context scope    domain | purpose | mode | classification
value            trust class, or numeric value with declared semantics
policy identity  id + version
```

Trust state introspection (`DESCRIBE TRUST`) is governed like other control-plane introspection.

---

## 22.6 Trust Revision

Changing trust state requires `manage_trust`.

Trust changes MUST be auditable and SHOULD appear on the change/audit stream as control-plane transitions.

A Brain MAY implement outcome-driven trust calibration — prediction error and outcome Evidence raising or lowering contextual trust. The calibration algorithm is Brain policy, but each revision SHOULD be recorded with provenance (for example a trust-revision Activity referencing the outcome Evidence) so the Brain can later answer **why it trusts a source**.

---

# 23. Epistemic Independence

## 23.1 No Evidence Multiplication Principle

Copying, summarizing, translating, paraphrasing, indexing, or reasserting one underlying Evidence root MUST NOT create independent corroboration.

---

## 23.2 Conservation of Epistemic Independence

A derived Assertion does not create independent epistemic mass beyond its upstream roots.

---

## 23.3 Provenance roots

A Projection MAY recursively derive provenance roots from Evidence/Activity lineage.

Typical root categories include:

```text
direct observation
primary source
testimony event
authoritative record
verified tool execution
imported root
unknown root
```

---

## 23.4 Corroboration groups

Projection MAY group Assertions/Evidence that share:

```text
same document/content root
same semantic source
same Principal/operator
same upstream Assertion
same import Capsule
same tool execution
same observation event
same derivation chain
```

---

## 23.5 Cycles

Circular provenance MUST NOT amplify support without an external root.

---

# 24. Open-World Semantics

KIP 2.0 is open-world by default.

```text
not found
    ≠
false

no support for P
    → insufficient
```

unless an explicitly declared closed-world schema/policy applies.

---

## 24.1 Evidence of absence

Absence may count as Evidence only when the observation process had meaningful detection coverage.

---

## 24.2 Closed-world exception

A bounded authoritative snapshot MAY explicitly define closed-world semantics for a domain/Predicate.

This MUST be declared by Schema/Projection Policy.

---

# 25. Conflict Model

Projection SHOULD distinguish conflict types including:

```text
direct stance conflict
functional-value conflict
exclusive-value conflict
cardinality conflict
type/schema conflict
temporal conflict
declared causal/logical conflict
```

---

## 25.1 Functional Predicate

A Schema may declare a Predicate functional for a given context.

Multiple overlapping accepted candidate values then form a conflict set.

---

## 25.2 Temporal non-conflict

Two values valid over non-overlapping world intervals need not contradict.

---

## 25.3 Contextual non-conflict

Different contexts MAY make apparently different Assertions non-conflicting.

---

# 26. Assertion Modes

## 26.1 Hypothetical

Hypothetical Assertions SHOULD be excluded from ordinary current-world Projection unless scenario policy explicitly includes them.

---

## 26.2 Predicted

Predicted Assertions represent forecasts, not observations.

Later outcome Evidence MAY validate/refute them.

---

## 26.3 Imported

Imported Assertion means transported cognition, not local endorsement.

---

## 26.4 Stated

Stated Assertion represents testimony/statement.

Trust depends on the semantic actor, identity assurance, context, and policy.

---

## 26.5 Observed

Observed does not automatically mean true.

Tool/instrument/source quality still matters.

---

## 26.6 Inferred

Inferred Assertions SHOULD preserve derivation provenance.

They MUST NOT independently corroborate their own premises.

---

# 27. Projection Request and Output

## 27.1 Projection context

A projection request SHOULD support:

```text
purpose
risk
valid_at
as_of cognitive state
policy
include historical
include hypothetical
explanation level
```

---

## 27.2 Projection output

Conceptual output:

```json
{
  "status": "accepted",
  "leading": "support",

  "support": {
    "score": null,
    "score_semantics": null,
    "assertion_ids": [],
    "root_groups": []
  },

  "opposition": {
    "score": null,
    "score_semantics": null,
    "assertion_ids": [],
    "root_groups": []
  },

  "uncertainty": {
    "level": null,
    "reasons": []
  },

  "temporal": {
    "valid_at": "...",
    "as_of_seq": 1500
  },

  "policy": {
    "id": "...",
    "version": "..."
  },

  "explanation": {}
}
```

`leading` names the side the policy would favor if it were forced to choose: `support` under `accepted`, `opposition` under `rejected`, and under `contested` the side with more eligible independent trusted roots, using the tie-break the policy declares (§27.1); an exact tie, `uncertain` and `insufficient` report `none`. `leading` is disclosure for a consumer that must act anyway (Brain Recall surfaces both sides and names the heavier one); it never changes `status`.

---

## 27.3 Score semantics

If numeric scores are returned, semantics MUST be declared, e.g.:

```text
ordinal_strength
normalized_support
calibrated_probability
log_odds
implementation_specific
```

Support and opposition MUST NOT be assumed to sum to 1.

---

## 27.4 Explanation

Projection MAY expose an external **Epistemic Ledger** containing:

```text
contributing Assertions
opposing Assertions
Evidence roots
corroboration groups
trust decisions
eligibility exclusions
temporal exclusions
warnings
```

It MUST NOT require private chain-of-thought.

---

# 28. Governance

## 28.1 Protected control plane

Governance is engine-authoritative protected state.

Ordinary cognitive content cannot grant Governance permissions.

---

## 28.2 Principal

A **Principal** is an authenticated execution identity established by the runtime.

A Principal is not the same object as a semantic Person/Agent Concept.

---

## 28.3 ActorBinding

An **ActorBinding** is trusted Governance state connecting a Principal to one or more semantic actors and representation scopes.

Ordinary cognition MUST NOT create authoritative ActorBinding state.

---

## 28.4 Recording attribution vs representation

Governance SHOULD distinguish:

```text
record_attributed_assertion
    "I record that Alice said P."

assert_as_actor
    "I exercise authority as Alice to assert P."
```

These are different permissions, and the runtime decides which one a write needs from `asserted_by` and the caller's ActorBinding, never from the Assertion's text:

```text
asserted_by is an actor the Principal's ActorBinding covers
    → assert (the Principal's own stance, or a bound representation)

asserted_by is any other actor
    → record_attributed_assertion ("Alice said P", recorded by this Principal);
      engine origin shows the recorder, and the Assertion carries no representation

policy requires representation for that actor (for example: claims by the
Space's $self may be written only by Principals bound to it)
    → assert_as_actor, and without the binding the write fails ActorBindingRequired
```

The `ASSERT` sugar (§55.1) is bound by the same rule through its `by` member.

---

## 28.5 Group / role / Grant / Delegation

Governance MAY support:

```text
Principal Groups
Roles
Grants
Delegations
```

A Role is ergonomic policy sugar; effective permission semantics are authoritative.

Delegation SHOULD be attenuating and non-transitive by default unless explicitly permitted.

---

## 28.6 Revocation

Delegation/Grant revocation MUST be revalidated for security-sensitive writes at commit.

---

# 29. Permission Model

Baseline permission families include:

```text
Discovery / Read
Cognitive Mutation
Epistemic Mutation
Identity
Maintenance
Sharing
Lifecycle
Schema
Governance
Authority
Audit
```

The Core permissions — the names every KIP-Governance implementation (§93) registers, because a gate in this Specification asks for each:

```text
discover
read
search
project

create
update

assert
record_attributed_assertion
assert_as_actor
retract_own
supersede_own

merge_identity

maintain
manage_retention
manage_legal_hold

export
import

archive
tombstone
purge

manage_schema
manage_policy
manage_grants
manage_delegation
manage_actor_binding
quarantine
declassify
approve

elevate_authority

read_audit
read_history
read_raw_origin
```

The Extended permissions exist only where the capability that gates them is advertised (§67.4). A runtime that does not advertise the capability MUST reject the name where a Grant names it, rather than accept authority that nothing will ever ask for (§29.6):

```text
derive            derive_permission
record_outcome    record_outcome_permission
manage_trust      weighted_projection
```

Implementations MAY refine names/scopes but MUST preserve equivalent semantic distinctions when claiming full Governance conformance.

---

## 29.1 `discover`

Controls whether a Principal may learn that an element/match exists.

Without discovery permission, the runtime MAY return not-found-equivalent behavior.

---

## 29.2 `read`

Allows permitted content fields of known elements.

Field-level redaction MAY apply.

---

## 29.3 `search`

Allows associative/lexical/semantic retrieval over the authorized search universe.

Governance MUST apply before user-visible ranking effects.

---

## 29.4 `project`

Allows Epistemic Projection under permitted policies.

A policy MAY allow a projected result without revealing raw Evidence.

---

## 29.5 `update`

Allows mutable non-protected fields only.

It does not imply permission to rewrite immutable semantic/epistemic history.

---

## 29.6 `derive`

Allows creation of derived cognitive output subject to:

```text
classification propagation
provenance preservation
authority non-amplification
Same-Space reference closure
```

A write is a derivation when it establishes the provenance edge `LIST DEPENDENTS` traverses (§63.5) — an element recorded as an output of an Activity that has at least one input:

```text
X ∈ Activity.inputs
    → that Activity
    → each element in Activity.outputs
```

A runtime that implements `derive` MUST require it of the write that establishes such an edge, whether that write creates the output inside the Activity's own transaction or later adds an existing element to `Activity.outputs`. It is required **in addition to** the permission the creation itself needs and never instead of it: a Grant conferring only `derive` confers nothing.

The trigger is that edge and not the presence of references, because the four constraints above are all about what an output inherits from its inputs. An element that merely cites what it records — an Assertion naming its Proposition, an Evidence record naming its source — inherits nothing and is not a derivation; requiring `derive` of it would leave `create` and `assert` unusable on their own. An Activity with no inputs records a process that observed the world rather than one that transformed what the Brain already held, and propagates nothing.

A runtime that does not distinguish derived writes MUST reject `derive` where a Grant names it, rather than accepting a name no gate will ever ask for. A permission that is accepted and gates nothing is authority that looks conferred and is not, and its holder discovers that during an incident.

Reference closure (§5.3) MUST be revalidated on derived and maintenance writes exactly as on primary writes; derivation is not an exempt write path.

---

## 29.7 `purge`

Physical erasure is high-impact and SHOULD be separately scoped/audited.

---

## 29.8 `record_outcome`

Allows creation of `outcome`-class Evidence (§15.7) and of the observation Activity that links an outcome to the decision it grades.

Governance SHOULD grant it to instrumentation Principals — telemetry, verifiers, test harnesses, human reviewers — and SHOULD NOT grant it to a Principal whose ActorBinding covers the actor whose actions those outcomes grade. A deployment in which one Principal both acts and observes cannot satisfy Invariant 36 by construction: it MAY still run the channel, but its verdicts are then self-graded, and a consumer's origin check (§15.7) MUST be able to see that from `_system.origin` alone.

The observation edge — the decision Activity in `inputs`, the Outcome Evidence in `outputs` — records an observation of the world, not a transformation of held cognition. It does not additionally require `derive` (§29.6); the outcome's classification follows its own Governance hook and policy.

A runtime that does not distinguish `record_outcome` MUST reject the name where a Grant names it, for the reason given in §29.6.

---

## 29.9 `manage_legal_hold`

Allows setting and lifting `retention.legal_hold` (§19.1). It is distinct from `manage_retention`: a `SET RETENTION` that touches `legal_hold` without it fails `NotAuthorized`, however the rest of the retention hook is authorized. A hold blocks erasure for everyone (§60.3), so the authority to place or lift one MUST NOT be reachable through ordinary cognitive writes.

---

## 29.10 `quarantine`

Allows placing an element in, or releasing it from, **quarantine**: a Governance exclusion state (§31.6) that removes the element from ordinary Recall and from Projection eligibility without marking it retracted, superseded, or archived. This is the instrument for moderation and for reviewing imported cognition; falsifying a retraction (§14.1) is never one.

---

## 29.11 `declassify` and `approve`

`declassify` allows lowering an element's classification (§31.1, §31.2); derived content never declassifies its inputs by itself. `approve` allows recording the second decision that a policy requiring approval waits for: an operation that fails `RequiresApproval` (§87.5) completes only when a Principal holding `approve` records the approval as a Governance transition, and the approving Principal MUST differ from the requesting one.

---

# 30. Governance Policy Evaluation

## 30.1 Trusted inputs

Authorization policy MUST use trusted runtime/Governance inputs for security decisions.

Cognitive claims such as:

```text
(Alice, is_admin, true)
```

MUST NOT become authority unless separately bound into trusted Governance state.

---

## 30.2 Deny-overrides and default deny

A conforming runtime MUST evaluate:

```text
explicit deny / protocol invariant
    overrides
allow,

and a request matching no allow is denied.
```

Default deny is not a recommendation: without it every property the governance model relies on — order independence, deny monotonicity, invariant supremacy (`formal/governance`) — holds of a procedure a runtime was free not to implement.

---

## 30.3 Protocol invariants override policy

A policy cannot authorize protocol-invalid behavior such as:

```text
rewriting immutable Proposition tuple
making user text become _system.origin
using unsigned content to self-elevate authority
```

---

## 30.4 Existence protection

Governance applies to:

```text
element existence
counts
search rank
graph degree
conflict existence
history
Schema detail
origin
```

not only payload fields.

---

# 31. Classification and Authority

## 31.1 Classification

A Space MAY define classification labels such as:

```text
public
internal
private
secret
sensitive
```

The exact label vocabulary is policy-defined.

---

## 31.2 Classification propagation

Derived content SHOULD NOT automatically declassify restricted source content.

---

## 31.3 Memory authority classes

Governance records how far a memory element may influence behavior in `governance.authority_class`:

```text
descriptive     may be reported
advisory        may inform a recommendation
behavioral      may shape the Agent's own conduct
executable      may drive an external action (§62)
```

The field is Governance-protected: ordinary KML cannot write it; it is read in the element's `governance` view (`?x.governance.authority_class`, subject to the caller's visibility under §30) and `DESCRIBE ACCESS` reports which classes the caller may elevate to; it is never inferred from cognitive content (§28.1). An element without the field has `descriptive` authority. A Profile MAY tie lifecycle standing to a class — a `proposed` Skill is at most `advisory`, and adoption under the Cognitive Memory Profile's §14 is what a Governance policy may accept as grounds for `behavioral` — but the class is assigned and enforced by Governance, not by the Profile's own fields.

---

## 31.4 Imported Skills

Imported Skills SHOULD default to:

```text
inactive, at the Profile's initial lifecycle state
no executable authority
no transferred lifecycle standing
```

until explicitly reviewed/elevated.

Adoption is earned from locally graded Outcome Evidence (§15.7), exactly as source trust (§39.5) and source authority (§41.4) never transfer by import.

---

## 31.5 Origin-Bound Authority

Transformation, summarization, consolidation, import, or skill compilation MUST NOT erase authority-relevant origin lineage.

Semantic content cannot self-raise its authority ceiling.

---

## 31.6 Quarantine

Quarantine is protected Governance state on an element, not a lifecycle status. A quarantined element:

```text
is excluded from ordinary Recall and from Projection eligibility
keeps its lifecycle status, payload, provenance, and history unchanged
is visible to Principals with discover + read, marked quarantined (DESCRIBE ACCESS)
is placed and released only under the quarantine permission (§29.10)
```

Capsule `isolate` import (§39.2) places imported elements in quarantine. Quarantine is how moderation and review are recorded without lying about what the source said.

---

# 32. Transactions

## 32.1 Definition

A **Transaction** is one atomic durable state transition in one MemorySpace.

A state-changing Transaction MUST provide:

```text
one start snapshot
read-your-writes
no partial durable visibility
atomic commit or abort
commit-time authorization validation
ordered Commit Record
```

---

## 32.2 Recommended isolation

Full KIP 2.0 state-changing transaction conformance SHOULD provide serializable outcome semantics.

If weaker isolation is supported, it MUST be capability-declared and MUST NOT silently satisfy a request for stronger isolation.

---

## 32.3 Transaction phases

Observable semantics MUST be equivalent to:

```text
1. receive / normalize
2. resolve idempotency
3. authenticate Principal
4. bind Space
5. capture read snapshot
6. resolve Schema Environment
7. authorize
8. parse/desugar
9. execute tentative plan with read-your-writes
10. validate Core + Schema constraints
11. compute final write set
12. validate serializability/preconditions
13. revalidate security-sensitive Governance
14. commit atomically
15. assign space_seq + committed_at
16. update _system fields
17. append Commit Record
18. publish Change Envelope
19. return Receipt
```

Implementation phases MAY be fused/reordered where observable semantics remain equivalent.

---

## 32.4 Transaction ID

Each finalized transaction has an engine-assigned:

```text
tx_id
```

---

## 32.5 Start snapshot

A Transaction captures:

```text
snapshot_seq
```

representing the Space state from which it started.

---

## 32.6 Read-your-writes

Inside a transaction, later reads MUST see that transaction's tentative prior writes where relevant.

---

## 32.7 No dirty reads

Other transactions/readers MUST NOT observe tentative writes before commit.

---

## 32.8 No-effect

A transaction whose final durable state is unchanged SHOULD return:

```text
no_effect
```

and SHOULD NOT allocate a new cognitive `space_seq`.

---

# 33. Commit Record and Receipt

## 33.1 Commit Record

Every state-changing commit appends an immutable logical Commit Record.

Recommended fields:

```text
tx_id
space_id
space_seq
snapshot_seq
committed_at
transaction_class
request_digest
result_digest
semantic_plan_digest
Schema Environment identity
Governance decision/audit refs
change summary
origin Principal
```

---

## 33.2 Receipt

A Receipt is the client-visible projection of a transaction outcome.

Successful state-changing commit Receipt SHOULD include:

```json
{
  "tx_id": "tx-...",
  "space_id": "space-...",
  "snapshot_seq": 1500,
  "space_seq": 1501,
  "committed_at": "...",
  "status": "committed",
  "transaction_class": "cognitive",
  "request_digest": "sha256:...",
  "semantic_plan_digest": "sha256:...",
  "schema_environment_version": 17,
  "receipt_digest": "sha256:...",
  "origin": {
    "principal_id": "principal-...",
    "actor_binding_id": null,
    "delegation_digest": null
  }
}
```

`receipt_digest` is the canonical digest (§37.7) of the Receipt without `receipt_digest` and `proofs`; a signed Receipt (§33.3) signs it. `origin` records the Principal the commit was attributed to, the ActorBinding it exercised (§28.3), and the digest of the delegation chain it acted under (§28.5), so an auditor can tie the Receipt to the Governance decision without reading the audit log.

---

## 33.3 Signed Receipt

A runtime MAY support cryptographically signed Receipts.

A signed Receipt proves what the Nexus attested it committed, not the objective truth of Assertions inside the transaction.

---

# 34. Idempotency

## 34.1 Transaction idempotency key

A state-changing transaction MAY include:

```text
idempotency_key
```

---

## 34.2 Scope

The key MUST be scoped so unrelated callers cannot collide, at least across:

```text
MemorySpace
authenticated Principal/authority namespace
operation endpoint/class
```

---

## 34.3 Same key, same request

The runtime MUST return the original retained transaction outcome rather than re-execute.

Retention covers every finalized outcome, including `no_effect`: a `no_effect` outcome MUST be retained and replayed exactly like a committed outcome, even though it allocates no `space_seq` and appends no Commit Record (§32.8, §33.1).

A transaction that aborts before finalizing (precondition, validation, authorization, or serialization failure) MUST NOT bind the key: the failure is not a retained outcome, and a later request with the same key executes normally.

---

## 34.4 Same key, different request

The runtime MUST fail:

```text
IdempotencyConflict
```

---

## 34.5 Retention

Runtime MUST expose/document idempotency retention if it is bounded: the window is reported as the `idempotency_retention` capability (§67.4) and SHOULD be at least 24 hours, long enough for a client that lost a response to recover through §80.4 after an ordinary outage. Once the window has elapsed, a lookup or replay reports `TransactionUnknown` with `details.expired = true`, so a client can tell a forgotten key from one it never sent.

---

## 34.6 Retry distinction

```text
network retry
    ≠
repeated Experience
```

The protocol MUST preserve genuine repeated observations/statements when they represent distinct source events.

---

# 35. Preconditions and Concurrency

## 35.1 `EXPECT VERSION`

A mutable existing element MAY be guarded by:

```text
EXPECT VERSION n [OF ATTRIBUTES | STRUCTURAL | RETENTION | FACET "<symbol>"]
```

Without `OF`, the mutation succeeds only if the current `_system.version == n`.

With `OF`, the guard names a **version plane** and compares `n` against that plane's own counter in `_system.plane_versions` (§6.3): `attributes` (fields and attributes), `structural` (Structural References), `retention` (the retention record), or `facets["<symbol>"]` (one Facet). A plane counter advances only when that plane changes, while `_system.version` advances on every change. A guard on one plane is therefore not spoiled by a concurrent write to another: a `MnemonicState` decay sweep does not invalidate a status verdict guarded `OF ATTRIBUTES`, and the verdict does not invalidate the sweep.

`EXPECT VERSION` is always the trailing clause of a mutation (§52.8) and MAY repeat, one guard per plane; naming the same plane twice is a syntax error. A mismatch on any guard fails the statement with `VersionConflict`, whose `details.plane` names the plane that mismatched, and nothing in the transaction commits (§33).

---

## 35.2 Create-only guard

Where supported:

```text
EXPECT VERSION 0
```

means the addressed logical identity must not already exist. Only the bare form is create-only: `EXPECT VERSION 0 OF <plane>` is an ordinary plane guard (§35.1) stating that the plane has never been written.

---

## 35.3 Lifecycle preconditions

There is no `EXPECT STATE` guard. `TRANSITION` (§52.5) validates the target's current lifecycle state against the requested move itself and fails `InvalidLifecycleTransition` when the move is not legal from that state, so an expected-state clause could only restate what the engine already checks. A caller who must additionally know that nothing else changed guards the element's version.

---

## 35.4 Space/schema preconditions

Transaction envelopes MAY include:

```text
space_seq
schema_environment_version
```

preconditions.

---

## 35.5 Version increments

A pre-existing element changed by one committed transaction increments version exactly once for that transaction.

A new element starts at version `1`.

---

# 36. Change Stream

## 36.1 Change Envelope

One state-changing commit yields one logical Change Envelope.

Normative shape (`schemas/kip-change-envelope.schema.json`):

```json
{
  "space_id": "space-1",
  "space_seq": 1501,
  "tx_id": "tx-900",
  "committed_at": "...",
  "transaction_class": "cognitive",
  "changes": [
    {
      "op": "create",
      "kind": "assertion",
      "id": "A-2",
      "new_version": 1,
      "refs": {"proposition": "P-1"}
    },
    {
      "op": "lifecycle",
      "kind": "assertion",
      "id": "A-1",
      "old_version": 2,
      "new_version": 3,
      "state": {"from": "active", "to": "superseded"},
      "refs": {"proposition": "P-1"}
    },
    {
      "op": "update",
      "kind": "concept",
      "id": "C-7",
      "schema_ref": "kip://profiles/cognitive-memory@2.0.0/Commitment",
      "old_version": 4,
      "new_version": 5,
      "touched": ["attributes.status", "facets.MnemonicState"],
      "planes": {"attributes": 3, "facets": {"MnemonicState": 2}}
    }
  ]
}
```

Each entry MUST carry `op` (`create | update | lifecycle | retention | merge | purge | payload_purge`), `kind`, `id`, and `new_version`; `old_version` where the element existed; `state {from, to}` for `lifecycle`; `schema_ref` for Concepts; `refs.proposition` for Assertion entries and `refs.subject` + `refs.predicate_ref` for Proposition entries; `planes`, the plane counters (§6.3) after the commit for each plane the entry touched; and `touched`, the list of paths changed — attribute, Facet, Structural Field, or retention names — carrying names, never values. That is the minimum a Watch (Cognitive Memory Profile) needs to decide whether a slot, an element, or a type moved, without payload.

Existence protection (§30.4) applies per entry: an element the consumer may not discover is omitted from the envelope it receives. Payload beyond the entry — old and new values — is not part of the envelope; a consumer reads it under its own authority.

---

## 36.2 Atomicity

Consumers MUST treat all changes in one envelope as one cognitive transition.

---

## 36.3 Delivery

Delivery MAY be at-least-once.

Consumers MUST be able to deduplicate by:

```text
space_id + space_seq + tx_id
```

A runtime MAY offer filtered change delivery — for example, only envelopes touching declared elements, kinds, or types — as a negotiated capability (§67). Filtering is a transport convenience: it MUST NOT change envelope content, atomicity, or `space_seq` ordering within the delivered subset.

---

## 36.4 Replay

Change replay MUST NOT become new Evidence, reinforcement, or duplicated Experience merely because a downstream consumer receives the same envelope twice.

---

# 37. Cognitive Capsule

Sections 37–41 are specified in the normative companion [KIP-2.0-Capsule-Specification.md](./KIP-2.0-Capsule-Specification.md), which keeps this numbering so that every reference to §37–§41 from the Core, the Profile and the conformance suite resolves there unchanged:

```text
§37  Cognitive Capsule
§38  Capsule Identity Model
§39  Capsule Import Modes
§40  Capsule Closure and External References
§41  Capsule Export/Import Pipeline
```

Two rules are restated here because the rest of the Core depends on them. A Capsule is a portable, immutable, inspectable artifact carrying cognitive state or state changes between systems or Spaces; it is never executable mutation authority. Everything a Capsule brings in is re-validated against the destination's Schema Environment and re-authorized under the destination's Governance: source trust, source authority and source lifecycle standing do not transfer (§31.4, §41.4).

---

# 38. Capsule Identity Model

See the Capsule companion, §38.

---

# 39. Capsule Import Modes

See the Capsule companion, §39.

---

# 40. Capsule Closure and External References

See the Capsule companion, §40.

---

# 41. Capsule Export/Import Pipeline

See the Capsule companion, §41.

---

# 42. KQL — Cognitive Query Language

## 42.1 Purpose

KQL is the declarative read language of KIP.

Native KQL reads raw cognitive state unless an explicit Epistemic Projection primitive is used.

---

## 42.2 Query skeleton

Recommended native form:

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
LIMIT ...
CURSOR ...
```

`FIND` and `WHERE` form the baseline structured query.

---

## 42.3 Raw default

A plain Proposition pattern means:

> this visible canonical semantic Proposition exists.

It does not mean the Brain accepts it.

---

# 43. KQL Pattern Families

Baseline pattern families:

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

## 43.1 Concept Pattern

```prolog
?person {
  type: "Person",
  name: "Alice"
}
```

Explicit optional form:

```prolog
?person CONCEPT {...}
```

`type` is schema-resolution sugar for a Concept Type lineage (§20.14): it matches every readable version of that type, and each matched element reports its own exact `schema_ref`.

---

## 43.2 Proposition Pattern

```prolog
?p (?subject, "works_for", ?org)
```

Explicit:

```prolog
?p PROPOSITION (?subject, "works_for", ?org)
```

A Proposition already known by identity is addressed by id **in the same slot**:

```prolog
?p PROPOSITION (id: :proposition_id)
```

The parentheses are not decoration. `( ... )` is the Proposition expression
slot, so the id form is usable everywhere the triple is — including as a `term`
endpoint, which is how a statement about a statement names an existing
Proposition, and as the operand of `BELIEF` (§46.1):

```prolog
?meta (?p, "contradicts", (id: :other_proposition_id))
```

A Proposition is not a field-matched record: its canonical identity is the
tuple (§12.3) and it carries no other native fields (§12.6). The id form is
therefore an alternative *reference*, not an object pattern.

The id form is **match-only**. A statement whose job is to resolve-or-create by
structure — `ENSURE PROPOSITION`, and the `ASSERT` sugar that desugars through
it — MUST reject it, because no structure can be created from an id alone.

Matching is **canonical** (§12.3): an endpoint term matches a stored endpoint whose `merged_into` chain resolves to the same element, so after `MERGE CONCEPT :alicia INTO :alice` both `(:alice, "knows", :bob)` and `(:alicia, "knows", :bob)` find the tuple stored on `alicia`. The binding keeps both views: `?p.subject` / `?p.object` are the stored endpoints (§12.2), `?p.canonical_subject` / `?p.canonical_object` the merge-resolved ones, so `FILTER(?p.subject == :alice)` narrows a canonical match to tuples actually recorded on `alice`. `AS OF SEQ` before the merge resolves nothing through it (§48.1), and `HISTORY` keeps the raw endpoint (§68).

---

## 43.3 Predicate variable

```prolog
?p (?subject, ?predicate, ?object)
```

In native v2, `?predicate` binds the exact canonical Predicate ref.

---

## 43.4 Assertion Pattern

```prolog
?a ASSERTION {
  proposition: ?p,
  asserted_by: ?actor,
  stance: "support",
  mode: "stated"
}
```

---

## 43.5 Evidence Pattern

```prolog
?e EVIDENCE {
  evidence_class: "tool_result"
}
```

---

## 43.6 Activity Pattern

```prolog
?act ACTIVITY {
  activity_class: "inference",
  status: "completed"
}
```

---

## 43.7 Structural Pattern

```prolog
?edge STRUCTURAL (
  ?experience,
  "has_step",
  ?step
)
```

The bound `?edge` is virtual structural query state, not necessarily a durable Cognitive Element.

For an ordered Structural Field, `?edge.index` exposes the reference's current zero-based order (§17.4):

```prolog
ORDER BY ?edge.index ASC
```

---

# 44. KQL Expressions and Clauses

## 44.1 Dot notation

Examples:

```text
?x.id
?x.name
?x.attributes.summary
?a.lifecycle.status
?x._system.version
```

Facet access MAY use bracketed exact/local facet names.

---

## 44.2 FILTER

Baseline operators SHOULD include:

```text
== != < > <= >=
&& || !
```

Baseline registered functions SHOULD include:

```text
IN
CONTAINS
STARTS_WITH
ENDS_WITH
REGEX
IS_NULL
IS_NOT_NULL
IS_LITERAL
IS_ELEMENT
IS_KIND
LITERAL_TYPE
```

These are functions, not infix operators: they are written in call form, e.g. `FILTER(IN(?x.name, ["A", "B"]))`.

---

## 44.3 NOT

```prolog
NOT {
  ...
}
```

means:

> no match exists in the currently authorized visible query universe.

It MUST NOT mean world-level falsehood.

---

## 44.4 OPTIONAL

`OPTIONAL` is a left-join style optional match.

A null result means no visible match, not falsehood.

---

## 44.5 UNION

`UNION` represents alternative pattern branches.

---

## 44.6 Aggregation

Baseline:

```text
COUNT
COUNT(DISTINCT ...)
SUM
AVG
MIN
MAX
```

Aggregation MUST occur over authorized visible solutions.

Grouping is implicit: the non-aggregated projected expressions of the `FIND` list form the grouping key. Aggregates ignore null inputs, so `COUNT(?optional)` returns `0` when every row in its group is null.

`COUNT = 0` does not mean a proposition is false.

---

## 44.7 Ordering

```prolog
ORDER BY <expr> ASC|DESC [, ...]
```

Sort keys are applied left to right.

Null SHOULD sort last unless future explicit syntax says otherwise.

---

## 44.8 Pagination

```prolog
LIMIT :limit
CURSOR :cursor
```

KQL pagination cursor MUST preserve one canonical cognitive snapshot for that traversal.

The engine MUST apply a deterministic tie-breaker within one cursor traversal so that solutions with equal `ORDER BY` values are neither duplicated nor skipped across pages.

Current Governance authority still applies when continuing.

---

# 45. Raw Path Queries

KIP 1-style raw Proposition path operators MAY be preserved:

```prolog
(?x, "is_subclass_of"{0,5}, ?ancestor)
```

and Predicate alternatives:

```prolog
(?x, "related_to" | "depends_on", ?y)
```

These paths traverse stored raw Propositions.

They MUST NOT automatically propagate belief/confidence.

---

# 46. BELIEF Pattern

## 46.1 Syntax

Recommended:

```prolog
?belief BELIEF (
  ?subject,
  "predicate",
  ?object
)
```

or when a Proposition variable is already bound:

```prolog
?belief BELIEF (?p)
```

or when the Proposition is already known by identity (same id form as §43.2):

```prolog
?belief BELIEF (id: :proposition_id)
```

The triple form takes an exact Predicate, never a raw path (§45): projection
MUST NOT propagate belief along a path.

---

## 46.2 Virtual output

`?belief` is a virtual Epistemic Projection result.

It is not persisted Core state.

---

## 46.3 Bounded target

Subject and Predicate MUST be groundable/bound before projection.

An unbounded whole-Brain projection SHOULD be rejected.

---

## 46.4 Fully grounded missing Proposition

A fully grounded BELIEF query MAY return:

```text
status = insufficient
proposition_id = null
```

even if no durable Proposition exists.

A read MUST NOT create the Proposition.

---

# 47. BELIEF SLOT

## 47.1 Syntax

```prolog
?slot BELIEF SLOT (
  ?subject,
  "predicate"
)
```

---

## 47.2 Purpose

BELIEF SLOT evaluates the candidate/conflict set for one subject-predicate semantic slot.

---

## 47.3 Output

Conceptual:

```json
{
  "status": "accepted|contested|uncertain|insufficient",
  "accepted_values": [],
  "candidate_projections": [],
  "uncertainty": {},
  "policy": {},
  "temporal": {},
  "explanation": {}
}
```

---

A slot has no `rejected` status: a slot is not a claim, so it has nothing to reject. Rejection belongs to a candidate's own projection inside `candidate_projections`.

---

## 47.4 Empty slot

A grounded slot SHOULD return:

```text
status = insufficient
accepted_values = []
```

rather than force the Agent to infer unknown from zero raw rows.

---

# 48. KQL Time

## 48.1 `AS OF`

Selects cognitive transaction state by Space sequence:

```prolog
AS OF SEQ 1500
```

`AS OF SEQ` is the only historical axis, in KQL, in META and in `EXPORT CAPSULE`. A transaction id resolves to its `space_seq` through `DESCRIBE TRANSACTION` (§68); a wall-clock instant resolves to the last sequence committed at or before it through `DESCRIBE SNAPSHOT AT TIME :t` (§68). The engine never guesses which of several sequences an instant means, and a historical read always names the exact coordinate it was served from.

---

## 48.2 `FOR TIME`

Selects world-valid time for Epistemic Projection:

```prolog
FOR TIME :world_time
```

---

## 48.3 Independence

```text
AS OF
    cognitive time

FOR TIME
    world-valid time
```

They MUST remain independent.

---

## 48.4 Historical belief distinction

KQL MUST allow the distinction:

```text
what the Brain believed then
    AS OF historical cognitive state

what the Brain now believes about then
    current cognitive state + historical FOR TIME
```

---

## 48.5 Current Governance

Historical reads MUST obey current caller authorization.

Historical state MUST NOT be used to bypass current secrecy.

---

# 49. WITH EPISTEMIC

Recommended:

```prolog
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "low",
  policy: "optional-policy-id",
  include_historical: false,
  include_hypothetical: false,
  explanation: "summary"
}
```

---

## 49.1 Explanation levels

Recommended:

```text
none
summary
ledger
```

---

## 49.2 Redaction

A caller MAY be authorized to receive projection status without raw Evidence.

The result SHOULD disclose when explanation/evidence is redacted.

---

# 50. KQL Result Context

A KQL response SHOULD identify:

```text
space_id
snapshot_seq
schema_environment_version
resolved Epistemic Policy/version when used
world valid time when used
materialized projection policy identity and snapshot basis when a cached projection is served (§21.9)
```

This context may later be preserved as decision provenance.

---

# 51. KML — Cognitive Mutation Language

## 51.1 Purpose

KML expresses cognitive mutation intent.

A KML mutation becomes durable only through Transaction semantics.

---

## 51.2 Core mutation families

Recommended native families:

```text
MUTATE

CREATE CONCEPT
UPSERT CONCEPT
ENSURE PROPOSITION

CREATE EVIDENCE
CREATE ASSERTION
CREATE ACTIVITY

ASSERT            (normative sugar: ensure + assert, §55.1)

UPDATE

TRANSITION        (one lifecycle statement, §52.5)

SET RETENTION
PURGE
PURGE PAYLOAD

MERGE CONCEPT
```

---

# 52. KML Mutation Semantics

## 52.1 CREATE

Creates a historically distinct element unless a `client_key` proves a retry of the same logical creation.

---

## 52.2 ENSURE

Resolves/creates a structurally canonical object.

Used for Proposition.

---

## 52.3 UPSERT

Resolves a stable identity-bearing mutable Concept and applies legal mutable state.

---

## 52.4 UPDATE

Mutates legal mutable fields of existing elements.

UPDATE never creates.

---

## 52.5 TRANSITION

One statement moves lifecycle state; the quoted state names the move:

```text
TRANSITION <target> TO "<state>" [BY <ref>]
           [SET FIELDS {...}] [SET STRUCTURAL {...}]
           [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v ...]
```

| State | Target kind | `BY` | Meaning |
|---|---|---|---|
| `retracted` | Assertion | — | the assertor withdraws the claim (§57.3) |
| `superseded` | Assertion | REQUIRED: the newer Assertion | the claim was wrong; revision lineage (§57.4) |
| `corrected` | Evidence | REQUIRED: the new Evidence | wrong record; correction lineage (§57.2) |
| `running`, `completed`, `failed`, `cancelled` | Activity | — | Activity status (§16); `SET FIELDS` / `SET STRUCTURAL` finalize terminal fields and topology in the same statement |
| `archived` | any element | — | out of ordinary recall, history preserved (§60) |
| `tombstoned` | any element | — | logical deletion, identity and audit preserved (§60) |

The engine validates the move against the target's kind and its current lifecycle state and fails `InvalidLifecycleTransition` otherwise; a move to the state the target already holds is `no_effect` (§34.4); there is no `EXPECT STATE` guard (§35.3). `BY` on any state other than `superseded` / `corrected`, and `SET FIELDS` / `SET STRUCTURAL` on any state other than an Activity state, are syntax errors. The move is recorded in the element's `_system.state` and as a `lifecycle` entry in the Change Envelope (§36.1). `ASSERT ... SUPERSEDING` desugars to this statement (§55.1).

---

## 52.6 MERGE

Performs non-destructive Concept identity consolidation.

---

## 52.7 Bounded selection

A mutation whose `WHERE` block can select an unbounded set accepts an optional
`LIMIT` immediately after that `WHERE`:

```text
UPDATE
TRANSITION
SET RETENTION
PURGE
PURGE PAYLOAD
```

A maintenance sweep that matches more elements than its author expected is a
cognitive-state change, and under `PURGE` an irreversible one. Such a sweep
SHOULD therefore be bounded.

`MERGE CONCEPT` takes no `LIMIT`: its source and target are already named, and
its `WHERE` only guards them.

`LIMIT` bounds how many elements are affected. It is not a selection order, so
a bounded sweep over a larger match set MUST NOT be assumed to be deterministic
unless the runtime documents an order.

---

## 52.8 Clause order and guard position

Every mutation ends the same way: `[WHERE {...}] [LIMIT :n] {EXPECT VERSION ...}`, in that order. `EXPECT VERSION` follows `UPSERT CONCEPT`'s closing brace and `ENSURE PROPOSITION`'s tuple; `PURGE` and `PURGE PAYLOAD` close with their `REFERENCE POLICY` / `CONFIRM "PURGE"` clauses after the guards. A guard never sits between the target and the actions. One statement therefore has one place for its preconditions, and a reader finds them where the statement ends.

---

# 53. MUTATE Block

## 53.1 Syntax

```prolog
MUTATE {
  ...
}
```

A MUTATE block is one coherent declarative mutation plan.

As a standalone KML command, it executes atomically.

---

## 53.2 Local handles

Example:

```prolog
CREATE EVIDENCE ?e {...}
ENSURE PROPOSITION ?p (...)
CREATE ASSERTION ?a {...}
```

Handles are local to the MUTATE block.

They are not durable IDs.

---

## 53.3 Forward references

Native v2 MUTATE SHOULD allow forward local references.

The engine MUST resolve/validate the entire mutation graph before commit.

---

## 53.4 Declarative semantics

Clause source order SHOULD NOT be used as hidden last-write-wins behavior.

Conflicting final mutation specifications for the same existing target SHOULD fail.

---

# 54. CREATE / UPSERT CONCEPT

## 54.1 CREATE

Example:

```prolog
CREATE CONCEPT ?exp {
  TYPE "Experience"
  CLIENT KEY :experience_key
  NAME "Deployment failure"

  SET ATTRIBUTES {
    goal: :goal,
    outcome_status: "failure"
  }

  SET FACET "MnemonicState" {
    memory_strength: 0.8,
    salience: 0.9
  }
}
```

---

## 54.2 UPSERT stable Concept

```prolog
UPSERT CONCEPT ?project {
  MATCH {
    type: "Project",
    key: "kip-2"
  }

  SET FIELDS {
    name: "KIP 2.0"
  }
}
```

---

## 54.3 Native identity selector

Native UPSERT MUST use stable identity such as:

```text
id
key
```

Name-only universal upsert is forbidden.

---

## 54.4 The MATCH type

`MATCH` is an object pattern, so a `type` member inside it is the same
schema-resolution sugar for a Concept Type lineage that it is in a Concept
Pattern (§43.1). It is not decoration, and a runtime MUST honor it in both
halves of an upsert:

```text
resolve   type participates in the identity address (§7.3) as a lineage,
          so a Concept written under an earlier package version is found
create    type is the only source of the new Concept's schema_ref, bound to
          the Schema Environment's write version of that lineage (§20.14)
```

An upsert that would create a Concept and declares no type MUST fail rather
than mint an untyped one (§10.3).

A declared type that the resolved element does not carry is not a match. Where
the selector is `key`, the upsert proceeds to create under that type; where it
is `id`, the upsert cannot create (§53) and MUST fail existence-neutrally,
without reporting the type it found.

---

# 55. ENSURE PROPOSITION

```prolog
ENSURE PROPOSITION ?p (
  :alice,
  "timezone",
  "+08:00"
)
```

The runtime resolves:

```text
exact Predicate ref
canonical subject/object identity
typed Literal
canonical Proposition
```

No Assertion is created by ENSURE alone.

`ENSURE PROPOSITION ... EXPECT VERSION 0` is the create-only form (§35.2): it fails if the canonical Proposition already exists, instead of resolving to it.

Predicate symbols in examples resolve through the active Schema Environment: `prefers` and `caused_by` are defined by the Cognitive Memory Profile, while domain facts such as `timezone` come from an activated domain package.

---

## 55.1 The `ASSERT` Sugar Form

Recording an attributed claim is the highest-frequency epistemic write of a memory Brain. KML therefore defines one **normative sugar statement** so that the epistemically honest path is also the cheap path:

```prolog
ASSERT ?a (:alice, "prefers", :dark_mode) {
  by: :alice,
  mode: "stated",
  confidence: 0.95,
  evidence: :msg
}
```

Members:

```text
by          REQUIRED   semantic actor        → asserted_by
mode        REQUIRED   assertion mode        → mode
stance      OPTIONAL   default "support"     → stance
confidence  OPTIONAL                         → confidence
at          OPTIONAL   default engine
                       transaction time      → asserted_at
valid       OPTIONAL   {from, until}         → valid_time
evidence    OPTIONAL   reference or array    → role "support" Evidence citations
key         OPTIONAL                         → Assertion client_key
```

Optional supersession:

```prolog
ASSERT ?a (...) {...} SUPERSEDING :old_assertion
```

Desugaring is **normative and deterministic**:

```prolog
MUTATE {
  ENSURE PROPOSITION ?p (:alice, "prefers", :dark_mode)

  CREATE ASSERTION ?a {
    CLIENT KEY :key
    SET FIELDS {
      proposition: ?p,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 0.95,
      asserted_at: :engine_time_unless_at_given
    }
    SET STRUCTURAL {
      ("evidence", :msg) {role: "support"}
    }
  }

  TRANSITION :old_assertion TO "superseded" BY ?a
}
```

Rules:

- `ASSERT` MUST commit exactly the semantics of its desugared form; it MUST NOT create additional or divergent state.
- The handle is optional; when present it binds the created Assertion.
- `ASSERT` MAY appear standalone or inside `MUTATE`.
- The desugared clauses are one mutation plan, not separate commands: a standalone `ASSERT` commits them exactly as if they appeared together in a single `MUTATE` block (§53.1); inside `MUTATE` they join the enclosing plan.
- `by` decides the permission exactly as `asserted_by` does on `CREATE ASSERTION` (§28.4): an actor the caller is bound to needs `assert`; any other actor needs `record_attributed_assertion`; an actor the policy reserves for its bound Principals needs `assert_as_actor` and fails `ActorBindingRequired` without the binding.
- `SUPERSEDING` is revision (§14.2): it says the old Assertion was wrong. A change in the world is not written with it; see Appendix F.2.
- `ASSERT` without `key` has no retry safety of its own: a retried request is deduplicated only by the envelope's `idempotency_key` (§34). With `key`, the created Assertion carries that `client_key` and the creation itself is replay-safe.
- Sugar support belongs to the full KIP-KML conformance profile (§97).

---

# 56. CREATE EVIDENCE / ASSERTION / ACTIVITY

## 56.1 Evidence

```prolog
CREATE EVIDENCE ?e {
  CLIENT KEY :e_key

  SET FIELDS {
    evidence_class: "user_statement",
    payload: :payload,
    observed_at: :time
  }
}
```

---

## 56.2 Assertion

```prolog
CREATE ASSERTION ?a {
  CLIENT KEY :a_key

  SET FIELDS {
    proposition: ?p,
    asserted_by: :alice,
    stance: "support",
    mode: "stated",
    confidence: 1.0,
    asserted_at: :time
  }

  SET STRUCTURAL {
    ("evidence", ?e) {role: "support"}
  }
}
```

---

## 56.3 Activity

```prolog
CREATE ACTIVITY ?act {
  CLIENT KEY :act_key

  SET FIELDS {
    activity_class: "inference",
    started_at: :time,
    ended_at: :time,
    status: "completed"
  }

  SET STRUCTURAL {
    ("inputs", :input)
    ("outputs", ?a)
  }
}
```

---

# 57. KML Revision Rules

## 57.1 Belief revision

Correct pattern:

```text
new Evidence
+
new Assertion
+
optional supersession
+
Activity/provenance
```

Do not rewrite old Assertion confidence/stance/value.

---

## 57.2 Evidence correction

Correct pattern:

```text
new Evidence
+
TRANSITION old TO "corrected" BY new
```

Do not overwrite old Evidence payload.

---

## 57.3 Retraction

```prolog
TRANSITION :a TO "retracted"
```

Retraction preserves historical payload. The move is legal only from `active`; from any other state it fails `InvalidLifecycleTransition` (§35.3).

---

## 57.4 Supersession

```prolog
TRANSITION :old TO "superseded" BY ?new
```

Supersession MUST NOT be used merely because another actor disagrees, and it MUST NOT be used to record that the world changed: that is two `active` Assertions with complementary `valid_time` (§14.2, F.2).

---

## 57.5 Revision and derived cognition

Superseding or retracting an Assertion, or correcting Evidence, changes what Projection reports. It does not automatically change cognition that was derived from the revised root: an Insight, a Preference summary, a compiled Skill, or a SelfModel built while the old claim stood is still active state.

A runtime MUST NOT auto-retract, auto-archive, or auto-rewrite derived cognition because one of its provenance roots was revised. Whether a derived element survives its root is a review decision, not a protocol rule.

A runtime SHOULD make that review possible. Where `LIST DEPENDENTS` (§63.5) is supported, the cognition downstream of a revised root is discoverable in one operation, and a Brain SHOULD review those dependents after a material revision. The Cognitive Memory Profile provides `DerivationState` and the `review_derived` maintenance task class for recording the outcome.

---

# 58. Generic UPDATE

Recommended:

```prolog
UPDATE ?target

SET FIELDS {...}
SET ATTRIBUTES {...}
SET FACET "Facet" {...}
SET STRUCTURAL {...}
UNSET ATTRIBUTES {...}
UNSET FACET "Facet" {...}
UNSET STRUCTURAL {...}

WHERE {
  ...
}

LIMIT :limit
EXPECT VERSION :version
```

The guard closes the statement and MAY name a version plane (`EXPECT VERSION :v OF FACET "MnemonicState"`, §35.1), so a Facet sweep and an attribute write on the same element do not conflict with each other.

The target is either a variable bound by the `WHERE` block or a direct
reference. A direct reference (`:id` / `"id"`) already names the element, so
`WHERE` MAY be omitted — as for `TRANSITION`, `PURGE` and `SET RETENTION`; a
`WHERE` given anyway only guards:

```prolog
UPDATE :experience_id
SET FACET "MnemonicState" {salience: 0.9}
```

---

## 58.1 Illegal UPDATE targets

Generic UPDATE MUST NOT mutate:

```text
Proposition tuple
Assertion historical epistemic payload
Evidence payload
completed Activity provenance topology
_system
Governance protected fields
Schema Environment
```

---

## 58.2 Epistemic revision diagnostic

A runtime SHOULD return a semantic error such as:

```text
EpistemicRevisionRequired
```

when a client attempts to update immutable Assertion belief history.

---

# 59. KML Update Expressions

Mutable/profile numeric state MAY support deterministic expressions such as:

```text
ADD
MUL
CLAMP
COALESCE
```

Expressions MUST be deterministic per target.

---

## 59.1 Mnemonic decay

Memory metabolism MAY reduce:

```text
memory_strength
```

but SHOULD NOT periodically decay historical Assertion confidence merely because time passed.

Temporal relevance belongs in Projection.

---

# 60. Archive / Tombstone / Purge

Recommended syntax:

```text
SET RETENTION <target> {retention_class: "...", expires_at: ...}
                       [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
TRANSITION    <target> TO "archived"   [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
TRANSITION    <target> TO "tombstoned" [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
PURGE         <target> [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v]
                       [REFERENCE POLICY "..."] CONFIRM "PURGE"
PURGE PAYLOAD <target> [WHERE {...}] [LIMIT :n] [EXPECT VERSION :v] CONFIRM "PURGE"
```

`<target>` follows the same rule as generic UPDATE (§58): a `?variable` is bound
by the `WHERE` block, while a `:parameter` / `"id"` already names the element and
MAY omit `WHERE`.

---

## 60.1 Archive

Archive removes/deprioritizes ordinary Recall while preserving history.

---

## 60.2 Tombstone

Tombstone logically removes an element from active state while preserving minimal identity/reference history.

---

## 60.3 Purge

Purge physically erases bytes under high-impact policy.

Reference policy values are:

```text
deny_if_referenced      refuse the purge while required references exist
tombstone_reference     purge the bytes and tombstone the dangling references
authorized_cascade      purge referencing elements too, under explicit authority
```

The default is `deny_if_referenced`: purge SHOULD be denied when required references would be broken. `CONFIRM "PURGE"` is REQUIRED and is not a policy substitute.

An element whose retention hook sets `legal_hold` (§19.1) MUST NOT be purged: the purge fails `LegalHoldConflict`. The hold is evaluated before the reference policy and before any destruction is decided, and no reference policy overrides it: an `authorized_cascade` MUST stop at a held element rather than erasing it as another element's dependent. `purge` authority does not lift a hold — a hold blocks erasure for everyone, which is what makes it a hold rather than a preference. A purge refused by the reference policy fails `PurgeDenied`.

Because a hold blocks erasure for everyone, the authority to set or lift one is `manage_legal_hold` (§29.9), distinct from `manage_retention`: a `SET RETENTION` that touches `legal_hold` without it fails `NotAuthorized`. Content that could place its own hold could make itself permanently undeletable, and content that could lift one could unblock an erasure the hold was placed to stop.

Purge MAY leave a minimal, non-recoverable **stub** — element kind, content digest, class, observation time, and the purging Activity reference — so that reference integrity, provenance-root identity (§23.3), and independence counting survive the destruction of the bytes. A stub is not the content and is not recoverable Evidence.

---

## 60.4 No destructive cascade default

Native KIP 2.0 MUST NOT make v1-style destructive `DETACH` cascade the default deletion behavior.

---

## 60.5 Bounded removal

All removal families accept an optional `LIMIT` after their `WHERE`
(§52.7). A removal sweep SHOULD be bounded, and a `PURGE` or `PURGE PAYLOAD`
sweep SHOULD be bounded in addition to its required `CONFIRM "PURGE"`.

---

## 60.6 Payload purge

`PURGE PAYLOAD` erases the payload bytes of an Evidence element while preserving the element itself.

After a payload purge the Evidence record keeps:

```text
element identity and lifecycle
evidence_class
content_digest
media_type
observed_at
source / generated_by references
citations from Assertions
```

Its payload is marked purged; the bytes — inline content, or the runtime-held content addressed by `content_ref` — are destroyed and not recoverable.

Rules:

- The target MUST be Evidence; other kinds have no payload to purge.
- `CONFIRM "PURGE"` is REQUIRED: byte destruction is irreversible.
- Payload purge requires `purge` authority; a Governance policy MAY scope payload purge separately from element purge.
- `legal_hold` blocks payload purge exactly as it blocks element purge.
- There is no `REFERENCE POLICY` clause: the element survives, so no reference can dangle.
- Payload purge is an ordinary state-changing mutation for transaction purposes; purging an already-purged payload yields `no_effect`.
- Corroboration grouping and independence counting (§23) continue to operate on the surviving digest and provenance; a payload purge MUST NOT alter them.
- A Projection policy MAY weigh the loss of inspectable content (for example under §22.4 verifiability), but the Evidence event itself remains real.
- Purge reaches only bytes the Space holds. A Capsule exported before the purge still carries the payload and still verifies; the Space cannot recall it. A Capsule exported after the purge carries the record with `payload: {status: "purged"}` and the `content_digest`, so its own digest and signature are computed over what the Space actually holds.

Payload purge is the data-minimization instrument: a Space can discard observed raw bytes after digestion without destroying the evidence event, its citations, or its provenance role. Element purge (§60.3) remains the instrument for destroying the record itself.

---

# 61. MERGE CONCEPT

Recommended:

```prolog
MERGE CONCEPT ?source INTO ?target
WHERE {
  ?source {id: :source_id}
  ?target {id: :target_id}
}
```

Merge MUST follow the non-destructive identity semantics defined earlier.

---

# 62. External Actions

KML MUST NOT imply atomic rollback for external world actions.

Do not place:

```text
email send
money transfer
remote HTTP side effect
deployment
```

inside KIP atomicity assumptions.

Recommended pattern:

```text
Transaction 1
    the decision record: an Activity (the Profile's action_gate) whose
    inputs name the cognition applied — the Skills, the memories the
    briefing drew on, the trigger — and whose Facet records the decision

external runtime
    performs action

Transaction 2
    Outcome Evidence
    + the observation Activity linking it to the decision (§15.7)
    + Experience
```

The returning half of this pattern is the consequence channel: the external result comes back as Outcome Evidence (§15.7), written by instrumentation rather than by the actor whose action it grades, and linked to the decision it observed so that the consequence can be attributed to the cognition that produced it. Without the first transaction there is nothing for the outcome to grade.

---

# 63. META — Introspection and Grounding

## 63.1 Purpose

META is the read-only self-description, grounding, runtime-history, verification, validation, preview, and export layer.

---

## 63.2 Read-only

META MUST NOT directly mutate cognitive/Governance/Schema state.

Preview/security audit logging outside cognitive state does not alter this semantic classification.

---

## 63.3 META families

Recommended:

```text
DESCRIBE
LIST
SEARCH
VERIFY
VALIDATE
PREVIEW
HISTORY
CHANGES
EXPORT CAPSULE
```

`DESCRIBE` targets:

```text
PRIMER | PROTOCOL | CAPABILITIES
SPACE | SCHEMA ENVIRONMENT | PACKAGE | TYPE | PREDICATE | FACET
STRUCTURAL FIELD | COMPATIBILITY | ERROR | TRANSACTION | SNAPSHOT
CAPSULE | EPISTEMIC POLICY | TRUST | ACCESS
```

The resolved execution context (Principal, actor binding, Space, epistemic policy) is part of `DESCRIBE PRIMER` (§65) and, for the Space alone, `DESCRIBE SPACE`; Projection capability is part of `DESCRIBE CAPABILITIES` (§67). Neither has a statement of its own.

`LIST` targets:

```text
SPACES | SCHEMA PACKAGES | TYPES | PREDICATES | FACETS
STRUCTURAL FIELDS | EPISTEMIC POLICIES | DEPENDENTS
```

A `LIST` accepts `LIMIT` / `CURSOR` paging.

---

## 63.4 EXPORT CAPSULE

Recommended syntax:

```text
EXPORT CAPSULE ?roots
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

The operand names the **selection root binding**: every element bound to `?roots` by the `WHERE` block belongs to the export root set. The operand MAY instead be a parameter or string naming a single root element, in which case the `WHERE` block only constrains that root.

`WHERE` is REQUIRED and MUST contain at least one selection pattern: an unbounded export is not a Capsule. `closure` uses the vocabulary of §40.3.

The produced Capsule contains the root set plus the closure declared in `WITH`, subject to Governance and to the snapshot-consistency rules of §41.1. The result is a Capsule artifact (§85); no cognitive state is mutated.

---

## 63.5 LIST DEPENDENTS

Recommended syntax:

```text
LIST DEPENDENTS :id
  [DEPTH :n]
  [LIMIT :limit]
  [CURSOR :cursor]
```

`LIST DEPENDENTS` enumerates the cognition derived from one element, by bounded traversal of provenance topology in the derived direction:

```text
X ∈ Activity.inputs
    → that Activity
    → each element in Activity.outputs
```

Each output is a dependent of `X` at distance 1; traversal repeats from each dependent up to `DEPTH` (default 1). A runtime MAY additionally traverse Structural Fields that the active Schema Environment documents as derivation lineage. Each such field is traversed in whichever direction runs from root to derived artifact, which is not the same direction for every field: a field declared derived artifact → root (`derived_from`, `compiled_from` in the Cognitive Memory Profile) is traversed inbound — the dependents of `X` are the elements whose field references `X` — while a field declared root → derived artifact (`consolidated_to`) is traversed outbound. Traversing a lineage field in the wrong direction yields the element's sources, not its dependents.

A result row SHOULD carry the dependent's exact id, kind, distance, and the Activity (or Structural Field) through which it was reached.

Rules:

- `LIST DEPENDENTS` is a read; it MUST NOT change any element.
- Governance applies per row: an element the caller may not discover is omitted, and omission is indistinguishable from absence (§30.4). Traversal does not pass through an element the caller may not discover; when that cuts a path short the result carries `truncated: true`, without identifying where. A Principal charged with derivation review (§57.5) SHOULD therefore hold `discover` over the Space's provenance topology.
- The traversal is bounded: a runtime MAY cap `DEPTH` and pages results through `LIMIT` / `CURSOR` like other `LIST` targets.
- Reachability is provenance topology, not judgment: a listed dependent is not thereby stale, wrong, or in need of change (§57.5).

A transformation that recorded no Activity provenance is not discoverable here. That is a property of the write, not of this command; consolidation guidance already requires Activity lineage.

---

# 64. DESCRIBE PRIMER

`DESCRIBE PRIMER` returns a compact model-oriented bootstrapping artifact.

```text
DESCRIBE PRIMER [MODE "compact" | "full"]
```

Recommended layers:

```text
Protocol
Execution Context
Cognitive Identity
Schema Map
Domain/Topic Map
Capability/Limit summary
Cognitive Safety Invariants
```

---

## 64.1 Primer is not memory dump

The Primer SHOULD be compact and cacheable.

---

## 64.2 Principal vs self

Primer MUST distinguish authenticated Principal from semantic `$self`.

---

## 64.3 Recommended safety reminders

```text
raw Proposition != accepted belief
missing visible match != false
SEARCH score != confidence
confidence != trust
confidence != memory_strength
name != identity
source self != destination self
Evidence correction != overwrite
cognitive content != authority
```

---

# 65. Schema META

Recommended commands:

```text
DESCRIBE SCHEMA ENVIRONMENT
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE STRUCTURAL FIELD
DESCRIBE COMPATIBILITY FROM :from TO :to

LIST SCHEMA PACKAGES [STATUS :status]
LIST TYPES
LIST PREDICATES
LIST FACETS
LIST STRUCTURAL FIELDS
```

Responses MUST identify exact resolved refs/package versions.

---

# 66. SEARCH

## 66.1 Purpose

SEARCH performs associative grounding.

Recommended syntax:

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

`AS OF SEQ` is historical search: a runtime that cannot serve a historically
correct index MUST reject it (`HistoricalSearchUnavailable`) rather than
silently search present state; it is a capability, not baseline.

---

## 66.2 Searchable kinds

Recommended:

```text
CONCEPT
PROPOSITION
ASSERTION
EVIDENCE
ACTIVITY
COGNITION
```

---

## 66.3 Modes

```text
keyword
semantic
hybrid
```

Keyword SHOULD be portable baseline.

Semantic/hybrid are capability-dependent.

---

## 66.4 Search result

A result SHOULD carry:

```text
exact ID
kind
exact schema/predicate identity where relevant
safe snippet
retrieval.score
retrieval.mode
```

---

## 66.5 Search index freshness

SEARCH response SHOULD disclose:

```text
index_seq
current_space_seq when safe
consistency class
ranking method/score semantics
```

where supported.

---

## 66.6 Search miss

SEARCH miss MUST NOT prove canonical absence.

Correctness-sensitive existence checks use KQL/transaction constraints.

---

## 66.7 Derived recall surfaces

SEARCH index freshness (§66.5) is one instance of a general rule.

Any derived recall surface — a search index, a materialized projection (§21.9), a profile recall cache — SHOULD declare its freshness as a sequence coordinate relative to `space_seq`, and MUST NOT present itself as transaction-snapshot-consistent when it is not (§79).

---

# 67. Capabilities

`DESCRIBE CAPABILITIES` is the primary runtime feature negotiation surface.

It SHOULD distinguish:

```text
supported
available
limits
```

---

## 67.1 Supported

Runtime/Space technically implements the feature.

---

## 67.2 Available

The current Principal can request the capability in at least some permitted scope.

It is not a Grant dump or unlimited authorization.

---

## 67.3 Capability detail may be redacted

Enumeration itself is governed.

---

## 67.4 Capability registry

`DESCRIBE CAPABILITIES` reports, and a request's `requires` (§71) names, entries of this registry. A runtime MAY add entries of its own — engine-local names, reported by `DESCRIBE CAPABILITIES` beside these, that another engine answers `UnsupportedCapability` to (§67.1) — but it MUST NOT rename or redefine these:

```text
serializable_isolation      §32.2
atomic_batch                §75.3   several operations in one Transaction
idempotency_retention       §34.5   value: the retention window, e.g. {"seconds": 86400}
historical_reads            §48, §100
historical_search           §66.1
semantic_search             §66.3
hybrid_search               §66.3
search_index_freshness      §66.5
belief_slot                 §47
weighted_projection         §22, §27.3   trust-weighted policies beyond the structural baseline (§21.10)
materialized_projection     §21.9
signed_receipts             §33.3
ingestion_context           §71.1
streaming                   §84
artifacts                   §85
change_stream               §36, §68
filtered_delivery           §36.3
watch_evaluation            runtime-evaluated Watch conditions (Cognitive Memory Profile §5.11)
list_dependents             §63.5
payload_purge               §60.6
capsule_export              §63.4
capsule_import              §39
capsule_signatures          §37.8
derive_permission           §29.6
record_outcome_permission   §29.8
kip1_migration              §103    KIP 1.x compatibility and `DESCRIBE COMPATIBILITY`
```

A `requires` entry that names a capability the runtime does not recognize — neither this registry nor one of its own — fails `UnsupportedCapability`, exactly as one the runtime does not support.

---

# 68. META Transaction / History

Recommended:

```text
DESCRIBE TRANSACTION :tx_id
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :key
DESCRIBE SNAPSHOT [AS OF SEQ :seq | AT TIME :t]
HISTORY ELEMENT :id [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
HISTORY SPACE [FROM SEQ :a] [TO SEQ :b] [LIMIT :n] [CURSOR :c]
CHANGES SINCE :cursor [LIMIT :n]
CHANGES AFTER SEQ :seq [LIMIT :n]
```

`DESCRIBE SNAPSHOT` returns a snapshot coordinate: the `space_seq`, the transaction that committed it, its commit time and the schema environment version in force. Without an operand it describes the current head; `AS OF SEQ` describes a past coordinate; `AT TIME :t` resolves an instant to the last sequence committed at or before `t`, which is how wall-clock time enters `AS OF SEQ` (§48.1). The coordinate is a description, not a token: a historical read names its sequence directly.

---

## 68.1 HISTORY vs KQL AS OF

```text
HISTORY
    transition chronology

KQL AS OF
    historical cognitive content
```

---

## 68.2 Current Governance

Historical introspection obeys current authorization.

---

# 69. VERIFY / VALIDATE / PREVIEW

These terms have distinct normative meanings.

---

## 69.1 VERIFY

```text
VERIFY CAPSULE | SCHEMA PACKAGE | RECEIPT <artifact>
```

Checks:

```text
integrity
digest
signature/proof
runtime attestation consistency
```

`VERIFY RECEIPT` recomputes `receipt_digest` (§33.2) and, where the Receipt names a transaction this runtime committed, compares it with the Commit Record (§33.1). `VERIFY SCHEMA PACKAGE` recomputes the artifact digest (§20.11) and compares it with the artifact installed under the same reference, where one is. Signature and proof checks apply only where `signed_receipts` or `capsule_signatures` (§67.4) is advertised.

VERIFY does not establish trust or truth.

---

## 69.2 VALIDATE

```text
VALIDATE KQL | KML | CAPSULE | SCHEMA PACKAGE | IMPORT PLAN <input> [WITH {...}]
```

Checks:

```text
protocol legality
Core structure
Schema constraints
reference consistency
static/contextual legality
```

without committing.

VALIDATE is not a reservation.

---

## 69.3 PREVIEW

Simulates context-dependent effect under current destination:

```text
Governance
Schema
identity mapping
current state
```

without committing/reserving.

---

## 69.4 Commit

Only a successful Transaction Receipt establishes a durable state change.

---

# 70. Protocol Runtime

## 70.1 Transport neutrality

The KIP runtime may be bound to:

```text
MCP
HTTP
local API
IPC
WebSocket
canister calls
other authenticated transports
```

Observable KIP semantics MUST remain equivalent.

---

## 70.2 Baseline serialization

JSON is the baseline logical request/response format.

JSON text MUST be UTF-8.

Duplicate JSON object keys SHOULD be rejected.

---

# 71. Request Envelope

Recommended:

```json
{
  "kip": "2.0",
  "request_id": "req-...",

  "space": {
    "id": "space-1"
  },

  "execution": {
    "mode": "atomic",
    "isolation": "serializable",
    "idempotency_key": "logical-write-key"
  },

  "operations": [
    {
      "op_id": "op-1",
      "language": "KML",
      "command": "...",
      "parameters": {}
    }
  ],

  "context": {
    "purpose": "answer_user",
    "risk": "low"
  },

  "requires": {},

  "options": {
    "deadline_ms": 10000
  }
}
```

---

## 71.1 Ingestion Context

Observed source material SHOULD enter Evidence **without passing through model-generated command text**.

A request MAY carry an ingestion context:

```json
{
  "kip": "2.0",
  "ingest": {
    "evidence": [
      {
        "key": "msg",
        "evidence_class": "user_statement",
        "payload": "I prefer dark mode.",
        "media_type": "text/plain",
        "observed_at": "2026-08-14T01:00:00Z",
        "source_actor": {"id": "concept-alice"},
        "client_key": "message:msg-123"
      }
    ]
  },
  "operations": [
    {
      "language": "KML",
      "command": "ASSERT (:alice, \"prefers\", :dark_mode) { by: :alice, mode: \"stated\", evidence: :msg }"
    }
  ]
}
```

Semantics:

- For each entry, the runtime mints one Evidence element inside the request's transaction scope, from the declared fields and the transport-supplied content (`payload` inline, or `payload_artifact` handle). An entry MUST declare exactly one of `payload` / `payload_artifact`.
- `source_actor` is an element reference — `{"id": …}` or `{"type": …, "key": …}`, the same shapes a bound parameter takes — recorded as the Evidence's `source`. It is never a name (§7.2) and never a Principal.
- Each `key` is bound as a request parameter whose value is the minted Evidence reference; commands cite it as `:key` (for example `evidence: :msg` in `ASSERT`).
- The minted Evidence carries normal `_system.origin`; `client_key` provides retry-safe logical identity.
- An entry MAY carry `facets`, a map from Facet name to value object, validated exactly as `SET FACET` on `CREATE EVIDENCE` would be. This is how instrumentation attaches `OutcomeRecord` to an ingested `outcome` without re-typing anything; an entry whose `evidence_class` is `outcome` requires `record_outcome` (§29.8).
- Ingestion is transactional: if the transaction aborts, no Evidence is durably created.

Evidence fidelity rule: a runtime SHOULD offer ingestion (or artifact handles) so observed payloads are captured from the transport envelope; an Agent SHOULD NOT re-type observed content inside KML text (§88.12).

---

# 72. Runtime Identity Fields

## 72.1 `request_id`

Identifies one transport/execution attempt.

---

## 72.2 `idempotency_key`

Identifies one logical mutation intent.

---

## 72.3 `tx_id`

Engine-assigned transaction fact.

Normative distinction:

```text
request_id
    ≠
idempotency_key
    ≠
tx_id
```

---

# 73. Operation

Recommended:

```json
{
  "op_id": "op-1",
  "language": "KQL|KML|META",
  "command": "...",
  "parameters": {},
  "idempotency_key": null
}
```

`op_id` is request-local.

---

## 73.1 Language classification

The runtime MUST parse/classify actual semantics.

A caller-supplied language label cannot downgrade a write into read-only semantics.

---

# 74. Parameter Binding

Parameters MUST be structurally bound, not naively string-interpolated.

A parameter occupies a complete legal value position.

Example:

```prolog
?person {id: :person_id}
LIMIT :limit
FOR TIME :world_time
```

Parameters are data, not code.

---

# 75. Execution Modes

Native multi-operation requests MUST explicitly use one of:

```text
independent
sequence
atomic
```

unless only one operation exists.

---

## 75.1 independent

```text
operations semantically independent
may execute concurrently
separate snapshots
separate write transactions
failure isolated per operation
```

Each operation's `results[].context.snapshot_seq` MUST state the snapshot it observed, and each state-changing operation returns its own Receipt in `results[].receipt`. Whether one operation's commit is visible to a sibling in the same request is not defined; a client that needs ordering uses `sequence`.

---

## 75.2 sequence

```text
operations begin in order
each state-changing operation commits separately
later operation observes earlier committed effects
earlier commits are not rolled back
```

`on_error` MAY be:

```text
stop        (default)
continue
```

Each state-changing operation returns its own Receipt in `results[].receipt`; the top-level `receipt` is present only in `atomic` mode. `results[]` MUST list every operation with its status — `skipped` for those not started after a `stop` — so that a client recovering from `outcome_unknown` can tell which commits happened.

---

## 75.3 atomic

```text
one Transaction
one start snapshot
read-your-writes
all-or-none commit
one tx_id
one state-changing space_seq
```

`atomic` is the `atomic_batch` capability (§67.4). A runtime that does not advertise it MUST reject a request that asks for it (`UnsupportedCapability`) rather than run the operations as a `sequence`: §75.4 is exactly the promise a silent downgrade would break. A single `MUTATE` block (§53) is already one Transaction, so most multi-write needs are met without it; what `atomic` adds is a read inside the batch that sees the batch's own earlier writes (§32.6).

---

## 75.4 Batch is not Transaction

```text
operations[]
    ≠
atomic transaction
```

unless `execution.mode = atomic`.

---

# 76. Readonly Runtime

KIP SHOULD expose a dedicated read-only execution path conceptually equivalent to:

```text
execute_kip_readonly
```

It MAY accept:

```text
KQL
META
VERIFY
VALIDATE
PREVIEW
HISTORY
CHANGES
EXPORT CAPSULE
```

subject to authorization.

It MUST reject state-changing semantics.

---

# 77. General Runtime

A state-capable endpoint conceptually equivalent to:

```text
execute_kip
```

MAY execute KQL/KML/META.

Governance controls actual authority.

---

# 78. Snapshot Tokens

Runtime/META MAY issue an opaque `snapshot_token`.

A token binds a readable cognitive state coordinate.

It is not an authority token.

Current Governance always applies.

---

# 79. SEARCH and Transaction Snapshots

A lagging semantic/vector SEARCH index MUST NOT be presented as transaction-snapshot-consistent if it is not.

If snapshot-aligned SEARCH cannot be guaranteed inside a requested atomic transaction, the runtime MUST:

```text
reject
or
explicitly require weaker capability requested by client
```

It MUST NOT silently fake stronger consistency.

---

# 80. Deadlines and Outcome Uncertainty

## 80.1 Deadline

A client MAY specify deadline/cancellation options.

---

## 80.2 Timeout is not abort

Normative:

```text
client timeout
    ≠
transaction aborted
```

---

## 80.3 Outcome unknown

If a write may have committed but the response path cannot establish the outcome:

```text
top-level status = outcome_unknown
```

or an equivalent transport recovery signal SHOULD be used.

---

## 80.4 Recovery

The client SHOULD:

```text
lookup transaction by idempotency key
or
retry the exact same logical request with same idempotency key
```

It MUST NOT create a fresh logical mutation solely because the response was lost.

---

# 81. Response Envelope

Recommended:

```json
{
  "kip": "2.0",
  "request_id": "req-...",
  "status": "succeeded",

  "execution": {
    "mode": "atomic"
  },

  "results": [
    {
      "op_id": "op-1",
      "status": "succeeded",
      "result": {},
      "context": {}
    }
  ],

  "context": {
    "space_id": "space-1"
  },

  "snapshot": null,
  "receipt": null,
  "warnings": []
}
```

`execution` echoes the request's `idempotency_key` when one was given, so a client holding an `outcome_unknown` response can recover by key (§80.4) without re-deriving it. In `sequence` and `independent` modes the Receipts sit in `results[].receipt` (§75); the top-level `receipt` is the atomic transaction's.

---

# 82. Top-Level Status

Recommended:

```text
succeeded
failed
partial
outcome_unknown
```

---

# 83. Operation Status

Recommended:

```text
succeeded
failed
skipped
rolled_back
no_effect
```

---

## 83.1 rolled_back

An operation may have tentatively executed in an atomic transaction before the transaction aborted.

`rolled_back` means no durable state resulted.

---

# 84. Streaming

Streaming is OPTIONAL.

A runtime MAY stream:

```text
large KQL results
SEARCH
HISTORY
CHANGES
Capsule bytes
```

---

## 84.1 Frames

Recommended frame kinds:

```text
start
data
warning
progress
final
error
```

---

## 84.2 Progress is not commit

A write stream MUST NOT present tentative mutation as durable before final transaction outcome.

Normative:

```text
Progress
    ≠
Commit
```

---

## 84.3 Change Stream atomicity

One Change Envelope remains one logical transaction even if transport bytes are chunked.

---

# 85. Artifact Handles

## 85.1 Purpose

Large artifacts MAY be passed by opaque runtime ArtifactRef/handle.

Examples:

```text
Capsule
Schema Package
Evidence blob
proof bundle
large export
```

---

## 85.2 Handle is opaque

An Artifact handle MUST NOT be interpreted as:

```text
filesystem path
URL
global cognitive ID
Capsule content identity
```

---

## 85.3 Content identity

Portable artifact identity SHOULD use a cryptographic digest.

---

## 85.4 Upload is not import

Uploading/staging Capsule bytes in the runtime does not import cognition into a MemorySpace.

---

## 85.5 No automatic URL fetch

An arbitrary URL MUST NOT be automatically dereferenced as artifact content.

Network access requires an explicit separate capability/policy.

---

# 86. Error Model

## 86.1 Error shape

Recommended:

```json
{
  "code": "SchemaSymbolAmbiguous",
  "category": "schema",
  "message": "...",
  "hint": "...",

  "retry": {
    "class": "requires_different_input"
  },

  "details": {}
}
```

---

## 86.2 Error categories

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

## 86.3 Retry classes

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

## 86.4 Existence-neutral errors

Where necessary, use:

```text
NotFoundOrNotVisible
```

to avoid leaking protected existence.

---

# 87. Core Error Registry

A full-conformance implementation SHOULD support equivalent stable codes for at least the following.

## 87.1 Protocol / syntax

```text
InvalidSyntax
InvalidIdentifier
InvalidRequestEnvelope
UnsupportedProtocolVersion
UnsupportedCapability
UnsupportedIsolation
LanguageMismatch
ReadonlyViolation
DuplicateLocalHandle
DuplicateMutationTarget
```

---

## 87.2 Schema

```text
SchemaSymbolNotFound
SchemaSymbolAmbiguous
SchemaFieldNotFound
SchemaPackageUnavailable
SchemaEnvironmentChanged
HistoricalSchemaUnavailable
TypeMismatch
ConstraintViolation
```

---

## 87.3 Identity / reference

```text
NotFoundOrNotVisible
ReferenceError
StructuralReferenceInvalid
IdentitySelectorRequired
NameIdentityForbidden
IdentityConflict
ClientKeyConflict
IdentityMergeConflict
```

---

## 87.4 Epistemic / mutability

```text
ImmutableField
EpistemicRevisionRequired
EvidenceCorrectionRequired
InvalidLifecycleTransition
RetractionNotAuthorized
SupersessionMismatch
EvidenceCorrectionConflict
ActivityTerminal
ProjectionTargetUnbound
ProjectionTargetUnbounded
ProjectionNotAuthorized
ProjectionPolicyUnavailable
```

---

## 87.5 Governance

```text
Unauthenticated
NotAuthorized
RequiresApproval
RequiresStrongerAuthentication
ActorBindingRequired
ProtectedSystemField
ProtectedGovernanceField
ProtectedSchemaState
LegalHoldConflict
PurgeDenied
```

---

## 87.6 Transaction

```text
VersionConflict
PreconditionFailed
SerializationConflict
IdempotencyConflict
TransactionUnknown
OutcomeUnknown
TransactionTooLarge
```

`TransactionUnknown` also covers a well-formed transaction id whose outcome the runtime no longer retains: once the retained outcome window of §32.8 / §34.3 has elapsed, a lookup or replay of that id MUST report `TransactionUnknown` rather than an absence of effect.

---

## 87.7 Historical / cursor

```text
HistoricalSnapshotUnavailable
CursorMismatch
CursorTypeMismatch
CursorExpired
CursorInvalid
```

`CursorExpired` and `CursorInvalid` cover every cursor family (KQL, SEARCH, HISTORY, LIST, CHANGES, EXPORT); `details.family` names the family and `details.reason` says why (`expired`, `access_revoked`, `schema_changed`, `malformed`). A Change cursor that expired is `CursorExpired` with `family: "changes"` — the consumer restarts from a sequence it has durably recorded, never from the current head (§69).

---

## 87.8 Search

```text
SearchModeUnsupported
SearchIndexUnavailable
HistoricalSearchUnavailable
```

---

## 87.9 Artifact / proof

```text
ArtifactUnavailable
ArtifactTooLarge
ArtifactParseError
DigestMismatch
ProofInvalid
SignerUnknown
BlobUnavailable
CapsuleValidationFailed
ImportPreviewConflict
```

---

## 87.10 Resource / runtime

```text
ResourceExhausted
ResultLimitExceeded
ExecutionTimeout
RateLimited
InternalError
```

---

# 88. Security Requirements

## 88.1 Principal spoofing

Request-body identity claims MUST NOT replace transport-authenticated Principal.

---

## 88.2 Command/parameter injection

Parameter binding MUST be structural.

---

## 88.3 Readonly bypass

Readonly enforcement MUST classify actual parsed semantics.

---

## 88.4 Cursor forgery

Cursors MUST be opaque/authenticated or safely server-mapped.

---

## 88.5 Search leakage

Governance MUST be applied before user-visible search ranking/count/snippet behavior.

---

## 88.6 Aggregate leakage

Hidden records MUST NOT leak through unauthorized:

```text
COUNT
ORDER BY
FILTER
NOT
OPTIONAL
```

behavior.

---

## 88.7 Artifact SSRF

Artifact handling MUST NOT automatically dereference arbitrary URLs.

---

## 88.8 Memory injection

Imported cognition MUST NOT:

```text
rewrite destination self
elevate authority
change Trust Policy
activate executable Skills
install Schema
```

without explicit destination Governance.

---

## 88.9 Origin laundering

Derived/summarized/imported cognition MUST preserve authority-relevant source lineage.

---

## 88.10 Manufactured corroboration

Copying/derivation MUST NOT create independent epistemic evidence.

---

## 88.11 Counter-Evidence removal

Evidence deletion/purge SHOULD be auditable and conservative because removing challenge Evidence can change future Projection.

---

## 88.12 Evidence fidelity

Model-generated command text is not a trustworthy carrier for observed payloads: a model can truncate, paraphrase, or hallucinate content while re-typing it — and the resulting "evidence" is then a fabrication.

Runtimes SHOULD provide ingestion contexts (§71.1) or artifact handles so observed content enters Evidence from the transport envelope. Where ingestion is used, the runtime MUST preserve the supplied payload/artifact without model rewriting.

---

# 89. Conformance Model

An implementation MUST declare which KIP 2.0 conformance profiles it supports.

Recommended profiles:

```text
KIP-Core
KIP-Schema
KIP-Epistemic
KIP-Governance
KIP-Transactions
KIP-KQL
KIP-KML
KIP-META
KIP-Runtime
```

A profile is a bundle of requirements over the language and the runtime. What an engine may leave out one at a time is a capability, not a profile: Capsule support (§95), historical reads (§100), high-assurance hardening (§101) and KIP 1.x migration (§103) are each advertised through the §67.4 registry — `capsule_export` / `capsule_import`, `historical_reads`, `signed_receipts` / `capsule_signatures`, `kip1_migration` — and measured against the section that defines them only where advertised.

---

# 90. KIP-Core Conformance

Requires equivalent semantics for:

```text
Concept
Proposition
Assertion
Evidence
Activity
common envelope
exact local IDs
truth-neutral Proposition
Assertion immutability/revision
Evidence correction
Structural References
Facets
retention
non-destructive merge
```

---

# 91. KIP-Schema Conformance

Requires:

```text
immutable versioned Package artifacts
exact version persistence
Schema Environment
unambiguous alias resolution
Type/Predicate/Facet/Structural definitions
constraint validation
Schema META introspection
```

---

# 92. KIP-Epistemic Conformance

Requires at least:

```text
support/reject/uncertain stances
Assertion lifecycle
open-world insufficient
accepted/rejected/contested/uncertain/insufficient (+ leading)
structural projection baseline (§21.10)
direct same-Proposition conflict
functional/exclusive conflict support
hypothetical/predicted/imported distinctions
no evidence multiplication
auditable Projection policy identity
```

Advanced trust learning/calibration is optional.

---

# 93. KIP-Governance Conformance

Requires:

```text
Principal
MemorySpace
current authorization
discover/read/search/project separation
cognitive vs Governance state separation
actor attribution vs representation
commit-time revocation
origin non-malleability
authority non-amplification
existence protection
```

---

# 94. KIP-Transactions Conformance

Requires:

```text
atomic transaction
one start snapshot
read-your-writes
no dirty reads
commit/abort
Commit Record
space_seq
Receipt
idempotency
preconditions
Change Envelope
```

The transaction is the unit §32.1 defines: one statement, or one `MUTATE` block (§53). Several operations in one Transaction is the `atomic_batch` capability (§75.3) and is not required by this profile.

---

# 95. Capsule Capability Requirements

See the Capsule companion, §95: the requirement list lives with the sections it tests. Capsule support is advertised through `capsule_export` and `capsule_import` (§67.4), not claimed as a profile (§89); an implementation that advertises neither is not measured against it.

---

# 96. KIP-KQL Conformance

Requires:

```text
FIND
WHERE
Concept pattern
Proposition pattern
Assertion pattern
Evidence pattern
Activity pattern
FILTER
NOT
OPTIONAL
UNION
aggregation
ORDER BY
LIMIT
CURSOR
exact Schema refs
Governance filtering
BELIEF
snapshot context
```

Full profile adds:

```text
Structural pattern
BELIEF SLOT
AS OF
FOR TIME
raw path operators
projection ledger
```

---

# 97. KIP-KML Conformance

Requires:

```text
Concept create/upsert
ENSURE Proposition
Evidence create
Assertion create
Activity create
immutable-field enforcement
safe UPDATE
Assertion lifecycle
Evidence correction
EXPECT VERSION
idempotency integration
Governance/Schema validation
```

Full profile adds:

```text
MUTATE
ASSERT sugar (normative desugaring)
forward local refs
Facets
Structural mutation
archive/tombstone/purge
payload purge
non-destructive merge
```

---

# 98. KIP-META Conformance

Requires:

```text
DESCRIBE PRIMER
DESCRIBE PROTOCOL
DESCRIBE CAPABILITIES
Schema introspection
SEARCH keyword
Governance-filtered introspection
structured error hints
```

Advanced profile adds:

```text
semantic/hybrid SEARCH
transaction history
CHANGES
LIST DEPENDENTS
VERIFY
VALIDATE
PREVIEW
Capsule export/inspection
```

---

# 99. KIP-Runtime Conformance

Requires:

```text
protocol version
request/response envelope
structural parameters
Space resolution
authenticated Principal context
single-operation execution
stable error model
```

Full runtime adds:

```text
readonly endpoint
independent/sequence/atomic modes
idempotency
Receipts
snapshot tokens
artifacts
ingestion context
streaming
transaction lookup
```

---

# 100. Historical Reads

See [KIP-2.0-Optional-Profiles-and-Migration.md](./KIP-2.0-Optional-Profiles-and-Migration.md), §100. Historical reads are the `historical_reads` capability (§67.4): an implementation that advertises retention beyond the current head is measured against it, and one that does not is not.

---

# 101. High-Assurance Hardening

See the same companion, §101. Its requirements are additive hardening over a conforming implementation, never a relaxation of the Core; the ones a client can rely on are advertised as capabilities (`signed_receipts`, `capsule_signatures`, `serializable_isolation`, §67.4).

---

# 102. Required Conformance Invariants

A conforming native KIP 2.0 implementation MUST preserve the 38 cross-cutting invariants registered as Part A of [KIP-2.0-Invariants.md](./KIP-2.0-Invariants.md), the single registry this Specification and the Cognitive Memory Profile share. The registry keeps this section's numbering — `§102 invariant 17` is registry row 17 — and names, for each invariant, the section that establishes it and the conformance vectors that pin it (conformance §27). The Profile's own invariants are Part B of the same registry (Profile §23).

---

# 103. KIP 1.x Migration

See [KIP-2.0-Optional-Profiles-and-Migration.md](./KIP-2.0-Optional-Profiles-and-Migration.md), §103, together with the operational guide [migration/KIP-2.0-Migration-from-1.x.md](./migration/KIP-2.0-Migration-from-1.x.md). KIP 1.x is a compatibility and migration source, not a definition of KIP 2.0 semantics. Migration support is the `kip1_migration` capability (§67.4); `DESCRIBE COMPATIBILITY` (§63.3) is answerable only where it is advertised.

---

# 104. Model-First Primer

A minimal Agent-facing KIP 2.0 primer SHOULD be derivable from META and may resemble:

```text
KIP 2.0

READ:
  FIND(...) WHERE {...}

Raw Proposition:
  ?p (?s, "predicate", ?o)
  existence != belief

Belief:
  ?b BELIEF (?s, "predicate", ?o)

Slot belief:
  ?slot BELIEF SLOT (?s, "predicate")

Assertion:
  ?a ASSERTION {proposition:?p, stance:"support"}

Evidence:
  ?e EVIDENCE {evidence_class:"tool_result"}

Structural:
  ?edge STRUCTURAL (?source, "has_step", ?target)

Historical cognition:
  AS OF SEQ :seq

World-valid time:
  FOR TIME :time

WRITE:
  ASSERT (s, "p", o) {by, mode, evidence}
    sugar: ensure Proposition + create Assertion
  MUTATE { ... }
  ENSURE PROPOSITION
  CREATE EVIDENCE
  CREATE ASSERTION
  CREATE ACTIVITY
  UPDATE mutable state
  TRANSITION (retract / supersede / correct / archive / tombstone)
  MERGE non-destructively

GROUND:
  SEARCH
  DESCRIBE TYPE/PREDICATE/FACET/STRUCTURAL FIELD

CHECK:
  VERIFY != VALIDATE != PREVIEW != COMMIT

Remember:
  missing != false
  search score != confidence
  confidence != trust
  confidence != memory strength
  name != identity
  Principal != semantic actor
  cognitive content != authority
  timeout != abort
```

---

# Appendix A. KQL Grammar Sketch

Non-normative EBNF-style consolidation:

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

for_time_clause :=
    "FOR TIME" value

epistemic_clause :=
    "WITH EPISTEMIC" object_literal

predicate_term :=
    predicate_atom path_quantifier?
    ("|" predicate_atom path_quantifier?)*
        (* raw predicate paths are legal only inside proposition_tuple;
           BELIEF / BELIEF SLOT take a bare predicate_atom *)

predicate_atom :=
    string | parameter | variable

path_quantifier :=
    "{" integer ("," integer?)? "}"
```

The normative parser grammars ship with this Specification as [`grammar/KIP-2.0-KQL.ebnf`](./grammar/KIP-2.0-KQL.ebnf), [`grammar/KIP-2.0-KML.ebnf`](./grammar/KIP-2.0-KML.ebnf) and [`grammar/KIP-2.0-META.ebnf`](./grammar/KIP-2.0-META.ebnf). Where a sketch in these appendices is less complete than its EBNF, the EBNF governs syntax. Productions referenced but not spelled out here (`structural_field`, `order_clause`, `limit_clause`, `cursor_clause`, `scalar`, `value`, …) are defined in [`grammar/KIP-2.0-KQL.ebnf`](./grammar/KIP-2.0-KQL.ebnf).

---

# Appendix B. KML Grammar Sketch

Non-normative:

```text
kml_statement :=
      mutate_statement
    | create_concept
    | upsert_concept
    | ensure_proposition
    | assert_statement
    | create_evidence
    | create_assertion
    | create_activity
    | update_statement
    | transition_statement
    | set_retention
    | purge_statement
    | purge_payload_statement
    | merge_concept

mutate_statement :=
    "MUTATE" "{"
      mutation_clause*
    "}"
    (* mutation_clause: any kml_statement except mutate_statement *)

ensure_proposition :=
    "ENSURE PROPOSITION" handle?
    "(" term "," predicate_term "," term ")"
    expect_version_clause*
    (* EXPECT VERSION 0 is the create-only form, §35.2 *)

assert_statement :=
    "ASSERT" handle?
    "(" term "," predicate_term "," term ")"
    assignment_object
    ("SUPERSEDING" target)?
    (* normative sugar, §55.1 *)

update_statement :=
    "UPDATE" target
    update_action+
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_version_clause*
    (* a ?variable target is bound by WHERE; a direct target may omit it *)

transition_statement :=
    "TRANSITION" target
    "TO" value
    ("BY" target)?
    set_fields_clause?
    set_structural_clause?
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_version_clause*
    (* the quoted state names the move, §52.5; BY only for
       superseded / corrected; SET clauses only for Activity states *)

set_retention :=
    "SET RETENTION" target
    assignment_object
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_version_clause*

purge_statement :=
    "PURGE" target
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_version_clause*
    ("REFERENCE POLICY" value)?
    "CONFIRM" "\"PURGE\""

purge_payload_statement :=
    "PURGE PAYLOAD" target
    ("WHERE" "{" where_clause* "}")?
    limit_clause?
    expect_version_clause*
    "CONFIRM" "\"PURGE\""
        (* Evidence bytes only; the element survives, so there is
           no REFERENCE POLICY clause *)

merge_concept :=
    "MERGE CONCEPT" target
    "INTO" target
    ("WHERE" "{" where_clause* "}")?
    expect_version_clause*
        (* no limit_clause: source and target are already named *)
```

The normative grammar MUST preserve declarative local-handle semantics and forward references within MUTATE.

---

# Appendix C. META Grammar Sketch

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
    | export_capsule_statement

describe_target :=
      PRIMER
    | PROTOCOL
    | CAPABILITIES
    | SPACE
    | SCHEMA_ENVIRONMENT
    | PACKAGE
    | TYPE
    | PREDICATE
    | FACET
    | STRUCTURAL_FIELD
    | COMPATIBILITY
    | ERROR
    | TRANSACTION
    | SNAPSHOT
        (* DESCRIBE SNAPSHOT [AS OF SEQ :s | AT TIME :t], §68 *)
    | EPISTEMIC_POLICY
    | TRUST
    | ACCESS
    | CAPSULE

list_target :=
      SPACES
    | SCHEMA_PACKAGES
    | TYPES
    | PREDICATES
    | FACETS
    | STRUCTURAL_FIELDS
    | EPISTEMIC_POLICIES
    | DEPENDENTS
        (* LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c], §63.5 *)
```

---

# Appendix D. Runtime Envelope Schema Sketch

Illustrative full-surface JSON shape (validates against `kip-request.schema.json`; an absent optional field is omitted entirely — explicit `null` is not used for optionality):

```json
{
  "kip": "2.0",

  "request_id": "req-42",

  "space": {
    "id": "space-id"
  },

  "compatibility_profile": "kip-1-compat",

  "execution": {
    "mode": "atomic",
    "isolation": "serializable",
    "idempotency_key": "formation:42"
  },

  "read": {
    "snapshot_token": "opaque-snapshot-token"
  },

  "ingest": {
    "evidence": [
      {
        "key": "msg",
        "evidence_class": "user_statement",
        "payload": "I prefer dark mode.",
        "media_type": "text/plain",
        "observed_at": "2026-08-14T01:00:00Z",
        "source_actor": {"id": "concept-alice"},
        "client_key": "message:msg-123"
      }
    ]
  },

  "preconditions": {
    "space_seq": 1500,
    "schema_environment_version": 17
  },

  "operations": [
    {
      "op_id": "op-1",
      "language": "KQL",
      "command": "...",
      "parameters": {},
      "options": {}
    }
  ],

  "parameters": {},

  "context": {
    "purpose": "answer_user",
    "risk": "low",
    "locale": "en-US",
    "client": "anda-brain/2.0"
  },

  "requires": {},

  "options": {
    "dry_run": false,
    "deadline_ms": 10000
  },

  "extensions": {}
}
```

---

# Appendix E. Response Schema Sketch

Illustrative committed-write response (validates against `kip-response.schema.json`):

```json
{
  "kip": "2.0",
  "request_id": "req-42",
  "status": "succeeded",

  "execution": {
    "mode": "atomic"
  },

  "results": [
    {
      "op_id": "op-1",
      "status": "succeeded",
      "result": {},
      "context": {},
      "warnings": []
    }
  ],

  "context": {
    "space_id": "space-1"
  },

  "snapshot": {
    "space_id": "space-1",
    "snapshot_seq": 1500
  },

  "receipt": {
    "status": "committed",
    "tx_id": "tx-900",
    "space_id": "space-1",
    "snapshot_seq": 1500,
    "space_seq": 1501,
    "committed_at": "2026-08-14T03:00:00Z"
  },

  "warnings": []
}
```

A read-only response carries `"receipt": null` (and MAY carry `"snapshot": null` when no snapshot context applies). A top-level `error` object appears only in failed / outcome-unknown responses; it is omitted, never `null`, elsewhere.

---

# Appendix F. Cognitive Formation Examples

Examples assume the Cognitive Memory Profile (which defines `prefers` and `caused_by`) plus a domain package defining `timezone` are active in the Schema Environment.

## F.1 User statement

User says:

```text
"I prefer dark mode."
```

Recommended mutation:

```prolog
MUTATE {
  CREATE EVIDENCE ?message {
    CLIENT KEY :message_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: :payload,
      observed_at: :time
    }

    SET STRUCTURAL {
      ("source", :alice)
    }
  }

  ENSURE PROPOSITION ?p (
    :alice,
    "prefers",
    :dark_mode
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
      ("evidence", ?message) {role: "support"}
    }
  }
}
```

With the runtime ingestion context (§71.1) minting `:msg` from the transport envelope, the equivalent sugar form (§55.1) is:

```prolog
ASSERT (:alice, "prefers", :dark_mode) {
  by: :alice,
  mode: "stated",
  confidence: 1.0,
  evidence: :msg
}
```

---

## F.2 Correction versus change

Two situations look alike and are written differently (§14.2).

**Correction — the earlier claim was wrong.** Alice said `+08:00`; she meant `+07:00`. The new Assertion supersedes the old one, which is dropped from every projection because it was never true:

```prolog
MUTATE {
  CREATE EVIDENCE ?e {
    CLIENT KEY :evidence_key

    SET FIELDS {
      evidence_class: "user_statement",
      payload: :payload,
      observed_at: :time
    }

    SET STRUCTURAL {
      ("source", :alice)
    }
  }

  ENSURE PROPOSITION ?p_new (
    :alice,
    "timezone",
    "+07:00"
  )

  CREATE ASSERTION ?a_new {
    CLIENT KEY :assertion_key

    SET FIELDS {
      proposition: ?p_new,
      asserted_by: :alice,
      stance: "support",
      mode: "stated",
      confidence: 1.0,
      asserted_at: :time
    }

    SET STRUCTURAL {
      ("evidence", ?e) {role: "support"}
    }
  }

  TRANSITION :a_old TO "superseded" BY ?a_new

  CREATE ACTIVITY ?revision {
    SET FIELDS {
      activity_class: "belief_revision",
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :a_old)
      ("inputs", ?e)
      ("outputs", ?a_new)
    }
  }
}
```

**Change — the world moved.** Alice lived in `+08:00` and moved to `+01:00` on `:moved_at`. Her earlier claim was true for its time, so nothing is superseded for being wrong; the open interval is closed by a re-assertion of the same value, and the new value starts where the old one ends. Both stay `active`, and `FOR TIME` before `:moved_at` still answers `+08:00` (Appendix G.4):

```prolog
MUTATE {
  ASSERT ?closed (:alice, "timezone", "+08:00") {
    by: :alice,
    mode: "stated",
    valid: {from: :since, until: :moved_at},
    evidence: :msg
  } SUPERSEDING :a_old

  ASSERT ?new (:alice, "timezone", "+01:00") {
    by: :alice,
    mode: "stated",
    valid: {from: :moved_at},
    evidence: :msg
  }

  CREATE ACTIVITY ?revision {
    SET FIELDS {
      activity_class: "belief_revision",
      status: "completed"
    }

    SET STRUCTURAL {
      ("inputs", :a_old)
      ("inputs", :msg)
      ("outputs", ?closed)
      ("outputs", ?new)
    }
  }
}
```

Here `SUPERSEDING :a_old` revises only the interval: the open-ended claim was wrong about *until*, not about the value. Where both intervals are known when the claims are first written, no supersession is needed at all (Architecture Appendix B).

---

## F.3 Conflicting third-party claims

Alice supports `P`; Bob rejects `P`.

Correct:

```text
keep both Assertions
run Epistemic Projection
possibly status = contested
```

Incorrect:

```text
Bob supersedes Alice
delete Alice's Assertion
```

---

## F.4 Experience formation

A Profile may atomically create:

```text
Experience
ExperienceSteps
MnemonicState
Formation Activity
source Evidence
```

inside one MUTATE/Transaction.

Private chain-of-thought is not required.

---

## F.5 Skill compilation

Recommended conceptual flow:

```text
successful Experience
+
failed Experience
    ↓
procedural_consolidation Activity
    ↓
proposed Skill (with its task family)
```

The resulting Skill does not receive executable authority automatically, and it does not receive lifecycle standing: promotion is a verdict over graded outcomes (F.6), never part of compilation.

---

## F.6 Outcome grading and a lifecycle verdict

```text
decision (action_gate Activity: inputs name the Skill applied)
    ↓
external action / trial run
    ↓
instrumentation (never the acting model)
    ↓
Outcome Evidence {task_family, outcome_status}
    + outcome_observation Activity {inputs: the decision, outputs: the outcome}
    ↓
deterministic verdict code reads the linked outcomes against the TrialState basis
    ↓
lifecycle_verdict Activity + one guarded UPDATE
```

The observation, written by the instrument through the ingestion context (§71.1) with the `OutcomeRecord` Facet in its `facets`, and the link that makes it gradable:

```prolog
CREATE ACTIVITY ?obs {
  SET FIELDS {
    activity_class: "outcome_observation",
    status: "completed"
  }
  SET STRUCTURAL {
    ("inputs", :decision)
    ("outputs", :outcome)
    ("associated_actors", :verifier)
  }
}
```

The verdict, once the trial's quota of linked outcomes is reached:

```prolog
MUTATE {
  CREATE ACTIVITY ?verdict {
    SET FIELDS {
      activity_class: "lifecycle_verdict",
      status: "completed",
      parameters_digest: :rule_digest
    }
    SET STRUCTURAL {
      ("inputs", :outcome_a)
      ("inputs", :outcome_b)
      ("outputs", :skill)
    }
  }

  UPDATE :skill
  SET ATTRIBUTES {status: "adopted"}
  SET FACET "GradingState" {
    success_count: 9,
    failure_count: 2,
    graded_count: 12,
    last_verdict_at: :now
  }
  SET FACET "MnemonicState" {utility: 0.78}
  EXPECT VERSION :version OF ATTRIBUTES
}
```

The promotion executes in one guarded statement: `EXPECT VERSION ... OF ATTRIBUTES` makes it safe under concurrency without being spoiled by a concurrent `MnemonicState` sweep (§35.1), the verdict Activity pins the rule (`parameters_digest`) and the graded outcomes (`inputs`), and the Skill's `TrialState` carries the basis the comparison was made against, so the transition is recomputable by an auditor. Only outcomes linked to a decision that applied the Skill are in `inputs`; the rest of the family is the baseline the trial was opened against.

---

# Appendix G. Read/Belief Examples

## G.1 Raw claim history

```prolog
FIND(
  ?value,
  ?a.stance,
  ?a.confidence,
  ?a.asserted_at,
  ?a.lifecycle.status
)
WHERE {
  ?p (
    :alice,
    "timezone",
    ?value
  )

  ?a ASSERTION {
    proposition: ?p
  }
}
ORDER BY ?a.asserted_at DESC
```

---

## G.2 Current accepted slot

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :alice,
    "timezone"
  )
}
FOR TIME :now
WITH EPISTEMIC {
  purpose: "answer_user",
  explanation: "summary"
}
```

---

## G.3 Historical belief then

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project,
    "status"
  )
}
AS OF SEQ :then_seq
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_audit",
  explanation: "ledger"
}
```

---

## G.4 Current belief about then

```prolog
FIND(?slot)
WHERE {
  ?slot BELIEF SLOT (
    :project,
    "status"
  )
}
FOR TIME :then_world_time
WITH EPISTEMIC {
  purpose: "historical_research",
  explanation: "ledger"
}
```

These two queries MAY legitimately produce different results.

---

# Appendix H. META Workflow Examples

## H.1 Agent startup

```text
DESCRIBE PRIMER
DESCRIBE CAPABILITIES
DESCRIBE TYPE/PREDICATE as needed
SEARCH as needed
KQL/BELIEF
```

---

## H.2 Capsule acceptance workflow

```text
DESCRIBE CAPSULE
VERIFY CAPSULE
VALIDATE CAPSULE
PREVIEW IMPORT CAPSULE
```

Actual import is a separate protected state-changing transaction.

---

## H.3 Lost write response

```text
network response lost
    ↓
DESCRIBE TRANSACTION BY IDEMPOTENCY KEY
    ↓
committed?
    use original Receipt
unknown?
    retry same logical request/key
```

---

# Appendix I. Compatibility Summary

Carried in [KIP-2.0-Optional-Profiles-and-Migration.md](./KIP-2.0-Optional-Profiles-and-Migration.md), Appendix I, next to §103.

---

# Appendix J. Final Protocol Summary

KIP 2.0 can be summarized as:

```text
Core
    What cognitive objects exist?

Schema
    What do those objects mean?

Epistemic Projection
    What should the Brain believe?

Governance
    Who may influence or observe cognition?

Transactions
    How does cognition change atomically?

Capsule
    How does cognition move between Brains?

KQL
    How is cognitive state read?

KML
    How is cognitive state changed?

META
    How does the Nexus describe itself?

Protocol Runtime
    How are these semantics executed safely over a real transport?
```

The central KIP 2.0 invariants are:

```text
Meaning ≠ Belief ≠ Authority

Proposition ≠ Assertion

Confidence ≠ Trust ≠ Memory Strength

Search Relevance ≠ Epistemic Support

No Match ≠ False

Correction ≠ Rewrite History

Merge ≠ Rewrite History

Capsule ≠ Authority

Batch ≠ Transaction

Timeout ≠ Abort

Progress ≠ Commit

Request ≠ Transaction

Principal ≠ Semantic Actor
```

And the governing protocol principle is:

> **KIP 2.0 is a protocol for durable cognition: new information may change what a Brain does next without requiring the Brain to falsify what happened before.**
