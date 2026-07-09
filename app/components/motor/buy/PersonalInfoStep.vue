<script setup lang="ts">
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle, RotateCcw, Building2, Landmark } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMotorApplicationStore } from '~/stores/motor/application'
import { useMotorStore } from '~/stores/motor'
import {
  INDIVIDUAL_ID_OPTIONS,
} from '~/utils/motor-constants'
import type { MotorCorporateIdType, MotorIndividualIdType } from '~/types/motor'

const app = useMotorApplicationStore()
const motor = useMotorStore()
const { sectors, sectorsLoading } = storeToRefs(motor)

onMounted(() => {
  motor.fetchSectors().catch(() => {})
})

const {
  holderType,
  firstName,
  lastName,
  companyName,
  email,
  phoneNumber,
  contactAddress,
  sector,
  individualIdType,
  corporateIdType,
  identificationNumber,
  verified,
  verifying,
  verifyError,
} = storeToRefs(app)

const errors = ref<Record<string, string>>({})

const isCorporate = computed(() => holderType.value === 'corporate')
const isGovernmentCorporate = computed(
  () => isCorporate.value && corporateIdType.value === 'government',
)

const currentIndividualOption = computed(() =>
  INDIVIDUAL_ID_OPTIONS.find(o => o.value === individualIdType.value),
)

const idLabel = computed(() => {
  if (isCorporate.value) return 'RC / BN number'
  return currentIndividualOption.value?.label ?? 'ID number'
})

const idPlaceholder = computed(() => {
  if (isCorporate.value) return 'BN or RC number'
  return currentIndividualOption.value?.placeholder ?? 'Identification number'
})

const idInputMode = computed<'text' | 'numeric'>(() => {
  if (isCorporate.value) return 'text'
  return individualIdType.value === 'nin' ? 'numeric' : 'text'
})

const idMaxLength = computed(() => {
  if (isCorporate.value) return 20
  return individualIdType.value === 'nin' ? 11 : 30
})

const corporateOptions: Array<{
  value: MotorCorporateIdType
  label: string
  copy: string
  icon: typeof Building2
}> = [
  {
    value: 'cac',
    label: 'CAC-registered',
    copy: 'Provide your RC / BN number to verify.',
    icon: Building2,
  },
  {
    value: 'government',
    label: 'Government entity',
    copy: 'Government parastatals, universities and similar — no verification required.',
    icon: Landmark,
  },
]

function selectIndividualType(t: MotorIndividualIdType) {
  app.setIndividualIdType(t)
  errors.value = {}
}

function selectCorporateType(t: MotorCorporateIdType) {
  app.setCorporateIdType(t)
  errors.value = {}
}

async function verify() {
  errors.value = {}
  const id = identificationNumber.value.trim()
  if (!id) {
    errors.value.identificationNumber = `${idLabel.value} is required`
    return
  }
  if (!isCorporate.value && individualIdType.value === 'nin' && !/^[0-9]{11}$/.test(id)) {
    errors.value.identificationNumber = 'NIN must be 11 digits'
    return
  }
  try {
    await app.verifyIdentification()
    if (verified.value) {
      toast.success(`${idLabel.value} verified`)
    }
    else {
      toast.error(verifyError.value || `${idLabel.value} verification failed`)
    }
  }
  catch {
    toast.error(verifyError.value || `${idLabel.value} verification failed`)
  }
}

function reverify() {
  app.clearVerification()
}

function validate() {
  const e: Record<string, string> = {}
  if (isCorporate.value) {
    if (!companyName.value.trim()) e.companyName = 'Company name is required'
  }
  else {
    if (!firstName.value.trim()) e.firstName = 'First name is required'
    if (!lastName.value.trim()) e.lastName = 'Last name is required'
  }
  if (!email.value.trim()) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) e.email = 'Enter a valid email'
  if (!phoneNumber.value.trim()) e.phoneNumber = 'Phone is required'
  if (!contactAddress.value.trim()) e.contactAddress = 'Contact address is required'
  if (!sector.value) e.sector = 'Please select a sector'
  errors.value = e
  return Object.keys(e).length === 0
}

async function proceed() {
  if (!isGovernmentCorporate.value && !verified.value) {
    errors.value.identificationNumber = `Please verify your ${idLabel.value} first`
    return
  }
  if (!validate()) return
  await app.saveContact()
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">
        {{ isCorporate ? 'Company details' : 'Personal information' }}
      </h2>
      <p class="mt-1 text-sm text-secondary-500">
        <template v-if="isCorporate">
          We'll verify your CAC details before you can fill in the rest.
        </template>
        <template v-else>
          We'll verify your identification before you can fill in the rest.
        </template>
      </p>
    </header>

    <!-- Identification picker (individual) -->
    <section v-if="!isCorporate">
      <p class="input-label mb-2">Identification type</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          v-for="opt in INDIVIDUAL_ID_OPTIONS"
          :key="opt.value"
          type="button"
          :aria-pressed="individualIdType === opt.value"
          :class="[
            'rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            individualIdType === opt.value
              ? 'border-primary bg-primary-50 text-secondary-900'
              : 'border-secondary-100 bg-card text-secondary-700 hover:border-primary-200',
          ]"
          @click="selectIndividualType(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Corporate type picker -->
    <section v-else>
      <p class="input-label mb-2">Corporate type</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="opt in corporateOptions"
          :key="opt.value"
          type="button"
          :aria-pressed="corporateIdType === opt.value"
          :class="[
            'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            corporateIdType === opt.value
              ? 'border-primary bg-primary-50'
              : 'border-secondary-100 bg-card hover:border-primary-200',
          ]"
          @click="selectCorporateType(opt.value)"
        >
          <div :class="[
            'flex size-10 items-center justify-center rounded-xl',
            corporateIdType === opt.value ? 'bg-primary text-primary-foreground' : 'bg-secondary-100 text-secondary-700',
          ]">
            <component :is="opt.icon" class="size-5" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-secondary-900">{{ opt.label }}</p>
            <p class="mt-0.5 text-xs text-secondary-500">{{ opt.copy }}</p>
          </div>
        </button>
      </div>
    </section>

    <!-- Verification block (skipped for government corporate) -->
    <section
      v-if="!isGovernmentCorporate"
      :class="[
        'rounded-2xl border-2 p-5 transition-colors',
        verified
          ? 'border-primary-200 bg-primary-50/60'
          : 'border-secondary-100 bg-secondary-50/60',
      ]"
    >
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[14rem]">
          <label class="input-label flex items-center gap-2" :for="`id-${idLabel}`">
            <ShieldCheck
              :class="['size-4', verified ? 'text-primary-700' : 'text-secondary-400']"
            />
            {{ idLabel }}
            <span
              v-if="verified"
              class="ml-auto inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            >
              Verified
            </span>
          </label>
          <input
            :id="`id-${idLabel}`"
            v-model="identificationNumber"
            type="text"
            :inputmode="idInputMode"
            :maxlength="idMaxLength"
            class="input-field"
            :placeholder="idPlaceholder"
            :disabled="verified || verifying"
          >
        </div>
        <button
          v-if="!verified"
          type="button"
          class="btn-primary h-11"
          :disabled="verifying"
          @click="verify"
        >
          <span
            v-if="verifying"
            class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          {{ verifying ? 'Verifying…' : 'Verify' }}
        </button>
        <button
          v-else
          type="button"
          class="btn-ghost border border-secondary-100 h-11"
          @click="reverify"
        >
          <RotateCcw class="size-4" /> Re-verify
        </button>
      </div>

      <p v-if="errors.identificationNumber" class="mt-2 text-xs text-tertiary-500">
        {{ errors.identificationNumber }}
      </p>
      <div
        v-if="verifyError && !verified"
        class="mt-3 flex items-start gap-2 rounded-xl border border-tertiary-200 bg-tertiary-50 p-3"
      >
        <AlertTriangle class="size-4 shrink-0 text-tertiary-500" />
        <p class="text-xs font-medium text-tertiary-700">{{ verifyError }}</p>
      </div>
    </section>

    <!-- Government disclaimer -->
    <section
      v-else
      class="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4"
    >
      <div class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
        <Landmark class="size-4" />
      </div>
      <p class="text-sm text-secondary-800">
        Government parastatals are exempt from CAC verification — fill in the rest of the form to continue.
      </p>
    </section>

    <!-- Form (locked until verified) -->
    <fieldset
      :disabled="!verified && !isGovernmentCorporate"
      :class="[
        'space-y-4 transition-opacity',
        (verified || isGovernmentCorporate) ? 'opacity-100' : 'opacity-60 pointer-events-none',
      ]"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <template v-if="isCorporate">
          <div class="sm:col-span-2">
            <label class="input-label" for="companyName">Company name</label>
            <input id="companyName" v-model="companyName" type="text" class="input-field" placeholder="Enter company name">
            <p v-if="errors.companyName" class="mt-1 text-xs text-tertiary-500">{{ errors.companyName }}</p>
          </div>
        </template>
        <template v-else>
          <div>
            <label class="input-label" for="firstName">First name</label>
            <input id="firstName" v-model="firstName" type="text" class="input-field" placeholder="Enter first name">
            <p v-if="errors.firstName" class="mt-1 text-xs text-tertiary-500">{{ errors.firstName }}</p>
          </div>
          <div>
            <label class="input-label" for="lastName">Last name</label>
            <input id="lastName" v-model="lastName" type="text" class="input-field" placeholder="Enter last name">
            <p v-if="errors.lastName" class="mt-1 text-xs text-tertiary-500">{{ errors.lastName }}</p>
          </div>
        </template>

        <div>
          <label class="input-label" for="email">Email address</label>
          <input id="email" v-model="email" type="email" class="input-field" placeholder="Enter email address">
          <p v-if="errors.email" class="mt-1 text-xs text-tertiary-500">{{ errors.email }}</p>
        </div>

        <div>
          <label class="input-label" for="phone">Phone number</label>
          <input id="phone" v-model="phoneNumber" type="tel" class="input-field" placeholder="Enter phone number">
          <p v-if="errors.phoneNumber" class="mt-1 text-xs text-tertiary-500">{{ errors.phoneNumber }}</p>
        </div>

        <div :class="[isCorporate ? 'sm:col-span-2' : '']">
          <label class="input-label" for="sector">Sector</label>
          <select id="sector" v-model="sector" class="input-field" :disabled="sectorsLoading">
            <option value="" disabled>
              {{ sectorsLoading ? 'Loading sectors…' : 'Select a sector' }}
            </option>
            <option v-for="s in sectors" :key="s.id ?? s.name" :value="s.name">
              {{ s.name }}
            </option>
          </select>
          <p v-if="errors.sector" class="mt-1 text-xs text-tertiary-500">{{ errors.sector }}</p>
        </div>

        <div class="sm:col-span-2">
          <label class="input-label" for="address">Contact address</label>
          <textarea
            id="address"
            v-model="contactAddress"
            rows="2"
            class="input-field"
            placeholder="Enter contact address"
          />
          <p v-if="errors.contactAddress" class="mt-1 text-xs text-tertiary-500">{{ errors.contactAddress }}</p>
        </div>
      </div>
    </fieldset>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button
        type="button"
        class="btn-primary"
        :disabled="!verified && !isGovernmentCorporate"
        @click="proceed"
      >
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
