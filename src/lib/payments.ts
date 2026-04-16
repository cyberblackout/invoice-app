import { initializePaystackPayment, verifyPaystackPayment } from './paystack'
import { initiateHubtelPayment, verifyHubtelPayment } from './hubtel'
import { Invoice, Client, Payment, PaymentGateway, MobileMoneyProvider } from '@/types'
import { supabase } from './supabase'

export type PaymentProvider = 'paystack' | 'hubtel'

export interface PaymentRequest {
  invoice: Invoice
  client: Client
  provider: PaymentProvider
  channel?: 'mtn' | 'vodafone' | 'airteltigo' | 'card'
  callbackUrl?: string
}

export interface PaymentResult {
  success: boolean
  checkoutUrl?: string
  transactionId?: string
  reference?: string
  error?: string
}

export async function initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
  const { invoice, client, provider, channel, callbackUrl } = request

  if (provider === 'paystack') {
    return await initiatePaystack(invoice, client, callbackUrl)
  } else if (provider === 'hubtel') {
    return await initiateHubtel(invoice, client, channel, callbackUrl)
  }

  return { success: false, error: 'Invalid payment provider' }
}

async function initiatePaystack(invoice: Invoice, client: Client, callbackUrl?: string) {
  const result = await initializePaystackPayment({
    email: client.email,
    amount: invoice.total,
    currency: 'GHS',
    reference: invoice.invoice_number,
    callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}?payment=success`,
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_name: client.name
    }
  })

  if (result.success && result.data) {
    return {
      success: true,
      checkoutUrl: result.data.authorization_url,
      reference: result.data.reference
    }
  }

  return { success: false, error: result.error }
}

async function initiateHubtel(invoice: Invoice, client: Client, channel?: string, callbackUrl?: string) {
  const result = await initiateHubtelPayment({
    amount: invoice.total,
    description: `Invoice ${invoice.invoice_number}`,
    clientId: client.phone || '0000000000',
    clientName: client.name,
    clientEmail: client.email,
    channel: (channel as 'mtn') || 'mtn',
    callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}?payment=success`,
    reference: invoice.invoice_number
  })

  if (result.status && result.data) {
    return {
      success: true,
      checkoutUrl: result.data.checkoutUrl,
      transactionId: result.data.checkoutId,
      reference: result.data.merchantReference
    }
  }

  return { success: false, error: result.message }
}

export async function recordPayment(
  invoiceId: string,
  payment: Omit<Payment, 'id' | 'invoice_id'>
): Promise<{ success: boolean; payment?: Payment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        ...payment
      })
      .select()
      .single()

    if (error) throw error

    if (payment.amount >= 0) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('total')
        .eq('id', invoiceId)
        .single()

      if (invoice) {
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('invoice_id', invoiceId)

        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

        if (totalPaid >= invoice.total) {
          await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', invoiceId)
        }
      }
    }

    return { success: true, payment: data }
  } catch (error) {
    console.error('Error recording payment:', error)
    return { success: false, error: 'Failed to record payment' }
  }
}

export function getPaymentMethodLabel(method: PaymentGateway): string {
  const labels: Record<PaymentGateway, string> = {
    paystack: 'Paystack (Cards/Mobile Money)',
    hubtel: 'Hubtel (Mobile Money)',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    mobile_money: 'Mobile Money'
  }
  return labels[method] || method
}

export function getMobileMoneyLabel(provider: MobileMoneyProvider): string {
  const labels: Record<MobileMoneyProvider, string> = {
    mtn: 'MTN Mobile Money',
    vodafone: 'Vodafone Cash',
    airteltigo: 'AirtelTigo Money'
  }
  return labels[provider] || provider
}
