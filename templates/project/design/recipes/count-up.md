---
id: count-up
one line: A number eases to the value that is already printed in the HTML, and stops on that text.
when: One figure is the sentence (80%, $700, 12). Not a row of counters.
limit: once
---

## Intent

The number is the claim. Counting into it makes the magnitude visible. A second counter in the deck becomes a tic (DR4).

## Motion core

- The HTML text is the truth (`80%`). `data-anim="count-up"` and optional `data-to="80"`.
- 900ms, ease-out `1 - (1 - t)³`, which matches expo-out closely enough for a readout. Not linear.
- `finish()` and `cancel` both restore the printed string, so a fast Next cannot leave "79%".
- Width is reserved by the final text (the element does not grow as digits appear). Use a tabular figure or a fixed inline size.
- Reduced motion: the printed text fades in. Static/PDF: the printed text, no count.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 900ms (`data-ms`) | Under 500ms the count is a flicker; over 1.4s the speaker waits |
| Curve | ease-out cubic | Linear counting feels like a timer |
| Rest | the step stays on the final glyph | DR1. Do not roll past it |
| Suffix | taken from the printed text (`%`) | Do not hard-code a unit the slide does not show |

## Pitfalls

- Starting from a blank element and writing the final string only in JS. Static mode and no-JS must already show the number.
- Two count-ups. If you need a second figure, set it in type, still.
- A proportional font whose width jumps. The layout gate will flag the neighbours.

## Reference

`data-anim="count-up"` → `DECK_RECIPES.enter['count-up']`.
