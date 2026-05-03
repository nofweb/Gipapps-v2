<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '~/stores/theme'
import 'vue-sonner/style.css'

const theme = useThemeStore()
const { resolved } = storeToRefs(theme)
</script>

<template>
  <Toaster
    :theme="resolved"
    position="top-right"
    rich-colors
    close-button
    :toast-options="{
      style: {
        borderRadius: '1rem',
        fontFamily: 'var(--brand-font-sans)',
      },
    }"
  />
</template>
