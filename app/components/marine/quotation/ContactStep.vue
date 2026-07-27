<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMarineQuotationStore } from '~/stores/marine/quotation'

const app = useMarineQuotationStore()
const { email, phone_number, tin, bank_name, contact_address } = storeToRefs(app)

const errors = ref<{ email?: string, phone_number?: string }>({})

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

// Nigerian mobile numbers: 0XXXXXXXXXX, 234XXXXXXXXXX or +234XXXXXXXXXX.
function isValidPhone(v: string) {
  const digits = v.replace(/[\s()-]/g, '')
  return /^(\+?234|0)\d{10}$/.test(digits)
}

function proceed() {
  const e: { email?: string, phone_number?: string } = {}

  if (!email.value.trim()) e.email = 'Email is required'
  else if (!isValidEmail(email.value)) e.email = 'Enter a valid email address'

  if (!phone_number.value.trim()) e.phone_number = 'Phone number is required'
  else if (!isValidPhone(phone_number.value)) e.phone_number = 'Enter a valid phone number (e.g. 08012345678)'

  errors.value = e
  if (Object.keys(e).length > 0) return

  if (!tin.value) return toast.error('Tax identification number is required')
  if (!contact_address.value) return toast.error('Contact address is required')
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Insured contact</h2>
      <p class="mt-1 text-sm text-secondary-500">How can we reach the insured?</p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="input-label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          :class="['input-field', errors.email && 'border-tertiary-400 focus:border-tertiary-400']"
          placeholder="Email address"
          @input="errors.email = undefined"
        >
        <p v-if="errors.email" class="mt-1 text-xs text-tertiary-500">{{ errors.email }}</p>
      </div>
      <div>
        <label class="input-label" for="phone_number">Phone number</label>
        <input
          id="phone_number"
          v-model="phone_number"
          type="tel"
          inputmode="tel"
          :class="['input-field', errors.phone_number && 'border-tertiary-400 focus:border-tertiary-400']"
          placeholder="e.g. 08012345678"
          @input="errors.phone_number = undefined"
        >
        <p v-if="errors.phone_number" class="mt-1 text-xs text-tertiary-500">{{ errors.phone_number }}</p>
      </div>
      <div>
        <label class="input-label" for="tin">TIN (Tax Identification Number)</label>
        <input id="tin" v-model="tin" type="text" class="input-field" placeholder="TIN">
      </div>
      <div>
        <label class="input-label" for="bank_name">Bank name</label>
        <input id="bank_name" v-model="bank_name" type="text" class="input-field" placeholder="Bank name">
      </div>
      <div class="sm:col-span-2">
        <label class="input-label" for="contact_address">Contact address</label>
        <textarea id="contact_address" v-model="contact_address" rows="2" class="input-field" placeholder="Contact address" />
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
