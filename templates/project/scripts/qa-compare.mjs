// Before/after stills, one pair per shared filename, plus a contact sheet of the pairs.
// Usage: node scripts/qa-compare.mjs <before-dir> <after-dir> <out-dir> [--crop W:H:X:Y] [--cols 2]
import { mkdirSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { contactSheet, sideBySide } from './lib/sheet.mjs'
import { parseArgs } from './lib/session.mjs'

const { opt, positional } = parseArgs()
const [before, after, outDir] = positional
if (!before || !after || !outDir) { console.error('usage: node scripts/qa-compare.mjs <before-dir> <after-dir> <out-dir> [--crop W:H:X:Y]'); process.exit(1) }
const out = resolve(outDir)
mkdirSync(out, { recursive: true })
const names = readdirSync(resolve(before)).filter((f) => f.endsWith('.png'))
const made = []
for (const name of names) {
  const b = resolve(before, name)
  const a = resolve(after, name)
  if (!readdirSync(resolve(after)).includes(name)) continue
  const dest = resolve(out, name.replace(/\.png$/, '') + '-before-after.png')
  sideBySide(b, a, dest, { crop: opt('crop', ''), labelBefore: 'before', labelAfter: 'after' })
  made.push(dest)
  console.log(dest)
}
if (made.length) contactSheet(made, resolve(out, 'before-after-sheet.png'), { cols: Number(opt('cols', 2)), thumb: Number(opt('thumb', 640)) })
console.log(`${made.length} pairs`)
