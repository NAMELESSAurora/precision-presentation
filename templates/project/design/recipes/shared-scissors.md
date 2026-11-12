---
id: shared-scissors
one line: One object flies from its place on this slide to its place on the next, and is the same object the whole way.
when: The same prop is the hero of two neighbours (a tool, a mark, a product).
limit: once
---

## Intent

The cut disappears because the eye is already on the thing that continues. This is the S01 → S02 scissors hand-off: the pair on the opening ground becomes the small pair on the next slide.

## Motion core

- Both elements share `data-shared="scissors"`.
- Measure both boxes in **design pixels** (screen delta ÷ stage scale). A FLIP in raw `getBoundingClientRect` units is wrong on a scaled stage.
- Hide the leaving copy (`visibility: hidden`) for the flight. Animate the entering copy with `translate` + `scale`, `fill: backwards`, 1000ms, `cubic-bezier(.76, 0, .24, 1)`.
- Start the flight 120ms before the hand-off time T (`overlap-handoff`), so the object is already moving while the page clears.
- No overshoot. Reduced motion: the 160ms fade, no flight. Static/PDF: both slides show their own settled copy; the flight does not run.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 1000ms | Shorter than ~700ms reads as a cut with a blur |
| Easing | .76, 0, .24, 1 | In-out travel. Not the entrance expo-out |
| Lead | T − 120ms | The object moves while type is still leaving |
| Properties | translate, scale | Opacity stays 1 on the entering copy |

## Pitfalls

- Forgetting to divide by stage scale makes the flight miss on any viewport other than 100%.
- Leaving the old copy visible during the flight draws two scissors.
- A second shared flight of a different kind in the same deck is fine only if this card is not the star twice. This prop stars once.

## Reference

`DECK_RECIPES.transition.sharedFlight(fromEl, toEl, 1000)`. Call it from the project's `transition()`, not from `data-anim`. Mark the slide pair in the storyboard as `transition: shared-scissors` on the boundary you mean (the lint counts it).
