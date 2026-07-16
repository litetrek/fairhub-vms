import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  console.log('[proxy] pathname:', pathname)
  console.log('[proxy] session user:', user?.id ?? 'null', '| session error:', sessionError?.message ?? 'none')

  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/callback',
    '/staff/login',
    '/fair/',
    '/vendor/profile/complete',
  ]
  if (pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log('[proxy] public route — pass through')
    return supabaseResponse
  }

  if (!user) {
    console.log('[proxy] no session → redirect /auth/login')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  console.log('[proxy] SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Use service role key so PostgREST permission grants don't block us.
  // Tables created via Prisma (not Supabase dashboard) don't automatically
  // have SELECT granted to the anon/authenticated roles.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: dbUser, error: dbError } = await admin
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[proxy] User table query → data:', JSON.stringify(dbUser), '| error:', dbError?.message ?? 'none', '| code:', dbError?.code ?? 'none')

  if (!dbUser) {
    console.log('[proxy] no User record for', user.id, '→ redirect /auth/login')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  const role: string = dbUser.role

  console.log('[proxy] role from DB:', role)

  // Staff and admin must use email/password only — block OAuth-authenticated sessions
  if (role === 'STAFF' || role === 'ADMIN') {
    const { data: { session } } = await supabase.auth.getSession()
    const provider = session?.user?.app_metadata?.provider
    if (provider !== 'email') {
      console.log('[proxy] STAFF/ADMIN with non-email provider:', provider, '→ sign out + redirect /staff/login')
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/staff/login?error=oauth_not_allowed', request.url))
    }
  }

  if (pathname.startsWith('/staff') && role === 'VENDOR') {
    console.log('[proxy] VENDOR on /staff → redirect /vendor/dashboard')
    const url = request.nextUrl.clone()
    url.pathname = '/vendor/dashboard'
    return NextResponse.redirect(url)
  }

  if (
    pathname.startsWith('/vendor') &&
    (role === 'STAFF' || role === 'ADMIN')
  ) {
    console.log('[proxy] STAFF/ADMIN on /vendor → redirect /staff/queue')
    const url = request.nextUrl.clone()
    url.pathname = '/staff/queue'
    return NextResponse.redirect(url)
  }

  console.log('[proxy] allow through:', role, pathname)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
