import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/workspace-settings - Get workspace settings
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

    const { data: settings, error } = await supabaseAdmin
      .from('workspace_settings')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Transform settings array to object
    const settingsObj = settings?.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {}) || {}

    return NextResponse.json({ settings: settingsObj })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspace-settings - Update workspace settings
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, settings } = body

    if (!workspaceId || !settings) {
      return NextResponse.json({ error: 'Workspace ID and settings are required' }, { status: 400 })
    }

    // Delete existing settings for this workspace
    await supabaseAdmin
      .from('workspace_settings')
      .delete()
      .eq('workspace_id', workspaceId)

    // Insert new settings
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      workspace_id: workspaceId,
      key,
      value: String(value)
    }))

    const { error } = await supabaseAdmin
      .from('workspace_settings')
      .insert(settingsArray)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


