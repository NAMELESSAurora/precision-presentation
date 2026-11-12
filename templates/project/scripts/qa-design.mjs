// Design-quality guardrails learned from review, applied as early warnings.
// Halftone / dot masks fail the process (exit 1). Palette, mono-as-display and SVG-as-illustration warn.
// Usage: node scripts/qa-design.mjs [--root .] [--strict]
// --strict also fails on warnings. The scaffold's placeholder orange+blue tokens warn until P2 replaces them.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseArgs } from './lib/session.mjs'

const { opt, flag } = parseArgs()
const root = opt('root', '.')
const STRICT = flag('strict')
const blocks = []
const warns = []

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'release') continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

function hue(hex) {
  const n = hex.replace('#', '')
  if (n.length !== 6) return null
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max - min < 0.12) return null
  const d = max - min
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  if (h < 0) h += 360
  return h
}
const isOrange = (h) => h != null && h >= 8 && h <= 45
const isBlue = (h) => h != null && h >= 200 && h <= 255

const files = walk(root).filter((p) => /\.(css|html|svg|md)$/.test(p) && !p.includes(`${join('qa', 'fixtures')}`))
const css = files.filter((p) => p.endsWith('.css')).map((p) => ({ p, t: readFileSync(p, 'utf8') }))

for (const { p, t } of css) {
  if (/halftone|dot-screen|dot screen/i.test(t)) blocks.push(`${relative(root, p)}: halftone / dot-screen treatment`)
  const rules = t.split('}')
  for (const rule of rules) {
    if (/mask(-image)?\s*:/.test(rule) && /radial-gradient|repeating-radial-gradient/.test(rule)) {
      blocks.push(`${relative(root, p)}: radial mask (dot screen or vignette over a photo)`)
    }
  }
}
const html = files.filter((p) => p.endsWith('.html')).map((p) => readFileSync(p, 'utf8')).join('\n')
if (/halftone|dot-screen/i.test(html)) blocks.push('html: halftone / dot-screen')

const tokensPath = join(root, 'src/styles/tokens.css')
if (existsSync(tokensPath)) {
  const tokens = readFileSync(tokensPath, 'utf8')
  const accents = [...tokens.matchAll(/--(?:night|day)-(?:accent|em|accent-text)\s*:\s*(#[0-9a-fA-F]{3,8})/g)]
  const hues = accents.map((m) => ({ name: m[0].split(':')[0].trim(), hex: m[1].length === 4 ? '#' + [...m[1].slice(1)].map((c) => c + c).join('') : m[1], h: hue(m[1].length === 4 ? '#' + [...m[1].slice(1)].map((c) => c + c).join('') : m[1]) }))
  const orange = hues.filter((x) => isOrange(x.h))
  const blue = hues.filter((x) => isBlue(x.h))
  if (orange.length && blue.length) {
    warns.push(`tokens.css pairs orange (${orange.map((x) => x.hex).join(', ')}) with blue (${blue.map((x) => x.hex).join(', ')}). That pair reads as a template. The scaffold values are placeholders — replace them at P2.`)
  }
}

for (const { p, t } of css) {
  const rules = t.split('}')
  for (const rule of rules) {
    const sel = rule.split('{')[0] || ''
    if (!/font-family/.test(rule) || !/var\(--mono\)|DM Mono|ui-monospace/.test(rule)) continue
    if (/\.title|\.statement|(^|[\s,])h1\b|\.cover/.test(sel) && !/label|\.head|\.btn/.test(sel)) {
      warns.push(`${relative(root, p)}: display type set in monospace (${sel.trim().slice(0, 80)}). Design sense should come from layout and the text face, not mono everywhere.`)
    }
  }
}

function svgs(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) svgs(p, acc)
    else if (name.endsWith('.svg')) acc.push(p)
  }
  return acc
}
for (const p of svgs(join(root, 'assets'))) {
  warns.push(`${relative(root, p)}: SVG asset. Prefer a real open-licensed photo. A diagram drawn in markup must be labelled made here.`)
}

console.log('Design guardrails')
if (!blocks.length && !warns.length) console.log('  no findings')
for (const b of blocks) console.log('  block:', b)
for (const w of warns) console.log('  warn:', w)
console.log('  eye: put every final step on one contact sheet; if two neighbours could swap layouts, one is wrong.')
console.log('  eye: photos stay in natural colour — no dot mask, no translucent veil, no washed-out grid.')
console.log('  eye: stand-in photos say so on the slide. Motion hands elements across the cut instead of a hard cut.')
if (blocks.length || (STRICT && warns.length)) process.exit(1)
