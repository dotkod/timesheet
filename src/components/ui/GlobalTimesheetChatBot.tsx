"use client"

import { TimesheetChatBot } from "./TimesheetChatBot"
import { useData } from "@/hooks/useData"
import { useWorkspace } from "@/lib/workspace-context"

export function GlobalTimesheetChatBot() {
  const { currentWorkspace } = useWorkspace()
  const { data: projects, loading: projectsLoading } = useData('projects')

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
