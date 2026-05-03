<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  modelValue?: string | number
  defaultValue?: string | number
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn(
      'flex h-11 w-full rounded-xl border border-secondary-200 bg-white px-4 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  >
</template>
