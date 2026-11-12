# precision-presentation

精致演出型网页演示文稿（HTML/CSS/JS，无构建步骤）的完整工作流 + 可直接复制的通用脚手架。

面向课堂 / 汇报 / 答辩 / 讲座：论证与分镜、事实与来源账本、艺术方向与设计系统、逐步揭示与动效、开场视频 / 音频嵌入、演讲者窗口与讲稿、三轨 QA（静态 / 动态 / 现场可靠性）、离线打包、提交用 PDF、讲稿大纲与外部讲稿核对、教室电脑故障排查。

源自 *Nostalgia on Repeat*（2026-10）的完整制作，执行用户的 `precision-presentation` 规范 v1.0。

## 怎么用

这是一个 **Agent Skill**：把整个目录放进你的 skill 目录，Agent 读到 `SKILL.md` 后按其中的流程执行。

```
precision-presentation/
├── SKILL.md                 # 入口：什么时候用、快速开始、P0–P7 流程、硬规则、速查
├── reference/               # 各阶段执行细节与踩坑记录
│   ├── 00_spec_precision-presentation_v1.md   # 规范原文（权威）
│   ├── 01_workflow.md       # P0–P7 执行方式与质量门
│   ├── 02_runtime.md        # 脚手架架构、标记约定、媒体、演讲者窗口、扩展点
│   ├── 03_design_motion.md  # 设计系统、角色色、动作语法、动效策略
│   ├── 04_content_integrity.md # 事实 / 来源 / 素材账本、标签、讲稿核对
│   ├── 05_qa.md             # 三轨 QA 命令、读法、问题分级
│   ├── 06_delivery.md       # 打包、PDF、现场清单与故障表
│   ├── 07_case_nostalgia.md # 案例决策日志 D01–D18
│   └── 08_layout_motion_qc.md # 多分辨率布局门、动效逐帧、讲稿迁移、设计护栏
├── templates/project/       # 已测好的通用工程脚手架（复制使用）
└── tools/new-deck.mjs       # 新建项目
```

新建一个演示项目：

```bash
node <skill>/tools/new-deck.mjs <项目目录> --title "标题" --package Short_Name
cd <项目目录> && npm install && npm test
```

主交付是浏览器里的 HTML 演示：双击 `index.html` 就能离线放映。PPTX 只在明确要求时制作。

## 硬规则（摘要）

- 主张优先，静态成立，动态增益——去掉动画后页面仍然完整。
- 不编造：引文、数字、时间码、素材来源都可追溯；外部 LLM 写的讲稿逐条核对。
- 颜色只走角色 token，组件里不写 hex。
- 离线第一：不依赖 CDN、在线字体或服务器。
- 证据才算数：没看截图不说视觉合格；没在目标设备测过就不承诺现场稳定。

完整内容见 `SKILL.md` 与 `reference/`。

## 许可

未指定许可证。`templates/project/assets/fonts/` 下的 DM Mono 与 Newsreader 按其各自的 OFL 许可证分发（见各目录内 `LICENSE-OFL.txt`）。
