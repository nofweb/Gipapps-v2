<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMarineQuotationStore } from '~/stores/marine/quotation'
import { useMarineStore } from '~/stores/marine'

const app = useMarineQuotationStore()
const marine = useMarineStore()
const {
  cover_type,
  packaging_type,
  port_of_departure,
  port_of_destination,
  vessel_name,
  cargo_description,
  rate_id,
  broker_rate_id,
  useBrokerRates,
} = storeToRefs(app)
const { coverTypes, coverTypesLoading, rates, myRates } = storeToRefs(marine)

const PACKAGING_TYPES = [
  { value: 'containerized', name: 'Containerized' },
  { value: 'non containerized', name: 'Non Containerized' },
]

function proceed() {
  if (!cover_type.value) return toast.error('Cover type is required')
  if (!port_of_departure.value) return toast.error('Port of departure is required')
  if (!port_of_destination.value) return toast.error('Port of destination is required')
  app.next()
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Shipment</h2>
      <p class="mt-1 text-sm text-secondary-500">Details of the cargo and voyage.</p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="input-label" for="cover_type">Cover type</label>
        <select id="cover_type" v-model="cover_type" class="input-field" :disabled="coverTypesLoading">
          <option value="" disabled>{{ coverTypesLoading ? 'Loading cover types…' : 'Select cover type' }}</option>
          <option v-for="o in coverTypes" :key="o.value" :value="o.value">{{ o.text }}</option>
        </select>
      </div>
      <div>
        <label class="input-label" for="packaging_type">Packaging type</label>
        <select id="packaging_type" v-model="packaging_type" class="input-field">
          <option value="" disabled>Select packaging type</option>
          <option v-for="o in PACKAGING_TYPES" :key="o.value" :value="o.value">{{ o.name }}</option>
        </select>
      </div>
      <div>
        <label class="input-label" for="port_of_departure">Port of departure</label>
        <input id="port_of_departure" v-model="port_of_departure" type="text" class="input-field" placeholder="Port of departure">
      </div>
      <div>
        <label class="input-label" for="port_of_destination">Port of destination</label>
        <input id="port_of_destination" v-model="port_of_destination" type="text" class="input-field" placeholder="Port of destination">
      </div>
      <div>
        <label class="input-label" for="vessel_name">Vessel name</label>
        <input id="vessel_name" v-model="vessel_name" type="text" class="input-field" placeholder="Vessel name">
      </div>
      <div>
        <label class="input-label" for="cargo_description">Cargo description</label>
        <input id="cargo_description" v-model="cargo_description" type="text" class="input-field" placeholder="Cargo description">
      </div>
      <div class="sm:col-span-2">
        <label class="input-label" for="nature_of_cargo">Nature of cargo</label>
        <select v-if="useBrokerRates" id="nature_of_cargo" v-model="broker_rate_id" class="input-field">
          <option value="" disabled>Select nature of cargo</option>
          <option v-for="r in myRates" :key="r.id" :value="r.id">{{ r.condition }}</option>
        </select>
        <select v-else id="nature_of_cargo" v-model="rate_id" class="input-field">
          <option value="" disabled>Select nature of cargo</option>
          <option v-for="r in rates" :key="r.id" :value="r.id">{{ r.condition }}</option>
        </select>
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
