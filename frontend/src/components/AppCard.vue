<template>
  <div class="card">
    <div v-if="$slots.header" class="px-4 sm:px-6 py-4 border-b border-brand-border bg-white flex items-center justify-between">
      <slot name="header" />
    </div>
    <div :class="[noPadding ? '' : 'p-4 sm:p-6']">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-4 sm:px-6 py-4 bg-brand-bg/30 border-t border-brand-border">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  noPadding?: boolean;
}>();
</script>
