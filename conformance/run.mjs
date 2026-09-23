import { readFile, readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { runMemoryVectors } from './runner.mjs'
import { loadEngineSuite, runEngineSuite } from './engine-runner.mjs'

const usage = 'Usage: node conformance/run.mjs [--suite engine|memory|interface|reliability] --list | --adapter /absolute/path/to/adapter.mjs'
const args = process.argv.slice(2)
const suiteIndex = args.indexOf('--suite')
const suite = suiteIndex < 0 ? 'memory' : args[suiteIndex + 1]
if (!['engine', 'memory', 'interface', 'reliability'].includes(suite)) {
  console.error('Unknown suite; choose engine, memory, interface or reliability'); process.exit(2)
}
if (suiteIndex >= 0) args.splice(suiteIndex, 2)

async function adapter() {
  return (await import(pathToFileURL(resolve(args[1])).href)).default
}

if (suite === 'engine') {
  const fixtures = await loadEngineSuite()
  if (args.includes('--list')) console.log(fixtures.map(f => `${f.name} ${f.cases.length}`).join('\n'))
  else if (args[0] === '--adapter' && args[1]) {
    const report = await runEngineSuite(await adapter(), fixtures)
    console.log(JSON.stringify(report, null, 2))
    if (report.overall_status !== 'PASS') process.exitCode = 1
  } else { console.error(usage); process.exitCode = 2 }
} else {
  const directory = new URL(`vectors/${suite}/`, import.meta.url)
  const vectors = await Promise.all((await readdir(directory)).filter(f => f.endsWith('.json')).sort()
    .map(async file => JSON.parse(await readFile(new URL(file, directory), 'utf8'))))
  if (args.includes('--list')) console.log(vectors.map(v => v.id + ' ' + v.title).join('\n'))
  else if (args[0] === '--adapter' && args[1]) {
    const report = await runMemoryVectors(await adapter(), vectors)
    console.log(JSON.stringify(report, null, 2))
    if (report.overall_status !== 'PASS') process.exitCode = 1
  } else { console.error(usage); process.exitCode = 2 }
}
