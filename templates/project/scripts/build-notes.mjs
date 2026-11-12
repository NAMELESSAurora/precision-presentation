// Generate speaker-notes.md from src/js/notes.js (single source of truth).
import { readFileSync, writeFileSync } from 'node:fs'
import vm from 'node:vm'

const ctx = { window: {} }
vm.runInNewContext(readFileSync('src/js/notes.js', 'utf8'), ctx)
vm.runInNewContext(readFileSync('src/js/content.js', 'utf8'), ctx)
const N = ctx.window.DECK_NOTES
const C = ctx.window.DECK_CONTENT
const total = Object.values(C.slides).reduce((n, s) => n + (s.seconds || 0), 0)
const short = Object.values(C.slides).reduce((n, s) => n + (s.optional ? 0 : s.seconds || 0), 0)
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const words = (s) => (String(s).match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g) || []).length
const spoken = Object.values(N).reduce((n, s) => n + (s.cues || []).reduce((m, c) => m + words(c), 0), 0)
let md = `# Speaker notes — ${C.title}\n\n> Generated from \`src/js/notes.js\` (\`node scripts/build-notes.mjs\`); edit that file, not this one.\n`
md += '> These notes appear only in the presenter window (S), never on the audience screen.\n'
md += `> Planned body: ${mmss(total)} (short path ${mmss(short)}). Lines marked [待确认] / [TO CONFIRM] must be confirmed by the presenter.\n`
md += `> Spoken words, counted from cues only: ${spoken}. Text in \`moved\` is not spoken and is not included.\n\n`
for (const [id, s] of Object.entries(N)) {
  const cfg = C.slides[id] || {}
  md += `## ${id}${cfg.optional ? ' (optional on the short path)' : ''} · ${s.seconds ? s.seconds + ' s' : 'not read aloud'}\n\n**Goal:** ${s.goal}\n\n`
  s.cues.forEach((c, i) => { md += `${i + 1}. (step ${i}) ${c}\n` })
  if (s.bridge) md += `\n**Bridge:** ${s.bridge}\n`
  if (Array.isArray(s.moved) && s.moved.length) {
    md += '\n**Moved off the slide:**\n'
    s.moved.forEach((line) => { md += `- ${line}\n` })
  }
  md += `\n**Sources:** ${s.sources || '—'}  \n**Limits:** ${s.limits || '—'}\n\n`
}
writeFileSync('speaker-notes.md', md)
console.log('speaker-notes.md written')
