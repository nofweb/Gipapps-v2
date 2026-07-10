<script setup lang="ts">
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { toast } from 'vue3-toastify'
import { useMarineQuotationStore } from '~/stores/marine/quotation'
import { useMarineStore } from '~/stores/marine'
import { formatNaira } from '~/utils/format'

const router = useRouter()
const app = useMarineQuotationStore()
const marine = useMarineStore()
const { generatingQuotation } = storeToRefs(marine)

const {
  holder_type,
  policy_type,
  policy_number,
  email,
  phone_number,
  tin,
  bank_name,
  contact_address,
  packaging_type,
  port_of_departure,
  port_of_destination,
  vessel_name,
  cargo_description,
  cargo_currency,
  invoice_value,
  exchange_rate,
  basic_rate,
  premium,
  proforma_invoice_number,
  proformaFileName,
  isOpenCover,
} = storeToRefs(app)

const POLICY_TYPE_LABELS: Record<string, string> = {
  single_transit: 'Single Transit',
  open_cover: 'Open Cover',
}

async function submit() {
  if (!app.proformaFileUrl) {
    toast.error('Please upload the proforma invoice')
    app.goTo(5)
    return
  }
  try {
    await app.generate()
    // Success toast is surfaced by the API response interceptor.
    app.reset()
    router.push('/marine/quotations')
  }
  catch {
    // Error toast is surfaced by the API response interceptor.
  }
}
</script>

<template>
  <div class="space-y-6">
    <header>
      <h2 class="text-xl font-bold text-secondary-900">Review your quotation</h2>
      <p class="mt-1 text-sm text-secondary-500">Make sure everything looks right before you submit.</p>
    </header>

    <!-- Premium hero -->
    <div class="rounded-2xl bg-gradient-hero p-6 text-white">
      <p class="text-xs font-semibold uppercase tracking-widest text-primary">Estimated premium</p>
      <p class="mt-2 text-3xl font-bold tabular-nums">
        {{ premium === '' ? '—' : formatNaira(premium) }}
      </p>
      <p class="mt-1 text-sm text-secondary-300">
        Marine · {{ app.coverTypeLabel || '—' }}
        <template v-if="cargo_currency"> · {{ cargo_currency }}</template>
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Holder -->
      <section class="card p-5">
        <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Policy holder</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Type</dt>
            <dd class="font-medium text-secondary-900 capitalize">{{ holder_type }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Name</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ app.holderName || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Policy type</dt>
            <dd class="font-medium text-secondary-900">{{ POLICY_TYPE_LABELS[policy_type] ?? policy_type ?? '—' }}</dd>
          </div>
          <div v-if="isOpenCover" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Policy number</dt>
            <dd class="font-medium text-secondary-900">{{ policy_number || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Email</dt>
            <dd class="font-medium text-secondary-900 text-right break-all">{{ email }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Phone</dt>
            <dd class="font-medium text-secondary-900">{{ phone_number }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">TIN</dt>
            <dd class="font-medium text-secondary-900">{{ tin }}</dd>
          </div>
          <div v-if="bank_name" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Bank</dt>
            <dd class="font-medium text-secondary-900">{{ bank_name }}</dd>
          </div>
          <div>
            <dt class="text-secondary-500">Contact address</dt>
            <dd class="mt-0.5 text-secondary-900">{{ contact_address }}</dd>
          </div>
        </dl>
      </section>

      <!-- Shipment -->
      <section class="card p-5">
        <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Shipment</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Cover type</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ app.coverTypeLabel || '—' }}</dd>
          </div>
          <div v-if="packaging_type" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Packaging</dt>
            <dd class="font-medium text-secondary-900 capitalize">{{ packaging_type }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Departure</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ port_of_departure }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Destination</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ port_of_destination }}</dd>
          </div>
          <div v-if="vessel_name" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Vessel</dt>
            <dd class="font-medium text-secondary-900">{{ vessel_name }}</dd>
          </div>
          <div v-if="cargo_description" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Cargo</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ cargo_description }}</dd>
          </div>
          <div v-if="app.natureOfCargoLabel" class="flex justify-between gap-3">
            <dt class="text-secondary-500">Nature of cargo</dt>
            <dd class="font-medium text-secondary-900 text-right">{{ app.natureOfCargoLabel }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <!-- Valuation & documents -->
    <section class="card p-5">
      <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Valuation & documents</h3>
      <dl class="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt class="text-xs text-secondary-500">Invoice value</dt>
          <dd class="mt-0.5 font-semibold text-secondary-900 tabular-nums">{{ formatNaira(invoice_value) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-secondary-500">Basic rate</dt>
          <dd class="mt-0.5 font-semibold text-secondary-900">{{ basic_rate || '—' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-secondary-500">Exchange rate</dt>
          <dd class="mt-0.5 font-semibold text-secondary-900">{{ exchange_rate || '—' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-secondary-500">Premium</dt>
          <dd class="mt-0.5 font-semibold text-secondary-900 tabular-nums">
            {{ premium === '' ? '—' : formatNaira(premium) }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-secondary-500">Proforma no.</dt>
          <dd class="mt-0.5 font-medium text-secondary-900">{{ proforma_invoice_number || '—' }}</dd>
        </div>
        <div class="col-span-2">
          <dt class="text-xs text-secondary-500">Proforma file</dt>
          <dd class="mt-0.5 font-medium text-secondary-900 break-all">{{ proformaFileName || '—' }}</dd>
        </div>
      </dl>
    </section>

    <div class="flex justify-between">
      <button type="button" class="btn-ghost border border-secondary-100" :disabled="generatingQuotation" @click="app.prev()">
        <ArrowLeft class="size-4" /> Back
      </button>
      <button type="button" class="btn-primary" :disabled="generatingQuotation" @click="submit">
        <Loader2 v-if="generatingQuotation" class="size-4 animate-spin" />
        {{ generatingQuotation ? 'Generating quotation…' : 'Generate quotation' }}
      </button>
    </div>
  </div>
</template>
