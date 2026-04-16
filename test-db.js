const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vvclxdozdrubevngzoch.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2Y2x4ZG96ZHJ1YmV2bmd6b2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTEzOTgsImV4cCI6MjA5MTQ4NzM5OH0.f9i9oJQ6DBvn1Ai-2Qm9aIEBwGDNI75m3XcOsBBP3ZI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  // Test clients table
  const { data: clients, error: clientsError } = await supabase.from('clients').select('*').limit(1)
  
  if (clientsError) {
    console.error('❌ Clients table error:', clientsError.message)
  } else {
    console.log('✅ Clients table connected')
  }
  
  // Test invoices table
  const { data: invoices, error: invoicesError } = await supabase.from('invoices').select('*').limit(1)
  
  if (invoicesError) {
    console.error('❌ Invoices table error:', invoicesError.message)
  } else {
    console.log('✅ Invoices table connected')
  }
  
  // Test line_items table
  const { data: lineItems, error: lineItemsError } = await supabase.from('line_items').select('*').limit(1)
  
  if (lineItemsError) {
    console.error('❌ Line items table error:', lineItemsError.message)
  } else {
    console.log('✅ Line items table connected')
  }
  
  // Test payments table
  const { data: payments, error: paymentsError } = await supabase.from('payments').select('*').limit(1)
  
  if (paymentsError) {
    console.error('❌ Payments table error:', paymentsError.message)
  } else {
    console.log('✅ Payments table connected')
  }
  
  // Test recurring_invoices table
  const { data: recurring, error: recurringError } = await supabase.from('recurring_invoices').select('*').limit(1)
  
  if (recurringError) {
    console.error('❌ Recurring invoices table error:', recurringError.message)
  } else {
    console.log('✅ Recurring invoices table connected')
  }
  
  console.log('\nDatabase connection test complete!')
}

testConnection().catch(console.error)