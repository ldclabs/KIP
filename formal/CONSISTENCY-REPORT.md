# Consistency Revision Verification — 2026-09-06

**[English](./CONSISTENCY-REPORT.md) | [中文](./CONSISTENCY-REPORT_CN.md)**

Initial target: KIP 2.0 draft, Cognitive Memory package 2.1.0 and language toolkit
changes resolving the twelve design-review items, committed as `6437e96`. Follow-up
review results are recorded separately below. This report replaces no historical
result: [REPORT.md](./REPORT.md) retains the previous draft's run.

## Initial revision results (6437e96)

| Check | Result | Scope |
| --- | --- | --- |
| English language/toolkit and contract tests | **186 passed, 0 failed; 1 mirror-comparison test skipped** | 187 registered tests; KIP_DOC_LANG=en excludes Chinese mirror reads |
| Standalone canonical/consistency suite | **24/24 passed** | New schemas, fixtures, oracle cases, adapter result classification and recipes |
| Current artifact digests | **5/5 verified** | Profile 2.1.0, two domain fixtures, deterministic policy, golden snapshot Capsule |
| Governance model | **10,939,388 decisions checked; PASS** | Bounded decision procedure, not the full runtime |
| Grammar consistency | **PASS** | 77 KQL, 102 KML, 107 META rules; 60 shared nonterminals, two declared differences |
| Consequence model | **27,931 observation sequences; PASS** | Independent attempts, revisions, re-trial, late outcomes, correction and retained evaluation replay |
| Consequence fault modes | **All seven detected counterexamples** | family join, absent trial basis, imported/self-grading, observation fan-out, reused trial, inherited standing |
| Watch model | **PASS including intended fault witnesses** | Two workers, fixed arm generation, replay and deadline coverage; re-arm/fencing checked in contract oracles |
| Purge/hold model | **PASS including intended fault witnesses** | Reference policies, holds, payload versus record erasure |
| VS Code consumer type-check | **PASS** | Consumer still type-checks against the language package |
| Diff whitespace check | **PASS** | No patch-format whitespace errors |
| Original Profile 2.0.0 | **Byte-for-byte unchanged** | Existing exact package identity preserved |
| v1 specification and Chinese mirrors | **Unchanged** | Deliberately outside this revision's edits |
| Alloy and TLA+/TLC | **Not run** | Required JARs were not configured; formal runner returns 3, not a full PASS |
| External Nexus adapters | **Not run** | No claim about deployed Rust/Cloudflare behavior |
| Empirical Brain learning | **Not run** | Template has no measured score or passed learning gate |

## What the revised models establish

The consequence checker is now bounded input enumeration plus explicit transition
scenarios. It no longer presents one decision's repeated observations as independent
learning samples. It preserves immutable Trial/Evaluation values while current
revision/trial pointers change. Positive witnesses ensure adoption and demotion
remain possible, in addition to rejecting the reviewed shortcuts.

The statistical comparison oracle uses declared fixed strata and an abstracted
uncertainty/comparability gate. It is a test fixture, not a recommended production
estimator or proof of causal learning. Protected evaluation-policy authorization is
checked separately by the contract oracle. Whole-engine scheduling, complete
concurrent interleavings and real-world instrumentation integrity are not proved by
these functions.

The adapter runner validates observations against independently specified expectations,
checks durable postconditions separately, distinguishes models from engines, requires
raw execution evidence for engine exercises, fails harness errors and stops on timeout.
It handles the 25 memory vectors only and leaves profiles_claimed empty. A full Profile
claim still requires all applicable parent-suite and companion vectors on that engine.

All 43 Core and 46 Profile invariants now map to portable vectors. The catalogue is
356 distinct vector IDs (331 parent + 25 companion). Mapping to a vector is an
acceptance obligation, not a report that every external implementation ran it.

## Reproduce

```sh
pnpm --filter @ldclabs/kip-lang build
KIP_DOC_LANG=en pnpm --filter @ldclabs/kip-lang test
node conformance/update-digests.mjs
bash formal/run.sh
pnpm --filter vscode-kip lint
```

Install the pinned workspace dependencies first. Configure ALLOY_JAR/TLA_JAR and a
working JVM to include the unchanged Java-backed suites. A missing prerequisite is
reported explicitly; a failing available suite returns exit 1. The Brain learning
workflow is [BrainEvaluation.md](../brain/BrainEvaluation.md).

## Commit-review follow-up — 2026-09-06

The [five follow-up fixes](../KIP-2.0-Review-Resolution.md#follow-up-review-of-commit-6437e96)
correct schema dependency closure, ungraded recall, promotion/monitoring state rules
and obsolete package/example constraints. These results apply to the follow-up
working tree, not retroactively to commit `6437e96`.

| Check rerun | Actual result |
| --- | --- |
| Complete English language/toolkit suite | **191 passed, 0 failed; 1 mirror-comparison test skipped** out of 192 registered tests, with KIP_DOC_LANG=en |
| Canonical/consistency subset | **29/29 passed**; includes isolated manifest-only schema compilation, transitive/cyclic schema references, recall standing and all 16 lifecycle state pairs |
| Validation-schema lock and artifact digests | **6 schema pins complete and verified; 5/5 artifact digests verified**, including the updated golden Capsule dependency |
| Consequence model and existing self-graded variant | **27,931 observation sequences each; PASS**; all four starting states checked, with positive witnesses for sparse monitoring and rejection of direct adoption |
| Consequence fault modes | **9/9 produced expected counterexamples**; includes direct promotion and treating monitoring as a new promotion |
| Diff whitespace and runner syntax | **PASS** |
| Preserved artifacts | **Original Profile 2.0.0, v1 specification, Chinese mirrors and frozen design notes unchanged** |

Unchanged Governance, grammar, Watch, purge and VS Code checks above are the initial
revision's results and were not rerun for this follow-up. Alloy/TLC, external Nexus
adapters and empirical Brain learning remain outside these executed checks. Schema
acceptance of a same-state evaluation does not itself validate its policy or prior
adoption evidence; engines must check both before retaining standing.
