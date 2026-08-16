import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'

import {
  diagnose,
  KEYWORDS,
  FUNCTIONS,
  AGGREGATES,
  KIP_SPEC_REVISION
} from '@ldclabs/kip-lang'

const readJson = async (relative) =>
  JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'))

const pkg = await readJson('../package.json')

describe('VS Code extension package', () => {
  test('declares its draft command-text scope without a runtime dependency', () => {
    assert.equal(pkg.preview, true)
    assert.equal(pkg.kip.specRevision, KIP_SPEC_REVISION)
    assert.equal(pkg.kip.scope, 'command-text-editor')
    assert.deepEqual(pkg.kip.conformanceProfiles, [])
    assert.equal(pkg.dependencies, undefined)
    assert.equal(pkg.devDependencies['@ldclabs/kip-lang'], 'workspace:*')
    assert.equal(pkg.devDependencies['@types/vscode'], '1.85.0')
    assert.ok(!pkg.scripts['build:production'].includes('sourcemap'))
  })

  test('carries a version the Marketplace accepts', () => {
    // `vsce publish` rejects any SemVer pre-release: draft status is carried by
    // `preview` and `kip.specRevision`, never by a `-draft` version suffix.
    assert.match(pkg.version, /^\d+\.\d+\.\d+$/)
  })

  test('stays enabled where a pure text toolkit safely can', () => {
    // Undeclared, VS Code disables the extension in Restricted Mode, and with
    // it formatting, diagnostics and folding — nothing here runs workspace
    // code or touches the file system, so both are supported.
    assert.equal(pkg.capabilities.untrustedWorkspaces.supported, true)
    assert.equal(pkg.capabilities.virtualWorkspaces, true)
  })

  test('packaging builds the library it bundles, and skips dependency walking', () => {
    // The extension inlines @ldclabs/kip-lang from its `dist/`, so a stale or
    // missing build would ship silently; `--no-dependencies` keeps vsce out of
    // the pnpm workspace symlink farm it cannot walk.
    assert.match(pkg.scripts['vscode:prepublish'], /@ldclabs\/kip-lang build/)
    assert.match(pkg.scripts.package, /--no-dependencies/)
  })

  test('exposes every formatter option the library accepts', () => {
    // `indentSize` comes from the editor's own tabSize; `sortAttributes` has no
    // editor equivalent, so it needs a setting or it is unreachable.
    const setting =
      pkg.contributes.configuration.properties['kip.format.sortAttributes']
    assert.equal(setting.type, 'boolean')
    assert.equal(setting.default, false)
  })

  test('TextMate grammar tracks every registered keyword and function', async () => {
    const grammarText = await readFile(
      new URL('../syntaxes/kip.tmLanguage.json', import.meta.url),
      'utf8'
    )
    for (const name of KEYWORDS.keys()) {
      assert.ok(grammarText.includes(name), `missing keyword ${name}`)
    }
    for (const name of new Set([...FUNCTIONS, ...AGGREGATES])) {
      assert.ok(grammarText.includes(name), `missing function ${name}`)
    }

    const grammar = JSON.parse(grammarText)
    for (const rule of [
      grammar.repository.function,
      grammar.repository['keyword-element'],
      grammar.repository['keyword-statement'],
      grammar.repository['keyword-modifier']
    ]) {
      assert.ok(
        rule.match.endsWith('\\b(?!\\s*:)'),
        `${rule.name} must leave whitespace-separated object keys uncolored`
      )
    }
  })

  test('language configuration indents blocks whose header contains strings', async () => {
    const config = await readJson('../language-configuration.json')
    const increase = new RegExp(config.indentationRules.increaseIndentPattern)
    const onEnter = new RegExp(config.onEnterRules[0].beforeText)
    for (const line of [
      'SET FACET "MnemonicState" {',
      'SET STRUCTURAL {',
      'WITH {',
      'payload: {'
    ]) {
      assert.ok(increase.test(line), line)
      assert.ok(onEnter.test(line), line)
    }
    assert.ok(!increase.test('name: "{"'))
  })

  test('editor diagnostics reject commands that cannot lower', () => {
    const invalid = [
      'FIND(?x.name == "Alice") WHERE { ?x {type: "Person"} }',
      'ASSERT ("Alice", "prefers", :dark) {by: :alice, mode: "stated"}',
      'CREATE CONCEPT ?c { SET FIELDS {_system: 1} }',
      'UPDATE ?a SET FIELDS {confidence: 0.2} WHERE { ?a ASSERTION {id: "A-1"} }'
    ]
    for (const source of invalid) {
      assert.ok(
        diagnose(source).some((diagnostic) => diagnostic.severity === 'error'),
        source
      )
    }
  })
})
