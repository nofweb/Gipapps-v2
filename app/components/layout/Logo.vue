<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <NuxtLink to="/" class="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
    <img
      src="/logo.png"
      alt="Guinea Insurance"
      class="h-9 w-auto object-contain"
    >
    <div v-if="!compact" class="hidden flex-col leading-tight sm:flex">
      <span class="text-[10px] font-medium uppercase tracking-widest text-secondary-500">Customer Portal</span>
    </div>
  </NuxtLink>
</template>
