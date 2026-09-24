/** Small, test-only contract oracles. These functions are not a Nexus engine. */
import { canonicalize, parseTimestamp } from '../../packages/kip-lang/dist/index.js'
import { validateDependencies } from './reliability.mjs'

export function dependencyValidity(groups, current) {
  return validateDependencies({ groups }, { elements: current })
}

/* ------------------------------------------------------------------------ *
 * Projection oracle (Spec §21.10–§21.13, §25.2–§25.5).
 *
 * A time point is an exact Timestamp, a time bound {earliest?, latest?}, or
 * null. Internally every endpoint becomes a closed range [lo, hi] of possible
 * instants: an exact instant is [x, x]; a missing side of a bound is infinite.
 * ------------------------------------------------------------------------ */
const INF = Infinity

function point(value, side, assertedAt) {
  if (value === undefined || value === null) {
    if (side !== 'from') return [INF, INF]
    // A missing from means "no later than the claim": the bound {latest: asserted_at} (§25.2).
    if (assertedAt === undefined || assertedAt === null) throw new Error('asserted_at is required when from is absent')
    return [-INF, parseTimestamp(assertedAt)]
  }
  if (typeof value === 'string') { const x = parseTimestamp(value); return [x, x] }
  if (typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(k => k !== 'earliest' && k !== 'latest') ||
      (value.earliest === undefined && value.latest === undefined)) throw new Error('invalid time bound')
  const lo = value.earliest === undefined ? -INF : parseTimestamp(value.earliest)
  const hi = value.latest === undefined ? INF : parseTimestamp(value.latest)
  if (lo > hi) throw new Error('invalid time bound: earliest after latest')
  return [lo, hi]
}
const exact = value => typeof value === 'string'
const strictSuperset = (a = [], b = []) => { const A = new Set(a), B = new Set(b); return A.size > B.size && [...B].every(v => A.has(v)) }

/** Start key (§25.4): exact from, else the bound's latest, else asserted_at. Every Assertion has one. */
function startKey(a) {
  if (exact(a.from)) return parseTimestamp(a.from)
  if (a.from && typeof a.from === 'object' && a.from.latest !== undefined) return parseTimestamp(a.from.latest)
  return a.asserted_at ? parseTimestamp(a.asserted_at) : -INF
}

/** Who takes part in succession (§25.4): the actor's own account — stated or
 *  observed — or any Assertion that writes its start. An inference with no
 *  written from is on no line. */
const takesPart = a => ['stated', 'observed'].includes(a.mode) || (a.from !== undefined && a.from !== null)

/** Effective [start, end] ranges after temporal succession (§25.4). */
export function effectiveIntervals(rows, { functional = false, functional_by = false } = {}) {
  for (const r of rows) {
    r.start = point(r.a.from, 'from', r.a.asserted_at); r.end = point(r.a.until, 'until')
    const lowestStart = r.start[0], highestEnd = r.end[1]
    if (lowestStart >= highestEnd) throw new Error('empty or reversed valid interval')
    r.sk = startKey(r.a)
  }
  const lines = new Map()
  const add = (key, row) => { if (!lines.has(key)) lines.set(key, []); lines.get(key).push(row) }
  for (const r of rows) {
    if (!r.a.actor || !takesPart(r.a)) continue
    const ctx = [...new Set(r.a.context_refs ?? [])].sort().join('\u0000')
    add(`prop|${r.a.actor}|${ctx}|${r.candidate}`, r)
    if (r.a.stance === 'support' && (functional || functional_by))
      add(`slot|${r.a.actor}|${ctx}|${functional_by ? r.partition : ''}`, r)
  }
  const starts = new Map(rows.map(r => [r, [...r.start]]))
  const ends = new Map(rows.map(r => [r, [...r.end]]))
  const lineStart = new Map()
  for (const [key, line] of lines) {
    const slot = key.startsWith('slot|')
    const disagree = (x, y) => slot ? x.candidate !== y.candidate : x.a.stance !== y.a.stance
    for (const r of line) {
      const preds = line.filter(q => disagree(q, r) && q.sk < r.sk)
      let s = r.start
      if (!exact(r.a.from) && preds.length) {
        const q = preds.reduce((m, x) => x.sk > m.sk ? x : m)
        s = [Math.max(r.start[0], q.sk), r.sk]
      }
      lineStart.set(key + '#' + rows.indexOf(r), s)
      const cur = starts.get(r); starts.set(r, [Math.max(cur[0], s[0]), Math.max(cur[1], s[1])])
    }
    for (const r of line) {
      if (r.a.until !== undefined && r.a.until !== null) continue
      const succ = line.filter(n => disagree(n, r) && n.sk > r.sk)
      if (!succ.length) continue
      // The nearest successors; a start-key tie combines their starts bound by bound.
      const nearest = Math.min(...succ.map(n => n.sk))
      for (const n of succ.filter(n => n.sk === nearest)) {
        const e = lineStart.get(key + '#' + rows.indexOf(n))
        const cur = ends.get(r); ends.set(r, [Math.min(cur[0], e[0]), Math.min(cur[1], e[1])])
      }
    }
  }
  for (const r of rows) { r.start = starts.get(r); r.end = ends.get(r) }
  return rows
}

/** inside | outside | indeterminate at instant t (§25.5). */
export function classify(start, end, t) {
  const [slo, shi] = start, [elo, ehi] = end
  if (slo > t || ehi <= t) return 'outside'
  if (shi <= t && elo > t) return 'inside'
  return 'indeterminate'
}

export function project(candidates, { functional = false, functional_by = false, context_refs = [], valid_at,
  policy = 'structural', subject } = {}) {
  const time = parseTimestamp(valid_at)
  const rows = []
  for (const candidate of candidates) {
    for (const a of candidate.assertions) {
      // Written intervals are validated whether or not the Assertion is eligible.
      const [slo] = point(a.from, 'from', a.asserted_at), [, ehi] = point(a.until, 'until')
      if (slo >= ehi) throw new Error('empty or reversed valid interval')
      const eligible = a.status === 'active' && a.visible !== false &&
        !['hypothetical', 'predicted', 'imported'].includes(a.mode) &&
        (a.context_refs ?? []).every(ref => context_refs.includes(ref))
      if (eligible) rows.push({ a, candidate: candidate.id, partition: candidate.partition ?? '' })
    }
  }
  effectiveIntervals(rows, { functional, functional_by })
  for (const r of rows) r.at = classify(r.start, r.end, time)

  const out = candidates.map(candidate => {
    const mine = rows.filter(r => r.candidate === candidate.id && r.at !== 'outside')
    const inside = mine.filter(r => r.at === 'inside')
    const roots = stance => new Set(inside.filter(r => r.a.stance === stance && r.a.trusted).map(r => r.a.root))
    const support = roots('support').size, opposition = roots('reject').size
    const reasons = mine.some(r => r.at === 'indeterminate') ? ['temporal_indeterminate'] : []
    const candidate_status = support && opposition ? 'contested' : support ? 'accepted' :
      opposition ? 'rejected' : mine.length ? 'uncertain' : 'insufficient'
    const invalid = candidate.dependency_validity && candidate.dependency_validity !== 'current'
    return { id: candidate.id, value: candidate.value, partition: candidate.partition ?? '', support, opposition,
      candidate_status, status: invalid && candidate_status === 'accepted' ? 'uncertain' : candidate_status,
      conflict_refs: [], reasons, precedence: null,
      support_rows: inside.filter(r => r.a.stance === 'support') }
  })

  if (functional || functional_by) {
    for (const partition of new Set(out.map(r => r.partition))) {
      const supported = out.filter(r => (functional || r.partition === partition) &&
        r.support > 0 && r.status !== 'uncertain')
      if (new Set(supported.map(r => canonicalize(r.value))).size <= 1) continue
      const winner = policy === 'memory-default' ? precedenceWinner(supported, subject) : null
      for (const row of supported) {
        if (winner && row === winner.row) { row.precedence = { rule: winner.rule, prevailed_over: supported.filter(x => x !== row).map(x => x.id) }; continue }
        if (winner) { row.status = 'uncertain'; row.reasons = [...row.reasons, 'outranked']; row.precedence = { rule: winner.rule, outranked_by: winner.row.id }; continue }
        row.status = 'contested'
        row.conflict_refs = supported.filter(o => canonicalize(o.value) !== canonicalize(row.value)).map(r => r.id)
      }
      if (functional) break
    }
  }
  const statusOf = list => list.some(r => r.status === 'contested') ? 'contested' :
    list.some(r => r.status === 'accepted') ? 'accepted' :
    list.some(r => r.status === 'uncertain') ? 'uncertain' : 'insufficient'
  const partitionStatus = new Map([...new Set(out.map(r => r.partition))]
    .map(partition => [partition, statusOf(out.filter(r => r.partition === partition))]))
  const status = statusOf(out)
  // The top-level status summarizes this oracle call; each candidate names its
  // own slot, which is a subject–predicate–partition triple for functional_by.
  return { status, accepted_values: out.filter(r => r.status === 'accepted').map(r => r.value),
    candidates: out.map(({ support_rows, ...row }) => ({ ...row,
      slot_status: functional_by ? partitionStatus.get(row.partition) : status })) }
}

/** kip:memory-default precedence (§21.13): the first rule under which one
 *  candidate prevails over every other candidate of the conflict set decides. */
function precedenceWinner(set, subject) {
  const newest = row => Math.max(...row.support_rows.map(x => x.sk))
  const rules = [
    ['context_specificity', (a, b) => a.support_rows.some(x => b.support_rows.every(y =>
      strictSuperset(x.a.context_refs, y.a.context_refs)))],
    ['first_person_testimony', (a, b) => subject !== undefined &&
      a.support_rows.some(x => x.a.actor === subject && ['stated', 'observed'].includes(x.a.mode)) &&
      !b.support_rows.some(y => y.a.actor === subject || y.a.mode === 'observed')],
    // Recency compares start keys — when values were claimed to hold, never when they were recorded.
    ['recency', (a, b) => newest(a) > newest(b)],
  ]
  for (const [rule, prevails] of rules) {
    const winners = set.filter(a => set.every(b => b === a || prevails(a, b)))
    if (winners.length === 1) return { rule, row: winners[0] }
  }
  return null
}

/** Computed strength (Spec §59.1, Profile §6.1). `policies` maps artifact_ref to
 *  the policy artifacts the runtime knows; `at` is the instant the read is
 *  evaluated. Anything missing or unverifiable is null — unknown, never a default. */
export function effectiveStrength(state, policies, at) {
  const base = state?.memory_strength, anchor = state?.last_metabolized_at, pin = state?.strength_policy
  if (typeof base !== 'number' || typeof anchor !== 'string' || !pin) return null
  const policy = policies[pin.artifact_ref]
  if (!policy || policy.integrity?.content_digest !== pin.content_digest) return null
  if (policy.method?.kind !== 'half_life') return null
  const elapsed = Math.max(0, parseTimestamp(at) - parseTimestamp(anchor))
  return base * 2 ** (-elapsed / policy.method.half_life_ms)
}

/** Supersession compatibility (Spec §14.2): same actor, same Proposition or the
 *  same subject and Predicate lineage, and the same canonical context set. */
export function supersessionCompatible(old, replacement) {
  const contexts = a => [...new Set(a.context_refs ?? [])].sort().join('\u0000')
  return old.actor === replacement.actor && contexts(old) === contexts(replacement) &&
    (old.proposition === replacement.proposition ||
      (old.subject === replacement.subject && old.predicate_lineage === replacement.predicate_lineage))
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
