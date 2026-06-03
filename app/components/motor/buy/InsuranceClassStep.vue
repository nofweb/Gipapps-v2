<script setup lang="ts">
import { Check, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useMotorApplicationStore } from '~/stores/motor/application'
import { MOTOR_CLASSES } from '~/utils/motor-constants'
import type { MotorInsuranceClass } from '~/types/motor'
import { formatNaira } from '~/utils/format'

const app = useMotorApplicationStore()
const { insuranceClass, family } = storeToRefs(app)
const error = ref<string | null>(null)

function select(id: MotorInsuranceClass) {
  app.setInsuranceClass(id)
  error.value = null
}

function proceed() {
  if (!insuranceClass.value) {
    error.value = 'Please choose an insurance class to continue'
    return
  }
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Choose your insurance class</h2>
      <p class="mt-1 text-sm text-secondary-500">
        Pick the class that matches the vehicle you want to insure.
      </p>
    </header>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <button
        v-for="cls in MOTOR_CLASSES"
        :key="cls.id"
        type="button"
        :aria-pressed="insuranceClass === cls.id"
        :class="[
          'group rounded-2xl border-2 p-6 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          insuranceClass === cls.id
            ? 'border-primary bg-primary-50 shadow-glow-primary'
            : 'border-secondary-100 bg-card hover:border-primary-200 hover:bg-primary-50/40',
        ]"
        @click="select(cls.id)"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">{{ cls.label }}</p>
            <p class="mt-1 text-base font-bold text-secondary-900">{{ cls.description }}</p>
          </div>
          <div
            :class="[
              'flex size-7 items-center justify-center rounded-full border-2 transition-colors shrink-0',
              insuranceClass === cls.id ? 'border-primary bg-primary' : 'border-secondary-200 bg-card',
            ]"
          >
            <Check v-if="insuranceClass === cls.id" class="size-4 text-primary-foreground" />
          </div>
        </div>

        <p v-if="family === 'third_party'" class="mt-4 text-sm font-semibold text-secondary-700">
          Annual premium · <span class="text-secondary-900">{{ formatNaira(cls.thirdPartyPremium) }}</span>
        </p>
        <p v-else class="mt-4 text-sm font-semibold text-secondary-700">
          Premium · <span class="text-secondary-900">Calculated from car value</span>
        </p>

        <ul class="mt-4 space-y-2">
          <li
            v-for="benefit in cls.benefits"
            :key="benefit"
            class="flex items-start gap-2 text-xs text-secondary-600"
          >
            <Check class="size-3.5 mt-0.5 shrink-0 text-primary-600" />
            <span>{{ benefit }}</span>
          </li>
        </ul>
      </button>
    </div>

    <p v-if="error" class="text-sm font-medium text-tertiary-500">{{ error }}</p>

    <div class="flex justify-end">
      <button type="button" class="btn-primary" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
