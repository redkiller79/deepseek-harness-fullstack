/**
 * deepseek-harness-fullstack — 全栈高级开发工程师
 * DeepSeek Harness 插件：把 fullstack-dev / frontend-dev / browser-use
 * 三个技能注册为模型可调用的工具，技能正文按需注入。
 */
import { readFile, stat } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-fullstack-engineer'
export const inject = ['tools']

const ROOT = dirname(fileURLToPath(import.meta.url))
const SKILLS_DIR = resolve(ROOT, 'skills')
const MAX_TEXT_BYTES = 256 * 1024

/** 去掉 SKILL.md 的 YAML frontmatter，只把正文交给模型 */
function stripFrontmatter(raw) {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim()
}

/** 限定在 skills/ 目录内读取，阻断 ../ 路径穿越 */
function safeResolve(relPath) {
  const target = resolve(SKILLS_DIR, relPath)
  if (target !== SKILLS_DIR && !target.startsWith(SKILLS_DIR + sep)) {
    throw new Error(`路径越界，已拒绝：${relPath}`)
  }
  return target
}

async function readText(relPath) {
  const target = safeResolve(relPath)
  const info = await stat(target).catch(() => null)
  if (!info || !info.isFile()) throw new Error(`文件不存在：${relPath}`)
  if (info.size > MAX_TEXT_BYTES) {
    throw new Error(`文件过大（${info.size} 字节），上限 ${MAX_TEXT_BYTES}`)
  }
  const raw = await readFile(target, 'utf8')
  return relPath.endsWith('SKILL.md') ? stripFrontmatter(raw) : raw.trim()
}

function section(title, body) {
  return body ? `## ${title}\n\n${body}` : ''
}

/** 统一输出格式：单条 text part */
const textOutput = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : String(value ?? '') }],
}

async function bundle(skill, guide, focusMap, focus) {
  const parts = [await readText(`${skill}/SKILL.md`)]
  const key = typeof focus === 'string' ? focus.trim() : ''
  if (key) {
    const ref = focusMap[key]
    if (!ref) {
      parts.push(
        `> 未识别 focus="${key}"，可用值：${Object.keys(focusMap).join(' / ')}`,
      )
    } else {
      parts.push(section(`参考：${key}`, await readText(`${skill}/references/${ref}`)))
    }
  }
  return parts.filter(Boolean).join('\n\n---\n\n')
}

const FULLSTACK_FOCUS = {
  architecture: 'architecture-patterns.md',
  api: 'api-design.md',
  auth: 'auth-flow.md',
  db: 'db-schema.md',
  django: 'django-best-practices.md',
  env: 'environment-management.md',
  release: 'release-checklist.md',
  'tech-selection': 'technology-selection.md',
  testing: 'testing-strategy.md',
}

const FRONTEND_FOCUS = {
  design: 'design-rules.md',
  motion: 'motion-recipes.md',
  assets: 'asset-prompt-guide.md',
  'minimax-cli': 'minimax-cli-reference.md',
  'minimax-image': 'minimax-image-guide.md',
  'minimax-video': 'minimax-video-guide.md',
  'minimax-tts': 'minimax-tts-guide.md',
  'minimax-music': 'minimax-music-guide.md',
  'minimax-voice': 'minimax-voice-catalog.md',
  env: 'env-setup.md',
  troubleshooting: 'troubleshooting.md',
}

const BROWSER_FOCUS = {
  cdp: 'cdp-python.md',
  'cdp-python': 'cdp-python.md',
  session: 'multi-session.md',
  'multi-session': 'multi-session.md',
}

export function apply(ctx) {
  ctx.tools.register(
    defineTool({
      name: 'fullstack_guide',
      description:
        '全栈应用架构与前后端集成指南：REST API 设计、服务分层、认证流程、数据库建模、错误处理、测试与上线检查。' +
        '在搭建全栈项目、设计后端接口、排查生产问题前调用。纯前端界面或单文件小改动不需要调用。',
      parameters: {
        focus: {
          type: 'string',
          required: false,
          description: `需要深入的子主题，可选：${Object.keys(FULLSTACK_FOCUS).join(' / ')}`,
        },
      },
      output: textOutput,
      async execute(args) {
        return bundle('fullstack-dev', null, FULLSTACK_FOCUS, args?.focus)
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'frontend_studio',
      description:
        '生产级前端页面工程：设计规则与禁止模式、动效工具选型（Framer Motion / GSAP / Three.js）、AI 媒体资产生成（MiniMax 图片/视频/TTS/音乐脚本）、文案框架与性能约束。' +
        '在制作落地页、营销站、强动效页面或需要生成媒体资产时调用。简单组件、表单、修 CSS 不需要调用。',
      parameters: {
        focus: {
          type: 'string',
          required: false,
          description: `需要深入的子主题，可选：${Object.keys(FRONTEND_FOCUS).join(' / ')}`,
        },
      },
      output: textOutput,
      async execute(args) {
        return bundle('frontend-dev', null, FRONTEND_FOCUS, args?.focus)
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'browser_automation',
      description:
        '浏览器自动化操作指南：页面导航、表单填写、截图、数据提取、多会话管理与 CDP 控制。' +
        '在执行网页自动化任务前调用以获取命令行用法与已知坑；需要真实浏览器时依赖本机 browser-use CLI。',
      parameters: {
        focus: {
          type: 'string',
          required: false,
          description: `需要深入的子主题，可选：${Object.keys(BROWSER_FOCUS).join(' / ')}`,
        },
      },
      output: textOutput,
      async execute(args) {
        return bundle('browser-use', null, BROWSER_FOCUS, args?.focus)
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'read_skill_asset',
      description:
        '读取本插件包内 skills/ 下的任意文本资产，例如生成的脚本、HTML 模板、字体清单或未被工具覆盖的参考文档。' +
        '路径相对 skills/ 书写，如 "frontend-dev/scripts/minimax_image.py"。路径越界会被拒绝。',
      parameters: {
        path: {
          type: 'string',
          required: true,
          description: '相对 skills/ 的文件路径',
        },
      },
      output: textOutput,
      async execute(args) {
        const rel = typeof args?.path === 'string' ? args.path.trim() : ''
        if (!rel) throw new Error('缺少 path 参数')
        return readText(rel)
      },
    }),
  )
}
