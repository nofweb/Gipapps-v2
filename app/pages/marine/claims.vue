<script setup lang="ts">
import { Wrench } from 'lucide-vue-next'

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>

<template>
  <ProductMarinePlaceholder
    title="Claims"
    subtitle="File and track marine claims for lost, damaged, or delayed cargo."
    cta="File a claim"
    :icon="Wrench"
  />
</template>
