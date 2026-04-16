-- InvoiceFlow Ghana - Migration Script
-- Run this to add new GRA E-VAT columns without losing data

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
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mobile_money_provider TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS mobile_money_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB;

-- Create business_settings table if not exists
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

-- Enable RLS on business_settings
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON business_settings FOR ALL USING (true);

-- Insert default business settings (optional)
INSERT INTO business_settings (business_name, tin)
VALUES ('My Business', 'TIN-REQUIRED')
ON CONFLICT DO NOTHING;

-- Verify migration
SELECT 'Migration complete!' as status;
SELECT column_name FROM information_schema.columns WHERE table_name = 'clients';
