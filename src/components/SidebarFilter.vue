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
