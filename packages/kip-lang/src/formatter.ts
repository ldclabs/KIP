import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { diagnose } from './diagnostics.js'
import { Token, TokenType } from './token.js'
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
  ConceptBlock,
  PropositionBlock,
  ExpectVersion,
  SetAttributes,
  SetMetadata,
  SetPropositions,
  PropositionItem,
  WithMetadata,
  WhereClause,
  WherePattern,
  ConceptPattern,
  PropositionPattern,
  PropositionEndpoint,
  PredicateExpr,
  FilterClause,
  NotClause,
  OptionalClause,
  UnionClause,
  OrderByClause,
  LimitClause,
  CursorClause,
  ThresholdClause,
  Expression,
  StringLiteral,
  ParameterRef,
  ObjectEntry,
  ArrayLiteral,
  ObjectLiteral,
  UpsertBlock
} from './ast.js'

export interface FormatOptions {
  /** Number of spaces per indentation level (default: 4) */
  indentSize?: number
  /**
   * Alphabetically sort keys inside `SET ATTRIBUTES` (default: false).
   * Author key order is preserved by default; sorting is skipped for any block
   * that contains comments, since reordering would detach a comment from its key.
   */
  sortAttributes?: boolean
}

export function format(source: string, options?: FormatOptions): string {
  const opts: Required<FormatOptions> = {
    indentSize: options?.indentSize ?? 4,
    sortAttributes: options?.sortAttributes ?? false
  }

  const firstError = diagnose(source).find((d) => d.severity === 'error')
  if (firstError) {
    throw new Error(`Cannot format invalid KIP: ${firstError.message}`)
  }

  const tokens = tokenize(source)
  const { ast } = parse(source)

  const formatter = new Formatter(opts, tokens)
  return formatter.formatProgram(ast)
}

interface CommentInfo {
  line: number
  column: number
  text: string
}

class Formatter {
  private opts: Required<FormatOptions>
  private comments: CommentInfo[]
  private commentIdx: number = 0
  private output: string = ''
  private indentLevel: number = 0

  constructor(opts: Required<FormatOptions>, tokens: Token[]) {
    this.opts = opts
    this.comments = tokens
      .filter((t) => t.type === TokenType.Comment)
      .map((t) => ({ line: t.line, column: t.column, text: t.value }))
  }

  /** Emit all comments whose source line < beforeLine */
  private emitCommentsBefore(beforeLine: number): void {
    while (
      this.commentIdx < this.comments.length &&
      this.comments[this.commentIdx]!.line < beforeLine
    ) {
      this.writeIndent()
      this.write(this.comments[this.commentIdx]!.text)
      this.newline()
      this.commentIdx++
    }
  }

  /** Emit all remaining comments */
  private emitRemainingComments(): void {
    while (this.commentIdx < this.comments.length) {
      this.writeIndent()
      this.write(this.comments[this.commentIdx]!.text)
      this.newline()
      this.commentIdx++
    }
  }

  /**
   * True if an un-emitted comment lies within a node spanning
   * [startLine, endLine]. Used to keep a block multi-line so interior
   * comments can be preserved at their position rather than relocated.
   */
  private hasPendingCommentInRange(
    startLine: number,
    endLine: number
  ): boolean {
    for (let i = this.commentIdx; i < this.comments.length; i++) {
      const line = this.comments[i]!.line
      if (line > endLine) break
      if (line >= startLine) return true
    }
    return false
  }

  formatProgram(program: Program): string {
    this.output = ''

    for (let i = 0; i < program.statements.length; i++) {
      const stmt = program.statements[i]!
      // Separate statements with exactly one blank line.
      if (i > 0) this.newline()

      // Emit comments that appear before this statement
      this.emitCommentsBefore(stmt.range.start.line)

      this.formatStatement(stmt)
    }

    // Trailing comments after last statement
    this.emitRemainingComments()

    return this.output.trimEnd() + '\n'
  }

  // ────────────────────────────────────────────────────────────────────
  //  Statements
  // ────────────────────────────────────────────────────────────────────

  private formatStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case 'FindStatement':
        return this.formatFind(stmt)
      case 'UpsertStatement':
        return this.formatUpsert(stmt)
      case 'UpdateStatement':
        return this.formatUpdate(stmt)
      case 'MergeStatement':
        return this.formatMerge(stmt)
      case 'DeleteStatement':
        return this.formatDelete(stmt)
      case 'DescribeStatement':
        return this.formatDescribe(stmt)
      case 'SearchStatement':
        return this.formatSearch(stmt)
      case 'ExportStatement':
        return this.formatExport(stmt)
    }
  }

  // ── FIND ───────────────────────────────────────────────────────────

  private formatFind(stmt: FindStatement): void {
    this.writeIndent()
    this.write('FIND(')
    if (
      stmt.projections.length <= 2 &&
      this.allSimpleExpressions(stmt.projections)
    ) {
      // Inline
      this.write(
        stmt.projections.map((p) => this.exprToString(p, 0)).join(', ')
      )
    } else {
      this.newline()
      this.indentLevel++
      for (let i = 0; i < stmt.projections.length; i++) {
        this.writeIndent()
        this.write(this.exprToString(stmt.projections[i]!, 0))
        if (i < stmt.projections.length - 1) {
          this.write(',')
        }
        this.newline()
      }
      this.indentLevel--
      this.writeIndent()
    }
    this.write(')')
    this.newline()

    if (stmt.where) {
      this.formatWhere(stmt.where)
    }
    if (stmt.orderBy) {
      this.formatOrderBy(stmt.orderBy)
    }
    if (stmt.limit) {
      this.formatLimit(stmt.limit)
    }
    if (stmt.cursor) {
      this.formatCursor(stmt.cursor)
    }
  }

  // ── UPSERT ─────────────────────────────────────────────────────────

  private formatUpsert(stmt: UpsertStatement): void {
    this.writeIndent()
    this.write('UPSERT {')
    this.newline()
    this.indentLevel++

    for (let i = 0; i < stmt.blocks.length; i++) {
      const block = stmt.blocks[i]!
      if (i > 0) this.newline()
      // Emit comments between blocks
      this.emitCommentsBefore(block.range.start.line)
      this.formatUpsertBlock(block)
    }

    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()

    if (stmt.metadata) {
      this.formatWithMetadata(stmt.metadata)
    }
  }

  private formatUpsertBlock(block: UpsertBlock): void {
    if (block.kind === 'ConceptBlock') {
      this.formatConceptBlock(block)
    } else {
      this.formatPropositionBlockDef(block)
    }
  }

  private formatConceptBlock(block: ConceptBlock): void {
    this.writeIndent()
    this.write(`CONCEPT ${block.handle} {`)
    this.newline()
    this.indentLevel++

    // Matcher: {type: "...", name: "..."}
    this.emitCommentsBefore(block.matcher.range.start.line)
    this.writeIndent()
    this.write('{')
    this.write(
      block.matcher.entries
        .map((e) => `${this.keyToString(e)}: ${this.exprToString(e.value, 0)}`)
        .join(', ')
    )
    this.write('}')
    this.newline()

    if (block.expectVersion) {
      this.emitCommentsBefore(block.expectVersion.range.start.line)
      this.formatExpectVersion(block.expectVersion)
    }
    if (block.setAttributes) {
      this.emitCommentsBefore(block.setAttributes.range.start.line)
      this.formatSetAttributes(block.setAttributes)
    }
    if (block.setPropositions) {
      this.emitCommentsBefore(block.setPropositions.range.start.line)
      this.formatSetPropositions(block.setPropositions)
    }

    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()

    if (block.metadata) {
      this.formatWithMetadata(block.metadata)
    }
  }

  private formatPropositionBlockDef(block: PropositionBlock): void {
    this.writeIndent()
    this.write('PROPOSITION')
    if (block.handle) this.write(` ${block.handle}`)
    this.write(' {')
    this.newline()
    this.indentLevel++

    this.writeIndent()
    this.write(this.propositionBlockPatternToString(block))
    this.newline()

    if (block.expectVersion) {
      this.emitCommentsBefore(block.expectVersion.range.start.line)
      this.formatExpectVersion(block.expectVersion)
    }
    if (block.setAttributes) {
      this.emitCommentsBefore(block.setAttributes.range.start.line)
      this.formatSetAttributes(block.setAttributes)
    }

    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()

    if (block.metadata) {
      this.formatWithMetadata(block.metadata)
    }
  }

  private formatSetAttributes(sa: SetAttributes): void {
    this.formatEntryBlock('SET ATTRIBUTES', sa.entries, sa.range, {
      inlineMax: 3,
      sort: this.opts.sortAttributes
    })
  }

  private formatSetMetadata(sm: SetMetadata): void {
    this.formatEntryBlock('SET METADATA', sm.entries, sm.range, {
      inlineMax: 3,
      sort: false
    })
  }

  /**
   * Render a `HEADER { ... }` key/value block. Collapses to a single line when
   * all values are primitive, there are few of them, and no comment sits inside
   * the block; otherwise emits one entry per line, preserving interior comments
   * at their source position. Sorting is skipped whenever interior comments are
   * present, since reordering would detach comments from their keys.
   */
  private formatEntryBlock(
    header: string,
    entries: ObjectEntry[],
    range: { start: { line: number }; end: { line: number } },
    opts: { inlineMax: number; sort: boolean }
  ): void {
    this.writeIndent()
    this.write(`${header} {`)

    if (entries.length === 0) {
      this.write('}')
      this.newline()
      return
    }

    const hasComments = this.hasPendingCommentInRange(
      range.start.line,
      range.end.line
    )
    const ordered =
      opts.sort && !hasComments ? this.sortObjectEntries(entries) : entries
    const allSimple = ordered.every((e) => this.isSimpleValue(e.value))

    if (allSimple && ordered.length <= opts.inlineMax && !hasComments) {
      this.write(' ')
      this.write(
        ordered
          .map(
            (e) => `${this.keyToString(e)}: ${this.exprToString(e.value, 0)}`
          )
          .join(', ')
      )
      this.write(' }')
      this.newline()
      return
    }

    this.newline()
    this.indentLevel++
    for (let i = 0; i < ordered.length; i++) {
      this.emitCommentsBefore(ordered[i]!.range.start.line)
      this.formatObjectEntry(ordered[i]!)
      if (i < ordered.length - 1) {
        this.write(',')
      }
      this.newline()
    }
    this.emitCommentsBefore(range.end.line)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatExpectVersion(ev: ExpectVersion): void {
    this.writeIndent()
    this.write(`EXPECT VERSION ${this.numberOrParameterValueToString(ev.value)}`)
    this.newline()
  }

  private formatSetPropositions(sp: SetPropositions): void {
    this.writeIndent()
    this.write('SET PROPOSITIONS {')
    this.newline()
    this.indentLevel++

    for (const item of sp.items) {
      this.emitCommentsBefore(item.range.start.line)
      this.formatPropositionItem(item)
    }
    this.emitCommentsBefore(sp.range.end.line)

    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatPropositionItem(item: PropositionItem): void {
    this.writeIndent()
    this.write(
      `("${this.escapeString(item.predicate)}", ${this.endpointToString(item.target)})`
    )
    if (item.metadata) {
      this.write(' ')
      this.write('WITH METADATA { ')
      this.write(
        item.metadata.entries
          .map(
            (e) => `${this.keyToString(e)}: ${this.exprToString(e.value, 0)}`
          )
          .join(', ')
      )
      this.write(' }')
    }
    this.newline()
  }

  private formatWithMetadata(wm: WithMetadata): void {
    this.writeIndent()
    this.write('WITH METADATA {')

    if (wm.entries.length === 0) {
      this.write('}')
      this.newline()
      return
    }

    // Metadata blocks are conventionally one entry per line.
    this.newline()
    this.indentLevel++
    for (let i = 0; i < wm.entries.length; i++) {
      this.emitCommentsBefore(wm.entries[i]!.range.start.line)
      this.formatObjectEntry(wm.entries[i]!)
      if (i < wm.entries.length - 1) {
        this.write(',')
      }
      this.newline()
    }
    this.emitCommentsBefore(wm.range.end.line)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  // ── UPDATE ─────────────────────────────────────────────────────────

  private formatUpdate(stmt: UpdateStatement): void {
    this.writeIndent()
    this.write(`UPDATE ${stmt.target}`)
    this.newline()

    if (stmt.setAttributes) {
      this.formatSetAttributes(stmt.setAttributes)
    }
    if (stmt.setMetadata) {
      this.formatSetMetadata(stmt.setMetadata)
    }

    this.formatWhere(stmt.where)
    if (stmt.limit) {
      this.formatLimit(stmt.limit)
    }
  }

  // ── MERGE ──────────────────────────────────────────────────────────

  private formatMerge(stmt: MergeStatement): void {
    this.writeIndent()
    this.write(`MERGE CONCEPT ${stmt.source} INTO ${stmt.target}`)
    this.newline()
    this.formatWhere(stmt.where)
  }

  // ── DELETE ─────────────────────────────────────────────────────────

  private formatDelete(stmt: DeleteStatement): void {
    this.writeIndent()
    if (stmt.deleteType === 'ATTRIBUTES' || stmt.deleteType === 'METADATA') {
      this.write(`DELETE ${stmt.deleteType} {`)
      if (stmt.keys) {
        this.write(stmt.keys.map((k) => `"${this.escapeString(k)}"`).join(', '))
      }
      this.write(`} FROM ${stmt.target}`)
    } else if (stmt.deleteType === 'PROPOSITIONS') {
      this.write(`DELETE PROPOSITIONS ${stmt.target}`)
    } else {
      this.write(`DELETE CONCEPT ${stmt.target} DETACH`)
    }
    this.newline()

    this.formatWhere(stmt.where)
  }

  // ── DESCRIBE ───────────────────────────────────────────────────────

  private formatDescribe(stmt: DescribeStatement): void {
    this.writeIndent()
    switch (stmt.describeType) {
      case 'PRIMER':
        this.write('DESCRIBE PRIMER')
        break
      case 'DOMAINS':
        this.write('DESCRIBE DOMAINS')
        break
      case 'CONCEPT_TYPES':
        this.write('DESCRIBE CONCEPT TYPES')
        break
      case 'CONCEPT_TYPE':
        this.write(
          `DESCRIBE CONCEPT TYPE ${this.quotedOrParameterValueToString(stmt.typeNameValue, stmt.typeName ?? '')}`
        )
        break
      case 'PROPOSITION_TYPES':
        this.write('DESCRIBE PROPOSITION TYPES')
        break
      case 'PROPOSITION_TYPE':
        this.write(
          `DESCRIBE PROPOSITION TYPE ${this.quotedOrParameterValueToString(stmt.typeNameValue, stmt.typeName ?? '')}`
        )
        break
    }

    if (stmt.limit) {
      this.write(` LIMIT ${this.limitValueToString(stmt.limit)}`)
    }
    if (stmt.cursor) {
      this.write(` CURSOR ${this.cursorValueToString(stmt.cursor)}`)
    }
  }

  // ── SEARCH ─────────────────────────────────────────────────────────

  private formatSearch(stmt: SearchStatement): void {
    this.writeIndent()
    this.write(
      `SEARCH ${stmt.searchTarget} ${this.quotedOrParameterValueToString(stmt.termValue, stmt.term)}`
    )
    if (stmt.withTypeValue || stmt.withType !== undefined) {
      this.write(
        ` WITH TYPE ${this.quotedOrParameterValueToString(stmt.withTypeValue, stmt.withType ?? '')}`
      )
    }
    if (stmt.modeValue || stmt.mode !== undefined) {
      this.write(
        ` MODE ${this.quotedOrParameterValueToString(stmt.modeValue, stmt.mode ?? '')}`
      )
    }
    if (stmt.threshold) {
      this.write(` THRESHOLD ${this.thresholdValueToString(stmt.threshold)}`)
    }
    if (stmt.limit) {
      this.write(` LIMIT ${this.limitValueToString(stmt.limit)}`)
    }
  }

  // ── EXPORT ─────────────────────────────────────────────────────────

  private formatExport(stmt: ExportStatement): void {
    this.writeIndent()
    this.write(`EXPORT ${stmt.target}`)
    this.newline()
    this.formatWhere(stmt.where)
    if (stmt.limit) {
      this.formatLimit(stmt.limit)
    }
  }

  // ── WHERE ──────────────────────────────────────────────────────────

  private formatWhere(where: WhereClause): void {
    this.writeIndent()
    this.write('WHERE {')
    this.newline()
    this.indentLevel++

    for (const p of where.patterns) {
      this.formatWherePattern(p)
    }
    this.emitCommentsBefore(where.range.end.line)

    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatWherePattern(p: WherePattern): void {
    this.emitCommentsBefore(p.range.start.line)
    switch (p.kind) {
      case 'ConceptPattern':
        return this.formatConceptPattern(p)
      case 'PropositionPattern':
        return this.formatPropositionPattern(p)
      case 'FilterClause':
        return this.formatFilterClause(p)
      case 'NotClause':
        return this.formatNotClause(p)
      case 'OptionalClause':
        return this.formatOptionalClause(p)
      case 'UnionClause':
        return this.formatUnionClause(p)
    }
  }

  private formatConceptPattern(p: ConceptPattern): void {
    this.writeIndent()
    if (p.variable) this.write(`${p.variable} `)
    this.write('{')
    this.write(
      p.matcher.entries
        .map((e) => `${this.keyToString(e)}: ${this.exprToString(e.value, 0)}`)
        .join(', ')
    )
    this.write('}')
    this.newline()
  }

  private formatPropositionPattern(p: PropositionPattern): void {
    this.writeIndent()
    if (p.variable) this.write(`${p.variable} `)
    this.write(this.propositionPatternToString(p))
    this.newline()
  }

  private formatFilterClause(f: FilterClause): void {
    this.writeIndent()
    this.write(`FILTER(${this.exprToString(f.expression, 0)})`)
    this.newline()
  }

  private formatNotClause(n: NotClause): void {
    this.formatBlockClause('NOT', n.patterns, n.range.end.line)
  }

  private formatOptionalClause(o: OptionalClause): void {
    this.formatBlockClause('OPTIONAL', o.patterns, o.range.end.line)
  }

  private formatUnionClause(u: UnionClause): void {
    this.formatBlockClause('UNION', u.patterns, u.range.end.line)
  }

  /** Shared rendering for NOT / OPTIONAL / UNION blocks (consistent styling). */
  private formatBlockClause(
    keyword: string,
    patterns: WherePattern[],
    endLine: number
  ): void {
    this.writeIndent()
    this.write(`${keyword} {`)
    this.newline()
    this.indentLevel++
    for (const p of patterns) {
      this.formatWherePattern(p)
    }
    this.emitCommentsBefore(endLine)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatOrderBy(ob: OrderByClause): void {
    this.writeIndent()
    const keys =
      ob.keys && ob.keys.length > 0
        ? ob.keys
        : [{ expression: ob.expression, direction: ob.direction }]
    this.write(
      `ORDER BY ${keys
        .map((key) => `${this.exprToString(key.expression, 0)} ${key.direction}`)
        .join(', ')}`
    )
    this.newline()
  }

  private formatLimit(lim: LimitClause): void {
    this.writeIndent()
    this.write(`LIMIT ${this.limitValueToString(lim)}`)
    this.newline()
  }

  private formatCursor(cur: CursorClause): void {
    this.writeIndent()
    this.write(`CURSOR ${this.cursorValueToString(cur)}`)
    this.newline()
  }

  // ────────────────────────────────────────────────────────────────────
  //  Expression → string (depth-aware for nested indentation)
  // ────────────────────────────────────────────────────────────────────

  private exprToString(expr: Expression, depth: number): string {
    switch (expr.kind) {
      case 'VariableRef':
        return expr.name
      case 'ParameterRef':
        return expr.name
      case 'DotExpression':
        return `${this.exprToString(expr.object, depth)}.${expr.property}`
      case 'StringLiteral':
        return expr.value
      case 'NumberLiteral':
        return expr.raw
      case 'BooleanLiteral':
        return String(expr.value)
      case 'NullLiteral':
        return 'null'
      case 'ArrayLiteral':
        return this.arrayToString(expr, depth)
      case 'ObjectLiteral':
        return this.objectToString(expr, depth)
      case 'BinaryExpression':
        return `${this.exprToString(expr.left, depth)} ${expr.operator} ${this.exprToString(expr.right, depth)}`
      case 'UnaryExpression':
        return `${expr.operator}${this.exprToString(expr.operand, depth)}`
      case 'FunctionCallExpr':
        if (expr.name === 'DISTINCT' && expr.args.length === 1) {
          return `DISTINCT ${this.exprToString(expr.args[0]!, depth)}`
        }
        return `${expr.name}(${expr.args.map((a) => this.exprToString(a, depth)).join(', ')})`
    }
  }

  private arrayToString(arr: ArrayLiteral, depth: number): string {
    if (arr.elements.length === 0) return '[]'
    const inner = arr.elements.map((e) => this.exprToString(e, depth + 1))
    const singleLine = `[${inner.join(', ')}]`
    if (singleLine.length <= 80 && !inner.some((s) => s.includes('\n'))) {
      return singleLine
    }
    const baseIndent = this.indentAt(this.indentLevel + depth)
    const innerIndent = this.indentAt(this.indentLevel + depth + 1)
    return `[\n${inner.map((s) => `${innerIndent}${s}`).join(',\n')}\n${baseIndent}]`
  }

  private objectToString(obj: ObjectLiteral, depth: number): string {
    if (obj.entries.length === 0) return '{}'
    const entries = obj.entries.map(
      (e) => `${this.keyToString(e)}: ${this.exprToString(e.value, depth + 1)}`
    )
    const singleLine = `{${entries.join(', ')}}`
    if (singleLine.length <= 80 && !entries.some((s) => s.includes('\n'))) {
      return singleLine
    }
    const baseIndent = this.indentAt(this.indentLevel + depth)
    const innerIndent = this.indentAt(this.indentLevel + depth + 1)
    return `{\n${entries.map((s) => `${innerIndent}${s}`).join(',\n')}\n${baseIndent}}`
  }

  private formatObjectEntry(entry: ObjectEntry): void {
    this.writeIndent()
    const valStr = this.exprToString(entry.value, 0)
    this.write(`${this.keyToString(entry)}: ${valStr}`)
  }

  // ────────────────────────────────────────────────────────────────────
  //  Helpers
  // ────────────────────────────────────────────────────────────────────

  private keyToString(entry: ObjectEntry): string {
    if (entry.isQuoted) {
      return `"${this.escapeString(entry.key)}"`
    }
    return entry.key
  }

  private endpointToString(ep: PropositionEndpoint): string {
    switch (ep.kind) {
      case 'VariableRef':
        return ep.name
      case 'ConceptPattern': {
        const entries = ep.matcher.entries
          .map(
            (e) => `${this.keyToString(e)}: ${this.exprToString(e.value, 0)}`
          )
          .join(', ')
        const prefix = ep.variable ? `${ep.variable} ` : ''
        return `${prefix}{${entries}}`
      }
      case 'PropositionPattern': {
        const prefix = ep.variable ? `${ep.variable} ` : ''
        return `${prefix}${this.propositionPatternToString(ep)}`
      }
      default:
        return '?unknown'
    }
  }

  private propositionBlockPatternToString(block: PropositionBlock): string {
    if (block.id) {
      return `(id: ${this.idValueToString(block.id)})`
    }
    return `(${this.endpointToString(block.subject!)}, ${this.predicateToString(block.predicate!)}, ${this.endpointToString(block.object!)})`
  }

  private propositionPatternToString(pattern: PropositionPattern): string {
    if (pattern.id) {
      return `(id: ${this.idValueToString(pattern.id)})`
    }
    return `(${this.endpointToString(pattern.subject!)}, ${this.predicateToString(pattern.predicate!)}, ${this.endpointToString(pattern.object!)})`
  }

  private idValueToString(id: PropositionPattern['id']): string {
    if (!id) return '""'
    if (id.kind === 'StringLiteral') return id.value
    return id.name
  }

  private predicateToString(pred: PredicateExpr): string {
    if (pred.kind === 'PredicateVariable') {
      return pred.name
    }
    if (pred.kind === 'PredicateLiteral') {
      let s = `"${this.escapeString(pred.value)}"`
      if (pred.hopRange) {
        if (pred.hopRange.max === undefined) {
          s += `{${pred.hopRange.min},}`
        } else if (pred.hopRange.max === pred.hopRange.min) {
          s += `{${pred.hopRange.min}}`
        } else {
          s += `{${pred.hopRange.min},${pred.hopRange.max}}`
        }
      }
      return s
    }
    // Alternation
    return pred.predicates.map((p) => this.predicateToString(p)).join(' | ')
  }

  private limitValueToString(lim: LimitClause): string {
    return this.numberOrParameterValueToString(lim.value)
  }

  private thresholdValueToString(threshold: ThresholdClause): string {
    return this.numberOrParameterValueToString(threshold.value)
  }

  private numberOrParameterValueToString(
    value: LimitClause['value'] | ThresholdClause['value']
  ): string {
    if (value.kind === 'NumberLiteral') return value.raw
    return value.name
  }

  private cursorValueToString(cur: CursorClause): string {
    if (cur.value.kind === 'StringLiteral') return cur.value.value
    return cur.value.name
  }

  private quotedOrParameterValueToString(
    value: StringLiteral | ParameterRef | undefined,
    fallback: string
  ): string {
    if (value?.kind === 'StringLiteral') return value.value
    if (value?.kind === 'ParameterRef') return value.name
    return fallback.startsWith(':')
      ? fallback
      : `"${this.escapeString(fallback)}"`
  }

  private sortObjectEntries(entries: ObjectEntry[]): ObjectEntry[] {
    // Alphabetical by key (attributes are an unordered map in KIP).
    return [...entries].sort((a, b) => a.key.localeCompare(b.key))
  }

  private isSimpleValue(expr: Expression): boolean {
    return (
      expr.kind === 'StringLiteral' ||
      expr.kind === 'NumberLiteral' ||
      expr.kind === 'BooleanLiteral' ||
      expr.kind === 'NullLiteral' ||
      expr.kind === 'VariableRef' ||
      expr.kind === 'ParameterRef'
    )
  }

  private allSimpleExpressions(exprs: Expression[]): boolean {
    return exprs.every(
      (e) =>
        e.kind === 'VariableRef' ||
        e.kind === 'DotExpression' ||
        e.kind === 'FunctionCallExpr'
    )
  }

  private escapeString(s: string): string {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
  }

  private indentAt(level: number): string {
    return ' '.repeat(level * this.opts.indentSize)
  }

  private indent(): string {
    return ' '.repeat(this.indentLevel * this.opts.indentSize)
  }

  private write(s: string): void {
    this.output += s
  }

  private writeIndent(): void {
    this.output += this.indent()
  }

  private newline(): void {
    this.output += '\n'
  }
}
