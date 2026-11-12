// Next-press motion run. Seeks every Web Animation at 60 fps (virtual time, deterministic)
// and looks for snaps, pops, and the overlap between the old slide leaving and the new one entering.
//
//   snap  an element moves or resizes by > --snap px in one frame and > 3× its neighbour frames
//   pop   invisible → visible (> 0.6 opacity) in one frame, with nothing animating it
//   travel (only with --reduced) position changes by more than 4 px; reduced motion is fades only
//
// Usage:
//   node scripts/qa-run.mjs <out> [--size 1920x1080] [--hold 450] [--only S01,S02]
//     [--rep auto|S01.1>,S02.0>] [--no-video] [--reduced] [--gate] [--overlap 150:250] [--keep-frames]
//
// --gate fails on snaps, pops, or (with --reduced) travel. Overlap is reported always and
// fails only when --overlap min:max is set (the hand-off target is 150:250).
// --only jumps to the press it records and checks the deck is on that state. A full run is the evidence.
// Encode is real frames: yuv420p, tv range, then ffprobe + a full decode. The frame folder is removed after.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { TV_RANGE_ARGS, assertVideo } from './lib/probe-video.mjs'
import { openDeck, parseArgs } from './lib/session.mjs'

const { opt, flag, positional } = parseArgs()
const out = resolve(positional[0] || 'qa/motion-run')
const HOLD = Number(opt('hold', 450))
const [W, H] = String(opt('size', '1920x1080')).split('x').map(Number)
const ONLY = String(opt('only', '') || '').split(',').filter(Boolean)
const NOVIDEO = flag('no-video')
const REDUCED = flag('reduced')
const GATE = flag('gate')
const KEEP = flag('keep-frames')
const SNAP = Number(opt('snap', 14))
const overlapArg = opt('overlap', '')
const overlapGate = overlapArg
  ? { min: Number(overlapArg.split(':')[0]), max: Number(overlapArg.split(':')[1]) }
  : null
const dt = 1000 / 60

const SAMPLE = () => {
  const stage = document.getElementById('stage')
  const r0 = stage.getBoundingClientRect()
  const K = r0.width / 1920 || 1
  const roots = [...document.querySelectorAll('.slide.is-active, .slide.is-leaving')]
  const clones = [...stage.children].filter((c) => c.tagName !== 'SECTION' && c.id !== 'flood' && c.id !== 'progress' && getComputedStyle(c).position === 'absolute' && (c.hasAttribute('data-shared-clone') || c.dataset.sharedClone != null))
  const nodes = []
  for (const root of [...roots, ...clones]) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    while (w.nextNode()) {
      const el = w.currentNode
      const tn = el.tagName
      if (/^(SCRIPT|STYLE|SVG|PATH|G|TEXT|CIRCLE|LINE|DEFS|CLIPPATH)$/.test(tn)) continue
      let take = /^(IMG|VIDEO|CANVAS)$/.test(tn)
      if (!take) for (const c of el.childNodes) if (c.nodeType === 3 && c.nodeValue.trim()) { take = true; break }
      if (!take && el.matches && el.matches('i, figure, [data-shape]')) take = true
      if (take) nodes.push(el)
    }
  }
  const out = []
  for (const el of nodes) {
    if (el.__q === undefined) el.__q = (window.__qn = (window.__qn || 0) + 1)
    let o = 1
    let vis = true
    for (let n = el; n && n !== stage.parentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.visibility === 'hidden' || cs.display === 'none') { vis = false; break }
      o *= Number(cs.opacity) || 0
    }
    const r = el.getBoundingClientRect()
    out.push([
      el.__q,
      Math.round((r.left - r0.left) / K * 10) / 10,
      Math.round((r.top - r0.top) / K * 10) / 10,
      Math.round(r.width / K * 10) / 10,
      Math.round(r.height / K * 10) / 10,
      vis ? Math.round(o * 100) / 100 : 0,
    ])
  }
  return out
}

const NAMES = () => {
  const m = {}
  document.querySelectorAll('*').forEach((e) => {
    if (e.__q === undefined) return
    const cls = e.className && e.className.baseVal === undefined ? String(e.className).trim().replace(/\s+/g, '.') : ''
    m[e.__q] = e.tagName.toLowerCase() + (cls ? '.' + cls : '') + ':' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 18)
  })
  return m
}

mkdirSync(out, { recursive: true })
const fdir = resolve(out, 'frames')
if (!NOVIDEO) { rmSync(fdir, { recursive: true, force: true }); mkdirSync(fdir, { recursive: true }) }

const session = await openDeck({ root: opt('root', '.') })
const errors = []
const analysis = { generated: new Date().toISOString(), size: `${W}x${H}`, fps: 60, reduced: REDUCED, presses: [] }
const timeline = []
let frameNo = 0
const names = {}

try {
  const page = await session.browser.newPage({ viewport: { width: W, height: H } })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  const q = [REDUCED ? 'motion=reduced' : '', opt('query', '')].filter(Boolean).join('&')
  await page.goto(session.url(q))
  await page.evaluate(() => deck.ready())
  const state0 = await page.evaluate(() => deck.state())
  const seq = []
  for (const s of state0.slides) for (let k = 0; k < s.steps; k++) seq.push({ id: s.id, step: k, key: `${s.id}.${k}` })

  const wanted = (i) => {
    if (!ONLY.length) return true
    const a = seq[i], b = seq[i + 1]
    return ONLY.includes(a.id) || ONLY.includes(b.id) || ONLY.includes(a.key) || ONLY.includes(b.key)
  }

  async function snapHold() {
    if (NOVIDEO) { const id = frameNo++; return id }
    const file = resolve(fdir, `f${String(frameNo).padStart(6, '0')}.jpg`)
    await page.screenshot({ path: file, type: 'jpeg', quality: 90 })
    return frameNo++
  }

  const start = await page.evaluate(() => `${deck.state().slide}.${deck.state().step}`)
  const first = await snapHold()
  timeline.push({ name: `${start} start`, frames: [first], hold: HOLD, holdFrame: first })

  for (let i = 0; i < seq.length - 1; i++) {
    if (!wanted(i)) continue
    const from = seq[i]
    const here = await page.evaluate(() => `${deck.state().slide}.${deck.state().step}`)
    if (here !== from.key) {
      await page.evaluate((target) => { deck.finish(); deck.goto(target.id, target.step) }, from)
      await page.evaluate(() => deck.ready())
      const now = await page.evaluate(() => `${deck.state().slide}.${deck.state().step}`)
      if (now !== from.key) throw new Error(`--only expected ${from.key} and landed on ${now}. Run the full deck for evidence; --only is only a quick look.`)
    }
    const before = await page.evaluate(SAMPLE)
    const info = await page.evaluate(() => {
      const was = deck.state()
      deck.next()
      const now = deck.state()
      const all = document.getAnimations()
      const targets = all.map((a) => a.effect && a.effect.target).filter(Boolean)
      window.__targets = targets
      all.forEach((a) => { try { a.pause() } catch (e) {} })
      const timings = all.map((a) => {
        const t = a.effect.getComputedTiming()
        const tg = a.effect.target
        const sl = tg && tg.closest ? tg.closest('.slide') : null
        const shared = !!(tg && tg.closest && tg.closest('[data-shared], .head, [data-furniture]'))
        let side = 'stage'
        if (sl) side = sl.classList.contains('is-leaving') ? 'leaving' : 'active'
        return { end: t.endTime || 0, delay: t.delay || 0, shared, side }
      })
      const end = Math.max(0, ...timings.map((t) => t.end))
      const lv = timings.filter((t) => t.side === 'leaving')
      const en = timings.filter((t) => t.side === 'active' && !t.shared)
      const stepped = [...document.querySelectorAll('.slide.is-active, .slide.is-leaving')].some((s) => s.hasAttribute('data-snap-ok') || /tense|stepped/.test(s.dataset.motion || ''))
      return {
        from: `${was.slide}.${was.step}`, to: `${now.slide}.${now.step}`, end, count: all.length,
        slideChange: was.slide !== now.slide, stepped,
        leaveEnd: lv.length ? Math.max(...lv.map((t) => t.end)) : null,
        enterStart: en.length ? Math.min(...en.map((t) => t.delay)) : null,
      }
    })
    if (info.from === info.to) {
      analysis.presses.push({ press: `${from.key} > (stuck)`, from: info.from, to: info.to, flags: [{ type: 'stuck', el: 'deck.next', note: 'Next did not change state — video confirm or finish-first. Later rows are not relabelled.' }], slideChange: false, endMs: 0, frames: 0, animations: 0, overlapMs: null })
      const dest = seq[i + 1]
      await page.evaluate((target) => { deck.finish(); deck.goto(target.id, target.step) }, dest)
      await page.evaluate(() => deck.ready())
      process.stdout.write(`${from.key} STUCK — jumped to ${dest.key}\n`)
      continue
    }
    await page.evaluate(() => {
      const targets = new Set(window.__targets || [])
      window.__isAnimated = (el) => { for (let n = el; n; n = n.parentElement) if (targets.has(n)) return true; return false }
    })
    const nFrames = Math.max(2, Math.ceil(info.end / dt) + 2)
    let seekChecked = false
    const rows = []
    const idxs = []
    for (let f = 0; f < nFrames; f++) {
      const t = Math.min(f * dt, info.end + 1)
      const stamp = await page.evaluate((time) => {
        const a = document.getAnimations()[0]
        const before = a ? a.currentTime : 0
        document.getAnimations().forEach((anim) => { try { anim.currentTime = time } catch (e) {} })
        return { before, after: a ? a.currentTime : 0, n: document.getAnimations().length }
      }, t)
      if (!seekChecked && f > 0 && stamp.n) {
        if (!(stamp.after > stamp.before)) throw new Error(`${info.from}: currentTime did not advance. Snap/pop numbers would be vacuous.`)
        seekChecked = true
      }
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      rows.push(await page.evaluate(SAMPLE))
      idxs.push(await snapHold())
    }
    Object.assign(names, await page.evaluate(NAMES))
    const unanim = await page.evaluate(() => {
      const m = {}
      document.querySelectorAll('*').forEach((e) => { if (e.__q !== undefined) m[e.__q] = window.__isAnimated(e) })
      return m
    })
    await page.evaluate(() => { document.getAnimations().forEach((a) => { try { a.finish() } catch (e) { a.cancel() } }); deck.finish() })
    await page.evaluate(() => deck.ready())

    const byId = new Map()
    rows.forEach((fr, f) => fr.forEach(([id, x, y, w, h, o]) => {
      if (!byId.has(id)) byId.set(id, [])
      byId.get(id)[f] = [x, y, w, h, o]
    }))
    const flags = []
    const prevMap = new Map(before.map((r) => [r[0], r]))
    for (const [id, seqf] of byId) {
      const nm = names[id] || String(id)
      const anim = unanim[id]
      const d = []
      for (let f = 1; f < seqf.length; f++) {
        const a = seqf[f - 1], b = seqf[f]
        if (!a || !b || a[4] < 0.05 || b[4] < 0.05) { d[f] = null; continue }
        d[f] = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]) * 0.5, Math.abs(b[3] - a[3]) * 0.5)
      }
      for (let f = 2; f < seqf.length - 1; f++) {
        if (d[f] == null) continue
        const nb = Math.max(d[f - 1] ?? 0, d[f + 1] ?? 0)
        if (d[f] > SNAP && d[f] > 3 * nb + 4 && !info.stepped) flags.push({ type: 'snap', frame: f, ms: Math.round(f * dt), el: nm, px: Math.round(d[f]), neighbours: Math.round(nb) })
      }
      if (REDUCED) {
        const visible = seqf.filter((p) => p && p[4] > 0.2)
        if (visible.length >= 2) {
          const a = visible[0], b = visible[visible.length - 1]
          const travel = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
          if (travel > 4) flags.push({ type: 'travel', el: nm, px: Math.round(travel) })
        }
      }
      for (let f = 0; f < seqf.length; f++) {
        const cur = seqf[f]
        if (!cur) continue
        const prv = f === 0 ? (prevMap.get(id) ? prevMap.get(id).slice(1) : null) : seqf[f - 1]
        const po = prv ? prv[4] : 0
        if (cur[4] - po > 0.6 && !anim) flags.push({ type: 'pop', frame: f, ms: Math.round(f * dt), el: nm, from: po, to: cur[4] })
      }
    }
    const overlapMs = info.slideChange && info.leaveEnd != null && info.enterStart != null ? Math.round(info.leaveEnd - info.enterStart) : null
    if (overlapGate && info.slideChange && overlapMs != null && (overlapMs < overlapGate.min || overlapMs > overlapGate.max)) {
      flags.push({ type: 'overlap', ms: overlapMs, want: `${overlapGate.min}-${overlapGate.max}` })
    }
    const rec = {
      press: `${info.from} > ${info.to}`, from: info.from, to: info.to, slideChange: info.slideChange,
      endMs: Math.round(info.end), frames: nFrames, animations: info.count, overlapMs,
      leaveEnd: info.leaveEnd == null ? null : Math.round(info.leaveEnd),
      enterStart: info.enterStart == null ? null : Math.round(info.enterStart),
      stepped: info.stepped, flags,
    }
    analysis.presses.push(rec)
    const holdFrame = await snapHold()
    timeline.push({ name: rec.press, kind: info.slideChange ? 'slide' : 'step', frames: idxs, hold: HOLD, holdFrame })
    const snaps = flags.filter((f) => f.type === 'snap').length
    const pops = flags.filter((f) => f.type === 'pop').length
    process.stdout.write(`${rec.press}  ${rec.endMs}ms  snap:${snaps} pop:${pops}${overlapMs != null ? '  overlap:' + overlapMs : ''}\n`)
  }
  await page.close()
} finally {
  await session.close()
}

analysis.errors = errors
writeFileSync(resolve(out, 'analysis.json'), JSON.stringify(analysis, null, 1))
let md = '# Motion run analysis\n\n| press | ends (ms) | overlap (ms) | snaps | pops | note |\n|---|---|---|---|---|---|\n'
for (const r of analysis.presses) {
  const note = [
    r.stepped ? 'stepped easing exempt from snaps' : '',
    r.flags.some((f) => f.type === 'travel') ? 'reduced-motion travel' : '',
    r.flags.some((f) => f.type === 'stuck') ? 'stuck' : '',
    r.flags.some((f) => f.type === 'overlap') ? 'overlap outside target' : '',
  ].filter(Boolean).join('; ')
  md += `| ${r.press} | ${r.endMs ?? ''} | ${r.overlapMs ?? ''} | ${r.flags.filter((f) => f.type === 'snap').length} | ${r.flags.filter((f) => f.type === 'pop').length} | ${note} |\n`
}
writeFileSync(resolve(out, 'summary.md'), md)

const snaps = analysis.presses.reduce((n, r) => n + r.flags.filter((f) => f.type === 'snap').length, 0)
const pops = analysis.presses.reduce((n, r) => n + r.flags.filter((f) => f.type === 'pop').length, 0)
const travels = analysis.presses.reduce((n, r) => n + r.flags.filter((f) => f.type === 'travel').length, 0)
const stuck = analysis.presses.reduce((n, r) => n + r.flags.filter((f) => f.type === 'stuck').length, 0)
const badOverlap = analysis.presses.reduce((n, r) => n + r.flags.filter((f) => f.type === 'overlap').length, 0)

if (!NOVIDEO && timeline.some((t) => t.frames && t.frames.length)) {
  const list = (items, file) => {
    let s = ''
    for (const it of items) {
      for (const f of it.frames) s += `file 'frames/f${String(f).padStart(6, '0')}.jpg'\nduration ${(1 / 60).toFixed(5)}\n`
      const hf = it.holdFrame ?? it.frames[it.frames.length - 1]
      s += `file 'frames/f${String(hf).padStart(6, '0')}.jpg'\nduration ${(it.hold / 1000).toFixed(3)}\n`
    }
    const last = items[items.length - 1]
    const tail = last.holdFrame ?? last.frames[last.frames.length - 1]
    s += `file 'frames/f${String(tail).padStart(6, '0')}.jpg'\n`
    writeFileSync(resolve(out, file), s)
  }
  list(timeline, 'full.txt')
  const full = resolve(out, 'full-run.mp4')
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', resolve(out, 'full.txt'), '-r', '60', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', ...TV_RANGE_ARGS, '-movflags', '+faststart', full], { cwd: out })
  const proof = assertVideo(full, { width: W, height: H, fps: 60 })
  if (proof.errors.length) throw new Error(`full-run.mp4: ${proof.errors.join('; ')}`)
  analysis.video = { file: 'full-run.mp4', ...proof.stream }
  writeFileSync(resolve(out, 'analysis.json'), JSON.stringify(analysis, null, 1))
  console.log('video', proof.stream.codec_name, proof.stream.pix_fmt, proof.stream.color_range, proof.stream.width + 'x' + proof.stream.height, proof.stream.r_frame_rate)

  let reps = String(opt('rep', 'auto')).split(',').filter(Boolean)
  if (reps.length === 1 && reps[0] === 'auto') {
    const changes = analysis.presses.filter((r) => r.slideChange)
    const pick = [changes[0], changes[Math.floor(changes.length / 2)], changes[changes.length - 1]].filter(Boolean)
    reps = [...new Set(pick.map((r) => r.from + '>'))]
  }
  for (const r of reps) {
    const key = r.replace('>', '')
    const items = timeline.filter((t) => t.name.startsWith(key + ' >'))
    if (!items.length) continue
    list(items, 'rep.txt')
    const name = items[0].name.replace(/[ >.]+/g, '-').replace(/-+$/, '')
    const file = resolve(out, `rep-${name}.mp4`)
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', resolve(out, 'rep.txt'), '-r', '60', '-c:v', 'libx264', '-crf', '18', ...TV_RANGE_ARGS, '-movflags', '+faststart', file], { cwd: out })
    const repProof = assertVideo(file, { width: W, height: H, fps: 60 })
    if (repProof.errors.length) throw new Error(`${file}: ${repProof.errors.join('; ')}`)
  }
  if (!KEEP) rmSync(fdir, { recursive: true, force: true })
}

console.log(JSON.stringify({ presses: analysis.presses.length, snaps, pops, travels, stuck, badOverlap, errors: errors.length }))
if (GATE && (snaps || pops || travels || stuck || badOverlap || errors.length)) process.exit(1)
