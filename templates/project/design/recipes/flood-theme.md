---
id: flood-theme
one line: A theme change is a solid field growing from a line, never a fade between two background colours.
when: The deck actually has two worlds (night and day) and the change means something. If every slide is one ground, do not perform a flood.
limit: system
---

## Intent

Interpolating background colour between a dark slide and a light slide passes through grey. The scaffold grows the new world's colour from a horizontal line until it covers the stage, then commits the theme. That is the whole recipe.

## Motion core

- `DeckMotion.flood`: clip-path from a 2px band at the chosen y to `inset(-4px)` so the corners are covered, about 420ms, expo-out `.16, 1, .3, 1`.
- The stage keeps the old theme until the flood covers it.
- On a hand-off, start the flood ~40ms in, behind both slides, about 400ms. Do not also fade the backgrounds.
- Reduced motion: the theme swaps with the 160ms fade (duration of the flood may be 1ms). Static/PDF: each slide is already its own theme; no flood.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 420ms expo-out | Longer and the speaker is waiting on a colour |
| Origin | a line, not the centre | A radial wipe is a different recipe (`match-iris`) |
| Grey | never | If you see grey, the background is interpolating |
| When | only on a real theme change | A flood between two identical grounds is theatre |

## Pitfalls

- `transition: background-color` on `.slide`. Remove it.
- Flooding on every boundary "for continuity". Continuity is `overlap-handoff`.
- Starting the new slide's type before the flood has covered the old ground, so type sits on the wrong colour. Delay type to the flood's cover, or keep type on its own plate.

## Reference

Already in `src/js/motion.js` (`flood`). Storyboard `transition: flood-theme` only on boundaries that change `data-theme`. The lint allows repeats.
