<script setup lang="ts">
import { Quote } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMarinePlaceholder
    title="All quotations"
    subtitle="Every marine quotation you've requested — open ones, expired ones, and converted policies."
    cta="Generate quotation"
    :icon="Quote"
  />
</template>
