import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  RefreshCcw,
  FileCheck2,
  CreditCard,
  Quote,
  type LucideIcon,
} from 'lucide-vue-next'
import type { ProductId } from '~/types/product'

export interface SidebarItem {
  label: string
  icon: LucideIcon
  to?: string
  badge?: string | number
  active?: boolean
  /** When set, the item becomes an expandable group. */
  children?: SidebarChild[]
  /** Auto-expand group on render. */
  defaultOpen?: boolean
}

/**
 * A second-level entry. May either be a plain link or — when `children` is
 * provided — a nested expandable group.
 */
export interface SidebarChild {
  label: string
  to?: string
  badge?: string | number
  children?: SidebarChild[]
  defaultOpen?: boolean
}

export interface SidebarSection {
  heading?: string
  items: SidebarItem[]
}

export const SIDEBAR_BY_PRODUCT: Record<ProductId, SidebarSection[]> = {
  motor: [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/motor' },
        {
          label: 'Comprehensive',
          icon: ShieldCheck,
          defaultOpen: true,
          children: [
            { label: 'My policies', to: '/motor/comprehensive/my-policies' },
            { label: 'Buy Comprehensive', to: '/motor/comprehensive/buy' },
            { label: 'Buy EZ Drive', to: '/motor/ez-drive/buy' },
            { label: 'Buy EZ Drive Plus', to: '/motor/ez-drive-plus/buy' },
            { label: 'Buy EZ Drive Elite', to: '/motor/ez-drive-elite/buy' },
            { label: 'Renew policy', to: '/motor/comprehensive/renew' },
          ],
        },
        {
          label: 'Third party',
          icon: FileText,
          children: [
            { label: 'My policies', to: '/motor/third-party/my-policies' },
            { label: 'Buy Third Party', to: '/motor/third-party/buy' },
            { label: 'Buy MPE Private Motor', to: '/motor/mpe-private-motor/buy' },
            { label: 'Buy MPE Private Bus', to: '/motor/mpe-private-bus/buy' },
            { label: 'Buy MPE Own Goods', to: '/motor/mpe-own-goods/buy' },
            { label: 'Renew policy', to: '/motor/third-party/renew' },
          ],
        },
      ],
    },
  ],

  homeshield: [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/homeshield' },
        { label: 'My policies', icon: FileText, to: '/homeshield/my-policies' },
        { label: 'Buy policy', icon: ShieldCheck, to: '/homeshield/buy' },
        { label: 'Renew policy', icon: RefreshCcw, to: '/homeshield/renew' },
      ],
    },
  ],

  marine: [
    {
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/marine' },
        { label: 'My policies', icon: FileCheck2, to: '/marine/certificates' },
        { label: 'Payments', icon: CreditCard, to: '/marine/payments' },
        {
          label: 'Quotations',
          icon: Quote,
          children: [
            { label: 'All quotations', to: '/marine/quotations' },
            { label: 'Generate quotation', to: '/marine/quotations/generate' },
          ],
        },
      ],
    },
  ],
}
