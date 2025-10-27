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

        <div className="space-y-4">
          {/* Key Information - Compact Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Project</span>
              <p className="font-medium">{timesheet.project}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Client</span>
              <p className="font-medium">{timesheet.client}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date</span>
              <p className="font-medium">{dayjs(timesheet.date).format('DD MMM YYYY')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Hours</span>
              <p className="font-medium">{timesheet.hours}h</p>
            </div>
            <div>
              <span className="text-muted-foreground">Rate</span>
              <p className="font-medium">{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{timesheet.hourlyRate}/h</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total</span>
              <p className="font-medium text-lg">{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{timesheet.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge className={timesheet.billable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {timesheet.billable ? "Billable" : "Non-billable"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Created: {dayjs(timesheet.createdAt).format('DD MMM YY, HH:mm')}
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium mb-1">Description</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{timesheet.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
