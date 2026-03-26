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

export type Statement =
  | FindStatement
  | UpsertStatement
  | DeleteStatement
  | DescribeStatement
  | SearchStatement

// ─── FIND ────────────────────────────────────────────────────────────

export interface FindStatement extends BaseNode {
  kind: 'FindStatement'
  projections: Expression[]
  where?: WhereClause
  orderBy?: OrderByClause
  limit?: LimitClause
  cursor?: CursorClause
}

export interface OrderByClause extends BaseNode {
  kind: 'OrderByClause'
  expression: Expression
  direction: 'ASC' | 'DESC'
}

export interface LimitClause extends BaseNode {
  kind: 'LimitClause'
  value: NumberLiteral | ParameterRef
}

export interface CursorClause extends BaseNode {
  kind: 'CursorClause'
  value: StringLiteral | ParameterRef
}

// ─── WHERE ───────────────────────────────────────────────────────────

export interface WhereClause extends BaseNode {
  kind: 'WhereClause'
  patterns: WherePattern[]
}

export type WherePattern =
  | ConceptPattern
  | PropositionPattern
  | FilterClause
  | NotClause
  | OptionalClause
  | UnionClause

export interface ConceptPattern extends BaseNode {
  kind: 'ConceptPattern'
  variable?: string // ?var name (including ?)
  matcher: ConceptMatcher
}

export interface ConceptMatcher extends BaseNode {
  kind: 'ConceptMatcher'
  entries: ObjectEntry[] // {id: "...", type: "...", name: "..."}
}

export interface PropositionPattern extends BaseNode {
  kind: 'PropositionPattern'
  variable?: string // ?link
  subject: PropositionEndpoint
  predicate: PredicateExpr
  object: PropositionEndpoint
}

export type PropositionEndpoint =
  | VariableRef
  | ConceptPattern
  | PropositionPattern

export type PredicateExpr = PredicateLiteral | PredicateAlternation

export interface PredicateLiteral extends BaseNode {
  kind: 'PredicateLiteral'
  value: string // the string value without quotes
  hopRange?: HopRange
}

export interface PredicateAlternation extends BaseNode {
  kind: 'PredicateAlternation'
  predicates: PredicateLiteral[]
}

export interface HopRange extends BaseNode {
  kind: 'HopRange'
  min: number
  max?: number // undefined means unbounded
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

// ─── UPSERT ──────────────────────────────────────────────────────────

export interface UpsertStatement extends BaseNode {
  kind: 'UpsertStatement'
  blocks: UpsertBlock[]
  metadata?: WithMetadata
}

export type UpsertBlock = ConceptBlock | PropositionBlock

export interface ConceptBlock extends BaseNode {
  kind: 'ConceptBlock'
  handle: string // ?local_handle
  matcher: ConceptMatcher
  setAttributes?: SetAttributes
  setPropositions?: SetPropositions
  metadata?: WithMetadata
}

export interface PropositionBlock extends BaseNode {
  kind: 'PropositionBlock'
  handle?: string
  subject: PropositionEndpoint
  predicate: PredicateExpr
  object: PropositionEndpoint
  setAttributes?: SetAttributes
  metadata?: WithMetadata
}

export interface SetAttributes extends BaseNode {
  kind: 'SetAttributes'
  entries: ObjectEntry[]
}

export interface SetPropositions extends BaseNode {
  kind: 'SetPropositions'
  items: PropositionItem[]
}

export interface PropositionItem extends BaseNode {
  kind: 'PropositionItem'
  predicate: string
  target: PropositionEndpoint
  metadata?: WithMetadata
}

export interface WithMetadata extends BaseNode {
  kind: 'WithMetadata'
  entries: ObjectEntry[]
}

// ─── DELETE ──────────────────────────────────────────────────────────

export interface DeleteStatement extends BaseNode {
  kind: 'DeleteStatement'
  deleteType: 'ATTRIBUTES' | 'METADATA' | 'PROPOSITIONS' | 'CONCEPT'
  /** For ATTRIBUTES/METADATA: the set of keys to delete */
  keys?: string[]
  /** The target variable */
  target: string
  /** DETACH flag for CONCEPT deletion */
  detach?: boolean
  where: WhereClause
}

// ─── DESCRIBE ────────────────────────────────────────────────────────

export interface DescribeStatement extends BaseNode {
  kind: 'DescribeStatement'
  describeType:
    | 'PRIMER'
    | 'DOMAINS'
    | 'CONCEPT_TYPES'
    | 'CONCEPT_TYPE'
    | 'PROPOSITION_TYPES'
    | 'PROPOSITION_TYPE'
  /** The type/predicate name for specific describe */
  typeName?: string
  limit?: LimitClause
  cursor?: CursorClause
}

// ─── SEARCH ──────────────────────────────────────────────────────────

export interface SearchStatement extends BaseNode {
  kind: 'SearchStatement'
  searchTarget: 'CONCEPT' | 'PROPOSITION'
  term: string
  withType?: string
  limit?: LimitClause
}

// ─── Expressions ─────────────────────────────────────────────────────

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | FunctionCallExpr
  | DotExpression
  | VariableRef
  | ParameterRef
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayLiteral
  | ObjectLiteral

export interface BinaryExpression extends BaseNode {
  kind: 'BinaryExpression'
  operator: string
  left: Expression
  right: Expression
}

export interface UnaryExpression extends BaseNode {
  kind: 'UnaryExpression'
  operator: '!'
  operand: Expression
}

export interface FunctionCallExpr extends BaseNode {
  kind: 'FunctionCallExpr'
  name: string
  args: Expression[]
}

export interface DotExpression extends BaseNode {
  kind: 'DotExpression'
  object: Expression
  property: string
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
}

export interface ObjectLiteral extends BaseNode {
  kind: 'ObjectLiteral'
  entries: ObjectEntry[]
}

export interface ObjectEntry extends BaseNode {
  kind: 'ObjectEntry'
  key: string
  /** Whether the key was originally quoted (e.g. `"description"` vs `description`) */
  isQuoted: boolean
  value: Expression
}
