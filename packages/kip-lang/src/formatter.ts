import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { Token, TokenType } from './token.js'
import type {
  Program,
  Statement,
  FindStatement,
  UpsertStatement,
  DeleteStatement,
  DescribeStatement,
  SearchStatement,
  ConceptBlock,
  PropositionBlock,
  SetAttributes,
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
  Expression,
  ObjectEntry,
  ArrayLiteral,
  ObjectLiteral,
  UpsertBlock
} from './ast.js'

export interface FormatOptions {
  /** Number of spaces per indentation level (default: 4) */
  indentSize?: number
  /** Sort keys inside SET ATTRIBUTES (default: true) */
  sortAttributes?: boolean
}

export function format(source: string, options?: FormatOptions): string {
  const opts: Required<FormatOptions> = {
    indentSize: options?.indentSize ?? 4,
    sortAttributes: options?.sortAttributes ?? true
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

  formatProgram(program: Program): string {
    this.output = ''

    for (let i = 0; i < program.statements.length; i++) {
      const stmt = program.statements[i]!
      if (i > 0) this.newline()

      // Emit comments that appear before this statement
      this.emitCommentsBefore(stmt.range.start.line)

      this.formatStatement(stmt)
      this.newline()
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
      case 'DeleteStatement':
        return this.formatDelete(stmt)
      case 'DescribeStatement':
        return this.formatDescribe(stmt)
      case 'SearchStatement':
        return this.formatSearch(stmt)
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
    this.writeIndent()
    this.write('{')
    this.write(
      block.matcher.entries
        .map((e) => `${this.keyToString(e)}: ${this.exprToString(e.value, 0)}`)
        .join(', ')
    )
    this.write('}')
    this.newline()

    if (block.setAttributes) {
      this.formatSetAttributes(block.setAttributes)
    }
    if (block.setPropositions) {
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
    this.write(
      `(${this.endpointToString(block.subject)}, ${this.predicateToString(block.predicate)}, ${this.endpointToString(block.object)})`
    )
    this.newline()

    if (block.setAttributes) {
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
    this.writeIndent()
    this.write('SET ATTRIBUTES {')

    const entries = this.opts.sortAttributes
      ? this.sortObjectEntries(sa.entries)
      : sa.entries

    if (entries.length === 0) {
      this.write('}')
      this.newline()
      return
    }

    // Check if all values are simple (single-line)
    const allSimple = entries.every((e) => this.isSimpleValue(e.value))

    if (allSimple && entries.length <= 3) {
      // Inline format for very simple cases
      this.write(' ')
      this.write(
        entries
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
    for (let i = 0; i < entries.length; i++) {
      this.formatObjectEntry(entries[i]!)
      if (i < entries.length - 1) {
        this.write(',')
      }
      this.newline()
    }
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatSetPropositions(sp: SetPropositions): void {
    this.writeIndent()
    this.write('SET PROPOSITIONS {')
    this.newline()
    this.indentLevel++

    for (const item of sp.items) {
      this.formatPropositionItem(item)
    }

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

    const allSimple = wm.entries.every((e) => this.isSimpleValue(e.value))

    if (allSimple && wm.entries.length <= 5) {
      // Inline
      this.newline()
      this.indentLevel++
      for (let i = 0; i < wm.entries.length; i++) {
        this.writeIndent()
        this.write(
          `${this.keyToString(wm.entries[i]!)}: ${this.exprToString(wm.entries[i]!.value, 0)}`
        )
        if (i < wm.entries.length - 1) {
          this.write(',')
        }
        this.newline()
      }
      this.indentLevel--
      this.writeIndent()
      this.write('}')
      this.newline()
      return
    }

    this.newline()
    this.indentLevel++
    for (let i = 0; i < wm.entries.length; i++) {
      this.formatObjectEntry(wm.entries[i]!)
      if (i < wm.entries.length - 1) {
        this.write(',')
      }
      this.newline()
    }
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
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
      this.write(`DELETE CONCEPT ${stmt.target}`)
      if (stmt.detach) this.write(' DETACH')
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
          `DESCRIBE CONCEPT TYPE "${this.escapeString(stmt.typeName ?? '')}"`
        )
        break
      case 'PROPOSITION_TYPES':
        this.write('DESCRIBE PROPOSITION TYPES')
        break
      case 'PROPOSITION_TYPE':
        this.write(
          `DESCRIBE PROPOSITION TYPE "${this.escapeString(stmt.typeName ?? '')}"`
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
    this.write(`SEARCH ${stmt.searchTarget} "${this.escapeString(stmt.term)}"`)
    if (stmt.withType) {
      this.write(` WITH TYPE "${this.escapeString(stmt.withType)}"`)
    }
    if (stmt.limit) {
      this.write(` LIMIT ${this.limitValueToString(stmt.limit)}`)
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

    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatWherePattern(p: WherePattern): void {
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
    this.write(
      `(${this.endpointToString(p.subject)}, ${this.predicateToString(p.predicate)}, ${this.endpointToString(p.object)})`
    )
    this.newline()
  }

  private formatFilterClause(f: FilterClause): void {
    this.writeIndent()
    this.write(`FILTER(${this.exprToString(f.expression, 0)})`)
    this.newline()
  }

  private formatNotClause(n: NotClause): void {
    this.writeIndent()
    this.write('NOT {')
    this.newline()
    this.indentLevel++
    for (const p of n.patterns) {
      this.formatWherePattern(p)
    }
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatOptionalClause(o: OptionalClause): void {
    this.newline()
    this.writeIndent()
    this.write('OPTIONAL {')
    this.newline()
    this.indentLevel++
    for (const p of o.patterns) {
      this.formatWherePattern(p)
    }
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatUnionClause(u: UnionClause): void {
    this.newline()
    this.writeIndent()
    this.write('UNION {')
    this.newline()
    this.indentLevel++
    for (const p of u.patterns) {
      this.formatWherePattern(p)
    }
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatOrderBy(ob: OrderByClause): void {
    this.writeIndent()
    this.write(
      `ORDER BY ${this.exprToString(ob.expression, 0)} ${ob.direction}`
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
        return `{${entries}}`
      }
      case 'PropositionPattern': {
        const s = this.endpointToString(ep.subject)
        const p = this.predicateToString(ep.predicate)
        const o = this.endpointToString(ep.object)
        return `(${s}, ${p}, ${o})`
      }
      default:
        return '?unknown'
    }
  }

  private predicateToString(pred: PredicateExpr): string {
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
    if (lim.value.kind === 'NumberLiteral') return lim.value.raw
    return lim.value.name
  }

  private cursorValueToString(cur: CursorClause): string {
    if (cur.value.kind === 'StringLiteral') return cur.value.value
    return cur.value.name
  }

  private sortObjectEntries(entries: ObjectEntry[]): ObjectEntry[] {
    // Sort: required-looking fields first, then alphabetical
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

  private formatLeadingComments(comments?: string[]): void {
    if (!comments) return
    for (const c of comments) {
      this.writeIndent()
      this.write(c)
      this.newline()
    }
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

/**
 * A simpler comment-preserving formatter that works at the token level.
 * It re-parses the source and reconstructs it line by line, preserving
 * all comments in their relative positions while normalizing indentation.
 */
export function formatPreservingComments(
  source: string,
  options?: FormatOptions
): string {
  const opts: Required<FormatOptions> = {
    indentSize: options?.indentSize ?? 4,
    sortAttributes: options?.sortAttributes ?? true
  }

  const tokens = tokenize(source)
  const lines = source.split('\n')
  const result: string[] = []
  let indent = 0
  const indentStr = ' '.repeat(opts.indentSize)

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim()
    if (trimmed === '') {
      result.push('')
      continue
    }

    // Decrease indent before closing braces/parens
    if (/^\s*[}\])]+/.test(trimmed)) {
      const closers = trimmed.match(/^[}\])]+/)
      if (closers) {
        indent = Math.max(0, indent - closers[0].length)
      }
    }

    result.push(indentStr.repeat(indent) + trimmed)

    // Increase indent after opening braces
    const opens = (trimmed.match(/[{([\[]/g) || []).length
    const closes = (trimmed.match(/[})\]]/g) || []).length
    indent = Math.max(0, indent + opens - closes)
  }

  // Remove trailing blank lines, ensure single trailing newline
  while (result.length > 0 && result[result.length - 1]!.trim() === '') {
    result.pop()
  }
  result.push('')

  return result.join('\n')
}
