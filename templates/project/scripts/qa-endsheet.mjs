// Contact sheet of stills. Usage: node scripts/qa-endsheet.mjs <dir> <out.png> [--cols 6] [--thumb 320] [--match .png]
// Write a new filename for each review round; some image viewers cache by path.
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { contactSheet } from './lib/sheet.mjs'
import { parseArgs } from './lib/session.mjs'

const { opt, positional } = parseArgs()
const [dir, out] = positional
if (!dir || !out) { console.error('usage: node scripts/qa-endsheet.mjs <dir> <out.png> [--cols 6] [--thumb 320] [--match -]'); process.exit(1) }
const match = opt('match', '.png')
const files = readdirSync(resolve(dir)).filter((f) => f.endsWith('.png') && !f.startsWith('_') && !f.startsWith('contact') && f.includes(match === '-' ? '' : match)).sort()
if (!files.length) { console.error('no pngs in', dir); process.exit(1) }
contactSheet(files.map((f) => resolve(dir, f)), resolve(out), { cols: Number(opt('cols', 6)), thumb: Number(opt('thumb', 320)) })
console.log(`${files.length} frames → ${resolve(out)}`)
