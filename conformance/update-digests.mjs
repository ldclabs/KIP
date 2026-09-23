import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { canonicalize, parseCanonicalJson } from '../packages/kip-lang/dist/index.js'
import { validationSchemaLock } from './schema-lock.mjs'

const base = new URL('../', import.meta.url)
const hash = value => 'sha256:' + createHash('sha256').update(canonicalize(value)).digest('hex')
const write = process.argv.includes('--write')
const files = ['profiles/cognitive-memory-2.2.0.schema.json',
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
  if (file.startsWith('profiles/')) {
    const pins = await validationSchemaLock(new URL('schemas/', base),
      ['projection', 'cognitive-records', 'element', 'capsule', 'schema-package'].map(name => 'urn:kip:2.0:2026-09-23:schema:' + name))
    if (write) doc.manifest.validation_schemas = pins
    else if (canonicalize(doc.manifest.validation_schemas) !== canonicalize(pins)) {
      failures++; console.error('FAIL validation-schema lock:', file)
    }
  }
  if (file.startsWith('conformance/fixtures/capsules/')) {
    for (const dependency of doc.payload.schema_dependencies) {
      if (dependency.package_ref !== 'kip://profiles/cognitive-memory@2.2.0') continue
      const pkg = parseCanonicalJson(await readFile(new URL('profiles/cognitive-memory-2.2.0.schema.json', base), 'utf8'))
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
if (failures) process.exitCode = 1
else console.log(`${write ? 'Updated' : 'Verified'} ${files.length} artifact digests.`)
