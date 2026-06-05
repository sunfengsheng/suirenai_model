<template>
  <el-dialog
    :model-value="!!modelValue"
    @update:model-value="(v: boolean) => !v && $emit('update:modelValue', null)"
    :title="modelValue?.displayName ?? ''"
    width="520px"
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
      <el-descriptions-item label="渠道">
        {{ modelValue.channelName }}
        <el-tag size="small" type="danger" style="margin-left:8px">
          {{ discountLabel }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="上架时间">{{ formattedDate }}</el-descriptions-item>
      <template v-if="modelValue.pricing">
        <el-descriptions-item label="输入原价">
          ${{ modelValue.pricing.input }} / 1M tokens
        </el-descriptions-item>
        <el-descriptions-item label="输入折扣价">
          <span style="color:#e6a23c;font-weight:600">¥{{ inputCNY }}</span>
          <span style="color:#909399;font-size:12px;margin-left:4px">/ 1M tokens</span>
        </el-descriptions-item>
        <el-descriptions-item label="输出原价">
          ${{ modelValue.pricing.output }} / 1M tokens
        </el-descriptions-item>
        <el-descriptions-item label="输出折扣价">
          <span style="color:#e6a23c;font-weight:600">¥{{ outputCNY }}</span>
          <span style="color:#909399;font-size:12px;margin-left:4px">/ 1M tokens</span>
        </el-descriptions-item>
      </template>
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

const props = defineProps<{ modelValue: ModelItem | null; exchangeRate: number }>()
defineEmits<{ (e: 'update:modelValue', value: ModelItem | null): void }>()

const tagType = computed((): '' | 'success' | 'warning' | 'info' => {
  if (props.modelValue?.provider === 'Claude') return 'warning'
  if (props.modelValue?.provider === 'OpenAI') return 'success'
  return 'info'
})

const discountLabel = computed(() => {
  if (!props.modelValue) return ''
  return `${Math.round(props.modelValue.discount * 10)}折`
})

const formattedDate = computed(() =>
  props.modelValue ? new Date(props.modelValue.createdAt).toLocaleDateString('zh-CN') : ''
)

function calcCNY(usd: string): string {
  if (!props.modelValue) return ''
  return (parseFloat(usd) * props.modelValue.discount * props.exchangeRate).toFixed(2)
}

const inputCNY = computed(() => props.modelValue?.pricing ? calcCNY(props.modelValue.pricing.input) : '')
const outputCNY = computed(() => props.modelValue?.pricing ? calcCNY(props.modelValue.pricing.output) : '')

async function copyId() {
  if (!props.modelValue) return
  await navigator.clipboard.writeText(props.modelValue.id)
  ElMessage.success('已复制模型 ID')
}
</script>
