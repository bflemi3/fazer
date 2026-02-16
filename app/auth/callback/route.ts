import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/supabase/database.types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Bind cookies directly to the redirect response so session persists
    const redirectUrl = `${origin}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sync profile with latest auth metadata (avatar, name, email)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const meta = user.user_metadata
        await supabase.from('profiles').update({
          email: user.email,
          display_name: meta?.full_name || meta?.name || null,
          avatar_url: meta?.avatar_url || meta?.picture || null,
        }).eq('id', user.id)

        // Detect new user (created_at within 60 seconds) for analytics
        const createdAt = new Date(user.created_at).getTime()
        if (Date.now() - createdAt < 60_000) {
          const url = new URL(response.headers.get('location')!)
          url.searchParams.set('new_user', '1')
          response.headers.set('location', url.toString())
        }
      }

      return response
    }
  }

  // Return to home page on error
  return NextResponse.redirect(`${origin}`)
}
