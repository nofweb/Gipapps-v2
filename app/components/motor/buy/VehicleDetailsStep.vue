<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Search,
  Loader2,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import { useMotorApplicationStore } from '~/stores/motor/application'
import { useMotorStore } from '~/stores/motor'
import {
  getVehicleTypesForClass,
  toInsuranceClassCode,
  VEHICLE_TYPE_LABELS,
  yearOfMakeOptions,
} from '~/utils/motor-constants'
import type { MotorVehicleType } from '~/types/motor'

const app = useMotorApplicationStore()
const motor = useMotorStore()
const {
  makes,
  makesLoading,
  regVerifying,
  regVerifyError,
} = storeToRefs(motor)

const {
  insuranceClass,
  registrationNumber,
  registrationVerified,
  vehicleMakeId,
  vehicleModelId,
  yearOfMake,
  chassisNumber,
  engineNumber,
  vehicleColor,
  vehicleType,
  carValue,
  isComprehensive,
  variantMeta,
} = storeToRefs(app)

const errors = ref<Record<string, string>>({})

onMounted(() => {
  motor.fetchMakes().catch(() => {})
})

const yearOptions = computed(() => yearOfMakeOptions())
const vehicleTypeOptions = computed<MotorVehicleType[]>(() =>
  insuranceClass.value ? getVehicleTypesForClass(insuranceClass.value) : [],
)
const showVehicleType = computed(() => vehicleTypeOptions.value.length > 0)

const filteredModels = computed(() => {
  if (!insuranceClass.value || !vehicleMakeId.value) return []
  const code = toInsuranceClassCode(insuranceClass.value)
  return motor.modelsFor(vehicleMakeId.value, code)
})

watch(insuranceClass, () => {
  if (vehicleModelId.value) {
    const stillValid = filteredModels.value.some(m => String(m.id) === vehicleModelId.value)
    if (!stillValid) vehicleModelId.value = ''
  }
  if (vehicleType.value && !vehicleTypeOptions.value.includes(vehicleType.value as MotorVehicleType)) {
    vehicleType.value = ''
  }
})

watch(carValue, () => {
  if (isComprehensive.value) app.clearPremiumQuote()
})

async function verifyReg() {
  errors.value = {}
  const reg = registrationNumber.value.trim()
  if (!reg) {
    errors.value.registrationNumber = 'Registration number is required'
    return
  }
  try {
    const data = await motor.verifyReg(reg)
    if (!data) {
      toast.warning("Couldn't verify the registration — please fill the details manually.")
      return
    }
    // Ensure makes are loaded for the dropdowns to render correctly.
    if (makes.value.length === 0) await motor.fetchMakes().catch(() => {})
    app.setVehicleFromRegLookup(data)
    toast.success('Vehicle verified — details have been pre-filled.')
  }
  catch {
    toast.error(regVerifyError.value || "We couldn't verify this registration.")
  }
}

function validate() {
  const e: Record<string, string> = {}
  if (!registrationNumber.value.trim()) e.registrationNumber = 'Registration number is required'
  if (!vehicleMakeId.value) e.vehicleMakeId = 'Select make'
  if (!vehicleModelId.value) e.vehicleModelId = 'Select model'
  if (!yearOfMake.value) e.yearOfMake = 'Select year'
  if (!chassisNumber.value.trim()) e.chassisNumber = 'Chassis number is required'
  if (!engineNumber.value.trim()) e.engineNumber = 'Engine number is required'
  if (!vehicleColor.value.trim()) e.vehicleColor = 'Color is required'
  if (showVehicleType.value && !vehicleType.value) e.vehicleType = 'Choose a vehicle type'
  if (isComprehensive.value) {
    if (!carValue.value || carValue.value <= 0) {
      e.carValue = 'Enter the car value'
    }
    else {
      const meta = variantMeta.value
      if (meta?.vehicleValueMin != null && carValue.value < meta.vehicleValueMin) {
        e.carValue = `${meta.shortName} requires a car value of at least ₦${meta.vehicleValueMin.toLocaleString('en-NG')}`
      }
      if (meta?.vehicleValueMax != null && carValue.value > meta.vehicleValueMax) {
        e.carValue = `${meta.shortName} requires a car value of at most ₦${meta.vehicleValueMax.toLocaleString('en-NG')}`
      }
    }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

const carValueDisplay = ref('')
watchEffect(() => {
  if (carValue.value === null || carValue.value === undefined) {
    carValueDisplay.value = ''
  }
  else {
    carValueDisplay.value = Number(carValue.value).toLocaleString('en-NG')
  }
})

function onCarValueInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  if (!raw) {
    carValue.value = null
    carValueDisplay.value = ''
    return
  }
  const n = Number(raw)
  carValue.value = n
  carValueDisplay.value = n.toLocaleString('en-NG')
}

async function proceed() {
  if (!validate()) return
  await app.saveVehicle()
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Vehicle details</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Verify your registration number to pre-fill details, or enter them manually.
      </p>
    </header>

    <!-- Registration lookup -->
    <section
      :class="[
        'rounded-2xl border-2 p-5 transition-colors',
        registrationVerified
          ? 'border-primary-200 bg-primary-50/60'
          : 'border-secondary-100 bg-secondary-50/60',
      ]"
    >
      <label class="input-label" for="reg-number">Vehicle registration number</label>
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          id="reg-number"
          v-model="registrationNumber"
          type="text"
          placeholder="e.g. ABC-123-XY"
          class="input-field flex-1"
        >
        <button
          type="button"
          class="btn-primary h-11"
          :disabled="!registrationNumber || regVerifying"
          @click="verifyReg"
        >
          <Loader2 v-if="regVerifying" class="size-4 animate-spin" />
          <Search v-else class="size-4" />
          {{ regVerifying ? 'Verifying…' : 'Verify reg number' }}
        </button>
      </div>
      <p class="mt-2 text-xs text-secondary-500">
        Verifying is optional — it pre-fills the form below. You can fill it in manually instead.
      </p>
      <p v-if="errors.registrationNumber" class="mt-2 text-xs text-tertiary-500">
        {{ errors.registrationNumber }}
      </p>
      <p v-else-if="registrationVerified" class="mt-2 inline-flex items-center gap-1 text-xs text-primary-700">
        <CheckCircle2 class="size-3.5" /> Verified — review the pre-filled details below.
      </p>
      <div
        v-if="regVerifyError && !registrationVerified"
        class="mt-3 flex items-start gap-2 rounded-xl border border-tertiary-200 bg-tertiary-50 p-3"
      >
        <AlertTriangle class="size-4 shrink-0 text-tertiary-500" />
        <p class="text-xs font-medium text-tertiary-700">{{ regVerifyError }}</p>
      </div>
    </section>

    <!-- Detail fields -->
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="input-label" for="vd-make">Make</label>
          <select
            id="vd-make"
            v-model="vehicleMakeId"
            class="input-field"
            :disabled="makesLoading"
          >
            <option value="" disabled>
              {{ makesLoading ? 'Loading makes…' : 'Select make' }}
            </option>
            <option v-for="m in makes" :key="m.id" :value="String(m.id)">{{ m.name }}</option>
          </select>
          <p v-if="errors.vehicleMakeId" class="mt-1 text-xs text-tertiary-500">{{ errors.vehicleMakeId }}</p>
        </div>
        <div>
          <label class="input-label" for="vd-model">Model</label>
          <select
            id="vd-model"
            v-model="vehicleModelId"
            class="input-field"
            :disabled="!vehicleMakeId || !insuranceClass"
          >
            <option value="" disabled>
              <template v-if="!vehicleMakeId || !insuranceClass">Pick make &amp; class first</template>
              <template v-else-if="filteredModels.length === 0">No models for this class</template>
              <template v-else>Select model</template>
            </option>
            <option v-for="m in filteredModels" :key="m.id" :value="String(m.id)">{{ m.name }}</option>
          </select>
          <p v-if="errors.vehicleModelId" class="mt-1 text-xs text-tertiary-500">{{ errors.vehicleModelId }}</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="input-label" for="vd-year">Year of make</label>
          <select id="vd-year" v-model.number="yearOfMake" class="input-field">
            <option :value="null" disabled>Select year</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
          <p v-if="errors.yearOfMake" class="mt-1 text-xs text-tertiary-500">{{ errors.yearOfMake }}</p>
        </div>
        <div>
          <label class="input-label" for="vd-chassis">Chassis number</label>
          <input id="vd-chassis" v-model="chassisNumber" type="text" class="input-field" placeholder="Chassis number">
          <p v-if="errors.chassisNumber" class="mt-1 text-xs text-tertiary-500">{{ errors.chassisNumber }}</p>
        </div>
        <div>
          <label class="input-label" for="vd-engine">Engine number</label>
          <input id="vd-engine" v-model="engineNumber" type="text" class="input-field" placeholder="Engine number">
          <p v-if="errors.engineNumber" class="mt-1 text-xs text-tertiary-500">{{ errors.engineNumber }}</p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="input-label" for="vd-color">Vehicle color</label>
          <input id="vd-color" v-model="vehicleColor" type="text" class="input-field" placeholder="Color">
          <p v-if="errors.vehicleColor" class="mt-1 text-xs text-tertiary-500">{{ errors.vehicleColor }}</p>
        </div>
        <div v-if="showVehicleType" class="sm:col-span-2">
          <label class="input-label" for="vd-type">Vehicle type</label>
          <select
            id="vd-type"
            v-model="vehicleType"
            class="input-field"
            :disabled="!insuranceClass"
          >
            <option value="" disabled>Select type</option>
            <option v-for="t in vehicleTypeOptions" :key="t" :value="t">{{ VEHICLE_TYPE_LABELS[t] }}</option>
          </select>
          <p v-if="errors.vehicleType" class="mt-1 text-xs text-tertiary-500">{{ errors.vehicleType }}</p>
        </div>
      </div>

      <!-- Comprehensive: Car value -->
      <div v-if="isComprehensive" class="rounded-2xl border border-primary-200 bg-primary-50/40 p-5">
        <label class="input-label" for="vd-value">Car value (₦)</label>
        <div class="relative">
          <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary-500">₦</span>
          <input
            id="vd-value"
            type="text"
            inputmode="numeric"
            class="input-field pl-9"
            placeholder="5,000,000"
            :value="carValueDisplay"
            @input="onCarValueInput"
          >
        </div>
        <p v-if="errors.carValue" class="mt-2 text-xs text-tertiary-500">{{ errors.carValue }}</p>
        <p v-else-if="variantMeta?.vehicleValueMin != null || variantMeta?.vehicleValueMax != null" class="mt-2 text-xs text-secondary-500">
          {{ variantMeta.shortName }} expects a car value
          <template v-if="variantMeta.vehicleValueMin != null && variantMeta.vehicleValueMax != null">
            between ₦{{ variantMeta.vehicleValueMin.toLocaleString('en-NG') }} and ₦{{ variantMeta.vehicleValueMax.toLocaleString('en-NG') }}.
          </template>
          <template v-else-if="variantMeta.vehicleValueMin != null">
            of ₦{{ variantMeta.vehicleValueMin.toLocaleString('en-NG') }} or higher.
          </template>
          <template v-else>
            up to ₦{{ variantMeta.vehicleValueMax!.toLocaleString('en-NG') }}.
          </template>
        </p>
        <p v-else class="mt-2 text-xs text-secondary-500">
          Choose a payment plan on the next step to calculate your premium.
        </p>
      </div>
    </div>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
