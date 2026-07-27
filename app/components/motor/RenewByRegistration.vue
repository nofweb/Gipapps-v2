<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import {
  Receipt,
  Search,
  AlertTriangle,
  Inbox,
  RefreshCcw,
  Car,
  ShieldCheck,
  Calendar,
} from 'lucide-vue-next'
import { useMotorStore } from '~/stores/motor'
import { formatNaira, formatDate } from '~/utils/format'
import {
  variantsForFamily,
  MOTOR_CLASSES,
  INSURANCE_CLASS_TO_CODE,
  INDIVIDUAL_ID_LABELS,
  CORPORATE_ID_LABELS,
} from '~/utils/motor-constants'
import type { MotorPolicy, MotorRenewPayload } from '~/types/motor'

const props = defineProps<{
  category: string
  subtitle: string
  /** Preselects the Variant field for variant-specific renew pages (e.g. MPE). */
  variance?: string
}>()

const motor = useMotorStore()
const {
  searchResults,
  searchLoading,
  searchError,
  searchPerformed,
  renewLoading,
} = storeToRefs(motor)

/** POST /customer/search returns the matching policy (registration is unique). */
const policy = computed<MotorPolicy | null>(() => searchResults.value[0] ?? null)

const registration = ref('')

/* ---- Renew form (submitted to POST /customer/renew/{id}) ---- */
const form = reactive<MotorRenewPayload>({
  variance: '',
  id_number: '',
  identification: '',
  policy_type: '',
})

const variantOptions = computed(() => {
  const opts = variantsForFamily('third_party').map(v => ({ value: v.displayName, label: v.displayName }))
  // Keep the policy's own variance selectable even if it isn't a known variant.
  const current = form.variance
  if (current && !opts.some(o => o.value === current)) opts.unshift({ value: current, label: current })
  return opts
})

const policyTypeOptions = computed(() => {
  const opts = MOTOR_CLASSES.map(c => ({ value: INSURANCE_CLASS_TO_CODE[c.id], label: c.label }))
  const current = form.policy_type
  if (current && !opts.some(o => o.value === current)) opts.unshift({ value: current, label: current })
  return opts
})

const identificationOptions = computed(() => {
  const opts = [
    ...Object.values(INDIVIDUAL_ID_LABELS),
    ...Object.values(CORPORATE_ID_LABELS),
  ].map(l => ({ value: l, label: l }))
  const current = form.identification
  if (current && !opts.some(o => o.value === current)) opts.unshift({ value: current, label: current })
  return opts
})

function applyPolicyToForm(p: MotorPolicy) {
  form.variance = p.variance || props.variance || ''
  form.id_number = p.id_number || ''
  form.identification = p.identification || ''
  form.policy_type = p.policy_type || ''
}

onUnmounted(() => motor.clearSearch())

async function runSearch() {
  const reg = registration.value.trim()
  if (!reg) {
    toast.warning('Enter a vehicle registration number')
    return
  }
  try {
    const list = await motor.searchPolicy('third_party', { registration_number: reg })
    if (list[0]) {
      applyPolicyToForm(list[0])
    }
    else {
      toast.error('No policy found for this registration number')
    }
  }
  catch {
    toast.error(searchError.value || 'Search failed')
  }
}

function reset() {
  registration.value = ''
  motor.clearSearch()
}

function holderName(p: { first_name: string | null; last_name?: string | null; company_name: string | null }) {
  if (p.company_name) return p.company_name
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || '—'
}

function validate(): string | null {
  if (!form.variance) return 'Select a variant'
  if (!form.policy_type) return 'Select a policy type'
  if (!form.identification) return 'Select an identification'
  if (!form.id_number.trim()) return 'Enter an identification number'
  return null
}

async function submitRenewal() {
  const current = policy.value
  if (!current) {
    toast.error('Search for a policy before renewing')
    return
  }
  const error = validate()
  if (error) {
    toast.warning(error)
    return
  }
  const payload: MotorRenewPayload = {
    variance: form.variance,
    id_number: form.id_number.trim(),
    identification: form.identification,
    policy_type: form.policy_type,
  }
  try {
    const renewed = await motor.renewPolicy('third_party', current.id, payload)
    toast.success('Policy renewed successfully')
    const targetId = renewed?.id ?? current.id
    await navigateTo({ path: `/motor/policy/${targetId}`, query: { family: 'third_party' } })
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : 'Renewal failed')
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-start gap-4">
      <div class="flex size-12 items-center justify-center rounded-2xl bg-primary-100">
        <Receipt class="size-6 text-primary-700" />
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
          {{ category }}
        </p>
        <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">Renew policy</h1>
        <p class="mt-1 max-w-xl text-sm text-secondary-500">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <section class="card p-6">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="runSearch">
        <div class="flex-1 min-w-[16rem]">
          <label class="input-label" for="renew-reg">Vehicle registration number</label>
          <div class="relative">
            <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
            <input
              id="renew-reg"
              v-model="registration"
              type="text"
              class="input-field pl-11 uppercase"
              placeholder="e.g. GGE539JK"
            >
          </div>
        </div>
        <button type="submit" class="btn-primary h-11" :disabled="searchLoading">
          <span
            v-if="searchLoading"
            class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <Search v-else class="size-4" />
          {{ searchLoading ? 'Searching…' : 'Search policy' }}
        </button>
        <button
          v-if="registration || searchPerformed"
          type="button"
          class="btn-ghost border border-secondary-100 h-11"
          @click="reset"
        >
          <RefreshCcw class="size-4" /> Clear
        </button>
      </form>
    </section>

    <section v-if="searchLoading" class="card p-6">
      <div class="flex items-center gap-4">
        <div class="size-12 animate-pulse rounded-2xl bg-secondary-100" />
        <div class="flex-1 space-y-2">
          <div class="h-3 w-1/3 animate-pulse rounded bg-secondary-100" />
          <div class="h-3 w-2/3 animate-pulse rounded bg-secondary-100" />
        </div>
      </div>
    </section>

    <section
      v-else-if="searchError"
      class="card flex flex-col items-center gap-3 px-6 py-12 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
        <AlertTriangle class="size-6 text-tertiary-500" />
      </div>
      <p class="text-sm font-semibold text-secondary-900">Couldn't run that search</p>
      <p class="max-w-md text-sm text-secondary-500">{{ searchError }}</p>
    </section>

    <section
      v-else-if="searchPerformed && !policy"
      class="card flex flex-col items-center gap-3 px-6 py-12 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
        <Inbox class="size-6 text-secondary-500" />
      </div>
      <p class="text-sm font-semibold text-secondary-900">No matching policy</p>
      <p class="max-w-md text-sm text-secondary-500">Check the registration number and try again.</p>
    </section>

    <section v-else-if="policy" class="card overflow-hidden">
      <div class="flex flex-wrap items-center gap-4 border-b border-secondary-100 px-6 py-5">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-primary-50">
          <Car class="size-6 text-primary-700" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-secondary-900">{{ holderName(policy) }}</p>
          <p class="text-sm text-secondary-500">
            {{ policy.policy_number }} · {{ policy.registration_number }}
          </p>
          <p class="truncate text-xs text-secondary-500">
            {{ policy.vehicle_make }} {{ policy.vehicle_model }} · {{ policy.year_of_make }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm font-semibold text-secondary-900 tabular-nums">{{ formatNaira(policy.premium) }}</p>
          <p class="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-secondary-500">
            <Calendar class="size-3" /> Expires {{ formatDate(policy.expiration_date) }}
          </p>
        </div>
      </div>

      <form class="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2" @submit.prevent="submitRenewal">
        <div>
          <label class="input-label" for="renew-variance">Variant</label>
          <select id="renew-variance" v-model="form.variance" class="input-field">
            <option value="" disabled>Select a variant</option>
            <option v-for="o in variantOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="input-label" for="renew-policy-type">Policy type</label>
          <select id="renew-policy-type" v-model="form.policy_type" class="input-field">
            <option value="" disabled>Select a policy type</option>
            <option v-for="o in policyTypeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="input-label" for="renew-identification">Identification</label>
          <select id="renew-identification" v-model="form.identification" class="input-field">
            <option value="" disabled>Select an identification</option>
            <option v-for="o in identificationOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <div>
          <label class="input-label" for="renew-id-number">Identification number</label>
          <input
            id="renew-id-number"
            v-model="form.id_number"
            type="text"
            class="input-field"
            placeholder="Identification number"
          >
        </div>

        <div class="sm:col-span-2 flex items-center justify-between gap-3 rounded-xl bg-warning/10 px-4 py-3">
          <p class="flex items-center gap-2 text-xs text-warning">
            <ShieldCheck class="size-4" /> Cover will extend by another year from today.
          </p>
        </div>

        <div class="sm:col-span-2 flex justify-end">
          <button type="submit" class="btn-primary h-11" :disabled="renewLoading">
            <span
              v-if="renewLoading"
              class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <RefreshCcw v-else class="size-4" />
            {{ renewLoading ? 'Renewing…' : 'Renew policy' }}
          </button>
        </div>
      </form>
    </section>

    <section
      v-else
      class="card flex flex-col items-center gap-3 px-6 py-12 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-secondary-100">
        <Search class="size-6 text-secondary-500" />
      </div>
      <p class="text-sm text-secondary-500">
        Enter a vehicle registration number above to find the policy to renew.
      </p>
    </section>
  </div>
</template>
