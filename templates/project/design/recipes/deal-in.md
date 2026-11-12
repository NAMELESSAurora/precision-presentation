---
id: deal-in
one line: A set of cards or rows deals in faster and faster, then sits still for half a second.
when: The point is quantity or arrival (a stack of cases, a hand of options). Not the opening hero.
limit: once
---

## Intent

Adapted from video-shotcraft `deck-deal-flyin` and rule R2. Constant gaps feel like a slideshow. Acceleration plus a physical metaphor (a deal) reads as one action. The film's 5 second orbit and graphite table do not transfer; the accelerating deal and the 0.5s rest do.

## Motion core

- Children of the element with `data-anim="deal-in"` each travel 28px and fade, 280ms, expo-out `.16, 1, .3, 1`.
- Cues: gap starts at 90ms and multiplies by 0.72 each index, with a floor of 16ms. No per-item anticipation (that kills the acceleration).
- After the last card lands, 500ms of stillness (`data-rest`, default 500). The tracked animation includes that rest, so Next-during-motion finishes to the still board.
- They land in real layout slots. Nothing floats on top of the slide (the film's rule: the destination is a real cell).
- One deal in the deck. Reduced motion: 160ms fade of the whole set, already in place. Static/PDF: the dealt grid.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Flight | 280ms expo-out | The film used 8 frames (~270ms) per card |
| First gap | 90ms | Even gaps were rejected as mechanical |
| Floor gap | 16ms | Tighter than this overlaps the flights into mush |
| Rest | 500ms | R2. Do not cut it to fit a clock |
| Count | as many as the claim needs | Too few and it is just a list (`list-reveal`) |

## Pitfalls

- A light overshoot (`y1 > 1`) was right for cards hitting a table in the film. This deck's motion spec forbids overshoot unless the decision log says the metaphor is a physical hit. Default: no bounce.
- Dealing and also running `list-reveal` stars two list entrances. Pick one.
- Veiling the undealt cards reads as a mask.

## Reference

`data-anim="deal-in"`. `DECK_RECIPES.dealCues(n)` is the gap list. `data-flight` and `data-rest` override milliseconds.
