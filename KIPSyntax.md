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

#### 1.7. Schema Bootstrapping (Define Before Use)

KIP is **self-describing**: all legal concept types and proposition predicates are defined as nodes within the graph itself.

*   **`$ConceptType`**: A node `{type: "$ConceptType", name: "Drug"}` defines `Drug` as a legal concept type. Only after this can nodes like `{type: "Drug", name: "Aspirin"}` be created.
*   **`$PropositionType`**: A node `{type: "$PropositionType", name: "treats"}` defines `treats` as a legal predicate. Only after this can propositions using `"treats"` be created.

**Rule**: Any concept type or predicate **must** be explicitly registered via meta-types before being used in KQL/KML. Violating this returns `KIP_2001`.

#### 1.8. Data Consistency Rules

*   **Shallow Merge**: `SET ATTRIBUTES` and `WITH METADATA` in `UPSERT` adopt a **shallow merge** strategy — only specified keys are overwritten; unspecified keys remain unchanged. If a key's value is `Array` or `Object`, the update overwrites at that key (no recursive deep merge). When updating an array attribute, the full array must be provided.
*   **Proposition Uniqueness**: KIP enforces a **(Subject, Predicate, Object) Uniqueness Constraint**. Only one relationship of the same type can exist between two concepts. Duplicate `UPSERT` operations update the metadata/attributes of the existing proposition.

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

##### 2.2.3. `FILTER` Clause
Boolean filtering conditions using dot notation.

**Syntax**: `FILTER(boolean_expression)`

**Operators & Functions**:
*   **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`
*   **Logical**: `&&` (AND), `||` (OR), `!` (NOT)
*   **Membership**: `IN(?expr, [<value1>, <value2>, ...])` — Returns `true` if `?expr` matches any value in the list.
*   **Null Check**: `IS_NULL(?expr)`, `IS_NOT_NULL(?expr)` — Tests whether a value is `null` (absent or explicitly null).
*   **String**: `CONTAINS(?str, "sub")`, `STARTS_WITH(?str, "prefix")`, `ENDS_WITH(?str, "suffix")`, `REGEX(?str, "pattern")`

```prolog
FILTER(?drug.attributes.risk_level < 3 && CONTAINS(?drug.name, "acid"))

// Membership test
FILTER(IN(?event.attributes.event_class, ["Conversation", "SelfReflection"]))

// Null check for attribute existence
FILTER(IS_NOT_NULL(?node.metadata.expires_at))

// Temporal query (ISO 8601 string comparison)
FILTER(?event.attributes.start_time > "2025-01-01T00:00:00Z")
```

##### 2.2.4. `OPTIONAL` Clause
Left-join logic. Retains solution even if inner pattern fails; new variables become `null`.

**Syntax**: `OPTIONAL { ... }`

**Scope**: External variables visible inside. Internal variables visible outside (set to `null` if match fails).

```prolog
?drug {type: "Drug"}
OPTIONAL {
  (?drug, "has_side_effect", ?side_effect)
}
// ?side_effect is null if no side effect exists
```

##### 2.2.5. `NOT` Clause
Exclusion filter. Discards solution if inner pattern matches.

**Syntax**: `NOT { ... }`

**Scope**: External variables visible inside. Internal variables are **private** (not visible outside).

```prolog
?drug {type: "Drug"}
NOT {
  (?drug, "is_class_of", {name: "NSAID"})
}
```

##### 2.2.6. `UNION` Clause
Logical OR. Merges results from independent pattern branches.

**Syntax**: `UNION { ... }`

**Scope**: External variables are **not visible** inside `UNION`. Internal variables are visible outside. `UNION` block runs independently from the main block; results are row-wise merged and **deduplicated**. If both branches bind a variable with the **same name**, they are independent bindings — results are union-ed, with absent variables set to `null`.

```prolog
// Find drugs treating Headache OR Fever
// Each branch independently binds ?drug; results are merged.
?drug {type: "Drug"}
(?drug, "treats", {name: "Headache"})

UNION {
  ?drug {type: "Drug"}
  (?drug, "treats", {name: "Fever"})
}
```

#### 2.3. Variable Scope Summary

| Clause     | External vars visible inside? | Internal vars visible outside? | Behavior                    |
| ---------- | ----------------------------- | ------------------------------ | --------------------------- |
| `FILTER`   | Yes                           | N/A (no bindings)              | Pure filter                 |
| `OPTIONAL` | Yes                           | Yes (null if no match)         | Left join                   |
| `NOT`      | Yes                           | **No** (private)               | Exclusion filter            |
| `UNION`    | **No** (independent)          | Yes                            | OR branches, merged results |

#### 2.4. Solution Modifiers

*   `ORDER BY ?var [ASC|DESC]`: Sort results. Default: `ASC`.
*   `LIMIT N`: Limit number of returned results.
*   `CURSOR "<token>"`: Opaque pagination token from a previous response's `next_cursor`.

#### 2.5. Comprehensive Examples

**Example 1**: Basic query with optional and filter.
```prolog
FIND(?drug.name, ?side_effect.name)
WHERE {
    ?drug {type: "Drug"}
    OPTIONAL {
      ?link (?drug, "has_side_effect", ?side_effect)
    }
    FILTER(?drug.attributes.risk_level < 3)
}
```

**Example 2**: Aggregation with NOT.
```prolog
FIND(?drug.name, ?drug.attributes.risk_level)
WHERE {
  ?drug {type: "Drug"}
  (?drug, "treats", {name: "Headache"})
  NOT {
    (?drug, "is_class_of", {name: "NSAID"})
  }
  FILTER(?drug.attributes.risk_level < 4)
}
ORDER BY ?drug.attributes.risk_level ASC
LIMIT 20
```

**Example 3**: Higher-order proposition. Find the confidence that a user stated a fact.
```prolog
FIND(?statement.metadata.confidence)
WHERE {
  ?fact (
    {type: "Drug", name: "Aspirin"},
    "treats",
    {type: "Symptom", name: "Headache"}
  )
  ?statement ({type: "User", name: "John Doe"}, "stated", ?fact)
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
    // Or: {id: "<id>"}              // Match only (existing node)
    SET ATTRIBUTES { <key>: <value>, ... }
    SET PROPOSITIONS {
      ("<predicate>", ?other_handle)
      ("<predicate>", ?other_handle) WITH METADATA { <key>: <value>, ... }
      ("<predicate>", {type: "<ExistingType>", name: "<ExistingName>"})
      ("<predicate>", {id: "<ExistingId>"})
      ("<predicate>", (?existing_s, "<pred>", ?existing_o))
    }
  }
  WITH METADATA { <key>: <value>, ... } // Optional, concept's local metadata

  // Independent Proposition Definition
  PROPOSITION ?prop_handle {
    (?subject, "<predicate>", ?object) // Match or Create
    // Or: (id: "<id>")               // Match only (existing link)
    SET ATTRIBUTES { ... }
  }
  WITH METADATA { ... } // Optional, proposition's local metadata
}
WITH METADATA { ... } // Optional, global metadata (default for all items)
```

**Key Components**:
*   **`CONCEPT` block**:
    *   `{type: "<Type>", name: "<name>"}`: Matches or creates a concept node.
    *   `{id: "<id>"}`: Matches an existing node only.
    *   `SET ATTRIBUTES { ... }`: Sets/updates attributes (shallow merge).
    *   `SET PROPOSITIONS { ... }`: **Additive** — creates new propositions or updates existing ones. Does not delete unspecified propositions. Each proposition entry can optionally have its own `WITH METADATA { ... }`.
        *   If the target of a proposition (`{type, name}`, `{id}`) does not exist in the graph, returns `KIP_3002`.
*   **`PROPOSITION` block**: For creating standalone proposition links with attributes.
    *   `(?subject, "<predicate>", ?object)`: Matches or creates a proposition link.
    *   `(id: "<id>")`: Matches an existing link only.
*   **`WITH METADATA` block**: Can be attached to individual `CONCEPT`/`PROPOSITION` blocks (local) or to the entire `UPSERT` block (global default).

**Rules**:
1.  **Sequential Execution**: Clauses execute top-to-bottom.
2.  **Define Before Use**: `?handle`/`?prop_handle` must be defined in a `CONCEPT`/`PROPOSITION` block before being referenced elsewhere. Dependencies form a **DAG** (no circular references).
3.  **Shallow Merge**: `SET ATTRIBUTES` and `WITH METADATA` overwrite specified keys; unspecified keys remain unchanged.
4.  **Provenance**: Use `WITH METADATA` to record provenance (source, author, confidence, time).

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
Targeted removal of graph elements. Prefer deleting the **smallest** thing that fixes the issue (metadata → attribute → proposition → concept).

##### 3.2.1. Delete Attributes
**Syntax**: `DELETE ATTRIBUTES { "key1", "key2", ... } FROM ?target WHERE { ... }`

```prolog
// Delete specific attributes from a concept
DELETE ATTRIBUTES {"risk_category", "old_id"} FROM ?drug
WHERE {
  ?drug {type: "Drug", name: "Aspirin"}
}
```

```prolog
// Delete attribute from all proposition links
DELETE ATTRIBUTES { "category" } FROM ?links
WHERE {
  ?links (?s, ?p, ?o)
}
```

##### 3.2.2. Delete Metadata
**Syntax**: `DELETE METADATA { "key1", ... } FROM ?target WHERE { ... }`

```prolog
DELETE METADATA {"old_source"} FROM ?drug
WHERE {
  ?drug {type: "Drug", name: "Aspirin"}
}
```

##### 3.2.3. Delete Propositions
**Syntax**: `DELETE PROPOSITIONS ?link WHERE { ... }`

```prolog
// Delete all propositions from an untrusted source
DELETE PROPOSITIONS ?link
WHERE {
  ?link (?s, ?p, ?o)
  FILTER(?link.metadata.source == "untrusted_source_v1")
}
```

##### 3.2.4. Delete Concept
**Syntax**: `DELETE CONCEPT ?node DETACH WHERE { ... }`

`DETACH` is **mandatory** — removes the node and all incident proposition links. Always confirm the target with `FIND` first.

```prolog
DELETE CONCEPT ?drug DETACH
WHERE {
  ?drug {type: "Drug", name: "OutdatedDrug"}
}
```

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

#### 5.1. Request (`execute_kip` / `execute_kip_readonly`)

**Single Command (Read-Only)**:
```json
{
  "function": {
    "name": "execute_kip_readonly",
    "arguments": {
      "command": "FIND(?n) WHERE { ?n {name: :name} }",
      "parameters": { "name": "Aspirin" }
    }
  }
}
```

**Batch Execution (Read/Write)**:
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

**Parameters (same for both functions):**
*   `command` (String): Single KIP command. **Mutually exclusive with `commands`**.
*   `commands` (Array): Batch of commands. Each element: `String` (uses shared `parameters`) or `{command, parameters}` (independent). **Stops on first error**.
*   `parameters` (Object): Placeholder substitution (`:name` → value). A placeholder must occupy a complete JSON value position (e.g., `name: :name`). Do not embed placeholders inside quoted strings (e.g., `"Hello :name"`), because replacement uses JSON serialization.
*   `dry_run` (Boolean): Validate only, no execution.

#### 5.2. Response

**Single Command Success**:
```json
{
  "result": [
    { "id": "...", "type": "Drug", "name": "Aspirin", ... },
    ...
  ],
  "next_cursor": "token_xyz"
}
```

**Batch Response** (for `commands` array):
```json
{
  "result": [
    { "result": { ... } },
    { "result": [...], "next_cursor": "abc" },
    { "error": { "code": "KIP_2001", ... } }
  ]
}
```
Each element in `result` corresponds to one command. Execution stops on first error; subsequent commands are not executed.

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

#### 6.2. Metadata Field Design
Well-designed metadata is key to building a traceable and self-evolving memory system.

##### Provenance & Trustworthiness
| Field        | Type            | Description                                            |
| ------------ | --------------- | ------------------------------------------------------ |
| `source`     | string \| array | Where it came from (conversation id, document id, url) |
| `author`     | string          | Who asserted it (`$self`, `$system`, user id)          |
| `confidence` | number          | Confidence in `[0, 1]`                                 |
| `evidence`   | array\<string\> | References to evidence supporting the assertion        |

##### Temporality & Lifecycle
| Field                        | Type   | Description                                                                |
| ---------------------------- | ------ | -------------------------------------------------------------------------- |
| `created_at` / `observed_at` | string | ISO-8601 timestamp of creation/observation                                 |
| `expires_at`                 | string | ISO-8601 expiration. Key for automatic "forgetting" by `$system`           |
| `valid_from` / `valid_until` | string | ISO-8601 validity window of the assertion                                  |
| `status`                     | string | `"active"` \| `"draft"` \| `"reviewed"` \| `"deprecated"` \| `"retracted"` |
| `memory_tier`                | string | Auto-tagged: `"short-term"` \| `"long-term"`                               |

##### Context & Auditing
| Field            | Type            | Description               |
| ---------------- | --------------- | ------------------------- |
| `relevance_tags` | array\<string\> | Topic or domain tags      |
| `access_level`   | string          | `"public"` \| `"private"` |
| `review_info`    | object          | Structured review history |

#### 6.3. Error Codes
| Series   | Category | Example                                                         |
| :------- | :------- | :-------------------------------------------------------------- |
| **1xxx** | Syntax   | `KIP_1001` (Parse Error), `KIP_1002` (Bad Identifier)           |
| **2xxx** | Schema   | `KIP_2001` (Unknown Type), `KIP_2002` (Constraint Violation)    |
| **3xxx** | Logic    | `KIP_3001` (Reference Undefined), `KIP_3002` (Target Not Found) |
| **4xxx** | System   | `KIP_4001` (Timeout), `KIP_4002` (Result Too Large)             |