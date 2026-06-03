<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Inbox,
  Eye,
  Plus,
  Filter,
  X,
} from 'lucide-vue-next'
import { useMotorStore } from '~/stores/motor'
import { formatNaira, formatDate } from '~/utils/format'
import type { MotorPolicyFamily } from '~/types/motor'
import {
  INSURANCE_CLASS_LABELS,
  INSURANCE_CLASS_TO_CODE,
  variantsForFamily,
} from '~/utils/motor-constants'

const props = defineProps<{
  family: MotorPolicyFamily
  category: string
  subtitle: string
  buyHref: string
  /** When set, the policy list is filtered to entries whose `variance` matches. */
  variance?: string
}>()

const motor = useMotorStore()
const {
  policies,
  policiesLoading,
  policiesError,
  policiesPage,
  policiesLastPage,
  policiesFamily,
} = storeToRefs(motor)

const isThirdParty = computed(() => props.family === 'third_party')

/** Variance strings (lowercased) that belong to the page's family. */
const familyVariances = computed(() =>
  new Set(variantsForFamily(props.family).map(v => v.displayName.toLowerCase())),
)

/**
 * Filter the policy list. When the store already holds the right family
 * (most cases), the variance-set check is a no-op safety filter; when it
 * holds a different family (briefly during navigation), it suppresses
 * stale rows until the refetch completes.
 */
const visiblePolicies = computed(() => {
  return policies.value.filter((p) => {
    const variance = (p.variance ?? '').toLowerCase()
    if (props.variance) return variance === props.variance.toLowerCase()
    return familyVariances.value.has(variance)
  })
})
const visibleTotal = computed(() => visiblePolicies.value.length)

/* ---------------- Server-side filters ---------------- */

/** Local filter state — bound to the inputs. */
const fromDate = ref('')      // YYYY-MM-DD (native input)
const toDate = ref('')        // YYYY-MM-DD (native input)
const policyType = ref('')    // PM / CV / SB / TR / MC
const niidStatus = ref('')    // free text — sent as-is

/** Snapshot of the filters most recently applied to the API. */
const appliedFilters = ref({
  fromDate: '',
  toDate: '',
  policyType: '',
  niidStatus: '',
})

const insuranceClassOptions = Object.entries(INSURANCE_CLASS_TO_CODE).map(([cls, code]) => ({
  code,
  label: INSURANCE_CLASS_LABELS[cls as keyof typeof INSURANCE_CLASS_LABELS],
}))

const NIID_STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'SUBMITTED', 'FAILED', 'EXPIRED']

const hasActiveFilters = computed(() =>
  Boolean(
    appliedFilters.value.fromDate
    || appliedFilters.value.toDate
    || appliedFilters.value.policyType
    || appliedFilters.value.niidStatus,
  ),
)

/** Convert <input type="date"> value (YYYY-MM-DD) to the API's DD-MM-YYYY format. */
function toApiDate(yyyyMmDd: string): string {
  if (!yyyyMmDd) return ''
  const [y, m, d] = yyyyMmDd.split('-')
  if (!y || !m || !d) return ''
  return `${d}-${m}-${y}`
}

function buildParams(page = 1) {
  const f = appliedFilters.value
  return {
    page,
    fromDate: toApiDate(f.fromDate) || undefined,
    toDate: toApiDate(f.toDate) || undefined,
    policyType: f.policyType || undefined,
    niidStatus: f.niidStatus || undefined,
  }
}

async function applyFilters() {
  appliedFilters.value = {
    fromDate: fromDate.value,
    toDate: toDate.value,
    policyType: policyType.value,
    niidStatus: niidStatus.value,
  }
  await motor.fetchPolicies(props.family, buildParams(1)).catch(() => {})
}

async function resetFilters() {
  fromDate.value = ''
  toDate.value = ''
  policyType.value = ''
  niidStatus.value = ''
  appliedFilters.value = { fromDate: '', toDate: '', policyType: '', niidStatus: '' }
  await motor.fetchPolicies(props.family, { page: 1 }).catch(() => {})
}

onMounted(() => {
  if (policiesFamily.value !== props.family || !policies.value.length) {
    motor.fetchPolicies(props.family).catch(() => {})
  }
})

function statusClass(status: string) {
  const s = (status || '').toLowerCase()
  if (s === 'active' || s === 'success' || s === 'paid')
    return 'bg-primary-50 text-primary-700'
  if (s === 'pending') return 'bg-warning/15 text-warning'
  if (s === 'expired' || s === 'failed' || s === 'declined')
    return 'bg-tertiary-50 text-tertiary-600'
  return 'bg-secondary-100 text-secondary-700'
}

function holderName(p: { first_name: string | null; last_name?: string | null; surname?: string | null; company_name: string | null }) {
  if (p.company_name) return p.company_name
  return [p.first_name, p.last_name ?? p.surname].filter(Boolean).join(' ') || '—'
}

function vehicleMakeName(p: { vehicle_make?: { name: string } | string | null }): string {
  if (!p.vehicle_make) return ''
  return typeof p.vehicle_make === 'string' ? p.vehicle_make : (p.vehicle_make.name ?? '')
}

function vehicleModelName(p: { vehicle_model?: { name: string } | string | null }): string {
  if (!p.vehicle_model) return ''
  return typeof p.vehicle_model === 'string' ? p.vehicle_model : (p.vehicle_model.name ?? '')
}

function derivedStatus(p: { status?: string; expiration_date?: string; is_redeemed?: number }): string {
  if (p.status) return p.status
  if (p.is_redeemed) return 'Redeemed'
  if (p.expiration_date) {
    const exp = new Date(p.expiration_date)
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return 'Expired'
  }
  return 'Active'
}

async function refresh() {
  await motor.fetchPolicies(props.family, buildParams(policiesPage.value)).catch(() => {})
}

async function goToPage(page: number) {
  if (page < 1 || page > policiesLastPage.value || page === policiesPage.value) return
  await motor.fetchPolicies(props.family, buildParams(page)).catch(() => {})
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-primary-100">
          <FileText class="size-6 text-primary-700" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            {{ category }}
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">My policies</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            {{ subtitle }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="policiesLoading"
          @click="refresh"
        >
          <RefreshCw :class="['size-4', policiesLoading && 'animate-spin']" />
          Refresh
        </button>
        <NuxtLink :to="buyHref" class="btn-primary text-sm">
          <Plus class="size-4" />
          Buy policy
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <section class="card p-5">
      <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Filter class="size-4 text-secondary-500" />
          <h2 class="text-sm font-semibold text-secondary-900">Filters</h2>
          <span
            v-if="hasActiveFilters"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700"
          >
            Active
          </span>
        </div>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="inline-flex items-center gap-1 text-xs font-semibold text-secondary-600 hover:text-secondary-900 cursor-pointer"
          :disabled="policiesLoading"
          @click="resetFilters"
        >
          <X class="size-3.5" /> Clear all
        </button>
      </header>

      <form
        :class="[
          'grid grid-cols-1 gap-3 sm:grid-cols-2',
          isThirdParty ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
        ]"
        @submit.prevent="applyFilters"
      >
        <div>
          <label class="input-label" for="filter-from-date">From date</label>
          <input
            id="filter-from-date"
            v-model="fromDate"
            type="date"
            class="input-field"
          >
        </div>
        <div>
          <label class="input-label" for="filter-to-date">To date</label>
          <input
            id="filter-to-date"
            v-model="toDate"
            type="date"
            :min="fromDate || undefined"
            class="input-field"
          >
        </div>
        <div v-if="!isThirdParty">
          <label class="input-label" for="filter-policy-type">Policy type</label>
          <select id="filter-policy-type" v-model="policyType" class="input-field">
            <option value="">All classes</option>
            <option v-for="opt in insuranceClassOptions" :key="opt.code" :value="opt.code">
              {{ opt.label }} ({{ opt.code }})
            </option>
          </select>
        </div>
        <div>
          <label class="input-label" for="filter-niid-status">NIID status</label>
          <select id="filter-niid-status" v-model="niidStatus" class="input-field">
            <option value="">All statuses</option>
            <option v-for="s in NIID_STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div
          :class="[
            'flex flex-wrap justify-end gap-2 pt-1 sm:col-span-2',
            isThirdParty ? 'lg:col-span-3' : 'lg:col-span-4',
          ]"
        >
          <button
            v-if="hasActiveFilters"
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="policiesLoading"
            @click="resetFilters"
          >
            Reset
          </button>
          <button
            type="submit"
            class="btn-primary text-sm"
            :disabled="policiesLoading"
          >
            <span
              v-if="policiesLoading"
              class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <Filter v-else class="size-4" />
            {{ policiesLoading ? 'Applying…' : 'Apply filters' }}
          </button>
        </div>
      </form>
    </section>

    <div class="card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-4 py-4">
        <div>
          <h2 class="text-base font-semibold text-secondary-900">Policies</h2>
          <p class="text-xs text-secondary-500">{{ visibleTotal }} total</p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="policiesLoading && policies.length === 0" class="divide-y divide-secondary-100">
        <div v-for="i in 5" :key="i" class="grid grid-cols-12 gap-4 px-4 py-4">
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-3 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
          <div class="col-span-2 h-4 animate-pulse rounded bg-secondary-100" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="policiesError" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
          <AlertTriangle class="size-6 text-tertiary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">Couldn't load your policies</p>
        <p class="max-w-md text-sm text-secondary-500">{{ policiesError }}</p>
        <button type="button" class="btn-outline text-sm mt-2" @click="refresh">
          <RefreshCw class="size-4" /> Try again
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="visiblePolicies.length === 0" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
          <Inbox class="size-6 text-secondary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">No motor policies yet</p>
        <p class="max-w-md text-sm text-secondary-500">
          Buy your first motor policy to start protecting your vehicle.
        </p>
        <NuxtLink :to="buyHref" class="btn-primary text-sm mt-2">
          <Plus class="size-4" /> Buy policy
        </NuxtLink>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-secondary-50 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
            <tr>
              <th class="px-4 py-3">Policy number</th>
              <th class="px-4 py-3">Holder</th>
              <th class="px-4 py-3">Vehicle</th>
              <th class="px-4 py-3">Registration</th>
              <th class="px-4 py-3 text-right">Premium</th>
              <th class="px-4 py-3">Cover period</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary-100">
            <tr
              v-for="policy in visiblePolicies"
              :key="policy.id"
              class="transition-colors hover:bg-secondary-50/50"
            >
              <td class="px-4 py-4">
                <p class="font-semibold text-secondary-900">{{ policy.policy_number }}</p>
                <p class="text-xs text-secondary-500">{{ policy.certificate_number }}</p>
              </td>
              <td class="px-4 py-4">
                <p class="font-medium text-secondary-900">{{ holderName(policy) }}</p>
                <p class="text-xs text-secondary-500">{{ policy.email }}</p>
              </td>
              <td class="px-4 py-4 text-secondary-700">
                <p class="font-medium text-secondary-900">
                  {{ vehicleMakeName(policy) || '—' }} {{ vehicleModelName(policy) }}
                </p>
                <p class="text-xs text-secondary-500">
                  {{ policy.year_of_make }} · {{ policy.vehicle_color }}
                </p>
              </td>
              <td class="px-4 py-4 text-secondary-700">{{ policy.registration_number }}</td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(policy.premium) }}
              </td>
              <td class="px-4 py-4 text-secondary-700">
                <p class="text-xs">{{ formatDate(policy.effective_cover_date) }}</p>
                <p class="text-xs text-secondary-500">to {{ formatDate(policy.expiration_date) }}</p>
              </td>
              <td class="px-4 py-4">
                <span :class="['inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', statusClass(derivedStatus(policy))]">
                  {{ derivedStatus(policy) }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <NuxtLink
                  :to="{ path: `/motor/policy/${policy.id}`, query: { family } }"
                  class="inline-flex size-8 items-center justify-center rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 cursor-pointer"
                  aria-label="View policy"
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
        v-if="visiblePolicies.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-secondary-100 px-4 py-4"
      >
        <p class="text-xs text-secondary-500">
          Page <span class="font-semibold text-secondary-900">{{ policiesPage }}</span>
          of <span class="font-semibold text-secondary-900">{{ policiesLastPage }}</span>
          · {{ visibleTotal }} policies
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="policiesLoading || policiesPage <= 1"
            @click="goToPage(policiesPage - 1)"
          >
            <ChevronLeft class="size-4" /> Previous
          </button>
          <button
            type="button"
            class="btn-ghost border border-secondary-100 text-sm"
            :disabled="policiesLoading || policiesPage >= policiesLastPage"
            @click="goToPage(policiesPage + 1)"
          >
            Next <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
