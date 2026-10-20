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

## Project-specific motion
(transitions, signature elements — what each one explains; delete it if the answer is only "it looks cool")
