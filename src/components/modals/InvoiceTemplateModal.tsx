"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Copy, Eye } from "lucide-react"

interface InvoiceTemplate {
  id?: string
  name: string
  description?: string
  htmlTemplate?: string
  isDefault: boolean
}

interface InvoiceTemplateModalProps {
  template?: InvoiceTemplate
  onSave: (template: InvoiceTemplate) => void
  trigger?: React.ReactNode
}

export function InvoiceTemplateModal({ template, onSave, trigger }: InvoiceTemplateModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<InvoiceTemplate>({
    name: template?.name || "",
    description: template?.description || "",
    htmlTemplate: template?.htmlTemplate || defaultTemplate,
    isDefault: template?.isDefault || false
  })

  useEffect(() => {
    setFormData({
      name: template?.name || "",
      description: template?.description || "",
      htmlTemplate: template?.htmlTemplate || defaultTemplate,
      isDefault: template?.isDefault || false
    })
  }, [template])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="h-4 w-4 mr-2" />Create New Template</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Update your invoice template.' : 'Create a new invoice template with custom HTML.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isDefault">Set as Default Template</Label>
            <Switch
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="htmlTemplate">HTML Template</Label>
            <Textarea
              id="htmlTemplate"
              value={formData.htmlTemplate}
              onChange={(e) => setFormData({ ...formData, htmlTemplate: e.target.value })}
              rows={20}
              className="font-mono text-sm"
              placeholder="Enter your HTML template here..."
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders like {'{{workspace.name}}'}, {'{{client.name}}'}, {'{{invoice.number}}'}, {'{{items}}'}, etc.
            </p>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">Save Template</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TemplatePreviewModal({ template, trigger }: { template: InvoiceTemplate, trigger?: React.ReactNode }) {
  const handlePreview = async () => {
    // Create sample data for preview
    const sampleInvoiceData = {
      id: 'preview',
      invoiceNumber: 'INV-2025-001',
      client: 'Sample Client',
      dateIssued: '26 September 2025',
      dueDate: '26 October 2025',
      subtotal: 6000,
      tax: 360,
      total: 6360,
      description: 'Development Support Services for September 2025',
      items: [{
        description: 'Development Support Services for September 2025',
        quantity: 1,
        unitPrice: 6000,
        total: 6000
      }]
    }

    const sampleWorkspaceData = {
      name: 'Sattiyan Selvarajah',
      address: '23, Taman Tai Chong,\n31100 Sungai Siput (U),\nPerak',
      email: 'satt.works@gmail.com',
      phone: '(60) 14 307 2966',
      currency: 'MYR'
    }

    // Import the PDF export function
    const { exportInvoiceToPdf } = await import('@/lib/pdf-export')
    
    // Generate PDF preview
    const result = await exportInvoiceToPdf(sampleInvoiceData, sampleWorkspaceData, template.htmlTemplate, 'template-preview.pdf')
    
    if (result.success) {
      console.log('Template preview generated successfully')
    } else {
      console.error('Failed to generate template preview:', result.error)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePreview}>
      <Eye className="h-4 w-4 mr-2" />Preview PDF
    </Button>
  )
}

const defaultTemplate = `<div style="padding: 40px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; color: #000; background: #fff;">
    <!-- Header Section -->
    <div style="margin-bottom: 30px;">
      <!-- INVOICE Title (Top Right) -->
      <div style="text-align: right; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #000;">INVOICE</h1>
      </div>
      
      <!-- From, To, Date Row -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <!-- Left Section (From + To) -->
        <div style="display: flex; flex: 2; gap: 80px;">
          <!-- From Section -->
          <div>
            <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">From:</h3>
            <div style="line-height: 1.2;">
              <p style="margin: 0 0 3px 0; font-weight: bold; font-size: 14px; color: #000;">{{workspace.name}}</p>
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">23, Taman Tai Chong,</p>
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">31100 Sungai Siput (U),</p>
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Perak</p>
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Phone: {{workspace.phone}}</p>
              <p style="margin: 0; font-size: 12px; color: #000;">Email: {{workspace.email}}</p>
            </div>
          </div>
          
          <!-- To Section -->
          <div>
            <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">To:</h3>
            <div style="line-height: 1.2;">
              <p style="margin: 0; font-weight: bold; font-size: 14px; color: #000;">{{client.name}}</p>
            </div>
          </div>
        </div>
        
        <!-- Date (Far Right) -->
        <div style="text-align: right; flex: 1;">
          <p style="margin: 0; font-size: 12px; color: #000;">Date: {{invoice.date}}</p>
        </div>
      </div>
    </div>
  
  <!-- Items Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #000;">
    <thead>
      <tr style="background-color: #000;">
        <th style="border: 1px solid #000; padding: 12px; text-align: left; font-weight: bold; font-size: 14px; color: #fff;">No</th>
        <th style="border: 1px solid #000; padding: 12px; text-align: left; font-weight: bold; font-size: 14px; color: #fff;">Description</th>
        <th style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold; font-size: 14px; color: #fff;">Amount (RM)</th>
      </tr>
    </thead>
    <tbody>
      {{items_table}}
      <!-- Total Row -->
      <tr>
        <td style="border: 1px solid #000; padding: 12px;"></td>
        <td style="border: 1px solid #000; padding: 12px; font-weight: bold; font-size: 14px; color: #000; text-align: right;">Total</td>
        <td style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold; font-size: 14px; color: #000;">RM {{total}}</td>
      </tr>
    </tbody>
  </table>
  
  <!-- Payment Details Section -->
  <div style="margin-top: 25px;">
    <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">Payment details:</h3>
    <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Please make the payment to the following bank account:</p>
    <div style="line-height: 1.2;">
      <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;"><strong>Account Name:</strong> {{workspace.name}}</p>
      <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;"><strong>Bank Name:</strong> MAYBANK BERHAD</p>
      <p style="margin: 0; font-size: 12px; color: #000;"><strong>Account No:</strong> 1582 0230 4486</p>
    </div>
  </div>
  
  <!-- Closing Message -->
  <div style="text-align: left; margin-top: 30px;">
    <p style="margin: 0; font-size: 12px; color: #000;">Thank you! Please let me know if you need additional details.</p>
  </div>
</div>`

