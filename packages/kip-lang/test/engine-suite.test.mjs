import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { parse } from '../dist/index.js'
import { loadEngineSuite, runEngineSuite, normalize, flatten } from '../../../conformance/engine-runner.mjs'

const root = new URL('../../../', import.meta.url)
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const fixtures = await loadEngineSuite(new URL('conformance/engine-suite/', root))
const manifest = await json('conformance/engine-suite/manifest.json')
// Cases whose expected answer is a parse-time rejection may not parse.
const SYNTAX = new Set(['InvalidSyntax', 'InvalidIdentifier', 'LanguageMismatch'])

test('engine suite: the manifest counts what ships', () => {
  assert.equal(fixtures.length, manifest.fixtures)
  assert.equal(fixtures.reduce((n, f) => n + f.cases.length, 0), manifest.cases)
  assert.ok(manifest.source.fixtures_commit.match(/^[0-9a-f]{40}$/))
})

test('engine suite: every setup and case command is current KIP syntax', () => {
  for (const fixture of fixtures) {
    for (const setup of fixture.setup ?? []) {
      const errors = parse(setup).diagnostics.filter(d => d.severity === 'error')
      assert.deepEqual(errors.map(e => e.message), [], `${fixture.name} setup`)
    }
    for (const c of fixture.cases) {
      if (SYNTAX.has(c.expect?.error)) continue
      if (c.expect?.error === 'ConstraintViolation' && /CONFIRM "purge"|EXPECT VERSION 1\s+SET/.test(c.command)) continue
      const errors = parse(c.command).diagnostics.filter(d => d.severity === 'error')
      assert.deepEqual(errors.map(e => e.message), [], `${fixture.name}: ${c.name}`)
    }
  }
})

test('engine suite: every cited vector exists in the parent suite', async () => {
  const docs = await Promise.all(['KIP-2.0-Conformance-Tests.md', 'KIP-2.0-Cognitive-Tests.md']
    .map(file => readFile(new URL('conformance/' + file, root), 'utf8')))
  const known = new Set(docs.flatMap(doc => [...doc.matchAll(/^## KIP2-([A-Z]+-\d+)/gm)].map(m => m[1])))
  const cited = new Set(fixtures.flatMap(f => f.cases.flatMap(c => c.vectors ?? [])))
  assert.ok(cited.size > 0)
  for (const id of cited) assert.ok(known.has(id), `unknown vector ${id}`)
})

test('engine suite: ids normalize by a sorted-key walk and volatile members drop', () => {
  assert.deepEqual(normalize({ refs: { proposition: 'P-9' }, id: 'A-3', committed_at: 'x' }),
    { id: 'A:<1>', refs: { proposition: 'P:<2>' } })
  assert.deepEqual(flatten({ results: [{ error: { code: 'VersionConflict', message: 'm' } }] }),
    { error: { code: 'VersionConflict', message: 'm' } })
  assert.deepEqual(flatten({ results: [{}] }), { result: null })
})

test('engine suite: the runner passes a faithful engine and fails a wrong one', async () => {
  const reportSchema = await json('conformance/conformance-report.schema.json')
  const ajv = new Ajv2020({ strict: false, allErrors: true }); addFormats(ajv)
  const { readdir } = await import('node:fs/promises')
  for (const file of (await readdir(new URL('schemas/', root))).filter(f => f.endsWith('.json')))
    ajv.addSchema(await json('schemas/' + file))
  const validate = ajv.compile(reportSchema)
  // A scripted engine: after resetSpace it answers setup, then each case in order.
  const scripted = transform => {
    let queue = []
    return {
      describe: async () => ({ kind: 'model', name: 'scripted', version: '1', capabilities: [] }),
      resetSpace: async ({ name }) => {
        const fixture = fixtures.find(f => f.name === name)
        queue = [...(fixture.setup ?? []).map(() => null), ...fixture.cases]
      },
      execute: async () => {
        const c = queue.shift()
        if (!c) return { results: [{ result: null }] }
        return transform(c)
      }
    }
  }
  const echo = c => c.expect.error ? { results: [{ error: { code: c.expect.error, message: 'expected' } }] }
    : { results: [{ result: c.expect.result ?? null }] }
  const faithful = scripted(echo)
  const good = await runEngineSuite(faithful, fixtures)
  assert.equal(good.overall_status, 'PASS', JSON.stringify(good.tests.filter(t => t.status !== 'PASS').slice(0, 3)))
  assert.equal(good.summary.pass, manifest.cases)
  assert.ok(validate(good), JSON.stringify(validate.errors))
  const wrong = await runEngineSuite(scripted(c => c.expect.error ? { results: [{ result: null }] } : echo(c)), fixtures)
  assert.equal(wrong.overall_status, 'FAIL')
  const unbuilt = await runEngineSuite(scripted(() => ({ error: { code: 'UnsupportedCapability', message: 'not built' } })), fixtures)
  assert.equal(unbuilt.summary.pass, fixtures.flatMap(f => f.cases).filter(c => c.expect.error === 'UnsupportedCapability').length)
  assert.ok(unbuilt.summary.skip_unsupported > 0)
})
