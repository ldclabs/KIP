#!/usr/bin/env python3
"""Exhaustive bounded verification of KIP 2.0 erasure: purge, reference
policies, legal hold, payload purge, and stubs.

Formalizes KIP-2.0-SPECIFICATION.md:
  §19.1  retention.legal_hold blocks erasure
  §29.9  manage_legal_hold (the hold is placed out of band here)
  §60.3  PURGE with REFERENCE POLICY deny_if_referenced | tombstone_reference
         | authorized_cascade; the hold is evaluated before the policy and
         stops a cascade; LegalHoldConflict / PurgeDenied; the digest stub
  §60.6  PURGE PAYLOAD: bytes go, the record, digest, citations and provenance
         topology stay; idempotent; blocked by the hold
  §102   Invariant 34

Universe (small enough to enumerate every hold assignment and every purge
sequence of length ≤ 3):

    E1, E2   Evidence (each with a payload)
    A1       Assertion citing E1            (required reference)
    ACT      Activity, inputs [E1, E2], outputs [A1]   (required references)
    C1       Concept, structural derived_from → E1     (optional reference)

Properties (checked after every operation on every path):
  P1 HeldNeverErased     — a held element is never stubbed, erased, or
                           payload-purged, under any policy, including as a
                           cascade dependent.
  P2 DenyRespectsRefs    — deny_if_referenced never erases an element that a
                           required reference still points to.
  P3 NoDanglingRequired  — a required reference from a live or tombstoned
                           element always resolves to a live, tombstoned, or
                           stub element; never to nothing.
  P4 CascadeStopsAtHold  — an authorized cascade erases unheld dependents
                           (witness) and never a held one (P1).
  P5 PayloadPurgeKeeps   — after PURGE PAYLOAD the record is live, its digest
                           and citations survive, provenance edges survive,
                           and a second PURGE PAYLOAD is no_effect.
  P6 NoResurrection      — a stub never becomes live again; a purged payload
                           never comes back.

Bug-injection modes (each MUST produce a counterexample):
  --hold-after-policy        evaluate the hold after the reference policy, so
                             a cascade erases a held dependent        → P1
  --no-stub                  element purge leaves nothing behind      → P3
  --payload-drops-citations  PURGE PAYLOAD removes citations           → P5
"""

import sys
from itertools import product

ELEMENTS = ("E1", "E2", "A1", "ACT", "C1")
EVIDENCE = {"E1", "E2"}
# required references: (from, to); optional: (from, to)
REQUIRED = {("A1", "E1"), ("ACT", "E1"), ("ACT", "E2"), ("ACT", "A1")}
OPTIONAL = {("C1", "E1")}
POLICIES = ("deny_if_referenced", "tombstone_reference", "authorized_cascade")
MAX_OPS = 3

MODE = {"hold_after_policy": False, "no_stub": False, "payload_drops_citations": False}


def initial(holds):
    # status: live | tombstoned | stub | erased ; payload: present | purged | n/a
    status = {e: "live" for e in ELEMENTS}
    payload = {e: ("present" if e in EVIDENCE else "n/a") for e in ELEMENTS}
    refs = set(REQUIRED) | set(OPTIONAL)
    return (status, payload, frozenset(refs), frozenset(holds))


def referrers(refs, status, x):
    return {y for (y, z) in refs if z == x and (y, z) in REQUIRED and status[y] in ("live", "tombstoned")}


def purge(state, x, policy):
    status, payload, refs, holds = state
    status = dict(status); payload = dict(payload); refs = set(refs)
    if status[x] in ("stub", "erased"):
        return (status, payload, frozenset(refs), holds), "no_effect"
    if x in holds and not MODE["hold_after_policy"]:
        return state, "LegalHoldConflict"
    R = referrers(refs, status, x)
    if policy == "deny_if_referenced":
        if R:
            return state, "PurgeDenied"
        if x in holds:                                   # hold-after-policy bug reaches here
            return state, "LegalHoldConflict"
        status[x] = "erased" if MODE["no_stub"] else "stub"
        if payload[x] != "n/a": payload[x] = "purged"
        return (status, payload, frozenset(refs), holds), "committed"
    if policy == "tombstone_reference":
        if x in holds:
            return state, "LegalHoldConflict"
        status[x] = "erased" if MODE["no_stub"] else "stub"
        if payload[x] != "n/a": payload[x] = "purged"
        for y in R:
            if status[y] == "live":
                status[y] = "tombstoned"
        return (status, payload, frozenset(refs), holds), "committed"
    if policy == "authorized_cascade":
        if x in holds and not MODE["hold_after_policy"]:
            return state, "LegalHoldConflict"
        work = [x]
        while work:
            z = work.pop()
            if status[z] in ("stub", "erased"):
                continue
            if z in holds and not MODE["hold_after_policy"]:
                continue                                 # the cascade stops at a held element
            if z in holds and MODE["hold_after_policy"] and z != x:
                pass                                     # BUG: erases the held dependent
            status[z] = "erased" if MODE["no_stub"] else "stub"
            if payload[z] != "n/a": payload[z] = "purged"
            work.extend(referrers(refs, status, z))
        return (status, payload, frozenset(refs), holds), "committed"
    raise ValueError(policy)


def purge_payload(state, x):
    status, payload, refs, holds = state
    if x not in EVIDENCE:
        return state, "InvalidTarget"
    if status[x] in ("stub", "erased"):
        return state, "no_effect"
    if x in holds:
        return state, "LegalHoldConflict"
    if payload[x] == "purged":
        return state, "no_effect"
    payload = dict(payload); payload[x] = "purged"
    refs = set(refs)
    if MODE["payload_drops_citations"]:
        refs = {(a, b) for (a, b) in refs if not (b == x and a == "A1")}
    return (status, payload, frozenset(refs), holds), "committed"


def check(before, after, op, result, failures, witnesses):
    s0, p0, r0, holds = before
    s1, p1, r1, _ = after
    for e in holds:                                                     # P1
        if s1[e] in ("stub", "erased") or p1[e] == "purged":
            failures.append(("P1", op, e, s1[e], p1[e]))
    if op[0] == "purge" and op[2] == "deny_if_referenced":               # P2
        x = op[1]
        if referrers(r0, s0, x) and s1[x] != s0[x]:
            failures.append(("P2", op))
    for (a, b) in r1:                                                   # P3
        if (a, b) in REQUIRED and s1[a] in ("live", "tombstoned") and s1[b] == "erased":
            failures.append(("P3", op, a, b))
    if op[0] == "purge" and op[2] == "authorized_cascade" and result == "committed":
        x = op[1]
        for y in referrers(r0, s0, x):
            if y not in holds and s1[y] in ("stub", "erased"):
                witnesses["cascade_erases_unheld"] = True               # P4 witness
    if op[0] == "payload":                                              # P5
        x = op[1]
        if result == "committed":
            if s1[x] != "live":
                failures.append(("P5", op, "record not live"))
            if any((a, b) in r0 and (a, b) not in r1 for (a, b) in REQUIRED | OPTIONAL if b == x):
                failures.append(("P5", op, "citation or provenance edge dropped"))
            witnesses["payload_purged"] = True
        if p0[x] == "purged" and s0[x] == "live" and result != "no_effect":
            failures.append(("P5", op, "second payload purge not no_effect", result))
    for e in ELEMENTS:                                                  # P6
        if s0[e] in ("stub", "erased") and s1[e] == "live":
            failures.append(("P6", op, e))
        if p0[e] == "purged" and p1[e] == "present":
            failures.append(("P6", op, e, "payload resurrected"))


def explore():
    failures = []
    witnesses = {"cascade_erases_unheld": False, "payload_purged": False, "hold_blocks_cascade": False}
    ops = [("purge", x, pol) for x in ELEMENTS for pol in POLICIES] + [("payload", e) for e in EVIDENCE]
    states = 0
    for k in range(len(ELEMENTS) + 1):
        pass
    for holds in product([False, True], repeat=len(ELEMENTS)):
        held = {e for e, h in zip(ELEMENTS, holds) if h}
        frontier = [initial(held)]
        for depth in range(MAX_OPS):
            new_frontier = []
            for st in frontier:
                for op in ops:
                    if op[0] == "purge":
                        nxt, result = purge(st, op[1], op[2])
                        if op[2] == "authorized_cascade" and result == "committed":
                            s0, _, r0, _ = st
                            if any(y in held for y in referrers(r0, s0, op[1])):
                                witnesses["hold_blocks_cascade"] = True
                    else:
                        nxt, result = purge_payload(st, op[1])
                    states += 1
                    check(st, nxt, op, result, failures, witnesses)
                    if nxt != st:
                        new_frontier.append(nxt)
            frontier = new_frontier
            if len(failures) > 50:
                return states, failures, witnesses
    return states, failures, witnesses


def main(argv):
    for a in argv:
        key = a.lstrip("-").replace("-", "_")
        if key in MODE:
            MODE[key] = True
        else:
            print(f"unknown option {a}")
            return 2
    injected = [k for k, v in MODE.items() if v]
    print(f"mode: {'spec' if not injected else ', '.join(injected)}")
    states, failures, witnesses = explore()
    print(f"operations checked: {states:,} over {2 ** len(ELEMENTS)} hold assignments and sequences ≤ {MAX_OPS}")
    print(f"witnesses: {witnesses}")
    props = sorted({f[0] for f in failures})
    if injected:
        if failures:
            print(f"expected counterexample found: {', '.join(props)} violated (first: {failures[0]})")
            return 0
        print("FAIL — bug injection produced no counterexample")
        return 1
    if failures:
        print(f"FAILURES ({len(failures)}): first {failures[:5]}")
        return 1
    if not all(witnesses.values()):
        print(f"FAIL — witness unreachable: {witnesses}")
        return 1
    print("P1–P6 hold on the bounded domain. PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
