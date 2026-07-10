import { defineStore } from 'pinia'
import axios, { type AxiosError } from 'axios'
import type {
  MarineCertificate,
  MarineCertificatesResponse,
  MarinePayment,
  MarinePaymentsResponse,
  MarineQuotationRecord,
  MarineQuotationsResponse,
  MarineQuotationRecordResponse,
  MarineCoverTypeOption,
  MarineCoverTypesResponse,
  MarineCurrencyOption,
  MarineCurrencyResponse,
  MarineRate,
  MarineRatesResponse,
  MarinePremiumPayload,
  MarinePremiumResponse,
  MarineGenerateQuotationPayload,
  MarineDashboardData,
  MarineDashboardResponse,
} from '~/types/marine'

interface MarineState {
  certificates: MarineCertificate[]
  certificatesPage: number
  certificatesLastPage: number
  certificatesTotal: number
  certificatesPerPage: number
  certificatesLoading: boolean
  certificatesError: string | null
  certificatesLoaded: boolean

  payments: MarinePayment[]
  paymentsPage: number
  paymentsLastPage: number
  paymentsTotal: number
  paymentsPerPage: number
  paymentsLoading: boolean
  paymentsError: string | null
  paymentsLoaded: boolean

  quotations: MarineQuotationRecord[]
  quotationsPage: number
  quotationsLastPage: number
  quotationsTotal: number
  quotationsPerPage: number
  quotationsLoading: boolean
  quotationsError: string | null
  quotationsLoaded: boolean

  quotationById: Record<number, MarineQuotationRecord>
  quotationDetailLoading: boolean
  quotationDetailError: string | null

  coverTypes: MarineCoverTypeOption[]
  coverTypesLoading: boolean
  currencies: MarineCurrencyOption[]
  currenciesLoading: boolean
  rates: MarineRate[]
  myRates: MarineRate[]
  ratesLoading: boolean
  premiumCalculating: boolean
  premiumError: string | null
  generatingQuotation: boolean
  payingQuotation: boolean

  dashboard: MarineDashboardData | null
  dashboardLoading: boolean
  dashboardError: string | null
}

export const useMarineStore = defineStore('marine', {
  state: (): MarineState => ({
    certificates: [],
    certificatesPage: 1,
    certificatesLastPage: 1,
    certificatesTotal: 0,
    certificatesPerPage: 15,
    certificatesLoading: false,
    certificatesError: null,
    certificatesLoaded: false,

    payments: [],
    paymentsPage: 1,
    paymentsLastPage: 1,
    paymentsTotal: 0,
    paymentsPerPage: 15,
    paymentsLoading: false,
    paymentsError: null,
    paymentsLoaded: false,

    quotations: [],
    quotationsPage: 1,
    quotationsLastPage: 1,
    quotationsTotal: 0,
    quotationsPerPage: 15,
    quotationsLoading: false,
    quotationsError: null,
    quotationsLoaded: false,

    quotationById: {},
    quotationDetailLoading: false,
    quotationDetailError: null,

    coverTypes: [],
    coverTypesLoading: false,
    currencies: [],
    currenciesLoading: false,
    rates: [],
    myRates: [],
    ratesLoading: false,
    premiumCalculating: false,
    premiumError: null,
    generatingQuotation: false,
    payingQuotation: false,

    dashboard: null,
    dashboardLoading: false,
    dashboardError: null,
  }),

  actions: {
    async fetchCertificates(page = 1) {
      this.certificatesLoading = true
      this.certificatesError = null
      try {
        const api = useApi()
        const { data } = await api.get<MarineCertificatesResponse>(
          '/marine/policy',
          { params: { page, order_by: 'desc' } },
        )
        this.certificates = data.data.data
        this.certificatesPage = data.data.current_page
        this.certificatesLastPage = data.data.last_page ?? 1
        this.certificatesPerPage = data.data.per_page ?? this.certificatesPerPage
        this.certificatesTotal = data.data.total ?? data.data.data.length
        this.certificatesLoaded = true
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to load certificates'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.certificatesError = message
        throw err
      }
      finally {
        this.certificatesLoading = false
      }
    },

    async fetchDashboard() {
      this.dashboardLoading = true
      this.dashboardError = null
      try {
        const api = useApi()
        const { data } = await api.get<MarineDashboardResponse>('/marine')
        this.dashboard = data.data
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to load dashboard'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.dashboardError = message
        throw err
      }
      finally {
        this.dashboardLoading = false
      }
    },

    async fetchPayments(page = 1) {
      this.paymentsLoading = true
      this.paymentsError = null
      try {
        const api = useApi()
        const { data } = await api.get<MarinePaymentsResponse>(
          '/marine/policy/transactions/payment',
          { params: { page, order_by: 'desc' } },
        )
        this.payments = data.data.data
        this.paymentsPage = data.data.current_page
        this.paymentsLastPage = data.data.last_page ?? 1
        this.paymentsPerPage = data.data.per_page ?? this.paymentsPerPage
        this.paymentsTotal = data.data.total ?? data.data.data.length
        this.paymentsLoaded = true
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to load payments'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.paymentsError = message
        throw err
      }
      finally {
        this.paymentsLoading = false
      }
    },

    async fetchQuotations(page = 1) {
      this.quotationsLoading = true
      this.quotationsError = null
      try {
        const api = useApi()
        const { data } = await api.get<MarineQuotationsResponse>(
          '/marine/quotation',
          { params: { page, order_by: 'desc' } },
        )
        this.quotations = data.data.data
        this.quotationsPage = data.data.current_page
        this.quotationsLastPage = data.data.last_page ?? 1
        this.quotationsPerPage = data.data.per_page ?? this.quotationsPerPage
        this.quotationsTotal = data.data.total ?? data.data.data.length
        this.quotationsLoaded = true
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to load quotations'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.quotationsError = message
        throw err
      }
      finally {
        this.quotationsLoading = false
      }
    },

    async fetchQuotation(id: number | string) {
      this.quotationDetailLoading = true
      this.quotationDetailError = null
      try {
        const api = useApi()
        const { data } = await api.get<MarineQuotationRecordResponse>(
          `/marine/quotation/${id}`,
        )
        this.quotationById[data.data.id] = data.data
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to load quotation'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.quotationDetailError = message
        throw err
      }
      finally {
        this.quotationDetailLoading = false
      }
    },

    async fetchCoverTypes() {
      if (this.coverTypes.length > 0) return this.coverTypes
      this.coverTypesLoading = true
      try {
        const api = useApi()
        const { data } = await api.get<MarineCoverTypesResponse>('/marine/cover-type')
        const map = data.data?.cover_types ?? {}
        // Backend returns a numeric-keyed map ({ "0": "ICC A", ... }); the key
        // is the value submitted with the quotation, the string is the label.
        this.coverTypes = Object.entries(map)
          .filter(([key]) => Number.isInteger(Number(key)))
          .map(([key, text]) => ({ value: key, text: String(text) }))
        return this.coverTypes
      }
      finally {
        this.coverTypesLoading = false
      }
    },

    async fetchCurrencies() {
      if (this.currencies.length > 0) return this.currencies
      this.currenciesLoading = true
      try {
        const api = useApi()
        const { data } = await api.get<MarineCurrencyResponse>('/marine/currency')
        this.currencies = normalizeCurrencies(data.data)
        return this.currencies
      }
      catch {
        return this.currencies
      }
      finally {
        this.currenciesLoading = false
      }
    },

    async fetchRates() {
      this.ratesLoading = true
      try {
        const api = useApi()
        const { data } = await api.get<MarineRatesResponse>('/marine/rates')
        this.rates = data.data?.data ?? []
        return this.rates
      }
      finally {
        this.ratesLoading = false
      }
    },

    async fetchMyRates() {
      const api = useApi()
      const { data } = await api.get<MarineRatesResponse>('/marine/my-rates')
      this.myRates = data.data?.data ?? []
      return this.myRates
    },

    async calculatePremium(payload: MarinePremiumPayload): Promise<string | number | null> {
      this.premiumCalculating = true
      this.premiumError = null
      try {
        const api = useApi()
        const { data } = await api.post<MarinePremiumResponse & { premium?: string | number }>(
          '/marine/premium',
          payload,
          {
            // Premium recalculates as the user types — stay silent on both paths;
            // any failure is surfaced inline via `premiumError` instead of a toast.
            skipSuccessToast: true,
            skipErrorToast: true,
          },
        )
        // Envelope is { data: { premium } } (matches old marine), but tolerate a
        // top-level premium too.
        return data.data?.premium ?? data.premium ?? null
      }
      catch (err: unknown) {
        let message = 'Unable to calculate premium'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string, errors?: Record<string, string[]> }>
          const firstFieldError = e.response?.data?.errors
            ? Object.values(e.response.data.errors)[0]?.[0]
            : undefined
          message = e.response?.data?.message ?? firstFieldError ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.premiumError = message
        return null
      }
      finally {
        this.premiumCalculating = false
      }
    },

    async generateQuotation(payload: MarineGenerateQuotationPayload) {
      this.generatingQuotation = true
      try {
        const api = useApi()
        const { data } = await api.post<MarineQuotationRecordResponse>('/marine/quotation', payload)
        return data.data
      }
      finally {
        this.generatingQuotation = false
      }
    },

    /** Pay for a pending quotation. Mirrors old marine's POST .../payment. */
    async makeQuotationPayment(id: number | string) {
      this.payingQuotation = true
      try {
        const api = useApi()
        // Success/error toast is surfaced by the response interceptor.
        const { data } = await api.post<MarineQuotationRecordResponse>(
          `/marine/quotation/${id}/payment`,
        )
        return data?.data ?? null
      }
      finally {
        this.payingQuotation = false
      }
    },
  },
})

/**
 * Normalise the /marine/currency payload into { value, name } options.
 * Tolerates the various shapes the API may return: an array of strings,
 * an array of objects, or a keyed map.
 */
function normalizeCurrencies(raw: unknown): MarineCurrencyOption[] {
  let list: unknown[] = []
  if (Array.isArray(raw)) {
    list = raw
  }
  else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    const nested = o.currencies ?? o.cover_types ?? o.data
    if (Array.isArray(nested)) list = nested
    else if (nested && typeof nested === 'object') list = Object.values(nested)
    else list = Object.values(o)
  }

  return list
    .map((item): MarineCurrencyOption | null => {
      if (typeof item === 'string') return { value: item, name: item }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        const value = o.code ?? o.value ?? o.currency ?? o.name ?? o.id
        const name = o.name ?? o.currency ?? o.code ?? o.label ?? value
        if (value == null) return null
        return { value: String(value), name: String(name ?? value) }
      }
      return null
    })
    .filter((c): c is MarineCurrencyOption => c !== null)
}
