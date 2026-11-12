---
id: word-mask
one line: A word rises out of its own mask. The mask is the system for titles, not a trick you spend once.
when: Display lines. If the deck's type voice is a mask rise, every title may use it. A one-off giant kinetic word is a different star and should be named on its own step.
limit: system
---

## Intent

The line is revealed by moving the ink, not by fading a box. This is the word-mask from the 17-slide deck. It can be the deck's type voice (repeatable) the way a film's type system repeats.

## Motion core

- The mask (`.w`) is `overflow: hidden` with padding so descenders are not cut (about 0.3em top, 0.5em bottom).
- The word starts at `translateY(calc(100% + .62em))`. A start of 112% leaves a sliver of the tops of the letters at t = 0. That sliver was found by looking at frames, not by trusting the math.
- Duration from the section profile (roughly 620–1000ms), expo-out, stagger inside the line capped so a long line does not take more than about 320ms to spread.
- Easing is expo-out, not linear. Reduced motion: no mask, 160ms fade. Static/PDF: words in place, masks open (`overflow: visible` or the word at rest).

## Parameters

| Parameter | Value | Feel |
|---|---|---|
| Start | `100% + .62em` | The bug to avoid is a visible hair of the glyph |
| Stagger cap | 320ms per line | A 12-word line at 70ms is a paragraph, not a title |
| Padding | 0.3em / 0.5em | Without it, g and y clip |
| Profile | section `data-motion` | Crisp, ornate, and calm may differ. Tense uses `tense-step` instead |

## Pitfalls

- Clipping the mask tight to the em box. Descenders and the layout checker's ink box will disagree; you will "fix" a false clip by cutting real letters.
- Using the mask on body copy. It is for display lines.
- A linear mask. It reads as a subtitle track.

## Reference

Built-in `rise` is the line-level cousin (clip-path inset, 420ms). A per-word mask is markup (`.w` > `.wi`) plus the translate above. The layout checker already ignores ink hidden by `.w` and shaves the top of a masked em box.
