---
id: focus-handoff
one line: The eye is held on one still thing, and the cut happens in the periphery.
when: Two slides share a single focal object that does not itself fly (a word, a face, a number already in the same screen position).
limit: once
---

## Intent

Adapted from video-shotcraft `transition-hidden-cut`. If the thing you are looking at does not change, you will not see the cut. This is not the shared-element flight (the object moves). Here the object stays put and the surroundings change.

## Motion core

- The shared focal element occupies the same design-px box on both slides (measure it; do not assume).
- Surrounding elements leave and enter with `overlap-handoff`. The focal element does not fade and does not move. Give it `data-shared` only if the implementation copies it; visually it is continuous.
- Periphery motion stays outside a quiet radius around the focus so the eye is not dragged away at the cut.
- Once in the deck. A second hidden cut is a style, and the audience starts looking for it.
- Reduced motion: you may fade the periphery; do not fade the focus if you can keep it. Static/PDF: both slides show the object in that box.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Position match | ≤ 4 design px | A jump of the "still" object destroys the trick |
| Periphery | the hand-off, 200ms overlap | A 0ms cut around a still word still clicks |
| Focus opacity | 1 the whole time | Fading it "to be safe" makes an ordinary cut |
| Quiet radius | keep motion off the focal box | A line animating through the word steals the eye |

## Pitfalls

- Using this when the object also needs to change size. That is `shared-scissors` or `title-demote`.
- Matching the boxes by eye at one viewport. Check at 1280 and 2560; the stage scale hides a constant CSS error until you measure.
- Hiding a content change inside the cut (a different claim in the same pixels). The trick is continuity, not a sneak edit.

## Reference

Align the two elements in CSS. Exclude them from the exit and from the entrance fade. Name `transition: focus-handoff` once.
