<script setup lang="ts">
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Check,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { useMotorApplicationStore } from '~/stores/motor/application'
import { openPaystack } from '~/composables/usePaystack'
import { formatNaira } from '~/utils/format'
import { INSURANCE_CLASS_LABELS } from '~/utils/motor-constants'
import type { MotorPaymentMethod } from '~/types/motor'

const app = useMotorApplicationStore()
const {
  paymentMethod,
  email,
  family,
  variantMeta,
  insuranceClass,
  submitting,
  submitError,
} = storeToRefs(app)
const router = useRouter()

const localError = ref<string | null>(null)

const options = [
  {
    id: 'PAYSTACK' as const,
    label: 'Paystack',
    desc: 'Pay with card, bank, or USSD via Paystack inline.',
    icon: CreditCard,
  },
  {
    id: 'WALLET' as const,
    label: 'Wallet',
    desc: 'Charge directly from your Guinea Insurance wallet.',
    icon: Wallet,
  },
]

function select(m: MotorPaymentMethod) {
  paymentMethod.value = m
  localError.value = null
}

async function generateRef(): Promise<string> {
  try {
    const api = useApi()
    const { data } = await api.post<unknown>('/wallet/generate-transaction-reference')
    const extract = (body: unknown): string | null => {
      if (!body) return null
      if (typeof body === 'string') return body || null
      if (typeof body === 'object') {
        const o = body as Record<string, unknown>
        if (typeof o.reference === 'string' && o.reference) return o.reference
        if (typeof o.data === 'string' && o.data) return o.data
        if (o.data && typeof o.data === 'object') {
          const inner = o.data as Record<string, unknown>
          if (typeof inner.reference === 'string' && inner.reference) return inner.reference
        }
      }
      return null
    }
    const ref = extract(data)
    if (ref) return ref
  }
  catch {
    // Fall through to client-side fallback ref.
  }
  const stamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `GIP-MTR-${stamp}-${random}`
}

const familyLabel = computed(() => {
  const meta = variantMeta.value
  if (meta) return meta.shortName
  return family.value === 'comprehensive' ? 'Comprehensive' : 'Third Party'
})

async function pay() {
  localError.value = null
  if (!paymentMethod.value) {
    localError.value = 'Please choose a payment method'
    return
  }
  if (!app.amountDue || app.amountDue <= 0) {
    localError.value = 'Amount due must be greater than zero.'
    return
  }

  try {
    if (paymentMethod.value === 'PAYSTACK') {
      const reference = await generateRef()
      const resp = await openPaystack({
        email: email.value,
        amountInKobo: Math.round(app.amountDue * 100),
        reference,
      })
      const policy = await app.purchase(resp.reference)
      toast.success(`Policy created · ${policy.policy_number}`)
      app.reset()
      await router.push(`/motor/policy/${policy.id}`)
    }
    else {
      const policy = await app.purchase()
      toast.success(`Policy created · ${policy.policy_number}`)
      app.reset()
      await router.push(`/motor/policy/${policy.id}`)
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Payment failed'
    localError.value = message
    toast.error(message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Payment</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Choose how you'd like to pay your premium.
      </p>
    </header>

    <!-- Premium summary -->
    <div class="rounded-2xl border border-secondary-100 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-secondary-100 dark:to-secondary-50 dark:bg-none p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-600">
            {{ familyLabel }}
            <template v-if="insuranceClass"> · {{ INSURANCE_CLASS_LABELS[insuranceClass] }}</template>
          </p>
          <p class="mt-2 text-3xl font-bold text-secondary-900 tabular-nums">{{ formatNaira(app.amountDue) }}</p>
          <p class="mt-1 text-xs text-secondary-500">Amount due now</p>
        </div>
        <div class="flex items-center gap-2 text-sm font-semibold text-secondary-700">
          <ShieldCheck class="size-5 text-primary-700" /> Secured by Guinea Insurance
        </div>
      </div>
    </div>

    <!-- Payment method selector -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        :aria-pressed="paymentMethod === option.id"
        :disabled="submitting"
        :class="[
          'group rounded-2xl border-2 p-5 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
          paymentMethod === option.id
            ? 'border-primary bg-primary-50 shadow-glow-primary'
            : 'border-secondary-100 bg-card hover:border-primary-200 hover:bg-primary-50/40',
        ]"
        @click="select(option.id)"
      >
        <div class="flex items-start gap-3">
          <div
            :class="[
              'flex size-11 items-center justify-center rounded-xl',
              paymentMethod === option.id ? 'bg-primary text-primary-foreground' : 'bg-secondary-100 text-secondary-700',
            ]"
          >
            <component :is="option.icon" class="size-5" />
          </div>
          <div class="flex-1">
            <p class="text-base font-bold text-secondary-900">{{ option.label }}</p>
            <p class="mt-0.5 text-xs text-secondary-500">{{ option.desc }}</p>
          </div>
          <div
            :class="[
              'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              paymentMethod === option.id ? 'border-primary bg-primary' : 'border-secondary-200 bg-card',
            ]"
          >
            <Check v-if="paymentMethod === option.id" class="size-3.5 text-primary-foreground" />
          </div>
        </div>
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="localError || submitError"
      class="flex items-start gap-3 rounded-xl border border-tertiary-200 bg-tertiary-50 p-4"
    >
      <AlertTriangle class="size-5 shrink-0 text-tertiary-500" />
      <p class="text-sm font-medium text-tertiary-700">{{ localError || submitError }}</p>
    </div>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <button
        type="button"
        class="btn-ghost border border-secondary-100"
        :disabled="submitting"
        @click="app.prev()"
      >
        <ArrowLeft class="size-4" /> Back
      </button>
      <button
        type="button"
        class="btn-primary"
        :disabled="submitting || !paymentMethod"
        @click="pay"
      >
        <span
          v-if="submitting"
          class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
        {{
          submitting
            ? 'Processing…'
            : paymentMethod === 'WALLET'
              ? `Charge wallet · ${formatNaira(app.amountDue)}`
              : paymentMethod === 'PAYSTACK'
                ? `Pay with Paystack · ${formatNaira(app.amountDue)}`
                : `Pay ${formatNaira(app.amountDue)}`
        }}
      </button>
    </div>
  </div>
</template>
