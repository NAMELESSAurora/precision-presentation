// Static QA capture. Usage: node scripts/qa-shots.mjs <round-name> [--root .] [--views 1920x1080,1366x768,1280x720,1024x768]
// Output: qa/<round>/<WxH>/<slide>-<step>.png, qa/<round>/contact-<WxH>.png, qa/<round>/report.json
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const round = args.find((a) => !a.startsWith('--')) || 'round'
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d }
const root = opt('root', '.')
const views = opt('views', '1920x1080,1366x768,1280x720,1024x768').split(',').map((v) => v.split('x').map(Number))
const query = opt('query', '')            // e.g. --query palette=sunset
const only = opt('only', '')              // e.g. --only S01-1,S04-3 (slide-step)
const wanted = only ? new Set(only.split(',')) : null
const port = 4300 + Math.floor(Math.random() * 400)
const out = resolve('qa', round)

const server = spawn(process.execPath, ['scripts/serve.mjs', root, '--port', String(port)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 600))
const base = `http://127.0.0.1:${port}/index.html${query ? '?' + query : ''}`
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
const report = { round, base, console: [], pageErrors: [], requestsFailed: [], checks: [] }

const CHECK = () => {
  const stage = document.getElementById('stage').getBoundingClientRect()
  const scale = stage.width / 1920
  const slide = document.querySelector('.slide.is-active')
  const sel = '.title .line, .statement .line, h1 .line, .sub, p, h3, h4, .label, .callout, .btn, .work, .ask, li, .song, .tag, .mstatus, .mtime'
  const vis = (el) => { const cs = getComputedStyle(el); return cs.visibility === 'visible' && Number(cs.opacity) > 0.05 && el.getClientRects().length && !el.closest('[hidden]') }
  const els = Array.from(slide.querySelectorAll(sel)).filter(vis)
  const box = (el) => { const r = el.getBoundingClientRect(); return { l: (r.left - stage.left) / scale, t: (r.top - stage.top) / scale, r: (r.right - stage.left) / scale, b: (r.bottom - stage.top) / scale } }
  const name = (el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}:"${el.textContent.trim().slice(0, 40)}"`
  const issues = []
  const boxes = els.map((el) => ({ el, b: box(el) }))
  // Second opinion beside scripts/qa-layout.mjs (ink). Bleed / edge are declared, not bugs.
  for (const { el, b } of boxes) if ((b.l < -1 || b.t < -1 || b.r > 1921 || b.b > 1081) && !el.closest('[data-bleed], [data-edge]')) issues.push({ type: 'out-of-stage', el: name(el), box: b })
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const A = boxes[i], B = boxes[j]
    if (A.el.contains(B.el) || B.el.contains(A.el)) continue
    const w = Math.min(A.b.r, B.b.r) - Math.max(A.b.l, B.b.l), h = Math.min(A.b.b, B.b.b) - Math.max(A.b.t, B.b.t)
    if (w > 6 && h > 6) issues.push({ type: 'overlap', a: name(A.el), b: name(B.el), area: Math.round(w * h) })
  }
  // text clipped by its own box (e.g. overflow inside fixed-width containers)
  for (const { el } of boxes) if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') issues.push({ type: 'clipped', el: name(el) })
  return issues
}

for (const [w, h] of views) {
  const dir = resolve(out, `${w}x${h}`)
  mkdirSync(dir, { recursive: true })
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) report.console.push({ view: `${w}x${h}`, type: m.type(), text: m.text() }) })
  page.on('pageerror', (e) => report.pageErrors.push({ view: `${w}x${h}`, text: String(e) }))
  page.on('requestfailed', (r) => report.requestsFailed.push({ url: r.url(), err: r.failure()?.errorText }))
  await page.goto(base)
  await page.evaluate(() => deck.ready())
  const slides = await page.evaluate(() => deck.state().slides)
  const shots = []
  for (const s of slides) {
    const steps = (w === 1920 ? [...Array(s.steps).keys()] : [s.steps - 1]).filter((k) => !wanted || wanted.has(`${s.id}-${k}`))
    for (const k of steps) {
      await page.evaluate(([id, k]) => deck.goto(id, k), [s.id, k])
      await page.evaluate(() => deck.ready())
      const file = `${s.id}-${k}.png`
      if (process.env.QA_VERBOSE) console.log(w, file)
      await page.screenshot({ path: resolve(dir, file) })
      shots.push(file)
      if (k === s.steps - 1 || w === 1920) {
        const issues = await page.evaluate(CHECK)
        if (issues.length) report.checks.push({ view: `${w}x${h}`, slide: s.id, step: k, issues })
      }
    }
  }
  // contact sheet
  const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(6,320px);gap:8px;padding:8px;font:12px monospace;color:#ccc">${shots.map((f) => `<div><img src="${f}" style="width:320px;display:block">${f}</div>`).join('')}</body>`
  writeFileSync(resolve(dir, '_contact.html'), html)
  const sheet = await browser.newPage({ viewport: { width: 6 * 328 + 8, height: 400 } })
  await sheet.goto(pathToFileURL(resolve(dir, '_contact.html')).href)
  await sheet.waitForLoadState('load')
  await sheet.screenshot({ path: resolve(out, `contact-${w}x${h}.png`), fullPage: true })
  await sheet.close()
  await page.close()
}
writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2))
console.log(`console: ${report.console.length}, pageErrors: ${report.pageErrors.length}, failedRequests: ${report.requestsFailed.length}, layout issues: ${report.checks.reduce((n, c) => n + c.issues.length, 0)}`)
await browser.close()
server.kill()
