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
