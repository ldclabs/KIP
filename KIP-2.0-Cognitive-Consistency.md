# KIP 2.0 Cognitive Consistency — relocated

**Informative redirect. This file is no longer a normative companion.**

The Cognitive Consistency contracts were folded into the documents that own their subjects, so that Core semantics live in the Specification and optional machinery lives beside the Brain. Every requirement survives. The headings below keep the former section anchors so existing links resolve.

Two contracts changed while moving: `DerivationState` and `TrialState` were removed in favor of computed dependency validity and the Skill's `current_trial` pointer, GradingState became a computed view, and the four lineage fields became computed views of Activity provenance. See the [revision record](./KIP-2.0-Memory-Brain-Resolution.md).

## 1. Conflict-complete belief

Now [Specification §21.11](./SPECIFICATION.md#2111-final-belief-and-slot-conflicts).

## 2. ProjectionBasis, context and clocks

ProjectionBasis and cache reuse: [Specification §21.12](./SPECIFICATION.md#2112-projectionbasis). Context matching: [§25.3](./SPECIFICATION.md#253-context-matching). World intervals and dates: [§25.2](./SPECIFICATION.md#252-world-intervals), with temporal succession in [§25.4](./SPECIFICATION.md#254-temporal-succession) and time bounds in [§25.5](./SPECIFICATION.md#255-time-bounds). Historical control state: [§48.6](./SPECIFICATION.md#486-historical-control-state).

## 3. Dependency validity without rewriting history

Now [Specification §57.6](./SPECIFICATION.md#576-dependency-validity).

### 3.1 Selection dependencies and precise invalidation

Now [Specification §57.7](./SPECIFICATION.md#577-selection-dependencies).

## 4. Repairable identity and portable keys

Now [Specification §11.5–§11.6](./SPECIFICATION.md#115-identity-repair).

### 4.1 Recording repair is not an actor's change of mind

Now [Specification §57.8](./SPECIFICATION.md#578-recording-repair).

## 5. Revision, attempt, trial and evaluation identities

Now the [Validated Learning companion](./brain/KIP-2.0-Validated-Learning.md) §2–§4.

### 5.1 Fixed baselines and prospective enrollment

Now [Validated Learning §5](./brain/KIP-2.0-Validated-Learning.md#5-fixed-baselines-prospective-enrollment-and-applicability).

## 6. Comparable learning, not just repeatable arithmetic

Now [Validated Learning §6](./brain/KIP-2.0-Validated-Learning.md#6-comparable-learning).

## 7. Durable attention, work and external actions

Now the [Brain Runtime companion](./brain/KIP-2.0-Brain-Runtime.md) §2–§4.

### 7.1 Dispatch admission and external acceptance

Now [Brain Runtime §4](./brain/KIP-2.0-Brain-Runtime.md#4-external-actions).

## 8. Encoding, recall coverage and erasure

Encoding records: [Profile §10.1](./profiles/CognitiveMemoryProfile-2.0.md#101-encoding-records). Recall coverage: [Profile §20.2](./profiles/CognitiveMemoryProfile-2.0.md#202-recall-coverage-and-plans). Semantic erasure: [Specification §60.7](./SPECIFICATION.md#607-semantic-erasure).

### 8.1 Source causality and uniform task scope

Source order: [Memory Interface §5.1](./KIP-2.0-Memory-Interface.md#51-source-order). Task scope: [Profile §20.3](./profiles/CognitiveMemoryProfile-2.0.md#203-memory-scope).

### 8.2 Verifiable recall plans

Now [Profile §20.2](./profiles/CognitiveMemoryProfile-2.0.md#202-recall-coverage-and-plans).

### 8.3 Exchange and rebuildable state

Exchange and restore: [Capsule §41.7](./KIP-2.0-Capsule-Specification.md#417-restore-and-reference-mapping). Rebuildable caches and lineage are now computed views: [Profile §6.2 and §7](./profiles/CognitiveMemoryProfile-2.0.md#7-standard-structural-fields).

## 9. Acceptance and deployment claims

Now [conformance/README.md](./conformance/README.md) and [Specification §89](./SPECIFICATION.md#89-conformance-model).
