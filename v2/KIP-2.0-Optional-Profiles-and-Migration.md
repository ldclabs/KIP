# KIP 2.0 Optional Profiles and Migration

**[English](./KIP-2.0-Optional-Profiles-and-Migration.md) | [中文](./KIP-2.0-Optional-Profiles-and-Migration_CN.md)**

## Status

**Normative companion to [KIP-2.0-SPECIFICATION.md](./KIP-2.0-SPECIFICATION.md), version 2.0-draft**

This document carries four parts of the KIP 2.0 Specification that a Core implementation may never need: §100 Historical Conformance and §101 High-Assurance Conformance — the two optional conformance profiles — and §103 KIP 1.x Migration with its Appendix I Compatibility Summary. The numbering is the Specification's own, so references resolve here unchanged, and section references without a document name point into the Core. The operational migration guide is [migration/KIP-2.0-Migration-from-1.x.md](./migration/KIP-2.0-Migration-from-1.x.md); where that guide and §103 disagree, §103 wins.

An implementation claims the Historical or High-Assurance profile through `DESCRIBE CAPABILITIES` (§67) and is then bound by the corresponding section; an implementation that claims neither, and has no KIP 1.x data, is bound by nothing in this document.

---

# 100. Historical Conformance

Requires, within advertised retention:

```text
AS OF SEQ
lifecycle reconstruction
historical Schema Environment
historical cognitive read
current authorization
transaction chronology
```

---

# 101. High-Assurance Conformance

May require:

```text
serializable transactions
signed Receipts
canonical request/plan digests
strict duplicate-JSON-key rejection
exact historical Schema
tamper-evident checkpoints
strict existence-neutral behavior
strong proof registries
auditable Projection policy versions
```

---

# 103. KIP 1.x Migration

## 103.1 Migration objective

Migration SHOULD preserve legacy meaning/history without pretending KIP 1.x stored epistemic distinctions that did not exist.

---

## 103.2 Legacy Concept

A KIP 1 Concept SHOULD become a v2 Concept.

Where v1 relied on `(type,name)` identity, migration MAY derive a stable v2 `key` from the legacy identity.

---

## 103.3 Legacy Proposition

A v1 factual Proposition SHOULD become:

```text
canonical v2 Proposition
+
migrated positive Assertion
```

to preserve its legacy fact-like semantics.

---

## 103.4 Legacy metadata

Legacy metadata MUST be classified.

Examples:

```text
confidence
    → Assertion confidence where semantically valid

source / author
    → Evidence / asserted_by / provenance

observed_at
    → Evidence observation time

valid_from / valid_until
    → Assertion valid_time

expires_at
    → retention

access_level
    → Governance mapping

operational markers
    → Profile Facet

unknown legacy fields
    → namespaced legacy Facet if safe
```

---

## 103.5 Legacy confidence decay

v1 periodic confidence decay SHOULD NOT be migrated as native Assertion-confidence decay.

Depending on intended meaning:

```text
forgetting
    → memory_strength

staleness
    → Epistemic Projection freshness

new evidence
    → new Assertion revision
```

---

## 103.6 Legacy DELETE

Native migration SHOULD prefer:

```text
archive
tombstone
explicit purge
Assertion lifecycle
```

over recreating generic destructive DETACH semantics.

---

## 103.7 Legacy MERGE

Legacy destructive edge-repoint/delete SHOULD migrate to v2 non-destructive identity consolidation.

---

## 103.8 Legacy EXPORT

A KIP 1 UPSERT export script is a legacy artifact.

Native v2 portability uses Cognitive Capsule.

A v2 runtime MAY provide a compatibility importer/exporter.

---

## 103.9 Legacy schema nodes

KIP 1 self-described graph types SHOULD be migrated to authoritative Schema Packages or compatibility packages.

Ordinary cognitive nodes MUST NOT become authoritative Schema state in native v2.

---

# Appendix I. Compatibility Summary

The key KIP 1 → KIP 2 semantic shifts are:

```text
v1 Concept identity:
    type + name often identity
v2:
    immutable id/key; name is grounding

v1 Proposition:
    relation/fact + metadata
v2:
    truth-neutral Proposition + Assertion + Evidence

v1 metadata confidence:
    stored on link
v2:
    Assertion confidence, Projection belief, memory_strength separated

v1 generic metadata:
    universal bag
v2:
    explicit semantic planes

v1 merge:
    repoint + delete source
v2:
    non-destructive identity consolidation

v1 delete/detach:
    routine graph operation
v2:
    archive / tombstone / purge distinction

v1 export:
    idempotent UPSERT script
v2:
    Cognitive Capsule artifact

v1 query link:
    fact-like interpretation
v2:
    raw Proposition unless BELIEF is explicit

v1 command batch:
    legacy execution behavior
v2:
    independent / sequence / atomic explicitly declared
```

---
