// New presentation project from the precision-presentation scaffold.
// Usage: node new-deck.mjs <target-dir> [--title "Title"] [--package Short_Name] [--link-modules <existing node_modules dir>]
// Copies templates/project/ (never writes into the skill), sets the title / package name, optionally links node_modules
// (Windows junction / symlink) so the tests run without `npm install`. Refuses to overwrite a non-empty directory.
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : null }
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
if (!target) { console.error('usage: node new-deck.mjs <target-dir> [--title "Title"] [--package Short_Name] [--link-modules <dir>]'); process.exit(1) }
const dst = resolve(target)
if (existsSync(dst) && readdirSync(dst).length) { console.error(`refusing: ${dst} exists and is not empty`); process.exit(1) }
const src = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'project')
cpSync(src, dst, { recursive: true })

const title = opt('title')
const pkg = opt('package')
if (title || pkg) {
  const cfg = join(dst, 'src/js/content.js')
  let s = readFileSync(cfg, 'utf8')
  if (title) s = s.replace("title: 'Presentation Title'", `title: ${JSON.stringify(title)}`)
  if (pkg) s = s.replace("package: 'Presentation'", `package: ${JSON.stringify(pkg)}`)
  writeFileSync(cfg, s)
  for (const f of ['index.html', 'README.md']) {
    const p = join(dst, f)
    if (title) writeFileSync(p, readFileSync(p, 'utf8').split('Presentation Title').join(title))
  }
}
const mods = opt('link-modules')
if (mods) {
  symlinkSync(resolve(mods), join(dst, 'node_modules'), 'junction')
  console.log(`linked node_modules → ${resolve(mods)}`)
}
console.log(`created ${dst}`)
console.log('next: cd there; npm install (unless linked); npx playwright test; then fill brief.yaml (P0) and follow the skill.')
