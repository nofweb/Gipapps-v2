<script setup lang="ts">
import { DropdownMenuLabel, type DropdownMenuLabelProps, useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '~/lib/utils'

const props = defineProps<
  DropdownMenuLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }
>()
const forwarded = useForwardProps(props)
</script>

<template>
  <DropdownMenuLabel
    v-bind="forwarded"
    :class="cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary-500', inset && 'pl-8', props.class)"
  >
    <slot />
  </DropdownMenuLabel>
</template>
