import { Token, TokenType, KEYWORDS } from './token.js'

/**
 * Characters that continue a word for boundary purposes. Unicode-aware on
 * purpose: `FROMé` is one word to the grammar even though `é` cannot start a
 * KIP identifier, so `FROM` must not be lifted out of it as a keyword.
 */
const WORD_CHAR = /[\p{Alphabetic}\p{N}]/u

export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source)
  return lexer.tokenizeAll()
}

class Lexer {
  private source: string
  private pos: number = 0
  private line: number = 0
  private column: number = 0
  private tokens: Token[] = []

  constructor(source: string) {
    this.source = source
  }

  tokenizeAll(): Token[] {
    while (this.pos < this.source.length) {
      this.scanToken()
    }
    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      offset: this.pos,
      line: this.line,
      column: this.column
    })
    return this.tokens
  }

  private peek(): string {
    return this.source[this.pos] ?? ''
  }

  private peekAt(offset: number): string {
    return this.source[this.pos + offset] ?? ''
  }

  private advance(): string {
    const ch = this.source[this.pos]!
    this.pos++
    if (ch === '\n') {
      this.line++
      this.column = 0
    } else {
      this.column++
    }
    return ch
  }

  private scanToken(): void {
    const ch = this.peek()

    // Whitespace (excluding newlines)
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      this.scanWhitespace()
      return
    }

    // Newlines
    if (ch === '\n') {
      const start = this.pos
      const startLine = this.line
      const startCol = this.column
      this.advance()
      this.pushToken(TokenType.Newline, '\n', start, startLine, startCol)
      return
    }

    // Comments
    if (ch === '/' && this.peekAt(1) === '/') {
      this.scanComment()
      return
    }

    // Strings
    if (ch === '"') {
      this.scanString()
      return
    }

    // Numbers: digits or negative sign followed by digit
    if (this.isDigit(ch) || (ch === '-' && this.isDigit(this.peekAt(1)))) {
      this.scanNumber()
      return
    }

    // Variables: ?identifier
    if (ch === '?') {
      this.scanVariable()
      return
    }

    // Identifiers and keywords
    if (this.isIdentStart(ch)) {
      this.scanIdentifier()
      return
    }

    // Two-character operators
    if (ch === '=' && this.peekAt(1) === '=') {
      this.scanFixedToken(TokenType.Eq, 2)
      return
    }
    if (ch === '!' && this.peekAt(1) === '=') {
      this.scanFixedToken(TokenType.NotEq, 2)
      return
    }
    if (ch === '<' && this.peekAt(1) === '=') {
      this.scanFixedToken(TokenType.LtEq, 2)
      return
    }
    if (ch === '>' && this.peekAt(1) === '=') {
      this.scanFixedToken(TokenType.GtEq, 2)
      return
    }
    if (ch === '&' && this.peekAt(1) === '&') {
      this.scanFixedToken(TokenType.And, 2)
      return
    }
    if (ch === '|' && this.peekAt(1) === '|') {
      this.scanFixedToken(TokenType.Or, 2)
      return
    }

    // Single-character operators. A `-` that did not start a number is the
    // unary negation of `unary_expression`, e.g. `FILTER(-?x < 0)`.
    if (ch === '-') {
      this.scanFixedToken(TokenType.Minus, 1)
      return
    }
    if (ch === '<') {
      this.scanFixedToken(TokenType.Lt, 1)
      return
    }
    if (ch === '>') {
      this.scanFixedToken(TokenType.Gt, 1)
      return
    }
    if (ch === '!') {
      this.scanFixedToken(TokenType.Bang, 1)
      return
    }

    // Colon: could be parameter placeholder (:name) or punctuation
    if (ch === ':') {
      if (this.isIdentStart(this.peekAt(1))) {
        this.scanParameter()
        return
      }
      this.scanFixedToken(TokenType.Colon, 1)
      return
    }

    // Pipe: could be || (already handled) or single |
    if (ch === '|') {
      this.scanFixedToken(TokenType.Pipe, 1)
      return
    }

    // Punctuation
    const punctMap: Record<string, TokenType> = {
      '{': TokenType.LBrace,
      '}': TokenType.RBrace,
      '(': TokenType.LParen,
      ')': TokenType.RParen,
      '[': TokenType.LBracket,
      ']': TokenType.RBracket,
      ',': TokenType.Comma,
      '.': TokenType.Dot
    }

    if (ch in punctMap) {
      this.scanFixedToken(punctMap[ch]!, 1)
      return
    }

    // Unknown character
    const start = this.pos
    const startLine = this.line
    const startCol = this.column
    this.advance()
    this.pushToken(TokenType.Unknown, ch, start, startLine, startCol)
  }

  private scanWhitespace(): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column
    while (this.pos < this.source.length) {
      const ch = this.peek()
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance()
      } else {
        break
      }
    }
    this.pushToken(
      TokenType.Whitespace,
      this.source.slice(start, this.pos),
      start,
      startLine,
      startCol
    )
  }

  private scanComment(): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column
    // Skip //
    this.advance()
    this.advance()
    while (this.pos < this.source.length && this.peek() !== '\n') {
      this.advance()
    }
    this.pushToken(
      TokenType.Comment,
      this.source.slice(start, this.pos),
      start,
      startLine,
      startCol
    )
  }

  private scanString(): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column
    this.advance() // skip opening "
    while (this.pos < this.source.length) {
      const ch = this.peek()
      if (ch === '\\') {
        this.advance() // skip backslash
        if (this.pos < this.source.length) {
          this.advance() // skip escaped char
        }
      } else if (ch === '"') {
        this.advance() // skip closing "
        this.pushToken(
          TokenType.String,
          this.source.slice(start, this.pos),
          start,
          startLine,
          startCol
        )
        return
      } else if (ch === '\n') {
        // Unterminated string at newline
        break
      } else {
        this.advance()
      }
    }
    // Unterminated string
    this.pushToken(
      TokenType.String,
      this.source.slice(start, this.pos),
      start,
      startLine,
      startCol
    )
  }

  private scanNumber(): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column

    // Optional negative sign
    if (this.peek() === '-') {
      this.advance()
    }

    // Integer part
    while (this.pos < this.source.length && this.isDigit(this.peek())) {
      this.advance()
    }

    // Fractional part
    if (this.peek() === '.' && this.isDigit(this.peekAt(1))) {
      this.advance() // skip .
      while (this.pos < this.source.length && this.isDigit(this.peek())) {
        this.advance()
      }
    }

    // Exponent part: consume only if it is complete JSON-number syntax.
    if (
      (this.peek() === 'e' || this.peek() === 'E') &&
      (this.isDigit(this.peekAt(1)) ||
        ((this.peekAt(1) === '+' || this.peekAt(1) === '-') &&
          this.isDigit(this.peekAt(2))))
    ) {
      this.advance()
      if (this.peek() === '+' || this.peek() === '-') {
        this.advance()
      }
      while (this.pos < this.source.length && this.isDigit(this.peek())) {
        this.advance()
      }
    }

    this.pushToken(
      TokenType.Number,
      this.source.slice(start, this.pos),
      start,
      startLine,
      startCol
    )
  }

  private scanVariable(): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column
    this.advance() // skip ?

    if (this.isIdentStart(this.peek())) {
      while (this.pos < this.source.length && this.isIdentPart(this.peek())) {
        this.advance()
      }
      this.pushToken(
        TokenType.Variable,
        this.source.slice(start, this.pos),
        start,
        startLine,
        startCol
      )
    } else {
      // Bare ? is unknown
      this.pushToken(TokenType.Unknown, '?', start, startLine, startCol)
    }
  }

  private scanParameter(): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column
    this.advance() // skip :

    while (this.pos < this.source.length && this.isIdentPart(this.peek())) {
      this.advance()
    }
    this.pushToken(
      TokenType.Parameter,
      this.source.slice(start, this.pos),
      start,
      startLine,
      startCol
    )
  }

  private scanIdentifier(): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column

    while (this.pos < this.source.length && this.isIdentPart(this.peek())) {
      this.advance()
    }

    const value = this.source.slice(start, this.pos)
    const upper = value.toUpperCase()

    // Check for boolean and null literals (case-sensitive)
    if (value === 'true' || value === 'false') {
      this.pushToken(TokenType.Boolean, value, start, startLine, startCol)
      return
    }
    if (value === 'null') {
      this.pushToken(TokenType.Null, value, start, startLine, startCol)
      return
    }

    // A keyword only counts as one at a word boundary. Letters, digits and `_`
    // are already absorbed above, so what remains to exclude is `?` and `"`:
    // `FROM?x` and `TYPE"Drug"` are not `FROM ?x` and `TYPE "Drug"` written
    // tersely, they are unparseable — and accepting them here would let a
    // command run on this parser that a spec-conformant engine rejects.
    //
    // KIP 2.0 keywords are ASCII case-insensitive, so `find`, `Find` and
    // `FIND` are one token; the original spelling is kept in `value` so the
    // formatter can canonicalize it to uppercase without losing the source.
    if (this.atWordBoundary()) {
      const kwType = KEYWORDS.get(upper)
      if (kwType) {
        this.pushToken(kwType, value, start, startLine, startCol)
        return
      }
    }

    this.pushToken(TokenType.Identifier, value, start, startLine, startCol)
  }

  private scanFixedToken(type: TokenType, length: number): void {
    const start = this.pos
    const startLine = this.line
    const startCol = this.column
    for (let i = 0; i < length; i++) {
      this.advance()
    }
    this.pushToken(
      type,
      this.source.slice(start, this.pos),
      start,
      startLine,
      startCol
    )
  }

  private pushToken(
    type: TokenType,
    value: string,
    offset: number,
    line: number,
    column: number
  ): void {
    this.tokens.push({ type, value, offset, line, column })
  }

  /**
   * True when the character at the cursor ends a keyword.
   *
   * Mirrors the grammar's word boundary: a keyword may butt directly against
   * punctuation (`WHERE{`, `FIND(`) but not against something that could have
   * been part of an identifier, a variable, or a string.
   */
  private atWordBoundary(): boolean {
    if (this.pos >= this.source.length) return true
    // Read a whole code point: a surrogate pair tested one unit at a time is
    // alphabetic in neither half, which would read `FROM𝔸` as `FROM` + junk
    // while a `char`-based engine reads it as one word.
    const cp = String.fromCodePoint(this.source.codePointAt(this.pos)!)
    if (cp === '?' || cp === '"' || cp === '_') return false
    return !WORD_CHAR.test(cp)
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9'
  }

  private isIdentStart(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'
  }

  private isIdentPart(ch: string): boolean {
    return this.isIdentStart(ch) || this.isDigit(ch)
  }
}
