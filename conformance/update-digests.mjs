import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { canonicalize, parseCanonicalJson } from '../packages/kip-lang/dist/index.js'
import { validationSchemaLock } from './schema-lock.mjs'

const base = new URL('../', import.meta.url)
const hash = value => 'sha256:' + createHash('sha256').update(canonicalize(value)).digest('hex')
const write = process.argv.includes('--write')
const files = ['profiles/cognitive-memory-2.0.0.schema.json',
  'profiles/general-domain-1.0.0.schema.json',
  'profiles/policy-memory-default.json',
  'profiles/policy-strength-half-life-30d.json',
  'conformance/fixtures/test-core-domain-1.0.0.schema.json',
  'conformance/fixtures/test-secondary-1.0.0.schema.json',
  'conformance/fixtures/epistemic-test-deterministic.json']
try {
  for (const file of await readdir(new URL('conformance/fixtures/capsules/', base))) {
    if (file.startsWith('valid-') && file.endsWith('.json')) files.push('conformance/fixtures/capsules/' + file)
  }
} catch (error) { if (error.code !== 'ENOENT') throw error }
let failures = 0
for (const file of files) {
  const path = new URL(file, base)
  const doc = parseCanonicalJson(await readFile(path, 'utf8'))
  if (file === 'profiles/cognitive-memory-2.0.0.schema.json') {
    const pins = await validationSchemaLock(new URL('schemas/', base),
      ['projection', 'cognitive-records', 'element', 'capsule', 'schema-package'].map(name => 'urn:kip:2.0:schema:' + name))
    if (write) doc.manifest.validation_schemas = pins
    else if (canonicalize(doc.manifest.validation_schemas) !== canonicalize(pins)) {
      failures++; console.error('FAIL validation-schema lock:', file)
    }
  }
  if (file === 'profiles/general-domain-1.0.0.schema.json') {
    const memory = parseCanonicalJson(await readFile(new URL('profiles/cognitive-memory-2.0.0.schema.json', base), 'utf8'))
    for (const dependency of doc.dependencies) {
      if (dependency.package_ref !== 'kip://profiles/cognitive-memory@2.0.0') continue
      if (write) dependency.content_digest = memory.integrity.content_digest
      else if (dependency.content_digest !== memory.integrity.content_digest) {
        failures++; console.error('FAIL package dependency digest:', file)
      }
    }
  }
  if (file.startsWith('conformance/fixtures/capsules/')) {
    for (const dependency of doc.payload.schema_dependencies) {
      if (dependency.package_ref !== 'kip://profiles/cognitive-memory@2.0.0') continue
      const pkg = parseCanonicalJson(await readFile(new URL('profiles/cognitive-memory-2.0.0.schema.json', base), 'utf8'))
      if (write) dependency.content_digest = pkg.integrity.content_digest
      else if (dependency.content_digest !== pkg.integrity.content_digest) {
        failures++; console.error('FAIL package dependency digest:', file)
      }
    }
  }
  if (write) {
    if (doc.canonicalization) doc.canonicalization = {
      profile: 'kip-jcs-safe-v1', status: 'normative-draft',
      description: 'RFC 8785 JCS, narrowed to KIP portable safe integral values; no nonzero underflow; strict decoded-key/Unicode validation; integrity excluded from its own digest.'
    }
    doc.integrity.digest_profile = 'kip-jcs-safe-v1'
  }
  const { integrity, ...payload } = doc
  const digest = hash(payload)
  if (write) {
    integrity.content_digest = digest
    await writeFile(path, JSON.stringify(doc, null, 2) + '\n')
  } else if (integrity.digest_profile !== 'kip-jcs-safe-v1' || integrity.content_digest !== digest) {
    failures++; console.error('FAIL digest:', file)
  }
}
// Vectors that pin a policy artifact by digest: the pin must name the artifact
// as it ships, or an engine rightly reports the strength as unknown. Deliberately
// mismatched pins live elsewhere in those files and are never selected here.
const pinned = [
  { file: 'conformance/engine-suite/mnemonic-strength.json', artifact: 'profiles/policy-strength-half-life-30d.json',
    pins: doc => doc.setup.map(step => step.params?.policy).filter(Boolean) },
  { file: 'conformance/vectors/cognitive-contracts.json', artifact: 'profiles/policy-strength-half-life-30d.json',
    pins: doc => doc.strength.filter(c => ['MEM-030a', 'MEM-030b'].includes(c.id))
      .flatMap(c => [c.state, ...(c.variants ?? [])]).map(state => state.strength_policy).filter(Boolean) }]
for (const pin of pinned) {
  const artifact = parseCanonicalJson(await readFile(new URL(pin.artifact, base), 'utf8'))
  const doc = parseCanonicalJson(await readFile(new URL(pin.file, base), 'utf8'))
  let changed = false
  for (const value of pin.pins(doc)) {
    if (value.artifact_ref === artifact.policy_id && value.content_digest === artifact.integrity.content_digest) continue
    if (write) { value.artifact_ref = artifact.policy_id; value.content_digest = artifact.integrity.content_digest; changed = true }
    else { failures++; console.error('FAIL pinned policy digest:', pin.file) }
  }
  if (changed) await writeFile(new URL(pin.file, base), JSON.stringify(doc, null, 2) + '\n')
}
if (failures) process.exitCode = 1
else console.log(`${write ? 'Updated' : 'Verified'} ${files.length} artifact digests.`)
