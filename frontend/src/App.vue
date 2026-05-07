<template>
  <RouterView v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
      <template #fallback>
        <AppPageSkeleton :variant="pageSkeletonVariant" />
      </template>
    </Suspense>
  </RouterView>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppPageSkeleton from './components/AppPageSkeleton.vue';

const route = useRoute();

const pageSkeletonVariant = computed<'auth' | 'dashboard'>(() =>
  route.name === 'dashboard' ? 'dashboard' : 'auth',
);
</script>
