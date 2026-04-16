'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Invoice, Client } from '@/types'

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6months')

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    const [invoicesRes, clientsRes] = await Promise.all([
      supabase.from('invoices').select('*, client:clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name')
    ])
    
    setInvoices(invoicesRes.data || [])
    setClients(clientsRes.data || [])
    setLoading(false)
  }

  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    
    switch (period) {
      case '1month':
        start.setMonth(now.getMonth() - 1)
        break
      case '3months':
        start.setMonth(now.getMonth() - 3)
        break
      case '6months':
        start.setMonth(now.getMonth() - 6)
        break
      case '1year':
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setMonth(now.getMonth() - 6)
    }
    
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
  }

  const filteredInvoices = useMemo(() => {
    const { start, end } = getDateRange()
    return invoices.filter(inv => inv.issue_date >= start && inv.issue_date <= end)
  }, [invoices, period])

  const totalRevenue = useMemo(() => 
    filteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)
  , [filteredInvoices])

  const totalInvoiced = useMemo(() => 
    filteredInvoices.reduce((sum, i) => sum + i.total, 0)
  , [filteredInvoices])

  const pendingAmount = useMemo(() => 
    filteredInvoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0)
  , [filteredInvoices])

  const overdueAmount = useMemo(() => 
    filteredInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0)
  , [filteredInvoices])

  const invoiceCount = filteredInvoices.length
  const paidCount = filteredInvoices.filter(i => i.status === 'paid').length
  const paidPercentage = invoiceCount > 0 ? Math.round((paidCount / invoiceCount) * 100) : 0

  const revenueByMonth = useMemo(() => {
    const months: Record<string, number> = {}
    filteredInvoices
      .filter(i => i.status === 'paid')
      .forEach(invoice => {
        const month = new Date(invoice.issue_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        months[month] = (months[month] || 0) + invoice.total
      })
    return months
  }, [filteredInvoices])

  const topClients = useMemo(() => {
    const clientTotals: Record<string, { name: string; total: number; count: number }> = {}
    filteredInvoices
      .filter(i => i.status === 'paid')
      .forEach(invoice => {
        const clientName = invoice.client?.name || 'Unknown'
        if (!clientTotals[clientName]) {
          clientTotals[clientName] = { name: clientName, total: 0, count: 0 }
        }
        clientTotals[clientName].total += invoice.total
        clientTotals[clientName].count += 1
      })
    return Object.values(clientTotals).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [filteredInvoices])

  const statusBreakdown = useMemo(() => {
    const breakdown = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 }
    filteredInvoices.forEach(invoice => {
      if (breakdown[invoice.status as keyof typeof breakdown] !== undefined) {
        breakdown[invoice.status as keyof typeof breakdown]++
      }
    })
    return breakdown
  }, [filteredInvoices])

  const maxRevenue = Math.max(...Object.values(revenueByMonth), 1)

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const exportToCSV = () => {
    const headers = ['Invoice Number', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Status']
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.client?.name || 'Unknown',
      inv.issue_date,
      inv.due_date,
      inv.total.toString(),
      inv.status
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${period}.csv`
    a.click()
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="input" 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button className="btn btn-secondary" onClick={exportToCSV}>Export CSV</button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalRevenue)}</div>
          <div className="stat-label">Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totalInvoiced)}</div>
          <div className="stat-label">Total Invoiced</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(pendingAmount)}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{formatCurrency(overdueAmount)}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Revenue Trend</h3>
          {Object.keys(revenueByMonth).length === 0 ? (
            <div className="empty-state">
              <p>No revenue data for this period</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px' }}>
              {Object.entries(revenueByMonth).map(([month, amount]) => (
                <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: `${(amount / maxRevenue) * 160}px`, 
                      background: 'var(--accent)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '4px'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                    {month}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Invoice Status</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} style={{ textAlign: 'center' }}>
                <div className={`badge badge-${status}`} style={{ fontSize: '16px', padding: '12px 20px' }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'capitalize' }}>
                  {status}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Collection Rate</span>
              <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>{paidPercentage}%</span>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${paidPercentage}%`, height: '100%', background: 'var(--success)', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Top Clients</h3>
          {topClients.length === 0 ? (
            <div className="empty-state">
              <p>No client data for this period</p>
            </div>
          ) : (
            <div>
              {topClients.map((client, index) => (
                <div key={client.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>
                      {index + 1}
                    </span>
                    <span>{client.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(client.total)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{client.count} invoice{client.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Invoices</span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{invoiceCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Average Invoice Value</span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{formatCurrency(invoiceCount > 0 ? totalInvoiced / invoiceCount : 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Clients</span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{clients.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Clients with Invoices</span>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{new Set(filteredInvoices.map(i => i.client_id)).size}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}