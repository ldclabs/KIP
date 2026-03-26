import type { Range } from './token.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { TokenType } from './token.js'

export interface Diagnostic {
  range: Range
  severity: 'error' | 'warning' | 'info'
  message: string
  code: string
}

/**
 * Runs diagnostics on KIP source code.
 * Combines lexer-level issues (unterminated strings, unknown tokens)
 * with parser-level syntax errors.
 */
export function diagnose(source: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  // Phase 1: Lexer-level diagnostics
  const tokens = tokenize(source)
  for (const tok of tokens) {
    if (tok.type === TokenType.Unknown) {
      diagnostics.push({
        range: {
          start: { line: tok.line, column: tok.column },
          end: { line: tok.line, column: tok.column + tok.value.length }
        },
        severity: 'error',
        message: `Unexpected character '${tok.value}'`,
        code: 'KIP_LEX_UNKNOWN'
      })
    }

    // Check for unterminated strings
    if (tok.type === TokenType.String) {
      if (!tok.value.endsWith('"') || tok.value.length < 2) {
        diagnostics.push({
          range: {
            start: { line: tok.line, column: tok.column },
            end: { line: tok.line, column: tok.column + tok.value.length }
          },
          severity: 'error',
          message: 'Unterminated string literal',
          code: 'KIP_LEX_UNTERMINATED_STRING'
        })
      }
    }
  }

  // Phase 2: Bracket/paren matching
  const bracketStack: { type: string; line: number; column: number }[] = []
  const openers: Record<string, string> = { '{': '}', '(': ')', '[': ']' }
  const closers: Record<string, string> = { '}': '{', ')': '(', ']': '[' }

  for (const tok of tokens) {
    if (
      tok.type === TokenType.LBrace ||
      tok.type === TokenType.LParen ||
      tok.type === TokenType.LBracket
    ) {
      bracketStack.push({ type: tok.value, line: tok.line, column: tok.column })
    } else if (
      tok.type === TokenType.RBrace ||
      tok.type === TokenType.RParen ||
      tok.type === TokenType.RBracket
    ) {
      const expected = closers[tok.value]
      if (bracketStack.length === 0) {
        diagnostics.push({
          range: {
            start: { line: tok.line, column: tok.column },
            end: { line: tok.line, column: tok.column + 1 }
          },
          severity: 'error',
          message: `Unmatched closing '${tok.value}'`,
          code: 'KIP_LEX_UNMATCHED_BRACKET'
        })
      } else {
        const top = bracketStack[bracketStack.length - 1]!
        if (top.type !== expected) {
          diagnostics.push({
            range: {
              start: { line: tok.line, column: tok.column },
              end: { line: tok.line, column: tok.column + 1 }
            },
            severity: 'error',
            message: `Mismatched bracket: expected '${openers[top.type]}' but got '${tok.value}'`,
            code: 'KIP_LEX_MISMATCHED_BRACKET'
          })
        }
        bracketStack.pop()
      }
    }
  }

  // Report unclosed brackets
  for (const unclosed of bracketStack) {
    diagnostics.push({
      range: {
        start: { line: unclosed.line, column: unclosed.column },
        end: { line: unclosed.line, column: unclosed.column + 1 }
      },
      severity: 'error',
      message: `Unclosed '${unclosed.type}'`,
      code: 'KIP_LEX_UNCLOSED_BRACKET'
    })
  }

  // Phase 3: Parser diagnostics
  const { diagnostics: parseDiags } = parse(source)
  diagnostics.push(...parseDiags)

  return diagnostics
}
