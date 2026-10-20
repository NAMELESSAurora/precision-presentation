# Capabilities (checked YYYY-MM-DD on the build machine)

| Capability | Status | How it was checked |
|---|---|---|
| File read / write | | |
| Web research | | |
| Node.js | | `node -v` |
| Browser automation (Playwright) | | browser download OK? else `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` |
| ffmpeg (fixtures, filmstrips, frames) | | `ffmpeg -version` |
| Screenshot review | | |
| Motion review | | filmstrips (10 fps, ±100 ms) — no real-time human viewing |
| Audio listening | unavailable | nobody listened → all audio NOT_TESTED |
| PDF export | | `node scripts/export-pdf.mjs` |
| Target classroom PC / projector / clicker | untested | — |
