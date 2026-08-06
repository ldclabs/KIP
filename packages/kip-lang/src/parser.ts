import { tokenize } from './lexer.js'
import { Token, TokenType, isTrivia } from './token.js'
import type { Range, Position } from './token.js'
import type {
  Program,
  Statement,
  FindStatement,
  UpsertStatement,
  UpdateStatement,
  MergeStatement,
  DeleteStatement,
  DescribeStatement,
  SearchStatement,
  ExportStatement,
  WhereClause,
  WherePattern,
  ConceptPattern,
  ConceptMatcher,
  PropositionPattern,
  PropositionEndpoint,
  PredicateExpr,
  PredicateLiteral,
  PredicateVariable,
  HopRange,
  FilterClause,
  NotClause,
  OptionalClause,
  UnionClause,
  ConceptBlock,
  PropositionBlock,
  ExpectVersion,
  SetAttributes,
  SetMetadata,
  SetPropositions,
  PropositionItem,
  WithMetadata,
  OrderByClause,
  OrderByKey,
  LimitClause,
  CursorClause,
  ThresholdClause,
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
      const before = this.pos
      this.skipComments()
      if (this.isAtEnd()) break
      try {
        const stmt = this.parseStatement()
        if (stmt) statements.push(stmt)
      } catch {
        // Error recovery: skip to next statement-level keyword
        this.recoverToNextStatement()
      }
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
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
      case TokenType.Update:
        return this.parseUpdateStatement()
      case TokenType.Merge:
        return this.parseMergeStatement()
      case TokenType.Delete:
        return this.parseDeleteStatement()
      case TokenType.Describe:
        return this.parseDescribeStatement()
      case TokenType.Search:
        return this.parseSearchStatement()
      case TokenType.Export:
        return this.parseExportStatement()
      default:
        this.error(
          `Unexpected token '${tok.value}', expected a statement keyword (FIND, UPSERT, UPDATE, MERGE, DELETE, DESCRIBE, SEARCH, EXPORT)`,
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
    const lparen = this.current()
    this.expect(TokenType.LParen)

    const projections: Expression[] = []
    if (!this.check(TokenType.RParen)) {
      projections.push(this.parseExpression())
      while (this.match(TokenType.Comma)) {
        projections.push(this.parseExpression())
      }
    }
    if (projections.length === 0) {
      this.error(
        `FIND must declare at least one output expression, e.g. FIND(?var)`,
        lparen
      )
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
    this.expectKeywordWithSpace(TokenType.Upsert)
    this.expect(TokenType.LBrace)

    const blocks: UpsertBlock[] = []
    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
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
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
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
    this.expectKeywordWithSpace(TokenType.Concept)

    // The handle is optional: a block nothing else refers to needs no name.
    let handle: string | undefined
    if (this.check(TokenType.Variable)) {
      handle = this.expectVariable()
    }
    this.expect(TokenType.LBrace)

    const matcher = this.parseConceptMatcher()
    let expectVersion: ExpectVersion | undefined
    if (this.check(TokenType.Expect)) {
      expectVersion = this.parseExpectVersion()
    }

    let setAttributes: SetAttributes | undefined
    let setPropositions: SetPropositions | undefined
    let metadata: WithMetadata | undefined

    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.Set)) {
        const setStart = this.currentPos()
        const setTok = this.advance() // skip SET
        if (this.check(TokenType.Attributes)) {
          this.expectSecondWord(TokenType.Attributes, setTok)
          setAttributes = this.parseSetAttributesBody(setStart)
        } else if (this.check(TokenType.Propositions)) {
          this.expectSecondWord(TokenType.Propositions, setTok)
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
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
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
      expectVersion,
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
    this.expectKeywordWithSpace(TokenType.Proposition)

    let handle: string | undefined
    if (this.check(TokenType.Variable)) {
      handle = this.expectVariable()
    }

    this.expect(TokenType.LBrace)
    const proposition = this.parsePropositionPatternBody(undefined)
    let expectVersion: ExpectVersion | undefined
    if (this.check(TokenType.Expect)) {
      expectVersion = this.parseExpectVersion()
    }

    let setAttributes: SetAttributes | undefined
    let metadata: WithMetadata | undefined

    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.Set)) {
        const setStart = this.currentPos()
        const setTok = this.advance()
        if (this.check(TokenType.Attributes)) {
          this.expectSecondWord(TokenType.Attributes, setTok)
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
        this.error(
          `Unexpected token '${this.current().value}' in PROPOSITION block`,
          this.current()
        )
        this.advance()
      }
      this.skipComments()
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
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
      expectVersion,
      setAttributes,
      metadata,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  UPDATE
  // ────────────────────────────────────────────────────────────────────

  private parseUpdateStatement(): UpdateStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expectKeywordWithSpace(TokenType.Update)

    const target = this.expectVariable()
    let setAttributes: SetAttributes | undefined
    let setMetadata: SetMetadata | undefined

    this.skipComments()
    while (this.check(TokenType.Set) && !this.isAtEnd()) {
      const before = this.pos
      const setStart = this.currentPos()
      const setTok = this.advance()
      if (this.check(TokenType.Attributes)) {
        this.expectSecondWord(TokenType.Attributes, setTok)
        setAttributes = this.parseSetAttributesBody(setStart)
      } else if (this.check(TokenType.Metadata)) {
        this.expectSecondWord(TokenType.Metadata, setTok)
        setMetadata = this.parseSetMetadataBody(setStart)
      } else {
        this.error(
          `Expected ATTRIBUTES or METADATA after SET in UPDATE statement`,
          this.current()
        )
        this.advance()
      }
      this.skipComments()
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
    }

    if (!setAttributes && !setMetadata) {
      this.error(
        `Expected SET ATTRIBUTES or SET METADATA in UPDATE statement`,
        this.current()
      )
    }

    const where = this.parseWhereClause()

    let limit: LimitClause | undefined
    if (this.check(TokenType.Limit)) {
      limit = this.parseLimitClause()
    }

    return {
      kind: 'UpdateStatement',
      target,
      setAttributes,
      setMetadata,
      where,
      limit,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  MERGE
  // ────────────────────────────────────────────────────────────────────

  private parseMergeStatement(): MergeStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    const mergeTok = this.expect(TokenType.Merge)
    this.expectSecondWord(TokenType.Concept, mergeTok)
    const source = this.expectVariable()
    this.expect(TokenType.Into)
    const target = this.expectVariable()
    const where = this.parseWhereClause()

    return {
      kind: 'MergeStatement',
      source,
      target,
      where,
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
    this.expectKeywordWithSpace(TokenType.Delete)

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
    this.expectKeywordWithSpace(TokenType.Describe)

    let describeType: DescribeStatement['describeType']
    let typeName: string | undefined
    let typeNameValue: StringLiteral | ParameterRef | undefined
    let limit: LimitClause | undefined
    let cursor: CursorClause | undefined

    if (this.check(TokenType.Primer)) {
      describeType = 'PRIMER'
      this.advance()
    } else if (this.check(TokenType.Domains)) {
      describeType = 'DOMAINS'
      this.advance()
    } else if (this.check(TokenType.Concept)) {
      const headTok = this.advance()
      if (this.check(TokenType.Types)) {
        describeType = 'CONCEPT_TYPES'
        this.expectSecondWord(TokenType.Types, headTok)
      } else if (this.check(TokenType.Type)) {
        describeType = 'CONCEPT_TYPE'
        this.expectSecondWord(TokenType.Type, headTok)
        typeNameValue = this.parseStringOrParameterValue(
          'DESCRIBE CONCEPT TYPE'
        )
        typeName =
          typeNameValue.kind === 'StringLiteral'
            ? typeNameValue.parsed
            : typeNameValue.name
      } else {
        this.error(
          `Expected TYPE or TYPES after DESCRIBE CONCEPT`,
          this.current()
        )
        describeType = 'CONCEPT_TYPES'
      }
    } else if (this.check(TokenType.Proposition)) {
      const headTok = this.advance()
      if (this.check(TokenType.Types)) {
        describeType = 'PROPOSITION_TYPES'
        this.expectSecondWord(TokenType.Types, headTok)
      } else if (this.check(TokenType.Type)) {
        describeType = 'PROPOSITION_TYPE'
        this.expectSecondWord(TokenType.Type, headTok)
        typeNameValue = this.parseStringOrParameterValue(
          'DESCRIBE PROPOSITION TYPE'
        )
        typeName =
          typeNameValue.kind === 'StringLiteral'
            ? typeNameValue.parsed
            : typeNameValue.name
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

    // Only the plural `... TYPES` forms are paginated (§5.1.3 / §5.1.5).
    const paginable =
      describeType === 'CONCEPT_TYPES' || describeType === 'PROPOSITION_TYPES'
    if (this.check(TokenType.Limit)) {
      if (!paginable) {
        this.error(
          `LIMIT is only valid on DESCRIBE CONCEPT TYPES / PROPOSITION TYPES`,
          this.current()
        )
      }
      limit = this.parseLimitClause()
    }
    if (this.check(TokenType.Cursor)) {
      if (!paginable) {
        this.error(
          `CURSOR is only valid on DESCRIBE CONCEPT TYPES / PROPOSITION TYPES`,
          this.current()
        )
      }
      cursor = this.parseCursorClause()
    }

    return {
      kind: 'DescribeStatement',
      describeType,
      typeName,
      typeNameValue,
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
    this.expectKeywordWithSpace(TokenType.Search)

    let searchTarget: 'CONCEPT' | 'PROPOSITION'
    if (this.check(TokenType.Concept)) {
      searchTarget = 'CONCEPT'
      this.expectKeywordWithSpace(TokenType.Concept)
    } else if (this.check(TokenType.Proposition)) {
      searchTarget = 'PROPOSITION'
      this.expectKeywordWithSpace(TokenType.Proposition)
    } else {
      this.error(`Expected CONCEPT or PROPOSITION after SEARCH`, this.current())
      searchTarget = 'CONCEPT'
    }

    const termValue = this.parseStringOrParameterValue('SEARCH term')
    const term =
      termValue.kind === 'StringLiteral' ? termValue.parsed : termValue.name

    let withType: string | undefined
    let withTypeValue: StringLiteral | ParameterRef | undefined
    let mode: string | undefined
    let modeValue: StringLiteral | ParameterRef | undefined
    let threshold: ThresholdClause | undefined
    let limit: LimitClause | undefined

    // Clauses may appear in any order but each at most once — a second
    // `LIMIT` is trailing input, not an override.
    while (!this.isAtEnd()) {
      const before = this.pos
      const clause = this.current()
      if (this.check(TokenType.With)) {
        this.rejectRepeat(withTypeValue, 'WITH TYPE', clause)
        const withTok = this.advance()
        this.expectSecondWord(TokenType.Type, withTok)
        withTypeValue = this.parseStringOrParameterValue('SEARCH WITH TYPE')
        withType =
          withTypeValue.kind === 'StringLiteral'
            ? withTypeValue.parsed
            : withTypeValue.name
      } else if (this.check(TokenType.Mode)) {
        this.rejectRepeat(modeValue, 'MODE', clause)
        this.advance()
        modeValue = this.parseStringOrParameterValue('SEARCH MODE')
        mode =
          modeValue.kind === 'StringLiteral' ? modeValue.parsed : modeValue.name
      } else if (this.check(TokenType.Threshold)) {
        this.rejectRepeat(threshold, 'THRESHOLD', clause)
        threshold = this.parseThresholdClause()
      } else if (this.check(TokenType.Limit)) {
        this.rejectRepeat(limit, 'LIMIT', clause)
        limit = this.parseLimitClause()
      } else {
        break
      }
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
    }

    return {
      kind: 'SearchStatement',
      searchTarget,
      term,
      termValue,
      withType,
      withTypeValue,
      mode,
      modeValue,
      threshold,
      limit,
      range: { start, end: this.currentPos() },
      leadingComments: comments.length > 0 ? comments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  EXPORT
  // ────────────────────────────────────────────────────────────────────

  private parseExportStatement(): ExportStatement {
    const start = this.currentPos()
    const comments = this.collectLeadingComments()
    this.expectKeywordWithSpace(TokenType.Export)
    const target = this.expectVariable()
    const where = this.parseWhereClause()

    let limit: LimitClause | undefined
    let cursor: CursorClause | undefined
    if (this.check(TokenType.Limit)) {
      limit = this.parseLimitClause()
    }
    if (this.check(TokenType.Cursor)) {
      cursor = this.parseCursorClause()
    }

    return {
      kind: 'ExportStatement',
      target,
      where,
      limit,
      cursor,
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
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace)) break

      const pattern = this.parseWherePattern()
      if (pattern) patterns.push(pattern)
      this.skipComments()
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
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
    const brace = this.expect(TokenType.LBrace)
    const seen = { trailingComma: false }
    const entries = this.parseObjectEntries(seen)
    if (seen.trailingComma) {
      this.error(`A concept matcher takes no trailing comma`, brace)
    }
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
    // Could be: ?var, ?var {...}, ?var (...), {...}, or nested (...)
    if (this.check(TokenType.Variable)) {
      const start = this.currentPos()
      const name = this.expectVariable()
      if (this.check(TokenType.LBrace)) {
        return this.parseConceptPatternBody(name, start)
      }
      if (this.check(TokenType.LParen)) {
        return this.parsePropositionPatternBody(name, start)
      }
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
    if (this.check(TokenType.Variable)) {
      const pred = this.parsePredicateVariable()
      if (this.check(TokenType.LBrace)) {
        this.error(
          `Predicate variables cannot use hop ranges; use a quoted predicate literal for path traversal`,
          this.current()
        )
        this.parseHopRange()
      }
      if (this.check(TokenType.Pipe)) {
        this.error(
          `Predicate variables cannot be used in predicate alternations`,
          this.current()
        )
        while (this.match(TokenType.Pipe)) {
          if (this.check(TokenType.String)) {
            this.parsePredicateLiteral()
          } else if (this.check(TokenType.Variable)) {
            this.parsePredicateVariable()
          } else {
            break
          }
        }
      }
      return {
        ...pred,
        range: { start, end: this.currentPos() }
      }
    }

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

  private parsePredicateVariable(): PredicateVariable {
    const start = this.currentPos()
    const name = this.expectVariable()
    return {
      kind: 'PredicateVariable',
      name,
      range: { start, end: this.currentPos() }
    }
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

    const min = this.expectHopCount()

    let max: number | undefined
    if (this.match(TokenType.Comma)) {
      if (this.check(TokenType.Number)) {
        max = this.expectHopCount()
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

  /**
   * Reads one bound of a `{m,n}` hop quantifier.
   *
   * A hop count is a plain 16-bit integer — no sign, no decimal point, no
   * exponent. `"p"{1e9,}` is not an enormous traversal, it is a typo, and
   * accepting it would hand the engine a bound it cannot honour.
   */
  private expectHopCount(): number {
    const tok = this.current()
    if (tok.type !== TokenType.Number || !/^[0-9]+$/.test(tok.value)) {
      this.error(`Expected a whole number in a hop range`, tok)
      this.advance()
      return 0
    }
    const value = Number(tok.value)
    if (value > 0xffff) {
      this.error(`Hop count ${tok.value} exceeds the maximum of 65535`, tok)
    }
    this.advance()
    return value
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

  private parseSetMetadataBody(start: Position): SetMetadata {
    this.expect(TokenType.LBrace)
    const entries = this.parseObjectEntries()
    this.expect(TokenType.RBrace)
    return {
      kind: 'SetMetadata',
      entries,
      range: { start, end: this.currentPos() }
    }
  }

  private parseSetPropositionsBody(start: Position): SetPropositions {
    this.expect(TokenType.LBrace)
    const items: PropositionItem[] = []
    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace)) break
      items.push(this.parsePropositionItem())
      this.skipComments()
      // Items are juxtaposed, but a separating comma — including a trailing
      // one — is tolerated. Generated KML reaches for it constantly, and the
      // reference grammar accepts it.
      this.match(TokenType.Comma)
      this.skipComments()
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
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
    if (!this.isIdKeyToken(this.current())) return false
    const next = this.peekPast(this.pos + 1)
    // `(id: "...")` may be written with a comment between the key and the
    // colon; comments are trivia everywhere else, so they are here too.
    return (
      next?.type === TokenType.Colon ||
      (next?.type === TokenType.Parameter && next.value.startsWith(':'))
    )
  }

  /** The first non-comment token at or after `i`. */
  private peekPast(i: number): Token | undefined {
    while (this.tokens[i]?.type === TokenType.Comment) i++
    return this.tokens[i]
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
        parsed: this.unescapeString(tok.value, tok),
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
    const withTok = this.expect(TokenType.With)
    this.expectSecondWord(TokenType.Metadata, withTok)
    this.expect(TokenType.LBrace)
    const entries = this.parseObjectEntries()
    this.expect(TokenType.RBrace)
    return {
      kind: 'WithMetadata',
      entries,
      range: { start, end: this.currentPos() }
    }
  }

  private parseExpectVersion(): ExpectVersion {
    const start = this.currentPos()
    const expectTok = this.expect(TokenType.Expect)
    this.expectSecondWord(TokenType.Version, expectTok)
    const value = this.parseNumberOrParameterValue('EXPECT VERSION')
    return {
      kind: 'ExpectVersion',
      value,
      range: { start, end: this.currentPos() }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  ORDER BY, LIMIT, CURSOR
  // ────────────────────────────────────────────────────────────────────

  private parseOrderBy(): OrderByClause {
    const start = this.currentPos()
    const orderTok = this.expect(TokenType.Order)
    this.expectSecondWord(TokenType.By, orderTok)
    const keys: OrderByKey[] = []

    keys.push(this.parseOrderByKey())
    while (this.match(TokenType.Comma)) {
      keys.push(this.parseOrderByKey())
    }

    const first = keys[0]!
    return {
      kind: 'OrderByClause',
      keys,
      expression: first.expression,
      direction: first.direction,
      range: { start, end: this.currentPos() }
    }
  }

  private parseOrderByKey(): OrderByKey {
    const start = this.currentPos()
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
      kind: 'OrderByKey',
      expression,
      direction,
      range: { start, end: this.currentPos() }
    }
  }

  private parseThresholdClause(): ThresholdClause {
    const start = this.currentPos()
    this.expectKeywordWithSpace(TokenType.Threshold)
    const value = this.parseNumberOrParameterValue('THRESHOLD')
    return {
      kind: 'ThresholdClause',
      value,
      range: { start, end: this.currentPos() }
    }
  }

  private parseNumberOrParameterValue(
    context: string
  ): NumberLiteral | ParameterRef {
    const tok = this.current()
    const start = this.currentPos()
    let value: NumberLiteral | ParameterRef

    if (tok.type === TokenType.Number) {
      value = {
        kind: 'NumberLiteral',
        value: Number(tok.value),
        raw: tok.value,
        range: { start, end: start }
      }
      this.advance()
      value.range.end = this.currentPos()
      return value
    }

    if (tok.type === TokenType.Parameter) {
      value = {
        kind: 'ParameterRef',
        name: tok.value,
        range: { start, end: start }
      }
      this.advance()
      value.range.end = this.currentPos()
      return value
    }

    this.error(`Expected number or parameter after ${context}`, tok)
    return {
      kind: 'NumberLiteral',
      value: 0,
      raw: '0',
      range: { start, end: start }
    }
  }

  private parseLimitClause(): LimitClause {
    const start = this.currentPos()
    this.expectKeywordWithSpace(TokenType.Limit)
    const value = this.parseNumberOrParameterValue('LIMIT')
    return {
      kind: 'LimitClause',
      value,
      range: { start, end: this.currentPos() }
    }
  }

  private parseCursorClause(): CursorClause {
    const start = this.currentPos()
    this.expectKeywordWithSpace(TokenType.Cursor)
    const tok = this.current()
    let value: StringLiteral | ParameterRef
    if (tok.type === TokenType.String) {
      value = {
        kind: 'StringLiteral',
        value: tok.value,
        parsed: this.unescapeString(tok.value, tok),
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
      // Dot access chain. A dot path is written with no whitespace anywhere
      // inside it: `?x.name` is a path, but `?x. name` is a path followed by
      // stray input, and reading them alike would let `ORDER BY ?x.name. ASC`
      // silently sort by a field named `ASC` with no direction.
      let prevEnd = tok.offset + tok.value.length
      while (this.check(TokenType.Dot)) {
        const dotTok = this.current()
        if (dotTok.offset !== prevEnd) {
          this.error(`Unexpected whitespace before '.' in a dot path`, dotTok)
          break
        }
        this.advance()
        const propTok = this.current()
        if (propTok.offset !== dotTok.offset + 1) {
          this.error(`Expected property name after '.'`, propTok)
          break
        }
        if (
          propTok.type === TokenType.Identifier ||
          this.isNonAmbiguousKeyword(propTok.type)
        ) {
          const prop = propTok.value
          prevEnd = propTok.offset + propTok.value.length
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
        parsed: this.unescapeString(tok.value, tok),
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
      this.error(
        `Unquoted value '${tok.value}': KIP values are JSON values, so write "${tok.value}"`,
        tok
      )
      this.advance()
      return {
        kind: 'StringLiteral',
        value: `"${tok.value}"`,
        parsed: tok.value,
        range: { start, end: this.currentPos() }
      }
    }

    // A bare word is not a KIP value — only object *keys* may go unquoted, and
    // those never reach here. Recover as a string so the tree stays usable in
    // an editor, and report it: `lower` sees only the tree, so it is the
    // caller's error-diagnostic check that keeps this reading off the wire.
    if (tok.type === TokenType.Identifier) {
      this.error(
        `Unquoted value '${tok.value}': KIP values are JSON values, so write "${tok.value}"`,
        tok
      )
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
    let trailingComma = false
    this.skipComments()
    if (!this.check(TokenType.RBracket)) {
      elements.push(this.parseExpression())
      while (this.match(TokenType.Comma)) {
        this.skipComments()
        if (this.check(TokenType.RBracket)) {
          trailingComma = true
          break
        }
        elements.push(this.parseExpression())
      }
    }
    this.skipComments()
    this.expect(TokenType.RBracket)
    return {
      kind: 'ArrayLiteral',
      elements,
      trailingComma,
      range: { start, end: this.currentPos() }
    }
  }

  private parseObjectLiteral(): ObjectLiteral {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const seen = { trailingComma: false }
    const entries = this.parseObjectEntries(seen)
    this.expect(TokenType.RBrace)
    return {
      kind: 'ObjectLiteral',
      entries,
      trailingComma: seen.trailingComma,
      range: { start, end: this.currentPos() }
    }
  }

  private parseObjectEntries(seen?: { trailingComma: boolean }): ObjectEntry[] {
    const entries: ObjectEntry[] = []
    this.skipComments()
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace)) break

      const entryStart = this.currentPos()
      const { key, isQuoted } = this.expectKeyWithQuoting()
      this.expectObjectColon(key)
      const value = this.parseExpression()
      entries.push({
        kind: 'ObjectEntry',
        key,
        isQuoted,
        value,
        range: { start: entryStart, end: this.currentPos() }
      })

      this.skipComments()
      if (this.check(TokenType.RBrace)) break
      if (this.match(TokenType.Comma)) {
        this.skipComments()
        if (seen && this.check(TokenType.RBrace)) seen.trailingComma = true
        continue
      }
      this.error(`Expected ',' or '}' after object entry`, this.current())
      // A sub-parser that rejects its first token reports and returns
      // without consuming it, so a loop keyed on that token would spin
      // forever building diagnostics. Stop as soon as nothing moved.
      if (this.pos === before) break
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

  /**
   * Consumes a keyword that the grammar requires to be followed by whitespace.
   *
   * Most KIP keywords only need a word boundary, so `WHERE{...}` is legal.
   * A handful — the statement introducers and the clause keywords whose
   * operand may itself start with a brace or a quote — require real
   * whitespace, which is what keeps `UPSERT{` from reading as a statement.
   * The distinction is per-keyword-position, not per-keyword, so it lives at
   * the call site rather than in the lexer.
   */
  private expectKeywordWithSpace(type: TokenType): Token {
    const tok = this.current()
    if (tok.type !== type) {
      this.error(`Expected '${type}' but got '${tok.value}'`, tok)
      return tok
    }
    const after = this.source[tok.offset + tok.value.length] ?? ''
    if (after !== ' ' && after !== '\t' && after !== '\r' && after !== '\n') {
      this.error(
        `'${tok.value}' must be followed by whitespace`,
        tok,
        'KIP_1001'
      )
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
    return this.unescapeString(tok.value, tok)
  }

  private expectStringValue(): string {
    const tok = this.current()
    if (tok.type !== TokenType.String) {
      this.error(`Expected quoted string but got '${tok.value}'`, tok)
      return ''
    }
    this.advance()
    return this.unescapeString(tok.value, tok)
  }

  private expectKeyWithQuoting(): { key: string; isQuoted: boolean } {
    const tok = this.current()
    if (tok.type === TokenType.String) {
      this.advance()
      return { key: this.unescapeString(tok.value, tok), isQuoted: true }
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

  /** Reports a clause written twice in a statement that allows it once. */
  private rejectRepeat(seen: unknown, name: string, tok: Token): void {
    if (seen !== undefined) {
      this.error(`Duplicate ${name} clause`, tok)
    }
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

  /**
   * Consume the `:` separating an object key from its value. A colon written
   * with no space before an identifier value (e.g. `status:active`) is lexed as
   * a single parameter placeholder token (`:active`), so surface a targeted hint
   * instead of the generic "Expected ':'" message.
   */
  /**
   * Consumes the second word of a two-word keyword (`SET ATTRIBUTES`,
   * `ORDER BY`, `EXPECT VERSION`, ...).
   *
   * The grammar joins these with whitespace only. A comment between the words
   * is not a smaller gap, it is a different token sequence, and reading
   * `SET//c\nMETADATA` as `SET METADATA` would accept text the reference
   * grammar rejects.
   */
  private expectSecondWord(type: TokenType, first: Token): Token {
    const tok = this.current()
    const gap = this.source.slice(first.offset + first.value.length, tok.offset)
    if (tok.type === type && !/^\s+$/.test(gap)) {
      this.error(
        `'${first.value} ${tok.value}' must be separated by whitespace only`,
        tok
      )
    }
    return this.expect(type)
  }

  private expectObjectColon(_key: string): void {
    if (this.check(TokenType.Colon)) {
      this.advance()
      return
    }
    // `{"a":true}` lexes as a key followed by the parameter `:true`, because
    // `:name` is the placeholder syntax and the lexer cannot see that this
    // colon separates a key from its value. In key position the separator
    // reading is the only valid one, so split the token back apart and re-lex
    // the tail as the value.
    const tok = this.current()
    if (tok.type === TokenType.Parameter) {
      this.splitParameterAfterColon(tok)
      return
    }
    this.expect(TokenType.Colon)
  }

  /**
   * Rewrites a `:value` parameter token in separator position into the value
   * tokens it spells, so the parser sees `: value`.
   */
  private splitParameterAfterColon(tok: Token): void {
    const tail = tok.value.slice(1)
    const retoken = tokenize(tail)
      .filter((t) => !isTrivia(t.type) && t.type !== TokenType.EOF)
      .map((t) => ({
        ...t,
        offset: tok.offset + 1 + t.offset,
        line: tok.line,
        column: tok.column + 1 + t.column
      }))
    this.tokens.splice(this.pos, 1, ...retoken)
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
      type === TokenType.IsNotNull ||
      type === TokenType.Add ||
      type === TokenType.Mul ||
      type === TokenType.Clamp ||
      type === TokenType.Coalesce
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
      type === TokenType.With ||
      type === TokenType.Into ||
      type === TokenType.Expect ||
      type === TokenType.Version ||
      type === TokenType.Mode ||
      type === TokenType.Threshold
    )
  }

  /**
   * Reads the value of a string token.
   *
   * KIP strings are JSON strings, so `"a\xb"` and an unterminated literal are
   * both errors — but an editor still wants a tree, so the malformed value is
   * recovered leniently *and* reported. The lenient reading survives into the
   * tree: `lower` is handed a `Program` and never sees a diagnostic, so a
   * caller must reject on `severity === 'error'` before lowering, or `"a\xb"`
   * reaches the engine as `axb`.
   */
  private unescapeString(raw: string, tok?: Token): string {
    if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
      try {
        return JSON.parse(raw) as string
      } catch {
        if (tok) {
          this.error(
            `Invalid string literal ${raw}: KIP strings are JSON strings`,
            tok
          )
        }
        raw = raw.slice(1, -1)
      }
    } else if (tok) {
      this.error(`Unterminated string literal ${raw}`, tok)
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

  private error(message: string, token: Token, code = 'KIP_1001'): void {
    this.diagnostics.push({
      range: {
        start: { line: token.line, column: token.column },
        end: { line: token.line, column: token.column + token.value.length }
      },
      severity: 'error',
      message,
      code
    })
  }

  private recoverToNextStatement(): void {
    const stmtStarters = new Set([
      TokenType.Find,
      TokenType.Upsert,
      TokenType.Update,
      TokenType.Merge,
      TokenType.Delete,
      TokenType.Describe,
      TokenType.Search,
      TokenType.Export,
      TokenType.EOF
    ])
    while (!this.isAtEnd() && !stmtStarters.has(this.current().type)) {
      this.pos++
    }
  }
}
