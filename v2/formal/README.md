# KIP 2.0 Formal Verification

Machine-checked models of the KIP 2.0 specification. Results, findings,
and scope limits are in **[REPORT.md](./REPORT.md)**.

| Suite | Tool | Target |
| --- | --- | --- |
| [`alloy/kip-core.als`](./alloy/kip-core.als) | Alloy 6 (temporal) | Core data model: Proposition/Assertion/Evidence lifecycle, Concept merge, Same-Space closure, epistemic root conservation (§23), origin-bound authority (§31.5) |
| [`tla/KipTransactions.tla`](./tla/KipTransactions.tla) | TLA+ / TLC | Transactions: atomic commit, `EXPECT VERSION`, idempotency (incl. `no_effect` interaction), `space_seq`/Commit Record (§32–§36) |
| [`governance/check_governance.py`](./governance/check_governance.py) | Python (exhaustive) | §30 policy evaluation: deny-overrides, invariant supremacy, order-independence |
| [`grammar/check_ebnf.py`](./grammar/check_ebnf.py) | Python (static) | KQL/KML/META EBNF: well-formedness, reachability, cross-grammar drift |

Run everything (expected results asserted, including intended
counterexamples in the bug-injection configs):

```bash
export ALLOY_JAR=/path/to/org.alloytools.alloy.dist.jar   # Alloy >= 6.2
export TLA_JAR=/path/to/tla2tools.jar
./run.sh
```

These artifacts verify the **protocol layer** within bounded scopes. They
do not — and cannot — verify cognitive-layer claims (memory influence,
learning); those are Brain-level empirical benchmarks by design
(Architecture §21.3).
