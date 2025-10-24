"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WorkspaceSwitcher } from "./WorkspaceSwitcher"
import { LogOut, Menu, X } from "lucide-react"
import { useWorkspace } from "@/lib/workspace-context"

export function TopNav() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <Card className="w-full sticky top-0 z-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Link href={createLink("/dashboard")} className="text-xl font-bold">
            <img
              src="https://dotkod.com/_next/image?url=%2Fimages%2Flogo.png&w=64&q=10"
              alt="Timesheet Logo"
              className="h-8 w-8 mr-2 inline-block align-middle"
            />
          </Link>
          <nav className="flex items-center space-x-6">
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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Admin</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex items-center justify-between p-3 px-4">
        {/* Left: Burger Menu */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Center: Workspace Selector */}
        <div className="flex-1 mx-4">
          <WorkspaceSwitcher />
        </div>

        {/* Right: Logout */}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 space-y-2">
            <Link 
              href={createLink("/dashboard")} 
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href={createLink("/timesheets")} 
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Timesheets
            </Link>
            <Link 
              href={createLink("/projects")} 
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Projects
            </Link>
            <Link 
              href={createLink("/clients")} 
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Clients
            </Link>
            <Link 
              href={createLink("/invoices")} 
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Invoices
            </Link>
            <Link 
              href={createLink("/settings")} 
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </nav>
        </div>
      )}
    </Card>
  )
}
