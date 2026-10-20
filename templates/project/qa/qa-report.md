# QA report

Evidence lives in `qa/<round>/`. Each round: what was run, what was looked at, findings (P0–P3 with evidence path, root
cause, fix, regression), and what was NOT tested. Never mark anything as passed without the evidence.

## Round 1 (YYYY-MM-DD)
- Tests: `npx playwright test` → n/n
- Static: `qa/r1/contact-1920x1080.png` (+ 1366 / 1280 / 1024) — layout issues: …
- Motion: `qa/r1/motion/` — findings: …
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
