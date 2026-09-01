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

const REFERRAL_ENDPOINT = '/home-shield/underwriting-referral'
const REFERRAL_ESCALATION_REASON = 'Disqualifying answer selected during pre-purchase questionnaire.'

export type HolderType = 'individual' | 'corporate'
export type OwnerType = 'tenant' | 'landlord'
export type PaymentMethod = 'WALLET' | 'PAYSTACK'

export interface UnderwritingReferralAnswer {
  questionnaire_id: number
  answer: 'yes' | 'no'
  details: string | null
}

/** Payload for POST /home-shield/underwriting-referral */
export interface UnderwritingReferral {
  holder_type: string
  owner_type: string
  first_name: string
  last_name: string
  company_name?: string
  email: string
  phone_number: string
  contact_address: string
  identification_number: string
  property_address: string
  value_of_property: number
  property_type: string
  property_usage: string
  category: string
  channel: string
  /** The question whose answer stopped the online application. */
  questionnaire_id: number
  last_question: string
  last_answer: 'yes' | 'no'
  last_answer_details: string | null
  escalation_reason: string
  questionnaire_answers: UnderwritingReferralAnswer[]
}

export interface QuestionnaireAnswer {
  id: number
  answer: 'yes' | 'no' | null
  details: string
  /** The reason option picked, for questions that offer them. */
  reason: number | null
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

  /** Set once a declined risk has been handed to the technical underwriting team. */
  referral: UnderwritingReferral | null
  referring: boolean
  referError: string | null

  /** Set once a Category C request has been sent to underwriting for review. */
  categoryCSubmitted: boolean
  /** Confirmation message returned for a Category C request. */
  submitMessage: string | null
}

function emptyQuestionnaire(): QuestionnaireAnswer[] {
  return HOMESHIELD_QUESTIONS.map(q => ({ id: q.id, answer: null, details: '', reason: null }))
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

    referral: null,
    referring: false,
    referError: null,

    categoryCSubmitted: false,
    submitMessage: null,
  }),

  getters: {
    premium(state): number {
      return findCategory(state.category)?.premium ?? 0
    },
    /** Category C is quoted by underwriting — no premium, no questionnaire, no payment. */
    isCategoryC(state): boolean {
      return findCategory(state.category)?.quotedByUnderwriting === true
    },
    /**
     * The steps this application actually walks through. Category C skips the
     * questionnaire (step 6) and the payment step (step 8).
     */
    stepNumbers(): number[] {
      return this.isCategoryC ? [1, 2, 3, 4, 5, 7] : [1, 2, 3, 4, 5, 6, 7, 8]
    },
    holderName(state): string {
      if (state.holderType === 'corporate') return state.companyName
      return [state.firstName, state.lastName].filter(Boolean).join(' ')
    },
    /** Answers that refer the client to the technical underwriting team. */
    blockingAnswers(state): QuestionnaireAnswer[] {
      if (findCategory(state.category)?.quotedByUnderwriting) return []
      return state.questionnaire.filter((q) => {
        const meta = HOMESHIELD_QUESTIONS.find(x => x.id === q.id)
        return !!meta?.blockOn && q.answer === meta.blockOn
      })
    },
    questionnaireBlocked(): boolean {
      return this.blockingAnswers.length > 0
    },
    /**
     * Answers whose selected reason cannot be covered at all. Unlike a blocking
     * answer, these are not referred to underwriting — the application ends.
     */
    decliningAnswers(state): QuestionnaireAnswer[] {
      if (this.isCategoryC) return []
      return state.questionnaire.filter((q) => {
        if (q.answer !== 'yes' || q.reason === null) return false
        const meta = HOMESHIELD_QUESTIONS.find(x => x.id === q.id)
        return meta?.reasonOptions?.find(o => o.id === q.reason)?.declines === true
      })
    },
    questionnaireDeclined(): boolean {
      return this.decliningAnswers.length > 0
    },
    questionnaireValid(state): boolean {
      if (this.isCategoryC) return true
      if (this.questionnaireBlocked || this.questionnaireDeclined) return false
      return state.questionnaire.every((q) => {
        if (!q.answer) return false
        const meta = HOMESHIELD_QUESTIONS.find(x => x.id === q.id)
        if (q.answer === 'yes' && meta?.reasonOptions?.length) {
          return q.reason !== null
        }
        if (meta?.requiresDetails && q.answer === 'yes') {
          return q.details.trim().length > 0
        }
        return true
      })
    },
  },

  actions: {
    next() {
      const steps = this.stepNumbers
      const i = steps.indexOf(this.step)
      const nextStep = steps[i + 1]
      if (nextStep !== undefined) this.step = nextStep
    },
    prev() {
      const steps = this.stepNumbers
      const i = steps.indexOf(this.step)
      const prevStep = i > 0 ? steps[i - 1] : undefined
      if (prevStep !== undefined) this.step = prevStep
    },
    goTo(step: number) {
      if (this.stepNumbers.includes(step)) this.step = step
    },

    setCategory(id: HomeshieldCategoryId) {
      this.category = id
      // Switching to/from Category C changes which steps exist — never strand
      // the user on a step the new category skips.
      if (!this.stepNumbers.includes(this.step)) {
        this.step = this.stepNumbers[0] ?? 1
      }
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
    /** Changing the usage invalidates the property type picked for the old usage. */
    setPropertyType(t: 'residential' | 'commercial') {
      if (this.propertyType === t) return
      this.propertyType = t
      this.propertyKind = ''
    },
    setQuestionnaireAnswer(id: number, answer: 'yes' | 'no') {
      const q = this.questionnaire.find(x => x.id === id)
      if (!q) return
      q.answer = answer
      if (answer === 'no') {
        q.details = ''
        q.reason = null
      }
    },
    /** The reason label doubles as the answer's details, so it reaches the API unchanged. */
    setQuestionnaireReason(id: number, reasonId: number) {
      const q = this.questionnaire.find(x => x.id === id)
      const option = HOMESHIELD_QUESTIONS.find(x => x.id === id)?.reasonOptions?.find(o => o.id === reasonId)
      if (!q || !option) return
      q.reason = option.id
      q.details = option.label
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

    /** `questionId` is the question whose answer stopped the application. */
    buildReferral(questionId: number): UnderwritingReferral {
      const isCorporate = this.holderType === 'corporate'
      const blockerMeta = HOMESHIELD_QUESTIONS.find(q => q.id === questionId)
      const blockerAnswer = this.questionnaire.find(q => q.id === questionId)

      // Only the questions the client actually reached are reported.
      const answers: UnderwritingReferralAnswer[] = this.questionnaire
        .filter(q => q.answer !== null)
        .map(q => ({
          questionnaire_id: q.id,
          answer: q.answer as 'yes' | 'no',
          details: q.details.trim() ? q.details.trim() : null,
        }))

      return {
        holder_type: this.holderType ?? '',
        owner_type: this.ownerType ?? '',
        first_name: isCorporate ? '' : this.firstName.trim(),
        last_name: isCorporate ? '' : this.lastName.trim(),
        ...(isCorporate ? { company_name: this.companyName.trim() } : {}),
        email: this.email.trim(),
        phone_number: this.phoneNumber.trim(),
        contact_address: this.contactAddress.trim(),
        identification_number: this.identificationNumber.trim(),
        property_address: this.propertyAddress.trim(),
        value_of_property: Number(this.valueOfProperty) || 0,
        property_type: this.propertyKind.toUpperCase(),
        property_usage: this.propertyType ?? '',
        category: (this.category ?? '').toUpperCase(),
        channel: 'WEB',
        questionnaire_id: questionId,
        last_question: blockerMeta?.text ?? '',
        last_answer: (blockerAnswer?.answer ?? 'yes') as 'yes' | 'no',
        last_answer_details: blockerAnswer?.details.trim() ? blockerAnswer.details.trim() : null,
        escalation_reason: REFERRAL_ESCALATION_REASON,
        questionnaire_answers: answers,
      }
    },

    /**
     * Hands a declined risk to the technical underwriting team so they can
     * contact the client and complete the policy off-line.
     */
    async submitReferral(questionId: number): Promise<boolean> {
      this.referError = null
      this.referring = true
      const payload = this.buildReferral(questionId)

      try {
        const api = useApi()
        await api.post(REFERRAL_ENDPOINT, payload)
        this.referral = payload
        return true
      }
      catch (err: unknown) {
        let message = 'Could not send your details. Please try again.'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.referError = message
        return false
      }
      finally {
        this.referring = false
      }
    },

    /**
     * Sends a Category C request to underwriting. Nothing is charged and no
     * policy is created — underwriting and customer experience are notified and
     * follow up by email with the right cover.
     */
    async submitCategoryCRequest(): Promise<boolean> {
      try {
        await this.purchase()
        this.categoryCSubmitted = true
        this.submitMessage ||= 'Request for Category C submitted successful'
        return true
      }
      catch {
        return false
      }
    },

    buildPayload(transactionReference?: string): HomeshieldPurchasePayload {
      const answers: HomeshieldQuestionnaireAnswerInput[] = this.questionnaire.map(q => ({
        questionnaire_id: q.id,
        answer: (q.answer ?? 'no') as 'yes' | 'no',
        details: q.details.trim() ? q.details.trim() : null,
      }))

      const isCorporate = this.holderType === 'corporate'
      const isCatC = this.isCategoryC

      const payload: HomeshieldPurchasePayload = {
        holder_type: this.holderType ?? 'individual',
        owner_type: this.ownerType ?? 'landlord',
        first_name: isCorporate ? '' : this.firstName.trim(),
        last_name: isCorporate ? '' : this.lastName.trim(),
        company_name: isCorporate ? this.companyName.trim() : '',
        email: this.email.trim(),
        contact_address: this.contactAddress.trim(),
        phone_number: this.phoneNumber.trim(),
        identification_number: this.identificationNumber.trim(),
        upload_id: null,
        sector: this.sector,
        property_address: this.propertyAddress.trim(),
        value_of_property: Number(this.valueOfProperty) || 0,
        property_type: this.propertyType ?? 'residential',
        property_usage: this.propertyType ?? 'residential',
        property_kind: this.propertyKind,
        category: findCategory(this.category)?.apiValue ?? 'Category A',
        payment_method: this.paymentMethod ?? 'WALLET',
      }

      // Category C is not charged and asks no questionnaire, so it carries
      // neither a transaction reference nor answers.
      if (!isCatC) {
        payload.questionnaire_answers = answers
        if (transactionReference) payload.transaction_reference = transactionReference
      }

      return payload
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
        this.submitMessage = data.message ?? null
        // Category C creates no policy — the request goes to underwriting for review.
        this.createdPolicy = data.data?.policy ?? null
        return this.createdPolicy
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
    // A questionnaire persisted under an older question list is rebuilt against the
    // current one, keeping answers whose question still exists.
    afterHydrate(ctx) {
      const store = ctx.store as unknown as { questionnaire: QuestionnaireAnswer[] }
      const saved = Array.isArray(store.questionnaire) ? store.questionnaire : []
      store.questionnaire = HOMESHIELD_QUESTIONS.map((q) => {
        const prev = saved.find(a => a.id === q.id)
        return {
          id: q.id,
          answer: prev?.answer ?? null,
          details: prev?.details ?? '',
          reason: prev?.reason ?? null,
        }
      })
    },
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
      'referral',
      'categoryCSubmitted',
      'submitMessage',
    ],
  },
})
