# Agent guide: configure, write a strategy, test it

This repository is a local-first poker playground. An agent helps the human configure it and experiment; it must not promise a profitable or optimal poker strategy.

## 1. Establish the environment

Read `AGENTS.md`, `README.md`, `package.json`, and the relevant source before editing. Check the current branch and working-tree changes; preserve unrelated work. Use Node.js 22+ and `npm ci`.

Copy `.env.example` to `.env.local` only if the latter does not already exist. Ask the human to set `OPENROUTER_API_KEY` privately. Never open, print, paste, commit, or screenshot a real key. The Vite configuration embeds this key in client JavaScript, so a keyed build is for local use only. Never publish it.

Start `npm run dev` and use the URL Vite prints. Do not assume a previously running server belongs to this checkout. The dev server binds all interfaces by default; use `npm run dev -- --host 127.0.0.1` for a loopback-only session.

## 2. Understand the strategy surface

- `components/OpponentSheet.tsx`: the UI for model choice, style, prompt editing, and preview.
- `services/seats.ts`: per-player browser settings, `promptForModel` and `withPromptForModel`; JEV and chat templates have distinct saved fields.
- `services/aiProviders.ts`: model kind, request construction, and response contracts.
- `services/pokerSituation.ts`: decision instructions and player-visible situation.
- `services/promptFields.ts`: shared field catalog; do not invent field paths.
- `services/promptPreview.ts`: sample situations and request/token preview.
- `plugins/AGENTS.md`: mandatory instructions for variable or algorithm changes.

A strategy is prompt guidance unless the user explicitly requests an engine change. Write it to a reviewable file under `docs/strategies/`, explain its intended behavior, and let the human apply it to a chosen opponent. Do not silently overwrite every seat or browser settings.

## 3. Produce a useful strategy

Ask for the intended behavior if necessary: cautious value play, loose aggression, adaptation to observed opponents, or a particular experiment. Define a small number of concrete decisions and include a short rationale. Refer only to registered fields. Missing evidence is unknown, not zero. Do not use other players' hole cards, future board cards, or private reasoning.

For **JEV**, provide action instructions. For **chat models**, edit the strategy section of the current full system template while preserving the required response shape, legal-action keys, raise-size keys, and probability semantics. Do not replace the complete chat template with a prose-only strategy.

Use `docs/strategies/cautious-value.md` as a starting point. Keep a copy of the prior prompt so the user can compare versions.

## 4. Apply and inspect in the UI

1. Open the lobby and pick an affordable venue.
2. Expand Your table, click the chosen opponent, and select a model available at that venue.
3. Keep Let the model decide enabled if the experiment should use the model preflop as well as postflop. Style presets may select preflop actions from charts.
4. Apply the strategy in Edit. Changes save immediately; Done only closes the editor.
5. Use Preview for all four streets. Check known references, absent values, available legal actions, and Raw request content. Token/cost figures are estimates.
6. Verify that closing and reopening the editor retains the draft. Browser state is per origin and player name; other ports and browser profiles have separate storage.

Preview is local request inspection, not proof that the model followed the strategy. Actual hands make paid API requests. Obtain the human's authorization and budget before running a game or tournament on their behalf. A few successful hands do not establish strategy strength.

## 5. Extend only when needed

For a missing derived field, read `plugins/AGENTS.md` and both linked API guides. Prefer deterministic formulas for arithmetic. Register algorithm plugins explicitly and add contract tests. The shared catalog should expose the field without variable-specific UI code.

Run:

```bash
npm run test:variables
npx tsc --noEmit
npm run build
```

Keep `.env*` (except `.env.example`), `dist/`, `.tournament/`, and personal screenshots out of commits. Inspect staged files before publishing. Report the changed files, verification performed, whether any live model calls occurred, and remaining limitations.
