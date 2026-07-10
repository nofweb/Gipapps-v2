<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Ship,
  Mail,
  Phone,
  MapPin,
  Wallet,
  Package,
  CalendarDays,
  CreditCard,
  Loader2,
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
import { useMarineStore } from '~/stores/marine'
import { formatNaira, formatDate } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const id = computed(() => Number(route.params.id))

const marine = useMarineStore()
const { quotationById, quotationDetailLoading, quotationDetailError, payingQuotation } = storeToRefs(marine)

const quotation = computed(() => quotationById.value[id.value])
const isPending = computed(() => (quotation.value?.status ?? '').toLowerCase() === 'pending')

await marine.fetchQuotation(id.value).catch(() => {})

async function refresh() {
  await marine.fetchQuotation(id.value).catch(() => {})
}

// Payment confirmation flow (mirrors old marine's confirm-before-pay dialog).
const payOpen = ref(false)

async function confirmPayment() {
  try {
    await marine.makeQuotationPayment(id.value)
    payOpen.value = false
    // Reflect the new status/certificate after a successful payment.
    await refresh()
  }
  catch {
    // Error toast is surfaced by the API response interceptor.
  }
}

function holderName() {
  const q = quotation.value
  if (!q) return '—'
  if (q.company_name) return q.company_name
  return [q.first_name, q.last_name].filter(Boolean).join(' ') || '—'
}

function statusClass(status: string) {
  const s = (status || '').toLowerCase()
  if (s === 'paid' || s === 'success') return 'bg-primary-50 text-primary-700'
  if (s === 'pending') return 'bg-warning/15 text-warning'
  if (s === 'expired' || s === 'failed' || s === 'declined')
    return 'bg-tertiary-50 text-tertiary-600'
  return 'bg-secondary-100 text-secondary-700'
}

// Old marine surfaces "Nature of cargo" from either broker_rate or rate condition.
const natureOfCargo = computed(() =>
  quotation.value?.broker_rate?.condition ?? quotation.value?.rate?.condition ?? null,
)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Top bar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink
        to="/marine/quotations"
        class="inline-flex items-center gap-2 text-sm font-semibold text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft class="size-4" />
        Back to all quotations
      </NuxtLink>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="quotationDetailLoading"
          @click="refresh"
        >
          <RefreshCw :class="['size-4', quotationDetailLoading && 'animate-spin']" />
          Refresh
        </button>
        <button
          v-if="quotation && isPending"
          type="button"
          class="btn-primary text-sm"
          :disabled="payingQuotation"
          @click="payOpen = true"
        >
          <CreditCard class="size-4" />
          Make payment
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="quotationDetailLoading && !quotation" class="card p-10 text-center">
      <div class="mx-auto size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p class="mt-3 text-sm text-secondary-500">Loading quotation…</p>
    </div>

    <!-- Error -->
    <div v-else-if="quotationDetailError && !quotation" class="card flex flex-col items-center gap-3 p-10 text-center">
      <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
        <AlertTriangle class="size-6 text-tertiary-500" />
      </div>
      <p class="text-sm font-semibold text-secondary-900">Couldn't load this quotation</p>
      <p class="max-w-md text-sm text-secondary-500">{{ quotationDetailError }}</p>
      <button type="button" class="btn-outline text-sm mt-2" @click="refresh">
        <RefreshCw class="size-4" /> Try again
      </button>
    </div>

    <!-- Detail -->
    <template v-else-if="quotation">
      <!-- Hero -->
      <section
        class="relative overflow-hidden rounded-3xl border border-secondary-100 bg-gradient-to-br from-tertiary-100 to-tertiary-50 dark:from-secondary-100 dark:to-secondary-50 dark:bg-none p-6 sm:p-8"
      >
        <div class="absolute -right-16 -top-16 size-64 rounded-full bg-card/40 blur-3xl" aria-hidden="true" />

        <div class="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
              Marine quotation
            </p>
            <h1 class="mt-2 text-2xl font-bold text-secondary-900 sm:text-3xl">
              {{ holderName() }}
            </h1>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize', statusClass(quotation.status ?? '')]">
                {{ quotation.status || '—' }}
              </span>
              <span v-if="quotation.policy_type" class="inline-flex rounded-full bg-card/80 border border-secondary-200 px-3 py-1 text-xs font-semibold text-secondary-700">
                {{ quotation.policy_type }}
              </span>
              <span v-if="quotation.cover_type" class="inline-flex rounded-full bg-card/80 border border-secondary-200 px-3 py-1 text-xs font-semibold text-secondary-700">
                {{ quotation.cover_type }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Premium</p>
              <p class="mt-1 text-lg font-bold text-secondary-900 tabular-nums">
                {{ formatNaira(quotation.premium) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Sum insured</p>
              <p class="mt-1 text-lg font-bold text-secondary-900 tabular-nums">
                {{ formatNaira(quotation.sum_insured) }}
              </p>
            </div>
            <div class="col-span-2 sm:col-span-1">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Created</p>
              <p class="mt-1 text-sm font-semibold text-secondary-900">
                {{ formatDate(quotation.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left column -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Consignment -->
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <Package class="size-5 text-tertiary-500" />
              <h2 class="text-base font-semibold text-secondary-900">Consignment</h2>
            </header>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Description of consignment</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ quotation.cargo_description || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Nature of cargo</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ natureOfCargo || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Bank name</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ quotation.bank_name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">TIN</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ quotation.tin || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Proforma invoice no.</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ quotation.proforma_invoice_number || '—' }}</dd>
              </div>
            </dl>
          </section>

          <!-- Contact -->
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <Ship class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Insured contact</h2>
            </header>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Name</dt>
                <dd class="mt-1 text-sm font-medium text-secondary-900">{{ holderName() }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Type</dt>
                <dd class="mt-1 text-sm text-secondary-900 capitalize">{{ quotation.holder_type || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Email</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-secondary-900">
                  <Mail class="size-4 text-secondary-400" />
                  <a v-if="quotation.email" :href="`mailto:${quotation.email}`" class="hover:underline">{{ quotation.email }}</a>
                  <span v-else>—</span>
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Phone</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-secondary-900">
                  <Phone class="size-4 text-secondary-400" />
                  <a v-if="quotation.phone_number" :href="`tel:${quotation.phone_number}`" class="hover:underline">{{ quotation.phone_number }}</a>
                  <span v-else>—</span>
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Contact address</dt>
                <dd class="mt-1 flex items-start gap-2 text-sm text-secondary-900">
                  <MapPin class="size-4 mt-0.5 shrink-0 text-secondary-400" />
                  <span>{{ quotation.contact_address || '—' }}</span>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <!-- Right column -->
        <aside class="space-y-6">
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <Wallet class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Premium & rating</h2>
            </header>
            <dl class="space-y-4">
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Sum insured</dt>
                <dd class="text-sm font-bold text-secondary-900 tabular-nums">{{ formatNaira(quotation.sum_insured) }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Invoice value</dt>
                <dd class="text-sm font-medium text-secondary-900 tabular-nums">{{ formatNaira(quotation.invoice_value) }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Rate</dt>
                <dd class="text-sm font-medium text-secondary-900">{{ quotation.basic_rate ?? '—' }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Exchange rate</dt>
                <dd class="text-sm font-medium text-secondary-900">
                  {{ quotation.exchange_rate ? `${quotation.exchange_rate}/₦` : '—' }}
                </dd>
              </div>
              <div class="flex items-center justify-between border-t border-secondary-100 pt-4">
                <dt class="text-xs font-semibold text-secondary-700">Premium</dt>
                <dd class="text-base font-bold text-secondary-900 tabular-nums">{{ formatNaira(quotation.premium) }}</dd>
              </div>
            </dl>
          </section>

          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <CalendarDays class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Meta</h2>
            </header>
            <dl class="space-y-4 text-sm">
              <div>
                <dt class="text-xs text-secondary-500">Policy type</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ quotation.policy_type || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-secondary-500">Cover type</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ quotation.cover_type || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-secondary-500">Created</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ formatDate(quotation.created_at) }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>

    <!-- Payment confirmation dialog -->
    <DialogRoot v-model:open="payOpen">
      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-50 bg-secondary-900/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-secondary-100 bg-card shadow-2xl focus:outline-none data-[state=open]:animate-scale-in"
          @escape-key-down="payingQuotation ? undefined : (payOpen = false)"
          @pointer-down-outside="payingQuotation ? undefined : (payOpen = false)"
        >
          <div class="relative overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50 px-6 pt-6 pb-5">
            <div class="absolute -right-10 -top-10 size-32 rounded-full bg-card/40 blur-3xl" aria-hidden="true" />
            <div class="relative flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <CreditCard class="size-6" />
              </div>
              <div class="min-w-0">
                <DialogTitle class="text-lg font-bold leading-tight text-secondary-900">
                  Make payment
                </DialogTitle>
                <DialogDescription class="mt-0.5 text-xs text-secondary-600">
                  Confirm to pay for this quotation.
                </DialogDescription>
              </div>
            </div>
            <DialogClose
              class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-xl text-secondary-500 hover:bg-card/60 hover:text-secondary-800 cursor-pointer disabled:opacity-50"
              aria-label="Close"
              :disabled="payingQuotation"
              @click="payOpen = false"
            >
              <X class="size-4" />
            </DialogClose>
          </div>

          <div class="space-y-4 px-6 py-5">
            <p class="text-sm leading-relaxed text-secondary-700">
              Are you sure you want to make payment for this quotation?
            </p>
            <div v-if="quotation" class="flex items-center justify-between rounded-2xl border border-secondary-100 bg-secondary-50 px-4 py-3">
              <span class="text-xs font-semibold uppercase tracking-widest text-secondary-500">Premium</span>
              <span class="text-base font-bold text-secondary-900 tabular-nums">{{ formatNaira(quotation.premium) }}</span>
            </div>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="btn-ghost border border-secondary-100"
                :disabled="payingQuotation"
                @click="payOpen = false"
              >
                Cancel
              </button>
              <button type="button" class="btn-primary" :disabled="payingQuotation" @click="confirmPayment">
                <Loader2 v-if="payingQuotation" class="size-4 animate-spin" />
                {{ payingQuotation ? 'Processing…' : 'Pay' }}
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
