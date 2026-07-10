<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMarineQuotationStore } from '~/stores/marine/quotation'

const app = useMarineQuotationStore()
const { email, phone_number, tin, bank_name, contact_address } = storeToRefs(app)

function proceed() {
  if (!email.value) return toast.error('Email is required')
  if (!phone_number.value) return toast.error('Phone number is required')
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
        <input id="email" v-model="email" type="email" class="input-field" placeholder="Email address">
      </div>
      <div>
        <label class="input-label" for="phone_number">Phone number</label>
        <input id="phone_number" v-model="phone_number" type="tel" class="input-field" placeholder="Phone number">
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
