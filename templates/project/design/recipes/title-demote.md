---
id: title-demote
one line: A word that filled the slide shrinks into the label it will be for the rest of the section.
when: A section title should become the running idea, not vanish.
limit: once
---

## Intent

Adapted from video-shotcraft `title-demote-to-label`. The big word is not replaced by a different small word. It moves and settles into the label slot. The audience keeps the thread.

## Motion core

- FLIP from the display setting to the label setting, design pixels, about 700ms, in-out `.76, 0, .24, 1`.
- Same string. Do not crossfade to a synonym.
- The rest of the new slide waits until the word has landed (delay ≥ 700ms), or enters with the hand-off only after the word is clearly the label.
- End state is the label's real CSS (size, position, case). The transform is cleared.
- Reduced motion: the label is simply the label. Static/PDF: the label, not the giant word.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Flight | 700ms in-out | Fast enough to feel like one move |
| Scale | whatever the two sizes imply | Do not add a bounce at the label size |
| Other type | starts at or after landing | Simultaneous body copy hides the demotion |
| String | identical | "Purpose" becoming "our aim" is a cut |

## Pitfalls

- Demoting into a monospace label and calling that the design (DQ3). The label can be the text face at label size.
- Leaving the giant word's transform in place. The next layout check measures the transformed box and will flag the safe area.
- Using this on every section title. Once.

## Reference

`DECK_RECIPES.transition.flipFrom(labelEl, giantEl, 700)` at the boundary. Storyboard: `transition: title-demote`.
