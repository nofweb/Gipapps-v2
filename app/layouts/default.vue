<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProductsStore } from '~/stores/products'
import type { ProductId } from '~/types/product'

const products = useProductsStore()
const { activeProduct } = storeToRefs(products)
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(false)

/** Keep the active product in sync with the URL prefix. */
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/motor')) products.selectProduct('motor')
    else if (path.startsWith('/homeshield')) products.selectProduct('homeshield')
    else if (path.startsWith('/marine')) products.selectProduct('marine')
    // Close the mobile drawer once navigation completes.
    sidebarOpen.value = false
  },
  { immediate: true },
)

async function handleSelectProduct(id: ProductId) {
  products.selectProduct(id)
  sidebarOpen.value = false
  await router.push(`/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-secondary-50 text-foreground">
    <div class="flex">
      <LayoutAppSidebar
        :mobile-open="sidebarOpen"
        @close="sidebarOpen = false"
      />

      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
        <LayoutAppHeader
          :active-product="activeProduct"
          @select-product="handleSelectProduct"
          @open-sidebar="sidebarOpen = true"
        />

        <main class="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div class="mx-auto max-w-screen-2xl">
            <slot />
          </div>
        </main>
      </div>
    </div>

    <UiSonnerSonner />
  </div>
</template>
