import { TopNav } from '@/components/ui/TopNav'
import { BottomNav } from '@/components/ui/BottomNav'
import { MobileHeader } from '@/components/ui/MobileHeader'
import { WorkspaceProvider } from '@/lib/workspace-context'
import { NavigationPreloader } from '@/components/NavigationPreloader'
import { Suspense } from 'react'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkspaceProvider>
        <NavigationPreloader />
        <div className="min-h-screen min-h-dvh bg-background flex flex-col">
          <TopNav />
          <MobileHeader />
          <main className="container mx-auto px-4 py-4 sm:py-8 flex-1 pb-16 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </div>
      </WorkspaceProvider>
    </Suspense>
  )
}
