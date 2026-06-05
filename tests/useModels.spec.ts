import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModels } from '../src/composables/useModels'

const mockOpenAIResponse = {
  data: [
    { id: 'gpt-4o', type: 'model', display_name: 'gpt-4o', created_at: '2024-01-01T00:00:00Z' },
    { id: 'gpt-5.2', type: 'model', display_name: 'gpt-5.2', created_at: '2024-01-01T00:00:00Z' }
  ],
  object: 'list'
}

const mockClaudeResponse = {
  data: [
    { id: 'claude-opus-4-7', type: 'model', display_name: 'claude-opus-4-7', created_at: '2024-01-01T00:00:00Z' },
    { id: 'gpt-4o', type: 'model', display_name: 'gpt-4o', created_at: '2024-01-01T00:00:00Z' }
  ],
  object: 'list'
}

function mockFetch(openAIData: typeof mockOpenAIResponse, claudeData: typeof mockClaudeResponse) {
  let callCount = 0
  vi.stubGlobal('fetch', vi.fn(async () => {
    const data = callCount === 0 ? openAIData : claudeData
    callCount++
    return { ok: true, json: async () => data } as Response
  }))
}

describe('useModels', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('merges models from both keys and deduplicates by id', async () => {
    mockFetch(mockOpenAIResponse, mockClaudeResponse)
    const { models, fetchModels } = useModels()
    await fetchModels()
    expect(models.value).toHaveLength(3)
    const ids = models.value.map(m => m.id)
    expect(ids).toContain('gpt-4o')
    expect(ids).toContain('gpt-5.2')
    expect(ids).toContain('claude-opus-4-7')
  })

  it('infers OpenAI provider from gpt- prefix', async () => {
    mockFetch(mockOpenAIResponse, { data: [], object: 'list' })
    const { models, fetchModels } = useModels()
    await fetchModels()
    expect(models.value.find(m => m.id === 'gpt-4o')?.provider).toBe('OpenAI')
  })

  it('infers Claude provider from claude- prefix', async () => {
    mockFetch({ data: [], object: 'list' }, mockClaudeResponse)
    const { models, fetchModels } = useModels()
    await fetchModels()
    expect(models.value.find(m => m.id === 'claude-opus-4-7')?.provider).toBe('Claude')
  })

  it('filters by provider', async () => {
    mockFetch(mockOpenAIResponse, mockClaudeResponse)
    const { fetchModels, filteredModels, activeProvider } = useModels()
    await fetchModels()
    activeProvider.value = 'Claude'
    expect(filteredModels.value).toHaveLength(1)
    expect(filteredModels.value[0].id).toBe('claude-opus-4-7')
  })

  it('filters by search query', async () => {
    mockFetch(mockOpenAIResponse, { data: [], object: 'list' })
    const { fetchModels, filteredModels, searchQuery } = useModels()
    await fetchModels()
    searchQuery.value = '5.2'
    expect(filteredModels.value).toHaveLength(1)
    expect(filteredModels.value[0].id).toBe('gpt-5.2')
  })

  it('returns partial error array when one key fails', async () => {
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      if (callCount++ === 0) return { ok: true, json: async () => mockOpenAIResponse } as Response
      throw new Error('Network error')
    }))
    const { fetchModels, models } = useModels()
    const errors = await fetchModels()
    expect(models.value).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Claude')
  })

  it('sets error ref when both keys fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network error') }))
    const { fetchModels, error } = useModels()
    await fetchModels()
    expect(error.value).toBeTruthy()
  })
})
