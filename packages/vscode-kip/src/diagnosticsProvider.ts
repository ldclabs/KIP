import * as vscode from 'vscode'
import { diagnose, type Diagnostic as KipDiagnostic } from '@ldclabs/kip-lang'

export class KipDiagnosticsProvider {
  private collection: vscode.DiagnosticCollection
  private timer: ReturnType<typeof setTimeout> | undefined

  constructor(collection: vscode.DiagnosticCollection) {
    this.collection = collection
  }

  scheduleUpdate(doc: vscode.TextDocument): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.update(doc), 300)
  }

  update(doc: vscode.TextDocument): void {
    const source = doc.getText()
    try {
      const kipDiags = diagnose(source)
      const vsDiags = kipDiags.map((d) => this.toVsDiagnostic(d))
      this.collection.set(doc.uri, vsDiags)
    } catch {
      // If the diagnostic engine itself throws, clear diagnostics
      this.collection.delete(doc.uri)
    }
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
