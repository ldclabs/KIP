# KIP Language (VS Code Extension)

VS Code extension providing full language support for **KIP** (Knowledge Interaction Protocol) `.kip` files.

The extension uses `@ldclabs/kip-lang` for KIP 2.0 command-text parsing,
formatting, and diagnostics across all three languages — **KQL** (`FIND`),
**KML** (`ASSERT`, `MUTATE`, …) and **META** (`DESCRIBE`, `SEARCH`, `VERIFY`,
…) — including `:parameter` placeholders in full value positions, `BELIEF` /
`BELIEF SLOT` projection patterns, `STRUCTURAL` topology patterns, the
`AS OF` / `FOR TIME` time axes, facets, and JSON-compatible object literals
with unquoted identifier keys.

## Features

### Syntax Highlighting

TextMate grammar with scopes for:

- Statement keywords (`FIND`, `MUTATE`, `ASSERT`, `UPDATE`, `MERGE`, `DESCRIBE`, `SEARCH`, `EXPORT`, …)
- Element kinds (`CONCEPT`, `PROPOSITION`, `ASSERTION`, `EVIDENCE`, `ACTIVITY`, `STRUCTURAL`, `BELIEF`, `BELIEF SLOT`, `CAPSULE`)
- Compound keywords (`SET FIELDS`, `SET FACET`, `SET STRUCTURAL`, `UNSET ATTRIBUTES`, `CLIENT KEY`, `AS OF`, `FOR TIME`, `WITH EPISTEMIC`, `EXPECT VERSION`, `ORDER BY`, …)
- Variables (`?experience`), parameters (`:limit`)
- Strings, numbers, booleans, `null`
- Built-in functions (`COUNT`, `CONTAINS`, `REGEX`, `IN`, `IS_NULL`, `IS_KIND`, `ADD`, `MUL`, `CLAMP`, `COALESCE`, …)
- Operators (`==`, `!=`, `&&`, `||`, `<`, `>`, …)
- Comments (`// ...`)

KIP 2.0 keywords are ASCII case-insensitive, so `find` highlights exactly like
`FIND` (canonical rendering stays uppercase). Schema symbols and string values
keep their own case-sensitive contracts, and keywords are contextual rather
than reserved — a keyword spelling in an object key or a dot path
(`{by: :alice}`, `?a.lifecycle.status`) is left uncolored.

### Document Formatting

Format on save or via `Shift+Alt+F`:

- Indentation follows the editor's tab size (4 spaces by default)
- Proper nesting for objects, arrays, and blocks
- Author key order preserved inside assignment objects
- Comment preservation with correct placement
- Quoted/unquoted key style preservation
- Parameter placeholders such as `LIMIT :n`, `CURSOR :cursor`, `AS OF SEQ :seq`, `CLIENT KEY :key`, `EXPECT VERSION :version`, `SEARCH CONCEPT :term`, `MODE :mode`, and `THRESHOLD :threshold`

### Real-time Diagnostics

Error squiggles as you type (300ms debounce):

- Unterminated strings
- Unclosed / mismatched brackets
- Unexpected tokens and missing clauses

### Code Folding

Fold/unfold blocks:

- Statement bodies (`MUTATE { ... }`, `CREATE CONCEPT ?x { ... }`, `UPSERT CONCEPT ?x { ... }`, `WHERE { ... }`)
- `MATCH { ... }` identity blocks
- `SET FIELDS` / `SET ATTRIBUTES` / `SET FACET "…"` / `SET STRUCTURAL` blocks
- `UNSET ATTRIBUTES` / `UNSET FACET` / `UNSET STRUCTURAL` blocks
- The `ASSERT` stance object and `WITH EPISTEMIC { ... }`
- `NOT` / `OPTIONAL` / `UNION` clauses
- Consecutive comment blocks

### Bracket Matching & Auto-closing

Automatic matching and closing for `{}`, `()`, `[]`, and `""`.

## Requirements

- VS Code 1.85.0+

## Installation

### From Source

```bash
cd packages/vscode-kip
pnpm install
pnpm build
pnpm package   # produces vscode-kip-2.0.0.vsix
```

Then install the `.vsix`:

```
code --install-extension vscode-kip-2.0.0.vsix
```

### Development

1. Open the repo root in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open any `.kip` file to see syntax highlighting, diagnostics, and formatting

Use `pnpm watch` for live rebuild during development.

## Configuration

The extension works out of the box with no configuration needed. Formatting
follows the editor's tab size and leaves the order of keys as you wrote them.

## KIP Language

KIP 2.0 is the cognitive state protocol between an agent and a persistent
Cognitive Nexus: you read with KQL, change cognition with KML, and ground or
introspect with META. See the [KIP 2.0 Specification](../../v2/KIP-2.0-SPECIFICATION.md)
for full syntax details, or the [syntax card](../../v2/KIPSyntax.md) for a
condensed reference.

## License

MIT
