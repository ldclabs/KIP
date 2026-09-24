#!/usr/bin/env python3
"""Explicit-state verification of the draft vocabulary (Spec §20.16, §29, §30.5).

A Space keeps a Schema Environment of symbols — (kind, name, origin, claim) —
and a set of promotions from draft symbols to installed ones. Two Principals act
on it: `agent`, whose Grants range over every subset of {propose_schema,
manage_schema}, and `owner`, who holds manage_schema (the single-agent preset).
The runtime either advertises `draft_vocabulary` or does not. Every reachable
state is explored under every interleaving of:

  define(kind, name, claim)   DEFINE; claim "authority" stands for open_world:
                              false / complete: true / a required attribute
  install(kind, name)         install and activate a package exporting the symbol
  alias(kind, name)           change an alias — protected Schema state
  promote(draft, target)      the Schema migration that maps a draft lineage

and the checker asserts:

  V1 AuthorityBound   — install, alias and promote succeed only for a Principal
                        whose Grants name manage_schema; propose_schema never
                        confers it (§20.16, §29).
  V2 OnlyAdds         — no successful step changes or removes an existing symbol.
  V3 NoShadow         — DEFINE never succeeds for a (kind, name) already present,
                        or for a reserved Core name of any kind.
  V4 NoAuthorityClaim — no reachable draft symbol carries an authority claim.
  V5 CapabilityGate   — without draft_vocabulary no DEFINE succeeds and a Grant
                        naming propose_schema is rejected when it is issued.
  V6 PromotionSound   — a draft symbol is promoted at most once, only to an
                        installed symbol of its own kind, and stays defined.
  V7 Reachable        — DEFINE and promotion are both reachable (witness).

Bug-injection modes, each of which MUST produce a counterexample:
  --propose-implies-manage   propose_schema treated as manage_schema   (V1)
  --define-overwrites        DEFINE replaces an existing symbol        (V2/V3)
  --no-claim-check           authority claims accepted in DEFINE       (V4)
  --ungated-grant            propose_schema granted without the capability (V5)
  --repromote                promotion repeated or across kinds        (V6)
"""

import sys
from collections import deque
from itertools import chain, combinations

MODE = {"propose_implies_manage": False, "define_overwrites": False,
        "no_claim_check": False, "ungated_grant": False, "repromote": False}

KINDS = ("type", "pred")
NAMES = ("Person", "mentors", "Tool")
CORE = frozenset({"Assertion"})                   # a reserved Core name (§20.13)
INITIAL = frozenset({("type", "Person", "profile", "plain")})
PACKAGE_SYMBOLS = (("pred", "mentors"), ("type", "Tool"), ("pred", "Tool"))
MAX_STATES = 2_000_000


def grant_sets():
    perms = ("propose_schema", "manage_schema")
    return [frozenset(c) for c in chain.from_iterable(combinations(perms, n) for n in range(3))]


def issue_grant(perms, capability):
    """§29: an Extended permission exists only where its capability is advertised."""
    if "propose_schema" in perms and not capability and not MODE["ungated_grant"]:
        return None
    return perms


def holds(perms, perm):
    if MODE["propose_implies_manage"] and perm == "manage_schema":
        return "manage_schema" in perms or "propose_schema" in perms
    return perm in perms


def operations():
    for kind in KINDS:
        for name in NAMES + tuple(CORE):
            for claim in ("plain", "authority"):
                yield ("define", kind, name, claim)
    for kind, name in PACKAGE_SYMBOLS:
        yield ("install", kind, name)
        yield ("alias", kind, name)
    for dk in KINDS:
        for dn in NAMES:
            for tk, tn in PACKAGE_SYMBOLS:
                yield ("promote", (dk, dn), (tk, tn))


def apply(state, perms, op, capability):
    """One step under the §20.16 decision procedure. Returns the new state or None."""
    symbols, promotions, aliased = state
    kind_names = {(s[0], s[1]) for s in symbols}
    if op[0] == "define":
        _, kind, name, claim = op
        if not capability or not holds(perms, "propose_schema"):
            return None
        if claim == "authority" and not MODE["no_claim_check"]:
            return None                                     # ConstraintViolation
        if MODE["define_overwrites"]:
            kept = frozenset(s for s in symbols if (s[0], s[1]) != (kind, name))
            return (kept | {(kind, name, "draft", claim)}, promotions, aliased)
        if name in CORE or (kind, name) in kind_names:
            return None                                     # SchemaSymbolConflict
        return (symbols | {(kind, name, "draft", claim)}, promotions, aliased)
    if op[0] == "install":
        _, kind, name = op
        if not holds(perms, "manage_schema"):
            return None
        return (symbols | {(kind, name, "pkg", "plain")}, promotions, aliased)
    if op[0] == "alias":
        _, kind, name = op
        if not holds(perms, "manage_schema") or (kind, name, "pkg", "plain") not in symbols:
            return None
        return (symbols, promotions, aliased | {(kind, name)})
    _, draft, target = op
    if not holds(perms, "manage_schema"):
        return None
    drafts = {(s[0], s[1]) for s in symbols if s[2] == "draft"}
    installed = {(s[0], s[1]) for s in symbols if s[2] == "pkg"}
    if draft not in drafts or target not in installed:
        return None
    if not MODE["repromote"] and (draft[0] != target[0] or any(p[0] == draft for p in promotions)):
        return None
    return (symbols, promotions | {(draft, target)}, aliased)


def check_step(pre, post, perms, raw_perms, op, capability, failures):
    if op[0] in ("install", "alias", "promote") and "manage_schema" not in raw_perms:
        failures.append(("V1", op, sorted(raw_perms)))
    if not pre[0] <= post[0]:
        failures.append(("V2", op, sorted(pre[0] - post[0])))
    if op[0] == "define":
        present = {(s[0], s[1]) for s in pre[0]}
        if op[2] in CORE or (op[1], op[2]) in present:
            failures.append(("V3", op))
        if not capability:
            failures.append(("V5", op, "DEFINE without draft_vocabulary"))
    if op[0] == "promote":
        draft, target = op[1], op[2]
        earlier = [p for p in pre[1] if p[0] == draft]
        if earlier or draft[0] != target[0]:
            failures.append(("V6", op, earlier))
        if not any((s[0], s[1]) == draft and s[2] == "draft" for s in post[0]):
            failures.append(("V6", op, "draft symbol removed"))


def check_state(state, failures):
    for s in state[0]:
        if s[2] == "draft" and s[3] == "authority":
            failures.append(("V4", s))


def run(capability, agent_perms):
    failures, witnesses = [], set()
    grants = {"agent": issue_grant(agent_perms, capability), "owner": frozenset({"manage_schema"})}
    if grants["agent"] is None:
        return 0, failures, witnesses, "grant rejected"
    if "propose_schema" in grants["agent"] and not capability:
        failures.append(("V5", "grant accepted without draft_vocabulary", sorted(agent_perms)))
    start = (INITIAL, frozenset(), frozenset())
    seen, queue = {start}, deque([start])
    ops = list(operations())
    while queue:
        state = queue.popleft()
        check_state(state, failures)
        for principal, perms in grants.items():
            for op in ops:
                post = apply(state, perms, op, capability)
                if post is None:
                    continue
                check_step(state, post, perms, perms, op, capability, failures)
                witnesses.add(op[0])
                if post not in seen:
                    seen.add(post)
                    if len(seen) > MAX_STATES:
                        raise SystemExit(f"state bound {MAX_STATES:,} exceeded — model too large")
                    queue.append(post)
    return len(seen), failures, witnesses, "ok"


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
    all_failures, witnesses, total = [], set(), 0
    for capability in (True, False):
        for perms in grant_sets():
            states, failures, seen_ops, note = run(capability, perms)
            total += states
            witnesses |= seen_ops
            props = sorted({f[0] for f in failures})
            print(f"  draft_vocabulary={str(capability):5s} agent={sorted(perms)!s:36s} "
                  f"states={states:>6,} {note:14s} violations={props or 'none'}")
            all_failures.extend(failures)
    for needed in ("define", "promote"):
        if needed not in witnesses:
            all_failures.append(("V7", needed, "unreachable"))
    props = sorted({f[0] for f in all_failures})
    if injected:
        if all_failures:
            print(f"expected counterexample found: {', '.join(props)} violated (first: {all_failures[0]})")
            return 0
        print("FAIL — bug injection produced no counterexample")
        return 1
    if all_failures:
        print(f"FAILURES ({len(all_failures)}): first {all_failures[:5]}")
        return 1
    print(f"V1–V7 hold on the bounded domain ({total:,} states). PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
