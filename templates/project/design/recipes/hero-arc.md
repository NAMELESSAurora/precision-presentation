---
id: hero-arc
one line: One object, one press: it is found, it comes forward, it settles, and it stays.
when: The opening, or the one object the rest of the talk is about.
limit: once
---

## Intent

Adapted from video-shotcraft Q5 and the spotlight-hero shot. A crowd cannot open the talk. The film asked for at least 3 seconds and an orbit. On a slide the orbit fights the type (DR6). The arc that transfers is: find the object, bring it to its resting place, stop.

## Motion core

- One element. `data-anim="speed-settle"` or a short custom pair: 36px travel and fade, 640ms, expo-out, with the last third quieter than the first.
- No second object entering on this press. Captions wait for the next Next.
- No handheld motion, no continuous float after it lands (DR1, DR7).
- The resting place is the CSS layout, inside the safe area, at a readable size. The animation does not scale it up past the type floor and leave it there unreadably huge, and it does not leave it tiny.
- Reduced motion: fade to the same resting place. Static/PDF: the resting place.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Arc | 640–900ms expo-out | The 3s the film wanted is the speaker staying on the settled frame |
| Travel | 24–48px or a small scale 1.04 → 1 | A crash zoom is a different, worse idea on a text slide |
| Companions | none on this press | A subtitle on the same step splits the hero |
| After | still until Next | A breathing loop fails DR1 and DR7 |

## Pitfalls

- Opening on a deal, a mosaic, and a title. That is three heroes.
- An idle float (`translateY` looping) so the slide "feels alive". It feels unfinished.
- Lighting the hero with a glint and also using the deck's only glint later. This card does not include a glint. If you add one, it spends DR5.

## Reference

`data-anim="speed-settle"` → `DECK_RECIPES.enter['speed-settle']`, or the built-in `rise` if the hero is a line of type. Name `hero-arc` in the storyboard either way, so the lint reserves the slot.
