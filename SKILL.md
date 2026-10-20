---
name: precision-presentation
description: 精致演出型网页演示文稿（HTML/CSS/JS，无构建步骤）的全流程工作流 + 可直接复制的通用脚手架。用于课堂 / 汇报 / 答辩 / 讲座演示：论证与分镜、事实与来源账本、艺术方向与设计系统、逐步揭示与动效、开场视频 / 音频嵌入、演讲者窗口与讲稿、三轨 QA（静态 / 动态 / 现场可靠性）、离线打包、提交用 PDF、讲稿大纲与外部讲稿核对、教室电脑故障排查。源自 Nostalgia on Repeat（2026-10）的完整制作，执行用户的 precision-presentation 规范 v1.0。
---

# Precision Presentation — 可复用工作流

把一个论点做成**可讲述、可观看、可控制、可复现**的现场演示。主交付是浏览器里的 HTML 演示（双击 `index.html` 就能离线放映）；PPTX 只在用户要求时做。

- **流程：** 用户的规范原文是 `reference/00_spec_precision-presentation_v1.md`，各阶段的执行细节和踩过的坑写在 `reference/`。
- **脚手架：** 一套已测好的通用工程（运行时、样式、QA / 导出 / 打包脚本、测试、文档模板）放在 `templates/project/`。

## 什么时候用
- 用户要做演示文稿、课堂 presentation、汇报、答辩，并且在意“精致”“动效”“风格化”，或者要嵌入视频 / 音频。
- 已有一个 HTML 演示要做 QA、打包、导出 PDF、修现场问题（例如教室电脑上打不开、动效不一样）。
- 用户给了 Gemini 等外部工具写的讲稿，要核对事实、计时并修改（`reference/04_content_integrity.md` §讲稿）。

## 快速开始
1. **新建项目：** `node <skill>/tools/new-deck.mjs <项目目录> --title "标题" --package Short_Name [--link-modules <已有 node_modules>]`，会把 `templates/project/` 复制过去，并写入标题。
2. **安装依赖：** 在项目目录运行 `npm install`（只装 `@playwright/test`）。离线时用 `--link-modules` 链接一份现成的。Playwright 自带的浏览器下载失败时，设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指向本机已有的 chromium 或 chrome.exe。
3. **确认脚手架能跑：** `npx playwright test`，14 项应全部通过。
4. **按 P0→P7 推进**（见下）。每次改动后跑一遍对应的 QA，交付前跑 `npm run release`。

## 总流程（质量门细则见 `reference/01_workflow.md`）
| 阶段 | 做什么 | 产物 | 过门条件 |
|---|---|---|---|
| P0 审计 | 读材料、能力、限制；先只读后修改 | `brief.yaml` `capabilities.md` | 知道能做什么、哪些无法验证 |
| P1 论证 | 主张 → 每页 takeaway / 证据 / 过渡 / 时长；事实账本 | `storyboard.yaml` `claims.yaml` `sources.md` | 纯文本读一遍论证成立，每个事实可追溯 |
| P2 艺术方向 | 有参考就忠实提炼；没有参考才做 2–3 个方向，用**封面 + 最难的内容页**比较 | `design/selection.md` 和样稿截图 | 复杂内页也成立；记为 self_selected |
| P3 设计系统 | 角色色 token、字号网格、页型、动作语法 | `design/design-system.md` `motion-spec.md` `tokens.css` | 规则具体到另一个 Agent 也能执行 |
| P4 原型 | 三页端到端：复杂页、关系页、媒体页 | 可操作原型和测试 | 能进、能退、能停、能恢复、能跳过 |
| P5 全稿 | 每批 3–4 页，先静后动；素材进账本 | 全稿、`asset-manifest.yaml`、备注 | 没有未标注的占位 |
| P6 三轨 QA | 静态截图 / 动态胶片条 / 媒体 / 冷启动；问题分 P0–P3 | `qa/<round>/`、`qa/qa-report.md` | 没有 P0/P1；至少两轮真实审查 |
| P7 交付 | 排练计时、短路线、打包、提交 PDF、交接 | `release/`、`run-of-show.md`、`handoff.md` | 解压后冷启动通过；每项状态都可核验 |

## 硬规则（换项目默认遵守）
- **主张优先，静态成立，动态增益。** 去掉动画后页面仍然完整；每个动作都要回答“删掉它会损失什么理解”。
- **讲者掌握节奏。**
  - **Next 规则全局一致：** 动画进行中先结束动画，否则进入下一步，最后一步再翻页。
  - **播放中的视频：** 第一次按只提示，2.5 秒内再按才停止。
  - **退回：** ← 或右键，立即生效。
- **不编造。** 引文、数字、时间码、个人经历、素材来源都不编。生成图必须标 MADE HERE。第一人称句子只用讲者本人写的或确认的。外部 LLM 写的讲稿必须逐条核对（`04_content_integrity.md`）。
- **事实和解读分开标注：** FACT（实心点）、READING（空心圈，我们的解读）、PACKAGING（半填方块）、MADE HERE（强调色方块）。用图形加文字区分，不只靠颜色。
- **颜色只走角色 token**（`--night-* / --day-*` → `--c-*`），组件里不写 hex。换主题用 flood（从一条线长出新背景），不对背景色做插值，否则夜↔昼之间会出现发灰的过渡。
- **动效默认完整，不跟随系统“减少动画”，也不记住上次的选择**；A 键只对本次有效，`?motion=reduced` 强制减弱。原因：学校和远程电脑常关掉动画；`file://` 和 `http://` 在浏览器里是两个地址，各记各的选择，会导致两种打开方式看起来不一样。
- **离线第一：** 双击 `index.html` 必须能完整放映（视频、动效、演讲者窗口）。不依赖 Node 或服务器；`start-server.cmd` 只是可选项。不用 CDN，不加载在线字体。
- **证据才算数：** 没看截图不说视觉合格；没看胶片条不说动效合格；没人听过就标 `NOT_TESTED`；没在目标设备上测过就不承诺现场稳定。同一个模型的自检不能叫独立审查。
- **交付前必须冷启动解压后的包。** 用 Explorer 同款的 Expand-Archive 解压到临时目录，再跑 `verify-dist --root`。
- **Write 工具写长文件会截断或损坏**（这个项目里出现过 4 处）：长文件分段写，写完用 `node --check` 或 grep 检查。heredoc 里有引号、`’`、`→` 时容易被 shell 搞坏，改用 Write 工具。

## 运行时速查（详见 `reference/02_runtime.md`）
- **幻灯片：**
  - 结构：`section.slide#S01 [data-theme=night|day] [data-label] [data-ref]`。
  - 步骤：`[data-reveal=k]` 从第 k 步出现，0 表示入场就出现。
  - 动作：`data-anim` 取 `rise | fade | wipe | draw | slide-l | slide-r | meter | type`；块内的 `[data-type-on]` 和 `img[data-load]` 跟着这个块一起动。
- **可选内容：**
  - 视频：`.media[data-media=ID]`。
  - 音频：`button[data-audio=ID]`，同一时间只播一段。
  - 图片：`[data-slot-box=ID]` 里放 `img[data-slot=ID]`；缺图时显示 `[data-slot-fallback=ID]`。
  - 可选文字：`[data-text=key]`。
  - 以上都在 `src/js/content.js` 里配置；内容为空时元素被移除，步骤自动重新编号。
- **按键：** → 空格 点击 = 下一步；← 右键 = 上一步；K/J/L/M = 播放 / 重播 / 跳过 / 静音；S 演讲者窗口；F 全屏；G 总览；B 黑屏；A 减弱动效；数字 + Enter 跳页。
- **URL 参数：** `#S03.2`（第几页第几步）、`?mode=static`（阅读版 / PDF）、`?palette=`、`?motion=reduced`、`?<媒体ID>=path|none`、`?embed=1`。
- **API：** `window.deck` 提供 `next prev goto finish state ready setMotion`。测试和演讲者窗口都只走这个接口。

## 命令速查（在项目目录）
`npx playwright test` · `node scripts/qa-shots.mjs <round>` · `node scripts/qa-motion.mjs <round> [--from S03 --to S05]` · `node scripts/qa-media.mjs <round>` · `node scripts/build-notes.mjs` · `node scripts/export-pdf.mjs` · `node scripts/build.mjs` · `node scripts/verify-dist.mjs <round> [--root 目录]` · `node scripts/package.mjs` · 一条龙：`npm run release`。

## 文件
- `reference/00_spec_precision-presentation_v1.md`：用户的规范原文（权威）。
- `reference/01_workflow.md`：P0–P7 怎么执行、每个门查什么、常见坑。
- `reference/02_runtime.md`：脚手架架构、标记约定、媒体生命周期、演讲者窗口、扩展点（自定义转场、时间线、风格层）。
- `reference/03_design_motion.md`：设计系统、世界 / 角色色、反模板、动作语法、动效策略、风格层。
- `reference/04_content_integrity.md`：事实 / 来源 / 素材账本，标签，占位符换成真实素材，嵌入长 demo，讲稿大纲与核对。
- `reference/05_qa.md`：三轨 QA 的命令、读法、问题分级、评分、预期噪音、回归范围。
- `reference/06_delivery.md`：打包、提交 PDF、教室现场清单与故障表、计时与短路线、交接。
- `reference/07_case_nostalgia.md`：Nostalgia on Repeat 的决策日志 D01–D18、用户反馈与教训。
- `templates/project/`：脚手架（复制使用；不要在 skill 目录里直接做项目）。
- `tools/new-deck.mjs`：新建项目。
