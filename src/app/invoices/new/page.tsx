'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, LineItem } from '@/types'

interface LineItemForm {
  description: string
  quantity: number
  unit_price: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax_rate: 0,
    notes: ''
  })
  
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ])

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    const [clientsRes, invoiceRes] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('invoices').select('invoice_number').order('created_at', { ascending: false }).limit(1).single()
    ])
    
    setClients(clientsRes.data || [])
    
    if (invoiceRes.data) {
      const lastNumber = parseInt(invoiceRes.data.invoice_number.replace('INV-', ''), 10)
      setInvoiceNumber(`INV-${String(lastNumber + 1).padStart(4, '0')}`)
    } else {
      setInvoiceNumber('INV-0001')
    }
    
    setLoading(false)
  }

  function calculateSubtotal() {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  function calculateTax() {
    return calculateSubtotal() * (formData.tax_rate / 100)
  }

  function calculateTotal() {
    return calculateSubtotal() + calculateTax()
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeLineItem(index: number) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  function updateLineItem(index: number, field: keyof LineItemForm, value: string | number) {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  async function handleSubmit(status: 'draft' | 'sent') {
    if (!formData.client_id) {
      alert('Please select a client')
      return
    }

    const validItems = lineItems.filter(item => item.description.trim() !== '')
    if (validItems.length === 0) {
      alert('Please add at least one line item')
      return
    }

    setSaving(true)

    try {
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const total = calculateTotal()

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: formData.client_id,
          status,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          subtotal,
          tax_rate: formData.tax_rate,
          tax_amount: taxAmount,
          total,
          notes: formData.notes
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const lineItemsData = validItems.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('line_items')
        .insert(lineItemsData)

      if (itemsError) throw itemsError

      router.push('/invoices')
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">New Invoice</h1>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '24px' }}>Invoice Details</h3>
          
          <div className="form-group">
            <label className="label">Invoice Number</label>
            <input type="text" className="input" value={invoiceNumber} readOnly />
          </div>

          <div className="form-group">
            <label className="label">Client</label>
            <select 
              className="input"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="label">Issue Date</label>
              <input 
                type="date" 
                className="input"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input 
                type="date" 
                className="input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Tax Rate (%)</label>
            <input 
              type="number" 
              className="input"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea 
              className="input"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment terms, thank you note, etc."
            />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>Line Items</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addLineItem}>+ Add Item</button>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
              <div style={{ flex: 2 }}>
                <input 
                  type="text" 
                  className="input"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="number" 
                  className="input"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="number" 
                  className="input"
                  placeholder="Price"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                {formatCurrency(item.quantity * item.unit_price)}
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => removeLineItem(index)}
                disabled={lineItems.length === 1}
              >
                ×
              </button>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tax ({formData.tax_rate}%)</span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(calculateTax())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '600', marginTop: '12px' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleSubmit('draft')}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => handleSubmit('sent')}
              disabled={saving}
            >
              Save & Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}