# Changelog

All notable changes to `@ldclabs/kip-lang` are documented here.

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
