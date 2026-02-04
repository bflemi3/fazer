import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
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

async function fetchList(id: string): Promise<List | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
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

export const listsQueryOptions = queryOptions({
  queryKey: ['lists'],
  queryFn: fetchLists,
})

export function listQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['lists', id],
    queryFn: () => fetchList(id),
  })
}

export function useLists() {
  return useQuery(listsQueryOptions)
}

export function useList(id: string) {
  return useQuery(listQueryOptions(id))
}

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryOptions.queryKey })
    },
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryOptions.queryKey })
    },
  })
}

export function useRenameList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: renameList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryOptions.queryKey })
    },
  })
}
