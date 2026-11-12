# QA report

Evidence lives in `qa/<round>/`. Each round: what was run, what was looked at, findings (P0–P3 with evidence path, root
cause, fix, regression), and what was NOT tested. Never mark anything as passed without the evidence.

## Round 1 (YYYY-MM-DD)
- Tests: `npm test` → n/n
- Layout gate: `npm run qa:gate` → 0 flags (four 16:9 sizes, static, mid-step, type floor). Exceptions: `qa/layout-exceptions.md`
- Eye: `qa/r1/contact-1920x1080.png` — neighbouring slides, type, photos
- Motion: `qa/r1/motion/` filmstrips (eye) and `qa:run` snaps/pops/overlap (numbers). Handoff if the deck uses per-element exits.
- Media: `qa/r1/media/report.json`
- Cold start: `qa/r1/dist-check.json` (file:// + http, external requests blocked)
- Not tested: projector distance, classroom PC / browser / speakers / clicker, audio by ear

## Scores (aid only)
| Dimension | Weight | 0–5 | Points | Note |
|---|---|---|---|---|
| Argument & narrative | 20 | | | |
| Composition & hierarchy | 25 | | | |
| Type & readability | 15 | | | |
| Assets & tone | 15 | | | |
| Motion & rhythm | 15 | | | |
| Live usability | 10 | | | |
