import * as vscode from 'vscode'
import {
  checkBudget,
  diagnose,
  KipSyntaxError,
  type Diagnostic as KipDiagnostic
} from '@ldclabs/kip-lang'

export class KipDiagnosticsProvider {
  private collection: vscode.DiagnosticCollection
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(collection: vscode.DiagnosticCollection) {
    this.collection = collection
  }

  scheduleUpdate(doc: vscode.TextDocument): void {
    this.clearTimer(doc.uri)
    const key = doc.uri.toString()
    const timer = setTimeout(() => {
      this.timers.delete(key)
      this.update(doc)
    }, 300)
    this.timers.set(key, timer)
  }

  update(doc: vscode.TextDocument): void {
    this.clearTimer(doc.uri)
    const source = doc.getText()
    try {
      // The parser budgets are the protocol's, not this editor's: a document
      // over them is one every KIP engine refuses with `KIP_4002`. Reporting
      // that is the point of a linter — without it the editor says the file is
      // fine and the engine rejects it. It also keeps the extension host off
      // input the library is not asked to survive.
      checkBudget(source)
      const kipDiags = diagnose(source)
      const vsDiags = kipDiags.map((d) => this.toVsDiagnostic(d))
      this.collection.set(doc.uri, vsDiags)
    } catch (err) {
      if (err instanceof KipSyntaxError) {
        this.collection.set(doc.uri, [this.toBudgetDiagnostic(doc, err)])
        return
      }
      // If the diagnostic engine itself throws, clear diagnostics
      this.collection.delete(doc.uri)
    }
  }

  delete(doc: vscode.TextDocument): void {
    this.clearTimer(doc.uri)
    this.collection.delete(doc.uri)
  }

  dispose(): void {
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
  }

  private clearTimer(uri: vscode.Uri): void {
    const key = uri.toString()
    const timer = this.timers.get(key)
    if (!timer) return
    clearTimeout(timer)
    this.timers.delete(key)
  }

  /** A budget refusal has no range of its own: it is about the whole document. */
  private toBudgetDiagnostic(
    doc: vscode.TextDocument,
    err: KipSyntaxError
  ): vscode.Diagnostic {
    const range = new vscode.Range(
      new vscode.Position(0, 0),
      doc.lineCount > 0
        ? doc.lineAt(doc.lineCount - 1).range.end
        : new vscode.Position(0, 0)
    )
    const diag = new vscode.Diagnostic(
      range,
      err.message,
      vscode.DiagnosticSeverity.Error
    )
    diag.code = err.code
    diag.source = 'kip'
    return diag
  }

  private toVsDiagnostic(d: KipDiagnostic): vscode.Diagnostic {
    const range = new vscode.Range(
      new vscode.Position(d.range.start.line, d.range.start.column),
      new vscode.Position(d.range.end.line, d.range.end.column)
    )
    const severity =
      d.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : d.severity === 'warning'
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information

    const diag = new vscode.Diagnostic(range, d.message, severity)
    diag.code = d.code
    diag.source = 'kip'
    return diag
  }
}
