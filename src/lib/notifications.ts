import { Invoice, Client } from '@/types'
import { formatGHS, formatDate } from './ghana'

export interface WhatsAppMessage {
  to: string
  message: string
}

export interface ReminderSettings {
  enabled: boolean
  daysBeforeDue: number[]
  daysAfterDue: number[]
  frequency: 'once' | 'daily' | 'weekly'
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  daysBeforeDue: [3, 1],
  daysAfterDue: [1, 3, 7],
  frequency: 'daily'
}

export function formatInvoiceForWhatsApp(invoice: Invoice): string {
  const client = invoice.client
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  
  return `*INVOICE* 📄

Kofi, 

Invoice No: *${invoice.invoice_number}*
Amount: *${formatGHS(invoice.total)}*
Due Date: ${dueDate}

Please arrange payment.

Pay now: [Payment Link]

Thank you for your business!
Cyber InvoiceFlow 🇬🇭`
}

export function formatPaymentReminder(invoice: Invoice, daysOverdue: number): string {
  const client = invoice.client
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  
  if (daysOverdue > 0) {
    return `*PAYMENT REMINDER* ⏰

Kofi,

This is a friendly reminder that invoice *${invoice.invoice_number}* of *${formatGHS(invoice.total)}* was due on ${dueDate}.

It's been ${daysOverdue} day(s) overdue.

Please arrange payment at your earliest convenience.

Pay now: [Payment Link]

Thank you!
Cyber InvoiceFlow 🇬🇭`
  } else {
    return `*INVOICE REMINDER* 💰

Kofi,

Invoice *${invoice.invoice_number}* of *${formatGHS(invoice.total)}* is due on ${dueDate}.

Please ensure payment is made on time.

Pay now: [Payment Link]

Thank you!
Cyber InvoiceFlow 🇬🇭`
  }
}

export function formatPaymentConfirmation(invoice: Invoice, paymentAmount: number): string {
  return `*PAYMENT CONFIRMED* ✅

Thank you for your payment!

Invoice: ${invoice.invoice_number}
Amount Paid: ${formatGHS(paymentAmount)}
Status: PAID ✓

Transaction recorded in Cyber InvoiceFlow.

Thank you for your business!
Cyber InvoiceFlow 🇬🇭`
}

export function formatNewInvoiceWhatsApp(invoice: Invoice): string {
  const client = invoice.client
  const issueDate = formatDate(invoice.issue_date, 'en-GH')
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  
  let message = `*NEW INVOICE* 📄\n\n`
  message += `Dear ${client?.name},\n\n`
  message += `Invoice No: *${invoice.invoice_number}*\n`
  message += `Date: ${issueDate}\n`
  message += `Due Date: ${dueDate}\n`
  message += `Amount: *${formatGHS(invoice.total)}*\n\n`
  message += `Please find payment details below.\n\n`
  message += `Pay now: [Insert Payment Link]\n\n`
  message += `Thank you for your business!\n`
  message += `Cyber InvoiceFlow 🇬🇭`
  
  return message
}

export function validatePhoneNumber(phone: string): { valid: boolean; formatted: string } {
  let cleaned = phone.replace(/[^0-9]/g, '')
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '233' + cleaned.substring(1)
  }
  
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    return { valid: true, formatted: cleaned }
  }
  
  return { valid: false, formatted: cleaned }
}

export function formatPhoneForWhatsApp(phone: string): string {
  const { valid, formatted } = validatePhoneNumber(phone)
  return valid ? `${formatted}@c.us` : ''
}

export interface NotificationTemplate {
  type: 'invoice' | 'reminder' | 'payment' | 'overdue'
  subject: string
  body: (data: Record<string, unknown>) => string
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    type: 'invoice',
    subject: 'New Invoice from {{businessName}}',
    body: () => ''
  },
  {
    type: 'reminder',
    subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
    body: () => ''
  },
  {
    type: 'payment',
    subject: 'Payment Confirmed - Invoice {{invoiceNumber}}',
    body: () => ''
  },
  {
    type: 'overdue',
    subject: 'URGENT: Overdue Invoice {{invoiceNumber}}',
    body: () => ''
  }
]
