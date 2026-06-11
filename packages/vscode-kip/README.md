# KIP Language (VS Code Extension)

VS Code extension providing full language support for **KIP** (Knowledge Interaction Protocol) `.kip` files.

The extension uses `@ldclabs/kip-lang` for KIP v1.0-RC9 command-text parsing,
formatting, and diagnostics, including `:parameter` placeholders in full value
positions, predicate variables, multi-key `ORDER BY`, `SEARCH` retrieval modes,
`EXPECT VERSION`, `UPDATE`, `MERGE`, `EXPORT`, and JSON-compatible object
literals with unquoted identifier keys.

## Features

### Syntax Highlighting

TextMate grammar with scopes for:

- Keywords (`FIND`, `UPSERT`, `UPDATE`, `MERGE`, `EXPORT`, `WHERE`, …)
- Compound keywords (`SET ATTRIBUTES`, `SET METADATA`, `ORDER BY`, `EXPECT VERSION`, …)
- Variables (`?drug`), parameters (`:limit`), system identifiers (`$ConceptType`)
- Strings, numbers, booleans, `null`
- Built-in functions (`COUNT`, `CONTAINS`, `REGEX`, `IN`, `IS_NULL`, `ADD`, `MUL`, `CLAMP`, `COALESCE`, …)
- Operators (`==`, `!=`, `&&`, `||`, `<`, `>`, …)
- Comments (`// ...`)

### Document Formatting

Format on save or via `Shift+Alt+F`:

- Consistent 4-space indentation
- Proper nesting for objects, arrays, and blocks
- Alphabetical sorting of `SET ATTRIBUTES` keys
- Comment preservation with correct placement
- Quoted/unquoted key style preservation
- Parameter placeholders such as `LIMIT :limit`, `SEARCH CONCEPT :term`, `MODE :mode`, `THRESHOLD :threshold`, and `DESCRIBE CONCEPT TYPE :type`

### Real-time Diagnostics

Error squiggles as you type (300ms debounce):

- Unterminated strings
- Unclosed / mismatched brackets
- Unexpected tokens and missing clauses

### Code Folding

Fold/unfold blocks:

- Statement bodies (`UPSERT { ... }`, `WHERE { ... }`)
- `CONCEPT` / `PROPOSITION` blocks
- `SET ATTRIBUTES` / `SET PROPOSITIONS` blocks
- `UPDATE` `SET ATTRIBUTES` / `SET METADATA` blocks
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
pnpm package   # produces vscode-kip-0.2.3.vsix
```

Then install the `.vsix`:

```
code --install-extension vscode-kip-0.2.3.vsix
```

### Development

1. Open the repo root in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open any `.kip` file to see syntax highlighting, diagnostics, and formatting

Use `pnpm watch` for live rebuild during development.

## Configuration

The extension works out of the box with no configuration needed. Formatting uses 4-space indentation and sorts attribute keys alphabetically.

## KIP Language

KIP is a structured query and mutation language for knowledge graphs. See the [KIP Specification](../../SPECIFICATION.md) for full syntax details.

## License

MIT
