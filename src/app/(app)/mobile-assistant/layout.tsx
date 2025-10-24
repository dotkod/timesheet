export default function MobileAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-background">
      {children}
    </div>
  )
}
