<script setup lang="ts">
import { ArrowLeft, ArrowRight, Home, Building, Check } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { findCategory, PROPERTY_KINDS } from '~/utils/homeshield-constants'
import { formatNaira } from '~/utils/format'

const app = useHomeshieldApplicationStore()
const {
  category,
  propertyAddress,
  valueOfProperty,
  propertyType,
  propertyKind,
} = storeToRefs(app)

const errors = ref<Record<string, string>>({})

const categoryMeta = computed(() => findCategory(category.value))

// Display value as a formatted string while keeping numeric value in store.
const displayValue = ref('')
watchEffect(() => {
  if (valueOfProperty.value === null || valueOfProperty.value === undefined) {
    displayValue.value = ''
  }
  else {
    displayValue.value = Number(valueOfProperty.value).toLocaleString('en-NG')
  }
})

function onValueInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  if (!raw) {
    valueOfProperty.value = null
    displayValue.value = ''
    return
  }
  const n = Number(raw)
  valueOfProperty.value = n
  displayValue.value = n.toLocaleString('en-NG')
}

function validate() {
  const e: Record<string, string> = {}
  if (!propertyAddress.value.trim()) e.propertyAddress = 'Property address is required'
  if (valueOfProperty.value === null || valueOfProperty.value <= 0) {
    e.valueOfProperty = 'Enter the property value'
  }
  else if (categoryMeta.value) {
    if (valueOfProperty.value < categoryMeta.value.minValue || valueOfProperty.value > categoryMeta.value.maxValue) {
      e.valueOfProperty = `${categoryMeta.value.label} requires a value between ${formatNaira(categoryMeta.value.minValue)} and ${formatNaira(categoryMeta.value.maxValue)}`
    }
  }
  if (!propertyType.value) e.propertyType = 'Choose a property type'
  if (!propertyKind.value) e.propertyKind = 'Choose a property kind'
  errors.value = e
  return Object.keys(e).length === 0
}

function proceed() {
  if (!validate()) return
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Property details</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Tell us about the property being insured.
      </p>
    </header>

    <div class="space-y-4">
      <div>
        <label class="input-label">Value of property (₦)</label>
        <div class="relative">
          <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary-500">₦</span>
          <input
            type="text"
            inputmode="numeric"
            class="input-field pl-9"
            placeholder="20,000,000"
            :value="displayValue"
            @input="onValueInput"
          >
        </div>
        <p v-if="errors.valueOfProperty" class="mt-1 text-xs text-tertiary-500">{{ errors.valueOfProperty }}</p>
        <p v-else-if="categoryMeta" class="mt-1 text-xs text-secondary-500">
          {{ categoryMeta.label }}: {{ categoryMeta.rangeLabel }}
        </p>
      </div>

      <div>
        <label class="input-label" for="propertyAddress">Property address</label>
        <textarea
          id="propertyAddress"
          v-model="propertyAddress"
          rows="2"
          class="input-field"
          placeholder="15 Chevron Drive, Lekki, Lagos"
        />
        <p v-if="errors.propertyAddress" class="mt-1 text-xs text-tertiary-500">{{ errors.propertyAddress }}</p>
      </div>

      <div>
        <p class="input-label">Property type</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="opt in [
              { id: 'residential', label: 'Residential', icon: Home },
              { id: 'commercial', label: 'Commercial', icon: Building },
            ]"
            :key="opt.id"
            type="button"
            :aria-pressed="propertyType === opt.id"
            :class="[
              'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all cursor-pointer',
              propertyType === opt.id
                ? 'border-primary bg-primary-50'
                : 'border-secondary-100 bg-card hover:border-primary-200',
            ]"
            @click="propertyType = opt.id as 'residential' | 'commercial'"
          >
            <component :is="opt.icon" :class="['size-5', propertyType === opt.id ? 'text-primary-700' : 'text-secondary-500']" />
            <span :class="['flex-1 text-sm font-semibold', propertyType === opt.id ? 'text-secondary-900' : 'text-secondary-700']">
              {{ opt.label }}
            </span>
            <Check v-if="propertyType === opt.id" class="size-4 text-primary-700" />
          </button>
        </div>
        <p v-if="errors.propertyType" class="mt-1 text-xs text-tertiary-500">{{ errors.propertyType }}</p>
      </div>

      <div>
        <p class="input-label">Property kind</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="kind in PROPERTY_KINDS"
            :key="kind"
            type="button"
            :aria-pressed="propertyKind === kind"
            :class="[
              'rounded-full border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer',
              propertyKind === kind
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-secondary-100 bg-card text-secondary-700 hover:border-primary-200',
            ]"
            @click="propertyKind = kind"
          >
            {{ kind }}
          </button>
        </div>
        <p v-if="errors.propertyKind" class="mt-1 text-xs text-tertiary-500">{{ errors.propertyKind }}</p>
      </div>
    </div>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
