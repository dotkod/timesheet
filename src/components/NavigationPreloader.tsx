'use client'

import { useEffect } from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { preloadData } from '@/hooks/useData'

export function NavigationPreloader() {
  const { currentWorkspace } = useWorkspace()

  useEffect(() => {
    if (!currentWorkspace) return

    // Preload data for all main pages
    const preloadPromises = [
      // Dashboard data
      preloadData('dashboard-stats', async () => {
        const response = await fetch(`/api/timesheets?workspaceId=${currentWorkspace.id}`)
        return response.json()
      }, currentWorkspace.id),

      // Projects data
      preloadData('projects', async () => {
        const response = await fetch(`/api/projects?workspaceId=${currentWorkspace.id}`)
        return response.json()
      }, currentWorkspace.id),

      // Clients data
      preloadData('clients', async () => {
        const response = await fetch(`/api/clients?workspaceId=${currentWorkspace.id}`)
        return response.json()
      }, currentWorkspace.id),

      // Timesheets data
      preloadData('timesheets', async () => {
        const response = await fetch(`/api/timesheets?workspaceId=${currentWorkspace.id}`)
        return response.json()
      }, currentWorkspace.id),

      // Invoices data
      preloadData('invoices', async () => {
        const response = await fetch(`/api/invoices?workspaceId=${currentWorkspace.id}`)
        return response.json()
      }, currentWorkspace.id),

      // Workspace settings
      preloadData('workspaceSettings', async () => {
        const response = await fetch(`/api/workspace-settings?workspaceId=${currentWorkspace.id}`)
        return response.json()
      }, currentWorkspace.id),
    ]

    // Preload in background
    Promise.allSettled(preloadPromises).then(results => {
      const failed = results.filter(result => result.status === 'rejected').length
      if (failed > 0) {
        console.warn(`${failed} preload requests failed`)
      }
    })

  }, [currentWorkspace])

  return null // This component doesn't render anything
}
