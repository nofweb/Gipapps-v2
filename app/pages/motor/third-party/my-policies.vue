<script setup lang="ts">
import { FileText } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMotorPlaceholder
    category="Motor · Third party"
    title="My policies"
    subtitle="All your active third-party motor policies, ordered by expiry."
    :icon="FileText"
  />
</template>
