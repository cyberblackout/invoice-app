# InvoiceFlow Ghana - Setup Guide

## Prerequisites
- Supabase account
- Vercel account (for deployment)
- Paystack account (for payment processing)
- Hubtel account (for mobile money)

## Step 1: Supabase Setup

### Option A: Fresh Database
1. Go to: https://supabase.com/dashboard/project/vvclxdozdrubevngzoch
2. Open **SQL Editor**
3. Run `SETUP_TABLES.sql`

### Option B: Existing Database (Migration)
If you already have the old schema:
1. Go to: https://supabase.com/dashboard/project/vvclxdozdrubevngzoch
2. Open **SQL Editor**
3. Run `MIGRATION_GRA.sql`

## Step 2: Configure Business Settings

After setup, update your business information in `business_settings` table:

```sql
UPDATE business_settings SET 
  business_name = 'Your Business Name',
  business_address = '123 Main Street, Accra',
  business_phone = '+233 XX XXX XXXX',
  business_email = 'info@yourbusiness.com',
  tin = 'Your TIN Number',
  vat_number = 'Your VAT Number',
  gra_branch = 'Accra Central';
```

## Step 3: Environment Variables

### In Vercel Dashboard
Add these environment variables in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `HUBTEL_MERCHANT_ACCOUNT_NUMBER` | Hubtel account number |
| `HUBTEL_MERCHANT_API_KEY` | Hubtel API key |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g., https://invoice-app.vercel.app) |

## Step 4: GRA Tax Rates

The system supports Ghana tax rates:

| Tax Type | Rate | Description |
|----------|------|-------------|
| VAT | 12.5% | Standard VAT rate |
| Standard | 15% | General rate |
| Exempt | 0% | Tax-exempt items |

## Step 5: Payment Gateways

### Paystack Setup
1. Sign up at https://paystack.com
2. Get your API keys from Dashboard > Settings > API
3. Enable GHS currency in your Paystack dashboard

### Hubtel Setup
1. Sign up at https://hubtel.com
2. Register as a merchant
3. Get your merchant account number and API key

## Database Tables

| Table | Purpose |
|-------|---------|
| `clients` | Customer information with TIN/VAT support |
| `invoices` | Invoice data with GRA compliance |
| `line_items` | Invoice line items |
| `payments` | Payment records with gateway support |
| `recurring_invoices` | Recurring invoice templates |
| `business_settings` | Your business information |

## Verification

After setup, run this to verify:

```sql
SELECT * FROM business_settings;
SELECT COUNT(*) FROM invoices;
SELECT COUNT(*) FROM clients;
```
