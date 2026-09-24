import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { parseCanonicalJson, parse, lower } from '../dist/index.js'
import { IntakeLedger, advanceProgress, processingBarrier, recallEligibility, scopeMatches,
  validateBundles, channels, routeRevision, attentionAfter, commitmentReviewKey } from '../../../conformance/reference/memory-interface.mjs'
import { project } from '../../../conformance/reference/contracts.mjs'

const base = new URL('../../../', import.meta.url)
const json = async path => parseCanonicalJson(await readFile(new URL(path, base), 'utf8'))
const registry = (await json('profiles/memory-bundles.json')).bundles
const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
for (const name of await readdir(new URL('schemas/', base)))
  if (name.endsWith('.json')) ajv.addSchema(await json('schemas/' + name))
const validate = name => ajv.getSchema('urn:kip:2.0:schema:memory#/$defs/' + name)
const context = { principal: 'alice-runtime', space_id: 'personal', accepted_seq: 10 }
const source = { ref: 'source-77', identity: 'event-77', digest: 'sha256:' + 'a'.repeat(64) }
const request = { kip_memory: '2.0', operation: 'observe', idempotency_key: 'observe:77',
  scope: { task_ref: 'task-A' }, input: { source_ref: source.ref } }
const completedChannels = Object.fromEntries(channels.map(name => [name, 'complete']))

function available(ledger, receipt, disposition = 'formed', resolved_seq = 12, available_seq = 13) {
  return ledger.advance(context, { receipt_ref: receipt.receipt_ref, phase: 'available',
    disposition, resolved_seq, available_seq })
}

test('MIF: one small request per intent validates; source text and authority are not model-written fields', () => {
  const inputs = {
    observe: { source_ref: 'source-77' },
    recall: { query: 'What matters now?', after: ['receipt-77'] },
    revise: { source_ref: 'source-78', target_ref: 'memory-1', change_kind: 'world_change' },
    feedback: { source_ref: 'source-79', attempt_ref: 'attempt-1' },
    forget: { target_ref: 'memory-1', mode: 'semantic' }
  }
  for (const [operation, input] of Object.entries(inputs)) {
    const value = { kip_memory: '2.0', operation, input,
      ...(operation === 'recall' ? {} : { idempotency_key: operation + ':1' }) }
    assert.ok(validate('Request')(value), JSON.stringify(validate('Request').errors))
    if (operation !== 'recall') {
      delete value.idempotency_key
      assert.equal(validate('Request')(value), false)
    }
  }
  for (const input of [{ payload: 'model-retyped source' }, { source_ref: 'source-77', principal_id: 'admin' }])
    assert.equal(validate('Request')({ ...request, input }), false)
  assert.equal(validate('Request')({ ...request, budget: { max_output_tokens: 9007199254740992 } }), false)
  assert.equal(validate('Request')({ ...request, operation: 'recall', input: { query: 'q' } }), false)
})

test('MIF: processing may lag durable intake; a fresh sequence cannot fill that gap', () => {
  const ledger = new IntakeLedger()
  const { receipt } = ledger.admit(context, request, source)
  assert.equal(processingBarrier(ledger, context, [receipt.receipt_ref], 100).satisfied, false)
  ledger.advance(context, { receipt_ref: receipt.receipt_ref, phase: 'processed', disposition: 'formed', resolved_seq: 12 })
  assert.equal(processingBarrier(ledger, context, [receipt.receipt_ref], 100).satisfied, false)
  available(ledger, receipt)
  assert.equal(processingBarrier(ledger, context, [receipt.receipt_ref], 12).satisfied, false)
  assert.equal(processingBarrier(ledger, context, [receipt.receipt_ref], 13).satisfied, true)
})

test('MIF: later input finishing first cannot advance an earlier input barrier', () => {
  const ledger = new IntakeLedger()
  const first = ledger.admit(context, request, source).receipt
  const secondSource = { ...source, ref: 'source-78', identity: 'event-78' }
  const second = ledger.admit({ ...context, accepted_seq: 11 },
    { ...request, idempotency_key: 'observe:78', input: { source_ref: secondSource.ref } }, secondSource).receipt
  available(ledger, second, 'formed', 15, 16)
  const before = processingBarrier(ledger, context, [first.receipt_ref, second.receipt_ref], 20)
  assert.deepEqual(before.unresolved, [first.receipt_ref])
  available(ledger, first, 'formed', 18, 19)
  assert.equal(processingBarrier(ledger, context, [first.receipt_ref, second.receipt_ref], 20).satisfied, true)
})

test('MIF: retries survive restart without a second intake or rewriting the original acknowledgement', () => {
  const ledger = new IntakeLedger()
  const original = ledger.admit(context, request, source)
  available(ledger, original.receipt)
  const restored = new IntakeLedger(ledger.snapshot())
  assert.deepEqual(restored.admit({ ...context, accepted_seq: 50 },
    { ...request, request_id: 'new-transport-attempt', budget: { max_output_tokens: 500 } }, source), original)
  assert.equal(restored.snapshot().records.length, 1)
  assert.equal(restored.read(context, original.receipt.receipt_ref).progress.phase, 'available')
  assert.throws(() => restored.admit(context, request, { ...source, digest: 'sha256:' + 'b'.repeat(64) }), /IdempotencyConflict/)
  assert.throws(() => restored.admit(context, { ...request, scope: { task_ref: 'task-B' } }, source), /IdempotencyConflict/)
})

test('MIF: honest source-only/skipped disposition satisfies processing, not belief acceptance', () => {
  for (const disposition of ['evidence_only', 'skipped']) {
    const ledger = new IntakeLedger()
    const { receipt } = ledger.admit(context, request, source)
    available(ledger, receipt, disposition)
    const result = processingBarrier(ledger, context, [receipt.receipt_ref], 13)
    assert.equal(result.satisfied, true)
    assert.equal(result.progress[0].disposition, disposition)
    assert.equal(Object.hasOwn(result.progress[0], 'epistemic_status'), false)
  }
})

test('MIF: failure/missing progress cannot become an available processing horizon', () => {
  const ledger = new IntakeLedger()
  const { receipt } = ledger.admit(context, request, source)
  ledger.advance(context, { receipt_ref: receipt.receipt_ref, phase: 'failed',
    error: { code: 'SchemaSymbolNotFound', message: 'Processing failed' } })
  assert.equal(processingBarrier(ledger, context, [receipt.receipt_ref], 100).satisfied, false)
  assert.throws(() => available(ledger, receipt), /InvalidLifecycleTransition/)
  assert.throws(() => processingBarrier(ledger, context, ['missing'], 100), /NotFoundOrNotVisible/)
})

test('MIF: source progress and task scope are not authority or globally shared context', () => {
  const ledger = new IntakeLedger()
  const { receipt } = ledger.admit(context, request, source)
  for (const change of [{ principal: 'bob-runtime' }, { space_id: 'another-space' }])
    assert.throws(() => processingBarrier(ledger, { ...context, ...change }, [receipt.receipt_ref], 100), /NotFoundOrNotVisible/)
  assert.equal(scopeMatches({ task_ref: 'task-A' }, {}), false)
  assert.equal(scopeMatches({ task_ref: 'task-A' }, { task_ref: 'task-B' }), false)
  assert.equal(scopeMatches({ task_ref: 'task-A', context_refs: ['work'] },
    { task_ref: 'task-A', context_refs: ['work', 'deployment'] }), true)
  assert.equal(scopeMatches({ context_refs: ['work'] }, {}), false)
})

test('MIF: missing channels, exhausted coverage and pending input never justify automatic application', () => {
  const full = { channelStates: completedChannels, barrier: { satisfied: true }, unverified: [] }
  assert.deepEqual(recallEligibility(full), { complete: true, action_eligible: true })
  for (const args of [{ barrier: { satisfied: false } },
    { channelStates: { ...completedChannels, constraints: 'incomplete' } },
    { channelStates: { ...completedChannels, skills: 'not_applicable' } }, { channelStates: {} }])
    assert.deepEqual(recallEligibility({ ...full, ...args }), { complete: false, action_eligible: false })
  assert.equal(recallEligibility({ ...full, unverified: ['production target'] }).action_eligible, false)
  assert.equal(recallEligibility({ ...full, channelStates: { ...completedChannels, skills: 'not_applicable' },
    notApplicable: ['skills'] }).complete, true)
})

test('MIF: available is a historical horizon; checking it is read-only and does not override current checks', () => {
  const ledger = new IntakeLedger()
  const { receipt } = ledger.admit(context, request, source)
  available(ledger, receipt)
  const snapshot = ledger.snapshot()
  const barrier = processingBarrier(ledger, context, [receipt.receipt_ref], 20)
  assert.equal(barrier.satisfied, true)
  assert.equal(recallEligibility({ channelStates: { ...completedChannels, dependencies: 'incomplete' }, barrier }).action_eligible, false)
  assert.deepEqual(ledger.snapshot(), snapshot)
})

test('MIF: progress cannot change a processed disposition or manufacture past sequence coverage', () => {
  const receipt = { receipt_ref: 'r', operation: 'observe', accepted_seq: 10 }
  const recorded = { receipt_ref: 'r', phase: 'recorded' }
  for (const next of [{ phase: 'processed', disposition: 'formed', resolved_seq: 9 },
    { phase: 'available', disposition: 'formed', resolved_seq: 12, available_seq: 11 },
    { phase: 'available', disposition: 'erased', resolved_seq: 12, available_seq: 13 },
    { phase: 'processed', disposition: 'deferred', resolved_seq: 12 }])
    assert.throws(() => advanceProgress(receipt, recorded, { receipt_ref: 'r', ...next }))
  const processed = { ...recorded, phase: 'processed', disposition: 'formed', resolved_seq: 12 }
  assert.throws(() => advanceProgress(receipt, processed,
    { ...processed, phase: 'available', disposition: 'skipped', available_seq: 13 }), /ImmutableField/)
})

test('MIF: static wire rejects a successful recall with pending progress or hidden incomplete coverage', () => {
  const result = { summary: 'No pending obligation is known.', items: [], uncertainties: [], basis_ref: 'basis-1',
    coverage: { complete: true, scope: {}, channels: completedChannels, pending_receipts: [], unverified_preconditions: [], action_eligible: true }, after: [] }
  const response = { kip_memory: '2.0', operation: 'recall', status: 'succeeded', result }
  assert.ok(validate('Response')(response), JSON.stringify(validate('Response').errors))
  const pending = structuredClone(response)
  pending.result.after = [{ receipt_ref: 'r', phase: 'recorded' }]
  assert.equal(validate('Response')(pending), false)
  const truncated = structuredClone(response)
  truncated.result.coverage.channels.constraints = 'incomplete'
  assert.equal(validate('Response')(truncated), false)
  const noSourceStatus = { ref: 'item', text: 'a fact', role: 'fact', epistemic_status: 'not_applicable', evidence_refs: [], action_eligible: false }
  assert.equal(validate('MemoryItem')(noSourceStatus), false)
  assert.equal(validate('MemoryItem')({ ...noSourceStatus, role: 'procedure' }), false)
})

test('MIF: partial erasure is not a successful forget acknowledgement', () => {
  const response = { kip_memory: '2.0', operation: 'forget', status: 'partial',
    receipt: { receipt_ref: 'erase', operation: 'forget', space_id: 'personal', accepted_seq: 10 },
    progress: { receipt_ref: 'erase', phase: 'recorded' },
    result: { status: 'partial', plan_ref: 'plan', summary: 'Backup erasure is pending.', coverage_ref: 'coverage' } }
  assert.ok(validate('Response')(response), JSON.stringify(validate('Response').errors))
  assert.equal(validate('Response')({ ...response, status: 'succeeded' }), false)
  const complete = { ...response, status: 'succeeded', result: { ...response.result, status: 'completed' },
    progress: { receipt_ref: 'erase', phase: 'available', disposition: 'erased', resolved_seq: 15, available_seq: 15 } }
  assert.ok(validate('Response')(complete), JSON.stringify(validate('Response').errors))
})

test('MIF: bundles compose without claiming that basic memory validates learning', () => {
  assert.ok(validateBundles(['memory_basic'], registry))
  assert.equal(registry.memory_basic.validated_standing, false)
  assert.ok(validateBundles(['memory_basic', 'memory_experience', 'memory_learning'], registry))
  assert.throws(() => validateBundles(['memory_learning'], registry), /UnsupportedCapability/)
  assert.throws(() => validateBundles(['memory_basic', 'memory_learning'], registry), /UnsupportedCapability/)
  assert.throws(() => validateBundles(['memory_basic', 'invented'], registry), /UnsupportedCapability/)
  const descriptor = { kip_memory: '2.0', bundles: ['memory_basic'], default_budget: { max_output_tokens: 1200, deadline_ms: 3000 }, tokenizer: 'fixture-tokenizer', minimum_response_tokens: 128 }
  assert.ok(validate('Descriptor')(descriptor), JSON.stringify(validate('Descriptor').errors))
  assert.equal(validate('Descriptor')({ ...descriptor, bundles: ['memory_basic', 'memory_learning'] }), false)
})

test('MIF: compact role cards contain executable existing KIP or valid binding requests', async () => {
  for (const file of ['brain/MemoryInterface.md', 'brain/KIPRecall.md', 'brain/KIPFormation.md', 'brain/KIPMaintenance.md', 'KIP-2.0-Memory-Interface.md']) {
    const markdown = await readFile(new URL(file, base), 'utf8')
    for (const [, source] of markdown.matchAll(/^```kip\s*\n([\s\S]*?)^```/gm)) {
      const parsed = parse(source)
      assert.deepEqual(parsed.diagnostics.filter(d => d.severity === 'error'), [], file)
      assert.doesNotThrow(() => lower(parsed.ast), file)
    }
    for (const [, source] of markdown.matchAll(/^```json\s*\n([\s\S]*?)^```/gm)) {
      const value = parseCanonicalJson(source)
      if (value.kip_memory) assert.ok(validate('Request')(value), file + ': ' + JSON.stringify(validate('Request').errors))
    }
  }
})

test('MIF: completing source-only processing cannot manufacture semantic coverage', () => {
  const ledger = new IntakeLedger()
  const { receipt } = ledger.admit(context, request, source)
  available(ledger, receipt, 'evidence_only')
  const barrier = processingBarrier(ledger, context, [receipt.receipt_ref], 13)
  assert.equal(barrier.satisfied, true)
  const coverage = recallEligibility({ channelStates: { ...completedChannels, evidence: 'incomplete' },
    barrier, unverified: ['Whether the unresolved source changes the current address'] })
  assert.deepEqual(coverage, { complete: false, action_eligible: false })
})

test('MIF: portable binding vectors are independently asserted and schema-valid', async () => {
  const vectorSchema = await json('conformance/conformance-test-vector.schema.json')
  const reportSchema = await json('conformance/conformance-report.schema.json')
  // Harness vector schemas reference the existing KIP request/response resources.
  const vectorAjv = ajv
  vectorAjv.addSchema(vectorSchema)
  vectorAjv.addSchema(reportSchema)
  const files = (await readdir(new URL('conformance/vectors/interface/', base))).filter(name => name.endsWith('.json'))
  assert.equal(files.length, 20)
  const ids = new Set()
  for (const name of files) {
    const vector = await json('conformance/vectors/interface/' + name)
    assert.ok(vectorAjv.validate(vectorSchema.$id, vector), JSON.stringify(vectorAjv.errors))
    assert.equal(ids.has(vector.id), false)
    ids.add(vector.id)
    assert.deepEqual(vector.capabilities, vector.id === 'KIP2-MIF-017'
      ? ['memory_interface', 'recording_repair'] : ['memory_interface'])
    assert.equal(vector.steps[0].action, 'exercise_memory_interface_scenario')
    assert.ok(vector.assertions.length > 0 && vector.postconditions.length > 0)
  }
  for (const name of ['__proto__', 'constructor'])
    assert.throws(() => validateBundles(['memory_basic', name], registry), /UnsupportedCapability/)
  assert.equal(validate('Descriptor')({ kip_memory: '2.0', bundles: ['memory_basic'], default_budget: {},
    tokenizer: 'fixture', minimum_response_tokens: 128 }), false)
})

test('MIF: a retained intake retry does not depend on a staging source handle remaining live', () => {
  const ledger = new IntakeLedger()
  const original = ledger.admit(context, request, source)
  const restored = new IntakeLedger(ledger.snapshot())
  assert.deepEqual(restored.admit(context, request, undefined), original)
  assert.throws(() => restored.admit(context, { ...request, input: { source_ref: 'different' } }, undefined), /IdempotencyConflict/)
  assert.throws(() => restored.admit(context, { ...request, idempotency_key: 'new-operation' }, undefined), /NotFoundOrNotVisible/)
  assert.equal(restored.snapshot().records.length, 1)
})

test('MIF: an after barrier cannot silently move a requested historical snapshot', () => {
  const ledger = new IntakeLedger()
  const { receipt } = ledger.admit(context, request, source)
  available(ledger, receipt)
  assert.throws(() => processingBarrier(ledger, context, [receipt.receipt_ref], 12, { fixed: true }), /PreconditionFailed/)
  assert.equal(processingBarrier(ledger, context, [receipt.receipt_ref], 13, { fixed: true }).satisfied, true)
  assert.ok(validate('Request')({ kip_memory: '2.0', operation: 'recall',
    input: { query: 'What did we believe then?', time: { as_of_seq: 13, valid_at: '2026-09-06T00:00:00.000Z' } } }))
})

test('MIF-014/015/017: each revision kind keeps its own history and misrecorded never becomes a correction', () => {
  assert.equal(routeRevision('correction').history, 'supersession')
  assert.deepEqual(routeRevision('world_change'), { history: 'succession', assertions: 1, actor_withdrawal: false, asserted_at_source: 'revision' })
  assert.equal(routeRevision('misrecorded', ['recording_repair']).history, 'recording_repair')
  assert.equal(routeRevision('misrecorded', [], ['quarantine']).status, 'partial')
  assert.throws(() => routeRevision('misrecorded'), /UnsupportedCapability/)
  for (const kind of ['correction', 'world_change', 'misrecorded', 'unspecified'])
    assert.ok(validate('Request')({ kip_memory: '2.0', operation: 'revise', idempotency_key: 'revise:' + kind,
      input: { source_ref: 'source-1', change_kind: kind } }), JSON.stringify(validate('Request').errors))
  assert.equal(validate('Request')({ kip_memory: '2.0', operation: 'revise', idempotency_key: 'r',
    input: { source_ref: 'source-1', change_kind: 'retract_for_them' } }), false)
})

test('MIF-017: repairing an old extraction preserves history without displacing a later claim', () => {
  // The January source said dark, but was extracted incorrectly. The September
  // repair request fixes that extraction; it does not state a new preference.
  const claimTimes = { original: '2026-01-01T00:00:00.000Z', revision: '2026-09-24T00:00:00.000Z' }
  const candidate = (id, value, asserted_at) => ({ id, value, assertions: [
    { root: id, actor: 'alice', status: 'active', stance: 'support', mode: 'stated', trusted: true, asserted_at }
  ] })
  const later = candidate('later', 'light', '2026-09-01T00:00:00.000Z')
  later.assertions[0].from = '2026-09-01T00:00:00.000Z'
  const route = routeRevision('misrecorded', ['recording_repair'])
  const repaired = candidate('repaired', 'dark', claimTimes[route.asserted_at_source])
  assert.equal(repaired.assertions[0].asserted_at, claimTimes.original)
  const recall = (replacement, at) => project([replacement, later], { functional: true, valid_at: at }).accepted_values
  assert.deepEqual(recall(repaired, '2026-09-25T00:00:00.000Z'), ['light'])
  assert.deepEqual(recall(repaired, claimTimes.original), ['dark'])
  // An actual new statement uses the revision source's time and can succeed light.
  for (const kind of ['correction', 'world_change']) {
    const newRoute = routeRevision(kind)
    assert.equal(claimTimes[newRoute.asserted_at_source], claimTimes.revision)
  }
  const newStatement = candidate('new', 'dark', claimTimes[routeRevision('world_change').asserted_at_source])
  assert.deepEqual(recall(newStatement, '2026-09-25T00:00:00.000Z'), ['dark'])
})

test('MIF-019: attention recall is read-only, cursor-ordered and repeatable', () => {
  const items = [
    { ref: 'watch-2', kind: 'watch_fired', summary: 'No reply from Bob by Thursday', raised_seq: 41, target_refs: ['commitment-7'] },
    { ref: 'watch-1', kind: 'commitment_due', summary: 'Send the report', raised_seq: 40, target_refs: ['commitment-3'] }]
  const before = JSON.stringify(items)
  const first = attentionAfter(items)
  assert.deepEqual(first.attention.map(i => i.ref), ['watch-1', 'watch-2'])
  assert.equal(first.attention_cursor, 'attention:41:watch-2')
  assert.deepEqual(attentionAfter(items, first.attention_cursor).attention, [])
  assert.equal(JSON.stringify(items), before)
  assert.ok(validate('Request')({ kip_memory: '2.0', operation: 'recall',
    input: { mode: 'attention', attention_cursor: first.attention_cursor } }), JSON.stringify(validate('Request').errors))
  assert.equal(validate('Request')({ kip_memory: '2.0', operation: 'recall', input: { mode: 'answer' } }), false)
  const briefing = { summary: 'Attention', items: [], uncertainties: [], basis_ref: 'basis-1',
    coverage: { complete: true, scope: {}, channels: Object.fromEntries(channels.map(c => [c, 'complete'])),
      pending_receipts: [], unverified_preconditions: [], action_eligible: true },
    after: [], attention: first.attention, attention_cursor: first.attention_cursor }
  assert.ok(validate('Briefing')(briefing), JSON.stringify(validate('Briefing').errors))
  const empty = attentionAfter([])
  assert.ok(validate('Briefing')({ ...briefing, ...empty }), JSON.stringify(validate('Briefing').errors))
  assert.ok(validate('Request')({ kip_memory: '2.0', operation: 'recall',
    input: { mode: 'attention', attention_cursor: empty.attention_cursor } }), JSON.stringify(validate('Request').errors))
  assert.deepEqual(attentionAfter(items, empty.attention_cursor), first)
  assert.deepEqual(attentionAfter([], empty.attention_cursor), empty)
})

test('MIF-019: a page may end inside one raised_seq without losing the rest of it', () => {
  // One review commit (seq 50) raises three due Commitments; a Watch fires at 51.
  const items = ['c', 'a', 'b'].map(id => ({ ref: 'review-' + id, kind: 'commitment_due', summary: 'Due ' + id,
    raised_seq: 50, target_refs: ['commitment-' + id] }))
    .concat([{ ref: 'watch-9', kind: 'watch_fired', summary: 'Silence', raised_seq: 51, target_refs: [] }])
  const pages = []
  let cursor = null
  for (;;) {
    const page = attentionAfter(items, cursor, 2)
    if (!page.attention.length) { assert.equal(page.attention_cursor, cursor); break }
    pages.push(page.attention.map(i => i.ref)); cursor = page.attention_cursor
  }
  assert.deepEqual(pages, [['review-a', 'review-b'], ['review-c', 'watch-9']])
  assert.equal(cursor, 'attention:51:watch-9')
  // A cursor that names only a sequence covers all of it; a malformed one fails.
  assert.deepEqual(attentionAfter(items, 'attention:50').attention.map(i => i.ref), ['watch-9'])
  assert.throws(() => attentionAfter(items, 'attention:x'), /CursorInvalid/)
})

test('MIF-019: a due Commitment is raised once per due time, keyed like a Watch firing', () => {
  const commitment = { id: 'C-7', status: 'pending', due_at: '2026-09-24T09:00:00.000Z' }
  assert.equal(commitmentReviewKey(commitment), 'commitment_review:C-7:2026-09-24T09:00:00.000Z')
  // Two reviews of the unchanged Commitment compute one key: the second replays.
  assert.equal(commitmentReviewKey({ ...commitment }), commitmentReviewKey(commitment))
  // Rescheduling makes it eligible again; a settled Commitment is not raised.
  assert.notEqual(commitmentReviewKey({ ...commitment, due_at: '2026-09-25T09:00:00.000Z' }), commitmentReviewKey(commitment))
  assert.equal(commitmentReviewKey({ ...commitment, status: 'blocked' }), commitmentReviewKey(commitment))
  assert.equal(commitmentReviewKey({ ...commitment, status: 'fulfilled' }), null)
  assert.throws(() => commitmentReviewKey({ id: 'C-8', status: 'pending' }), /ConstraintViolation/)
})
