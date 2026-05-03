<script setup lang="ts">
import { Bell, Search, Menu } from 'lucide-vue-next'
import type { ProductId } from '~/types/product'

defineProps<{ activeProduct: ProductId }>()
defineEmits<{
  (e: 'select-product', id: ProductId): void
  (e: 'open-sidebar'): void
}>()
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-secondary-100 bg-background/80 backdrop-blur-xl">
    <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-xl text-secondary-700 hover:bg-secondary-100 lg:hidden cursor-pointer"
        aria-label="Open sidebar"
        @click="$emit('open-sidebar')"
      >
        <Menu class="size-5" />
      </button>

      <div class="hidden flex-1 max-w-xl md:block">
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="search"
            placeholder="Search policies, claims, products…"
            class="h-10 w-full rounded-full border border-secondary-100 bg-secondary-50 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-secondary-400 transition focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
        </div>
      </div>

      <div class="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          class="relative flex size-10 items-center justify-center rounded-xl text-secondary-700 transition-colors hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          aria-label="Notifications"
        >
          <Bell class="size-5" />
          <span class="absolute right-2 top-2 size-2 rounded-full bg-tertiary dark:bg-tertiary/80 ring-2 ring-background" />
        </button>

        <LayoutThemeToggle />

        <LayoutProductSwitcher
          :active-product="activeProduct"
          @select="(id) => $emit('select-product', id)"
        />

        <div class="mx-1 hidden h-6 w-px bg-secondary-100 sm:block" />

        <LayoutUserMenu />
      </div>
    </div>
  </header>
</template>
