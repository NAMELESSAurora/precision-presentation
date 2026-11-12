---
id: page-turn
one line: The old slide splits at a seam and leaves; the new slide was waiting behind it.
when: A chapter change, a before/after, a version. Not a step inside one argument.
limit: 2
---

## Intent

Adapted from video-shotcraft `page-turn-transitions` (barn-door). The page is an object with a seam. Use it when the talk says "that era ends". Two of these in one deck is the maximum; a third feels like slides.

## Motion core

- A 1px seam draws from the centre outward in about 180ms (expo-out), so the split has a location.
- The two halves then travel off, ease-in `cubic-bezier(.42, 0, .8, .25)`, about 420ms. Ease-out would look pushed; ease-in looks like they give way.
- The new slide is already underneath, same grid, scale 1.04 → 1 over 480ms, starting 40ms after the halves move.
- No drop shadow from the doors onto the new slide (it muddies the type). A 10px lit edge on the cut is enough.
- After the new slide settles, 400ms of stillness before the speaker needs the next idea (DR1). That stillness is the end of this Next, not another animation.
- Reduced motion: crossfade. Static/PDF: the new slide only.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Seam | 180ms | A hard split with no seam looks like a glitch |
| Halves | 420ms ease-in | Quart-in all the way to the last frame looks like a pop-out |
| New slide | 1.04 → 1 | The film used 1.08 and a light bloom. Skip the bloom (DR5) |
| Cap | 2 per deck | Back to back chapter turns feel like PowerPoint |

## Pitfalls

- Different layouts on the two sides. The audience should see the same slots change contents.
- An odd stage width leaving a 1px gap when the halves are closed. Build the seam as an overlay, do not depend on two 960px boxes meeting perfectly at every scale.
- Pairing this with `wipe-chapter` on the next boundary. Pick one chapter device.

## Reference

Not an enter `data-anim`. Implement beside `transition()` when the storyboard says `transition: page-turn`. Halves are two overflow-hidden copies, or one clip-path pair: `inset(0 50% 0 0)` and `inset(0 0 0 50%)` animating to full off-stage insets.
