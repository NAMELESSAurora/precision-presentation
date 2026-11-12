// Contact sheets and side-by-side stills via ffmpeg (no Python imaging dependency).
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

function fontFile() {
  const candidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
  ]
  return candidates.find((f) => existsSync(f)) || ''
}

export function contactSheet(files, out, { cols = 6, thumb = 320 } = {}) {
  if (!files.length) throw new Error('contactSheet: no images')
  const tw = thumb
  const th = Math.round(thumb * 9 / 16)
  const args = ['-loglevel', 'error', '-y']
  for (const f of files) args.push('-i', f)
  const filters = []
  const layout = []
  files.forEach((_, i) => {
    filters.push(`[${i}:v]scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:color=0x1a1a1a,setsar=1[s${i}]`)
    const c = i % cols
    const r = Math.floor(i / cols)
    layout.push(`${c * tw}_${r * th}`)
  })
  filters.push(`${files.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout.join('|')}[out]`)
  args.push('-filter_complex', filters.join(';'), '-map', '[out]', '-frames:v', '1', out)
  execFileSync('ffmpeg', args)
  return out
}

export function sideBySide(before, after, out, { crop = '', thumb = 960, labelBefore = 'before', labelAfter = 'after' } = {}) {
  const font = fontFile()
  const label = (tag, text) => (font
    ? `,drawtext=fontfile=${font}:text='${text.replace(/'/g, '')}':x=16:y=16:fontsize=28:fontcolor=white:box=1:boxcolor=0x00000099`
    : '')
  const cropF = crop ? `crop=${crop},` : ''
  const filter = `[0:v]${cropF}scale=${thumb}:-1,setsar=1${label(0, labelBefore)}[a];[1:v]${cropF}scale=${thumb}:-1,setsar=1${label(1, labelAfter)}[b];[a][b]hstack=inputs=2[out]`
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', before, '-i', after, '-filter_complex', filter, '-map', '[out]', '-frames:v', '1', out])
  return out
}

/** Filmstrip of already-rendered frames, with a millisecond label when a font is available. */
export function filmstrip(frames, out, { cols = 4, thumb = 480, dt = 1000 / 60 } = {}) {
  const font = fontFile()
  const tw = thumb
  const th = Math.round(thumb * 9 / 16)
  const args = ['-loglevel', 'error', '-y']
  frames.forEach((f) => args.push('-i', f.file))
  const filters = []
  const layout = []
  frames.forEach((f, i) => {
    const ms = f.ms != null ? f.ms : Math.round((f.index || i) * dt)
    const draw = font
      ? `,drawtext=fontfile=${font}:text='${ms} ms':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=0x000000cc`
      : ''
    filters.push(`[${i}:v]scale=${tw}:${th}:force_original_aspect_ratio=decrease,pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:color=0x222222,setsar=1${draw}[s${i}]`)
    layout.push(`${(i % cols) * tw}_${Math.floor(i / cols) * th}`)
  })
  filters.push(`${frames.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${frames.length}:layout=${layout.join('|')}[out]`)
  args.push('-filter_complex', filters.join(';'), '-map', '[out]', '-frames:v', '1', out)
  execFileSync('ffmpeg', args)
  return out
}
