<template>
  <el-dialog
    :model-value="!!modelValue"
    @update:model-value="(v: boolean) => !v && $emit('update:modelValue', null)"
    :title="modelValue?.displayName ?? ''"
    width="560px"
  >
    <template v-if="modelValue">
      <el-descriptions :column="1" border>
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
        <template v-if="modelValue.pricing">
          <el-descriptions-item label="输入原价">
            ${{ modelValue.pricing.input }} / 1M tokens
          </el-descriptions-item>
          <el-descriptions-item label="输出原价">
            ${{ modelValue.pricing.output }} / 1M tokens
          </el-descriptions-item>
        </template>
        <el-descriptions-item label="定价" v-if="!modelValue.pricing">
          暂无定价信息
        </el-descriptions-item>
      </el-descriptions>

      <div class="channel-section" v-if="modelValue.pricing">
        <div class="channel-title">渠道折扣价 <span class="rate-hint">（汇率 1 USD ≈ ¥{{ exchangeRate.toFixed(2) }}）</span></div>
        <el-table :data="channelPricing" size="small" border style="width:100%">
          <el-table-column label="渠道" prop="name" width="80" />
          <el-table-column label="折扣" width="70">
            <template #default="{ row }">
              <el-tag size="small" type="danger">{{ row.discountLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="输入折扣价">
            <template #default="{ row }">
              <span class="cny-price">¥{{ row.inputCNY }}</span>
              <span class="per"> / 1M</span>
            </template>
          </el-table-column>
          <el-table-column label="输出折扣价">
            <template #default="{ row }">
              <span class="cny-price">¥{{ row.outputCNY }}</span>
              <span class="per"> / 1M</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import type { ModelItem } from '../composables/useModels'

const props = defineProps<{ modelValue: ModelItem | null; exchangeRate: number }>()
defineEmits<{ (e: 'update:modelValue', value: ModelItem | null): void }>()

const tagType = computed((): '' | 'success' | 'warning' | 'info' => {
  if (props.modelValue?.provider === 'Claude') return 'warning'
  if (props.modelValue?.provider === 'OpenAI') return 'success'
  return 'info'
})

const formattedDate = computed(() =>
  props.modelValue ? new Date(props.modelValue.createdAt).toLocaleDateString('zh-CN') : ''
)

const channelPricing = computed(() => {
  const m = props.modelValue
  if (!m?.pricing) return []
  const inputUSD = parseFloat(m.pricing.input)
  const outputUSD = parseFloat(m.pricing.output)
  return m.channels.map(ch => ({
    name: ch.name,
    discountLabel: ch.discount === 1 ? '无折扣' : `${Math.round(ch.discount * 10)}折`,
    inputCNY: (inputUSD * ch.discount * props.exchangeRate).toFixed(2),
    outputCNY: (outputUSD * ch.discount * props.exchangeRate).toFixed(2),
  }))
})

async function copyId() {
  if (!props.modelValue) return
  await navigator.clipboard.writeText(props.modelValue.id)
  ElMessage.success('已复制模型 ID')
}
</script>

<style scoped>
.channel-section {
  margin-top: 20px;
}
.channel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
.rate-hint {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}
.cny-price {
  color: #e6a23c;
  font-weight: 600;
}
.per {
  color: #c0c4cc;
  font-size: 11px;
}
</style>
