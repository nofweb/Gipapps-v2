<script setup lang="ts">
import { Quote } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMarinePlaceholder
    title="Generate quotation"
    subtitle="Get an instant marine cover quotation for a new shipment or voyage."
    cta="Start quotation"
    :icon="Quote"
  />
</template>
