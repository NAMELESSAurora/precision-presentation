// Motion QA: records a real run through the whole deck with Next presses (1280×720 video) and cuts a filmstrip
// (10 frames, 100 ms apart) after every press. Read the strips: is the eye led? any jump, flash, residue, blank frame?
// Usage: node scripts/qa-motion.mjs <round> [--from S03] [--to S05] [--query=palette=x]  → qa/<round>/motion/
import { chromium } from '@playwright/test'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const round = args.find((a) => !a.startsWith('--')) || 'round'
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : null }
const query = (args.find((a) => a.startsWith('--query=')) || '').slice(8)
const dir = resolve('qa', round, 'motion')
mkdirSync(dir, { recursive: true })
const port = 4800 + Math.floor(Math.random() * 100)
const server = spawn(process.execPath, ['scripts/serve.mjs', '.', '--port', String(port)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 600))
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir, size: { width: 1280, height: 720 } } })
const page = await context.newPage()
const t0 = Date.now() // the recording starts with the page
await page.goto(`http://127.0.0.1:${port}/index.html${query ? '?' + query : ''}`)
await page.evaluate(() => deck.ready())
const all = await page.evaluate(() => deck.state().slides.map((s) => s.id))
const from = opt('from') || all[0]
const to = opt('to') || all[all.length - 1]
await page.evaluate((s) => deck.goto(s, 0), from)
await page.waitForTimeout(500)
const events = []
for (let guard = 0; guard < 400; guard++) {
  const s = await page.evaluate(() => deck.state())
  if (s.slide === to && s.step === s.steps - 1) break
  if (Object.values(s.media.video).includes('playing')) await page.keyboard.press('ArrowRight') // first press only warns
  const name = s.step === s.steps - 1 ? `${s.slide}-to-next` : `${s.slide}-step${s.step + 1}`
  events.push({ name, t: (Date.now() - t0) / 1000 })
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1300)
}
events.push({ name: 'rapid-5x', t: (Date.now() - t0) / 1000 })
await page.evaluate((s) => deck.goto(s, 0), from)
for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight', { delay: 40 })
await page.waitForTimeout(1300)
events.push({ name: 'prev-instant', t: (Date.now() - t0) / 1000 })
await page.mouse.click(640, 360, { button: 'right' })
await page.waitForTimeout(800)
await context.close()
const vid = readdirSync(dir).find((f) => f.endsWith('.webm') && !f.startsWith('run'))
renameSync(resolve(dir, vid), resolve(dir, 'run.webm'))
writeFileSync(resolve(dir, 'events.json'), JSON.stringify(events, null, 2))
for (const e of events) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(Math.max(0, e.t - 0.05)), '-i', resolve(dir, 'run.webm'),
    '-vf', 'fps=10,scale=480:-1,tile=5x2', '-frames:v', '1', resolve(dir, `strip-${e.name}.png`)])
}
console.log(`events: ${events.length} → ${dir}`)
await browser.close()
server.kill()
