<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import {
  Receipt,
  Search,
  AlertTriangle,
  Inbox,
  RefreshCcw,
  Building2,
  Eye,
  ChevronRight,
  X,
  ShieldCheck,
  Calendar,
} from 'lucide-vue-next'
import { useHomeshieldStore } from '~/stores/homeshield'
import { formatNaira, formatDate } from '~/utils/format'
import type { HomeshieldPolicy } from '~/types/homeshield'

definePageMeta({ layout: 'default', middleware: 'auth' })

const homeshield = useHomeshieldStore()
const {
  searchResults,
  searchLoading,
  searchError,
  searchPerformed,
  renewLoading,
  renewingId,
} = storeToRefs(homeshield)

type SearchMode = 'policy_number' | 'insured_name'
const mode = ref<SearchMode>('policy_number')
const query = ref('')

onUnmounted(() => homeshield.clearSearch())

async function runSearch() {
  if (!query.value.trim()) {
    toast.warning('Enter a policy number or insured name')
    return
  }
  try {
    await homeshield.searchPolicy({ [mode.value]: query.value.trim() })
  }
  catch {
    toast.error(searchError.value || 'Search failed')
  }
}

function reset() {
  query.value = ''
  homeshield.clearSearch()
}

const confirmOpen = ref(false)
const pendingPolicy = ref<HomeshieldPolicy | null>(null)

function askRenew(policy: HomeshieldPolicy) {
  pendingPolicy.value = policy
  confirmOpen.value = true
}

async function confirmRenew() {
  const policy = pendingPolicy.value
  if (!policy) return
  confirmOpen.value = false
  try {
    const renewed = await homeshield.renewPolicy(policy.id)
    toast.success('Policy renewed successfully')
    if (renewed?.id) await navigateTo(`/homeshield/policy/${renewed.id}`)
    else await navigateTo(`/homeshield/policy/${policy.id}`)
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : 'Renewal failed')
  }
  finally {
    pendingPolicy.value = null
  }
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
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-start gap-4">
      <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
        <Receipt class="size-6 text-tertiary-500" />
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
          Homeshield
        </p>
        <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">Renew policy</h1>
        <p class="mt-1 max-w-xl text-sm text-secondary-500">
          Search by policy number or insured name, then renew with one click.
        </p>
      </div>
    </div>

    <!-- Search card -->
    <section class="card p-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in [
            { id: 'policy_number' as SearchMode, label: 'By policy number' },
            { id: 'insured_name' as SearchMode, label: 'By insured name' },
          ]"
          :key="opt.id"
          type="button"
          :aria-pressed="mode === opt.id"
          :class="[
            'rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
            mode === opt.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-secondary-100 bg-card text-secondary-700 hover:border-primary-200',
          ]"
          @click="mode = opt.id; reset()"
        >
          {{ opt.label }}
        </button>
      </div>

      <form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="runSearch">
        <div class="flex-1 min-w-[16rem]">
          <label class="input-label" :for="`q-${mode}`">
            {{ mode === 'policy_number' ? 'Policy number' : 'Insured name' }}
          </label>
          <div class="relative">
            <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
            <input
              :id="`q-${mode}`"
              v-model="query"
              type="text"
              class="input-field pl-11"
              :placeholder="mode === 'policy_number' ? 'GIP/CB/LL/05/26/0000025/WPL' : 'Insured name'"
            >
          </div>
        </div>
        <button
          type="submit"
          class="btn-primary h-11"
          :disabled="searchLoading"
        >
          <span
            v-if="searchLoading"
            class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <Search v-else class="size-4" />
          {{ searchLoading ? 'Searching…' : 'Search' }}
        </button>
        <button
          v-if="query || searchPerformed"
          type="button"
          class="btn-ghost border border-secondary-100 h-11"
          @click="reset"
        >
          <RefreshCcw class="size-4" /> Clear
        </button>
      </form>
    </section>

    <!-- Results -->
    <section class="card overflow-hidden">
      <header class="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
        <div>
          <h2 class="text-base font-semibold text-secondary-900">Results</h2>
          <p class="text-xs text-secondary-500">
            {{ searchResults.length || 0 }}
            {{ searchResults.length === 1 ? 'policy' : 'policies' }} found
          </p>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="searchLoading" class="divide-y divide-secondary-100">
        <div v-for="i in 3" :key="i" class="flex items-center gap-4 px-6 py-4">
          <div class="size-12 animate-pulse rounded-2xl bg-secondary-100" />
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/3 animate-pulse rounded bg-secondary-100" />
            <div class="h-3 w-2/3 animate-pulse rounded bg-secondary-100" />
          </div>
          <div class="h-9 w-24 animate-pulse rounded-xl bg-secondary-100" />
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="searchError"
        class="flex flex-col items-center gap-3 px-6 py-12 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
          <AlertTriangle class="size-6 text-tertiary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">Couldn't run that search</p>
        <p class="max-w-md text-sm text-secondary-500">{{ searchError }}</p>
      </div>

      <!-- Empty (after search) -->
      <div
        v-else-if="searchPerformed && searchResults.length === 0"
        class="flex flex-col items-center gap-3 px-6 py-12 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
          <Inbox class="size-6 text-secondary-500" />
        </div>
        <p class="text-sm font-semibold text-secondary-900">No matching policies</p>
        <p class="max-w-md text-sm text-secondary-500">
          Try a different policy number or insured name.
        </p>
      </div>

      <!-- Idle -->
      <div
        v-else-if="!searchPerformed"
        class="flex flex-col items-center gap-3 px-6 py-12 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
          <Search class="size-6 text-secondary-500" />
        </div>
        <p class="text-sm text-secondary-500">
          Enter a {{ mode === 'policy_number' ? 'policy number' : 'name' }} above to find a policy.
        </p>
      </div>

      <!-- List -->
      <ul v-else class="divide-y divide-secondary-100">
        <li
          v-for="p in searchResults"
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
            <p class="truncate text-xs text-secondary-500">{{ p.property_address }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-secondary-900 tabular-nums">
              {{ formatNaira(p.premium) }}
            </p>
            <span :class="['mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize', statusClass(p.status)]">
              {{ p.status }}
            </span>
            <p class="mt-0.5 text-[11px] text-secondary-500">
              Expires {{ formatDate(p.expiration_date) }}
            </p>
          </div>
          <div class="flex gap-2">
            <NuxtLink
              :to="`/homeshield/policy/${p.id}`"
              class="inline-flex size-10 items-center justify-center rounded-xl border border-secondary-100 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-800 cursor-pointer"
              aria-label="View policy"
            >
              <Eye class="size-4" />
            </NuxtLink>
            <button
              type="button"
              class="btn-primary text-sm"
              :disabled="renewLoading && renewingId === p.id"
              @click="askRenew(p)"
            >
              <span
                v-if="renewLoading && renewingId === p.id"
                class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                aria-hidden="true"
              />
              <RefreshCcw v-else class="size-4" />
              {{ renewLoading && renewingId === p.id ? 'Renewing…' : 'Renew' }}
              <ChevronRight v-if="!(renewLoading && renewingId === p.id)" class="size-4" />
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- Confirm renewal dialog -->
    <DialogRoot v-model:open="confirmOpen">
      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-50 bg-secondary-900/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-secondary-100 bg-card shadow-2xl focus:outline-none data-[state=open]:animate-scale-in"
        >
          <!-- Hero strip -->
          <div class="relative overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50 dark:from-secondary-100 dark:to-secondary-50 dark:bg-none px-6 pt-6 pb-5">
            <div class="absolute -right-10 -top-10 size-32 rounded-full bg-card/40 blur-3xl" aria-hidden="true" />
            <div class="relative flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow-primary">
                <RefreshCcw class="size-6" />
              </div>
              <div class="min-w-0">
                <DialogTitle class="text-lg font-bold leading-tight text-secondary-900">
                  Renew this policy?
                </DialogTitle>
                <DialogDescription class="mt-0.5 text-xs text-secondary-600">
                  Cover will extend by another year from today.
                </DialogDescription>
              </div>
            </div>
            <DialogClose
              class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-xl text-secondary-500 hover:bg-card/60 hover:text-secondary-800 cursor-pointer"
              aria-label="Close"
            >
              <X class="size-4" />
            </DialogClose>
          </div>

          <!-- Body -->
          <div class="space-y-4 px-6 py-5">
            <div v-if="pendingPolicy" class="rounded-2xl border border-secondary-100 bg-secondary-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
                {{ pendingPolicy.category }}
              </p>
              <p class="mt-1 font-bold text-secondary-900 break-all">
                {{ pendingPolicy.policy_number }}
              </p>
              <p class="text-xs text-secondary-500">{{ holderName(pendingPolicy) }}</p>
            </div>

            <dl v-if="pendingPolicy" class="grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-secondary-100 p-3">
                <dt class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-500">
                  <ShieldCheck class="size-3.5" /> Premium
                </dt>
                <dd class="mt-1 text-sm font-bold text-secondary-900 tabular-nums">
                  {{ formatNaira(pendingPolicy.premium) }}
                </dd>
              </div>
              <div class="rounded-xl border border-secondary-100 p-3">
                <dt class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-500">
                  <Calendar class="size-3.5" /> Current expiry
                </dt>
                <dd class="mt-1 text-sm font-bold text-secondary-900">
                  {{ formatDate(pendingPolicy.expiration_date) }}
                </dd>
              </div>
            </dl>

            <p class="rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
              The renewal premium will be charged using your default payment method.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col-reverse gap-2 border-t border-secondary-100 bg-secondary-50/40 px-6 py-4 sm:flex-row sm:justify-end">
            <DialogClose as-child>
              <button type="button" class="btn-ghost border border-secondary-100">
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              class="btn-primary"
              :disabled="renewLoading"
              @click="confirmRenew"
            >
              <span
                v-if="renewLoading"
                class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                aria-hidden="true"
              />
              <RefreshCcw v-else class="size-4" />
              {{ renewLoading ? 'Renewing…' : 'Yes, renew policy' }}
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
