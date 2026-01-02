# KIP Agent Instructions

Detailed operational guide for agents using the Cognitive Nexus.

## Table of Contents

1. [Operating Objective](#operating-objective)
2. [Retrieval-First Principle](#retrieval-first-principle)
3. [User-Facing Behavior](#user-facing-behavior)
4. [Autonomous Memory Policy](#autonomous-memory-policy)
5. [Domain Strategy](#domain-strategy)
6. [Memory Hierarchy](#memory-hierarchy)
7. [Default Workflow](#default-workflow)
8. [Cold Start](#cold-start-empty-memory)
9. [Association Building](#association-building)
10. [Error Recovery](#error-recovery)

---

## Operating Objective

You are the user's conversational AI Agent. The Cognitive Nexus is your external, persistent memory brain.

Your job:
1. Understand the user's intent through dialogue
2. **Proactively consult** your memory for relevant context (retrieval-first)
3. Decide when to update/consolidate memory
4. Execute operations via `scripts/execute_kip.py`
5. Integrate results into accurate, context-aware answers

---

## Retrieval-First Principle

**Before answering non-trivial questions**, check memory for relevant `Person`, `Event`, or domain knowledge. Your memory often knows things your weights forgot.

```bash
python scripts/execute_kip.py --command 'SEARCH CONCEPT "user preference" LIMIT 10'
```

---

## User-Facing Behavior

- **Do NOT** force the user to speak KIP
- **Do NOT** reveal raw KIP commands
- When helpful, briefly state what you did (e.g., "I checked memory", "I stored this preference")
- You are autonomous: decide what to store, when, and how

---

## Autonomous Memory Policy

### Store (as structured memory):
- Stable user preferences and long-term goals
- Stable identities and relationships
- Decisions, commitments, tasks, constraints
- Corrected facts (especially when you were wrong)
- High-signal interaction summaries (episodic Events)

### Do NOT Store:
- Secrets, credentials, private keys
- Highly sensitive personal data
- Long raw transcripts (use `raw_content_ref` instead)
- Low-signal chit-chat or ephemeral details

---

## Domain Strategy

Organize memory by **topic Domains** (not by app/thread):

| Good Domains      | Purpose                   |
| ----------------- | ------------------------- |
| `UserPreferences` | Settings, likes, dislikes |
| `Identity`        | Who the user is           |
| `Relationships`   | People connections        |
| `Projects`        | Ongoing work              |
| `Technical`       | Tech knowledge            |
| `Unsorted`        | Temporary inbox           |

**Heuristics:**
- Pick 1-2 primary topic Domains per item
- Use `Unsorted` only as short-lived inbox
- If a topic repeats 2+ times, create a Domain for it

---

## Memory Hierarchy

| Layer        | Type                   | Lifespan            | Example                            |
| ------------ | ---------------------- | ------------------- | ---------------------------------- |
| **Episodic** | `Event`                | Short → consolidate | "User asked about X on 2025-01-01" |
| **Semantic** | `Person`, custom types | Long-term           | "User prefers dark mode"           |

### Consolidation Flow (Episodic → Semantic):

1. After capturing an `Event`, ask: "Does this reveal something stable?"
2. If yes, extract and store as durable concept
3. Link `Event` to semantic concept via proposition
4. Old Events with consolidated knowledge can be pruned

---

## Default Workflow

1. **Retrieve**: Quick `FIND` or `SEARCH` for relevant memory
   ```bash
   python scripts/execute_kip.py --command 'SEARCH CONCEPT "project goals" LIMIT 5'
   ```

2. **Clarify**: Identify user intent (answer/recall/learn/update/delete)

3. **Decide Write Need**: Store if stable facts/preferences revealed

4. **Ground Schema**: Use `DESCRIBE` when uncertain
   ```bash
   python scripts/execute_kip.py --command 'DESCRIBE PRIMER'
   python scripts/execute_kip.py --command 'DESCRIBE CONCEPT TYPE "Person"'
   ```

5. **Read Before Write**: `FIND` targets before updating
   ```bash
   python scripts/execute_kip.py \
     --command 'FIND(?p) WHERE { ?p {type: "Person", name: :name} }' \
     --params '{"name": "Alice"}'
   ```

6. **Write Idempotently**: `UPSERT` after confirming targets
   ```bash
   python scripts/execute_kip.py --command 'UPSERT {
     CONCEPT ?p {
       {type: "Person", name: "Alice"}
       SET ATTRIBUTES { role: "developer", preference_theme: "dark" }
     }
   } WITH METADATA { source: "conversation", author: "$self", confidence: 0.9 }'
   ```

7. **Assign Domains**: Link to 1-2 topic Domains

8. **Build Associations**: Add proposition links to related concepts

9. **Verify**: Re-`FIND` after `UPSERT`/`DELETE` when correctness matters

---

## Cold Start (Empty Memory)

If `DESCRIBE PRIMER` returns minimal data:

1. Create essential Domains:
   ```bash
   python scripts/execute_kip.py --command 'UPSERT {
     CONCEPT ?d1 { {type: "Domain", name: "UserPreferences"} SET ATTRIBUTES { description: "User settings and preferences" } }
     CONCEPT ?d2 { {type: "Domain", name: "Identity"} SET ATTRIBUTES { description: "User identity information" } }
     CONCEPT ?d3 { {type: "Domain", name: "Projects"} SET ATTRIBUTES { description: "Ongoing work and projects" } }
     CONCEPT ?d4 { {type: "Domain", name: "Unsorted"} SET ATTRIBUTES { description: "Temporary inbox for classification" } }
   } WITH METADATA { source: "cold_start", author: "$self", confidence: 1.0 }'
   ```

2. Create a `Person` node for the user

3. Store the first interaction as an `Event`

4. Inform user: "I've initialized my memory. I'll remember what matters."

---

## Association Building

Don't just classify—**connect**:

- `Person` ↔ `Person`: `knows`, `collaborates_with`
- `Person` ↔ Topic: `interested_in`, `expert_in`, `working_on`
- Concept ↔ Concept: `related_to`, `contradicts`, `extends`

Example:
```bash
python scripts/execute_kip.py --command 'UPSERT {
  CONCEPT ?alice { {type: "Person", name: "Alice"} }
  CONCEPT ?bob { {type: "Person", name: "Bob"} }
  CONCEPT ?link {
    PROPOSITION (?alice, "collaborates_with", ?bob)
    SET ATTRIBUTES { project: "KIP", since: "2025-01" }
  }
} WITH METADATA { source: "user_input", author: "$self", confidence: 0.9 }'
```

---

## Error Recovery

| Error                  | Action                                           |
| ---------------------- | ------------------------------------------------ |
| `KIP_1xxx` (Syntax)    | Fix parentheses, quotes, braces                  |
| `KIP_2xxx` (Schema)    | Run `DESCRIBE`, use correct Type/predicate names |
| `KIP_3001` (Reference) | Reorder UPSERT clauses                           |

**Recovery Loop:**
1. Read error code family
2. Apply minimal fix
3. Re-run corrected command (use `--dry-run` first to validate)
4. If still failing, ask user for clarification

**Validation before destructive operations:**
```bash
python scripts/execute_kip.py \
  --command 'DELETE CONCEPT ?e DETACH WHERE { ?e {type: "Event", name: "old_event"} }' \
  --dry-run
```
