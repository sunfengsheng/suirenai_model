<template>
  <div class="channel-view">
    <el-empty v-if="modelsByChannel.length === 0" description="暂无渠道数据" image-size="120" />
    <el-collapse v-else v-model="activeNames">
      <el-collapse-item
        v-for="group in modelsByChannel"
        :key="group.name"
        :name="group.name"
      >
        <template #title>
          <div class="panel-title">
            <span class="channel-name">{{ group.name }}</span>
            <el-tag size="small" type="danger" class="discount-tag">
              {{ discountLabel(group.discount) }}
            </el-tag>
            <span class="model-count">{{ group.models.length }} 个模型</span>
          </div>
        </template>

        <ul class="model-list">
          <li
            v-for="model in group.models"
            :key="model.id"
            class="model-item"
            @click="$emit('select', model)"
          >
            <ProviderIcon :provider="model.provider" :size="16" :class="'icon-' + model.provider.toLowerCase()" />
            <span class="model-name">{{ model.displayName }}</span>
            <span class="model-id">{{ model.id }}</span>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import type { ChannelGroup, ModelItem } from '../composables/useModels'
import ProviderIcon from './ProviderIcon.vue'

defineProps<{ modelsByChannel: ChannelGroup[] }>()
defineEmits<{ (e: 'select', model: ModelItem): void }>()

const activeNames = ref<string[]>([])

function discountLabel(discount: number): string {
  if (discount === 1) return '无折扣'
  return `${parseFloat((discount * 10).toPrecision(2))}折`
}
</script>

<style scoped>
.channel-view { width: 100%; }

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}
.channel-name { font-size: 15px; color: #303133; }
.discount-tag { flex-shrink: 0; }
.model-count { font-size: 12px; color: #909399; font-weight: 400; margin-left: auto; padding-right: 8px; }

.model-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.model-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.model-item:hover { background: #f5f7fa; }
.model-name { font-size: 14px; color: #303133; font-weight: 500; flex-shrink: 0; }
.model-id { font-size: 12px; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.arrow { margin-left: auto; color: #c0c4cc; flex-shrink: 0; }

.icon-openai { color: #10a37f; flex-shrink: 0; }
.icon-claude { color: #d97757; flex-shrink: 0; }
.icon-other { color: #909399; flex-shrink: 0; }
</style>
