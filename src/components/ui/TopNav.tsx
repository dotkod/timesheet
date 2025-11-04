"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WorkspaceSwitcher } from "./WorkspaceSwitcher"
import { LogOut } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"

export function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspace()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      router.push("/login")
      // No router.refresh() needed - SPA navigation
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Helper function to create links with workspace parameter
  const createLink = (path: string) => {
    if (currentWorkspace) {
      return `${path}?workspace=${currentWorkspace.id}`
    }
    return path
  }

  const isActive = (path: string) => {
    if (!pathname) return false
    // consider subroutes active (e.g., /timesheets/123)
    return pathname === path || pathname.startsWith(path + "/")
  }

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path)
        ? "text-primary underline underline-offset-8 decoration-2"
        : "hover:text-primary"
    }`

  return (
    <Card className="w-full sticky top-0 z-50 hidden md:block">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Link href={createLink("/dashboard")} className="text-xl font-bold">
            <img
              src="https://dotkod.com/_next/image?url=%2Fimages%2Flogo.png&w=64&q=10"
              alt="Timesheet Logo"
              className="h-8 w-8 mr-2 inline-block align-middle"
            />
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href={createLink("/timesheets")} className={linkClass("/timesheets")}>
              Timesheets
            </Link>
            <Link href={createLink("/projects")} className={linkClass("/projects")}>
              Projects
            </Link>
            <Link href={createLink("/todos")} className={linkClass("/todos")}>
              Todos
            </Link>
            <Link href={createLink("/clients")} className={linkClass("/clients")}>
              Clients
            </Link>
            <Link href={createLink("/invoices")} className={linkClass("/invoices")}>
              Invoices
            </Link>
            <Link href={createLink("/payments")} className={linkClass("/payments")}>
              Payments
            </Link>
            <Link href={createLink("/settings")} className={linkClass("/settings")}>
              Settings
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <WorkspaceSwitcher />
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Admin</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
