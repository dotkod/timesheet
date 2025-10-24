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
import { Plus, Calendar, DollarSign, FileText, Clock, FolderOpen } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"
import { getCurrencySymbol } from "@/lib/excel-export"
import { Editor } from '@tinymce/tinymce-react'
import dayjs from 'dayjs'

interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  client: string
  templateId: string
  dateIssued: string
  dueDate: string
  description: string
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
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [invoiceData, setInvoiceData] = useState({
    dateIssued: '',
    dueDate: '',
    description: '',
    status: 'draft'
  })
  const { currentWorkspace } = useWorkspace()

  const fetchClients = async () => {
    if (!currentWorkspace) return
    try {
      const response = await fetch(`/api/clients?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      if (response.ok) {
        console.log('Edit Modal - All clients:', data.clients) // Debug log
        console.log('Edit Modal - Invoice clientId:', invoice.clientId) // Debug log
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
      
      // Reset form data when modal opens
      setSelectedClient(invoice.clientId || '')
      setSelectedTemplate(invoice.templateId || '')
      setInvoiceData({
        dateIssued: invoice.dateIssued || '',
        dueDate: invoice.dueDate || '',
        description: invoice.description || '',
        status: invoice.status || 'draft'
      })
    }
  }, [currentWorkspace, open, invoice])

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
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
      return t.clientName === clientName && 
             timesheetDate.getMonth() === invoiceMonth && 
             timesheetDate.getFullYear() === invoiceYear
    })
    
    // Calculate from timesheets (hourly projects)
    const timesheetSubtotal = clientTimesheets.reduce((sum, t) => sum + t.total, 0)
    
    // Calculate from fixed projects for this client
    const clientFixedProjects = projects.filter(p => 
      p.clientId === selectedClient && p.billingType === 'fixed'
    )
    const fixedSubtotal = clientFixedProjects.reduce((sum, p) => sum + (p.fixedAmount || 0), 0)
    
    const subtotal = timesheetSubtotal + fixedSubtotal
    const taxRate = parseFloat(workspaceSettings.taxRate || '0')
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax
    
    return { subtotal, tax, total, clientTimesheets, clientFixedProjects }
  }

  const handleSave = () => {
    const totals = calculateTotals()
    
    const updatedInvoice = {
      ...invoice,
      ...invoiceData,
      clientId: selectedClient,
      templateId: selectedTemplate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total
    }
    
    onSave(updatedInvoice)
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
      return t.clientName === clientName && 
             timesheetDate.getMonth() === invoiceMonth && 
             timesheetDate.getFullYear() === invoiceYear
    })
  })() : []
  
  // Get client fixed projects
  const clientFixedProjects = selectedClient ? projects.filter(p => 
    p.clientId === selectedClient && p.billingType === 'fixed'
  ) : []

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

          {/* Timesheet Details */}
          {selectedClient && invoiceData.dateIssued && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
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
                        <span className="font-medium">{timesheet.projectName}</span>
                        <Badge variant="outline" className="text-xs">{dayjs(timesheet.date).format('DD MMM YYYY')}</Badge>
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
                <FolderOpen className="h-4 w-4" />
                <h3 className="font-medium">Fixed Monthly Projects</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {clientFixedProjects.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground py-4 text-center">
                    No fixed monthly projects found for this client.
                  </div>
                ) : (
                  clientFixedProjects.map((project) => (
                    <div key={project.id} className="p-3 border rounded bg-muted/30 text-sm">
                      <div className="font-medium text-xs mb-1 truncate" title={project.name}>
                        {project.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getCurrencySymbol(workspaceSettings.currency || 'MYR')}{project.fixedAmount.toFixed(2)}
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
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedClient || !selectedTemplate}
            className="w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}