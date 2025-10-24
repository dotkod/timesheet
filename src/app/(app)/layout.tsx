import { TopNav } from '@/components/ui/TopNav'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { WorkspaceProvider } from '@/lib/workspace-context'
import { Suspense } from 'react'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background">
          <TopNav />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <FloatingActionButton />
        </div>
      </WorkspaceProvider>
    </Suspense>
  )
}
