import type { Range } from './token.js'

/**
 * The subset of the KIP error taxonomy this package can produce.
 *
 * A KIP engine owns the full taxonomy (schema, logic and execution codes);
 * a language toolkit only ever reaches the parse-time codes. The `hint` that
 * accompanies each code on the wire is deliberately *not* duplicated here —
 * it is engine-side wire contract, and a second copy that drifts is worse
 * than no copy at all.
 */
export type KipSyntaxCode = 'KIP_1001' | 'KIP_1002' | 'KIP_4002'

/**
 * A fatal, single-error view of a KIP source problem.
 *
 * `parse` reports every problem it can recover from as a `Diagnostic`, which
 * is what an editor wants. An engine wants the opposite: the first thing that
 * makes the command unexecutable, thrown, with a code it can put on the wire.
 * `lower` and `checkBudget` therefore throw this instead of accumulating.
 */
export class KipSyntaxError extends Error {
  readonly code: KipSyntaxCode
  readonly range: Range | undefined

  constructor(code: KipSyntaxCode, message: string, range?: Range) {
    super(message)
    this.name = 'KipSyntaxError'
    this.code = code
    this.range = range
  }
}

/** `KIP_1001 InvalidSyntax` — the command does not parse, or violates a grammar rule. */
export function invalidSyntax(message: string, range?: Range): KipSyntaxError {
  return new KipSyntaxError('KIP_1001', message, range)
}

/** `KIP_4002 ResourceExhausted` — the input exceeds a parser budget. */
export function resourceExhausted(message: string): KipSyntaxError {
  return new KipSyntaxError('KIP_4002', message)
}
