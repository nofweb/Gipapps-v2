<script setup lang="ts">
import { FileCheck2 } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMarinePlaceholder
    title="Certificates"
    subtitle="Marine cover certificates issued for your shipments — view, download, or share."
    cta="Request certificate"
    :icon="FileCheck2"
  />
</template>
