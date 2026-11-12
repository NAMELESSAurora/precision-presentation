# Presentation Title

HTML presentation (precision-presentation scaffold). N body slides + references, about m:ss. On-screen language: …; speaker notes: ….

## Run it (fill the "Verified" column only with what was actually run)
| What | How | Verified |
|---|---|---|
| Present | extract the folder, double-click `index.html` in Chrome / Edge (offline, video included) | |
| Present via local server (optional, needs Node.js) | `npm start` → http://127.0.0.1:4173/index.html · in the package: `start-server.cmd` | |
| Reading version / submission PDF | `index.html?mode=static` · `release/<name>_Presentation.pdf` | |
| Full release | `npm run release` | |
| Tests | `npm test` (pinned Playwright; not bare npx) | |
| Layout / type gate | `npm run qa:gate` | |
| Motion frames | `npm run qa:run -- qa/motion-run --gate` | |

## Keys (audience window)
`→ Space PgDn click` next (finishes a running animation first; during a video one press warns, a second stops it) ·
`← PgUp right-click` back · `Home/End` · `number + Enter` jump · `G` overview · `K/J/L/M` media play / restart / skip / mute ·
`S` presenter window · `F` fullscreen · `B` or `.` black screen · `A` reduce animations (this session) · `?` help.

## Media and optional content
Edit `src/js/content.js` only.
| Slot | File | Then set | Without it |
|---|---|---|---|
| OPEN | `assets/media/…mp4` | `media.OPEN.src` | poster + spoken opening |

## Honesty notes
(what is generated / placeholder and labelled so; what was never listened to; which defaults are assumptions)
