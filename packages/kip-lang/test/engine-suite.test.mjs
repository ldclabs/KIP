import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { diagnose, parse } from '../dist/index.js'
import { loadEngineSuite, runEngineSuite, normalize, flatten, caseRequest, sameResult, requiresStableRowOrder } from '../../../conformance/engine-runner.mjs'

const root = new URL('../../../', import.meta.url)
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const fixtures = await loadEngineSuite(new URL('conformance/engine-suite/', root))
const manifest = await json('conformance/engine-suite/manifest.json')
// Cases whose expected answer is a parse-time rejection may not parse.
const SYNTAX = new Set(['InvalidSyntax', 'InvalidIdentifier', 'LanguageMismatch'])
const succeeded = (...values) => ({
  kip: '2.0', status: 'succeeded', results: values.map(result => ({ status: 'succeeded', result }))
})
const failed = code => ({ kip: '2.0', status: 'failed', error: { code, message: 'expected' }, results: [] })

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
      // A case is one command or one batch, never both.
      assert.ok((c.command === undefined) !== (c.operations === undefined), `${fixture.name}: ${c.name}`)
      for (const command of c.operations?.map(op => op.command) ?? [c.command]) {
        if (c.expect?.error === 'ConstraintViolation' && /CONFIRM "purge"|EXPECT VERSION 1\s+SET/.test(command)) continue
        const errors = parse(command).diagnostics.filter(d => d.severity === 'error')
        assert.deepEqual(errors.map(e => e.message), [], `${fixture.name}: ${c.name}`)
      }
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

test('editor diagnostics agree with the query scope and grouped ordering fixtures', () => {
  for (const fixture of fixtures.filter(f => ['query-scope-contracts', 'reads'].includes(f.name))) {
    for (const c of fixture.cases) {
      if (!c.command?.startsWith('FIND')) continue
      // REGEX syntax depends on the dialect advertised by the engine (§44.2).
      if (c.command.includes('REGEX(')) continue
      const errors = diagnose(c.command).filter(d => d.severity === 'error')
      if (c.expect.error === 'InvalidSyntax') assert.ok(errors.length, c.name)
      if (!c.expect.error) assert.deepEqual(errors, [], c.name)
    }
  }
})

test('engine suite: ids normalize by a sorted-key walk and volatile members drop', () => {
  assert.deepEqual(normalize({ refs: { proposition: 'P-9' }, id: 'A-3', committed_at: 'x' }),
    { id: 'A:<1>', refs: { proposition: 'P:<2>' } })
})

test('engine suite: multi-row ID expectations require deterministic ordering before execution', async () => {
  for (const c of fixtures.flatMap(f => f.cases)) {
    if (!requiresStableRowOrder(c.expect?.result)) continue
    assert.equal(c.ordered, true, c.name)
    const [stmt] = parse(c.command ?? c.operations[0].command).ast.statements
    if (stmt.kind === 'FindStatement') assert.ok(stmt.orderBy, c.name)
  }
  const rows = [{ name: 'Alice', refs: ['C-7'] }, { name: 'Bob', refs: ['C-8', 'C-7'] }]
  const expected = normalize(rows)
  assert.equal(sameResult(rows, expected, true), true)
  assert.equal(sameResult([...rows].reverse(), expected, true), false)
  assert.equal(sameResult([rows[0], { name: 'Bob', refs: ['C-8', 'C-8'] }], expected, true), false)
  assert.throws(() => sameResult([...rows].reverse(), expected, false), /ordered: true/)
  assert.equal(sameResult([rows[0]], expected.slice(0, 1), false), true)
  assert.equal(sameResult(['B', 'A', 'A'], ['A', 'B', 'A'], false), true)
  assert.equal(sameResult(['B', 'A', 'B'], ['A', 'B', 'A'], false), false)
  const report = await runEngineSuite({
    describe: async () => ({ kind: 'model', name: 'order', version: '1' }),
    resetSpace: async () => {}, execute: async () => assert.fail('invalid fixture reached the engine')
  }, [{ name: 'order', cases: [{ name: 'ambiguous', command: 'FIND(?x) WHERE { ?x {} }', expect: { result: expected } }] }])
  assert.equal(report.tests[0].status, 'HARNESS_ERROR')
  assert.match(report.tests[0].error.message, /stable row order/)
  assert.equal(report.extensions['kip.org/evidence'].executed, 0)
})

test('engine suite: a batch needs an outcome for every operation', () => {
  const error = { code: 'ConstraintViolation', message: 'm' }
  assert.deepEqual(flatten(failed(error.code), 2), { error: { code: error.code, message: 'expected' } })
  assert.deepEqual(flatten({ kip: '2.0', status: 'partial', results: [
    { status: 'succeeded', result: [1] }, { status: 'failed', error }
  ] }, 2), { error })
  const batch = succeeded([1], null)
  batch.results[1] = { status: 'no_effect' }
  assert.deepEqual(flatten(batch, 2), { result: [1] })
  assert.throws(() => flatten(succeeded([1]), 2), /expected 2 operation results/)
  for (const status of ['skipped', 'rolled_back', 'failed', undefined]) {
    batch.results[1] = { status }
    assert.throws(() => flatten(batch, 2), /every operation/)
  }
})

test('engine suite: operation statuses are checked in order independently of the command payload', async () => {
  const reply = succeeded({ handles: {}, changes: [] }, null)
  reply.results[1].status = 'no_effect'
  const adapter = {
    describe: async () => ({ kind: 'model', name: 'write-status', version: '1' }),
    resetSpace: async () => {},
    execute: async () => reply
  }
  const run = async expect => (await runEngineSuite(adapter, [{ name: 'writes', cases: [{
    name: 'batch', operations: [{ command: 'one' }, { command: 'two' }], expect
  }] }])).tests[0].status
  assert.equal(await run({ operation_statuses: ['succeeded', 'no_effect'] }), 'PASS')
  assert.equal(await run({ operation_statuses: ['no_effect', 'succeeded'] }), 'FAIL')
  assert.equal(await run({ operation_statuses: ['succeeded'] }), 'HARNESS_ERROR')
  assert.equal(await run({ result: null }), 'FAIL')
  reply.results[0].result = null
  assert.equal(await run({ operation_statuses: ['succeeded', 'no_effect'], result: null }), 'PASS')
})

test('engine suite: a batch case is sent as one multi-operation request', () => {
  const single = caseRequest({ command: 'FIND(?x) WHERE { ?x CONCEPT {} }', params: { a: 1 }, envelope: { read: {} } }, { b: 2 })
  assert.deepEqual(single, { kip: '2.0', operations: [{ command: 'FIND(?x) WHERE { ?x CONCEPT {} }', parameters: { b: 2, a: 1 } }], read: {} })
  const batch = caseRequest({
    operations: [{ command: 'one' }, { command: 'two', params: { b: 3 } }],
    envelope: { execution: { mode: 'sequence' } }
  }, { b: 2 })
  assert.deepEqual(batch, {
    kip: '2.0',
    operations: [{ command: 'one', parameters: { b: 2 } }, { command: 'two', parameters: { b: 3 } }],
    execution: { mode: 'sequence' }
  })
  const batches = fixtures.flatMap(f => f.cases).filter(c => c.operations)
  assert.ok(batches.length > 0)
  for (const c of batches) assert.ok(c.envelope?.execution?.mode, `${c.name} declares its execution mode (§75)`)
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
        if (!c) return succeeded(null)
        if (c.setup) return succeeded(captured(c.setup.capture ?? {}))
        return transform(c)
      }
    }
  }
  const echo = c => {
    if (c.expect.check_requires) return failed('UnsupportedCapability')
    if (c.expect.error) return failed(c.expect.error)
    const reply = succeeded(c.expect.result ?? c.expect.result_contains ?? null, ...(c.operations ?? []).slice(1).map(() => null))
    c.expect.operation_statuses?.forEach((status, i) => { reply.results[i].status = status })
    return reply
  }
  const faithful = scripted(echo)
  const good = await runEngineSuite(faithful, fixtures)
  assert.equal(good.overall_status, 'PASS', JSON.stringify(good.tests.filter(t => t.status !== 'PASS').slice(0, 3)))
  assert.equal(good.summary.pass, manifest.cases)
  assert.ok(validate(good), JSON.stringify(validate.errors))
  const wrong = await runEngineSuite(scripted(c => c.expect.error ? succeeded(null) : echo(c)), fixtures)
  assert.equal(wrong.overall_status, 'FAIL')
  const unbuilt = await runEngineSuite(scripted(() => failed('UnsupportedCapability')), fixtures)
  assert.equal(unbuilt.summary.pass, fixtures.flatMap(f => f.cases).filter(c => c.expect.check_requires || c.expect.error === 'UnsupportedCapability').length)
  assert.ok(unbuilt.summary.skip_unsupported > 0)
  assert.equal(unbuilt.overall_status, 'FAIL')
})

test('engine suite: only a declared missing capability justifies a skip', async () => {
  const cases = [undefined, 'advertised', 'missing'].map((cap, i) => ({
    name: String(i), command: 'DESCRIBE PRIMER', expect: {},
    ...(cap ? { envelope: { requires: { [cap]: true } } } : {})
  }))
  const report = await runEngineSuite({
    describe: async () => ({ kind: 'model', name: 'capabilities', version: '1', capabilities: ['advertised'] }),
    resetSpace: async () => {}, execute: async () => failed('UnsupportedCapability')
  }, [{ name: 'capabilities', cases }])
  assert.deepEqual(report.tests.map(t => t.status), ['FAIL', 'FAIL', 'SKIP_UNSUPPORTED'])
})

test('engine suite: the semantic search preflight must match the advertised capability', async () => {
  const fixture = fixtures.find(f => f.name === 'request-envelope')
  const probe = fixture.cases.find(c => c.envelope?.requires?.semantic_search === true)
  const run = async (capabilities, response) => {
    const report = await runEngineSuite({
      describe: async () => ({ kind: 'model', name: 'negotiation', version: '1', capabilities }),
      resetSpace: async () => {},
      execute: async request => {
        assert.deepEqual(request.requires, { semantic_search: true })
        return response
      }
    }, [{ name: 'negotiation', cases: [probe] }])
    return report.tests[0].status
  }
  const supported = ['semantic_search']
  const rejection = failed('UnsupportedCapability')
  assert.equal(await run([], rejection), 'PASS')
  assert.equal(await run([], succeeded([3])), 'FAIL')
  assert.equal(await run(supported, succeeded([3])), 'PASS')
  assert.equal(await run(supported, succeeded([2])), 'FAIL')
  assert.equal(await run(supported, rejection), 'FAIL')
  assert.equal(await run(undefined, rejection), 'HARNESS_ERROR')
})

test('engine suite: META policy checks allow extra policies but require memory-default', async () => {
  const fixture = fixtures.find(f => f.name === 'meta-shapes')
  const cases = fixture.cases.filter(c => c.command.includes('EPISTEMIC POLIC'))
  const run = policies => runEngineSuite({
    describe: async () => ({ kind: 'model', name: 'policy-list', version: '1' }),
    resetSpace: async () => {},
    execute: async ({ operations: [{ command }] }) => succeeded(
      command.startsWith('LIST') ? policies : policies.find(p => p.id === 'kip:memory-default') ?? {})
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
        if (command === fixture.setup[1].command) return succeeded(result)
        if (command === fixture.setup[2]) {
          writes++
          assert.deepEqual(parameters.inference_basis, basis)
          assert.equal(parameters.inference_seq, basis.snapshot_seq)
          assert.equal(parameters.source_austin, 'source-a')
          assert.equal(parameters.source_austin_version, 3)
          assert.equal(parameters.source_dallas_version, 7)
        }
        return succeeded(command === 'FIND(COUNT(?a)) WHERE { ?a ASSERTION {} }' ? [writes] : null)
      }
    }, [{ name: 'inference-capture', setup: fixture.setup.slice(0, 3), cases: [{
      name: 'derived-write', command: 'FIND(COUNT(?a)) WHERE { ?a ASSERTION {} }', expect: { result: [1] }
    }] }])
  }
  assert.equal((await run(read)).overall_status, 'PASS')
  const missing = await run([])
  assert.equal(missing.summary.harness_error, 1)
  assert.equal(missing.summary.pass, 0)
  assert.equal(missing.extensions['kip.org/evidence'].executed, 0)
  assert.match(missing.tests[0].error.message, /capture result is missing/)
})

test('engine suite: an uncertain response stops before any later case or fixture', async () => {
  const cases = [{ name: 'write', command: 'write', expect: {} }]
  for (const execute of [
    async () => ({ kip: '2.0', status: 'outcome_unknown', results: [{ status: 'succeeded' }] }),
    async () => { throw new Error('connection lost') }
  ]) {
    const resets = []
    const report = await runEngineSuite({
      describe: async () => ({ kind: 'model', name: 'uncertain', version: '1' }),
      resetSpace: async ({ name }) => { resets.push(name) }, execute
    }, [{ name: 'first', cases }, { name: 'second', cases }])
    assert.deepEqual(resets, ['first'])
    assert.equal(report.overall_status, 'FAIL')
    assert.equal(report.tests[0].status, 'HARNESS_ERROR')
    assert.equal(report.extensions['kip.org/evidence'].executed, 1)
  }
})
