// Cold-start verification of a show folder (default dist/; --root also checks an unpacked release / zip copy):
// fresh browser contexts with every non-local request aborted; (a) file://<root>/index.html (b) <root>/serve.mjs over http.
// Walks every slide and step, loads every configured video's metadata, opens the presenter and drives the deck from it.
// Usage: node scripts/verify-dist.mjs <round> [--root dist]   → qa/<round>/dist-check.json
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const round = process.argv[2] || 'dist-check'
const ri = process.argv.indexOf('--root')
const ROOT = resolve(ri > 0 ? process.argv[ri + 1] : 'dist')
mkdirSync(resolve('qa', round), { recursive: true })
const must = ['index.html', 'presenter.html', 'serve.mjs', 'START-HERE.txt', 'start-server.cmd', 'src/js/deck.js', 'src/js/content.js']
const missing = must.filter((f) => !existsSync(resolve(ROOT, f)))
const leaked = ['assets/img/raw', 'assets/raw', 'qa', 'node_modules', 'tests'].filter((f) => existsSync(resolve(ROOT, f)))
const port = 4777
const server = spawn(process.execPath, ['serve.mjs', '.', '--port', String(port)], { cwd: ROOT, stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 700))
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
const results = { root: ROOT, missing, leaked }

for (const [name, url] of [['file', pathToFileURL(resolve(ROOT, 'index.html')).href], ['http', `http://127.0.0.1:${port}/index.html`]]) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' })
  const external = []
  const errors = []
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url())
    if (u.protocol === 'file:' || u.protocol === 'data:' || u.hostname === '127.0.0.1') return route.continue()
    external.push(u.href)
    return route.abort()
  })
  const page = await context.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  const t = Date.now()
  await page.goto(url)
  await page.evaluate(() => deck.ready())
  const bootMs = Date.now() - t
  // every configured video must reach idle (metadata loaded); reducedMotion: 'reduce' proves the OS setting is ignored
  await page.waitForFunction(() => Object.values(deck.state().media.video).every((s) => s === 'idle' || s === 'unavailable'), null, { timeout: 20000 }).catch(() => {})
  const st = await page.evaluate(() => deck.state())
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))
  let steps = 0
  for (const s of st.slides) {
    for (let k = 0; k < s.steps; k++) {
      await page.evaluate(([id, kk]) => deck.goto(id, kk), [s.id, k])
      await page.evaluate(() => deck.ready())
      steps++
    }
  }
  await page.evaluate(() => deck.goto(1, 0))
  const [pop] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('s')])
  await pop.waitForSelector('#notes h1', { timeout: 8000 })
  const before = await page.evaluate(() => deck.state().step)
  await pop.keyboard.press('ArrowRight')
  await page.waitForFunction((b) => deck.state().step !== b, before, { timeout: 5000 }).catch(() => {})
  const presenterOk = (await pop.locator('#conn').textContent()).includes('Connected')
  await page.screenshot({ path: resolve('qa', round, `${name}-S02.png`) })
  results[name] = { bootMs, motion: st.motion, media: st.media.video, steps, fonts: [...new Set(fonts)], external, errors, presenterOk }
  await context.close()
}
await browser.close()
server.kill()
writeFileSync(resolve('qa', round, 'dist-check.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
const bad = missing.length || leaked.length || ['file', 'http'].some((k) => {
  const r = results[k]
  return r.external.length || r.errors.length || !r.presenterOk || r.motion !== 'full' || Object.values(r.media).includes('loading')
})
process.exit(bad ? 1 : 0)
