import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/timesheets - Get all timesheets for the current workspace
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

    const { data: timesheets, error } = await supabaseAdmin
      .from('timesheets')
      .select(`
        *,
        projects:project_id(name, hourly_rate, clients:client_id(name))
      `)
      .eq('workspace_id', workspaceId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 })
    }

    // Transform data to match UI expectations
    const transformedTimesheets = timesheets?.map(timesheet => ({
      id: timesheet.id,
      date: timesheet.date,
      projectId: timesheet.project_id,
      project: timesheet.projects?.name || 'No Project',
      client: timesheet.projects?.clients?.name || 'No Client',
      hours: timesheet.hours,
      description: timesheet.description,
      billable: timesheet.billable,
      hourlyRate: timesheet.projects?.hourly_rate || 0,
      total: timesheet.billable ? timesheet.hours * (timesheet.projects?.hourly_rate || 0) : 0,
      createdAt: timesheet.created_at,
      updatedAt: timesheet.updated_at
    })) || []

    return NextResponse.json({ timesheets: transformedTimesheets })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/timesheets - Create a new timesheet entry
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, projectId, hours, description, billable, workspaceId } = body

    if (!date || !projectId || !hours || !description || !workspaceId) {
      return NextResponse.json({ 
        error: 'Date, project ID, hours, description, and workspace ID are required' 
      }, { status: 400 })
    }

    const { data: timesheet, error } = await supabaseAdmin
      .from('timesheets')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        user_id: null, // Temporarily set to null since we're using hardcoded admin user
        date,
        hours: parseFloat(hours),
        description,
        billable: billable !== false
      })
      .select(`
        *,
        projects:project_id(name, hourly_rate, clients:client_id(name))
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create timesheet entry' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      timesheet: {
        id: timesheet.id,
        date: timesheet.date,
        projectId: timesheet.project_id,
        project: timesheet.projects?.name || 'No Project',
        client: timesheet.projects?.clients?.name || 'No Client',
        hours: timesheet.hours,
        description: timesheet.description,
        billable: timesheet.billable,
        hourlyRate: timesheet.projects?.hourly_rate || 0,
        total: timesheet.billable ? timesheet.hours * (timesheet.projects?.hourly_rate || 0) : 0,
        createdAt: timesheet.created_at,
        updatedAt: timesheet.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/timesheets - Update a timesheet entry
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, date, projectId, hours, description, billable } = body

    if (!id || !date || !projectId || !hours || !description) {
      return NextResponse.json({ 
        error: 'ID, date, project ID, hours, and description are required' 
      }, { status: 400 })
    }

    const { data: timesheet, error } = await supabaseAdmin
      .from('timesheets')
      .update({
        project_id: projectId,
        date,
        hours: parseFloat(hours),
        description,
        billable: billable !== false
      })
      .eq('id', id)
      .select(`
        *,
        projects:project_id(name, hourly_rate, clients:client_id(name))
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update timesheet entry' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      timesheet: {
        id: timesheet.id,
        date: timesheet.date,
        projectId: timesheet.project_id,
        project: timesheet.projects?.name || 'No Project',
        client: timesheet.projects?.clients?.name || 'No Client',
        hours: timesheet.hours,
        description: timesheet.description,
        billable: timesheet.billable,
        hourlyRate: timesheet.projects?.hourly_rate || 0,
        total: timesheet.billable ? timesheet.hours * (timesheet.projects?.hourly_rate || 0) : 0,
        createdAt: timesheet.created_at,
        updatedAt: timesheet.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/timesheets - Delete a timesheet entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Timesheet ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('timesheets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete timesheet entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


