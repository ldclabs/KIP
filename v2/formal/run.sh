#!/usr/bin/env bash
# Run the complete KIP 2.0 formal verification suite.
#
# Requirements:
#   - Java 17+ on PATH (or set JAVA)
#   - Python 3.10+
#   - org.alloytools.alloy.dist.jar (Alloy 6.2+)  — set ALLOY_JAR
#   - tla2tools.jar (TLA+ tools / TLC)            — set TLA_JAR
#
# Official sources:
#   https://github.com/AlloyTools/org.alloytools.alloy/releases
#   https://github.com/tlaplus/tlaplus/releases
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
JAVA="${JAVA:-java}"
ALLOY_JAR="${ALLOY_JAR:?set ALLOY_JAR to org.alloytools.alloy.dist.jar}"
TLA_JAR="${TLA_JAR:?set TLA_JAR to tla2tools.jar}"
OUT="${OUT:-$HERE/.out}"
mkdir -p "$OUT"
fail=0

echo "==================== 1. Alloy: Core data model ===================="
# checks (expected UNSAT = theorem holds)
for cmd in C1_CanonicalUniquenessWithoutMerge C2_LiveMonotone \
           C3_NoLifecycleResurrection C4_SameSpaceClosure \
           C5_GuardedMergeIsAcyclic C6_AuthorityRequiresElevation \
           C7_DerivedEvidenceRootConservation; do
  res=$("$JAVA" -Xmx4g -Djava.awt.headless=true -jar "$ALLOY_JAR" \
        exec -f -o "$OUT/alloy" -s glucose -c "$cmd" \
        "$HERE/alloy/kip-core.als" 2>&1 | grep -E '^[0-9]+\. +(check|run)' | tail -1)
  echo "$res"
  case "$res" in *UNSAT*) ;; *) echo "  ^^ EXPECTED UNSAT — FAIL"; fail=1;; esac
done
# witness traces (expected SAT = scenario reachable)
for cmd in R1_MergeInducedCollision R2_MergeCycleReachable \
           R3_LaunderingUnderBuggyDerive R4_CorroborationCollapse; do
  res=$("$JAVA" -Xmx4g -Djava.awt.headless=true -jar "$ALLOY_JAR" \
        exec -f -o "$OUT/alloy" -s glucose -c "$cmd" \
        "$HERE/alloy/kip-core.als" 2>&1 | grep -E '^[0-9]+\. +(check|run)' | tail -1)
  echo "$res"
  case "$res" in *" SAT"*) ;; *) echo "  ^^ EXPECTED SAT — FAIL"; fail=1;; esac
done

echo "==================== 2. TLC: Transactions ===================="
cd "$HERE/tla"
run_tlc() { # cfg, expectation ("pass"|"violate")
  local cfg="$1" expect="$2"
  local out
  out=$("$JAVA" -cp "$TLA_JAR" tlc2.TLC -workers auto -deadlock \
        -config "$cfg" KipTransactions.tla 2>&1)
  if echo "$out" | grep -q "No error has been found"; then
    [ "$expect" = pass ] && echo "$cfg: PASS (all invariants hold)" \
      || { echo "$cfg: FAIL — expected a counterexample"; fail=1; }
  elif echo "$out" | grep -q "Error: Invariant"; then
    [ "$expect" = violate ] \
      && echo "$cfg: PASS (expected counterexample found: $(echo "$out" | grep -o 'Invariant [A-Za-z]*' | head -1))" \
      || { echo "$cfg: FAIL — invariant violated"; fail=1; }
  else
    echo "$cfg: FAIL — TLC error"; echo "$out" | tail -5; fail=1
  fi
}
run_tlc KipTransactions_spec.cfg     pass
run_tlc KipTransactions_toctou.cfg   violate
run_tlc KipTransactions_noretain.cfg violate
cd "$HERE"

echo "==================== 3. Governance evaluation ===================="
python3 "$HERE/governance/check_governance.py" || fail=1

echo "==================== 4. EBNF grammars ===================="
python3 "$HERE/grammar/check_ebnf.py" || fail=1

echo
[ "$fail" = 0 ] && echo "ALL VERIFICATION SUITES PASS" || echo "VERIFICATION FAILURES PRESENT"
exit "$fail"
