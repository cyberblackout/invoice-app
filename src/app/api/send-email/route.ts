import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, subject, body, html } = await request.json()

    const SMTP_HOST = process.env.SMTP_HOST
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
    const SMTP_USER = process.env.SMTP_USER
    const SMTP_PASS = process.env.SMTP_PASS
    const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return NextResponse.json(
        { error: 'Email not configured' },
        { status: 500 }
      )
    }

    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    })

    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text: body,
      html: html || body.replace(/\n/g, '<br>')
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}