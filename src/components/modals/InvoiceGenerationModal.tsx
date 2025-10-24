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
import { getCurrencySymbol } from "@/lib/excel-export"
import { Editor } from '@tinymce/tinymce-react'

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
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const [invoiceData, setInvoiceData] = useState({
    clientId: "",
    templateId: "",
    dateIssued: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: ""
  })
  const { currentWorkspace } = useWorkspace()

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
    if (currentWorkspace) {
      fetchClients()
      fetchProjects()
      fetchTimesheets()
      fetchTemplates()
      fetchWorkspaceSettings()
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
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    setInvoiceData(prev => ({ ...prev, templateId }))
  }


  const calculateTotals = () => {
    if (!selectedClient || !invoiceData.dateIssued) return { subtotal: 0, tax: 0, total: 0 }
    
    const clientName = clients.find(c => c.id === selectedClient)?.name
    if (!clientName) return { subtotal: 0, tax: 0, total: 0 }
    
    // Get the month/year from the invoice date
    const invoiceDate = new Date(invoiceData.dateIssued)
    const invoiceMonth = invoiceDate.getMonth()
    const invoiceYear = invoiceDate.getFullYear()
    
    // Filter timesheets for the selected client and month
    const clientTimesheets = timesheets.filter(t => {
      const timesheetDate = new Date(t.date)
      const project = projects.find(p => p.id === t.projectId)
      return project?.client === clientName && 
             timesheetDate.getMonth() === invoiceMonth && 
             timesheetDate.getFullYear() === invoiceYear
    })
    
    // Calculate from timesheets (hourly projects)
    const timesheetSubtotal = clientTimesheets.reduce((sum, t) => sum + t.total, 0)
    
    // Calculate from fixed projects for this client
    const clientFixedProjects = projects.filter(p => 
      p.client === clientName && p.billingType === 'fixed'
    )
    const fixedSubtotal = clientFixedProjects.reduce((sum, p) => sum + p.fixedAmount, 0)
    
    const subtotal = timesheetSubtotal + fixedSubtotal
    const taxRate = parseFloat(workspaceSettings.taxRate || '0')
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax
    
    return { subtotal, tax, total, clientTimesheets, clientFixedProjects }
  }

  const handleGenerate = () => {
    const totals = calculateTotals()
    
    // Create invoice items from both timesheets and fixed projects
    const timesheetItems = (totals.clientTimesheets || []).map(t => ({
      description: `${t.project} - ${t.description}`,
      quantity: t.hours,
      unitPrice: t.hourlyRate,
      total: t.total
    }))
    
    const fixedProjectItems = (totals.clientFixedProjects || []).map(p => ({
      description: `${p.name} - Monthly Fee`,
      quantity: 1,
      unitPrice: p.fixedAmount,
      total: p.fixedAmount
    }))
    
    const allItems = [...timesheetItems, ...fixedProjectItems]
    
    const invoicePayload = {
      ...invoiceData,
      timesheetIds: (totals.clientTimesheets || []).map(t => t.id),
      projectIds: (totals.clientFixedProjects || []).map(p => p.id),
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      items: allItems
    }
    
    onGenerate(invoicePayload)
    setOpen(false)
  }

  const totals = calculateTotals()
  
  // Get client timesheets for the selected month
  const clientTimesheets = selectedClient && invoiceData.dateIssued ? (() => {
    const clientName = clients.find(c => c.id === selectedClient)?.name
    if (!clientName) return []
    
    const invoiceDate = new Date(invoiceData.dateIssued)
    const invoiceMonth = invoiceDate.getMonth()
    const invoiceYear = invoiceDate.getFullYear()
    
    return timesheets.filter(t => {
      const timesheetDate = new Date(t.date)
      const project = projects.find(p => p.id === t.projectId)
      return project?.client === clientName && 
             timesheetDate.getMonth() === invoiceMonth && 
             timesheetDate.getFullYear() === invoiceYear
    })
  })() : []
  
  // Get client fixed projects
  const clientFixedProjects = selectedClient ? projects.filter(p => 
    p.client === clients.find(c => c.id === selectedClient)?.name && p.billingType === 'fixed'
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

          {/* Timesheet Details */}
          {selectedClient && invoiceData.dateIssued && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h3 className="font-medium">Timesheet Entries for {new Date(invoiceData.dateIssued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {clientTimesheets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No timesheet entries found for this client in {new Date(invoiceData.dateIssued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
                  </p>
                ) : (
                  clientTimesheets.map((timesheet) => (
                    <div key={timesheet.id} className="flex items-center justify-between p-2 border rounded bg-muted/30 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{timesheet.project}</span>
                        <Badge variant="outline" className="text-xs">{timesheet.date}</Badge>
                        {timesheet.billable && <Badge className="bg-green-100 text-green-800 text-xs">Billable</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{timesheet.hours}h</span>
                        <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{timesheet.hourlyRate}/h</span>
                        <span className="font-medium text-foreground">{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{timesheet.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Fixed Projects Details */}
          {selectedClient && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <h3 className="font-medium">Fixed Monthly Projects</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {clientFixedProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No fixed monthly projects found for this client.
                  </p>
                ) : (
                  clientFixedProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-2 border rounded bg-muted/30 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{project.name}</span>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Fixed Monthly</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Monthly Fee</span>
                        <span className="font-medium text-foreground">{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{project.fixedAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          {selectedClient && (clientTimesheets.length > 0 || clientFixedProjects.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <h3 className="font-medium">Invoice Summary</h3>
              </div>
              <div className="space-y-1 p-3 border rounded bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({workspaceSettings.taxRate || '0'}%):</span>
                  <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total:</span>
                  <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

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
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={!selectedClient || !selectedTemplate || (clientTimesheets.length === 0 && clientFixedProjects.length === 0)}
            className="w-full sm:w-auto"
          >
            Generate Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
