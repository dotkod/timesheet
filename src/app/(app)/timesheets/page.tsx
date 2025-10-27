"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimesheetModal } from "@/components/modals/TimesheetModal"
import { TimesheetDetailsModal } from "@/components/modals/TimesheetDetailsModal"
import { DeleteModal } from "@/components/modals/DeleteModal"
import { useWorkspace } from "@/lib/workspace-context"
import { exportTimesheetsToExcel, getCurrencySymbol } from "@/lib/excel-export"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dayjs from "dayjs"

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
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const [dateFilter, setDateFilter] = useState<string>("all")
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

  // Filter timesheets based on selected date filter
  useEffect(() => {
    if (dateFilter === "all") {
      setFilteredTimesheets(timesheets)
      return
    }

    const now = dayjs()
    const filtered = timesheets.filter((timesheet) => {
      const timesheetDate = dayjs(timesheet.date)
      
      if (dateFilter === "today") {
        return timesheetDate.isSame(now, 'day')
      } else if (dateFilter === "this-week") {
        return timesheetDate.isSame(now, 'week')
      } else if (dateFilter === "this-month") {
        return timesheetDate.isSame(now, 'month')
      } else if (dateFilter === "last-month") {
        return timesheetDate.isSame(now.subtract(1, 'month'), 'month')
      } else {
        return true
      }
    })

    setFilteredTimesheets(filtered)
  }, [timesheets, dateFilter])

  const handleSaveTimesheet = async (timesheetData: any) => {
    try {
      setError("") // Clear any previous errors
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
    const timesheetsToExport = dateFilter === "all" ? timesheets : filteredTimesheets
    
    if (timesheetsToExport.length === 0) {
      setError("No timesheets to export")
      return
    }
    
    const result = exportTimesheetsToExcel(timesheetsToExport)
    if (result.success) {
      console.log(`Exported ${timesheetsToExport.length} timesheets to ${result.filename}`)
    } else {
      setError(result.error || "Failed to export timesheets")
    }
  }

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format('HH:mm')
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
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Track your time and manage timesheet entries.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All timesheets</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This week</SelectItem>
              <SelectItem value="this-month">This month</SelectItem>
              <SelectItem value="last-month">Last month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToExcel} className="w-full sm:w-auto">
            Export Excel
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTimesheets.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {timesheets.length === 0 
                  ? "No timesheets found. Create your first timesheet entry to get started."
                  : "No timesheets found for the selected filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTimesheets.map((timesheet) => (
            <Card key={timesheet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Header with project name and dropdown */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{timesheet.project}</h3>
                      <p className="text-xs text-muted-foreground truncate">{timesheet.client}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 -mt-1 -mr-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="cursor-pointer" asChild>
                          <TimesheetDetailsModal 
                            timesheet={timesheet} 
                            workspaceSettings={workspaceSettings}
                            trigger={
                              <span className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </span>
                            }
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" asChild>
                          <TimesheetModal 
                            timesheet={timesheet} 
                            projects={projects}
                            onSave={handleSaveTimesheet}
                            trigger={
                              <span className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                              </span>
                            }
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" asChild>
                          <DeleteModal
                            itemType="Timesheet"
                            itemName={`${timesheet.project} - ${timesheet.date}`}
                            onConfirm={() => handleDeleteTimesheet(timesheet.id)}
                            trigger={
                              <span className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </span>
                            }
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{timesheet.description}</p>

                  {/* Date, hours, and billable status */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{timesheet.date}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="text-muted-foreground">{formatTime(timesheet.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {timesheet.billable && (
                        <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0 h-4">Billable</Badge>
                      )}
                      <span className="font-medium">{timesheet.hours}h</span>
                    </div>
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