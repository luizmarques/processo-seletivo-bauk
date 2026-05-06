<template>
  <div class="space-y-1">
    <label v-if="label" :for="id" class="block text-[10px] font-bold text-brand-primary uppercase tracking-widest ml-1">
      {{ label }}
    </label>
    <div class="relative">
      <input
        v-bind="$attrs"
        :id="id"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="input-field"
      />
      <div v-if="$slots.suffix" class="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs font-bold">
        <slot name="suffix" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  modelValue?: string | number;
  id?: string;
}>();
defineEmits(['update:modelValue']);
</script>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>
