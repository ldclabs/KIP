import type {
  Program,
  Statement,
  MutationClause as CstMutationClause,
  FindStatement,
  AsOfClause,
  OrderItem,
  WhereClause as CstWhereClause,
  WherePattern,
  PropositionTuple,
  Term as CstTerm,
  PredicateAtom,
  RawPredicateExpression,
  ObjectPattern,
  ObjectLiteral,
  ObjectEntry,
  Expression,
  ScalarValue,
  SchemaSymbol,
  TargetRef,
  MutateStatement,
  CreateConceptStatement,
  UpsertConceptStatement,
  EnsurePropositionStatement,
  AssertStatement,
  CreateEvidenceStatement,
  CreateAssertionStatement,
  CreateActivityStatement,
  UpdateStatement as CstUpdateStatement,
  UpdateAction as CstUpdateAction,
  SetFacetClause,
  SetStructuralClause,
  UnsetField,
  RetractAssertionStatement,
  SupersedeAssertionStatement,
  CorrectEvidenceStatement,
  TransitionActivityStatement,
  SetRetentionStatement,
  ArchiveStatement,
  TombstoneStatement,
  PurgeStatement,
  MergeConceptStatement,
  DescribeStatement,
  ListStatement,
  SearchStatement,
  VerifyStatement,
  ValidateStatement,
  PreviewStatement,
  HistoryStatement,
  ChangesStatement,
  SnapshotStatement,
  ExportCapsuleStatement
} from './ast.js'
import { invalidSyntax } from './errors.js'
import type {
  AggregationFunction,
  Assignments,
  AsOf,
  BeliefTarget,
  Command,
  ComparisonOperator,
  ConceptCreate,
  ConceptUpsert,
  DescribeTarget,
  DotPathVar,
  ElementRef,
  EnsureProposition,
  FacetAssignment,
  FacetUnset,
  FilterExpression,
  FilterFunction,
  FilterOperand,
  FindExpression,
  HistoryCommand,
  BoundValue,
  KipValue,
  KmlStatement,
  KqlQuery,
  ListTarget,
  MatchValue,
  MetaCommand,
  MutationClause,
  MutationValue,
  ObjectMatcher,
  OrderByItem,
  PathStep,
  PredAtom,
  PredPathAtom,
  PredTerm,
  PropositionMatcher,
  RecordCreate,
  Scalar,
  SearchTarget,
  StructuralEdge,
  SymbolRef,
  Term,
  UpdateAction,
  UpdateExpr,
  UpdateFunction,
  ValidateTarget,
  VerifyTarget,
  WhereClause
} from './exec-ast.js'
import type { Range } from './token.js'

const AGGREGATIONS = new Map<string, AggregationFunction>([
  ['COUNT', 'Count'],
  ['SUM', 'Sum'],
  ['AVG', 'Avg'],
  ['MIN', 'Min'],
  ['MAX', 'Max']
])

const FILTER_FUNCTIONS = new Map<string, FilterFunction>([
  ['CONTAINS', 'Contains'],
  ['STARTS_WITH', 'StartsWith'],
  ['ENDS_WITH', 'EndsWith'],
  ['REGEX', 'Regex'],
  ['IN', 'In'],
  ['IS_NULL', 'IsNull'],
  ['IS_NOT_NULL', 'IsNotNull'],
  ['IS_LITERAL', 'IsLiteral'],
  ['IS_ELEMENT', 'IsElement'],
  ['IS_KIND', 'IsKind'],
  ['LITERAL_TYPE', 'LiteralType']
])

const UPDATE_FUNCTIONS = new Map<string, UpdateFunction>([
  ['ADD', 'Add'],
  ['MUL', 'Mul'],
  ['CLAMP', 'Clamp'],
  ['COALESCE', 'Coalesce']
])

const UPDATE_ARITY: Record<UpdateFunction, number> = {
  Add: 2,
  Mul: 2,
  Coalesce: 2,
  Clamp: 3
}

const COMPARISONS = new Map<string, ComparisonOperator>([
  ['==', 'Equal'],
  ['!=', 'NotEqual'],
  ['<', 'LessThan'],
  ['>', 'GreaterThan'],
  ['<=', 'LessEqual'],
  ['>=', 'GreaterEqual']
])

/**
 * Engine-owned state no cognitive mutation may write (Spec §6.3, §2.11).
 *
 * These are checked by name on every mutation, not just on UPDATE: author
 * content that could rewrite engine truth or its own authority is exactly
 * what "external cognition cannot self-escalate authority" forbids.
 */
const PROTECTED_FIELDS = new Set([
  '_system',
  'governance',
  'space_id',
  'space_seq'
])

/**
 * Assertion payload that is immutable after creation (Spec §13.7).
 *
 * Changing epistemic commitment means a new Assertion plus supersession, so
 * an UPDATE naming one of these is the `EpistemicRevisionRequired` mistake
 * caught statically wherever the WHERE block says the target is an Assertion.
 */
const ASSERTION_IMMUTABLE = new Set([
  'proposition_id',
  'proposition',
  'asserted_by',
  'stance',
  'mode',
  'confidence',
  'asserted_at',
  'valid_time',
  'evidence_refs'
])

/** Evidence payload and observation identity are immutable (Spec §15.5). */
const EVIDENCE_IMMUTABLE = new Set([
  'evidence_class',
  'payload',
  'content_digest',
  'media_type',
  'observed_at'
])

/** A Proposition tuple is immutable after creation (Spec §12.5). */
const PROPOSITION_IMMUTABLE = new Set(['subject', 'predicate', 'object'])

/**
 * Lowers a parsed program carrying exactly one command.
 *
 * KIP's request envelope binds one command to one result, so a source text
 * that holds two statements is not a command — it is a batch, and silently
 * running the first would answer a question the caller did not ask. Use
 * {@link lowerAll} for multi-statement text such as a schema capsule.
 *
 * @throws {KipSyntaxError} on anything that is not one executable command.
 */
export function lower(program: Program): Command {
  const [first, second] = program.statements
  if (!first) {
    throw invalidSyntax('expected a KIP command, found none')
  }
  if (second) {
    throw invalidSyntax(
      'expected one KIP command, found several: wrap consecutive mutations in ' +
        'MUTATE { ... } to make them one transaction, or use lowerAll for a batch',
      second.range
    )
  }
  return lowerStatement(first)
}

/** Lowers every statement in a multi-command source text. */
export function lowerAll(program: Program): Command[] {
  if (program.statements.length === 0) {
    throw invalidSyntax('expected at least one KIP command, found none')
  }
  return program.statements.map(lowerStatement)
}

export function lowerStatement(stmt: Statement): Command {
  switch (stmt.kind) {
    case 'FindStatement':
      return { Kql: lowerFind(stmt) }

    case 'MutateStatement':
      return { Kml: lowerMutate(stmt) }

    case 'CreateConceptStatement':
    case 'UpsertConceptStatement':
    case 'EnsurePropositionStatement':
    case 'AssertStatement':
    case 'CreateEvidenceStatement':
    case 'CreateAssertionStatement':
    case 'CreateActivityStatement':
    case 'UpdateStatement':
    case 'RetractAssertionStatement':
    case 'SupersedeAssertionStatement':
    case 'CorrectEvidenceStatement':
    case 'TransitionActivityStatement':
    case 'SetRetentionStatement':
    case 'ArchiveStatement':
    case 'TombstoneStatement':
    case 'PurgeStatement':
    case 'MergeConceptStatement':
      return {
        Kml: {
          explicit_transaction: false,
          clauses: lowerMutationClause(stmt, 0)
        }
      }

    default:
      return { Meta: lowerMeta(stmt) }
  }
}

// ---------------------------------------------------------------------------
// KQL
// ---------------------------------------------------------------------------

function lowerFind(stmt: FindStatement): KqlQuery {
  if (stmt.projections.length === 0) {
    throw invalidSyntax('FIND requires at least one projection', stmt.range)
  }
  return {
    find_clause: {
      expressions: stmt.projections.map((p) => lowerFindExpression(p))
    },
    where_clauses: lowerWhere(stmt.where),
    as_of: stmt.asOf ? lowerAsOf(stmt.asOf) : null,
    for_time: stmt.forTime ? lowerScalar(stmt.forTime.value) : null,
    epistemic: stmt.epistemic ? lowerBoundObject(stmt.epistemic.options) : null,
    order_by: stmt.orderBy ? stmt.orderBy.items.map(lowerOrderItem) : null,
    limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
    cursor: stmt.cursor ? lowerScalar(stmt.cursor.value) : null
  }
}

function lowerAsOf(clause: AsOfClause): AsOf {
  const value = lowerScalar(clause.value)
  switch (clause.basis) {
    case 'SEQ':
      return { Seq: value }
    case 'TX':
      return { Tx: value }
    case 'TIME':
      return { Time: value }
  }
}

function lowerFindExpression(expr: Expression): FindExpression {
  if (expr.kind === 'AggregateExpr') {
    const func = AGGREGATIONS.get(expr.name.toUpperCase())
    if (!func) {
      throw invalidSyntax(`unknown aggregate ${expr.name}`, expr.range)
    }
    return {
      Aggregation: {
        func,
        var: lowerDotPath(expr.argument),
        distinct: expr.distinct
      }
    }
  }
  return { Variable: lowerDotPath(expr) }
}

function lowerOrderItem(item: OrderItem): OrderByItem {
  const direction = item.direction === 'DESC' ? 'Desc' : 'Asc'
  if (item.expression.kind === 'AggregateExpr') {
    const func = AGGREGATIONS.get(item.expression.name.toUpperCase())
    if (!func) {
      throw invalidSyntax(
        `unknown aggregate ${item.expression.name}`,
        item.expression.range
      )
    }
    return {
      variable: lowerDotPath(item.expression.argument),
      direction,
      aggregation: func
    }
  }
  return {
    variable: lowerDotPath(item.expression),
    direction,
    aggregation: null
  }
}

/** A projection or sort key must resolve to one variable plus a path. */
function lowerDotPath(expr: Expression): DotPathVar {
  if (expr.kind === 'VariableRef') {
    return { var: varName(expr.name, expr.range), path: [] }
  }
  if (expr.kind === 'FieldAccess') {
    const path: PathStep[] = expr.steps.map((step) =>
      step.kind === 'DotStep'
        ? { Field: step.name }
        : { Key: step.key.parsed }
    )
    return { var: varName(expr.base.name, expr.base.range), path }
  }
  throw invalidSyntax(
    `expected a variable or a dot path, found ${describeExpression(expr)}`,
    expr.range
  )
}

function lowerWhere(clause: { patterns: WherePattern[] }): WhereClause[] {
  return clause.patterns.map(lowerWherePattern)
}

function lowerWherePattern(pattern: WherePattern): WhereClause {
  switch (pattern.kind) {
    case 'ConceptPattern':
      return {
        Concept: {
          variable: varName(pattern.variable.name, pattern.variable.range),
          matcher: lowerObjectMatcher(pattern.matcher)
        }
      }

    case 'PropositionPattern':
      return {
        Proposition: {
          variable: pattern.variable
            ? varName(pattern.variable.name, pattern.variable.range)
            : null,
          matcher: lowerPropositionMatcher(pattern.tuple)
        }
      }

    case 'AssertionPattern':
      return {
        Assertion: {
          variable: varName(pattern.variable.name, pattern.variable.range),
          matcher: lowerObjectMatcher(pattern.matcher)
        }
      }

    case 'EvidencePattern':
      return {
        Evidence: {
          variable: varName(pattern.variable.name, pattern.variable.range),
          matcher: lowerObjectMatcher(pattern.matcher)
        }
      }

    case 'ActivityPattern':
      return {
        Activity: {
          variable: varName(pattern.variable.name, pattern.variable.range),
          matcher: lowerObjectMatcher(pattern.matcher)
        }
      }

    case 'StructuralPattern':
      return {
        Structural: {
          variable: pattern.variable
            ? varName(pattern.variable.name, pattern.variable.range)
            : null,
          subject: lowerTerm(pattern.subject),
          field: lowerSymbol(pattern.field),
          object: lowerTerm(pattern.object)
        }
      }

    case 'BeliefPattern': {
      let target: BeliefTarget
      if (pattern.proposition) {
        target = {
          Proposition: varName(
            pattern.proposition.name,
            pattern.proposition.range
          )
        }
      } else if (pattern.propositionId) {
        // Same slot, same reference form as `?p PROPOSITION (id: ...)`.
        target = { Id: lowerScalar(pattern.propositionId) }
      } else {
        if (!pattern.subject || !pattern.predicate || !pattern.object) {
          throw invalidSyntax(
            'BELIEF requires one bound Proposition, an (id: ...) reference, or a full (subject, predicate, object) tuple',
            pattern.range
          )
        }
        target = {
          Tuple: {
            subject: lowerTerm(pattern.subject),
            predicate: { Atom: lowerPredAtom(pattern.predicate) },
            object: lowerTerm(pattern.object)
          }
        }
      }
      return {
        Belief: {
          variable: varName(pattern.variable.name, pattern.variable.range),
          target
        }
      }
    }

    case 'BeliefSlotPattern':
      return {
        BeliefSlot: {
          variable: varName(pattern.variable.name, pattern.variable.range),
          subject: lowerTerm(pattern.subject),
          predicate: lowerPredAtom(pattern.predicate)
        }
      }

    case 'FilterClause':
      return { Filter: { expression: lowerFilter(pattern.expression) } }

    case 'NotClause':
      return { Not: pattern.patterns.map(lowerWherePattern) }

    case 'OptionalClause':
      return { Optional: pattern.patterns.map(lowerWherePattern) }

    case 'UnionClause':
      return { Union: pattern.patterns.map(lowerWherePattern) }
  }
}

function lowerPropositionMatcher(tuple: PropositionTuple): PropositionMatcher {
  if (tuple.id) return { Id: lowerScalar(tuple.id) }
  if (!tuple.subject || !tuple.predicate || !tuple.object) {
    throw invalidSyntax(
      'a Proposition expression is either (subject, predicate, object) or (id: ...)',
      tuple.range
    )
  }
  return {
    Tuple: {
      subject: lowerTerm(tuple.subject),
      predicate: lowerPredicate(tuple.predicate),
      object: lowerTerm(tuple.object)
    }
  }
}

/**
 * Resolves the tuple a resolve-or-create statement needs.
 *
 * `(id: ...)` is match-only: it names a Proposition that must already exist,
 * so it cannot drive ENSURE PROPOSITION — or the ASSERT sugar that desugars
 * through it — whose job is to create the tuple when it is absent.
 */
function requireStructuralTuple(
  tuple: PropositionTuple,
  statement: string
): { subject: Term; predicate: PredAtom; object: Term } {
  if (tuple.id) {
    throw invalidSyntax(
      `${statement} needs a (subject, predicate, object) tuple: (id: ...) only matches an ` +
        'existing Proposition, and no structure can be created from an id',
      tuple.range
    )
  }
  const predicate = lowerPredicate(tuple.predicate!)
  if (!('Atom' in predicate)) {
    throw invalidSyntax(
      `${statement} needs one exact predicate; alternation and hop quantifiers are KQL traversal forms`,
      tuple.predicate!.range
    )
  }
  return {
    subject: lowerTerm(tuple.subject!),
    predicate: predicate.Atom,
    object: lowerTerm(tuple.object!)
  }
}

function lowerPredicate(expr: RawPredicateExpression): PredTerm {
  const [only] = expr.atoms
  if (expr.atoms.length === 1 && only && !only.quantifier) {
    return { Atom: lowerPredAtom(only.atom) }
  }
  const path: PredPathAtom[] = expr.atoms.map((atom) => ({
    predicate: lowerPredAtom(atom.atom),
    hops: atom.quantifier
      ? { min: atom.quantifier.min, max: atom.quantifier.max ?? null }
      : null
  }))
  return { Path: path }
}

function lowerPredAtom(atom: PredicateAtom): PredAtom {
  switch (atom.kind) {
    case 'StringLiteral':
      return { Literal: atom.parsed }
    case 'ParameterRef':
      return { Param: paramName(atom.name) }
    case 'VariableRef':
      return { Variable: varName(atom.name, atom.range) }
  }
}

function lowerTerm(term: CstTerm): Term {
  switch (term.kind) {
    case 'VariableRef':
      return { Variable: varName(term.name, term.range) }
    case 'ParameterRef':
      return { Param: paramName(term.name) }
    case 'ObjectPattern':
      return { Match: lowerObjectMatcher(term) }
    case 'PropositionTuple':
      return { Proposition: lowerPropositionMatcher(term) }
    default:
      return { Literal: lowerKipValue(term) }
  }
}

function lowerObjectMatcher(pattern: ObjectPattern): ObjectMatcher {
  const matcher: ObjectMatcher = {}
  for (const member of pattern.members) {
    if (Object.prototype.hasOwnProperty.call(matcher, member.key)) {
      throw invalidSyntax(
        `duplicate match field ${member.key}`,
        member.range
      )
    }
    matcher[member.key] = lowerMatchValue(member.value)
  }
  return matcher
}

function lowerMatchValue(expr: Expression): MatchValue {
  switch (expr.kind) {
    case 'VariableRef':
      return { Variable: varName(expr.name, expr.range) }
    case 'ParameterRef':
      return { Param: paramName(expr.name) }
    case 'ArrayLiteral':
      return { Array: expr.elements.map(lowerMatchValue) }
    case 'ObjectPattern':
      return { Match: lowerObjectMatcher(expr) }
    case 'PropositionTuple':
      return { Proposition: lowerPropositionMatcher(expr) }
    default:
      return { Literal: lowerKipValue(expr) }
  }
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function lowerFilter(expr: Expression): FilterExpression {
  switch (expr.kind) {
    case 'BinaryExpression': {
      if (expr.operator === '&&' || expr.operator === '||') {
        return {
          Logical: {
            left: lowerFilter(expr.left),
            operator: expr.operator === '&&' ? 'And' : 'Or',
            right: lowerFilter(expr.right)
          }
        }
      }
      const operator = COMPARISONS.get(expr.operator)
      if (!operator) {
        throw invalidSyntax(
          `unknown comparison operator ${expr.operator}`,
          expr.range
        )
      }
      return {
        Comparison: {
          left: lowerFilterOperand(expr.left),
          operator,
          right: lowerFilterOperand(expr.right)
        }
      }
    }

    case 'UnaryExpression':
      if (expr.operator === '!') {
        return { Not: lowerFilter(expr.operand) }
      }
      throw invalidSyntax(
        'a filter must be a comparison, a logical combination, a negation or a function call',
        expr.range
      )

    case 'FunctionCallExpr': {
      const func = FILTER_FUNCTIONS.get(expr.name.toUpperCase())
      if (!func) {
        throw invalidSyntax(
          `${expr.name} is not a KIP filter function`,
          expr.range
        )
      }
      return {
        Function: { func, args: expr.args.map(lowerFilterOperand) }
      }
    }

    case 'AggregateExpr':
      // An aggregate summarizes a solution set; a filter runs per candidate
      // row, so there is no set for it to summarize yet.
      throw invalidSyntax(
        `${expr.name} is an aggregate and cannot appear inside FILTER`,
        expr.range
      )

    default:
      throw invalidSyntax(
        `a filter must be a comparison, a logical combination, a negation or a function call, found ${describeExpression(expr)}`,
        expr.range
      )
  }
}

function lowerFilterOperand(expr: Expression): FilterOperand {
  switch (expr.kind) {
    case 'VariableRef':
    case 'FieldAccess':
      return { Variable: lowerDotPath(expr) }
    case 'ParameterRef':
      return { Param: paramName(expr.name) }
    case 'ArrayLiteral':
      if (expr.trailingComma) {
        throw invalidSyntax(
          'a filter list does not allow a trailing comma',
          expr.range
        )
      }
      return { List: expr.elements.map(lowerFilterOperand) }
    case 'UnaryExpression':
      if (expr.operator === '-') {
        return { Negate: lowerFilterOperand(expr.operand) }
      }
      throw invalidSyntax(
        `expected a filter operand, found ${describeExpression(expr)}`,
        expr.range
      )
    case 'AggregateExpr':
      // An aggregate summarizes a solution set; a filter runs per candidate
      // row, so there is no set for it to summarize yet.
      throw invalidSyntax(
        `${expr.name} is an aggregate and cannot appear inside FILTER`,
        expr.range
      )
    case 'FunctionCallExpr':
    case 'BinaryExpression':
      throw invalidSyntax(
        `expected a filter operand, found ${describeExpression(expr)}`,
        expr.range
      )
    default:
      return { Literal: lowerKipValue(expr) }
  }
}

// ---------------------------------------------------------------------------
// KML
// ---------------------------------------------------------------------------

function lowerMutate(stmt: MutateStatement): KmlStatement {
  if (stmt.clauses.length === 0) {
    throw invalidSyntax('MUTATE requires at least one mutation', stmt.range)
  }
  const clauses = stmt.clauses.flatMap((clause, i) =>
    lowerMutationClause(clause, i)
  )
  assertUniqueHandles(clauses, stmt.range)
  return { explicit_transaction: true, clauses }
}

/**
 * Handles are block-local names. Two clauses claiming the same handle make
 * every forward reference to it ambiguous, so the whole plan is rejected
 * rather than resolved by position.
 */
function assertUniqueHandles(clauses: MutationClause[], range: Range): void {
  const seen = new Set<string>()
  for (const clause of clauses) {
    const handle = handleOf(clause)
    if (handle === null) continue
    if (seen.has(handle)) {
      throw invalidSyntax(
        `duplicate local handle ?${handle} in one mutation plan`,
        range
      )
    }
    seen.add(handle)
  }
}

function handleOf(clause: MutationClause): string | null {
  if ('CreateConcept' in clause) return clause.CreateConcept.handle
  if ('UpsertConcept' in clause) return clause.UpsertConcept.handle
  if ('CreateEvidence' in clause) return clause.CreateEvidence.handle
  if ('CreateAssertion' in clause) return clause.CreateAssertion.handle
  if ('CreateActivity' in clause) return clause.CreateActivity.handle
  if ('EnsureProposition' in clause) return clause.EnsureProposition.handle
  return null
}

/**
  * One source statement may lower to several clauses; `ASSERT` is the case.
  *
  * `seq` is the clause's position in its plan, used only to keep synthetic
  * handles distinct between two handle-less ASSERTs in the same transaction.
  */
function lowerMutationClause(
  stmt: CstMutationClause,
  seq: number
): MutationClause[] {
  switch (stmt.kind) {
    case 'CreateConceptStatement':
      return [{ CreateConcept: lowerCreateConcept(stmt) }]
    case 'UpsertConceptStatement':
      return [{ UpsertConcept: lowerUpsertConcept(stmt) }]
    case 'EnsurePropositionStatement':
      return [{ EnsureProposition: lowerEnsureProposition(stmt) }]
    case 'AssertStatement':
      return lowerAssertSugar(stmt, seq)
    case 'CreateEvidenceStatement':
      return [{ CreateEvidence: lowerRecordCreate(stmt) }]
    case 'CreateAssertionStatement':
      return [{ CreateAssertion: lowerRecordCreate(stmt) }]
    case 'CreateActivityStatement':
      return [{ CreateActivity: lowerRecordCreate(stmt) }]
    case 'UpdateStatement':
      return [{ Update: lowerUpdate(stmt) }]
    case 'RetractAssertionStatement':
      return [
        {
          RetractAssertion: {
            target: lowerElementRef(stmt.target),
            where_clauses: stmt.where ? lowerWhere(stmt.where) : null,
            limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
            expect_state: stmt.expectState
              ? lowerScalar(stmt.expectState.value)
              : null
          }
        }
      ]
    case 'SupersedeAssertionStatement':
      return [
        {
          SupersedeAssertion: {
            target: lowerElementRef(stmt.target),
            by: lowerElementRef(stmt.by),
            expect_state: stmt.expectState
              ? lowerScalar(stmt.expectState.value)
              : null
          }
        }
      ]
    case 'CorrectEvidenceStatement':
      return [
        {
          CorrectEvidence: {
            target: lowerElementRef(stmt.target),
            by: lowerElementRef(stmt.by),
            expect_state: stmt.expectState
              ? lowerScalar(stmt.expectState.value)
              : null
          }
        }
      ]
    case 'TransitionActivityStatement':
      return [{ TransitionActivity: lowerTransition(stmt) }]
    case 'SetRetentionStatement':
      return [
        {
          SetRetention: {
            target: lowerElementRef(stmt.target),
            values: lowerAssignments(stmt.assignments, null),
            where_clauses: stmt.where ? lowerWhere(stmt.where) : null,
            limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
            expect_version: stmt.expectVersion
              ? lowerScalar(stmt.expectVersion.value)
              : null
          }
        }
      ]
    case 'ArchiveStatement':
      return [{ Archive: lowerRemoval(stmt) }]
    case 'TombstoneStatement':
      return [{ Tombstone: lowerRemoval(stmt) }]
    case 'PurgeStatement':
      return [{ Purge: lowerPurge(stmt) }]
    case 'MergeConceptStatement':
      return [
        {
          MergeConcept: {
            source: lowerElementRef(stmt.source),
            into: lowerElementRef(stmt.into),
            where_clauses: stmt.where ? lowerWhere(stmt.where) : null,
            expect_version: stmt.expectVersion
              ? lowerScalar(stmt.expectVersion.value)
              : null
          }
        }
      ]
  }
}

function lowerCreateConcept(stmt: CreateConceptStatement): ConceptCreate {
  return {
    handle: varName(stmt.handle.name, stmt.handle.range),
    type: stmt.type ? lowerSymbol(stmt.type.value) : null,
    client_key: stmt.clientKey ? lowerScalar(stmt.clientKey.value) : null,
    name: stmt.name ? lowerScalar(stmt.name.value) : null,
    set_fields: stmt.setFields
      ? lowerAssignments(stmt.setFields.assignments, null)
      : null,
    set_attributes: stmt.setAttributes
      ? lowerAssignments(stmt.setAttributes.assignments, null)
      : null,
    set_facets: stmt.setFacets.map((f) => lowerFacet(f, null)),
    set_structural: stmt.setStructural
      ? lowerStructural(stmt.setStructural, null)
      : null
  }
}

function lowerUpsertConcept(stmt: UpsertConceptStatement): ConceptUpsert {
  const match = stmt.match ? lowerObjectMatcher(stmt.match.pattern) : null

  // Identity for an upsert is `id` or `key`; a name-only match is forbidden
  // because names are mutable grounding state with duplicates allowed, so
  // "the Concept named X" can silently address a different node over time.
  if (match) {
    const fields = Object.keys(match)
    const hasIdentity = fields.includes('id') || fields.includes('key')
    if (!hasIdentity) {
      throw invalidSyntax(
        'UPSERT CONCEPT must match on a stable identity: add {id: ...} or {key: ...} — ' +
          'name is mutable grounding state and never identifies a Concept',
        stmt.match!.range
      )
    }
  }

  return {
    handle: varName(stmt.handle.name, stmt.handle.range),
    match,
    expect_version: stmt.expectVersion
      ? lowerScalar(stmt.expectVersion.value)
      : null,
    set_fields: stmt.setFields
      ? lowerAssignments(stmt.setFields.assignments, null)
      : null,
    set_attributes: stmt.setAttributes
      ? lowerAssignments(stmt.setAttributes.assignments, null)
      : null,
    set_facets: stmt.setFacets.map((f) => lowerFacet(f, null)),
    unset_attributes: stmt.unsetAttributes
      ? lowerUnsetFields(stmt.unsetAttributes.fields)
      : null,
    unset_facets: stmt.unsetFacets.map((f) => ({
      facet: lowerSymbol(f.facet),
      fields: lowerUnsetFields(f.fields)
    })),
    set_structural: stmt.setStructural
      ? lowerStructural(stmt.setStructural, null)
      : null
  }
}

function lowerEnsureProposition(
  stmt: EnsurePropositionStatement
): EnsureProposition {
  const triple = requireStructuralTuple(stmt.tuple, 'ENSURE PROPOSITION')
  return {
    handle: stmt.handle ? varName(stmt.handle.name, stmt.handle.range) : null,
    ...triple,
    expect_version: stmt.expectVersion
      ? lowerScalar(stmt.expectVersion.value)
      : null
  }
}

function lowerRecordCreate(
  stmt:
    | CreateEvidenceStatement
    | CreateAssertionStatement
    | CreateActivityStatement
): RecordCreate {
  const fields = stmt.setFields
    ? lowerAssignments(stmt.setFields.assignments, null)
    : null
  return {
    handle: varName(stmt.handle.name, stmt.handle.range),
    client_key: stmt.clientKey ? lowerScalar(stmt.clientKey.value) : null,
    set_fields: fields,
    set_facets: stmt.setFacets.map((f) => lowerFacet(f, null)),
    set_structural: stmt.setStructural
      ? lowerStructural(stmt.setStructural, null)
      : null
  }
}

/**
 * Desugars `ASSERT` into exactly what the Spec defines it as (§55.1):
 * `ENSURE PROPOSITION` + `CREATE ASSERTION`, plus `SUPERSEDE` when written.
 *
 * Nothing else is fabricated. The sugar exists because recording an
 * attributed claim is the hot path, not because it means anything new.
 */
function lowerAssertSugar(
  stmt: AssertStatement,
  seq: number
): MutationClause[] {
  const members = new Map<string, Expression>()
  for (const entry of stmt.assignments.entries) {
    if (members.has(entry.key)) {
      throw invalidSyntax(`duplicate ASSERT member ${entry.key}`, entry.range)
    }
    members.set(entry.key, entry.value)
  }

  const known = new Set([
    'by',
    'mode',
    'stance',
    'confidence',
    'at',
    'valid',
    'evidence',
    'key'
  ])
  for (const [key, value] of members) {
    if (!known.has(key)) {
      throw invalidSyntax(
        `${key} is not an ASSERT member; expected one of ${[...known].join(', ')}`,
        value.range
      )
    }
  }

  // `by` names whose stance this is, and `mode` says how it was arrived at.
  // Neither has a safe default: guessing the actor would forge attribution,
  // and guessing the mode would turn hearsay into observation.
  const by = members.get('by')
  if (!by) {
    throw invalidSyntax(
      'ASSERT requires by: <semantic actor> — an Assertion without an assertor has no epistemic owner',
      stmt.assignments.range
    )
  }
  const mode = members.get('mode')
  if (!mode) {
    throw invalidSyntax(
      'ASSERT requires mode: one of observed, stated, inferred, predicted, hypothetical, imported',
      stmt.assignments.range
    )
  }

  // The Proposition handle is synthesized, so it must collide with neither a
  // user handle nor another ASSERT in the same plan. `#` cannot occur in a KIP
  // identifier, which rules out the first; `seq` is the clause position, which
  // rules out the second — two handle-less ASSERTs in one MUTATE are ordinary
  // input, not a name clash.
  const assertionHandle = stmt.handle
    ? varName(stmt.handle.name, stmt.handle.range)
    : `#assert${seq}`
  const propositionHandle = `${assertionHandle}#proposition`

  const triple = requireStructuralTuple(stmt.tuple, 'ASSERT')

  const clauses: MutationClause[] = [
    {
      EnsureProposition: {
        handle: propositionHandle,
        ...triple,
        expect_version: null
      }
    }
  ]

  const fields: Assignments = [
    ['proposition', { Handle: propositionHandle }],
    ['asserted_by', lowerMutationValue(by, null)],
    ['mode', lowerMutationValue(mode, null)],
    // The normative expansion carries a stance even when the source omitted
    // one, so the default is materialized here rather than left for the
    // engine to re-derive.
    [
      'stance',
      members.has('stance')
        ? lowerMutationValue(members.get('stance')!, null)
        : { Value: { String: 'support' } }
    ]
  ]
  const optional: [string, string][] = [
    ['confidence', 'confidence'],
    ['at', 'asserted_at'],
    ['valid', 'valid_time']
  ]
  for (const [member, field] of optional) {
    const value = members.get(member)
    if (value) fields.push([field, lowerMutationValue(value, null)])
  }

  // `evidence` is a reserved Core *structural* field, not a plain one: the
  // normative desugaring emits `("evidence", ref) {role: "support"}`. An array
  // cites several artifacts, so it becomes one role-qualified edge each.
  const evidenceExpr = members.get('evidence')
  const evidenceEdges: StructuralEdge[] =
    evidenceExpr === undefined
      ? []
      : (evidenceExpr.kind === 'ArrayLiteral'
          ? evidenceExpr.elements
          : [evidenceExpr]
        ).map((ref) => ({
          field: { Name: 'evidence' },
          value: lowerMutationValue(ref, null),
          options: { role: { Value: { String: 'support' } } }
        }))

  const clientKeyExpr = members.get('key')
  clauses.push({
    CreateAssertion: {
      handle: assertionHandle,
      client_key: clientKeyExpr ? lowerScalarExpression(clientKeyExpr) : null,
      set_fields: fields,
      set_facets: [],
      set_structural: evidenceEdges.length > 0 ? evidenceEdges : null
    }
  })

  if (stmt.superseding) {
    clauses.push({
      SupersedeAssertion: {
        target: lowerElementRef(stmt.superseding),
        by: { Handle: assertionHandle },
        expect_state: null
      }
    })
  }

  return clauses
}

function lowerTransition(stmt: TransitionActivityStatement) {
  let setFields: Assignments | null = null
  let setStructural: StructuralEdge[] | null = null
  for (const clause of stmt.finalize) {
    if (clause.kind === 'SetFieldsClause') {
      if (setFields) {
        throw invalidSyntax('duplicate SET FIELDS clause', clause.range)
      }
      setFields = lowerAssignments(clause.assignments, null)
    } else {
      if (setStructural) {
        throw invalidSyntax('duplicate SET STRUCTURAL clause', clause.range)
      }
      setStructural = lowerStructural(clause, null)
    }
  }
  return {
    target: lowerElementRef(stmt.target),
    to: lowerScalar(stmt.to),
    set_fields: setFields,
    set_structural: setStructural,
    expect_state: stmt.expectState ? lowerScalar(stmt.expectState.value) : null
  }
}

function lowerRemoval(stmt: ArchiveStatement | TombstoneStatement) {
  return {
    target: lowerElementRef(stmt.target),
    where_clauses: stmt.where ? lowerWhere(stmt.where) : null,
    limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
    expect_state: stmt.expectState ? lowerScalar(stmt.expectState.value) : null
  }
}

function lowerPurge(stmt: PurgeStatement) {
  if (stmt.confirm.parsed !== 'PURGE') {
    throw invalidSyntax(
      'PURGE must be confirmed with the exact literal "PURGE"',
      stmt.confirm.range
    )
  }
  return {
    target: lowerElementRef(stmt.target),
    where_clauses: stmt.where ? lowerWhere(stmt.where) : null,
    limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
    reference_policy: stmt.referencePolicy
      ? lowerScalar(stmt.referencePolicy)
      : null,
    confirm: 'PURGE'
  }
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

function lowerUpdate(stmt: CstUpdateStatement) {
  if (stmt.actions.length === 0) {
    throw invalidSyntax(
      'UPDATE requires at least one SET or UNSET action',
      stmt.range
    )
  }

  const target = lowerElementRef(stmt.target)
  const targetVar = 'Handle' in target ? target.Handle : null
  const kind =
    targetVar && stmt.where ? boundKindOf(targetVar, stmt.where.patterns) : null

  const actions = stmt.actions.map((action) =>
    lowerUpdateAction(action, targetVar, kind)
  )

  return {
    target,
    expect_version: stmt.expectVersion
      ? lowerScalar(stmt.expectVersion.value)
      : null,
    actions,
    where_clauses: stmt.where ? lowerWhere(stmt.where) : null,
    limit: stmt.limit ? lowerScalar(stmt.limit.value) : null
  }
}

/** Which Core kind the UPDATE target is bound to, when the WHERE block says. */
type BoundKind = 'assertion' | 'evidence' | 'proposition' | 'concept' | 'activity'

function boundKindOf(
  variable: string,
  patterns: WherePattern[]
): BoundKind | null {
  for (const pattern of patterns) {
    switch (pattern.kind) {
      case 'AssertionPattern':
        if (varName(pattern.variable.name, pattern.variable.range) === variable) {
          return 'assertion'
        }
        break
      case 'EvidencePattern':
        if (varName(pattern.variable.name, pattern.variable.range) === variable) {
          return 'evidence'
        }
        break
      case 'ActivityPattern':
        if (varName(pattern.variable.name, pattern.variable.range) === variable) {
          return 'activity'
        }
        break
      case 'ConceptPattern':
        if (varName(pattern.variable.name, pattern.variable.range) === variable) {
          return 'concept'
        }
        break
      case 'PropositionPattern':
        if (
          pattern.variable &&
          varName(pattern.variable.name, pattern.variable.range) === variable
        ) {
          return 'proposition'
        }
        break
      case 'NotClause':
      case 'OptionalClause':
      case 'UnionClause': {
        const nested = boundKindOf(variable, pattern.patterns)
        if (nested) return nested
        break
      }
    }
  }
  return null
}

function lowerUpdateAction(
  action: CstUpdateAction,
  targetVar: string | null,
  kind: BoundKind | null
): UpdateAction {
  switch (action.kind) {
    case 'SetFieldsClause': {
      const assignments = lowerAssignments(action.assignments, targetVar)
      for (const entry of action.assignments.entries) {
        guardImmutableField(entry.key, kind, entry.range)
      }
      return { SetFields: assignments }
    }
    case 'SetAttributesClause': {
      const assignments = lowerAssignments(action.assignments, targetVar)
      for (const entry of action.assignments.entries) {
        guardProtectedField(entry.key, entry.range)
      }
      return { SetAttributes: assignments }
    }
    case 'SetFacetClause':
      return { SetFacet: lowerFacet(action, targetVar) }
    case 'UnsetAttributesClause':
      return { UnsetAttributes: lowerUnsetFields(action.fields) }
    case 'UnsetFacetClause':
      return {
        UnsetFacet: {
          facet: lowerSymbol(action.facet),
          fields: lowerUnsetFields(action.fields)
        }
      }
    case 'SetStructuralClause':
      return { SetStructural: lowerStructural(action, targetVar) }
  }
}

/** Engine-owned state is never author-writable, whatever the element kind. */
function guardProtectedField(field: string, range: Range): void {
  if (PROTECTED_FIELDS.has(field)) {
    throw invalidSyntax(
      `${field} is engine-maintained state and cannot be written by a mutation`,
      range
    )
  }
}

function guardImmutableField(
  field: string,
  kind: BoundKind | null,
  range: Range
): void {
  guardProtectedField(field, range)

  if (kind === 'assertion' && ASSERTION_IMMUTABLE.has(field)) {
    throw invalidSyntax(
      `${field} is immutable Assertion payload: record the change as a new Assertion with SUPERSEDING, ` +
        'never by rewriting the old one',
      range
    )
  }
  if (kind === 'evidence' && EVIDENCE_IMMUTABLE.has(field)) {
    throw invalidSyntax(
      `${field} is immutable Evidence payload: correct it with CORRECT EVIDENCE :old BY :new`,
      range
    )
  }
  if (kind === 'proposition' && PROPOSITION_IMMUTABLE.has(field)) {
    throw invalidSyntax(
      `${field} is part of the immutable Proposition tuple: a different tuple is a different Proposition`,
      range
    )
  }
}

// ---------------------------------------------------------------------------
// Assignments, facets, structural edges
// ---------------------------------------------------------------------------

function lowerAssignments(
  object: ObjectLiteral,
  targetVar: string | null
): Assignments {
  const seen = new Set<string>()
  const out: Assignments = []
  for (const entry of object.entries) {
    if (seen.has(entry.key)) {
      throw invalidSyntax(`duplicate assignment for ${entry.key}`, entry.range)
    }
    seen.add(entry.key)
    out.push([entry.key, lowerMutationValue(entry.value, targetVar)])
  }
  return out
}

function lowerFacet(
  clause: SetFacetClause,
  targetVar: string | null
): FacetAssignment {
  return {
    facet: lowerSymbol(clause.facet),
    values: lowerAssignments(clause.assignments, targetVar)
  }
}

function lowerStructural(
  clause: SetStructuralClause,
  targetVar: string | null
): StructuralEdge[] {
  return clause.assignments.map((assignment) => ({
    field: lowerSymbol(assignment.field),
    value: lowerMutationValue(assignment.value, targetVar),
    options: assignment.options ? lowerBoundObject(assignment.options) : null
  }))
}

function lowerUnsetFields(fields: UnsetField[]): string[] {
  const seen = new Set<string>()
  for (const field of fields) {
    if (seen.has(field.name)) {
      throw invalidSyntax(`duplicate field ${field.name}`, field.range)
    }
    guardProtectedField(field.name, field.range)
    seen.add(field.name)
  }
  return [...seen]
}

function lowerMutationValue(
  expr: Expression,
  targetVar: string | null
): MutationValue {
  if (expr.kind === 'FunctionCallExpr') {
    return { Expr: lowerUpdateExpr(expr, targetVar) }
  }
  if (expr.kind === 'AggregateExpr') {
    throw invalidSyntax(
      `${expr.name} is an aggregate and cannot appear in an assignment`,
      expr.range
    )
  }
  return lowerBoundValue(expr, targetVar)
}

/**
 * Lowers a `data_value`, keeping structure only where something still needs
 * binding. A wholly literal subtree collapses to one `Value`, so an engine
 * that has nothing to substitute never walks a binding tree.
 */
function lowerBoundValue(
  expr: Expression,
  targetVar: string | null
): BoundValue {
  switch (expr.kind) {
    case 'ParameterRef':
      return { Param: paramName(expr.name) }

    case 'VariableRef':
      return { Handle: varName(expr.name, expr.range) }

    case 'FieldAccess': {
      const path = lowerDotPath(expr)
      guardOwnField(path, targetVar, expr.range)
      return { Variable: path }
    }

    case 'ArrayLiteral':
      return isFullyLiteral(expr)
        ? { Value: lowerKipValue(expr) }
        : { Array: expr.elements.map((e) => lowerBoundValue(e, targetVar)) }

    case 'ObjectLiteral':
      return isFullyLiteral(expr)
        ? { Value: lowerKipValue(expr) }
        : {
            Object: expr.entries.map(
              (e) =>
                [e.key, lowerBoundValue(e.value, targetVar)] as [
                  string,
                  BoundValue
                ]
            )
          }

    default:
      return { Value: lowerKipValue(expr) }
  }
}

/** True when nothing in the subtree needs binding at execution time. */
function isFullyLiteral(expr: Expression): boolean {
  switch (expr.kind) {
    case 'StringLiteral':
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
      return true
    case 'ArrayLiteral':
      return expr.elements.every(isFullyLiteral)
    case 'ObjectLiteral':
      return expr.entries.every((e) => isFullyLiteral(e.value))
    case 'UnaryExpression':
      return expr.operator === '-' && isFullyLiteral(expr.operand)
    default:
      return false
  }
}

function lowerUpdateExpr(
  expr: Expression,
  targetVar: string | null
): UpdateExpr {
  switch (expr.kind) {
    case 'FunctionCallExpr': {
      const func = UPDATE_FUNCTIONS.get(expr.name.toUpperCase())
      if (!func) {
        throw invalidSyntax(
          `${expr.name} is not a KIP update function; expected ADD, MUL, CLAMP or COALESCE`,
          expr.range
        )
      }
      const arity = UPDATE_ARITY[func]
      if (expr.args.length !== arity) {
        throw invalidSyntax(
          `${expr.name} takes ${arity} arguments, found ${expr.args.length}`,
          expr.range
        )
      }
      return {
        Function: {
          func,
          args: expr.args.map((arg) => lowerUpdateExpr(arg, targetVar))
        }
      }
    }

    case 'ParameterRef':
      return { Param: paramName(expr.name) }

    case 'NumberLiteral':
      return { Number: expr.value }

    case 'UnaryExpression':
      if (expr.operator === '-' && expr.operand.kind === 'NumberLiteral') {
        return { Number: -expr.operand.value }
      }
      throw invalidSyntax(
        `expected a number, a parameter, the target's own field or a registered function, found ${describeExpression(expr)}`,
        expr.range
      )

    case 'VariableRef':
    case 'FieldAccess': {
      const path = lowerDotPath(expr)
      guardOwnField(path, targetVar, expr.range)
      return { Variable: path }
    }

    default:
      throw invalidSyntax(
        `expected a number, a parameter, the target's own field or a registered function, found ${describeExpression(expr)}`,
        expr.range
      )
  }
}

/**
 * An update expression may read only the element being updated.
 *
 * Reading another variable would make the result depend on a join the
 * statement never declared, so each matched element must be computable from
 * its own row.
 */
function guardOwnField(
  path: DotPathVar,
  targetVar: string | null,
  range: Range
): void {
  if (targetVar !== null && path.var !== targetVar) {
    throw invalidSyntax(
      `an update expression may read only the target ?${targetVar}, found ?${path.var}`,
      range
    )
  }
}

// ---------------------------------------------------------------------------
// META
// ---------------------------------------------------------------------------

function lowerMeta(stmt: Statement): MetaCommand {
  switch (stmt.kind) {
    case 'DescribeStatement':
      return { Describe: lowerDescribe(stmt) }
    case 'ListStatement':
      return { List: lowerList(stmt) }
    case 'SearchStatement':
      return { Search: lowerSearch(stmt) }
    case 'VerifyStatement':
      return {
        Verify: {
          target: VERIFY_TARGETS[stmt.target],
          value: lowerScalar(stmt.value)
        }
      }
    case 'ValidateStatement':
      return {
        Validate: {
          target: VALIDATE_TARGETS[stmt.target],
          value: lowerScalar(stmt.value),
          options: stmt.options ? lowerBoundObject(stmt.options) : null
        }
      }
    case 'PreviewStatement':
      return {
        Preview:
          stmt.target === 'KML'
            ? { Kml: lowerScalar(stmt.value) }
            : {
                ImportCapsule: {
                  capsule: lowerScalar(stmt.value),
                  into: lowerScalar(stmt.into!)
                }
              }
      }
    case 'HistoryStatement':
      return { History: lowerHistory(stmt) }
    case 'ChangesStatement':
      return {
        Changes:
          stmt.mode === 'SINCE'
            ? {
                Since: {
                  cursor: lowerScalar(stmt.value),
                  limit: stmt.limit ? lowerScalar(stmt.limit.value) : null
                }
              }
            : {
                AfterSeq: {
                  seq: lowerScalar(stmt.value),
                  limit: stmt.limit ? lowerScalar(stmt.limit.value) : null
                }
              }
      }
    case 'SnapshotStatement':
      return { Snapshot: { as_of: stmt.asOf ? lowerAsOf(stmt.asOf) : null } }
    case 'ExportCapsuleStatement':
      return { ExportCapsule: lowerExport(stmt) }
    default:
      throw invalidSyntax(
        `${stmt.kind} is not an executable KIP command`,
        stmt.range
      )
  }
}

const VERIFY_TARGETS: Record<VerifyStatement['target'], VerifyTarget> = {
  CAPSULE: 'Capsule',
  SCHEMA_PACKAGE: 'SchemaPackage',
  RECEIPT: 'Receipt',
  BLOB: 'Blob',
  CHECKPOINT: 'Checkpoint'
}

const VALIDATE_TARGETS: Record<ValidateStatement['target'], ValidateTarget> = {
  KQL: 'Kql',
  KML: 'Kml',
  CAPSULE: 'Capsule',
  SCHEMA_PACKAGE: 'SchemaPackage',
  IMPORT_PLAN: 'ImportPlan'
}

const LIST_TARGETS: Record<ListStatement['target'], ListTarget> = {
  SPACES: 'Spaces',
  SCHEMA_PACKAGES: 'SchemaPackages',
  TYPES: 'Types',
  PREDICATES: 'Predicates',
  FACETS: 'Facets',
  STRUCTURAL_FIELDS: 'StructuralFields',
  EPISTEMIC_POLICIES: 'EpistemicPolicies'
}

const SEARCH_TARGETS: Record<SearchStatement['searchKind'], SearchTarget> = {
  CONCEPT: 'Concept',
  PROPOSITION: 'Proposition',
  ASSERTION: 'Assertion',
  EVIDENCE: 'Evidence',
  ACTIVITY: 'Activity',
  COGNITION: 'Cognition'
}

function lowerDescribe(stmt: DescribeStatement): DescribeTarget {
  const value = () => {
    if (!stmt.value) {
      throw invalidSyntax(
        `DESCRIBE ${stmt.target} requires an operand`,
        stmt.range
      )
    }
    return lowerScalar(stmt.value)
  }

  switch (stmt.target) {
    case 'PRIMER':
      return { Primer: { mode: stmt.mode ? lowerScalar(stmt.mode) : null } }
    case 'PROTOCOL':
      return 'Protocol'
    case 'EXECUTION_CONTEXT':
      return 'ExecutionContext'
    case 'CAPABILITIES':
      return 'Capabilities'
    case 'SPACE':
      return { Space: { value: stmt.value ? lowerScalar(stmt.value) : null } }
    case 'SCHEMA_ENVIRONMENT':
      return {
        SchemaEnvironment: { as_of: stmt.asOf ? lowerAsOf(stmt.asOf) : null }
      }
    case 'PACKAGE':
      return { Package: value() }
    case 'TYPE':
      return { Type: value() }
    case 'PREDICATE':
      return { Predicate: value() }
    case 'FACET':
      return { Facet: value() }
    case 'STRUCTURAL_FIELD':
      return { StructuralField: value() }
    case 'COMPATIBILITY':
      if (!stmt.from || !stmt.to) {
        throw invalidSyntax(
          'DESCRIBE COMPATIBILITY requires FROM and TO',
          stmt.range
        )
      }
      return {
        Compatibility: { from: lowerScalar(stmt.from), to: lowerScalar(stmt.to) }
      }
    case 'ERROR':
      return { Error: value() }
    case 'TRANSACTION':
      return { Transaction: value() }
    case 'TRANSACTION_BY_IDEMPOTENCY_KEY':
      return { TransactionByIdempotencyKey: value() }
    case 'SNAPSHOT':
      return { Snapshot: { as_of: stmt.asOf ? lowerAsOf(stmt.asOf) : null } }
    case 'CAPSULE':
      return { Capsule: value() }
    case 'EPISTEMIC_POLICY':
      return {
        EpistemicPolicy: { value: stmt.value ? lowerScalar(stmt.value) : null }
      }
    case 'PROJECTION_CAPABILITY':
      return 'ProjectionCapability'
    case 'TRUST':
      return { Trust: { value: stmt.value ? lowerScalar(stmt.value) : null } }
    case 'ACCESS':
      return {
        Access: { with: stmt.with ? lowerBoundObject(stmt.with) : null }
      }
  }
}

function lowerList(stmt: ListStatement) {
  return {
    target: LIST_TARGETS[stmt.target],
    status: stmt.status ? lowerScalar(stmt.status) : null,
    limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
    cursor: stmt.cursor ? lowerScalar(stmt.cursor.value) : null
  }
}

function lowerSearch(stmt: SearchStatement) {
  return {
    target: SEARCH_TARGETS[stmt.searchKind],
    term: lowerScalar(stmt.term),
    with_type: stmt.withType ? lowerScalar(stmt.withType) : null,
    with_predicate: stmt.withPredicate ? lowerScalar(stmt.withPredicate) : null,
    mode: stmt.mode ? lowerScalar(stmt.mode) : null,
    threshold: stmt.threshold ? lowerScalar(stmt.threshold) : null,
    as_of_seq: stmt.asOfSeq ? lowerScalar(stmt.asOfSeq) : null,
    limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
    cursor: stmt.cursor ? lowerScalar(stmt.cursor.value) : null
  }
}

function lowerHistory(stmt: HistoryStatement): HistoryCommand {
  const paging = {
    from_seq: stmt.fromSeq ? lowerScalar(stmt.fromSeq) : null,
    to_seq: stmt.toSeq ? lowerScalar(stmt.toSeq) : null,
    limit: stmt.limit ? lowerScalar(stmt.limit.value) : null,
    cursor: stmt.cursor ? lowerScalar(stmt.cursor.value) : null
  }
  if (stmt.target === 'SPACE') {
    return { Space: paging }
  }
  if (!stmt.value) {
    throw invalidSyntax('HISTORY ELEMENT requires an element id', stmt.range)
  }
  return { Element: { value: lowerScalar(stmt.value), ...paging } }
}

function lowerExport(stmt: ExportCapsuleStatement) {
  return {
    target: lowerElementRef(stmt.target),
    where_clauses: lowerWhere(stmt.where),
    options: stmt.options ? lowerBoundObject(stmt.options) : null,
    as_of: stmt.asOf ? lowerAsOf(stmt.asOf) : null
  }
}

// ---------------------------------------------------------------------------
// Leaf conversions
// ---------------------------------------------------------------------------

function lowerScalar(value: ScalarValue): Scalar {
  if (value.kind === 'ParameterRef') {
    return { Param: paramName(value.name) }
  }
  return { Literal: lowerKipValue(value) }
}

/** An ASSERT member used where the grammar needs a scalar, e.g. `key:`. */
function lowerScalarExpression(expr: Expression): Scalar {
  if (expr.kind === 'ParameterRef') {
    return { Param: paramName(expr.name) }
  }
  if (
    expr.kind === 'StringLiteral' ||
    expr.kind === 'NumberLiteral' ||
    expr.kind === 'BooleanLiteral' ||
    expr.kind === 'NullLiteral'
  ) {
    return { Literal: lowerKipValue(expr) }
  }
  throw invalidSyntax(
    `expected a literal or :parameter, found ${describeExpression(expr)}`,
    expr.range
  )
}

function lowerSymbol(symbol: SchemaSymbol): SymbolRef {
  return symbol.kind === 'ParameterRef'
    ? { Param: paramName(symbol.name) }
    : { Name: symbol.parsed }
}

function lowerElementRef(ref: TargetRef): ElementRef {
  switch (ref.kind) {
    case 'VariableRef':
      return { Handle: varName(ref.name, ref.range) }
    case 'ParameterRef':
      return { Param: paramName(ref.name) }
    case 'StringLiteral':
      return { Id: ref.parsed }
  }
}

function lowerKipValue(expr: Expression): KipValue {
  switch (expr.kind) {
    case 'StringLiteral':
      return { String: expr.parsed }
    case 'NumberLiteral':
      if (!Number.isFinite(expr.value)) {
        throw invalidSyntax(
          `only finite numbers are valid KIP literals, found ${expr.raw}`,
          expr.range
        )
      }
      return { Number: expr.value }
    case 'BooleanLiteral':
      return { Bool: expr.value }
    case 'NullLiteral':
      return 'Null'
    case 'ArrayLiteral':
      return { Array: expr.elements.map(lowerKipValue) }
    case 'ObjectLiteral':
    case 'ObjectPattern': {
      const entries =
        expr.kind === 'ObjectLiteral' ? expr.entries : expr.members
      const out: Record<string, KipValue> = {}
      for (const entry of entries) {
        out[entry.key] = lowerKipValue(entry.value)
      }
      return { Object: out }
    }
    case 'UnaryExpression':
      if (expr.operator === '-' && expr.operand.kind === 'NumberLiteral') {
        return { Number: -expr.operand.value }
      }
      throw invalidSyntax(
        `expected a value, found ${describeExpression(expr)}`,
        expr.range
      )
    default:
      throw invalidSyntax(
        `expected a value, found ${describeExpression(expr)}`,
        expr.range
      )
  }
}

/**
 * Option and epistemic blocks are `data_value`s, not plain JSON: the grammar
 * lets a parameter stand anywhere inside them.
 */
function lowerBoundObject(object: ObjectLiteral): Record<string, BoundValue> {
  const out: Record<string, BoundValue> = {}
  for (const entry of object.entries) {
    out[entry.key] = lowerBoundValue(entry.value, null)
  }
  return out
}

/** Strips the `?` sigil; the executable form carries bare names. */
function varName(name: string, range: Range): string {
  if (!name.startsWith('?')) {
    throw invalidSyntax(`expected a variable, found ${name}`, range)
  }
  return name.slice(1)
}

/** Strips the `:` sigil; the executable form carries bare names. */
function paramName(name: string): string {
  return name.startsWith(':') ? name.slice(1) : name
}

function describeExpression(expr: Expression): string {
  switch (expr.kind) {
    case 'ParameterRef':
      return `the parameter ${expr.name}`
    case 'VariableRef':
      return `the variable ${expr.name}`
    case 'FunctionCallExpr':
      return `a call to ${expr.name}`
    case 'AggregateExpr':
      return `the aggregate ${expr.name}`
    case 'BinaryExpression':
      return `the operator ${expr.operator}`
    default:
      return expr.kind
  }
}
