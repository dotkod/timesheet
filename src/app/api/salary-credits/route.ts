import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET /api/salary-credits - Get salary credits for specific projects
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectIds = searchParams.get('projectIds')

    if (!projectIds) {
      return NextResponse.json({ error: 'Project IDs are required' }, { status: 400 })
    }

    const projectIdsArray = projectIds.split(',')

    const { data: credits, error } = await supabaseAdmin
      .from('salary_credits')
      .select('*')
      .in('project_id', projectIdsArray)
      .order('credited_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch salary credits' }, { status: 500 })
    }

    return NextResponse.json({ credits })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

