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
import { Plus, Calendar, DollarSign } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"

interface Client {
  id: string
  name: string
  email: string
  address: string
}

interface Project {
  id: string
  name: string
  client: string
  billingType: "hourly" | "fixed"
  hourlyRate: number
  fixedAmount: number
}

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
}

interface InvoiceTemplate {
  id: string
  name: string
  isDefault: boolean
}

interface InvoiceGenerationModalProps {
  onGenerate: (invoiceData: any) => void
  trigger?: React.ReactNode
}

export function InvoiceGenerationModal({ onGenerate, trigger }: InvoiceGenerationModalProps) {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [invoiceData, setInvoiceData] = useState({
    clientId: "",
    templateId: "",
    dateIssued: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "",
    notes: ""
  })
  const { currentWorkspace } = useWorkspace()

  useEffect(() => {
    if (currentWorkspace) {
      fetchClients()
      fetchProjects()
      fetchTimesheets()
      fetchTemplates()
    }
  }, [currentWorkspace])

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
        // Set default template
        const defaultTemplate = data.templates?.find((t: any) => t.isDefault)
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id)
          setInvoiceData(prev => ({ ...prev, templateId: defaultTemplate.id }))
        } else if (data.templates?.length > 0) {
          // If no default template, use the first one
          const firstTemplate = data.templates[0]
          setSelectedTemplate(firstTemplate.id)
          setInvoiceData(prev => ({ ...prev, templateId: firstTemplate.id }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    setInvoiceData(prev => ({ ...prev, clientId }))
    
    // Filter timesheets for selected client
    const clientTimesheets = timesheets.filter(t => 
      projects.find(p => p.id === t.projectId)?.client === 
      clients.find(c => c.id === clientId)?.name
    )
    setSelectedTimesheets(clientTimesheets.map(t => t.id))
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    setInvoiceData(prev => ({ ...prev, templateId }))
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
    // Calculate from selected timesheets (hourly projects)
    const selectedTimesheetData = timesheets.filter(t => selectedTimesheets.includes(t.id))
    const timesheetSubtotal = selectedTimesheetData.reduce((sum, t) => sum + t.total, 0)
    
    // Calculate from selected fixed projects
    const selectedProjectData = projects.filter(p => selectedProjects.includes(p.id) && p.billingType === 'fixed')
    const fixedSubtotal = selectedProjectData.reduce((sum, p) => sum + p.fixedAmount, 0)
    
    const subtotal = timesheetSubtotal + fixedSubtotal
    const taxRate = 10 // Default tax rate, should come from settings
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax
    
    return { subtotal, tax, total }
  }

  const handleGenerate = () => {
    const totals = calculateTotals()
    const selectedTimesheetData = timesheets.filter(t => selectedTimesheets.includes(t.id))
    const selectedProjectData = projects.filter(p => selectedProjects.includes(p.id) && p.billingType === 'fixed')
    
    // Create invoice items from both timesheets and fixed projects
    const timesheetItems = selectedTimesheetData.map(t => ({
      description: `${t.project} - ${t.description}`,
      quantity: t.hours,
      unitPrice: t.hourlyRate,
      total: t.total
    }))
    
    const fixedProjectItems = selectedProjectData.map(p => ({
      description: `${p.name} - Monthly Fee`,
      quantity: 1,
      unitPrice: p.fixedAmount,
      total: p.fixedAmount
    }))
    
    const allItems = [...timesheetItems, ...fixedProjectItems]
    
    const invoicePayload = {
      ...invoiceData,
      timesheetIds: selectedTimesheets,
      projectIds: selectedProjects,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      items: allItems
    }
    
    onGenerate(invoicePayload)
    setOpen(false)
  }

  const totals = calculateTotals()
  const clientTimesheets = selectedClient ? timesheets.filter(t => 
    projects.find(p => p.id === t.projectId)?.client === 
    clients.find(c => c.id === selectedClient)?.name
  ) : []
  
  const clientProjects = selectedClient ? projects.filter(p => 
    p.client === clients.find(c => c.id === selectedClient)?.name
  ) : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" />Generate Invoice</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate New Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice from timesheet entries or manual items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client and Template Selection */}
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
                      {template.name} {template.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateIssued">Date Issued</Label>
              <Input
                id="dateIssued"
                type="date"
                value={invoiceData.dateIssued}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dateIssued: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Invoice Description</Label>
            <Input
              id="description"
              value={invoiceData.description}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Web Development Services - January 2024"
            />
          </div>

          {/* Timesheet Selection */}
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Select Timesheet Entries
                </CardTitle>
                <CardDescription>
                  Choose which timesheet entries to include in this invoice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {clientTimesheets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No timesheet entries found for this client.
                    </p>
                  ) : (
                    clientTimesheets.map((timesheet) => (
                      <div 
                        key={timesheet.id} 
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTimesheets.includes(timesheet.id) 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleTimesheetToggle(timesheet.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedTimesheets.includes(timesheet.id)}
                              onChange={() => handleTimesheetToggle(timesheet.id)}
                              className="rounded"
                            />
                            <span className="font-medium">{timesheet.project}</span>
                            <Badge variant="outline">{timesheet.date}</Badge>
                            {timesheet.billable && (
                              <Badge className="bg-green-100 text-green-800">Billable</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {timesheet.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{timesheet.hours}h</span>
                            <span>${timesheet.hourlyRate}/h</span>
                            <span className="font-medium text-foreground">${timesheet.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Selection */}
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Select Fixed Projects
                </CardTitle>
                <CardDescription>
                  Choose which fixed monthly projects to include in this invoice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {clientProjects.filter(p => p.billingType === 'fixed').length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No fixed monthly projects found for this client.
                    </p>
                  ) : (
                    clientProjects
                      .filter(p => p.billingType === 'fixed')
                      .map((project) => (
                        <div 
                          key={project.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedProjects.includes(project.id) 
                              ? 'bg-primary/10 border-primary' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => handleProjectToggle(project.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedProjects.includes(project.id)}
                                onChange={() => handleProjectToggle(project.id)}
                                className="rounded"
                              />
                              <span className="font-medium">{project.name}</span>
                              <Badge className="bg-blue-100 text-blue-800">Fixed Monthly</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>Monthly Fee</span>
                              <span className="font-medium text-foreground">${project.fixedAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Summary */}
          {(selectedTimesheets.length > 0 || selectedProjects.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!selectedClient || !selectedTemplate || selectedTimesheets.length === 0}
            className="w-full sm:w-auto"
          >
            Generate Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
