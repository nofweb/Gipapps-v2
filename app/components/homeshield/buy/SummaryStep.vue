<script setup lang="ts">
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useHomeshieldApplicationStore } from '~/stores/homeshield/application'
import { HOMESHIELD_QUESTIONS, findCategory } from '~/utils/homeshield-constants'
import { formatNaira } from '~/utils/format'

const app = useHomeshieldApplicationStore()
const {
  category,
  holderType,
  ownerType,
  firstName,
  lastName,
  companyName,
  email,
  phoneNumber,
  contactAddress,
  identificationNumber,
  identificationType,
  sector,
  propertyAddress,
  valueOfProperty,
  propertyType,
  propertyKind,
  questionnaire,
  premium,
} = storeToRefs(app)

const categoryMeta = computed(() => findCategory(category.value))
const holderName = computed(() =>
  holderType.value === 'corporate'
    ? companyName.value
    : [firstName.value, lastName.value].filter(Boolean).join(' '))

function questionText(id: number) {
  return HOMESHIELD_QUESTIONS.find(q => q.id === id)?.text ?? ''
}
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
      <p class="text-xs font-semibold uppercase tracking-widest text-primary">Total premium</p>
      <p class="mt-2 text-3xl font-bold tabular-nums">{{ formatNaira(premium) }}</p>
      <p class="mt-1 text-sm text-secondary-300">
        {{ categoryMeta?.label }} · {{ categoryMeta?.rangeLabel }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Holder -->
      <section class="card p-5">
        <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Policy holder</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Type</dt>
            <dd class="font-medium text-secondary-900 capitalize">{{ holderType }} · {{ ownerType }}</dd>
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
            <dt class="text-secondary-500">{{ identificationType === 'rc_number' ? 'RC number' : 'NIN' }}</dt>
            <dd class="font-medium text-secondary-900">{{ identificationNumber }}</dd>
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

      <!-- Property -->
      <section class="card p-5">
        <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Property</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Type</dt>
            <dd class="font-medium text-secondary-900 capitalize">{{ propertyType }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Kind</dt>
            <dd class="font-medium text-secondary-900">{{ propertyKind }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-secondary-500">Value</dt>
            <dd class="font-medium text-secondary-900 tabular-nums">{{ formatNaira(valueOfProperty ?? 0) }}</dd>
          </div>
          <div>
            <dt class="text-secondary-500">Address</dt>
            <dd class="mt-0.5 text-secondary-900">{{ propertyAddress }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <!-- Questionnaire -->
    <section class="card overflow-hidden">
      <header class="flex items-center justify-between border-b border-secondary-100 px-5 py-3">
        <h3 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Questionnaire</h3>
        <span class="text-xs text-secondary-500">{{ questionnaire.length }} questions</span>
      </header>
      <ul class="divide-y divide-secondary-100">
        <li v-for="entry in questionnaire" :key="entry.id" class="px-5 py-3">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="max-w-3xl text-sm text-secondary-800">
              <span class="font-semibold text-secondary-500 mr-1">{{ entry.id }}.</span>
              {{ questionText(entry.id) }}
            </p>
            <span
              :class="[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                entry.answer === 'yes' ? 'bg-primary-50 text-primary-700' : 'bg-secondary-100 text-secondary-700',
              ]"
            >
              <CheckCircle2 v-if="entry.answer === 'yes'" class="size-3.5" />
              <XCircle v-else class="size-3.5" />
              {{ entry.answer }}
            </span>
          </div>
          <p v-if="entry.details" class="ml-5 mt-2 rounded-xl bg-secondary-50 px-3 py-2 text-xs text-secondary-700">
            {{ entry.details }}
          </p>
        </li>
      </ul>
    </section>

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
