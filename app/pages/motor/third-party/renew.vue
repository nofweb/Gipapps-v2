<script setup lang="ts">
import { Receipt } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMotorPlaceholder
    category="Motor · Third party"
    title="Renew third-party policy"
    subtitle="Continue cover on an existing third-party motor policy before it expires."
    cta="Find my policy"
    :icon="Receipt"
  />
</template>
