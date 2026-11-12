---
id: wipe-chapter
one line: A section ends with a directional wipe. The new section is uncovered, not faded up through the old one.
when: A real section break, at most twice. Not between steps of one slide.
limit: 2
---

## Intent

Adapted from video-shotcraft wipe family. A wipe says "next chapter". Used between every slide it says "template". The overlap hand-off is the ordinary join; this is the heavier one.

## Motion core

- Clip-path inset on the leaving slide, 560ms, expo-in so it accelerates off (`cubic-bezier(.7, 0, .84, 0)` is the motion spec's IN, reserved for this kind of exit).
- Direction matches the reading: a section that moved forward in time wipes left; do not pick a direction at random.
- The new slide is underneath, still, and fully there when the wipe finishes. Do not also play a hero entrance in the same 560ms.
- Cap two. `page-turn` is the other chapter device; do not spend both on adjacent boundaries.
- Reduced motion: fade. Static/PDF: no wipe.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 560ms | A 200ms wipe is a flicker; over 800ms the speaker stalls |
| Easing | expo-in | Expo-out makes the wipe hesitate and then linger |
| New slide motion | none until the wipe is done, or only the system head | Two ideas at once |
| Count | ≤ 2 | Three wipes and the deck is a slideshow |

## Pitfalls

- Wiping on a theme change and also flooding. One device for that boundary.
- A wipe that clips type in a way the static slide does not. Check mid-wipe only by eye; the gate's mid samples are for in-slide steps.
- Softening it with a blur. Blur is not in the allowed property list and it hurts type (DR6).

## Reference

Leaving slide: `clip-path` animation from `inset(0 0 0 0)` to `inset(0 0 0 100%)` (or the chosen side). Keep it in the project's `transition()` when the storyboard names `wipe-chapter`.
