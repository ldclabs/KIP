import assert from 'node:assert/strict'
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { canonicalize, parseCanonicalJson, parse, lowerAll } from '../dist/index.js'
import * as model from '../../../conformance/reference/contracts.mjs'
import { runMemoryVectors } from '../../../conformance/runner.mjs'
import { validationSchemaLock } from '../../../conformance/schema-lock.mjs'

const base = new URL('../../../', import.meta.url)
const json = async path => parseCanonicalJson(await readFile(new URL(path, base), 'utf8'))
const hash = data => 'sha256:' + createHash('sha256').update(canonicalize(data)).digest('hex')
const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
const schemaCatalog = new Map()
for (const file of await readdir(new URL('schemas/', base))) {
  if (!file.endsWith('.json')) continue
  const schema = await json('schemas/' + file)
  schemaCatalog.set(schema.$id, schema)
  ajv.addSchema(schema)
}
for (const file of ['conformance-test-vector.schema.json', 'conformance-report.schema.json'])
  ajv.addSchema(await json('conformance/' + file))
const cases = await json('conformance/vectors/cognitive-contracts.json')

for (const entry of cases.projection) test(entry.id + ': ' + entry.name, () => {
  const result = model.project(entry.candidates, entry.request)
  assert.equal(result.status, entry.expected.slot_status)
  assert.deepEqual(result.accepted_values, entry.expected.accepted_values)
  assert.deepEqual(result.candidates.map(c=>c.status), entry.expected.candidate_statuses)
})

test('MEM-007: unanchored times and empty/reversed intervals fail instead of becoming absence', () => {
  assert.throws(()=>model.project([],{valid_at:'2026-09-06'}),/timestamp/)
  for (const until of ['2026-09-06T12:00:00.000Z','2026-09-05T12:00:00.000Z']) {
    const candidate={id:'P',value:'value',assertions:[{from:'2026-09-06T12:00:00.000Z',until}]}
    assert.throws(()=>model.project([candidate],{valid_at:cases.basis.valid_at}),/interval/)
  }
})

test('MEM-002/005: revisions reset current standing; old immutable evaluations stay replayable', () => {
  const trial = model.freezeRecord({ id:'T1', revision:'R1', baseline:{success:0,total:2}, rule:{id:'rule1',threshold:0.1} })
  const evaluation = model.freezeRecord({ trial, attempts:['A1','A2'], status:'adopted' })
  const changed = model.selectRevision({current_revision:'R1',status:'adopted',grading:evaluation,trial:'T1'}, 'R2')
  assert.equal(changed.status,'proposed'); assert.equal(changed.grading,null)
  assert.throws(()=>{ evaluation.trial.baseline.total=99 },TypeError)
  assert.equal(evaluation.trial.revision,'R1')
  assert.equal(model.validatePromotion({current_revision:'R2',trial:'T2',status:'trialed'},
    {revision:'R1',trial:'T1',from:'trialed',to:'adopted',rule_digest:'allowed',comparison:'improved',attempts:['A1','A2'],replay_available:true},
    {allowed_rules:['allowed']}),false)
})

test('MEM-003: observation fan-out never satisfies an independent-attempt quota', () => {
  const trial={id:'T1',revision:'R1',metric:'health',window:'1h'}
  const attempts=[{id:'A1',trial:'T1',revision:'R1'}]
  const observation={attempt:'A1',metric:'health',window:'1h',terminal:true,instrument:true,status:'success'}
  const grades=model.aggregateAttempts(trial,attempts,[observation,{...observation}])
  assert.equal(grades.length,1)
  assert.equal(model.validatePromotion({current_revision:'R1',trial:'T1',status:'trialed'},
    {revision:'R1',trial:'T1',from:'trialed',to:'adopted',rule_digest:'allowed',comparison:'improved',attempts:grades.map(g=>g.attempt),replay_available:true},
    {allowed_rules:['allowed']}),false)
  assert.deepEqual(model.aggregateAttempts({...trial,id:'T2'},attempts,[observation]),[])
  assert.equal(model.aggregateAttempts(trial,attempts,[{...observation,corrected:true}])[0].status,'unknown')
  assert.equal(model.aggregateAttempts(trial,attempts,[observation,{...observation,status:'failure'}])[0].status,'unknown')
})

test('validated standing requires an authorized rule, not merely a caller-created digest', () => {
  const skill={current_revision:'R1',trial:'T1',status:'trialed'}
  const evaluation={revision:'R1',trial:'T1',from:'trialed',to:'adopted',rule_digest:'allowed',
    comparison:'improved',attempts:['A1','A2'],replay_available:true}
  assert.equal(model.validatePromotion(skill,evaluation,{allowed_rules:['allowed']}),true)
  assert.equal(model.validatePromotion(skill,{...evaluation,rule_digest:'constant-adopt'},{allowed_rules:['allowed']}),false)
})

test('MEM-018: promotion requires trialed standing, including after revocation', () => {
  const skill={current_revision:'R1',trial:'T1',status:'trialed'}
  const evaluation={revision:'R1',trial:'T1',from:'trialed',to:'adopted',rule_digest:'allowed',
    comparison:'improved',attempts:['A1','A2'],replay_available:true}
  const policy={allowed_rules:['allowed']}
  assert.equal(model.validatePromotion(skill,evaluation,policy),true)
  for (const status of ['proposed','revoked','adopted']) {
    assert.equal(model.validatePromotion({...skill,status},{...evaluation,from:status},policy),false,status)
  }
  // Re-entry selects a new trial before a new promotion; the old evaluation cannot be reused.
  const retrialed={...skill,trial:'T2'}
  assert.equal(model.validatePromotion(retrialed,evaluation,policy),false)
  assert.equal(model.validatePromotion(retrialed,{...evaluation,trial:'T2',attempts:['A3','A4']},policy),true)
})

test('MEM-023: recall includes ungraded candidates without borrowing standing or grades', () => {
  const grading={revision_ref:'R1',evaluation_ref:'EV1'}
  const evaluations={EV1:{revision_refs:['R1'],to_status:'adopted'}}
  for (const status of ['proposed','trialed']) {
    assert.deepEqual(model.skillRecallState({current_revision:'R1',status},evaluations),
      {candidate_eligible:true,standing:'unproven',grading:null})
    assert.deepEqual(model.skillRecallState({current_revision:'R2',status,grading},evaluations),
      {candidate_eligible:true,standing:'unproven',grading:null})
  }
  const adopted={current_revision:'R1',status:'adopted',grading}
  assert.deepEqual(model.skillRecallState(adopted,evaluations),
    {candidate_eligible:true,standing:'validated',grading})
  assert.deepEqual(model.skillRecallState({...adopted,status:'trialed'},
    {EV1:{revision_refs:['R1'],to_status:'trialed'}}),
    {candidate_eligible:true,standing:'unproven',grading})
  for (const [skill,records] of [[{...adopted,grading:null},evaluations],
    [{...adopted,current_revision:'R2'},evaluations],[adopted,{}],
    [adopted,{EV1:{revision_refs:['R1'],to_status:'trialed'}}],
    [adopted,{EV1:{revision_refs:['R2'],to_status:'adopted'}}]]) {
    assert.deepEqual(model.skillRecallState(skill,records),
      {candidate_eligible:false,standing:'unverifiable',grading:null})
  }
  assert.deepEqual(model.skillRecallState({...adopted,status:'revoked'},evaluations),
    {candidate_eligible:false,standing:'warning',grading:null})
})

test('MEM-004: fixed strata catch the 45% to 75% aggregate reversal and reject missing coverage', () => {
  const comparison=cases.comparison
  assert.equal(model.stratifiedComparison(comparison),'not_improved')
  assert.equal(model.stratifiedComparison({...comparison,baseline:{easy:comparison.baseline.easy}}),'insufficient')
  assert.equal(model.stratifiedComparison({...comparison,comparable:false}),'insufficient')
  assert.equal(model.stratifiedComparison({...comparison,uncertainty_passed:false}),'insufficient')
})

test('MEM-006: root correction invalidates reads before any stored stale flag changes', () => {
  const artifact={status:'active',review:'current'}
  const before=structuredClone(artifact)
  assert.deepEqual(model.dependencyValidity([{role:'all_of',pins:[{id:'A',version:1}]}],
    {A:{version:2,status:'superseded'}}),{status:'needs_review',action_eligible:false})
  assert.deepEqual(artifact,before)
  assert.equal(model.dependencyValidity([{role:'any_of',pins:[{id:'A',version:1},{id:'B',version:1}]}],
    {A:{version:2,status:'retracted'},B:{version:1,status:'active'}}).status,'current')
  assert.equal(model.dependencyValidity([{role:'all_of',pins:[{id:'hidden',version:1}]}],{}).status,'unverifiable')
})

test('MEM-007: every computation coordinate partitions projection caches', () => {
  const basis=cases.basis
  assert.ok(model.sameBasis(basis,structuredClone(basis)))
  for (const field of Object.keys(basis).filter(k=>k!=='next_invalid_at')) {
    const changed=structuredClone(basis)
    changed[field]=Array.isArray(basis[field])?['another']:typeof basis[field]==='object'?{id:'other',version:'2'}:
      typeof basis[field]==='number'?basis[field]+1:String(basis[field])+'x'
    assert.equal(model.sameBasis(basis,changed),false,field)
  }
})

test('MEM-008: identity repair preserves raw writes and exposes ambiguous affected attribution', () => {
  const writes=[{id:'P1',subject:'B',supplied:'A',decision:'M1'},{id:'P2',subject:'B',supplied:null,decision:'M1'}]
  const result=model.repairIdentity([{id:'M1',source:'A',target:'B'}],writes,'M1')
  assert.deepEqual(result.raw_writes,writes);assert.equal(result.review.length,2)
  assert.equal(result.review[1].supplied,null);assert.equal(result.decisions[0].withdrawn,true)
})

test('MEM-009: deadline coverage, arm generations and expired-worker fencing survive restart', () => {
  const watch={generation:2,armed_seq:10,condition_digest:'d',authorization_view:'view'}
  const worker={...watch,complete:true,clock_passed:true,consumed_seq:20,due_seq:20,matched:false}
  assert.ok(model.silenceEligible(watch,worker))
  for (const change of [{generation:1},{complete:false},{authorization_view:'old'},{consumed_seq:19},{matched:true}])
    assert.equal(model.silenceEligible(watch,{...worker,...change}),false)
  const old=model.acquireLease(null,'one',0,10), current=model.acquireLease(old,'two',11,10)
  assert.equal(model.fenceValid(current,old,12),false)
  assert.equal(model.fenceValid(current,current,22),false)
  assert.equal(model.fenceValid(current,current,12),true)
  const external=new Map([['attempt-1','done']])
  assert.equal(model.recoverAction('attempt-1',external).dispatch,false)
  assert.equal(model.recoverAction('unknown',external).status,'outcome_unknown')
})

test('MEM-010: erased payload plus a retained summary/backup is not completed forgetting', () => {
  assert.equal(model.erasureStatus({targets:[{state:'erased'},{state:'pending'}]}),'partial')
  assert.equal(model.erasureStatus({targets:[{state:'held'}]}),'blocked')
  assert.equal(model.erasureStatus({targets:[{state:'erased'}]}),'completed')
})

test('MEM-012: schema locks follow transitive references, terminate cycles and refuse missing resources', async () => {
  const directory=pathToFileURL((await mkdtemp(join(tmpdir(),'kip-schema-lock-')))+ '/')
  const a={$id:'https://schemas.example.test/a.json',properties:{next:{$ref:'b.json'}}}
  const b={$id:'https://schemas.example.test/b.json',properties:{next:{$ref:'urn:kip:test:c#/$defs/value'}}}
  const c={$id:'urn:kip:test:c',$defs:{value:{type:'string'}},properties:{next:{$ref:a.$id}}}
  try {
    for (const [file,schema] of [['a.json',a],['b.json',b],['c.json',c]])
      await writeFile(new URL(file,directory),JSON.stringify(schema))
    const pins=await validationSchemaLock(directory,[a.$id])
    assert.deepEqual(pins.map(pin=>pin.id),[a.$id,b.$id,c.$id])
    assert.equal(pins[2].content_digest,hash(c))
    c.$defs.value.type='number'
    await writeFile(new URL('c.json',directory),JSON.stringify(c))
    const changed=await validationSchemaLock(directory,[a.$id])
    assert.notEqual(changed[2].content_digest,pins[2].content_digest)
    await rm(new URL('c.json',directory))
    await assert.rejects(validationSchemaLock(directory,[a.$id]),/Unresolved validation schema: urn:kip:test:c/)
  } finally {
    await rm(directory,{recursive:true,force:true})
  }
})

test('MEM-012: manifest pins alone compile every validation schema, including Capsule dependencies', async () => {
  const pkg=await json('profiles/cognitive-memory-2.0.0.schema.json')
  const isolated=new Ajv2020({strict:false,allErrors:true})
  addFormats(isolated)
  for (const pin of pkg.manifest.validation_schemas) isolated.addSchema(schemaCatalog.get(pin.id))
  for (const pin of pkg.manifest.validation_schemas) assert.ok(isolated.getSchema(pin.id),pin.id)
  const capsule=await json('conformance/fixtures/capsules/valid-snapshot.json')
  assert.ok(isolated.validate('urn:kip:2.0:schema:capsule',capsule),JSON.stringify(isolated.errors))
})

test('MEM-018: EvaluationRecord distinguishes promotion from monitoring and withdrawal', () => {
  const validate=ajv.getSchema('urn:kip:2.0:schema:cognitive-records#/$defs/EvaluationRecord')
  const evaluation=cases.records.EvaluationRecord
  const allowed={proposed:['proposed','trialed','revoked'],trialed:['trialed','adopted','revoked'],
    adopted:['adopted','trialed','revoked'],revoked:['revoked','trialed']}
  for (const from of Object.keys(allowed)) for (const to of Object.keys(allowed)) {
    assert.equal(validate({...evaluation,from_status:from,to_status:to}),allowed[from].includes(to),`${from} -> ${to}`)
  }
  // A sparse/unknown monitoring result may retain standing if the recorded policy allows it.
  for (const status of ['insufficient','not_improved']) {
    const monitoring={...evaluation,from_status:'adopted',attempt_refs:[],outcome_refs:[],
      comparison:{...evaluation.comparison,status,effect:null}}
    assert.ok(validate(monitoring),JSON.stringify(validate.errors))
    assert.equal(validate({...monitoring,trial_ref:null}),false,'retained adoption still identifies its trial')
  }
  for (const change of [{trial_ref:null},{attempt_refs:['A1']},{attempt_refs:['A1','A1']},
    {comparison:{...evaluation.comparison,status:'insufficient'}}]) {
    assert.equal(validate({...evaluation,...change}),false,JSON.stringify(change))
  }
  const withdrawal={...evaluation,from_status:'proposed',to_status:'revoked',trial_ref:null,
    attempt_refs:[],outcome_refs:[],comparison:{...evaluation.comparison,status:'withdrawal',effect:null}}
  assert.ok(validate(withdrawal),JSON.stringify(validate.errors))
})

test('MEM-011/012: published shapes and pinned package schemas validate independently', async () => {
  for (const name of ['cognitive-memory-2.0.0.schema.json']) {
    const pkg=await json('profiles/'+name)
    assert.ok(ajv.validate('urn:kip:2.0:schema:schema-package',pkg),JSON.stringify(ajv.errors))
    for (const pin of pkg.manifest.validation_schemas) {
      assert.ok(schemaCatalog.has(pin.id),pin.id)
      assert.equal(hash(schemaCatalog.get(pin.id)),pin.content_digest,pin.id)
    }
    const contracts=await json('schemas/kip-cognitive-records.schema.json')
    for (const [name,facet] of Object.entries(pkg.definitions.facets)) {
      if (!facet.value_schema) continue
      const record=contracts.$defs[name]
      assert.deepEqual(Object.keys(facet.fields).sort(),Object.keys(record.properties).sort(),name)
      assert.deepEqual(Object.keys(facet.fields).filter(k=>facet.fields[k].required).sort(),[...record.required].sort(),name)
    }
  }
  const capsule=await json('conformance/fixtures/capsules/valid-snapshot.json')
  assert.ok(ajv.validate('urn:kip:2.0:schema:capsule',capsule),JSON.stringify(ajv.errors))
  const illegal=structuredClone(capsule);illegal.payload.records[0].confidence=1
  assert.equal(ajv.validate('urn:kip:2.0:schema:capsule',illegal),false)
  for (const [name,value] of Object.entries(cases.records)) {
    assert.ok(ajv.validate('urn:kip:2.0:schema:cognitive-records#/$defs/'+name,value),name+JSON.stringify(ajv.errors))
  }
  const fake=structuredClone(cases.records.EvaluationRecord);fake.attempt_refs=['A1','A1']
  assert.equal(ajv.validate('urn:kip:2.0:schema:cognitive-records#/$defs/EvaluationRecord',fake),false)
  const forget=structuredClone(cases.records.ErasurePlan);forget.status='completed'
  assert.equal(ajv.validate('urn:kip:2.0:schema:cognitive-records#/$defs/ErasurePlan',forget),false)
  const unrun=await json('conformance/fixtures/brain-evaluation-not-run.json')
  assert.ok(ajv.validate('urn:kip:2.0:schema:brain-evaluation',unrun))
  assert.equal(ajv.validate('urn:kip:2.0:schema:brain-evaluation',{...unrun,learning_gate:'passed'}),false)
  assert.equal(ajv.validate('urn:kip:2.0:schema:brain-evaluation',{...unrun,metrics:[{name:'score',estimate:1,lower:1,upper:1,unit:'rate',attempts:1}]}),false)
})

test('updated formation/maintenance recipes remain executable command text', async () => {
  for (const file of ['SPECIFICATION.md','brain/BrainFormation.md','brain/BrainMaintenance.md']) {
    const doc=await readFile(new URL(file,base),'utf8')
    // Only concrete recipes; grammar sketches and ellipsis examples are deliberately non-executable.
    for (const block of doc.matchAll(/^```prolog\s*\n([\s\S]*?)^```/gm)) {
      if (!/SkillRevision|EvaluationRecord|LeaseState|DependencyBasis/.test(block[1]))continue
      const {ast,diagnostics}=parse(block[1]);assert.deepEqual(diagnostics.filter(d=>d.severity==='error'),[],file)
      assert.doesNotThrow(()=>lowerAll(ast),file)
    }
  }
})

test('portable memory vectors validate and the adapter runner detects wrong state and missing execution evidence', async () => {
  const vectors = await Promise.all((await readdir(new URL('conformance/vectors/memory/',base)))
    .filter(f=>f.endsWith('.json')).sort().map(f=>json('conformance/vectors/memory/'+f)))
  assert.equal(vectors.length,30)
  for (const vector of vectors) assert.ok(ajv.validate('urn:kip:2.0:schema:conformance-test-vector',vector),JSON.stringify(ajv.errors))
  const v=vectors[0]
  const adapter={
    describe:async()=>({kind:'model',name:'runner-unit-test',version:'1',capabilities:[]}),
    seed:async()=>{},
    harness:async()=>({observed:{candidate_statuses:['contested','contested'],slot_status:'contested'}}),
    inspect:async()=>({unchanged:true})
  }
  const good=await runMemoryVectors(adapter,[v])
  assert.equal(good.tests[0].status,'PASS');assert.deepEqual(good.profiles_claimed,[])
  assert.ok(ajv.validate('urn:kip:2.0:schema:conformance-report',good),JSON.stringify(ajv.errors))
  const bad=await runMemoryVectors({...adapter,inspect:async()=>({unchanged:false})},[v])
  assert.equal(bad.overall_status,'FAIL')
  assert.ok(ajv.validate('urn:kip:2.0:schema:conformance-report',bad),JSON.stringify(ajv.errors))
  const noExecution=await runMemoryVectors({...adapter,describe:async()=>({kind:'engine',name:'missing evidence',version:'1'})},[v])
  assert.equal(noExecution.tests[0].status,'HARNESS_ERROR')
  assert.ok(ajv.validate('urn:kip:2.0:schema:conformance-report',noExecution),JSON.stringify(ajv.errors))
  const unsupported=await runMemoryVectors(adapter,[vectors[7]])
  assert.equal(unsupported.tests[0].status,'SKIP_UNSUPPORTED')
  assert.equal(unsupported.summary.pass,0)
  assert.equal(unsupported.overall_status,'FAIL')
  assert.ok(ajv.validate('urn:kip:2.0:schema:conformance-report',unsupported),JSON.stringify(ajv.errors))
})

test('packages: the memory and general domain packages validate, and prefers is partitioned by kind', async () => {
  const memory = await json('profiles/cognitive-memory-2.0.0.schema.json')
  const general = await json('profiles/general-domain-1.0.0.schema.json')
  for (const pkg of [memory, general])
    assert.ok(ajv.validate('urn:kip:2.0:schema:schema-package', pkg), JSON.stringify(ajv.errors))
  assert.equal(memory.definitions.predicates.prefers.functional_by, 'object_type')
  assert.equal(memory.definitions.predicates.prefers.functional, false)
  // functional and functional_by together are a package error (Spec §20.15).
  const broken = structuredClone(general)
  broken.definitions.predicates.lives_in.functional_by = 'object_type'
  assert.equal(ajv.validate('urn:kip:2.0:schema:schema-package', broken), false)
  // Removed caches stay removed; computed members are marked and read-only.
  assert.equal(memory.definitions.facets.TrialState, undefined)
  assert.equal(memory.definitions.facets.DerivationState, undefined)
  assert.equal(memory.definitions.facets.GradingState.computed, true)
  assert.ok(Object.values(memory.definitions.facets.GradingState.fields).every(f => f.mutable === false))
  assert.equal(memory.definitions.facets.MnemonicState.fields.effective_strength.computed, true)
  for (const field of ['derived_from', 'compiled_from', 'compiled_by', 'consolidated_to'])
    assert.equal(memory.definitions.structural_fields[field].computed, true, field)
  for (const field of ['current_trial', 'current_evaluation'])
    assert.equal(memory.definitions.structural_fields[field].cardinality.max, 1, field)
  assert.ok(memory.definitions.concept_types.SleepTask.attributes.fields.task_class.enum.includes('review_schema'))
  const pin = general.dependencies.find(d => d.package_ref === 'kip://profiles/cognitive-memory@2.0.0')
  assert.equal(pin.content_digest, memory.integrity.content_digest)
})

test('policy: kip:memory-default is the structural baseline plus three ordered precedence rules', async () => {
  const policy = await json('profiles/policy-memory-default.json')
  assert.equal(policy.policy_id, 'kip:memory-default')
  assert.equal(policy.method.score_model, 'none')
  assert.deepEqual(policy.precedence.order, ['context_specificity', 'first_person_testimony', 'recency'])
  assert.match(policy.precedence.rules.recency, /start key/)
  assert.equal(policy.precedence.outranked_status, 'uncertain')
  const { integrity, ...body } = policy
  assert.equal(hash(body), integrity.content_digest)
})

test('MEM-030: effective strength is computed under the pinned policy, never defaulted', async () => {
  const policy = await json('profiles/policy-strength-half-life-30d.json')
  assert.ok(ajv.validate('urn:kip:2.0:schema:cognitive-records#/$defs/StrengthPolicy', policy), JSON.stringify(ajv.errors))
  const { integrity, ...body } = policy
  assert.equal(hash(body), integrity.content_digest)
  assert.equal(policy.method.half_life_ms, 30 * 24 * 60 * 60 * 1000)
  const policies = { [policy.policy_id]: policy }
  for (const entry of cases.strength) {
    for (const state of [entry.state, ...(entry.variants ?? [])]) {
      for (const read of entry.reads) {
        const value = model.effectiveStrength(state, policies, read.at)
        if (read.expected === null) assert.equal(value, null, entry.id + ' ' + read.at)
        else assert.ok(Math.abs(value - read.expected) < 1e-12, `${entry.id} ${read.at}: ${value}`)
      }
    }
  }
  // A read never writes back: the state is untouched, and the package marks the member computed.
  const before = JSON.stringify(cases.strength[0].state)
  model.effectiveStrength(cases.strength[0].state, policies, '2026-08-31T00:00:00.000Z')
  assert.equal(JSON.stringify(cases.strength[0].state), before)
  // The engine fixture pins the artifact as it ships.
  const fixture = await json('conformance/engine-suite/mnemonic-strength.json')
  assert.equal(fixture.setup[0].params.policy.artifact_ref, policy.policy_id)
  assert.equal(fixture.setup[0].params.policy.content_digest, integrity.content_digest)
  assert.notEqual(fixture.setup[0].params.mismatched_policy.content_digest, integrity.content_digest)
})

test('KML-036: supersession keeps its actor and its scope', () => {
  const old = { actor: 'alice', proposition: 'P-1', subject: 'C-alice', predicate_lineage: 'kip://t/timezone', context_refs: ['C-work'] }
  assert.equal(model.supersessionCompatible(old, { ...old, proposition: 'P-2', context_refs: ['C-work'] }), true)
  assert.equal(model.supersessionCompatible(old, { ...old, proposition: 'P-2', context_refs: [] }), false)
  assert.equal(model.supersessionCompatible({ ...old, context_refs: [] }, { ...old, context_refs: ['C-work'] }), false)
  assert.equal(model.supersessionCompatible(old, { ...old, actor: 'bob' }), false)
  assert.equal(model.supersessionCompatible(old, { ...old, proposition: 'P-3', predicate_lineage: 'kip://t/lives_in' }), false)
  // The context set is canonical: order and repetition do not matter.
  assert.equal(model.supersessionCompatible({ ...old, context_refs: ['C-a', 'C-b'] }, { ...old, context_refs: ['C-b', 'C-a', 'C-b'] }), true)
})

test('world time: succession narrows written intervals and ignores arrival order', () => {
  const t = s => `2026-${s}T00:00:00.000Z`
  const a = (value, from, extra = {}) => ({ id: value, value, assertions: [{ root: value, status: 'active', mode: 'stated',
    stance: 'support', trusted: true, actor: 'alice', from, ...extra }] })
  const candidates = [a('beijing', t('01-01')), a('shanghai', t('05-01')), a('tokyo', t('09-01'))]
  const at = (list, when) => model.project(list, { functional: true, valid_at: t(when) }).accepted_values
  for (const order of [[0, 1, 2], [2, 0, 1], [1, 2, 0]]) {
    const list = order.map(i => candidates[i])
    assert.deepEqual(at(list, '02-01'), ['beijing'])
    assert.deepEqual(at(list, '06-01'), ['shanghai'])
    assert.deepEqual(at(list, '10-01'), ['tokyo'])
  }
  // Before any value began, nothing is invented.
  assert.deepEqual(model.project(candidates, { functional: true, valid_at: '2025-06-01T00:00:00.000Z' }).status, 'insufficient')
  assert.throws(() => model.project([a('x', { earliest: t('05-01'), latest: t('04-01') })], { functional: true, valid_at: t('06-01') }), /time bound/)
})

test('memory-default precedence results satisfy the wire schema, including recency', () => {
  for (const entry of cases.projection.filter(c => c.request.policy === 'memory-default')) {
    const result = model.project(entry.candidates, entry.request)
    for (const row of result.candidates.filter(c => c.precedence)) {
      const projection = { status: row.status, candidate_status: row.candidate_status,
        slot_status: row.slot_status, leading: row.status === 'accepted' ? 'support' : 'none',
        basis: cases.basis, conflict_refs: row.conflict_refs, conflict_reasons: [],
        uncertainty: { reasons: row.reasons }, precedence: row.precedence }
      assert.ok(ajv.validate('urn:kip:2.0:schema:projection', projection), entry.id + JSON.stringify(ajv.errors))
    }
  }
})

test('functional_by: a conflict in one partition does not change another partition slot', () => {
  const entry = structuredClone(cases.projection.find(c => c.id === 'MEM-028a'))
  entry.candidates[1].assertions[0].from = entry.candidates[0].assertions[0].from
  const result = model.project(entry.candidates, entry.request)
  assert.deepEqual(result.accepted_values, ['vim'])
  assert.deepEqual(result.candidates.map(c => c.slot_status), ['contested', 'contested', 'accepted'])
  const editor = model.project([entry.candidates[2]], entry.request)
  assert.deepEqual(result.candidates[2], editor.candidates[0])
})

test('a value-only correction preserves earlier answers without backdating asserted_at', () => {
  const originalTime = '2026-01-01T00:00:00.000Z', correctionTime = '2026-09-21T00:00:00.000Z'
  const old = { id: 'old', value: '+08:00', assertions: [{ root: 'E1', actor: 'alice', mode: 'stated',
    stance: 'support', status: 'superseded', trusted: true, asserted_at: originalTime }] }
  const replacement = { id: 'new', value: '+07:00', assertions: [{ root: 'E2', actor: 'alice', mode: 'stated',
    stance: 'support', status: 'active', trusted: true, asserted_at: correctionTime, from: { latest: originalTime } }] }
  const request = { functional: true, valid_at: '2026-06-01T00:00:00.000Z' }
  assert.deepEqual(model.project([old, replacement], request).accepted_values, ['+07:00'])
  assert.equal(model.project([old, replacement], { ...request, valid_at: '2025-12-01T00:00:00.000Z' }).status, 'uncertain')
  const missingInterval = structuredClone(replacement)
  delete missingInterval.assertions[0].from
  assert.equal(model.project([old, missingInterval], request).status, 'uncertain')
  assert.equal(replacement.assertions[0].asserted_at, correctionTime)
})
