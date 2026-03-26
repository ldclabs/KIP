import * as vscode from 'vscode'
import { parse } from '@ldclabs/kip-lang'
import type {
  Program,
  UpsertStatement,
  FindStatement,
  DeleteStatement,
  WhereClause,
  WherePattern,
  ConceptBlock,
  PropositionBlock,
  SetAttributes,
  SetPropositions,
  WithMetadata,
  NotClause,
  OptionalClause,
  UnionClause
} from '@ldclabs/kip-lang'

export class KipFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
    const source = document.getText()
    const ranges: vscode.FoldingRange[] = []

    try {
      const { ast } = parse(source)
      this.collectFromProgram(ast, ranges)
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

      switch (stmt.kind) {
        case 'UpsertStatement':
          this.collectFromUpsert(stmt, ranges)
          break
        case 'FindStatement':
          this.collectFromFind(stmt, ranges)
          break
        case 'DeleteStatement':
          this.collectFromDelete(stmt, ranges)
          break
      }
    }
  }

  private collectFromUpsert(
    stmt: UpsertStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    for (const block of stmt.blocks) {
      this.addRange(block.range, ranges)
      if (block.kind === 'ConceptBlock') {
        this.collectFromConceptBlock(block, ranges)
      } else {
        this.collectFromPropositionBlock(block, ranges)
      }
    }
    if (stmt.metadata) this.addRange(stmt.metadata.range, ranges)
  }

  private collectFromConceptBlock(
    block: ConceptBlock,
    ranges: vscode.FoldingRange[]
  ): void {
    if (block.setAttributes) this.addRange(block.setAttributes.range, ranges)
    if (block.setPropositions)
      this.addRange(block.setPropositions.range, ranges)
    if (block.metadata) this.addRange(block.metadata.range, ranges)
  }

  private collectFromPropositionBlock(
    block: PropositionBlock,
    ranges: vscode.FoldingRange[]
  ): void {
    if (block.setAttributes) this.addRange(block.setAttributes.range, ranges)
    if (block.metadata) this.addRange(block.metadata.range, ranges)
  }

  private collectFromFind(
    stmt: FindStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    if (stmt.where) {
      this.addRange(stmt.where.range, ranges)
      this.collectFromPatterns(stmt.where.patterns, ranges)
    }
  }

  private collectFromDelete(
    stmt: DeleteStatement,
    ranges: vscode.FoldingRange[]
  ): void {
    if (stmt.where) {
      this.addRange(stmt.where.range, ranges)
      this.collectFromPatterns(stmt.where.patterns, ranges)
    }
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
    if (range.end.line > range.start.line) {
      ranges.push(new vscode.FoldingRange(range.start.line, range.end.line))
    }
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
