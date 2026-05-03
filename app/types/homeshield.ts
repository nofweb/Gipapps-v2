export interface HomeshieldQuestionnaireAnswer {
  id: number
  questionnaire_id: number
  homeshield_id: number
  answer: 'yes' | 'no' | string
  details: string | null
  created_at: string
  updated_at: string
  questionnaire: {
    id: number
    question_id: string
    requires_details: string
    created_at: string
    updated_at: string
  }
}

export interface HomeshieldPolicy {
  id: number
  customer_id: number
  holder_type: string
  owner_type: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  email: string
  contact_address: string
  phone_number: string
  identification_number: string
  identification_type: string
  upload_id: string | null
  sector: string
  sector_code: string
  policy_type: string
  property_address: string
  value_of_property: string
  property_type: string
  category: string
  policy_number: string
  certificate_number: string
  niacom_code: string | null
  premium: string
  new_balance: string | null
  payment_method: string
  payment_status: string | null
  effective_cover_date: string
  expiration_date: string
  status: string
  created_at: string
  updated_at: string
  customer?: Record<string, unknown>
  questionnaire_answers?: HomeshieldQuestionnaireAnswer[]
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url?: string
  last_page?: number
  last_page_url?: string
  per_page?: number
  total?: number
  next_page_url?: string | null
  prev_page_url?: string | null
}

export interface HomeshieldPoliciesResponse {
  status: string
  message: string
  data: PaginatedResponse<HomeshieldPolicy>
}

export interface HomeshieldPolicyResponse {
  status: string
  message: string
  data: HomeshieldPolicy
}

export interface HomeshieldQuestionnaireAnswerInput {
  questionnaire_id: number
  answer: 'yes' | 'no'
  details: string | null
}

export interface HomeshieldPurchasePayload {
  holder_type: 'individual' | 'corporate'
  owner_type: 'tenant' | 'landlord'
  first_name: string
  last_name: string
  company_name?: string | null
  email: string
  contact_address: string
  phone_number: string
  identification_number: string
  upload_id?: string | null
  sector: string
  property_address: string
  value_of_property: number
  property_type: 'residential' | 'commercial'
  category: string
  payment_method: 'WALLET' | 'PAYSTACK'
  transaction_reference?: string
  questionnaire_answers: HomeshieldQuestionnaireAnswerInput[]
}

export interface HomeshieldPurchaseResponse {
  status: string
  message: string
  data: {
    policy: HomeshieldPolicy
  }
}

export interface HomeshieldModifyPayload {
  purpose: string
  holder_type: 'individual' | 'corporate'
  owner_type: 'tenant' | 'landlord'
  first_name: string
  last_name: string
  company_name?: string | null
  email: string
  contact_address: string
  phone_number: string
  identification_number: string
  upload_id?: string | null
  sector: string
  upload_property_photo?: string | null
  property_address: string
  value_of_property: number
  property_type: 'residential' | 'commercial'
  /** Note: API field is camelCase with capital K. */
  property_Kind?: string
  category: string
}

export interface HomeshieldModifyResponse {
  status: string
  message: string
  data: HomeshieldPolicy | { policy: HomeshieldPolicy }
}

export interface HomeshieldRecentPolicy {
  id: number
  policy_number: string
  certificate_number: string
  holder_type: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  category: string
  owner_type: string
  property_address: string
  property_type: string
  value_of_property: string
  premium: string
  payment_method: string
  effective_cover_date: string
  expiration_date: string
  status: string
  created_at: string
}

export interface HomeshieldDashboardData {
  wallet_balance: number
  policy_count: number
  active_policy_count: number
  expired_policy_count: number
  total_sum_insured: number
  total_premium: number
  recent_policies: HomeshieldRecentPolicy[]
}

export interface HomeshieldDashboardResponse {
  status: string
  message: string
  data: HomeshieldDashboardData
}

export interface HomeshieldDashboardParams {
  from_date?: string
  to_date?: string
  filter?: 'week' | 'month' | 'year'
  month?: number
  year?: number
}
