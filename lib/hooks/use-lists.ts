import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/supabase/database.types'

export type List = Tables<'lists'>

async function fetchLists(): Promise<List[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function createList(name: string): Promise<List> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('lists')
    .insert({ name, owner_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteList(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', id)

  if (error) throw error
}

async function renameList({ id, name }: { id: string; name: string }): Promise<List> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
  })
}

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}

export function useRenameList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: renameList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}
