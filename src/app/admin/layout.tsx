import { Sidebar } from "@/components/layout/sidebar"
import { UserNav } from "@/components/layout/user-nav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="font-medium text-lg">Panel de Administración</div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  )
}
