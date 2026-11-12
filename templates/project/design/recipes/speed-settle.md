---
id: speed-settle
one line: One element accelerates into place and then is quiet. Not a crowd.
when: A single figure, word, or object that is not the opening hero and not a list.
limit: once
---

## Intent

The small form of DR2. Video-shotcraft's speed ramp is a camera and a freeze-frame. On a slide the transferable piece is the curve: most of the travel happens early, the last part is a settle, and then nothing moves. Use `hero-arc` for the opening object. Use this for the one later object that needs the same curve.

## Motion core

- `data-anim="speed-settle"`. 36px and a fade, 640ms. Offsets put the bulk of the move in the first 62%, expo-out across the whole thing.
- No overshoot. No second element on this `data-anim`.
-  The settle is the end of the animation, and DR1's stillness is whatever remains until Next. Do not add a 500ms rest animation here; that rest belongs to `deal-in`, where a crowd needs a collective stop.
- Reduced motion: fade. Static/PDF: the element in its CSS place.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 640ms (`data-ms`) | Pair with a 400ms+ speaker hold, not a longer tween |
| Travel | 36px | Much more and it crosses other type; check the layout gate |
| Curve | expo-out, front-loaded offsets | A linear 640ms reads as a caption track |
| Count | 1 element | Children should not also animate |

## Pitfalls

- Putting `speed-settle` on a list. The children will not deal. Use `deal-in` or `list-reveal`.
- Using it on the opening and also naming `hero-arc`. Pick one star for "the object arrives".
- A freeze-frame flash from the film recipe. Do not flash the slide to white.

## Reference

`data-anim="speed-settle"` → `DECK_RECIPES.enter['speed-settle']`.
