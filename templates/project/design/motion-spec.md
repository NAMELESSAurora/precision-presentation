# Motion spec

Every scene is made from the previous one; motion is a function of time that can be finished, cancelled or skipped at any
moment; the final layout always exists in CSS without animation.

## Rules
- Next: finish a running animation → next step → next slide. During a video: first press warns, second stops it. Prev and
  jumps are instant. Right-click = back.
- Every launch is full motion (no OS / remembered preference). A = reduced for this session; `?motion=reduced` forces it.
- One primary moving focus at a time; entry choreography ≤ 700 ms. No loops, pulses, spins, bounces, shakes, glitches,
  flashes, particles, lens flares, RGB split. Theme changes are floods, never colour interpolation.

## Vocabulary (src/js/motion.js)
| Name | Use here | Timing |
|---|---|---|
| rise | title lines | 420 ms expo-out, 70 ms stagger |
| fade | labels, blocks | 260 ms |
| wipe / draw | bands, leader lines | 560 / 640 ms |
| meter · type · load | digital surfaces only (stepped, add pixels only) | steps |
| flood | world change | 420 ms |

## Recipes
Named moves live in `design/recipes/` (credit: video-shotcraft, Apache-2.0, rewritten for this runtime). Put the card id on the storyboard. `npm run lint:storyboard` enforces how often each card may star. `data-anim` values implemented in `src/js/recipes.js` run through the existing Next / reduced-motion / static rules. Transition cards are opt-in inside `transition()`.

## Project-specific motion
(transitions, signature elements — what each one explains; delete it if the answer is only "it looks cool")

## Hand-off (the bar once motion is being polished)
The scaffold still exits a whole slide (about 220ms) and starts the next one at ~200ms on the same theme, or later across a theme flood. Measured overlap on the sample is about 20ms, or a gap when the theme changes. Old and new text do not stack, but this is not yet a continuous hand-off.

When the deck grows per-element exits: each block leaves on `data-exit` (up / down / left / right / fade; `wipe-l` / `wipe-r` for grounds). The first element on the new slide starts at `exitSpan − 200ms` (target 150–250ms). Fade the old type out by halfway so it is gone before new type lands in the same place. The running head rises into place instead of cutting. Shared objects that exist on both slides (`data-shared`) fly with transform only; an in-slide flight uses `data-flip-from`. Word masks start at `translateY(100% + .62em)` so no sliver of the glyph shows at t = 0.

Section character can differ (`data-motion`: crisp, ornate, tense, calm). The hand-off rule does not. `tense` / `stepped` (or `data-snap-ok`) is stepped on purpose and is exempt from snap detection. No overshoot. Linear easing only for reduced motion and a count-up. The scaffold's `fadeIn` is still linear — that is the baseline, not the polished target.

Reduced motion is one 160ms linear fade and no travel (`npm run qa:run -- <dir> --reduced --gate`).

## Checks
- `npm run qa:motion -- <round>` — real Next presses, a filmstrip per press, for the eye.
- `npm run qa:run -- <dir> --gate` — 60fps virtual time. 0 snaps, 0 pops. Add `--overlap 150:250` only after per-element exits exist.
- `npm run qa:handoff -- qa/handoff.json --gate` — old text on new text at every boundary.
- `npm run qa:frames -- <dir> S02.0` and `npm run qa:strip -- S02 0 out.png 0,200,400` — one press, for the eye.
- MP4s are frame sequences in yuv420p, tv range, checked with ffprobe. A 0 from a seek that never moved the clock is not a pass.
