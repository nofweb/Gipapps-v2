import { defineStore } from 'pinia'
import axios, { type AxiosError } from 'axios'
import type {
  HomeshieldPolicy,
  HomeshieldPoliciesResponse,
  HomeshieldPolicyResponse,
  HomeshieldModifyPayload,
  HomeshieldModifyResponse,
  HomeshieldDashboardData,
  HomeshieldDashboardResponse,
  HomeshieldDashboardParams,
  HomeshieldSearchParams,
  HomeshieldSearchResponse,
  HomeshieldRenewResponse,
} from '~/types/homeshield'

export interface HomeshieldProperty {
  id: string
  name: string
  address: string
  cover: 'Buildings + Contents' | 'Contents Only' | 'Buildings Only'
  sumInsured: string
}

interface HomeshieldState {
  properties: HomeshieldProperty[]
  openClaims: number
  premiumYtd: number
  lastViewedPropertyId: string | null

  policies: HomeshieldPolicy[]
  policiesPage: number
  policiesLastPage: number
  policiesTotal: number
  policiesLoading: boolean
  policiesError: string | null
  policiesLoaded: boolean

  policyById: Record<number, HomeshieldPolicy>
  policyDetailLoading: boolean
  policyDetailError: string | null

  certificateLoading: boolean

  modifyLoading: boolean
  modifyError: string | null

  sectors: SectorOption[]
  sectorsLoading: boolean
  sectorsError: string | null

  dashboard: HomeshieldDashboardData | null
  dashboardLoading: boolean
  dashboardError: string | null

  searchResults: HomeshieldPolicy[]
  searchLoading: boolean
  searchError: string | null
  searchPerformed: boolean

  renewLoading: boolean
  renewError: string | null
  renewingId: number | string | null
}

export interface SectorOption {
  id?: number | string
  name: string
  code?: string | null
}

export const useHomeshieldStore = defineStore('homeshield', {
  state: (): HomeshieldState => ({
    properties: [
      { id: 'hs-001', name: 'Lekki Residence', address: 'Plot 41, Admiralty Way', cover: 'Buildings + Contents', sumInsured: '₦85,000,000' },
      { id: 'hs-002', name: 'Abuja Apartment', address: '12 Mississippi St, Maitama', cover: 'Contents Only', sumInsured: '₦18,500,000' },
    ],
    openClaims: 0,
    premiumYtd: 162_000,
    lastViewedPropertyId: null,

    policies: [],
    policiesPage: 1,
    policiesLastPage: 1,
    policiesTotal: 0,
    policiesLoading: false,
    policiesError: null,
    policiesLoaded: false,

    policyById: {},
    policyDetailLoading: false,
    policyDetailError: null,

    certificateLoading: false,

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
  }),

  getters: {
    propertyCount: state => state.properties.length,
    totalSumInsuredLabel: state =>
      state.properties.length === 0 ? '₦0' : '₦103.5M',
  },

  actions: {
    setLastViewed(id: string) {
      this.lastViewedPropertyId = id
    },

    async fetchPolicies(page = 1) {
      this.policiesLoading = true
      this.policiesError = null
      try {
        const api = useApi()
        const { data } = await api.get<HomeshieldPoliciesResponse>(
          '/home-shield/my-policies',
          { params: { page } },
        )
        this.policies = data.data.data
        this.policiesPage = data.data.current_page
        this.policiesLastPage = data.data.last_page ?? 1
        this.policiesTotal = data.data.total ?? data.data.data.length
        this.policiesLoaded = true
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to load policies'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.policiesError = message
        throw err
      }
      finally {
        this.policiesLoading = false
      }
    },

    async fetchPolicy(id: number | string) {
      this.policyDetailLoading = true
      this.policyDetailError = null
      try {
        const api = useApi()
        const { data } = await api.get<HomeshieldPolicyResponse>(
          `/home-shield/policy/${id}`,
        )
        this.policyById[data.data.id] = data.data
        return data.data
      }
      catch (err: unknown) {
        let message = 'Unable to load policy'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.policyDetailError = message
        throw err
      }
      finally {
        this.policyDetailLoading = false
      }
    },

    async fetchCertificateBlob(certificateNumber: string): Promise<Blob> {
      const api = useApi()
      const res = await api.get('/home-shield/print', {
        params: { certificate_number: certificateNumber },
        responseType: 'blob',
      })
      const data = res.data as Blob
      const type = data.type && data.type !== 'application/octet-stream'
        ? data.type
        : 'application/pdf'
      return new Blob([data], { type })
    },

    async printCertificate(certificateNumber: string) {
      this.certificateLoading = true
      try {
        const blob = await this.fetchCertificateBlob(certificateNumber)
        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank', 'noopener,noreferrer')
        if (win) {
          const triggerPrint = () => {
            try { win.focus(); win.print() }
            catch { /* popup blocked or different origin */ }
          }
          win.addEventListener('load', triggerPrint, { once: true })
          // Fallback if 'load' has already fired by the time we attach.
          setTimeout(triggerPrint, 1500)
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
      finally {
        this.certificateLoading = false
      }
    },

    async searchPolicy(params: HomeshieldSearchParams) {
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
        const { data } = await api.get<HomeshieldSearchResponse>(
          '/home-shield/search-policy',
          { params: cleaned },
        )

        let raw: unknown = data?.data
        if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'data' in (raw as Record<string, unknown>)) {
          raw = (raw as { data: unknown }).data
        }
        const list: HomeshieldPolicy[] = Array.isArray(raw)
          ? (raw as HomeshieldPolicy[])
          : raw
            ? [raw as HomeshieldPolicy]
            : []
        this.searchResults = list
        this.searchPerformed = true
        return list
      }
      catch (err: unknown) {
        let message = 'Search failed'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.searchError = message
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

    async renewPolicy(id: number | string) {
      this.renewLoading = true
      this.renewError = null
      this.renewingId = id
      try {
        const api = useApi()
        const { data } = await api.post<HomeshieldRenewResponse>(
          `/home-shield/renew-policy/${id}`,
        )
        const renewed = data?.data && typeof data.data === 'object' && 'policy' in (data.data as Record<string, unknown>)
          ? (data.data as { policy: HomeshieldPolicy }).policy
          : (data?.data as HomeshieldPolicy | null)
        if (renewed?.id) this.policyById[renewed.id] = renewed
        return renewed
      }
      catch (err: unknown) {
        let message = 'Renewal failed'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.renewError = message
        throw err
      }
      finally {
        this.renewLoading = false
        this.renewingId = null
      }
    },

    async fetchDashboard(params: HomeshieldDashboardParams = {}) {
      this.dashboardLoading = true
      this.dashboardError = null
      try {
        const api = useApi()
        const cleaned: Record<string, string | number> = {}
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') cleaned[k] = v as string | number
        }
        const { data } = await api.get<HomeshieldDashboardResponse>(
          '/home-shield/dashboard',
          { params: cleaned },
        )
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

    async fetchSectors() {
      if (this.sectors.length > 0) return this.sectors
      this.sectorsLoading = true
      this.sectorsError = null
      try {
        const api = useApi()
        const { data } = await api.get<unknown>('/industry/all-sectors')

        // Normalise across response shapes: { data: [...] } | { data: { data: [...] } } | [...]
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
        let message = 'Unable to load sectors'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.sectorsError = message
        throw err
      }
      finally {
        this.sectorsLoading = false
      }
    },

    async modifyPolicy(id: number | string, payload: HomeshieldModifyPayload) {
      this.modifyLoading = true
      this.modifyError = null
      try {
        const api = useApi()
        const { data } = await api.put<HomeshieldModifyResponse>(
          `/home-shield/modify-policy/${id}`,
          payload,
        )
        // Response may be either { data: policy } or { data: { policy } }.
        const updated = (data.data && 'policy' in data.data
          ? (data.data as { policy: HomeshieldPolicy }).policy
          : (data.data as HomeshieldPolicy))
        if (updated?.id) this.policyById[updated.id] = updated
        return updated
      }
      catch (err: unknown) {
        let message = 'Unable to update policy'
        if (axios.isAxiosError(err)) {
          const e = err as AxiosError<{ message?: string }>
          message = e.response?.data?.message ?? e.message ?? message
        }
        else if (err instanceof Error) {
          message = err.message
        }
        this.modifyError = message
        throw err
      }
      finally {
        this.modifyLoading = false
      }
    },

    async downloadCertificate(certificateNumber: string) {
      this.certificateLoading = true
      try {
        const blob = await this.fetchCertificateBlob(certificateNumber)
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
        this.certificateLoading = false
      }
    },
  },

  persist: {
    pick: ['lastViewedPropertyId'],
  },
})
