---
id: tense-step
one line: Negative evidence arrives in stalls — it moves, holds, moves — instead of a smooth ease.
when: A section whose content is failure, friction, or a stalled decision. One section, two slides at most.
limit: 2
---

## Intent

Smooth ease-out says "this is fine". A stall says the thing hesitated. Used on the tense section of the 17-slide deck: words and photo wipes stop near a third of the way and again near four fifths, then finish.

## Motion core

- `data-anim="tense-step"` on the pieces that should hesitate. `data-motion="tense"` or `data-snap-ok` on the slide so snap detection does not flag the resume.
- Keyframe holds, not a blur or a shake: at 33% and at 80% the transform rests, then continues. Duration about 700ms. The holds are the character; the short moves between them can be linear.
- Do not add camera shake. Do not flash the slide.
- Photo wipes in the same section use the same holds.
- Reduced motion: the ordinary 160ms fade. Static/PDF: settled, no hold visible.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Duration | 700ms | Long enough to feel the two rests |
| Holds | offset 0.33–0.48 and 0.80–0.90 | One hold is a hitch; three is a glitch |
| Travel | ~18px | A large travel plus a stall reads as a bug |
| Section | ≤ 2 slides | A third tense slide becomes the deck's mood |

## Pitfalls

- Uniform `steps(n)` ticks like a loader. The holds have to be uneven.
- Forgetting `data-snap-ok` / `data-motion="tense"` makes `qa:run --gate` fail on a deliberate stall if a resume jumps more than 14px in one frame.
- Using the stall on a positive claim contradicts the section.

## Reference

`data-anim="tense-step"` → `DECK_RECIPES.enter['tense-step']`.
