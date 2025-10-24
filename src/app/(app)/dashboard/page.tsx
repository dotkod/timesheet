"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/lib/workspace-context"
import { exportTimesheetsToExcel, getCurrencySymbol } from "@/lib/excel-export"

interface DashboardStats {
  totalHours: number
  activeProjects: number
  pendingInvoices: number
  monthlyRevenue: number
}

interface RecentTimesheet {
  id: string
  date: string
  project: string
  client: string
  hours: number
  description: string
  billable: boolean
  hourlyRate: number
  total: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalHours: 0,
    activeProjects: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0
  })
  const [recentTimesheets, setRecentTimesheets] = useState<RecentTimesheet[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const { currentWorkspace } = useWorkspace()

  const fetchDashboardData = async () => {
    if (!currentWorkspace) return

    try {
      setLoading(true)
      
      // Fetch timesheets for stats
      const timesheetsResponse = await fetch(`/api/timesheets?workspaceId=${currentWorkspace.id}`)
      const timesheetsData = await timesheetsResponse.json()
      
      // Fetch projects for stats
      const projectsResponse = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const projectsData = await projectsResponse.json()
      
      if (timesheetsResponse.ok && projectsResponse.ok) {
        const timesheets = timesheetsData.timesheets || []
        const projects = projectsData.projects || []
        
        // Calculate stats
        const totalHours = timesheets.reduce((sum: number, t: any) => sum + t.hours, 0)
        const activeProjects = projects.filter((p: any) => p.status === 'active').length
        const monthlyRevenue = timesheets
          .filter((t: any) => t.billable)
          .reduce((sum: number, t: any) => sum + t.total, 0)
        
        setStats({
          totalHours,
          activeProjects,
          pendingInvoices: 0, // Will implement invoices later
          monthlyRevenue
        })
        
        // Get recent timesheets (last 5)
        setRecentTimesheets(timesheets.slice(0, 5).map((t: any) => ({
          id: t.id,
          date: t.date,
          project: t.project,
          client: t.client,
          hours: t.hours,
          description: t.description,
          billable: t.billable,
          hourlyRate: t.hourlyRate,
          total: t.total
        })))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportTimesheets = () => {
    if (recentTimesheets.length === 0) {
      console.log("No timesheets to export")
      return
    }
    
    const result = exportTimesheetsToExcel(recentTimesheets)
    if (result.success) {
      console.log(`Exported ${recentTimesheets.length} timesheets to ${result.filename}`)
    } else {
      console.error(result.error || "Failed to export timesheets")
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
    fetchDashboardData()
    fetchWorkspaceSettings()
  }, [currentWorkspace])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your timesheets, projects, and invoices.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              All time logged
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCurrencySymbol(workspaceSettings.currency || 'MYR')} {stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From billable hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Timesheets - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>
            Your latest time entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTimesheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No timesheets found. Start logging time to see your activity here.
            </div>
          ) : (
            <div className="space-y-4">
              {recentTimesheets.map((timesheet) => (
                <div key={timesheet.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{timesheet.project}</p>
                    <p className="text-xs text-muted-foreground">
                      {timesheet.client} • {timesheet.date}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {timesheet.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{timesheet.hours}h</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}