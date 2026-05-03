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
} from 'lucide-vue-next'
import { useHomeshieldStore } from '~/stores/homeshield'
import { formatNaira, formatDate } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })

const homeshield = useHomeshieldStore()
const {
  policies,
  policiesLoading,
  policiesError,
  policiesPage,
  policiesLastPage,
  policiesTotal,
} = storeToRefs(homeshield)

await homeshield.fetchPolicies(1).catch(() => {})

function statusClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'success' || s === 'paid')
    return 'bg-primary-50 text-primary-700'
  if (s === 'pending') return 'bg-warning/15 text-warning'
  if (s === 'expired' || s === 'failed' || s === 'declined')
    return 'bg-tertiary-50 text-tertiary-600'
  return 'bg-secondary-100 text-secondary-700'
}

function holderName(p: { first_name: string | null; last_name: string | null; company_name: string | null }) {
  if (p.company_name) return p.company_name
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || '—'
}

async function refresh() {
  await homeshield.fetchPolicies(policiesPage.value).catch(() => {})
}

async function goToPage(page: number) {
  if (page < 1 || page > policiesLastPage.value || page === policiesPage.value) return
  await homeshield.fetchPolicies(page).catch(() => {})
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <FileText class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Homeshield
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">My policies</h1>
          <p class="mt-1 max-w-xl text-sm text-secondary-500">
            All homeshield policies on your account, ordered by most recent.
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
        <NuxtLink to="/homeshield/buy" class="btn-primary text-sm">
          <Plus class="size-4" />
          Buy policy
        </NuxtLink>
      </div>
    </div>

    <!-- Card -->
    <div class="card overflow-hidden">
      <!-- Card header -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-4 py-4">
        <div>
          <h2 class="text-base font-semibold text-secondary-900">Policies</h2>
          <p class="text-xs text-secondary-500">
            {{ policiesTotal }} total
          </p>
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
      <div v-else-if="policies.length === 0" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
          <Inbox class="size-6 text-secondary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">No homeshield policies yet</p>
        <p class="max-w-md text-sm text-secondary-500">
          Buy your first homeshield policy to start protecting your property.
        </p>
        <NuxtLink to="/homeshield/buy" class="btn-primary text-sm mt-2">
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
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Property</th>
              <th class="px-4 py-3 text-right">Sum insured</th>
              <th class="px-4 py-3 text-right">Premium</th>
              <th class="px-4 py-3">Cover period</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-secondary-100">
            <tr
              v-for="policy in policies"
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
                <span class="inline-flex items-center rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-700">
                  {{ policy.category }}
                </span>
              </td>
              <td class="px-4 py-4 text-secondary-700">
                <p class="font-medium text-secondary-900 capitalize">{{ policy.property_type }}</p>
                <p class="max-w-[14rem] truncate text-xs text-secondary-500">{{ policy.property_address }}</p>
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(policy.value_of_property) }}
              </td>
              <td class="px-4 py-4 text-right font-medium tabular-nums text-secondary-900">
                {{ formatNaira(policy.premium) }}
              </td>
              <td class="px-4 py-4 text-secondary-700">
                <p class="text-xs">{{ formatDate(policy.effective_cover_date) }}</p>
                <p class="text-xs text-secondary-500">to {{ formatDate(policy.expiration_date) }}</p>
              </td>
              <td class="px-4 py-4">
                <span :class="['inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', statusClass(policy.status)]">
                  {{ policy.status }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <NuxtLink
                  :to="`/homeshield/policy/${policy.id}`"
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
        v-if="policies.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-secondary-100 px-4 py-4"
      >
        <p class="text-xs text-secondary-500">
          Page <span class="font-semibold text-secondary-900">{{ policiesPage }}</span>
          of <span class="font-semibold text-secondary-900">{{ policiesLastPage }}</span>
          · {{ policiesTotal }} policies
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
