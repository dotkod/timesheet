"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InvoiceGenerationModal } from "@/components/modals/InvoiceGenerationModal"
import { useWorkspace } from "@/lib/workspace-context"
import { exportInvoiceToPdf } from "@/lib/pdf-export"

interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  dateIssued: string
  dueDate: string
  status: "draft" | "sent" | "paid" | "overdue"
  subtotal: number
  tax: number
  total: number
  description: string
  createdAt: string
  updatedAt: string
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { currentWorkspace } = useWorkspace()

  const fetchInvoices = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setInvoices(data.invoices || [])
        setError("")
      } else {
        setError(data.error || "Failed to fetch invoices")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [currentWorkspace])

  const handleGenerateInvoice = async (invoiceData: any) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoiceData,
          workspaceId: currentWorkspace?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchInvoices() // Refresh the list
        console.log('Invoice generated successfully:', data.invoice)
      } else {
        setError(data.error || "Failed to generate invoice")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const exportInvoice = async (invoiceId: string) => {
    try {
      // Fetch invoice details with items
      const response = await fetch(`/api/invoices?workspaceId=${currentWorkspace?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        const invoice = data.invoices.find((inv: any) => inv.id === invoiceId)
        if (!invoice) {
          setError("Invoice not found")
          return
        }

        // Fetch workspace settings for company info
        const settingsResponse = await fetch(`/api/workspace-settings?workspaceId=${currentWorkspace?.id}`)
        const settingsData = await settingsResponse.json()
        
        const workspaceData = {
          name: settingsData.settings?.companyName || currentWorkspace?.name || 'Company Name',
          address: settingsData.settings?.address || '',
          email: settingsData.settings?.email || '',
          phone: settingsData.settings?.phone || '',
          website: settingsData.settings?.website || ''
        }

        // Prepare invoice data for PDF export
        const invoiceData = {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          client: invoice.client,
          dateIssued: invoice.dateIssued,
          dueDate: invoice.dueDate,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          description: invoice.description,
          items: [] // TODO: Fetch invoice items from API
        }

        const result = await exportInvoiceToPdf(invoiceData, workspaceData)
        if (result.success) {
          console.log(`Exported invoice to ${result.filename}`)
        } else {
          setError(result.error || "Failed to export invoice")
        }
      } else {
        setError(data.error || "Failed to fetch invoice details")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your invoices and track payments.
          </p>
        </div>
        <InvoiceGenerationModal onGenerate={handleGenerateInvoice} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground">No invoices found. Generate your first invoice to get started.</p>
                <InvoiceGenerationModal onGenerate={handleGenerateInvoice} />
              </div>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{invoice.invoiceNumber}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.client}</p>
                    <p className="text-sm text-muted-foreground">{invoice.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Issued: {invoice.dateIssued}</span>
                      <span>Due: {invoice.dueDate}</span>
                      <span className="font-medium text-foreground">Total: ${invoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportInvoice(invoice.id)}>
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}