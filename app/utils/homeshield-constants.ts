export type HomeshieldCategoryId = 'Category A' | 'Category B' | 'Category C'

export interface HomeshieldCategoryMeta {
  id: HomeshieldCategoryId
  label: string
  rangeLabel: string
  minValue: number
  maxValue: number
  premium: number
  benefits: string[]
  /**
   * True when there is no online premium — underwriting reviews the property and
   * quotes it off-line. Such a category takes no payment and asks no
   * questionnaire; the request is emailed to underwriting instead.
   */
  quotedByUnderwriting?: boolean
  /** Shown in place of the premium and benefit limits. */
  note?: string
  /** The `category` value the purchase API expects. */
  apiValue: string
}

export const HOMESHIELD_CATEGORIES: HomeshieldCategoryMeta[] = [
  {
    id: 'Category A',
    label: 'Category A',
    apiValue: 'Category A',
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
    apiValue: 'Category B',
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
  {
    id: 'Category C',
    label: 'Category C',
    apiValue: 'CATEGORY C',
    rangeLabel: 'Asset Value above ₦50,000,000',
    // Strictly above ₦50,000,000, with no upper limit.
    minValue: 50_000_001,
    maxValue: Number.POSITIVE_INFINITY,
    premium: 0,
    quotedByUnderwriting: true,
    note: 'Cover and premium are set by underwriting after they review the property.',
    benefits: [
      'Tailored protection for higher-value properties',
      "Cover based on the property's unique risk profile",
      'Personalized assessment by our underwriting team',
      'Flexible cover options based on requirements',
      'Dedicated support and expert guidance',
    ],
  },
]

/** Property value must be strictly greater than this to qualify for Category C. */
export const CATEGORY_C_MIN_EXCLUSIVE = 50_000_000

export function findCategory(id: HomeshieldCategoryId | null | undefined) {
  return HOMESHIELD_CATEGORIES.find(c => c.id === id)
}

export type YesNo = 'yes' | 'no'

/** One of the reasons a client may pick after answering "yes" to a question. */
export interface ReasonOption {
  id: number
  label: string
  /**
   * True when this reason ends the application outright — unlike `blockOn`,
   * which hands the risk to underwriting, a declined reason cannot be covered.
   */
  declines: boolean
}

export interface QuestionnaireQuestion {
  id: number
  text: string
  /** When true, a `details` answer is required when the user answers "yes". */
  requiresDetails: boolean
  /** Placeholder/label shown on the details field. */
  detailsPrompt?: string
  /** Answering with this value stops the application and refers the client to underwriting. */
  blockOn: YesNo | null
  /** Shown instead of the free-text details when the answer is "yes". */
  reasonOptions?: ReasonOption[]
}

/**
 * Why a previous insurer declined, cancelled, or refused to continue cover.
 * Only non-payment is acceptable — the rest cannot be written online.
 */
export const DECLINATURE_REASONS: ReasonOption[] = [
  { id: 1, label: "Non-payment of premium or at the policyholder's request.", declines: false },
  { id: 2, label: 'Misrepresentation, fraud, or breach of policy terms and conditions.', declines: true },
  { id: 3, label: 'Risk-related or claims-related reasons.', declines: true },
  { id: 4, label: 'Regulatory or legal reasons.', declines: true },
]

export const HOMESHIELD_QUESTIONS: QuestionnaireQuestion[] = [
  { id: 1, text: 'Is any portion of the residence let out as an apartment or to paying guests?', requiresDetails: false, blockOn: 'yes' },
  { id: 2, text: 'Is any portion of the out-building let out to other tenants?', requiresDetails: false, blockOn: 'yes' },
  { id: 3, text: 'Is any portion of the building occupied for purposes other than domestic use?', requiresDetails: false, blockOn: 'yes' },
  { id: 4, text: 'Is any portion of the external walls constructed using materials other than brick, stone, or concrete?', requiresDetails: false, blockOn: 'yes' },
  { id: 5, text: 'Is any portion of the roof constructed using materials other than slate, tiles, concrete, metal, or asbestos?', requiresDetails: false, blockOn: 'yes' },
  { id: 6, text: 'Will the premises be left unoccupied at any time?', requiresDetails: true, detailsPrompt: 'State the period', blockOn: null },
  { id: 7, text: 'Are all buildings in good repair and will they continue to be properly maintained?', requiresDetails: true, blockOn: 'no' },
  { id: 8, text: 'Do you currently have an All Risks Policy covering valuables?', requiresDetails: true, blockOn: null },
  { id: 10, text: 'Have you ever suffered any loss arising from any of the perils specified in this proposal?', requiresDetails: true, blockOn: null },
  { id: 11, text: 'Has any insurance company ever declined your proposal, cancelled your insurance, or refused to continue your insurance?', requiresDetails: true, blockOn: null, reasonOptions: DECLINATURE_REASONS },
  { id: 12, text: 'Is this proposal intended to replace any existing policy with this company or any other insurance company?', requiresDetails: true, blockOn: null },
]

export type PropertyUsage = 'residential' | 'commercial'

/** Property types offered for each property usage. */
export const RESIDENTIAL_PROPERTY_KINDS = ['Flat', 'Bungalow']
export const COMMERCIAL_PROPERTY_KINDS = ['Office Building', 'School Building', 'Healthcare', 'Religion']
export const PROPERTY_KINDS = [...RESIDENTIAL_PROPERTY_KINDS, ...COMMERCIAL_PROPERTY_KINDS]

export function propertyKindsFor(usage: PropertyUsage | null | undefined): string[] {
  if (usage === 'residential') return RESIDENTIAL_PROPERTY_KINDS
  if (usage === 'commercial') return COMMERCIAL_PROPERTY_KINDS
  return []
}
