# KIP 2.0 Formal Verification

**[English](./README.md) | [中文](./README_CN.md)**

Machine-checked models of the KIP 2.0 specification. Results, findings,
and scope limits are in **[REPORT.md](./REPORT.md)**.

| Suite | Tool | Target |
| --- | --- | --- |
| [`alloy/kip-core.als`](./alloy/kip-core.als) | Alloy 6 (temporal) | Core data model: Proposition/Assertion/Evidence lifecycle, Concept merge, Same-Space closure, epistemic root conservation (§23), origin-bound authority (§31.5) |
| [`tla/KipTransactions.tla`](./tla/KipTransactions.tla) | TLA+ / TLC | Transactions: atomic commit, `EXPECT VERSION`, idempotency (incl. `no_effect` interaction), `space_seq`/Commit Record (§32–§36) |
| [`governance/check_governance.py`](./governance/check_governance.py) | Python (exhaustive) | §30 policy evaluation: deny-overrides, invariant supremacy, order-independence |
| [`grammar/check_ebnf.py`](./grammar/check_ebnf.py) | Python (static) | KQL/KML/META EBNF: well-formedness, reachability, cross-grammar drift |
| [`lifecycle/check_lifecycle.py`](./lifecycle/check_lifecycle.py) | Python (explicit-state, exhaustive) | Consequence channel and Skill lifecycle: attribution by decision link vs. task family, TrialState before counting, verdict-only transitions, recomputability, import reset, self-grading visibility (Spec §15.7, §29.8, §41.6; Profile §6.2–§6.6, §14, §21) |
| [`watch/check_watch.py`](./watch/check_watch.py) | Python (explicit-state, exhaustive) | Watch firing under two concurrent evaluators with redelivery: exactly-once firing, match-only, silence soundness (Profile §5.11; Spec §34, §35.1, §36.3) |
| [`purge/check_purge.py`](./purge/check_purge.py) | Python (explicit-state, exhaustive) | Erasure: reference policies, legal hold before policy and through cascades, digest stubs, payload purge (Spec §19.1, §60.3, §60.6, Invariant 34) |

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

## Last full run

2026-09-02, all seven suites, `run.sh` with `ALLOY_JAR` / `TLA_JAR` set (Java 17, Alloy 6.2.0, TLC 2.19): **all pass**, 4 min 33 s wall clock; every bug-injection mode produced its counterexample. Details in [REPORT.md §12](./REPORT.md). On a machine where `java` is not on `PATH`, point `JAVA=` at the JRE binary before running.
