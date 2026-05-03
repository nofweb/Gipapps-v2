import { Car, Home, Anchor } from 'lucide-vue-next'
import type { InsuranceProduct } from '~/types/product'

export const PRODUCTS: InsuranceProduct[] = [
  {
    id: 'motor',
    name: 'Motor Insurance',
    shortName: 'Motor',
    tagline: 'Cover for your vehicle',
    description:
      'Comprehensive and third-party motor cover for private, commercial, and corporate fleets.',
    icon: Car,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-700',
    accent: 'from-primary-100 to-primary-50',
    available: true,
  },
  {
    id: 'homeshield',
    name: 'Homeshield Insurance',
    shortName: 'Homeshield',
    tagline: 'Protect what you call home',
    description:
      'Buildings, contents, and household liability cover designed for Nigerian homes.',
    icon: Home,
    iconBg: 'bg-tertiary-100',
    iconColor: 'text-tertiary-600',
    accent: 'from-tertiary-100 to-tertiary-50',
    available: true,
  },
  {
    id: 'marine',
    name: 'Marine Insurance',
    shortName: 'Marine',
    tagline: 'For cargo and goods in transit',
    description:
      'Marine cargo, hull, and goods-in-transit cover for importers, exporters, and fleet operators.',
    icon: Anchor,
    iconBg: 'bg-secondary-100',
    iconColor: 'text-secondary-700',
    accent: 'from-secondary-100 to-secondary-50',
    available: true,
  },
]

export function findProduct(id: string): InsuranceProduct | undefined {
  return PRODUCTS.find(p => p.id === id)
}
