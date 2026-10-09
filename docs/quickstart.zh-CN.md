# Frankie Poker 中文上手指南

Frankie Poker 是一个开源的德州扑克实验场：选对手模型、改提示词、预览模型能看到的信息，再到牌桌上试验。筹码是虚拟的，模型请求会消耗你自己的 OpenRouter 余额。

## 本地启动

安装 Node.js 22 或更新版本，准备有额度且能使用目标模型的 OpenRouter API key。

```bash
git clone https://github.com/SonghaiFan/frankie-poker.git
cd frankie-poker
npm ci
cp .env.example .env.local
```

用编辑器在 `.env.local` 填写 `OPENROUTER_API_KEY`，然后运行 `npm run dev`，打开终端显示的网址（通常是 `http://localhost:3000`）。修改 key 后重启服务。

当前配置会把 key 编译进浏览器代码，只适合本地使用。不要公开带 key 的构建产物或开发服务器。发布在线版需要用户自带 key 或有身份验证和限流的后端代理。

## 开始玩

![大厅](images/lobby.png)

1. 输入名字；相同浏览器、网址和名字会恢复对应的资金和对手配置。
2. 欢迎页的「游戏设置」或大厅左上角头像可以修改头像、背景颜色。
3. 初始资金 500，先选择买入 200 的 Footscray 社区牌室。场地决定可用模型与盲注。
4. 展开「你的牌桌」，点击一个对手，选择模型、策略和提示词；加减按钮调整人数。
5. 点击「入座」。离开牌桌时，剩余筹码返回资金余额。

## 改策略，再预览

![策略预览](images/strategy.png)

对手编辑器中的 JEV 使用「行动指令」，聊天模型使用完整 system prompt。修改聊天模型策略时，保留默认模板里的返回格式要求。

搜索变量并点击插入，切换「预览」，分别查看翻牌前、翻牌、转牌、河牌的示例值和 Raw 请求。预览在本地构造示例，不会调用模型。编辑会即时保存，「完成」只关闭面板；「恢复默认」重置当前模型类型的提示词。

要让模型每条街都决定动作，保持「交给模型自己判断」开启。风格预设可能用牌表处理翻牌前动作。

## 交给你的 AI agent

打开项目，把下面这段交给 agent：

> 阅读 AGENTS.md 和 docs/agent-guide.md，帮我在本地配置 Frankie Poker。不要读取或输出我的 API key，告诉我在哪里手动填写。为一个对手写一份谨慎价值型策略，保存为 Markdown，保留模型的输出协议，并引导我在 UI 中应用和预览四个轮次。执行相关检查，说明哪些验证已完成。调用付费模型前先获得我的授权。

可以从 [示例策略](strategies/cautious-value.md) 开始。添加变量前，让 agent 阅读 [插件贡献规范](../plugins/AGENTS.md)。预览不是效果评估；真正的模型行为需要实际牌局验证，少量胜负不能证明策略优劣。

## 致谢

向 [Offsuit](https://offsuit.app/) 致敬：它现代、极简的扑克 UI/UX 是本项目的重要设计参考。Frankie Poker 是独立项目，与 Offsuit 无隶属或背书关系。
