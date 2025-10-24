import { BottomNav } from "@/components/ui/BottomNav"
import { WorkspaceProvider } from "@/lib/workspace-context"
import { Suspense } from "react"

export default function MobileAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkspaceProvider>
        <div className="h-screen h-dvh bg-background flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <BottomNav />
        </div>
      </WorkspaceProvider>
    </Suspense>
  )
}
