<script setup lang="ts">
import { User, Building2, Check, ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore, type HolderType } from '~/stores/homeshield/application'

const app = useHomeshieldApplicationStore()
const { holderType } = storeToRefs(app)
const error = ref<string | null>(null)

function select(t: HolderType) {
  app.setHolderType(t)
  error.value = null
}

function proceed() {
  if (!holderType.value) {
    error.value = 'Please choose a holder type'
    return
  }
  app.next()
}

const options = [
  { id: 'individual' as const, label: 'Individual', desc: 'Buying as a personal applicant', icon: User },
  { id: 'corporate' as const, label: 'Corporate', desc: 'Buying on behalf of a company', icon: Building2 },
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Who is taking out the policy?</h2>
      <p class="mt-1 text-sm text-secondary-500">
        We'll tailor the next steps based on your answer.
      </p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        :aria-pressed="holderType === option.id"
        :class="[
          'group rounded-2xl border-2 p-6 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          holderType === option.id
            ? 'border-primary bg-primary-50 shadow-glow-primary'
            : 'border-secondary-100 bg-card hover:border-primary-200 hover:bg-primary-50/40',
        ]"
        @click="select(option.id)"
      >
        <div class="flex items-start gap-4">
          <div
            :class="[
              'flex size-12 items-center justify-center rounded-xl',
              holderType === option.id ? 'bg-primary text-primary-foreground' : 'bg-secondary-100 text-secondary-700',
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
              holderType === option.id ? 'border-primary bg-primary' : 'border-secondary-200 bg-card',
            ]"
          >
            <Check v-if="holderType === option.id" class="size-4 text-primary-foreground" />
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
