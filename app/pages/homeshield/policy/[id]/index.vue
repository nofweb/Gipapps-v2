<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  IdCard,
  Wallet,
  CalendarDays,
  Building2,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  Edit3,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useHomeshieldStore } from '~/stores/homeshield'
import { formatNaira, formatDate } from '~/utils/format'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const id = computed(() => Number(route.params.id))

const homeshield = useHomeshieldStore()
const { policyById, policyDetailLoading, policyDetailError, certificateLoading } = storeToRefs(homeshield)

const policy = computed(() => policyById.value[id.value])

await homeshield.fetchPolicy(id.value).catch(() => {})

async function refresh() {
  await homeshield.fetchPolicy(id.value).catch(() => {})
}

async function printCertificate() {
  if (!policy.value?.certificate_number) {
    toast.error('No certificate number on this policy')
    return
  }
  try {
    await homeshield.printCertificate(policy.value.certificate_number)
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not print certificate')
  }
}

async function downloadCertificate() {
  if (!policy.value?.certificate_number) {
    toast.error('No certificate number on this policy')
    return
  }
  try {
    await homeshield.downloadCertificate(policy.value.certificate_number)
    toast.success('Certificate downloaded')
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not download certificate')
  }
}

function holderName() {
  if (!policy.value) return '—'
  if (policy.value.company_name) return policy.value.company_name
  return [policy.value.first_name, policy.value.last_name]
    .filter(Boolean)
    .map(s => (s as string).replace(/\b\w/g, c => c.toUpperCase()))
    .join(' ') || '—'
}

function statusClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'success' || s === 'paid')
    return 'bg-primary-50 text-primary-700'
  if (s === 'pending') return 'bg-warning/15 text-warning'
  if (s === 'expired' || s === 'failed' || s === 'declined')
    return 'bg-tertiary-50 text-tertiary-600'
  return 'bg-secondary-100 text-secondary-700'
}

const groupedAnswers = computed(() => policy.value?.questionnaire_answers ?? [])
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Top bar: back + actions -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink
        to="/homeshield/my-policies"
        class="inline-flex items-center gap-2 text-sm font-semibold text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft class="size-4" />
        Back to my policies
      </NuxtLink>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="policyDetailLoading"
          @click="refresh"
        >
          <RefreshCw :class="['size-4', policyDetailLoading && 'animate-spin']" />
          Refresh
        </button>
        <NuxtLink
          :to="`/homeshield/policy/${id}/modify`"
          class="btn-ghost border border-secondary-100 text-sm"
        >
          <Edit3 class="size-4" /> Modify
        </NuxtLink>
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="certificateLoading || !policy?.certificate_number"
          @click="printCertificate"
        >
          <span
            v-if="certificateLoading"
            class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <Printer v-else class="size-4" /> Print
        </button>
        <button
          type="button"
          class="btn-primary text-sm"
          :disabled="certificateLoading || !policy?.certificate_number"
          @click="downloadCertificate"
        >
          <span
            v-if="certificateLoading"
            class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <Download v-else class="size-4" /> Download
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="policyDetailLoading && !policy" class="card p-10 text-center">
      <div class="mx-auto size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p class="mt-3 text-sm text-secondary-500">Loading policy…</p>
    </div>

    <!-- Error -->
    <div v-else-if="policyDetailError && !policy" class="card flex flex-col items-center gap-3 p-10 text-center">
      <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
        <AlertTriangle class="size-6 text-tertiary-500" />
      </div>
      <p class="text-sm font-semibold text-secondary-900">Couldn't load this policy</p>
      <p class="max-w-md text-sm text-secondary-500">{{ policyDetailError }}</p>
      <button type="button" class="btn-outline text-sm mt-2" @click="refresh">
        <RefreshCw class="size-4" /> Try again
      </button>
    </div>

    <!-- Policy detail -->
    <template v-else-if="policy">
      <!-- Hero -->
      <section
        class="relative overflow-hidden rounded-3xl border border-secondary-100 bg-gradient-to-br from-tertiary-100 to-tertiary-50 dark:from-secondary-100 dark:to-secondary-50 dark:bg-none p-6 sm:p-8"
      >
        <div class="absolute -right-16 -top-16 size-64 rounded-full bg-card/40 blur-3xl" aria-hidden="true" />

        <div class="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
              Homeshield · {{ policy.category }}
            </p>
            <h1 class="mt-2 text-2xl font-bold text-secondary-900 sm:text-3xl">
              {{ policy.policy_number }}
            </h1>
            <p class="mt-1 text-sm text-secondary-700">
              Certificate <span class="font-medium">{{ policy.certificate_number }}</span>
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize', statusClass(policy.status)]">
                {{ policy.status }}
              </span>
              <span class="inline-flex rounded-full bg-card/80 border border-secondary-200 px-3 py-1 text-xs font-semibold text-secondary-700">
                {{ policy.policy_type }}
              </span>
              <span class="inline-flex rounded-full bg-card/80 border border-secondary-200 px-3 py-1 text-xs font-semibold text-secondary-700">
                {{ policy.holder_type }} · {{ policy.owner_type }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Premium</p>
              <p class="mt-1 text-lg font-bold text-secondary-900 tabular-nums">
                {{ formatNaira(policy.premium) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Property value</p>
              <p class="mt-1 text-lg font-bold text-secondary-900 tabular-nums">
                {{ formatNaira(policy.value_of_property) }}
              </p>
            </div>
            <div class="col-span-2 sm:col-span-1">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Cover period</p>
              <p class="mt-1 text-sm font-semibold text-secondary-900">
                {{ formatDate(policy.effective_cover_date) }}
              </p>
              <p class="text-xs text-secondary-600">
                to {{ formatDate(policy.expiration_date) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left column -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Property -->
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <Building2 class="size-5 text-tertiary-500" />
              <h2 class="text-base font-semibold text-secondary-900">Property</h2>
            </header>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Address</dt>
                <dd class="mt-1 flex items-start gap-2 text-sm text-secondary-900">
                  <MapPin class="size-4 mt-0.5 shrink-0 text-secondary-400" />
                  <span>{{ policy.property_address }}</span>
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Type</dt>
                <dd class="mt-1 text-sm text-secondary-900 capitalize">{{ policy.property_type }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Value of property</dt>
                <dd class="mt-1 text-sm font-semibold text-secondary-900 tabular-nums">
                  {{ formatNaira(policy.value_of_property) }}
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Category</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ policy.category }}</dd>
              </div>
            </dl>
          </section>

          <!-- Holder -->
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <ShieldCheck class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Policy holder</h2>
            </header>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Name</dt>
                <dd class="mt-1 text-sm font-medium text-secondary-900">{{ holderName() }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Email</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-secondary-900">
                  <Mail class="size-4 text-secondary-400" />
                  <a :href="`mailto:${policy.email}`" class="hover:underline">{{ policy.email }}</a>
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Phone</dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-secondary-900">
                  <Phone class="size-4 text-secondary-400" />
                  <a :href="`tel:${policy.phone_number}`" class="hover:underline">{{ policy.phone_number }}</a>
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Contact address</dt>
                <dd class="mt-1 flex items-start gap-2 text-sm text-secondary-900">
                  <MapPin class="size-4 mt-0.5 shrink-0 text-secondary-400" />
                  <span>{{ policy.contact_address }}</span>
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">
                  {{ policy.identification_type?.toUpperCase() || 'ID' }}
                </dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-secondary-900">
                  <IdCard class="size-4 text-secondary-400" />
                  <span>{{ policy.identification_number }}</span>
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Sector</dt>
                <dd class="mt-1 text-sm text-secondary-900">
                  {{ policy.sector }}
                  <span v-if="policy.sector_code" class="text-secondary-500">· {{ policy.sector_code }}</span>
                </dd>
              </div>
            </dl>
          </section>

          <!-- Questionnaire -->
          <section class="card overflow-hidden">
            <header class="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
              <h2 class="text-base font-semibold text-secondary-900">Proposal questionnaire</h2>
              <span class="text-xs text-secondary-500">{{ groupedAnswers.length }} questions</span>
            </header>
            <ul class="divide-y divide-secondary-100">
              <li v-for="entry in groupedAnswers" :key="entry.id" class="px-6 py-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <p class="max-w-3xl text-sm font-medium text-secondary-900">
                    {{ entry.questionnaire?.requires_details }}
                  </p>
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                      entry.answer === 'yes' ? 'bg-primary-50 text-primary-700' : 'bg-secondary-100 text-secondary-700',
                    ]"
                  >
                    <CheckCircle2 v-if="entry.answer === 'yes'" class="size-3.5" />
                    <XCircle v-else class="size-3.5" />
                    {{ entry.answer }}
                  </span>
                </div>
                <p v-if="entry.details" class="mt-2 rounded-xl bg-secondary-50 px-3 py-2 text-xs text-secondary-700">
                  {{ entry.details }}
                </p>
              </li>
            </ul>
          </section>
        </div>

        <!-- Right column -->
        <aside class="space-y-6">
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <Wallet class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Premium & payment</h2>
            </header>
            <dl class="space-y-4">
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Premium</dt>
                <dd class="text-sm font-bold text-secondary-900 tabular-nums">{{ formatNaira(policy.premium) }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Payment method</dt>
                <dd class="text-sm font-medium text-secondary-900 capitalize">{{ policy.payment_method?.toLowerCase() || '—' }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Payment status</dt>
                <dd class="text-sm font-medium text-secondary-900 capitalize">{{ policy.payment_status || 'Pending' }}</dd>
              </div>
              <div v-if="policy.new_balance" class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">New balance</dt>
                <dd class="text-sm font-medium text-secondary-900 tabular-nums">{{ formatNaira(policy.new_balance) }}</dd>
              </div>
            </dl>
          </section>

          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <CalendarDays class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Cover</h2>
            </header>
            <dl class="space-y-4 text-sm">
              <div>
                <dt class="text-xs text-secondary-500">Effective from</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ formatDate(policy.effective_cover_date) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-secondary-500">Expires</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ formatDate(policy.expiration_date) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-secondary-500">Created</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ policy.created_at }}</dd>
              </div>
              <div>
                <dt class="text-xs text-secondary-500">Last updated</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ policy.updated_at }}</dd>
              </div>
            </dl>
          </section>

          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <ShieldCheck class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">References</h2>
            </header>
            <dl class="space-y-4 text-sm">
              <div>
                <dt class="text-xs text-secondary-500">Policy number</dt>
                <dd class="mt-0.5 font-mono text-xs font-medium text-secondary-900 break-all">{{ policy.policy_number }}</dd>
              </div>
              <div>
                <dt class="text-xs text-secondary-500">Certificate number</dt>
                <dd class="mt-0.5 font-mono text-xs font-medium text-secondary-900 break-all">{{ policy.certificate_number }}</dd>
              </div>
              <div v-if="policy.niacom_code">
                <dt class="text-xs text-secondary-500">NIACOM code</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ policy.niacom_code }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
