'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Payment } from '@/types'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    const { data } = await supabase
      .from('payments')
      .select('*, invoice:invoices(invoice_number, client:clients(name))')
      .order('payment_date', { ascending: false })
    
    setPayments(data || [])
    setLoading(false)
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  const filteredPayments = payments.filter(p => {
    if (dateFrom && p.payment_date < dateFrom) return false
    if (dateTo && p.payment_date > dateTo) return false
    return true
  })

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalAmount)}</div>
          <div className="stat-label">Total Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{payments.length}</div>
          <div className="stat-label">Total Payments</div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
          <div>
            <label className="label">From</label>
            <input 
              type="date" 
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input 
              type="date" 
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
            <h3 style={{ marginBottom: '8px', marginTop: '16px' }}>No payments found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Record payments from your invoices</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Client</th>
                <th>Method</th>
                <th>Reference</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.payment_date)}</td>
                  <td>{(payment.invoice as any)?.invoice_number || 'N/A'}</td>
                  <td>{(payment.invoice as any)?.client?.name || 'Unknown'}</td>
                  <td>{payment.payment_method || '-'}</td>
                  <td>{payment.reference || '-'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>
                    {formatCurrency(payment.amount)}
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