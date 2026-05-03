<script setup lang="ts">
import { Container, AlertTriangle, Wallet, ArrowRight, Ship } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { findProduct } from '~/utils/products'
import { useMarineStore } from '~/stores/marine'

const product = findProduct('marine')!
const marine = useMarineStore()
const { shipments, voyagesInsured, openClaims, premiumYtd, activeShipments } = storeToRefs(marine)

const premiumLabel = computed(() => `₦${(premiumYtd.value / 1_000_000).toFixed(1)}M`)
</script>

<template>
  <div class="space-y-6">
    <ProductProductHero :product="product" greeting="Bon voyage" />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ProductStatCard label="Active Shipments" :value="String(activeShipments)" :icon="Container" icon-bg="bg-secondary-100" icon-color="text-secondary-700" />
      <ProductStatCard label="Voyages Insured" :value="String(voyagesInsured)" delta="+3 this month" trend="up" :icon="Ship" />
      <ProductStatCard label="Open Claims" :value="String(openClaims)" delta="under review" :icon="AlertTriangle" icon-bg="bg-tertiary-50" icon-color="text-tertiary-500" />
      <ProductStatCard label="Premium YTD" :value="premiumLabel" delta="+9% YoY" trend="up" :icon="Wallet" />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-semibold text-secondary-900">Recent shipments</h2>
            <p class="text-sm text-secondary-500">Cargo and goods-in-transit cover</p>
          </div>
          <button class="btn-ghost text-sm" type="button">
            View all <ArrowRight class="size-4" />
          </button>
        </div>
        <ul class="divide-y divide-secondary-100">
          <li
            v-for="s in shipments"
            :key="s.id"
            class="flex flex-wrap items-center gap-4 px-6 py-4 cursor-pointer hover:bg-secondary-50"
            @click="marine.setLastViewed(s.id)"
          >
            <div class="flex size-12 items-center justify-center rounded-2xl bg-secondary-100">
              <Container class="size-6 text-secondary-700" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-secondary-900">{{ s.goods }}</p>
              <p class="text-sm text-secondary-500">{{ s.ref }} · {{ s.route }}</p>
            </div>
            <div class="text-right">
              <span
                :class="[
                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  s.status === 'In transit'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-secondary-100 text-secondary-700',
                ]"
              >
                {{ s.status }}
              </span>
              <p class="mt-1 text-xs text-secondary-500">Cover value · {{ s.value }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="card p-6">
        <h3 class="text-base font-semibold text-secondary-900">Marine actions</h3>
        <p class="mt-1 text-sm text-secondary-500">Manage cargo and hull cover</p>
        <div class="mt-4 grid grid-cols-1 gap-2">
          <button class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-secondary-300 hover:bg-secondary-50 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-secondary-900">Declare a shipment</p>
              <p class="text-xs text-secondary-500">Add a new voyage to cover</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </button>
          <button class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-secondary-300 hover:bg-secondary-50 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-secondary-900">Request certificate</p>
              <p class="text-xs text-secondary-500">Generate marine cover certificate</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </button>
          <button class="flex items-center justify-between rounded-xl border border-secondary-100 p-4 text-left transition hover:border-secondary-300 hover:bg-secondary-50 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-secondary-900">File a marine claim</p>
              <p class="text-xs text-secondary-500">Lost or damaged goods</p>
            </div>
            <ArrowRight class="size-4 text-secondary-400" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
