/**
 * 离线冒烟测试：mock 掉 @deepseek-ai/dsh-tools 后真实跑 apply(ctx) 与全部工具。
 * 运行：node test/smoke.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MOCK_DIR = join(ROOT, 'node_modules', '@deepseek-ai', 'dsh-tools')

// 1. 造一个最小可用的 dsh-tools（defineTool 原样返回 spec，足够验证注册逻辑）
await mkdir(MOCK_DIR, { recursive: true })
await writeFile(
  join(MOCK_DIR, 'package.json'),
  JSON.stringify({ name: '@deepseek-ai/dsh-tools', version: '0.0.0-mock', type: 'module', main: 'index.js' }),
)
await writeFile(join(MOCK_DIR, 'index.js'), 'export const defineTool = (spec) => spec\n')

const failures = []
const check = (label, cond, detail = '') => {
  if (cond) console.log(`  ok   ${label}`)
  else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
    failures.push(label)
  }
}

try {
  // 2. 动态 import，此时 mock 已就位
  const mod = await import('../index.js')
  check('导出 apply', typeof mod.apply === 'function')
  check('导出 name = dsh-fullstack-engineer', mod.name === 'dsh-fullstack-engineer', mod.name)
  check('声明 inject=[tools]', Array.isArray(mod.inject) && mod.inject.includes('tools'))

  const registry = new Map()
  mod.apply({ tools: { register: (tool) => registry.set(tool.name, tool) } })

  const expected = ['fullstack_guide', 'frontend_studio', 'browser_automation', 'read_skill_asset']
  for (const n of expected) check(`注册工具 ${n}`, registry.has(n))
  check('工具数量 = 4', registry.size === 4, `实际 ${registry.size}`)

  const call = (n, args) => registry.get(n).execute(args)

  // 3. 技能正文
  const fs1 = await call('fullstack_guide', {})
  check('fullstack_guide 返回架构正文', fs1.includes('全栈') && fs1.length > 800, `${fs1.length} 字符`)
  check('frontmatter 已剥离', !fs1.startsWith('---'))

  // 4. focus 命中参考文档
  const fs2 = await call('fullstack_guide', { focus: 'auth' })
  check('focus=auth 追加参考文档', fs2.length > fs1.length && fs2.includes('## 参考：auth'))

  const fs3 = await call('frontend_studio', { focus: 'motion' })
  check('frontend_studio focus=motion', fs3.includes('## 参考：motion'))

  const fs4 = await call('browser_automation', {})
  check('browser_automation 有正文', fs4.length > 200)

  // 5. 非法 focus 给出提示而非崩溃
  const fs5 = await call('fullstack_guide', { focus: '不存在' })
  check('非法 focus 降级提示', fs5.includes('未识别 focus'))

  // 6. 资产读取 + 路径穿越防护
  const py = await call('read_skill_asset', { path: 'frontend-dev/scripts/minimax_image.py' })
  check('read_skill_asset 读到脚本', py.includes('MINIMAX') || py.includes('def '), `${py.length} 字符`)

  let blocked = false
  try {
    await call('read_skill_asset', { path: '../../package.json' })
  } catch (e) {
    blocked = /路径越界/.test(e.message)
  }
  check('阻断 ../ 路径穿越', blocked)

  // 7. 输出渲染契约
  const rendered = registry.get('fullstack_guide').output.render({}, fs1)
  check('render 返回 text part', Array.isArray(rendered) && rendered[0]?.type === 'text')
} finally {
  await rm(join(ROOT, 'node_modules'), { recursive: true, force: true })
}

if (failures.length) {
  console.error(`\n${failures.length} 项失败：${failures.join(', ')}`)
  process.exit(1)
}
console.log('\n全部通过')
