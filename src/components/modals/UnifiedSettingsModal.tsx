"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit, Save } from "lucide-react"

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

interface UnifiedSettingsModalProps {
  settings: WorkspaceSettings
  onSave: (settings: WorkspaceSettings) => void
  trigger?: React.ReactNode
}

export function UnifiedSettingsModal({ settings, onSave, trigger }: UnifiedSettingsModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<WorkspaceSettings>({
    // Workspace Information
    companyName: settings.companyName || "",
    email: settings.email || "",
    phone: settings.phone || "",
    address: settings.address || "",
    taxId: settings.taxId || "",
    website: settings.website || "",
    
    // Billing Settings
    currency: settings.currency || "MYR",
    taxRate: settings.taxRate || "6",
    invoicePrefix: settings.invoicePrefix || "INV",
    paymentTerms: settings.paymentTerms || "Net 30",
    lateFeeRate: settings.lateFeeRate || "1.5",
    
    // Preferences
    timeFormat: settings.timeFormat || "12-hour",
    dateFormat: settings.dateFormat || "DD/MM/YYYY",
    weekStart: settings.weekStart || "Monday",
    autoSave: settings.autoSave || "true",
    emailNotifications: settings.emailNotifications || "true"
  })

  useEffect(() => {
    setFormData({
      // Workspace Information
      companyName: settings.companyName || "",
      email: settings.email || "",
      phone: settings.phone || "",
      address: settings.address || "",
      taxId: settings.taxId || "",
      website: settings.website || "",
      
      // Billing Settings
      currency: settings.currency || "MYR",
      taxRate: settings.taxRate || "6",
      invoicePrefix: settings.invoicePrefix || "INV",
      paymentTerms: settings.paymentTerms || "Net 30",
      lateFeeRate: settings.lateFeeRate || "1.5",
      
      // Preferences
      timeFormat: settings.timeFormat || "12-hour",
      dateFormat: settings.dateFormat || "DD/MM/YYYY",
      weekStart: settings.weekStart || "Monday",
      autoSave: settings.autoSave || "true",
      emailNotifications: settings.emailNotifications || "true"
    })
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Edit className="h-4 w-4 mr-2" />Edit Settings</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-[95vw] md:w-[90vw] lg:w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Update your workspace settings and preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Workspace Information Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Billing Settings Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                    <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lateFeeRate">Late Fee Rate (%)</Label>
                <Input
                  id="lateFeeRate"
                  type="number"
                  step="0.1"
                  value={formData.lateFeeRate}
                  onChange={(e) => setFormData({ ...formData, lateFeeRate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select value={formData.timeFormat} onValueChange={(value) => setFormData({ ...formData, timeFormat: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12-hour">12-hour</SelectItem>
                    <SelectItem value="24-hour">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={formData.dateFormat} onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="DD MMMM YYYY">DD MMMM YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekStart">Week Starts On</Label>
                <Select value={formData.weekStart} onValueChange={(value) => setFormData({ ...formData, weekStart: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSave">Auto Save</Label>
                <Switch
                  id="autoSave"
                  checked={formData.autoSave === "true"}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoSave: checked.toString() })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <Switch
                  id="emailNotifications"
                  checked={formData.emailNotifications === "true"}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked.toString() })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
