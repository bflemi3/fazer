import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/supabase/database.types'

export type ListMember = {
  id: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
  role: 'owner' | 'collaborator'
}

async function fetchListMembers(listId: string): Promise<ListMember[]> {
  const supabase = createClient()

  // Fetch the list to get owner_id
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('owner_id')
    .eq('id', listId)
    .single()

  if (listError || !list) throw listError || new Error('List not found')

  // Fetch owner profile
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', list.owner_id)
    .single()

  const members: ListMember[] = []

  if (ownerProfile) {
    members.push({
      id: ownerProfile.id,
      display_name: ownerProfile.display_name,
      email: ownerProfile.email,
      avatar_url: ownerProfile.avatar_url,
      role: 'owner',
    })
  }

  // Fetch collaborators with their profiles
  const { data: collaborators } = await supabase
    .from('list_collaborators')
    .select('user_id, profiles(id, display_name, email, avatar_url)')
    .eq('list_id', listId)

  if (collaborators) {
    for (const collab of collaborators) {
      const profile = collab.profiles as unknown as Tables<'profiles'> | null
      if (profile) {
        members.push({
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: 'collaborator',
        })
      }
    }
  }

  return members
}

async function removeCollaborator({ listId, userId }: { listId: string; userId: string }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('list_collaborators')
    .delete()
    .eq('list_id', listId)
    .eq('user_id', userId)

  if (error) throw error
}

export function collaboratorsQueryOptions(listId: string) {
  return queryOptions({
    queryKey: ['collaborators', listId],
    queryFn: () => fetchListMembers(listId),
  })
}

export function useCollaborators(listId: string) {
  return useQuery(collaboratorsQueryOptions(listId))
}

export function useRemoveCollaborator(listId: string) {
  const queryClient = useQueryClient()
  const queryKey = collaboratorsQueryOptions(listId).queryKey

  return useMutation({
    mutationFn: removeCollaborator,
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ListMember[]>(queryKey)

      queryClient.setQueryData<ListMember[]>(queryKey, (old) =>
        old?.filter((member) => member.id !== userId)
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
