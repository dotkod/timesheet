'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"
import { 
  Home, 
  Clock, 
  FolderOpen, 
  Users, 
  FileText, 
  Settings,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { TimesheetModal } from "@/components/modals/TimesheetModal"

interface Project {
  id: string
  name: string
  client: {
    name: string
  }
}

export function BottomNav() {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspace()
  const [projects, setProjects] = useState<Project[]>([])

  // Fetch projects for the modal
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentWorkspace) return
      
      try {
        const response = await fetch(`/api/projects?workspace=${currentWorkspace.id}`)
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    fetchProjects()
  }, [currentWorkspace])

  const handleSaveTimesheet = async (timesheet: any) => {
    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...timesheet,
          workspaceId: currentWorkspace?.id,
        }),
      })

      if (response.ok) {
        // Refresh the page to show new timesheet
        window.location.reload()
      } else {
        console.error('Failed to save timesheet')
      }
    } catch (error) {
      console.error('Error saving timesheet:', error)
    }
  }

  // Helper function to create links with workspace parameter
  const createLink = (path: string) => {
    if (currentWorkspace) {
      return `${path}?workspace=${currentWorkspace.id}`
    }
    return path
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: createLink('/dashboard'),
      icon: Home,
      path: '/dashboard'
    },
    {
      name: 'Timesheets',
      href: createLink('/timesheets'),
      icon: Clock,
      path: '/timesheets'
    },
    {
      name: 'Projects',
      href: createLink('/projects'),
      icon: FolderOpen,
      path: '/projects'
    },
    {
      name: 'Clients',
      href: createLink('/clients'),
      icon: Users,
      path: '/clients'
    },
    {
      name: 'Invoices',
      href: createLink('/invoices'),
      icon: FileText,
      path: '/invoices'
    },
    {
      name: 'Settings',
      href: createLink('/settings'),
      icon: Settings,
      path: '/settings'
    }
  ]

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                  active 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
        
        {/* Floating Add Button */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <TimesheetModal
            projects={projects}
            onSave={handleSaveTimesheet}
            trigger={
              <Button
                size="lg"
                className="h-12 w-12 rounded-full shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            }
          />
        </div>
      </div>
    </>
  )
}
