# Running the KIP 2.0 checks

The parent suite has 331 vectors; the cognitive consistency companion adds 25.
The optional Memory Interface adds 12 binding scenarios, separately selectable.
The repository supplies language tests, deterministic contract oracles, finite
models, typed JSON schemas, a golden snapshot Capsule and a memory-subset adapter
runner. These are different evidence sources; none alone is a full engine result.

## Local contract checks

```sh
pnpm install --frozen-lockfile
pnpm --filter @ldclabs/kip-lang build
KIP_DOC_LANG=en pnpm --filter @ldclabs/kip-lang test
node conformance/update-digests.mjs
bash formal/run.sh
```

KIP_DOC_LANG=en excludes Chinese mirror reads/comparison when updating English
sources independently. The default language suite still validates both mirrors.
The formal runner returns 3 if prerequisite-dependent suites were skipped, 1 on
any failure, and 0 only when every suite ran and passed. Alloy/TLC need the JARs
and JVM described in `../formal/README.md`; Node checks require the workspace build.

When intentionally editing a package/schema, regenerate artifact digests with
`node conformance/update-digests.mjs --write`, then run the read-only check.
It uses the same canonicalizer as consumers, and the Profile pins validation-schema
digests over the complete transitive reference closure, including Change Envelopes
used by Capsules. The read-only check verifies that lock and Capsule package pins
as well as each artifact's own digest. The contract suite compiles the schemas in
an isolated validator loaded only from the manifest pins. Never regenerate a digest
just to conceal a failed integrity check.

## Engine adapter boundary

```sh
node conformance/run.mjs --list
node conformance/run.mjs --adapter /absolute/path/to/adapter.mjs
node conformance/run.mjs --suite interface --list
node conformance/run.mjs --suite interface --adapter /absolute/path/to/adapter.mjs
```

An adapter exports a default object:

```js
export default {
  async describe() { /* {kind: 'engine'|'model', name, version, capabilities: []} */ },
  async seed(fixture) { /* isolated Space; reset and install named fixture/packages */ },
  async harness(action, args) {
    // exercise_memory_scenario with args.id, as specified by that MEM vector.
    // Drive the actual engine, including barrier/fault hooks where required.
    // Return {observed: normalized wire values, raw_responses: actual responses/receipts}.
  },
  async inspect(vectorId) { /* independent durable-state inspection, normalized fields */ }
}
```

`vectors/memory/*.json` fixes the expected observations and postconditions;
`KIP-2.0-Cognitive-Tests.md` specifies each scenario. Scenario adapters translate
these tests into their engine's KQL/KML and protected control binding. Use exact
Schema refs: the test domain and standard memory package share some local names.
Do not implement an engine adapter by calling `reference/contracts.mjs`; that
would test a model while claiming an engine. Engine exercises must retain raw
responses and receipts. Adapters also validate each KIP response against the wire
schema and each projected/artifact result against its specific companion schema.

This runner deliberately handles the shipped memory harness vectors only; unknown
step/assertion kinds fail as HARNESS_ERROR. It does not silently pass unimplemented
parent-suite operations. A timeout stops the suite because a mutation may still be
in flight. Reconcile/reset the isolated fixture before another run; no automatic
retry of an uncertain write occurs. Optional unadvertised capabilities are skipped;
a missing required one fails. A suite with no passing executed tests cannot PASS.

Reports keep profiles_claimed empty and state partial-suite coverage. Full Profile
certification requires all applicable parent and companion vectors on actual engines,
including concurrency and failure injection, then cross-engine artifact exchange.
Behavioral learning requires the separate BrainEvaluation workflow.

## Memory Interface binding

`KIP-2.0-Memory-Interface-Tests.md` and `vectors/interface/` exercise the five intents
through `exercise_memory_interface_scenario`. A binding Adapter captures real source
handles, invokes the Brain's actual Interface, and validates requests/responses against
`schemas/kip-memory.schema.json`. Retain source/progress/KIP receipts and independent
state inspection. Scenarios become required when memory_interface is advertised.
Basic memory must work without pretending to implement learning or durable dispatch.

`reference/memory-interface.mjs` is a small executable contract model for processing
barriers, restart/idempotency, scope and coverage. Its tests are model evidence only;
they do not implement a production Brain, run an LLM or measure tokenizer/latency
performance. The existing runner supports both suites and keeps their claims partial.
