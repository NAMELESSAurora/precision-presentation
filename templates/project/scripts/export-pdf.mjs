// Reading backup / submission PDF: static mode (every slide in its final state) → export/reading.pdf + previews/.
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

mkdirSync(resolve('export/previews'), { recursive: true })
const port = 4990
const server = spawn(process.execPath, ['scripts/serve.mjs', '.', '--port', String(port)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 600))
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(`http://127.0.0.1:${port}/index.html?mode=static`)
await page.evaluate(() => deck.ready())
const pdf = resolve('export/reading.pdf')
await page.pdf({ path: pdf, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })
const ids = await page.$$eval('.slide', (els) => els.map((e) => e.id))
for (const id of ids) await page.locator(`#${id}`).screenshot({ path: resolve('export/previews', `${id}.png`) })
const pages = (readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
console.log(`PDF pages: ${pages} (slides: ${ids.length}) → ${pdf}`)
await browser.close()
server.kill()
if (pages !== ids.length) process.exit(1)
