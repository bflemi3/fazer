import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/supabase/database.types'

export type Profile = Tables<'profiles'> & {
  firstName: string
  displayName: string
}

async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!data) return null

  const firstName = data.display_name?.split(' ')[0] || ''
  const displayName = firstName || data.email || ''

  return {
    ...data,
    firstName,
    displayName,
  }
}

export function useProfile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  })

  return {
    profile,
    isLoading,
    firstName: profile?.firstName || '',
    displayName: profile?.displayName || '',
  }
}
