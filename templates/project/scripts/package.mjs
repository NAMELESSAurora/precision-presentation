// Release: release/<name>/ (the show folder = dist/), release/<name>.zip, release/<name>_Presentation.pdf (submission PDF).
// Checks that every file of the folder is in the zip with the same size. Run after export-pdf.mjs and build.mjs.
import { cpSync, rmSync, mkdirSync, existsSync, statSync, readdirSync, readFileSync } from 'node:fs'
import { resolve, join, relative, sep } from 'node:path'
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'

const ctx = { window: {} }
vm.runInNewContext(readFileSync('src/js/content.js', 'utf8'), ctx)
const NAME = (ctx.window.DECK_CONTENT.package || 'Presentation').replace(/[^\w.-]+/g, '_')
const rel = resolve('release')
const dir = resolve(rel, NAME)
const zip = resolve(rel, `${NAME}.zip`)
const pdf = resolve(rel, `${NAME}_Presentation.pdf`)
for (const f of ['dist/index.html', 'export/reading.pdf']) {
  if (!existsSync(f)) { console.error(`missing ${f} — run export-pdf.mjs and build.mjs first`); process.exit(1) }
}
rmSync(rel, { recursive: true, force: true })
mkdirSync(rel, { recursive: true })
cpSync('dist', dir, { recursive: true })
cpSync('export/reading.pdf', pdf)
const TAR = process.platform === 'win32' ? 'C:/Windows/System32/tar.exe' : 'bsdtar'
execFileSync(TAR, ['-a', '-cf', zip, '-C', rel, NAME])

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]))
const want = new Map(walk(dir).map((f) => [`${NAME}/${relative(dir, f).split(sep).join('/')}`, statSync(f).size]))
const got = new Map()
for (const line of execFileSync(TAR, ['-tvf', zip], { maxBuffer: 1 << 26 }).toString().split(/\r?\n/)) {
  const m = /^\S+\s+\S+\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+(.+)$/.exec(line)
  if (m && !m[2].endsWith('/')) got.set(m[2], Number(m[1]))
}
const bad = [...want].filter(([f, n]) => got.get(f) !== n)
console.log(`folder: ${want.size} files → ${dir}`)
console.log(`zip:    ${got.size} files, ${(statSync(zip).size / 1e6).toFixed(1)} MB → ${zip}`)
console.log(`pdf:    ${(statSync(pdf).size / 1e6).toFixed(1)} MB → ${pdf}`)
if (bad.length) { console.error('zip mismatch:', bad.slice(0, 10)); process.exit(1) }
console.log('zip matches the folder')
