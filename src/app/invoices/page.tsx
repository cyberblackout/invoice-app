'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatGHS, formatDate } from '@/lib/ghana'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('*, client:clients(name)')
      .order('created_at', { ascending: false })

    setInvoices(data || [])
    setLoading(false)
  }

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
        <h1 className="page-title">Invoices</h1>
        <Link href="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
      </div>

      <div className="card">
        {!invoices || invoices.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <h3 style={{ marginBottom: '8px', marginTop: '16px' }}>No invoices yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Create your first invoice to get started</p>
            <Link href="/invoices/new" className="btn btn-primary">Create Invoice</Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link href={`/invoices/${invoice.id}`} style={{ color: 'var(--accent)', fontWeight: '500' }}>
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td>{invoice.client?.name || 'Unknown'}</td>
                  <td>{formatDate(invoice.issue_date)}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{formatGHS(invoice.total)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/invoices/${invoice.id}`} className="btn btn-ghost btn-sm">View</Link>
                      <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}