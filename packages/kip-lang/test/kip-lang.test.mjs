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
  MAX_KIP_INPUT_LEN,
  MAX_KIP_NESTING_DEPTH
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
    assert.equal(stmt.asOf.value.name, ':seq')
    assert.equal(stmt.forTime.value.name, ':t')
  })

  test('AS OF takes a sequence only: ids and instants resolve to one first', () => {
    assert.equal(parseOne('FIND(?x) WHERE { ?x {id: "1"} } AS OF SEQ 1500').asOf.value.value, 1500)
    for (const basis of ['TX', 'TIME']) {
      assert.match(
        parseErrors(`FIND(?x) WHERE { ?x {id: "1"} } AS OF ${basis} :v`)[0].message,
        /Expected SEQ after AS OF/
      )
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

  test('the removal ladder is TRANSITION plus PURGE and SET RETENTION', () => {
    assert.equal(parseOne('TRANSITION :t TO "archived" WHERE { ?x {id:"1"} }').kind, 'TransitionStatement')
    assert.equal(parseOne('TRANSITION :t TO "tombstoned"').kind, 'TransitionStatement')
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

  test('PURGE PAYLOAD keeps the element and drops the reference policy (Spec §60.6)', () => {
    const stmt = parseOne('PURGE PAYLOAD :evidence CONFIRM "PURGE"')
    assert.equal(stmt.kind, 'PurgePayloadStatement')
    assert.equal(stmt.target.name, ':evidence')

    const swept = parseOne(
      'PURGE PAYLOAD ?e WHERE { ?e EVIDENCE {evidence_class: "message"} } LIMIT 100 CONFIRM "PURGE"'
    )
    assert.equal(swept.kind, 'PurgePayloadStatement')
    assert.ok(swept.limit)

    // Same confirmation discipline as element purge; no REFERENCE POLICY slot.
    assert.match(
      parseErrors('PURGE PAYLOAD :e CONFIRM "purge"')[0].message,
      /exact literal/
    )
    assert.ok(parseErrors('PURGE PAYLOAD :e').length > 0)
    assert.ok(
      parseErrors(
        'PURGE PAYLOAD :e REFERENCE POLICY "deny_if_referenced" CONFIRM "PURGE"'
      ).length > 0
    )
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
      'UPDATE "C-1" SET ATTRIBUTES {a: 1} WHERE { ?c {id: "C-1"} } LIMIT 1 EXPECT VERSION 3'
    )
    assert.equal(guarded.expectVersions[0].value.value, 3)
    assert.equal(guarded.where.patterns.length, 1)
    assert.ok(guarded.limit)

    // Actions are still mandatory.
    assert.match(parseErrors('UPDATE :exp')[0].message, /at least one SET or UNSET/)
  })

  test('the WHERE-scanning family accepts a LIMIT after its WHERE', () => {
    const cases = [
      ['TRANSITION :t TO "archived" WHERE { ?x {a: 1} } LIMIT 200', 'TransitionStatement'],
      ['TRANSITION :t TO "tombstoned" WHERE { ?x {a: 1} } LIMIT :n', 'TransitionStatement'],
      ['PURGE :t WHERE { ?x {a: 1} } LIMIT 10 CONFIRM "PURGE"', 'PurgeStatement'],
      ['SET RETENTION :t {retention_class: "standard"} WHERE { ?x {a: 1} } LIMIT 50', 'SetRetentionStatement'],
      ['TRANSITION :a TO "retracted" WHERE { ?a ASSERTION {b: 1} } LIMIT 5', 'TransitionStatement']
    ]
    for (const [source, kind] of cases) {
      const stmt = parseOne(source)
      assert.equal(stmt.kind, kind, source)
      assert.ok(stmt.limit, `expected a LIMIT on: ${source}`)
    }
  })

  test('LIMIT still composes with the trailing precondition', () => {
    const archive = parseOne('TRANSITION :t TO "archived" WHERE { ?x {a: 1} } LIMIT 200 EXPECT VERSION 4')
    assert.equal(archive.limit.value.value, 200)
    assert.equal(archive.expectVersions[0].value.value, 4)

    const purge = parseOne(
      'PURGE :t WHERE { ?x {a: 1} } LIMIT 10 REFERENCE POLICY "deny_if_referenced" CONFIRM "PURGE"'
    )
    assert.equal(purge.limit.value.value, 10)
    assert.equal(purge.referencePolicy.parsed, 'deny_if_referenced')
  })

  test('MERGE CONCEPT takes no LIMIT: its source and target are named', () => {
    assert.ok(parseErrors('MERGE CONCEPT ?a INTO ?b WHERE { ?a {x: 1} } LIMIT 5').length > 0)
  })

  test('EXPECT VERSION trails every mutation and may name a plane', () => {
    const merge = parseOne('MERGE CONCEPT ?a INTO ?b EXPECT VERSION 3')
    assert.equal(merge.expectVersions[0].value.value, 3)
    assert.equal(merge.expectVersions[0].plane, undefined)

    const planes = parseOne(
      'UPDATE :s SET ATTRIBUTES {status: "adopted"} EXPECT VERSION 7 OF ATTRIBUTES EXPECT VERSION 2 OF FACET "GradingState"'
    )
    assert.equal(planes.expectVersions.length, 2)
    assert.equal(planes.expectVersions[0].plane.kind, 'ATTRIBUTES')
    assert.equal(planes.expectVersions[1].plane.kind, 'FACET')
    assert.equal(planes.expectVersions[1].plane.facet.parsed, 'GradingState')

    const upsert = parseOne('UPSERT CONCEPT ?p { MATCH {key: "k"} SET FIELDS {name: "n"} } EXPECT VERSION 0')
    assert.equal(upsert.expectVersions[0].value.value, 0)

    // The old head position and EXPECT STATE are gone (Spec §35.3, §52.8).
    assert.ok(parseErrors('UPDATE :s EXPECT VERSION 3 SET ATTRIBUTES {a: 1}').length > 0)
    assert.ok(parseErrors('TRANSITION :a TO "retracted" EXPECT STATE "active"').length > 0)
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
      ['DESCRIBE SNAPSHOT AS OF SEQ :s', 'SNAPSHOT'],
      ['DESCRIBE SNAPSHOT AT TIME :t', 'SNAPSHOT'],
      ['DESCRIBE CAPSULE :c', 'CAPSULE'],
      ['DESCRIBE EPISTEMIC POLICY', 'EPISTEMIC_POLICY'],
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
      ['LIST EPISTEMIC POLICIES', 'EPISTEMIC_POLICIES'],
      ['LIST DEPENDENTS :id', 'DEPENDENTS']
    ]
    for (const [source, target] of sources) {
      assert.equal(parseOne(source).target, target, source)
    }
  })

  test('LIST DEPENDENTS takes an operand, a DEPTH bound, and paging (Spec §63.5)', () => {
    const stmt = parseOne('LIST DEPENDENTS :id DEPTH 2 LIMIT 100 CURSOR :c')
    assert.equal(stmt.target, 'DEPENDENTS')
    assert.equal(stmt.element.name, ':id')
    assert.equal(stmt.depth.value, 2)
    assert.equal(stmt.limit.value.value, 100)

    // The operand is required: dependents of nothing is not a listing.
    assert.ok(parseErrors('LIST DEPENDENTS').length > 0)
    assert.ok(parseErrors('LIST DEPENDENTS DEPTH 2').length > 0)
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

  test('HISTORY, CHANGES and DESCRIBE SNAPSHOT parse', () => {
    assert.equal(parseOne('HISTORY ELEMENT :id').target, 'ELEMENT')
    const space = parseOne('HISTORY SPACE FROM SEQ :a TO SEQ :b')
    assert.equal(space.fromSeq.name, ':a')
    assert.equal(space.toSeq.name, ':b')
    assert.equal(parseOne('CHANGES SINCE :c').mode, 'SINCE')
    assert.equal(parseOne('CHANGES AFTER SEQ :s LIMIT 10').mode, 'AFTER_SEQ')
    // SNAPSHOT folded into DESCRIBE SNAPSHOT, which also resolves an instant.
    assert.equal(parseOne('DESCRIBE SNAPSHOT AS OF SEQ :s').asOf.value.name, ':s')
    assert.equal(parseOne('DESCRIBE SNAPSHOT AT TIME :t').atTime.name, ':t')
    assert.ok(parseErrors('SNAPSHOT AS OF SEQ :s').length > 0)
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
        `TRANSITION :a TO "completed"
  // finalize
  SET FIELDS { ended_at: :t }
EXPECT VERSION 3`,
        [/\/\/ finalize\n\s*SET FIELDS \{ended_at: :t\}\n\s*EXPECT VERSION/]
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
      'TRANSITION :a TO "retracted" EXPECT VERSION 2',
      'TRANSITION :o TO "superseded" BY :n',
      'TRANSITION :o TO "corrected" BY :n',
      'TRANSITION :a TO "completed" SET FIELDS {ended_at: :t} EXPECT VERSION 1',
      'SET RETENTION :t {retention_class: "standard"}',
      'TRANSITION :t TO "archived" WHERE { ?x {a: 1} }',
      'TRANSITION :t TO "archived" WHERE { ?x {a: 1} } LIMIT 200 EXPECT VERSION 4',
      'TRANSITION :t TO "tombstoned"',
      'TRANSITION :t TO "tombstoned" WHERE { ?x {a: 1} } LIMIT :n',
      'TRANSITION :a TO "retracted" WHERE { ?a ASSERTION {b: 1} } LIMIT 5',
      'UPSERT CONCEPT ?p { MATCH {key: "kip-2"} SET FIELDS {name: "n"} } EXPECT VERSION 2',
      'SET RETENTION :t {retention_class: "standard"} WHERE { ?x {a: 1} } LIMIT 50',
      'FIND(?p) WHERE { ?p (id: :prop_id) }',
      'FIND(?p) WHERE { ?p PROPOSITION (id: "P-1") }',
      'FIND(?meta) WHERE { ?meta (?p, "contradicts", (id: :other)) }',
      'FIND(?b) WHERE { ?p (id: :x) ?b BELIEF (?p) }',
      'FIND(?b) WHERE { ?b BELIEF (id: :x) }',
      'FIND(?b) WHERE { ?b BELIEF (id: "P-1") } WITH EPISTEMIC {explanation: "ledger"}',
      'UPDATE :exp SET FACET "MnemonicState" {salience: 0.9}',
      'UPDATE "C-1" SET ATTRIBUTES {a: 1} EXPECT VERSION 3 OF ATTRIBUTES EXPECT VERSION 1 OF FACET "MnemonicState"',
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
      'DESCRIBE SNAPSHOT AT TIME :t',
      'DESCRIBE SNAPSHOT AS OF SEQ :s',
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

  test('restores the grouping the AST does not carry', () => {
    // `( ... )` is unwrapped by the parser, so the formatter has to rebuild
    // it from precedence. Printing operators flat turns `A && (B || C)` into
    // `A && B || C`, which reparses as `(A && B) || C` — a different
    // predicate, on a file that formatted without an error.
    const filterOf = (source) => {
      const stmt = parseOne(source)
      return stmt.where.patterns.find((p) => p.kind === 'FilterClause').expression
    }
    const shape = (e) => {
      if (e.kind === 'BinaryExpression') {
        return `(${shape(e.left)} ${e.operator} ${shape(e.right)})`
      }
      if (e.kind === 'UnaryExpression') return `${e.operator}${shape(e.operand)}`
      if (e.kind === 'FunctionCallExpr') return `${e.name}()`
      return e.kind
    }
    const filters = [
      '?x.a > 1 || ?x.b > 2 && ?x.c > 3',
      '(?x.a > 1 || ?x.b > 2) && ?x.c > 3',
      '?x.a > 1 && (?x.b > 2 || ?x.c > 3)',
      '?x.a > 1 && (?x.b > 2 || ?x.c > 3) && ?x.d > 4',
      '(?x.a > 1 && ?x.b > 2) || (?x.c > 3 && ?x.d > 4)',
      '!(?x.a > 1 && ?x.b > 2)',
      '!(?x.a > 1) && !(?x.b > 2)',
      '(?x.a != 1 || ?x.b != 2) && !(?x.c == 3)',
      'IS_NULL(?x.a) || ?x.a > 1',
      '-?x.n < 0'
    ]
    for (const filter of filters) {
      const source = `FIND(?x) WHERE { ?x {} FILTER(${filter}) }`
      const once = format(source)
      assert.equal(
        shape(filterOf(once)),
        shape(filterOf(source)),
        `formatting changed what this filter means:\n  in : ${filter}\n  out: ${once}`
      )
      assert.equal(format(once), once, `not idempotent:\n${once}`)
    }
  })

  test('adds no parentheses default precedence already gives', () => {
    const flat = format('FIND(?x) WHERE { ?x {} FILTER(?x.a > 1 && ?x.b > 2 || ?x.c > 3) }')
    assert.match(flat, /FILTER\(\?x\.a > 1 && \?x\.b > 2 \|\| \?x\.c > 3\)/)
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

  test('the Evidence role registry is checked like stance and mode', () => {
    const cite = (role) =>
      `CREATE ASSERTION ?a { SET STRUCTURAL { ("evidence", :e) {role: ${role}} } }`
    for (const role of ['"support"', '"challenge"', '"context"']) {
      assert.deepEqual(codes(cite(role)), [], role)
    }
    assert.ok(codes(cite('"corroborates"')).includes('KIP_2001'))
    // Bound later, so uncheckable; and `role` on another field is the
    // Schema Environment's business, not this package's.
    assert.deepEqual(codes(cite(':role')), [])
    assert.deepEqual(
      codes('CREATE CONCEPT ?c { SET STRUCTURAL { ("involves", :p) {role: "x"} } }'),
      []
    )
  })

  test('TRANSITION checks its vocabulary, its BY, and its finalize clauses', () => {
    // A state no kind has is a mistake the toolkit can name now.
    assert.ok(codes('TRANSITION :a TO "active"').includes('KIP_2001'))
    assert.deepEqual(codes('TRANSITION :a TO "retracted"'), [])
    // "superseded" / "corrected" name the replacing element with BY.
    assert.ok(codes('TRANSITION :o TO "superseded"').includes('KIP_2001'))
    assert.deepEqual(codes('TRANSITION :o TO "superseded" BY :n'), [])
    assert.ok(codes('TRANSITION :a TO "retracted" BY :n').includes('KIP_2001'))
    // Only an Activity move finalizes fields or topology.
    assert.ok(codes('TRANSITION :a TO "retracted" SET FIELDS {x: 1}').includes('KIP_2001'))
    assert.deepEqual(codes('TRANSITION :a TO "completed" SET FIELDS {ended_at: :t}'), [])
    assert.deepEqual(codes('TRANSITION :c TO "archived"'), [])
    // A parameter is bound at execution time; nothing is checkable.
    assert.deepEqual(codes('TRANSITION :c TO :state'), [])
  })

  test('every bounded-selection family warns when its sweep is unbounded', () => {
    // Spec §52.7 names six; warning on the read and staying silent on the
    // removal ladder had it backwards.
    const sweeps = [
      'UPDATE ?x SET FIELDS {name: "n"} WHERE { ?x {} }',
      'TRANSITION ?a TO "retracted" WHERE { ?a ASSERTION {} }',
      'SET RETENTION ?x {retention_class: "standard"} WHERE { ?x {} }',
      'TRANSITION ?x TO "archived" WHERE { ?x {} }',
      'TRANSITION ?x TO "tombstoned" WHERE { ?x {} }',
      'PURGE ?x WHERE { ?x {} } CONFIRM "PURGE"'
    ]
    for (const sweep of sweeps) {
      assert.ok(codes(sweep).includes('KIP_4002'), sweep)
    }
    assert.deepEqual(codes('TRANSITION ?x TO "archived" WHERE { ?x {} } LIMIT 10'), [])
    assert.deepEqual(codes('TRANSITION ?x TO "archived" WHERE { ?x {type: "Event"} }'), [])
  })

  test('a Core field is range-checked wherever it is written', () => {
    assert.ok(codes('UPDATE :a SET FIELDS {confidence: 5}').includes('KIP_2001'))
    assert.deepEqual(codes('UPDATE :a SET FIELDS {confidence: 0.5}'), [])
  })

  test('an unconstrained scan without LIMIT is warned about', () => {
    assert.ok(codes('FIND(?x) WHERE { ?x {} }').includes('KIP_4002'))
    assert.ok(!codes('FIND(?x) WHERE { ?x {} } LIMIT 10').includes('KIP_4002'))
  })

  test('an Activity may move to running or to a terminal state', () => {
    assert.deepEqual(codes('TRANSITION :a TO "running"'), [])
    assert.deepEqual(codes('TRANSITION :a TO "completed"'), [])
    assert.ok(codes('TRANSITION :a TO "done"').includes('KIP_2001'))
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

  test('rejects nesting past the ceiling', () => {
    assert.throws(
      () => checkBudget('['.repeat(MAX_KIP_NESTING_DEPTH + 1)),
      /nesting exceeds maximum/
    )
  })

  test('the scan closes a string where the lexer closes it', () => {
    // The lexer refuses to carry a string across a raw newline. A scan that
    // did carry it would stay in string mode for the rest of the input, and
    // every bracket after it would go uncounted — the depth ceiling would
    // still be in the code and defend nothing.
    const deep = '['.repeat(MAX_KIP_NESTING_DEPTH + 1)
    assert.throws(() => checkBudget(`"\n${deep}`), /nesting exceeds maximum/)
    assert.throws(() => checkBudget(`// "\n${deep}`), /nesting exceeds maximum/)

    // An *escaped* newline does continue the string, in the lexer and here.
    assert.doesNotThrow(() => checkBudget(`"a\\\n${deep}"`))
    assert.doesNotThrow(() => checkBudget(`"${deep}"`))
  })
})
