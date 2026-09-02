# KIP 2.0 Schema Packages

## Status

**Schema Package Model Proposal / Pre-Specification Draft**

> **Frozen (2026-09-02).** Historical design rationale written before the normative consolidation. This document is no longer maintained and its Chinese twin is no longer synchronized; where it differs from [KIP-2.0-SPECIFICATION.md](../KIP-2.0-SPECIFICATION.md), the Specification is right and this document is out of date.

This document defines the schema architecture of KIP 2.0: how semantic types, predicates, profile facets, structural fields, constraints, extension registries, compatibility, dependencies, migration declarations, and schema activation are packaged and resolved.

It builds directly on:

- [KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)
- [KIP-2.0-Epistemic-Model.md](KIP-2.0-Epistemic-Model.md)
- [KIP-2.0-Governance.md](KIP-2.0-Governance.md)

The KIP 2.0 Architecture requires Schema Packages to make schema portable, versionable, machine-validatable, and namespace-safe.

The Core Data Model requires every persisted:

```text
schema_ref
predicate_ref
facet namespace
```

to resolve deterministically.

The Epistemic Model depends on schema semantics for:

```text
functional predicates
cardinality
exclusive alternatives
conflict sets
value domains
context/temporal interpretation
```

Governance treats schema installation and upgrade as protected control-plane operations because schema changes can alter how memory is interpreted.

This document makes those requirements concrete.

Its central design principle is:

> **A Schema Package is immutable semantic code: a versioned, inspectable contract that defines how cognitive state is interpreted, validated, and related — without being executable application code.**

KIP 2.0 keeps the strongest idea from KIP 1.x:

> **The Nexus is self-describing and a model can discover its legal semantic vocabulary.**

But KIP 2.0 changes where schema authority lives.

In KIP 1.x, schema definitions are ordinary graph Concepts using `$ConceptType` and `$PropositionType`.

In KIP 2.0:

```text
Authoritative Schema
    = immutable versioned Package Artifact

Self-Describing Schema View
    = runtime projection of installed Package Artifacts
      into model-friendly introspection
```

This prevents an ordinary cognitive write from silently redefining what `Person`, `Skill`, `works_for`, or `confidence` means.

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** indicate requirements of the KIP 2.0 Specification (`../KIP-2.0-SPECIFICATION.md`), which is authoritative where the two differ.

Exact JSON field names and URI grammar are pre-specification but the semantic distinctions and invariants are intended to survive later syntax work.

---

# 1. Why Schema Is More Than Validation

In a real memory brain, schema determines more than whether a field is a string.

Schema can determine:

```text
what Concept Types exist
what Predicates mean
what Literal values are legal
which subjects/objects are legal
which relations are functional
which values are mutually exclusive
which claims can conflict
which structural fields form Experience traces
which Facets are legal
how a Profile extends Core
what a local name resolves to
what migration is required between versions
```

Therefore:

> **Schema is part of the cognitive semantics of the Brain.**

Changing schema can change what stored memory means even if no data bytes change.

That makes schema:

```text
semantic infrastructure
+
security-sensitive control state
```

not merely developer documentation.

---

# 2. Design Goals

KIP 2.0 Schema Packages SHOULD be:

```text
self-describing
versioned
immutable after publication
namespace-safe
dependency-aware
machine-validatable
LLM-readable
portable
hashable
optionally signed
migration-aware
governance-controlled
non-executable by default
backward-inspectable
compatible with multi-version historical memory
```

---

# 3. Non-Goals

Schema Packages are not:

```text
general-purpose code modules
arbitrary migration script containers
authorization policies
trust policies
query procedures
LLM prompts
tool plugins
package-manager post-install scripts
```

They may describe semantic contracts.

They MUST NOT acquire arbitrary execution authority merely because a Space activates them.

---

# 4. Package Artifact

A **Schema Package** is an immutable versioned artifact containing a manifest plus semantic definitions.

Logical structure:

```text
SchemaPackage
├ manifest
├ dependencies
├ definitions
│  ├ Concept Types
│  ├ Predicate Types
│  ├ Facet Definitions
│  ├ Structural Field Definitions
│  ├ Enum / Named Value Sets
│  └ Registry Extensions
├ constraints
├ aliases
├ compatibility declarations
├ migration descriptors
├ documentation / model hints
├ canonical digest
└ optional signatures
```

---

# 5. Authoritative Package vs. Cognitive Mirror

A Schema Package is authoritative schema state.

A Cognitive Nexus MAY expose a cognitive mirror such as:

```text
Concept:
    name = "Person"
    description = "A human person..."
```

for model reasoning.

But the mirror is informational.

Ordinary graph mutation of the mirror MUST NOT change the active Package Artifact.

---

# 6. Self-Description Without Self-Mutation

KIP 1.x achieves self-description by storing `$ConceptType` and `$PropositionType` as graph nodes.

KIP 2.0 preserves self-description through runtime introspection:

```text
DESCRIBE SCHEMA ENVIRONMENT
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE PACKAGE
```

or equivalent META operations.

The runtime can render Package definitions in:

```text
compact LLM primer
canonical machine form
human documentation
```

without making the type system ordinary mutable cognition.

---

# 7. Schema Package Identity

A package has two identities:

```text
package_id
version
```

Together they identify one immutable Package version.

Example:

```text
package_id = "kip://profiles/cognitive-memory"
version    = "2.0.0"
```

Canonical versioned package reference:

```text
kip://profiles/cognitive-memory@2.0.0
```

---

# 8. Proposed Canonical Reference Grammar

Illustrative grammar:

```text
kip://<package-path>@<exact-version>[/<symbol>]
```

Examples:

```text
kip://core@2.0.0
kip://core@2.0.0/Assertion

kip://profiles/cognitive-memory@2.0.0
kip://profiles/cognitive-memory@2.0.0/Experience
kip://profiles/cognitive-memory@2.0.0/has_step

kip://ldclabs/organization@1.3.0
kip://ldclabs/organization@1.3.0/Organization
kip://ldclabs/organization@1.3.0/works_for
```

The final lexical grammar will be specified formally later.

---

# 9. Package Path

The package path is a stable namespace-qualified name.

Examples:

```text
core
profiles/cognitive-memory
ldclabs/organization
acme/deployment-memory
```

Recommended syntax:

```text
lowercase
ASCII
segments separated by "/"
segment characters:
    a-z
    0-9
    "-"
```

Package path is case-sensitive but canonical packages SHOULD use lowercase.

---

# 10. Reserved Package Paths

KIP should reserve at least:

```text
kip://core
kip://profiles/*
```

for the KIP specification / standard profiles.

Third-party packages SHOULD use a publisher-controlled namespace:

```text
kip://ldclabs/*
kip://acme/*
```

The global namespace governance mechanism is outside this document.

A decentralized registry, DNS binding, repository trust, or implementation-specific registry could all host packages.

The canonical package identity does not itself prove publisher identity.

---

# 11. Version

KIP 2.0 SHOULD use Semantic Versioning-like triplets:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
2.3.1
```

Pre-release labels MAY be supported:

```text
2.0.0-rc.1
```

The exact parser will be normative later.

---

# 12. Version Meaning

Recommended intent:

```text
PATCH
    corrections that do not change valid instance semantics

MINOR
    backward-compatible additive semantic changes

MAJOR
    potentially incompatible semantic changes
```

However:

> **The version number is a publisher declaration, not proof of compatibility.**

KIP also defines explicit compatibility metadata and validation.

---

# 13. Exact-Version Persistence Rule

This is a core invariant.

Every persisted cognitive reference MUST resolve to an exact schema version.

Examples:

```text
schema_ref =
    kip://profiles/cognitive-memory@2.0.0/Experience

predicate_ref =
    kip://ldclabs/organization@1.3.0/works_for
```

Persisted elements MUST NOT store:

```text
@2
@2.x
@^2.0
@latest
```

as their authoritative schema reference.

---

# 14. Why Exact Versions Are Required

If an element stored:

```text
schema_ref = Person@latest
```

then:

```text
same bytes yesterday
same bytes today
```

could have different meaning after a registry update.

That would silently rewrite historical cognition.

Therefore:

> **Persistent cognition binds to immutable semantic definitions.**

---

# 15. Version Ranges Are Resolution Inputs Only

Version ranges MAY appear in:

```text
dependency declarations
installation requests
compatibility declarations
upgrade requests
```

Example:

```text
depends_on:
    kip://core >=2.0.0 <3.0.0
```

A resolver turns the range into an exact version.

The exact resolved version is then recorded in the Space Schema Environment / lock state.

---

# 16. Schema Symbol Identity

A symbol is identified by:

```text
package_id
exact version
local symbol name
symbol kind
```

Conceptually:

```text
SchemaSymbolRef =
    PackageRef + "/" + SymbolName
```

No symbol meaning exists outside its package/version lineage.

---

# 17. Symbol Kinds

Recommended Schema Package symbol kinds:

```text
ConceptType
PredicateType
FacetDefinition
StructuralFieldDefinition
EnumDefinition
RegistryExtension
```

Core built-in element kinds are not redefined by ordinary packages.

---

# 18. Local Symbol Names

Recommended conventions preserve KIP 1.x ergonomics:

```text
Concept Type:
    UpperCamelCase

Predicate:
    snake_case

Facet:
    UpperCamelCase or namespaced package facet root

Structural field:
    snake_case

Enum:
    UpperCamelCase

Enum value:
    snake_case or declared canonical string
```

---

# 19. Fully Qualified vs. Local Names

Canonical machine state uses fully qualified exact references.

Model-facing KQL/KML MAY allow:

```text
Person
works_for
Experience
has_step
```

as local aliases inside a resolved Schema Environment.

This is sugar.

The engine MUST resolve every local name deterministically before execution.

---

# 20. Ambiguous Local Names

Suppose a Space installs:

```text
kip://profiles/cognitive-memory@2.0.0/Person
kip://acme/hr@1.0.0/Person
```

Then:

```text
Person
```

is ambiguous unless the Schema Environment defines an explicit alias/import preference.

The runtime MUST NOT guess.

It should require:

```text
qualified reference
or
explicit alias
```

---

# 21. Aliases

A Schema Environment or Package MAY define model-friendly aliases.

Example:

```text
CM.Person
HR.Person
```

or:

```text
cognitive:Person
hr:Person
```

Exact surface syntax is deferred.

Aliases are resolution aids.

They do not change canonical identity.

---

# 22. Alias Safety

An alias MUST resolve to exactly one exact symbol in one execution context.

Alias changes are Schema Environment changes and SHOULD be versioned/audited.

Historical persisted elements remain unaffected because they store exact refs.

---

# 23. Schema Environment

A **Schema Environment** is the exact set of package versions and symbol aliases active in a MemorySpace.

It answers:

```text
Which packages are available?
Which exact versions?
Which versions are accepted for reads?
Which versions are defaults for new writes?
Which aliases resolve where?
Which packages are deprecated?
Which packages are blocked?
```

---

# 24. Schema Environment Is Governance State

Schema Environment belongs to the protected Governance Control Plane.

Ordinary cognitive writes cannot:

```text
install package
activate package
change alias resolution
change default write version
remove historical schema
```

---

# 25. Schema Lock

A Space SHOULD maintain an exact **Schema Lock**.

Illustrative:

```json
{
  "environment_id": "schema-env-17",
  "version": 9,

  "packages": {
    "kip://core": "2.0.0",
    "kip://profiles/cognitive-memory": "2.1.0",
    "kip://ldclabs/organization": "1.3.2"
  },

  "write_defaults": {
    "kip://profiles/cognitive-memory": "2.1.0"
  }
}
```

Dependencies are also resolved exactly.

---

# 26. Reproducibility

Given:

```text
Schema Lock
+
canonical Package Artifacts
+
cognitive data
```

an implementation should be able to reconstruct the same declared semantic contracts.

This is essential for:

```text
audit
Capsule validation
historical projection
migration
cross-engine conformance
```

---

# 27. Package Manifest

Recommended manifest:

```json
{
  "package_id": "kip://ldclabs/organization",
  "version": "1.3.0",

  "name": "Organization",
  "description": "Organization collaboration schema for KIP.",

  "kip": {
    "requires": ">=2.0.0 <3.0.0"
  },

  "dependencies": [],

  "compatibility": {
    "previous": "1.2.0",
    "classification": "backward_compatible"
  },

  "publisher": {
    "id": "optional-publisher-identity"
  },

  "digest": "sha256:...",

  "signatures": []
}
```

Publisher/signature structure is finalized with Capsule/integrity work.

---

# 28. Package Immutability

Once a package version is published/installed as an immutable artifact:

```text
same package_id + version
```

MUST always identify the same canonical content digest.

A publisher MUST NOT replace:

```text
1.3.0
```

with different semantics.

Corrections require a new version.

---

# 29. Package Digest

Every canonical Package Artifact SHOULD have a content digest.

A package registry/resolver MUST reject:

```text
same package_id + version
different digest
```

as an integrity conflict.

---

# 30. Signatures

A package MAY be signed.

Signature can establish:

```text
integrity
publisher-key binding
```

It does not establish:

```text
semantic correctness
safety
compatibility
Governance approval
```

Installation remains locally governed.

---

# 31. Draft Packages

Development tooling MAY support mutable draft schemas.

Draft identity SHOULD be clearly non-canonical, for example:

```text
workspace-local package
or
pre-release version
```

Production persisted cognition SHOULD NOT bind to silently mutable schema definitions.

---

# 32. Concept Type Definition

A `ConceptType` defines the contract for one class of Concept.

Illustrative:

```json
{
  "kind": "ConceptType",
  "name": "Person",

  "description": "A human person.",

  "attributes": {
    "display_name": {
      "value_type": "string",
      "required": false
    }
  },

  "structural_fields": {},

  "facets_allowed": [],

  "identity": {
    "key_supported": true,
    "canonical_id_supported": true
  },

  "model_hints": {
    "summary": "Use Person for human individuals."
  }
}
```

---

# 33. Concept Type Does Not Define Truth

A Concept Type says:

```text
this kind of semantic resource may exist
```

It does not assert that any particular instance exists in the world.

Epistemic existence claims remain Proposition + Assertion when needed.

---

# 34. Concept Attributes

Attribute definitions SHOULD specify:

```text
value type
required/optional
nullable
default if any
validation constraints
mutability
documentation
```

Attributes are for representation-local state, consistent with the Core Data Model.

---

# 35. Attribute Validation Types

Recommended primitive validation types:

```text
string
number
integer
boolean
null
datetime
date
duration
uri
json_scalar
json_object
json_array
```

Complex object schemas MAY be supported in a constrained declarative form.

This document does not require JSON Schema compatibility.

---

# 36. Required Attributes

KIP 1.x treated required instance attributes partly as best-practice guidance depending on engine strictness.

KIP 2.0 changes this.

If a Package declares:

```text
required = true
```

a conforming strict schema validator MUST enforce it for writes claiming that exact schema version.

Schema constraints become machine-verifiable contracts.

---

# 37. Unknown Attributes

A Concept Type SHOULD declare its openness:

```text
attributes_open = true | false
```

If `false`:

```text
unknown attributes → validation error
```

If `true`:

```text
additional attributes permitted
```

Profile authors should use openness deliberately.

---

# 38. Attribute Epistemic Boundary

Schema MUST NOT encourage factual state requiring independent:

```text
confidence
source
validity
contradiction
Evidence
policy
```

to be trapped in attributes.

A model hint MAY explicitly identify:

```text
promote_to_proposition_when_epistemic = true
```

for common fields.

---

# 39. Mutability

Attributes MAY declare:

```text
mutable
immutable_after_create
engine_managed
governance_managed
```

A Schema Package cannot grant permission to mutate governance-managed fields.

Governance remains authoritative.

---

# 40. Defaults

Schema defaults are dangerous if they imply world facts.

Safe default:

```text
display_order = 0
```

Potentially unsafe default:

```text
employment_status = "active"
```

A default is inserted without Evidence.

Therefore Package authors SHOULD avoid semantic factual defaults unless the value truly means representation default rather than a claim about the world.

---

# 41. Predicate Type Definition

A `PredicateType` defines the semantic contract of a Proposition predicate.

Illustrative:

```json
{
  "kind": "PredicateType",
  "name": "works_for",

  "description": "Relates a person to an organization for a declared context.",

  "subject": {
    "concept_types": [
      "kip://profiles/cognitive-memory@2.0.0/Person"
    ]
  },

  "object": {
    "concept_types": [
      "kip://ldclabs/organization@1.3.0/Organization"
    ],
    "literal_types": []
  },

  "semantics": {
    "cardinality": {
      "max_per_subject": null
    },
    "functional": false
  }
}
```

---

# 42. Predicate Subject Constraints

A Predicate MAY constrain subjects by:

```text
Core element kind
Concept Type
package/type family
```

Example:

```text
Person ─ works_for → Organization
```

Core still permits Propositions over any Cognitive Element where schema allows it.

---

# 43. Predicate Object Constraints

Objects MAY allow:

```text
Concept Type(s)
other Cognitive Element kinds
Literal datatype(s)
```

Example:

```text
Person ─ timezone → string
```

---

# 44. Predicate Literal Constraints

For Literal objects, Predicate schema may define:

```text
datatype
enum
minimum/maximum
pattern
language requirement
unit/value domain
```

Exact constraint syntax is deferred.

---

# 45. Functional Predicate

A Predicate may declare:

```text
functional = true
```

meaning:

> Under the declared conflict scope, a subject should not simultaneously have multiple accepted values for this Predicate.

This does not prevent multiple conflicting Propositions from being stored.

It informs:

```text
validation where appropriate
Epistemic Conflict Sets
Projection
maintenance diagnostics
```

---

# 46. Functional Does Not Mean Storage Uniqueness

Example:

```text
(Alice, timezone, "+08:00")
(Alice, timezone, "+01:00")
```

must both be storable because they may represent:

```text
different times
different Assertions
conflict
historical evolution
```

Functional semantics belong to epistemic interpretation, not raw Proposition rejection.

---

# 47. Predicate Cardinality

Possible declarations:

```text
min_per_subject
max_per_subject
min_per_object
max_per_object
```

Cardinality constraints MUST declare whether they are:

```text
structural
epistemic
```

---

# 48. Structural vs. Epistemic Cardinality

Structural cardinality may reject invalid record topology.

Epistemic cardinality defines a Conflict Set but does not prevent conflicting claims from coexisting.

Example:

```text
person primary_timezone max accepted values = 1
```

should not make contradictory imported evidence impossible to store.

---

# 49. Exclusive Values

A Predicate may declare mutually exclusive literal alternatives.

Example:

```text
status:
    active
    archived
    deleted
```

If exclusive under overlapping context/time, support for multiple values creates epistemic conflict.

---

# 50. Closed Value Set

A Predicate MAY declare an enum as a closed value set.

This is a semantic validation rule.

It is not automatically a closed-world epistemic assumption.

Those are different.

---

# 51. Closed-World Hint

A Predicate/Profile MAY declare that specific authoritative snapshots can support closed-world reasoning.

This MUST be explicit and SHOULD reference the Evidence/Projection context.

Schema alone should not globally turn a general predicate into closed-world truth.

---

# 52. Predicate Algebraic Hints

A Predicate MAY declare limited structural semantics such as:

```text
symmetric
inverse_of
transitive_hint
```

KIP should be conservative.

These declarations can affect query planning and reasoning.

They MUST have deterministic meanings.

---

# 53. Transitivity

If:

```text
transitive = true
```

KIP may allow path reasoning to interpret repeated edges accordingly.

However:

> **Schema transitivity does not magically create asserted Propositions.**

A query may derive reachability.

Persisting a derived higher-level Assertion requires explicit derivation/provenance.

---

# 54. Inverse Predicate

A Predicate may declare:

```text
inverse_of = works_for / employs
```

This can support query rewriting.

It does not necessarily require physically storing both Propositions.

---

# 55. Symmetric Predicate

Example:

```text
related_to
```

may declare symmetry.

Again, symmetry is semantic/query behavior.

Persisted raw historical form can remain unchanged.

---

# 56. Disjoint Types

A Package may declare:

```text
ConceptType A disjoint_with ConceptType B
```

This helps Epistemic Conflict detection where one entity is asserted to have incompatible classifications.

Type membership itself must have a defined modeling strategy in the relevant Profile.

---

# 57. Predicate Semantics Must Be Explicit

Schema Packages SHOULD avoid vague semantic magic.

A field like:

```text
causal = true
```

should not be introduced unless KIP defines exactly what engines must do with it.

Prefer a small set of standardized machine semantics plus natural-language documentation.

---

# 58. Facet Definition

A `FacetDefinition` extends one or more Core/Profile element kinds with validated state without introducing a universal untyped metadata bag.

Illustrative:

```json
{
  "kind": "FacetDefinition",
  "name": "MnemonicState",

  "applies_to": [
    {"kind": "concept"},
    {"kind": "assertion"}
  ],

  "fields": {
    "memory_strength": {
      "value_type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "salience": {
      "value_type": "number",
      "minimum": 0,
      "maximum": 1
    }
  }
}
```

Canonical facet namespace:

```text
kip://profiles/cognitive-memory@2.0.0/MnemonicState
```

---

# 59. Facet Identity

A Facet is identified by its exact Schema Symbol Ref.

Do not persist a bare:

```text
"cognitive_memory"
```

facet key as authoritative identity.

Model-facing shorthand may exist.

---

# 60. Facet Openness

A Facet SHOULD be closed by default:

```text
unknown fields → validation error
```

because Facets are meant to replace loose metadata.

A Package may explicitly allow extension fields if needed.

---

# 61. Facet Cannot Redefine Core Semantics

A Facet MUST NOT redefine:

```text
Assertion stance
Assertion target
Evidence payload integrity
_system origin
MemorySpace ownership
Governance authority
```

Core semantics win.

---

# 62. Structural Field Definition

Profiles need relationships that describe record topology rather than world propositions.

Examples:

```text
Experience.has_step → ExperienceStep
Activity inputs/outputs
Skill validation refs
```

Core built-in structural fields are defined by Core.

Profiles MAY define additional structural fields on their Concept Types.

---

# 63. Structural Field Logical Shape

Illustrative:

```json
{
  "kind": "StructuralFieldDefinition",
  "name": "has_step",

  "owner_types": [
    "kip://profiles/cognitive-memory@2.0.0/Experience"
  ],

  "targets": {
    "concept_types": [
      "kip://profiles/cognitive-memory@2.0.0/ExperienceStep"
    ]
  },

  "cardinality": {
    "min": 0,
    "max": null
  },

  "ordered": true,

  "containment": "owned"
}
```

---

# 64. Structural Fields Are Not Propositions

A structural field:

```text
Experience.has_step → Step3
```

does not itself become an epistemic world claim.

If the Brain wants to claim:

```text
Step3 caused Failure
```

that is a Predicate + Proposition + Assertion.

---

# 65. Structural Containment

A structural field MAY declare lifecycle semantics such as:

```text
owned
referenced
weak_reference
```

These do not grant physical-delete behavior automatically.

The Core/KML lifecycle specification defines exact semantics.

---

# 66. Ordered Structural Fields

Experience trajectories need order.

A structural field can declare:

```text
ordered = true
```

The canonical representation must preserve order.

Sequence remains topology, not causality.

---

# 67. Enum Definition

A reusable `EnumDefinition` defines a namespaced finite set.

Example:

```json
{
  "kind": "EnumDefinition",
  "name": "SkillStatus",
  "values": [
    "proposed",
    "trialed",
    "adopted",
    "revoked"
  ]
}
```

---

# 68. Enum Evolution

Adding an enum value can be backward-compatible for producers but may break consumers that assumed exhaustiveness.

Compatibility analysis must consider:

```text
writer compatibility
reader compatibility
```

not only schema shape.

---

# 69. Registry Extensions

Core defines stable base registries such as:

```text
Assertion stance
Assertion mode
Evidence class
Activity class
```

Packages MAY add namespaced extension values where Core permits.

Example:

```text
kip://acme/deployment@1.0.0/evidence_class:synthetic_probe
```

Exact serialization is deferred.

---

# 70. Core Registry Values Cannot Be Redefined

A Package cannot redefine:

```text
support
reject
uncertain
observed
stated
inferred
```

to mean something incompatible.

Namespaced extension only.

---

# 71. Package Dependencies

A Package may depend on other packages.

Example:

```json
{
  "package": "kip://ldclabs/organization",
  "version": ">=1.3.0 <2.0.0"
}
```

Dependencies use ranges.

Resolution produces exact versions.

---

# 72. Dependency Kinds

Recommended:

```text
required
optional
peer
```

Baseline conformance may only require `required`.

---

# 73. Required Dependency

The package cannot activate without a compatible exact version.

---

# 74. Optional Dependency

Additional schema features may become available if present.

Optional dependencies must not change the meaning of already-declared symbols unpredictably.

---

# 75. Peer Dependency

A package expects the Space to provide another package/version family but does not own its installation.

This may be useful for Profiles.

---

# 76. Dependency Resolution

Resolution must be deterministic for a given:

```text
requested package set
available registry state
resolver algorithm/version
lock constraints
```

The resulting exact lock is persisted.

---

# 77. No Floating Runtime Dependency

After activation, a Package MUST NOT begin using a newly published dependency version automatically.

Upgrade is an explicit Schema Environment transaction.

---

# 78. Dependency Conflict

If:

```text
Package A requires X <2
Package B requires X >=2
```

the resolver may:

```text
support side-by-side versions
or
reject environment
```

depending on package isolation capability.

It MUST NOT silently pick one incompatible version.

---

# 79. Side-by-Side Versions

KIP 2.0 SHOULD permit multiple exact versions of the same package to remain resolvable in one Space for historical data.

Example:

```text
cognitive-memory@2.0.0
cognitive-memory@2.1.0
```

may both be installed for reads.

Only one may be the default write version.

---

# 80. Read Version vs. Write Version

Schema Environment distinguishes:

```text
readable versions
active write version
```

Old instances can remain bound to:

```text
@2.0.0
```

while new instances use:

```text
@2.1.0
```

until migration is performed.

---

# 81. Package Activation State

Recommended states:

```text
installed
validation_only
active
deprecated
blocked
quarantined
```

Exact naming may change.

---

# 82. `installed`

Artifact is locally available but not active for normal writes.

---

# 83. `validation_only`

May be used to inspect/validate imported data but not as a default schema for new local cognition.

Useful for untrusted/foreign packages.

---

# 84. `active`

Permitted according to Space Governance.

May participate in new writes if selected/defaulted.

---

# 85. `deprecated`

Existing data remains readable.

New writes SHOULD avoid this version.

---

# 86. `blocked`

Package may not be used for new operations; possibly due to security/semantic incident.

Existing data remains inspectable under historical/audit policy.

---

# 87. `quarantined`

Artifact is isolated pending review.

It MUST NOT affect normal schema resolution.

---

# 88. Activation Is a Governance Operation

Installing/activating/upgrading requires:

```text
manage_schema
```

and any configured approval/security process.

Ordinary Capsule import cannot activate schema.

---

# 89. Package Trust Is Not Data Trust

A trusted Schema Package means:

```text
the Space approves this semantic contract for use
```

It does not mean all data using the package is true.

---

# 90. Package Signature Is Not Schema Approval

A valid publisher signature does not bypass local:

```text
Governance
compatibility checks
security review
```

---

# 91. Schema Validation Layers

KIP 2.0 distinguishes:

```text
Core validation
Package validation
Cross-element semantic validation
Epistemic diagnostics
Governance validation
```

---

# 92. Core Validation

Always enforced by Core:

```text
element shape
Core kinds
immutable fields
same-space closure
Proposition tuple rules
Assertion target rules
Evidence/Activity structure
_system protection
```

Package cannot weaken Core.

---

# 93. Package Validation

Package enforces:

```text
Concept attribute shape
Predicate subject/object legality
Literal datatype
Facet shape
Structural field cardinality
registry extension validity
```

---

# 94. Cross-Element Semantic Validation

Some constraints require graph state:

```text
unique logical key
structural containment
bounded structural cardinality
referential type match
```

Engine may validate transactionally.

---

# 95. Epistemic Constraints Are Not Write Rejection

Functional/exclusive world semantics generally create:

```text
conflict diagnostics
```

not write failures.

Otherwise the system could not store disagreement.

---

# 96. Governance Validation

Schema cannot authorize:

```text
read/write
classification downgrade
authority elevation
trust
```

Governance applies independently.

---

# 97. Validation Result

Recommended result:

```json
{
  "valid": false,
  "violations": [
    {
      "code": "SCHEMA_TYPE_MISMATCH",
      "schema_ref": "...",
      "path": "object",
      "message": "works_for requires Organization object"
    }
  ],
  "warnings": []
}
```

---

# 98. Validation Severity

Possible severities:

```text
error
warning
info
```

Only deterministic declared constraints should produce conformance-level errors.

Model hints must not silently become hard constraints.

---

# 99. Validation Strictness

For a declared exact schema, semantic contract errors SHOULD be deterministic across conforming engines.

Implementations may offer linting extensions.

They must separate:

```text
normative validation
implementation lint
```

---

# 100. Model Hints

A Package may include LLM-oriented documentation:

```text
description
when_to_use
when_not_to_use
examples
common_confusions
formation_guidance
recall_guidance
```

These help Model-First interaction.

They are not machine semantic rules unless also represented in normative constraint fields.

---

# 101. Model Hint Example

```json
{
  "model_hints": {
    "summary": "Use Experience for goal-directed situated trajectories.",
    "avoid": [
      "Do not create Experience for every long conversation.",
      "Do not store hidden chain-of-thought."
    ]
  }
}
```

Useful for Anda Brain.

Not a protocol validator.

---

# 102. Normative vs. Advisory Package Content

Every Package field SHOULD be classified conceptually as:

```text
normative
advisory
documentation
```

This avoids prose accidentally changing cross-engine behavior.

---

# 103. Package Documentation

Packages SHOULD include enough documentation for an Agent to answer:

```text
What does this type mean?
What fields are valid?
What predicates connect it?
Which fields are structural?
What conflicts can occur?
Which package/version owns this symbol?
```

---

# 104. Compact Cognitive Primer

META SHOULD support a compact schema primer optimized for LLMs.

Example:

```text
Person
  semantic human entity
  attributes: display_name?
  predicates:
    prefers → Concept
    belongs_to_domain → Domain

Experience
  goal-directed situated trajectory
  structural:
    has_step → ExperienceStep[]
```

The Primer is generated from authoritative Package Artifacts.

---

# 105. Schema Introspection

Recommended conceptual operations:

```text
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE SCHEMA ENVIRONMENT
LIST SCHEMA PACKAGES
```

Exact META syntax is deferred.

---

# 106. Introspection Returns Canonical Identity

Even if queried by alias:

```text
DESCRIBE TYPE "Person"
```

response SHOULD include:

```text
canonical exact ref
package
version
symbol kind
```

---

# 107. Introspection and Governance

A Principal may not be allowed to discover every installed schema package.

Schema existence can reveal:

```text
medical domain
security systems
secret organization projects
```

Governance may filter introspection.

---

# 108. Schema Environment Resolution

A model-facing local name resolves in this order conceptually:

```text
1. explicit fully qualified exact ref
2. explicit alias
3. active unambiguous local symbol
4. error if absent/ambiguous
```

Do not use fuzzy matching to choose canonical schema identity during writes.

---

# 109. Search Can Help, But Cannot Decide Identity

An Agent may use semantic search to discover likely schema definitions.

After discovery, write resolution MUST select an exact symbol explicitly/deterministically.

---

# 110. No Auto-Create Unknown Schema on Data Write

KIP 1.x requires define-before-use.

KIP 2.0 preserves this principle.

An unknown type/predicate in ordinary data mutation MUST NOT silently create a new Schema definition.

Schema creation is a separate package-authoring/governance process.

---

# 111. Schema Authoring

Tooling MAY allow an Agent to propose/package schema.

But:

```text
proposal
≠
activation
```

Publishing/activating requires Governance authorization.

---

# 112. Dynamic Schema Evolution

KIP remains extensible.

An Agent can identify:

```text
missing type
missing predicate
insufficient constraints
```

and propose a new Package version.

This preserves autonomous evolution without allowing runtime cognition to mutate semantics invisibly.

---

# 113. Package Compatibility

Compatibility is multidimensional.

A version may be:

```text
read-compatible
write-compatible
projection-compatible
migration-compatible
source-compatible for model DSL
```

A single "compatible: true" flag is insufficient.

---

# 114. Compatibility Descriptor

Illustrative:

```json
{
  "from": "1.2.0",
  "to": "1.3.0",

  "read": "compatible",
  "write": "compatible",
  "semantics": "compatible",
  "migration": "none"
}
```

---

# 115. Compatibility Classes

Recommended high-level classes:

```text
backward_compatible
requires_transform
breaking
```

with optional detailed dimensions.

---

# 116. Backward Compatible

Old data remains valid and meaning-preserving under the new package version.

Examples may include:

```text
add optional attribute
add new Concept Type
add new Predicate
add advisory documentation
```

But see enum caveats.

---

# 117. Requires Transform

Old data can be migrated deterministically with declared transformations.

Example:

```text
rename field
split field
promote attribute to Proposition
change structural representation
```

---

# 118. Breaking

No guaranteed general transform or semantic compatibility exists.

Migration may require:

```text
human/Agent review
re-formation
dual-version coexistence
```

---

# 119. Semantic Compatibility Is More Important Than Shape Compatibility

Example:

```text
field name unchanged
type unchanged
description meaning changed
```

is still semantically breaking.

Package authors MUST version meaning, not only JSON shape.

---

# 120. Additive Predicate Change

Adding a new Predicate is usually backward-compatible.

Changing an existing Predicate from:

```text
non-functional
```

to:

```text
functional
```

can alter conflict semantics and may be breaking.

---

# 121. Tightening Constraints

Changing:

```text
string → enum
optional → required
open attributes → closed
```

can invalidate old data.

Usually requires transform or major version.

---

# 122. Loosening Constraints

Changing:

```text
required → optional
enum → broader string
```

may preserve old writes but can break consumers expecting stronger invariants.

Compatibility must consider readers.

---

# 123. Enum Additions

Adding enum values may be compatible for producers but incompatible for exhaustive consumers.

Package authors should declare reader compatibility explicitly where relevant.

---

# 124. Model Hint Changes

Pure documentation/model-hint improvements can be patch/minor if normative semantics remain identical.

A hint change that causes recommended Formation behavior to materially reinterpret the type may deserve a semantic version bump.

---

# 125. Schema Lineage

A Package version MAY declare:

```text
previous_version
supersedes_version
forked_from
```

for discovery/audit.

These do not replace exact dependency semantics.

---

# 126. Forked Package

A third party may fork:

```text
kip://profiles/cognitive-memory@2.0.0
```

into:

```text
kip://acme/cognitive-memory@1.0.0
```

Even identical initial content has a distinct canonical identity.

Digest equality does not merge package namespaces.

---

# 127. Package Equivalence

Two packages can be byte-identical but have different identities.

KIP MAY expose digest equivalence.

It MUST NOT silently substitute one namespace for another when policy depends on canonical package identity.

---

# 128. Migration Descriptor

A Package may include declarative migration metadata.

Example:

```json
{
  "from": "2.0.0",
  "to": "2.1.0",
  "kind": "declarative",
  "operations": [
    {
      "op": "rename_attribute",
      "type": "Experience",
      "from": "outcome",
      "to": "outcome_summary"
    }
  ]
}
```

Exact migration DSL is deferred.

---

# 129. No Arbitrary Migration Code in Core Package

Baseline Schema Packages MUST NOT contain install-time arbitrary code.

Reasons:

```text
security
cross-engine determinism
auditability
portability
LLM inspectability
```

A deployment may use external trusted migration tooling, but that is outside standard Package execution semantics.

---

# 130. Declarative Migration Classes

Potential standard transforms:

```text
rename symbol
rename attribute
copy attribute
delete deprecated attribute
change default write type
map enum value
promote attribute to Proposition
convert Predicate ref
add Facet
move Facet field
```

Only transforms with precise cross-engine semantics should become standardized.

---

# 131. Semantic Migration May Require Cognition

Some migrations cannot be mechanically correct.

Example:

```text
old "relationship" field
→ Friend | Colleague | Family
```

requires interpretation.

Descriptor should declare:

```text
migration = review_required
```

rather than pretending deterministic transformation.

---

# 132. Migration Is a Cognitive-State Transformation

A schema migration may create:

```text
new Concepts
new Propositions
new Assertions
new Activities
new Facets
```

It must preserve provenance and history where semantically appropriate.

---

# 133. Migration Activity

A migration SHOULD produce provenance:

```text
old element(s)
    ↓
Activity: schema_migration
    ↓
new element(s)
```

The old element may remain historical, deprecated, migrated, or tombstoned depending on transformation.

---

# 134. Assertion Migration

Changing schema must not silently change the meaning of a historical Assertion.

Preferred:

```text
old Assertion remains bound to old exact schema refs
new transformed Assertion is a new element
with migration provenance
```

unless the transform is provably representation-preserving.

---

# 135. In-Place Schema Ref Rewrite

In-place rewrite of:

```text
schema_ref @2.0 → @2.1
```

should only be allowed when the versions are declared and validated as semantics-preserving for that element.

Otherwise create migrated state.

---

# 136. Dual-Version Period

A Space may temporarily contain:

```text
old-version data
new-version data
```

The Schema Environment supports both for reads.

New writes target the selected active version.

Maintenance can migrate gradually.

---

# 137. Migration Completion

A migration may be considered complete when:

```text
all required elements transformed
no active write path uses old version
old package retained for historical reads
validation passes
migration audit committed
```

The old Package Artifact should generally remain available while historical data refers to it.

---

# 138. Never Delete a Referenced Schema Blindly

If cognitive state still references:

```text
package@1.0.0/Symbol
```

the engine MUST NOT remove the only available schema definition needed to interpret it unless:

```text
data is migrated/purged
or
a durable external schema archive remains resolvable
```

---

# 139. Schema Archive

A Space/Nexus SHOULD maintain or be able to resolve historical Package Artifacts for all retained cognitive data.

This is part of cognitive interpretability.

---

# 140. Schema Upgrade Workflow

Recommended:

```text
1. request package/version
2. fetch canonical artifact
3. verify digest/signature if present
4. inspect dependencies
5. resolve exact lock
6. validate Governance policy
7. compatibility analysis
8. migration preview
9. validate existing impacted data
10. approval if required
11. atomic activate new Schema Environment
12. execute migration if separately authorized
13. audit
14. monitor
```

---

# 141. Atomic Activation

Schema Environment activation SHOULD be atomic.

A request must not observe a half-resolved set such as:

```text
new package
old incompatible dependency
new alias
old default
```

Transactions spec defines mechanics.

---

# 142. Rollback

Rollback means changing the active write/default environment back to an earlier valid lock.

It does not erase data already written under the newer version.

Those elements remain bound to their exact schema refs.

---

# 143. Schema Environment Version

Each Governance mutation of schema environment SHOULD increment:

```text
environment version
```

and produce an audit record.

Queries/transactions may optionally pin an environment version for reproducibility.

---

# 144. Transaction Schema Snapshot

Every write transaction should conceptually execute against one resolved Schema Environment snapshot.

This prevents:

```text
package upgrade mid-transaction
```

from changing validation semantics between commands.

---

# 145. Transaction Receipt

A high-assurance transaction receipt MAY include:

```text
schema_environment_version
resolved package digests
```

for audit/replay.

---

# 146. Imported Data with Missing Schema

When importing a Capsule that references an unavailable package:

```text
do not guess equivalent local type
```

Options:

```text
reject import
hold in quarantine
fetch dependency under policy
store opaque portable capsule pending schema
```

---

# 147. Validation-Only Schema on Import

A destination may fetch an unfamiliar Schema Package as:

```text
validation_only
```

to inspect imported data without allowing local writes using that schema.

This is a safe interoperability pattern.

---

# 148. Schema Package Security Threats

At minimum:

```text
namespace squatting
same-version content replacement
dependency confusion
malicious schema import
alias hijacking
constraint weakening
conflict-semantics poisoning
Facet smuggling
Governance-scope confusion
migration code execution
schema downgrade
package-signature confusion
historical schema disappearance
type-name collision
```

---

# 149. Namespace Squatting

A package named:

```text
kip://openai/...
```

does not prove ownership by that organization unless registry/publisher identity policy verifies it.

Canonical name alone is not authority.

---

# 150. Same-Version Replacement Attack

Registry serves:

```text
package X@1.0.0 digest A
```

then later:

```text
X@1.0.0 digest B
```

A conforming locked environment MUST detect/reject the mismatch.

---

# 151. Dependency Confusion

If a package requires:

```text
acme/internal-schema
```

resolver must not silently substitute a similarly named public package.

Dependencies use exact canonical package IDs after namespace resolution.

---

# 152. Alias Hijacking

A newly installed package defines local `Person`.

It must not silently change existing alias resolution.

Ambiguity should cause resolution failure until Governance chooses an alias mapping.

---

# 153. Constraint Weakening Attack

An imported package cannot replace local trusted:

```text
Skill
```

with a same-name type that removes safety-relevant constraints.

Canonical symbol refs prevent name-only substitution.

Governance policy should scope by canonical package identities.

---

# 154. Conflict-Semantics Poisoning

A malicious schema might declare:

```text
all alternative values are non-conflicting
```

to suppress epistemic warnings.

Untrusted packages remain validation-only/quarantined until approved.

Epistemic policy may additionally restrict which schema packages are allowed to contribute conflict semantics.

---

# 155. Facet Smuggling

An untrusted package must not define a Facet field named:

```text
authority = executable
```

and thereby gain Governance authority.

Facet is cognitive/profile state.

Governance authority ignores such content unless protected policy explicitly maps it in a non-amplifying way.

---

# 156. Schema Cannot Redefine Governance

A Package MUST NOT redefine:

```text
Principal
Grant
Policy
ActorBinding
Governance classification
manage_schema
```

as control-plane semantics.

It may define cognitive Concepts with similar names, but they are inert.

---

# 157. Schema Cannot Redefine Core Element Kinds

Third-party Package cannot alter semantics of:

```text
Concept
Proposition
Assertion
Evidence
Activity
MemorySpace
```

Core version controls those semantics.

---

# 158. Core Package

KIP 2.0 itself SHOULD be represented as a canonical reserved package:

```text
kip://core@2.0.0
```

It defines introspectable descriptions for Core symbols/registries.

However, the engine's conformance to Core does not depend on ordinary package activation.

`kip://core` is virtual and built-in: its version is the protocol version, it is implicitly active in every Schema Environment, it MUST NOT be deactivated, replaced, or shadowed, and it has no separate package artifact — so a dependency declaration on `kip://core` MAY omit an artifact digest.

Besides the Core element kinds and registries, `kip://core@2.0.0` exports reserved Core structural fields that resolve by the source element's Core kind rather than through package aliases:

```text
evidence       Assertion → Evidence            role-qualified citation
source         Evidence  → Concept | Evidence  origin of the observation/artifact
generated_by   Evidence  → Activity            producing Activity
inputs         Activity  → any Core element    provenance inputs
outputs        Activity  → any Core element    provenance outputs
associated_actors  Activity  → Concept         semantic actors involved in the process (not authority, not the Principal)
```

No Package may define or alias a symbol that shadows a reserved Core symbol name in its resolution scope (§169).

Core is foundational.

---

# 159. Core Version Compatibility

A Schema Package manifest declares compatible KIP Core range.

Example:

```text
requires KIP Core >=2.0.0 <3.0.0
```

A package requiring Core 3 semantics cannot activate on Core 2.

---

# 160. Cognitive Memory Profile Package

The standard profile SHOULD become:

```text
kip://profiles/cognitive-memory@2.0.0
```

containing definitions such as:

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
MnemonicState Facet
has_step structural field
compiled_from structural field
compiled_by structural field
```

subject to the final profile design.

---

# 161. Profiles Are Packages, Not Core Taxonomy

This preserves:

```text
KIP Core
    universal cognitive substrate

Cognitive Memory Profile
    one standardized memory model

Other Profiles
    alternative domain/memory models
```

---

# 162. Package Composition

A domain package may extend the Cognitive Memory Profile without modifying it.

Example:

```text
kip://acme/devops-memory@1.0.0

depends on:
    cognitive-memory@>=2.0 <3
```

adds:

```text
Deployment
Incident
RunbookSkill
deployment_status
caused_by
```

---

# 163. Type Extension / Inheritance

KIP should be cautious with inheritance.

A Package MAY declare a semantic subtype relationship such as:

```text
RunbookSkill is_a Skill
```

but the exact mechanism must be standardized before engines use it for validation.

---

# 164. Nominal Typing Default

Recommended baseline:

> **KIP Schema Types are nominal.**

Two types with identical shapes are not the same type unless a declared semantic relationship says so.

This protects meaning from accidental structural equivalence.

---

# 165. Subtyping

If standardized, subtyping should be explicit and acyclic.

Example:

```text
RunbookSkill <: Skill
```

may allow a Predicate accepting `Skill` to accept `RunbookSkill`.

Cross-package subtyping is dependency-sensitive.

---

# 166. Multiple Inheritance

Baseline v2 SHOULD avoid arbitrary multiple inheritance unless a compelling use case requires it.

Composition through:

```text
Facets
Predicates
Structural Fields
```

is usually safer and easier for LLMs.

---

# 167. Type Evolution vs. Subtype Creation

If a new version changes semantics materially, use:

```text
new major version
or
new type
```

rather than abusing subtype relationships to hide incompatibility.

---

# 168. Predicate Extension

A package may define a more specific Predicate rather than overriding another package's predicate.

No package may mutate another package's symbol definition.

---

# 169. Symbol Shadowing Is Forbidden Canonically

Canonical symbol refs cannot be shadowed.

A Package MUST NOT define or alias a symbol that shadows a reserved Core symbol name (§158).

For all other symbols, only local aliases can conflict, and a collision is a resolution error rather than a redefinition.

---

# 170. Package Re-Export

A Package MAY expose aliases/re-exports of dependency symbols for model ergonomics.

Canonical persisted refs SHOULD still point to the original owning package unless the re-export defines a genuinely new semantic symbol.

---

# 171. Dependency Symbol Ownership

A package cannot claim ownership of another package's symbol merely by depending on it.

This keeps provenance of semantics clear.

---

# 172. Schema Package and Cognitive Capsule

A Cognitive Capsule SHOULD declare exact schema dependencies.

Example:

```json
"schema": [
  {
    "package": "kip://profiles/cognitive-memory",
    "version": "2.0.0",
    "digest": "sha256:..."
  }
]
```

---

# 173. Capsule Does Not Need to Inline Every Schema

If destination can resolve exact packages securely, Capsule can reference them.

For offline portability, Capsule MAY embed Package Artifacts.

Embedded packages still require Governance approval/activation.

---

# 174. Capsule Import Resolution

Import flow:

```text
read exact schema refs
    ↓
check local lock
    ↓
resolve missing packages
    ↓
verify digest
    ↓
load validation-only if allowed
    ↓
validate capsule
    ↓
local Governance decides activation/import
```

---

# 175. Schema-Aware Export

Export should preserve exact schema refs even if local KQL used aliases.

This guarantees portable meaning.

---

# 176. Schema and Hashing

Canonical Package Artifact must define:

```text
key ordering
numeric representation
Unicode normalization rules
definition ordering
default omission rules
reference normalization
```

in coordination with KIP-2.0-Capsule.md.

---

# 177. Package Digest Excludes Signatures

Recommended pattern:

```text
canonical unsigned package content
    ↓ hash
digest
    ↓ sign
signatures
```

to avoid self-referential signing.

Exact proof model deferred.

---

# 178. Package Documentation in Digest

Normative/advisory content SHOULD be covered by package digest if it is part of the published artifact.

Changing model hints may therefore require a new version.

---

# 179. Schema Registry

KIP does not require one global registry.

An implementation may resolve packages from:

```text
built-in registry
organization registry
content-addressed store
HTTP registry
Git repository
decentralized registry
Capsule-embedded artifacts
```

---

# 180. Resolver Trust

Package retrieval source and package identity/signature are distinct.

A secure resolver verifies:

```text
requested canonical identity
exact version
digest/lock
publisher policy if required
```

rather than trusting transport name alone.

---

# 181. Offline Operation

A Schema Environment with locally cached locked Package Artifacts can operate without registry network access.

This is desirable for Agent Brain reliability.

---

# 182. Package Availability Failure

If historical Package Artifact is temporarily unavailable:

```text
raw data bytes may remain stored
```

but semantic operations requiring schema should return:

```text
schema unavailable / unresolved
```

rather than guessing.

---

# 183. Schema Resolution Error Classes

The normative wire codes are the Core error registry (Specification §87.2: `SchemaSymbolNotFound`, `SchemaSymbolAmbiguous`, `SchemaFieldNotFound`, `SchemaPackageUnavailable`, `SchemaEnvironmentChanged`, `HistoricalSchemaUnavailable`, `TypeMismatch`, `ConstraintViolation`).

The finer-grained classes below are schema-tooling diagnostics that map onto those stable codes; for example `SchemaPackageNotFound` and `SchemaVersionNotFound` both surface as `SchemaPackageUnavailable`.

A schema tooling layer may distinguish:

```text
SchemaPackageNotFound
SchemaVersionNotFound
SchemaDigestMismatch
SchemaDependencyConflict
SchemaSymbolNotFound
SchemaSymbolAmbiguous
SchemaNotActive
SchemaBlocked
SchemaValidationFailed
SchemaMigrationRequired
SchemaCoreVersionMismatch
```

---

# 184. Model-Friendly Recovery Hints

Errors SHOULD tell an Agent how to recover safely.

Example:

```text
Type "Person" is ambiguous.
Candidates:
  kip://profiles/cognitive-memory@2.0.0/Person
  kip://acme/hr@1.0.0/Person

Use an exact qualified reference or configured alias.
```

---

# 185. Schema Authoring Conformance

A package-authoring tool SHOULD validate:

```text
manifest
symbol naming
dependency closure
reference resolution
constraint legality
no Core redefinition
no unresolved symbols
migration descriptor correctness
canonical digest
```

before publication.

---

# 186. Package Lint

Optional lint can detect:

```text
factual defaults
ambiguous descriptions
excessive open attributes
missing model hints
predicate naming collision
unsafe semantic change without major bump
```

Lint is advisory unless standardized.

---

# 187. Schema Diff

Tooling SHOULD provide semantic diff:

```text
added/removed types
added/removed predicates
attribute changes
constraint changes
Facet changes
conflict-semantics changes
dependency changes
model-hint changes
migration availability
```

This is critical for Agent/human review.

---

# 188. Compatibility Analyzer

A compatibility analyzer can classify impact on:

```text
existing data
new writes
KQL/KML clients
Epistemic Projection
Governance resource scopes
Capsule portability
```

---

# 189. Governance Impact Analysis

Before activation, the system SHOULD detect whether policy references symbols in the changed package.

Example:

```text
Policy:
  only allow behavioral authority for
  kip://profiles/cognitive-memory@2.0.0/Skill
```

Upgrading to 3.0 may require Governance review.

---

# 190. Epistemic Impact Analysis

Changes to:

```text
functional
exclusive
cardinality
disjoint
closed-world hints
```

may change conflict detection.

Upgrade preview SHOULD flag this.

---

# 191. Recall Impact Analysis

Schema/model-hint changes may affect how Brain Formation/Recall uses types.

Profile upgrades SHOULD be tested against Brain benchmarks.

Protocol correctness alone is insufficient.

---

# 192. Schema Package vs. Brain Algorithm

Package may describe:

```text
Experience has steps
Skill has applicability
```

It should not embed the full algorithm:

```text
when to form Experience
how to score salience
how to consolidate Skills
```

Those belong to Anda Brain / profile guidance.

---

# 193. Profile Normative Semantics vs. Algorithm Guidance

Cognitive Memory Profile package can contain:

```text
normative data shape
normative field meanings
advisory formation guidance
```

but must distinguish them.

---

# 194. Schema Package vs. Trust Policy

Package may declare:

```text
this Predicate represents self-reported preference
```

as semantic metadata.

It cannot say:

```text
trust all users 0.99
```

with Governance effect.

Trust Resolver may choose to use package semantic annotations under an authorized policy.

---

# 195. Schema Epistemic Annotations

A standardized package may eventually annotate:

```text
subjective_self_report
externally_verifiable
time_sensitive
functional
normative
predictive
```

as inputs to Epistemic Policy.

Only annotations with precisely defined semantics should be standardized.

---

# 196. Annotations Do Not Set Scores

Schema should not hard-code universal:

```text
confidence = 0.8
trust = 0.9
```

because epistemic evaluation is contextual.

---

# 197. Schema Package vs. Governance Policy

Package may contain recommended classification hints.

They do not activate Governance classification automatically unless an authorized policy explicitly adopts them.

---

# 198. Governance Resource Scope by Schema

Governance policies may safely refer to canonical exact/package-family identities.

Example:

```text
deny external agents read
  cognitive-memory/Skill
```

But version-family matching must be explicit and policy-controlled.

---

# 199. Policy Version Ranges

Governance may intentionally scope:

```text
kip://profiles/cognitive-memory >=2.0 <3.0 / Skill
```

This is a policy matcher.

It does not alter the exact schema refs stored in data.

---

# 200. Schema Environment and KQL

KQL may allow:

```text
?x {type: "Person"}
```

only after resolving `"Person"` in the request's Schema Environment.

Canonical execution plan uses exact ref.

---

# 201. Schema Environment and KML

KML writes using local schema names are desugared to exact refs before validation/commit.

Transaction receipt should be able to expose resolved refs.

---

# 202. Pinned Schema Context

A client MAY request:

```text
schema_environment_version = N
```

for deterministic read/write planning.

Writes against stale environments may fail if policy requires current schema.

---

# 203. Cross-Environment Query

Historical/audit query MAY explicitly target data across multiple schema versions.

Results should expose exact refs.

---

# 204. Normalized Type Family Query

A higher-level query MAY ask:

```text
all versions in semantic lineage of Experience
```

if Package lineage/compatibility defines that relation.

This is not the same as exact-type matching.

---

# 205. Migration-Aware Query

A runtime MAY provide projected normalized views that map old schema versions into a current logical view.

Such projection MUST disclose:

```text
source exact schema refs
normalization/migration method
lossiness
```

---

# 206. No Hidden Schema Coercion

If old and new schemas cannot be safely normalized:

```text
return separate values / warning
```

not silent coercion.

---

# 207. Self-Describing Schema Bootstrap

The runtime must be able to explain schema even before domain cognition exists.

Core provides bootstrap introspection for:

```text
Package
ConceptType
PredicateType
FacetDefinition
StructuralFieldDefinition
EnumDefinition
```

The model does not need to query special graph instances to understand the type system.

---

# 208. Relationship to KIP 1.x Meta-Types

KIP 1.x:

```text
$ConceptType
$PropositionType
```

ordinary graph Concepts define schema.

KIP 2.0:

```text
Package Artifact definitions
```

are authoritative.

Compatibility mode MAY expose virtual/mirrored:

```text
$ConceptType
$PropositionType
```

views for v1-style introspection.

---

# 209. KIP 1.x Schema Migration

For each v1 schema definition:

```text
{type: "$ConceptType", name: "Person"}
{type: "$PropositionType", name: "prefers"}
```

migration builds one or more Schema Packages.

---

# 210. Package Boundary Discovery

Legacy v1 has no package namespace.

Migration must choose boundaries.

Recommended sources:

```text
Core schema
Cognitive Memory profile types
organization/project domain groupings
explicit administrator mapping
```

Automatic migration should not invent publisher ownership.

---

# 211. Legacy Type Identity

A v1 type:

```text
Person
```

may migrate to:

```text
kip://legacy/<nexus-id>@1.0.0/Person
```

if no known standard package mapping is approved.

This preserves identity safely.

---

# 212. Standard Profile Mapping

If a v1 deployment's `Person`/`Event` exactly matches an approved standard profile migration, Governance may map it to:

```text
kip://profiles/cognitive-memory@2.0.0/Person
```

Otherwise use legacy namespace + explicit migration.

---

# 213. Legacy `instance_schema`

Convert to Concept Type attribute constraints where semantics are clear.

KIP 1.x optional enforcement differences should be recorded.

A v2 migration should validate existing instances and surface violations instead of silently discarding fields.

---

# 214. Legacy Predicate Definition

Convert `$PropositionType` to PredicateType.

Legacy v1 lacks rich subject/object constraints unless encoded manually.

Migration should preserve unknowns as open constraints rather than invent restrictions.

---

# 215. Legacy Schema Definitions Remain Historical

Original v1 schema nodes MAY be retained as:

```text
legacy cognitive/audit artifacts
```

but are no longer authoritative active schema.

---

# 216. Legacy Domain Is Not Package

KIP 1.x `Domain` organizes knowledge semantically.

It should not automatically become a Schema Package boundary.

Recall:

```text
Domain = topic
Package = semantic contract namespace/version
Space = governance boundary
```

These are three different axes.

---

# 217. Package, Domain, and Space

```text
Schema Package
    what vocabulary/contract is used?

Domain
    what is the cognition about?

MemorySpace
    who owns/governs it?
```

Example:

```text
Package:
    cognitive-memory

Domain:
    Rust

Space:
    personal://yan
```

---

# 218. Same Package Across Spaces

Many Spaces may activate:

```text
cognitive-memory@2.0.0
```

Their data remains separately governed.

Schema identity does not merge cognitive data.

---

# 219. Different Packages in Same Space

One Space may activate:

```text
cognitive-memory
organization
devops
legal
```

with deterministic aliases.

---

# 220. Schema Package Publishing Lifecycle

Recommended:

```text
draft
    ↓
validate
    ↓
canonicalize
    ↓
digest
    ↓
optional sign
    ↓
publish immutable version
    ↓
install
    ↓
Governance review
    ↓
activate
```

---

# 221. Publish Does Not Activate

A publisher can publish a package.

A Space chooses whether to activate it.

These are separate trust domains.

---

# 222. Deprecation

Publisher may publish metadata saying a package/version is deprecated.

Local Space decides whether/when to stop new writes.

Remote deprecation should not silently change a locked environment.

---

# 223. Security Revocation

A registry/publisher may announce:

```text
package version compromised
```

A Space can respond:

```text
block
quarantine
downgrade write default
```

Historical data remains interpretable.

---

# 224. Emergency Block

Governance may block a schema version immediately.

Blocked package:

```text
no new writes
no automatic behavior based on its profile if policy says so
historical raw read may remain
```

Migration/review follows.

---

# 225. Package-Level Authority

Schema Package activation grants semantic interpretation authority, not behavioral/tool authority.

A Profile defining `Skill` does not authorize Skills to execute.

---

# 226. Executable Content Is Not Schema

Code, prompts, workflows, and tool policies belong in cognitive/profile artifacts such as Skill.

Do not hide executable logic inside Schema Package definitions.

---

# 227. Regex and Constraint Safety

Even declarative constraints such as regex can cause denial-of-service if poorly implemented.

Conforming engines SHOULD use bounded/safe validation semantics and may reject resource-exhausting schemas.

---

# 228. Constraint Complexity Limits

Runtime capabilities may advertise:

```text
max schema size
max dependency depth
max constraint complexity
max regex size
max enum values
```

to prevent schema abuse.

---

# 229. Dependency Depth

Resolvers SHOULD detect:

```text
cycles
excessive depth
duplicate version conflicts
```

before activation.

---

# 230. Dependency Cycles

Baseline recommendation:

> Required package dependency graph MUST be acyclic.

If future use cases require cycles, they need explicit module semantics.

---

# 231. Symbol Reference Cycles

Type definitions may mutually reference each other:

```text
Person.friend → Person
Organization.owner → Person
```

This is allowed.

It is not a package dependency cycle if within one package.

---

# 232. Cross-Package Type Reference

A Package may reference dependency symbols only if the dependency declaration permits/resolves them.

No undeclared hidden dependencies.

---

# 233. Optional Dependency Symbol

Normative required fields MUST NOT depend on an optional package unless the definition has clear conditional semantics.

Prefer splitting optional integrations into extension packages.

---

# 234. Extension Package Pattern

Instead of:

```text
Package A optionally changes itself when B exists
```

prefer:

```text
Package A
Package B
Package A-B Integration
```

This keeps semantics explicit.

---

# 235. Package Layering

Recommended standard stack:

```text
kip://core
    ↓
kip://profiles/cognitive-memory
    ↓
domain packages
    ↓
organization/application extension packages
```

This is dependency layering, not authority hierarchy.

---

# 236. Schema Package Conformance

A conforming implementation must support:

```text
exact package identity/version
immutable package versions
exact persisted schema refs
dependency declarations
resolved Schema Environment
Concept Type definitions
Predicate Type definitions
Facet definitions
machine validation
schema introspection
Governance-controlled activation
historical schema availability
```

---

# 237. Advanced Conformance

Advanced implementations may add:

```text
structural field schemas
semantic diff
compatibility analyzer
declarative migrations
multi-version normalized queries
package signatures
distributed registries
schema lock export
```

---

# 238. Schema Conformance Fixtures

Tests should include:

```text
exact ref resolution
ambiguous local type name
missing dependency
dependency cycle
version range resolution
same-version digest mismatch
old/new package coexistence
write default upgrade
functional predicate conflict semantics
unknown attribute in closed type
required attribute missing
Facet validation
structural field cardinality
untrusted package import
alias hijacking
schema blocked after activation
migration preview
historical data with deprecated version
KIP 1.x meta-type migration
```

---

# 239. Package Security Fixtures

At minimum:

```text
malicious package tries to redefine Core Assertion
malicious Facet claims executable authority
malicious package declares itself trusted
Capsule imports remote Grant as schema hint
same name "Skill" from untrusted namespace
package dependency confusion
package version replacement
schema upgrade weakens policy-referenced type
```

Expected:

```text
no Governance escalation
no Core override
no silent alias substitution
```

---

# 240. Schema Invariants

The following are normative design targets.

1. Authoritative schema is an immutable versioned Package Artifact.
2. Ordinary Cognitive Graph mutation cannot alter active schema semantics.
3. Self-description is preserved through introspection/mirrors, not schema self-mutation.
4. `package_id + exact version` identifies one immutable canonical package content.
5. Same package/version with different digest is an integrity error.
6. Persisted schema refs always use exact versions.
7. Version ranges are resolution inputs, never persistent semantic identity.
8. Local names are model-facing sugar.
9. Canonical symbol identity includes package namespace + exact version + symbol.
10. Ambiguous local names fail rather than guess.
11. Alias changes do not rewrite persisted element identity.
12. Schema Environment is protected Governance state.
13. A Space records an exact resolved Schema Lock.
14. Runtime package dependencies do not float after activation.
15. Multiple historical versions may remain readable side-by-side.
16. One version may be selected as default for new writes.
17. Old cognitive data remains bound to its old exact schema until explicitly migrated.
18. Package activation is separate from package publication.
19. Package signature does not imply local activation/trust.
20. Imported package does not become active automatically.
21. Unknown packages should default to validation-only/quarantine/inactive.
22. Schema cannot redefine Core element semantics.
23. Schema cannot grant Governance authority.
24. Facets cannot smuggle Governance authority.
25. Schema cannot grant epistemic trust scores universally.
26. Concept Types are nominal by default.
27. Predicate semantics are machine-declared only where meanings are standardized.
28. Functional Predicate semantics create epistemic conflict; they do not forbid contradictory storage.
29. Structural cardinality and epistemic cardinality are distinct.
30. Structural References are not semantic Propositions.
31. Facets are validated namespaced extensions, not an untyped metadata bag.
32. Core validation cannot be weakened by a Package.
33. Normative constraints are distinct from model hints/documentation.
34. Model hints may guide Agents but are not hard validators unless separately declared normatively.
35. Package migration metadata must not execute arbitrary code in baseline KIP.
36. Schema migration preserves enough provenance/history to avoid silently rewriting past cognition.
37. Semantic meaning changes require version evolution even when data shape is unchanged.
38. Deprecated historical schema remains resolvable while retained data references it.
39. Domain is not Package.
40. MemorySpace is not Package.
41. Package namespace identity does not prove publisher identity by itself.
42. Registry transport source does not replace digest/signature/lock verification.
43. Schema upgrade is atomic at the Schema Environment boundary.
44. Rollback of defaults does not erase data written under newer schema.
45. Every write transaction evaluates against one consistent Schema Environment snapshot.
46. Missing schema causes explicit unresolved state, not guessed interpretation.
47. Capsule export preserves canonical exact schema refs.
48. Capsule import validates schema before semantic merge.
49. Policy should scope schema-sensitive authority by canonical refs, not display names.
50. Schema evolution must remain inspectable by an LLM and verifiable by an engine.

---

# 241. Example Package: Cognitive Memory

Illustrative abbreviated package:

```json
{
  "package_id": "kip://profiles/cognitive-memory",
  "version": "2.0.0",

  "dependencies": [
    {
      "package": "kip://core",
      "version": ">=2.0.0 <3.0.0"
    }
  ],

  "definitions": [
    {
      "kind": "ConceptType",
      "name": "Experience",
      "description": "A situated goal-directed trajectory.",
      "attributes": {
        "goal": {"value_type": "string", "required": true},
        "outcome_status": {
          "value_type": "string",
          "required": true
        }
      }
    },

    {
      "kind": "ConceptType",
      "name": "ExperienceStep",
      "description": "One observable step in an Experience."
    },

    {
      "kind": "StructuralFieldDefinition",
      "name": "has_step",
      "owner_types": ["./Experience"],
      "targets": {
        "concept_types": ["./ExperienceStep"]
      },
      "ordered": true
    },

    {
      "kind": "FacetDefinition",
      "name": "MnemonicState",
      "fields": {
        "memory_strength": {
          "value_type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "salience": {
          "value_type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    }
  ]
}
```

Relative refs are package-authoring shorthand only.

Published canonical artifact resolves them to exact Package Symbol refs.

---

# 242. Example Package: Organization

```json
{
  "package_id": "kip://ldclabs/organization",
  "version": "1.0.0",

  "dependencies": [
    {
      "package": "kip://profiles/cognitive-memory",
      "version": ">=2.0.0 <3.0.0"
    }
  ],

  "definitions": [
    {
      "kind": "ConceptType",
      "name": "Organization"
    },

    {
      "kind": "PredicateType",
      "name": "works_for",
      "subject": {
        "concept_types": [
          "kip://profiles/cognitive-memory@2.0.0/Person"
        ]
      },
      "object": {
        "concept_types": ["./Organization"]
      }
    }
  ]
}
```

During dependency resolution, the exact compatible cognitive-memory version is locked.

Published canonical package should reference the resolved semantic requirement in a deterministic form defined by the package canonicalization spec.

---

# 243. Example: Functional Status

```json
{
  "kind": "PredicateType",
  "name": "status",
  "subject": {
    "concept_types": ["./Project"]
  },
  "object": {
    "literal_types": ["string"],
    "enum": ["active", "archived", "deleted"]
  },
  "semantics": {
    "functional": true,
    "exclusive_values": true
  }
}
```

Raw memory may still contain:

```text
(ProjectA, status, "active")
(ProjectA, status, "archived")
```

with conflicting Assertions.

Epistemic Projection creates a Conflict Set.

---

# 244. Example: Timezone Migration

Version 1:

```text
Person.timezone attribute
```

Version 2 decides timezone needs first-class epistemic treatment.

Migration:

```text
old attribute value
    ↓
new Proposition(Person, timezone, Literal)
    +
migrated Assertion
    +
migration Activity
```

Package descriptor:

```text
requires_transform
```

not a silent field rewrite.

---

# 245. Example: Ambiguous `Person`

Installed:

```text
cognitive-memory@2.0.0/Person
hr@1.0.0/Person
```

Agent writes:

```text
CREATE CONCEPT ?p {
  TYPE "Person"
  ...
}
```

Without alias mapping:

```text
SchemaSymbolAmbiguous
```

Agent then uses:

```text
CM.Person
```

or exact canonical ref.

---

# 246. Example: Upgrade Without Migration

Space:

```text
read:
  cognitive-memory@2.0.0
  cognitive-memory@2.1.0

write default:
  @2.1.0
```

Old Experience stays:

```text
schema_ref = @2.0.0/Experience
```

New Experience:

```text
schema_ref = @2.1.0/Experience
```

Both remain interpretable.

---

# 247. Example: Malicious Imported Schema

Capsule includes:

```text
kip://evil/cognitive-memory@2.0.0/Skill
```

whose local name is also `Skill`.

Destination:

```text
does not alias it over standard Skill
does not activate it
loads validation-only if policy allows
preserves exact foreign refs
```

No namespace confusion occurs.

---

# 248. Example: Policy-Sensitive Upgrade

Governance policy:

```text
Only standard cognitive-memory Skill
may ever reach behavioral authority.
```

Schema upgrade:

```text
2.x → 3.0
```

Upgrade analyzer detects policy dependency.

Activation requires Governance review.

No automatic broadening.

---

# 249. Example: Schema Mirror Attack

Cognitive graph contains a mirrored type Concept:

```text
Person definition
```

Agent modifies its description:

```text
"Person means administrator."
```

Result:

```text
cognitive mirror changed/corrupted
```

but authoritative Package Artifact remains unchanged.

Runtime introspection should regenerate/verify mirror from Package.

---

# 250. Example: Historical Query

2026 memory:

```text
schema_ref = Package@2.0.0/Preference
```

2030 Space default:

```text
Package@4.0.0
```

Historical raw query still resolves:

```text
@2.0.0
```

and does not reinterpret the 2026 record using 4.0 semantics.

---

# 251. Schema Package Lifecycle

Complete lifecycle:

```text
Agent/Human identifies semantic need
                │
                ▼
          Schema Proposal
                │
                ▼
             Draft
                │
                ▼
     Validation / Semantic Diff
                │
                ▼
       Canonicalize + Digest
                │
                ▼
         Publish Version
                │
                ▼
       Governance Installation
                │
                ▼
    Quarantine / Validation-Only
                │
                ▼
    Compatibility + Impact Review
                │
                ▼
          Atomic Activation
                │
                ▼
       New-Write Environment
                │
                ▼
       Optional Data Migration
                │
                ▼
      Historical Version Retained
```

---

# 252. Relationship to Transactions

The Schema specification creates requirements for `KIP-2.0-Transactions.md`:

```text
atomic Schema Environment activation
schema snapshot per transaction
exact environment version in receipts
migration transactions
concurrent upgrade conflict handling
idempotent installation/activation
```

---

# 253. Relationship to Capsule

The Schema specification creates requirements for `KIP-2.0-Capsule.md`:

```text
exact package/version/digest dependencies
optional embedded packages
canonical package hashing
safe validation-only import
no automatic activation
schema lock portability
```

---

# 254. Relationship to KQL

The Schema specification creates requirements for `KIP-2.0-KQL.md`:

```text
local name resolution
exact symbol introspection
schema-version filters
raw vs normalized type views
ambiguous symbol errors
schema environment pinning
```

---

# 255. Relationship to KML

The Schema specification creates requirements for `KIP-2.0-KML.md`:

```text
define-before-use
desugaring local type names to exact refs
transactional schema validation
no ordinary schema mutation
schema-version-aware creation
migration-safe writes
```

---

# 256. Relationship to META

META should own model-facing schema introspection:

```text
DESCRIBE PACKAGE
DESCRIBE TYPE
DESCRIBE PREDICATE
DESCRIBE FACET
DESCRIBE SCHEMA ENVIRONMENT
DESCRIBE COMPATIBILITY
```

and potentially schema management discovery.

Actual Governance mutation remains protected.

---

# 257. Relationship to Cognitive Memory Profile

The Profile becomes a first-class standard Schema Package.

Its future design should separate:

```text
normative schema definitions
normative memory semantics
advisory Brain algorithms
```

This allows multiple Brain implementations to interoperate over the same memory contract.

---

# 258. Relationship to Anda Brain

Anda Brain may:

```text
discover schema
select types/predicates
propose schema evolution
follow model hints
migrate profile memory
benchmark upgrade effects
```

It does not gain `manage_schema` merely because it reasons about schema.

---

# 259. Architecture Summary

KIP 1.x:

```text
Graph
  ├ data
  └ schema as mutable graph nodes
```

KIP 2.0:

```text
               Governance Control Plane
                         │
                         ▼
                 Schema Environment
                         │
            exact locked package versions
                         │
                         ▼
               Schema Package Artifacts
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
  Concept Types     Predicate Types      Facets
       │                 │                 │
       ├──── Structural Fields ────────────┤
       │                 │                 │
       └──── Constraints / Semantics ──────┘
                         │
                         ▼
                 Cognitive State
                         │
       every persisted semantic ref
            binds to exact version
```

The Brain sees a compact self-describing view.

The engine enforces an immutable exact contract.

---

# 260. Core Equations

```text
Display Name
    ≠
Canonical Schema Identity
```

```text
Package Name
    ≠
Publisher Trust
```

```text
Package Signature
    ≠
Local Activation
```

```text
Schema Package
    ≠
Governance Policy
```

```text
Schema Package
    ≠
Brain Algorithm
```

```text
Schema Compatibility
    ≠
Data Shape Equality
```

```text
Semantic Version Range
    → resolver input
    → exact locked version
```

```text
Persisted Cognitive Meaning
    =
    Exact Schema Symbol Reference
    +
    Immutable Package Artifact
```

and:

```text
Self-Describing
    does not require
Self-Modifying.
```

---

# 261. Final Principle

A real memory brain cannot safely remember:

> **"This is a Person."**

unless it can also answer:

> Which `Person` definition?

> From which semantic namespace?

> Under which version?

> What attributes and structural fields are legal?

> Which predicates connect to it?

> Which constraints are structural?

> Which constraints merely identify epistemic conflict?

> Was this schema active when the memory was formed?

> Has the schema changed since then?

> Can I still interpret the historical memory under its original semantics?

> Is the package locally approved or merely imported?

> Did the package come from a trusted publisher?

> Does a signature verify integrity but not semantic correctness?

> Will activating a new version change conflict detection, Governance scopes, or Brain behavior?

> Can the Agent propose schema evolution without silently rewriting the meaning of its own past?

KIP 2.0 answers those questions by making schema an immutable, versioned, governed semantic artifact.

The governing idea is:

> **A memory brain must be able to evolve its vocabulary without retroactively changing what its old memories meant.**

That is the purpose of KIP 2.0 Schema Packages.
