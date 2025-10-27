import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import dayjs from 'dayjs'

// POST /api/projects/mark-credited - Mark salary as credited for a fixed project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, creditedDate } = body

    if (!projectId || !creditedDate) {
      return NextResponse.json({ error: 'Project ID and credited date are required' }, { status: 400 })
    }

    // Get the project details first
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Database error:', projectError)
      return NextResponse.json({ error: 'Failed to find project' }, { status: 500 })
    }

    if (project.billing_type !== 'fixed') {
      return NextResponse.json({ error: 'Only fixed billing projects can have salary tracking' }, { status: 400 })
    }

    // Determine which work month this credit is for
    // If today is Nov 7, this credit is for October work (last month)
    const creditedDateDayjs = dayjs(creditedDate)
    const workMonth = creditedDateDayjs.subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
    
    // Check if this month already has a credit
    const { data: existingCredit } = await supabaseAdmin
      .from('salary_credits')
      .select('*')
      .eq('project_id', projectId)
      .eq('work_month', workMonth)
      .single()

    if (existingCredit) {
      return NextResponse.json({ error: 'This work month already has a credited record' }, { status: 400 })
    }

    // Insert into salary_credits table
    const { data: salaryCredit, error: creditError } = await supabaseAdmin
      .from('salary_credits')
      .insert({
        project_id: projectId,
        work_month: workMonth,
        credited_date: creditedDate,
        amount: project.fixed_amount || 0,
        notes: `Marked as credited on ${creditedDate} for work done in ${workMonth}`
      })
      .select()
      .single()

    if (creditError) {
      console.error('Database error:', creditError)
      return NextResponse.json({ error: 'Failed to mark salary as credited' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      salaryCredit
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

