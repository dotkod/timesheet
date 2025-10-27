import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/clients - Get all clients for the current workspace
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

    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        projects:projects(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Fetch invoices for revenue calculation
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id, client_id, total, status')
      .eq('workspace_id', workspaceId)

    // Fetch timesheets for projects owned by clients
    const clientIds = clients?.map(c => c.id) || []
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, client_id, billing_type, hourly_rate, fixed_amount')
      .in('client_id', clientIds)

    const projectIds = projects?.map(p => p.id) || []
    const { data: timesheets } = await supabaseAdmin
      .from('timesheets')
      .select('project_id, hours, billable')
      .in('project_id', projectIds)
      .eq('workspace_id', workspaceId)

    // Fetch salary credits for fixed projects
    const { data: salaryCredits } = await supabaseAdmin
      .from('salary_credits')
      .select('project_id, credited_date')
      .in('project_id', projectIds)
      .order('credited_date', { ascending: false })

    // Transform data to match UI expectations
    const transformedClients = clients?.map(client => {
      // Calculate revenue from invoices (only paid invoices)
      const clientInvoices = invoices?.filter(inv => inv.client_id === client.id && inv.status === 'paid') || []
      const invoiceRevenue = clientInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)

      // Calculate revenue from timesheets (billable hours * hourly rate)
      const clientProjects = projects?.filter(p => p.client_id === client.id) || []
      const clientProjectIds = clientProjects.map(p => p.id)
      const clientTimesheets = timesheets?.filter(t => clientProjectIds.includes(t.project_id)) || []
      
      let timesheetRevenue = 0
      for (const timesheet of clientTimesheets) {
        const project = clientProjects.find(p => p.id === timesheet.project_id)
        if (project && timesheet.billable) {
          if (project.billing_type === 'hourly') {
            timesheetRevenue += (parseFloat(timesheet.hours) || 0) * (project.hourly_rate || 0)
          } else if (project.billing_type === 'fixed') {
            timesheetRevenue += project.fixed_amount || 0
          }
        }
      }

      // Check if client has fixed project (reuse clientProjects from above)
      const hasFixedProject = clientProjects.some(p => p.billing_type === 'fixed')
      
      // Get latest credit date for this client's projects
      const clientCredits = salaryCredits?.filter(credit => clientProjectIds.includes(credit.project_id)) || []
      const latestCredit = clientCredits.length > 0 ? clientCredits[0] : null

      return {
        id: client.id,
        name: client.name,
        email: client.contact_email,
        phone: client.phone,
        address: client.billing_address,
        status: client.status,
        notes: client.notes,
        totalProjects: client.projects?.[0]?.count || 0,
        totalRevenue: invoiceRevenue + timesheetRevenue,
        hasFixedProject,
        latestCreditDate: latestCredit?.credited_date || null,
        lastContact: client.updated_at ? new Date(client.updated_at).toISOString().split('T')[0] : null,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }
    }) || []

    return NextResponse.json({ clients: transformedClients })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, address, status, notes, workspaceId } = body

    if (!name || !workspaceId) {
      return NextResponse.json({ error: 'Name and workspace ID are required' }, { status: 400 })
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        workspace_id: workspaceId,
        name,
        contact_email: email,
        phone,
        billing_address: address,
        status: status || 'prospect',
        notes
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      client: {
        id: client.id,
        name: client.name,
        email: client.contact_email,
        phone: client.phone,
        address: client.billing_address,
        status: client.status,
        notes: client.notes,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/clients - Update a client
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, email, phone, address, status, notes } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({
        name,
        contact_email: email,
        phone,
        billing_address: address,
        status: status || 'prospect',
        notes
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      client: {
        id: client.id,
        name: client.name,
        email: client.contact_email,
        phone: client.phone,
        address: client.billing_address,
        status: client.status,
        notes: client.notes,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/clients - Delete a client
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


