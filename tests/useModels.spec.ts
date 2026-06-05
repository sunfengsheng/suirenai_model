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

const mockRateJson = { rates: { CNY: 7.2 } }

function mockFetch(
  ch0Data: typeof mockCh0Response,
  ch1Data: typeof mockCh1Response,
  rateData = mockRateJson
) {
  vi.stubGlobal('fetch', vi.fn(async (url: string | Request, opts?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : (url as Request).url
    if (urlStr.includes('frankfurter')) {
      return { ok: true, json: async () => rateData } as Response
    }
    const headers = (opts?.headers ?? {}) as Record<string, string>
    const auth = headers['Authorization'] ?? ''
    const data = auth.includes(CHANNELS[0].key) ? ch0Data : ch1Data
    return { ok: true, json: async () => data } as Response
  }))
}

describe('useModels', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('lists models per channel without cross-channel dedup', async () => {
    mockFetch(mockCh0Response, mockCh1Response)
    const { models, fetchModels } = useModels()
    await fetchModels()
    // gpt-4o appears in both channels → 2 entries; gpt-5.2 + claude-opus-4-7 → 1 each
    expect(models.value).toHaveLength(4)
    const ids = models.value.map(m => m.id)
    expect(ids.filter(id => id === 'gpt-4o')).toHaveLength(2)
    expect(ids).toContain('gpt-5.2')
    expect(ids).toContain('claude-opus-4-7')
  })

  it('tags models with channel name and discount', async () => {
    mockFetch(mockCh0Response, { data: [], object: 'list' })
    const { models, fetchModels } = useModels()
    await fetchModels()
    const m = models.value.find(m => m.id === 'gpt-4o')
    expect(m?.channelName).toBe(CHANNELS[0].name)
    expect(m?.discount).toBe(CHANNELS[0].discount)
  })

  it('infers OpenAI provider from gpt- prefix', async () => {
    mockFetch(mockCh0Response, { data: [], object: 'list' })
    const { models, fetchModels } = useModels()
    await fetchModels()
    expect(models.value.find(m => m.id === 'gpt-4o')?.provider).toBe('OpenAI')
  })

  it('infers Claude provider from claude- prefix', async () => {
    mockFetch({ data: [], object: 'list' }, mockCh1Response)
    const { models, fetchModels } = useModels()
    await fetchModels()
    expect(models.value.find(m => m.id === 'claude-opus-4-7')?.provider).toBe('Claude')
  })

  it('filters by provider', async () => {
    mockFetch(mockCh0Response, mockCh1Response)
    const { fetchModels, filteredModels, activeProvider } = useModels()
    await fetchModels()
    activeProvider.value = 'Claude'
    expect(filteredModels.value).toHaveLength(1)
    expect(filteredModels.value[0].id).toBe('claude-opus-4-7')
  })

  it('filters by search query', async () => {
    mockFetch(mockCh0Response, { data: [], object: 'list' })
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
    expect(models.value).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain(CHANNELS[1].name)
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
    mockFetch({ data: [], object: 'list' }, { data: [], object: 'list' })
    const { fetchModels, exchangeRate } = useModels()
    await fetchModels()
    expect(exchangeRate.value).toBe(7.2)
  })
})
