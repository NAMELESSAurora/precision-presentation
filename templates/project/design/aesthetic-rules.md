# Aesthetic rules for decks (case law)

Append-only. A new rule gets the next id in its series. Do not renumber.

Each rule is one sentence, one precedent quote, and one self-check. Break a rule only by writing the id and the reason in `design/decisions.md`.

Two sources, not mixed up:

- **video-shotcraft** (Apache-2.0, https://github.com/Vincentwei1021/video-shotcraft), `references/aesthetic-rules.md`. Those rules were written for a 30fps product film. Here they are translated to a click-paced HTML deck: the speaker holds the silence, the animation itself stays short, and a frame number becomes a reveal step.
- **This workflow's own review**, after a 17-slide talk: photos, templates, type, palette, and hand-offs. Quotes are the reviewer's words.

The final review (`reference/11_deck_final_review.md`, pack via `npm run qa:review-pack`) walks every id with a step or a frame. A missing check is "unable to verify", not a pass.

## Rhythm (DR)

### DR1. After the key thing lands, the picture is still
Rule: The element the room must remember finishes, then does not move again until the next Next. Build at least a 400ms settle into that step. Do not loop it. The speaker's pause is the hold; do not auto-advance.
Precedent: video-shotcraft R1, reviewer: "第一个标题打出来之后停留一秒" — the hold belongs on the line they must remember, not on a random card. In a deck the same mistake is an animation that is still moving while the sentence is being said.
Self-check: At the end of this step, is anything still moving? Is the still moment on the claim, or on chrome?

### DR2. Speed comes from acceleration, and a crowd rests for half a second
Rule: Nothing that should feel alive moves at constant speed. A group (cards, rows, words) arrives faster and faster, tied to one physical metaphor, then sits still for 500ms. Linear fades are only reduced motion, and the count-up's curve is ease-out.
Precedent: video-shotcraft R2, reviewer: "卡片不断往下堆叠时，应该越来越快……并在最后停顿0.5秒". An abstract fade of the same group did not converge; a deal did.
Self-check: Is any hero move linear? If several siblings enter, do the gaps shrink, and is there a 500ms still tail?

### DR3. One hero, one complete arc, on a single press
Rule: A step has one thing to look at. Its arc — aim, travel, settle — is one Next, about 0.7–1.6s of motion, not a 5 second film and not three clicks. The speaker can keep looking after it settles; that time is speech, not more animation.
Precedent: video-shotcraft Q5, reviewer: "第一个镜头，只需要聚焦在一张卡片，并让它更有质感". And R3: the first cut of a shot is almost always too fast, and slowing down was never rejected.
Self-check: How many things on this step are asking to be watched? Does the arc finish before the next click is required?

### DR4. A starring technique happens once
Rule: Deal-in, iris, page-turn, mosaic, shared flight, draw-trace, count-up, and the other once-cards each star once in the deck. The system (overlap hand-off, word-mask as the type voice, flood on a real theme change) may repeat. A second starring use is a different recipe or it is cut.
Precedent: video-shotcraft P4, reviewer: "其他动画有些同质了". The storyboard lint enforces the catalog limits.
Self-check: Does `npm run lint:storyboard` report a recipe over its limit? Could two neighbours swap motion and still make sense?

### DR5. A glint is once, on the hero, and clipped to the shape
Rule: Do not sparkle every card. At most one glint or sheen in the deck, on the hero, clipped by the element's radius or overflow. Batch entrances are carried by the motion, not by light.
Precedent: video-shotcraft Q4, reviewer: "不需要每个卡片都闪烁一下" and "卡片出现时的泛光划过的特效取消，不好看".
Self-check: Count glints. Is the one you kept inside the shape, and have you watched it at full speed?

### DR6. The camera serves reading
Rule: Dense text stays square to the room. A tilt is a single shot with a reason, and the words on it still pass the type floor (reading ≥ 22px, nothing under 18px at 1920). Do not scale type down to fake a camera move. Measure the rendered ink, not the authored font-size.
Precedent: video-shotcraft Q6 and Q11. Reviewer, on a tilted list: the list page was rolled back to a straight-on view; "聚焦到一个卡片……是从左侧拍摄而不是从下方". On type: "那些镜头里面的字太小了，根本就看不见".
Self-check: If this step is tilted or scaled, can you read every line at 1280×720? Did the layout gate stay at 0?

### DR7. Motion is deterministic
Rule: No `Math.random`, no `Date.now`, no unseeded stagger. The same Next from the same step always produces the same frames, so a snap/pop run can be compared to the last one.
Precedent: video-shotcraft core rule 9. A deck that cannot be seeked frame-by-frame cannot be reviewed.
Self-check: Does `qa:run` on the same range produce the same snap/pop counts twice?

### DR8. Slides hand off; they do not cut
Rule: The next slide starts about 200ms before the previous one has finished leaving (150–250ms). Old type is gone before new type occupies the same place. The running head eases to the new folio. A hard cut is a missed hand-off.
Precedent: reviewer, on the 17-slide deck: the motion needed to be refined and the join needed to feel continuous ("motion还要精修，并且要衔接自然"). Measured target: overlap 200ms, 0 text-on-text in `qa-handoff`.
Self-check: For each boundary, what is `overlapMs` in the motion run, and did handoff report 0 overlaps?

## Picture (DQ)

### DQ1. A photograph stays a photograph
Rule: No halftone, dot screen, or mask of dots over a photo. Natural colour. If type sits on the photo, it is a local scrim (`data-over`), not a tint on the picture.
Precedent: reviewer: "The halftone / dot-screen mask on photos makes the images unreadable. Drop halftone and dot masks on ALL photos."
Self-check: At 100% on the contact sheet, can you name what is in the photo? Does `qa:design` report a halftone or a radial mask?

### DQ2. Neighbouring slides cannot trade layouts
Rule: Shared tokens and a shared grid are the system. The composition changes every slide. If two neighbours could swap and the argument would look the same, one of them is a template.
Precedent: reviewer: "still a bit formulaic". The failure mode was a repeated top-left headline, kicker, hairline, and caption row.
Self-check: On one contact sheet of final steps, which pair could be swapped?

### DQ3. Design is layout and type, not monospace everywhere
Rule: Hierarchy comes from size, weight, and position. Monospace is for ids and folios, not for titles and body.
Precedent: reviewer: "Design sense must show in the LAYOUT/typesetting". Uniform mono read as a template.
Self-check: Cover the pictures. Does the type alone show what matters?

### DQ4. Do not ship orange and blue together
Rule: An orange accent beside a blue accent reads as a stock theme. Pick a ground, an ink, and one device colour. The scaffold tokens are placeholders until the direction is chosen. The device colour is not used as small text or as a hairline.
Precedent: reviewer: "Orange + blue feels formulaic".
Self-check: Does `qa:design` still warn about the placeholder pair? If the direction is chosen, has that warning gone?

### DQ5. Prefer a real, licensed photograph to an SVG illustration
Rule: People, objects, and places are photographs with a credit. A diagram may be markup (a loop, a score) and is labelled made here. An SVG used as a scene is the wrong asset.
Precedent: reviewer: "尽量别用svg做素材".
Self-check: For each picture, is the credit on the slide or the references slide? Is any SVG pretending to be a photo?

### DQ6. Do not veil a field of images
Rule: A grid of photos stays full colour. Choosing one of them is a motion that removes the others, not a wash laid on top.
Precedent: reviewer, on a washed wall of options: it "looks like a mask". Same family of failure as DQ1.
Self-check: Is any translucent layer sitting across more than one photo?

## Process (DP)

### DP1. Confirm in order, before building slides
Rule: Do not build per-slide layouts until these four are written down, in order: brief, visual direction with styleframes, content-to-motion map, full storyboard with recipe names. A later stage does not quietly reopen an earlier one.
Precedent: video-shotcraft pipeline stages 0–3, adapted to this workflow's co-design. Building the deck before the map is how every slide inherits one template (DQ2) and one animation (DR4).
Self-check: Does `handoff.md` name all four as confirmed, with dates, before `index.html` slides were built?

### DP2. The last review is a clean context with frames
Rule: Before delivery, a reviewer who did not make the deck checks every id in this file against frames or step stills. The maker's reasons are not evidence. A check without a frame is "unable to verify".
Precedent: video-shotcraft P1, reviewer: "你自己有截图检查质量吗？" and final-review: do not hand the reviewer the build diary.
Self-check: Does `qa/final-review.md` cite a file for every failure and every pass that claims a picture?

### DP3. A reference shot is adapted per step, not issued as a style for the whole deck
Rule: Take a recipe's motion idea and retune it to this argument. Do not paste one reference's camera, palette, or timing onto every slide.
Precedent: video-shotcraft P2, reviewer: pull the moves apart and "不适合的不用强行适配". A set of reference stills treated as one house style was rolled back.
Self-check: For each recipe in the storyboard, what was dropped because it does not fit a talk?

### DP4. A 0 from a checker is not a pass until it can fire
Rule: Layout, handoff, and snap/pop gates must be shown to catch a planted fault once per project. A seek that does not move the clock, or a deck with no text, can report 0.
Precedent: this workflow, after a handoff checker swallowed a seek error and reported no overlaps, and after a layout pass that had not been shown a deliberate collision.
Self-check: Where is the planted-overlap (or planted-seek) note in the qa report?
