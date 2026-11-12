// Type-size census at 1920×1080 (projector legibility).
// Reading text must be >= --min (default 22). Nothing on a slide may be under --floor (default 18):
// labels, tags and credits may sit at the floor, in uppercase-tracked or sentence case, and no smaller.
// Usage: node scripts/qa-type.mjs [out.json] [--min 22] [--floor 18] [--gate] [--root .]
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { openDeck, parseArgs } from './lib/session.mjs'

const { opt, flag, positional } = parseArgs()
const out = positional[0] ? resolve(positional[0]) : ''
const min = Number(opt('min', 22))
const floor = Number(opt('floor', 18))
const GATE = flag('gate')
const session = await openDeck({ root: opt('root', '.') })
let rows = []
try {
  const page = await session.browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(session.url('mode=static'))
  await page.evaluate(() => deck.ready())
  rows = await page.evaluate(() => {
    const stage = document.getElementById('stage')
    const fontK = (stage && stage.offsetWidth ? stage.offsetWidth : 1920) / 1920 || 1
    const meta = '.label, .tag, .credit, .credit-line, .caption, figcaption, .cap, .head, .mtime, .mstatus, .winbar, .btn, .foot, .callout, [data-meta]'
    const res = []
    document.querySelectorAll('section.slide').forEach((s) => {
      const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT)
      while (w.nextNode()) {
        const n = w.currentNode
        if (!n.nodeValue.trim()) continue
        const el = n.parentElement
        if (!el || el.closest('.sr-only, script, style, svg')) continue
        let hidden = false
        for (let e = el; e && e !== s.parentElement; e = e.parentElement) {
          const c = getComputedStyle(e)
          if (c.visibility === 'hidden' || c.display === 'none' || Number(c.opacity) === 0) hidden = true
        }
        if (hidden) continue
        const fs = Math.round((parseFloat(getComputedStyle(el).fontSize) || 0) / fontK * 10) / 10
        const kind = el.closest(meta) ? 'meta' : 'body'
        const cls = (el.className && el.className.baseVal === undefined && String(el.className).trim()) || el.tagName.toLowerCase()
        res.push({ slide: s.id, fs, kind, cls: cls.slice(0, 32), text: n.nodeValue.trim().slice(0, 40) })
      }
    })
    return res
  })
  await page.close()
} finally {
  await session.close()
}

const belowFloor = rows.filter((r) => r.fs < floor - 0.01)
const bodySmall = rows.filter((r) => r.kind === 'body' && r.fs < min - 0.01)
const hist = {}
for (const r of rows) if (r.kind === 'body') hist[r.slide] = Math.min(hist[r.slide] ?? 999, r.fs)
const summary = { runs: rows.length, min, floor, belowFloor: belowFloor.length, bodyBelowMin: bodySmall.length, smallestBodyBySlide: hist }
console.log(JSON.stringify(summary))
for (const r of [...belowFloor, ...bodySmall].slice(0, 40)) console.log(`  ${r.slide} ${r.kind} ${r.fs}px ${r.cls} "${r.text}"`)
if (out) {
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify({ ...summary, rows }, null, 1))
  console.log('→', out)
}
if (GATE && (belowFloor.length || bodySmall.length)) process.exit(1)
