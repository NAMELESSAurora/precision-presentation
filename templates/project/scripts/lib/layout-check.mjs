// In-page layout checker. Design space is the 1920×1080 stage (deck.js scales it to the viewport).
// Playwright serialises this function: keep it self-contained, no imports.
//
// opts: { slideEl, minGap=24, minFont=18, safe=0.05, mid=false }
// Returns { flags, stats }. Every flag has { type, slide, ... }.
//
// Intentional overlaps are declared in markup (documented in qa/layout-exceptions.md):
//   data-over        text sits on a photo or shape on purpose (pair it with a scrim; the checker does not judge contrast)
//   data-under       a ground or band whose fill is meant to sit under text
//   data-tight       a label + value group; the min-gap rule does not apply inside it
//   data-bleed       display type that may cross the safe area
//   data-edge        a photo or type that runs off the page on purpose
//   data-furniture   persistent chrome (the generated .head is furniture already)
// Furniture may sit in the inner 2% margin and is exempt from the type floor and from text-on-media.
// It is NOT exempt from text-on-text.
export function checkLayout(opts = {}) {
  const O = Object.assign({ minGap: 24, minFont: 18, safe: 0.05, mid: false }, opts)
  const slide = O.slideEl ? document.querySelector(O.slideEl) : document.querySelector('.slide.is-active')
  if (!slide) return { flags: [{ type: 'no-slide', slide: O.slideEl || '' }], stats: { lines: 0, blocks: 0, media: 0 } }
  const sr = slide.getBoundingClientRect()
  const K = sr.width / 1920 || 1
  // Computed font-size ignores CSS transform but follows CSS zoom (static / PDF mode).
  // offsetWidth follows zoom and ignores transform, so this brings type back to design px in both modes.
  const stageEl = document.getElementById('stage')
  const fontK = (stageEl && stageEl.offsetWidth ? stageEl.offsetWidth : sr.width) / 1920 || 1
  const rel = (r) => ({ l: (r.left - sr.left) / K, t: (r.top - sr.top) / K, r: (r.right - sr.left) / K, b: (r.bottom - sr.top) / K })
  const sid = slide.id || ''
  const flags = []
  const nm = (el) => {
    const cls = el.className && el.className.baseVal === undefined ? String(el.className).trim().replace(/\s+/g, '.') : ''
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`
  }
  const eff = (el) => {
    let o = 1
    for (let n = el; n && n !== slide.parentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0
      o *= Number(cs.opacity) || 0
    }
    return o
  }
  const minOp = O.mid ? 0.2 : 0.5
  const furnSel = '.head, [data-furniture]'
  const isFurn = (el) => !!el.closest(furnSel)

  function clipInk(el, ink) {
    for (let n = el; n && n !== slide.parentElement; n = n.parentElement) {
      if (n === slide) break
      const cs = getComputedStyle(n)
      if (/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY) && !n.matches('#stage')) {
        const q = rel(n.getBoundingClientRect())
        ink.l = Math.max(ink.l, q.l); ink.t = Math.max(ink.t, q.t); ink.r = Math.min(ink.r, q.r); ink.b = Math.min(ink.b, q.b)
      }
      const cp = cs.clipPath || ''
      const m = /^inset\((.*)\)$/.exec(cp)
      if (m) {
        const q = rel(n.getBoundingClientRect())
        const raw = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/)
        const P = raw.length === 1 ? [raw[0], raw[0], raw[0], raw[0]]
          : raw.length === 2 ? [raw[0], raw[1], raw[0], raw[1]]
          : raw.length === 3 ? [raw[0], raw[1], raw[2], raw[1]]
          : raw
        const f = (s, dim) => (s && s.endsWith('%') ? (parseFloat(s) / 100) * dim : (parseFloat(s) || 0) / fontK)
        const qw = q.r - q.l, qh = q.b - q.t
        ink.t = Math.max(ink.t, q.t + f(P[0], qh))
        ink.r = Math.min(ink.r, q.r - f(P[1], qw))
        ink.b = Math.min(ink.b, q.b - f(P[2], qh))
        ink.l = Math.max(ink.l, q.l + f(P[3], qw))
      }
    }
    return ink
  }

  const lines = []
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!node.nodeValue.trim()) continue
    const el = node.parentElement
    if (!el) continue
    if (el.closest('script, style, .sr-only')) continue
    if (el.closest('svg') && !el.closest('svg text')) continue
    if (eff(el) < minOp) continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const fs = (parseFloat(getComputedStyle(el).fontSize) || 0) / fontK
    const cs0 = getComputedStyle(el)
    const lhp = (parseFloat(cs0.lineHeight) || fs * fontK * 1.2) / fontK
    for (const rc of range.getClientRects()) {
      if (rc.width < 1 || rc.height < 1) continue
      const b = rel(rc)
      // Em boxes of tightly leaded display type are taller than the ink. Clamp the short side to ~0.92 × line-height.
      const lh = lhp * 0.92
      const ink = { l: b.l, r: b.r, t: b.t, b: b.b }
      if (b.b - b.t <= b.r - b.l || fs * 2 > b.r - b.l) {
        if (b.b - b.t > lh) { const s = (b.b - b.t - lh) / 2; ink.t += s; ink.b -= s }
      }
      if (b.r - b.l < (b.b - b.t) * 0.6 && b.b - b.t > fs * 2 && b.r - b.l > lh) {
        const s = (b.r - b.l - lh) / 2; ink.l += s; ink.r -= s; ink.t = b.t; ink.b = b.b
      }
      // A masked word (.w overflow hidden) has no ink in the top ~22% of its em box.
      if (el.closest('.w')) ink.t += fs * 0.22
      clipInk(el, ink)
      if (ink.r - ink.l < 1 || ink.b - ink.t < 1) continue
      lines.push({
        el, text: node.nodeValue.trim().slice(0, 36), b, ink, fs,
        bleed: !!el.closest('[data-bleed], [data-edge]'),
        over: !!el.closest('[data-over]'),
        furn: isFurn(el),
      })
    }
  }

  const area = (a, b) => {
    const w = Math.min(a.r, b.r) - Math.max(a.l, b.l)
    const h = Math.min(a.b, b.b) - Math.max(a.t, b.t)
    return w > 0 && h > 0 ? { w, h } : null
  }

  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const A = lines[i], B = lines[j]
    if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue
    const o = area(A.ink, B.ink)
    if (o && o.w > 3 && o.h > 3) flags.push({ type: 'text-overlap', slide: sid, a: `${nm(A.el)} "${A.text}"`, b: `${nm(B.el)} "${B.text}"`, w: Math.round(o.w), h: Math.round(o.h) })
  }

  const media = []
  const pushMedia = (el, rect, kind) => {
    if (eff(el) < minOp) return
    let vb = rel(rect)
    for (let n = el.parentElement; n && n !== slide; n = n.parentElement) {
      const cs2 = getComputedStyle(n)
      if (/(hidden|clip)/.test(cs2.overflow + cs2.overflowX + cs2.overflowY)) {
        const q = rel(n.getBoundingClientRect())
        vb = { l: Math.max(vb.l, q.l), t: Math.max(vb.t, q.t), r: Math.min(vb.r, q.r), b: Math.min(vb.b, q.b) }
      }
    }
    if (vb.r - vb.l < 12 || vb.b - vb.t < 12) return
    media.push({ el, b: vb, kind })
  }
  slide.querySelectorAll('img, video, canvas').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width < 24 || r.height < 24) return
    pushMedia(el, r, 'image')
  })
  // Stroke-only diagrams are not "text on a photo". Use each filled shape's own box, not the SVG viewport.
  slide.querySelectorAll('svg').forEach((svg) => {
    if (svg.closest('svg') !== svg || svg.hasAttribute('data-text-svg')) return
    svg.querySelectorAll('rect, circle, ellipse, polygon, path, text').forEach((n) => {
      const fill = getComputedStyle(n).fill
      if (!fill || fill === 'none' || /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(fill)) return
      const r = n.getBoundingClientRect()
      if (r.width < 24 || r.height < 24) return
      pushMedia(n, r, 'svg')
    })
  })
  slide.querySelectorAll('[data-shape], i, div, span, figure').forEach((el) => {
    if (el.closest('svg')) return
    if (el.closest('[data-under]') && !el.hasAttribute('data-under')) return
    const cs = getComputedStyle(el)
    const bg = cs.backgroundColor
    const alpha = Number((String(bg).match(/[\d.]+(?=\s*\))/) || ['1'])[0])
    const hasBg = bg && !/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)|transparent/.test(bg) && alpha > 0.3
    if (!hasBg) return
    if (!(el.matches('[data-shape], i, figure') || el.offsetWidth * el.offsetHeight < 1920 * 1080 * 0.85)) return
    const r = el.getBoundingClientRect()
    if (r.width < 24 || r.height < 24) return
    pushMedia(el, r, 'shape')
  })

  for (const L of lines) {
    if (L.over || L.bleed || L.furn) continue
    for (const M of media) {
      if (M.el.contains(L.el) || L.el.contains(M.el)) continue
      if (M.el.hasAttribute('data-under') || M.el.closest('[data-under]')) continue
      const o = area(L.ink, M.b)
      if (o && o.w > 4 && o.h > 4) flags.push({ type: 'text-on-media', slide: sid, text: `${nm(L.el)} "${L.text}"`, media: `${M.kind}:${nm(M.el)}`, w: Math.round(o.w), h: Math.round(o.h) })
    }
  }

  const sx = 1920 * O.safe, sy = 1080 * O.safe, fx = 1920 * 0.02, fy = 1080 * 0.02
  for (const L of lines) {
    if (L.bleed) continue
    const x0 = L.furn ? fx : sx, y0 = L.furn ? fy : sy
    if (L.b.l < x0 - 6 || L.ink.t < y0 - 6 || L.b.r > 1920 - x0 + 6 || L.ink.b > 1080 - y0 + 6) {
      flags.push({ type: 'safe-area', slide: sid, text: `${nm(L.el)} "${L.text}"`, box: [L.b.l, L.ink.t, L.b.r, L.ink.b].map((n) => Math.round(n)) })
    }
  }
  for (const M of media) {
    if (M.kind !== 'image' || M.el.closest('[data-bleed], [data-edge]')) continue
    if (M.b.l < -1 || M.b.t < -1 || M.b.r > 1921 || M.b.b > 1081) flags.push({ type: 'image-outside-stage', slide: sid, media: nm(M.el) })
  }

  const blockOf = (el) => {
    let n = el
    while (n && n !== slide && (n.classList.contains('line') || n.classList.contains('w') || n.classList.contains('wi') || !/^(block|flex|grid|list-item|table|table-cell)$/.test(getComputedStyle(n).display.split(' ')[0]))) n = n.parentElement
    return n
  }
  const blocks = new Map()
  for (const L of lines) {
    if (L.bleed) continue
    const bk = blockOf(L.el)
    if (!bk || bk === slide) continue
    const e = blocks.get(bk) || { el: bk, l: 1e9, t: 1e9, r: -1e9, b: -1e9, text: L.text, furn: L.furn }
    e.l = Math.min(e.l, L.ink.l); e.t = Math.min(e.t, L.ink.t); e.r = Math.max(e.r, L.ink.r); e.b = Math.max(e.b, L.ink.b)
    blocks.set(bk, e)
  }
  const B = [...blocks.values()].filter((x) => !x.furn)
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const A = B[i], C = B[j]
    if (A.el.contains(C.el) || C.el.contains(A.el)) continue
    const ta = A.el.closest('[data-tight]'), tc = C.el.closest('[data-tight]')
    if (ta && ta === tc) continue
    const ox = Math.min(A.r, C.r) - Math.max(A.l, C.l), oy = Math.min(A.b, C.b) - Math.max(A.t, C.t)
    let gap = null
    if (ox > 8 && oy <= 0) gap = -oy
    else if (oy > 8 && ox <= 0) gap = -ox
    if (gap !== null && gap < O.minGap) flags.push({ type: 'tight-gap', slide: sid, a: `${nm(A.el)} "${A.text}"`, b: `${nm(C.el)} "${C.text}"`, gap: Math.round(gap) })
  }

  const seen = new Set()
  for (const L of lines) {
    if (L.fs < O.minFont - 0.01 && !L.furn && !seen.has(L.el)) {
      seen.add(L.el)
      flags.push({ type: 'small-type', slide: sid, text: `${nm(L.el)} "${L.text}"`, px: Math.round(L.fs * 10) / 10 })
    }
  }

  const clipSeen = new Set()
  for (const L of lines) {
    if (L.bleed) continue
    for (let n = L.el; n && n !== slide.parentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (n !== slide && /(hidden|clip|auto|scroll)/.test(cs.overflow + cs.overflowX + cs.overflowY) && !n.matches('#stage')) {
        const nr = rel(n.getBoundingClientRect())
        const out = Math.max(nr.l - L.b.l, L.b.r - nr.r, nr.t - L.b.t, L.b.b - nr.b)
        // .w masks slide glyphs through a window (14px). Other boxes: a few px of em-box past the line is not a cut word.
        const tol = n.classList.contains('w') ? 14 : Math.max(4, L.fs * 0.2)
        if (out > tol && !clipSeen.has(L.el)) {
          clipSeen.add(L.el)
          flags.push({ type: 'clipped', slide: sid, text: `${nm(L.el)} "${L.text}"`, by: nm(n), px: Math.round(out) })
        }
        break
      }
    }
  }
  slide.querySelectorAll('*').forEach((el) => {
    if (el.closest('svg') || eff(el) < minOp) return
    if (el.closest('[data-bleed], [data-edge]')) return
    const cs = getComputedStyle(el)
    if (el.clientWidth && el.scrollWidth > el.clientWidth + 2 && /(hidden|clip)/.test(cs.overflowX) && el.textContent.trim() && !el.matches('.w, .hero, .obj, figure')) {
      flags.push({ type: 'overflow-x', slide: sid, el: nm(el), over: el.scrollWidth - el.clientWidth })
    }
  })

  return { flags, stats: { lines: lines.length, blocks: B.length, media: media.length, fontK: Math.round(fontK * 1000) / 1000, scaleK: Math.round(K * 1000) / 1000 } }
}
