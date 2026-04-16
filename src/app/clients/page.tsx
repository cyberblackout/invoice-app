'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    tin: '',
    vat_number: '',
    notes: ''
  })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data || [])
    setLoading(false)
  }

  function openCreateModal() {
    setEditingClient(null)
    setFormData({ name: '', email: '', phone: '', address: '', company: '', tin: '', vat_number: '', notes: '' })
    setShowModal(true)
  }

  function openEditModal(client: Client) {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      company: client.company || '',
      tin: client.tin || '',
      vat_number: client.vat_number || '',
      notes: client.notes || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingClient) {
        await supabase.from('clients').update(formData).eq('id', editingClient.id)
      } else {
        await supabase.from('clients').insert(formData)
      }
      
      setShowModal(false)
      loadClients()
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Failed to save client')
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this client?')) {
      await supabase.from('clients').delete().eq('id', id)
      loadClients()
    }
  }

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Add Client</button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            className="input"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <h3 style={{ marginBottom: '8px', marginTop: '16px' }}>No clients found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Add your first client to get started</p>
            <button className="btn btn-primary" onClick={openCreateModal}>Add Client</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>TIN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td style={{ fontWeight: '500' }}>{client.name}</td>
                  <td>{client.company || '-'}</td>
                  <td>{client.email}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.tin || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(client)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(client.id)} style={{ color: 'var(--danger)' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingClient ? 'Edit Client' : 'Add Client'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="label">Name *</label>
                  <input 
                    type="text" 
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Email *</label>
                  <input 
                    type="email" 
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Company</label>
                  <input 
                    type="text" 
                    className="input"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Phone</label>
                  <input 
                    type="tel" 
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Address</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Tax ID (TIN)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    placeholder="e.g., P001234567"
                  />
                </div>
                <div className="form-group">
                  <label className="label">VAT Number</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    placeholder="e.g., 001234567"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingClient ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}