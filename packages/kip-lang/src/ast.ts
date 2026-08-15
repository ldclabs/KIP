import type { Range } from './token.js'

// ─── Base ────────────────────────────────────────────────────────────

export interface BaseNode {
  kind: string
  range: Range
  leadingComments?: string[]
  trailingComment?: string
}

// ─── Program (root) ──────────────────────────────────────────────────

export interface Program extends BaseNode {
  kind: 'Program'
  statements: Statement[]
}

export type Statement = KqlStatement | KmlStatement | MetaStatement

/** KQL — the read language. */
export type KqlStatement = FindStatement

/** KML — the cognitive mutation language. */
export type KmlStatement = MutateStatement | MutationClause

/**
 * Every mutation that may stand alone or inside `MUTATE { ... }`.
 *
 * `MUTATE` itself is excluded: the grammar forbids nesting one mutation
 * transaction inside another.
 */
export type MutationClause =
  | CreateConceptStatement
  | UpsertConceptStatement
  | EnsurePropositionStatement
  | AssertStatement
  | CreateEvidenceStatement
  | CreateAssertionStatement
  | CreateActivityStatement
  | UpdateStatement
  | RetractAssertionStatement
  | SupersedeAssertionStatement
  | CorrectEvidenceStatement
  | TransitionActivityStatement
  | SetRetentionStatement
  | ArchiveStatement
  | TombstoneStatement
  | PurgeStatement
  | MergeConceptStatement

/** META — introspection, grounding, verification, history, export. */
export type MetaStatement =
  | DescribeStatement
  | ListStatement
  | SearchStatement
  | VerifyStatement
  | ValidateStatement
  | PreviewStatement
  | HistoryStatement
  | ChangesStatement
  | SnapshotStatement
  | ExportCapsuleStatement

// ─── Shared operand shapes ───────────────────────────────────────────

/** `schema_symbol = string_literal | parameter` */
export type SchemaSymbol = StringLiteral | ParameterRef

/** `scalar_value` / `scalar_or_parameter` / `meta_value` = `parameter | literal` */
export type ScalarValue =
  | ParameterRef
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral

/** `target_ref = variable | parameter | string_literal` */
export type TargetRef = VariableRef | ParameterRef | StringLiteral

/** `handle = variable` — a block-local name bound by a KML mutation. */
export type Handle = VariableRef

// ─── KQL: FIND ───────────────────────────────────────────────────────

export interface FindStatement extends BaseNode {
  kind: 'FindStatement'
  projections: Expression[]
  where: WhereClause
  asOf?: AsOfClause
  forTime?: ForTimeClause
  epistemic?: EpistemicClause
  orderBy?: OrderByClause
  limit?: LimitClause
  cursor?: CursorClause
}

/** `AS OF SEQ|TX|TIME` — which cognitive history the read runs against. */
export interface AsOfClause extends BaseNode {
  kind: 'AsOfClause'
  basis: 'SEQ' | 'TX' | 'TIME'
  value: ScalarValue
}

/** `FOR TIME` — world-valid time, an axis independent of {@link AsOfClause}. */
export interface ForTimeClause extends BaseNode {
  kind: 'ForTimeClause'
  value: ScalarValue
}

export interface EpistemicClause extends BaseNode {
  kind: 'EpistemicClause'
  options: ObjectLiteral
}

export interface OrderByClause extends BaseNode {
  kind: 'OrderByClause'
  items: OrderItem[]
}

export interface OrderItem extends BaseNode {
  kind: 'OrderItem'
  expression: Expression
  direction?: 'ASC' | 'DESC'
}

export interface LimitClause extends BaseNode {
  kind: 'LimitClause'
  value: ScalarValue
}

export interface CursorClause extends BaseNode {
  kind: 'CursorClause'
  value: ScalarValue
}

// ─── WHERE ───────────────────────────────────────────────────────────

export interface WhereClause extends BaseNode {
  kind: 'WhereClause'
  patterns: WherePattern[]
}

export type WherePattern =
  | ConceptPattern
  | PropositionPattern
  | AssertionPattern
  | EvidencePattern
  | ActivityPattern
  | StructuralPattern
  | BeliefPattern
  | BeliefSlotPattern
  | FilterClause
  | NotClause
  | OptionalClause
  | UnionClause

export interface ConceptPattern extends BaseNode {
  kind: 'ConceptPattern'
  variable: VariableRef
  /** Whether the optional `CONCEPT` keyword was written. */
  explicit: boolean
  matcher: ObjectPattern
}

export interface PropositionPattern extends BaseNode {
  kind: 'PropositionPattern'
  variable?: VariableRef
  /** Whether the optional `PROPOSITION` keyword was written. */
  explicit: boolean
  tuple: PropositionTuple
}

export interface AssertionPattern extends BaseNode {
  kind: 'AssertionPattern'
  variable: VariableRef
  matcher: ObjectPattern
}

export interface EvidencePattern extends BaseNode {
  kind: 'EvidencePattern'
  variable: VariableRef
  matcher: ObjectPattern
}

export interface ActivityPattern extends BaseNode {
  kind: 'ActivityPattern'
  variable: VariableRef
  matcher: ObjectPattern
}

/**
 * `?edge STRUCTURAL (?src, "has_step", ?dst)` — record topology.
 *
 * Never a semantic Proposition: a claim *about* a structural relation is a
 * separate Proposition + Assertion (Spec §17.3).
 */
export interface StructuralPattern extends BaseNode {
  kind: 'StructuralPattern'
  variable?: VariableRef
  subject: Term
  field: SchemaSymbol
  object: Term
}

/**
 * `?b BELIEF (...)` — an Epistemic Projection, virtual and read-only.
 *
 * Admitted by KQL only. A Projection can never be a mutation target, so the
 * KML and EXPORT grammars exclude it.
 */
export interface BeliefPattern extends BaseNode {
  kind: 'BeliefPattern'
  variable: VariableRef
  /** `BELIEF (?p)` — project an already-bound Proposition. */
  proposition?: VariableRef
  /**
   * `BELIEF (id: "P-1")` — project a Proposition already known by identity.
   * The operand is the same Proposition expression slot as a pattern's, so it
   * takes the same id form (Spec §43.2 / §46.1).
   */
  propositionId?: ScalarValue
  /** `BELIEF (?s, "pred", ?o)` — project a tuple (exact predicate, no path). */
  subject?: Term
  predicate?: PredicateAtom
  object?: Term
}

/** `?slot BELIEF SLOT (?s, "pred")` — candidates and conflicts for one slot. */
export interface BeliefSlotPattern extends BaseNode {
  kind: 'BeliefSlotPattern'
  variable: VariableRef
  subject: Term
  predicate: PredicateAtom
}

export interface FilterClause extends BaseNode {
  kind: 'FilterClause'
  expression: Expression
}

export interface NotClause extends BaseNode {
  kind: 'NotClause'
  patterns: WherePattern[]
}

export interface OptionalClause extends BaseNode {
  kind: 'OptionalClause'
  patterns: WherePattern[]
}

export interface UnionClause extends BaseNode {
  kind: 'UnionClause'
  patterns: WherePattern[]
}

// ─── Raw semantic tuples ─────────────────────────────────────────────

/**
 * The Proposition expression slot, in either of its two spellings (Spec §43.2).
 *
 * `(subject, predicate, object)` addresses a Proposition by structure;
 * `(id: ...)` addresses the same slot by record identity. Both are tuples on
 * purpose: a Proposition is not a field-matched record, and keeping one slot
 * is what lets an id reference stand as a `term` endpoint — how a statement
 * about a statement names an existing Proposition.
 *
 * `id` is present exactly when the triple fields are absent.
 */
export interface PropositionTuple extends BaseNode {
  kind: 'PropositionTuple'
  /** `(id: "P-1")` — match-only; never resolves-or-creates. */
  id?: ScalarValue
  subject?: Term
  predicate?: RawPredicateExpression
  object?: Term
}

export type Term =
  | VariableRef
  | ParameterRef
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral
  | ObjectPattern
  | PropositionTuple

/** `predicate_atom = string_literal | parameter | variable` */
export type PredicateAtom = StringLiteral | ParameterRef | VariableRef

/**
 * `raw_predicate_expression` — one or more path atoms joined by `|`.
 *
 * Path quantifiers and alternation are traversal syntax owned by KQL; KML
 * and META require a bare {@link PredicateAtom}, which the parser enforces
 * by position.
 */
export interface RawPredicateExpression extends BaseNode {
  kind: 'RawPredicateExpression'
  atoms: PredicatePathAtom[]
}

export interface PredicatePathAtom extends BaseNode {
  kind: 'PredicatePathAtom'
  atom: PredicateAtom
  quantifier?: PathQuantifier
}

/** `{n}` / `{n,}` / `{n,m}` — raw traversal only, never belief propagation. */
export interface PathQuantifier extends BaseNode {
  kind: 'PathQuantifier'
  min: number
  /** Absent means unbounded. */
  max?: number
  /** Whether a comma was written, distinguishing `{2}` from `{2,}`. */
  hasComma: boolean
}

// ─── Match objects ───────────────────────────────────────────────────

/**
 * `object_pattern` — the `{...}` used to match, not to assign.
 *
 * Shares its node shape with {@link ObjectLiteral} on purpose: the syntax
 * tree stays deliberately loose (an editor wants the loosest tree it can
 * get) and `lower` closes it to the one form each position means.
 */
export interface ObjectPattern extends BaseNode {
  kind: 'ObjectPattern'
  members: ObjectEntry[]
  trailingComma?: boolean
}

// ─── KML: create / ensure / upsert ───────────────────────────────────

export interface MutateStatement extends BaseNode {
  kind: 'MutateStatement'
  clauses: MutationClause[]
}

export interface CreateConceptStatement extends BaseNode {
  kind: 'CreateConceptStatement'
  handle: Handle
  type?: TypeClause
  clientKey?: ClientKeyClause
  name?: NameClause
  setFields?: SetFieldsClause
  setAttributes?: SetAttributesClause
  setFacets: SetFacetClause[]
  setStructural?: SetStructuralClause
}

export interface UpsertConceptStatement extends BaseNode {
  kind: 'UpsertConceptStatement'
  handle: Handle
  match?: MatchClause
  expectVersion?: ExpectVersionClause
  setFields?: SetFieldsClause
  setAttributes?: SetAttributesClause
  setFacets: SetFacetClause[]
  unsetAttributes?: UnsetAttributesClause
  unsetFacets: UnsetFacetClause[]
  setStructural?: SetStructuralClause
}

export interface EnsurePropositionStatement extends BaseNode {
  kind: 'EnsurePropositionStatement'
  handle?: Handle
  tuple: PropositionTuple
  expectVersion?: ExpectVersionClause
}

/**
 * `ASSERT (s, p, o) { by:, mode:, ... } [SUPERSEDING ref]`.
 *
 * Normative sugar (Spec §55.1) for `ENSURE PROPOSITION` + `CREATE ASSERTION`
 * (+ `SUPERSEDE`). `lower` performs that desugaring; it never fabricates
 * state beyond those parts.
 */
export interface AssertStatement extends BaseNode {
  kind: 'AssertStatement'
  handle?: Handle
  tuple: PropositionTuple
  assignments: ObjectLiteral
  superseding?: TargetRef
}

export interface CreateEvidenceStatement extends BaseNode {
  kind: 'CreateEvidenceStatement'
  handle: Handle
  clientKey?: ClientKeyClause
  setFields?: SetFieldsClause
  setFacets: SetFacetClause[]
  setStructural?: SetStructuralClause
}

export interface CreateAssertionStatement extends BaseNode {
  kind: 'CreateAssertionStatement'
  handle: Handle
  clientKey?: ClientKeyClause
  setFields?: SetFieldsClause
  setFacets: SetFacetClause[]
  setStructural?: SetStructuralClause
}

export interface CreateActivityStatement extends BaseNode {
  kind: 'CreateActivityStatement'
  handle: Handle
  clientKey?: ClientKeyClause
  setFields?: SetFieldsClause
  setFacets: SetFacetClause[]
  setStructural?: SetStructuralClause
}

// ─── KML: clause vocabulary ──────────────────────────────────────────

export interface TypeClause extends BaseNode {
  kind: 'TypeClause'
  value: SchemaSymbol
}

export interface ClientKeyClause extends BaseNode {
  kind: 'ClientKeyClause'
  value: ScalarValue
}

export interface NameClause extends BaseNode {
  kind: 'NameClause'
  value: ScalarValue
}

export interface MatchClause extends BaseNode {
  kind: 'MatchClause'
  pattern: ObjectPattern
}

export interface SetFieldsClause extends BaseNode {
  kind: 'SetFieldsClause'
  assignments: ObjectLiteral
}

export interface SetAttributesClause extends BaseNode {
  kind: 'SetAttributesClause'
  assignments: ObjectLiteral
}

export interface SetFacetClause extends BaseNode {
  kind: 'SetFacetClause'
  facet: SchemaSymbol
  assignments: ObjectLiteral
}

export interface UnsetAttributesClause extends BaseNode {
  kind: 'UnsetAttributesClause'
  fields: UnsetField[]
}

export interface UnsetFacetClause extends BaseNode {
  kind: 'UnsetFacetClause'
  facet: SchemaSymbol
  fields: UnsetField[]
}

export interface UnsetField extends BaseNode {
  kind: 'UnsetField'
  name: string
  isQuoted: boolean
}

export interface SetStructuralClause extends BaseNode {
  kind: 'SetStructuralClause'
  assignments: StructuralAssignment[]
}

/**
 * `("has_step", ?step) {index: 0}` — one structural edge, optionally placed.
 *
 * The trailing object carries edge options; `index` is meaningful only on a
 * field declared ordered, and index order is never causality (Spec §17.4).
 */
export interface StructuralAssignment extends BaseNode {
  kind: 'StructuralAssignment'
  field: SchemaSymbol
  value: Expression
  options?: ObjectLiteral
}

export interface ExpectVersionClause extends BaseNode {
  kind: 'ExpectVersionClause'
  value: ScalarValue
}

export interface ExpectStateClause extends BaseNode {
  kind: 'ExpectStateClause'
  value: ScalarValue
}

// ─── KML: update ─────────────────────────────────────────────────────

/**
 * `UPDATE` reaches mutable state only.
 *
 * Proposition tuples, Assertion epistemic payload, Evidence payload, terminal
 * Activity topology, `_system` and Governance are all out of reach; `lower`
 * rejects those targets rather than letting an engine discover them.
 */
export interface UpdateStatement extends BaseNode {
  kind: 'UpdateStatement'
  target: TargetRef
  expectVersion?: ExpectVersionClause
  actions: UpdateAction[]
  /**
   * Binds a `?variable` target; a direct `:id` / `"id"` target already names
   * the element and may omit it — the same rule as ARCHIVE, TOMBSTONE, PURGE,
   * SET RETENTION and RETRACT ASSERTION (Spec §58).
   */
  where?: WhereClause
  limit?: LimitClause
}

export type UpdateAction =
  | SetFieldsClause
  | SetAttributesClause
  | SetFacetClause
  | UnsetAttributesClause
  | UnsetFacetClause
  | SetStructuralClause

// ─── KML: lifecycle and correction ───────────────────────────────────

export interface RetractAssertionStatement extends BaseNode {
  kind: 'RetractAssertionStatement'
  target: TargetRef
  where?: WhereClause
  limit?: LimitClause
  expectState?: ExpectStateClause
}

export interface SupersedeAssertionStatement extends BaseNode {
  kind: 'SupersedeAssertionStatement'
  target: TargetRef
  by: TargetRef
  expectState?: ExpectStateClause
}

export interface CorrectEvidenceStatement extends BaseNode {
  kind: 'CorrectEvidenceStatement'
  target: TargetRef
  by: TargetRef
  expectState?: ExpectStateClause
}

export interface TransitionActivityStatement extends BaseNode {
  kind: 'TransitionActivityStatement'
  target: TargetRef
  to: ScalarValue
  finalize: (SetFieldsClause | SetStructuralClause)[]
  expectState?: ExpectStateClause
}

// ─── KML: retention and removal ──────────────────────────────────────

export interface SetRetentionStatement extends BaseNode {
  kind: 'SetRetentionStatement'
  target: TargetRef
  assignments: ObjectLiteral
  where?: WhereClause
  limit?: LimitClause
  expectVersion?: ExpectVersionClause
}

export interface ArchiveStatement extends BaseNode {
  kind: 'ArchiveStatement'
  target: TargetRef
  where?: WhereClause
  limit?: LimitClause
  expectState?: ExpectStateClause
}

export interface TombstoneStatement extends BaseNode {
  kind: 'TombstoneStatement'
  target: TargetRef
  where?: WhereClause
  limit?: LimitClause
  expectState?: ExpectStateClause
}

/** Physical erasure. The grammar freezes the confirmation as `CONFIRM "PURGE"`. */
export interface PurgeStatement extends BaseNode {
  kind: 'PurgeStatement'
  target: TargetRef
  where?: WhereClause
  limit?: LimitClause
  referencePolicy?: ScalarValue
  confirm: StringLiteral
}

/** Non-destructive: the source stays addressable as merged history. */
export interface MergeConceptStatement extends BaseNode {
  kind: 'MergeConceptStatement'
  source: TargetRef
  into: TargetRef
  where?: WhereClause
  expectVersion?: ExpectVersionClause
}

// ─── META: DESCRIBE ──────────────────────────────────────────────────

export type DescribeTargetKind =
  | 'PRIMER'
  | 'PROTOCOL'
  | 'EXECUTION_CONTEXT'
  | 'CAPABILITIES'
  | 'SPACE'
  | 'SCHEMA_ENVIRONMENT'
  | 'PACKAGE'
  | 'TYPE'
  | 'PREDICATE'
  | 'FACET'
  | 'STRUCTURAL_FIELD'
  | 'COMPATIBILITY'
  | 'ERROR'
  | 'TRANSACTION'
  | 'TRANSACTION_BY_IDEMPOTENCY_KEY'
  | 'SNAPSHOT'
  | 'CAPSULE'
  | 'EPISTEMIC_POLICY'
  | 'PROJECTION_CAPABILITY'
  | 'TRUST'
  | 'ACCESS'

export interface DescribeStatement extends BaseNode {
  kind: 'DescribeStatement'
  target: DescribeTargetKind
  /** The single operand, where the target takes one. */
  value?: ScalarValue
  /** `DESCRIBE PRIMER MODE ...` */
  mode?: ScalarValue
  /** `DESCRIBE COMPATIBILITY FROM ... TO ...` */
  from?: ScalarValue
  to?: ScalarValue
  /** `DESCRIBE SCHEMA ENVIRONMENT` / `DESCRIBE SNAPSHOT` */
  asOf?: AsOfClause
  /** `DESCRIBE ACCESS WITH {...}` */
  with?: ObjectLiteral
}

// ─── META: LIST ──────────────────────────────────────────────────────

export type ListTargetKind =
  | 'SPACES'
  | 'SCHEMA_PACKAGES'
  | 'TYPES'
  | 'PREDICATES'
  | 'FACETS'
  | 'STRUCTURAL_FIELDS'
  | 'EPISTEMIC_POLICIES'

export interface ListStatement extends BaseNode {
  kind: 'ListStatement'
  target: ListTargetKind
  /** `LIST SCHEMA PACKAGES STATUS ...` */
  status?: ScalarValue
  limit?: LimitClause
  cursor?: CursorClause
}

// ─── META: SEARCH ────────────────────────────────────────────────────

export type SearchKind =
  | 'CONCEPT'
  | 'PROPOSITION'
  | 'ASSERTION'
  | 'EVIDENCE'
  | 'ACTIVITY'
  | 'COGNITION'

/**
 * Grounding only: a SEARCH score is not confidence, and a miss is not absence.
 * The golden path is SEARCH → exact id → BELIEF/FIND.
 */
export interface SearchStatement extends BaseNode {
  kind: 'SearchStatement'
  searchKind: SearchKind
  term: ScalarValue
  withType?: ScalarValue
  withPredicate?: ScalarValue
  mode?: ScalarValue
  threshold?: ScalarValue
  /** `AS OF SEQ ...` — historical index basis. */
  asOfSeq?: ScalarValue
  limit?: LimitClause
  cursor?: CursorClause
}

// ─── META: VERIFY / VALIDATE / PREVIEW ───────────────────────────────

export type VerifyTargetKind =
  | 'CAPSULE'
  | 'SCHEMA_PACKAGE'
  | 'RECEIPT'
  | 'BLOB'
  | 'CHECKPOINT'

export interface VerifyStatement extends BaseNode {
  kind: 'VerifyStatement'
  target: VerifyTargetKind
  value: ScalarValue
}

export type ValidateTargetKind =
  | 'KQL'
  | 'KML'
  | 'CAPSULE'
  | 'SCHEMA_PACKAGE'
  | 'IMPORT_PLAN'

export interface ValidateStatement extends BaseNode {
  kind: 'ValidateStatement'
  target: ValidateTargetKind
  value: ScalarValue
  options?: ObjectLiteral
}

export interface PreviewStatement extends BaseNode {
  kind: 'PreviewStatement'
  target: 'KML' | 'IMPORT_CAPSULE'
  value: ScalarValue
  /** `PREVIEW IMPORT CAPSULE ... INTO ...` */
  into?: ScalarValue
}

// ─── META: HISTORY / CHANGES / SNAPSHOT ──────────────────────────────

export interface HistoryStatement extends BaseNode {
  kind: 'HistoryStatement'
  target: 'ELEMENT' | 'SPACE'
  /** Present for `HISTORY ELEMENT`. */
  value?: ScalarValue
  fromSeq?: ScalarValue
  toSeq?: ScalarValue
  limit?: LimitClause
  cursor?: CursorClause
}

export interface ChangesStatement extends BaseNode {
  kind: 'ChangesStatement'
  mode: 'SINCE' | 'AFTER_SEQ'
  value: ScalarValue
  limit?: LimitClause
}

export interface SnapshotStatement extends BaseNode {
  kind: 'SnapshotStatement'
  asOf?: AsOfClause
}

// ─── META: EXPORT CAPSULE ────────────────────────────────────────────

export interface ExportCapsuleStatement extends BaseNode {
  kind: 'ExportCapsuleStatement'
  target: TargetRef
  where: WhereClause
  options?: ObjectLiteral
  asOf?: AsOfClause
}

// ─── Expressions ─────────────────────────────────────────────────────

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | FunctionCallExpr
  | AggregateExpr
  | FieldAccess
  | VariableRef
  | ParameterRef
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayLiteral
  | ObjectLiteral
  | ObjectPattern
  | PropositionTuple

export interface BinaryExpression extends BaseNode {
  kind: 'BinaryExpression'
  operator: string
  left: Expression
  right: Expression
}

export interface UnaryExpression extends BaseNode {
  kind: 'UnaryExpression'
  operator: '!' | '-'
  operand: Expression
}

export interface FunctionCallExpr extends BaseNode {
  kind: 'FunctionCallExpr'
  name: string
  args: Expression[]
}

/** `COUNT(DISTINCT ?x)` and friends — legal in projection and sort positions. */
export interface AggregateExpr extends BaseNode {
  kind: 'AggregateExpr'
  name: string
  distinct: boolean
  argument: Expression
}

/**
 * `?x.facets["MnemonicState"].memory_strength` — a variable plus a dot path.
 *
 * Kept flat rather than as nested binary nodes because every consumer wants
 * the path as a sequence, and `lower` emits exactly that.
 */
export interface FieldAccess extends BaseNode {
  kind: 'FieldAccess'
  base: VariableRef
  steps: FieldStep[]
}

export type FieldStep = DotStep | IndexStep

export interface DotStep extends BaseNode {
  kind: 'DotStep'
  name: string
}

export interface IndexStep extends BaseNode {
  kind: 'IndexStep'
  key: StringLiteral
}

export interface VariableRef extends BaseNode {
  kind: 'VariableRef'
  name: string // including ?
}

export interface ParameterRef extends BaseNode {
  kind: 'ParameterRef'
  name: string // including :
}

export interface StringLiteral extends BaseNode {
  kind: 'StringLiteral'
  value: string // the raw string with quotes
  parsed: string // the unescaped value
}

export interface NumberLiteral extends BaseNode {
  kind: 'NumberLiteral'
  value: number
  raw: string
}

export interface BooleanLiteral extends BaseNode {
  kind: 'BooleanLiteral'
  value: boolean
}

export interface NullLiteral extends BaseNode {
  kind: 'NullLiteral'
}

export interface ArrayLiteral extends BaseNode {
  kind: 'ArrayLiteral'
  elements: Expression[]
  /**
   * Whether a comma preceded the closing bracket. JSON-value position tolerates
   * it; a FILTER list does not, and only the source says which was written.
   */
  trailingComma?: boolean
}

export interface ObjectLiteral extends BaseNode {
  kind: 'ObjectLiteral'
  entries: ObjectEntry[]
  /** See {@link ArrayLiteral.trailingComma}. */
  trailingComma?: boolean
}

export interface ObjectEntry extends BaseNode {
  kind: 'ObjectEntry'
  key: string
  /** Whether the key was originally quoted (e.g. `"description"` vs `description`) */
  isQuoted: boolean
  value: Expression
}
