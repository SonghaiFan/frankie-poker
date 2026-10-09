# Frankie Poker

**Play poker with language models. Give them a strategy. See how they play.**

An open-source No-Limit Texas Hold'em playground for people who want to play against AI and experiment with how it makes decisions. Pick opponents, choose their models, edit their instructions, and inspect a sample hand before taking your strategy to the table.

[中文上手指南](docs/quickstart.zh-CN.md) · [Agent setup & strategy guide](docs/agent-guide.md) · [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)

![Choose a venue and configure your opponents](docs/images/lobby.png)

<details>
<summary>Watch a hand on desktop and mobile</summary>

Real gameplay against JEV, from player actions through showdown. The mobile recording uses a 390 × 844 browser viewport.

![Desktop gameplay](docs/images/gameplay-desktop.gif)

<img src="docs/images/gameplay-mobile.gif" alt="Mobile gameplay" width="390" />

</details>

## What you can do

- Play against JEV, Gemini, Claude, GPT, Grok, DeepSeek, and Kimi through OpenRouter. Available models depend on the venue; provider availability can change.
- Give each opponent its own model, play style, and prompt.
- Switch between **Edit** and **Preview** to inspect your prompt on preflop, flop, turn, and river sample situations.
- Add your own derived poker variables through registered plugins, then use them in the same editor.
- Choose your avatar and background, with English and Chinese UI and layouts for phones and desktops.

Chips are virtual. Model calls use your OpenRouter balance. This is an experimental playground, not a solved GTO engine or a controlled model benchmark.

## Start locally

Use **Node.js 22 or newer** and npm, plus an [OpenRouter API key](https://openrouter.ai/settings/keys) with access to the models you want to use.

```bash
git clone https://github.com/SonghaiFan/frankie-poker.git
cd frankie-poker
npm ci
cp .env.example .env.local
```

Set `OPENROUTER_API_KEY` in `.env.local` using your editor, then:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:3000`). Restart Vite after changing the key.

**Keep this setup local:** the current Vite configuration embeds the key in browser JavaScript. Do not upload `dist/`, deploy a build containing a personal key, or expose the dev server publicly. A public hosted version needs user-supplied credentials or an authenticated, rate-limited server proxy.

## Your first table

1. Enter a player name. Use the same name later to recover that name's saved bankroll and opponent settings in the same browser.
2. Open **Game settings** on the welcome screen, or click your profile in the lobby, to choose an avatar and felt color.
3. Choose a venue you can afford. You start with 500 chips; Footscray's first table costs 200. Higher venues unlock with your bankroll.
4. Expand **Your table** and click an opponent. All models available at this venue can be selected here. Use + / − to change the number of opponents.
5. Click **Sit down**. Play your hand, then leave the table to return your remaining chips to your bankroll.

<details>
<summary>Avatar and background settings</summary>

![Choose your avatar and background](docs/images/settings.png)

</details>

## Give an opponent a strategy

![Edit an opponent's instructions and inspect sample values](docs/images/strategy.png)

Click an opponent in the lobby. Choose a model, then edit its prompt. **JEV uses action instructions; chat models use a full system-prompt template.** Keep the chat template's response-format contract intact when changing its strategy guidance.

Search for information such as equity, position, or pot odds and click a result to insert it. Use **Preview** to switch sample streets and inspect values, legal actions, token estimates, and the raw request. This preview builds a sample request locally; it does not ask the model for a decision.

Changes save as you edit. **Done** closes the editor; **Restore default** resets the current model kind's prompt. Return to the table to try your changes in actual hands. Style presets can use chart-based preflop decisions; leave **Let the model decide** enabled when testing a model-driven strategy throughout the hand.

Try the [cautious value strategy](docs/strategies/cautious-value.md), or ask your agent to write one for you.

<details>
<summary>Manual play-style settings</summary>

Turn off **Let the model decide** to adjust the style map or choose a preset. The same controls work on desktop and mobile.

![Desktop opponent settings](docs/images/player-settings-desktop.jpg)

<img src="docs/images/player-settings-mobile.jpg" alt="Mobile opponent settings" width="390" />

</details>

## Hand this project to your AI agent

Paste this into your coding agent after opening the repository:

> Read AGENTS.md and docs/agent-guide.md. Set up Frankie Poker locally. Help me configure OpenRouter without reading or printing my API key. Write a cautious value-oriented opponent strategy as a Markdown file, preserve the model's response contract, and show me how to paste it into the UI and preview all four streets. Run the relevant checks and explain what is and isn't verified. Do not make paid model calls without my approval.

Your agent can help with setup, strategy drafts, variable plugins, and code changes. The [agent guide](docs/agent-guide.md) provides a concrete workflow and acceptance checks.

## Extend the poker information

For arithmetic, add a file-authored formula in [`plugins/variables.json`](plugins/variables.json). For card analysis or other algorithms, define a plugin and explicitly register it in [`plugins/registry.ts`](plugins/registry.ts). Field metadata automatically supplies searchable variables and readable prompt pills.

Read [the formula guide](docs/variable-plugins.md), [algorithm API](docs/algorithm-plugins.md), and [`plugins/AGENTS.md`](plugins/AGENTS.md) before changing variables. [`plugins/potPressure.ts`](plugins/potPressure.ts) is a small example.

```bash
npm run test:variables
npx tsc --noEmit
npm run build
```

`npm run tournament` runs the scripted model-vs-model harness and can incur API charges. Inspect `scripts/tournament.ts` for its configured models and hand count before running it. Results go to ignored `.tournament/` files.

## Credits

A big shout-out to **[Offsuit](https://offsuit.app/)**: its modern, minimal poker UI/UX inspired this project's visual direction and interaction design. Frankie Poker is an independent project and is not affiliated with or endorsed by Offsuit.

AI brand icons come from [LobeHub Icons](https://github.com/lobehub/lobe-icons). The JEV/Typesafe mark was supplied from [Seeklogo](https://seeklogo.com/); brand marks remain the property of their owners. Avatar fallbacks use [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji). Venue illustrations were generated for this project with a Fluent 3D-inspired material direction. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Browser data compatibility

Existing saves keep their historical `franks-holdem:` storage keys so renaming the app does not reset bankrolls, opponents, or language preferences.

## License

Original source code is available under the [MIT License](LICENSE). Third-party artwork and brand marks retain their own terms; see [notices](THIRD_PARTY_NOTICES.md).
