# Memory Interface acceptance scenarios

**Normative for an advertised Memory Interface binding.** These scenarios test the
five intents through the real Brain Adapter, not only underlying transaction state.
MIF-013–020 are positive memory-quality scenarios: they check that the memory
answers correctly, not only that it refuses to lie.
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

Run with `node conformance/run.mjs --suite interface --adapter /path/to/adapter.mjs`.
Runtime output budgeting uses the declared real tokenizer. Model-only tests do not
measure latency, token cost or semantic formation quality.

## KIP2-MIF-001 — Minimal memory and truthful bundle discovery

Advertise memory_interface with memory_basic and its prerequisites. Complete ordinary observation, scoped recall, correction, descriptive feedback and governed forgetting without opening a trial. A raw type being installed does not advertise learning. Attempt a learning operation without memory_learning and an unknown required bundle; both fail UnsupportedCapability. Also exercise invalid bundle dependency declarations. Also connect a memory_basic binding to a Space with an authorized, relevant failed Experience retained through raw KIP. If the binding cannot serve that channel, report failures=incomplete and action_eligible=false, never not_applicable merely because memory_experience is unadvertised.

Expected observations: basic_intents_usable=true, learning_without_bundle="UnsupportedCapability", invalid_bundle_rejected=true, unserved_retained_failures="incomplete", unserved_retained_action_eligible=false.

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

## Positive memory scenarios

## KIP2-MIF-013 — A new fact becomes recallable

Observe a user statement of a new durable fact. Once its receipt is available, an answer recall states the fact as accepted, cites the source, and satisfies the after barrier. Before availability the same recall is pending, never an answer without the fact presented as complete.

Expected observations: accepted_after_available=true, cited_source="source-13", pending_before_available=true.

Durable postconditions: fact_assertions=1.

## KIP2-MIF-014 — A correction changes the answer

Observe "my timezone is +08:00", then revise with change_kind correction ("I meant +07:00"). Recall answers +07:00; the old Assertion is superseded by the same actor and remains in history; FOR TIME queries also answer +07:00 because the old claim was never true. The correction explicitly preserves the original world interval (a missing original start becomes `{latest: <original asserted_at>}`) while its `asserted_at` is the correction time. Query a world time after the original statement and before the correction.

Expected observations: answer="+07:00", old_lifecycle="superseded", historical_answer="+07:00".

Durable postconditions: supersession_count=1.

## KIP2-MIF-015 — A world change answers old and new times

Observe "I live in Beijing", then revise with change_kind world_change ("I moved to Shanghai on 2026-09-01"). The Brain writes one Assertion from the move; recall now answers Shanghai, recall with time.valid_at before the move answers Beijing, and nothing is superseded or retracted. Then observe a late-processed old message ("I live in Beijing", said in 2026-03) after the move: the Adapter writes it with the time it was said as `asserted_at`, so recall still answers Shanghai — recording order never decides.

Expected observations: answer_now="shanghai", answer_before_move="beijing", assertions_written_by_revise=1, late_history_displaces=false.

Durable postconditions: supersession_count=0.

## KIP2-MIF-016 — A preference changes within its kind

Observe "I prefer dark mode" and "I use vim", then "I prefer light mode now". The options are Concepts typed by their kind (a color scheme, an editor) from a domain package or the draft vocabulary, never a catch-all type. Recall reports light mode and vim as current preferences; dark mode is a past preference, not a contradiction, and the editor preference is untouched.

Expected observations: current_preferences=["light", "vim"], contested_count=0.

Durable postconditions: retracted_count=0.

## KIP2-MIF-017 — A misrecording is repaired, never an actor withdrawal

The Brain recorded that Alice is vegetarian from a message that said nothing of the kind. Revise with change_kind misrecorded. Where recording_repair is advertised the extraction is invalidated through recording repair and recall no longer states it; Alice's history shows no retraction or supersession. Where it is not advertised the request fails UnsupportedCapability (or is quarantined under a quarantine grant) and is never mapped to a correction.

Replacement variant (requires recording_repair): Alice said dark at 2026-01-01T00:00:00.000Z, but the Brain extracted another preference. She actually changed to light at 2026-09-01T00:00:00.000Z, with that exact valid_time.from written on the September Assertion. A newly captured repair request at 2026-09-24T00:00:00.000Z corrects only the January extraction. With no written valid_time.from on the January claim or its replacement, the replacement takes asserted_at from the January source, so recall at the January statement returns dark and current recall at 2026-09-25T00:00:00.000Z still returns light; the repair request is not a new preference statement.

The vector requires `recording_repair`: an adapter that does not advertise it reports the whole scenario `SKIP_UNSUPPORTED` and never exercises the refusal; on one that does, `without_capability` is the refusal a Brain returns when its Nexus withholds the capability.

Expected observations: actor_withdrawal_recorded=false, recall_states_misrecording=false, without_capability="UnsupportedCapability", repaired_past_preference="dark", repaired_current_preference="light".

Durable postconditions: source_bytes_preserved=true, replacement_asserted_at="2026-01-01T00:00:00.000Z".

## KIP2-MIF-018 — An unasked constraint surfaces

Observe "never deploy on Fridays" in a task scope. Later ask, in the same task and with mode action, for help scheduling a deployment on 2026-09-25 (a Friday) without mentioning the constraint. The briefing includes the constraint as a critical warning with complete constraints coverage; with its channel truncated, action_eligible is false.

Expected observations: constraint_surfaced=true, constraints_channel="complete", truncated_action_eligible=false.

Durable postconditions: recall_writes=0.

## KIP2-MIF-019 — A due Commitment reaches attention recall

Observe "remind me to call Bob if he has not replied by Thursday". After the silence deadline passes with complete coverage and no reply, recall with mode attention returns one watch_fired item and a new cursor; repeating the recall with that cursor returns nothing new. Consuming the item changes no memory, and the item authorizes nothing.

Expected observations: items_first=1, items_after_cursor=0, item_kind="watch_fired".

Durable postconditions: recall_writes=0.

## KIP2-MIF-020 — Unknown is not no

Recall a fact that was never observed ("Is Alice vegetarian?"). The answer discloses insufficient basis rather than a negative, and a stated rejection by Alice is reported as rejected. The two are never conflated.

Expected observations: never_observed_status="insufficient", stated_rejection_status="rejected".

Durable postconditions: recall_writes=0.
