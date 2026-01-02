# KIP Syntax Reference

Complete syntax specification for KQL (Query), KML (Manipulation), and META (Discovery).

## Table of Contents

1. [Naming Conventions](#naming-conventions-critical)
2. [Common Patterns Cheat Sheet](#common-patterns-cheat-sheet)
3. [KQL: Knowledge Query Language](#1-kql-knowledge-query-language)
4. [KML: Knowledge Manipulation Language](#2-kml-knowledge-manipulation-language)
5. [META: Schema Discovery](#3-meta-schema-discovery)
6. [Protocol Interface](#4-protocol-interface)
7. [Core Schema](#5-core-schema-pre-loaded)
8. [Metadata Fields](#6-metadata-fields-recommended)

---

## Naming Conventions (CRITICAL)

| Element       | Style            | Examples                        |
| ------------- | ---------------- | ------------------------------- |
| Concept Types | `UpperCamelCase` | `Person`, `Event`, `Domain`     |
| Predicates    | `snake_case`     | `belongs_to_domain`, `treats`   |
| Attributes    | `snake_case`     | `content_summary`, `start_time` |
| Variables     | `?` prefix       | `?person`, `?event`             |
| Placeholders  | `:` prefix       | `:name`, `:limit`               |

## Common Patterns Cheat Sheet

| Intent          | Pattern                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Inspect Schema  | `DESCRIBE PRIMER`                                                                                |
| List types      | `FIND(?t.name) WHERE { ?t {type: "$ConceptType"} } LIMIT 50`                                     |
| List predicates | `FIND(?p.name) WHERE { ?p {type: "$PropositionType"} } LIMIT 50`                                 |
| Find persons    | `FIND(?p.name) WHERE { ?p {type: "Person"} } LIMIT 20`                                           |
| Query by domain | `FIND(?n.name) WHERE { (?n, "belongs_to_domain", {name: :domain}) }`                             |
| Create domain   | `UPSERT { CONCEPT ?d { {type:"Domain", name: :domain} SET ATTRIBUTES { description: :desc } } }` |

---

## 1. KQL: Knowledge Query Language

### Structure

```prolog
FIND( ?var1, ?var2.attributes.name, COUNT(?var3) )
WHERE {
  /* Graph Patterns */
}
ORDER BY ?var1 ASC
LIMIT 10
CURSOR "<token>"
```

### Dot Notation

Access internal data in `FIND`, `FILTER`, `ORDER BY`:

- **Top-level**: `?node.id`, `?node.type`, `?node.name`
- **Attributes**: `?node.attributes.<key>`
- **Metadata**: `?node.metadata.<key>`

### Match Patterns (WHERE Clause)

**Concepts:**
```prolog
?var {id: "<id>"}                    // Match by ID
?var {type: "<Type>", name: "<Name>"} // Match by Type+Name
?var {type: "<Type>"}                 // Match all of Type
```

**Propositions:**
```prolog
?link (id: "<id>")                    // Match by ID
?link (?subject, "<predicate>", ?object) // Structural match
```

**Path Operators:**
```prolog
"follows"{1,5}      // 1-5 hops
"follows"{1,}       // 1+ hops
"a" | "b" | "c"     // OR predicates
```

### Logic Modifiers

**FILTER:**
```prolog
FILTER(?drug.attributes.risk_level < 3)
FILTER(CONTAINS(?name, "acid") && ?confidence > 0.8)
```

**Operators:** `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`
**String Functions:** `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`, `REGEX`

**NOT (Exclusion):**
```prolog
NOT {
  (?drug, "is_class_of", {name: "NSAID"})
}
```

**OPTIONAL (Left Join):**
```prolog
OPTIONAL {
  (?drug, "has_side_effect", ?side_effect)
}
```

**UNION (OR Logic):**
```prolog
(?drug, "treats", {name: "Headache"})
UNION {
  (?drug, "treats", {name: "Fever"})
}
```

### Aggregation Functions

In `FIND`: `COUNT(?var)`, `COUNT(DISTINCT ?var)`, `SUM(?var)`, `AVG(?var)`, `MIN(?var)`, `MAX(?var)`

---

## 2. KML: Knowledge Manipulation Language

### UPSERT (Create/Update)

```prolog
UPSERT {
  CONCEPT ?e {
    {type: "Event", name: :event_name}
    SET ATTRIBUTES {
      event_class: "Conversation",
      start_time: :start_time,
      content_summary: :summary
    }
    SET PROPOSITIONS {
      ("belongs_to_domain", {type: "Domain", name: :domain})
    }
  }
}
WITH METADATA { source: :source, author: "$self", confidence: 0.9 }
```

**Key Rules:**
- `SET ATTRIBUTES`: Shallow merge (overwrites specified keys only)
- `SET PROPOSITIONS`: Additive (creates or updates links)
- `WITH METADATA`: Attaches provenance information

### DELETE

**Delete Concept:**
```prolog
DELETE CONCEPT ?node DETACH
WHERE { ?node {type: "Drug", name: "OutdatedDrug"} }
```

**Delete Propositions:**
```prolog
DELETE PROPOSITIONS ?link
WHERE { ?link (?s, "old_relation", ?o) }
```

**Delete Attributes:**
```prolog
DELETE ATTRIBUTES {"temp_field"} FROM ?n
WHERE { ?n {type: "Person", name: "Alice"} }
```

**Delete Metadata:**
```prolog
DELETE METADATA {"old_source"} FROM ?n
WHERE { ?n {type: "Event", name: :event_name} }
```

---

## 3. META: Schema Discovery

| Command                                               | Description                            |
| ----------------------------------------------------- | -------------------------------------- |
| `DESCRIBE PRIMER`                                     | Global summary, domain map, statistics |
| `DESCRIBE DOMAINS`                                    | List all cognitive domains             |
| `DESCRIBE CONCEPT TYPE "<Type>"`                      | Type definition with attributes        |
| `DESCRIBE PROPOSITION TYPE "<pred>"`                  | Predicate with domain/range            |
| `SEARCH CONCEPT "<term>" [WITH TYPE "<T>"] [LIMIT N]` | Fuzzy concept search                   |
| `SEARCH PROPOSITION "<term>" [LIMIT N]`               | Fuzzy predicate search                 |

---

## 4. Protocol Interface

### Single Command (via Python script)

```bash
python scripts/execute_kip.py \
  --command 'FIND(?p.name) WHERE { ?p {type: "Person"} } LIMIT 10'
```

### With Parameters

```bash
python scripts/execute_kip.py \
  --command 'FIND(?p) WHERE { ?p {type: :type} } LIMIT :limit' \
  --params '{"type": "Person", "limit": 5}'
```

### Batch Execution

```bash
python scripts/execute_kip.py \
  --commands '[
    "DESCRIBE PRIMER",
    "FIND(?t.name) WHERE { ?t {type: \"$ConceptType\"} } LIMIT 50",
    {"command": "UPSERT { CONCEPT ?e { {type:\"Event\", name: :name} } }", "parameters": {"name": "MyEvent"}}
  ]' \
  --params '{"limit": 10}'
```

### Parameter Substitution

Placeholders (`:name`, `:limit`) are replaced by values from `--params` object.

**⚠️ Important:** Placeholders must be complete JSON values:
- ✅ `name: :name`
- ❌ `"Hello :name"` (no string interpolation)

---

## 5. Core Schema (Pre-loaded)

| Entity              | Description                          |
| ------------------- | ------------------------------------ |
| `$ConceptType`      | Meta-type for defining concept types |
| `$PropositionType`  | Meta-type for defining predicates    |
| `Domain`            | Organizational units                 |
| `Person`            | Actors (AI, Human, Organization)     |
| `Event`             | Episodic memory                      |
| `SleepTask`         | Maintenance tasks                    |
| `belongs_to_domain` | Domain membership predicate          |

---

## 6. Metadata Fields (Recommended)

| Field         | Type   | Description                                |
| ------------- | ------ | ------------------------------------------ |
| `source`      | string | Origin (conversation id, URL)              |
| `author`      | string | Who asserted it (`$self`, `$system`, user) |
| `confidence`  | number | Confidence in [0, 1]                       |
| `observed_at` | string | ISO-8601 timestamp                         |
| `status`      | string | `"draft"` / `"reviewed"` / `"deprecated"`  |
