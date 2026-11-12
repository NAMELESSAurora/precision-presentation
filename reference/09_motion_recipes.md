# 09 · 动效配方卡（从 video-shotcraft 转成逐点击的 HTML 演示）

动效思路来自 [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)（Vincent Wei，Apache-2.0）。那个仓库是 Remotion 时间线：30fps、镜头自己往前走、运镜和声音钉在帧号上。这里不搬它的代码。每张卡改写成**演讲者按一次 Next 就播完的一小段**，CSS 里已经是终态；减弱动效是 160ms 淡入；`?mode=static` / PDF 不播动画。

原片里 5–7 秒的镜头，落到幻灯片上是大约 0.7–1.6 秒的运动，剩下的停留交给讲者（准则 DR1）。帧数不照抄。署名和边界写在脚手架的 `design/recipes/NOTICE.md`。

卡的正文在 `templates/project/design/recipes/`。新建项目时整份脚手架会拷走。`design/recipes/catalog.json` 写着每张卡是「全片一次」还是「系统，可以重复」。`npm run lint:storyboard` 对着 `storyboard.yaml` 和 `design/motion-map.yaml` 数次数。

## 先读我们自己那套（17 页那次用过的）

| 卡 | 做什么 |
|---|---|
| `shared-scissors` | 同一把剪刀从 S01 飞到 S02（共享元素，1000ms，in-out） |
| `shared-ink` | S12 的色块只在宽度和位置上变成 S13 的色带 |
| `flip-select` | 同一页里，被选中的那一张从格子飞到大图（12 选 1） |
| `arc-cycle` | 循环图按顺时针一弧一弧画，节点在线到的时候才出现 |
| `overlap-handoff` | 系统转场：新页在旧页结束前约 200ms 开始。可以每条边界都用 |
| `tense-step` | 负面段落用停顿而不是顺滑缓出。一个段落，最多两页 |

## 从 video-shotcraft 改过来的

| 卡 | 原卡 | 落到幻灯片上留下的 |
|---|---|---|
| `line-carry` | line-carry-transition | 一条已经在看的线长过接缝，变成下一页的框。不横移整台摄像机 |
| `deal-in` | deck-deal-flyin | 越来越快地发牌，最后静止 0.5 秒。不要轨道环绕和金属桌面 |
| `match-iris` | circle-match-iris | 光圈从画面上一个真圆打开，对上下一页的圆 |
| `page-turn` | page-turn-transitions | 章节对开门，全片最多两次 |
| `mosaic-reframe` | mosaic-reframe | 同一组图换三种排法，每种排法自己占一次 Next |
| `count-up` | gauge / 读数 | 数字缓出到 HTML 里印好的那个值 |
| `draw-trace` | draw-svg-trace | 一条线把一个东西描出来，描完才交棒 |
| `hero-arc` | Q5 / spotlight | 一个主角、一条完整弧线、一次按键 |
| `marker-underline` | 描边卡里的下划线 | 全片只给一个词画一笔 |
| `title-demote` | title-demote-to-label | 大字缩成后面一直用的标签，字不变 |
| `list-reveal` | list-reveal | 均匀错峰的一行行出现。和发牌二选一 |
| `word-mask` | （我们自己的字罩） | 标题系统，可以重复。起点是 `100% + .62em` |
| `flood-theme` | （脚手架已有） | 换主题从一条线长出新底色，不要插值出灰 |
| `focus-handoff` | transition-hidden-cut | 眼睛盯着的那个东西不动，四周在换 |
| `meter-readout` | 计量读数 | 一根条子只增不减，阶梯走满 |
| `rule-draw` | stroke-segment-build | 一根说明结构的细线，不是转场 |
| `wipe-chapter` | wipe | 章节擦除，最多两次 |
| `speed-settle` | speed-ramp 的曲线 | 单个元素前重后轻地落定，没有定格闪白 |

## 运行时怎么接

- 入场类写 `data-anim="卡的 id"`。`src/js/recipes.js` 里 `DECK_RECIPES.enter` 有实现的，`motion.js` 会调用。没有实现的卡，参考卡里的写法接到项目自己的 `transition()`。
- 转场类不要指望脚手架默认的整页淡出已经是这张卡。分镜里写了 `transition:`，就是答应要在 `deck.js` 的 `transition()` 里做。默认行为不变，测试也不该因为没做某张卡而失败。
- Next 仍是先结束当前动画。配方函数必须能 `finish()` 到 CSS 终态。
- 减弱动效在 `motion.js` 里直接 160ms 淡入，不会走进配方的位移。
- 禁止 `Math.random` 和 `Date.now`（DR7）。

## 放行顺序

见 `10` 号文件里的 DP1，以及 `01_workflow.md`。简报 → 方向和 styleframe → `design/motion-map.yaml` → 写了配方名的完整分镜。然后才做每一页。
