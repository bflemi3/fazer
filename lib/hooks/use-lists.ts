import { useQuery, useSuspenseQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/supabase/database.types'

export type List = Tables<'lists'>

async function fetchLists(): Promise<List[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchList(id: string): Promise<List> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as List
}

async function createList({ name, position }: { name: string; position: number }): Promise<List> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('lists')
    .insert({ name, owner_id: user.id, position })
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

async function reorderLists(updates: { id: string; position: number }[]): Promise<void> {
  const supabase = createClient()

  for (const { id, position } of updates) {
    const { error } = await supabase
      .from('lists')
      .update({ position })
      .eq('id', id)

    if (error) throw error
  }
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

export function useList<TData = List>(
  id: string,
  options?: { select?: (data: List) => TData },
) {
  return useQuery({
    ...listQueryOptions(id),
    select: options?.select,
  })
}

export function useSuspenseLists<TData = List[]>(
  options?: { select?: (data: List[]) => TData },
) {
  return useSuspenseQuery({
    ...listsQueryOptions,
    select: options?.select,
  })
}

export function useSuspenseList<TData = List>(
  id: string,
  options?: { select?: (data: List) => TData },
) {
  return useSuspenseQuery({
    ...listQueryOptions(id),
    select: options?.select,
  })
}

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createList,
    onMutate: async ({ name, position }) => {
      await queryClient.cancelQueries({ queryKey: listsQueryOptions.queryKey })
      const previous = queryClient.getQueryData<List[]>(listsQueryOptions.queryKey)

      // Optimistically add the new list
      const optimisticList: List = {
        id: crypto.randomUUID(),
        name,
        owner_id: '',
        share_token: '',
        position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      queryClient.setQueryData<List[]>(listsQueryOptions.queryKey, (old) =>
        old ? [...old, optimisticList] : [optimisticList]
      )

      return { previous }
    },
    onSuccess: (newList) => {
      // Seed individual caches so the list page renders instantly
      queryClient.setQueryData(listQueryOptions(newList.id).queryKey, newList)
      queryClient.setQueryData(['todos', newList.id], [])
      queryClient.setQueryData(['collaborators', newList.id], [])
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

export function useReorderLists() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reorderLists,
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: listsQueryOptions.queryKey })
      const previous = queryClient.getQueryData<List[]>(listsQueryOptions.queryKey)

      // Optimistically update positions
      queryClient.setQueryData<List[]>(listsQueryOptions.queryKey, (old) => {
        if (!old) return old
        const positionMap = new Map(updates.map((u) => [u.id, u.position]))
        return old
          .map((list) => ({
            ...list,
            position: positionMap.has(list.id) ? positionMap.get(list.id)! : list.position,
          }))
          .sort((a, b) => a.position - b.position)
      })

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
