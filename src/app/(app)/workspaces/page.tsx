"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/lib/workspace-context"

interface Workspace {
  id: string
  name: string
  slug: string
  description?: string
  projects: number
  clients: number
  totalRevenue: number
  status: "active" | "inactive"
  createdAt: string
}

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace()

  const fetchWorkspaces = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workspaces')
      const data = await response.json()
      
      if (response.ok) {
        // Transform data to include stats
        const workspacesWithStats = await Promise.all(
          (data.workspaces || []).map(async (workspace: any) => {
            try {
              // Fetch projects count
              const projectsResponse = await fetch(`/api/projects?workspaceId=${workspace.id}`)
              const projectsData = await projectsResponse.json()
              const projectsCount = projectsData.projects?.length || 0

              // Fetch clients count
              const clientsResponse = await fetch(`/api/clients?workspaceId=${workspace.id}`)
              const clientsData = await clientsResponse.json()
              const clientsCount = clientsData.clients?.length || 0

              // Fetch timesheets for revenue calculation
              const timesheetsResponse = await fetch(`/api/timesheets?workspaceId=${workspace.id}`)
              const timesheetsData = await timesheetsResponse.json()
              const totalRevenue = timesheetsData.timesheets
                ?.filter((t: any) => t.billable)
                .reduce((sum: number, t: any) => sum + t.total, 0) || 0

              return {
                id: workspace.id,
                name: workspace.name,
                slug: workspace.slug,
                description: workspace.description,
                projects: projectsCount,
                clients: clientsCount,
                totalRevenue,
                status: "active" as const,
                createdAt: workspace.created_at
              }
            } catch (error) {
              console.error(`Error fetching stats for workspace ${workspace.id}:`, error)
              return {
                id: workspace.id,
                name: workspace.name,
                slug: workspace.slug,
                description: workspace.description,
                projects: 0,
                clients: 0,
                totalRevenue: 0,
                status: "active" as const,
                createdAt: workspace.created_at
              }
            }
          })
        )
        
        setWorkspaces(workspacesWithStats)
        setError("")
      } else {
        setError(data.error || "Failed to fetch workspaces")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const handleSwitchWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
            <p className="text-muted-foreground">Loading workspaces...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and switch between them.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workspaces.map((workspace) => (
          <Card 
            key={workspace.id} 
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              currentWorkspace?.id === workspace.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSwitchWorkspace(workspace)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{workspace.name}</CardTitle>
                  <CardDescription>{workspace.slug}</CardDescription>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${
                    workspace.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {workspace.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workspace.description && (
                  <p className="text-sm text-muted-foreground">{workspace.description}</p>
                )}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{workspace.projects}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{workspace.clients}</div>
                    <div className="text-xs text-muted-foreground">Clients</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">${workspace.totalRevenue.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(workspace.createdAt).toLocaleDateString()}
                </div>
                {currentWorkspace?.id === workspace.id && (
                  <div className="text-sm font-medium text-primary">
                    ✓ Current workspace
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}