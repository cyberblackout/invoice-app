export const CURRENCY = {
  CODE: 'GHS',
  SYMBOL: '₵',
  NAME: 'Ghana Cedis',
  LOCALE: 'en-GH'
} as const

export function formatGHS(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: CURRENCY.CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatDate(date: string | Date, locale: string = 'en-GH'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateLong(date: string | Date, locale: string = 'en-GH'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function generateGRAQRData(invoice: {
  invoice_number: string
  total: number
  issue_date: string
  tax_amount: number
  client_name: string
}): string {
  const data = {
    t: 'GRA',
    inv: invoice.invoice_number,
    dt: invoice.issue_date,
    amt: invoice.total.toFixed(2),
    tax: invoice.tax_amount.toFixed(2),
    gbt: invoice.tax_amount > 0 ? 'Y' : 'N',
    cnm: invoice.client_name.substring(0, 50),
    ver: '1.0'
  }
  return JSON.stringify(data)
}

export function generateDigitalSignature(payload: string): string {
  let hash = 0
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `GRA-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}-${Date.now().toString(16).toUpperCase()}`
}

export const GRA_TAX_RATES = {
  STANDARD: 15,
  VAT: 12.5,
  NHIL: 2.5,
  GETFL: 1,
  COVID_LEVY: 1,
  EXEMPT: 0
}

export function calculateGHS(amount: number, taxRate: number = GRA_TAX_RATES.VAT): {
  subtotal: number
  taxAmount: number
  total: number
} {
  const taxAmount = amount * (taxRate / 100)
  return {
    subtotal: amount,
    taxAmount,
    total: amount + taxAmount
  }
}
