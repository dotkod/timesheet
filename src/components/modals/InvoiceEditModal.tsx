"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Calendar, DollarSign, FileText, Clock, FolderOpen } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"
import { getCurrencySymbol } from "@/lib/excel-export"
import { Editor } from '@tinymce/tinymce-react'

interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  client: string
  templateId: string
  dateIssued: string
  dueDate: string
  description: string
  notes: string
  subtotal: number
  tax: number
  total: number
  status: string
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

interface Project {
  id: string
  name: string
  clientId: string
  hourlyRate: number
  billingType: string
  fixedAmount: number
}

interface Timesheet {
  id: string
  projectId: string
  projectName: string
  clientName: string
  date: string
  hours: number
  description: string
  billable: boolean
  hourlyRate: number
  total: number
}

interface InvoiceTemplate {
  id: string
  name: string
  isDefault: boolean
}

interface InvoiceEditModalProps {
  invoice: Invoice
  onSave: (invoice: Invoice) => void
  trigger?: React.ReactNode
}

export function InvoiceEditModal({ invoice, onSave, trigger }: InvoiceEditModalProps) {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const [selectedClient, setSelectedClient] = useState<string>(invoice.clientId)
  const [selectedTemplate, setSelectedTemplate] = useState<string>(invoice.templateId)
  const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [invoiceData, setInvoiceData] = useState({
    dateIssued: invoice.dateIssued,
    dueDate: invoice.dueDate,
    description: invoice.description,
    notes: invoice.notes,
    status: invoice.status
  })
  const { currentWorkspace } = useWorkspace()

  const fetchClients = async () => {
    if (!currentWorkspace) return
    try {
      const response = await fetch(`/api/clients?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      if (response.ok) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchProjects = async () => {
    if (!currentWorkspace) return
    try {
      const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      if (response.ok) {
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchTimesheets = async () => {
    if (!currentWorkspace) return
    try {
      const response = await fetch(`/api/timesheets?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      if (response.ok) {
        setTimesheets(data.timesheets || [])
      }
    } catch (error) {
      console.error('Failed to fetch timesheets:', error)
    }
  }

  const fetchTemplates = async () => {
    if (!currentWorkspace) return
    try {
      const response = await fetch(`/api/invoice-templates?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      if (response.ok) {
        setTemplates(data.templates || [])
        // Auto-select default template if none selected
        if (!selectedTemplate && data.templates?.length > 0) {
          const defaultTemplate = data.templates.find((t: InvoiceTemplate) => t.isDefault) || data.templates[0]
          setSelectedTemplate(defaultTemplate.id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
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
    if (currentWorkspace && open) {
      fetchClients()
      fetchProjects()
      fetchTimesheets()
      fetchTemplates()
      fetchWorkspaceSettings()
    }
  }, [currentWorkspace, open])

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    // Filter timesheets and projects for selected client
    const clientTimesheets = timesheets.filter(t => t.clientName === clients.find(c => c.id === clientId)?.name)
    const clientProjects = projects.filter(p => p.clientId === clientId)
    
    // Reset selections when client changes
    setSelectedTimesheets([])
    setSelectedProjects([])
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleTimesheetToggle = (timesheetId: string) => {
    setSelectedTimesheets(prev => 
      prev.includes(timesheetId) 
        ? prev.filter(id => id !== timesheetId)
        : [...prev, timesheetId]
    )
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const calculateTotals = () => {
    const selectedTimesheetData = timesheets.filter(t => selectedTimesheets.includes(t.id))
    const selectedProjectData = projects.filter(p => selectedProjects.includes(p.id))
    
    const timesheetSubtotal = selectedTimesheetData.reduce((sum, t) => sum + t.total, 0)
    const fixedSubtotal = selectedProjectData.reduce((sum, p) => sum + (p.fixedAmount || 0), 0)
    const subtotal = timesheetSubtotal + fixedSubtotal
    const taxRate = parseFloat(workspaceSettings.taxRate || '0')
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  const handleSave = () => {
    const { subtotal, tax, total } = calculateTotals()
    
    const updatedInvoice = {
      ...invoice,
      ...invoiceData,
      clientId: selectedClient,
      templateId: selectedTemplate,
      subtotal,
      tax,
      total
    }
    
    onSave(updatedInvoice)
    setOpen(false)
  }

  const selectedClientData = clients.find(c => c.id === selectedClient)
  const clientTimesheets = timesheets.filter(t => t.clientName === selectedClientData?.name)
  const clientProjects = projects.filter(p => p.clientId === selectedClient)
  const { subtotal, tax, total } = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">Edit</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Invoice
          </DialogTitle>
          <DialogDescription>
            Update invoice details and information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client and Template Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClient} onValueChange={handleClientChange}>
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
              <Label htmlFor="template">Invoice Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateIssued" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Issued
              </Label>
              <Input
                id="dateIssued"
                type="date"
                value={invoiceData.dateIssued}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dateIssued: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={invoiceData.status} onValueChange={(status) => setInvoiceData(prev => ({ ...prev, status }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Invoice Description</Label>
            <Editor
              apiKey="l83sjkylmyn9h2qo9h3wca1hhb07mq90afi5mhptqfyzt26i"
              value={invoiceData.description}
              onEditorChange={(content) => setInvoiceData(prev => ({ ...prev, description: content }))}
              init={{
                height: 200,
                menubar: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          </div>

          {/* Timesheet Selection */}
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Select Timesheets
                </CardTitle>
                <CardDescription>
                  Choose timesheet entries to include in this invoice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientTimesheets.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No timesheets found for this client.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {clientTimesheets.map((timesheet) => (
                      <div key={timesheet.id} className="flex items-center space-x-2 p-2 border rounded">
                        <Checkbox
                          id={`timesheet-${timesheet.id}`}
                          checked={selectedTimesheets.includes(timesheet.id)}
                          onCheckedChange={() => handleTimesheetToggle(timesheet.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{timesheet.projectName}</span>
                            <span className="text-sm text-muted-foreground">
                              {getCurrencySymbol(workspaceSettings.currency || 'MYR')}{timesheet.total.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{timesheet.date} - {timesheet.hours}h</p>
                          <p className="text-xs text-muted-foreground truncate">{timesheet.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fixed Projects Selection */}
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Select Fixed Projects
                </CardTitle>
                <CardDescription>
                  Choose fixed-amount projects to include in this invoice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientProjects.filter(p => p.billingType === 'fixed').length === 0 ? (
                  <p className="text-muted-foreground text-sm">No fixed projects found for this client.</p>
                ) : (
                  <div className="space-y-2">
                    {clientProjects
                      .filter(p => p.billingType === 'fixed')
                      .map((project) => (
                        <div key={project.id} className="flex items-center space-x-2 p-2 border rounded">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={() => handleProjectToggle(project.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{project.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {getCurrencySymbol(workspaceSettings.currency || 'MYR')}{project.fixedAmount.toFixed(2)}/month
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes for the invoice..."
              rows={3}
            />
          </div>

          {/* Invoice Summary */}
          {(selectedTimesheets.length > 0 || selectedProjects.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({workspaceSettings.taxRate || '0'}%):</span>
                    <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedClient || !selectedTemplate || (selectedTimesheets.length === 0 && selectedProjects.length === 0)}
            className="w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}