# README artwork — Frankie Poker

This banner uses the shared Frankie Swiss-style template: a white 1920 × 640 canvas, consistent type, grid and signature, with real product material. The source configuration and images are committed together so they can be replaced after UI updates.

## Update after a release

1. Capture the current running app, or export its actual source icon/artwork. Use sample or empty state; do not include private records, accounts or credentials.
2. Replace the relevant file in `assets/`, keeping its name, or update `assets[].src` in `banner.json`.
3. For screenshots, check `source_size` and `crop` (`[x, y, width, height]` in source pixels). `contain` keeps the whole crop; `cover` fills its slot. `align` controls the crop alignment. The original input is preserved.
4. Rebuild from the repository root:

```sh
python3 docs/readme/build.py docs/readme/banner.json --png
```

SVG generation uses the Python standard library. The optional `--png` export needs CairoSVG (`python3 -m pip install cairosvg`) and the Cairo system library. On macOS, Cairo can be installed with `brew install cairo`; if library discovery needs help, run with `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib`. No image-generation API key is used.

`banner.svg` is editable and embeds the source images. `banner.png` is the GitHub README display copy, avoiding differences in SVG embedded-image support. Regenerate both after replacing assets. The script and original signature are included locally, so this repository builds independently of sibling projects.

## Sources

See `banner.json` for each material and `source-version.json` for the captured source revision. Materials were extracted from the current app or original source on 2026-11-05. The banner has vector text and signature; screenshot/canvas/artwork inputs remain raster images.
