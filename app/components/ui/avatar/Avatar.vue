<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
} as const
</script>

<template>
  <div
    :class="cn(
      'inline-flex items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-semibold select-none shadow-sm',
      sizeClasses[props.size],
      props.class,
    )"
  >
    {{ props.initials }}
  </div>
</template>
