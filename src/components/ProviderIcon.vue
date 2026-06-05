<template>
  <span class="provider-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <!-- OpenAI logo -->
    <svg v-if="provider === 'OpenAI'" :width="size" :height="size" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.178-3.285 10.079 10.079 0 0 0-9.835 4.935 9.964 9.964 0 0 0-6.659 4.8 10.079 10.079 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.178 3.285 10.079 10.079 0 0 0 9.835-4.935 9.965 9.965 0 0 0 6.659-4.8 10.079 10.079 0 0 0-1.24-11.818zm-17.776 24.795a7.465 7.465 0 0 1-4.8-1.744c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.276zm-16.106-6.87a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zm-2.117-17.904a7.47 7.47 0 0 1 3.903-3.287c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L4.502 23.77a7.504 7.504 0 0 1-.97-7.609zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .114-.012l8.048 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.647-1.13zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756c-.062.033-.168.091-.237.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.005 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v4.999l-4.331 2.5-4.331-2.5V21.28z" fill="currentColor"/>
    </svg>

    <!-- Claude / Anthropic logo -->
    <svg v-else-if="provider === 'Claude'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.304 3.541 12.836 16.37h-2.275L6.09 3.541H3.688L9.11 18.72h5.218L19.75 3.541h-2.446z" fill="currentColor"/>
      <path d="M14.892 20.459h2.415v-2.444h-2.415v2.444z" fill="currentColor"/>
    </svg>

    <!-- Other / default icon -->
    <svg v-else :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  provider: 'OpenAI' | 'Claude' | 'Other'
  size?: number
}>(), {
  size: 24
})
</script>

<style scoped>
.provider-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
