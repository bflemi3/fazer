'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useCreateTodo, useSuspenseTodos, useReorderTodos } from '@/lib/hooks/use-todos'
import { useRealtimeInvalidation } from '@/lib/hooks/use-realtime-invalidation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SortableTodoItem, TodoDragOverlayContent } from './sortable-todo-item'
import { TodoItem } from './todo-item'

type Props = {
  listId: string
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
}

export function TodoList({ listId }: Props) {
  const { data: todos } = useSuspenseTodos(listId)
  const t = useTranslations()

  // Live updates: invalidate cache when other users change todos
  useRealtimeInvalidation({
    channel: `todos:${listId}`,
    table: 'todos',
    filter: `list_id=eq.${listId}`,
    queryKeys: [['todos', listId]],
  })
  const createTodo = useCreateTodo(listId)
  const reorderTodos = useReorderTodos(listId)

  const [isCreating, setIsCreating] = useState(false)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const hasTodos = todos.length > 0

  const incompleteTodos = useMemo(
    () => todos.filter((t) => !t.is_complete).sort((a, b) => a.position - b.position),
    [todos],
  )
  const completedTodos = useMemo(
    () => todos.filter((t) => t.is_complete).sort((a, b) => a.position - b.position),
    [todos],
  )

  // Local order for drag reordering — incomplete todos only
  const [localOrder, setLocalOrder] = useState<string[]>(() =>
    incompleteTodos.map((t) => t.id),
  )

  // Sync local order when server data changes (mutation settled, realtime, etc.)
  const serverIncompleteIds = useMemo(
    () => incompleteTodos.map((t) => t.id),
    [incompleteTodos],
  )
  useEffect(() => {
    setLocalOrder(serverIncompleteIds)
  }, [serverIncompleteIds])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      const reordered = arrayMove(prev, oldIndex, newIndex)

      const updates = reordered.map((id, index) => ({ id, position: index }))
      reorderTodos.mutate(updates)

      return reordered
    })
  }, [reorderTodos])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  // Find the active todo for the drag overlay
  const activeTodo = activeId
    ? todos.find((t) => t.id === activeId) ?? null
    : null

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  function handleCreateTodo() {
    const title = newTodoTitle.trim()
    if (!title) return

    const nextPosition = todos.length
    createTodo.mutate(
      { listId, title, position: nextPosition },
      {
        onError: () => {
          toast(t('todos.createError'))
          setNewTodoTitle(title)
        },
      }
    )
    setNewTodoTitle('')

    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateTodo()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewTodoTitle('')
    }
  }

  // Empty state
  if (!hasTodos && !isCreating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t('todos.empty')}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t('todos.emptyDescription')}
        </p>
        <Button className="mt-6" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" />
          {t('todos.newTodo')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Incomplete todos — draggable */}
      {localOrder.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
            <div className="grid gap-2">
              {localOrder.map((id) => (
                <SortableTodoItem key={id} todoId={id} listId={listId} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTodo ? (
              <TodoDragOverlayContent todo={activeTodo} listId={listId} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Completed todos — static, no drag */}
      {completedTodos.length > 0 && (
        <div className="space-y-2">
          {completedTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} listId={listId} />
          ))}
        </div>
      )}

      {/* Inline create input */}
      {isCreating && (
        <div className="space-y-2">
          <Input
            ref={inputRef}
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('todos.newTodoPlaceholder')}
            className="bg-white dark:bg-zinc-900"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('todos.createHint')}
          </p>
        </div>
      )}

      {/* Add button when not creating */}
      {!isCreating && (
        <Button
          variant="ghost"
          className="w-full justify-start text-base text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-4 w-4" />
          {t('todos.newTodo')}
        </Button>
      )}
    </div>
  )
}
