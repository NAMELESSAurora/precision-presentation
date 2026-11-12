// One-press filmstrip. Usage: node scripts/qa-strip.mjs <slide> <step> <out.png> <timesMs> [--cols 4] [--thumb 480]
// Example: node scripts/qa-strip.mjs S02 0 qa/strip-s02.png 0,150,300,500,700
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { filmstrip } from './lib/sheet.mjs'
import { openDeck, parseArgs } from './lib/session.mjs'

const { opt, positional } = parseArgs()
const [id, k, outFile, times] = positional
if (!id || k == null || !outFile || !times) {
  console.error('usage: node scripts/qa-strip.mjs <slide> <step> <out.png> <0,150,300> [--cols 4]')
  process.exit(1)
}
const session = await openDeck({ root: opt('root', '.') })
const dir = mkdtempSync(join(tmpdir(), 'strip-'))
try {
  const page = await session.browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(session.url())
  await page.evaluate(() => deck.ready())
  await page.evaluate(([i, step]) => { deck.finish(); deck.goto(i, +step) }, [id, k])
  await page.evaluate(() => deck.ready())
  const info = await page.evaluate(() => {
    const was = `${deck.state().slide}.${deck.state().step}`
    deck.next()
    document.getAnimations().forEach((a) => a.pause())
    return { was, now: `${deck.state().slide}.${deck.state().step}`, n: document.getAnimations().length }
  })
  if (info.was === info.now) throw new Error(`Next did not leave ${info.was}`)
  const frames = []
  for (const t of times.split(',')) {
    const advanced = await page.evaluate((time) => {
      const a = document.getAnimations()[0]
      const before = a ? a.currentTime : null
      document.getAnimations().forEach((anim) => { try { anim.currentTime = +time } catch (e) {} })
      const after = a ? a.currentTime : null
      return !a || after !== before || Number(time) === 0
    }, t)
    if (!advanced) throw new Error(`seek to ${t} ms did not advance currentTime`)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const file = join(dir, `f${String(t).padStart(6, '0')}.png`)
    await page.screenshot({ path: file })
    frames.push({ file, ms: Number(t) })
  }
  await page.close()
  filmstrip(frames, resolve(outFile), { cols: Number(opt('cols', 4)), thumb: Number(opt('thumb', 480)) })
  console.log(`${info.was} > ${info.now} (${info.n} animations) → ${resolve(outFile)}`)
} finally {
  await session.close()
  rmSync(dir, { recursive: true, force: true })
}
