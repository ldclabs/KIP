import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'

import {
  checkBudget,
  diagnose,
  tokenize,
  KEYWORDS,
  FUNCTIONS,
  AGGREGATES,
  KipSyntaxError,
  TokenType,
  KIP_SPEC_REVISION,
  MAX_KIP_INPUT_LEN
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
    const grammar = JSON.parse(grammarText)

    // Compared as sets, not as substrings: `includes('IN')` is satisfied by
    // any rule, comment or longer word that happens to contain those letters,
    // so a keyword dropped from an alternation would still pass.
    const highlighted = new Set()
    for (const name of [
      'function',
      'keyword-element',
      'keyword-statement',
      'keyword-modifier'
    ]) {
      const alternation = grammar.repository[name].match.match(/\(\?:([^)]*)\)/)
      assert.ok(alternation, `${name} must list its words in one alternation`)
      for (const word of alternation[1].split('|')) highlighted.add(word)
    }
    const registered = new Set([...KEYWORDS.keys(), ...FUNCTIONS, ...AGGREGATES])
    assert.deepEqual(
      [...registered].filter((name) => !highlighted.has(name)),
      [],
      'registered but never highlighted'
    )
    assert.deepEqual(
      [...highlighted].filter((name) => !registered.has(name)),
      [],
      'highlighted but not a KIP word'
    )

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

  test('a string is highlighted only to the end of its line', async () => {
    // A KIP string never crosses a newline: the lexer closes one there, and an
    // escaped newline is invalid JSON either way. A rule that ends only at the
    // closing quote colors the rest of the file after one stray `"`.
    const grammar = await readJson('../syntaxes/kip.tmLanguage.json')
    assert.equal(grammar.repository.string.end, '"|$')

    const [token] = tokenize('"unterminated\nFIND(?x)').filter(
      (t) => t.type === TokenType.String
    )
    assert.equal(token.value, '"unterminated')
  })

  test('a brace inside a string or a comment is not a brace', () => {
    // The folding fallback runs on documents the parser rejected — exactly
    // when a brace is most likely to be sitting inside a half-typed string —
    // so it counts the lexer's tokens rather than raw characters.
    const braces = (source) =>
      tokenize(source).filter(
        (t) => t.type === TokenType.LBrace || t.type === TokenType.RBrace
      ).length
    assert.equal(braces('{name: "a { b"}'), 2)
    assert.equal(braces('{ // close the } later\n}'), 2)
  })

  test('the editor applies the protocol input budget', () => {
    // `diagnose` deliberately does not: budgets are the embedder's call. The
    // editor is an embedder, and without the check it reports a clean file
    // that every KIP engine refuses with KIP_4002.
    const tooLong = `// ${'x'.repeat(MAX_KIP_INPUT_LEN)}`
    assert.deepEqual(diagnose(tooLong), [])
    assert.throws(
      () => checkBudget(tooLong),
      (err) => err instanceof KipSyntaxError && err.code === 'KIP_4002'
    )
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
