# 以你的名义发布到 DSH 插件生态

## 先搞清一件事：DSH 没有官方中心商店

DeepSeek Harness 的插件"上架"= **公开 GitHub 仓库 + 打上 `dsh-plugin` topic**。
没有审核后台、没有提交表单是必须的，topic 就是唯一开关。

打上 topic 后，下列目录站会在各自的刷新周期内**自动抓取**并生成条目：

| 站点 | 说明 |
|---|---|
| `dsh-plugin.org`（DSH Plugin Hub） | 社区主站，有手动提交入口 + 徽章 |
| `dshmarketplace.dev` | 直接同步 `dsh-plugin` topic |
| `dsharness.io` | 按 Star / 分类浏览的目录站 |
| DSH-Store（`AI-Scarlett/dsh-safe-plugin-manager`） | 要求固定 40 位 commit，审核最严 |
| `awesome-dsh-plugin` | 精选库，**DSH 自带的插件市场从这里装**，需提 PR |

DSH 客户端内的「设置 → 插件市场」搜到的插件，来源主要是 `awesome-dsh-plugin` 和 DSH-Store。

## 收录的四项硬要求

| 要求 | 本包状态 |
|---|---|
| 仓库公开 | ⬜ 待发布 |
| 打上 `dsh-plugin` topic | ⬜ 待发布 |
| README 含安装命令 `dsh plugin --profile web add ...` | ✅ 已写 |
| 导出 `apply(ctx)` 模块 | ✅ `index.js` |
| 开源协议 | ✅ MIT |

被拒的四个常见原因就是上面前四条缺一，逐条对一遍即可。

---

## 发布步骤

### 1. 填署名（占位符共两个）

`package.json` 与 `LICENSE` 里的 `__GITHUB_USER__`、`__AUTHOR__` 需要替换成你的。

```bash
# 方式 A：一条命令搞定（替换 + 提交 + 建仓 + 推送 + 打 topic）
bash scripts/publish.sh <你的GitHub用户名> <你的署名>

# 方式 B：只想先填名字
bash scripts/publish.sh <你的GitHub用户名> <你的署名>
```

脚本会先校验占位符是否全部替换干净，再动 git。占位符有残留会直接退出。
`README.md` 里的安装命令也带 `__GITHUB_USER__`，脚本会一并替换。

### 2. 如果没装 GitHub CLI

```bash
winget install --id GitHub.cli -e
gh auth login
```

装完重跑 `bash scripts/publish.sh <用户名> <署名>`。
不想装 gh 也可以手动建仓库，脚本会打印需要执行的 git 命令。

### 3. 打 topic（最关键的一步）

```bash
gh repo edit --add-topic dsh-plugin
```

或在 GitHub 网页上：仓库页 → About 右侧齿轮 → Topics 填 `dsh-plugin`。

### 4. 验证收录

```bash
# 等一轮刷新（通常几小时到一天），然后搜
# https://dsh-plugin.org/plugins/<owner>/deepseek-harness-fullstack
```

或在 DSH 里：`设置 → 插件市场` 搜 `deepseek-harness-fullstack`。

### 5. 主动提交（可选，能更快）

打开 <https://dsh-plugin.org/submit> 贴仓库地址，或在其 GitHub 仓库开 issue，模板如下：

```markdown
Title: [Plugin submission] deepseek-harness-fullstack — 全栈高级开发工程师

### Repository
https://github.com/<owner>/deepseek-harness-fullstack

### One-line value
把全栈架构、前端设计工程、浏览器自动化三份技能变成 DSH 里按需调用的 4 个工具。

### Category
Developer Tools（开发工具）

### Install command
dsh plugin --profile web add github:<owner>/deepseek-harness-fullstack

### Compatibility
DSH 0.2.x，Node.js >= 22.14.0，Windows / macOS / Linux

### License
MIT

### Screenshots / demo
（贴一张 `node test/smoke.mjs` 17 项通过的终端截图）

### Notes
纯本地插件，不联网、不写工作区外文件、不执行生命周期脚本。
`read_skill_asset` 限定在包内 skills/ 目录，拒绝路径穿越。

### Pre-submission checklist
- [x] Repository is public
- [x] GitHub topic `dsh-plugin` added
- [x] README includes the install command
- [x] Plugin exports an `apply(ctx)` module
```

---

## 发布前的安全自查（README 里已声明，别写虚的）

- **网络**：不发起任何请求。`browser_automation` 只是返回操作指南，实际浏览器由用户本机 CLI 执行。
- **文件**：只读包内 `skills/`，`safeResolve()` 阻断 `../`；有 256KB 上限。
- **命令**：不执行 shell 命令、不跑 lifecycle 脚本。
- **凭据**：不读取、不存储任何 token 或 API Key。

收录 ≠ 安全审计。各目录站明确声明不对第三方代码背书，用户仍需自审。

## 一个容易漏的点

`dsh.verifiedAgainst` 现在写的是 `0.2.x`。发布前换成你真机验证过的版本：

```bash
dsh --version
```
