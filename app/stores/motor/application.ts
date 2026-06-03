import { defineStore } from 'pinia'
import axios, { type AxiosError } from 'axios'
import type {
  MotorBuyPolicyBase,
  MotorBuyComprehensivePayload,
  MotorBuyPolicyPayload,
  MotorBuyPolicyResponse,
  MotorCorporateIdType,
  MotorHolderType,
  MotorIndividualIdType,
  MotorInsuranceClass,
  MotorPaymentMethod,
  MotorPolicy,
  MotorPolicyFamily,
  MotorPremiumQuote,
  MotorPremiumQuoteResponse,
  MotorPremiumType,
  MotorVehicleType,
} from '~/types/motor'
import {
  CORPORATE_ID_LABELS,
  familyEndpoint,
  familyVehicleSaveEndpoint,
  findMotorVariant,
  getThirdPartyPremium,
  INDIVIDUAL_ID_LABELS,
  toInsuranceClassCode,
  type MotorVariant,
  type MotorVariantMeta,
} from '~/utils/motor-constants'

interface MotorApplicationState {
  step: number
  variant: MotorVariant | null

  insuranceClass: MotorInsuranceClass | null
  holderType: MotorHolderType | null

  // Personal / Corporate
  firstName: string
  lastName: string
  companyName: string
  email: string
  phoneNumber: string
  contactAddress: string
  sector: string

  // Identification
  individualIdType: MotorIndividualIdType
  corporateIdType: MotorCorporateIdType
  identificationNumber: string
  documentUrl: string

  // Vehicle
  registrationNumber: string
  registrationVerified: boolean
  vehicleMakeId: string
  vehicleModelId: string
  yearOfMake: number | null
  chassisNumber: string
  engineNumber: string
  vehicleColor: string
  vehicleType: MotorVehicleType | ''

  // Comprehensive only
  carValue: number | null
  premiumType: MotorPremiumType | null
  premiumQuote: MotorPremiumQuote | null

  // Payment
  paymentMethod: MotorPaymentMethod | null

  // Verification flags
  verified: boolean
  verifying: boolean
  verifyError: string | null

  submitting: boolean
  submitError: string | null
  createdPolicy: MotorPolicy | null
}

const defaults = (): MotorApplicationState => ({
  step: 1,
  variant: null,

  insuranceClass: null,
  holderType: null,

  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phoneNumber: '',
  contactAddress: '',
  sector: '',

  individualIdType: 'nin',
  corporateIdType: 'cac',
  identificationNumber: '',
  documentUrl: '',

  registrationNumber: '',
  registrationVerified: false,
  vehicleMakeId: '',
  vehicleModelId: '',
  yearOfMake: null,
  chassisNumber: '',
  engineNumber: '',
  vehicleColor: '',
  vehicleType: '',

  carValue: null,
  premiumType: null,
  premiumQuote: null,

  paymentMethod: null,

  verified: false,
  verifying: false,
  verifyError: null,

  submitting: false,
  submitError: null,
  createdPolicy: null,
})

export const useMotorApplicationStore = defineStore('motor-application', {
  state: (): MotorApplicationState => defaults(),

  getters: {
    variantMeta(state): MotorVariantMeta | null {
      return findMotorVariant(state.variant) ?? null
    },
    family(): MotorPolicyFamily | null {
      return this.variantMeta?.family ?? null
    },
    isComprehensive(): boolean {
      return this.family === 'comprehensive'
    },
    isThirdParty(): boolean {
      return this.family === 'third_party'
    },
    /** Step sequence derived from the active variant. */
    stepKeys(): Array<'class' | 'holder' | 'details' | 'vehicle' | 'plan' | 'summary' | 'payment'> {
      const meta = this.variantMeta
      if (!meta) return ['class', 'holder', 'details', 'vehicle', 'summary', 'payment']
      const steps: Array<'class' | 'holder' | 'details' | 'vehicle' | 'plan' | 'summary' | 'payment'> = []
      if (meta.classSelectable) steps.push('class')
      steps.push('holder', 'details', 'vehicle')
      // Plan step shown for comprehensive variants only (MPE has fixed basePremium).
      if (meta.family === 'comprehensive') steps.push('plan')
      steps.push('summary', 'payment')
      return steps
    },
    totalSteps(): number {
      return this.stepKeys.length
    },
    /** Annual premium displayed in the UI. */
    premium(state): number {
      const meta = this.variantMeta
      if (!meta) return 0
      if (typeof meta.basePremium === 'number') return meta.basePremium
      if (meta.family === 'comprehensive') return state.premiumQuote?.annual_premium ?? 0
      return state.insuranceClass ? getThirdPartyPremium(state.insuranceClass) : 0
    },
    /** Amount the customer pays now (pro-rated for the selected plan). */
    amountDue(state): number {
      const meta = this.variantMeta
      if (!meta) return 0
      if (typeof meta.basePremium === 'number') return meta.basePremium
      if (meta.family === 'comprehensive') return state.premiumQuote?.premium ?? 0
      return state.insuranceClass ? getThirdPartyPremium(state.insuranceClass) : 0
    },
    holderName(state): string {
      if (state.holderType === 'corporate') return state.companyName
      return [state.firstName, state.lastName].filter(Boolean).join(' ')
    },
    identificationLabel(state): string {
      if (state.holderType === 'corporate') return CORPORATE_ID_LABELS[state.corporateIdType]
      return INDIVIDUAL_ID_LABELS[state.individualIdType]
    },
  },

  actions: {
    /**
     * Switch the wizard to a new product variant. Wipes prior state if the
     * variant changes so a fresh flow always starts cleanly.
     */
    setVariant(variant: MotorVariant) {
      if (this.variant !== variant) {
        this.$patch({ ...defaults(), variant })
        const meta = findMotorVariant(variant)
        if (meta && !meta.classSelectable && meta.presetClass) {
          this.insuranceClass = meta.presetClass
        }
      }
    },

    next() {
      if (this.step < this.totalSteps) this.step += 1
    },
    prev() {
      if (this.step > 1) this.step -= 1
    },
    goTo(step: number) {
      if (step >= 1 && step <= this.totalSteps) this.step = step
    },

    setInsuranceClass(cls: MotorInsuranceClass) {
      this.insuranceClass = cls
      this.clearPremiumQuote()
    },

    setHolderType(t: MotorHolderType) {
      if (this.holderType !== t) {
        this.verified = false
        this.verifyError = null
        this.identificationNumber = ''
        this.documentUrl = ''
        if (t === 'corporate') {
          this.firstName = ''
          this.lastName = ''
        }
        else {
          this.companyName = ''
        }
      }
      this.holderType = t
    },

    setIndividualIdType(t: MotorIndividualIdType) {
      if (this.individualIdType !== t) {
        this.individualIdType = t
        this.identificationNumber = ''
        this.verified = false
        this.verifyError = null
        this.documentUrl = ''
      }
    },

    setCorporateIdType(t: MotorCorporateIdType) {
      if (this.corporateIdType !== t) {
        this.corporateIdType = t
        this.verifyError = null
        if (t === 'government') {
          // Government corporate skips ID/document verification.
          this.identificationNumber = ''
          this.documentUrl = ''
          this.verified = true
        }
        else {
          this.verified = false
        }
      }
    },

    clearVerification() {
      this.verified = false
      this.verifyError = null
      this.identificationNumber = ''
      this.documentUrl = ''
    },

    async verifyIdentification() {
      this.verifying = true
      this.verifyError = null
      try {
        const api = useApi()
        const id_type = this.identificationLabel
        const id_number = this.identificationNumber.trim()
        if (!id_number) {
          this.verifyError = 'Please enter your identification number.'
          this.verified = false
          return
        }
        const { data } = await api.post<{
          status?: string
          verified?: boolean
          message?: string
          name?: string
          data?: { name?: string; first_name?: string; last_name?: string; phone_number?: string; address?: string }
        }>('/verifyid', { id_type, id_number })

        const verifiedFlag = data?.verified !== false && (data?.status ?? 'success') !== 'error'
        if (!verifiedFlag) {
          this.verifyError = data?.message ?? "We couldn't verify this identification."
          this.verified = false
          return
        }
        const v = data?.data ?? {}
        if (this.holderType === 'individual') {
          if (v.first_name) this.firstName = v.first_name
          if (v.last_name) this.lastName = v.last_name
          if (!this.firstName && data?.name) {
            const parts = String(data.name).split(' ')
            this.firstName = parts[0] ?? ''
            this.lastName = parts.slice(1).join(' ')
          }
        }
        else if (this.holderType === 'corporate' && this.corporateIdType === 'cac') {
          if (v.first_name) this.companyName = v.first_name
          else if (data?.name) this.companyName = String(data.name)
        }
        if (v.phone_number && !this.phoneNumber) this.phoneNumber = v.phone_number
        if (v.address && !this.contactAddress) this.contactAddress = v.address

        this.verified = true
      }
      catch (err: unknown) {
        this.verified = false
        this.verifyError = extractMessage(err, "We couldn't verify this identification.")
      }
      finally {
        this.verifying = false
      }
    },

    setVehicleFromRegLookup(data: {
      make_detail?: { id: number | string; name?: string }
      model_detail?: { id: number | string; name?: string; insurance_class?: string }
      other_details?: {
        registration_number?: string
        chasis_number?: string
        engine_number?: string
        vehicle_color?: string
        year_of_make?: string | number
      }
    } | null) {
      if (!data) return
      if (data.make_detail?.id != null) this.vehicleMakeId = String(data.make_detail.id)
      if (data.model_detail?.id != null) this.vehicleModelId = String(data.model_detail.id)
      if (data.other_details?.year_of_make) {
        const y = Number(data.other_details.year_of_make)
        if (!Number.isNaN(y)) this.yearOfMake = y
      }
      if (data.other_details?.chasis_number) this.chassisNumber = data.other_details.chasis_number
      if (data.other_details?.engine_number) this.engineNumber = data.other_details.engine_number
      if (data.other_details?.vehicle_color) this.vehicleColor = data.other_details.vehicle_color
      if (data.other_details?.registration_number) this.registrationNumber = data.other_details.registration_number
      this.registrationVerified = true
    },

    clearPremiumQuote() {
      this.premiumQuote = null
      this.premiumType = null
    },

    async fetchComprehensivePremium(premiumType: MotorPremiumType) {
      const api = useApi()
      if (!this.carValue || this.carValue <= 0) {
        throw new Error('Please enter a valid car value.')
      }
      const { data } = await api.post<MotorPremiumQuoteResponse | MotorPremiumQuote>('/variance/premium', {
        car_value: String(this.carValue),
        registration_number: this.registrationNumber,
        premium_type: premiumType,
      })
      const raw = unwrapPremiumQuote(data)
      if (!raw || typeof raw.premium !== 'number') {
        throw new Error('Could not calculate premium.')
      }
      this.premiumQuote = raw
      this.premiumType = premiumType
      return raw
    },

    async saveContact() {
      const meta = this.variantMeta
      if (!meta) return
      const api = useApi()
      const variance = meta.displayName
      const isIndividual = this.holderType === 'individual'
      const payload = isIndividual
        ? {
            holder_type: 'individual' as const,
            variance,
            first_name: this.firstName.trim(),
            surname: this.lastName.trim(),
            contact_address: this.contactAddress.trim(),
            phone_number: this.phoneNumber.trim(),
            email: this.email.trim(),
            identification: this.identificationLabel,
            id_number: this.identificationNumber.trim(),
            upload_id: this.documentUrl,
            sector: this.sector || undefined,
          }
        : {
            holder_type: 'corporate' as const,
            variance,
            company_name: this.companyName.trim(),
            contact_address: this.contactAddress.trim(),
            phone_number: this.phoneNumber.trim(),
            email: this.email.trim(),
            identification: this.identificationLabel,
            id_number: this.identificationNumber.trim(),
            upload_id: this.documentUrl,
            sector: this.sector || undefined,
          }
      try {
        await api.post('/customer/save-contact', payload)
      }
      catch {
        // Best-effort; the buy-policy call carries the same data so we don't block.
      }
    },

    async saveVehicle() {
      const meta = this.variantMeta
      if (!meta || !this.insuranceClass) return
      const api = useApi()
      const endpoint = familyVehicleSaveEndpoint(meta.family)
      const variance = meta.displayName
      const payload: Record<string, unknown> = {
        variance,
        holder_type: this.holderType === 'individual' ? 'in' : 'co',
        phone_number: this.phoneNumber.trim(),
        email: this.email.trim(),
        registration_number: this.registrationNumber.trim(),
        vehicle_make_id: this.vehicleMakeId,
        vehicle_model_id: this.vehicleModelId,
        chasis_number: this.chassisNumber.trim(),
        engine_number: this.engineNumber.trim(),
        vehicle_color: this.vehicleColor.trim(),
        year_of_make: this.yearOfMake ? String(this.yearOfMake) : '',
        vehicle_type: this.vehicleType || '',
        policy_type: toInsuranceClassCode(this.insuranceClass),
      }
      if (meta.family === 'comprehensive' && this.carValue) {
        payload.car_value = String(this.carValue)
      }
      try {
        await api.post(endpoint, payload)
      }
      catch {
        // Best-effort.
      }
    },

    buildBuyPayload(transactionReference?: string): MotorBuyPolicyPayload {
      const meta = this.variantMeta
      if (!meta) throw new Error('No product variant selected.')
      if (!this.insuranceClass) throw new Error('No insurance class selected.')
      const isIndividual = this.holderType === 'individual'

      const base: MotorBuyPolicyBase = {
        holder_type: isIndividual ? 'individual' : 'corporate',
        variance: meta.displayName,
        contact_address: this.contactAddress.trim(),
        phone_number: this.phoneNumber.trim(),
        email: this.email.trim(),
        identification: this.identificationLabel,
        id_number: this.identificationNumber.trim(),
        upload_id: this.documentUrl,
        registration_number: this.registrationNumber.trim(),
        vehicle_make_id: this.vehicleMakeId,
        vehicle_model_id: this.vehicleModelId,
        chasis_number: this.chassisNumber.trim(),
        engine_number: this.engineNumber.trim(),
        vehicle_color: this.vehicleColor.trim(),
        year_of_make: this.yearOfMake ? String(this.yearOfMake) : '',
        vehicle_type: this.vehicleType || '',
        policy_type: toInsuranceClassCode(this.insuranceClass),
        sector: this.sector || undefined,
        payment_method: this.paymentMethod ?? 'PAYSTACK',
      }

      if (isIndividual) {
        base.first_name = this.firstName.trim()
        base.surname = this.lastName.trim()
      }
      else {
        base.company_name = this.companyName.trim()
      }

      if (transactionReference) base.transaction_reference = transactionReference

      if (meta.family === 'comprehensive') {
        const payload: MotorBuyComprehensivePayload = {
          ...base,
          car_value: this.carValue ?? 0,
          premium_type: this.premiumType ?? 'ANNUAL',
        }
        return payload
      }
      return base
    },

    async purchase(transactionReference?: string) {
      const meta = this.variantMeta
      if (!meta) throw new Error('No product variant selected.')
      this.submitting = true
      this.submitError = null
      try {
        const api = useApi()
        const payload = this.buildBuyPayload(transactionReference)
        const endpoint = familyEndpoint(meta.family)
        const { data } = await api.post<MotorBuyPolicyResponse>(endpoint, payload)
        if (data?.status !== 'success' || !data?.data) {
          const message = data?.message ?? 'Failed to create policy.'
          this.submitError = message
          throw new Error(message)
        }
        this.createdPolicy = data.data
        return data.data
      }
      catch (err: unknown) {
        this.submitError = extractMessage(err, 'Unable to complete purchase')
        throw err
      }
      finally {
        this.submitting = false
      }
    },

    reset() {
      const variant = this.variant
      this.$patch({ ...defaults(), variant })
      const meta = findMotorVariant(variant)
      if (meta && !meta.classSelectable && meta.presetClass) {
        this.insuranceClass = meta.presetClass
      }
    },
  },

  persist: {
    pick: [
      'step',
      'variant',
      'insuranceClass',
      'holderType',
      'firstName',
      'lastName',
      'companyName',
      'email',
      'phoneNumber',
      'contactAddress',
      'sector',
      'individualIdType',
      'corporateIdType',
      'identificationNumber',
      'documentUrl',
      'registrationNumber',
      'registrationVerified',
      'vehicleMakeId',
      'vehicleModelId',
      'yearOfMake',
      'chassisNumber',
      'engineNumber',
      'vehicleColor',
      'vehicleType',
      'carValue',
      'premiumType',
      'paymentMethod',
      'verified',
    ],
  },
})

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string }>
    return e.response?.data?.message ?? e.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

function unwrapPremiumQuote(body: unknown): MotorPremiumQuote | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  if (typeof o.premium === 'number' && typeof o.annual_premium === 'number') {
    return o as unknown as MotorPremiumQuote
  }
  if (o.data && typeof o.data === 'object') {
    return unwrapPremiumQuote(o.data)
  }
  return null
}
