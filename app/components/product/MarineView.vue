<script setup lang="ts">
import {
  Ship,
  FileCheck2,
  Quote,
  AlertTriangle,
  Wallet,
  ArrowRight,
  RefreshCw,
  FileClock,
  FileWarning,
  Hourglass,
  Eye,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { findProduct } from '~/utils/products'
import { useMarineStore } from '~/stores/marine'
import { formatNaira, formatDate } from '~/utils/format'
import type { MarineCertificate } from '~/types/marine'

const product = findProduct('marine')!

const marine = useMarineStore()
const { dashboard, dashboardLoading, dashboardError, certificates, certificatesLoading } = storeToRefs(marine)

async function refresh() {
  await Promise.all([
    marine.fetchDashboard().catch(() => {}),
    marine.fetchCertificates(1).catch(() => {}),
  ])
}

await refresh()

// Latest marine issuances — most recent policies from /marine/policy.
const recentPolicies = computed(() => certificates.value.slice(0, 5))

const comparison = computed(() => dashboard.value?.policy_comparison)
const comparisonDelta = computed(() => {
  const c = comparison.value
  if (!c) return undefined
  const sign = c.difference > 0 ? '+' : ''
  return `${sign}${c.difference} vs last month`
})
const comparisonTrend = computed<'up' | 'down' | undefined>(() => {
  const d = comparison.value?.difference ?? 0
  if (d > 0) return 'up'
  if (d < 0) return 'down'
  return undefined
})

function holderName(p: MarineCertificate) {
  const q = p.quotation
  if (q?.company_name) return q.company_name
  return [q?.first_name, q?.last_name].filter(Boolean).join(' ') || '—'
}
</script>

<template>
  <div class="space-y-6">
    <ProductProductHero :product="product" greeting="Bon voyage" />

    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <p v-if="comparison" class="text-sm text-secondary-500">
        {{ comparison.current_month }} this month · {{ comparison.percentage_change }}
      </p>
      <span v-else />
      <button
        type="button"
        class="btn-ghost border border-secondary-100 h-9 text-xs"
        :disabled="dashboardLoading"
        @click="refresh"
      >
        <RefreshCw :class="['size-4', dashboardLoading && 'animate-spin']" />
        Refresh
      </button>
    </div>

    <!-- Error -->
    <div v-if="dashboardError" class="card flex items-start gap-3 p-4">
      <AlertTriangle class="size-5 shrink-0 text-tertiary-500" />
      <div>
        <p class="text-sm font-semibold text-secondary-900">Couldn't load the dashboard</p>
        <p class="text-xs text-secondary-500">{{ dashboardError }}</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProductStatCard
        label="Wallet balance"
        :value="formatNaira(dashboard?.wallet_balance ?? 0)"
        :icon="Wallet"
      />
      <ProductStatCard
        label="All policies"
        :value="String(dashboard?.all_policies ?? 0)"
        :delta="comparisonDelta"
        :trend="comparisonTrend"
        :icon="Ship"
        icon-bg="bg-tertiary-50"
        icon-color="text-tertiary-500"
      />
      <ProductStatCard
        label="Pending quotations"
        :value="String(dashboard?.pending_quotation ?? 0)"
        :icon="FileClock"
      />
      <ProductStatCard
        label="Pending claims"
        :value="String(dashboard?.pending_claims ?? 0)"
        :icon="AlertTriangle"
        icon-bg="bg-tertiary-50"
        icon-color="text-tertiary-500"
      />
      <ProductStatCard
        label="Expired quotations"
        :value="String(dashboard?.expired_quotation ?? 0)"
        :icon="FileWarning"
      />
      <ProductStatCard
        label="Awaiting NIID"
        :value="String(dashboard?.awaiting_niid ?? 0)"
        :icon="Hourglass"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Recent policies -->
      <div class="card lg:col-span-2 overflow-hidden">
        <div class="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-semibold text-secondary-900">Recent policies</h2>
            <p class="text-sm text-secondary-500">Latest marine issuances on your account</p>
          </div>
          <NuxtLink to="/marine/certificates" class="btn-ghost text-sm">
            View all <ArrowRight class="size-4" />
          </NuxtLink>
        </div>

        <!-- Loading -->
        <div v-if="certificatesLoading && recentPolicies.length === 0" class="divide-y divide-secondary-100">
          <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-6 py-4">
            <div class="size-12 animate-pulse rounded-2xl bg-secondary-100" />
            <div class="flex-1 space-y-2">
              <div class="h-3 w-1/3 animate-pulse rounded bg-secondary-100" />
              <div class="h-3 w-2/3 animate-pulse rounded bg-secondary-100" />
            </div>
            <div class="h-4 w-20 animate-pulse rounded bg-secondary-100" />
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="recentPolicies.length === 0" class="px-6 py-12 text-center">
          <p class="text-sm font-semibold text-secondary-900">No policies yet</p>
          <p class="mt-1 text-sm text-secondary-500">Generate a quotation to get marine cover.</p>
          <NuxtLink to="/marine/quotations/generate" class="btn-primary text-sm mt-4">
            <Quote class="size-4" /> Generate quotation
          </NuxtLink>
        </div>

        <!-- List -->
        <ul v-else class="divide-y divide-secondary-100">
          <li
            v-for="p in recentPolicies"
            :key="p.id"
            class="flex flex-wrap items-center gap-4 px-6 py-4"
          >
            <div class="flex size-12 items-center justify-center rounded-2xl bg-secondary-100">
              <Ship class="size-6 text-secondary-700" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-secondary-900">{{ holderName(p) }}</p>
              <p class="text-sm text-secondary-500">
                {{ p.policy_number || p.certificate_number || '—' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-secondary-900 tabular-nums">
                {{ formatNaira(p.quotation?.premium) }}
              </p>
              <p v-if="p.created_at" class="mt-0.5 text-[11px] text-secondary-500">{{ formatDate(p.created_at) }}</p>
            </div>
            <a
              v-if="p.certificate_url"
              :href="p.certificate_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex size-8 items-center justify-center rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 cursor-pointer"
              aria-label="View certificate"
            >
              <Eye class="size-4" />
            </a>
            <NuxtLink
              v-else
              to="/marine/certificates"
              class="inline-flex size-8 items-center justify-center rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 cursor-pointer"
              aria-label="View policies"
            >
              <Eye class="size-4" />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Quick actions -->
      <div class="card p-6">
        <h3 class="text-base font-semibold text-secondary-900">Marine actions</h3>
        <p class="mt-1 text-sm text-secondary-500">Manage cargo and hull cover</p>
        <div class="mt-4 grid grid-cols-1 gap-2">
          <NuxtLink
            to="/marine/quotations/generate"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-secondary-300 hover:bg-secondary-50 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">Generate quotation</p>
              <p class="text-xs text-secondary-500">Get cover for a new shipment</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
          <NuxtLink
            to="/marine/certificates"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-secondary-300 hover:bg-secondary-50 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">My policies</p>
              <p class="text-xs text-secondary-500">View marine cover certificates</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
          <NuxtLink
            to="/marine/quotations"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-secondary-300 hover:bg-secondary-50 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">All quotations</p>
              <p class="text-xs text-secondary-500">Open, expired and paid quotations</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
