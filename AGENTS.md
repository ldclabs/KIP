# AGENTS.md

Guidance for coding agents working in this repository. These instructions apply
to the whole repository unless a more specific `AGENTS.md` exists below it.
Explicit user instructions take precedence over this guidance.

## Project scope

KIP is the Knowledge Interaction Protocol: a cognitive state protocol for Agent
memory. The repository contains the KIP 2.0 normative draft, reference Brain
policies, grammars, schemas, conformance artifacts, bounded models, a TypeScript
language toolkit and a VS Code extension.

This repository does not implement a production Cognitive Nexus or the complete
Brain service. Those live in the sibling projects
[anda-db](https://github.com/ldclabs/anda-db) and
[anda-brain](https://github.com/ldclabs/anda-brain). Use their actual code when a
task needs implementation evidence; do not infer their capabilities from this
repository's specification or model tests. Change downstream repositories only
when they are included in the requested scope.

## Sources of truth and layout

- `SPECIFICATION.md`: normative Core and runtime semantics. Read its Status
  section for the current contract revision and normative companion list.
- `KIP-2.0-Cognitive-Consistency.md`: belief, dependency, identity, learning,
  durable execution and memory reliability contracts.
- `KIP-2.0-Memory-Interface.md`: optional five-intent Agent-to-Brain binding.
- `KIP-2.0-Capsule-Specification.md`,
  `KIP-2.0-Optional-Profiles-and-Migration.md` and `KIP-2.0-Invariants.md`:
  additional normative contracts and the stable invariant registry.
- `grammar/`, `schemas/`, `profiles/`: normative syntax, wire/artifact shapes,
  versioned memory packages and capability bundles. The current memory package
  is 2.2.0; protocol, package and tooling versions are independent.
- `KIPSyntax.md`: informative model-facing syntax card. Its executable examples
  must agree with the grammar and toolkit.
- `brain/`, `SelfInstructions.md`, `SystemInstructions.md`: reference cognitive
  policies and role cards. Algorithms here do not override protocol requirements.
- `packages/kip-lang/`: lexer, parser, syntax AST, formatter, diagnostics,
  executable AST lowering, canonical JSON and host helpers. It does not execute
  KIP or supply an authorization boundary.
- `packages/vscode-kip/`: editor integration consuming `kip-lang`.
- `conformance/`: fixtures, portable vectors, reference models, adapter runner
  and digest tooling. See `conformance/README.md` before changing these.
- `formal/`: bounded verification models and reports with explicit proof limits.
- `KIP-2.0-Architecture.md`: informative rationale; normative contracts take
  precedence. Resolution/evidence reports describe their recorded revisions,
  not an evergreen certification of current code.
- `design/`: frozen pre-consolidation rationale. Do not maintain it as a second
  specification. New rationale belongs in the current specification/architecture.
- `v1/`: frozen historical protocol and integrations, outside the active pnpm
  workspace. `v2/` is a navigation stub; current v2 sources are at the root.
- `migration/`, `post/`, `diagrams/`: migration guidance, essays and supporting
  visuals. They do not supersede normative sources.

## Protocol invariants to preserve

- Proposition existence does not establish belief. Use final BELIEF status,
  including slot conflicts and dependency validity; missing evidence is not false.
- Meaning, epistemic confidence, mnemonic accessibility, trust and authority
  remain distinct. Recall is read-only and never implicitly reinforces memory.
- Engine-authenticated origin is protected. Attribution is not representation;
  cognitive content cannot grant permissions or upgrade its own authority.
- Actor correction, world change and recording/extraction repair have different
  histories and permissions. Preserve immutable source and assertion payloads.
- Dependency checks include relevant selection/absence dependencies, current
  authorization, temporal boundaries and lifecycle changes, not just record IDs.
- Task/context scope follows memory products without splitting canonical
  Proposition identity or becoming an ownership/authorization shortcut.
- Skill behavior and standing bind immutable revisions. Independent attempts,
  authorized observers and replayable evaluations govern learning claims.
  Applicability assessment alone never promotes or authorizes a procedure.
- A committed intake is not completed processing. Preserve causal predecessors,
  outstanding receipts, idempotency and explicit outcome-unknown recovery.
- A Watch firing or native dispatch admission is not an exactly-once external
  effect guarantee. Distinguish admission from receiver-enforced fencing.
- Recall coverage is relative to a declared authorized plan. Approximate search
  is not semantic exhaustiveness; hidden records must not affect visible counts,
  ranking or completeness diagnostics.
- Payload purge is not semantic forgetting. Completed erasure requires verified
  coverage of all in-scope controlled copies and current hold/authority checks.
- Protocol timestamps use strict UTC milliseconds (`YYYY-MM-DDTHH:mm:ss.SSSZ`)
  with real calendar validation. Do not silently normalize protocol inputs.

Consult the invariant registry and companions for complete requirements rather
than treating this summary as a substitute specification.

## Editing contracts and artifacts

Keep related surfaces consistent. A language change may affect EBNF, parsing,
semantic validation, ASTs, lowering, formatting, editor support, syntax examples
and conformance cases. A state-contract change may affect prose, shared schemas,
the Profile package, fixtures, models, portable vectors and downstream guidance.
Test observable behavior and meaningful failure cases, not only field presence.

Preserve exact versioned artifact identities. The retained memory packages
`profiles/cognitive-memory-2.0.0.schema.json` and
`profiles/cognitive-memory-2.1.0.schema.json`, and the six
`schemas/legacy-2.1-*.json` resources, must remain byte-identical. Do not republish
different content under an existing immutable identity. Use a new package/schema
identity for an incompatible revision and document its implementation boundary.

Reuse shared Timestamp, ProjectionBasis and ArtifactPin definitions rather than
copying them. Schema locks must cover the complete transitive reference closure,
using actual schema IDs and verified digests; cached or network-fetched resources
must not silently fill missing pins.

After intentional current package/schema edits, build the toolkit, regenerate
digests, then run the read-only check:

```sh
pnpm --filter @ldclabs/kip-lang build
node conformance/update-digests.mjs --write
node conformance/update-digests.mjs
```

Do not regenerate digests merely to hide an unexplained integrity failure. Do not
hand-edit `dist/`, packaged VSIX files or other build output.

## Documentation and translations

English normative sources define the protocol; Chinese `*_CN.md` mirrors should
track maintained documentation when the task includes bilingual changes. Preserve
section numbering, links, identifiers and executable example semantics across
languages. Never use a translation to introduce different protocol behavior.

An explicit English-only request overrides mirror synchronization for that task;
report that scope and use `KIP_DOC_LANG=en` for tests. Do not perpetuate a previous
task's temporary mirror exclusion as a permanent repository rule. Frozen design
notes and v1 are not targets for routine translation or semantic updates.

## Validation commands

Use the pnpm workspace and existing lockfile. Install dependencies with
`pnpm install --frozen-lockfile` when needed. Run checks appropriate to the change:

```sh
# Language, examples, schemas and executable contract tests; pretest builds TS.
pnpm --filter @ldclabs/kip-lang test

# Only for an explicitly English-only task; skips mirror comparison.
KIP_DOC_LANG=en pnpm --filter @ldclabs/kip-lang test

# Current schema lock and artifact integrity.
node conformance/update-digests.mjs

# Bounded formal models and contract checks.
bash formal/run.sh

# Editor consumer checks after toolkit/API or extension changes.
pnpm --filter @ldclabs/kip-lang build
pnpm --filter vscode-kip lint
pnpm --filter vscode-kip test
pnpm --filter vscode-kip build

# Patch formatting, including staged new files before committing.
git diff --check
git diff --cached --check
```

Do not run both language variants unnecessarily. Documentation-only guidance
changes normally need content/link review and whitespace checks, not the full
runtime suite. Behavioral changes require focused regression coverage and the
affected existing checks.

The formal runner exits **0** only when all suites ran and passed, **1** on
failure, and **3** when available checks passed but prerequisites were missing.
Alloy/TLC need configured JARs and a working JVM; see `formal/README.md`. Report
skips explicitly and never describe exit 3 as a complete formal-verification pass.

Portable adapter suites are selected independently:

```sh
node conformance/run.mjs --suite memory --list
node conformance/run.mjs --suite interface --list
node conformance/run.mjs --suite reliability --list
node conformance/run.mjs --suite reliability --adapter /absolute/path/to/adapter.mjs
```

A real engine adapter must drive actual engine paths, retain raw responses and
inspect durable postconditions. It must not call the reference oracles while
claiming engine evidence. Partial suites cannot certify a whole Profile. Syntax
tests, bounded models, engine reliability and measured behavioral learning are
separate claims; preserve `not_run` reports until real measurements exist. Reuse
the Brain/MIB workflow described in `brain/BrainEvaluation.md` for learning.

## Working tree and commits

Inspect the branch and working tree first. Preserve unrelated user changes and
stage only the task's files. Follow the user's requested branch; do not assume
every task should commit directly to `main`. Do not rewrite existing commits,
publish packages, create release tags or push unless included in the request.

When committing Codex-authored changes, append:

```text
Co-authored-by: Codex <noreply@openai.com>
```

Report what changed, the checks actually executed, material skips and any
downstream work that remains. A specification commit does not deploy a feature.
