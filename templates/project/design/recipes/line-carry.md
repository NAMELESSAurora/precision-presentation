---
id: line-carry
one line: A line the audience is already watching grows across the cut and becomes the frame of the next idea.
when: One signature transition between two ideas that share a graphic (a rule becoming an axis, an underline becoming a box).
limit: once
---

## Intent

Adapted from video-shotcraft `line-carry-transition`: the scene does not cut, because the eye never leaves the line. In a talk this is one Next, not a 6 second camera move. The line must already mean something on the first slide (a finished progress rule, a drawn underline).

## Motion core

- The line is one SVG path with `pathLength="1"`. `stroke-dashoffset` runs 1 → 0 over about 700ms, expo-out, so the start is quick and the arrival is quiet.
- The pen tip (a 10–14px dot in the deck's one device colour) sits on the leading end and fades out in the last 80ms, or it remains as the next slide's bullet. Do not leave a leftover dot.
- Content inside the new frame waits until the line has closed.
- No motion blur. No second line-carry later in the deck.
- Reduced motion: fade both slides' settled states; the line is already complete in CSS. Static/PDF: the closed line.

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Draw | ~700ms expo-out | The film used ~6s because the camera travelled. A talk does not |
| Weight | 8px at 1920 | Thinner than ~4px gets lost; a hairline is a different recipe (`rule-draw`) |
| Corners | square | A round corner drops the drafted-diagram feel |
| Close before content | content delay ≥ draw | Type inside a half-drawn box wastes the line |

## Pitfalls

- Starting the line from nothing. It has to be the extension of a line already on the slide.
- A camera pan of 1920px, as in the film card, fights a fixed 16:9 stage and the type floor. Do not pan the stage. Grow the line; keep the type still.
- Mixing a hand-drawn line here and a geometric hairline on the next slide looks like two decks.

## Reference

`data-anim="draw"` on the path, `data-delay` on the content. See `arc-cycle` for the dashoffset pattern. This card is the one-time scene-level version.
