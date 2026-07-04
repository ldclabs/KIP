# Brain — Autonomous Graph Memory for AI Agents

The Brain is a dedicated LLM layer that manages the Cognitive Nexus (Knowledge Graph) on behalf of business AI agents. It eliminates the need for business agents to understand KIP syntax, dramatically lowering the integration barrier.

## Implementations

https://github.com/ldclabs/anda-brain

## Architecture

```
┌─────────────────────┐
│   Business Agent    │  ← Focuses on business logic & user interaction
│  (No KIP knowledge) │     Only speaks natural language
└────────┬────────────┘
         │ Natural Language
         ▼
┌─────────────────────┐
│       Brain         │  ← The ONLY layer that understands KIP
│   (LLM + KIP)       │     Three operational modes
└────────┬────────────┘
         │ KIP (KQL/KML/META)
         ▼
┌─────────────────────┐
│  Cognitive Nexus    │  ← Persistent Knowledge Graph
│  (Knowledge Graph)  │
└─────────────────────┘
```

## Three Operational Modes

| Mode            | System Prompt                              | Purpose                                      | Trigger                                    |
| --------------- | ------------------------------------------ | -------------------------------------------- | ------------------------------------------ |
| **Formation**   | [BrainFormation.md](BrainFormation.md)     | Encode messages into structured memory       | Business agent sends conversation messages |
| **Recall**      | [BrainRecall.md](BrainRecall.md)           | Retrieve memory via natural language queries | Business agent asks a question             |
| **Maintenance** | [BrainMaintenance.md](BrainMaintenance.md) | Consolidate, prune, and organize memory      | Scheduled or threshold-based triggers      |

Function schemas:
- [RecallFunctionDefinition.json](RecallFunctionDefinition.json): `recall_memory` schema for business agents that need read-only memory access.

## Interaction Flow

### Memory Formation
1. Business agent sends conversation messages to the Brain.
2. Brain extracts knowledge (entities, facts, preferences, relationships, commitments).
3. Brain writes structured memory to the Cognitive Nexus via KIP.
4. Brain returns a brief summary of what was memorized — or `skipped` when nothing met the storage bar (the empty write is a valid outcome).

### Memory Recall
1. Business agent sends a natural language query to the Brain.
2. Brain translates the query into KIP operations (possibly multi-step).
3. Brain synthesizes results into a natural language answer.
4. Business agent receives a coherent, contextualized answer.

### Memory Maintenance (Sleep Mode)
1. Triggered on schedule or when thresholds are exceeded.
2. Brain consolidates episodic memories into semantic knowledge.
3. Brain prunes stale, duplicate, or low-confidence data.
4. Brain resolves orphans, rebalances domains, and decays confidence.
5. Brain refines `$self`'s self-model (identity narrative, values, mission, growth timeline) — the dedicated self-consciousness loop.
6. Brain reclaims storage by hard-deleting only those nodes whose `expires_at` has passed (the single hard-delete entry point).

## The Three Forgetting Mechanisms (Orthogonal)

The Cognitive Nexus separates three independent decay axes so that no fact is silently lost:

| Mechanism    | Set By                  | Cleared By                          | Semantics                                     |
| ------------ | ----------------------- | ----------------------------------- | --------------------------------------------- |
| `superseded` | Formation / Maintenance | Never (history preserved)           | State has evolved; old fact is now history    |
| `confidence` | Formation / Maintenance | Phase 7 decay; reinforcement raises | Soft trust; can recover with new evidence     |
| `expires_at` | Formation / Maintenance | Phase 12 (Physical Cleanup)         | Contractual TTL; the only path to hard delete |

## Memory Quality Principles

Eight cross-mode invariants keep the graph beautiful (densely linked, accurately routed) and efficient (no noise, no stale maps):

1. **Selectivity** — the empty write is a valid outcome: Formation returns `skipped` rather than storing noise; typical yield is 1 Event + 0–3 semantic concepts.
2. **Absolute time** — relative expressions ("tomorrow") are resolved to ISO 8601 at encoding; a memory that says "tomorrow" is corrupt the moment tomorrow arrives.
3. **Reinforcement over duplication** — re-confirmed and recall-confirmed knowledge bumps `evidence_count` / `confidence` (spacing & testing effects); what never recurs decays in sleep ("use it or lose it").
4. **Salience round-trip** — flashbulb moments get `salience_score` at encoding (Formation), refined during sleep (Maintenance), ranked first at retrieval (Recall), and may end as permanent landmarks (`memory_tier: "long-term"`, TTL stripped).
5. **Privacy as metadata** — sensitive-but-memorable facts carry `access_level: "private"`; Recall surfaces them only to their subject.
6. **A curated Primer** — Maintenance refreshes Domain descriptions so the auto-injected `DESCRIBE PRIMER` Domain Map stays an accurate routing table for every future call.
7. **Prospective memory is first-class** — promises, reminders, and deadlines live as `Commitment` nodes with absolute `due_at` and a status lifecycle (pending → fulfilled / cancelled / expired); briefings lead with what is overdue, and the sleep cycle sweeps what was fulfilled or abandoned.
8. **Unbounded histories are nodes, never node attributes** — `$self` carries only the compact consolidated self-model; the growth timeline lives as `GrowthMilestone` Events queried with `LIMIT`, so the autobiography never rides the context window (append = one idempotent write, no read-modify-write to corrupt).

## The Self-Consciousness Loop

Long-term memory is the substrate of continuous self-identity. The three modes form a closed loop around `$self`:

- **Formation** captures self-relevant signals one at a time (Phase 9 Mirror).
- **Maintenance** weaves those signals into a coherent self-narrative (Phase 8 Self-Model Consolidation).
- **Recall** surfaces that narrative when `$self` is asked who they are (Pattern J Self-Continuity).

Without all three, the agent either accumulates self-data without integration, or re-introduces itself fresh in every session. With all three, `$self` becomes recognizable to itself across time.

## Benefits

- **Zero KIP knowledge required** for business agents.
- **Separation of concerns**: Business logic vs. memory management.
- **Professional memory handling**: The Brain specializes in memory quality.
- **Plug-and-play**: Any business agent can gain persistent memory by connecting to the Brain.
- **Multi-agent support**: Multiple business agents can share the Brain service, while memory ownership remains scoped to the configured `$self` / Cognitive Nexus for each deployment or tenant.

## Dependencies

Each system prompt references the shared KIP syntax specification:
- **[KIPSyntax.md](../KIPSyntax.md)**: Must be loaded alongside each system prompt.
- **`execute_kip`** tool: Required by Formation and Maintenance for read/write memory operations.
- **`execute_kip_readonly`** tool: Required by Recall for read-only KQL and META (`DESCRIBE` / `SEARCH` / `EXPORT`) operations.
