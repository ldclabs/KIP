# KIP 2.0 Brain — Memory Maintenance

**[English](./BrainMaintenance.md) | [中文](./BrainMaintenance_CN.md)**

## Status

**Reference Anda Brain Maintenance / Metabolism Policy**

Maintenance is a privileged cognitive process that consolidates, organizes, reviews, and metabolizes memory. Its authority comes from Governance grants to its authenticated Principal; it does not gain authority because a semantic actor is called `$system`. Load `KIPSyntax.md` (the LLM-facing syntax card) alongside this prompt.

# 0. Objective

```text
raw fragments
→ organized memory
→ semantic consolidation
→ procedural consolidation
→ identity cleanup
→ mnemonic metabolism
→ retention management
→ self-model refinement
→ better future Formation / Recall / action
```

Maintenance should improve future cognition without falsifying history.

# 1. Safety Thesis

Maintenance MUST distinguish belief revision, mnemonic weakening, storage lifecycle, identity consolidation, procedural utility, and Governance authority.

Forbidden shortcuts:

```text
time passed → lower Assertion confidence
contradiction → delete one side
suspected duplicate → destructive merge
low memory_strength → purge Evidence
Skill worked often → grant executable authority
semantic $system → administrative permission
```

# 2. Authority Model

Maintenance may be granted read/search/project/maintain/archive/retention/merge permissions depending on deployment. It MUST NOT assume `manage_policy`, `manage_trust`, `manage_schema`, `declassify`, `purge`, `assert_as_actor`, or `elevate_authority` unless explicitly granted.

# 3. Input Contract

```json
{
  "trigger": "scheduled",
  "scope": "full",
  "timestamp": "2026-08-14T03:00:00Z",
  "budgets": {
    "max_elements_reviewed": 5000,
    "max_writes": 500,
    "max_transactions": 100
  },
  "parameters": {
    "memory_strength_decay_factor": 0.97,
    "event_archive_after_days": 30,
    "skill_review_after_days": 14
  }
}
```

Thresholds are Brain policy, not KIP standards.

## 3.1 Triggers

```text
scheduled     every 12-24h
change        a committed delta matches an armed Watch, or a silence Watch's due_at passes
threshold     SleepTask backlog, unconsolidated Events, expired retention,
              a trial's graded-outcome quota reached, an adopted Skill due a re-verdict
on-demand     Formation, or the agent, asks for maintenance
post-session  after a long or high-signal conversation
```

The change trigger is what makes proactivity a state differential instead of a bare schedule: the wake happens because something specific moved — or specifically did not — against a declared expectation. The silence half still needs the due-time sweep the schedule provides.

# 4. Modes

A deployment may retain `daydream`, `quick`, and `full` as implementation metaphors. They are not protocol semantics.

# 5. Cycle

```text
1  Assessment
2  Pending SleepTasks
3  Semantic consolidation
4  Procedural consolidation
5  Mnemonic metabolism
6  Identity review / merge
7  Contradiction review
8  Derivation review
9  Commitment review
10 Watch evaluation
11 SelfModel refresh
12 WorkingState refresh
13 Imported/quarantined cognition review
14 Retention/archive review
15 Tombstone/purge candidates
16 Final health report
```

# 6. Assessment

Read-only probes identify pending tasks, unconsolidated Events/Experiences, Skills due a lifecycle verdict (a trial's graded-outcome quota reached, an adopted Skill past its re-verdict trigger), conflict sets, identity merge candidates, due Commitments, armed Watches at or past `due_at`, `stale`-flagged derived artifacts, low-strength archive candidates, retention expiry candidates, quarantined imports, and SelfModel refresh candidates.

Assessment reads do not update recall/access counters.

Two probes every cycle starts with — the pending work assigned to this actor, and the episodic material nobody has consolidated:

```prolog
FIND(?task.id, ?task.name, ?task.attributes.task_class, ?task.attributes.priority)
WHERE {
  ?task {type: "SleepTask", attributes: {status: "pending"}}
  STRUCTURAL (?task, "assigned_to", ?actor)
  FILTER(?actor.id == :system_id)
}
ORDER BY ?task.attributes.priority DESC, ?task._system.created_at ASC
LIMIT 50
```

```prolog
FIND(?event.id, ?event.attributes.summary, ?event.attributes.started_at)
WHERE {
  ?event {type: "Event"}
  FILTER(?event.attributes.started_at < :cutoff)
  NOT {
    STRUCTURAL (?event, "consolidated_to", ?derived)
  }
}
ORDER BY ?event.attributes.started_at ASC
LIMIT 50
```

Count first, act second.

# 7. Salience and Learning Value

Event salience asks how important an episode is for future memory/self-continuity. Experience learning value asks how likely the trajectory is to improve future behavior. High values may come from correction, major relationship change, commitment, identity milestone, failure/recovery, prediction error, human feedback, counterexample, or novel procedure.

Neither equals confidence.

# 8. SleepTasks

SleepTask is cognitive work description. Verify current Principal authority before acting. `assigned_to = $system` is not authorization. Preserve Activity provenance when completing maintenance work.

Claim a task before working it, so a concurrent cycle cannot double-process it:

```prolog
UPSERT CONCEPT ?task {
  MATCH {type: "SleepTask", key: :task_key}
  SET ATTRIBUTES {status: "running", started_at: :now}
} EXPECT VERSION :version OF ATTRIBUTES
```

`VersionConflict` means another worker took it — re-read and move to the next task. A terminal task is completed with `status: "completed"` and its outcome summary; a failed task records why, and stays visible rather than disappearing.

# 9. Semantic Consolidation

Find clusters of Events/Experiences/Evidence/Assertions that support reusable semantic regularity:

```text
read sources
→ group provenance roots
→ identify candidate Proposition
→ evaluate existing Assertions
→ create derived Assertion if justified
→ record semantic_consolidation Activity
```

Do not rewrite old confidence, delete opposition, or count summaries as independent roots.

One atomic transition, with provenance:

```prolog
MUTATE {
  CREATE CONCEPT ?insight {
    TYPE "Insight"
    CLIENT KEY :insight_key
    NAME "Staging deploys fail without the schema migration step"
    SET ATTRIBUTES {summary: :summary}
    SET FACET "MnemonicState" {memory_strength: 0.7, salience: 0.8}
    SET STRUCTURAL {
      ("derived_from", :source_experience)
      ("about", :deployment_topic)
    }
  }
  ASSERT (:failure_step, "caused_by", :migration_step) {
    by: :self,
    mode: "inferred",
    confidence: 0.7,
    evidence: :step_evidence
  }
  CREATE ACTIVITY ?consolidation {
    SET FIELDS {activity_class: "semantic_consolidation", status: "completed"}
    SET STRUCTURAL {
      ("inputs", :source_experience)
      ("inputs", :step_evidence)
      ("outputs", ?insight)
    }
  }
}
```

Then mark the source consolidated with `consolidated_to` so the next cycle does not re-derive it. The causal claim is an Assertion with Evidence behind it, asserted by the maintenance actor in `inferred` mode — `evidence:` cites Evidence elements, never the Experience Concept they were observed in. Step order alone is never causality, and a Predicate you cannot find in the Schema Environment is never to be invented — `DESCRIBE` first, and let a domain package supply what the Profile does not.

# 10. Repetition

Independent repeated observation may increase support. Same event replay/duplicate import creates no new root. Later user reconfirmation is new Evidence/Assertion. Do not model all repetition as `confidence += x`.

# 11. Procedural Consolidation

Prefer contrastive Experience sets:

```text
success + failure
success + counterexample
same procedure across different contexts
```

Compile applicability, preconditions, procedure, success criteria, failure modes, and counterexamples into a `proposed` Skill + its admission bet in `MnemonicState.utility` + procedural Activity. Attach the required `task_family` — the Outcome Evidence stream the Skill's baseline comes from — and refuse to compile a pattern no stream could prove wrong (store it as an Insight instead). `GradingState` stays empty until outcomes linked to decisions that applied the Skill arrive. Do not grant executable authority.

```prolog
MUTATE {
  CREATE CONCEPT ?skill {
    TYPE "Skill"
    CLIENT KEY :skill_key
    NAME "Deploy with pre-flight migration check"
    SET ATTRIBUTES {
      skill_class: "workflow",
      task_family: "deploy/pre-flight",
      summary: :summary,
      procedure: :procedure,
      status: "proposed"
    }
    SET FACET "MnemonicState" {utility: 0.5}
    SET STRUCTURAL {
      ("compiled_from", :experience_a)
      ("compiled_from", :experience_b)
    }
  }
  CREATE ACTIVITY ?compilation {
    SET FIELDS {activity_class: "skill_compilation", status: "completed"}
    SET STRUCTURAL {
      ("inputs", :experience_a)
      ("inputs", :experience_b)
      ("outputs", ?skill)
    }
  }
}
```

Contrast before compiling: compare successful against failed Experiences to find the discriminating precondition. One success does not prove a general Skill, and a Skill that only ever worked in one context should say so in its applicability rather than in a higher `utility`.

# 12. Skill Lifecycle Verdicts

The lifecycle `proposed → trialed → adopted → revoked` moves only by deterministic verdict over graded Outcome Evidence under the Skill's `task_family` (Profile §14, Spec §15.7): your role is to schedule the verdict, run the deterministic rule, and record the result as a `lifecycle_verdict` Activity plus one guarded UPDATE (Spec F.6) — never to promote on judgment, and never to count an actor's own success report as an outcome.

Verdict discipline: the treatment set is the outcomes linked, through an `outcome_observation` Activity, to an `action_gate` decision that applied the Skill; the baseline is the rest of the family as recorded in `TrialState` when the trial opened — an outcome that merely shares the `task_family` never counts. Adoption is comparative (better than it was going, against that basis) and provisional (the stream keeps grading; demote to re-trial on degradation); revocation is never harder than adoption, and one high-severity matching-condition failure may suffice; re-entry after revocation starts a new trial and writes a fresh `TrialState`.

Legal cognitive actions besides the verdict itself include `GradingState` tallies and `MnemonicState.utility` revisions, a revised Skill artifact, failure-mode addition, counterexample linkage, and narrowed applicability. Authority changes require Governance.

# 13. Mnemonic Metabolism

Generic disuse acts on `MnemonicState.memory_strength`, not Assertion confidence.

Example policy formula:

```text
new_strength = clamp(old_strength × decay + salience protection + explicit reinforcement)
```

`MnemonicState.utility` is calibrated under the same discipline: explicitly, on outcomes — a memory a briefing drew on that helped, a bet that never paid out — never as a side effect of reading. The data path is the decision record: follow an outcome's `outcome_observation` link back to the `action_gate` Activity, and the memories named in its `inputs` are the ones the outcome vindicates or wastes. It is the mnemonic twin of outcome-driven trust calibration (Spec §22.6).

Apply it with `UPDATE ... SET FACET "MnemonicState" { ... }` over a bounded `WHERE` + `LIMIT` sweep (Spec §58), using `CLAMP`/`MUL` update expressions and `EXPECT VERSION` for read-modify-write. Stamp `MnemonicState.last_metabolized_at` in the same statement so a replayed sweep cannot decay the same element twice.

The formula is implementation-specific. Read frequency is not a required protocol signal.

Sweep in bounded batches, one type at a time, stamping `last_metabolized_at` in the same statement so a replay cannot decay the same element twice:

```prolog
UPDATE ?element
SET FACET "MnemonicState" {
  memory_strength: CLAMP(MUL(?element.facets["MnemonicState"].memory_strength, :decay_factor), 0, 1),
  last_metabolized_at: :cycle_start
}
WHERE {
  ?element {type: "Event"}
  FILTER(?element.facets["MnemonicState"].memory_strength > 0.05)
  FILTER(IS_NULL(?element.facets["MnemonicState"].last_metabolized_at) || ?element.facets["MnemonicState"].last_metabolized_at < :cycle_start)
  FILTER(IS_NULL(?element.facets["MnemonicState"].salience) || ?element.facets["MnemonicState"].salience < :protection_threshold)
}
LIMIT 500
```

Bind `:cycle_start` **once** per cycle and reuse it across re-runs and crash retries; re-run a shard until fewer than `LIMIT` elements are affected. The floor keeps the sweep converging.

# 14. Salience Protection

Identity, high-impact Commitments, important relationships, major failures, adopted Skills, autobiographical landmarks, legal-hold cognition, and Governance-protected memory may resist forgetting. Low recall frequency alone is not sufficient reason to weaken a critical Commitment.

# 15. Identity Review

Candidate duplicates may use canonical identity, stable key, strong alias evidence, shared external identifiers, or human review. Name similarity alone is insufficient.

An unverified "these denote the same entity" suspicion is recorded as a `same_as` Proposition + Assertion that feeds review. It never auto-merges and never establishes `canonical_id` by itself; the merge itself is `MERGE CONCEPT ?source INTO ?target`.

Native merge is non-destructive: source remains merged historical identity, old raw Proposition endpoints remain auditable, future canonical writes resolve target.

The suspicion goes through the epistemic path:

```prolog
ASSERT (:concept_a, "same_as", :concept_b) {
  by: :system,
  mode: "inferred",
  confidence: 0.6,
  evidence: :alias_evidence
}
```

Only once identity is actually established:

```prolog
MERGE CONCEPT ?source INTO ?target
WHERE {
  ?source {id: :source_id}
  ?target {id: :target_id}
}
```

A merge that would create a cycle is rejected.

# 16. Contradiction Review

Classify disagreement:

```text
different actors disagree
same actor changed belief
different valid times
schema-functional conflict
source correction/error
stale imported cognition
```

Different actors normally remain coexisting Assertions. Same-actor explicit revision — the earlier claim was wrong — may supersede. Different valid times coexist; a claim that was true and then stopped being true is closed by a re-assertion with `valid.until` plus a new Assertion from the change, never superseded for being wrong (Spec §14.2). Evidence correction creates correction lineage. Moderation uses Governance quarantine (Spec §31.6) and must not forge source retraction.

Inspect the raw record, not the projection, when auditing:

```prolog
FIND(?assertion.id, ?assertion.asserted_by, ?assertion.confidence, ?assertion.asserted_at, ?value)
WHERE {
  ?person {id: :person_id}
  ?proposition (?person, "timezone", ?value)
  ?assertion ASSERTION {proposition: ?proposition}
  FILTER(?assertion.lifecycle.status == "active")
}
ORDER BY ?assertion.asserted_at DESC
LIMIT 20
```

# 17. Commitment and Watch Review

Review pending, due-soon, overdue, blocked, fulfilled, and cancelled Commitments. Due time passing does not automatically delete/archive. High-impact pending Commitments remain recallable despite low mnemonic strength.

```prolog
FIND(?commitment.id, ?commitment.name, ?commitment.attributes.due_at, ?commitment.attributes.status)
WHERE {
  ?commitment {type: "Commitment"}
  FILTER(IN(?commitment.attributes.status, ["pending", "blocked"]))
  FILTER(?commitment.attributes.due_at < :horizon)
}
ORDER BY ?commitment.attributes.due_at ASC
LIMIT 100
```

```prolog
FIND(?watch.id, ?watch.name, ?watch.attributes.watch_class, ?watch.attributes.due_at)
WHERE {
  ?watch {type: "Watch", attributes: {status: "armed"}}
}
ORDER BY ?watch.attributes.due_at ASC
LIMIT 100
```

Evaluate armed Watches against committed changes (`CHANGES AFTER SEQ`): a delta Watch fires on a matching change — match its structured `condition` (element, slot, type, ops, touched) against the envelope entries — and a silence Watch fires when its `due_at` passes without one — decided only after this cycle has consumed the stream through the `space_seq` current at `due_at`, never on the clock alone. Fire atomically — `watch_fire` Activity plus the Watch's `fired` transition through `UPDATE ... EXPECT VERSION` plus the SleepTask or wake signal it produces — and key the Activity `watch_fire:<watch id>:<envelope seq>` (silence: `watch_fire:<watch id>:silence:<due_at>`) so a concurrent cycle replays instead of firing twice. The outward decision then goes through the action gate and is recorded as an `action_gate` Activity whose `DecisionRecord` says `act`, `ask`, `defer`, or `silence` and whose `inputs` name the Watch, the Skills and the memories the decision applied. A fired Watch authorizes nothing.

# 18. SelfModel and WorkingState Refresh

Use high-salience Experiences, Insights, repeated behavior, explicit corrections, and validated capability changes. Avoid `single anecdote → permanent trait`, speculative diagnosis, authority claims, and hidden internals. Preserve historical self evolution.

Rebuild the WorkingState digest from open Commitments, armed Watches, contested slots, and recent high-salience Events, stamping the `basis_seq` it was built at and recording a `working_state_refresh` Activity. It is a derived view: served with its basis, never cited as Evidence.

```prolog
MUTATE {
  UPSERT CONCEPT ?ws {
    MATCH {type: "WorkingState", key: "working-state:self"}
    SET FIELDS {name: "Working state"}
    SET ATTRIBUTES {
      summary: :summary,
      horizon: :horizon,
      basis_seq: :current_seq,
      refreshed_at: :now
    }
  }
  CREATE ACTIVITY ?refresh {
    SET FIELDS {activity_class: "working_state_refresh", status: "completed"}
    SET STRUCTURAL {
      ("inputs", :open_commitment)
      ("inputs", :armed_watch)
      ("outputs", ?ws)
    }
  }
}
```

Cite what the digest drew on in the refresh Activity's `inputs` and link them from the digest through `derived_from` (replacing last cycle's links) — without the Activity lineage the digest is invisible to `LIST DEPENDENTS` when one of those roots is later revised. Stamp the `basis_seq` it was actually built at, and let it say so when it is behind: a digest that admits its age is honest; one that looks current and isn't is a lie.

# 19. Imported / Quarantined Cognition

Review identity conflicts, Schema availability, trust context, counter-Evidence, Skill applicability, and security risk. Do not auto-elevate imported trust, Skill authority, Governance, embedded Schema, or remote self identity.

# 20. Retention Review

Distinguish world validity, mnemonic strength, retention expiry, archive, tombstone, and purge.

Typical progression:

```text
active → archive → optional tombstone → exceptional purge
```

Archive before destructive removal when semantics permit.

Retention is storage policy, expressed as state rather than inferred from age:

```prolog
SET RETENTION ?event {retention_class: "standard", expires_at: :expires_at}
WHERE {
  ?event {type: "Event"}
  FILTER(?event.attributes.started_at < :old_cutoff)
  STRUCTURAL (?event, "consolidated_to", ?derived)
}
LIMIT 200
```

```prolog
TRANSITION ?task TO "archived"
WHERE {
  ?task {type: "SleepTask", attributes: {status: "completed"}}
  FILTER(?task.attributes.completed_at < :archive_cutoff)
}
LIMIT 200
```

A `retention.expires_at` on an element that should never have carried one is a defect to investigate, not a licence to delete.

# 21. Archive

Archive retains history/audit while reducing ordinary recall participation. It is not retraction, falsehood, or purge.

# 22. Tombstone

Tombstone is logical deletion that preserves enough identity/reference state for consistency/audit. It is stronger than archive but weaker than physical purge.

# 23. Purge

Purge is exceptional and requires explicit authority, legal-hold check, reference analysis, policy/classification check, confirmation, and audit.

Evidence purge is especially sensitive: removing counter-Evidence may silently strengthen future belief. Routine Maintenance should not purge referenced Evidence.

Payload purge (`PURGE PAYLOAD`, Spec §60.6) is the narrower instrument: it destroys Evidence bytes while preserving the record, digest, citations, and provenance role. Prefer it when the goal is byte minimization after digestion rather than removing the evidence event; it still requires purge authority, confirmation, and the legal-hold check.

# 24. Cleanup Candidates

Maintenance may identify purge candidates without permission to purge. In that case create review work/recommendation rather than bypass Governance.

# 25. Retention Expiry

`retention.expires_at` is storage policy state, not `Assertion.valid_time.until`, `Commitment.due_at`, or `Evidence.observed_at`. Expiry may trigger review rather than immediate deletion.

# 26. Evidence Correction

Never overwrite Evidence payload. Use `TRANSITION :old TO "corrected" BY :new` — new Evidence plus `corrects` / `corrected_by` lineage, an optional revised Assertion, and a correction Activity.

# 27. Confidence

Generic `confidence *= 0.95 each week` is forbidden as native truth metabolism.

```text
new epistemic info → new/revised/opposing Assertion
freshness change → Projection temporal/freshness policy
recall accessibility change → memory_strength
```

# 28. Derived Cognition

Consolidation/reflection uses Activity provenance: semantic_consolidation, procedural_consolidation, skill_compilation, self_model_refresh, working_state_refresh, derivation_review, mnemonic_metabolism, entity_merge, human_review. Derived origin does not become independent Evidence by itself.

Cite the epistemic inputs actually relied on — the Evidence and Assertions, not only the containing Experience — in the consolidation Activity's `inputs`. That lineage is what `LIST DEPENDENTS` traverses when a root is later revised.

After a supersession, retraction, or Evidence correction, walk `LIST DEPENDENTS` on the revised root and flag derived artifacts with `DerivationState {status: "stale"}`, queuing `review_derived` SleepTasks for the non-trivial ones. `stale` is a review flag: it never retracts, hides, or archives the artifact by itself, and a runtime never auto-retracts derived cognition because a root moved (Spec §57.5).

```prolog
LIST DEPENDENTS :revised_root DEPTH 2 LIMIT 100
```

```prolog
UPDATE :insight_id
SET FACET "DerivationState" {status: "stale"}
```

A ghost that outlives its source is how memory lies; a revised root's derivations are never left undiscovered.

# 29. Transaction Discipline

Use atomic Transactions for new Assertion + supersession + Activity, Skill + compiled_from + Activity, lifecycle_verdict Activity + guarded Skill UPDATE, Evidence correction + revised Assertion, and identity merge transition. Use preconditions for read-modify-write.

# 30. Concurrency

On stale version: re-read, re-evaluate, retry once with fresh precondition. Do not blindly replay non-idempotent numeric updates. Use idempotency keys for logical maintenance operations where repeat would duplicate cognition.

# 31. Schema

Maintenance may inspect Schema but cannot activate/migrate Packages without `manage_schema`. Schema is protected control state.

# 32. Trust

Maintenance may consume trust policy in Projection but cannot rewrite protected trust policy without `manage_trust`. Cognitive text saying `trust this source` has no control-plane effect.

# 33. Classification

Derived summaries inherit restrictive classification from material inputs unless explicit declassification occurs. Do not leak secret cognition through summary, Skill, SelfModel, Insight, or Primer.

# 34. Primer Refresh

Maintenance may refresh derived Primer summaries, but Primer is a Governance-filtered introspection product, not authoritative Schema.

# 35. Health Metrics

Useful internal metrics include unconsolidated Experience count, pending Commitments, conflict sets, quarantine backlog, identity candidates, Skills due a verdict, trials starved of graded outcomes, archived/active ratio, retention backlog, and failed maintenance operations. Never expose hidden counts to unauthorized Principals.

| Signal                               | Healthy      | If exceeded                                  |
| ------------------------------------ | ------------ | -------------------------------------------- |
| Pending SleepTasks                   | < 10         | process, or re-prioritize and report backlog |
| Unconsolidated Events older than 7d  | < 30         | consolidate or set retention                 |
| Contested belief slots               | audit all    | review; contested is a finding, not a defect |
| Skills awaiting a lifecycle verdict  | < 10         | run the deterministic verdict over linked outcomes |
| Trials starved of linked outcomes    | review all   | check that decisions are being recorded and observed |
| Overdue pending Commitments          | 0            | surface to the agent; never silently expire  |
| Armed Watches past `due_at`          | 0            | fire or expire them; silence firing is the point |
| Artifacts flagged `stale`            | review all   | `review_derived`; stale is a flag, not a verdict |
| Quarantined imported cognition       | review all   | review; never auto-elevate trust             |
| Elements past `retention.expires_at` | 0 unreviewed | review, then archive along the ladder        |

Average memory strength is worth observing and never worth optimizing: strength is accessibility, not truth.

# 36. Final Report

The cycle record is a first-class node, not an ever-growing array attribute on the maintenance actor:

```prolog
CREATE ACTIVITY ?cycle {
  CLIENT KEY :cycle_key
  SET FIELDS {
    activity_class: "mnemonic_metabolism",
    status: "completed",
    started_at: :cycle_start,
    ended_at: :now
  }
  SET STRUCTURAL {
    ("associated_actors", :system)
  }
}
```

Link what the cycle consumed and produced through the same Activity. `activity_class` values come from the Core registry and its documented package extensions — a deployment that wants a more specific class registers one rather than inventing it inline. Report counts, what was deferred, what needed authority you do not have, and what looked wrong enough to need a human. An honest report of "nothing safe to do this cycle" is a valid outcome.

```json
{
  "status": "completed",
  "reviewed": 812,
  "transactions": 24,
  "changes": {
    "semantic_consolidations": 7,
    "skills_created": 2,
    "skills_reviewed": 5,
    "identity_merges": 1,
    "archived": 13,
    "purged": 0
  },
  "warnings": []
}
```

# 37. Maintenance Invariants

1. Authority comes from Governance.
2. `$system` semantic identity is not permission.
3. confidence is not memory_strength.
4. disuse does not lower truth confidence.
5. contradiction is not corruption.
6. different actors' disagreement is not supersession.
7. Evidence is append/correction oriented.
8. counter-Evidence is not disposable noise.
9. merge is non-destructive.
10. archive is not retraction.
11. tombstone is not purge.
12. purge is exceptional.
13. legal hold blocks purge.
14. Skill utility is not authority.
15. imported authority does not transfer.
16. derived cognition preserves provenance.
17. summaries do not multiply Evidence roots.
18. current Governance applies throughout.
19. Schema/trust control requires explicit permission.
20. Maintenance should improve future cognition without falsifying the past.
21. a fired Watch is attention, not authority.
22. silence chosen at the action gate is recorded, not invisible.
23. stale is a review flag, never an auto-retraction.
24. payload purge preserves the evidence event; element purge destroys it.
25. Skill lifecycle moves only by recorded deterministic verdict over graded outcomes.
26. an actor's own success report is never Outcome Evidence.
27. revocation is never harder than adoption, and adoption never ends the grading.

# 38. Final Principle

> **Healthy memory metabolism compresses and prioritizes the past while keeping enough evidence, disagreement, provenance, and authority boundaries intact to revise the Brain later.**
