import { resourceExhausted } from './errors.js'

/**
 * Parser budgets.
 *
 * KIP source reaches a server as agent-generated text, so the parser is an
 * attack surface before it is a convenience. `parse` is recursive descent:
 * without a depth ceiling, `[[[[...` recurses until the JavaScript stack
 * overflows, and in an environment that shares one stack across requests
 * (a Cloudflare Worker isolate, say) that takes the whole runtime down rather
 * than failing the one request. The check runs on raw text, before a single
 * token is produced, so a hostile input costs one linear scan.
 *
 * The values mirror `MAX_KIP_*` in `anda_kip`'s parser: a command rejected by
 * one KIP engine's budget must be rejected by every other engine's, or the
 * same command succeeds on one deployment and fails on another.
 */
export const MAX_KIP_INPUT_LEN = 256 * 1024
export const MAX_KIP_NESTING_DEPTH = 64
export const MAX_KIP_BATCH_COMMANDS = 256

/**
 * Rejects source that exceeds a parser budget.
 *
 * The scan must treat comments and strings exactly the way the lexer does,
 * or the guard stops guarding. Counting a `"` inside a comment would latch the
 * scanner into string mode for the rest of the input; so would running past
 * the end of an unterminated string, which the lexer closes at the newline.
 * Either way every later bracket goes uncounted and the depth ceiling silently
 * stops existing — a guard that looks present and defends nothing.
 *
 * @throws {KipSyntaxError} `KIP_4002` when a budget is exceeded.
 */
export function checkBudget(source: string): void {
  if (source.length > MAX_KIP_INPUT_LEN) {
    throw resourceExhausted(
      `KIP input length ${source.length} exceeds maximum ${MAX_KIP_INPUT_LEN}`
    )
  }

  let depth = 0
  const stack: string[] = []
  let inString = false
  let escaped = false
  let inLineComment = false
  let prevSlash = false

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!

    if (inLineComment) {
      if (ch === '\n') inLineComment = false
      continue
    }

    if (inString) {
      prevSlash = false
      if (escaped) {
        escaped = false
        continue
      }
      // A closing quote ends the string; so does a raw newline, because the
      // lexer refuses to carry a string across one. An *escaped* newline is
      // consumed above and does not reach here, matching `scanString`.
      if (ch === '\\') escaped = true
      else if (ch === '"' || ch === '\n') inString = false
      continue
    }

    if (ch === '/') {
      if (prevSlash) {
        inLineComment = true
        prevSlash = false
      } else {
        prevSlash = true
      }
      continue
    }
    prevSlash = false

    if (ch === '"') {
      inString = true
    } else if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch)
      depth = stack.length
      if (depth > MAX_KIP_NESTING_DEPTH) {
        throw resourceExhausted(
          `KIP input nesting exceeds maximum ${MAX_KIP_NESTING_DEPTH}`
        )
      }
    } else if (ch === ')') {
      if (stack[stack.length - 1] === '(') stack.pop()
    } else if (ch === ']') {
      if (stack[stack.length - 1] === '[') stack.pop()
    } else if (ch === '}') {
      if (stack[stack.length - 1] === '{') stack.pop()
    }
  }
}

/**
 * Rejects an over-long batch of commands.
 *
 * @throws {KipSyntaxError} `KIP_4002` when the batch is too large.
 */
export function checkBatchBudget(count: number): void {
  if (count > MAX_KIP_BATCH_COMMANDS) {
    throw resourceExhausted(
      `KIP batch of ${count} commands exceeds maximum ${MAX_KIP_BATCH_COMMANDS}`
    )
  }
}
