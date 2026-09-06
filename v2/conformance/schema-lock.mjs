import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { canonicalize, parseCanonicalJson } from '../../packages/kip-lang/dist/index.js'

/** Lock the shipped validation roots and their complete local $ref closure.
 * This repository uses one resource per file; nested resource IDs fail explicitly.
 * The JSON Schema meta-schema is provided by the validator, not a package pin. */
export async function validationSchemaLock(directory, roots) {
  const catalog = new Map()
  for (const file of (await readdir(directory)).filter(file => file.endsWith('.json')).sort()) {
    const schema = parseCanonicalJson(await readFile(new URL(file, directory), 'utf8'))
    if (!schema.$id || catalog.has(schema.$id)) throw new Error('Missing or duplicate schema ID: ' + file)
    catalog.set(schema.$id, schema)
  }
  const ids = new Set(roots)
  function references(value, owner) {
    if (!value || typeof value !== 'object') return
    if (value.$id && value.$id !== owner) throw new Error('Unsupported nested schema ID: ' + value.$id)
    for (const keyword of ['$ref', '$dynamicRef']) {
      if (typeof value[keyword] === 'string') ids.add(new URL(value[keyword], owner).href.split('#')[0])
    }
    for (const child of Object.values(value)) references(child, owner)
  }
  const pins = []
  for (const id of ids) {
    const schema = catalog.get(id)
    if (!schema) throw new Error('Unresolved validation schema: ' + id)
    references(schema, id)
    pins.push({ id, content_digest: 'sha256:' + createHash('sha256').update(canonicalize(schema)).digest('hex') })
  }
  return pins
}
