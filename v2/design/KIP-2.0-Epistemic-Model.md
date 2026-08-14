# KIP 2.0 Epistemic Model

**[English](./KIP-2.0-Epistemic-Model.md) | [中文](./KIP-2.0-Epistemic-Model_CN.md)**

## Status

**Epistemic Model Proposal / Pre-Specification Draft**

This document defines the epistemic semantics of KIP 2.0: how a Cognitive Nexus interprets multiple Assertions, Evidence, provenance chains, trust policies, temporal context, contradictions, and uncertainty in order to produce a **context-dependent belief view** for an Agent.

It builds directly on:

- [KIP-2.0-Architecture.md](KIP-2.0-Architecture.md)
- [KIP-2.0-Core-Data-Model.md](KIP-2.0-Core-Data-Model.md)

The Core Data Model defines **what is stored**:

```text
Concept
Proposition
Assertion
Evidence
Activity
MemorySpace
```

This document defines **how those stored objects participate in belief**.

Its central object is the **Epistemic Projection**:

```text
Epistemic Projection =
    a policy-bound, time-bound, purpose-bound interpretation
    of Assertions + Evidence + Provenance + Trust
    over one or more Propositions.
```

The primary design goal is:

> **Enable an Agent to preserve conflicting claims without prematurely collapsing them, evaluate why some claims deserve more influence than others, revise belief without rewriting history, and expose uncertainty in a form that can safely influence future reasoning and action.**

KIP Core does **not** prescribe one universal truth algorithm, Bayesian model, voting formula, trust score, or evidence weighting equation.

KIP 2.0 instead standardizes:

1. the meanings of epistemic signals;
2. the eligibility rules that distinguish historical, hypothetical, retracted, and current assertions;
3. provenance-aware evidence dependency;
4. source-independence and anti-double-counting principles;
5. conflict classification;
6. belief-revision semantics;
7. the input/output contract of Epistemic Projection;
8. explanation requirements;
9. security invariants preventing epistemic amplification through duplication, paraphrase, derivation, import, or self-declared confidence.

---

# 0. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, and **OPTIONAL** indicate intended requirements for the future KIP 2.0 specification.

Exact wire formats remain illustrative unless explicitly stated otherwise.

---

# 1. Executive Thesis

A memory brain cannot treat every stored statement as equally true.

Real cognitive state looks like this:

```text
Proposition P
    │
    ├── Assertion A1
    │      source: Alice
    │      stance: support
    │      mode: stated
    │      confidence: 0.95
    │      evidence: E1
    │
    ├── Assertion A2
    │      source: MonitoringTool
    │      stance: reject
    │      mode: observed
    │      confidence: 0.90
    │      evidence: E2
    │
    └── Assertion A3
           source: Brain
           stance: uncertain
           mode: inferred
           evidence: A1 + A2 lineage
```

The Cognitive Nexus should not ask:

> Which record wins?

It should ask:

```text
What is the question?
Who is asking?
For what purpose?
At what world time?
As of what cognitive time?
Which Assertions are eligible?
What Evidence actually underlies them?
Which Evidence is independent?
How trustworthy are the relevant origins in this context?
Which claims conflict semantically?
How much uncertainty remains?
```

Only then should the Brain receive a belief view.

Therefore:

```text
Stored Assertion
    ≠
Accepted Belief
```

and:

```text
Assertion.confidence
    ≠
Projection confidence
    ≠
source trust
```

---

# 2. Epistemic State

The **Epistemic State** of a MemorySpace is the portion of Cognitive State relevant to belief formation:

```text
Propositions
Assertions
Evidence
Activities / provenance
identity bindings
schema constraints
governance-visible trust policy
temporal state
```

A useful abstraction is:

```text
E_state =
    (
      P,          propositions
      A,          assertions
      E,          evidence
      V,          provenance DAG
      T,          trust context
      S,          schema semantics
      τ,          temporal context
      G           governance visibility
    )
```

An Epistemic Projection is a function over that state:

```text
Projection =
    F(E_state, principal, purpose, query_scope, policy)
```

The function `F` is policy/profile dependent.

KIP standardizes its contract and invariants, not one universal formula.

---

# 3. Foundational Epistemic Distinctions

KIP 2.0 recognizes the following distinct concepts.

## 3.1 Proposition

```text
What statement is under consideration?
```

Truth-neutral.

---

## 3.2 Assertion

```text
Who or what takes what epistemic stance toward that Proposition?
```

Historically attributable.

---

## 3.3 Evidence

```text
What observation, artifact, result, testimony, or derived item is cited?
```

Evidence can be weak, strong, misleading, duplicated, correlated, incomplete, stale, or wrong.

---

## 3.4 Provenance

```text
How was this Evidence or Assertion produced?
```

Provenance describes derivation.

It does not by itself establish trust.

---

## 3.5 Trust

```text
How much epistemic authority should this source/origin/process have
for this proposition, purpose, and context?
```

Trust is contextual.

---

## 3.6 Assertion Confidence

```text
How strongly does the Assertion itself express/support its stance?
```

This is local to the Assertion.

---

## 3.7 Projection Support

```text
After evaluating eligible Assertions, Evidence, trust,
independence, time, conflict, and provenance,
how strongly does the current projection support or oppose a Proposition?
```

This is evaluator-relative.

---

## 3.8 Belief Status

```text
accepted
rejected
contested
uncertain
insufficient
```

This is a projection result, not stored truth.

---

# 4. The Most Important Rule: Assertion Confidence Is Not Brain Belief

Suppose an untrusted imported source writes:

```text
Assertion:
    proposition = P
    stance = support
    confidence = 0.99
```

The destination Brain MUST NOT conclude:

```text
belief(P) = 0.99
```

because `0.99` may mean only:

> The remote assertor claims high certainty.

The actual projection must consider:

```text
identity assurance
origin integrity
source trust
evidence quality
evidence independence
temporal relevance
counter-evidence
semantic conflict
projection purpose
```

Conceptually:

```text
projection_support(P)
    =
    evaluate(
      assertion_confidence,
      trust,
      evidence,
      provenance,
      independence,
      time,
      conflict,
      policy
    )
```

No factor is universally dominant.

---

# 5. Confidence Semantics

## 5.1 Assertion Confidence

`Assertion.confidence` answers:

> **How strongly does this Assertion support its own stance under its stated conditions?**

It is not required to be a calibrated probability.

It may originate from:

```text
human self-reported certainty
model inference confidence
measurement confidence
source document confidence
imported remote confidence
Brain-derived confidence
```

A Projection MUST NOT assume values produced by different actors are calibrated on the same scale.

---

## 5.2 Missing Confidence

An Assertion MAY omit confidence.

Missing confidence means:

```text
no explicit assertion-level numeric confidence is available
```

It does not automatically mean:

```text
0.0
0.5
untrusted
```

The Projection Policy decides how missing confidence is treated.

---

## 5.3 Confidence Calibration

A Projection Policy MAY apply actor/mode/domain-specific calibration.

Conceptually:

```text
calibrated_signal =
    calibrate(
      raw_assertion_confidence,
      asserted_by,
      mode,
      domain,
      predicate,
      historical calibration
    )
```

Examples:

```text
a model that systematically says 0.9 too often
    → confidence may be down-calibrated

a measurement system with validated 99.9% precision
    → confidence may be interpreted more strongly
```

Calibration is policy-level cognition, not Core mutation.

---

## 5.4 Confidence Is Historically Immutable

If new Evidence changes the Brain's belief:

```text
do not rewrite old Assertion confidence
```

Prefer:

```text
new Assertion
+
supersession/derivation relation
+
new provenance
```

This preserves belief evolution.

---

# 6. Trust

## 6.1 Definition

Trust is a contextual evaluation:

> **How much epistemic influence should an actor, principal, evidence source, provenance process, or channel receive for this specific purpose and semantic context?**

Trust is not a universal personality score.

---

## 6.2 Trust Is Contextual

Examples:

```text
user self-report
    personal preference     → potentially authoritative
    medical diagnosis       → not automatically authoritative

deployment monitor
    server health           → potentially authoritative
    employee motivation     → irrelevant

signed external agent
    integrity/authorship    → verified
    truth                   → not thereby verified
```

---

## 6.3 Trust Inputs

A Trust Resolver MAY consider:

```text
semantic actor identity
identity assurance
authenticated origin principal
origin channel
Evidence class
Activity class
domain/predicate
purpose
historical reliability
declared competence
verification status
conflict of interest
provenance integrity
import status
local policy
```

No universal formula is defined.

---

## 6.4 Trust Vector

A sophisticated implementation MAY evaluate trust as a vector rather than one number:

```text
identity_assurance
domain_competence
historical_reliability
process_integrity
provenance_integrity
independence
```

The Projection Policy may later collapse these into an internal influence value.

KIP does not require the vector to be persisted.

---

## 6.5 Trust Result Contract

A Trust Resolver SHOULD be able to explain its result.

Illustrative:

```json
{
  "subject": "concept:monitoring-tool",
  "context": {
    "predicate": "deployment_status",
    "purpose": "production-diagnosis"
  },
  "trust": {
    "score": 0.92,
    "semantics": "normalized_influence",
    "reasons": [
      "authenticated tool principal",
      "high historical agreement with post-incident validation",
      "directly relevant domain"
    ]
  }
}
```

The numeric score is optional.

The reasons are more important than false precision.

---

# 7. Trust Is Not Action Authority

Epistemic trust answers:

> Should this information influence belief?

Action authority answers:

> May this memory directly influence or execute behavior?

These are separate.

An external security researcher may be highly trustworthy about a vulnerability while having:

```text
zero authority to execute shell commands
```

Governance defines action authority.

Epistemic Projection must not elevate it.

---

# 8. Identity Assurance

Trust in a claimed actor depends partly on whether the identity attribution is credible.

Distinguish:

```text
asserted_by = Alice
```

from:

```text
engine knows the authenticated writer was Alice
```

The Core Data Model intentionally separates:

```text
Assertion.asserted_by
_system.origin.principal_id
```

A Projection SHOULD consider the relationship between them.

Possible states:

```text
verified actor binding
strongly inferred actor binding
unverified attribution
conflicting attribution
anonymous
```

Unverified identity SHOULD NOT receive the same trust merely because `asserted_by` contains a prestigious name.

---

# 9. Evidence Semantics

Evidence is not a binary switch.

A piece of Evidence can vary in:

```text
relevance
directness
integrity
specificity
freshness
coverage
independence
verifiability
provenance completeness
```

The Epistemic Model standardizes these as evaluation dimensions, not universal numeric weights.

---

# 10. Evidence Roles

An Assertion may cite Evidence with roles:

```text
support
challenge
context
```

Interpretation is relative to the Assertion's stance.

Example:

```text
Assertion stance = reject
Evidence role = support
```

means:

> Evidence supports the rejection.

`context` provides interpretation but does not itself count as support unless policy promotes it.

---

# 11. Direct and Derived Evidence

## 11.1 Direct Evidence

Evidence is relatively direct when it records the target phenomenon without depending primarily on another epistemic claim.

Examples:

```text
sensor measurement
tool result
user's own statement of preference
signed primary document
direct observation
```

Direct does not mean correct.

---

## 11.2 Derived Evidence

Evidence is derived when produced through:

```text
summarization
inference
aggregation
classification
cross-event consolidation
model extraction
transformation
```

Derived Evidence inherits epistemic dependence on its inputs.

---

# 12. No Evidence Multiplication Principle

This is a core KIP 2.0 epistemic invariant:

> **Transforming, copying, summarizing, paraphrasing, indexing, or reasserting the same underlying evidence does not create independent corroboration.**

Example:

```text
Original Article A
      │
      ├── Summary B
      ├── Agent C reads A and writes note C
      ├── Agent D reads B and writes note D
      └── Search index snippet E
```

The Brain MUST NOT count this as five independent sources if all paths trace back to A.

Conceptually:

```text
epistemic roots(B) = {A}
epistemic roots(C) = {A}
epistemic roots(D) = {A}
epistemic roots(E) = {A}
```

---

# 13. Conservation of Epistemic Independence

A derived Assertion may be cognitively useful.

It may:

```text
compress
generalize
connect
explain
make retrieval easier
```

But derivation alone cannot create additional independent epistemic mass.

If:

```text
A3 = inference(A1, A2)
```

then a projection MUST NOT count:

```text
A1 + A2 + A3
```

as three independent confirmations of the same conclusion.

A3's support roots remain dependent on A1/A2 lineage.

---

# 14. Provenance Roots

For epistemic evaluation, define a conceptual function:

```text
roots(x)
```

that recursively traverses provenance backward until reaching terminal or policy-defined root Evidence/origins.

Examples:

```text
roots(raw tool observation)
    = {tool observation}

roots(summary of tool observation)
    = {tool observation}

roots(inference from E1 and E2)
    = roots(E1) ∪ roots(E2)
```

The precise root boundary is policy dependent.

---

# 15. Root Types

Useful root categories may include:

```text
direct observation event
primary source artifact
human testimony event
external authoritative record
verified tool execution
imported provenance root
unknown/unresolved root
```

A digest alone is not necessarily a root identity.

Two observations of the same bytes at different times may be separate roots for temporal consistency while sharing one source artifact.

---

# 16. Source Identity vs. Observation Independence

Two Evidence items can be:

```text
different observations
same source
```

or:

```text
different sources
same upstream origin
```

These are not equivalent.

Example:

```text
Alice says "I prefer dark mode" in January
Alice says it again in June
```

This is not independent-source corroboration.

But it may provide meaningful:

```text
temporal stability evidence
repetition evidence
preference persistence
```

Therefore KIP distinguishes:

```text
source independence
observation repetition
temporal consistency
```

A Projection/Profile may use all three differently.

---

# 17. Corroboration Groups

A Projection engine SHOULD be able to group Evidence/Assertions into **Corroboration Groups**.

A Corroboration Group represents items that should not be treated as fully independent support.

Possible grouping inputs:

```text
shared provenance root
same document digest
same semantic source
same authenticated principal
same upstream Assertion
same import capsule
same tool execution
same observation event
known syndication relationship
known derivation chain
```

These groups may be computed transiently.

They need not be Core persistent elements.

---

# 18. Independent Corroboration

Independent corroboration is stronger than duplicated confirmation.

Conceptually:

```text
E1 root = independent measurement A
E2 root = independent measurement B
E3 root = independent witness C
```

provides more epistemic diversity than:

```text
E1 root = document A
E2 root = document A
E3 root = document A
```

However:

> **Source diversity is a signal, not proof of truth.**

Multiple sources may:

```text
copy each other
collude
share the same faulty sensor
share the same mistaken assumption
be controlled by one attacker
```

Therefore a simple source-count majority is not a KIP epistemic rule.

---

# 19. Manufactured Corroboration

A robust Brain MUST resist:

```text
one source
→ many paraphrases
→ many agents repeat it
→ apparent consensus
```

Projection SHOULD detect:

```text
shared content digest
shared provenance roots
shared import lineage
known quoting/syndication
same upstream Assertion
same observation Activity
```

and collapse or discount duplicated epistemic influence.

---

# 20. Sybil Corroboration

Multiple principals do not automatically equal multiple independent sources.

A Governance/Trust layer MAY know that:

```text
principal A
principal B
principal C
```

belong to one organization, operator, model fleet, or trust domain.

Projection MAY group them for independence purposes.

KIP does not mandate a universal identity clustering system.

---

# 21. Circular Evidence

Epistemic support must not increase through cycles.

Example:

```text
A1 supports P because of A2
A2 supports P because of A3
A3 supports P because of A1
```

This produces no independent foundation.

A Projection MUST detect provenance/dependency cycles.

Recommended handling:

```text
collapse strongly connected cycle
treat cycle as one dependent component
find external incoming roots
if no external root:
    assign no independent evidential amplification
```

A provenance implementation SHOULD normally remain a DAG, but imported/legacy state may violate that assumption.

---

# 22. Evidence Dependency Graph

For one Projection, construct an epistemic dependency graph:

```text
Assertion
    │
    ▼
cited Evidence
    │
    ▼
generating Activities
    │
    ▼
input Assertions / Evidence
    │
    ▼
root Evidence / origin
```

This graph exists to answer:

```text
What actually supports this belief?
Which support is duplicated?
Which support depends on the conclusion itself?
Which support is imported?
Which support comes from independent observations?
```

---

# 23. Evidence Quality Dimensions

A Projection MAY assess:

## 23.1 Relevance

Does the Evidence actually bear on this Proposition?

---

## 23.2 Directness

How many epistemic transformation steps separate it from the target phenomenon?

---

## 23.3 Integrity

Can content/origin integrity be verified?

---

## 23.4 Specificity

Does the Evidence support this exact claim or merely a broad related claim?

---

## 23.5 Temporal Relevance

Does the Evidence apply to the requested world time?

---

## 23.6 Coverage

Could the observation process reasonably have detected the phenomenon if present?

---

## 23.7 Independence

Does it add genuinely new epistemic roots?

---

## 23.8 Provenance Completeness

Can the derivation path be inspected sufficiently?

---

# 24. Absence of Evidence Is Not Evidence of Absence

KIP 2.0 follows an open-world default.

If no eligible Assertion supports:

```text
P
```

the result is normally:

```text
insufficient
```

not:

```text
rejected
```

Similarly:

```text
not found
≠ false
```

This is essential for memory systems whose stored knowledge is incomplete.

---

# 25. Evidence of Absence

Absence can become Evidence only when an observation process had meaningful detection coverage.

Example:

```text
"Monitor did not report an outage"
```

is evidence against outage only if the monitor:

```text
was active
covered the relevant service
would likely have detected the outage
had fresh observations
```

Therefore a Projection SHOULD require coverage context before treating non-observation as negative evidence.

---

# 26. Closed-World Exceptions

Some bounded contexts may legitimately use closed-world assumptions.

Examples:

```text
members in an authoritative complete roster
files returned by a complete directory snapshot
enabled flags in a complete configuration snapshot
```

A Projection Policy MAY declare:

```text
closed_world_scope
```

for a specific predicate/source/snapshot.

Closed-world semantics MUST be explicit.

They are never the default for general KIP memory.

---

# 27. Assertion Eligibility

Before aggregation, a Projection determines which Assertions are eligible.

An Assertion is generally considered against:

```text
governance visibility
lifecycle status
world valid time
as-of cognitive time
mode
context compatibility
identity resolution
projection purpose
schema validity
provenance availability
```

Eligibility is not the same as trust.

---

# 28. Lifecycle Eligibility

For a current projection:

```text
active       → normally eligible
retracted    → not active support; retained for explanation/history
superseded   → not active support for the superseded context; historical
expired      → normally not current support
```

Historical projections may include earlier lifecycle state.

---

# 29. Retraction

Retraction means:

> The earlier Assertion was explicitly withdrawn.

Retraction affects current eligibility.

It does not erase:

```text
the Proposition
the original Assertion
the Evidence
the fact that the actor once believed/stated it
```

A Projection explanation SHOULD distinguish:

```text
"was retracted"
```

from:

```text
"was contradicted by someone else"
```

---

# 30. Supersession

Supersession means:

> A newer Assertion replaces an older Assertion for a defined actor/context/temporal interpretation.

Typical use:

```text
same actor revises belief
same system updates a time-sensitive state
later inference supersedes earlier inference
```

Supersession SHOULD NOT be automatically inferred merely because two Assertions disagree.

---

# 31. Contradiction Is Not Supersession

Example:

```text
Alice supports P
Carol rejects P
```

This is contradiction.

Neither Assertion supersedes the other.

The Projection may mark P contested.

---

# 32. Temporal Evolution Is Not Necessarily Contradiction

Example:

```text
P1 = (Alice, timezone, "+08:00")
valid until 2026-09-01

P2 = (Alice, timezone, "+01:00")
valid from 2026-09-01
```

These statements can both be accepted.

Their validity intervals do not materially overlap.

A conflict engine MUST consider time before labeling them contradictory.

---

# 33. Contextual Difference Is Not Necessarily Contradiction

Example:

```text
Alice prefers dark mode for coding.
Alice prefers light mode for outdoor reading.
```

If the context differs, both may be true.

Conflict detection must consider:

```text
context_refs
predicate semantics
domain qualifiers
valid time
```

not only lexical opposition.

---

# 34. Conflict Types

KIP 2.0 recognizes several conceptually distinct conflict classes.

## 34.1 Direct Stance Conflict

Same Proposition:

```text
support vs reject
```

---

## 34.2 Functional-Value Conflict

Same subject + functional predicate + overlapping context/time:

```text
(Alice, timezone, "+08:00")
(Alice, timezone, "+01:00")
```

if schema says only one value can apply.

---

## 34.3 Exclusive-Value Conflict

Predicate schema declares mutually exclusive alternatives.

---

## 34.4 Cardinality Conflict

Too many simultaneously accepted values for a bounded cardinality.

---

## 34.5 Type/Schema Conflict

Assertions imply incompatible schema classifications.

---

## 34.6 Temporal Conflict

Claims assert incompatible state over overlapping valid intervals.

---

## 34.7 Causal/Logical Conflict

Domain/schema logic identifies incompatible propositions.

KIP Core does not perform arbitrary theorem proving.

Only declared or profile-supported rules should generate such conflicts.

---

# 35. Conflict Sets

A Projection SHOULD reason over a **Conflict Set**, not always one Proposition in isolation.

Example:

```text
Conflict Set:
    P1 = Project status "active"
    P2 = Project status "archived"
    P3 = Project status "deleted"
```

if status is single-valued.

The Projection evaluates:

```text
support for each alternative
opposition to each alternative
temporal/context compatibility
```

then determines the state.

Conflict Sets may be transient.

---

# 36. Schema Role in Conflict Detection

Schema Packages SHOULD eventually be able to declare constraints such as:

```text
functional predicate
max cardinality
exclusive values
disjoint types
inverse predicates
symmetric predicates
value domains
temporal applicability
```

The Epistemic Model consumes these constraints.

It does not redefine the schema language.

---

# 37. Boolean Opposition

For a boolean-valued property:

```text
P_true  = (Bob, is_vegetarian, true)
P_false = (Bob, is_vegetarian, false)
```

a schema may declare them mutually exclusive for overlapping valid time.

Additionally:

```text
reject(P_true)
```

is epistemic rejection of the positive proposition.

It is not automatically identical to:

```text
support(P_false)
```

unless the predicate is explicitly complete/boolean under the projection context.

This preserves open-world semantics.

---

# 38. Hypothetical Assertions

`mode = hypothetical` means:

> The claim is intentionally represented for scenario reasoning without ordinary world commitment.

A standard current-world Projection SHOULD exclude hypothetical Assertions from accepted factual belief.

A scenario Projection MAY include them.

---

# 39. Predicted Assertions

`mode = predicted` represents future-oriented belief.

A current factual Projection should not treat a prediction as observation.

A forecast Projection may evaluate it.

Once the predicted time passes, a Brain may compare prediction with later Evidence and create calibration/learning artifacts.

The original prediction remains unchanged.

---

# 40. Imported Assertions

`mode = imported` or imported provenance means the destination preserves a remote epistemic artifact.

Import does not imply local endorsement.

Projection considers:

```text
signature/integrity
remote actor identity
remote provenance
local trust policy
evidence availability
purpose
```

A signed Assertion can still be:

```text
false
unsafe
irrelevant
outdated
untrusted
```

---

# 41. Stated Assertions

`mode = stated` records testimony/claim.

For self-referential subjects, testimony may be highly authoritative.

Example:

```text
Alice says:
"I prefer dark mode."
```

For external factual domains, the same actor may have limited authority.

Mode and semantic subject matter both matter.

---

# 42. Observed Assertions

`mode = observed` means an Assertion is based directly on an observation process.

It does not mean:

```text
automatically true
automatically high trust
```

Projection may still examine:

```text
instrument reliability
tool origin
coverage
measurement error
tampering
observation time
```

---

# 43. Inferred Assertions

`mode = inferred` MUST preserve dependency lineage.

A derived Assertion SHOULD identify:

```text
Activity
input Assertions/Evidence
method/policy identifier when important
```

Projection must not count the inference as independent corroboration of its own premises.

---

# 44. Semantic Actor Assertion vs. Brain Endorsement

KIP 2.0 allows the Brain to remember:

> Alice believes P.

without itself believing P.

This is represented as:

```text
Assertion A1
    proposition = P
    asserted_by = Alice
    stance = support
```

The Brain's current acceptance of P is a Projection result.

If the Brain chooses to persist its own durable belief, it creates a separate derived Assertion:

```text
Assertion A2
    proposition = P
    asserted_by = $self
    mode = inferred
```

with provenance back to A1/Evidence.

These two layers MUST NOT be conflated.

---

# 45. Durable Self-Belief

A Brain MAY persist selected Epistemic Projection outcomes as `$self` Assertions when durable belief continuity is valuable.

Recommended use cases:

```text
stable semantic knowledge
important self-model belief
long-lived decision premise
high-impact organizational knowledge
```

Do not snapshot every projection.

That would cause:

```text
graph explosion
self-confirmation loops
double counting
stale derived beliefs
```

---

# 46. Projection Snapshot Must Not Self-Corroborate

If:

```text
A_self = projection(A1, A2, E1, E2)
```

future projections MUST preserve:

```text
roots(A_self) = roots(A1, A2, E1, E2)
```

A_self cannot be counted as a new independent source.

Otherwise:

```text
source evidence
→ projection snapshot
→ later projection sees both
→ belief strengthens itself
```

which is an epistemic feedback bug.

---

# 47. Epistemic Projection

## 47.1 Definition

An **Epistemic Projection** is a read-only, context-dependent interpretation of raw epistemic state.

It answers:

> Given this principal, purpose, time, policy, and visible cognitive state, what should be treated as accepted, rejected, contested, uncertain, or insufficient?

---

# 48. Projection Is a View

Projection results are not canonical Core storage.

They may be:

```text
computed on demand
cached
materialized temporarily
persisted explicitly as derived Assertions
```

but canonical state remains the underlying Assertions/Evidence/Provenance.

---

# 49. Projection Request

Illustrative request contract:

```json
{
  "space_id": "space-1",
  "principal_id": "principal-agent",

  "scope": {
    "proposition_ids": ["prop-1"],
    "subject_ids": [],
    "predicate_refs": []
  },

  "purpose": "answer_user | action_planning | audit | research | diagnosis",

  "valid_at": "2026-08-13T13:00:00Z",
  "as_of_transaction": "tx-or-time",

  "context_refs": [],

  "policy_ref": "epistemic-policy-id",

  "risk": "low | medium | high",

  "options": {
    "include_historical": false,
    "include_hypothetical": false,
    "include_explanations": true,
    "include_evidence_ledger": true
  }
}
```

Exact field names are deferred.

---

# 50. Projection Inputs

At minimum, a projection conceptually depends on:

```text
authenticated principal
MemorySpace
visible Propositions
eligible Assertions
visible Evidence
provenance graph
schema semantics
trust policy
world valid time
cognitive as-of time
purpose
risk/context
```

A Projection MUST NOT access hidden data that Governance would deny to the consuming principal.

---

# 51. Purpose Matters

The same raw state may produce different projections.

Example:

```text
Purpose: casual conversation
    user self-report may be sufficient

Purpose: medical decision
    stronger evidence requirements

Purpose: production deployment
    fresh verified tool observation prioritized

Purpose: historical audit
    do not collapse superseded Assertions
```

This is not inconsistency.

It is contextual epistemology.

---

# 52. Risk-Sensitive Projection

A high-consequence action may require:

```text
higher trust
better provenance
more independent corroboration
fresher Evidence
lower unresolved conflict
explicit human review
```

KIP does not define universal thresholds.

The Projection Policy does.

---

# 53. Projection Policy

A Projection Policy is an identifiable set of epistemic rules.

Conceptually:

```text
policy_id
version
purpose/risk applicability
trust resolver
mode eligibility
temporal rules
source-independence rules
conflict rules
aggregation method
decision thresholds
explanation requirements
```

Storage/governance representation is deferred to KIP-2.0-Governance.md.

---

# 54. Policy Version Is Required for Audit

A Projection explanation SHOULD identify:

```text
policy_id
policy_version
projection_method
as_of time/transaction
valid_at
```

Otherwise a future observer cannot explain why the same raw memory produced a different belief after policy evolution.

---

# 55. Projection Pipeline

A robust projection conceptually follows these stages:

```text
1. Governance visibility
2. Semantic grounding
3. Conflict-set expansion
4. Lifecycle eligibility
5. Temporal eligibility
6. Mode/context eligibility
7. Provenance expansion
8. Root/corroboration grouping
9. Trust evaluation
10. Evidence-quality evaluation
11. Support/opposition aggregation
12. Uncertainty analysis
13. Belief-state classification
14. Explanation generation
```

Implementations may optimize execution.

They must preserve semantics.

---

# 56. Stage 1 — Governance Visibility

Filter first.

Unauthorized elements must not participate in:

```text
projection
counts
search
conflict hints
explanations
```

unless policy explicitly allows a redacted existence signal.

---

# 57. Stage 2 — Semantic Grounding

Resolve:

```text
target Proposition
alternative Propositions
relevant schema/predicate
canonical merged Concepts
```

Raw audit mode must preserve historical IDs.

---

# 58. Stage 3 — Conflict-Set Expansion

Use schema/predicate semantics to identify competing propositions.

Example:

```text
status = active
status = archived
```

when status is functional.

---

# 59. Stage 4 — Lifecycle Eligibility

Separate:

```text
current active claims
retracted history
superseded history
expired applicability
```

Historical/audit projections can explicitly include them.

---

# 60. Stage 5 — Temporal Eligibility

Evaluate:

```text
valid_from / valid_until
observed_at
asserted_at
as-of transaction time
freshness requirements
```

Do not use one generic recency rule for all predicates.

---

# 61. Stage 6 — Mode and Context Eligibility

Examples:

```text
hypothetical
    exclude from ordinary factual projection

predicted
    include in forecast projection, not observation projection

stated
    allowed subject to trust

observed
    allowed subject to observation quality

inferred
    allowed but provenance-dependent
```

Context compatibility must be checked.

---

# 62. Stage 7 — Provenance Expansion

Traverse backward through:

```text
Evidence
Activity
input Assertions
input Evidence
import receipts
```

until policy-defined roots are reached.

Detect:

```text
cycles
missing provenance
unavailable redacted roots
unknown origin
```

---

# 63. Stage 8 — Root and Corroboration Grouping

Compute:

```text
provenance roots
source groups
observation groups
correlated groups
```

to prevent double counting.

---

# 64. Stage 9 — Trust Evaluation

For each relevant epistemic component, evaluate context-specific trust.

Trust can apply to:

```text
asserted actor
origin principal
Evidence source
tool
Activity process
import signer
identity binding
```

---

# 65. Stage 10 — Evidence Quality Evaluation

Assess at least where available:

```text
relevance
directness
integrity
specificity
temporal relevance
coverage
independence
provenance completeness
```

---

# 66. Stage 11 — Support and Opposition Aggregation

A Projection collects two broad directions:

```text
support for P
opposition to P
```

Opposition may arise from:

```text
reject Assertions over P
support for semantically exclusive alternatives
counter-Evidence
schema conflict
```

The aggregation formula is policy-defined.

---

# 67. Stage 12 — Uncertainty Analysis

Uncertainty is not simply:

```text
1 - confidence
```

Possible uncertainty causes:

```text
little Evidence
low-trust Evidence
balanced conflict
missing provenance
identity ambiguity
stale observation
context mismatch
temporal ambiguity
schema ambiguity
incomplete coverage
unresolved import trust
```

Projection SHOULD expose these reasons.

---

# 68. Stage 13 — Belief-State Classification

Recommended Core projection states:

```text
accepted
rejected
contested
uncertain
insufficient
```

---

# 69. `accepted`

Meaning:

> Under this Projection Policy and context, support is sufficient and unresolved opposition is below the policy's acceptance boundary.

This is not universal truth.

---

# 70. `rejected`

Meaning:

> Under this Projection Policy and context, opposition/rejection is sufficient to reject the Proposition.

This is different from merely lacking support.

---

# 71. `contested`

Meaning:

> Material support and material opposition coexist, and the conflict is not resolved by time/context/supersession.

A contested belief may still have a leading side.

The projection should surface both.

---

# 72. `uncertain`

Meaning:

> Meaningful epistemic material exists, but support quality/strength is insufficient for acceptance or rejection.

Typical causes:

```text
weak evidence
low trust
ambiguous inference
stale observation
identity uncertainty
```

---

# 73. `insufficient`

Meaning:

> No sufficiently relevant/eligible epistemic basis is available to take a stance.

This state embodies the open-world rule:

```text
unknown ≠ false
```

---

# 74. Optional `not_applicable`

A future profile MAY expose:

```text
not_applicable
```

for a Proposition whose valid/context domain does not apply.

Baseline KIP can usually represent this through explanation rather than a required sixth status.

---

# 75. Projection Output

Illustrative:

```json
{
  "proposition_id": "prop-1",

  "status": "contested",

  "support": {
    "score": 0.78,
    "score_semantics": "normalized_support_not_probability",
    "assertion_ids": ["A1", "A3"],
    "root_groups": ["G1", "G2"]
  },

  "opposition": {
    "score": 0.71,
    "score_semantics": "normalized_support_not_probability",
    "assertion_ids": ["A2"],
    "root_groups": ["G3"]
  },

  "uncertainty": {
    "level": "medium",
    "reasons": [
      "credible independent evidence exists on both sides",
      "latest direct observation is 4 hours old"
    ]
  },

  "temporal": {
    "valid_at": "2026-08-13T13:00:00Z",
    "as_of_transaction": "tx-991"
  },

  "policy": {
    "id": "production-status",
    "version": "3"
  },

  "explanation": {
    "leading_factors": [],
    "warnings": []
  }
}
```

Scores are OPTIONAL.

---

# 76. Score Semantics Must Be Declared

If a Projection emits numeric scores, it MUST declare what they mean.

Possible semantics:

```text
ordinal_strength
normalized_support
calibrated_probability
log_odds
implementation_specific
```

An implementation MUST NOT present a generic normalized score as a calibrated probability.

---

# 77. Support and Opposition Scores Are Not Required to Sum to 1

In an open-world system:

```text
support = 0.2
opposition = 0.1
```

can mean:

```text
mostly unknown
```

Likewise:

```text
support = 0.9
opposition = 0.85
```

can mean:

```text
strongly contested
```

Therefore:

```text
support + opposition = 1
```

is not a KIP invariant.

---

# 78. Uncertainty Is a First-Class Output

A Projection SHOULD explicitly expose uncertainty rather than forcing one winning score.

Useful fields:

```text
uncertainty level/score
uncertainty reasons
missing evidence
provenance gaps
identity ambiguity
temporal ambiguity
conflict summary
```

This is critical for safe Action Recall.

---

# 79. Explanation Ledger

A Projection with explanation enabled SHOULD return an **Epistemic Ledger**.

Conceptually:

```text
Accepted/contested status
    │
    ├── contributing Assertions
    │
    ├── opposing Assertions
    │
    ├── Evidence roots
    │
    ├── Corroboration Groups
    │
    ├── trust decisions
    │
    ├── lifecycle exclusions
    │
    ├── temporal exclusions
    │
    └── warnings / missing information
```

The goal is not to expose hidden model reasoning.

The goal is to expose externally auditable epistemic structure.

---

# 80. Explanation Is Not Chain-of-Thought

A valid explanation may say:

```text
Accepted because:
- two independent verified tool observations support the claim;
- one opposing user statement has lower domain trust;
- all evidence applies to the requested time.
```

It must not require private token-level reasoning.

---

# 81. Temporal Relevance vs. Confidence Decay

A stale observation may become less useful for a "now" query without becoming less historically credible.

Example:

```text
Yesterday:
    Service status = healthy
    observed with high confidence

Today:
    no new observation
```

Do not mutate:

```text
Assertion.confidence 0.99 → 0.50
```

Instead current projection may apply:

```text
temporal_relevance = low
```

and return:

```text
uncertain / insufficient for current status
```

The old Assertion remains a strong historical claim.

---

# 82. Freshness Policy

Different predicates require different freshness.

Examples:

```text
date_of_birth
    freshness requirement ≈ none

current server health
    freshness requirement = minutes

personal preference
    freshness depends on context/stability

job title
    freshness may be months
```

Freshness belongs to Projection Policy/schema/profile.

There is no universal time decay.

---

# 83. Observation Time vs. Valid Time

A source may observe at:

```text
observed_at = 10:00
```

a state valid during:

```text
valid_from = 09:00
valid_until = 11:00
```

Projection should use valid time for world applicability and observation time for evidence freshness/availability.

They are not interchangeable.

---

# 84. Assertion Time vs. Evidence Time

A person can make a claim today about an event yesterday.

```text
Evidence observed_at = yesterday
Assertion asserted_at = today
```

Both must survive.

---

# 85. Historical Epistemic Projection

A historical query asks:

> What did the Agent believe as of cognitive time T?

This requires reconstructing:

```text
Assertions existing as of T
their lifecycle state as of T
Evidence available as of T
Trust/Projection Policy version applicable at T or explicitly selected
```

Because Assertion lifecycle can transition later, a conforming implementation that advertises historical projection MUST retain sufficient transaction/change history to reconstruct earlier lifecycle state.

This is a dependency on KIP-2.0-Transactions.md.

---

# 86. World-Historical Projection

Different question:

> What does the Agent now believe was true at world time T?

This uses:

```text
all currently available Evidence
but filters Assertion valid time around T
```

Later-discovered Evidence may change the answer.

Therefore:

```text
belief-as-of-then
≠
current-belief-about-then
```

KIP 2.0 must support both conceptually.

---

# 87. Belief Revision

Belief revision occurs when new epistemic material changes a Projection.

The raw history remains append-preserving.

Conceptually:

```text
State_t
  Assertions A1, A2
  Projection → accepted P

New Evidence E3
New Assertion A3

State_t+1
  Projection → contested P
```

No need to delete P or mutate A1/A2.

---

# 88. Revision by Same Actor

If an actor explicitly changes position:

```text
Alice:
  January supports P
  March rejects P
```

the March Assertion may supersede the January Assertion for Alice's current stance.

Both remain historically visible.

---

# 89. Revision by Brain

If the Brain's own durable belief changes:

```text
$self Assertion B1
    mode = inferred
    support P

later:
$self Assertion B2
    mode = inferred
    uncertain/reject P
    supersedes B1
```

Both preserve why the Brain changed.

The producing Activity should reference new Evidence/Assertions.

---

# 90. Correction

Correction is a special revision where a source/process recognizes that earlier content was wrong.

Recommended history:

```text
Evidence E1
Assertion A1

later:
Evidence E2 corrects E1
Assertion A2 supersedes A1
Activity Correction uses E1/A1/E2 → A2
```

Projection should surface:

> Earlier claim was corrected.

---

# 91. Retraction Without Replacement

A source may retract without providing a new position.

Then:

```text
A1 = retracted
```

Current projection loses that support.

It does not automatically gain opposition.

---

# 92. Conflict Without Resolution

A Brain should be allowed to persist:

```text
contested
```

for long periods.

Forced premature resolution can destroy useful uncertainty.

A mature memory brain must remember:

> We do not know yet.

---

# 93. Evidence Weight Is Not Frequency Count

Bad rule:

```text
confidence += 0.05 for every repeated mention
```

Better distinction:

```text
same-source repetition
    → stability / mnemonic reinforcement signal

independent corroboration
    → epistemic support signal

successful future prediction
    → calibration / trust signal

contradictory observation
    → opposition / revision signal
```

---

# 94. Repeated Self-Report

For certain predicates, repeated statements by the same subject are valuable.

Example:

```text
Alice repeatedly reports a preference over six months.
```

This can support:

```text
preference stability
```

even though source independence remains one actor.

A Predicate/Profile may define repeated self-report as meaningful longitudinal Evidence.

Do not globally treat it as multiple independent witnesses.

---

# 95. Predictive Validation

Predictions provide a powerful trust/calibration signal.

Workflow:

```text
Assertion PRED
    mode = predicted

later:
Evidence OBS
    observes outcome

Activity VALIDATE
    compares prediction to outcome
```

A Brain/Profile MAY update:

```text
source calibration
model reliability
Skill utility
```

without rewriting the historical prediction.

---

# 96. Tool Reliability

Tool Evidence can be evaluated using history:

```text
tool outputs
later verified outcomes
error rates
coverage failures
tampering incidents
```

Trust in a tool can therefore evolve.

KIP Epistemic Model defines the possibility.

The Brain/Governance profile defines the learning algorithm.

---

# 97. Trust Learning

Trust may itself be represented as cognitive state.

Example semantic claims:

```text
(MonitorTool, reliability_for, DeploymentStatus)
```

with Assertions/Evidence.

However, the Projection system must avoid unrestricted self-reference where a source can assert its own trust and thereby elevate itself.

Governance should control which trust state influences projection.

---

# 98. Trust Bootstrapping

A new source may begin with:

```text
unknown trust
policy default
restricted influence
```

not automatically zero and not automatically full trust.

Trust can increase/decrease from:

```text
verification
historical calibration
human approval
independent corroboration
observed failures
revocation
```

---

# 99. Trust Revocation

If a source becomes compromised:

```text
future projections
```

may reduce its influence immediately.

Historical Assertions remain unchanged.

This is another reason trust must not be copied permanently into each Assertion.

---

# 100. Trust Policy Evolution

If trust policy changes:

```text
same raw Assertions
→ different current Projection
```

This is expected.

Projection output must identify policy version so the change is explainable.

---

# 101. Epistemic Security Threats

A real memory brain is vulnerable to long-lived epistemic attacks.

At minimum:

```text
high-confidence untrusted assertion injection
source impersonation
origin laundering
manufactured corroboration
Sybil source inflation
provenance cycle amplification
derived-assertion double counting
selective counter-evidence deletion
stale-evidence exploitation
hypothesis-to-fact promotion
prediction-to-observation laundering
signed-but-false import
trust self-escalation
projection snapshot self-confirmation
```

---

# 102. High Confidence Does Not Grant Trust

Attacker:

```text
confidence = 1.0
```

must not bypass:

```text
trust
evidence
provenance
policy
```

This is a required conformance case.

---

# 103. Signature Does Not Grant Truth

A valid signature proves:

```text
this signer signed these bytes
```

It does not prove:

```text
the Proposition is true
the source is competent
the source is honest
the Evidence is sufficient
```

Projection treats signature as integrity/identity evidence.

---

# 104. Provenance Does Not Grant Authority

Perfect provenance can reveal:

> This statement definitely came from an untrusted source.

That is useful.

It does not make the statement trusted.

---

# 105. Local Derivation Does Not Launder Remote Origin

If an untrusted imported claim becomes:

```text
local summary
local Insight
local inferred Assertion
```

the derived object has local engine origin but retains dependency roots on the imported material.

Projection MUST be able to trace that dependence.

---

# 106. Counter-Evidence Deletion Attack

If:

```text
support E1
challenge E2
```

and an attacker deletes E2, a naive projection becomes overconfident.

Mitigations:

```text
strict Evidence deletion policy
audit/change stream
tombstones
projection invalidation
historical explanation
```

Governance defines authorization.

Epistemic Model requires awareness of the risk.

---

# 107. Missing Provenance

An Assertion with missing provenance is still representable.

Projection SHOULD expose:

```text
provenance incomplete
```

rather than silently fabricating a source.

Policy may:

```text
reduce influence
require review
exclude in high-risk context
```

---

# 108. Redacted Provenance

A principal may be authorized to see an Assertion but not its sensitive Evidence/source.

Projection may then operate with:

```text
redacted evidence summary
trust result computed in privileged layer
```

if Governance permits.

Explanation must not leak hidden identities.

Possible explanation:

```text
"Supported by one policy-trusted but redacted source."
```

not:

```text
"Source exists but you cannot know who."
```

unless policy permits that existence signal.

---

# 109. Projection and Privacy

A projection engine must avoid side channels.

For hidden Evidence, unauthorized users must not infer:

```text
exact hidden source count
hidden graph degree
hidden contradiction existence
hidden search matches
hidden confidence values
```

The Governance spec defines redaction semantics.

---

# 110. Epistemic Projection for Recall

Ordinary Recall often wants:

```text
accepted stable knowledge
plus material uncertainty
```

Recommended behavior:

```text
lead with accepted belief
surface contested/uncertain state when decision-relevant
avoid flooding user with low-value historical Assertions
```

Raw audit mode remains available separately.

---

# 111. Epistemic Projection for Action Recall

Action planning should use a stricter projection.

A useful Action Briefing includes:

```text
accepted premises
contested premises
unknown prerequisites
stale observations
applicable Skills
Skill provenance
counterexamples
high-impact uncertainty
```

A low-stakes conversational projection and an action projection SHOULD NOT be assumed identical.

---

# 112. Material Uncertainty

Not every uncertainty deserves user attention.

A Brain may prioritize uncertainty by:

```text
decision relevance
potential harm
reversibility
cost
goal dependency
```

This is Brain policy.

KIP exposes the uncertainty structure.

---

# 113. Projection Caching

Epistemic Projections MAY be cached.

Cache keys should include at least:

```text
space
principal
scope
purpose
valid_at
as_of
policy version
relevant state version/change cursor
```

A cached projection is invalid when relevant underlying epistemic state or policy changes.

---

# 114. Projection Is Not Evidence by Default

A cached or computed Projection result is not automatically Evidence.

If the Brain persists it as a cognitive artifact:

```text
create derived Assertion/Evidence
+
Activity
+
dependency lineage
```

Otherwise it remains transient.

---

# 115. Determinism and Reproducibility

KIP 2.0 does not require every Projection method to be mathematically deterministic.

However, a Projection SHOULD declare:

```text
method_id
method_version
deterministic: true/false
policy_id/version
input/as-of boundary
```

For high-assurance deployments, deterministic or reproducibly calibrated projection methods are preferred.

---

# 116. LLM-Assisted Evidence Evaluation

An implementation MAY use an LLM to estimate:

```text
evidence relevance
semantic conflict
source relationship
context compatibility
```

If so:

```text
the LLM output is an evaluator signal
not canonical truth
```

High-impact decisions SHOULD preserve:

```text
model/method identity
input references
evaluation Activity
confidence/uncertainty
```

when operationally appropriate.

---

# 117. Projection Profiles

Future KIP may standardize named projection profiles.

Possible examples:

```text
structural
conservative
personal-assistant
high-assurance
audit
```

This document does not define their thresholds.

A profile name without a version is insufficient for reproducibility.

---

# 118. Structural Projection

A minimal conforming implementation may provide a deterministic **Structural Projection** that does not attempt sophisticated trust scoring.

It can:

```text
filter lifecycle/time
group support/reject Assertions
identify declared schema conflicts
trace provenance roots
report contested/insufficient
```

without computing a universal numeric belief score.

This provides a low-complexity conformance baseline.

---

# 119. Scored Projection

A more advanced implementation may produce:

```text
support_score
opposition_score
uncertainty_score
```

with self-described score semantics.

Its aggregation algorithm is implementation/policy-defined.

---

# 120. Probabilistic Projection

An implementation MAY expose calibrated probability only if it can state:

```text
score_semantics = calibrated_probability
```

and document the calibration domain.

KIP does not assume all belief is probabilistic.

---

# 121. Evidence Ledger Example

Suppose:

```text
P = ServiceA status "healthy"
```

Evidence:

```text
E1: monitoring API says healthy
E2: independent synthetic probe says healthy
E3: operator says unhealthy
E4: agent summary of E1
```

Projection should recognize:

```text
E4 shares root with E1
```

so the effective structure is:

```text
support roots:
  G1 = E1 + E4
  G2 = E2

opposition roots:
  G3 = E3
```

not:

```text
3 support vs 1 opposition
```

---

# 122. Corroboration Example: News Echo

```text
Article A publishes claim X.
Site B quotes A.
Agent C summarizes B.
Search Engine D indexes C.
```

Four retrieval hits do not equal four independent confirmations.

Provenance-aware projection collapses:

```text
A ← B ← C ← D
```

to one primary root unless another independent source exists.

---

# 123. Repeated Observation Example

A deployment monitor reports healthy every minute for ten minutes.

These are:

```text
10 observation events
1 tool/source
```

They may provide:

```text
strong temporal consistency
```

but not ten independent organizations.

A projection can distinguish:

```text
observation repetition strength
source diversity strength
```

---

# 124. Conflicting Expert Example

```text
P = Drug D is safe for condition C

A1: expert X supports
A2: expert Y rejects
```

Projection may inspect:

```text
expert domain competence
Evidence quality
conflicts of interest
study provenance
time
purpose/risk
```

and return:

```text
contested
```

even if one side has a slightly higher score.

High-risk policy may require stronger resolution.

---

# 125. Personal Preference Example

Alice says:

```text
"I prefer dark mode."
```

For purpose:

```text
configure Alice's UI
```

Alice's self-report may be near-authoritative.

For purpose:

```text
predict what most users prefer
```

the same Evidence has low relevance.

Trust is purpose-sensitive.

---

# 126. Current Status Example

Yesterday:

```text
verified tool:
Service healthy
confidence high
```

Today:

```text
no fresh Evidence
```

Projection for:

```text
"What was status yesterday?"
```

may accept healthy.

Projection for:

```text
"What is status now?"
```

may return insufficient/stale.

No confidence decay is necessary.

---

# 127. Historical Belief Example

January:

```text
A1 supports P
Projection → accepted
```

March:

```text
new E2
A2 rejects P
Projection → contested
```

June:

```text
E3 validates rejection
A3 supersedes self-belief B1
Projection → rejected
```

KIP can answer:

```text
What did we believe in January?
When did doubt first appear?
What evidence caused the June reversal?
What do we believe now?
```

---

# 128. Projection-to-Learning Loop

Epistemic Projection participates in learning:

```text
Evidence
   ↓
Assertions
   ↓
Projection
   ↓
Decision / prediction
   ↓
Outcome
   ↓
new Evidence
   ↓
calibration / trust update / belief revision
```

This closes the loop between memory and future behavior.

---

# 129. Relationship to Experience Learning

Experience and Skill belong to the Cognitive Memory Profile.

The Epistemic Model contributes:

```text
what initial beliefs existed
what observations challenged them
what prediction error occurred
which outcome Evidence is trustworthy
which derived Skill claims are sufficiently supported
```

An Experience can therefore preserve:

```text
belief_before
action
observation
belief_after
```

without confusing those beliefs with timeless facts.

---

# 130. Skill Epistemics

A Skill has at least two distinct epistemic questions:

```text
Is the description of this Skill accurate?
Is this Skill useful/applicable here?
```

These are not identical.

A Skill may have:

```text
high confidence that procedure is represented correctly
low utility in current conditions
```

or:

```text
high historical utility
uncertain applicability to current environment
```

The Cognitive Memory Profile defines utility/applicability.

The Epistemic Model evaluates assertions about them.

---

# 131. Procedural Evidence

Experience outcomes are Evidence about Skill utility.

Example:

```text
Skill S
Experience E1 success
Experience E2 failure
```

A Brain should not convert:

```text
2 experiences
```

into a universal Skill truth.

It evaluates:

```text
condition match
independence
outcome reliability
context similarity
counterexamples
```

---

# 132. Negative Transfer Warning

A highly successful Skill can still be inappropriate in a different context.

Action Projection should distinguish:

```text
epistemically well-supported Skill
```

from:

```text
currently applicable Skill
```

Semantic similarity is not sufficient.

---

# 133. Epistemic Projection and Self-Model

Self-model claims can be epistemically fragile.

Example:

```text
"I am bad at negotiation."
```

should not become immutable identity merely because one failed Event occurred.

A SelfModel Profile may require:

```text
multiple Experiences
longitudinal consistency
counterexamples
human/self reflection
```

before strong durable self-Assertions are formed.

This is profile policy, but the Epistemic Model provides the evidence structure.

---

# 134. Epistemic Projection and Commitments

A Commitment is not merely a fact.

For prospective memory, projection may ask:

```text
Does this commitment still exist?
Was it fulfilled?
Was it cancelled?
What Evidence shows completion?
```

Current Commitment state should preserve lifecycle evidence rather than rely only on one mutable string.

The Cognitive Memory Profile may use Core Assertions to make high-value commitment state auditable.

---

# 135. Domain Knowledge vs. Personal Knowledge

Different domains may require different epistemic policies.

Examples:

```text
personal preferences
organization procedures
scientific claims
medical records
software deployment state
financial facts
family memory
```

KIP does not impose one trust hierarchy.

MemorySpace + Schema + Projection Policy define the environment.

---

# 136. Projection Explanation Levels

Recommended levels:

```text
none
summary
evidence
audit
```

## `summary`

Human/Agent-friendly reason summary.

## `evidence`

Includes contributing Assertions/Evidence roots.

## `audit`

Includes:

```text
policy
trust decisions
provenance paths
excluded Assertions
conflict sets
scores
temporal filtering
```

subject to Governance.

---

# 137. Projection Exclusion Reasons

When an Assertion is excluded, the engine SHOULD be able to classify why:

```text
not_visible
retracted
superseded
expired
outside_valid_time
outside_as_of_time
hypothetical_not_requested
prediction_not_requested
context_mismatch
invalid_schema
unresolved_identity
policy_excluded
provenance_required_but_missing
```

Unauthorized exclusion reasons may need redaction.

---

# 138. Trust Decision Reasons

Useful standardized categories:

```text
verified_identity
unverified_identity
trusted_tool
domain_competence
historical_reliability
imported_source
unsigned_import
provenance_incomplete
known_compromise
conflict_of_interest
policy_default
```

Exact vocabulary may be namespaced.

---

# 139. Uncertainty Reason Categories

Recommended:

```text
insufficient_evidence
conflicting_evidence
low_source_trust
missing_provenance
identity_ambiguity
temporal_staleness
validity_ambiguity
context_ambiguity
schema_ambiguity
correlated_sources
coverage_gap
derived_only
```

These reasons are more interpretable than one scalar uncertainty number.

---

# 140. Corroboration Explanation

Projection should be able to say:

```text
3 visible Assertions
but only 1 independent provenance root
```

This is critical for Agent safety and research explainability.

---

# 141. Evidence Diversity Metrics

Implementations MAY expose:

```text
assertion_count
evidence_count
root_count
source_actor_count
origin_principal_count
corroboration_group_count
independent_root_count
```

These are descriptive metrics.

None is a universal truth score.

---

# 142. Source Diversity Is Not Democracy

Bad rule:

```text
majority of sources wins
```

KIP rejects this as a universal epistemic principle.

Reasons:

```text
sources differ in competence
sources may copy each other
sources may share one upstream error
some domains have authoritative primary records
truth is not majority vote
```

Diversity is evidence structure, not truth itself.

---

# 143. Primary vs. Secondary Source

A Projection Policy MAY distinguish:

```text
primary source
secondary interpretation
tertiary summary
```

using provenance.

This distinction is domain-specific.

A primary source can still be wrong.

---

# 144. Authority Records

In some domains an authoritative record may define operational truth.

Example:

```text
official access-control configuration
canonical organization roster
signed deployment manifest
```

A policy MAY assign such Evidence unusually high authority for that bounded predicate.

This is a policy choice.

KIP Core does not hard-code any source as authoritative.

---

# 145. Conflict of Interest

Trust evaluation MAY consider conflicts of interest.

Example:

```text
vendor self-report about vendor performance
```

This need not make the Evidence unusable.

It may reduce independence/trust under certain policies.

---

# 146. Evidence Freshness Without Forgetting

Old Evidence can remain:

```text
historically important
high-integrity
high-confidence
```

while being insufficient for a current-state query.

This distinction prevents memory maintenance from destroying useful historical truth merely to keep current answers fresh.

---

# 147. Epistemic Compression

Maintenance may create a compact derived Assertion from many raw Assertions.

Example:

```text
50 consistent preference Events
    ↓
stable Preference Assertion
```

The derived Assertion:

```text
improves retrieval efficiency
```

but must retain provenance roots.

Raw Evidence may later be archived according to retention rules, provided enough provenance remains for revision and policy permits.

---

# 148. Compression Does Not Create Independence

If a stable derived Assertion summarizes 50 Events, and later a projection sees both:

```text
derived Assertion
+
the same 50 Events
```

it must avoid counting the same roots twice.

---

# 149. Epistemic Cache vs. Epistemic Memory

A materialized projection can be treated as cache.

A durable `$self` Assertion can be treated as belief memory.

The distinction is explicit.

This prevents every query from recursively becoming new evidence.

---

# 150. Read Does Not Reinforce Truth

Simply retrieving an Assertion MUST NOT increase its epistemic confidence.

Otherwise:

```text
frequently queried false belief
→ increasingly trusted
```

which is a catastrophic feedback loop.

Recall frequency may affect `memory_strength` in the Cognitive Memory Profile, not truth confidence.

---

# 151. User Confirmation

When a user explicitly confirms a recalled fact, that confirmation is **new Evidence**.

Correct pattern:

```text
Recall P
User confirms
    ↓
Evidence E_new
Assertion A_new or revised derived belief
```

not:

```text
read count++
confidence automatically++
```

---

# 152. User Silence Is Not Confirmation

If the Agent states a remembered fact and the user does not object, this is generally not sufficient confirmation.

A profile MAY treat behavior as implicit Evidence only when context clearly supports that inference.

---

# 153. Action Success as Evidence

If a decision based on P succeeds, success may be Evidence relevant to:

```text
Skill utility
decision premise validity
environment model
```

but success does not necessarily prove every premise.

Credit assignment is a Brain/Experience-learning problem.

Projection should avoid indiscriminate reinforcement of all upstream Assertions.

---

# 154. Action Failure as Evidence

Similarly, failure does not automatically falsify every premise.

It may indicate:

```text
wrong precondition
wrong Skill
environment change
tool failure
missing state
incorrect belief
```

Experience learning should preserve the trace for later contrastive consolidation.

---

# 155. Epistemic Credit Assignment

The Epistemic Model supports, but does not prescribe, credit assignment.

A Brain may create:

```text
Activity: retrospective_evaluation
```

linking:

```text
decision premises
actions
outcome Evidence
```

and produce new Assertions about which assumptions were weakened or strengthened.

---

# 156. Evidence Reuse

The same Evidence MAY support multiple Assertions.

Example:

```text
one deployment log
```

may support:

```text
service failed
database target was wrong
migration ran
```

Each relation must be semantically relevant.

Evidence reuse does not imply equal support strength.

---

# 157. One Assertion May Have Mixed Evidence

An Assertion can cite:

```text
supporting Evidence
challenging Evidence
context Evidence
```

This may seem unusual, but it is useful for preserving a source's stance while noting known counter-signals.

A Projection can inspect the full ledger.

---

# 158. Assertion `uncertain` Stance

`stance = uncertain` means the assertor explicitly declines to support or reject the Proposition strongly.

It is not the same as:

```text
low confidence support
```

Example:

```text
stance = uncertain
confidence = 0.9
```

can mean:

> The assertor is highly confident that the correct epistemic position is uncertainty.

This is legitimate.

Projection policies must not collapse stance and confidence into one scalar.

---

# 159. Confidence on Reject Stance

```text
stance = reject
confidence = 0.95
```

means:

> Strong rejection.

It does not mean:

```text
P has 0.05 probability
```

unless a specific calibrated probabilistic policy says so.

---

# 160. Confidence on Uncertain Stance

Confidence describes commitment to the stated stance.

Thus:

```text
uncertain + high confidence
```

is meaningful.

This reinforces why projection requires multidimensional semantics.

---

# 161. Projection of Uncertain Assertions

An `uncertain` Assertion may contribute to:

```text
uncertainty reasons
evidence gaps
conflict awareness
```

rather than ordinary support/opposition.

Policy decides exact treatment.

---

# 162. Mode Does Not Imply Stance

Any mode may combine with stance where semantically meaningful:

```text
observed + support
observed + reject
inferred + uncertain
predicted + support
stated + reject
```

The two dimensions remain orthogonal.

---

# 163. Temporal Predictions

For predicted Assertions, valid time may be in the future.

Projection must distinguish:

```text
prediction target time
assertion time
later validation time
```

This supports calibration.

---

# 164. Provenance Completeness Levels

A projection MAY classify provenance:

```text
complete
partial
opaque
missing
```

Definitions are policy/profile-specific.

An imported black-box Assertion may be:

```text
integrity verified
provenance opaque
```

These are different.

---

# 165. Evidence Integrity Levels

Possible integrity states:

```text
digest_verified
signature_verified
transport_authenticated
engine_observed
unverified
tampered
```

These should not be collapsed into trust automatically.

---

# 166. Evidence Availability

Evidence may be:

```text
available
redacted
offline
expired_external_reference
purged
```

Projection should distinguish:

```text
evidence existed historically
```

from:

```text
evidence can currently be re-inspected
```

---

# 167. Projection Under Purged Evidence

If privacy/legal policy purges Evidence but retains an allowed tombstone/receipt:

```text
Projection may know support lineage once existed
```

but confidence may need to decrease or become unverifiable depending policy.

Do not invent unavailable evidence contents.

---

# 168. Schema Uncertainty

If a Predicate's semantics are unclear or schema versions conflict, Projection should not fabricate conflict logic.

Return:

```text
schema_ambiguity
```

and prefer conservative interpretation.

---

# 169. Entity Resolution Uncertainty

If two "Alice" Concepts may refer to the same person but are not merged:

```text
do not silently combine their Assertions
```

Projection may surface identity ambiguity.

Identity consolidation is separate from belief aggregation.

---

# 170. Canonical Merge and Projection

When Concept A is merged into B:

```text
canonical queries may treat Propositions over A/B as semantically co-referential
```

while raw audit preserves original IDs.

Projection explanation should be able to note:

```text
"Historical assertion referenced alias identity A, now resolved to B."
```

---

# 171. Cross-Space Epistemics

Each Space evaluates imported cognition under local policy.

Therefore:

```text
same signed Assertion
```

may be:

```text
accepted in Space A
uncertain in Space B
rejected/excluded in Space C
```

depending on trust/purpose.

This is expected.

---

# 172. Trust Does Not Transfer Automatically Across Spaces

Source Space:

```text
trust(source X) = high
```

Destination Space does not inherit that trust merely because it imports the source's policy or conclusion.

Trust must be resolved locally.

---

# 173. Imported Projection Results

A remote system may export:

```text
"we accepted P"
```

The destination should treat that as:

```text
an assertion about the remote system's belief
```

not as local accepted truth.

If imported, provenance should indicate the remote projection method/policy where available.

---

# 174. Organization Memory

In organizational brains, Assertions may come from:

```text
employees
agents
official systems
documents
meetings
policies
external sources
```

A useful Projection can distinguish:

```text
official organizational assertion
individual employee belief
observed operational fact
external advice
historical superseded policy
```

without flattening them.

---

# 175. Policy vs. Factual Assertion

An organization may have:

```text
Policy says X must happen.
```

This is not the same as:

```text
X actually happened.
```

The schema/profile should distinguish normative propositions from descriptive propositions.

Projection purpose determines which matters.

---

# 176. Normative Claims

A future Schema/Profile may mark predicates as:

```text
descriptive
normative
predictive
```

Epistemic Projection should avoid treating:

```text
"must"
```

as:

```text
"is"
```

This document does not standardize deontic logic.

---

# 177. Self-Report Domains

Some predicates have a privileged subject authority.

Examples:

```text
preference
subjective feeling
personal intention
self-declared goal
```

Projection Policy may define:

```text
subject_self_report_authority = high
```

while still preserving contradictions over time.

---

# 178. Externally Verifiable Domains

Other predicates are better grounded in external observation:

```text
account balance
server status
package version
flight departure time
```

Self-report alone may be insufficient.

Again, schema/policy defines epistemic expectations.

---

# 179. Source-Domain Competence

Trust should support:

```text
source × domain/predicate
```

not one global score.

Example:

```text
Doctor:
  medical diagnosis → high
  Kubernetes deployment → unknown

SRE Agent:
  Kubernetes deployment → high
  medical diagnosis → unknown
```

---

# 180. Purpose-Domain Interaction

Even within one predicate, purpose can change evidence requirements.

Example:

```text
"Is the service probably healthy?"
    operational overview

"May I initiate irreversible failover?"
    high-consequence action
```

The second projection may demand fresher and independently verified Evidence.

---

# 181. Epistemic Thresholds

A policy MAY define thresholds for:

```text
accept
reject
contest
uncertainty
minimum root diversity
minimum trust
freshness
high-risk review
```

KIP does not define universal numeric values.

---

# 182. Threshold Hysteresis

To prevent oscillating beliefs around a threshold, implementations MAY use hysteresis:

```text
higher threshold to switch state
lower threshold to remain in state
```

If used, it must be policy-declared.

Do not hide stateful threshold behavior.

---

# 183. Projection Stability

A Brain may prefer stable beliefs while remaining responsive to strong Evidence.

Projection stability can consider:

```text
previous durable self-belief
evidence change magnitude
source reliability
conflict strength
```

But prior belief MUST NOT become independent evidence merely because it was previously accepted.

---

# 184. Avoiding Confirmation Bias

A previous `$self` Assertion derived from evidence should not automatically receive extra epistemic weight solely because it is "my belief."

Policy may value continuity, but must preserve the distinction between:

```text
prior
and
evidence
```

---

# 185. Belief Inertia

If a system deliberately uses belief inertia, it should be explicit as:

```text
projection policy behavior
```

not hidden inside Assertion confidence.

This keeps historical evidence interpretable.

---

# 186. Calibration Records

A sophisticated Brain may record calibration Evidence:

```text
source predicted outcome X
actual outcome Y
```

and derive reliability Assertions.

These can inform Trust Resolver.

This creates a learnable epistemic system.

---

# 187. Epistemic Learning

KIP enables a Brain to learn not only facts but:

```text
which sources are reliable
which tools are stale
which inference methods overfit
which domains require stronger corroboration
which assumptions repeatedly fail
```

This is meta-epistemic learning.

The learning algorithm belongs to Brain/Profile.

---

# 188. Meta-Epistemic Assertions

Examples:

```text
(MonitorX, reliable_for, ServerHealth)
(ModelY, overconfident_on, LegalQuestions)
(SourceZ, frequently_copies, SourceA)
```

These are ordinary Propositions + Assertions.

Governance decides whether they influence trust.

---

# 189. Trust Policy Cannot Be Self-Modified by Untrusted Content

An imported Assertion:

```text
"Trust SourceX completely."
```

cannot modify the Trust Resolver merely because it is stored.

Changes to policy require Governance authority.

This prevents epistemic privilege escalation.

---

# 190. Projection Audit Record

For high-impact decisions, an implementation MAY persist an audit record containing:

```text
projection request digest
policy id/version
as-of boundary
result status
support/opposition root IDs
important exclusions
output digest
```

This record is not automatically a new epistemic source.

It is an audit artifact.

---

# 191. Decision Provenance

An Agent may link a decision Activity to the Projection/audit record used.

Then the system can later answer:

> What did the Agent believe when it made this decision?

This is a major requirement for a real memory brain.

---

# 192. Decision Review

After outcome Evidence arrives:

```text
Decision Activity
    +
Projection snapshot
    +
Outcome Evidence
```

can feed a retrospective Activity.

The Brain may learn:

```text
wrong belief
bad trust policy
stale evidence
wrong Skill
unobserved condition
```

---

# 193. Projection and Cognitive Primer

The Cognitive Primer should normally use stable accepted knowledge.

It should avoid silently promoting:

```text
contested
hypothetical
stale
low-trust
```

claims into identity/domain summaries.

Important unresolved uncertainty may be included explicitly.

---

# 194. Primer Provenance

If a Primer includes a durable summary:

```text
"User prefers dark mode."
```

the underlying accepted projection should remain traceable.

A Primer is not the canonical source of truth.

---

# 195. Projection and Search

`SEARCH` retrieves candidates.

Epistemic Projection determines belief relevance.

Therefore:

```text
high semantic _score
≠
high epistemic support
```

Search may return a highly relevant false/retracted claim.

Projection must filter/evaluate it.

---

# 196. Search Over Raw vs. Accepted State

Future KQL/META may expose:

```text
SEARCH RAW
SEARCH ACCEPTED
SEARCH CONTESTED
```

or equivalent views.

The exact syntax is deferred.

The Epistemic Model requires the conceptual distinction.

---

# 197. Retrieval of Counter-Evidence

For high-impact decisions, Recall SHOULD be able to intentionally retrieve:

```text
strongest support
strongest opposition
relevant counterexample
unresolved uncertainty
```

rather than only the highest-ranked confirming memory.

This helps resist confirmation bias and negative transfer.

---

# 198. Projection Quality Metrics

Implementations may evaluate projection quality through:

```text
calibration
accuracy
Brier/log loss where probabilistic
conflict detection precision
source-independence detection
historical reconstruction
explanation faithfulness
decision utility
adversarial robustness
```

Protocol conformance is separate from cognitive quality.

---

# 199. Epistemic Conformance Suite

A KIP 2.0 Epistemic implementation should eventually be tested against fixtures such as:

```text
high-confidence untrusted source
two conflicting credible sources
three paraphrases from one root
derived Assertion plus its own premises
same source repeated over time
non-overlapping temporal state
retracted Assertion
superseded same-actor Assertion
hypothetical Assertion
prediction vs later observation
boolean false vs reject stance
missing Evidence
circular provenance
imported signed false claim
counter-evidence deletion
historical as-of projection
unknown vs rejected
functional predicate conflict
identity ambiguity
redacted Evidence
```

---

# 200. Required Conformance Invariants

A conforming Epistemic Model MUST preserve at least these invariants:

1. Proposition existence does not imply truth.
2. Stored Assertion does not imply local endorsement.
3. Assertion confidence is not source trust.
4. Assertion confidence is not projection probability.
5. Missing support does not imply rejection.
6. The default world model is open-world.
7. Retraction removes current support without deleting history.
8. Supersession is not generic contradiction.
9. Different actors may disagree without either superseding the other.
10. Non-overlapping temporal claims are not automatically contradictory.
11. Contextually distinct claims are not automatically contradictory.
12. Hypothetical Assertions are not ordinary factual belief.
13. Predictions are not observations.
14. Imported Assertions are not locally accepted by default.
15. A signature proves integrity/origin binding, not truth.
16. Provenance does not equal trust.
17. Derivation does not create independent corroboration.
18. Paraphrase/copy does not create independent corroboration.
19. A Projection snapshot does not independently corroborate its own roots.
20. Provenance cycles do not amplify support.
21. Source count is not a universal truth vote.
22. Same-source repetition is distinct from independent-source corroboration.
23. Temporal freshness is not generic confidence decay.
24. Read frequency does not increase epistemic confidence.
25. User silence is not generic confirmation.
26. Explicit confirmation is new Evidence.
27. Counter-evidence is first-class.
28. Evidence deletion is epistemically consequential.
29. Conflict may remain unresolved.
30. Accepted belief is context/policy/time dependent.
31. Projection policy/version must be identifiable for audit.
32. Trust is contextual by source/domain/purpose.
33. Action authority is separate from epistemic trust.
34. Identity assurance is separate from claimed `asserted_by`.
35. Historical belief and current belief-about-history are different.
36. Projection must respect Governance visibility before reasoning.
37. Hidden Evidence must not leak through projection side channels.
38. Numeric scores must declare their semantics.
39. Support and opposition need not sum to 1.
40. Uncertainty must be representable independently of support/opposition.

---

# 201. Minimal Epistemic Projection Conformance

A minimal implementation does not need a sophisticated scoring algorithm.

It MUST be able to:

```text
identify eligible Assertions
separate support/reject/uncertain stances
filter lifecycle/current-time state
preserve open-world insufficient state
identify same-Proposition direct conflict
consume schema-declared value conflicts
traverse provenance enough to detect direct derivation duplication
distinguish imported/hypothetical/predicted modes
emit an auditable status
```

This makes KIP useful even before advanced trust learning exists.

---

# 202. Advanced Epistemic Projection Capability

An advanced implementation may add:

```text
source calibration
trust learning
root-independence clustering
semantic evidence relevance scoring
probabilistic aggregation
risk-sensitive thresholds
freshness models
conflict-of-interest models
LLM-assisted evidence evaluation
meta-epistemic learning
```

These must remain self-described.

---

# 203. Recommended Projection Output Contract

A mature implementation SHOULD expose logically equivalent fields to:

```text
target proposition / conflict set
status
support summary
opposition summary
uncertainty
eligible Assertions
excluded Assertion summary
independent root groups
temporal context
policy identity/version
score semantics
explanation
warnings
```

Exact JSON is deferred to KQL/META.

---

# 204. Relationship to KIP Core Data Model

The Core Data Model remains unchanged in its central responsibilities:

```text
Proposition = immutable semantic term
Assertion   = historical epistemic commitment
Evidence    = immutable cited artifact
Activity    = provenance transformation
_system     = engine truth
MemorySpace = governance boundary
```

This Epistemic Model deliberately does not add a mutable:

```text
Proposition.truth
Proposition.current_confidence
Proposition.accepted
```

field.

That would recreate the KIP 1.x coupling problem.

---

# 205. Proposed Small Core Refinement: Auditable Lifecycle Transitions

Historical epistemic projection requires knowing not only the current Assertion lifecycle state but when transitions happened.

Therefore the Transactions/Data Model specifications SHOULD guarantee that transitions such as:

```text
active → retracted
active → superseded
active → expired
```

are reconstructable through:

```text
transaction history
change stream
or append-only lifecycle events
```

The Epistemic Model does not require one storage representation.

It does require historical reconstructability from implementations advertising historical projection.

---

# 206. Proposed Small Core Refinement: Provenance Root Visibility

Projection benefits if Evidence/Activity APIs can efficiently expose:

```text
upstream inputs
origin/import receipt
content digest
source refs
record mode
```

This does not require a new Core element.

It should influence KQL/META query design.

---

# 207. Proposed Small Core Refinement: Evidence Citation Origin

If later Evidence is attached to a historical Assertion only through review rather than as part of the original Assertion, the system SHOULD distinguish:

```text
original citation
post-hoc review citation
```

to preserve what the actor actually knew at assertion time.

A future Core/KML refinement may represent post-hoc citations as audit/review structures rather than mutating the immutable Assertion payload.

---

# 208. Epistemic Projection Pseudocode

Non-normative:

```text
function project(target, request):

    visible_state =
        governance_filter(request.principal, request.space)

    conflict_set =
        semantic_expand(target, schema, request.context)

    assertions =
        select_assertions(conflict_set)

    assertions =
        filter_as_of(assertions, request.as_of)

    assertions =
        filter_lifecycle(assertions, request)

    assertions =
        filter_valid_time(assertions, request.valid_at)

    assertions =
        filter_mode_and_context(assertions, request.purpose)

    dependency_graph =
        expand_provenance(assertions)

    dependency_graph =
        detect_and_collapse_cycles(dependency_graph)

    root_groups =
        build_corroboration_groups(dependency_graph)

    trust =
        resolve_contextual_trust(root_groups, assertions, request)

    evidence_quality =
        evaluate_evidence(root_groups, request)

    support, opposition =
        aggregate(
            assertions,
            root_groups,
            trust,
            evidence_quality,
            policy
        )

    uncertainty =
        analyze_uncertainty(
            support,
            opposition,
            missingness,
            conflicts,
            provenance_gaps,
            temporal_gaps
        )

    status =
        classify(
            support,
            opposition,
            uncertainty,
            policy
        )

    return explainable_projection(...)
```

The algorithm structure is illustrative.

---

# 209. Example Projection: User Preference

Raw state:

```text
P = (Alice, prefers, DarkMode)

A1:
  asserted_by = Alice
  stance = support
  mode = stated
  Evidence = direct user message

A2:
  asserted_by = FriendBob
  stance = reject
  mode = stated
  Evidence = Bob says Alice prefers LightMode
```

Purpose:

```text
configure Alice's own UI
```

Policy may assign:

```text
Alice self-report → high domain authority
Bob report → low relative authority
```

Projection:

```text
accepted P
```

while preserving A2.

---

# 210. Example Projection: Medical Claim

Same structural pattern:

```text
User supports diagnosis P
Doctor rejects P
Verified lab Evidence challenges P
```

A medical policy may produce:

```text
rejected / contested
```

even if user confidence is 1.0.

Same protocol.

Different epistemic context.

---

# 211. Example Projection: One Root, Many Repetitions

```text
P = claim X

A1 from Article A
A2 from Agent summary of A
A3 from another Agent reading A2
A4 from search index of A
```

Naive:

```text
4 confirmations
```

KIP 2.0:

```text
1 provenance root
1 corroboration group
```

Projection support does not quadruple.

---

# 212. Example Projection: Independent Measurements

```text
Sensor A measures 42
Sensor B measures 42
Human manual measurement = 41.9
```

If independent and trusted:

```text
3 epistemically diverse roots
```

Support may be much stronger.

---

# 213. Example Projection: Circular Consensus

```text
Agent A cites Agent B
Agent B cites Agent C
Agent C cites Agent A
```

No external Evidence root.

Projection:

```text
corroboration = none/low
warning = circular provenance
```

not:

```text
3 independent agents agree
```

---

# 214. Example Projection: Prediction

Yesterday:

```text
A_pred:
  "deployment will fail"
  mode = predicted
```

Today:

```text
E_obs:
  deployment succeeds
```

The original prediction remains.

Brain may derive:

```text
prediction invalidated
source calibration weakened
```

without rewriting history.

---

# 215. Example Projection: Old High-Quality Evidence

```text
P = Alice's birth date
E = official record from 10 years ago
```

Old age does not imply low currentness if predicate is stable.

Policy freshness requirement is effectively none.

---

# 216. Example Projection: Old Server Status

```text
P = server healthy
E = verified monitor from 10 hours ago
```

Evidence may remain historically excellent but current projection may be:

```text
insufficient for now
```

This demonstrates:

```text
truth confidence ≠ temporal relevance
```

---

# 217. Example Projection: Same Actor Revision

```text
January:
Alice supports P

March:
Alice rejects P and explicitly corrects herself
```

Current projection may exclude January as superseded for Alice's current stance.

Historical projection preserves both.

---

# 218. Example Projection: Different Actor Conflict

```text
Alice supports P
Carol rejects P
```

No automatic supersession.

Projection may return:

```text
contested
```

---

# 219. Example Projection: Functional Predicate

```text
P1 = (Project, status, "active")
P2 = (Project, status, "archived")
```

Schema:

```text
status max cardinality = 1
```

Overlapping valid time creates a Conflict Set.

Projection compares Evidence for alternatives.

---

# 220. Example Projection: Non-Conflict Across Time

Same P1/P2, but:

```text
P1 valid_until = Aug 1
P2 valid_from  = Aug 1
```

No material temporal overlap.

Both can be accepted historically.

---

# 221. Example Projection: Uncertain Stance

Expert says:

```text
"I cannot determine whether P from available evidence."
```

Assertion:

```text
stance = uncertain
confidence = 0.95
```

This is strong Evidence that the expert regards the state as unresolved.

It is not weak support for P.

---

# 222. Example Projection: Missing Evidence

One imported Assertion:

```text
confidence = 0.99
Evidence unavailable
Provenance opaque
Signer unknown
```

High-risk projection may return:

```text
uncertain / insufficient
```

despite the assertion's high confidence.

---

# 223. Example Projection: Signed External Assertion

```text
signature verified
asserted_by = ExternalAgentX
confidence = 1.0
```

Local policy knows nothing about X's competence.

Projection:

```text
integrity = high
identity binding = high
domain trust = unknown
```

Do not collapse these into "trusted."

---

# 224. Example Projection: Imported Organizational Policy

A signed official organization policy may receive high authority for:

```text
"What is official policy?"
```

but not necessarily for:

```text
"Did employees actually follow it?"
```

Same document, different Proposition/purpose.

---

# 225. Example Projection: Self-Confirming Summary

Raw:

```text
E1 supports P
Brain summary A2 inferred from E1
```

Later Projection sees E1 + A2.

Correct:

```text
one root
```

Incorrect:

```text
two confirmations
```

---

# 226. Example Projection: User Confirms Recall

Brain says:

```text
"You prefer dark mode, right?"
```

User:

```text
"Yes."
```

This creates new Evidence E2.

E2 may support longitudinal stability.

It is not merely a read reinforcement.

---

# 227. Example Projection: User Does Not Correct

Brain says:

```text
"You prefer dark mode."
```

User continues talking without addressing it.

No generic new confirmation Evidence should be inferred.

---

# 228. Example Projection: Tool Echo

Agent calls Tool A.

Tool B simply returns cached output from Tool A.

Without provenance:

```text
2 tools agree
```

With provenance:

```text
1 underlying observation
```

This is exactly why Activity/provenance is Core.

---

# 229. Example Projection: Common Faulty Dependency

Sensors A and B both depend on one faulty upstream clock.

They may appear independent by device identity but share a causal dependency.

If provenance/policy knows this, Corroboration Groups should reduce independence.

KIP can represent this knowledge but does not mandate perfect causal discovery.

---

# 230. Limits of the Epistemic Model

KIP 2.0 cannot guarantee truth.

Even perfect structure cannot eliminate:

```text
unknown unknowns
coordinated deception
bad sensors
bad schemas
misleading but internally consistent evidence
model reasoning errors
missing context
```

The goal is not omniscience.

The goal is:

> **Make uncertainty, source dependence, revision, and provenance explicit enough that an Agent can reason about what it knows instead of merely storing what it has seen.**

---

# 231. Division of Responsibility

## KIP Core Data Model

Defines:

```text
Assertion
Evidence
Activity
Proposition
origin
time
references
immutability
```

---

## KIP Epistemic Model

Defines:

```text
confidence semantics
trust semantics
eligibility
evidence dependency
corroboration
conflict
open-world behavior
belief revision
Epistemic Projection contract
explanation
```

---

## KIP Governance

Defines:

```text
who may see
who may assert
who may alter trust policy
authority
classification
redaction
```

---

## Schema Packages

Define:

```text
predicate meaning
cardinality
exclusivity
type constraints
conflict semantics
```

---

## Cognitive Memory Profile

Defines:

```text
Event
Experience
Skill
memory strength
salience
utility
memory lifecycle
```

---

## Anda Brain

Owns:

```text
which Projection Policy to use
trust-learning algorithm
calibration
evidence relevance estimation
belief snapshot strategy
formation thresholds
maintenance
Action Briefing
experience learning
```

---

# 232. Design Summary

The complete epistemic path is:

```text
              Raw Cognitive State
                       │
                       ▼
              Governance Visibility
                       │
                       ▼
               Eligible Assertions
                       │
                       ▼
            Provenance / Evidence DAG
                       │
                       ▼
             Corroboration Groups
                       │
                       ▼
             Contextual Trust Model
                       │
                       ▼
         Support / Opposition / Unknown
                       │
                       ▼
              Conflict Resolution
                       │
                       ▼
             Epistemic Projection
          ┌────────┬─────────┬─────────┐
          │        │         │         │
      accepted  rejected  contested  uncertain
                                  │
                                  └── insufficient
                       │
                       ▼
               Recall / Decision
                       │
                       ▼
                     Action
                       │
                       ▼
                 New Evidence
                       │
                       └──────────────↺
```

---

# 233. Core Equations

The model can be summarized by a small set of conceptual equations.

```text
Stored Assertion ≠ Accepted Belief
```

```text
Assertion Confidence ≠ Source Trust
```

```text
Epistemic Support ≠ Assertion Count
```

```text
Independent Corroboration ≠ Repetition
```

```text
Derived Cognition does not create Independent Evidence
```

```text
Absence of Evidence ≠ Evidence of Absence
```

```text
Historical Credibility ≠ Current Temporal Relevance
```

```text
Belief =
    Projection(
      Assertions,
      Evidence,
      Provenance,
      Trust,
      Time,
      Context,
      Purpose,
      Policy
    )
```

and, for a memory brain:

```text
Epistemic Learning =
    new Evidence
    → durable revision of belief policy/state
    → better future prediction or action
```

---

# 234. Final Principle

KIP 1.x made it possible for an Agent to remember:

> **"Alice prefers dark mode."**

KIP 2.0 Core makes it possible to remember:

> **"Alice asserted that she prefers dark mode, based on this message, at this time, through this origin."**

The Epistemic Model makes it possible to know:

> **"For the purpose of configuring Alice's own UI, I currently accept that preference because Alice's direct self-report is authoritative in this domain; an older conflicting statement is superseded; the supporting evidence is independent and current enough; and I can explain exactly why this belief should influence my next action."**

That transition is the difference between storing facts and maintaining a **belief-capable memory brain**.

A real memory brain does not merely preserve what was said.

It preserves:

```text
what was claimed
who claimed it
what supported it
where that support came from
whether support is independent
what contradicts it
when it applied
how much the source should matter here
what remains unknown
why belief changed
and whether that belief should affect the next decision
```

That is the epistemic foundation KIP 2.0 requires.
