import { ref, computed } from 'vue'
import { OPENAI_KEY, CLAUDE_KEY } from '../config'
import pricingData from '../data/pricing.json'

interface RawModel {
  id: string
  type: string
  display_name: string
  created_at: string
}

export interface ModelItem {
  id: string
  displayName: string
  provider: 'OpenAI' | 'Claude' | 'Other'
  createdAt: string
  pricing?: {
    input: string
    output: string
    unit: string
  }
}

const pricing = pricingData as Record<string, { input: string; output: string; unit: string }>

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

export function useModels() {
  const models = ref<ModelItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const activeProvider = ref<'All' | 'OpenAI' | 'Claude' | 'Other'>('All')

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

    const results = await Promise.allSettled([
      fetchWithKey(OPENAI_KEY),
      fetchWithKey(CLAUDE_KEY)
    ])

    const allRaw: RawModel[] = []
    const errors: string[] = []

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        allRaw.push(...r.value)
      } else {
        errors.push(`${i === 0 ? 'OpenAI' : 'Claude'} Key 请求失败`)
      }
    })

    if (errors.length === 2) {
      error.value = '两个 Key 均请求失败，请检查 src/config/index.ts'
    }

    const seen = new Set<string>()
    models.value = allRaw
      .filter(m => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })
      .map(m => ({
        id: m.id,
        displayName: m.display_name,
        provider: inferProvider(m.id),
        createdAt: m.created_at,
        pricing: pricing[m.id]
      }))

    loading.value = false
    return errors
  }

  return { models, loading, error, searchQuery, activeProvider, filteredModels, fetchModels }
}
