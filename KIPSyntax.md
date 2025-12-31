# KIP Syntax Reference

This document contains the **complete KIP syntax specification** shared by all agents (`$self`, `$system`, and future extensions).

**Full Spec Repository**: [KIP](https://github.com/ldclabs/KIP)

---

## 🛑 CRITICAL RULES (The "Must-Haves")

1.  **Case Sensitivity**: You **MUST** strictly follow naming conventions.
    *   **Concept Types**: `UpperCamelCase` (e.g., `Person`, `Event`, `Domain`, `$ConceptType`).
    *   **Predicates**: `snake_case` (e.g., `belongs_to_domain`).
    *   **Attributes**: `snake_case`.
    *   **Variables**: Start with `?` (e.g., `?person`).
    *   **Parameter Placeholders**: Start with `:` (e.g., `:name`, `:limit`) — replaced by `execute_kip.parameters`.
    *   *Failure to follow naming causes `KIP_2001` errors.*
2.  **Define Before Use**: You cannot query or create types/predicates that do not exist in the Schema. Use `DESCRIBE` to check schema first if unsure.
3.  **Update Strategy**:
    *   `SET ATTRIBUTES` performs **Full Replacement** for the specified key. If updating an Array, provide the **entire** new array.
    *   `SET PROPOSITIONS` is **Additive**. It creates new links or updates metadata of existing links.
4.  **Idempotency**: Always ensure `UPSERT` operations are idempotent. Use deterministic IDs where possible.
5.  **Proposition Uniqueness**: Only one `(Subject, Predicate, Object)` link can exist. Repeating an identical link should update attributes/metadata, not create duplicates.
6.  **Shallow Merge Only**: `SET ATTRIBUTES` updates only provided keys; for any provided key whose value is an `Array`/`Object`, the value is overwritten as a whole.
7.  **Prefer Parameters**: When a value comes from user input, pass it via `execute_kip.parameters` instead of string concatenation.
    *   **Placeholders Must Be Whole Values**: A placeholder must occupy a complete JSON value position (e.g., `name: :name`). Do not embed placeholders inside quoted strings (e.g., `"Hello :name"`), because replacement uses JSON serialization.

---

## 1. Cheat Sheet: Common Patterns

**Safe patterns for consulting/updating your external memory via KIP.**

| Intent               | Pattern / Example Code                                                                                                                                              |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Inspect Schema**   | `DESCRIBE PRIMER`                                                                                                                                                   |
| **List known types** | `FIND(?t.name) WHERE { ?t {type: "$ConceptType"} } ORDER BY ?t.name ASC LIMIT 50`                                                                                   |
| **List predicates**  | `FIND(?p.name) WHERE { ?p {type: "$PropositionType"} } ORDER BY ?p.name ASC LIMIT 50`                                                                               |
| **Find persons**     | `FIND(?p.name, ?p.attributes.person_class, ?p.attributes.handle) WHERE { ?p {type: "Person"} } LIMIT 20`                                                            |
| **Find with filter** | `FIND(?p.name) WHERE { ?p {type: "Person"} FILTER(?p.attributes.person_class == "AI") } LIMIT 20`                                                                   |
| **Learn new event**  | `UPSERT { CONCEPT ?e { {type:"Event", name: :event_name} SET ATTRIBUTES { event_class:"Conversation", start_time: :t, content_summary: :s, participants: :ps } } }` |
| **Forget knowledge** | `DELETE PROPOSITIONS ?link WHERE { ?link (?s, ?p, ?o) FILTER(?link.metadata.source == :source) }`                                                                   |
| **Create a domain**  | `UPSERT { CONCEPT ?d { {type:"Domain", name: :domain} SET ATTRIBUTES { description: :desc } } }`                                                                    |
| **Query by domain**  | `FIND(?n.name) WHERE { (?n, "belongs_to_domain", {type:"Domain", name: :domain}) } LIMIT 50`                                                                        |

### Ultra-Common Templates

**A) Query an entity by Type+Name**
```prolog
FIND(?n)
WHERE {
  ?n {type: :type, name: :name}
}
LIMIT 5
```

**A2) List schema (safe discovery first step)**
```prolog
FIND(?t.name)
WHERE { ?t {type: "$ConceptType"} }
ORDER BY ?t.name ASC
LIMIT 100
```

**B) Query relations with metadata filter**
```prolog
FIND(?s.name, ?o.name, ?link.metadata.source, ?link.metadata.confidence)
WHERE {
  ?link (?s, :predicate, ?o)
  FILTER(?link.metadata.confidence >= 0.8)
}
LIMIT 20
```

**B2) Query domain membership (built-in predicate)**
```prolog
FIND(?n.name, ?d.name)
WHERE {
  (?n, "belongs_to_domain", ?d)
}
LIMIT 50
```

**B3) Topic-first storage pattern (Event + Domain + optional context)**
```prolog
UPSERT {
  CONCEPT ?d {
    {type: "Domain", name: :domain}
    SET ATTRIBUTES { description: :domain_desc }
  }

  CONCEPT ?e {
    {type: "Event", name: :event_name}
    SET ATTRIBUTES {
      event_class: "Conversation",
      start_time: :start_time,
      content_summary: :content_summary,
      participants: :participants,
      outcome: :outcome,
      context: :context
    }
    SET PROPOSITIONS { ("belongs_to_domain", ?d) }
  }
}
WITH METADATA { source: :source, author: "$self", confidence: 0.8 }
```

**C) Safe update workflow (Read → Upsert → Verify)**
1) `FIND` target
2) `UPSERT` change
3) `FIND` again to confirm

---

## 2. KQL: Knowledge Query Language

**Structure**:
```prolog
FIND( ?var1, ?var2.attributes.name, COUNT(?var3) )
WHERE {
  /* Graph Patterns */
}
ORDER BY ?var1 ASC
LIMIT 10
CURSOR "<token>"
```

### 2.1. Dot Notation (Accessing Data)
Access internal data directly in `FIND`, `FILTER`, `ORDER BY`:
*   **Top-level**: `?node.id`, `?node.type`, `?link.subject`, `?link.predicate`
*   **Attributes**: `?node.attributes.<key>` (e.g., `?e.attributes.start_time`)
*   **Metadata**: `?node.metadata.<key>` (e.g., `?link.metadata.confidence`)

### 2.2. Match Patterns (`WHERE` Clause)
*   **Concepts**:
    *   `?var {id: "<id>"}` (Match by ID)
    *   `?var {type: "<Type>", name: "<Name>"}` (Match by Type+Name)
    *   `?var {type: "<Type>"}` (Match all of Type)
    *   Variable name can be **omitted** when used directly as subject/object in a proposition clause: `(?drug, "treats", {name: "Headache"})`
*   **Propositions**:
    *   `?link (id: "<id>")`
    *   `?link (?subject, "<predicate>", ?object)`
    *   *Path Operators*: `"<pred>"{m,n}` for m-to-n hops (e.g., `"follows"{1,3}`), `"<p1>"|"<p2>"` for OR.

### 2.3. Logic & Modifiers
*   `FILTER( <bool_expr> )`:
    *   **Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`
    *   **Logical**: `&&` (AND), `||` (OR), `!` (NOT)
    *   **String Functions**: `CONTAINS(?str, "sub")`, `STARTS_WITH(?str, "prefix")`, `ENDS_WITH(?str, "suffix")`, `REGEX(?str, "pattern")`
*   `NOT { ... }`: Exclude patterns (Scope: variables inside are private).
*   `OPTIONAL { ... }`: Left-join style matching (Scope: bound variables visible outside).
*   `UNION { ... }`: Logical OR (Scope: branches are independent).
*   **Aggregation** (in `FIND`): `COUNT(?var)`, `COUNT(DISTINCT ?var)`, `SUM(?var)`, `AVG(?var)`, `MIN(?var)`, `MAX(?var)`.

### 2.4. Scope Pitfalls (Read Carefully)

*   **`NOT`**: variables created inside do not escape. Use it only to exclude.
*   **`OPTIONAL`**: variables created inside may become `null` outside.
*   **`UNION`**: runs independently; variables from the main block are not visible inside the union branch.

---

## 3. KML: Knowledge Manipulation Language

### 3.1. `UPSERT` (Learn/Update)
**Goal**: Solidify knowledge into a "Capsule".

**Before writing**:
*   If any Type/Predicate might not exist, run `DESCRIBE` first.
*   If updating existing knowledge, `FIND` the current values first.
*   Use `WITH METADATA` to record provenance (source, author, confidence, time).

**Syntax**:
```prolog
UPSERT {
  CONCEPT ?e {
    {type: "Event", name: :event_name}
    SET ATTRIBUTES {
      event_class: "Conversation",
      start_time: :start_time,
      content_summary: :content_summary,
      participants: :participants,
      outcome: :outcome
    }
  }
}
WITH METADATA { source: "Conversation:User_123", author: "$self" }
```

**Key syntax notes**:
*   `SET ATTRIBUTES { key: value, ... }`: Shallow-merge attributes (overwrites specified keys only).
*   `SET PROPOSITIONS { ("<predicate>", ?target), ... }`: Add outgoing relations from this concept. Target can be a local handle or an inline concept clause like `{type: "Domain", name: "X"}`.
*   `WITH METADATA { ... }`: Can be attached to individual `CONCEPT`/`PROPOSITION` blocks, or to the entire `UPSERT` block (as default for all items).

### 3.1.1. Idempotency Patterns (Prefer these)

*   **Deterministic identity**: Prefer `{type: "T", name: "N"}` for concepts whenever the pair is stable.
*   **Events**: Use a deterministic `name` if possible (e.g., `${conversation_id}:${turn_id}`) so retries do not create duplicates.
*   **Do not** generate random names/ids unless the environment guarantees stable retries.

### 3.1.2. Safe Schema Evolution (Use Sparingly)

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

### 3.2. `DELETE` (Forget/Prune)
*   **Concept**: `DELETE CONCEPT ?node DETACH WHERE { ?node {name: "BadData"} }`
*   **Propositions**: `DELETE PROPOSITIONS ?link WHERE { ?link (?s, "old_rel", ?o) }`
*   **Attributes**: `DELETE ATTRIBUTES {"temp_id"} FROM ?n WHERE { ... }`
*   **Metadata**: `DELETE METADATA {"old_source"} FROM ?n WHERE { ... }`

**Deletion safety**:
*   Prefer deleting the **smallest** thing that fixes the issue (metadata field → attribute → proposition → concept).
*   For concept deletion, `DETACH` is mandatory; confirm you are deleting the right node by `FIND` first.

---

## 4. META: Exploration & Schema

*   **Schema Discovery**:
    *   `DESCRIBE PRIMER`: Get global summary & domain map.
    *   `DESCRIBE DOMAINS`: List all available cognitive domains.
    *   `DESCRIBE CONCEPT TYPE "<Type>"`: Get attributes & relationships definition.
    *   `DESCRIBE PROPOSITION TYPE "<predicate>"`: Get domain/range definition.
*   **Search** (text-index lookup, not full graph traversal):
    *   `SEARCH CONCEPT "<term>" [WITH TYPE "<Type>"] [LIMIT N]`: Fuzzy find concept by text.
    *   `SEARCH PROPOSITION "<term>" [LIMIT N]`: Fuzzy find proposition predicates.

### 4.1. When You Are Unsure (Mandatory)

If you are uncertain about any of the following, you must run `DESCRIBE`/`SEARCH` before issuing KQL/KML that depends on it:

*   The correct **Type** capitalization (e.g., `Person` vs `person`).
*   Whether a **predicate** exists and its exact spelling.
*   The intended **domain/range** of a predicate.
*   The exact attribute key (snake_case) used by the schema.

---

## 5. Protocol Interface (`execute_kip`)

**Single Command:**
```json
{
  "function": {
    "name": "execute_kip",
    "arguments": {
      "command": "FIND(?p.name) WHERE { ?p {type: \"Person\", name: :name} }",
      "parameters": { "name": "Alice" },
      "dry_run": false
    }
  }
}
```

**Batch Execution (reduces round-trips):**
```json
{
  "function": {
    "name": "execute_kip",
    "arguments": {
      "commands": [
        "DESCRIBE PRIMER",
        "FIND(?t.name) WHERE { ?t {type: \"$ConceptType\"} } LIMIT 50",
        {
          "command": "UPSERT { CONCEPT ?e { {type:\"Event\", name: :name} } }",
          "parameters": { "name": "MyEvent" }
        }
      ],
      "parameters": { "limit": 10 }
    }
  }
}
```

**Parameters:**
*   `command` (String): Single KIP command. **Mutually exclusive with `commands`**.
*   `commands` (Array): Batch of commands. Each element: `String` (uses shared `parameters`) or `{command, parameters}` (independent). **Stops on first error**.
*   `parameters` (Object): Placeholder substitution (`:name` → value).
*   `dry_run` (Boolean): Validate only, no execution.

**Response & Self-Correction**:
*   **Success**: Returns `{"result": [...]}`.
*   **Error**: Returns `{"error": {"code": "KIP_xxxx", ...}}`.
    *   `KIP_1xxx` (Syntax): Re-check parentheses and quotes.
    *   `KIP_2xxx` (Schema): **Stop**. You used a Type/Predicate that doesn't exist. Use `DESCRIBE` to find the correct name (e.g., `Person` vs `person`).
    *   `KIP_3001` (Ref Error): You used a handle before defining it in `UPSERT`. Reorder clauses.

### 5.1. Fast Error Recovery Loop (Do this, do not guess)

1) Read the error code family.
2) Apply the minimal fix:
  - `KIP_1xxx`: fix syntax only (quotes, commas, braces, parentheses).
  - `KIP_2xxx`: run `DESCRIBE` / `SEARCH`, then retry with correct schema names.
  - `KIP_3001`: reorder `UPSERT` so handles are defined before use.
3) Re-run the corrected command.
4) If still failing, stop and ask the user for the missing constraint (e.g., which Type/predicate they intend).

---

## Appendix A: Core Schema Definitions (Pre-loaded)

You can assume these exist (per `capsules/Genesis.kip`, `capsules/Person.kip`, `capsules/Event.kip`). Do not assume others without `DESCRIBE`.

| Entity                              | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| `$ConceptType` / `$PropositionType` | The meta-definitions                         |
| `Domain`                            | Organizational units (includes `CoreSchema`) |
| `belongs_to_domain`                 | Fundamental predicate for domain membership  |
| `Person`                            | Actors (AI, Human, Organization, System)     |
| `Event`                             | Episodic memory (e.g., Conversation)         |
| `$self`                             | The waking mind (conversational agent)       |
| `$system`                           | The sleeping mind (maintenance agent)        |
| `SleepTask`                         | Maintenance tasks flagged for `$system`      |

---

## Appendix B: Minimal Provenance Metadata (Recommended)

When writing important knowledge, include as many as available:

| Field                        | Type   | Description                                            |
| ---------------------------- | ------ | ------------------------------------------------------ |
| `source`                     | string | Where it came from (conversation id, document id, url) |
| `author`                     | string | Who asserted it (`$self`, `$system`, user id)          |
| `confidence`                 | number | Confidence in `[0, 1]`                                 |
| `observed_at` / `created_at` | string | ISO-8601 timestamp                                     |
| `status`                     | string | `"draft"` \| `"reviewed"` \| `"deprecated"`            |

---

## Appendix C: Predefined Predicates

These predicates are commonly used across agents:

| Predicate           | Direction        | Description                |
| ------------------- | ---------------- | -------------------------- |
| `belongs_to_domain` | Any → Domain     | Domain membership          |
| `consolidated_to`   | Event → Semantic | Event consolidation target |
| `derived_from`      | Semantic → Event | Semantic knowledge source  |
| `mentions`          | Event → Any      | Event references a concept |
| `supersedes`        | New → Old        | Fact replacement chain     |
| `assigned_to`       | Task → Person    | Task assignment            |
| `created_by`        | Any → Person     | Creator attribution        |
