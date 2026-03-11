import { supabaseServer } from "@/lib/supabase-server"
import { cookies, headers } from "next/headers"
import PublicCatalog from "@/components/public/PublicCatalog"
import LandingPageContent from "@/components/public/LandingPageContent"

export default async function Page() {
  const supabase = supabaseServer
  const headerList = await headers()
  const tenantId = headerList.get('x-tenant-id')

  if (tenantId) {
    // 1. Fetch Tenant
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single()

    const tenant = tenantData as any // Use any for quick fix if types are mismatched, or properly cast

    if (tenant) {
      // 2. Fetch Categories
      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("sort_order")

      // 3. Fetch Products
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      return (
        <PublicCatalog 
          tenant={tenant} 
          categories={categories || []} 
          products={products || []} 
        />
      )
    }
  }

  // Fallback to landing page
  return <LandingPageContent />
}
