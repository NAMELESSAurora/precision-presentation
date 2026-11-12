/* Presenter window: notes, timer, current + next previews (notes load ONLY here, never in the audience window). Talks to the audience deck via window.opener
 * (postMessage works on file:// too) and BroadcastChannel when served over http. */
(function () {
  'use strict'
  const N = window.DECK_NOTES
  const C = window.DECK_CONTENT
  const $ = (id) => document.getElementById(id)
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('deck-' + (C.package || 'deck')) : null
  const params = new URLSearchParams(location.search)
  const palette = params.get('palette')
  if (palette) document.documentElement.dataset.palette = palette
  if (palette) {
    const q = `embed=1&palette=${encodeURIComponent(palette)}`
    ;['curf', 'nextf'].forEach((id) => { $(id).src = `index.html?${q}` })
  }
  let state = null
  let lastSeen = 0
  let started = null
  let accumulated = 0

  const order = Object.keys(C.slides)
  const bodyTarget = order.reduce((n, id) => n + C.slides[id].seconds, 0)
  const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }
  const elapsed = () => accumulated + (started ? performance.now() - started : 0)

  let seq = 0
  const tag = Math.random().toString(36).slice(2, 8)
  function send(msg) {
    const m = Object.assign({ ns: 'deck', from: 'presenter', mid: `${tag}-${++seq}` }, msg)
    try { if (window.opener && !window.opener.closed) window.opener.postMessage(m, '*') } catch (e) {}
    try { if (channel) channel.postMessage(m) } catch (e) {}
  }
  const cmd = (c, extra) => send(Object.assign({ type: 'cmd', cmd: c }, extra))

  function nextOf(s) {
    if (s.step < s.steps - 1) return { slide: s.slide, step: s.step + 1 }
    const i = s.index + 1
    return i < s.slides.length ? { slide: s.slides[i].id, step: 0 } : null
  }
  function frameGoto(frame, target) {
    try { frame.contentWindow.postMessage({ ns: 'deck', type: 'goto', slide: target.slide, step: target.step }, '*') } catch (e) {}
  }

  function render() {
    if (!state) return
    const n = N[state.slide] || { cues: [] }
    frameGoto($('curf'), state)
    const nx = nextOf(state)
    if (nx) frameGoto($('nextf'), nx)
    $('curcap').textContent = `${state.slide} — ${state.title}`
    $('stepcap').textContent = `step ${state.step + 1} / ${state.steps}${Object.values(state.media.video).includes('playing') ? ' · video playing' : ''}`
    $('nextcap').textContent = nx ? `Next: ${nx.slide}${nx.slide === state.slide ? ' · step ' + (nx.step + 1) : ''}` : 'End of deck'
    const cues = n.cues.map((c, i) => `<li class="${i === state.step ? 'now' : i < state.step ? 'done' : ''}">${esc(c)}</li>`).join('')
    $('notes').innerHTML = `
      <h1>${state.slide} · ${esc(state.title)}</h1>
      <p class="goal">${n.seconds ? n.seconds + ' s' : 'not read aloud'}${n.optional ? ' · skippable on the short path' : ''} — ${esc(n.goal || '')}</p>
      <ol>${cues}</ol>
      ${n.bridge ? `<div class="bridge">→ ${esc(n.bridge)}</div>` : ''}
      ${Array.isArray(n.moved) && n.moved.length ? `<div class="meta"><b>Moved off the slide</b><br>${n.moved.map((line) => esc(line)).join('<br>')}</div>` : ''}
      <div class="meta"><b>Sources</b> ${esc(n.sources || '')}<br><b>Limits</b> ${esc(n.limits || '')}</div>`
    const cur = $('notes').querySelector('li.now')
    if (cur) cur.scrollIntoView({ block: 'nearest' })
    Array.from($('list').children).forEach((b) => b.classList.toggle('cur', b.dataset.id === state.slide))
    pace()
  }
  function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]) }

  function pace() {
    $('clock').textContent = fmt(elapsed())
    if (!state) return
    const idx = order.indexOf(state.slide)
    const before = order.slice(0, idx).reduce((n, id) => n + C.slides[id].seconds, 0) * 1000
    const delta = elapsed() - before
    const tgt = C.slides[state.slide] ? C.slides[state.slide].seconds : 0
    const cls = started || accumulated ? (delta > 15000 ? 'behind' : delta < -15000 ? 'ahead' : '') : ''
    $('pace').innerHTML = `Target ${fmt(bodyTarget * 1000)} body · this slide <b>${tgt ? tgt + ' s' : '—'}</b> · planned start ${fmt(before)} <span class="${cls}">${cls ? (cls === 'behind' ? '· behind ' : '· ahead ') + fmt(Math.abs(delta)) : ''}</span>`
    const live = performance.now() - lastSeen < 5000
    $('conn').textContent = live ? 'Connected to audience window' : 'Not connected — open this window from the deck with S'
    $('conn').classList.toggle('off', !live)
  }
  function toggleTimer() {
    if (started) { accumulated += performance.now() - started; started = null; $('tstart').textContent = 'Resume timer (T)' }
    else { started = performance.now(); $('tstart').textContent = 'Pause timer (T)' }
  }
  function resetTimer() { started = null; accumulated = 0; $('tstart').textContent = 'Start timer (T)'; pace() }

  function onMsg(d) {
    if (!d || d.ns !== 'deck' || d.type !== 'state') return
    lastSeen = performance.now()
    state = d
    if (!$('list').children.length) buildList(d.slides)
    render()
  }
  function buildList(slides) {
    slides.forEach((s) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = s.id.slice(1)
      b.dataset.id = s.id
      if (C.slides[s.id] && C.slides[s.id].optional) b.classList.add('opt')
      b.title = s.id
      b.addEventListener('click', () => cmd('goto', { slide: s.id, step: 0 }))
      $('list').appendChild(b)
    })
  }

  addEventListener('message', (e) => onMsg(e.data))
  if (channel) channel.onmessage = (e) => onMsg(e.data)
  document.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => cmd(b.dataset.cmd)))
  document.querySelectorAll('[data-media]').forEach((b) => b.addEventListener('click', () => cmd('media', { act: b.dataset.media })))
  $('tstart').addEventListener('click', toggleTimer)
  $('treset').addEventListener('click', resetTimer)
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const k = e.key
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'n', 'N', 'Enter'].includes(k)) cmd('next')
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) cmd('prev')
    else if (k === 'b' || k === 'B' || k === '.') cmd('blackout')
    else if (k === 'k' || k === 'K') cmd('media', { act: 'play' })
    else if (k === 'l' || k === 'L') cmd('media', { act: 'skip' })
    else if (k === 'j' || k === 'J') cmd('media', { act: 'restart' })
    else if (k === 'm' || k === 'M') cmd('media', { act: 'mute' })
    else if (k === 't' || k === 'T') toggleTimer()
    else if (k === 'r' || k === 'R') resetTimer()
    else return
    e.preventDefault()
  })
  // Re-handshake until the deck answers (covers deck reloads and late iframe loads).
  setInterval(() => { if (performance.now() - lastSeen > 2000) send({ type: 'hello' }); pace() }, 500)
  $('curf').addEventListener('load', () => state && render())
  $('nextf').addEventListener('load', () => state && render())
  send({ type: 'hello' })
})()
