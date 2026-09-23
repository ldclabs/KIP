/** Small executable contract model, not a Brain or Nexus implementation.
 * Trusted context/source inputs stand for independently authenticated host data.
 * Engine adapters must exercise their real paths rather than import this model. */
import { createHash } from 'node:crypto'
import { canonicalize } from '../../packages/kip-lang/dist/index.js'

const mutations = new Set(['observe', 'revise', 'feedback', 'forget'])
const terminalDispositions = new Set(['formed', 'evidence_only', 'skipped', 'erased'])
const phases = ['recorded', 'processed', 'available']
export const channels = ['constraints', 'commitments', 'dependencies', 'failures', 'experiences', 'skills', 'evidence']
const clone = value => structuredClone(value)
const error = code => Object.assign(new Error(code), { code })
const sequence = value => Number.isSafeInteger(value) && value >= 0

export function validateBundles(names, registry) {
  const selected = new Set(names)
  if (!selected.has('memory_basic')) throw error('UnsupportedCapability')
  for (const name of selected) {
    if (!Object.hasOwn(registry, name) || registry[name].requires.some(dependency => !selected.has(dependency)))
      throw error('UnsupportedCapability')
  }
  return true
}

export function scopeMatches(stored, requested) {
  if (stored.task_ref && stored.task_ref !== requested.task_ref) return false
  const contexts = new Set(requested.context_refs ?? [])
  return (stored.context_refs ?? []).every(context => contexts.has(context))
}

export function advanceProgress(receipt, current, next) {
  if (current.receipt_ref !== receipt.receipt_ref || next.receipt_ref !== receipt.receipt_ref)
    throw error('ReferenceError')
  if (current.phase === 'available' || current.phase === 'failed')
    throw error('InvalidLifecycleTransition')
  if (next.phase === 'failed') {
    if (!next.error) throw error('InvalidRequestEnvelope')
    return clone(next)
  }
  const from = phases.indexOf(current.phase), to = phases.indexOf(next.phase)
  if (from < 0 || to <= from) throw error('InvalidLifecycleTransition')
  if (!terminalDispositions.has(next.disposition) || !sequence(next.resolved_seq) ||
      next.resolved_seq < receipt.accepted_seq) throw error('PreconditionFailed')
  if (next.disposition === 'erased' && receipt.operation !== 'forget') throw error('ConstraintViolation')
  if (current.phase === 'processed' && (next.resolved_seq !== current.resolved_seq ||
      next.disposition !== current.disposition)) throw error('ImmutableField')
  if (next.phase === 'available' && (!sequence(next.available_seq) || next.available_seq < next.resolved_seq))
    throw error('PreconditionFailed')
  if (next.phase !== 'available' && Object.hasOwn(next, 'available_seq')) throw error('InvalidRequestEnvelope')
  return clone(next)
}

/** Fixture ledger can be snapshotted/restarted to check idempotent intake. */
export class IntakeLedger {
  constructor(snapshot = { next: 1, records: [], keys: [] }) { this.state = clone(snapshot) }
  snapshot() { return clone(this.state) }
  admit(context, request, source) {
    if (!mutations.has(request.operation) || !request.idempotency_key || !sequence(context.accepted_seq))
      throw error('InvalidRequestEnvelope')
    // Canonical context sets are supplied by the host, not inferred from names.
    const scope = { ...request.scope, context_refs: [...new Set(request.scope?.context_refs ?? [])].sort() }
    const intent = { operation: request.operation, scope, input: request.input }
    const semantic = { ...intent,
      source: source ? { identity: source.identity, digest: source.digest } : null }
    const digest = createHash('sha256').update(canonicalize(semantic)).digest('hex')
    const key = canonicalize([context.principal, context.space_id, request.operation, request.idempotency_key])
    const retained = this.state.keys.find(entry => entry.key === key)
    if (retained) {
      if (canonicalize(retained.intent) !== canonicalize(intent) ||
          (source && retained.digest !== digest)) throw error('IdempotencyConflict')
      return clone(retained.acknowledgement)
    }
    if (request.operation !== 'forget' && (!source || source.ref !== request.input.source_ref))
      throw error('NotFoundOrNotVisible')
    const receipt = { receipt_ref: 'fixture-receipt-' + this.state.next++, operation: request.operation,
      space_id: context.space_id, accepted_seq: context.accepted_seq }
    const progress = { receipt_ref: receipt.receipt_ref, phase: 'recorded' }
    const acknowledgement = { receipt, progress }
    this.state.records.push({ receipt, progress, owner: context.principal, scope,
      source_order: clone(context.source_order ?? null) })
    this.state.keys.push({ key, digest, intent: clone(intent), acknowledgement: clone(acknowledgement) })
    return clone(acknowledgement)
  }
  read(context, ref) {
    const record = this.state.records.find(entry => entry.receipt.receipt_ref === ref)
    if (!record || record.owner !== context.principal || record.receipt.space_id !== context.space_id)
      throw error('NotFoundOrNotVisible')
    return clone(record)
  }
  advance(context, next) {
    const record = this.read(context, next.receipt_ref)
    if (next.phase !== 'failed') {
      for (const predecessor of record.source_order?.predecessor_receipts ?? []) {
        if (this.read(context, predecessor).progress.phase !== 'available') throw error('PreconditionFailed')
      }
    }
    const progress = advanceProgress(record.receipt, record.progress, next)
    this.state.records.find(entry => entry.receipt.receipt_ref === next.receipt_ref).progress = progress
    return clone(progress)
  }
}

export function processingBarrier(ledger, context, after, snapshotSeq, { fixed = false } = {}) {
  if (!sequence(snapshotSeq)) throw error('InvalidRequestEnvelope')
  const progress = [...new Set(after)].map(ref => ledger.read(context, ref).progress)
  if (fixed && progress.some(item => item.phase === 'available' && item.available_seq > snapshotSeq))
    throw error('PreconditionFailed')
  const unresolved = progress.filter(item => item.phase !== 'available' || item.available_seq > snapshotSeq)
  return { satisfied: unresolved.length === 0, progress, unresolved: unresolved.map(item => item.receipt_ref) }
}

export function recallEligibility({ channelStates, notApplicable = [], barrier, unverified = [] }) {
  const irrelevant = new Set(notApplicable)
  const complete = barrier.satisfied && channels.every(name => channelStates[name] === 'complete' ||
    (channelStates[name] === 'not_applicable' && irrelevant.has(name)))
  return { complete, action_eligible: complete && unverified.length === 0 }
}

/** revise.change_kind routing (Memory Interface §4, Spec §14.2, §25.4, §57.8).
 * Each kind is its own history; misrecorded never falls back to a correction. */
export function routeRevision(changeKind, capabilities = [], grants = []) {
  switch (changeKind) {
    case 'correction': return { history: 'supersession', actor_withdrawal: false }
    case 'world_change': return { history: 'succession', assertions: 1, actor_withdrawal: false }
    case 'misrecorded':
      if (capabilities.includes('recording_repair')) return { history: 'recording_repair', actor_withdrawal: false }
      if (grants.includes('quarantine')) return { history: 'quarantine', status: 'partial', actor_withdrawal: false }
      throw error('UnsupportedCapability')
    case 'unspecified':
    case undefined: return { history: 'disclosed_choice', supersede_on_guess: false }
    default: throw error('InvalidRequestEnvelope')
  }
}

/** Attention recall (Memory Interface §4): read-only, cursor-ordered, monotone.
 * The cursor is the highest raised_seq delivered; the host keeps it. */
export function attentionAfter(items, cursor = null) {
  const after = cursor === null ? -1 : Number(String(cursor).replace(/^attention:/, ''))
  if (!Number.isSafeInteger(after) && after !== -1) throw error('CursorInvalid')
  const fresh = items.filter(item => item.raised_seq > after)
    .sort((a, b) => a.raised_seq - b.raised_seq || (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0))
  const last = fresh.length ? fresh[fresh.length - 1].raised_seq : after
  return { attention: clone(fresh), attention_cursor: last < 0 ? null : 'attention:' + last }
}
