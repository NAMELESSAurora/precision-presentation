---
id: list-reveal
one line: Rows appear from the top, a short even stagger, one list.
when: A list is the argument (three questions, five conditions) and the order matters, but it is not a flood of cards.
limit: once
---

## Intent

Adapted from video-shotcraft `list-reveal`, slowed to a talk. Even stagger is allowed here because the claim is sequence, not abundance. Abundance is `deal-in`, and it stars separately. Do not use both.

## Motion core

- `data-anim="list-reveal"` on the list. Each child rises 16px and fades, 420ms, expo-out, 70ms apart.
- The built-in default stagger is also 70ms. This card names it so the lint can stop a second list from performing the same entrance.
- Rows land in their CSS flow. No overlap, no safe-area escape. Run the layout gate on the last step.
- Reduced motion: the list fades as a block. Static/PDF: all rows visible.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Row | 420ms expo-out | Matches the scaffold `rise` |
| Stagger | 70ms | Wider than ~120ms and the list feels late; 0 and it pops as one slab |
| Distance | 16px | 40px starts to leave the safe area on a low row |
| Count | the list you have | Do not pad with empty rows to make it "more motion" |

## Pitfalls

- Accelerating this list. That is `deal-in`. Mixing the curves makes neither readable.
- Revealing one row per Next when they are one thought. That spends clicks the speaker needed for the claim.

## Reference

`data-anim="list-reveal"` → `DECK_RECIPES.enter['list-reveal']`.
