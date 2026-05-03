<script setup lang="ts">
import { Car, FileCheck2, AlertTriangle, Wallet, ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { findProduct } from '~/utils/products'
import { useMotorStore } from '~/stores/motor'

const product = findProduct('motor')!
const motor = useMotorStore()
const { policies, openClaims, premiumYtd, activeCount, vehicleCount } = storeToRefs(motor)

const premiumLabel = computed(() => `₦${(premiumYtd.value / 1000).toFixed(0)}k`)
</script>

<template>
  <div class="space-y-6">
    <ProductProductHero :product="product" greeting="Welcome back" />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ProductStatCard label="Active Policies" :value="String(activeCount)" delta="+1 this year" trend="up" :icon="FileCheck2" />
      <ProductStatCard label="Vehicles Insured" :value="String(vehicleCount)" delta="2 personal · 1 fleet" trend="flat" :icon="Car" />
      <ProductStatCard label="Open Claims" :value="String(openClaims)" delta="awaiting docs" trend="down" :icon="AlertTriangle" icon-bg="bg-tertiary-50" icon-color="text-tertiary-500" />
      <ProductStatCard label="Premium YTD" :value="premiumLabel" delta="+12% YoY" trend="up" :icon="Wallet" />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-semibold text-secondary-900">Your motor policies</h2>
            <p class="text-sm text-secondary-500">All vehicles registered to your account</p>
          </div>
          <button class="btn-ghost text-sm" type="button">
            View all
            <ArrowRight class="size-4" />
          </button>
        </div>
        <ul class="divide-y divide-secondary-100">
          <li
            v-for="p in policies"
            :key="p.id"
            class="flex flex-wrap items-center gap-4 px-6 py-4 cursor-pointer hover:bg-secondary-50"
            @click="motor.setLastViewed(p.id)"
          >
            <div class="flex size-12 items-center justify-center rounded-2xl bg-primary-50">
              <Car class="size-6 text-primary-700" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-secondary-900">{{ p.model }}</p>
              <p class="text-sm text-secondary-500">{{ p.plate }} · {{ p.type }}</p>
            </div>
            <div class="text-right">
              <span
                :class="[
                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  p.status === 'Active' ? 'bg-primary-50 text-primary-700' : 'bg-tertiary-50 text-tertiary-600',
                ]"
              >
                {{ p.status }}
              </span>
              <p class="mt-1 text-xs text-secondary-500">{{ p.expiry }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="card p-6">
        <h3 class="text-base font-semibold text-secondary-900">Quick actions</h3>
        <p class="mt-1 text-sm text-secondary-500">Common tasks for motor cover</p>
        <div class="mt-4 grid grid-cols-1 gap-2">
          <button class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-secondary-900">Renew a policy</p>
              <p class="text-xs text-secondary-500">Continue an existing cover</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </button>
          <button class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-secondary-900">File a claim</p>
              <p class="text-xs text-secondary-500">Report an incident or damage</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </button>
          <button class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-secondary-900">Add a vehicle</p>
              <p class="text-xs text-secondary-500">Insure a new car or fleet</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
