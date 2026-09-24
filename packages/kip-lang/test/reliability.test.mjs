import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { MemorySession, parseTimestamp, parseTimePoint, parse, lowerAll, canonicalize } from '../dist/index.js'
import * as model from '../../../conformance/reference/reliability.mjs'

const root = new URL('../../../', import.meta.url)
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const ajv = new Ajv2020({ strict: false, allErrors: true }); addFormats(ajv)
for (const file of await readdir(new URL('schemas/', root))) {
  if (file.endsWith('.json')) ajv.addSchema(await json('schemas/' + file))
}
const prefix = 'urn:kip:2.0:schema:'
const validates = (name, value) => ajv.validate(prefix + 'cognitive-records#/$defs/' + name, value)
const artifact = { artifact_ref: 'artifact:selector', content_digest: 'sha256:' + 'a'.repeat(64) }
const t = '2026-09-23T00:00:00.000Z', t1 = '2026-09-23T00:00:01.000Z', t2 = '2026-09-23T00:00:02.000Z'

test('REL-001: all current protocol timestamps share strict syntax and real calendar validation', () => {
  const schema = prefix + 'common#/$defs/Timestamp'
  for (const value of [t, '2000-02-29T23:59:59.999Z', '0000-01-01T00:00:00.000Z']) {
    assert.equal(ajv.validate(schema, value), true, value)
    assert.equal(new Date(parseTimestamp(value)).toISOString(), value)
  }
  for (const value of ['2026-09-23T00:00:00Z', '2026-09-23T08:00:00.000+08:00',
    '2026-09-23T00:00:00.000001Z', '2026-02-30T00:00:00.000Z',
    '1900-02-29T00:00:00.000Z', '2026-09-23T00:00:60.000Z', '2026-09-23t00:00:00.000z', 0]) {
    assert.equal(ajv.validate(schema, value), false, String(value))
    assert.throws(() => parseTimestamp(value))
  }
})

test('REL-002: added opposition and negative-query phantoms invalidate selection dependencies', () => {
  const query = { kind: 'belief', selector: artifact, result_digest: artifact.content_digest,
    change_token: 'slot:1', expectation: 'accepted', authorization_view: 'auth' }
  assert.ok(validates('QueryDependency', query))
  const basis = { groups: [{ role: 'all_of', pins: [{ id: 'A', version: 1 }] }], queries: [query] }
  const state = { snapshot_seq: 2, elements: { A: { version: 1, status: 'active' } },
    queries: { [artifact.content_digest]: { ...query, complete: true, status: 'accepted', count: 1 } } }
  assert.equal(model.validateDependencies(basis, state).status, 'current')
  state.queries[artifact.content_digest] = { ...state.queries[artifact.content_digest],
    change_token: 'slot:2', checked_seq: 2, status: 'contested' }
  assert.equal(model.validateDependencies(basis, state).status, 'needs_review')
  query.expectation = 'empty'
  assert.equal(model.validateDependencies(basis, state).status, 'needs_review')
  delete state.queries[artifact.content_digest].checked_seq
  assert.equal(model.validateDependencies(basis, state).status, 'unverifiable')
})

test('REL-003: unrelated planes preserve validity but lifecycle and unavailable roots do not', () => {
  const basis = { groups: [{role:'all_of', pins:[{id:'A',version:1,planes:{attributes:1}}]}] }
  const state = { elements: { A: { version: 2, planes:{attributes:1,'facets.MnemonicState':2},status:'active' } } }
  assert.equal(model.validateDependencies(basis,state).status,'current')
  state.elements.A.status='superseded'
  assert.equal(model.validateDependencies(basis,state).status,'needs_review')
  delete state.elements.A
  assert.equal(model.validateDependencies(basis,state).status,'unverifiable')
  assert.equal(model.validateDependencies({groups:[{role:'context',pins:[{id:'A',version:1}]}]},state).status,'unverifiable')
})

test('REL-004: recording repair preserves source and actor history and checks recorder authority', () => {
  const request = {source_ref:'E',source_digest:artifact.content_digest,source_locator:'/text',
    invalidated_refs:['A'],replacement_refs:['B'],reason:'extraction_error',expected_versions:{A:1}}
  assert.ok(validates('RecordingRepair',request))
  const host = {principal:'recorder',permissions:['repair_recording'],allowed_actors:['alice'],
    source:{id:'E',digest:artifact.content_digest,locators:['/text']}}
  const originals={A:{origin:'recorder',source_ref:'E',version:1}}, replacements={B:{source_ref:'E',actor:'alice'}}
  const before=canonicalize({originals,replacements})
  assert.equal(model.validateRecordingRepair(request,host,originals,replacements).actor_withdrawal,false)
  assert.equal(canonicalize({originals,replacements}),before)
  assert.throws(()=>model.validateRecordingRepair(request,{...host,permissions:[]},originals,replacements),/NotAuthorized/)
  assert.throws(()=>model.validateRecordingRepair(request,{...host,principal:'another'},originals,replacements),/PreconditionFailed/)
})

test('REL-005: causal corrections converge for every arrival order and survive restart', () => {
  const events=[{id:'A',stream:'s',ordinal:1,predecessors:[],value:'old'},
    {id:'B',stream:'s',ordinal:2,predecessors:['A'],value:'new'},
    {id:'C',stream:'s',ordinal:3,predecessors:['B'],value:'latest'}]
  for (const order of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
    let queue=new model.FormationQueue()
    for (const i of order) queue.enqueue(events[i])
    queue=new model.FormationQueue(queue.snapshot())
    const applied=[]
    for(let turn=0;turn<3;turn++) {
      queue=new model.FormationQueue(queue.snapshot())
      for(const i of order) if(queue.ready(events[i].id)) {
        queue.complete(events[i].id); applied.push(events[i].value)
      }
    }
    assert.deepEqual(applied,['old','new','latest'])
    queue.enqueue(events[0]);assert.equal(queue.snapshot().length,3)
  }
  const queue=new model.FormationQueue();events.forEach(e=>queue.enqueue(e))
  queue.complete('A','failed');assert.equal(queue.ready('B'),false)
  assert.throws(()=>queue.complete('C'),/PreconditionFailed/)
})

test('REL-006: prospective trials accept future controls, freeze missingness and reject post-outcome assignment', () => {
  const trial={id:'T',baseline_mode:'prospective',enrollment:artifact,baseline_attempt_refs:[],baseline_outcome_refs:[]}
  const attempts=['control','treatment'].map((arm,i)=>({id:'A'+i,trial_ref:'T',host_verified:true,started_at:t1,
    assignment:{enrollment:artifact,unit_id:'u',arm,assigned_at:t}}))
  const outcome={attempt_ref:'A1',observed_at:t2,terminal:true,instrument_verified:true,observation_key:'o',status:'success'}
  const log={complete:true,cutoff:t2,enrollment:artifact,attempt_refs:['A0','A1']}
  const results=model.freezeProspectiveCohort(trial,attempts,[outcome,{...outcome}],t2,log)
  assert.equal(results.length,2);assert.equal(results[0].status,'unknown');assert.equal(results[1].status,'success')
  assert.throws(()=>model.freezeProspectiveCohort(trial,attempts.slice(1),[outcome],t2,log),/IncompleteEnrollment/)
  const changed=structuredClone(attempts);changed[0].assignment.assigned_at=t2
  assert.throws(()=>model.freezeProspectiveCohort(trial,changed,[outcome],t2,log),/InvalidEnrollment/)
  assert.throws(()=>model.freezeProspectiveCohort(trial,[...attempts,attempts[0]],[outcome],t2,log),/IncompleteEnrollment/)
  assert.throws(()=>model.freezeProspectiveCohort(trial,attempts,[{...outcome,attempt_ref:'foreign'}],t2,log),/InvalidEnrollment/)
})

test('REL-007: receiver rejects an old worker after its sender-side preflight passed', () => {
  const receiver=new model.FencedReceiver();receiver.advance('resource',1)
  const request={resource:'resource',attempt_id:'attempt',payload:'effect'}
  const old={resource:'resource',attempt_id:'attempt',fence:1,expires_at:t2}
  receiver.advance('resource',2)
  assert.throws(()=>receiver.accept(request,old,t1),/StaleFence/)
  const current={...old,fence:2}
  assert.equal(receiver.accept(request,current,t1),'applied')
  assert.equal(receiver.accept(request,current,t1),'replayed')
  assert.equal(receiver.effects.size,1)
  assert.throws(()=>receiver.accept({...request,payload:'different'},current,t1),/IdempotencyConflict/)
  assert.equal(validates('DispatchContract',{guarantee:'receiver_fenced',linearization_point:'native_admission',receiver_binding:artifact}),false)
})

test('REL-008: exact mandatory coverage is separate from approximate optional search', () => {
  const basis={snapshot_seq:5,authorization_view:'auth'}
  const plan={selector:artifact,scope:{task_ref:null,context_refs:[]},method:'exact',snapshot_seq:5,
    index_seq:null,covered_through_seq:5,authorization_view:'auth',complete:true,truncation_reason:null}
  assert.ok(validates('RecallPlan',plan))
  assert.equal(model.coverageEligible(['constraints'],{constraints:plan},basis),true)
  assert.equal(model.coverageEligible(['constraints'],{constraints:{...plan,method:'approximate'}},basis),false)
  assert.equal(model.coverageEligible(['constraints'],{constraints:{...plan,covered_through_seq:4}},basis),false)
  assert.equal(model.coverageEligible(['constraints'],{},basis),false)
})

test('REL-009: task keys are canonical, isolated and immutable snapshots', () => {
  assert.equal(model.scopedWorkingKey('self',{task_ref:'A',context_refs:['b','a','a']}),
    model.scopedWorkingKey('self',{task_ref:'A',context_refs:['a','b']}))
  assert.notEqual(model.scopedWorkingKey('self',{task_ref:'A',context_refs:[]}),
    model.scopedWorkingKey('self',{task_ref:'B',context_refs:[]}))
})

test('REL-010: hidden dependents cannot change the visible completeness flag', () => {
  const visible=[{id:'visible',visible:true}]
  assert.deepEqual(model.visibleDependents(visible,10),
    model.visibleDependents([...visible,{id:'secret',visible:false}],10))
})

test('REL-011: lazy mnemonic strength is read-only and separate from truth', () => {
  const state={base_strength:0.8,anchored_at:t,half_life_ms:1000,confidence:0.99}
  assert.equal(model.effectiveStrength(state,t1),0.4)
  assert.equal(model.effectiveStrength(state,t2),0.2)
  assert.equal(state.base_strength,0.8);assert.equal(state.confidence,0.99)
})

test('REL-012: applicability assessment never becomes adoption or execution authority', () => {
  assert.deepEqual(model.assessmentStanding({purpose:'applicability',grants_standing:false,result:'satisfied'}),
    {standing:'unproven',applicable:true,execution_authority:false})
  assert.throws(()=>model.assessmentStanding({purpose:'applicability',grants_standing:true,result:'satisfied'}))
})

test('REL-013: SDK preserves every pending receipt across restart and scopes requests', () => {
  let session=new MemorySession({space_id:'S',scope:{task_ref:'task'},outstanding:[]})
  session.recordReceipt('S','A');session.recordReceipt('S','B')
  session=new MemorySession(session.snapshot())
  const request=session.recall({query:'now?',after:['B']})
  assert.deepEqual(request.input.after,['A','B'])
  assert.ok(ajv.validate(prefix+'memory',request),JSON.stringify(ajv.errors))
  session.acknowledgeRecall(['B']);assert.deepEqual(session.recall({query:'now?'}).input.after,['A'])
  assert.throws(()=>session.recordReceipt('foreign','C'),/scope/)
  const snapshot=session.snapshot();snapshot.outstanding.push('forged')
  assert.deepEqual(session.snapshot().outstanding,['A'])
})

test('MIF-019: the session keeps the attention cursor and hands it to attention and resume recalls', () => {
  let session=new MemorySession({space_id:'S',scope:{task_ref:'task'},outstanding:[]})
  const first=session.recall({mode:'attention'})
  assert.ok(ajv.validate(prefix+'memory',first),JSON.stringify(ajv.errors))
  assert.equal(first.input.attention_cursor,undefined)
  assert.throws(()=>session.recall({}),/query, a target_ref or mode "attention"/)
  assert.throws(()=>session.acknowledgeAttention(''),/cursor/)
  session.acknowledgeAttention('attention:41')
  // The host keeps the cursor across a restart; consuming attention changes nothing else.
  session=new MemorySession(session.snapshot())
  const next=session.recall({mode:'attention'})
  assert.equal(next.input.attention_cursor,'attention:41')
  assert.ok(ajv.validate(prefix+'memory',next),JSON.stringify(ajv.errors))
  assert.equal(session.recall({query:'where were we?',mode:'resume'}).input.attention_cursor,'attention:41')
  assert.equal(session.recall({query:'now?'}).input.attention_cursor,undefined)
  assert.equal(session.recall({mode:'attention',attention_cursor:'attention:7'}).input.attention_cursor,'attention:7')
  assert.deepEqual(session.snapshot().outstanding,[])
  const dated=session.recall({query:'then?',time:{valid_at:'2026-09-06T00:00:00.000Z',as_of_seq:13},detail:'evidence'})
  assert.ok(ajv.validate(prefix+'memory',dated),JSON.stringify(ajv.errors))
  assert.throws(()=>session.recall({query:'then?',time:{valid_at:'2026-09-06'}}),/timestamp/)
  assert.throws(()=>session.recall({query:'then?',time:{as_of_seq:-1}}),/as_of_seq/)
  assert.throws(()=>session.recall({query:'then?',time:{as_of_seq:1.5}}),/as_of_seq/)
  // An empty cursor is neither a cursor nor "use the kept one".
  assert.throws(()=>session.recall({mode:'attention',attention_cursor:''}),/cursor/)
  assert.equal(session.recall({mode:'attention'}).input.attention_cursor,'attention:41')
  assert.throws(()=>new MemorySession({space_id:'S',scope:{},outstanding:[],attention_cursor:''}),/snapshot/)
})

test('REL-014: scoped ASSERT lowers to the same immutable context_refs field', () => {
  const command=lowerAll(parse('ASSERT ?a (:s, "prefers", :o) {by: :actor, mode: "stated", context: :contexts}').ast)[0]
  const text=JSON.stringify(command)
  assert.match(text,/context_refs/);assert.match(text,/contexts/)
  assert.doesNotMatch(text,/"context"/)
})

test('REL-015: the current package activates only from its digest-pinned schema closure', async () => {
  const { createHash }=await import('node:crypto')
  const pkg=await json('profiles/cognitive-memory-2.0.0.schema.json')
  const digest=value=>'sha256:'+createHash('sha256').update(canonicalize(value)).digest('hex')
  const isolated=new Ajv2020({strict:false});addFormats(isolated)
  for(const pin of pkg.manifest.validation_schemas){
    const schema=ajv.getSchema(pin.id)?.schema
    assert.ok(schema,pin.id)
    assert.equal(digest(schema),pin.content_digest)
    isolated.addSchema(schema)
  }
  for(const pin of pkg.manifest.validation_schemas) assert.ok(isolated.getSchema(pin.id))
  // A substituted resource under a pinned ID is refused by digest, whatever a cache holds.
  const pin=pkg.manifest.validation_schemas[0]
  const substituted={...ajv.getSchema(pin.id).schema,description:'substituted'}
  assert.notEqual(digest(substituted),pin.content_digest)
  const {integrity,...body}=pkg
  assert.equal(digest(body),integrity.content_digest)
})

test('REL-016: import maps only declared references while retaining signed source coordinates', () => {
  const source={used_refs:['A'],text:'A',basis:{space_id:'source',snapshot_seq:9}}
  const before=canonicalize(source)
  const result=model.importReferenceView(source,{A:'destination:A'},['/used_refs/0'])
  assert.equal(result.destination.used_refs[0],'destination:A')
  assert.equal(result.destination.text,'A')
  assert.deepEqual(result.destination.basis,source.basis)
  assert.equal(canonicalize(result.source),before);assert.equal(canonicalize(source),before)
  assert.equal(result.standing,'unproven');assert.equal(result.authority_transferred,false)
  assert.throws(()=>model.importReferenceView(source,{},['/used_refs/0']),/UnmappedReference/)
})

test('REL-017: immutable evaluation rebuilds grades independently of mutable cache counts', () => {
  const skill={current_revision:'R',evaluation_ref:'E',grading:{success_count:999}}
  const evaluation={id:'E',revision_refs:['R'],validated:true,
    independent_attempt_counts:{success_count:2,failure_count:1,graded_count:3}}
  assert.deepEqual(model.rebuildGrade(skill,evaluation),{revision_ref:'R',evaluation_ref:'E',
    success_count:2,failure_count:1,graded_count:3})
  assert.throws(()=>model.rebuildGrade({...skill,current_revision:'other'},evaluation),/UnverifiableEvaluation/)
})

test('REL vectors use independent observations and reject missing postconditions', async () => {
  const {runMemoryVectors}=await import('../../../conformance/runner.mjs')
  const vectorSchema=await json('conformance/conformance-test-vector.schema.json');ajv.addSchema(vectorSchema)
  const files=await readdir(new URL('conformance/vectors/reliability/',root))
  assert.equal(files.length,17)
  for(const file of files) {
    const vector=await json('conformance/vectors/reliability/'+file)
    assert.ok(ajv.validate(vectorSchema.$id,vector),JSON.stringify(ajv.errors))
    assert.ok(vector.assertions.length && vector.postconditions.length)
  }
  const vector=await json('conformance/vectors/reliability/KIP2-REL-010.json')
  const adapter={describe:async()=>({kind:'model',name:'noninterference',version:'1',capabilities:['list_dependents']}),
    seed:async()=>{},harness:async()=>({observed:{visible_results_equal:true}}),inspect:async()=>({})}
  const report=await runMemoryVectors(adapter,[vector])
  assert.equal(report.overall_status,'FAIL');assert.deepEqual(report.profiles_claimed,[])
})

test('current trial schema distinguishes prospective enrollment from fixed baseline defaults', async () => {
  const original=(await json('conformance/vectors/cognitive-contracts.json')).records.TrialRecord
  assert.ok(validates('TrialRecord',original),JSON.stringify(ajv.errors))
  const prospective={...original,baseline_mode:'prospective',baseline_attempt_refs:[],baseline_outcome_refs:[],enrollment:artifact}
  assert.ok(validates('TrialRecord',prospective),JSON.stringify(ajv.errors))
  assert.equal(validates('TrialRecord',{...prospective,baseline_attempt_refs:['future']}),false)
  const missing={...prospective};delete missing.enrollment
  assert.equal(validates('TrialRecord',missing),false)
})

test('causal intake cannot expose a correction before its explicit predecessor was processed', async () => {
  const {IntakeLedger}=await import('../../../conformance/reference/memory-interface.mjs')
  const ledger=new IntakeLedger(), host={principal:'p',space_id:'S',accepted_seq:1}
  const admit=(key,context)=>ledger.admit(context,{operation:'observe',idempotency_key:key,input:{source_ref:key}},
    {ref:key,identity:key,digest:artifact.content_digest}).receipt.receipt_ref
  const a=admit('A',host), b=admit('B',{...host,accepted_seq:2,
    source_order:{stream_ref:'stream',event_ref:'B',ordinal:2,predecessor_receipts:[a]}})
  const available=ref=>({receipt_ref:ref,phase:'available',disposition:'formed',resolved_seq:3,available_seq:3})
  assert.throws(()=>ledger.advance(host,available(b)),/PreconditionFailed/)
  ledger.advance(host,available(a));ledger.advance(host,available(b))
  assert.equal(ledger.read(host,b).progress.phase,'available')
})

test('time bounds: parseTimePoint accepts exact instants and bounds, never an invented instant', () => {
  assert.equal(parseTimePoint(null), null)
  assert.deepEqual(parseTimePoint(t), { earliest: Date.parse(t), latest: Date.parse(t) })
  assert.deepEqual(parseTimePoint({ latest: t }), { earliest: -Infinity, latest: Date.parse(t) })
  assert.deepEqual(parseTimePoint({ earliest: t, latest: t2 }), { earliest: Date.parse(t), latest: Date.parse(t2) })
  for (const bad of [{}, { earliest: t2, latest: t }, { at: t }, { latest: '2026-09-23' }, 5, []])
    assert.throws(() => parseTimePoint(bad))
  const common = 'urn:kip:2.0:schema:common#/$defs/TimePoint'
  assert.equal(ajv.validate(common, { earliest: t, latest: t2 }), true)
  assert.equal(ajv.validate(common, {}), false)
  assert.equal(ajv.validate(common, { at: t }), false)
})
