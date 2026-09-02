#!/usr/bin/env bash
# Run the complete KIP 2.0 formal verification suite.
#
# Requirements:
#   - Python 3.10+                                  (suites 3–7)
#   - Java 17+ on PATH (or set JAVA)                (suites 1–2)
#   - org.alloytools.alloy.dist.jar (Alloy 6.2+)  — set ALLOY_JAR
#   - tla2tools.jar (TLA+ tools / TLC)            — set TLA_JAR
#
# Official sources:
#   https://github.com/AlloyTools/org.alloytools.alloy/releases
#   https://github.com/tlaplus/tlaplus/releases
#
# The Java-backed suites are skipped, loudly, when their jar is not set; the
# run then exits 3 ("passed what it could run") instead of 0, so a CI job
# cannot mistake a partial run for the whole argument.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
JAVA="${JAVA:-java}"
ALLOY_JAR="${ALLOY_JAR:-}"
TLA_JAR="${TLA_JAR:-}"
OUT="${OUT:-$HERE/.out}"
mkdir -p "$OUT"
fail=0
skipped=0

# A jar path is not a working toolchain. macOS ships a /usr/bin/java stub that
# exists, runs, and reports no runtime — so probe the JVM once and treat a
# missing one as a skip, never as a violated theorem.
java_ok=1
"$JAVA" -version >/dev/null 2>&1 || java_ok=0

echo "==================== 1. Alloy: Core data model ===================="
if [ -z "$ALLOY_JAR" ]; then
  echo "SKIPPED — set ALLOY_JAR to org.alloytools.alloy.dist.jar"; skipped=1
elif [ "$java_ok" != 1 ]; then
  echo "SKIPPED — ALLOY_JAR is set but \`$JAVA -version\` fails; install a JRE 17+ or set JAVA"; skipped=1
else
  # checks (expected UNSAT = theorem holds)
  for cmd in C1_CanonicalUniquenessWithoutMerge C2_LiveMonotone \
             C3_NoLifecycleResurrection C4_SameSpaceClosure \
             C5_GuardedMergeIsAcyclic C6_AuthorityRequiresElevation \
             C7_DerivedEvidenceRootConservation; do
    res=$("$JAVA" -Xmx4g -Djava.awt.headless=true -jar "$ALLOY_JAR" \
          exec -f -o "$OUT/alloy" -s glucose -c "$cmd" \
          "$HERE/alloy/kip-core.als" 2>&1 | grep -E '^[0-9]+\. +(check|run)' | tail -1)
    echo "${res:-  (no result line — Alloy produced no check/run output)}"
    case "$res" in
      "")      echo "  ^^ $cmd — ALLOY ERROR, NOT A RESULT"; fail=1;;
      *UNSAT*) ;;
      *)       echo "  ^^ EXPECTED UNSAT — FAIL"; fail=1;;
    esac
  done
  # witness traces (expected SAT = scenario reachable)
  for cmd in R1_MergeInducedCollision R2_MergeCycleReachable \
             R3_LaunderingUnderBuggyDerive R4_CorroborationCollapse; do
    res=$("$JAVA" -Xmx4g -Djava.awt.headless=true -jar "$ALLOY_JAR" \
          exec -f -o "$OUT/alloy" -s glucose -c "$cmd" \
          "$HERE/alloy/kip-core.als" 2>&1 | grep -E '^[0-9]+\. +(check|run)' | tail -1)
    echo "${res:-  (no result line — Alloy produced no check/run output)}"
    case "$res" in
      "")        echo "  ^^ $cmd — ALLOY ERROR, NOT A RESULT"; fail=1;;
      *" SAT"*)  ;;
      *)         echo "  ^^ EXPECTED SAT — FAIL"; fail=1;;
    esac
  done
fi

echo "==================== 2. TLC: Transactions ===================="
if [ -z "$TLA_JAR" ]; then
  echo "SKIPPED — set TLA_JAR to tla2tools.jar"; skipped=1
elif [ "$java_ok" != 1 ]; then
  echo "SKIPPED — TLA_JAR is set but \`$JAVA -version\` fails; install a JRE 17+ or set JAVA"; skipped=1
else
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
fi

echo "==================== 3. Governance evaluation ===================="
python3 "$HERE/governance/check_governance.py" || fail=1

echo "==================== 4. EBNF grammars ===================="
python3 "$HERE/grammar/check_ebnf.py" || fail=1

# Explicit-state Python suites: spec mode and spec variants must PASS (exit 0);
# bug-injection modes must find their counterexample (the script exits 0 only
# when it did, so the same expectation applies).
run_py() { # script, label, args...
  local script="$1" label="$2"; shift 2
  local out
  if out=$(python3 "$script" "$@" 2>&1); then
    echo "$label: PASS — $(echo "$out" | tail -1)"
  else
    echo "$label: FAIL"; echo "$out" | tail -5; fail=1
  fi
}

echo "==================== 5. Skill lifecycle / consequence channel ===================="
run_py "$HERE/lifecycle/check_lifecycle.py" "spec"
run_py "$HERE/lifecycle/check_lifecycle.py" "self-graded deployment (variant)" --self-graded
run_py "$HERE/lifecycle/check_lifecycle.py" "bug: family join"        --family-join
run_py "$HERE/lifecycle/check_lifecycle.py" "bug: no TrialState"      --skip-trialstate
run_py "$HERE/lifecycle/check_lifecycle.py" "bug: imported counted"   --count-imported
run_py "$HERE/lifecycle/check_lifecycle.py" "bug: no gate, no flag"   --no-gate

echo "==================== 6. Watch firing under concurrency ===================="
run_py "$HERE/watch/check_watch.py" "spec"
run_py "$HERE/watch/check_watch.py" "variant: EXPECT VERSION only"  --no-client-key
run_py "$HERE/watch/check_watch.py" "variant: client_key only"      --no-guard
run_py "$HERE/watch/check_watch.py" "bug: no guard at all"          --no-guard --no-client-key
run_py "$HERE/watch/check_watch.py" "bug: silence on the clock"     --premature-silence

echo "==================== 7. Purge / legal hold / payload purge ===================="
run_py "$HERE/purge/check_purge.py" "spec"
run_py "$HERE/purge/check_purge.py" "bug: hold after policy"        --hold-after-policy
run_py "$HERE/purge/check_purge.py" "bug: no stub"                  --no-stub
run_py "$HERE/purge/check_purge.py" "bug: payload purge drops citations" --payload-drops-citations

echo
if [ "$fail" != 0 ]; then
  echo "VERIFICATION FAILURES PRESENT"; exit 1
elif [ "$skipped" != 0 ]; then
  echo "PYTHON SUITES PASS — JAVA SUITES SKIPPED (set ALLOY_JAR / TLA_JAR for the full argument)"; exit 3
else
  echo "ALL VERIFICATION SUITES PASS"; exit 0
fi
