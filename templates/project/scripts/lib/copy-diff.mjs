// Visible copy per <section id>, for the copy-moved-to-notes ledger.
// Compares source HTML (the running head is injected by deck.js and is not part of the diff).
export function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
}

export function sectionLines(html) {
  const map = new Map()
  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi
  let m
  while ((m = re.exec(html))) {
    const id = /\bid="([^"]+)"/.exec(m[1])?.[1]
    if (!id) continue
    let body = m[2]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|figcaption|tr|blockquote)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
    body = decodeEntities(body)
    const lines = []
    for (const raw of body.split('\n')) {
      const line = raw.replace(/\s+/g, ' ').trim()
      if (line) lines.push(line)
    }
    map.set(id, lines)
  }
  return map
}

function tally(arr) {
  const m = new Map()
  for (const line of arr) m.set(line, (m.get(line) || 0) + 1)
  return m
}

export function diffLines(before, after) {
  const A = tally(before), B = tally(after)
  const removed = [], added = []
  for (const key of new Set([...A.keys(), ...B.keys()])) {
    const d = (A.get(key) || 0) - (B.get(key) || 0)
    if (d > 0) for (let i = 0; i < d; i++) removed.push(key)
    else if (d < 0) for (let i = 0; i < -d; i++) added.push(key)
  }
  return { removed, added }
}

export function diffSections(beforeHtml, afterHtml) {
  const A = sectionLines(beforeHtml), B = sectionLines(afterHtml)
  const ids = [...new Set([...A.keys(), ...B.keys()])]
  return ids.map((id) => ({ id, ...diffLines(A.get(id) || [], B.get(id) || []) }))
}

const SOURCE_TAG = /\[R\d+\]/g

/** Source tags that left the slide and are not repeated in notes.moved. */
export function droppedTags(removed, stillOnSlide, moved) {
  const kept = new Set()
  for (const line of [...stillOnSlide, ...(moved || [])]) for (const tag of line.match(SOURCE_TAG) || []) kept.add(tag)
  const missing = []
  for (const line of removed) for (const tag of line.match(SOURCE_TAG) || []) if (!kept.has(tag) && !missing.includes(tag)) missing.push(tag)
  return missing
}

export function renderDiff(rows, { title = 'Copy moved off the slides' } = {}) {
  let md = `# ${title}\n\n`
  md += 'Lines below were removed or shortened on the slide. The full text belongs in `src/js/notes.js` as `moved` '
  md += '(presenter window and `speaker-notes.md`, “Moved off the slide”). '
  md += 'Spoken word count uses `cues` only, so moving copy does not change it.\n\n```\n'
  for (const row of rows) {
    md += `## ${row.id} removed ${row.removed.length} added ${row.added.length}\n`
    for (const line of row.removed) md += `  -  ${line}\n`
    for (const line of row.added) md += `  +  ${line}\n`
  }
  md += '```\n'
  return md
}
