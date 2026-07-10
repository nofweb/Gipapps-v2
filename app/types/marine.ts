import type { PaginatedResponse } from '~/types/homeshield'

export interface MarineQuotation {
  id?: number
  holder_type?: string | null
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  contact_address?: string | null
  phone_number?: string | null
  email?: string | null
  policy_type?: string | null
  cover_type?: string | null
  cargo_description?: string | null
  packaging_type?: string | null
  bank_name?: string | null
  sum_insured?: string | null
  premium?: string | null
  basic_rate?: string | null
  war_and_strike_rate?: string | null
  total_rate?: string | null
  port_of_departure?: string | null
  vessel_name?: string | null
  invoice_value?: string | null
  exchange_rate?: string | null
  tin?: string | null
  status?: string | null
  [key: string]: unknown
}

export interface MarineCertificate {
  id: number
  certificate_number: string
  policy_number: string
  certificate_url: string | null
  proforma_invoice_number: string | null
  created_at: string
  updated_at?: string
  quotation?: MarineQuotation | null
  [key: string]: unknown
}

export interface MarineCertificatesResponse {
  status: string
  message: string
  data: PaginatedResponse<MarineCertificate>
}

export interface MarineCertificateResponse {
  status: string
  message: string
  data: MarineCertificate
}

export interface MarinePayment {
  id: number
  payment_reference: string | null
  amount_paid: string | null
  status: string | null
  policy_id?: number | null
  created_at: string
  updated_at?: string
  quotation?: MarineQuotation | null
  [key: string]: unknown
}

export interface MarinePaymentsResponse {
  status: string
  message: string
  data: PaginatedResponse<MarinePayment>
}

export interface MarinePaymentResponse {
  status: string
  message: string
  data: MarinePayment
}

export interface MarineRateCondition {
  condition?: string | null
  [key: string]: unknown
}

/** A stored/persisted marine quotation (list row & detail). */
export interface MarineQuotationRecord extends MarineQuotation {
  id: number
  status: string | null
  created_at: string
  updated_at?: string
  proforma_invoice_number?: string | null
  broker_rate?: MarineRateCondition | null
  rate?: MarineRateCondition | null
}

export interface MarineQuotationsResponse {
  status: string
  message: string
  data: PaginatedResponse<MarineQuotationRecord>
}

export interface MarineQuotationRecordResponse {
  status: string
  message: string
  data: MarineQuotationRecord
}

export interface MarinePolicyComparison {
  last_month: number
  current_month: number
  difference: number
  percentage_change: string
}

/** Recent policy row shown on the marine dashboard (shape is permissive). */
export interface MarineDashboardPolicy {
  id: number | string
  policy_number?: string | null
  certificate_number?: string | null
  premium?: string | number | null
  status?: string | null
  created_at?: string
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  quotation?: MarineQuotation | null
  [key: string]: unknown
}

export interface MarineDashboardData {
  wallet_balance: number
  all_policies: number
  pending_quotation: number
  pending_claims: number
  expired_quotation: number
  awaiting_niid: number
  policies: MarineDashboardPolicy[]
  policy_comparison: MarinePolicyComparison
}

export interface MarineDashboardResponse {
  status: string
  message: string
  data: MarineDashboardData
}

/** Normalised cover-type option (backend returns a numeric-keyed map). */
export interface MarineCoverTypeOption {
  value: string
  text: string
}

/** Normalised cargo-currency option from /marine/currency. */
export interface MarineCurrencyOption {
  value: string
  name: string
}

export interface MarineCurrencyResponse {
  status: string
  message: string
  data: unknown
}

export interface MarineCoverTypesResponse {
  status: string
  message: string
  data: {
    cover_types: Record<string, string>
  }
}

/** A "nature of cargo" rate option (from /marine/rates or /marine/my-rates). */
export interface MarineRate {
  id: number | string
  condition: string
  [key: string]: unknown
}

export interface MarineRatesResponse {
  status: string
  message: string
  data: {
    data: MarineRate[]
    [key: string]: unknown
  }
}

export interface MarinePremiumPayload {
  invoice_value: string | number
  currency: string
  rate: string | number
  cover_type: string
  exchange_rate: string | number
}

export interface MarinePremiumResponse {
  status: string
  message: string
  data: {
    premium: string | number
    [key: string]: unknown
  }
}

export interface MarineGenerateQuotationPayload {
  proforma_invoice_file: string
  proforma_invoice_number: string
  holder_type: string
  policy_type: string
  email: string
  phone_number: string
  tin: string
  contact_address: string
  cover_type: string
  port_of_departure: string
  port_of_destination: string
  vessel_name: string
  cargo_description: string
  packaging_type: string
  cargo_currency: string
  invoice_value: string
  basic_rate: string
  first_name: string
  last_name: string
  company_name: string
  bank_name: string
  exchange_rate: string
  open_cover_policy_number: string
  rate_id?: string | number
  broker_rate_id?: string | number
}
