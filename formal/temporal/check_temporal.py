#!/usr/bin/env python3
"""Bounded model of KIP 2.0 world-time semantics: temporal succession (Spec
§25.4), the missing-start default (§25.2), time bounds (§25.5) and the
kip:memory-default precedence rules (§21.13).

This is an independent implementation, not a call into the JavaScript oracle,
so the two cross-check each other. It enumerates every pair of witnessed
Assertions over a small timeline, every (inference, witnessed) pair, and a
seeded sample of triples from the extended universe (inferences, until bounds,
context sets), and checks:

  T1 narrowing        succession never makes an Assertion eligible where its
                      written interval excludes it
  T2 order-free       the result does not depend on the order Assertions arrive
  T3 one-write change a later-starting same-actor value ends the earlier open
                      one exactly at its start, and the old value still holds
                      before it
  T4 actor isolation  one actor's Assertions never change another actor's
                      effective intervals
  T5 no decision from indeterminate
                      a candidate is accepted only with support certainly
                      inside at the instant
  T6 late history     an Assertion that starts before the current value and
                      ends before the instant never displaces the current value
  T7 agreement        repeating an Assertion never makes the value it agrees
                      with uncertain where it was accepted
  T8 no invented past a claim with no stated start is never certainly valid
                      before it was made, and is outside before its predecessor's
                      start key
  T9 inferences       an inferred Assertion with no written start is on no
                      line: it ends nothing and nothing ends it
  P1 structural floor the structural baseline never resolves a conflict
  P2 observation      memory-default testimony never outranks an observation
                      by rule 2; equal start keys stay contested
  P3 rule order       recency never overrides context specificity or the
                      subject's own statement, and decides only strict order

Usage: check_temporal.py [--cross-actor | --agreeing-cuts | --no-start-bound |
                          --arrival-order | --outrank-observation |
                          --infer-succeeds | --recency-first]
Each bug flag must produce a counterexample; the script exits 0 only when the
spec mode passes everything and a bug mode finds its violation.
"""
import itertools
import random
import sys

INF = float("inf")
TIMES = [0, 1, 2, 3]                 # instants a value can start or end at
INSTANTS = [-0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]

BUG = next((a[2:] for a in sys.argv[1:] if a.startswith("--")), None)
EXPECTED_BUG = {
    "cross-actor": {"T4", "T6"},
    "agreeing-cuts": {"T7"},
    "no-start-bound": {"T8"},
    "arrival-order": {"T2", "T6"},
    "outrank-observation": {"P2"},
    "infer-succeeds": {"T9"},
    "recency-first": {"P3"},
}
if BUG is not None and BUG not in EXPECTED_BUG:
    sys.exit(f"unknown mode --{BUG}")


class A:
    """One Assertion. frm: None | ('x', t) | ('b', latest). until: None | t | ('e', earliest)."""

    def __init__(self, actor, cand, stance, frm, until, asserted, mode="stated", ctx=()):
        self.actor, self.cand, self.stance = actor, cand, stance
        self.frm, self.until, self.asserted, self.mode = frm, until, asserted, mode
        self.ctx = tuple(sorted(ctx))

    def key(self):
        return (self.actor, self.cand, self.stance, self.frm, self.until, self.asserted, self.mode, self.ctx)

    def __repr__(self):
        return f"A{self.key()}"


def written(a):
    """The written interval as (start bound, end bound); a missing from is the
    bound {latest: asserted_at} (§25.2)."""
    if a.frm is None:
        start = (-INF, a.asserted)
    elif a.frm[0] == "x":
        start = (a.frm[1], a.frm[1])
    else:
        start = (-INF, a.frm[1])
    if a.until is None:
        end = (INF, INF)
    elif isinstance(a.until, tuple):
        end = (a.until[1], INF)
    else:
        end = (a.until, a.until)
    return start, end


def valid(a):
    (slo, _), (_, ehi) = written(a)
    return slo < ehi


def start_key(a):
    """Every Assertion has a start key (§25.4)."""
    if a.frm is not None:
        return a.frm[1]
    return a.asserted


def takes_part(a):
    """Succession is the actor's own account: stated/observed, or a written from (§25.4)."""
    if BUG == "infer-succeeds":
        return True
    return a.mode in ("stated", "observed") or a.frm is not None


def effective(assertions, functional=True):
    """Map index -> (start, end) after succession."""
    idx = list(range(len(assertions)))
    starts = {i: written(assertions[i])[0] for i in idx}
    ends = {i: written(assertions[i])[1] for i in idx}
    order = sorted(idx) if BUG == "arrival-order" else idx
    lines = {}
    for i in order:
        a = assertions[i]
        if not takes_part(a):
            continue
        actor = "*" if BUG == "cross-actor" else a.actor
        lines.setdefault(("prop", actor, a.ctx, a.cand), []).append(i)
        if a.stance == "support" and functional:
            lines.setdefault(("slot", actor, a.ctx), []).append(i)
    for key, line in lines.items():
        slot = key[0] == "slot"

        def disagree(x, y):
            if BUG == "agreeing-cuts":
                return x != y
            ax, ay = assertions[x], assertions[y]
            return ax.cand != ay.cand if slot else ax.stance != ay.stance

        def sk(i):
            # arrival-order bug: order by position in the arrival list, not by start
            return line.index(i) if BUG == "arrival-order" else start_key(assertions[i])

        line_start = {}
        for r in line:
            s = written(assertions[r])[0]
            preds = [q for q in line if disagree(q, r) and sk(q) < sk(r)]
            fr = assertions[r].frm
            if BUG != "no-start-bound" and (fr is None or fr[0] != "x") and preds:
                q = max(preds, key=sk)
                s = (max(s[0], start_key(assertions[q])), start_key(assertions[r]))
            line_start[r] = s
            cur = starts[r]
            starts[r] = (max(cur[0], s[0]), max(cur[1], s[1]))
        for r in line:
            if assertions[r].until is not None:
                continue
            succ = [n for n in line if disagree(n, r) and sk(n) > sk(r)]
            if not succ:
                continue
            nearest = min(sk(n) for n in succ)
            for n in succ:
                if sk(n) != nearest:
                    continue
                e = line_start[n]  # a start-key tie combines bound by bound
                cur = ends[r]
                ends[r] = (min(cur[0], e[0]), min(cur[1], e[1]))
    return {i: (starts[i], ends[i]) for i in idx}


def classify(start, end, t):
    if start[0] > t or end[1] <= t:
        return "outside"
    if start[1] <= t and end[0] > t:
        return "inside"
    return "indeterminate"


def project(assertions, t, policy="structural", subject="a", functional=True, request_ctx=()):
    request = set(request_ctx)
    eligible = [a for a in assertions if set(a.ctx) <= request]
    eff = effective(eligible, functional)
    at = {i: classify(*eff[i], t) for i in eff}
    cands = sorted({a.cand for a in assertions})
    rows = {}
    for c in cands:
        mine = [i for i in eff if eligible[i].cand == c and at[i] != "outside"]
        inside = [i for i in mine if at[i] == "inside"]
        sup = [i for i in inside if eligible[i].stance == "support"]
        opp = [i for i in inside if eligible[i].stance == "reject"]
        status = "contested" if sup and opp else "accepted" if sup else "rejected" if opp else \
            "uncertain" if mine else "insufficient"
        rows[c] = {"status": status, "sup": sup}
    conflict = [c for c in cands if rows[c]["sup"] and rows[c]["status"] != "uncertain"]
    if functional and len(conflict) > 1:
        winner = precedence(eligible, rows, conflict, subject) if policy == "memory-default" else None
        for c in conflict:
            if winner is None:
                rows[c]["status"] = "contested"
            elif c != winner:
                rows[c]["status"] = "uncertain"
    return {c: rows[c]["status"] for c in cands}


def precedence(assertions, rows, conflict, subject):
    def spec(a_, b_):
        return any(all(set(assertions[x].ctx) > set(assertions[y].ctx) for y in rows[b_]["sup"])
                   for x in rows[a_]["sup"])

    def first_person(a_, b_):
        mine = any(assertions[x].actor == subject and assertions[x].mode in ("stated", "observed")
                   for x in rows[a_]["sup"])
        if BUG == "outrank-observation":
            return mine and not any(assertions[y].actor == subject for y in rows[b_]["sup"])
        return mine and not any(assertions[y].actor == subject or assertions[y].mode == "observed"
                                for y in rows[b_]["sup"])

    def recency(a_, b_):
        newest = lambda c: max(start_key(assertions[x]) for x in rows[c]["sup"])
        return newest(a_) > newest(b_)

    order = (recency, spec, first_person) if BUG == "recency-first" else (spec, first_person, recency)
    for rule in order:
        winners = [a_ for a_ in conflict if all(b_ == a_ or rule(a_, b_) for b_ in conflict)]
        if len(winners) == 1:
            return winners[0]
    return None


# ---------------------------------------------------------------- the domain
FROMS = [None] + [("x", t) for t in TIMES] + [("b", t) for t in TIMES]
UNTILS = [None] + [t for t in TIMES if t > 0]
UNTIL_BOUNDS = [("e", t) for t in TIMES if t > 0]


def universe(actors=("a", "b"), cands=("v1", "v2"), stances=("support", "reject"),
             modes=("stated",), untils=UNTILS, ctxs=((),)):
    for actor, cand, stance, frm, until, asserted, mode, ctx in itertools.product(
            actors, cands, stances, FROMS, untils, TIMES, modes, ctxs):
        if frm is not None and asserted != TIMES[0]:
            continue  # the assertion time is a start key only when from is unknown
        a = A(actor, cand, stance, frm, until, asserted, mode, ctx)
        if valid(a):
            yield a


def fail(code, detail):
    print(f"VIOLATION {code}: {detail}")
    if BUG is not None and code in EXPECTED_BUG[BUG]:
        print(f"counterexample found for --{BUG} ({code})")
        sys.exit(0)
    sys.exit(1)


def check_set(S):
    eff = effective(S)
    # T1 narrowing
    for i, a in enumerate(S):
        ws, we = written(a)
        for t in INSTANTS:
            if classify(ws, we, t) == "outside" and classify(*eff[i], t) != "outside":
                fail("T1", f"{S} index {i} at {t}")
    # T2 order-free
    for perm in itertools.permutations(range(len(S))):
        P = [S[j] for j in perm]
        for t in INSTANTS:
            if project(P, t) != project(S, t):
                fail("T2", f"{S} vs {P} at {t}")
    # T4 actor isolation
    for actor in {a.actor for a in S}:
        mine = [a for a in S if a.actor == actor]
        eff_mine = effective(mine)
        for k, a in enumerate(mine):
            if eff[S.index(a)] != eff_mine[k]:
                fail("T4", f"{S} actor {actor}")
    # T5 no decision from indeterminate, P1 structural floor
    for t in INSTANTS:
        res = project(S, t)
        for c, status in res.items():
            if status == "accepted":
                inside = [i for i, a in enumerate(S) if a.cand == c and a.stance == "support"
                          and classify(*eff[i], t) == "inside"]
                if not inside:
                    fail("T5", f"{S} {c} at {t}")
        supported = [c for c in res if any(a.cand == c and a.stance == "support" and
                                           classify(*eff[i], t) == "inside" for i, a in enumerate(S))]
        if len(supported) > 1 and all(res[c] in ("accepted", "contested") for c in supported):
            if any(res[c] == "accepted" for c in supported):
                fail("P1", f"{S} at {t}: structural baseline resolved a conflict")
    # T8 no invented past: a claim with no stated start is never certainly valid
    # before it was made, nor before its predecessor's start key
    for i, a in enumerate(S):
        if a.frm is not None and a.frm[0] == "x":
            continue
        for t in INSTANTS:
            if a.frm is None and t < a.asserted and classify(*eff[i], t) == "inside":
                fail("T8", f"{S}: {a} certainly valid at {t} before it was made")
        for j, b in enumerate(S):
            # a predecessor is on the same line: same actor and context, both taking part
            if j == i or b.actor != a.actor or b.ctx != a.ctx or start_key(b) >= start_key(a) \
                    or not (takes_part(a) and takes_part(b)):
                continue
            disagrees = (b.cand != a.cand and a.stance == b.stance == "support") or \
                        (b.cand == a.cand and b.stance != a.stance)
            if not disagrees:
                continue
            for t in INSTANTS:
                # the predecessor's start key bounds the successor's unknown start from
                # below (§25.4), so before it the successor is outside, not merely unsure
                if t < start_key(b) and classify(*eff[i], t) != "outside":
                    fail("T8", f"{S}: {a} possibly valid at {t} before predecessor {b}")
    # T9 inferences without a written start are on no line
    for i, a in enumerate(S):
        if a.mode != "inferred" or a.frm is not None:
            continue
        if eff[i] != written(a):
            fail("T9", f"{S}: inference {a} was narrowed to {eff[i]}")
        others = [x for x in S if x is not a]
        eff_others = effective(others)
        for k, x in enumerate(others):
            if eff[S.index(x)] != eff_others[k]:
                fail("T9", f"{S}: inference {a} changed {x}")


def check_pairs():
    U = list(universe())
    n = 0
    for x, y in itertools.product(U, repeat=2):
        check_set([x, y])
        n += 1
    return n, len(U)


def check_inference_pairs():
    """T9 over every (inference with no written from, witnessed Assertion) pair."""
    core = list(universe())
    inferences = [a for a in universe(modes=("inferred",)) if a.frm is None]
    n = 0
    for x in inferences:
        for y in core:
            for S in ([x, y], [y, x]):
                eff = effective(S)
                i = S.index(x)
                if eff[i] != written(x):
                    fail("T9", f"{S}: inference {x} was narrowed to {eff[i]}")
                if eff[1 - i] != effective([y])[0]:
                    fail("T9", f"{S}: inference {x} changed {y}")
            n += 1
    return n, len(inferences)


def check_scenarios():
    # T3 one-write world change, T6 late history, T7 agreement
    for s1, s2 in itertools.product([None] + TIMES, TIMES):
        # A start key tie is simultaneity, not succession (§25.4); an unknown
        # start takes the assertion time, here 0, as its start key.
        if s2 <= (0 if s1 is None else s1):
            continue
        X = A("a", "v1", "support", None if s1 is None else ("x", s1), None, 0)
        Y = A("a", "v2", "support", ("x", s2), None, 3)
        for t in INSTANTS:
            res = project([X, Y], t)
            if t >= s2 and (res["v1"] != "insufficient" or res["v2"] != "accepted"):
                fail("T3", f"change at {s2}, t={t}: {res}")
            if (0 if s1 is None else s1) <= t < s2 and (res["v1"] != "accepted" or res["v2"] != "insufficient"):
                fail("T3", f"before change at {s2}, t={t}: {res}")
    for s_cur, (lo, hi) in itertools.product(TIMES, [(a, b) for a in TIMES for b in TIMES if a < b]):
        if hi > s_cur:
            continue
        CUR = A("a", "v1", "support", ("x", s_cur), None, 3)
        LATE = A("a", "v2", "support", ("x", lo), hi, 3)
        for t in INSTANTS:
            if t >= s_cur and project([CUR, LATE], t).get("v1") != "accepted":
                fail("T6", f"late history {LATE} displaced {CUR} at {t}")
    # T6 also across actors under memory-default: a late-recorded old claim
    # carries the time it was made, so recording order never decides (§13.2, §21.13)
    for s_old, s_cur in itertools.product(TIMES, TIMES):
        if s_old >= s_cur:
            continue
        CUR = A("s1", "v1", "support", None, None, s_cur, mode="observed")
        OLD = A("s2", "v2", "support", None, None, s_old, mode="observed")
        for t in INSTANTS:
            if t >= s_cur:
                res = project([OLD, CUR], t, policy="memory-default", subject="x")
                if res != {"v1": "accepted", "v2": "uncertain"}:
                    fail("T6", f"late-recorded {OLD} beat {CUR} at {t}: {res}")
    for s1, s2 in itertools.product(TIMES, TIMES):
        if s2 <= s1:
            continue
        X1 = A("a", "v1", "support", ("b", s1), None, s1)
        X2 = A("a", "v1", "support", ("b", s2), None, s2)
        for t in INSTANTS:
            if project([X1], t)["v1"] == "accepted" and project([X1, X2], t)["v1"] != "accepted":
                fail("T7", f"repeating the value opened a gap at {t}")
    # P2 memory-default: rule 2 never lets testimony outrank an observation,
    # and equal start keys leave recency undecided
    SAY = A("a", "v1", "support", None, None, 0, mode="stated")
    SEE = A("dev", "v2", "support", None, None, 0, mode="observed")
    for t in INSTANTS:
        if t < 0:
            continue
        res = project([SAY, SEE], t, policy="memory-default", subject="a")
        if res != {"v1": "contested", "v2": "contested"}:
            fail("P2", f"testimony outranked an observation: {res}")
    # P3 rule order: recency neither overrides the subject's own statement nor
    # context specificity, and decides only strict order
    OWN = A("a", "v1", "support", None, None, 0, mode="stated")
    HEARSAY = A("b", "v2", "support", None, None, 3, mode="stated")
    res = project([OWN, HEARSAY], 3.5, policy="memory-default", subject="a")
    if res != {"v1": "accepted", "v2": "uncertain"}:
        fail("P3", f"newer hearsay beat the subject's own statement: {res}")
    GENERAL = A("a", "v1", "support", None, None, 3, mode="stated")
    SCOPED = A("a", "v2", "support", None, None, 0, mode="stated", ctx=("task",))
    res = project([GENERAL, SCOPED], 3.5, policy="memory-default", subject="a", request_ctx=("task",))
    if res != {"v1": "uncertain", "v2": "accepted"}:
        fail("P3", f"newer general value beat the task-scoped one: {res}")
    OLD_SAY = A("a", "v1", "support", None, None, 0, mode="stated")
    NEW_SEE = A("dev", "v2", "support", None, None, 3, mode="observed")
    res = project([OLD_SAY, NEW_SEE], 3.5, policy="memory-default", subject="a")
    if res != {"v1": "uncertain", "v2": "accepted"}:
        fail("P3", f"recency did not decide between an old statement and a newer observation: {res}")
    # T9 scenario: two inferences never make a world change (structural: contested;
    # memory-default: recency, with the older still eligible)
    I1 = A("brain", "v1", "support", None, None, 0, mode="inferred")
    I2 = A("brain", "v2", "support", None, None, 3, mode="inferred")
    if project([I1, I2], 3.5) != {"v1": "contested", "v2": "contested"}:
        fail("T9", f"one inference ended another: {project([I1, I2], 3.5)}")
    if project([I1, I2], 3.5, policy="memory-default", subject="x") != {"v1": "uncertain", "v2": "accepted"}:
        fail("T9", f"memory-default did not leave the older inference eligible: {project([I1, I2], 3.5, policy='memory-default', subject='x')}")


def check_sampled(count=40000, seed=20260923):
    rng = random.Random(seed)
    U = list(universe(modes=("stated", "inferred"), untils=UNTILS + UNTIL_BOUNDS, ctxs=((), ("c",))))
    for _ in range(count):
        S = [rng.choice(U) for _ in range(3)]
        check_set(S)
        for t in INSTANTS:
            for perm in itertools.permutations(range(3)):
                P = [S[j] for j in perm]
                if project(P, t, policy="memory-default", request_ctx=("c",)) != \
                        project(S, t, policy="memory-default", request_ctx=("c",)):
                    fail("T2", f"memory-default order dependence: {S} vs {P} at {t}")
    return count, len(U)


def main():
    check_scenarios()
    pairs, size = check_pairs()
    inference_pairs, inferences = check_inference_pairs()
    sampled, extended = check_sampled()
    if BUG is not None:
        print(f"no counterexample found for --{BUG}")
        sys.exit(1)
    print(f"temporal: {size} witnessed assertions, {pairs} pairs exhaustive, {inferences} inferences x "
          f"{size} witnessed = {inference_pairs} pairs (T9), {sampled} sampled triples from an extended "
          f"universe of {extended}; T1-T9, P1-P3 hold")


if __name__ == "__main__":
    main()
