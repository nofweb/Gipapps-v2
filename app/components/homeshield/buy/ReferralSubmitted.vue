<script setup lang="ts">
import { MailCheck, Home, ShieldCheck } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { formatNaira } from '~/utils/format'

const app = useHomeshieldApplicationStore()
const { referral } = storeToRefs(app)

const referralName = computed(() => {
  const r = referral.value
  if (!r) return ''
  return r.company_name || [r.first_name, r.last_name].filter(Boolean).join(' ')
})

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
      <h2 class="text-2xl font-bold text-secondary-900">Thank you!</h2>
      <p class="mt-2 text-sm text-secondary-600">
        Your details are with our technical underwriting team.
      </p>
      <p class="mt-2 text-sm text-secondary-500">
        This risk needs a closer look than the online form allows. An underwriter will contact you
        shortly to review the property and complete your policy.
      </p>
    </div>

    <div v-if="referral" class="rounded-2xl border border-secondary-100 bg-card p-5 text-left">
      <p class="text-sm font-semibold text-secondary-900">We will reach you on</p>
      <dl class="mt-3 space-y-2 text-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Name</dt>
          <dd class="font-medium text-secondary-900">{{ referralName || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Phone</dt>
          <dd class="font-medium text-secondary-900">{{ referral.phone_number || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Email</dt>
          <dd class="break-all font-medium text-secondary-900">{{ referral.email || '—' }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Property</dt>
          <dd class="font-medium capitalize text-secondary-900">
            {{ referral.property_usage }}<span v-if="referral.property_type"> · {{ referral.property_type.toLowerCase() }}</span>
          </dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-secondary-500">Value</dt>
          <dd class="font-medium tabular-nums text-secondary-900">{{ formatNaira(referral.value_of_property) }}</dd>
        </div>
        <div>
          <dt class="text-secondary-500">Location</dt>
          <dd class="mt-0.5 text-secondary-900">{{ referral.property_address || '—' }}</dd>
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
