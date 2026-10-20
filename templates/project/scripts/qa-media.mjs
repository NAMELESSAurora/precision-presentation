// Media playback QA, for every video slot that has a file: plays it in the deck and checks the live-presentation rules.
// - metadata loads; never autoplays
// - while playing / paused part-way: progress line, running head and everything marked .over-media are hidden
// - one Next press keeps it playing, a second press within 2.5 s stops it and advances
// - at the natural end the poster comes back
// Usage: node scripts/qa-media.mjs <round>   → qa/<round>/media/*.png + report.json (exit 1 on any failure)
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const round = process.argv[2] || 'round'
const out = resolve('qa', round, 'media')
mkdirSync(out, { recursive: true })
const port = 4700 + Math.floor(Math.random() * 200)
const server = spawn(process.execPath, ['scripts/serve.mjs', '.', '--port', String(port)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 600))
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const report = { round, errors: [], checks: [] }
page.on('pageerror', (e) => report.errors.push(String(e)))
const check = (name, ok, detail) => { report.checks.push({ name, ok: !!ok, detail }); console.log(ok ? 'ok  ' : 'FAIL', name, detail ?? '') }
const query = process.argv.find((a) => a.startsWith('--query='))
await page.goto(`http://127.0.0.1:${port}/index.html${query ? '?' + query.slice(8) : ''}`)
await page.evaluate(() => deck.ready())
const ids = await page.evaluate(() => Object.keys(deck.state().media.video))
const hiddenChrome = () => page.evaluate(() => {
  const slide = document.querySelector('.slide.is-active')
  const els = [document.getElementById('progress'), slide.querySelector(':scope > .head'), ...slide.querySelectorAll('.over-media')].filter(Boolean)
  return els.every((el) => Number(getComputedStyle(el).opacity) === 0)
})

for (const id of ids) {
  const slideId = await page.evaluate((m) => document.querySelector(`[data-media="${m}"]`).closest('.slide').id, id)
  await page.evaluate((s) => deck.goto(s, 0), slideId)
  await page.waitForFunction((m) => ['idle', 'unavailable'].includes(deck.state().media.video[m]), id, { timeout: 15000 }).catch(() => {})
  const st0 = await page.evaluate((m) => deck.state().media.video[m], id)
  if (st0 === 'unavailable') { check(`${id}: no file configured (static fallback)`, true, 'skipped'); continue }
  check(`${id}: metadata loads, never autoplays`, st0 === 'idle', st0)
  await page.screenshot({ path: resolve(out, `${id}-poster.png`) })
  await page.keyboard.press('k')
  await page.waitForFunction((m) => deck.state().media.video[m] === 'playing', id, { timeout: 10000 })
  await page.waitForTimeout(800)
  check(`${id}: while playing, chrome steps back`, await hiddenChrome())
  await page.screenshot({ path: resolve(out, `${id}-playing.png`) })
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  let s = await page.evaluate(() => deck.state())
  check(`${id}: one Next press keeps it playing`, s.media.video[id] === 'playing' && s.step === 0, `${s.media.video[id]} step ${s.step}`)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(900)
  s = await page.evaluate(() => deck.state())
  check(`${id}: second press stops it and advances`, s.media.video[id] === 'ended' && (s.step === 1 || s.slide !== slideId), `${s.media.video[id]} ${s.slide}.${s.step}`)
  await page.evaluate((sl) => deck.goto(sl, 0), slideId)
  await page.evaluate((m) => { const v = document.querySelector(`[data-media="${m}"] video`); v.currentTime = Math.max(0, v.duration - 0.6); return v.play() }, id)
  await page.waitForFunction((m) => deck.state().media.video[m] === 'ended', id, { timeout: 8000 })
  await page.waitForTimeout(700)
  const started = await page.evaluate((m) => document.querySelector(`[data-media="${m}"]`).classList.contains('started'), id)
  check(`${id}: natural end shows the poster again`, !started)
  await page.screenshot({ path: resolve(out, `${id}-end.png`) })
}
check('no page errors', report.errors.length === 0, report.errors)
writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 1))
await browser.close()
server.kill()
process.exit(report.checks.every((c) => c.ok) ? 0 : 1)
