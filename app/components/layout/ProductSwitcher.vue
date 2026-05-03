<script setup lang="ts">
import { LayoutGrid, Sparkles } from 'lucide-vue-next'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import { PRODUCTS } from '~/utils/products'
import type { ProductId } from '~/types/product'

const props = defineProps<{ activeProduct: ProductId }>()
const emit = defineEmits<{ (e: 'select', id: ProductId): void }>()

const open = ref(false)

function handleSelect(id: ProductId, available: boolean) {
  if (!available) return
  emit('select', id)
  open.value = false
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      class="group flex size-10 items-center justify-center rounded-xl text-secondary-700 transition-colors hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer data-[state=open]:bg-primary-50 data-[state=open]:text-primary-700"
      aria-label="Switch product"
    >
      <LayoutGrid class="size-5 transition-transform group-data-[state=open]:rotate-90" />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side-offset="12"
        align="end"
        class="z-50 w-[22rem] rounded-2xl border border-secondary-100 bg-popover p-3 shadow-xl data-[state=open]:animate-scale-in"
      >
        <div class="mb-3 flex items-center justify-between px-2 pt-1">
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Insurance Products
          </p>
          <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
            <Sparkles class="size-3" />
            More soon
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="product in PRODUCTS"
            :key="product.id"
            type="button"
            :disabled="!product.available"
            :aria-current="product.id === props.activeProduct ? 'true' : undefined"
            class="group relative flex flex-col items-center justify-center gap-2 rounded-xl border border-transparent p-4 text-center transition-all hover:bg-primary-50 hover:border-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer aria-[current=true]:bg-primary-50 aria-[current=true]:border-primary-200"
            @click="handleSelect(product.id, product.available)"
          >
            <div
              :class="[
                'flex size-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                product.iconBg,
              ]"
            >
              <component :is="product.icon" :class="['size-6', product.iconColor]" />
            </div>
            <span class="text-[11px] font-semibold leading-tight text-secondary-800">
              {{ product.shortName }}
            </span>
            <span
              v-if="product.id === props.activeProduct"
              class="absolute right-2 top-2 size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
          </button>
        </div>

        <div class="mt-3 rounded-xl bg-secondary-50 p-3">
          <p class="text-xs leading-relaxed text-secondary-600">
            Switch between your active products. Additional cover types will appear here as we roll them out.
          </p>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
