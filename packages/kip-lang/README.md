# @ldclabs/kip-lang

TypeScript toolkit for **KIP** (Knowledge Interaction Protocol) — a structured query language for knowledge graphs.

Provides a full-featured **lexer → parser → AST → formatter / diagnostics** pipeline for `.kip` files.

## Installation

```bash
pnpm add @ldclabs/kip-lang
```

## Usage

### Tokenize

```ts
import { tokenize } from '@ldclabs/kip-lang'

const tokens = tokenize('FIND(?x.name) WHERE { ?x {type: "Person"} }')
// Token[] with type, value, line, column, offset
```

### Parse

```ts
import { parse } from '@ldclabs/kip-lang'

const { ast, diagnostics } = parse(`
FIND(?drug.name)
WHERE {
  ?drug {type: "Drug"}
  (?drug, "treats", {name: "Headache"})
}
LIMIT 10
`)

console.log(ast.statements[0].kind) // "FindStatement"
console.log(diagnostics)            // [] (no errors)
```

### Format

```ts
import { format } from '@ldclabs/kip-lang'

const source = `UPSERT { CONCEPT ?x { {type: "Drug", name: "Aspirin"} SET ATTRIBUTES { risk_level: 2 } } }`

const formatted = format(source, {
  indentSize: 4,       // default: 4
  sortAttributes: true // default: true
})
```

Output:

```kip
UPSERT {
    CONCEPT ?x {
        {type: "Drug", name: "Aspirin"}
        SET ATTRIBUTES { risk_level: 2 }
    }
}
```

The formatter preserves comments and quoted/unquoted key styles from the original source.

A lighter alternative `formatPreservingComments()` is also available — it normalizes indentation at the line level without AST reconstruction.

### Diagnose

```ts
import { diagnose } from '@ldclabs/kip-lang'

const diagnostics = diagnose('UPSERT { CONCEPT ?x { {type: "Drug"} }')
// [{ severity: "error", message: "Unclosed '{'", ... }]
```

Diagnostics cover:
- Lexer errors (unknown characters, unterminated strings)
- Bracket matching (unclosed / mismatched braces, brackets, parentheses)
- Parser errors (unexpected tokens, missing clauses)

## API Reference

| Export                                       | Description                                              |
| -------------------------------------------- | -------------------------------------------------------- |
| `tokenize(source)`                           | Tokenize KIP source into `Token[]`                       |
| `parse(source)`                              | Parse into `{ ast: Program, diagnostics: Diagnostic[] }` |
| `format(source, options?)`                   | AST-based formatting with comment preservation           |
| `formatPreservingComments(source, options?)` | Line-level indent normalization                          |
| `diagnose(source)`                           | Return `Diagnostic[]` (lexer + bracket + parser errors)  |
| `TokenType`                                  | Enum of all token types                                  |
| `KEYWORDS` / `FUNCTIONS`                     | Maps of KIP keywords and built-in functions              |

### AST Node Types

All AST types are exported for downstream consumption:

- **Statements**: `FindStatement`, `UpsertStatement`, `DeleteStatement`, `DescribeStatement`, `SearchStatement`
- **Blocks**: `ConceptBlock`, `PropositionBlock`, `SetAttributes`, `SetPropositions`, `WithMetadata`
- **Patterns**: `ConceptPattern`, `PropositionPattern`, `FilterClause`, `NotClause`, `OptionalClause`, `UnionClause`
- **Expressions**: `ObjectLiteral`, `ArrayLiteral`, `ObjectEntry`, `Expression`

## KIP Language

KIP is a structured query and mutation language for knowledge graphs. See the [KIP Specification](../../SPECIFICATION.md) for full syntax details.

## License

MIT
