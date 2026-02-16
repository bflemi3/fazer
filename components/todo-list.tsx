'use client'

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
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
import type { Todo } from '@/lib/hooks/use-todos'

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
}

// --- Selectors (stable, module-level) ---

const selectIncompleteTodos = (todos: Todo[]) =>
  todos.filter((t) => !t.is_complete).sort((a, b) => a.position - b.position)

const selectCompletedTodos = (todos: Todo[]) =>
  todos.filter((t) => t.is_complete).sort((a, b) => a.position - b.position)

const selectTotalCount = (todos: Todo[]) => todos.length

// --- IncompleteTodoList ---

const IncompleteTodoList = memo(function IncompleteTodoList({ listId }: { listId: string }) {
  const { data: incompleteTodos } = useSuspenseTodos(listId, { select: selectIncompleteTodos })
  const { data: todos } = useSuspenseTodos(listId)
  const reorderTodos = useReorderTodos(listId)

  const [activeId, setActiveId] = useState<string | null>(null)

  // Local order for drag reordering
  const [localOrder, setLocalOrder] = useState<string[]>(() =>
    incompleteTodos.map((t) => t.id),
  )

  // Sync local order when server data changes
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

  if (localOrder.length === 0) return null

  return (
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
  )
})

// --- CompletedTodoList ---

const CompletedTodoList = memo(function CompletedTodoList({ listId }: { listId: string }) {
  const { data: completedTodos } = useSuspenseTodos(listId, { select: selectCompletedTodos })
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  if (completedTodos.length === 0) return null

  return (
    <div>
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <ChevronRight
          className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        />
        {t('todos.completedCount', { count: completedTodos.length })}
      </button>
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {completedTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} listId={listId} />
          ))}
        </div>
      )}
    </div>
  )
})

// --- TodoList (thin orchestrator) ---

type TodoListProps = {
  listId: string
  triggerCreateRef?: React.MutableRefObject<(() => void) | null>
  onBottomVisibilityChange?: (visible: boolean) => void
}

export function TodoList({ listId, triggerCreateRef, onBottomVisibilityChange }: TodoListProps) {
  const { data: totalCount } = useSuspenseTodos(listId, { select: selectTotalCount })
  const t = useTranslations()

  // Live updates: invalidate cache when other users change todos
  useRealtimeInvalidation({
    channel: `todos:${listId}`,
    table: 'todos',
    filter: `list_id=eq.${listId}`,
    queryKeys: [['todos', listId]],
  })

  const createTodo = useCreateTodo(listId)

  const [isCreating, setIsCreating] = useState(false)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  // Track whether the bottom button/input area is visible
  useEffect(() => {
    const el = bottomAreaRef.current
    if (!el || !onBottomVisibilityChange) return

    const observer = new IntersectionObserver(
      ([entry]) => onBottomVisibilityChange(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onBottomVisibilityChange])

  const handleStartCreating = useCallback(() => {
    setIsCreating(true)
    // Scroll to the bottom input after it renders
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [])

  // Expose create trigger to parent
  useEffect(() => {
    if (triggerCreateRef) {
      triggerCreateRef.current = handleStartCreating
    }
  }, [triggerCreateRef, handleStartCreating])

  function handleCreateTodo() {
    const title = newTodoTitle.trim()
    if (!title) return

    createTodo.mutate(
      { listId, title, position: totalCount },
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
  if (totalCount === 0 && !isCreating) {
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
      <IncompleteTodoList listId={listId} />

      {/* Bottom button/input area — observed for visibility */}
      <div ref={bottomAreaRef}>
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
            onClick={handleStartCreating}
          >
            <Plus className="h-4 w-4" />
            {t('todos.newTodo')}
          </Button>
        )}
      </div>

      <CompletedTodoList listId={listId} />
    </div>
  )
}
