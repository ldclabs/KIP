# KIP 2.0 — Cognitive State Protocol for Agent Memory

**[English](./README.md) | [中文](./README_CN.md)**

## Status

**Default development version: KIP 2.0 — normative draft.** The repository root
contains the current protocol and tooling. KIP [v1.0-RC11](./v1/README.md) is frozen
for historical reference and migration; changing the default does not upgrade
existing deployments or declare the 2.0 protocol stable.

- **The scope is frozen.** A new contract enters the draft only together with engine evidence; corrections, simplifications and new evidence do not need that gate ([Specification Status](./SPECIFICATION.md#status)).
- **Names are stable; revisions are digests.** There is one memory package, `kip://profiles/cognitive-memory@2.0.0`, one general domain package, `kip://domains/general@1.0.0`, one standard projection policy, `kip:memory-default`, one standard strength policy, `kip:strength-half-life-30d`, and schema IDs `urn:kip:2.0:schema:*`. A draft revision is identified by its content digest; earlier draft packages are not retained.
- **Both reference engines pass the whole engine suite** — 431 cases in 26 fixtures, none pending. The [suite manifest](./conformance/engine-suite/manifest.json) records the verified engine revision.
- **No learning result is claimed.** Engine runs, bounded models and structural tests are separate evidence from measured Brain behavior, which stays `not_run` until a [Brain evaluation](./brain/BrainEvaluation.md) measures it.

What the latest revision changed, and how it was validated, is in the [revision record](./KIP-2.0-Memory-Brain-Resolution.md).

## Start here

- **Agent integration:** [Memory Interface](./KIP-2.0-Memory-Interface.md) and the [Agent memory card](./brain/MemoryInterface.md).
- **Protocol implementation:** [Specification](./SPECIFICATION.md), [syntax reference](./KIPSyntax.md), and [conformance checks](./conformance/README.md).
- **Running a Brain:** [Anda Brain](https://github.com/ldclabs/anda-brain), a memory service that serves the Memory Interface; see [Implementations](#implementations).
- **Developer tools:** [TypeScript language toolkit](./packages/kip-lang/README.md) (`@ldclabs/kip-lang`) and [VS Code extension](./packages/vscode-kip/README.md), both targeting KIP 2.0.
- **Existing v1 users:** [frozen archive](./v1/README.md), [deployment migration](./migration/KIP-2.0-Migration-from-1.x.md), and [repository path changes](./migration/Repository-Layout.md).

The archived MCP server and Skill implement v1 interfaces; native v2 integration
starts with the current Interface and wire contracts above.

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

Change never rewrites the past. Three kinds of change keep three different histories:

- **The world changed.** One new Assertion from the time of the change. [Temporal succession](./SPECIFICATION.md#254-temporal-succession) closes the actor's older value at that point, so a formerly true claim is ended rather than declared wrong, and historical queries still answer with it. Two inferences never succeed one another.
- **A claim was wrong.** A new Assertion [supersedes](./SPECIFICATION.md#142-superseded) the old one, which stays on record.
- **The Brain misrecorded it.** [Recording repair](./SPECIFICATION.md#578-recording-repair) invalidates the wrong extraction; the source bytes and everyone's stance stay as they were.

Time is stated as honestly as it is known: `asserted_at` is when a claim was made, not when it was recorded; a claim with no stated start began no later than that; and a coarse date is a [time bound](./SPECIFICATION.md#255-time-bounds), not an invented instant. A preference is an ordinary claim that changes within its kind — there is no Preference type. Where claims of one slot still conflict, the [standard memory policy](./SPECIFICATION.md#2113-the-standard-memory-policy) `kip:memory-default` resolves them the same way on every engine: context specificity first, then first-person testimony, then recency.

Evidence, provenance and schema get the same treatment: [Evidence](./SPECIFICATION.md#15-evidence) and [Activity](./SPECIFICATION.md#16-activity) are first-class elements rather than metadata bags, and schema lives in versioned, digest-pinned [packages](./SPECIFICATION.md#20-schema-packages). A Brain that meets a relation the Profile lacks drafts it into the Space's [draft vocabulary](./SPECIFICATION.md#2016-draft-vocabulary) with `DEFINE`, which only adds; promoting a draft onto an installed symbol is a Schema migration that only a Principal holding `manage_schema` performs. Retrieval composes with belief in one query through the [Search Pattern](./SPECIFICATION.md#438-search-pattern): search finds candidates, and `BELIEF` decides what is accepted.

## The proactivity layer

A memory that only answers when asked is half a memory. The other half is what the Brain does when nobody is talking to it — and it must not be a cron job. KIP 2.0 gives that half four mechanisms, none of which decides policy on the Brain's behalf:

| Mechanism | What it is |
| --- | --- |
| [`Watch`](./profiles/CognitiveMemoryProfile-2.0.md#511-watch) | Durable attention state. A declared condition under which a change — **or the absence of one** — deserves attention. Armed watches are evaluated against committed [Change Envelopes](./SPECIFICATION.md#36-change-stream): a delta watch fires on a matching committed change; a *silence* watch fires once `due_at` has passed **and** the evaluator has consumed the change stream through that deadline without a match — the clock alone proves nothing. Proactivity becomes a state differential rather than a blind schedule. **A fired Watch grants nothing**: it creates attention, never an action, and reaches the business Agent through the Memory Interface's attention recall. |
| [`action_gate`](./profiles/CognitiveMemoryProfile-2.0.md#9-activities) | An Activity class recording what the gate decided — `act`, `ask`, `defer`, or `silence` — with the inputs it weighed. Restraint is the hardest thing to justify after the fact, so deliberate silence is written down like any other outcome. |
| [`LIST DEPENDENTS`](./SPECIFICATION.md#635-list-dependents) | Bounded reverse traversal of provenance. Revise a root and the cognition compiled from it — insights, preference summaries, skills, the self-model — becomes discoverable in one operation instead of quietly stale. [§57.5](./SPECIFICATION.md#575-revision-and-derived-cognition) makes the rule explicit: a revised root **must not** auto-retract its dependents, and **must** leave them reviewable. Whether one survives is a review decision, not a protocol rule. |
| [`PURGE PAYLOAD`](./SPECIFICATION.md#606-payload-purge) | Destroy an Evidence element's observed bytes while keeping the record: its digest, class, observation time, source, and the citations that depend on it. Data minimization that costs no provenance — [corroboration and independence counting](./SPECIFICATION.md#23-epistemic-independence) keep working on the surviving digest. Distinct from element [purge](./SPECIFICATION.md#603-purge), which destroys the record itself. |

Supporting state lives in the [Cognitive Memory Profile](./profiles/CognitiveMemoryProfile-2.0.md): [`WorkingState`](./profiles/CognitiveMemoryProfile-2.0.md#512-workingstate) is the consolidated resume digest stamped with its `basis_seq`, so a Brain wakes from compiled state plus a delta rather than re-reading scrollback; computed [dependency validity](./SPECIFICATION.md#576-dependency-validity) makes a revised root visible at the next read; and `MnemonicState.utility` holds the admission bet — how useful this memory is expected to be — kept deliberately separate from `salience`, from `memory_strength`, and from epistemic `confidence`. Strength itself is computed at read time from a base, an anchor and a pinned decay policy; nothing sweeps it, and reading never reinforces it.

## The consequence channel

Everything above makes the system watch the world better. The consequence channel is how the world watches back.

[Outcome Evidence](./SPECIFICATION.md#157-outcome-evidence) records what actually happened after a decision, action, or trialed procedure — written by instrumentation (telemetry, verifiers, test harnesses, human review), **never by the actor whose action it grades**. An actor's own account is `agent_statement`, citable as context only; the separation is a conformance invariant, enforced as auditability — engine origin always records who wrote what, and Governance can restrict who may write outcomes — because an open protocol can make self-grading visible even where it cannot make it impossible.

Each outcome carries a **task family** that selects candidate consequences. Sharing the family establishes neither attribution nor baseline membership: under the optional [Validated Learning companion](./brain/KIP-2.0-Validated-Learning.md), TrialRecord explicitly freezes comparable baseline attempts and outcomes. Treatment observations link through the instrument's `outcome_observation` Activity to an attempt and the [`action_gate`](./profiles/CognitiveMemoryProfile-2.0.md#9-activities) decision that applied the exact Skill revision. Its [`DecisionRecord`](./profiles/CognitiveMemoryProfile-2.0.md#64-decisionrecord) distinguishes retrieval from actual use, and grading counts independent attempts assigned before execution. A [SkillRevision](./profiles/CognitiveMemoryProfile-2.0.md#58-skill) must name its task family before trial; a pattern that nothing could prove wrong is not procedural memory. On the channel sits the [Skill lifecycle](./profiles/CognitiveMemoryProfile-2.0.md#14-skill-lifecycle):

```text
proposed → trialed → adopted → revoked
```

Lifecycle changes commit with a validated immutable EvaluationRecord on a [`lifecycle_verdict`](./profiles/CognitiveMemoryProfile-2.0.md#9-activities) Activity and a guarded update ([Validated Learning §7](./brain/KIP-2.0-Validated-Learning.md#7-the-verdict-as-kml)). Auditors replay exact inputs against the immutable TrialRecord; a Skill's `current_trial` only selects it, and its GradingState is a computed view. Without the companion, Skills stay unproven candidates — useful, recallable, never promoted. Only `trialed → adopted` promotes through a comparative verdict, and revocation is never harder than adoption. Same-state monitoring may retain standing under authorized policy without claiming new improvement; policy withdrawal may have zero outcomes. Imported Skills enter `proposed` without local grades and remain recallable as unproven candidates. Revoked Skills must enter a new trial before adoption can recur.

## Protocol provides signals; the Brain owns policy

KIP does not define an admission threshold, an interruption policy, a salience algorithm, a consolidation schedule, or a skill compiler. It defines where those decisions put their inputs and their receipts. A protocol that hardcoded one utility function would stop being a protocol — and every deployment would fork it.

The policy layer is a separate, replaceable component:

- **[Brain 2.0](./brain/README.md)** — the reference design: **Formation** (what deserves to outlive this turn), **Recall** (what from the past should change what I do next), and **Maintenance** (the sleep-time metabolism that consolidates, compiles skills, reviews contradictions, and metabolizes memory strength).
- **[`$self` / `$system`](./SelfInstructions.md)** — the single-agent variant, a thin delta layered on the Brain policies above: a waking mind that experiences, and a sleeping mind that integrates.
- **[Experience Learning Architecture](./brain/ExperienceLearningArchitecture.md)** — the loop the Brain implements, and how to evaluate whether it actually learned anything rather than merely stored more.

The seam matters in both directions. Because policy is out of the protocol, two Brains with different admission utilities can share one Cognitive Nexus; and because the signals are in the protocol, either Brain's decisions remain auditable by the other.

## Memory should be portable

If memory is what makes an agent valuable, the natural move is to make it impossible to leave with. KIP takes the opposite position: cognition exports as a signed, inspectable [Cognitive Capsule](./SPECIFICATION.md#37-cognitive-capsule), and import is a destination-governed transaction — a capsule's signature proves origin and integrity, never truth, trust, or authority. Imported skills stay non-executable until the destination elevates them; a source's `$self` never becomes the destination's.

## Implementations

This repository defines the protocol and its tooling; it does not contain a production engine or Brain. Each implementation's own repository is the authority on what it supports — this table claims nothing beyond the evidence it links.

| Component | What it is | Evidence here |
| --- | --- | --- |
| [`anda_cognitive_nexus`](https://github.com/ldclabs/anda-db/tree/main/rs/anda_cognitive_nexus) | Rust KIP 2.0 engine (Cognitive Nexus) on AndaDB | Passes all 431 engine-suite cases ([manifest](./conformance/engine-suite/manifest.json)) |
| [`@ldclabs/kip-do`](https://github.com/ldclabs/anda-db/tree/main/ts/kip-do) | Independent TypeScript KIP 2.0 engine on SQLite Cloudflare Durable Objects | Passes all 431 engine-suite cases ([manifest](./conformance/engine-suite/manifest.json)) |
| [`anda_kip`](https://github.com/ldclabs/anda-db/tree/main/rs/anda_kip) | Rust parser, request/response types and model-facing function definitions; ships this repository's syntax card, Profile and Brain role cards for model prompts | — |
| [Anda Brain](https://github.com/ldclabs/anda-brain) | Self-hosted memory service: Formation / Recall / Maintenance agents on the Rust engine, serving the Memory Interface at `memory_basic`, with a [harness adapter](https://github.com/ldclabs/anda-brain/tree/main/anda_brain/conformance) for the Interface and reliability vectors | A [historical evidence record](./conformance/Brain-Implementation-Evidence.md) of an earlier revision; no current harness run is recorded |
| [Anda Brain Worker](https://github.com/ldclabs/anda-brain/tree/main/anda-brain-worker) | A compact Brain on `kip-do` for Cloudflare Workers, also serving `memory_basic` | — |
| [`@ldclabs/kip-lang`](./packages/kip-lang/README.md), [`vscode-kip`](./packages/vscode-kip/README.md) | This repository's TypeScript toolkit (lexer, parser, formatter, diagnostics, lowering, canonical JSON, `MemorySession`) and VS Code extension | Their own test suites; they execute no KIP |

## Documents

| Document | Description |
| --- | --- |
| [🔌 Memory Interface](./KIP-2.0-Memory-Interface.md) | Five Agent intents, processing receipts, scoped and attention recall, and composable levels ([中文](./KIP-2.0-Memory-Interface_CN.md)) |
| [📇 Agent memory card](./brain/MemoryInterface.md) | The small everyday Interface; direct KIP role cards live alongside it ([中文](./brain/MemoryInterface_CN.md)) |
| [📖 Specification 2.0](./SPECIFICATION.md) | The normative draft ([中文](./SPECIFICATION_CN.md)) |
| [🧩 Cognitive Memory Profile 2.0](./profiles/CognitiveMemoryProfile-2.0.md) | Experience, Skill, Commitment, Watch, WorkingState, and the rest ([中文](./profiles/CognitiveMemoryProfile-2.0_CN.md)) |
| [🎓 Validated Learning](./brain/KIP-2.0-Validated-Learning.md) | Optional companion: revisions, attempts, trials, evaluations and validated Skill standing ([中文](./brain/KIP-2.0-Validated-Learning_CN.md)) |
| [⚙️ Brain Runtime](./brain/KIP-2.0-Brain-Runtime.md) | Optional companion: durable attention, leases, dispatch and receiver fencing ([中文](./brain/KIP-2.0-Brain-Runtime_CN.md)) |
| [📦 Capsule Specification 2.0](./KIP-2.0-Capsule-Specification.md) | Specification §37–§41 and §95: the portable, verifiable memory artifact ([中文](./KIP-2.0-Capsule-Specification_CN.md)) |
| [🧭 Optional Profiles & Migration](./KIP-2.0-Optional-Profiles-and-Migration.md) | Specification §100, §101, §103 and Appendix I: Historical, High-Assurance, and KIP 1.x migration ([中文](./KIP-2.0-Optional-Profiles-and-Migration_CN.md)) |
| [📜 Invariant Registry](./KIP-2.0-Invariants.md) | The 49 Core and 49 Profile invariants in one list, each with the section that establishes it and the vectors that pin it ([中文](./KIP-2.0-Invariants_CN.md)) |
| [🏛 Architecture 2.0](./KIP-2.0-Architecture.md) | Design rationale behind the Specification ([中文](./KIP-2.0-Architecture_CN.md)) |
| [📐 Syntax Reference 2.0](./KIPSyntax.md) | LLM-facing KQL / KML / META card ([中文](./KIPSyntax_CN.md)) |
| [🧠 Brain 2.0](./brain/README.md) | Formation / Recall / Maintenance ([中文](./brain/README_CN.md)) |
| [📊 Brain evaluation](./brain/BrainEvaluation.md) | Separate protocol, reliability and behavioral-learning release gates ([中文](./brain/BrainEvaluation_CN.md)) |
| [🤖 `$self` / ⚙️ `$system`](./SelfInstructions.md) | Single-agent prompt pair, a delta over Brain 2.0 ([`$system`](./SystemInstructions.md)) |
| [🔤 Grammars & Schemas](./grammar/) | Normative EBNF, plus the [wire schemas](./schemas/) |
| [🧪 Conformance](./conformance/README.md) | 431 executable engine cases, 344 parent vectors, 30 cognitive, 20 Memory Interface and 17 reliability scenarios, and executable contract models |
| [🔬 Formal Verification](./formal/README.md) | Alloy, TLA+ and Python models, including world-time succession, and what they proved ([中文](./formal/README_CN.md)) |
| [🔀 Migration from 1.x](./migration/KIP-2.0-Migration-from-1.x.md) | What changes, and what legacy meaning must not be invented ([中文](./migration/KIP-2.0-Migration-from-1.x_CN.md)) |
| [📋 Revision records](./KIP-2.0-Memory-Brain-Resolution.md) | The latest revision's checklist and validation; earlier: [reliability](./KIP-2.0-Reliability-Resolution.md), [review](./KIP-2.0-Review-Resolution.md) |
| [🗂 Design Notes](./design/) | Ten pre-consolidation rationale documents, frozen 2026-09-02 |

Chinese `*_CN.md` mirrors track the English sources. The English sources are normative; a mirror is not an alternative semantic contract.

Project terminology lives in [CONTEXT.md](./CONTEXT.md); essays remain in [post/](./post/).

## Repository layout

| Path | Contents |
| --- | --- |
| Root `*.md` | The Specification, companions, invariant registry, architecture and syntax card |
| [`grammar/`](./grammar/), [`schemas/`](./schemas/), [`profiles/`](./profiles/) | Normative EBNF, wire and artifact schemas, the memory package, the general domain package and the standard policies |
| [`brain/`](./brain/) | Reference Brain policies, role cards, optional companions and the evaluation protocol |
| [`conformance/`](./conformance/) | Engine suite, vectors, fixtures, reference models, adapter runners and digest tooling |
| [`formal/`](./formal/) | Bounded Alloy, TLA+ and Python models with their reports |
| [`packages/`](./packages/) | `@ldclabs/kip-lang` and the VS Code extension (the pnpm workspace) |
| [`migration/`](./migration/), [`post/`](./post/), [`diagrams/`](./diagrams/) | Migration guidance, essays and visuals; not normative |
| [`design/`](./design/), [`v1/`](./v1/) | Frozen pre-consolidation notes and the frozen KIP 1.x archive |

The usual checks, from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @ldclabs/kip-lang test     # language, examples, schemas and contract tests
node conformance/update-digests.mjs      # schema locks and artifact digests
bash formal/run.sh                       # bounded models (exit 3 means prerequisites were missing)
```

[AGENTS.md](./AGENTS.md) records the contribution rules, and [conformance/README.md](./conformance/README.md) explains how to run the suites against an engine or a Brain.

## Governing principle

> **KIP 2.0 is a protocol for durable cognition: new information may change what a Brain does next without requiring the Brain to falsify what happened before.**

## License

Copyright © 2026 [LDC Labs](https://github.com/ldclabs). Licensed under the [MIT License](./LICENSE).
