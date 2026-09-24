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
      const errors = parse(typeof setup === 'string' ? setup : setup.command).diagnostics.filter(d => d.severity === 'error')
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
  // A setup read answers with a value at every pointer the fixture captures.
  const captured = capture => {
    const paths = Object.values(capture).map(path => path.slice(1).split('/')).sort((x, y) => y.length - x.length)
    if (!paths.length) return null
    let root = null
    for (const segments of paths) {
      const container = segment => /^\d+$/.test(segment) ? [] : {}
      root ??= container(segments[0])
      let node = root
      segments.forEach((segment, i) => {
        if (i === segments.length - 1) { node[segment] ??= 'C-' + segments.join('-'); return }
        node[segment] ??= container(segments[i + 1])
        node = node[segment]
      })
    }
    return root
  }
  // A scripted engine: after resetSpace it answers setup, then each case in order.
  const scripted = transform => {
    let queue = []
    return {
      describe: async () => ({ kind: 'model', name: 'scripted', version: '1', capabilities: [] }),
      resetSpace: async ({ name }) => {
        const fixture = fixtures.find(f => f.name === name)
        queue = [...(fixture.setup ?? []).map(step => typeof step === 'string' ? null : { setup: step }), ...fixture.cases]
      },
      execute: async () => {
        const c = queue.shift()
        if (!c) return { results: [{ result: null }] }
        if (c.setup) return { results: [{ result: captured(c.setup.capture ?? {}) }] }
        return transform(c)
      }
    }
  }
  const echo = c => c.expect.error ? { results: [{ error: { code: c.expect.error, message: 'expected' } }] }
    : { results: [{ result: c.expect.result ?? c.expect.result_contains ?? null }] }
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

test('engine suite: META policy checks allow extra policies but require memory-default', async () => {
  const fixture = fixtures.find(f => f.name === 'meta-shapes')
  const cases = fixture.cases.filter(c => c.command.includes('EPISTEMIC POLIC'))
  const run = policies => runEngineSuite({
    describe: async () => ({ kind: 'model', name: 'policy-list', version: '1' }),
    resetSpace: async () => {},
    execute: async ({ operations: [{ command }] }) => ({ results: [{ result:
      command.startsWith('LIST') ? policies : policies.find(p => p.id === 'kip:memory-default') ?? {} }] })
  }, [{ name: 'policies', cases }])
  const standard = { id: 'kip:memory-default', version: 1, method: { score_model: 'none' } }
  assert.equal((await run([{ id: 'engine:custom' }, standard])).summary.pass, 2)
  assert.equal((await run([{ id: 'engine:custom' }])).summary.fail, 2)
})

test('engine suite: inference setup forwards raw read pins and basis, and refuses missing captures', async () => {
  const fixture = fixtures.find(f => f.name === 'world-time')
  const basis = (await json('conformance/vectors/cognitive-contracts.json')).basis
  const read = [['campus-id', 'austin-id', 'dallas-id', 'brain-id', 'source-a', 3, 'source-b', 7, basis]]
  const run = result => {
    let writes = 0
    return runEngineSuite({
      describe: async () => ({ kind: 'model', name: 'captured-basis', version: '1' }),
      resetSpace: async () => {},
      execute: async ({ operations: [{ command, parameters }] }) => {
        if (command === fixture.setup[1].command) return { results: [{ result }] }
        if (command === fixture.setup[2]) {
          writes++
          assert.deepEqual(parameters.inference_basis, basis)
          assert.equal(parameters.inference_seq, basis.snapshot_seq)
          assert.equal(parameters.source_austin, 'source-a')
          assert.equal(parameters.source_austin_version, 3)
          assert.equal(parameters.source_dallas_version, 7)
        }
        return { results: [{ result: command === 'FIND(COUNT(?a)) WHERE { ?a ASSERTION {} }' ? [writes] : null }] }
      }
    }, [{ name: 'inference-capture', setup: fixture.setup.slice(0, 3), cases: [{
      name: 'derived-write', command: 'FIND(COUNT(?a)) WHERE { ?a ASSERTION {} }', expect: { result: [1] }
    }] }])
  }
  assert.equal((await run(read)).overall_status, 'PASS')
  const missing = await run([])
  assert.equal(missing.summary.harness_error, 1)
  assert.equal(missing.summary.pass, 0)
  assert.match(missing.tests[0].error.message, /capture result is missing/)
})
