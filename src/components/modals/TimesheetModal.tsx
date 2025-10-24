"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Clock, Calendar, FolderOpen, FileText, DollarSign } from "lucide-react"

interface Timesheet {
  id?: string
  date: string
  projectId: string
  hours: number
  description: string
  billable: boolean
}

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
  billingType?: "hourly" | "fixed"
  fixedAmount?: number
}

interface TimesheetModalProps {
  timesheet?: Timesheet
  projects: Project[]
  onSave: (timesheet: Timesheet) => void
  trigger?: React.ReactNode
}

export function TimesheetModal({ timesheet, projects, onSave, trigger }: TimesheetModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Timesheet>({
    date: timesheet?.date || new Date().toISOString().split('T')[0],
    projectId: timesheet?.projectId || "",
    hours: timesheet?.hours || 1,
    description: timesheet?.description || "",
    billable: timesheet?.billable ?? false,
    ...(timesheet?.id && { id: timesheet.id })
  })

  // Handle initial state for fixed projects when editing
  useEffect(() => {
    if (timesheet?.projectId) {
      const project = projects.find(p => p.id === timesheet.projectId)
      if (project?.billingType === 'fixed') {
        setFormData(prev => ({ ...prev, billable: false }))
      }
    }
  }, [timesheet?.projectId, projects])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure hours is at least 0.25 if it's 0
    const dataToSave = {
      ...formData,
      hours: formData.hours === 0 ? 0.25 : formData.hours
    }
    
    onSave(dataToSave)
    setOpen(false)
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      projectId: "",
      hours: 1,
      description: "",
      billable: false
    })
  }

  const handleChange = (field: keyof Timesheet, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // If project changed, check if it's a fixed monthly project
      if (field === 'projectId') {
        const selectedProject = projects.find(p => p.id === value)
        if (selectedProject?.billingType === 'fixed') {
          newData.billable = false // Fixed projects are not billable per timesheet
        }
      }
      
      return newData
    })
  }

  // Get selected project to check billing type
  const selectedProject = projects.find(p => p.id === formData.projectId)
  const isFixedProject = selectedProject?.billingType === 'fixed'

  const defaultTrigger = timesheet ? (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add New Entry
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {timesheet ? "Edit Timesheet Entry" : "Add New Timesheet Entry"}
          </DialogTitle>
          <DialogDescription>
            {timesheet ? "Update your time tracking details below." : "Track your work hours and activities."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-hidden">
          
          {/* Date and Project Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 overflow-hidden">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
                className="h-11 w-full max-w-full"
                autoFocus={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Project *
              </Label>
              <Select value={formData.projectId} onValueChange={(value) => handleChange("projectId", value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-xs text-muted-foreground">{project.client.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hours and Billable Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hours *
              </Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={formData.hours}
                onChange={(e) => handleChange("hours", parseFloat(e.target.value) || 1)}
                placeholder="1.00"
                required
                className="h-11 w-full min-w-0"
                autoFocus={false}
              />
              <p className="text-xs text-muted-foreground">Enter hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)</p>
            </div>
            {/* Only show billable status for hourly projects */}
            {!isFixedProject && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Billable Status
                </Label>
                <Card className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Billable to Client</p>
                        <p className="text-xs text-muted-foreground">This time entry will be included in invoices</p>
                      </div>
                      <Switch
                        checked={formData.billable}
                        onCheckedChange={(checked) => handleChange("billable", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              placeholder="Describe what you worked on... (e.g., 'Fixed login bug', 'Implemented user dashboard', 'Code review')"
              required
              className="resize-none w-full"
              autoFocus={false}
            />
            <p className="text-xs text-muted-foreground">Be specific about the work completed</p>
          </div>

          {/* Quick Hours Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Hours</Label>
            <div className="flex gap-2 flex-wrap">
              {[0.5, 1, 1.5, 2, 4, 8].map((hours) => (
                <Button
                  key={hours}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleChange("hours", hours)}
                  className="text-xs"
                >
                  {hours}h
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto min-w-[120px]">
              {timesheet ? "Update Entry" : "Create Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


