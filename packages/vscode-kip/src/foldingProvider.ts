import * as vscode from 'vscode'
import { parse } from '@ldclabs/kip-lang'
import type {
  Program,
  Statement,
  MutateStatement,
  MutationClause,
  FindStatement,
  CreateConceptStatement,
  UpsertConceptStatement,
  CreateEvidenceStatement,
  CreateAssertionStatement,
  CreateActivityStatement,
  UpdateStatement,
  WhereClause,
  WherePattern
} from '@ldclabs/kip-lang'

/** `CREATE EVIDENCE|ASSERTION|ACTIVITY` — one clause vocabulary, three kinds. */
type RecordCreateStatement =
  | CreateEvidenceStatement
  | CreateAssertionStatement
  | CreateActivityStatement

export class KipFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
    const source = document.getText()
    const ranges: vscode.FoldingRange[] = []

    try {
      const { ast, diagnostics } = parse(source)
      if (diagnostics.some((d) => d.severity === 'error')) {
        this.collectBraceFolding(document, ranges)
      } else {
        this.collectFromProgram(ast, ranges)
      }
    } catch {
      // Fall back to simple brace matching if parsing fails
      this.collectBraceFolding(document, ranges)
    }

    // Also collect consecutive comment blocks
    this.collectCommentFolding(document, ranges)

    return ranges
  }

  private collectFromProgram(
    program: Program,
    ranges: vscode.FoldingRange[]
  ): void {
    for (const stmt of program.statements) {
      this.addRange(stmt.range, ranges)
      this.collectFromStatement(stmt, ranges)
    }
  }

  /**
   * One statement: a KQL `FIND`, a KML mutation, or a META command.
   *
   * Every KML mutation may stand alone or sit inside `MUTATE { ... }`, so the
   * mutation cases route through {@link collectFromMutation}.
   */
  private collectFromStatement(
    stmt: Statement,
    ranges: vscode.FoldingRange[]
  ): void {
    switch (stmt.kind) {
      case 'FindStatement':
        this.collectFromFind(stmt, ranges)
        break
      case 'MutateStatement':
        this.collectFromMutate(stmt, ranges)
        break

      // META — only the forms carrying a block have anything nested to fold
      case 'ExportCapsuleStatement':
        this.collectFromWhere(stmt.where, ranges)
        if (stmt.options) this.addRange(stmt.options.range, ranges)
        break
      case 'DescribeStatement':
        if (stmt.with) this.addRange(stmt.with.range, ranges)
        break
      case 'ValidateStatement':
        if (stmt.options) this.addRange(stmt.options.range, ranges)
        break
      case 'ListStatement':
      case 'SearchStatement':
      case 'VerifyStatement':
      case 'PreviewStatement':
      case 'HistoryStatement':
      case 'ChangesStatement':
      case 'SnapshotStatement':
        break

      default:
        this.collectFromMutation(stmt, ranges)
    }
  }

  private collectFromFind(
    stmt: FindStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    this.collectFromWhere(stmt.where, ranges)
    if (stmt.epistemic) this.addRange(stmt.epistemic.options.range, ranges)
  }

  /** `MUTATE { ... }` — the statement range folds the transaction body. */
  private collectFromMutate(
    stmt: MutateStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    for (const clause of stmt.clauses) {
      this.addRange(clause.range, ranges)
      this.collectFromMutation(clause, ranges)
    }
  }

  private collectFromMutation(
    clause: MutationClause,
    ranges: vscode.FoldingRange[]
  ): void {
    switch (clause.kind) {
      case 'CreateConceptStatement':
        this.collectFromConceptCreate(clause, ranges)
        break
      case 'UpsertConceptStatement':
        this.collectFromUpsert(clause, ranges)
        break
      case 'CreateEvidenceStatement':
      case 'CreateAssertionStatement':
      case 'CreateActivityStatement':
        this.collectFromRecordCreate(clause, ranges)
        break
      case 'AssertStatement':
        // The `{ by: ..., mode: ... }` stance object of the ASSERT sugar
        this.addRange(clause.assignments.range, ranges)
        break
      case 'UpdateStatement':
        this.collectFromUpdate(clause, ranges)
        break
      case 'TransitionActivityStatement':
        for (const action of clause.finalize) {
          this.addRange(action.range, ranges)
        }
        break
      case 'SetRetentionStatement':
        this.addRange(clause.assignments.range, ranges)
        if (clause.where) this.collectFromWhere(clause.where, ranges)
        break
      case 'RetractAssertionStatement':
      case 'ArchiveStatement':
      case 'TombstoneStatement':
      case 'PurgeStatement':
      case 'MergeConceptStatement':
        if (clause.where) this.collectFromWhere(clause.where, ranges)
        break
      case 'EnsurePropositionStatement':
      case 'SupersedeAssertionStatement':
      case 'CorrectEvidenceStatement':
        // Single-line by construction — nothing nested to fold
        break
    }
  }

  private collectFromConceptCreate(
    stmt: CreateConceptStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    if (stmt.setFields) this.addRange(stmt.setFields.range, ranges)
    if (stmt.setAttributes) this.addRange(stmt.setAttributes.range, ranges)
    for (const facet of stmt.setFacets) this.addRange(facet.range, ranges)
    if (stmt.setStructural) this.addRange(stmt.setStructural.range, ranges)
  }

  private collectFromUpsert(
    stmt: UpsertConceptStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    if (stmt.match) this.addRange(stmt.match.range, ranges)
    if (stmt.setFields) this.addRange(stmt.setFields.range, ranges)
    if (stmt.setAttributes) this.addRange(stmt.setAttributes.range, ranges)
    for (const facet of stmt.setFacets) this.addRange(facet.range, ranges)
    if (stmt.unsetAttributes) this.addRange(stmt.unsetAttributes.range, ranges)
    for (const facet of stmt.unsetFacets) this.addRange(facet.range, ranges)
    if (stmt.setStructural) this.addRange(stmt.setStructural.range, ranges)
  }

  private collectFromRecordCreate(
    stmt: RecordCreateStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    if (stmt.setFields) this.addRange(stmt.setFields.range, ranges)
    for (const facet of stmt.setFacets) this.addRange(facet.range, ranges)
    if (stmt.setStructural) this.addRange(stmt.setStructural.range, ranges)
  }

  private collectFromUpdate(
    stmt: UpdateStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    // SET FIELDS / SET ATTRIBUTES / SET FACET / SET STRUCTURAL / UNSET ...
    for (const action of stmt.actions) this.addRange(action.range, ranges)
    if (stmt.where) this.collectFromWhere(stmt.where, ranges)
  }

  private collectFromWhere(
    where: WhereClause,
    ranges: vscode.FoldingRange[]
  ): void {
    this.addRange(where.range, ranges)
    this.collectFromPatterns(where.patterns, ranges)
  }

  private collectFromPatterns(
    patterns: WherePattern[],
    ranges: vscode.FoldingRange[]
  ): void {
    for (const p of patterns) {
      if (
        p.kind === 'NotClause' ||
        p.kind === 'OptionalClause' ||
        p.kind === 'UnionClause'
      ) {
        this.addRange(p.range, ranges)
        this.collectFromPatterns(p.patterns, ranges)
      }
    }
  }

  private addRange(
    range: { start: { line: number }; end: { line: number } },
    ranges: vscode.FoldingRange[]
  ): void {
    if (range.end.line <= range.start.line) return
    // A node and the block it wraps can span the same lines — an `ASSERT` and
    // its stance object do — and VS Code would draw two markers on one region.
    const duplicate = ranges.some(
      (r) => r.start === range.start.line && r.end === range.end.line
    )
    if (duplicate) return
    ranges.push(new vscode.FoldingRange(range.start.line, range.end.line))
  }

  private collectBraceFolding(
    document: vscode.TextDocument,
    ranges: vscode.FoldingRange[]
  ): void {
    const stack: number[] = []
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text
      for (const ch of line) {
        if (ch === '{') {
          stack.push(i)
        } else if (ch === '}' && stack.length > 0) {
          const startLine = stack.pop()!
          if (i > startLine) {
            ranges.push(new vscode.FoldingRange(startLine, i))
          }
        }
      }
    }
  }

  private collectCommentFolding(
    document: vscode.TextDocument,
    ranges: vscode.FoldingRange[]
  ): void {
    let commentStart = -1
    for (let i = 0; i < document.lineCount; i++) {
      const trimmed = document.lineAt(i).text.trim()
      if (trimmed.startsWith('//')) {
        if (commentStart === -1) commentStart = i
      } else {
        if (commentStart !== -1 && i - commentStart >= 2) {
          ranges.push(
            new vscode.FoldingRange(
              commentStart,
              i - 1,
              vscode.FoldingRangeKind.Comment
            )
          )
        }
        commentStart = -1
      }
    }
    // Handle comments at end of file
    if (commentStart !== -1 && document.lineCount - commentStart >= 2) {
      ranges.push(
        new vscode.FoldingRange(
          commentStart,
          document.lineCount - 1,
          vscode.FoldingRangeKind.Comment
        )
      )
    }
  }
}
