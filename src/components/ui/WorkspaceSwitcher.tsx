"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentWorkspace, setCurrentWorkspace, workspaces, loading } = useWorkspace()

  const handleWorkspaceSelect = (workspace: any) => {
    setCurrentWorkspace(workspace)
    setIsOpen(false)
    console.log("Switching to workspace:", workspace.name)
  }

  if (loading || !currentWorkspace) {
    return (
      <Button variant="outline" size="sm" disabled className="min-w-[180px]">
        Loading...
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[180px] max-w-[250px] justify-between"
      >
        <div className="text-left truncate py-1">
          <div className="font-medium text-sm truncate mb-0.5">{currentWorkspace.name}</div>
          <div className="text-xs text-muted-foreground truncate">{currentWorkspace.slug}</div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full right-0 mt-2 z-20 w-80 max-w-[calc(100vw-2rem)] shadow-lg">
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b mb-2">
                Switch Workspace
              </div>
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  className={`w-full text-left p-3 rounded-md hover:bg-muted transition-colors ${
                    currentWorkspace.id === workspace.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="font-medium text-sm truncate">{workspace.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {workspace.description}
                  </div>
                  {currentWorkspace.id === workspace.id && (
                    <div className="text-xs text-primary mt-1 font-medium">
                      Current workspace
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
