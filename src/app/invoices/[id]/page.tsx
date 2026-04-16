'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Invoice, LineItem, Payment } from '@/types'
import { formatGHS, formatDate } from '@/lib/ghana'
import { initiatePayment, recordPayment } from '@/lib/payments'

export default function InvoiceDetailPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'mobile_money' as 'mobile_money' | 'paystack' | 'hubtel' | 'bank_transfer' | 'cash',
    mobile_money_provider: 'mtn' as 'mtn' | 'vodafone' | 'airteltigo',
    mobile_money_number: '',
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

  async function handleOnlinePayment() {
    if (!invoice || !invoice.client) return

    setPaymentProcessing(true)
    try {
      const result = await initiatePayment({
        invoice,
        client: invoice.client,
        provider: paymentData.payment_method === 'hubtel' ? 'hubtel' : 'paystack',
        channel: paymentData.mobile_money_provider
      })

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        alert(result.error || 'Failed to initiate payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to initiate payment')
    } finally {
      setPaymentProcessing(false)
    }
  }

  async function handleRecordPayment() {
    if (!invoice) return

    try {
      await recordPayment(invoice.id, {
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        mobile_money_provider: paymentData.mobile_money_provider,
        mobile_money_number: paymentData.mobile_money_number,
        reference: paymentData.reference
      })

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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      paystack: 'Paystack',
      hubtel: 'Hubtel',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash'
    }
    return labels[method] || method
  }

  const getMobileMoneyLabel = (provider: string) => {
    const labels: Record<string, string> = {
      mtn: 'MTN',
      vodafone: 'Vodafone',
      airteltigo: 'AirtelTigo'
    }
    return labels[provider] || provider
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

      {invoice.gra_status === 'validated' && (
        <div className="card" style={{ marginBottom: '24px', background: 'var(--success-bg)', borderColor: 'var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--success)' }}>GRA E-VAT Validated</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Validation ID: {invoice.validation_id}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Client</h3>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>{invoice.client?.name}</div>
          {invoice.client?.company && <div style={{ color: 'var(--text-muted)' }}>{invoice.client.company}</div>}
          <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
            <div>{invoice.client?.email}</div>
            {invoice.client?.phone && <div>{invoice.client.phone}</div>}
            {invoice.client?.address && <div style={{ marginTop: '8px' }}>{invoice.client.address}</div>}
            {invoice.client?.tin && <div style={{ marginTop: '8px' }}>TIN: {invoice.client.tin}</div>}
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
              <div style={{ fontFamily: 'JetBrains Mono' }}>{formatGHS(invoice.subtotal)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Tax ({invoice.tax_rate}%)</div>
              <div style={{ fontFamily: 'JetBrains Mono' }}>{formatGHS(invoice.tax_amount)}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '600' }}>
            <span>Total</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{formatGHS(invoice.total)}</span>
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
                <td style={{ fontFamily: 'JetBrains Mono' }}>{formatGHS(item.unit_price)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono' }}>{formatGHS(item.amount)}</td>
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
                  <td>
                    {getPaymentMethodLabel(payment.payment_method || '')}
                    {payment.mobile_money_provider && ` (${getMobileMoneyLabel(payment.mobile_money_provider)})`}
                  </td>
                  <td>{payment.reference || payment.transaction_id || '-'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>
                    {formatGHS(payment.amount)}
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
              <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>{formatGHS(totalPaid)}</div>
            </div>
            {remaining > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)' }}>Remaining</div>
                <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--danger)' }}>{formatGHS(remaining)}</div>
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
                <label className="label">Payment Type</label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button
                    className={`btn ${paymentData.payment_method === 'paystack' || paymentData.payment_method === 'hubtel' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentData({ ...paymentData, payment_method: 'paystack' })}
                  >
                    Pay Online
                  </button>
                  <button
                    className={`btn ${paymentData.payment_method === 'mobile_money' || paymentData.payment_method === 'bank_transfer' || paymentData.payment_method === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentData({ ...paymentData, payment_method: 'bank_transfer' })}
                  >
                    Record Manual
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Amount ({formatGHS(0)})</label>
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

              {(paymentData.payment_method === 'mobile_money' || paymentData.payment_method === 'paystack' || paymentData.payment_method === 'hubtel') && (
                <>
                  <div className="form-group">
                    <label className="label">Mobile Money Provider</label>
                    <select
                      className="input"
                      value={paymentData.mobile_money_provider}
                      onChange={(e) => setPaymentData({ ...paymentData, mobile_money_provider: e.target.value as 'mtn' | 'vodafone' | 'airteltigo' })}
                    >
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="vodafone">Vodafone Cash</option>
                      <option value="airteltigo">AirtelTigo Money</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Mobile Money Number</label>
                    <input
                      type="text"
                      className="input"
                      value={paymentData.mobile_money_number}
                      onChange={(e) => setPaymentData({ ...paymentData, mobile_money_number: e.target.value })}
                      placeholder="024XXXXXXXX"
                    />
                  </div>
                </>
              )}

              {(paymentData.payment_method === 'bank_transfer' || paymentData.payment_method === 'cash') && (
                <div className="form-group">
                  <label className="label">Payment Method</label>
                  <select
                    className="input"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value as 'bank_transfer' | 'cash' })}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="label">Reference</label>
                <input
                  type="text"
                  className="input"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="Transaction ID, receipt number, etc."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              {(paymentData.payment_method === 'paystack' || paymentData.payment_method === 'hubtel') ? (
                <button className="btn btn-primary" onClick={handleOnlinePayment} disabled={paymentProcessing}>
                  {paymentProcessing ? 'Processing...' : `Pay ${formatGHS(paymentData.amount)}`}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleRecordPayment}>
                  Record Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}