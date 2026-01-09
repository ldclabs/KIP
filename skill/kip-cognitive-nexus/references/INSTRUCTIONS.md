# KIP Agent Workflow Guide

Operational patterns for agents using the Cognitive Nexus.

## 🧬 KIP (Knowledge Interaction Protocol) Syntax Reference

**Full Spec Reference**: https://raw.githubusercontent.com/ldclabs/KIP/refs/heads/main/SPECIFICATION.md

### 1. Lexical Structure & Data Model

The KIP graph consists of **Concept Nodes** (entities) and **Proposition Links** (facts).

#### 1.1. Concept Node
Represents an entity or abstract concept. A node is uniquely identified by its `id` OR the combination of `{type: "<Type>", name: "<name>"}`.

*   **`id`**: `String`. Global unique identifier.
*   **`type`**: `String`. Must correspond to a defined `$ConceptType` node. Uses **UpperCamelCase**.
*   **`name`**: `String`. The concept's name.
*   **`attributes`**: `Object`. Intrinsic properties (e.g., chemical formula).
*   **`metadata`**: `Object`. Contextual data (e.g., source, confidence).

#### 1.2. Proposition Link
Represents a directed relationship `(Subject, Predicate, Object)`. Supports **higher-order** connections (Subject or Object can be another Link).

*   **`id`**: `String`. Global unique identifier.
*   **`subject`**: `String`. ID of the source Concept or Proposition.
*   **`predicate`**: `String`. Must correspond to a defined `$PropositionType` node. Uses **snake_case**.
*   **`object`**: `String`. ID of the target Concept or Proposition.
*   **`attributes`**: `Object`. Intrinsic properties of the relationship.
*   **`metadata`**: `Object`. Contextual data.

#### 1.3. Data Types
KIP uses the **JSON** data model.
*   **Primitives**: `string`, `number`, `boolean`, `null`.
*   **Complex**: `Array`, `Object` (Supported in attributes/metadata; restricted in `FILTER`).

#### 1.4. Identifiers
*   **Syntax**: Must match `[a-zA-Z_][a-zA-Z0-9_]*`.
*   **Case Sensitivity**: KIP is case-sensitive.
*   **Prefixes**:
    *   `?`: Variables (e.g., `?drug`, `?result`).
    *   `$`: System Meta-Types (e.g., `$ConceptType`).
    *   `:`: Parameter Placeholders in command text (e.g., `:name`, `:limit`).

#### 1.5. Naming Conventions (Strict Recommendation)
*   **Concept Types**: `UpperCamelCase` (e.g., `Drug`, `ClinicalTrial`).
*   **Predicates**: `snake_case` (e.g., `treats`, `has_side_effect`).
*   **Attributes/Metadata Keys**: `snake_case`.

#### 1.6. Path Access (Dot Notation)
Used in `FIND`, `FILTER`, `ORDER BY` to access internal data of variables.
*   **Concept fields**: `?var.id`, `?var.type`, `?var.name`.
*   **Proposition fields**: `?var.id`, `?var.subject`, `?var.predicate`, `?var.object`.
*   **Attributes**: `?var.attributes.<key>` (e.g., `?var.attributes.start_time`).
*   **Metadata**: `?var.metadata.<key>` (e.g., `?var.metadata.confidence`).

---

### 2. KQL: Knowledge Query Language

**General Syntax**:
```prolog
FIND( <variables_or_aggregations> )
WHERE {
  <patterns_and_filters>
}
ORDER BY <variable> [ASC|DESC]
LIMIT <integer>
CURSOR "<token>"
```

`ORDER BY` / `LIMIT` / `CURSOR` are optional result modifiers.

#### 2.1. `FIND` Clause
Defines output columns.
*   **Variables**: `FIND(?a, ?b.name)`
*   **Aggregations**: `COUNT(?v)`, `COUNT(DISTINCT ?v)`, `SUM(?v)`, `AVG(?v)`, `MIN(?v)`, `MAX(?v)`.

#### 2.2. `WHERE` Patterns

The pattern/filter clauses in `WHERE` are by default connected using the **AND** operator.

##### 2.2.1. Concept Matching `{...}`
*   **By ID**: `?var {id: "<id>"}`
*   **By Type/Name**: `?var {type: "<Type>", name: "<name>"}`
*   **Broad Match**: `?var {type: "<Type>"}`

##### 2.2.2. Proposition Matching `(...)`
*   **By ID**: `?link (id: "<id>")`
*   **By Structure**: `?link (?subject, "<predicate>", ?object)`
    *   `?subject` / `?object`: Can be a variable, a literal ID, or a nested Concept clause.
    *   Embedded Concept Clause (no variable name): `{ ... }`
    *   Embedded Proposition Clause (no variable name): `( ... )`
*   **Path Modifiers** (on predicate):
    *   Hops: `"<pred>"{m,n}` (e.g., `"follows"{1,3}`).
    *   Alternatives: `"<pred1>" | "<pred2>" | ...`.

##### 2.2.3. Logic & Control Flow
*   **`FILTER( expression )`**: Boolean logic.
    *   Operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`, `!`.
    *   String Functions: `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`, `REGEX`.
*   **`OPTIONAL { ... }`**: Left-join logic. Retains solution even if inner pattern fails. Scope: bound variables visible outside.
*   **`NOT { ... }`**: Exclusion filter. Discards solution if inner pattern matches. Scope: variables inside are private.
*   **`UNION { ... }`**: Logical OR branches. Merges result sets. Scope: branches are independent.

#### 2.3. Examples
```prolog
FIND(?drug.name, ?risk)
WHERE {
    ?drug {type: "Drug"}
    OPTIONAL { ?drug ("has_side_effect", ?effect) }
    FILTER(?drug.attributes.risk_level < 3)
}
```

---

### 3. KML: Knowledge Manipulation Language

#### 3.1. `UPSERT`
Atomic creation or update of a "Knowledge Capsule". Enforces idempotency.

**Syntax**:
```prolog
UPSERT {
  // Concept Definition
  CONCEPT ?handle {
    {type: "<Type>", name: "<name>"} // Match or Create
    SET ATTRIBUTES { <key>: <value>, ... }
    SET PROPOSITIONS {
      ("<predicate>", ?other_handle)
      ("<predicate>", {type: "<ExistingType>", name: "<ExistingName>"})
      ("<predicate>", (?existing_s, "<pred>", ?existing_o))
    }
  }
  WITH METADATA { <key>: <value>, ... } // Optional, concept's local metadata if any

  // Independent Proposition Definition
  PROPOSITION ?prop_handle {
    (?subject, "<predicate>", ?object)
    SET ATTRIBUTES { ... }
  }
  WITH METADATA { ... } // Optional, proposition's local metadata if any
}
WITH METADATA { ... } // Optional, global metadata (as default for all items)
```

**Rules**:
1.  **Sequential Execution**: Clauses execute top-to-bottom.
2.  **Define Before Use**: `?handle`/`?prop_handle` must be defined in a `CONCEPT`/`PROPOSITION` block before being referenced elsewhere.
3.  **Shallow Merge**: `SET ATTRIBUTES` and `WITH METADATA` overwrites specified keys; unspecified keys remain unchanged.
4.  **Provenance**: Use `WITH METADATA` to record provenance (source, author, confidence, time). It can be attached to individual `CONCEPT`/`PROPOSITION` blocks, or to the entire `UPSERT` block (as default for all items).

#### 3.1.1. Idempotency Patterns (Prefer these)

*   **Deterministic identity**: Prefer `{type: "T", name: "N"}` for concepts whenever the pair is stable.
*   **Events**: Use a deterministic `name` if possible so retries do not create duplicates.
*   **Do not** generate random names/ids unless the environment guarantees stable retries.

#### 3.1.2. Safe Schema Evolution (Use Sparingly)

If you need a new concept type or predicate to represent stable memory cleanly:

1) Define it with `$ConceptType` / `$PropositionType` first.
2) Assign it to the `CoreSchema` domain via `belongs_to_domain`.
3) Keep definitions minimal and broadly reusable.

**Common predicates worth defining early**:
*   `prefers` — stable preference
*   `knows` / `collaborates_with` — person relationships
*   `interested_in` / `working_on` — topic associations
*   `derived_from` — link Event to extracted semantic knowledge

Example (define a predicate, then use it later):
```prolog
UPSERT {
  CONCEPT ?prefers_def {
    {type: "$PropositionType", name: "prefers"}
    SET ATTRIBUTES {
      description: "Subject indicates a stable preference for an object.",
      subject_types: ["Person"],
      object_types: ["*"]
    }
    SET PROPOSITIONS { ("belongs_to_domain", {type: "Domain", name: "CoreSchema"}) }
  }
}
WITH METADATA { source: "SchemaEvolution", author: "$self", confidence: 0.9 }
```

#### 3.2. `DELETE`
Targeted removal of graph elements.

*   **Delete Attributes**:
    `DELETE ATTRIBUTES {"key1"} FROM ?var WHERE { ... }`
*   **Delete Metadata**:
    `DELETE METADATA {"key1"} FROM ?var WHERE { ... }`
*   **Delete Propositions**:
    `DELETE PROPOSITIONS ?link WHERE { ?link (...) }`
*   **Delete Concept**:
    `DELETE CONCEPT ?node DETACH WHERE { ... }`
    (*`DETACH` is mandatory: removes node and all incident edges*)

**Deletion safety**:
*   Prefer deleting the **smallest** thing that fixes the issue (metadata field → attribute → proposition → concept).
*   For concept deletion, `DETACH` is mandatory; confirm you are deleting the right node by `FIND` first.

---

### 4. META & SEARCH

Lightweight introspection and lookup commands.

#### 4.1. `DESCRIBE`
*   `DESCRIBE PRIMER`: Returns Agent identity and Domain Map.
*   `DESCRIBE DOMAINS`: Lists top-level knowledge domains.
*   `DESCRIBE CONCEPT TYPES [LIMIT N] [CURSOR "<opaque_token>"]`: Lists available node types.
*   `DESCRIBE CONCEPT TYPE "<Type>"`: Schema details for a specific type.
*   `DESCRIBE PROPOSITION TYPES [LIMIT N] [CURSOR "<opaque_token>"]`: Lists available predicates.
*   `DESCRIBE PROPOSITION TYPE "<pred>"`: Schema details for a predicate.

#### 4.2. `SEARCH`
Full-text search for entity resolution (Grounding).
*   `SEARCH CONCEPT "<term>" [WITH TYPE "<Type>"] [LIMIT N]`
*   `SEARCH PROPOSITION "<term>" [WITH TYPE "<pred>"] [LIMIT N]`

---

### 5. API Structure (JSON-RPC)

#### 5.1. Request (`execute_kip`)

**Single Command**:
```json
{
  "function": {
    "name": "execute_kip",
    "arguments": {
      "command": "FIND(?n) WHERE { ?n {name: :name} }",
      "parameters": { "name": "Aspirin" },
      "dry_run": false
    }
  }
}
```

**Batch Execution**:
```json
{
  "function": {
    "name": "execute_kip",
    "arguments": {
      "commands": [
        "DESCRIBE PRIMER",
        {
           "command": "UPSERT { ... :val ... }",
           "parameters": { "val": 123 }
        }
      ],
      "parameters": { "global_param": "value" }
    }
  }
}
```

**Parameters:**
*   `command` (String): Single KIP command. **Mutually exclusive with `commands`**.
*   `commands` (Array): Batch of commands. Each element: `String` (uses shared `parameters`) or `{command, parameters}` (independent). **Stops on first error**.
*   `parameters` (Object): Placeholder substitution (`:name` → value). A placeholder must occupy a complete JSON value position (e.g., `name: :name`). Do not embed placeholders inside quoted strings (e.g., `"Hello :name"`), because replacement uses JSON serialization.
*   `dry_run` (Boolean): Validate only, no execution.

#### 5.2. Response

**Success**:
```json
{
  "result": [
    { "n": { "id": "...", "type": "Drug", "name": "Aspirin", ... } }
  ],
  "next_cursor": "token_xyz" // Optional
}
```

**Error**:
```json
{
  "error": {
    "code": "KIP_2001",
    "message": "TypeMismatch: 'drug' is not a valid type. Did you mean 'Drug'?",
    "hint": "Check Schema with DESCRIBE."
  }
}
```

---

### 6. Standard Definitions

#### 6.1. System Meta-Types
These must exist for the graph to be valid (Bootstrapping).

| Entity                                                  | Description                                     |
| ------------------------------------------------------- | ----------------------------------------------- |
| `{type: "$ConceptType", name: "$ConceptType"}`          | The meta-definitions                            |
| `{type: "$ConceptType", name: "$PropositionType"}`      | The meta-definitions                            |
| `{type: "$ConceptType", name: "Domain"}`                | Organizational units (includes `CoreSchema`)    |
| `{type: "$PropositionType", name: "belongs_to_domain"}` | Fundamental predicate for domain membership     |
| `{type: "Domain", name: "CoreSchema"}`                  | Organizational unit for core schema definitions |
| `{type: "Domain", name: "Unsorted"}`                    | Temporary holding area for uncategorized items  |
| `{type: "Domain", name: "Archived"}`                    | Storage for deprecated or obsolete items        |
| `{type: "$ConceptType", name: "Person"}`                | Actors (AI, Human, Organization, System)        |
| `{type: "$ConceptType", name: "Event"}`                 | Episodic memory (e.g., Conversation)            |
| `{type: "$ConceptType", name: "SleepTask"}`             | Maintenance tasks for background processing     |
| `{type: "Person", name: "$self"}`                       | The waking mind (conversational agent)          |
| `{type: "Person", name: "$system"}`                     | The sleeping mind (maintenance agent)           |

#### 6.2. Minimal Provenance Metadata (Recommended)
When writing important knowledge, include as many as available:

| Field                        | Type   | Description                                            |
| ---------------------------- | ------ | ------------------------------------------------------ |
| `source`                     | string | Where it came from (conversation id, document id, url) |
| `author`                     | string | Who asserted it (`$self`, `$system`, user id)          |
| `confidence`                 | number | Confidence in `[0, 1]`                                 |
| `observed_at` / `created_at` | string | ISO-8601 timestamp                                     |
| `status`                     | string | `"draft"` \| `"reviewed"` \| `"deprecated"`            |

#### 6.3. Error Codes
| Series   | Category | Example                                                         |
| :------- | :------- | :-------------------------------------------------------------- |
| **1xxx** | Syntax   | `KIP_1001` (Parse Error), `KIP_1002` (Bad Identifier)           |
| **2xxx** | Schema   | `KIP_2001` (Unknown Type), `KIP_2002` (Constraint Violation)    |
| **3xxx** | Logic    | `KIP_3001` (Reference Undefined), `KIP_3002` (Target Not Found) |
| **4xxx** | System   | `KIP_4001` (Timeout), `KIP_4002` (Result Too Large)             |

---

## Default Workflow

Execute this loop for each meaningful interaction:

```
1. RETRIEVE → Check memory for relevant context
2. CLARIFY  → Understand user intent
3. DECIDE   → Does this warrant a write?
4. GROUND   → DESCRIBE if schema uncertain
5. READ     → FIND targets before updating
6. WRITE    → UPSERT with idempotent names
7. LINK     → Assign Domains, build associations
8. VERIFY   → Re-FIND when correctness matters
```

### Quick Retrieval Patterns

```bash
# Start of conversation: get global context
python scripts/execute_kip.py --command 'DESCRIBE PRIMER'

# Search for relevant context
python scripts/execute_kip.py --command 'SEARCH CONCEPT "project goals" LIMIT 5'

# Get user info with preferences
python scripts/execute_kip.py --command 'FIND(?p, ?pref) WHERE {
  ?p {type: "Person"}
  OPTIONAL { (?p, "prefers", ?pref) }
} LIMIT 10'
```

---

## Cold Start

If `DESCRIBE PRIMER` returns minimal data, bootstrap essential structure:

```bash
python scripts/execute_kip.py --command 'UPSERT {
  CONCEPT ?d1 {
    {type: "Domain", name: "Projects"}
    SET ATTRIBUTES { description: "Ongoing work and projects" }
  }
  CONCEPT ?d2 {
    {type: "Domain", name: "Technical"}
    SET ATTRIBUTES { description: "Technical knowledge and references" }
  }
  CONCEPT ?d3 {
    {type: "Domain", name: "Unsorted"}
    SET ATTRIBUTES { description: "Temporary inbox for classification" }
  }
} WITH METADATA { source: "cold_start", author: "$self", confidence: 1.0 }'
```

Then create a `Person` node for the user and store the first interaction as an `Event`.

---

## Domain Strategy

Domains organize knowledge by **topic** (not by data type or app/thread).

User info (preferences, identity, relationships) belongs in `Person` nodes' `attributes`, not separate Domains.

| Domain       | Purpose                         |
| ------------ | ------------------------------- |
| `Projects`   | Ongoing work and goals          |
| `Technical`  | Tech knowledge and references   |
| `Research`   | Research topics and findings    |
| `Operations` | Operational tasks and processes |
| `CoreSchema` | Schema definitions              |
| `Unsorted`   | Temporary inbox                 |

**Heuristics:**
- Pick 1-2 primary Domains per item
- Use `Unsorted` only as short-lived inbox
- If a topic repeats 2+ times, create a Domain for it

**Domain maintenance:**
- Avoid Domain explosion: merge or rename when many tiny Domains appear
- Keep each Domain's `description` up-to-date for better grounding
- Use `aliases` for common synonyms

---

## Memory Hierarchy

| Layer        | Type                   | Lifespan            | Example                            |
| ------------ | ---------------------- | ------------------- | ---------------------------------- |
| **Episodic** | `Event`                | Short → consolidate | "User asked about X on 2025-01-09" |
| **Semantic** | `Person`, custom types | Long-term           | "User prefers dark mode"           |

### Consolidation Flow (Episodic → Semantic)

1. After capturing an `Event`, ask: "Does this reveal something stable?"
2. If yes, extract and store as durable concept
3. Link `Event` to semantic concept via proposition (e.g., `derived_from`)
4. Old Events with consolidated knowledge can be pruned

---

## Association Building

Don't just classify—**connect**. Actively build propositions between concepts:

- `Person` ↔ `Person`: `knows`, `collaborates_with`, `reports_to`
- `Person` ↔ Topic: `interested_in`, `expert_in`, `working_on`
- Concept ↔ Concept: `related_to`, `contradicts`, `extends`, `derived_from`

**Example: Link two people with a relationship**

```bash
python scripts/execute_kip.py --command 'UPSERT {
  CONCEPT ?alice {
    {type: "Person", name: "Alice"}
  }
  CONCEPT ?bob {
    {type: "Person", name: "Bob"}
  }
  PROPOSITION ?link {
    (?alice, "collaborates_with", ?bob)
    SET ATTRIBUTES { project: "KIP", since: "2025-01" }
  }
} WITH METADATA { source: "user_input", author: "$self", confidence: 0.9 }'
```

**Note**: `PROPOSITION` is a top-level block, not nested inside `CONCEPT`.

---

## Memory Maintenance

### Dual-Mode Architecture

| Mode         | Actor     | When                | Scope                                         |
| ------------ | --------- | ------------------- | --------------------------------------------- |
| **Waking**   | `$self`   | During conversation | Lightweight: flag items, quick dedup          |
| **Sleeping** | `$system` | Scheduled cycles    | Deep: batch consolidation, garbage collection |

### Waking Mode ($self)

During conversation, perform only low-cost maintenance:
- **Flag for sleep**: Create `SleepTask` for complex items (don't process immediately)
- **Quick dedup**: `FIND` before creating if ambiguous
- **Obvious consolidation**: Extract stable facts immediately
- **Domain assignment**: Always assign new items (use `Unsorted` if uncertain)

**Do NOT do during waking**: full orphan scans, batch confidence decay, domain restructuring.

### Creating a SleepTask

When encountering items needing deep processing, create a `SleepTask` node:

```prolog
UPSERT {
  CONCEPT ?task {
    {type: "SleepTask", name: "2025-01-09:consolidate:event123"}
    SET ATTRIBUTES {
      target_type: "Event",
      target_name: "ConversationEvent:2025-01-09:user123",
      requested_action: "consolidate_to_semantic",
      reason: "Multiple preferences mentioned, needs careful extraction",
      status: "pending",
      priority: 1
    }
    SET PROPOSITIONS {
      ("assigned_to", {type: "Person", name: "$system"}),
      ("created_by", {type: "Person", name: "$self"})
    }
  }
}
WITH METADATA { source: "WakingMaintenance", author: "$self", confidence: 1.0 }
```

---

## Common Patterns

### Store/Update User Info

User preferences, identity, and relationships are stored directly in `Person` node attributes:

```prolog
UPSERT {
  CONCEPT ?user {
    {type: "Person", name: "user:alice"}
    SET ATTRIBUTES {
      display_name: "Alice",
      preference_theme: "dark",
      preference_language: "zh-CN",
      role: "developer",
      timezone: "Asia/Shanghai"
    }
  }
}
WITH METADATA { source: "conversation", author: "$self", confidence: 0.9 }
```

### Store Conversation Event

```prolog
UPSERT {
  CONCEPT ?e {
    {type: "Event", name: "conv:2025-01-09:kip_discussion"}
    SET ATTRIBUTES {
      event_class: "Conversation",
      content_summary: "Discussed KIP skill optimization and syntax fixes",
      participants: ["user:alice", "$self"],
      outcome: "completed"
    }
    SET PROPOSITIONS {
      ("belongs_to_domain", {type: "Domain", name: "Projects"}),
      ("involves", {type: "Person", name: "user:alice"})
    }
  }
}
WITH METADATA { source: "conversation", author: "$self", confidence: 0.9, observed_at: "2025-01-09T10:00:00Z" }
```

### Define New Predicate (Schema Evolution)

Only define new predicates when truly needed:

```prolog
UPSERT {
  CONCEPT ?pred {
    {type: "$PropositionType", name: "mentors"}
    SET ATTRIBUTES {
      description: "Subject mentors object in professional capacity",
      subject_types: ["Person"],
      object_types: ["Person"]
    }
    SET PROPOSITIONS {
      ("belongs_to_domain", {type: "Domain", name: "CoreSchema"})
    }
  }
}
WITH METADATA { source: "SchemaEvolution", author: "$self", confidence: 0.9 }
```

### Query with Optional and Filter

```prolog
FIND(?person.name, ?person.attributes.role, ?domain.name)
WHERE {
  ?person {type: "Person"}
  OPTIONAL { (?person, "belongs_to_domain", ?domain) }
  FILTER(CONTAINS(?person.attributes.role, "developer"))
}
LIMIT 20
```

---

### Safe Deletion Flow

```bash
# Step 1: Verify target exists
python scripts/execute_kip.py --command 'FIND(?e) WHERE { ?e {type: "Event", name: "old_event"} }'

# Step 2: Dry run
python scripts/execute_kip.py \
  --command 'DELETE CONCEPT ?e DETACH WHERE { ?e {type: "Event", name: "old_event"} }' \
  --dry-run

# Step 3: Execute
python scripts/execute_kip.py \
  --command 'DELETE CONCEPT ?e DETACH WHERE { ?e {type: "Event", name: "old_event"} }'
```
