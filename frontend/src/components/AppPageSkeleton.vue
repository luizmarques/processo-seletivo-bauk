<template>
  <div
    v-if="variant === 'dashboard'"
    class="min-h-screen flex flex-col font-inter bg-brand-bg"
  >
    <nav class="bg-white border-b border-brand-border sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <AppSkeleton height="2rem" width="8rem" />
        <div class="flex items-center gap-3">
          <AppSkeleton height="2rem" width="6rem" />
          <AppSkeleton height="2rem" width="4.5rem" />
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-4 sm:p-6 lg:col-span-1 space-y-5">
          <AppSkeleton height="0.875rem" width="8rem" />
          <AppSkeleton height="2.75rem" width="12rem" />
          <AppSkeleton height="0.75rem" width="6rem" />
        </div>

        <div class="card p-4 sm:p-6 lg:col-span-2 space-y-5">
          <AppSkeleton height="0.875rem" width="10rem" />
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <AppSkeleton class="md:col-span-5" height="2.75rem" fullWidth />
            <AppSkeleton class="md:col-span-4" height="2.75rem" fullWidth />
            <AppSkeleton class="md:col-span-3" height="2.75rem" fullWidth />
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="px-4 sm:px-6 py-4 border-b border-brand-border bg-white">
          <div class="flex flex-wrap gap-3 justify-between items-center">
            <AppSkeleton height="0.875rem" width="12rem" />
            <div class="flex flex-wrap gap-2">
              <AppSkeleton height="2.25rem" width="7rem" />
              <AppSkeleton height="2.25rem" width="7rem" />
              <AppSkeleton height="2.25rem" width="6rem" />
            </div>
          </div>
        </div>
        <div class="p-4 sm:p-6 space-y-4">
          <div v-for="index in 5" :key="index" class="grid grid-cols-4 gap-4">
            <AppSkeleton height="1rem" fullWidth />
            <AppSkeleton height="1rem" fullWidth />
            <AppSkeleton height="1rem" fullWidth />
            <AppSkeleton height="1rem" fullWidth />
          </div>
        </div>
      </div>
    </main>
  </div>

  <div
    v-else
    class="min-h-screen flex items-center justify-center p-6 bg-brand-bg relative overflow-hidden"
  >
    <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-primary opacity-5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-primary opacity-5 rounded-full blur-3xl"></div>

    <div class="w-full max-w-sm relative z-10 space-y-6">
      <div class="flex justify-center">
        <AppSkeleton height="2.5rem" width="8rem" />
      </div>
      <div class="card p-4 sm:p-6 space-y-5">
        <AppSkeleton height="1rem" width="7rem" />
        <AppSkeleton height="2.75rem" fullWidth />
        <AppSkeleton height="1rem" width="7rem" />
        <AppSkeleton height="2.75rem" fullWidth />
        <AppSkeleton height="2.75rem" fullWidth />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSkeleton from './AppSkeleton.vue';

withDefaults(defineProps<{
  variant?: 'auth' | 'dashboard';
}>(), {
  variant: 'auth',
});
</script>
