import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import PublicCatalog from "@/components/public/PublicCatalog"

export default async function CatalogPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // 1. Fetch Tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", params.slug)
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
