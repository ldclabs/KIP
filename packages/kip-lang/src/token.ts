export enum TokenType {
  // Trivia
  Whitespace = 'Whitespace',
  Newline = 'Newline',
  Comment = 'Comment',

  // Literals
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Null = 'Null',

  // Identifiers & Variables
  Identifier = 'Identifier',
  Variable = 'Variable', // ?foo
  Parameter = 'Parameter', // :foo
  SystemIdent = 'SystemIdent', // $foo

  // Keywords - KQL
  Find = 'FIND',
  Where = 'WHERE',
  OrderBy = 'ORDER_BY', // matched as two tokens then merged
  Limit = 'LIMIT',
  Cursor = 'CURSOR',
  Filter = 'FILTER',
  Not = 'NOT',
  Optional = 'OPTIONAL',
  Union = 'UNION',
  Asc = 'ASC',
  Desc = 'DESC',

  // Keywords - KML
  Upsert = 'UPSERT',
  Update = 'UPDATE',
  Merge = 'MERGE',
  Delete = 'DELETE',
  Concept = 'CONCEPT',
  Proposition = 'PROPOSITION',
  Set = 'SET',
  Attributes = 'ATTRIBUTES',
  Propositions = 'PROPOSITIONS',
  With = 'WITH',
  Metadata = 'METADATA',
  Detach = 'DETACH',
  From = 'FROM',
  Into = 'INTO',
  Expect = 'EXPECT',
  Version = 'VERSION',

  // Keywords - META
  Describe = 'DESCRIBE',
  Search = 'SEARCH',
  Export = 'EXPORT',
  Primer = 'PRIMER',
  Domains = 'DOMAINS',
  Type = 'TYPE',
  Types = 'TYPES',
  Mode = 'MODE',
  Threshold = 'THRESHOLD',

  // Keywords - common
  Order = 'ORDER',
  By = 'BY',

  // Built-in functions
  Count = 'COUNT',
  Sum = 'SUM',
  Avg = 'AVG',
  Min = 'MIN',
  Max = 'MAX',
  Contains = 'CONTAINS',
  StartsWith = 'STARTS_WITH',
  EndsWith = 'ENDS_WITH',
  Regex = 'REGEX',
  In = 'IN',
  IsNull = 'IS_NULL',
  IsNotNull = 'IS_NOT_NULL',
  Distinct = 'DISTINCT',
  Add = 'ADD',
  Mul = 'MUL',
  Clamp = 'CLAMP',
  Coalesce = 'COALESCE',

  // Operators
  Eq = '==',
  NotEq = '!=',
  Lt = '<',
  Gt = '>',
  LtEq = '<=',
  GtEq = '>=',
  And = '&&',
  Or = '||',
  Bang = '!',

  // Punctuation
  LBrace = '{',
  RBrace = '}',
  LParen = '(',
  RParen = ')',
  LBracket = '[',
  RBracket = ']',
  Comma = ',',
  Colon = ':',
  Dot = '.',
  Pipe = '|',

  // Special
  EOF = 'EOF',
  Unknown = 'Unknown'
}

export interface Position {
  /** 0-based line number */
  line: number
  /** 0-based column (character offset within line) */
  column: number
}

export interface Range {
  start: Position
  end: Position
}

export interface Token {
  type: TokenType
  value: string
  /** Byte offset in source */
  offset: number
  line: number
  column: number
}

/** Set of all KIP keywords (uppercase) mapped to their TokenType */
export const KEYWORDS: ReadonlyMap<string, TokenType> = new Map([
  ['FIND', TokenType.Find],
  ['WHERE', TokenType.Where],
  ['ORDER', TokenType.Order],
  ['BY', TokenType.By],
  ['LIMIT', TokenType.Limit],
  ['CURSOR', TokenType.Cursor],
  ['FILTER', TokenType.Filter],
  ['NOT', TokenType.Not],
  ['OPTIONAL', TokenType.Optional],
  ['UNION', TokenType.Union],
  ['ASC', TokenType.Asc],
  ['DESC', TokenType.Desc],
  ['UPSERT', TokenType.Upsert],
  ['UPDATE', TokenType.Update],
  ['MERGE', TokenType.Merge],
  ['DELETE', TokenType.Delete],
  ['CONCEPT', TokenType.Concept],
  ['PROPOSITION', TokenType.Proposition],
  ['SET', TokenType.Set],
  ['ATTRIBUTES', TokenType.Attributes],
  ['PROPOSITIONS', TokenType.Propositions],
  ['WITH', TokenType.With],
  ['METADATA', TokenType.Metadata],
  ['DETACH', TokenType.Detach],
  ['FROM', TokenType.From],
  ['INTO', TokenType.Into],
  ['EXPECT', TokenType.Expect],
  ['VERSION', TokenType.Version],
  ['DESCRIBE', TokenType.Describe],
  ['SEARCH', TokenType.Search],
  ['EXPORT', TokenType.Export],
  ['PRIMER', TokenType.Primer],
  ['DOMAINS', TokenType.Domains],
  ['TYPE', TokenType.Type],
  ['TYPES', TokenType.Types],
  ['MODE', TokenType.Mode],
  ['THRESHOLD', TokenType.Threshold]
])

/** Set of built-in function names mapped to their TokenType */
export const FUNCTIONS: ReadonlyMap<string, TokenType> = new Map([
  ['COUNT', TokenType.Count],
  ['SUM', TokenType.Sum],
  ['AVG', TokenType.Avg],
  ['MIN', TokenType.Min],
  ['MAX', TokenType.Max],
  ['CONTAINS', TokenType.Contains],
  ['STARTS_WITH', TokenType.StartsWith],
  ['ENDS_WITH', TokenType.EndsWith],
  ['REGEX', TokenType.Regex],
  ['IN', TokenType.In],
  ['IS_NULL', TokenType.IsNull],
  ['IS_NOT_NULL', TokenType.IsNotNull],
  ['DISTINCT', TokenType.Distinct],
  ['ADD', TokenType.Add],
  ['MUL', TokenType.Mul],
  ['CLAMP', TokenType.Clamp],
  ['COALESCE', TokenType.Coalesce]
])

/** Reverse lookup sets, built once, so membership tests are O(1). */
const KEYWORD_TYPES: ReadonlySet<TokenType> = new Set(KEYWORDS.values())
const FUNCTION_TYPES: ReadonlySet<TokenType> = new Set(FUNCTIONS.values())

export function isKeyword(type: TokenType): boolean {
  return KEYWORD_TYPES.has(type)
}

export function isFunction(type: TokenType): boolean {
  return FUNCTION_TYPES.has(type)
}

export function isLiteral(type: TokenType): boolean {
  return (
    type === TokenType.String ||
    type === TokenType.Number ||
    type === TokenType.Boolean ||
    type === TokenType.Null
  )
}

export function isTrivia(type: TokenType): boolean {
  return (
    type === TokenType.Whitespace ||
    type === TokenType.Newline ||
    type === TokenType.Comment
  )
}
