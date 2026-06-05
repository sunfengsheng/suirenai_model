<template>
  <el-dialog
    :model-value="!!modelValue"
    @update:model-value="(v: boolean) => !v && $emit('update:modelValue', null)"
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
