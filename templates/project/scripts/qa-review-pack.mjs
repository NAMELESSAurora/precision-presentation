// Bundle a clean-context review brief. It lists rule ids and whatever evidence files exist.
// It does not mark any rule passed. The reviewer should not be the person who built the deck,
// and should not be given the session's reasons — only this pack, the frames, and the rules.
// Usage: node scripts/qa-review-pack.mjs [qa/final-review.md]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from './lib/session.mjs'

const { positional } = parseArgs()
const out = resolve(positional[0] || 'qa/final-review.md')
const rulesPath = resolve('design/aesthetic-rules.md')
const rules = existsSync(rulesPath) ? readFileSync(rulesPath, 'utf8') : ''
const ids = [...rules.matchAll(/^### ([A-Z]+[0-9]+)\. (.+)$/gm)].map((m) => ({ id: m[1], title: m[2] }))

const evidence = [
  'qa/layout-report.json',
  'qa/layout-static.json',
  'qa/layout-mid.json',
  'qa/type-census.json',
  'qa/handoff.json',
  'qa/motion-run/summary.md',
  'qa/qa-report.md',
  'design/decisions.md',
  'design/motion-map.yaml',
  'storyboard.yaml',
  'handoff.md',
].filter((p) => existsSync(resolve(p)))

let md = `# Final review\n\n`
md += `Clean-context review. Do not treat the build diary, chat, or the maker's intent as evidence. `
md += `Each line is \`ID ✓\` or \`ID ✗ (slide.step, file)\` or \`ID ? unable to verify\`. `
md += `A picture claim needs a still or a frame. Rules: \`design/aesthetic-rules.md\`.\n\n`
md += `## Evidence present\n\n`
md += evidence.length ? evidence.map((p) => `- \`${p}\``).join('\n') + '\n' : '_None yet. Do not pass visual checks._\n'
md += `\n## Checks\n\n`
for (const rule of ids) md += `- ${rule.id} ? ${rule.title}\n`
md += `\n## Must fix\n\n-\n\n## Could improve\n\n-\n\n## Unable to verify\n\n-\n`
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, md)
console.log(`${ids.length} rules → ${out}`)
