"use client"

import { TimesheetChatBot } from "./TimesheetChatBot"
import { useData } from "@/hooks/useData"
import { useWorkspace } from "@/lib/workspace-context"

export function GlobalTimesheetChatBot() {
  const { currentWorkspace } = useWorkspace()
  
  const fetchProjects = async () => {
    const response = await fetch(`/api/projects?workspaceId=${currentWorkspace?.id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    const data = await response.json()
    // Transform projects to match TimesheetChatBot expected structure
    return (data.projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      client: {
        name: p.client || 'No Client'
      },
      billingType: p.billingType,
      fixedAmount: p.fixedAmount
    }))
  }
  
  const { data: projects, loading: projectsLoading } = useData('projects', fetchProjects)

  // Don't render if no workspace or projects are loading
  if (!currentWorkspace || projectsLoading) {
    return null
  }

  const handleSaveTimesheet = async (timesheetData: any) => {
    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...timesheetData,
          workspaceId: currentWorkspace.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save timesheet')
      }

      // Refresh the page to show the new timesheet
      window.location.reload()
    } catch (error) {
      console.error('Error saving timesheet:', error)
    }
  }

  return (
    <div className="hidden md:block">
      <TimesheetChatBot projects={projects || []} onSave={handleSaveTimesheet} />
    </div>
  )
}
