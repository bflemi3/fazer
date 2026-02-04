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
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: listsQueryOptions.queryKey })
      const previous = queryClient.getQueryData<List[]>(listsQueryOptions.queryKey)

      // Optimistically add the new list
      const optimisticList: List = {
        id: crypto.randomUUID(),
        name,
        owner_id: '',
        share_token: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      queryClient.setQueryData<List[]>(listsQueryOptions.queryKey, (old) =>
        old ? [optimisticList, ...old] : [optimisticList]
      )

      return { previous }
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listsQueryOptions.queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryOptions.queryKey })
    },
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteList,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listsQueryOptions.queryKey })
      const previous = queryClient.getQueryData<List[]>(listsQueryOptions.queryKey)

      // Optimistically remove the list
      queryClient.setQueryData<List[]>(listsQueryOptions.queryKey, (old) =>
        old?.filter((list) => list.id !== id)
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listsQueryOptions.queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryOptions.queryKey })
    },
  })
}

export function useRenameList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: renameList,
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: listsQueryOptions.queryKey })
      const previous = queryClient.getQueryData<List[]>(listsQueryOptions.queryKey)

      // Optimistically update the list name
      queryClient.setQueryData<List[]>(listsQueryOptions.queryKey, (old) =>
        old?.map((list) => (list.id === id ? { ...list, name } : list))
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listsQueryOptions.queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryOptions.queryKey })
    },
  })
}
