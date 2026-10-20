# Speech outline — for an external writer (e.g. Gemini) to expand

> Source of truth: the deck as built, `src/js/notes.js`, `claims.yaml`, `sources.md`. Speaking rate assumed: ~140 words/min.
> Usage: (1) the presenter fills section 1; (2) send this whole file + the prompt in section 5; (3) check the result with
> section 6 — and re-check every fact against the original source, not only against this outline.

## 1. Only the presenter can fill these (write "skip" to leave one out)
| ID | Used on | Question | Answer |
|---|---|---|---|
| P1 | | (e.g. how did you actually encounter this material?) | |
| P2 | | (a sound / detail you really noticed) | |
| P3 | | (a feeling you really had) | |
| P4 | | (which reading fits your own use of it — or "not sure") | |
| P5 | | (one emotion word for the conclusion) | |
| P6 | | (what your own work left out) | |
| P7 | | (one first-person sentence answering the question) | |

## 2. Through-line
**The question (read aloud on the question slide):** …
**Thesis:** …
**Structure:** …

## 3. Time and word budget
| Slide | Full path | Short path | Words | Clicks |
|---|---|---|---|---|
| S01 | | | | |
| **Total** | | | | |

## 4. Slide by slide
Format: **[CLICK n]** = what appears after the n-th press · "On screen" = do not read it out verbatim · "Fixed line" = keep word for word.

### S01 · Title
- **[On entry]** …
- **[CLICK 1]** …
- **On screen:** …
- **Facts you may use:** … (source)
- **Do not say:** …
- **Fixed line:** "…"

## 5. Prompt for the writer (send with this file)
```
You are helping me write the spoken script for a presentation. The attached outline is the source of truth.
Write natural spoken English for a university class: short sentences, first person.
Rules:
1. Follow the outline slide by slide; mark every key press as [CLICK] exactly where the outline puts it.
2. Respect each slide's word budget in section 3 (±10%); give the word count after each slide.
3. Keep every "Fixed line" word for word, as the last sentence of its slide.
4. Use ONLY the facts listed in the outline. No new dates, numbers, quotes, statistics or study details.
   If something seems missing, write [NEED INFO: ...].
5. Personal content comes ONLY from my answers P1–P7. Never invent experiences, feelings or memories.
   If an answer is empty or "skip", leave that sentence out.
6. Respect every "Do not say" line; keep the source attributions in the wording.
7. Do not read the on-screen text verbatim.
8. Then write the short version (skip the optional slides; use the bridge lines).
Output: per slide, a heading "S0x — title (target seconds)", the script with [CLICK] markers, the word count.
```

## 6. Check the returned script
- [ ] Word count per slide and in total; full and short versions timed at ~140 words/min plus media.
- [ ] Fixed lines kept; [CLICK] markers match the deck's steps.
- [ ] Personal content only from P1–P7.
- [ ] No new numbers, dates, quotes; each study's object and design stated correctly (association ≠ causation).
- [ ] Every description of an image, sound or object matches the actual file (e.g. LP vs CD, what is audible at that moment).
- [ ] No over-generalisation ("every…", "many…") the facts do not support; exceptions mentioned where they matter.
- [ ] Credits right (fan-made vs official; where a full list actually appears).
