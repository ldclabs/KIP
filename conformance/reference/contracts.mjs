/** Small, test-only contract oracles. These functions are not a Nexus engine. */
import { canonicalize, parseTimestamp } from '../../packages/kip-lang/dist/index.js'
import { validateDependencies } from './reliability.mjs'

export function dependencyValidity(groups, current) {
  return validateDependencies({ groups }, { elements: current })
}

export function project(candidates, { functional = false, context_refs = [], valid_at }) {
  const instant = parseTimestamp
  const time = instant(valid_at)
  const rows = candidates.map(candidate => {
    for (const a of candidate.assertions) {
      const from=a.from ? instant(a.from) : -Infinity, until=a.until ? instant(a.until) : Infinity
      if (from >= until) throw new Error('empty or reversed valid interval')
    }
    const assertions = candidate.assertions.filter(a =>
      a.status === 'active' && a.visible !== false &&
      !['hypothetical', 'predicted', 'imported'].includes(a.mode) &&
      (a.context_refs ?? []).every(ref => context_refs.includes(ref)) &&
      (!a.from || Date.parse(a.from) <= time) && (!a.until || time < Date.parse(a.until)))
    const roots = stance => new Set(assertions.filter(a => a.stance === stance && a.trusted).map(a => a.root))
    const support = roots('support').size, opposition = roots('reject').size
    const candidate_status = support && opposition ? 'contested' : support ? 'accepted' :
      opposition ? 'rejected' : assertions.length ? 'uncertain' : 'insufficient'
    const invalid = candidate.dependency_validity && candidate.dependency_validity !== 'current'
    return { id: candidate.id, value: candidate.value, support, opposition, candidate_status,
      status: invalid && candidate_status === 'accepted' ? 'uncertain' : candidate_status,
      conflict_refs: [] }
  })
  const supported = rows.filter(row => row.support > 0 && row.status !== 'uncertain')
  if (functional && new Set(supported.map(r => canonicalize(r.value))).size > 1) {
    for (const row of supported) {
      row.status = 'contested'
      row.conflict_refs = supported.filter(other => canonicalize(other.value) !== canonicalize(row.value)).map(r => r.id)
    }
  }
  const slot_status = rows.some(r => r.status === 'contested') ? 'contested' :
    rows.some(r => r.status === 'accepted') ? 'accepted' :
    rows.some(r => r.status === 'uncertain') ? 'uncertain' : 'insufficient'
  return { status: slot_status, accepted_values: rows.filter(r => r.status === 'accepted').map(r => r.value),
    candidates: rows.map(row => ({ ...row, slot_status })) }
}

export function sameBasis(a, b) {
  const inputs = basis => { const { next_invalid_at, ...rest } = basis; return rest }
  return canonicalize(inputs(a)) === canonicalize(inputs(b))
}

/** Trial assignment, metric and window are fixed before these observations arrive. */
export function aggregateAttempts(trial, attempts, outcomes) {
  const eligible = attempts.filter(a => a.trial === trial.id && a.revision === trial.revision)
  return eligible.map(attempt => {
    const observations = outcomes.filter(o => o.attempt === attempt.id && o.metric === trial.metric &&
      o.window === trial.window && o.terminal && !o.imported && o.instrument && !o.corrected)
    const statuses = new Set(observations.map(o => o.status))
    return { attempt: attempt.id, status: statuses.size === 1 ? [...statuses][0] : 'unknown' }
  })
}

/** Fixed-weight comparison oracle, not a recommended production statistical policy. */
export function stratifiedComparison({ baseline, treatment, weights, comparable, uncertainty_passed }) {
  if (!comparable || !uncertainty_passed || Math.abs(Object.values(weights).reduce((a,b) => a+b,0)-1)>1e-9) return 'insufficient'
  let effect = 0
  for (const [stratum, weight] of Object.entries(weights)) {
    const b = baseline[stratum], t = treatment[stratum]
    if (!b || !t || b.total <= 0 || t.total <= 0 || weight < 0) return 'insufficient'
    effect += weight * (t.success / t.total - b.success / b.total)
  }
  return effect > 1e-12 ? 'improved' : 'not_improved'
}

export function freezeRecord(value) {
  const copy = structuredClone(value)
  function freeze(x) { if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x) } }
  freeze(copy); return copy
}

export function selectRevision(skill, revision) {
  if (revision === skill.current_revision) return skill
  return { ...skill, current_revision: revision, status: 'proposed', grading: null, trial: null }
}

export function validatePromotion(skill, evaluation, policy) {
  if (!policy || !policy.allowed_rules.includes(evaluation.rule_digest)) return false
  if (skill.status !== 'trialed' || evaluation.to !== 'adopted' ||
      evaluation.revision !== skill.current_revision || evaluation.trial !== skill.trial ||
      !evaluation.replay_available || evaluation.from !== skill.status ||
      evaluation.comparison !== 'improved' || new Set(evaluation.attempts).size < 2) return false
  return evaluation.attempts.length === new Set(evaluation.attempts).size
}

/** Recall standing after relevance, dependency and Governance checks.
 * evaluations contains only records already validated by the runtime, including
 * the prior adoption basis for same-state monitoring; this is not a policy validator. */
export function skillRecallState(skill, evaluations) {
  const evaluation = evaluations[skill.grading?.evaluation_ref]
  const matches = skill.grading?.revision_ref === skill.current_revision &&
    evaluation?.revision_refs.includes(skill.current_revision) && evaluation.to_status === skill.status
  const grading = matches ? skill.grading : null
  if (skill.status === 'revoked') return { candidate_eligible: false, standing: 'warning', grading }
  if (skill.status === 'adopted')
    return { candidate_eligible: !!matches, standing: matches ? 'validated' : 'unverifiable', grading }
  return { candidate_eligible: true, standing: 'unproven', grading }
}

export function silenceEligible(watch, worker) {
  return watch.generation === worker.generation && watch.authorization_view === worker.authorization_view &&
    watch.condition_digest === worker.condition_digest && worker.complete && worker.clock_passed &&
    worker.consumed_seq >= worker.due_seq && worker.armed_seq === watch.armed_seq && !worker.matched
}
export function acquireLease(lease, owner, now, duration) {
  if (lease && lease.expires_at > now) throw new Error('lease held')
  return { owner, fencing_token: (lease?.fencing_token ?? 0) + 1, expires_at: now + duration }
}
export function fenceValid(lease, claim, now) {
  return lease.owner === claim.owner && lease.fencing_token === claim.fencing_token && lease.expires_at > now
}
export function recoverAction(attempt, external) {
  if (external.has(attempt)) return { status: 'observed', result: external.get(attempt), dispatch: false }
  return { status: 'outcome_unknown', dispatch: false }
}
export function erasureStatus(plan) {
  if (plan.targets.some(t => t.state === 'held')) return 'blocked'
  return plan.targets.every(t => t.state === 'erased') ? 'completed' : 'partial'
}
export function repairIdentity(decisions, writes, id) {
  const affected = decisions.find(d => d.id === id)
  if (!affected) throw new Error('unknown resolution')
  return { decisions: decisions.map(d => d.id === id ? { ...d, withdrawn: true } : { ...d }),
    review: writes.filter(w => w.decision === id).map(w => ({ ...w, needs_review: true })),
    raw_writes: structuredClone(writes) }
}
