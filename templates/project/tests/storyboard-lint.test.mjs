import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { collectNames, lintNames } from '../scripts/lint-storyboard.mjs'

const catalog = JSON.parse(readFileSync(new URL('../design/recipes/catalog.json', import.meta.url), 'utf8'))

test('a system hand-off may repeat and a starring recipe may not', () => {
  const text = `
slides:
  - id: S01
    transition: overlap-handoff
    steps:
      - recipe: deal-in
  - id: S02
    transition: overlap-handoff
    steps:
      - recipe: deal-in
`
  const { problems } = lintNames(collectNames(text), catalog)
  assert.equal(problems.length, 1)
  assert.match(problems[0].message, /deal-in/)
})

test('unknown recipe names are warnings', () => {
  const { problems } = lintNames(collectNames('recipe: not-a-card\n'), catalog)
  assert.equal(problems.length, 1)
  assert.match(problems[0].message, /unknown/)
})

test('comments do not count, and two page-turns are inside the limit', () => {
  const text = `
# recipe: deal-in
transition: page-turn
transition: page-turn
`
  const { problems, counts } = lintNames(collectNames(text), catalog)
  assert.deepEqual(problems, [])
  assert.equal(counts['page-turn'], 2)
})

test('a third chapter wipe is over the limit', () => {
  const text = 'transition: wipe-chapter\ntransition: wipe-chapter\ntransition: wipe-chapter\n'
  const { problems } = lintNames(collectNames(text), catalog)
  assert.equal(problems.length, 1)
})
