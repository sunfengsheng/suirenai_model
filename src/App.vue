<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">模型广场</h1>
    </header>

    <div class="app-body">
      <SidebarFilter v-model="activeProvider" :items="sidebarItems" :exchange-rate="exchangeRate" />

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

        <el-empty v-else-if="error" :description="error" image-size="120" />

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

    <ModelDetail v-model="selectedModel" :exchange-rate="exchangeRate" />
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

const { models, loading, error, searchQuery, activeProvider, filteredModels, fetchModels, exchangeRate } = useModels()
const selectedModel = ref<ModelItem | null>(null)
const partialErrors = ref<string[]>([])

const sidebarItems = computed(() => {
  const counts = { All: models.value.length, OpenAI: 0, Claude: 0, DeepSeek: 0, Other: 0 }
  for (const m of models.value) counts[m.provider]++
  return [
    { value: 'All', label: '全部', count: counts.All },
    { value: 'OpenAI', label: 'OpenAI', count: counts.OpenAI },
    { value: 'Claude', label: 'Claude', count: counts.Claude },
    { value: 'DeepSeek', label: 'DeepSeek', count: counts.DeepSeek },
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
.search-bar { margin-bottom: 16px; }
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
</style>
