# KIP 2.0 — Cognitive State Protocol for Agent Memory

**[English](./README.md) | [中文](./README_CN.md)**

## Status

**Normative draft.** KIP [v1.0-RC11](../SPECIFICATION.md) remains the shipping contract, and existing clients need to change nothing today. The 2.0 draft covers its intended surface: its Core, its consequence channel, its Watch firing and its erasure rules are backed by [formal models](./formal/README.md), the rest of the proactivity layer by conformance vectors, and two independent engines already track it — a [Rust](https://github.com/ldclabs/anda-db/tree/main/rs/anda_cognitive_nexus) reference implementation and a [Cloudflare Durable Object](https://github.com/ldclabs/anda-db/tree/main/ts/kip-do) one, held to each other by a shared [conformance suite](./conformance/KIP-2.0-Conformance-Tests.md). Nothing in `v2/` is released.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./diagrams/kip-2.0-information-architecture-dark.png">
    <img src="./diagrams/kip-2.0-information-architecture.png" alt="KIP 2.0 information architecture: Agent/Brain speaks KQL, KML and META over the wire contract; reads project through Epistemic Projection into Cognitive State; writes commit through the Transaction Runtime; commits publish a Change Stream that returns to the Agent as a state differential; Governance and Schema form a protected control plane; state exports as a Cognitive Capsule." width="100%">
  </picture>
</p>

<p align="center"><sub>An <a href="./diagrams/kip-2.0-information-architecture.html">interactive version</a> — pan, zoom, relationship tracing, five guided views — is a self-contained file: download it and open it in a browser.</sub></p>

## The one idea

A memory that cannot separate *what was said* from *what is true* will eventually lie to its owner with total confidence. KIP 2.0 refuses to collapse three questions:

```text
Meaning      what can be represented at all
Belief       what the Brain currently accepts
Authority    who may read, write, project, or elevate
```

So a stored **Proposition** is truth-neutral. An **Assertion** carries one actor's stance toward it, with mode, confidence, validity and evidence. Belief is not a stored field but an **Epistemic Projection** computed at read time over the eligible assertions:

```text
Proposition exists  ≠  Proposition is true  ≠  Brain accepts Proposition
```

This is why a reversal costs nothing. "Actually, I'm vegetarian now" is a new assertion superseding an old one; the next projection simply reports the new value. There is no mutable belief map to patch, and the superseded preference stays auditable instead of disappearing.

Evidence, provenance and schema get the same treatment: [Evidence](./KIP-2.0-SPECIFICATION.md#15-evidence) and [Activity](./KIP-2.0-SPECIFICATION.md#16-activity) are first-class elements rather than metadata bags, and schema lives in versioned, digest-pinned [packages](./KIP-2.0-SPECIFICATION.md#20-schema-packages).

## The proactivity layer

A memory that only answers when asked is half a memory. The other half is what the Brain does when nobody is talking to it — and it must not be a cron job. KIP 2.0 gives that half four mechanisms, none of which decides policy on the Brain's behalf:

| Mechanism | What it is |
| --- | --- |
| [`Watch`](./profiles/CognitiveMemoryProfile-2.0.md#511-watch) | Durable attention state. A declared condition under which a change — **or the absence of one** — deserves attention. Armed watches are evaluated against committed [Change Envelopes](./KIP-2.0-SPECIFICATION.md#36-change-stream); a *silence* watch fires when its `due_at` passes with no match. Proactivity becomes a state differential — delta watches fire on committed change, silence watches on a due-time sweep — rather than a blind schedule. **A fired Watch grants nothing**: it creates attention, never an action. |
| [`action_gate`](./profiles/CognitiveMemoryProfile-2.0.md#9-activities) | An Activity class recording what the gate decided — `act`, `ask`, `defer`, or `silence` — with the inputs it weighed. Restraint is the hardest thing to justify after the fact, so deliberate silence is written down like any other outcome. |
| [`LIST DEPENDENTS`](./KIP-2.0-SPECIFICATION.md#635-list-dependents) | Bounded reverse traversal of provenance. Revise a root and the cognition compiled from it — insights, preference summaries, skills, the self-model — becomes discoverable in one operation instead of quietly stale. [§57.5](./KIP-2.0-SPECIFICATION.md#575-revision-and-derived-cognition) makes the rule explicit: a revised root **must not** auto-retract its dependents, and **must** leave them reviewable. Whether one survives is a review decision, not a protocol rule. |
| [`PURGE PAYLOAD`](./KIP-2.0-SPECIFICATION.md#606-payload-purge) | Destroy an Evidence element's observed bytes while keeping the record: its digest, class, observation time, source, and the citations that depend on it. Data minimization that costs no provenance — [corroboration and independence counting](./KIP-2.0-SPECIFICATION.md#23-epistemic-independence) keep working on the surviving digest. Distinct from element [purge](./KIP-2.0-SPECIFICATION.md#603-purge), which destroys the record itself. |

Supporting state lives in the [Cognitive Memory Profile](./profiles/CognitiveMemoryProfile-2.0.md): [`WorkingState`](./profiles/CognitiveMemoryProfile-2.0.md#512-workingstate) is the consolidated resume digest stamped with its `basis_seq`, so a Brain wakes from compiled state plus a delta rather than re-reading scrollback; [`DerivationState`](./profiles/CognitiveMemoryProfile-2.0.md#6-standard-facets) carries the `current | stale | under_review` flag that a dependent review writes back; and `MnemonicState.utility` holds the admission bet — how useful this memory is expected to be — kept deliberately separate from `salience`, from `memory_strength`, and from epistemic `confidence`.

## The consequence channel

Everything above makes the system watch the world better. The consequence channel is how the world watches back.

[Outcome Evidence](./KIP-2.0-SPECIFICATION.md#157-outcome-evidence) records what actually happened after a decision, action, or trialed procedure — written by instrumentation (telemetry, verifiers, test harnesses, human review), **never by the actor whose action it grades**. An actor's own account is `agent_statement`, citable as context only; the separation is a conformance invariant, enforced as auditability — engine origin always records who wrote what, and Governance can restrict who may write outcomes — because an open protocol can make self-grading visible even where it cannot make it impossible.

Each outcome carries a **task family**: the stream of comparable consequences it belongs to. The family finds the baseline; it never attributes. An outcome grades a decision only through the instrument's `outcome_observation` Activity naming the [`action_gate`](./profiles/CognitiveMemoryProfile-2.0.md#9-activities) that applied the Skill — whose [`DecisionRecord`](./profiles/CognitiveMemoryProfile-2.0.md#66-decisionrecord) and inputs say what was decided and with what — so two Skills in one family are graded by their own decisions, never by each other's. A [Skill](./profiles/CognitiveMemoryProfile-2.0.md#58-skill) must name the family its baseline comes from — its scoring handle — before it may enter trial; a pattern that nothing could prove wrong is not procedural memory. On the channel sits the [Skill lifecycle](./profiles/CognitiveMemoryProfile-2.0.md#14-skill-lifecycle):

```text
proposed → trialed → adopted → revoked
```

Transitions execute only as deterministic verdicts over linked outcomes — recorded as [`lifecycle_verdict`](./profiles/CognitiveMemoryProfile-2.0.md#9-activities) activities and [one guarded UPDATE](./KIP-2.0-SPECIFICATION.md#f6-outcome-grading-and-a-lifecycle-verdict), recomputable by an auditor from the [`TrialState`](./profiles/CognitiveMemoryProfile-2.0.md#65-trialstate) basis recorded when the trial opened — never author assertion, never decay, never the acting model's judgment. Adoption is comparative (*better than it was going*, against that recorded basis; how the comparison is constructed stays Brain policy) and provisional (the stream keeps grading, and degradation demotes). Revocation is never harder than adoption, and lifecycle standing does not survive import: an imported Skill re-enters at `proposed`, because adoption — like trust and authority — has to be earned where it is spent.

## Protocol provides signals; the Brain owns policy

KIP does not define an admission threshold, an interruption policy, a salience algorithm, a consolidation schedule, or a skill compiler. It defines where those decisions put their inputs and their receipts. A protocol that hardcoded one utility function would stop being a protocol — and every deployment would fork it.

The policy layer is a separate, replaceable component:

- **[Brain 2.0](./brain/README.md)** — the reference design: **Formation** (what deserves to outlive this turn), **Recall** (what from the past should change what I do next), and **Maintenance** (the sleep-time metabolism that consolidates, compiles skills, reviews contradictions, and metabolizes memory strength).
- **[`$self` / `$system`](./SelfInstructions.md)** — the single-agent variant, a thin delta layered on the Brain policies above: a waking mind that experiences, and a sleeping mind that integrates.
- **[Experience Learning Architecture](./brain/ExperienceLearningArchitecture.md)** — the loop the Brain implements, and how to evaluate whether it actually learned anything rather than merely stored more.

The seam matters in both directions. Because policy is out of the protocol, two Brains with different admission utilities can share one Cognitive Nexus; and because the signals are in the protocol, either Brain's decisions remain auditable by the other.

## Memory should be portable

If memory is what makes an agent valuable, the natural move is to make it impossible to leave with. KIP takes the opposite position: cognition exports as a signed, inspectable [Cognitive Capsule](./KIP-2.0-SPECIFICATION.md#37-cognitive-capsule), and import is a destination-governed transaction — a capsule's signature proves origin and integrity, never truth, trust, or authority. Imported skills stay non-executable until the destination elevates them; a source's `$self` never becomes the destination's.

## Documents

| Document | Description |
| --- | --- |
| [📖 Specification 2.0](./KIP-2.0-SPECIFICATION.md) | The normative draft ([中文](./KIP-2.0-SPECIFICATION_CN.md)) |
| [📦 Capsule Specification 2.0](./KIP-2.0-Capsule-Specification.md) | Specification §37–§41 and §95: the portable, verifiable memory artifact ([中文](./KIP-2.0-Capsule-Specification_CN.md)) |
| [🧭 Optional Profiles & Migration](./KIP-2.0-Optional-Profiles-and-Migration.md) | Specification §100, §101, §103 and Appendix I: Historical, High-Assurance, and KIP 1.x migration ([中文](./KIP-2.0-Optional-Profiles-and-Migration_CN.md)) |
| [📜 Invariant Registry](./KIP-2.0-Invariants.md) | The 38 Core and 35 Profile invariants in one list, each with the section that establishes it and the vectors that pin it ([中文](./KIP-2.0-Invariants_CN.md)) |
| [🏛 Architecture 2.0](./KIP-2.0-Architecture.md) | Design rationale behind the Specification ([中文](./KIP-2.0-Architecture_CN.md)) |
| [📐 Syntax Reference 2.0](./KIPSyntax.md) | LLM-facing KQL / KML / META card ([中文](./KIPSyntax_CN.md)) |
| [🧩 Cognitive Memory Profile 2.0](./profiles/CognitiveMemoryProfile-2.0.md) | Experience, Skill, Commitment, Watch, WorkingState, and the rest ([中文](./profiles/CognitiveMemoryProfile-2.0_CN.md)) |
| [🧠 Brain 2.0](./brain/README.md) | Formation / Recall / Maintenance ([中文](./brain/README_CN.md)) |
| [🤖 `$self` / ⚙️ `$system`](./SelfInstructions.md) | Single-agent prompt pair, a delta over Brain 2.0 ([`$system`](./SystemInstructions.md)) |
| [🗂 Design Notes](./design/) | Ten pre-consolidation rationale documents, frozen 2026-09-02 |
| [🔤 Grammars & Schemas](./grammar/) | Normative EBNF, plus the [wire schemas](./schemas/) |
| [🧪 Conformance Suite](./conformance/KIP-2.0-Conformance-Tests.md) | 331 portable vectors across 13 conformance profiles |
| [🔬 Formal Verification](./formal/README.md) | Alloy and TLA+ models, and what they proved |
| [🔀 Migration from 1.x](./migration/KIP-2.0-Migration-from-1.x.md) | What changes, and what legacy meaning must not be invented |

Every document in `v2/` is bilingual: each `X.md` has an `X_CN.md` twin.

## Governing principle

> **KIP 2.0 is a protocol for durable cognition: new information may change what a Brain does next without requiring the Brain to falsify what happened before.**
