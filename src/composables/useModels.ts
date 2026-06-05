import { ref, computed } from 'vue'
import { CHANNELS } from '../config'
import pricingData from '../data/pricing.json'

interface RawModel {
  id: string
  type: string
  display_name: string
  created_at: string
}

export interface ChannelEntry {
  name: string
  discount: number
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

const pricing = pricingData as Record<string, { input: string; output: string; releaseDate?: string }>

function inferProvider(id: string): ModelItem['provider'] {
  if (id.startsWith('claude')) return 'Claude'
  if (id.startsWith('gpt') || id.startsWith('openai/')) return 'OpenAI'
  return 'Other'
}

async function fetchWithKey(key: string): Promise<RawModel[]> {
  const res = await fetch('/v1/models', {
    headers: { Authorization: `Bearer ${key}` }
  })
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

  async function fetchModels(): Promise<string[]> {
    loading.value = true
    error.value = null

    const [rateResult, ...channelResults] = await Promise.allSettled([
      fetchExchangeRate(),
      ...CHANNELS.map(ch => fetchWithKey(ch.key))
    ])

    if (rateResult.status === 'fulfilled') {
      exchangeRate.value = rateResult.value
    }

    const modelMap = new Map<string, ModelItem>()
    const errors: string[] = []

    channelResults.forEach((r, i) => {
      const channel = CHANNELS[i]
      if (r.status === 'fulfilled') {
        const seen = new Set<string>()
        for (const m of r.value) {
          if (seen.has(m.id)) continue
          seen.add(m.id)
          if (modelMap.has(m.id)) {
            modelMap.get(m.id)!.channels.push({ name: channel.name, discount: channel.discount })
          } else {
            const p = pricing[m.id]
            modelMap.set(m.id, {
              id: m.id,
              displayName: m.display_name,
              provider: inferProvider(m.id),
              createdAt: p?.releaseDate ?? '',
              channels: [{ name: channel.name, discount: channel.discount }],
              pricing: p ? { input: p.input, output: p.output } : undefined
            })
          }
        }
      } else {
        errors.push(`${channel.name} 请求失败`)
      }
    })

    if (errors.length === CHANNELS.length) {
      error.value = '所有渠道均请求失败，请检查 src/config/index.ts'
    }

    models.value = Array.from(modelMap.values())
    loading.value = false
    return errors
  }

  return { models, loading, error, searchQuery, activeProvider, filteredModels, fetchModels, exchangeRate }
}
