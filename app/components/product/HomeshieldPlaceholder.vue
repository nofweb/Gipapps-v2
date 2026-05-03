<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { Component } from 'vue'

defineProps<{
  title: string
  subtitle: string
  icon: Component
  cta?: string
}>()
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <component :is="icon" class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Homeshield
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">{{ title }}</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">{{ subtitle }}</p>
        </div>
      </div>
      <button v-if="cta" type="button" class="btn-primary">
        {{ cta }}
        <ChevronRight class="size-4" />
      </button>
    </div>

    <div class="card p-10 text-center">
      <p class="text-sm font-semibold text-secondary-700">This page is being built.</p>
      <p class="mx-auto mt-1 max-w-md text-sm text-secondary-500">
        The {{ title.toLowerCase() }} flow will live here.
      </p>
    </div>
  </div>
</template>
