<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Inbox,
  Printer,
} from 'lucide-vue-next'
import { useMarineStore } from '~/stores/marine'
import { formatNaira, formatDate } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })

const marine = useMarineStore()
const {
  certificates,
  certificatesLoading,
  certificatesError,
  certificatesPage,
  certificatesLastPage,
  certificatesTotal,
} = storeToRefs(marine)

await marine.fetchCertificates(1).catch(() => {})

async function refresh() {
  await marine.fetchCertificates(certificatesPage.value).catch(() => {})
}

async function goToPage(page: number) {
  if (page < 1 || page > certificatesLastPage.value || page === certificatesPage.value) return
  await marine.fetchCertificates(page).catch(() => {})
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <FileCheck2 class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Marine
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">My policies</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            Marine cover certificates issued for your shipments, ordered by most recent.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="certificatesLoading"
          @click="refresh"
        >
          <RefreshCw :class="['size-4', certificatesLoading && 'animate-spin']" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Card -->
    <div class="card overflow-hidden">
      <!-- Card header -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-4 py-4">
        <div>
          <h2 class="text-base font-semibold text-secondary-900">Certificates</h2>
          <p class="text-xs text-secondary-500">
            {{ certificatesTotal }} total
          </p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="certificatesLoading && certificates.length === 0" class="divide-y divide-secondary-100">
        <div v-for="i in 5" :key="i" class="grid grid-cols-12 gap-4 px-4 py-4">
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="certificatesError" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
          <AlertTriangle class="size-6 text-tertiary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">Couldn't load your certificates</p>
        <p class="max-w-md text-sm text-secondary-500">{{ certificatesError }}</p>
        <button type="button" class="btn-outline text-sm mt-2" @click="refresh">
          <RefreshCw class="size-4" /> Try again
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="certificates.length === 0" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
          <Inbox class="size-6 text-secondary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">No marine certificates yet</p>
        <p class="max-w-md text-sm text-secondary-500">
          Certificates issued for your marine cover will appear here.
        </p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-secondary-50 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
            <tr>
              <th class="px-4 py-3">Certificate no</th>
              <th class="px-4 py-3">Policy no</th>
              <th class="px-4 py-3 text-right">Sum insured</th>
              <th class="px-4 py-3 text-right">Premium</th>
              <th class="px-4 py-3">Issued</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary-100">
            <tr
              v-for="certificate in certificates"
              :key="certificate.id"
              class="transition-colors hover:bg-secondary-50/50"
            >
              <td class="px-4 py-4">
                <p class="font-semibold text-secondary-900">{{ certificate.certificate_number || '—' }}</p>
                <p v-if="certificate.proforma_invoice_number" class="text-xs text-secondary-500">
                  PI: {{ certificate.proforma_invoice_number }}
                </p>
              </td>
              <td class="px-4 py-4 text-secondary-700">
                {{ certificate.policy_number || '—' }}
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(certificate.quotation?.sum_insured) }}
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(certificate.quotation?.premium) }}
              </td>
              <td class="px-4 py-4 text-secondary-700">
                <p class="text-xs">{{ formatDate(certificate.created_at) }}</p>
              </td>
              <td class="px-4 py-4 text-right">
                <a
                  v-if="certificate.certificate_url"
                  :href="certificate.certificate_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-secondary-100 px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 cursor-pointer"
                >
                  <Printer class="size-4" /> Print
                </a>
                <span v-else class="text-xs text-secondary-400">Unavailable</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="certificates.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-secondary-100 px-4 py-4"
      >
        <p class="text-xs text-secondary-500">
          Page <span class="font-semibold text-secondary-900">{{ certificatesPage }}</span>
          of <span class="font-semibold text-secondary-900">{{ certificatesLastPage }}</span>
          · {{ certificatesTotal }} certificates
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="certificatesLoading || certificatesPage <= 1"
            @click="goToPage(certificatesPage - 1)"
          >
            <ChevronLeft class="size-4" /> Previous
          </button>
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="certificatesLoading || certificatesPage >= certificatesLastPage"
            @click="goToPage(certificatesPage + 1)"
          >
            Next <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
