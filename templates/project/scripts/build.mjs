// Show package → dist/: the runnable deck (no transpiling: copies the verified runtime files), reading PDF, presenter docs.
// The normal way to present is double-clicking index.html (file://). start-server.cmd is optional and checks for Node.
import { cpSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const ctx = { window: {} }
vm.runInNewContext(readFileSync('src/js/content.js', 'utf8'), ctx)
const C = ctx.window.DECK_CONTENT
const out = resolve('dist')
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
for (const f of ['index.html', 'presenter.html']) cpSync(f, resolve(out, f))
cpSync('src', resolve(out, 'src'), { recursive: true })
const skipRaw = (p) => !/(^|\/)assets\/(img\/)?raw(\/|$)/.test(p.split('\\').join('/'))
cpSync('assets', resolve(out, 'assets'), { recursive: true, filter: skipRaw })
cpSync('scripts/serve.mjs', resolve(out, 'serve.mjs'))
if (existsSync('export/reading.pdf')) cpSync('export/reading.pdf', resolve(out, 'backup-reading.pdf'))
mkdirSync(resolve(out, 'presenter-docs'), { recursive: true })
for (const f of ['speaker-notes.md', 'run-of-show.md']) if (existsSync(f)) cpSync(f, resolve(out, 'presenter-docs', f))

const cmd = [
  '@echo off',
  'cd /d "%~dp0"',
  'where node >nul 2>nul',
  'if errorlevel 1 (',
  '  echo Node.js is not installed on this PC. It is not needed: just double-click index.html.',
  '  pause',
  '  exit /b',
  ')',
  'start "" /b node serve.mjs . --port 4173',
  'timeout /t 1 >nul',
  'start "" http://127.0.0.1:4173/index.html',
  'echo Keep this window open while presenting.',
  'pause',
]
writeFileSync(resolve(out, 'start-server.cmd'), cmd.join('\r\n') + '\r\n')
writeFileSync(resolve(out, 'START-HERE.txt'), [
  `${C.title} — show package`,
  '',
  'A) Extract the whole zip first (right-click > Extract All). Never run it from inside the zip.',
  'B) Double-click index.html and open it in Chrome or Edge. This is the normal way: everything works offline,',
  '   video and all animations included. The deck always starts with full animations.',
  'C) Keys: right arrow / click = next, left arrow / right-click = back, K = play the video, F = fullscreen,',
  '   S = presenter window (allow pop-ups), ? = all keys. During a video one "next" only warns; a second stops it.',
  'D) start-server.cmd is optional and needs Node.js (school PCs usually do not have it). Not needed.',
  'E) If the browser fails: play the files in assets/media in any video player, and open backup-reading.pdf.',
  'F) presenter-docs/ holds the speaker notes and the run of show.',
].join('\r\n'))
console.log('dist/ ready')
