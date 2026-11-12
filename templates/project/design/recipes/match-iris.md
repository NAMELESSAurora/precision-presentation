---
id: match-iris
one line: A circle already on the slide opens and becomes the circle on the next slide.
when: A real circle (a mark, a portrait crop, a dot) and the next idea is also round (a dial, a cycle, a single figure in a ring).
limit: once
---

## Intent

Adapted from video-shotcraft `circle-match-iris`. An iris from nowhere is just a wipe. An iris from a circle the audience is looking at is a match cut: this circle becomes that one.

## Motion core

- Both circles share one centre, stored as `--iris-x` and `--iris-y` in **design pixels**, not two independently measured centres. More than about 10px of disagreement and the match fails.
- `data-anim="match-iris"` clip-path from `circle(0%)` to `circle(150%)` at that centre, about 700ms, `cubic-bezier(.62, 0, .32, 1)`.
- The old slide scales up slightly (1.03 → 1.08 is enough on a talk slide; the film went to 1.22) and fades, ease-in, so the new scene feels pushed through.
- Do not also animate the contents of the new circle. The iris is the star.
- The anchor must be a true circle. A rounded rectangle lies.
- Reduced motion: fade. Static/PDF: the destination slide, fully open.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Open | 700ms, .62, 0, .32, 1 | The film spent ~30 frames (~1s) after a long setup. One press cannot afford the 5.5s shot |
| Centre error | ≤ 10 design px | Measured, not estimated |
| Old slide | scale ≤ 1.08 | A crash zoom breaks the type floor |
| Setup | the circle is already the hero of the previous step | No time for two pulses and two ripples |

## Pitfalls

- Opening from the slide centre when the circle is in the corner. The eye was not there.
- A count-up inside the iris on the same press (`count-up` would be a second star, and the film's sweep-plus-number needs a following press if you want it at all).
- Using the iris twice. The second time it is a template.

## Reference

`data-anim="match-iris"` on the incoming clip element. Centre with CSS variables. `DECK_RECIPES.enter['match-iris']`.
