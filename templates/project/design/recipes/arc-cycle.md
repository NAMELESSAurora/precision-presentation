---
id: arc-cycle
one line: A cycle is drawn clockwise, one arc at a time, and each node appears as the line reaches it.
when: A loop, a process, a year, four beats that are one idea.
limit: once
---

## Intent

The diagram is an argument about order. Drawing it clockwise makes the order visible. Nodes that pop on before the line arrives look labelled, not caused.

## Motion core

- Four (or N) SVG arcs, `pathLength="1"`, `stroke-dasharray: 1`, `stroke-dashoffset` from 1 to 0.
- Each arc 280ms, the next starts as the previous finishes (stagger 280ms). Easing expo-out `.16, 1, .3, 1`.
- The node at the end of an arc fades and scales 0.92 → 1 in the last 80ms of that arc.
- Stroke is an allowed exception to the transform/opacity/clip-path list. Say so in the motion spec.
- One direction only. Do not draw backwards on a later step.
- Reduced motion: the whole figure fades in 160ms, already complete. Static/PDF: fully drawn.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Arc | 280ms expo-out | Under ~180ms it is a spinner; over ~500ms it is a loader |
| Stagger | equal to the arc | Overlap the strokes and the sequence blurs |
| Nodes | last 80ms of their arc | Early nodes break the cause |
| Weight | ≥ 4px at 1920 | A hairline disappears from the back row |

## Pitfalls

- `getTotalLength()` changes with scale in some browsers. `pathLength="1"` stays stable.
- A second diagram in the deck should not also draw clockwise. Use a still figure or a different structure.
- Decorative arrowheads that appear before the stroke look stuck on.

## Reference

Set `data-anim="draw"` on each path and `data-delay` to `0, 280, 560, 840`. The node uses `data-delay` matching the end of its arc. No new runtime is required; this card is the timing.
