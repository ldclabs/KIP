import { tokenize, parse, format, diagnose } from '../dist/index.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

const __dirname = dirname(fileURLToPath(import.meta.url))
const capsDir = join(__dirname, '..', '..', '..', 'capsules')

describe('tokenize', () => {
  test('tracks EOF position at the end of the source', () => {
    const source = `FIND(?x)
WHERE {
  ?x {type: "Drug"}
}`
    const tokens = tokenize(source)
    const eof = tokens.at(-1)
    assert.equal(eof.type, 'EOF')
    assert.equal(eof.line, 3)
    assert.equal(eof.column, 1)
  })

  test('tokenizes Genesis.kip without unknown tokens', () => {
    const source = readFileSync(join(capsDir, 'Genesis.kip'), 'utf-8')
    const tokens = tokenize(source)
    const unknowns = tokens.filter((t) => t.type === 'Unknown')
    assert.equal(unknowns.length, 0, `Found unknown tokens: ${JSON.stringify(unknowns)}`)
  })

  test('tokenizes all capsule .kip files', () => {
    const files = ['Genesis.kip', 'Event.kip', 'Person.kip', 'Preference.kip', 'SleepTask.kip']
    for (const f of files) {
      const source = readFileSync(join(capsDir, f), 'utf-8')
      const tokens = tokenize(source)
      const unknowns = tokens.filter((t) => t.type === 'Unknown')
      assert.equal(unknowns.length, 0, `Unknown tokens in ${f}: ${JSON.stringify(unknowns)}`)
    }
  })

  test('tokenizes persons/*.kip files', () => {
    const files = ['persons/self.kip', 'persons/system.kip']
    for (const f of files) {
      const source = readFileSync(join(capsDir, f), 'utf-8')
      const tokens = tokenize(source)
      const unknowns = tokens.filter((t) => t.type === 'Unknown')
      assert.equal(unknowns.length, 0, `Unknown tokens in ${f}: ${JSON.stringify(unknowns)}`)
    }
  })
})

describe('parse', () => {
  test('parses Genesis.kip without errors', () => {
    const source = readFileSync(join(capsDir, 'Genesis.kip'), 'utf-8')
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.kind, 'Program')
    assert.ok(ast.statements.length > 0, 'Should have statements')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('parses all capsule .kip files', () => {
    const files = ['Genesis.kip', 'Event.kip', 'Person.kip', 'Preference.kip', 'SleepTask.kip']
    for (const f of files) {
      const source = readFileSync(join(capsDir, f), 'utf-8')
      const { ast, diagnostics } = parse(source)
      assert.equal(ast.kind, 'Program', `${f}: Should produce a Program AST`)
      const errors = diagnostics.filter((d) => d.severity === 'error')
      assert.equal(errors.length, 0, `Parse errors in ${f}: ${JSON.stringify(errors, null, 2)}`)
    }
  })

  test('parses FIND statement', () => {
    const source = `FIND(?drug.name, ?drug.attributes.risk_level)
WHERE {
  ?drug {type: "Drug"}
  (?drug, "treats", {name: "Headache"})
  FILTER(?drug.attributes.risk_level < 4)
}
ORDER BY ?drug.attributes.risk_level ASC
LIMIT 20`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    assert.equal(ast.statements[0].kind, 'FindStatement')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('keeps final statement ranges on the final source line', () => {
    const source = `FIND(?x)
WHERE {
  ?x {type: "Drug"}
}`
    const { ast, diagnostics } = parse(source)
    assert.equal(diagnostics.filter((d) => d.severity === 'error').length, 0)
    assert.equal(ast.statements[0].kind, 'FindStatement')
    assert.ok(ast.statements[0].range.end.line >= 3)
    assert.ok(ast.statements[0].where.range.end.line >= 3)
  })

  test('parses RC6 filter functions, aggregation, and parameters', () => {
    const source = `FIND(?event.attributes.event_class, COUNT(DISTINCT ?participant))
WHERE {
  ?event {type: "Event"}
  OPTIONAL { (?event, "has_participant", ?participant) }
  FILTER(IN(?event.attributes.event_class, ["Conversation", "SelfReflection"]))
  FILTER(IS_NULL(?event.metadata.expires_at) || ?event.metadata.expires_at > :now)
}
LIMIT :limit
CURSOR :cursor`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    assert.equal(ast.statements[0].kind, 'FindStatement')
    assert.equal(ast.statements[0].limit.value.kind, 'ParameterRef')
    assert.equal(ast.statements[0].cursor.value.kind, 'ParameterRef')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('parses proposition id matchers', () => {
    const source = `FIND(?fact)
WHERE {
  ?fact (id: "P:12345:treats")
}`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    const pattern = ast.statements[0].where.patterns[0]
    assert.equal(pattern.kind, 'PropositionPattern')
    assert.equal(pattern.id.parsed, 'P:12345:treats')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('parses proposition id matchers in UPSERT blocks and targets', () => {
    const source = `UPSERT {
  PROPOSITION ?fact {
    (id: :fact_id)
    SET ATTRIBUTES { confidence: 0.8 }
  }
  CONCEPT ?claim {
    {type: "Insight", name: "Claim"}
    SET PROPOSITIONS {
      ("supports", (id: "P:456:supports"))
    }
  }
}
WITH METADATA { source: :source }`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    const [factBlock, claimBlock] = ast.statements[0].blocks
    assert.equal(factBlock.kind, 'PropositionBlock')
    assert.equal(factBlock.id.kind, 'ParameterRef')
    assert.equal(claimBlock.kind, 'ConceptBlock')
    assert.equal(claimBlock.setPropositions.items[0].target.kind, 'PropositionPattern')
    assert.equal(claimBlock.setPropositions.items[0].target.id.parsed, 'P:456:supports')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('parses DELETE statements', () => {
    const source = `DELETE ATTRIBUTES {"risk_category", "old_id"} FROM ?drug
WHERE {
  ?drug {type: "Drug", name: "Aspirin"}
}`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    assert.equal(ast.statements[0].kind, 'DeleteStatement')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('requires DETACH for DELETE CONCEPT', () => {
    const valid = `DELETE CONCEPT ?drug DETACH
WHERE {
  ?drug {type: "Drug", name: "OutdatedDrug"}
}`
    const validResult = parse(valid)
    assert.equal(validResult.diagnostics.filter((d) => d.severity === 'error').length, 0)

    const invalid = `DELETE CONCEPT ?drug
WHERE {
  ?drug {type: "Drug", name: "OutdatedDrug"}
}`
    const invalidResult = parse(invalid)
    assert.ok(
      invalidResult.diagnostics.some((d) => d.message.includes('DETACH')),
      `Expected DETACH diagnostic: ${JSON.stringify(invalidResult.diagnostics)}`
    )
  })

  test('parses DESCRIBE statements', () => {
    const cases = [
      'DESCRIBE PRIMER',
      'DESCRIBE DOMAINS',
      'DESCRIBE CONCEPT TYPES',
      'DESCRIBE CONCEPT TYPE "Drug"',
      'DESCRIBE PROPOSITION TYPES LIMIT 10',
      'DESCRIBE PROPOSITION TYPE "treats"',
    ]
    for (const source of cases) {
      const { ast, diagnostics } = parse(source)
      assert.equal(ast.statements.length, 1, `Failed for: ${source}`)
      assert.equal(ast.statements[0].kind, 'DescribeStatement')
      const errors = diagnostics.filter((d) => d.severity === 'error')
      assert.equal(errors.length, 0, `Parse errors for "${source}": ${JSON.stringify(errors)}`)
    }
  })

  test('parses SEARCH statements', () => {
    const source = `SEARCH CONCEPT "aspirin" WITH TYPE "Drug" LIMIT 5`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    assert.equal(ast.statements[0].kind, 'SearchStatement')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors)}`)
  })
})

describe('format', () => {
  test('formats simple UPSERT', () => {
    const source = `UPSERT {
CONCEPT ?drug {
{type: "Drug", name: "Aspirin"}
SET ATTRIBUTES {
risk_level: 2,
description: "Pain reliever"
}
}
}
WITH METADATA {
source: "manual",
confidence: 0.9
}`
    const result = format(source)
    assert.ok(result.includes('UPSERT {'), 'Should contain UPSERT')
    assert.ok(result.includes('CONCEPT ?drug {'), 'Should contain CONCEPT')
    assert.ok(result.includes('SET ATTRIBUTES {'), 'Should contain SET ATTRIBUTES')
    // Check indentation
    const lines = result.split('\n')
    const conceptLine = lines.find((l) => l.includes('CONCEPT ?drug'))
    assert.ok(conceptLine?.startsWith('    '), 'CONCEPT should be indented with 4 spaces')
  })

  test('formats FIND with WHERE', () => {
    const source = `FIND(?drug.name) WHERE { ?drug {type: "Drug"} } LIMIT 10`
    const result = format(source)
    assert.ok(result.includes('FIND'), 'Should contain FIND')
    assert.ok(result.includes('WHERE'), 'Should contain WHERE')
    assert.ok(result.includes('LIMIT 10'), 'Should contain LIMIT')
  })

  test('formats COUNT DISTINCT using KIP syntax', () => {
    const source = `FIND(COUNT(DISTINCT ?n)) WHERE { ?n {type: "Event"} }`
    const result = format(source)
    assert.ok(result.includes('COUNT(DISTINCT ?n)'), result)
    assert.ok(!result.includes('DISTINCT('), result)
  })

  test('formats proposition id matchers', () => {
    const source = `FIND(?fact) WHERE { ?fact (id: "P:12345:treats") }`
    const result = format(source)
    assert.ok(result.includes('?fact (id: "P:12345:treats")'), result)
    const reparsed = parse(result)
    assert.equal(reparsed.diagnostics.filter((d) => d.severity === 'error').length, 0)
  })

  test('does not format invalid KIP', () => {
    const source = `UPSERT { CONCEPT ?x { {type: "Drug"} }`
    assert.throws(() => format(source), /Cannot format invalid KIP/)
  })
})

describe('diagnose', () => {
  test('reports no errors for valid Genesis.kip', () => {
    const source = readFileSync(join(capsDir, 'Genesis.kip'), 'utf-8')
    const diags = diagnose(source)
    const errors = diags.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Unexpected errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('reports unterminated string', () => {
    const source = `UPSERT { CONCEPT ?x { {type: "Drug, name: "Test"} } }`
    const diags = diagnose(source)
    assert.ok(diags.length > 0, 'Should report at least one diagnostic')
  })

  test('reports unclosed brace', () => {
    const source = `UPSERT { CONCEPT ?x { {type: "Drug"} }`
    const diags = diagnose(source)
    assert.ok(diags.length > 0, 'Should report unclosed brace')
  })
})
