"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProjectModal } from "@/components/modals/ProjectModal"
import { ProjectDetailsModal } from "@/components/modals/ProjectDetailsModal"
import { DeleteModal } from "@/components/modals/DeleteModal"
import { useWorkspace } from "@/lib/workspace-context"
import { exportProjectsToExcel, getCurrencySymbol } from "@/lib/excel-export"
import dayjs from "dayjs"
import { CheckCircle2 } from "lucide-react"

interface Project {
  id: string
  name: string
  code: string
  clientId: string
  client: string
  billingType: "hourly" | "fixed"
  hourlyRate: number
  fixedAmount: number
  status: "active" | "completed" | "on-hold"
  notes?: string
  salaryCreditedDate?: string
  totalHours: number
  totalRevenue: number
  lastActivity: string
  createdAt: string
  updatedAt: string
}

interface Client {
  id: string
  name: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const { currentWorkspace } = useWorkspace()

  const fetchProjects = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setProjects(data.projects || [])
        setError("")
      } else {
        setError(data.error || "Failed to fetch projects")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/clients?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchWorkspaceSettings = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/workspace-settings?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setWorkspaceSettings(data.settings || {})
      }
    } catch (error) {
      console.error('Failed to fetch workspace settings:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchClients()
    fetchWorkspaceSettings()
  }, [currentWorkspace])

  const handleSaveProject = async (projectData: any) => {
    try {
      const method = projectData.id ? 'PUT' : 'POST'
      
      const response = await fetch('/api/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          workspaceId: currentWorkspace?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchProjects() // Refresh the list
      } else {
        setError(data.error || "Failed to save project")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchProjects() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete project")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const exportToExcel = () => {
    if (projects.length === 0) {
      setError("No projects to export")
      return
    }
    
    const result = exportProjectsToExcel(projects)
    if (result.success) {
      console.log(`Exported ${projects.length} projects to ${result.filename}`)
    } else {
      setError(result.error || "Failed to export projects")
    }
  }

  const handleMarkSalaryCredited = async (projectId: string) => {
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const response = await fetch('/api/projects/mark-credited', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          creditedDate: today
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchProjects() // Refresh the list
      } else {
        setError(data.error || "Failed to mark salary as credited")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track their progress.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={exportToExcel} className="w-full sm:w-auto">
            Export Excel
          </Button>
          <ProjectModal clients={clients} onSave={handleSaveProject} />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No projects found. Create your first project to get started.</p>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{project.code}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {project.status}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`${
                        project.billingType === 'fixed' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {project.billingType === 'fixed' ? 'Fixed Monthly' : 'Hourly'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{project.client}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Billing:</span>
                    <span className="font-medium">
                      {project.billingType === 'fixed' 
                        ? `${getCurrencySymbol(workspaceSettings.currency || 'MYR')} ${project.fixedAmount}/month`
                        : `${getCurrencySymbol(workspaceSettings.currency || 'MYR')} ${project.hourlyRate}/h`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hours:</span>
                    <span className="font-medium">{project.totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-medium">{getCurrencySymbol(workspaceSettings.currency || 'MYR')} {project.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Activity:</span>
                    <span className="font-medium">{project.lastActivity ? dayjs(project.lastActivity).format('DD MMMM YYYY') : 'N/A'}</span>
                  </div>
                  
                </div>
                <div className="flex gap-2 mt-4">
                  <ProjectDetailsModal 
                    project={project}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    }
                  />
                  <ProjectModal 
                    project={project} 
                    clients={clients}
                    onSave={handleSaveProject}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                    }
                  />
                  <DeleteModal
                    itemType="Project"
                    itemName={project.name}
                    onConfirm={() => handleDeleteProject(project.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}