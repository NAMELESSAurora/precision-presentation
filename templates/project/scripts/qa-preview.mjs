// Numbered preview batch for a stakeholder. Copies contact sheets (and optional stills)
// into qa/preview/batch-N/ under a new filename so a cached viewer cannot show the previous round.
// Usage: node scripts/qa-preview.mjs <N> [--from <round>] [--note "what changed"]
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { parseArgs } from './lib/session.mjs'

const { opt, positional } = parseArgs()
const n = positional[0]
if (!n) { console.error('usage: node scripts/qa-preview.mjs <N> [--from <round>] [--note "..."]'); process.exit(1) }
const dir = resolve('qa', 'preview', `batch-${n}`)
mkdirSync(dir, { recursive: true })
const copied = []
const from = opt('from', '')
if (from) {
  const src = resolve('qa', from)
  for (const name of readdirSync(src)) {
    if (!/^contact-.*\.png$/.test(name) && !/^.*\.png$/.test(name)) continue
    if (name.startsWith('_')) continue
    const destName = `batch-${n}-${name}`
    copyFileSync(resolve(src, name), resolve(dir, destName))
    copied.push(destName)
  }
}
const note = opt('note', '')
const md = `# Preview batch ${n}

${note ? note + '\n\n' : ''}Look at the images, not at a description of them. Say what to change in a sentence; that sentence becomes a row in \`design/decisions.md\` (\`self_selected\` if the agent picked, \`user_selected\` if you picked — do not mix the words).

Eye checklist:
- Neighbouring slides should not be the same composition with the words swapped.
- Photos stay legible, in natural colour. No halftone, dot mask, or veil.
- Type is large enough for a projector. Nothing important sits on the edge.
- Motion, when this batch includes a filmstrip: elements continue across the cut.

${copied.length ? 'Files:\n\n' + copied.map((f) => `- \`${f}\``).join('\n') + '\n' : '_No stills copied. Pass `--from <round>` after `qa-shots`, or drop PNGs in this folder._\n'}
`
writeFileSync(resolve(dir, 'README.md'), md)
console.log(dir, copied.length ? `(${copied.length} files)` : '(index only)')
