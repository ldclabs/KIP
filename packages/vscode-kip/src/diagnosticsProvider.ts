import * as vscode from 'vscode'
import { diagnose, type Diagnostic as KipDiagnostic } from '@ldclabs/kip-lang'

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
      const kipDiags = diagnose(source)
      const vsDiags = kipDiags.map((d) => this.toVsDiagnostic(d))
      this.collection.set(doc.uri, vsDiags)
    } catch {
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
