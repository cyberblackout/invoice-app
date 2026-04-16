import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json()

    const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const WHATSAPP_PHONE_NUMBER = process.env.WHATSAPP_PHONE_NUMBER

    if (!WHATSAPP_API_URL || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER) {
      return NextResponse.json(
        { error: 'WhatsApp not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('WhatsApp API error:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}