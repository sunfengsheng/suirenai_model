<template>
  <el-card class="model-card" shadow="hover" @click="$emit('click')">
    <div class="card-header">
      <ProviderIcon :provider="model.provider" :size="24" :class="'icon-' + model.provider.toLowerCase()" />
      <el-tag :type="tagType" size="small">{{ model.provider }}</el-tag>
      <el-tag size="small" type="info" class="channel-count">
        {{ model.channels.length }} 个渠道
      </el-tag>
    </div>
    <div class="model-name" :title="model.id">{{ model.displayName }}</div>
    <template v-if="model.pricing">
      <div class="pricing-row">
        <span class="label">输入</span>
        <span class="usd">${{ model.pricing.input }}</span>
      </div>
      <div class="pricing-row">
        <span class="label">输出</span>
        <span class="usd">${{ model.pricing.output }}</span>
      </div>
    </template>
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
import ProviderIcon from './ProviderIcon.vue'

const props = defineProps<{ model: ModelItem }>()
defineEmits<{ (e: 'click'): void }>()

const tagType = computed((): '' | 'success' | 'warning' | 'info' => {
  if (props.model.provider === 'Claude') return 'warning'
  if (props.model.provider === 'OpenAI') return 'success'
  if (props.model.provider === 'DeepSeek') return ''
  return 'info'
})

async function copyId() {
  await navigator.clipboard.writeText(props.model.id)
  ElMessage.success('已复制模型 ID')
}
</script>

<style scoped>
.model-card { cursor: pointer; }
.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.channel-count { margin-left: auto; }
.model-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
  color: #303133;
}
.pricing-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}
.label { color: #909399; width: 24px; }
.no-price {
  font-size: 12px;
  color: #c0c4cc;
  margin-bottom: 12px;
}
.card-footer { margin-top: 10px; }
.icon-openai { color: #10a37f; }
.icon-claude { color: #d97757; }
.icon-other { color: #909399; }
</style>
