/** Executable contract model. No database, model, authority provider or external
 * executor is implemented here; trusted inputs stand for host-validated records. */
import { canonicalize, parseTimestamp } from '../../packages/kip-lang/dist/index.js'

const fail = code => { throw Object.assign(new Error(code), { code }) }
const equal = (a, b) => canonicalize(a) === canonicalize(b)
const result = status => ({ status, action_eligible: status === 'current' })

export function validateDependencies(basis, state) {
  const groups = basis.groups ?? [], queries = basis.queries ?? []
  if (!groups.some(g => g.role !== 'context') && !queries.length) return result('unverifiable')
  let changed = false
  for (const group of groups) {
    if (group.role === 'context') continue
    if (!group.pins?.length) return result('unverifiable')
    const checks = group.pins.map(pin => {
      const now = state.elements[pin.id]
      if (!now || now.visible === false || now.dependency_validity === 'unverifiable') return 'unknown'
      if (['retracted', 'superseded', 'corrected', 'tombstoned'].includes(now.status) ||
          now.quarantined || now.recording_invalidated || now.dependency_validity === 'needs_review') return 'changed'
      const planes = Object.entries(pin.planes ?? {})
      return (planes.length ? planes.every(([key, value]) => now.planes?.[key] === value) :
        now.version === pin.version) ? 'valid' : 'changed'
    })
    if (group.role === 'any_of' && checks.includes('valid')) continue
    if (checks.includes('unknown')) return result('unverifiable')
    if (checks.includes('changed')) changed = true
  }
  for (const pin of queries) {
    const now = state.queries?.[pin.selector.content_digest]
    if (!now || !now.complete || now.authorization_view !== pin.authorization_view ||
        !equal(now.selector, pin.selector)) return result('unverifiable')
    // A changed selection token requires an actual complete re-evaluation. Equal
    // old rows alone cannot attest that a new competitor or phantom was checked.
    if (now.change_token !== pin.change_token && now.checked_seq !== state.snapshot_seq)
      return result('unverifiable')
    if (now.result_digest !== pin.result_digest ||
        (pin.expectation === 'accepted' && now.status !== 'accepted') ||
        (pin.expectation === 'empty' && now.count !== 0)) changed = true
  }
  if (basis.policy_basis && !state.basis) return result('unverifiable')
  if (basis.policy_basis && state.basis) {
    for (const key of ['space_id','schema_environment_version','identity_version','policy',
      'trust_version','authorization_view','context_refs','purpose','risk']) {
      if (!Object.hasOwn(state.basis,key)) return result('unverifiable')
      if (!equal(basis.policy_basis[key], state.basis[key])) changed = true
    }
    const boundary = basis.policy_basis.next_invalid_at
    if (boundary && parseTimestamp(state.basis.valid_at) >= parseTimestamp(boundary)) changed = true
  }
  return result(changed ? 'needs_review' : 'current')
}

/** Arrival order is transport order; predecessor edges express semantic order.
 * This journal snapshots all states and blocks dependents on a failed predecessor. */
export class FormationQueue {
  constructor(records = []) { this.records = structuredClone(records) }
  enqueue(event) {
    if (!event.id || !event.stream || !Number.isSafeInteger(event.ordinal) || event.ordinal < 0)
      fail('ConstraintViolation')
    const existing = this.records.find(row => row.id === event.id)
    if (existing) {
      if (!equal(existing.event, event)) fail('IdempotencyConflict')
      return
    }
    if (this.records.some(row => row.event.stream === event.stream && row.event.ordinal === event.ordinal))
      fail('SourceOrderConflict')
    if ((event.predecessors ?? []).some(id => id === event.id)) fail('SourceOrderConflict')
    this.records.push({ id: event.id, event: structuredClone(event), state: 'recorded' })
    const visiting = new Set(), visited = new Set()
    const walk = id => {
      if (visiting.has(id)) fail('SourceOrderConflict')
      if (visited.has(id)) return
      visiting.add(id)
      for (const parent of this.records.find(row => row.id === id)?.event.predecessors ?? []) walk(parent)
      visiting.delete(id); visited.add(id)
    }
    try {
      for (const row of this.records) for (const id of row.event.predecessors ?? []) {
        const parent = this.records.find(other => other.id === id)
        if (parent?.event.stream === row.event.stream && parent.event.ordinal >= row.event.ordinal)
          fail('SourceOrderConflict')
      }
      walk(event.id)
    } catch (error) { this.records.pop(); throw error }
  }
  ready(id) {
    const row = this.records.find(row => row.id === id)
    return !!row && row.state === 'recorded' && (row.event.predecessors ?? []).every(parent =>
      this.records.some(other => other.id === parent && other.state === 'available'))
  }
  complete(id, state = 'available') {
    if (!['available','failed'].includes(state) || !this.ready(id)) fail('PreconditionFailed')
    this.records.find(row => row.id === id).state = state
  }
  snapshot() { return structuredClone(this.records) }
}

/** Host-issued source and authentication records, never request-body authority. */
export function validateRecordingRepair(request, host, originals, replacements) {
  if (!host.permissions.includes('repair_recording')) fail('NotAuthorized')
  if (host.source.id !== request.source_ref || host.source.digest !== request.source_digest ||
      !host.source.locators.includes(request.source_locator)) fail('SourceMismatch')
  if (!request.invalidated_refs.length || new Set(request.invalidated_refs).size !== request.invalidated_refs.length)
    fail('ConstraintViolation')
  for (const id of request.invalidated_refs) {
    const record = originals[id]
    if (!record || record.origin !== host.principal || record.source_ref !== request.source_ref ||
        record.version !== request.expected_versions[id]) fail('PreconditionFailed')
  }
  for (const id of request.replacement_refs) {
    const record = replacements[id]
    if (!record || record.source_ref !== request.source_ref || !host.allowed_actors.includes(record.actor))
      fail('NotAuthorized')
  }
  return { invalidated_refs: [...request.invalidated_refs], replacement_refs: [...request.replacement_refs],
    source_changed: false, actor_withdrawal: false }
}

export function freezeProspectiveCohort(trial, assignments, observations, cutoff, enrollmentLog) {
  if (trial.baseline_mode !== 'prospective' || !trial.enrollment ||
      trial.baseline_attempt_refs.length || trial.baseline_outcome_refs.length) fail('ConstraintViolation')
  const end = parseTimestamp(cutoff), seen = new Set(), units = new Set()
  if (!enrollmentLog?.complete || enrollmentLog.cutoff !== cutoff ||
      !equal(enrollmentLog.enrollment, trial.enrollment) ||
      !equal([...enrollmentLog.attempt_refs].sort(), assignments.map(a => a.id).sort()))
    fail('IncompleteEnrollment')
  const attempts = assignments.map(a => {
    if (a.trial_ref !== trial.id || !equal(a.assignment.enrollment, trial.enrollment) ||
        !a.host_verified || !['control','treatment'].includes(a.assignment.arm) ||
        parseTimestamp(a.assignment.assigned_at) > parseTimestamp(a.started_at) ||
        parseTimestamp(a.started_at) > end || seen.has(a.id)) fail('InvalidEnrollment')
    const unit = a.assignment.arm + ':' + a.assignment.unit_id
    if (units.has(unit)) fail('InvalidEnrollment')
    seen.add(a.id); units.add(unit)
    const rows = observations.filter(o => o.attempt_ref === a.id && parseTimestamp(o.observed_at) <= end)
    if (rows.some(o => parseTimestamp(o.observed_at) < parseTimestamp(a.assignment.assigned_at))) fail('InvalidEnrollment')
    const eligible = rows.filter(o => o.terminal && o.instrument_verified && !o.corrected && !o.imported)
    const distinct = new Map()
    for (const o of eligible) {
      if (distinct.has(o.observation_key) && !equal(distinct.get(o.observation_key), o)) fail('ObservationConflict')
      distinct.set(o.observation_key, o)
    }
    const statuses = new Set([...distinct.values()].map(o => o.status))
    return { attempt_ref: a.id, arm: a.assignment.arm, unit_id: a.assignment.unit_id,
      status: statuses.size === 1 ? [...statuses][0] : 'unknown' }
  })
  if (observations.some(o => !seen.has(o.attempt_ref))) fail('InvalidEnrollment')
  return attempts.sort((a,b) => a.attempt_ref.localeCompare(b.attempt_ref))
}

/** Simulates the receiver's atomic accept+dedupe step, not a sender preflight. */
export class FencedReceiver {
  constructor() { this.fences = new Map(); this.effects = new Map() }
  advance(resource, fence) {
    if (!Number.isSafeInteger(fence) || fence < (this.fences.get(resource) ?? 0)) fail('StaleFence')
    this.fences.set(resource, fence)
  }
  accept(request, permit, now) {
    if (permit.resource !== request.resource || permit.attempt_id !== request.attempt_id ||
        permit.fence !== this.fences.get(request.resource) || parseTimestamp(now) >= parseTimestamp(permit.expires_at))
      fail('StaleFence')
    const key = canonicalize([request.resource,request.attempt_id])
    const previous = this.effects.get(key)
    if (previous && !equal(previous, request)) fail('IdempotencyConflict')
    if (!previous) this.effects.set(key, structuredClone(request))
    return previous ? 'replayed' : 'applied'
  }
}

export function effectiveStrength({ base_strength, anchored_at, half_life_ms }, at) {
  if (!Number.isFinite(base_strength) || base_strength < 0 || base_strength > 1 ||
      !Number.isFinite(half_life_ms) || half_life_ms <= 0) fail('ConstraintViolation')
  const elapsed = parseTimestamp(at) - parseTimestamp(anchored_at)
  if (elapsed < 0) fail('PreconditionFailed')
  const strength = base_strength * 2 ** (-elapsed / half_life_ms)
  if (base_strength !== 0 && strength === 0) fail('ConstraintViolation')
  return strength
}

export function scopedWorkingKey(actor, scope) {
  return canonicalize([actor, scope.task_ref ?? null, [...new Set(scope.context_refs)].sort()])
}

/** User-visible completeness depends on the authorized traversal only. */
export function visibleDependents(rows, limit) {
  const visible = rows.filter(row => row.visible).map(({visible, ...row}) => row)
  return { rows: visible.slice(0, limit), truncated: visible.length > limit, coverage: 'authorized_view' }
}

export function coverageEligible(required, plans, basis) {
  return required.every(name => {
    const p = plans[name]
    return p && p.complete && !p.truncation_reason && p.snapshot_seq === basis.snapshot_seq &&
      p.covered_through_seq === basis.snapshot_seq && p.authorization_view === basis.authorization_view &&
      (!['constraints','commitments','dependencies'].includes(name) || p.method === 'exact')
  })
}

export function assessmentStanding(assessment) {
  if (assessment.purpose !== 'applicability' || assessment.grants_standing !== false) fail('ConstraintViolation')
  return { standing: 'unproven', applicable: assessment.result === 'satisfied', execution_authority: false }
}

/** Map only explicit reference locations in a destination view. The signed source
 * stays unchanged; this function cannot validate source trust or destination use. */
export function importReferenceView(source, mapping, paths) {
  const destination = structuredClone(source)
  for (const path of paths) {
    if (!path.startsWith('/')) fail('InvalidReferencePath')
    const keys = path.slice(1).split('/').map(k => k.replace(/~1/g,'/').replace(/~0/g,'~'))
    const leaf = keys.pop()
    let owner = destination
    for (const key of keys) {
      if (!owner || typeof owner !== 'object' || !Object.hasOwn(owner,key)) fail('UnmappedReference')
      owner = owner[key]
    }
    if (!owner || !Object.hasOwn(owner,leaf) || !Object.hasOwn(mapping,owner[leaf])) fail('UnmappedReference')
    owner[leaf] = mapping[owner[leaf]]
  }
  return { source: structuredClone(source), destination, standing: 'unproven', authority_transferred: false }
}

export function rebuildGrade(skill, evaluation) {
  if (!evaluation?.validated || !evaluation.revision_refs.includes(skill.current_revision) ||
      evaluation.id !== skill.evaluation_ref) fail('UnverifiableEvaluation')
  return { revision_ref: skill.current_revision, evaluation_ref: evaluation.id,
    ...structuredClone(evaluation.independent_attempt_counts) }
}
