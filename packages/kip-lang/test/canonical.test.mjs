import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { canonicalize, parseCanonicalJson } from '../dist/index.js'

test('JCS golden bytes: numeric spelling, escapes, UTF-16 ordering and negative zero', () => {
  const input = '{"z":-0,"n":[1.0,1e-7,0.000001],"\uE000":1,"😀":2,"s":"line\\n"}'
  assert.equal(canonicalize(parseCanonicalJson(input)),
    '{"n":[1,1e-7,0.000001],"s":"line\\n","z":0,"😀":2,"\uE000":1}')
  // JCS hashes the supplied strings; only semantic Literal construction applies NFC.
  assert.notEqual(canonicalize('é'), canonicalize('e\u0301'))
})

test('strict decoding rejects ambiguous JSON and numeric loss before hashing or binding', () => {
  for (const input of ['{"a":1,"\\u0061":2}', '9007199254740993',
    '9007199254740993.0', '9.007199254740993e15', '1e400', '1e-400',
    '"\\ud800"', '"\\udfff"', '[1,]', '{"a":1,}', '01', 'true false', '\uFEFF{}']) {
    assert.throws(() => parseCanonicalJson(input), Error, input)
  }
  assert.equal(canonicalize(parseCanonicalJson('{"__proto__":{},"a":null}')),
    '{"__proto__":{},"a":null}')
})

test('canonical encoding rejects values JSON.stringify would erase or silently replace', () => {
  const cycle = {}; cycle.self = cycle
  for (const value of [NaN, Infinity, 9007199254740992, undefined, [undefined],
    Array(1), { a: undefined }, new Date(), '\ud800', cycle]) {
    assert.throws(() => canonicalize(value))
  }
})

test('every shipped digest uses the same canonical byte contract', async () => {
  for (const file of ['profiles/cognitive-memory-2.2.0.schema.json',
    'conformance/fixtures/test-core-domain-1.0.0.schema.json',
    'conformance/fixtures/test-secondary-1.0.0.schema.json',
    'conformance/fixtures/epistemic-test-deterministic.json']) {
    const doc = parseCanonicalJson(await readFile(new URL('../../../' + file, import.meta.url), 'utf8'))
    const { integrity, ...payload } = doc
    assert.equal(integrity.digest_profile, 'kip-jcs-safe-v1')
    assert.equal('sha256:' + createHash('sha256').update(canonicalize(payload)).digest('hex'),
      integrity.content_digest, file)
  }
})
