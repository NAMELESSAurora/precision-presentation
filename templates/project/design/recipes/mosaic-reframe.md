---
id: mosaic-reframe
one line: The same set of images changes layout — grid, then one hero plus the rest, then a looser scatter — with a breath between.
when: The claim is "the same material, three readings". A portfolio, a set of cases, a contact sheet that becomes an argument.
limit: once
---

## Intent

Adapted from video-shotcraft `mosaic-reframe`. The layout thinks. In a talk, each arrangement is its own Next, not a 7 second autoplay. The audience needs a still moment on each arrangement (DR1) or the three states smear into one.

## Motion core

- Positions and sizes are real layout (grid areas or absolute design-px slots), interpolated with transform only if you also accept that text inside will not reflow. Prefer FLIP between two CSS layouts: measure, invert, play, then clear the transform so the CSS grid is the end state.
- Move duration about 700ms, `cubic-bezier(.75, 0, .15, 1)` (slow start, fast middle, long settle). Stagger across the set ≤ 120ms total. More than that and the wave is the hero instead of the layout.
- A 3.5% lift at mid-flight is enough. No 1.22 overshoot unless the decision log allows a physical drop.
- Do not change z-order while boxes overlap. Switch stacking on the frame the overlap starts, from a state that did not overlap.
- Photos use `object-fit: cover` inside clipped frames (DQ1: no dot mask).
- Reduced motion: cut to the destination layout with a 160ms fade. Static/PDF: the last arrangement only, unless the storyboard's static note says to show the hero arrangement.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Move | 700ms, .75, 0, .15, 1 | The film used 26–30 frames (~900ms) plus holds. The holds are the speaker |
| Stagger span | ≤ 120ms | 0 feels like a pop; a long wave hides the layout |
| Lift | 3.5% | More and the tiles become cards in flight |
| Steps | one arrangement per Next | Combining two reframes on one press skips the reading |

## Pitfalls

- Animating `width`/`height` reflows text and fights the layout gate. FLIP, then remove the transform.
- A scatter that throws type off the safe area. Check the end state with `qa:layout`, not the mid-flight.
- Using this and `flip-select`. Both are "the grid becomes one". Pick one.

## Reference

Call `DECK_RECIPES.transition.flipFrom` per tile from its old slot to its new slot, with delays inside 120ms, or one FLIP pass you write next to `transition()`. There is no single `data-anim` because each tile has its own from-box.
