"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit } from "lucide-react"

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
    hours: timesheet?.hours || 0,
    description: timesheet?.description || "",
    billable: timesheet?.billable ?? true,
    ...(timesheet?.id && { id: timesheet.id })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setOpen(false)
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      projectId: "",
      hours: 0,
      description: "",
      billable: true
    })
  }

  const handleChange = (field: keyof Timesheet, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{timesheet ? "Edit Timesheet Entry" : "Add New Timesheet Entry"}</DialogTitle>
          <DialogDescription>
            {timesheet ? "Update the timesheet entry below." : "Enter your time tracking details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project *
              </Label>
              <Select value={formData.projectId} onValueChange={(value) => handleChange("projectId", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hours" className="text-right">
                Hours *
              </Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={formData.hours}
                onChange={(e) => handleChange("hours", parseFloat(e.target.value) || 0)}
                className="col-span-3"
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="What did you work on?"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="billable" className="text-right">
                Billable
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  id="billable"
                  type="checkbox"
                  checked={formData.billable}
                  onChange={(e) => handleChange("billable", e.target.checked)}
                  className="rounded border border-input"
                />
                <Label htmlFor="billable" className="text-sm font-normal">
                  This time entry is billable to the client
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {timesheet ? "Update Entry" : "Create Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


