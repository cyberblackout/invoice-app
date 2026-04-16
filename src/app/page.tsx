'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Invoice, Client, Payment } from '@/types'
import styles from './page.module.css'

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

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/clients" className="btn btn-secondary">+ Add Client</Link>
          <Link href="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(pendingAmount)}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{overdueCount}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{clients.length}</div>
          <div className="stat-label">Active Clients</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Invoices</h3>
            <Link href="/invoices" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {invoices.length === 0 ? (
            <div className="empty-state">
              <p>No invoices yet</p>
              <Link href="/invoices/new" className="btn btn-primary" style={{ marginTop: '16px' }}>Create Invoice</Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link href={`/invoices/${invoice.id}`} style={{ color: 'var(--accent)', fontWeight: '500' }}>
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td>{invoice.client?.name || 'Unknown'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(invoice.total)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Payments</h3>
            <Link href="/payments" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {payments.length === 0 ? (
            <div className="empty-state">
              <p>No payments recorded</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>{payment.invoice?.invoice_number || 'N/A'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}