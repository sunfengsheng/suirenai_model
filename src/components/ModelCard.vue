<template>
  <el-card class="model-card" shadow="hover" @click="$emit('click')">
    <div class="card-header">
      <ProviderIcon :provider="model.provider" :size="24" :class="'icon-' + model.provider.toLowerCase()" />
      <el-tag :type="tagType" size="small">{{ model.provider }}</el-tag>
      <el-tag size="small" class="channel-tag">{{ model.channelName }}</el-tag>
    </div>
    <div class="model-name" :title="model.id">{{ model.displayName }}</div>
    <template v-if="model.pricing">
      <div class="pricing-row">
        <span class="label">输入</span>
        <span class="usd">${{ model.pricing.input }}</span>
        <span class="arrow">→</span>
        <span class="cny">¥{{ inputCNY }}</span>
      </div>
      <div class="pricing-row">
        <span class="label">输出</span>
        <span class="usd">${{ model.pricing.output }}</span>
        <span class="arrow">→</span>
        <span class="cny">¥{{ outputCNY }}</span>
      </div>
      <div class="discount-badge">{{ discountLabel }}</div>
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

const props = defineProps<{ model: ModelItem; exchangeRate: number }>()
defineEmits<{ (e: 'click'): void }>()

const tagType = computed((): '' | 'success' | 'warning' | 'info' => {
  if (props.model.provider === 'Claude') return 'warning'
  if (props.model.provider === 'OpenAI') return 'success'
  return 'info'
})

const discountLabel = computed(() => {
  const pct = Math.round(props.model.discount * 10)
  return `${pct}折优惠`
})

function calcCNY(usd: string): string {
  return (parseFloat(usd) * props.model.discount * props.exchangeRate).toFixed(2)
}

const inputCNY = computed(() => props.model.pricing ? calcCNY(props.model.pricing.input) : '')
const outputCNY = computed(() => props.model.pricing ? calcCNY(props.model.pricing.output) : '')

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
.channel-tag { margin-left: auto; }
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
  gap: 5px;
  font-size: 12px;
  margin-bottom: 4px;
}
.label { color: #909399; width: 24px; }
.usd { color: #606266; }
.arrow { color: #c0c4cc; font-size: 10px; }
.cny { color: #e6a23c; font-weight: 600; }
.discount-badge {
  display: inline-block;
  font-size: 11px;
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 4px;
  padding: 1px 6px;
  margin: 4px 0 8px;
}
.no-price {
  font-size: 12px;
  color: #c0c4cc;
  margin-bottom: 12px;
}
.card-footer { margin-top: 4px; }
.icon-openai { color: #10a37f; }
.icon-claude { color: #d97757; }
.icon-other { color: #909399; }
</style>
