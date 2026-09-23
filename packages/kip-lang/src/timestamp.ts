/** Protocol instants are canonical UTC milliseconds, never rounded input. */
export function parseTimestamp(value: unknown): number {
  if (typeof value !== 'string') throw new TypeError('timestamp must be a string')
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/.test(value)) {
    throw new RangeError('timestamp must use YYYY-MM-DDTHH:mm:ss.SSSZ')
  }
  const instant = Date.parse(value)
  if (!Number.isFinite(instant) || new Date(instant).toISOString() !== value) {
    throw new RangeError('timestamp has an invalid calendar date')
  }
  return instant
}

/**
 * A `valid_time` endpoint (Spec §25.5): an exact Timestamp, a time bound
 * `{earliest?, latest?}`, or null. Returns the closed range of instants it
 * allows, with infinities for a missing side; `null` is returned as-is so the
 * caller applies the endpoint's own open-side rule.
 */
export function parseTimePoint(value: unknown): { earliest: number; latest: number } | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const instant = parseTimestamp(value)
    return { earliest: instant, latest: instant }
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('a time point is a timestamp string, a time bound object or null')
  }
  const bound = value as Record<string, unknown>
  const keys = Object.keys(bound)
  if (keys.length === 0 || keys.some((key) => key !== 'earliest' && key !== 'latest')) {
    throw new RangeError('a time bound has only earliest and/or latest, and at least one of them')
  }
  const earliest = bound.earliest === undefined ? -Infinity : parseTimestamp(bound.earliest)
  const latest = bound.latest === undefined ? Infinity : parseTimestamp(bound.latest)
  if (earliest > latest) throw new RangeError('a time bound needs earliest <= latest')
  return { earliest, latest }
}
