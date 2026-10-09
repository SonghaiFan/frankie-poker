#!/usr/bin/env bash
# Assembles the GitHub Pages home page into _site/: the static page in site/
# plus the screenshots and venue art it shares with the README and the app.
# No app build and no environment variables are involved, so no API key can
# end up in the published files.
set -euo pipefail
cd "$(dirname "$0")/.."

out=_site
rm -rf "$out"
mkdir -p "$out/images" "$out/venues"

cp site/index.html site/style.css site/favicon.svg "$out/"
cp assets/frank-signature.svg "$out/"
cp assets/venues/*.png "$out/venues/"
cp docs/images/lobby.png docs/images/strategy.png \
   docs/images/gameplay-desktop.gif docs/images/gameplay-mobile.gif "$out/images/"
touch "$out/.nojekyll"

echo "Built $out/ ($(du -sh "$out" | cut -f1))"
