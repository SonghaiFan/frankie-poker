# Contributing

Welcome: clearer strategy tools, accessible interaction, bug fixes, and well-tested poker variables are all useful contributions.

1. Open an issue describing the problem or experiment.
2. Fork the repository and create a focused branch.
3. Follow `AGENTS.md`; variable work also follows `plugins/AGENTS.md`.
4. Run `npm run test:variables`, `npx tsc --noEmit`, and `npm run build`.
5. For UI changes, inspect desktop and phone layouts and include non-personal screenshots.
6. Open a pull request explaining the behavior, validation, and limitations.

Never include API keys, `.env.local`, generated builds, or private model-request traces. Use fictional names in screenshots. Preserve saved prompts and variable paths, and describe migrations when necessary. Do not claim strategy strength or GTO correctness from a small sample of games.
