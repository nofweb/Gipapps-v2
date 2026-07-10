<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMarineQuotationStore } from '~/stores/marine/quotation'

const app = useMarineQuotationStore()
const {
  holder_type,
  policy_type,
  policy_number,
  first_name,
  last_name,
  company_name,
  isIndividual,
  isCompany,
  isOpenCover,
} = storeToRefs(app)

const HOLDER_TYPES = [
  { value: 'individual', name: 'Individual' },
  { value: 'corporate', name: 'Corporate' },
  { value: 'government', name: 'Government' },
]
const POLICY_TYPES = [
  { value: 'single_transit', name: 'Single Transit' },
  { value: 'open_cover', name: 'Open Cover' },
]

function proceed() {
  if (!holder_type.value) return toast.error('Policy holder type is required')
  if (!policy_type.value) return toast.error('Policy type is required')
  if (isIndividual.value && !first_name.value) return toast.error('First name is required')
  if (isIndividual.value && !last_name.value) return toast.error('Last name is required')
  if (isCompany.value && !company_name.value) return toast.error('Company name is required')
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Policy details</h2>
      <p class="mt-1 text-sm text-secondary-500">Who is this marine cover for?</p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="input-label" for="holder_type">Policy holder type</label>
        <select id="holder_type" v-model="holder_type" class="input-field">
          <option value="" disabled>Select holder type</option>
          <option v-for="o in HOLDER_TYPES" :key="o.value" :value="o.value">{{ o.name }}</option>
        </select>
      </div>
      <div>
        <label class="input-label" for="policy_type">Policy type</label>
        <select id="policy_type" v-model="policy_type" class="input-field">
          <option value="" disabled>Select policy type</option>
          <option v-for="o in POLICY_TYPES" :key="o.value" :value="o.value">{{ o.name }}</option>
        </select>
      </div>
      <div v-if="isOpenCover" class="sm:col-span-2">
        <label class="input-label" for="policy_number">Policy number</label>
        <input id="policy_number" v-model="policy_number" type="text" class="input-field" placeholder="Open cover policy number">
      </div>

      <template v-if="isIndividual">
        <div>
          <label class="input-label" for="first_name">First name</label>
          <input id="first_name" v-model="first_name" type="text" class="input-field" placeholder="First name">
        </div>
        <div>
          <label class="input-label" for="last_name">Last name</label>
          <input id="last_name" v-model="last_name" type="text" class="input-field" placeholder="Last name">
        </div>
      </template>
      <div v-else-if="isCompany" class="sm:col-span-2">
        <label class="input-label" for="company_name">Company name</label>
        <input id="company_name" v-model="company_name" type="text" class="input-field" placeholder="Company name">
      </div>
    </div>

    <div class="flex justify-end">
      <button type="button" class="btn-primary" @click="proceed">
        Continue <ArrowRight class="size-4" />
      </button>
    </div>
  </div>
</template>
