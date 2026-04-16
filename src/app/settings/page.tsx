'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface BusinessSettings {
  id?: string
  business_name: string
  business_address: string
  business_phone: string
  business_email: string
  tin: string
  vat_number: string
  gra_branch: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    tin: '',
    vat_number: '',
    gra_branch: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .single()

    if (data) {
      setSettings(data)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (error) throw error

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
      console.error(error)
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">⚙️ Business Settings</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Business Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  placeholder="Your Business Name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">TIN (Tax Identification Number)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.tin}
                  onChange={(e) => setSettings({ ...settings, tin: e.target.value })}
                  placeholder="TIN-123456789"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">VAT Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.vat_number}
                  onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })}
                  placeholder="V0012345678901"
                />
              </div>

              <div className="form-group">
                <label className="form-label">GRA Branch</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.gra_branch}
                  onChange={(e) => setSettings({ ...settings, gra_branch: e.target.value })}
                  placeholder="Accra Central"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={settings.business_email}
                  onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                  placeholder="business@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={settings.business_phone}
                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  placeholder="+233 20 123 4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Address</label>
              <textarea
                className="form-input form-textarea"
                value={settings.business_address}
                onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                placeholder="Full business address"
                rows={3}
              />
            </div>
          </div>

          {message.text && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="form-section">
          <h3 className="form-section-title">📋 GRA E-VAT Compliance</h3>
          <p className="form-section-desc">
            Your business settings are used for generating GRA-compliant invoices with QR codes and digital signatures.
          </p>
          <ul className="info-list">
            <li>📌 <strong>TIN</strong> - Required on all invoices for GRA compliance</li>
            <li>📌 <strong>VAT Number</strong> - Required for VAT-registered businesses</li>
            <li>📌 <strong>GRA Branch</strong> - Your registered GRA branch office</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="form-section">
          <h3 className="form-section-title">📧 Email Notifications</h3>
          <p className="form-section-desc">
            Configure SMTP settings to send invoice notifications via email.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input
                type="text"
                className="form-input"
                placeholder="smtp.example.com"
                disabled
              />
              <small className="form-hint">Set via .env file: SMTP_HOST</small>
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input
                type="text"
                className="form-input"
                placeholder="587"
                disabled
              />
              <small className="form-hint">Set via .env file: SMTP_PORT</small>
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="your-email@example.com"
                disabled
              />
              <small className="form-hint">Set via .env file: SMTP_USER</small>
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                disabled
              />
              <small className="form-hint">Set via .env file: SMTP_PASS</small>
            </div>
          </div>
</div>
      </div>

      <div className="card">
        <div className="form-section">
          <h3 className="form-section-title">📋 GRA E-VAT Compliance</h3>
          <p className="form-section-desc">
            Configure WhatsApp Business API to send invoice notifications.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">WhatsApp API URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://api.whatsapp.com/v1"
                disabled
              />
              <small className="form-hint">Set via .env file: WHATSAPP_API_URL</small>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+233501234567"
                disabled
              />
              <small className="form-hint">Set via .env file: WHATSAPP_PHONE_NUMBER</small>
            </div>
          </div>
          <p className="info-text">
            📝 <strong>Note:</strong> Email and WhatsApp settings are configured via environment variables in the <code>.env</code> file. Update them and redeploy to activate.
          </p>
        </div>
      </div>
    </div>
  )
}