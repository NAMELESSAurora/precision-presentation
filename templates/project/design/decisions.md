# Decisions log

Every exception to the design system, every change of direction, every user request that changes the deck.
Quote the user's own words where possible. Status words: `self_selected` (the agent chose) or `user_selected` (the user picked). Never write “user-approved” for an agent choice, and never mix the two words. Locked rows are copied into `handoff.md`.

| # | Date | Decision | Why | Consequence |
|---|---|---|---|---|
| D01 | YYYY-MM-DD | Plain HTML/CSS/JS from the precision-presentation scaffold; deck.js owns all state | One runtime; runs from file:// | Tests in tests/deck.spec.mjs |
