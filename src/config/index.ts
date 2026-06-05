export const BASE_URL = 'https://api.suirenai.com'

export interface Channel {
  key: string
  name: string
  discount: number  // e.g. 0.8 = 8折, 1.0 = 无折扣
}

export const CHANNELS: Channel[] = [
  {
    key: 'sk-8e7bc96941b74e6f5dd2c4f551be12c34b5fa0767a0ac6d50a19e7f234cc241e',
    name: '渠道A',
    discount: 0.8
  },
  {
    key: 'sk-d0cd7b1c19a8532783d62eaa44137a7a65d670af8c269052f69398939b7a073d',
    name: '渠道B',
    discount: 0.9
  },
  {
    key: 'sk-bb25871f4fabd091a86786caf3c9436a9951125d62e9313ea5de8b1d310f085c',
    name: '渠道C',
    discount: 1.0
  },
  {
    key: 'sk-32b3bf6dc5fbfb905dcdb69794068c6b1fcee33c22bc232b715b6a0125aec90b',
    name: '渠道D',
    discount: 1.0
  }
]
