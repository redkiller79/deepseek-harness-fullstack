#!/usr/bin/env bash
# 一键把本插件发布到公开 GitHub 仓库并打上 dsh-plugin topic
# 用法: bash scripts/publish.sh <github用户名> [署名]
set -euo pipefail

HANDLE="${1:-}"
NAME="${2:-$HANDLE}"
REPO="deepseek-harness-fullstack"

if [ -z "$HANDLE" ]; then
  echo "用法: bash scripts/publish.sh <github用户名> [署名]"
  echo "例如: bash scripts/publish.sh zhangsan 张三"
  exit 1
fi

cd "$(dirname "$0")/.."

# 1. 填写身份占位符
for f in package.json LICENSE README.md; do
  if grep -q '__GITHUB_USER__\|__AUTHOR__' "$f" 2>/dev/null; then
    sed -i.bak "s|__GITHUB_USER__|$HANDLE|g; s|__AUTHOR__|$NAME|g" "$f" && rm -f "$f.bak"
    echo "✓ 已填写 $f"
  fi
done

# 2. 确认没有残留占位符（PUBLISH.md 是手册，含占位符说明属正常，不校验）
if grep -l '__GITHUB_USER__\|__AUTHOR__' package.json LICENSE README.md 2>/dev/null | grep -q .; then
  echo "✗ 仍有占位符未替换："
  grep -n '__GITHUB_USER__\|__AUTHOR__' package.json LICENSE README.md
  exit 1
fi

# 3. 提交到本地 git
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || git init -b main

# 本机未配置 git 身份时，用传入的署名兜底，否则 commit 会直接失败
if [ -z "$(git config user.name || true)" ] || [ -z "$(git config user.email || true)" ]; then
  git config user.name "$NAME"
  git config user.email "$HANDLE@users.noreply.github.com"
  echo "→ 已设置本仓库提交身份：$NAME <$HANDLE@users.noreply.github.com>"
fi

git add -A
git commit -m "feat: deepseek-harness-fullstack v1.0.0 — 全栈高级开发工程师 DSH 插件" || echo "（没有新改动可提交）"
echo "✓ 本地提交完成"

# 4. 建远程仓库并推送
if ! command -v gh >/dev/null 2>&1; then
  cat <<EOF

未检测到 GitHub CLI（gh）。二选一：

A. 装 gh 后重跑本脚本
   winget install --id GitHub.cli -e
   gh auth login

B. 手动建仓库，然后：
   git remote add origin https://github.com/$HANDLE/$REPO.git
   git push -u origin main
EOF
  exit 0
fi

if gh repo view "$HANDLE/$REPO" >/dev/null 2>&1; then
  echo "→ 仓库已存在，直接推送"
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$HANDLE/$REPO.git"
  git push -u origin main
else
  gh repo create "$REPO" \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "Senior Full-Stack Engineer plugin for DeepSeek Harness — fullstack architecture, frontend design engineering and browser automation as callable tools."
  echo "✓ 已创建公开仓库"
fi

# 5. 打 topic —— 这是被各目录站收录的唯一开关
gh repo edit "$HANDLE/$REPO" --add-topic dsh-plugin,dsh,dsh-plugin-bundle,deepseek-harness
echo "✓ 已添加 dsh-plugin topic"

echo
echo "仓库地址: https://github.com/$HANDLE/$REPO"
echo "详情页:   https://dsh-plugin.org/plugins/$HANDLE/$REPO"
echo "下一步:   打开 https://dsh-plugin.org/submit 或等目录站自动抓取（一轮刷新周期）"
