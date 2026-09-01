<script setup lang="ts">
import { MailCheck, Home, ShieldCheck } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { formatNaira } from '~/utils/format'

const app = useHomeshieldApplicationStore()
const {
  submitMessage,
  holderName,
  email,
  phoneNumber,
  propertyAddress,
  propertyType,
  propertyKind,
  valueOfProperty,
} = storeToRefs(app)

function finish() {
  app.reset()
  navigateTo('/homeshield')
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6 py-4 text-center">
    <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-50">
      <MailCheck class="size-8 text-primary-700" />
    </div>

    <div>
      <h2 class="text-2xl font-bold text-secondary-900">Request submitted</h2>
      <p class="mt-2 text-sm text-secondary-600">
        {{ submitMessage || 'Request for Category C submitted successful' }}
      </p>
      <p class="mt-2 text-sm text-secondary-500">
        No payment was taken and no policy has been issued yet. Underwriting and customer
        experience have been notified and will follow up by email with the right cover and
        premium for this property.
      </p>
    </div>

    <div class="rounded-2xl border border-secondary-100 bg-card p-5 text-left">
      <p class="text-sm font-semibold text-secondary-900">What was submitted</p>
      <dl class="mt-3 space-y-2 text-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Name</dt>
          <dd class="font-medium text-secondary-900">{{ holderName || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Phone</dt>
          <dd class="font-medium text-secondary-900">{{ phoneNumber || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Email</dt>
          <dd class="break-all font-medium text-secondary-900">{{ email || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Property</dt>
          <dd class="font-medium capitalize text-secondary-900">
            {{ propertyType || '—' }}<span v-if="propertyKind"> · {{ propertyKind }}</span>
          </dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Value</dt>
          <dd class="font-medium tabular-nums text-secondary-900">{{ formatNaira(valueOfProperty ?? 0) }}</dd>
        </div>
        <div>
          <dt class="text-secondary-500">Location</dt>
          <dd class="mt-0.5 text-secondary-900">{{ propertyAddress || '—' }}</dd>
        </div>
      </dl>
    </div>

    <div class="flex flex-wrap justify-center gap-3">
      <button type="button" class="btn-primary" @click="finish">
        <Home class="size-4" /> Back to Homeshield
      </button>
      <NuxtLink to="/homeshield/my-policies" class="btn-ghost border border-secondary-100">
        <ShieldCheck class="size-4" /> My policies
      </NuxtLink>
    </div>
  </div>
</template>
