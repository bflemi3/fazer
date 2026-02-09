import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
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
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to home page on error
  return NextResponse.redirect(`${origin}`)
}
