import { notFound } from "next/navigation"

import { supabase } from "@/lib/supabase"
import PublicCatalog from "@/components/public/PublicCatalog"

export default async function CatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // 1. Fetch Tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    notFound()
  }

  // 2. Fetch Categories (sorted)
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("orden")

  // 3. Fetch Products (active only)
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("active", true)
    .order("created_at", { ascending: false })

  return (
    <PublicCatalog 
      tenant={tenant} 
      categories={categories || []} 
      products={products || []} 
    />
  )
}
