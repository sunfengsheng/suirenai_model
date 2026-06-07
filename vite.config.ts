/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  const proxyEntries: Record<string, object> = {}
  for (let i = 0; i < 20; i++) {
    const key = env[`PROXY_KEY_${i}`]
    if (!key) break
    const idx = i
    proxyEntries[`/proxy/ch${idx}`] = {
      target: 'https://api.suirenai.com',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(new RegExp(`^/proxy/ch${idx}`), ''),
      configure: (proxy: any) => {
        proxy.on('proxyReq', (proxyReq: any) => {
          proxyReq.setHeader('Authorization', `Bearer ${key}`)
        })
      }
    }
  }

  return {
    plugins: [vue()],
    server: { proxy: proxyEntries },
    test: {
      environment: 'jsdom',
      globals: true
    }
  }
})
