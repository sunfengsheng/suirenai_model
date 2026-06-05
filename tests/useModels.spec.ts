import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModels } from '../src/composables/useModels'
import { CHANNELS } from '../src/config'

const mockCh0Response = {
  data: [
    { id: 'gpt-4o', type: 'model', display_name: 'gpt-4o', created_at: '2024-01-01T00:00:00Z' },
    { id: 'gpt-5.2', type: 'model', display_name: 'gpt-5.2', created_at: '2024-01-01T00:00:00Z' }
  ],
  object: 'list'
}

const mockCh1Response = {
  data: [
    { id: 'claude-opus-4-7', type: 'model', display_name: 'claude-opus-4-7', created_at: '2024-01-01T00:00:00Z' },
    { id: 'gpt-4o', type: 'model', display_name: 'gpt-4o', created_at: '2024-01-01T00:00:00Z' }
  ],
  object: 'list'
}

const emptyResponse = { data: [], object: 'list' }
const mockRateJson = { rates: { CNY: 7.2 } }

function mockFetch(responses: Record<string, typeof mockCh0Response>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string | Request, opts?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : (url as Request).url
    if (urlStr.includes('frankfurter')) {
      return { ok: true, json: async () => mockRateJson } as Response
    }
    const headers = (opts?.headers ?? {}) as Record<string, string>
    const auth = headers['Authorization'] ?? ''
    const matchedKey = CHANNELS.find(ch => auth.includes(ch.key))
    const data = matchedKey ? (responses[matchedKey.name] ?? emptyResponse) : emptyResponse
    return { ok: true, json: async () => data } as Response
  }))
}

describe('useModels', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('deduplicates models by id across channels into one entry', async () => {
    mockFetch({ [CHANNELS[0].name]: mockCh0Response, [CHANNELS[1].name]: mockCh1Response })
    const { models, fetchModels } = useModels()
    await fetchModels()
    // gpt-4o in both channels → 1 entry; gpt-5.2 + claude-opus-4-7 → 1 each
    expect(models.value).toHaveLength(3)
    const ids = models.value.map(m => m.id)
    expect(ids).toContain('gpt-4o')
    expect(ids).toContain('gpt-5.2')
    expect(ids).toContain('claude-opus-4-7')
  })

  it('collects all channels for a model that appears in multiple channels', async () => {
    mockFetch({ [CHANNELS[0].name]: mockCh0Response, [CHANNELS[1].name]: mockCh1Response })
    const { models, fetchModels } = useModels()
    await fetchModels()
    const gpt4o = models.value.find(m => m.id === 'gpt-4o')
    expect(gpt4o?.channels).toHaveLength(2)
    expect(gpt4o?.channels.map(c => c.name)).toContain(CHANNELS[0].name)
    expect(gpt4o?.channels.map(c => c.name)).toContain(CHANNELS[1].name)
  })

  it('stores channel name and discount in channels array', async () => {
    mockFetch({ [CHANNELS[0].name]: mockCh0Response })
    const { models, fetchModels } = useModels()
    await fetchModels()
    const m = models.value.find(m => m.id === 'gpt-4o')
    expect(m?.channels[0].name).toBe(CHANNELS[0].name)
    expect(m?.channels[0].discount).toBe(CHANNELS[0].discount)
  })

  it('infers OpenAI provider from gpt- prefix', async () => {
    mockFetch({ [CHANNELS[0].name]: mockCh0Response })
    const { models, fetchModels } = useModels()
    await fetchModels()
    expect(models.value.find(m => m.id === 'gpt-4o')?.provider).toBe('OpenAI')
  })

  it('infers Claude provider from claude- prefix', async () => {
    mockFetch({ [CHANNELS[1].name]: mockCh1Response })
    const { models, fetchModels } = useModels()
    await fetchModels()
    expect(models.value.find(m => m.id === 'claude-opus-4-7')?.provider).toBe('Claude')
  })

  it('filters by provider', async () => {
    mockFetch({ [CHANNELS[0].name]: mockCh0Response, [CHANNELS[1].name]: mockCh1Response })
    const { fetchModels, filteredModels, activeProvider } = useModels()
    await fetchModels()
    activeProvider.value = 'Claude'
    expect(filteredModels.value).toHaveLength(1)
    expect(filteredModels.value[0].id).toBe('claude-opus-4-7')
  })

  it('filters by search query', async () => {
    mockFetch({ [CHANNELS[0].name]: mockCh0Response })
    const { fetchModels, filteredModels, searchQuery } = useModels()
    await fetchModels()
    searchQuery.value = '5.2'
    expect(filteredModels.value).toHaveLength(1)
    expect(filteredModels.value[0].id).toBe('gpt-5.2')
  })

  it('returns partial error when one channel fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string | Request, opts?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url
      if (urlStr.includes('frankfurter')) {
        return { ok: true, json: async () => mockRateJson } as Response
      }
      const headers = (opts?.headers ?? {}) as Record<string, string>
      const auth = headers['Authorization'] ?? ''
      if (auth.includes(CHANNELS[0].key)) {
        return { ok: true, json: async () => mockCh0Response } as Response
      }
      throw new Error('Network error')
    }))
    const { fetchModels, models } = useModels()
    const errors = await fetchModels()
    expect(models.value.length).toBeGreaterThan(0)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.includes(CHANNELS[1].name))).toBe(true)
  })

  it('sets error ref when all channels fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url
      if (urlStr.includes('frankfurter')) {
        return { ok: true, json: async () => mockRateJson } as Response
      }
      throw new Error('Network error')
    }))
    const { fetchModels, error } = useModels()
    await fetchModels()
    expect(error.value).toBeTruthy()
  })

  it('fetches and exposes exchange rate', async () => {
    mockFetch({})
    const { fetchModels, exchangeRate } = useModels()
    await fetchModels()
    expect(exchangeRate.value).toBe(7.2)
  })
})
