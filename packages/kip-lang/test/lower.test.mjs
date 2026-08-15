import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'

import {
  parse,
  lower,
  lowerAll,
  PARSER_VERSION,
  KIP_SPEC_REVISION
} from '../dist/index.js'

/** Lowers one command, asserting the source parsed cleanly first. */
function lowerOne(source) {
  const { ast, diagnostics } = parse(source)
  const errors = diagnostics.filter((d) => d.severity === 'error')
  assert.deepEqual(
    errors.map((e) => e.message),
    [],
    `expected no parse errors for: ${source}`
  )
  return lower(ast)
}

/** Asserts lowering throws, returning the error for message assertions. */
function lowerThrows(source) {
  const { ast } = parse(source)
  try {
    lower(ast)
  } catch (err) {
    return err
  }
  assert.fail(`expected lowering to throw for: ${source}`)
}

describe('lower: KQL', () => {
  test('a FIND becomes a Kql command with resolved paths', () => {
    const cmd = lowerOne('FIND(?x.name) WHERE { ?x {type: "Person"} }')
    assert.deepEqual(cmd.Kql.find_clause.expressions, [
      { Variable: { var: 'x', path: [{ Field: 'name' }] } }
    ])
    assert.deepEqual(cmd.Kql.where_clauses, [
      { Concept: { variable: 'x', matcher: { type: { Literal: { String: 'Person' } } } } }
    ])
  })

  test('index steps and dot steps stay distinguishable', () => {
    const cmd = lowerOne(
      'FIND(?x.facets["MnemonicState"].memory_strength) WHERE { ?x {id: "1"} }'
    )
    assert.deepEqual(cmd.Kql.find_clause.expressions[0].Variable.path, [
      { Field: 'facets' },
      { Key: 'MnemonicState' },
      { Field: 'memory_strength' }
    ])
  })

  test('a plain predicate lowers to Atom, a path to Path', () => {
    const atom = lowerOne('FIND(?p) WHERE { ?p (?s, "works_for", ?o) }')
    assert.deepEqual(atom.Kql.where_clauses[0].Proposition.matcher.Tuple.predicate, {
      Atom: { Literal: 'works_for' }
    })

    const hops = lowerOne('FIND(?a) WHERE { (?x, "is_subclass_of"{0,5}, ?a) }')
    assert.deepEqual(hops.Kql.where_clauses[0].Proposition.matcher.Tuple.predicate, {
      Path: [{ predicate: { Literal: 'is_subclass_of' }, hops: { min: 0, max: 5 } }]
    })

    const alt = lowerOne('FIND(?y) WHERE { (?x, "a" | "b", ?y) }')
    assert.equal(alt.Kql.where_clauses[0].Proposition.matcher.Tuple.predicate.Path.length, 2)
  })

  test('an unbounded quantifier carries a null maximum', () => {
    const cmd = lowerOne('FIND(?a) WHERE { (?x, "p"{2,}, ?a) }')
    assert.deepEqual(
      cmd.Kql.where_clauses[0].Proposition.matcher.Tuple.predicate.Path[0].hops,
      { min: 2, max: null }
    )
  })

  test('the two spellings of the slot lower to a tagged union', () => {
    const triple = lowerOne('FIND(?p) WHERE { ?p (?s, "works_for", ?o) }')
    assert.ok('Tuple' in triple.Kql.where_clauses[0].Proposition.matcher)

    const byId = lowerOne('FIND(?p) WHERE { ?p (id: :prop_id) }')
    assert.deepEqual(byId.Kql.where_clauses[0].Proposition, {
      variable: 'p',
      matcher: { Id: { Param: 'prop_id' } }
    })
  })

  test('an id reference lowers in term position too', () => {
    const cmd = lowerOne(
      'FIND(?meta) WHERE { ?meta (?p, "contradicts", (id: :other)) }'
    )
    const object = cmd.Kql.where_clauses[0].Proposition.matcher.Tuple.object
    assert.deepEqual(object, { Proposition: { Id: { Param: 'other' } } })
  })

  test('a Proposition bound by id feeds BELIEF, closing the v1 gap', () => {
    const cmd = lowerOne(`FIND(?belief)
      WHERE {
        ?p (id: :prop_id)
        ?belief BELIEF (?p)
      }
      WITH EPISTEMIC { purpose: "answer_user" }`)
    assert.ok('Id' in cmd.Kql.where_clauses[0].Proposition.matcher)
    assert.deepEqual(cmd.Kql.where_clauses[1].Belief.target, { Proposition: 'p' })
  })

  test('(id: ...) is match-only: it cannot drive resolve-or-create', () => {
    // No structure can be created from an id alone, so the two statements
    // whose job is resolve-or-create reject it.
    assert.match(
      lowerThrows('ENSURE PROPOSITION ?p (id: :x)').message,
      /only matches an existing Proposition/
    )
    assert.match(
      lowerThrows('ASSERT (id: :x) { by: :a, mode: "stated" }').message,
      /only matches an existing Proposition/
    )
  })

  test('BELIEF lowers to the three projection targets', () => {
    const bound = lowerOne('FIND(?b) WHERE { ?b BELIEF (?p) }')
    assert.deepEqual(bound.Kql.where_clauses[0].Belief.target, { Proposition: 'p' })

    // The id form is the same reference a Proposition pattern uses, so it
    // lowers to the same shape as `?p (id: ...)`'s matcher (Spec §46.1).
    const byId = lowerOne('FIND(?b) WHERE { ?b BELIEF (id: :pid) }')
    assert.deepEqual(byId.Kql.where_clauses[0].Belief.target, { Id: { Param: 'pid' } })
    const byLiteral = lowerOne('FIND(?b) WHERE { ?b BELIEF (id: "P-1") }')
    assert.deepEqual(byLiteral.Kql.where_clauses[0].Belief.target, {
      Id: { Literal: { String: 'P-1' } }
    })

    const tuple = lowerOne('FIND(?b) WHERE { ?b BELIEF (?s, "timezone", ?o) }')
    assert.ok('Tuple' in tuple.Kql.where_clauses[0].Belief.target)
  })

  test('the two time axes lower independently', () => {
    const cmd = lowerOne('FIND(?x) WHERE { ?x {id: "1"} } AS OF TX :tx FOR TIME :t')
    assert.deepEqual(cmd.Kql.as_of, { Tx: { Param: 'tx' } })
    assert.deepEqual(cmd.Kql.for_time, { Param: 't' })
  })

  test('parameters survive lowering instead of becoming text', () => {
    const cmd = lowerOne('FIND(?x) WHERE { ?x {id: :wanted} } LIMIT :n')
    assert.deepEqual(cmd.Kql.where_clauses[0].Concept.matcher.id, { Param: 'wanted' })
    assert.deepEqual(cmd.Kql.limit, { Param: 'n' })
  })

  test('filters close to the registered function set', () => {
    const cmd = lowerOne(
      'FIND(?x) WHERE { ?x {a: 1} FILTER(IN(?x.name, ["A", "B"]) && ?x.v > 0.8) }'
    )
    const filter = cmd.Kql.where_clauses[1].Filter.expression
    assert.equal(filter.Logical.operator, 'And')
    assert.equal(filter.Logical.left.Function.func, 'In')
    assert.equal(filter.Logical.right.Comparison.operator, 'GreaterThan')
  })

  test('the v2 type-inspection functions are registered', () => {
    for (const [name, func] of [
      ['IS_LITERAL', 'IsLiteral'],
      ['IS_ELEMENT', 'IsElement'],
      ['IS_KIND', 'IsKind'],
      ['LITERAL_TYPE', 'LiteralType']
    ]) {
      const cmd = lowerOne(`FIND(?x) WHERE { ?x {a: 1} FILTER(${name}(?x.v)) }`)
      assert.equal(cmd.Kql.where_clauses[1].Filter.expression.Function.func, func)
    }
  })

  test('an unknown filter function is rejected, not passed through', () => {
    const err = lowerThrows('FIND(?x) WHERE { ?x {a: 1} FILTER(SOUNDS_LIKE(?x.n)) }')
    assert.match(err.message, /not a KIP filter function/)
    assert.equal(err.code, 'KIP_1001')
  })

  test('an aggregate cannot appear inside FILTER', () => {
    const err = lowerThrows('FIND(?x) WHERE { ?x {a: 1} FILTER(COUNT(?x) > 2) }')
    assert.match(err.message, /aggregate and cannot appear inside FILTER/)
  })
})

describe('lower: ASSERT desugaring', () => {
  test('ASSERT becomes ENSURE PROPOSITION + CREATE ASSERTION', () => {
    const cmd = lowerOne(
      'ASSERT (:alice, "prefers", :dark) { by: :alice, mode: "stated", confidence: 0.9 }'
    )
    const { clauses, explicit_transaction } = cmd.Kml
    assert.equal(explicit_transaction, false)
    assert.equal(clauses.length, 2)
    assert.ok('EnsureProposition' in clauses[0])
    assert.ok('CreateAssertion' in clauses[1])

    // The Assertion points at the Proposition the same statement ensured.
    const handle = clauses[0].EnsureProposition.handle
    const fields = Object.fromEntries(clauses[1].CreateAssertion.set_fields)
    assert.deepEqual(fields.proposition, { Handle: handle })
    assert.deepEqual(fields.asserted_by, { Param: 'alice' })
    assert.deepEqual(fields.mode, { Value: { String: 'stated' } })
    assert.deepEqual(fields.confidence, { Value: { Number: 0.9 } })
  })

  test('SUPERSEDING adds exactly one SUPERSEDE clause, nothing more', () => {
    const cmd = lowerOne(
      'ASSERT ?a (:alice, "tz", "+01:00") { by: :alice, mode: "stated" } SUPERSEDING :old'
    )
    assert.equal(cmd.Kml.clauses.length, 3)
    const supersede = cmd.Kml.clauses[2].SupersedeAssertion
    assert.deepEqual(supersede.target, { Param: 'old' })
    assert.deepEqual(supersede.by, { Handle: 'a' })
  })

  test('the sugar member names map onto Assertion fields', () => {
    const cmd = lowerOne(
      'ASSERT (:a, "p", :b) { by: :x, mode: "stated", at: :t, valid: :v, evidence: :e, stance: "reject" }'
    )
    const assertion = cmd.Kml.clauses[1].CreateAssertion
    const fields = Object.fromEntries(assertion.set_fields)
    // `evidence` is a reserved Core *structural* field, so it is not here.
    assert.deepEqual(Object.keys(fields).sort(), [
      'asserted_at',
      'asserted_by',
      'mode',
      'proposition',
      'stance',
      'valid_time'
    ])
    assert.deepEqual(fields.stance, { Value: { String: 'reject' } })
  })

  test('evidence becomes a role-qualified structural citation', () => {
    // Spec §55.1 desugars `evidence:` to SET STRUCTURAL {("evidence", ref)
    // {role: "support"}} — it is topology, not a plain field.
    const one = lowerOne('ASSERT (:a, "p", :b) { by: :x, mode: "stated", evidence: :msg }')
    const assertion = one.Kml.clauses[1].CreateAssertion
    assert.equal(Object.fromEntries(assertion.set_fields).evidence, undefined)
    assert.deepEqual(assertion.set_structural, [
      {
        field: { Name: 'evidence' },
        value: { Param: 'msg' },
        options: { role: { Value: { String: 'support' } } }
      }
    ])
  })

  test('an evidence array cites each artifact as its own edge', () => {
    const cmd = lowerOne(
      'ASSERT (:a, "p", :b) { by: :x, mode: "stated", evidence: [:e1, ?e2] }'
    )
    const edges = cmd.Kml.clauses[1].CreateAssertion.set_structural
    assert.equal(edges.length, 2)
    assert.deepEqual(edges.map((e) => e.value), [
      { Param: 'e1' },
      { Handle: 'e2' }
    ])
    assert.ok(edges.every((e) => e.options.role.Value.String === 'support'))
  })

  test('no evidence leaves the structural plane untouched', () => {
    const cmd = lowerOne('ASSERT (:a, "p", :b) { by: :x, mode: "stated" }')
    assert.equal(cmd.Kml.clauses[1].CreateAssertion.set_structural, null)
  })

  test('the default stance is materialized, not left to the engine', () => {
    const cmd = lowerOne('ASSERT (:a, "p", :b) { by: :x, mode: "stated" }')
    const fields = Object.fromEntries(cmd.Kml.clauses[1].CreateAssertion.set_fields)
    assert.deepEqual(fields.stance, { Value: { String: 'support' } })
  })

  test('two handle-less ASSERTs in one MUTATE do not collide', () => {
    // The handle is optional and recording two attributed claims in one
    // transaction is the commonest KML pattern, so the synthetic handles
    // must differ — and must be unreachable from user syntax.
    const cmd = lowerOne(`MUTATE {
      ASSERT (:a, "p", :b) { by: :x, mode: "stated" }
      ASSERT (:c, "q", :d) { by: :x, mode: "stated" }
    }`)
    assert.equal(cmd.Kml.clauses.length, 4)
    const handles = cmd.Kml.clauses.map(
      (c) => (c.EnsureProposition ?? c.CreateAssertion).handle
    )
    assert.equal(new Set(handles).size, 4, 'every synthetic handle is distinct')
    // `#` cannot occur in a KIP identifier, so no user handle can collide.
    assert.ok(handles.every((h) => h.includes('#')))
  })

  test('a user handle cannot collide with a synthetic one', () => {
    lowerOne(`MUTATE {
      ASSERT ?x (:a, "p", :b) { by: :y, mode: "stated" }
      CREATE CONCEPT ?x__proposition { TYPE "T" }
    }`)
  })

  test('key: becomes the retry-safe client key', () => {
    const cmd = lowerOne('ASSERT (:a, "p", :b) { by: :x, mode: "stated", key: :k }')
    assert.deepEqual(cmd.Kml.clauses[1].CreateAssertion.client_key, { Param: 'k' })
  })

  test('an Assertion needs an assertor and a mode', () => {
    assert.match(
      lowerThrows('ASSERT (:a, "p", :b) { mode: "stated" }').message,
      /requires by:/
    )
    assert.match(
      lowerThrows('ASSERT (:a, "p", :b) { by: :x }').message,
      /requires mode:/
    )
  })

  test('an unknown sugar member is rejected rather than dropped', () => {
    assert.match(
      lowerThrows('ASSERT (:a, "p", :b) { by: :x, mode: "stated", trust: 0.9 }')
        .message,
      /not an ASSERT member/
    )
  })
})

describe('lower: KML invariants', () => {
  test('MUTATE flattens ASSERT sugar into the one transaction', () => {
    const cmd = lowerOne(`MUTATE {
      CREATE EVIDENCE ?e { SET FIELDS {evidence_class: "tool_result"} }
      ASSERT ?a (:alice, "tz", "+01:00") { by: :alice, mode: "stated", evidence: ?e }
    }`)
    assert.equal(cmd.Kml.explicit_transaction, true)
    assert.deepEqual(cmd.Kml.clauses.map((c) => Object.keys(c)[0]), [
      'CreateEvidence',
      'EnsureProposition',
      'CreateAssertion'
    ])
  })

  test('a duplicate local handle makes forward references ambiguous', () => {
    const err = lowerThrows(`MUTATE {
      CREATE CONCEPT ?x { TYPE "A" }
      CREATE CONCEPT ?x { TYPE "B" }
    }`)
    assert.match(err.message, /duplicate local handle \?x/)
  })

  test('UPSERT identity must be stable, never a name', () => {
    assert.match(
      lowerThrows('UPSERT CONCEPT ?p { MATCH {type: "Project", name: "KIP"} SET FIELDS {a: 1} }')
        .message,
      /must match on a stable identity/
    )
    // `id` and `key` both qualify.
    lowerOne('UPSERT CONCEPT ?p { MATCH {key: "kip-2"} SET FIELDS {a: 1} }')
    lowerOne('UPSERT CONCEPT ?p { MATCH {id: "C-1"} SET FIELDS {a: 1} }')
  })

  test('engine-maintained state is never author-writable', () => {
    for (const field of ['_system', 'governance', 'space_id']) {
      const err = lowerThrows(
        `UPDATE ?c SET ATTRIBUTES {${field}: 1} WHERE { ?c {id: "1"} }`
      )
      assert.match(err.message, /engine-maintained state/)
    }
  })

  test('Assertion epistemic payload cannot be rewritten by UPDATE', () => {
    for (const field of ['stance', 'confidence', 'asserted_by', 'asserted_at', 'mode']) {
      const err = lowerThrows(
        `UPDATE ?a SET FIELDS {${field}: 0.5} WHERE { ?a ASSERTION {id: "A-1"} }`
      )
      assert.match(err.message, /immutable Assertion payload/)
      assert.match(err.message, /SUPERSEDING/)
    }
  })

  test('Evidence payload is corrected, never edited', () => {
    const err = lowerThrows(
      'UPDATE ?e SET FIELDS {payload: :new} WHERE { ?e EVIDENCE {id: "E-1"} }'
    )
    assert.match(err.message, /CORRECT EVIDENCE/)
  })

  test('a Proposition tuple is immutable', () => {
    const err = lowerThrows(
      'UPDATE ?p SET FIELDS {object: "x"} WHERE { ?p (?s, "pred", ?o) }'
    )
    assert.match(err.message, /immutable Proposition tuple/)
  })

  test('mutable state on the same kinds still updates', () => {
    lowerOne(
      'UPDATE ?a SET FACET "MnemonicState" {memory_strength: 0.4} WHERE { ?a ASSERTION {id: "A-1"} }'
    )
    lowerOne('UPDATE ?c SET ATTRIBUTES {note: "ok"} WHERE { ?c {type: "Person"} }')
  })

  test('UNSET STRUCTURAL lowers to per-reference removals on mutable Concept topology', () => {
    const upsert = lowerOne(`
      UPSERT CONCEPT ?exp {
        MATCH { id: :exp_id }
        UNSET STRUCTURAL { ("has_step", ?wrong) ("involves", :bob) }
      }`).Kml.clauses[0].UpsertConcept
    assert.deepEqual(upsert.unset_structural, [
      { field: { Name: 'has_step' }, value: { Handle: 'wrong' } },
      { field: { Name: 'involves' }, value: { Param: 'bob' } }
    ])

    const update = lowerOne(
      'UPDATE ?exp UNSET STRUCTURAL { ("has_step", ?wrong) } WHERE { ?exp {id: :exp_id} }'
    ).Kml.clauses[0].Update
    assert.deepEqual(update.actions[0], {
      UnsetStructural: [{ field: { Name: 'has_step' }, value: { Handle: 'wrong' } }]
    })

    // An empty block removes nothing and is almost certainly a mistake.
    assert.match(
      lowerThrows('UPDATE ?e UNSET STRUCTURAL {} WHERE { ?e {} }').message,
      /list at least one/
    )
  })

  test('record kinds keep their topology: structural mutation targets Concepts only', () => {
    // Spec §17.5 — citations, lineage and provenance topology are not
    // reachable through UPDATE, in either direction.
    for (const action of ['SET STRUCTURAL { ("evidence", ?e) }', 'UNSET STRUCTURAL { ("evidence", ?e) }']) {
      assert.match(
        lowerThrows(`UPDATE ?a ${action} WHERE { ?a ASSERTION {id: "A-1"} }`).message,
        /immutable payload/
      )
      assert.match(
        lowerThrows(`UPDATE ?ev ${action} WHERE { ?ev EVIDENCE {id: "E-1"} }`).message,
        /CORRECT EVIDENCE/
      )
      assert.match(
        lowerThrows(`UPDATE ?act ${action} WHERE { ?act ACTIVITY {id: "X-1"} }`).message,
        /TRANSITION ACTIVITY/
      )
      assert.match(
        lowerThrows(`UPDATE ?p ${action} WHERE { ?p (?s, "pred", ?o) }`).message,
        /no structural fields/
      )
    }
    // A Concept target, or a direct target whose kind is unknown statically, passes.
    lowerOne('UPDATE ?c UNSET STRUCTURAL { ("has_step", ?s) } WHERE { ?c {type: "Experience"} }')
    lowerOne('UPDATE :exp UNSET STRUCTURAL { ("has_step", :s) }')
  })

  test('a direct-target UPDATE lowers with where_clauses = null, like the removal family', () => {
    const cmd = lowerOne('UPDATE :exp SET FACET "MnemonicState" {salience: 0.9}')
    const update = cmd.Kml.clauses[0].Update
    assert.deepEqual(update.target, { Param: 'exp' })
    assert.equal(update.where_clauses, null)
    assert.equal(update.limit, null)

    // The immutable-plane checks do not depend on a WHERE being present.
    assert.match(
      lowerThrows('UPDATE "C-1" SET ATTRIBUTES {_system: 1}').message,
      /_system/
    )
    // A guarding WHERE on a direct target is still lowered as written.
    const guarded = lowerOne('UPDATE "C-1" SET ATTRIBUTES {a: 1} WHERE { ?c {id: "C-1"} }')
    assert.equal(guarded.Kml.clauses[0].Update.where_clauses.length, 1)
  })

  test('an update expression may read only the target', () => {
    lowerOne(
      'UPDATE ?m SET FACET "F" {v: MUL(?m.v, :d)} WHERE { ?m {type: "T"} }'
    )
    const err = lowerThrows(
      'UPDATE ?m SET FACET "F" {v: MUL(?other.v, :d)} WHERE { ?m {type: "T"} }'
    )
    assert.match(err.message, /may read only the target \?m/)
  })

  test('update functions are arity-checked', () => {
    assert.match(
      lowerThrows('UPDATE ?m SET FIELDS {v: CLAMP(?m.v, 0)} WHERE { ?m {a: 1} }')
        .message,
      /takes 3 arguments, found 2/
    )
    assert.match(
      lowerThrows('UPDATE ?m SET FIELDS {v: SQRT(?m.v)} WHERE { ?m {a: 1} }').message,
      /not a KIP update function/
    )
  })

  test('the removal ladder lowers to four distinct clauses', () => {
    assert.ok('Archive' in lowerOne('ARCHIVE :t').Kml.clauses[0])
    assert.ok('Tombstone' in lowerOne('TOMBSTONE :t').Kml.clauses[0])
    assert.ok('Purge' in lowerOne('PURGE :t CONFIRM "PURGE"').Kml.clauses[0])
    assert.ok(
      'SetRetention' in
        lowerOne('SET RETENTION :t {retention_class: "standard"}').Kml.clauses[0]
    )
  })

  test('LIMIT lowers on every WHERE-scanning mutation', () => {
    const cases = [
      ['ARCHIVE :t WHERE { ?x {a: 1} } LIMIT 200', 'Archive'],
      ['TOMBSTONE :t WHERE { ?x {a: 1} } LIMIT :n', 'Tombstone'],
      ['PURGE :t WHERE { ?x {a: 1} } LIMIT 10 CONFIRM "PURGE"', 'Purge'],
      ['SET RETENTION :t {a: 1} WHERE { ?x {a: 1} } LIMIT 50', 'SetRetention'],
      ['RETRACT ASSERTION :a WHERE { ?a ASSERTION {b: 1} } LIMIT 5', 'RetractAssertion']
    ]
    for (const [source, tag] of cases) {
      const clause = lowerOne(source).Kml.clauses[0]
      assert.ok(tag in clause, source)
      assert.notEqual(clause[tag].limit, null, `limit lost for: ${source}`)
    }
  })

  test('an omitted LIMIT lowers to null, not to a default bound', () => {
    // A missing bound means "no bound"; inventing one would silently change
    // how much cognitive state a sweep touches.
    const clause = lowerOne('ARCHIVE :t WHERE { ?x {a: 1} }').Kml.clauses[0]
    assert.equal(clause.Archive.limit, null)
  })

  test('a structural edge keeps its options', () => {
    const cmd = lowerOne(
      'CREATE CONCEPT ?e { SET STRUCTURAL { ("has_step", ?s) {index: 0} } }'
    )
    const [edge] = cmd.Kml.clauses[0].CreateConcept.set_structural
    assert.deepEqual(edge.field, { Name: 'has_step' })
    assert.deepEqual(edge.value, { Handle: 's' })
    assert.deepEqual(edge.options, { index: { Value: { Number: 0 } } })
  })

  test('a parameter nested inside a value keeps its binding', () => {
    // `data_value` admits a parameter at any depth, so a payload object is
    // not plain JSON — the hole has to survive lowering.
    const cmd = lowerOne(`CREATE EVIDENCE ?e {
      SET FIELDS {
        evidence_class: "tool_result",
        payload: { mode: "external", content_ref: :content_ref }
      }
    }`)
    const fields = Object.fromEntries(cmd.Kml.clauses[0].CreateEvidence.set_fields)
    assert.deepEqual(fields.payload, {
      Object: [
        ['mode', { Value: { String: 'external' } }],
        ['content_ref', { Param: 'content_ref' }]
      ]
    })
    // A wholly literal sibling still collapses to one plain value.
    assert.deepEqual(fields.evidence_class, { Value: { String: 'tool_result' } })
  })

  test('a fully literal object collapses instead of nesting', () => {
    const cmd = lowerOne('CREATE EVIDENCE ?e { SET FIELDS {a: {b: [1, 2]}} }')
    const fields = Object.fromEntries(cmd.Kml.clauses[0].CreateEvidence.set_fields)
    assert.deepEqual(fields.a, {
      Value: { Object: { b: { Array: [{ Number: 1 }, { Number: 2 }] } } }
    })
  })

  test('a schema symbol may be a parameter', () => {
    const cmd = lowerOne('CREATE CONCEPT ?c { TYPE :t SET FACET :f {a: 1} }')
    assert.deepEqual(cmd.Kml.clauses[0].CreateConcept.type, { Param: 't' })
    assert.deepEqual(cmd.Kml.clauses[0].CreateConcept.set_facets[0].facet, {
      Param: 'f'
    })
  })
})

describe('lower: META', () => {
  test('DESCRIBE targets lower to their tagged forms', () => {
    assert.deepEqual(lowerOne('DESCRIBE PROTOCOL').Meta.Describe, 'Protocol')
    assert.deepEqual(
      lowerOne('DESCRIBE PROJECTION CAPABILITY').Meta.Describe,
      'ProjectionCapability'
    )
    assert.deepEqual(lowerOne('DESCRIBE TYPE :t').Meta.Describe, {
      Type: { Param: 't' }
    })
    assert.deepEqual(
      lowerOne('DESCRIBE TRANSACTION BY IDEMPOTENCY KEY :k').Meta.Describe,
      { TransactionByIdempotencyKey: { Param: 'k' } }
    )
  })

  test('SEARCH keeps every modifier distinct', () => {
    const cmd = lowerOne(
      'SEARCH COGNITION :term WITH TYPE :t MODE "hybrid" THRESHOLD 0.5 AS OF SEQ :s LIMIT 10'
    )
    assert.equal(cmd.Meta.Search.target, 'Cognition')
    assert.deepEqual(cmd.Meta.Search.mode, { Literal: { String: 'hybrid' } })
    assert.deepEqual(cmd.Meta.Search.as_of_seq, { Param: 's' })
  })

  test('EXPORT CAPSULE carries its selection and options', () => {
    const cmd = lowerOne(
      'EXPORT CAPSULE ?r WHERE { ?r {type: "T"} } WITH {closure: "referential"} AS OF SEQ :s'
    )
    assert.deepEqual(cmd.Meta.ExportCapsule.target, { Handle: 'r' })
    assert.deepEqual(cmd.Meta.ExportCapsule.options, {
      closure: { Value: { String: 'referential' } }
    })
    assert.deepEqual(cmd.Meta.ExportCapsule.as_of, { Seq: { Param: 's' } })
  })

  test('HISTORY and CHANGES lower to their two forms each', () => {
    assert.ok('Element' in lowerOne('HISTORY ELEMENT :id').Meta.History)
    assert.ok('Space' in lowerOne('HISTORY SPACE').Meta.History)
    assert.ok('Since' in lowerOne('CHANGES SINCE :c').Meta.Changes)
    assert.ok('AfterSeq' in lowerOne('CHANGES AFTER SEQ :s').Meta.Changes)
  })
})

describe('lower: command boundaries', () => {
  test('a source holding two unrelated commands is not one command', () => {
    const { ast } = parse('DESCRIBE PRIMER\nDESCRIBE CAPABILITIES')
    assert.throws(() => lower(ast), /found several/)
  })

  test('lowerAll accepts a batch', () => {
    const { ast } = parse('DESCRIBE PRIMER\nDESCRIBE CAPABILITIES\nLIST TYPES')
    assert.equal(lowerAll(ast).length, 3)
  })

  test('an empty program is not a command', () => {
    const { ast } = parse('   // just a comment\n')
    assert.throws(() => lower(ast), /found none/)
  })
})

describe('version', () => {
  test('PARSER_VERSION tracks package.json', async () => {
    const pkg = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8')
    )
    assert.equal(PARSER_VERSION, pkg.version)
  })

  test('the spec revision is a KIP revision string', () => {
    assert.match(KIP_SPEC_REVISION, /^v\d+\.\d+(-RC\d+)?$/)
  })
})
