import { tokenize } from './lexer.js'
import { Token, TokenType, isTrivia } from './token.js'
import type { Range, Position } from './token.js'
import type {
  Program,
  Statement,
  FindStatement,
  UpsertStatement,
  DeleteStatement,
  DescribeStatement,
  SearchStatement,
  WhereClause,
  WherePattern,
  ConceptPattern,
  ConceptMatcher,
  PropositionPattern,
  PropositionEndpoint,
  PredicateExpr,
  PredicateLiteral,
  HopRange,
  FilterClause,
  NotClause,
  OptionalClause,
  UnionClause,
  ConceptBlock,
  PropositionBlock,
  SetAttributes,
  SetPropositions,
  PropositionItem,
  WithMetadata,
  OrderByClause,
  LimitClause,
  CursorClause,
  Expression,
  BinaryExpression,
  UnaryExpression,
  FunctionCallExpr,
  DotExpression,
  VariableRef,
  ParameterRef,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
  ArrayLiteral,
  ObjectLiteral,
  ObjectEntry,
  UpsertBlock
} from './ast.js'
import type { Diagnostic } from './diagnostics.js'

export interface ParseResult {
  ast: Program
  diagnostics: Diagnostic[]
}

export function parse(source: string): ParseResult {
  const allTokens = tokenize(source)
  const parser = new Parser(allTokens, source)
  return parser.parse()
}

class Parser {
  private tokens: Token[]
  private pos: number = 0
  private diagnostics: Diagnostic[] = []
  private source: string

  constructor(tokens: Token[], source: string) {
    // Filter out trivia for parsing, but keep comments for attachment later
    this.tokens = tokens.filter(
      (t) => !isTrivia(t.type) || t.type === TokenType.Comment
    )
    this.source = source
  }

  parse(): ParseResult {
    const statements: Statement[] = []
    const start = this.currentPos()
    this.skipComments()
    while (!this.isAtEnd()) {
      this.skipComments()
      if (this.isAtEnd()) break
      try {
        const stmt = this.parseStatement()
        if (stmt) statements.push(stmt)
      } catch {
        // Error recovery: skip to next statement-level keyword
        this.recoverToNextStatement()
      }
    }
    const end = this.currentPos()
    return {
      ast: { kind: 'Program', statements, range: { start, end } },
      diagnostics: this.diagnostics
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  Statement dispatch
  // ────────────────────────────────────────────────────────────────────

  private parseStatement(): Statement | null {
    const tok = this.current()
    switch (tok.type) {
      case TokenType.Find:
        return this.parseFindStatement()
      case TokenType.Upsert:
        return this.parseUpsertStatement()
      case TokenType.Delete:
        return this.parseDeleteStatement()
      case TokenType.Describe:
        return this.parseDescribeStatement()
      case TokenType.Search:
        return this.parseSearchStatement()
      default:
        this.error(
          `Unexpected token '${tok.value}', expected a statement keyword (FIND, UPSERT, DELETE, DESCRIBE, SEARCH)`,
          tok
        )
        this.advance()
        return null
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  FIND
  // ────────────────────────────────────────────────────────────────────

  private parseFindStatement(): FindStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expect(TokenType.Find)
    this.expect(TokenType.LParen)

    const projections: Expression[] = []
    if (!this.check(TokenType.RParen)) {
      projections.push(this.parseExpression())
      while (this.match(TokenType.Comma)) {
        projections.push(this.parseExpression())
      }
    }
    this.expect(TokenType.RParen)

    let where: WhereClause | undefined
    let orderBy: OrderByClause | undefined
    let limit: LimitClause | undefined
    let cursor: CursorClause | undefined

    if (this.check(TokenType.Where)) {
      where = this.parseWhereClause()
    }
    if (this.check(TokenType.Order)) {
      orderBy = this.parseOrderBy()
    }
    if (this.check(TokenType.Limit)) {
      limit = this.parseLimitClause()
    }
    if (this.check(TokenType.Cursor)) {
      cursor = this.parseCursorClause()
    }

    return {
      kind: 'FindStatement',
      projections,
      where,
      orderBy,
      limit,
      cursor,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  UPSERT
  // ────────────────────────────────────────────────────────────────────

  private parseUpsertStatement(): UpsertStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expect(TokenType.Upsert)
    this.expect(TokenType.LBrace)

    const blocks: UpsertBlock[] = []
    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      this.skipComments()
      if (this.check(TokenType.Concept)) {
        blocks.push(this.parseConceptBlock())
      } else if (this.check(TokenType.Proposition)) {
        blocks.push(this.parsePropositionBlock())
      } else if (this.check(TokenType.RBrace)) {
        break
      } else {
        this.error(
          `Expected CONCEPT or PROPOSITION inside UPSERT block`,
          this.current()
        )
        this.advance()
      }
      this.skipComments()
    }
    this.expect(TokenType.RBrace)

    let metadata: WithMetadata | undefined
    if (this.check(TokenType.With)) {
      metadata = this.parseWithMetadata()
    }

    return {
      kind: 'UpsertStatement',
      blocks,
      metadata,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  private parseConceptBlock(): ConceptBlock {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expect(TokenType.Concept)

    const handle = this.expectVariable()
    this.expect(TokenType.LBrace)

    const matcher = this.parseConceptMatcher()

    let setAttributes: SetAttributes | undefined
    let setPropositions: SetPropositions | undefined
    let metadata: WithMetadata | undefined

    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      this.skipComments()
      if (this.check(TokenType.Set)) {
        const setStart = this.currentPos()
        this.advance() // skip SET
        if (this.check(TokenType.Attributes)) {
          this.advance()
          setAttributes = this.parseSetAttributesBody(setStart)
        } else if (this.check(TokenType.Propositions)) {
          this.advance()
          setPropositions = this.parseSetPropositionsBody(setStart)
        } else {
          this.error(
            `Expected ATTRIBUTES or PROPOSITIONS after SET`,
            this.current()
          )
          this.advance()
        }
      } else if (this.check(TokenType.With)) {
        metadata = this.parseWithMetadata()
      } else if (this.check(TokenType.RBrace)) {
        break
      } else {
        this.skipComments()
        if (this.check(TokenType.RBrace)) break
        this.error(
          `Unexpected token '${this.current().value}' in CONCEPT block`,
          this.current()
        )
        this.advance()
      }
      this.skipComments()
    }

    this.expect(TokenType.RBrace)

    // Concept-level WITH METADATA (outside the CONCEPT braces)
    if (!metadata && this.check(TokenType.With)) {
      metadata = this.parseWithMetadata()
    }

    return {
      kind: 'ConceptBlock',
      handle,
      matcher,
      setAttributes,
      setPropositions,
      metadata,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  private parsePropositionBlock(): PropositionBlock {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expect(TokenType.Proposition)

    let handle: string | undefined
    if (this.check(TokenType.Variable)) {
      handle = this.expectVariable()
    }

    this.expect(TokenType.LBrace)
    const proposition = this.parsePropositionPatternBody(undefined)

    let setAttributes: SetAttributes | undefined
    let metadata: WithMetadata | undefined

    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      this.skipComments()
      if (this.check(TokenType.Set)) {
        const setStart = this.currentPos()
        this.advance()
        if (this.check(TokenType.Attributes)) {
          this.advance()
          setAttributes = this.parseSetAttributesBody(setStart)
        } else {
          this.error(
            `Expected ATTRIBUTES after SET in PROPOSITION block`,
            this.current()
          )
          this.advance()
        }
      } else if (this.check(TokenType.RBrace)) {
        break
      } else {
        this.advance()
      }
      this.skipComments()
    }

    this.expect(TokenType.RBrace)

    if (this.check(TokenType.With)) {
      metadata = this.parseWithMetadata()
    }

    return {
      kind: 'PropositionBlock',
      handle,
      id: proposition.id,
      subject: proposition.subject,
      predicate: proposition.predicate,
      object: proposition.object,
      setAttributes,
      metadata,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  DELETE
  // ────────────────────────────────────────────────────────────────────

  private parseDeleteStatement(): DeleteStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expect(TokenType.Delete)

    let deleteType: DeleteStatement['deleteType']
    let keys: string[] | undefined
    let target: string
    let detach = false

    if (this.check(TokenType.Attributes)) {
      deleteType = 'ATTRIBUTES'
      this.advance()
      keys = this.parseDeleteKeySet()
      this.expect(TokenType.From)
      target = this.expectVariable()
    } else if (this.check(TokenType.Metadata)) {
      deleteType = 'METADATA'
      this.advance()
      keys = this.parseDeleteKeySet()
      this.expect(TokenType.From)
      target = this.expectVariable()
    } else if (this.check(TokenType.Propositions)) {
      deleteType = 'PROPOSITIONS'
      this.advance()
      target = this.expectVariable()
    } else if (this.check(TokenType.Concept)) {
      deleteType = 'CONCEPT'
      this.advance()
      target = this.expectVariable()
      if (this.check(TokenType.Detach)) {
        detach = true
        this.advance()
      } else {
        this.error(
          `Expected DETACH after DELETE CONCEPT target '${target}'`,
          this.current()
        )
      }
    } else {
      this.error(
        `Expected ATTRIBUTES, METADATA, PROPOSITIONS, or CONCEPT after DELETE`,
        this.current()
      )
      deleteType = 'ATTRIBUTES'
      target = '?unknown'
    }

    const where = this.parseWhereClause()

    return {
      kind: 'DeleteStatement',
      deleteType,
      keys,
      target,
      detach: detach || undefined,
      where,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  private parseDeleteKeySet(): string[] {
    this.expect(TokenType.LBrace)
    const keys: string[] = []
    if (!this.check(TokenType.RBrace)) {
      keys.push(this.expectString())
      while (this.match(TokenType.Comma)) {
        if (this.check(TokenType.RBrace)) break
        keys.push(this.expectString())
      }
    }
    this.expect(TokenType.RBrace)
    return keys
  }

  // ────────────────────────────────────────────────────────────────────
  //  DESCRIBE
  // ────────────────────────────────────────────────────────────────────

  private parseDescribeStatement(): DescribeStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expect(TokenType.Describe)

    let describeType: DescribeStatement['describeType']
    let typeName: string | undefined
    let limit: LimitClause | undefined
    let cursor: CursorClause | undefined

    if (this.check(TokenType.Primer)) {
      describeType = 'PRIMER'
      this.advance()
    } else if (this.check(TokenType.Domains)) {
      describeType = 'DOMAINS'
      this.advance()
    } else if (this.check(TokenType.Concept)) {
      this.advance()
      if (this.check(TokenType.Types)) {
        describeType = 'CONCEPT_TYPES'
        this.advance()
      } else if (this.check(TokenType.Type)) {
        describeType = 'CONCEPT_TYPE'
        this.advance()
        typeName = this.expectStringValue()
      } else {
        this.error(
          `Expected TYPE or TYPES after DESCRIBE CONCEPT`,
          this.current()
        )
        describeType = 'CONCEPT_TYPES'
      }
    } else if (this.check(TokenType.Proposition)) {
      this.advance()
      if (this.check(TokenType.Types)) {
        describeType = 'PROPOSITION_TYPES'
        this.advance()
      } else if (this.check(TokenType.Type)) {
        describeType = 'PROPOSITION_TYPE'
        this.advance()
        typeName = this.expectStringValue()
      } else {
        this.error(
          `Expected TYPE or TYPES after DESCRIBE PROPOSITION`,
          this.current()
        )
        describeType = 'PROPOSITION_TYPES'
      }
    } else {
      this.error(
        `Expected PRIMER, DOMAINS, CONCEPT, or PROPOSITION after DESCRIBE`,
        this.current()
      )
      describeType = 'PRIMER'
    }

    if (this.check(TokenType.Limit)) {
      limit = this.parseLimitClause()
    }
    if (this.check(TokenType.Cursor)) {
      cursor = this.parseCursorClause()
    }

    return {
      kind: 'DescribeStatement',
      describeType,
      typeName,
      limit,
      cursor,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  SEARCH
  // ────────────────────────────────────────────────────────────────────

  private parseSearchStatement(): SearchStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expect(TokenType.Search)

    let searchTarget: 'CONCEPT' | 'PROPOSITION'
    if (this.check(TokenType.Concept)) {
      searchTarget = 'CONCEPT'
      this.advance()
    } else if (this.check(TokenType.Proposition)) {
      searchTarget = 'PROPOSITION'
      this.advance()
    } else {
      this.error(`Expected CONCEPT or PROPOSITION after SEARCH`, this.current())
      searchTarget = 'CONCEPT'
    }

    const term = this.expectStringValue()

    let withType: string | undefined
    if (this.check(TokenType.With)) {
      this.advance()
      this.expect(TokenType.Type)
      withType = this.expectStringValue()
    }

    let limit: LimitClause | undefined
    if (this.check(TokenType.Limit)) {
      limit = this.parseLimitClause()
    }

    return {
      kind: 'SearchStatement',
      searchTarget,
      term,
      withType,
      limit,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  WHERE clause and patterns
  // ────────────────────────────────────────────────────────────────────

  private parseWhereClause(): WhereClause {
    const start = this.currentPos()
    this.expect(TokenType.Where)
    this.expect(TokenType.LBrace)

    const patterns = this.parseWherePatterns()

    this.expect(TokenType.RBrace)
    return {
      kind: 'WhereClause',
      patterns,
      range: { start, end: this.currentPos() }
    }
  }

  private parseWherePatterns(): WherePattern[] {
    const patterns: WherePattern[] = []
    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      this.skipComments()
      if (this.check(TokenType.RBrace)) break

      const pattern = this.parseWherePattern()
      if (pattern) patterns.push(pattern)
      this.skipComments()
    }
    return patterns
  }

  private parseWherePattern(): WherePattern | null {
    this.skipComments()
    const tok = this.current()

    if (tok.type === TokenType.Filter) {
      return this.parseFilterClause()
    }
    if (tok.type === TokenType.Not) {
      return this.parseNotClause()
    }
    if (tok.type === TokenType.Optional) {
      return this.parseOptionalClause()
    }
    if (tok.type === TokenType.Union) {
      return this.parseUnionClause()
    }
    // Variable: could be concept pattern or proposition pattern
    if (tok.type === TokenType.Variable) {
      return this.parseVariableLeadingPattern()
    }
    // Opening ( = proposition pattern without variable binding
    if (tok.type === TokenType.LParen) {
      return this.parsePropositionPatternBody(undefined)
    }

    this.error(`Unexpected token '${tok.value}' in WHERE clause`, tok)
    this.advance()
    return null
  }

  private parseVariableLeadingPattern(): WherePattern {
    // ?var could be followed by:
    //  { ... }  => concept pattern
    //  ( ... )  => proposition pattern
    const start = this.currentPos()
    const variable = this.expectVariable()

    if (this.check(TokenType.LBrace)) {
      return this.parseConceptPatternBody(variable, start)
    }
    if (this.check(TokenType.LParen)) {
      return this.parsePropositionPatternBody(variable, start)
    }

    // Just a variable reference as a standalone concept pattern without matcher
    // This occurs in WHERE like: ?drug {type: "Drug"}
    this.error(
      `Expected '{' or '(' after variable '${variable}' in WHERE clause`,
      this.current()
    )
    return {
      kind: 'ConceptPattern',
      variable,
      matcher: {
        kind: 'ConceptMatcher',
        entries: [],
        range: { start, end: this.currentPos() }
      },
      range: { start, end: this.currentPos() }
    }
  }

  private parseConceptPatternBody(
    variable: string | undefined,
    start: Position
  ): ConceptPattern {
    const matcher = this.parseConceptMatcher()
    return {
      kind: 'ConceptPattern',
      variable,
      matcher,
      range: { start, end: this.currentPos() }
    }
  }

  private parseConceptMatcher(): ConceptMatcher {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const entries = this.parseObjectEntries()
    this.expect(TokenType.RBrace)
    return {
      kind: 'ConceptMatcher',
      entries,
      range: { start, end: this.currentPos() }
    }
  }

  private parsePropositionPatternBody(
    variable: string | undefined,
    start: Position = this.currentPos()
  ): PropositionPattern {
    this.expect(TokenType.LParen)

    if (this.isIdMatcherStart()) {
      const id = this.parseIdMatcherValue()
      this.expect(TokenType.RParen)
      return {
        kind: 'PropositionPattern',
        variable,
        id,
        range: { start, end: this.currentPos() }
      }
    }

    const subject = this.parsePropositionEndpoint()
    this.expect(TokenType.Comma)
    const predicate = this.parsePredicateExpr()
    this.expect(TokenType.Comma)
    const object = this.parsePropositionEndpoint()

    this.expect(TokenType.RParen)

    return {
      kind: 'PropositionPattern',
      variable,
      subject,
      predicate,
      object,
      range: { start, end: this.currentPos() }
    }
  }

  private parsePropositionEndpoint(): PropositionEndpoint {
    // Could be: ?var, {type: ..., name: ...}, or nested (subject, pred, object)
    if (this.check(TokenType.Variable)) {
      const start = this.currentPos()
      const name = this.expectVariable()
      return {
        kind: 'VariableRef',
        name,
        range: { start, end: this.currentPos() }
      }
    }
    if (this.check(TokenType.LBrace)) {
      const start = this.currentPos()
      const matcher = this.parseConceptMatcher()
      return {
        kind: 'ConceptPattern',
        matcher,
        range: { start, end: this.currentPos() }
      }
    }
    if (this.check(TokenType.LParen)) {
      return this.parsePropositionPatternBody(undefined)
    }
    this.error(
      `Expected variable, concept pattern, or proposition pattern`,
      this.current()
    )
    const start = this.currentPos()
    return {
      kind: 'VariableRef',
      name: '?unknown',
      range: { start, end: start }
    }
  }

  private parsePredicateExpr(): PredicateExpr {
    const start = this.currentPos()
    const first = this.parsePredicateLiteral()

    // Check for alternation: "pred1" | "pred2"
    if (this.check(TokenType.Pipe)) {
      const predicates: PredicateLiteral[] = [first]
      while (this.match(TokenType.Pipe)) {
        predicates.push(this.parsePredicateLiteral())
      }
      return {
        kind: 'PredicateAlternation',
        predicates,
        range: { start, end: this.currentPos() }
      }
    }

    return first
  }

  private parsePredicateLiteral(): PredicateLiteral {
    const start = this.currentPos()
    const value = this.expectStringValue()

    // Check for hop range: {m,n} {m,} {m}
    let hopRange: HopRange | undefined
    if (this.check(TokenType.LBrace)) {
      hopRange = this.parseHopRange()
    }

    return {
      kind: 'PredicateLiteral',
      value,
      hopRange,
      range: { start, end: this.currentPos() }
    }
  }

  private parseHopRange(): HopRange {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)

    const minTok = this.current()
    if (minTok.type !== TokenType.Number) {
      this.error(`Expected number in hop range`, minTok)
    }
    const min = Number(minTok.value)
    this.advance()

    let max: number | undefined
    if (this.match(TokenType.Comma)) {
      if (this.check(TokenType.Number)) {
        max = Number(this.current().value)
        this.advance()
      }
      // else: {m,} means unbounded
    } else {
      max = min // {m} means exactly m
    }

    this.expect(TokenType.RBrace)
    return {
      kind: 'HopRange',
      min,
      max,
      range: { start, end: this.currentPos() }
    }
  }

  private parseFilterClause(): FilterClause {
    const start = this.currentPos()
    this.expect(TokenType.Filter)
    this.expect(TokenType.LParen)
    const expression = this.parseExpression()
    this.expect(TokenType.RParen)
    return {
      kind: 'FilterClause',
      expression,
      range: { start, end: this.currentPos() }
    }
  }

  private parseNotClause(): NotClause {
    const start = this.currentPos()
    this.expect(TokenType.Not)
    this.expect(TokenType.LBrace)
    const patterns = this.parseWherePatterns()
    this.expect(TokenType.RBrace)
    return {
      kind: 'NotClause',
      patterns,
      range: { start, end: this.currentPos() }
    }
  }

  private parseOptionalClause(): OptionalClause {
    const start = this.currentPos()
    this.expect(TokenType.Optional)
    this.expect(TokenType.LBrace)
    const patterns = this.parseWherePatterns()
    this.expect(TokenType.RBrace)
    return {
      kind: 'OptionalClause',
      patterns,
      range: { start, end: this.currentPos() }
    }
  }

  private parseUnionClause(): UnionClause {
    const start = this.currentPos()
    this.expect(TokenType.Union)
    this.expect(TokenType.LBrace)
    const patterns = this.parseWherePatterns()
    this.expect(TokenType.RBrace)
    return {
      kind: 'UnionClause',
      patterns,
      range: { start, end: this.currentPos() }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  SET ATTRIBUTES / SET PROPOSITIONS / WITH METADATA
  // ────────────────────────────────────────────────────────────────────

  private parseSetAttributesBody(start: Position): SetAttributes {
    this.expect(TokenType.LBrace)
    const entries = this.parseObjectEntries()
    this.expect(TokenType.RBrace)
    return {
      kind: 'SetAttributes',
      entries,
      range: { start, end: this.currentPos() }
    }
  }

  private parseSetPropositionsBody(start: Position): SetPropositions {
    this.expect(TokenType.LBrace)
    const items: PropositionItem[] = []
    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      this.skipComments()
      if (this.check(TokenType.RBrace)) break
      items.push(this.parsePropositionItem())
      this.skipComments()
    }
    this.expect(TokenType.RBrace)
    return {
      kind: 'SetPropositions',
      items,
      range: { start, end: this.currentPos() }
    }
  }

  private parsePropositionItem(): PropositionItem {
    const start = this.currentPos()
    this.expect(TokenType.LParen)
    const predicate = this.expectStringValue()
    this.expect(TokenType.Comma)
    const target = this.parsePropositionEndpoint()
    this.expect(TokenType.RParen)

    let metadata: WithMetadata | undefined
    if (this.check(TokenType.With)) {
      metadata = this.parseWithMetadata()
    }

    return {
      kind: 'PropositionItem',
      predicate,
      target,
      metadata,
      range: { start, end: this.currentPos() }
    }
  }

  private isIdMatcherStart(): boolean {
    const next = this.tokens[this.pos + 1]
    return this.isIdKeyToken(this.current()) && next?.type === TokenType.Colon
  }

  private parseIdMatcherValue(): StringLiteral | ParameterRef {
    const keyTok = this.current()
    if (!this.isIdKeyToken(keyTok)) {
      this.error(`Expected id matcher key but got '${keyTok.value}'`, keyTok)
    }
    this.advance()
    this.expect(TokenType.Colon)
    return this.parseStringOrParameterValue('proposition id')
  }

  private parseStringOrParameterValue(
    context: string
  ): StringLiteral | ParameterRef {
    const tok = this.current()
    const start = this.currentPos()

    if (tok.type === TokenType.String) {
      this.advance()
      return {
        kind: 'StringLiteral',
        value: tok.value,
        parsed: this.unescapeString(tok.value),
        range: { start, end: this.currentPos() }
      }
    }

    if (tok.type === TokenType.Parameter) {
      this.advance()
      return {
        kind: 'ParameterRef',
        name: tok.value,
        range: { start, end: this.currentPos() }
      }
    }

    this.error(`Expected string or parameter for ${context}`, tok)
    return {
      kind: 'StringLiteral',
      value: '""',
      parsed: '',
      range: { start, end: start }
    }
  }

  private isIdKeyToken(tok: Token): boolean {
    return (
      (tok.type === TokenType.Identifier && tok.value === 'id') ||
      (tok.type === TokenType.String && this.unescapeString(tok.value) === 'id')
    )
  }

  private parseWithMetadata(): WithMetadata {
    const start = this.currentPos()
    this.expect(TokenType.With)
    this.expect(TokenType.Metadata)
    this.expect(TokenType.LBrace)
    const entries = this.parseObjectEntries()
    this.expect(TokenType.RBrace)
    return {
      kind: 'WithMetadata',
      entries,
      range: { start, end: this.currentPos() }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  ORDER BY, LIMIT, CURSOR
  // ────────────────────────────────────────────────────────────────────

  private parseOrderBy(): OrderByClause {
    const start = this.currentPos()
    this.expect(TokenType.Order)
    this.expect(TokenType.By)
    const expression = this.parseExpression()
    let direction: 'ASC' | 'DESC' = 'ASC'
    if (this.check(TokenType.Asc)) {
      this.advance()
      direction = 'ASC'
    } else if (this.check(TokenType.Desc)) {
      this.advance()
      direction = 'DESC'
    }
    return {
      kind: 'OrderByClause',
      expression,
      direction,
      range: { start, end: this.currentPos() }
    }
  }

  private parseLimitClause(): LimitClause {
    const start = this.currentPos()
    this.expect(TokenType.Limit)
    const tok = this.current()
    let value: NumberLiteral | ParameterRef
    if (tok.type === TokenType.Number) {
      value = {
        kind: 'NumberLiteral',
        value: Number(tok.value),
        raw: tok.value,
        range: { start: this.currentPos(), end: this.currentPos() }
      }
      this.advance()
      value.range.end = this.currentPos()
    } else if (tok.type === TokenType.Parameter) {
      value = {
        kind: 'ParameterRef',
        name: tok.value,
        range: { start: this.currentPos(), end: this.currentPos() }
      }
      this.advance()
      value.range.end = this.currentPos()
    } else {
      this.error(`Expected number or parameter after LIMIT`, tok)
      value = {
        kind: 'NumberLiteral',
        value: 0,
        raw: '0',
        range: { start: this.currentPos(), end: this.currentPos() }
      }
    }
    return {
      kind: 'LimitClause',
      value,
      range: { start, end: this.currentPos() }
    }
  }

  private parseCursorClause(): CursorClause {
    const start = this.currentPos()
    this.expect(TokenType.Cursor)
    const tok = this.current()
    let value: StringLiteral | ParameterRef
    if (tok.type === TokenType.String) {
      value = {
        kind: 'StringLiteral',
        value: tok.value,
        parsed: tok.value.slice(1, -1),
        range: { start: this.currentPos(), end: this.currentPos() }
      }
      this.advance()
      value.range.end = this.currentPos()
    } else if (tok.type === TokenType.Parameter) {
      value = {
        kind: 'ParameterRef',
        name: tok.value,
        range: { start: this.currentPos(), end: this.currentPos() }
      }
      this.advance()
      value.range.end = this.currentPos()
    } else {
      this.error(`Expected string or parameter after CURSOR`, tok)
      value = {
        kind: 'StringLiteral',
        value: '""',
        parsed: '',
        range: { start: this.currentPos(), end: this.currentPos() }
      }
    }
    return {
      kind: 'CursorClause',
      value,
      range: { start, end: this.currentPos() }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  Expressions (for FILTER and FIND projections)
  // ────────────────────────────────────────────────────────────────────

  private parseExpression(): Expression {
    return this.parseOrExpression()
  }

  private parseOrExpression(): Expression {
    let left = this.parseAndExpression()
    while (this.check(TokenType.Or)) {
      const start = left.range.start
      this.advance()
      const right = this.parseAndExpression()
      left = {
        kind: 'BinaryExpression',
        operator: '||',
        left,
        right,
        range: { start, end: right.range.end }
      }
    }
    return left
  }

  private parseAndExpression(): Expression {
    let left = this.parseComparisonExpression()
    while (this.check(TokenType.And)) {
      const start = left.range.start
      this.advance()
      const right = this.parseComparisonExpression()
      left = {
        kind: 'BinaryExpression',
        operator: '&&',
        left,
        right,
        range: { start, end: right.range.end }
      }
    }
    return left
  }

  private parseComparisonExpression(): Expression {
    let left = this.parseUnaryExpression()
    const compOps = [
      TokenType.Eq,
      TokenType.NotEq,
      TokenType.Lt,
      TokenType.Gt,
      TokenType.LtEq,
      TokenType.GtEq
    ]
    if (compOps.includes(this.current().type)) {
      const start = left.range.start
      const op = this.current().value
      this.advance()
      const right = this.parseUnaryExpression()
      left = {
        kind: 'BinaryExpression',
        operator: op,
        left,
        right,
        range: { start, end: right.range.end }
      }
    }
    return left
  }

  private parseUnaryExpression(): Expression {
    if (this.check(TokenType.Bang)) {
      const start = this.currentPos()
      this.advance()
      const operand = this.parseUnaryExpression()
      return {
        kind: 'UnaryExpression',
        operator: '!',
        operand,
        range: { start, end: operand.range.end }
      }
    }
    return this.parsePrimaryExpression()
  }

  private parsePrimaryExpression(): Expression {
    const tok = this.current()
    const start = this.currentPos()

    // Function call: NAME(...)
    if (this.isFunctionToken(tok.type)) {
      return this.parseFunctionCall()
    }

    // Variable (may have dot access)
    if (tok.type === TokenType.Variable) {
      const name = tok.value
      this.advance()
      let expr: Expression = {
        kind: 'VariableRef',
        name,
        range: { start, end: this.currentPos() }
      }
      // Dot access chain
      while (this.check(TokenType.Dot)) {
        this.advance()
        const propTok = this.current()
        if (
          propTok.type === TokenType.Identifier ||
          this.isNonAmbiguousKeyword(propTok.type)
        ) {
          const prop = propTok.value
          this.advance()
          expr = {
            kind: 'DotExpression',
            object: expr,
            property: prop,
            range: { start, end: this.currentPos() }
          }
        } else {
          this.error(`Expected property name after '.'`, propTok)
          break
        }
      }
      return expr
    }

    // Parameter ref
    if (tok.type === TokenType.Parameter) {
      this.advance()
      return {
        kind: 'ParameterRef',
        name: tok.value,
        range: { start, end: this.currentPos() }
      }
    }

    // String literal
    if (tok.type === TokenType.String) {
      this.advance()
      return {
        kind: 'StringLiteral',
        value: tok.value,
        parsed: this.unescapeString(tok.value),
        range: { start, end: this.currentPos() }
      }
    }

    // Number literal
    if (tok.type === TokenType.Number) {
      this.advance()
      return {
        kind: 'NumberLiteral',
        value: Number(tok.value),
        raw: tok.value,
        range: { start, end: this.currentPos() }
      }
    }

    // Boolean
    if (tok.type === TokenType.Boolean) {
      this.advance()
      return {
        kind: 'BooleanLiteral',
        value: tok.value === 'true',
        range: { start, end: this.currentPos() }
      }
    }

    // Null
    if (tok.type === TokenType.Null) {
      this.advance()
      return { kind: 'NullLiteral', range: { start, end: this.currentPos() } }
    }

    // Array
    if (tok.type === TokenType.LBracket) {
      return this.parseArrayLiteral()
    }

    // Object
    if (tok.type === TokenType.LBrace) {
      return this.parseObjectLiteral()
    }

    // Parenthesized expression
    if (tok.type === TokenType.LParen) {
      this.advance()
      const expr = this.parseExpression()
      this.expect(TokenType.RParen)
      return expr
    }

    // System identifier as literal
    if (tok.type === TokenType.SystemIdent) {
      this.advance()
      return {
        kind: 'StringLiteral',
        value: `"${tok.value}"`,
        parsed: tok.value,
        range: { start, end: this.currentPos() }
      }
    }

    // Identifier (bare word — could be used as a key value)
    if (tok.type === TokenType.Identifier) {
      this.advance()
      return {
        kind: 'StringLiteral',
        value: `"${tok.value}"`,
        parsed: tok.value,
        range: { start, end: this.currentPos() }
      }
    }

    this.error(`Unexpected token '${tok.value}' in expression`, tok)
    this.advance()
    return { kind: 'NullLiteral', range: { start, end: this.currentPos() } }
  }

  private parseFunctionCall(): FunctionCallExpr {
    const start = this.currentPos()
    const name = this.current().value
    this.advance()
    this.expect(TokenType.LParen)

    const args: Expression[] = []
    if (!this.check(TokenType.RParen)) {
      // Handle DISTINCT keyword inside COUNT
      if (this.current().type === TokenType.Distinct) {
        const dStart = this.currentPos()
        this.advance()
        const innerArg = this.parseExpression()
        args.push({
          kind: 'FunctionCallExpr',
          name: 'DISTINCT',
          args: [innerArg],
          range: { start: dStart, end: this.currentPos() }
        })
      } else {
        args.push(this.parseExpression())
      }
      while (this.match(TokenType.Comma)) {
        args.push(this.parseExpression())
      }
    }

    this.expect(TokenType.RParen)

    return {
      kind: 'FunctionCallExpr',
      name,
      args,
      range: { start, end: this.currentPos() }
    }
  }

  private parseArrayLiteral(): ArrayLiteral {
    const start = this.currentPos()
    this.expect(TokenType.LBracket)
    const elements: Expression[] = []
    this.skipComments()
    if (!this.check(TokenType.RBracket)) {
      elements.push(this.parseExpression())
      while (this.match(TokenType.Comma)) {
        this.skipComments()
        if (this.check(TokenType.RBracket)) break
        elements.push(this.parseExpression())
      }
    }
    this.skipComments()
    this.expect(TokenType.RBracket)
    return {
      kind: 'ArrayLiteral',
      elements,
      range: { start, end: this.currentPos() }
    }
  }

  private parseObjectLiteral(): ObjectLiteral {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const entries = this.parseObjectEntries()
    this.expect(TokenType.RBrace)
    return {
      kind: 'ObjectLiteral',
      entries,
      range: { start, end: this.currentPos() }
    }
  }

  private parseObjectEntries(): ObjectEntry[] {
    const entries: ObjectEntry[] = []
    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      this.skipComments()
      if (this.check(TokenType.RBrace)) break

      const entryStart = this.currentPos()
      const { key, isQuoted } = this.expectKeyWithQuoting()
      this.expect(TokenType.Colon)
      const value = this.parseExpression()
      entries.push({
        kind: 'ObjectEntry',
        key,
        isQuoted,
        value,
        range: { start: entryStart, end: this.currentPos() }
      })

      // Optional comma
      this.match(TokenType.Comma)
      this.skipComments()
    }
    return entries
  }

  // ────────────────────────────────────────────────────────────────────
  //  Helpers
  // ────────────────────────────────────────────────────────────────────

  private current(): Token {
    return (
      this.tokens[this.pos] ?? {
        type: TokenType.EOF,
        value: '',
        offset: this.source.length,
        line: 0,
        column: 0
      }
    )
  }

  private currentPos(): Position {
    const tok = this.current()
    return { line: tok.line, column: tok.column }
  }

  private isAtEnd(): boolean {
    return (
      this.pos >= this.tokens.length || this.current().type === TokenType.EOF
    )
  }

  private check(type: TokenType): boolean {
    return this.current().type === type
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance()
      return true
    }
    return false
  }

  private advance(): Token {
    const tok = this.current()
    if (!this.isAtEnd()) this.pos++
    this.skipComments()
    return tok
  }

  private expect(type: TokenType): Token {
    const tok = this.current()
    if (tok.type !== type) {
      this.error(`Expected '${type}' but got '${tok.value}'`, tok)
      return tok
    }
    return this.advance()
  }

  private expectVariable(): string {
    const tok = this.current()
    if (tok.type !== TokenType.Variable) {
      this.error(`Expected variable (e.g., ?name) but got '${tok.value}'`, tok)
      return '?unknown'
    }
    this.advance()
    return tok.value
  }

  private expectString(): string {
    const tok = this.current()
    if (tok.type !== TokenType.String) {
      this.error(`Expected string literal but got '${tok.value}'`, tok)
      return ''
    }
    this.advance()
    return this.unescapeString(tok.value)
  }

  private expectStringValue(): string {
    const tok = this.current()
    if (tok.type !== TokenType.String) {
      this.error(`Expected quoted string but got '${tok.value}'`, tok)
      return ''
    }
    this.advance()
    return this.unescapeString(tok.value)
  }

  private expectKey(): string {
    const tok = this.current()
    // Keys can be identifiers, strings, or even some keywords used as keys
    if (tok.type === TokenType.String) {
      this.advance()
      return this.unescapeString(tok.value)
    }
    if (
      tok.type === TokenType.Identifier ||
      this.isNonAmbiguousKeyword(tok.type)
    ) {
      this.advance()
      return tok.value
    }
    this.error(`Expected object key but got '${tok.value}'`, tok)
    this.advance()
    return tok.value
  }

  private expectKeyWithQuoting(): { key: string; isQuoted: boolean } {
    const tok = this.current()
    if (tok.type === TokenType.String) {
      this.advance()
      return { key: this.unescapeString(tok.value), isQuoted: true }
    }
    if (
      tok.type === TokenType.Identifier ||
      this.isNonAmbiguousKeyword(tok.type)
    ) {
      this.advance()
      return { key: tok.value, isQuoted: false }
    }
    this.error(`Expected object key but got '${tok.value}'`, tok)
    this.advance()
    return { key: tok.value, isQuoted: false }
  }

  private skipComments(): void {
    while (
      this.pos < this.tokens.length &&
      this.current().type === TokenType.Comment
    ) {
      this.pos++
    }
  }

  private collectLeadingComments(): string[] {
    const comments: string[] = []
    // Look backwards from current position to collect contiguous comment tokens
    let i = this.pos - 1
    while (i >= 0 && this.tokens[i]!.type === TokenType.Comment) {
      comments.unshift(this.tokens[i]!.value)
      i--
    }
    return comments
  }

  private isFunctionToken(type: TokenType): boolean {
    return (
      type === TokenType.Count ||
      type === TokenType.Sum ||
      type === TokenType.Avg ||
      type === TokenType.Min ||
      type === TokenType.Max ||
      type === TokenType.Contains ||
      type === TokenType.StartsWith ||
      type === TokenType.EndsWith ||
      type === TokenType.Regex ||
      type === TokenType.In ||
      type === TokenType.IsNull ||
      type === TokenType.IsNotNull
    )
  }

  /** Keywords that can also serve as property names in dot notation or object keys */
  private isNonAmbiguousKeyword(type: TokenType): boolean {
    return (
      type === TokenType.Type ||
      type === TokenType.Types ||
      type === TokenType.Attributes ||
      type === TokenType.Metadata ||
      type === TokenType.Propositions ||
      type === TokenType.Identifier ||
      // Allow most keywords as property names since KIP uses snake_case for attrs
      type === TokenType.Asc ||
      type === TokenType.Desc ||
      type === TokenType.Primer ||
      type === TokenType.Domains ||
      type === TokenType.From ||
      type === TokenType.By ||
      type === TokenType.Order ||
      type === TokenType.Set ||
      type === TokenType.With
    )
  }

  private unescapeString(raw: string): string {
    // Strip quotes
    if (raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1)
    }
    return raw.replace(/\\(.)/g, (_, ch) => {
      switch (ch) {
        case 'n':
          return '\n'
        case 't':
          return '\t'
        case 'r':
          return '\r'
        case '\\':
          return '\\'
        case '"':
          return '"'
        case '/':
          return '/'
        default:
          return ch
      }
    })
  }

  private error(message: string, token: Token): void {
    this.diagnostics.push({
      range: {
        start: { line: token.line, column: token.column },
        end: { line: token.line, column: token.column + token.value.length }
      },
      severity: 'error',
      message,
      code: 'KIP_PARSE'
    })
  }

  private recoverToNextStatement(): void {
    const stmtStarters = new Set([
      TokenType.Find,
      TokenType.Upsert,
      TokenType.Delete,
      TokenType.Describe,
      TokenType.Search,
      TokenType.EOF
    ])
    while (!this.isAtEnd() && !stmtStarters.has(this.current().type)) {
      this.pos++
    }
  }
}
