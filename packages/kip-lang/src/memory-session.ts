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
}
export class MemorySession {
  private readonly state: MemorySessionSnapshot
  constructor(snapshot: MemorySessionSnapshot) {
    if (!snapshot.space_id || snapshot.outstanding.some(ref => !ref) || snapshot.outstanding.length > 128) {
      throw new RangeError('invalid memory session snapshot')
    }
    this.state = {
      space_id: snapshot.space_id,
      scope: { ...snapshot.scope, context_refs: [...new Set(snapshot.scope.context_refs ?? [])].sort() },
      outstanding: [...new Set(snapshot.outstanding)]
    }
  }
  recordReceipt(spaceId: string, receiptRef: string): void {
    if (spaceId !== this.state.space_id || !receiptRef) throw new RangeError('receipt scope mismatch')
    if (this.state.outstanding.includes(receiptRef)) return
    if (this.state.outstanding.length >= 128) throw new RangeError('processing barrier limit exceeded; retain receipt externally')
    this.state.outstanding.push(receiptRef)
  }
  recall(input: { query?: string; target_ref?: string; mode?: 'answer' | 'action' | 'resume'; after?: string[] }) {
    const after = [...new Set([...this.state.outstanding, ...(input.after ?? [])])]
    if (after.length > 128) throw new RangeError('processing barrier limit exceeded')
    return {
      kip_memory: '2.0' as const, operation: 'recall' as const,
      requires_contract: '2026-09-23',
      space: { id: this.state.space_id }, scope: this.snapshot().scope,
      input: { ...input, after }
    }
  }
  /** Call only after a trusted successful recall accounts for these receipts.
   * A maximum sequence, index watermark or intake ACK is not sufficient. */
  acknowledgeRecall(accountedReceiptRefs: string[]): void {
    const accounted = new Set(accountedReceiptRefs)
    this.state.outstanding = this.state.outstanding.filter(ref => !accounted.has(ref))
  }
  snapshot(): MemorySessionSnapshot {
    return { ...this.state, scope: { ...this.state.scope, context_refs: [...(this.state.scope.context_refs ?? [])] },
      outstanding: [...this.state.outstanding] }
  }
}
