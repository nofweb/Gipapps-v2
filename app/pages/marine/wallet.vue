<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMarinePlaceholder
    title="Wallet"
    subtitle="Top up, manage balances, and pay marine premiums from your wallet."
    cta="Top up"
    :icon="Wallet"
  />
</template>
