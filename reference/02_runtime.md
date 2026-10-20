# 02 · 运行时与脚手架

`templates/project/` 是一套纯 HTML/CSS/JS 的演示工程：不用构建，classic script，能从 `file://` 运行。它由 Nostalgia on Repeat 的运行时去掉项目专用部分提炼而来，自带 14 项 Playwright 测试。

## 文件分工
| 文件 | 负责 | 改不改 |
|---|---|---|
| `index.html` | 所有幻灯片的标记、帮助面板 | 每个项目都要重写幻灯片 |
| `src/js/content.js` | 可编辑配置：媒体、图片槽、可选文字、每页秒数 | 常改 |
| `src/js/notes.js` | 演讲备注（只由 `presenter.html` 加载） | 常改 |
| `src/js/deck.js` | **唯一**掌管页码、步骤、按键、URL、媒体生命周期的地方 | 少改；改了要跑测试 |
| `src/js/motion.js` | 动作词汇（WAAPI），任何动画都能 finish / cancel | 加词汇时改 |
| `src/js/presenter.js` + `presenter.html` | 演讲者窗口：备注、计时、当前页和下一页预览、跳页 | 少改 |
| `src/styles/tokens.css` | 角色色、字体、字号、网格 | P3 时改 |
| `src/styles/deck.css` | 运行时框架和通用组件 | 少改 |
| `src/styles/slides.css` | 每页的版式 | 每个项目重写 |
| `src/styles/fonts.css` + `assets/fonts/` | 随包附带的 OFL 字体（Newsreader + DM Mono，附许可证） | 换字体时改 |

## 标记约定
- **幻灯片：**
  - 结构：`<section class="slide" id="S03" data-theme="day|night" data-label="…" [data-ref]>`。
  - `data-ref`：参考文献页，不计入页码，不朗读，阅读版里显示为 “References”。
  - 页眉（`S03 · label` 和 `03 / 05`）由运行时生成，不要手写。
- **步骤：**
  - `[data-reveal=k]` 在第 k 步出现，0 表示入场时出现。隐藏时用 visibility 占位，所以版面不会跳。
  - 页内的步骤数 = 用到的不同 k 值的个数 + 1。可选元素被移除后，运行时会把步骤重新编号，不会出现“按了一下什么也没出来”。
- **动作：**
  - `data-anim` 设在带 `data-reveal` 的元素上，取值 `rise | fade | wipe | draw | slide-l | slide-r | meter | type`。默认规则：`.line` 用 rise，其他用 fade。
  - `data-delay` 以毫秒为单位，写了就覆盖默认的 70 ms 依次错开。
  - 块内的 `[data-type-on]` 逐字打出，`img[data-load]` 分段加载，都只在这个块入场时触发。
- **标题：** `.title .line`、`.statement .line`、`h1 .line` 各占一行，入场时按行升起。
- **入场：** 没有 `data-reveal` 的子元素随页面淡入。`data-no-fade` 让元素立刻显示，只用在自己另有动画的元素上，否则在跨主题的 flood 之前会穿帮（见 05_qa 的例子）。

## 可选内容（都在 `content.js` 配置）
| 类型 | 标记 | 没有内容时 |
|---|---|---|
| 视频 | `.media[data-media=ID] > img.poster + video`；同一页放 `.mbar` 和 `[data-act=play/restart/mute/skip]`，再放 `.mstatus` 和 `.mtime` | 显示海报，状态写“not supplied”，不发任何请求 |
| 音频 | `button.btn[data-audio=ID] > svg + span` | 按钮禁用，写 “Clip not supplied” |
| 图片槽 | `[data-slot-box=ID]` 包住 `img[data-slot=ID]`，以及标签、标注 | 整个 box 移除，显示 `[data-slot-fallback=ID]` |
| 可选文字 | `[data-text=key]`；`data-format="“{}”"` 用来套格式 | 元素本来是空的就移除，有占位文字就保留 |

测试时可以不改配置，直接用 URL 覆盖：`?OPEN=qa/fixtures/test-video.mp4`，或 `?OPEN=none` 模拟没有视频。

## 媒体生命周期（嵌入长 demo 时总结出的规则）
- 不自动播放，必须由讲者按 K 或点击开始。`play()` 失败时提示讲者手动点。
- 视频播放中，或者在第 0 步中途暂停时，`#stage` 带 `media-live`：进度线、页眉、以及所有标了 `.over-media` 的元素都隐藏，控制条只在鼠标悬停时出现。原因：demo 自己有字幕、任务栏和片尾字幕，不能被盖住。
- 视频播放中按 Next：第一次只提示，2.5 秒内再按才停止并进入下一步。L 键直接跳过。原因：一段 2:40 的视频不能因为误触一下就被掐掉。
- 视频自然播完、或被跳过后，海报回到标题后面，因为 demo 往往以黑场结束。
- 离开这一页时暂停，回到这一页时回到海报状态。音频同一时间只播一段。

## 演讲者窗口
- 讲者按 S 用 `window.open` 打开它，靠 `postMessage` 和 opener 通信，所以在 `file://` 下也能用。通过 http 打开时，另外用 `BroadcastChannel('deck-<package>')` 通信。
- 窗口显示：当前步的备注（高亮）、下一页预览、计时器（T 开始 / 暂停，R 归零）、按每页计划秒数算出的超前或落后，并且可以点选跳页。
- 备注**只**在 `presenter.html` 里加载；测试会确认观众窗口里没有 `DECK_NOTES`。

## 静态模式与 PDF
`?mode=static`：所有步骤全部展开，`.live-only` 隐藏，`.static-only` 显示（例如在视频页写一句“Media: …, shown live only”）。`export-pdf.mjs` 用这个模式导出 1920×1080 的 PDF，同时生成每页预览图。分步替换的内容（后一步盖掉前一步）在静态模式下会叠在一起，需要单独设计阅读版的布局。

## 扩展点（来自 Nostalgia 的实现，需要时可参考）
- **跨页的“时间线”：** 一根 2 px 的细线贯穿全稿，在不同页里变成坐标轴或分叉的主干，用临界阻尼弹簧计算位置。参考 `D:/DDD/nostalgia-on-repeat/src/js/motion.js` 里的 spine，以及各页上的 `data-spine`。
- **开场和收束的转场：** 开场的全屏画面收缩成一根线，再从这根线长出 S02 的背景（contract）；收束时线展开成同一张画面（expand），首尾呼应。参考同一文件里的 `contract / expand`，以及 `deck.js` 里的 `transition()`。
- **风格层：** 单独写一个 CSS（retro.css），用 `?style=plain` 可以整层关掉，用 `.rx` / `.plain-only` 控制哪些元素只在某一层出现，静态模式会把这一层复制到每一页。见 `03_design_motion.md`。
- **调色板切换：** 在 `tokens.css` 里加 `:root[data-palette=x]` 块，用 `?palette=x` 打开；演讲者窗口会跟着用同一套色板。
