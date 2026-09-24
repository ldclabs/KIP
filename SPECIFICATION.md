# KIP 2.0 Specification

**[English](./SPECIFICATION.md) | [中文](./SPECIFICATION_CN.md)**

## Status

**Normative Draft / Protocol Consolidation Candidate — scope frozen**

Version: **2.0-draft**

This document is the normative consolidation of the KIP 2.0 design.

During the draft, artifact identities are stable names — `kip://profiles/cognitive-memory@2.0.0`, `urn:kip:2.0:schema:*` — and a draft revision is identified by its content digest, not by a new version number or a dated identifier. Earlier draft packages are not retained. The release freezes names and digests together.

The scope of 2.0 is frozen: a new contract enters this draft only together with engine evidence for it — an executable case in `conformance/engine-suite/` — or a measured Brain result under `brain/BrainEvaluation.md`. During the draft the case MAY enter marked `pending_engine` in the suite manifest, so that a correction is not blocked until an engine has implemented the uncorrected behavior; the release requires every case verified by a real engine. Corrections, simplifications and evidence do not need that gate.

The ten `design/` notes and `KIP-2.0-Architecture.md` are informative. The `design/` notes are **frozen** as of 2026-09-02: they are the pre-consolidation drafts, are no longer maintained, and where they differ from this Specification they are out of date.

The following artifacts are normative companions to this Specification:

- `grammar/KIP-2.0-KQL.ebnf`, `grammar/KIP-2.0-KML.ebnf`, `grammar/KIP-2.0-META.ebnf` — normative syntax
- `schemas/kip-request.schema.json`, `schemas/kip-response.schema.json`, `schemas/kip-change-envelope.schema.json` — normative wire shapes
- `schemas/kip-common.schema.json`, `schemas/kip-projection.schema.json`, `schemas/kip-cognitive-records.schema.json`, `schemas/kip-element.schema.json`, `schemas/kip-capsule.schema.json`, `schemas/kip-schema-package.schema.json` — shared definitions, result and artifact shapes
- `profiles/CognitiveMemoryProfile-2.0.md` and `profiles/cognitive-memory-2.0.0.schema.json` — the standard Profile and its package
- `profiles/general-domain-1.0.0.schema.json` — a minimal general-purpose domain package (people, places, organizations)
- `profiles/policy-memory-default.json` — the `kip:memory-default` Projection Policy (§21.13)
- `profiles/policy-strength-half-life-30d.json` — the standard mnemonic strength policy (§59.1, Profile §6.1)
- `KIP-2.0-Memory-Interface.md`, `schemas/kip-memory.schema.json` and `profiles/memory-bundles.json` — the optional Agent-to-Brain binding and its levels
- `KIP-2.0-Capsule-Specification.md` — §37–§41 and §95 of this Specification, carried in a companion under the same numbering
- `KIP-2.0-Optional-Profiles-and-Migration.md` — §100, §101, §103 and Appendix I: historical reads, high-assurance hardening and KIP 1.x migration, each a capability (§67.4)
- `brain/KIP-2.0-Validated-Learning.md` — Skill trials, evaluations and validated standing (capability bundle `memory_learning`)
- `brain/KIP-2.0-Brain-Runtime.md` — durable attention, leases, dispatch and receiver fencing (capability `durable_brain_runtime`)
- `KIP-2.0-Invariants.md` — the invariant registry: §102's Core invariants (Part A) and the Profile's (Part B)
- `conformance/` — the engine suite, vectors, fixtures, reference models and their schemas (`conformance/README.md`)

`KIPSyntax.md` is an informative LLM-facing syntax card, not a normative artifact.

If this Specification conflicts with an earlier KIP 2.0 design document, **this Specification takes precedence**.

KIP 1.x remains a compatibility/migration source, not a normative definition of KIP 2.0 semantics.

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and only when, they appear in all capitals. The same rule binds every normative companion.

Unless explicitly marked otherwise, protocol invariants stated with these terms are normative. Lowercase words such as "must", "never" and "cannot" carry their ordinary English meaning; a requirement is stated with a capitalized keyword.

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

KQL/KML/META define the Brain-to-Nexus Interface. A business Agent may instead use
the optional [Memory Interface](./KIP-2.0-Memory-Interface.md): observe, recall,
revise, feedback and forget. The Brain Module interprets those intents and manages
their KIP operations; it may be embedded in the Agent or use a separate model.
Both paths preserve the same cognitive state contract. A transaction receipt proves
durable state, while the binding's processing receipt additionally identifies when
an input has been processed and can participate in recall.

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

Adapters SHOULD capture mechanical read pins, digests, retry identities and paging
without asking models to invent them. The model still identifies semantic intent,
actual evidence used and uncertainty. Role-specific instruction cards MAY expose
only the needed language surface; a short model-facing view MUST retain material
uncertainty and provide governed access to its full computation basis.

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

`_system` is engine-maintained. Its `created_at` and `updated_at` timestamps MUST follow §6.5.

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

## 6.5 Timestamp format and precision

Protocol timestamps MUST be strings in UTC with exactly millisecond precision, using the canonical form `YYYY-MM-DDTHH:mm:ss.SSSZ`, for example `2026-08-14T03:00:00.123Z`. The date and time MUST be valid calendar values; `T` and `Z` MUST be uppercase, and the fractional-second component MUST contain exactly three decimal digits, including `.000` for a whole second.

This contract applies to all protocol timestamp fields and time-valued command parameters, including `_system.created_at`, `_system.updated_at`, `Assertion.asserted_at`, `Assertion.valid_time.from` / `until`, `Evidence.observed_at`, `Activity.started_at` / `ended_at`, `retention.expires_at`, `committed_at` in Commit Records, Receipts and Change Envelopes, and time inputs such as `FOR TIME` and `DESCRIBE SNAPSHOT AT TIME`. It also defines `format: "timestamp"` (§9.2, §20.15), including its use in Schema Packages and Profile fields. Existing field-specific rules still determine whether a timestamp may be absent or `null`; `null` is not a timestamp.

Inputs with missing or non-three-digit fractional seconds, timezone offsets other than `Z`, numeric epoch values, or invalid dates/times MUST be rejected, not silently padded, rounded, truncated or converted. A string violating this format is a `ConstraintViolation`; a non-string timestamp is a `TypeMismatch` (§87.2). Format validation does not rewrite string Literal identity (§9.6).

Engine-generated timestamps MUST use the same canonical form. An engine clock with finer resolution MUST truncate its sub-millisecond portion before exposing a protocol timestamp. Physical storage remains implementation-defined (§6.2), but protocol round trips and time comparisons MUST preserve millisecond values. Millisecond precision does not guarantee clock accuracy, uniqueness or commit ordering: multiple commits MAY share a timestamp; `space_seq` remains the per-Space commit-order coordinate. This timestamp contract does not change the units of durations or require arbitrary Evidence payload text to conform.

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
`Person` and a `Topic` may both be keyed `"alice"` and they are two
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

Portable JSON numbers use finite IEEE 754 binary64. Integral values MUST be
within `[-9007199254740991, 9007199254740991]`, in command text, bound parameters,
wire counters and artifacts alike. The restriction applies equally to integer,
fraction and exponent spellings; changing notation cannot bypass it. Nonzero
underflow to zero, non-finite values and out-of-range integers MUST be rejected
before their source digits are lost. Fractional values use binary64 rounding.
Use a Schema-defined string/value object for larger exact integers or decimals.

A decoder MUST validate source numeric tokens before binding or lowering. Silent
rounding of distinct exact integers to one value is non-conforming. The canonical
artifact profile is `kip-jcs-safe-v1` (§37.7); unsupported previous draft numeric
contracts require explicit migration, not implicit reinterpretation.

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
number      validated binary64 value (§9.3): 1, 1.0 and 1e0 are one Literal;
            -0 is 0; an integer and a float of equal valid value are equal
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

Ordinary new writes resolve identity through `B`, while engine audit MUST retain
the as-supplied endpoint and the resolution decision/version used. An ASSERT or
creation that resolves an existing canonical Proposition still retains its own
input-reference binding; the canonical tuple alone cannot recover that intent.
See §11.5 for identity repair.

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

## 11.5 Identity repair

Every merge is a protected, immutable identity-resolution decision carrying an id, source, target, actor origin, basis and resolution version. Engine audit MUST preserve the references a write actually supplied and their canonical resolution, including an `ASSERT`'s endpoints. For a reference a caller had already canonicalized, the engine records only what it received and MUST NOT claim knowledge of an earlier referent it never saw.

A runtime advertising `identity_repair` (§67.4) provides one protected operation under `merge_identity`, carried by the same protected control binding as other Governance operations (ordinary KML cannot set `merged_into`):

```text
{decision_id, expected_identity_version, action: "withdraw", reason_evidence}
```

The operation MUST, atomically:

```text
withdraw the named resolution for current reads
verify acyclicity and identity constraints (conflicting keys or canonical IDs fail IdentityConflict)
advance the identity version and emit an identity control change (§36.1)
retain the withdrawn decision for AS OF and HISTORY
```

The source becomes independently resolvable again; raw Proposition tuples and old Assertions are not moved or rewritten. The repair yields a review set of the writes made under the withdrawn resolution: writes whose as-supplied references are unambiguous guide new, explicitly corrected Assertions; writes whose intended referent is lost remain `needs_review` (§57.6) and are excluded from automatic application. Dependents, cached projections and imported mappings under the old resolution are invalidated.

Repair is a correction of the current interpretation, never a claim to split data perfectly when attribution was not retained, and it never grants trust or authority — `same_as` (Profile §7) feeds review, not repair. A runtime without this capability MUST reject the operation rather than delete and recreate the merged source.

---

## 11.6 Portable keys

A Concept `key` (§7.3) is Space-local unless its package declares portable identity with `issuer_namespace`, `key_scope` and normalization rules. Capsule identity mapping by key (§38.2) MUST match lineage, verified issuer, scope and normalized key together. Equal local keys in different owners' Spaces otherwise denote separate identities.

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

Each `valid_time` endpoint is an exact Timestamp (§6.5), `null`, or a **time bound** `{earliest, latest}` for an instant known only within a range (§25.5). A missing `from` means the value began no later than the claim was made — projection reads it as the bound `{latest: asserted_at}` — and an open `until` means the Assertion states no end, not that the value holds forever (§25.2, §25.4).

`asserted_at` is the instant the actor made the claim, never the instant the Brain recorded it. For a claim extracted from captured source material it is the source's `observed_at` or the instant the source itself records. It is the claim's start key when no `from` is written (§25.4), so a claim recorded later than it was made MUST carry its original time: written with the recording time, an old claim would take today's start key and end a current value it actually predates.

---

## 13.3 `asserted_by`

`asserted_by` is a semantic actor, and it is REQUIRED: a claim whose actor cannot be resolved is recorded as Evidence, not asserted.

It is different from:

```text
_system.origin.principal_id
```

which identifies the authenticated execution origin.

`context_refs` is OPTIONAL: references to Concepts that scope the Assertion — the situation, purpose, or domain under which the stance holds (§25.3). It is set at creation through `SET FIELDS` and is part of the immutable payload (§13.7); context matching MUST follow the set-inclusion baseline in §25.3; an explicitly versioned policy MAY add declared inheritance. A scoped Assertion is ineligible for a context-free request (`context_mismatch`).

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
context_refs (§13.3)
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

Compatible means all three: the same canonical `asserted_by` actor; the same Proposition, or — for a value correction — a Proposition with the same canonical subject and Predicate lineage (§20.14); and the same canonical `context_refs` set (§25.3). A replacement that differs in any of them fails `SupersessionMismatch`: supersession never moves a claim to another actor or into another scope. A claim that was wrong only in its scope — stated generally when it held only at work — is withdrawn (§14.1) and the scoped claim asserted anew.

Supersession is **revision**: the superseding Assertion says the superseded one was wrong — in its value, or in the interval it claimed — for the time it covered. Projection therefore drops a superseded Assertion for every `FOR TIME`, not only for the present.

For a value-only correction, Formation MUST explicitly preserve the world interval being corrected while setting `asserted_at` to the time of the correction. Copy the original written endpoints; if its `from` was absent, materialize `{latest: <original asserted_at>}` instead of omitting it again. Omitting `from` on the replacement would use the correction time (§25.2), making the corrected value indeterminate for earlier times. When the correction also changes the interval, write the interval the source actually corrects; supersession never infers or inherits one automatically.

Supersession is not generic disagreement, and it is not how the world changing over time is recorded. A value that held and then stopped holding is recorded by a new `active` Assertion that begins where the change happened: the earlier open-ended Assertion is ended by its successor through temporal succession (§25.4), stays `active`, and keeps answering "what was true then" (§48.4, Appendix G.4). A value that simply stopped, with no successor value, is ended by a same-actor Assertion of the opposite stance from the change date (Appendix F.2). A runtime and a Brain MUST NOT use supersession to record a world change: superseding a claim that was true for its time rewrites an actor's history into an error the actor never made, and erases history the protocol exists to keep.

Supersession, world change (§25.4) and recording repair (§57.8) are three different histories. Supersession says the actor's claim was wrong; succession says the world moved on; recording repair says the Brain recorded something the actor never claimed.

---

## 14.3 Expired

`expired` is a **computed** status, never a stored one: an Assertion whose effective interval (§25.2, §25.4) ends at or before a projection's `valid_at` (`FOR TIME`) is `expired` for that projection, whether its own `until` or a successor ended it. No KML statement produces it, a Change Envelope never carries it, and the stored lifecycle status remains `active`, `retracted`, or `superseded`. `HISTORY` shows no transition to `expired`, because none is committed.

This status is computed from world valid time, and is distinct from storage retention. Intervals are half-open `[from, until)` (§25.2).

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

A task family locates candidate comparison material; it never attributes an
outcome and never automatically defines the baseline. Outcomes grade a decision
through an instrument-written `outcome_observation` Activity linking the actual
attempt, the decision and the Outcome Evidence. The standard Profile binds the
attempt to exact Skill revisions and a trial before execution. Multiple observations
of one attempt remain one sampling unit per metric/window. Unlinked outcomes stay
stream material until an explicit comparable baseline selection admits them.
The [Validated Learning companion](./brain/KIP-2.0-Validated-Learning.md) defines
independent attempts, comparability and retained replay inputs; a shared family or
a rule digest alone proves none of these.

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

A correction should be represented by another Activity/audit record. Terminal Activities capture engine-maintained `_system.input_versions` and `_system.output_versions` at commit, including final output versions. For derived writes, input versions are validated against explicit DependencyBasis read pins, not guessed from whatever is current at commit. Output versions identify the actual committed output. Unpinned audit Activities may report transaction-snapshot versions but MUST NOT claim those prove the actor consumed them. The maps are not author-writable and do not replace retained replay artifacts.

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
Skill → current_revision SkillRevision
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

A package MAY declare a Facet, a Facet field or a Structural Field **computed**: the engine derives its value from other state when a read is evaluated. A computed member is read-only — a write to it fails `ConstraintViolation` — has no version plane, is never exported as state, and never becomes Evidence. It exists so that a value with one authoritative source (an immutable record, Activity provenance, a decay policy) can be read conveniently without a second writable copy that could disagree with it.

---

## 18.3 Cognitive Memory Profile

A Cognitive Memory Profile SHOULD define types/facets/structural fields for at least:

```text
Event
Experience
ExperienceStep
Insight
Commitment
Watch
Skill / SkillRevision
SleepTask
SelfModel
WorkingState
MnemonicState
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

A package field or Facet definition MAY carry `value_schema`, a JSON Schema 2020-12 constraint. A conforming loader MUST resolve its pinned schema dependencies and validate it in addition to field mutability and reference constraints; unsupported contracts fail activation rather than being ignored. The standard Profile pins the companion schemas by digest in its `validation_schemas` manifest. Facet `attachment` constraints (activity_classes/terminal_only) are binding alongside applicable_to; terminal record fields cannot be bypassed by changing Activity class, UPDATE or UNSET.

The validation-schema lock MUST include the transitive schema-resource closure of
`$ref` and `$dynamicRef`, keyed by actual schema `$id`, including dependencies whose
IDs use HTTPS rather than URNs. All locked schemas must compile using only those
verified resources and the validator's JSON Schema meta-schema. An unresolved or
unpinned resource fails activation; a previously cached or network-fetched schema
cannot silently supply it.

Package definitions may declare typed `reference_paths` for nested element references
(Capsule companion §41.7). These paths and their namespace are binding for closure
validation and Capsule mapping; a loader unable to honor them rejects activation
rather than treating IDs as arbitrary text. Optional absent/null references remain
absent/null. Timestamp format validation must include real calendar values even
when the JSON Schema validator treats `format` as annotation only.

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
                      format is validated on write and never affects identity;
                      timestamp follows §6.5
functional            true  → at most one accepted object per subject at one valid time;
                              more form a conflict set (§25.1)
functional_by         "object_type" → functional within each partition of candidate
                              objects that share a Concept Type lineage: at most one
                              accepted object per subject and partition at one valid time
                              (§25.1); MUST NOT be combined with functional: true, and the
                              object MUST be declared as Concepts ({kinds: ["Concept"]} or
                              concept_types): a Literal has no Concept Type to partition by
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

Defaults when a field is absent: `functional: false`, `functional_by` absent, `open_world: true`, `complete: false`, `boolean_completeness: false`, `temporal_conflict: "overlapping_valid_time"`. A Projection Policy MAY be stricter than a declaration, never looser: it cannot treat an `open_world: true` Predicate as closed.

A **slot** is the subject–predicate pair of a functional Predicate; for a `functional_by` Predicate it is the subject–predicate–partition triple. Every rule this Specification states about a functional slot — conflict sets (§25.1), `complete`, temporal succession (§25.4), `BELIEF SLOT` (§47) — applies per partition. `functional_by` exists for relations such as a preference among alternatives: two options of one kind compete, while preferences over different kinds coexist. The partition is the option's Concept Type, so an option Concept MUST be typed by its kind (a color scheme, an editor), never by a catch-all type: options that share a catch-all type are one partition, and the newer would end the older whatever they are about. Where no installed package names the kind, the draft vocabulary supplies it (§20.16).

---

## 20.16 Draft vocabulary

A Brain meets relations that no installed package names. Forcing that cognition to stay Evidence-only loses it; granting the Brain `manage_schema` gives ordinary cognition control-plane authority. A Space that advertises `draft_vocabulary` (§67.4) instead keeps one **draft vocabulary**: a Space-local Schema Package at the reserved path `kip://local/draft`, extended only through the KML statement `DEFINE` under the permission `propose_schema` (§29).

```prolog
DEFINE CONCEPT TYPE "Instrument" {
  description: "A musical instrument."
}

DEFINE PREDICATE "main_instrument" {
  description: "The instrument the subject mainly plays.",
  subject: {concept_types: ["Person"]},
  object: {concept_types: ["Instrument"]},
  functional: true
}
```

Rules:

- The package path prefix `local/` is reserved for Space-local packages. A draft lineage is qualified by its home Space: Capsule identity mapping (§38.2) keeps a source's `kip://local/...` symbols source-namespaced and MUST NOT merge them by name with the destination's draft symbols. An import that writes elements under a source draft symbol needs an explicit mapping of that symbol, in the import's mapping artifact (Capsule companion §41.7), to a destination symbol of the same kind — a destination draft symbol or a symbol of an installed package. An unmapped source draft symbol fails `SchemaPackageUnavailable`, and the error names every unmapped symbol; the importer never maps by name and never synthesizes a destination package for them.
- `DEFINE` only adds. A name that already names a symbol of the same kind in the Schema Environment — from Core, a Profile, any package in the Space's Schema Lock whatever its state, or an earlier draft symbol — fails `SchemaSymbolConflict`, and a reserved Core name (§20.13) conflicts for every kind. Symbol kinds are separate namespaces, as they are inside a package. A draft symbol never shadows another symbol and never changes after it is defined. A package activated later that exports a draft symbol's name makes that local name ambiguous (§20.7) until the draft symbol is promoted to it.
- The definition is the body of the package definition of that kind (`schemas/kip-schema-package.schema.json`) without `ref` and `kind`, which the runtime supplies. Both kinds REQUIRE a string `description`: it is the only meaning a later reader of the symbol gets. Parameters are bound before any check, and a member not listed below fails `ConstraintViolation`.
- A draft Predicate MAY declare `subject`, `object`, `functional`, `functional_by`, `open_world`, `complete`, `boolean_completeness` and `temporal_conflict` with the meanings and defaults of §20.15. An omitted `subject` or `object` leaves that endpoint unconstrained, so `functional_by`, which partitions by the object's Concept Type, needs a declared Concept object. It MUST NOT declare `open_world: false` or `complete: true`: a closed-world reading and exclusive-value completeness are claims about authority over the data, which only an installed package makes.
- A draft Concept Type MAY declare `attributes: {open: true, fields: {...}}`, each field declaring `type` — a §9.2 name or an array of them — and optionally `description`. It declares no required attributes, no other field members, no Facets and no Structural Fields; its attributes are open and optional.
- `DEFINE` is a standalone operation. It MUST NOT appear inside `MUTATE` or in an `atomic` request with other operations (§75.3). It commits as its own transaction, advances `schema_environment_version`, publishes a `schema` control change (§36.1) and makes the symbol resolvable for later operations. Its result is `{ref, schema_environment_version}`: the new symbol's exact reference and the environment version the definition created. `DEFINE` has no `CLIENT KEY`: a retried request is deduplicated by its `idempotency_key` (§34), and a repeated definition without one fails `SchemaSymbolConflict`, even when it is identical.
- The draft package has one fixed version, `kip://local/draft@0.0.0`: a draft symbol never changes after it is defined, so a version number would carry no information, and one version keeps every draft symbol out of Capsule embeddings, Schema Locks and `DESCRIBE PACKAGE` as a growing list of versions. Elements persist that exact reference (§20.4). Each `DEFINE` still advances `schema_environment_version`, which is what caches and bases key on.
- The draft package is synthesized by the runtime, per Space, from the Space's Schema Environment history, never installed Nexus-wide. From its first `DEFINE` it is part of every later Schema Environment of the Space; activating or migrating other packages never removes it. `LIST SCHEMA PACKAGES` and `DESCRIBE PACKAGE` report it with status `active`, its definitions so far and an `integrity.content_digest` the runtime computes under `kip-jcs-safe-v1` (§37.7), so its digest changes with every `DEFINE` while its reference does not.
- Promotion is a Schema migration under `manage_schema`, recorded in the Space's Schema Environment: a lineage mapping from the draft symbol to a symbol of the same kind in an installed package, with the rename semantics of §20.14. It is never declared inside a package artifact — a portable package cannot name one Space's draft symbols. Nothing is promoted implicitly, and a draft symbol is promoted at most once. `DESCRIBE SCHEMA ENVIRONMENT` reports the promotions as `lineage_maps`, one entry `{kind, from, to}` per promoted symbol, from its draft lineage (`kip://local/draft/<name>`) to its target lineage — the entry names the kind because symbol kinds are separate namespaces and a lineage identity does not; an `AS OF` read before a promotion does not see it. Afterwards every rule that matches by lineage (§20.14) treats the two lineages as one, while elements written under the draft symbol keep their exact `kip://local/draft@0.0.0/<name>` reference and stay readable through its lineage.
- `propose_schema` never confers `manage_schema`, `manage_policy` or any authority over existing symbols. A runtime that does not advertise `draft_vocabulary` rejects `DEFINE` with `UnsupportedCapability`.

The Cognitive Memory Profile's `review_schema` SleepTask class queues draft symbols for review and promotion. The Brain that defines a symbol queues its review with `client_key` `review_schema:<kind>:<exact symbol ref>`, where `kind` is `ConceptType` or `PredicateType`. The task identifies both the kind and the exact reference: same-named symbols of different kinds have distinct tasks, while a retried definition never queues twice. Review MAY propose a promotion; only a Principal holding `manage_schema` performs one.

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

> eligible support is sufficient under the Projection Policy, dependencies are valid, and unresolved direct or slot-constraint opposition is below the policy boundary.

This is the final result, not merely candidate-local support. Single BELIEF and BELIEF SLOT MUST agree on final acceptance (§21.11).

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

Projection remains read-only. A runtime MAY cache it only under its complete
ProjectionBasis (§21.12) and MUST disclose that basis and the next invalidation
instant with every served result. Reuse requires validation of all computation
dependencies; policy-only and time-only changes count even without a new
Assertion. A stale result MAY be served explicitly as historical, never as
current. A cache never becomes Evidence or a self-corroborating Assertion.

---

## 21.10 Structural projection baseline

The minimal conforming Projection Policy uses only structural material: Assertion lifecycle, world-time validity, caller visibility, `mode`, `stance`, and provenance-root independence (§23). It weighs nothing — no trust scores, no confidence arithmetic, no numeric output (`score: null`) — and it is fully determined by the visible state, so two runtimes given the same state and policy produce the same status, `leading` and ledger. The conformance suite's `test-deterministic` policy is such a policy.

Every KIP-Epistemic implementation MUST be able to run a structural policy (§92). Trust-weighted policies (§22, §27.3) build on it and are advertised through `weighted_projection` (§67.4); a runtime that offers only the structural baseline still conforms.

Temporal succession (§25.4) and time bounds (§25.5) are part of world-time validity, so every policy — the structural baseline included — applies them.

---

## 21.11 Final belief and slot conflicts

Projection has two stages. The first computes `candidate_status` from one candidate's eligible support and opposition. The second evaluates the visible, eligible candidates of the same slot (§20.15) under the same ProjectionBasis.

A functional or exclusive-value conflict between materially supported candidates MUST be reflected in the final `status` of every involved candidate, including a grounded single-Proposition `BELIEF` and `BELIEF (id: ...)`. Under the structural baseline those candidates are `contested`, their `slot_status` is `contested`, and they are absent from `accepted_values`. A policy MAY resolve a conflict only through its declared rules, recorded in the ledger (§21.13); the shape of the query MUST NOT resolve it. A multi-valued slot of a non-functional Predicate is not contested merely because it has several supported values.

`candidate_status` is diagnostic and never an action verdict; `status` is the consumer-facing result. `conflict_refs` contains only references the caller may discover (§30.4), and `conflict_reasons` names the constraint, for example `functional_value`. That constraint is opposition to accepting a candidate; it does not convert an object `false` into a stored `reject` Assertion, and direct stance conflicts remain representable. A candidate with no eligible support does not become accepted because another candidate exists. `leading` is recomputed over the final conflict set with the policy's tie-break; a structural tie reports `none`. Slot and candidate queries evaluated at the same basis MUST agree on final acceptance.

---

## 21.12 ProjectionBasis

Every projected result MUST carry `basis`, conforming to `schemas/kip-projection.schema.json#/$defs/ProjectionBasis`:

```text
space_id and the cognitive snapshot sequence
Schema Environment version and identity-resolution version (§11.5)
Projection Policy id/version and the protected trust-state version (§22.5)
an opaque current authorization-view identity — never a Grant list or a hidden count
the canonical sorted context reference set (§25.3), purpose and risk
valid_at, and next_invalid_at: the next known temporal invalidation instant, or null
```

A cache key MUST include every basis member except the computed `next_invalid_at`. Reuse requires current authorization and validation of every basis dependency: trust, identity, Schema, policy or authorization changes invalidate the relevant cached results even when no Assertion changed, and a result reaching `next_invalid_at` MUST be recomputed or served explicitly as historical. An engine MAY use dependency-specific invalidation instead of discarding every result on each Space commit, provided the reused result equals a fresh computation; it then issues the reused result under a fresh basis and never relabels an old snapshot as a new read. WorkingState and other compiled views carry the same basis where applicable. Strength decay (§59.1) is not a belief input and never invalidates a basis.

---

## 21.13 The standard memory policy

The structural baseline (§21.10) resolves no conflict: two eligible, materially supported values of one functional slot are `contested` whoever stated them. That is the right floor, but a memory Brain also needs a standard answer to the everyday questions — does a task-specific instruction override a general preference, and does a person's own statement about themselves override hearsay? Leaving those to each engine would make the same memory answer differently on two engines.

`kip:memory-default` (version `1`) is the standard deterministic policy for memory recall. It is the structural baseline plus three precedence rules, applied in order when two or more candidates of one slot are in conflict at the basis:

```text
1. context specificity   candidate A prevails over candidate B when some eligible
                         support of A has a context set that strictly contains the
                         context set of every eligible support of B
2. first-person          candidate A prevails over candidate B when A has eligible
   testimony             support stated or observed by the slot's subject itself,
                         and no eligible support of B is by the subject or has
                         mode observed
3. recency               candidate A prevails over candidate B when the greatest
                         start key (§25.4) among A's eligible support is greater
                         than the greatest start key among B's eligible support
```

The rules apply in order: the first rule under which one candidate prevails over every other candidate of the conflict set decides it. A candidate that prevails receives its candidate status as its final status; each candidate it prevails over becomes `uncertain` with the uncertainty reason `outranked` and a ledger entry naming the rule, never `rejected`, because no opposition was asserted. When no candidate prevails over all others — under rule 3, when the greatest start keys tie — the conflict stands and every candidate in it remains `contested`. The policy uses no numbers: `score` is `null`, and two runtimes given the same visible state produce the same status, `leading` and ledger.

Rule 3 is the cross-actor counterpart of temporal succession: succession lets an actor's later value end that actor's earlier one, and recency lets the value most recently claimed to hold prevail when different actors' values conflict — a device's old observation against the person's newer statement, or two instruments' readings. It compares when values were claimed to hold, never when the Brain wrote them (§13.2), so a late-recorded old claim never wins by being recorded last. Rules 1 and 2 come first, so a person's own statement still prevails over newer hearsay and a task instruction over a newer general one.

The rules are deliberately few. Mode ranking beyond rule 2 and trust are policy choices a deployment makes through its own versioned policy (`weighted_projection`). The machine-readable policy artifact is `profiles/policy-memory-default.json`. A Memory Interface binding (companion) uses `kip:memory-default` unless the request or the deployment names another policy, and discloses the policy in every basis.

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

A corrected Evidence record cannot provide unqualified current support under the structural baseline. Its historical payload remains queryable; a replacement claim must cite the corrected evidence explicitly. Payload purge alone preserves the evidence event and root identity (§60.6).

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

Trust changes MUST be auditable, advance their protected version and appear as control-plane transitions on the change/audit stream. They invalidate dependent ProjectionBasis views (§21.12).

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

A Schema may declare a Predicate functional (§20.15), or functional within partitions of its objects (`functional_by`).

Multiple overlapping accepted candidate values of one slot then form a conflict set (§21.11).

---

## 25.2 World intervals

`valid_time` is a half-open interval `[from, until)`:

```text
from   null or absent   no start stated: the value began no later than the claim was
                        made, so projection reads the bound {latest: asserted_at} (§25.5)
until  null or absent   open: the Assertion states no end
at t = until            the Assertion is excluded; a value beginning at t is eligible
exact finite bounds     MUST satisfy from < until
```

A missing `from` is not a claim that the value held since the beginning of time: a claim made at T says the value holds at T and says nothing certain about earlier instants, so a projection before T finds it indeterminate (§25.5) unless a predecessor narrows it (§25.4). An open `until` is not a claim that the value holds forever. It holds until the same actor ends it or a successor begins (§25.4); an open Assertion with no successor remains eligible for every later instant. Two values valid over non-overlapping effective intervals need not contradict.

Protocol timestamps use the strict format of §6.5; noncanonical input is rejected, not normalized. Source-local or coarse dates stay source data until a host explicitly converts them to an exact Timestamp or a time bound (§25.5), retaining the original text and its precision in Evidence. Formation MUST NOT invent an exact instant. A missing interval follows §25.2 and §25.4, never retention expiry (§19.2).

---

## 25.3 Context matching

Core context matching is set inclusion: an Assertion is eligible for a request only when its `context_refs` is a subset of the request's canonical context set. An Assertion with empty context is general and eligible in every context; a scoped Assertion is ineligible for an empty request context and is reported `context_mismatch` where the caller may see exclusions. Context identity uses the identity resolution at the basis (§11.5), never name similarity or an asserted `same_as` claim. Additional inheritance between contexts requires an explicitly versioned policy; conflicting context dimensions declared by a package MUST fail validation, and unknown context is not an invented universal scope. `WITH EPISTEMIC {context_refs: [...]}` supplies the request set.

Different contexts MAY make apparently different Assertions non-conflicting: a context-scoped Assertion that is ineligible in a request cannot conflict in it. When both are eligible, the structural baseline leaves the conflict standing and `kip:memory-default` resolves it by specificity (§21.13).

---

## 25.4 Temporal succession

The world changes more often than actors are wrong, so recording a change takes one write: the new value, from the time it began. Earlier open-ended claims are ended by their successors at projection time, deterministically and without rewriting anything.

**Start key.** Every Assertion has a start key: the latest instant by which it claims to have begun — an exact `from`; else the `latest` of a time-bound `from` (§25.5); else its `asserted_at`, because a claim with no stated start, made at time T, says the value held at T (§25.2).

**Who takes part.** Succession is an actor's own account of what they witnessed changing. An Assertion takes part in succession — lies on lines, ends predecessors and is ended by successors — when its mode is `stated` or `observed`, or when it writes an explicit `from`. An `inferred` Assertion with no written `from` is on no line: the Brain concluding a value at T is not the Brain witnessing that an earlier conclusion stopped holding, and letting one inference end another would turn every disagreement between two sources into an invented world change. Such an Assertion keeps its written interval, stays eligible, and its disagreement with an earlier one is a conflict for the policy (§21.11, §21.13); a Brain that has decided its earlier inference was wrong supersedes it (§14.2), and one that has learned when the world changed writes the `from`.

**Succession lines.** Two active Assertions are on one succession line when they take part in succession, have the same canonical `asserted_by` actor, the same canonical `context_refs` set, and either

```text
proposition line   the same Proposition, whatever their stances
slot line          stance support, distinct Propositions of one functional slot (§20.15):
                   same subject, same Predicate lineage and, for functional_by,
                   the same partition
```

**Succession.** Two Assertions on a line **disagree** when they are on a slot line, or when they are on a proposition line with different stances. A later Assertion that agrees with an earlier one — the same Proposition and stance — neither ends nor narrows it. For an Assertion P on a line, its **successors** are the eligible Assertions on the line that disagree with P and have a greater start key; its **predecessor** is the disagreeing eligible Assertion on the line with the greatest start key smaller than P's. Equal start keys are simultaneous: neither succeeds the other, and a disagreement between them stays a conflict.

```text
start    if P's from is not exact and P has a predecessor Q, P's line start is
             {earliest: max(P.from.earliest, start key of Q), latest: start key of P}
         otherwise P's written from
end      if P's until is open and P has successors, P's line end is the line
             start of the successor with the smallest start key — when several
             share that key, their line starts combined bound by bound, taking
             the earliest of each
         otherwise P's written until
```

Both are computed per line: a successor ends P at the start it has on P's line, never at a start that another line narrowed further. An Assertion on several lines combines them bound by bound: its effective start takes the latest `earliest` and the latest `latest` any of its line starts gives it, and its effective end the earliest of each of its line ends (an exact instant counts as a bound whose `earliest` and `latest` are equal). Effective intervals only ever narrow written ones: succession never makes an Assertion eligible where its written interval excludes it, never changes stored state, and is recomputed from the eligible set at every basis. An Assertion that is not eligible for the projection — retracted, superseded, quarantined, invisible to the caller, excluded by mode or context — is on no line, so withdrawing a successor restores its predecessor's open end, and a hidden Assertion never changes a visible one's interval.

Consequences:

```text
world change          one ASSERT of the new value; the old value is expired from
                      the new value's start and still answers FOR TIME before it
value simply ended    one ASSERT by the same actor, opposite stance, same Proposition,
                      from the time it ended (Appendix F.2)
late history          an Assertion whose start key precedes the current value's never
                      displaces the current value; a late-recorded claim carries the
                      time it was made (§13.2), so recording order never decides
different actors      never succeed one another: their disagreement stays a conflict
                      (§21.11) for the policy to handle (§21.13)
two inferences        never succeed one another unless they write their start: the
                      disagreement stays a conflict, never an invented change
```

Succession applies to every Projection Policy, including the structural baseline. It is not supersession (§14.2): no one is recorded as having been wrong.

---

## 25.5 Time bounds

An instant known only within a range is written as a **time bound** — an object with at least one of `earliest` and `latest`, both Timestamps (§6.5), with `earliest <= latest` — meaning the true instant lies in `[earliest, latest]`. Either `valid_time` endpoint MAY be a time bound. A host converting "in 2019" writes `{earliest: "2019-01-01T00:00:00.000Z", latest: "2019-12-31T23:59:59.999Z"}` and keeps the source text as Evidence; it never picks an instant inside the range. An interval is invalid when its earliest possible start is not before its latest possible end.

At a projection instant `t`, an Assertion's effective interval is **inside**, **outside** or **indeterminate**:

```text
inside         start certainly <= t   (exact <= t, or latest <= t; a missing from is the
                                       bound {latest: asserted_at}, §25.2)
               and end certainly > t  (open with no successor, exact > t, or earliest > t)
outside        start certainly > t    (exact > t, or earliest > t)
               or end certainly <= t  (exact <= t, or latest <= t)
indeterminate  otherwise
```

An indeterminate Assertion is material but cannot decide a status by itself: a candidate whose only eligible support or opposition at `t` is indeterminate is `uncertain`, with the uncertainty reason `temporal_indeterminate`. An indeterminate competitor does not form a functional conflict with a candidate whose support is inside; it is listed in the ledger. `FOR TIME` itself is always an exact Timestamp.

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

`context_refs` is a sorted set of exact context references (§25.3). All resolved coordinates are returned as `basis`; `schemas/kip-projection.schema.json` defines the wire contract.

## 27.2 Projection output

Conceptual output:

```json
{
  "status": "accepted",
  "candidate_status": "accepted",
  "slot_status": "accepted",
  "conflict_refs": [],
  "conflict_reasons": [],
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

  "explanation": {},

  "basis": {
    "snapshot_seq": 1500,
    "policy": {"id": "...", "version": "..."},
    "valid_at": "...",
    "next_invalid_at": null
  }
}
```

The example abbreviates `basis`; actual results MUST include the full ProjectionBasis (§21.12). The basis is where a projection reports the policy it ran under, its `valid_at` and its snapshot: a projection has no separate `policy` or `temporal` member, and `schemas/kip-projection.schema.json#/$defs/Projection` is the wire contract. `candidate_status` is diagnostic; consumers use final `status`. Functional conflicts are included even for a single grounded candidate (§21.11).

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
repair_recording  recording_repair
manage_trust      weighted_projection
propose_schema    draft_vocabulary       DEFINE in the Space's draft vocabulary (§20.16)
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

## 30.5 Single-agent preset

Most deployments are one Agent with one memory. Designing Grants from thirty permissions is where such a deployment goes wrong, so this preset is the RECOMMENDED starting policy for a Space with one acting Agent. It binds four Principals; a deployment that merges any two of them MUST say so, because the separations below are what make the channel auditable:

```text
agent         the acting Agent (waking Brain, Formation, Recall)
              discover, read, search, project, create, update, assert,
              record_attributed_assertion, retract_own, supersede_own, archive,
              export; propose_schema where draft_vocabulary is advertised;
              repair_recording where recording_repair is advertised, which §57.8
              limits to this Principal's own source-backed outputs — "you misheard
              me" is the Agent's own mistake to repair, not the owner's
              ActorBinding: the Space's $self (§5.6)
maintenance   the sleeping Brain ($system)
              the agent's read permissions, create, update, assert (as $self),
              maintain, merge_identity, manage_retention, tombstone,
              read_history, read_audit; derive where advertised
instrument    telemetry, verifiers, test harnesses, human review tooling
              discover, read, create, record_outcome where advertised
              no ActorBinding to $self: it never grades its own actions
owner         the human the memory belongs to
              every Core permission, including purge, manage_legal_hold,
              manage_schema, manage_policy, manage_grants, quarantine, declassify,
              approve and elevate_authority; the approver of RequiresApproval
```

Everything not granted is denied (§30.2). `purge`, legal holds, Schema installation, trust and authority elevation stay with the owner: the Agent can forget through archive and tombstone, and asks the owner for erasure (Memory Interface `forget`). A deployment in which one Principal is both `agent` and `instrument` runs a self-graded channel and is visible as such from `_system.origin` (§29.8).

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
descriptive     may be reported or used as factual data within the permitted purpose/scope
advisory        may supply procedural guidance for deliberation
behavioral      may be adopted as a procedure shaping the Agent's own conduct
executable      may drive an external action (§62)
```

The field is Governance-protected: ordinary KML cannot write it; it is read in the element's `governance` view (`?x.governance.authority_class`, subject to the caller's visibility under §30) and `DESCRIBE ACCESS` reports which classes the caller may elevate to; it is never inferred from cognitive content (§28.1). An element without the field has `descriptive` authority. A Profile MAY tie lifecycle standing to a class — a `proposed` Skill is at most `advisory`, and adoption under the Cognitive Memory Profile's §14 is what a Governance policy may accept as grounds for `behavioral` — but the class is assigned and enforced by Governance, not by the Profile's own fields. For procedural influence, grants/elevations bind the exact SkillRevision and behavior_digest; selecting another revision does not transfer them.

---

These classes govern permitted uses and enforceable operations: disclosure,
procedural adoption, authority elevation and dispatch. A Nexus MUST NOT claim that
a label proves exposed content had no internal influence on a model. Using an
authorized fact as decision data does not require Skill adoption; treating content
as a governing instruction or executing a stored procedure still requires the
appropriate independent checks. Factual data cannot grant additional permission.

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

Control-plane commits carry governed `control_changes` entries (`trust`, `policy`, `schema`, `identity`, `authorization`, `recording`) with opaque version identities; they allocate a Space sequence and invalidate relevant bases. They never masquerade as Cognitive Elements or Evidence. Complete/filtered stream consumers receive a governed coverage watermark and authorization-view binding; missing entries or sequence gaps alone do not prove silence (Brain Runtime companion §2).

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

## 42.4 Solutions, bindings, and scope

A **solution** is a mapping from query variable names to matched values. A value may be a Cognitive Element, a scalar Literal, a JSON-compatible field value (including an array or object), an exact Schema ref, or virtual query state such as a Structural edge or a Belief result. A variable is **bound** when the solution supplies its value; being in scope does not guarantee a binding in every solution.

An ordinary pattern extends each incoming solution with compatible bindings. Reusing a bound variable constrains the next match; it MUST NOT overwrite that binding. Ordinary patterns and `FILTER` within a branch are conjunctive. The top-level `WHERE` and each independent `UNION` branch start with one empty solution, so their first patterns can produce matches. A pattern that removes every solution does not restart matching from an empty binding; a later independent `UNION` can still contribute results.

`NOT`, `OPTIONAL`, and `UNION` establish the scope boundaries in §44.3–§44.5. Their observable behavior follows the incoming solutions at their position in the block. An optimizer MAY reorder evaluation only if it preserves these bindings, boundaries, null extensions, and results. In particular, moving a `FILTER` into or out of an `OPTIONAL`, or making a `UNION` branch inherit its preceding branch's bindings, is not generally equivalent.

These rules apply recursively to nested blocks and to the raw `WHERE` patterns reused by KML and META. The latter still exclude `BELIEF` / `BELIEF SLOT` under their grammars. All branches share their enclosing operation's resolved Space, snapshot, Schema Environment, parameters, and applicable Governance; an independent variable scope is not a new authorization or snapshot scope.

A variable used only in an expression (`FIND`, `FILTER`, or `ORDER BY`) MUST have a visible pattern binding site. A name declared only inside `NOT` is not such a site outside that block; using it there without another binding site is `InvalidSyntax`. A visible variable missing in a particular `OPTIONAL` or `UNION` solution is instead unbound, with the null behavior in §44.1. A later ordinary pattern may bind an unbound variable; a null result cell is not an assignment that prevents subsequent matching. KML output-handle declarations are also explicit binding sites within their mutation scope (§53); query variables do not become forward-declared KML handles merely by sharing the `?` prefix.

---

## 42.5 FIND and solution processing

`FIND` declares one or more output expressions, in output order. The portable forms are variables, field paths, and the aggregates in §44.6. A variable projects its bound value; a path projects the selected field. Projecting a whole Element preserves its kind and identity and includes only fields the caller may read.

The logical processing order MUST be:

1. Evaluate the `WHERE` branches over authorized visible state, including any requested Projection.
2. Deduplicate identical complete solution bindings.
3. Form implicit groups and compute aggregates if present.
4. Evaluate output expressions and sort keys, then apply `ORDER BY` and the pagination window.

Deduplication uses every visible variable binding in the solution, including variables not named in `FIND`; `NOT`-local variables never participate. Element bindings compare by identity, not by display name or serialized payload. Literal bindings use §9.6. Schema-symbol bindings use lineage identity, including declared renames, under §20.14; their returned values still report exact refs. Missing bindings are distinct from a binding to an explicit Literal `null`, even though both project as JSON `null`.

Virtual Structural bindings identify the same source/field/target relation (including the position for an ordered field); virtual Belief bindings identify the same target and ProjectionBasis (§27). Re-evaluating the same virtual binding within that context does not create a distinct solution merely because an implementation allocated another object. Whole attribute/Facet objects used as values compare by their visible data contents, with object-key order insignificant and array order significant.

The same complete solution found through two `UNION` branches occurs once. Two different Concepts both named `Alice` remain two solutions and can produce two identical `"Alice"` cells in `FIND(?person.name)`. Likewise, two solutions differing in an unprojected relation binding remain distinct. There is no implicit value-level `DISTINCT` after projection. `COUNT(DISTINCT ...)` explicitly deduplicates its input values within each group (§44.6).

`LIMIT` caps result rows after this processing, not intermediate matches or the Evidence considered by a Projection (§46.3). A valid query with no matches succeeds with an empty result, subject to the aggregate-only empty-group rule in §44.6. It MUST NOT become a reference error merely because an ID pattern matched no visible element; invalid syntax, unresolved Schema symbols, and unavailable capabilities remain errors even for an empty result.

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
Search Pattern
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

An object pattern constrains all supplied fields together; fields omitted from the pattern are unconstrained. Nested object patterns constrain the supplied nested fields, rather than requiring equality with the whole stored object. A variable in a field position binds the matched value and unifies with other occurrences in its scope. An absent field does not supply a binding or match an explicit `null` field constraint; use `OPTIONAL` and null checks to query absence.

`{id: :id}` is a match-only identity lookup. `{type: "Person", name: "Alice"}` may match several Concepts because names are not unique (§7.2); only stable identity selectors have identity semantics. Inline Concept patterns in Proposition endpoints use the same rules and do not create Concepts. Nested Proposition tuples similarly match existing Propositions; a read never creates an endpoint or a Proposition.

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

It may be projected, filtered, and unified across patterns. When a comparison/match operates on Schema symbols, lineage identity governs (§20.14), so matching one Predicate across package versions does not split the population. It does not bind a v1 local predicate name. Ordinary scalar string comparisons do not implicitly resolve local aliases; clients must resolve symbols before comparing them with Predicate refs (§20).

A predicate-variable exploration SHOULD constrain at least one endpoint by identity, a Concept pattern, or a prior binding. `LIMIT` bounds returned rows, not the cost of scanning an unconstrained `(?subject, ?predicate, ?object)` pattern; a runtime MAY reject exploration that exceeds its resource limits with `ResourceExhausted`.

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

## 43.8 Search Pattern

A Search Pattern runs associative retrieval (§66) inside a query and binds each hit:

```prolog
FIND(?person, ?home)
WHERE {
  ?person SEARCH CONCEPT :query WITH TYPE "Person" MODE "hybrid" LIMIT 20
  ?home BELIEF SLOT (?person, "lives_in")
}
ORDER BY ?person.retrieval.score DESC
LIMIT 5
```

Syntax:

```text
?var SEARCH <KIND> <term> [WITH TYPE <t>] [WITH PREDICATE <p>] [MODE <m>] [THRESHOLD <x>] LIMIT <k>
```

Rules:

- The pattern binds `?var` to each hit, an element of the named kind (§66.2), and exposes the transient virtual members `?var.retrieval.score` and `?var.retrieval.mode` (§66.4). They MAY be used in `FILTER` and `ORDER BY`; they MUST NOT be written, persisted or read as confidence (§2.10).
- `LIMIT <k>` is REQUIRED and bounds the candidate set: the pattern yields at most the `k` highest-ranked visible hits after Governance filtering and `THRESHOLD`. Pagination belongs to the enclosing `FIND` (§44.8); the pattern takes no `CURSOR`.
- Retrieval runs against the query's snapshot. Under `AS OF SEQ` it is historical search and requires `historical_search` (§66.1). Modes, modifiers, freshness and existence protection follow §66.1–§66.5 exactly.
- A Search Pattern MUST NOT appear inside `NOT`: a search miss never proves absence (§66.6). It MAY appear inside `OPTIONAL` and `UNION`.
- A result that used a Search Pattern is approximate in the sense of §66.6: it is complete for its declared bound, never semantically exhaustive.

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

Paths are usable in `FIND`, `FILTER`, and `ORDER BY`. A path may also stop at an object, for example `?x.attributes`, `?x.facets["MnemonicState"]`, or `?x._system`, to return that complete visible object. Quoted bracket access selects keys that cannot be written as identifiers, including exact package refs; a quoted key is one path step, even when it contains dots.

An absent optional field, a missing Facet, or a path rooted in an unbound in-scope variable yields `null`, as does further access through that missing value. Thus an unmatched `?org` projects both `?org` and `?org.name` as `null`, and `IS_NULL(?org)` is true. This query null extension MUST NOT materialize a Literal, a field, or a negative Assertion. Schema-invalid paths and unauthorized disclosures remain subject to Schema/Governance validation; absence is not permission to bypass either.

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

`FILTER` retains a solution only when its condition evaluates to true; it binds no new variables. Parentheses control grouping; otherwise unary `!`/`-` bind before relational comparisons, then equality, then `&&`, then `||`, as defined by the EBNF.

| Function | Meaning |
| --- | --- |
| `IN(value, [v1, v2, ...])` | Whether a non-null value equals a member of the list; an empty list matches nothing |
| `IS_NULL(value)` / `IS_NOT_NULL(value)` | Whether a field/variable is absent, unbound, or explicitly null, and its inverse |
| `CONTAINS(text, part)` | Whether the string contains the given substring |
| `STARTS_WITH(text, prefix)` / `ENDS_WITH(text, suffix)` | Whether the string starts/ends with the given string |
| `REGEX(text, pattern)` | Whether the string matches the regular expression; the supported dialect and resource limits MUST be documented |

Scalar comparisons MUST NOT silently coerce strings to numbers or booleans. Baseline `FILTER` does not require deep equality or ordering of arbitrary attribute/Facet arrays and objects; an array passed to `IN` is a candidate list, not an array comparison. Use explicit Element identity paths when comparing whole-element results with scalar IDs.

Ordinary comparisons, membership, and string tests with an absent/unbound/null operand do not satisfy a filter; null checks are the explicit way to test those cases. Logical evaluation MUST preserve this unknown condition: negating it does not make it true, `true || unknown` is true, and `false && unknown` is false. Invalid function names/arity, invalid regular expressions, and unsupported operations are errors, not an empty match. Errors determinable from the command and bound parameters MUST be validated even for an empty branch. Errors encountered while evaluating a solution MUST propagate through `NOT`/`OPTIONAL` rather than become a successful absence test or fallback row; a value-dependent expression has no runtime value to inspect when no solution reaches it.

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

`NOT` is a correlated existence filter. For each incoming solution, its already-bound variables are visible inside the block and constrain matching. If the block produces at least one compatible solution, the incoming solution is discarded; otherwise it is retained unchanged. A block sharing no variables with its input tests the same independent visible existence condition for every incoming solution.

New variables first bound inside `NOT` are local to that block and its descendants. They MUST NOT be exported to a later clause, to a sibling branch, or to `FIND`/`ORDER BY`. Reusing such a name in a separate later pattern introduces a separate binding, not a value obtained from the negated match. Nested `OPTIONAL` or `UNION` cannot export bindings past the enclosing `NOT` boundary.

```prolog
FIND(?person.name)
WHERE {
  ?person {type: "Person"}
  NOT {
    ?org {type: "Organization", key: "acme"}
    (?person, "works_for", ?org)
  }
}
```

Here `?person` is correlated, while `?org` is local. The query retains people for whom the whole inner pattern has no visible match. Failure to evaluate that pattern (for example, a Schema or resource error) MUST NOT be treated as proof of no match.

---

## 44.4 OPTIONAL

`OPTIONAL` is a left-join style optional match.

A null result means no visible match, not falsehood.

For each incoming solution, evaluate the optional block using the incoming bindings. If it has compatible matches, emit each compatible extension; multiple matches produce multiple solutions. If it has none, retain the incoming solution once, with the optional block's newly introduced variables unbound. Incoming bindings MUST be preserved in both cases. Variables introduced inside nested `NOT` remain local to that `NOT`.

The optional variables are in scope in subsequent clauses and in `FIND`/`ORDER BY`; their missing values and paths yield null under §44.1. An optional block succeeds only when its complete pattern, including its internal filters, succeeds. A partial match MUST NOT leak bindings into the unmatched fallback row.

```prolog
FIND(?person.name, ?org.name)
WHERE {
  ?person {type: "Person"}
  OPTIONAL {
    (?person, "works_for", ?org)
    FILTER(?org.name == "Acme")
  }
}
```

The example keeps every matching Person, using null for the organization when no visible Acme match exists. Moving the `FILTER` after the closing optional brace removes those null rows; it changes the query. A runtime error inside the optional block aborts the query rather than producing a fallback row.

---

## 44.5 UNION

`UNION` represents alternative pattern branches.

The KIP spelling is a preceding pattern block followed by `UNION { ... }`, not a correlated join. At the position of `UNION`, the left operand is the solution set accumulated by preceding clauses in the current block. Its braced right operand executes independently, starting with one empty binding, even if the left operand has no solutions. It MUST NOT inherit query-variable bindings from the left operand or surrounding block. Repeat any constraint needed by both branches in each branch, or apply it after the union when the relevant variables are available.

The result is the row-wise union of the two sets, with identical complete solutions deduplicated under §42.5. Same-named variables in the two branches are bound independently; their names identify the same output column after merging. A variable present in only one branch is in scope after the union but unbound in rows from the other branch. Its projected value/path is null, not a value copied from another row.

```prolog
FIND(?person.name, ?org.name)
WHERE {
  ?person {type: "Person", key: "alice"}
  UNION {
    ?org {type: "Organization", key: "acme"}
  }
}
```

If both records exist with display names `Alice` and `Acme`, this returns two rows: `("Alice", null)` and `(null, "Acme")`. If Alice is absent, Acme still appears. A same-name alternative such as two branches binding `?person` instead produces independent Person solutions, and an identical Person binding produced by both appears once.

An expression inside the right branch must resolve against that branch's own binding sites. For example, `?person {id: :alice} UNION { FILTER(?person.name == "Alice") }` is invalid: the right branch never introduces `?person`. This differs from a filter after the union, where the merged variables are in scope. Parameters such as `:alice` remain available in every branch.

Consecutive `UNION` clauses add independent alternatives to the accumulated result. Ordinary clauses following a `UNION` operate on that accumulated result; clauses inside its braces affect only that branch. These rules apply recursively. When a union is nested inside `NOT` or `OPTIONAL`, its right branch still starts without inherited bindings; the enclosing operator then tests or joins only solutions compatible with its own input. This preserves an outer binding and prevents an independent branch from overwriting it.

| Clause | Reads incoming bindings inside its block | Exports newly introduced variables | No compatible match |
| --- | --- | --- | --- |
| `NOT` | Yes | No | Keeps the incoming solution unchanged |
| `OPTIONAL` | Yes | Yes, except nested `NOT` locals | Keeps the incoming solution once; new variables are unbound |
| `UNION` right branch | No | Yes, except nested `NOT` locals | Contributes no rows; the left result is retained |

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

With only aggregate expressions, the complete solution set is one group, including when it is empty. With grouping expressions, each distinct grouping key produces one row; no solutions means no groups and no rows. Grouping combines equal projected key values, so grouping by `?person.name` can combine different same-named people; include `?person.id` when identity is intended.

`COUNT(expr)` counts non-null inputs, and `COUNT(DISTINCT expr)` counts distinct non-null inputs. `SUM` and `AVG` operate on numeric inputs; `MIN` and `MAX` require mutually comparable scalar inputs. An empty or all-null group returns `0` for `COUNT` and `null` for `SUM`, `AVG`, `MIN`, and `MAX`. Non-null inputs of an inappropriate type are `TypeMismatch`, not numeric zero or silently discarded data; numeric results must satisfy §9.3. Aggregation consumes the complete deduplicated solutions before pagination, never just the current page.

`COUNT = 0` does not mean a proposition is false.

---

## 44.7 Ordering

```prolog
ORDER BY <expr> ASC|DESC [, ...]
```

Sort keys are applied left to right.

Each key defaults to `ASC`; a later key resolves ties in all preceding keys. Portable sort keys are comparable scalar variables, field paths, and aggregate expressions also present in `FIND`. With aggregation, non-aggregate sort keys must be grouping expressions. Ordering by a whole Element, array, or object is not portable; use a scalar path such as `?person.name` or `?person.id` instead.

Null SHOULD sort last in both ascending and descending order unless future explicit syntax says otherwise. Without `ORDER BY`, no semantic result order is promised; pagination still requires the stable traversal below.

---

## 44.8 Pagination

```prolog
LIMIT :limit
CURSOR :cursor
```

KQL pagination cursor MUST preserve one canonical cognitive snapshot for that traversal.

The engine MUST apply a deterministic tie-breaker within one cursor traversal so that solutions with equal `ORDER BY` values are neither duplicated nor skipped across pages.

Current Governance authority still applies when continuing.

`LIMIT` MUST be a non-negative safe integer (§9.3); `0` returns no rows. `CURSOR` MUST be an opaque non-empty string. Both accept complete-value parameters. If no limit is supplied, any implementation result cap MUST be disclosed; a truncated page MUST NOT be presented as a complete result.

A continuation belongs to its query and bound parameters, Space, and snapshot. Incompatible query reuse fails `CursorMismatch`; use in a different cursor family fails `CursorTypeMismatch`; malformed, expired, or invalidated cursors use the errors in §87.7. A client MUST NOT decode or edit a token to change its position. If the pinned snapshot is no longer available, the runtime MUST fail explicitly instead of silently restarting at the current head. Result layout and `next_cursor` are described in §81.

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

When raw paths are supported, `{n}` means exactly `n` hops, `{m,n}` means an inclusive range, and `{m,}` has no query-specified upper bound. Bounds are non-negative integers and an upper bound less than the lower bound is invalid. A zero lower bound includes the reflexive zero-hop match: both endpoints resolve to the same visible Element without traversing or requiring any Proposition. Zero hops therefore provide no Proposition ID, evidence of an edge, or belief commitment.

Each nonzero hop traverses a visible stored Proposition matching the declared Predicate. Alternatives select among the named Predicates; the same endpoint solution reached along several paths is subject to §42.5, not counted once per walk. A raw path is a reachability pattern, not a newly inferred transitive Proposition. Multi-hop and zero-hop results MUST NOT fabricate a durable Proposition for an optional link-variable binding; any supported path-value binding must be explicitly documented. Portable reachability queries omit that binding, as in the examples above.

A predicate variable denotes one exact Predicate (§43.3), not a path or predicate list. The portable path forms use quoted Schema symbols or parameters resolving to them; predicate variables with quantifiers or alternatives MUST be rejected as `InvalidSyntax` during semantic validation, even where the EBNF can parse their shape. Implementations MUST declare path support and hop/resource limits. Exceeding a limit fails explicitly (for example, `ResourceExhausted`) rather than silently truncating reachability and reporting absence; `LIMIT` does not turn an unbounded traversal into a bounded one.

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

An unbounded whole-Brain projection SHOULD be rejected. A bounded candidate still evaluates relevant slot competitors before final acceptance; LIMIT caps returned rows, never the evidence considered. Resource exhaustion yields an explicit incomplete/uncertain result or error, never acceptance from silently truncated opposition.

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

Shape (`schemas/kip-projection.schema.json#/$defs/Slot`):

```json
{
  "status": "accepted|contested|uncertain|insufficient",
  "accepted_values": [],
  "candidate_projections": [],
  "subject": {"id": "C-1"},
  "predicate_ref": "kip://...",
  "uncertainty": {},
  "explanation": {},
  "basis": {}
}
```

`basis` is REQUIRED and, as for a projection (§27.2), carries the policy, `valid_at` and snapshot; a slot has no separate `policy` or `temporal` member. `subject` (a reference, §8) and `predicate_ref` (the exact resolved Predicate) MAY identify the slot. Each entry of `candidate_projections` is a Projection and carries its own `leading`.

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

## 48.6 Historical control state

Historical cognition uses the Schema, identity, trust and Projection Policy versions in force at its cognitive snapshot by default; current authorization always controls disclosure (§48.5). A request to reinterpret old data under a current policy MUST select that policy explicitly and disclose it in the basis (§21.12); the result is then not "what was believed then". When the historical control state is not retained, the read fails `HistoricalSnapshotUnavailable` rather than substituting today's trust or policy silently.

---

# 49. WITH EPISTEMIC

Recommended:

```prolog
WITH EPISTEMIC {
  purpose: "answer_user",
  risk: "low",
  policy: "optional-policy-id",
  context_refs: [],
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

A KQL response MUST identify its Space and snapshot; projected results additionally MUST expose the complete ProjectionBasis (§21.12), including:

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

DEFINE            (draft vocabulary, standalone only, §20.16)
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

The bound applies to **distinct target elements**, not to matching rows. The
runtime determines the selected target set from the statement's pre-mutation
view, deduplicates it by element identity, and applies the cap before writing.
An element reached through several matching paths is selected once; changes
made by the statement MUST NOT admit more targets into that same statement.
`LIMIT` MUST be a non-negative safe integer (§9.3); `LIMIT 0` selects none.

`LIMIT` does not bound how much data `WHERE` scans. Runtimes MAY enforce
documented scan/materialization limits and fail the transaction when those
limits are exceeded. Maintenance SHOULD constrain candidate sets structurally
(for example by Concept Type, Predicate, or endpoint) before applying filters.

Repeating a capped sweep MAY select the same elements again. To process each
element once per maintenance cycle, write a schema-defined cycle marker in the
same mutation and exclude already-marked elements in `WHERE` (§59.1). Bind the
cycle marker once and reuse it across all chunks and retries; a new marker on
each retry re-admits work already performed. Each chunk is a separate request:
use its own transaction idempotency key, and reuse that key only to retry that
chunk (§34). KQL cursors do not paginate mutation targets.

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

Each output handle MUST be declared exactly once in that block; duplicate
declarations fail with `DuplicateLocalHandle` or an equivalent syntax error.
Every handle reference MUST resolve to a block output or to a variable bound
by that mutation clause's own `WHERE`. A `WHERE` binding in one clause does not
declare a handle for other clauses, and handles do not carry across runtime
operations, including operations sharing an atomic request. A standalone
creation's handle is local to that statement. Clients use returned durable
IDs to reference its result in a later operation.

---

## 53.3 Forward references

Native v2 MUTATE SHOULD allow forward local references.

The engine MUST resolve/validate the entire mutation graph before commit.

Forward references do not require v1's source-order execution or a globally
acyclic mutation graph. For example, Evidence may name its generating Activity
while that Activity names the Evidence among its outputs, where the Schema
allows it. All references must resolve, and each relation's own cycle,
cardinality, same-Space and mutability constraints still apply.

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

An `id` selector only addresses an existing Concept. If that ID cannot be
resolved as an accessible matching Concept, the upsert MUST fail with
`NotFoundOrNotVisible`; it MUST NOT create an element with a client-supplied ID
or fall back to a name match. A `key` selector may create a new Concept under
the type/lineage rules in §54.4. Additional selector fields constrain the match;
they do not override the addressed identity or authorize choosing an arbitrary
candidate.

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
is `id`, the upsert cannot create (§54.3) and MUST fail existence-neutrally,
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
context     OPTIONAL   exact reference array → context_refs
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
- `at` defaults to the engine's transaction time, which is right only for a claim made at the moment of the write. A claim taken from captured source material — a message, a document, a trace — SHOULD carry `at` set to the source's observed time (§13.2): without it a late-recorded old claim takes today's start key (§25.4) and can end a current value it predates.
- `ASSERT` without `key` has no retry safety of its own: a retried request is deduplicated only by the envelope's `idempotency_key` (§34). With `key`, the created Assertion carries that `client_key` and the creation itself is replay-safe.
- `context` lowers exactly to immutable `context_refs`; omission is the existing general scope, never inferred task scope. Adapters pass their canonical context set. Scoped supersession preserves the compatible context lineage.
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

Supersession MUST NOT be used merely because another actor disagrees, and it MUST NOT be used to record that the world changed: that is one new Assertion from the time of the change, which ends its predecessor through temporal succession (§14.2, §25.4, F.2).

---

## 57.5 Revision and derived cognition

Superseding or retracting an Assertion, or correcting Evidence, changes what Projection reports. It does not automatically change cognition that was derived from the revised root: an Insight, a compiled Skill, a WorkingState, or a SelfModel built while the old claim stood is still active state.

A runtime MUST NOT auto-retract, auto-archive, or auto-rewrite derived cognition because one of its provenance roots was revised. Whether a derived element survives its root is a review decision, not a protocol rule.

A runtime MUST make derivation dependencies reviewable: `LIST DEPENDENTS` (§63.5) provides paged traversal, and the computed `_system.dependency_validity` (§57.6) makes a changed root visible at the next read, before any review runs. A root change leaves stored artifacts intact while their computed validity immediately becomes `needs_review`. That is neither an author-written stale flag nor an automatic retraction. Review resolves each affected artifact by revalidation (a `dependency_validation` Activity), replacement (a new artifact with its own lineage) or an ordinary lifecycle action, and records the bounded traversal it completed with an explicit coverage watermark.

---

## 57.6 Dependency validity

A derived Assertion or Profile artifact MUST carry an immutable input contract on its producing Activity: a `DependencyBasis` Facet with its basis sequence and groups of pinned source references. Each pin names the element, the version or plane counters it read (§6.3), and any temporal or policy dependency. The engine validates supplied read pins against retained source versions, or against same-transaction inputs under read-your-writes (§32.6); it MUST NOT restamp an old read with current versions at commit. Committing an honestly older derivation is allowed only with that disclosed basis and the resulting computed validity. A group's role is:

```text
all_of    every pinned prerequisite is necessary
any_of    the pins are alternative support
context   disclosure only; never epistemic support
```

Group membership is fixed for a derivation; a changed derivation is a new record.

The engine exposes the read-only virtual field `_system.dependency_validity` — `current | needs_review | unverifiable` — with the visible reasons, the checked basis and `action_eligible`. It is computed, never persisted or written by a reviewer:

```text
needs_review   a changed necessary pin; loss of all alternative support in an any_of
               group; a corrected, retracted or superseded root; an identity repair
               (§11.5); a recording repair (§57.8); an expired prerequisite
unverifiable   the DependencyBasis is missing; traversal is incomplete; a source is
               unavailable or hidden from the caller; a cycle has no external basis
current        otherwise
```

An unchanged alternative MAY keep an `any_of` group valid, and changed context is disclosed without alone rejecting the derivation. A numeric version mismatch is a conservative review trigger, not proof the derived claim is false. When a pin names planes, only those plane counters are compared; the pin's `version` records the original read coordinate and is not an additional whole-element guard. Lifecycle, recording validity, Governance and the validity of prerequisites are always checked, recursively, for derived Assertions as well as Concepts. Governance MAY authorize validation without revealing sources; without that authorization the result is `unverifiable`, with no hidden-source identities or counts. An ungraded legacy artifact without a DependencyBasis is therefore never `current`.

Every Profile Recall and every Projection of an inferred derivation MUST perform this check at its read basis. A supported derivation that is not `current` is at most `uncertain` (it remains `contested` or `rejected` where that is already warranted); it is never silently accepted. Raw history stays readable, and an action briefing cannot recommend automatic application while `action_eligible` is false. Revalidation creates a terminal `dependency_validation` Activity with a new DependencyBasis and the validated element among its outputs; its engine-captured output version binds it to that exact artifact version. Revalidation cannot substitute new premises for an old Assertion — that requires a new Assertion.

Producing and validation Activities record the planes of each output they certify in engine-captured `_system.output_plane_versions`, keyed by output ID and plane name. A later change outside those planes (for example `MnemonicState`) preserves the certification; a change inside them conservatively requires validation unless the engine proves semantic equivalence. Changed behavior never inherits a certification.

`LIST DEPENDENTS` review traverses every page and depth the task requires, records its processed watermark, and never marks a truncated scan complete. The engine traverses required dependency links independently of any optional lineage fields. An action gate pins the dependencies it checked; the executor revalidates them and Governance immediately before acting, and a detected change defers or re-plans rather than authorizing execution.

---

## 57.7 Selection dependencies

An element pin records consumption of a retained record. It does not record that a Proposition was accepted, that a functional slot had no competitor, or that a query or absence test covered an entire selection. A derivation that relies on such a judgment MUST also capture a query dependency in `DependencyBasis.queries`: the normalized selector artifact (with its bound parameters, scope and basis), the result digest, the authorization view, the expectation, and an engine-issued selection change token. The host captures the selector from the actual read; it is never reconstructed from an author's later account.

Insertions, removals and eligibility changes that affect the selection — including a new opposing Assertion or a previously absent Commitment — MUST invalidate the token. A changed token requires complete re-evaluation at the current read basis; if the re-evaluated result is unchanged, the derivation MAY remain `current`. A missing, incomplete or unauthorized selection proof is `unverifiable`. An engine without precise selection tracking MUST conservatively re-evaluate after any possibly relevant Space change; unchanged positive pins alone cannot discharge a selection dependency.

---

## 57.8 Recording repair

Extraction or attribution can be wrong while the captured source is right: the Brain recorded that Alice said something she never said. That is neither Alice's retraction nor a correction of sound Evidence, and it MUST NOT be written as either.

A runtime advertising `recording_repair` (§67.4) provides a protected operation with the `RecordingRepair` input shape (`schemas/kip-cognitive-records.schema.json`). It requires `repair_recording` (§29) plus the ordinary permissions for any replacement Assertions; neither recording attribution nor `update` confers repair authority. By default it is limited to the authenticated recorder's own source-backed outputs; broader review requires an explicit protected grant.

In one transaction the engine MUST verify the immutable source identity and digest, the source locator, the recorder's origin, the expected versions, the replacement's reference closure and the actor/context bindings; it then appends a terminal `recording_repair` Activity and a protected invalidation of the wrong extraction, exposed as the governed virtual field `_system.recording_validity` (`valid | invalidated`, with a discoverable `repair_ref` or `null`). The invalidation advances the affected element's version without rewriting its epistemic payload; the source bytes, the original Assertion payload and the actor's lifecycle are preserved. Current projection excludes the invalidated extraction and its dependents become `needs_review` (§57.6); raw history identifies the repair, and historical reads use the repair state at their snapshot under current authorization. Repair advances the Space sequence and the relevant control coordinates (§36.1).

A replacement Assertion describes the original claim: its `asserted_at` MUST be recovered from that original source (§13.2), never from the repair request or repair transaction time.

A source locator — a digest-bound byte range, JSON Pointer or format-specific selector — helps review extraction fidelity; it never proves semantic entailment. A runtime without this capability rejects the operation. It MAY quarantine the extraction under separate authority (§31.6), but MUST NOT forge an actor's withdrawal or correct sound Evidence.

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
Concept merged_into / protected identity-resolution state
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

## 58.3 Assignment and removal semantics

`SET FIELDS`, `SET ATTRIBUTES` and `SET FACET` assign only the named keys in
their respective planes. They use **shallow merge**: omitted keys retain their
values, while a supplied key replaces its complete previous value. An array or
object at that key is replaced as a whole; there is no implicit append, array
union, or recursive object merge. These rules also apply to the corresponding
clauses in CREATE and UPSERT (§54), subject to each kind's legal fields.

For example, if a schema-defined attribute `settings` is
`{theme: "dark", density: "compact"}`, then
`SET ATTRIBUTES {settings: {theme: "light"}}` leaves `settings` equal to
`{theme: "light"}`. A client preserving
`density` must supply the complete new object. Read-modify-write of such values
SHOULD use `EXPECT VERSION`, optionally guarding only the affected plane (§35).

An explicit JSON `null` is an assigned value where the Schema permits it; it
does not delete a key. `UNSET ATTRIBUTES {"key", ...}` and
`UNSET FACET "Facet" {"key", ...}` remove the named keys. Removing an absent
optional key has no effect. The resulting element MUST still satisfy its
Schema: removing a required field or assigning a disallowed `null` fails the
transaction. `SET/UNSET STRUCTURAL` use the reference semantics of §17.5,
rather than object-assignment semantics.

SET and UNSET MUST NOT bypass field mutability or protected-plane checks.
Conflicting assignments/removals of the same key in one declarative plan follow
§53.4; their meaning MUST NOT depend on which action appears last.

---

## 58.4 Bulk target and atomicity rules

An UPDATE requires at least one SET or UNSET action. Its `WHERE` uses raw KQL
matching and the binding/scope rules in §44; BELIEF and BELIEF SLOT projections
are not mutation targets. Every distinct selected target is updated exactly
once, even if joins or UNION produce several rows for it (§52.7). A variable
target must resolve to a durable element for the selected row; an unbound
optional result cannot be mutated. If no target matches, UPDATE creates
nothing and has no effect.

Target selection and expression evaluation use one pre-update view, including
transaction-local writes already visible under §32.6. A write performed by
this UPDATE MUST NOT change its own target set or the input of another
assignment in the same UPDATE. Thus two assignments that read one counter both
read its old value, regardless of action order.

The statement is atomic: any Schema, mutability, authorization, reference or
version-precondition failure aborts its transaction, rather than silently
skipping an invalid target. The numeric-expression key-skip rule in §59 is a
specific exception for absent/non-numeric input, not a general error-recovery
mechanism. Where a result reports `matched` and `updated`, `matched` counts
distinct selected targets after the cap, and `updated` counts those whose
durable state actually changed. An unchanged target has no version increment
(§35.5).

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

When these baseline functions are supported, their signatures and meanings
are:

| Function | Arguments | Result |
|---|---|---|
| `ADD(a, b)` | exactly 2 | `a + b`; a negative `b` subtracts |
| `MUL(a, b)` | exactly 2 | `a × b` |
| `CLAMP(x, lo, hi)` | exactly 3 | `min(max(x, lo), hi)`; `lo` MUST NOT exceed `hi` |
| `COALESCE(x, fallback)` | exactly 2 | `fallback` if `x` is missing or `null`; otherwise `x` |

Operands may be numeric literals, bound parameters, nested update expressions,
or dot-notation paths on the UPDATE target itself. An expression MUST NOT read
another query variable's state: several join rows must not offer competing
values for one target. Use a target variable bound by an ID pattern when the
expression needs to read the target's fields. All assignments read the same
pre-update target state (§58.4), not values written by earlier SET actions.

Missing paths resolve to `null`. For `ADD`, `MUL` and `CLAMP`, a missing,
`null` or non-numeric operand yields a null expression result. `COALESCE`
replaces only missing/null values; it does not coerce strings or booleans into
numbers. If the final numeric-expression result is null or non-numeric, the
runtime MUST skip that assigned key for that target, preserving its existing
value or absence; other valid assignments still apply. This differs from a
literal `null` assignment (§58.3).

Wrong function arity, unsupported functions and invalid expression references
are errors, not skipped keys. All supplied numeric values and evaluated numeric
results MUST obey §9.3: overflow, a non-finite result, an unsafe integral result
or nonzero underflow MUST fail the transaction rather than store a rounded
counter or silently skip an update. Invalid CLAMP bounds likewise fail. Schema
validation applies to the resulting state, including values produced by an
expression.

---

## 59.1 Mnemonic decay

Memory metabolism MAY lower `memory_strength`; it MUST NOT periodically decay Assertion confidence merely because time passed. Temporal relevance belongs in Projection.

Decay is computed, not written. With the Cognitive Memory Profile, `MnemonicState.memory_strength` is the last explicitly written base, `last_metabolized_at` its anchor and `strength_policy` a pinned policy artifact — the standard one is the half-life policy `kip:strength-half-life-30d` (`profiles/policy-strength-half-life-30d.json`); the read-only virtual member `effective_strength` is computed from them when a read is evaluated (Profile §6.1, §18). A read never writes it back. When the base, anchor or policy is missing, effective strength is `null` — unknown — and a runtime or Brain MUST NOT substitute a default such as `0.5`. Idle memory therefore costs no writes, no Change Envelopes and no invalidations.

Reinforcement is an explicit mutation that writes a new base and anchor:

```prolog
UPDATE ?memory
SET FACET "MnemonicState" {
  memory_strength: :reinforced_strength,
  last_metabolized_at: :cycle_start
}
WHERE {
  ?memory {id: :memory_id}
}
EXPECT VERSION :version OF FACET "MnemonicState"
```

`:reinforced_strength` is computed by the Brain from the current effective strength and its policy. Use signals come from explicit decision records and the exposure log (§66.8), folded in by Maintenance in bounded batches (§52.7), never from a read writing back. A compaction MAY rewrite a base and anchor to an equivalent pair; it MUST NOT change the effective strength it replaces.

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

## 60.7 Semantic erasure

Payload purge is not semantic forgetting. A user-level forgetting operation that must remove what the Brain learned from a source — not only the source bytes — runs an **ErasurePlan** (`schemas/kip-cognitive-records.schema.json`) under `purge` authority. The plan states its scope (`payload_only` or `semantic`), basis and matched source events, and enumerates the retained semantic copies, dependent summaries, replay artifacts, indexes and caches, runtime-held blobs and controlled backup copies in scope, together with holds, unavailable surfaces and prior external exports. A derived copy MAY need redaction or replacement rather than deletion of an unrelated whole record. Every step keeps enough non-content audit to prove what was done where policy allows.

The executor revalidates authorization, holds and closure against concurrent writes, checkpoints bounded batches, invalidates materializations and verifies every in-scope controlled surface. Its outcome is `completed`, `partial` or `blocked`, with a coverage manifest and receipts; `completed` is forbidden while any in-scope controlled copy, pending backup erasure or unprocessed dependency remains. Erasure never claims to recall prior external exports (§60.6). Re-ingestion of an erased source event is prevented within the stated retention policy by a non-content source-event tombstone; a new authorized observation is a separate policy decision. A replay whose inputs were erased reports them unavailable and never fabricates a successful recomputation.

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

Each endpoint MUST resolve to exactly one visible Concept in the same Space. An empty endpoint selection fails `NotFoundOrNotVisible`; an ambiguous selection fails `IdentityMergeConflict` rather than merging an arbitrary pair. The endpoints must satisfy Schema identity compatibility (§20.14); matching display names or type strings alone is not sufficient. The operation requires `merge_identity` authority, not merely generic `update` (§28.5).

The identity transition is atomic. Merging a Concept into itself has no effect. Repeating a completed merge to the same canonical target SHOULD return `no_effect` or an explicit already-merged diagnostic without a new durable change; a source already redirected to an incompatible target fails `IdentityMergeConflict`. Cycle prevention (§11.1) and identity-repair requirements (§11.5) still apply.

The merge preserves source identity, raw Proposition/Assertion references, and history (§11). It does not implicitly shallow-merge attributes, union aliases, or collapse actors' Assertions. Any desired mutable-field consolidation must be stated separately in legal KML and satisfy its Schema and version preconditions. A result summary SHOULD identify the source, canonical target, and redirect/collision effects; it MUST NOT report v1-style destructive link rewriting or source deletion as native merge behavior.

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
    inputs name the cognition applied — the exact Skill revisions, the memories the
    briefing drew on, the trigger — and whose Facet records the decision

    + action_attempt Activity / AttemptRecord and durable dispatch intent

external runtime
    revalidates authority, revision, dependency basis and lease fence
    performs/reconciles action using the same attempt_id

Transaction 2
    Outcome Evidence
    + the observation Activity linking it to the decision (§15.7)
    + Experience
```

The returning half of this pattern is the consequence channel: the external result comes back as Outcome Evidence (§15.7), written by instrumentation rather than by the actor whose action it grades, and linked to the decision it observed so that the consequence can be attributed to the cognition that produced it. Without the first transaction there is nothing for the outcome to grade.

---

How a durable runtime persists the dispatch intent, fences takeover and reconciles an outcome it never saw is execution machinery, not memory state: a runtime claiming `durable_brain_runtime` MUST follow the [Brain Runtime companion](./brain/KIP-2.0-Brain-Runtime.md). An external system without idempotency or outcome lookup never acquires an exactly-once guarantee from KIP.

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

Each output is a dependent of `X` at distance 1; traversal repeats from each dependent up to `DEPTH` (default 1). Activity provenance is the one authority for derivation lineage: lineage fields a Profile exposes (the Cognitive Memory Profile's `derived_from`, `compiled_from`, `compiled_by`, `consolidated_to`) are read-only views over it, so traversing Activity topology already covers them.

A result row SHOULD carry the dependent's exact id, kind, distance, and the Activity through which it was reached.

Rules:

- `LIST DEPENDENTS` is a read; it MUST NOT change any element.
- Governance applies per row: an element the caller may not discover is omitted, and omission is indistinguishable from absence (§30.4). Traversal does not pass through an element the caller may not discover. `truncated` describes only incomplete traversal of the authorized visible graph (such as a page/depth/resource bound); its value MUST NOT depend on whether an undiscoverable element exists. Results identify `coverage_scope: "authorized_view"`. This is not a global-closure attestation. Global review/erasure requires a separately authorized internal traversal; callers without that authority receive the same scope limitation whether or not hidden dependents exist.
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
  [MODE "keyword" | "semantic" | "hybrid" | :mode]
  [THRESHOLD :threshold]
  [AS OF SEQ :seq]
  [LIMIT :limit]
  [CURSOR :cursor]
```

`AS OF SEQ` is historical search: a runtime that cannot serve a historically
correct index MUST reject it (`HistoricalSearchUnavailable`) rather than
silently search present state; it is a capability, not baseline.

The same retrieval is available inside a KQL query as a Search Pattern (§43.8), so that associative retrieval, structural filtering and belief projection run in one read against one snapshot. The META statement remains the grounding form that pages a hit list with `CURSOR`.

`WITH TYPE` filters by a resolved Schema type; `WITH PREDICATE` filters by a resolved Predicate. Symbol resolution follows the active Schema Environment (§20), including ambiguity errors. A modifier MUST be meaningful for the selected kind; an unsupported combination MUST be rejected rather than ignored. In particular, the v1 spelling `SEARCH PROPOSITION ... WITH TYPE "predicate"` is a compatibility-layer convention: native v2 uses `WITH PREDICATE` for that filter and MUST NOT silently reinterpret a type as a Predicate.

---

## 66.2 Searchable kinds

Recommended:

```text
CONCEPT
PROPOSITION
ASSERTION
EVIDENCE
ACTIVITY
```

A search names one kind. A result that must span kinds issues one search per kind, or one Search Pattern per kind inside a `UNION` (§44.5), so every hit keeps a declared kind and grounding fields.

---

## 66.3 Modes

```text
keyword
semantic
hybrid
```

`keyword` matches indexed grounding text. It is the portable baseline required by KIP-META conformance (§98). `semantic` retrieves by meaning; `hybrid` combines lexical and semantic retrieval. Embedding generation and ranking algorithms are implementation-defined; an Agent supplies text and need not supply embeddings.

Semantic/hybrid are capability-dependent (§67.4). An explicitly requested mode that the runtime does not support fails `SearchModeUnsupported`; an unavailable index fails `SearchIndexUnavailable`. Native v2 MUST NOT silently substitute keyword retrieval for an explicitly requested semantic/hybrid mode. A failed capability requirement in the request envelope still uses `UnsupportedCapability` (§67).

If `MODE` is omitted, the runtime uses its documented default. It SHOULD disclose that default through META and MUST report the mode actually used in the search result/context. Clients requiring a particular mode name it explicitly; the v1 hybrid-when-available default and silent fallback are not implicit native v2 rules.

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

Concept grounding MUST include visible `name` and `aliases` text (§10.2); Schema-defined descriptions and other salient text SHOULD also be indexed, with the participating fields documented. Proposition grounding SHOULD include the Predicate's visible name/description. Search over other kinds MUST document its grounding fields. These fields assist discovery; none makes a display name an identity selector.

`retrieval.score` is a transient normalized relevance value in `[0, 1]`, with higher values more relevant. It MUST NOT be persisted into the element, `_system`, a Facet, or Assertion confidence. A raw index score on a different scale must be normalized for this field; its normalization/ranking semantics SHOULD be disclosed (§66.5). Scores are not assumed comparable across queries, modes, or implementations.

`THRESHOLD` accepts a number in `[0, 1]`, including when supplied as a parameter, and retains hits whose `retrieval.score >= threshold`. Results MUST be returned in descending score order, with threshold filtering before the `LIMIT` page cap. Equal-score ties MUST be resolved consistently within one cursor traversal so pagination neither skips nor repeats a hit. An omitted threshold imposes no additional score cutoff.

Search permissions apply to candidates before visible ranking (§29.3, §88.5); hidden candidates MUST NOT influence disclosed scores, snippets, or order. A search miss is an empty hit collection, subject to the freshness limitation below.

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

## 66.8 Exposure log

A read never reinforces memory (§2.13). A Brain still needs to know what it has retrieved and used, because use is the strongest signal that a memory should stay accessible. Writing a cognitive mutation for every read would turn recall into a write path; keeping the signal outside the protocol leaves every Brain to invent its own ledger.

A runtime advertising `exposure_log` (§67.4) keeps an **exposure log**: an append-only record of `ExposureRecord` entries (`schemas/kip-cognitive-records.schema.json`), each naming a Space, an element, the exposure kind (`retrieved` or `used`), the read's snapshot sequence, the recording time and origin, and optionally the decision that used it. Rules:

```text
not cognitive state   no Cognitive Element, no space_seq, no Change Envelope entry
never evidence        never cited as Evidence, never corroboration, never confidence
governed              read only under read_audit; per-element existence protection applies
bounded               subject to retention, and to semantic erasure plans (§60.7)
append-only           entries are never rewritten; a host records them explicitly
```

The host or Memory Interface Adapter records `retrieved` for items it returned and `used` for the `used_refs` of a DecisionRecord (Profile §6.4). Maintenance reads the log in bounded batches and writes reinforcement explicitly (§59.1). Use reaches `memory_strength` or `utility` through two explicit channels only — a DecisionRecord's `used_refs` and this log — and a runtime MUST NOT derive either from reads it did not log; a Brain without the log still reinforces explicitly from what its own decisions record.

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

`DESCRIBE CAPABILITIES` reports, and a request's `requires` (§71) names, entries of this registry. A capability is a feature a conforming runtime MAY leave out; everything a conformance level requires (§89) is not a capability and is not listed here. A runtime MAY add entries of its own — engine-local names, reported beside these, that another engine answers `UnsupportedCapability` to (§67.1) — but it MUST NOT rename or redefine these:

```text
serializable_isolation      §32.2
atomic_batch                §75.3   several operations in one Transaction
idempotency_retention       §34.5   value: the retention window, e.g. {"seconds": 86400}
historical_reads            §48, §100
historical_search           §66.1, §43.8
semantic_search             §66.3
hybrid_search               §66.3
search_index_freshness      §66.5   value: the index consistency, e.g. {"mode": "synchronous"}
weighted_projection         §22, §27.3   trust-weighted policies beyond §21.10 and §21.13
signed_receipts             §33.3
streaming                   §84
artifacts                   §85
change_stream               §36, §68
filtered_delivery           §36.3
watch_evaluation            runtime-evaluated Watch conditions (Cognitive Memory Profile §5.11)
exposure_log                §66.8
draft_vocabulary            §20.16   DEFINE and the propose_schema permission
identity_repair             §11.5
recording_repair            §57.8   optional for KIP-Core; required by KIP-CognitiveMemory (§89)
derive_permission           §29.6
record_outcome_permission   §29.8
capsule_export              §63.4
capsule_import              §39
capsule_signatures          §37.8
kip1_migration              §103    KIP 1.x compatibility and `DESCRIBE COMPATIBILITY`
memory_interface            Memory Interface binding; levels: profiles/memory-bundles.json
durable_brain_runtime       Brain Runtime companion (brain/KIP-2.0-Brain-Runtime.md)
receiver_fencing            Brain Runtime companion §4
prospective_trials          Validated Learning companion (brain/KIP-2.0-Validated-Learning.md) §5
```

A `requires` entry that names a capability the runtime does not recognize — neither this registry nor one of its own — fails `UnsupportedCapability`, exactly as one the runtime does not support.

Features that earlier drafts listed here are now requirements of a level: `belief_slot`, `ingestion_context`, `list_dependents` and `payload_purge` belong to KIP-Core; dependency validity and computed mnemonic strength belong to KIP-CognitiveMemory; `materialized_projection` is the disclosure rule of §21.9, binding on any runtime that serves a cached projection. A runtime MAY keep reporting those names as engine-local entries; a request that requires one of them is satisfied by any runtime that claims the corresponding level.

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

The request option `options.dry_run: true` selects validation/preview behavior under this section. It MUST NOT establish a durable cognitive commit, reserve identities, or authorize a later commit. A runtime that cannot honor a dry run MUST reject it explicitly rather than execute the mutations. A later real execution revalidates current state, preconditions, and Governance.

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

Duplicate decoded JSON object keys and unpaired Unicode surrogates MUST be rejected. Numeric source tokens MUST be validated under §9.3 before binding. `parseCanonicalJson` in the language toolkit is a reference strict decoder; UTF-8 decoding must also reject invalid bytes.

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
        "observed_at": "2026-08-14T01:00:00.000Z",
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

The request-level `parameters` object supplies shared defaults. An operation's own `parameters` overrides those defaults by a key-by-key shallow merge: an omitted key inherits the shared value; a supplied key replaces the entire value, including an object, array, or explicit `null`. Parameter names are case-sensitive and are written without the leading `:` in either object. The resulting bindings belong to that operation; its local variables/handles and results do not automatically become parameters of later operations, even in `sequence` or `atomic` mode. Evidence references supplied by ingestion follow §71.1.

A placeholder inside a quoted string is ordinary string content, not a substitution site: `"Hello :name"` remains that literal text. Parameters cannot inject a keyword, clause, variable name, or part of a string. They may supply a Schema symbol only in a grammar position that accepts a parameter, after which ordinary Schema resolution still applies.

Every referenced parameter MUST be present in the effective bindings before that operation executes; absence is a `ReferenceError`, not an implicit `null`. Explicit `null` remains a value and is legal only where the receiving position permits it. Bound values MUST satisfy the same type, numeric range, reference, and Schema constraints as literal values at that position (§9); structural binding is not a way to bypass validation. Extra unused parameters MAY be ignored.

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

## 81.1 Operation results and pagination

The `results` array correlates operation outcomes with the submitted operations, preserving request order even when execution is `independent`. A supplied `op_id` is echoed on its result. The operation's `result` is the command payload; it is separate from that operation's `error`, `context`, `receipt`, and `next_cursor`. A successful collection read with no result items MUST return an empty collection rather than a missing result or a not-found error; aggregate-only queries still return their aggregate result (§44.6). An exact `DESCRIBE`/reference lookup can instead fail `NotFoundOrNotVisible` under its own contract.

The response schema deliberately leaves `result` open. A transport binding MUST document its command result layouts; it SHOULD use the following distinctions:

| Command family | Result content |
| --- | --- |
| `FIND` | Ordered projections of the solution set. A binding declares whether it encodes rows or columns, preserves `FIND` expression order, and preserves null cells for unbound optional/branch variables. Grouping and aggregate-only queries follow §44.6; a bare element variable projects its authorized element view, while `BELIEF` values use the Projection contract (§27). |
| `DESCRIBE` | A single structured description of the requested subject, including resolved Schema identities where applicable (§65). |
| `LIST`, `HISTORY`, `CHANGES` | A collection of items/records for the selected family, with its own context and continuation. Change Envelopes retain transaction boundaries (§36). |
| `SEARCH` | A ranked collection of exact-identity hits carrying the retrieval information of §66. |
| `EXPORT CAPSULE` | A Capsule artifact or its Artifact descriptor/handle (§63.4, §85), rather than a v1 `UPSERT` script. |
| KML | A structured operation summary identifying affected elements/counts where useful; durable outcome is established by the appropriate Transaction Receipt, not by a success-shaped summary alone. |
| `VERIFY`, `VALIDATE`, `PREVIEW` | Structured verification, validation, or predicted-effect information under §69; none is a commit Receipt. |

KIP 1's single-expression unwrapping, columnar `FIND` layout, and command-specific mutation counters are compatibility binding choices, not implied by the native `results[]` envelope. A compatibility adapter MUST translate them explicitly rather than make a client guess from the number of expressions or operations.

For a paginated operation, its `next_cursor` belongs in that operation's result envelope; its presence means more results may be available, and absence means the reported traversal has no continuation. It is an opaque family-specific continuation (§44.8, §87.7), not a row value or offset. A cursor cannot be reused for another operation family or for changed query parameters. A top-level cursor, where a binding uses one, MUST unambiguously identify the single traversal it continues; it cannot stand for several paginated operations at once.

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
SchemaSymbolConflict
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

An implementation claims a **conformance level**, never a subset of one:

```text
KIP-Core               every requirement of §90–§99: data model, Schema, the structural
                       baseline and kip:memory-default policies, Governance, Transactions,
                       KQL (including BELIEF SLOT and the Search Pattern), KML, META
                       (including keyword SEARCH, LIST DEPENDENTS and PURGE PAYLOAD) and
                       the Runtime (including the ingestion context)
KIP-CognitiveMemory    KIP-Core plus the standard Profile package, dependency validity
                       (§57.6), computed mnemonic strength (Profile §18), recording
                       repair (§57.8) and the Profile invariants
                       (KIP-2.0-Invariants.md Part B)
```

The areas `KIP-Schema`, `KIP-Epistemic`, `KIP-Governance`, `KIP-Transactions`, `KIP-KQL`, `KIP-KML`, `KIP-META` and `KIP-Runtime` partition the KIP-Core requirements for test selection and diagnosis. Each area's section lists what KIP-Core requires of it; features that are capabilities (§67.4) are named there only as such. A conformance report MAY list per-area results; passing an area claims nothing by itself.

Everything else is a capability (§67.4), advertised and measured only where advertised: Capsule support (§95), historical reads (§100), high-assurance hardening (§101), KIP 1.x migration (§103), and the optional features of the registry. The Memory Interface binding has its own levels (companion §2) — `memory_basic`, `memory_experience` and `memory_learning` — which a Brain claims on top of the Nexus level it runs on; durable workers and Capsule exchange are capabilities a binding advertises, not levels. The Brain Runtime and Validated Learning companions define capabilities, not levels.

A runtime MUST NOT claim a level on the strength of model or reference-oracle results; a claim rests on the executable engine suite (`conformance/engine-suite/`) and the applicable vectors run against the engine itself.

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

Requires:

```text
support/reject/uncertain stances
Assertion lifecycle, with expired computed (§14.3)
open-world insufficient
accepted/rejected/contested/uncertain/insufficient (+ leading)
structural projection baseline (§21.10) and kip:memory-default (§21.13)
final belief with slot conflicts (§21.11) and the complete ProjectionBasis (§21.12)
context matching (§25.3)
temporal succession and time bounds (§25.4, §25.5)
direct same-Proposition conflict
functional, functional_by and exclusive conflict support
hypothetical/predicted/imported distinctions
no evidence multiplication
auditable Projection policy identity
```

Trust-weighted policies and trust calibration are the `weighted_projection` capability (§67.4).

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
Concept, Proposition, Assertion, Evidence and Activity patterns
Structural pattern
BELIEF and BELIEF SLOT
Search Pattern (§43.8)
FILTER
NOT
OPTIONAL
UNION
aggregation
ORDER BY
LIMIT
CURSOR
FOR TIME
WITH EPISTEMIC, including the explanation levels and the ledger (§49)
exact Schema refs
Governance filtering
snapshot context and the ProjectionBasis (§50)
```

Supporting the clause names alone is insufficient: conformance includes the solution-processing rules (§42.5), variable visibility and nested-block semantics (§42.4, §44.3–§44.5), null/empty-group behavior (§44.1–§44.6), and stable ordering/pagination (§44.7–§44.8). The corresponding KQL vectors exercise these boundaries as well as authorized visibility.

Capabilities, measured only where advertised (§67.4): `AS OF SEQ` (`historical_reads`), a Search Pattern under `AS OF SEQ` (`historical_search`), and raw path operators (§45), whose support and limits an implementation declares.

---

# 97. KIP-KML Conformance

Requires:

```text
MUTATE (atomic coherent formation) with forward local refs
ASSERT sugar (normative desugaring)
Concept create/upsert
ENSURE Proposition
Evidence, Assertion and Activity create
Facets and Structural mutation
immutable-field enforcement
safe UPDATE (§58)
TRANSITION: Assertion lifecycle, Evidence correction, Activity states, archive and tombstone
SET RETENTION
PURGE and PURGE PAYLOAD
MERGE CONCEPT (non-destructive)
EXPECT VERSION, including version planes
idempotency integration
Governance/Schema validation
```

Capabilities, measured only where advertised (§67.4): `DEFINE` (`draft_vocabulary`); the update expressions of §59 are optional and, where supported, follow that section.

---

# 98. KIP-META Conformance

Requires:

```text
DESCRIBE PRIMER, PROTOCOL, CAPABILITIES, SPACE, ACCESS, ERROR
DESCRIBE TRANSACTION and SNAPSHOT (§68)
Schema introspection (§65) and DESCRIBE EPISTEMIC POLICY
LIST DEPENDENTS (§63.5)
SEARCH keyword
VERIFY RECEIPT and SCHEMA PACKAGE; VALIDATE KQL, KML and SCHEMA PACKAGE
Governance-filtered introspection
structured error hints
```

Capabilities, measured only where advertised (§67.4): semantic/hybrid SEARCH, historical search, `HISTORY` and `CHANGES` (`change_stream`), Capsule description, verification, validation, preview and export (`capsule_export`, `capsule_import`), `DESCRIBE COMPATIBILITY` (`kip1_migration`) and `DESCRIBE TRUST` (`weighted_projection`).

---

# 99. KIP-Runtime Conformance

Requires:

```text
protocol version
request/response envelope
structural parameters
Space resolution
authenticated Principal context
single-operation execution; independent and sequence modes
readonly execution path (§76)
idempotency and Receipts
transaction lookup by id and by idempotency key (§68, §80.4)
outcome_unknown and recovery (§80)
ingestion context (§71.1)
stable error model
```

Capabilities, measured only where advertised (§67.4): `atomic` mode (`atomic_batch`), streaming, artifact handles, signed receipts and filtered delivery; snapshot tokens (§78) are optional.

---

# 100. Historical Reads

See [KIP-2.0-Optional-Profiles-and-Migration.md](./KIP-2.0-Optional-Profiles-and-Migration.md), §100. Historical reads are the `historical_reads` capability (§67.4): an implementation that advertises retention beyond the current head is measured against it, and one that does not is not.

---

# 101. High-Assurance Hardening

See the same companion, §101. Its requirements are additive hardening over a conforming implementation, never a relaxation of the Core; the ones a client can rely on are advertised as capabilities (`signed_receipts`, `capsule_signatures`, `serializable_isolation`, §67.4).

---

# 102. Required Conformance Invariants

A conforming native KIP 2.0 implementation MUST preserve the 49 cross-cutting invariants registered as Part A of [KIP-2.0-Invariants.md](./KIP-2.0-Invariants.md), the single registry this Specification and the Cognitive Memory Profile share. The registry keeps this section's numbering — `§102 invariant 17` is registry row 17 — and names, for each invariant, the section that establishes it and the conformance vectors that pin it (conformance §27). The Profile's own invariants are Part B of the same registry (Profile §23).

---

# 103. KIP 1.x Migration

See [KIP-2.0-Optional-Profiles-and-Migration.md](./KIP-2.0-Optional-Profiles-and-Migration.md), §103, together with the operational guide [migration/KIP-2.0-Migration-from-1.x.md](./migration/KIP-2.0-Migration-from-1.x.md). KIP 1.x is a compatibility and migration source, not a definition of KIP 2.0 semantics. Migration support is the `kip1_migration` capability (§67.4); `DESCRIBE COMPATIBILITY` (§63.3) is answerable only where it is advertised.

---

# 104. Model-First Primer

Business Agents using the optional Memory Interface need only the compact
[Agent card](./brain/MemoryInterface.md). Direct KIP callers may load the
[Recall](./brain/KIPRecall.md), [Formation](./brain/KIPFormation.md) or
[Maintenance](./brain/KIPMaintenance.md) card as needed. The complete syntax
reference remains available for uncommon operations and engine authors.

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
    | search_pattern
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

search_pattern :=
    variable "SEARCH" search_kind value
    ("WITH TYPE" value)? ("WITH PREDICATE" value)?
    ("MODE" value)? ("THRESHOLD" value)?
    limit_clause
        (* required LIMIT bounds the candidates; never inside NOT (§43.8) *)

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
    | define_statement

mutate_statement :=
    "MUTATE" "{"
      mutation_clause*
    "}"
    (* mutation_clause: any kml_statement except mutate_statement
       and define_statement *)

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

define_statement :=
    "DEFINE" ("PREDICATE" | "CONCEPT TYPE") symbol object_literal
        (* standalone only: commits alone (§20.16) *)
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
        "observed_at": "2026-08-14T01:00:00.000Z",
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
    "committed_at": "2026-08-14T03:00:00.000Z"
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

Here `:time` is the correction time and `:corrected_valid_time` is the preserved interval under §14.2, including `{latest: <original asserted_at>}` when the original had no start.

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
      asserted_at: :time,
      valid_time: :corrected_valid_time
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

**Change — the world moved.** Alice lived in `+08:00` and moved to `+01:00` on `:moved_at`. Her earlier claim was true for its time, so nothing is superseded and nothing is re-asserted. One Assertion records the new value from the change; temporal succession (§25.4) ends the earlier open-ended claim at `:moved_at`, both stay `active`, and `FOR TIME` before `:moved_at` still answers `+08:00` (Appendix G.4):

```prolog
ASSERT (:alice, "timezone", "+01:00") {
  by: :alice,
  mode: "stated",
  valid: {from: :moved_at},
  evidence: :msg
}
```

When the date of the move is unknown, the host does not invent one. A present-tense statement ("I'm on +01:00 now") is written with no `from` at all: a missing start already means the value began no later than the claim (§25.2), succession places the change between Alice's two statements, and `FOR TIME` inside that window answers `uncertain`, which is what the Brain actually knows. What the write must carry is the time the claim was made, `at`, because that is its start key (§13.2, §25.4):

```prolog
ASSERT (:alice, "timezone", "+01:00") {
  by: :alice,
  mode: "stated",
  at: :stated_at,
  evidence: :msg
}
```

A bound is written when the host knows more than that — "some time this spring" is `valid: {from: {earliest: :spring_start, latest: :stated_at}}`.

**End — the value stopped with no successor.** Alice left Acme on `:left_at` and named no new employer. The same actor asserts the opposite stance on the same Proposition from that time; succession ends her open-ended support there:

```prolog
ASSERT (:alice, "works_for", :acme) {
  by: :alice,
  mode: "stated",
  stance: "reject",
  valid: {from: :left_at},
  evidence: :msg
}
```

Correction, change and end are three different histories (§14.2): only a correction supersedes, and neither a change nor an end records anyone as wrong. When Formation cannot tell a correction from a change, it records the new value as a change and discloses the ambiguity; it never supersedes on a guess.

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
decision (action_gate Activity: DecisionRecord and inputs name applied revisions)
    ↓
action_attempt Activity (AttemptRecord fixes attempt, revision and trial before dispatch)
    ↓
external action / trial run
    ↓
instrumentation (never the acting model)
    ↓
Outcome Evidence {OutcomeRecord: attempt_ref, task_family, outcome_status, metric, window, ...}
    + outcome_observation Activity {inputs: the attempt and decision, outputs: the outcome}
    ↓
deterministic verdict code aggregates independent attempts against the immutable TrialRecord basis
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
    ("inputs", :attempt)
    ("inputs", :decision)
    ("outputs", :outcome)
    ("associated_actors", :verifier)
  }
}
```

The verdict transaction and the rules it is validated against are in the [Validated Learning companion](./brain/KIP-2.0-Validated-Learning.md) §6. No unlinked result is automatically a baseline, and a rule name alone is not a replayable verdict.

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
