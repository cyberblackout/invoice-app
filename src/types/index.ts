export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurringStatus = 'active' | 'paused'
export type GRAValidationStatus = 'pending' | 'validated' | 'rejected'
export type PaymentGateway = 'paystack' | 'hubtel' | 'bank_transfer' | 'cash' | 'mobile_money'
export type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airteltigo'

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  company?: string
  tin?: string
  vat_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface LineItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface GRACompliance {
  qr_code?: string
  digital_signature?: string
  validation_id?: string
  validated_at?: string
  gra_status: GRAValidationStatus
  tax_type: 'standard' | 'vat' | 'exempt'
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client?: Client
  status: InvoiceStatus
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes?: string
  qr_code?: string
  digital_signature?: string
  validation_id?: string
  validated_at?: string
  gra_status?: GRAValidationStatus
  tax_type?: 'standard' | 'vat' | 'exempt'
  line_items?: LineItem[]
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  invoice?: Invoice
  amount: number
  payment_date: string
  payment_method?: PaymentGateway
  mobile_money_provider?: MobileMoneyProvider
  mobile_money_number?: string
  reference?: string
  transaction_id?: string
  gateway_response?: Record<string, unknown>
  notes?: string
}

export interface RecurringInvoice {
  id: string
  client_id: string
  client?: Client
  frequency: RecurringFrequency
  status: RecurringStatus
  next_date: string
  line_items: LineItem[]
  created_at: string
}

export interface BusinessSettings {
  business_name: string
  business_address: string
  business_phone: string
  business_email: string
  tin: string
  vat_number: string
  gra_branch: string
}