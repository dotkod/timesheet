"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, FolderOpen, User, DollarSign, Clock, Calendar, FileText } from "lucide-react"
import dayjs from "dayjs"

interface Project {
  id: string
  name: string
  code: string
  client: string
  billingType: "hourly" | "fixed"
  hourlyRate: number
  fixedAmount: number
  status: "active" | "completed" | "on-hold" | "cancelled"
  notes?: string
  totalHours: number
  totalRevenue: number
  lastActivity: string
  createdAt: string
  updatedAt: string
}

interface ProjectDetailsModalProps {
  project: Project
  trigger?: React.ReactNode
}

export function ProjectDetailsModal({ project, trigger }: ProjectDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" />View Details</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Project Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {project.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
              {project.code && (
                <p className="text-sm text-muted-foreground mt-1">Code: {project.code}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge className={`${getStatusColor(project.status)}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
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
          </div>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{project.client}</span>
              </div>
            </CardContent>
          </Card>

          {/* Project Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {project.billingType === 'fixed' ? 'Monthly Amount' : 'Hourly Rate'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  RM {project.billingType === 'fixed' ? project.fixedAmount.toFixed(2) : project.hourlyRate.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {project.billingType === 'fixed' ? 'Per month' : 'Per hour'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Total Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.totalHours.toFixed(1)}h</div>
                <p className="text-sm text-muted-foreground">Logged hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RM {project.totalRevenue.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Total revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Activity:</span>
                <span className="text-sm font-medium">{project.lastActivity ? dayjs(project.lastActivity).format('DD MMMM YYYY') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm font-medium">{dayjs(project.createdAt).format('DD MMMM YYYY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated:</span>
                <span className="text-sm font-medium">{dayjs(project.updatedAt).format('DD MMMM YYYY')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {project.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
