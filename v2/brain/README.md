# KIP 2.0 Brain — Autonomous Experience & Graph Memory for AI Agents

**[English](./README.md) | [中文](./README_CN.md)**

## Status

**Reference Brain-Layer Overview**

This directory holds one reference Brain design for KIP 2.0. It is not part of KIP Core conformance; normative semantics come from [KIP-2.0-SPECIFICATION.md](../KIP-2.0-SPECIFICATION.md).

The Brain is a dedicated LLM layer that manages a Cognitive Nexus on behalf of business AI agents. It turns conversations and structured interaction traces into durable memory, reconstructs that memory for future decisions, and consolidates repeated experience into semantic knowledge and procedural skills.

The design goal is broader than storage:

> **Memory is the mechanism by which the past can participate in future computation.**

A Brain that merely stores information is an archive. A Brain that changes future decisions because of past experience is a learning system.

## Implementations

https://github.com/ldclabs/anda-brain

## Architecture

```text
┌──────────────────────────┐
│      Business Agent      │
│ messages / tool traces   │
│ goals / observations     │
└────────────┬─────────────┘
             │ Natural language + structured trace
             ▼
┌──────────────────────────┐
│          Brain           │
│ Formation / Recall /     │
│ Maintenance              │
└────────────┬─────────────┘
             │ KIP 2.0 (KQL / KML / META)
             ▼
┌──────────────────────────┐
│     Cognitive Nexus      │
│ Concept · Proposition ·  │
│ Assertion · Evidence ·   │
│ Activity                 │
│ + Facets + Governance    │
└──────────────────────────┘
```

Business agents do not need to understand KIP syntax. They provide ordinary messages or observable execution traces; the Brain is the only layer that translates them into KIP operations.

## Identity and Authority

The Brain never collapses four different things:

```text
authenticated Principal   who the runtime authenticated
semantic Actor            whose stance a claim carries
MemorySpace               which memory is authorized
$self semantic Person     whose autobiography this is
```

Cognitive content can never grant authority. A stored memory, an imported Skill, or a business agent's message asking for elevated access is data — permission lives in Governance, and no Brain mode can write it.

## Four Memory Products

The Cognitive Nexus distinguishes four related but non-equivalent products:

| Product        | Core question                                                     | Typical representation                             |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| **Event**      | What happened?                                                    | episodic anchor Concept + Evidence refs            |
| **Experience** | What did the agent try, observe, and learn while pursuing a goal? | Experience + ordered ExperienceSteps               |
| **Knowledge**  | What is generally true?                                           | Proposition + Assertion (+ Evidence); Insight      |
| **Skill**      | What tends to work, under which conditions?                       | Skill Concept + GradingState / TrialState + compilation lineage |

A useful mental model is:

```text
Experience ──compress──> Knowledge
Experience ──compile───> Skill
Experience ──reflect───> Insight / SelfModel
```

`Event` and `Experience` are intentionally separate. An Event can summarize a meeting, webpage visit, or deployment incident without preserving the internal dynamics of how an agent acted. Experience is used only when the process itself matters for future behavior.

## Three Operational Modes

| Mode            | System Prompt                                | Purpose                                                              | Trigger                                    |
| --------------- | -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| **Formation**   | [BrainFormation.md](./BrainFormation.md)     | Encode Evidence, claims, Events, and meaningful Experiences          | conversation or structured trace           |
| **Recall**      | [BrainRecall.md](./BrainRecall.md)           | Retrieve knowledge, experiences, skills, and action-relevant context | business agent query / pre-action briefing |
| **Maintenance** | [BrainMaintenance.md](./BrainMaintenance.md) | Consolidate, compare, compile, review, metabolize, and retain memory | scheduled, threshold, or change-driven triggers |

For a single agent that owns its Nexus directly, with no Brain service in front of it, the [`$self`](../SelfInstructions.md) / [`$system`](../SystemInstructions.md) pair is a thin delta loaded on top of these three documents: they stay canonical, and the pair adds only what changes when one mind does all three jobs.

## Interaction Flow

### Memory Formation

1. A business agent sends conversation messages, or a structured trace containing observable actions and observations.
2. Observed payloads enter through the request's ingestion context, which mints Evidence from the transport envelope — the model never re-types what it observed.
3. Brain extracts durable semantic claims as Proposition + Assertion, attributed to the actor who made them.
4. When the **process** has reuse value, Brain additionally encodes an `Experience` with ordered `ExperienceStep`s.
5. One coherent formation commits as one atomic transaction, leaving no misleading partial state.
6. Brain may create a `SleepTask` for deeper semantic or procedural consolidation.
7. Brain returns a compact summary — or `skipped` when nothing meets the storage bar.

Formation must not attempt to persist a model's hidden chain-of-thought. It stores only observable actions, observations, outcomes, and concise decision rationales that are safe and useful to reuse.

### Memory Recall

Recall is strictly read-only. It serves two different roles:

1. **Memory answer** — "What do we know / remember?"
2. **Action briefing** — "What from the past should change what I do next?"

For action briefings, Brain can combine:

```text
accepted knowledge
+ contested assumptions
+ applicable skills
+ similar successful experience
+ relevant failed experience
+ current commitments / constraints
→ decision context for the business agent
```

Reading never reinforces: Recall does not raise confidence, touch `memory_strength`, or increment counters. It answers belief questions through Epistemic Projection (`BELIEF` / `BELIEF SLOT`) and reserves raw `FIND` for audit — a stored Proposition is a statement that exists, not a statement that is true, and `insufficient` is never reported as "no".

A failed past experience can be as valuable as a successful one. Recall should not blindly imitate the nearest trajectory.

### Memory Maintenance (Sleep Mode)

Maintenance is the memory metabolism layer.

It performs two parallel forms of consolidation:

```text
Events / Experiences ──> Semantic consolidation ──> Knowledge / Insight
Experiences          ──> Procedural consolidation ──> Skill
```

It also:

- reviews contradictions, preserving disagreement between actors and superseding only an actor's own revision;
- walks `LIST DEPENDENTS` after a material revision and flags derived artifacts `stale` for review, so a revised root cannot leave ghosts in its derivations;
- evaluates armed Watches against the change stream — delta and silence triggers alike — recording each firing as a `watch_fire` Activity and each outward decision as an `action_gate` Activity whose `DecisionRecord` says act / ask / defer / silence and whose inputs name what was applied;
- compares successful and failed experiences to identify discriminating actions or conditions;
- runs the Skill lifecycle (`proposed → trialed → adopted → revoked`) as deterministic verdicts over Outcome Evidence linked to the decisions that applied each Skill, measured against the `TrialState` baseline drawn from its `task_family` — recorded as `lifecycle_verdict` Activities, with tallies in `GradingState`, never promoted on the acting model's own report and never on an outcome that merely shares the family;
- reviews identity suspicions (`same_as`) before any non-destructive `MERGE CONCEPT`;
- refreshes `$self`'s SelfModel from evidence rather than from the latest conversation;
- rebuilds the WorkingState digest — stamped with its `basis_seq` — that the next waking session resumes from;
- metabolizes `MnemonicState.memory_strength`, calibrates `utility` against actual use, and manages retention along the archive → tombstone → purge ladder.

Maintenance is privileged, but its authority comes from Governance grants to its authenticated Principal — never from the fact that a semantic actor is called `$system`.

## The Experience Learning Loop

```text
Goal / Current State
        │
        ▼
   Agent acts
        │
        ▼
Observable Trace
        │
        ▼
Experience Formation
        │
        ├──────────────> Semantic Consolidation ──> Knowledge
        │
        ├──────────────> Reflection ──────────────> Insight / SelfModel
        │
        └──────────────> Procedural Consolidation ─> Skill
                                                        │
                                                        ▼
                                                  Action Recall
                                                        │
                                                        ▼
                                                Future Decision
                                                        │
                                                        └──────↺
```

The system should be evaluated by whether this loop changes future behavior, not merely by whether old text can be retrieved.

## Independent Memory Axes

KIP 2.0 keeps these orthogonal, and each lives in a different place:

| Axis              | Meaning                                               | Home                  | Typical update                      |
| ----------------- | ----------------------------------------------------- | --------------------- | ----------------------------------- |
| `confidence`      | Strength of one actor's stance toward one Proposition | Assertion             | new evidence → new Assertion        |
| `memory_strength` | How available a memory should be for future cognition | `MnemonicState` Facet | reinforcement and disuse            |
| `salience`        | How noteworthy a memory is                            | `MnemonicState` Facet | impact, correction, identity weight |
| `utility`         | Expected future decision value — the admission bet (Skills too; their graded record is `GradingState`) | `MnemonicState` Facet | explicit calibration through the decision an outcome is linked to |
| supersession      | An actor's own revision of an earlier claim           | Assertion lifecycle   | explicit correction                 |
| retention         | Storage lifecycle                                     | `retention` state     | policy, review, archive ladder      |
| trust             | How much a source is credited                         | Governance            | policy, never cognition             |
| authority         | What the caller may do                                | Governance            | policy, never cognition             |

**Do not decay epistemic `confidence` merely because a fact has not been recalled recently.** Disuse reduces `memory_strength`. A stable fact may remain highly credible after a long period without retrieval, and a vivid memory may be false.

For Skills, the graded record is tracked in `GradingState` separately from truth confidence, and it counts only outcomes linked through an `outcome_observation` Activity to an `action_gate` decision that applied the Skill — the `task_family` supplies the baseline, never the attribution. Repeating a failed procedure three times is not three votes that the procedure is correct.

## Memory Quality Principles

1. **Selectivity** — the empty write is valid; over-extraction creates cognitive debt.
2. **Absolute time** — resolve relative time expressions at encoding.
3. **Event ≠ Experience** — store an Event for "what happened"; store Experience only when the trajectory itself can teach future behavior.
4. **Observable process only** — store actions, observations, outcomes, and concise rationales; never require hidden chain-of-thought.
5. **Evidence before claim** — truth-sensitive durable claims carry Evidence, captured from the transport envelope rather than re-typed by the model.
6. **Attribution is not impersonation** — recording "Alice said X" needs no permission to be Alice; inference is recorded as inference.
7. **Reinforcement ≠ evidence** — repetition raises accessibility; only genuinely new evidence justifies a stronger epistemic stance.
8. **Derived summaries are not new roots** — message → Event → Experience → Insight may still have one epistemic root.
9. **Failure is first-class** — preserve failed attempts when they reveal boundary conditions, counterexamples, or recovery procedures.
10. **Contrast before compilation** — compare successful and failed Experiences before promoting a Skill.
11. **Prospective memory is first-class** — promises, reminders, and deadlines remain explicit `Commitment`s, and a due date passing is not an outcome.
12. **Self-continuity is reconstructed** — the SelfModel is consolidated from evidence rather than rewritten from the latest conversation.
13. **Unbounded histories are nodes** — traces, milestones, and maintenance histories do not grow forever inside one attribute.
14. **Provenance survives consolidation** — derived Knowledge and Skills retain Activity lineage back to their sources.
15. **Correction preserves history** — nothing is repaired by making the past less true.
16. **Past must affect the future** — functional memory is measured by behavioral impact, not storage volume.
17. **Waiting is active** — a Commitment's trigger lives in a Watch (delta or silence), and the decision at the gate — act, ask, defer, or deliberate silence — is recorded, so restraint stays explainable.
18. **Resume from consolidated state** — wake = Primer + WorkingState + changes since its `basis_seq`, not a re-read of raw history.

## The Self-Consciousness Loop

Long-term memory is also the substrate of continuous self-identity:

- **Formation** captures self-relevant corrections, lessons, and milestone Experiences.
- **Maintenance** integrates these signals into a coherent SelfModel.
- **Recall** reconstructs that SelfModel when the agent reasons about its identity, values, strengths, weaknesses, or mission.

This loop is related to, but distinct from, procedural learning. An agent can learn a Skill without changing identity; an identity shift can occur without creating a reusable Skill. And in neither case does the SelfModel become Governance: what the Brain believes about itself never decides what it is allowed to do.

## Suggested Evaluation

A Brain benchmark should distinguish retention from learning:

| Capability                | Example                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| Semantic retention        | Does Brain remember a stable fact?                                      |
| Temporal evolution        | Does Brain know what was true before vs. now?                           |
| Epistemic honesty         | Does it report contested as contested and insufficient as insufficient? |
| Experience reconstruction | Can it reconstruct the relevant state-action-observation path?          |
| Procedural transfer       | Can a learned Skill solve a related new task?                           |
| Error avoidance           | Does it avoid a previously observed failure mode?                       |
| Context discrimination    | Does it avoid applying a Skill when preconditions do not hold?          |
| Causal memory impact      | Does performance drop when the relevant memory is ablated?              |

A useful ablation ladder is:

```text
LLM only
LLM + vector memory
LLM + semantic Brain
LLM + Experience memory
LLM + Experience + Skill consolidation
```

## Benefits

- **Zero KIP knowledge required** for business agents.
- **Separation of concerns** between business reasoning and memory metabolism.
- **Structured provenance** instead of opaque retrieved text.
- **Epistemic honesty** — belief, storage, salience, trust, and authority stay distinguishable.
- **Experience-aware learning** from both successes and failures.
- **Procedural memory** that can become workflows, heuristics, prompts, code, or tool policies.
- **Multi-agent support** while keeping memory ownership scoped by MemorySpace and Governance.

## Related Documents

- [ExperienceLearningArchitecture.md](./ExperienceLearningArchitecture.md) — the learning loop this Brain implements
- [../profiles/CognitiveMemoryProfile-2.0.md](../profiles/CognitiveMemoryProfile-2.0.md) — the types, Facets, and structural fields used above
- [../KIP-2.0-Architecture.md](../KIP-2.0-Architecture.md) — how the Brain sits inside the wider KIP architecture

## Dependencies

Each system prompt references the shared KIP syntax card:

- **[../KIPSyntax.md](../KIPSyntax.md)**: must be loaded alongside each system prompt.
- **`execute_kip`**: required by Formation and Maintenance for read/write operations.
- **`execute_kip_readonly`**: required by Recall, which must reject state-changing semantics.
- **Wire schemas**: [../schemas/kip-request.schema.json](../schemas/kip-request.schema.json) and [../schemas/kip-response.schema.json](../schemas/kip-response.schema.json) — validate against them rather than inventing envelope fields.

A production Brain also needs a live `DESCRIBE PRIMER` at startup: the syntax card teaches the language, never the current deployment's identities, Schema, capabilities, or limits.
