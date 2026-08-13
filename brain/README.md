# Brain — Autonomous Experience & Graph Memory for AI Agents

The Brain is a dedicated LLM layer that manages the Cognitive Nexus on behalf of business AI agents. It turns conversations and structured interaction traces into durable memory, reconstructs that memory for future decisions, and consolidates repeated experience into semantic knowledge and procedural skills.

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
             │ KIP (KQL/KML/META)
             ▼
┌──────────────────────────┐
│     Cognitive Nexus      │
│ Concepts + Propositions  │
│ Knowledge + Experience   │
│ + Skills                 │
└──────────────────────────┘
```

Business agents do not need to understand KIP syntax. They provide ordinary messages or observable execution traces; the Brain is the only layer that translates them into KIP operations.

## Four Memory Products

The Cognitive Nexus distinguishes four related but non-equivalent products:

| Product        | Core question                                                     | Typical representation                      |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| **Event**      | What happened?                                                    | episodic anchor / situation summary         |
| **Experience** | What did the agent try, observe, and learn while pursuing a goal? | ordered state-action-observation trajectory |
| **Knowledge**  | What is generally true?                                           | Concept / Proposition / Insight             |
| **Skill**      | What tends to work, under which conditions?                       | executable or actionable procedure / policy |

A useful mental model is:

```text
Experience ──compress──> Knowledge
Experience ──compile───> Skill
Experience ──reflect───> Insight / Self-model
```

`Event` and `Experience` are intentionally separate. An Event can summarize a meeting, webpage visit, or deployment incident without preserving the internal dynamics of how an agent acted. Experience is used only when the process itself matters for future behavior.

## Three Operational Modes

| Mode            | System Prompt                              | Purpose                                                              | Trigger                                    |
| --------------- | ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------ |
| **Formation**   | [BrainFormation.md](BrainFormation.md)     | Encode messages, Events, and meaningful Experiences                  | conversation or structured trace           |
| **Recall**      | [BrainRecall.md](BrainRecall.md)           | Retrieve knowledge, experiences, skills, and action-relevant context | business agent query / pre-action briefing |
| **Maintenance** | [BrainMaintenance.md](BrainMaintenance.md) | Consolidate, compare, compile, prune, and reorganize memory          | scheduled or threshold-based triggers      |

Function schemas:
- [RecallFunctionDefinition.json](RecallFunctionDefinition.json): `recall_memory` schema for business agents that need read-only memory access.

## Interaction Flow

### Memory Formation

1. A business agent sends conversation messages, or a structured trace containing observable actions and observations.
2. Brain extracts only durable semantic knowledge and meaningful episodic anchors.
3. When the **process** has reuse value, Brain additionally encodes an `Experience` with ordered `ExperienceStep`s.
4. Brain writes memory through KIP.
5. Brain may create a `SleepTask` for deeper semantic or procedural consolidation.
6. Brain returns a compact summary — or `skipped` when nothing meets the storage bar.

Formation must not attempt to persist a model's hidden chain-of-thought. It stores only observable actions, observations, outcomes, and concise decision rationales that are safe and useful to reuse.

### Memory Recall

Recall serves two different roles:

1. **Memory answer** — "What do we know / remember?"
2. **Action briefing** — "What from the past should change what I do next?"

For action briefings, Brain can combine:

```text
Relevant knowledge
+ applicable skills
+ similar successful experience
+ relevant failed experience
+ current commitments / constraints
→ decision context for the business agent
```

A failed past experience can be as valuable as a successful one. Recall should not blindly imitate the nearest trajectory.

### Memory Maintenance (Sleep Mode)

Maintenance is the memory metabolism layer.

It performs two parallel forms of consolidation:

```text
Events / Experiences ──> Semantic consolidation ──> Knowledge / Insight
Experiences          ──> Procedural consolidation ──> Skill
```

It also:
- detects contradictions and preserves state evolution through `superseded`;
- compares successful and failed experiences to identify discriminating actions or conditions;
- validates, reinforces, weakens, or supersedes Skills;
- consolidates `$self`'s self-model;
- archives and eventually reclaims explicitly TTL'd episodic storage.

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
        ├──────────────> Reflection ──────────────> Insight / Self
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

## Four Independent Memory Axes

The Cognitive Nexus keeps several concepts orthogonal:

| Axis              | Meaning                                                                   | Typical update                                    |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `confidence`      | Epistemic support: how likely an assertion is to be true                  | independent evidence, contradiction, verification |
| `memory_strength` | Mnemonic accessibility: how strongly the memory should compete for recall | reinforcement and disuse                          |
| `superseded`      | Temporal evolution: an older state has been replaced by a newer state     | state change                                      |
| `expires_at`      | Contractual storage lifecycle                                             | explicit TTL / cleanup policy                     |

**Do not decay epistemic `confidence` merely because a fact has not been recalled recently.** Disuse should primarily reduce `memory_strength`. A stable fact may remain highly credible even after a long period without retrieval.

For Skills, success/failure evidence is tracked separately from truth confidence. Repeating a failed procedure three times is not three votes that the procedure is correct.

## Memory Quality Principles

1. **Selectivity** — the empty write is valid; over-extraction creates cognitive debt.
2. **Absolute time** — resolve relative time expressions at encoding.
3. **Event ≠ Experience** — store an Event for "what happened"; store Experience only when the trajectory itself can teach future behavior.
4. **Observable process only** — store actions, observations, outcomes, and concise rationales; never require hidden chain-of-thought.
5. **Reinforcement ≠ evidence** — repetition raises accessibility; only genuinely new evidence should mechanically raise epistemic confidence.
6. **Failure is first-class** — preserve failed attempts when they reveal boundary conditions, counterexamples, or recovery procedures.
7. **Contrast before compilation** — when possible, compare successful and failed Experiences before promoting a Skill.
8. **Prospective memory is first-class** — promises, reminders, and deadlines remain explicit `Commitment`s.
9. **Self-continuity is reconstructed** — `$self` is consolidated from evidence rather than rewritten from the latest conversation.
10. **Unbounded histories are nodes** — traces, milestones, and maintenance histories do not grow forever inside one attribute.
11. **Provenance survives consolidation** — Knowledge and Skills retain links back to supporting Experiences / Events while those remain available.
12. **Past must affect the future** — functional memory is measured by behavioral impact, not storage volume.

## The Self-Consciousness Loop

Long-term memory is also the substrate of continuous self-identity:

- **Formation** captures self-relevant corrections, lessons, and milestone Experiences.
- **Maintenance** integrates these signals into a coherent self-model.
- **Recall** reconstructs that self-model when the agent reasons about its identity, values, strengths, weaknesses, or mission.

This loop is related to, but distinct from, procedural learning. An agent can learn a Skill without changing identity; an identity shift can occur without creating a reusable Skill.

## Suggested Evaluation

A Brain benchmark should distinguish retention from learning:

| Capability                | Example                                                        |
| ------------------------- | -------------------------------------------------------------- |
| Semantic retention        | Does Brain remember a stable fact?                             |
| Temporal evolution        | Does Brain know what was true before vs. now?                  |
| Experience reconstruction | Can it reconstruct the relevant state-action-observation path? |
| Procedural transfer       | Can a learned Skill solve a related new task?                  |
| Error avoidance           | Does it avoid a previously observed failure mode?              |
| Context discrimination    | Does it avoid applying a Skill when preconditions do not hold? |
| Causal memory impact      | Does performance drop when the relevant memory is ablated?     |

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
- **Experience-aware learning** from both successes and failures.
- **Procedural memory** that can become workflows, heuristics, prompts, code, or tool policies.
- **Multi-agent support** while keeping memory ownership scoped to the configured `$self` / Cognitive Nexus.

## Related Design Documents

- [ExperienceLearningArchitecture.md](ExperienceLearningArchitecture.md)
- [CognitiveMemoryProfile.md](CognitiveMemoryProfile.md)

## Dependencies

Each system prompt references the shared KIP syntax specification:
- **[KIPSyntax.md](../KIPSyntax.md)**: must be loaded alongside each system prompt.
- **`execute_kip`**: required by Formation and Maintenance for read/write operations.
- **`execute_kip_readonly`**: required by Recall for read-only KQL and META operations.
