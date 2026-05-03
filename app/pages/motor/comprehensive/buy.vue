<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMotorPlaceholder
    category="Motor · Comprehensive"
    title="Buy comprehensive policy"
    subtitle="Insure a vehicle with full comprehensive cover — fire, theft, third-party and own damage."
    cta="Start application"
    :icon="ShieldCheck"
  />
</template>
