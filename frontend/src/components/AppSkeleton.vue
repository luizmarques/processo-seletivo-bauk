<template>
  <div
    :class="[
      'animate-pulse rounded-md bg-brand-border/70',
      fullWidth ? 'w-full' : '',
    ]"
    :style="{ height, width }"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  height?: string;
  width?: string;
  fullWidth?: boolean;
}>(), {
  height: '1rem',
  width: '100%',
  fullWidth: false,
});
</script>
