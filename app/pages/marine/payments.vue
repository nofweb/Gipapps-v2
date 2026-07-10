<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from 'lucide-vue-next'
import { useMarineStore } from '~/stores/marine'
import type { MarinePayment } from '~/types/marine'
import { formatNaira, formatDate } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })

const marine = useMarineStore()
const {
  payments,
  paymentsLoading,
  paymentsError,
  paymentsPage,
  paymentsLastPage,
  paymentsTotal,
} = storeToRefs(marine)

await marine.fetchPayments(1).catch(() => {})

// Old marine keys paid status off the nested quotation.status (not the
// transaction record's own status field), so quotation.status is the source
// of truth; fall back to payment.status only when the quotation is absent.
function paymentStatus(p: MarinePayment) {
  return (p.quotation?.status ?? p.status ?? '').toString().toLowerCase()
}

function isPaid(p: MarinePayment) {
  return paymentStatus(p) === 'paid'
}

function statusClass(status: string) {
  if (status === 'paid' || status === 'success')
    return 'bg-primary-50 text-primary-700'
  if (status === 'pending') return 'bg-warning/15 text-warning'
  return 'bg-tertiary-50 text-tertiary-600'
}

async function refresh() {
  await marine.fetchPayments(paymentsPage.value).catch(() => {})
}

async function goToPage(page: number) {
  if (page < 1 || page > paymentsLastPage.value || page === paymentsPage.value) return
  await marine.fetchPayments(page).catch(() => {})
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <CreditCard class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Marine
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">Payments</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            Premium payments made on your marine policies, ordered by most recent.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="paymentsLoading"
          @click="refresh"
        >
          <RefreshCw :class="['size-4', paymentsLoading && 'animate-spin']" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Card -->
    <div class="card overflow-hidden">
      <!-- Card header -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-4 py-4">
        <div>
          <h2 class="text-base font-semibold text-secondary-900">Payments</h2>
          <p class="text-xs text-secondary-500">
            {{ paymentsTotal }} total
          </p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="paymentsLoading && payments.length === 0" class="divide-y divide-secondary-100">
        <div v-for="i in 5" :key="i" class="grid grid-cols-12 gap-4 px-4 py-4">
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="paymentsError" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
          <AlertTriangle class="size-6 text-tertiary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">Couldn't load your payments</p>
        <p class="max-w-md text-sm text-secondary-500">{{ paymentsError }}</p>
        <button type="button" class="btn-outline text-sm mt-2" @click="refresh">
          <RefreshCw class="size-4" /> Try again
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="payments.length === 0" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
          <Inbox class="size-6 text-secondary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">No payments yet</p>
        <p class="max-w-md text-sm text-secondary-500">
          Premium payments made on your marine policies will appear here.
        </p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-secondary-50 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
            <tr>
              <th class="px-4 py-3">Reference</th>
              <th class="px-4 py-3 text-right">Amount</th>
              <th class="px-4 py-3 text-right">Sum insured</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary-100">
            <tr
              v-for="payment in payments"
              :key="payment.id"
              class="transition-colors hover:bg-secondary-50/50"
            >
              <td class="px-4 py-4">
                <p class="font-semibold text-secondary-900">{{ payment.payment_reference || '—' }}</p>
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(payment.amount_paid) }}
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(payment.quotation?.sum_insured) }}
              </td>
              <td class="px-4 py-4">
                <span :class="['inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', statusClass(paymentStatus(payment))]">
                  {{ isPaid(payment) ? 'Paid' : 'Not paid' }}
                </span>
              </td>
              <td class="px-4 py-4 text-secondary-700">
                <p class="text-xs">{{ formatDate(payment.created_at) }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="payments.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-secondary-100 px-4 py-4"
      >
        <p class="text-xs text-secondary-500">
          Page <span class="font-semibold text-secondary-900">{{ paymentsPage }}</span>
          of <span class="font-semibold text-secondary-900">{{ paymentsLastPage }}</span>
          · {{ paymentsTotal }} payments
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="paymentsLoading || paymentsPage <= 1"
            @click="goToPage(paymentsPage - 1)"
          >
            <ChevronLeft class="size-4" /> Previous
          </button>
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="paymentsLoading || paymentsPage >= paymentsLastPage"
            @click="goToPage(paymentsPage + 1)"
          >
            Next <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
