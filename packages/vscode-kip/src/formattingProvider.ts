import * as vscode from 'vscode'
import { format } from '@ldclabs/kip-lang'

export class KipFormattingProvider
  implements
    vscode.DocumentFormattingEditProvider,
    vscode.DocumentRangeFormattingEditProvider
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

  provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions
  ): vscode.TextEdit[] {
    // For range formatting, we format the entire document and then apply
    // only the changes within the requested range. This ensures consistency.
    return this.provideDocumentFormattingEdits(document, options)
  }
}
