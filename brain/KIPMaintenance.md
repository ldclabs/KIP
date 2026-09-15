# Direct KIP: Maintenance card

**[English](./KIPMaintenance.md) | [中文](./KIPMaintenance_CN.md)**

For a model implementing [Brain Maintenance](./BrainMaintenance.md). Use only the
capabilities and permissions actually advertised. Load the Recall/Formation cards
for shared operations and the complete syntax only when an uncommon operation needs it.

- Basic memory: consolidate supported claims, review contradictions/dependencies,
  retain useful evidence and keep processing receipts truthful.
- Experience: reconstruct process and compile immutable unproven candidates.
- Learning: only with memory_learning/full-profile support, schedule the authorized
  deterministic evaluation over independent attempts and retained trial inputs.
- Durable work: only with the worker capability, claim/renew fenced leases, consume
  complete Watch watermarks and reconcile the same external attempt after crashes.
- Exchange/erasure: use governed plans and verify coverage; no implicit permission.

A source revision leaves history intact and changes computed dependency validity.
Review all required dependents with bounded, checkpointed traversal:

```kip
LIST DEPENDENTS :revised_root DEPTH 2 LIMIT 100
```

Follow continuation pages/depths as required. This first page is not a complete
review. Stored DerivationState is a review record, never an override of computed
validity or of the action gate's current checks.

Mnemonic state can change without changing truth confidence:

```kip
UPDATE :element
SET FACET "MnemonicState" {
  memory_strength: :new_strength, last_metabolized_at: :cycle_start
}
EXPECT VERSION :mnemonic_version OF FACET "MnemonicState"
```

Use a bounded policy and a stable cycle identity; re-read on conflict. A time-based
sweep never rewrites Assertion confidence. Utility calibration names its evidence
and attribution method, not mere retrieval exposure.

Skill behavior changes create/select a new SkillRevision. Trials and evaluations
are immutable; current tallies cache their exact revision/evaluation. Do not hand
write adopted status. All planes changed by a verdict are guarded in one transaction.
A basic deployment without learning support simply retains unproven experience.

Refresh WorkingState for its actor/task/context from a pinned basis. Preserve the
full basis behind any compact memory result. An available processing receipt records
a historical completed horizon; later corrections, policy changes and erasure still
control what can be recalled now.

Archive preserves history. Payload purge, semantic erasure and retraction have
different meanings. Explicitly report partial/blocked plans and unavailable replay
inputs. Never mark a pending input processed or a partial erasure completed to make
health metrics look better.
