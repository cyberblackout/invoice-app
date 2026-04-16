'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Invoice, Payment } from '@/types'
import { formatGHS } from '@/lib/ghana'
import { calculateRevenueMetrics, getPaymentInsights, getPaymentMethodStats, calculateDaysOverdue } from '@/lib/revenue'
import { formatPaymentReminder, formatNewInvoiceWhatsApp } from '@/lib/notifications'

interface RevenueDashboardProps {
  onSendWhatsApp?: (message: string, phone: string) => void
}

export default function RevenueDashboard({ onSendWhatsApp }: RevenueDashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [invoicesRes, paymentsRes] = await Promise.all([
      supabase.from('invoices').select('*, client:clients(*)').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('payment_date', { ascending: false })
    ])

    setInvoices(invoicesRes.data || [])
    setPayments(paymentsRes.data || [])
    setLoading(false)
  }

  const metrics = useMemo(() => calculateRevenueMetrics(invoices, payments), [invoices, payments])
  const insights = useMemo(() => getPaymentInsights(metrics), [metrics])
  const methodStats = useMemo(() => getPaymentMethodStats(payments), [payments])

  const overdueInvoices = useMemo(() =>
    invoices.filter(i => i.status === 'overdue' || i.status === 'sent').sort((a, b) =>
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    ).slice(0, 5),
    [invoices]
  )

  const handleSendReminder = async (invoice: Invoice) => {
    if (!invoice.client?.phone) {
      alert('No phone number for this client')
      return
    }

    setSendingReminder(invoice.id)
    
    const daysOverdue = calculateDaysOverdue(invoice.due_date)
    const message = daysOverdue > 0
      ? formatPaymentReminder(invoice, daysOverdue)
      : formatNewInvoiceWhatsApp(invoice)

    if (onSendWhatsApp) {
      onSendWhatsApp(message, invoice.client.phone)
    } else {
      const whatsappUrl = `https://wa.me/${invoice.client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    }

    setSendingReminder(null)
  }

  const handleSendBulkReminders = () => {
    overdueInvoices.forEach(invoice => {
      if (invoice.client?.phone) {
        handleSendReminder(invoice)
      }
    })
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue Optimization</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Track payments, send reminders, and maximize collections
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/invoices/new" className="btn btn-primary">
            + New Invoice
          </Link>
          {overdueInvoices.length > 0 && (
            <button className="btn btn-secondary" onClick={handleSendBulkReminders}>
              Send All Reminders ({overdueInvoices.length})
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card stat-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">Total Collected</span>
            <span className="stat-value">{formatGHS(metrics.totalRevenue)}</span>
            <span className="stat-trend stat-trend-up">{metrics.collectionRate.toFixed(0)}% collection rate</span>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{formatGHS(metrics.pendingAmount)}</span>
            <span className="stat-trend">{metrics.pendingInvoices} invoices</span>
          </div>
        </div>

        <div className="stat-card stat-overdue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <span className="stat-label">Overdue</span>
            <span className="stat-value">{formatGHS(metrics.overdueAmount)}</span>
            <span className="stat-trend stat-trend-down">{metrics.overdueInvoices} invoices</span>
          </div>
        </div>

        <div className="stat-card stat-clients">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">Avg Invoice</span>
            <span className="stat-value">{formatGHS(metrics.averageInvoiceValue)}</span>
            <span className="stat-trend">{metrics.totalInvoices} total</span>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>💡 Action Items</h3>
          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              No action needed. All payments are on track!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insights.map((insight, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: insight.type === 'success' ? 'var(--success-bg)' :
                      insight.type === 'warning' ? 'var(--warning-bg)' :
                        insight.type === 'alert' ? 'var(--danger-bg)' : 'var(--bg)',
                    borderLeft: `4px solid ${
                      insight.type === 'success' ? 'var(--success)' :
                        insight.type === 'warning' ? 'var(--warning)' :
                          insight.type === 'alert' ? 'var(--danger)' : 'var(--accent)'
                    }`
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{insight.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: insight.action ? '8px' : '0' }}>
                    {insight.description}
                  </div>
                  {insight.action && (
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ marginTop: '8px' }}
                    >
                      {insight.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>📱 Payment Methods</h3>
          {methodStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              No payments recorded yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {methodStats.map((stat, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{stat.method.replace('_', ' ')}</span>
                    <span style={{ fontWeight: '600' }}>{formatGHS(stat.total)}</span>
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${stat.percentage}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {stat.count} payments ({stat.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>⏰ Payment Follow-ups</h3>
          <Link href="/invoices?status=sent,overdue" className="btn btn-ghost btn-sm">
            View All →
          </Link>
        </div>

        {overdueInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>All caught up!</div>
            <div>No pending or overdue invoices</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {overdueInvoices.map((invoice) => {
                const daysOverdue = calculateDaysOverdue(invoice.due_date)
                const isOverdue = daysOverdue > 0

                return (
                  <tr key={invoice.id}>
                    <td>
                      <Link href={`/invoices/${invoice.id}`} style={{ color: 'var(--accent)', fontWeight: '500' }}>
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td>{invoice.client?.name || 'Unknown'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: '600' }}>{formatGHS(invoice.total)}</td>
                    <td>
                      <div>{new Date(invoice.due_date).toLocaleDateString('en-GH')}</div>
                      {isOverdue && (
                        <div style={{ fontSize: '12px', color: 'var(--danger)' }}>
                          {daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleSendReminder(invoice)}
                          disabled={sendingReminder === invoice.id}
                        >
                          {sendingReminder === invoice.id ? 'Sending...' : '📱 Reminder'}
                        </button>
                        <Link href={`/invoices/${invoice.id}`} className="btn btn-ghost btn-sm">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px', background: 'linear-gradient(135deg, var(--accent), #ff7b93)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '8px' }}>💡 Pro Tip: Send WhatsApp Reminders</h3>
            <p style={{ opacity: 0.9 }}>
              Invoices with WhatsApp reminders are 3x more likely to be paid within 7 days.
            </p>
          </div>
          <Link href="/pricing" className="btn" style={{ background: 'white', color: 'var(--accent)' }}>
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  )
}
