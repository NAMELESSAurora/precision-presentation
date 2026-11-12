# Design system

Concept sentence: (one sentence that says how the look serves the argument)

## Worlds and colour roles (src/styles/tokens.css)
| Role | night | day | Used for |
|---|---|---|---|
| bg / wash | | | page ground |
| text / meta | | | body / labels |
| em | | | italic second voice |
| accent / accent-text | | | marks, current step, MADE HERE |
Which slides are night and why: …  Contrast checks: …

## Type
Families (≤ 2) and licences · sizes on the 1920×1080 canvas (title / body / label / source) · CJK fallback · line-break rules.

## Grid
Margin 96 · columns · baselines · exceptions.

## Page types
(one line each: claim · evidence · comparison · close reading · process · quote · media · conclusion · references)

## Images
Subject placement, safe areas, provenance label placement, window frame use.

## Anti-template exceptions
(only with a reason)

## Layout QC (design px at 1920×1080)
Safe area 5% (96 / 54) with 6px tolerance. Sibling text blocks stay at least 24px apart unless they share `data-tight`. Nothing under 18px. Reading text at least 22px (`npm run qa:type`). Do not shrink type to fit — delete a line or move it to `notes.js` `moved`.

Declared overlaps, each listed in `qa/layout-exceptions.md`: `data-over` (text on a photo or shape, with a scrim), `data-under` (a ground under the text), `data-tight` (a label + value), `data-bleed` / `data-edge` (display type or a photo that runs off the page). Gate: `npm run qa:gate` is 0 flags.

## Guardrails
Vary the composition from slide to slide; a shared grid is not a shared template. Design sits in layout and type, not in monospace everywhere. Do not ship the scaffold's placeholder orange + blue accents. Photos stay in natural colour: no halftone, dot mask, or veil. Prefer an open-licensed photograph to an SVG illustration. Stand-in photos say so on the slide.
