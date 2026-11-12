---
id: marker-underline
one line: One word gets a single stroke under it, in the device colour, and the stroke stays.
when: You need to mark the one word the sentence turns on.
limit: once
---

## Intent

Adapted from the short underline in video-shotcraft `draw-svg-trace` and from a highlighter that is a block, not a rainbow. One stroke. The device colour is a bar under or behind the word, never the word's own colour if contrast is poor (DQ4).

## Motion core

- A span or a generated bar, `transform-origin: 0 50%`, `scaleX(0)` → `scaleX(1)`, about 420ms, expo-out.
- `data-anim="marker-underline"`.
- It stays at scaleX(1) in CSS after the animation (fill backwards, CSS is the end state: `transform: none` or `scaleX(1)` authored on the settled rule).
- Not on every headline. This is the one word in the deck that gets the stroke.
- Reduced motion: the bar is there, faded in with the word. Static/PDF: the bar is there.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Draw | 420ms expo-out | The film's 18 frames ≈ 600ms on a title card. 420ms matches a talk |
| Weight | 0.18–0.28em, behind or just under | A hairline is invisible at the back of the room |
| Count | 1 word | A second mark is a template |
| Colour | the one device colour, not type | Orange-on-blue spends DQ4 |

## Pitfalls

- Putting the bar on a photo without `data-over` and a readable edge. The layout gate will flag text-on-media if the word itself is over the photo; the bar is a shape.
- Animating the word colour to the device colour. That fails contrast.
- Combining with `draw-trace`'s underline. Same gesture.

## Reference

`data-anim="marker-underline"` → `DECK_RECIPES.enter['marker-underline']`.
