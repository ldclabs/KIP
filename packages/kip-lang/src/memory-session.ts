import { parseTimestamp } from './timestamp.js'

/** Host-side receipt bookkeeping. Persist snapshot() with the caller's session.
 * Handles and scope must come from the authenticated binding, not model text.
 * This helper grants no authority and never claims that processing is complete. */
export interface MemorySessionScope {
  task_ref?: string
  context_refs?: string[]
}
export interface MemorySessionSnapshot {
  space_id: string
  scope: MemorySessionScope
  outstanding: string[]
  /** The cursor of the last attention the host consumed; the host keeps it (Memory Interface §4). */
  attention_cursor?: string
}
/** The recall input of `schemas/kip-memory.schema.json`; `after` is merged with the outstanding receipts. */
export interface MemoryRecallInput {
  query?: string
  target_ref?: string
  mode?: 'answer' | 'action' | 'resume' | 'attention'
  goal?: string
  context?: string
  after?: string[]
  detail?: 'brief' | 'evidence'
  time?: { valid_at?: string; as_of_seq?: number }
  attention_cursor?: string
}
// JSON Schema string lengths count Unicode code points.
const isText = (value: unknown, limit: number): value is string =>
  typeof value === 'string' && value.length > 0 &&
  (value.length <= limit || (value.length <= limit * 2 && [...value].length <= limit))
const isRef = (value: unknown): value is string => isText(value, 1024)

export class MemorySession {
  private readonly state: MemorySessionSnapshot
  constructor(snapshot: MemorySessionSnapshot) {
    const refs = snapshot.scope.context_refs ?? []
    const contexts = Array.isArray(refs) ? [...new Set(refs)] : null
    if (!isText(snapshot.space_id, 512) ||
      (snapshot.scope.task_ref !== undefined && !isRef(snapshot.scope.task_ref)) ||
      !contexts || contexts.length > 128 || contexts.some(ref => !isRef(ref)) ||
      !Array.isArray(snapshot.outstanding) || snapshot.outstanding.length > 128 || snapshot.outstanding.some(ref => !isRef(ref)) ||
      (snapshot.attention_cursor !== undefined && !isRef(snapshot.attention_cursor))) {
      throw new RangeError('invalid memory session snapshot')
    }
    this.state = {
      space_id: snapshot.space_id,
      scope: { ...snapshot.scope, context_refs: contexts.sort() },
      outstanding: [...new Set(snapshot.outstanding)],
      ...(snapshot.attention_cursor !== undefined ? { attention_cursor: snapshot.attention_cursor } : {})
    }
  }
  recordReceipt(spaceId: string, receiptRef: string): void {
    if (spaceId !== this.state.space_id) throw new RangeError('receipt scope mismatch')
    if (!isRef(receiptRef)) throw new RangeError('invalid receipt reference')
    if (this.state.outstanding.includes(receiptRef)) return
    if (this.state.outstanding.length >= 128) throw new RangeError('processing barrier limit exceeded; retain receipt externally')
    this.state.outstanding.push(receiptRef)
  }
  /** Builds a scoped recall. `attention` and `resume` carry the kept attention cursor unless the
   * caller names one, so a restart neither replays consumed attention nor skips raised items. */
  recall(input: MemoryRecallInput) {
    if (!input.query && !input.target_ref && input.mode !== 'attention') {
      throw new RangeError('recall needs a query, a target_ref or mode "attention"')
    }
    for (const field of ['query', 'goal', 'context'] as const) {
      if (input[field] !== undefined && !isText(input[field], 4096)) throw new RangeError(`invalid recall ${field}`)
    }
    if (input.target_ref !== undefined && !isRef(input.target_ref)) throw new RangeError('invalid target reference')
    if (input.time !== undefined && input.time.valid_at === undefined && input.time.as_of_seq === undefined) {
      throw new RangeError('recall time needs valid_at or as_of_seq')
    }
    if (input.time?.valid_at !== undefined) parseTimestamp(input.time.valid_at)
    if (input.time?.as_of_seq !== undefined &&
      (!Number.isSafeInteger(input.time.as_of_seq) || input.time.as_of_seq < 0)) {
      throw new RangeError('as_of_seq must be a non-negative integer sequence')
    }
    if (input.attention_cursor !== undefined && !isRef(input.attention_cursor)) {
      throw new RangeError('invalid attention cursor')
    }
    if (input.after?.some(ref => !isRef(ref))) throw new RangeError('invalid receipt reference')
    const after = [...new Set([...this.state.outstanding, ...(input.after ?? [])])]
    if (after.length > 128) throw new RangeError('processing barrier limit exceeded')
    const cursor = input.attention_cursor ??
      (input.mode === 'attention' || input.mode === 'resume' ? this.state.attention_cursor : undefined)
    return {
      kip_memory: '2.0' as const, operation: 'recall' as const,
      space: { id: this.state.space_id }, scope: structuredClone(this.state.scope),
      input: { ...input, after, ...(cursor !== undefined ? { attention_cursor: cursor } : {}) }
    }
  }
  /** Call only after a trusted successful recall accounts for these receipts.
   * A maximum sequence, index watermark or intake ACK is not sufficient. */
  acknowledgeRecall(accountedReceiptRefs: string[]): void {
    const accounted = new Set(accountedReceiptRefs)
    this.state.outstanding = this.state.outstanding.filter(ref => !accounted.has(ref))
  }
  /** Keep the cursor a trusted successful `attention` or `resume` recall returned, once the host has
   * taken its items. Consuming attention changes nothing in memory; it only moves this cursor. */
  acknowledgeAttention(attentionCursor: string): void {
    if (!isRef(attentionCursor)) throw new RangeError('invalid attention cursor')
    this.state.attention_cursor = attentionCursor
  }
  snapshot(): MemorySessionSnapshot {
    return structuredClone(this.state)
  }
}
