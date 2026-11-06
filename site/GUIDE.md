# Poker introduction maintenance / Poker 介绍页维护

The existing bilingual introduction, visual design and genuine gameplay GIFs are retained. / 保留已有双语介绍页、视觉设计与真实对局 GIF。

- `site/index.html`: introduction, bilingual copy, app CTA (`https://poker.songhai.site`) and usage sections. / 双语文案、应用链接与使用说明。
- `site/style.css`, `site/favicon.svg`: existing visual design. / 现有视觉样式。
- `docs/images/lobby.png`: lobby; replace when venues or lobby controls change. / 场馆或大厅变化时替换。
- `docs/images/strategy.png`: strategy editor; replace when prompt configuration changes. / 策略配置变化时替换。
- `docs/images/gameplay-desktop.gif`, `docs/images/gameplay-mobile.gif`: real gameplay recordings; record again when game flow changes. / 游戏流程变化时重新录制桌面与手机对局。
- `assets/venues/*.png`: venue illustrations. / 场馆插画。
- `assets/frank-signature.svg`: shared signature. / 系列签名。
- `scripts/build-site.sh`: copies the above assets to `_site/`. / 素材发布清单。

Use Local Practice and a guest identity for capture; no paid model calls or private keys are needed. Keep both language copies current, optimize GIF size, and retain screenshots as still alternatives. / 使用 Local Practice 与访客身份采集，无需付费调用或私钥；同步维护双语、控制 GIF 体积并保留静态图。

```sh
bash scripts/build-site.sh
python3 -m http.server 8080 --directory _site --bind 127.0.0.1
```

Push reviewed page changes to `main`; the existing Pages workflow publishes `_site/`. App deployment stays on Vercel. / 将审核后的页面修改推送至 `main`，由现有 Pages 工作流发布；应用继续在 Vercel 部署。

## App signature / 应用签名

The app already has its own Frankie signature; preserve its existing component and placement. / 应用已有 Frankie 签名，保留现有组件与位置。

## Current explanatory content / 当前说明内容

The page keeps its original in-place EN/Chinese language switch and felt layout. English is the initial default, with the visitor's explicitly saved choice retained. Edit both `<span lang="en">` and `<span lang="zh">` copies together. Preserve `#start` and the added `#use`/`#streets` anchors. / 保留原有双语切换与牌桌风格；同步编辑双语内容与锚点。

### Exact assets to refresh / 素材替换表

| Asset | Replace when | Owning source |
| --- | --- | --- |
| `docs/images/lobby-current.png` | Venue/buy-in, local practice or roster UI changes | `components/LandingPage.tsx` |
| `docs/images/practice-current.png` | Table, actions, hand log or local practice UI changes | `components/PokerGame.tsx`, action/table components |
| `docs/images/preview-current.png` | Prompt editor, variable presentation or street preview changes | `components/OpponentSheet.tsx`, `PromptPreview.tsx` |
| `docs/images/gameplay-*.gif` | Recorded table interaction changes | Re-record actual Local Practice, label earlier recordings when retained |
| `docs/readme/banner.png` | Approved banner changes | Copied to `images/banner.png` for social metadata |
| `assets/venues/*.png` | App room artwork changes | Shared directly with app |
| `assets/frank-signature.svg` | Approved shared artwork changes | Existing site brand |

Use a harmless new demonstration identity and Local Practice. Wait until dealing animations and Thinking states settle. Do not open account keys or personal prompt drafts for screenshots. The new static screenshots were captured on2026-11-06 at1468×1247; adjust width/height attributes when dimensions change. No paid model call is needed. / 使用无个人信息的示例名字与免费练习，等待动画稳定后采集，不拍摄密钥或私人提示词。

### Source-derived street example / 来自真实源码的街示例

`site/hand.js` loads `hand-sample.json`. `scripts/build-site.sh` extracts the `HOLE` and `BOARD` constants from `services/promptPreview.ts` during every build. This reuses the actual request preview's sample cards and deliberately does not duplicate the poker evaluator or decision engine. If those constants or syntax change, update the extractor and verify exactly two hole cards and five board cards. The build fails when the sample cannot be extracted. The Pages workflow watches that source file. / 直接读取应用请求预览的示例牌；源码结构变化时同步修改提取器，并检查2张底牌与5张公共牌。

Verify four buttons reveal0/3/4/5 board cards respectively, only one button is selected, and changing language preserves the same visible street. The demo makes no network call beyond its local JSON asset. It stores no result and does not expose opponent hands. / 检查四条街的牌数、单一选中态与语言切换；示例不保存数据、不调用模型。

Build requires Bash and Python3, with no additional Python package:

```sh
bash scripts/build-site.sh                         # existing Pages output _site/
bash scripts/build-site.sh /tmp/poker-intro-preview # optional local review output
node --check site/hand.js
```

At desktop and390px phone width, test both languages, load every current screenshot, open both recording disclosures and try the street buttons. Preserve the original felt, rounded controls, contrast and reduced-motion behavior when refining the page. `site/AUDIT.md` records source and rules-reference evidence. / 在桌面和390px手机宽度检查双语、截图、录制展开与街切换。
