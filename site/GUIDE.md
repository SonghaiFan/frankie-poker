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
