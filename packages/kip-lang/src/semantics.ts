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
  SetFacetClause
} from './ast.js'
import type { Range } from './token.js'

/**
 * Best-effort static checks layered on top of the syntax parser.
 *
 * These encode the KIP 2.0 rules that are decidable without a live Schema:
 *   - Core registry values written as literals (stance, mode, search mode);
 *   - the `[0,1]` ranges Core and the Cognitive Memory Profile fix;
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
const ASSERTION_STATES = new Set([
  'active',
  'retracted',
  'superseded',
  'expired'
])
const ACTIVITY_TERMINAL = new Set(['completed', 'failed', 'cancelled'])

/** Signals the Profile fixes to `[0,1]`; none of them is truth. */
const UNIT_INTERVAL_FIELDS = new Set([
  'confidence',
  'memory_strength',
  'salience',
  'utility',
  'threshold'
])

function analyzeStatement(stmt: Statement, diags: Diagnostic[]): void {
  switch (stmt.kind) {
    case 'FindStatement':
      checkWhere(stmt.where, !!stmt.limit, diags)
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
      for (const facet of stmt.setFacets) checkFacet(facet, diags)
      break

    case 'UpsertConceptStatement':
      for (const facet of stmt.setFacets) checkFacet(facet, diags)
      break

    case 'CreateAssertionStatement':
      if (stmt.setFields) {
        checkAssignmentValues(stmt.setFields.assignments, diags)
      }
      for (const facet of stmt.setFacets) checkFacet(facet, diags)
      break

    case 'CreateEvidenceStatement':
    case 'CreateActivityStatement':
      for (const facet of stmt.setFacets) checkFacet(facet, diags)
      break

    case 'UpdateStatement':
      for (const action of stmt.actions) {
        if (action.kind === 'SetFacetClause') checkFacet(action, diags)
      }
      checkWhere(stmt.where, !!stmt.limit, diags)
      break

    case 'RetractAssertionStatement':
    case 'ArchiveStatement':
    case 'TombstoneStatement':
      if (stmt.expectState) {
        checkEnum(stmt.expectState.value, ASSERTION_STATES, 'EXPECT STATE', diags)
      }
      break

    case 'TransitionActivityStatement':
      checkEnum(stmt.to, ACTIVITY_TERMINAL, 'TRANSITION ACTIVITY TO', diags)
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
    }
  }

  // An observation with no cited artifact is still a valid Assertion, but it
  // is the shape that most often should have carried Evidence.
  const mode = stmt.assignments.entries.find((e) => e.key === 'mode')
  const hasEvidence = stmt.assignments.entries.some((e) => e.key === 'evidence')
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
        severity: 'warning',
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

    case 'SupersedeAssertionStatement':
    case 'CorrectEvidenceStatement':
      for (const ref of [clause.target, clause.by]) {
        if (ref.kind === 'VariableRef') {
          out.push({ name: ref.name.slice(1), range: ref.range })
        }
      }
      break
  }
}

// ---------------------------------------------------------------------------
// Unbounded recall
// ---------------------------------------------------------------------------

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
