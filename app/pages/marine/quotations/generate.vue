<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Quote, RefreshCcw, ArrowLeft } from 'lucide-vue-next'
import { useMarineQuotationStore } from '~/stores/marine/quotation'

definePageMeta({ layout: 'default', middleware: 'auth' })

const app = useMarineQuotationStore()
const { step, stepKeys, currentStepKey } = storeToRefs(app)

// Load cover types & rate options up front.
await app.loadLookups()

const STEP_LABELS: Record<string, string> = {
  policy: 'Policy',
  contact: 'Contact',
  shipment: 'Shipment',
  valuation: 'Valuation',
  documents: 'Documents',
  summary: 'Summary',
}

const steps = computed(() =>
  stepKeys.value.map((key, idx) => ({
    number: idx + 1,
    label: STEP_LABELS[key] ?? key,
    key,
  })),
)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Back link -->
    <NuxtLink
      to="/marine/quotations"
      class="inline-flex items-center gap-2 text-sm font-semibold text-secondary-600 hover:text-secondary-900"
    >
      <ArrowLeft class="size-4" /> Back to all quotations
    </NuxtLink>

    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <Quote class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">Marine</p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">Generate quotation</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            Get an instant marine cover quotation for a new shipment or voyage.
          </p>
        </div>
      </div>
      <button type="button" class="btn-ghost border border-secondary-100 text-sm" @click="app.reset()">
        <RefreshCcw class="size-4" /> Start over
      </button>
    </div>

    <!-- Step indicator -->
    <div class="card p-5">
      <MarineQuotationStepIndicator :current="step" :steps="steps" />
    </div>

    <!-- Active step -->
    <div class="card p-6 sm:p-8">
      <MarineQuotationPolicyStep v-if="currentStepKey === 'policy'" />
      <MarineQuotationContactStep v-else-if="currentStepKey === 'contact'" />
      <MarineQuotationShipmentStep v-else-if="currentStepKey === 'shipment'" />
      <MarineQuotationValuationStep v-else-if="currentStepKey === 'valuation'" />
      <MarineQuotationDocumentsStep v-else-if="currentStepKey === 'documents'" />
      <MarineQuotationSummaryStep v-else-if="currentStepKey === 'summary'" />
    </div>
  </div>
</template>
