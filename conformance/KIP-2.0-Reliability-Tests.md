# Memory reliability acceptance scenarios

These scenarios bind the 2026-09-23 contract and package 2.2.0. They are separate from the earlier memory/interface suites. Optional cases become required when their capability is advertised. The local reference functions are contract models; engine adapters must execute real paths and retain raw responses and independently inspected postconditions.

Run `node conformance/run.mjs --suite reliability --list` or supply an engine adapter. Existing Anda Brain tests establish mechanism evidence for its pinned implementation, not a PASS for these new scenarios.

## KIP2-REL-001 — Canonical timestamp agreement

Reject missing/finer fractions, offsets, lowercase separators, leap seconds and invalid calendar dates through commands, bound values, wire records and imported artifacts; accept leap-day UTC milliseconds.

Expected observations: `{"noncanonical_accepted": false, "invalid_calendar_accepted": false}`.

Durable postconditions: `{"rejected_input_writes": 0}`.

## KIP2-REL-002 — Selection dependencies include new opposition and absence

Derive a deployment recommendation from accepted health and an empty blocker query. Add opposition/new blocker without editing pinned positive records; read before maintenance. Re-evaluate every applicable selection at the same basis.

Expected observations: `{"after_new_opposition": "needs_review", "after_new_blocker": "needs_review"}`.

Durable postconditions: `{"old_assertion_unchanged": true}`.

## KIP2-REL-003 — Relevant planes and temporal boundaries

Change only MnemonicState on a pinned prerequisite, then change lifecycle and advance to the next temporal boundary. Capture real plane/output pins; unrelated annotations must not remove semantic certification.

Expected observations: `{"mnemonic_change_invalidates": false, "lifecycle_change_invalidates": true, "boundary_revalidated": true}`.

Durable postconditions: `{"behavior_unchanged": true}`.

## KIP2-REL-004 — Recording repair without source withdrawal

A recorder misextracts a negated user statement. Repair against the same digest/locator with permission and CAS. Reject an unrelated recorder and an unauthorized replacement actor; current recall excludes the bad extraction.

Expected observations: `{"source_corrected": false, "actor_withdrawal_fabricated": false, "unauthorized_repair": "NotAuthorized"}`.

Durable postconditions: `{"original_payload_preserved": true}`.

## KIP2-REL-005 — Causal formation convergence

Capture three causally linked corrections. Exercise all six arrival/completion permutations, restart between admission and completion, fail a predecessor, and replay source events. Verify the actual final belief, not only receipt phases.

Expected observations: `{"all_orders_final_value": "latest", "failed_predecessor_blocks": true}`.

Durable postconditions: `{"retry_duplicate_count": 0}`.

## KIP2-REL-006 — Prospective cohort with future controls

Open a prospective trial with an enrollment artifact and no outcomes. Assign both arms before execution, deliver observations out of order, omit one result, and freeze the complete cohort at cutoff. Reject post-outcome assignment, switched arms and omitted enrolled units.

Expected observations: `{"future_control_supported": true, "missing_attempt_accounted": true, "post_outcome_assignment_rejected": true}`.

Durable postconditions: `{"trial_record_unchanged": true}`.

## KIP2-REL-007 — Receiver enforcement after sender admission

Pause after native dispatch admission. Advance the authoritative receiver epoch by takeover; deliver the old request, then repeat the valid request. Reject expired/resource-mismatched permits and changed-payload reuse.

Expected observations: `{"old_request_rejected": true, "duplicate_result": "replayed"}`.

Durable postconditions: `{"external_effect_count": 1}`.

## KIP2-REL-008 — Recall plan completeness

Retrieve optional experiences approximately and mandatory constraints exactly. Place the critical constraint outside similarity top-k. Record selector/basis/watermarks and return partial on exact-channel truncation or unresolved source interpretation.

Expected observations: `{"critical_constraint_or_incomplete": true, "approximate_is_semantically_exhaustive": false}`.

Durable postconditions: `{"false_action_eligibility_count": 0}`.

## KIP2-REL-009 — Uniform task scope

Form Evidence, Assertions, Events and Commitments in two tasks of one actor, with opposite temporary constraints. Rebuild independent WorkingStates; cross-task generalization requires a separate scoped derivation.

Expected observations: `{"task_A_context": "A", "task_B_context": "B", "implicit_global_preference": false}`.

Durable postconditions: `{"recall_scope_writes": 0}`.

## KIP2-REL-010 — Hidden-dependent noninterference

Compare two fixtures with identical authorized state and one additional undiscoverable dependent. LIST DEPENDENTS rows, truncation and scope diagnostics must be identical; a privileged global review remains independent.

Expected observations: `{"visible_results_equal": true}`.

Durable postconditions: `{"hidden_identity_disclosed": false}`.

## KIP2-REL-011 — Read-only lazy strength

For an advertised lazy mnemonic policy, evaluate one and two half-lives, repeat recall, then restart. Effective strength changes with declared time; no cognitive write, confidence change or synthetic reinforcement occurs.

Expected observations: `{"one_half_life": 0.4, "two_half_lives": 0.2}`.

Durable postconditions: `{"read_writes": 0}`.

## KIP2-REL-012 — Applicability without comparative standing

Record a successful ProcedureAssessment under the authorized criterion. Preserve proposed standing and absent local grade; an author-written assessment may not become a lifecycle verdict or execution permit.

Expected observations: `{"assessment_result": "satisfied", "standing": "unproven"}`.

Durable postconditions: `{"promotion_count": 0}`.

## KIP2-REL-013 — Session barrier retention

Capture A and B, finish B first, checkpoint/restart the host session, recall without model-written after. A remains a pending barrier. Account for receipts individually; overflow fails without dropping intake state.

Expected observations: `{"pending_A_preserved": true, "foreign_receipt_rejected": true}`.

Durable postconditions: `{"lost_receipts": 0}`.

## KIP2-REL-014 — Scoped ASSERT equivalence

Execute scoped ASSERT and the explicit ensure/create form in isolated equivalent fixtures. Compare immutable context refs, evidence, scope eligibility and supersession; the omitted context remains general.

Expected observations: `{"desugared_state_equal": true, "scope_preserved": true}`.

Durable postconditions: `{"extra_elements": 0}`.

## KIP2-REL-015 — Immutable package resource closure

Activate the current package only from its digest-pinned schema closure, then separately verify the retained 2.1.0 package against its original resources. A shared cache must not substitute resources with different digests.

Expected observations: `{"current_lock_complete": true, "legacy_digests_unchanged": true}`.

Durable postconditions: `{"unverified_schema_loads": 0}`.

## KIP2-REL-016 — Cross-engine reference and restore history

Exchange a Capsule with nested DependencyBasis/Decision/Trial/Evaluation references. Preserve original source bases/replay bytes, map only declared reference paths, report missing artifacts and leave current standing unproven until destination validation.

Expected observations: `{"source_basis_preserved": true, "text_not_rewritten": true, "automatic_standing_transfer": false}`.

Durable postconditions: `{"automatic_authority_transfer": false}`.

## KIP2-REL-017 — Rebuildable caches and lineage

Drop stored grading/currentness materializations and rebuild from revision/trial/evaluation pointers and immutable records. Verify generated lineage against DependencyBasis and reject conflicting writable duplicates.

Expected observations: `{"rebuilt_grades_equal": true, "conflicting_lineage_rejected": true}`.

Durable postconditions: `{"authoritative_records_unchanged": true}`.
