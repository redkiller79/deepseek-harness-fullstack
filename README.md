# 全栈高级开发工程师 · 栈工（Stacker）

> DeepSeek Harness 插件 · 包名 `deepseek-harness-fullstack` · 插件标识 `dsh-fullstack-engineer`

前端、后端、数据库、部署全线打通的全栈工程师。把原本分散在专家包里的三份技能，变成模型**按需调用**的工具。

## 能力

| 工具 | 覆盖内容 |
|---|---|
| `fullstack_guide` | 架构模式、REST API 设计、认证流程、数据库建模、错误处理、测试策略、上线检查 |
| `frontend_studio` | 设计规则与禁止模式、动效选型（Framer Motion / GSAP / Three.js）、MiniMax 媒体生成脚本、文案框架、性能约束 |
| `browser_automation` | 网页导航、表单填写、截图、数据提取、多会话、CDP 控制 |
| `read_skill_asset` | 读取包内任意文本资产（脚本、HTML 模板、字体清单） |

技能正文只在工具被调用时注入上下文，不占用常驻提示词。`focus` 参数可直达子主题，例如
`fullstack_guide(focus="auth")` 会连同 `auth-flow.md` 一并返回。

## 安装

```bash
# 从仓库安装（推荐）
dsh plugin --profile web add github:redkiller79/deepseek-harness-fullstack

# 本地目录
dsh plugin --profile web add ./deepseek-harness-fullstack

# 验证是否已写入 profile
dsh --dump-config
```

卸载把 `add` 换成 `remove`。装完重启 profile 生效。

要求 Node.js ≥ 22.14.0，DSH 0.2.x（Windows / macOS / Linux）。`@deepseek-ai/dsh-tools` 由 DSH 宿主提供，本包不重复声明依赖。

## 目录结构

```
deepseek-harness-fullstack/
├── package.json          # dsh.bundle.patch 指向 patch 层
├── cordis.patch.yml      # 插入 id=dsh-fullstack-engineer 一行，装载 ./index.js
├── index.js              # apply(ctx) → ctx.tools.register(...)
├── agents/
│   └── fullstack-engineer.md   # 人设：全栈高级开发工程师 Stacker
├── skills/
│   ├── fullstack-dev/    # SKILL.md + 9 篇 references
│   ├── frontend-dev/     # SKILL.md + 11 篇 references + 4 个生成脚本 + 模板 + 字体
│   └── browser-use/      # SKILL.md + 2 篇 references
├── avatars/expert.png
└── test/smoke.mjs        # 离线冒烟：mock 掉 dsh-tools 后跑 4 个工具
```

## 本地验证

```bash
node test/smoke.mjs
```

脚本会临时生成一个 mock 的 `@deepseek-ai/dsh-tools`，然后真实调用 `apply(ctx)` 与全部工具，
断言返回内容包含技能正文、`focus` 能命中参考文档、路径穿越被拒绝。

## 自定义

- **改名字**：`package.json` → `dsh.displayName` / `dsh.profession`，同步 `agents/*.md` 开头的 `name`。
- **改标识**：三处必须一致 — `package.json` 的 `dsh.id`、`cordis.patch.yml` 的 `id`、`index.js` 导出的 `name`。
- **对齐版本**：`dsh.verifiedAgainst` 目前写 `0.2.x`，按你实际的 `dsh --version` 改。
- **加技能**：在 `skills/` 下新建目录，`index.js` 里加一个 `defineTool` 并在 `bundle()` 调用处登记。

## 兼容性与权限

| 项 | 说明 |
|---|---|
| DSH 版本 | `0.2.x`（开发预览期，跨版本可能需调整） |
| Node.js | ≥ 22.14.0 |
| 系统 | Windows / macOS / Linux |
| 网络 | **不发起任何请求**。`browser_automation` 只注入操作指南，真实浏览器操作由用户本机 CLI 执行 |
| 文件 | 只读包内 `skills/`，`../` 越界被拒，单文件上限 256KB |
| 命令 | 不执行 shell，不注册 lifecycle 脚本 |
| 凭据 | 不读取、不存储任何 token 或 API Key |

第三方插件能读写文件、能联网，收录不等于安全审计。装之前请自行审阅 `index.js`（仅 170 行）。

## License

MIT。技能内容继承自原专家包，字体文件各自遵循其 OFL 授权（见 `skills/frontend-dev/canvas-fonts/*-OFL.txt`）。
