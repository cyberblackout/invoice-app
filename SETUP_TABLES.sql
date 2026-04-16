-- Run this in Supabase SQL Editor - tables only (policies already exist)

CREATE TABLE IF NOT EXISTS clients (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, address TEXT, company TEXT, notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());

CREATE TABLE IF NOT EXISTS invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_number TEXT UNIQUE NOT NULL, client_id UUID REFERENCES clients(id), status TEXT DEFAULT 'draft', issue_date DATE NOT NULL, due_date DATE NOT NULL, subtotal DECIMAL, tax_rate DECIMAL DEFAULT 0, tax_amount DECIMAL DEFAULT 0, total DECIMAL, notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());

CREATE TABLE IF NOT EXISTS line_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE, description TEXT NOT NULL, quantity DECIMAL, unit_price DECIMAL, amount DECIMAL);

CREATE TABLE IF NOT EXISTS payments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id UUID REFERENCES invoices(id), amount DECIMAL, payment_date DATE, payment_method TEXT, reference TEXT, notes TEXT);

CREATE TABLE IF NOT EXISTS recurring_invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_id UUID REFERENCES clients(id), frequency TEXT, status TEXT DEFAULT 'active', next_date DATE, line_items JSONB, created_at TIMESTAMP DEFAULT NOW());