<script setup lang="ts">
import { Home, Key, Check, ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore, type OwnerType } from '~/stores/homeshield/application'

const app = useHomeshieldApplicationStore()
const { ownerType } = storeToRefs(app)
const error = ref<string | null>(null)

function select(t: OwnerType) {
  app.setOwnerType(t)
  error.value = null
}

function proceed() {
  if (!ownerType.value) {
    error.value = 'Please choose an owner type'
    return
  }
  app.next()
}

const options = [
  { id: 'tenant' as const, label: 'Tenant', desc: 'You rent the property', icon: Key },
  { id: 'landlord' as const, label: 'Landlord', desc: 'You own the property', icon: Home },
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Are you the tenant or the landlord?</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Cover wording differs slightly between the two.
      </p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        :aria-pressed="ownerType === option.id"
        :class="[
          'group rounded-2xl border-2 p-6 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          ownerType === option.id
            ? 'border-primary bg-primary-50 shadow-glow-primary'
            : 'border-secondary-100 bg-card hover:border-primary-200 hover:bg-primary-50/40',
        ]"
        @click="select(option.id)"
      >
        <div class="flex items-start gap-4">
          <div
            :class="[
              'flex size-12 items-center justify-center rounded-xl',
              ownerType === option.id ? 'bg-primary text-primary-foreground' : 'bg-secondary-100 text-secondary-700',
            ]"
          >
            <component :is="option.icon" class="size-6" />
          </div>
          <div class="flex-1">
            <p class="text-base font-bold text-secondary-900">{{ option.label }}</p>
            <p class="mt-0.5 text-sm text-secondary-500">{{ option.desc }}</p>
          </div>
          <div
            :class="[
              'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              ownerType === option.id ? 'border-primary bg-primary' : 'border-secondary-200 bg-card',
            ]"
          >
            <Check v-if="ownerType === option.id" class="size-4 text-primary-foreground" />
          </div>
        </div>
      </button>
    </div>

    <p v-if="error" class="text-sm font-medium text-tertiary-500">{{ error }}</p>

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
