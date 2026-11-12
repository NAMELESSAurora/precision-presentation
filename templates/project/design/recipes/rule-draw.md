---
id: rule-draw
one line: A hairline draws, and then the thing it was introducing may appear.
when: An axis, a divider, or a single rule that explains the structure. Not the signature line-carry.
limit: once
---

## Intent

Adapted from video-shotcraft `stroke-segment-build`, reduced to one rule. The line is structure (a timeline, a split) not a scene change. `line-carry` is the one time a line is the transition. This is the one time a line is the explanation.

## Motion core

- `data-anim="wipe"` or `draw` on the rule, about 560ms, expo-out, from one end.
- Labels that depend on the rule wait until it has reached them (`data-delay`).
- One rule-draw in the deck. Other dividers are already there, still, in CSS.
- Square caps, 2px, the ink colour, not the device colour (a device-colour hairline fails contrast, DQ4).
- Reduced motion: the rule is there. Static/PDF: the rule is there.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Draw | 560ms | The built-in wipe |
| Weight | 2px | 8px is `line-carry` |
| Delay of labels | ≥ the time the line reaches them | Labels that appear first make the line decorative |
| Colour | `--c-line` | Device colour is for a single mark, not a rule |

## Pitfalls

- Drawing every hairline on the slide. The slide becomes a blueprint loading.
- A hand-drawn wobble on an otherwise geometric deck. Pick one line language.
- Combining with `line-carry`. Same tool, two stars.

## Reference

`data-anim="wipe"` on the rule element. Name `recipe: rule-draw` on that step so the lint keeps it singular.
