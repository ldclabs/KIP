import type {
  ConceptBlock as CstConceptBlock,
  ConceptMatcher as CstConceptMatcher,
  CursorClause,
  DeleteStatement as CstDeleteStatement,
  DescribeStatement,
  ExportStatement,
  Expression,
  FindStatement,
  LimitClause,
  MergeStatement as CstMergeStatement,
  ObjectEntry,
  OrderByKey,
  Program,
  PropositionBlock as CstPropositionBlock,
  PropositionEndpoint,
  PropositionPattern,
  PredicateExpr,
  SearchStatement,
  SetAttributes,
  SetMetadata,
  Statement,
  UpdateStatement as CstUpdateStatement,
  UpsertStatement,
  WhereClause as CstWhereClause,
  WherePattern,
  WithMetadata
} from './ast.js'
import { invalidSyntax } from './errors.js'
import type {
  AggregationFunction,
  Command,
  ComparisonOperator,
  ConceptBlock,
  ConceptMatcher,
  DeleteStatement,
  DescribeTarget,
  DotPathVar,
  ExportCommand,
  FilterExpression,
  FilterFunction,
  FilterOperand,
  FindExpression,
  Json,
  KipValue,
  KqlQuery,
  OrderByItem,
  PredTerm,
  PropositionBlock,
  PropositionMatcher,
  SearchCommand,
  SearchMode,
  SetProposition,
  TargetTerm,
  UpdateExpr,
  UpdateFunction,
  UpdateValue,
  UpsertItem,
  WhereClause
} from './exec-ast.js'
import type { Range } from './token.js'

/**
 * `LIMIT` is a `usize` in the reference grammar, which is 32-bit on the
 * WebAssembly target every JavaScript KIP engine is compiled for.
 */
const MAX_LIMIT = 0xffffffff

/** A KIP integer is whatever an i64 or a u64 can hold, so the union of both. */
const I64_MIN = -(2n ** 63n)
const U64_MAX = 2n ** 64n - 1n

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
  ['IS_NOT_NULL', 'IsNotNull']
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

const CONCEPT_IDENTITY_HELP =
  'a concept must be addressed by {id: "<id>"} or {type: "<Type>", name: "<name>"} — ' +
  '{type: ...} or {name: ...} alone identifies no single node'

const PROPOSITION_IDENTITY_HELP =
  'a proposition must be addressed by (id: "<id>") or by a subject, a literal ' +
  'predicate and an object that each identify one element'

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
  if (!second) return lowerStatement(first)

  // Consecutive UPSERT blocks are one command, not a batch: a schema capsule
  // is written as several `UPSERT { ... }` in sequence and applies as a unit.
  // Anything else following a complete command is trailing content.
  if (program.statements.every((s) => s.kind === 'UpsertStatement')) {
    return {
      Kml: {
        Upsert: (program.statements as UpsertStatement[]).map(lowerUpsert)
      }
    }
  }
  throw invalidSyntax(
    `expected a single KIP command, found ${program.statements.length}`,
    second.range
  )
}

/** Lowers every command in a multi-statement program, in source order. */
export function lowerAll(program: Program): Command[] {
  return program.statements.map(lowerStatement)
}

/** Lowers one statement. */
export function lowerStatement(stmt: Statement): Command {
  switch (stmt.kind) {
    case 'FindStatement':
      return { Kql: lowerFind(stmt) }
    case 'UpsertStatement':
      return { Kml: { Upsert: [lowerUpsert(stmt)] } }
    case 'UpdateStatement':
      return { Kml: { Update: lowerUpdate(stmt) } }
    case 'MergeStatement':
      return { Kml: { Merge: lowerMerge(stmt) } }
    case 'DeleteStatement':
      return { Kml: { Delete: lowerDelete(stmt) } }
    case 'DescribeStatement':
      return { Meta: { Describe: lowerDescribe(stmt) } }
    case 'SearchStatement':
      return { Meta: { Search: lowerSearch(stmt) } }
    case 'ExportStatement': {
      const exportCmd: ExportCommand = {
        target: varName(stmt.target, stmt.range),
        where_clauses: lowerWhere(stmt.where),
        limit: lowerLimit(stmt.limit)
      }
      const cursor = lowerCursor(stmt.cursor)
      if (cursor !== null) exportCmd.cursor = cursor
      return { Meta: { Export: exportCmd } }
    }
  }
}

// ---------------------------------------------------------------------------
// KQL
// ---------------------------------------------------------------------------

function lowerFind(stmt: FindStatement): KqlQuery {
  if (!stmt.where) {
    throw invalidSyntax('FIND requires a WHERE clause', stmt.range)
  }
  return {
    find_clause: { expressions: stmt.projections.map(lowerFindExpression) },
    where_clauses: lowerWhere(stmt.where),
    order_by: stmt.orderBy ? stmt.orderBy.keys.map(lowerOrderByKey) : null,
    limit: lowerLimit(stmt.limit),
    cursor: lowerCursor(stmt.cursor)
  }
}

function lowerFindExpression(expr: Expression): FindExpression {
  if (expr.kind === 'FunctionCallExpr') {
    const { func, arg, distinct } = aggregation(expr)
    return { Aggregation: { func, var: arg, distinct } }
  }
  return { Variable: dotPathVar(expr) }
}

function lowerOrderByKey(key: OrderByKey): OrderByItem {
  const direction = key.direction === 'DESC' ? 'Desc' : 'Asc'
  if (key.expression.kind === 'FunctionCallExpr') {
    const { func, arg, distinct } = aggregation(key.expression)
    // A sort key carries no `distinct` flag, so accepting the modifier would
    // sort by a different aggregate than the one projected.
    if (distinct) {
      throw invalidSyntax(
        'ORDER BY takes no DISTINCT: sort by the projected aggregate instead',
        key.expression.range
      )
    }
    return { variable: arg, direction, aggregation: func }
  }
  return {
    variable: dotPathVar(key.expression),
    direction,
    aggregation: null
  }
}

/** Reads `COUNT(?x)`, `COUNT(DISTINCT ?x)`, `SUM(?x.n)` and friends. */
function aggregation(expr: Expression & { kind: 'FunctionCallExpr' }): {
  func: AggregationFunction
  arg: DotPathVar
  distinct: boolean
} {
  // `COUNT(DISTINCT ?x)` has no separate syntax for the modifier, so it parses
  // as a nested call `DISTINCT(?x)`. Unwrap it before looking at arity.
  let args = expr.args
  let distinct = false
  const [head] = args
  if (
    args.length === 1 &&
    head &&
    head.kind === 'FunctionCallExpr' &&
    head.name === 'DISTINCT'
  ) {
    distinct = true
    args = head.args
  }

  const func = AGGREGATIONS.get(expr.name)
  if (!func) {
    throw invalidSyntax(
      `unknown aggregation function ${expr.name}(...): expected COUNT, SUM, AVG, MIN or MAX`,
      expr.range
    )
  }
  if (args.length !== 1) {
    throw invalidSyntax(
      `${expr.name} takes exactly one argument, got ${args.length}`,
      expr.range
    )
  }
  return { func, arg: dotPathVar(args[0]!), distinct }
}

function lowerWhere(where: CstWhereClause): WhereClause[] {
  const clauses = where.patterns.map(lowerWherePattern)
  if (clauses.length === 0) {
    throw invalidSyntax('WHERE must contain at least one clause', where.range)
  }
  return clauses
}

function lowerWherePattern(pattern: WherePattern): WhereClause {
  switch (pattern.kind) {
    case 'ConceptPattern': {
      if (!pattern.variable) {
        throw invalidSyntax(
          'a concept clause in WHERE must bind a variable, e.g. ?x {type: "T"}',
          pattern.range
        )
      }
      return {
        Concept: {
          variable: varName(pattern.variable, pattern.range),
          matcher: lowerConceptMatcher(pattern.matcher)
        }
      }
    }
    case 'PropositionPattern':
      return {
        Proposition: {
          variable: pattern.variable
            ? varName(pattern.variable, pattern.range)
            : null,
          matcher: lowerPropositionMatcher(pattern)
        }
      }
    case 'FilterClause':
      return { Filter: { expression: lowerFilter(pattern.expression) } }
    case 'NotClause':
      return { Not: nonEmptyBlock(pattern.patterns, 'NOT', pattern.range) }
    case 'OptionalClause':
      return {
        Optional: nonEmptyBlock(pattern.patterns, 'OPTIONAL', pattern.range)
      }
    case 'UnionClause':
      return { Union: nonEmptyBlock(pattern.patterns, 'UNION', pattern.range) }
  }
}

function nonEmptyBlock(
  patterns: WherePattern[],
  name: string,
  range: Range
): WhereClause[] {
  if (patterns.length === 0) {
    throw invalidSyntax(`${name} block must contain at least one clause`, range)
  }
  return patterns.map(lowerWherePattern)
}

/**
 * Collapses `{id: ..., type: ..., name: ...}` to the one identified form it
 * expresses.
 *
 * A duplicate or unknown key is rejected rather than resolved by precedence:
 * in generated KML both are far more often a mistake than an intent, and
 * silently keeping the last `type:` would run a different query than the one
 * written. A `null` value reads as "key absent", which is how the reference
 * grammar treats it.
 */
function lowerConceptMatcher(matcher: CstConceptMatcher): ConceptMatcher {
  let id: string | undefined
  let type: string | undefined
  let name: string | undefined
  const seen = new Set<string>()

  for (const entry of matcher.entries) {
    if (entry.key !== 'id' && entry.key !== 'type' && entry.key !== 'name') {
      throw invalidSyntax(
        `invalid key in concept clause: ${entry.key} (expected id, type or name)`,
        entry.range
      )
    }
    if (seen.has(entry.key)) {
      throw invalidSyntax(
        `duplicate key in concept clause: ${entry.key}`,
        entry.range
      )
    }
    seen.add(entry.key)

    const value = matcherString(entry)
    if (value === undefined) continue
    if (entry.key === 'id') id = value
    else if (entry.key === 'type') type = value
    else name = value
  }

  if (id !== undefined) {
    if (type !== undefined || name !== undefined) {
      throw invalidSyntax(
        'a concept clause cannot combine id with type or name',
        matcher.range
      )
    }
    return { ID: id }
  }
  if (type !== undefined && name !== undefined) return { Object: { type, name } }
  if (type !== undefined) return { Type: type }
  if (name !== undefined) return { Name: name }
  throw invalidSyntax(
    'a concept clause must carry at least one of id, type or name',
    matcher.range
  )
}

function matcherString(entry: ObjectEntry): string | undefined {
  const value = entry.value
  if (value.kind === 'StringLiteral') return value.parsed
  if (value.kind === 'NullLiteral') return undefined
  throw invalidSyntax(
    `concept clause key ${entry.key} expects a quoted string or null`,
    value.range
  )
}

/** A KML endpoint must address exactly one element. */
function requireUniqueConcept(
  matcher: ConceptMatcher,
  range: Range
): ConceptMatcher {
  if ('ID' in matcher || 'Object' in matcher) return matcher
  throw invalidSyntax(CONCEPT_IDENTITY_HELP, range)
}

function lowerPropositionMatcher(
  pattern: PropositionPattern
): PropositionMatcher {
  if (pattern.id) {
    if (pattern.id.kind !== 'StringLiteral') {
      throw invalidSyntax(
        'a proposition id must be a quoted string',
        pattern.id.range
      )
    }
    return { ID: pattern.id.parsed }
  }
  if (!pattern.subject || !pattern.predicate || !pattern.object) {
    throw invalidSyntax(
      'a proposition clause needs a subject, a predicate and an object',
      pattern.range
    )
  }
  return {
    Object: {
      subject: lowerEndpoint(pattern.subject),
      predicate: lowerPredicate(pattern.predicate),
      object: lowerEndpoint(pattern.object)
    }
  }
}

function lowerEndpoint(endpoint: PropositionEndpoint): TargetTerm {
  switch (endpoint.kind) {
    case 'VariableRef':
      return { Variable: varName(endpoint.name, endpoint.range) }
    case 'ConceptPattern':
      // `?s {type: "T"}` binds *and* constrains, which the executable form has
      // no term for: an endpoint is either a reference or an inline matcher.
      if (endpoint.variable) {
        throw invalidSyntax(
          'a proposition endpoint is either a variable or an inline matcher, not both',
          endpoint.range
        )
      }
      return { Concept: lowerConceptMatcher(endpoint.matcher) }
    case 'PropositionPattern':
      if (endpoint.variable) {
        throw invalidSyntax(
          'a nested proposition endpoint cannot bind a variable',
          endpoint.range
        )
      }
      return { Proposition: lowerPropositionMatcher(endpoint) }
  }
}

function lowerPredicate(predicate: PredicateExpr): PredTerm {
  switch (predicate.kind) {
    case 'PredicateVariable':
      return { Variable: varName(predicate.name, predicate.range) }
    case 'PredicateAlternation':
      return { Alternative: predicate.predicates.map((p) => p.value) }
    case 'PredicateLiteral': {
      const hop = predicate.hopRange
      if (!hop) return { Literal: predicate.value }
      const max = hop.max ?? null
      if (max !== null && max < hop.min) {
        throw invalidSyntax(
          `invalid multi-hop predicate: min ${hop.min} cannot be greater than max ${max}`,
          hop.range
        )
      }
      return { MultiHop: { predicate: predicate.value, min: hop.min, max } }
    }
  }
}

// ---------------------------------------------------------------------------
// FILTER
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
          `unsupported operator ${expr.operator} in FILTER`,
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
      return { Not: lowerFilter(expr.operand) }
    case 'FunctionCallExpr': {
      const func = FILTER_FUNCTIONS.get(expr.name)
      if (!func) {
        throw invalidSyntax(
          `unknown FILTER function ${expr.name}(...): expected CONTAINS, ` +
            `STARTS_WITH, ENDS_WITH, REGEX, IN, IS_NULL or IS_NOT_NULL`,
          expr.range
        )
      }
      const args = expr.args.map(lowerFilterOperand)
      checkFilterArity(func, args, expr.range)
      return { Function: { func, args } }
    }
    default:
      throw invalidSyntax(
        'FILTER takes a comparison, a logical combination, or a filter function',
        expr.range
      )
  }
}

function checkFilterArity(
  func: FilterFunction,
  args: FilterOperand[],
  range: Range
): void {
  switch (func) {
    case 'Contains':
    case 'StartsWith':
    case 'EndsWith':
    case 'Regex':
      if (args.length !== 2) {
        throw invalidSyntax(
          'string filter functions require exactly 2 arguments',
          range
        )
      }
      return
    case 'In':
      if (args.length !== 2) {
        throw invalidSyntax(
          'IN requires exactly 2 arguments: IN(?expr, [values])',
          range
        )
      }
      if (!(args[1] && 'List' in args[1])) {
        throw invalidSyntax(
          'IN requires a literal list as its second argument',
          range
        )
      }
      return
    case 'IsNull':
    case 'IsNotNull':
      if (args.length !== 1) {
        throw invalidSyntax(
          'IS_NULL and IS_NOT_NULL require exactly 1 argument',
          range
        )
      }
  }
}

function lowerFilterOperand(expr: Expression): FilterOperand {
  if (expr.kind === 'VariableRef' || expr.kind === 'DotExpression') {
    return { Variable: dotPathVar(expr) }
  }
  if (expr.kind === 'ArrayLiteral') {
    if (expr.trailingComma) {
      throw invalidSyntax('a literal list takes no trailing comma', expr.range)
    }
    return { List: expr.elements.map(lowerKipValue) }
  }
  return { Literal: lowerKipValue(expr) }
}

// ---------------------------------------------------------------------------
// KML
// ---------------------------------------------------------------------------

function lowerUpsert(stmt: UpsertStatement): {
  items: UpsertItem[]
  metadata: Record<string, Json> | null
} {
  const items = stmt.blocks.map<UpsertItem>((block) =>
    block.kind === 'ConceptBlock'
      ? { Concept: lowerConceptBlock(block) }
      : { Proposition: lowerPropositionBlock(block) }
  )
  if (items.length === 0) {
    throw invalidSyntax(
      'UPSERT must contain at least one CONCEPT or PROPOSITION block',
      stmt.range
    )
  }
  return { items, metadata: lowerMetadata(stmt.metadata) }
}

function lowerConceptBlock(block: CstConceptBlock): ConceptBlock {
  const out: ConceptBlock = {
    handle: block.handle ? varName(block.handle, block.range) : null,
    concept: requireUniqueConcept(
      lowerConceptMatcher(block.matcher),
      block.matcher.range
    ),
    set_attributes: block.setAttributes
      ? lowerJsonEntries(block.setAttributes.entries)
      : null,
    set_propositions: block.setPropositions
      ? block.setPropositions.items.map<SetProposition>((item) => ({
          predicate: item.predicate,
          object: requireIdentityTarget(
            lowerEndpoint(item.target),
            item.range
          ),
          metadata: lowerMetadata(item.metadata)
        }))
      : null,
    metadata: lowerMetadata(block.metadata)
  }
  const version = lowerExpectVersion(block)
  if (version !== undefined) out.expect_version = version
  return out
}

function lowerPropositionBlock(block: CstPropositionBlock): PropositionBlock {
  const matcher = lowerPropositionMatcher(
    block as unknown as PropositionPattern
  )
  requireIdentityProposition(matcher, block.range)
  const out: PropositionBlock = {
    handle: block.handle ? varName(block.handle, block.range) : null,
    proposition: matcher,
    set_attributes: block.setAttributes
      ? lowerJsonEntries(block.setAttributes.entries)
      : null,
    metadata: lowerMetadata(block.metadata)
  }
  const version = lowerExpectVersion(block)
  if (version !== undefined) out.expect_version = version
  return out
}

function lowerExpectVersion(block: {
  expectVersion?: { value: Expression; range: Range }
}): number | undefined {
  if (!block.expectVersion) return undefined
  const value = block.expectVersion.value
  if (value.kind !== 'NumberLiteral' || !isIntegerLiteral(value.raw)) {
    throw invalidSyntax(
      'EXPECT VERSION takes a non-negative integer',
      value.range
    )
  }
  const n = BigInt(value.raw)
  if (n < 0n || n > U64_MAX) {
    throw invalidSyntax(
      'EXPECT VERSION takes a non-negative integer',
      value.range
    )
  }
  return Number(n)
}

/** A KML target must address exactly one existing element. */
function requireIdentityTarget(term: TargetTerm, range: Range): TargetTerm {
  if ('Variable' in term) return term
  if ('Concept' in term) {
    requireUniqueConcept(term.Concept, range)
    return term
  }
  requireIdentityProposition(term.Proposition, range)
  return term
}

function requireIdentityProposition(
  matcher: PropositionMatcher,
  range: Range
): void {
  if ('ID' in matcher) return
  if (!('Literal' in matcher.Object.predicate)) {
    throw invalidSyntax(PROPOSITION_IDENTITY_HELP, range)
  }
  requireIdentityTarget(matcher.Object.subject, range)
  requireIdentityTarget(matcher.Object.object, range)
}

function lowerUpdate(stmt: CstUpdateStatement) {
  const target = varName(stmt.target, stmt.range)
  const set_attributes = lowerUpdateEntries(stmt.setAttributes, target)
  const set_metadata = lowerUpdateEntries(stmt.setMetadata, target)
  if (!set_attributes && !set_metadata) {
    throw invalidSyntax(
      'UPDATE needs at least one SET ATTRIBUTES or SET METADATA block',
      stmt.range
    )
  }
  return {
    target,
    set_attributes,
    set_metadata,
    where_clauses: lowerWhere(stmt.where),
    limit: lowerLimit(stmt.limit)
  }
}

function lowerUpdateEntries(
  block: SetAttributes | SetMetadata | undefined,
  target: string
): [string, UpdateValue][] | null {
  if (!block) return null
  if (block.entries.length === 0) {
    throw invalidSyntax(
      'an UPDATE SET block must contain at least one `key: value` pair',
      block.range
    )
  }
  const out: [string, UpdateValue][] = []
  const seen = new Set<string>()
  for (const entry of block.entries) {
    if (seen.has(entry.key)) {
      throw invalidSyntax(
        `duplicate key in object (keys must be unique): ${entry.key}`,
        entry.range
      )
    }
    seen.add(entry.key)
    out.push([entry.key, lowerUpdateValue(entry.value, target, entry.key)])
  }
  return out
}

function lowerUpdateValue(
  expr: Expression,
  target: string,
  key: string
): UpdateValue {
  if (expr.kind === 'FunctionCallExpr' && UPDATE_FUNCTIONS.has(expr.name)) {
    const value = lowerUpdateExpr(expr)
    checkUpdateExprTargets(value, target, key)
    return { Expr: value }
  }
  return { Json: lowerJson(expr) }
}

function lowerUpdateExpr(expr: Expression): UpdateExpr {
  if (expr.kind === 'FunctionCallExpr') {
    const func = UPDATE_FUNCTIONS.get(expr.name)
    if (!func) {
      throw invalidSyntax(
        `unknown UPDATE function ${expr.name}(...): expected ADD, MUL, CLAMP or COALESCE`,
        expr.range
      )
    }
    const expected = UPDATE_ARITY[func]
    if (expr.args.length !== expected) {
      throw invalidSyntax(
        `${expr.name} requires exactly ${expected} arguments, got ${expr.args.length}`,
        expr.range
      )
    }
    return { Function: { func, args: expr.args.map(lowerUpdateExpr) } }
  }
  if (expr.kind === 'VariableRef' || expr.kind === 'DotExpression') {
    return { Variable: dotPathVar(expr) }
  }
  if (expr.kind === 'NumberLiteral') {
    return { Number: numberValue(expr.value, expr.raw, expr.range) }
  }
  throw invalidSyntax(
    'an UPDATE expression operand is a number, a ?target dot-path, or a nested expression',
    expr.range
  )
}

/**
 * An UPDATE expression may only read the element it is updating.
 *
 * Reading another variable would make the new value depend on which row of the
 * join the engine happened to visit, so a bulk UPDATE would stop being
 * deterministic and order-independent.
 */
function checkUpdateExprTargets(
  expr: UpdateExpr,
  target: string,
  key: string
): void {
  if ('Variable' in expr) {
    if (expr.Variable.var !== target) {
      throw invalidSyntax(
        `UPDATE expression for \`${key}\` reads ?${expr.Variable.var}, but ` +
          `operands may only use dot-notation paths on the UPDATE target ?${target}`
      )
    }
    return
  }
  if ('Function' in expr) {
    for (const arg of expr.Function.args) {
      checkUpdateExprTargets(arg, target, key)
    }
  }
}

function lowerMerge(stmt: CstMergeStatement) {
  return {
    source: varName(stmt.source, stmt.range),
    target: varName(stmt.target, stmt.range),
    where_clauses: lowerWhere(stmt.where)
  }
}

function lowerDelete(stmt: CstDeleteStatement): DeleteStatement {
  const target = varName(stmt.target, stmt.range)
  const where_clauses = lowerWhere(stmt.where)
  switch (stmt.deleteType) {
    case 'ATTRIBUTES':
      return {
        DeleteAttributes: {
          attributes: requireKeys(stmt.keys, 'ATTRIBUTES', stmt.range),
          target,
          where_clauses
        }
      }
    case 'METADATA':
      return {
        DeleteMetadata: {
          keys: requireKeys(stmt.keys, 'METADATA', stmt.range),
          target,
          where_clauses
        }
      }
    case 'PROPOSITIONS':
      return { DeletePropositions: { target, where_clauses } }
    case 'CONCEPT':
      if (!stmt.detach) {
        throw invalidSyntax(
          'DELETE CONCEPT requires DETACH: removing a concept also removes ' +
            'every proposition attached to it',
          stmt.range
        )
      }
      return { DeleteConcept: { target, where_clauses } }
  }
}

function requireKeys(
  keys: string[] | undefined,
  what: string,
  range: Range
): string[] {
  if (!keys || keys.length === 0) {
    throw invalidSyntax(`DELETE ${what} needs at least one key`, range)
  }
  return keys
}

// ---------------------------------------------------------------------------
// META
// ---------------------------------------------------------------------------

function lowerDescribe(stmt: DescribeStatement): DescribeTarget {
  switch (stmt.describeType) {
    case 'PRIMER':
      return 'Primer'
    case 'DOMAINS':
      return 'Domains'
    case 'CONCEPT_TYPES':
      return {
        ConceptTypes: {
          limit: lowerLimit(stmt.limit),
          cursor: lowerCursor(stmt.cursor)
        }
      }
    case 'PROPOSITION_TYPES':
      return {
        PropositionTypes: {
          limit: lowerLimit(stmt.limit),
          cursor: lowerCursor(stmt.cursor)
        }
      }
    case 'CONCEPT_TYPE':
      return { ConceptType: describeName(stmt) }
    case 'PROPOSITION_TYPE':
      return { PropositionType: describeName(stmt) }
  }
}

function describeName(stmt: DescribeStatement): string {
  const value = stmt.typeNameValue
  if (value && value.kind !== 'StringLiteral') {
    throw invalidSyntax('DESCRIBE takes a quoted type name', value.range)
  }
  if (!stmt.typeName) {
    throw invalidSyntax('DESCRIBE takes a quoted type name', stmt.range)
  }
  return stmt.typeName
}

function lowerSearch(stmt: SearchStatement): SearchCommand {
  const out: SearchCommand = {
    target: stmt.searchTarget === 'PROPOSITION' ? 'Proposition' : 'Concept',
    term: requireLiteralString(stmt.termValue, stmt.term, 'SEARCH term', stmt.range),
    in_type:
      stmt.withType === undefined
        ? null
        : requireLiteralString(
            stmt.withTypeValue,
            stmt.withType,
            'WITH TYPE',
            stmt.range
          ),
    limit: lowerLimit(stmt.limit)
  }

  if (stmt.mode !== undefined) {
    const raw = requireLiteralString(stmt.modeValue, stmt.mode, 'MODE', stmt.range)
    const mode = searchMode(raw)
    if (!mode) {
      throw invalidSyntax(
        `invalid SEARCH mode: ${JSON.stringify(raw)}, expected "keyword", "semantic", or "hybrid"`,
        stmt.modeValue?.range ?? stmt.range
      )
    }
    out.mode = mode
  }

  if (stmt.threshold) {
    const value = stmt.threshold.value
    if (value.kind !== 'NumberLiteral') {
      throw invalidSyntax('THRESHOLD takes a number', value.range)
    }
    if (value.value < 0 || value.value > 1) {
      throw invalidSyntax(
        `THRESHOLD must be between 0.0 and 1.0, got ${value.value}`,
        value.range
      )
    }
    // `-0` and `0` are the same threshold; the wire form carries only `0`.
    out.threshold = value.value === 0 ? 0 : value.value
  }

  return out
}

function searchMode(raw: string): SearchMode | undefined {
  switch (raw.toLowerCase()) {
    case 'keyword':
      return 'Keyword'
    case 'semantic':
      return 'Semantic'
    case 'hybrid':
      return 'Hybrid'
    default:
      return undefined
  }
}

function requireLiteralString(
  node: { kind: string; range: Range } | undefined,
  value: string,
  what: string,
  range: Range
): string {
  if (node && node.kind !== 'StringLiteral') {
    throw invalidSyntax(`${what} must be a quoted string`, node.range)
  }
  if (!node) {
    throw invalidSyntax(`${what} must be a quoted string`, range)
  }
  return value
}

// ---------------------------------------------------------------------------
// Shared leaves
// ---------------------------------------------------------------------------

function lowerLimit(limit: LimitClause | undefined): number | null {
  if (!limit) return null
  const value = limit.value
  if (value.kind !== 'NumberLiteral' || !isIntegerLiteral(value.raw)) {
    throw invalidSyntax('LIMIT takes a positive integer', value.range)
  }
  const n = BigInt(value.raw)
  if (n <= 0n) {
    throw invalidSyntax(
      'LIMIT must be a positive integer (LIMIT 0 is not allowed; omit LIMIT for the engine default)',
      value.range
    )
  }
  if (n > BigInt(MAX_LIMIT)) {
    throw invalidSyntax(`LIMIT ${value.raw} is out of range`, value.range)
  }
  return Number(n)
}

function lowerCursor(cursor: CursorClause | undefined): string | null {
  if (!cursor) return null
  const value = cursor.value
  if (value.kind !== 'StringLiteral') {
    throw invalidSyntax('CURSOR takes a quoted pagination token', value.range)
  }
  if (value.parsed.length === 0) {
    throw invalidSyntax(
      'CURSOR must be a non-empty quoted pagination token',
      value.range
    )
  }
  return value.parsed
}

function lowerMetadata(
  block: WithMetadata | undefined
): Record<string, Json> | null {
  return block ? lowerJsonEntries(block.entries) : null
}

function lowerJsonEntries(entries: ObjectEntry[]): Record<string, Json> {
  const out: Record<string, Json> = {}
  for (const entry of entries) {
    if (Object.prototype.hasOwnProperty.call(out, entry.key)) {
      throw invalidSyntax(
        `duplicate key in object (keys must be unique): ${entry.key}`,
        entry.range
      )
    }
    out[entry.key] = lowerJson(entry.value)
  }
  return out
}

function lowerJson(expr: Expression): Json {
  switch (expr.kind) {
    case 'StringLiteral':
      return expr.parsed
    case 'NumberLiteral':
      return numberValue(expr.value, expr.raw, expr.range)
    case 'BooleanLiteral':
      return expr.value
    case 'NullLiteral':
      return null
    case 'ArrayLiteral':
      return expr.elements.map(lowerJson)
    case 'ObjectLiteral':
      return lowerJsonEntries(expr.entries)
    default:
      throw invalidSyntax(
        `expected a JSON value, found ${describeExpression(expr)}`,
        expr.range
      )
  }
}

/**
 * Reads a literal in matcher or FILTER position.
 *
 * Stricter than {@link lowerJson}: these positions are not JSON-value
 * positions in the grammar, and a trailing comma that an attribute block
 * tolerates is a syntax error inside `IN [...]`.
 */
function lowerKipValue(expr: Expression): KipValue {
  if (
    (expr.kind === 'ArrayLiteral' || expr.kind === 'ObjectLiteral') &&
    expr.trailingComma
  ) {
    throw invalidSyntax('a literal list takes no trailing comma', expr.range)
  }
  switch (expr.kind) {
    case 'StringLiteral':
      return { String: expr.parsed }
    case 'NumberLiteral':
      return { Number: numberValue(expr.value, expr.raw, expr.range) }
    case 'BooleanLiteral':
      return { Bool: expr.value }
    case 'NullLiteral':
      return 'Null'
    case 'ArrayLiteral':
      return { Array: expr.elements.map(lowerKipValue) }
    case 'ObjectLiteral': {
      const out: Record<string, KipValue> = {}
      for (const entry of expr.entries) {
        if (Object.prototype.hasOwnProperty.call(out, entry.key)) {
          throw invalidSyntax(
            `duplicate key in object (keys must be unique): ${entry.key}`,
            entry.range
          )
        }
        out[entry.key] = lowerKipValue(entry.value)
      }
      return { Object: out }
    }
    default:
      throw invalidSyntax(
        `expected a literal value, found ${describeExpression(expr)}`,
        expr.range
      )
  }
}

/**
 * Reads a numeric literal, rejecting integers no KIP engine can carry:
 * `18446744073709551617` is past u64 and would silently widen to
 * `1.8446744073709552e19`.
 *
 * Known limit: this tree carries numbers as JavaScript `number`, so integers
 * above 2^53 still lose precision here even though an i64/u64 engine keeps
 * them — `9007199254740993` lowers to `9007199254740992`. Closing that gap
 * needs a bigint-carrying wire type, not a wider bound.
 */
function numberValue(value: number, raw: string, range: Range): number {
  // KIP values are JSON values, and JSON has no `02`. `LIMIT 02` and
  // `EXPECT VERSION 007` are a different production and stay permissive.
  if (!JSON_NUMBER.test(raw)) {
    throw invalidSyntax(`invalid number literal ${raw}`, range)
  }
  if (!isIntegerLiteral(raw)) {
    if (!Number.isFinite(value)) {
      throw invalidSyntax(`number literal ${raw} is out of range`, range)
    }
    return value
  }
  const n = BigInt(raw)
  if (n < I64_MIN || n > U64_MAX) {
    throw invalidSyntax(
      `integer literal ${raw} is out of range: KIP integers must be representable as i64 or u64`,
      range
    )
  }
  // `-0` is an integer literal, and the wire format carries it as `0`.
  return n === 0n ? 0 : Number(n)
}

const JSON_NUMBER = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/

function isIntegerLiteral(raw: string): boolean {
  return !/[.eE]/.test(raw)
}

/** Reads `?var`, `?var.field` or `?var.attributes.key` as a name plus a path. */
function dotPathVar(expr: Expression): DotPathVar {
  const path: string[] = []
  let node = expr
  while (node.kind === 'DotExpression') {
    path.unshift(node.property)
    node = node.object
  }
  if (node.kind !== 'VariableRef') {
    throw invalidSyntax(
      `expected a variable, found ${describeExpression(node)}`,
      node.range
    )
  }
  return { var: varName(node.name, node.range), path }
}

/** Strips the `?` sigil; the executable form carries bare names. */
function varName(name: string, range: Range): string {
  if (!name.startsWith('?')) {
    throw invalidSyntax(`expected a variable, found ${name}`, range)
  }
  return name.slice(1)
}

function describeExpression(expr: Expression): string {
  switch (expr.kind) {
    case 'ParameterRef':
      return `the parameter ${expr.name} (this engine does not substitute parameters)`
    case 'VariableRef':
      return `the variable ${expr.name}`
    case 'FunctionCallExpr':
      return `a call to ${expr.name}`
    default:
      return expr.kind
  }
}
