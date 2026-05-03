<script setup lang="ts">
import { ArrowLeftRight } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMarinePlaceholder
    title="Transactions"
    subtitle="Full history of premium charges, refunds, and wallet movements."
    :icon="ArrowLeftRight"
  />
</template>
