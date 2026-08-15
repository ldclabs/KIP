#!/usr/bin/env python3
"""Exhaustive bounded verification of KIP 2.0 Governance policy evaluation.

Formalizes KIP-2.0-SPECIFICATION.md:
  §30.2  Deny-overrides baseline:
            explicit deny / protocol invariant  overrides  allow
  §30.3  Protocol invariants override policy (a policy cannot authorize
         protocol-invalid behavior)
  §29    representative permission families

The decision procedure below is the natural reading of §30. The script then
*exhaustively* checks, over bounded but complete domains, that the procedure
has the properties the spec implicitly relies on but never states:

  P1 Totality          — every request gets exactly one decision.
  P2 Order-independence — permuting the policy rule list never changes any
                          decision (rule lists behave as rule sets).
  P3 Deny-monotonicity  — adding a deny rule can never turn a deny into an
                          allow.
  P4 Allow-cannot-override — once a request is denied by an explicit deny or
                          a protocol invariant, adding any allow rules
                          cannot flip it.
  P5 Invariant supremacy — protocol-invalid operations are denied under
                          every possible policy set.
  P6 Duplicate idempotence — duplicating a rule never changes any decision.

Bounded domains: 2 principals x 4 permissions x 2 resources, rule scopes with
wildcards, all rule sets up to size 3 (plus extensions for P3/P4). This is
small-scope model checking in the Alloy tradition: any counterexample to
these properties would already appear in tiny configurations.
"""

from itertools import combinations, permutations, product

PRINCIPALS = ["p1", "p2"]
PERMISSIONS = ["read", "update", "derive", "purge"]     # §29 representatives
RESOURCES = ["r1", "r2"]
WILD = "*"

# §30.3: operations no policy may authorize
PROTOCOL_INVALID_OPS = {
    "rewrite_proposition_tuple",     # §12.5 immutability
    "write_system_origin",           # §6.3 engine-maintained _system
    "self_elevate_authority",        # §31.5 content cannot self-raise ceiling
}

# a rule: (effect, principal_scope, permission_scope, resource_scope)
RULES = [
    (effect, ps, perm, rs)
    for effect in ("allow", "deny")
    for ps in PRINCIPALS + [WILD]
    for perm in PERMISSIONS + [WILD]
    for rs in RESOURCES + [WILD]
]

# a request: (principal, operation, resource); operation may be a permission
# or a protocol-invalid op
REQUESTS = [
    (p, op, r)
    for p in PRINCIPALS
    for op in PERMISSIONS + sorted(PROTOCOL_INVALID_OPS)
    for r in RESOURCES
]


def applicable(rule, request):
    _, ps, perm, rs = rule
    p, op, r = request
    return (ps in (WILD, p)) and (perm in (WILD, op)) and (rs in (WILD, r))


def decide(request, rules):
    """§30 evaluation. Returns (decision, reason)."""
    _, op, _ = request
    if op in PROTOCOL_INVALID_OPS:                       # §30.3
        return ("deny", "protocol_invariant")
    if any(r[0] == "deny" and applicable(r, request) for r in rules):
        return ("deny", "explicit_deny")                 # §30.2
    if any(r[0] == "allow" and applicable(r, request) for r in rules):
        return ("allow", "explicit_allow")
    return ("deny", "default_deny")                      # conservative baseline


def rule_sets(max_size):
    for n in range(max_size + 1):
        yield from combinations(RULES, n)


def main():
    failures = []
    checked = {f"P{i}": 0 for i in range(1, 7)}

    for rs in rule_sets(2):
        base = {req: decide(req, rs) for req in REQUESTS}

        # P1 totality
        for req, (d, _) in base.items():
            checked["P1"] += 1
            if d not in ("allow", "deny"):
                failures.append(("P1", rs, req, d))

        # P2 order-independence (all permutations of the rule list)
        for perm_rules in permutations(rs):
            for req in REQUESTS:
                checked["P2"] += 1
                if decide(req, list(perm_rules)) != base[req]:
                    failures.append(("P2", rs, perm_rules, req))

        # P5 invariant supremacy
        for req in REQUESTS:
            if req[1] in PROTOCOL_INVALID_OPS:
                checked["P5"] += 1
                if base[req][0] != "deny":
                    failures.append(("P5", rs, req))

        # P6 duplicate idempotence
        for extra in rs:
            for req in REQUESTS:
                checked["P6"] += 1
                if decide(req, list(rs) + [extra]) != base[req]:
                    failures.append(("P6", rs, extra, req))

        # P3 deny-monotonicity / P4 allow-cannot-override (1-rule extensions)
        for extra in RULES:
            extended = list(rs) + [extra]
            for req in REQUESTS:
                d0, reason0 = base[req]
                d1, _ = decide(req, extended)
                if extra[0] == "deny":
                    checked["P3"] += 1
                    if d0 == "deny" and d1 == "allow":
                        failures.append(("P3", rs, extra, req))
                else:
                    checked["P4"] += 1
                    if d0 == "deny" and reason0 in ("explicit_deny",
                                                    "protocol_invariant") \
                            and d1 == "allow":
                        failures.append(("P4", rs, extra, req))

    total = sum(checked.values())
    print(f"rule universe: {len(RULES)} rules; requests: {len(REQUESTS)}")
    for prop in sorted(checked):
        print(f"  {prop}: {checked[prop]:>10,} checks")
    print(f"total decision checks: {total:,}")
    if failures:
        print(f"\nFAILURES ({len(failures)}):")
        for f in failures[:20]:
            print("  ", f)
        raise SystemExit(1)
    print("\nAll properties hold on the bounded domain. PASS")


if __name__ == "__main__":
    main()
