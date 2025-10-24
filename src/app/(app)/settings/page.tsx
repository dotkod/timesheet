"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UnifiedSettingsModal } from "@/components/modals/UnifiedSettingsModal"
import { InvoiceTemplateModal, TemplatePreviewModal } from "@/components/modals/InvoiceTemplateModal"
import { MobileWorkspaceSwitcher } from "@/components/ui/MobileWorkspaceSwitcher"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
          <div className="md:hidden w-full">
            <MobileWorkspaceSwitcher />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your workspace settings, preferences, and invoice templates.
          </p>
        </div>
        <div className="md:hidden w-full">
          <MobileWorkspaceSwitcher />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* All Settings - Unified */}
      <Card>
        <CardHeader>
          <CardTitle>All Settings</CardTitle>
          <CardDescription>
            Manage your workspace information, billing settings, and preferences all in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Workspace Information Preview */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Workspace Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <p className="font-medium">{settings.companyName || "Not set"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{settings.email || "Not set"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{settings.phone || "Not set"}</p>
                </div>
              </div>
            </div>

            {/* Billing Settings Preview */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Billing Settings</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Currency:</span>
                  <p className="font-medium">{settings.currency || "MYR"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tax Rate:</span>
                  <p className="font-medium">{settings.taxRate || "6"}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Terms:</span>
                  <p className="font-medium">{settings.paymentTerms || "Net 30"}</p>
                </div>
              </div>
            </div>

            {/* Preferences Preview */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Preferences</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Time Format:</span>
                  <p className="font-medium">{settings.timeFormat || "12-hour"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date Format:</span>
                  <p className="font-medium">{settings.dateFormat || "DD MMMM YYYY"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Auto Save:</span>
                  <Badge className={settings.autoSave === "true" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-muted text-muted-foreground"}>
                    {settings.autoSave === "true" ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <UnifiedSettingsModal settings={settings} onSave={handleSaveSettings} />
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
                <div key={template.id} className="p-4 border rounded-lg space-y-4">
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <TemplatePreviewModal 
                      template={template}
                      trigger={
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Preview PDF
                        </Button>
                      }
                    />
                    <InvoiceTemplateModal 
                      template={template}
                      onSave={handleSaveTemplate}
                      trigger={
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Edit
                        </Button>
                      }
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                      className="w-full sm:w-auto"
                    >
                      Duplicate
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="w-full sm:w-auto"
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
    </div>
  )
}