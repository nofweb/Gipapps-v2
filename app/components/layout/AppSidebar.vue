<script setup lang="ts">
import { ChevronRight, ChevronDown, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '~/stores/products'
import { SIDEBAR_BY_PRODUCT, type SidebarItem, type SidebarChild } from '~/utils/sidebar'
import { findProduct } from '~/utils/products'

defineProps<{ mobileOpen: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const products = useProductsStore()
const { activeProduct } = storeToRefs(products)
const route = useRoute()

const sections = computed(() => SIDEBAR_BY_PRODUCT[activeProduct.value])
const product = computed(() => findProduct(activeProduct.value)!)

function childContainsActive(child: SidebarChild): boolean {
  if (child.to && route.path.startsWith(child.to)) return true
  return child.children?.some(c => childContainsActive(c)) ?? false
}

function isItemActive(item: SidebarItem): boolean {
  if (item.to) return route.path === item.to
  if (item.children?.length) {
    return item.children.some(c => childContainsActive(c))
  }
  return !!item.active
}

const openGroups = ref<Set<string>>(new Set())

function autoExpandChildren(parentKey: string, children: SidebarChild[] | undefined) {
  if (!children?.length) return
  for (const child of children) {
    const key = `${parentKey} > ${child.label}`
    if (child.children?.length) {
      const containsActive = child.children.some(c => childContainsActive(c))
      if (containsActive || child.defaultOpen) openGroups.value.add(key)
      autoExpandChildren(key, child.children)
    }
  }
}

watchEffect(() => {
  for (const section of sections.value) {
    for (const item of section.items) {
      if (item.children?.length) {
        const containsActive = item.children.some(c => childContainsActive(c))
        if (containsActive || item.defaultOpen) openGroups.value.add(item.label)
        autoExpandChildren(item.label, item.children)
      }
    }
  }
})

function toggleGroup(label: string) {
  if (openGroups.value.has(label)) openGroups.value.delete(label)
  else openGroups.value.add(label)
}
</script>

<template>
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-secondary-900/40 backdrop-blur-sm lg:hidden"
    @click="$emit('close')"
  />

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-secondary-100 bg-background transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div class="flex h-16 shrink-0 items-center justify-between border-b border-secondary-100 px-4">
      <LayoutLogo />
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 lg:hidden cursor-pointer"
        aria-label="Close sidebar"
        @click="$emit('close')"
      >
        <X class="size-5" />
      </button>
    </div>

    <div class="px-4 pt-5">
      <div :class="['flex items-center gap-3 rounded-2xl border border-secondary-100 bg-gradient-to-br p-3 dark:from-secondary-100 dark:to-secondary-50 dark:bg-none', product.accent]">
        <div :class="['flex size-10 items-center justify-center rounded-xl', product.iconBg]">
          <component :is="product.icon" :class="['size-5', product.iconColor]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Active product</p>
          <p class="truncate text-sm font-bold text-secondary-900">{{ product.shortName }}</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-5">
      <div
        v-for="(section, idx) in sections"
        :key="idx"
        :class="[idx > 0 && 'mt-6']"
      >
        <p
          v-if="section.heading"
          class="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-secondary-400"
        >
          {{ section.heading }}
        </p>
        <ul class="space-y-1">
          <li v-for="item in section.items" :key="item.label">
            <!-- Top-level group with children -->
            <template v-if="item.children?.length">
              <button
                type="button"
                :aria-expanded="openGroups.has(item.label)"
                :class="[
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                  isItemActive(item)
                    ? 'bg-primary-50 text-primary-900'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
                ]"
                @click="toggleGroup(item.label)"
              >
                <component
                  :is="item.icon"
                  :class="[
                    'size-5 shrink-0',
                    isItemActive(item) ? 'text-primary-700' : 'text-secondary-400 group-hover:text-secondary-600',
                  ]"
                />
                <span class="flex-1 text-left">{{ item.label }}</span>
                <ChevronDown
                  :class="[
                    'size-4 shrink-0 transition-transform duration-200',
                    openGroups.has(item.label) ? 'rotate-0' : '-rotate-90',
                    isItemActive(item) ? 'text-primary-700' : 'text-secondary-400',
                  ]"
                />
              </button>

              <ul
                v-show="openGroups.has(item.label)"
                class="ml-4 mt-1 space-y-1 border-l border-secondary-100 pl-3"
              >
                <li v-for="child in item.children" :key="child.label">
                  <!-- Nested group (2nd level) -->
                  <template v-if="child.children?.length">
                    <button
                      type="button"
                      :aria-expanded="openGroups.has(`${item.label} > ${child.label}`)"
                      :class="[
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                        childContainsActive(child)
                          ? 'bg-primary-50 text-primary-900'
                          : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
                      ]"
                      @click="toggleGroup(`${item.label} > ${child.label}`)"
                    >
                      <span class="flex-1 text-left">{{ child.label }}</span>
                      <ChevronDown
                        :class="[
                          'size-3.5 shrink-0 transition-transform duration-200',
                          openGroups.has(`${item.label} > ${child.label}`) ? 'rotate-0' : '-rotate-90',
                          childContainsActive(child) ? 'text-primary-700' : 'text-secondary-400',
                        ]"
                      />
                    </button>

                    <ul
                      v-show="openGroups.has(`${item.label} > ${child.label}`)"
                      class="ml-3 mt-1 space-y-1 border-l border-secondary-100 pl-3"
                    >
                      <li v-for="grand in child.children" :key="grand.label">
                        <NuxtLink
                          v-if="grand.to"
                          :to="grand.to"
                          :class="[
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
                            route.path === grand.to
                              ? 'bg-primary-50 text-primary-900 font-semibold'
                              : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
                          ]"
                        >
                          <span class="flex-1">{{ grand.label }}</span>
                          <span
                            v-if="grand.badge !== undefined"
                            class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-100 px-1.5 text-[10px] font-semibold text-secondary-700"
                          >
                            {{ grand.badge }}
                          </span>
                        </NuxtLink>
                      </li>
                    </ul>
                  </template>

                  <!-- Plain leaf link -->
                  <NuxtLink
                    v-else-if="child.to"
                    :to="child.to"
                    :class="[
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      route.path === child.to
                        ? 'bg-primary-50 text-primary-900 font-semibold'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
                    ]"
                  >
                    <span class="flex-1">{{ child.label }}</span>
                    <span
                      v-if="child.badge !== undefined"
                      class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-100 px-1.5 text-[10px] font-semibold text-secondary-700"
                    >
                      {{ child.badge }}
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </template>

            <!-- Plain item — link variant -->
            <NuxtLink
              v-else-if="item.to"
              :to="item.to"
              :class="[
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                isItemActive(item)
                  ? 'bg-primary-50 text-primary-900'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  'size-5 shrink-0',
                  isItemActive(item) ? 'text-primary-700' : 'text-secondary-400 group-hover:text-secondary-600',
                ]"
              />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <span
                v-if="item.badge !== undefined"
                :class="[
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
                  isItemActive(item) ? 'bg-primary text-primary-foreground' : 'bg-secondary-100 text-secondary-700',
                ]"
              >
                {{ item.badge }}
              </span>
              <ChevronRight
                v-else-if="isItemActive(item)"
                class="size-4 text-primary-700"
              />
            </NuxtLink>

            <!-- Plain item — button variant (no route) -->
            <button
              v-else
              type="button"
              :class="[
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                isItemActive(item)
                  ? 'bg-primary-50 text-primary-900'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  'size-5 shrink-0',
                  isItemActive(item) ? 'text-primary-700' : 'text-secondary-400 group-hover:text-secondary-600',
                ]"
              />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <span
                v-if="item.badge !== undefined"
                :class="[
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
                  isItemActive(item) ? 'bg-primary text-primary-foreground' : 'bg-secondary-100 text-secondary-700',
                ]"
              >
                {{ item.badge }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <div class="shrink-0 border-t border-secondary-100 p-4">
      <div class="rounded-2xl bg-gradient-hero p-4 text-white">
        <p class="text-xs font-semibold uppercase tracking-widest text-primary">Need help?</p>
        <p class="mt-1 text-sm font-semibold leading-snug">
          Talk to our customer experience team.
        </p>
        <a
          href="mailto:customerexperience@guineainsurance.com"
          class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-300"
        >
          Contact support
          <ChevronRight class="size-3.5" />
        </a>
      </div>
    </div>
  </aside>
</template>
