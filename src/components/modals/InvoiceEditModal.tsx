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
import { Calendar, DollarSign, FileText } from "lucide-react"
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
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const [invoiceData, setInvoiceData] = useState({
    clientId: invoice.clientId,
    templateId: invoice.templateId,
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

  const fetchTemplates = async () => {
    if (!currentWorkspace) return
    try {
      const response = await fetch(`/api/invoice-templates?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      if (response.ok) {
        setTemplates(data.templates || [])
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
      fetchTemplates()
      fetchWorkspaceSettings()
    }
  }, [currentWorkspace, open])

  const handleSave = () => {
    const updatedInvoice = {
      ...invoice,
      ...invoiceData
    }
    onSave(updatedInvoice)
    setOpen(false)
  }

  const handleClientChange = (clientId: string) => {
    setInvoiceData(prev => ({ ...prev, clientId }))
  }

  const handleTemplateChange = (templateId: string) => {
    setInvoiceData(prev => ({ ...prev, templateId }))
  }

  const handleStatusChange = (status: string) => {
    setInvoiceData(prev => ({ ...prev, status }))
  }

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
              <Select value={invoiceData.clientId} onValueChange={handleClientChange}>
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
              <Select value={invoiceData.templateId} onValueChange={handleTemplateChange}>
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
            <Select value={invoiceData.status} onValueChange={handleStatusChange}>
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
                  <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({workspaceSettings.taxRate || '0'}%):</span>
                  <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{getCurrencySymbol(workspaceSettings.currency || 'MYR')}{invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
