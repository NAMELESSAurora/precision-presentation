---
id: overlap-handoff
one line: The next slide starts 200ms before the last leaving piece has gone.
when: Every ordinary boundary, once the deck has left whole-slide cuts behind. This is the system, not a starred trick.
limit: system
---

## Intent

A hard cut reads as two decks. A 200ms overlap with directional exits reads as one continuous move. Old type is finished fading by halfway through its travel, so it is gone before new type lands in the same place.

## Motion core

- Each top-level piece of the old slide leaves on its own: opacity plus a short travel along `data-exit` (up, down, left, right, or fade). Grounds can `wipe-l` / `wipe-r`.
- Easing EXIT `cubic-bezier(.4, 0, .2, 1)`. Fade is done at 50% of the eased travel.
- `T = exitSpan(old) − 200`. The first new element starts at T. Delays inside the new slide stay relative to that first start.
- The running head is not part of the exit. Its kicker and folio rise into place (about 14px, 560ms, expo-out) so the number changes without a cut.
- Shared flights start at T − 120ms and are excluded from the "first entrance" measurement.
- Target overlap 150–250ms. `qa:handoff` must stay at 0 (both texts ≥ 30% visible and overlapping).
- Reduced motion: one 160ms linear fade, no travel. Static/PDF: no transition.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Overlap | 200ms (gate 150–250) | Under 120ms reads as a cut; over 280ms stacks type |
| Exit | per the section profile, roughly 220–480ms | A whole-slide 220ms fade is the scaffold baseline, not this card |
| Word mask start | `translateY(100% + .62em)` | A 112% start leaves a sliver of the glyph at t = 0 |
| Head | rises, +60ms on the folio | Do not fade the folio with the page |

## Pitfalls

- Counting a morph clone that sits on the stage as an "entering" animation inflates the overlap (320ms instead of 200ms). Measure only active-slide, non-shared animations.
- `deck.next()` during a transition finishes the current animation and does not advance. Tests and `qa-run` must `deck.finish()` as well as `getAnimations().finish()`, or later labels slip by one step.
- A seek that never changes `currentTime` reports 0 overlaps. Assert the clock moved.
- The scaffold's default transition is still a whole-slide exit. Naming this recipe in the storyboard is a promise to implement it, not a switch that is already on.

## Reference

`DECK_RECIPES.transition.overlapDelay(exitSpanMs, 200)` returns T. Exits use `DECK_RECIPES.transition.EXIT`.
