# Frankie README style

The README is the front door to a Frankie project. It should feel like the banner: quiet, personal, precise, and easy to scan.

## Voice

Describe what someone can actually do. Use concrete verbs and ordinary words. Prefer “Find a chord and see its voicings” to praise such as “a beautiful, powerful, premium experience.” Keep the product's own name, language, facts and limitations. Do not invent capabilities, availability, licenses or live links.

The family is consistent without making every product sound identical. Brain web and iOS share one product identity; their platform labels distinguish them. Established names such as Aurora, Blue Dictionary and Frank's Life List keep their identity.

## Page rhythm

1. The shared Swiss-style banner.
2. One product title and one short introduction.
3. A compact row of useful links: an existing app or API, companion platform, project guide, and local setup. No badge wall.
4. **What it does** — three or four concrete capabilities, in parallel bullets without nested lists.
5. **Run locally** — prerequisites where needed, one short command block or native-app workflow, and essential configuration.
6. **Before you start** — a short explanation of actual storage, account, API, platform or usage constraints. Keep it useful to the person trying the app.
7. **For developers** — relevant commands and links to the project guide and artwork maintenance.
8. A thin separator and the family credit: “Made by Songhai Fan · A Frankie project.” Add an existing license link where applicable.

Use those English section headings across the family. Body text keeps the project's existing primary language; translated READMEs remain separate. Title case is for the product name, not every word in a heading.

## Restraint

Use Markdown and normal links. Avoid centered HTML wrappers, emoji headings, nested feature lists, empty sections, repeated slogans and long support appeals at the top. Keep roughly 40–80 lines in the root README; do not remove an essential setup caveat merely to hit that range.

Leave detailed algorithms, API contracts, migration steps, data models, release limitations and long bilingual explanations in `docs/guide.md` or an existing specialist guide. Link to them clearly. Moving documentation must preserve its examples and rebase its relative links. Commands inside a guide still run from the repository root unless stated otherwise.

## Artwork

Use `docs/readme/banner.png` for GitHub display, with editable SVG, source assets and configuration beside it. Keep the real product material and pure-white template. Do not invent UI or reuse an obsolete screenshot as if it were current. Platform-shared artwork must be described honestly rather than presented as a native screenshot.

## Maintenance

The root README describes the product. Capture-session notes, verification history and banner provenance belong in their own documentation, rather than in the user-facing introduction. Update actual product facts before changing prose for style.
