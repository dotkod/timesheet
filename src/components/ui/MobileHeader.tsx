'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { WorkspaceSwitcher } from "./WorkspaceSwitcher"
import { LogOut } from "lucide-react"

export function MobileHeader() {
  const router = useRouter()

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

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border">
      {/* Left: App Title */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">Timesheet</h1>
      </div>
      
      {/* Center: Workspace Switcher */}
      <div className="flex-1 mx-4">
        <WorkspaceSwitcher />
      </div>
      
      {/* Right: Logout */}
      <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
