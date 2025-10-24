import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_INVOICE_TEMPLATE } from '@/lib/default-templates'

export async function POST(request: NextRequest) {
  try {
    // Get the Sattiyan Selvarajah workspace
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', 'sattiyan')
      .single()

    if (workspaceError || !workspaces) {
      return NextResponse.json({ error: 'Sattiyan workspace not found' }, { status: 404 })
    }

    // Check if default template already exists
    const { data: existingTemplate, error: checkError } = await supabase
      .from('invoice_templates')
      .select('id')
      .eq('workspace_id', workspaces.id)
      .eq('name', 'Default Template')
      .single()

    if (existingTemplate) {
      return NextResponse.json({ message: 'Default template already exists' }, { status: 200 })
    }

    // Create the default template
    const { data: template, error: templateError } = await supabase
      .from('invoice_templates')
      .insert({
        workspace_id: workspaces.id,
        name: 'Default Template',
        html_template: DEFAULT_INVOICE_TEMPLATE,
        is_default: true
      })
      .select()
      .single()

    if (templateError) {
      console.error('Error creating template:', templateError)
      return NextResponse.json({ error: 'Failed to create default template' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Default template created successfully',
      template 
    }, { status: 201 })

  } catch (error) {
    console.error('Error in seed template API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

