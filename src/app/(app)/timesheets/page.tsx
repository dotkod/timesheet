"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimesheetModal } from "@/components/modals/TimesheetModal"
import { DeleteModal } from "@/components/modals/DeleteModal"
import { useWorkspace } from "@/lib/workspace-context"
import { exportTimesheetsToExcel, getCurrencySymbol } from "@/lib/excel-export"

interface Timesheet {
  id: string
  date: string
  projectId: string
  project: string
  client: string
  hours: number
  description: string
  billable: boolean
  hourlyRate: number
  total: number
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
}

export default function Timesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const { currentWorkspace } = useWorkspace()

  const fetchTimesheets = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/timesheets?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setTimesheets(data.timesheets || [])
        setError("")
      } else {
        setError(data.error || "Failed to fetch timesheets")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    if (!currentWorkspace) return
    
    try {
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        // Transform projects data to match TimesheetModal interface
        const transformedProjects = data.projects?.map((p: any) => ({
          id: p.id,
          name: p.name,
          client: {
            name: p.client
          }
        })) || []
        setProjects(transformedProjects)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
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
    fetchTimesheets()
    fetchProjects()
    fetchWorkspaceSettings()
  }, [currentWorkspace])

  const handleSaveTimesheet = async (timesheetData: any) => {
    try {
      const method = timesheetData.id ? 'PUT' : 'POST'
      
      const response = await fetch('/api/timesheets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...timesheetData,
          workspaceId: currentWorkspace?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchTimesheets() // Refresh the list
      } else {
        setError(data.error || "Failed to save timesheet")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleDeleteTimesheet = async (timesheetId: string) => {
    try {
      const response = await fetch(`/api/timesheets?id=${timesheetId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchTimesheets() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete timesheet")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const exportToExcel = () => {
    if (timesheets.length === 0) {
      setError("No timesheets to export")
      return
    }
    
    const result = exportTimesheetsToExcel(timesheets)
    if (result.success) {
      console.log(`Exported ${timesheets.length} timesheets to ${result.filename}`)
    } else {
      setError(result.error || "Failed to export timesheets")
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
            <p className="text-muted-foreground">Loading timesheets...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Track your time and manage timesheet entries.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={exportToExcel} className="w-full sm:w-auto">
            Export Excel
          </Button>
          <TimesheetModal projects={projects} onSave={handleSaveTimesheet} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {timesheets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No timesheets found. Create your first timesheet entry to get started.</p>
            </CardContent>
          </Card>
        ) : (
          timesheets.map((timesheet) => (
            <Card key={timesheet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{timesheet.project}</h3>
                      <Badge variant="outline">{timesheet.client}</Badge>
                      {timesheet.billable && (
                        <Badge className="bg-green-100 text-green-800">Billable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{timesheet.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Date: {timesheet.date}</span>
                      <span>Hours: {timesheet.hours}</span>
                      <span>Rate: {getCurrencySymbol(workspaceSettings.currency || 'MYR')} {timesheet.hourlyRate}/h</span>
                      <span className="font-medium text-foreground">Total: {getCurrencySymbol(workspaceSettings.currency || 'MYR')} {timesheet.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TimesheetModal 
                      timesheet={timesheet} 
                      projects={projects}
                      onSave={handleSaveTimesheet}
                      trigger={
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <DeleteModal
                      itemType="Timesheet"
                      itemName={`${timesheet.project} - ${timesheet.date}`}
                      onConfirm={() => handleDeleteTimesheet(timesheet.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}