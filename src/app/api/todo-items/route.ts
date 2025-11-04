import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/todo-items - Get all todo items for a project or workspace
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const projectId = searchParams.get('projectId')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('todo_items')
      .select(`
        *,
        projects:project_id(id, name, code, clients:client_id(name)),
        timesheet_todo_items(
          id,
          hours_allocated,
          created_at,
          timesheets:timesheet_id(id, created_at)
        )
      `)
      .eq('workspace_id', workspaceId)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data: todoItems, error } = await query
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch todo items' }, { status: 500 })
    }

    // Transform data
    const transformedTodos = todoItems?.map(todo => {
      const timesheetItems = todo.timesheet_todo_items || []
      const totalHours = timesheetItems.reduce((sum: number, tti: any) => sum + (parseFloat(tti.hours_allocated) || 0), 0)
      const timesheetCount = timesheetItems.length
      // Prefer the association created_at (when this todo was linked),
      // fallback to the timesheet's created_at. Both include time (timestamptz)
      const lastTimesheetDate = timesheetItems.length > 0
        ? timesheetItems
            .map((tti: any) => tti.created_at || tti.timesheets?.created_at)
            .filter(Boolean)
            .sort()
            .reverse()[0]
        : null

      return {
        id: todo.id,
        projectId: todo.project_id,
        workspaceId: todo.workspace_id,
        title: todo.title,
        description: todo.description,
        status: todo.status,
        position: todo.position,
        isArchived: todo.is_archived,
        project: todo.projects ? {
          id: todo.projects.id,
          name: todo.projects.name,
          code: todo.projects.code,
          client: todo.projects.clients?.name || null
        } : null,
        totalHours,
        timesheetCount,
        lastTimesheetDate,
        createdAt: todo.created_at,
        updatedAt: todo.updated_at
      }
    }) || []

    return NextResponse.json({ todoItems: transformedTodos })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/todo-items - Create a new todo item
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, workspaceId, title, description, status, position } = body

    if (!projectId || !workspaceId || !title) {
      return NextResponse.json({ 
        error: 'Project ID, workspace ID, and title are required' 
      }, { status: 400 })
    }

    // Always default to 'todo' status for new todos
    const finalStatus = 'todo'

    // Get the highest position for this project/status to add new item at the end
    let finalPosition = position
    if (finalPosition === undefined || finalPosition === null) {
      const { data: existingTodos } = await supabaseAdmin
        .from('todo_items')
        .select('position')
        .eq('project_id', projectId)
        .eq('status', finalStatus)
        .eq('is_archived', false)
        .order('position', { ascending: false })
        .limit(1)
        .single()
      
      finalPosition = existingTodos?.position !== undefined ? (existingTodos.position + 1) : 0
    }

    const { data: todoItem, error } = await supabaseAdmin
      .from('todo_items')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        title,
        description: description || null,
        status: finalStatus,
        position: finalPosition
      })
      .select(`
        *,
        projects:project_id(id, name, code, clients:client_id(name))
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create todo item' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      todoItem: {
        id: todoItem.id,
        projectId: todoItem.project_id,
        workspaceId: todoItem.workspace_id,
        title: todoItem.title,
        description: todoItem.description,
        status: todoItem.status,
        position: todoItem.position,
        isArchived: todoItem.is_archived,
        project: todoItem.projects ? {
          id: todoItem.projects.id,
          name: todoItem.projects.name,
          code: todoItem.projects.code,
          client: todoItem.projects.clients?.name || null
        } : null,
        createdAt: todoItem.created_at,
        updatedAt: todoItem.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/todo-items - Update a todo item
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, status, position, isArchived } = body

    if (!id) {
      return NextResponse.json({ error: 'Todo item ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (position !== undefined) updateData.position = position
    if (isArchived !== undefined) updateData.is_archived = isArchived

    const { data: todoItem, error } = await supabaseAdmin
      .from('todo_items')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        projects:project_id(id, name, code, clients:client_id(name))
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update todo item' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      todoItem: {
        id: todoItem.id,
        projectId: todoItem.project_id,
        workspaceId: todoItem.workspace_id,
        title: todoItem.title,
        description: todoItem.description,
        status: todoItem.status,
        position: todoItem.position,
        isArchived: todoItem.is_archived,
        project: todoItem.projects ? {
          id: todoItem.projects.id,
          name: todoItem.projects.name,
          code: todoItem.projects.code,
          client: todoItem.projects.clients?.name || null
        } : null,
        createdAt: todoItem.created_at,
        updatedAt: todoItem.updated_at
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/todo-items - Delete a todo item
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Todo item ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('todo_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete todo item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

