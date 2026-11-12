import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diffSections, droppedTags, sectionLines } from '../scripts/lib/copy-diff.mjs'

const before = `<section id="S02"><h2>Question</h2><p>Claims = our argument, not a quotation [R02]</p></section>
<section id="S03"><p>Kept line</p></section>`
const after = `<section id="S02"><h2>Question</h2><p>The claim is ours [R02]</p></section>
<section id="S03"><p>Kept line</p></section>`

test('section diff lists removed and added lines and ignores unchanged slides', () => {
  const rows = diffSections(before, after)
  const s02 = rows.find((r) => r.id === 'S02')
  const s03 = rows.find((r) => r.id === 'S03')
  assert.deepEqual(s02.removed, ['Claims = our argument, not a quotation [R02]'])
  assert.deepEqual(s02.added, ['The claim is ours [R02]'])
  assert.equal(s03.removed.length, 0)
  assert.equal(s03.added.length, 0)
})

test('a source tag that leaves the slide must be repeated in moved', () => {
  const removed = ['Photo credit [R08] and the long caption']
  const still = ['Photo [R08]']
  assert.deepEqual(droppedTags(removed, still, []), [])
  assert.deepEqual(droppedTags(removed, ['short credit'], []), ['[R08]'])
  assert.deepEqual(droppedTags(removed, ['short credit'], ['Full credit [R08]']), [])
})

test('section text skips svg and collapses whitespace', () => {
  const html = '<section id="S01"><p>Hello&nbsp;&amp;  welcome</p><svg><text>nope</text></svg></section>'
  assert.deepEqual(sectionLines(html).get('S01'), ['Hello & welcome'])
})
