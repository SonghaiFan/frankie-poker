# UI styles

Choose a style in the player settings. Offsuit is the default; existing browser
settings without a style continue to use Offsuit. Frank is the original
pre-minimal interface from `codex/pre-minimal-ui` (`494a7b1`). The choice is stored
in the existing `frankie-game-settings-v1` record alongside avatar and felt color.

## Frank source and boundaries

`components/frank/` preserves the original playing cards and backs, opponent panels, community-card slots,
player layout, and gold raise slider. Phones retain the original three-part full-width table. Desktop layouts borrow
Offsuit’s information density while retaining Frank’s cards and controls.

The shared `PokerGame` owns all game state and action handlers. The shared
`PlayerStratum` supplies raise state, legal amounts and callbacks to Frank's
player view. The shared `LandingPage` supplies current venues, saved seats,
model availability and game configuration. No older engine, model client,
bankroll or strategy code is restored.

Adaptations needed to retain current features:

- Local Practice and current venue/model data remain available.
- Language and appearance settings remain accessible. At the table, click your
  player name to change appearance.
- Both styles share Offsuit login copy, title, typography and form layout. Frank
  distinguishes primary and player-count buttons with gold surfaces and borders.
- Both styles share the Offsuit setup screen: venue cards, bankroll, player-count
  controls and editable opponent list. The old order-sheet setup is not used.
- Opponent names open the current statistics sheet.
- At 1440px and wider, player statistics and hand history flank the table.
- At 1024–1439px, they share a tabbed right sidebar. Below 1024px, the
  top-right information button opens the same panels.
- Resizing rearranges one mounted table and one instance of each panel.
- The current legal raise limits, short-stack call amounts and skip-hand action
  are retained.
- Opponent labels are layered above the cards so the original overlapping layout
  does not hide names and stacks.

Frank is a separate presentation of the current game, not a checkout of the old
application. Offsuit keeps its current layout and controls.
