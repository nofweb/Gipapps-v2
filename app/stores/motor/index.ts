import { defineStore } from 'pinia'

export interface MotorPolicy {
  id: string
  plate: string
  model: string
  type: 'Comprehensive' | 'Third-Party' | 'Motor Protect Extra'
  expiry: string
  status: 'Active' | 'Renewal due' | 'Expired'
}

interface MotorState {
  policies: MotorPolicy[]
  openClaims: number
  premiumYtd: number
  lastViewedPolicyId: string | null
  loading: boolean
}

export const useMotorStore = defineStore('motor', {
  state: (): MotorState => ({
    policies: [
      { id: 'mtr-001', plate: 'LSD-234-AB', model: 'Toyota Corolla 2021', type: 'Comprehensive', expiry: 'Expires 12 Aug 2026', status: 'Active' },
      { id: 'mtr-002', plate: 'GGE-901-XY', model: 'Honda CR-V 2019', type: 'Third-Party', expiry: 'Expires 03 Jun 2026', status: 'Active' },
      { id: 'mtr-003', plate: 'KJA-558-CD', model: 'Lexus RX 2022', type: 'Motor Protect Extra', expiry: 'Expires 28 Feb 2026', status: 'Renewal due' },
    ],
    openClaims: 1,
    premiumYtd: 248_000,
    lastViewedPolicyId: null,
    loading: false,
  }),

  getters: {
    activeCount: state => state.policies.filter(p => p.status === 'Active').length,
    renewalsDueCount: state => state.policies.filter(p => p.status === 'Renewal due').length,
    vehicleCount: state => state.policies.length,
  },

  actions: {
    setLastViewed(id: string) {
      this.lastViewedPolicyId = id
    },
  },

  persist: {
    pick: ['lastViewedPolicyId'],
  },
})
