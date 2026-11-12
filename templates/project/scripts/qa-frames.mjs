// Deterministic frames for one Next press. Pauses every Web Animation and seeks
// t = 0, 16.7, 33.3 … ms, then writes frames, a filmstrip, motion.mp4 and metrics.json.
// Usage: node scripts/qa-frames.mjs <out> S01.0 S02.3 [--size 960x540]
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { filmstrip } from './lib/sheet.mjs'
import { openDeck, parseArgs } from './lib/session.mjs'
import { TV_RANGE_ARGS, assertVideo } from './lib/probe-video.mjs'
import { execFileSync } from 'node:child_process'

const { opt, positional } = parseArgs()
const [out, ...cases] = positional
if (!out || !cases.length) { console.error('usage: node scripts/qa-frames.mjs <out> S01.0 S02.3 [--size 960x540]'); process.exit(1) }
const [W, H] = String(opt('size', '960x540')).split('x').map(Number)
const session = await openDeck({ root: opt('root', '.') })
try {
  const page = await session.browser.newPage({ viewport: { width: W, height: H } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(session.url(opt('query', '')))
  await page.evaluate(() => deck.ready())
  for (const c of cases) {
    const [id, k] = c.split('.')
    const dir = resolve(out, c.replace('.', '-step'))
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(resolve(dir, 'frames'), { recursive: true })
    await page.evaluate(([i, s]) => { deck.finish(); deck.goto(i, Number(s)) }, [id, k])
    await page.evaluate(() => deck.ready())
    const info = await page.evaluate(() => {
      const was = `${deck.state().slide}.${deck.state().step}`
      deck.next()
      const all = document.getAnimations()
      window.__animated = all.map((a) => a.effect && a.effect.target)
      all.forEach((a) => a.pause())
      const end = Math.max(0, ...all.map((a) => a.effect.getComputedTiming().endTime || 0))
      return { count: all.length, end, was, now: `${deck.state().slide}.${deck.state().step}` }
    })
    if (info.was === info.now) throw new Error(`${c}: Next did not change state`)
    const dt = 1000 / 60
    const n = Math.max(2, Math.ceil(info.end / dt) + 2)
    const boxes = () => page.evaluate(() => {
      const animated = new Set(window.__animated || [])
      return Array.from(document.querySelectorAll('.slide.is-active *')).map((e) => {
        for (let node = e; node && node.nodeType === 1; node = node.parentElement) if (animated.has(node)) return ''
        return [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight].join(',')
      })
    })
    let base = null
    const shifted = new Set()
    for (let f = 0; f < n; f++) {
      const t = Math.min(f * dt, info.end + 1)
      const stamp = await page.evaluate((time) => {
        const a = document.getAnimations()[0]
        const before = a ? a.currentTime : null
        document.getAnimations().forEach((anim) => { try { anim.currentTime = time } catch (e) {} })
        return { before, after: a ? a.currentTime : null, n: document.getAnimations().length }
      }, t)
      if (f === 1 && stamp.n && !(stamp.after > stamp.before)) throw new Error(`${c}: seek did not advance currentTime`)
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      const b = await boxes()
      if (!base) base = b
      else b.forEach((v, i) => { if (base[i] && v && v !== base[i]) shifted.add(i) })
      await page.screenshot({ path: resolve(dir, 'frames', `f${String(f).padStart(4, '0')}.png`) })
    }
    const files = readdirSync(resolve(dir, 'frames')).filter((x) => x.endsWith('.png')).sort()
    const pickN = Math.min(12, files.length)
    const pick = Array.from({ length: pickN }, (_, i) => files[Math.round((i * (files.length - 1)) / Math.max(1, pickN - 1))])
    filmstrip(pick.map((f) => ({ file: resolve(dir, 'frames', f), ms: Math.round(Number(f.slice(1, 5)) * dt) })), resolve(dir, 'strip.png'), { cols: 4, thumb: 480, dt })
    const mp4 = resolve(dir, 'motion.mp4')
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '60', '-i', resolve(dir, 'frames', 'f%04d.png'), '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart', ...TV_RANGE_ARGS, mp4])
    const proof = assertVideo(mp4, { fps: 60 })
    if (proof.errors.length) throw new Error(`${c} video: ${proof.errors.join('; ')}`)
    const names = await page.evaluate(() => Array.from(document.querySelectorAll('.slide.is-active *')).map((e) => e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).replace(/ /g, '.')))
    const metrics = {
      case: c, from: info.was, to: info.now, animations: info.count, endMs: Math.round(info.end), frames: n,
      layoutShiftElements: shifted.size, shiftedNodes: [...shifted].map((i) => names[i]).slice(0, 8),
      video: { pix_fmt: proof.stream.pix_fmt, color_range: proof.stream.color_range || '', codec: proof.stream.codec_name },
    }
    writeFileSync(resolve(dir, 'metrics.json'), JSON.stringify(metrics, null, 2))
    console.log(JSON.stringify(metrics))
    await page.evaluate(() => deck.finish())
  }
  if (errors.length) console.log('page errors:', errors.join(' | '))
  await page.close()
} finally {
  await session.close()
}
