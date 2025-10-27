"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClientModal } from "@/components/modals/ClientModal"
import { ClientDetailsModal } from "@/components/modals/ClientDetailsModal"
import { DeleteModal } from "@/components/modals/DeleteModal"
import { useWorkspace } from "@/lib/workspace-context"
import { exportClientsToExcel, getCurrencySymbol } from "@/lib/excel-export"
import dayjs from "dayjs"
import { CheckCircle2 } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: "active" | "completed" | "prospect"
  notes?: string
  totalProjects: number
  totalRevenue: number
  lastContact: string
  createdAt: string
  updatedAt: string
  hasFixedProject?: boolean
  latestCreditDate?: string
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({})
  const { currentWorkspace } = useWorkspace()

  const fetchClients = async () => {
    if (!currentWorkspace) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/clients?workspaceId=${currentWorkspace.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setClients(data.clients || [])
        setError("")
      } else {
        setError(data.error || "Failed to fetch clients")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
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
    fetchClients()
    fetchWorkspaceSettings()
  }, [currentWorkspace])

  const handleSaveClient = async (clientData: any) => {
    try {
      const method = clientData.id ? 'PUT' : 'POST'
      
      const response = await fetch('/api/clients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          workspaceId: currentWorkspace?.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchClients() // Refresh the list
      } else {
        setError(data.error || "Failed to save client")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchClients() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete client")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const exportToExcel = () => {
    if (clients.length === 0) {
      setError("No clients to export")
      return
    }
    
    const result = exportClientsToExcel(clients)
    if (result.success) {
      console.log(`Exported ${clients.length} clients to ${result.filename}`)
    } else {
      setError(result.error || "Failed to export clients")
    }
  }

  const handleMarkClientPaymentCredited = async (clientId: string) => {
    try {
      // Fetch client's projects to find the fixed project
      const projectsResponse = await fetch(`/api/projects?workspaceId=${currentWorkspace?.id}`)
      const projectsData = await projectsResponse.json()
      const clientProjects = projectsData.projects?.filter((p: any) => 
        p.clientId === clientId && p.billingType === 'fixed'
      ) || []
      
      if (clientProjects.length === 0) {
        setError("No fixed projects found for this client")
        return
      }

      const fixedProject = clientProjects[0]
      const today = dayjs().format('YYYY-MM-DD')
      const response = await fetch('/api/projects/mark-credited', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: fixedProject.id,
          creditedDate: today
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await fetchClients() // Refresh the list
      } else {
        setError(data.error || "Failed to mark payment as credited")
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
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">Loading clients...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships and contact information.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={exportToExcel} className="w-full sm:w-auto">
            Export Excel
          </Button>
          <ClientModal onSave={handleSaveClient} />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No clients found. Create your first client to get started.</p>
          </div>
        ) : (
          clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <CardDescription>{client.email}</CardDescription>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {client.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{client.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projects:</span>
                    <span className="font-medium">{client.totalProjects}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-medium">{getCurrencySymbol(workspaceSettings.currency || 'MYR')} {client.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Contact:</span>
                    <span className="font-medium">{client.lastContact ? dayjs(client.lastContact).format('DD MMMM YYYY') : 'N/A'}</span>
                  </div>
                  
                  {/* Mark payment as credited for fixed projects */}
                  {client.hasFixedProject && (
                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                      {client.latestCreditDate ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Last credited {dayjs(client.latestCreditDate).format('D MMM YYYY')}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkClientPaymentCredited(client.id)}
                          className="text-xs w-full"
                        >
                          Mark Payment as Credited
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <ClientDetailsModal 
                    client={client}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    }
                  />
                  <ClientModal 
                    client={client} 
                    onSave={handleSaveClient}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                    }
                  />
                  <DeleteModal
                    itemType="Client"
                    itemName={client.name}
                    onConfirm={() => handleDeleteClient(client.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}