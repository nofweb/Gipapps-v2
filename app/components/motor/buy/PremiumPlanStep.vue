<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  X,
} from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMotorApplicationStore } from '~/stores/motor/application'
import { PREMIUM_TYPE_DESCRIPTIONS } from '~/utils/motor-constants'
import type { MotorPremiumQuote, MotorPremiumType } from '~/types/motor'
import { formatNaira } from '~/utils/format'

const app = useMotorApplicationStore()
const { premiumType, carValue, variantMeta } = storeToRefs(app)

interface PlanOption {
  value: MotorPremiumType
  title: string
  copy: string
  icon: typeof Calendar
}

const allOptions: PlanOption[] = [
  { value: 'ANNUAL', title: 'Annually', copy: PREMIUM_TYPE_DESCRIPTIONS.ANNUAL, icon: Calendar },
  { value: 'HALF_YEARLY', title: 'Half-Yearly', copy: PREMIUM_TYPE_DESCRIPTIONS.HALF_YEARLY, icon: CalendarDays },
  { value: 'QUARTERLY', title: 'Quarterly', copy: PREMIUM_TYPE_DESCRIPTIONS.QUARTERLY, icon: CalendarRange },
]

const options = computed<PlanOption[]>(() => {
  const allowed = variantMeta.value?.allowedPlans ?? ['ANNUAL']
  return allOptions.filter(o => allowed.includes(o.value))
})

const quotes = reactive<Partial<Record<MotorPremiumType, MotorPremiumQuote>>>({})
const loadingPlan = ref<MotorPremiumType | null>(null)
const error = ref<string | null>(null)

// Half-yearly & quarterly are instalment plans — claims are not admissible
// until the full premium is paid, so the customer must accept a disclaimer first.
const INSTALMENT_PLANS: MotorPremiumType[] = ['HALF_YEARLY', 'QUARTERLY']
const disclaimerOpen = ref(false)
const pendingPlan = ref<MotorPremiumType | null>(null)

function handleSelect(plan: MotorPremiumType) {
  if (INSTALMENT_PLANS.includes(plan)) {
    pendingPlan.value = plan
    disclaimerOpen.value = true
    return
  }
  void selectPlan(plan)
}

function acceptDisclaimer() {
  disclaimerOpen.value = false
  if (pendingPlan.value) {
    void selectPlan(pendingPlan.value)
    pendingPlan.value = null
  }
}

function declineDisclaimer() {
  disclaimerOpen.value = false
  pendingPlan.value = null
}

async function selectPlan(plan: MotorPremiumType) {
  error.value = null
  if (!carValue.value || carValue.value <= 0) {
    error.value = 'Please enter a valid car value on the previous step.'
    return
  }
  if (!quotes[plan]) {
    loadingPlan.value = plan
    try {
      const quote = await app.fetchComprehensivePremium(plan)
      quotes[plan] = quote
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : "Couldn't calculate the premium for this plan."
      toast.error(error.value)
      loadingPlan.value = null
      return
    }
    finally {
      loadingPlan.value = null
    }
  }
  else {
    // Already cached — re-apply selection.
    app.$patch({ premiumType: plan, premiumQuote: quotes[plan] })
  }
}

onMounted(() => {
  if (premiumType.value) {
    void selectPlan(premiumType.value)
  }
})

const annualPremium = computed(() => app.premiumQuote?.annual_premium ?? 0)

function proceed() {
  if (!premiumType.value || !app.premiumQuote) {
    error.value = 'Pick a payment plan to continue.'
    return
  }
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Choose your payment plan</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Select a plan to calculate the amount due now.
      </p>
    </header>

    <p v-if="annualPremium" class="text-sm text-secondary-600">
      Annual premium for your car value:
      <strong class="text-secondary-900">{{ formatNaira(annualPremium) }}</strong>
    </p>

    <div
      v-if="error"
      class="flex items-start gap-3 rounded-2xl border border-tertiary-200 bg-tertiary-50 p-4"
    >
      <AlertTriangle class="size-5 shrink-0 text-tertiary-500" />
      <p class="text-sm font-medium text-tertiary-700">{{ error }}</p>
    </div>

    <ul
      :class="[
        'grid gap-4 sm:grid-cols-2',
        options.length >= 3 ? 'lg:grid-cols-3' : '',
      ]"
    >
      <li v-for="opt in options" :key="opt.value">
        <button
          type="button"
          :aria-pressed="premiumType === opt.value"
          :disabled="loadingPlan !== null"
          :class="[
            'flex h-full w-full flex-col rounded-2xl border-2 p-5 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
            premiumType === opt.value
              ? 'border-primary bg-primary-50 shadow-glow-primary'
              : 'border-secondary-100 bg-card hover:border-primary-200 hover:bg-primary-50/40',
          ]"
          @click="handleSelect(opt.value)"
        >
          <div class="flex items-start justify-between gap-3">
            <div
              :class="[
                'flex size-11 items-center justify-center rounded-xl',
                premiumType === opt.value ? 'bg-primary text-primary-foreground' : 'bg-secondary-100 text-secondary-700',
              ]"
            >
              <component :is="opt.icon" class="size-5" />
            </div>
            <CheckCircle2
              v-if="premiumType === opt.value"
              class="size-5 text-primary-700"
              aria-hidden="true"
            />
          </div>

          <p class="mt-4 text-base font-bold text-secondary-900">{{ opt.title }}</p>
          <p class="mt-1 text-xs text-secondary-500 flex-1">{{ opt.copy }}</p>

          <div class="mt-4 border-t border-secondary-100 pt-4">
            <p class="text-[11px] uppercase tracking-wider text-secondary-500 font-semibold">Amount due now</p>
            <p class="mt-0.5 inline-flex items-center gap-2 text-xl font-bold text-secondary-900 tabular-nums min-h-7">
              <Loader2 v-if="loadingPlan === opt.value" class="size-4 animate-spin" />
              <template v-else-if="quotes[opt.value]">{{ formatNaira(quotes[opt.value]!.premium) }}</template>
              <span v-else class="text-sm font-medium text-secondary-400">Select to calculate</span>
            </p>
            <p v-if="quotes[opt.value]" class="text-[11px] text-secondary-500 mt-1">
              Cover period: {{ quotes[opt.value]?.cover_days }} days
            </p>
          </div>
        </button>
      </li>
    </ul>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" :disabled="!premiumType || !app.premiumQuote" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>

    <DialogRoot v-model:open="disclaimerOpen">
      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-50 bg-secondary-900/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-secondary-100 bg-card shadow-2xl focus:outline-none data-[state=open]:animate-scale-in"
          @escape-key-down="declineDisclaimer"
          @pointer-down-outside="declineDisclaimer"
        >
          <div class="relative overflow-hidden bg-gradient-to-br from-warning/20 to-warning/5 px-6 pt-6 pb-5">
            <div class="absolute -right-10 -top-10 size-32 rounded-full bg-card/40 blur-3xl" aria-hidden="true" />
            <div class="relative flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-2xl bg-warning text-white shadow-lg">
                <ShieldAlert class="size-6" />
              </div>
              <div class="min-w-0">
                <DialogTitle class="text-lg font-bold leading-tight text-secondary-900">
                  Instalment payment notice
                </DialogTitle>
                <DialogDescription class="mt-0.5 text-xs text-secondary-600">
                  Please read and accept before continuing.
                </DialogDescription>
              </div>
            </div>
            <DialogClose
              class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-xl text-secondary-500 hover:bg-card/60 hover:text-secondary-800 cursor-pointer"
              aria-label="Close"
              @click="declineDisclaimer"
            >
              <X class="size-4" />
            </DialogClose>
          </div>

          <div class="space-y-4 px-6 py-5">
            <p class="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-secondary-800">
              Claims shall not be admissible until the full premium has been paid, in
              accordance with the Company's underwriting requirements.
            </p>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="btn-ghost border border-secondary-100"
                @click="declineDisclaimer"
              >
                Cancel
              </button>
              <button type="button" class="btn-primary" @click="acceptDisclaimer">
                <CheckCircle2 class="size-4" /> I understand & accept
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
