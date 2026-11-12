// Copy-moved-to-notes ledger.
// When on-slide text is trimmed to make room, record the full line in notes.js `moved`
// so no claim, source tag or credit disappears.
//
//   node scripts/qa-copy-moved.mjs <old.html> <new.html> [out.md] [--notes src/js/notes.js] [--gate]
//   node scripts/qa-copy-moved.mjs --notes src/js/notes.js [out.md]
//
// --gate fails when a slide lost lines and its `moved` list is empty, or a [Rnn] tag
// disappeared from the slide and is not repeated in `moved`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import vm from 'node:vm'
import { diffSections, droppedTags, renderDiff, sectionLines } from './lib/copy-diff.mjs'
import { parseArgs } from './lib/session.mjs'

const { opt, flag, positional } = parseArgs()
const notesPath = opt('notes', '')
const GATE = flag('gate')
if (GATE && positional.length >= 2 && !notesPath) {
  console.error('--gate needs --notes src/js/notes.js')
  process.exit(1)
}

function loadNotes(file) {
  const ctx = { window: {} }
  vm.runInNewContext(readFileSync(file, 'utf8'), ctx)
  return ctx.window.DECK_NOTES || {}
}

let md
const problems = []
if (positional.length >= 2) {
  const before = readFileSync(positional[0], 'utf8')
  const afterHtml = readFileSync(positional[1], 'utf8')
  const rows = diffSections(before, afterHtml)
  const afterLines = sectionLines(afterHtml)
  const notes = notesPath ? loadNotes(notesPath) : null
  md = renderDiff(rows)
  if (notes) {
    md += '\n## Notes field `moved`\n\n'
    for (const row of rows) {
      const moved = notes[row.id]?.moved || []
      if (moved.length) {
        md += `### ${row.id}\n`
        for (const line of moved) md += `- ${line}\n`
        md += '\n'
      }
      if (GATE && row.removed.length && !moved.length) problems.push(`${row.id}: copy left the slide but notes.${row.id}.moved is empty`)
      const missing = droppedTags(row.removed, afterLines.get(row.id) || [], moved)
      for (const tag of missing) problems.push(`${row.id}: source tag ${tag} left the slide and is not in moved`)
    }
  }
} else if (notesPath) {
  const notes = loadNotes(notesPath)
  md = '# Copy moved off the slides\n\nFrom `moved` in the notes file. Spoken cues are not listed here.\n\n'
  for (const [id, s] of Object.entries(notes)) {
    const moved = s.moved || []
    md += `## ${id} (${moved.length})\n`
    for (const line of moved) md += `- ${line}\n`
    if (!moved.length) md += '_Nothing recorded._\n'
    md += '\n'
  }
} else {
  console.error('usage: node scripts/qa-copy-moved.mjs <old.html> <new.html> [out.md] [--notes src/js/notes.js] [--gate]')
  console.error('       node scripts/qa-copy-moved.mjs --notes src/js/notes.js [out.md]')
  process.exit(1)
}

const out = positional.length >= 3 ? positional[2] : (positional.length === 1 && notesPath ? positional[0] : '')
if (out && !out.endsWith('.html')) {
  mkdirSync(dirname(resolve(out)), { recursive: true })
  writeFileSync(resolve(out), md)
  console.log('→', resolve(out))
} else console.log(md)
for (const p of problems) console.error(p)
if (GATE && problems.length) process.exit(1)
