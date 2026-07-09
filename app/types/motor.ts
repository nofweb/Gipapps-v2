export type MotorPolicyFamily = 'comprehensive' | 'third_party'
export type MotorHolderType = 'individual' | 'corporate'
export type MotorPaymentMethod = 'WALLET' | 'PAYSTACK'
export type MotorPremiumType = 'ANNUAL' | 'HALF_YEARLY' | 'QUARTERLY'

export type MotorInsuranceClass =
  | 'private_motor'
  | 'commercial_motor'
  | 'tricycle'
  | 'motorcycle'
  | 'staff_bus'

export type MotorVehicleType =
  | 'convertible'
  | 'coupe'
  | 'hatchback'
  | 'saloon'
  | 'suv'
  | 'jeep'
  | 'wagon'
  | 'motorcycle'
  | 'bus'
  | 'pickup'
  | 'mini_bus'
  | 'mini_van'
  | 'tricycle'

export type MotorIndividualIdType =
  | 'nin'
  | 'drivers_licence'
  | 'passport'
  | 'voters_card'

export type MotorCorporateIdType = 'cac' | 'government'

export interface MotorVehicleMake {
  id: string | number
  name: string
  vehicle_models?: MotorVehicleModel[]
}

export interface MotorVehicleModel {
  id: string | number
  name: string
  vehicle_make_id?: string | number
  insurance_class?: string
}

export interface MotorVerifyRegData {
  make_detail?: { id: number | string; name: string }
  model_detail?: { id: number | string; name: string; insurance_class?: string }
  other_details?: {
    registration_number?: string
    chasis_number?: string
    engine_number?: string
    vehicle_color?: string
    year_of_make?: string | number
    owner_name?: string
  }
}

export interface MotorVerifyRegResponse {
  status: string
  message?: string
  data?: MotorVerifyRegData
}

export interface MotorPremiumQuote {
  effective_cover_date: string
  expiration_date: string
  cover_days: number
  annual_premium: number
  premium_type: MotorPremiumType
  premium: number
}

export interface MotorPremiumQuoteResponse {
  status?: string
  message?: string
  data?: MotorPremiumQuote | { data?: MotorPremiumQuote }
}

/** Nested make/model objects returned by /variance/policy/{id}. */
export interface MotorPolicyVehicleMake {
  id: number | string
  name: string
  status?: number | string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface MotorPolicyVehicleModel {
  id: number | string
  name: string
  name2?: string | null
  vehicle_make_id?: number | string
  insurance_class?: string
  status?: number | string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface MotorPolicy {
  id: number
  customer_id?: number
  user_id?: number
  holder_type: string
  first_name: string | null
  last_name?: string | null
  surname?: string | null
  company_name: string | null
  email: string
  contact_address: string
  phone_number: string
  identification: string | null
  id_number: string | null
  upload_id: string | null
  sector?: string | null
  sector_code?: string | null
  registration_number: string
  vehicle_make_id?: string | number | null
  vehicle_model_id?: string | number | null
  vehicle_make?: MotorPolicyVehicleMake | string | null
  vehicle_model?: MotorPolicyVehicleModel | string | null
  chasis_number: string | null
  engine_number: string | null
  vehicle_color: string | null
  year_of_make: string | null
  vehicle_type: string | null
  policy_type: string | null
  variance: string | null
  car_value?: string | number | null
  premium_type?: string | null
  channel?: string | null
  policy_number: string
  certificate_number: string
  niacom_code?: string | null
  premium: string | number
  effective_cover_date: string
  expiration_date: string
  payment_method: string
  payment_status?: string | null
  ies_status?: string | null
  niid_status?: string | null
  is_redeemed?: number
  status?: string
  created_at: string
  updated_at: string
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

export interface MotorPoliciesResponse {
  status: string
  message: string
  data: PaginatedResponse<MotorPolicy>
}

export interface MotorPolicyResponse {
  status: string
  message: string
  data: MotorPolicy
}

export interface MotorSearchResponse {
  status: string
  message: string
  data: MotorPolicy | MotorPolicy[] | { data: MotorPolicy[] } | null
}

export interface MotorRenewResponse {
  status: string
  message: string
  data: MotorPolicy | { policy: MotorPolicy } | null
}

export interface MotorBuyPolicyBase {
  holder_type: MotorHolderType
  variance: string
  first_name?: string
  surname?: string
  company_name?: string
  contact_address: string
  phone_number: string
  email: string
  identification: string
  id_number: string
  upload_id: string
  registration_number: string
  vehicle_make_id: string
  vehicle_model_id: string
  chasis_number: string
  engine_number: string
  vehicle_color: string
  year_of_make: string
  vehicle_type: string
  policy_type: string
  /** Optional uploaded vehicle photo URL (pre-loss inspection aid). */
  upload_vehicle_photo?: string
  sector?: string
  transaction_reference?: string
  payment_method: MotorPaymentMethod
}

export interface MotorBuyComprehensivePayload extends MotorBuyPolicyBase {
  car_value: number
  channel?: string
  premium_type: MotorPremiumType
}

export type MotorBuyPolicyPayload =
  | MotorBuyPolicyBase
  | MotorBuyComprehensivePayload

export interface MotorBuyPolicyResponse {
  status: string
  message?: string
  data?: MotorPolicy
}

/**
 * Body for PUT /customer/modify/{id}. Carries the editable policy fields plus
 * a required `modification_reason` describing why the change is requested.
 */
export interface MotorModifyPayload {
  modification_reason: string
  holder_type: MotorHolderType
  variance: string
  first_name?: string
  surname?: string
  company_name?: string
  contact_address: string
  phone_number: string
  email: string
  identification: string
  id_number: string
  upload_id?: string
  sector?: string
  registration_number: string
  vehicle_make_id: string
  vehicle_model_id: string
  chasis_number: string
  engine_number: string
  vehicle_color: string
  year_of_make: string
  vehicle_type: string
  policy_type: string
  /** Comprehensive only. */
  car_value?: number
  /** Comprehensive only. */
  premium_type?: MotorPremiumType
}

export interface MotorModifyResponse {
  status: string
  message?: string
  data?: MotorPolicy
}

export interface MotorDashboardRecentPolicy {
  id: number
  /** `ezdrive` → comprehensive family. `motor_protect` → third-party family. */
  source: 'motor_protect' | 'ezdrive' | string
  policy_number: string
  certificate_number: string
  insured_name: string | null
  premium: number
  sum_insured: number
  niid_status: string | null
  effective_cover_date: string
  expiration_date: string
  created_at: string
}

export interface MotorDashboardData {
  motor_policy_count: number
  ezdrive_policy_count: number
  policy_count: number
  pending_niid_policy_count: number
  active_policy_count: number
  expired_policy_count: number
  total_premium: number
  total_sum_insured: number
  recent_policies: MotorDashboardRecentPolicy[]
}

export interface MotorDashboardResponse {
  status: string
  message: string
  data: MotorDashboardData
}

export interface MotorDashboardParams {
  from_date?: string
  to_date?: string
  filter?: 'week' | 'month' | 'year'
  month?: number
  year?: number
}

export interface MotorSearchParams {
  policy_number?: string
  insured_name?: string
}
