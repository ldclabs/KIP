# Running the KIP 2.0 checks

Four kinds of evidence live here, and none stands in for another:

| Evidence | What it is | Where |
| --- | --- | --- |
| Engine suite | 431 cases in 26 fixtures; the 423 in the 25 verified fixtures passed on both reference engines at anda-db `e70e275`, and `ingest-batch.json` (8 cases) is pending | `engine-suite/`, `--suite engine` |
| Vectors | 344 parent-suite vectors in prose, 30 cognitive vectors, 20 Memory Interface scenarios and 17 reliability scenarios; the last three sets ship as JSON harness vectors | `KIP-2.0-*-Tests.md`, `vectors/` |
| Contract oracles and models | Small executable models of projection, succession, time bounds, dependency validity, learning, processing barriers and attention; bounded formal models | `reference/`, `vectors/cognitive-contracts.json`, `../formal/` |
| Behavioral evaluation | Held-out, budgeted Brain experiments | `../brain/BrainEvaluation.md` (report status `not_run` until measured) |

A conformance level (Specification §89) is claimed on engine evidence only: the engine suite and the applicable vectors run against the engine itself. Models and oracles are reported as models.

## Local contract checks

```sh
pnpm install --frozen-lockfile
pnpm --filter @ldclabs/kip-lang build
KIP_DOC_LANG=en pnpm --filter @ldclabs/kip-lang test
node conformance/update-digests.mjs
bash formal/run.sh
```

`KIP_DOC_LANG=en` excludes Chinese mirror reads and comparison when English sources are updated independently; the default language suite validates both. The formal runner returns 3 if prerequisite-dependent suites were skipped, 1 on any failure, and 0 only when every suite ran and passed. Alloy/TLC need the JARs and JVM described in `../formal/README.md`; Node checks require the workspace build.

When intentionally editing a package, schema or policy artifact, regenerate digests with `node conformance/update-digests.mjs --write`, then run the read-only check. It uses the same canonicalizer as consumers; the Profile pins validation-schema digests over the complete transitive reference closure, and dependent packages and Capsules pin the package digest. Never regenerate a digest to conceal a failed integrity check.

## Artifact identities

There is one draft memory package, `kip://profiles/cognitive-memory@2.0.0`, one general domain package, `kip://domains/general@1.0.0`, one standard projection policy, `kip:memory-default`, and one standard strength policy, `kip:strength-half-life-30d`. Schema IDs are `urn:kip:2.0:schema:*`. During the draft a revision is identified by its content digest, not by a new version number; earlier draft packages are not retained (Specification Status). Validators load the package's complete digest-pinned closure and refuse a substituted resource (REL-015).

## Engine suite

```sh
node conformance/run.mjs --suite engine --list
node conformance/run.mjs --suite engine --adapter /absolute/path/to/adapter.mjs
```

The adapter resets an isolated Space per fixture, executes single-operation KIP requests and returns raw response envelopes. The runner flattens and normalizes answers exactly as both reference engines' harnesses do; see [engine-suite/README.md](engine-suite/README.md). An unexpected `UnsupportedCapability` is reported as `SKIP_UNSUPPORTED`, never as a pass, and a lost response stops the run because the Space is then uncertain.

## Harness vectors

```sh
node conformance/run.mjs --suite memory --list
node conformance/run.mjs --suite interface --adapter /absolute/path/to/adapter.mjs
node conformance/run.mjs --suite reliability --adapter /absolute/path/to/adapter.mjs
```

A harness adapter exports a default object:

```js
export default {
  async describe() { /* {kind: 'engine'|'model', name, version, capabilities: []} */ },
  async seed(fixture) { /* isolated Space; reset and install named fixture/packages */ },
  async harness(action, args) {
    // exercise_memory_scenario / exercise_memory_interface_scenario /
    // exercise_memory_reliability_scenario with args.id, as the vector specifies.
    // Drive the actual engine, including barrier/fault hooks where required.
    // Return {observed: normalized wire values, raw_responses: actual responses/receipts}.
  },
  async inspect(vectorId) { /* independent durable-state inspection, normalized fields */ }
}
```

Each vector fixes the expected observations and durable postconditions; its Markdown companion specifies the scenario. Use exact Schema refs: the test domain and the standard memory package share some local names. Do not implement an engine adapter by calling `reference/*.mjs`; that tests a model while claiming an engine. Engine exercises retain raw responses and receipts, and validate each KIP response against the wire schema and each projected or artifact result against its companion schema.

The runner executes the shipped harness vectors only; an unknown step or assertion kind fails as `HARNESS_ERROR`. A timeout stops the suite because a mutation may still be in flight. Optional unadvertised capabilities are skipped; a missing required one fails. A suite with no passing executed tests cannot PASS. Reports keep `profiles_claimed` empty and state partial coverage.

## Memory Interface binding

`KIP-2.0-Memory-Interface-Tests.md` and `vectors/interface/` exercise the five intents through `exercise_memory_interface_scenario`: processing barriers, restart and idempotency, scope, coverage, and the positive memory scenarios MIF-013–020 (a new fact is recallable, a correction changes the answer, a world change answers old and new times, a preference changes within its kind, a misrecording is repaired without an actor withdrawal, an unasked constraint surfaces, a due Commitment reaches attention recall, unknown is not no). A binding adapter captures real source handles, invokes the Brain's actual Interface and validates requests and responses against `schemas/kip-memory.schema.json`. `reference/memory-interface.mjs` is a small executable model of barriers, restart, scope, coverage, revision routing and attention; its tests are model evidence only. See [Anda Brain implementation evidence](Brain-Implementation-Evidence.md) for the recorded library run and its limits.
