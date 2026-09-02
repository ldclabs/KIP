# KIP 2.0 Capsule Specification

**[English](./KIP-2.0-Capsule-Specification.md) | [中文](./KIP-2.0-Capsule-Specification_CN.md)**

## Status

**Normative companion to [KIP-2.0-SPECIFICATION.md](./KIP-2.0-SPECIFICATION.md), version 2.0-draft**

This document carries §37–§41 and §95 of the KIP 2.0 Specification: the Cognitive Capsule artifact, its identity model, its import modes, closure and external references, the export/import pipeline, and the KIP-Capsule conformance profile. The section numbers are the Specification's own, so a reference such as §37.7 or §41.4 written in the Core, the Cognitive Memory Profile or the conformance suite resolves here unchanged. Section references without a document name point into the Core Specification, which keeps everything a Capsule depends on: the element model (§6–§16), Schema Packages (§20), Governance (§28–§31), Transactions (§32–§36), and the pipeline statements `VERIFY CAPSULE` / `VALIDATE CAPSULE` / `PREVIEW IMPORT` / `EXPORT CAPSULE` (§64, §69).

An implementation that does not support Capsules ignores this document, claims no KIP-Capsule conformance (§89) and advertises no export/import capability (§67). One that does is bound by it exactly as by the Core.

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

Native Capsule format SHOULD have deterministic canonical serialization suitable for hashing/signing.

The baseline canonicalization profile is `kip-draft-canonical-json-v1`, the profile the shipped Schema Package artifacts already carry in `integrity.digest_profile`:

```text
encoding        UTF-8, no byte-order mark
objects         keys sorted by Unicode code point, recursively; no duplicate keys
separators      "," and ":" with no whitespace
strings         JSON escaping of control characters and '"' '\' only; other characters emitted raw
numbers         finite only; integers without exponent or fraction; other values in shortest
                round-trip form (§9.6 canonical value) — never NaN, Infinity, -0
absent fields   omitted, never null (null is a value, §9.5)
digest          sha256 over the canonical bytes of every top-level field except integrity,
                written as "sha256:<lowercase hex>"
```

`sha256` is the required digest algorithm; a runtime MAY register further algorithms and signature suites under namespaced names, and MUST reject an artifact whose `digest_profile` or algorithm it does not know rather than verify it loosely.

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

A source element ID MUST NOT automatically become the destination local primary ID.

---

## 38.2 Identity resolution

Recommended conservative order:

```text
1. prior verified import mapping
2. trusted canonical_id
3. explicitly approved mapping
4. schema-defined portable identity (symbol lineage + key, §20.14)
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

# 95. KIP-Capsule Conformance

Requires:

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
