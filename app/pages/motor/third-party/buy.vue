<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMotorPlaceholder
    category="Motor · Third party"
    title="Buy third-party policy"
    subtitle="Statutory third-party motor insurance — quick to issue, instantly verifiable."
    cta="Start application"
    :icon="ShieldCheck"
  />
</template>
