-- InvoiceFlow Ghana - Complete Database Schema
-- GRA E-VAT Compliant Invoice Management System
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  company TEXT,
  tin TEXT,
  vat_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BUSINESS SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  tin TEXT NOT NULL,
  vat_number TEXT,
  gra_branch TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  -- GRA E-VAT Compliance fields
  qr_code TEXT,
  digital_signature TEXT,
  validation_id TEXT,
  validated_at TIMESTAMP,
  gra_status TEXT DEFAULT 'pending' CHECK (gra_status IN ('pending', 'validated', 'rejected')),
  tax_type TEXT DEFAULT 'standard' CHECK (tax_type IN ('standard', 'vat', 'exempt')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- LINE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  amount DECIMAL(12,2) DEFAULT 0
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('paystack', 'hubtel', 'bank_transfer', 'cash', 'mobile_money')),
  mobile_money_provider TEXT CHECK (mobile_money_provider IN ('mtn', 'vodafone', 'airteltigo')),
  mobile_money_number TEXT,
  reference TEXT,
  transaction_id TEXT,
  gateway_response JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- RECURRING INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  frequency TEXT CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  next_date DATE,
  line_items JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_gra_status ON invoices(gra_status);
CREATE INDEX IF NOT EXISTS idx_invoices_validation_id ON invoices(validation_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_clients_tin ON clients(tin);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for development - restrict for production)
CREATE POLICY "Allow all access to clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to line_items" ON line_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to recurring_invoices" ON recurring_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to business_settings" ON business_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DEFAULT BUSINESS SETTINGS
-- ============================================
INSERT INTO business_settings (business_name, tin)
VALUES ('My Business', 'TIN-REQUIRED')
ON CONFLICT DO NOTHING;

SELECT 'Database setup complete!' as status;