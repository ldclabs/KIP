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

  // ── Keywords — KQL ────────────────────────────────────────────────
  Find = 'FIND',
  Where = 'WHERE',
  Filter = 'FILTER',
  Not = 'NOT',
  Optional = 'OPTIONAL',
  Union = 'UNION',
  Belief = 'BELIEF',
  Slot = 'SLOT',
  Order = 'ORDER',
  By = 'BY',
  Asc = 'ASC',
  Desc = 'DESC',
  Limit = 'LIMIT',
  Cursor = 'CURSOR',
  Distinct = 'DISTINCT',
  As = 'AS',
  Of = 'OF',
  At = 'AT',
  Seq = 'SEQ',
  Time = 'TIME',
  For = 'FOR',
  Epistemic = 'EPISTEMIC',

  // ── Keywords — element kinds (shared KQL/KML/META) ────────────────
  Concept = 'CONCEPT',
  Proposition = 'PROPOSITION',
  Assertion = 'ASSERTION',
  Evidence = 'EVIDENCE',
  Activity = 'ACTIVITY',
  Structural = 'STRUCTURAL',

  // ── Keywords — KML ────────────────────────────────────────────────
  Mutate = 'MUTATE',
  Create = 'CREATE',
  Upsert = 'UPSERT',
  Ensure = 'ENSURE',
  Assert = 'ASSERT',
  Superseding = 'SUPERSEDING',
  Update = 'UPDATE',
  Transition = 'TRANSITION',
  Set = 'SET',
  Unset = 'UNSET',
  Retention = 'RETENTION',
  Purge = 'PURGE',
  Payload = 'PAYLOAD',
  Confirm = 'CONFIRM',
  Reference = 'REFERENCE',
  Policy = 'POLICY',
  Merge = 'MERGE',
  Into = 'INTO',
  To = 'TO',
  Type = 'TYPE',
  Client = 'CLIENT',
  Key = 'KEY',
  Name = 'NAME',
  Match = 'MATCH',
  Fields = 'FIELDS',
  Attributes = 'ATTRIBUTES',
  Facet = 'FACET',
  Expect = 'EXPECT',
  Version = 'VERSION',

  // ── Keywords — META ───────────────────────────────────────────────
  Describe = 'DESCRIBE',
  List = 'LIST',
  Search = 'SEARCH',
  Verify = 'VERIFY',
  Validate = 'VALIDATE',
  Preview = 'PREVIEW',
  History = 'HISTORY',
  Changes = 'CHANGES',
  Snapshot = 'SNAPSHOT',
  Export = 'EXPORT',
  Primer = 'PRIMER',
  Mode = 'MODE',
  Protocol = 'PROTOCOL',
  Capabilities = 'CAPABILITIES',
  Space = 'SPACE',
  Spaces = 'SPACES',
  Schema = 'SCHEMA',
  Environment = 'ENVIRONMENT',
  Package = 'PACKAGE',
  Packages = 'PACKAGES',
  Predicate = 'PREDICATE',
  Predicates = 'PREDICATES',
  Field = 'FIELD',
  Facets = 'FACETS',
  Types = 'TYPES',
  Policies = 'POLICIES',
  Dependents = 'DEPENDENTS',
  Depth = 'DEPTH',
  Compatibility = 'COMPATIBILITY',
  From = 'FROM',
  Error = 'ERROR',
  Transaction = 'TRANSACTION',
  Idempotency = 'IDEMPOTENCY',
  Capsule = 'CAPSULE',
  Trust = 'TRUST',
  Access = 'ACCESS',
  With = 'WITH',
  Status = 'STATUS',
  Cognition = 'COGNITION',
  Threshold = 'THRESHOLD',
  Receipt = 'RECEIPT',
  Blob = 'BLOB',
  Checkpoint = 'CHECKPOINT',
  Kql = 'KQL',
  Kml = 'KML',
  Import = 'IMPORT',
  Plan = 'PLAN',
  Element = 'ELEMENT',
  Since = 'SINCE',
  After = 'AFTER',

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
  Minus = '-',

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

/**
 * Every KIP 2.0 protocol keyword, keyed by its canonical uppercase spelling.
 *
 * KIP 2.0 keywords are ASCII case-insensitive (canonical rendering is
 * uppercase), so the lexer looks names up here after upper-casing. Schema
 * symbols and string values keep their own case-sensitive contracts.
 */
export const KEYWORDS: ReadonlyMap<string, TokenType> = new Map([
  // KQL
  ['FIND', TokenType.Find],
  ['WHERE', TokenType.Where],
  ['FILTER', TokenType.Filter],
  ['NOT', TokenType.Not],
  ['OPTIONAL', TokenType.Optional],
  ['UNION', TokenType.Union],
  ['BELIEF', TokenType.Belief],
  ['SLOT', TokenType.Slot],
  ['ORDER', TokenType.Order],
  ['BY', TokenType.By],
  ['ASC', TokenType.Asc],
  ['DESC', TokenType.Desc],
  ['LIMIT', TokenType.Limit],
  ['CURSOR', TokenType.Cursor],
  ['DISTINCT', TokenType.Distinct],
  ['AS', TokenType.As],
  ['OF', TokenType.Of],
  ['AT', TokenType.At],
  ['SEQ', TokenType.Seq],
  ['TIME', TokenType.Time],
  ['FOR', TokenType.For],
  ['EPISTEMIC', TokenType.Epistemic],

  // Element kinds
  ['CONCEPT', TokenType.Concept],
  ['PROPOSITION', TokenType.Proposition],
  ['ASSERTION', TokenType.Assertion],
  ['EVIDENCE', TokenType.Evidence],
  ['ACTIVITY', TokenType.Activity],
  ['STRUCTURAL', TokenType.Structural],

  // KML
  ['MUTATE', TokenType.Mutate],
  ['CREATE', TokenType.Create],
  ['UPSERT', TokenType.Upsert],
  ['ENSURE', TokenType.Ensure],
  ['ASSERT', TokenType.Assert],
  ['SUPERSEDING', TokenType.Superseding],
  ['UPDATE', TokenType.Update],
  ['TRANSITION', TokenType.Transition],
  ['SET', TokenType.Set],
  ['UNSET', TokenType.Unset],
  ['RETENTION', TokenType.Retention],
  ['PURGE', TokenType.Purge],
  ['PAYLOAD', TokenType.Payload],
  ['CONFIRM', TokenType.Confirm],
  ['REFERENCE', TokenType.Reference],
  ['POLICY', TokenType.Policy],
  ['MERGE', TokenType.Merge],
  ['INTO', TokenType.Into],
  ['TO', TokenType.To],
  ['TYPE', TokenType.Type],
  ['CLIENT', TokenType.Client],
  ['KEY', TokenType.Key],
  ['NAME', TokenType.Name],
  ['MATCH', TokenType.Match],
  ['FIELDS', TokenType.Fields],
  ['ATTRIBUTES', TokenType.Attributes],
  ['FACET', TokenType.Facet],
  ['EXPECT', TokenType.Expect],
  ['VERSION', TokenType.Version],

  // META
  ['DESCRIBE', TokenType.Describe],
  ['LIST', TokenType.List],
  ['SEARCH', TokenType.Search],
  ['VERIFY', TokenType.Verify],
  ['VALIDATE', TokenType.Validate],
  ['PREVIEW', TokenType.Preview],
  ['HISTORY', TokenType.History],
  ['CHANGES', TokenType.Changes],
  ['SNAPSHOT', TokenType.Snapshot],
  ['EXPORT', TokenType.Export],
  ['PRIMER', TokenType.Primer],
  ['MODE', TokenType.Mode],
  ['PROTOCOL', TokenType.Protocol],
  ['CAPABILITIES', TokenType.Capabilities],
  ['SPACE', TokenType.Space],
  ['SPACES', TokenType.Spaces],
  ['SCHEMA', TokenType.Schema],
  ['ENVIRONMENT', TokenType.Environment],
  ['PACKAGE', TokenType.Package],
  ['PACKAGES', TokenType.Packages],
  ['PREDICATE', TokenType.Predicate],
  ['PREDICATES', TokenType.Predicates],
  ['FIELD', TokenType.Field],
  ['FACETS', TokenType.Facets],
  ['TYPES', TokenType.Types],
  ['POLICIES', TokenType.Policies],
  ['DEPENDENTS', TokenType.Dependents],
  ['DEPTH', TokenType.Depth],
  ['COMPATIBILITY', TokenType.Compatibility],
  ['FROM', TokenType.From],
  ['ERROR', TokenType.Error],
  ['TRANSACTION', TokenType.Transaction],
  ['IDEMPOTENCY', TokenType.Idempotency],
  ['CAPSULE', TokenType.Capsule],
  ['TRUST', TokenType.Trust],
  ['ACCESS', TokenType.Access],
  ['WITH', TokenType.With],
  ['STATUS', TokenType.Status],
  ['COGNITION', TokenType.Cognition],
  ['THRESHOLD', TokenType.Threshold],
  ['RECEIPT', TokenType.Receipt],
  ['BLOB', TokenType.Blob],
  ['CHECKPOINT', TokenType.Checkpoint],
  ['KQL', TokenType.Kql],
  ['KML', TokenType.Kml],
  ['IMPORT', TokenType.Import],
  ['PLAN', TokenType.Plan],
  ['ELEMENT', TokenType.Element],
  ['SINCE', TokenType.Since],
  ['AFTER', TokenType.After]
])

/**
 * Aggregate names legal in `aggregate_expression`.
 *
 * The grammar spells these as terminals, but `function_call` is an open
 * `identifier, "(" ...`, so they stay lexical identifiers and the parser
 * recognizes them by name. That keeps one rule for every call shape.
 */
export const AGGREGATES: ReadonlySet<string> = new Set([
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX'
])

/**
 * Runtime functions KIP 2.0 registers by name.
 *
 * `function_call` is syntactically open so namespaced and future functions
 * still parse; this set is what the semantic layer and editor tooling treat
 * as known. Membership is not a parse-time gate.
 */
export const FUNCTIONS: ReadonlySet<string> = new Set([
  // Filter predicates
  'IN',
  'CONTAINS',
  'STARTS_WITH',
  'ENDS_WITH',
  'REGEX',
  'IS_NULL',
  'IS_NOT_NULL',
  'IS_LITERAL',
  'IS_ELEMENT',
  'IS_KIND',
  'LITERAL_TYPE',
  // Deterministic update expressions
  'ADD',
  'MUL',
  'CLAMP',
  'COALESCE',
  // Aggregates
  ...AGGREGATES
])

/** Reverse lookup set, built once, so membership tests are O(1). */
const KEYWORD_TYPES: ReadonlySet<TokenType> = new Set(KEYWORDS.values())

export function isKeyword(type: TokenType): boolean {
  return KEYWORD_TYPES.has(type)
}

export function isFunction(name: string): boolean {
  return FUNCTIONS.has(name.toUpperCase())
}

export function isAggregate(name: string): boolean {
  return AGGREGATES.has(name.toUpperCase())
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

/**
 * True when a token may stand where the grammar writes `identifier`.
 *
 * KIP 2.0 keywords are contextual, not reserved: the Spec's own examples use
 * `by`, `mode`, `at`, `key`, `name`, `type` and `status` as object keys, and
 * `?a.lifecycle.status` as a dot path. Rejecting a keyword in those positions
 * would make the normative examples unparseable, so every keyword doubles as
 * an identifier outside the position that gives it meaning.
 */
export function isIdentifierLike(type: TokenType): boolean {
  return type === TokenType.Identifier || isKeyword(type)
}
