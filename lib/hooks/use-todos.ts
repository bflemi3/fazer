import { useQuery, useSuspenseQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/supabase/database.types'

export type Todo = Tables<'todos'>

async function fetchTodos(listId: string): Promise<Todo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('list_id', listId)
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

async function createTodo({ listId, title, position }: { listId: string; title: string; position: number }): Promise<Todo> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('todos')
    .insert({
      list_id: listId,
      title,
      position,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function toggleTodo({ id, isComplete }: { id: string; isComplete: boolean }): Promise<Todo> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('todos')
    .update({ is_complete: isComplete, updated_by: user?.id })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteTodo(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

async function updateTodo({ id, title }: { id: string; title: string }): Promise<Todo> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('todos')
    .update({ title, updated_by: user?.id })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function reorderTodos(updates: { id: string; position: number }[]): Promise<void> {
  const supabase = createClient()

  // Update each todo's position
  for (const { id, position } of updates) {
    const { error } = await supabase
      .from('todos')
      .update({ position })
      .eq('id', id)

    if (error) throw error
  }
}

export function todosQueryOptions(listId: string) {
  return queryOptions({
    queryKey: ['todos', listId],
    queryFn: () => fetchTodos(listId),
  })
}

export function useTodos(listId: string) {
  return useQuery(todosQueryOptions(listId))
}

export function useSuspenseTodos(listId: string) {
  return useSuspenseQuery(todosQueryOptions(listId))
}

export function useCreateTodo(listId: string) {
  const queryClient = useQueryClient()
  const queryKey = todosQueryOptions(listId).queryKey

  return useMutation({
    mutationFn: createTodo,
    onMutate: async ({ title, position }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Todo[]>(queryKey)

      // Optimistically add the new todo
      const optimisticTodo: Todo = {
        id: crypto.randomUUID(),
        list_id: listId,
        title,
        description: null,
        due_date: null,
        is_complete: false,
        position,
        created_by: null,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old ? [...old, optimisticTodo] : [optimisticTodo]
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

export function useToggleTodo(listId: string) {
  const queryClient = useQueryClient()
  const queryKey = todosQueryOptions(listId).queryKey

  return useMutation({
    mutationFn: toggleTodo,
    onMutate: async ({ id, isComplete }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Todo[]>(queryKey)

      // Optimistically toggle the todo
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.map((todo) =>
          todo.id === id ? { ...todo, is_complete: isComplete } : todo
        )
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

export function useDeleteTodo(listId: string) {
  const queryClient = useQueryClient()
  const queryKey = todosQueryOptions(listId).queryKey

  return useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Todo[]>(queryKey)

      // Optimistically remove the todo
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.filter((todo) => todo.id !== id)
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useUpdateTodo(listId: string) {
  const queryClient = useQueryClient()
  const queryKey = todosQueryOptions(listId).queryKey

  return useMutation({
    mutationFn: updateTodo,
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Todo[]>(queryKey)

      // Optimistically update the todo title
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.map((todo) =>
          todo.id === id ? { ...todo, title } : todo
        )
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

export function useReorderTodos(listId: string) {
  const queryClient = useQueryClient()
  const queryKey = todosQueryOptions(listId).queryKey

  return useMutation({
    mutationFn: reorderTodos,
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Todo[]>(queryKey)

      // Optimistically update positions
      queryClient.setQueryData<Todo[]>(queryKey, (old) => {
        if (!old) return old
        const positionMap = new Map(updates.map((u) => [u.id, u.position]))
        return old
          .map((todo) => ({
            ...todo,
            position: positionMap.has(todo.id) ? positionMap.get(todo.id)! : todo.position,
          }))
          .sort((a, b) => a.position - b.position)
      })

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
