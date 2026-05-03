export type HomeshieldCategoryId = 'Category A' | 'Category B'

export interface HomeshieldCategoryMeta {
  id: HomeshieldCategoryId
  label: string
  rangeLabel: string
  minValue: number
  maxValue: number
  premium: number
  benefits: string[]
}

export const HOMESHIELD_CATEGORIES: HomeshieldCategoryMeta[] = [
  {
    id: 'Category A',
    label: 'Category A',
    rangeLabel: 'Asset Value up to ₦25,000,000',
    minValue: 0,
    maxValue: 25_000_000,
    premium: 35_000,
    benefits: [
      'Partial damage limits up to ₦200,000',
      'Replacement of household fixtures up to ₦2,000,000',
      'Personal items cover up to ₦1,000,000',
      'Alternative accommodation up to ₦200,000',
      'Personal accident cover up to ₦100,000',
      'Public liability cover up to ₦100,000',
    ],
  },
  {
    id: 'Category B',
    label: 'Category B',
    rangeLabel: 'Asset Value from ₦25,000,001 to ₦50,000,000',
    minValue: 25_000_001,
    maxValue: 50_000_000,
    premium: 70_000,
    benefits: [
      'Partial damage limits up to ₦400,000',
      'Replacement of household fixtures up to ₦4,000,000',
      'Personal items cover up to ₦2,000,000',
      'Alternative accommodation up to ₦500,000',
      'Personal accident cover up to ₦200,000',
      'Public liability cover up to ₦200,000',
    ],
  },
]

export function findCategory(id: HomeshieldCategoryId | null | undefined) {
  return HOMESHIELD_CATEGORIES.find(c => c.id === id)
}

export interface QuestionnaireQuestion {
  id: number
  text: string
  /** When true, a `details` answer is required when the user answers "yes". */
  requiresDetails: boolean
}

export const HOMESHIELD_QUESTIONS: QuestionnaireQuestion[] = [
  { id: 1, text: 'Is any portion of the residence let out as an apartment or to paying guests?', requiresDetails: true },
  { id: 2, text: 'Is any portion of the out-building let out to other tenants?', requiresDetails: true },
  { id: 3, text: 'Is any portion of the building occupied for purposes other than domestic use?', requiresDetails: true },
  { id: 4, text: 'Is any portion of the external walls constructed using materials other than brick, stone, or concrete?', requiresDetails: true },
  { id: 5, text: 'Is any portion of the roof constructed using materials other than slate, tiles, concrete, metal, or asbestos?', requiresDetails: true },
  { id: 6, text: 'Will the premises be left unoccupied at any time?', requiresDetails: true },
  { id: 7, text: 'Are all buildings in good repair and will they continue to be properly maintained?', requiresDetails: false },
  { id: 8, text: 'Do you currently have an All Risks Policy covering valuables?', requiresDetails: true },
  { id: 9, text: 'Are you currently, or have you previously been, insured against any of the perils specified in this proposal?', requiresDetails: true },
  { id: 10, text: 'Have you ever suffered any loss arising from any of the perils specified in this proposal?', requiresDetails: true },
  { id: 11, text: 'Has any insurance company ever declined your proposal, cancelled your insurance, or refused to continue your insurance?', requiresDetails: true },
  { id: 12, text: 'Is this proposal intended to replace any existing policy with this company or any other insurance company?', requiresDetails: true },
]

export const PROPERTY_KINDS = ['Dwelling House', 'Flat', 'Service Flat', 'Duplex', 'Bungalow']
