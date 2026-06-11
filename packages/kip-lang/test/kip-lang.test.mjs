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

  test('tokenizes RC9 keywords and update functions', () => {
    const source = `UPDATE ?link
SET METADATA { confidence: CLAMP(MUL(?link.metadata.confidence, :decay), 0.0, 1.0) }
WHERE { ?link (?s, ?p, ?o) }
MERGE CONCEPT ?dup INTO ?canonical WHERE { ?dup {type: "Person"} ?canonical {type: "Person"} }
EXPORT ?n WHERE { ?n {type: "Event"} }
SEARCH CONCEPT "headache relief" MODE "semantic" THRESHOLD 0.75 LIMIT 10`
    const tokens = tokenize(source)
    const unknowns = tokens.filter((t) => t.type === 'Unknown')
    assert.equal(unknowns.length, 0, `Found unknown tokens: ${JSON.stringify(unknowns)}`)
    for (const expected of ['UPDATE', 'MERGE', 'INTO', 'EXPORT', 'MODE', 'THRESHOLD', 'CLAMP', 'MUL']) {
      assert.ok(tokens.some((t) => t.type === expected), `Missing ${expected} token`)
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

  test('parses predicate variables and multi-key ORDER BY', () => {
    const source = `FIND(?pred, ?neighbor, ?link.metadata.confidence)
WHERE {
  ?person {type: "Person", name: "Alice"}
  ?link (?person, ?pred, ?neighbor)
  FILTER(?pred != "belongs_to_domain")
}
ORDER BY ?link.metadata.confidence DESC, ?link.metadata.created_at DESC
LIMIT 50`
    const { ast, diagnostics } = parse(source)
    const stmt = ast.statements[0]
    assert.equal(stmt.kind, 'FindStatement')
    const linkPattern = stmt.where.patterns[1]
    assert.equal(linkPattern.kind, 'PropositionPattern')
    assert.equal(linkPattern.predicate.kind, 'PredicateVariable')
    assert.equal(linkPattern.predicate.name, '?pred')
    assert.equal(stmt.orderBy.keys.length, 2)
    assert.equal(stmt.orderBy.expression.kind, 'DotExpression')
    assert.equal(stmt.orderBy.direction, 'DESC')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('rejects predicate variable path traversal and alternation syntax', () => {
    const invalidHop = parse(`FIND(?o) WHERE { (?s, ?p{1,3}, ?o) }`)
    assert.ok(
      invalidHop.diagnostics.some((d) => d.message.includes('Predicate variables cannot use hop ranges')),
      `Expected predicate-variable hop diagnostic: ${JSON.stringify(invalidHop.diagnostics)}`
    )

    const invalidAlt = parse(`FIND(?o) WHERE { (?s, ?p | "treats", ?o) }`)
    assert.ok(
      invalidAlt.diagnostics.some((d) => d.message.includes('Predicate variables cannot be used in predicate alternations')),
      `Expected predicate-variable alternation diagnostic: ${JSON.stringify(invalidAlt.diagnostics)}`
    )
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

  test('parses EXPECT VERSION in UPSERT concept and proposition blocks', () => {
    const source = `UPSERT {
  CONCEPT ?self {
    {type: "Person", name: "$self"}
    EXPECT VERSION :self_version
    SET ATTRIBUTES { behavior_preferences: :prefs }
  }
  PROPOSITION ?fact {
    (?self, "prefers", {type: "Preference", name: "Dark Mode"})
    EXPECT VERSION 3
    SET ATTRIBUTES { evidence_count: 2 }
  }
}`
    const { ast, diagnostics } = parse(source)
    const [concept, proposition] = ast.statements[0].blocks
    assert.equal(concept.kind, 'ConceptBlock')
    assert.equal(concept.expectVersion.value.kind, 'ParameterRef')
    assert.equal(proposition.kind, 'PropositionBlock')
    assert.equal(proposition.expectVersion.value.kind, 'NumberLiteral')
    assert.equal(proposition.expectVersion.value.value, 3)
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('requires EXPECT VERSION immediately after UPSERT block identity', () => {
    const source = `UPSERT {
  CONCEPT ?self {
    {type: "Person", name: "$self"}
    SET ATTRIBUTES { behavior_preferences: :prefs }
    EXPECT VERSION :self_version
  }
}`
    const { diagnostics } = parse(source)
    assert.ok(
      diagnostics.some((d) => d.message.includes("Unexpected token 'EXPECT' in CONCEPT block")),
      `Expected misplaced EXPECT diagnostic: ${JSON.stringify(diagnostics)}`
    )
  })

  test('parses named embedded proposition endpoints', () => {
    const source = `FIND(?evidence, ?y)
WHERE {
  (?paper, "cites", ?evidence (?drug, "treats", ?symptom))
  (?e, "involves", ?y {type: "Person", name: "Yan"})
}`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    const [cites, involves] = ast.statements[0].where.patterns
    assert.equal(cites.kind, 'PropositionPattern')
    assert.equal(cites.object.kind, 'PropositionPattern')
    assert.equal(cites.object.variable, '?evidence')
    assert.equal(cites.object.subject.name, '?drug')
    assert.equal(cites.object.object.name, '?symptom')
    assert.equal(involves.kind, 'PropositionPattern')
    assert.equal(involves.object.kind, 'ConceptPattern')
    assert.equal(involves.object.variable, '?y')
    assert.equal(involves.object.matcher.entries[0].key, 'type')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('parses named embedded proposition endpoints in UPSERT targets', () => {
    const source = `UPSERT {
  CONCEPT ?claim {
    {type: "Insight", name: "Claim"}
    SET PROPOSITIONS {
      ("supports", ?evidence (?drug, "treats", ?symptom))
    }
  }
}`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    const target = ast.statements[0].blocks[0].setPropositions.items[0].target
    assert.equal(target.kind, 'PropositionPattern')
    assert.equal(target.variable, '?evidence')
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

  test('parses parameterized DESCRIBE type names and cursors', () => {
    const source = `DESCRIBE CONCEPT TYPE :type_name LIMIT :limit CURSOR :cursor`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    const stmt = ast.statements[0]
    assert.equal(stmt.kind, 'DescribeStatement')
    assert.equal(stmt.describeType, 'CONCEPT_TYPE')
    assert.equal(stmt.typeName, ':type_name')
    assert.equal(stmt.typeNameValue.kind, 'ParameterRef')
    assert.equal(stmt.typeNameValue.name, ':type_name')
    assert.equal(stmt.limit.value.kind, 'ParameterRef')
    assert.equal(stmt.cursor.value.kind, 'ParameterRef')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors)}`)
  })

  test('reports missing commas between object entries', () => {
    const source = `FIND(?drug)
WHERE {
  ?drug {type: "Drug" name: "Aspirin"}
}`
    const { diagnostics } = parse(source)
    assert.ok(
      diagnostics.some((d) => d.message.includes("Expected ',' or '}'")),
      `Expected missing-comma diagnostic: ${JSON.stringify(diagnostics)}`
    )
  })

  test('parses SEARCH statements', () => {
    const source = `SEARCH CONCEPT "aspirin" WITH TYPE "Drug" LIMIT 5`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    assert.equal(ast.statements[0].kind, 'SearchStatement')
    assert.equal(ast.statements[0].term, 'aspirin')
    assert.equal(ast.statements[0].termValue.kind, 'StringLiteral')
    assert.equal(ast.statements[0].withType, 'Drug')
    assert.equal(ast.statements[0].withTypeValue.kind, 'StringLiteral')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors)}`)
  })

  test('parses parameterized SEARCH statements', () => {
    const source = `SEARCH PROPOSITION :search_term WITH TYPE :predicate LIMIT :limit`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 1)
    const stmt = ast.statements[0]
    assert.equal(stmt.kind, 'SearchStatement')
    assert.equal(stmt.term, ':search_term')
    assert.equal(stmt.termValue.kind, 'ParameterRef')
    assert.equal(stmt.termValue.name, ':search_term')
    assert.equal(stmt.withType, ':predicate')
    assert.equal(stmt.withTypeValue.kind, 'ParameterRef')
    assert.equal(stmt.withTypeValue.name, ':predicate')
    assert.equal(stmt.limit.value.kind, 'ParameterRef')
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors)}`)
  })

  test('parses SEARCH retrieval modes and thresholds', () => {
    const cases = [
      `SEARCH CONCEPT "headache relief" MODE "semantic" THRESHOLD 0.75 LIMIT 10`,
      `SEARCH PROPOSITION :term WITH TYPE :predicate MODE :mode THRESHOLD :threshold LIMIT :limit`
    ]
    for (const source of cases) {
      const { ast, diagnostics } = parse(source)
      const stmt = ast.statements[0]
      assert.equal(stmt.kind, 'SearchStatement')
      assert.ok(stmt.modeValue, `Missing MODE for ${source}`)
      assert.ok(stmt.threshold, `Missing THRESHOLD for ${source}`)
      const errors = diagnostics.filter((d) => d.severity === 'error')
      assert.equal(errors.length, 0, `Parse errors for "${source}": ${JSON.stringify(errors)}`)
    }
  })

  test('parses UPDATE, MERGE, and EXPORT statements', () => {
    const source = `UPDATE ?link
SET METADATA {
  confidence: CLAMP(MUL(?link.metadata.confidence, :decay_factor), 0.0, 1.0),
  access_count: ADD(COALESCE(?link.metadata.access_count, 0), 1)
}
WHERE {
  ?link (?s, ?p, ?o)
  FILTER(?link.metadata.confidence > 0.3)
}
LIMIT :limit

MERGE CONCEPT ?dup INTO ?canonical
WHERE {
  ?dup {type: "SkillTopic", name: "JS"}
  ?canonical {type: "SkillTopic", name: "JavaScript"}
}

EXPORT ?n
WHERE {
  (?n, "belongs_to_domain", {type: "Domain", name: "Medical"})
}
LIMIT 500`
    const { ast, diagnostics } = parse(source)
    assert.equal(ast.statements.length, 3)
    assert.equal(ast.statements[0].kind, 'UpdateStatement')
    assert.equal(ast.statements[0].setMetadata.entries.length, 2)
    assert.equal(ast.statements[0].limit.value.kind, 'ParameterRef')
    assert.equal(ast.statements[1].kind, 'MergeStatement')
    assert.equal(ast.statements[2].kind, 'ExportStatement')
    assert.equal(ast.statements[2].limit.value.value, 500)
    const errors = diagnostics.filter((d) => d.severity === 'error')
    assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors, null, 2)}`)
  })

  test('parses JSON unicode escapes in strings', () => {
    const source = `FIND(?n) WHERE { ?n {name: "A\\u0042"} }`
    const { ast, diagnostics } = parse(source)
    assert.equal(diagnostics.filter((d) => d.severity === 'error').length, 0)
    const matcher = ast.statements[0].where.patterns[0].matcher
    assert.equal(matcher.entries[0].value.parsed, 'AB')
  })

  test('does not tokenize incomplete exponents as numbers', () => {
    const tokens = tokenize('FIND(?n) WHERE { FILTER(?n.attributes.score > 1e) }')
    const numbers = tokens.filter((t) => t.type === 'Number').map((t) => t.value)
    assert.deepEqual(numbers, ['1'])
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

  test('formats RC9 predicate variables and multi-key ORDER BY', () => {
    const source = `FIND(?pred, ?neighbor) WHERE { ?link (?person, ?pred, ?neighbor) } ORDER BY ?link.metadata.confidence DESC, ?link.metadata.created_at DESC LIMIT 50`
    const result = format(source)
    assert.ok(
      result.includes('ORDER BY ?link.metadata.confidence DESC, ?link.metadata.created_at DESC'),
      result
    )
    assert.ok(result.includes('?link (?person, ?pred, ?neighbor)'), result)
    const reparsed = parse(result)
    assert.equal(reparsed.diagnostics.filter((d) => d.severity === 'error').length, 0)
  })

  test('formats proposition id matchers', () => {
    const source = `FIND(?fact) WHERE { ?fact (id: "P:12345:treats") }`
    const result = format(source)
    assert.ok(result.includes('?fact (id: "P:12345:treats")'), result)
    const reparsed = parse(result)
    assert.equal(reparsed.diagnostics.filter((d) => d.severity === 'error').length, 0)
  })

  test('formats named embedded proposition endpoints', () => {
    const source = `FIND(?evidence, ?y) WHERE { (?paper, "cites", ?evidence (?drug, "treats", ?symptom)) (?e, "involves", ?y {type: "Person", name: "Yan"}) }`
    const result = format(source)
    assert.ok(result.includes('(?paper, "cites", ?evidence (?drug, "treats", ?symptom))'), result)
    assert.ok(result.includes('(?e, "involves", ?y {type: "Person", name: "Yan"})'), result)
    const reparsed = parse(result)
    assert.equal(reparsed.diagnostics.filter((d) => d.severity === 'error').length, 0)
  })

  test('formats parameterized SEARCH statements', () => {
    const source = `SEARCH CONCEPT :search_term WITH TYPE :type LIMIT :limit`
    const result = format(source)
    assert.equal(result.trim(), 'SEARCH CONCEPT :search_term WITH TYPE :type LIMIT :limit')
  })

  test('formats SEARCH mode and threshold', () => {
    const source = `SEARCH CONCEPT :term MODE :mode THRESHOLD :threshold LIMIT :limit`
    const result = format(source)
    assert.equal(result.trim(), 'SEARCH CONCEPT :term MODE :mode THRESHOLD :threshold LIMIT :limit')
  })

  test('formats EXPECT VERSION and RC9 mutation statements', () => {
    const source = `UPSERT { CONCEPT ?self { {type: "Person", name: "$self"} EXPECT VERSION :v SET ATTRIBUTES { behavior_preferences: :prefs } } } UPDATE ?pref SET ATTRIBUTES { evidence_count: ADD(COALESCE(?pref.attributes.evidence_count, 0), 1) } SET METADATA { observed_at: :timestamp } WHERE { ?pref {type: "Preference", name: :pref_name} } LIMIT :limit MERGE CONCEPT ?dup INTO ?canonical WHERE { ?dup {type: "SkillTopic", name: "JS"} ?canonical {type: "SkillTopic", name: "JavaScript"} } EXPORT ?n WHERE { ?n {type: "Event"} } LIMIT 20`
    const result = format(source)
    assert.ok(result.includes('EXPECT VERSION :v'), result)
    assert.ok(result.includes('UPDATE ?pref'), result)
    assert.ok(result.includes('SET METADATA { observed_at: :timestamp }'), result)
    assert.ok(result.includes('MERGE CONCEPT ?dup INTO ?canonical'), result)
    assert.ok(result.includes('EXPORT ?n'), result)
    const reparsed = parse(result)
    assert.equal(reparsed.diagnostics.filter((d) => d.severity === 'error').length, 0)
  })

  test('formats parameterized DESCRIBE statements', () => {
    const source = `DESCRIBE PROPOSITION TYPE :predicate LIMIT :limit CURSOR :cursor`
    const result = format(source)
    assert.equal(
      result.trim(),
      'DESCRIBE PROPOSITION TYPE :predicate LIMIT :limit CURSOR :cursor'
    )
  })

  test('formats SEARCH statements with empty WITH TYPE values', () => {
    const source = `SEARCH CONCEPT "" WITH TYPE "" LIMIT 1`
    const result = format(source)
    assert.equal(result.trim(), 'SEARCH CONCEPT "" WITH TYPE "" LIMIT 1')
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

  test('reports invalid JSON-compatible literals', () => {
    const source = `FIND(?n)
WHERE {
  ?n {name: "bad\\q", score: 01}
}`
    const diags = diagnose(source)
    assert.ok(
      diags.some((d) => d.code === 'KIP_LEX_INVALID_STRING'),
      `Expected invalid string diagnostic: ${JSON.stringify(diags)}`
    )
    assert.ok(
      diags.some((d) => d.code === 'KIP_LEX_INVALID_NUMBER'),
      `Expected invalid number diagnostic: ${JSON.stringify(diags)}`
    )
  })
})
