# KIP 2.0 Formal Verification

Suite 10 also runs Memory Interface schema and scenario-model checks and the engine-suite shape tests for processing
barriers, out-of-order completion, idempotent intake, task scope and honest coverage.
These are executable contract tests, not an exhaustive proof or a production Brain
result. Real binding scenarios run through the optional interface adapter suite.

**[English](./README.md) | [中文](./README_CN.md)**

Machine-checked models of the KIP 2.0 specification. Results, findings,
and scope limits are in **[REPORT.md](./REPORT.md)**.

| Suite | Tool | Target |
| --- | --- | --- |
| [`alloy/kip-core.als`](./alloy/kip-core.als) | Alloy 6 (temporal) | Core data model: Proposition/Assertion/Evidence lifecycle, Concept merge, Same-Space closure, epistemic root conservation (§23), origin-bound authority (§31.5) |
| [`tla/KipTransactions.tla`](./tla/KipTransactions.tla) | TLA+ / TLC | Transactions: atomic commit, `EXPECT VERSION`, idempotency (incl. `no_effect` interaction), `space_seq`/Commit Record (§32–§36) |
| [`governance/check_governance.py`](./governance/check_governance.py) | Python (exhaustive) | §30 policy evaluation: deny-overrides, invariant supremacy, order-independence |
| [`grammar/check_ebnf.py`](./grammar/check_ebnf.py) | Python (static) | KQL/KML/META EBNF: well-formedness, reachability, cross-grammar drift |
| [`lifecycle/check_lifecycle.py`](./lifecycle/check_lifecycle.py) | Python (bounded input enumeration and transition scenarios) | Independent attempt aggregation, immutable trial/evaluation replay, revision reset, re-trial, legal promotion, same-state monitoring, late outcomes, correction and origin exclusions |
| [`watch/check_watch.py`](./watch/check_watch.py) | Python (explicit-state, exhaustive) | Watch firing under two concurrent evaluators with redelivery: exactly-once firing, match-only, silence soundness (Profile §5.11; Spec §34, §35.1, §36.3) |
| [`purge/check_purge.py`](./purge/check_purge.py) | Python (explicit-state, exhaustive) | Erasure: reference policies, legal hold before policy and through cascades, digest stubs, payload purge (Spec §19.1, §60.3, §60.6, Invariant 34) |
| [`governance/check_draft_vocabulary.py`](./governance/check_draft_vocabulary.py) | Python (explicit-state, exhaustive) | Draft vocabulary (Spec §20.16, §29, §30.5): `propose_schema` confers no Schema authority, `DEFINE` only adds and never shadows, no authority claim reaches a draft symbol, the capability gates both `DEFINE` and the Grant, promotion is once, same-kind and `manage_schema`-only; five bug-injection modes |
| [`temporal/check_temporal.py`](./temporal/check_temporal.py) | Python (exhaustive pairs, seeded triples) | World time: temporal succession, the missing-start default, time bounds and `kip:memory-default` precedence (Spec §21.13, §25.2–§25.5): narrowing, order independence, one-write change, actor isolation, no decision from indeterminate support, late history, agreement, no invented past, inferences on no line, structural floor, observation never outranked by rule 2, rule order; seven bug-injection modes |

The 2026-09-06 consistency revision is reported separately in [CONSISTENCY-REPORT.md](./CONSISTENCY-REPORT.md); its contracts now live in the Specification and the `brain/` companions. Its Node contract suite adds generation/fencing, basis/context, numeric and typed-artifact checks; build packages/kip-lang after installing workspace dependencies before running it. These oracles are not Nexus engine results.

Run everything (expected results asserted, including intended
counterexamples in the bug-injection configs). The Python suites need no
Java; without the jars the Java suites are skipped and the run exits 3:

```bash
export ALLOY_JAR=/path/to/org.alloytools.alloy.dist.jar   # Alloy >= 6.2
export TLA_JAR=/path/to/tla2tools.jar
./run.sh
```

These artifacts verify the **protocol layer** within bounded scopes. They
do not — and cannot — verify cognitive-layer claims (memory influence,
learning); those are Brain-level empirical benchmarks by design
(Architecture §21.3).

## Historical full run (previous draft)

2026-09-02, all seven suites, `run.sh` with `ALLOY_JAR` / `TLA_JAR` set (Java 17, Alloy 6.2.0, TLC 2.19): **all pass**, 4 min 33 s wall clock; every bug-injection mode produced its counterexample. Details in [REPORT.md §12](./REPORT.md). On a machine where `java` is not on `PATH`, point `JAVA=` at the JRE binary before running.
