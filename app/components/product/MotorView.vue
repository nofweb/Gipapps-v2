<script setup lang="ts">
import {
  Car,
  FileCheck2,
  AlertTriangle,
  Wallet,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Filter,
  X,
  RefreshCw,
  TrendingUp,
  Receipt,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { findProduct } from '~/utils/products'
import { useMotorStore } from '~/stores/motor'
import { formatNaira, formatDate } from '~/utils/format'
import type { MotorDashboardRecentPolicy } from '~/types/motor'

const product = findProduct('motor')!
const motor = useMotorStore()
const { dashboard, dashboardLoading, dashboardError } = storeToRefs(motor)

/* ---------------- Filter state ---------------- */

type FilterScope = 'all' | 'year' | 'month' | 'custom'

const now = new Date()
const scope = ref<FilterScope>('all')
const year = ref<number>(now.getFullYear())
const month = ref<number>(now.getMonth() + 1)
const fromDate = ref('')   // YYYY-MM-DD
const toDate = ref('')     // YYYY-MM-DD

const YEAR_OPTIONS = (() => {
  const arr: number[] = []
  const cur = now.getFullYear()
  for (let y = cur; y >= cur - 6; y--) arr.push(y)
  return arr
})()

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

/** Convert YYYY-MM-DD → DD-MM-YYYY. */
function toApiDate(yyyyMmDd: string): string {
  if (!yyyyMmDd) return ''
  const [y, m, d] = yyyyMmDd.split('-')
  if (!y || !m || !d) return ''
  return `${d}-${m}-${y}`
}

function buildParams() {
  if (scope.value === 'year') return { filter: 'year' as const, year: year.value }
  if (scope.value === 'month') return { filter: 'month' as const, month: month.value, year: year.value }
  if (scope.value === 'custom') {
    return {
      from_date: toApiDate(fromDate.value) || undefined,
      to_date: toApiDate(toDate.value) || undefined,
    }
  }
  return {}
}

async function loadDashboard() {
  await motor.fetchDashboard(buildParams()).catch(() => {})
}

async function resetFilters() {
  scope.value = 'all'
  fromDate.value = ''
  toDate.value = ''
  year.value = now.getFullYear()
  month.value = now.getMonth() + 1
  await loadDashboard()
}

onMounted(() => {
  loadDashboard()
})

/* ---------------- Stat helpers ---------------- */

const stats = computed(() => {
  const d = dashboard.value
  return {
    total: d?.policy_count ?? 0,
    comprehensive: d?.ezdrive_policy_count ?? 0,
    thirdParty: d?.motor_policy_count ?? 0,
    active: d?.active_policy_count ?? 0,
    expired: d?.expired_policy_count ?? 0,
    pendingNiid: d?.pending_niid_policy_count ?? 0,
    totalPremium: d?.total_premium ?? 0,
    totalSumInsured: d?.total_sum_insured ?? 0,
  }
})

const recentPolicies = computed(() => dashboard.value?.recent_policies ?? [])

/** Map recent-policy `source` to the family used for the detail-link `?family=` hint. */
function familyFor(source: string): 'comprehensive' | 'third_party' {
  return source === 'ezdrive' ? 'comprehensive' : 'third_party'
}

function sourceLabel(source: string): string {
  if (source === 'ezdrive') return 'Comprehensive'
  if (source === 'motor_protect') return 'Third Party'
  return source
}

function niidPill(status: string | null): { label: string; cls: string } {
  if (!status) return { label: 'N/A', cls: 'bg-secondary-100 text-secondary-700' }
  const s = status.toUpperCase()
  if (s === 'Y' || s === 'YES' || s === 'ACTIVE')
    return { label: 'Active', cls: 'bg-primary-50 text-primary-700' }
  if (s === 'N' || s === 'NO' || s === 'PENDING')
    return { label: 'Pending', cls: 'bg-warning/15 text-warning' }
  if (s === 'FAILED' || s === 'EXPIRED')
    return { label: s.charAt(0) + s.slice(1).toLowerCase(), cls: 'bg-tertiary-50 text-tertiary-600' }
  return { label: status, cls: 'bg-secondary-100 text-secondary-700' }
}

function trackRecent(p: MotorDashboardRecentPolicy) {
  motor.setLastViewed(String(p.id))
}
</script>

<template>
  <div class="space-y-6">
    <ProductProductHero :product="product" greeting="Welcome back" />

    <!-- Filter -->
    <section class="card p-5">
      <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Filter class="size-4 text-secondary-500" />
          <h2 class="text-sm font-semibold text-secondary-900">Period</h2>
          <span
            v-if="scope !== 'all'"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700"
          >
            {{ scope }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="dashboardLoading"
            @click="loadDashboard"
          >
            <RefreshCw :class="['size-4', dashboardLoading && 'animate-spin']" />
            Refresh
          </button>
          <button
            v-if="scope !== 'all'"
            type="button"
            class="inline-flex items-center gap-1 text-xs font-semibold text-secondary-600 hover:text-secondary-900 cursor-pointer"
            :disabled="dashboardLoading"
            @click="resetFilters"
          >
            <X class="size-3.5" /> Clear
          </button>
        </div>
      </header>

      <form class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" @submit.prevent="loadDashboard">
        <div>
          <label class="input-label" for="dash-scope">Scope</label>
          <select id="dash-scope" v-model="scope" class="input-field">
            <option value="all">All time</option>
            <option value="year">By year</option>
            <option value="month">By month</option>
            <option value="custom">Custom range</option>
          </select>
        </div>

        <template v-if="scope === 'year' || scope === 'month'">
          <div>
            <label class="input-label" for="dash-year">Year</label>
            <select id="dash-year" v-model.number="year" class="input-field">
              <option v-for="y in YEAR_OPTIONS" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div v-if="scope === 'month'">
            <label class="input-label" for="dash-month">Month</label>
            <select id="dash-month" v-model.number="month" class="input-field">
              <option v-for="m in MONTH_OPTIONS" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
        </template>

        <template v-else-if="scope === 'custom'">
          <div>
            <label class="input-label" for="dash-from">From</label>
            <input id="dash-from" v-model="fromDate" type="date" class="input-field">
          </div>
          <div>
            <label class="input-label" for="dash-to">To</label>
            <input
              id="dash-to"
              v-model="toDate"
              type="date"
              :min="fromDate || undefined"
              class="input-field"
            >
          </div>
        </template>

        <div
          :class="[
            'flex justify-end sm:col-span-2',
            scope === 'all' ? 'lg:col-span-4' : 'lg:col-span-2',
          ]"
        >
          <button type="submit" class="btn-primary text-sm self-end" :disabled="dashboardLoading">
            <span
              v-if="dashboardLoading"
              class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <Filter v-else class="size-4" />
            {{ dashboardLoading ? 'Loading…' : 'Apply' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Error -->
    <div
      v-if="dashboardError && !dashboard"
      class="flex items-start gap-3 rounded-2xl border border-tertiary-200 bg-tertiary-50 p-4"
    >
      <AlertTriangle class="size-5 shrink-0 text-tertiary-500" />
      <div class="flex-1">
        <p class="text-sm font-semibold text-secondary-900">Couldn't load dashboard</p>
        <p class="text-xs text-tertiary-700">{{ dashboardError }}</p>
      </div>
      <button type="button" class="btn-outline text-sm" @click="loadDashboard">
        <RefreshCw class="size-4" /> Retry
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ProductStatCard label="Total Policies" :value="String(stats.total)" :icon="FileCheck2" />
      <ProductStatCard label="Comprehensive" :value="String(stats.comprehensive)" :icon="ShieldCheck" />
      <ProductStatCard label="Third Party" :value="String(stats.thirdParty)" :icon="ShieldAlert" />
      <ProductStatCard label="Active" :value="String(stats.active)" :icon="Car" />
      <ProductStatCard label="Expired" :value="String(stats.expired)" :icon="AlertTriangle" icon-bg="bg-tertiary-50" icon-color="text-tertiary-500" />
      <ProductStatCard label="Pending NIID" :value="String(stats.pendingNiid)" :icon="AlertTriangle" icon-bg="bg-warning/15" icon-color="text-warning" />
      <ProductStatCard label="Total Premium" :value="formatNaira(stats.totalPremium)" :icon="Wallet" />
      <ProductStatCard label="Sum Insured" :value="formatNaira(stats.totalSumInsured)" :icon="TrendingUp" />
    </div>

    <!-- Recent policies + Quick actions -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="card lg:col-span-2 overflow-hidden">
        <div class="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-semibold text-secondary-900">Recent policies</h2>
            <p class="text-sm text-secondary-500">Latest activity across motor cover</p>
          </div>
          <NuxtLink to="/motor/comprehensive/my-policies" class="btn-ghost text-sm">
            View all
            <ArrowRight class="size-4" />
          </NuxtLink>
        </div>

        <!-- Loading skeleton -->
        <ul v-if="dashboardLoading && recentPolicies.length === 0" class="divide-y divide-secondary-100">
          <li v-for="i in 4" :key="i" class="flex items-center gap-4 px-6 py-4">
            <div class="size-12 animate-pulse rounded-2xl bg-secondary-100" />
            <div class="flex-1 space-y-2">
              <div class="h-3 w-1/3 animate-pulse rounded bg-secondary-100" />
              <div class="h-3 w-2/3 animate-pulse rounded bg-secondary-100" />
            </div>
            <div class="h-6 w-16 animate-pulse rounded-full bg-secondary-100" />
          </li>
        </ul>

        <!-- Empty -->
        <div
          v-else-if="recentPolicies.length === 0"
          class="px-6 py-12 text-center text-sm text-secondary-500"
        >
          <p>No motor policies yet in this period.</p>
          <NuxtLink to="/motor/comprehensive/buy" class="btn-primary mt-4 inline-flex text-sm">
            Buy your first policy
            <ArrowRight class="size-4" />
          </NuxtLink>
        </div>

        <!-- List -->
        <ul v-else class="divide-y divide-secondary-100">
          <li
            v-for="p in recentPolicies"
            :key="`${p.source}-${p.id}`"
            class="hover:bg-secondary-50"
          >
            <NuxtLink
              :to="{ path: `/motor/policy/${p.id}`, query: { family: familyFor(p.source) } }"
              class="flex flex-wrap items-center gap-4 px-6 py-4 cursor-pointer"
              @click="trackRecent(p)"
            >
              <div
                :class="[
                  'flex size-12 items-center justify-center rounded-2xl',
                  p.source === 'ezdrive' ? 'bg-primary-50 text-primary-700' : 'bg-secondary-100 text-secondary-700',
                ]"
              >
                <Car class="size-6" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-secondary-900">{{ p.insured_name || '—' }}</p>
                <p class="text-sm text-secondary-500">
                  {{ p.policy_number }} · {{ sourceLabel(p.source) }}
                </p>
                <p class="text-xs text-secondary-500">
                  {{ formatDate(p.effective_cover_date) }} → {{ formatDate(p.expiration_date) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-secondary-900 tabular-nums">{{ formatNaira(p.premium) }}</p>
                <span
                  :class="[
                    'mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                    niidPill(p.niid_status).cls,
                  ]"
                >
                  NIID · {{ niidPill(p.niid_status).label }}
                </span>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="card p-6">
        <h3 class="text-base font-semibold text-secondary-900">Quick actions</h3>
        <p class="mt-1 text-sm text-secondary-500">Common tasks for motor cover</p>
        <div class="mt-4 grid grid-cols-1 gap-2">
          <NuxtLink
            to="/motor/comprehensive/buy"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">Buy Comprehensive</p>
              <p class="text-xs text-secondary-500">Full cover for your vehicle</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
          <NuxtLink
            to="/motor/third-party/buy"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">Buy Third Party</p>
              <p class="text-xs text-secondary-500">Statutory third-party cover</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
          <NuxtLink
            to="/motor/comprehensive/renew"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">Renew a policy</p>
              <p class="text-xs text-secondary-500">Continue an existing cover</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </NuxtLink>
          <NuxtLink
            to="/motor/comprehensive/my-policies"
            class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 cursor-pointer"
          >
            <div>
              <p class="text-sm font-semibold text-secondary-900">My policies</p>
              <p class="text-xs text-secondary-500">Search, filter, manage policies</p>
            </div>
            <Receipt class="size-4 text-secondary-400" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
