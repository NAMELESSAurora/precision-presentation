# Capabilities (checked YYYY-MM-DD on the build machine)

| Capability | Status | How it was checked |
|---|---|---|
| File read / write | | |
| Web research | | |
| Node.js | | `node -v` |
| Browser automation (Playwright) | | `npm test` uses the pinned `@playwright/test`. If the browser download fails, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to system Chrome. Do not use bare `npx`. |
| ffmpeg / ffprobe (filmstrips, frame MP4, tv-range check) | | `ffmpeg -version` and `ffprobe -version` |
| Screenshot review | | |
| Motion review | | filmstrips (10 fps, ±100 ms) — no real-time human viewing |
| Audio listening | unavailable | nobody listened → all audio NOT_TESTED |
| PDF export | | `npm run export:pdf` |
| Zip packaging | | `bsdtar` on PATH (`package.mjs`; GNU tar is not a substitute) |
| Target classroom PC / projector / clicker | untested | — |
