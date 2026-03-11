import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  const url = request.nextUrl

  if (url.pathname.startsWith('/admin')) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options })
              const res = NextResponse.next({ request: { headers: request.headers } })
              res.cookies.set({ name, value, ...options })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options })
              const res = NextResponse.next({ request: { headers: request.headers } })
              res.cookies.set({ name, value: '', ...options })
            },
          },
        }
      )

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || !['admin', 'manager', 'owner'].includes(profile.role)) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
