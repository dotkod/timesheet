"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Workspace {
  id: string
  name: string
  slug: string
  description?: string
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace) => void
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Function to update URL with workspace parameter
  const updateUrlWithWorkspace = (workspaceId: string) => {
    const currentPath = window.location.pathname
    const newUrl = `${currentPath}?workspace=${workspaceId}`
    router.replace(newUrl)
  }

  // Function to get workspace from URL or localStorage
  const getInitialWorkspace = (workspaces: Workspace[]): Workspace | null => {
    // First, try to get from URL parameter
    const urlWorkspaceId = searchParams.get('workspace')
    if (urlWorkspaceId) {
      const workspace = workspaces.find(w => w.id === urlWorkspaceId)
      if (workspace) {
        // Save to localStorage for persistence
        localStorage.setItem('selectedWorkspaceId', workspace.id)
        return workspace
      }
    }

    // Second, try to get from localStorage
    const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId')
    if (savedWorkspaceId) {
      const workspace = workspaces.find(w => w.id === savedWorkspaceId)
      if (workspace) {
        // Update URL to match localStorage
        updateUrlWithWorkspace(workspace.id)
        return workspace
      }
    }

    // Finally, default to first workspace
    if (workspaces.length > 0) {
      const firstWorkspace = workspaces[0]
      localStorage.setItem('selectedWorkspaceId', firstWorkspace.id)
      updateUrlWithWorkspace(firstWorkspace.id)
      return firstWorkspace
    }

    return null
  }

  // Enhanced setCurrentWorkspace function
  const handleSetCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    localStorage.setItem('selectedWorkspaceId', workspace.id)
    updateUrlWithWorkspace(workspace.id)
  }

  useEffect(() => {
    // Load workspaces from API
    const loadWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data.workspaces || [])
          
          // Set workspace based on URL, localStorage, or default
          if (!currentWorkspace && data.workspaces?.length > 0) {
            const initialWorkspace = getInitialWorkspace(data.workspaces)
            setCurrentWorkspace(initialWorkspace)
          }
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWorkspaces()
  }, [])

  // Listen for URL changes (when user navigates with workspace parameter)
  useEffect(() => {
    if (workspaces.length > 0) {
      const urlWorkspaceId = searchParams.get('workspace')
      if (urlWorkspaceId && currentWorkspace?.id !== urlWorkspaceId) {
        const workspace = workspaces.find(w => w.id === urlWorkspaceId)
        if (workspace) {
          setCurrentWorkspace(workspace)
          localStorage.setItem('selectedWorkspaceId', workspace.id)
        }
      }
    }
  }, [searchParams, workspaces, currentWorkspace])

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace,
      setCurrentWorkspace: handleSetCurrentWorkspace,
      workspaces,
      setWorkspaces,
      loading
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}


