export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurringStatus = 'active' | 'paused'

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  company?: string
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
  payment_method?: string
  reference?: string
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