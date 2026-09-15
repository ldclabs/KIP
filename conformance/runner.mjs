/** Adapter runner for the shipped memory/interface subsets. Never asserts whole-profile coverage. */
import { isDeepStrictEqual } from 'node:util'

function pointer(value, path) {
  if (path === '') return value
  if (!path.startsWith('/')) throw new Error('assertion requires a JSON Pointer')
  return path.slice(1).split('/').reduce((v,key) => v?.[key.replace(/~1/g,'/').replace(/~0/g,'~')], value)
}
async function bounded(operation, timeout) {
  let timer
  try {
    return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error('adapter deadline exceeded')),timeout)
    })])
  } finally { clearTimeout(timer) }
}
export async function runMemoryVectors(adapter, vectors) {
  const about=await bounded(()=>adapter.describe(),10000)
  if (!['engine','model'].includes(about.kind)) throw new Error('adapter must disclose engine or model')
  const tests=[]
  for (const vector of vectors) {
    const missing=(vector.capabilities??[]).filter(c=>!about.capabilities?.includes(c))
    if (missing.length) {
      const status=vector.level==='OPTIONAL'?'SKIP_UNSUPPORTED':'FAIL'
      tests.push({id:vector.id,status,...(status==='FAIL'?{failures:[{phase:'setup',message:'required capability missing'}]}:
        {skip:{reason:'unsupported_capability',message:missing.join(',')}})});continue
    }
    const observations={};let state
    try {
      await bounded(()=>adapter.seed(vector.fixture),vector.timeout_ms??10000)
      for (const step of vector.steps) {
        if (step.kind!=='harness') throw new Error('unsupported step: this runner executes the shipped memory harness vectors')
        const record=await bounded(()=>adapter.harness(step.action,step.args),vector.timeout_ms??10000)
        if (about.kind==='engine' && (!Array.isArray(record.raw_responses)||!record.raw_responses.length))
          throw new Error('engine exercise must retain raw responses/receipts')
        observations[step.id]=record.observed
      }
      state=await bounded(()=>adapter.inspect(vector.id),vector.timeout_ms??10000)
      const failures=[]
      for (const expectation of [...(vector.assertions??[]),...(vector.postconditions??[])]) {
        if (expectation.operator!=='equals') throw new Error('unsupported assertion operator')
        const source=expectation.source==='state'?state:observations[expectation.step]
        const actual=pointer(source,expectation.path)
        if (!isDeepStrictEqual(actual,expectation.expected)) failures.push({
          phase:expectation.source==='state'?'postcondition':'assertion',
          message:`${expectation.source} ${expectation.path}: expected ${JSON.stringify(expectation.expected)}, got ${JSON.stringify(actual)}`})
      }
      tests.push({id:vector.id,status:failures.length?'FAIL':'PASS',observed:{steps:observations,state},
        ...(failures.length?{failures}:{})})
    } catch (error) {
      tests.push({id:vector.id,status:'HARNESS_ERROR',error:{code:'AdapterError',message:error.message}})
      // A timed-out mutation may still commit; never continue against an uncertain fixture.
      break
    }
  }
  const summary={pass:0,fail:0,skip_unsupported:0,not_applicable:0,harness_error:0}
  for (const result of tests) summary[result.status.toLowerCase()]++
  return {implementation:{name:`[${about.kind}] ${about.name}`,version:about.version,kip_version:'2.0-draft'},
    profiles_claimed:[],profiles:{},summary,tests,
    overall_status:summary.fail||summary.harness_error||!summary.pass||tests.length!==vectors.length?'FAIL':'PASS',
    warnings:[{code:'PartialSuite',message:'Selected memory contract subset only. No full-profile conformance or behavioral learning is claimed.'}],
    extensions:{'kip.org/evidence':{critical:false,kind:about.kind,selected: vectors.length,executed:tests.length}}}
}
