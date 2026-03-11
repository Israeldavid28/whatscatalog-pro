import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 1. Refresh session if exists
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl
  const host = req.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Identificar si estamos en el dominio principal (opcional: configurar como env var)
  const isMainAppDomain = hostname === process.env.NEXT_PUBLIC_MAIN_DOMAIN || 
                           hostname.includes('localhost') || 
                           hostname === 'whatscatalog.pro';

  // 2. Identificar Tenant
  let tenantId = '';

  // a. Intentar por Dominio Personalizado (Verificado)
  const { data: tenantByDomain } = await supabase
    .from('tenants')
    .select('id')
    .eq('custom_domain', hostname)
    .eq('domain_verified', true)
    .single();

  if (tenantByDomain) {
    tenantId = tenantByDomain.id;
  } else if (!isMainAppDomain) {
    // b. No es el dominio principal, intentar por Subdominio (ej: tienda.plataforma.com)
    const subdomain = hostname.split('.')[0];
    const { data: tenantBySlug } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', subdomain)
      .single();
    
    if (tenantBySlug) {
      tenantId = tenantBySlug.id;
    }
  } else {
    // c. Es el dominio principal, revisar si hay un slug en la ruta (ej: plataforma.com/tienda1)
    const segments = url.pathname.split('/');
    const potentialSlug = segments[1];

    if (potentialSlug && !['admin', 'api', '_next', 'static', 'auth', 'login', 'unauthorized'].includes(potentialSlug)) {
      const { data: tenantByPathSlug } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', potentialSlug)
        .single();
      
      if (tenantByPathSlug) {
        tenantId = tenantByPathSlug.id;
      }
    }
  }

  if (tenantId) {
    res.headers.set('x-tenant-id', tenantId);
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
