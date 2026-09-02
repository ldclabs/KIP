#!/usr/bin/env python3
"""Explicit-state verification of Watch firing under concurrent evaluators.

Formalizes CognitiveMemoryProfile-2.0.md §5.11 (Watch: delta and silence
classes, firing as one atomic transition — a `watch_fire` Activity keyed
`watch_fire:<watch>:<seq>` / `watch_fire:<watch>:silence:<due_at>` plus a
guarded `UPDATE ... EXPECT VERSION` of the Watch's status) against
KIP-2.0-SPECIFICATION.md §32.8 (no_effect), §34 / §52.1 (client_key retry
identity), §35.1 (EXPECT VERSION), §36.3 (at-least-once delivery).

Two maintenance workers consume the same Change Stream at their own pace,
with redelivery, and both try to fire the same Watch. The model explores
every interleaving and checks:

  W1 OncePerKey        — at most one watch_fire Activity and one SleepTask
                         exist per firing key.
  W2 FiredIsOnce       — a Watch in status `fired` has exactly one firing.
  W3 MatchOnly         — a delta Watch fires only on an envelope its
                         condition matches.
  W4 VersionOnce       — the Watch's _system.version advanced exactly once
                         when it fired (§35.5).
  W5 SilenceSound      — a silence Watch fires only after the evaluator has
                         consumed the stream through the due point and seen
                         no match; it never fires when a match exists before
                         due_at.
  W6 Reachable         — firing is reachable (witness).

Mechanism switches (the Profile prescribes both guards; the model shows what
each buys):
  --no-guard        drop EXPECT VERSION on the status transition
  --no-client-key   drop the client_key on the watch_fire Activity/SleepTask
  --premature-silence  let a worker fire a silence Watch on the clock alone,
                    without having consumed the stream through the due point

Expected: spec mode PASS; --no-guard alone PASS; --no-client-key alone PASS
(each guard suffices when the firing is one transaction); --no-guard together
with --no-client-key MUST double-fire (W1/W2/W4); --premature-silence MUST
violate W5.
"""

import sys
from collections import deque

WORKERS = ("w1", "w2")
MODE = {"no_guard": False, "no_client_key": False, "premature_silence": False}
# A bounded proof must stay bounded: refuse to silently become an unbounded run
# (matches lifecycle/check_lifecycle.py).
MAX_STATES = 3_000_000

# Scenarios: (watch_class, envelopes as tuple of match flags for seq 1..n, due_seq)
# due_seq = the stream position at which due_at passes (silence Watches only)
SCENARIOS = [
    ("delta", (False, True, True), None),      # match at 2, and again at 3
    ("delta", (True,), None),
    ("silence", (False, False), 2),            # nothing matches before due
    ("silence", (True, False), 2),             # a match before due: must not fire
]


def initial():
    # watch: (status, version); fires: tuple of keys (with multiplicity);
    # tasks: tuple of keys; workers: (pc, cursor, redelivered, read_status,
    # read_version, key); clock_passed
    workers = tuple(("fetch", 0, False, None, None, None) for _ in WORKERS)
    return (("armed", 1), (), (), workers, False)


def successors(state, wclass, envelopes, due_seq):
    watch, fires, tasks, workers, clock = state
    nxt = []
    n = len(envelopes)
    # environment: the due time passes (silence Watches)
    if wclass == "silence" and not clock:
        nxt.append(("clock", (watch, fires, tasks, workers, True)))
    for wi, w in enumerate(workers):
        pc, cursor, redelivered, rs, rv, key = w

        def with_worker(nw):
            ws = list(workers); ws[wi] = nw
            return tuple(ws)

        if pc == "fetch":
            # consume the next envelope, or (at-least-once) re-deliver the last one once
            if cursor < n:
                seq = cursor + 1
                if wclass == "delta" and envelopes[cursor]:
                    nxt.append(("fetch", (watch, fires, tasks, with_worker(("eval", cursor + 1, redelivered, None, None, f"watch_fire:W:{seq}")), clock)))
                else:
                    nxt.append(("fetch", (watch, fires, tasks, with_worker(("fetch", cursor + 1, redelivered, None, None, None)), clock)))
            if cursor > 0 and not redelivered and wclass == "delta" and envelopes[cursor - 1]:
                nxt.append(("redeliver", (watch, fires, tasks, with_worker(("eval", cursor, True, None, None, f"watch_fire:W:{cursor}")), clock)))
            # silence: decide once the clock passed
            if wclass == "silence" and clock:
                consumed = cursor >= due_seq
                if consumed or MODE["premature_silence"]:
                    seen_match = any(envelopes[i] for i in range(min(cursor, due_seq)))
                    if not seen_match:
                        nxt.append(("silence_eval", (watch, fires, tasks, with_worker(("eval", cursor, redelivered, None, None, f"watch_fire:W:silence:{due_seq}")), clock)))
        elif pc == "eval":
            # read the Watch (snapshot) and decide
            status, version = watch
            if status == "armed":
                nxt.append(("read", (watch, fires, tasks, with_worker(("commit", cursor, redelivered, status, version, key)), clock)))
            else:
                nxt.append(("skip", (watch, fires, tasks, with_worker(("fetch", cursor, redelivered, None, None, None)), clock)))
        elif pc == "commit":
            status, version = watch
            new_watch, new_fires, new_tasks = watch, fires, tasks
            # EXPECT VERSION guard on the status transition
            if not MODE["no_guard"] and version != rv:
                nxt.append(("version_conflict", (watch, fires, tasks, with_worker(("fetch", cursor, redelivered, None, None, None)), clock)))
                continue
            changed = False
            if MODE["no_client_key"] or key not in fires:
                new_fires = fires + (key,); changed = True
            if MODE["no_client_key"] or key not in tasks:
                new_tasks = tasks + (key,); changed = True
            if status != "fired":
                new_watch = ("fired", version + 1); changed = True
            if not changed:
                nxt.append(("no_effect", (watch, fires, tasks, with_worker(("fetch", cursor, redelivered, None, None, None)), clock)))
            else:
                nxt.append(("commit", (new_watch, new_fires, new_tasks, with_worker(("fetch", cursor, redelivered, None, None, None)), clock)))
    return nxt


def check(state, wclass, envelopes, due_seq, failures):
    watch, fires, tasks, workers, clock = state
    status, version = watch
    for key in set(fires):
        if fires.count(key) > 1 or tasks.count(key) > 1:
            failures.append(("W1", key, fires.count(key), tasks.count(key)))
    if status == "fired" and len(fires) != 1:
        failures.append(("W2", fires))
    for key in fires:
        if wclass == "delta":
            seq = int(key.rsplit(":", 1)[1])
            if not envelopes[seq - 1]:
                failures.append(("W3", key))
        else:
            if any(envelopes[i] for i in range(min(len(envelopes), due_seq))):
                failures.append(("W5", key, "silence fired although a match precedes due_at"))
            if not clock:
                failures.append(("W5", key, "silence fired before due_at passed"))
    expected_version = 1 + (1 if status == "fired" else 0)
    if version != expected_version:
        failures.append(("W4", version, status))


def run(wclass, envelopes, due_seq):
    start = initial()
    seen = {start}
    queue = deque([start])
    failures = []
    fired = False
    while queue:
        st = queue.popleft()
        check(st, wclass, envelopes, due_seq, failures)
        if st[0][0] == "fired":
            fired = True
        if len(failures) > 20:
            break
        for _, nxt in successors(st, wclass, envelopes, due_seq):
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
                if len(seen) > MAX_STATES:
                    raise SystemExit(f"state bound {MAX_STATES:,} exceeded — model too large")
    return len(seen), failures, fired


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
    all_failures = []
    for wclass, envelopes, due in SCENARIOS:
        states, failures, fired = run(wclass, envelopes, due)
        should_fire = (wclass == "delta" and any(envelopes)) or (wclass == "silence" and not any(envelopes[:due]))
        props = sorted({f[0] for f in failures})
        print(f"  {wclass:8s} envelopes={envelopes} due={due}: states={states:,} fired_reachable={fired} "
              f"violations={props or 'none'}")
        if should_fire and not fired:
            all_failures.append(("W6", wclass, envelopes))
        if not should_fire and fired:
            all_failures.append(("W3/W5", wclass, envelopes, "fired without cause"))
        all_failures.extend(failures)
    props = sorted({f[0] for f in all_failures})
    expect_bug = (MODE["no_guard"] and MODE["no_client_key"]) or MODE["premature_silence"]
    if expect_bug:
        if all_failures:
            print(f"expected counterexample found: {', '.join(props)} violated (first: {all_failures[0]})")
            return 0
        print("FAIL — bug injection produced no counterexample")
        return 1
    if all_failures:
        print(f"FAILURES ({len(all_failures)}): first {all_failures[:5]}")
        return 1
    print("W1–W6 hold on the bounded domain. PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
