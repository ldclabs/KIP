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
  for (const until of ['2026-09-06T12:00:00Z','2026-09-05T12:00:00Z']) {
    const candidate={id:'P',value:'value',assertions:[{from:'2026-09-06T12:00:00Z',until}]}
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
  const pkg=await json('profiles/cognitive-memory-2.1.0.schema.json')
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
  for (const name of ['cognitive-memory-2.1.0.schema.json']) {
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
  assert.equal(vectors.length,25)
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
