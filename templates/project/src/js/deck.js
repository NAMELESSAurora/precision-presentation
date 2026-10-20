/* Presentation runtime (precision-presentation scaffold). The ONLY owner of slide index, steps, keys, URL state and the
 * media lifecycle. Classic script, so index.html also runs from file:// (the normal way to present: no server needed).
 * Automation / presenter API: window.deck — next, prev, goto, finish, state, ready, setMotion (see the skill's
 * reference/02_runtime.md). Markup contract:
 *   section.slide#Sxx [data-theme="night|day"] [data-label] [data-ref]   data-ref = not counted / not read aloud
 *   [data-reveal="k"] shown from step k (0 = on entry) · [data-anim] motion kind · [data-delay] ms
 *   .media[data-media=ID] > img.poster + video, controls [data-act=play|restart|mute|skip] in the same slide
 *   button[data-audio=ID] one clip at a time · [data-slot-box=ID] > img[data-slot=ID] · [data-slot-fallback=ID]
 *   [data-text=key] optional line from DECK_CONTENT.text · [data-fn-of=selector] shows that image's file name */
(function () {
  'use strict'
  const C = window.DECK_CONTENT
  const M = window.DeckMotion
  const params = new URLSearchParams(location.search)
  const PALETTE = params.get('palette')
  if (PALETTE) document.documentElement.dataset.palette = PALETTE
  const EMBED = params.has('embed')
  const STATIC = params.get('mode') === 'static'
  const body = document.body
  const stage = document.getElementById('stage')
  const slides = Array.from(stage.querySelectorAll('.slide'))
  const BODY = slides.filter((s) => !s.hasAttribute('data-ref'))
  const SKIP_CONFIRM_MS = 2500
  const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––')
  const $ = (sel, root) => (root || document).querySelector(sel)
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel))
  const titleOf = (s) => {
    const t = $('.title, .statement, h1', s) || s
    const lines = $$('.line', t)
    return (lines.length ? lines.map((l) => l.textContent).join(' ') : t.textContent).replace(/\s+/g, ' ').trim()
  }

  let cur = 0
  let step = 0
  let presenter = null
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('deck-' + (C.package || 'deck')) : null

  // ── Content wiring (optional slots) ───────────────────────────────
  $$('[data-slot]').forEach((img) => {
    const id = img.dataset.slot
    const cfg = (C.slots || {})[id] || {}
    if (cfg.src) { img.src = cfg.src; $$(`[data-slot-fallback="${id}"]`).forEach((el) => el.remove()) }
    else $$(`[data-slot-box="${id}"]`).forEach((el) => el.remove())
  })
  // optional lines: filled from DECK_CONTENT.text; when null, an element with placeholder text keeps it, an empty one is removed
  $$('[data-text]').forEach((el) => {
    const v = (C.text || {})[el.dataset.text]
    if (v) el.textContent = el.dataset.format ? el.dataset.format.replace('{}', v) : v
    else if (!el.textContent.trim()) el.remove()
  })
  $$('[data-fn-of]').forEach((el) => {
    const img = $(el.dataset.fnOf)
    if (img && img.getAttribute('src')) el.textContent = decodeURIComponent(img.getAttribute('src').split('/').pop())
  })
  // links leave the presentation: always a new tab (and they need internet)
  $$('.slide a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener' })

  // ── Slide metadata: steps (renumbered when optional parts were removed), running heads ──
  slides.forEach((s) => {
    const used = [...new Set($$('[data-reveal]', s).map((el) => Number(el.dataset.reveal)).filter((k) => k > 0))].sort((a, b) => a - b)
    $$('[data-reveal]', s).forEach((el) => { const k = Number(el.dataset.reveal); if (k > 0) el.dataset.reveal = String(used.indexOf(k) + 1) })
    s.steps = used.length + 1
    const head = document.createElement('div')
    head.className = 'head'
    const b = BODY.indexOf(s)
    const n = b >= 0 ? `${String(b + 1).padStart(2, '0')} / ${String(BODY.length).padStart(2, '0')}` : STATIC ? 'References' : 'Not read aloud'
    head.innerHTML = '<span></span><span class="cnt"></span>'
    head.firstChild.textContent = `${s.id} · ${s.dataset.label || ''}`
    head.lastChild.textContent = n
    s.prepend(head)
    s.setAttribute('aria-roledescription', 'slide')
  })

  // ── Scaling (uniform, letterboxed; static mode zooms to width) ─────
  function fit() {
    if (STATIC) { stage.style.transform = ''; stage.style.zoom = Math.min(1, innerWidth / 1920); return }
    const k = Math.min(innerWidth / 1920, innerHeight / 1080)
    stage.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`
  }
  addEventListener('resize', fit)

  // ── Media lifecycle ───────────────────────────────────────────────
  // One video per slide. Never autoplays. Leaving a slide pauses it; coming back shows the poster again; at the end the
  // poster returns. While it plays (or is paused part-way before any step) the stage chrome steps back (#stage.media-live).
  const media = {
    items: {}, audios: {}, skipArmed: 0,
    init() {
      $$('.media[data-media]').forEach((box) => this.initVideo(box))
      $$('[data-audio]').forEach((btn) => this.initAudio(btn))
      this.ui()
    },
    initVideo(box) {
      const id = box.dataset.media
      const p = params.get(id)
      const src = p === 'none' ? null : p || ((C.media || {})[id] || {}).src
      const it = { id, box, video: $('video', box), slide: box.closest('.slide'), state: 'unavailable' }
      this.items[id] = it
      $$('[data-act]', it.slide).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); this.act(b.dataset.act, it) }))
      if (!src || EMBED || STATIC) return
      const v = it.video
      v.preload = 'metadata'
      v.src = src
      box.classList.add('has-video')
      it.state = 'loading'
      v.addEventListener('loadedmetadata', () => { if (it.state === 'loading') it.state = 'idle'; this.ui(it) })
      v.addEventListener('error', () => {
        it.state = 'unavailable'
        box.classList.remove('has-video', 'started', 'playing')
        this.ui(it)
        toast('Video failed to load — continuing with the still')
      })
      v.addEventListener('play', () => { it.state = 'playing'; box.classList.add('playing', 'started'); this.ui(it) })
      v.addEventListener('pause', () => { if (it.state === 'playing') it.state = 'paused'; box.classList.remove('playing'); this.ui(it) })
      v.addEventListener('ended', () => {
        it.state = 'ended'
        box.classList.remove('playing', 'started')
        this.ui(it)
        toast('Video ended — press → to continue')
      })
      v.addEventListener('timeupdate', () => this.ui(it))
    },
    initAudio(btn) {
      const id = btn.dataset.audio
      const p = params.get(id)
      const src = p === 'none' ? null : p || ((C.media || {})[id] || {}).src
      const label = $('span', btn)
      if (!src || EMBED || STATIC) { btn.disabled = true; label.textContent = 'Clip not supplied'; return }
      const a = new Audio()
      a.preload = 'metadata'
      a.src = src
      this.audios[id] = { a, btn }
      a.addEventListener('error', () => { btn.disabled = true; label.textContent = 'Clip failed to load' })
      a.addEventListener('play', () => { label.textContent = 'Pause' })
      a.addEventListener('pause', () => { label.textContent = 'Listen' })
      a.addEventListener('ended', () => { a.currentTime = 0; label.textContent = 'Listen' })
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (!a.paused) { a.pause(); return }
        this.pauseAudios()
        a.play().catch(() => toast('Playback was blocked — click Listen again'))
      })
    },
    current() { return Object.values(this.items).find((it) => it.slide === slides[cur]) },
    pauseAudios() { Object.values(this.audios).forEach(({ a }) => a.pause()) },
    /** Slide change: everything stops; videos not on the new slide go back to their poster. */
    leave(toIndex) {
      this.pauseAudios()
      Object.values(this.audios).forEach(({ a }) => { try { a.currentTime = 0 } catch (e) {} })
      Object.values(this.items).forEach((it) => {
        if (!it.box.classList.contains('has-video')) return
        it.video.pause()
        if (it.slide !== slides[toIndex]) {
          try { it.video.currentTime = 0 } catch (e) {}
          it.box.classList.remove('started', 'playing')
          if (it.state !== 'unavailable' && it.state !== 'loading') it.state = 'idle'
        }
      })
    },
    /** Next while a video plays: the first press only warns, a second press within 2.5 s stops it (L skips at once). */
    confirmSkip() {
      if (Date.now() - this.skipArmed < SKIP_CONFIRM_MS) { this.skipArmed = 0; $('#toast').classList.remove('show'); return true }
      this.skipArmed = Date.now()
      toast('Video playing — press → again to stop it')
      return false
    },
    act(what, it) {
      it = it || this.current()
      if (!it) {
        if (what === 'play') {
          const first = Object.values(this.audios).find(({ btn }) => btn.closest('.slide') === slides[cur])
          if (first) first.btn.click()
        }
        return
      }
      const v = it.video
      const usable = it.box.classList.contains('has-video') && it.state !== 'unavailable'
      if (!usable) { if (what === 'play') toast('No video supplied — the still stands in'); return }
      if (what === 'play') {
        if (!v.paused) { v.pause(); return }
        if (it.state === 'ended') v.currentTime = 0
        v.play().catch(() => { it.state = 'paused'; this.ui(it); toast('Playback was blocked — click Play') })
      } else if (what === 'restart') { v.currentTime = 0; v.play().catch(() => {}) }
      else if (what === 'mute') { v.muted = !v.muted; this.ui(it) }
      else if (what === 'skip') {
        v.pause()
        if (isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05)
        it.state = 'ended'
        it.box.classList.remove('started', 'playing')
        this.ui(it)
      }
    },
    ui(it) {
      if (!it) {
        stage.classList.remove('media-live')
        Object.values(this.items).forEach((x) => this.ui(x))
        return
      }
      if (it.slide === slides[cur]) {
        const live = it.box.classList.contains('started') && (it.state === 'playing' || (it.state === 'paused' && step === 0))
        stage.classList.toggle('media-live', live)
      }
      const bar = $('.mbar', it.slide)
      if (!bar) return
      const has = it.box.classList.contains('has-video') && it.state !== 'unavailable'
      $$('.btn', bar).forEach((b) => { b.hidden = !has })
      const st = $('.mstatus', bar)
      const tm = $('.mtime', bar)
      if (st) st.hidden = has
      if (tm) tm.hidden = !has
      if (!has) return
      const v = it.video
      $('[data-act="play"] span', bar).textContent = it.state === 'playing' ? 'Pause' : it.state === 'ended' ? 'Replay' : 'Play'
      $('[data-act="play"] path', bar).setAttribute('d', it.state === 'playing' ? 'M3 2h3.5v12H3zM9.5 2H13v12H9.5z' : 'M3 1.5v13L14 8z')
      $('[data-act="mute"]', bar).textContent = v.muted ? 'Sound off' : 'Mute'
      if (tm) tm.textContent = `${fmt(v.currentTime || 0)} / ${fmt(v.duration)}`
    },
    snapshot() {
      return {
        video: Object.fromEntries(Object.entries(this.items).map(([k, it]) => [k, it.state])),
        audio: Object.fromEntries(Object.entries(this.audios).map(([k, { a }]) => [k, a.paused ? 'paused' : 'playing'])),
      }
    },
  }

  // ── State application ─────────────────────────────────────────────
  function setStep(s, k) {
    s.dataset.step = String(k)
    $$('[data-reveal]', s).forEach((el) => el.classList.toggle('on', Number(el.dataset.reveal) <= k))
  }
  function clearAnims(s) { s.getAnimations({ subtree: true }).forEach((a) => a.cancel()) }
  function themeOf(i) { return slides[i].dataset.theme || 'day' }
  function progress() {
    const s = slides[cur]
    const b = BODY.indexOf(s)
    const within = s.steps > 1 ? step / (s.steps - 1) : 1
    const p = b < 0 ? 1 : (b + within) / BODY.length
    const bar = $('#progress')
    if (bar) bar.style.transform = `scaleX(${Math.min(1, p)})`
  }

  function go(i, k, how) {
    i = Math.max(0, Math.min(slides.length - 1, i))
    k = Math.max(0, Math.min(slides[i].steps - 1, k))
    const from = cur
    const s = slides[i]
    if (i === from && how !== 'boot') {
      const prevStep = step
      setStep(s, k)
      if (how === 'step' && k === prevStep + 1) M.enter($$(`[data-reveal="${k}"]`, s))
    } else {
      M.finishAll()
      const leaving = slides[from]
      if (from !== i) media.leave(i)
      clearAnims(s)
      setStep(s, k)
      s.classList.add('is-active')
      s.style.opacity = ''
      stage.dataset.theme = themeOf(i)
      if (how === 'enter' && from !== i) transition(leaving, s, from, i)
      else if (from !== i) { leaving.classList.remove('is-active', 'is-leaving'); clearAnims(leaving) }
    }
    cur = i
    step = k
    progress()
    media.ui()
    if (!EMBED) {
      const hash = `#${s.id}${k ? '.' + k : ''}`
      if (location.hash !== hash) history.replaceState(null, '', hash)
      document.title = `${s.id} — ${C.title}`
    }
    broadcast()
  }

  function transition(leaving, entering, from, to) {
    leaving.classList.add('is-leaving')
    leaving.classList.remove('is-active')
    const fromTheme = themeOf(from)
    const toTheme = themeOf(to)
    const base = fromTheme !== toTheme ? 360 : 200
    M.exit(leaving)
    if (fromTheme !== toTheme) M.flood(stage, fromTheme, toTheme, { delay: 120, duration: 420 }, () => { stage.dataset.theme = themeOf(cur) })
    const done = () => { leaving.classList.remove('is-leaving'); clearAnims(leaving) }
    Promise.all(leaving.getAnimations({ subtree: true }).map((a) => a.finished)).then(done, done)
    // Entry choreography: title lines rise, step-0 reveals follow, everything else fades with the page.
    const lines = $$('.title .line, .statement .line, h1 .line', entering).filter((el) => !el.closest('[data-reveal]'))
    const fixed = Array.from(entering.children).filter((el) => !el.matches('[data-reveal], .title, .statement, [data-no-fade]') && !el.querySelector('.line'))
    fixed.forEach((el) => M.fadeIn(el, base, 320))
    M.enter(lines, base)
    M.enter($$('[data-reveal="0"]', entering), base + 140)
  }

  // ── Navigation (one global rule) ──────────────────────────────────
  // Next: a running animation finishes first; a playing video needs a second press; then next step; then next slide.
  function next() {
    if (M.isRunning()) { M.finishAll(); return }
    const s = slides[cur]
    const it = media.current()
    if (it && it.state === 'playing') { if (!media.confirmSkip()) return; media.act('skip', it) }
    if (step < s.steps - 1) go(cur, step + 1, 'step')
    else if (cur < slides.length - 1) go(cur + 1, 0, 'enter')
  }
  function prev() {
    M.finishAll()
    if (step > 0) go(cur, step - 1, 'instant')
    else if (cur > 0) go(cur - 1, slides[cur - 1].steps - 1, 'instant')
  }
  function goto(id, k) {
    const i = typeof id === 'number' ? id : slides.findIndex((s) => s.id === id)
    if (i < 0) return false
    M.finishAll()
    go(i, k == null ? 0 : k, 'instant')
    return true
  }
  function parseHash() {
    const m = /^#(S\d\d)(?:\.(\d+))?$/.exec(location.hash)
    return m ? { id: m[1], step: Number(m[2] || 0) } : null
  }

  // ── HUD ───────────────────────────────────────────────────────────
  let toastTimer = 0
  function toast(msg) {
    if (EMBED) return
    const t = $('#toast')
    t.textContent = msg
    t.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600)
  }
  function overlay(id, open) {
    const el = $('#' + id)
    const want = open == null ? !el.classList.contains('open') : open
    $$('.overlay').forEach((o) => o.classList.remove('open'))
    if (want) {
      if (id === 'overview') buildOverview()
      el.classList.add('open')
    }
  }
  const overlayOpen = () => !!$('.overlay.open')
  function buildOverview() {
    const grid = $('#overview .grid')
    grid.innerHTML = ''
    slides.forEach((s, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = i === cur ? 'current' : ''
      const cfg = (C.slides || {})[s.id] || {}
      b.textContent = `${s.id}${cfg.optional ? ' · optional' : ''}${cfg.seconds ? ' · ' + cfg.seconds + ' s' : ''}`
      const t = document.createElement('b')
      t.textContent = titleOf(s)
      b.appendChild(t)
      b.addEventListener('click', () => { overlay('overview', false); goto(i, 0) })
      grid.appendChild(b)
    })
  }
  /** Full motion on every launch: neither the OS "reduce motion" setting (often off on school / remote PCs) nor a
   *  remembered choice decides it, so the deck looks the same from file://, a server or any machine. A = this session. */
  function setReduced(v, announce) {
    M.setReduced(v)
    body.classList.toggle('reduced', v)
    if (announce) toast(v ? 'Animations reduced (this session)' : 'Animations on')
  }
  function openPresenter() {
    const q = PALETTE ? '?palette=' + encodeURIComponent(PALETTE) : ''
    presenter = window.open(`presenter.html${q}`, 'deck-presenter', 'popup,width=1360,height=860')
    if (!presenter) toast('Pop-up blocked — allow pop-ups, or open presenter.html in a second window')
    else setTimeout(broadcast, 600)
  }
  function broadcast() {
    if (EMBED) return
    const msg = Object.assign({ ns: 'deck', type: 'state' }, api.state())
    try { if (presenter && !presenter.closed) presenter.postMessage(msg, '*') } catch (e) {}
    try { if (channel) channel.postMessage(msg) } catch (e) {}
  }
  const seen = []
  function onCommand(d, source) {
    if (!d || d.ns !== 'deck') return
    if (EMBED) {
      if (d.type === 'goto') { M.finishAll(); go(slides.findIndex((s) => s.id === d.slide), d.step || 0, 'instant') }
      return
    }
    if (d.mid) { if (seen.includes(d.mid)) return; seen.push(d.mid); if (seen.length > 50) seen.shift() }
    if (source && d.from === 'presenter') presenter = source
    if (d.type === 'hello') broadcast()
    else if (d.type === 'cmd') {
      if (d.cmd === 'next') next()
      else if (d.cmd === 'prev') prev()
      else if (d.cmd === 'goto') goto(d.slide, d.step)
      else if (d.cmd === 'blackout') body.classList.toggle('blackout')
      else if (d.cmd === 'media') media.act(d.act)
    }
  }
  addEventListener('message', (e) => onCommand(e.data, e.source))
  if (channel) channel.onmessage = (e) => onCommand(e.data, null)

  // ── Input ─────────────────────────────────────────────────────────
  let digits = ''
  let digitTimer = 0
  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const k = e.key
    if (k === 'Escape') { overlay('help', false); overlay('overview', false); return }
    if (overlayOpen() && k !== '?' && k !== 'g' && k !== 'G') return
    if (/^\d$/.test(k)) {
      digits += k
      clearTimeout(digitTimer)
      digitTimer = setTimeout(() => { digits = '' }, 1600)
      return
    }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'n': case 'N': next(); break
      case 'Enter':
        if (digits) { goto(Math.min(slides.length, Number(digits)) - 1, 0); digits = '' } else next()
        break
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': prev(); break
      case 'Home': goto(0, 0); break
      case 'End': goto(slides.length - 1, 0); break
      case 'g': case 'G': overlay('overview'); break
      case '?': case 'h': case 'H': overlay('help'); break
      case 'k': case 'K': media.act('play'); break
      case 'j': case 'J': media.act('restart'); break
      case 'l': case 'L': media.act('skip'); break
      case 'm': case 'M': media.act('mute'); break
      case 's': case 'S': openPresenter(); break
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        else document.documentElement.requestFullscreen().catch(() => toast('Fullscreen was refused — use F11 instead'))
        break
      case 'b': case 'B': case '.': body.classList.toggle('blackout'); break
      case 'a': case 'A': setReduced(!M.reduced, true); break
      default: return
    }
    e.preventDefault()
  }

  // ── Static / reading mode (PDF export) ────────────────────────────
  function buildStatic() {
    body.classList.add('mode-static', 'is-ready')
    slides.forEach((s) => setStep(s, s.steps - 1))
    fit()
  }

  // ── Public runtime contract (tests, presenter, export) ────────────
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()))
  const api = {
    next, prev, goto,
    finish: () => M.finishAll(),
    state() {
      const s = slides[cur]
      return {
        slide: s.id, index: cur, step, steps: s.steps, total: slides.length, theme: themeOf(cur),
        animating: M.isRunning(), motion: M.reduced ? 'reduced' : 'full', mode: STATIC ? 'static' : EMBED ? 'embed' : 'live',
        title: titleOf(s), media: media.snapshot(),
        slides: slides.map((x) => ({ id: x.id, steps: x.steps })),
      }
    },
    async ready() {
      await document.fonts.ready
      const root = STATIC ? stage : slides[cur]
      const imgs = $$('img', root).filter((im) => !im.hidden && im.getAttribute('src'))
      await Promise.all(imgs.map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r }))))
      let guard = 0
      while (M.isRunning() && guard++ < 600) await frame()
      await frame(); await frame()
      return true
    },
    setMotion(v) { setReduced(v === 'reduced') },
  }
  window.deck = api

  // ── Boot ──────────────────────────────────────────────────────────
  function boot() {
    if (EMBED) body.classList.add('embed')
    setReduced(EMBED || params.get('motion') === 'reduced')
    media.init()
    if (STATIC) { buildStatic(); return }
    fit()
    const h = parseHash()
    const start = h ? Math.max(0, slides.findIndex((s) => s.id === h.id)) : 0
    go(start, h ? h.step : 0, 'boot')
    const reveal = () => body.classList.add('is-ready')
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(reveal, reveal)
    if (EMBED) return
    addEventListener('keydown', onKey)
    addEventListener('hashchange', () => { const p = parseHash(); if (p && (p.id !== slides[cur].id || p.step !== step)) goto(p.id, p.step) })
    stage.addEventListener('click', (e) => { if (!e.target.closest('button, a, .overlay')) next() })
    // right-click = back one step; the browser menu stays on buttons and links
    stage.addEventListener('contextmenu', (e) => { if (e.target.closest('button, a, .overlay')) return; e.preventDefault(); prev() })
    let tx = null
    stage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX }, { passive: true })
    stage.addEventListener('touchend', (e) => {
      if (tx == null) return
      const dx = e.changedTouches[0].clientX - tx
      if (Math.abs(dx) > 50) (dx < 0 ? next : prev)()
      tx = null
    })
    $$('.overlay').forEach((o) => o.addEventListener('click', (e) => { if (e.target === o) overlay(o.id, false) }))
  }
  try { boot() } catch (err) { body.classList.add('is-ready'); console.error('[deck] boot failed', err) }
})()
