# Project

HTML presentation built with the `precision-presentation` skill (plain HTML/CSS/JS, classic scripts, no build step).
Start with `handoff.md`. Process and rules: the skill's `SKILL.md` and `reference/`.

# Commands
- Present: double-click `index.html` (Chrome / Edge). Dev server (optional): `npm start` → http://127.0.0.1:4173/index.html
- Tests: `npx playwright test` (set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Playwright's browser cannot be downloaded)
- QA: `node scripts/qa-shots.mjs <round>` · `node scripts/qa-motion.mjs <round>` · `node scripts/qa-media.mjs <round>`
- Release: `npm run release` (notes → PDF → dist → cold-start check → release/ zip + submission PDF), then unzip with
  Expand-Archive to a temp folder and `node scripts/verify-dist.mjs <round> --root <folder>`

# Conventions
- `src/js/deck.js` is the only owner of slide / step / keys / URL / media state. State = `data-reveal`; motion (WAAPI,
  `src/js/motion.js`) must always be finishable — no setTimeout chains.
- Colours only via role tokens (`--night-*` / `--day-*` → `--c-*`); no hex in components. Theme changes are floods.
- Every launch starts in full motion (no OS / remembered preference); A = reduced for this session.
- Optional content lives in `src/js/content.js` (media, slots, text). Never invent media, quotes, numbers, time codes or
  personal lines; label generated images MADE HERE.
- Notes: edit `src/js/notes.js`, then `node scripts/build-notes.mjs`.
- Long files: write in parts and check with `node --check` (the Write tool has truncated long files).
- Record every exception in `design/decisions.md`; update `handoff.md` at the end of each session.
