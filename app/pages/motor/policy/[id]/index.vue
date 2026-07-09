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
  Car,
  Download,
  Printer,
  Pencil,
} from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import { useMotorStore } from '~/stores/motor'
import { formatNaira, formatDate } from '~/utils/format'
import { familyForVariance } from '~/utils/motor-constants'
import type { MotorPolicyFamily } from '~/types/motor'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const id = computed(() => Number(route.params.id))

/** Hint for which endpoint to use, set by the link that brought the user here. */
const familyHint = computed<MotorPolicyFamily | undefined>(() => {
  const q = route.query.family
  if (q === 'comprehensive' || q === 'third_party') return q
  return undefined
})

const motor = useMotorStore()
const { policyById, policyDetailLoading, policyDetailError, printLoading, downloadLoading } = storeToRefs(motor)

const policy = computed(() => policyById.value[id.value])

/** Resolved family — prefer the hint, fall back to the loaded policy's variance. */
const resolvedFamily = computed<MotorPolicyFamily | undefined>(() =>
  familyHint.value ?? familyForVariance(policy.value?.variance) ?? undefined,
)

/**
 * Whether this policy is third-party. Only the comprehensive (EZ Drive) family
 * uses the /variance/certificate endpoint; everything else — plain third party
 * and all Motor Protect Extra variants — is served from /customer/certificate.
 * We treat "not comprehensive" as third-party so an unmatched variance or a
 * missing family hint still resolves to the correct endpoint.
 */
const isThirdParty = computed(() => {
  if (resolvedFamily.value === 'third_party') return true
  if (resolvedFamily.value === 'comprehensive') return false
  const variance = (policy.value?.variance ?? '').toLowerCase()
  return !(variance.includes('comprehensive') || variance.includes('ez'))
})

await motor.fetchPolicy(id.value, familyHint.value).catch(() => {})

async function refresh() {
  await motor.fetchPolicy(id.value, resolvedFamily.value).catch(() => {})
}

async function printCertificate() {
  if (!policy.value?.certificate_number) {
    toast.error('No certificate number on this policy')
    return
  }
  try {
    await motor.printCertificate(policy.value.certificate_number, isThirdParty.value)
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
    await motor.downloadCertificate(policy.value.certificate_number, isThirdParty.value)
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
  const s = (status || '').toLowerCase()
  if (s === 'active' || s === 'success' || s === 'paid')
    return 'bg-primary-50 text-primary-700'
  if (s === 'pending') return 'bg-warning/15 text-warning'
  if (s === 'expired' || s === 'failed' || s === 'declined')
    return 'bg-tertiary-50 text-tertiary-600'
  return 'bg-secondary-100 text-secondary-700'
}

const modifyHref = computed(() => {
  const family = resolvedFamily.value
  return `/motor/policy/${id.value}/modify${family ? `?family=${family}` : ''}`
})

const backHref = computed(() => {
  const family = resolvedFamily.value
  if (family === 'third_party') return '/motor/third-party/my-policies'
  if (family === 'comprehensive') return '/motor/comprehensive/my-policies'
  // Last-resort fallback when neither query hint nor loaded policy is available.
  const variance = (policy.value?.variance ?? '').toLowerCase()
  if (variance.includes('comprehensive') || variance.includes('ez')) {
    return '/motor/comprehensive/my-policies'
  }
  return '/motor/third-party/my-policies'
})

function vehicleMakeName(p: { vehicle_make?: { name: string } | string | null } | null | undefined): string {
  if (!p?.vehicle_make) return ''
  return typeof p.vehicle_make === 'string' ? p.vehicle_make : (p.vehicle_make.name ?? '')
}

function vehicleModelName(p: { vehicle_model?: { name: string } | string | null } | null | undefined): string {
  if (!p?.vehicle_model) return ''
  return typeof p.vehicle_model === 'string' ? p.vehicle_model : (p.vehicle_model.name ?? '')
}

function derivedStatus(p: { status?: string; expiration_date?: string; is_redeemed?: number } | null | undefined): string {
  if (!p) return ''
  if (p.status) return p.status
  if (p.is_redeemed) return 'Redeemed'
  if (p.expiration_date) {
    const exp = new Date(p.expiration_date)
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return 'Expired'
  }
  return 'Active'
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Top bar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink
        :to="backHref"
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
          v-if="policy"
          :to="modifyHref"
          class="btn-ghost border border-secondary-100 text-sm"
        >
          <Pencil class="size-4" /> Modify policy
        </NuxtLink>
        <button
          type="button"
          class="btn-ghost border border-secondary-100 text-sm"
          :disabled="printLoading || !policy?.certificate_number"
          @click="printCertificate"
        >
          <span
            v-if="printLoading"
            class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <Printer v-else class="size-4" /> Print
        </button>
        <button
          type="button"
          class="btn-primary text-sm"
          :disabled="downloadLoading || !policy?.certificate_number"
          @click="downloadCertificate"
        >
          <span
            v-if="downloadLoading"
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

    <!-- Detail -->
    <template v-else-if="policy">
      <section
        class="relative overflow-hidden rounded-3xl border border-secondary-100 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-secondary-100 dark:to-secondary-50 dark:bg-none p-6 sm:p-8"
      >
        <div class="absolute -right-16 -top-16 size-64 rounded-full bg-card/40 blur-3xl" aria-hidden="true" />

        <div class="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
              Motor · {{ policy.variance || policy.policy_type }}
            </p>
            <h1 class="mt-2 text-2xl font-bold text-secondary-900 sm:text-3xl">
              {{ policy.policy_number }}
            </h1>
            <p class="mt-1 text-sm text-secondary-700">
              Certificate <span class="font-medium">{{ policy.certificate_number }}</span>
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span :class="['inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize', statusClass(derivedStatus(policy))]">
                {{ derivedStatus(policy) }}
              </span>
              <span class="inline-flex rounded-full bg-card/80 border border-secondary-200 px-3 py-1 text-xs font-semibold text-secondary-700">
                {{ policy.registration_number }}
              </span>
              <span class="inline-flex rounded-full bg-card/80 border border-secondary-200 px-3 py-1 text-xs font-semibold text-secondary-700 capitalize">
                {{ policy.holder_type }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Premium</p>
              <p class="mt-1 text-lg font-bold text-secondary-900 tabular-nums">{{ formatNaira(policy.premium) }}</p>
            </div>
            <div v-if="policy.car_value">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Car value</p>
              <p class="mt-1 text-lg font-bold text-secondary-900 tabular-nums">{{ formatNaira(policy.car_value) }}</p>
            </div>
            <div class="col-span-2 sm:col-span-1">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Cover period</p>
              <p class="mt-1 text-sm font-semibold text-secondary-900">{{ formatDate(policy.effective_cover_date) }}</p>
              <p class="text-xs text-secondary-600">to {{ formatDate(policy.expiration_date) }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <!-- Vehicle -->
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <Car class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Vehicle</h2>
            </header>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Registration</dt>
                <dd class="mt-1 text-sm font-semibold text-secondary-900">{{ policy.registration_number }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Make / Model</dt>
                <dd class="mt-1 text-sm text-secondary-900">
                  {{ vehicleMakeName(policy) || '—' }} {{ vehicleModelName(policy) }}
                </dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Year</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ policy.year_of_make || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Color</dt>
                <dd class="mt-1 text-sm text-secondary-900 capitalize">{{ policy.vehicle_color || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Vehicle type</dt>
                <dd class="mt-1 text-sm text-secondary-900 capitalize">{{ policy.vehicle_type || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Policy class</dt>
                <dd class="mt-1 text-sm text-secondary-900">{{ policy.policy_type || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Chassis number</dt>
                <dd class="mt-1 text-sm text-secondary-900 break-all">{{ policy.chasis_number || '—' }}</dd>
              </div>
              <div>
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Engine number</dt>
                <dd class="mt-1 text-sm text-secondary-900 break-all">{{ policy.engine_number || '—' }}</dd>
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
              <div v-if="policy.id_number">
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">
                  {{ policy.identification || 'ID' }}
                </dt>
                <dd class="mt-1 flex items-center gap-2 text-sm text-secondary-900">
                  <IdCard class="size-4 text-secondary-400" />
                  <span>{{ policy.id_number }}</span>
                </dd>
              </div>
              <div v-if="policy.sector">
                <dt class="text-[10px] font-semibold uppercase tracking-widest text-secondary-500">Sector</dt>
                <dd class="mt-1 text-sm text-secondary-900">
                  {{ policy.sector }}
                  <span v-if="policy.sector_code" class="text-secondary-500">· {{ policy.sector_code }}</span>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="card p-6">
            <header class="mb-4 flex items-center gap-2">
              <Wallet class="size-5 text-primary-700" />
              <h2 class="text-base font-semibold text-secondary-900">Premium &amp; payment</h2>
            </header>
            <dl class="space-y-4">
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Premium</dt>
                <dd class="text-sm font-bold text-secondary-900 tabular-nums">{{ formatNaira(policy.premium) }}</dd>
              </div>
              <div v-if="policy.premium_type" class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Plan</dt>
                <dd class="text-sm font-medium text-secondary-900 capitalize">{{ policy.premium_type?.toLowerCase().replace('_', ' ') }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Payment method</dt>
                <dd class="text-sm font-medium text-secondary-900 capitalize">{{ policy.payment_method?.toLowerCase() || '—' }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-xs text-secondary-500">Payment status</dt>
                <dd class="text-sm font-medium text-secondary-900 capitalize">{{ policy.payment_status || 'Pending' }}</dd>
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
              <div v-if="policy.variance">
                <dt class="text-xs text-secondary-500">Variant</dt>
                <dd class="mt-0.5 font-medium text-secondary-900">{{ policy.variance }}</dd>
              </div>
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
