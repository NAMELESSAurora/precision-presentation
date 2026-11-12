---
id: flip-select
one line: The chosen tile flies out of the grid into its large place. The others leave.
when: One item is picked from a set that is already on the slide (1 of 12).
limit: once
---

## Intent

Selection should be the same object changing size, not a new picture fading up. On the stools slide, the chosen stool leaves its cell and arrives beside the big "1 of 12" while the other eleven go.

## Motion core

- `data-flip-from="#the-tile"` on the large figure. On its reveal step, FLIP from that tile's box to the figure's box: `translate` + `scale`, 900ms, `cubic-bezier(.76, 0, .24, 1)`, `fill: backwards`.
- The source tile leaves in the same step (`data-hide`) with no fade of its own, so the two read as one object.
- The rejected tiles leave on their own short exit (up or down, staggered), not a veil over the grid.
- Divide FLIP deltas by the stage scale.
- Reduced motion: 160ms fade; the CSS end state is already the chosen large figure. Static/PDF shows that end state, not the grid.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Flight | 900ms in-out | A beat longer than a fade, shorter than a shared slide flight |
| Others' exit | ~260ms, EXIT .4, 0, .2, 1, stagger ≤ 40ms | They clear; they are not the hero |
| End state | large figure + count | Must exist in CSS before any animation |

## Pitfalls

- A translucent veil over the grid reads as a mask (DQ6). Remove tiles; do not dim them.
- If the source tile fades while the large one fades in, you see two stools.
- `getBoundingClientRect` without dividing by scale misses on a letterboxed viewport.

## Reference

`DECK_RECIPES.transition.flipFrom(largeEl, tileEl, 900)` from the step that reveals the large figure. `data-anim` is not the right hook: the FLIP needs two elements.
