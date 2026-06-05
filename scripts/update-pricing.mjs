// 从 LiteLLM 社区定价数据自动更新 src/data/pricing.json
// 运行方式：npm run update-pricing
//
// 找不到的模型保留 pricing.json 中的原有手动值。
// 新模型 ID 与 LiteLLM 的 ID 不一致时，在 MANUAL_MAP 里加映射。

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRICING_PATH = resolve(__dirname, '../src/data/pricing.json')

// jsDelivr 是 GitHub 的 CDN 镜像，国内可访问
const LITELLM_URLS = [
  'https://cdn.jsdelivr.net/gh/BerriAI/litellm@main/model_prices_and_context_window.json',
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json',
]

// 我们的模型 ID -> LiteLLM 的模型 ID（ID 不同时手动维护）
const MANUAL_MAP = {
  'openai/gpt-4o':        'gpt-4o',
  'openai/gpt-4o-mini':   'gpt-4o-mini',
  'openai/gpt-4.1':       'gpt-4.1',
  'openai/gpt-4.1-mini':  'gpt-4.1-mini',
  'openai/gpt-4.1-nano':  'gpt-4.1-nano',
  'openai/gpt-5.3-codex': 'gpt-5.3-codex',
  'openai/gpt-5.5':       'gpt-5.5',
}

function toPrice(perToken) {
  return (perToken * 1_000_000).toFixed(4).replace(/\.?0+$/, '')
}

async function fetchWithFallback() {
  for (const url of LITELLM_URLS) {
    try {
      console.log(`尝试: ${url}`)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      console.log(`  失败 (${e.message})，尝试下一个...`)
    }
  }
  throw new Error('所有镜像均不可访问，请检查网络')
}

async function main() {
  console.log('正在从 LiteLLM 获取定价数据...')
  const litellm = await fetchWithFallback()

  const existing = JSON.parse(readFileSync(PRICING_PATH, 'utf-8'))
  const updated = { ...existing }
  const found = []
  const notFound = []

  for (const ourId of Object.keys(existing)) {
    const litellmId = MANUAL_MAP[ourId] ?? ourId
    const data = litellm[litellmId]
    if (data?.input_cost_per_token != null && data?.output_cost_per_token != null) {
      const input = toPrice(data.input_cost_per_token)
      const output = toPrice(data.output_cost_per_token)
      updated[ourId] = { input, output, unit: 'USD/1M tokens' }
      found.push(`  ✅ ${ourId.padEnd(30)} 输入 $${input.padStart(6)}  输出 $${output}`)
    } else {
      notFound.push(`  ⚠️  ${ourId.padEnd(30)} (litellm key: ${litellmId})`)
    }
  }

  writeFileSync(PRICING_PATH, JSON.stringify(updated, null, 2) + '\n')

  if (found.length) {
    console.log('\n已更新:')
    found.forEach(l => console.log(l))
  }
  if (notFound.length) {
    console.log('\n未找到（保留原价）:')
    notFound.forEach(l => console.log(l))
    console.log('\n  → 可在 scripts/update-pricing.mjs 的 MANUAL_MAP 中添加 ID 映射')
    console.log('  → 或直接手动编辑 src/data/pricing.json')
  }
  console.log(`\n完成：${found.length}/${Object.keys(existing).length} 个模型已从 LiteLLM 同步。`)
}

main().catch(err => { console.error('错误:', err.message); process.exit(1) })
