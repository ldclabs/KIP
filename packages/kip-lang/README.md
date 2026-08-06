# @ldclabs/kip-lang

TypeScript toolkit for **KIP** (Knowledge Interaction Protocol) — a structured query language for knowledge graphs.

Provides a full-featured **lexer → parser → AST → formatter / diagnostics**
pipeline for `.kip` files, plus **`lower`**, which turns a syntax tree into the
executable AST a KIP engine runs.

The parser targets the KIP v1.0-RC10 command-text syntax, including `:parameter`
placeholders in full value positions, JSON-compatible object literals with
unquoted identifier keys, predicate variables, multi-key `ORDER BY`, `SEARCH`
retrieval modes and thresholds, `EXPECT VERSION`, `UPDATE`, `MERGE`, `EXPORT`,
`EXPORT ... CURSOR`, and batch-friendly multi-command source text. The
`execute_kip` request envelope (`command`, `commands`, `parameters`, `dry_run`)
is JSON outside the `.kip` language and should be validated by the caller.

## Two trees, two audiences

`parse` returns a **syntax tree**: ranges, comments, quoting style, raw number
text — everything a formatter or an editor needs to reproduce the source, and
error recovery that keeps producing a tree after a mistake.

`lower` returns the **executable AST**: every construct collapsed to the one
shape it means, with the open-ended parts of the grammar closed. A concept
matcher becomes one of four identified forms; a filter becomes a comparison, a
logical node, a negation, or a call to one of seven functions; a variable
becomes a name and a dot path. Anything the syntax admits but the language does
not — an unknown filter function, `{type: "T"}` where an identity is required,
an `UPDATE` expression reading a foreign variable — is rejected here, with a
KIP error code.

That split is why the two exist: an editor wants the loosest tree it can get,
an engine wants the tightest.

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
- Invalid JSON-compatible string and number literals
- Bracket matching (unclosed / mismatched braces, brackets, parentheses)
- Parser errors (unexpected tokens, missing clauses)

### Lower to the executable AST

```ts
import { parse, lower, checkBudget } from '@ldclabs/kip-lang'

function command(source: string) {
  checkBudget(source)                       // KIP_4002 before parsing recurses
  const { ast, diagnostics } = parse(source)
  const fatal = diagnostics.find((d) => d.severity === 'error')
  if (fatal) throw new Error(`${fatal.code} ${fatal.message}`)
  return lower(ast)                         // throws KipSyntaxError
}

command('FIND(?d.name) WHERE { ?d {type: "Drug"} } LIMIT 10')
// { Kql: { find_clause: { expressions: [{ Variable: { var: "d", path: ["name"] } }] }, ... } }
```

`lower` requires the program to hold exactly one command; consecutive `UPSERT`
blocks count as one, since that is how a schema capsule is written. Use
`lowerAll` for source text that is genuinely a sequence of commands.

The `diagnostics` check above is not decoration. `parse` recovers from a
malformed string or an unquoted value by reading it leniently, and `lower`
receives only the tree — so skipping the check lowers `"a\xb"` to `axb` and
`{a: bare}` to `{a: "bare"}` without a word of complaint.

`checkBudget` is not optional for a server. `parse` is recursive descent, so
without a depth ceiling a hostile `[[[[…` overflows the JavaScript stack — and
in a runtime that shares one stack across requests, that takes down more than
the one request. The budgets match `anda_kip`'s, so a command one KIP engine
refuses on size is refused by every other engine too.

## API Reference

| Export                                       | Description                                              |
| -------------------------------------------- | -------------------------------------------------------- |
| `tokenize(source)`                           | Tokenize KIP source into `Token[]`                       |
| `parse(source)`                              | Parse into `{ ast: Program, diagnostics: Diagnostic[] }` |
| `format(source, options?)`                   | AST-based formatting with comment preservation           |
| `formatPreservingComments(source, options?)` | Line-level indent normalization                          |
| `diagnose(source)`                           | Return `Diagnostic[]` (lexer + bracket + parser errors)  |
| `analyzeSemantics(program)`                  | Spec SHOULD/MUST checks decidable without a live schema  |
| `lower(program)`                             | Lower one command to the executable `Command` AST        |
| `lowerAll(program)`                          | Lower every command in a multi-statement program         |
| `lowerStatement(statement)`                  | Lower a single statement                                 |
| `checkBudget(source)`                        | Enforce length and nesting ceilings (`KIP_4002`)         |
| `checkBatchBudget(count)`                    | Enforce the command-count ceiling (`KIP_4002`)           |
| `KipSyntaxError`                             | Thrown by `lower` / `checkBudget`, carries a KIP code    |
| `TokenType`                                  | Enum of all token types                                  |
| `KEYWORDS` / `FUNCTIONS`                     | Maps of KIP keywords and built-in functions              |

### AST Node Types

All AST types are exported for downstream consumption:

- **Statements**: `FindStatement`, `UpsertStatement`, `UpdateStatement`, `MergeStatement`, `DeleteStatement`, `DescribeStatement`, `SearchStatement`, `ExportStatement`
- **Blocks**: `ConceptBlock`, `PropositionBlock`, `SetAttributes`, `SetMetadata`, `SetPropositions`, `WithMetadata`, `ExpectVersion`
- **Patterns**: `ConceptPattern`, `PropositionPattern`, `FilterClause`, `NotClause`, `OptionalClause`, `UnionClause`
- **Expressions**: `ObjectLiteral`, `ArrayLiteral`, `ObjectEntry`, `Expression`

The executable AST is exported separately: `Command`, `KqlQuery`,
`KmlStatement`, `MetaCommand`, `ExecConceptMatcher`, `PropositionMatcher`,
`TargetTerm`, `PredTerm`, `FilterExpression`, `UpdateValue`, `KipValue`, and
friends. Names that collide with a syntax-tree node carry an `Exec` prefix.

String-or-parameter statement fields such as `SearchStatement.termValue`,
`SearchStatement.withTypeValue`, `SearchStatement.modeValue`, and
`DescribeStatement.typeNameValue` preserve whether the original source used a
quoted string or a `:parameter` placeholder.

## KIP Language

KIP is a structured query and mutation language for knowledge graphs. See the [KIP Specification](../../SPECIFICATION.md) for full syntax details.

## License

MIT
