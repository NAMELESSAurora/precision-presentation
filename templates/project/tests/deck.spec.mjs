// Runtime contract tests for the scaffold. Keep them passing as slides change; add tests for project-specific behaviour.
// Run: npx playwright test   (set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH if Playwright's own browser cannot be downloaded)
import { test, expect } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const ready = (page) => page.evaluate(() => deck.ready())
const state = (page) => page.evaluate(() => deck.state())
const settle = async (page) => { await page.waitForFunction(() => !deck.state().animating, null, { timeout: 5000 }); await ready(page) }
function watch(page) {
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}
async function invariants(page) {
  const r = await page.evaluate(() => {
    const s = deck.state()
    const slide = document.getElementById(s.slide)
    const wrong = Array.from(slide.querySelectorAll('[data-reveal]')).filter((el) => (Number(el.dataset.reveal) <= s.step) !== el.classList.contains('on')).length
    return { active: document.querySelectorAll('.slide.is-active').length, wrong, step: s.step, steps: s.steps }
  })
  expect(r.active).toBe(1)
  expect(r.wrong).toBe(0)
  expect(r.step).toBeLessThan(r.steps)
}

test('boots clean on S01 with fonts loaded', async ({ page }) => {
  const errors = watch(page)
  await page.goto('/index.html')
  await ready(page)
  expect(await state(page)).toMatchObject({ slide: 'S01', step: 0, mode: 'live' })
  const fams = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))
  expect(fams.length).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('forward through every step, then all the way back', async ({ page }) => {
  await page.goto('/index.html?OPEN=none')
  await ready(page)
  const plan = (await state(page)).slides
  const total = plan.reduce((n, s) => n + s.steps, 0)
  for (let i = 1; i < total; i++) { await page.keyboard.press('ArrowRight'); await settle(page); await invariants(page) }
  const last = plan[plan.length - 1]
  expect(await state(page)).toMatchObject({ slide: last.id, step: last.steps - 1 })
  for (let i = 1; i < total; i++) { await page.keyboard.press('ArrowLeft'); await invariants(page) }
  expect(await state(page)).toMatchObject({ slide: 'S01', step: 0 })
})

test('next during an animation finishes it first; rapid presses stay consistent', async ({ page }) => {
  await page.goto('/index.html#S02')
  await ready(page)
  await page.keyboard.press('ArrowRight')
  expect((await state(page)).animating).toBe(true)
  await page.keyboard.press('ArrowRight')
  expect(await state(page)).toMatchObject({ step: 1, animating: false })
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight', { delay: 20 })
  await settle(page)
  await invariants(page)
})

test('refresh restores slide and step from the URL', async ({ page }) => {
  await page.goto('/index.html#S03.2')
  await ready(page)
  expect(await state(page)).toMatchObject({ slide: 'S03', step: 2 })
  await page.reload()
  await ready(page)
  expect(await state(page)).toMatchObject({ slide: 'S03', step: 2 })
})

test('right-click goes back one step and does not open the browser menu', async ({ page }) => {
  await page.goto('/index.html#S03.2')
  await ready(page)
  const prevented = await page.evaluate(() => {
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 900, clientY: 600 })
    document.getElementById('stage').dispatchEvent(ev)
    return ev.defaultPrevented
  })
  expect(prevented).toBe(true)
  expect(await state(page)).toMatchObject({ slide: 'S03', step: 1 })
  await page.mouse.click(900, 600, { button: 'right' })
  await page.mouse.click(900, 600, { button: 'right' })
  expect((await state(page)).slide).toBe('S02')
})

test('full motion on every launch whatever the OS setting; A toggles for the session; ?motion=reduced works', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/index.html')
  await ready(page)
  expect((await state(page)).motion).toBe('full')
  await page.keyboard.press('a')
  expect((await state(page)).motion).toBe('reduced')
  await page.reload()
  await ready(page)
  expect((await state(page)).motion).toBe('full')
  await page.goto('/index.html?motion=reduced')
  await ready(page)
  expect((await state(page)).motion).toBe('reduced')
})

test('no video: poster, honest status, deck continues', async ({ page }) => {
  await page.goto('/index.html?OPEN=none')
  await ready(page)
  await expect(page.locator('#S01 .mstatus')).toBeVisible()
  await expect(page.locator('#S01 .mbar .btn').first()).toBeHidden()
  await page.keyboard.press('k')
  await expect(page.locator('#toast')).toContainText('No video')
  await page.keyboard.press('ArrowRight')
  await settle(page)
  expect(await state(page)).toMatchObject({ slide: 'S01', step: 1 })
})

test('broken video path fails gracefully', async ({ page }) => {
  await page.goto('/index.html?OPEN=assets/media/does-not-exist.mp4')
  await page.waitForFunction(() => deck.state().media.video.OPEN === 'unavailable', null, { timeout: 8000 })
  await expect(page.locator('#S01 .mstatus')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await settle(page)
  expect(await state(page)).toMatchObject({ slide: 'S01', step: 1 })
})

test('video: explicit play, chrome steps back, second Next stops it, poster after the end and on return', async ({ page }) => {
  await page.goto('/index.html?OPEN=qa/fixtures/test-video.mp4')
  await page.waitForFunction(() => deck.state().media.video.OPEN === 'idle', null, { timeout: 8000 })
  await page.keyboard.press('k')
  await page.waitForFunction(() => deck.state().media.video.OPEN === 'playing')
  await expect(page.locator('#stage')).toHaveClass(/media-live/)
  await page.keyboard.press('ArrowRight') // first press only warns
  await expect(page.locator('#toast')).toContainText('again')
  expect(await state(page)).toMatchObject({ step: 0, media: { video: { OPEN: 'playing' } } })
  await page.keyboard.press('ArrowRight') // second press: stop + next step
  await settle(page)
  let s = await state(page)
  expect(s).toMatchObject({ slide: 'S01', step: 1, media: { video: { OPEN: 'ended' } } })
  expect(await page.evaluate(() => document.querySelector('#S01 .media').classList.contains('started'))).toBe(false)
  await page.keyboard.press('k')
  await page.waitForFunction(() => deck.state().media.video.OPEN === 'playing')
  await page.evaluate(() => deck.goto('S02', 0)) // leaving stops the video
  expect(await page.evaluate(() => document.querySelector('#S01 video').paused)).toBe(true)
  await page.evaluate(() => deck.goto('S01', 0))
  s = await state(page)
  expect(s.media.video.OPEN).toBe('idle')
  expect(await page.evaluate(() => document.querySelector('#S01 video').currentTime)).toBe(0)
})

test('optional text and slots: removed when empty, steps renumber; filled when set', async ({ page }) => {
  await page.goto('/index.html#S05')
  await ready(page)
  expect(await page.locator('#S05 .personal').count()).toBe(0)
  expect((await state(page)).steps).toBe(5) // 3 asks + discussion, the personal step removed
  await page.addInitScript(() => { Object.defineProperty(window, 'DECK_CONTENT', { configurable: true, set(v) { v.text.personal = 'A line.'; Object.defineProperty(window, 'DECK_CONTENT', { value: v, writable: true }) } }) })
  await page.goto('/index.html?fresh=1#S05') // a real navigation, so the init script runs
  await ready(page)
  await expect(page.locator('#S05 .personal')).toHaveText('“A line.”')
  expect((await state(page)).steps).toBe(6)
})

test('static reading mode shows every step and no live controls', async ({ page }) => {
  await page.goto('/index.html?mode=static')
  await ready(page)
  const r = await page.evaluate(() => ({
    hidden: Array.from(document.querySelectorAll('[data-reveal]')).filter((el) => getComputedStyle(el).visibility !== 'visible').length,
    live: Array.from(document.querySelectorAll('.live-only')).filter((el) => getComputedStyle(el).display !== 'none').length,
  }))
  expect(r).toEqual({ hidden: 0, live: 0 })
})

test('offline: no request leaves 127.0.0.1; reference links open in a new tab', async ({ page }) => {
  const external = []
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url())
    if (u.hostname !== '127.0.0.1' && u.protocol !== 'data:') { external.push(u.href); return route.abort() }
    return route.continue()
  })
  const errors = watch(page)
  await page.goto('/index.html')
  await ready(page)
  const plan = (await state(page)).slides
  for (const s of plan) { await page.evaluate((i) => deck.goto(i, 0), s.id); await ready(page) }
  expect(external).toEqual([])
  expect(errors).toEqual([])
  const targets = await page.$$eval('.slide a[href^="http"]', (as) => as.map((a) => a.target))
  expect(targets.every((t) => t === '_blank')).toBe(true)
})

test('runs from file:// without a server', async ({ page }) => {
  const errors = watch(page)
  await page.goto(pathToFileURL(resolve('index.html')).href)
  await ready(page)
  await page.keyboard.press('ArrowRight')
  await settle(page)
  expect(await state(page)).toMatchObject({ slide: 'S01', step: 1 })
  expect(errors).toEqual([])
})

test('presenter window: opens with S, syncs, drives the deck; notes never load in the audience window', async ({ page, context }) => {
  await page.goto('/index.html#S02')
  await ready(page)
  const [pop] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('s')])
  await expect(pop.locator('#notes h1')).toContainText('S02', { timeout: 8000 })
  await pop.keyboard.press('ArrowRight')
  await page.waitForFunction(() => deck.state().step === 1)
  expect(await page.evaluate(() => typeof window.DECK_NOTES)).toBe('undefined')
})
