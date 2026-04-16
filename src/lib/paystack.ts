export interface PaystackInitializePayment {
  email: string
  amount: number
  currency?: 'GHS' | 'USD' | 'NGN'
  reference?: string
  callback_url?: string
  metadata?: Record<string, unknown>
}

export interface PaystackTransaction {
  id: number
  domain: string
  status: 'abandoned' | 'cancelled' | 'created' | 'failed' | 'pending' | 'processing' | 'success'
  reference: string
  amount: number
  currency: string
  fees: number
  channel: string
  created_at: string
  metadata: Record<string, unknown>
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: PaystackTransaction
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''

export async function initializePaystackPayment(params: PaystackInitializePayment): Promise<{
  success: boolean
  data?: { authorization_url: string; reference: string }
  error?: string
}> {
  try {
    const reference = params.reference || `INV-${Date.now()}`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount * 100,
        currency: params.currency || 'GHS',
        reference,
        callback_url: params.callback_url,
        metadata: params.metadata
      })
    })

    const data = await response.json()

    if (data.status) {
      return {
        success: true,
        data: {
          authorization_url: data.data.authorization_url,
          reference: data.data.reference
        }
      }
    }

    return { success: false, error: data.message }
  } catch (error) {
    console.error('Paystack initialization error:', error)
    return { success: false, error: 'Failed to initialize payment' }
  }
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    })

    return await response.json()
  } catch (error) {
    console.error('Paystack verification error:', error)
    return { status: false, message: 'Verification failed', data: null as unknown as PaystackTransaction }
  }
}

export { PAYSTACK_PUBLIC_KEY }
