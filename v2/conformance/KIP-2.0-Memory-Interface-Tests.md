# Memory Interface acceptance scenarios

**Normative for an advertised Memory Interface binding.** These scenarios test the
five intents through the real Brain Adapter, not only underlying transaction state.
They add no Core kind and do not claim the full Cognitive Memory Profile.

Use the core-basic fixture in an isolated Space. The harness captures immutable
source events and resolves authorized task/context handles before invoking the
binding; source text, Principals and task mappings are never silently invented by
the model. Select known task Concepts or explicitly create the fixture contexts.
Each case resets state. Fault hooks pause real workers/indexing/erasure as described.

`vectors/interface/*.json` pins normalized observations and durable postconditions.
The harness action is exercise_memory_interface_scenario with its vector id. Retain
raw binding requests/responses, underlying KIP receipts and independent state reads.
The local progress model is a separate evidence source and cannot certify an engine.
Declare memory_interface only when the binding is available; these OPTIONAL cases
become obligations when it is advertised. A missing required bundle is a failure,
not a reason to skip that case.

Run with `node v2/conformance/run.mjs --suite interface --adapter /path/to/adapter.mjs`.
Runtime output budgeting uses the declared real tokenizer. Model-only tests do not
measure latency, token cost or semantic formation quality.

## KIP2-MIF-001 — Minimal memory and truthful bundle discovery

Advertise memory_interface with memory_basic and its prerequisites. Complete ordinary observation, scoped recall, correction, descriptive feedback and governed forgetting without opening a trial. A raw type being installed does not advertise learning. Attempt a learning operation without memory_learning and an unknown required bundle; both fail UnsupportedCapability. Also exercise invalid bundle dependency declarations.

Expected observations: basic_intents_usable=true, learning_without_bundle="UnsupportedCapability", invalid_bundle_rejected=true.

Durable postconditions: ordinary_input_opened_trial=false.

## KIP2-MIF-002 — Persisted input is not processed memory

Capture a changed fact as source-77 and durably acknowledge recorded intake, then pause formation. A recall after that receipt at a fresh database/index sequence reaches its deadline. It must disclose pending input and cannot silently return the old fact as a complete current answer. Resume formation and make exact or index-backed recall available, then repeat the barrier.

Expected observations: before_formation_satisfied=false, before_formation_action_eligible=false, after_formation_satisfied=true.

Durable postconditions: intake_count=1.

## KIP2-MIF-003 — Out-of-order formation does not skip input

Admit A then B. Complete B first at a later Space sequence. A recall after both receipts must still wait/report A as pending. Complete A and repeat. Repeat with processed A whose index lags; either canonical/source fallback includes its terminal disposition or the barrier remains pending.

Expected observations: later_sequence_satisfied_A=false, both_available_satisfied=true, index_lag_not_silently_ignored=true.

Durable postconditions: unprocessed_A_marked_available=false.

## KIP2-MIF-004 — Evidence-only and skipped dispositions are explicit

Preserve an unresolved actor/Schema observation as Evidence-only and explicitly skip an irrelevant event. Both may finish processing, but neither is presented as accepted knowledge or validated learning. Recall the Evidence-only source through ordinary evidence recall with its unresolved interpretation. A deferred event remains pending.

Expected observations: evidence_only_retrievable=true, evidence_only_disposition="evidence_only", skipped_disposition="skipped", deferred_satisfied=false.

Durable postconditions: invented_assertion_count=0.

## KIP2-MIF-005 — Intake retries survive restart

Observe a captured immutable source under a logical idempotency key; restart after durable intake and again after formation. Retry with the same scope/input/source but a different transport request_id and output budget. Return the original acknowledgement without another extraction. Reuse the key with changed source bytes or changed task scope; return IdempotencyConflict. Current progress remains separately readable.

Expected observations: same_acknowledgement=true, changed_source_error="IdempotencyConflict", changed_scope_error="IdempotencyConflict".

Durable postconditions: intake_count=1, formation_count=1.

## KIP2-MIF-006 — Scopes and progress handles do not grant access

Record a task-A-only instruction, then recall in task B and in global scope; neither treats it as a permanent global preference. Use a task-A recall with the correct context to retrieve it. Probe a progress receipt as another Principal/Space and require an existence-neutral error. Recall with transient context and compare durable state before/after.

Expected observations: other_task_instruction_returned=false, task_A_instruction_returned=true, foreign_receipt_error="NotFoundOrNotVisible".

Durable postconditions: transient_context_persisted=false, recall_reinforced_memory=false.

## KIP2-MIF-007 — Compact results preserve warnings and processing coverage

Set an output budget under the advertised tokenizer and a short deadline. Supply high-scoring ordinary memories plus a relevant critical constraint. The serialized successful model-facing result counts metadata too. Retain the constraint or return incomplete coverage and prohibit unsupported automatic use. An impossibly small budget returns ResultLimitExceeded, not silent omission; unknown tokenizer fails UnsupportedCapability.

Expected observations: bounded_or_limit_error=true, critical_constraint_or_incomplete=true, unsupported_tokenizer_error="UnsupportedCapability".

Durable postconditions: truncation_reported_complete=false.

## KIP2-MIF-008 — Feedback is not an automatic grade

Through memory_basic feedback, record the acting Agent reporting success. It remains agent_statement and does not promote a Skill. Where learning is enabled, separately test authorized instrument feedback with the actual attempt/decision and pinned observer configuration. An arbitrary input role or different Principal name alone must not manufacture validated learning.

Expected observations: self_report_class="agent_statement", self_report_validated=false, forged_source_role_rejected=true.

Durable postconditions: self_report_promotions=0.

## KIP2-MIF-009 — Forget acknowledgement is not completed erasure

Request semantic forgetting of an exact source-backed memory. Pause controlled backup/summary erasure after removing raw bytes. The binding returns pending/partial coverage and no successful available erased disposition. Complete all in-scope surfaces and verify completion. A hold returns blocked/error and an unavailable plan must not be fabricated.

Expected observations: partial_reported_completed=false, complete_after_all_surfaces=true, hold_blocks_completion=true.

Durable postconditions: in_scope_copies_after_completed=0.

## KIP2-MIF-010 — Evidence expansion pins a result and rechecks access

Recall an item at sequence N, change its current value, then expand the item reference. Expansion returns the retained version/basis from N or explicitly reports unavailable, never silently the newer value. Revoke access or erase the retained evidence and repeat. Opaque item/basis refs never confer access or recreate erased data.

Expected observations: expansion_preserves_basis=true, revoked_access_disclosed=false, erased_expansion_unavailable=true.

Durable postconditions: expansion_writes=0.

## KIP2-MIF-011 — Factual use differs from procedural adoption

Recall an authorized accepted dietary preference with descriptive authority and use it as factual input to a recommendation within scope. It needs no Skill trial. Separately retrieve procedural instructions without adoption/execution authority; neither their content nor an available processing receipt enables dispatch. Unproven/revoked procedures remain labeled.

Expected observations: authorized_fact_usable_as_data=true, procedure_auto_authorized=false, unproven_procedure_labeled=true.

Durable postconditions: fact_use_created_trial=false, unauthorized_dispatch_count=0.

## KIP2-MIF-012 — Failed and expired progress never satisfy after

Fail processing after source intake; an after recall reports failure/pending coverage rather than assuming the old fact is current. Probe expired/unknown retained progress and require explicit unavailability. A receipt that was available before later correction/erasure still names that processing horizon but does not bypass current dependencies, authority or retention.

Expected observations: failed_receipt_satisfied=false, unknown_progress_satisfied=false, old_availability_bypasses_current_checks=false.

Durable postconditions: erased_content_recreated=false.
