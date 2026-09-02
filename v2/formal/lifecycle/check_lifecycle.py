#!/usr/bin/env python3
"""Explicit-state bounded verification of the KIP 2.0 consequence channel and
Skill lifecycle.

Formalizes KIP-2.0-SPECIFICATION.md and CognitiveMemoryProfile-2.0.md:
  Spec §15.7   Outcome Evidence: task family finds, only the decision link
               attributes; imported outcomes never grade (§41.6)
  Spec §29.8   record_outcome; a self-graded deployment is visible from origin
  Spec §102    Invariants 36, 37
  Profile §6.2 GradingState counts linked outcomes only
  Profile §6.5 TrialState is written when the trial opens
  Profile §6.6 DecisionRecord: the action_gate's inputs name what was applied
  Profile §14  lifecycle proposed → trialed → adopted → revoked, every move a
               deterministic, recomputable lifecycle_verdict; revocation never
               harder than adoption; adoption provisional; rule 7 attribution
  Profile §21  lifecycle standing does not survive import

The model is a small transition system explored exhaustively by breadth-first
search over every interleaving of: recording a decision (action_gate whose
inputs name the Skills applied), observing outcomes (instrument / acting
Principal / imported), opening trials, and running the deterministic verdict
rule. Two Skills share one task family — exactly the case a family-level join
gets wrong — and a third Skill arrives by import, adopted at its source.

Properties (checked in every reachable state / on every transition):
  I1 AttributionOnly    — a verdict's inputs, and so a Skill's GradingState,
                          contain only outcomes linked to a decision that
                          applied it, with instrument origin. A family-mate's
                          outcome, an unlinked outcome, an imported outcome
                          never changes a tally, and observing an outcome
                          changes no tally by itself. (Inv. 37)
  I2 BasisBeforeCount   — a verdict on a trialed/adopted Skill finds a
                          TrialState whose basis precedes every graded outcome.
  I3 VerdictOnly        — the lifecycle status changes only in a step that
                          appends a lifecycle_verdict record for that Skill.
  I4 Recomputable       — re-running the rule on the recorded basis and inputs
                          reproduces every recorded transition.
  I5 RevocationNotHarder — the demotion bar never exceeds the promotion bar
                          (static), and adopted → revoked is reachable with
                          fewer graded outcomes than adoption needed.
  I6 ImportResets       — an imported Skill starts proposed with empty
                          GradingState and no TrialState; an imported outcome
                          is in no verdict's inputs. (Profile §21, Spec §41.6)
  I7 SelfGradingVisible — under the record_outcome gate no acting-Principal
                          outcome exists; without the gate every verdict that
                          consumed one is flagged self-graded from origin
                          alone. (Spec §29.8, Inv. 36)

Bug-injection modes (each MUST produce a counterexample, mirroring the TLA+
suite's convention):
  --family-join      count every outcome in the family (the pre-2026-09-02
                     design)                                   → violates I1
  --skip-trialstate  open a trial without writing TrialState   → violates I2
  --count-imported   let imported outcomes into the treatment set → violates I6
  --no-gate          accept acting-Principal outcomes and do not flag them
                                                               → violates I7

Spec-variant mode (MUST pass):
  --self-graded      no record_outcome gate: the acting Principal's outcomes
                     are accepted, and every verdict that consumed one is
                     flagged self-graded from origin (Spec §29.8 permits this
                     deployment as long as it is visible)
"""

import sys
from collections import deque

SKILLS = ("S1", "S2")            # share one task family; S3 arrives by import
MAX_OUTCOMES = 3
QUOTA = 2                        # linked graded outcomes a trial needs
RULE_ID = "adopt-if-better-v1"
K_REVOKE = 1                     # linked failures after adoption that demote
K_ADOPT = QUOTA                  # graded outcomes adoption needs
MAX_STATES = 3_000_000

MODE = {
    "family_join": False,
    "skip_trialstate": False,
    "count_imported": False,
    "no_gate": False,
    "self_graded": False,
}
BUGS = ("family_join", "skip_trialstate", "count_imported", "no_gate")


def actor_outcomes_allowed():
    return MODE["no_gate"] or MODE["self_graded"]

# --------------------------------------------------------------------------
# State: (skills, decision, outcomes, verdicts)
#   skills:   tuple of (name, status, succ, fail, graded, trial, imported)
#             trial = None | (basis_idx, base_s, base_f, base_g, quota, rule)
#             basis_idx = number of outcomes that existed when the trial opened
#   decision: None | frozenset of Skills the action_gate applied
#             (a single decision G1; outcomes link to it or to nothing)
#   outcomes: tuple of (status, linked: bool, origin)
#             origin in {"instrument", "actor", "imported"}; index = order
#   verdicts: tuple of (skill, from, to, inputs: frozenset of outcome idx,
#                       basis_idx, self_graded)
# --------------------------------------------------------------------------


def initial():
    s = tuple((n, "proposed", 0, 0, 0, None, False) for n in SKILLS)
    s3 = ("S3", "proposed", 0, 0, 0, None, True)   # Profile §21: enters proposed, empty
    return (s + (s3,), None, (), ())


def attributed(name, decision, o):
    """Spec §15.7 / Profile §8.1: linked to a decision that applied the Skill."""
    return o[1] and decision is not None and name in decision


def treatment(state, name, trial):
    """The set the verdict rule reads (as outcome indices)."""
    skills, decision, outcomes, _ = state
    idx = []
    for i, o in enumerate(outcomes):
        status, linked, origin = o
        ok = True if MODE["family_join"] else attributed(name, decision, o)
        if origin == "imported" and not MODE["count_imported"]:
            ok = False
        if trial is not None and i < trial[0]:
            ok = False                                   # before the basis: baseline
        if ok:
            idx.append(i)
    return frozenset(idx)


def rule(status, trial, inputs, outcomes):
    """The deterministic verdict rule (RULE_ID). Returns the new status."""
    succ = sum(1 for i in inputs if outcomes[i][0] == "success")
    fail = sum(1 for i in inputs if outcomes[i][0] == "failure")
    graded = len(inputs)
    if status == "trialed":
        if graded < trial[4]:
            return "trialed"
        base_rate = (trial[1] / trial[3]) if trial[3] else 0.5
        return "adopted" if (succ / graded) > base_rate else "revoked"
    if status == "adopted":
        return "revoked" if fail >= K_REVOKE else "adopted"
    return status


def successors(state):
    skills, decision, outcomes, verdicts = state
    nxt = []
    # 1. record the decision: an action_gate whose inputs name the Skills applied
    if decision is None:
        for applied in (frozenset(), frozenset({"S1"}), frozenset({"S2"}), frozenset(SKILLS)):
            nxt.append(("decide", (skills, applied, outcomes, verdicts)))
    # 2. observe an outcome
    if len(outcomes) < MAX_OUTCOMES:
        origins = ["instrument"] + (["actor"] if actor_outcomes_allowed() else [])
        for origin in origins:
            for status in ("success", "failure"):
                for linked in ((False, True) if decision is not None else (False,)):
                    nxt.append(("observe", (skills, decision, outcomes + ((status, linked, origin),), verdicts)))
        # an imported outcome: it may well be linked to a decision (the link
        # came with it), but its origin.import_id says it was observed elsewhere
        if not any(o[2] == "imported" for o in outcomes):
            for linked in ((False, True) if decision is not None else (False,)):
                nxt.append(("import_outcome", (skills, decision, outcomes + (("success", linked, "imported"),), verdicts)))
    # 3. lifecycle events
    for i, s in enumerate(skills):
        name, status, succ, fail, graded, trial, imported = s
        if status == "proposed":
            baseline = [o for o in outcomes if o[2] == "instrument" and not attributed(name, decision, o)]
            base_s = sum(1 for o in baseline if o[0] == "success")
            base_f = sum(1 for o in baseline if o[0] == "failure")
            new_trial = None if MODE["skip_trialstate"] else (len(outcomes), base_s, base_f, len(baseline), QUOTA, RULE_ID)
            ns = list(skills)
            ns[i] = (name, "trialed", 0, 0, 0, new_trial, imported)
            v = (name, "proposed", "trialed", frozenset(), len(outcomes), False)
            nxt.append(("open_trial", (tuple(ns), decision, outcomes, verdicts + (v,))))
        elif status in ("trialed", "adopted"):
            inputs = treatment(state, name, trial)
            eff_trial = trial if trial is not None else (0, 0, 0, 0, QUOTA, RULE_ID)
            new_status = rule(status, eff_trial, inputs, outcomes)
            last = [v for v in verdicts if v[0] == name]
            # a verdict is only worth recording when it reads new material or moves
            if last and last[-1][3] == inputs and new_status == status:
                continue
            ns = list(skills)
            n_succ = sum(1 for k in inputs if outcomes[k][0] == "success")
            n_fail = sum(1 for k in inputs if outcomes[k][0] == "failure")
            ns[i] = (name, new_status, n_succ, n_fail, len(inputs), trial, imported)
            # the flag is derived from _system.origin alone (Spec §29.8); the
            # --no-gate bug suppresses it
            self_graded = (not MODE["no_gate"]) and any(outcomes[k][2] == "actor" for k in inputs)
            v = (name, status, new_status, inputs, trial[0] if trial is not None else -1, self_graded)
            nxt.append(("verdict", (tuple(ns), decision, outcomes, verdicts + (v,))))
    return nxt


def check_state(state, failures):
    skills, decision, outcomes, verdicts = state
    for s in skills:
        name, status, succ, fail, graded, trial, imported = s
        if imported and not any(v[0] == name for v in verdicts):
            if status != "proposed" or (succ, fail, graded) != (0, 0, 0) or trial is not None:
                failures.append(("I6", name, "imported Skill kept standing or grading"))
    for v in verdicts:
        name, frm, to, inputs, basis, self_graded = v
        for k in inputs:
            o = outcomes[k]
            if not attributed(name, decision, o) or o[2] not in ("instrument", "actor"):
                failures.append(("I1", name, "graded through family/unlinked/imported outcome", k))
            if o[2] == "imported":
                failures.append(("I6", name, "imported outcome in verdict inputs", k))
        if frm in ("trialed", "adopted"):
            if basis < 0:
                failures.append(("I2", name, "verdict without TrialState"))
            elif any(k < basis for k in inputs):
                failures.append(("I2", name, "graded outcome from before the basis"))
        actor_in = any(outcomes[k][2] == "actor" for k in inputs)
        if actor_in and not self_graded:
            failures.append(("I7", name, "actor-origin outcome graded without self_graded flag"))
        if actor_in and not actor_outcomes_allowed():
            failures.append(("I7", name, "actor-origin outcome exists under the gate"))


def check_transition(before, after, label, failures):
    sk0 = {s[0]: s for s in before[0]}
    for s1 in after[0]:
        s0 = sk0[s1[0]]
        if s0[1] != s1[1]:
            new_v = after[3][len(before[3]):]
            if not any(v[0] == s1[0] for v in new_v):
                failures.append(("I3", s1[0], f"{s0[1]}→{s1[1]} without verdict", label))
        if label in ("observe", "import_outcome") and (s0[2], s0[3], s0[4]) != (s1[2], s1[3], s1[4]):
            failures.append(("I1", s1[0], "tally changed by observing an outcome"))


def recompute(state, failures):
    skills, decision, outcomes, verdicts = state
    for v in verdicts:
        name, frm, to, inputs, basis, _ = v
        if frm not in ("trialed", "adopted"):
            continue
        s = next(x for x in skills if x[0] == name)
        trial = s[5] if s[5] is not None else (basis, 0, 0, 0, QUOTA, RULE_ID)
        again = rule(frm, trial, inputs, outcomes)
        if again != to:
            failures.append(("I4", name, f"recorded {frm}→{to}, recomputed {again}"))


def explore():
    start = initial()
    seen = {start}
    queue = deque([start])
    failures = []
    witnesses = {"adopted": False, "adopted_then_revoked": False, "family_independent": False}
    transitions = 0
    while queue:
        st = queue.popleft()
        check_state(st, failures)
        recompute(st, failures)
        sk = {s[0]: s for s in st[0]}
        if sk["S1"][1] == "adopted":
            witnesses["adopted"] = True
            if sk["S2"][1] in ("proposed", "trialed") and sk["S2"][4] == 0 and len(st[2]) >= QUOTA:
                witnesses["family_independent"] = True
        for v in st[3]:
            if v[1] == "adopted" and v[2] == "revoked" and len(v[3]) <= K_ADOPT + K_REVOKE:
                witnesses["adopted_then_revoked"] = True
        if len(failures) > 50:
            break
        for label, nxt in successors(st):
            transitions += 1
            check_transition(st, nxt, label, failures)
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
                if len(seen) > MAX_STATES:
                    raise SystemExit(f"state bound {MAX_STATES:,} exceeded — model too large")
    return seen, transitions, failures, witnesses


def main(argv):
    for a in argv:
        key = a.lstrip("-").replace("-", "_")
        if key in MODE:
            MODE[key] = True
        else:
            print(f"unknown option {a}")
            return 2
    assert K_REVOKE <= K_ADOPT, "I5: demotion bar exceeds promotion bar"
    seen, transitions, failures, witnesses = explore()
    injected = [k for k in BUGS if MODE[k]]
    variant = "self-graded deployment" if MODE["self_graded"] else "spec"
    print(f"mode: {variant if not injected else ', '.join(injected)}")
    print(f"states: {len(seen):,}  transitions: {transitions:,}")
    print(f"witnesses: adoption reachable={witnesses['adopted']}, "
          f"adopted→revoked with ≤ {K_ADOPT + K_REVOKE} graded={witnesses['adopted_then_revoked']}, "
          f"S1 adopted while family-mate S2 ungraded={witnesses['family_independent']}")
    props = sorted({f[0] for f in failures})
    if injected:
        if failures:
            print(f"expected counterexample found: {', '.join(props)} violated (first: {failures[0]})")
            return 0
        print("FAIL — bug injection produced no counterexample")
        return 1
    if failures:
        print(f"FAILURES ({len(failures)}):")
        for f in failures[:10]:
            print("  ", f)
        return 1
    if not all(witnesses.values()):
        print(f"FAIL — a witness scenario is unreachable: {witnesses}")
        return 1
    print("I1–I7 hold on the bounded domain. PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
