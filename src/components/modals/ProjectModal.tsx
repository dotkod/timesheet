"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit } from "lucide-react"

interface Project {
  id?: string
  name: string
  code: string
  clientId: string
  billingType: "hourly" | "fixed"
  hourlyRate: number
  fixedAmount: number
  status: "active" | "completed" | "on-hold"
  notes?: string
}

interface Client {
  id: string
  name: string
}

interface ProjectModalProps {
  project?: Project
  clients: Client[]
  onSave: (project: Project) => void
  trigger?: React.ReactNode
}

export function ProjectModal({ project, clients, onSave, trigger }: ProjectModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Project>({
    name: project?.name || "",
    code: project?.code || "",
    clientId: project?.clientId || "",
    billingType: project?.billingType || "hourly",
    hourlyRate: project?.hourlyRate || 0,
    fixedAmount: project?.fixedAmount || 0,
    status: project?.status || "active",
    notes: project?.notes || "",
    ...(project?.id && { id: project.id })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setOpen(false)
    // Reset form
    setFormData({
      name: "",
      code: "",
      clientId: "",
      billingType: "hourly",
      hourlyRate: 0,
      fixedAmount: 0,
      status: "active",
      notes: ""
    })
  }

  const handleChange = (field: keyof Project, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const defaultTrigger = project ? (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add New Project
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add New Project"}</DialogTitle>
          <DialogDescription>
            {project ? "Update the project information below." : "Enter the project details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">
                Code
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="e.g., PROJ-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">
                Client *
              </Label>
              <Select value={formData.clientId} onValueChange={(value) => handleChange("clientId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingType">
                Billing Type *
              </Label>
              <Select value={formData.billingType} onValueChange={(value) => handleChange("billingType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select billing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="fixed">Fixed Monthly Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.billingType === "hourly" && (
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">
                  Hourly Rate *
                </Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => handleChange("hourlyRate", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>
            )}
            {formData.billingType === "fixed" && (
              <div className="space-y-2">
                <Label htmlFor="fixedAmount">
                  Monthly Amount *
                </Label>
                <Input
                  id="fixedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixedAmount}
                  onChange={(e) => handleChange("fixedAmount", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="status">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                placeholder="Project description and notes..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {project ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


