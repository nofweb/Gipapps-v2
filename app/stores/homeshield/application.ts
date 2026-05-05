import { defineStore } from 'pinia'
import axios, { type AxiosError } from 'axios'
import type {
  HomeshieldPolicy,
  HomeshieldPurchasePayload,
  HomeshieldPurchaseResponse,
  HomeshieldQuestionnaireAnswerInput,
} from '~/types/homeshield'
import {
  HOMESHIELD_QUESTIONS,
  findCategory,
  type HomeshieldCategoryId,
} from '~/utils/homeshield-constants'

export type HolderType = 'individual' | 'corporate'
export type OwnerType = 'tenant' | 'landlord'
export type PaymentMethod = 'WALLET' | 'PAYSTACK'

interface QuestionnaireAnswer {
  id: number
  answer: 'yes' | 'no' | null
  details: string
}

interface ApplicationState {
  step: number
  category: HomeshieldCategoryId | null
  holderType: HolderType | null
  ownerType: OwnerType | null
  firstName: string
  lastName: string
  companyName: string
  email: string
  phoneNumber: string
  contactAddress: string
  identificationNumber: string
  identificationType: 'nin' | 'rc_number'
  sector: string
  propertyAddress: string
  valueOfProperty: number | null
  propertyType: 'residential' | 'commercial' | null
  propertyKind: string
  questionnaire: QuestionnaireAnswer[]
  paymentMethod: PaymentMethod | null

  /** Whether the holder's NIN/RC has been verified. */
  verified: boolean
  verifying: boolean
  verifyError: string | null

  submitting: boolean
  submitError: string | null
  createdPolicy: HomeshieldPolicy | null
}

function emptyQuestionnaire(): QuestionnaireAnswer[] {
  return HOMESHIELD_QUESTIONS.map(q => ({ id: q.id, answer: null, details: '' }))
}

export const useHomeshieldApplicationStore = defineStore('homeshield-application', {
  state: (): ApplicationState => ({
    step: 1,
    category: null,
    holderType: null,
    ownerType: null,
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    contactAddress: '',
    identificationNumber: '',
    identificationType: 'nin',
    sector: '',
    propertyAddress: '',
    valueOfProperty: null,
    propertyType: null,
    propertyKind: '',
    questionnaire: emptyQuestionnaire(),
    paymentMethod: null,

    verified: false,
    verifying: false,
    verifyError: null,

    submitting: false,
    submitError: null,
    createdPolicy: null,
  }),

  getters: {
    premium(state): number {
      return findCategory(state.category)?.premium ?? 0
    },
    holderName(state): string {
      if (state.holderType === 'corporate') return state.companyName
      return [state.firstName, state.lastName].filter(Boolean).join(' ')
    },
    questionnaireValid(state): boolean {
      return state.questionnaire.every((q) => {
        if (!q.answer) return false
        const meta = HOMESHIELD_QUESTIONS.find(x => x.id === q.id)
        if (meta?.requiresDetails && q.answer === 'yes') {
          return q.details.trim().length > 0
        }
        return true
      })
    },
  },

  actions: {
    next() {
      if (this.step < 8) this.step += 1
    },
    prev() {
      if (this.step > 1) this.step -= 1
    },
    goTo(step: number) {
      if (step >= 1 && step <= 8) this.step = step
    },

    setCategory(id: HomeshieldCategoryId) {
      this.category = id
    },
    setHolderType(t: HolderType) {
      if (this.holderType !== t) {
        // Re-verification required when holder type changes.
        this.verified = false
        this.verifyError = null
        this.identificationNumber = ''
        // Wipe the opposite-side name fields so they can never leak.
        if (t === 'corporate') {
          this.firstName = ''
          this.lastName = ''
        }
        else {
          this.companyName = ''
        }
      }
      this.holderType = t
      this.identificationType = t === 'corporate' ? 'rc_number' : 'nin'
    },
    setOwnerType(t: OwnerType) {
      this.ownerType = t
    },
    setQuestionnaireAnswer(id: number, answer: 'yes' | 'no') {
      const q = this.questionnaire.find(x => x.id === id)
      if (!q) return
      q.answer = answer
      if (answer === 'no') q.details = ''
    },
    setQuestionnaireDetails(id: number, details: string) {
      const q = this.questionnaire.find(x => x.id === id)
      if (q) q.details = details
    },

    async verifyNin(nin: string) {
      this.verifying = true
      this.verifyError = null
      try {
        const api = useApi()
        const { data } = await api.post<{
          status: string
          message: string
          data: {
            first_name?: string | null
            last_name?: string | null
            phone_number?: string | null
            address?: string | null
          }
        }>('/home-shield/verify-nin', { nin, holder_type: 'individual' })

        const v = data.data ?? {}
        this.firstName = v.first_name ?? ''
        this.lastName = v.last_name ?? ''
        this.phoneNumber = v.phone_number ?? ''
        this.contactAddress = v.address ?? ''
        this.identificationNumber = nin
        this.identificationType = 'nin'
        this.verified = true
        return v
      }
      catch (err: unknown) {
        let message = 'NIN verification failed'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.verifyError = message
        this.verified = false
        throw err
      }
      finally {
        this.verifying = false
      }
    },

    async verifyCac(rcNumber: string) {
      this.verifying = true
      this.verifyError = null
      try {
        const api = useApi()
        const { data } = await api.post<{
          status: string
          message: string
          data: {
            first_name?: string | null
            phone_number?: string | null
            address?: string | null
          }
        }>('/home-shield/verify-cac', { rc_number: rcNumber })

        const v = data.data ?? {}
        this.companyName = v.first_name ?? ''
        this.phoneNumber = v.phone_number ?? ''
        this.contactAddress = v.address ?? ''
        this.identificationNumber = rcNumber
        this.identificationType = 'rc_number'
        this.verified = true
        return v
      }
      catch (err: unknown) {
        let message = 'CAC verification failed'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.verifyError = message
        this.verified = false
        throw err
      }
      finally {
        this.verifying = false
      }
    },

    clearVerification() {
      this.verified = false
      this.verifyError = null
      this.firstName = ''
      this.lastName = ''
      this.companyName = ''
      this.phoneNumber = ''
      this.contactAddress = ''
      this.identificationNumber = ''
    },

    reset() {
      this.$reset()
      this.questionnaire = emptyQuestionnaire()
    },

    buildPayload(transactionReference?: string): HomeshieldPurchasePayload {
      const answers: HomeshieldQuestionnaireAnswerInput[] = this.questionnaire.map(q => ({
        questionnaire_id: q.id,
        answer: (q.answer ?? 'no') as 'yes' | 'no',
        details: q.details.trim() ? q.details.trim() : null,
      }))

      const isCorporate = this.holderType === 'corporate'

      return {
        holder_type: this.holderType ?? 'individual',
        owner_type: this.ownerType ?? 'landlord',
        ...(isCorporate
          ? { company_name: this.companyName }
          : { first_name: this.firstName, last_name: this.lastName }),
        email: this.email.trim(),
        contact_address: this.contactAddress.trim(),
        phone_number: this.phoneNumber.trim(),
        identification_number: this.identificationNumber.trim(),
        upload_id: null,
        sector: this.sector,
        property_address: this.propertyAddress.trim(),
        value_of_property: Number(this.valueOfProperty) || 0,
        property_type: this.propertyType ?? 'residential',
        category: this.category ?? 'Category A',
        payment_method: this.paymentMethod ?? 'WALLET',
        ...(transactionReference ? { transaction_reference: transactionReference } : {}),
        questionnaire_answers: answers,
      }
    },

    async purchase(transactionReference?: string) {
      this.submitting = true
      this.submitError = null
      try {
        const api = useApi()
        const payload = this.buildPayload(transactionReference)
        const { data } = await api.post<HomeshieldPurchaseResponse>(
          '/home-shield/purchase',
          payload,
        )
        this.createdPolicy = data.data.policy
        return data.data.policy
      }
      catch (err: unknown) {
        let message = 'Unable to complete purchase'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.submitError = message
        throw err
      }
      finally {
        this.submitting = false
      }
    },
  },

  persist: {
    pick: [
      'step',
      'category',
      'holderType',
      'ownerType',
      'firstName',
      'lastName',
      'companyName',
      'email',
      'phoneNumber',
      'contactAddress',
      'identificationNumber',
      'identificationType',
      'sector',
      'propertyAddress',
      'valueOfProperty',
      'propertyType',
      'propertyKind',
      'questionnaire',
      'paymentMethod',
      'verified',
    ],
  },
})
