<script setup lang="ts">
import { ShieldCheck, RefreshCcw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useMotorApplicationStore } from '~/stores/motor/application'
import { findMotorVariant, type MotorVariant } from '~/utils/motor-constants'

const props = defineProps<{ variant: MotorVariant }>()

const app = useMotorApplicationStore()
const { step, stepKeys } = storeToRefs(app)

const meta = computed(() => findMotorVariant(props.variant)!)

const STEP_LABELS: Record<string, string> = {
  class: 'Class',
  holder: 'Holder',
  details: 'Details',
  vehicle: 'Vehicle',
  plan: 'Plan',
  summary: 'Summary',
  payment: 'Payment',
}

const steps = computed(() =>
  stepKeys.value.map((key, idx) => ({
    number: idx + 1,
    label: STEP_LABELS[key] ?? key,
    key,
  })),
)

const currentStepKey = computed(() => stepKeys.value[step.value - 1] ?? null)

const familyLabel = computed(() =>
  meta.value.family === 'comprehensive' ? 'Comprehensive' : 'Third Party',
)

onMounted(() => {
  app.setVariant(props.variant)
})

watch(
  () => props.variant,
  (v) => {
    app.setVariant(v)
  },
)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-primary-100">
          <ShieldCheck class="size-6 text-primary-700" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Motor · {{ familyLabel }} · {{ meta.shortName }}
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">Buy a policy</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            {{ meta.description }}
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
      <MotorBuyStepIndicator :current="step" :steps="steps" />
    </div>

    <!-- Active step -->
    <div class="card p-6 sm:p-8">
      <MotorBuyInsuranceClassStep v-if="currentStepKey === 'class'" />
      <MotorBuyHolderTypeStep v-else-if="currentStepKey === 'holder'" />
      <MotorBuyPersonalInfoStep v-else-if="currentStepKey === 'details'" />
      <MotorBuyVehicleDetailsStep v-else-if="currentStepKey === 'vehicle'" />
      <MotorBuyPremiumPlanStep v-else-if="currentStepKey === 'plan'" />
      <MotorBuySummaryStep v-else-if="currentStepKey === 'summary'" />
      <MotorBuyPaymentStep v-else-if="currentStepKey === 'payment'" />
    </div>
  </div>
</template>
