interface Channel {
  key: string
  name: string
  discount: number  // e.g. 0.8 = 8折, 1.0 = 无折扣
}

export const CHANNELS: Channel[] = [
  {
    key: 'sk-8e7bc96941b74e6f5dd2c4f551be12c34b5fa0767a0ac6d50a19e7f234cc241e',
    name: 'gpt 通道1',
    discount: 0.3
  },
  {
    key: 'sk-d0cd7b1c19a8532783d62eaa44137a7a65d670af8c269052f69398939b7a073d',
    name: 'claude 通道1',
    discount: 0.3
  },
  {
    key: 'sk-bb25871f4fabd091a86786caf3c9436a9951125d62e9313ea5de8b1d310f085c',
    name: 'gpt 通道2',
    discount: 0.3
  },
  {
    key: 'sk-32b3bf6dc5fbfb905dcdb69794068c6b1fcee33c22bc232b715b6a0125aec90b',
    name: 'claude 通道2',
    discount: 0.3
  }
]

// 模型上架日期，按模型 ID 配置（YYYY-MM-DD 格式）
export const MODEL_RELEASE_DATES: Record<string, string> = {
  'gpt-4o': '2024-05-13',
  'openai/gpt-4o': '2024-05-13',
  'openai/gpt-4o-mini': '2024-07-18',
  'openai/gpt-4.1': '2025-04-14',
  'openai/gpt-4.1-mini': '2025-04-14',
  'openai/gpt-4.1-nano': '2025-04-14',
  'gpt-5.2': '2025-07-09',
  'gpt-5.4': '2025-08-01',
  'gpt-5.4-mini': '2025-08-01',
  'gpt-5.5': '2025-09-01',
  'gpt-5.3-codex': '2025-07-01',
  'openai/gpt-5.3-codex': '2025-07-01',
  'openai/gpt-5.5': '2025-09-01',
  'claude-haiku-4-5': '2025-07-08',
  'claude-sonnet-4-6': '2025-10-01',
  'claude-opus-4-6': '2025-10-01',
  'claude-opus-4-7': '2026-02-01'
}
