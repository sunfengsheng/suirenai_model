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
    <div class="sidebar-note">
      <div class="note-line">价格单位</div>
      <div class="note-unit">USD / 1M tokens</div>
      <div class="note-rate">1 USD ≈ ¥{{ exchangeRate.toFixed(2) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  items: { value: string; label: string; count: number }[]
  exchangeRate: number
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
.count-badge { margin-left: auto; }
.sidebar-note {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  line-height: 1.8;
}
.note-line {
  font-size: 11px;
  color: #c0c4cc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.note-unit {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}
.note-rate {
  font-size: 11px;
  color: #e6a23c;
}
</style>
