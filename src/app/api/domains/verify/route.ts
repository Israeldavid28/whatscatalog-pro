import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import dns from "dns"
import { promisify } from "util"

const resolveTxt = promisify(dns.resolveTxt)

export async function POST(req: Request) {
  try {
    const { domain } = await req.json()

    if (!domain) {
      return NextResponse.json({ success: false, message: "Dominio no proporcionado" }, { status: 400 })
    }

    // 1. Fetch Tenant token
    const { data: tenantData } = await (supabaseServer
      .from("tenants" as any)
      .select("id, domain_verification_token")
      .eq("custom_domain", domain)
      .single() as any)

    const tenant = tenantData as any

    if (!tenant) {
      return NextResponse.json({ success: false, message: "Tenant no encontrado para este dominio" }, { status: 404 })
    }

    // 2. Resolve DNS TXT records
    // We look for _whatscatalog.domain.com
    const verificationHost = `_whatscatalog.${domain}`
    let records: string[][] = []
    
    try {
      records = await resolveTxt(verificationHost)
    } catch (dnsError) {
      console.error("DNS Resolution Error:", dnsError)
      return NextResponse.json({ 
        success: false, 
        message: `No se encontró el registro TXT en ${verificationHost}. Asegúrate de que los cambios DNS se hayan propagado.` 
      })
    }

    // 3. Check if token matches
    const flattenedRecords = records.flat()
    const isVerified = flattenedRecords.includes(tenant.domain_verification_token)

    if (isVerified) {
      // 4. Update status
      const { error: updateError } = await (supabaseServer
        .from("tenants" as any)
        .update({ domain_verified: true } as any)
        .eq("id", tenant.id) as any)

      if (updateError) throw updateError

      return NextResponse.json({ success: true, message: "Dominio verificado con éxito" })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "El token encontrado en DNS no coincide con el generado. Revisa el registro TXT." 
      })
    }
  } catch (error: any) {
    console.error("Verify Domain Error:", error)
    return NextResponse.json({ success: false, message: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
