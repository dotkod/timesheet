import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/invoices - Get all invoices for the current workspace
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients:client_id(name),
        invoice_items:invoice_items(*)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Transform data to match UI expectations
    const transformedInvoices = invoices?.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id, // Add this missing field!
      client: invoice.clients?.name || 'No Client',
      templateId: invoice.template_id, // Add this missing field!
      dateIssued: invoice.date_issued,
      dueDate: invoice.due_date,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      description: invoice.notes || '',
      notes: invoice.notes || '', // Add this missing field!
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at
    })) || []

    return NextResponse.json({ invoices: transformedInvoices })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      workspaceId, 
      clientId, 
      templateId, 
      dateIssued, 
      dueDate, 
      description, 
      notes,
      subtotal,
      tax,
      total,
      items,
      timesheetIds
    } = body

    if (!workspaceId || !clientId || !templateId) {
      return NextResponse.json({ 
        error: 'Workspace ID, client ID, and template ID are required' 
      }, { status: 400 })
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(workspaceId)

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        workspace_id: workspaceId,
        client_id: clientId,
        template_id: templateId,
        invoice_number: invoiceNumber,
        date_issued: dateIssued,
        due_date: dueDate,
        subtotal: subtotal || 0,
        tax: tax || 0,
        total: total || 0,
        status: 'draft',
        notes: notes || description
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Database error:', invoiceError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice items
    if (items && items.length > 0) {
      const invoiceItems = items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total
      }))

      const { error: itemsError } = await supabaseAdmin
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) {
        console.error('Database error:', itemsError)
        return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 })
      }
    }

    // Mark timesheets as invoiced (optional - you might want to track this)
    if (timesheetIds && timesheetIds.length > 0) {
      // You could add a field to track invoiced timesheets
      // For now, we'll just log it
      console.log('Timesheets to mark as invoiced:', timesheetIds)
    }

    return NextResponse.json({ 
      success: true, 
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        total: invoice.total
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate invoice number
async function generateInvoiceNumber(workspaceId: string): Promise<string> {
  try {
    // Get workspace slug
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('slug')
      .eq('id', workspaceId)
      .single()

    const workspaceSlug = workspace?.slug || 'INV'
    
    // Get current year and month
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    
    // Find the highest invoice number for this workspace and month
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('invoice_number')
      .eq('workspace_id', workspaceId)
      .like('invoice_number', `${workspaceSlug}-${year}${month}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    let sequence = 1
    if (invoices && invoices.length > 0) {
      const lastNumber = invoices[0].invoice_number
      const lastSequence = parseInt(lastNumber.split('-')[2]) || 0
      sequence = lastSequence + 1
    }

    return `${workspaceSlug}-${year}${month}-${String(sequence).padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    return `INV-${Date.now()}`
  }
}

// PUT /api/invoices - Update an invoice
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, notes, description, clientId, templateId, dateIssued, dueDate, subtotal, tax, total } = body

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Get the invoice first to check if status is changing to 'paid'
    const { data: existingInvoice } = await supabaseAdmin
      .from('invoices')
      .select('status, client_id, date_issued, total')
      .eq('id', id)
      .single()

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .update({
        status: status || 'draft',
        notes: description || notes, // Use description as primary, fallback to notes
        client_id: clientId,
        template_id: templateId,
        date_issued: dateIssued,
        due_date: dueDate,
        subtotal: subtotal,
        tax: tax,
        total: total
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    // If status changed to 'paid', create salary_credit record
    if (status === 'paid' && existingInvoice?.status !== 'paid') {
      try {
        // Find the project (client) and mark salary as credited
        // For invoices, the "project" is the client
        const { data: projects } = await supabaseAdmin
          .from('projects')
          .select('id, fixed_amount')
          .eq('client_id', invoice.client_id)
          .eq('billing_type', 'fixed')
          .limit(1)

        if (projects && projects.length > 0) {
          const project = projects[0]
          const invoiceDate = new Date(invoice.date_issued)
          const workMonth = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1)
          
          // Check if already credited
          const { data: existingCredit } = await supabaseAdmin
            .from('salary_credits')
            .select('id')
            .eq('project_id', project.id)
            .eq('work_month', workMonth.toISOString().split('T')[0])
            .single()

          if (!existingCredit) {
            await supabaseAdmin
              .from('salary_credits')
              .insert({
                project_id: project.id,
                work_month: workMonth.toISOString().split('T')[0],
                credited_date: new Date().toISOString().split('T')[0],
                amount: project.fixed_amount || invoice.total,
                notes: `Automatically credited when invoice ${invoice.invoice_number} was marked as paid`
              })
          }
        }
      } catch (salaryError) {
        // Don't fail the whole request if salary credit fails
        console.error('Failed to create salary credit:', salaryError)
      }
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/invoices - Delete an invoice
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


