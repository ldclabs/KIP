# KIP v2 Design Review Resolution

**2026-09-06 — all twelve review items addressed in this repository.**

Scope: current English normative documents, standard Profile package, reference
Brain policies, language toolkit, schemas, fixtures, contract oracles, finite models,
adapter runner and CI. Chinese mirrors and the frozen design notes are unchanged.
This is a draft-contract revision, not a deployment of external Nexus engines or
an empirical claim that a Brain has learned.

## Resolution map

| Item | Resolution | Primary artifacts | Acceptance |
| --- | --- | --- | --- |
| R1 | Final BELIEF incorporates applicable slot conflicts; candidate status is diagnostic | [Consistency §1](./KIP-2.0-Cognitive-Consistency.md#1-conflict-complete-belief), [projection schema](./schemas/kip-projection.schema.json) | MEM-001; SCHEMA-020 revised; grounded/non-functional oracle cases |
| R2 | Stable Skill selects immutable SkillRevision; standing, grades and authority bind revision/digest | [Profile](./profiles/CognitiveMemoryProfile-2.0.md), [package 2.1.0](./profiles/cognitive-memory-2.1.0.schema.json) | MEM-002; revision-reset and authorized-rule checks |
| R3 | Decisions, attempts and observations have distinct identities; quota counts independent attempt aggregates | [Consistency §5](./KIP-2.0-Cognitive-Consistency.md#5-revision-attempt-trial-and-evaluation-identities), [record schemas](./schemas/kip-cognitive-records.schema.json) | MEM-003; observation-fan-out fault injection |
| R4 | Protected evaluation policy; explicit comparable controls, sampling/correlation, missingness and uncertainty | [Consistency §6](./KIP-2.0-Cognitive-Consistency.md#6-comparable-learning-not-just-repeatable-arithmetic) | MEM-004/019/022; aggregate-reversal, missing-stratum and unauthorized-rule tests |
| R5 | Immutable TrialRecord/EvaluationRecord and retained exact replay artifacts; mutable states are pointers/caches | [Profile §6](./profiles/CognitiveMemoryProfile-2.0.md#6-standard-facets) | MEM-005/020; late-outcome, re-trial, correction and retained-replay checks |
| R6 | Producing/validation Activities pin read inputs; virtual dependency validity gates use before maintenance | [Consistency §3](./KIP-2.0-Cognitive-Consistency.md#3-dependency-validity-without-rewriting-history) | MEM-006; immediate correction, alternative-support and hidden/unavailable-source checks |
| R7 | Complete ProjectionBasis, exact context matching and half-open intervals | [Consistency §2](./KIP-2.0-Cognitive-Consistency.md#2-projectionbasis-context-and-clocks) | MEM-007; exact boundary, invalid interval, context and cache-coordinate tests |
| R8 | Protected, version-guarded identity-decision withdrawal; preserve supplied references and ambiguous review set | [Consistency §4](./KIP-2.0-Cognitive-Consistency.md#4-repairable-identity-and-portable-keys) | MEM-008; repair oracle and merge-pointer write rejection |
| R9 | Watch generations/coverage, leases/fencing, durable intent and same-attempt reconciliation | [Consistency §7](./KIP-2.0-Cognitive-Consistency.md#7-durable-attention-work-and-external-actions), [Maintenance](./brain/BrainMaintenance.md) | MEM-009; Watch finite model and restart/fence/recovery contract cases |
| R10 | Compression omissions/re-encoding, separate recall channels, coverage and semantic ErasurePlan | [Consistency §8](./KIP-2.0-Cognitive-Consistency.md#8-encoding-recall-coverage-and-erasure) | MEM-010/023/024; partial/held erasure and typed coverage/erasure records |
| R11 | Portable numeric domain; strict JSON/JCS-safe canonicalization and pinned artifact digests | [canonical.ts](../packages/kip-lang/src/canonical.ts), [lower.ts](../packages/kip-lang/src/lower.ts), [digest tool](./conformance/update-digests.mjs) | MEM-011; exact-number, underflow, Unicode, duplicate-key, property-preservation and artifact golden checks |
| R12 | Normative Profile status, complete invariant-to-vector mapping, typed artifacts, adapter and separate learning gate | [conformance guide](./conformance/README.md), [Brain evaluation](./brain/BrainEvaluation.md) | MEM-012–025; vector/report/schema checks and CI |

The catalogue now has **356 portable vectors**, **43 Core invariants** and
**46 Profile invariants**. Every Profile invariant has a vector; this mapping does
not imply that every vector has already been run against an external engine.

## Compatibility and implementation boundary

- Core still has five element kinds. New process contracts use Concepts, Activities
  and Facets, and existing KQL/KML shapes; no new untyped mutation language is added.
- The current package is `kip://profiles/cognitive-memory@2.1.0`. The original
  2.0.0 artifact is retained byte-for-byte for migration. Exact package references
  are not overwritten with different content. Older Skill data is not assigned
  fabricated revisions, trial enrollment or verified current standing.
- `kip-jcs-safe-v1` is a new explicit canonicalization identity. Previous draft
  digests require an explicit legacy verifier; relabeling them is not migration.
- Integer-valued numbers outside ±9007199254740991 and nonzero underflow now fail
  rather than silently changing value. Larger exact values use declared string/value
  object schemas. This tightens the previous language draft and must be handled by
  clients that relied on the older numeric domain.
- `identity_repair` and `durable_brain_runtime` are advertised capabilities; the
  standard memory Profile requires dependency validation. Unsupported contracts
  fail explicitly. Record/schema validation and protected evaluation policy are
  engine obligations, not proof supplied by an Activity class name.

External Rust/Cloudflare implementations need their own adapter results for this
revision. The repository's oracles and finite models do not implement a production
Nexus and are never reported as one. The Brain evaluation template remains `not_run`
with no measured score; real task improvement is a separate controlled experiment.

## Verification

See [the consistency verification report](./formal/CONSISTENCY-REPORT.md) for the
actual checks and explicit skips. Local commands and engine adapter requirements
are documented in [conformance/README.md](./conformance/README.md).

## Follow-up review of commit 6437e96

The five follow-up findings are corrected in the unreleased 2.1.0 draft. Existing
published 2.0.0 bytes remain unchanged; the current package and golden Capsule pins
are regenerated together.

| Finding | Correction | Regression coverage |
| --- | --- | --- |
| Missing transitive validation-schema pin | Generate the complete local reference closure by actual `$id`, including the HTTPS Change Envelope ID; verify the lock and Capsule package dependency as well as artifact digests | Fresh Ajv instance compiles only manifest-pinned schemas; resolver handles transitive references/cycles and rejects missing resources; MEM-012 strengthened |
| Ungraded Skills excluded by procedural recall | Proposed/trialed Skills without GradingState remain unproven candidates; existing grades must match the selected revision and validated evaluation; unverifiable adopted claims cannot become validated recommendations | Recall oracle covers absent/current/stale grades, missing evaluations and revoked warnings; MEM-023 strengthened |
| Monitoring incorrectly required a new promotion | Encode legal state pairs and separate same-state monitoring from trialed → adopted promotion; retaining adoption still identifies its trial and preserves prior adoption evidence under the authorized policy | Schema accepts sparse/insufficient monitoring while rejecting promotion with insufficient/duplicate samples or no trial; bounded model detects the old monitoring quota bug |
| Revoked Skills could promote directly | Promotion requires current trialed standing; revoked re-entry selects a new trial before adoption can recur | Schema state-pair matrix, promotion oracle and bounded model reject direct proposed/revoked adoption and preserve reachable promotion after re-trial; MEM-018 strengthened |
| Package constraints retained obsolete grading semantics | TrialRecord freezes the comparison basis; TrialState is only a pointer/cache. Family membership establishes neither attribution nor control membership, and utility needs recorded actual-use attribution | Package constraints, hints and current English architecture/learning examples aligned; independent-attempt, revision/trial and retained-replay checks remain passing |

The finite lifecycle model contained the same promotion/monitoring shortcuts; it
now covers all four starting states and includes fault modes for both. This is
contract/model verification, not a measurement of an external Brain's learning.
