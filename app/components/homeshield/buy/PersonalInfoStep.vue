<script setup lang="ts">
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle, RotateCcw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { useHomeshieldStore } from '~/stores/homeshield'

const app = useHomeshieldApplicationStore()
const homeshield = useHomeshieldStore()
const { sectors, sectorsLoading } = storeToRefs(homeshield)

onMounted(() => {
  homeshield.fetchSectors().catch(() => {})
})
const {
  holderType,
  firstName,
  lastName,
  companyName,
  email,
  phoneNumber,
  contactAddress,
  identificationNumber,
  identificationType,
  sector,
  verified,
  verifying,
  verifyError,
} = storeToRefs(app)

const errors = ref<Record<string, string>>({})

const isCorporate = computed(() => holderType.value === 'corporate')
const idLabel = computed(() => (isCorporate.value ? 'RC number' : 'NIN'))
const idPlaceholder = computed(() => (isCorporate.value ? 'RC123456' : '12345678901'))

async function verify() {
  errors.value = {}
  const id = identificationNumber.value.trim()
  if (!id) {
    errors.value.identificationNumber = `${idLabel.value} is required`
    return
  }
  if (!isCorporate.value && !/^[0-9]{11}$/.test(id)) {
    errors.value.identificationNumber = 'NIN must be 11 digits'
    return
  }
  try {
    if (isCorporate.value) await app.verifyCac(id)
    else await app.verifyNin(id)
    toast.success(`${idLabel.value} verified`)
  }
  catch {
    toast.error(verifyError.value || `${idLabel.value} verification failed`)
  }
}

function reverify() {
  app.clearVerification()
  identificationNumber.value = ''
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

function proceed() {
  if (!verified.value) {
    errors.value.identificationNumber = `Please verify your ${idLabel.value} first`
    return
  }
  if (!validate()) return
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
        We'll verify your {{ isCorporate ? 'CAC' : 'NIN' }} before you can fill in the rest.
      </p>
    </header>

    <!-- Verification block -->
    <section
      :class="[
        'rounded-2xl border-2 p-5 transition-colors',
        verified
          ? 'border-primary-200 bg-primary-50/60'
          : 'border-secondary-100 bg-secondary-50/60',
      ]"
    >
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[14rem]">
          <label class="input-label flex items-center gap-2" :for="`id-${identificationType}`">
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
            :id="`id-${identificationType}`"
            v-model="identificationNumber"
            type="text"
            :inputmode="isCorporate ? 'text' : 'numeric'"
            :maxlength="isCorporate ? 20 : 11"
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

    <!-- Form (locked until verified) -->
    <fieldset
      :disabled="!verified"
      :class="[
        'space-y-4 transition-opacity',
        verified ? 'opacity-100' : 'opacity-60 pointer-events-none',
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
      <button type="button" class="btn-primary" :disabled="!verified" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
