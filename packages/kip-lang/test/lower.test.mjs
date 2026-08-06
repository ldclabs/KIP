import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  parse,
  lower,
  lowerAll,
  checkBudget,
  checkBatchBudget,
  MAX_KIP_NESTING_DEPTH,
  MAX_KIP_INPUT_LEN,
  MAX_KIP_BATCH_COMMANDS,
  PARSER_VERSION,
  KIP_SPEC_REVISION
} from '../dist/index.js'

/** Parses and lowers, the way an engine calls this package. */
function command(source) {
  checkBudget(source)
  const { ast, diagnostics } = parse(source)
  const fatal = diagnostics.find((d) => d.severity === 'error')
  if (fatal) {
    const err = new Error(fatal.message)
    err.code = fatal.code
    throw err
  }
  return lower(ast)
}

function rejects(source, match) {
  assert.throws(
    () => command(source),
    match ? { message: match } : undefined,
    `expected ${JSON.stringify(source)} to be rejected`
  )
}

describe('budget', () => {
  test('rejects input past the length ceiling', () => {
    const long = `FIND(?x) WHERE { ?x {name: "${'a'.repeat(MAX_KIP_INPUT_LEN)}"} }`
    assert.throws(() => checkBudget(long), { code: 'KIP_4002' })
  })

  test('rejects nesting past the depth ceiling before parsing recurses', () => {
    const deep = '['.repeat(MAX_KIP_NESTING_DEPTH + 1)
    assert.throws(() => checkBudget(deep), { code: 'KIP_4002' })
    // One level under the ceiling is fine, so the guard is not off by one.
    checkBudget('['.repeat(MAX_KIP_NESTING_DEPTH))
  })

  test('does not let a quote inside a comment latch string mode', () => {
    // If the scan mistook this for an open string it would stop counting
    // brackets, and the depth ceiling would quietly stop existing.
    const source = `// a stray " quote\n${'['.repeat(MAX_KIP_NESTING_DEPTH + 1)}`
    assert.throws(() => checkBudget(source), { code: 'KIP_4002' })
  })

  test('rejects an over-long batch', () => {
    checkBatchBudget(MAX_KIP_BATCH_COMMANDS)
    assert.throws(() => checkBatchBudget(MAX_KIP_BATCH_COMMANDS + 1), {
      code: 'KIP_4002'
    })
  })
})

describe('lower: shape', () => {
  test('collapses a concept matcher to its identified form', () => {
    const byId = command('FIND(?x) WHERE { ?x {id: "C:1"} }')
    assert.deepEqual(byId.Kql.where_clauses[0], {
      Concept: { variable: 'x', matcher: { ID: 'C:1' } }
    })
    const byBoth = command('FIND(?x) WHERE { ?x {type: "T", name: "n"} }')
    assert.deepEqual(byBoth.Kql.where_clauses[0].Concept.matcher, {
      Object: { type: 'T', name: 'n' }
    })
  })

  test('strips the ? sigil from every variable position', () => {
    const cmd = command('FIND(?d.name) WHERE { ?d {type: "T"} (?d, "p", ?o) }')
    assert.deepEqual(cmd.Kql.find_clause.expressions[0], {
      Variable: { var: 'd', path: ['name'] }
    })
    const { subject, object } = cmd.Kql.where_clauses[1].Proposition.matcher.Object
    assert.deepEqual(subject, { Variable: 'd' })
    assert.deepEqual(object, { Variable: 'o' })
  })

  test('reads COUNT(DISTINCT ?x) as one aggregation', () => {
    const cmd = command('FIND(COUNT(DISTINCT ?x)) WHERE { ?x {type: "T"} }')
    assert.deepEqual(cmd.Kql.find_clause.expressions[0], {
      Aggregation: { func: 'Count', var: { var: 'x', path: [] }, distinct: true }
    })
  })

  test('folds consecutive UPSERT blocks into one command', () => {
    const cmd = command(
      `UPSERT { CONCEPT ?a { {type: "T", name: "a"} } }
       UPSERT { CONCEPT ?b { {type: "T", name: "b"} } }`
    )
    assert.equal(cmd.Kml.Upsert.length, 2)
    assert.equal(cmd.Kml.Upsert[0].items[0].Concept.handle, 'a')
  })

  test('lowerAll keeps a multi-statement program as separate commands', () => {
    const { ast } = parse(
      `FIND(?x) WHERE { ?x {type: "T"} } LIMIT 1
       DESCRIBE PRIMER`
    )
    const commands = lowerAll(ast)
    assert.equal(commands.length, 2)
    assert.deepEqual(commands[1], { Meta: { Describe: 'Primer' } })
  })

  test('omits absent optional wire fields', () => {
    const search = command('SEARCH CONCEPT "a"').Meta.Search
    assert.equal('mode' in search, false)
    assert.equal('threshold' in search, false)
    assert.equal(search.in_type, null)

    const exported = command('EXPORT ?x WHERE { ?x {type: "T"} }').Meta.Export
    assert.equal('cursor' in exported, false)
    assert.equal(exported.limit, null)

    const upserted = command('UPSERT { CONCEPT ?c { {id: "C:1"} } }')
    assert.equal('expect_version' in upserted.Kml.Upsert[0].items[0].Concept, false)
  })

  test('normalizes -0 to 0 wherever a number is carried', () => {
    const threshold = command('SEARCH CONCEPT "a" THRESHOLD -0').Meta.Search
      .threshold
    assert.ok(Object.is(threshold, 0))
    const attr = command(
      'UPSERT { CONCEPT ?c { {id: "C:1"} SET ATTRIBUTES { n: -0 } } }'
    ).Kml.Upsert[0].items[0].Concept.set_attributes.n
    assert.ok(Object.is(attr, 0))
  })
})

describe('lower: rejections the syntax alone would allow', () => {
  test('a concept matcher must identify something, once', () => {
    rejects('FIND(?x) WHERE { ?x {} }')
    rejects('FIND(?x) WHERE { ?x {foo: "a"} }', /invalid key/)
    rejects('FIND(?x) WHERE { ?x {type: "A", type: "B"} }', /duplicate key/)
    rejects('FIND(?x) WHERE { ?x {id: "1", type: "T"} }', /cannot combine id/)
    rejects('FIND(?x) WHERE { ?x {type: 1} }', /quoted string or null/)
  })

  test('a KML target must address exactly one element', () => {
    rejects('UPSERT { CONCEPT ?c { {type: "T"} } }', /addressed by/)
    rejects('UPSERT { CONCEPT ?c { {name: "n"} } }', /addressed by/)
    rejects('UPSERT { PROPOSITION ?p { (?s, ?pred, ?o) } }', /addressed by/)
    rejects('UPSERT { PROPOSITION ?p { (?s, "a"|"b", ?o) } }', /addressed by/)
    // A handle is resolved by the enclosing block, so it is already unique.
    command(
      'UPSERT { CONCEPT ?c { {id: "C:1"} } PROPOSITION { (?c, "p", ?c) } }'
    )
  })

  test('FILTER functions are a closed set with fixed arity', () => {
    // `FOO(...)` never reaches lowering: the parser has no production for a
    // call to an unknown name, so it is rejected as a bare value first.
    rejects('FIND(?x) WHERE { ?x {type: "T"} FILTER(FOO(?x.n, 1)) }')
    rejects('FIND(?x) WHERE { ?x {type: "T"} FILTER(MEDIAN(?x.n) == 1) }')
    rejects('FIND(?x) WHERE { ?x {type: "T"} FILTER(CONTAINS(?x.n)) }', /exactly 2 arguments/)
    rejects('FIND(?x) WHERE { ?x {type: "T"} FILTER(IN(?x.n, 1)) }', /literal list/)
    rejects('FIND(?x) WHERE { ?x {type: "T"} FILTER(?x.flag) }', /comparison/)
    command('FIND(?x) WHERE { ?x {type: "T"} FILTER(IN(?x.n, [1, 2])) }')
  })

  test('an UPDATE expression may only read its own target', () => {
    rejects(
      'UPDATE ?a SET ATTRIBUTES { n: ADD(?b.attributes.n, 1) } WHERE { ?a {type: "T"} (?a, "p", ?b) }',
      /only use dot-notation paths on the UPDATE target/
    )
    rejects(
      'UPDATE ?a SET ATTRIBUTES { n: ADD(1) } WHERE { ?a {type: "T"} }',
      /exactly 2 arguments/
    )
    rejects(
      'UPDATE ?a SET ATTRIBUTES { } WHERE { ?a {type: "T"} }',
      /at least one/
    )
    command(
      'UPDATE ?a SET ATTRIBUTES { n: CLAMP(MUL(?a.attributes.n, 0.5), 0.0, 1.0) } WHERE { ?a {type: "T"} }'
    )
  })

  test('pagination operands are checked', () => {
    rejects('FIND(?x) WHERE { ?x {type: "T"} } LIMIT 0', /positive integer/)
    rejects('DESCRIBE CONCEPT TYPES CURSOR ""', /non-empty/)
    rejects('SEARCH CONCEPT "a" MODE "fuzzy"', /invalid SEARCH mode/)
    rejects('SEARCH CONCEPT "a" THRESHOLD 1.5', /between 0.0 and 1.0/)
  })

  test('integers must survive the wire format', () => {
    rejects(
      'UPSERT { CONCEPT ?c { {id: "C:1"} SET ATTRIBUTES { n: 18446744073709551617 } } }',
      /out of range/
    )
    rejects(
      'UPSERT { CONCEPT ?c { {id: "C:1"} SET ATTRIBUTES { n: 02 } } }',
      /invalid number literal/
    )
  })

  test('parameters are not substituted by this lowering', () => {
    rejects('FIND(?x) WHERE { ?x {name: :who} } LIMIT 5')
  })

  test('a source holding two unrelated commands is not one command', () => {
    rejects(
      `FIND(?x) WHERE { ?x {type: "T"} } LIMIT 1
       DESCRIBE PRIMER`,
      /single KIP command/
    )
    rejects('', /found none/)
  })

  test('DELETE CONCEPT requires DETACH', () => {
    rejects('DELETE CONCEPT ?x WHERE { ?x {id: "C:1"} }', /DETACH/)
    command('DELETE CONCEPT ?x DETACH WHERE { ?x {id: "C:1"} }')
  })
})

describe('parser strictness the executable form depends on', () => {
  test('keywords need a word boundary', () => {
    rejects('DELETE ATTRIBUTES {"a"} FROM?x WHERE { ?x {id: "1"} }')
    rejects('DESCRIBE CONCEPT TYPE"Drug"')
    rejects('MERGE CONCEPT ?a INTO?b WHERE { ?a {id: "1"} ?b {id: "2"} }')
  })

  test('statement introducers need real whitespace', () => {
    rejects('UPSERT{ CONCEPT ?c { {id: "C:1"} } }')
    command('UPSERT {CONCEPT ?c { {id: "C:1"} } }')
  })

  test('two-word keywords are joined by whitespace only', () => {
    rejects(
      'UPDATE ?a SET//c\n METADATA { n: 1 } WHERE { ?a {type: "T"} }'
    )
    command('UPDATE ?a SET METADATA { n: 1 } WHERE { ?a {type: "T"} }')
  })

  test('a dot path carries no whitespace', () => {
    rejects('FIND(?x) WHERE { ?x {type: "T"} } ORDER BY ?x.name. ASC')
    rejects('FIND(?x. name) WHERE { ?x {type: "T"} }')
  })

  test('a clause may not repeat', () => {
    rejects('SEARCH CONCEPT "a" LIMIT 1 LIMIT 2', /Duplicate LIMIT/)
  })

  test('a hop count is a plain 16-bit integer', () => {
    rejects('FIND(?y) WHERE { ?x {id: "1"} (?x, "p"{1e9,}, ?y) }')
    rejects('FIND(?y) WHERE { ?x {id: "1"} (?x, "p"{1,99999}, ?y) }')
    rejects('FIND(?y) WHERE { ?x {id: "1"} (?x, "p"{3,1}, ?y) }', /cannot be greater/)
    command('FIND(?y) WHERE { ?x {id: "1"} (?x, "p"{1,3}, ?y) }')
  })

  test('strings are JSON strings', () => {
    rejects('UPSERT { CONCEPT ?c { {type: "T", name: "a\\x"} } }')
    rejects('FIND(?x) WHERE { ?x {name: "unterminated} }')
  })

  test('a malformed sub-clause terminates the parse instead of spinning', () => {
    // Regression: `expect` reports without consuming, so a loop keyed on the
    // offending token used to build diagnostics until the heap gave out.
    const { diagnostics } = parse(
      'UPSERT { CONCEPT ?a { {id: "C:1"} SET PROPOSITIONS { ("p", x", {id: "C:2"}) } } }'
    )
    assert.ok(diagnostics.length > 0)
    assert.ok(diagnostics.length < 100, `runaway diagnostics: ${diagnostics.length}`)
  })
})

describe('version', () => {
  test('PARSER_VERSION tracks package.json', async () => {
    const pkg = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8')
    )
    assert.equal(PARSER_VERSION, pkg.version)
  })

  test('the spec revision is a KIP revision string', () => {
    assert.match(KIP_SPEC_REVISION, /^v\d+\.\d+(-RC\d+)?$/)
  })
})
