import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'

const resolveTxt = promisify(dns.resolveTxt)

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { domain } = await req.json()

  if (!domain) {
    return NextResponse.json({ error: 'Dominio requerido' }, { status: 400 })
  }

  // 1. Fetch the tenant by domain
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('id, domain_verification_token')
    .eq('custom_domain', domain)
    .single()

  if (fetchError || !tenant) {
    return NextResponse.json({ error: 'Configuración de dominio no encontrada' }, { status: 404 })
  }

  // 2. Check DNS TXT records
  try {
    const records = await resolveTxt(`_whatscatalog.${domain}`)
    const flattenedRecords = records.flat()
    
    const isVerified = flattenedRecords.includes(tenant.domain_verification_token)

    if (isVerified) {
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ domain_verified: true })
        .eq('id', tenant.id)

      if (updateError) throw updateError

      return NextResponse.json({ success: true, message: 'Dominio verificado con éxito' })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Registro TXT no encontrado o no coincide. Asegúrate de que el registro sea _whatscatalog.' + domain + ' con el valor proporcionado.'
      })
    }
  } catch (dnsError) {
    console.error('DNS Error:', dnsError)
    return NextResponse.json({ 
      success: false, 
      error: 'No se pudo consultar el registro DNS. Verifica que el dominio sea correcto y que hayas añadido el registro TXT.' 
    }, { status: 500 })
  }
}
