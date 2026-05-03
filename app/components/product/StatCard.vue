<script setup lang="ts">
import { TrendingUp, TrendingDown } from 'lucide-vue-next'
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  icon: Component
  iconBg?: string
  iconColor?: string
}>()
</script>

<template>
  <div class="card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
    <div class="flex items-start justify-between">
      <div :class="['flex size-11 items-center justify-center rounded-xl', iconBg ?? 'bg-primary-50']">
        <component :is="icon" :class="['size-5', iconColor ?? 'text-primary-700']" />
      </div>
      <span
        v-if="delta"
        :class="[
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
          trend === 'down' ? 'bg-tertiary-50 text-tertiary-600' : 'bg-primary-50 text-primary-700',
        ]"
      >
        <component :is="trend === 'down' ? TrendingDown : TrendingUp" class="size-3" />
        {{ delta }}
      </span>
    </div>
    <p class="mt-4 text-xs font-medium uppercase tracking-wider text-secondary-500">{{ label }}</p>
    <p class="mt-1 text-2xl font-bold text-secondary-900">{{ value }}</p>
  </div>
</template>
