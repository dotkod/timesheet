import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/invoice-templates - Get invoice templates for workspace
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

    const { data: templates, error } = await supabaseAdmin
      .from('invoice_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invoice-templates - Create new invoice template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, name, htmlTemplate, isDefault } = body

    if (!workspaceId || !name) {
      return NextResponse.json({ error: 'Workspace ID and name are required' }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('invoice_templates')
        .update({ is_default: false })
        .eq('workspace_id', workspaceId)
    }

    const { data: template, error } = await supabaseAdmin
      .from('invoice_templates')
      .insert({
        workspace_id: workspaceId,
        name,
        html_template: htmlTemplate || '',
        is_default: isDefault || false
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/invoice-templates - Update invoice template
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, htmlTemplate, isDefault } = body

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      const { data: template } = await supabaseAdmin
        .from('invoice_templates')
        .select('workspace_id')
        .eq('id', id)
        .single()

      if (template) {
        await supabaseAdmin
          .from('invoice_templates')
          .update({ is_default: false })
          .eq('workspace_id', template.workspace_id)
          .neq('id', id)
      }
    }

    const { data: updatedTemplate, error } = await supabaseAdmin
      .from('invoice_templates')
      .update({
        name,
        html_template: htmlTemplate || '',
        is_default: isDefault || false
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ success: true, template: updatedTemplate })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/invoice-templates - Delete invoice template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('invoice_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


