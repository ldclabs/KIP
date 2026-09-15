import { readFile, readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { runMemoryVectors } from './runner.mjs'
const args=process.argv.slice(2)
const suiteIndex=args.indexOf('--suite')
const suite=suiteIndex<0?'memory':args[suiteIndex+1]
if (!['memory','interface'].includes(suite)) {
  console.error('Unknown suite; choose memory or interface');process.exit(2)
}
if(suiteIndex>=0)args.splice(suiteIndex,2)
const directory=new URL(`vectors/${suite}/`,import.meta.url)
const vectors=await Promise.all((await readdir(directory)).filter(f=>f.endsWith('.json')).sort()
  .map(async file=>JSON.parse(await readFile(new URL(file,directory),'utf8'))))
if(args.includes('--list')) console.log(vectors.map(v=>v.id+' '+v.title).join('\n'))
else if(args[0]==='--adapter'&&args[1]) {
  const module=await import(pathToFileURL(resolve(args[1])).href)
  const report=await runMemoryVectors(module.default,vectors)
  console.log(JSON.stringify(report,null,2))
  if(report.overall_status!=='PASS')process.exitCode=1
} else {
  console.error('Usage: node conformance/run.mjs [--suite memory|interface] --list | --adapter /absolute/path/to/adapter.mjs')
  process.exitCode=2
}
