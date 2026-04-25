import * as vscode from 'vscode'
import { KipFormattingProvider } from './formattingProvider.js'
import { KipDiagnosticsProvider } from './diagnosticsProvider.js'
import { KipFoldingProvider } from './foldingProvider.js'

const KIP_SELECTOR: vscode.DocumentSelector = {
  language: 'kip'
}

export function activate(context: vscode.ExtensionContext) {
  // Formatting
  const formattingProvider = new KipFormattingProvider()
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      KIP_SELECTOR,
      formattingProvider
    )
  )

  // Diagnostics
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection('kip')
  const diagnosticsProvider = new KipDiagnosticsProvider(diagnosticCollection)
  context.subscriptions.push(
    diagnosticCollection,
    diagnosticsProvider,
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === 'kip') diagnosticsProvider.update(doc)
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === 'kip')
        diagnosticsProvider.scheduleUpdate(e.document)
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc.languageId === 'kip') diagnosticsProvider.delete(doc)
    })
  )

  // Run diagnostics for already-open KIP documents
  for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === 'kip') diagnosticsProvider.update(doc)
  }

  // Folding
  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(
      KIP_SELECTOR,
      new KipFoldingProvider()
    )
  )
}

export function deactivate() {
  // nothing to clean up
}
