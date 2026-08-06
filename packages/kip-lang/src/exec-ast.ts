/**
 * The *executable* KIP AST.
 *
 * This is a different tree from `ast.ts`, on purpose. `ast.ts` is a syntax
 * tree: it keeps ranges, comments, quoting style and raw number text, because
 * a formatter and an editor need to reproduce the source. This tree is what an
 * engine needs instead — every construct already collapsed to the one shape it
 * means, with the open-ended parts of the grammar closed:
 *
 *  - a concept matcher is one of four identified forms, not a bag of entries;
 *  - a filter is a comparison, a logical node, a negation, or a call to one of
 *    seven functions, not a general expression tree;
 *  - a variable is a name and a dot path, not a chain of member accesses.
 *
 * A consumer switching on these tags is total: there is no "some other
 * function name" case to defend against, because `lower` rejected it.
 *
 * The shape is the wire form of `anda_kip`'s Rust AST (serde's default
 * externally-tagged enum encoding), so an engine can consume either
 * interchangeably and a differential test can compare them field for field.
 */

/** A JSON value, as carried by attribute and metadata blocks. */
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json }

/** A KIP literal. Externally tagged; `Null` is a bare string. */
export type KipValue =
  | 'Null'
  | { Bool: boolean }
  | { Number: number }
  | { String: string }
  | { Array: KipValue[] }
  | { Object: Record<string, KipValue> }

/** One parsed command. */
export type Command =
  | { Kql: KqlQuery }
  | { Kml: KmlStatement }
  | { Meta: MetaCommand }

// ---------------------------------------------------------------------------
// KQL
// ---------------------------------------------------------------------------

export interface KqlQuery {
  find_clause: FindClause
  where_clauses: WhereClause[]
  order_by: OrderByItem[] | null
  limit: number | null
  cursor: string | null
}

export interface FindClause {
  expressions: FindExpression[]
}

/** `?var` with an optional dot path, e.g. `?d.attributes.risk`. Names carry no `?`. */
export interface DotPathVar {
  var: string
  path: string[]
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
  | { Concept: { variable: string; matcher: ConceptMatcher } }
  | { Proposition: { variable: string | null; matcher: PropositionMatcher } }
  | { Filter: { expression: FilterExpression } }
  | { Not: WhereClause[] }
  | { Optional: WhereClause[] }
  | { Union: WhereClause[] }

export type ConceptMatcher =
  | { ID: string }
  | { Type: string }
  | { Name: string }
  | { Object: { type: string; name: string } }

export type PropositionMatcher =
  | { ID: string }
  | {
      Object: {
        subject: TargetTerm
        predicate: PredTerm
        object: TargetTerm
      }
    }

/**
 * One endpoint of a proposition pattern.
 *
 * `Proposition` is the meta-statement case: an endpoint may itself be a
 * proposition, which is how KIP states things about statements. It nests
 * arbitrarily deep.
 */
export type TargetTerm =
  | { Variable: string }
  | { Concept: ConceptMatcher }
  | { Proposition: PropositionMatcher }

export type PredTerm =
  | { Variable: string }
  | { Literal: string }
  | { Alternative: string[] }
  | { MultiHop: { predicate: string; min: number; max: number | null } }

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
  | { List: KipValue[] }

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

// ---------------------------------------------------------------------------
// KML
// ---------------------------------------------------------------------------

export type KmlStatement =
  | { Upsert: UpsertBlock[] }
  | { Update: UpdateStatement }
  | { Merge: MergeStatement }
  | { Delete: DeleteStatement }

export interface UpsertBlock {
  items: UpsertItem[]
  metadata: Record<string, Json> | null
}

export type UpsertItem =
  | { Concept: ConceptBlock }
  | { Proposition: PropositionBlock }

export interface ConceptBlock {
  handle: string | null
  concept: ConceptMatcher
  set_attributes: Record<string, Json> | null
  set_propositions: SetProposition[] | null
  metadata: Record<string, Json> | null
  /** `EXPECT VERSION <n>` — optimistic guard, omitted when not written. */
  expect_version?: number
}

export interface SetProposition {
  predicate: string
  object: TargetTerm
  metadata: Record<string, Json> | null
}

export interface PropositionBlock {
  handle: string | null
  proposition: PropositionMatcher
  set_attributes: Record<string, Json> | null
  metadata: Record<string, Json> | null
  expect_version?: number
}

export interface UpdateStatement {
  target: string
  set_attributes: [string, UpdateValue][] | null
  set_metadata: [string, UpdateValue][] | null
  where_clauses: WhereClause[]
  limit: number | null
}

/**
 * An UPDATE right-hand side: a literal, or arithmetic over the target's *own*
 * fields. References to any other variable are rejected during lowering, which
 * is what lets each matched element be updated from its own row without a join.
 */
export type UpdateValue = { Json: Json } | { Expr: UpdateExpr }

export type UpdateExpr =
  | { Variable: DotPathVar }
  | { Number: number }
  | { Function: { func: UpdateFunction; args: UpdateExpr[] } }

export type UpdateFunction = 'Add' | 'Mul' | 'Clamp' | 'Coalesce'

export interface MergeStatement {
  source: string
  target: string
  where_clauses: WhereClause[]
}

export type DeleteStatement =
  | {
      DeleteAttributes: {
        attributes: string[]
        target: string
        where_clauses: WhereClause[]
      }
    }
  | {
      DeleteMetadata: {
        keys: string[]
        target: string
        where_clauses: WhereClause[]
      }
    }
  | { DeletePropositions: { target: string; where_clauses: WhereClause[] } }
  | { DeleteConcept: { target: string; where_clauses: WhereClause[] } }

// ---------------------------------------------------------------------------
// META
// ---------------------------------------------------------------------------

export type MetaCommand =
  | { Describe: DescribeTarget }
  | { Search: SearchCommand }
  | { Export: ExportCommand }

export type DescribeTarget =
  | 'Primer'
  | 'Domains'
  | { ConceptTypes: { limit: number | null; cursor: string | null } }
  | { ConceptType: string }
  | { PropositionTypes: { limit: number | null; cursor: string | null } }
  | { PropositionType: string }

export interface SearchCommand {
  target: SearchTarget
  term: string
  in_type: string | null
  /** Omitted when the command wrote no `MODE`. */
  mode?: SearchMode
  /** Omitted when the command wrote no `THRESHOLD`. */
  threshold?: number
  limit: number | null
}

export type SearchTarget = 'Concept' | 'Proposition'

export type SearchMode = 'Keyword' | 'Semantic' | 'Hybrid'

export interface ExportCommand {
  target: string
  where_clauses: WhereClause[]
  limit: number | null
  /** Omitted when the command wrote no `CURSOR`. */
  cursor?: string
}
