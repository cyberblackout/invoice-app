'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Invoice, LineItem, Payment } from '@/types'

export default function InvoiceDetailPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: ''
  })

  useEffect(() => {
    loadInvoice()
  }, [params.id])

  async function loadInvoice() {
    const [invoiceRes, paymentsRes] = await Promise.all([
      supabase.from('invoices').select('*, client:clients(*), line_items(*)').eq('id', params.id).single(),
      supabase.from('payments').select('*').eq('invoice_id', params.id).order('payment_date', { ascending: false })
    ])
    
    setInvoice(invoiceRes.data)
    setPayments(paymentsRes.data || [])
    if (invoiceRes.data) {
      setPaymentData({ ...paymentData, amount: invoiceRes.data.total })
    }
    setLoading(false)
  }

  async function handleMarkAsPaid() {
    if (!invoice) return
    
    try {
      await supabase.from('payments').insert({
        invoice_id: invoice.id,
        amount: invoice.total,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer'
      })
      
      await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id)
      
      setShowPaymentModal(false)
      loadInvoice()
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
    }
  }

  async function handleStatusChange(status: string) {
    if (!invoice) return
    
    await supabase.from('invoices').update({ status }).eq('id', invoice.id)
    loadInvoice()
  }

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

  if (!invoice) {
    return <div className="empty-state">Invoice not found</div>
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = invoice.total - totalPaid

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <Link href="/invoices" className="btn btn-ghost btn-sm" style={{ marginBottom: '8px' }}>← Back to Invoices</Link>
          <h1 className="page-title">{invoice.invoice_number}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className={`badge ${getStatusBadge(invoice.status)}`} style={{ fontSize: '14px', padding: '8px 16px' }}>
            {invoice.status}
          </span>
          {invoice.status !== 'paid' && (
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
              Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Client</h3>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>{invoice.client?.name}</div>
          {invoice.client?.company && <div style={{ color: 'var(--text-muted)' }}>{invoice.client.company}</div>}
          <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
            <div>{invoice.client?.email}</div>
            {invoice.client?.phone && <div>{invoice.client.phone}</div>}
            {invoice.client?.address && <div style={{ marginTop: '8px' }}>{invoice.client.address}</div>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Invoice Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Issue Date</div>
              <div>{formatDate(invoice.issue_date)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Due Date</div>
              <div>{formatDate(invoice.due_date)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Subtotal</div>
              <div style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(invoice.subtotal)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Tax ({invoice.tax_rate}%)</div>
              <div style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(invoice.tax_amount)}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '600' }}>
            <span>Total</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '20px' }}>Line Items</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items?.map((item: LineItem) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(item.unit_price)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoice.notes && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Notes</h3>
          <p style={{ color: 'var(--text-muted)' }}>{invoice.notes}</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Payment History</h3>
        {payments.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No payments recorded</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.payment_date)}</td>
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

        {payments.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Total Paid</div>
              <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>{formatCurrency(totalPaid)}</div>
            </div>
            {remaining > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)' }}>Remaining</div>
                <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--danger)' }}>{formatCurrency(remaining)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Amount</label>
                <input 
                  type="number" 
                  className="input"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="label">Payment Date</label>
                <input 
                  type="date" 
                  className="input"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Payment Method</label>
                <select 
                  className="input"
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Reference</label>
                <input 
                  type="text" 
                  className="input"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="Transaction ID, check number, etc."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMarkAsPaid}>Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}