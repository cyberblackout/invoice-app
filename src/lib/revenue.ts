import { Invoice, Payment } from '@/types'

export interface RevenueMetrics {
  totalRevenue: number
  pendingAmount: number
  overdueAmount: number
  collectedAmount: number
  collectionRate: number
  averageInvoiceValue: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
}

export interface PaymentInsight {
  type: 'warning' | 'success' | 'opportunity' | 'alert'
  title: string
  description: string
  action?: string
  actionUrl?: string
}

export function calculateRevenueMetrics(invoices: Invoice[], payments: Payment[]): RevenueMetrics {
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const pendingInvoices = invoices.filter(i => i.status === 'sent')
  const overdueInvoices = invoices.filter(i => i.status === 'overdue')

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0)
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0)
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.total, 0)
  const collectedAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0)
  const collectionRate = totalInvoiced > 0 ? (totalRevenue / totalInvoiced) * 100 : 0
  const averageInvoiceValue = invoices.length > 0 ? totalInvoiced / invoices.length : 0

  return {
    totalRevenue,
    pendingAmount,
    overdueAmount,
    collectedAmount,
    collectionRate,
    averageInvoiceValue,
    totalInvoices: invoices.length,
    paidInvoices: paidInvoices.length,
    pendingInvoices: pendingInvoices.length,
    overdueInvoices: overdueInvoices.length
  }
}

export function getPaymentInsights(metrics: RevenueMetrics): PaymentInsight[] {
  const insights: PaymentInsight[] = []

  if (metrics.collectionRate < 50) {
    insights.push({
      type: 'warning',
      title: 'Low Collection Rate',
      description: `Only ${metrics.collectionRate.toFixed(0)}% of invoices are being paid. Consider sending payment reminders.`,
      action: 'Send Reminders',
      actionUrl: '/invoices?status=sent,overdue'
    })
  }

  if (metrics.overdueInvoices > 0) {
    insights.push({
      type: 'alert',
      title: `${metrics.overdueInvoices} Overdue Invoice${metrics.overdueInvoices > 1 ? 's' : ''}`,
      description: `GHS ${metrics.overdueAmount.toLocaleString()} is past due. Take action to collect.`,
      action: 'View Overdue',
      actionUrl: '/invoices?status=overdue'
    })
  }

  if (metrics.pendingInvoices > 0) {
    insights.push({
      type: 'opportunity',
      title: `${metrics.pendingInvoices} Pending Invoice${metrics.pendingInvoices > 1 ? 's' : ''}`,
      description: `GHS ${metrics.pendingAmount.toLocaleString()} awaiting payment. Send WhatsApp reminders.`,
      action: 'Send Reminders'
    })
  }

  if (metrics.collectionRate >= 80) {
    insights.push({
      type: 'success',
      title: 'Excellent Collection Rate!',
      description: `${metrics.collectionRate.toFixed(0)}% collection rate. Your payment processes are working well.`
    })
  }

  return insights
}

export function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function shouldSendReminder(
  invoice: Invoice,
  lastReminderDate?: string,
  settings?: { enabled: boolean; daysBeforeDue: number[]; daysAfterDue: number[] }
): { shouldSend: boolean; type: 'before' | 'after' | null; daysUntil: number } {
  if (!settings?.enabled) return { shouldSend: false, type: null, daysUntil: 0 }
  if (invoice.status === 'paid') return { shouldSend: false, type: null, daysUntil: 0 }

  const dueDate = new Date(invoice.due_date)
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (daysUntil > 0 && settings.daysBeforeDue.includes(daysUntil)) {
    return { shouldSend: true, type: 'before', daysUntil }
  }

  if (daysUntil < 0 && settings.daysAfterDue.includes(Math.abs(daysUntil))) {
    return { shouldSend: true, type: 'after', daysUntil: Math.abs(daysUntil) }
  }

  return { shouldSend: false, type: null, daysUntil }
}

export function calculateTransactionRevenue(
  totalCollected: number,
  transactionFee: number = 0
): { gross: number; fees: number; net: number } {
  const fees = totalCollected * transactionFee
  const net = totalCollected - fees
  return { gross: totalCollected, fees, net }
}

export function getRevenueForecast(
  invoices: Invoice[],
  months: number = 3
): { month: string; expected: number; confidence: number }[] {
  const forecast: { month: string; expected: number; confidence: number }[] = []
  const now = new Date()

  for (let i = 1; i <= months; i++) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthName = targetMonth.toLocaleDateString('en-GH', { month: 'short', year: '2-digit' })

    const pendingDue = invoices
      .filter(inv => {
        const invMonth = new Date(inv.due_date).getMonth()
        const invYear = new Date(inv.due_date).getFullYear()
        return invMonth === targetMonth.getMonth() && invYear === targetMonth.getFullYear()
      })
      .reduce((sum, inv) => sum + inv.total, 0)

    forecast.push({
      month: monthName,
      expected: pendingDue,
      confidence: Math.max(0.3, 1 - (i * 0.2))
    })
  }

  return forecast
}

export interface PaymentMethodStats {
  method: string
  count: number
  total: number
  percentage: number
}

export function getPaymentMethodStats(payments: Payment[]): PaymentMethodStats[] {
  const methodTotals: Record<string, { count: number; total: number }> = {}
  const total = payments.reduce((sum, p) => sum + p.amount, 0)

  payments.forEach(payment => {
    const method = payment.payment_method || 'unknown'
    if (!methodTotals[method]) {
      methodTotals[method] = { count: 0, total: 0 }
    }
    methodTotals[method].count++
    methodTotals[method].total += payment.amount
  })

  return Object.entries(methodTotals)
    .map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: total > 0 ? (data.total / total) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)
}
