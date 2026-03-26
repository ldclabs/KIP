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

  // Keywords - META
  Describe = 'DESCRIBE',
  Search = 'SEARCH',
  Primer = 'PRIMER',
  Domains = 'DOMAINS',
  Type = 'TYPE',
  Types = 'TYPES',

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
  ['DESCRIBE', TokenType.Describe],
  ['SEARCH', TokenType.Search],
  ['PRIMER', TokenType.Primer],
  ['DOMAINS', TokenType.Domains],
  ['TYPE', TokenType.Type],
  ['TYPES', TokenType.Types]
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
  ['DISTINCT', TokenType.Distinct]
])

export function isKeyword(type: TokenType): boolean {
  for (const v of KEYWORDS.values()) {
    if (v === type) return true
  }
  return false
}

export function isFunction(type: TokenType): boolean {
  for (const v of FUNCTIONS.values()) {
    if (v === type) return true
  }
  return false
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
