import { tokenize } from './lexer.js'
import {
  Token,
  TokenType,
  isTrivia,
  isIdentifierLike,
  isAggregate
} from './token.js'
import type { Range, Position } from './token.js'
import type {
  Program,
  Statement,
  MutationClause,
  FindStatement,
  AsOfClause,
  ForTimeClause,
  EpistemicClause,
  OrderByClause,
  OrderItem,
  LimitClause,
  CursorClause,
  WhereClause,
  WherePattern,
  ConceptPattern,
  PropositionPattern,
  AssertionPattern,
  EvidencePattern,
  ActivityPattern,
  StructuralPattern,
  BeliefPattern,
  BeliefSlotPattern,
  FilterClause,
  NotClause,
  OptionalClause,
  UnionClause,
  PropositionTuple,
  Term,
  PredicateAtom,
  RawPredicateExpression,
  PredicatePathAtom,
  PathQuantifier,
  ObjectPattern,
  MutateStatement,
  CreateConceptStatement,
  UpsertConceptStatement,
  EnsurePropositionStatement,
  AssertStatement,
  CreateEvidenceStatement,
  CreateAssertionStatement,
  CreateActivityStatement,
  TypeClause,
  ClientKeyClause,
  NameClause,
  MatchClause,
  SetFieldsClause,
  SetAttributesClause,
  SetFacetClause,
  UnsetAttributesClause,
  UnsetFacetClause,
  UnsetField,
  SetStructuralClause,
  StructuralAssignment,
  ExpectVersionClause,
  ExpectStateClause,
  UpdateStatement,
  UpdateAction,
  RetractAssertionStatement,
  SupersedeAssertionStatement,
  CorrectEvidenceStatement,
  TransitionActivityStatement,
  SetRetentionStatement,
  ArchiveStatement,
  TombstoneStatement,
  PurgeStatement,
  MergeConceptStatement,
  DescribeStatement,
  DescribeTargetKind,
  ListStatement,
  ListTargetKind,
  SearchStatement,
  SearchKind,
  VerifyStatement,
  VerifyTargetKind,
  ValidateStatement,
  ValidateTargetKind,
  PreviewStatement,
  HistoryStatement,
  ChangesStatement,
  SnapshotStatement,
  ExportCapsuleStatement,
  Expression,
  FunctionCallExpr,
  AggregateExpr,
  FieldAccess,
  FieldStep,
  VariableRef,
  ParameterRef,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
  ScalarValue,
  SchemaSymbol,
  TargetRef,
  ArrayLiteral,
  ObjectLiteral,
  ObjectEntry
} from './ast.js'
import type { Diagnostic } from './diagnostics.js'

export interface ParseResult {
  ast: Program
  diagnostics: Diagnostic[]
}

/**
 * Which grammar owns the WHERE block being parsed.
 *
 * KQL owns the two reviewed divergences: `proposition_tuple` accepts raw
 * predicate path expressions, and `where_clause` additionally accepts
 * BELIEF / BELIEF SLOT. KML and META EXPORT get neither — a virtual
 * Projection can never be a mutation target or an export selector.
 */
type Dialect = 'kql' | 'raw'

/** The four baseline scalar types; arrays and objects are not Core Literals. */
type LiteralNode =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral

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
  private dialect: Dialect = 'kql'

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
      // KQL
      case TokenType.Find:
        return this.parseFindStatement()

      // KML
      case TokenType.Mutate:
        return this.parseMutateStatement()
      case TokenType.Create:
      case TokenType.Upsert:
      case TokenType.Ensure:
      case TokenType.Assert:
      case TokenType.Update:
      case TokenType.Retract:
      case TokenType.Supersede:
      case TokenType.Correct:
      case TokenType.Transition:
      case TokenType.Set:
      case TokenType.Archive:
      case TokenType.Tombstone:
      case TokenType.Purge:
      case TokenType.Merge:
        return this.parseMutationClause()

      // META
      case TokenType.Describe:
        return this.parseDescribeStatement()
      case TokenType.List:
        return this.parseListStatement()
      case TokenType.Search:
        return this.parseSearchStatement()
      case TokenType.Verify:
        return this.parseVerifyStatement()
      case TokenType.Validate:
        return this.parseValidateStatement()
      case TokenType.Preview:
        return this.parsePreviewStatement()
      case TokenType.History:
        return this.parseHistoryStatement()
      case TokenType.Changes:
        return this.parseChangesStatement()
      case TokenType.Snapshot:
        return this.parseSnapshotStatement()
      case TokenType.Export:
        return this.parseExportCapsuleStatement()

      default:
        this.error(
          `Unexpected token '${tok.value}': expected a KQL, KML or META statement`,
          tok
        )
        return null
    }
  }

  /** Every mutation legal at statement level and inside `MUTATE { ... }`. */
  private parseMutationClause(): MutationClause {
    const tok = this.current()
    switch (tok.type) {
      case TokenType.Create:
        return this.parseCreateStatement()
      case TokenType.Upsert:
        return this.parseUpsertConcept()
      case TokenType.Ensure:
        return this.parseEnsureProposition()
      case TokenType.Assert:
        return this.parseAssertStatement()
      case TokenType.Update:
        return this.parseUpdateStatement()
      case TokenType.Retract:
        return this.parseRetractAssertion()
      case TokenType.Supersede:
        return this.parseSupersedeAssertion()
      case TokenType.Correct:
        return this.parseCorrectEvidence()
      case TokenType.Transition:
        return this.parseTransitionActivity()
      case TokenType.Set:
        return this.parseSetRetention()
      case TokenType.Archive:
        return this.parseArchiveStatement()
      case TokenType.Tombstone:
        return this.parseTombstoneStatement()
      case TokenType.Purge:
        return this.parsePurgeStatement()
      case TokenType.Merge:
        return this.parseMergeConcept()
      default:
        this.error(`Unexpected token '${tok.value}': expected a KML mutation`, tok)
        throw new ParseAbort()
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KQL — FIND
  // ────────────────────────────────────────────────────────────────────

  private parseFindStatement(): FindStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    this.dialect = 'kql'
    this.expect(TokenType.Find)
    this.expect(TokenType.LParen)

    const projections: Expression[] = []
    if (!this.check(TokenType.RParen)) {
      do {
        projections.push(this.parseProjectionExpression())
      } while (this.match(TokenType.Comma))
    }
    if (projections.length === 0) {
      this.error('FIND requires at least one projection', this.current())
    }
    this.expect(TokenType.RParen)

    this.expectKeywordWithSpace(TokenType.Where)
    const where = this.parseWhereClause()

    let asOf: AsOfClause | undefined
    let forTime: ForTimeClause | undefined
    let epistemic: EpistemicClause | undefined
    let orderBy: OrderByClause | undefined
    let limit: LimitClause | undefined
    let cursor: CursorClause | undefined

    // The grammar fixes this order. Accepting any order here would let a
    // command run on this parser that a conformant engine rejects, so each
    // clause is taken once and out-of-order repeats are reported.
    for (;;) {
      const tok = this.current()
      if (this.check(TokenType.As)) {
        this.rejectRepeat(asOf, 'AS OF', tok)
        asOf = this.parseAsOfClause()
      } else if (this.check(TokenType.For)) {
        this.rejectRepeat(forTime, 'FOR TIME', tok)
        forTime = this.parseForTimeClause()
      } else if (this.check(TokenType.With)) {
        this.rejectRepeat(epistemic, 'WITH EPISTEMIC', tok)
        epistemic = this.parseEpistemicClause()
      } else if (this.check(TokenType.Order)) {
        this.rejectRepeat(orderBy, 'ORDER BY', tok)
        orderBy = this.parseOrderBy()
      } else if (this.check(TokenType.Limit)) {
        this.rejectRepeat(limit, 'LIMIT', tok)
        limit = this.parseLimitClause()
      } else if (this.check(TokenType.Cursor)) {
        this.rejectRepeat(cursor, 'CURSOR', tok)
        cursor = this.parseCursorClause()
      } else {
        break
      }
    }

    return {
      kind: 'FindStatement',
      projections,
      where,
      asOf,
      forTime,
      epistemic,
      orderBy,
      limit,
      cursor,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  /** `projection_expression = aggregate_expression | expression` */
  private parseProjectionExpression(): Expression {
    return this.parseExpression()
  }

  private parseAsOfClause(): AsOfClause {
    const start = this.currentPos()
    const first = this.expect(TokenType.As)
    this.expectSecondWord(TokenType.Of, first)

    let basis: 'SEQ' | 'TX' | 'TIME'
    if (this.match(TokenType.Seq)) {
      basis = 'SEQ'
    } else if (this.match(TokenType.Tx)) {
      basis = 'TX'
    } else if (this.match(TokenType.Time)) {
      basis = 'TIME'
    } else {
      this.error(
        `Expected SEQ, TX or TIME after AS OF but got '${this.current().value}'`,
        this.current()
      )
      basis = 'SEQ'
    }
    const value = this.parseScalarValue()
    return {
      kind: 'AsOfClause',
      basis,
      value,
      range: { start, end: this.endPos() }
    }
  }

  private parseForTimeClause(): ForTimeClause {
    const start = this.currentPos()
    const first = this.expect(TokenType.For)
    this.expectSecondWord(TokenType.Time, first)
    const value = this.parseScalarValue()
    return {
      kind: 'ForTimeClause',
      value,
      range: { start, end: this.endPos() }
    }
  }

  private parseEpistemicClause(): EpistemicClause {
    const start = this.currentPos()
    const first = this.expect(TokenType.With)
    this.expectSecondWord(TokenType.Epistemic, first)
    const options = this.parseObjectLiteral()
    return {
      kind: 'EpistemicClause',
      options,
      range: { start, end: this.endPos() }
    }
  }

  private parseOrderBy(): OrderByClause {
    const start = this.currentPos()
    const first = this.expect(TokenType.Order)
    this.expectSecondWord(TokenType.By, first)

    const items: OrderItem[] = []
    do {
      items.push(this.parseOrderItem())
    } while (this.match(TokenType.Comma))

    return {
      kind: 'OrderByClause',
      items,
      range: { start, end: this.endPos() }
    }
  }

  private parseOrderItem(): OrderItem {
    const start = this.currentPos()
    const expression = this.parseProjectionExpression()
    let direction: 'ASC' | 'DESC' | undefined
    if (this.match(TokenType.Asc)) direction = 'ASC'
    else if (this.match(TokenType.Desc)) direction = 'DESC'
    return {
      kind: 'OrderItem',
      expression,
      direction,
      range: { start, end: this.endPos() }
    }
  }

  private parseLimitClause(): LimitClause {
    const start = this.currentPos()
    this.expect(TokenType.Limit)
    const value = this.parseScalarValue()
    return {
      kind: 'LimitClause',
      value,
      range: { start, end: this.endPos() }
    }
  }

  private parseCursorClause(): CursorClause {
    const start = this.currentPos()
    this.expect(TokenType.Cursor)
    const value = this.parseScalarValue()
    return {
      kind: 'CursorClause',
      value,
      range: { start, end: this.endPos() }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  WHERE
  // ────────────────────────────────────────────────────────────────────

  private parseWhereClause(): WhereClause {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const patterns = this.parseWherePatterns()
    this.expect(TokenType.RBrace)
    return {
      kind: 'WhereClause',
      patterns,
      range: { start, end: this.endPos() }
    }
  }

  private parseWherePatterns(): WherePattern[] {
    const patterns: WherePattern[] = []
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      const pattern = this.parseWherePattern()
      if (pattern) patterns.push(pattern)
      if (this.pos === before) break
      // WHERE items are whitespace-delimited; a comma between them is not
      // grammar, so report it rather than silently accepting both spellings.
      if (this.check(TokenType.Comma)) {
        this.error(
          'WHERE items are separated by whitespace, not commas',
          this.current()
        )
        this.advance()
      }
    }
    return patterns
  }

  private parseWherePattern(): WherePattern | null {
    const tok = this.current()
    switch (tok.type) {
      case TokenType.Variable:
        return this.parseVariableLeadingPattern()
      case TokenType.LParen:
      case TokenType.Proposition:
        return this.parsePropositionPattern(undefined)
      case TokenType.Structural:
        return this.parseStructuralPattern(undefined)
      case TokenType.Filter:
        return this.parseFilterClause()
      case TokenType.Not:
        return this.parseNotClause()
      case TokenType.Optional:
        return this.parseOptionalClause()
      case TokenType.Union:
        return this.parseUnionClause()
      default:
        this.error(`Unexpected token '${tok.value}' in WHERE block`, tok)
        this.advance()
        return null
    }
  }

  /**
   * Disambiguates the pattern families that all begin with a variable.
   *
   * `?x {`/`?x CONCEPT {` is a Concept, `?x (`/`?x PROPOSITION (` a raw
   * Proposition, and the remaining families name their kind outright.
   */
  private parseVariableLeadingPattern(): WherePattern {
    const variable = this.parseVariableRef()
    const tok = this.current()

    switch (tok.type) {
      case TokenType.LBrace:
      case TokenType.Concept:
        return this.parseConceptPattern(variable)
      case TokenType.LParen:
      case TokenType.Proposition:
        return this.parsePropositionPattern(variable)
      case TokenType.Assertion:
        return this.parseAssertionPattern(variable)
      case TokenType.Evidence:
        return this.parseEvidencePattern(variable)
      case TokenType.Activity:
        return this.parseActivityPattern(variable)
      case TokenType.Structural:
        return this.parseStructuralPattern(variable)
      case TokenType.Belief:
        return this.parseBeliefPattern(variable)
      default:
        this.error(
          `Expected a pattern body after ${variable.name} but got '${tok.value}'`,
          tok
        )
        throw new ParseAbort()
    }
  }

  private parseConceptPattern(variable: VariableRef): ConceptPattern {
    const explicit = this.match(TokenType.Concept)
    const matcher = this.parseObjectPattern()
    return {
      kind: 'ConceptPattern',
      variable,
      explicit,
      matcher,
      range: { start: variable.range.start, end: this.endPos() }
    }
  }

  private parsePropositionPattern(
    variable: VariableRef | undefined
  ): PropositionPattern {
    const start = variable ? variable.range.start : this.currentPos()
    const explicit = this.match(TokenType.Proposition)
    const tuple = this.parsePropositionTuple()
    return {
      kind: 'PropositionPattern',
      variable,
      explicit,
      tuple,
      range: { start, end: this.endPos() }
    }
  }

  private parseAssertionPattern(variable: VariableRef): AssertionPattern {
    this.expect(TokenType.Assertion)
    const matcher = this.parseObjectPattern()
    return {
      kind: 'AssertionPattern',
      variable,
      matcher,
      range: { start: variable.range.start, end: this.endPos() }
    }
  }

  private parseEvidencePattern(variable: VariableRef): EvidencePattern {
    this.expect(TokenType.Evidence)
    const matcher = this.parseObjectPattern()
    return {
      kind: 'EvidencePattern',
      variable,
      matcher,
      range: { start: variable.range.start, end: this.endPos() }
    }
  }

  private parseActivityPattern(variable: VariableRef): ActivityPattern {
    this.expect(TokenType.Activity)
    const matcher = this.parseObjectPattern()
    return {
      kind: 'ActivityPattern',
      variable,
      matcher,
      range: { start: variable.range.start, end: this.endPos() }
    }
  }

  private parseStructuralPattern(
    variable: VariableRef | undefined
  ): StructuralPattern {
    const start = variable ? variable.range.start : this.currentPos()
    this.expect(TokenType.Structural)
    this.expect(TokenType.LParen)
    const subject = this.parseTerm()
    this.expect(TokenType.Comma)
    const field = this.parseSchemaSymbol()
    this.expect(TokenType.Comma)
    const object = this.parseTerm()
    this.expect(TokenType.RParen)
    return {
      kind: 'StructuralPattern',
      variable,
      subject,
      field,
      object,
      range: { start, end: this.endPos() }
    }
  }

  private parseBeliefPattern(
    variable: VariableRef
  ): BeliefPattern | BeliefSlotPattern {
    const start = variable.range.start
    const beliefTok = this.expect(TokenType.Belief)

    // `BELIEF SLOT (...)` — the whole functional slot, not one tuple.
    if (this.check(TokenType.Slot)) {
      this.expectSecondWord(TokenType.Slot, beliefTok)
      this.expect(TokenType.LParen)
      const subject = this.parseTerm()
      this.expect(TokenType.Comma)
      const predicate = this.parsePredicateAtom()
      this.expect(TokenType.RParen)
      this.rejectBeliefInRawDialect(start)
      return {
        kind: 'BeliefSlotPattern',
        variable,
        subject,
        predicate,
        range: { start, end: this.endPos() }
      }
    }

    this.expect(TokenType.LParen)

    // `BELIEF (?p)` projects an already-bound Proposition; `BELIEF (s, p, o)`
    // projects a tuple. Only a lone variable followed by `)` is the former.
    if (this.check(TokenType.Variable) && this.peekPast(1)?.type === TokenType.RParen) {
      const proposition = this.parseVariableRef()
      this.expect(TokenType.RParen)
      this.rejectBeliefInRawDialect(start)
      return {
        kind: 'BeliefPattern',
        variable,
        proposition,
        range: { start, end: this.endPos() }
      }
    }

    // `BELIEF (id: ...)` — the operand is the Proposition expression slot, so
    // the same id form that names a Proposition in a pattern names it here
    // (Spec §43.2 / §46.1). Same recognition rule as parsePropositionTuple.
    if (this.isPropositionIdStart()) {
      this.advance() // id
      this.advance() // :
      const propositionId = this.parseScalarValue()
      this.expect(TokenType.RParen)
      this.rejectBeliefInRawDialect(start)
      return {
        kind: 'BeliefPattern',
        variable,
        propositionId,
        range: { start, end: this.endPos() }
      }
    }

    // `BELIEF (:p)` is the one spelling a reader might reach for that means
    // nothing: a lone parameter is not a bound variable and not an id
    // reference. Say what the reference form is instead of "expected ','",
    // and recover as if the id form had been written so nothing cascades.
    if (this.check(TokenType.Parameter) && this.peekPast(1)?.type === TokenType.RParen) {
      const param = this.current()
      this.error(
        `BELIEF (${param.value}) is not a form: name the Proposition by (id: ${param.value}), or bind it first and write BELIEF (?p)`,
        param
      )
      const propositionId = this.parseParameterRef()
      this.expect(TokenType.RParen)
      this.rejectBeliefInRawDialect(start)
      return {
        kind: 'BeliefPattern',
        variable,
        propositionId,
        range: { start, end: this.endPos() }
      }
    }

    const subject = this.parseTerm()
    this.expect(TokenType.Comma)
    const predicate = this.parsePredicateAtom()
    this.expect(TokenType.Comma)
    const object = this.parseTerm()
    this.expect(TokenType.RParen)
    this.rejectBeliefInRawDialect(start)
    return {
      kind: 'BeliefPattern',
      variable,
      subject,
      predicate,
      object,
      range: { start, end: this.endPos() }
    }
  }

  /**
   * BELIEF is an Epistemic Projection: virtual, read-only, and derived from a
   * policy. KML excludes it because a Projection can never be a mutation
   * target; EXPORT excludes it because a capsule carries records, not
   * interpretations.
   */
  private rejectBeliefInRawDialect(start: Position): void {
    if (this.dialect === 'raw') {
      this.diagnostics.push({
        range: { start, end: this.endPos() },
        severity: 'error',
        message:
          'BELIEF is a read-only Epistemic Projection and cannot appear in a mutation or export selection',
        code: 'KIP_1001'
      })
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
      range: { start, end: this.endPos() }
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
      range: { start, end: this.endPos() }
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
      range: { start, end: this.endPos() }
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
      range: { start, end: this.endPos() }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  Raw semantic tuples
  // ────────────────────────────────────────────────────────────────────

  private parsePropositionTuple(): PropositionTuple {
    const start = this.currentPos()
    this.expect(TokenType.LParen)

    // `(id: ...)` addresses the same slot by record identity. `id` is a field
    // name, not a keyword, so it is matched on its exact lowercase text and
    // only when a `:` follows — `(id, "p", ?o)` is still a triple whose
    // subject happens to be a variable-free term.
    if (this.isPropositionIdStart()) {
      this.advance() // id
      this.advance() // :
      const id = this.parseScalarValue()
      this.expect(TokenType.RParen)
      return {
        kind: 'PropositionTuple',
        id,
        range: { start, end: this.endPos() }
      }
    }

    const subject = this.parseTerm()
    this.expect(TokenType.Comma)
    const predicate = this.parseRawPredicateExpression()
    this.expect(TokenType.Comma)
    const object = this.parseTerm()
    this.expect(TokenType.RParen)
    return {
      kind: 'PropositionTuple',
      subject,
      predicate,
      object,
      range: { start, end: this.endPos() }
    }
  }

  /**
   * True when the cursor sits on the `id :` of a `(id: ...)` reference.
   *
   * Field names are case-sensitive, so only the exact spelling `id` counts;
   * `ID` is an ordinary identifier and would not parse as a term anyway.
   */
  private isPropositionIdStart(): boolean {
    const tok = this.current()
    if (tok.type !== TokenType.Identifier || tok.value !== 'id') return false
    const next = this.peekPast(1)
    // `(id: :p)` lexes the separator as its own colon; `(id:"P")` likewise,
    // because a parameter needs an identifier start after the colon.
    return next?.type === TokenType.Colon
  }

  private parseTerm(): Term {
    const tok = this.current()
    switch (tok.type) {
      case TokenType.Variable:
        return this.parseVariableRef()
      case TokenType.Parameter:
        return this.parseParameterRef()
      case TokenType.LBrace:
        return this.parseObjectPattern()
      case TokenType.LParen:
        return this.parsePropositionTuple()
      case TokenType.String:
      case TokenType.Number:
      case TokenType.Boolean:
      case TokenType.Null:
        return this.parseLiteral()
      default:
        this.error(
          `Expected a term (variable, parameter, literal, {...} or a tuple) but got '${tok.value}'`,
          tok
        )
        throw new ParseAbort()
    }
  }

  /** `predicate_atom = string_literal | parameter | variable` */
  private parsePredicateAtom(): PredicateAtom {
    const tok = this.current()
    if (tok.type === TokenType.String) {
      return this.parseStringLiteral()
    }
    if (tok.type === TokenType.Parameter) {
      return this.parseParameterRef()
    }
    if (tok.type === TokenType.Variable) {
      return this.parseVariableRef()
    }
    this.error(
      `Expected a predicate (quoted symbol, :parameter or ?variable) but got '${tok.value}'`,
      tok
    )
    throw new ParseAbort()
  }

  /**
   * `raw_predicate_expression` — path atoms joined by `|`.
   *
   * Alternation and hop quantifiers are traversal syntax owned by KQL. KML
   * and META spell the same slot as a bare `predicate_atom`, so in the raw
   * dialect anything beyond one plain atom is reported here.
   */
  private parseRawPredicateExpression(): RawPredicateExpression {
    const start = this.currentPos()
    const atoms: PredicatePathAtom[] = [this.parsePredicatePathAtom()]
    while (this.check(TokenType.Pipe)) {
      const pipe = this.current()
      if (this.dialect === 'raw') {
        this.error(
          'Predicate alternation is a KQL traversal form and is not allowed here',
          pipe
        )
      }
      this.advance()
      atoms.push(this.parsePredicatePathAtom())
    }
    return {
      kind: 'RawPredicateExpression',
      atoms,
      range: { start, end: this.endPos() }
    }
  }

  private parsePredicatePathAtom(): PredicatePathAtom {
    const start = this.currentPos()
    const atom = this.parsePredicateAtom()
    let quantifier: PathQuantifier | undefined
    if (this.check(TokenType.LBrace)) {
      const brace = this.current()
      if (this.dialect === 'raw') {
        this.error(
          'Path quantifiers are a KQL traversal form and are not allowed here',
          brace
        )
      }
      quantifier = this.parsePathQuantifier()
    }
    return {
      kind: 'PredicatePathAtom',
      atom,
      quantifier,
      range: { start, end: this.endPos() }
    }
  }

  private parsePathQuantifier(): PathQuantifier {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const min = this.expectHopCount()
    let max: number | undefined
    let hasComma = false
    if (this.match(TokenType.Comma)) {
      hasComma = true
      if (!this.check(TokenType.RBrace)) {
        max = this.expectHopCount()
      }
    } else {
      max = min
    }
    this.expect(TokenType.RBrace)
    if (max !== undefined && max < min) {
      this.error(
        `Hop range {${min},${max}} is empty: the maximum is below the minimum`,
        this.current()
      )
    }
    return {
      kind: 'PathQuantifier',
      min,
      max,
      hasComma,
      range: { start, end: this.endPos() }
    }
  }

  /**
   * A hop count is a plain unsigned integer.
   *
   * `{1.5}`, `{-1}` and `{1e3}` all lex as one number token, so the check is
   * on the token text, not on the parsed value.
   */
  private expectHopCount(): number {
    const tok = this.current()
    if (tok.type !== TokenType.Number || !/^\d+$/.test(tok.value)) {
      this.error(
        `Expected an unsigned integer hop count but got '${tok.value}'`,
        tok
      )
      this.advance()
      return 0
    }
    const value = Number(tok.value)
    if (value > 65535) {
      this.error(`Hop count ${value} exceeds the 16-bit maximum 65535`, tok)
    }
    this.advance()
    return value
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML — MUTATE
  // ────────────────────────────────────────────────────────────────────

  private parseMutateStatement(): MutateStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    this.expectKeywordWithSpace(TokenType.Mutate)
    this.expect(TokenType.LBrace)

    const clauses: MutationClause[] = []
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace) || this.isAtEnd()) break
      // A nested MUTATE is not a smaller transaction, it is a different
      // statement; the grammar forbids it outright.
      if (this.check(TokenType.Mutate)) {
        this.error('MUTATE cannot contain another MUTATE', this.current())
        this.advance()
        continue
      }
      try {
        clauses.push(this.parseMutationClause())
      } catch {
        this.recoverToMutationBoundary()
      }
      if (this.pos === before) break
    }
    this.expect(TokenType.RBrace)

    return {
      kind: 'MutateStatement',
      clauses,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML — CREATE / UPSERT / ENSURE / ASSERT
  // ────────────────────────────────────────────────────────────────────

  private parseCreateStatement():
    | CreateConceptStatement
    | CreateEvidenceStatement
    | CreateAssertionStatement
    | CreateActivityStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const create = this.expectKeywordWithSpace(TokenType.Create)

    const tok = this.current()
    switch (tok.type) {
      case TokenType.Concept:
        this.expectSecondWord(TokenType.Concept, create)
        return this.parseCreateConceptBody(start, leadingComments)
      case TokenType.Evidence:
        this.expectSecondWord(TokenType.Evidence, create)
        return this.parseRecordCreateBody(
          'CreateEvidenceStatement',
          start,
          leadingComments
        ) as CreateEvidenceStatement
      case TokenType.Assertion:
        this.expectSecondWord(TokenType.Assertion, create)
        return this.parseRecordCreateBody(
          'CreateAssertionStatement',
          start,
          leadingComments
        ) as CreateAssertionStatement
      case TokenType.Activity:
        this.expectSecondWord(TokenType.Activity, create)
        return this.parseRecordCreateBody(
          'CreateActivityStatement',
          start,
          leadingComments
        ) as CreateActivityStatement
      default:
        this.error(
          `Expected CONCEPT, EVIDENCE, ASSERTION or ACTIVITY after CREATE but got '${tok.value}'`,
          tok
        )
        throw new ParseAbort()
    }
  }

  private parseCreateConceptBody(
    start: Position,
    leadingComments: string[]
  ): CreateConceptStatement {
    const handle = this.expectHandle()
    this.expect(TokenType.LBrace)

    const stmt: CreateConceptStatement = {
      kind: 'CreateConceptStatement',
      handle,
      setFacets: [],
      range: { start, end: start },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }

    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace) || this.isAtEnd()) break
      const tok = this.current()
      switch (tok.type) {
        case TokenType.Type:
          this.rejectRepeat(stmt.type, 'TYPE', tok)
          stmt.type = this.parseTypeClause()
          break
        case TokenType.Client:
          this.rejectRepeat(stmt.clientKey, 'CLIENT KEY', tok)
          stmt.clientKey = this.parseClientKeyClause()
          break
        case TokenType.Name:
          this.rejectRepeat(stmt.name, 'NAME', tok)
          stmt.name = this.parseNameClause()
          break
        case TokenType.Set:
          this.applyCreateSetClause(stmt, tok)
          break
        default:
          this.error(`Unexpected token '${tok.value}' in CREATE CONCEPT`, tok)
          this.advance()
      }
      if (this.pos === before) break
    }
    this.expect(TokenType.RBrace)
    stmt.range = { start, end: this.endPos() }
    return stmt
  }

  private applyCreateSetClause(stmt: CreateConceptStatement, tok: Token): void {
    const clause = this.parseSetClause()
    switch (clause.kind) {
      case 'SetFieldsClause':
        this.rejectRepeat(stmt.setFields, 'SET FIELDS', tok)
        stmt.setFields = clause
        break
      case 'SetAttributesClause':
        this.rejectRepeat(stmt.setAttributes, 'SET ATTRIBUTES', tok)
        stmt.setAttributes = clause
        break
      case 'SetFacetClause':
        stmt.setFacets.push(clause)
        break
      case 'SetStructuralClause':
        this.rejectRepeat(stmt.setStructural, 'SET STRUCTURAL', tok)
        stmt.setStructural = clause
        break
      default:
        this.error(`'SET ${clause.kind}' is not allowed in CREATE CONCEPT`, tok)
    }
  }

  /** CREATE EVIDENCE / ASSERTION / ACTIVITY share one clause vocabulary. */
  private parseRecordCreateBody(
    kind:
      | 'CreateEvidenceStatement'
      | 'CreateAssertionStatement'
      | 'CreateActivityStatement',
    start: Position,
    leadingComments: string[]
  ): CreateEvidenceStatement | CreateAssertionStatement | CreateActivityStatement {
    const handle = this.expectHandle()
    this.expect(TokenType.LBrace)

    const stmt = {
      kind,
      handle,
      setFacets: [] as SetFacetClause[],
      clientKey: undefined as ClientKeyClause | undefined,
      setFields: undefined as SetFieldsClause | undefined,
      setStructural: undefined as SetStructuralClause | undefined,
      range: { start, end: start },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }

    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace) || this.isAtEnd()) break
      const tok = this.current()
      if (tok.type === TokenType.Client) {
        this.rejectRepeat(stmt.clientKey, 'CLIENT KEY', tok)
        stmt.clientKey = this.parseClientKeyClause()
      } else if (tok.type === TokenType.Set) {
        const clause = this.parseSetClause()
        if (clause.kind === 'SetFieldsClause') {
          this.rejectRepeat(stmt.setFields, 'SET FIELDS', tok)
          stmt.setFields = clause
        } else if (clause.kind === 'SetFacetClause') {
          stmt.setFacets.push(clause)
        } else if (clause.kind === 'SetStructuralClause') {
          this.rejectRepeat(stmt.setStructural, 'SET STRUCTURAL', tok)
          stmt.setStructural = clause
        } else {
          this.error(
            `'SET ${clause.kind}' is not allowed in ${kind.replace('Statement', '')}`,
            tok
          )
        }
      } else {
        this.error(`Unexpected token '${tok.value}' in ${kind}`, tok)
        this.advance()
      }
      if (this.pos === before) break
    }
    this.expect(TokenType.RBrace)
    stmt.range = { start, end: this.endPos() }
    return stmt as
      | CreateEvidenceStatement
      | CreateAssertionStatement
      | CreateActivityStatement
  }

  private parseUpsertConcept(): UpsertConceptStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const upsert = this.expectKeywordWithSpace(TokenType.Upsert)
    this.expectSecondWord(TokenType.Concept, upsert)
    const handle = this.expectHandle()
    this.expect(TokenType.LBrace)

    const stmt: UpsertConceptStatement = {
      kind: 'UpsertConceptStatement',
      handle,
      setFacets: [],
      unsetFacets: [],
      range: { start, end: start },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }

    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace) || this.isAtEnd()) break
      const tok = this.current()
      switch (tok.type) {
        case TokenType.Match:
          this.rejectRepeat(stmt.match, 'MATCH', tok)
          stmt.match = this.parseMatchClause()
          break
        case TokenType.Expect:
          this.rejectRepeat(stmt.expectVersion, 'EXPECT VERSION', tok)
          stmt.expectVersion = this.parseExpectVersionClause()
          break
        case TokenType.Set: {
          const clause = this.parseSetClause()
          if (clause.kind === 'SetFieldsClause') {
            this.rejectRepeat(stmt.setFields, 'SET FIELDS', tok)
            stmt.setFields = clause
          } else if (clause.kind === 'SetAttributesClause') {
            this.rejectRepeat(stmt.setAttributes, 'SET ATTRIBUTES', tok)
            stmt.setAttributes = clause
          } else if (clause.kind === 'SetFacetClause') {
            stmt.setFacets.push(clause)
          } else if (clause.kind === 'SetStructuralClause') {
            this.rejectRepeat(stmt.setStructural, 'SET STRUCTURAL', tok)
            stmt.setStructural = clause
          } else {
            this.error(`'SET RETENTION' is not a clause of UPSERT CONCEPT`, tok)
          }
          break
        }
        case TokenType.Unset: {
          const clause = this.parseUnsetClause()
          if (clause.kind === 'UnsetAttributesClause') {
            this.rejectRepeat(stmt.unsetAttributes, 'UNSET ATTRIBUTES', tok)
            stmt.unsetAttributes = clause
          } else {
            stmt.unsetFacets.push(clause)
          }
          break
        }
        default:
          this.error(`Unexpected token '${tok.value}' in UPSERT CONCEPT`, tok)
          this.advance()
      }
      if (this.pos === before) break
    }
    this.expect(TokenType.RBrace)
    stmt.range = { start, end: this.endPos() }
    return stmt
  }

  private parseEnsureProposition(): EnsurePropositionStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const ensure = this.expectKeywordWithSpace(TokenType.Ensure)
    this.expectSecondWord(TokenType.Proposition, ensure)

    const handle = this.check(TokenType.Variable)
      ? this.parseVariableRef()
      : undefined
    this.dialect = 'raw'
    const tuple = this.parsePropositionTuple()
    const expectVersion = this.check(TokenType.Expect)
      ? this.parseExpectVersionClause()
      : undefined

    return {
      kind: 'EnsurePropositionStatement',
      handle,
      tuple,
      expectVersion,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseAssertStatement(): AssertStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    this.expectKeywordWithSpace(TokenType.Assert)

    const handle = this.check(TokenType.Variable)
      ? this.parseVariableRef()
      : undefined
    this.dialect = 'raw'
    const tuple = this.parsePropositionTuple()
    const assignments = this.parseAssignmentObject()

    let superseding: TargetRef | undefined
    if (this.match(TokenType.Superseding)) {
      superseding = this.parseTargetRef()
    }

    return {
      kind: 'AssertStatement',
      handle,
      tuple,
      assignments,
      superseding,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML — clause vocabulary
  // ────────────────────────────────────────────────────────────────────

  private parseTypeClause(): TypeClause {
    const start = this.currentPos()
    this.expect(TokenType.Type)
    const value = this.parseSchemaSymbol()
    return { kind: 'TypeClause', value, range: { start, end: this.endPos() } }
  }

  private parseClientKeyClause(): ClientKeyClause {
    const start = this.currentPos()
    const client = this.expect(TokenType.Client)
    this.expectSecondWord(TokenType.Key, client)
    const value = this.parseScalarValue()
    return {
      kind: 'ClientKeyClause',
      value,
      range: { start, end: this.endPos() }
    }
  }

  private parseNameClause(): NameClause {
    const start = this.currentPos()
    this.expect(TokenType.Name)
    const value = this.parseScalarValue()
    return { kind: 'NameClause', value, range: { start, end: this.endPos() } }
  }

  private parseMatchClause(): MatchClause {
    const start = this.currentPos()
    this.expect(TokenType.Match)
    const pattern = this.parseObjectPattern()
    return {
      kind: 'MatchClause',
      pattern,
      range: { start, end: this.endPos() }
    }
  }

  /** Dispatches every `SET ...` form; callers reject the ones they disallow. */
  private parseSetClause():
    | SetFieldsClause
    | SetAttributesClause
    | SetFacetClause
    | SetStructuralClause
    | { kind: 'SetRetentionMarker' } {
    const start = this.currentPos()
    const set = this.expect(TokenType.Set)
    const tok = this.current()

    switch (tok.type) {
      case TokenType.Fields: {
        this.expectSecondWord(TokenType.Fields, set)
        const assignments = this.parseAssignmentObject()
        return {
          kind: 'SetFieldsClause',
          assignments,
          range: { start, end: this.endPos() }
        }
      }
      case TokenType.Attributes: {
        this.expectSecondWord(TokenType.Attributes, set)
        const assignments = this.parseAssignmentObject()
        return {
          kind: 'SetAttributesClause',
          assignments,
          range: { start, end: this.endPos() }
        }
      }
      case TokenType.Facet: {
        this.expectSecondWord(TokenType.Facet, set)
        const facet = this.parseSchemaSymbol()
        const assignments = this.parseAssignmentObject()
        return {
          kind: 'SetFacetClause',
          facet,
          assignments,
          range: { start, end: this.endPos() }
        }
      }
      case TokenType.Structural: {
        this.expectSecondWord(TokenType.Structural, set)
        return this.parseSetStructuralBody(start)
      }
      case TokenType.Retention:
        return { kind: 'SetRetentionMarker' }
      default:
        this.error(
          `Expected FIELDS, ATTRIBUTES, FACET, STRUCTURAL or RETENTION after SET but got '${tok.value}'`,
          tok
        )
        throw new ParseAbort()
    }
  }

  private parseSetStructuralBody(start: Position): SetStructuralClause {
    this.expect(TokenType.LBrace)
    const assignments: StructuralAssignment[] = []
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      const before = this.pos
      this.skipComments()
      if (this.check(TokenType.RBrace) || this.isAtEnd()) break
      assignments.push(this.parseStructuralAssignment())
      if (this.pos === before) break
    }
    this.expect(TokenType.RBrace)
    return {
      kind: 'SetStructuralClause',
      assignments,
      range: { start, end: this.endPos() }
    }
  }

  private parseStructuralAssignment(): StructuralAssignment {
    const start = this.currentPos()
    this.expect(TokenType.LParen)
    const field = this.parseSchemaSymbol()
    this.expect(TokenType.Comma)
    const value = this.parseMutationValue()
    this.expect(TokenType.RParen)

    const options = this.check(TokenType.LBrace)
      ? this.parseObjectLiteral()
      : undefined

    return {
      kind: 'StructuralAssignment',
      field,
      value,
      options,
      range: { start, end: this.endPos() }
    }
  }

  private parseUnsetClause(): UnsetAttributesClause | UnsetFacetClause {
    const start = this.currentPos()
    const unset = this.expect(TokenType.Unset)
    const tok = this.current()

    if (tok.type === TokenType.Attributes) {
      this.expectSecondWord(TokenType.Attributes, unset)
      const fields = this.parseUnsetFieldSet()
      return {
        kind: 'UnsetAttributesClause',
        fields,
        range: { start, end: this.endPos() }
      }
    }
    if (tok.type === TokenType.Facet) {
      this.expectSecondWord(TokenType.Facet, unset)
      const facet = this.parseSchemaSymbol()
      const fields = this.parseUnsetFieldSet()
      return {
        kind: 'UnsetFacetClause',
        facet,
        fields,
        range: { start, end: this.endPos() }
      }
    }
    this.error(
      `Expected ATTRIBUTES or FACET after UNSET but got '${tok.value}'`,
      tok
    )
    throw new ParseAbort()
  }

  private parseUnsetFieldSet(): UnsetField[] {
    this.expect(TokenType.LBrace)
    const fields: UnsetField[] = []
    if (!this.check(TokenType.RBrace)) {
      do {
        if (this.check(TokenType.RBrace)) break
        const start = this.currentPos()
        const { key, isQuoted } = this.expectKeyWithQuoting()
        fields.push({
          kind: 'UnsetField',
          name: key,
          isQuoted,
          range: { start, end: this.endPos() }
        })
      } while (this.match(TokenType.Comma))
    }
    this.expect(TokenType.RBrace)
    return fields
  }

  private parseExpectVersionClause(): ExpectVersionClause {
    const start = this.currentPos()
    const expect = this.expect(TokenType.Expect)
    this.expectSecondWord(TokenType.Version, expect)
    const value = this.parseScalarValue()
    return {
      kind: 'ExpectVersionClause',
      value,
      range: { start, end: this.endPos() }
    }
  }

  private parseExpectStateClause(): ExpectStateClause {
    const start = this.currentPos()
    const expect = this.expect(TokenType.Expect)
    this.expectSecondWord(TokenType.State, expect)
    const value = this.parseScalarValue()
    return {
      kind: 'ExpectStateClause',
      value,
      range: { start, end: this.endPos() }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML — UPDATE
  // ────────────────────────────────────────────────────────────────────

  private parseUpdateStatement(): UpdateStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    this.expectKeywordWithSpace(TokenType.Update)
    const target = this.parseTargetRef()

    const expectVersion = this.check(TokenType.Expect)
      ? this.parseExpectVersionClause()
      : undefined

    const actions: UpdateAction[] = []
    for (;;) {
      if (this.check(TokenType.Set)) {
        const clause = this.parseSetClause()
        if (clause.kind === 'SetRetentionMarker') {
          this.error(
            'SET RETENTION is its own statement, not an UPDATE action',
            this.current()
          )
          break
        }
        actions.push(clause)
      } else if (this.check(TokenType.Unset)) {
        actions.push(this.parseUnsetClause())
      } else {
        break
      }
    }
    if (actions.length === 0) {
      this.error('UPDATE requires at least one SET or UNSET action', this.current())
    }

    // WHERE binds a ?variable target; a direct :id / "id" target already names
    // the element and may omit it, exactly as ARCHIVE / TOMBSTONE / PURGE /
    // SET RETENTION / RETRACT ASSERTION do (Spec §58). Whether a bare
    // ?variable is bound is semantic — inside MUTATE it may be a local handle.
    let where: WhereClause | undefined
    if (this.check(TokenType.Where)) {
      this.expectKeywordWithSpace(TokenType.Where)
      this.dialect = 'raw'
      where = this.parseWhereClause()
    }
    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined

    return {
      kind: 'UpdateStatement',
      target,
      expectVersion,
      actions,
      where,
      limit,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML — lifecycle and correction
  // ────────────────────────────────────────────────────────────────────

  private parseRetractAssertion(): RetractAssertionStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const retract = this.expectKeywordWithSpace(TokenType.Retract)
    this.expectSecondWord(TokenType.Assertion, retract)
    const target = this.parseTargetRef()

    let where: WhereClause | undefined
    if (this.check(TokenType.Where)) {
      this.expectKeywordWithSpace(TokenType.Where)
      this.dialect = 'raw'
      where = this.parseWhereClause()
    }
    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined
    const expectState = this.check(TokenType.Expect)
      ? this.parseExpectStateClause()
      : undefined

    return {
      kind: 'RetractAssertionStatement',
      target,
      where,
      limit,
      expectState,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseSupersedeAssertion(): SupersedeAssertionStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const supersede = this.expectKeywordWithSpace(TokenType.Supersede)
    this.expectSecondWord(TokenType.Assertion, supersede)
    const target = this.parseTargetRef()
    this.expect(TokenType.By)
    const by = this.parseTargetRef()
    const expectState = this.check(TokenType.Expect)
      ? this.parseExpectStateClause()
      : undefined

    return {
      kind: 'SupersedeAssertionStatement',
      target,
      by,
      expectState,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseCorrectEvidence(): CorrectEvidenceStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const correct = this.expectKeywordWithSpace(TokenType.Correct)
    this.expectSecondWord(TokenType.Evidence, correct)
    const target = this.parseTargetRef()
    this.expect(TokenType.By)
    const by = this.parseTargetRef()
    const expectState = this.check(TokenType.Expect)
      ? this.parseExpectStateClause()
      : undefined

    return {
      kind: 'CorrectEvidenceStatement',
      target,
      by,
      expectState,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseTransitionActivity(): TransitionActivityStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const transition = this.expectKeywordWithSpace(TokenType.Transition)
    this.expectSecondWord(TokenType.Activity, transition)
    const target = this.parseTargetRef()
    this.expect(TokenType.To)
    const to = this.parseScalarValue()

    // Terminal outputs and ended_at may be finalized in the same statement
    // that moves the Activity to its terminal state.
    const finalize: (SetFieldsClause | SetStructuralClause)[] = []
    while (this.check(TokenType.Set)) {
      const clause = this.parseSetClause()
      if (clause.kind === 'SetFieldsClause' || clause.kind === 'SetStructuralClause') {
        finalize.push(clause)
      } else {
        this.error(
          'TRANSITION ACTIVITY accepts only SET FIELDS and SET STRUCTURAL',
          this.current()
        )
        break
      }
    }

    const expectState = this.check(TokenType.Expect)
      ? this.parseExpectStateClause()
      : undefined

    return {
      kind: 'TransitionActivityStatement',
      target,
      to,
      finalize,
      expectState,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML — retention and removal
  // ────────────────────────────────────────────────────────────────────

  private parseSetRetention(): SetRetentionStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const set = this.expectKeywordWithSpace(TokenType.Set)
    this.expectSecondWord(TokenType.Retention, set)
    const target = this.parseTargetRef()
    const assignments = this.parseAssignmentObject()

    let where: WhereClause | undefined
    if (this.check(TokenType.Where)) {
      this.expectKeywordWithSpace(TokenType.Where)
      this.dialect = 'raw'
      where = this.parseWhereClause()
    }
    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined
    const expectVersion = this.check(TokenType.Expect)
      ? this.parseExpectVersionClause()
      : undefined

    return {
      kind: 'SetRetentionStatement',
      target,
      assignments,
      where,
      limit,
      expectVersion,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseArchiveStatement(): ArchiveStatement {
    const { start, target, where, limit, expectState, leadingComments } =
      this.parseRemovalBody(TokenType.Archive)
    return {
      kind: 'ArchiveStatement',
      target,
      where,
      limit,
      expectState,
      range: { start, end: this.endPos() },
      leadingComments
    }
  }

  private parseTombstoneStatement(): TombstoneStatement {
    const { start, target, where, limit, expectState, leadingComments } =
      this.parseRemovalBody(TokenType.Tombstone)
    return {
      kind: 'TombstoneStatement',
      target,
      where,
      limit,
      expectState,
      range: { start, end: this.endPos() },
      leadingComments
    }
  }

  /** ARCHIVE and TOMBSTONE share one shape; PURGE adds its confirmation. */
  private parseRemovalBody(keyword: TokenType): {
    start: Position
    target: TargetRef
    where?: WhereClause
    limit?: LimitClause
    expectState?: ExpectStateClause
    leadingComments?: string[]
  } {
    const comments = this.collectLeadingComments()
    const start = this.currentPos()
    this.expectKeywordWithSpace(keyword)
    const target = this.parseTargetRef()

    let where: WhereClause | undefined
    if (this.check(TokenType.Where)) {
      this.expectKeywordWithSpace(TokenType.Where)
      this.dialect = 'raw'
      where = this.parseWhereClause()
    }
    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined
    const expectState = this.check(TokenType.Expect)
      ? this.parseExpectStateClause()
      : undefined

    return {
      start,
      target,
      where,
      limit,
      expectState,
      leadingComments: comments.length ? comments : undefined
    }
  }

  private parsePurgeStatement(): PurgeStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    this.expectKeywordWithSpace(TokenType.Purge)
    const target = this.parseTargetRef()

    let where: WhereClause | undefined
    if (this.check(TokenType.Where)) {
      this.expectKeywordWithSpace(TokenType.Where)
      this.dialect = 'raw'
      where = this.parseWhereClause()
    }

    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined

    let referencePolicy: ScalarValue | undefined
    if (this.check(TokenType.Reference)) {
      const reference = this.expect(TokenType.Reference)
      this.expectSecondWord(TokenType.Policy, reference)
      referencePolicy = this.parseScalarValue()
    }

    // The grammar freezes the confirmation spelling. Physical erasure is
    // exceptional, so the literal is required and checked here rather than
    // left for the engine to discover.
    this.expect(TokenType.Confirm)
    const confirmTok = this.current()
    const confirm = this.parseStringLiteral()
    if (confirm.parsed !== 'PURGE') {
      this.error(
        `PURGE must be confirmed with the exact literal "PURGE", got ${confirmTok.value}`,
        confirmTok
      )
    }

    return {
      kind: 'PurgeStatement',
      target,
      where,
      limit,
      referencePolicy,
      confirm,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseMergeConcept(): MergeConceptStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const merge = this.expectKeywordWithSpace(TokenType.Merge)
    this.expectSecondWord(TokenType.Concept, merge)
    const source = this.parseTargetRef()
    this.expect(TokenType.Into)
    const into = this.parseTargetRef()

    let where: WhereClause | undefined
    if (this.check(TokenType.Where)) {
      this.expectKeywordWithSpace(TokenType.Where)
      this.dialect = 'raw'
      where = this.parseWhereClause()
    }
    const expectVersion = this.check(TokenType.Expect)
      ? this.parseExpectVersionClause()
      : undefined

    return {
      kind: 'MergeConceptStatement',
      source,
      into,
      where,
      expectVersion,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  META — DESCRIBE
  // ────────────────────────────────────────────────────────────────────

  private parseDescribeStatement(): DescribeStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const describe = this.expectKeywordWithSpace(TokenType.Describe)
    const tok = this.current()

    const stmt = (
      target: DescribeTargetKind,
      extra: Partial<DescribeStatement> = {}
    ): DescribeStatement => ({
      kind: 'DescribeStatement',
      target,
      ...extra,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    })

    switch (tok.type) {
      case TokenType.Primer: {
        this.expectSecondWord(TokenType.Primer, describe)
        let mode: ScalarValue | undefined
        if (this.match(TokenType.Mode)) mode = this.parseScalarValue()
        return stmt('PRIMER', { mode })
      }
      case TokenType.Protocol:
        this.expectSecondWord(TokenType.Protocol, describe)
        return stmt('PROTOCOL')
      case TokenType.Execution: {
        const exec = this.expectSecondWord(TokenType.Execution, describe)
        this.expectSecondWord(TokenType.Context, exec)
        return stmt('EXECUTION_CONTEXT')
      }
      case TokenType.Capabilities:
        this.expectSecondWord(TokenType.Capabilities, describe)
        return stmt('CAPABILITIES')
      case TokenType.Space: {
        this.expectSecondWord(TokenType.Space, describe)
        const value = this.isMetaValueStart() ? this.parseScalarValue() : undefined
        return stmt('SPACE', { value })
      }
      case TokenType.Schema: {
        const schema = this.expectSecondWord(TokenType.Schema, describe)
        this.expectSecondWord(TokenType.Environment, schema)
        const asOf = this.check(TokenType.As) ? this.parseAsOfClause() : undefined
        return stmt('SCHEMA_ENVIRONMENT', { asOf })
      }
      case TokenType.Package:
        this.expectSecondWord(TokenType.Package, describe)
        return stmt('PACKAGE', { value: this.parseScalarValue() })
      case TokenType.Type:
        this.expectSecondWord(TokenType.Type, describe)
        return stmt('TYPE', { value: this.parseScalarValue() })
      case TokenType.Predicate:
        this.expectSecondWord(TokenType.Predicate, describe)
        return stmt('PREDICATE', { value: this.parseScalarValue() })
      case TokenType.Facet:
        this.expectSecondWord(TokenType.Facet, describe)
        return stmt('FACET', { value: this.parseScalarValue() })
      case TokenType.Structural: {
        const structural = this.expectSecondWord(TokenType.Structural, describe)
        this.expectSecondWord(TokenType.Field, structural)
        return stmt('STRUCTURAL_FIELD', { value: this.parseScalarValue() })
      }
      case TokenType.Compatibility: {
        this.expectSecondWord(TokenType.Compatibility, describe)
        this.expect(TokenType.From)
        const from = this.parseScalarValue()
        this.expect(TokenType.To)
        const to = this.parseScalarValue()
        return stmt('COMPATIBILITY', { from, to })
      }
      case TokenType.Error:
        this.expectSecondWord(TokenType.Error, describe)
        return stmt('ERROR', { value: this.parseScalarValue() })
      case TokenType.Transaction: {
        const transaction = this.expectSecondWord(TokenType.Transaction, describe)
        if (this.check(TokenType.By)) {
          const by = this.expectSecondWord(TokenType.By, transaction)
          const idem = this.expectSecondWord(TokenType.Idempotency, by)
          this.expectSecondWord(TokenType.Key, idem)
          return stmt('TRANSACTION_BY_IDEMPOTENCY_KEY', {
            value: this.parseScalarValue()
          })
        }
        return stmt('TRANSACTION', { value: this.parseScalarValue() })
      }
      case TokenType.Snapshot: {
        this.expectSecondWord(TokenType.Snapshot, describe)
        const asOf = this.check(TokenType.As) ? this.parseAsOfClause() : undefined
        return stmt('SNAPSHOT', { asOf })
      }
      case TokenType.Capsule:
        this.expectSecondWord(TokenType.Capsule, describe)
        return stmt('CAPSULE', { value: this.parseScalarValue() })
      case TokenType.Epistemic: {
        const epistemic = this.expectSecondWord(TokenType.Epistemic, describe)
        this.expectSecondWord(TokenType.Policy, epistemic)
        const value = this.isMetaValueStart() ? this.parseScalarValue() : undefined
        return stmt('EPISTEMIC_POLICY', { value })
      }
      case TokenType.Projection: {
        const projection = this.expectSecondWord(TokenType.Projection, describe)
        this.expectSecondWord(TokenType.Capability, projection)
        return stmt('PROJECTION_CAPABILITY')
      }
      case TokenType.Trust: {
        this.expectSecondWord(TokenType.Trust, describe)
        const value = this.isMetaValueStart() ? this.parseScalarValue() : undefined
        return stmt('TRUST', { value })
      }
      case TokenType.Access: {
        this.expectSecondWord(TokenType.Access, describe)
        const withOptions = this.match(TokenType.With)
          ? this.parseObjectLiteral()
          : undefined
        return stmt('ACCESS', { with: withOptions })
      }
      default:
        this.error(`Unknown DESCRIBE target '${tok.value}'`, tok)
        throw new ParseAbort()
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  META — LIST
  // ────────────────────────────────────────────────────────────────────

  private parseListStatement(): ListStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const list = this.expectKeywordWithSpace(TokenType.List)
    const tok = this.current()

    let target: ListTargetKind
    let status: ScalarValue | undefined

    switch (tok.type) {
      case TokenType.Spaces:
        this.expectSecondWord(TokenType.Spaces, list)
        target = 'SPACES'
        break
      case TokenType.Schema: {
        const schema = this.expectSecondWord(TokenType.Schema, list)
        this.expectSecondWord(TokenType.Packages, schema)
        target = 'SCHEMA_PACKAGES'
        if (this.match(TokenType.Status)) status = this.parseScalarValue()
        break
      }
      case TokenType.Types:
        this.expectSecondWord(TokenType.Types, list)
        target = 'TYPES'
        break
      case TokenType.Predicates:
        this.expectSecondWord(TokenType.Predicates, list)
        target = 'PREDICATES'
        break
      case TokenType.Facets:
        this.expectSecondWord(TokenType.Facets, list)
        target = 'FACETS'
        break
      case TokenType.Structural: {
        const structural = this.expectSecondWord(TokenType.Structural, list)
        this.expectSecondWord(TokenType.Fields, structural)
        target = 'STRUCTURAL_FIELDS'
        break
      }
      case TokenType.Epistemic: {
        const epistemic = this.expectSecondWord(TokenType.Epistemic, list)
        this.expectSecondWord(TokenType.Policies, epistemic)
        target = 'EPISTEMIC_POLICIES'
        break
      }
      default:
        this.error(`Unknown LIST target '${tok.value}'`, tok)
        throw new ParseAbort()
    }

    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined
    const cursor = this.check(TokenType.Cursor)
      ? this.parseCursorClause()
      : undefined

    return {
      kind: 'ListStatement',
      target,
      status,
      limit,
      cursor,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  META — SEARCH
  // ────────────────────────────────────────────────────────────────────

  private parseSearchStatement(): SearchStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const search = this.expectKeywordWithSpace(TokenType.Search)

    const kindTok = this.current()
    let searchKind: SearchKind
    switch (kindTok.type) {
      case TokenType.Concept:
        searchKind = 'CONCEPT'
        break
      case TokenType.Proposition:
        searchKind = 'PROPOSITION'
        break
      case TokenType.Assertion:
        searchKind = 'ASSERTION'
        break
      case TokenType.Evidence:
        searchKind = 'EVIDENCE'
        break
      case TokenType.Activity:
        searchKind = 'ACTIVITY'
        break
      case TokenType.Cognition:
        searchKind = 'COGNITION'
        break
      default:
        this.error(
          `Expected CONCEPT, PROPOSITION, ASSERTION, EVIDENCE, ACTIVITY or COGNITION after SEARCH but got '${kindTok.value}'`,
          kindTok
        )
        throw new ParseAbort()
    }
    this.expectSecondWord(kindTok.type, search)

    const term = this.parseScalarValue()

    let withType: ScalarValue | undefined
    let withPredicate: ScalarValue | undefined
    let mode: ScalarValue | undefined
    let threshold: ScalarValue | undefined
    let asOfSeq: ScalarValue | undefined

    // The grammar fixes this order; each modifier is taken at most once.
    while (this.check(TokenType.With)) {
      const withTok = this.expect(TokenType.With)
      if (this.check(TokenType.Type)) {
        this.expectSecondWord(TokenType.Type, withTok)
        this.rejectRepeat(withType, 'WITH TYPE', withTok)
        withType = this.parseScalarValue()
      } else if (this.check(TokenType.Predicate)) {
        this.expectSecondWord(TokenType.Predicate, withTok)
        this.rejectRepeat(withPredicate, 'WITH PREDICATE', withTok)
        withPredicate = this.parseScalarValue()
      } else {
        this.error(
          `Expected TYPE or PREDICATE after WITH but got '${this.current().value}'`,
          this.current()
        )
        break
      }
    }

    if (this.match(TokenType.Mode)) mode = this.parseScalarValue()
    if (this.match(TokenType.Threshold)) threshold = this.parseScalarValue()

    if (this.check(TokenType.As)) {
      const as = this.expect(TokenType.As)
      const of = this.expectSecondWord(TokenType.Of, as)
      this.expectSecondWord(TokenType.Seq, of)
      asOfSeq = this.parseScalarValue()
    }

    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined
    const cursor = this.check(TokenType.Cursor)
      ? this.parseCursorClause()
      : undefined

    return {
      kind: 'SearchStatement',
      searchKind,
      term,
      withType,
      withPredicate,
      mode,
      threshold,
      asOfSeq,
      limit,
      cursor,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  META — VERIFY / VALIDATE / PREVIEW
  // ────────────────────────────────────────────────────────────────────

  private parseVerifyStatement(): VerifyStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const verify = this.expectKeywordWithSpace(TokenType.Verify)
    const tok = this.current()

    let target: VerifyTargetKind
    switch (tok.type) {
      case TokenType.Capsule:
        this.expectSecondWord(TokenType.Capsule, verify)
        target = 'CAPSULE'
        break
      case TokenType.Schema: {
        const schema = this.expectSecondWord(TokenType.Schema, verify)
        this.expectSecondWord(TokenType.Package, schema)
        target = 'SCHEMA_PACKAGE'
        break
      }
      case TokenType.Receipt:
        this.expectSecondWord(TokenType.Receipt, verify)
        target = 'RECEIPT'
        break
      case TokenType.Blob:
        this.expectSecondWord(TokenType.Blob, verify)
        target = 'BLOB'
        break
      case TokenType.Checkpoint:
        this.expectSecondWord(TokenType.Checkpoint, verify)
        target = 'CHECKPOINT'
        break
      default:
        this.error(`Unknown VERIFY target '${tok.value}'`, tok)
        throw new ParseAbort()
    }

    return {
      kind: 'VerifyStatement',
      target,
      value: this.parseScalarValue(),
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseValidateStatement(): ValidateStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const validate = this.expectKeywordWithSpace(TokenType.Validate)
    const tok = this.current()

    let target: ValidateTargetKind
    switch (tok.type) {
      case TokenType.Kql:
        this.expectSecondWord(TokenType.Kql, validate)
        target = 'KQL'
        break
      case TokenType.Kml:
        this.expectSecondWord(TokenType.Kml, validate)
        target = 'KML'
        break
      case TokenType.Capsule:
        this.expectSecondWord(TokenType.Capsule, validate)
        target = 'CAPSULE'
        break
      case TokenType.Schema: {
        const schema = this.expectSecondWord(TokenType.Schema, validate)
        this.expectSecondWord(TokenType.Package, schema)
        target = 'SCHEMA_PACKAGE'
        break
      }
      case TokenType.Import: {
        const importTok = this.expectSecondWord(TokenType.Import, validate)
        this.expectSecondWord(TokenType.Plan, importTok)
        target = 'IMPORT_PLAN'
        break
      }
      default:
        this.error(`Unknown VALIDATE target '${tok.value}'`, tok)
        throw new ParseAbort()
    }

    const value = this.parseScalarValue()
    const options = this.match(TokenType.With)
      ? this.parseObjectLiteral()
      : undefined

    return {
      kind: 'ValidateStatement',
      target,
      value,
      options,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parsePreviewStatement(): PreviewStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const preview = this.expectKeywordWithSpace(TokenType.Preview)
    const tok = this.current()

    if (tok.type === TokenType.Kml) {
      this.expectSecondWord(TokenType.Kml, preview)
      return {
        kind: 'PreviewStatement',
        target: 'KML',
        value: this.parseScalarValue(),
        range: { start, end: this.endPos() },
        leadingComments: leadingComments.length ? leadingComments : undefined
      }
    }
    if (tok.type === TokenType.Import) {
      const importTok = this.expectSecondWord(TokenType.Import, preview)
      this.expectSecondWord(TokenType.Capsule, importTok)
      const value = this.parseScalarValue()
      this.expect(TokenType.Into)
      const into = this.parseScalarValue()
      return {
        kind: 'PreviewStatement',
        target: 'IMPORT_CAPSULE',
        value,
        into,
        range: { start, end: this.endPos() },
        leadingComments: leadingComments.length ? leadingComments : undefined
      }
    }

    this.error(
      `Expected KML or IMPORT CAPSULE after PREVIEW but got '${tok.value}'`,
      tok
    )
    throw new ParseAbort()
  }

  // ────────────────────────────────────────────────────────────────────
  //  META — HISTORY / CHANGES / SNAPSHOT
  // ────────────────────────────────────────────────────────────────────

  private parseHistoryStatement(): HistoryStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const history = this.expectKeywordWithSpace(TokenType.History)
    const tok = this.current()

    let target: 'ELEMENT' | 'SPACE'
    let value: ScalarValue | undefined

    if (tok.type === TokenType.Element) {
      this.expectSecondWord(TokenType.Element, history)
      target = 'ELEMENT'
      value = this.parseScalarValue()
    } else if (tok.type === TokenType.Space) {
      this.expectSecondWord(TokenType.Space, history)
      target = 'SPACE'
    } else {
      this.error(
        `Expected ELEMENT or SPACE after HISTORY but got '${tok.value}'`,
        tok
      )
      throw new ParseAbort()
    }

    let fromSeq: ScalarValue | undefined
    let toSeq: ScalarValue | undefined
    if (this.check(TokenType.From)) {
      const from = this.expect(TokenType.From)
      this.expectSecondWord(TokenType.Seq, from)
      fromSeq = this.parseScalarValue()
    }
    if (this.check(TokenType.To)) {
      const to = this.expect(TokenType.To)
      this.expectSecondWord(TokenType.Seq, to)
      toSeq = this.parseScalarValue()
    }
    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined
    const cursor = this.check(TokenType.Cursor)
      ? this.parseCursorClause()
      : undefined

    return {
      kind: 'HistoryStatement',
      target,
      value,
      fromSeq,
      toSeq,
      limit,
      cursor,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseChangesStatement(): ChangesStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const changes = this.expectKeywordWithSpace(TokenType.Changes)

    let mode: 'SINCE' | 'AFTER_SEQ'
    if (this.check(TokenType.Since)) {
      this.expectSecondWord(TokenType.Since, changes)
      mode = 'SINCE'
    } else if (this.check(TokenType.After)) {
      const after = this.expectSecondWord(TokenType.After, changes)
      this.expectSecondWord(TokenType.Seq, after)
      mode = 'AFTER_SEQ'
    } else {
      this.error(
        `Expected SINCE or AFTER SEQ after CHANGES but got '${this.current().value}'`,
        this.current()
      )
      throw new ParseAbort()
    }

    const value = this.parseScalarValue()
    const limit = this.check(TokenType.Limit) ? this.parseLimitClause() : undefined

    return {
      kind: 'ChangesStatement',
      mode,
      value,
      limit,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  private parseSnapshotStatement(): SnapshotStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    this.expect(TokenType.Snapshot)
    const asOf = this.check(TokenType.As) ? this.parseAsOfClause() : undefined
    return {
      kind: 'SnapshotStatement',
      asOf,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  META — EXPORT CAPSULE
  // ────────────────────────────────────────────────────────────────────

  private parseExportCapsuleStatement(): ExportCapsuleStatement {
    const leadingComments = this.collectLeadingComments()
    const start = this.currentPos()
    const exportTok = this.expectKeywordWithSpace(TokenType.Export)
    this.expectSecondWord(TokenType.Capsule, exportTok)
    const target = this.parseTargetRef()

    this.expectKeywordWithSpace(TokenType.Where)
    // A capsule carries records, not interpretations: BELIEF is excluded.
    this.dialect = 'raw'
    const where = this.parseWhereClause()

    const options = this.match(TokenType.With)
      ? this.parseObjectLiteral()
      : undefined
    const asOf = this.check(TokenType.As) ? this.parseAsOfClause() : undefined

    return {
      kind: 'ExportCapsuleStatement',
      target,
      where,
      options,
      asOf,
      range: { start, end: this.endPos() },
      leadingComments: leadingComments.length ? leadingComments : undefined
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  Expressions
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
        range: { start, end: this.endPos() }
      }
    }
    return left
  }

  private parseAndExpression(): Expression {
    let left = this.parseEqualityExpression()
    while (this.check(TokenType.And)) {
      const start = left.range.start
      this.advance()
      const right = this.parseEqualityExpression()
      left = {
        kind: 'BinaryExpression',
        operator: '&&',
        left,
        right,
        range: { start, end: this.endPos() }
      }
    }
    return left
  }

  private parseEqualityExpression(): Expression {
    let left = this.parseRelationalExpression()
    while (this.check(TokenType.Eq) || this.check(TokenType.NotEq)) {
      const start = left.range.start
      const op = this.advance().type
      const right = this.parseRelationalExpression()
      left = {
        kind: 'BinaryExpression',
        operator: op === TokenType.Eq ? '==' : '!=',
        left,
        right,
        range: { start, end: this.endPos() }
      }
    }
    return left
  }

  /**
   * `relational_expression` takes at most one comparison.
   *
   * `a < b < c` is not chained comparison in KIP, it is a grammar error, and
   * accepting it here would give the parser a meaning the reference grammar
   * does not define.
   */
  private parseRelationalExpression(): Expression {
    const left = this.parseUnaryExpression()
    const tok = this.current()
    let operator: string | undefined
    switch (tok.type) {
      case TokenType.Lt:
        operator = '<'
        break
      case TokenType.Gt:
        operator = '>'
        break
      case TokenType.LtEq:
        operator = '<='
        break
      case TokenType.GtEq:
        operator = '>='
        break
      default:
        return left
    }
    this.advance()
    const right = this.parseUnaryExpression()
    const result: Expression = {
      kind: 'BinaryExpression',
      operator,
      left,
      right,
      range: { start: left.range.start, end: this.endPos() }
    }
    const next = this.current()
    if (
      next.type === TokenType.Lt ||
      next.type === TokenType.Gt ||
      next.type === TokenType.LtEq ||
      next.type === TokenType.GtEq
    ) {
      this.error(
        `Chained comparison '${next.value}' is not allowed; use && between comparisons`,
        next
      )
    }
    return result
  }

  private parseUnaryExpression(): Expression {
    const tok = this.current()
    if (tok.type === TokenType.Bang || tok.type === TokenType.Minus) {
      const start = this.currentPos()
      this.advance()
      const operand = this.parsePrimaryExpression()
      return {
        kind: 'UnaryExpression',
        operator: tok.type === TokenType.Bang ? '!' : '-',
        operand,
        range: { start, end: this.endPos() }
      }
    }
    return this.parsePrimaryExpression()
  }

  private parsePrimaryExpression(): Expression {
    const tok = this.current()

    switch (tok.type) {
      case TokenType.Variable:
        return this.parseFieldAccessOrVariable()
      case TokenType.Parameter:
        return this.parseParameterRef()
      case TokenType.String:
      case TokenType.Number:
      case TokenType.Boolean:
      case TokenType.Null:
        return this.parseLiteral()
      case TokenType.LBracket:
        return this.parseArrayLiteral()
      case TokenType.LBrace:
        return this.parseObjectLiteral()
      case TokenType.LParen: {
        this.advance()
        const inner = this.parseExpression()
        this.expect(TokenType.RParen)
        return inner
      }
      default:
        // `function_call` is an open `identifier "("`, and KIP 2.0 keywords
        // are contextual, so any identifier-like token may name a function.
        if (isIdentifierLike(tok.type) && this.peekPast(1)?.type === TokenType.LParen) {
          return this.parseCallExpression()
        }
        this.error(`Unexpected token '${tok.value}' in expression`, tok)
        this.advance()
        return {
          kind: 'NullLiteral',
          range: { start: this.currentPos(), end: this.endPos() }
        }
    }
  }

  /** `COUNT(DISTINCT ?x)` where the name is an aggregate, else a plain call. */
  private parseCallExpression(): FunctionCallExpr | AggregateExpr {
    const start = this.currentPos()
    const nameTok = this.advance()
    const name = nameTok.value
    this.expect(TokenType.LParen)

    if (isAggregate(name)) {
      const distinct = this.match(TokenType.Distinct)
      const argument = this.parseExpression()
      this.expect(TokenType.RParen)
      return {
        kind: 'AggregateExpr',
        name: name.toUpperCase(),
        distinct,
        argument,
        range: { start, end: this.endPos() }
      }
    }

    const args: Expression[] = []
    if (!this.check(TokenType.RParen)) {
      do {
        args.push(this.parseExpression())
      } while (this.match(TokenType.Comma))
    }
    this.expect(TokenType.RParen)
    return {
      kind: 'FunctionCallExpr',
      name,
      args,
      range: { start, end: this.endPos() }
    }
  }

  /**
   * `field_access = variable, { field_step }`.
   *
   * A dot path carries no whitespace: `?x . name` is three tokens to a
   * conformant engine, not one path, so the gap is checked here.
   */
  private parseFieldAccessOrVariable(): VariableRef | FieldAccess {
    const base = this.parseVariableRef()
    if (!this.isTightFieldStepStart()) return base

    const steps: FieldStep[] = []
    while (this.isTightFieldStepStart()) {
      const start = this.currentPos()
      if (this.check(TokenType.Dot)) {
        this.advance()
        const nameTok = this.current()
        if (!isIdentifierLike(nameTok.type)) {
          this.error(
            `Expected a field name after '.' but got '${nameTok.value}'`,
            nameTok
          )
          break
        }
        this.advance()
        steps.push({
          kind: 'DotStep',
          name: nameTok.value,
          range: { start, end: this.endPos() }
        })
      } else {
        this.advance() // [
        const key = this.parseStringLiteral()
        this.expect(TokenType.RBracket)
        steps.push({
          kind: 'IndexStep',
          key,
          range: { start, end: this.endPos() }
        })
      }
    }

    return {
      kind: 'FieldAccess',
      base,
      steps,
      range: { start: base.range.start, end: this.endPos() }
    }
  }

  /** True when a `.`/`[` follows with no gap, i.e. continues the path. */
  private isTightFieldStepStart(): boolean {
    const tok = this.current()
    if (tok.type !== TokenType.Dot && tok.type !== TokenType.LBracket) {
      return false
    }
    const prev = this.tokens[this.pos - 1]
    if (!prev) return false
    return prev.offset + prev.value.length === tok.offset
  }

  // ────────────────────────────────────────────────────────────────────
  //  Values, objects, arrays
  // ────────────────────────────────────────────────────────────────────

  private parseVariableRef(): VariableRef {
    const tok = this.current()
    if (tok.type !== TokenType.Variable) {
      this.error(`Expected a variable (e.g. ?name) but got '${tok.value}'`, tok)
      return {
        kind: 'VariableRef',
        name: '?unknown',
        range: { start: this.currentPos(), end: this.endPos() }
      }
    }
    const start = this.currentPos()
    this.advance()
    return {
      kind: 'VariableRef',
      name: tok.value,
      range: { start, end: this.endPos() }
    }
  }

  private parseParameterRef(): ParameterRef {
    const tok = this.current()
    const start = this.currentPos()
    this.advance()
    return {
      kind: 'ParameterRef',
      name: tok.value,
      range: { start, end: this.endPos() }
    }
  }

  private parseStringLiteral(): StringLiteral {
    const tok = this.current()
    if (tok.type !== TokenType.String) {
      this.error(`Expected a quoted string but got '${tok.value}'`, tok)
      return {
        kind: 'StringLiteral',
        value: '""',
        parsed: '',
        range: { start: this.currentPos(), end: this.endPos() }
      }
    }
    const start = this.currentPos()
    this.advance()
    return {
      kind: 'StringLiteral',
      value: tok.value,
      parsed: this.unescapeString(tok.value, tok),
      range: { start, end: this.endPos() }
    }
  }

  private parseLiteral(): LiteralNode {
    const tok = this.current()
    const start = this.currentPos()
    switch (tok.type) {
      case TokenType.String:
        return this.parseStringLiteral()
      case TokenType.Number: {
        this.advance()
        const value = Number(tok.value)
        if (!Number.isFinite(value)) {
          this.error(
            `Only finite numbers are valid KIP literals, got '${tok.value}'`,
            tok
          )
        }
        return {
          kind: 'NumberLiteral',
          value,
          raw: tok.value,
          range: { start, end: this.endPos() }
        }
      }
      case TokenType.Boolean:
        this.advance()
        return {
          kind: 'BooleanLiteral',
          value: tok.value === 'true',
          range: { start, end: this.endPos() }
        }
      case TokenType.Null:
        this.advance()
        return { kind: 'NullLiteral', range: { start, end: this.endPos() } }
      default:
        this.error(`Expected a literal but got '${tok.value}'`, tok)
        this.advance()
        return { kind: 'NullLiteral', range: { start, end: this.endPos() } }
    }
  }

  /** `scalar_value` / `meta_value` = `parameter | literal` */
  private parseScalarValue(): ScalarValue {
    const tok = this.current()
    if (tok.type === TokenType.Parameter) {
      return this.parseParameterRef()
    }
    if (
      tok.type === TokenType.String ||
      tok.type === TokenType.Number ||
      tok.type === TokenType.Boolean ||
      tok.type === TokenType.Null
    ) {
      return this.parseLiteral() as ScalarValue
    }
    this.error(
      `Expected a literal or :parameter but got '${tok.value}'`,
      tok
    )
    this.advance()
    return {
      kind: 'NullLiteral',
      range: { start: this.currentPos(), end: this.endPos() }
    }
  }

  /** True when the next token could begin a `meta_value`. */
  private isMetaValueStart(): boolean {
    const t = this.current().type
    return (
      t === TokenType.Parameter ||
      t === TokenType.String ||
      t === TokenType.Number ||
      t === TokenType.Boolean ||
      t === TokenType.Null
    )
  }

  /** `schema_symbol = string_literal | parameter` */
  private parseSchemaSymbol(): SchemaSymbol {
    const tok = this.current()
    if (tok.type === TokenType.Parameter) {
      return this.parseParameterRef()
    }
    if (tok.type === TokenType.String) {
      return this.parseStringLiteral()
    }
    this.error(
      `Expected a schema symbol (quoted name or :parameter) but got '${tok.value}'`,
      tok
    )
    this.advance()
    return {
      kind: 'StringLiteral',
      value: '""',
      parsed: '',
      range: { start: this.currentPos(), end: this.endPos() }
    }
  }

  /** `target_ref = variable | parameter | string_literal` */
  private parseTargetRef(): TargetRef {
    const tok = this.current()
    if (tok.type === TokenType.Variable) return this.parseVariableRef()
    if (tok.type === TokenType.Parameter) return this.parseParameterRef()
    if (tok.type === TokenType.String) return this.parseStringLiteral()
    this.error(
      `Expected a target (?variable, :parameter or quoted id) but got '${tok.value}'`,
      tok
    )
    this.advance()
    return {
      kind: 'StringLiteral',
      value: '""',
      parsed: '',
      range: { start: this.currentPos(), end: this.endPos() }
    }
  }

  private expectHandle(): VariableRef {
    const tok = this.current()
    if (tok.type !== TokenType.Variable) {
      this.error(
        `Expected a local handle (e.g. ?e) but got '${tok.value}'`,
        tok
      )
      return {
        kind: 'VariableRef',
        name: '?unknown',
        range: { start: this.currentPos(), end: this.endPos() }
      }
    }
    return this.parseVariableRef()
  }

  /** `mutation_value` — everything a KML assignment may hold. */
  private parseMutationValue(): Expression {
    const tok = this.current()
    switch (tok.type) {
      case TokenType.Variable:
        return this.parseFieldAccessOrVariable()
      case TokenType.Parameter:
        return this.parseParameterRef()
      case TokenType.LBracket:
        return this.parseArrayLiteral()
      case TokenType.LBrace:
        return this.parseObjectLiteral()
      case TokenType.String:
      case TokenType.Number:
      case TokenType.Boolean:
      case TokenType.Null:
        return this.parseLiteral()
      default:
        if (isIdentifierLike(tok.type) && this.peekPast(1)?.type === TokenType.LParen) {
          return this.parseCallExpression()
        }
        this.error(`Unexpected token '${tok.value}' in assignment value`, tok)
        this.advance()
        return {
          kind: 'NullLiteral',
          range: { start: this.currentPos(), end: this.endPos() }
        }
    }
  }

  /** `assignment_object = "{" [assignment_member {"," assignment_member}] "}"` */
  private parseAssignmentObject(): ObjectLiteral {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const seen = { trailingComma: false }
    const entries = this.parseEntries(seen, () => this.parseMutationValue())
    this.expect(TokenType.RBrace)
    return {
      kind: 'ObjectLiteral',
      entries,
      trailingComma: seen.trailingComma || undefined,
      range: { start, end: this.endPos() }
    }
  }

  /** `object_pattern` — `{...}` in matching position. */
  private parseObjectPattern(): ObjectPattern {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const seen = { trailingComma: false }
    const members = this.parseEntries(seen, () => this.parsePatternValue())
    this.expect(TokenType.RBrace)
    return {
      kind: 'ObjectPattern',
      members,
      trailingComma: seen.trailingComma || undefined,
      range: { start, end: this.endPos() }
    }
  }

  private parsePatternValue(): Expression {
    const tok = this.current()
    switch (tok.type) {
      case TokenType.Variable:
        return this.parseVariableRef()
      case TokenType.Parameter:
        return this.parseParameterRef()
      case TokenType.LBracket:
        return this.parseArrayPattern()
      case TokenType.LBrace:
        return this.parseObjectPattern()
      case TokenType.LParen:
        return this.parsePropositionTuple()
      case TokenType.String:
      case TokenType.Number:
      case TokenType.Boolean:
      case TokenType.Null:
        return this.parseLiteral()
      default:
        this.error(`Unexpected token '${tok.value}' in match pattern`, tok)
        this.advance()
        return {
          kind: 'NullLiteral',
          range: { start: this.currentPos(), end: this.endPos() }
        }
    }
  }

  private parseArrayPattern(): ArrayLiteral {
    return this.parseArrayWith(() => this.parsePatternValue())
  }

  private parseArrayLiteral(): ArrayLiteral {
    return this.parseArrayWith(() => this.parseExpression())
  }

  private parseArrayWith(parseElement: () => Expression): ArrayLiteral {
    const start = this.currentPos()
    this.expect(TokenType.LBracket)
    const elements: Expression[] = []
    let trailingComma = false
    if (!this.check(TokenType.RBracket)) {
      do {
        if (this.check(TokenType.RBracket)) {
          trailingComma = true
          break
        }
        elements.push(parseElement())
      } while (this.match(TokenType.Comma))
    }
    this.expect(TokenType.RBracket)
    return {
      kind: 'ArrayLiteral',
      elements,
      trailingComma: trailingComma || undefined,
      range: { start, end: this.endPos() }
    }
  }

  private parseObjectLiteral(): ObjectLiteral {
    const start = this.currentPos()
    this.expect(TokenType.LBrace)
    const seen = { trailingComma: false }
    const entries = this.parseEntries(seen, () => this.parseExpression())
    this.expect(TokenType.RBrace)
    return {
      kind: 'ObjectLiteral',
      entries,
      trailingComma: seen.trailingComma || undefined,
      range: { start, end: this.endPos() }
    }
  }

  private parseEntries(
    seen: { trailingComma: boolean },
    parseValue: () => Expression
  ): ObjectEntry[] {
    const entries: ObjectEntry[] = []
    if (this.check(TokenType.RBrace)) return entries

    do {
      this.skipComments()
      if (this.check(TokenType.RBrace)) {
        seen.trailingComma = entries.length > 0
        break
      }
      const start = this.currentPos()
      const { key, isQuoted } = this.expectKeyWithQuoting()
      this.expectObjectColon(key)
      const value = parseValue()
      entries.push({
        kind: 'ObjectEntry',
        key,
        isQuoted,
        value,
        range: { start, end: this.endPos() }
      })
    } while (this.match(TokenType.Comma))

    return entries
  }

  // ────────────────────────────────────────────────────────────────────
  //  Token helpers
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

  /**
   * The end of the most recently consumed token — where a node actually ends.
   *
   * `currentPos()` points at the *next* token, so using it as `range.end`
   * stretches every node to the start of whatever follows. An editor folding
   * on that range would hide the first line of the next clause, so the end is
   * measured from the last token the node consumed. Comments are skipped
   * because `advance()` steps over them without them belonging to the node.
   */
  private endPos(): Position {
    let i = this.pos - 1
    while (i >= 0 && this.tokens[i]!.type === TokenType.Comment) i--
    const tok = this.tokens[i]
    if (!tok) return this.currentPos()
    return { line: tok.line, column: tok.column + tok.value.length }
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

  /** The token `i` positions ahead, skipping nothing. */
  private peekPast(i: number): Token | undefined {
    return this.tokens[this.pos + i]
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
   * whitespace, which is what keeps `MUTATE{` from reading as a statement.
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
      this.error(`'${tok.value}' must be followed by whitespace`, tok, 'KIP_1001')
    }
    return this.advance()
  }

  /**
   * Consumes the second word of a multi-word keyword (`SET FIELDS`,
   * `AS OF`, `EXPECT VERSION`, `BELIEF SLOT`, ...).
   *
   * The grammar joins these with whitespace only. A comment between the words
   * is not a smaller gap, it is a different token sequence, and reading
   * `SET//c\nFIELDS` as `SET FIELDS` would accept text the reference grammar
   * rejects.
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

  private expectKeyWithQuoting(): { key: string; isQuoted: boolean } {
    const tok = this.current()
    if (tok.type === TokenType.String) {
      this.advance()
      return { key: this.unescapeString(tok.value, tok), isQuoted: true }
    }
    // `field_name = identifier | string_literal`, and KIP 2.0 keywords are
    // contextual: the Spec's own ASSERT sugar writes `by:`, `mode:`, `at:`
    // and `key:` as object keys.
    if (isIdentifierLike(tok.type)) {
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
   * a single parameter placeholder token (`:active`), so split it back apart.
   */
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

  private static readonly STATEMENT_STARTERS: ReadonlySet<TokenType> = new Set([
    TokenType.Find,
    TokenType.Mutate,
    TokenType.Create,
    TokenType.Upsert,
    TokenType.Ensure,
    TokenType.Assert,
    TokenType.Update,
    TokenType.Retract,
    TokenType.Supersede,
    TokenType.Correct,
    TokenType.Transition,
    TokenType.Set,
    TokenType.Archive,
    TokenType.Tombstone,
    TokenType.Purge,
    TokenType.Merge,
    TokenType.Describe,
    TokenType.List,
    TokenType.Search,
    TokenType.Verify,
    TokenType.Validate,
    TokenType.Preview,
    TokenType.History,
    TokenType.Changes,
    TokenType.Snapshot,
    TokenType.Export,
    TokenType.EOF
  ])

  private recoverToNextStatement(): void {
    while (
      !this.isAtEnd() &&
      !Parser.STATEMENT_STARTERS.has(this.current().type)
    ) {
      this.pos++
    }
  }

  /** Inside MUTATE, recovery stops at the next clause or the closing brace. */
  private recoverToMutationBoundary(): void {
    let depth = 0
    while (!this.isAtEnd()) {
      const type = this.current().type
      if (type === TokenType.LBrace) depth++
      else if (type === TokenType.RBrace) {
        if (depth === 0) return
        depth--
      } else if (depth === 0 && Parser.STATEMENT_STARTERS.has(type)) {
        return
      }
      this.pos++
    }
  }
}

/** Unwinds a sub-parser that cannot produce a node; `parse` recovers. */
class ParseAbort extends Error {
  constructor() {
    super('parse aborted')
    this.name = 'ParseAbort'
  }
}
