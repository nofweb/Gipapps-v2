<script setup lang="ts">
import { Check, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { HOMESHIELD_CATEGORIES, type HomeshieldCategoryId } from '~/utils/homeshield-constants'
import { formatNaira } from '~/utils/format'

const app = useHomeshieldApplicationStore()
const { category } = storeToRefs(app)

const error = ref<string | null>(null)

function select(id: HomeshieldCategoryId) {
  app.setCategory(id)
  error.value = null
}

function proceed() {
  if (!category.value) {
    error.value = 'Please choose a category to continue'
    return
  }
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Choose your cover category</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Pick the category that matches the value of the property you want to insure.
      </p>
    </header>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <button
        v-for="cat in HOMESHIELD_CATEGORIES"
        :key="cat.id"
        type="button"
        :aria-pressed="category === cat.id"
        :class="[
          'group rounded-2xl border-2 p-6 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          category === cat.id
            ? 'border-primary bg-primary-50 shadow-glow-primary'
            : 'border-secondary-100 bg-card hover:border-primary-200 hover:bg-primary-50/40',
        ]"
        @click="select(cat.id)"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">{{ cat.label }}</p>
            <p class="mt-1 text-lg font-bold text-secondary-900">{{ cat.rangeLabel }}</p>
          </div>
          <div
            :class="[
              'flex size-7 items-center justify-center rounded-full border-2 transition-colors',
              category === cat.id ? 'border-primary bg-primary' : 'border-secondary-200 bg-card',
            ]"
          >
            <Check v-if="category === cat.id" class="size-4 text-primary-foreground" />
          </div>
        </div>

        <p class="mt-4 text-sm font-semibold text-secondary-700">
          Premium · <span class="text-secondary-900">{{ formatNaira(cat.premium) }}</span>
        </p>

        <ul class="mt-4 space-y-2">
          <li
            v-for="benefit in cat.benefits"
            :key="benefit"
            class="flex items-start gap-2 text-xs text-secondary-600"
          >
            <Check class="size-3.5 mt-0.5 shrink-0 text-primary-600" />
            <span>{{ benefit }}</span>
          </li>
        </ul>
      </button>
    </div>

    <p v-if="error" class="text-sm font-medium text-tertiary-500">{{ error }}</p>

    <div class="flex justify-end">
      <button type="button" class="btn-primary" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
