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
