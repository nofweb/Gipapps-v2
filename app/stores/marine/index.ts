import { defineStore } from 'pinia'

export interface MarineShipment {
  id: string
  ref: string
  goods: string
  route: string
  value: string
  status: 'In transit' | 'Delivered' | 'Pending'
}

interface MarineState {
  shipments: MarineShipment[]
  voyagesInsured: number
  openClaims: number
  premiumYtd: number
  lastViewedShipmentId: string | null
  loading: boolean
}

export const useMarineStore = defineStore('marine', {
  state: (): MarineState => ({
    shipments: [
      { id: 'mr-001', ref: 'GI-MAR-2026-0431', goods: '40ft container · electronics', route: 'Shenzhen → Apapa', value: '$240,000', status: 'In transit' },
      { id: 'mr-002', ref: 'GI-MAR-2026-0398', goods: 'Bulk grain, 800MT', route: 'Lagos → Tincan', value: '₦95,000,000', status: 'Delivered' },
    ],
    voyagesInsured: 18,
    openClaims: 2,
    premiumYtd: 1_400_000,
    lastViewedShipmentId: null,
    loading: false,
  }),

  getters: {
    activeShipments: state => state.shipments.filter(s => s.status === 'In transit').length,
  },

  actions: {
    setLastViewed(id: string) {
      this.lastViewedShipmentId = id
    },
  },

  persist: {
    pick: ['lastViewedShipmentId'],
  },
})
