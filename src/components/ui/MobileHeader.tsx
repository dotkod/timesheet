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

  return null // Mobile header hidden - workspace switcher moved to bottom nav
}
