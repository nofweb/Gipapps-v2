import type {
  MotorInsuranceClass,
  MotorPolicyFamily,
  MotorPremiumType,
  MotorVehicleType,
  MotorIndividualIdType,
  MotorCorporateIdType,
} from '~/types/motor'

export const INSURANCE_CLASS_LABELS: Record<MotorInsuranceClass, string> = {
  private_motor: 'Private Motor',
  commercial_motor: 'Commercial Motor',
  tricycle: 'Tricycle',
  motorcycle: 'Motorcycle',
  staff_bus: 'Staff Bus',
}

export const INSURANCE_CLASS_TO_CODE: Record<MotorInsuranceClass, string> = {
  private_motor: 'PM',
  commercial_motor: 'CV',
  tricycle: 'TR',
  motorcycle: 'MC',
  staff_bus: 'SB',
}

const CODE_TO_INSURANCE_CLASS: Record<string, MotorInsuranceClass> = {
  PM: 'private_motor',
  CV: 'commercial_motor',
  TR: 'tricycle',
  MC: 'motorcycle',
  SB: 'staff_bus',
}

export function toInsuranceClassCode(cls: MotorInsuranceClass): string {
  return INSURANCE_CLASS_TO_CODE[cls]
}

export function fromInsuranceClassCode(code: string | undefined | null): MotorInsuranceClass | undefined {
  if (!code) return undefined
  return CODE_TO_INSURANCE_CLASS[code.toUpperCase()]
}

export interface MotorClassMeta {
  id: MotorInsuranceClass
  label: string
  description: string
  /** Annual third-party premium for this class (Naira). */
  thirdPartyPremium: number
  benefits: string[]
}

export const MOTOR_CLASSES: MotorClassMeta[] = [
  {
    id: 'private_motor',
    label: 'Private Motor',
    description: 'Cars driven for personal use.',
    thirdPartyPremium: 15_000,
    benefits: [
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Free ECOWAS Brown Card',
    ],
  },
  {
    id: 'commercial_motor',
    label: 'Commercial Motor',
    description: 'Vehicles used for business or carrying goods.',
    thirdPartyPremium: 20_000,
    benefits: [
      'Third-party property damage: ₦5,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Cover for own goods or general cartage',
    ],
  },
  {
    id: 'staff_bus',
    label: 'Staff Bus',
    description: 'Buses transporting staff for an organisation.',
    thirdPartyPremium: 20_000,
    benefits: [
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Designed for corporate fleets',
    ],
  },
  {
    id: 'tricycle',
    label: 'Tricycle',
    description: 'Tricycles for personal or commercial transport.',
    thirdPartyPremium: 5_000,
    benefits: [
      'Third-party property damage: ₦2,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Affordable annual cover',
    ],
  },
  {
    id: 'motorcycle',
    label: 'Motorcycle',
    description: 'Motorcycles for personal use.',
    thirdPartyPremium: 3_000,
    benefits: [
      'Third-party property damage: ₦1,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Lightweight, low-cost annual cover',
    ],
  },
]

export function findMotorClass(id: MotorInsuranceClass | null | undefined) {
  return MOTOR_CLASSES.find(c => c.id === id)
}

export function getThirdPartyPremium(cls: MotorInsuranceClass): number {
  return findMotorClass(cls)?.thirdPartyPremium ?? 0
}

export const VEHICLE_TYPE_LABELS: Record<MotorVehicleType, string> = {
  convertible: 'Convertible',
  coupe: 'Coupe',
  hatchback: 'Hatchback',
  saloon: 'Saloon',
  suv: 'SUV',
  jeep: 'Jeep',
  wagon: 'Wagon',
  motorcycle: 'Motorcycle',
  bus: 'Bus',
  pickup: 'Pick-up',
  mini_bus: 'Mini-bus',
  mini_van: 'Mini-van',
  tricycle: 'Tricycle',
}

const TYPES_BY_CLASS: Record<MotorInsuranceClass, MotorVehicleType[]> = {
  private_motor: ['convertible', 'coupe', 'hatchback', 'saloon', 'suv', 'jeep', 'wagon'],
  commercial_motor: ['bus', 'pickup', 'mini_bus', 'mini_van'],
  tricycle: ['tricycle'],
  motorcycle: ['motorcycle'],
  staff_bus: ['bus', 'mini_bus'],
}

export function getVehicleTypesForClass(cls: MotorInsuranceClass): MotorVehicleType[] {
  return TYPES_BY_CLASS[cls] ?? []
}

export const INDIVIDUAL_ID_OPTIONS: Array<{
  value: MotorIndividualIdType
  label: string
  apiLabel: string
  placeholder: string
}> = [
  { value: 'nin', label: 'NIN', apiLabel: 'NIN', placeholder: '11-digit NIN' },
  { value: 'drivers_licence', label: "Driver's Licence", apiLabel: "Driver's Licence", placeholder: "Driver's licence number" },
  { value: 'passport', label: 'International Passport', apiLabel: 'International Passport', placeholder: 'Passport number' },
  { value: 'voters_card', label: "Voter's Card", apiLabel: "Voter's Card", placeholder: 'VIN' },
]

export const INDIVIDUAL_ID_LABELS: Record<MotorIndividualIdType, string> = {
  nin: 'NIN',
  drivers_licence: "Driver's Licence",
  passport: 'International Passport',
  voters_card: "Voter's Card",
}

export const CORPORATE_ID_LABELS: Record<MotorCorporateIdType, string> = {
  cac: 'CAC',
  government: 'Government',
}

export const PREMIUM_TYPE_LABELS: Record<MotorPremiumType, string> = {
  ANNUAL: 'Annually',
  HALF_YEARLY: 'Half-Yearly',
  QUARTERLY: 'Quarterly',
}

export const PREMIUM_TYPE_DESCRIPTIONS: Record<MotorPremiumType, string> = {
  ANNUAL: 'Pay the full premium upfront for the full year.',
  HALF_YEARLY: 'Split the premium into two payments.',
  QUARTERLY: 'Spread the premium across four payments.',
}

export function familyEndpoint(family: MotorPolicyFamily): string {
  return family === 'comprehensive' ? '/variance/ez-drive' : '/variance/thirdparty/category'
}

export function familyVehicleSaveEndpoint(family: MotorPolicyFamily): string {
  return family === 'comprehensive' ? '/variance/save-vehicle-info' : '/customer/save-vehicle'
}

/* ------------------------------------------------------------------ */
/* Motor product variants — each is a discrete product the user can   */
/* buy / view / renew. Variants share a family (which selects the     */
/* buy-policy endpoint) but carry a distinct `variance` label, value  */
/* range, allowed payment plans, and benefits.                        */
/* ------------------------------------------------------------------ */
export type MotorVariant =
  | 'comprehensive'
  | 'ez_drive'
  | 'ez_drive_plus'
  | 'ez_drive_elite'
  | 'third_party'
  | 'motor_protect_extra__private_motor'
  | 'motor_protect_extra__private_bus'
  | 'motor_protect_extra__own_goods'

export interface MotorVariantMeta {
  id: MotorVariant
  family: MotorPolicyFamily
  /** Sent to the backend as the `variance` field on save-contact / save-vehicle / buy-policy. */
  displayName: string
  /** Short label used in the sidebar + headers. */
  shortName: string
  /** URL slug under `/motor/`. */
  slug: string
  description: string
  /** Fixed annual premium — used by Motor Protect Extra variants only. */
  basePremium?: number
  /** Car value range — used by EZ Drive variants (comprehensive). */
  vehicleValueMin?: number
  vehicleValueMax?: number
  /** Allowed payment plan options for comprehensive variants. */
  allowedPlans: MotorPremiumType[]
  /** When false, the wizard skips the Insurance Class step and uses presetClass. */
  classSelectable: boolean
  /** Insurance class to preset when classSelectable is false. */
  presetClass?: MotorInsuranceClass
  benefits: string[]
}

export const MOTOR_VARIANTS: Record<MotorVariant, MotorVariantMeta> = {
  comprehensive: {
    id: 'comprehensive',
    family: 'comprehensive',
    displayName: 'COMPREHENSIVE',
    shortName: 'Comprehensive',
    slug: 'comprehensive',
    description: 'Full vehicle cover for all car types.',
    allowedPlans: ['ANNUAL', 'HALF_YEARLY'],
    classSelectable: true,
    benefits: [
      'Accidental damage (own vehicle): Full coverage',
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Theft, vandalism, fire (excl. self-ignition)',
      'Free automatic ECOWAS Brown Card',
    ],
  },

  ez_drive: {
    id: 'ez_drive',
    family: 'comprehensive',
    displayName: 'EZ Drive',
    shortName: 'EZ Drive',
    slug: 'ez-drive',
    description: 'For vehicles worth ₦5,000,000 – ₦7,500,000.',
    vehicleValueMin: 5_000_000,
    vehicleValueMax: 7_500_000,
    allowedPlans: ['ANNUAL', 'HALF_YEARLY'],
    classSelectable: false,
    presetClass: 'private_motor',
    benefits: [
      'Accidental damage (own vehicle): Full coverage',
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Theft & vandalism: Full coverage',
      'Personal accident cover: ₦50,000',
      'Towing: Intra ₦50,000, Inter ₦80,000',
      'Flood extension limit: ₦1,000,000',
      'Free tracking · Excess buy-back · ECOWAS Brown Card',
    ],
  },

  ez_drive_plus: {
    id: 'ez_drive_plus',
    family: 'comprehensive',
    displayName: 'EZ Drive Plus',
    shortName: 'EZ Drive Plus',
    slug: 'ez-drive-plus',
    description: 'For vehicles worth ₦7,500,001 – ₦10,000,000.',
    vehicleValueMin: 7_500_001,
    vehicleValueMax: 10_000_000,
    allowedPlans: ['ANNUAL', 'HALF_YEARLY'],
    classSelectable: false,
    presetClass: 'private_motor',
    benefits: [
      'Accidental damage (own vehicle): Full coverage',
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Personal accident cover: ₦75,000',
      'Personal effects cover: ₦75,000',
      'Towing: Intra ₦50,000, Inter ₦80,000',
      'Flood extension limit: ₦3,000,000',
      'Free tracking · Excess buy-back · ECOWAS Brown Card',
    ],
  },

  ez_drive_elite: {
    id: 'ez_drive_elite',
    family: 'comprehensive',
    displayName: 'EZ Drive Elite',
    shortName: 'EZ Drive Elite',
    slug: 'ez-drive-elite',
    description: 'For vehicles worth ₦10,000,000 and above.',
    vehicleValueMin: 10_000_000,
    allowedPlans: ['ANNUAL', 'HALF_YEARLY', 'QUARTERLY'],
    classSelectable: false,
    presetClass: 'private_motor',
    benefits: [
      'Accidental damage (own vehicle): Full coverage',
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Personal accident cover: ₦100,000',
      'Personal effects cover: ₦100,000',
      'Towing: Intra ₦50,000, Inter ₦80,000',
      'Flood extension limit: ₦5,000,000',
      'Quarterly payment plan available',
    ],
  },

  third_party: {
    id: 'third_party',
    family: 'third_party',
    displayName: 'Third Party',
    shortName: 'Third Party',
    slug: 'third-party',
    description: 'Statutory third-party cover for all vehicle types.',
    allowedPlans: ['ANNUAL'],
    classSelectable: true,
    benefits: [
      'Third-party property damage from ₦1,000,000 to ₦5,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Premium based on vehicle class',
    ],
  },

  motor_protect_extra__private_motor: {
    id: 'motor_protect_extra__private_motor',
    family: 'third_party',
    displayName: 'Motor Protect Extra (Private Car)',
    shortName: 'MPE · Private Motor',
    slug: 'mpe-private-motor',
    description: 'Cars driven for personal use.',
    basePremium: 30_000,
    allowedPlans: ['ANNUAL'],
    classSelectable: false,
    presetClass: 'private_motor',
    benefits: [
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Accidental (own) damage involving third party: up to ₦500,000',
      'Towing of insured vehicle: ₦10,000',
      'Fire peril (excl. self-ignition): ₦500,000',
      'Windscreen damage involving third party: ₦50,000',
      'Free car wash up to ₦2,500',
      'Free ECOWAS Brown Card',
    ],
  },

  motor_protect_extra__private_bus: {
    id: 'motor_protect_extra__private_bus',
    family: 'third_party',
    displayName: 'Motor Protect Extra (Private Bus)',
    shortName: 'MPE · Private Bus',
    slug: 'mpe-private-bus',
    description: 'Buses used for private / staff transport.',
    basePremium: 35_000,
    allowedPlans: ['ANNUAL'],
    classSelectable: false,
    presetClass: 'staff_bus',
    benefits: [
      'Third-party property damage: ₦3,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Accidental (own) damage involving third party: up to ₦500,000',
      'Towing of insured vehicle: ₦15,000',
      'Fire peril (excl. self-ignition): ₦500,000',
      'Windscreen damage involving third party: ₦50,000',
      'Free car wash up to ₦2,500',
      'Free ECOWAS Brown Card',
    ],
  },

  motor_protect_extra__own_goods: {
    id: 'motor_protect_extra__own_goods',
    family: 'third_party',
    displayName: 'Motor Protect Extra (Own Goods)',
    shortName: 'MPE · Own Goods',
    slug: 'mpe-own-goods',
    description: 'Commercial vehicles carrying your own goods.',
    basePremium: 40_000,
    allowedPlans: ['ANNUAL'],
    classSelectable: false,
    presetClass: 'commercial_motor',
    benefits: [
      'Third-party property damage: ₦5,000,000',
      'Third-party bodily injury & death: Unlimited',
      'Accidental (own) damage involving third party: up to ₦500,000',
      'Towing of insured vehicle: ₦15,000',
      'Fire peril (excl. self-ignition): ₦500,000',
      'Windscreen damage involving third party: ₦50,000',
      'Free car wash up to ₦2,500',
      'Free ECOWAS Brown Card',
    ],
  },
}

export function findMotorVariant(id: MotorVariant | string | null | undefined): MotorVariantMeta | undefined {
  if (!id) return undefined
  return MOTOR_VARIANTS[id as MotorVariant]
}

export function findMotorVariantBySlug(slug: string): MotorVariantMeta | undefined {
  return Object.values(MOTOR_VARIANTS).find(v => v.slug === slug)
}

export function variantsForFamily(family: MotorPolicyFamily): MotorVariantMeta[] {
  return Object.values(MOTOR_VARIANTS).filter(v => v.family === family)
}

/** Variant `displayName` used as the `variance` payload field on API calls. */
export function variantVariance(variant: MotorVariant): string {
  return MOTOR_VARIANTS[variant].displayName
}

/**
 * Map a `variance` string from an API response back to its family. Matching
 * is case-insensitive against the registry's `displayName` values.
 * Returns null if the string doesn't match any known variant.
 */
export function familyForVariance(variance: string | null | undefined): MotorPolicyFamily | null {
  if (!variance) return null
  const target = variance.toLowerCase()
  for (const meta of Object.values(MOTOR_VARIANTS)) {
    if (meta.displayName.toLowerCase() === target) return meta.family
  }
  return null
}

const CURRENT_YEAR = new Date().getFullYear()

export function yearOfMakeOptions(): number[] {
  const arr: number[] = []
  for (let y = CURRENT_YEAR; y >= 1990; y--) arr.push(y)
  return arr
}
