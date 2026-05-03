<script setup lang="ts">
import { ShieldCheck, RefreshCcw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'

definePageMeta({ layout: 'default', middleware: 'auth' })

const app = useHomeshieldApplicationStore()
const { step } = storeToRefs(app)

const STEPS = [
  { number: 1, label: 'Category' },
  { number: 2, label: 'Holder' },
  { number: 3, label: 'Owner' },
  { number: 4, label: 'Details' },
  { number: 5, label: 'Property' },
  { number: 6, label: 'Questionnaire' },
  { number: 7, label: 'Summary' },
  { number: 8, label: 'Payment' },
]
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <ShieldCheck class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Homeshield
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">Buy a policy</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            Cover a building, contents, or both — tailored for Nigerian homes.
          </p>
        </div>
      </div>
      <button
        type="button"
        class="btn-ghost border border-secondary-100 text-sm"
        @click="app.reset()"
      >
        <RefreshCcw class="size-4" /> Start over
      </button>
    </div>

    <!-- Step indicator -->
    <div class="card p-5">
      <HomeshieldBuyStepIndicator :current="step" :steps="STEPS" />
    </div>

    <!-- Active step -->
    <div class="card p-6 sm:p-8">
      <HomeshieldBuyCategoryStep v-if="step === 1" />
      <HomeshieldBuyHolderTypeStep v-else-if="step === 2" />
      <HomeshieldBuyOwnerTypeStep v-else-if="step === 3" />
      <HomeshieldBuyPersonalInfoStep v-else-if="step === 4" />
      <HomeshieldBuyPropertyStep v-else-if="step === 5" />
      <HomeshieldBuyQuestionnaireStep v-else-if="step === 6" />
      <HomeshieldBuySummaryStep v-else-if="step === 7" />
      <HomeshieldBuyPaymentStep v-else-if="step === 8" />
    </div>
  </div>
</template>
