<script setup lang="ts">
import {
  Home,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  ArrowRight,
  Building2,
  RefreshCw,
  Plus,
  CalendarDays,
  Eye,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { findProduct } from '~/utils/products'
import { useHomeshieldStore } from '~/stores/homeshield'
import { formatNaira, formatDate } from '~/utils/format'
import type { HomeshieldDashboardParams } from '~/types/homeshield'

const product = findProduct('homeshield')!

const homeshield = useHomeshieldStore()
const { dashboard, dashboardLoading, dashboardError } = storeToRefs(homeshield)

type Preset = 'week' | 'month' | 'year' | 'custom'
const preset = ref<Preset>('month')
const fromDate = ref('')
const toDate = ref('')

function buildParams(): HomeshieldDashboardParams {
  if (preset.value === 'custom') {
    return { from_date: fromDate.value || undefined, to_date: toDate.value || undefined }
  }
  const now = new Date()
  if (preset.value === 'month') {
    return { filter: 'month', month: now.getMonth() + 1, year: now.getFullYear() }
  }
  if (preset.value === 'year') {
    return { filter: 'year', year: now.getFullYear() }
  }
  return { filter: 'week' }
}

async function refresh() {
  await homeshield.fetchDashboard(buildParams()).catch(() => {})
}

await refresh()

watch(preset, (v) => {
  if (v !== 'custom') refresh()
})

function applyCustom() {
  if (!fromDate.value || !toDate.value) return
  refresh()
}

function holderName(p: { first_name: string | null; last_name: string | null; company_name: string | null }) {
  if (p.company_name) return p.company_name
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || '—'
}

function statusClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'success' || s === 'paid') return 'bg-primary-50 text-primary-700'
  if (s === 'pending') return 'bg-warning/15 text-warning'
  if (s === 'expired' || s === 'failed' || s === 'declined') return 'bg-tertiary-50 text-tertiary-600'
  return 'bg-secondary-100 text-secondary-700'
}
</script>

<template>
  <div class="space-y-6">
    <ProductProductHero :product="product" greeting="Welcome home" />

    <!-- Filter bar -->
    <div class="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in [
            { id: 'week' as Preset, label: 'This week' },
            { id: 'month' as Preset, label: 'This month' },
            { id: 'year' as Preset, label: 'This year' },
            { id: 'custom' as Preset, label: 'Custom range' },
          ]"
          :key="opt.id"
          type="button"
          :aria-pressed="preset === opt.id"
          :class="[
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
            preset === opt.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-secondary-100 bg-card text-secondary-700 hover:border-primary-200',
          ]"
          @click="preset = opt.id"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <template v-if="preset === 'custom'">
          <CalendarDays class="size-4 text-secondary-400" />
          <input
            v-model="fromDate"
            type="date"
            class="input-field h-9 max-w-[10rem] text-xs"
            aria-label="From date"
          >
          <span class="text-xs text-secondary-400">to</span>
          <input
            v-model="toDate"
            type="date"
            class="input-field h-9 max-w-[10rem] text-xs"
            aria-label="To date"
          >
          <button
            type="button"
            class="btn-primary h-9 text-xs"
            :disabled="!fromDate || !toDate || dashboardLoading"
            @click="applyCustom"
          >
            Apply
          </button>
        </template>
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
    </div>

    <!-- Error -->
    <div
      v-if="dashboardError"
      class="card flex items-start gap-3 p-4"
    >
      <AlertTriangle class="size-5 shrink-0 text-tertiary-500" />
      <div>
        <p class="text-sm font-semibold text-secondary-900">Couldn't load the dashboard</p>
        <p class="text-xs text-secondary-500">{{ dashboardError }}</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ProductStatCard
        label="Wallet balance"
        :value="formatNaira(dashboard?.wallet_balance ?? 0)"
        :icon="Wallet"
      />
      <ProductStatCard
        label="Active policies"
        :value="String(dashboard?.active_policy_count ?? 0)"
        :delta="`${dashboard?.policy_count ?? 0} total`"
        trend="up"
        :icon="Home"
        icon-bg="bg-tertiary-50"
        icon-color="text-tertiary-500"
      />
      <ProductStatCard
        label="Total sum insured"
        :value="formatNaira(dashboard?.total_sum_insured ?? 0)"
        :icon="ShieldCheck"
      />
      <ProductStatCard
        label="Total premium"
        :value="formatNaira(dashboard?.total_premium ?? 0)"
        :delta="`${dashboard?.expired_policy_count ?? 0} expired`"
        :trend="(dashboard?.expired_policy_count ?? 0) > 0 ? 'down' : 'up'"
        :icon="Wallet"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Recent policies -->
      <div class="card lg:col-span-2 overflow-hidden">
        <div class="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-semibold text-secondary-900">Recent policies</h2>
            <p class="text-sm text-secondary-500">Latest homeshield issuances on your account</p>
          </div>
          <NuxtLink to="/homeshield/my-policies" class="btn-ghost text-sm">
            View all <ArrowRight class="size-4" />
          </NuxtLink>
        </div>

        <!-- Loading -->
        <div v-if="dashboardLoading && !dashboard" class="divide-y divide-secondary-100">
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
        <div
          v-else-if="!dashboard?.recent_policies?.length"
          class="px-6 py-12 text-center"
        >
          <p class="text-sm font-semibold text-secondary-900">No policies in this period</p>
          <p class="mt-1 text-sm text-secondary-500">Try a wider date range or buy your first policy.</p>
          <NuxtLink to="/homeshield/buy" class="btn-primary text-sm mt-4">
            <Plus class="size-4" /> Buy policy
          </NuxtLink>
        </div>

        <!-- List -->
        <ul v-else class="divide-y divide-secondary-100">
          <li
            v-for="p in dashboard.recent_policies"
            :key="p.id"
            class="flex flex-wrap items-center gap-4 px-6 py-4"
          >
            <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-50">
              <Building2 class="size-6 text-tertiary-500" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-secondary-900">{{ holderName(p) }}</p>
              <p class="text-sm text-secondary-500">
                {{ p.policy_number }} · {{ p.category }}
              </p>
              <p class="text-xs text-secondary-500 truncate">{{ p.property_address }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-secondary-900 tabular-nums">
                {{ formatNaira(p.value_of_property) }}
              </p>
              <span :class="['mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize', statusClass(p.status)]">
                {{ p.status }}
              </span>
              <p class="mt-0.5 text-[11px] text-secondary-500">{{ formatDate(p.created_at) }}</p>
            </div>
            <NuxtLink
              :to="`/homeshield/policy/${p.id}`"
              class="inline-flex size-8 items-center justify-center rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 cursor-pointer"
              aria-label="View policy"
            >
              <Eye class="size-4" />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Quick actions -->
      <div class="card p-6">
        <h3 class="text-base font-semibold text-secondary-900">Quick actions</h3>
        <p class="mt-1 text-sm text-secondary-500">Common homeshield tasks</p>
        <div class="mt-4 grid grid-cols-1 gap-2">
          <NuxtLink
            to="/homeshield/buy"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-tertiary-200 hover:bg-tertiary-50/40 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">Buy a new policy</p>
              <p class="text-xs text-secondary-500">Start a fresh homeshield application</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
          <NuxtLink
            to="/homeshield/my-policies"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-tertiary-200 hover:bg-tertiary-50/40 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">View all policies</p>
              <p class="text-xs text-secondary-500">Browse your full policy list</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
