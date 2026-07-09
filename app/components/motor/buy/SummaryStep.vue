<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useMotorApplicationStore } from '~/stores/motor/application'
import { useMotorStore } from '~/stores/motor'
import {
  INSURANCE_CLASS_LABELS,
  PREMIUM_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from '~/utils/motor-constants'
import { formatNaira } from '~/utils/format'

const app = useMotorApplicationStore()
const motor = useMotorStore()

const {
  family,
  variantMeta,
  insuranceClass,
  holderType,
  firstName,
  lastName,
  companyName,
  email,
  phoneNumber,
  contactAddress,
  identificationNumber,
  sector,
  individualIdType,
  corporateIdType,
  registrationNumber,
  vehicleMakeId,
  vehicleModelId,
  yearOfMake,
  chassisNumber,
  engineNumber,
  vehicleColor,
  vehicleType,
  carValue,
  premiumType,
  premiumQuote,
} = storeToRefs(app)

const makeName = computed(() => motor.findMake(vehicleMakeId.value)?.name ?? vehicleMakeId.value)
const modelName = computed(() => {
  const m = motor.findMake(vehicleMakeId.value)?.vehicle_models?.find(x => String(x.id) === vehicleModelId.value)
  return m?.name ?? vehicleModelId.value
})

const holderName = computed(() =>
  holderType.value === 'corporate'
    ? companyName.value
    : [firstName.value, lastName.value].filter(Boolean).join(' '),
)

const idTypeLabel = computed(() => {
  if (holderType.value === 'corporate') return corporateIdType.value === 'cac' ? 'RC / BN number' : 'Government'
  return individualIdType.value === 'nin' ? 'NIN' : 'ID number'
})

const familyLabel = computed(() => {
  const meta = variantMeta.value
  if (!meta) return family.value === 'comprehensive' ? 'Motor · Comprehensive' : 'Motor · Third Party'
  return `Motor · ${meta.shortName}`
})
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Review your application</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Make sure everything looks right before you pay.
      </p>
    </header>

    <!-- Premium hero -->
    <div class="rounded-2xl bg-gradient-hero p-6 text-white">
      <p class="text-xs font-semibold uppercase tracking-widest text-primary">
        {{ family === 'comprehensive' ? 'Amount due now' : 'Annual premium' }}
      </p>
      <p class="mt-2 text-3xl font-bold tabular-nums">{{ formatNaira(app.amountDue) }}</p>
      <p class="mt-1 text-sm text-secondary-300">
        {{ familyLabel }}
        <template v-if="insuranceClass"> · {{ INSURANCE_CLASS_LABELS[insuranceClass] }}</template>
        <template v-if="family === 'comprehensive' && premiumType"> · {{ PREMIUM_TYPE_LABELS[premiumType] }}</template>
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Holder -->
      <section class="card p-5">
        <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Policy holder</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Type</dt>
            <dd class="font-medium text-secondary-900 capitalize">{{ holderType }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Name</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ holderName || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Email</dt>
            <dd class="font-medium text-secondary-900 text-right break-all">{{ email }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Phone</dt>
            <dd class="font-medium text-secondary-900">{{ phoneNumber }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">{{ idTypeLabel }}</dt>
            <dd class="font-medium text-secondary-900">{{ identificationNumber || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Sector</dt>
            <dd class="font-medium text-secondary-900">{{ sector }}</dd>
          </div>
          <div>
            <dt class="text-secondary-500">Contact address</dt>
            <dd class="mt-0.5 text-secondary-900">{{ contactAddress }}</dd>
          </div>
        </dl>
      </section>

      <!-- Vehicle -->
      <section class="card p-5">
        <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Vehicle</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Registration</dt>
            <dd class="font-medium text-secondary-900">{{ registrationNumber }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Make / Model</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ makeName }} {{ modelName }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Year</dt>
            <dd class="font-medium text-secondary-900">{{ yearOfMake }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Color</dt>
            <dd class="font-medium text-secondary-900 capitalize">{{ vehicleColor }}</dd>
          </div>
          <div v-if="vehicleType" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Type</dt>
            <dd class="font-medium text-secondary-900">{{ VEHICLE_TYPE_LABELS[vehicleType] }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Chassis</dt>
            <dd class="font-medium text-secondary-900">{{ chassisNumber }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Engine</dt>
            <dd class="font-medium text-secondary-900">{{ engineNumber }}</dd>
          </div>
          <div v-if="family === 'comprehensive' && carValue" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Car value</dt>
            <dd class="font-medium text-secondary-900 tabular-nums">{{ formatNaira(carValue) }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <!-- Premium breakdown for comprehensive -->
    <section v-if="family === 'comprehensive' && premiumQuote" class="card p-5">
      <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Premium breakdown</h3>
      <dl class="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt class="text-xs text-secondary-500">Annual premium</dt>
          <dd class="mt-0.5 font-semibold text-secondary-900 tabular-nums">{{ formatNaira(premiumQuote.annual_premium) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-secondary-500">Amount due now</dt>
          <dd class="mt-0.5 font-semibold text-secondary-900 tabular-nums">{{ formatNaira(premiumQuote.premium) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-secondary-500">Cover starts</dt>
          <dd class="mt-0.5 font-medium text-secondary-900">{{ premiumQuote.effective_cover_date }}</dd>
        </div>
        <div>
          <dt class="text-xs text-secondary-500">Cover ends</dt>
          <dd class="mt-0.5 font-medium text-secondary-900">{{ premiumQuote.expiration_date }}</dd>
        </div>
      </dl>
    </section>

    <!-- Pre-loss inspection disclaimer -->
    <p class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-secondary-800">
      Insurance cover is subject to a pre-loss inspection
    </p>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" @click="app.next()">
        Continue to payment <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
