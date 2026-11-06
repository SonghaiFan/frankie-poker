#!/usr/bin/env bash
# Assembles the GitHub Pages home page into _site/: the static page in site/
# plus the screenshots and venue art it shares with the README and the app.
# No app build and no environment variables are involved, so no API key can
# end up in the published files.
set -euo pipefail
cd "$(dirname "$0")/.."

out="${1:-_site}"
rm -rf "$out"
mkdir -p "$out/images" "$out/venues"

cp site/index.html site/style.css site/favicon.svg site/hand.js "$out/"
cp docs/readme/banner.png "$out/images/banner.png"
cp docs/images/*-current.png "$out/images/"
cp assets/frank-signature.svg "$out/"
cp assets/venues/*.png "$out/venues/"
cp docs/images/lobby.png docs/images/strategy.png \
   docs/images/gameplay-desktop.gif docs/images/gameplay-mobile.gif "$out/images/"
touch "$out/.nojekyll"


python3 - "$out" <<'PYTHON'
import json,re,sys
from pathlib import Path
source=Path('services/promptPreview.ts').read_text()
suits={'Spades':'♠','Hearts':'♥','Diamonds':'♦','Clubs':'♣'}
def cards(name):
    match=re.search(r'const '+name+r' = \[(.*?)\];',source,re.S)
    if not match:raise ValueError('Preview sample missing: '+name)
    return [[rank,suits[suit]] for rank,suit in re.findall(r'card\("([^"\n]+)", Suit\.(\w+)\)',match.group(1))]
data={'hole':cards('HOLE'),'board':cards('BOARD')}
assert len(data['hole'])==2 and len(data['board'])==5
Path(sys.argv[1],'hand-sample.json').write_text(json.dumps(data,ensure_ascii=False))
PYTHON

echo "Built $out/ ($(du -sh "$out" | cut -f1))"
