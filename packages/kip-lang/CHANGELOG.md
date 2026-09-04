# Changelog

All notable changes to `@ldclabs/kip-lang` are documented here.

## 2.3.0

Tracks the 2.0-draft simplification: `VERIFY` takes `CAPSULE`, `SCHEMA
PACKAGE` or `RECEIPT` (Spec §69.1). `BLOB` and `CHECKPOINT` were never defined
beyond the grammar line that named them.

### Changed (breaking)

- `VERIFY BLOB` and `VERIFY CHECKPOINT` no longer parse; `VerifyTargetKind`
  loses both members and the exec AST's `Verify.target` no longer takes
  `Blob` / `Checkpoint`.

## 2.2.0

Tracks the 2.0-draft syntax convergence (Spec §35, §48.1, §51.2, §52.8,
§57, §63.3, §68): one lifecycle statement, one trailing guard position, one
history axis. Source text written for 2.x lifecycle statements no longer
parses; the exec AST changes shape for every consumer of `expect_version`.

### Changed (breaking)

- **`TRANSITION <target> TO "<state>" [BY <ref>] [SET FIELDS] [SET STRUCTURAL]
  [WHERE] [LIMIT] {EXPECT VERSION}` replaces `RETRACT ASSERTION`,
  `SUPERSEDE ASSERTION`, `CORRECT EVIDENCE`, `TRANSITION ACTIVITY`, `ARCHIVE`
  and `TOMBSTONE`.** The quoted state names the move; semantics check that the
  state exists (KIP_2001), that `BY` is present exactly for `superseded` /
  `corrected`, and that `SET FIELDS` / `SET STRUCTURAL` appear only on
  Activity states. `ASSERT ... SUPERSEDING :old` now desugars to
  `TRANSITION :old TO "superseded" BY <new assertion>`.
- **`EXPECT STATE` is gone.** The engine validates the current lifecycle state
  itself (`InvalidLifecycleTransition`), so the guard carried no information.
- **`EXPECT VERSION` is always the trailing clause** — after `WHERE` and
  `LIMIT`, after `UPSERT`'s closing brace, after `ENSURE PROPOSITION`'s tuple —
  and gains version planes: `EXPECT VERSION :v [OF ATTRIBUTES | STRUCTURAL |
  RETENTION | FACET "X"]`, repeatable one guard per plane. `UPDATE ?x EXPECT
  VERSION :v SET ...` and `UPSERT CONCEPT ?x { ... EXPECT VERSION :v ... }`
  no longer parse. Exec AST: every `expect_version: ExpectVersion | null`
  field became `expect_versions: ExpectVersion[]`, and `ExpectVersion` gained
  `plane` (`'Attributes' | 'Structural' | 'Retention' | { Facet } | null`).
  Lowering rejects a repeated plane.
- **`AS OF SEQ` is the only history axis.** `AS OF TX` and `AS OF TIME` are
  removed from KQL, META and EXPORT; resolve a transaction id through
  `DESCRIBE TRANSACTION`, an instant through `DESCRIBE SNAPSHOT AT TIME :t`.
  Exec AST `AsOf` is now `{ Seq }` only.
- **META:** `SNAPSHOT` (the token statement), `DESCRIBE EXECUTION CONTEXT` and
  `DESCRIBE PROJECTION CAPABILITY` are removed — `DESCRIBE PRIMER` /
  `DESCRIBE CAPABILITIES` carry that information. `DESCRIBE SNAPSHOT` takes
  `[AS OF SEQ :s | AT TIME :t]`; `DescribeStatement` gains `atTime`.
- Tokens removed: `TX`, `RETRACT`, `SUPERSEDE`, `CORRECT`, `ARCHIVE`,
  `TOMBSTONE`, `STATE`, `EXECUTION`, `CONTEXT`, `CAPABILITY`, `PROJECTION`.
  Token added: `AT`. Those words are ordinary identifiers again.
- Exported types: `TransitionStatement`, `VersionPlane`, `ExpectVersion`,
  `ExecVersionPlane`, `Transition` replace the removed per-statement types.
- `lower()` now throws on a `TRANSITION` that omits `BY` for `superseded` /
  `corrected`, adds `BY` to any other state, or finalizes fields / topology
  on a non-Activity state — Spec §52.5 calls these syntax errors, so they are
  part of the executability contract, not only editor diagnostics.

### Added

- The syntax-docs test's KML coverage map now keys `transition_statement` to
  the `TRANSITION ` marker and drops `snapshot_statement`; the EBNF header
  notes (KML 5 / 5a / 6a) describe the same decisions.

## 2.1.0

### Added

- **`PURGE PAYLOAD` (Spec §60.6).** Erases Evidence payload bytes while the
  element survives, so the statement takes no `REFERENCE POLICY` clause and
  demands the same exact `CONFIRM "PURGE"` literal as element purge. Parsed,
  formatted, lowered (`PurgePayload` exec command), and covered by the same
  unbounded-`WHERE` LIMIT warning as the rest of the removal ladder.
- **`LIST DEPENDENTS :id [DEPTH :n] [LIMIT :n] [CURSOR :c]` (Spec §63.5).**
  Bounded reverse provenance closure: the cognition derived from one element,
  reached through Activity `inputs → outputs`. The operand is required; the
  parser rejects a bare `LIST DEPENDENTS`.
- Exec AST: `ListCommand` gains `element` / `depth` (null for every other
  target) and `ListTarget` gains `Dependents`; wire consumers deserializing
  `ListCommand` must accept the two new fields.

## 2.0.2

### Fixed

- **The formatter no longer changes what a filter means.** `parsePrimary`
  unwraps `( ... )` and returns the inner node, so grouping is not in the AST;
  printing operators flat turned `A && (B || C)` into `A && B || C`, which
  reparses as `(A && B) || C`. `!(A && B)` became `!A && B`. The output still
  parsed and still lowered, so nothing downstream could notice — and
  `vscode-kip` formats on save. The formatter now restores minimal parentheses
  from the parser's own precedence chain, and adds none that default
  precedence already gives.
- **`checkBudget` no longer stops guarding after an unterminated string.** The
  lexer closes a string at a raw newline; the budget scan did not, so it stayed
  in string mode for the rest of the input and every later bracket went
  uncounted — `"` + newline + 200 `[` passed a guard that rejects 200 `[`. An
  escaped newline still continues the string, in both.
- **`EXPECT STATE` on `ARCHIVE` / `TOMBSTONE` was checked against the Assertion
  lifecycle registry**, so guarding an idempotent sweep with
  `EXPECT STATE "archived"` was reported as an error on a command the
  Specification admits. Those statements take any element, and Core registers
  no element-lifecycle vocabulary. The registry check moved to the statements
  whose target is an Assertion by construction — `RETRACT ASSERTION`, and now
  `SUPERSEDE ASSERTION`, which was unchecked.

### Added

- The unbounded-sweep warning (`KIP_4002`) now covers all six statements
  Spec §52.7 names, not just `FIND` and `UPDATE`: `RETRACT ASSERTION`,
  `SET RETENTION`, `ARCHIVE`, `TOMBSTONE` and `PURGE` were silent, which had it
  backwards — an over-broad `PURGE` is the one that cannot be undone.
- `role` on an `("evidence", ...)` citation is checked against the Core
  registry (`support` / `challenge` / `context`, Spec §20.13, §56.2), like
  `stance` and `mode` already were.
- `UPDATE ... SET FIELDS` values get the `[0, 1]` and Core-registry checks that
  `CREATE ASSERTION ... SET FIELDS` already got.

## 2.0.1

### Fixed

- Four commands this toolkit lowered and the reference grammar refuses, found
  by a differential oracle against `anda_kip`: an out-of-range integer literal
  was rounded to a double rather than refused, `EXPORT CAPSULE` accepted an
  empty selection, and `UPSERT CONCEPT` accepted both a missing `MATCH` and a
  `?variable` identity.

## 2.0.0

Targets KIP specification revision `2.0-draft`. This is a rewrite of the
language surface, not an increment: KIP 2.0 command text is not backward
compatible with the 1.0 grammar the 0.x line implemented.

### Added

- **Executable AST.** `lower` / `lowerAll` / `lowerStatement` turn a syntax
  tree into the closed `Command` AST an engine runs, rejecting what the
  grammar admits but the language does not with a KIP error code.
- **KQL 2.0**: the five Core element patterns (`CONCEPT`, `PROPOSITION`,
  `ASSERTION`, `EVIDENCE`, `ACTIVITY`), `STRUCTURAL` topology patterns,
  `BELIEF` / `BELIEF SLOT` projection patterns, the independent `AS OF`
  (`SEQ` / `TX`) and `FOR TIME` axes, `WITH EPISTEMIC`, multi-key `ORDER BY`,
  and `CURSOR` paging.
- **KML 2.0**: `MUTATE` transactions, `CREATE`/`UPSERT CONCEPT`,
  `ENSURE PROPOSITION`, the `ASSERT` sugar with `SUPERSEDING`,
  `CREATE EVIDENCE | ASSERTION | ACTIVITY`, generic `UPDATE`, the
  `RETRACT` / `SUPERSEDE` / `CORRECT` / `TRANSITION` lifecycle,
  `SET RETENTION`, `ARCHIVE`, `TOMBSTONE`, `PURGE ... CONFIRM "PURGE"`, and
  `MERGE CONCEPT`, with `EXPECT VERSION` / `EXPECT STATE` preconditions.
- **`UNSET STRUCTURAL`**, so every `SET` clause has its removal counterpart.
- **META 2.0**: every `DESCRIBE`, `LIST`, `SEARCH`, `VERIFY`, `VALIDATE`,
  `PREVIEW`, `HISTORY`, `CHANGES`, `SNAPSHOT` and `EXPORT CAPSULE` target.
- **`validateExecutable(program)`**, chained into `diagnose`, so the editor
  reports any statement that parses but cannot lower.
- **`checkBudget` / `checkBatchBudget`** (`KIP_4002`) matching `anda_kip`'s
  ceilings, so a command one engine refuses on size is refused by all.
- `KipSyntaxError` carrying KIP error codes; `PARSER_VERSION` and
  `KIP_SPEC_REVISION` exports.
- `src/` ships alongside `dist/`, so published source maps resolve.

### Changed

- Keywords are ASCII case-insensitive and **contextual, not reserved** — `by`,
  `mode`, `type`, `status` remain usable as object keys and dot-path steps.
- The parser enforces the canonical KQL trailing-clause order (`AS OF`,
  `FOR TIME`, `WITH EPISTEMIC`, `ORDER BY`, `LIMIT`, `CURSOR`) while still
  recovering from a mistake.
- Proposition subjects lower as Element references only; KML predicates and
  structural edges take an exact quoted name or a `:parameter`, never a
  `?variable`.
- Unbound `MUTATE` references (`KIP_2102`) are errors, not warnings.
- The formatter keeps a comment attached to the body clause it annotates.

## 0.4.0 and earlier

Implemented the KIP 1.0 command-text surface. See the git history.
