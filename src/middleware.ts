import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 1. Refresh session if exists
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl
  const hostname = req.headers.get('host') || ''
  
  // Define main domain (ignore if it's localhost or the app domain)
  const isMainDomain = hostname === process.env.NEXT_PUBLIC_MAIN_DOMAIN || 
                       hostname.includes('localhost') || 
                       hostname === 'whatscatalog.pro'

  // 2. Identify Tenant
  let tenantId = ''
  
  // Try to find by Custom Domain first
  const { data: domainTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('custom_domain', hostname)
    .single()

  if (domainTenant) {
    tenantId = domainTenant.id
  } else {
    // Subdomain or Slug logic
    let slug = ''
    if (isMainDomain) {
      const segments = url.pathname.split('/')
      if (segments[1] && !['admin', 'api', '_next', 'static', 'auth', 'login', 'unauthorized'].includes(segments[1])) {
        slug = segments[1]
      }
    } else {
      slug = hostname.split('.')[0]
    }

    if (slug) {
      const { data: slugTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (slugTenant) {
        tenantId = slugTenant.id
      }
    }
  }

  if (tenantId) {
    res.headers.set('x-tenant-id', tenantId)
  }

  // 3. Admin protection
  if (url.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role check (assuming the user metadata has role or we fetch from profiles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || !['admin', 'manager', 'owner'].includes(profile.role)) {
       // Optional: Redirect to unauthorized page
       return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
