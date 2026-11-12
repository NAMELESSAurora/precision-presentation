// Warn when a storyboard or motion map overuses a recipe, or names one that is not in the catalog.
// Usage: node scripts/lint-storyboard.mjs storyboard.yaml [design/motion-map.yaml] [--catalog design/recipes/catalog.json] [--gate]
// `stars: system` recipes (overlap-handoff, word-mask, flood-theme) may repeat. Others use catalog.limit (default 1).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from './lib/session.mjs'

const KEY = /^[ \t]*(?:-\s*)?(recipe|transition)\s*:\s*["']?([a-z0-9][a-z0-9-]*)["']?\s*(?:#.*)?$/i

export function collectNames(text) {
  const found = []
  String(text).split(/\r?\n/).forEach((line, i) => {
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) return
    const cut = line.split('#')[0]
    const m = KEY.exec(cut)
    if (m) found.push({ kind: m[1].toLowerCase(), id: m[2], line: i + 1 })
  })
  return found
}

export function lintNames(found, catalog) {
  const counts = new Map()
  const problems = []
  for (const item of found) {
    const spec = catalog[item.id]
    if (!spec) {
      problems.push({ id: item.id, line: item.line, message: `unknown recipe "${item.id}" (line ${item.line})` })
      continue
    }
    if (!counts.has(item.id)) counts.set(item.id, [])
    counts.get(item.id).push(item.line)
  }
  for (const [id, lines] of counts) {
    const spec = catalog[id]
    const limit = spec.limit ?? (spec.stars === 'system' ? Infinity : 1)
    if (lines.length > limit) {
      problems.push({
        id,
        line: lines[0],
        message: `"${id}" stars ${lines.length} times (limit ${limit}, ${spec.stars}); lines ${lines.join(', ')}`,
      })
    }
  }
  return { counts: Object.fromEntries([...counts].map(([id, lines]) => [id, lines.length])), problems }
}

const isMain = process.argv[1] && process.argv[1].endsWith('lint-storyboard.mjs')
if (isMain) {
  const { opt, flag, positional } = parseArgs()
  const catalog = JSON.parse(readFileSync(resolve(opt('catalog', 'design/recipes/catalog.json')), 'utf8'))
  const files = positional.length ? positional : ['storyboard.yaml']
  const found = []
  for (const file of files) {
    const text = readFileSync(resolve(file), 'utf8')
    for (const item of collectNames(text)) found.push({ ...item, file })
  }
  const { counts, problems } = lintNames(found, catalog)
  const named = Object.keys(counts).length
  console.log(named ? JSON.stringify(counts) : 'no recipe names yet')
  for (const p of problems) console.log('WARN', p.file ? '' : '', p.message)
  if (flag('gate') && problems.length) process.exit(1)
}
