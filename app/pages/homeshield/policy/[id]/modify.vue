<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { toast } from 'vue-sonner'
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  RefreshCw,
  Edit3,
} from 'lucide-vue-next'
import { useHomeshieldStore } from '~/stores/homeshield'
import { PROPERTY_KINDS, HOMESHIELD_CATEGORIES, findCategory } from '~/utils/homeshield-constants'
import { formatNaira } from '~/utils/format'
import type { HomeshieldModifyPayload } from '~/types/homeshield'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const id = computed(() => Number(route.params.id))

const homeshield = useHomeshieldStore()
const {
  policyById,
  policyDetailLoading,
  policyDetailError,
  modifyLoading,
  sectors,
  sectorsLoading,
} = storeToRefs(homeshield)

const policy = computed(() => policyById.value[id.value])

await Promise.all([
  homeshield.fetchPolicy(id.value).catch(() => {}),
  homeshield.fetchSectors().catch(() => {}),
])

// Local form state — initialised from the loaded policy.
const form = reactive<HomeshieldModifyPayload>({
  purpose: '',
  holder_type: 'individual',
  owner_type: 'tenant',
  first_name: '',
  last_name: '',
  company_name: null,
  email: '',
  contact_address: '',
  phone_number: '',
  identification_number: '',
  upload_id: null,
  sector: '',
  upload_property_photo: null,
  property_address: '',
  value_of_property: 0,
  property_type: 'residential',
  property_Kind: '',
  category: 'Category A',
})

function hydrateFromPolicy() {
  if (!policy.value) return
  const p = policy.value
  form.holder_type = (p.holder_type?.toLowerCase() as 'individual' | 'corporate') || 'individual'
  form.owner_type = (p.owner_type?.toLowerCase() as 'tenant' | 'landlord') || 'tenant'
  form.first_name = p.first_name ?? ''
  form.last_name = p.last_name ?? ''
  form.company_name = p.company_name ?? null
  form.email = p.email ?? ''
  form.contact_address = p.contact_address ?? ''
  form.phone_number = p.phone_number ?? ''
  form.identification_number = p.identification_number ?? ''
  form.sector = p.sector ?? ''
  form.property_address = p.property_address ?? ''
  form.value_of_property = Number(p.value_of_property) || 0
  form.property_type = ((p.property_type?.toLowerCase() as 'residential' | 'commercial')) || 'residential'
  // Normalise stored category like "CATEGORY A" → "Category A"
  const cat = (p.category || '').replace(/category\s+/i, 'Category ')
  form.category = cat || 'Category A'
}

watchEffect(() => {
  if (policy.value) hydrateFromPolicy()
})

const isCorporate = computed(() => form.holder_type === 'corporate')
const categoryMeta = computed(() => findCategory(form.category as 'Category A' | 'Category B'))

// Currency display sync
const displayValue = ref('')
watchEffect(() => {
  displayValue.value = form.value_of_property
    ? Number(form.value_of_property).toLocaleString('en-NG')
    : ''
})

function onValueInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
  form.value_of_property = raw ? Number(raw) : 0
  displayValue.value = raw ? Number(raw).toLocaleString('en-NG') : ''
}

const errors = ref<Record<string, string>>({})

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.purpose.trim()) e.purpose = 'Tell us why you are modifying this policy'

  if (isCorporate.value) {
    if (!form.company_name?.trim()) e.company_name = 'Company name is required'
  }
  else {
    if (!form.first_name.trim()) e.first_name = 'First name is required'
    if (!form.last_name.trim()) e.last_name = 'Last name is required'
  }

  if (!form.email.trim()) e.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email'
  if (!form.phone_number.trim()) e.phone_number = 'Phone is required'
  if (!form.contact_address.trim()) e.contact_address = 'Contact address is required'
  if (!form.identification_number.trim()) e.identification_number = 'ID number is required'
  if (!form.sector) e.sector = 'Please select a sector'
  if (!form.property_address.trim()) e.property_address = 'Property address is required'

  if (!form.value_of_property) e.value_of_property = 'Enter the property value'
  else if (categoryMeta.value && (form.value_of_property < categoryMeta.value.minValue || form.value_of_property > categoryMeta.value.maxValue)) {
    e.value_of_property = `${categoryMeta.value.label} requires a value between ${formatNaira(categoryMeta.value.minValue)} and ${formatNaira(categoryMeta.value.maxValue)}`
  }

  if (!form.property_type) e.property_type = 'Choose a property type'
  if (!form.property_Kind?.trim()) e.property_Kind = 'Choose a property kind'

  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) {
    toast.warning('Please fix the highlighted fields')
    return
  }
  try {
    await homeshield.modifyPolicy(id.value, {
      ...form,
      // For individual policies, ensure company_name is null and vice versa.
      first_name: isCorporate.value ? '' : form.first_name,
      last_name: isCorporate.value ? '' : form.last_name,
      company_name: isCorporate.value ? form.company_name : null,
    })
    toast.success('Policy updated successfully')
    await navigateTo(`/homeshield/policy/${id.value}`)
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not update policy')
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <NuxtLink
      :to="`/homeshield/policy/${id}`"
      class="inline-flex items-center gap-2 text-sm font-semibold text-secondary-600 hover:text-secondary-900"
    >
      <ArrowLeft class="size-4" /> Back to policy
    </NuxtLink>

    <!-- Loading -->
    <div v-if="policyDetailLoading && !policy" class="card p-10 text-center">
      <div class="mx-auto size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p class="mt-3 text-sm text-secondary-500">Loading policy…</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="policyDetailError && !policy"
      class="card flex flex-col items-center gap-3 p-10 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-tertiary-50">
        <AlertTriangle class="size-6 text-tertiary-500" />
      </div>
      <p class="text-sm font-semibold text-secondary-900">Couldn't load this policy</p>
      <p class="max-w-md text-sm text-secondary-500">{{ policyDetailError }}</p>
      <button
        type="button"
        class="btn-outline text-sm mt-2"
        @click="homeshield.fetchPolicy(id)"
      >
        <RefreshCw class="size-4" /> Try again
      </button>
    </div>

    <template v-else-if="policy">
      <!-- Header -->
      <div class="flex items-start gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-tertiary-100">
          <Edit3 class="size-6 text-tertiary-500" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-secondary-500">
            Homeshield · Modify policy
          </p>
          <h1 class="mt-1 text-2xl font-bold text-secondary-900 sm:text-3xl">
            {{ policy.policy_number }}
          </h1>
          <p class="mt-1 text-sm text-secondary-500">
            Update the policy holder, property, or category. Tell us why.
          </p>
        </div>
      </div>

      <form class="space-y-6" @submit.prevent="save">
        <!-- Purpose -->
        <section class="card p-6">
          <h2 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Purpose of modification</h2>
          <p class="mt-1 text-xs text-secondary-500">
            Required for our audit trail.
          </p>
          <textarea
            v-model="form.purpose"
            rows="3"
            class="input-field mt-3"
            placeholder="e.g. I chose landlord instead of tenant"
          />
          <p v-if="errors.purpose" class="mt-1 text-xs text-tertiary-500">{{ errors.purpose }}</p>
        </section>

        <!-- Holder & owner type -->
        <section class="card p-6">
          <h2 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Holder & owner</h2>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label">Holder type</label>
              <select v-model="form.holder_type" class="input-field">
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            <div>
              <label class="input-label">Owner type</label>
              <select v-model="form.owner_type" class="input-field">
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Holder details -->
        <section class="card p-6">
          <h2 class="text-sm font-bold uppercase tracking-widest text-secondary-500">
            {{ isCorporate ? 'Company details' : 'Personal information' }}
          </h2>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <template v-if="isCorporate">
              <div class="sm:col-span-2">
                <label class="input-label">Company name</label>
                <input v-model="form.company_name" type="text" class="input-field" placeholder="Enter company name">
                <p v-if="errors.company_name" class="mt-1 text-xs text-tertiary-500">{{ errors.company_name }}</p>
              </div>
              <div class="sm:col-span-2">
                <label class="input-label">RC number</label>
                <input v-model="form.identification_number" type="text" class="input-field" placeholder="Enter RC number">
                <p v-if="errors.identification_number" class="mt-1 text-xs text-tertiary-500">{{ errors.identification_number }}</p>
              </div>
            </template>
            <template v-else>
              <div>
                <label class="input-label">First name</label>
                <input v-model="form.first_name" type="text" class="input-field" placeholder="Enter first name">
                <p v-if="errors.first_name" class="mt-1 text-xs text-tertiary-500">{{ errors.first_name }}</p>
              </div>
              <div>
                <label class="input-label">Last name</label>
                <input v-model="form.last_name" type="text" class="input-field" placeholder="Enter last name">
                <p v-if="errors.last_name" class="mt-1 text-xs text-tertiary-500">{{ errors.last_name }}</p>
              </div>
              <div class="sm:col-span-2">
                <label class="input-label">NIN</label>
                <input v-model="form.identification_number" type="text" class="input-field" placeholder="11-digit NIN" maxlength="11">
                <p v-if="errors.identification_number" class="mt-1 text-xs text-tertiary-500">{{ errors.identification_number }}</p>
              </div>
            </template>

            <div>
              <label class="input-label">Email</label>
              <input v-model="form.email" type="email" class="input-field" placeholder="Enter email address">
              <p v-if="errors.email" class="mt-1 text-xs text-tertiary-500">{{ errors.email }}</p>
            </div>
            <div>
              <label class="input-label">Phone number</label>
              <input v-model="form.phone_number" type="tel" class="input-field" placeholder="Enter phone number">
              <p v-if="errors.phone_number" class="mt-1 text-xs text-tertiary-500">{{ errors.phone_number }}</p>
            </div>
            <div :class="[isCorporate ? 'sm:col-span-2' : '']">
              <label class="input-label">Sector</label>
              <select v-model="form.sector" class="input-field" :disabled="sectorsLoading">
                <option value="" disabled>
                  {{ sectorsLoading ? 'Loading sectors…' : 'Select a sector' }}
                </option>
                <option v-for="s in sectors" :key="s.id ?? s.name" :value="s.name">
                  {{ s.name }}
                </option>
              </select>
              <p v-if="errors.sector" class="mt-1 text-xs text-tertiary-500">{{ errors.sector }}</p>
            </div>
            <div class="sm:col-span-2">
              <label class="input-label">Contact address</label>
              <textarea v-model="form.contact_address" rows="2" class="input-field" placeholder="Enter contact address" />
              <p v-if="errors.contact_address" class="mt-1 text-xs text-tertiary-500">{{ errors.contact_address }}</p>
            </div>
          </div>
        </section>

        <!-- Property -->
        <section class="card p-6">
          <h2 class="text-sm font-bold uppercase tracking-widest text-secondary-500">Property & category</h2>
          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label">Category</label>
              <select v-model="form.category" class="input-field">
                <option v-for="c in HOMESHIELD_CATEGORIES" :key="c.id" :value="c.id">
                  {{ c.label }} — premium {{ formatNaira(c.premium) }}
                </option>
              </select>
              <p v-if="categoryMeta" class="mt-1 text-xs text-secondary-500">
                {{ categoryMeta.rangeLabel }}
              </p>
            </div>
            <div>
              <label class="input-label">Value of property (₦)</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-secondary-500">₦</span>
                <input
                  type="text"
                  inputmode="numeric"
                  class="input-field pl-9"
                  placeholder="20,000,000"
                  :value="displayValue"
                  @input="onValueInput"
                >
              </div>
              <p v-if="errors.value_of_property" class="mt-1 text-xs text-tertiary-500">{{ errors.value_of_property }}</p>
            </div>
            <div>
              <label class="input-label">Property type</label>
              <select v-model="form.property_type" class="input-field">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
              <p v-if="errors.property_type" class="mt-1 text-xs text-tertiary-500">{{ errors.property_type }}</p>
            </div>
            <div>
              <label class="input-label">Property kind</label>
              <select v-model="form.property_Kind" class="input-field">
                <option value="" disabled>Select a kind</option>
                <option v-for="k in PROPERTY_KINDS" :key="k" :value="k">{{ k }}</option>
              </select>
              <p v-if="errors.property_Kind" class="mt-1 text-xs text-tertiary-500">{{ errors.property_Kind }}</p>
            </div>
            <div class="sm:col-span-2">
              <label class="input-label">Property address</label>
              <textarea v-model="form.property_address" rows="2" class="input-field" placeholder="Enter property address" />
              <p v-if="errors.property_address" class="mt-1 text-xs text-tertiary-500">{{ errors.property_address }}</p>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <NuxtLink
            :to="`/homeshield/policy/${id}`"
            class="btn-ghost border border-secondary-100"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            class="btn-primary"
            :disabled="modifyLoading"
          >
            <span
              v-if="modifyLoading"
              class="size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <Save v-else class="size-4" />
            {{ modifyLoading ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
