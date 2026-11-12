/* Opt-in motion recipes for a click-paced HTML deck.
 * Loaded before motion.js. motion.js calls DECK_RECIPES.enter[data-anim] when the name matches.
 * Transition helpers are not wired into deck.transition(); a project calls them from its own
 * transition() when the storyboard names that card. Default exits stay the scaffold's.
 *
 * Ideas adapted from video-shotcraft (Apache-2.0), https://github.com/Vincentwei1021/video-shotcraft
 * — rewritten for this runtime. Cards: design/recipes/. Times below are presentation milliseconds,
 * not the source films' 30fps frame counts.
 *
 * Contract: CSS already shows the settled layout. Animations use fill:backwards (via animate()).
 * finish() lands on that CSS. Reduced motion never reaches these enter functions (motion.js fades).
 * Static/PDF mode does not run them. No Math.random, no Date.now. */
(function () {
  'use strict'
  var OUT = 'cubic-bezier(.16,1,.3,1)'
  var INOUT = 'cubic-bezier(.76,0,.24,1)'
  var EXIT = 'cubic-bezier(.4,0,.2,1)'

  function scale() {
    var stage = document.getElementById('stage')
    if (!stage) return 1
    var w = stage.getBoundingClientRect().width
    return w ? w / 1920 : 1
  }

  /* Gaps shrink each index. First gap ~90ms, floor 16ms. Rest is added by the caller. */
  function dealCues(n) {
    var cues = []
    var t = 0
    var k
    for (k = 0; k < n; k++) {
      cues.push(Math.round(t))
      t += Math.max(16, 90 * Math.pow(0.72, k))
    }
    return cues
  }

  function countUp(el, delay, api) {
    var printed = el.textContent
    var raw = (el.dataset.to || printed || '').trim()
    var target = Number(String(raw).replace(/[^0-9.]/g, ''))
    if (!isFinite(target)) target = 0
    var suffix = (printed.indexOf('%') >= 0 || raw.indexOf('%') >= 0) ? '%' : (el.dataset.suffix || '')
    var dur = Number(el.dataset.ms || 900)
    var paint = function (t) { el.textContent = String(Math.round(target * t)) + suffix }
    var settle = function () { el.textContent = printed }
    paint(0)
    var a = api.animate(el, [{ opacity: 1 }, { opacity: 1 }], { duration: dur, delay: delay, easing: OUT })
    var loop = function () {
      if (a.playState === 'finished' || a.playState === 'idle') { settle(); return }
      var t = dur ? Math.min(1, Math.max(0, (a.currentTime || 0) / dur)) : 1
      paint(1 - Math.pow(1 - t, 3))
      requestAnimationFrame(loop)
    }
    var origFinish = a.finish.bind(a)
    a.finish = function () { var result = origFinish(); settle(); return result }
    a.onfinish = settle
    a.oncancel = settle
    requestAnimationFrame(loop)
    return a
  }

  function dealIn(el, delay, api) {
    var kids = Array.prototype.slice.call(el.children)
    if (!kids.length) return null
    var cues = dealCues(kids.length)
    var flight = Number(el.dataset.flight || 280)
    var rest = Number(el.dataset.rest || 500)
    kids.forEach(function (kid, i) {
      api.animate(kid, [
        { opacity: 0, transform: 'translateY(28px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: flight, delay: delay + cues[i], easing: OUT })
    })
    var total = cues[cues.length - 1] + flight + rest
    return api.animate(el, [{ opacity: 1 }, { opacity: 1 }], { duration: total, delay: delay })
  }

  function marker(el, delay, api) {
    return api.animate(el, [
      { transform: 'scaleX(0)', transformOrigin: '0 50%' },
      { transform: 'scaleX(1)', transformOrigin: '0 50%' },
    ], { duration: Number(el.dataset.ms || 420), delay: delay, easing: OUT })
  }

  function iris(el, delay, api) {
    return api.animate(el, [
      { clipPath: 'circle(0% at var(--iris-x, 50%) var(--iris-y, 50%))' },
      { clipPath: 'circle(150% at var(--iris-x, 50%) var(--iris-y, 50%))' },
    ], { duration: Number(el.dataset.ms || 700), delay: delay, easing: 'cubic-bezier(.62,0,.32,1)' })
  }

  function tense(el, delay, api) {
    return api.animate(el, [
      { transform: 'translateY(18px)', opacity: 0, offset: 0 },
      { transform: 'translateY(12px)', opacity: 1, offset: 0.33 },
      { transform: 'translateY(12px)', opacity: 1, offset: 0.48 },
      { transform: 'translateY(4px)', opacity: 1, offset: 0.8 },
      { transform: 'translateY(4px)', opacity: 1, offset: 0.9 },
      { transform: 'none', opacity: 1, offset: 1 },
    ], { duration: Number(el.dataset.ms || 700), delay: delay, easing: 'linear' })
  }

  function meterReadout(el, delay, api) {
    var n = Math.max(4, Math.round(el.offsetWidth / 20))
    return api.animate(el, [
      { clipPath: 'inset(-4px 100% -4px 0)' },
      { clipPath: 'inset(-4px 0 -4px 0)' },
    ], { duration: Number(el.dataset.ms || 640), delay: delay, easing: 'steps(' + n + ', end)' })
  }

  function listReveal(el, delay, api) {
    var rows = Array.prototype.slice.call(el.children)
    if (!rows.length) return null
    rows.forEach(function (row, i) {
      api.animate(row, [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 420, delay: delay + i * 70, easing: OUT })
    })
    return api.animate(el, [{ opacity: 1 }, { opacity: 1 }], { duration: 420 + rows.length * 70, delay: delay })
  }

  function speedSettle(el, delay, api) {
    return api.animate(el, [
      { transform: 'translateY(36px)', opacity: 0, offset: 0 },
      { transform: 'translateY(6px)', opacity: 1, offset: 0.62 },
      { transform: 'none', opacity: 1, offset: 1 },
    ], { duration: Number(el.dataset.ms || 640), delay: delay, easing: OUT })
  }

  function sharedFlight(fromEl, toEl, ms) {
    var k = scale()
    var a = fromEl.getBoundingClientRect()
    var b = toEl.getBoundingClientRect()
    var dx = (a.left - b.left) / k
    var dy = (a.top - b.top) / k
    var sx = b.width ? a.width / b.width : 1
    var sy = b.height ? a.height / b.height : 1
    fromEl.style.visibility = 'hidden'
    var anim = toEl.animate([
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
      { transform: 'none' },
    ], { duration: ms || 1000, easing: INOUT, fill: 'backwards' })
    var restore = function () { fromEl.style.visibility = '' }
    anim.finished.then(restore, restore)
    return anim
  }

  function sharedWidth(fromEl, toEl, ms) {
    var k = scale()
    var a = fromEl.getBoundingClientRect()
    var b = toEl.getBoundingClientRect()
    var dx = (a.left - b.left) / k
    var sx = b.width ? a.width / b.width : 1
    fromEl.style.visibility = 'hidden'
    var anim = toEl.animate([
      { transform: 'translateX(' + dx + 'px) scaleX(' + sx + ')', transformOrigin: '0 50%' },
      { transform: 'none', transformOrigin: '0 50%' },
    ], { duration: ms || 1000, easing: INOUT, fill: 'backwards' })
    var restore = function () { fromEl.style.visibility = '' }
    anim.finished.then(restore, restore)
    return anim
  }

  function flipFrom(el, source, ms) {
    var k = scale()
    var a = source.getBoundingClientRect()
    var b = el.getBoundingClientRect()
    var dx = (a.left - b.left) / k
    var dy = (a.top - b.top) / k
    var sx = b.width ? a.width / b.width : 1
    var sy = b.height ? a.height / b.height : 1
    return el.animate([
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
      { transform: 'none' },
    ], { duration: ms || 900, easing: INOUT, fill: 'backwards' })
  }

  function overlapDelay(exitSpanMs, overlapMs) {
    var overlap = overlapMs == null ? 200 : overlapMs
    return Math.max(0, exitSpanMs - overlap)
  }

  window.DECK_RECIPES = {
    enter: {
      'count-up': countUp,
      'deal-in': dealIn,
      'marker-underline': marker,
      'match-iris': iris,
      'tense-step': tense,
      'meter-readout': meterReadout,
      'list-reveal': listReveal,
      'speed-settle': speedSettle,
    },
    transition: {
      sharedFlight: sharedFlight,
      sharedWidth: sharedWidth,
      flipFrom: flipFrom,
      overlapDelay: overlapDelay,
      EXIT: EXIT,
      INOUT: INOUT,
      OUT: OUT,
    },
    dealCues: dealCues,
  }
})()
