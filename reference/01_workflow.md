# 01 · P0–P7 怎么执行

权威规范见 `00_spec_precision-presentation_v1.md`。本文件只写**怎么落地**：每个阶段该开哪些文件、过门时要查什么，以及 Nostalgia on Repeat 里实际踩过的坑。所有路径都相对于用户的项目根目录，不要在 skill 目录里做项目。

## 接手已有项目时
先读 `brief.yaml` → `handoff.md` → `qa/qa-report.md` → `design/decisions.md`（最后几条），再看当前阶段的产物。已经确认过的方向不要重新研究，也不要让用户把项目从头讲一遍。

## P0 · 环境与材料审计
- 把材料逐份标上用途：事实来源、身份参考、风格参考、构图参考、可直接使用的素材。课程题目原文要单独摘出来，后面 S02 要念。
- `capabilities.md`：每项能力标 `available / unavailable / untested`，并写明是怎么查的。在这个项目里：
  - Playwright 自带的浏览器下载失败 → 用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指向本机 chromium。
  - 没法听音频 → 所有音频一律标 `NOT_TESTED`。
- `brief.yaml` 写清 must / should / optional / forbidden 和假设（时长、语言）。**老师的时限没确认之前，只能算假设。**

## P1 · 论证与分镜
- 先写 ≤200 字的论证摘要，再写 `storyboard.yaml`。每页都要有 takeaway、audience_question、证据来源编号、visual_action、过渡句、pace 和秒数，以及每一步点击后出现什么。
- 一开始就设计**短路线**：哪些页可以跳过，跳过后用哪句话衔接，保证论证仍然闭合。
- `claims.yaml`：屏幕上每一句能被核对的话都要登记，写明来源、在原文中的位置、核实状态、出现在哪些页。我们自己的解读写 `type: reading`，并在屏幕上标 READING。
- 时长按“每分钟约 140 个英文词”估算讲话部分，**再加上媒体本身的时长和翻页的时间**。在这个项目里，嵌入 2:40 的 demo 后，完整版从 10 分钟变成约 13 分钟（`06_delivery.md`）。

## P2 · 艺术方向
- 用户给了参考（例如“80 年代日本霓虹 + 梦核”“千禧年 / 80 年代 retro”），就只做一个忠实方向和少量变体，不要强行出三套方案。
- 样稿必须包含**最难的内容页**：同一页上有文字、图片和来源注释。只看封面不算数。先出 styleframe，不要先做完全稿。
- 记录在 `design/selection.md`。自己选的写 `self_selected`，用户选的写 `user_selected`。不要写成“用户已批准”，两个词也不要混用。
- 选定之后用 `npm run qa:preview -- <N>` 出编号批次，让用户对着图说话。用户的原话进 `design/decisions.md`。
- 配色、照片、构图的底线见 `03_design_motion.md` 和 `08_layout_motion_qc.md`：不要橙 + 蓝，不要网点罩住照片，不要每页同一套模板。脚手架 token 里的橙和蓝是占位。
- 风格层要和论点挂钩，不能只是质感。例如这个项目把整套演示“包装成一张再版唱片”：侧边 obi 条和 Side A / B 本身就是 S08 要分析的那种包装（`03_design_motion.md` §风格层）。

## P3 · 设计系统与动作规范
- 写 `tokens.css`（两个世界的角色色）、`design/design-system.md`（字号、网格、页型）、`design/motion-spec.md`（动作词汇、时长、预算）。
- 每个例外都记进 `design/decisions.md`：编号、日期、决定、原因（尽量引用户原话）、后果。这是之后会话恢复上下文的主要依据。

## P4 · 三页原型
- 脚手架已经提供运行时、媒体、演讲者窗口和静态模式。原型要验证的是**本项目的页型**：最复杂的那页、需要多步关系演示的那页、媒体页。
- 必测项：前进、后退、快速连按、重进同一页、从中途跳入、刷新恢复、媒体失败、静态模式。脚手架的测试已经覆盖通用部分，项目特有的行为要补测试。

## P5 · 全稿
- 每批 3–4 页，先做静态，再加动作。每批都要看总览图和至少一张原尺寸截图（`qa/preview/batch-N/`）。长文件分段写，写完一段检查再写下一段。
- 从第一版全稿就跑布局检查（`08_layout_motion_qc.md`），不要等用户说挤了再量。挤的时候删句子或写入 `notes.js` 的 `moved`，不要缩小字号。
- 素材全部进 `asset-manifest.yaml`。占位素材要在屏幕上标明身份；真实素材到位后，要同时改标签、`claims.yaml` 和讲稿（`04_content_integrity.md`）。照片用有授权的实拍，画面上要能看清。
- 演讲备注写在 `src/js/notes.js`，`speaker-notes.md` 由脚本生成，不要手改。

## P6 · 三轨 QA（`05_qa.md`，测量门槛见 `08_layout_motion_qc.md`）
至少两轮真实审查：第一轮找问题并修，第二轮用前后对照图回归。每个问题按格式记：页面 / 步骤、证据路径、观察到的现象、严重程度、根因、最小修复、回归测试。

过门前至少：`npm run qa:gate`（四尺寸布局、PDF 终态、动画中段、字号、设计护栏）为 0 条；`npm test` 通过；`qa:run` 的 snap / pop 为 0。稿子如果做了按元素离场的手递手，再加上 `--overlap 150:250` 和 `qa:handoff --gate`。

## P7 · 交付（`06_delivery.md`）
- `npm run release`：先跑 `qa:gate`，再生成备注 → 导出 PDF → build → 冷启动检查 → 打包。动效全片（`qa:run`）时间长，在调用 release 之前单独跑，不要塞进每一轮小改。
- 最后一次改动之后重新打包，对一下 zip / PDF 的时间戳，避免交出去的是上一版。
- 打包后用 Expand-Archive 把 zip 解压到临时目录，再冷启动检查一次。PDF 每页要看过。
- 交付说明里逐条对应用户的意见，写清哪些已验证、哪些没验证。
- 更新 `handoff.md`：完成了什么、关键文件、最后运行的命令、下一步。锁定的决定抄一份在里面。

## 返工影响范围（规范 §5，补充本项目的实例）
| 改动 | 要回归的范围 |
|---|---|
| 文案 / 数字 | 当前页布局、讲稿、`claims.yaml`、相邻页的过渡句、外部讲稿 |
| 换真实素材 | 标签、window 标题栏里的文件名、标注位置、`asset-manifest.yaml`、`claims.yaml`、讲稿、PDF |
| 全局 token / 字体 | 全稿截图、断行、PDF 字体嵌入 |
| 动效 / 状态 | 所有相关页的进退、跳过、重入、静态模式、动态胶片条 |
| 媒体文件 | `qa-media`、冷启动（`file://` 和 `http` 都要测）、包的体积、跑场表计时 |
| 启动方式 / 打包 | 解压后冷启动、`START-HERE` 和 README 的说明 |
