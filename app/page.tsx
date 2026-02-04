import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomeContent } from '@/components/home-content'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <HomeContent />
}
