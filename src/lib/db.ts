import { supabase } from '@/lib/supabase'
import { Invoice, Client, Payment, GRACompliance } from '@/types'
import { generateGRAQRData, generateDigitalSignature } from './ghana'
import { v4 as uuidv4 } from 'uuid'

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*), line_items(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }
  return data || []
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }
  return data || []
}

export async function getPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoice:invoices(*)')
    .order('payment_date', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }
  return data || []
}

export async function createInvoice(invoice: Partial<Invoice>) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateInvoice(id: string, invoice: Partial<Invoice>) {
  const { data, error } = await supabase
    .from('invoices')
    .update(invoice)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createClient(client: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClient(id: string, client: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update(client)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createPayment(payment: Partial<Payment>) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*), line_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching invoice:', error)
    return null
  }
  return data
}

export async function getNextInvoiceNumber(): Promise<string> {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return 'INV-0001'
  }

  const lastNumber = parseInt(data.invoice_number.replace('INV-', ''), 10)
  return `INV-${String(lastNumber + 1).padStart(4, '0')}`
}

export async function generateGRACompliance(invoice: Invoice, client: Client): Promise<{
  qr_code: string
  digital_signature: string
  validation_id: string
}> {
  const qrData = generateGRAQRData({
    invoice_number: invoice.invoice_number,
    total: invoice.total,
    issue_date: invoice.issue_date,
    tax_amount: invoice.tax_amount,
    client_name: client.name
  })

  const signaturePayload = `${invoice.invoice_number}|${invoice.total}|${invoice.issue_date}|${invoice.tax_amount}`
  const digitalSignature = generateDigitalSignature(signaturePayload)
  const validationId = `GRA-${uuidv4().substring(0, 8).toUpperCase()}`

  return {
    qr_code: qrData,
    digital_signature: digitalSignature,
    validation_id: validationId
  }
}

export async function validateWithGRA(invoiceId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const invoice = await getInvoiceById(invoiceId)
    if (!invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    const graCompliance = await generateGRACompliance(invoice, invoice.client!)

    await supabase
      .from('invoices')
      .update({
        qr_code: graCompliance.qr_code,
        digital_signature: graCompliance.digital_signature,
        validation_id: graCompliance.validation_id,
        validated_at: new Date().toISOString(),
        gra_status: 'validated'
      })
      .eq('id', invoiceId)

    return { success: true }
  } catch (error) {
    console.error('GRA validation error:', error)
    return { success: false, error: 'Failed to validate with GRA' }
  }
}