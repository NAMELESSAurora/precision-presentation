# QA checklist

Run from the project directory. `npm test` and `npm run`, not bare `npx`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when Playwright's browser cannot be downloaded.

## Every full pass (P6)
- [ ] `npm run qa:gate` — 0 layout flags at 1920×1080, 1600×900, 1280×720, 2560×1440, including static and mid-step; type floor held; no halftone
- [ ] Each `data-over` / `data-under` / `data-tight` / `data-bleed` / `data-edge` is listed in `qa/layout-exceptions.md`
- [ ] A planted overlap is still detected (the sample test does this; re-check after editing the checker)
- [ ] Contact sheet of final steps: no two neighbours could swap layouts
- [ ] Photos legible, natural colour, no dot mask or veil
- [ ] `npm run qa:run -- qa/<round>/motion-run --gate` — 0 snaps, 0 pops
- [ ] If exits are per element: `--overlap 150:250` and `npm run qa:handoff -- qa/<round>/handoff.json --gate`
- [ ] `npm run qa:motion -- <round>` filmstrips looked at, not only generated
- [ ] `npm run lint:storyboard` — no recipe over its catalog limit
- [ ] `npm test`
- [ ] Copy trimmed off a slide is in `notes.js` `moved` (`npm run qa:copy -- <old.html> index.html qa/copy-moved.md --notes src/js/notes.js --gate`)

## Before a package (P7)
- [ ] `npm run qa:review-pack`, then a clean-context pass of `design/aesthetic-rules.md` written into `qa/final-review.md` with stills
- [ ] The checks above, after the last edit
- [ ] `npm run release` (runs `qa:gate` again, then notes, PDF, cold start, zip)
- [ ] PDF pages looked at
- [ ] Unzipped folder cold-starts
- [ ] `qa/qa-report.md` says what was not tested (projector, room, audio)

## Preview for a person
- [ ] `npm run qa:preview -- <N> --from <round>` and send the images
- [ ] Their sentence is a row in `design/decisions.md` (`user_selected` or `self_selected`)
