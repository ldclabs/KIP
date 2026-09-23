/** Runner for the executable engine suite (conformance/engine-suite/).
 *
 * A case is one KIP command sent as a single-operation request, compared with
 * one expected result or error code. This is the same contract both reference
 * engines implement in their own harnesses; the runner reproduces their
 * flattening and normalization so any engine can be run from this repository.
 *
 * Adapter contract:
 *   describe()                    -> {kind: 'engine'|'model', name, version, capabilities}
 *   resetSpace({name, packages})  -> fresh isolated Space with the Cognitive Memory
 *                                    Profile and the fixture's packages activated
 *   execute(request)              -> the raw KIP response envelope
 *   elementIdTag?(string)         -> the id's kind tag ('C', 'P', ...) or null
 */
import { readFile, readdir } from 'node:fs/promises'

/** Engine truth rather than behaviour: dropped before comparison. */
const VOLATILE = new Set(['created_at', 'updated_at', 'authorization_view', 'created_tx', 'updated_tx',
  'tx_id', 'committed_at', 'valid_at', 'content_digest', 'score'])

const defaultTag = value => /^([A-Z])-[A-Za-z0-9_]+$/.exec(value)?.[1] ?? null

/** Ids become `C:<1>`, `P:<2>` ... in the order a sorted-key walk reaches them. */
export function normalize(value, tagOf = defaultTag, seen = new Map()) {
  if (typeof value === 'string') {
    const tag = tagOf(value)
    if (tag === null) return value
    if (!seen.has(value)) seen.set(value, `${tag}:<${seen.size + 1}>`)
    return seen.get(value)
  }
  if (Array.isArray(value)) return value.map(item => normalize(item, tagOf, seen))
  if (value !== null && typeof value === 'object') {
    const out = {}
    for (const key of Object.keys(value).sort()) {
      if (VOLATILE.has(key)) continue
      out[key] = normalize(value[key], tagOf, seen)
    }
    return out
  }
  return value
}

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object')
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}

export function sameResult(actual, expected, ordered, tagOf = defaultTag) {
  const left = normalize(actual, tagOf)
  if (!ordered && Array.isArray(left) && Array.isArray(expected)) {
    const sort = list => [...list].map(canonical).sort()
    return canonical(sort(left)) === canonical(sort(expected))
  }
  return canonical(left) === canonical(expected)
}

/** A command's answer: the top-level error, the first result's error, or its result. */
export function flatten(envelope) {
  if (envelope?.error) return { error: { code: envelope.error.code, message: envelope.error.message ?? '' } }
  const first = envelope?.results?.[0]
  if (!first) return { error: { code: 'InternalError', message: 'the response carried no result' } }
  if (first.error) return { error: { code: first.error.code, message: first.error.message ?? '' } }
  return { result: first.result === undefined ? null : first.result }
}

const request = (command, parameters = {}, extra = {}) =>
  ({ kip: '2.0', operations: [{ command, parameters }], ...extra })

export async function loadEngineSuite(directory = new URL('engine-suite/', import.meta.url)) {
  const files = (await readdir(directory)).filter(f => f.endsWith('.json') && f !== 'manifest.json').sort()
  return Promise.all(files.map(async file => JSON.parse(await readFile(new URL(file, directory), 'utf8'))))
}

export async function runEngineSuite(adapter, fixtures) {
  const about = await adapter.describe()
  if (!['engine', 'model'].includes(about.kind)) throw new Error('adapter must disclose engine or model')
  const tagOf = adapter.elementIdTag?.bind(adapter) ?? defaultTag
  const tests = []
  for (const fixture of fixtures) {
    try {
      await adapter.resetSpace({ name: fixture.name, packages: fixture.packages ?? [] })
      for (const setup of fixture.setup ?? []) {
        const outcome = flatten(await adapter.execute(request(setup)))
        if (outcome.error) throw new Error(`setup failed with ${outcome.error.code}: ${outcome.error.message}`)
      }
    } catch (error) {
      tests.push({ id: `${fixture.name}/setup`, status: 'HARNESS_ERROR', error: { code: 'AdapterError', message: error.message } })
      continue
    }
    for (const testCase of fixture.cases) {
      const id = `${fixture.name}/${testCase.name}`
      let outcome
      try {
        outcome = flatten(await adapter.execute(request(testCase.command, testCase.params ?? {}, testCase.envelope ?? {})))
      } catch (error) {
        // A lost response may still have committed: stop rather than run on an uncertain Space.
        tests.push({ id, status: 'HARNESS_ERROR', error: { code: 'AdapterError', message: error.message } })
        break
      }
      const expectedError = testCase.expect?.error
      if (outcome.error) {
        if (outcome.error.code === 'UnsupportedCapability' && expectedError !== 'UnsupportedCapability')
          tests.push({ id, status: 'SKIP_UNSUPPORTED', skip: { reason: 'unsupported_capability', message: outcome.error.message } })
        else if (outcome.error.code === expectedError) tests.push({ id, status: 'PASS' })
        else tests.push({ id, status: 'FAIL', failures: [{ phase: 'assertion',
          message: `expected ${expectedError ?? 'a result'}, got ${outcome.error.code}: ${outcome.error.message}` }] })
        continue
      }
      if (expectedError !== undefined) {
        tests.push({ id, status: 'FAIL', failures: [{ phase: 'assertion', message: `expected ${expectedError}, got a result` }] })
        continue
      }
      const pass = testCase.expect?.result === undefined ||
        sameResult(outcome.result, testCase.expect.result, testCase.ordered === true, tagOf)
      tests.push(pass ? { id, status: 'PASS' } : { id, status: 'FAIL', failures: [{ phase: 'assertion',
        message: `expected ${JSON.stringify(testCase.expect.result)}, got ${JSON.stringify(normalize(outcome.result, tagOf))}` }] })
    }
  }
  const summary = { pass: 0, fail: 0, skip_unsupported: 0, not_applicable: 0, harness_error: 0 }
  for (const result of tests) summary[result.status.toLowerCase()]++
  const cases = fixtures.reduce((n, f) => n + f.cases.length, 0)
  return {
    implementation: { name: `[${about.kind}] ${about.name}`, version: about.version, kip_version: '2.0-draft' },
    profiles_claimed: [], profiles: {}, summary, tests,
    overall_status: summary.fail || summary.harness_error || !summary.pass ? 'FAIL' : 'PASS',
    warnings: [{ code: 'EngineSuite', message: 'The engine suite is necessary evidence for a conformance level, not sufficient by itself; unsupported cases are listed, never counted as passes.' }],
    extensions: { 'kip.org/evidence': { critical: false, kind: about.kind, selected: cases, executed: tests.length,
      // Fixtures no engine has verified yet (Specification Status): their passes are evidence, never prior verification.
      pending_engine: fixtures.filter(f => f.status === 'pending_engine').map(f => f.name) } }
  }
}
