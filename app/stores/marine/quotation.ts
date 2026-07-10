import { defineStore } from 'pinia'
import { useMarineStore } from '~/stores/marine'

export type MarineQuotationStepKey =
  | 'policy'
  | 'contact'
  | 'shipment'
  | 'valuation'
  | 'documents'
  | 'summary'

interface MarineQuotationState {
  step: number

  // Policy
  holder_type: string
  policy_type: string
  policy_number: string
  first_name: string
  last_name: string
  company_name: string

  // Contact
  email: string
  phone_number: string
  tin: string
  bank_name: string
  contact_address: string

  // Shipment
  cover_type: string
  packaging_type: string
  port_of_departure: string
  port_of_destination: string
  vessel_name: string
  cargo_description: string
  rate_id: string | number
  broker_rate_id: string | number

  // Valuation
  cargo_currency: string
  invoice_value: string
  exchange_rate: string
  basic_rate: string
  premium: string | number

  // Documents
  proforma_invoice_number: string
  proformaFileUrl: string
  proformaFileName: string
}

const STEP_KEYS: MarineQuotationStepKey[] = [
  'policy',
  'contact',
  'shipment',
  'valuation',
  'documents',
  'summary',
]

const defaults = (): MarineQuotationState => ({
  step: 1,

  holder_type: '',
  policy_type: '',
  policy_number: '',
  first_name: '',
  last_name: '',
  company_name: '',

  email: '',
  phone_number: '',
  tin: '',
  bank_name: '',
  contact_address: '',

  cover_type: '',
  packaging_type: '',
  port_of_departure: '',
  port_of_destination: '',
  vessel_name: '',
  cargo_description: '',
  rate_id: '',
  broker_rate_id: '',

  cargo_currency: '',
  invoice_value: '',
  exchange_rate: '',
  basic_rate: '',
  premium: '',

  proforma_invoice_number: '',
  proformaFileUrl: '',
  proformaFileName: '',
})

export const useMarineQuotationStore = defineStore('marine-quotation', {
  state: (): MarineQuotationState => defaults(),

  getters: {
    stepKeys: (): MarineQuotationStepKey[] => STEP_KEYS,
    totalSteps: (): number => STEP_KEYS.length,
    currentStepKey(state): MarineQuotationStepKey | null {
      return STEP_KEYS[state.step - 1] ?? null
    },
    isIndividual: state => state.holder_type === 'individual',
    isCompany: state => state.holder_type === 'corporate' || state.holder_type === 'government',
    isOpenCover: state => state.policy_type === 'open_cover',
    /** Broker rates take precedence over standard rates when available. */
    useBrokerRates: (): boolean => useMarineStore().myRates.length > 0,
    holderName(state): string {
      if (state.company_name) return state.company_name
      return [state.first_name, state.last_name].filter(Boolean).join(' ')
    },
    coverTypeLabel(state): string {
      const opt = useMarineStore().coverTypes.find(c => c.value === state.cover_type)
      return opt?.text ?? state.cover_type
    },
    natureOfCargoLabel(state): string {
      const marine = useMarineStore()
      if (this.useBrokerRates) {
        return marine.myRates.find(r => String(r.id) === String(state.broker_rate_id))?.condition ?? ''
      }
      return marine.rates.find(r => String(r.id) === String(state.rate_id))?.condition ?? ''
    },
    /** The /marine/premium endpoint requires all of these to be present. */
    canCalcPremium(state): boolean {
      return !!state.invoice_value && !!state.basic_rate && !!state.cover_type
        && !!state.cargo_currency && !!state.exchange_rate
    },
  },

  actions: {
    next() {
      if (this.step < this.totalSteps) this.step += 1
    },
    prev() {
      if (this.step > 1) this.step -= 1
    },
    goTo(step: number) {
      if (step >= 1 && step <= this.totalSteps) this.step = step
    },

    /** Load cover types & rate options used across the steps. */
    async loadLookups() {
      const marine = useMarineStore()
      await Promise.all([
        marine.fetchCoverTypes().catch(() => {}),
        marine.fetchCurrencies().catch(() => {}),
        marine.fetchRates().catch(() => {}),
        marine.fetchMyRates().catch(() => {}),
      ])
    },

    /** Recalculate the premium from the current valuation inputs. */
    async recalcPremium() {
      const marine = useMarineStore()
      if (!this.canCalcPremium) {
        this.premium = ''
        marine.premiumError = null
        return
      }
      // The API validates invoice_value / rate / exchange_rate as strings.
      const result = await marine.calculatePremium({
        invoice_value: String(this.invoice_value),
        currency: this.cargo_currency,
        rate: String(this.basic_rate),
        cover_type: this.cover_type,
        exchange_rate: String(this.exchange_rate),
      })
      this.premium = result !== null && result !== undefined ? result : ''
    },

    clearProforma() {
      this.proformaFileUrl = ''
      this.proformaFileName = ''
    },

    /** Create the quotation from the collected fields + uploaded proforma URL. */
    async generate() {
      const marine = useMarineStore()
      if (!this.proformaFileUrl) throw new Error('Please upload the proforma invoice.')
      return marine.generateQuotation(
        {
          proforma_invoice_file: this.proformaFileUrl,
          proforma_invoice_number: this.proforma_invoice_number,
          holder_type: this.holder_type,
          policy_type: this.policy_type,
          email: this.email,
          phone_number: this.phone_number,
          tin: this.tin,
          contact_address: this.contact_address,
          cover_type: this.cover_type,
          port_of_departure: this.port_of_departure,
          port_of_destination: this.port_of_destination,
          vessel_name: this.vessel_name,
          cargo_description: this.cargo_description,
          packaging_type: this.packaging_type,
          cargo_currency: this.cargo_currency,
          invoice_value: String(this.invoice_value),
          basic_rate: String(this.basic_rate),
          first_name: this.first_name,
          last_name: this.last_name,
          company_name: this.company_name,
          bank_name: this.bank_name,
          exchange_rate: String(this.exchange_rate),
          open_cover_policy_number: this.policy_number,
          ...(this.useBrokerRates
            ? (this.broker_rate_id ? { broker_rate_id: this.broker_rate_id } : {})
            : (this.rate_id ? { rate_id: this.rate_id } : {})),
        },
      )
    },

    reset() {
      this.$patch(defaults())
    },
  },

  persist: {
    pick: [
      'step',
      'holder_type', 'policy_type', 'policy_number', 'first_name', 'last_name', 'company_name',
      'email', 'phone_number', 'tin', 'bank_name', 'contact_address',
      'cover_type', 'packaging_type', 'port_of_departure', 'port_of_destination',
      'vessel_name', 'cargo_description', 'rate_id', 'broker_rate_id',
      'cargo_currency', 'invoice_value', 'exchange_rate', 'basic_rate', 'premium',
      'proforma_invoice_number', 'proformaFileUrl', 'proformaFileName',
    ],
  },
})
