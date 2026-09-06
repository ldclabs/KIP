#!/usr/bin/env python3
"""Bounded consequence-channel contract model (Consistency §§5–6).

Enumerates observation sequences (including two instruments observing one attempt),
then checks revision selection, re-trial, correction and historical replay. This
is bounded input enumeration plus explicit transitions, not a full engine or an
unbounded concurrency proof. The policy verdict is abstracted to a declared
comparable fixture baseline; statistical policy quality is tested separately.
"""
from dataclasses import dataclass, replace
from itertools import product
import sys

@dataclass(frozen=True)
class Attempt:
    id: str
    skill: str
    revision: str
    trial: str

@dataclass(frozen=True)
class Outcome:
    id: int
    attempt: str
    status: str
    origin: str
    corrected: bool = False

@dataclass(frozen=True)
class Trial:
    id: str
    revision: str
    baseline: tuple = (("B1", "failure"), ("B2", "failure"))
    quota: int = 2
    rule: str = "fixture-attempt-comparison-v2"

@dataclass(frozen=True)
class Evaluation:
    trial: Trial
    revision: str
    samples: tuple
    input_snapshot: tuple
    from_status: str
    to_status: str
    self_graded: bool = False

ATTEMPTS = {a.id: a for a in (
    Attempt("A1", "S1", "R1", "T1"), Attempt("A2", "S1", "R1", "T1"),
    Attempt("A3", "S1", "R1", "T1"), Attempt("F1", "S2", "R-other", "T-other"))}
MODES = {k: False for k in ("family_join", "skip_trialstate", "count_imported",
    "no_gate", "self_graded", "observation_count", "reuse_trial", "edit_revision",
    "direct_promotion", "monitor_as_promotion")}
BUGS = tuple(k for k in MODES if k != "self_graded")


def selected(trial, outcomes):
    result = []
    for o in outcomes:
        a = ATTEMPTS.get(o.attempt)
        if not a or o.corrected:
            continue
        match = a.skill == "S1" and a.revision == trial.revision and a.trial == trial.id
        if MODES["family_join"]:
            match = True
        if MODES["reuse_trial"]:
            match = a.skill == "S1" and a.revision == trial.revision
        origin_ok = o.origin == "instrument"
        if MODES["count_imported"] and o.origin == "imported":
            origin_ok = True
        if MODES["no_gate"] and o.origin == "actor":
            origin_ok = True
        if match and origin_ok:
            result.append(o)
    return tuple(result)


def aggregate(outcomes):
    groups = {}
    for o in outcomes:
        key = o.id if MODES["observation_count"] else o.attempt
        groups.setdefault(key, set()).add(o.status)
    # Without a pinned adjudicator conflicting terminal observations stay unknown.
    return tuple(sorted((str(key), next(iter(states)) if len(states) == 1 else "unknown")
                        for key, states in groups.items()))


def rule(before, trial, samples):
    if before == "adopted":
        return "revoked" if any(status == "failure" for _, status in samples) else before
    if before != "trialed" and not MODES["direct_promotion"]:
        return before
    if len(samples) < trial.quota or not trial.baseline or any(s == "unknown" for _, s in samples):
        return before
    rate = sum(s == "success" for _, s in samples) / len(samples)
    baseline = sum(s == "success" for _, s in trial.baseline) / len(trial.baseline)
    return "adopted" if rate > baseline else "revoked"


def evaluate(trial, outcomes, before="trialed"):
    inputs = selected(trial, outcomes)
    samples = aggregate(inputs)
    return Evaluation(None if MODES["skip_trialstate"] else trial, trial.revision,
                      samples, inputs, before, rule(before, trial, samples))


def violations(verdict):
    bad = []
    if verdict.trial is None:
        return [("I2", "missing immutable TrialRecord")]
    for o in verdict.input_snapshot:
        a = ATTEMPTS[o.attempt]
        if a.skill != "S1": bad.append(("I1", "family-mate credited"))
        if a.trial != verdict.trial.id: bad.append(("I9", "late outcome crossed trial identity"))
        if a.revision != verdict.revision: bad.append(("I9", "outcome crossed revision"))
        if o.origin == "imported": bad.append(("I6", "imported outcome graded locally"))
        if o.origin == "actor": bad.append(("I7", "self report entered validated local grading"))
    if len(verdict.samples) > len({o.attempt for o in verdict.input_snapshot}):
        bad.append(("I8", "observations multiplied independent attempts"))
    promotion = verdict.from_status != "adopted" or MODES["monitor_as_promotion"]
    if verdict.to_status == "adopted" and promotion and len({o.attempt for o in verdict.input_snapshot}) < 2:
        bad.append(("I8", "one attempt acquired standing"))
    if verdict.to_status == "adopted" and verdict.from_status not in ("trialed", "adopted"):
        bad.append(("I11", "adoption bypassed trialed standing"))
    if rule(verdict.from_status, verdict.trial, verdict.samples) != verdict.to_status:
        bad.append(("I4", "immutable verdict failed replay"))
    return bad


def main(argv):
    for arg in argv:
        key = arg.lstrip("-").replace("-", "_")
        if key not in MODES:
            print("unknown option", arg); return 2
        MODES[key] = True
    trial = Trial("T1", "R1")
    options = tuple(product((*ATTEMPTS, "unlinked"), ("success", "failure"),
                            ("instrument", "actor", "imported")))
    checks = 0
    witness = {"adoption": False, "demotion": False, "one_attempt_not_promoted": False,
               "old_trial_excluded": False, "replay_after_revision": False, "correction": False,
               "no_direct_adoption": False, "sparse_monitoring": False}
    failures = []
    for size in range(4):
        for scenario in product(options, repeat=size):
            outcomes = tuple(Outcome(i, *entry) for i, entry in enumerate(scenario))
            verdict = evaluate(trial, outcomes)
            checks += 1
            failures.extend(violations(verdict))
            # Current adopted standing has a prior validated basis in this fixture;
            # a new sparse evaluation can retain it under the monitoring rule.
            monitoring = evaluate(trial, outcomes, "adopted")
            failures.extend(violations(monitoring))
            witness["sparse_monitoring"] |= not monitoring.samples and monitoring.to_status == "adopted"
            unproven = tuple(evaluate(trial, outcomes, state) for state in ("proposed", "revoked"))
            for result in unproven:
                failures.extend(violations(result))
            if verdict.to_status == "adopted":
                witness["adoption"] = True
                witness["no_direct_adoption"] |= all(result.to_status == result.from_status for result in unproven)
                # A new revision resets caches/standing; the old evaluation stays immutable.
                standing = "adopted" if MODES["edit_revision"] else "proposed"
                if standing != "proposed": failures.append(("I10", "new behavior inherited standing"))
                witness["replay_after_revision"] |= not violations(verdict)
                after_failure = outcomes + (Outcome(len(outcomes), "A3", "failure", "instrument"),)
                witness["demotion"] |= evaluate(trial, after_failure, "adopted").to_status == "revoked"
            if size == 2 and all(o.attempt == "A1" and o.origin == "instrument" and o.status == "success" for o in outcomes):
                witness["one_attempt_not_promoted"] |= verdict.to_status != "adopted"
            # A re-trial has a fresh identity even on the same revision.
            retrial = evaluate(Trial("T2", "R1"), outcomes)
            failures.extend(violations(retrial))
            witness["old_trial_excluded"] |= not retrial.samples
            corrected = tuple(replace(o, corrected=True) for o in outcomes)
            witness["correction"] |= not evaluate(trial, corrected).samples
            if failures and any(MODES[k] for k in BUGS):
                print(f"expected counterexample found after {checks} cases: {failures[0]}")
                return 0
            if failures:
                print("FAIL", failures[:5]); return 1
    if any(MODES[k] for k in BUGS):
        print("FAIL — injected bug escaped"); return 1
    if not all(witness.values()):
        print("FAIL — missing positive witness", witness); return 1
    print(f"{checks:,} observation sequences checked; witnesses: {witness}")
    print("I1–I11 hold in the bounded consequence model. PASS")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
