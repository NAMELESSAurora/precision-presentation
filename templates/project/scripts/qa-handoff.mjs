// Slide-transition overlap. At every boundary, seek the running animations at 60 fps and
// flag old text sitting on new text (both at least 30% visible, clipped by masks and clip-path).
// Usage: node scripts/qa-handoff.mjs <out.json> [--size 1920x1080] [--gate] [--root .]
// --gate exits 1 when any boundary has an overlap. Decks that fade the whole old slide
// can still overlap; the hand-off rule (per-element exit, ~200 ms overlap, old type gone
// before new type arrives) is what this gate is for. See design/motion-spec.md.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { openDeck, parseArgs } from './lib/session.mjs'

const { opt, flag, positional } = parseArgs()
const out = resolve(positional[0] || 'qa/handoff.json')
const [W, H] = String(opt('size', '1920x1080')).split('x').map(Number)
const GATE = flag('gate')
const ONLY = String(opt('only', '') || '').split(',').filter(Boolean)

const BOXES = () => {
  const stage = document.getElementById('stage')
  const r0 = stage.getBoundingClientRect()
  const K = r0.width / 1920 || 1
  const fontK = (stage.offsetWidth || r0.width) / 1920 || 1
  const res = { leaving: [], active: [] }
  for (const side of ['leaving', 'active']) {
    const root = document.querySelector(side === 'leaving' ? '.slide.is-leaving' : '.slide.is-active')
    if (!root) continue
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    while (w.nextNode()) {
      const n = w.currentNode
      if (!n.nodeValue.trim()) continue
      const el = n.parentElement
      if (!el || el.closest('.head, [data-furniture], svg, script, style, .sr-only')) continue
      let o = 1
      for (let e = el; e && e !== stage; e = e.parentElement) {
        const cs = getComputedStyle(e)
        if (cs.visibility === 'hidden' || cs.display === 'none') { o = 0; break }
        o *= Number(cs.opacity) || 0
      }
      if (o < 0.3) continue
      const rg = document.createRange()
      rg.selectNodeContents(n)
      for (const rc of rg.getClientRects()) {
        if (rc.width < 2 || rc.height < 2) continue
        let b = { l: rc.left, t: rc.top, r: rc.right, b: rc.bottom }
        const inMask = !!el.closest('.w')
        for (let e = el; e && e !== root; e = e.parentElement) {
          const cs = getComputedStyle(e)
          const m = /^inset\((.*)\)$/.exec(cs.clipPath || '')
          if (m) {
            const q = e.getBoundingClientRect()
            const raw = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/)
            const P = raw.length === 1 ? [raw[0], raw[0], raw[0], raw[0]]
              : raw.length === 2 ? [raw[0], raw[1], raw[0], raw[1]]
              : raw.length === 3 ? [raw[0], raw[1], raw[2], raw[1]]
              : raw
            const f = (s, dim) => (s.endsWith('%') ? (parseFloat(s) / 100) * dim : (parseFloat(s) || 0) * (K / fontK))
            b = {
              l: Math.max(b.l, q.left + f(P[3], q.width)),
              t: Math.max(b.t, q.top + f(P[0], q.height)),
              r: Math.min(b.r, q.right - f(P[1], q.width)),
              b: Math.min(b.b, q.bottom - f(P[2], q.height)),
            }
          }
          if (/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
            const q = e.getBoundingClientRect()
            b = { l: Math.max(b.l, q.left), t: Math.max(b.t, q.top), r: Math.min(b.r, q.right), b: Math.min(b.b, q.bottom) }
          }
        }
        if (inMask) b.t += (parseFloat(getComputedStyle(el).fontSize) || 20) * 0.22
        if (b.r - b.l < 2 || b.b - b.t < 2) continue
        const lh = ((parseFloat(getComputedStyle(el).lineHeight) || 20) / fontK) * K * 0.9
        if (b.b - b.t > lh) { const s = (b.b - b.t - lh) / 2; b.t += s; b.b -= s }
        res[side].push({
          box: [b.l, b.t, b.r, b.b].map((v) => Math.round(v / K)),
          o: Math.round(o * 100) / 100,
          text: n.nodeValue.trim().slice(0, 28),
        })
      }
    }
  }
  return res
}

const session = await openDeck({ root: opt('root', '.') })
const report = []
try {
  const page = await session.browser.newPage({ viewport: { width: W, height: H } })
  await page.goto(session.url(opt('query', '')))
  await page.evaluate(() => deck.ready())
  const slides = (await page.evaluate(() => deck.state())).slides
  for (let i = 0; i < slides.length - 1; i++) {
    const s = slides[i]
    if (ONLY.length && !ONLY.includes(s.id) && !ONLY.includes(slides[i + 1].id)) continue
    await page.evaluate(([id, k]) => { deck.finish(); deck.goto(id, k) }, [s.id, s.steps - 1])
    await page.evaluate(() => deck.ready())
    const end = await page.evaluate(() => {
      const was = deck.state().slide
      deck.next()
      const all = document.getAnimations()
      all.forEach((a) => { try { a.pause() } catch (e) {} })
      const now = deck.state().slide
      return { end: Math.max(0, ...all.map((a) => a.effect.getComputedTiming().endTime || 0)), moved: was !== now, count: all.length }
    })
    if (!end.moved) throw new Error(`${s.id}: Next did not change slides (a video confirm, or finish-first). Handoff labels would be wrong.`)
    let sought = false
    const hits = new Map()
    let worst = 0
    const dt = 1000 / 60
    for (let t = 0; t <= end.end + dt; t += dt) {
      const stamp = await page.evaluate((time) => {
        const all = document.getAnimations()
        const before = all[0] ? all[0].currentTime : null
        all.forEach((a) => { try { a.currentTime = time } catch (e) {} })
        const after = all[0] ? all[0].currentTime : null
        return { before, after, n: all.length }
      }, Math.min(t, end.end + 1))
      if (!sought && t > 0 && stamp.n) {
        if (!(stamp.after > stamp.before)) throw new Error(`${s.id}: currentTime did not advance (${stamp.before} → ${stamp.after}). The overlap check would be vacuous.`)
        sought = true
      }
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const { leaving, active } = await page.evaluate(BOXES)
      for (const A of leaving) for (const B of active) {
        const w = Math.min(A.box[2], B.box[2]) - Math.max(A.box[0], B.box[0])
        const h = Math.min(A.box[3], B.box[3]) - Math.max(A.box[1], B.box[1])
        if (w > 4 && h > 4) {
          const k = A.text + ' | ' + B.text
          const e = hits.get(k) || { old: A.text, new: B.text, frames: 0, firstMs: Math.round(t), w: Math.round(w), h: Math.round(h) }
          e.frames++
          e.lastMs = Math.round(t)
          hits.set(k, e)
          worst = Math.max(worst, Math.min(A.o, B.o))
        }
      }
    }
    await page.evaluate(() => { document.getAnimations().forEach((a) => { try { a.finish() } catch (e) { a.cancel() } }); deck.finish() })
    await page.evaluate(() => deck.ready())
    const row = { from: s.id, to: slides[i + 1].id, endMs: Math.round(end.end), animations: end.count, overlaps: [...hits.values()], worstVisibleOpacity: Math.round(worst * 100) / 100 }
    report.push(row)
    process.stdout.write(`${row.from}>${row.to} ${row.endMs}ms overlaps:${row.overlaps.length}\n`)
  }
  await page.close()
} finally {
  await session.close()
}

const total = report.reduce((n, r) => n + r.overlaps.length, 0)
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ generated: new Date().toISOString(), size: `${W}x${H}`, overlaps: total, report }, null, 1))
console.log(JSON.stringify({ boundaries: report.length, overlaps: total }), '→', out)
if (GATE && total) process.exit(1)
