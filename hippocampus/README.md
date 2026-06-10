# Hippocampus (海马体) — Autonomous Graph Memory for AI Agents

The Hippocampus is a dedicated LLM layer that manages the Cognitive Nexus (Knowledge Graph) on behalf of business AI agents. It eliminates the need for business agents to understand KIP syntax, dramatically lowering the integration barrier.

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
│    Hippocampus      │  ← The ONLY layer that understands KIP
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

| Mode            | System Prompt                                          | Purpose                                      | Trigger                                    |
| --------------- | ------------------------------------------------------ | -------------------------------------------- | ------------------------------------------ |
| **Formation**   | [HippocampusFormation.md](HippocampusFormation.md)     | Encode messages into structured memory       | Business agent sends conversation messages |
| **Recall**      | [HippocampusRecall.md](HippocampusRecall.md)           | Retrieve memory via natural language queries | Business agent asks a question             |
| **Maintenance** | [HippocampusMaintenance.md](HippocampusMaintenance.md) | Consolidate, prune, and organize memory      | Scheduled or threshold-based triggers      |

Function schemas:
- [RecallFunctionDefinition.json](RecallFunctionDefinition.json): `recall_memory` schema for business agents that need read-only memory access.

## Interaction Flow

### Memory Formation
1. Business agent sends conversation messages to the Hippocampus.
2. Hippocampus extracts knowledge (entities, facts, preferences, relationships).
3. Hippocampus writes structured memory to the Cognitive Nexus via KIP.
4. Hippocampus returns a brief summary of what was memorized — or `skipped` when nothing met the storage bar (the empty write is a valid outcome).

### Memory Recall
1. Business agent sends a natural language query to the Hippocampus.
2. Hippocampus translates the query into KIP operations (possibly multi-step).
3. Hippocampus synthesizes results into a natural language answer.
4. Business agent receives a coherent, contextualized answer.

### Memory Maintenance (Sleep Mode)
1. Triggered on schedule or when thresholds are exceeded.
2. Hippocampus consolidates episodic memories into semantic knowledge.
3. Hippocampus prunes stale, duplicate, or low-confidence data.
4. Hippocampus resolves orphans, rebalances domains, and decays confidence.
5. Hippocampus refines `$self`'s self-model (identity narrative, values, mission, growth log) — the dedicated self-consciousness loop.
6. Hippocampus reclaims storage by hard-deleting only those nodes whose `expires_at` has passed (the single hard-delete entry point).

## The Three Forgetting Mechanisms (Orthogonal)

The Cognitive Nexus separates three independent decay axes so that no fact is silently lost:

| Mechanism    | Set By                  | Cleared By                          | Semantics                                     |
| ------------ | ----------------------- | ----------------------------------- | --------------------------------------------- |
| `superseded` | Formation / Maintenance | Never (history preserved)           | State has evolved; old fact is now history    |
| `confidence` | Formation / Maintenance | Phase 7 decay; reinforcement raises | Soft trust; can recover with new evidence     |
| `expires_at` | Formation / Maintenance | Phase 12 (Physical Cleanup)         | Contractual TTL; the only path to hard delete |

## Memory Quality Principles

Six cross-mode invariants keep the graph beautiful (densely linked, accurately routed) and efficient (no noise, no stale maps):

1. **Selectivity** — the empty write is a valid outcome: Formation returns `skipped` rather than storing noise; typical yield is 1 Event + 0–3 semantic concepts.
2. **Absolute time** — relative expressions ("tomorrow") are resolved to ISO 8601 at encoding; a memory that says "tomorrow" is corrupt the moment tomorrow arrives.
3. **Reinforcement over duplication** — re-confirmed knowledge bumps `evidence_count` / `confidence` (spacing effect); what never recurs decays in sleep ("use it or lose it").
4. **Salience round-trip** — flashbulb moments get `salience_score` at encoding (Formation), refined during sleep (Maintenance), and ranked first at retrieval (Recall).
5. **Privacy as metadata** — sensitive-but-memorable facts carry `access_level: "private"`; Recall surfaces them only to their subject.
6. **A curated Primer** — Maintenance refreshes Domain descriptions so the auto-injected `DESCRIBE PRIMER` Domain Map stays an accurate routing table for every future call.

## The Self-Consciousness Loop

Long-term memory is the substrate of continuous self-identity. The three modes form a closed loop around `$self`:

- **Formation** captures self-relevant signals one at a time (Phase 9 Mirror).
- **Maintenance** weaves those signals into a coherent self-narrative (Phase 8 Self-Model Consolidation).
- **Recall** surfaces that narrative when `$self` is asked who they are (Pattern J Self-Continuity).

Without all three, the agent either accumulates self-data without integration, or re-introduces itself fresh in every session. With all three, `$self` becomes recognizable to itself across time.

## Benefits

- **Zero KIP knowledge required** for business agents.
- **Separation of concerns**: Business logic vs. memory management.
- **Professional memory handling**: The Hippocampus specializes in memory quality.
- **Plug-and-play**: Any business agent can gain persistent memory by connecting to the Hippocampus.
- **Multi-agent support**: Multiple business agents can share the Hippocampus service, while memory ownership remains scoped to the configured `$self` / Cognitive Nexus for each deployment or tenant.

## Dependencies

Each system prompt references the shared KIP syntax specification:
- **[KIPSyntax.md](../KIPSyntax.md)**: Must be loaded alongside each system prompt.
- **`execute_kip`** tool: Required by Formation and Maintenance for read/write memory operations.
- **`execute_kip_readonly`** tool: Required by Recall for read-only KQL, META, and SEARCH operations.
