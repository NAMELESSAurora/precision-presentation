// Shared CLI + browser session for the QA scripts.
// Launch Playwright's pinned browser (npm script), or a system Chrome when
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set. Do not shell out to bare `npx`.
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'

const FLAGS = new Set([
  'static', 'mid', 'gate', 'no-video', 'reduced', 'keep-frames', 'decode', 'strict',
])

export function parseArgs(argv = process.argv.slice(2)) {
  const opt = (k, d) => {
    const eq = argv.find((a) => a.startsWith(`--${k}=`))
    if (eq) return eq.slice(k.length + 3)
    const i = argv.indexOf(`--${k}`)
    if (i < 0) return d
    if (FLAGS.has(k)) return true
    return argv[i + 1]
  }
  const flag = (k) => argv.includes(`--${k}`)
  const consumed = new Set()
  argv.forEach((a, i) => {
    if (!a.startsWith('--')) return
    consumed.add(i)
    const name = a.slice(2).split('=')[0]
    if (!a.includes('=') && !FLAGS.has(name)) consumed.add(i + 1)
  })
  const positional = argv.filter((_, i) => !consumed.has(i))
  return { opt, flag, positional }
}

/** True 16:9 viewports. Layout is checked in 1920×1080 design px, so these mostly prove the scale. */
export const VIEWS_16_9 = [[1920, 1080], [1600, 900], [1280, 720], [2560, 1440]]

export function parseViews(s) {
  if (!s || s === '16:9') return VIEWS_16_9.map((v) => v.slice())
  return s.split(',').filter(Boolean).map((v) => v.split('x').map(Number))
}

export function launchOpts() {
  const opts = {}
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) opts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const extra = (process.env.PLAYWRIGHT_CHROMIUM_ARGS || '').split(/[,\s]+/).filter(Boolean)
  if (extra.length) opts.args = extra
  return opts
}

function waitPort(port, timeout = 8000) {
  const t0 = Date.now()
  return new Promise((resolve, reject) => {
    const once = () => {
      const sock = createConnection({ port, host: '127.0.0.1' }, () => { sock.end(); resolve() })
      sock.on('error', () => {
        sock.destroy()
        if (Date.now() - t0 > timeout) reject(new Error(`serve.mjs did not open port ${port}`))
        else setTimeout(once, 80)
      })
    }
    once()
  })
}

/** Start scripts/serve.mjs and a browser. Caller must `close()`. */
export async function openDeck({ root = '.' } = {}) {
  const port = 4400 + Math.floor(Math.random() * 1400)
  const server = spawn(process.execPath, ['scripts/serve.mjs', root, '--port', String(port)], { stdio: 'ignore' })
  await waitPort(port)
  const browser = await chromium.launch(launchOpts())
  const url = (query = '') => `http://127.0.0.1:${port}/index.html${query ? (query.startsWith('?') ? query : '?' + query) : ''}`
  return {
    port, browser, url,
    async close() { await browser.close().catch(() => {}); server.kill() },
  }
}
