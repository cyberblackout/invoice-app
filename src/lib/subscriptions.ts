export type SubscriptionTier = 'free' | 'pro' | 'business'

export interface SubscriptionPlan {
  id: SubscriptionTier
  name: string
  price: number
  period: string
  features: string[]
  transactionFee: number
  maxInvoices: number
  maxClients: number
  whatsappEnabled: boolean
  graEnabled: boolean
  multiUser: boolean
  analyticsEnabled: boolean
  apiAccess: boolean
  supportPriority: 'none' | 'email' | 'phone'
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      '5 invoices per month',
      '10 clients',
      'Basic invoice templates',
      'GHS currency only',
      'Email support'
    ],
    transactionFee: 0,
    maxInvoices: 5,
    maxClients: 10,
    whatsappEnabled: false,
    graEnabled: false,
    multiUser: false,
    analyticsEnabled: false,
    apiAccess: false,
    supportPriority: 'email'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'month',
    features: [
      'Unlimited invoices',
      'Unlimited clients',
      'WhatsApp invoice sending',
      'Auto payment reminders',
      'GRA E-VAT compliance',
      'QR code invoices',
      'Mobile money payments',
      'Revenue analytics',
      'Priority email support',
      'No transaction fees'
    ],
    transactionFee: 0,
    maxInvoices: -1,
    maxClients: -1,
    whatsappEnabled: true,
    graEnabled: true,
    multiUser: false,
    analyticsEnabled: true,
    apiAccess: false,
    supportPriority: 'email'
  },
  {
    id: 'business',
    name: 'Business',
    price: 149,
    period: 'month',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'API access',
      'Custom branding',
      'Inventory management',
      'Smart debt collection',
      'Bulk WhatsApp marketing',
      'Import/Export tools',
      'Phone support',
      'Onboarding assistance'
    ],
    transactionFee: 0,
    maxInvoices: -1,
    maxClients: -1,
    whatsappEnabled: true,
    graEnabled: true,
    multiUser: true,
    analyticsEnabled: true,
    apiAccess: true,
    supportPriority: 'phone'
  }
]

export function getPlanById(id: SubscriptionTier): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id)
}

export function canUseFeature(plan: SubscriptionTier, feature: keyof SubscriptionPlan): boolean {
  const currentPlan = getPlanById(plan)
  if (!currentPlan) return false
  
  const featureMap: Record<string, SubscriptionTier> = {
    whatsappEnabled: 'pro',
    graEnabled: 'pro',
    multiUser: 'business',
    analyticsEnabled: 'pro',
    apiAccess: 'business'
  }
  
  const requiredPlan = featureMap[feature]
  if (!requiredPlan) return true
  
  const planOrder: SubscriptionTier[] = ['free', 'pro', 'business']
  return planOrder.indexOf(plan) >= planOrder.indexOf(requiredPlan)
}

export function getUsageLimits(plan: SubscriptionTier): { invoices: number; clients: number } {
  const currentPlan = getPlanById(plan)
  if (!currentPlan) return { invoices: 5, clients: 10 }
  return { invoices: currentPlan.maxInvoices, clients: currentPlan.maxClients }
}

export function calculateTransactionFee(amount: number, plan: SubscriptionTier): number {
  const currentPlan = getPlanById(plan)
  if (!currentPlan) return amount * 0.015
  
  if (currentPlan.transactionFee === 0) return 0
  return amount * (currentPlan.transactionFee / 100)
}
