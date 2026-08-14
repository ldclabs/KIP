# KIP 2.0 Migration from KIP 1.x

**[English](./KIP-2.0-Migration-from-1.x.md) | [中文](./KIP-2.0-Migration-from-1.x_CN.md)**

## Status

**Operational Migration Guide / Informative Companion to KIP 2.0 Specification §103**

This document explains how to migrate real KIP 1.x deployments into KIP 2.0 safely.

The normative migration invariants live in `KIP-2.0-SPECIFICATION.md`. If this guide conflicts with the Specification, the Specification takes precedence.

---

# 0. Migration Thesis

KIP 1.x and KIP 2.0 are semantically different.

KIP 1.x centers a self-describing Concept/Proposition knowledge graph. KIP 2.0 separates:

```text
meaning
belief
evidence
provenance
mnemonic state
retention
Governance
Schema authority
```

Migration is therefore not a field rename. It is **semantic decomposition**.

> **Preserve what the old Brain actually knew and recorded without pretending that KIP 1.x captured distinctions it never stored.**

# 1. Objectives

Preserve semantic meaning, legacy identity where safe, historical claims, source annotations, time information, privacy intent, episodic memory, commitments, Experience/Skill artifacts where present, and auditability.

Move those records into native KIP 2.0 semantics without fabricating missing epistemic structure.

# 2. Non-Goals

Migration MUST NOT fabricate:

```text
verified identity
source trust
Evidence that never existed
actor authentication
exact observation lineage
historical Assertion revisions that were never stored
independent corroboration
Governance authority
```

Ambiguous legacy semantics remain explicitly ambiguous.

# 3. Inventory

Before transformation, inventory:

```text
KIP 1.x revision
Concept Types
Proposition Types
Concept/Proposition counts
metadata keys
reserved `_` metadata
Domains
Person/$self/$system structures
Event/Preference/Insight/Commitment/SleepTask
Experience/Skill extension structures
access_level usage
confidence usage
confidence-decay jobs
MERGE history if recoverable
DELETE/TTL behavior
EXPORT/UPSERT capsules
custom Schema extensions
```

Produce a report before cutover.

# 4. Freeze and Backup

Recommended:

```text
1. pause destructive maintenance
2. take a consistent source snapshot
3. export raw source state
4. capture legacy Schema/meta-definition graph
5. record source engine/version
6. hash/archive migration input
```

Do not rely solely on old `EXPORT` if it omits engine bookkeeping needed for migration diagnostics.

# 5. Target MemorySpace

Every migrated durable element needs one home Space.

Typical personal deployment:

```text
one KIP 1.x Nexus → one default personal MemorySpace
```

Do not infer Space boundaries from semantic Domains:

```text
Domain ≠ Space
```

If one legacy graph multiplexed multiple security principals, create an explicit Governance partition plan before migrating data.

# 6. Principal and Actor Migration

Legacy semantic nodes such as `$self`, `$system`, and Person are cognitive Actors, not authenticated Principals.

Configure separately:

```text
PrincipalRecord
ActorBinding
Space ownership/membership
Grants
Policies
```

Never create administrative authority merely because the source graph contains `$system`.

# 7. Schema Migration

KIP 1.x authoritative semantics were represented through graph nodes such as `$ConceptType` and `$PropositionType`. KIP 2.0 authoritative Schema is immutable Package state.

Migration should:

```text
read legacy schema graph
normalize type/predicate definitions
assign package namespace/version
convert constraints
convert aliases
record migration descriptors
publish immutable Package
activate under Governance
```

Legacy schema Concepts may remain as cognitive mirror/provenance but MUST NOT be authoritative native Schema.

# 8. Package Strategy

A deployment can initially publish a compatibility package such as:

```text
kip://legacy/<deployment-id>@1.0.0
```

Do not place arbitrary legacy application types into `kip://core`.

Where semantics match standard cognitive memory, migrate toward:

```text
kip://profiles/cognitive-memory@2.0.0
```

# 9. Concept Migration

```text
v1 Concept → v2 Concept
```

Preserve source local ID in migration lineage. Target ID may be reused only if the implementation can do so without violating native ID contracts.

Where v1 relied on `(type,name)` identity, derive a stable v2 `key` where appropriate. Do not convert a display name into universal `canonical_id`.

# 10. Attributes

Keep as Concept attributes when values are representation-local and do not require independent epistemic lifecycle, for example display hints, compact operational state, counters, or non-epistemic arrays/objects.

Promote to Proposition + Assertion when a value has source/confidence, can conflict, changes historically, needs validity, needs Evidence, needs independent access policy, or is exchanged as a truth-sensitive claim.

Migration may be gradual.

# 11. Proposition Migration

For each fact-like v1 Proposition:

```text
v1 Proposition
→ canonical v2 Proposition
+ migrated positive Assertion
```

The v2 Proposition is truth-neutral. The migrated Assertion preserves legacy fact-like intent.

Use only registered native Assertion modes. Preserve migration origin in Activity/import provenance rather than inventing an unregistered mode value.

# 12. `author` / asserted_by

Legacy `author` is ambiguous. It may mean semantic speaker, writer application, or bookkeeping actor.

Map only when justified:

```text
clear semantic source Person → asserted_by Person
system writer only           → migration provenance, not necessarily asserted_by
unknown string               → legacy annotation / Evidence source text
```

Never invent ActorBinding.

# 13. Confidence Migration

Legacy `metadata.confidence` maps to Assertion confidence only when it represented epistemic commitment.

If it represented accessibility, importance, or staleness, classify instead:

```text
truth support      → Assertion confidence
forgetting/access  → MnemonicState.memory_strength
importance         → salience
staleness          → Projection freshness/validity policy
mixed/unknown      → preserve legacy value + conservative native initialization
```

# 14. Legacy Confidence Decay

If old maintenance periodically decayed confidence, original epistemic confidence may be unrecoverable.

Correct migration:

```text
preserve current legacy value
record ambiguity warning
initialize native confidence/memory_strength conservatively
stop future generic confidence decay
```

Do not blindly set native Assertion confidence to the decayed value and continue decaying it.

# 15. Source / Evidence

Convert resolvable source artifacts into explicit Evidence/Activity where possible:

```text
message ID
tool result
measurement
document
trace ID
human feedback
```

A generic source string such as `"web"` or `"conversation"` is not automatically a specific Evidence event. Preserve it as legacy annotation/external reference if stronger reconstruction is impossible.

# 16. Time Mapping

```text
observed_at            → Evidence.observed_at
valid_from/valid_until → Assertion.valid_time
expires_at             → retention.expires_at
```

Legacy `created_at` is source/content provenance. Native `_system.created_at` is new engine truth unless a protected restore mechanism explicitly supports historical restoration.

# 17. Lifecycle Mapping

Legacy `superseded`, `superseded_at`, `superseded_by` should become Assertion lifecycle only when actor-specific belief revision can be reconstructed.

If old lifecycle sat on Proposition and actor semantics are unknown, preserve a legacy lifecycle annotation rather than inventing a source-specific supersession history.

# 18. DELETE Migration

Classify intent:

```text
no longer believed        → retraction/supersession
not normally recalled     → archive / mnemonic change
logically deleted         → tombstone
must physically erase     → purge under Governance
cleanup orphan            → safe lifecycle/GC policy
```

Do not recreate broad destructive DETACH cascade as default native memory policy.

# 19. MERGE Migration

Legacy merge may have repointed edges, copied attributes, and deleted the source. Native v2 merge is non-destructive identity consolidation.

For historical legacy merges, use `_merged_from`/logs when available and reconstruct alias lineage only when reliable. Do not fabricate a perfect deleted source node if its original state is irrecoverable.

All future merges should use native non-destructive semantics.

# 20. Domain Migration

Legacy Domain is semantic organization. Preserve domain/topic Concepts and `belongs_to_domain`-like semantics where useful.

Do not map Domain directly to MemorySpace unless it truly represented ownership/security and that interpretation is explicitly validated.

# 21. Privacy / access_level

Legacy `access_level` is not sufficient native enforcement.

Migration should inventory values, define a classification mapping, create protected Space Policies/Grants, and optionally retain old `access_level` as legacy cognition.

Possible mapping:

```text
public    → public
internal  → internal
private   → private
sensitive → sensitive
```

but each deployment must validate actual legacy meaning.

# 22. Event Migration

Legacy Event nodes usually map to Profile Event. Move summary, time, participants, outcome, and topics into the Profile structure. Truth-sensitive metadata/propositions still undergo normal Assertion/Evidence decomposition.

# 23. Experience / Skill Migration

If the deployment already used the pre-2.0 Experience extension, map into Cognitive Memory Profile 2.0.

Important conversions:

```text
metadata.memory_strength   → MnemonicState.memory_strength
metadata.confidence        → classify; never blindly keep as Profile metadata
has_step + index attribute → ordered has_step topology (edge order; no step ordinal attribute)
caused_by predicate        → Profile caused_by Proposition + migrated positive Assertion
derived_insight            → derived_from structural lineage (Insight → Experience) where recoverable
compiled_to/derived_from   → compiled_from + compilation Activity where recoverable
```

Preserve raw legacy representation as provenance when exact conversion is uncertain.

# 24. Preference Migration

Legacy Preference often combines claim, pattern summary, evidence counters, confidence, and first/last observed times.

Separate:

```text
truth-sensitive preference → Proposition + Assertion(s)
summary/stability           → Preference Profile Concept
observations                → Evidence where recoverable
mnemonic state              → MnemonicState
```

# 25. Insight Migration

Legacy Insight maps to Profile Insight. If its content is a truth-sensitive reusable lesson, migration may additionally form Proposition + migrated Assertion where the mapping is reliable. Preserve source Event/Experience lineage.

# 26. Commitment Migration

Map maker, beneficiary, summary, due_at, and lifecycle to Profile Commitment. Never map `due_at` to retention expiry.

# 27. SleepTask Migration

Map legacy maintenance tasks to Profile SleepTask. `assigned_to = $system` must not become Governance permission.

# 28. `$self` Migration

Preserve old `$self` as semantic self identity where appropriate, then establish local Principal identity, ActorBinding, and Space ownership separately.

Cross-system ordinary import must not map source `$self` into destination `$self` automatically.

# 29. `$system` Migration

Old `$system` may remain a semantic maintenance actor, but authenticated Maintenance Principal is provisioned separately. The name itself is not a security primitive.

# 30. Legacy EXPORT

KIP 1.x UPSERT export scripts are legacy serialization artifacts.

Options:

```text
keep compatibility importer
convert to native Cognitive Capsule
re-export from migrated v2 state
```

Do not claim old scripts have native Capsule digest/signature/identity semantics unless actually converted under the Capsule specification.

# 31. Capsule Cutover

Recommended:

```text
migrate source state
validate target
produce new native snapshot Capsule
```

This gives a clean portable v2 baseline.

# 32. Compatibility Adapter

A runtime MAY offer an implementation-specific KIP 1 compatibility adapter for gradual cutover.

Possible behavior:

```text
v1 fact read        → accepted v2 Projection compatibility view
v1 proposition write→ Proposition + positive Assertion
legacy metadata     → mapped native fields + warnings
legacy export       → compatibility artifact or converted Capsule
```

The adapter cannot redefine native KIP 2.0 semantics. Ambiguous behavior should produce explicit warnings/errors.

# 33. Dual Read

During migration, compare source v1 read with equivalent v2 projection. Focus on identity, fact answers, validity, attribution, privacy, Event recall, Commitments, and Profile memory.

Differences caused by stronger v2 epistemic semantics should be classified rather than automatically treated as bugs.

# 34. Dual Write

Dual write is risky because v1/v2 semantics differ. If temporarily used, keep one authoritative write path, derive the other representation, attach stable source-event/idempotency identity, and monitor divergence. Avoid separate free-form LLM generation of independent v1 and v2 writes for the same input.

# 35. Transaction Strategy

Do not migrate a huge Nexus as one transaction. Use coherent atomic units such as one identity cluster, one Proposition + Assertion + Evidence unit, one Experience + Steps, one Commitment, or one Schema activation transition.

Large migration may stage data then publish according to runtime capabilities.

# 36. Migration Activity

Record migration provenance:

```text
activity_class = schema_migration or import
source system/version
source snapshot digest
migration tool/version
mapping profile/version
warnings digest
```

Migration Activity is not Evidence that legacy claims are true.

# 37. Idempotency

Migration must be restartable. Maintain stable source mapping:

```text
(source nexus, source element id) → target element id
```

and transaction idempotency. Restart must not duplicate Assertions, Evidence, or Experiences.

# 38. Preview

Before commit, produce a preview such as:

```json
{
  "source": {"version": "1.x", "snapshot_digest": "..."},
  "counts": {"concepts": 0, "propositions": 0},
  "mapping": {
    "concepts": 0,
    "propositions_to_assertions": 0,
    "evidence_created": 0,
    "legacy_facets": 0
  },
  "warnings": [],
  "governance_changes": [],
  "schema_packages": []
}
```

Preview does not reserve identity, authority, or durable state.

# 39. Uncertain Mappings

Use explicit warning classes:

```text
legacy_author_ambiguous
legacy_confidence_semantics_mixed
legacy_source_unresolvable
legacy_merge_history_missing
legacy_access_level_ambiguous
legacy_timestamp_semantics_unknown
legacy_schema_constraint_unrepresentable
```

Preserve original values in a namespaced legacy Facet when safe.

# 40. Legacy Facet

A compatibility Package may define a `LegacyKIP1` Facet for unmapped fields. It must be namespaced, schema-validated, non-authoritative, and unable to override Core, Governance, or `_system`.

# 41. Validation Before Cutover

Run Core, Schema, Epistemic, Governance, Historical, Migration, and Profile conformance, plus migration reconciliation:

```text
source/target counts
identity-map completeness
unmapped metadata report
privacy mapping audit
sampled fact equivalence
historical spot checks
Event/Commitment checks
```

# 42. Migration Conformance

At minimum validate:

```text
legacy Concept → v2 Concept
legacy fact Proposition → Proposition + positive Assertion
confidence → Assertion, not Proposition
source/author decomposition
observed_at → Evidence time when valid
valid_from/until → Assertion valid_time
expires_at → retention
access_level → Governance
no native confidence decay
non-destructive merge semantics
legacy export != native Capsule
```

# 43. Historical Semantics

Migration introduces a new target transaction history. Do not pretend source and target timelines are identical.

Preserve source historical timestamps/IDs/version metadata, migration timestamp, and target transaction sequence as separate coordinates.

# 44. Restore vs Migration

Same-Brain disaster recovery may have stronger continuity semantics than ordinary migration. Do not use general migration to bypass self/authority rules. Exact identity restoration, if supported, belongs to a protected restore procedure.

# 45. Rollback

Operational rollback strategy:

```text
keep source frozen/readable
retain backups
avoid destroying source before target acceptance
version migration maps
allow target Space discard/rebuild before cutover
use compensating v2 transactions after publication
```

KIP transaction rollback cannot reverse external cutover actions automatically.

# 46. Cutover Checklist

```text
[ ] target Schema Environment activated
[ ] Governance policy audited
[ ] actor/principal bindings audited
[ ] identity map complete
[ ] fact-like Propositions mapped
[ ] legacy confidence classified
[ ] retention mapped
[ ] privacy mapped
[ ] Profile memory migrated
[ ] open Commitments verified
[ ] migration warnings reviewed
[ ] conformance tests pass
[ ] backup retained
[ ] rollback plan tested
```

# 47. Example — Simple Fact

Legacy:

```text
Concept Alice
Proposition Alice --timezone--> "+08:00"
metadata.author = "Alice"
metadata.confidence = 0.9
metadata.source = "message-123"
```

Target:

```text
Concept Alice
Proposition (Alice, timezone, "+08:00")
Evidence source message-123 if recoverable
Assertion supports Proposition
    asserted_by = Alice if justified
    confidence = 0.9
    mode = stated/imported-compatible native mode
Migration Activity links source record → target records
```

The target Proposition has no confidence.

# 48. Example — Old Forgetting

Legacy:

```text
confidence = 0.43 because weekly decay reduced it from 0.9
```

Target cannot know whether `0.43` means weak truth support, low accessibility, or staleness.

Correct response: preserve value, record ambiguity, initialize native signals conservatively, and stop future confidence decay.

# 49. Example — Legacy Merge

Legacy:

```text
JS merged into JavaScript
JS deleted
edges repointed
```

If `_merged_from`/logs exist, preserve alias/history annotation and future canonical target. Do not invent a perfect historical source node if it was irreversibly lost. Future merges use native non-destructive semantics.

# 50. Migration Invariants

1. Preserve meaning over byte shape.
2. Do not fabricate missing epistemic structure.
3. Legacy fact Proposition becomes v2 Proposition + Assertion.
4. Proposition does not inherit confidence.
5. Unknown metadata remains explicitly legacy.
6. Source string is not automatically Evidence.
7. Author string is not authenticated Principal.
8. `$self` is not Principal.
9. `$system` is not admin authority.
10. Domain is not Space.
11. `expires_at` is retention, not valid time.
12. Confidence decay does not survive as native truth decay.
13. Legacy destructive merge is not native merge.
14. Legacy export is not native Capsule.
15. Schema graph nodes are not native authoritative Schema.
16. Migration must be idempotent.
17. Preview does not commit.
18. Source and target histories remain distinct.
19. Uncertain mappings are surfaced.
20. Success requires semantic verification, not count equality alone.

# 51. Final Principle

> **Migration is successful when the KIP 2.0 Brain can explain where its cognition came from without claiming that the old Brain knew more precisely than it actually did.**
