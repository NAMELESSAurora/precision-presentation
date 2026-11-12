# 11 · 交付前的独立终检

做法来自 video-shotcraft 的 `references/final-review.md`，改成这套 HTML 演示：没有成片音轨可对，证据是步骤静帧、布局 JSON、动效 summary，以及讲者会投出来的那一版。

审查的人要换一个干净上下文。不要把制作过程、辩解、聊天记录交给审查。审查只拿下面这些。缺的标「无法验证」，不要猜。

## 审查输入

- `design/aesthetic-rules.md`（DR / DQ / DP 全部）
- `handoff.md` 里写明的简报、方向、放行顺序（DP1）
- `design/motion-map.yaml` 和 `storyboard.yaml`（配方名）
- `design/recipes/` 里被点名的卡
- 布局 / 字号 / handoff / `qa/motion-run/summary.md`
- 终态总览图或逐步静帧（没有图就不能说画面通过）
- `design/decisions.md` 里声明过的破例

`npm run qa:review-pack` 会在 `qa/final-review.md` 列出准则编号和已经存在的证据文件。它**不会**把任何一条标成通过。

## 检查

- **P 论点：** 主张在没有动画时是否仍成立；屏幕上有没有讲稿里没有的事实。
- **M 配方：** 分镜里的配方名是否真的出现在对应的一步；有没有违反该卡的「已知坑」和次数上限；`lint:storyboard` 是否干净。
- **R 节奏：** DR1–DR8。重叠毫秒、snap、pop、减弱动效有没有位移。
- **Q 画面：** DQ1–DQ6，外加布局门 0 条。相邻页能不能对调。
- **D 材料：** 照片有没有署名；占位是否在画面上标明；SVG 有没有在冒充照片。

## 报告

```text
DR8 ✓ S03→S04 overlap 200ms，qa/motion-run/summary.md，handoff 0。
DQ1 ✗ S06 静帧 qa/r/S06-4.png：网点盖住了杯子。
DR6 ? 没有 1280 宽的静帧，无法验证倾斜页。
```

最后分开写：必须改、可以改、无法验证。不要用「整体不错」代替逐条。
