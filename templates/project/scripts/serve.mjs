// Zero-dependency static server with HTTP Range support (needed for <video> seeking).
// Usage: node scripts/serve.mjs [rootDir=.] [--port 4173]
import { createServer } from 'node:http'
import { createReadStream, statSync, existsSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'

const args = process.argv.slice(2)
const portFlag = args.indexOf('--port')
const port = Number(portFlag >= 0 ? args[portFlag + 1] : process.env.PORT || 4173)
const root = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--port') || '.')

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.pdf': 'application/pdf', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt',
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  let file = normalize(join(root, decodeURIComponent(url.pathname)))
  if (!file.startsWith(root + sep) && file !== root) { res.writeHead(403).end(); return }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return }
  const { size } = statSync(file)
  const headers = { 'content-type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'accept-ranges': 'bytes', 'cache-control': 'no-store' }
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range)
  if (range) {
    const start = range[1] ? Number(range[1]) : size - Number(range[2])
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
    if (start >= size || start > end) { res.writeHead(416, { 'content-range': `bytes */${size}` }).end(); return }
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 })
    createReadStream(file, { start, end }).pipe(res)
  } else {
    res.writeHead(200, { ...headers, 'content-length': size })
    req.method === 'HEAD' ? res.end() : createReadStream(file).pipe(res)
  }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} at http://127.0.0.1:${port}/`))
