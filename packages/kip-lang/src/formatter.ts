import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { diagnose } from './diagnostics.js'
import { Token, TokenType } from './token.js'
import type {
  BaseNode,
  Program,
  Statement,
  MutationClause,
  FindStatement,
  AsOfClause,
  OrderByClause,
  LimitClause,
  CursorClause,
  WhereClause,
  WherePattern,
  PropositionTuple,
  Term,
  RawPredicateExpression,
  PredicateAtom,
  ObjectPattern,
  MutateStatement,
  CreateConceptStatement,
  UpsertConceptStatement,
  EnsurePropositionStatement,
  AssertStatement,
  CreateEvidenceStatement,
  CreateAssertionStatement,
  CreateActivityStatement,
  SetFacetClause,
  SetStructuralClause,
  UnsetStructuralClause,
  UnsetAttributesClause,
  UnsetFacetClause,
  UpdateStatement,
  UpdateAction,
  ExpectVersionClause,
  TransitionStatement,
  SetRetentionStatement,
  PurgeStatement,
  PurgePayloadStatement,
  MergeConceptStatement,
  DescribeStatement,
  ListStatement,
  SearchStatement,
  VerifyStatement,
  ValidateStatement,
  PreviewStatement,
  HistoryStatement,
  ChangesStatement,
  ExportCapsuleStatement,
  Expression,
  ScalarValue,
  SchemaSymbol,
  TargetRef,
  ObjectEntry,
  ObjectLiteral
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
  private hasPendingCommentInRange(startLine: number, endLine: number): boolean {
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
      this.emitCommentsBefore(stmt.range.start.line)
      this.formatStatement(stmt)
    }

    this.emitRemainingComments()
    return this.output.trimEnd() + '\n'
  }

  // ────────────────────────────────────────────────────────────────────
  //  Statement dispatch
  // ────────────────────────────────────────────────────────────────────

  private formatStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case 'FindStatement':
        this.formatFind(stmt)
        break
      case 'MutateStatement':
        this.formatMutate(stmt)
        break
      case 'DescribeStatement':
        this.formatDescribe(stmt)
        break
      case 'ListStatement':
        this.formatList(stmt)
        break
      case 'SearchStatement':
        this.formatSearch(stmt)
        break
      case 'VerifyStatement':
        this.formatVerify(stmt)
        break
      case 'ValidateStatement':
        this.formatValidate(stmt)
        break
      case 'PreviewStatement':
        this.formatPreview(stmt)
        break
      case 'HistoryStatement':
        this.formatHistory(stmt)
        break
      case 'ChangesStatement':
        this.formatChanges(stmt)
        break
      case 'ExportCapsuleStatement':
        this.formatExport(stmt)
        break
      default:
        this.formatMutationClause(stmt)
    }
  }

  private formatMutationClause(stmt: MutationClause): void {
    switch (stmt.kind) {
      case 'CreateConceptStatement':
        this.formatCreateConcept(stmt)
        break
      case 'UpsertConceptStatement':
        this.formatUpsertConcept(stmt)
        break
      case 'EnsurePropositionStatement':
        this.formatEnsureProposition(stmt)
        break
      case 'AssertStatement':
        this.formatAssert(stmt)
        break
      case 'CreateEvidenceStatement':
        this.formatRecordCreate('EVIDENCE', stmt)
        break
      case 'CreateAssertionStatement':
        this.formatRecordCreate('ASSERTION', stmt)
        break
      case 'CreateActivityStatement':
        this.formatRecordCreate('ACTIVITY', stmt)
        break
      case 'UpdateStatement':
        this.formatUpdate(stmt)
        break
      case 'TransitionStatement':
        this.formatTransition(stmt)
        break
      case 'SetRetentionStatement':
        this.formatSetRetention(stmt)
        break
      case 'PurgeStatement':
        this.formatPurge(stmt)
        break
      case 'PurgePayloadStatement':
        this.formatPurgePayload(stmt)
        break
      case 'MergeConceptStatement':
        this.formatMerge(stmt)
        break
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KQL
  // ────────────────────────────────────────────────────────────────────

  private formatFind(stmt: FindStatement): void {
    this.writeIndent()
    this.write('FIND(')
    this.write(stmt.projections.map((p) => this.expr(p)).join(', '))
    this.write(')')
    this.newline()

    this.formatWhere(stmt.where, 'WHERE')

    if (stmt.asOf) {
      this.writeIndent()
      this.write(this.asOfToString(stmt.asOf))
      this.newline()
    }
    if (stmt.forTime) {
      this.writeIndent()
      this.write(`FOR TIME ${this.scalar(stmt.forTime.value)}`)
      this.newline()
    }
    if (stmt.epistemic) {
      this.writeIndent()
      this.write('WITH EPISTEMIC ')
      this.formatObjectBlock(stmt.epistemic.options, false)
      this.newline()
    }
    if (stmt.orderBy) this.formatOrderBy(stmt.orderBy)
    if (stmt.limit) this.formatLimit(stmt.limit)
    if (stmt.cursor) this.formatCursor(stmt.cursor)
  }

  private formatOrderBy(clause: OrderByClause): void {
    this.writeIndent()
    this.write('ORDER BY ')
    this.write(
      clause.items
        .map((item) => {
          const expr = this.expr(item.expression)
          return item.direction ? `${expr} ${item.direction}` : expr
        })
        .join(', ')
    )
    this.newline()
  }

  private formatLimit(clause: LimitClause): void {
    this.writeIndent()
    this.write(`LIMIT ${this.scalar(clause.value)}`)
    this.newline()
  }

  private formatCursor(clause: CursorClause): void {
    this.writeIndent()
    this.write(`CURSOR ${this.scalar(clause.value)}`)
    this.newline()
  }

  private asOfToString(clause: AsOfClause): string {
    return `AS OF SEQ ${this.scalar(clause.value)}`
  }

  private expectVersionToString(clause: ExpectVersionClause): string {
    let text = `EXPECT VERSION ${this.scalar(clause.value)}`
    if (clause.plane) {
      text +=
        clause.plane.kind === 'FACET'
          ? ` OF FACET ${this.symbol(clause.plane.facet)}`
          : ` OF ${clause.plane.kind}`
    }
    return text
  }

  /** Trailing guards, one per line at the statement's own indentation. */
  private formatExpectVersions(clauses: ExpectVersionClause[]): void {
    for (const clause of clauses) {
      this.emitCommentsBefore(clause.range.start.line)
      this.writeIndent()
      this.write(this.expectVersionToString(clause))
      this.newline()
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  WHERE
  // ────────────────────────────────────────────────────────────────────

  private formatWhere(clause: WhereClause, keyword: string): void {
    this.writeIndent()
    this.write(`${keyword} {`)
    this.newline()
    this.indentLevel++
    for (const pattern of clause.patterns) {
      this.emitCommentsBefore(pattern.range.start.line)
      this.formatWherePattern(pattern)
    }
    this.emitCommentsBefore(clause.range.end.line)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatNestedBlock(
    keyword: string,
    patterns: WherePattern[],
    endLine: number
  ): void {
    this.writeIndent()
    this.write(`${keyword} {`)
    this.newline()
    this.indentLevel++
    for (const pattern of patterns) {
      this.emitCommentsBefore(pattern.range.start.line)
      this.formatWherePattern(pattern)
    }
    this.emitCommentsBefore(endLine)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatWherePattern(pattern: WherePattern): void {
    switch (pattern.kind) {
      case 'ConceptPattern':
        this.writeIndent()
        this.write(pattern.variable.name)
        if (pattern.explicit) this.write(' CONCEPT')
        this.write(' ')
        this.write(this.objectPatternToString(pattern.matcher))
        this.newline()
        break

      case 'PropositionPattern':
        this.writeIndent()
        if (pattern.variable) this.write(`${pattern.variable.name} `)
        if (pattern.explicit) this.write('PROPOSITION ')
        this.write(this.tupleToString(pattern.tuple))
        this.newline()
        break

      case 'AssertionPattern':
      case 'EvidencePattern':
      case 'ActivityPattern': {
        const keyword = {
          AssertionPattern: 'ASSERTION',
          EvidencePattern: 'EVIDENCE',
          ActivityPattern: 'ACTIVITY'
        }[pattern.kind]
        this.writeIndent()
        this.write(`${pattern.variable.name} ${keyword} `)
        this.write(this.objectPatternToString(pattern.matcher))
        this.newline()
        break
      }

      case 'StructuralPattern':
        this.writeIndent()
        if (pattern.variable) this.write(`${pattern.variable.name} `)
        this.write(
          `STRUCTURAL (${this.term(pattern.subject)}, ${this.symbol(pattern.field)}, ${this.term(pattern.object)})`
        )
        this.newline()
        break

      case 'BeliefPattern':
        this.writeIndent()
        this.write(`${pattern.variable.name} BELIEF (`)
        if (pattern.proposition) {
          this.write(pattern.proposition.name)
        } else if (pattern.propositionId) {
          this.write(`id: ${this.scalar(pattern.propositionId)}`)
        } else {
          this.write(
            `${this.term(pattern.subject!)}, ${this.predAtom(pattern.predicate!)}, ${this.term(pattern.object!)}`
          )
        }
        this.write(')')
        this.newline()
        break

      case 'BeliefSlotPattern':
        this.writeIndent()
        this.write(
          `${pattern.variable.name} BELIEF SLOT (${this.term(pattern.subject)}, ${this.predAtom(pattern.predicate)})`
        )
        this.newline()
        break

      case 'FilterClause':
        this.writeIndent()
        this.write(`FILTER(${this.expr(pattern.expression)})`)
        this.newline()
        break

      case 'NotClause':
        this.formatNestedBlock('NOT', pattern.patterns, pattern.range.end.line)
        break

      case 'OptionalClause':
        this.formatNestedBlock(
          'OPTIONAL',
          pattern.patterns,
          pattern.range.end.line
        )
        break

      case 'UnionClause':
        this.formatNestedBlock('UNION', pattern.patterns, pattern.range.end.line)
        break
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML
  // ────────────────────────────────────────────────────────────────────

  private formatMutate(stmt: MutateStatement): void {
    this.writeIndent()
    this.write('MUTATE {')
    this.newline()
    this.indentLevel++
    for (let i = 0; i < stmt.clauses.length; i++) {
      const clause = stmt.clauses[i]!
      if (i > 0) this.newline()
      this.emitCommentsBefore(clause.range.start.line)
      this.formatMutationClause(clause)
    }
    this.emitCommentsBefore(stmt.range.end.line)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  /**
   * A body clause together with the printer for it. Bodies (CREATE / UPSERT
   * CONCEPT, CREATE EVIDENCE|ASSERTION|ACTIVITY) hold their clauses in typed
   * slots, so the source order has to be recovered from the ranges before
   * printing — a comment written above a clause must come out above that
   * same clause, and the comment cursor only moves forward.
   */
  private formatBody(
    header: string,
    endLine: number,
    clauses: { node: BaseNode; print: () => void }[]
  ): void {
    this.writeIndent()
    this.write(`${header} {`)
    this.newline()
    this.indentLevel++

    const ordered = [...clauses].sort(
      (a, b) =>
        a.node.range.start.line - b.node.range.start.line ||
        a.node.range.start.column - b.node.range.start.column
    )
    for (const clause of ordered) {
      this.emitCommentsBefore(clause.node.range.start.line)
      clause.print()
    }
    // Comments after the last clause still belong inside the braces.
    this.emitCommentsBefore(endLine)

    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatCreateConcept(stmt: CreateConceptStatement): void {
    const clauses: { node: BaseNode; print: () => void }[] = []
    if (stmt.type) {
      const node = stmt.type
      clauses.push({
        node,
        print: () => {
          this.writeIndent()
          this.write(`TYPE ${this.symbol(node.value)}`)
          this.newline()
        }
      })
    }
    if (stmt.clientKey) {
      const node = stmt.clientKey
      clauses.push({
        node,
        print: () => {
          this.writeIndent()
          this.write(`CLIENT KEY ${this.scalar(node.value)}`)
          this.newline()
        }
      })
    }
    if (stmt.name) {
      const node = stmt.name
      clauses.push({
        node,
        print: () => {
          this.writeIndent()
          this.write(`NAME ${this.scalar(node.value)}`)
          this.newline()
        }
      })
    }
    if (stmt.setFields) {
      const node = stmt.setFields
      clauses.push({
        node,
        print: () => this.formatAssignmentClause('SET FIELDS', node.assignments, false)
      })
    }
    if (stmt.setAttributes) {
      const node = stmt.setAttributes
      clauses.push({
        node,
        print: () =>
          this.formatAssignmentClause(
            'SET ATTRIBUTES',
            node.assignments,
            this.opts.sortAttributes
          )
      })
    }
    for (const facet of stmt.setFacets) {
      clauses.push({ node: facet, print: () => this.formatFacet(facet) })
    }
    if (stmt.setStructural) {
      const node = stmt.setStructural
      clauses.push({ node, print: () => this.formatStructural(node) })
    }
    this.formatBody(
      `CREATE CONCEPT ${stmt.handle.name}`,
      stmt.range.end.line,
      clauses
    )
  }

  private formatUpsertConcept(stmt: UpsertConceptStatement): void {
    const clauses: { node: BaseNode; print: () => void }[] = []
    if (stmt.match) {
      const node = stmt.match
      clauses.push({
        node,
        print: () => {
          this.writeIndent()
          this.write('MATCH ')
          this.write(this.objectPatternToString(node.pattern))
          this.newline()
        }
      })
    }
    if (stmt.setFields) {
      const node = stmt.setFields
      clauses.push({
        node,
        print: () => this.formatAssignmentClause('SET FIELDS', node.assignments, false)
      })
    }
    if (stmt.setAttributes) {
      const node = stmt.setAttributes
      clauses.push({
        node,
        print: () =>
          this.formatAssignmentClause(
            'SET ATTRIBUTES',
            node.assignments,
            this.opts.sortAttributes
          )
      })
    }
    for (const facet of stmt.setFacets) {
      clauses.push({ node: facet, print: () => this.formatFacet(facet) })
    }
    if (stmt.unsetAttributes) {
      const node = stmt.unsetAttributes
      clauses.push({ node, print: () => this.formatUnsetAttributes(node) })
    }
    for (const facet of stmt.unsetFacets) {
      clauses.push({ node: facet, print: () => this.formatUnsetFacet(facet) })
    }
    if (stmt.setStructural) {
      const node = stmt.setStructural
      clauses.push({ node, print: () => this.formatStructural(node) })
    }
    if (stmt.unsetStructural) {
      const node = stmt.unsetStructural
      clauses.push({ node, print: () => this.formatUnsetStructural(node) })
    }
    this.formatBody(
      `UPSERT CONCEPT ${stmt.handle.name}`,
      stmt.range.end.line,
      clauses
    )
    this.formatExpectVersions(stmt.expectVersions)
  }

  private formatRecordCreate(
    keyword: string,
    stmt:
      | CreateEvidenceStatement
      | CreateAssertionStatement
      | CreateActivityStatement
  ): void {
    const clauses: { node: BaseNode; print: () => void }[] = []
    if (stmt.clientKey) {
      const node = stmt.clientKey
      clauses.push({
        node,
        print: () => {
          this.writeIndent()
          this.write(`CLIENT KEY ${this.scalar(node.value)}`)
          this.newline()
        }
      })
    }
    if (stmt.setFields) {
      const node = stmt.setFields
      clauses.push({
        node,
        print: () => this.formatAssignmentClause('SET FIELDS', node.assignments, false)
      })
    }
    for (const facet of stmt.setFacets) {
      clauses.push({ node: facet, print: () => this.formatFacet(facet) })
    }
    if (stmt.setStructural) {
      const node = stmt.setStructural
      clauses.push({ node, print: () => this.formatStructural(node) })
    }
    this.formatBody(
      `CREATE ${keyword} ${stmt.handle.name}`,
      stmt.range.end.line,
      clauses
    )
  }

  private formatEnsureProposition(stmt: EnsurePropositionStatement): void {
    this.writeIndent()
    this.write('ENSURE PROPOSITION ')
    if (stmt.handle) this.write(`${stmt.handle.name} `)
    this.write(this.tupleToString(stmt.tuple))
    for (const clause of stmt.expectVersions) {
      this.write(` ${this.expectVersionToString(clause)}`)
    }
    this.newline()
  }

  private formatAssert(stmt: AssertStatement): void {
    this.writeIndent()
    this.write('ASSERT ')
    if (stmt.handle) this.write(`${stmt.handle.name} `)
    this.write(this.tupleToString(stmt.tuple))
    this.write(' ')
    this.formatObjectBlock(stmt.assignments, false)
    if (stmt.superseding) {
      this.newline()
      this.indentLevel++
      this.writeIndent()
      this.write(`SUPERSEDING ${this.targetRef(stmt.superseding)}`)
      this.indentLevel--
    }
    this.newline()
  }

  private formatUpdate(stmt: UpdateStatement): void {
    this.writeIndent()
    this.write(`UPDATE ${this.targetRef(stmt.target)}`)
    this.newline()

    for (const action of stmt.actions) {
      this.emitCommentsBefore(action.range.start.line)
      this.formatUpdateAction(action)
    }
    if (stmt.where) {
      this.emitCommentsBefore(stmt.where.range.start.line)
      this.formatWhere(stmt.where, 'WHERE')
    }
    if (stmt.limit) {
      this.emitCommentsBefore(stmt.limit.range.start.line)
      this.formatLimit(stmt.limit)
    }
    this.formatExpectVersions(stmt.expectVersions)
  }

  private formatUpdateAction(action: UpdateAction): void {
    switch (action.kind) {
      case 'SetFieldsClause':
        this.formatAssignmentClause('SET FIELDS', action.assignments, false)
        break
      case 'SetAttributesClause':
        this.formatAssignmentClause(
          'SET ATTRIBUTES',
          action.assignments,
          this.opts.sortAttributes
        )
        break
      case 'SetFacetClause':
        this.formatFacet(action)
        break
      case 'UnsetAttributesClause':
        this.formatUnsetAttributes(action)
        break
      case 'UnsetFacetClause':
        this.formatUnsetFacet(action)
        break
      case 'SetStructuralClause':
        this.formatStructural(action)
        break
      case 'UnsetStructuralClause':
        this.formatUnsetStructural(action)
        break
    }
  }

  private formatTransition(stmt: TransitionStatement): void {
    this.writeIndent()
    this.write(`TRANSITION ${this.targetRef(stmt.target)} TO ${this.scalar(stmt.to)}`)
    if (stmt.by) this.write(` BY ${this.targetRef(stmt.by)}`)
    const tail = stmt.finalize.length > 0 || stmt.where || stmt.limit || stmt.expectVersions.length > 0
    this.newline()
    if (!tail) return
    if (stmt.finalize.length > 0) {
      this.indentLevel++
      for (const clause of stmt.finalize) {
        this.emitCommentsBefore(clause.range.start.line)
        if (clause.kind === 'SetFieldsClause') {
          this.formatAssignmentClause('SET FIELDS', clause.assignments, false)
        } else {
          this.formatStructural(clause)
        }
      }
      this.indentLevel--
    }
    if (stmt.where) this.formatWhere(stmt.where, 'WHERE')
    if (stmt.limit) this.formatLimit(stmt.limit)
    this.formatExpectVersions(stmt.expectVersions)
  }

  private formatSetRetention(stmt: SetRetentionStatement): void {
    this.writeIndent()
    this.write(`SET RETENTION ${this.targetRef(stmt.target)} `)
    this.formatObjectBlock(stmt.assignments, false)
    this.newline()
    if (stmt.where) this.formatWhere(stmt.where, 'WHERE')
    if (stmt.limit) this.formatLimit(stmt.limit)
    this.formatExpectVersions(stmt.expectVersions)
  }

  private formatPurge(stmt: PurgeStatement): void {
    this.writeIndent()
    this.write(`PURGE ${this.targetRef(stmt.target)}`)
    this.newline()
    if (stmt.where) this.formatWhere(stmt.where, 'WHERE')
    if (stmt.limit) this.formatLimit(stmt.limit)
    this.formatExpectVersions(stmt.expectVersions)
    this.indentLevel++
    if (stmt.referencePolicy) {
      this.writeIndent()
      this.write(`REFERENCE POLICY ${this.scalar(stmt.referencePolicy)}`)
      this.newline()
    }
    this.writeIndent()
    this.write(`CONFIRM ${stmt.confirm.value}`)
    this.newline()
    this.indentLevel--
  }

  private formatPurgePayload(stmt: PurgePayloadStatement): void {
    this.writeIndent()
    this.write(`PURGE PAYLOAD ${this.targetRef(stmt.target)}`)
    this.newline()
    if (stmt.where) this.formatWhere(stmt.where, 'WHERE')
    if (stmt.limit) this.formatLimit(stmt.limit)
    this.formatExpectVersions(stmt.expectVersions)
    this.indentLevel++
    this.writeIndent()
    this.write(`CONFIRM ${stmt.confirm.value}`)
    this.newline()
    this.indentLevel--
  }

  private formatMerge(stmt: MergeConceptStatement): void {
    this.writeIndent()
    this.write(
      `MERGE CONCEPT ${this.targetRef(stmt.source)} INTO ${this.targetRef(stmt.into)}`
    )
    this.newline()
    if (stmt.where) this.formatWhere(stmt.where, 'WHERE')
    this.formatExpectVersions(stmt.expectVersions)
  }

  // ────────────────────────────────────────────────────────────────────
  //  KML clause bodies
  // ────────────────────────────────────────────────────────────────────

  private formatAssignmentClause(
    keyword: string,
    assignments: ObjectLiteral,
    sort: boolean
  ): void {
    this.writeIndent()
    this.write(`${keyword} `)
    this.formatObjectBlock(assignments, sort)
    this.newline()
  }

  private formatFacet(clause: SetFacetClause): void {
    this.writeIndent()
    this.write(`SET FACET ${this.symbol(clause.facet)} `)
    this.formatObjectBlock(clause.assignments, false)
    this.newline()
  }

  private formatUnsetAttributes(clause: UnsetAttributesClause): void {
    this.writeIndent()
    this.write(
      `UNSET ATTRIBUTES { ${clause.fields.map((f) => this.fieldName(f.name, f.isQuoted)).join(', ')} }`
    )
    this.newline()
  }

  private formatUnsetFacet(clause: UnsetFacetClause): void {
    this.writeIndent()
    this.write(
      `UNSET FACET ${this.symbol(clause.facet)} { ${clause.fields.map((f) => this.fieldName(f.name, f.isQuoted)).join(', ')} }`
    )
    this.newline()
  }

  private formatStructural(clause: SetStructuralClause): void {
    this.writeIndent()
    this.write('SET STRUCTURAL {')
    this.newline()
    this.indentLevel++
    for (const assignment of clause.assignments) {
      this.emitCommentsBefore(assignment.range.start.line)
      this.writeIndent()
      this.write(
        `(${this.symbol(assignment.field)}, ${this.expr(assignment.value)})`
      )
      if (assignment.options) {
        this.write(` ${this.objectLiteralToString(assignment.options)}`)
      }
      this.newline()
    }
    this.emitCommentsBefore(clause.range.end.line)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  private formatUnsetStructural(clause: UnsetStructuralClause): void {
    this.writeIndent()
    this.write('UNSET STRUCTURAL {')
    this.newline()
    this.indentLevel++
    for (const removal of clause.removals) {
      this.emitCommentsBefore(removal.range.start.line)
      this.writeIndent()
      this.write(`(${this.symbol(removal.field)}, ${this.expr(removal.value)})`)
      this.newline()
    }
    this.emitCommentsBefore(clause.range.end.line)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
    this.newline()
  }

  // ────────────────────────────────────────────────────────────────────
  //  META
  // ────────────────────────────────────────────────────────────────────

  private formatDescribe(stmt: DescribeStatement): void {
    this.writeIndent()
    const words: Record<DescribeStatement['target'], string> = {
      PRIMER: 'PRIMER',
      PROTOCOL: 'PROTOCOL',
      CAPABILITIES: 'CAPABILITIES',
      SPACE: 'SPACE',
      SCHEMA_ENVIRONMENT: 'SCHEMA ENVIRONMENT',
      PACKAGE: 'PACKAGE',
      TYPE: 'TYPE',
      PREDICATE: 'PREDICATE',
      FACET: 'FACET',
      STRUCTURAL_FIELD: 'STRUCTURAL FIELD',
      COMPATIBILITY: 'COMPATIBILITY',
      ERROR: 'ERROR',
      TRANSACTION: 'TRANSACTION',
      TRANSACTION_BY_IDEMPOTENCY_KEY: 'TRANSACTION BY IDEMPOTENCY KEY',
      SNAPSHOT: 'SNAPSHOT',
      CAPSULE: 'CAPSULE',
      EPISTEMIC_POLICY: 'EPISTEMIC POLICY',
      TRUST: 'TRUST',
      ACCESS: 'ACCESS'
    }
    this.write(`DESCRIBE ${words[stmt.target]}`)

    if (stmt.target === 'COMPATIBILITY' && stmt.from && stmt.to) {
      this.write(` FROM ${this.scalar(stmt.from)} TO ${this.scalar(stmt.to)}`)
    } else if (stmt.value) {
      this.write(` ${this.scalar(stmt.value)}`)
    }
    if (stmt.mode) this.write(` MODE ${this.scalar(stmt.mode)}`)
    if (stmt.asOf) this.write(` ${this.asOfToString(stmt.asOf)}`)
    if (stmt.atTime) this.write(` AT TIME ${this.scalar(stmt.atTime)}`)
    if (stmt.with) this.write(` WITH ${this.objectLiteralToString(stmt.with)}`)
    this.newline()
  }

  private formatList(stmt: ListStatement): void {
    this.writeIndent()
    const words: Record<ListStatement['target'], string> = {
      SPACES: 'SPACES',
      SCHEMA_PACKAGES: 'SCHEMA PACKAGES',
      TYPES: 'TYPES',
      PREDICATES: 'PREDICATES',
      FACETS: 'FACETS',
      STRUCTURAL_FIELDS: 'STRUCTURAL FIELDS',
      EPISTEMIC_POLICIES: 'EPISTEMIC POLICIES',
      DEPENDENTS: 'DEPENDENTS'
    }
    this.write(`LIST ${words[stmt.target]}`)
    if (stmt.element) this.write(` ${this.scalar(stmt.element)}`)
    if (stmt.depth) this.write(` DEPTH ${this.scalar(stmt.depth)}`)
    if (stmt.status) this.write(` STATUS ${this.scalar(stmt.status)}`)
    if (stmt.limit) this.write(` LIMIT ${this.scalar(stmt.limit.value)}`)
    if (stmt.cursor) this.write(` CURSOR ${this.scalar(stmt.cursor.value)}`)
    this.newline()
  }

  private formatSearch(stmt: SearchStatement): void {
    this.writeIndent()
    this.write(`SEARCH ${stmt.searchKind} ${this.scalar(stmt.term)}`)
    if (stmt.withType) this.write(` WITH TYPE ${this.scalar(stmt.withType)}`)
    if (stmt.withPredicate) {
      this.write(` WITH PREDICATE ${this.scalar(stmt.withPredicate)}`)
    }
    if (stmt.mode) this.write(` MODE ${this.scalar(stmt.mode)}`)
    if (stmt.threshold) this.write(` THRESHOLD ${this.scalar(stmt.threshold)}`)
    if (stmt.asOfSeq) this.write(` AS OF SEQ ${this.scalar(stmt.asOfSeq)}`)
    if (stmt.limit) this.write(` LIMIT ${this.scalar(stmt.limit.value)}`)
    if (stmt.cursor) this.write(` CURSOR ${this.scalar(stmt.cursor.value)}`)
    this.newline()
  }

  private formatVerify(stmt: VerifyStatement): void {
    const words: Record<VerifyStatement['target'], string> = {
      CAPSULE: 'CAPSULE',
      SCHEMA_PACKAGE: 'SCHEMA PACKAGE',
      RECEIPT: 'RECEIPT'
    }
    this.writeIndent()
    this.write(`VERIFY ${words[stmt.target]} ${this.scalar(stmt.value)}`)
    this.newline()
  }

  private formatValidate(stmt: ValidateStatement): void {
    const words: Record<ValidateStatement['target'], string> = {
      KQL: 'KQL',
      KML: 'KML',
      CAPSULE: 'CAPSULE',
      SCHEMA_PACKAGE: 'SCHEMA PACKAGE',
      IMPORT_PLAN: 'IMPORT PLAN'
    }
    this.writeIndent()
    this.write(`VALIDATE ${words[stmt.target]} ${this.scalar(stmt.value)}`)
    if (stmt.options) {
      this.write(` WITH ${this.objectLiteralToString(stmt.options)}`)
    }
    this.newline()
  }

  private formatPreview(stmt: PreviewStatement): void {
    this.writeIndent()
    if (stmt.target === 'KML') {
      this.write(`PREVIEW KML ${this.scalar(stmt.value)}`)
    } else {
      this.write(
        `PREVIEW IMPORT CAPSULE ${this.scalar(stmt.value)} INTO ${this.scalar(stmt.into!)}`
      )
    }
    this.newline()
  }

  private formatHistory(stmt: HistoryStatement): void {
    this.writeIndent()
    this.write(`HISTORY ${stmt.target}`)
    if (stmt.value) this.write(` ${this.scalar(stmt.value)}`)
    if (stmt.fromSeq) this.write(` FROM SEQ ${this.scalar(stmt.fromSeq)}`)
    if (stmt.toSeq) this.write(` TO SEQ ${this.scalar(stmt.toSeq)}`)
    if (stmt.limit) this.write(` LIMIT ${this.scalar(stmt.limit.value)}`)
    if (stmt.cursor) this.write(` CURSOR ${this.scalar(stmt.cursor.value)}`)
    this.newline()
  }

  private formatChanges(stmt: ChangesStatement): void {
    this.writeIndent()
    const keyword = stmt.mode === 'SINCE' ? 'SINCE' : 'AFTER SEQ'
    this.write(`CHANGES ${keyword} ${this.scalar(stmt.value)}`)
    if (stmt.limit) this.write(` LIMIT ${this.scalar(stmt.limit.value)}`)
    this.newline()
  }

  private formatExport(stmt: ExportCapsuleStatement): void {
    this.writeIndent()
    this.write(`EXPORT CAPSULE ${this.targetRef(stmt.target)}`)
    this.newline()
    this.formatWhere(stmt.where, 'WHERE')
    if (stmt.options) {
      this.writeIndent()
      this.write(`WITH ${this.objectLiteralToString(stmt.options)}`)
      this.newline()
    }
    if (stmt.asOf) {
      this.writeIndent()
      this.write(this.asOfToString(stmt.asOf))
      this.newline()
    }
  }

  // ────────────────────────────────────────────────────────────────────
  //  Objects
  // ────────────────────────────────────────────────────────────────────

  /**
   * Emits `{...}` on one line when it is short and comment-free, otherwise
   * one entry per line. A block holding a comment always stays multi-line, so
   * the comment keeps the key it was written against.
   */
  private formatObjectBlock(object: ObjectLiteral, sort: boolean): void {
    const entries = object.entries
    if (entries.length === 0) {
      this.write('{}')
      return
    }

    const hasComments = this.hasPendingCommentInRange(
      object.range.start.line,
      object.range.end.line
    )
    const inline = this.objectLiteralToString(object, sort)
    if (
      !hasComments &&
      inline.length + this.indentLevel * this.opts.indentSize <= 78 &&
      !inline.includes('\n')
    ) {
      this.write(inline)
      return
    }

    const ordered = sort && !hasComments ? this.sortObjectEntries(entries) : entries
    this.write('{')
    this.newline()
    this.indentLevel++
    for (let i = 0; i < ordered.length; i++) {
      const entry = ordered[i]!
      this.emitCommentsBefore(entry.range.start.line)
      this.writeIndent()
      this.write(`${this.fieldName(entry.key, entry.isQuoted)}: ${this.expr(entry.value)}`)
      if (i < ordered.length - 1) this.write(',')
      this.newline()
    }
    this.emitCommentsBefore(object.range.end.line)
    this.indentLevel--
    this.writeIndent()
    this.write('}')
  }

  private objectLiteralToString(object: ObjectLiteral, sort = false): string {
    if (object.entries.length === 0) return '{}'
    const entries = sort ? this.sortObjectEntries(object.entries) : object.entries
    const inner = entries
      .map((e) => `${this.fieldName(e.key, e.isQuoted)}: ${this.expr(e.value)}`)
      .join(', ')
    return `{${inner}}`
  }

  private objectPatternToString(pattern: ObjectPattern): string {
    if (pattern.members.length === 0) return '{}'
    const inner = pattern.members
      .map((e) => `${this.fieldName(e.key, e.isQuoted)}: ${this.expr(e.value)}`)
      .join(', ')
    return `{${inner}}`
  }

  private sortObjectEntries(entries: ObjectEntry[]): ObjectEntry[] {
    // Alphabetical by key (attributes are an unordered map in KIP).
    return [...entries].sort((a, b) => a.key.localeCompare(b.key))
  }

  private fieldName(key: string, isQuoted: boolean): string {
    return isQuoted ? `"${this.escapeString(key)}"` : key
  }

  // ────────────────────────────────────────────────────────────────────
  //  Terms and expressions
  // ────────────────────────────────────────────────────────────────────

  private tupleToString(tuple: PropositionTuple): string {
    if (tuple.id) return `(id: ${this.scalar(tuple.id)})`
    return `(${this.term(tuple.subject!)}, ${this.predicate(tuple.predicate!)}, ${this.term(tuple.object!)})`
  }

  private term(term: Term): string {
    if (term.kind === 'ObjectPattern') return this.objectPatternToString(term)
    if (term.kind === 'PropositionTuple') return this.tupleToString(term)
    return this.expr(term)
  }

  private predicate(expr: RawPredicateExpression): string {
    return expr.atoms
      .map((atom) => {
        const base = this.predAtom(atom.atom)
        if (!atom.quantifier) return base
        const q = atom.quantifier
        if (!q.hasComma) return `${base}{${q.min}}`
        return q.max === undefined
          ? `${base}{${q.min},}`
          : `${base}{${q.min},${q.max}}`
      })
      .join(' | ')
  }

  private predAtom(atom: PredicateAtom): string {
    return this.expr(atom)
  }

  private symbol(symbol: SchemaSymbol): string {
    return symbol.kind === 'ParameterRef' ? symbol.name : symbol.value
  }

  private scalar(value: ScalarValue): string {
    return this.expr(value)
  }

  private targetRef(ref: TargetRef): string {
    return this.expr(ref)
  }

  /**
   * Renders an expression, restoring the grouping the AST does not carry.
   *
   * `parsePrimaryExpression` unwraps `( ... )` and returns the inner node, so
   * by the time the formatter sees `A && (B || C)` it is indistinguishable
   * from `A && B || C` — except by shape. Printing operators flat therefore
   * reparses as `(A && B) || C`: a different predicate, silently, on a file
   * that formats without an error. `minPrec` is the tightest binding the
   * surrounding context accepts unparenthesized; anything looser gets its
   * parentheses back, and nothing else does.
   */
  private expr(expr: Expression, minPrec: number = 0): string {
    const prec = expressionPrecedence(expr)
    if (prec < minPrec) return `(${this.expr(expr)})`
    switch (expr.kind) {
      case 'StringLiteral':
        return expr.value
      case 'NumberLiteral':
        return expr.raw
      case 'BooleanLiteral':
        return expr.value ? 'true' : 'false'
      case 'NullLiteral':
        return 'null'
      case 'VariableRef':
        return expr.name
      case 'ParameterRef':
        return expr.name
      case 'FieldAccess':
        return (
          expr.base.name +
          expr.steps
            .map((step) =>
              step.kind === 'DotStep' ? `.${step.name}` : `[${step.key.value}]`
            )
            .join('')
        )
      case 'FunctionCallExpr':
        return `${expr.name.toUpperCase()}(${expr.args.map((a) => this.expr(a)).join(', ')})`
      case 'AggregateExpr':
        return `${expr.name}(${expr.distinct ? 'DISTINCT ' : ''}${this.expr(expr.argument)})`
      case 'BinaryExpression': {
        // Relational is the one non-associative level: `parseRelational`
        // takes a unary on both sides, so `A < B < C` is a grammar error and
        // a relational operand must never be re-emitted bare.
        const left = prec === REL_PREC ? UNARY_PREC : prec
        const right = prec === REL_PREC ? UNARY_PREC : prec + 1
        return `${this.expr(expr.left, left)} ${expr.operator} ${this.expr(expr.right, right)}`
      }
      case 'UnaryExpression':
        // `parseUnary` reads a *primary*, so anything looser needs brackets.
        return `${expr.operator}${this.expr(expr.operand, PRIMARY_PREC)}`
      case 'ArrayLiteral':
        return `[${expr.elements.map((e) => this.expr(e)).join(', ')}]`
      case 'ObjectLiteral':
        return this.objectLiteralToString(expr)
      case 'ObjectPattern':
        return this.objectPatternToString(expr)
      case 'PropositionTuple':
        return this.tupleToString(expr)
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
 * Binding strength, loosest first, mirroring the parser's descent:
 * `parseOr` → `parseAnd` → `parseEquality` → `parseRelational` → `parseUnary`
 * → `parsePrimary`. A change here without the matching change there prints
 * parentheses that mean something else.
 */
const OR_PREC = 1
const AND_PREC = 2
const EQ_PREC = 3
const REL_PREC = 4
const UNARY_PREC = 5
const PRIMARY_PREC = 6

function expressionPrecedence(expr: Expression): number {
  switch (expr.kind) {
    case 'BinaryExpression':
      switch (expr.operator) {
        case '||':
          return OR_PREC
        case '&&':
          return AND_PREC
        case '==':
        case '!=':
          return EQ_PREC
        default:
          return REL_PREC
      }
    case 'UnaryExpression':
      return UNARY_PREC
    default:
      return PRIMARY_PREC
  }
}
