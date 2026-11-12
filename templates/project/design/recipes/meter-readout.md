---
id: meter-readout
one line: A bar fills in steps, like a meter, and stops on the value. It only ever grows.
when: A single quantitative bar whose steps mean "digital" or "counted", not a smooth liquid fill.
limit: once
---

## Intent

The scaffold's `meter` kind: pixels only increase, in steps, no blink and no repeat. One meter in the deck. A smooth bar is just a wipe; do not spend this card on it.

## Motion core

- `data-anim="meter-readout"` (or the built-in `meter`). Clip-path inset from the right, `steps(width/20)`, about 640ms.
- The settled CSS is the full bar. Static/PDF shows the full bar. Reduced motion fades it in, already full, because steps are a motion idea and reduced motion drops them.
- Do not empty the bar afterwards. Do not loop it.
- The number beside it, if it counts, is `count-up` and would be a second star. Prefer a still numeral next to a stepping bar, or the bar alone.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 640ms | Matches the built-in meter |
| Steps | about one per 20px | Fewer steps look like a bug; more look like a wipe |
| Direction | grows only | A retract reads as an error |
| Track | the empty track is CSS, already there | Do not fade the track in late |

## Pitfalls

- A stepping bar under 18px tall fails the type/shape floor from the back of the room. The bar is a graphic; its label still follows DR6.
- `chart-live` sparkle from the film. No glint on the tip (DR5).
- Two meters. The second is a still fill.

## Reference

`data-anim="meter-readout"` → `DECK_RECIPES.enter['meter-readout']`. `data-anim="meter"` is the same motion without consuming this storyboard name unless you also write `recipe: meter-readout`.
