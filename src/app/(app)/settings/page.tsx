"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WorkspaceSettingsModal, BillingSettingsModal, PreferencesModal } from "@/components/modals/SettingsModals"
import { InvoiceTemplateModal, TemplatePreviewModal } from "@/components/modals/InvoiceTemplateModal"
import { useWorkspace } from "@/lib/workspace-context"
import dayjs from "dayjs"

interface WorkspaceSettings {
  companyName?: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  website?: string
  currency?: string
  taxRate?: string
  invoicePrefix?: string
  paymentTerms?: string
  lateFeeRate?: string
  timeFormat?: string
  dateFormat?: string
  weekStart?: string
  autoSave?: string
  emailNotifications?: string
}

interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  htmlTemplate?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export default function Settings() {
  const [settings, setSettings] = useState<WorkspaceSettings>({})
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { currentWorkspace } = useWorkspace()

  const fetchSettings = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/workspace-settings?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setSettings(data.settings || {})
        setError("")
      } else {
        setError(data.error || "Failed to fetch settings")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
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

  useEffect(() => {
    fetchSettings()
    fetchTemplates()
  }, [currentWorkspace])

  const handleSaveSettings = async (newSettings: WorkspaceSettings) => {
    try {
      const response = await fetch('/api/workspace-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace?.id,
          settings: newSettings
        })
      })
      
      if (response.ok) {
        await fetchSettings() // Refresh settings
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save settings")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleSaveTemplate = async (template: any) => {
    try {
      const method = template.id ? 'PUT' : 'POST'
      
      const response = await fetch('/api/invoice-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          workspaceId: currentWorkspace?.id
        })
      })
      
      if (response.ok) {
        await fetchTemplates() // Refresh templates
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save template")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/invoice-templates?id=${templateId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchTemplates() // Refresh templates
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete template")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleDuplicateTemplate = (template: InvoiceTemplate) => {
    const duplicatedTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      htmlTemplate: template.htmlTemplate,
      isDefault: false
    }
    handleSaveTemplate(duplicatedTemplate)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings, preferences, and invoice templates.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Workspace Information */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>
            Your company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <p className="text-sm text-muted-foreground">{settings.companyName || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">{settings.email || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="text-sm text-muted-foreground">{settings.phone || "Not set"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Address</label>
                <p className="text-sm text-muted-foreground">{settings.address || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tax ID</label>
                <p className="text-sm text-muted-foreground">{settings.taxId || "Not set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Website</label>
                <p className="text-sm text-muted-foreground">{settings.website || "Not set"}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <WorkspaceSettingsModal settings={settings} onSave={handleSaveSettings} />
          </div>
        </CardContent>
      </Card>

      {/* Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Settings</CardTitle>
          <CardDescription>
            Configure your billing preferences and tax settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Currency</label>
                <p className="text-sm text-muted-foreground">{settings.currency || "USD"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tax Rate</label>
                <p className="text-sm text-muted-foreground">{settings.taxRate || "10"}%</p>
              </div>
              <div>
                <label className="text-sm font-medium">Invoice Prefix</label>
                <p className="text-sm text-muted-foreground">{settings.invoicePrefix || "INV"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Payment Terms</label>
                <p className="text-sm text-muted-foreground">{settings.paymentTerms || "Net 30"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Late Fee Rate</label>
                <p className="text-sm text-muted-foreground">{settings.lateFeeRate || "1.5"}%</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <BillingSettingsModal settings={settings} onSave={handleSaveSettings} />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Templates</CardTitle>
          <CardDescription>
            Manage your invoice templates and designs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No templates found. Create your first template to get started.</p>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{template.name}</h3>
                      {template.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description || "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last modified: {dayjs(template.updatedAt).format('DD MMMM YYYY')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <TemplatePreviewModal 
                      template={template}
                      trigger={
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                      }
                    />
                    <InvoiceTemplateModal 
                      template={template}
                      onSave={handleSaveTemplate}
                      trigger={
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      Duplicate
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-6">
            <InvoiceTemplateModal onSave={handleSaveTemplate} />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your application preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Time Format</label>
                <p className="text-sm text-muted-foreground">{settings.timeFormat || "12-hour"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Date Format</label>
                <p className="text-sm text-muted-foreground">{settings.dateFormat || "MM/DD/YYYY"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Week Starts On</label>
                <p className="text-sm text-muted-foreground">{settings.weekStart || "Monday"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Auto Save</label>
                <Badge className={settings.autoSave === "true" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {settings.autoSave === "true" ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Email Notifications</label>
                <Badge className={settings.emailNotifications === "true" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {settings.emailNotifications === "true" ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <PreferencesModal settings={settings} onSave={handleSaveSettings} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}