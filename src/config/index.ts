export interface Channel {
  key: string
  name: string
  discount: number
}

export interface AppConfig {
  channels: Channel[]
  modelReleaseDates: Record<string, string>
}
