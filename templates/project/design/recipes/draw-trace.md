---
id: draw-trace
one line: A line draws the outline of one thing, and the thing itself appears as the line closes.
when: You are pointing at a single object, chart, or word. "This one."
limit: once
---

## Intent

Adapted from video-shotcraft `draw-svg-trace`. Drawing is the entrance. The film spent about 4.4s with crop marks and a flash. A talk keeps the draw, the close, and the hand-off to the real object, in one press.

## Motion core

- One outline path, `pathLength="1"`, dashoffset 1 → 0, about 640ms, in-out cubic (the film used 40 frames ≈ 1.3s for a huge card; 640ms still reads as drawing on a slide).
- A tip slightly thicker than the line sits on the leading end. Without a tip it is a loading border.
- The real object (photo, type, chart) fades in over the last 120ms, not before the outline closes.
- Optional: one word gets a single underline in the device colour, 18 frames in the film ≈ 320ms, and it stays. That underline is this card, not also `marker-underline`.
- No glow flash. A 2-frame black pulse from the film does not survive DR5.
- Reduced motion: the object is simply there, faded in. Static/PDF: object plus the finished outline, or the outline omitted if it was only a guide. Decide in the motion spec and stick to it.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Draw | 640ms | < 400ms is a blink; > 1000ms is a spinner |
| Tip | ~1.5× the stroke | A tip the same weight disappears |
| Content | last 120ms | Earlier, and the line did not cause the object |
| Underline | 320ms, one word | Two underlines are decoration |

## Pitfalls

- Outline radius that does not match the object's radius. At the hand-off the corners disagree.
- `arc-cycle` in the same deck. Both are "a line draws". One of them stars; the other is a still.
- Tracing every card in a grid. That is a loader.

## Reference

`data-anim="draw"` plus a tip element whose `offset-distance` or dash follows the same clock. The built-in `draw` kind is the stroke. Time the content with `data-delay="520"`.
