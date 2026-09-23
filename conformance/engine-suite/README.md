# KIP 2.0 engine suite

The executable conformance cases for KIP 2.0 engines: plain data, one KIP command
per case, each with one expected result or one expected error code. A claim of a
conformance level (Specification §89) rests on running this suite against the
engine itself, together with the applicable vectors; a model or oracle run is
reported as a model.

```sh
node conformance/run.mjs --suite engine --list
node conformance/run.mjs --suite engine --adapter /absolute/path/to/adapter.mjs
```

## Provenance

The cases were written for, and verified by, both reference engines —
`anda_cognitive_nexus` (Rust) and `kip-do` (Cloudflare Durable Objects) — in
[anda-db](https://github.com/ldclabs/anda-db/tree/main/fixtures/kip-conformance-2.0).
They moved here so that the protocol repository owns its executable suite.
`manifest.json` records the source commit and every change made on import: the
package refs follow the single draft package `cognitive-memory@2.0.0`, one facet
listing follows the Profile's removal of `TrialState` and `DerivationState`, the
fixtures' preference options are typed `Option` through an inline package since
the Profile has no Preference type, and one boundary case expects `insufficient`
where an expired value used to be reported `rejected` (§14.3, §21.5). The engines
verified the previous draft; they have not yet run these revisions.

## Case shape

```jsonc
{
  "name": "core-truth-neutrality",
  "description": "why these cases exist",
  "packages": [ /* extra Schema Package artifacts, installed and activated */ ],
  "setup":    [ "MUTATE { ... }" ],
  "cases": [
    {
      "name": "...",
      "command": "FIND(?x) WHERE { ... }",
      "params":  {"p": "..."},          // optional request parameters
      "envelope": {},                   // optional extra request members
      "expect":  {"result": [...]},     // or {"error": "SchemaSymbolNotFound"}
      "ordered": false,                 // top-level array order is contractual
      "vectors": ["CORE-001"]           // parent-suite vectors this case pins
    }
  ]
}
```

The Cognitive Memory Profile is installed and activated for every fixture;
installing a fixture's own packages is a host decision, never a command. Cases
in one fixture share one Space and run in order.

## Adapter

```js
export default {
  async describe() { /* {kind: 'engine'|'model', name, version, capabilities} */ },
  async resetSpace({ name, packages }) { /* fresh isolated Space, Profile + packages active */ },
  async execute(request) { /* send the KIP request; return the raw response envelope */ },
  elementIdTag(value) { /* optional: 'C' for a Concept id, ..., or null when not an id */ }
}
```

The runner sends each command as a single-operation request and flattens the
answer: a top-level error, else the first result's error, else its result (a
KML receipt flattens to its result, usually `null`). An `UnsupportedCapability`
the case did not expect is reported `SKIP_UNSUPPORTED`, never counted as a pass.

## Normalization

Element ids are engine-assigned, so they are rewritten to `C:<1>`, `P:<2>`, …
in the order a **sorted-key** walk of the answer first reaches them — one
counter across every kind, so inside a change entry the element's own `id` is
numbered before anything under `refs`. Wall-clock timestamps, transaction ids,
content digests, authorization views and search scores are dropped. Everything
else is compared exactly; when `ordered` is false a top-level array is compared
as a multiset.

## Coverage

`vectors` names the parent-suite vectors a case pins, and only where someone has
read both and decided they test the same thing. Parent vectors with no case here
are specified in prose (`KIP-2.0-Conformance-Tests.md`) and remain obligations;
a runner reports them as not executed rather than passed.

## Pending fixtures

New contracts enter the draft together with a case here (Specification Status).
During the draft a fixture may carry `"status": "pending_engine"` and be listed
under `pending_engine` in `manifest.json`: it was written from the Specification
and the oracle cases, and no engine has verified it yet. The runner executes it
like any other fixture and names it in the report's `kip.org/evidence.pending_engine`,
so an engine's pass is new evidence rather than a re-run. The release requires
every fixture verified; `world-time.json` is the current pending fixture.
