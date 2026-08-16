# Changelog

All notable changes to `@ldclabs/kip-lang` are documented here.

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
