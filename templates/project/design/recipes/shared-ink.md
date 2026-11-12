---
id: shared-ink
one line: A full panel narrows and slides until it is the band on the next slide. Width and place only.
when: A colour block is the argument's continuation (a verdict panel becoming a column).
limit: once
---

## Intent

S12's ink panel becomes S13's ink band. The audience should see the same block change job, not a new rectangle fading in. Scale Y stays 1 so the block does not squash into a line.

## Motion core

- `data-shared="ink"` and `data-shared-x` on both slides.
- FLIP in design pixels: `translateX` and `scaleX` only, origin on the left or the shared edge, 1000ms, `cubic-bezier(.76, 0, .24, 1)`, `fill: backwards`.
- Hide the leaving block while the entering one flies.
- Type on the block is not part of the stretch. It fades with the hand-off so letters are not smeared by `scaleX`.
- Reduced motion: fade, no stretch. Static/PDF: each slide shows its own final block.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 1000ms | Same family as a full shared flight |
| Easing | .76, 0, .24, 1 | Travel, not an entrance |
| Axes | x and width | Y scale reads as a collapse |
| Lead | T − 120ms | With `overlap-handoff` |

## Pitfalls

- Scaling both axes turns a panel into a postage stamp.
- Text inside the transformed element stretches. Move the words to a sibling that only fades.
- Using this and `shared-scissors` is two stars. Do not also star a third shared flight.

## Reference

`DECK_RECIPES.transition.sharedWidth(fromEl, toEl, 1000)`.
