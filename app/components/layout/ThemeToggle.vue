<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '~/stores/theme'

const theme = useThemeStore()
const { isDark } = storeToRefs(theme)
</script>

<template>
  <button
    type="button"
    class="relative flex size-10 items-center justify-center rounded-xl text-secondary-700 transition-colors hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :aria-pressed="isDark"
    @click="theme.toggle()"
  >
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 rotate-90 scale-75"
      leave-to-class="opacity-0 -rotate-90 scale-75"
      mode="out-in"
    >
      <Moon v-if="isDark" key="moon" class="size-5" />
      <Sun v-else key="sun" class="size-5" />
    </Transition>
  </button>
</template>
