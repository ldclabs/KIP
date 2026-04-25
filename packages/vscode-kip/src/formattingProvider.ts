import * as vscode from 'vscode'
import { format } from '@ldclabs/kip-lang'

export class KipFormattingProvider
  implements vscode.DocumentFormattingEditProvider
{
  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): vscode.TextEdit[] {
    const source = document.getText()
    try {
      const formatted = format(source, {
        indentSize: options.tabSize,
        sortAttributes: true
      })
      if (formatted === source) return []

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(source.length)
      )
      return [vscode.TextEdit.replace(fullRange, formatted)]
    } catch {
      return []
    }
  }
}
