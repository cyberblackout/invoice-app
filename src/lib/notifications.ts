import { Invoice, Client, Payment } from '@/types'
import { formatGHS, formatDate } from './ghana'

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || ''
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WHATSAPP_PHONE_NUMBER = process.env.WHATSAPP_PHONE_NUMBER || ''

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM = process.env.SMTP_FROM || ''

export interface EmailNotification {
  to: string
  subject: string
  body: string
  html?: string
}

export interface WhatsAppNotification {
  to: string
  message: string
}

export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('Email not configured, skipping...')
    return false
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: notification.to,
        subject: notification.subject,
        body: notification.body,
        html: notification.html
      })
    })
    return response.ok
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export async function sendWhatsApp(notification: WhatsAppNotification): Promise<boolean> {
  if (!WHATSAPP_API_URL || !WHATSAPP_ACCESS_TOKEN) {
    console.log('WhatsApp not configured, skipping...')
    return false
  }

  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: notification.to,
        message: notification.message
      })
    })
    return response.ok
  } catch (error) {
    console.error('WhatsApp sending failed:', error)
    return false
  }
}

export function formatInvoiceEmail(invoice: Invoice, client: Client): EmailNotification {
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  
  return {
    to: client.email,
    subject: `Invoice ${invoice.invoice_number} - ${formatGHS(invoice.total)}`,
    body: `
Dear ${client.name},

Please find your invoice details below:

Invoice Number: ${invoice.invoice_number}
Amount Due: ${formatGHS(invoice.total)}
Due Date: ${dueDate}
Status: ${invoice.status.toUpperCase()}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Please arrange payment at your earliest convenience.

Thank you for your business!
Cyber InvoiceFlow - GRA E-VAT Compliant
    `.trim()
  }
}

export function formatPaymentEmail(invoice: Invoice, payment: Payment): EmailNotification {
  return {
    to: invoice.client?.email || '',
    subject: `Payment Confirmed - Invoice ${invoice.invoice_number}`,
    body: `
Dear ${invoice.client?.name},

Thank you! Your payment has been confirmed.

Invoice: ${invoice.invoice_number}
Amount Paid: ${formatGHS(payment.amount)}
Payment Date: ${formatDate(payment.payment_date, 'en-GH')}
Payment Method: ${payment.payment_method}

Your invoice is now marked as PAID.

Thank you for your business!
Cyber InvoiceFlow
    `.trim()
  }
}

export function formatInvoiceWhatsApp(invoice: Invoice, client: Client): WhatsAppNotification {
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  
  return {
    to: formatPhoneNumber(client.phone || ''),
    message: `*INVOICE* 📄

Dear ${client.name},

Invoice No: *${invoice.invoice_number}*
Amount: *${formatGHS(invoice.total)}*
Due Date: ${dueDate}

Please arrange payment.

Thank you!
Cyber InvoiceFlow 🇬🇭`
  }
}

export function formatPaymentWhatsApp(invoice: Invoice, payment: Payment): WhatsAppNotification {
  return {
    to: formatPhoneNumber(invoice.client?.phone || ''),
    message: `*PAYMENT CONFIRMED* ✅

Thank you for your payment!

Invoice: ${invoice.invoice_number}
Amount: ${formatGHS(payment.amount)}
Status: PAID ✓

Thank you!
Cyber InvoiceFlow 🇬🇭`
  }
}

export function formatReminderWhatsApp(invoice: Invoice, daysOverdue: number): WhatsAppNotification {
  const client = invoice.client
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  
  return {
    to: formatPhoneNumber(client?.phone || ''),
    message: daysOverdue > 0 
      ? `*PAYMENT REMINDER* ⏰

Dear ${client?.name},

Invoice *${invoice.invoice_number}* of *${formatGHS(invoice.total)}* was due on ${dueDate}.

${daysOverdue} day(s) overdue.

Please arrange payment at your earliest convenience.

Thank you!
Cyber InvoiceFlow 🇬🇭`
      : `*INVOICE REMINDER* 💰

Dear ${client?.name},

Invoice *${invoice.invoice_number}* of *${formatGHS(invoice.total)}* is due on ${dueDate}.

Please ensure payment is made on time.

Thank you!
Cyber InvoiceFlow 🇬🇭`
  }
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  let cleaned = phone.replace(/[^0-9]/g, '')
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '233' + cleaned.substring(1)
  }
  
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    return cleaned
  }
  
  return cleaned
}

export { formatPhoneNumber }

export function formatNewInvoiceWhatsApp(invoice: Invoice, client?: Client): string {
  const issueDate = formatDate(invoice.issue_date, 'en-GH')
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  const clientName = client?.name || invoice.client?.name || 'Customer'
  
  return `*NEW INVOICE* 📄

Dear ${clientName},

Invoice No: *${invoice.invoice_number}*
Date: ${issueDate}
Due Date: ${dueDate}
Amount: *${formatGHS(invoice.total)}*

Please find payment details below.

Thank you for your business!
Cyber InvoiceFlow 🇬🇭`
}

export function formatPaymentReminder(invoice: Invoice, daysOverdue: number): string {
  const client = invoice.client
  const dueDate = formatDate(invoice.due_date, 'en-GH')
  
  if (daysOverdue > 0) {
    return `*PAYMENT REMINDER* ⏰

Dear ${client?.name},

This is a friendly reminder that invoice *${invoice.invoice_number}* of *${formatGHS(invoice.total)}* was due on ${dueDate}.

It's been ${daysOverdue} day(s) overdue.

Please arrange payment at your earliest convenience.

Thank you!
Cyber InvoiceFlow 🇬🇭`
  } else {
    return `*INVOICE REMINDER* 💰

Dear ${client?.name},

Invoice *${invoice.invoice_number}* of *${formatGHS(invoice.total)}* is due on ${dueDate}.

Please ensure payment is made on time.

Thank you!
Cyber InvoiceFlow 🇬🇭`
  }
}

export async function sendInvoiceNotification(invoice: Invoice, client: Client): Promise<void> {
  const results = await Promise.allSettled([
    sendEmail(formatInvoiceEmail(invoice, client)),
    sendWhatsApp(formatInvoiceWhatsApp(invoice, client))
  ])
  
  console.log('Invoice notification results:', results)
}

export async function sendPaymentNotification(invoice: Invoice, payment: Payment): Promise<void> {
  if (!invoice.client) return

  const results = await Promise.allSettled([
    sendEmail(formatPaymentEmail(invoice, payment)),
    sendWhatsApp(formatPaymentWhatsApp(invoice, payment))
  ])
  
  console.log('Payment notification results:', results)
}