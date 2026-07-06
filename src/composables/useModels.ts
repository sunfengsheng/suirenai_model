import { ref, computed } from 'vue'
import type { AppConfig, Channel } from '../config'

interface RawModel {
  id: string
  type?: string
  display_name?: string
  created_at?: string
}

export interface ChannelEntry {
  name: string
  discount: number
}

export interface ChannelGroup {
  name: string
  discount: number
  models: ModelItem[]
}

export interface ModelItem {
  id: string
  displayName: string
  provider: 'OpenAI' | 'Claude' | 'Other'
  createdAt: string
  channels: ChannelEntry[]
  pricing?: {
    input: string
    output: string
  }
}

type PricingData = Record<string, { input: string; output: string }>

interface LiteLLMEntry {
  input_cost_per_token?: number
  output_cost_per_token?: number
}

function inferProvider(id: string): ModelItem['provider'] {
  if (id.startsWith('claude')) return 'Claude'
  if (id.startsWith('gpt') || id.startsWith('openai/')) return 'OpenAI'
  return 'Other'
}

async function fetchViaProxy(proxyPath: string): Promise<RawModel[]> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const res = await fetch(`${base}${proxyPath}v1/models`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.data as RawModel[]
}

async function fetchExchangeRate(): Promise<number> {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=CNY')
    if (!res.ok) return 7.2
    const json = await res.json()
    return (json.rates?.CNY as number) ?? 7.2
  } catch {
    return 7.2
  }
}

async function loadConfig(): Promise<AppConfig> {
  const res = await fetch(`${import.meta.env.BASE_URL}config.json`)
  if (!res.ok) throw new Error('Failed to load config.json')
  return res.json()
}

async function loadPricing(): Promise<PricingData> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}pricing.json`)
    if (!res.ok) return {}
    return res.json()
  } catch {
    return {}
  }
}

async function fetchLiteLLMPricing(): Promise<PricingData> {
  const URLS = [
    'https://cdn.jsdelivr.net/gh/BerriAI/litellm@main/model_prices_and_context_window.json',
    'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
  ]
  for (const url of URLS) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const raw: Record<string, LiteLLMEntry> = await res.json()
      const result: PricingData = {}
      for (const [id, entry] of Object.entries(raw)) {
        if (entry.input_cost_per_token != null && entry.output_cost_per_token != null) {
          const priceEntry = {
            input: (entry.input_cost_per_token * 1_000_000).toFixed(2),
            output: (entry.output_cost_per_token * 1_000_000).toFixed(2)
          }
          result[id] = priceEntry
          // also index by bare model id (strips provider prefix like "deepseek/deepseek-chat" → "deepseek-chat")
          const slash = id.indexOf('/')
          if (slash !== -1) {
            const bareId = id.slice(slash + 1)
            if (!result[bareId]) result[bareId] = priceEntry
          }
        }
      }
      return result
    } catch {
      continue
    }
  }
  return {}
}

export function useModels() {
  const models = ref<ModelItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const activeProvider = ref<'All' | 'OpenAI' | 'Claude' | 'Other'>('All')
  const exchangeRate = ref(7.2)

  const filteredModels = computed(() =>
    models.value.filter(m => {
      const matchProvider = activeProvider.value === 'All' || m.provider === activeProvider.value
      const q = searchQuery.value.toLowerCase()
      const matchSearch = !q || m.id.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)
      return matchProvider && matchSearch
    })
  )

  const modelsByChannel = computed((): ChannelGroup[] => {
    const map = new Map<string, ChannelGroup>()
    for (const model of models.value) {
      for (const ch of model.channels) {
        if (!map.has(ch.name)) {
          map.set(ch.name, { name: ch.name, discount: ch.discount, models: [] })
        }
        map.get(ch.name)!.models.push(model)
      }
    }
    return Array.from(map.values())
  })

  async function fetchModels(): Promise<string[]> {
    loading.value = true
    error.value = null

    let config: AppConfig
    try {
      config = await loadConfig()
    } catch {
      error.value = '无法加载 config.json，请检查 public/config.json 是否存在'
      loading.value = false
      return []
    }

    const [rateResult, pricingResult, litellmResult, ...channelResults] = await Promise.allSettled([
      fetchExchangeRate(),
      loadPricing(),
      fetchLiteLLMPricing(),
      ...config.channels.map((ch: Channel) => fetchViaProxy(ch.proxyPath))
    ])

    if (rateResult.status === 'fulfilled') {
      exchangeRate.value = rateResult.value
    }

    // LiteLLM provides baseline prices; manual pricing.json overrides take priority
    const litellmPricing: PricingData = litellmResult.status === 'fulfilled' ? litellmResult.value : {}
    const manualPricing: PricingData = pricingResult.status === 'fulfilled' ? pricingResult.value : {}
    const pricing: PricingData = { ...litellmPricing, ...manualPricing }

    const modelMap = new Map<string, ModelItem>()
    const errors: string[] = []

    channelResults.forEach((r, i) => {
      const channel = config.channels[i]
      if (r.status === 'fulfilled') {
        const seen = new Set<string>()
        for (const m of r.value) {
          if (seen.has(m.id)) continue
          seen.add(m.id)
          if (modelMap.has(m.id)) {
            modelMap.get(m.id)!.channels.push({ name: channel.name, discount: channel.discount })
          } else {
            const bareId = m.id.includes('/') ? m.id.slice(m.id.indexOf('/') + 1) : m.id
          const p = pricing[m.id] ?? pricing[bareId]
            modelMap.set(m.id, {
              id: m.id,
              displayName: m.display_name || m.id,
              provider: inferProvider(m.id),
              createdAt: config.modelReleaseDates?.[m.id] ?? '',
              channels: [{ name: channel.name, discount: channel.discount }],
              pricing: p ? { input: p.input, output: p.output } : undefined
            })
          }
        }
      } else {
        errors.push(`${channel.name} 请求失败`)
      }
    })

    if (config.channels.length > 0 && errors.length === config.channels.length) {
      error.value = '所有渠道均请求失败，请检查 public/config.json'
    }

    const providerOrder: Record<string, number> = { OpenAI: 0, Claude: 1, Other: 2 }
    models.value = Array.from(modelMap.values()).sort((a, b) =>
      (providerOrder[a.provider] ?? 9) - (providerOrder[b.provider] ?? 9)
        || a.id.localeCompare(b.id)
    )
    loading.value = false
    return errors
  }

  return { models, loading, error, searchQuery, activeProvider, filteredModels, modelsByChannel, fetchModels, exchangeRate }
}
