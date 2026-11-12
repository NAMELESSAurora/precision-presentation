/* Motion layer (design/motion-spec.md). Everything here is decoration on top of a CSS end state:
 * finishing or cancelling any animation always leaves the correct layout. No setTimeout chains.
 * Vocabulary (data-anim on a [data-reveal] element, else rise for .line / fade):
 *   rise · fade · wipe · draw (SVG paths) · slide-l · slide-r · meter (stepped wipe) · type (LCD type-on)
 * Inside an entering block: [data-type-on] children type on, img[data-load] loads in bands (stepped, top first). */
(function () {
  'use strict'
  const EXPO = 'cubic-bezier(.16,1,.3,1)'
  const EASE_IN = 'cubic-bezier(.55,0,.9,.4)'
  const running = new Set()
  let reduced = false

  function track(anim) {
    running.add(anim)
    const done = () => running.delete(anim)
    anim.finished.then(done, done)
    return anim
  }
  function animate(el, frames, opts) {
    return track(el.animate(frames, Object.assign({ fill: 'backwards', easing: EXPO }, opts)))
  }

  // ── L1 / L2 element entries ─────────────────────────────────────────
  function kindOf(el) {
    if (el.dataset.anim) return el.dataset.anim
    if (el.classList.contains('line')) return 'rise'
    return 'fade'
  }
  /** LCD type-on: one clip step per character. Only ever adds pixels: no blink, no repeat. */
  function typeOn(el, delay, vertical) {
    if (reduced) return null
    const n = Math.max(4, Math.min(40, (el.textContent || '').trim().length))
    const from = vertical ? 'inset(-8px -8px 100% -8px)' : 'inset(-8px 100% -8px -8px)'
    return animate(el, [{ clipPath: from }, { clipPath: 'inset(-8px -8px -8px -8px)' }],
      { duration: Math.min(640, 160 + n * 14), delay, easing: `steps(${n}, end)` })
  }
  /** An image in a viewer window arrives in horizontal bands, top first (a slow download). */
  function load(img, delay) {
    if (reduced) return null
    return animate(img, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 720, delay, easing: 'steps(9, end)' })
  }
  function inner(el, delay) {
    let i = 0
    el.querySelectorAll('[data-type-on]').forEach((c) => { if (c.closest('[data-reveal]') === el) typeOn(c, delay + 60 + i++ * 50) })
    el.querySelectorAll('img[data-load]').forEach((im) => load(im, delay + 160))
  }
  function enterOne(el, delay) {
    if (reduced) return animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: Math.min(delay, 120), easing: 'linear' })
    const recipe = window.DECK_RECIPES && window.DECK_RECIPES.enter && window.DECK_RECIPES.enter[kindOf(el)]
    if (recipe) {
      const made = recipe(el, delay, { animate, reduced })
      if (made) { inner(el, delay); return made }
    }
    let a
    switch (kindOf(el)) {
      case 'rise':
        a = animate(el, [
          { transform: 'translateY(105%)', clipPath: 'inset(-14% -8% 105% -8%)' },
          { transform: 'translateY(0)', clipPath: 'inset(-14% -8% -14% -8%)' },
        ], { duration: 420, delay })
        break
      case 'wipe':
        a = animate(el, [{ clipPath: 'inset(-4px 100% -4px 0)' }, { clipPath: 'inset(-4px 0 -4px 0)' }], { duration: 560, delay })
        break
      case 'meter': {
        const n = Math.max(4, Math.round(el.offsetWidth / 20))
        a = animate(el, [{ clipPath: 'inset(-4px 100% -4px 0)' }, { clipPath: 'inset(-4px 0 -4px 0)' }], { duration: 640, delay, easing: `steps(${n}, end)` })
        break
      }
      case 'type':
        a = typeOn(el, delay)
        break
      case 'draw': {
        const len = typeof el.getTotalLength === 'function' ? Math.ceil(el.getTotalLength()) + 2 : 0
        a = len
          ? animate(el, [{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { duration: 640, delay })
          : animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay })
        break
      }
      case 'slide-l':
      case 'slide-r': {
        const dx = kindOf(el) === 'slide-r' ? -64 : 64
        a = animate(el, [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: 'translateX(0)' }], { duration: 560, delay })
        break
      }
      default:
        a = animate(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, delay, easing: 'cubic-bezier(.2,.7,.3,1)' })
    }
    inner(el, delay)
    return a
  }
  /** Animate a batch in DOM order; explicit data-delay wins, otherwise 70 ms stagger. */
  function enter(els, base) {
    let i = 0
    for (const el of els) {
      const d = el.dataset.delay != null ? Number(el.dataset.delay) : i++ * 70
      enterOne(el, (base || 0) + d)
    }
  }
  /** Outgoing page leaves on an accelerating move. */
  function exit(slide) {
    if (reduced) return animate(slide, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'linear', fill: 'forwards' })
    return animate(slide, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 220, easing: EASE_IN, fill: 'forwards' })
  }
  function fadeIn(el, delay, duration) {
    return animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 160 : duration || 300, delay: reduced ? 0 : delay || 0, easing: 'linear' })
  }
  /** Theme change: a solid flood of the new world grows out of a horizontal line and overscans the corners. The stage keeps
   *  the old world until it is covered — background colours are never interpolated (night↔day would pass through grey). */
  function flood(stage, from, to, opts, onDone) {
    const el = stage.querySelector('#flood')
    const y = (opts && opts.y) || 540
    stage.dataset.theme = from
    el.dataset.to = to
    el.hidden = false
    const a = animate(el, [{ clipPath: `inset(${y - 1}px 96px ${1080 - y - 1}px 96px)` }, { clipPath: 'inset(-4px -4px -4px -4px)' }],
      { duration: reduced ? 1 : (opts && opts.duration) || 420, delay: reduced ? 0 : (opts && opts.delay) || 0, easing: EXPO })
    const done = () => { if (onDone) onDone(); else stage.dataset.theme = to; el.hidden = true }
    a.finished.then(done, done)
    return a
  }

  window.DeckMotion = {
    enter, exit, fadeIn, flood,
    type: (el, delay, vertical) => typeOn(el, delay || 0, vertical),
    isRunning: () => running.size > 0,
    finishAll() { for (const a of Array.from(running)) { try { a.finish() } catch (e) { a.cancel() } } },
    setReduced(v) { reduced = !!v },
    get reduced() { return reduced },
  }
})()
