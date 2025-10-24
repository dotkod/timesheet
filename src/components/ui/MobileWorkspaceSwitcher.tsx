'use client'

import { useState, useEffect } from "react"
import { useWorkspace } from "@/lib/workspace-context"
import { Building2 } from "lucide-react"

interface Workspace {
  id: string
  name: string
  slug: string
}

export function MobileWorkspaceSwitcher() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data.workspaces || [])
          
          // Find current workspace index
          if (currentWorkspace && data.workspaces) {
            const index = data.workspaces.findIndex((w: Workspace) => w.id === currentWorkspace.id)
            setCurrentIndex(index >= 0 ? index : 0)
          }
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error)
      }
    }

    fetchWorkspaces()
  }, [currentWorkspace])

  const handleWorkspaceToggle = async () => {
    if (workspaces.length <= 1) return // No need to switch if only one workspace
    
    // Calculate next workspace index
    const nextIndex = (currentIndex + 1) % workspaces.length
    const nextWorkspace = workspaces[nextIndex]
    
    // Update current workspace
    setCurrentWorkspace(nextWorkspace)
    setCurrentIndex(nextIndex)
    
    // Update URL without page reload
    const currentPath = window.location.pathname
    const newUrl = `${currentPath}?workspace=${nextWorkspace.id}`
    window.history.replaceState({}, '', newUrl)
  }

  return (
    <button
      className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:bg-muted"
      onClick={handleWorkspaceToggle}
      title={`Switch to next workspace (${workspaces.length} available)`}
    >
      <Building2 className="h-6 w-6" />
    </button>
  )
}