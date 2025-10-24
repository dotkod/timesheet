'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"
import { 
  Home, 
  Clock, 
  FolderOpen, 
  FileText, 
  Settings
} from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspace()

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
        <div className="flex items-center justify-center py-3 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
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
      </div>
    </>
  )
}
