# KIP 2.0 Brain Runtime

**Normative companion to [SPECIFICATION.md](../SPECIFICATION.md) and the [Cognitive Memory Profile](../profiles/CognitiveMemoryProfile-2.0.md), version 2.0-draft.**

A memory records what a Brain attended to, decided and observed. Running the workers that attend, deciding when they may act, and reconciling an external effect after a crash is execution machinery around that memory. This companion defines that machinery for a runtime advertising `durable_brain_runtime` (Specification §67.4), which a Memory Interface binding advertises beside its levels; `receiver_fencing` (§4) is a further capability on top of it.

Normative keywords follow Specification §0. Nothing here grants authority: a durable worker, a fired Watch and an admitted dispatch are capabilities of the runtime, never permission to act (Specification §31.3).

## 1. Scope

The Profile defines what is recorded: Watch conditions and firing idempotency (Profile §5.11), SleepTasks (§5.9), DecisionRecord and AttemptRecord (§6.4, Validated Learning §2), Outcome Evidence (Specification §15.7). This companion defines the obligations of the runtime that keeps them moving across restarts, concurrency and partial failure. A runtime that does not advertise `durable_brain_runtime` MAY still store and read those records; it MUST NOT claim the guarantees below.

## 2. Durable attention

A Watch's operational state is its **WatchState** Facet: `arm_generation`, `armed_seq`, `condition_digest`, `authorization_view`, `consumed_seq` and match state.

- Re-arming a Watch or changing its condition atomically advances `arm_generation` and resets its coverage interval. Firing keys include the generation — `watch_fire:<id>:<generation>:<seq>` for a delta Watch and `watch_fire:<id>:<generation>:silence:<due_at>` for a silence Watch — so a stale worker cannot fire a newer arm.
- Structured condition selectors combine by AND; an array in `ops` or `touched` matches any member; an omitted filter imposes no restriction. A text-only condition requires an explicit Brain evaluator and is never evaluated by the runtime.
- A silence Watch covers `(armed_seq, due_seq]` under its pinned condition and authorized observation scope, and MAY fire only after the evaluator holds a complete stream watermark through the deadline. A filtered stream MUST provide a completeness watermark: a sequence gap is not proof of silence. Stream truncation or an authorization change requires resynchronization and a new coverage basis, never a silent false alarm.
- Incoming matches, deadline resolution, progress and firing survive restart. A time-dependent basis schedules validation work at its `next_invalid_at` (Specification §21.12) without fabricating Change Envelopes for expired Assertions.
- A delta Watch still needs a matching commit, and a silence Watch still needs complete authorized coverage, however the runtime schedules them.

Control-plane commits carry governed `control_changes` entries (Specification §36.1). Complete and filtered stream consumers receive a governed coverage watermark and an authorization-view binding; missing entries or sequence gaps alone do not prove silence.

## 3. Leased work

A SleepTask's **LeaseState** Facet records the authenticated owner, a monotonically increasing `fencing_token`, `expires_at` and the attempt count.

- Acquisition and takeover are compare-and-set transactions. A worker whose lease expired, or whose token was replaced, MUST NOT complete the task or obtain a new dispatch admission.
- Authorized ready workers MAY reclaim expired running work. Terminal writes and their outputs are atomic and retry-safe.
- Backlog budgets defer work with a checkpoint; they never silently drop it.

## 4. External actions

An attempt and its dispatch intent are durably enqueued before any external action (Specification §62). The executor uses the `attempt_id` as its external idempotency key and, immediately before dispatch, rechecks Governance, revision authority, the original revision-selection preconditions, the dependency basis (Specification §57.6) and the lease fence. A newer `current_revision` MUST NOT silently replace or validate the revision the recorded decision chose.

After a crash the executor queries or retries the **same** external identity, never a fresh one. If the external system supports neither idempotency nor outcome lookup, the state is `outcome_unknown` and automatic redispatch is forbidden: reconcile, or ask, under policy. KIP never claims exactly-once external effects from its own atomicity. An independent instrument records the returned outcome against that same attempt.

A **DispatchContract** declares one of two guarantees:

```text
admission         linearizes at the runtime's atomic native dispatch admission
receiver_fenced   linearizes at acceptance by the effect-owning receiver
```

Under `admission`, the durable permit pins the attempt and request identity, the resource, the revision, the fence and an expiry. Revocation prevents later admissions; an operation already admitted and in flight MAY still finish. No sender-side "last check" promises that a remote receiver will reject a delayed request after takeover, and idempotency deduplicates an attempt, not stale authority.

`receiver_fencing` is the additional end-to-end capability. The actual effect-owning receiver verifies an authenticated, resource- and request-bound permit and the current fencing epoch and expiry, atomically with acceptance and deduplication; its registered binding and enforcement scope are pinned. A gateway that checks and then forwards to an unfenced service cannot claim it. A takeover or epoch change becomes effective at the receiver only once it has reached the receiver's authoritative acceptance state.

Receivers without that contract advertise `admission` only, and the executor keeps the `outcome_unknown` and same-attempt reconciliation behavior. Neither guarantee rolls back an effect already accepted at its declared linearization point.

## 5. Acceptance

Tests pause execution after native admission and before receiver acceptance, then exercise takeover, revocation, delay, duplicate delivery and restart (REL-007). Watch generations, watermarks and leases are pinned by MEM-009 and the bounded model `formal/watch/check_watch.py`; the reliable-runtime gate of [BrainEvaluation](./BrainEvaluation.md) §2 injects the remaining faults.
