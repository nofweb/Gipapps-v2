<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { InsuranceProduct } from '~/types/product'

defineProps<{ product: InsuranceProduct; greeting?: string }>()
</script>

<template>
  <section
    :class="[
      'relative overflow-hidden rounded-3xl border border-secondary-100 bg-gradient-to-br p-6 sm:p-8 lg:p-10 animate-fade-in',
      product.accent,
      'dark:from-secondary-100 dark:to-secondary-50 dark:bg-none',
    ]"
  >
    <div class="absolute -right-16 -top-16 size-64 rounded-full bg-card/40 blur-3xl" aria-hidden="true" />
    <div class="absolute -bottom-20 -left-10 size-72 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl" aria-hidden="true" />

    <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div class="max-w-xl">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-card/80 px-3 py-1 backdrop-blur">
          <div :class="['flex size-7 items-center justify-center rounded-full', product.iconBg]">
            <component :is="product.icon" :class="['size-4', product.iconColor]" />
          </div>
          <span class="text-xs font-semibold uppercase tracking-wide text-secondary-700">
            {{ product.shortName }} Dashboard
          </span>
        </div>

        <h1 class="text-3xl font-bold leading-tight text-secondary-900 sm:text-4xl lg:text-5xl">
          {{ greeting || 'Welcome back' }} <span class="gradient-text">to {{ product.shortName }}.</span>
        </h1>
        <p class="mt-3 text-base leading-relaxed text-secondary-700">
          {{ product.description }}
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <button type="button" class="btn-primary">
            Buy a new policy
            <ArrowUpRight class="size-4" />
          </button>
          <button type="button" class="btn-outline">
            View my policies
          </button>
        </div>
      </div>

      <div class="hidden lg:block">
        <div :class="['flex size-40 items-center justify-center rounded-3xl shadow-xl', product.iconBg]">
          <component :is="product.icon" :class="['size-20', product.iconColor]" />
        </div>
      </div>
    </div>
  </section>
</template>
