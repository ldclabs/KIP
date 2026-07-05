import * as vscode from 'vscode'
import { format } from '@ldclabs/kip-lang'

export class KipFormattingProvider
  implements vscode.DocumentFormattingEditProvider
{
  constructor(private readonly output?: vscode.OutputChannel) {}

  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): vscode.TextEdit[] {
    const source = document.getText()
    try {
      const formatted = format(source, {
        indentSize: options.tabSize
      })
      if (formatted === source) return []

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(source.length)
      )
      return [vscode.TextEdit.replace(fullRange, formatted)]
    } catch (err) {
      // `format` throws on invalid KIP (surfaced separately by diagnostics);
      // log the reason so genuine formatter failures are not silent.
      const message = err instanceof Error ? err.message : String(err)
      this.output?.appendLine(`[format] ${document.uri.fsPath}: ${message}`)
      return []
    }
  }
}
