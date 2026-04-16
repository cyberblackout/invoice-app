# InvoiceFlow

A modern invoice management website built with Next.js and Supabase.

## Features

- Dashboard with revenue overview
- Create and manage invoices with line items
- Client management
- Payment tracking
- Recurring invoices
- Reports with charts and CSV export

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Custom CSS

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your Supabase credentials
4. Run the development server: `npm run dev`

## Supabase Setup

Run the SQL from `SETUP_TABLES.sql` in your Supabase SQL Editor to create the database tables.

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!