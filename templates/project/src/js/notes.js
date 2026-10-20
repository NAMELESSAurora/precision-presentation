/* Speaker notes. Loaded ONLY by presenter.html, never by the audience deck.
 * speaker-notes.md is generated from this file (node scripts/build-notes.mjs) — edit here, not there.
 * cues[k] = what to say when step k appears. Mark anything the presenter must confirm with [待确认] / [TO CONFIRM];
 * never put invented personal experience, quotes or numbers here. */
window.DECK_NOTES = {
  S01: {
    seconds: 45,
    goal: 'The one thing the audience should take from this slide.',
    cues: [
      '(On entry) What to say while the poster shows. If there is a video: press K to play; one → only warns, a second → stops it.',
      '(Step 1) The title appears: introduce the question.',
    ],
    bridge: 'The transition line into the next slide.',
    sources: 'R01',
    limits: 'What must not be claimed here.',
  },
  S02: {
    seconds: 45,
    goal: 'The claim.',
    cues: ['(On entry) The question.', '(Step 1) First half of the answer.', '(Step 2) Second half.', '(Step 3) The claim, in one sentence.'],
    bridge: '',
    sources: 'Our own working distinction',
    limits: 'Do not present our distinction as a quotation.',
  },
  S03: {
    seconds: 60,
    goal: 'What the image shows, and what we read into it.',
    cues: ['(On entry) Say what the image is and where it comes from.', '(Step 1) First question.', '(Step 2) The call-outs: only facts.', '(Step 3) The reading. [TO CONFIRM: a personal line, only if the presenter supplies it]'],
    bridge: '',
    sources: 'asset-manifest',
    limits: 'A close reading, not a claim about every viewer.',
  },
  S04: {
    seconds: 50,
    optional: true,
    goal: 'Two possible readings; neither assumed in advance.',
    cues: ['(On entry) The shared starting point.', '(Step 1) Reading A.', '(Step 2) Reading B.', '(Step 3) The study and its limits (association, not causation).'],
    bridge: '',
    sources: 'R02',
    limits: 'Cross-sectional study: no causal claim, no effect sizes.',
  },
  S05: {
    seconds: 50,
    goal: 'The answer to the question.',
    cues: ['(On entry) The conclusion.', '(Step 1) Question 1.', '(Step 2) Question 2.', '(Step 3) Question 3.', '(Step 4) The discussion question.'],
    bridge: '',
    sources: 'R01, R02',
    limits: 'First-person lines only if the presenter wrote or approved them.',
  },
  S06: {
    seconds: 0,
    goal: 'References — not read aloud.',
    cues: ['APA references, links open in a new tab and need internet.'],
    bridge: '',
    sources: '',
    limits: '',
  },
}
