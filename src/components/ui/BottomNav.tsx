'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWorkspace } from "@/lib/workspace-context"
import { 
  Home, 
  Clock, 
  FolderOpen, 
  FileText
} from "lucide-react"
import { MobileWorkspaceSwitcher } from "./MobileWorkspaceSwitcher"

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
    }
  ]

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-between py-3 px-4">
          {/* Left: First 2 nav items */}
          <div className="flex items-center space-x-4">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    active 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              )
            })}
          </div>

          {/* Center: Workspace Switcher */}
          <MobileWorkspaceSwitcher />

          {/* Right: Last 2 nav items */}
          <div className="flex items-center space-x-4">
            {navItems.slice(2, 4).map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    active 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
