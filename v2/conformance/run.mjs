import { readFile, readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { runMemoryVectors } from './runner.mjs'
const directory=new URL('vectors/memory/',import.meta.url)
const vectors=await Promise.all((await readdir(directory)).filter(f=>f.endsWith('.json')).sort()
  .map(async file=>JSON.parse(await readFile(new URL(file,directory),'utf8'))))
const args=process.argv.slice(2)
if(args.includes('--list')) console.log(vectors.map(v=>v.id+' '+v.title).join('\n'))
else if(args[0]==='--adapter'&&args[1]) {
  const module=await import(pathToFileURL(resolve(args[1])).href)
  const report=await runMemoryVectors(module.default,vectors)
  console.log(JSON.stringify(report,null,2))
  if(report.overall_status!=='PASS')process.exitCode=1
} else {
  console.error('Usage: node v2/conformance/run.mjs --list | --adapter /absolute/path/to/adapter.mjs')
  process.exitCode=2
}
