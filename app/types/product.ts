import type { Component } from 'vue'

export type ProductId = 'motor' | 'homeshield' | 'marine'

export interface InsuranceProduct {
  id: ProductId
  name: string
  shortName: string
  tagline: string
  description: string
  /** Lucide icon component */
  icon: Component
  /** Tailwind classes for the icon tile background */
  iconBg: string
  /** Tailwind classes for the icon color */
  iconColor: string
  /** Optional accent gradient for the product card hero */
  accent: string
  available: boolean
  comingSoon?: boolean
}
