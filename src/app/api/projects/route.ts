import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/projects - Get all projects for the current workspace
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

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        clients:client_id(name),
        timesheets:timesheets(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Transform data to match UI expectations
    const transformedProjects = projects?.map(project => ({
      id: project.id,
      name: project.name,
      code: project.code,
      clientId: project.client_id,
      client: project.clients?.name || 'No Client',
      billingType: project.billing_type || 'hourly',
      hourlyRate: project.hourly_rate || 0,
      fixedAmount: project.fixed_amount || 0,
      status: project.status,
      notes: project.notes,
      totalHours: 0, // Will calculate from timesheets
      totalRevenue: 0, // Will calculate from timesheets
      lastActivity: project.updated_at ? new Date(project.updated_at).toISOString().split('T')[0] : null,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    })) || []

    return NextResponse.json({ projects: transformedProjects })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, clientId, billingType, hourlyRate, fixedAmount, status, notes, workspaceId } = body

    if (!name || !workspaceId) {
      return NextResponse.json({ error: 'Name and workspace ID are required' }, { status: 400 })
    }

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        client_id: clientId,
        name,
        code,
        billing_type: billingType || 'hourly',
        hourly_rate: billingType === 'hourly' ? (hourlyRate || 0) : 0,
        fixed_amount: billingType === 'fixed' ? (fixedAmount || 0) : 0,
        status: status || 'active',
        notes
      })
      .select(`
        *,
        clients:client_id(name)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        clientId: project.client_id,
        client: project.clients?.name || 'No Client',
        billingType: project.billing_type || 'hourly',
        hourlyRate: project.hourly_rate || 0,
        fixedAmount: project.fixed_amount || 0,
        status: project.status,
        notes: project.notes,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects - Update a project
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, code, clientId, billingType, hourlyRate, fixedAmount, status, notes } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update({
        client_id: clientId,
        name,
        code,
        billing_type: billingType || 'hourly',
        hourly_rate: billingType === 'hourly' ? (hourlyRate || 0) : 0,
        fixed_amount: billingType === 'fixed' ? (fixedAmount || 0) : 0,
        status: status || 'active',
        notes
      })
      .eq('id', id)
      .select(`
        *,
        clients:client_id(name)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        clientId: project.client_id,
        client: project.clients?.name || 'No Client',
        billingType: project.billing_type || 'hourly',
        hourlyRate: project.hourly_rate || 0,
        fixedAmount: project.fixed_amount || 0,
        status: project.status,
        notes: project.notes,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects - Delete a project
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


