<script setup lang="ts">
import { Receipt } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMotorPlaceholder
    category="Motor · Comprehensive"
    title="Renew comprehensive policy"
    subtitle="Continue cover on an existing comprehensive policy before it expires."
    cta="Find my policy"
    :icon="Receipt"
  />
</template>
