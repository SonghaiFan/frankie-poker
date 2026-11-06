# Poker introduction audit

Audited 2026-11-06. Existing custom bilingual introduction and felt visual identity retained and expanded. Scope: `site/`, new public demo screenshots, Pages assembly script and workflow only. App code, prompt variables, algorithms, browser settings and credentials are unchanged by source edits.

## Real app opened

Opened https://poker.songhai.site in shared Ego workspace. Entered the nonpersonal name `Intro Demo`, selected Local Practice, dealt a hand, used Call and returned to the lobby. Its separate bankroll remained500. Captured `docs/images/lobby-current.png` and `practice-current.png` from the current interface. Then selected Footscray only to inspect an opponent's instructions and local Preview; captured `preview-current.png`. No model venue was started, prompt changed, connection key viewed, paid API called, or tournament run.

The current interface uses `#13251d` felt edge, `#35654d` illuminated felt, rounded dark action controls and thin-weight system typography. Existing site already matches this identity; retained its venue artwork, language switch, feature composition, links and genuine earlier recordings. Removed external font requests in favor of app-appropriate system type. Design read: preserve an experimental poker product page for curious players/developers; variance5, motion2, density4. App-theme fidelity takes precedence over imposing a light theme.

## Code evidence

- `App.tsx`, `components/LandingPage.tsx`: local mode path, free1000 practice chips, five/ten blinds, one to nine opponents, rooms gated by buy-in and bankroll, initial500 bankroll. Choosing a venue is separate from starting a paid game.
- `services/localPractice.ts`: every local seat forced to offline rules; rules see only the bot's own cards and revealed streets, not future board information; simple heuristics rather than a strength claim.
- `components/PokerGame.tsx`: legal player actions, street progression, hand log, swipe-fold interface and bypass of bankroll/opponent-record persistence in local mode.
- `services/pokerSituation.ts`: player-visible situation and legal action/sizing context.
- `services/seats.ts`, `components/OpponentSheet.tsx`: per-seat/per-player model/style/prompt persistence, immediate-save edits, separate JEV instructions and chat templates. Done closes rather than committing.
- `services/promptPreview.ts`: real fixed two-hole/five-board sample and per-street request construction. Intro build extracts those cards directly from this source. `site/hand.js` only reveals the sample by street; no evaluation, persistence, model request or gameplay engine is embedded.
- `services/aiProviders.ts`: JEV decision versus chat contracts; chat action probabilities are play frequencies, not probabilities of winning. Model responses remain experimental, not proof of strategy quality.
- `services/aiConnection.ts`, `bankroll.ts`, `gameSettings.tsx`, `seatStats.ts`: browser storage and user-entered hosted credentials. No environment file or saved credential was inspected.
- `index.css`, `services/gameSettings.tsx`: actual felt colors and optional interface skins; default site uses existing felt palette.

## Research

Read [PokerStars Learn: Texas Hold'em Rules](https://www.pokerstars.com/poker/learn/lesson/texas-holdem-rules/), a primary operator rules reference. Paraphrased only the core best-five-of-seven, four betting streets, shared board and fold/showdown concepts. No recommended profitable strategy, gambling outcome or benchmark claim is made. App-specific implementation facts come from owning source rather than the general rules article.

## Validation

- `bash scripts/build-site.sh /tmp/poker-intro-preview`: self-contained static assembly with standard-library Python; no app build or environment reads.
- Local link/asset checker: one bilingual HTML page, zero issues.
- `node --check site/hand.js`, inline-language script syntax and `git diff --check` pass.
- Shared browser control was paused for an unrelated permission prompt, then resumed only after the user handled it. Generated site was opened after root confirmed control. Desktop1468px and English/Chinese390px each had no horizontal overflow. All images loaded. Four street buttons revealed0/3/4/5 board cards as expected and maintained a single selected button. Language toggle changed the in-place page correctly. Desktop and mobile screenshots visually reviewed; device override cleared. No Lighthouse score claimed.
