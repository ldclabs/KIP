#!/usr/bin/env python3
"""Static consistency checks over the KIP 2.0 formal EBNF grammars.

Grammars (ISO/IEC 14977-style):
    v2/grammar/KIP-2.0-KQL.ebnf
    v2/grammar/KIP-2.0-KML.ebnf
    v2/grammar/KIP-2.0-META.ebnf

Checks per grammar:
  G1 well-formedness    — every rule parses as `name = body ;`
  G2 no duplicates      — no nonterminal is defined twice
  G3 no undefined refs  — every referenced nonterminal is defined
  G4 reachability       — every rule is reachable from the start symbol
                          (first defined rule), i.e. no dead productions

Across grammars:
  G5 shared-rule drift  — a nonterminal defined in more than one grammar
                          must have an equivalent definition after inlining
                          small alias rules (the three DSLs share their
                          lexical layer; silent divergence is a spec bug).
                          Reviewed intentional divergences are whitelisted
                          below with their rationale.
"""

import re
import sys
from pathlib import Path

GRAMMAR_DIR = Path(__file__).resolve().parents[2] / "grammar"
FILES = {
    "KQL": GRAMMAR_DIR / "KIP-2.0-KQL.ebnf",
    "KML": GRAMMAR_DIR / "KIP-2.0-KML.ebnf",
    "META": GRAMMAR_DIR / "KIP-2.0-META.ebnf",
}

# start symbols (the statement-level entry rule of each DSL)
START = {"KQL": "kql", "KML": "kml", "META": "meta"}

# reviewed intentional cross-grammar divergences (G5 whitelist)
G5_WHITELIST = {
    # KQL alone permits raw predicate *path expressions* (alternation +
    # quantifiers) inside a proposition tuple; KML/META require an exact
    # predicate_atom. Documented in the KQL grammar header (decision 4).
    "proposition_tuple",
    # KQL alone has BELIEF / BELIEF SLOT patterns (epistemic projection is
    # a query-side capability; the mutation language has no belief match).
    "where_clause",
}

# verified-equivalent alias names across grammars: the script checks that
# each pair really has an identical definition (after renaming) before
# using the map, so this table cannot silently go stale.
ALIAS_RENAME = {
    "meta_value": "scalar_value",           # META    : parameter | literal
    "scalar_or_parameter": "scalar_value",  # KML     : parameter | literal
    "structural_field": "schema_symbol",    # KQL     : = schema_symbol
}

COMMENT_RE = re.compile(r"\(\*.*?\*\)", re.DOTALL)
# tokens we must not look inside: terminals and special sequences
STRING_RE = re.compile(r'"[^"]*"|\'[^\']*\'|\?[^?]*\?')
IDENT_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def parse_grammar(path):
    """Return ordered dict name -> normalized body text."""
    text = COMMENT_RE.sub(" ", path.read_text(encoding="utf-8"))
    rules = {}
    order = []
    problems = []
    # split on ';' at top level — strings never contain ';' in these grammars,
    # but verify that assumption instead of relying on it
    for raw_str in STRING_RE.findall(text):
        if ";" in raw_str:
            problems.append(f"terminal containing ';' breaks splitting: {raw_str!r}")
    for i, chunk in enumerate(text.split(";")):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "=" not in chunk:
            problems.append(f"chunk without '=': {chunk[:60]!r}")
            continue
        name, body = chunk.split("=", 1)
        name = name.strip()
        if not IDENT_RE.fullmatch(name):
            problems.append(f"bad rule name: {name[:60]!r}")
            continue
        norm = " ".join(body.split())
        if name in rules:
            problems.append(f"duplicate definition of <{name}>")
        else:
            rules[name] = norm
            order.append(name)
    return rules, order, problems


def referenced(body):
    """Nonterminals referenced in a rule body (identifiers outside strings)."""
    clean = STRING_RE.sub(" ", body)
    return set(IDENT_RE.findall(clean))


def rename_ids(body, mapping):
    """Apply identifier renaming outside terminal strings."""
    parts, pos = [], 0
    def sub(seg):
        return IDENT_RE.sub(lambda m: mapping.get(m.group(0), m.group(0)), seg)
    for m in STRING_RE.finditer(body):
        parts.append(sub(body[pos:m.start()]))
        parts.append(m.group(0))
        pos = m.end()
    parts.append(sub(body[pos:]))
    return " ".join("".join(parts).split())


def normalize_grammar(rules):
    """Rename verified-equivalent aliases to canonical names.
    Returns (renamed_rules, alias_problems)."""
    problems = []
    out = {}
    for n, b in rules.items():
        cn = ALIAS_RENAME.get(n, n)
        nb = rename_ids(b, ALIAS_RENAME)
        if nb == cn:
            continue    # pure alias definition (e.g. `x = y ;`): drop it
        if cn in out and out[cn] != nb:
            problems.append(
                f"alias map claims <{n}> ≡ <{cn}> but definitions differ: "
                f"{out[cn]!r} vs {nb!r}")
        out[cn] = nb
    return out, problems


def reachable(rules, start):
    seen, todo = set(), [start]
    while todo:
        n = todo.pop()
        if n in seen or n not in rules:
            continue
        seen.add(n)
        todo.extend(referenced(rules[n]) - seen)
    return seen


def main():
    ok = True
    defs = {}
    for tag, path in FILES.items():
        rules, order, problems = parse_grammar(path)
        defs[tag] = rules
        start = START[tag] if START[tag] in rules else (order[0] if order else None)
        undef = sorted({
            ref for body in rules.values() for ref in referenced(body)
        } - set(rules))
        reach = reachable(rules, start) if start else set()
        dead = sorted(set(rules) - reach)

        print(f"== {tag}: {len(rules)} rules, start = <{start}>")
        for p in problems:
            ok = False
            print(f"   G1/G2 FAIL: {p}")
        if undef:
            ok = False
            print(f"   G3 FAIL: undefined nonterminals: {', '.join(undef)}")
        else:
            print("   G3 ok: no undefined nonterminals")
        if dead:
            ok = False
            print(f"   G4 FAIL: unreachable from <{start}>: {', '.join(dead)}")
        else:
            print(f"   G4 ok: all rules reachable from <{start}>")

    print("== G5 cross-grammar shared-rule drift (after alias renaming)")
    expanded = {}
    for tag, rules in defs.items():
        renamed, alias_problems = normalize_grammar(rules)
        expanded[tag] = renamed
        for p in alias_problems:
            ok = False
            print(f"   G5 FAIL ({tag}): {p}")
    names = {}
    for tag, rules in expanded.items():
        for n in rules:
            names.setdefault(n, []).append(tag)
    shared = [(n, tags) for n, tags in sorted(names.items()) if len(tags) > 1]
    drift, whitelisted = [], []
    for n, tags in shared:
        if len({expanded[t][n] for t in tags}) > 1:
            (whitelisted if n in G5_WHITELIST else drift).append((n, tags))
    for n, tags in whitelisted:
        print(f"   G5 intentional divergence (whitelisted): <{n}> across {'/'.join(tags)}")
    if drift:
        ok = False
        for n, tags in drift:
            print(f"   G5 FAIL: <{n}> differs across {'/'.join(tags)}:")
            for t in tags:
                print(f"      {t}: {expanded[t][n][:120]}")
    else:
        print(f"   G5 ok: {len(shared)} shared nonterminals, "
              f"{len(whitelisted)} whitelisted, rest equivalent")

    print("\nPASS" if ok else "\nFAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
