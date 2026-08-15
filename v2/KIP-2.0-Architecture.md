# KIP 2.0 Architecture — A Cognitive State Protocol for Agent Memory Brains

**[English](./KIP-2.0-Architecture.md) | [中文](./KIP-2.0-Architecture_CN.md)**

## Status

**Informative Architecture / KIP 2.0 Design Rationale**

This document defines the architectural foundation and design rationale for KIP 2.0. It is intentionally **not** the normative protocol specification.

The normative consolidation is `KIP-2.0-SPECIFICATION.md`. If this Architecture conflicts with the current Specification, **the Specification takes precedence**.

This Architecture explains the semantic model, protocol boundaries, invariants, trust model, memory model, layering rules, Profile boundary, and Brain integration model that led to the KIP 2.0 specification and its machine-readable artifacts.

KIP 2.0 is designed for one primary goal:

> **Enable AI agents to build a real memory brain in which past observations, knowledge, experiences, evidence, and learned procedures can persist, evolve, remain attributable, and meaningfully change future computation and behavior.**

The document builds on KIP 1.x, the KIP Cognitive Memory Profile, and the Experience Learning Architecture. It preserves the strongest ideas of KIP 1.x while separating concerns that have become semantically coupled as the system evolved.

---

## 0. Executive Thesis

KIP 1.x began as a model-first protocol between an LLM and a structured Cognitive Nexus. Its core abstraction was a self-describing Concept–Proposition graph with query, mutation, grounding, provenance metadata, temporal evolution, consolidation, and forgetting.

KIP 2.0 generalizes that idea.

The central object of KIP 2.0 is no longer merely a **knowledge graph**. It is an agent's **external cognitive state**.

A complete cognitive state must be able to represent at least four fundamentally different questions:

```text
Semantic Plane
    What can be said about the world?

Epistemic Plane
    Who believes or asserts it, why, based on what evidence, and with what confidence?

Mnemonic Plane
    How does the past remain available to influence future computation?

Governance Plane
    Who owns, can observe, can mutate, can share, and can act on this cognitive state?
```

These four planes are orthogonal but connected.

The architecture is summarized as:

```text
                         KIP 2.0
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
     Semantic           Epistemic         Governance
         │                  │                  │
     Concept            Assertion             Space
   Proposition           Evidence            Policy
      Schema            Provenance          Principal
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                        Mnemonic
                            │
            Profile-defined memory structures
             Event / Experience / Skill / ...
                            │
                            ▼
                    Cognitive Runtime
              Query / Mutation / Search / TX
                 Capsule / Change Stream
                            │
                            ▼
                        Anda Brain
             Formation / Recall / Maintenance
                            │
                            ▼
                  Future Decision & Action
```

The key conceptual change is:

> **KIP 2.0 separates what a proposition means from whether anyone believes it.**

This enables contradictory beliefs, multi-source evidence, temporal truth, provenance-aware memory, shared organizational brains, safe memory exchange, and experience-driven learning without collapsing all of those concerns into proposition metadata.

---

# 1. Goals

KIP 2.0 SHOULD make it possible to build a memory brain that can:

1. **Represent meaning** as structured concepts and propositions.
2. **Represent belief without pretending belief is truth.**
3. Preserve multiple conflicting assertions about the same proposition.
4. Represent the evidence and provenance behind a belief.
5. Distinguish observation, statement, inference, prediction, hypothesis, and imported claims.
6. Represent both entity-valued and literal-valued facts with independent epistemic semantics.
7. Preserve temporal evolution without overwriting history.
8. Distinguish truth confidence, source trust, memory accessibility, salience, and practical utility.
9. Preserve goal-directed experience and compile experience into procedural memory.
10. Support private, shared, team, organization, and public cognitive spaces.
11. Enforce access control at the Cognitive Nexus, not merely in prompts.
12. Make imported memory attributable, inspectable, and non-authoritative by default.
13. Support atomic multi-step cognitive state transitions.
14. Support portable, canonical, optionally signed cognitive capsules.
15. Let multiple KIP implementations negotiate capabilities and profiles.
16. Keep the protocol model-first and efficient for LLM generation.
17. Permit conformance testing independent of Anda Brain.
18. Preserve enough backward compatibility that KIP 1.x applications can migrate incrementally.

---

# 2. Non-Goals

KIP 2.0 does **not** attempt to:

- define a complete theory of human cognition;
- reproduce biological memory mechanisms literally;
- expose or persist hidden model chain-of-thought;
- mandate one vector database, graph database, embedding model, or ranking algorithm;
- mandate one epistemic confidence formula;
- mandate one forgetting curve;
- mandate one skill-learning algorithm;
- turn KIP into RDF, SPARQL, SHACL, or a general-purpose ontology language;
- make the Cognitive Nexus the final action authority of an agent;
- define an identity system such as DID as a hard dependency;
- treat every stored record as memory merely because it persists.

KIP provides the substrate. Cognitive profiles and agents define higher-order strategies.

---

# 3. Foundational Definitions

## 3.1 Cognitive State

**Cognitive State** is the durable external state an agent can consult and evolve in order to preserve continuity across otherwise stateless model invocations.

It includes more than knowledge. Depending on the adopted profile, it may contain:

- entities and concepts;
- propositions;
- assertions and counter-assertions;
- evidence;
- observations;
- events;
- experiences;
- skills;
- commitments;
- self-model artifacts;
- provenance;
- access policy;
- memory lifecycle state.

## 3.2 Knowledge

**Knowledge is a reusable regularity that an agent currently has sufficient reason to treat as informative or actionable.**

Knowledge is not identical to a proposition existing in the graph. It emerges from proposition semantics plus active assertions, evidence, trust, time, and the consuming agent's epistemic policy.

## 3.3 Proposition

**A Proposition is a truth-neutral semantic statement.**

Conceptually:

```text
(subject, predicate, object)
```

Example:

```text
(Alice, prefers, DarkMode)
```

The existence of this proposition means only:

> This is a statement the Cognitive Nexus can refer to.

It does **not** mean:

> The Nexus asserts that Alice prefers dark mode.

## 3.4 Assertion

**An Assertion is an epistemic commitment by an actor or process toward a Proposition in a context.**

An Assertion may say that the proposition is:

- supported;
- rejected;
- uncertain;
- observed;
- stated;
- inferred;
- predicted;
- hypothetical.

An Assertion is where epistemic confidence, validity interval, evidence, and assertion lifecycle belong.

## 3.5 Evidence

**Evidence is an identifiable observation, artifact, result, testimony, measurement, or derived item used to support or challenge an Assertion.**

Evidence is not automatically trustworthy merely because it exists.

## 3.6 Experience

**Experience is a situated state–action–observation trajectory traversed by an actor while pursuing a goal.**

It belongs to a Cognitive Memory Profile rather than KIP Core.

## 3.7 Skill

**Skill is experience compiled into a reusable action policy, procedure, or executable competence.**

It also belongs to a Cognitive Memory Profile.

## 3.8 Memory

**Memory is the mechanism by which past cognitive state can condition future computation or behavior.**

Therefore:

```text
Persistence ≠ Memory
Retrieval ≠ Memory
Memory requires potential future influence.
```

## 3.9 Learning

The strongest operational definition is:

```text
Learning =
    a durable, context-appropriate change in future behavior
    caused by prior experience or evidence.
```

KIP can provide learning primitives, but a successful write is not by itself proof of learning.

---

# 4. Design Axioms

KIP 2.0 SHOULD be governed by the following axioms.

## Axiom 1 — Proposition existence does not imply truth

A proposition is referable independently of whether it is believed or asserted.

## Axiom 2 — Assertions carry epistemic commitment

Confidence, stance, validity, retraction, and supersession belong to assertions, not to the abstract proposition.

## Axiom 3 — Contradiction is representable state, not corruption

Two actors may hold incompatible assertions simultaneously. The graph must preserve that state without forcing premature collapse.

## Axiom 4 — Provenance is not authority

Knowing where information came from is necessary but not sufficient to decide whether it is trusted or allowed to influence action.

## Axiom 5 — Engine origin and claimed provenance are different

An agent may claim that “Alice said X”; the engine must separately preserve who actually submitted that claim, through which channel, in which transaction, and from which space.

## Axiom 6 — Attributes are not automatically epistemic facts

If a value needs independent provenance, contradiction handling, temporal validity, confidence, or sharing policy, it SHOULD be modeled as a Proposition + Assertion rather than buried inside a Concept attribute.

## Axiom 7 — Domain is not Space

`Domain` answers **what topic is this about?**

`MemorySpace` answers **whose cognitive state is this, and under what governance boundary?**

## Axiom 8 — Identity is not a display name

Names are grounding aids. Durable identity requires an immutable local ID and may optionally include a canonical cross-system identifier.

## Axiom 9 — Truth confidence is not memory accessibility

`confidence`, `trust`, `memory_strength`, `salience`, and `utility` are separate dimensions.

## Axiom 10 — Time has multiple clocks

World validity time, observation time, assertion time, and engine transaction time must not be conflated.

## Axiom 11 — Semantic similarity is not applicability

A retrieved memory or Skill can be highly similar yet inappropriate to the current state.

## Axiom 12 — External memory cannot self-escalate authority

Imported content cannot grant itself permission to control tools, alter policies, or become executable merely by containing instructions that say it should.

## Axiom 13 — Raw history and consolidated cognition are both valuable

Consolidation may compress experience, but enough provenance must remain to audit or revise the result.

## Axiom 14 — The protocol provides signals; the Brain owns cognitive policy

KIP should expose primitives and evidence. Anda Brain or another cognitive runtime decides consolidation algorithms, retrieval policy, forgetting strategy, and self-model evolution.

## Axiom 15 — Model-first ergonomics remain a primary constraint

A formally elegant model that LLMs cannot reliably generate is not a successful KIP design.

---

# 5. Architectural Layers

KIP 2.0 is divided into four semantic planes plus a runtime substrate.

```text
┌───────────────────────────────────────────────┐
│ Governance Plane                              │
│ Space / Principal / Policy / Classification   │
├───────────────────────────────────────────────┤
│ Mnemonic Plane                                │
│ Memory lifecycle / activation / profile data  │
├───────────────────────────────────────────────┤
│ Epistemic Plane                               │
│ Assertion / Evidence / Provenance / Trust     │
├───────────────────────────────────────────────┤
│ Semantic Plane                                │
│ Concept / Literal / Proposition / Schema      │
├───────────────────────────────────────────────┤
│ Cognitive Runtime                             │
│ Query / Mutation / Search / Transaction       │
│ Capsule / Import / Export / Change Stream     │
└───────────────────────────────────────────────┘
```

The planes are conceptual separations, not necessarily separate storage systems.

---

# 6. Semantic Plane

The Semantic Plane describes what can be said.

## 6.1 Concept

A `Concept` denotes an entity, category, abstract idea, artifact, or other referable object.

Recommended logical identity:

```text
id              immutable Nexus-local ID
schema_ref      canonical type/schema reference
name            human/LLM-friendly primary label
canonical_id    optional cross-system stable identifier
aliases         optional grounding aliases
attributes      local structured payload
```

### Identity rule

KIP 1.x commonly uses `type + name` as a logical identity. KIP 2.0 SHOULD preserve that as an ergonomic grounding key where useful, but SHOULD NOT treat it as the final universal identity model.

The canonical identity model is:

```text
Nexus-local immutable id
    + optional canonical_id
    + one or more human grounding labels
```

## 6.2 Literal

KIP 2.0 SHOULD permit proposition objects to be literal values.

Examples:

```text
(Alice, timezone, "+08:00")
(ProjectX, status, "active")
(Aspirin, molecular_formula, "C9H8O4")
```

A Literal uses the KIP JSON-compatible value model:

```text
string
number
boolean
null
```

Complex objects and arrays MAY remain attributes unless a profile defines a canonical value object.

## 6.3 Proposition

A Proposition is structurally identified by:

```text
(subject, predicate, object)
```

where:

```text
subject = referable resource
predicate = registered proposition type
object = referable resource OR literal
```

A proposition SHOULD remain structurally unique within its semantic scope. This turns the old KIP 1.x `(S,P,O)` uniqueness constraint from a limitation into a useful canonicalization property:

> There is one canonical proposition for a semantic statement, and any number of assertions about it.

Example:

```text
P1 = (Bob, is_vegetarian, true)
```

The system may hold:

```text
Assertion A: Alice supports P1
Assertion B: Carol rejects P1
Assertion C: Doctor supports P1 for 2024 only
```

without duplicating P1.

## 6.4 Higher-Order Semantics

KIP 1.x already permits propositions to participate in higher-order relationships. KIP 2.0 preserves the ability to refer to propositions as first-class semantic terms.

However, epistemic statements SHOULD normally refer to an `Assertion`, not attach belief metadata directly to the Proposition.

Example:

```text
AssertionA ── supported_by ──> Evidence7
AssertionB ── contradicts ───> AssertionA
```

rather than overloading proposition metadata.

## 6.5 Attribute Rule

Attributes remain useful and SHOULD NOT be eliminated.

Use attributes for:

- local display labels;
- compact implementation hints;
- aggregate counters;
- structured payload that does not require independent epistemic treatment;
- profile-internal operational state.

Use Proposition + Assertion when a field needs:

- its own source;
- its own confidence;
- independent validity time;
- contradiction;
- retraction;
- sharing policy;
- external evidence;
- independent historical evolution.

This rule prevents a whole Concept node from inheriting one source/confidence value for unrelated factual properties.

---

# 7. Epistemic Plane

The Epistemic Plane describes why a proposition should or should not influence belief.

## 7.1 Assertion

Recommended logical structure:

```text
Assertion
├ proposition
├ asserted_by
├ stance
├ mode
├ confidence
├ valid_from / valid_until
├ asserted_at
├ status
├ evidence links
├ provenance links
└ optional context
```

### `stance`

Recommended core values:

```text
support
reject
uncertain
```

### `mode`

Recommended values:

```text
observed
stated
inferred
predicted
hypothetical
imported
```

Profiles MAY define additional modes.

### `status`

Recommended lifecycle:

```text
active
retracted
superseded
expired
```

`superseded` means a newer assertion replaces this assertion for a particular temporal or contextual interpretation. It does not delete the old assertion.

## 7.2 Confidence

`confidence` belongs to the Assertion and answers:

> **How strongly does this assertion support its stance under its stated conditions?**

It is not:

- source trust;
- recall frequency;
- memory strength;
- salience;
- action utility.

No universal KIP formula for confidence is prescribed.

## 7.3 Evidence

Evidence SHOULD be first-class and addressable.

Recommended logical fields:

```text
Evidence
├ evidence_class
├ content_ref or compact content
├ observed_at
├ subject/context
├ content_digest
├ media_type
├ origin
└ lifecycle state
```

Possible evidence classes:

```text
observation
user_statement
tool_result
measurement
document
web_resource
message
external_assertion
derived_result
human_feedback
```

Evidence SHOULD be immutable where possible. Corrections SHOULD create new evidence or attach a retraction/correction relation rather than silently rewriting history.

## 7.4 Supporting and Counter-Evidence

Assertions SHOULD be able to reference both:

```text
supported_by
challenged_by
```

This permits an agent to preserve unresolved epistemic tension rather than collapsing to one truth prematurely.

## 7.5 Provenance

KIP 2.0 SHOULD model provenance as a graph, not only as free-form metadata strings.

A minimal provenance model is inspired by the general pattern:

```text
Entity ── used/generated by ── Activity ── associated with ── Agent
```

KIP does not need to adopt PROV-O syntax, but it SHOULD preserve equivalent capabilities.

Example:

```text
WebPageSnapshot
      │ used_by
      ▼
ExtractionActivity
      │ generated
      ▼
Evidence17
      │ supports
      ▼
Assertion42
```

## 7.6 Claimed Provenance vs. Engine Origin

This distinction is security-critical.

### Claimed provenance

What the submitting agent says happened:

```text
"Alice told me X"
"This came from document Y"
```

### Engine origin

What the Cognitive Nexus can attest about the write itself:

```text
origin_principal
origin_space
origin_channel
transaction_id
created_at
parent transaction / import id
content digest
```

Engine origin SHOULD be system-maintained and non-author-writable.

This prevents an imported or summarized memory from laundering its own origin simply by rewriting its `source` field.

## 7.7 Trust

Trust answers:

> **How much epistemic authority should this source, principal, evidence class, or origin have in this context?**

Trust SHOULD normally be a governance/epistemic policy input rather than a property permanently copied onto every proposition.

Examples:

```text
trust(user self-report, personal preference) = high
trust(user self-report, medical diagnosis) = limited
trust(verified tool result, deployment status) = high
trust(imported unsigned memory, executable skill) = near zero
```

## 7.8 Belief Projection

KIP Core SHOULD NOT prescribe one universal belief aggregation algorithm.

Instead, KIP 2.0 defines the concept of an **Epistemic Projection**:

> A context-dependent view over propositions and assertions that selects which propositions are currently accepted, rejected, uncertain, or contested for a consuming principal.

Conceptually:

```text
Raw Cognitive State
    propositions + assertions + evidence + policy
                    │
                    ▼
             Epistemic Projection
                    │
          ┌─────────┼─────────┐
          │         │         │
       accepted   contested  rejected
```

A Brain may use different projections for different tasks.

For example, a cautious medical agent and a casual personal assistant can operate over the same assertions but adopt different acceptance thresholds.

## 7.9 KIP 1.x Ergonomic Compatibility

KIP 2.0 SHOULD preserve simple proposition writing as syntactic sugar.

A v1-style operation conceptually saying:

```text
Alice prefers DarkMode
```

may be desugared into:

```text
1. canonical Proposition(Alice, prefers, DarkMode)
2. positive Assertion over that Proposition
3. asserted_by = authenticated caller or explicit actor
4. engine origin attached automatically
```

Similarly, a v1-style proposition query MAY operate over the active accepted projection rather than all raw proposition terms.

Native KIP 2.0 clients SHOULD be able to query Assertions explicitly.

This preserves model-first ergonomics while fixing the underlying semantics.

---

# 8. Temporal Model

KIP 2.0 SHOULD explicitly distinguish multiple temporal dimensions.

## 8.1 Valid Time

When the assertion is claimed to hold in the world:

```text
valid_from
valid_until
```

Example:

```text
Alice lived in Shanghai from 2021 to 2025.
```

## 8.2 Observation Time

When evidence was observed:

```text
observed_at
```

## 8.3 Assertion Time

When the actor made or generated the assertion:

```text
asserted_at
```

## 8.4 Engine Transaction Time

When the Nexus recorded or mutated the element:

```text
_created_at
_updated_at
_transaction_id
```

These fields are engine truth and SHOULD be immutable or engine-maintained.

## 8.5 Why Multiple Time Axes Matter

The following are different questions:

> What was Alice's location on 2025-03-01?

and:

> On 2025-03-01, what did the agent believe Alice's location was?

The first asks about **valid time**.

The second asks about **knowledge-as-of transaction/assertion time**.

KIP 2.0 SHOULD be architected so future KQL can express both without changing the data model again.

---

# 9. Mnemonic Plane

The Mnemonic Plane describes how cognitive state remains available to influence future computation.

KIP Core SHOULD define the lifecycle hooks and common signal semantics, while concrete memory types remain profile-defined.

## 9.1 What Belongs in Core

Core may standardize cross-cutting concepts such as:

```text
retention class
expiry / archival state
system timestamps
memory activation hints
```

but SHOULD avoid requiring every graph element to behave like human memory.

## 9.2 What Belongs in Cognitive Profiles

The Cognitive Memory Profile may define:

```text
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Skill
SelfModel artifacts
```

plus their metabolism rules.

## 9.3 Orthogonal Cognitive Signals

The architecture recognizes at least five distinct signals:

| Signal | Question |
| --- | --- |
| `confidence` | How well-supported is this assertion? |
| `trust` | How much authority does this origin/source have here? |
| `memory_strength` | How strongly should this memory compete for recall? |
| `salience` | How important or memorable is it? |
| `utility` | How useful has it been for future action? |

These values MUST NOT be treated as synonyms.

## 9.4 Memory Strength

`memory_strength` is profile-level mnemonic accessibility.

It may rise with:

- reconfirmation;
- successful use;
- repeated contextual relevance;
- rehearsal;
- high salience.

It may fall with:

- disuse;
- competing consolidated representations;
- deliberate deactivation.

A true fact can remain:

```text
confidence = 0.99
memory_strength = 0.20
```

without contradiction.

## 9.5 Salience

Salience captures subjective importance or memorability.

For experience learning, salience SHOULD NOT be based only on emotional intensity. Prediction error, outcome magnitude, novelty, goal relevance, and human feedback may be more useful signals.

## 9.6 Utility

Utility is especially relevant to Skills and procedural memory.

It answers:

> Under matching conditions, how useful has this procedure been?

Repeated failure can increase the *learning value* of an Experience while decreasing the utility of a Skill.

## 9.7 Forgetting Has Multiple Meanings

KIP 2.0 SHOULD stop using a single word “forgetting” for several unrelated operations.

```text
Epistemic forgetting
    assertion retracted / superseded

Mnemonic forgetting
    lower memory strength / no longer spontaneously recalled

Archival forgetting
    excluded from normal recall but retained for audit

Governance forgetting
    access revoked

Physical forgetting
    bytes actually purged
```

These are independent transitions.

Physical deletion SHOULD remain conservative and auditable.

---

# 10. Governance Plane

A real memory brain needs ownership and authority boundaries.

## 10.1 Principal

A `Principal` is an authenticated execution identity known to the Cognitive Nexus.

It is not necessarily the same as a graph `Person` Concept.

Examples:

```text
human account
business agent
maintenance worker
organization service
external agent
```

The Governance Plane may map a Principal to one or more graph identities.

## 10.2 MemorySpace

A `MemorySpace` is the primary ownership, policy, and isolation boundary.

Examples:

```text
personal://yan
org://alink
project://kip
family://qing
public://research
```

A Space controls:

- ownership;
- read/write authority;
- default policy;
- schema packages;
- import/export policy;
- retention requirements;
- audit requirements.

## 10.3 Domain vs. Space

```text
Domain = semantic/topic organization
Space  = governance/ownership boundary
```

A `Rust` domain can exist in multiple Spaces.

A Project Space can contain many Domains.

## 10.4 Policy Enforcement

Policy MUST be enforced by the Cognitive Nexus before data is returned or mutated.

Prompt-only privacy is insufficient.

Every query/mutation conceptually executes under:

```text
principal
space
capabilities
purpose/context
operation
```

## 10.5 Permissions

A future KIP 2.0 policy model SHOULD be capable of expressing at least:

```text
read
write
assert
retract
maintain
export
import
share
administer policy
```

Profiles may define finer rights.

## 10.6 Data Classification

Cognitive objects may carry policy-relevant labels such as:

```text
public
internal
private
secret
sensitive
```

The label itself is not the policy. Policy determines what the label means for a principal.

## 10.7 Memory Authority Classes

KIP 2.0 SHOULD distinguish how strongly stored content is allowed to influence action.

Recommended conceptual classes:

```text
descriptive
    may inform answers

advisory
    may recommend actions

behavioral
    may influence decision policy

executable
    may contain code / prompts / tool procedures
```

A memory item's semantic content MUST NOT be allowed to raise its own authority class.

## 10.8 Imported Skills

Externally imported Skills SHOULD default to:

```text
status = candidate or inactive
execution authority = none
```

until validated by local policy or experience.

The fact that a Skill is signed proves origin/integrity; it does not prove safety, applicability, or correctness.

## 10.9 Origin-Bound Authority

Security-sensitive authority SHOULD be bound to engine-observed origin, not inferred from mutable content or an agent-generated summary.

Derived memories SHOULD preserve origin lineage even after:

- summarization;
- consolidation;
- semantic abstraction;
- skill compilation;
- cross-agent transfer.

A transformation may create a new artifact, but it must not erase the authority constraints inherited from its inputs unless an explicitly authorized elevation process occurs.

---

# 11. Cognitive Memory Profile

KIP Core does not hard-code one cognitive taxonomy.

The **KIP Cognitive Memory Profile** defines a standardized memory architecture on top of Core.

Recommended initial profile types:

```text
Person
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Skill
SleepTask
SelfModel artifacts
```

This profile answers questions KIP Core intentionally does not:

- When should an Event be formed?
- Which trajectories deserve Experience encoding?
- What is an ExperienceStep?
- How does procedural consolidation produce a Skill?
- How does memory strength change?
- When is a Commitment overdue?
- What makes an autobiographical landmark?

The profile is portable; the algorithm implementing it is not mandated.

---

# 12. Experience Learning Integration

A memory brain must connect observation to future action.

## 12.1 Full Learning Loop

```text
Environment / Human / Tool
          │
          ▼
      Observation
          │
          ▼
        Evidence
          │
          ▼
      Assertion(s)
          │
          ├──────────────> Semantic Consolidation
          │                         │
          │                         ▼
          │                      Knowledge
          │
          ▼
   Event / Experience
          │
          ├──────────────> Reflection ─────> Insight / Self Model
          │
          └──────────────> Procedural Consolidation
                                    │
                                    ▼
                                  Skill
                                    │
                                    ▼
                              Action Recall
                                    │
                                    ▼
                              Future Action
                                    │
                                    └──────↺
```

## 12.2 Experience Is Evidence of a Procedure, Not the Procedure Itself

One successful Experience does not prove a Skill is generally useful.

A Skill SHOULD preserve:

- applicability;
- preconditions;
- procedure;
- success criteria;
- failure modes;
- counterexamples;
- supporting Experiences;
- validation history;
- origin authority.

## 12.3 Failure Is First-Class

A failed Experience can teach:

- a negative precondition;
- a diagnostic branch;
- a recovery strategy;
- an invalid assumption;
- a counterexample to a Skill.

It SHOULD NOT be discarded merely because the task failed.

## 12.4 Action Recall

Memory retrieval for action SHOULD be different from ordinary question answering.

A useful Action Briefing can include:

```text
Relevant accepted knowledge
Contested assumptions
Applicable Skills
Skill provenance and authority
Similar successful Experiences
Relevant failed Experiences / counterexamples
Open commitments
Current constraints
Unverified preconditions
Warnings
```

The consuming agent remains the final action authority.

---

# 13. Cognitive Runtime

The Cognitive Runtime exposes the protocol operations over the four planes.

## 13.1 Query

KQL remains the structured retrieval language.

KIP 2.0 architecture anticipates at least three conceptual query views:

### Raw View

Returns propositions, assertions, evidence, and provenance without collapsing epistemic differences.

### Epistemic View

Returns a context-specific accepted/contested/rejected projection.

### Memory View

Returns profile-aware memories ranked using mnemonic and task-relevance signals.

The exact syntax is intentionally deferred.

## 13.2 Mutation

KML remains the mutation language.

Native KIP 2.0 mutations should be capable of:

- creating canonical propositions;
- adding assertions;
- retracting/superseding assertions;
- attaching evidence;
- performing entity merge;
- updating profile state;
- manipulating schema packages under policy.

## 13.3 Atomic Multi-Command Transactions

KIP 1.x guarantees atomicity inside an individual write statement but not across an arbitrary command batch.

KIP 2.0 SHOULD support an atomic batch execution mode.

Conceptually:

```json
{
  "commands": ["...", "...", "..."],
  "transaction": "atomic",
  "idempotency_key": "..."
}
```

The protocol should provide:

```text
transaction_id
commit status
idempotency result
mutation counts
receipt digest
```

This is required for safe cognitive transitions such as:

```text
create new assertion
supersede previous assertion
attach new evidence
close commitment
```

which should not leave half-completed state.

## 13.4 Optimistic Concurrency

`EXPECT VERSION` remains a valuable KIP primitive and SHOULD be retained.

The architecture should additionally allow transaction-level conflict detection where appropriate.

## 13.5 Search

`SEARCH` remains an associative grounding primitive.

Embeddings remain an implementation detail and SHOULD NOT cross the protocol boundary.

KIP 2.0 SHOULD allow implementations to expose score explanation components, for example:

```text
semantic similarity
lexical score
graph proximity
```

without forcing one global ranking formula.

The Brain may then combine retrieval signals with:

```text
applicability
confidence
trust
memory_strength
salience
utility
recency
policy
```

## 13.6 Change Stream

KIP 2.0 SHOULD define an optional change-stream capability.

Conceptually:

```text
CHANGES SINCE <cursor>
```

or an API equivalent.

Use cases:

- replication;
- secondary index updates;
- cache invalidation;
- audit;
- sleep/maintenance triggers;
- synchronization;
- backup;
- external monitoring.

The change stream is engine truth, distinct from Brain maintenance logs.

## 13.7 Capability Negotiation

A KIP endpoint SHOULD be self-describing at the runtime level.

Conceptually:

```text
DESCRIBE CAPABILITIES
```

Response should communicate:

```text
KIP protocol version
supported profiles
query features
search modes
atomic batch support
policy support
signed capsule support
change stream support
limits
extensions
```

This extends KIP's existing self-describing philosophy from schema introspection to runtime introspection.

---

# 14. Schema Architecture

KIP 1.x stores schema in the graph. KIP 2.0 SHOULD preserve that property while making schemas portable and versionable.

## 14.1 Schema Package

A Schema Package is a versioned collection of:

```text
package_id
version
dependencies
concept types
proposition types
constraints
aliases
migration metadata
compatibility range
```

Example logical identifiers:

```text
kip://core@2.0
kip://profiles/cognitive-memory@2.0
kip://ldclabs/organization@1.0
```

The URI format above is illustrative, not yet normative.

## 14.2 Canonical Schema Identity

Human-friendly type names remain useful:

```text
Person
Skill
Organization
```

but the canonical type identity SHOULD include package namespace + version lineage.

This avoids unrelated ecosystems defining incompatible `Person` or `Skill` types with the same local name.

## 14.3 Validation

KIP 2.0 schema constraints SHOULD become machine-verifiable contracts rather than guidance only.

An implementation may offer different strictness levels, but conformance requires a deterministic validation model for declared constraints.

Schema introspection SHOULD remain optimized for LLM consumption.

## 14.4 Migration

Schema Packages SHOULD be able to describe migration compatibility such as:

```text
backward compatible
requires transform
breaking
```

The protocol need not execute arbitrary migration code automatically.

---

# 15. Cognitive Capsule 2.0

KIP 1.x Knowledge Capsules provide portable, idempotent graph updates. KIP 2.0 extends the idea into a **Cognitive Capsule**.

## 15.1 Capsule Goals

A Cognitive Capsule SHOULD be:

- portable;
- deterministic;
- inspectable;
- schema-aware;
- provenance-preserving;
- policy-aware;
- hashable;
- optionally signed;
- safely previewable before import.

## 15.2 Logical Structure

```text
CognitiveCapsule
├ manifest
├ schema dependencies
├ concepts
├ propositions
├ assertions
├ evidence
├ provenance
├ mnemonic/profile state
├ policy/classification hints
├ canonical digest
└ optional proofs/signatures
```

## 15.3 Canonical Representation

KIP DSL is optimized for model interaction, not content-addressed signing.

Therefore KIP 2.0 SHOULD define a canonical machine representation separate from the human/model-friendly DSL.

A canonical JSON representation is a strong default candidate.

Canonicalization MUST define:

- object key ordering;
- number representation;
- Unicode handling;
- element ordering or set canonicalization;
- reference normalization;
- omitted/default fields.

## 15.4 Integrity and Signatures

Cryptographic proof verifies:

```text
integrity
origin/authorship binding
```

It does **not** verify:

```text
truth
safety
utility
applicability
```

This distinction MUST remain explicit.

## 15.5 Import Lifecycle

KIP 2.0 SHOULD support import modes conceptually equivalent to:

```text
preview
isolate
merge
```

Before merge, the engine or Brain should be able to inspect:

- schema compatibility;
- ID collisions;
- assertion conflicts;
- missing dependencies;
- signature/integrity status;
- policy violations;
- authority class;
- executable content;
- origin lineage.

## 15.6 Export Does Not Grant Authority

Exported content retains its provenance but loses no security constraints merely because another Space imports it.

The destination applies its own trust and policy.

---

# 16. Security Model

Persistent memory is a long-lived attack surface because content written in one context may influence a consequential action much later.

KIP 2.0 therefore treats memory security as a lifecycle problem.

## 16.1 Threat Classes

At minimum:

```text
malicious memory injection
origin laundering
manufactured corroboration
cross-space privacy leakage
prompt-level ACL bypass
unsafe Skill import
schema poisoning
policy escalation
replay / duplicate mutation
provenance tampering
selective deletion of counter-evidence
```

## 16.2 Non-Malleable Origin Principle

The authority of a memory MUST NOT be determined solely from mutable semantic content.

The engine should preserve an origin lineage that cannot be replaced by:

- summarization;
- a trusted tool echo;
- rewording;
- consolidation;
- repeated restatement.

## 16.3 Derived Memory Authority

A derived Insight or Skill should retain references to supporting source origins.

Authority elevation is a separate operation and MUST require an authorized policy or validation process.

Example:

```text
untrusted external observation
        ↓ summarization
local Insight
```

The Insight may be locally generated, but its epistemic/action authority cannot automatically become equivalent to a trusted local observation.

## 16.4 Counter-Evidence Preservation

An attacker or buggy maintenance process should not be able to strengthen a belief merely by deleting opposing evidence.

High-impact deletion or archival of Evidence SHOULD be auditable and policy constrained.

## 16.5 Executable Memory

Code, prompts, tool policies, and sub-agent Skills SHOULD carry stronger policy requirements than descriptive facts.

A secure default is:

```text
external executable memory
    → stored but inactive
    → reviewed / validated
    → explicitly activated
```

---

# 17. Self and Agent Identity

`$self` and `$system` remain valuable cognitive abstractions, but they SHOULD live in the Cognitive Memory Profile rather than KIP Core.

KIP Core understands:

```text
Principal
Space
identity references
```

The Cognitive Memory Profile defines:

```text
$self
$system
Person
SelfModel
```

A deployment maps `$self` to one or more authenticated Principals according to policy.

This prevents the protocol itself from assuming that all KIP deployments have a singular autobiographical self.

---

# 18. Division of Responsibility

The most important architectural boundary is what KIP should **not** decide.

## 18.1 KIP Core

KIP Core SHOULD define:

```text
Concept
Literal
Proposition
Assertion
Evidence
Provenance primitives
Identity references
MemorySpace
Policy hooks
Schema Packages
Query semantics
Mutation semantics
Transactions
Search primitive
Import / Export / Capsule
Capabilities
System metadata
Conformance
```

## 18.2 Cognitive Memory Profile

The standard Cognitive Memory Profile SHOULD define:

```text
Person
$self / $system
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Skill
SleepTask
memory_strength
salience
utility
profile-specific lifecycle
```

## 18.3 Anda Brain

Anda Brain SHOULD own cognitive algorithms and policy such as:

```text
formation thresholds
experience boundary detection
salience scoring
prediction-error estimation
semantic consolidation
contrastive procedural consolidation
Skill validation
self-model synthesis
memory-strength metabolism
retrieval reranking
Action Briefing synthesis
maintenance scheduling
```

## 18.4 Cognitive Nexus Implementation

The engine SHOULD own implementation details such as:

```text
physical graph storage
indexes
embedding model
query planning
transactions
policy enforcement
system origin metadata
canonicalization
cryptographic verification
change log
replication
```

This separation keeps KIP interoperable while allowing Anda Brain to evolve rapidly.

---

# 19. Canonical Cognitive Workflows

## 19.1 Observation → Belief

```text
Tool / User / World
      │
      ▼
    Evidence
      │
      ▼
  Proposition
      │
      ▼
   Assertion
      │
      ▼
Epistemic Projection
      │
      ▼
  Agent Belief Context
```

## 19.2 Correction

```text
Old Proposition P
   └ Assertion A (active)

New Evidence
   ↓
Assertion B
   ↓
if same proposition:
    confidence / stance may change

if new incompatible proposition:
    keep both propositions
    supersede or contest Assertion A as justified
```

No proposition needs to be deleted merely because belief changed.

## 19.3 Experience Learning

```text
Trace
  ↓
Evidence + Event + Experience
  ↓
Semantic consolidation → Assertion / Knowledge
  ↓
Procedural consolidation → Skill
  ↓
future Action Recall
  ↓
new outcome
  ↓
Skill validation / correction
```

## 19.4 Shared Memory

```text
Personal Space
     │ export capsule
     ▼
Policy / redaction / signature
     │
     ▼
Team Space
     │ import as attributed external cognition
     ▼
Local trust + authority evaluation
     │
     ├ accepted semantic assertions
     └ candidate Skills (inactive until validated)
```

## 19.5 Sleep / Maintenance

Maintenance operates over the same primitives but under a distinct authorized Principal.

It may:

- consolidate;
- merge duplicate entities;
- create derived assertions;
- refine Skills;
- archive low-value raw experience;
- reduce memory strength;
- detect contradictions;
- refresh profile summaries;
- schedule review tasks.

It SHOULD NOT silently rewrite engine origin or erase contradictory evidence.

---

# 20. Migration from KIP 1.x

KIP 2.0 is semantically breaking but can provide a practical compatibility path.

## 20.1 Default MemorySpace

Every KIP 1.x Nexus is migrated into one default Space.

For personal Brain deployments, this will usually be the `$self` personal Space.

## 20.2 Concept Migration

Existing Concept nodes preserve their Nexus-local identity where possible.

`type + name` remains a grounding key.

The migration adds:

```text
immutable core id
schema package reference
optional canonical_id
space membership
```

## 20.3 Proposition Migration

For every v1 Proposition:

```text
1. preserve/canonicalize the structural Proposition
2. create one migrated positive Assertion
3. move author/source/confidence/validity semantics to the Assertion
4. preserve old metadata as legacy provenance when exact transformation is impossible
```

## 20.4 Attribute Migration

Attributes are not automatically exploded into propositions.

Migration SHOULD classify attributes:

### Keep as attributes

- display hints;
- compact profile state;
- counters;
- arrays/objects with no independent epistemic lifecycle.

### Promote to Proposition + Assertion when needed

- factual values with source/confidence;
- values that historically change;
- values that can conflict;
- values requiring independent access control;
- values exchanged across Spaces.

This can happen gradually.

## 20.5 `confidence`

Existing proposition `metadata.confidence` becomes migrated Assertion confidence.

If older deployments used time decay on confidence as a memory-strength proxy, migration cannot reconstruct the lost epistemic confidence perfectly. Preserve history and initialize `memory_strength` conservatively.

## 20.6 `superseded`

Move assertion-lifecycle fields:

```text
superseded
superseded_at
superseded_by
```

from the old proposition metadata to migrated Assertions where semantically applicable.

## 20.7 `source` and `evidence`

Where resolvable, convert legacy strings into Evidence / Provenance references.

Where not resolvable, keep them as legacy annotations without pretending stronger provenance than exists.

## 20.8 `access_level`

Translate legacy privacy metadata into Space policy/classification semantics.

Do not rely on the old field alone for enforcement.

## 20.9 Compatibility Mode

A KIP 2.0 engine MAY provide a `kip-1-compat` profile:

- v1 proposition writes auto-create Assertions;
- v1 proposition reads use an accepted epistemic projection;
- v1 metadata fields are translated when unambiguous;
- unsupported semantics return explicit compatibility warnings.

---

# 21. Conformance Architecture

A protocol becomes real when independently implemented systems can prove compatibility.

KIP 2.0 SHOULD publish machine-readable fixtures and reference tests.

## 21.1 Conformance Levels

Recommended suites:

```text
KIP Core Data Model
KIP Query
KIP Mutation
KIP Transactions
KIP Schema Packages
KIP Search
KIP Governance
KIP Capsule
KIP Provenance
KIP Cognitive Memory Profile
KIP Security
```

An implementation can advertise supported levels via Capability Negotiation.

## 21.2 Required Artifacts

The KIP 2.0 project should eventually provide:

```text
formal grammar
canonical AST
request schemas
response schemas
canonical capsule schema
error registry
reference fixtures
round-trip tests
transaction tests
policy tests
migration fixtures
security/adversarial fixtures
```

## 21.3 Brain Evaluation Is Separate

Protocol conformance does not prove memory quality.

Anda Brain should maintain a separate benchmark for:

```text
semantic retention
temporal evolution
experience reconstruction
procedural transfer
error avoidance
context discrimination
negative transfer
memory poisoning resistance
privacy leakage
causal memory utility
```

The strongest evaluation remains:

```text
performance with relevant memory
    >
performance after relevant memory ablation
```

---

# 22. KIP 2.0 Design Invariants

The following invariants should survive later syntax debates.

1. **A Proposition is truth-neutral.**
2. **Belief is represented by Assertions.**
3. **Multiple contradictory Assertions may coexist.**
4. **Confidence belongs to an Assertion, not to recall frequency.**
5. **Source trust and Assertion confidence are distinct.**
6. **Engine origin is separate from claimed provenance.**
7. **Origin lineage cannot be self-upgraded by content.**
8. **Literal-valued facts can receive first-class epistemic treatment.**
9. **Values needing provenance/conflict/validity should not be trapped in attributes.**
10. **Domain and MemorySpace remain distinct.**
11. **Identity is not equal to a display name.**
12. **World time and knowledge time remain distinct.**
13. **Memory strength, salience, confidence, trust, and utility remain distinct.**
14. **KIP Core does not hard-code Event/Experience/Skill.**
15. **Experience and Skill belong to a Cognitive Memory Profile.**
16. **Hidden chain-of-thought is never a required memory artifact.**
17. **Failed experience is eligible for high-value retention.**
18. **Semantic similarity alone cannot authorize action.**
19. **Imported executable memory is inactive by default.**
20. **Policy enforcement occurs in the Nexus, not only in prompts.**
21. **Atomic transaction support exists for multi-step cognitive transitions.**
22. **Capsule signatures prove integrity/origin, not truth or safety.**
23. **Consolidation preserves enough provenance for revision.**
24. **Physical deletion is distinct from epistemic and mnemonic forgetting.**
25. **KIP supplies primitives; the Brain owns cognitive strategy.**
26. **Learning is ultimately evaluated by durable behavioral impact.**

---

# 23. Proposed KIP 2.0 Work Packages

This architecture should be implemented in stages.

## P0 — Semantic / Epistemic Foundation

- Proposition becomes truth-neutral.
- Assertion becomes first-class.
- Literal-valued proposition objects.
- Assertion stance / mode / lifecycle.
- Evidence model.
- engine-origin envelope.
- migration semantics from v1 propositions.

## P0 — Governance Foundation

- Principal execution context.
- MemorySpace.
- engine-enforced read/write policy.
- Domain/Space separation.
- authority classification.

## P0 — Runtime Integrity

- atomic batch transactions.
- transaction receipts.
- idempotency keys.
- capability negotiation.

## P0 — Schema Identity

- Schema Packages.
- namespace/version semantics.
- deterministic validation.
- compatibility metadata.

## P1 — Provenance Graph

- Evidence links.
- Activity/Agent/Entity-style lineage.
- origin inheritance through derivation.
- source diversity semantics.

## P1 — Temporal Semantics

- valid time.
- observation time.
- assertion time.
- engine transaction time.
- future temporal query model.

## P1 — Cognitive Capsule 2.0

- canonical machine representation.
- deterministic digest.
- optional signatures.
- preview/isolate/merge import.
- policy-aware export.

## P1 — Cognitive Memory Profile 2.0

- Event.
- Experience.
- ExperienceStep.
- Skill.
- Commitment.
- SelfModel.
- memory strength/salience/utility semantics.

## P2 — Change Stream / Replication

- engine mutation cursor.
- audit receipts.
- sync/backup hooks.

## P2 — Conformance & Benchmark

- core conformance suite.
- migration suite.
- security suite.
- Anda Brain behavioral benchmark.

---

# 24. Architecture Questions and Their Resolutions

These questions were raised while this architecture was being designed. The consolidated `KIP-2.0-SPECIFICATION.md` has since resolved them; the original discussion is preserved below with each outcome noted.

## Q1. Is Assertion a dedicated KIP element kind or a reserved Core Concept Type?

**Resolved**: Assertion is a dedicated Core element kind (Specification §6.1), alongside Concept, Proposition, Evidence, and Activity.

Dedicated syntax may be more ergonomic and enforceable; representing it as a reserved concept may preserve graph uniformity.

Architecture requirement: first-class semantics either way.

## Q2. Can a single Assertion reify multiple Propositions?

A single assertion bundle can represent a quoted statement or source document containing many claims, but one-Assertion-per-Proposition is simpler for confidence and contradiction.

Recommended initial default: one Assertion targets one Proposition; grouping is represented by a higher-level statement/evidence artifact.

**Resolved**: one Assertion targets exactly one Proposition (Specification §13.1).

## Q3. What exactly is the native negative-claim model?

Options:

```text
stance = reject over positive Proposition
```

or a proposition whose object is `false` for boolean predicates.

Recommended principle: prefer stance for epistemic rejection; use literal false only when false is genuinely the semantic object.

**Resolved**: as recommended — reject stance for epistemic rejection, literal `false` only as a genuine semantic object; Core preserves the structural distinction (Specification §12.7).

## Q4. Should accepted belief be persisted or computed?

Persisted acceptance is fast but can become stale under changing trust/policy.

Computed Epistemic Projection is cleaner.

Recommended default: assertions are canonical state; acceptance is a view unless a profile explicitly snapshots it.

**Resolved**: as recommended — Epistemic Projection is a computed read-only view; a read must not become durable self-belief (Specification §21.2).

## Q5. How much policy belongs in KIP Core?

Core must define enforcement semantics and operation context. It should avoid becoming a complete general-purpose authorization language.

**Resolved**: as recommended — the Specification defines permission families, evaluation order, and protocol invariants (§§28–31) without a general-purpose policy language.

A compact capability/policy profile may be preferable.

## Q6. How should canonical IDs work across Spaces?

The protocol should permit URI/DID/URN/custom identifiers without mandating one scheme.

## Q7. Should policy apply at element, assertion, proposition, or subgraph level?

All may be necessary. The initial model should optimize for Space defaults plus element-level exceptions before adding arbitrary policy graphs.

## Q8. What is the canonical Capsule format?

Likely JSON with strict canonicalization, while KIP DSL remains the model-facing mutation representation.

## Q9. How should large Evidence payloads be handled?

Likely external content-addressed references + digest + metadata, rather than storing every raw artifact directly in the graph.

## Q10. Which mnemonic fields are Core versus Profile?

`expires_at` and archival state may remain cross-cutting Core lifecycle fields. `memory_strength`, `salience`, and `utility` are better defined by the Cognitive Memory Profile.

---

# 25. Relationship to KIP 1.x Design Principles

KIP 2.0 intentionally preserves the strongest KIP 1.x decisions.

## Preserved

- Model-First syntax philosophy.
- Intent-driven declarative interaction.
- Graph-native structure.
- Self-describing schema.
- KQL / KML / META separation.
- Hybrid/semantic SEARCH as a protocol primitive.
- Embeddings hidden behind the engine.
- Atomic write statements.
- Idempotent operation design.
- `EXPECT VERSION` optimistic concurrency.
- `MERGE` for entity consolidation.
- Capsule portability.
- Standard error semantics.
- Cognitive Primer / schema introspection.

## Reinterpreted

```text
KIP 1.x:
Proposition = Fact

KIP 2.0:
Proposition = truth-neutral semantic statement
Assertion   = epistemic commitment
```

```text
KIP 1.x:
metadata carries source + trust + time + memory + privacy

KIP 2.0:
those responsibilities are separated across planes
```

```text
KIP 1.x:
Cognitive Nexus = unified knowledge graph memory

KIP 2.0:
Cognitive Nexus = governed external cognitive state
```

```text
KIP 1.x:
learning often means durable knowledge mutation

KIP 2.0:
mutation enables learning;
behavioral change is the strongest evidence of learning
```

---

# 26. Architecture Summary

The complete conceptual stack is:

```text
Human / Environment / Tools / Other Agents
                    │
                    ▼
             Observable Inputs
                    │
                    ▼
              ┌───────────┐
              │ Evidence  │
              └─────┬─────┘
                    │
                    ▼
      ┌────────────────────────────┐
      │ Semantic + Epistemic State │
      │ Concept                    │
      │ Proposition                │
      │ Assertion                  │
      │ Provenance                 │
      └─────────────┬──────────────┘
                    │
             Cognitive Profile
                    │
      ┌─────────────┼──────────────┐
      │             │              │
     Event       Experience      Knowledge
                    │              │
                    ▼              │
                  Skill ◄──────────┘
                    │
                    ▼
                Retrieval
                    │
                    ▼
             Future Computation
                    │
                    ▼
                  Action
                    │
                    └───────────────↺

Everything above executes inside:

    MemorySpace + Principal + Policy

Everything durable preserves:

    engine origin + time + provenance
```

KIP 2.0 therefore does not merely answer:

> **What does the agent know?**

It makes it possible to answer:

> What propositions exist?

> Who asserted them?

> What evidence supports or contradicts them?

> What did the agent believe at a particular time?

> What changed that belief?

> What experiences produced its current procedures?

> Which memories should influence this decision?

> Who is allowed to see or change those memories?

> Can this imported memory be trusted, and at what authority level?

> Can the agent explain why it acted differently this time?

That is the foundation required for an Agent to possess not merely a persistent database, but a **real external memory brain**.

---

# Appendix A — Illustrative Example: Conflicting Knowledge

Suppose three sources discuss whether Bob is vegetarian.

## Semantic state

```text
P1 = (Bob, is_vegetarian, true)
```

## Epistemic state

```text
Assertion A
  proposition: P1
  asserted_by: Alice
  stance: support
  mode: stated
  confidence: 0.90

Assertion B
  proposition: P1
  asserted_by: Carol
  stance: reject
  mode: stated
  confidence: 0.80

Assertion C
  proposition: P1
  asserted_by: Doctor
  stance: support
  mode: observed
  confidence: 0.95
  valid_from: 2024-01-01
  valid_until: 2024-12-31
```

The Cognitive Nexus does not need to rewrite P1 three times.

A consuming Brain asks for an Epistemic Projection given:

```text
current time
purpose
source trust
available evidence
```

and may conclude:

```text
historically supported for 2024
currently uncertain
```

without deleting any source's statement.

---

# Appendix B — Illustrative Example: Literal Fact Evolution

Instead of storing:

```json
{
  "type": "Person",
  "name": "Alice",
  "attributes": {
    "timezone": "+08:00"
  }
}
```

when timezone requires provenance and historical evolution, use:

```text
P1 = (Alice, timezone, "+08:00")
P2 = (Alice, timezone, "+01:00")
```

with Assertions:

```text
A1 supports P1
valid_until = 2026-09-01

A2 supports P2
valid_from = 2026-09-01
```

Now the Brain can answer both:

```text
What is Alice's timezone now?
What was Alice's timezone before September 2026?
Who told us?
How confident are we?
```

without treating the entire Person node as having one global provenance/confidence value.

---

# Appendix C — Illustrative Example: Experience to Skill with Authority

```text
Experience E1
  goal: deploy service
  origin: local trusted tool trace
  outcome: success

Experience E2
  goal: deploy service
  origin: local trusted tool trace
  outcome: failure

External Skill Sx
  source: imported capsule
  signature: valid
  authority: descriptive only

Local Skill S1
  derived_from: E1, E2
  status: candidate
  authority: advisory
```

After local validation:

```text
S1
  status: active
  utility: 0.87
  authority: behavioral
```

The imported Skill's valid signature never automatically grants it behavioral or executable authority.

---

# Appendix D — Non-Normative Design Influences

KIP remains an independent protocol, but several external standards and research directions validate parts of this architecture:

1. **RDF 1.2 Concepts / RDF 1.2 Schema** — triple terms distinguish an abstract proposition from whether that proposition is asserted; multiple reifiers can describe different statements, beliefs, sources, or circumstances around the same proposition.
   - https://www.w3.org/TR/rdf12-concepts/
   - https://www.w3.org/TR/rdf12-schema/

2. **W3C PROV-O** — the Entity / Activity / Agent pattern is a useful reference model for provenance chains.
   - https://www.w3.org/TR/prov-o/

3. **SHACL** — demonstrates the value of treating graph schemas as machine-validatable contracts rather than descriptive documentation only.
   - https://www.w3.org/TR/shacl12-core/

4. **Verifiable Credential Data Integrity** — demonstrates the separation between canonicalized data, integrity proofs, identity binding, and the semantic truth of the signed content.
   - https://www.w3.org/TR/vc-data-integrity/

5. **Collaborative Memory (2025)** — highlights multi-user/multi-agent persistent memory with asymmetric, evolving read/write policy and immutable provenance requirements.
   - https://arxiv.org/abs/2505.18279

6. **Persistent-memory poisoning research (2026)** — reinforces the requirement that authority be bound to non-malleable origin and not inferred solely from memory content or mutable lineage summaries.
   - https://arxiv.org/abs/2606.12703
   - https://arxiv.org/abs/2606.24322

These are architectural influences only. KIP 2.0 does not require compatibility with their concrete data models or syntaxes.

---

# Appendix E — KIP 2.0 Document Architecture

KIP 2.0 is now organized as a layered specification system rather than a linear list of future design documents.

The key boundary is:

```text
Protocol
    defines interoperable cognitive semantics and runtime behavior

Profile
    defines portable cognitive structures built on the protocol

Brain Architecture
    defines how an agent uses those structures to learn

Brain Policies
    define one implementation's Formation / Recall / Maintenance behavior
```

No Brain policy is required for KIP Core conformance.

## E.1 Normative Protocol Consolidation

```text
KIP-2.0-SPECIFICATION.md
```

A faithful LLM-facing condensation, `KIPSyntax.md`, is maintained alongside the Specification for prompt injection; on any conflict the Specification wins, and the card must be kept in sync on every protocol change.

This is the normative consolidation candidate. It defines protocol-level requirements for Core cognitive elements, Epistemic Projection, Governance, Schema Packages, Transactions, Cognitive Capsules, KQL, KML, META, Protocol Runtime, historical semantics, migration invariants, and conformance invariants.

If an informative design document conflicts with the Specification, the Specification wins.

## E.2 Informative Design Rationale

```text
KIP-2.0-Architecture.md
KIP-2.0-Core-Data-Model.md
KIP-2.0-Epistemic-Model.md
KIP-2.0-Governance.md
KIP-2.0-Schema-Packages.md
KIP-2.0-Transactions.md
KIP-2.0-Capsule.md
KIP-2.0-KQL.md
KIP-2.0-KML.md
KIP-2.0-META.md
KIP-2.0-Protocol-Runtime.md
```

These documents explain the design rationale and deeper semantics behind the consolidated Specification.

## E.3 Standard Cognitive Profile

```text
profiles/CognitiveMemoryProfile-2.0.md
```

The Cognitive Memory Profile defines a portable memory ontology on top of Core. Its standard structures include:

```text
Person
Event
Experience
ExperienceStep
Preference
Insight
Commitment
Skill
SleepTask
SelfModel
MnemonicState
SkillUtility
```

The Profile is separate from Core because KIP permits other cognitive taxonomies.

A machine-readable Package should be published independently, for example:

```text
kip://profiles/cognitive-memory@2.0.0
```

The Profile defines portable structures and invariants. It does not mandate formation frequency, ranking formulas, forgetting thresholds, Skill compilation algorithms, or reflection schedules. Those are Brain policy.

## E.4 Brain Architecture

```text
brain/ExperienceLearningArchitecture.md
```

This document defines how a KIP-based Brain can turn:

```text
Observation
→ Evidence
→ Assertion
→ Event / Experience
→ semantic / procedural consolidation
→ Knowledge / Skill
→ Recall
→ Future Action
→ new Outcome
```

into a learning loop. It is an agent cognitive architecture, not a KIP wire-protocol requirement.

## E.5 Brain Runtime Policies

```text
brain/BrainFormation.md
brain/BrainRecall.md
brain/BrainMaintenance.md
```

These documents define the reference Anda Brain behavior above the protocol:

```text
Business / Task Agent
        │
        ▼
   Anda Brain
Formation / Recall / Maintenance
        │
        ▼
      KIP 2.0
        │
        ▼
 Cognitive Nexus
```

They MUST respect KIP boundaries:

```text
authenticated Principal ≠ semantic Actor
Proposition existence ≠ accepted belief
Assertion confidence ≠ source trust
confidence ≠ memory_strength
SEARCH relevance ≠ epistemic support
recording a user's statement ≠ impersonating the user
semantic cognition ≠ Governance authority
Skill content ≠ executable permission
```

## E.6 Migration

```text
migration/KIP-2.0-Migration-from-1.x.md
```

The Specification defines normative migration invariants. The Migration Guide defines the operational path for real KIP 1.x deployments: inventory, classification, Schema migration, identity mapping, Proposition → Proposition + Assertion, metadata decomposition, Profile migration, Governance migration, preview, cutover, verification, and rollback strategy.

The guide must not invent stronger provenance or epistemic certainty than the legacy graph actually stored.

## E.7 Machine-Readable Protocol Artifacts

### Request / Response

```text
kip-request.schema.json
kip-response.schema.json
```

### Formal Grammars

```text
KIP-2.0-KQL.ebnf
KIP-2.0-KML.ebnf
KIP-2.0-META.ebnf
```

### Conformance

```text
KIP-2.0-Conformance-Tests.md
conformance-test-vector.schema.json
conformance-report.schema.json
```

### Canonical Conformance Fixtures

```text
test-core-domain-1.0.0.schema.json
test-secondary-1.0.0.schema.json
epistemic-test-deterministic.json
```

The machine-readable artifacts make the prose specification executable and independently testable.

## E.8 Recommended Repository Shape

```text
KIP/
├── KIP-2.0-SPECIFICATION.md
├── KIP-2.0-Architecture.md
├── design/
│   ├── KIP-2.0-Core-Data-Model.md
│   ├── KIP-2.0-Epistemic-Model.md
│   ├── KIP-2.0-Governance.md
│   ├── KIP-2.0-Schema-Packages.md
│   ├── KIP-2.0-Transactions.md
│   ├── KIP-2.0-Capsule.md
│   ├── KIP-2.0-KQL.md
│   ├── KIP-2.0-KML.md
│   ├── KIP-2.0-META.md
│   └── KIP-2.0-Protocol-Runtime.md
├── migration/
│   └── KIP-2.0-Migration-from-1.x.md
├── profiles/
│   ├── CognitiveMemoryProfile-2.0.md
│   └── cognitive-memory-2.0.0.schema.json
├── brain/
│   ├── ExperienceLearningArchitecture.md
│   ├── BrainFormation.md
│   ├── BrainRecall.md
│   └── BrainMaintenance.md
├── grammar/
│   ├── KIP-2.0-KQL.ebnf
│   ├── KIP-2.0-KML.ebnf
│   └── KIP-2.0-META.ebnf
├── schemas/
│   ├── kip-request.schema.json
│   └── kip-response.schema.json
└── conformance/
    ├── KIP-2.0-Conformance-Tests.md
    ├── schemas/
    ├── fixtures/
    ├── policies/
    └── vectors/
```

Physical repository paths may differ; the layering should not.

## E.9 Dependency Direction

```text
KIP Core / Runtime
        ↑
Cognitive Memory Profile
        ↑
Experience Learning Architecture
        ↑
Formation / Recall / Maintenance
```

Lower layers MUST NOT depend on policy from higher layers.

```text
KIP Core
    MUST NOT require Anda Brain.

Cognitive Memory Profile
    MUST NOT require one Formation algorithm.

Experience Learning Architecture
    MUST NOT redefine KIP Core semantics.

Brain policies
    MUST NOT bypass Governance or invent protocol authority.
```

## E.10 Current Completion State

The original Architecture was written before the concrete Core Data Model, Epistemic Model, Governance model, Schema Packages, Transactions, Capsule, KQL/KML/META, Protocol Runtime, consolidated Specification, Formal EBNF, and conformance artifacts existed. Those layers now exist.

Remaining work is primarily:

```text
1. stabilize the standard Cognitive Memory Profile;
2. stabilize the reference Brain architecture and policies;
3. publish the KIP 1.x operational migration guide;
4. publish machine-readable Profile Packages and canonical fixtures;
5. turn conformance design vectors into executable CI fixtures.
```

KIP 2.0 should now evolve by tightening these contracts rather than expanding Core indiscriminately.
