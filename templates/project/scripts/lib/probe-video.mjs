// Prove an MP4 is a real frame encode: h264, yuv420p, tv (limited) range, expected size and fps,
// and a full decode that prints nothing on stderr.
import { execFileSync } from 'node:child_process'

export function probeVideo(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_frames,duration,pix_fmt,color_range',
    '-of', 'json', file,
  ], { encoding: 'utf8' })
  const stream = JSON.parse(out).streams?.[0]
  if (!stream) throw new Error(`ffprobe: no video stream in ${file}`)
  return stream
}

export function assertVideo(file, expect = {}) {
  const stream = probeVideo(file)
  const errors = []
  if (stream.codec_name !== 'h264') errors.push(`codec ${stream.codec_name} (want h264)`)
  if (stream.pix_fmt !== 'yuv420p') errors.push(`pix_fmt ${stream.pix_fmt} (want yuv420p, not yuvj420p)`)
  if (stream.color_range && !/^(tv|mpeg)$/.test(stream.color_range)) errors.push(`color_range ${stream.color_range} (want tv)`)
  if (expect.width && Number(stream.width) !== expect.width) errors.push(`width ${stream.width}`)
  if (expect.height && Number(stream.height) !== expect.height) errors.push(`height ${stream.height}`)
  if (expect.fps) {
    const [n, d] = String(stream.r_frame_rate).split('/').map(Number)
    const rate = d ? n / d : n
    if (Math.abs(rate - expect.fps) > 0.2) errors.push(`fps ${rate} (want ${expect.fps})`)
  }
  const decode = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' })
  if (decode && decode.trim()) errors.push(`decode stderr: ${decode.trim().slice(0, 200)}`)
  return { stream, errors }
}

/** JPEG frames are full-range; this forces tv-range yuv420p so players do not wash the picture out. */
export const TV_RANGE_ARGS = [
  '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p',
  '-pix_fmt', 'yuv420p', '-color_range', 'tv',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
]
