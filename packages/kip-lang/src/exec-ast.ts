/**
 * The *executable* KIP 2.0 AST.
 *
 * This is a different tree from `ast.ts`, on purpose. `ast.ts` is a syntax
 * tree: it keeps ranges, comments, quoting style and raw number text, because
 * a formatter and an editor need to reproduce the source. This tree is what an
 * engine needs instead — every construct already collapsed to the one shape it
 * means, with the open-ended parts of the grammar closed:
 *
 *  - a predicate is an atom or a path, not a nested alternation/quantifier tree;
 *  - a filter is a comparison, a logical node, a negation, or a call to one of
 *    the registered functions, not a general expression tree;
 *  - a variable is a name and a path of steps, not a chain of member accesses;
 *  - `ASSERT` is gone: it has been desugared to the parts it is defined as.
 *
 * A consumer switching on these tags is total: there is no "some other
 * function name" case to defend against, because `lower` rejected it.
 *
 * The shape follows serde's default externally-tagged enum encoding, so a
 * Rust engine can consume it directly and a differential test can compare the
 * two field for field.
 */

/**
 * A `data_value`: a value that may still contain unbound parameters.
 *
 * The grammar admits `parameter` at every depth of an array or object, so no
 * assignment, option block or epistemic setting is plain JSON. A subtree with
 * nothing left to bind collapses to `Value`; anything else keeps its shape so
 * the runtime envelope can fill the holes without touching text.
 */
export type BoundValue =
  | { Value: KipValue }
  | { Param: string }
  | { Handle: string }
  | { Variable: DotPathVar }
  | { Array: BoundValue[] }
  | { Object: [string, BoundValue][] }

/**
 * A KIP literal. Externally tagged; `Null` is a bare string.
 *
 * Arrays and objects are not baseline Core Literals (Spec §9.2); they appear
 * here only as the option/assignment payloads that the grammar admits.
 */
export type KipValue =
  | 'Null'
  | { Bool: boolean }
  | { Number: number }
  | { String: string }
  | { Array: KipValue[] }
  | { Object: Record<string, KipValue> }

/**
 * A value slot the grammar spells `parameter | literal`.
 *
 * KIP 2.0 parameters are structurally bound data, never string-spliced, so an
 * unbound `:name` survives lowering as a `Param` for the runtime envelope to
 * fill — it is not an error and never becomes text.
 */
export type Scalar = { Literal: KipValue } | { Param: string }

/** A schema symbol: `string_literal | parameter`. */
export type SymbolRef = { Name: string } | { Param: string }

/** A mutation target: `variable | parameter | string_literal`. */
export type ElementRef =
  | { Handle: string }
  | { Param: string }
  | { Id: string }

/** One parsed command. */
export type Command =
  | { Kql: KqlQuery }
  | { Kml: KmlStatement }
  | { Meta: MetaCommand }

// ---------------------------------------------------------------------------
// Shared terms
// ---------------------------------------------------------------------------

/** `?var` plus a resolved path, e.g. `?x.facets["MnemonicState"].salience`. */
export interface DotPathVar {
  var: string
  path: PathStep[]
}

/** A dot step names a field; an index step keys into a map-valued field. */
export type PathStep = { Field: string } | { Key: string }

/** `predicate_atom` — the exact predicate slot. */
export type PredAtom =
  | { Variable: string }
  | { Literal: string }
  | { Param: string }

export interface HopRange {
  min: number
  /** `null` means unbounded. */
  max: number | null
}

export interface PredPathAtom {
  predicate: PredAtom
  hops: HopRange | null
}

/**
 * `Atom` is the plain predicate every language accepts. `Path` carries the
 * KQL-only traversal forms — alternation and hop quantifiers — which never
 * propagate belief and are rejected in KML and EXPORT selections.
 */
export type PredTerm = { Atom: PredAtom } | { Path: PredPathAtom[] }

/** One endpoint of a tuple. A term may itself be a tuple: KIP states things about statements. */
export type Term =
  | { Variable: string }
  | { Param: string }
  | { Literal: KipValue }
  | { Match: ObjectMatcher }
  | { Proposition: PropositionMatcher }

/**
 * `object_pattern` — an open, schema-validated field map.
 *
 * Unlike KIP 1.x, v2 does not close this to a fixed set of identity forms:
 * which fields identify an element is Schema's decision, not the grammar's.
 */
export type ObjectMatcher = Record<string, MatchValue>

export type MatchValue =
  | { Variable: string }
  | { Param: string }
  | { Literal: KipValue }
  | { Array: MatchValue[] }
  | { Match: ObjectMatcher }
  | { Proposition: PropositionMatcher }

export interface PropositionTriple {
  subject: Term
  predicate: PredTerm
  object: Term
}

/**
 * The Proposition expression slot (Spec §43.2).
 *
 * `Tuple` addresses a Proposition by structure, `Id` by record identity. Both
 * live in the same slot, which is why an id reference works everywhere a
 * triple does — including as a {@link Term} endpoint. `Id` is match-only: it
 * never resolves-or-creates, so `lower` rejects it in ENSURE PROPOSITION and
 * in the ASSERT sugar that desugars through it.
 */
export type PropositionMatcher =
  | { Tuple: PropositionTriple }
  | { Id: Scalar }

// ---------------------------------------------------------------------------
// KQL
// ---------------------------------------------------------------------------

export interface KqlQuery {
  find_clause: FindClause
  where_clauses: WhereClause[]
  /** Cognitive history basis — what the Brain contained/believed then. */
  as_of: AsOf | null
  /** World-valid time — what was applicable then. An independent axis. */
  for_time: Scalar | null
  epistemic: Record<string, BoundValue> | null
  order_by: OrderByItem[] | null
  limit: Scalar | null
  cursor: Scalar | null
}

export type AsOf = { Seq: Scalar } | { Tx: Scalar } | { Time: Scalar }

export interface FindClause {
  expressions: FindExpression[]
}

export type FindExpression =
  | { Variable: DotPathVar }
  | {
      Aggregation: {
        func: AggregationFunction
        var: DotPathVar
        distinct: boolean
      }
    }

export type AggregationFunction = 'Count' | 'Sum' | 'Avg' | 'Min' | 'Max'

export interface OrderByItem {
  variable: DotPathVar
  direction: OrderDirection
  aggregation: AggregationFunction | null
}

export type OrderDirection = 'Asc' | 'Desc'

export type WhereClause =
  | { Concept: { variable: string; matcher: ObjectMatcher } }
  | { Proposition: { variable: string | null; matcher: PropositionMatcher } }
  | { Assertion: { variable: string; matcher: ObjectMatcher } }
  | { Evidence: { variable: string; matcher: ObjectMatcher } }
  | { Activity: { variable: string; matcher: ObjectMatcher } }
  | {
      Structural: {
        variable: string | null
        subject: Term
        field: SymbolRef
        object: Term
      }
    }
  | { Belief: { variable: string; target: BeliefTarget } }
  | { BeliefSlot: { variable: string; subject: Term; predicate: PredAtom } }
  | { Filter: { expression: FilterExpression } }
  | { Not: WhereClause[] }
  | { Optional: WhereClause[] }
  | { Union: WhereClause[] }

/**
 * What a BELIEF projects: an already-bound Proposition variable, a Proposition
 * named by id, or a tuple stated inline.
 *
 * `BELIEF (...)` is the Proposition expression slot, so the id form that names
 * a Proposition in a pattern names it here too (Spec §43.2 / §46.1). The
 * inline tuple always carries an exact predicate: projection never walks a
 * raw path (Spec §45).
 */
export type BeliefTarget =
  | { Proposition: string }
  | { Id: Scalar }
  | { Tuple: PropositionTriple }

export type FilterExpression =
  | {
      Comparison: {
        left: FilterOperand
        operator: ComparisonOperator
        right: FilterOperand
      }
    }
  | {
      Logical: {
        left: FilterExpression
        operator: LogicalOperator
        right: FilterExpression
      }
    }
  | { Not: FilterExpression }
  | { Function: { func: FilterFunction; args: FilterOperand[] } }

export type FilterOperand =
  | { Variable: DotPathVar }
  | { Literal: KipValue }
  | { Param: string }
  | { List: FilterOperand[] }
  | { Negate: FilterOperand }

export type ComparisonOperator =
  | 'Equal'
  | 'NotEqual'
  | 'LessThan'
  | 'GreaterThan'
  | 'LessEqual'
  | 'GreaterEqual'

export type LogicalOperator = 'And' | 'Or'

export type FilterFunction =
  | 'Contains'
  | 'StartsWith'
  | 'EndsWith'
  | 'Regex'
  /** `IN(?expr, [a, b])` — membership. A function, not a comparison operator. */
  | 'In'
  | 'IsNull'
  | 'IsNotNull'
  | 'IsLiteral'
  | 'IsElement'
  | 'IsKind'
  | 'LiteralType'

// ---------------------------------------------------------------------------
// KML
// ---------------------------------------------------------------------------

/**
 * One atomic cognitive transition.
 *
 * A KML mutation becomes durable only via a Transaction, so a statement
 * written on its own is still a one-clause transaction. `explicit_transaction`
 * records which spelling the source used without changing that meaning.
 */
export interface KmlStatement {
  explicit_transaction: boolean
  clauses: MutationClause[]
}

export type MutationClause =
  | { CreateConcept: ConceptCreate }
  | { UpsertConcept: ConceptUpsert }
  | { EnsureProposition: EnsureProposition }
  | { CreateEvidence: RecordCreate }
  | { CreateAssertion: RecordCreate }
  | { CreateActivity: RecordCreate }
  | { Update: UpdateStatement }
  | { RetractAssertion: RetractAssertion }
  | { SupersedeAssertion: SupersedeAssertion }
  | { CorrectEvidence: CorrectEvidence }
  | { TransitionActivity: TransitionActivity }
  | { SetRetention: SetRetention }
  | { Archive: RemovalStatement }
  | { Tombstone: RemovalStatement }
  | { Purge: PurgeStatement }
  | { PurgePayload: PurgePayloadStatement }
  | { MergeConcept: MergeConcept }

export interface ConceptCreate {
  handle: string
  type: SymbolRef | null
  client_key: Scalar | null
  name: Scalar | null
  set_fields: Assignments | null
  set_attributes: Assignments | null
  set_facets: FacetAssignment[]
  set_structural: StructuralEdge[] | null
}

export interface ConceptUpsert {
  handle: string
  match: ObjectMatcher | null
  expect_version: Scalar | null
  set_fields: Assignments | null
  set_attributes: Assignments | null
  set_facets: FacetAssignment[]
  unset_attributes: string[] | null
  unset_facets: FacetUnset[]
  set_structural: StructuralEdge[] | null
  unset_structural: StructuralRemoval[] | null
}

/** CREATE EVIDENCE / ASSERTION / ACTIVITY share one shape. */
export interface RecordCreate {
  handle: string
  client_key: Scalar | null
  set_fields: Assignments | null
  set_facets: FacetAssignment[]
  set_structural: StructuralEdge[] | null
}

export interface EnsureProposition {
  handle: string | null
  subject: Term
  predicate: PredAtom
  object: Term
  expect_version: Scalar | null
}

export interface FacetAssignment {
  facet: SymbolRef
  values: Assignments
}

export interface FacetUnset {
  facet: SymbolRef
  fields: string[]
}

export interface StructuralEdge {
  field: SymbolRef
  value: MutationValue
  /** Edge options; `index` is meaningful only on an ordered field. */
  options: Record<string, BoundValue> | null
}

/**
 * `UNSET STRUCTURAL { (field, target) }` — one reference to remove.
 *
 * The SET STRUCTURAL edge without options: removal is per reference, ordered
 * fields re-densify, cardinality is validated at commit (Spec §17.5).
 */
export interface StructuralRemoval {
  field: SymbolRef
  value: MutationValue
}

/** Assignment pairs, kept ordered so lowering stays deterministic. */
export type Assignments = [string, MutationValue][]

/**
 * A KML right-hand side: a bound value, or arithmetic over the target's *own*
 * fields. References to any other variable are rejected during lowering, which
 * is what lets each matched element be updated from its own row without a join.
 */
export type MutationValue = BoundValue | { Expr: UpdateExpr }

export type UpdateExpr =
  | { Variable: DotPathVar }
  | { Number: number }
  | { Param: string }
  | { Function: { func: UpdateFunction; args: UpdateExpr[] } }

export type UpdateFunction = 'Add' | 'Mul' | 'Clamp' | 'Coalesce'

export interface UpdateStatement {
  target: ElementRef
  expect_version: Scalar | null
  actions: UpdateAction[]
  /**
   * `null` when the statement names its target directly and omits WHERE —
   * the same shape as the removal family (Spec §58).
   */
  where_clauses: WhereClause[] | null
  limit: Scalar | null
}

export type UpdateAction =
  | { SetFields: Assignments }
  | { SetAttributes: Assignments }
  | { SetFacet: FacetAssignment }
  | { UnsetAttributes: string[] }
  | { UnsetFacet: FacetUnset }
  | { SetStructural: StructuralEdge[] }
  | { UnsetStructural: StructuralRemoval[] }

export interface RetractAssertion {
  target: ElementRef
  where_clauses: WhereClause[] | null
  limit: Scalar | null
  expect_state: Scalar | null
}

export interface SupersedeAssertion {
  target: ElementRef
  by: ElementRef
  expect_state: Scalar | null
}

export interface CorrectEvidence {
  target: ElementRef
  by: ElementRef
  expect_state: Scalar | null
}

export interface TransitionActivity {
  target: ElementRef
  to: Scalar
  set_fields: Assignments | null
  set_structural: StructuralEdge[] | null
  expect_state: Scalar | null
}

export interface SetRetention {
  target: ElementRef
  values: Assignments
  where_clauses: WhereClause[] | null
  limit: Scalar | null
  expect_version: Scalar | null
}

export interface RemovalStatement {
  target: ElementRef
  where_clauses: WhereClause[] | null
  limit: Scalar | null
  expect_state: Scalar | null
}

export interface PurgeStatement {
  target: ElementRef
  where_clauses: WhereClause[] | null
  limit: Scalar | null
  reference_policy: Scalar | null
  /** Always the literal `PURGE`; the grammar freezes the spelling. */
  confirm: string
}

/**
 * Payload-only purge (Spec §60.6): Evidence bytes are destroyed, the element
 * survives, so no reference policy exists.
 */
export interface PurgePayloadStatement {
  target: ElementRef
  where_clauses: WhereClause[] | null
  limit: Scalar | null
  /** Always the literal `PURGE`; the grammar freezes the spelling. */
  confirm: string
}

export interface MergeConcept {
  source: ElementRef
  into: ElementRef
  where_clauses: WhereClause[] | null
  expect_version: Scalar | null
}

// ---------------------------------------------------------------------------
// META
// ---------------------------------------------------------------------------

export type MetaCommand =
  | { Describe: DescribeTarget }
  | { List: ListCommand }
  | { Search: SearchCommand }
  | { Verify: { target: VerifyTarget; value: Scalar } }
  | { Validate: ValidateCommand }
  | { Preview: PreviewCommand }
  | { History: HistoryCommand }
  | { Changes: ChangesCommand }
  | { Snapshot: { as_of: AsOf | null } }
  | { ExportCapsule: ExportCapsuleCommand }

export type DescribeTarget =
  | { Primer: { mode: Scalar | null } }
  | 'Protocol'
  | 'ExecutionContext'
  | 'Capabilities'
  | { Space: { value: Scalar | null } }
  | { SchemaEnvironment: { as_of: AsOf | null } }
  | { Package: Scalar }
  | { Type: Scalar }
  | { Predicate: Scalar }
  | { Facet: Scalar }
  | { StructuralField: Scalar }
  | { Compatibility: { from: Scalar; to: Scalar } }
  | { Error: Scalar }
  | { Transaction: Scalar }
  | { TransactionByIdempotencyKey: Scalar }
  | { Snapshot: { as_of: AsOf | null } }
  | { Capsule: Scalar }
  | { EpistemicPolicy: { value: Scalar | null } }
  | 'ProjectionCapability'
  | { Trust: { value: Scalar | null } }
  | { Access: { with: Record<string, BoundValue> | null } }

export interface ListCommand {
  target: ListTarget
  /** `LIST SCHEMA PACKAGES STATUS ...` only. */
  status: Scalar | null
  /** `LIST DEPENDENTS :id` only — the traversal root. */
  element: Scalar | null
  /** `LIST DEPENDENTS ... DEPTH :n` only. */
  depth: Scalar | null
  limit: Scalar | null
  cursor: Scalar | null
}

export type ListTarget =
  | 'Spaces'
  | 'SchemaPackages'
  | 'Types'
  | 'Predicates'
  | 'Facets'
  | 'StructuralFields'
  | 'EpistemicPolicies'
  | 'Dependents'

export interface SearchCommand {
  target: SearchTarget
  term: Scalar
  with_type: Scalar | null
  with_predicate: Scalar | null
  mode: Scalar | null
  threshold: Scalar | null
  /** Historical index basis, `AS OF SEQ`. */
  as_of_seq: Scalar | null
  limit: Scalar | null
  cursor: Scalar | null
}

export type SearchTarget =
  | 'Concept'
  | 'Proposition'
  | 'Assertion'
  | 'Evidence'
  | 'Activity'
  | 'Cognition'

export type VerifyTarget =
  | 'Capsule'
  | 'SchemaPackage'
  | 'Receipt'
  | 'Blob'
  | 'Checkpoint'

export interface ValidateCommand {
  target: ValidateTarget
  value: Scalar
  options: Record<string, BoundValue> | null
}

export type ValidateTarget =
  | 'Kql'
  | 'Kml'
  | 'Capsule'
  | 'SchemaPackage'
  | 'ImportPlan'

export type PreviewCommand =
  | { Kml: Scalar }
  | { ImportCapsule: { capsule: Scalar; into: Scalar } }

export type HistoryCommand =
  | {
      Element: {
        value: Scalar
        from_seq: Scalar | null
        to_seq: Scalar | null
        limit: Scalar | null
        cursor: Scalar | null
      }
    }
  | {
      Space: {
        from_seq: Scalar | null
        to_seq: Scalar | null
        limit: Scalar | null
        cursor: Scalar | null
      }
    }

export type ChangesCommand =
  | { Since: { cursor: Scalar; limit: Scalar | null } }
  | { AfterSeq: { seq: Scalar; limit: Scalar | null } }

export interface ExportCapsuleCommand {
  target: ElementRef
  where_clauses: WhereClause[]
  options: Record<string, BoundValue> | null
  as_of: AsOf | null
}
