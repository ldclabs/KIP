/** Portable KIP JSON: RFC 8785 serialization with safe integral values. */
export function portableNumber(value: number, raw?: string): number {
  if (!Number.isFinite(value)) throw new Error('only finite numbers are valid KIP values')
  if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
    throw new Error('number is outside the range of portable exact integers; use a schema-defined string value')
  }
  // Inspect the significand, not the exponent: 0e-400 is still exactly zero.
  if (value === 0 && raw && /[1-9]/.test(raw.split(/[eE]/)[0])) {
    throw new Error('nonzero number underflows to zero')
  }
  return Object.is(value, -0) ? 0 : value
}

function scalarString(value: string): string {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = value.charCodeAt(++i)
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('unpaired Unicode surrogate')
    } else if (c >= 0xdc00 && c <= 0xdfff) throw new Error('unpaired Unicode surrogate')
  }
  return JSON.stringify(value)
}

/**
 * Serialize JSON values using JCS (UTF-16 key order, ECMAScript numbers,
 * no Unicode normalization). KIP narrows integral values to safe integers.
 * Semantic NFC normalization belongs to Literal construction, not hashing.
 */
export function canonicalize(value: unknown): string {
  const ancestors = new Set<object>()
  function emit(item: unknown, depth: number): string {
    if (depth > 128) throw new Error('JSON nesting limit exceeded')
    if (item === null) return 'null'
    if (typeof item === 'string') return scalarString(item)
    if (typeof item === 'number') return JSON.stringify(portableNumber(item))
    if (typeof item === 'boolean') return item ? 'true' : 'false'
    if (typeof item !== 'object') throw new Error('not a JSON value')
    if (ancestors.has(item)) throw new Error('cyclic JSON value')
    ancestors.add(item)
    let result: string
    if (Array.isArray(item)) {
      result = '[' + Array.from(item, v => emit(v, depth + 1)).join(',') + ']'
    } else {
      const proto = Object.getPrototypeOf(item)
      if (proto !== Object.prototype && proto !== null) throw new Error('not a plain JSON object')
      const object = item as Record<string, unknown>
      result = '{' + Object.keys(object).sort().map(key =>
        scalarString(key) + ':' + emit(object[key], depth + 1)
      ).join(',') + '}'
    }
    ancestors.delete(item)
    return result
  }
  return emit(value, 0)
}

/** Decode before hashing/binding, rejecting duplicate decoded keys and loss. */
export function parseCanonicalJson(source: string): unknown {
  let pos = 0
  function whitespace() { while (/[\x20\t\n\r]/.test(source[pos] ?? '\0')) pos++ }
  function string(): string {
    const start = pos++
    while (pos < source.length) {
      const c = source[pos++]
      if (c === '\\') { pos++; continue }
      if (c === '"') {
        const result: string = JSON.parse(source.slice(start, pos))
        scalarString(result)
        return result
      }
    }
    throw new Error('unterminated JSON string')
  }
  function value(depth: number): unknown {
    if (depth > 128) throw new Error('JSON nesting limit exceeded')
    whitespace()
    if (source[pos] === '"') return string()
    if (source[pos] === '{') {
      pos++; whitespace()
      const result: Record<string, unknown> = Object.create(null)
      if (source[pos] === '}') { pos++; return result }
      while (true) {
        whitespace()
        if (source[pos] !== '"') throw new Error('expected JSON property name')
        const key = string(); whitespace()
        if (Object.hasOwn(result, key)) throw new Error('duplicate JSON property: ' + key)
        if (source[pos++] !== ':') throw new Error('expected colon')
        result[key] = value(depth + 1); whitespace()
        const end = source[pos++]
        if (end === '}') return result
        if (end !== ',') throw new Error('expected comma or closing brace')
      }
    }
    if (source[pos] === '[') {
      pos++; whitespace()
      const result: unknown[] = []
      if (source[pos] === ']') { pos++; return result }
      while (true) {
        result.push(value(depth + 1)); whitespace()
        const end = source[pos++]
        if (end === ']') return result
        if (end !== ',') throw new Error('expected comma or closing bracket')
      }
    }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) {
      if (source.startsWith(token, pos)) { pos += token.length; return result }
    }
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(source.slice(pos))
    if (!match) throw new Error('invalid JSON value')
    pos += match[0].length
    return portableNumber(Number(match[0]), match[0])
  }
  const result = value(0); whitespace()
  if (pos !== source.length) throw new Error('trailing JSON content')
  return result
}
