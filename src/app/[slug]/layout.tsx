import { supabaseServer as supabase } from "@/lib/supabase-server"
import { CartSheet } from "@/components/catalog/cart-sheet"
import { Tenant } from "@/types/database"

export default async function CatalogLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const { slug } = params

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single() as { data: Tenant | null }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="text-xl font-bold text-primary italic tracking-tight">
            {tenant?.name || "Catálogo"}
          </div>
          <CartSheet 
            businessName={tenant?.name || "Negocio"} 
            businessPhone={tenant?.phone || ""}
            currency={tenant?.currency || "USD"}
          />
        </div>
      </header>
      <main className="container mx-auto pb-20">
        {children}
      </main>
    </div>
  )
}
