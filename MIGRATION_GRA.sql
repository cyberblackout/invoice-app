-- InvoiceFlow Ghana - Migration Script
-- Run this in Supabase SQL Editor if you already have the old schema
-- This adds GRA E-VAT compliance fields to existing tables

-- Add columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- Add columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS digital_signature TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS validation_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gra_status TEXT DEFAULT 'pending';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'standard';

-- Add columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mobile_money_provider TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mobile_money_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB;

-- Create business_settings table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_gra_status ON invoices(gra_status);
CREATE INDEX IF NOT EXISTS idx_invoices_validation_id ON invoices(validation_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);

-- Insert default business settings (update with your info)
INSERT INTO business_settings (business_name, business_address, business_phone, business_email, tin)
VALUES ('Your Business Name', 'Your Business Address', '+233 XX XXX XXXX', 'info@yourbusiness.com', 'TIN-XXXXX')
ON CONFLICT DO NOTHING;
