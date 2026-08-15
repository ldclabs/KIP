import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'

import { diagnose, lower, parse } from '../dist/index.js'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)

const docFiles = [
  'v2/KIPSyntax.md',
  'v2/KIPSyntax_CN.md'
]

const grammarCoverage = [
  {
    file: 'v2/grammar/KIP-2.0-KQL.ebnf',
    rule: 'query',
    productions: {
      projection_list: 'FIND(<projections>)',
      where_block: 'WHERE {',
      as_of_clause: 'AS OF SEQ',
      for_time_clause: 'FOR TIME',
      epistemic_clause: 'WITH EPISTEMIC',
      order_by_clause: 'ORDER BY',
      limit_clause: 'LIMIT ',
      cursor_clause: 'CURSOR '
    }
  },
  {
    file: 'v2/grammar/KIP-2.0-KQL.ebnf',
    rule: 'where_clause',
    productions: {
      concept_pattern: '?person {',
      proposition_pattern: 'PROPOSITION (',
      assertion_pattern: 'ASSERTION {',
      evidence_pattern: 'EVIDENCE {',
      activity_pattern: 'ACTIVITY {',
      structural_pattern: 'STRUCTURAL (',
      belief_slot_pattern: ' BELIEF SLOT (',
      belief_pattern: ' BELIEF (',
      filter_clause: 'FILTER(',
      not_clause: 'NOT {',
      optional_clause: 'OPTIONAL {',
      union_clause: 'UNION {'
    }
  },
  {
    file: 'v2/grammar/KIP-2.0-KML.ebnf',
    rule: 'kml_statement',
    productions: {
      mutate_statement: 'MUTATE {',
      create_concept: 'CREATE CONCEPT',
      upsert_concept: 'UPSERT CONCEPT',
      ensure_proposition: 'ENSURE PROPOSITION',
      assert_statement: 'ASSERT ',
      create_evidence: 'CREATE EVIDENCE',
      create_assertion: 'CREATE ASSERTION',
      create_activity: 'CREATE ACTIVITY',
      update_statement: 'UPDATE ',
      retract_assertion: 'RETRACT ASSERTION',
      supersede_assertion: 'SUPERSEDE ASSERTION',
      correct_evidence: 'CORRECT EVIDENCE',
      transition_activity: 'TRANSITION ACTIVITY',
      set_retention: 'SET RETENTION',
      archive_statement: 'ARCHIVE ',
      tombstone_statement: 'TOMBSTONE ',
      purge_statement: 'PURGE ',
      merge_concept: 'MERGE CONCEPT'
    }
  },
  {
    file: 'v2/grammar/KIP-2.0-META.ebnf',
    rule: 'meta_statement',
    productions: {
      describe_statement: 'DESCRIBE ',
      list_statement: 'LIST ',
      search_statement: 'SEARCH ',
      verify_statement: 'VERIFY ',
      validate_statement: 'VALIDATE ',
      preview_statement: 'PREVIEW ',
      history_statement: 'HISTORY ',
      changes_statement: 'CHANGES ',
      snapshot_statement: 'SNAPSHOT',
      export_capsule_statement: 'EXPORT CAPSULE'
    }
  }
]

const requiredReferenceMarkers = [
  './grammar/KIP-2.0-KQL.ebnf',
  './grammar/KIP-2.0-KML.ebnf',
  './grammar/KIP-2.0-META.ebnf',
  './schemas/kip-request.schema.json',
  './schemas/kip-response.schema.json',
  'UNSET ATTRIBUTES {obsolete, "legacy-field"}',
  'UNSET FACET "MnemonicState" {salience}',
  'payload_artifact',
  'DESCRIBE PRIMER',
  'parser-valid'
]

function fencedBlocks(markdown, language) {
  const fence = new RegExp(
    '^```' + language + '\\s*\\r?\\n([\\s\\S]*?)^```\\s*$',
    'gm'
  )
  return [...markdown.matchAll(fence)].map((match) => match[1])
}

function ruleAlternatives(grammar, rule) {
  const escapedRule = rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = grammar.match(new RegExp(`^${escapedRule}\\s*=([\\s\\S]*?);`, 'm'))
  assert.ok(match, `missing <${rule}> in grammar`)
  return match[1].match(/[a-z][a-z0-9_]*/g) ?? []
}

function assertExecutableKip(source, label) {
  const errors = diagnose(source).filter((diagnostic) => diagnostic.severity === 'error')
  assert.deepEqual(
    errors.map((error) => error.message),
    [],
    `${label} must be a clean executable KIP command`
  )

  const parsed = parse(source)
  assert.doesNotThrow(
    () => lower(parsed.ast),
    `${label} must lower as exactly one KIP command`
  )
}

describe('LLM-facing syntax references', () => {
  for (const relativePath of docFiles) {
    test(`${relativePath} keeps executable examples and surface coverage valid`, async () => {
      const markdown = await readFile(path.join(repoRoot, relativePath), 'utf8')
      const kipBlocks = fencedBlocks(markdown, 'kip')

      assert.ok(kipBlocks.length > 0, `${relativePath} must contain executable kip blocks`)
      kipBlocks.forEach((source, index) => {
        assertExecutableKip(source, `${relativePath} kip block ${index + 1}`)
      })

      const jsonBlocks = fencedBlocks(markdown, 'json')
      assert.ok(jsonBlocks.length > 0, `${relativePath} must contain a request example`)
      jsonBlocks.forEach((source, index) => {
        const value = JSON.parse(source)
        if (value.kip !== '2.0' || !Array.isArray(value.operations)) return
        for (const [operationIndex, operation] of value.operations.entries()) {
          if (typeof operation.command !== 'string') continue
          assertExecutableKip(
            operation.command,
            `${relativePath} JSON block ${index + 1}, operation ${operationIndex + 1}`
          )
        }
      })

      for (const coverage of grammarCoverage) {
        const grammar = await readFile(path.join(repoRoot, coverage.file), 'utf8')
        const alternatives = ruleAlternatives(grammar, coverage.rule).sort()
        const mappedProductions = Object.keys(coverage.productions).sort()
        assert.deepEqual(
          mappedProductions,
          alternatives,
          `${coverage.file} <${coverage.rule}> changed; update its documentation map`
        )
        for (const [production, marker] of Object.entries(coverage.productions)) {
          assert.ok(
            markdown.includes(marker),
            `${relativePath} does not cover <${production}> with marker: ${marker}`
          )
        }
      }
      for (const marker of requiredReferenceMarkers) {
        assert.ok(
          markdown.includes(marker),
          `${relativePath} is missing required reference/guard: ${marker}`
        )
      }
    })
  }

  test('English and Chinese cards keep executable examples in lockstep', async () => {
    const [english, chinese] = await Promise.all(
      docFiles.map((relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8'))
    )
    const lowerBlocks = (markdown) =>
      fencedBlocks(markdown, 'kip').map((source) => lower(parse(source).ast))
    assert.deepEqual(lowerBlocks(english), lowerBlocks(chinese))
    assert.deepEqual(fencedBlocks(english, 'json'), fencedBlocks(chinese, 'json'))
  })
})
