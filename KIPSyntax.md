## 🧬 KIP (Knowledge Interaction Protocol) Syntax Reference

**Full Spec**: https://raw.githubusercontent.com/ldclabs/KIP/refs/heads/main/SPECIFICATION.md

KIP is a graph-oriented protocol for an agent's long-term memory brain. The graph contains **Concept Nodes** (entities) and **Proposition Links** (facts). LLMs read/write via **KQL** (query), **KML** (manipulate: `UPSERT`/`UPDATE`/`MERGE`/`DELETE`), **META** (introspect/export), and **SEARCH** (keyword/semantic/hybrid grounding). Data uses a JSON-compatible value model; KIP object literals allow unquoted identifier keys as shorthand for JSON string keys.

---

### 1. Data Model & Lexical Rules

#### 1.1. Concept Node & Proposition Link

| Element              | Identity                               | Required fields                                                   | Optional                 |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------- | ------------------------ |
| **Concept Node**     | `id` OR `{type, name}`                 | `type` (UpperCamelCase), `name`                                   | `attributes`, `metadata` |
| **Proposition Link** | `id` OR `(subject, predicate, object)` | `subject`/`object` (concept or link id), `predicate` (snake_case) | `attributes`, `metadata` |

`subject` and `object` may reference another Proposition Link, enabling **higher-order** facts.

#### 1.2. Data Types (JSON)

- **Primitives**: `string`, `number`, `boolean`, `null`.
- **Complex**: `Array`, `Object` — allowed in `attributes` / `metadata`; `FILTER` operates only on primitive comparison values.
- **Object keys**: quoted JSON string keys and unquoted identifier keys are both accepted; unquoted keys are normalized as strings.

#### 1.3. Identifiers & Prefixes

- **Syntax**: `[a-zA-Z_][a-zA-Z0-9_]*`. Case-sensitive.
- **`?`** — query variable (`?drug`).
- **`$`** — system meta-type (`$ConceptType`, `$self`, `$system`).
- **`:`** — parameter placeholder in command text (`:name`, `:limit`).

#### 1.4. Naming Conventions (Required)

| Element                   | Style              | Examples                    |
| ------------------------- | ------------------ | --------------------------- |
| Concept Types             | `UpperCamelCase`   | `Drug`, `ClinicalTrial`     |
| Proposition Predicates    | `snake_case`       | `treats`, `has_side_effect` |
| Attribute / Metadata Keys | `snake_case`       | `risk_level`, `created_at`  |
| Variables                 | `?` + `snake_case` | `?drug`, `?side_effect`     |

Wrong case (e.g. `drug` vs `Drug`) → `KIP_2001`.

#### 1.5. Dot Notation (data access)

In `FIND` / `FILTER` / `ORDER BY`:

- **Concept**: `?var.id`, `?var.type`, `?var.name`
- **Proposition**: `?var.id`, `?var.subject`, `?var.predicate`, `?var.object`
- **Attributes**: `?var.attributes.<key>`
- **Metadata**: `?var.metadata.<key>`
- **Whole object**: `?var.attributes` / `?var.metadata` — full-object projection in `FIND` (not comparable in `FILTER`).

#### 1.6. Schema Bootstrapping (Define Before Use)

KIP is **self-describing**: every legal type/predicate is itself a node.

- `{type: "$ConceptType", name: "Drug"}` registers `Drug` as a concept type.
- `{type: "$PropositionType", name: "treats"}` registers `treats` as a predicate.

Using an unregistered type/predicate → `KIP_2001`.

#### 1.7. Data Consistency

- **Shallow merge**: `SET ATTRIBUTES` and `WITH METADATA` overwrite only specified keys; unspecified keys remain. Array/Object values are overwritten **at the key** (no recursive deep merge) — supply the full array when updating.
- **Proposition uniqueness**: at most one link per `(subject, predicate, object)`. Duplicate `UPSERT` → updates attributes/metadata of the existing link.
- **`expires_at` is a signal, not auto-filter**: expired knowledge stays queryable until a background `$system` process cleans it. Add `FILTER(IS_NULL(?x.metadata.expires_at) || ?x.metadata.expires_at > <now>)` to skip expired entries.

#### 1.8. Reserved System Metadata (`_` namespace) & Optimistic Concurrency

Metadata keys starting with `_` are **engine-maintained and read-only to KML** (writing them → `KIP_2002`). Readable via dot notation like any metadata:

| Field          | Semantics                                                             |
| -------------- | --------------------------------------------------------------------- |
| `_version`     | Monotonic mutation counter (starts at 1). Target of `EXPECT VERSION`. |
| `_updated_at`  | Engine-recorded ISO-8601 time of last mutation.                       |
| `_score`       | Transient normalized `SEARCH` relevance `[0,1]`; never persisted.     |
| `_merged_from` | Provenance trail left by `MERGE` (`"<Type>:<name>"` entries).         |

**`EXPECT VERSION <n>`** (optional line in `UPSERT` `CONCEPT`/`PROPOSITION` blocks, right after the identity clause): block executes only if the element's `_version` equals `<n>`; `EXPECT VERSION 0` = must-not-exist (create-only). On mismatch the whole `UPSERT` aborts with `KIP_3005` → re-read, re-merge, retry. Use it for every read-modify-write of array/object values (e.g., `$self` attributes, logs).

---

### 2. KQL — Knowledge Query Language

```prolog
FIND( <variables_or_aggregations> )
WHERE { <patterns_and_filters> }
ORDER BY <expr> [ASC|DESC], <expr> [ASC|DESC], ...
LIMIT <integer>
CURSOR "<token>"
```

`ORDER BY` / `LIMIT` / `CURSOR` are optional.

#### 2.1. `FIND`

- **Variables / dot-paths**: `FIND(?a, ?b.name, ?b.attributes.risk_level)`
- **Aggregations**: `COUNT(?v)`, `COUNT(DISTINCT ?v)`, `SUM(?v)`, `AVG(?v)`, `MIN(?v)`, `MAX(?v)`.
- **Implicit `GROUP BY`**: when `FIND` mixes plain expressions with aggregations, all non-aggregated expressions form the grouping key. With *only* aggregations, the whole result set is one group.
- **Null handling**: aggregations ignore `null` (unbound) values — `COUNT(?v)` over an `OPTIONAL`-miss group returns `0`.

#### 2.2. `WHERE` Patterns (AND-connected by default)

##### 2.2.1. Concept Match `{...}`

```prolog
?var {id: "<id>"}                       // by id
?var {type: "<Type>", name: "<name>"}   // exact
?var {type: "<Type>"}                   // broad
?var {name: "<name>"}                   // broad
```

When used directly as subject/object inside a proposition clause, omit the variable name: `(?p, "treats", {type: "Symptom", name: "Headache"})`.

##### 2.2.2. Proposition Match `(...)`

```prolog
?link (id: "<id>")                          // by id
?link (?subject, "<predicate>", ?object)    // structural
?link (?subject, ?pred, ?object)            // predicate VARIABLE — associative recall
(?u, "stated", (?s, "<pred>", ?o))          // higher-order (object is a link)
```

The leading `?link` is optional; endpoints are `?var`, an unnamed `{...}` concept clause, or an unnamed nested `(...)` proposition clause. Do not attach a variable name to an embedded endpoint clause — bind it in a separate clause first, then reference the variable.

**Predicate variables**: `?pred` binds the predicate **name** (string); project it in `FIND`, test it in `FILTER` (string ops, `IN`), unify it across clauses. No quantifiers/alternatives on a variable (`?p{1,3}` invalid). Constrain at least one endpoint and add `LIMIT` — engines MAY reject a fully unconstrained `(?s, ?p, ?o)` with `KIP_4002`. The ego-graph ("what surrounds X?") pattern:

```prolog
FIND(?pred, ?neighbor)
WHERE {
  ?link ({type: "Person", name: "Alice"}, ?pred, ?neighbor)
  FILTER(?pred != "belongs_to_domain")
} LIMIT 50
```

**Predicate path modifiers (literal predicates only)**:
- **Hops**: `"<pred>"{m,n}`, `"<pred>"{m,}`, `"<pred>"{n}`. `m == 0` includes a **zero-hop reflexive match** (subject == object, no edge traversed).
- **Alternatives**: `"<p1>" | "<p2>" | ...`.

##### 2.2.3. `FILTER(<bool_expr>)`

| Category   | Operators / Functions                           |
| ---------- | ----------------------------------------------- |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=`                |
| Logical    | `&&`, `\|\|`, `!`                               |
| Membership | `IN(?expr, [v1, v2, ...])`                      |
| Null check | `IS_NULL(?expr)`, `IS_NOT_NULL(?expr)`          |
| String     | `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`, `REGEX` |

```prolog
FILTER(?drug.attributes.risk_level < 3 && CONTAINS(?drug.name, "acid"))
FILTER(IN(?event.attributes.event_class, ["Conversation", "SelfReflection"]))
FILTER(IS_NOT_NULL(?node.metadata.expires_at))
FILTER(?event.attributes.start_time > "2025-01-01T00:00:00Z")  // ISO-8601 string compare
```

##### 2.2.4. `OPTIONAL { ... }` — Left Join

External vars visible inside; internal vars visible outside (`null` if no match). Dot-notation projection on an unbound var yields `null`, and `IS_NULL(?var)` is `true`.

```prolog
?drug {type: "Drug"}
OPTIONAL { (?drug, "has_side_effect", ?side_effect) }
// ?side_effect == null when none exists
```

##### 2.2.5. `NOT { ... }` — Exclusion

External vars visible inside; internal vars are **private** (not visible outside). Discards the solution if the inner pattern matches.

```prolog
?drug {type: "Drug"}
NOT { (?drug, "belongs_to_class", {name: "NSAID"}) }
```

##### 2.2.6. `UNION { ... }` — Logical OR

External vars are **not visible** inside `UNION` (independent scope). Internal vars are visible outside. Both branches run independently; rows are union-ed and **deduplicated**. Same-named variables in both branches are independent bindings; absent variables become `null`.

```prolog
?drug {type: "Drug"}
(?drug, "treats", {name: "Headache"})
UNION {
  ?drug {type: "Drug"}
  (?drug, "treats", {name: "Fever"})
}
```

##### 2.2.7. Variable Scope Summary

| Clause     | External vars visible inside? | Internal vars visible outside? |
| ---------- | ----------------------------- | ------------------------------ |
| `FILTER`   | Yes                           | N/A                            |
| `OPTIONAL` | Yes                           | Yes (`null` on miss)           |
| `NOT`      | Yes                           | **No** (private)               |
| `UNION`    | **No** (independent)          | Yes                            |

#### 2.3. Solution Modifiers

- `ORDER BY <expr> [ASC|DESC], <expr> [ASC|DESC], ...` — one or more comma-separated sort keys, left to right; default `ASC`. Each key: a variable, a dot-path, or an aggregation expression that also appears in `FIND` (e.g., `ORDER BY COUNT(?n) ASC`). **`null` always sorts last** regardless of direction. Memory-ranking idiom: `ORDER BY ?e.attributes.salience_score DESC, ?e.attributes.start_time DESC`.
- `LIMIT N` or `LIMIT :param`.
- `CURSOR "<token>"` or `CURSOR :param` — opaque pagination token from a previous response's `next_cursor`.

#### 2.4. Examples

```prolog
// Optional + filter
FIND(?drug.name, ?side_effect.name)
WHERE {
  ?drug {type: "Drug"}
  OPTIONAL { (?drug, "has_side_effect", ?side_effect) }
  FILTER(?drug.attributes.risk_level < 3)
}

// Aggregation + NOT + ORDER BY + LIMIT
FIND(?drug.name, ?drug.attributes.risk_level)
WHERE {
  ?drug {type: "Drug"}
  (?drug, "treats", {name: "Headache"})
  NOT { (?drug, "belongs_to_class", {name: "NSAID"}) }
  FILTER(?drug.attributes.risk_level < 4)
}
ORDER BY ?drug.attributes.risk_level ASC
LIMIT 20

// Higher-order: confidence that a user stated a fact
FIND(?statement.metadata.confidence)
WHERE {
  ?fact ({type: "Drug", name: "Aspirin"}, "treats", {type: "Symptom", name: "Headache"})
  ?statement ({type: "Person", name: "John Doe"}, "stated", ?fact)
}
```

---

### 3. KML — Knowledge Manipulation Language

Four statements: `UPSERT` (identity-addressed create-or-update), `UPDATE` (pattern-matched bulk mutation), `MERGE` (atomic entity consolidation), `DELETE` (targeted removal).

#### 3.1. `UPSERT` (atomic, idempotent)

```prolog
UPSERT {
  CONCEPT ?handle {
    {type: "<Type>", name: "<name>"}    // match-or-create
    // OR  {id: "<id>"}                 // match-only (must exist)
    EXPECT VERSION <n>                  // optional CAS guard (see §1.8)
    SET ATTRIBUTES { <key>: <value>, ... }
    SET PROPOSITIONS {
      ("<predicate>", ?other_handle)
      ("<predicate>", ?other_handle) WITH METADATA { <key>: <value>, ... }
      ("<predicate>", {type: "<T>", name: "<N>"})    // target must exist or KIP_3002
      ("<predicate>", {id: "<id>"})
      ("<predicate>", (id: "<link_id>"))
      ("<predicate>", (?s, "<pred>", ?o))            // higher-order
    }
  }
  WITH METADATA { ... }                 // local metadata (concept block)

  PROPOSITION ?prop_handle {            // ?prop_handle is optional
    (?subject, "<predicate>", ?object)  // endpoints: ?handle, {...}, or (...)
    // OR  (id: "<id>")                 // match-only
    EXPECT VERSION <n>                  // optional CAS guard (see §1.8)
    SET ATTRIBUTES { ... }
  }
  WITH METADATA { ... }                 // local metadata (proposition block)
}
WITH METADATA { ... }                   // global default for all items
```

**Rules**:
1. **Sequential, top-to-bottom**. Handles must be defined before reference. Dependencies form a **DAG** (no cycles).
2. **Shallow merge** for `SET ATTRIBUTES` / `WITH METADATA`.
3. **`SET PROPOSITIONS` is additive** — new links are added or updated; never deletes unspecified ones. Any item may append `WITH METADATA { ... }`.
4. **Metadata precedence**: inner `WITH METADATA` overrides outer key-by-key (shallow); unspecified keys inherit from outer, and specified `null` still overrides.
5. **Existing target refs**: `{type, name}`, `{id}`, `(id: ...)`, and nested proposition targets must already exist, or return `KIP_3002`.
6. **Provenance**: always set `source`, `author`, `confidence` in `WITH METADATA`.
7. **`EXPECT VERSION` mismatch** aborts the entire `UPSERT` atomically with `KIP_3005` — re-read, re-merge, retry.

##### 3.1.1. Idempotency Patterns

- Prefer **deterministic identity** `{type: "T", name: "N"}` for concepts.
- Use **deterministic Event names** so retries do not duplicate.
- Avoid random names/ids unless retries are guaranteed stable.

##### 3.1.2. Safe Schema Evolution (sparingly)

When stable memory needs a new type/predicate:

1. Define it as `$ConceptType` / `$PropositionType`.
2. Assign it to the `CoreSchema` domain via `belongs_to_domain`.
3. Keep definitions minimal and broadly reusable.

**Common predicates worth registering early**: `prefers`, `knows`, `collaborates_with`, `interested_in`, `working_on`, `derived_from`, `belongs_to_class`.

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

#### 3.2. `UPDATE` (pattern-matched bulk mutation; never creates)

```prolog
UPDATE ?target
SET ATTRIBUTES { <key>: <value_or_expr>, ... }   // ≥1 of the two SET blocks
SET METADATA { <key>: <value_or_expr>, ... }     // `_` keys rejected (KIP_2002)
WHERE { <patterns binding ?target> }
LIMIT N                                          // optional blast-radius cap
```

Atomic: all matched elements update or none. **Update expressions** (numeric, computed per element from `?target`'s *own* state only): `ADD(a, b)`, `MUL(a, b)`, `CLAMP(x, lo, hi)`, `COALESCE(x, default)`. A `null`/non-number expression skips that key for that element. The memory-metabolism workhorse:

```prolog
// Confidence decay across all predicates, one command
UPDATE ?link
SET METADATA { confidence: CLAMP(MUL(?link.metadata.confidence, :factor), 0.0, 1.0), decay_applied_at: :now }
WHERE {
  ?link (?s, ?p, ?o)
  FILTER(IS_NULL(?link.metadata.superseded) || ?link.metadata.superseded != true)
  FILTER(?link.metadata.created_at < :threshold && ?link.metadata.confidence > 0.3)
} LIMIT 500

// Reinforce without read-modify-write
UPDATE ?pref
SET ATTRIBUTES { evidence_count: ADD(COALESCE(?pref.attributes.evidence_count, 0), 1), last_observed: :now }
WHERE { ?pref {type: "Preference", name: :pref_name} }
```

Response: `{"updated": <count>}`.

#### 3.3. `MERGE` (atomic entity consolidation)

```prolog
MERGE CONCEPT ?source INTO ?target
WHERE { ?source {type: "<T>", name: "<dup>"} ?target {type: "<T>", name: "<canonical>"} }
```

Each variable must match **exactly one** node, same `type` (0 → `KIP_3002`; >1 → `KIP_3003`; type mismatch → `KIP_2002`). Atomically: repoints all of source's links to target (link `id`s preserved; (s,p,o) collisions keep target's link, fill its missing keys, drop the duplicate), fills target's missing attributes (target wins; `aliases` unioned + source `name` appended to target's `aliases`), deletes source, records `_merged_from`. Re-running after success → `KIP_3002` = "already merged". Protected nodes → `KIP_3004`.

#### 3.4. `DELETE` (smallest unit first)

Prefer: metadata → attribute → proposition → concept.

```prolog
// Attributes
DELETE ATTRIBUTES {"risk_category", "old_id"} FROM ?drug
WHERE { ?drug {type: "Drug", name: "Aspirin"} }

// Metadata
DELETE METADATA {"old_source"} FROM ?drug
WHERE { ?drug {type: "Drug", name: "Aspirin"} }

// Propositions
DELETE PROPOSITIONS ?link
WHERE {
  ?link (?s, "treats", ?o)
  FILTER(?link.metadata.source == "untrusted_source_v1")
}

// Concept (DETACH is mandatory; removes all incident links)
DELETE CONCEPT ?drug DETACH
WHERE { ?drug {type: "Drug", name: "OutdatedDrug"} }
```

`DELETE ATTRIBUTES` / `DELETE METADATA` targets may be concept or proposition variables. Always verify with `FIND` before `DELETE CONCEPT`; `DETACH` cascades through higher-order propositions. `KIP_3004` protects meta-types, the `Domain` type and `belongs_to_domain` definitions, core domains, `$self`/`$system` identity tuples, and their `core_directives`; ordinary `$self` attributes may evolve.

---

### 4. META & SEARCH

#### 4.1. `DESCRIBE` (introspection)

```
DESCRIBE PRIMER                                 // Agent identity + Domain Map
DESCRIBE DOMAINS                                // top-level domains
DESCRIBE CONCEPT TYPES [LIMIT N] [CURSOR "<t>"] // list concept types
DESCRIBE CONCEPT TYPE "<Type>"                  // schema of one type
DESCRIBE PROPOSITION TYPES [LIMIT N] [CURSOR "<t>"]
DESCRIBE PROPOSITION TYPE "<predicate>"
```

#### 4.2. `SEARCH` (index-driven grounding & associative retrieval)

```
SEARCH CONCEPT "<term>"|:term [WITH TYPE "<Type>"|:type]
  [MODE "keyword"|"semantic"|"hybrid"|:mode] [THRESHOLD <0..1>|:threshold] [LIMIT N|:limit]
SEARCH PROPOSITION "<term>"|:term [WITH TYPE "<predicate>"|:type] [MODE ...] [THRESHOLD ...] [LIMIT N|:limit]
```

- **Modes**: `keyword` (lexical), `semantic` (meaning-based; engine owns embeddings — text in, never vectors), `hybrid` (fused; recommended default). Omitted `MODE` → `hybrid` where supported, else `keyword`; engines without semantic capability silently degrade to `keyword`.
- **Grounding fields**: engines MUST index `name` + `attributes.aliases`; SHOULD index `description` and salient text attributes.
- **Scoring**: each hit carries transient `metadata._score` (`[0,1]`, descending order); `THRESHOLD` drops weak hits — a weak match is worse than an honest miss.
- Use `SEARCH` to resolve fuzzy names → exact `{type, name}` before structured `FIND`; use `MODE "semantic"` when the probe is a *meaning*, not a name.

#### 4.3. `EXPORT` (capsule round-trip; read-only)

```prolog
EXPORT ?target WHERE { ... } [LIMIT N]
```

Serializes matched concepts/propositions into an idempotent `UPSERT` capsule for backup, migration, and agent-to-agent knowledge exchange. Endpoints outside the export set become `{type, name}` refs (must exist on import); reserved `_` metadata is never exported; export needed `$ConceptType`/`$PropositionType` definitions separately if the destination may lack them. Response: `{"capsule": "<KIP script>", "concepts": n, "propositions": m}`.

---

### 5. API (JSON-RPC)

#### 5.1. Functions

- **`execute_kip_readonly`** — KQL (`FIND`) and META (`DESCRIBE` / `SEARCH` / `EXPORT`) only.
- **`execute_kip`** — full read/write (adds KML: `UPSERT` / `UPDATE` / `MERGE` / `DELETE`).

#### 5.2. Parameters

- `command` (String) **OR** `commands` (Array) — mutually exclusive.
- `commands` element: a string (uses shared `parameters`) or `{command, parameters}` (independent).
- `parameters` (Object): `:name` → JSON value substitution. Placeholders must occupy a complete KIP value position (`name: :name`, `LIMIT :limit`, `SEARCH CONCEPT :term`); never embed inside a string literal (`"Hello :name"` is **invalid** — substitution uses JSON serialization).
- `dry_run` (Boolean): validate only.

**Batch error semantics**: KQL / META / syntax errors are returned **inline** and execution continues. The first **KML** (`UPSERT` / `UPDATE` / `MERGE` / `DELETE`) error **stops** the batch.

#### 5.3. Examples

```json
// Single read-only
{
  "function": {
    "name": "execute_kip_readonly",
    "arguments": {
      "command": "FIND(?n) WHERE { ?n {name: :name} }",
      "parameters": { "name": "Aspirin" }
    }
  }
}

// Batch read/write
{
  "function": {
    "name": "execute_kip",
    "arguments": {
      "commands": [
        "DESCRIBE PRIMER",
        { "command": "UPSERT { ... :val ... }", "parameters": { "val": 123 } }
      ],
      "parameters": { "global_param": "value" }
    }
  }
}
```

#### 5.4. Responses

- Single response: `{ "result": ... }` or `{ "error": { "code", "message", "hint"? } }`, with optional `next_cursor`.
- Batch response: `{ "result": [<single_response>, ...] }`; KML stop-on-error may make the array shorter than submitted commands.

```json
// Single success
{ "result": [ { "id": "...", "type": "Drug", "name": "Aspirin" } ], "next_cursor": "token_xyz" }

// Batch (one entry per command)
{ "result": [
  { "result": { ... } },
  { "result": [...], "next_cursor": "abc" },
  { "error": { "code": "KIP_2001", "message": "...", "hint": "..." } }
] }

// Error
{ "error": { "code": "KIP_2001", "message": "TypeMismatch: 'drug' is not a valid type. Did you mean 'Drug'?", "hint": "Check Schema with DESCRIBE." } }
```

---

### 6. Standard Definitions

#### 6.1. Bootstrap Entities (must exist)

| Entity                                                  | Purpose                                |
| ------------------------------------------------------- | -------------------------------------- |
| `{type: "$ConceptType", name: "$ConceptType"}`          | Meta-meta (self-referential genesis)   |
| `{type: "$ConceptType", name: "$PropositionType"}`      | Meta for predicates                    |
| `{type: "$ConceptType", name: "Domain"}`                | Organizational unit type               |
| `{type: "$PropositionType", name: "belongs_to_domain"}` | Domain membership predicate            |
| `{type: "Domain", name: "CoreSchema"}`                  | Holds core schema definitions          |
| `{type: "Domain", name: "Unsorted"}`                    | Holding area for uncategorized items   |
| `{type: "Domain", name: "Archived"}`                    | Deprecated/obsolete items              |
| `{type: "$ConceptType", name: "Person"}`                | Actors (AI, Human, Org, System)        |
| `{type: "$ConceptType", name: "Event"}`                 | Episodic memory                        |
| `{type: "$ConceptType", name: "Preference"}`            | First-class stable preference facts    |
| `{type: "$ConceptType", name: "Insight"}`               | Self-reflective lessons of the agent   |
| `{type: "$ConceptType", name: "Commitment"}`            | Prospective promises & deadlines       |
| `{type: "$ConceptType", name: "SleepTask"}`             | Background maintenance tasks           |
| `{type: "Person", name: "$self"}`                       | The waking mind (conversational agent) |
| `{type: "Person", name: "$system"}`                     | The sleeping mind (maintenance agent)  |

**Core predicates (pre-bootstrapped `$PropositionType`s)**: `belongs_to_domain`, `involves` (Event → Person), `mentions` (Event → any), `consolidated_to` (Event → semantic), `derived_from` (semantic → Event), `prefers` (Person → Preference), `learned` (Person → Insight), `committed_to` (Person → Commitment), `owed_to` (Commitment → Person), `assigned_to` (SleepTask → Person).

#### 6.2. Metadata Field Catalog

**Provenance**

| Field        | Type            | Description                                |
| ------------ | --------------- | ------------------------------------------ |
| `source`     | string \| array | Origin (conversation id, document id, url) |
| `author`     | string          | Asserter (`$self`, `$system`, user id)     |
| `confidence` | number          | `[0, 1]`                                   |
| `evidence`   | array\<string\> | References supporting the assertion        |

**Temporality / Lifecycle**

| Field                          | Type   | Description                                                      |
| ------------------------------ | ------ | ---------------------------------------------------------------- |
| `created_at` / `observed_at`   | string | ISO-8601                                                         |
| `expires_at`                   | string | ISO-8601 — signal for `$system` cleanup; **not** auto-filtered   |
| `valid_from` / `valid_until`   | string | ISO-8601 validity window                                         |
| `status`                       | string | `active` \| `draft` \| `reviewed` \| `deprecated` \| `retracted` |
| `memory_tier`                  | string | `short-term` \| `long-term`                                      |
| `superseded`                   | bool   | `true` for historical (state-evolved) facts                      |
| `superseded_by` / `supersedes` | string | Pointers across the evolution chain                              |
| `superseded_at`                | string | ISO-8601 time when the assertion was superseded                  |

**Context / Auditing**

| Field            | Type            | Description               |
| ---------------- | --------------- | ------------------------- |
| `relevance_tags` | array\<string\> | Topic / domain tags       |
| `access_level`   | string          | `public` \| `private`     |
| `review_info`    | object          | Structured review history |

**Reserved System Fields (`_` namespace — engine-maintained, read-only to KML; see §1.8)**

| Field          | Type            | Description                                            |
| -------------- | --------------- | ------------------------------------------------------ |
| `_version`     | number          | Monotonic mutation counter; target of `EXPECT VERSION` |
| `_updated_at`  | string          | ISO-8601 last-mutation time (engine truth)             |
| `_score`       | number          | Transient `SEARCH` relevance `[0,1]`; never persisted  |
| `_merged_from` | array\<string\> | `MERGE` provenance trail                               |

#### 6.3. Error Codes

| Code       | Name                  | Meaning                                                                          |
| ---------- | --------------------- | -------------------------------------------------------------------------------- |
| `KIP_1001` | `InvalidSyntax`       | Parse or structural error                                                        |
| `KIP_1002` | `InvalidIdentifier`   | Illegal identifier format                                                        |
| `KIP_2001` | `TypeMismatch`        | Unknown type or predicate                                                        |
| `KIP_2002` | `ConstraintViolation` | Schema constraint violated (incl. writing `_` reserved keys, cross-type `MERGE`) |
| `KIP_2003` | `InvalidValueType`    | JSON value type mismatches schema                                                |
| `KIP_3001` | `ReferenceError`      | Undefined variable or handle                                                     |
| `KIP_3002` | `NotFound`            | Referenced node/link does not exist                                              |
| `KIP_3003` | `DuplicateExists`     | Uniqueness constraint violated; `MERGE` variable matched >1 node                 |
| `KIP_3004` | `ImmutableTarget`     | Protected system structure modified/deleted                                      |
| `KIP_3005` | `VersionConflict`     | `EXPECT VERSION` mismatch — re-read, re-merge, retry                             |
| `KIP_4001` | `ExecutionTimeout`    | Query exceeded execution time                                                    |
| `KIP_4002` | `ResourceExhausted`   | Result/resource limit exceeded                                                   |
| `KIP_4003` | `InternalError`       | Unknown internal system error                                                    |

---

### 7. Best Practices (LLM-facing)

1. **Ground before structured query**: use `SEARCH CONCEPT "<term>"` (and `DESCRIBE` for unknown types) before `FIND` — names are ambiguous. When the probe is a *meaning* rather than a name, use `MODE "semantic"` / `"hybrid"` with a `THRESHOLD`.
2. **Cross-language**: the graph stores English `name`/`description` with optional `aliases`; for non-English queries, send **bilingual `SEARCH` probes in parallel** via the `commands` array.
3. **Define before use**: any new type/predicate must be registered via `$ConceptType` / `$PropositionType` first, then assigned to a `Domain`.
4. **Idempotent writes**: prefer `{type, name}` identity; avoid random ids/names unless retries are stable.
5. **Always attach provenance**: `WITH METADATA { source, author, confidence, ... }` — knowledge without provenance is untrusted.
6. **State evolution > deletion**: when a fact changes, mark the old proposition `superseded: true` (with `superseded_by`, `superseded_at`) and upsert the new one with `supersedes`. Keep history.
7. **Respect `expires_at` semantics**: it is a *signal*, not a filter. Add explicit `FILTER(IS_NULL(?x.metadata.expires_at) || ?x.metadata.expires_at > <now>)` only when the query implies "currently valid". Hard deletion belongs to `$system` sleep cycles.
8. **Smallest delete that fixes the issue**: metadata → attribute → proposition → `DELETE CONCEPT ... DETACH`. Always `FIND` first. Never modify/delete protected core: meta-types, the `Domain` type and `belongs_to_domain` definitions, core domains, `$self`/`$system` identity tuples, or `core_directives`.
9. **Batch independent operations** in `commands` to reduce round-trips. Remember: KML errors stop the batch; KQL/META/syntax errors return inline.
10. **Mind variable scope**: `NOT` hides internal bindings; `UNION` doesn't see external bindings; `OPTIONAL` projects `null` on miss.
11. **Use `OPTIONAL` for "may exist"**, `NOT` for "must not exist", `UNION` for "either branch", `FILTER` for value predicates.
12. **Higher-order propositions** `(?u, "stated", (?s, ?p, ?o))` are first-class — use them for provenance, beliefs, and meta-claims rather than flattening into attributes.
13. **`OPTIONAL` projection** of unbound variables yields `null` and `IS_NULL` returns `true` — safe for downstream `FILTER`.
14. **Confidence transparency**: when synthesizing answers, surface `confidence` and recency; prefer high `evidence_count` consolidated patterns over raw single Events.
15. **Explore with predicate variables**: `(?seed, ?pred, ?neighbor)` is the one-query "what do I know about X?" primitive — constrain the seed, exclude noisy predicates in `FILTER`, and always `LIMIT`.
16. **Bulk mutation belongs to `UPDATE`**: decay, counters, status sweeps, salience refresh — one pattern-matched `UPDATE` with `ADD`/`MUL`/`CLAMP`/`COALESCE` beats N per-element `UPSERT`s, and never needs a prior read for pure increments.
17. **Guard read-modify-write with `EXPECT VERSION`**: read `_version` together with the value, merge in memory, write back guarded; on `KIP_3005` re-read and retry. Required discipline for `$self` attributes and any shared array/object value.
18. **Deduplicate with `MERGE`, not by hand**: one atomic `MERGE CONCEPT ?dup INTO ?canonical` repoints every link and preserves aliases/provenance; verify both nodes with `FIND` first.
19. **Reads are reads**: the protocol keeps no access statistics (tracking reads would turn every query into a write, and recall frequency ≠ importance). Decide decay and landmark promotion from author-maintained signals: `evidence_count` (observation), `last_observed` (recency), `salience_score` (impact), `expires_at` (declared intent).
20. **Memories are portable**: use `EXPORT` for backup, migration, and sharing knowledge between agents — and remember imports need the schema and referenced endpoints to exist first.
