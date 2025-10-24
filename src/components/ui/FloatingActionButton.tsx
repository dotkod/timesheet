"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TimesheetModal } from "@/components/modals/TimesheetModal"
import { useWorkspace } from "@/lib/workspace-context"

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
}

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const { currentWorkspace } = useWorkspace()

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects()
    }
  }, [currentWorkspace])

  const fetchProjects = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (timesheetData: any) => {
    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...timesheetData,
          workspaceId: currentWorkspace?.id
        })
      })
      
      if (response.ok) {
        setOpen(false)
        // Refresh the page to show new timesheet
        window.location.reload()
      } else {
        const data = await response.json()
        console.error('Failed to save timesheet:', data.error)
      }
    } catch (error) {
      console.error('Network error:', error)
    }
  }

  // Don't show FAB if no workspace or still loading
  if (!currentWorkspace || loading) {
    return null
  }

  return (
    <TimesheetModal 
      projects={projects}
      onSave={handleSave}
      trigger={
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      }
    />
  )
}
