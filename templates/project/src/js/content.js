/* Editable configuration. Classic script (works from file://). Edit values here, not in deck.js.
 * media : video / audio slots. Put the file in assets/media/, then set `src` to its path. src: null = not supplied:
 *         the poster / static credit stands in and no request is made. URL override for QA: ?<ID>=path or ?<ID>=none.
 * slots : images that may arrive later (a real frame, a cover). src: null = the element marked data-slot-fallback shows.
 * text  : optional lines (a first-person sentence, a maker credit). null = the element is removed and steps renumber.
 *         Never fill these with invented content: they must come from the presenter.
 * slides: planned seconds per slide (presenter pace + speaker-notes total); optional: true = skippable on the short path.
 */
window.DECK_CONTENT = {
  title: 'Presentation Title',
  package: 'Presentation', // base name of the release folder, zip and submission PDF (scripts/package.mjs)
  media: {
    OPEN: { src: null, kind: 'video', label: 'Opening video' },
    CLIP_A: { src: null, kind: 'audio', label: 'Clip A (~6 s)' },
    CLIP_B: { src: null, kind: 'audio', label: 'Clip B (~6 s)' },
  },
  slots: {
    PLATE: { src: 'assets/img/sample-plate.jpg' },
  },
  text: {
    personal: null, // e.g. 'One sentence the presenter wrote or approved.'
    personalSource: null, // e.g. 'From my own notes'
    maker: null, // e.g. 'Your Name' (credits slide)
  },
  slides: {
    S01: { seconds: 45 }, S02: { seconds: 45 }, S03: { seconds: 60 }, S04: { seconds: 50, optional: true },
    S05: { seconds: 50 }, S06: { seconds: 0 },
  },
}
