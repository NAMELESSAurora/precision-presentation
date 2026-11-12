// Print unique layout flags. Usage: node scripts/lib/summ.mjs report.json [type,type] [WxH]
import { readFileSync } from 'node:fs'
const [file, typesArg, view] = process.argv.slice(2)
if (!file) { console.error('usage: node scripts/lib/summ.mjs report.json [type,type] [WxH]'); process.exit(1) }
const report = JSON.parse(readFileSync(file, 'utf8'))
const types = typesArg ? new Set(typesArg.split(',')) : null
const groups = new Map()
for (const f of report.flags || []) {
  if (view && f.view !== view) continue
  if (types && !types.has(f.type)) continue
  const key = [f.slide, f.type, f.a || f.text || f.el || f.media || '', f.b || f.media || ''].join('\t')
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(String(f.step))
}
const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
for (const [key, steps] of sorted) {
  const [slide, type, a, b] = key.split('\t')
  console.log(`${slide} ${type} | ${a.slice(0, 70)} | ${b.slice(0, 60)} | steps ${[...new Set(steps)].sort().join(',')}`)
}
console.log(`${sorted.length} unique`)
