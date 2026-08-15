# @ldclabs/kip-lang

TypeScript toolkit for **KIP** (Knowledge Interaction Protocol) — the cognitive
state protocol between an agent and a persistent Cognitive Nexus.

Provides a full-featured **lexer → parser → AST → formatter / diagnostics**
pipeline for `.kip` files, plus **`lower`**, which turns a syntax tree into the
executable AST a KIP engine runs.

The parser targets the KIP 2.0 command-text syntax — all three languages:
**KQL** (`FIND`) to read, **KML** (`ASSERT`, `MUTATE`, `CREATE`, `UPSERT`,
`UPDATE`, and the retract/supersede/archive/tombstone/purge lifecycle) to
change cognition, and **META** (`DESCRIBE`, `LIST`, `SEARCH`, `VERIFY`,
`VALIDATE`, `PREVIEW`, `HISTORY`, `CHANGES`, `SNAPSHOT`, `EXPORT CAPSULE`) to
ground and introspect. That includes the five Core element kinds (Concept,
Proposition, Assertion, Evidence, Activity), `BELIEF` / `BELIEF SLOT`
projection patterns, `STRUCTURAL` topology patterns, facets, the independent
`AS OF` / `FOR TIME` time axes, `:parameter` placeholders in full value
positions, ASCII case-insensitive keywords, JSON-compatible object literals
with unquoted identifier keys, and batch-friendly multi-command source text.
The request envelope (`kip`, `request_id`, `space`, `execution`, `ingest`,
`operations`) is JSON outside the `.kip` language and should be validated by
the caller.

## Two trees, two audiences

`parse` returns a **syntax tree**: ranges, comments, quoting style, raw number
text — everything a formatter or an editor needs to reproduce the source, and
error recovery that keeps producing a tree after a mistake.

`lower` returns the **executable AST**: every construct collapsed to the one
shape it means, with the open-ended parts of the grammar closed. The `ASSERT`
sugar desugars to exactly the `ENSURE PROPOSITION` + `CREATE ASSERTION`
(+ `SUPERSEDE`) it stands for, and nothing more; a filter becomes a
comparison, a logical node, a negation, or a call to a registered function; a
variable becomes a name and a dot path. Anything the syntax admits but the
language does not — an unknown filter function, an `UPSERT` identified by name
alone, an `UPDATE` that reaches into Assertion epistemic payload — is rejected
here, with a KIP error code.

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

Keywords are ASCII case-insensitive, so `find` and `FIND` produce the same
token type; schema symbols and string values keep their own case-sensitive
contracts.

### Parse

```ts
import { parse } from '@ldclabs/kip-lang'

const { ast, diagnostics } = parse(`
FIND(?belief.status, ?tz)
WHERE {
  ?person {type: "Person", name: "Alice"}
  ?belief BELIEF (?person, "timezone", ?tz)
}
LIMIT 10
`)

console.log(ast.statements[0].kind) // "FindStatement"
console.log(diagnostics)            // [] (no errors)
```

### Format

```ts
import { format } from '@ldclabs/kip-lang'

const source = `CREATE CONCEPT ?exp { TYPE "Experience" NAME "Deploy v2 failure" SET ATTRIBUTES { goal: :goal, outcome_status: "failure" } }`

const formatted = format(source, {
  indentSize: 4,        // default: 4
  sortAttributes: false // default: false — author key order is preserved
})
```

Output:

```kip
CREATE CONCEPT ?exp {
    TYPE "Experience"
    NAME "Deploy v2 failure"
    SET ATTRIBUTES {goal: :goal, outcome_status: "failure"}
}
```

The formatter preserves comments and quoted/unquoted key styles from the
original source. `sortAttributes` alphabetizes `SET ATTRIBUTES` keys, and skips
any block holding a comment, since reordering would detach the comment from
its key.

### Diagnose

```ts
import { diagnose } from '@ldclabs/kip-lang'

const diagnostics = diagnose('CREATE CONCEPT ?x { TYPE "Experience"')
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

command('FIND(?e.name) WHERE { ?e {type: "Experience"} } LIMIT 10')
// → the executable Command AST
```

`lower` requires the program to hold exactly one command. In KML that means
one statement — `MUTATE { ... }` is how several mutations become one
all-or-nothing cognitive transition, so a transaction is still one command.
Use `lowerAll` for source text that is genuinely a sequence of commands.

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

| Export                             | Description                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `tokenize(source)`                 | Tokenize KIP source into `Token[]`                       |
| `parse(source)`                    | Parse into `{ ast: Program, diagnostics: Diagnostic[] }` |
| `format(source, options?)`         | AST-based formatting with comment preservation           |
| `diagnose(source)`                 | Return `Diagnostic[]` (lexer + bracket + parser errors)  |
| `analyzeSemantics(program)`        | Spec SHOULD/MUST checks decidable without a live schema  |
| `lower(program)`                   | Lower one command to the executable `Command` AST        |
| `lowerAll(program)`                | Lower every command in a multi-statement program         |
| `lowerStatement(statement)`        | Lower a single statement                                 |
| `checkBudget(source)`              | Enforce length and nesting ceilings (`KIP_4002`)         |
| `checkBatchBudget(count)`          | Enforce the command-count ceiling (`KIP_4002`)           |
| `KipSyntaxError`                   | Thrown by `lower` / `checkBudget`, carries a KIP code    |
| `TokenType`                        | Enum of all token types                                  |
| `KEYWORDS` / `FUNCTIONS`           | Keyword map and built-in function set                    |
| `PARSER_VERSION` / `KIP_SPEC_REVISION` | Grammar version and the spec revision it targets     |

### AST Node Types

All AST types are exported for downstream consumption:

- **KQL**: `FindStatement`, with `AsOfClause`, `ForTimeClause`, `EpistemicClause`, `OrderByClause`, `LimitClause`, `CursorClause`
- **KML**: `MutateStatement` plus every `MutationClause` — `CreateConceptStatement`, `UpsertConceptStatement`, `EnsurePropositionStatement`, `AssertStatement`, `CreateEvidenceStatement`, `CreateAssertionStatement`, `CreateActivityStatement`, `UpdateStatement`, `RetractAssertionStatement`, `SupersedeAssertionStatement`, `CorrectEvidenceStatement`, `TransitionActivityStatement`, `SetRetentionStatement`, `ArchiveStatement`, `TombstoneStatement`, `PurgeStatement`, `MergeConceptStatement`
- **META**: `DescribeStatement`, `ListStatement`, `SearchStatement`, `VerifyStatement`, `ValidateStatement`, `PreviewStatement`, `HistoryStatement`, `ChangesStatement`, `SnapshotStatement`, `ExportCapsuleStatement`
- **Clauses**: `TypeClause`, `ClientKeyClause`, `NameClause`, `MatchClause`, `SetFieldsClause`, `SetAttributesClause`, `SetFacetClause`, `UnsetAttributesClause`, `UnsetFacetClause`, `SetStructuralClause`, `ExpectVersionClause`, `ExpectStateClause`
- **Patterns**: `ConceptPattern`, `PropositionPattern`, `AssertionPattern`, `EvidencePattern`, `ActivityPattern`, `StructuralPattern`, `BeliefPattern`, `BeliefSlotPattern`, `FilterClause`, `NotClause`, `OptionalClause`, `UnionClause`
- **Expressions**: `Expression`, `FieldAccess`, `AggregateExpr`, `FunctionCallExpr`, `ObjectLiteral`, `ObjectPattern`, `ArrayLiteral`, `ObjectEntry`

The executable AST is exported separately, and names that collide with a
syntax-tree node carry an `Exec` prefix.

String-or-parameter operands stay `ScalarValue` nodes — `SearchStatement.term`,
`SearchStatement.withType`, `DescribeStatement.value`, `ClientKeyClause.value`
— so the tree still says whether the source wrote a quoted string or a
`:parameter` placeholder.

## KIP Language

KIP 2.0 is the cognitive state protocol between an agent and a persistent
Cognitive Nexus: you read with KQL, change cognition with KML, and ground or
introspect with META. See the [KIP 2.0 Specification](../../v2/KIP-2.0-SPECIFICATION.md)
for full syntax details, or the [syntax card](../../v2/KIPSyntax.md) for a
condensed reference.

## License

MIT
