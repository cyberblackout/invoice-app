export interface HubtelPaymentRequest {
  amount: number
  description: string
  clientId: string
  clientName: string
  clientEmail: string
  channel: 'mtn' | 'vodafone' | 'airteltigo' | 'card'
  callbackUrl?: string
  reference?: string
}

export interface HubtelPaymentResponse {
  status: boolean
  code: string
  message: string
  data?: {
    checkoutId: string
    checkoutUrl: string
    merchantReference: string
  }
}

export interface HubtelAccountInfo {
  status: boolean
  name: string
  isActive: boolean
  merchantId: string
}

const HUBTEL_MERCHANT_ACCOUNT_NUMBER = process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER || ''
const HUBTEL_MERCHANT_API_KEY = process.env.HUBTEL_MERCHANT_API_KEY || ''

function getBasicAuth(): string {
  const credentials = Buffer.from(`${HUBTEL_MERCHANT_ACCOUNT_NUMBER}:${HUBTEL_MERCHANT_API_KEY}`).toString('base64')
  return `Basic ${credentials}`
}

export async function initiateHubtelPayment(request: HubtelPaymentRequest): Promise<HubtelPaymentResponse> {
  try {
    const reference = request.reference || `INV-${Date.now()}`

    const payload = {
      totalAmount: request.amount,
      description: request.description,
      callbacks: request.callbackUrl ? [{ url: request.callbackUrl }] : [],
      merchantBillId: reference,
      channels: [mapChannelToHubtel(request.channel)],
      client: {
        name: request.clientName,
        email: request.clientEmail,
        phone: request.clientId
      }
    }

    const response = await fetch('https://api.hubtel.com/v2/merchant/online/invoice/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getBasicAuth()
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.status === true || data.code === '00') {
      return {
        status: true,
        code: '00',
        message: 'Payment initiated successfully',
        data: {
          checkoutId: data.checkoutId || data.data?.checkoutId,
          checkoutUrl: data.checkoutUrl || data.data?.checkoutUrl,
          merchantReference: reference
        }
      }
    }

    return {
      status: false,
      code: data.code || '99',
      message: data.message || 'Failed to initiate payment'
    }
  } catch (error) {
    console.error('Hubtel payment error:', error)
    return { status: false, code: '99', message: 'Failed to initiate Hubtel payment' }
  }
}

export async function verifyHubtelPayment(checkoutId: string): Promise<{
  success: boolean
  data?: {
    status: string
    amount: number
    customerName: string
    createdAt: string
  }
  error?: string
}> {
  try {
    const response = await fetch(`https://api.hubtel.com/v2/merchant/online/invoice/checkout/${checkoutId}/status`, {
      headers: {
        Authorization: getBasicAuth()
      }
    })

    const data = await response.json()

    if (data.status === 'completed' || data.data?.status === 'completed') {
      return {
        success: true,
        data: {
          status: data.data?.status || data.status,
          amount: data.data?.totalAmount || data.totalAmount,
          customerName: data.data?.customer?.name || 'N/A',
          createdAt: data.data?.createdAt || new Date().toISOString()
        }
      }
    }

    return { success: false, error: 'Payment not completed' }
  } catch (error) {
    console.error('Hubtel verification error:', error)
    return { success: false, error: 'Failed to verify payment' }
  }
}

function mapChannelToHubtel(channel: string): string {
  const channelMap: Record<string, string> = {
    mtn: 'mtn-gh',
    vodafone: 'vodafone-gh',
    airteltigo: 'airteltigo-gh',
    card: 'card'
  }
  return channelMap[channel] || channel
}

export { HUBTEL_MERCHANT_ACCOUNT_NUMBER }
