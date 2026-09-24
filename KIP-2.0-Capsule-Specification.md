# KIP 2.0 Capsule Specification

**[English](./KIP-2.0-Capsule-Specification.md) | [中文](./KIP-2.0-Capsule-Specification_CN.md)**

## Status

**Normative companion to [SPECIFICATION.md](./SPECIFICATION.md), version 2.0-draft**

This document carries §37–§41 and §95 of the KIP 2.0 Specification: the Cognitive Capsule artifact, its identity model, its import modes, closure and external references, the export/import pipeline, and the Capsule capability requirements. The section numbers are the Specification's own, so a reference such as §37.7 or §41.4 written in the Core, the Cognitive Memory Profile or the conformance suite resolves here unchanged. Section references without a document name point into the Core Specification, which keeps everything a Capsule depends on: the element model (§6–§16), Schema Packages (§20), Governance (§28–§31), Transactions (§32–§36), and the pipeline statements `VERIFY CAPSULE` / `VALIDATE CAPSULE` / `PREVIEW IMPORT` / `EXPORT CAPSULE` (§64, §69).

An implementation that does not support Capsules ignores this document and advertises neither `capsule_export` nor `capsule_import` (§67.4); Capsule support is a capability, not a profile (§89). One that does is bound by it exactly as by the Core.

---

# 37. Cognitive Capsule

## 37.1 Definition

A **Cognitive Capsule** is a portable, immutable, inspectable artifact carrying cognitive state or state changes between systems/Spaces.

A Capsule is not executable mutation authority.

---

## 37.2 Core invariant

```text
Capsule bytes
    ≠
destination mutation authority
```

---

## 37.3 Capsule kinds

Baseline kinds:

```text
snapshot
delta
```

---

## 37.4 Snapshot Capsule

Represents selected cognitive state at one source snapshot.

---

## 37.5 Delta Capsule

Represents ordered changes over one source lineage between:

```text
base_seq
target_seq
```

Delta application requires base/checkpoint compatibility.

---

## 37.6 Logical structure

A Capsule SHOULD contain conceptually:

```text
payload
  manifest
  source
  schema dependencies
  records
  external_refs
  blobs
  handling

integrity
  content_digest
  proofs/signatures
```

---

## 37.7 Canonical representation

The required canonicalization profile is `kip-jcs-safe-v1`: RFC 8785 (JCS)
**in full**, narrowed to the portable numeric domain of Core §9.3. Encode UTF-8
without a BOM; sort object names by UTF-16 code units; use ECMAScript escaping
and number serialization; no whitespace, duplicate decoded keys, invalid Unicode
or non-finite values. Normalize negative zero to zero. Artifact strings are NOT
NFC-normalized; semantic Literal construction applies NFC before persistence.

Digest `sha256` over every top-level field except `integrity`, as canonical bytes,
and spell it `sha256:<lowercase hex>`. Absence omits a field; null stays a value.
Other algorithms/profiles require explicit negotiation. Previous
`kip-draft-canonical-json-v1` digests are a different, nonportable draft format:
a runtime MUST reject them unless it advertises an explicit compatibility verifier;
it MUST NOT reinterpret their bytes under the new name.

`schemas/kip-capsule.schema.json` and `schemas/kip-element.schema.json` fix the
baseline portable shapes. Snapshot records use capsule-local IDs, references
resolve through that namespace, and source identities remain separately recorded.
Closure, semantic validation and Governance are checked in addition to JSON Schema.
The reference canonicalizer and golden vectors are shipped with `packages/kip-lang`.

---

## 37.8 Signature semantics

A Capsule signature proves that a signer attested to a content digest/scope.

It does not prove:

```text
truth
safety
utility
trust
authority
destination applicability
```

---

# 38. Capsule Identity Model

## 38.1 Three identities

Import must distinguish:

```text
capsule-local reference
source element reference
destination local element ID
```

A source element ID MUST NOT automatically become the destination local primary ID. Space-local keys have no automatic cross-owner identity meaning.

---

## 38.2 Identity resolution

Recommended conservative order:

```text
1. prior verified import mapping
2. trusted canonical_id
3. explicitly approved mapping
4. explicitly declared portable identity (lineage + verified issuer_namespace + key_scope + normalized key, Specification §11.6)
5. create new Concept
```

---

## 38.3 Name is not merge identity

```text
same name
    ≠
same identity
```

---

## 38.4 `$self`

Source `$self` MUST NOT automatically become destination `$self`.

Ordinary Agent-to-Agent sharing maps source self to the source Agent's semantic identity.

---

## 38.5 Restore exception

A verified restore mode MAY map source `$self` to destination `$self` only when Governance verifies:

```text
same owner
same Brain/self identity
backup lineage
explicit restore authority
```

---

# 39. Capsule Import Modes

Recommended:

```text
preview
isolate
merge
restore
```

---

## 39.1 Preview

Read-only simulation.

No destination cognitive state is created.

---

## 39.2 Isolate

Imports into a quarantined/review state rather than ordinary Recall state.

---

## 39.3 Merge

Merges another source's cognition into the destination under destination identity/Governance policy.

---

## 39.4 Restore

Restores the same Brain/owner lineage under stronger identity checks.

---

## 39.5 Source trust does not migrate automatically

Destination MUST apply its own:

```text
trust
classification
authority
Schema
Governance
```

policy.

---

# 40. Capsule Closure and External References

## 40.1 ExternalRef

An omitted dependency SHOULD be represented explicitly rather than as an opaque dangling ID.

Recommended kinds:

```text
source_element
canonical_identity
semantic_locator
external_artifact
redacted
unavailable
```

---

## 40.2 Redacted vs unavailable

These MUST remain distinguishable where policy permits:

```text
redacted
    source intentionally withheld

unavailable
    source does not possess/provide it
```

---

## 40.3 Closure

A Capsule SHOULD declare closure such as:

```text
closed
referential
selective
```

and MAY separately describe:

```text
semantic closure
Evidence closure
provenance closure
structural closure
```

---

# 41. Capsule Export/Import Pipeline

## 41.1 Export

Export MUST be snapshot-consistent.

Large export SHOULD use a pinned source snapshot/export session.

Transport chunking MUST NOT create multiple independent semantic Capsules unless explicitly represented as a Capsule Set.

---

## 41.2 Import pipeline

Native import conceptually follows:

```text
VERIFY
→ VALIDATE
→ PREVIEW / identity resolution
→ Governance analysis
→ Import Plan
→ atomic Import Transaction
```

---

## 41.3 Embedded schema

Embedded Schema Packages MAY be used validation-only.

They MUST NOT auto-activate.

---

## 41.4 Imported Skill authority

Imported Skills default inactive/non-executable unless destination Governance explicitly elevates them.

---

## 41.5 External blobs

A Capsule MAY reference content-addressed external blobs.

Import MUST NOT automatically fetch arbitrary URLs.

Network fetch requires separate runtime/tool authority.

---

## 41.6 Imported outcomes

Import assigns fresh local `_system.origin` (§41.2) and records the import in `origin.import_id`. For `outcome`-class Evidence that is decisive: the destination never authorized the instrument that wrote it, so an imported outcome is readable evidence and never a local grade. A grading consumer MUST exclude any outcome whose `origin.import_id` is set (§15.7), and an imported Skill's grading state does not transfer (§31.4).

---

## 41.7 Restore and reference mapping

A sharing import retains source history but transfers neither standing nor authority. A migration or restore additionally verifies owner, `$self` and backup lineage, the reference mappings and the retained control and evaluation artifacts, and records a **RestoreReport** (`schemas/kip-cognitive-records.schema.json`) listing missing resources, the historical preservation achieved and the separate current validation result.

Source ProjectionBasis values, versions and replay bytes stay in their source namespace, with a pinned mapping artifact to destination identities. An importer MUST NOT rewrite a signed source basis into a fabricated destination read. Typed references inside Facets and artifacts are mapped by the `reference_paths` their package declares (§20.5) — JSON Pointer segments with `*` for array items, `target: element`, `namespace: source` — never by replacing every matching string. Null references stay null. Source coordinates inside a ProjectionBasis or an immutable replay artifact are retained, not remapped; destination views use the mapping artifact. An unknown path or an unavailable required reference fails closure validation (§40.3) rather than being guessed, and an unmapped or unverifiable pin prohibits current automatic use. A source's draft vocabulary (`kip://local/...`, §20.16) stays source-namespaced: an import that writes an element under a source draft symbol needs an entry in the mapping artifact that maps that symbol to a destination symbol of the same kind — a destination draft symbol or an installed package's symbol — and the element persists the mapped exact reference. A used source draft symbol without such an entry fails `SchemaPackageUnavailable`, naming every unmapped symbol; the importer never maps by name and never synthesizes a destination package for them.

Verified historical adoption MAY remain readable as history, but imported outcomes never become local grades, on restore as on merge. Current standing requires explicit destination validation under the destination's authorized learning policy ([Validated Learning](./brain/KIP-2.0-Validated-Learning.md)); otherwise it is `unproven` or `unverifiable`. Permission never transfers. Storage-level disaster recovery that preserves the authenticated original runtime is distinct from Capsule import and declares its own recovery boundary.

---

# 95. Capsule Capability Requirements

Advertising `capsule_export` or `capsule_import` (§67.4) requires:

```text
canonical artifact
snapshot Capsule
digest
Schema dependency identity
source/destination identity separation
ExternalRef
closure declaration
verify/validate/preview pipeline
destination-local import authority
```

Delta/restore/signatures MAY be advanced subprofiles.

---
