export { tokenize } from './lexer.js'
export { parse } from './parser.js'
export type { ParseResult } from './parser.js'
export { format } from './formatter.js'
export type { FormatOptions } from './formatter.js'
export { diagnose } from './diagnostics.js'
export type { Diagnostic } from './diagnostics.js'
export { analyzeSemantics } from './semantics.js'

export {
  TokenType,
  KEYWORDS,
  FUNCTIONS,
  isKeyword,
  isFunction,
  isLiteral,
  isTrivia
} from './token.js'
export type { Token, Position, Range } from './token.js'

export type {
  Program,
  Statement,
  FindStatement,
  UpsertStatement,
  UpdateStatement,
  MergeStatement,
  DeleteStatement,
  DescribeStatement,
  SearchStatement,
  ExportStatement,
  WhereClause,
  WherePattern,
  OrderByClause,
  OrderByKey,
  LimitClause,
  CursorClause,
  ThresholdClause,
  ConceptPattern,
  ConceptMatcher,
  PropositionPattern,
  PropositionEndpoint,
  PredicateExpr,
  PredicateLiteral,
  PredicateVariable,
  PredicateAlternation,
  HopRange,
  FilterClause,
  NotClause,
  OptionalClause,
  UnionClause,
  ConceptBlock,
  PropositionBlock,
  ExpectVersion,
  SetAttributes,
  SetMetadata,
  SetPropositions,
  PropositionItem,
  WithMetadata,
  Expression,
  BinaryExpression,
  UnaryExpression,
  FunctionCallExpr,
  DotExpression,
  VariableRef,
  ParameterRef,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
  ObjectEntry,
  ObjectLiteral,
  ArrayLiteral
} from './ast.js'

export { lower, lowerAll, lowerStatement } from './lower.js'
export {
  checkBudget,
  checkBatchBudget,
  MAX_KIP_INPUT_LEN,
  MAX_KIP_NESTING_DEPTH,
  MAX_KIP_BATCH_COMMANDS
} from './budget.js'
export { KipSyntaxError, invalidSyntax, resourceExhausted } from './errors.js'
export type { KipSyntaxCode } from './errors.js'

export type {
  Command,
  Json,
  KipValue,
  KqlQuery,
  FindClause,
  FindExpression,
  DotPathVar,
  AggregationFunction,
  OrderByItem,
  OrderDirection,
  WhereClause as ExecWhereClause,
  ConceptMatcher as ExecConceptMatcher,
  PropositionMatcher,
  TargetTerm,
  PredTerm,
  FilterExpression,
  FilterOperand,
  FilterFunction,
  ComparisonOperator,
  LogicalOperator,
  KmlStatement,
  UpsertBlock as ExecUpsertBlock,
  UpsertItem,
  ConceptBlock as ExecConceptBlock,
  PropositionBlock as ExecPropositionBlock,
  SetProposition,
  UpdateStatement as ExecUpdateStatement,
  UpdateValue,
  UpdateExpr,
  UpdateFunction,
  MergeStatement as ExecMergeStatement,
  DeleteStatement as ExecDeleteStatement,
  MetaCommand,
  DescribeTarget,
  SearchCommand,
  SearchTarget,
  SearchMode,
  ExportCommand
} from './exec-ast.js'

export { PARSER_VERSION, KIP_SPEC_REVISION } from './version.js'
