import { defineStore } from 'pinia'
import axios, { type AxiosError } from 'axios'
import type {
  MotorPolicy,
  MotorPoliciesResponse,
  MotorPolicyResponse,
  MotorDashboardData,
  MotorDashboardResponse,
  MotorDashboardParams,
  MotorRenewResponse,
  MotorSearchParams,
  MotorSearchResponse,
  MotorVehicleMake,
  MotorVerifyRegResponse,
  MotorPolicyFamily,
  MotorModifyPayload,
  MotorModifyResponse,
} from '~/types/motor'

export interface SectorOption {
  id?: number | string
  name: string
  code?: string | null
}

/**
 * Filter params accepted by the my-policies endpoints. Comprehensive uses
 * GET /variance/my-policies (supports policy_type); third-party uses
 * GET /customer/my-policies (no policy_type).
 */
export interface MotorPoliciesParams {
  page?: number
  /** DD-MM-YYYY */
  fromDate?: string
  /** DD-MM-YYYY */
  toDate?: string
  /** Insurance class code (PM, CV, SB, TR, MC) — comprehensive only. */
  policyType?: string
  niidStatus?: string
}

interface MotorState {
  // Policies list
  policies: MotorPolicy[]
  policiesPage: number
  policiesLastPage: number
  policiesTotal: number
  policiesLoading: boolean
  policiesError: string | null
  policiesLoaded: boolean
  policiesFamily: MotorPolicyFamily | null

  // Policy detail
  policyById: Record<number, MotorPolicy>
  policyDetailLoading: boolean
  policyDetailError: string | null

  // Certificate
  printLoading: boolean
  downloadLoading: boolean

  // Modification
  modifyLoading: boolean
  modifyError: string | null

  // Sectors
  sectors: SectorOption[]
  sectorsLoading: boolean
  sectorsError: string | null

  // Dashboard
  dashboard: MotorDashboardData | null
  dashboardLoading: boolean
  dashboardError: string | null

  // Search / renewals
  searchResults: MotorPolicy[]
  searchLoading: boolean
  searchError: string | null
  searchPerformed: boolean
  renewLoading: boolean
  renewError: string | null
  renewingId: number | string | null

  // Catalog (makes + models)
  makes: MotorVehicleMake[]
  makesLoading: boolean
  makesError: string | null

  // Reg verification
  regVerifying: boolean
  regVerifyError: string | null
  regVerifyData: MotorVerifyRegResponse['data'] | null

  // Local-only legacy fields kept for ProductMotorView
  openClaims: number
  premiumYtd: number
  lastViewedPolicyId: string | null
}

export const useMotorStore = defineStore('motor', {
  state: (): MotorState => ({
    policies: [],
    policiesPage: 1,
    policiesLastPage: 1,
    policiesTotal: 0,
    policiesLoading: false,
    policiesError: null,
    policiesLoaded: false,
    policiesFamily: null,

    policyById: {},
    policyDetailLoading: false,
    policyDetailError: null,

    printLoading: false,
    downloadLoading: false,

    modifyLoading: false,
    modifyError: null,

    sectors: [],
    sectorsLoading: false,
    sectorsError: null,

    dashboard: null,
    dashboardLoading: false,
    dashboardError: null,

    searchResults: [],
    searchLoading: false,
    searchError: null,
    searchPerformed: false,
    renewLoading: false,
    renewError: null,
    renewingId: null,

    makes: [],
    makesLoading: false,
    makesError: null,

    regVerifying: false,
    regVerifyError: null,
    regVerifyData: null,

    openClaims: 0,
    premiumYtd: 0,
    lastViewedPolicyId: null,
  }),

  getters: {
    activeCount: state => state.policies.filter(p => p.status?.toLowerCase() === 'active').length,
    vehicleCount: state => state.policies.length,
    findMake: state => (id: string | number) =>
      state.makes.find(m => String(m.id) === String(id)),
  },

  actions: {
    setLastViewed(id: string) {
      this.lastViewedPolicyId = id
    },

    /**
     * Fetches policies for a family.
     * - comprehensive → GET /variance/my-policies   (accepts policy_type)
     * - third_party   → GET /customer/my-policies   (no policy_type)
     *
     * Both endpoints support from_date / to_date / niid_status.
     */
    async fetchPolicies(family: MotorPolicyFamily, opts: MotorPoliciesParams = {}) {
      this.policiesLoading = true
      this.policiesError = null
      try {
        const api = useApi()
        const url = family === 'comprehensive'
          ? '/variance/my-policies'
          : '/customer/my-policies'

        const params: Record<string, string | number> = {}
        if (opts.page) params.page = opts.page
        if (opts.fromDate) params.from_date = opts.fromDate
        if (opts.toDate) params.to_date = opts.toDate
        if (opts.niidStatus) params.niid_status = opts.niidStatus
        // policy_type is only honoured by the comprehensive endpoint.
        if (family === 'comprehensive' && opts.policyType) params.policy_type = opts.policyType

        const { data } = await api.get<MotorPoliciesResponse>(url, { params })
        this.policies = data.data.data
        this.policiesPage = data.data.current_page
        this.policiesLastPage = data.data.last_page ?? 1
        this.policiesTotal = data.data.total ?? data.data.data.length
        this.policiesLoaded = true
        this.policiesFamily = family
        return data.data
      }
      catch (err: unknown) {
        this.policiesError = pickMessage(err, 'Unable to load policies')
        throw err
      }
      finally {
        this.policiesLoading = false
      }
    },

    /**
     * Fetches a single policy. Endpoint is selected by family:
     *  - comprehensive → GET /variance/policy/{id}
     *  - third_party   → GET /customer/policy/{id}
     *
     * When `family` is omitted (e.g. deep link without context) we try the
     * comprehensive endpoint first and fall back to the third-party one on
     * 404 / "not found" responses.
     */
    async fetchPolicy(id: number | string, family?: MotorPolicyFamily) {
      this.policyDetailLoading = true
      this.policyDetailError = null
      try {
        const api = useApi()

        if (family) {
          const url = family === 'comprehensive'
            ? `/variance/policy/${id}`
            : `/customer/policy/${id}`
          const { data } = await api.get<MotorPolicyResponse>(url)
          this.policyById[data.data.id] = data.data
          return data.data
        }

        // Family unknown — try comp, fall back to TP on 404.
        try {
          const { data } = await api.get<MotorPolicyResponse>(`/variance/policy/${id}`)
          this.policyById[data.data.id] = data.data
          return data.data
        }
        catch (compErr: unknown) {
          if (axios.isAxiosError(compErr) && compErr.response?.status === 404) {
            const { data } = await api.get<MotorPolicyResponse>(`/customer/policy/${id}`)
            this.policyById[data.data.id] = data.data
            return data.data
          }
          throw compErr
        }
      }
      catch (err: unknown) {
        this.policyDetailError = pickMessage(err, 'Unable to load policy')
        throw err
      }
      finally {
        this.policyDetailLoading = false
      }
    },

    async fetchCertificateBlob(certificateNumber: string, thirdParty = false): Promise<Blob> {
      const api = useApi()
      // Third-party certificates are served from the customer endpoint; all other
      // variances use the variance endpoint.
      const endpoint = thirdParty ? '/customer/certificate' : '/variance/certificate'
      const res = await api.get(endpoint, {
        params: { certificate_number: certificateNumber },
        responseType: 'blob',
        skipErrorToast: true,
      })
      const data = res.data as Blob
      const type = data.type && data.type !== 'application/octet-stream'
        ? data.type
        : 'application/pdf'
      return new Blob([data], { type })
    },

    async printCertificate(certificateNumber: string, thirdParty = false) {
      this.printLoading = true
      try {
        const blob = await this.fetchCertificateBlob(certificateNumber, thirdParty)
        const url = URL.createObjectURL(blob)
        // Print via a hidden iframe rather than window.open(): the open happens
        // after an await, so it's no longer tied to the click gesture and the
        // browser's popup blocker would block it. A same-origin blob iframe
        // prints reliably without a popup.
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        iframe.src = url
        const cleanup = () => {
          iframe.remove()
          URL.revokeObjectURL(url)
        }
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
          }
          catch { /* printing unavailable in this environment */ }
        }
        document.body.appendChild(iframe)
        // Keep the iframe alive long enough for the print dialog, then clean up.
        setTimeout(cleanup, 60_000)
      }
      finally {
        this.printLoading = false
      }
    },

    async downloadCertificate(certificateNumber: string, thirdParty = false) {
      this.downloadLoading = true
      try {
        const blob = await this.fetchCertificateBlob(certificateNumber, thirdParty)
        const url = URL.createObjectURL(blob)
        const filename = `${certificateNumber.replace(/[\\/]+/g, '-')}.pdf`
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 5_000)
      }
      finally {
        this.downloadLoading = false
      }
    },

    /**
     * Submit a modification request for a policy.
     * PUT /customer/modify/{id} with the editable policy fields plus a
     * required `modification_reason`.
     */
    async modifyPolicy(id: number | string, payload: MotorModifyPayload) {
      this.modifyLoading = true
      this.modifyError = null
      try {
        const api = useApi()
        const { data } = await api.put<MotorModifyResponse>(`/customer/modify/${id}`, payload, { skipSuccessToast: true, skipErrorToast: true })
        const updated = data?.data
        if (updated?.id) this.policyById[updated.id] = updated
        return updated ?? null
      }
      catch (err: unknown) {
        this.modifyError = pickMessage(err, 'Unable to submit modification')
        throw err
      }
      finally {
        this.modifyLoading = false
      }
    },

    async fetchSectors() {
      if (this.sectors.length > 0) return this.sectors
      this.sectorsLoading = true
      this.sectorsError = null
      try {
        const api = useApi()
        const { data } = await api.get<unknown>('/industry/all-sectors')
        let raw: unknown = data
        if (raw && typeof raw === 'object' && 'data' in raw) {
          raw = (raw as { data: unknown }).data
          if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
            raw = (raw as { data: unknown }).data
          }
        }
        const list = Array.isArray(raw) ? raw : []

        this.sectors = list
          .map((item): SectorOption | null => {
            if (typeof item === 'string') return { name: item }
            if (item && typeof item === 'object') {
              const o = item as Record<string, unknown>
              const name = (o.name ?? o.sector ?? o.title ?? o.label) as string | undefined
              if (!name) return null
              return {
                id: (o.id ?? o.sector_id) as number | string | undefined,
                name,
                code: (o.code ?? o.sector_code) as string | null | undefined ?? null,
              }
            }
            return null
          })
          .filter((s): s is SectorOption => !!s)
        return this.sectors
      }
      catch (err: unknown) {
        this.sectorsError = pickMessage(err, 'Unable to load sectors')
        throw err
      }
      finally {
        this.sectorsLoading = false
      }
    },

    /**
     * GET /customer/dashboard — unified motor dashboard (combines comprehensive
     * + third-party in one response). Accepts `from_date`, `to_date`, `filter`
     * (week | month | year), `month`, `year`.
     */
    async fetchDashboard(params: MotorDashboardParams = {}) {
      this.dashboardLoading = true
      this.dashboardError = null
      try {
        const api = useApi()
        const cleaned: Record<string, string | number> = {}
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') cleaned[k] = v as string | number
        }
        const { data } = await api.get<MotorDashboardResponse>('/customer/dashboard', { params: cleaned })
        this.dashboard = data.data
        return data.data
      }
      catch (err: unknown) {
        this.dashboardError = pickMessage(err, 'Unable to load dashboard')
        throw err
      }
      finally {
        this.dashboardLoading = false
      }
    },

    async searchPolicy(family: MotorPolicyFamily, params: MotorSearchParams) {
      this.searchLoading = true
      this.searchError = null
      try {
        const api = useApi()
        const cleaned: Record<string, string> = {}
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            cleaned[k] = String(v).trim()
          }
        }
        const endpoint = family === 'comprehensive'
          ? '/variance/ez-drive/search-policy'
          : '/variance/thirdparty/search-policy'
        const { data } = await api.get<MotorSearchResponse>(endpoint, { params: cleaned, skipErrorToast: true })

        let raw: unknown = data?.data
        if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'data' in (raw as Record<string, unknown>)) {
          raw = (raw as { data: unknown }).data
        }
        const list: MotorPolicy[] = Array.isArray(raw)
          ? (raw as MotorPolicy[])
          : raw
            ? [raw as MotorPolicy]
            : []
        this.searchResults = list
        this.searchPerformed = true
        return list
      }
      catch (err: unknown) {
        this.searchError = pickMessage(err, 'Search failed')
        this.searchResults = []
        this.searchPerformed = true
        throw err
      }
      finally {
        this.searchLoading = false
      }
    },

    clearSearch() {
      this.searchResults = []
      this.searchError = null
      this.searchPerformed = false
    },

    async renewPolicy(family: MotorPolicyFamily, id: number | string) {
      this.renewLoading = true
      this.renewError = null
      this.renewingId = id
      try {
        const api = useApi()
        const endpoint = family === 'comprehensive'
          ? `/variance/ez-drive/renew-policy/${id}`
          : `/variance/thirdparty/renew-policy/${id}`
        const { data } = await api.post<MotorRenewResponse>(endpoint, undefined, { skipSuccessToast: true, skipErrorToast: true })
        const renewed = data?.data && typeof data.data === 'object' && 'policy' in (data.data as Record<string, unknown>)
          ? (data.data as { policy: MotorPolicy }).policy
          : (data?.data as MotorPolicy | null)
        if (renewed?.id) this.policyById[renewed.id] = renewed
        return renewed
      }
      catch (err: unknown) {
        this.renewError = pickMessage(err, 'Renewal failed')
        throw err
      }
      finally {
        this.renewLoading = false
        this.renewingId = null
      }
    },

    async fetchMakes(force = false) {
      if (!force && this.makes.length > 0) return this.makes
      this.makesLoading = true
      this.makesError = null
      try {
        const api = useApi()
        const { data } = await api.get<{ data?: MotorVehicleMake[] } | MotorVehicleMake[]>('/vehicle/all-makes/all')
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        this.makes = list
        return list
      }
      catch (err: unknown) {
        this.makesError = pickMessage(err, 'Unable to load vehicle makes')
        throw err
      }
      finally {
        this.makesLoading = false
      }
    },

    modelsFor(makeId: string | number, insuranceClassCode?: string) {
      const make = this.makes.find(m => String(m.id) === String(makeId))
      const models = make?.vehicle_models ?? []
      if (!insuranceClassCode) return models
      return models.filter(m => String(m.insurance_class) === insuranceClassCode)
    },

    async verifyReg(regNumber: string) {
      this.regVerifying = true
      this.regVerifyError = null
      this.regVerifyData = null
      try {
        const api = useApi()
        const { data } = await api.post<MotorVerifyRegResponse>('/verify-vehicle', { regNumber }, { skipSuccessToast: true, skipErrorToast: true })
        if (data?.status !== 'success' || !data.data?.make_detail?.id) {
          this.regVerifyError = data?.message ?? "We couldn't verify this registration."
          return null
        }
        this.regVerifyData = data.data
        return data.data
      }
      catch (err: unknown) {
        this.regVerifyError = pickMessage(err, "We couldn't verify this registration.")
        throw err
      }
      finally {
        this.regVerifying = false
      }
    },
  },

  persist: {
    pick: ['lastViewedPolicyId'],
  },
})

function pickMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string }>
    return e.response?.data?.message ?? e.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
