'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RecurringInvoice, Client, LineItem } from '@/types'

export default function RecurringPage() {
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    client_id: '',
    frequency: 'monthly',
    next_date: new Date().toISOString().split('T')[0],
    description: '',
    quantity: 1,
    unit_price: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [recurringRes, clientsRes] = await Promise.all([
      supabase.from('recurring_invoices').select('*, client:clients(*)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name')
    ])
    
    setRecurringInvoices(recurringRes.data || [])
    setClients(clientsRes.data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const lineItem = {
        description: formData.description,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        amount: formData.quantity * formData.unit_price
      }

      await supabase.from('recurring_invoices').insert({
        client_id: formData.client_id,
        frequency: formData.frequency,
        next_date: formData.next_date,
        line_items: [lineItem],
        status: 'active'
      })
      
      setShowModal(false)
      setFormData({
        client_id: '',
        frequency: 'monthly',
        next_date: new Date().toISOString().split('T')[0],
        description: '',
        quantity: 1,
        unit_price: 0
      })
      loadData()
    } catch (error) {
      console.error('Error creating recurring invoice:', error)
      alert('Failed to create recurring invoice')
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    await supabase.from('recurring_invoices').update({ status: newStatus }).eq('id', id)
    loadData()
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this recurring invoice?')) {
      await supabase.from('recurring_invoices').delete().eq('id', id)
      loadData()
    }
  }

  async function generateInvoice(recurring: RecurringInvoice) {
    try {
      const invoiceNumberRes = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let invoiceNumber = 'INV-0001'
      if (invoiceNumberRes.data) {
        const lastNumber = parseInt(invoiceNumberRes.data.invoice_number.replace('INV-', ''), 10)
        invoiceNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`
      }

      const items = recurring.line_items as unknown as LineItem[]
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0)

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: recurring.client_id,
          status: 'sent',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal,
          tax_rate: 0,
          tax_amount: 0,
          total: subtotal
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const lineItemsData = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount
      }))

      await supabase.from('line_items').insert(lineItemsData)

      const nextDate = getNextDate(recurring.next_date, recurring.frequency)
      await supabase.from('recurring_invoices').update({ next_date: nextDate }).eq('id', recurring.id)

      alert(`Invoice ${invoiceNumber} created successfully!`)
      loadData()
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('Failed to generate invoice')
    }
  }

  function getNextDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate)
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'quarterly':
        date.setMonth(date.getMonth() + 3)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date.toISOString().split('T')[0]
  }

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
        <h1 className="page-title">Recurring Invoices</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Recurring</button>
      </div>

      <div className="card">
        {recurringInvoices.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <h3 style={{ marginBottom: '8px', marginTop: '16px' }}>No recurring invoices</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Set up automatic invoice generation</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Recurring</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Frequency</th>
                <th>Next Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recurringInvoices.map((recurring) => {
                const items = recurring.line_items as unknown as LineItem[]
                const amount = items.reduce((sum, item) => sum + item.amount, 0)
                
                return (
                  <tr key={recurring.id}>
                    <td style={{ fontWeight: '500' }}>{recurring.client?.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{recurring.frequency}</td>
                    <td>{formatDate(recurring.next_date)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(amount)}</td>
                    <td>
                      <span className={`badge ${recurring.status === 'active' ? 'badge-paid' : 'badge-draft'}`}>
                        {recurring.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => generateInvoice(recurring)}>
                          Generate
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(recurring.id, recurring.status)}>
                          {recurring.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(recurring.id)} style={{ color: 'var(--danger)' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Recurring Invoice</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="label">Client *</label>
                  <select 
                    className="input"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Frequency</label>
                  <select 
                    className="input"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Start Date</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formData.next_date}
                    onChange={(e) => setFormData({ ...formData, next_date: e.target.value })}
                  />
                </div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
                  <h4 style={{ marginBottom: '16px' }}>Line Item Template</h4>
                  <div className="form-group">
                    <label className="label">Description</label>
                    <input 
                      type="text" 
                      className="input"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="label">Quantity</label>
                      <input 
                        type="number" 
                        className="input"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Unit Price</label>
                      <input 
                        type="number" 
                        className="input"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>
                    Amount: {formatCurrency(formData.quantity * formData.unit_price)}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}