'use client'

import { useState, useEffect } from "react"
import { useWorkspace } from "@/lib/workspace-context"
import { ChevronDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Workspace {
  id: string
  name: string
  slug: string
}

export function MobileWorkspaceSwitcher() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data.workspaces || [])
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error)
      }
    }

    fetchWorkspaces()
  }, [])

  const handleMouseDown = () => {
    setIsHolding(true)
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 500) // 500ms hold to open
    setHoldTimer(timer)
  }

  const handleMouseUp = () => {
    setIsHolding(false)
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }
  }

  const handleTouchStart = () => {
    setIsHolding(true)
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 500) // 500ms hold to open
    setHoldTimer(timer)
  }

  const handleTouchEnd = () => {
    setIsHolding(false)
    if (holdTimer) {
      clearTimeout(holdTimer)
      setHoldTimer(null)
    }
  }

  const handleWorkspaceChange = async (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    setIsOpen(false)
    
    // Refresh the page to load new workspace data
    window.location.reload()
  }

  return (
    <div className="relative">
      {/* Workspace Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`w-10 h-10 rounded-lg transition-all duration-200 ${
          isHolding ? 'scale-110 bg-primary/20' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Building2 className="h-6 w-6" />
      </Button>

      {/* Workspace Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <Card className="min-w-48 p-2 shadow-lg">
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                Switch Workspace
              </div>
              {workspaces.map((workspace) => (
                <Button
                  key={workspace.id}
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start text-sm ${
                    currentWorkspace?.id === workspace.id ? 'bg-primary/10 text-primary' : ''
                  }`}
                  onClick={() => handleWorkspaceChange(workspace)}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {workspace.name}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
