<script setup lang="ts">
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMarineQuotationStore } from '~/stores/marine/quotation'
import { useMarineStore } from '~/stores/marine'
import { formatNaira } from '~/utils/format'

const app = useMarineQuotationStore()
const marine = useMarineStore()
const { cargo_currency, invoice_value, exchange_rate, basic_rate, premium } = storeToRefs(app)
const { premiumCalculating, premiumError, currencies, currenciesLoading } = storeToRefs(marine)

// Prefer the currencies fetched from /marine/currency; fall back to NGN/USD
// when the endpoint returns nothing.
const FALLBACK_CURRENCIES = [
  { value: 'NGN', name: 'NGN' },
  { value: 'USD', name: 'USD' },
]
const currencyOptions = computed(() =>
  currencies.value.length > 0 ? currencies.value : FALLBACK_CURRENCIES,
)

// Recalculate the premium whenever a factor changes (the store gates the call
// so it only fires once every required field is present).
watch(
  () => [invoice_value.value, basic_rate.value, cargo_currency.value, exchange_rate.value, app.cover_type],
  () => { app.recalcPremium() },
)

// Refresh on entry so the premium reflects selections made on earlier steps
// (e.g. cover type / currency) when all required inputs are already present.
onMounted(() => { app.recalcPremium() })

// Show the premium: sanitise (API may return "3520000.00") then format, with a
// raw fallback so a valid value is never hidden behind a dash.
const premiumDisplay = computed(() => {
  const p = premium.value
  if (p === '' || p === null || p === undefined) return ''
  const n = typeof p === 'number' ? p : Number(String(p).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? formatNaira(n) : String(p)
})

function proceed() {
  if (!cargo_currency.value) return toast.error('Cargo currency is required')
  if (!invoice_value.value) return toast.error('Invoice value is required')
  if (!exchange_rate.value) return toast.error('Exchange rate is required')
  if (!basic_rate.value) return toast.error('Basic rate is required')
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Valuation & premium</h2>
      <p class="mt-1 text-sm text-secondary-500">The premium is calculated automatically as you fill these in.</p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="input-label" for="cargo_currency">Cargo currency</label>
        <select id="cargo_currency" v-model="cargo_currency" class="input-field" :disabled="currenciesLoading">
          <option value="" disabled>{{ currenciesLoading ? 'Loading currencies…' : 'Select currency' }}</option>
          <option v-for="o in currencyOptions" :key="o.value" :value="o.value">{{ o.name }}</option>
        </select>
      </div>
      <div>
        <label class="input-label" for="invoice_value">Invoice value</label>
        <input id="invoice_value" v-model="invoice_value" type="number" class="input-field" placeholder="Invoice value">
      </div>
      <div>
        <label class="input-label" for="exchange_rate">Exchange rate</label>
        <input id="exchange_rate" v-model="exchange_rate" type="text" class="input-field" placeholder="Exchange rate">
      </div>
      <div>
        <label class="input-label" for="basic_rate">Basic rate</label>
        <input id="basic_rate" v-model="basic_rate" type="number" class="input-field" placeholder="Basic rate">
      </div>
      <div class="sm:col-span-2">
        <label class="input-label" for="premium">Premium</label>
        <div class="flex items-center gap-2">
          <input
            id="premium"
            :value="premiumDisplay"
            type="text"
            class="input-field bg-secondary-50 font-semibold"
            disabled
            placeholder="Calculated automatically"
          >
          <Loader2 v-if="premiumCalculating" class="size-4 shrink-0 animate-spin text-secondary-400" />
        </div>
        <p v-if="premiumError" class="mt-1 text-xs text-tertiary-500">{{ premiumError }}</p>
        <p v-else class="mt-1 text-xs text-secondary-500">
          Auto-calculated from invoice value, currency, cover type, exchange rate and basic rate.
        </p>
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
