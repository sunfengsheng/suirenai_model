# 模型广场 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Vue 3 + Element Plus 模型广场 SPA，对接 sub2api 两个 API Key 展示模型列表，支持按提供商筛选、关键词搜索、详情弹窗和一键复制模型 ID。

**Architecture:** SPA 单页应用，页面加载时并发调用两个 Key 的 `/v1/models`，合并去重后在前端完成筛选/搜索。Vite dev server 代理 `/v1` 到 `https://api.suirenai.com` 解决跨域。配置（Key）硬编码在 `src/config/index.ts`，价格存在 `src/data/pricing.json`。

**Tech Stack:** Vue 3, TypeScript, Vite, Element Plus, @element-plus/icons-vue, Vitest, @vue/test-utils, jsdom

---

## File Map

| 文件 | 职责 |
|------|------|
| `src/config/index.ts` | BASE_URL 和两个 API Key |
| `src/data/pricing.json` | 按模型 id 存储输入/输出价格 |
| `src/composables/useModels.ts` | 拉取、合并、去重、筛选逻辑；导出 `ModelItem` 类型 |
| `src/components/SidebarFilter.vue` | 左侧提供商分类菜单 + 计数 badge |
| `src/components/ModelCard.vue` | 模型卡片（名称/标签/价格/复制按钮） |
| `src/components/ModelDetail.vue` | 详情弹窗（El Dialog + Descriptions） |
| `src/App.vue` | 顶栏 + 搜索框 + 布局，组合所有组件 |
| `src/main.ts` | 挂载 Vue + 全局注册 Element Plus |
| `vite.config.ts` | Vite + Vitest 配置 + /v1 代理 |
| `index.html` | 页面标题 |
| `tests/useModels.spec.ts` | useModels 核心逻辑单元测试 |

---

### Task 1: 初始化项目

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts`, `src/App.vue`

- [ ] **Step 1: 在 `/d/code/model` 目录创建 Vite + Vue 3 + TypeScript 项目**

```bash
npm create vite@latest . -- --template vue-ts
```

提示 "Current directory is not empty" 时选择 `Ignore files and continue`。

- [ ] **Step 2: 安装依赖**

```bash
npm install element-plus @element-plus/icons-vue
npm install -D vitest @vue/test-utils jsdom @vitejs/plugin-vue
```

- [ ] **Step 3: 替换 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://api.suirenai.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

- [ ] **Step 4: 确认 tsconfig.json 包含 resolveJsonModule**

检查 `tsconfig.json`（或 `tsconfig.app.json`）中是否有 `"resolveJsonModule": true`，没有则添加到 `compilerOptions`：

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 5: 验证项目可启动**

```bash
npm run dev
```

期望：终端显示 `Local: http://localhost:5173/`，浏览器打开后显示默认 Vite Vue 页面，无报错。按 Ctrl+C 停止。

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: init vue3 vite project with element-plus and vitest"
```

---

### Task 2: 配置文件和价格数据

**Files:**
- Create: `src/config/index.ts`
- Create: `src/data/pricing.json`

- [ ] **Step 1: 创建 src/config/index.ts**

```typescript
export const BASE_URL = 'https://api.suirenai.com'
export const OPENAI_KEY = 'sk-8e7bc96941b74e6f5dd2c4f551be12c34b5fa0767a0ac6d50a19e7f234cc241e'
export const CLAUDE_KEY = 'sk-d0cd7b1c19a8532783d62eaa44137a7a65d670af8c269052f69398939b7a073d'
```

- [ ] **Step 2: 创建 src/data/pricing.json**

```json
{
  "gpt-4o": { "input": "2.5", "output": "10", "unit": "USD/1M tokens" },
  "openai/gpt-4o": { "input": "2.5", "output": "10", "unit": "USD/1M tokens" },
  "openai/gpt-4o-mini": { "input": "0.15", "output": "0.6", "unit": "USD/1M tokens" },
  "openai/gpt-4.1": { "input": "2", "output": "8", "unit": "USD/1M tokens" },
  "openai/gpt-4.1-mini": { "input": "0.4", "output": "1.6", "unit": "USD/1M tokens" },
  "openai/gpt-4.1-nano": { "input": "0.1", "output": "0.4", "unit": "USD/1M tokens" },
  "gpt-5.2": { "input": "10", "output": "30", "unit": "USD/1M tokens" },
  "gpt-5.4": { "input": "15", "output": "60", "unit": "USD/1M tokens" },
  "gpt-5.4-mini": { "input": "3", "output": "12", "unit": "USD/1M tokens" },
  "gpt-5.5": { "input": "30", "output": "100", "unit": "USD/1M tokens" },
  "gpt-5.3-codex": { "input": "3", "output": "15", "unit": "USD/1M tokens" },
  "openai/gpt-5.3-codex": { "input": "3", "output": "15", "unit": "USD/1M tokens" },
  "openai/gpt-5.5": { "input": "30", "output": "100", "unit": "USD/1M tokens" },
  "claude-haiku-4-5": { "input": "0.8", "output": "4", "unit": "USD/1M tokens" },
  "claude-sonnet-4-6": { "input": "3", "output": "15", "unit": "USD/1M tokens" },
  "claude-opus-4-6": { "input": "15", "output": "75", "unit": "USD/1M tokens" },
  "claude-opus-4-7": { "input": "15", "output": "75", "unit": "USD/1M tokens" }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config/index.ts src/data/pricing.json
git commit -m "chore: add config and pricing data"
```

---

### Task 3: useModels 组合式函数（含测试）

**Files:**
- Create: `src/composables/useModels.ts`
- Create: `tests/useModels.spec.ts`

- [ ] **Step 1: 写失败的单元测试，新建 tests/useModels.spec.ts**

```typescript
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/useModels.spec.ts
```

期望：FAIL，提示模块找不到。

- [ ] **Step 3: 创建 src/composables/useModels.ts**

```typescript
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
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/useModels.spec.ts
```

期望：所有 7 个测试 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/composables/useModels.ts tests/useModels.spec.ts
git commit -m "feat: add useModels composable with tests"
```

---

### Task 4: SidebarFilter 组件

**Files:**
- Create: `src/components/SidebarFilter.vue`

- [ ] **Step 1: 创建 src/components/SidebarFilter.vue**

```vue
<template>
  <div class="sidebar">
    <el-menu :default-active="modelValue" @select="(val: string) => $emit('update:modelValue', val)">
      <el-menu-item
        v-for="item in items"
        :key="item.value"
        :index="item.value"
        class="sidebar-item"
      >
        <span>{{ item.label }}</span>
        <el-badge :value="item.count" class="count-badge" type="info" />
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  items: { value: string; label: string; count: number }[]
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<style scoped>
.sidebar {
  width: 180px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  align-self: flex-start;
}
.sidebar-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.count-badge {
  margin-left: auto;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SidebarFilter.vue
git commit -m "feat: add SidebarFilter component"
```

---

### Task 5: ModelCard 组件

**Files:**
- Create: `src/components/ModelCard.vue`

- [ ] **Step 1: 创建 src/components/ModelCard.vue**

```vue
<template>
  <el-card class="model-card" shadow="hover" @click="$emit('click')">
    <div class="card-header">
      <span class="provider-icon">{{ providerIcon }}</span>
      <el-tag :type="tagType" size="small">{{ model.provider }}</el-tag>
    </div>
    <div class="model-name" :title="model.id">{{ model.displayName }}</div>
    <div class="pricing" v-if="model.pricing">
      <span>输入 ${{ model.pricing.input }}</span>
      <span class="sep">/</span>
      <span>输出 ${{ model.pricing.output }}</span>
      <span class="unit">{{ model.pricing.unit }}</span>
    </div>
    <div class="no-price" v-else>暂无定价</div>
    <div class="card-footer">
      <el-button size="small" :icon="CopyDocument" @click.stop="copyId">复制 ID</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import type { ModelItem } from '../composables/useModels'

const props = defineProps<{ model: ModelItem }>()
defineEmits<{ (e: 'click'): void }>()

const providerIcon = computed(() => {
  if (props.model.provider === 'Claude') return '🟠'
  if (props.model.provider === 'OpenAI') return '🟢'
  return '⚪'
})

const tagType = computed((): '' | 'success' | 'warning' | 'info' => {
  if (props.model.provider === 'Claude') return 'warning'
  if (props.model.provider === 'OpenAI') return 'success'
  return 'info'
})

async function copyId() {
  await navigator.clipboard.writeText(props.model.id)
  ElMessage.success('已复制模型 ID')
}
</script>

<style scoped>
.model-card {
  cursor: pointer;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.provider-icon {
  font-size: 20px;
  line-height: 1;
}
.model-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
  color: #303133;
}
.pricing {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.sep { color: #c0c4cc; }
.unit { color: #909399; }
.no-price {
  font-size: 12px;
  color: #c0c4cc;
  margin-bottom: 12px;
}
.card-footer {
  margin-top: 4px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ModelCard.vue
git commit -m "feat: add ModelCard component"
```

---

### Task 6: ModelDetail 详情弹窗

**Files:**
- Create: `src/components/ModelDetail.vue`

- [ ] **Step 1: 创建 src/components/ModelDetail.vue**

```vue
<template>
  <el-dialog
    :model-value="!!modelValue"
    @update:model-value="(v) => !v && $emit('update:modelValue', null)"
    :title="modelValue?.displayName ?? ''"
    width="500px"
  >
    <el-descriptions :column="1" border v-if="modelValue">
      <el-descriptions-item label="模型 ID">
        <div style="display:flex; align-items:center; gap:8px">
          <span style="word-break:break-all">{{ modelValue.id }}</span>
          <el-button :icon="CopyDocument" size="small" text @click="copyId" />
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="提供商">
        <el-tag :type="tagType">{{ modelValue.provider }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="上架时间">{{ formattedDate }}</el-descriptions-item>
      <el-descriptions-item label="输入价格" v-if="modelValue.pricing">
        ${{ modelValue.pricing.input }} {{ modelValue.pricing.unit }}
      </el-descriptions-item>
      <el-descriptions-item label="输出价格" v-if="modelValue.pricing">
        ${{ modelValue.pricing.output }} {{ modelValue.pricing.unit }}
      </el-descriptions-item>
      <el-descriptions-item label="定价" v-if="!modelValue.pricing">
        暂无定价信息
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import type { ModelItem } from '../composables/useModels'

const props = defineProps<{ modelValue: ModelItem | null }>()
defineEmits<{ (e: 'update:modelValue', value: ModelItem | null): void }>()

const tagType = computed((): '' | 'success' | 'warning' | 'info' => {
  if (props.modelValue?.provider === 'Claude') return 'warning'
  if (props.modelValue?.provider === 'OpenAI') return 'success'
  return 'info'
})

const formattedDate = computed(() =>
  props.modelValue ? new Date(props.modelValue.createdAt).toLocaleDateString('zh-CN') : ''
)

async function copyId() {
  if (!props.modelValue) return
  await navigator.clipboard.writeText(props.modelValue.id)
  ElMessage.success('已复制模型 ID')
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ModelDetail.vue
git commit -m "feat: add ModelDetail dialog component"
```

---

### Task 7: App.vue 主布局 + main.ts

**Files:**
- Modify: `src/main.ts`
- Modify: `src/App.vue`
- Modify: `index.html`

- [ ] **Step 1: 替换 src/main.ts**

```typescript
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component as any)
}

app.mount('#app')
```

- [ ] **Step 2: 替换 src/App.vue**

```vue
<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">模型广场</h1>
    </header>

    <div class="app-body">
      <SidebarFilter v-model="activeProvider" :items="sidebarItems" />

      <main class="main-content">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索模型名称或 ID..."
            :prefix-icon="Search"
            clearable
            size="large"
          />
        </div>

        <el-alert
          v-if="partialErrors.length"
          :title="partialErrors.join('；')"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />

        <template v-if="loading">
          <div class="model-grid">
            <el-skeleton v-for="n in 8" :key="n" :rows="3" animated style="padding:16px; background:#fff; border-radius:8px" />
          </div>
        </template>

        <el-empty
          v-else-if="error"
          :description="error"
          image-size="120"
        />

        <el-empty
          v-else-if="!loading && filteredModels.length === 0"
          description="没有找到匹配的模型"
          image-size="120"
        />

        <div v-else class="model-grid">
          <ModelCard
            v-for="model in filteredModels"
            :key="model.id"
            :model="model"
            @click="selectedModel = model"
          />
        </div>
      </main>
    </div>

    <ModelDetail v-model="selectedModel" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useModels } from './composables/useModels'
import SidebarFilter from './components/SidebarFilter.vue'
import ModelCard from './components/ModelCard.vue'
import ModelDetail from './components/ModelDetail.vue'
import type { ModelItem } from './composables/useModels'

const { models, loading, error, searchQuery, activeProvider, filteredModels, fetchModels } = useModels()
const selectedModel = ref<ModelItem | null>(null)
const partialErrors = ref<string[]>([])

const sidebarItems = computed(() => {
  const counts = { All: models.value.length, OpenAI: 0, Claude: 0, Other: 0 }
  for (const m of models.value) counts[m.provider]++
  return [
    { value: 'All', label: '全部', count: counts.All },
    { value: 'OpenAI', label: 'OpenAI', count: counts.OpenAI },
    { value: 'Claude', label: 'Claude', count: counts.Claude },
    { value: 'Other', label: '其他', count: counts.Other }
  ]
})

onMounted(async () => {
  partialErrors.value = await fetchModels()
})
</script>

<style>
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
}
.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.app-body {
  display: flex;
  flex: 1;
  padding: 24px;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
.main-content {
  flex: 1;
  min-width: 0;
}
.search-bar {
  margin-bottom: 16px;
}
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
</style>
```

- [ ] **Step 3: 更新 index.html 标题**

将 `index.html` 中的 `<title>` 改为：

```html
<title>模型广场</title>
```

- [ ] **Step 4: 删除默认生成的无用文件**

```bash
rm -f src/components/HelloWorld.vue src/style.css
```

如有引用 `src/style.css` 的 import 在 `main.ts` 中，同时删除该行。

- [ ] **Step 5: 启动开发服务器验证**

```bash
npm run dev
```

打开 http://localhost:5173，确认：
- 页面加载后显示骨架屏，然后展示模型卡片网格
- 左侧分类数字正确（全部 / OpenAI / Claude）
- 搜索框输入关键词可过滤卡片
- 点击分类可切换显示
- 点击卡片弹出详情弹窗，包含价格信息
- 点击复制按钮弹出 "已复制模型 ID" 提示

- [ ] **Step 6: Commit**

```bash
git add src/main.ts src/App.vue index.html
git commit -m "feat: complete app layout and wiring"
```

---

### Task 8: 最终验证和构建

- [ ] **Step 1: 运行所有测试**

```bash
npx vitest run
```

期望：所有测试 PASS，无 FAIL。

- [ ] **Step 2: TypeScript 类型检查**

```bash
npx vue-tsc --noEmit
```

期望：无类型错误。

- [ ] **Step 3: 生产构建**

```bash
npm run build
```

期望：`dist/` 目录生成，无报错。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verified tests, types, and production build"
```
