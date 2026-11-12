// Layout & crowding gate. Every slide × every reveal step, in design px, at true 16:9 sizes.
// Usage:
//   node scripts/qa-layout.mjs <out.json> [--views 16:9|1920x1080,1600x900,...] [--static] [--mid]
//     [--only S01,S05] [--root .] [--min-font 18] [--min-gap 24] [--safe 0.05] [--gate]
// --static  PDF / ?mode=static, each slide's final state
// --mid     in-slide steps with animations held at 35% and 70% (text-overlap only)
// --gate    exit 1 unless the flag count is 0
// A 0-flag result is not proof until a planted overlap is flagged once (tests/deck.spec.mjs).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { checkLayout } from './lib/layout-check.mjs'
import { openDeck, parseArgs, parseViews } from './lib/session.mjs'

const { opt, flag, positional } = parseArgs()
const out = resolve(positional[0] || 'qa/layout-report.json')
const views = parseViews(opt('views', '16:9'))
const ONLY = String(opt('only', '') || '').split(',').filter(Boolean)
const STATIC = flag('static')
const MID = flag('mid')
const GATE = flag('gate')
const root = opt('root', '.')
const thresholds = {
  minFont: Number(opt('min-font', 18)),
  minGap: Number(opt('min-gap', 24)),
  safe: Number(opt('safe', 0.05)),
}
const query = opt('query', '')

const session = await openDeck({ root })
const report = {
  generated: new Date().toISOString(),
  mode: STATIC ? 'static' : 'live',
  thresholds,
  views: [],
  flags: [],
  summary: {},
}
try {
  for (const [w, h] of views) {
    const page = await session.browser.newPage({ viewport: { width: w, height: h } })
    const q = [STATIC ? 'mode=static' : '', query].filter(Boolean).join('&')
    await page.goto(session.url(q))
    await page.evaluate(() => deck.ready())
    let slides = await page.evaluate(() => deck.state().slides)
    if (ONLY.length) slides = slides.filter((s) => ONLY.includes(s.id))
    let n = 0
    if (STATIC) {
      for (const s of slides) {
        const r = await page.evaluate(checkLayout, { slideEl: `#${s.id}`, ...thresholds })
        n++
        r.flags.forEach((f) => report.flags.push({ view: `${w}x${h}`, step: 'static', ...f }))
      }
    } else {
      for (const s of slides) {
        for (let k = 0; k < s.steps; k++) {
          await page.evaluate(([id, step]) => deck.goto(id, step), [s.id, k])
          await page.evaluate(() => deck.ready())
          const r = await page.evaluate(checkLayout, { ...thresholds })
          n++
          r.flags.forEach((f) => report.flags.push({ view: `${w}x${h}`, step: k, ...f }))
          if (MID && k > 0) {
            for (const frac of [0.35, 0.7]) {
              await page.evaluate(([id, step]) => { deck.finish(); deck.goto(id, step) }, [s.id, k - 1])
              await page.evaluate(() => deck.ready())
              const end = await page.evaluate(() => {
                deck.next()
                const all = document.getAnimations()
                all.forEach((a) => a.pause())
                return Math.max(0, ...all.map((a) => a.effect.getComputedTiming().endTime))
              })
              const advanced = await page.evaluate((t) => {
                const a = document.getAnimations()[0]
                if (!a) return true
                const before = a.currentTime
                try { a.currentTime = t } catch (e) { return false }
                return a.currentTime !== before
              }, Math.max(1, end * frac))
              if (!advanced && end > 0) throw new Error(`mid-step seek did not advance time on ${s.id} step ${k}`)
              await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
              const mid = await page.evaluate(checkLayout, { ...thresholds, mid: true })
              n++
              mid.flags.filter((f) => f.type === 'text-overlap').forEach((f) => report.flags.push({ view: `${w}x${h}`, step: `${k}@${Math.round(frac * 100)}%`, ...f }))
              await page.evaluate(() => { document.getAnimations().forEach((a) => { try { a.finish() } catch (e) { a.cancel() } }); deck.finish() })
            }
          }
        }
      }
    }
    report.views.push({ view: `${w}x${h}`, states: n })
    await page.close()
  }
} finally {
  await session.close()
}

const by = {}
for (const f of report.flags) by[f.type] = (by[f.type] || 0) + 1
const uniq = new Set(report.flags.map((f) => [f.type, f.slide, f.step, f.a || f.text || f.el, f.b || f.media || ''].join('|')))
report.summary = { total: report.flags.length, uniqueAcrossViews: uniq.size, byType: by, gate: GATE ? report.flags.length === 0 : null }
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(report, null, 1))
console.log(JSON.stringify(report.summary), '→', out)
if (report.flags.length) {
  for (const f of report.flags.slice(0, 40)) console.log(`  ${f.view} ${f.slide} step ${f.step} ${f.type} ${f.a || f.text || f.el || ''} ${f.b || f.media || ''}`)
  if (report.flags.length > 40) console.log(`  … ${report.flags.length - 40} more`)
}
if (GATE && report.flags.length) process.exit(1)
