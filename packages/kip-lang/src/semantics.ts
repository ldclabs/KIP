import type { Diagnostic } from './diagnostics.js'
import type {
  Program,
  Statement,
  MutationClause,
  WhereClause,
  WherePattern,
  Expression,
  ObjectLiteral,
  ObjectPattern,
  ScalarValue,
  MutateStatement,
  AssertStatement,
  DefineStatement,
  SetFacetClause,
  SetStructuralClause
} from './ast.js'
import type { Range } from './token.js'
import { parseTimestamp } from './timestamp.js'

/**
 * Best-effort static checks layered on top of the syntax parser.
 *
 * These encode the KIP 2.0 rules that are decidable without a live Schema:
 *   - Core registry values written as literals (stance, mode, search mode);
 *   - the `[0,1]` ranges Core and the Cognitive Memory Profile fix;
 *   - timestamp and time-bound literals (strict UTC milliseconds, Spec §6.5, §25.5);
 *   - the declarations a draft `DEFINE` may not make (Spec §20.16);
 *   - unbounded recall lacking a LIMIT;
 *   - local handles referenced inside a mutation plan that nothing binds.
 *
 * Everything requiring the graph's Schema — whether a symbol resolves, whether
 * a field exists, whether a Projection is sufficiently bounded — is left to
 * the engine, which is the only party that knows the active Schema Environment.
 */
export function analyzeSemantics(program: Program): Diagnostic[] {
  const diags: Diagnostic[] = []
  for (const stmt of program.statements) {
    analyzeStatement(stmt, diags)
  }
  return diags
}

/** Core registries (Spec §20.13). A Schema Package may not shadow these. */
const STANCES = new Set(['support', 'reject', 'uncertain'])
const MODES = new Set([
  'observed',
  'stated',
  'inferred',
  'predicted',
  'hypothetical',
  'imported'
])
const SEARCH_MODES = new Set(['keyword', 'semantic', 'hybrid'])
/**
 * Everything `TRANSITION ... TO` may name (Spec §52.5): Assertion revision,
 * Evidence correction, Activity status, and the storage lifecycle any element
 * has. The engine matches the state to the target's kind; the toolkit can only
 * reject a word that belongs to none of them.
 */
const TRANSITION_STATES = new Set([
  'retracted',
  'superseded',
  'corrected',
  'running',
  'completed',
  'failed',
  'cancelled',
  'archived',
  'tombstoned'
])
/** Moves that name the replacing element with `BY`. */
const TRANSITION_WITH_BY = new Set(['superseded', 'corrected'])
/** Moves that may finalize an Activity's fields and topology. */
const ACTIVITY_STATES = new Set(['running', 'completed', 'failed', 'cancelled'])
const EVIDENCE_ROLES = new Set(['support', 'challenge', 'context'])

/** Signals the Profile fixes to `[0,1]`; none of them is truth. */
const UNIT_INTERVAL_FIELDS = new Set([
  'confidence',
  'memory_strength',
  'salience',
  'utility',
  'threshold'
])

/**
 * Core fields typed `Timestamp` wherever a statement writes them (Spec §6.5,
 * schemas/kip-element.schema.json), and whether the field admits `null`: an
 * Activity that has not ended and a retention record without an expiry do,
 * a claim's own instant and an observation's do not.
 */
const TIMESTAMP_FIELDS = new Map<string, { nullable: boolean }>([
  ['asserted_at', { nullable: false }],
  ['observed_at', { nullable: false }],
  ['started_at', { nullable: true }],
  ['ended_at', { nullable: true }],
  ['expires_at', { nullable: true }]
])

function analyzeStatement(stmt: Statement, diags: Diagnostic[]): void {
  switch (stmt.kind) {
    case 'FindStatement':
      checkWhere(stmt.where, !!stmt.limit, diags)
      checkSearchPatterns(stmt.where.patterns, diags)
      if (stmt.forTime) checkTimestamp(stmt.forTime.value, 'FOR TIME', diags)
      break

    case 'DescribeStatement':
      if (stmt.atTime) checkTimestamp(stmt.atTime, 'AT TIME', diags)
      break

    case 'MutateStatement':
      checkMutate(stmt, diags)
      for (const clause of stmt.clauses) analyzeMutationClause(clause, diags)
      break

    case 'SearchStatement':
      if (stmt.mode) {
        checkEnum(stmt.mode, SEARCH_MODES, 'SEARCH MODE', diags)
      }
      if (stmt.threshold && stmt.threshold.kind === 'NumberLiteral') {
        checkUnitInterval('THRESHOLD', stmt.threshold.value, stmt.threshold.range, diags)
      }
      break

    default:
      analyzeMutationClause(stmt as MutationClause, diags)
  }
}

function analyzeMutationClause(stmt: Statement, diags: Diagnostic[]): void {
  switch (stmt.kind) {
    case 'AssertStatement':
      checkAssert(stmt, diags)
      break

    case 'CreateConceptStatement':
    case 'UpsertConceptStatement':
    case 'CreateEvidenceStatement':
    case 'CreateActivityStatement':
    case 'CreateAssertionStatement':
      if (stmt.setFields) checkAssignmentValues(stmt.setFields.assignments, diags)
      for (const facet of stmt.setFacets) checkFacet(facet, diags)
      checkStructural(stmt.setStructural, diags)
      break

    case 'DefineStatement':
      checkDefine(stmt, diags)
      break

    case 'UpdateStatement':
      for (const action of stmt.actions) {
        if (action.kind === 'SetFacetClause') checkFacet(action, diags)
        // Core fields are Core-typed wherever they are written, so an UPDATE
        // that sets one gets the same check `CREATE ASSERTION` already gets.
        else if (action.kind === 'SetFieldsClause') {
          checkAssignmentValues(action.assignments, diags)
        } else if (action.kind === 'SetStructuralClause') {
          checkStructural(action, diags)
        }
      }
      if (stmt.where) checkWhere(stmt.where, !!stmt.limit, diags)
      break

    // The target's kind is not known statically, so only the vocabulary is
    // checkable: a state no kind has, a `BY` on a move that takes none, a
    // finalize clause on a move that is not an Activity's.
    case 'TransitionStatement': {
      checkEnum(stmt.to, TRANSITION_STATES, 'TRANSITION TO', diags)
      if (stmt.to.kind === 'StringLiteral') {
        const to = stmt.to.parsed
        if (TRANSITION_WITH_BY.has(to) && !stmt.by) {
          diags.push({
            range: stmt.to.range,
            severity: 'error',
            message: `TRANSITION TO "${to}" names the replacing element with BY`,
            code: 'KIP_2001'
          })
        }
        if (!TRANSITION_WITH_BY.has(to) && stmt.by && TRANSITION_STATES.has(to)) {
          diags.push({
            range: stmt.by.range,
            severity: 'error',
            message: `TRANSITION TO "${to}" takes no BY`,
            code: 'KIP_2001'
          })
        }
        if (stmt.finalize.length > 0 && !ACTIVITY_STATES.has(to) && TRANSITION_STATES.has(to)) {
          diags.push({
            range: stmt.finalize[0].range,
            severity: 'error',
            message: `TRANSITION TO "${to}" cannot finalize fields or topology; only a pending Activity does`,
            code: 'KIP_2001'
          })
        }
      }
      for (const clause of stmt.finalize) {
        if (clause.kind === 'SetFieldsClause') checkAssignmentValues(clause.assignments, diags)
        else checkStructural(clause, diags)
      }
      if (stmt.where) checkWhere(stmt.where, !!stmt.limit, diags)
      break
    }

    // Spec §52.7 names seven statements whose WHERE can select an unbounded
    // set and which SHOULD therefore carry a LIMIT. Warning on the read and on
    // UPDATE while staying silent on the removal ladder had it backwards: an
    // over-broad PURGE is the one that cannot be undone.
    case 'PurgeStatement':
    case 'PurgePayloadStatement':
      if (stmt.where) checkWhere(stmt.where, !!stmt.limit, diags)
      break

    // The retention record is Core-typed too: `expires_at` is a Timestamp or
    // null (Spec §6.5).
    case 'SetRetentionStatement':
      checkAssignmentValues(stmt.assignments, diags)
      if (stmt.where) checkWhere(stmt.where, !!stmt.limit, diags)
      break
  }
}

/**
 * `by` and `mode` carry the whole epistemic commitment, so a literal that is
 * not in the Core registry is a mistake the toolkit can name now rather than
 * letting the engine reject the whole transaction later.
 */
function checkAssert(stmt: AssertStatement, diags: Diagnostic[]): void {
  for (const entry of stmt.assignments.entries) {
    if (entry.key === 'mode') {
      checkEnum(entry.value, MODES, 'ASSERT mode', diags)
    } else if (entry.key === 'stance') {
      checkEnum(entry.value, STANCES, 'ASSERT stance', diags)
    } else if (entry.key === 'confidence' && entry.value.kind === 'NumberLiteral') {
      checkUnitInterval('confidence', entry.value.value, entry.value.range, diags)
    } else if (entry.key === 'at') {
      checkTimestamp(entry.value, 'ASSERT at', diags)
    } else if (entry.key === 'valid') {
      checkValidTime(entry.value, 'ASSERT valid', diags)
    } else if (entry.key === 'context') {
      checkContext(entry.value, diags)
    }
  }

  // An observation with no cited artifact is still a valid Assertion, but it
  // is the shape that most often should have carried Evidence.
  const mode = stmt.assignments.entries.find((e) => e.key === 'mode')
  const hasEvidence = stmt.assignments.entries.some((e) => e.key === 'evidence')
  const at = stmt.assignments.entries.find((e) => e.key === 'at')
  const hasAt = at !== undefined && at.value.kind !== 'NullLiteral'
  // Only a written start sets the start key: `valid: {until: ...}` alone does
  // not, and neither does `from: null`, which states no start (Spec §25.2). A
  // parameter or variable may carry a `from`, so it is given the benefit of
  // the doubt; a literal of the wrong shape is known not to.
  const valid = stmt.assignments.entries.find((e) => e.key === 'valid')
  const writesFrom =
    valid !== undefined &&
    (isLiteral(valid.value)
      ? valid.value.kind === 'ObjectLiteral' &&
        valid.value.entries.some((e) => e.key === 'from' && e.value.kind !== 'NullLiteral')
      : true)

  // A claim taken from captured material was made when the source says, not
  // when this write runs. Without `at` (or a written `valid.from`) it takes the
  // transaction time as its start key (Spec §13.2, §25.4), so an old claim
  // recorded late would end a current value it predates.
  if (hasEvidence && !hasAt && !writesFrom) {
    diags.push({
      range: stmt.assignments.range,
      severity: 'info',
      message:
        'ASSERT cites evidence but gives no at: asserted_at defaults to the transaction time, which is the claim\'s start key; a claim recorded later than it was made should carry at: <the source\'s observed time> (Spec §13.2, §25.4)',
      code: 'KIP_2103'
    })
  }
  if (
    mode &&
    mode.value.kind === 'StringLiteral' &&
    mode.value.parsed === 'observed' &&
    !hasEvidence
  ) {
    diags.push({
      range: stmt.assignments.range,
      severity: 'info',
      message:
        'mode: "observed" without evidence: an observation normally cites the artifact it was observed from',
      code: 'KIP_2101'
    })
  }
}

function checkFacet(clause: SetFacetClause, diags: Diagnostic[]): void {
  checkAssignmentValues(clause.assignments, diags)
}

/**
 * `role` on an `("evidence", ...)` citation comes from the Core registry
 * (Spec §20.13, §56.2), so a misspelling is as checkable here as a bad
 * `stance`. Other structural fields carry engine- or package-defined options,
 * which only the Schema Environment can judge.
 */
function checkStructural(
  clause: SetStructuralClause | undefined,
  diags: Diagnostic[]
): void {
  if (!clause) return
  for (const edge of clause.assignments) {
    if (edge.field.kind === 'ParameterRef' || edge.field.parsed !== 'evidence') {
      continue
    }
    const role = edge.options?.entries.find((e) => e.key === 'role')
    if (role) checkEnum(role.value, EVIDENCE_ROLES, 'Evidence role', diags)
  }
}

/**
 * Core fields are Core-typed wherever they are written — a `SET FIELDS`, a
 * Facet, a TRANSITION finalize, a retention record — so every assignment
 * object goes through this one check: registry values, `[0,1]` ranges,
 * Timestamps and `valid_time`.
 */
function checkAssignmentValues(
  object: ObjectLiteral,
  diags: Diagnostic[]
): void {
  for (const entry of object.entries) {
    if (
      UNIT_INTERVAL_FIELDS.has(entry.key) &&
      entry.value.kind === 'NumberLiteral'
    ) {
      checkUnitInterval(entry.key, entry.value.value, entry.value.range, diags)
    }
    if (entry.key === 'stance') checkEnum(entry.value, STANCES, 'stance', diags)
    if (entry.key === 'mode') checkEnum(entry.value, MODES, 'mode', diags)
    const timestamp = TIMESTAMP_FIELDS.get(entry.key)
    if (timestamp) checkTimestamp(entry.value, entry.key, diags, timestamp.nullable)
    else if (entry.key === 'valid_time') checkValidTime(entry.value, 'valid_time', diags)
  }
}

function checkEnum(
  value: Expression | ScalarValue,
  allowed: Set<string>,
  label: string,
  diags: Diagnostic[]
): void {
  // A parameter is bound at execution time; only a written literal is checkable.
  if (value.kind !== 'StringLiteral') return
  if (allowed.has(value.parsed)) return
  diags.push({
    range: value.range,
    severity: 'error',
    message: `${label} must be one of ${[...allowed].join(', ')}, got "${value.parsed}"`,
    code: 'KIP_2001'
  })
}

function checkUnitInterval(
  field: string,
  value: number,
  range: Range,
  diags: Diagnostic[]
): void {
  if (value >= 0 && value <= 1) return
  diags.push({
    range,
    severity: 'error',
    message: `${field} must be within [0, 1], got ${value}`,
    code: 'KIP_2001'
  })
}

// ---------------------------------------------------------------------------
// Time literals
// ---------------------------------------------------------------------------

/** A value whose shape is fixed by the source, as opposed to one bound at execution time. */
function isLiteral(value: Expression | ScalarValue): boolean {
  switch (value.kind) {
    case 'StringLiteral':
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'ArrayLiteral':
    case 'ObjectLiteral':
      return true
    default:
      return false
  }
}

/**
 * A protocol instant is `YYYY-MM-DDTHH:mm:ss.SSSZ` on a real calendar date
 * (Spec §6.5): a string, never a number, an object or null — `null` is not a
 * timestamp, and only a field that admits absence may carry it. The engine
 * rejects anything else rather than normalizing it, so a written literal is
 * checkable here; a parameter is bound at execution time.
 */
function checkTimestamp(
  value: Expression | ScalarValue,
  label: string,
  diags: Diagnostic[],
  nullable = false
): string | null {
  if (value.kind === 'StringLiteral') {
    try {
      parseTimestamp(value.parsed)
      return value.parsed
    } catch {
      diags.push({
        range: value.range,
        severity: 'error',
        message: `${label} must be a UTC timestamp YYYY-MM-DDTHH:mm:ss.SSSZ on a real calendar date, got "${value.parsed}" (Spec §6.5); a coarse date is a time bound {earliest, latest} (Spec §25.5)`,
        code: 'KIP_2001'
      })
      return null
    }
  }
  if (value.kind === 'NullLiteral') {
    if (!nullable) {
      diags.push({
        range: value.range,
        severity: 'error',
        message: `${label} is never null: null is not a timestamp (Spec §6.5); omit the member instead`,
        code: 'KIP_2001'
      })
    }
    return null
  }
  if (isLiteral(value)) {
    diags.push({
      range: value.range,
      severity: 'error',
      message: `${label} must be a UTC timestamp string YYYY-MM-DDTHH:mm:ss.SSSZ (Spec §6.5)${
        value.kind === 'ObjectLiteral' ? '; a time bound {earliest, latest} belongs to a valid endpoint, not here (Spec §25.5)' : ''
      }`,
      code: 'KIP_2001'
    })
  }
  return null
}

/** `valid_time` is `{from?, until?}`, each endpoint a time point (Spec §13.2, §25.5). */
function checkValidTime(value: Expression, label: string, diags: Diagnostic[]): void {
  if (!isLiteral(value)) return
  if (value.kind !== 'ObjectLiteral') {
    diags.push({
      range: value.range,
      severity: 'error',
      message: `${label} is an object {from, until}, each an instant, a time bound {earliest, latest} or null (Spec §13.2, §25.5)`,
      code: 'KIP_2001'
    })
    return
  }
  for (const entry of value.entries) {
    if (entry.key === 'from' || entry.key === 'until') {
      checkTimePoint(entry.value, `${label}.${entry.key}`, diags)
    } else {
      diags.push({
        range: entry.range,
        severity: 'error',
        message: `${label} has only from and until, got ${entry.key}`,
        code: 'KIP_2001'
      })
    }
  }
}

/** An exact Timestamp, a time bound `{earliest?, latest?}`, or null (Spec §25.5). */
function checkTimePoint(value: Expression, label: string, diags: Diagnostic[]): void {
  if (value.kind !== 'ObjectLiteral') {
    checkTimestamp(value, label, diags, true)
    return
  }
  const bound: Record<string, string | null> = {}
  for (const entry of value.entries) {
    if (entry.key !== 'earliest' && entry.key !== 'latest') {
      diags.push({
        range: entry.range,
        severity: 'error',
        message: `a time bound has only earliest and latest, got ${entry.key} in ${label}`,
        code: 'KIP_2001'
      })
      continue
    }
    bound[entry.key] = checkTimestamp(entry.value, `${label}.${entry.key}`, diags)
  }
  if (value.entries.length === 0) {
    diags.push({
      range: value.range,
      severity: 'error',
      message: `a time bound in ${label} needs earliest, latest or both; an unknown endpoint is written as null`,
      code: 'KIP_2001'
    })
  }
  if (bound.earliest && bound.latest && bound.earliest > bound.latest) {
    diags.push({
      range: value.range,
      severity: 'error',
      message: `a time bound in ${label} needs earliest <= latest`,
      code: 'KIP_2001'
    })
  }
}

/**
 * ASSERT `context` lowers to `context_refs`, an exact reference array
 * (Spec §25.3, §55.1). A parameter may bind the whole set.
 */
function checkContext(value: Expression, diags: Diagnostic[]): void {
  if (value.kind === 'ParameterRef') return
  if (value.kind !== 'ArrayLiteral') {
    diags.push({
      range: value.range,
      severity: 'error',
      message: 'ASSERT context is an array of context references, e.g. context: [:task]',
      code: 'KIP_2001'
    })
    return
  }
  for (const element of value.elements) {
    if (
      element.kind === 'NumberLiteral' ||
      element.kind === 'BooleanLiteral' ||
      element.kind === 'NullLiteral' ||
      element.kind === 'ArrayLiteral'
    ) {
      diags.push({
        range: element.range,
        severity: 'error',
        message: 'each ASSERT context entry is a reference to a context Concept',
        code: 'KIP_2001'
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Draft vocabulary
// ---------------------------------------------------------------------------

/**
 * What a draft symbol may not declare (Spec §20.15, §20.16): authority over
 * the data is a claim only an installed package makes, and a draft type is
 * open and optional. Only written literals are judged.
 */
function checkDefine(stmt: DefineStatement, diags: Diagnostic[]): void {
  const members = new Map(stmt.definition.entries.map((e) => [e.key, e.value]))
  const reject = (range: Range, message: string): void => {
    const cited = message.includes('(Spec §') ? message : `${message} (Spec §20.16)`
    diags.push({ range, severity: 'error', message: cited, code: 'KIP_2001' })
  }

  if (stmt.defineKind === 'PREDICATE') {
    const openWorld = members.get('open_world')
    if (openWorld?.kind === 'BooleanLiteral' && !openWorld.value) {
      reject(openWorld.range, 'a draft Predicate cannot declare open_world: false; a closed-world reading is authority only an installed package claims')
    }
    const complete = members.get('complete')
    if (complete?.kind === 'BooleanLiteral' && complete.value) {
      reject(complete.range, 'a draft Predicate cannot declare complete: true; exclusive-value completeness is authority only an installed package claims')
    }
    const functionalBy = members.get('functional_by')
    if (functionalBy) {
      checkEnum(functionalBy, new Set(['object_type']), 'functional_by', diags)
      const functional = members.get('functional')
      if (functional?.kind === 'BooleanLiteral' && functional.value) {
        reject(functionalBy.range, 'functional_by cannot be combined with functional: true (Spec §20.15)')
      }
      // The partition is the object's Concept Type, so the object is declared as
      // Concepts: `concept_types`, or `kinds` naming only "Concept".
      const object = members.get('object')
      if (object?.kind === 'ObjectLiteral') {
        const kinds = object.entries.find((e) => e.key === 'kinds')?.value
        const nonConcept =
          object.entries.some((e) => e.key === 'literal_types') ||
          (kinds?.kind === 'ArrayLiteral' &&
            kinds.elements.some((k) => k.kind === 'StringLiteral' && k.parsed !== 'Concept'))
        if (nonConcept) {
          reject(functionalBy.range, 'functional_by partitions by Concept Type, so its object must be Concepts ({kinds: ["Concept"]} or concept_types), not literal_types or another kind (Spec §20.15)')
        }
      }
    }
    return
  }

  if (!members.has('description')) {
    reject(stmt.definition.range, 'a draft Concept Type declares a description')
  }
  for (const key of ['facets', 'structural_fields']) {
    const value = members.get(key)
    if (value) reject(value.range, `a draft Concept Type declares no ${key}`)
  }
  const attributes = members.get('attributes')
  if (attributes?.kind !== 'ObjectLiteral') return
  for (const entry of attributes.entries) {
    if (entry.key === 'open' && entry.value.kind === 'BooleanLiteral' && !entry.value.value) {
      reject(entry.value.range, 'draft Concept Type attributes are open')
    }
    if (entry.key !== 'fields' || entry.value.kind !== 'ObjectLiteral') continue
    for (const field of entry.value.entries) {
      if (field.value.kind !== 'ObjectLiteral') continue
      const required = field.value.entries.find((e) => e.key === 'required')
      if (required?.value.kind === 'BooleanLiteral' && required.value.value) {
        reject(required.value.range, `draft Concept Type attribute ${field.key} cannot be required`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Handles
// ---------------------------------------------------------------------------

/**
 * Handles are block-local and forward references are allowed, so binding is
 * checked against the whole plan rather than in source order. A reference
 * nothing binds is a typo the engine would only find at validation time.
 */
function checkMutate(stmt: MutateStatement, diags: Diagnostic[]): void {
  const bound = new Set<string>()
  for (const clause of stmt.clauses) {
    const handle = handleNameOf(clause)
    if (handle) bound.add(handle)
  }

  const referenced: { name: string; range: Range }[] = []
  for (const clause of stmt.clauses) collectHandleRefs(clause, referenced)

  for (const ref of referenced) {
    if (!bound.has(ref.name)) {
      diags.push({
        range: ref.range,
        severity: 'error',
        message: `?${ref.name} is not bound by any clause in this MUTATE block`,
        code: 'KIP_2102'
      })
    }
  }
}

function handleNameOf(clause: MutationClause): string | null {
  switch (clause.kind) {
    case 'CreateConceptStatement':
    case 'UpsertConceptStatement':
    case 'CreateEvidenceStatement':
    case 'CreateAssertionStatement':
    case 'CreateActivityStatement':
      return clause.handle.name.slice(1)
    case 'EnsurePropositionStatement':
    case 'AssertStatement':
      return clause.handle ? clause.handle.name.slice(1) : null
    default:
      return null
  }
}

/** Collects `?handle` uses in value positions, where they must resolve. */
function collectHandleRefs(
  clause: MutationClause,
  out: { name: string; range: Range }[]
): void {
  const fromObject = (object: ObjectLiteral | undefined) => {
    if (!object) return
    for (const entry of object.entries) fromExpression(entry.value)
  }
  const fromExpression = (expr: Expression) => {
    if (expr.kind === 'VariableRef') {
      out.push({ name: expr.name.slice(1), range: expr.range })
    } else if (expr.kind === 'ArrayLiteral') {
      for (const element of expr.elements) fromExpression(element)
    } else if (expr.kind === 'ObjectLiteral') {
      for (const entry of expr.entries) fromExpression(entry.value)
    } else if (expr.kind === 'FunctionCallExpr') {
      for (const arg of expr.args) fromExpression(arg)
    }
  }

  switch (clause.kind) {
    case 'CreateConceptStatement':
    case 'UpsertConceptStatement':
      fromObject(clause.setFields?.assignments)
      fromObject(clause.setAttributes?.assignments)
      for (const facet of clause.setFacets) fromObject(facet.assignments)
      for (const edge of clause.setStructural?.assignments ?? []) {
        fromExpression(edge.value)
      }
      break

    case 'CreateEvidenceStatement':
    case 'CreateAssertionStatement':
    case 'CreateActivityStatement':
      fromObject(clause.setFields?.assignments)
      for (const facet of clause.setFacets) fromObject(facet.assignments)
      for (const edge of clause.setStructural?.assignments ?? []) {
        fromExpression(edge.value)
      }
      break

    case 'AssertStatement':
      fromObject(clause.assignments)
      if (clause.superseding?.kind === 'VariableRef') {
        out.push({
          name: clause.superseding.name.slice(1),
          range: clause.superseding.range
        })
      }
      break

    case 'TransitionStatement':
      // `BY ?new` resolves inside the plan; a `?target` is bound by WHERE or
      // by a handle, so only the replacing element is a plan reference.
      if (clause.by && clause.by.kind === 'VariableRef') {
        out.push({ name: clause.by.name.slice(1), range: clause.by.range })
      }
      for (const fin of clause.finalize) {
        if (fin.kind === 'SetFieldsClause') fromObject(fin.assignments)
        else for (const edge of fin.assignments) fromExpression(edge.value)
      }
      break
  }
}

// ---------------------------------------------------------------------------
// Unbounded recall
// ---------------------------------------------------------------------------

/** A Search Pattern takes the same MODE and THRESHOLD registry as SEARCH. */
function checkSearchPatterns(patterns: WherePattern[], diags: Diagnostic[]): void {
  for (const pattern of patterns) {
    if (pattern.kind === 'SearchPattern') {
      if (pattern.mode) checkEnum(pattern.mode, SEARCH_MODES, 'SEARCH MODE', diags)
      if (pattern.threshold && pattern.threshold.kind === 'NumberLiteral') {
        checkUnitInterval('THRESHOLD', pattern.threshold.value, pattern.threshold.range, diags)
      }
    } else if (
      pattern.kind === 'OptionalClause' ||
      pattern.kind === 'UnionClause' ||
      pattern.kind === 'NotClause'
    ) {
      checkSearchPatterns(pattern.patterns, diags)
    }
  }
}

function checkWhere(
  where: WhereClause,
  hasLimit: boolean,
  diags: Diagnostic[]
): void {
  if (hasLimit) return
  if (where.patterns.length === 0) return

  // A pattern that constrains nothing enumerates the Space. That is a real
  // query, but at scale it is almost always an omitted LIMIT.
  if (where.patterns.every(isUnconstrained)) {
    diags.push({
      range: where.range,
      severity: 'warning',
      message:
        'this pattern constrains nothing and will scan the whole MemorySpace; add a LIMIT or a more specific match',
      code: 'KIP_4002'
    })
  }
}

function isUnconstrained(pattern: WherePattern): boolean {
  switch (pattern.kind) {
    case 'ConceptPattern':
      return isEmptyMatcher(pattern.matcher)
    case 'AssertionPattern':
    case 'EvidencePattern':
    case 'ActivityPattern':
      return isEmptyMatcher(pattern.matcher)
    case 'PropositionPattern':
      // `(id: ...)` names one Proposition, so it never scans.
      if (pattern.tuple.id) return false
      return (
        !!pattern.tuple.subject &&
        !!pattern.tuple.object &&
        isOpenTerm(pattern.tuple.subject) &&
        isOpenTerm(pattern.tuple.object)
      )
    default:
      return false
  }
}

function isEmptyMatcher(matcher: ObjectPattern): boolean {
  return matcher.members.length === 0
}

function isOpenTerm(term: Expression | ObjectPattern): boolean {
  if (term.kind === 'VariableRef') return true
  if (term.kind === 'ObjectPattern') return term.members.length === 0
  return false
}
