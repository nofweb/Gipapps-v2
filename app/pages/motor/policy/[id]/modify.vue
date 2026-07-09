<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ArrowLeft, AlertTriangle, Save, Car, ShieldCheck, FileText } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import { useMotorStore } from '~/stores/motor'
import {
  familyForVariance,
  yearOfMakeOptions,
  VEHICLE_TYPE_LABELS,
  PREMIUM_TYPE_LABELS,
  INDIVIDUAL_ID_OPTIONS,
  CORPORATE_ID_LABELS,
} from '~/utils/motor-constants'
import type { MotorHolderType, MotorPolicy, MotorPolicyFamily, MotorPremiumType, MotorModifyPayload } from '~/types/motor'

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
const { policyById, policyDetailLoading, policyDetailError, sectors, sectorsLoading, makes, makesLoading, modifyLoading } = storeToRefs(motor)

const policy = computed(() => policyById.value[id.value])

const resolvedFamily = computed<MotorPolicyFamily | undefined>(() =>
  familyHint.value ?? familyForVariance(policy.value?.variance) ?? undefined,
)
const isComprehensive = computed(() => resolvedFamily.value === 'comprehensive')

const yearOptions = yearOfMakeOptions()
const vehicleTypeOptions = Object.entries(VEHICLE_TYPE_LABELS) as Array<[string, string]>
const premiumTypeOptions = Object.entries(PREMIUM_TYPE_LABELS) as Array<[MotorPremiumType, string]>

const form = reactive({
  holder_type: 'individual' as MotorHolderType,
  first_name: '',
  surname: '',
  company_name: '',
  email: '',
  phone_number: '',
  contact_address: '',
  sector: '',
  identification: '',
  id_number: '',
  registration_number: '',
  vehicle_make_id: '',
  vehicle_model_id: '',
  year_of_make: '',
  vehicle_color: '',
  chasis_number: '',
  engine_number: '',
  vehicle_type: '',
  car_value: 0,
  premium_type: 'ANNUAL' as MotorPremiumType,
  modification_reason: '',
})

const errors = reactive<{ modification_reason?: string }>({})

/** Models for the currently selected make (all classes). */
const models = computed(() => motor.modelsFor(form.vehicle_make_id))

/** ID-type options for the current holder type, keeping the policy's current value. */
const idOptions = computed(() => {
  const opts = form.holder_type === 'corporate'
    ? Object.values(CORPORATE_ID_LABELS)
    : INDIVIDUAL_ID_OPTIONS.map(o => o.apiLabel)
  if (form.identification && !opts.includes(form.identification)) return [form.identification, ...opts]
  return opts
})

let hydrated = false
function hydrate(p: MotorPolicy) {
  form.holder_type = (p.holder_type ?? '').toLowerCase() === 'corporate' ? 'corporate' : 'individual'
  form.first_name = p.first_name ?? ''
  form.surname = p.surname ?? p.last_name ?? ''
  form.company_name = p.company_name ?? ''
  form.email = p.email ?? ''
  form.phone_number = p.phone_number ?? ''
  form.contact_address = p.contact_address ?? ''
  form.sector = p.sector ?? ''
  form.identification = p.identification ?? ''
  form.id_number = p.id_number ?? ''
  form.registration_number = p.registration_number ?? ''
  form.vehicle_make_id = String(
    p.vehicle_make_id ?? (typeof p.vehicle_make === 'object' && p.vehicle_make ? p.vehicle_make.id : '') ?? '',
  )
  form.vehicle_model_id = String(
    p.vehicle_model_id ?? (typeof p.vehicle_model === 'object' && p.vehicle_model ? p.vehicle_model.id : '') ?? '',
  )
  form.year_of_make = p.year_of_make ?? ''
  form.vehicle_color = p.vehicle_color ?? ''
  form.chasis_number = p.chasis_number ?? ''
  form.engine_number = p.engine_number ?? ''
  form.vehicle_type = p.vehicle_type ?? ''
  form.car_value = Number(p.car_value) || 0
  form.premium_type = (p.premium_type as MotorPremiumType) || 'ANNUAL'
  hydrated = true
}

// Load the policy + dropdown catalogs, then prefill the form.
await Promise.all([
  motor.fetchPolicy(id.value, familyHint.value).catch(() => {}),
  motor.fetchMakes().catch(() => {}),
  motor.fetchSectors().catch(() => {}),
])
if (policy.value) hydrate(policy.value)
// Prefill once the policy arrives (covers the case where the fetch resolves late).
watch(policy, (p) => {
  if (p && !hydrated) hydrate(p)
})

const backHref = computed(() =>
  `/motor/policy/${id.value}${resolvedFamily.value ? `?family=${resolvedFamily.value}` : ''}`,
)

async function submit() {
  errors.modification_reason = undefined
  if (!form.modification_reason.trim()) {
    errors.modification_reason = 'Please provide a reason for the modification'
    return
  }
  const corp = form.holder_type === 'corporate'
  const payload: MotorModifyPayload = {
    modification_reason: form.modification_reason.trim(),
    holder_type: form.holder_type,
    variance: policy.value?.variance ?? '',
    first_name: corp ? '' : form.first_name.trim(),
    surname: corp ? '' : form.surname.trim(),
    company_name: corp ? form.company_name.trim() : '',
    contact_address: form.contact_address.trim(),
    phone_number: form.phone_number.trim(),
    email: form.email.trim(),
    identification: form.identification.trim(),
    id_number: form.id_number.trim(),
    upload_id: policy.value?.upload_id ?? '',
    sector: form.sector,
    registration_number: form.registration_number.trim(),
    vehicle_make_id: form.vehicle_make_id,
    vehicle_model_id: form.vehicle_model_id,
    chasis_number: form.chasis_number.trim(),
    engine_number: form.engine_number.trim(),
    vehicle_color: form.vehicle_color.trim(),
    year_of_make: String(form.year_of_make),
    vehicle_type: form.vehicle_type,
    policy_type: policy.value?.policy_type ?? '',
  }
  if (isComprehensive.value) {
    payload.car_value = Number(form.car_value) || 0
    payload.premium_type = form.premium_type
  }
  try {
    await motor.modifyPolicy(id.value, payload)
    toast.success('Modification submitted successfully')
    await navigateTo(backHref.value)
  }
  catch (err) {
    toast.error(motor.modifyError || (err instanceof Error ? err.message : 'Could not submit modification'))
  }
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
        Back to policy
      </NuxtLink>
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
    </div>

    <!-- Form -->
    <form v-else-if="policy" class="space-y-6" @submit.prevent="submit">
      <div>
        <h1 class="text-2xl font-bold text-secondary-900">Modify policy</h1>
        <p class="mt-1 text-sm text-secondary-500">
          {{ policy.policy_number }} · update the details below and tell us why.
        </p>
      </div>

      <!-- Policy holder -->
      <section class="card p-6">
        <header class="mb-4 flex items-center gap-2">
          <ShieldCheck class="size-5 text-primary-700" />
          <h2 class="text-base font-semibold text-secondary-900">Policy holder</h2>
        </header>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label" for="holder_type">Holder type</label>
            <select id="holder_type" v-model="form.holder_type" class="input-field">
              <option value="individual">Individual</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <template v-if="form.holder_type === 'individual'">
            <div>
              <label class="input-label" for="first_name">First name</label>
              <input id="first_name" v-model="form.first_name" type="text" class="input-field" placeholder="First name">
            </div>
            <div>
              <label class="input-label" for="surname">Surname</label>
              <input id="surname" v-model="form.surname" type="text" class="input-field" placeholder="Surname">
            </div>
          </template>
          <div v-else>
            <label class="input-label" for="company_name">Company name</label>
            <input id="company_name" v-model="form.company_name" type="text" class="input-field" placeholder="Company name">
          </div>
          <div>
            <label class="input-label" for="email">Email</label>
            <input id="email" v-model="form.email" type="email" class="input-field" placeholder="Email address">
          </div>
          <div>
            <label class="input-label" for="phone_number">Phone number</label>
            <input id="phone_number" v-model="form.phone_number" type="tel" class="input-field" placeholder="Phone number">
          </div>
          <div>
            <label class="input-label" for="sector">Sector</label>
            <select id="sector" v-model="form.sector" class="input-field" :disabled="sectorsLoading">
              <option value="">{{ sectorsLoading ? 'Loading sectors…' : 'Select a sector' }}</option>
              <option v-for="s in sectors" :key="s.id ?? s.name" :value="s.name">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="input-label" for="identification">ID type</label>
            <select id="identification" v-model="form.identification" class="input-field">
              <option value="">Select ID type</option>
              <option v-for="opt in idOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div>
            <label class="input-label" for="id_number">ID number</label>
            <input id="id_number" v-model="form.id_number" type="text" class="input-field" placeholder="ID number">
          </div>
          <div class="sm:col-span-2">
            <label class="input-label" for="contact_address">Contact address</label>
            <textarea id="contact_address" v-model="form.contact_address" rows="2" class="input-field" placeholder="Contact address" />
          </div>
        </div>
      </section>

      <!-- Vehicle -->
      <section class="card p-6">
        <header class="mb-4 flex items-center gap-2">
          <Car class="size-5 text-primary-700" />
          <h2 class="text-base font-semibold text-secondary-900">Vehicle</h2>
        </header>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label" for="registration_number">Registration number</label>
            <input id="registration_number" v-model="form.registration_number" type="text" class="input-field" placeholder="Registration number">
          </div>
          <div>
            <label class="input-label" for="vehicle_make_id">Make</label>
            <select id="vehicle_make_id" v-model="form.vehicle_make_id" class="input-field" :disabled="makesLoading">
              <option value="">{{ makesLoading ? 'Loading makes…' : 'Select make' }}</option>
              <option v-for="m in makes" :key="m.id" :value="String(m.id)">{{ m.name }}</option>
            </select>
          </div>
          <div>
            <label class="input-label" for="vehicle_model_id">Model</label>
            <select id="vehicle_model_id" v-model="form.vehicle_model_id" class="input-field" :disabled="!form.vehicle_make_id">
              <option value="">{{ form.vehicle_make_id ? 'Select model' : 'Select a make first' }}</option>
              <option v-for="mo in models" :key="mo.id" :value="String(mo.id)">{{ mo.name }}</option>
            </select>
          </div>
          <div>
            <label class="input-label" for="year_of_make">Year of make</label>
            <select id="year_of_make" v-model="form.year_of_make" class="input-field">
              <option value="">Select year</option>
              <option v-for="y in yearOptions" :key="y" :value="String(y)">{{ y }}</option>
            </select>
          </div>
          <div>
            <label class="input-label" for="vehicle_color">Colour</label>
            <input id="vehicle_color" v-model="form.vehicle_color" type="text" class="input-field" placeholder="Vehicle colour">
          </div>
          <div>
            <label class="input-label" for="vehicle_type">Vehicle type</label>
            <select id="vehicle_type" v-model="form.vehicle_type" class="input-field">
              <option value="">Select type</option>
              <option v-for="[value, label] in vehicleTypeOptions" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="input-label" for="chasis_number">Chassis number</label>
            <input id="chasis_number" v-model="form.chasis_number" type="text" class="input-field" placeholder="Chassis number">
          </div>
          <div>
            <label class="input-label" for="engine_number">Engine number</label>
            <input id="engine_number" v-model="form.engine_number" type="text" class="input-field" placeholder="Engine number">
          </div>
        </div>
      </section>

      <!-- Cover (comprehensive only) -->
      <section v-if="isComprehensive" class="card p-6">
        <header class="mb-4 flex items-center gap-2">
          <ShieldCheck class="size-5 text-primary-700" />
          <h2 class="text-base font-semibold text-secondary-900">Cover</h2>
        </header>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label" for="car_value">Car value (₦)</label>
            <input id="car_value" v-model.number="form.car_value" type="number" min="0" class="input-field" placeholder="Car value">
          </div>
          <div>
            <label class="input-label" for="premium_type">Payment plan</label>
            <select id="premium_type" v-model="form.premium_type" class="input-field">
              <option v-for="[value, label] in premiumTypeOptions" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Reason -->
      <section class="card p-6">
        <header class="mb-4 flex items-center gap-2">
          <FileText class="size-5 text-primary-700" />
          <h2 class="text-base font-semibold text-secondary-900">Reason for modification</h2>
        </header>
        <div>
          <label class="input-label" for="modification_reason">Why are you requesting this change?</label>
          <textarea
            id="modification_reason"
            v-model="form.modification_reason"
            rows="3"
            class="input-field"
            placeholder="e.g. quick update on the model and make"
          />
          <p v-if="errors.modification_reason" class="mt-1 text-xs text-tertiary-500">{{ errors.modification_reason }}</p>
        </div>
      </section>

      <!-- Actions -->
      <div class="flex flex-wrap items-center justify-end gap-3">
        <NuxtLink :to="backHref" class="btn-ghost border border-secondary-100 text-sm">Cancel</NuxtLink>
        <button type="submit" class="btn-primary text-sm" :disabled="modifyLoading">
          <span
            v-if="modifyLoading"
            class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <Save v-else class="size-4" /> Submit modification
        </button>
      </div>
    </form>
  </div>
</template>
