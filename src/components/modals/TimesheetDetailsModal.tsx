"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, DollarSign, FileText, FolderOpen, User } from "lucide-react"
import { getCurrencySymbol } from "@/lib/excel-export"
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
}

interface TimesheetDetailsModalProps {
  timesheet: Timesheet
  workspaceSettings: any
  trigger?: React.ReactNode
}

export function TimesheetDetailsModal({ timesheet, workspaceSettings, trigger }: TimesheetDetailsModalProps) {
  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <FileText className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timesheet Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this timesheet entry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project & Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="font-medium">{timesheet.project}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Client</span>
                <Badge variant="outline">{timesheet.client}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billable</span>
                <Badge className={timesheet.billable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {timesheet.billable ? "Billable" : "Non-billable"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Time & Date Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium">{dayjs(timesheet.date).format('DD MMMM YYYY')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hours Worked</span>
                <span className="font-medium">{timesheet.hours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{timesheet.hourlyRate}/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="font-medium text-lg">{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{timesheet.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{timesheet.description}</p>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Entry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{dayjs(timesheet.createdAt).format('DD MMMM YYYY, HH:mm')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Entry ID</span>
                <span className="text-sm font-mono text-xs">{timesheet.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
