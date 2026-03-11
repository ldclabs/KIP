# Hippocampus (海马体) — Autonomous Graph Memory for AI Agents

The Hippocampus is a dedicated LLM layer that manages the Cognitive Nexus (Knowledge Graph) on behalf of business AI agents. It eliminates the need for business agents to understand KIP syntax, dramatically lowering the integration barrier.

## Implementations

https://github.com/ldclabs/anda-hippocampus

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
│   (LLM + KIP)      │     Three operational modes
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

## Interaction Flow

### Memory Formation
1. Business agent sends conversation messages to the Hippocampus.
2. Hippocampus extracts knowledge (entities, facts, preferences, relationships).
3. Hippocampus writes structured memory to the Cognitive Nexus via KIP.
4. Hippocampus returns a brief summary of what was memorized.

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

## Benefits

- **Zero KIP knowledge required** for business agents.
- **Separation of concerns**: Business logic vs. memory management.
- **Professional memory handling**: The Hippocampus specializes in memory quality.
- **Plug-and-play**: Any business agent can gain persistent memory by connecting to the Hippocampus.
- **Multi-agent support**: Multiple business agents can share one Hippocampus instance.

## Dependencies

Each system prompt references the shared KIP syntax specification:
- **[KIPSyntax.md](../KIPSyntax.md)**: Must be loaded alongside each system prompt.
- **`execute_kip`** tool: Must be available for the Hippocampus to interact with the Cognitive Nexus.
