"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WorkspaceSwitcher } from "./WorkspaceSwitcher"
import { LogOut } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"

export function TopNav() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      router.push("/login")
      router.refresh()
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

  return (
    <Card className="w-full">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Link href={createLink("/dashboard")} className="text-xl font-bold">
            <img
              src="https://dotkod.com/_next/image?url=%2Fimages%2Flogo.png&w=64&q=10"
              alt="Timesheet Logo"
              className="h-8 w-8 mr-2 inline-block align-middle"
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href={createLink("/timesheets")} className="text-sm font-medium hover:text-primary">
              Timesheets
            </Link>
            <Link href={createLink("/projects")} className="text-sm font-medium hover:text-primary">
              Projects
            </Link>
            <Link href={createLink("/clients")} className="text-sm font-medium hover:text-primary">
              Clients
            </Link>
            <Link href={createLink("/invoices")} className="text-sm font-medium hover:text-primary">
              Invoices
            </Link>
            <Link href={createLink("/settings")} className="text-sm font-medium hover:text-primary">
              Settings
            </Link>
          </nav>
        </div>
        
            <div className="flex items-center space-x-4">
              <WorkspaceSwitcher />

              {/* User menu */}
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
