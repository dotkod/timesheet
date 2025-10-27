"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/lib/workspace-context"
import { getCurrencySymbol } from "@/lib/excel-export"
import dayjs from "dayjs"
import { CheckCircle2, Clock, DollarSign } from "lucide-react"

interface SalaryCredit {
  id: string
  projectId: string
  projectName: string
  workMonth: string
  creditedDate: string
  amount: number
  notes?: string
}

export default function Payments() {
  const [credits, setCredits] = useState<SalaryCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const { currentWorkspace } = useWorkspace()

  const fetchCredits = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      // First, get all fixed projects
      const projectsResponse = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const projectsData = await projectsResponse.json()
      const fixedProjects = projectsData.projects?.filter((p: any) => p.billingType === 'fixed') || []
      const projectIds = fixedProjects.map((p: any) => p.id)
      
      if (projectIds.length === 0) {
        setCredits([])
        setLoading(false)
        return
      }

      const response = await fetch(`/api/salary-credits?projectIds=${projectIds.join(',')}`)
      const data = await response.json()
      
      if (response.ok) {
        // Enrich with project names
        const enrichedCredits = (data.credits || []).map((credit: any) => {
          const project = fixedProjects.find((p: any) => p.id === credit.project_id)
          return {
            id: credit.id,
            projectId: credit.project_id,
            projectName: project?.name || 'Unknown Project',
            workMonth: credit.work_month,
            creditedDate: credit.credited_date,
            amount: credit.amount,
            notes: credit.notes
          }
        })
        setCredits(enrichedCredits.sort((a: any, b: any) => 
          dayjs(b.creditedDate).valueOf() - dayjs(a.creditedDate).valueOf()
        ))
        setError("")
      } else {
        setError(data.error || "Failed to fetch payments")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
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
    fetchCredits()
    fetchWorkspaceSettings()
  }, [currentWorkspace])

  // Calculate totals
  const totalCredited = credits.reduce((sum, c) => sum + (c.amount || 0), 0)
  const thisMonthCredited = credits.filter(c => {
    const creditedDate = dayjs(c.creditedDate)
    return creditedDate.isSame(dayjs(), 'month')
  }).reduce((sum, c) => sum + (c.amount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground">Loading payment records...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">
            Track your monthly salary and payment credits.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credited</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCurrencySymbol(workspaceSettings.currency || 'MYR')} {totalCredited.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time credited payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCurrencySymbol(workspaceSettings.currency || 'MYR')} {thisMonthCredited.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Credited this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits.length}</div>
            <p className="text-xs text-muted-foreground">
              Credit records
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Payment Records */}
      <div className="space-y-4">
        {credits.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No payment records found. Mark your salary as credited to see records here.
              </p>
            </CardContent>
          </Card>
        ) : (
          credits.map((credit) => (
            <Card key={credit.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{credit.projectName}</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Credited
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex gap-4">
                        <span>Work Month: {dayjs(credit.workMonth).format('MMMM YYYY')}</span>
                        <span>•</span>
                        <span>Credited: {dayjs(credit.creditedDate).format('D MMM YYYY')}</span>
                      </div>
                      {credit.notes && (
                        <p className="text-xs italic">{credit.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {getCurrencySymbol(workspaceSettings.currency || 'MYR')} {credit.amount.toFixed(2)}
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

