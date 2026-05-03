<script setup lang="ts">
import { useProductsStore } from '~/stores/products'

definePageMeta({
  middleware: [
    'auth',
    defineNuxtRouteMiddleware(() => {
      const products = useProductsStore()
      return navigateTo(`/${products.activeProduct}`, { replace: true })
    }),
  ],
})
</script>

<template>
  <div />
</template>
