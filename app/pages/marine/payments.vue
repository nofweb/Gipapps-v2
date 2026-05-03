<script setup lang="ts">
import { CreditCard } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMarinePlaceholder
    title="Payments"
    subtitle="Premium payments and outstanding balances on your marine policies."
    cta="Make a payment"
    :icon="CreditCard"
  />
</template>
