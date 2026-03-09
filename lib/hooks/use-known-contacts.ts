import { useQuery, queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/supabase/database.types'

export type KnownContact = {
  id: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
}

async function fetchKnownContacts(userId: string): Promise<KnownContact[]> {
  const supabase = createClient()

  // Get all lists owned by the current user
  const { data: ownedLists, error: listsError } = await supabase
    .from('lists')
    .select('id')
    .eq('owner_id', userId)

  if (listsError || !ownedLists?.length) return []

  const ownedListIds = ownedLists.map((l) => l.id)

  // Get all collaborators on those lists
  const { data: collaborators, error: collabError } = await supabase
    .from('list_collaborators')
    .select('user_id, profiles(id, display_name, email, avatar_url)')
    .in('list_id', ownedListIds)

  if (collabError || !collaborators) return []

  // Deduplicate by user_id
  const seen = new Set<string>()
  const contacts: KnownContact[] = []

  for (const collab of collaborators) {
    const profile = collab.profiles as unknown as Tables<'profiles'> | null
    if (!profile || seen.has(profile.id)) continue
    seen.add(profile.id)
    contacts.push({
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
    })
  }

  return contacts
}

export function knownContactsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ['known-contacts', userId],
    queryFn: () => fetchKnownContacts(userId),
    enabled: !!userId,
  })
}

export function useKnownContacts(userId: string) {
  return useQuery(knownContactsQueryOptions(userId))
}
