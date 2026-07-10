<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  Quote,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Inbox,
  Eye,
  Plus,
} from 'lucide-vue-next'
import { useMarineStore } from '~/stores/marine'
import type { MarineQuotationRecord } from '~/types/marine'
import { formatNaira, formatDate } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })

const marine = useMarineStore()
const {
  quotations,
  quotationsLoading,
  quotationsError,
  quotationsPage,
  quotationsLastPage,
  quotationsTotal,
} = storeToRefs(marine)

await marine.fetchQuotations(1).catch(() => {})

function holderName(q: MarineQuotationRecord) {
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

async function refresh() {
  await marine.fetchQuotations(quotationsPage.value).catch(() => {})
}

async function goToPage(page: number) {
  if (page < 1 || page > quotationsLastPage.value || page === quotationsPage.value) return
  await marine.fetchQuotations(page).catch(() => {})
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <Quote class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Marine
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">All quotations</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            Every marine quotation you've requested, ordered by most recent.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="quotationsLoading"
          @click="refresh"
        >
          <RefreshCw :class="['size-4', quotationsLoading && 'animate-spin']" />
          Refresh
        </button>
        <NuxtLink to="/marine/quotations/generate" class="btn-primary text-sm">
          <Plus class="size-4" />
          Generate quotation
        </NuxtLink>
      </div>
    </div>

    <!-- Card -->
    <div class="card overflow-hidden">
      <!-- Card header -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-4 py-4">
        <div>
          <h2 class="text-base font-semibold text-secondary-900">Quotations</h2>
          <p class="text-xs text-secondary-500">
            {{ quotationsTotal }} total
          </p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="quotationsLoading && quotations.length === 0" class="divide-y divide-secondary-100">
        <div v-for="i in 5" :key="i" class="grid grid-cols-12 gap-4 px-4 py-4">
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="quotationsError" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
          <AlertTriangle class="size-6 text-tertiary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">Couldn't load your quotations</p>
        <p class="max-w-md text-sm text-secondary-500">{{ quotationsError }}</p>
        <button type="button" class="btn-outline text-sm mt-2" @click="refresh">
          <RefreshCw class="size-4" /> Try again
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="quotations.length === 0" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
          <Inbox class="size-6 text-secondary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">No quotations yet</p>
        <p class="max-w-md text-sm text-secondary-500">
          Generate your first marine quotation to get started.
        </p>
        <NuxtLink to="/marine/quotations/generate" class="btn-primary text-sm mt-2">
          <Plus class="size-4" /> Generate quotation
        </NuxtLink>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-secondary-50 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
            <tr>
              <th class="px-4 py-3">Insured</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3">Phone</th>
              <th class="px-4 py-3 text-right">Invoice value</th>
              <th class="px-4 py-3 text-right">Premium</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Created</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary-100">
            <tr
              v-for="quotation in quotations"
              :key="quotation.id"
              class="transition-colors hover:bg-secondary-50/50"
            >
              <td class="px-4 py-4">
                <p class="font-semibold text-secondary-900">{{ holderName(quotation) }}</p>
                <p v-if="quotation.email" class="text-xs text-secondary-500">{{ quotation.email }}</p>
              </td>
              <td class="px-4 py-4 text-secondary-700 capitalize">
                {{ quotation.holder_type || '—' }}
              </td>
              <td class="px-4 py-4 text-secondary-700">
                {{ quotation.phone_number || '—' }}
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(quotation.invoice_value) }}
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(quotation.premium) }}
              </td>
              <td class="px-4 py-4">
                <span :class="['inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', statusClass(quotation.status ?? '')]">
                  {{ quotation.status || '—' }}
                </span>
              </td>
              <td class="px-4 py-4 text-secondary-700">
                <p class="text-xs">{{ formatDate(quotation.created_at) }}</p>
              </td>
              <td class="px-4 py-4 text-right">
                <NuxtLink
                  :to="`/marine/quotations/${quotation.id}`"
                  class="inline-flex size-8 items-center justify-center rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 cursor-pointer"
                  aria-label="View quotation"
                >
                  <Eye class="size-4" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="quotations.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-secondary-100 px-4 py-4"
      >
        <p class="text-xs text-secondary-500">
          Page <span class="font-semibold text-secondary-900">{{ quotationsPage }}</span>
          of <span class="font-semibold text-secondary-900">{{ quotationsLastPage }}</span>
          · {{ quotationsTotal }} quotations
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="quotationsLoading || quotationsPage <= 1"
            @click="goToPage(quotationsPage - 1)"
          >
            <ChevronLeft class="size-4" /> Previous
          </button>
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="quotationsLoading || quotationsPage >= quotationsLastPage"
            @click="goToPage(quotationsPage + 1)"
          >
            Next <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
