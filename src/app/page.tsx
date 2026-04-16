'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Invoice, Client, Payment } from '@/types'
import { formatGHS, formatDate } from '@/lib/ghana'

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [invoicesRes, clientsRes, paymentsRes] = await Promise.all([
      supabase.from('invoices').select('*, client:clients(*), line_items(*)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
      supabase.from('payments').select('*, invoice:invoices(*)').order('payment_date', { ascending: false })
    ])

    setInvoices(invoicesRes.data || [])
    setClients(clientsRes.data || [])
    setPayments(paymentsRes.data || [])
    setLoading(false)
  }

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  const pendingAmount = invoices
    .filter(i => i.status === 'sent')
    .reduce((sum, i) => sum + i.total, 0)

  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      draft: 'badge-draft',
      sent: 'badge-sent',
      paid: 'badge-paid',
      overdue: 'badge-overdue',
      cancelled: 'badge-cancelled'
    }
    return classes[status] || 'badge-draft'
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Welcome Back! 👋</h1>
            <p className="header-subtitle">Here&apos;s what&apos;s happening with your business today.</p>
          </div>
          <div className="header-actions">
            <Link href="/clients" className="action-btn action-btn-secondary">
              <span className="action-icon">👥</span>
              <div className="action-text">
                <span className="action-label">Add New</span>
                <span className="action-title">Client</span>
              </div>
            </Link>
            <Link href="/invoices/new" className="action-btn action-btn-primary">
              <span className="action-icon">📄</span>
              <div className="action-text">
                <span className="action-label">Create</span>
                <span className="action-title">Invoice</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">{formatGHS(totalRevenue)}</span>
            <span className="stat-trend stat-trend-up">↑ 12.5% from last month</span>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-label">Pending Payments</span>
            <span className="stat-value">{formatGHS(pendingAmount)}</span>
            <span className="stat-trend">Awaiting collection</span>
          </div>
        </div>

        <div className="stat-card stat-overdue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <span className="stat-label">Overdue Invoices</span>
            <span className="stat-value">{overdueCount}</span>
            <span className="stat-trend stat-trend-down">Needs attention</span>
          </div>
        </div>

        <div className="stat-card stat-clients">
          <div className="stat-icon">🤝</div>
          <div className="stat-content">
            <span className="stat-label">Active Clients</span>
            <span className="stat-value">{clients.length}</span>
            <span className="stat-trend">Total clients</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-card">
          <div className="card-header">
            <div className="card-title-section">
              <h3 className="card-title">📊 Recent Invoices</h3>
              <p className="card-subtitle">Your latest invoice activity</p>
            </div>
            <Link href="/invoices" className="view-all-btn">
              View All →
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">📋</div>
              <h4>No invoices yet</h4>
              <p>Create your first invoice to get started</p>
              <Link href="/invoices/new" className="btn btn-primary">Create Invoice</Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 6).map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <Link href={`/invoices/${invoice.id}`} className="invoice-link">
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="client-name">{invoice.client?.name || 'Unknown'}</td>
                      <td className="date">{formatDate(invoice.issue_date)}</td>
                      <td className="amount">{formatGHS(invoice.total)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/invoices/${invoice.id}`} className="action-link">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="content-card">
          <div className="card-header">
            <div className="card-title-section">
              <h3 className="card-title">💳 Recent Payments</h3>
              <p className="card-subtitle">Latest payment transactions</p>
            </div>
            <Link href="/payments" className="view-all-btn">
              View All →
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">💵</div>
              <h4>No payments yet</h4>
              <p>Payments will appear here when recorded</p>
            </div>
          ) : (
            <div className="payment-list">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-icon">✓</div>
                  <div className="payment-details">
                    <span className="payment-invoice">{payment.invoice?.invoice_number || 'N/A'}</span>
                    <span className="payment-date">{formatDate(payment.payment_date)}</span>
                  </div>
                  <div className="payment-amount">{formatGHS(payment.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h3 className="section-title">⚡ Quick Actions</h3>
        <div className="actions-grid">
          <Link href="/invoices/new" className="quick-action-card">
            <div className="quick-action-icon">📝</div>
            <span>New Invoice</span>
          </Link>
          <Link href="/clients" className="quick-action-card">
            <div className="quick-action-icon">👤</div>
            <span>Add Client</span>
          </Link>
          <Link href="/payments" className="quick-action-card">
            <div className="quick-action-icon">💰</div>
            <span>Record Payment</span>
          </Link>
          <Link href="/reports" className="quick-action-card">
            <div className="quick-action-icon">📈</div>
            <span>View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  )
}