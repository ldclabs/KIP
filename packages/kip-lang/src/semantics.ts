import type { Diagnostic } from './diagnostics.js'
import type {
  Program,
  Statement,
  WhereClause,
  WherePattern,
  PropositionPattern,
  PropositionEndpoint,
  ConceptMatcher,
  WithMetadata,
  SetMetadata,
  ObjectEntry,
  StringLiteral
} from './ast.js'
import type { Range } from './token.js'

/**
 * Best-effort static checks layered on top of the syntax parser. These encode
 * the spec's SHOULD/MUST rules that are decidable without a live schema:
 *   - reserved `_` metadata writes (KIP_2002),
 *   - unbounded associative-recall patterns lacking a LIMIT (KIP_4002),
 *   - concept-type / predicate naming conventions (KIP_2001, §2.8).
 * Everything requiring the graph's schema (undefined types, missing required
 * attributes, protected targets) is left to the engine.
 */
export function analyzeSemantics(program: Program): Diagnostic[] {
  const diags: Diagnostic[] = []
  for (const stmt of program.statements) {
    analyzeStatement(stmt, diags)
  }
  return diags
}

function analyzeStatement(stmt: Statement, diags: Diagnostic[]): void {
  switch (stmt.kind) {
    case 'FindStatement':
      if (stmt.where) checkWhere(stmt.where, !!stmt.limit, diags)
      break
    case 'UpsertStatement':
      checkMetadata(stmt.metadata, diags)
      for (const block of stmt.blocks) {
        if (block.kind === 'ConceptBlock') {
          checkMatcherNaming(block.matcher, diags)
          checkMetadata(block.metadata, diags)
          for (const item of block.setPropositions?.items ?? []) {
            checkPredicateName(item.predicate, item.range, diags)
            checkEndpointNaming(item.target, diags)
            checkMetadata(item.metadata, diags)
          }
        } else {
          checkPropositionNaming(block, diags)
          checkEndpointNaming(block.subject, diags)
          checkEndpointNaming(block.object, diags)
          checkMetadata(block.metadata, diags)
        }
      }
      break
    case 'UpdateStatement':
      checkMetadata(stmt.setMetadata, diags)
      checkWhere(stmt.where, !!stmt.limit, diags)
      break
    case 'MergeStatement':
      checkWhere(stmt.where, true, diags)
      break
    case 'DeleteStatement':
      if (stmt.where) checkWhere(stmt.where, true, diags)
      break
    case 'ExportStatement':
      checkWhere(stmt.where, !!stmt.limit, diags)
      break
  }
}

// ─── Reserved `_` metadata namespace (KIP_2002) ──────────────────────

function checkMetadata(
  meta: WithMetadata | SetMetadata | undefined,
  diags: Diagnostic[]
): void {
  if (!meta) return
  for (const entry of meta.entries) {
    if (entry.key.startsWith('_')) {
      diags.push({
        range: entry.range,
        severity: 'error',
        message: `Metadata key '${entry.key}' is in the engine-reserved '_' namespace and is read-only to KML (KIP_2002).`,
        code: 'KIP_2002'
      })
    }
  }
}

// ─── Naming conventions (§2.8, KIP_2001) ─────────────────────────────

function checkMatcherNaming(
  matcher: ConceptMatcher,
  diags: Diagnostic[]
): void {
  for (const entry of matcher.entries) {
    if (entry.key !== 'type') continue
    const name = literalString(entry)
    // Skip parameters, meta-types ($-prefixed), and error placeholders.
    if (name == null || name === '' || name.startsWith('$')) continue
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
      diags.push({
        range: entry.range,
        severity: 'warning',
        message: `Concept type '${name}' should be UpperCamelCase (§2.8); mismatched casing resolves to a different, likely undefined type (KIP_2001).`,
        code: 'KIP_2001'
      })
    }
  }
}

/** Recurse into a proposition endpoint, checking concept types and nested predicates. */
function checkEndpointNaming(
  endpoint: PropositionEndpoint | undefined,
  diags: Diagnostic[]
): void {
  if (!endpoint) return
  if (endpoint.kind === 'ConceptPattern') {
    checkMatcherNaming(endpoint.matcher, diags)
  } else if (endpoint.kind === 'PropositionPattern') {
    checkPropositionNaming(endpoint, diags)
    checkEndpointNaming(endpoint.subject, diags)
    checkEndpointNaming(endpoint.object, diags)
  }
}

function checkPredicateName(
  predicate: string,
  range: Range,
  diags: Diagnostic[]
): void {
  if (predicate === '') return
  if (!/^[a-z_][a-z0-9_]*$/.test(predicate)) {
    diags.push({
      range,
      severity: 'warning',
      message: `Predicate '${predicate}' should be snake_case (§2.8); mismatched casing resolves to a different, likely undefined predicate (KIP_2001).`,
      code: 'KIP_2001'
    })
  }
}

// ─── Unbounded associative recall (KIP_4002) ─────────────────────────

function checkWhere(
  where: WhereClause,
  hasLimit: boolean,
  diags: Diagnostic[]
): void {
  const constrained = new Set<string>()
  collectConstrainedVars(where.patterns, constrained)
  checkPatternNaming(where.patterns, diags)
  walkPropositions(where.patterns, (p) => {
    if (hasLimit) return
    if (p.predicate?.kind !== 'PredicateVariable') return
    if (
      isUnconstrained(p.subject, constrained) &&
      isUnconstrained(p.object, constrained)
    ) {
      diags.push({
        range: p.range,
        severity: 'warning',
        message: `Unbounded exploration '(?s, ?p, ?o)' with no constrained endpoint should be paired with a LIMIT (KIP_4002).`,
        code: 'KIP_4002'
      })
    }
  })
}

/** Walk every concept matcher and predicate in a pattern tree for naming checks. */
function checkPatternNaming(
  patterns: WherePattern[],
  diags: Diagnostic[]
): void {
  for (const p of patterns) {
    switch (p.kind) {
      case 'ConceptPattern':
        checkMatcherNaming(p.matcher, diags)
        break
      case 'PropositionPattern':
        checkPropositionNaming(p, diags)
        checkEndpointNaming(p.subject, diags)
        checkEndpointNaming(p.object, diags)
        break
      case 'NotClause':
      case 'OptionalClause':
      case 'UnionClause':
        checkPatternNaming(p.patterns, diags)
        break
    }
  }
}

function checkPropositionNaming(
  p: { predicate?: PropositionPattern['predicate'] },
  diags: Diagnostic[]
): void {
  const pred = p.predicate
  if (!pred) return
  if (pred.kind === 'PredicateLiteral') {
    checkPredicateName(pred.value, pred.range, diags)
  } else if (pred.kind === 'PredicateAlternation') {
    for (const alt of pred.predicates) {
      checkPredicateName(alt.value, alt.range, diags)
    }
  }
}

/** A variable endpoint is "constrained" if bound elsewhere by type/name/id or a literal-predicate link. */
function isUnconstrained(
  endpoint: PropositionEndpoint | undefined,
  constrained: Set<string>
): boolean {
  if (!endpoint) return false
  if (endpoint.kind !== 'VariableRef') return false // concept/proposition pattern is itself a constraint
  return !constrained.has(endpoint.name)
}

function collectConstrainedVars(
  patterns: WherePattern[],
  out: Set<string>
): void {
  for (const p of patterns) {
    switch (p.kind) {
      case 'ConceptPattern':
        if (p.variable && p.matcher.entries.length > 0) out.add(p.variable)
        break
      case 'PropositionPattern':
        if (p.predicate?.kind !== 'PredicateVariable') {
          addEndpointVar(p.subject, out)
          addEndpointVar(p.object, out)
        }
        break
      case 'NotClause':
      case 'OptionalClause':
      case 'UnionClause':
        collectConstrainedVars(p.patterns, out)
        break
    }
  }
}

function addEndpointVar(
  endpoint: PropositionEndpoint | undefined,
  out: Set<string>
): void {
  if (endpoint?.kind === 'VariableRef') out.add(endpoint.name)
  else if (endpoint?.kind === 'ConceptPattern' && endpoint.variable) {
    out.add(endpoint.variable)
  }
}

function walkPropositions(
  patterns: WherePattern[],
  visit: (p: PropositionPattern) => void
): void {
  for (const p of patterns) {
    switch (p.kind) {
      case 'PropositionPattern':
        visit(p)
        break
      case 'NotClause':
      case 'OptionalClause':
      case 'UnionClause':
        walkPropositions(p.patterns, visit)
        break
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function literalString(entry: ObjectEntry): string | null {
  return entry.value.kind === 'StringLiteral'
    ? (entry.value as StringLiteral).parsed
    : null
}
