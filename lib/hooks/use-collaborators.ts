import { useQuery, useSuspenseQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/supabase/database.types'
import type { KnownContact } from './use-known-contacts'

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

async function addCollaborator({ listId, userId }: { listId: string; userId: string }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('list_collaborators')
    .insert({ list_id: listId, user_id: userId })

  if (error) throw error
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

export function useSuspenseCollaborators(listId: string) {
  return useSuspenseQuery(collaboratorsQueryOptions(listId))
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

export function useAddCollaborator(listId: string, currentUserId: string) {
  const queryClient = useQueryClient()
  const collabKey = collaboratorsQueryOptions(listId).queryKey
  const contactsKey = ['known-contacts', currentUserId]

  return useMutation({
    mutationFn: addCollaborator,
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: collabKey })
      await queryClient.cancelQueries({ queryKey: contactsKey })

      const previousMembers = queryClient.getQueryData<ListMember[]>(collabKey)
      const previousContacts = queryClient.getQueryData<KnownContact[]>(contactsKey)

      // Move the contact from known-contacts to collaborators
      const contact = previousContacts?.find((c) => c.id === userId)

      if (contact) {
        queryClient.setQueryData<ListMember[]>(collabKey, (old) => [
          ...(old ?? []),
          {
            id: contact.id,
            display_name: contact.display_name,
            email: contact.email,
            avatar_url: contact.avatar_url,
            role: 'collaborator',
          },
        ])

        queryClient.setQueryData<KnownContact[]>(contactsKey, (old) =>
          old?.filter((c) => c.id !== userId)
        )
      }

      return { previousMembers, previousContacts }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(collabKey, context.previousMembers)
      }
      if (context?.previousContacts) {
        queryClient.setQueryData(contactsKey, context.previousContacts)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collabKey })
      queryClient.invalidateQueries({ queryKey: contactsKey })
    },
  })
}
