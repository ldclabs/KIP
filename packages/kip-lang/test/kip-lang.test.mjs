import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  tokenize,
  parse,
  format,
  diagnose,
  analyzeSemantics,
  TokenType,
  checkBudget,
  MAX_KIP_INPUT_LEN
} from '../dist/index.js'

/** Parses and asserts the source is clean, returning the single statement. */
function parseOne(source) {
  const { ast, diagnostics } = parse(source)
  const errors = diagnostics.filter((d) => d.severity === 'error')
  assert.deepEqual(
    errors.map((e) => e.message),
    [],
    `expected no parse errors for: ${source}`
  )
  assert.equal(ast.statements.length, 1, `expected one statement: ${source}`)
  return ast.statements[0]
}

/** Asserts the source produces at least one parse error. */
function parseErrors(source) {
  const { diagnostics } = parse(source)
  const errors = diagnostics.filter((d) => d.severity === 'error')
  assert.ok(
    errors.length > 0,
    `expected a parse error for: ${source}`
  )
  return errors
}

describe('lexer', () => {
  test('KIP 2.0 keywords are ASCII case-insensitive', () => {
    for (const spelling of ['FIND', 'find', 'Find', 'fInD']) {
      const tokens = tokenize(spelling).filter((t) => t.type !== TokenType.EOF)
      assert.equal(tokens[0].type, TokenType.Find, spelling)
      // The original spelling survives so a formatter can canonicalize it.
      assert.equal(tokens[0].value, spelling)
    }
  })

  test('true/false/null stay case-sensitive JSON literals', () => {
    const tokens = tokenize('true True null NULL').filter(
      (t) => t.type !== TokenType.EOF && t.type !== TokenType.Whitespace
    )
    assert.equal(tokens[0].type, TokenType.Boolean)
    assert.equal(tokens[1].type, TokenType.Identifier)
    assert.equal(tokens[2].type, TokenType.Null)
    // NULL upper-cases to no keyword, so it is an identifier, not a literal.
    assert.equal(tokens[3].type, TokenType.Identifier)
  })

  test('the v1 $system identifier is no longer syntax', () => {
    const tokens = tokenize('$ConceptType').filter(
      (t) => t.type !== TokenType.EOF
    )
    assert.equal(tokens[0].type, TokenType.Unknown)
    assert.equal(tokens[0].value, '$')
  })

  test('a keyword needs a word boundary', () => {
    const tokens = tokenize('FINDING').filter((t) => t.type !== TokenType.EOF)
    assert.equal(tokens.length, 1)
    assert.equal(tokens[0].type, TokenType.Identifier)
  })

  test('a bare - lexes as an operator, not a broken number', () => {
    const tokens = tokenize('-?x').filter((t) => t.type !== TokenType.EOF)
    assert.equal(tokens[0].type, TokenType.Minus)
    assert.equal(tokens[1].type, TokenType.Variable)
  })
})

describe('KQL', () => {
  test('the five Core element-kind patterns parse', () => {
    const stmt = parseOne(`
      FIND(?c, ?p, ?a, ?e, ?act)
      WHERE {
        ?c {type: "Person"}
        ?p (?c, "works_for", ?org)
        ?a ASSERTION {proposition: ?p, stance: "support"}
        ?e EVIDENCE {evidence_class: "tool_result"}
        ?act ACTIVITY {activity_class: "inference"}
      }
    `)
    assert.deepEqual(
      stmt.where.patterns.map((p) => p.kind),
      [
        'ConceptPattern',
        'PropositionPattern',
        'AssertionPattern',
        'EvidencePattern',
        'ActivityPattern'
      ]
    )
  })

  test('a Proposition is addressed by triple or by id, in one slot', () => {
    const triple = parseOne('FIND(?p) WHERE { ?p (?s, "works_for", ?o) }')
    assert.ok(triple.where.patterns[0].tuple.subject)
    assert.equal(triple.where.patterns[0].tuple.id, undefined)

    // The keyword stays optional — `(id: ...)` is the same slot, so it needs
    // no disambiguation from a Concept Pattern.
    for (const src of [
      'FIND(?p) WHERE { ?p (id: :prop_id) }',
      'FIND(?p) WHERE { ?p PROPOSITION (id: :prop_id) }'
    ]) {
      const stmt = parseOne(src)
      assert.equal(stmt.where.patterns[0].kind, 'PropositionPattern', src)
      assert.equal(stmt.where.patterns[0].tuple.id.name, ':prop_id', src)
      assert.equal(stmt.where.patterns[0].tuple.subject, undefined, src)
    }
  })

  test('an id reference stands as a term endpoint', () => {
    // This is the point of keeping it in the tuple slot: a statement about a
    // statement can name an existing Proposition inline.
    const stmt = parseOne(
      'FIND(?meta) WHERE { ?meta (?p, "contradicts", (id: :other)) }'
    )
    const object = stmt.where.patterns[0].tuple.object
    assert.equal(object.kind, 'PropositionTuple')
    assert.equal(object.id.name, ':other')
  })

  test('(id: ...) accepts a quoted id and rejects a bare triple mix', () => {
    assert.equal(
      parseOne('FIND(?p) WHERE { ?p (id: "P-1") }').where.patterns[0].tuple.id
        .parsed,
      'P-1'
    )
    // `id` is a field name, not a keyword: an identifier without the colon is
    // still a term position, and a bare identifier is not a term.
    assert.ok(parseErrors('FIND(?p) WHERE { ?p (id, "b", ?c) }').length > 0)
  })

  test('STRUCTURAL is record topology, distinct from a Proposition', () => {
    const stmt = parseOne(
      'FIND(?edge.index) WHERE { ?edge STRUCTURAL (?exp, "has_step", ?step) }'
    )
    const [pattern] = stmt.where.patterns
    assert.equal(pattern.kind, 'StructuralPattern')
    assert.equal(pattern.field.parsed, 'has_step')
  })

  test('BELIEF projects either a bound Proposition or a tuple', () => {
    const bound = parseOne('FIND(?b) WHERE { ?b BELIEF (?p) }')
    assert.equal(bound.where.patterns[0].proposition.name, '?p')
    assert.equal(bound.where.patterns[0].subject, undefined)

    const tuple = parseOne('FIND(?b) WHERE { ?b BELIEF (?s, "timezone", ?tz) }')
    assert.equal(tuple.where.patterns[0].proposition, undefined)
    assert.equal(tuple.where.patterns[0].predicate.parsed, 'timezone')
  })

  test('BELIEF takes the same (id: ...) form as a Proposition pattern (Spec §46.1)', () => {
    // The operand is the Proposition expression slot, so a Proposition already
    // known by identity is projected in one clause instead of bind-then-project.
    const byParam = parseOne('FIND(?b) WHERE { ?b BELIEF (id: :pid) }')
    const pattern = byParam.where.patterns[0]
    assert.equal(pattern.kind, 'BeliefPattern')
    assert.equal(pattern.propositionId.name, ':pid')
    assert.equal(pattern.proposition, undefined)
    assert.equal(pattern.subject, undefined)

    const byString = parseOne('FIND(?b) WHERE { ?b BELIEF (id: "P-1") }')
    assert.equal(byString.where.patterns[0].propositionId.parsed, 'P-1')

    // A bare parameter is neither a bound variable nor an id reference: the
    // reference spelling is (id: :p), exactly as in a Proposition pattern.
    assert.match(
      parseErrors('FIND(?b) WHERE { ?b BELIEF (:p) }')[0].message,
      /\(id: :p\)/
    )
    // The one-argument forms leave the raw-path machinery untouched.
    assert.ok(parseErrors('FIND(?b) WHERE { ?b BELIEF (?s, "p"{1,3}, ?o) }').length > 0)
  })

  test('BELIEF SLOT is its own pattern family', () => {
    const stmt = parseOne('FIND(?slot) WHERE { ?slot BELIEF SLOT (?p, "timezone") }')
    assert.equal(stmt.where.patterns[0].kind, 'BeliefSlotPattern')
  })

  test('AS OF and FOR TIME are independent axes', () => {
    const stmt = parseOne(
      'FIND(?x) WHERE { ?x {id: "1"} } AS OF SEQ :seq FOR TIME :t'
    )
    assert.equal(stmt.asOf.basis, 'SEQ')
    assert.equal(stmt.forTime.value.name, ':t')
  })

  test('AS OF accepts each of the three bases', () => {
    for (const basis of ['SEQ', 'TX', 'TIME']) {
      const stmt = parseOne(`FIND(?x) WHERE { ?x {id: "1"} } AS OF ${basis} :v`)
      assert.equal(stmt.asOf.basis, basis)
    }
  })

  test('raw predicate paths carry quantifiers and alternation', () => {
    const hops = parseOne('FIND(?a) WHERE { (?x, "is_subclass_of"{0,5}, ?a) }')
    const q = hops.where.patterns[0].tuple.predicate.atoms[0].quantifier
    assert.equal(q.min, 0)
    assert.equal(q.max, 5)

    const alt = parseOne('FIND(?y) WHERE { (?x, "related_to" | "depends_on", ?y) }')
    assert.equal(alt.where.patterns[0].tuple.predicate.atoms.length, 2)
  })

  test('{n} and {n,} are different quantifiers', () => {
    const exact = parseOne('FIND(?a) WHERE { (?x, "p"{2}, ?a) }')
    const exactQ = exact.where.patterns[0].tuple.predicate.atoms[0].quantifier
    assert.equal(exactQ.min, 2)
    assert.equal(exactQ.max, 2)

    const open = parseOne('FIND(?a) WHERE { (?x, "p"{2,}, ?a) }')
    const openQ = open.where.patterns[0].tuple.predicate.atoms[0].quantifier
    assert.equal(openQ.min, 2)
    assert.equal(openQ.max, undefined)
  })

  test('a predicate variable binds the exact predicate ref', () => {
    const stmt = parseOne('FIND(?pred) WHERE { ?p (?s, ?pred, ?o) }')
    assert.equal(
      stmt.where.patterns[0].tuple.predicate.atoms[0].atom.kind,
      'VariableRef'
    )
  })

  test('dot paths and index steps resolve together', () => {
    const stmt = parseOne(
      'FIND(?x.facets["MnemonicState"].memory_strength) WHERE { ?x {id: "1"} }'
    )
    const access = stmt.projections[0]
    assert.equal(access.kind, 'FieldAccess')
    assert.deepEqual(
      access.steps.map((s) => (s.kind === 'DotStep' ? s.name : s.key.parsed)),
      ['facets', 'MnemonicState', 'memory_strength']
    )
  })

  test('aggregates carry DISTINCT', () => {
    const stmt = parseOne('FIND(COUNT(DISTINCT ?x)) WHERE { ?x {id: "1"} }')
    assert.equal(stmt.projections[0].kind, 'AggregateExpr')
    assert.equal(stmt.projections[0].distinct, true)
  })

  test('ORDER BY takes several keys with directions', () => {
    const stmt = parseOne(
      'FIND(?x) WHERE { ?x {id: "1"} } ORDER BY ?x.a DESC, ?x.b ASC, ?x.c'
    )
    assert.deepEqual(
      stmt.orderBy.items.map((i) => i.direction),
      ['DESC', 'ASC', undefined]
    )
  })

  test('WHERE items are whitespace-delimited, never comma-separated', () => {
    const errors = parseErrors('FIND(?x) WHERE { ?x {a: 1}, ?y {b: 2} }')
    assert.match(errors[0].message, /whitespace, not commas/)
  })

  test('chained comparison is rejected', () => {
    const errors = parseErrors('FIND(?x) WHERE { ?x {a:1} FILTER(1 < ?x.v < 3) }')
    assert.match(errors[0].message, /Chained comparison/)
  })
})

describe('KML', () => {
  test('ASSERT carries the full sugar member set', () => {
    const stmt = parseOne(`
      ASSERT (:alice, "prefers", :dark_mode) {
        by: :alice,
        mode: "stated",
        confidence: 0.95,
        evidence: :msg,
        stance: "support",
        at: :time,
        key: :client_key
      }
    `)
    assert.equal(stmt.kind, 'AssertStatement')
    assert.deepEqual(
      stmt.assignments.entries.map((e) => e.key),
      ['by', 'mode', 'confidence', 'evidence', 'stance', 'at', 'key']
    )
  })

  test('keywords double as object keys: by, mode, at, key, name, type', () => {
    const stmt = parseOne(
      'ASSERT (:a, "p", :b) { by: :x, mode: "stated", at: :t, key: :k }'
    )
    assert.deepEqual(
      stmt.assignments.entries.map((e) => e.key),
      ['by', 'mode', 'at', 'key']
    )
  })

  test('SUPERSEDING attaches to ASSERT', () => {
    const stmt = parseOne(
      'ASSERT (:a, "timezone", "+01:00") { by: :a, mode: "stated" } SUPERSEDING :old'
    )
    assert.equal(stmt.superseding.name, ':old')
  })

  test('MUTATE holds a plan of clauses and forbids nesting', () => {
    const stmt = parseOne(`
      MUTATE {
        CREATE EVIDENCE ?e { SET FIELDS { evidence_class: "tool_result" } }
        ASSERT ?a (:alice, "timezone", "+01:00") { by: :alice, mode: "stated", evidence: ?e }
        CREATE ACTIVITY ?rev {
          SET FIELDS { activity_class: "belief_revision", status: "completed" }
          SET STRUCTURAL { ("inputs", ?e) ("outputs", ?a) }
        }
      }
    `)
    assert.equal(stmt.clauses.length, 3)

    const errors = parseErrors('MUTATE { MUTATE { CREATE CONCEPT ?c { TYPE "T" } } }')
    assert.match(errors[0].message, /cannot contain another MUTATE/)
  })

  test('CREATE CONCEPT collects every clause kind', () => {
    const stmt = parseOne(`
      CREATE CONCEPT ?exp {
        TYPE "Experience"
        CLIENT KEY :exp_key
        NAME "Deploy failure"
        SET ATTRIBUTES { goal: :goal, outcome_status: "failure" }
        SET FACET "MnemonicState" { memory_strength: 0.8, salience: 0.9 }
        SET STRUCTURAL { ("has_step", ?s0) {index: 0} ("has_step", ?s1) {index: 1} }
      }
    `)
    assert.equal(stmt.type.value.parsed, 'Experience')
    assert.equal(stmt.setFacets.length, 1)
    assert.equal(stmt.setStructural.assignments.length, 2)
    assert.equal(stmt.setStructural.assignments[0].options.entries[0].key, 'index')
  })

  test('every SET has an UNSET: UNSET STRUCTURAL removes references (Spec §17.5)', () => {
    // The entry is the SET STRUCTURAL entry without its options object.
    const upsert = parseOne(`
      UPSERT CONCEPT ?exp {
        MATCH { id: :exp_id }
        SET STRUCTURAL { ("has_step", ?right) {index: 2} }
        UNSET STRUCTURAL { ("has_step", ?wrong) ("involves", :bob) }
      }
    `)
    assert.equal(upsert.unsetStructural.kind, 'UnsetStructuralClause')
    assert.deepEqual(
      upsert.unsetStructural.removals.map((r) => [r.field.parsed, r.value.kind]),
      [['has_step', 'VariableRef'], ['involves', 'ParameterRef']]
    )

    const update = parseOne(
      'UPDATE ?exp UNSET STRUCTURAL { ("has_step", ?wrong) } WHERE { ?exp {id: :exp_id} }'
    )
    assert.equal(update.actions[0].kind, 'UnsetStructuralClause')

    // No options object on a removal, and CREATE has nothing to remove.
    assert.match(
      parseErrors('UPDATE ?e UNSET STRUCTURAL { ("has_step", ?s) {index: 0} } WHERE { ?e {} }')[0].message,
      /takes no options object/
    )
    assert.ok(parseErrors('CREATE CONCEPT ?c { TYPE "T" UNSET STRUCTURAL { ("f", ?x) } }').length > 0)
    assert.match(
      parseErrors('UPDATE ?e UNSET FIELDS { a } WHERE { ?e {} }')[0].message,
      /ATTRIBUTES, FACET or STRUCTURAL after UNSET/
    )
  })

  test('the removal ladder parses as four distinct statements', () => {
    assert.equal(parseOne('ARCHIVE :t WHERE { ?x {id:"1"} }').kind, 'ArchiveStatement')
    assert.equal(parseOne('TOMBSTONE :t').kind, 'TombstoneStatement')
    assert.equal(
      parseOne('PURGE :t REFERENCE POLICY "deny_if_referenced" CONFIRM "PURGE"').kind,
      'PurgeStatement'
    )
    assert.equal(
      parseOne('SET RETENTION :t { retention_class: "standard" }').kind,
      'SetRetentionStatement'
    )
  })

  test('PURGE demands the exact CONFIRM literal', () => {
    parseOne('PURGE :t CONFIRM "PURGE"')
    assert.match(parseErrors('PURGE :t CONFIRM "purge"')[0].message, /exact literal/)
    assert.ok(parseErrors('PURGE :t').length > 0)
  })

  test('UPDATE takes several actions before WHERE', () => {
    const stmt = parseOne(`
      UPDATE ?m
      SET FACET "MnemonicState" { memory_strength: CLAMP(MUL(?m.facets["MnemonicState"].memory_strength, :decay), 0, 1) }
      UNSET ATTRIBUTES { stale_note }
      WHERE { ?m {type: "Experience"} }
      LIMIT :n
    `)
    assert.deepEqual(
      stmt.actions.map((a) => a.kind),
      ['SetFacetClause', 'UnsetAttributesClause']
    )
  })

  test('UPDATE with a direct target may omit WHERE, like the removal family (Spec §58)', () => {
    const direct = parseOne('UPDATE :exp SET FACET "MnemonicState" {salience: 0.9}')
    assert.equal(direct.kind, 'UpdateStatement')
    assert.equal(direct.target.name, ':exp')
    assert.equal(direct.where, undefined)
    assert.equal(direct.limit, undefined)

    // A LIMIT still needs its WHERE to be meaningful, but the grammar keeps
    // the same clause order either way.
    const guarded = parseOne(
      'UPDATE "C-1" EXPECT VERSION 3 SET ATTRIBUTES {a: 1} WHERE { ?c {id: "C-1"} } LIMIT 1'
    )
    assert.equal(guarded.expectVersion.value.value, 3)
    assert.equal(guarded.where.patterns.length, 1)
    assert.ok(guarded.limit)

    // Actions are still mandatory.
    assert.match(parseErrors('UPDATE :exp')[0].message, /at least one SET or UNSET/)
  })

  test('the WHERE-scanning family accepts a LIMIT after its WHERE', () => {
    const cases = [
      ['ARCHIVE :t WHERE { ?x {a: 1} } LIMIT 200', 'ArchiveStatement'],
      ['TOMBSTONE :t WHERE { ?x {a: 1} } LIMIT :n', 'TombstoneStatement'],
      ['PURGE :t WHERE { ?x {a: 1} } LIMIT 10 CONFIRM "PURGE"', 'PurgeStatement'],
      ['SET RETENTION :t {retention_class: "standard"} WHERE { ?x {a: 1} } LIMIT 50', 'SetRetentionStatement'],
      ['RETRACT ASSERTION :a WHERE { ?a ASSERTION {b: 1} } LIMIT 5', 'RetractAssertionStatement']
    ]
    for (const [source, kind] of cases) {
      const stmt = parseOne(source)
      assert.equal(stmt.kind, kind, source)
      assert.ok(stmt.limit, `expected a LIMIT on: ${source}`)
    }
  })

  test('LIMIT still composes with the trailing precondition', () => {
    const archive = parseOne('ARCHIVE :t WHERE { ?x {a: 1} } LIMIT 200 EXPECT STATE "active"')
    assert.equal(archive.limit.value.value, 200)
    assert.equal(archive.expectState.value.parsed, 'active')

    const purge = parseOne(
      'PURGE :t WHERE { ?x {a: 1} } LIMIT 10 REFERENCE POLICY "deny_if_referenced" CONFIRM "PURGE"'
    )
    assert.equal(purge.limit.value.value, 10)
    assert.equal(purge.referencePolicy.parsed, 'deny_if_referenced')
  })

  test('MERGE CONCEPT takes no LIMIT: its source and target are named', () => {
    assert.ok(parseErrors('MERGE CONCEPT ?a INTO ?b WHERE { ?a {x: 1} } LIMIT 5').length > 0)
  })

  test('EXPECT VERSION and EXPECT STATE are told apart by their second word', () => {
    const version = parseOne('MERGE CONCEPT ?a INTO ?b EXPECT VERSION 3')
    assert.equal(version.expectVersion.value.value, 3)

    const state = parseOne('RETRACT ASSERTION :a EXPECT STATE "active"')
    assert.equal(state.expectState.value.parsed, 'active')
  })

  test('BELIEF cannot appear in a mutation selection', () => {
    const errors = parseErrors(
      'UPDATE ?m SET FIELDS {a: 1} WHERE { ?b BELIEF (?s, "p", ?o) }'
    )
    assert.match(errors[0].message, /read-only Epistemic Projection/)
  })

  test('KQL traversal forms are rejected in a KML tuple', () => {
    assert.match(
      parseErrors('ENSURE PROPOSITION (:a, "b"{0,3}, :c)')[0].message,
      /Path quantifiers/
    )
    assert.match(
      parseErrors('ASSERT (:a, "b" | "c", :d) { by: :x, mode: "stated" }')[0].message,
      /alternation/i
    )
  })
})

describe('META', () => {
  test('every DESCRIBE target parses', () => {
    const sources = [
      ['DESCRIBE PRIMER', 'PRIMER'],
      ['DESCRIBE PRIMER MODE "compact"', 'PRIMER'],
      ['DESCRIBE PROTOCOL', 'PROTOCOL'],
      ['DESCRIBE EXECUTION CONTEXT', 'EXECUTION_CONTEXT'],
      ['DESCRIBE CAPABILITIES', 'CAPABILITIES'],
      ['DESCRIBE SPACE', 'SPACE'],
      ['DESCRIBE SCHEMA ENVIRONMENT', 'SCHEMA_ENVIRONMENT'],
      ['DESCRIBE PACKAGE :p', 'PACKAGE'],
      ['DESCRIBE TYPE :t', 'TYPE'],
      ['DESCRIBE PREDICATE :p', 'PREDICATE'],
      ['DESCRIBE FACET :f', 'FACET'],
      ['DESCRIBE STRUCTURAL FIELD :sf', 'STRUCTURAL_FIELD'],
      ['DESCRIBE COMPATIBILITY FROM :a TO :b', 'COMPATIBILITY'],
      ['DESCRIBE ERROR :e', 'ERROR'],
      ['DESCRIBE TRANSACTION :tx', 'TRANSACTION'],
      ['DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :k', 'TRANSACTION_BY_IDEMPOTENCY_KEY'],
      ['DESCRIBE SNAPSHOT', 'SNAPSHOT'],
      ['DESCRIBE CAPSULE :c', 'CAPSULE'],
      ['DESCRIBE EPISTEMIC POLICY', 'EPISTEMIC_POLICY'],
      ['DESCRIBE PROJECTION CAPABILITY', 'PROJECTION_CAPABILITY'],
      ['DESCRIBE TRUST', 'TRUST'],
      ['DESCRIBE ACCESS WITH { operation: "read" }', 'ACCESS']
    ]
    for (const [source, target] of sources) {
      assert.equal(parseOne(source).target, target, source)
    }
  })

  test('every LIST target parses', () => {
    const sources = [
      ['LIST SPACES', 'SPACES'],
      ['LIST SCHEMA PACKAGES STATUS "active"', 'SCHEMA_PACKAGES'],
      ['LIST TYPES', 'TYPES'],
      ['LIST PREDICATES', 'PREDICATES'],
      ['LIST FACETS', 'FACETS'],
      ['LIST STRUCTURAL FIELDS', 'STRUCTURAL_FIELDS'],
      ['LIST EPISTEMIC POLICIES', 'EPISTEMIC_POLICIES']
    ]
    for (const [source, target] of sources) {
      assert.equal(parseOne(source).target, target, source)
    }
  })

  test('SEARCH covers all six kinds and every modifier', () => {
    for (const kind of [
      'CONCEPT',
      'PROPOSITION',
      'ASSERTION',
      'EVIDENCE',
      'ACTIVITY',
      'COGNITION'
    ]) {
      assert.equal(parseOne(`SEARCH ${kind} :term`).searchKind, kind)
    }
    const stmt = parseOne(
      'SEARCH CONCEPT :term WITH TYPE :t WITH PREDICATE :p MODE "hybrid" THRESHOLD 0.5 AS OF SEQ :s LIMIT 10 CURSOR :c'
    )
    assert.equal(stmt.mode.parsed, 'hybrid')
    assert.equal(stmt.asOfSeq.name, ':s')
    assert.equal(stmt.withPredicate.name, ':p')
  })

  test('VERIFY, VALIDATE and PREVIEW keep their target vocabularies', () => {
    assert.equal(parseOne('VERIFY CAPSULE :a').target, 'CAPSULE')
    assert.equal(parseOne('VERIFY SCHEMA PACKAGE :a').target, 'SCHEMA_PACKAGE')
    assert.equal(parseOne('VALIDATE KML :c').target, 'KML')
    assert.equal(parseOne('VALIDATE IMPORT PLAN :c').target, 'IMPORT_PLAN')
    assert.equal(parseOne('PREVIEW KML :c').target, 'KML')

    const preview = parseOne('PREVIEW IMPORT CAPSULE :c INTO :space')
    assert.equal(preview.target, 'IMPORT_CAPSULE')
    assert.equal(preview.into.name, ':space')
  })

  test('HISTORY, CHANGES and SNAPSHOT parse', () => {
    assert.equal(parseOne('HISTORY ELEMENT :id').target, 'ELEMENT')
    const space = parseOne('HISTORY SPACE FROM SEQ :a TO SEQ :b')
    assert.equal(space.fromSeq.name, ':a')
    assert.equal(space.toSeq.name, ':b')
    assert.equal(parseOne('CHANGES SINCE :c').mode, 'SINCE')
    assert.equal(parseOne('CHANGES AFTER SEQ :s LIMIT 10').mode, 'AFTER_SEQ')
    assert.equal(parseOne('SNAPSHOT AS OF SEQ :s').asOf.basis, 'SEQ')
  })

  test('EXPORT CAPSULE excludes BELIEF from its selection', () => {
    parseOne('EXPORT CAPSULE ?r WHERE { ?r {type: "T"} } WITH {closure: "referential"}')
    const errors = parseErrors('EXPORT CAPSULE ?r WHERE { ?b BELIEF (?s, "p", ?o) }')
    assert.match(errors[0].message, /read-only Epistemic Projection/)
  })
})

describe('parser strictness the executable form depends on', () => {
  test('statement introducers need real whitespace', () => {
    assert.ok(parseErrors('MUTATE{ CREATE CONCEPT ?c { TYPE "T" } }').length > 0)
    assert.ok(parseErrors('FIND(?x) WHERE{ ?x {a: 1} }').length > 0)
  })

  test('multi-word keywords are joined by whitespace only', () => {
    assert.ok(parseErrors('CREATE CONCEPT ?c { SET//c\nFIELDS {a: 1} }').length > 0)
  })

  test('a dot path carries no whitespace', () => {
    // `?x . name` is three tokens, so the projection is not a path and the
    // stray tokens are reported rather than silently joined.
    assert.ok(parseErrors('FIND(?x . name) WHERE { ?x {a: 1} }').length > 0)
  })

  test('a hop count is a plain unsigned 16-bit integer', () => {
    assert.ok(parseErrors('FIND(?x) WHERE { (?a, "p"{1.5}, ?b) }').length > 0)
    assert.ok(parseErrors('FIND(?x) WHERE { (?a, "p"{70000}, ?b) }').length > 0)
    assert.ok(parseErrors('FIND(?x) WHERE { (?a, "p"{5,2}, ?b) }').length > 0)
  })

  test('a clause may not repeat', () => {
    assert.ok(
      parseErrors('FIND(?x) WHERE { ?x {a: 1} } LIMIT 1 LIMIT 2').length > 0
    )
  })

  test('KQL trailing clauses follow their canonical order', () => {
    assert.ok(
      parseErrors('FIND(?x) WHERE { ?x {a: 1} } LIMIT 1 AS OF SEQ 2').length > 0
    )
    assert.ok(
      parseErrors('FIND(?x) WHERE { ?x {a: 1} } CURSOR :c ORDER BY ?x').length > 0
    )
  })

  test('strings are JSON strings', () => {
    assert.ok(diagnose('FIND(?x) WHERE { ?x {a: "unterminated }').length > 0)
  })

  test('a node range ends at its own last token, not the next one', () => {
    // An editor folds on these ranges: an end that pointed at the following
    // clause would hide that clause's first line.
    const stmt = parseOne(
      'CREATE CONCEPT ?x {\n    SET FIELDS {a: 1}\n    SET ATTRIBUTES {b: 2}\n}'
    )
    assert.equal(stmt.setFields.range.end.line, 1)
    assert.equal(stmt.setAttributes.range.end.line, 2)
    assert.equal(stmt.range.end.line, 3)
  })

  test('a malformed statement recovers at the next statement boundary', () => {
    const { ast } = parse('FIND(?x WHERE { ?x {a: 1} }\n\nDESCRIBE PRIMER')
    assert.ok(ast.statements.some((s) => s.kind === 'DescribeStatement'))
  })
})

describe('formatter', () => {
  test('canonicalizes keyword case to uppercase', () => {
    const out = format('find(?x.name) where { ?x {type: "Person"} }')
    assert.match(out, /^FIND\(\?x\.name\)/)
    assert.match(out, /WHERE \{/)
  })

  test('round-trips a MUTATE plan', () => {
    const source = `MUTATE {
    CREATE EVIDENCE ?e {
        SET FIELDS {evidence_class: "tool_result"}
    }

    ASSERT ?a (:alice, "timezone", "+01:00") {by: :alice, mode: "stated", evidence: ?e}
}
`
    const once = format(source)
    assert.equal(format(once), once, 'formatting is idempotent')
    assert.match(once, /MUTATE \{/)
    assert.match(once, /CREATE EVIDENCE \?e \{/)
  })

  test('preserves comments and keeps their block multi-line', () => {
    const out = format(`CREATE CONCEPT ?c {
    // why this type
    TYPE "Experience"
}`)
    assert.match(out, /\/\/ why this type/)
  })

  test('a comment above a body clause stays above that clause', () => {
    // Bodies hold their clauses in typed slots; the formatter must still
    // print them in source order so each comment lands on its own clause
    // instead of being flushed into the next block that emits comments.
    const cases = [
      [
        `UPSERT CONCEPT ?exp { MATCH {id: :exp_id}
  // facet comment
  SET FACET "F" { a: 1 }
  // structural comment
  SET STRUCTURAL { ("has_step", :right) {index: 2} } }`,
        [/\/\/ facet comment\n\s*SET FACET "F"/, /\/\/ structural comment\n\s*SET STRUCTURAL \{/]
      ],
      [
        `CREATE CONCEPT ?c {
  // why this type
  TYPE "Experience"
  // key
  CLIENT KEY :k
}`,
        [/\{\n\s*\/\/ why this type\n\s*TYPE "Experience"/, /\/\/ key\n\s*CLIENT KEY :k/]
      ],
      [
        `CREATE EVIDENCE ?e {
  // fields
  SET FIELDS { evidence_class: "x" }
  // where it came from
  SET STRUCTURAL { ("source", :actor) }
}`,
        [/\/\/ fields\n\s*SET FIELDS/, /\/\/ where it came from\n\s*SET STRUCTURAL \{/]
      ],
      [
        `UPDATE ?m
  // decay
  SET FACET "F" { v: 1 }
  // and unset
  UNSET ATTRIBUTES { x }
WHERE { ?m {} }`,
        [/\/\/ decay\n\s*SET FACET "F"/, /\/\/ and unset\n\s*UNSET ATTRIBUTES/]
      ],
      [
        `TRANSITION ACTIVITY :a TO "completed"
  // finalize
  SET FIELDS { ended_at: :t }
  EXPECT STATE "running"`,
        [/\/\/ finalize\n\s*SET FIELDS \{ended_at: :t\}\n\s*EXPECT STATE/]
      ]
    ]
    for (const [source, expectations] of cases) {
      const once = format(source)
      for (const re of expectations) assert.match(once, re, `in:\n${once}`)
      assert.equal(format(once), once, `not idempotent:\n${once}`)
      // No comment escapes past the end of the statement.
      const lastLine = once.trimEnd().split('\n').pop()
      assert.doesNotMatch(lastLine, /^\s*\/\//, `comment leaked out of the body:\n${once}`)
    }
  })

  test('body clauses keep source order and trailing body comments stay inside', () => {
    const out = format(`CREATE CONCEPT ?c {
  SET ATTRIBUTES { a: 1 }
  // type comes late in the source
  TYPE "T"
  // trailing comment
}`)
    assert.equal(
      out,
      `CREATE CONCEPT ?c {
    SET ATTRIBUTES {a: 1}
    // type comes late in the source
    TYPE "T"
    // trailing comment
}
`
    )
    assert.equal(format(out), out)
  })

  test('preserves quoted-key style', () => {
    const out = format('CREATE CONCEPT ?c { SET ATTRIBUTES {"a-b": 1, plain: 2} }')
    assert.match(out, /"a-b": 1/)
    assert.match(out, /plain: 2/)
  })

  test('sorts SET ATTRIBUTES keys only when asked', () => {
    const source = 'CREATE CONCEPT ?c { SET ATTRIBUTES {b: 1, a: 2} }'
    assert.match(format(source), /b: 1, a: 2/)
    assert.match(format(source, { sortAttributes: true }), /a: 2, b: 1/)
  })

  test('formats every statement family without throwing', () => {
    const sources = [
      'FIND(?x) WHERE { ?x {a: 1} } AS OF SEQ :s FOR TIME :t ORDER BY ?x.a DESC LIMIT 5 CURSOR :c',
      'FIND(?b) WHERE { ?b BELIEF SLOT (?p, "timezone") }',
      'CREATE CONCEPT ?c { TYPE "T" CLIENT KEY :k NAME "n" SET ATTRIBUTES {a: 1} SET FACET "F" {b: 2} SET STRUCTURAL { ("has_step", :s) {index: 0} } }',
      'UPSERT CONCEPT ?p { MATCH {key: "kip-2"} SET FIELDS {name: "KIP 2.0"} UNSET FACET "F" {x} }',
      'UPSERT CONCEPT ?e { MATCH {id: :id} SET STRUCTURAL { ("has_step", :a) {index: 0} } UNSET STRUCTURAL { ("has_step", :b) ("involves", :bob) } }',
      'UPDATE ?e UNSET STRUCTURAL { ("has_step", :wrong) } WHERE { ?e {id: :id} }',
      'ENSURE PROPOSITION ?p (:a, "b", :c) EXPECT VERSION 0',
      'ASSERT (:a, "b", :c) {by: :x, mode: "stated"} SUPERSEDING :old',
      'CREATE EVIDENCE ?e { CLIENT KEY :k SET FIELDS {evidence_class: "tool_result"} }',
      'UPDATE ?m SET FACET "F" {v: CLAMP(MUL(?m.v, :d), 0, 1)} WHERE { ?m {type: "T"} } LIMIT 10',
      'RETRACT ASSERTION :a EXPECT STATE "active"',
      'SUPERSEDE ASSERTION :o BY :n',
      'CORRECT EVIDENCE :o BY :n',
      'TRANSITION ACTIVITY :a TO "completed" SET FIELDS {ended_at: :t} EXPECT STATE "running"',
      'SET RETENTION :t {retention_class: "standard"}',
      'ARCHIVE :t WHERE { ?x {a: 1} }',
      'ARCHIVE :t WHERE { ?x {a: 1} } LIMIT 200 EXPECT STATE "active"',
      'TOMBSTONE :t',
      'TOMBSTONE :t WHERE { ?x {a: 1} } LIMIT :n',
      'RETRACT ASSERTION :a WHERE { ?a ASSERTION {b: 1} } LIMIT 5',
      'SET RETENTION :t {retention_class: "standard"} WHERE { ?x {a: 1} } LIMIT 50',
      'FIND(?p) WHERE { ?p (id: :prop_id) }',
      'FIND(?p) WHERE { ?p PROPOSITION (id: "P-1") }',
      'FIND(?meta) WHERE { ?meta (?p, "contradicts", (id: :other)) }',
      'FIND(?b) WHERE { ?p (id: :x) ?b BELIEF (?p) }',
      'FIND(?b) WHERE { ?b BELIEF (id: :x) }',
      'FIND(?b) WHERE { ?b BELIEF (id: "P-1") } WITH EPISTEMIC {explanation: "ledger"}',
      'UPDATE :exp SET FACET "MnemonicState" {salience: 0.9}',
      'UPDATE "C-1" EXPECT VERSION 3 SET ATTRIBUTES {a: 1}',
      'PURGE :t REFERENCE POLICY "deny_if_referenced" CONFIRM "PURGE"',
      'PURGE :t WHERE { ?x {a: 1} } LIMIT 10 CONFIRM "PURGE"',
      'MERGE CONCEPT :a INTO :b EXPECT VERSION 2',
      'DESCRIBE PRIMER MODE "compact"',
      'DESCRIBE COMPATIBILITY FROM :a TO :b',
      'LIST SCHEMA PACKAGES STATUS "active" LIMIT 10',
      'SEARCH COGNITION :term MODE "hybrid" THRESHOLD 0.5',
      'VERIFY SCHEMA PACKAGE :a',
      'VALIDATE KML :c WITH {strict: true}',
      'PREVIEW IMPORT CAPSULE :c INTO :s',
      'HISTORY SPACE FROM SEQ :a TO SEQ :b',
      'CHANGES AFTER SEQ :s LIMIT 10',
      'SNAPSHOT AS OF SEQ :s',
      'EXPORT CAPSULE ?r WHERE { ?r {a: 1} } WITH {closure: "referential"} AS OF SEQ :s'
    ]
    for (const source of sources) {
      const once = format(source)
      assert.equal(format(once), once, `not idempotent: ${source}`)
      const errors = diagnose(once).filter((d) => d.severity === 'error')
      assert.deepEqual(
        errors.map((e) => e.message),
        [],
        `formatted output does not re-parse: ${source}\n${once}`
      )
    }
  })

  test('refuses to format invalid KIP', () => {
    assert.throws(() => format('FIND(?x WHERE {'), /Cannot format invalid KIP/)
  })
})

describe('semantics', () => {
  function codes(source) {
    const { ast } = parse(source)
    return analyzeSemantics(ast).map((d) => d.code)
  }

  test('Core registry values are checked when written as literals', () => {
    assert.ok(
      codes('ASSERT (:a, "b", :c) {by: :x, mode: "guessed"}').includes('KIP_2001')
    )
    assert.deepEqual(codes('ASSERT (:a, "b", :c) {by: :x, mode: "stated"}'), [])
    assert.ok(
      codes('ASSERT (:a, "b", :c) {by: :x, mode: "stated", stance: "maybe"}').includes(
        'KIP_2001'
      )
    )
  })

  test('a parameter is bound later, so it is never flagged', () => {
    assert.deepEqual(codes('ASSERT (:a, "b", :c) {by: :x, mode: :m}'), [])
  })

  test('the [0,1] signals are range-checked', () => {
    assert.ok(
      codes('ASSERT (:a, "b", :c) {by: :x, mode: "stated", confidence: 1.5}').includes(
        'KIP_2001'
      )
    )
    assert.ok(
      codes(
        'CREATE CONCEPT ?c { SET FACET "MnemonicState" {memory_strength: 2} }'
      ).includes('KIP_2001')
    )
  })

  test('a handle nothing binds is reported', () => {
    const found = codes(`MUTATE {
      CREATE ACTIVITY ?a { SET STRUCTURAL { ("inputs", ?missing) } }
    }`)
    assert.ok(found.includes('KIP_2102'))
  })

  test('a bound handle is accepted, including forward references', () => {
    const found = codes(`MUTATE {
      CREATE ACTIVITY ?a { SET STRUCTURAL { ("inputs", ?e) } }
      CREATE EVIDENCE ?e { SET FIELDS {evidence_class: "tool_result"} }
    }`)
    assert.ok(!found.includes('KIP_2102'))
  })

  test('an unconstrained scan without LIMIT is warned about', () => {
    assert.ok(codes('FIND(?x) WHERE { ?x {} }').includes('KIP_4002'))
    assert.ok(!codes('FIND(?x) WHERE { ?x {} } LIMIT 10').includes('KIP_4002'))
  })

  test('TRANSITION ACTIVITY only reaches terminal states', () => {
    assert.ok(codes('TRANSITION ACTIVITY :a TO "running"').includes('KIP_2001'))
    assert.deepEqual(codes('TRANSITION ACTIVITY :a TO "completed"'), [])
  })

  test('diagnostics include executable-AST constraints', () => {
    const invalid = [
      'FIND(?x.name == "Alice") WHERE { ?x {type: "Person"} }',
      'FIND(?x) WHERE { ?x {a: 1} FILTER(SOUNDS_LIKE(?x.name)) }',
      'UPDATE ?a SET FIELDS {confidence: 0.2} WHERE { ?a ASSERTION {id: "A-1"} }',
      'ASSERT (:a, "p", :b) {by: :x, mode: "stated", trust: 0.9}',
      'CREATE ACTIVITY ?a { SET STRUCTURAL {("inputs", ?missing)} }'
    ]
    for (const source of invalid) {
      assert.ok(
        diagnose(source).some((d) => d.severity === 'error'),
        `expected an executable diagnostic for: ${source}`
      )
    }
  })
})

describe('budget', () => {
  test('rejects over-long input', () => {
    assert.throws(
      () => checkBudget('x'.repeat(MAX_KIP_INPUT_LEN + 1)),
      /exceeds maximum/
    )
  })

  test('accepts ordinary input', () => {
    assert.doesNotThrow(() => checkBudget('FIND(?x) WHERE { ?x {a: 1} }'))
  })
})
