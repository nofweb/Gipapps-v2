import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Receipt,
  RefreshCcw,
  LifeBuoy,
  Settings,
  Wrench,
  FileCheck2,
  CreditCard,
  ArrowLeftRight,
  Wallet,
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

export interface SidebarChild {
  label: string
  to: string
  badge?: string | number
}

export interface SidebarSection {
  heading?: string
  items: SidebarItem[]
}

const SHARED_BOTTOM: SidebarSection = {
  heading: 'Account',
  items: [
    { label: 'Billing & invoices', icon: Receipt },
    { label: 'Support', icon: LifeBuoy },
    { label: 'Settings', icon: Settings },
  ],
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
            { label: 'Buy policy', to: '/motor/comprehensive/buy' },
            { label: 'Renew policy', to: '/motor/comprehensive/renew' },
          ],
        },
        {
          label: 'Third party',
          icon: FileText,
          children: [
            { label: 'My policies', to: '/motor/third-party/my-policies' },
            { label: 'Buy policy', to: '/motor/third-party/buy' },
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
        { label: 'Certificates', icon: FileCheck2, to: '/marine/certificates' },
        { label: 'Payments', icon: CreditCard, to: '/marine/payments' },
        { label: 'Claims', icon: Wrench, to: '/marine/claims' },
        { label: 'Transactions', icon: ArrowLeftRight, to: '/marine/transactions' },
        { label: 'Wallet', icon: Wallet, to: '/marine/wallet' },
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
    SHARED_BOTTOM,
  ],
}
