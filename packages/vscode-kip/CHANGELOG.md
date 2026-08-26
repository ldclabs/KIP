# Changelog

All notable changes to the **KIP Language** extension are documented here.

## 2.0.1

Bundles `@ldclabs/kip-lang` 2.0.2, whose formatter no longer rewrites what a
filter means — this extension formats on save, so that fix only reaches an
editor through a new build.

### Fixed

- **An unterminated string no longer colors the rest of the file.** The
  TextMate rule ended only at a closing quote, and a `begin`/`end` rule spans
  lines, so one stray `"` turned everything below it into string scope. A KIP
  string never crosses a newline — the lexer closes it there, and an escaped
  newline is invalid JSON either way — so the rule now ends at end-of-line too,
  matching the lexer the diagnostics in the same window already use.
- **Folding no longer counts braces inside strings and comments.** The fallback
  used when a document does not parse scanned raw characters, so
  `{name: "a { b"}` or `// close the } later` shifted every marker after it.
  It reads the lexer's tokens now — and that fallback runs exactly while a
  command is half-typed, which is when a stray brace is most likely.
- **Brackets no longer auto-close inside strings and comments**, where a
  closing character is text rather than structure.

### Added

- Diagnostics apply the protocol's parser budgets (`KIP_4002`). Without them
  the editor reported a clean file that every KIP engine refuses on size or
  nesting.

## 2.0.0

Targets KIP specification revision `2.0-draft`, tracking `@ldclabs/kip-lang`
2.0.0. KIP 2.0 command text is not backward compatible with the 1.0 grammar the
0.x line highlighted, so `.kip` files written for 0.x will report diagnostics.

Marked **preview** while the specification revision is a draft.

### Added

- Full KIP 2.0 syntax highlighting: every KQL, KML and META keyword, the
  multi-word clause heads (`SET FIELDS`, `UNSET STRUCTURAL`, `AS OF`,
  `WITH EPISTEMIC`, `BY IDEMPOTENCY KEY`, …), `?variable` and `:parameter`
  operands, and the registered filter/update functions.
- Diagnostics now reject any command that parses but cannot lower to the
  executable AST, reported with its KIP error code.
- `kip.format.sortAttributes` — alphabetize keys inside `SET ATTRIBUTES` when
  formatting. Blocks holding a comment keep author order.
- Declares `capabilities.untrustedWorkspaces` and `virtualWorkspaces`, so the
  extension stays active in Restricted Mode and on virtual file systems.

### Changed

- `@ldclabs/kip-lang` is bundled by esbuild rather than resolved at runtime;
  the extension ships with no runtime dependencies.
- Production builds are minified and ship without source maps.
- Indentation and folding rules handle block headers that contain strings
  (`SET FACET "MnemonicState" {`), and spaced object keys stay uncolored.

## 0.2.2 and earlier

Highlighted the KIP 1.0 command-text surface. See the git history.
