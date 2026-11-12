# Copy moved off the slides

When a slide is thinned so the layout can breathe, the removed sentence goes into `src/js/notes.js` as `moved`. The presenter window and `speaker-notes.md` show it as “Moved off the slide”. Spoken word count uses `cues` only, so moving copy does not change the timing.

No claim, source tag or credit disappears. Shorten it on the slide; keep the full line, and keep `[Rnn]` either on the slide or in `moved`.

Generate the diff against the previous `index.html`:

```bash
npm run qa:copy -- path/to/previous-index.html index.html qa/copy-moved.md --notes src/js/notes.js --gate
```

`--gate` fails when a slide lost lines and `moved` is empty, or a source tag left the slide and is not repeated in `moved`.

This file is the instructions. Replace the body with a generated ledger once a trim has happened.
